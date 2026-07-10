// tools/render_probe_search.js — Search drawer (Ask-Wallach) thin-slice, Mercury.
//
// Usage: node tools/render_probe_search.js   (exit 0 = PASS, non-zero = FAIL)
//
// Verifies the Search drawer end-to-end for the Mercury visual-reference slice:
// the rail "Search" item (+ bare "S" + the topbar command bar) toggles the overlay;
// the default view is the Mercury ENTITY PAGE — a faceted header + collapsible facet
// sections listing all 13 claims as FAQ rows that carry answer/verbatim/cite; a typed
// QUESTION resolves to a single ASK card (question + Wallach verbatim + composed cite +
// "more on" back to the entity page). Requires puppeteer.

const path = require('path');
const REPO = path.resolve(__dirname, '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));

  const url = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.log('GOTO_ERR', e.message));
  await wait(1500);

  const drawerState = () => page.evaluate(() => {
    const el = document.getElementById('drawer-search-mount');
    return {
      open: el ? el.classList.contains('sr-open') : null,
      hasHead: el ? el.querySelector('.sr-head') !== null : null,
      hasSearchbar: el ? el.querySelector('.sr-searchbar__input') !== null : null,
    };
  });

  const setQuery = async (q) => {
    await page.evaluate((val) => {
      const i = document.querySelector('#drawer-search-mount .sr-searchbar__input');
      if (i) { i.value = val; i.dispatchEvent(new Event('input', { bubbles: true })); }
    }, q);
    await wait(150);
  };

  // 1. Closed at boot.
  const boot = await drawerState();

  // 2. Click the Search rail item -> opens the entity page for Mercury.
  await page.evaluate(() => document.querySelector('[data-rail-nav="search"]')?.click());
  await wait(300);
  const afterClick = await drawerState();

  const entity = await page.evaluate(() => {
    const root = document.getElementById('drawer-search-mount');
    const name = root?.querySelector('.sr-entity__name')?.textContent?.trim() || '';
    const meta = root?.querySelector('.sr-entity__meta')?.textContent?.trim() || '';
    const facets = root ? [...root.querySelectorAll('.sr-facet__label')].map(e => e.textContent.trim()) : [];
    const claims = root ? [...root.querySelectorAll('.sr-claim')] : [];
    const first = claims[0] || null;
    const related = root ? root.querySelectorAll('.sr-related__chip').length : 0;
    // A dual-homed claim (selenium antidote) must render its tier-1 chips.
    const tier1 = root ? root.querySelectorAll('.sr-t1').length : 0;
    return {
      name, meta,
      facetCount: facets.length,
      facets,
      claimCount: claims.length,
      firstQ: first ? (first.querySelector('.sr-claim__q')?.textContent || '').length > 0 : false,
      firstPreview: first ? (first.querySelector('.sr-claim__preview')?.textContent || '').length > 0 : false,
      firstVerbatim: first ? (first.querySelector('.sr-claim__verbatim')?.textContent || '').length > 0 : false,
      firstCite: first ? /IMMORTALITY/i.test(first.querySelector('.sr-claim__cite')?.textContent || '') : false,
      related, tier1,
    };
  });

  // 3. Ask path — a typed QUESTION resolves to ONE Ask card (the vaccine/autism claim).
  await setQuery('do vaccines cause autism');
  const ask = await page.evaluate(() => {
    const root = document.getElementById('drawer-search-mount');
    const card = root ? root.querySelector('.sr-ask') : null;
    return {
      shown: card !== null,
      q: card ? (card.querySelector('.sr-ask__q')?.textContent || '') : '',
      hasVerbatim: card ? (card.querySelector('.sr-claim__verbatim')?.textContent || '').length > 0 : false,
      hasCite: card ? /IMMORTALITY/i.test(card.querySelector('.sr-claim__cite')?.textContent || '') : false,
      hasMore: card ? card.querySelector('.sr-ask__more[data-sr-more]') !== null : false,
    };
  });

  // 3b. "MORE ON MERCURY" returns to the entity page.
  await page.evaluate(() => document.querySelector('#drawer-search-mount .sr-ask__more')?.click());
  await wait(200);
  const afterMore = await page.evaluate(() => {
    const root = document.getElementById('drawer-search-mount');
    return { entityShown: root?.querySelector('.sr-entity') !== null, askGone: root?.querySelector('.sr-ask') === null };
  });

  // 4. Subject query -> entity page (synonym/name hit).
  await setQuery('quicksilver');
  const synonymHit = await page.evaluate(() => {
    const root = document.getElementById('drawer-search-mount');
    return { name: root?.querySelector('.sr-entity__name')?.textContent?.trim() || '' };
  });

  // 4b. A gibberish query falls back to the Mercury browse with a no-match note.
  await setQuery('zzzznotathing');
  const noMatch = await page.evaluate(() => {
    const root = document.getElementById('drawer-search-mount');
    return { hasNote: root?.querySelector('.sr-note') !== null, entityShown: root?.querySelector('.sr-entity') !== null };
  });

  // 5. Esc closes; bare "S" reopens; topbar command bar also opens it.
  await page.keyboard.press('Escape');
  await wait(200);
  const afterEsc = await drawerState();

  await page.keyboard.press('KeyS');
  await wait(200);
  const afterS = await drawerState();

  await page.keyboard.press('Escape');
  await wait(150);
  await page.evaluate(() => document.querySelector('.topbar__ask')?.click());
  await wait(200);
  const afterTopbar = await drawerState();

  const out = { boot, afterClick, entity, ask, afterMore, synonymHit, noMatch, afterEsc, afterS, afterTopbar };
  console.log('SEARCH', JSON.stringify(out));
  console.log('PAGE_ERRORS', errs.length, errs.slice(0, 5).join(' | '));

  const checks = [
    ['drawer closed at boot', boot.open === false],
    ['rail Search opens the drawer', afterClick.open === true && afterClick.hasHead === true && afterClick.hasSearchbar === true],
    ['entity page: Mercury header', /MERCURY/i.test(entity.name)],
    ['entity page: type + count meta (ELEMENT · 13 entries)', /ELEMENT/i.test(entity.meta) && /13/.test(entity.meta)],
    ['entity page: multiple facet sections (>= 5)', entity.facetCount >= 5],
    ['entity page: all 13 claims listed as FAQ rows', entity.claimCount === 13],
    ['claim row: question + preview render', entity.firstQ === true && entity.firstPreview === true],
    ['claim row: verbatim + composed cite (IMMORTALITY)', entity.firstVerbatim === true && entity.firstCite === true],
    ['dual-homed claim shows tier-1 chips', entity.tier1 >= 1],
    ['entity page: related chips render', entity.related >= 1],
    ['ask: a question resolves to one Ask card', ask.shown === true],
    ['ask: card shows the vaccine/autism question', /vaccine/i.test(ask.q)],
    ['ask: card carries Wallach verbatim + composed cite', ask.hasVerbatim === true && ask.hasCite === true],
    ['ask: "more on" back-link present', ask.hasMore === true],
    ['ask: "more on" returns to the entity page', afterMore.entityShown === true && afterMore.askGone === true],
    ['subject synonym query -> Mercury entity (quicksilver)', /MERCURY/i.test(synonymHit.name)],
    ['no-match query -> gentle note + Mercury browse fallback', noMatch.hasNote === true && noMatch.entityShown === true],
    ['Esc closes drawer', afterEsc.open === false],
    ['bare S reopens drawer', afterS.open === true],
    ['topbar Ask Wallach button opens the Search drawer', afterTopbar.open === true],
    ['no page errors', errs.length === 0],
  ];
  const failed = checks.filter(([, ok]) => !ok).map(([n]) => n);
  await browser.close();
  if (failed.length) { console.log('FAIL', JSON.stringify(failed)); process.exit(1); }
  console.log('PASS · Search drawer wired · Mercury entity page (faceted FAQ + verbatim + cite) · Ask card · rail/S/topbar entries');
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
