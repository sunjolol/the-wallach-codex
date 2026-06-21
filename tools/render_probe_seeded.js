// tools/render_probe_seeded.js — seeded-regimen coverage classifier check.
//
// Usage: node tools/render_probe_seeded.js
//
// Companion to tools/render_probe.js (which checks the EMPTY-regimen render).
// This one seeds localStorage `lcRegimen_v1` with a known one-item regimen
// BEFORE the dashboard boots, then asserts the live coverage classifier
// (state/coverage.ts — the native port of legacy classifyLive/computeLiveCoverage)
// lights up all three buckets correctly:
//
//   Vitamin C  2000 mg  -> covered  (numeric, >= 0.95 * Wallach low)
//   Boron         3 mg  -> partial  (numeric, ~43% of the 7 mg target)
//   Aluminum   0.05 mg  -> trace    (trace_pdm + a PDM vehicle in the source name)
//
// The seed item is named "Beyond Tangy Tangerine 2.5" so it matches the PDM
// aggregate-vehicle regex (DOCT-02). Exits non-zero on any mismatch so it can
// gate the build->test loop. Requires puppeteer (in node_modules).

const path = require('path');
const REPO = path.resolve(__dirname, '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

const SEED = { items: [{
  id: 9001,
  label: { name: 'Beyond Tangy Tangerine 2.5', nutrients: [
    { name: 'Vitamin C', amount: 2000, unit: 'mg' },
    { name: 'Boron', amount: 3, unit: 'mg' },
    { name: 'Aluminum', amount: 0.05, unit: 'mg' },
  ] },
  addedDate: '2026-06-21',
  provenance: 'user_manual',
}] };

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));

  await page.evaluateOnNewDocument((seed) => {
    try { localStorage.setItem('lcRegimen_v1', JSON.stringify(seed)); }
    catch (e) { window.__seedErr = String(e); }
  }, SEED);

  const url = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.log('GOTO_ERR', e.message));
  await new Promise(r => setTimeout(r, 1800));

  const info = await page.evaluate(() => {
    const all = [...document.querySelectorAll('.tile,.tile--vitamin,.tile--amino,.tile--fat')];
    const cls = s => all.filter(t => t.classList.contains(s)).length;
    const statusOf = (nm) => {
      const t = all.find(x => (x.querySelector('.tile__name') || {}).textContent === nm);
      if (!t) return '(no tile)';
      return ['covered', 'partial', 'trace', 'gap'].find(s => t.classList.contains(s)) || '';
    };
    return {
      seedErr: window.__seedErr || null,
      seeded: !!localStorage.getItem('lcRegimen_v1'),
      coveredStat: (document.querySelector('.coverage-stat__num') || {}).textContent,
      covered: cls('covered'), partial: cls('partial'), trace: cls('trace'), gap: cls('gap'),
      VitaminC: statusOf('ASCORBIC'), Boron: statusOf('BORON'), Aluminum: statusOf('ALUMIN.'),
    };
  });

  console.log('SEEDED', JSON.stringify(info));
  console.log('PAGE_ERRORS', pageErrors.length, pageErrors.slice(0, 2).join(' | '));

  const checks = [
    ['seeded localStorage', info.seeded === true],
    ['no seed error', info.seedErr === null],
    ['Vitamin C covered', info.VitaminC === 'covered'],
    ['Boron partial', info.Boron === 'partial'],
    ['Aluminum trace', info.Aluminum === 'trace'],
    ['coveredStat >= 2', Number(info.coveredStat) >= 2],
    ['no page errors', pageErrors.length === 0],
  ];
  const failed = checks.filter(([, ok]) => !ok).map(([n]) => n);
  await browser.close();
  if (failed.length) { console.log('FAIL', JSON.stringify(failed)); process.exit(1); }
  console.log('PASS · classifier lights covered + partial + trace correctly');
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
