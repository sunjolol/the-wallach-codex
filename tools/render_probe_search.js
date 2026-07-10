// tools/render_probe_search.js — Search drawer (Ask-Wallach), multi-entity derived index.
//
// Usage: node tools/render_probe_search.js   (exit 0 = PASS, non-zero = FAIL)
//
// Verifies the Search drawer end-to-end over the DERIVED search index (search-index.json):
// the rail "Search" item (+ bare "S" + topbar Ask-Wallach button) toggles the overlay; the
// default view is the BROWSE LANDING (one card per registered entity); clicking an entity
// card opens its ENTITY PAGE (faceted FAQ header + collapsible facet sections listing every
// claim as an answer/verbatim/cite row); a typed QUESTION resolves to one ASK card. Drives
// BOTH seeded entities — Calcium (the newly authored second entity) and Mercury. Requires puppeteer.

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
  const readEntity = () => page.evaluate(() => {
    const root = document.getElementById('drawer-search-mount');
    const name = root?.querySelector('.sr-entity__name')?.textContent?.trim() || '';
    const meta = root?.querySelector('.sr-entity__meta')?.textContent?.trim() || '';
    const facets = root ? [...root.querySelectorAll('.sr-facet__label')].map(e => e.textContent.trim()) : [];
    const claims = root ? [...root.querySelectorAll('.sr-claim')] : [];
    const first = claims[0] || null;
    return {
      name, meta, facets, facetCount: facets.length, claimCount: claims.length,
      firstQ: first ? (first.querySelector('.sr-claim__q')?.textContent || '').length > 0 : false,
      firstPreview: first ? (first.querySelector('.sr-claim__preview')?.textContent || '').length > 0 : false,
      firstVerbatim: first ? (first.querySelector('.sr-claim__verbatim')?.textContent || '').length > 0 : false,
      firstCite: first ? /IMMORTALITY/i.test(first.querySelector('.sr-claim__cite')?.textContent || '') : false,
      related: root ? root.querySelectorAll('.sr-related .sr-pill').length : 0,
      claimPills: root ? root.querySelectorAll('.sr-claim__related .sr-pill').length : 0,
      linkPills: root ? root.querySelectorAll('.sr-pill--link').length : 0,
      wheel: root ? root.querySelector('.sr-entity__sym svg.sr-icon-wheel') !== null : false,
    };
  });

  // 1. Closed at boot.
  const boot = await drawerState();

  // 2. Rail "Search" opens the drawer -> the BROWSE LANDING (entity cards).
  await page.evaluate(() => document.querySelector('[data-rail-nav="search"]')?.click());
  await wait(300);
  const afterClick = await drawerState();
  const landing = await page.evaluate(() => {
    const root = document.getElementById('drawer-search-mount');
    const cards = root ? [...root.querySelectorAll('.sr-ent-card')] : [];
    const slugs = cards.map(c => c.getAttribute('data-sr-entity'));
    const want = ['mercury', 'calcium', 'cholesterol', 'diabetes', 'colloidal_minerals', 'color_therapy', 'wallach'];
    return { cardCount: cards.length, slugs, allTypesPresent: want.every(s => slugs.includes(s)) };
  });

  // 3. Click the CALCIUM card -> Calcium entity page (the newly authored second entity).
  await page.evaluate(() => document.querySelector('#drawer-search-mount [data-sr-entity="calcium"]')?.click());
  await wait(250);
  const calcium = await readEntity();

  // 3b. "‹ BACK" from a card opened off the landing pops back to the landing (empty nav stack).
  await page.evaluate(() => document.querySelector('#drawer-search-mount [data-sr-action="back"]')?.click());
  await wait(200);
  const afterBack = await page.evaluate(() => {
    const root = document.getElementById('drawer-search-mount');
    return { landingShown: root?.querySelector('.sr-landing') !== null, entityGone: root?.querySelector('.sr-entity') === null };
  });

  // 4. Subject synonym query -> Mercury entity page.
  await setQuery('quicksilver');
  const mercury = await readEntity();

  // 4b. Condition entity (Diabetes) — tier-1 dual-home chips MUST show (it's a real tier-1 claim).
  await setQuery('diabetes');
  const diabetes = await readEntity();
  // 4c. Topic entity (Color Therapy) — search-only modality, so NO related pills even though a
  // color-map claim carries a conditions array for search matching; also carries the color-wheel icon.
  await setQuery('color therapy');
  const colorTherapy = await readEntity();

  // 4d. Unified pill rule + back-stack: Colloidal Minerals has a clickable RELATED pill (Calcium),
  // clicking it navigates to Calcium, and "‹ BACK" returns to Colloidal Minerals.
  await setQuery('colloidal minerals');
  const colloidal = await readEntity();
  const navTest = await page.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms));
    const root = document.getElementById('drawer-search-mount');
    const link = root.querySelector('.sr-related .sr-pill--link');
    const linkText = link ? link.textContent.trim() : '';
    if (link) { link.click(); }
    await w(260);
    const afterClick = root.querySelector('.sr-entity__name')?.textContent?.trim() || '';
    root.querySelector('.sr-entity__back')?.click();
    await w(260);
    const afterBack = root.querySelector('.sr-entity__name')?.textContent?.trim() || '';
    return { linkText, afterClick, afterBack };
  });

  // 5. Ask path — a typed QUESTION resolves to ONE Ask card (the vaccine/autism claim).
  await setQuery('do vaccines cause autism');
  const ask = await page.evaluate(() => {
    const root = document.getElementById('drawer-search-mount');
    const card = root ? root.querySelector('.sr-ask') : null;
    return {
      shown: card !== null,
      q: card ? (card.querySelector('.sr-ask__q')?.textContent || '') : '',
      hasVerbatim: card ? (card.querySelector('.sr-claim__verbatim')?.textContent || '').length > 0 : false,
      hasCite: card ? /IMMORTALITY/i.test(card.querySelector('.sr-claim__cite')?.textContent || '') : false,
      hasMore: card ? card.querySelector('.sr-ask__more[data-sr-entity]') !== null : false,
    };
  });

  // 5b. "MORE ON MERCURY" returns to the entity page.
  await page.evaluate(() => document.querySelector('#drawer-search-mount .sr-ask__more')?.click());
  await wait(200);
  const afterMore = await page.evaluate(() => {
    const root = document.getElementById('drawer-search-mount');
    return { entityShown: root?.querySelector('.sr-entity') !== null, askGone: root?.querySelector('.sr-ask') === null };
  });

  // 6. A gibberish query falls back to the LANDING with a no-match note.
  await setQuery('zzzznotathing');
  const noMatch = await page.evaluate(() => {
    const root = document.getElementById('drawer-search-mount');
    return { hasNote: root?.querySelector('.sr-note') !== null, landingShown: root?.querySelector('.sr-landing') !== null };
  });

  // 7. Esc closes; bare "S" reopens; topbar Ask-Wallach button also opens it.
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

  const out = { boot, afterClick, landing, calcium, afterBack, mercury, diabetes, colorTherapy, colloidal, navTest, ask, afterMore, noMatch, afterEsc, afterS, afterTopbar };
  console.log('SEARCH', JSON.stringify(out));
  console.log('PAGE_ERRORS', errs.length, errs.slice(0, 5).join(' | '));

  const checks = [
    ['drawer closed at boot', boot.open === false],
    ['rail Search opens the drawer', afterClick.open === true && afterClick.hasHead === true && afterClick.hasSearchbar === true],
    ['landing lists all 7 type exemplars', landing.cardCount >= 7 && landing.allTypesPresent === true],
    ['calcium card -> Calcium entity page', /CALCIUM/i.test(calcium.name)],
    ['calcium meta: NUTRIENT · 8 entries', /NUTRIENT/i.test(calcium.meta) && /8/.test(calcium.meta)],
    ['calcium: >= 4 facet sections', calcium.facetCount >= 4],
    ['calcium: "IN THE BODY" + "HOW IT WORKS" sections present', calcium.facets.includes('IN THE BODY') && calcium.facets.includes('HOW IT WORKS')],
    ['calcium: all 8 claims listed as FAQ rows', calcium.claimCount === 8],
    ['calcium claim row: question + preview render', calcium.firstQ === true && calcium.firstPreview === true],
    ['calcium claim row: verbatim + composed cite (IMMORTALITY)', calcium.firstVerbatim === true && calcium.firstCite === true],
    ['entity back button -> browse landing', afterBack.landingShown === true && afterBack.entityGone === true],
    ['synonym query "quicksilver" -> Mercury entity', /MERCURY/i.test(mercury.name)],
    ['mercury: all 13 claims as FAQ rows', mercury.claimCount === 13],
    ['mercury: multiple facet sections (>= 5)', mercury.facetCount >= 5],
    ['mercury: dual-home claim shows RELATED pills', mercury.claimPills >= 1],
    ['mercury: entity-level related pills render', mercury.related >= 1],
    ['condition entity (Diabetes) renders with RELATED pills', /DIABETES/i.test(diabetes.name) && diabetes.claimPills >= 1],
    ['topic entity (Color Therapy) has NO per-claim related pills', /COLOR THERAPY/i.test(colorTherapy.name) && colorTherapy.claimPills === 0],
    ['topic entity (Color Therapy) shows the color-wheel icon', colorTherapy.wheel === true],
    ['concept (Colloidal Minerals) has a clickable RELATED pill', colloidal.linkPills >= 1],
    ['clickable pill navigates (Colloidal → Calcium)', /CALCIUM/i.test(navTest.afterClick)],
    ['BACK returns to the previous card (→ Colloidal Minerals)', /COLLOIDAL/i.test(navTest.afterBack)],
    ['ask: a question resolves to one Ask card', ask.shown === true],
    ['ask: card shows the vaccine/autism question', /vaccine/i.test(ask.q)],
    ['ask: card carries Wallach verbatim + composed cite', ask.hasVerbatim === true && ask.hasCite === true],
    ['ask: "more on" back-link present', ask.hasMore === true],
    ['ask: "more on" returns to the entity page', afterMore.entityShown === true && afterMore.askGone === true],
    ['no-match query -> gentle note + browse landing', noMatch.hasNote === true && noMatch.landingShown === true],
    ['Esc closes drawer', afterEsc.open === false],
    ['bare S reopens drawer', afterS.open === true],
    ['topbar Ask Wallach button opens the Search drawer', afterTopbar.open === true],
    ['no page errors', errs.length === 0],
  ];
  const failed = checks.filter(([, ok]) => !ok).map(([n]) => n);
  await browser.close();
  if (failed.length) { console.log('FAIL', JSON.stringify(failed)); process.exit(1); }
  console.log('PASS · Search drawer · 7-type browse landing · element/nutrient/substance/condition/concept/topic/person entity pages · dual-home chips (Diabetes) vs none (Color Therapy) · Ask card · rail/S/topbar entries');
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
