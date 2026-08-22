// tools/probes/render_probe_vanadium.js — vanadium's SECOND route (plant-derived vehicle).
//
// Usage: node tools/probes/render_probe_vanadium.js
//
// WHAT IT GUARDS. Vanadium carries its own sealed Wallach target (150 mcg/day,
// WAL-CLM-EPIGEN-000138) and several Youngevity products declare it outright, so it has always
// covered NUMERICALLY. On 2026-08-21 Luneth ruled that a plant-derived colloidal mineral bottle
// ALSO covers it: vanadium is on Wallach's own humic-shale roster (the same sealed verbatim
// table germanium cites, WAL-CLM-HELLS-000069) and on Youngevity's published 77-mineral Plant
// Derived Minerals composition roster.
//
// This is the TIN MODEL, not the germanium one. Vanadium keeps its number; the vehicle is an
// ADDITIONAL route, and state/coverage.ts takes the BETTER of the two verdicts. Both halves are
// asserted here, because deleting either one is a silent behaviour change:
//   B — a vehicle alone covers it, with nothing declaring vanadium at all
//   C — a declared 200 mcg still covers it, with no vehicle anywhere
//
// ★ CASE A IS THE NEGATIVE CONTROL. Neither route present -> VANADIUM must render EMPTY. If the
// vehicle branch ever starts firing unconditionally, A goes red. A probe that cannot reproduce
// the world before the change proves nothing.
//
// ★ CASE B IS ALSO THE BEFORE/AFTER. Before this ruling, B rendered '' — a PDM bottle moved
// vanadium by zero. B is the assertion that the ruling actually shipped.
//
// The HERO is deliberately NOT asserted here: a DOM probe is not a visual check. Vanadium's
// "hero": false is proven at the data layer (entity-page-data.json carries no group_record for
// it) and the page itself is for human eyes.

const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

// A: neither route. THE CONTROL — the world before the ruling, and the world with an empty stack.
const SEED_NONE = { items: [
  { id: 9401, label: { name: 'Vitamin C Tablet', nutrients: [{ name: 'Vitamin C', amount: 500, unit: 'mg' }] },
    addedDate: '2026-07-15', provenance: 'user_manual' },
] };

// B: a plant-derived vehicle ONLY. Nothing here declares vanadium by name.
const SEED_VEHICLE = { items: [
  { id: 9501, label: { name: 'Plant Derived Minerals™', nutrients: [] },
    addedDate: '2026-07-15', provenance: 'user_manual' },
  { id: 9502, label: { name: 'Majestic Earth® Mineral STX™', nutrients: [] },
    addedDate: '2026-07-15', provenance: 'user_manual' },
] };

// C: a declared amount ONLY, no vehicle. The numeric route must still stand on its own.
const SEED_NUMERIC = { items: [
  { id: 9601, label: { name: 'Scanned Vanadium Capsule', nutrients: [{ name: 'Vanadium', amount: 200, unit: 'mcg' }] },
    addedDate: '2026-07-15', provenance: 'user_scan' },
] };

const url = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');

async function run(browser, seed) {
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.evaluateOnNewDocument((s) => {
    try { localStorage.clear(); localStorage.setItem('lcRegimen_v1', JSON.stringify(s)); }
    catch (e) { window.__seedErr = String(e); }
  }, seed);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1800));
  const info = await page.evaluate(() => {
    const all = [...document.querySelectorAll('.tile,.tile--vitamin,.tile--amino,.tile--fat')];
    const statusOf = (nm) => {
      const t = all.find(x => (x.querySelector('.tile__name') || {}).textContent === nm);
      if (!t) return '(no tile)';
      return ['covered', 'partial', 'trace', 'gap', 'present'].find(s => t.classList.contains(s)) || '';
    };
    return {
      seedErr: window.__seedErr || null,
      VANADIUM: statusOf('VANADIUM'),
      TIN: statusOf('TIN'),
      GERMANIUM: statusOf('GERMANIUM'),
      CHROMIUM: statusOf('CHROMIUM'),
      SELENIUM: statusOf('SELENIUM'),
    };
  });
  await page.close();
  return { info, errs };
}

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const A = await run(browser, SEED_NONE);
  const B = await run(browser, SEED_VEHICLE);
  const C = await run(browser, SEED_NUMERIC);
  await browser.close();

  console.log('A_CONTROL_neither  ', JSON.stringify(A.info));
  console.log('B_vehicle_only     ', JSON.stringify(B.info));
  console.log('C_declared_only    ', JSON.stringify(C.info));

  const checks = [
    // ── the negative control ──
    // A numeric target with nothing delivering it renders 'gap', NOT empty: the tile is asking
    // to be closed. (Germanium renders empty instead because it states no amount to fall short
    // of -- that asymmetry is the whole reason it needed its own branch in classify().)
    ['A CONTROL: neither route -> VANADIUM gap, not covered', A.info.VANADIUM === 'gap'],
    ['A CONTROL: TIN gap too (its vehicle is absent as well)', A.info.TIN === 'gap'],
    ['A CONTROL: GERMANIUM empty — no amount to fall short of', A.info.GERMANIUM === ''],
    // ── the new route: a bottle alone covers it ──
    ['B: a plant-derived vehicle alone -> VANADIUM covered (the ruling shipped)', B.info.VANADIUM === 'covered'],
    ['B: TIN covered by the same vehicle (unchanged behaviour)', B.info.TIN === 'covered'],
    ['B: GERMANIUM covered by the same vehicle (unchanged behaviour)', B.info.GERMANIUM === 'covered'],
    ['B: the vehicle did NOT leak onto CHROMIUM (also on the roster, NOT ruled in)', B.info.CHROMIUM !== 'covered'],
    ['B: the vehicle did NOT leak onto SELENIUM (also on the roster)', B.info.SELENIUM !== 'covered'],
    // ── the numeric route still stands alone (tin model, not germanium's sole-route model) ──
    ['C: a declared 200 mcg alone -> VANADIUM covered, no vehicle needed', C.info.VANADIUM === 'covered'],
    ['C: TIN stays gap — a declared vanadium is not a vehicle', C.info.TIN === 'gap'],
    // ── hygiene ──
    ['no seed errors', !A.info.seedErr && !B.info.seedErr && !C.info.seedErr],
    ['no page errors', A.errs.length === 0 && B.errs.length === 0 && C.errs.length === 0],
  ];

  let bad = 0;
  for (const [name, ok] of checks) {
    console.log(`${ok ? 'PASS' : 'FAIL'} · ${name}`);
    if (!ok) bad++;
  }
  if (bad) { console.log(`\n${bad} CHECK(S) FAILED`); process.exit(1); }
  console.log('\nPASS · vanadium takes the BETTER of its two routes: a vehicle covers it, a declared amount covers it, neither leaves it empty');
})();
