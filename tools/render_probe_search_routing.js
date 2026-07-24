// tools/render_probe_search_routing.js — Search resolver INTENT-routing regression guard (exit 0 = PASS).
//
// Usage: node tools/render_probe_search_routing.js
//
// A FOCUSED companion to tools/render_probe_search.js (the comprehensive Ask-Wallach catch-all probe).
// This one asserts ONLY the intent-based hero-routing added 2026-07-24: once a query names a topic, the
// hero is ranked by the query's INTENT (its words minus the topic's own name), so a generic claim (a niche
// weight-loss warning, or the bare definition) can't hijack a specific question just by repeating the topic
// word. A genuine warning-scenario query must still hero the warning. Drives the REAL shipped resolver
// (window.wallachSearch.resolveQuery) on the built file:// bundle. Requires puppeteer.

const path = require('path');
const REPO = path.resolve(__dirname, '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

const wait = ms => new Promise(r => setTimeout(r, ms));

const WARNING = 'WAL-CLM-HELLS-000016';   // "...more antioxidants when I'm losing weight" (the ambusher)
const FOODS = ['WAL-CLM-HELLS-000014', 'WAL-CLM-IMMORT-000240'];  // the two food-source answers

const CHECKS = [
  { q: 'how to get more antioxidants',
    ok: r => r.mode === 'ask' && r.heroId !== WARNING,
    why: 'a neutral how-to query must NOT hero the weight-loss warning' },
  { q: 'which foods have the most antioxidants',
    ok: r => r.mode === 'ask' && r.facet === 'sources' && FOODS.includes(r.heroId),
    why: 'a "which foods" query must hero a food-sources answer' },
  { q: 'best antioxidant foods',
    ok: r => r.mode === 'ask' && r.facet === 'sources' && FOODS.includes(r.heroId),
    why: 'a "best foods" query must hero a food-sources answer' },
  { q: "why do I need antioxidants when losing weight",
    ok: r => r.heroId === WARNING,
    why: 'a genuine weight-loss query MUST still hero the warning (intent matches its content)' },
  { q: 'what are antioxidants',
    ok: r => r.mode === 'ask' && r.facet === 'basics',
    why: 'a bare "what is X" query (no intent words) must still hero the definition' },
  { q: 'what causes cancer',
    ok: r => r.mode === 'entity' && r.subject === 'cancer',
    why: 'a mention whose best answer is off-topic must route to the entity page' },
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
