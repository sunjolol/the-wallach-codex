// tools/render_probe_knowledge.js — Knowledge drawer wiring + Products vault + Essentials.
//
// Usage: node tools/render_probe_knowledge.js   (exit 0 = PASS, non-zero = FAIL)
//
// Verifies the Knowledge drawer end-to-end: the K rail item toggles the overlay,
// the Products tab lists ALL products (each clickable to a full detail panel),
// the Essentials tab shows ALL essentials (every section, not paginated) with
// coverage-state tiles, a tile click expands the Wallach deep-dive, and both Esc
// and a bare "K" press close/toggle it. Requires puppeteer.

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
    const el = document.getElementById('drawer-knowledge-mount');
    return {
      open: el ? el.classList.contains('kd-open') : null,
      hasHead: el ? el.querySelector('.kd-knh') !== null : null,
    };
  });

  // 1. Closed at boot.
  const boot = await drawerState();

  // 2. Click the K rail item -> opens.
  await page.evaluate(() => document.querySelector('[data-rail-nav="knowledge"]')?.click());
  await wait(300);
  const afterClick = await drawerState();

  // 2b. Tab bar — the 5 vision tabs (Home / Essentials / Conditions / Explore /
  //     Products), Home active by default; Corpus + Doctrine removed as tabs.
  const tabBar = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const tabs = root ? [...root.querySelectorAll('.kd-knh__tab')].map(t => (t.textContent || '').trim()) : [];
    const active = root ? (root.querySelector('.kd-knh__tab.active')?.textContent || '').trim() : '';
    const homeShown = root ? root.querySelector('.kd-home') !== null : false;
    return { tabs, active, homeShown };
  });

  // 2c. Home "Common conditions" shelf — top-8 condition rows by claim count, each
  //     carrying data-kd-condition (opens its page); header links to the Conditions tab.
  const homeConds = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const rows = root ? [...root.querySelectorAll('.kd-home .sh-condgrid .sh-condrow')] : [];
    return {
      count: rows.length,
      allNav: rows.length > 0 && rows.every(r => (r.getAttribute('data-kd-condition') || '').length > 0),
      firstMeta: rows[0] ? (rows[0].querySelector('.sh-condrow__ct')?.textContent || '') : '',
    };
  });

  // 3. Switch to the Products tab; list ALL products (no 30 cap), each clickable.
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-tab="products"]')?.click());
  await wait(300);
  const products = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const heads = root ? [...root.querySelectorAll('.kd-section-head')].map(e => e.textContent.trim()) : [];
    const head = heads.find(t => /PRODUCTS/.test(t)) || '';
    const m = head.match(/PRODUCTS\s*·\s*(\d+)/);
    const rows = root ? [...root.querySelectorAll('.kd-product-row__name')].map(e => e.textContent.trim()) : [];
    const clickable = root ? root.querySelectorAll('.kd-product-row[data-kd-product]').length : 0;
    return {
      head,
      count: m ? parseInt(m[1], 10) : 0,
      rowCount: rows.length,
      clickable,
      firstNames: rows.slice(0, 3),
      anyUnnamed: rows.some(n => n === '(unnamed)' || n === ''),
    };
  });

  // 3b. Click a product row -> the full detail panel opens (price band + label components).
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount .kd-product-row[data-kd-product]')?.click());
  await wait(250);
  const productDeep = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const d = root ? root.querySelector('.kd-product-deep') : null;
    return {
      shown: d !== null,
      hasName: d ? (d.querySelector('.kd-essential-deep__name')?.textContent || '').length > 0 : false,
      hasPrice: d ? d.querySelector('.kd-product-deep__price') !== null : false,
      hasComponent: d ? d.querySelector('.kd-product-comp') !== null : false,
      hasFactsOrBlend: d ? (d.querySelector('.kd-product-nut') !== null || d.querySelector('.kd-product-blend') !== null) : false,
    };
  });
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-action="product-close"]')?.click());
  await wait(150);

  // 3c. Products search matches COMPOSITION, not just the name: "boron" (a trace mineral
  //     delivered THROUGH blends, absent from most labels) narrows to the products that
  //     carry it — proving the per-row data-search index (delivered essentials + label
  //     ingredients). The clear (×) affordance must also appear while a query is active.
  await page.click('#drawer-knowledge-mount .kd-search-input');
  await page.type('#drawer-knowledge-mount .kd-search-input', 'boron', { delay: 10 });
  await wait(150);
  const prodSearch = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const all = [...root.querySelectorAll('.kd-product-row')];
    const visible = all.filter(r => !r.classList.contains('kd-hidden'));
    const nameHasBoron = visible.some(r => /boron/i.test(r.querySelector('.kd-product-row__name')?.textContent || ''));
    const searchWrap = root.querySelector('.kd-search');
    const clearBtn = root.querySelector('.kd-search-clear');
    return {
      total: all.length,
      visible: visible.length,
      // >=1 match whose NAME lacks "boron" => it matched via composition / ingredients.
      matchedByComposition: visible.length > 0 && !nameHasBoron,
      hasQueryClass: searchWrap ? searchWrap.classList.contains('has-query') : false,
      clearVisible: clearBtn ? getComputedStyle(clearBtn).display !== 'none' : false,
    };
  });
  // 3d. Clear BUTTON resets the filter in one click (no held backspace).
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount .kd-search-clear')?.click());
  await wait(120);
  const prodClear = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const all = [...root.querySelectorAll('.kd-product-row')];
    const input = root.querySelector('.kd-search-input');
    return {
      visible: all.filter(r => !r.classList.contains('kd-hidden')).length,
      total: all.length,
      inputEmpty: input ? input.value === '' : false,
    };
  });

  // 4. Essentials tab -> ALL essentials shown (every section), then click a tile
  //    to expand the Wallach deep-dive.
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-tab="essentials"]')?.click());
  await wait(300);
  const essentials = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const tiles = root ? [...root.querySelectorAll('.kd-essential-tile')] : [];
    const heads = root ? [...root.querySelectorAll('.kd-section-head')].map(e => e.textContent.trim()) : [];
    const stateTiles = tiles.filter(t => t.classList.contains('kd-essential-tile--covered') || t.classList.contains('kd-essential-tile--partial')).length;
    return { tileCount: tiles.length, sectionCount: heads.length, stateTiles };
  });
  // Click Magnesium (11+ sealed claims) — its tile expands the data-driven entity page.
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-essential="Magnesium"]')?.click());
  await wait(250);
  const deep = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const d = root ? root.querySelector('.kd-essential-deep.kd-ep') : null;
    const recordCards = d ? [...d.querySelectorAll('.kd-ep-kind .kd-ep-claim')] : [];
    return {
      shown: d !== null,
      hasPill: d ? d.querySelector('.kd-essential-deep__status-pill') !== null : false,
      hasName: d ? (d.querySelector('.kd-ep-hero__name')?.textContent || '').length > 0 : false,
      hasGlance: d ? d.querySelector('.kd-ep-op') !== null : false,
      hasBar: d ? d.querySelector('.kd-ep-bar') !== null : false,
      recordShown: d ? d.querySelector('.kd-ep-record') !== null : false,
      recordClaimCount: recordCards.length,
    };
  });

  // Trace essential (no numeric Wallach target) shows the covered/not-covered pill only — no bar.
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-essential="Dysprosium"]')?.click());
  await wait(200);
  const traceMeter = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const d = root ? root.querySelector('.kd-essential-deep.kd-ep') : null;
    return {
      hasBar: d ? d.querySelector('.kd-ep-bar') !== null : null,
      hasPill: d ? d.querySelector('.kd-essential-deep__status-pill') !== null : null,
    };
  });

  // Best sources (recommender ranking, ep-src rows) — a row opens the product panel on Products.
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-essential="Magnesium"]')?.click());
  await wait(200);
  const magSources = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const rows = root ? [...root.querySelectorAll('.kd-ep-src[data-kd-product]')] : [];
    return { count: rows.length, cursor: rows[0] ? getComputedStyle(rows[0]).cursor : '' };
  });
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount .kd-ep-src[data-kd-product]')?.click());
  await wait(250);
  const chipToProduct = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const d = root ? root.querySelector('.kd-product-deep') : null;
    const active = root ? (root.querySelector('.kd-knh__tab.active')?.textContent || '') : '';
    return { productShown: d !== null, onProductsTab: /Products/i.test(active) };
  });
  chipToProduct.srcCount = magSources.count;
  chipToProduct.srcCursor = magSources.cursor;

  // 4b. Conditions tab — list over conditions.json + click a condition to expand
  //     the role-grouped deep view (causes/protocols/doses/... with citations).
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-tab="conditions"]')?.click());
  await wait(300);
  const conditions = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const rows = root ? [...root.querySelectorAll('.kd-condition-row')] : [];
    return { rowCount: rows.length };
  });
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-condition="diabetes"]')?.click());
  await wait(250);
  const condDeep = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const d = root ? root.querySelector('.kd-condition-deep') : null;
    const claims = d ? [...d.querySelectorAll('.kd-claim')] : [];
    const first = claims[0] || null;
    const subs = d ? [...d.querySelectorAll('.kd-corpus__sub')].map(s => s.textContent.trim()) : [];
    const synopsis = d ? (d.querySelector('.kd-condition-deep__synopsis')?.textContent || '') : '';
    // The role-labeled chip groups must back the synopsis: a "deficiency of …"
    // lead-in requires a DEFICIENCY / CAUSE group, a "centers on …" a TREATED WITH
    // group — so the lead-in never disagrees with the chips (Luneth 2026-07-01).
    const synopsisCoherent =
      (!/deficiency of/.test(synopsis) || subs.some(s => /DEFICIENCY/.test(s))) &&
      (!/centers on/.test(synopsis) || subs.some(s => /TREATED/.test(s)));
    return {
      shown: d !== null,
      claimCount: claims.length,
      groupCount: d ? d.querySelectorAll('.kd-corpus__group').length : 0,
      firstCite: first ? /DEAD DOCTORS|DDDL|RARE EARTHS|EPIGENETICS|IMMORTALITY|PLAY DOCTOR|YOUR HEAD/i.test(first.querySelector('.kd-claim__cite')?.textContent || '') : false,
      subLabels: subs,
      synopsisCoherent,
      hasUmbrellaTip: !!(d && d.querySelector('.kd-condition-deep__umbrella-tip')),
      glossCount: root ? root.querySelectorAll('.gloss').length : 0,
      glossSample: (() => { const g = root && root.querySelector('.gloss'); return g ? { word: g.textContent, def: g.getAttribute('data-def'), hasTabindex: g.getAttribute('tabindex') === '0' } : null; })(),
    };
  });

  // 4b-unit. Archaic-clinical-unit gloss -- the autoimmune_disorders claim carries
  //     "cc" in Wallach's verbatim; it must render as a .gloss whose definition
  //     explains the unit (units layer, memory: term-gloss-standard).
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-condition="autoimmune_disorders"]')?.click());
  await wait(250);
  const unitGloss = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const defs = root ? [...root.querySelectorAll('.gloss')].map(g => g.getAttribute('data-def') || '') : [];
    return { hasUnit: defs.some(d => /cubic centimeter|milliliter/i.test(d)) };
  });

  // 4c. Umbrella tip -- an UMBRELLA condition (cancer) shows the "broad category"
  //     note with dynamic subtype examples; the leaf above (diabetes) must NOT.
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-condition="cancer"]')?.click());
  await wait(250);
  const umbrellaTip = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const d = root ? root.querySelector('.kd-condition-deep') : null;
    const tip = d ? d.querySelector('.kd-condition-deep__umbrella-tip') : null;
    return {
      shown: tip !== null,
      hasExample: tip ? /Breast Cancer|Colon Cancer/.test(tip.textContent) : false,
    };
  });

  // 4d. Search — typing narrows the active tab's rows AND matches CONTENT, not
  //     just the visible title: "smell" surfaces Anosmia (whose title lacks the
  //     word) via its hidden data-search blob (nutrients/symptoms/claim text).
  await page.click('#drawer-knowledge-mount .kd-search-input');
  await page.type('#drawer-knowledge-mount .kd-search-input', 'smell', { delay: 10 });
  await wait(150);
  const search = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const all = root ? [...root.querySelectorAll('.kd-condition-row')] : [];
    const visible = all.filter(r => !r.classList.contains('kd-hidden'));
    const anosmia = visible.find(r => r.getAttribute('data-kd-condition') === 'anosmia') || null;
    return {
      total: all.length,
      visible: visible.length,
      anosmiaVisible: anosmia !== null,
      anosmiaTitleHasSmell: anosmia ? /smell/i.test(anosmia.querySelector('.kd-condition-row__name')?.textContent || '') : false,
    };
  });

  // 4e. Live highlight — click into Anosmia (a CONTENT match) and confirm the
  //     matched term is highlighted in its deep-view (warm <mark class="kd-search-hl">).
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-condition="anosmia"]')?.click());
  await wait(150);
  const highlight = await page.evaluate(() => {
    const deep = document.querySelector('#drawer-knowledge-mount .kd-condition-deep');
    const marks = deep ? [...deep.querySelectorAll('mark.kd-search-hl')] : [];
    return {
      deepShown: deep !== null,
      markCount: marks.length,
      allSmell: marks.length > 0 && marks.every(m => (m.textContent || '').toLowerCase() === 'smell'),
    };
  });
  await page.evaluate(() => {
    const i = document.querySelector('#drawer-knowledge-mount .kd-search-input');
    if (i) { i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await wait(150);
  const searchClear = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const all = root ? [...root.querySelectorAll('.kd-condition-row')] : [];
    return { total: all.length, visible: all.filter(r => !r.classList.contains('kd-hidden')).length };
  });

  // 4f. Explore tab — the off-path index renders type-grouped chips; a chip opens that
  //     entity's faceted topic page (hero + colour-coded facets + the shared claim cards).
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-tab="explore"]')?.click());
  await wait(300);
  const explore = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    return {
      groups: root.querySelectorAll('.kd-explore-group').length,
      chips: root.querySelectorAll('.kd-explore-chip').length,
      hasMercury: !!root.querySelector('[data-kd-topic="mercury"]'),
    };
  });
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-topic="mercury"]')?.click());
  await wait(300);
  const topic = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const kt = root.querySelector('.kt-page');
    const firstCard = kt ? kt.querySelector('.kd-ep-claim') : null;
    return {
      shown: kt !== null,
      title: kt ? (kt.querySelector('.kt-title h1')?.textContent || '') : '',
      facets: root.querySelectorAll('.kt-page .kd-ep-facet').length,
      cards: root.querySelectorAll('.kt-page .kd-ep-claim').length,
      hasLede: kt ? (kt.querySelector('.kt-lede')?.textContent || '').length > 0 : false,
      hasCite: firstCard ? /IMMORTALITY|RARE EARTHS|DEAD DOCTORS|PLAY DOCTOR|EPIGENETICS|YOUR HEAD/i.test(firstCard.querySelector('.kd-ep-claim__cite')?.textContent || '') : false,
    };
  });

  // 5. Esc closes.
  await page.keyboard.press('Escape');
  await wait(200);
  const afterEsc = await drawerState();

  // 6. Bare "K" reopens.
  await page.keyboard.press('KeyK');
  await wait(200);
  const afterK = await drawerState();

  const out = { boot, afterClick, tabBar, homeConds, products, productDeep, prodSearch, prodClear, chipToProduct, essentials, deep, traceMeter, conditions, condDeep, unitGloss, umbrellaTip, afterEsc, afterK, search, highlight, searchClear, explore, topic };
  console.log('KNOWLEDGE', JSON.stringify(out));
  console.log('PAGE_ERRORS', errs.length, errs.slice(0, 5).join(' | '));

  const checks = [
    ['drawer closed at boot', boot.open === false],
    ['rail K opens drawer', afterClick.open === true && afterClick.hasHead === true],
    ['tab bar: exactly the 5 vision tabs', tabBar.tabs.length === 5 && ['Home','Essentials','Conditions','Explore','Products'].every(t => tabBar.tabs.includes(t))],
    ['tab bar: Corpus + Doctrine removed', !tabBar.tabs.includes('Corpus') && !tabBar.tabs.includes('Doctrine')],
    ['tab bar: Home is the default active tab', tabBar.active === 'Home'],
    ['home: tab renders its container', tabBar.homeShown === true],
    ['home: Common conditions shelf shows top-8 rows', homeConds.count === 8],
    ['home: every condition row carries the nav attr', homeConds.allNav === true],
    ['home: condition row meta = "N claims · M nutrients"', /\d+ claims? · \d+ nutrients?/.test(homeConds.firstMeta)],
    ['products count parsed from head', products.count > 0],
    ['products: ALL listed (no 30 cap)', products.rowCount === products.count && products.rowCount >= 200],
    ['products: every row is clickable', products.clickable === products.rowCount],
    ['no unnamed product rows', products.anyUnnamed === false],
    ['product row opens the detail panel (price + components + facts/blend)', productDeep.shown === true && productDeep.hasName === true && productDeep.hasPrice === true && productDeep.hasComponent === true && productDeep.hasFactsOrBlend === true],
    ['essentials BEST SOURCES list renders (Magnesium)', chipToProduct.srcCount > 0],
    ['best-source rows show a pointer cursor (look clickable)', chipToProduct.srcCursor === 'pointer'],
    ['best-source row opens the product panel on the Products tab', chipToProduct.productShown === true && chipToProduct.onProductsTab === true],
    ['essentials: all shown (>= 90 tiles)', essentials.tileCount >= 90],
    ['essentials: every section present (>= 4 heads)', essentials.sectionCount >= 4],
    ['essentials: coverage states rendered', essentials.stateTiles > 0],
    ['essentials: Magnesium tile expands the entity page', deep.shown === true && deep.hasName === true && deep.hasGlance === true],
    ['entity page: the full record renders with claim cards (Magnesium)', deep.recordShown === true && deep.recordClaimCount > 0],
    ['coverage: numeric target shows the real ep-bar (Magnesium)', deep.hasBar === true],
    ['coverage: trace element shows the pill only, no bar (Dysprosium)', traceMeter.hasBar === false && traceMeter.hasPill === true],
    ['conditions: list rendered', conditions.rowCount >= 1],
    ['conditions: deep view opens (diabetes)', condDeep.shown === true],
    ['conditions: claims grouped by role', condDeep.groupCount >= 1 && condDeep.claimCount >= 1],
    ['conditions: claim cites the book', condDeep.firstCite === true],
    ['conditions: synopsis backed by a labeled chip group', condDeep.synopsisCoherent === true],
    ['conditions: leaf condition has NO umbrella tip (diabetes)', condDeep.hasUmbrellaTip === false],
    ['glossary: jargon terms decorated + defined + focusable', condDeep.glossCount > 0 && condDeep.glossSample !== null && !!condDeep.glossSample.def && condDeep.glossSample.hasTabindex === true],
    ['glossary: archaic clinical unit (cc) glossed in a verbatim', unitGloss.hasUnit === true],
    ['conditions: umbrella shows broad-category tip w/ examples (cancer)', umbrellaTip.shown === true && umbrellaTip.hasExample === true],
    ['search: typing narrows the rows', search.total > search.visible && search.visible >= 1],
    ['search: content match surfaces Anosmia (title lacks "smell")', search.anosmiaVisible === true && search.anosmiaTitleHasSmell === false],
    ['search: deep-view live-highlights the matched term (smell)', highlight.deepShown === true && highlight.markCount >= 1 && highlight.allSmell === true],
    ['search: clearing restores all rows', searchClear.visible === searchClear.total && searchClear.total === search.total],
    ['products search: composition match narrows rows (boron via blends)', prodSearch.visible > 0 && prodSearch.visible < prodSearch.total && prodSearch.matchedByComposition === true],
    ['products search: clear (×) affordance appears while querying', prodSearch.hasQueryClass === true && prodSearch.clearVisible === true],
    ['products search: clear button resets the filter in one click', prodClear.visible === prodClear.total && prodClear.inputEmpty === true],
    ['Esc closes drawer', afterEsc.open === false],
    ['bare K reopens drawer', afterK.open === true],
    ['explore: type-grouped chips render (Mercury present)', explore.groups >= 4 && explore.chips >= 30 && explore.hasMercury === true],
    ['explore: a chip opens the faceted topic page (Mercury, 5+ facets, 8+ cards)', topic.shown === true && topic.title === 'Mercury' && topic.facets >= 5 && topic.cards >= 8],
    ['topic page: hero lede + Wallach-cited claim cards', topic.hasLede === true && topic.hasCite === true],
    ['no page errors', errs.length === 0],
  ];
  const failed = checks.filter(([, ok]) => !ok).map(([n]) => n);
  await browser.close();
  if (failed.length) { console.log('FAIL', JSON.stringify(failed)); process.exit(1); }
  console.log('PASS · Knowledge drawer wired · Products list-all + clickable detail panel + essentials-chip link · Essentials/Conditions deep-dives + sealed-corpus claims');
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
