// tools/render_probe_seeded.js — seeded-regimen coverage classifier check.
//
// Usage: node tools/render_probe_seeded.js
//
// Companion to tools/render_probe.js (which checks the EMPTY-regimen render).
// This one seeds localStorage `lcRegimen_v1` with a known regimen BEFORE the
// dashboard boots, then asserts the live coverage classifier (state/coverage.ts)
// lights up every status bucket correctly against the WALLACH-ONLY targets:
//
//   Vitamin C  2000 mg  -> covered  (numeric, >= 0.95 * Wallach low 1000 mg)
//   Zinc         10 mg  -> gap      (numeric, ~22% of the Wallach UPPER 46 mg, 154 lb)
//   Boron         3 mg  -> partial  (numeric, ~33% of the Wallach UPPER 9.2 mg, 154 lb)
//   Aluminum / Yttrium  -> covered  (trace_pdm: the 33 rare-earths share ONE verdict
//                                     from the plant-derived-mineral aggregate —
//                                     Σ vehicle mg / the 924 mg goal; here 1200 mg
//                                     (Plant Derived Minerals 600 mg x2) >= 0.95*924)
//
// The trace/rare aggregate (pdm-coverage-data.json) matches a regimen item to its
// vehicle mg by EXACT canonical name, so the second seed item uses the pillar name
// "Plant Derived Minerals(TM)". Exits non-zero on any mismatch. Requires puppeteer.

const path = require('path');
const REPO = path.resolve(__dirname, '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

const SEED = { items: [
  {
    id: 9001,
    label: { name: 'Beyond Tangy Tangerine 2.5', nutrients: [
      { name: 'Vitamin C', amount: 2000, unit: 'mg' },
      { name: 'Zinc', amount: 10, unit: 'mg' },
      { name: 'Boron', amount: 3, unit: 'mg' },
    ] },
    addedDate: '2026-06-21',
    provenance: 'user_manual',
  },
  {
    // EXACT pillar canonical names so the trace/rare aggregate fires. Two 600 mg PDM
    // sources => 1200 mg >= 0.95 * 924 => the whole 33-mineral group goes covered.
    // (One 600 mg serving alone is ~65% = partial — the honest per-serving behavior.)
    id: 9002,
    label: { name: 'Plant Derived Minerals™', nutrients: [] },
    addedDate: '2026-06-21',
    provenance: 'user_manual',
  },
  {
    id: 9003,
    label: { name: 'Majestic Earth® Mineral STX™', nutrients: [] },
    addedDate: '2026-06-21',
    provenance: 'user_manual',
  },
] };

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));

  // The seeded items ARE the whole stack: the HBSP base foundation was removed
  // 2026-07-14, so there is no longer a base layer to hide (this used to write
  // rgRemoved_v1 = [-1,-2,-3] to suppress the pre-applied seed).
  await page.evaluateOnNewDocument((seed) => {
    try {
      localStorage.setItem('lcRegimen_v1', JSON.stringify(seed));
    }
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
      return ['covered', 'partial', 'trace', 'gap', 'present'].find(s => t.classList.contains(s)) || '';
    };
    return {
      seedErr: window.__seedErr || null,
      seeded: !!localStorage.getItem('lcRegimen_v1'),
      // The COVERED count now comes from the LEDGER, not a hero stat.
      // ★ WHY THIS MOVED (2026-07-16, the live Coverage build): this read
      // `.coverage-stat__num` — the big "N / 90" headline. Demo D DELETED that stat
      // deliberately: "covered" is four incommensurable regimes (wallach 38 · trace_pdm 33 ·
      // dietary_with_clinical_lever 13 · dietary 3 …), so one fraction printed a count of
      // four different kinds of thing as a single number, twice, 200px apart. The
      // DISTRIBUTION (the ledger) replaces the ratio. Same fact, live element — the
      // assertion below is unchanged and still fires on the same threshold.
      coveredStat: (document.querySelector('.ledger__item .ledger__n') || {}).textContent,
      covered: cls('covered'), partial: cls('partial'), trace: cls('trace'), gap: cls('gap'),
      VitaminC: statusOf('ASCORBIC ACID'), Zinc: statusOf('ZINC'),
      Boron: statusOf('BORON'), Aluminum: statusOf('ALUMINUM'), Yttrium: statusOf('YTTRIUM'),
    };
  });

  console.log('SEEDED', JSON.stringify(info));
  console.log('PAGE_ERRORS', pageErrors.length, pageErrors.slice(0, 2).join(' | '));

  const checks = [
    ['seeded localStorage', info.seeded === true],
    ['no seed error', info.seedErr === null],
    ['Vitamin C covered (>= 0.95 * Wallach 1000mg)', info.VitaminC === 'covered'],
    ['Zinc gap (~22% of Wallach upper 46mg — Epigenetics)', info.Zinc === 'gap'],
    ['Boron partial (~33% of Wallach upper 9.2mg — Epigenetics)', info.Boron === 'partial'],
    ['Aluminum covered via the PDM aggregate (1200mg >= 0.95*924)', info.Aluminum === 'covered'],
    ['Yttrium covered via the SAME shared group verdict', info.Yttrium === 'covered'],
    ['coveredStat >= 30 (the 33-mineral rare-earth group flipped covered)', Number(info.coveredStat) >= 30],
    ['no page errors', pageErrors.length === 0],
  ];
  const failed = checks.filter(([, ok]) => !ok).map(([n]) => n);
  await browser.close();
  if (failed.length) { console.log('FAIL', JSON.stringify(failed)); process.exit(1); }
  console.log('PASS · classifier lights covered + partial + gap + the trace/rare group aggregate');
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
