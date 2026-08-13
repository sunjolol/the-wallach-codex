// tools/render_probe_adopt.js — adopt scanned product → regimen → coverage (Chunk 6d).
//
// Usage: node tools/render_probe_adopt.js   (exit 0 = PASS, non-zero = FAIL)
//
// Drives the core value path: score a label with the native engine, then fire the
// SAME §31 cascade the Scan·Confirm·Result "Add to regimen" button fires —
// saveRgManual() with a provenance:'user_scanned' item — and assert that
//   - the scanned product lands in the active slot inside rgSlots_v1 (user_scanned);
//   - covered tiles on the Coverage surface increase (§31 saveRgManual →
//     regimen:changed → coverage recompute cascade).
// The 2026-08-13 port drives adopt from a real upload→OCR→confirm→result flow a
// headless probe cannot reach (local OCR), so this exercises the cascade via the
// engine bridge (window.saveRgManual), mirroring render_probe_scan's use of lcScan.
// Seeds an empty regimen (HBSP base hidden) so the coverage delta is clean. Requires puppeteer.

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
    { name: 'Vitamin D', amount: 2400, unit: 'iu' },
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

  const baselineCovered = await coveredCount();

  await page.evaluate(() => { document.querySelector('[data-rail-nav="scanner"]')?.click(); });
  await wait(400);
  const scan = await page.evaluate((label) => {
    const w = window;
    if (typeof w.lcScan !== 'function') { return { scanFn: false }; }
    w.lcScan(label);
    return { scanFn: true };
  }, PRODUCT);
  await wait(300);

  const adopt = await page.evaluate((label) => {
    const activeItems = () => {
      const doc = JSON.parse(localStorage.getItem('rgSlots_v1') || 'null');
      if (!doc || !Array.isArray(doc.slots)) { return []; }
      const active = doc.slots.find(s => s.id === doc.activeSlot);
      return active ? active.items : [];
    };
    const before = activeItems().length;
    const bridge = typeof window.saveRgManual === 'function';
    if (bridge) {
      // Mirror views/scanner.ts adopt: a user_scanned item through the §31 chokepoint.
      const item = { id: Date.now(), label: { name: label.name, nutrients: label.nutrients }, addedDate: new Date().toISOString().slice(0, 10), provenance: 'user_scanned' };
      window.saveRgManual([item]);
    }
    const after = activeItems();
    const last = after[after.length - 1] || null;
    return {
      bridge, before, after: after.length,
      provenance: last ? last.provenance : null,
      adoptedName: last ? (last.label && last.label.name) : null,
    };
  }, PRODUCT);
  await wait(300);

  await page.evaluate(() => { document.querySelector('[data-rail-nav="coverage"]')?.click(); });
  await wait(500);
  const afterCovered = await coveredCount();

  const out = { ...scan, ...adopt, baselineCovered, afterCovered };
  console.log('ADOPT', JSON.stringify(out));
  console.log('PAGE_ERRORS', errs.length, errs.slice(0, 5).join(' | '));

  const checks = [
    ['window.lcScan present', out.scanFn === true],
    ['saveRgManual §31 bridge present', out.bridge === true],
    ['active slot +1', out.after === out.before + 1 && out.after === 1],
    ['provenance user_scanned', out.provenance === 'user_scanned'],
    ['adopted product name', out.adoptedName === 'Test Adopt Multi'],
    ['covered tiles increased', out.afterCovered > out.baselineCovered && out.baselineCovered >= 0],
    ['no page errors', errs.length === 0],
  ];
  const failed = checks.filter(([, ok]) => !ok).map(([n]) => n);
  await browser.close();
  if (failed.length) { console.log('FAIL', JSON.stringify(failed)); process.exit(1); }
  console.log('PASS · adopt scanned product → §31 saveRgManual (user_scanned) → coverage moves');
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
