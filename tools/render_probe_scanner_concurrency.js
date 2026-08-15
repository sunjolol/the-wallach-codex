// tools/render_probe_scanner_concurrency.js — regression gate for the "Reading the
// label…" forever hang (fixed 2026-08-14).
//
// Usage: node tools/render_probe_scanner_concurrency.js   (exit 0 = PASS, non-zero = FAIL)
//
// Two image inputs fired together (an upload and a paste) used to (1) spawn two OCR
// pipelines and (2) both inject the Tesseract <script>, re-running the UMD and wedging
// the in-flight worker so recognize() never settled — the Scan step hung on "Reading the
// label…" forever, no error. The view now runs LAST-WINS (the newest image supersedes any
// in-flight scan). Asserts on the REAL file:// app:
//   A. one OCR worker from two tight-together inputs, the single scan reaches Confirm, and
//      the LAST input (the paste) is the one that wins the view — never a stuck pipeline;
//   B. two concurrent window.lcScanImage() calls inject exactly ONE tesseract.min.js
//      (loadTesseract shares one in-flight promise).
// Mirrors render_probe_scanner.js. Requires puppeteer + the built dashboard.

const path = require('path');
const REPO = path.resolve(__dirname, '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

const URL = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');
const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function gotoScanner(page) {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.log('GOTO_ERR', e.message));
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => { document.querySelector('[data-rail-nav="scanner"]')?.click(); });
  await new Promise(r => setTimeout(r, 600));
}

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  // ── A · last-wins + one worker (stubbed OCR, deterministic) ──────────────────────
  const pageA = await browser.newPage();
  const errA = [];
  pageA.on('pageerror', e => errA.push(e.message));
  await gotoScanner(pageA);

  await pageA.evaluate((b64) => {
    window.__ocrWorkers = 0;
    window.__ocrResolvers = [];
    window.Tesseract = {
      createWorker: async () => {
        window.__ocrWorkers++;
        return {
          setParameters: async () => {},
          recognize: () => new Promise((res) => {
            window.__ocrResolvers.push(() => res({ data: { text:
              'SUPPLEMENT FACTS\nVitamin C 90 mg\nZinc 11 mg\nINGREDIENTS: Ascorbic Acid, Zinc Picolinate, Cellulose.' } }));
          }),
          terminate: async () => {},
        };
      },
    };
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const mk = n => new File([bytes], n, { type: 'image/png' });
    const mount = document.getElementById('workspace-scanner-mount');
    const dt = new DataTransfer(); dt.items.add(mk('upload.png'));
    mount.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
    const dt2 = new DataTransfer(); dt2.items.add(mk('paste.png'));
    document.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt2, bubbles: true }));
  }, PNG_B64);
  await new Promise(r => setTimeout(r, 700));

  const a = await pageA.evaluate(() => ({ workers: window.__ocrWorkers }));
  await pageA.evaluate(() => (window.__ocrResolvers || []).forEach(fn => fn()));
  await new Promise(r => setTimeout(r, 700));
  const aAfter = await pageA.evaluate(() => {
    const m = document.getElementById('workspace-scanner-mount');
    const f = m.querySelector('.vd-scan__file');
    return { confirm: m.querySelectorAll('.vd-step--hero').length > 0, winner: f ? f.textContent.trim() : null };
  });

  // ── B · load idempotency (real engine, count injected <script> tags) ─────────────
  const pageB = await browser.newPage();
  await gotoScanner(pageB);
  await pageB.evaluate((b64) => {
    const url = 'data:image/png;base64,' + b64;
    const swallow = () => {};
    if (typeof window.lcScanImage === 'function') {
      window.lcScanImage(url).catch(swallow);
      window.lcScanImage(url).catch(swallow);
    }
  }, PNG_B64);
  await new Promise(r => setTimeout(r, 450));
  const scriptTags = await pageB.evaluate(() =>
    document.querySelectorAll('script[src*="tesseract.min.js"]').length);

  console.log('A', JSON.stringify({ workers: a.workers, reachesConfirm: aAfter.confirm, winner: aAfter.winner }));
  console.log('A_PAGE_ERRORS', errA.length, errA.slice(0, 5).join(' | '));
  console.log('B_IDEMPOTENCY', JSON.stringify({ scriptTags }));

  const checks = [
    ['A · exactly one OCR worker from two tight-together inputs', a.workers === 1],
    ['A · the scan reaches Confirm on resolve', aAfter.confirm === true],
    ['A · last input wins (newest scan owns the view)', aAfter.winner === 'paste.png'],
    ['A · no page errors', errA.length === 0],
    ['B · exactly one tesseract.min.js injected', scriptTags === 1],
  ];
  const failed = checks.filter(([, ok]) => !ok).map(([n]) => n);
  await browser.close();
  if (failed.length) { console.log('FAIL', JSON.stringify(failed)); process.exit(1); }
  console.log('PASS · scanner concurrency: last-wins · one worker · one Tesseract injection · no hang');
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
