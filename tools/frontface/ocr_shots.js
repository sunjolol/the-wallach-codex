/**
 * Independent OCR pass over the epigenetics / immortality page captures.
 *
 * WHY: those two books have no PDF text layer, so the corroboration method that works for the three
 * PDF-backed books (diff our .txt against a SECOND independent OCR of the same page) has nothing to
 * diff against. Tesseract supplies that second pass. The captures are DIGITAL EBOOK RENDERS, not
 * scans -- crisp glyphs, no skew -- so OCR of them is accurate enough to be a useful instrument.
 *
 * It runs entirely offline from the vendored Tesseract.js the dashboard already ships
 * (assets/vendor/tesseract) -- no network, per the project's offline mandate.
 *
 * This is a TRIAGE instrument, never truth. Where it disagrees with our text, the page image is the
 * arbiter, exactly as with the PDF text layer.
 */
const fs = require('fs');
const path = require('path');

const REPO = 'C:/Users/Light/Desktop/claude/health expert';
const VEND = REPO + '/dashboard/assets/vendor/tesseract';
const pup = require(REPO + '/node_modules/puppeteer');

const [, , SRC_DIR, OUT_JSON, FROM, TO] = process.argv;

const files = fs.readdirSync(SRC_DIR)
  .filter(f => /^Screenshot \(\d+\)\.png$/.test(f))
  .sort((a, b) => (+a.match(/\d+/)[0]) - (+b.match(/\d+/)[0]))
  .slice(FROM ? +FROM : 0, TO ? +TO : undefined);

const HOST_HTML = __dirname + '/ocrhost.html';

(async () => {
  const browser = await pup.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files'],
  });
  const page = await browser.newPage();
  page.on('console', m => { if (/error|fail/i.test(m.text())) console.error('  [page]', m.text()); });
  // A file:// HOST page (not setContent/about:blank) -- the worker, wasm core and lang-data are all
  // loaded over file://, which Chrome only permits from a file:// origin with the flag above.
  await page.goto('file:///' + HOST_HTML.split('\\').join('/'));
  await page.addScriptTag({ content: fs.readFileSync(VEND + '/tesseract.min.js', 'utf-8') });
  await page.waitForFunction('typeof Tesseract !== "undefined"', { timeout: 60000 });

  await page.evaluate(async (vend) => {
    const base = 'file:///' + vend.replace(/ /g, '%20');
    window.__worker = await Tesseract.createWorker('eng', 1, {
      workerPath: base + '/worker.min.js',
      corePath: base + '/',
      langPath: base + '/lang-data',
      gzip: true,
    });
  }, VEND);

  const out = {};
  let n = 0;
  for (const f of files) {
    const b64 = fs.readFileSync(path.join(SRC_DIR, f)).toString('base64');
    try {
      const text = await page.evaluate(async (b) => {
        // Crop to the book region: the capture is a 3840x1080 DUAL-MONITOR frame in which the book
        // occupies x = 0.028..0.48 (the rest is a Claude Code window). Upscale 2x -- Tesseract's
        // accuracy falls off sharply below ~20px glyph height and these render at ~11px.
        const img = new Image();
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/png;base64,' + b; });
        // Each capture is a TWO-PAGE SPREAD, so it must be OCR'd as two SEPARATE pages. Fed whole,
        // Tesseract reads line-wise ACROSS the gutter and splices left-page line N onto right-page
        // line N -- the same cross-column failure that produced the `Pharma-|Need` table defect.
        // The gutter sits at x = 0.2506 of the frame (measured off Screenshot (346)).
        const cuts = [[0.028, 0.2506], [0.2506, 0.48]];
        const S = 2;
        let text = '';
        for (const [f0, f1] of cuts) {
          const x0 = Math.round(img.width * f0), x1 = Math.round(img.width * f1);
          const w = x1 - x0, h = img.height;
          const c = document.createElement('canvas');
          c.width = w * S; c.height = h * S;
          const cx = c.getContext('2d');
          cx.imageSmoothingQuality = 'high';
          cx.drawImage(img, x0, 0, w, h, 0, 0, w * S, h * S);
          const r = await window.__worker.recognize(c);
          text += r.data.text + '\n';
        }
        return text;
      }, b64);
      out[f] = text;
    } catch (e) {
      out[f] = null;
      console.error('  FAILED', f, e.message);
    }
    if (++n % 10 === 0) console.log(`  ${n}/${files.length}`);
  }
  fs.writeFileSync(OUT_JSON, JSON.stringify(out, null, 1), 'utf-8');
  console.log(`wrote ${Object.keys(out).length} pages -> ${OUT_JSON}`);
  await browser.close();
})();
