// render_probe_mirror.js — the cobalt->B12 mirror, driven end-to-end in 5 worlds.
//
// Reads the RENDERED tile class, never a state bridge: the class IS what the user sees, and
// this project has been burned by instruments that measured something other than the screen.
//
// WORLD 4 IS THE ONE THAT MATTERS. Before this shipped, deleting cobalt's fabricated 400 mcg
// target would have dropped it into the canon's trace_pdm fallback, where the plant-derived
// meter has no ceiling: Plant Derived Minerals(TM) alone (600 mg x 1.54 servings = 924 mg =
// 100% of the group goal) would have rendered COBALT: COVERED off a bottle carrying ZERO B12,
// while the B12 tile beside it read GAP. A fail-safe defect traded for a fail-green one, on an
// axis whose deficiency the corpus itself calls "serious, permanent nerve damage".
// Two adversarial judges caught it; this probe is what keeps it caught.
//
// WORLD 3 is the §00.A control: Wallach states no elemental cobalt amount, so an elemental
// cobalt product has nothing to be measured against and MUST move the tile by zero.
const path = require('path');
const pup = require(path.join(__dirname, '..', 'node_modules', 'puppeteer'));
const REPO = path.join(__dirname, '..');
const URL = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');

const B12 = { id: 9101, label: { name: 'PROBE B12', nutrients: [{ name: 'Vitamin B12', amount: 500, unit: 'mcg' }] }, addedDate: '2026-07-15', provenance: 'user_manual' };
const COB = { id: 9102, label: { name: 'PROBE elemental cobalt', nutrients: [{ name: 'Cobalt', amount: 5000, unit: 'mcg' }] }, addedDate: '2026-07-15', provenance: 'user_manual' };
const PDM = { id: 9103, label: { name: 'Plant Derived Minerals™', nutrients: [] }, addedDate: '2026-07-15', provenance: 'user_manual' };

async function world(items) {
  const b = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  if (items) await p.evaluateOnNewDocument(s => { try { localStorage.setItem('lcRegimen_v1', JSON.stringify(s)); } catch (e) { /* seed best-effort */ } }, { items });
  await p.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1800));
  const st = await p.evaluate(() => {
    const t = [...document.querySelectorAll('.tile')].find(x => ((x.querySelector('.tile__name') || {}).textContent || '').trim().toLowerCase().startsWith('cobalt'));
    if (!t) return '(missing)';
    const c = [...t.classList].filter(k => k !== 'tile' && !k.startsWith('tile--'));
    return c.length ? c.join('+') : '(blank)';
  });
  await b.close();
  return { st, errs };
}

(async () => {
  const checks = [];
  const empty = await world(null);
  checks.push(['empty regimen -> cobalt tracks B12 (gap)', empty.st === 'gap', empty.st]);

  const b12 = await world([B12]);
  checks.push(['B12 present -> cobalt FILLS (the mirror)', b12.st === 'covered', b12.st]);

  const cob = await world([COB]);
  checks.push(['elemental cobalt 5000mcg -> must NOT light (§00.A)', cob.st === 'gap', cob.st]);

  const pdm = await world([PDM]);
  checks.push(['★ PDM bottle alone -> must NOT light (the false green)', pdm.st === 'gap', pdm.st]);

  const both = await world([PDM, COB]);
  checks.push(['PDM + elemental cobalt -> must NOT light', both.st === 'gap', both.st]);

  const pageErrs = [...empty.errs, ...b12.errs, ...cob.errs, ...pdm.errs, ...both.errs];
  checks.push(['zero page errors', pageErrs.length === 0, pageErrs.length]);

  let bad = 0;
  for (const [name, ok, got] of checks) {
    if (!ok) bad++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : `  (got: ${got})`}`);
  }
  if (bad) { console.log(`\nFAIL · ${bad} mirror check(s) failed`); process.exit(1); }
  console.log('\nPASS · the cobalt→B12 mirror moves ONLY with B12: not off its own elemental amount, and not off the plant-derived bottle');
})();
