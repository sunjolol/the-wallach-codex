// tools/render_probe_omega.js — the omega / essential-fatty-acid group meter.
//
// Usage: node tools/render_probe_omega.js
//
// WHY THIS EXISTS. Before 2026-07-15 there was ZERO probe coverage for any omega:
// render_probe_entity hardcodes Calcium, render_probe_knowledge uses
// Magnesium/Dysprosium, and no probe named an omega at all. That blind spot let a
// real false positive ship green: `wallach_collective` was a DEAD alias in
// coverage.ts routing to the RARE-EARTH mineral meter, so the moment targets_derive
// emitted that kind for the omegas, seeding two plant-derived MINERAL products with
// zero fatty acids rendered OMEGA-3 and OMEGA-6 as "covered". Every invariant was
// green and both existing render probes passed, because neither asserts an omega.
//
// CASE 1 is therefore the load-bearing one: minerals must NOT cover the omegas.
// It is the regression test for a defect that actually shipped to disk.
//
// Wallach states ONE amount for the category (9 g/day, WAL-CLM-DDDL-000115); omega-3
// + omega-6 share that meter. omega-9 is not a member — he never names oleic acid an
// essential fatty acid — so it must never take a verdict from EFA intake.
const path = require('path');
const REPO = path.resolve(__dirname, '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

const OIL_MG_PER_SOFTGEL = 1000;  // Ultimate EFA Plus: 1 g of oil per softgel (label total_fat)
const GOAL_MG = 9000;             // Wallach's 9 g, unit-changed

// The dose multiplier MUST ride on label.servings. readScale (coverage.ts:374) tries
// overrides.scaling_factor -> item.scaling_factor -> label.servings, but
// RegimenItemSchema is a plain z.object() (NOT .passthrough()), so Zod STRIPS an
// item-level scaling_factor before readScale ever sees it — that candidate is
// unreachable by construction. RegimenLabelSchema IS .passthrough(), so
// label.servings survives. Two earlier cuts of this probe (item.servings, then
// item.scaling_factor) both graded every dose identically because the field was
// silently dropped — exactly the quiet no-op a probe exists to expose.
const item = (id, name, servings) => ({
  id, label: { name, nutrients: [], servings }, addedDate: '2026-07-15',
  provenance: 'user_manual',
});

// Minerals ONLY — zero essential fatty acids. The omegas must stay dark.
const SEED_MINERALS = { items: [
  item(9002, 'Plant Derived Minerals™', 1),
  item(9003, 'Majestic Earth® Mineral STX™', 1),
] };
// One softgel = 1000 mg = 11.1% of 9000 -> under the 30% partial floor -> 'gap'.
const SEED_EFA_1 = { items: [item(9101, 'Ultimate EFA Plus™ - 90 soft gels', 1)] };
// 6 softgels = 6000 mg = 66.7% -> 'partial'.
const SEED_EFA_6 = { items: [item(9101, 'Ultimate EFA Plus™ - 90 soft gels', 6)] };
// 9 softgels = 9000 mg = 100% -> 'covered'. This IS Wallach's dose: '9 grams per day in
// capsule form', taken 3 at a time t.i.d. per his divided-dose rule.
const SEED_EFA_9 = { items: [item(9101, 'Ultimate EFA Plus™ - 90 soft gels', 9)] };

async function run(browser, seed) {
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.evaluateOnNewDocument((s) => {
    // P3: clear first — this probe reuses ONE browser across 4 worlds, and the slot migration
    // now PERSISTS rgSlots_v1 on first read, so a prior world's slot would otherwise survive and
    // the next world would grade the stale stack (mirrors render_probe_pdm_presence.js).
    try { localStorage.clear(); localStorage.setItem('lcRegimen_v1', JSON.stringify(s)); }
    catch (e) { window.__seedErr = String(e); }
  }, seed);
  const url = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');
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
      o3: statusOf('OMEGA-3'), o6: statusOf('OMEGA-6'), o9: statusOf('OMEGA-9'),
      yttrium: statusOf('YTTRIUM'),
    };
  });
  await page.close();
  return { info, errs };
}

let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  PASS  ' : '  FAIL  ') + msg); if (!cond) fails++; };

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  // ── CASE 1 (load-bearing): minerals must NOT cover the omegas ────────────
  const m = await run(browser, SEED_MINERALS);
  console.log('MINERALS_ONLY', JSON.stringify(m.info));
  ok(m.info.o3 !== 'covered' && m.info.o3 !== 'partial',
     `omega-3 NOT lit by a mineral-only regimen (got '${m.info.o3}') — the rare-earth cross-wire`);
  ok(m.info.o6 !== 'covered' && m.info.o6 !== 'partial',
     `omega-6 NOT lit by a mineral-only regimen (got '${m.info.o6}')`);
  ok(m.info.yttrium === 'covered',
     `the rare-earth group still works (YTTRIUM '${m.info.yttrium}') — no regression from severing the alias`);
  ok(m.errs.length === 0, `no page errors (got ${m.errs.length})`);

  // ── CASE 2: the EFA meter grades a real EFA source ───────────────────────
  const one = await run(browser, SEED_EFA_1);
  const six = await run(browser, SEED_EFA_6);
  const nine = await run(browser, SEED_EFA_9);
  console.log('EFA_1  ', JSON.stringify(one.info));
  console.log('EFA_6  ', JSON.stringify(six.info));
  console.log('EFA_9  ', JSON.stringify(nine.info));
  const pct = n => Math.round((n * OIL_MG_PER_SOFTGEL / GOAL_MG) * 1000) / 10;
  ok(one.info.o3 === 'gap', `1 softgel = ${pct(1)}% -> omega-3 'gap' (got '${one.info.o3}')`);
  ok(six.info.o3 === 'partial', `6 softgels = ${pct(6)}% -> omega-3 'partial' (got '${six.info.o3}')`);
  ok(nine.info.o3 === 'covered', `9 softgels = ${pct(9)}% -> omega-3 'covered' — Wallach's dose exactly (got '${nine.info.o3}')`);

  // ── CASE 3: omega-3 and omega-6 SHARE one verdict (that is the point) ────
  ok(six.info.o3 === six.info.o6,
     `omega-3 and omega-6 share ONE verdict ('${six.info.o3}' vs '${six.info.o6}') — Wallach states one amount for both`);

  // ── CASE 4: omega-9 is not a member and never takes an EFA verdict ───────
  ok(nine.info.o9 !== 'partial' && nine.info.o9 !== 'gap',
     `omega-9 takes no EFA verdict at 9 softgels (got '${nine.info.o9}') — Wallach never names oleic acid an EFA`);

  await browser.close();
  console.log(fails ? `\n${fails} FAILURE(S)` : '\nPASS · the EFA group meter grades omega-3 + omega-6 as one group, and minerals do not touch them');
  process.exit(fails ? 1 : 0);
})();
