// tools/probes/render_probe_liver_routing.js — Liver Health routing regression guard (exit 0 = PASS).
//
// Usage: node tools/probes/render_probe_liver_routing.js
//
// WHAT IT GUARDS: before 2026-09-01, 12 of 20 liver queries resolved to the `meat` entity
// ("Meat & Animal Foods") because `meat` carried the bare synonym "liver" for organ meat and no
// liver-organ entity existed to outrank it; "signs of liver problems" heroed "What are the signs of
// too much calcium?". The fix is a `hub: true` `liver` topic + the bare token moved off `meat`.
//
// It ALSO guards the second, subtler mistake made while fixing the first: the liver entity was
// initially given FULL QUESTION phrasings as synonyms ("how do I keep my liver healthy"), and
// resolveQuery step 1 short-circuits a whole-query synonym match straight to mode 'entity' — so
// every real question opened the page instead of heroing the claim that answers it. Synonyms must
// stay NAMES; questions must reach askRanked + heroByIntent.
//
// The split this pins: a query with ONE best answer must hero that answer (mode 'ask'); a genuinely
// BROAD query, where no single claim is honest, must open the topic page (mode 'entity').
//
// CAVEAT: expectations are coupled to the mined corpus. A re-mine can turn a check red with no code
// regression — re-verify against the live resolver before "fixing", and never merely loosen a check
// to match new output: a check relaxed to fit its own result stops being a gate.

const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

const wait = ms => new Promise(r => setTimeout(r, ms));

const CHECKS = [
  // --- the original defect: these must NEVER return to `meat` ---
  { q: 'liver', ok: r => r.subject === 'liver', why: 'the bare word is the ORGAN, not organ meat' },
  { q: 'liver health', ok: r => r.subject === 'liver', why: 'names the hub topic' },
  { q: 'liver function', ok: r => r.subject === 'liver', why: 'names the hub topic' },
  { q: 'liver repair', ok: r => r.subject === 'liver', why: 'names the hub topic' },

  // --- a question with ONE best answer must HERO that answer, not open the page ---
  { q: 'what does the liver do', ok: r => r.mode === 'ask' && r.facet === 'basics',
    why: 'a bare definition query heroes the basics answer' },
  { q: 'how do I keep my liver healthy', ok: r => r.mode === 'ask' && r.subject === 'liver' && r.facet === 'sources',
    why: 'heroes the foods-and-nutrients answer' },
  { q: 'how to take care of my liver', ok: r => r.mode === 'ask' && r.subject === 'liver' && r.facet === 'protocol',
    why: 'heroes the protocol answer, not a claim that merely shares the word take' },
  { q: 'best supplement for liver', ok: r => r.mode === 'ask' && r.subject === 'liver',
    why: 'heroes a liver answer (it once heroed a vegan hair-greying claim)' },
  { q: 'can the liver heal itself', ok: r => r.mode === 'ask' && r.subject === 'liver' && r.facet === 'protocol',
    why: 'heroes the reversal answer' },
  { q: 'liver damage from alcohol', ok: r => r.mode === 'ask' && r.subject === 'liver',
    why: 'heroes the drinking-threshold answer (it once heroed a resveratrol high-fat claim)' },

  // --- a BROAD query, where no single claim is the honest answer, opens the PAGE ---
  { q: 'what damages the liver', ok: r => r.mode === 'entity' && r.subject === 'liver',
    why: 'many causes; the page is the honest answer' },
  { q: 'signs of liver problems', ok: r => r.mode === 'entity' && r.subject === 'liver',
    why: 'many signs; the page is the honest answer (it once heroed signs of too much calcium)' },

  // --- siblings keep their own pages; the hub must not swallow them ---
  { q: 'fatty liver', ok: r => r.subject === 'fatty_liver', why: 'its own condition, not the hub' },
  { q: 'cirrhosis', ok: r => r.subject === 'cirrhosis', why: 'its own condition, not the hub' },
  { q: 'liver spots', ok: r => r.subject === 'free_radicals',
    why: 'liver spots are SKIN pigment — they must not resolve to the organ' },

  // --- the food sense still works, on the food entity ---
  { q: 'organ meats', ok: r => r.subject === 'meat', why: 'eating liver is still a meat query' },
  { q: 'beef liver', ok: r => r.subject === 'meat' || r.subject === 'beef',
    why: 'beef liver is a FOOD, and must not land on the organ hub' },
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
    console.log((pass ? 'PASS ' : 'FAIL ') + '"' + chk.q + '"  -> mode=' + r.mode + ' subject=' + r.subject
      + ' facet=' + (r.facet || '-'));
    if (!pass) fails.push(chk.q + '  (' + chk.why + ')');
  }

  // The hub must actually CARRY claims, counted from the RENDERED page — a topic that resolves but
  // shows nothing is the exact bug the owner reported ("why does it not show anything for liver
  // health"). Driving the real UI, not the index, is what makes this check mean something.
  await page.evaluate(() => {
    const veil = document.querySelector('.wc-veil');
    if (veil) {
      const b = [...veil.querySelectorAll('button, a')].find(x => /browsing/i.test(x.textContent || ''));
      if (b) b.click();
    }
  });
  await wait(500);
  await page.evaluate(() => document.querySelector('.topbar__ask')?.click());
  await wait(800);
  await page.evaluate(() => {
    const i = document.querySelector('#drawer-search-mount .aw-search__input');
    i.value = 'liver health';
    i.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await wait(900);
  const shown = await page.evaluate(() => {
    const root = document.querySelector('#drawer-search-mount');
    const hero = (root.querySelector('.ehero__name') || {}).textContent || '';
    const meta = (root.textContent || '').match(/(\d+)\s+ANSWERS/i);
    return { hero: hero.trim(), n: meta ? Number(meta[1]) : 0 };
  });
  console.log('rendered hero: "' + shown.hero + '" with ' + shown.n + ' answer(s)');
  if (shown.hero !== 'Liver Health') fails.push('the rendered hero is "' + shown.hero + '", not Liver Health');
  if (shown.n < 20) fails.push('the Liver Health page renders only ' + shown.n + ' answers (expected 20+)');

  if (errs.length) { console.log('PAGE ERRORS:', errs); fails.push('page errors present'); }
  await browser.close();

  if (fails.length) {
    console.log('\nFAILED ' + fails.length + '/' + (CHECKS.length + 1) + ':');
    for (const f of fails) console.log('  - ' + f);
    process.exit(1);
  }
  console.log('\nLIVER ROUTING PROBE OK — ' + CHECKS.length + ' routing checks + hub population passed');
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
