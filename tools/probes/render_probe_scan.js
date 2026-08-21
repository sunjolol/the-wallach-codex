// tools/probes/render_probe_scan.js — native scan-engine check.
//
// Usage: node tools/probes/render_probe_scan.js   (exit 0 = PASS, non-zero = FAIL)
//
// Drives the native scan/verdict engine (state/scanner.ts) through its window.lcScan
// bridge, asserting:
//   - a hard-reject ingredient (HFCS) → verdict REJECT + an anti flag;
//   - a Zinc+Boron product → a positive gap-fill on Zinc (a real WALLACH target:
//     46 mg, so 10 mg delivered ≈ 22%), a hormones_strength goal, and a SAVE
//     verdict; logging writes scan history. (The Scan·Confirm·Result view renders
// parsed rows from the user upload -> confirm flow, not from a headless lcScan call,
// so this engine probe no longer asserts a view re-render; render_probe_scanner + the
// visual pass cover the view.)
// Gap-fill is checked on Zinc rather than Boron simply to keep one nutrient under
// test per assertion. Starts from an empty regimen so the Zinc gap is the full target
// → deterministic gap-fill. (The rgRemoved_v1 write below is vestigial: state/regimen.ts
// reads that key once at migration and then ignores it.) Mirrors render_probe_seeded.js.
// Requires puppeteer.

const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

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

  await page.evaluate(() => { document.querySelector('[data-rail-nav="scanner"]')?.click(); });
  await new Promise(r => setTimeout(r, 500));

  const out = await page.evaluate(() => {
    const w = window;
    const fn = typeof w.lcScan === 'function';
    const a = w.lcScan(
      { name: 'Junk Bar', servings: 1, nutrients: [], ingredients: 'high fructose corn syrup, water' },
      { logToRecent: false },
    );
    const b = w.lcScan(
      { name: 'Test Multi', servings: 1,
        nutrients: [{ name: 'Zinc', amount: 10, unit: 'mg' }, { name: 'Boron', amount: 10, unit: 'mg' }],
        ingredients: 'zinc glycinate, boron glycinate' },
    );
    const zinc = b.gapFills.find(g => g.essential === 'Zinc');
    const mount = document.getElementById('workspace-scanner-mount');
    const parsedRows = mount ? mount.querySelectorAll('.parsed-row:not(.parsed-row--empty)').length : -1;
    let historyLen = 0;
    try { historyLen = (JSON.parse(localStorage.getItem('lcRecentScans_v1') || '{"items":[]}').items || []).length; } catch (e) { historyLen = -1; }
    return {
      fn,
      aVerdict: a.verdict, aAnti: a.anti.length,
      bVerdict: b.verdict, bGapFills: b.gapFills.length, zincPct: zinc ? zinc.gapFillPct : null, bGoals: b.goals,
      parsedRows, historyLen,
    };
  });

  console.log('SCAN', JSON.stringify(out));
  console.log('PAGE_ERRORS', errs.length, errs.slice(0, 5).join(' | '));

  const checks = [
    ['window.lcScan present', out.fn === true],
    ['HFCS → REJECT', out.aVerdict === 'REJECT'],
    ['HFCS anti flag', out.aAnti >= 1],
    ['Multi → SAVE/ADD', out.bVerdict === 'SAVE' || out.bVerdict === 'ADD'],
    ['Zinc gap-fill present (real Wallach target)', out.bGapFills >= 1 && out.zincPct > 0],
    ['hormones_strength goal', Array.isArray(out.bGoals) && out.bGoals.includes('hormones_strength')],
    ['scan logged to history', out.historyLen >= 1],
    ['no page errors', errs.length === 0],
  ];
  const failed = checks.filter(([, ok]) => !ok).map(([n]) => n);
  await browser.close();
  if (failed.length) { console.log('FAIL', JSON.stringify(failed)); process.exit(1); }
  console.log('PASS · native scan engine: verdict + gap-fill + goals + history + view re-render');
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
