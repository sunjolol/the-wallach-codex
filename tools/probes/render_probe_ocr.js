// tools/probes/render_probe_ocr.js — native OCR-parser check.
//
// Usage: node tools/probes/render_probe_ocr.js   (exit 0 = PASS, non-zero = FAIL)
//
// Exercises the label PARSER in isolation — the bulk of the OCR port — by
// feeding raw OCR text straight to window.lcParseLabel (no Tesseract/WASM), then
// asserting the resulting ScanLabel:
//   - nutrition-panel lines → nutrients (Vitamin C / Calcium / Magnesium / Zinc);
//   - an INGREDIENTS: line → the ingredients string;
//   - a "fl oz" mention → container hint → label.name.
// Then runs the parsed label through window.lcScan to confirm the parser feeds
// the native verdict engine end-to-end. Starts from an empty regimen so the
// gap-fills are deterministic. (The rgRemoved_v1 write below is vestigial:
// state/regimen.ts reads that key once at migration and then ignores it.)
// Mirrors render_probe_scan.js.
// Requires puppeteer. A real-OCR (image→text) smoke is intentionally NOT here —
// it would load the 22MB WASM headless; this probe asserts the parsing logic.

const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

const OCR_TEXT = [
  'HEALTHY GREENS SUPPLEMENT',
  'Net 12 fl oz',
  'SUPPLEMENT FACTS',
  'Serving Size 1 serving',
  'Vitamin C 45 mg',
  'Calcium 20 mg',
  'Magnesium 40 mg',
  'Zinc 15 mg',
  'INGREDIENTS: Ascorbic Acid, Calcium Citrate, Magnesium Glycinate, Zinc Picolinate, Cellulose, Gelatin.',
].join('\n');

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));

  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem('rgRemoved_v1', JSON.stringify([-1, -2, -3])); }
    catch (e) { window.__seedErr = String(e); }
  });

  const url = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.log('GOTO_ERR', e.message));
  await new Promise(r => setTimeout(r, 1500));

  const out = await page.evaluate((text) => {
    const w = window;
    const parseFn = typeof w.lcParseLabel === 'function';
    const scanFn = typeof w.lcScan === 'function';
    if (!parseFn) { return { parseFn, scanFn }; }
    const label = w.lcParseLabel(text);
    const names = (label.nutrients || []).map(n => String(n.name).toLowerCase());
    const has = needle => names.some(n => n.includes(needle));
    const result = scanFn ? w.lcScan(label, { logToRecent: false }) : null;
    return {
      parseFn,
      scanFn,
      name: label.name,
      nutrientCount: (label.nutrients || []).length,
      hasVitC: has('vitamin c'),
      hasCalcium: has('calcium'),
      hasMagnesium: has('magnesium'),
      hasZinc: has('zinc'),
      ingredientsLen: (label.ingredients || '').length,
      ingredientsHasCitrate: (label.ingredients || '').toLowerCase().includes('citrate'),
      verdict: result ? result.verdict : null,
      gapFills: result ? result.gapFills.length : -1,
    };
  }, OCR_TEXT);

  console.log('OCR', JSON.stringify(out));
  console.log('PAGE_ERRORS', errs.length, errs.slice(0, 5).join(' | '));

  const checks = [
    ['window.lcParseLabel present', out.parseFn === true],
    ['window.lcScan present', out.scanFn === true],
    ['container hint → name', out.name === 'aluminum_can'],
    ['>= 4 nutrients parsed', out.nutrientCount >= 4],
    ['Vitamin C parsed', out.hasVitC === true],
    ['Calcium parsed', out.hasCalcium === true],
    ['Magnesium parsed', out.hasMagnesium === true],
    ['Zinc parsed', out.hasZinc === true],
    ['ingredients extracted', out.ingredientsHasCitrate === true && out.ingredientsLen > 8],
    ['parsed label scores a verdict', out.verdict === 'ADD' || out.verdict === 'SAVE' || out.verdict === 'REJECT'],
    ['gap-fills produced', out.gapFills >= 1],
    ['no page errors', errs.length === 0],
  ];
  const failed = checks.filter(([, ok]) => !ok).map(([n]) => n);
  await browser.close();
  if (failed.length) { console.log('FAIL', JSON.stringify(failed)); process.exit(1); }
  console.log('PASS · native OCR parser: nutrition panel + ingredients + container hint → ScanLabel → verdict');
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
