// tools/render_probe_scan_verdicts.js — locks the 2026-08-19 scanner verdict refinements:
//   · gluten grains AND oats are a HARD reject (item 1), except a gluten-free-oats declaration;
//   · seed / fried oils REJECT on their own but are OFFSET to neutral by >=3 meaningful essentials (item 2);
//   · ALL synthetic food dyes are a HARD reject, exact-match, no mis-fire (item 8);
//   · the result-card copy fixes (items 3,5,6,7) are absent from the shipped bundle.
//
// Usage: node tools/render_probe_scan_verdicts.js   (exit 0 = PASS, non-zero = FAIL)
// Deterministic: drives window.lcScan directly + reads dist/main.js from disk (no UI navigation).

const path = require('path');
const fs = require('fs');
const REPO = path.resolve(__dirname, '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

const N = (name, amount, unit) => ({ name, amount, unit });
const HITS4 = [N('Zinc', 15, 'mg'), N('Selenium', 100, 'mcg'), N('Copper', 1, 'mg'), N('Magnesium', 100, 'mg')];

const CASES = [
  // item 1 — gluten grains / oats hard reject
  { t: 'organic oats -> REJECT', label: { ingredients: 'organic oats' }, expect: 'REJECT', flagHard: 'gluten sources' },
  { t: 'gluten free oats -> not reject', label: { ingredients: 'gluten free oats' }, expectNot: 'REJECT', soft: 'gluten sources' },
  { t: 'wheat flour -> REJECT', label: { ingredients: 'wheat flour, water' }, expect: 'REJECT', flagHard: 'gluten sources' },
  { t: 'buckwheat -> no gluten flag', label: { ingredients: 'buckwheat flour, water' }, noflag: 'gluten sources' },
  // item 2 — seed / fried oils redeemable
  { t: 'canola oil alone -> REJECT', label: { ingredients: 'canola oil' }, expect: 'REJECT', flag: 'fried oils / seed oils' },
  { t: 'seed oil + 4 hits -> SAVE', label: { ingredients: 'sunflower oil, water', nutrients: HITS4 }, expect: 'SAVE' },
  { t: 'seed oil + 1 hit -> REJECT', label: { ingredients: 'canola oil, water', nutrients: [N('Zinc', 15, 'mg')] }, expect: 'REJECT' },
  // item 8 — dyes hard reject
  { t: 'Red 40 -> REJECT', label: { ingredients: 'sugar, red 40, water' }, expect: 'REJECT', flagHard: 'artificial dyes' },
  { t: 'FD&C Yellow No. 5 -> REJECT', label: { ingredients: 'water, FD&C Yellow No. 5' }, expect: 'REJECT', flagHard: 'artificial dyes' },
  { t: 'tartrazine -> REJECT', label: { ingredients: 'rice, tartrazine' }, expect: 'REJECT', flagHard: 'artificial dyes' },
  { t: 'E129 -> REJECT', label: { ingredients: 'glucose, E129' }, expect: 'REJECT', flagHard: 'artificial dyes' },
  { t: 'Blue 1 -> REJECT', label: { ingredients: 'water, blue 1' }, expect: 'REJECT', flagHard: 'artificial dyes' },
  { t: 'dye + 4 hits -> REJECT (hard wins)', label: { ingredients: 'glucose syrup, red 40', nutrients: HITS4 }, expect: 'REJECT', flagHard: 'artificial dyes' },
  // item 8 — mis-fire guards (must NOT dye-flag)
  { t: 'amaranth grain -> no dye', label: { ingredients: 'amaranth flour, quinoa, water' }, noflag: 'artificial dyes' },
  { t: 'orange blossom -> no dye', label: { ingredients: 'orange blossom honey' }, noflag: 'artificial dyes' },
  { t: 'green salad -> no dye', label: { ingredients: 'green salad blend, water' }, noflag: 'artificial dyes' },
  { t: 'reduced iron -> no dye', label: { ingredients: 'reduced iron, corn, sea salt' }, noflag: 'artificial dyes' },
  { t: 'olive oil -> no seed-oil flag', label: { ingredients: 'olive oil, water, sea salt' }, noflag: 'fried oils / seed oils' },
  { t: 'clean nutritious -> ADD', label: { ingredients: 'grass-fed beef liver, gelatin', nutrients: HITS4 }, expect: 'ADD' },
];

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  const url = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));

  const results = await page.evaluate((cases) => cases.map((c) => {
    const label = Object.assign({ servings: 1 }, c.label);
    let r;
    try { r = window.lcScan(label, { logToRecent: false }); }
    catch (e) { return { t: c.t, err: String(e) }; }
    const by = {};
    for (const f of r.anti) by[f.category] = f.severity;
    return { t: c.t, verdict: r.verdict, by, c };
  }), CASES);

  let fails = 0;
  for (const r of results) {
    if (r.err) { console.log('ERR', r.t, r.err); fails++; continue; }
    const c = r.c;
    const checks = [];
    if (c.expect) checks.push(r.verdict === c.expect);
    if (c.expectNot) checks.push(r.verdict !== c.expectNot);
    if (c.flagHard) checks.push(r.by[c.flagHard] === 'hard');
    if (c.flag) checks.push(!!r.by[c.flag]);
    if (c.noflag) checks.push(!r.by[c.noflag]);
    if (c.soft) checks.push(r.by[c.soft] === 'softened');
    const ok = checks.every(Boolean);
    if (!ok) { console.log('FAIL', r.t, '-> verdict', r.verdict, JSON.stringify(r.by)); fails++; }
  }

  // Result-card copy fixes must be gone from the shipped bundle (items 3,5,6,7); new display present (item 4).
  const dist = fs.readFileSync(path.join(REPO, 'dashboard', 'assets', 'js', 'dist', 'main.js'), 'utf8');
  const mustAbsent = ['Worth considering', 'Cited</span> Wallach corpus', 'Never merged into the sealed', 'a real start, not a full daily target'];
  const mustPresent = ['reasonItems', 'vd-reason__it', 'artificial dyes'];
  for (const s of mustAbsent) { if (dist.includes(s)) { console.log('FAIL bundle still has:', s); fails++; } }
  for (const s of mustPresent) { if (!dist.includes(s)) { console.log('FAIL bundle missing:', s); fails++; } }

  console.log('PAGE_ERRORS', pageErrors.length, pageErrors.slice(0, 4).join(' | '));
  const pass = fails === 0 && pageErrors.length === 0;
  console.log(pass ? `PASS · ${CASES.length} verdict scenarios + bundle copy fixes` : `FAIL · ${fails} failing check(s)`);
  await browser.close();
  process.exit(pass ? 0 : 1);
})().catch(e => { console.log('PROBE_ERR', e.stack || e.message); process.exit(1); });
