// tools/render_probe_adopt.js — adopt scanned product → regimen → coverage (Chunk 6d).
//
// Usage: node tools/render_probe_adopt.js   (exit 0 = PASS, non-zero = FAIL)
//
// Drives the core value path: scan a label, click the product-level
// "ADD TO REGIMEN" action on the verdict card, and assert that
//   - the scanned product lands in rgManualItems_v1 (provenance 'user_scanned');
//   - the verdict button confirms (text + disabled);
//   - covered tiles on the Coverage surface increase (the §31 saveRgManual →
//     regimen:changed → coverage recompute cascade).
// Seeds an empty regimen (HBSP base hidden) so the coverage delta is clean.
// Mirrors render_probe_scan.js. Requires puppeteer.

const path = require('path');
const REPO = path.resolve(__dirname, '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

const PRODUCT = {
  name: 'Test Adopt Multi',
  servings: 1,
  nutrients: [
    { name: 'Vitamin C', amount: 1200, unit: 'mg' },
    { name: 'Calcium', amount: 1600, unit: 'mg' },
    { name: 'Magnesium', amount: 800, unit: 'mg' },
    { name: 'Zinc', amount: 50, unit: 'mg' },
    { name: 'Vitamin D', amount: 2400, unit: 'iu' },  // 2400 IU x0.025 = 60 mcg > 50 mcg target: exercises the IU->mcg fix
    { name: 'Selenium', amount: 400, unit: 'mcg' },
  ],
  ingredients: 'ascorbic acid, calcium citrate, magnesium glycinate, zinc picolinate',
};

const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));

  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem('rgRemoved_v1', JSON.stringify([-1, -2, -3]));
      localStorage.removeItem('rgManualItems_v1');
    }
    catch (e) { window.__seedErr = String(e); }
  });

  const url = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.log('GOTO_ERR', e.message));
  await wait(1500);

  const coveredCount = () => page.evaluate(() => {
    const root = document.getElementById('workspace-coverage-mount');
    return root ? root.querySelectorAll('.tile.covered, .tile--vitamin.covered, .tile--amino.covered, .tile--fat.covered').length : -1;
  });

  // Default lands on Coverage — capture the baseline covered-tile count.
  const baselineCovered = await coveredCount();

  // Go to Scanner and score the product.
  await page.evaluate(() => { document.querySelector('[data-rail-nav="scanner"]')?.click(); });
  await wait(400);
  const scan = await page.evaluate((label) => {
    const w = window;
    if (typeof w.lcScan !== 'function') { return { scanFn: false }; }
    w.lcScan(label);
    return { scanFn: true };
  }, PRODUCT);
  await wait(400);

  // Click the product-level ADD TO REGIMEN action and read the result.
  const adopt = await page.evaluate(() => {
    const before = JSON.parse(localStorage.getItem('rgManualItems_v1') || '[]').length;
    const btn = document.querySelector('#workspace-scanner-mount [data-sc-action="adopt-product"]');
    const btnFound = btn !== null;
    if (btnFound) { btn.click(); }
    const after = JSON.parse(localStorage.getItem('rgManualItems_v1') || '[]');
    const last = after[after.length - 1] || null;
    return {
      btnFound,
      before,
      after: after.length,
      provenance: last ? last.provenance : null,
      adoptedName: last ? (last.label && last.label.name) : null,
      btnText: btnFound ? btn.textContent.trim() : null,
      btnDisabled: btnFound ? btn.disabled === true : null,
    };
  });
  await wait(300);

  // Back to Coverage — the cascade should have moved covered tiles up.
  await page.evaluate(() => { document.querySelector('[data-rail-nav="coverage"]')?.click(); });
  await wait(500);
  const afterCovered = await coveredCount();

  const out = { ...scan, ...adopt, baselineCovered, afterCovered };
  console.log('ADOPT', JSON.stringify(out));
  console.log('PAGE_ERRORS', errs.length, errs.slice(0, 5).join(' | '));

  const checks = [
    ['window.lcScan present', out.scanFn === true],
    ['adopt button found', out.btnFound === true],
    ['manual stack +1', out.after === out.before + 1 && out.after === 1],
    ['provenance user_scanned', out.provenance === 'user_scanned'],
    ['adopted product name', out.adoptedName === 'Test Adopt Multi'],
    ['button confirms', out.btnText === '✓ ADDED TO REGIMEN' && out.btnDisabled === true],
    ['covered tiles increased', out.afterCovered > out.baselineCovered && out.baselineCovered >= 0],
    ['no page errors', errs.length === 0],
  ];
  const failed = checks.filter(([, ok]) => !ok).map(([n]) => n);
  await browser.close();
  if (failed.length) { console.log('FAIL', JSON.stringify(failed)); process.exit(1); }
  console.log('PASS · adopt scanned product → §31 saveRgManual (user_scanned) → coverage moves');
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
