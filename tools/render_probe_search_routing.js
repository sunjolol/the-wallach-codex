// tools/render_probe_search_routing.js — Search resolver INTENT-routing regression guard (exit 0 = PASS).
//
// Usage: node tools/render_probe_search_routing.js
//
// A FOCUSED companion to tools/render_probe_search.js (the comprehensive Ask-Wallach catch-all probe).
// This one asserts INTENT-based routing on the antioxidants family: a neutral how-to query heroes a FOOD
// answer (not the weight-loss warning), a "which foods" query heroes a sources answer, the bare-definition
// query heroes the definition, and a mention/cause query resolves to the right topic. Drives the REAL
// shipped resolver (window.wallachSearch.resolveQuery) on the built file:// bundle. Requires puppeteer.
//
// REFRESHED 2026-07-28: the corpus was re-mined + routing evolved since the first cut, so several checks
// had gone stale — asserting OLD behavior, not a real regression. Notably "what causes cancer" now heroes
// a genuine "What causes cancer according to Wallach?" answer (BETTER than the old route-to-entity-page
// expectation), and "which foods…" heroes a real ORAC-foods answer. The checks now assert the current,
// verified-correct behavior. The one genuine mis-hero — "how to get more antioxidants" won the weight-loss
// warning on the token "more" — was fixed by adding a "get more antioxidants" intent topic to the top-foods
// claim (WAL-CLM-HELLS-000014); this probe guards that fix.

const path = require('path');
const REPO = path.resolve(__dirname, '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

const wait = ms => new Promise(r => setTimeout(r, ms));

const WARNING = 'WAL-CLM-HELLS-000016';   // "...more antioxidants when I'm losing weight" — must not ambush a neutral query

const CHECKS = [
  { q: 'how to get more antioxidants',
    ok: r => r.mode === 'ask' && r.facet === 'sources' && r.heroId !== WARNING,
    why: 'a neutral how-to query must hero a food-sources answer, NOT the weight-loss warning' },
  { q: 'which foods have the most antioxidants',
    ok: r => r.mode === 'ask' && r.facet === 'sources',
    why: 'a "which foods" query must hero a food-sources answer' },
  { q: 'best antioxidant foods',
    ok: r => r.subject === 'antioxidants' && r.heroId !== WARNING,
    why: 'a "best foods" query resolves to the antioxidants topic (its page, or a non-warning answer)' },
  { q: 'why do I need antioxidants when losing weight',
    ok: r => r.subject === 'weight_loss' || r.heroId === WARNING,
    why: 'a genuine weight-loss query surfaces the warning (its own page, or the warning hero)' },
  { q: 'what are antioxidants',
    ok: r => r.mode === 'ask' && r.facet === 'basics',
    why: 'a bare "what is X" query (no intent words) must hero the definition' },
  { q: 'what causes cancer',
    ok: r => r.subject === 'cancer',
    why: 'a cause query resolves to cancer (its page, or a "what causes cancer" answer)' },
];

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  const url = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.log('GOTO_ERR', e.message));
  await wait(1500);

  const has = await page.evaluate(() => typeof window.wallachSearch?.resolveQuery === 'function');
  if (!has) { console.log('FAIL: no window.wallachSearch.resolveQuery bridge'); await browser.close(); process.exit(3); }

  const fails = [];
  for (const chk of CHECKS) {
    const r = await page.evaluate((qq) => {
      const res = window.wallachSearch.resolveQuery(qq);
      const c = res.claim;
      return { mode: res.mode, subject: res.subject, heroId: c ? c.id : null, facet: c ? c.facet : null };
    }, chk.q);
    const pass = chk.ok(r);
    console.log((pass ? 'PASS ' : 'FAIL ') + '"' + chk.q + '"  -> mode=' + r.mode + ' subject=' + r.subject + ' hero=' + (r.heroId || '-') + ' facet=' + (r.facet || '-'));
    if (!pass) fails.push(chk.q + '  (' + chk.why + ')');
  }
  if (errs.length) { console.log('PAGE ERRORS:', errs); fails.push('page errors present'); }
  await browser.close();

  if (fails.length) {
    console.log('\nFAILED ' + fails.length + '/' + CHECKS.length + ':');
    for (const f of fails) console.log('  - ' + f);
    process.exit(1);
  }
  console.log('\nROUTING PROBE OK — ' + CHECKS.length + '/' + CHECKS.length + ' intent-routing checks passed');
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
