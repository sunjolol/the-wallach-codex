// tools/probes/render_probe_pdm_presence.js — the PLANT DERIVED presence floor (channel 2).
//
// Usage: node tools/probes/render_probe_pdm_presence.js
//
// WHAT IT GUARDS. The 34 PLANT DERIVED minerals carry no individual Wallach dose — his dose is
// of the BOTTLE ("Liquid Plant Derived Coloidal Minerals One Ounce/ 100 pounds/day",
// WAL-CLM-EPIGEN-000089), so the group is scored Σ(vehicle mg) / 924 mg. But a user can SCAN an
// item naming ONE of the 34 with an exact amount ("Cerium 2 mg"). That moves the vehicle meter by
// zero — correctly, a cerium capsule is not a plant-derived vehicle — and without a presence
// floor the tile therefore renders EMPTY. A lie of omission: the user is getting cerium.
//
// classify() now applies a PRESENCE FLOOR. Three properties, each asserted below:
//   1. FLOOR FIRES     — scanned cerium, no vehicle  -> CERIUM 'present'
//   2. CEILING HOLDS   — 'present' is the ceiling; a named element can NEVER reach 'covered',
//                        because Wallach states no individual amount (§00.A).
//   3. METER WINS      — with a vehicle in the stack, the measured group ratio outranks the
//                        unmeasurable "you have some": CERIUM follows the group, not the floor.
//
// ★ CASE A IS THE NEGATIVE CONTROL AND IT IS THE POINT. It re-runs the pre-fix world (no cerium
// scan) and asserts CERIUM === ''. If the floor ever starts firing unconditionally, case A goes
// red. A test that cannot reproduce the bug it guards proves nothing.

const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

// A: no cerium, no vehicle — the pre-fix world. THE CONTROL.
const SEED_NONE = { items: [
  { id: 9101, label: { name: 'Vitamin C Tablet', nutrients: [{ name: 'Vitamin C', amount: 500, unit: 'mg' }] },
    addedDate: '2026-07-15', provenance: 'user_manual' },
] };

// B: a scanned single rare earth, NO vehicle. The floor must fire, for CERIUM ONLY.
const SEED_CERIUM = { items: [
  { id: 9201, label: { name: 'Scanned Cerium Capsule', nutrients: [{ name: 'Cerium', amount: 2, unit: 'mg' }] },
    addedDate: '2026-07-15', provenance: 'user_scan' },
] };

// C: the same scan PLUS a real vehicle (2 x 600 mg = 1200 mg >= 0.95 * 924). The measured group
// verdict must win — cerium goes 'covered' WITH the other 33, not 'present'.
const SEED_BOTH = { items: [
  { id: 9301, label: { name: 'Scanned Cerium Capsule', nutrients: [{ name: 'Cerium', amount: 2, unit: 'mg' }] },
    addedDate: '2026-07-15', provenance: 'user_scan' },
  { id: 9302, label: { name: 'Plant Derived Minerals™', nutrients: [] },
    addedDate: '2026-07-15', provenance: 'user_manual' },
  { id: 9303, label: { name: 'Majestic Earth® Mineral STX™', nutrients: [] },
    addedDate: '2026-07-15', provenance: 'user_manual' },
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
      CERIUM: statusOf('CERIUM'), YTTRIUM: statusOf('YTTRIUM'), GOLD: statusOf('GOLD'),
      present: all.filter(t => t.classList.contains('present')).length,
    };
  });
  await page.close();
  return { info, errs };
}

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const A = await run(browser, SEED_NONE);
  const B = await run(browser, SEED_CERIUM);
  const C = await run(browser, SEED_BOTH);
  await browser.close();

  console.log('A_CONTROL_no_cerium ', JSON.stringify(A.info));
  console.log('B_scanned_cerium    ', JSON.stringify(B.info));
  console.log('C_cerium_plus_vehicle', JSON.stringify(C.info));

  const checks = [
    // ── the negative control: the pre-fix world must still render empty ──
    ['A CONTROL: no cerium scan -> CERIUM empty (the bug this guards)', A.info.CERIUM === ''],
    ['A CONTROL: nothing else drifted present', A.info.present === 0],
    // ── the floor fires, and ONLY for the named element ──
    ['B: scanned cerium -> CERIUM present', B.info.CERIUM === 'present'],
    ['B: the floor is PER-ELEMENT — YTTRIUM stays empty', B.info.YTTRIUM === ''],
    ['B: GOLD stays empty too', B.info.GOLD === ''],
    ['B: exactly ONE tile lifted', B.info.present === 1],
    // ── the ceiling: a named element can never buy 'covered' ──
    ['B: CERIUM did NOT reach covered (§00.A — no individual Wallach amount)', B.info.CERIUM !== 'covered'],
    // ── the measured meter outranks the unmeasurable floor ──
    ['C: with a vehicle, the group verdict WINS -> CERIUM covered', C.info.CERIUM === 'covered'],
    ['C: cerium follows the group, not the floor', C.info.CERIUM !== 'present'],
    ['C: YTTRIUM covered by the same shared verdict', C.info.YTTRIUM === 'covered'],
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
  console.log('\nPASS · the PLANT DERIVED presence floor: fires per-element, never reaches covered, and yields to the measured group meter');
})();
