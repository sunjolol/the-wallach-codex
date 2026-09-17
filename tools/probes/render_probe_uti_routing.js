// tools/probes/render_probe_uti_routing.js — UTI routing regression guard (exit 0 = PASS).
//
// Usage: node tools/probes/render_probe_uti_routing.js
//
// WHAT IT GUARDS: before 2026-09-17, typing "uti" — or ANY question containing it — opened
// "Cystitis", not "Urinary Tract Infection". The cause was a synonym COLLISION: both entities
// carried "uti", "urinary tract infection" and "bladder infection", and entityHit()'s pass-2
// synonym loop returns the FIRST match in registry iteration order, which is slug-alphabetical —
// so cystitis (index 137) beat urinary_tract_infection (index 512) every time. Only the fully
// typed name reached the right page, via entityHit pass 1 (canonical display-name match), which
// is the one path a collision cannot hijack. The plural "utis" matched no entity at all and fell
// through to askRanked, which heroed "How do you treat autism naturally?".
//
// THE FIX: umbrella/subtype split. urinary_tract_infection owns every LAY phrasing (uti/utis/
// u.t.i/bladder infection/burning when I pee/…); cystitis keeps only its own clinical names
// (cistitis, bladder inflammation, irritation of the bladder, honeymoon disease). Ownership is
// now SOLE, so registry order cannot decide it. Wallach's two cranberry+herb protocol claims
// (DDDL-000338, LETS-000241) gained urinary_tract_infection in also_about so the umbrella page
// carries the treatment, not just a redirect.
//
// SYNONYMS ARE NAMES, NEVER QUESTIONS. resolveQuery step 1 short-circuits a whole-query synonym
// match straight to mode 'entity', so a synonym like "natural remedy for uti" would freeze that
// query into a page open and bypass ranking forever. The lay questions below are NOT synonyms —
// they route because entityInQuery() finds the bare token "uti" inside them. Never "fix" a future
// miss here by pasting the question in as a synonym.
//
// CAVEAT: expectations are coupled to the mined corpus. A re-mine can turn a check red with no
// code regression — re-verify against the live resolver before "fixing", and never merely loosen
// a check to match new output: a check relaxed to fit its own result stops being a gate.

const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

const wait = ms => new Promise(r => setTimeout(r, ms));

const UTI = r => r.mode === 'entity' && r.subject === 'urinary_tract_infection';

const CHECKS = [
  // --- the reported defect: the abbreviation and its variants ---
  { q: 'uti', ok: UTI, why: 'the bare abbreviation is the whole report' },
  { q: 'UTI', ok: UTI, why: 'case must not matter' },
  { q: 'u.t.i', ok: UTI, why: 'matchKey collapses the periods' },
  { q: 'utis', ok: UTI, why: 'the plural once heroed "How do you treat autism naturally?"' },

  // --- the lay questions people actually type (routed by the bare token, NOT by synonym) ---
  { q: 'natural remedy for UTI', ok: UTI, why: 'named in the 2026-09-17 report' },
  { q: 'how to heal UTI', ok: UTI, why: 'named in the 2026-09-17 report' },
  { q: 'how to cure a UTI', ok: UTI, why: 'the same intent, different verb' },
  { q: 'home remedy for uti', ok: UTI, why: 'the same intent, different noun' },
  { q: 'what helps a uti', ok: UTI, why: 'vaguer phrasing, same topic' },
  { q: 'how do I get rid of a uti', ok: UTI, why: 'conversational phrasing' },
  { q: 'what causes a uti', ok: UTI, why: 'cause intent, same topic' },
  { q: 'how to prevent uti', ok: UTI, why: 'prevention intent, same topic' },
  { q: 'recurring uti', ok: UTI, why: 'a modifier must not defeat the token' },
  { q: 'best supplement for uti', ok: UTI, why: 'supplement intent, same topic' },
  { q: 'does cranberry juice help uti', ok: UTI, why: 'the answer Wallach actually gives' },

  // --- the full names and lay aliases ---
  { q: 'urinary tract infection', ok: UTI, why: 'the canonical name (this one always worked)' },
  { q: 'urinary infection', ok: UTI, why: 'catalog synonym, once fell through to the generic Infection topic' },
  { q: 'bladder infection', ok: UTI, why: 'the commonest lay name for a UTI' },
  { q: 'urine infection', ok: UTI, why: 'lay alias' },
  { q: 'water infection', ok: UTI, why: 'British lay alias' },
  { q: 'urinary tract', ok: UTI, why: 'partial name still lands on the topic' },

  // --- symptom phrasings, which is how many people search ---
  { q: 'burning when I pee', ok: UTI, why: 'once heroed "What causes burning feet?" (vitamin B5)' },
  { q: 'burning pee', ok: UTI, why: 'terser symptom phrasing' },
  { q: 'painful urination', ok: UTI, why: 'clinical symptom phrasing' },
  { q: 'it hurts to pee', ok: UTI, why: 'plainest phrasing of all' },

  // --- the subtype keeps its OWN page; the umbrella must not swallow it ---
  { q: 'cystitis', ok: r => r.mode === 'entity' && r.subject === 'cystitis',
    why: 'the clinical term is its own condition, not the umbrella' },
  { q: 'cistitis', ok: r => r.mode === 'entity' && r.subject === 'cystitis',
    why: 'the common misspelling still reaches the subtype' },
  { q: 'bladder inflammation', ok: r => r.mode === 'entity' && r.subject === 'cystitis',
    why: 'inflammation is the subtype, not the infection umbrella' },

  // --- neighbours must not be captured by the new synonym block ---
  { q: 'bladder stones', ok: r => r.subject === 'bladder_stones',
    why: 'the "urinary tract" phrase must not swallow the stones topic' },
  { q: 'kidney stones', ok: r => r.subject !== 'urinary_tract_infection',
    why: 'stones are not an infection' },
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
      return { mode: res.mode, subject: res.subject, facet: c ? c.facet : null };
    }, chk.q);
    const pass = chk.ok(r);
    console.log((pass ? 'PASS ' : 'FAIL ') + '"' + chk.q + '"  -> mode=' + r.mode + ' subject=' + r.subject
      + ' facet=' + (r.facet || '-'));
    if (!pass) fails.push(chk.q + '  (' + chk.why + ')');
  }

  // The umbrella must actually CARRY Wallach's treatment, counted from the RENDERED page. A page
  // that resolves but shows only a redirect-grade stub is the same bug wearing a better label:
  // the reader typed "natural remedy for UTI" and must SEE the cranberry-and-herbs protocol.
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
    i.value = 'natural remedy for UTI';
    i.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await wait(900);
  const shown = await page.evaluate(() => {
    const root = document.querySelector('#drawer-search-mount');
    const hero = (root.querySelector('.ehero__name') || {}).textContent || '';
    const meta = (root.textContent || '').match(/(\d+)\s+ANSWERS/i);
    const txt = root.textContent || '';
    return {
      hero: hero.trim(),
      n: meta ? Number(meta[1]) : 0,
      cranberry: /cranberry/i.test(txt),
      herbs: /bearberry/i.test(txt),
    };
  });
  console.log('rendered hero: "' + shown.hero + '" with ' + shown.n + ' answer(s)'
    + ' · cranberry=' + shown.cranberry + ' bearberry=' + shown.herbs);
  if (shown.hero !== 'Urinary Tract Infection') fails.push('the rendered hero is "' + shown.hero + '", not Urinary Tract Infection');
  if (shown.n < 8) fails.push('the UTI page renders only ' + shown.n + ' answers (expected 8+)');
  if (!shown.cranberry) fails.push('the UTI page does not show the cranberry-juice protocol');
  if (!shown.herbs) fails.push('the UTI page does not show the herb list (bearberry et al.)');

  if (errs.length) { console.log('PAGE ERRORS:', errs); fails.push('page errors present'); }
  await browser.close();

  if (fails.length) {
    console.log('\nFAILED ' + fails.length + '/' + (CHECKS.length + 4) + ':');
    for (const f of fails) console.log('  - ' + f);
    process.exit(1);
  }
  console.log('\nUTI ROUTING PROBE OK — ' + CHECKS.length + ' routing checks + page population passed');
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
