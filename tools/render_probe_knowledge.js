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

  // 2d. Home "Explore" preview — curated topic chips (data-kd-topic), A-Z by name.
  const homeExplore = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const chips = root ? [...root.querySelectorAll('.kd-home .kd-explore-cloud .kd-explore-chip')] : [];
    const names = chips.map(c => (c.textContent || '').trim());
    const sorted = names.slice().sort((a, b) => a.localeCompare(b));
    return {
      count: chips.length,
      allNav: chips.length > 0 && chips.every(c => (c.getAttribute('data-kd-topic') || '').length > 0),
      sortedAZ: names.join('|') === sorted.join('|'),
    };
  });

  // 2f. Home live-suggest now covers Explore TOPICS, not just essentials/conditions. Typing a topic
  //     name ("testosterone") must surface a data-kd-topic result -- previously it matched NOTHING
  //     (the reported bug: Explore topics were absent from the home search index).
  await page.click('#drawer-knowledge-mount .kh-search');
  await page.type('#drawer-knowledge-mount .kh-search', 'testosterone', { delay: 10 });
  await wait(200);
  const homeTopicSearch = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const res = root ? root.querySelector('.sh-search__results') : null;
    const rows = res ? [...res.querySelectorAll('.sh-res')] : [];
    const topicRow = rows.find(r => r.getAttribute('data-kd-topic') === 'testosterone') || null;
    const groups = res ? [...res.querySelectorAll('.sh-res__group')].map(g => (g.textContent || '').trim()) : [];
    return { rowCount: rows.length, hasTopic: topicRow !== null, groups };
  });
  await page.evaluate(() => { const i = document.querySelector('#drawer-knowledge-mount .kh-search'); if (i) { i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); } });
  await wait(120);

  // 2e. Foods & Absorption tab -- the curated "second prong" landing: a hero with the
  //     mantra lede + the two-pronged thesis rendered as the sealed crown-jewel claim cards,
  //     facet-grouped (basics teal, protocol green) and Wallach-cited. Section 04 ("You can't
  //     absorb what you can't break down") was redesigned 2026-07-24 into a DESIGNED sequence:
  //     a pH ladder (two Wallach anchor cards + blood band), the fortress cutaways, an inversion
  //     callout, ONE pull-stat, the Wallach "sterile" pull-quote, and the Ultimate Enzymes CTA
  //     (strip amounts + $/serving DERIVED live from the product DB) -- then the shared full
  //     record (thesis + enzyme claims) inside the section. Asserted by its own parts.
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-tab="foods"]')?.click());
  await wait(300);
  const foods = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const pageEl = root ? root.querySelector('.kd-foods') : null;
    const cards = pageEl ? [...pageEl.querySelectorAll('.kd-ep-claim')] : [];
    const enzSec = pageEl ? pageEl.querySelector('.kd-foods-enz') : null;
    const enzCards = enzSec ? [...enzSec.querySelectorAll('.kd-ep-claim')] : [];
    const cites = cards.map(c => c.querySelector('.kd-ep-claim__cite')?.textContent || '');
    return {
      shown: pageEl !== null,
      headlineLen: pageEl ? (pageEl.querySelector('.kd-foods-hero__h')?.textContent || '').length : 0,
      hasDeck: pageEl ? (pageEl.querySelector('.kd-foods-hero__deck')?.textContent || '').length > 0 : false,
      hasEyebrow: pageEl ? pageEl.querySelector('.kd-foods-eyebrow__rule') !== null : false,
      hasBrand: pageEl ? pageEl.querySelector('.kd-foods-brand') !== null : false,
      hasScan: pageEl ? (pageEl.querySelector('.kd-foods-scan')?.textContent || '').length > 0 : false,
      noScuffedPulse: pageEl ? pageEl.querySelector('.kd-foods-hero .ds-pulse') === null : false,
      hasOrangeSubject: pageEl ? (pageEl.querySelector('.kd-foods-eyebrow__r')?.textContent || '').length > 0 : false,
      hasSecHeaders: pageEl ? (pageEl.querySelectorAll('.kd-foods-sec').length >= 4 && ['01','02','03','04'].every(k => [...pageEl.querySelectorAll('.kd-foods-sec__num')].map(n => (n.textContent || '').trim()).includes(k))) : false,
      hasExplain: pageEl ? (pageEl.querySelector('.kd-foods-villi__intro')?.textContent || '').length > 40 : false,
      hasVilliTerm: pageEl ? pageEl.querySelector('.kd-foods-term.gloss[data-def]') !== null : false,
      hasPullQuote: pageEl ? (pageEl.querySelector('.kd-foods-pq .ds-pull-quote') !== null && pageEl.querySelector('.kd-foods-pq mark.ds-mark') !== null && (pageEl.querySelector('.kd-foods-pq__page')?.textContent || '').includes('598')) : false,
      hasStat: pageEl ? pageEl.querySelector('.ds-pull-stat .ds-pull-stat__num') !== null : false,
      villiArts: pageEl ? pageEl.querySelectorAll('.kd-foods-villi__art').length : 0,
      villiFingers: pageEl ? pageEl.querySelectorAll('.kd-foods-villi__v').length : 0,
      villiDots: pageEl ? pageEl.querySelectorAll('.kd-foods-villi__dot').length : 0,
      removeItems: pageEl ? pageEl.querySelectorAll('.kd-foods-item--remove').length : 0,
      eatItems: pageEl ? pageEl.querySelectorAll('.kd-foods-item--eat').length : 0,
      formItems: pageEl ? pageEl.querySelectorAll('.kd-foods-item--form').length : 0,
      itemsLinked: pageEl ? [...pageEl.querySelectorAll('.kd-foods-item')].every(b => (b.getAttribute('data-kd-topic') || '').length > 0) : false,
      facets: pageEl ? pageEl.querySelectorAll('.kd-ep-facet').length : 0,
      cards: cards.length,
      enzymeCards: enzCards.length,
      // section 04 redesign (2026-07-24): pH ladder + fortress cutaways + inversion callout + one
      // pull-stat + the Wallach "sterile" pull-quote + the Ultimate Enzymes CTA. Amounts/price on
      // the CTA are DERIVED live from the product DB (never hand-typed), so the strip is asserted to
      // carry a real "<n> mg" per tile and the bar to route to the ultimate-enzymes product page.
      phCards: enzSec ? enzSec.querySelectorAll('.sxb-scale .sxb-card').length : 0,
      phBand: enzSec ? enzSec.querySelector('.sxb-scale .sxb-band') !== null : false,
      phTriad: enzSec ? enzSec.querySelectorAll('.sxb-triad__i').length : 0,
      frtCells: enzSec ? enzSec.querySelectorAll('.frt-scene .frt-cell').length : 0,
      frtFigs: enzSec ? enzSec.querySelectorAll('.frt-scene svg').length : 0,
      frtLegend: enzSec ? enzSec.querySelectorAll('.frt-legend__i').length : 0,
      inversion: enzSec ? enzSec.querySelector('.sx-callout .sx-callout__b mark.ds-mark') !== null : false,
      sec04Stat: enzSec ? (enzSec.querySelector('.ds-pull-stat .ds-pull-stat__num')?.textContent || '').trim() : '',
      sec04Pq: enzSec ? (enzSec.querySelector('.kd-foods-pq mark.ds-mark')?.textContent || '').trim() : '',
      enzTiles: enzSec ? enzSec.querySelectorAll('.ue-strip .ue-tile').length : 0,
      enzAmounts: enzSec ? [...enzSec.querySelectorAll('.ue-tile__amt')].map(a => (a.textContent || '').trim()) : [],
      ctaProduct: enzSec ? (enzSec.querySelector('.ue-bar')?.getAttribute('data-kd-product') || '') : '',
      ctaPrice: enzSec ? (enzSec.querySelector('.ue-bar .ue-bar__pn')?.textContent || '').trim() : '',
      recordWrap: enzSec ? enzSec.querySelector('.sxr-wrap') !== null : false,
      allCited: cards.length > 0 && cites.every(c => /EPIGENETICS|DEAD DOCTORS|RARE EARTHS|IMMORTALITY|PLAY DOCTOR|YOUR HEAD/i.test(c)),
    };
  });

  // 3. Switch to the Products tab; list ALL products (no 30 cap), each clickable.
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-tab="products"]')?.click());
  await wait(300);
  const products = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const heads = root ? [...root.querySelectorAll('.kd-section-head')].map(e => e.textContent.trim()) : [];
    const head = heads.find(t => /PRODUCTS/.test(t)) || '';
    const m = head.match(/ALL\s+(\d+)\s+PRODUCTS/) || head.match(/PRODUCTS\s*·\s*(\d+)/);
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
    const d = root ? root.querySelector('.kd-ep--prod') : null;
    return {
      shown: d !== null,
      hasName: d ? (d.querySelector('.kd-ep-hero__name')?.textContent || '').length > 0 : false,
      hasGlance: d ? d.querySelector('.kd-pf-glance') !== null : false,
      hasComponent: d ? d.querySelector('.kd-pf-comp') !== null : false,
      hasFactsOrBlend: d ? (d.querySelector('.kd-pf-nrow') !== null || d.querySelector('.kd-pf-blend') !== null) : false,
      formTinted: d ? (d.getAttribute('style') || '').includes('--form') && d.querySelector('.kd-ep-hero__sym--form') !== null : false,
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
  // The Essentials MENU ITEM was removed 2026-07-23; the surface is reached through one of its
  // three doors. Use door 1 - Home's "open the full table" link - so this probe exercises a real
  // user path rather than a button that no longer exists.
  await page.evaluate(() => {
    document.querySelector('#drawer-knowledge-mount [data-kd-tab="home"]')?.click();
  });
  await wait(400);
  await page.evaluate(() => {
    const a = [...document.querySelectorAll('#drawer-knowledge-mount .ep-seclabel a')]
      .find(e => /full table/i.test(e.textContent || ''));
    if (a) { a.click(); }
  });
  await wait(300);
  const essentials = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const tiles = root ? [...root.querySelectorAll('.sh-tile')] : [];
    const heads = root ? [...root.querySelectorAll('.sh-subhead')].map(e => e.textContent.trim()) : [];
    const withDot = tiles.filter(t => t.querySelector('.kd-cov-dot')).length;
    const stateTiles = tiles.filter(t => t.querySelector('.kd-cov-dot--covered, .kd-cov-dot--partial')).length;
    const hasLegend = root ? root.querySelector('.kd-cov-legend') !== null : false;
    return { tileCount: tiles.length, sectionCount: heads.length, withDot, stateTiles, hasLegend };
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
      recordKindsCollapsed: d ? [...d.querySelectorAll('.kd-ep-kind')].some(k => !k.open) : null,
    };
  });

  // Rare-earth GROUP essential (trace_pdm, no per-element dose) shows the shared group meter
  // (Σ vehicle mg vs the 924 mg goal) + the "rare-earth group" tag + the group note — NOT a pill.
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-essential="Dysprosium"]')?.click());
  await wait(200);
  const traceMeter = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const d = root ? root.querySelector('.kd-essential-deep.kd-ep') : null;
    return {
      hasBar: d ? d.querySelector('.kd-ep-bar') !== null : null,
      hasGroupTag: d ? d.querySelector('.kd-ep-pdm-tag') !== null : null,
      hasNote: d ? d.querySelector('.kd-ep-pdm-note') !== null : null,
      hasPill: d ? d.querySelector('.kd-essential-deep__status-pill') !== null : null,
      recordKindsOpen: d ? ([...d.querySelectorAll('.kd-ep-kind')].length > 0 && [...d.querySelectorAll('.kd-ep-kind')].every(k => k.open)) : null,
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
    const d = root ? root.querySelector('.kd-ep--prod') : null;
    const active = root ? (root.querySelector('.kd-knh__tab.active')?.textContent || '') : '';
    return { productShown: d !== null, onProductsTab: /Products/i.test(active) };
  });
  chipToProduct.srcCount = magSources.count;
  chipToProduct.srcCursor = magSources.cursor;

  // 4b. Conditions tab — list over conditions.json + click a condition to expand
  //     the entity-page condition detail (kd-ep--cond: synopsis lede + protocol + nutrients +
  //     the full record grouped by kind, each claim Wallach-cited). Redesigned Phase H2 chunk 2.
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
    const d = root ? root.querySelector('.kd-ep--cond') : null;
    const claims = d ? [...d.querySelectorAll('.kd-ep-claim')] : [];
    const first = claims[0] || null;
    // The nutrient-block labels (To restore / Caused by these deficiencies / Also cited alongside)
    const subs = d ? [...d.querySelectorAll('.kd-ep-nutri__lbl')].map(s => s.textContent.replace(/\s+/g, ' ').trim()) : [];
    const synopsis = d ? (d.querySelector('.kd-ep-lede')?.textContent || '') : '';
    // The nutrient labels must back the synopsis: a "deficiency of …" lead-in requires a
    // "Caused by these deficiencies" group; a "centers on …" a "To restore" group — so the
    // lead-in never disagrees with the nutrient block (Luneth 2026-07-01, re-anchored H2).
    const synopsisCoherent =
      (!/deficiency of/.test(synopsis) || subs.some(s => /Caused by these deficiencies|To restore/i.test(s))) &&
      (!/centers on|protocol for/.test(synopsis) || subs.some(s => /To restore|Caused by these deficiencies/i.test(s)));
    return {
      shown: d !== null,
      claimCount: claims.length,
      groupCount: d ? d.querySelectorAll('.kd-ep-kind').length : 0,
      firstCite: first ? /DEAD DOCTORS|DDDL|RARE EARTHS|EPIGENETICS|IMMORTALITY|PLAY DOCTOR|YOUR HEAD/i.test(first.querySelector('.kd-ep-claim__cite')?.textContent || '') : false,
      subLabels: subs,
      synopsisCoherent,
      hasUmbrellaTip: !!(d && d.querySelector('.kd-ep-umbrella')),
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
    const d = root ? root.querySelector('.kd-ep--cond') : null;
    const tip = d ? d.querySelector('.kd-ep-umbrella') : null;
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
    const deep = document.querySelector('#drawer-knowledge-mount .kd-ep--cond');
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
      back: kt ? (kt.querySelector('.kd-ep-back')?.textContent || '').trim() : '',
      hasKickerLink: kt ? kt.querySelector('.kt-kicker__link[data-kd-action="explore-home"]') !== null : false,
    };
  });

  // 4g. The kicker "Explore" link is a general jump back to the all-topics grid (independent of origin).
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount .kt-kicker__link')?.click());
  await wait(200);
  const kickerBack = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    return { onGrid: root.querySelector('.kt-page') === null && root.querySelectorAll('.kd-explore-chip').length > 0 };
  });

  // 4h. A topic opened from an Absorption CARD is an overlay ON the Absorption tab: its back button
  //     reads "Go back" (not "All topics") and returns THERE, and a no-'basics' food (beef) still
  //     shows a derived at-a-glance intro lede.
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-tab="foods"]')?.click());
  await wait(250);
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount .kd-foods-item[data-kd-topic="beef"]')?.click());
  await wait(250);
  const foodsTopic = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const kt = root.querySelector('.kt-page');
    return {
      shown: kt !== null,
      title: kt ? (kt.querySelector('.kt-title h1')?.textContent || '') : '',
      back: kt ? (kt.querySelector('.kd-ep-back')?.textContent || '').trim() : '',
      ledeLen: kt ? (kt.querySelector('.kt-lede')?.textContent || '').length : 0,
    };
  });
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount .kd-ep-back')?.click());
  await wait(200);
  const foodsBack = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    // The Absorption landing itself carries .kt-page, so distinguish it from a topic overlay by the
    // topic-only .kt-hero (absent on the Absorption landing, which uses .kd-foods-hero).
    return { onFoods: root.querySelector('.kd-foods') !== null && root.querySelector('.kt-hero') === null };
  });

  // 5. Esc closes.
  await page.keyboard.press('Escape');
  await wait(200);
  const afterEsc = await drawerState();

  // 6. Bare "K" reopens.
  await page.keyboard.press('KeyK');
  await wait(200);
  const afterK = await drawerState();

  const out = { boot, afterClick, tabBar, homeConds, homeExplore, homeTopicSearch, foods, products, productDeep, prodSearch, prodClear, chipToProduct, essentials, deep, traceMeter, conditions, condDeep, unitGloss, umbrellaTip, afterEsc, afterK, search, highlight, searchClear, explore, topic, kickerBack, foodsTopic, foodsBack };
  console.log('KNOWLEDGE', JSON.stringify(out));
  console.log('PAGE_ERRORS', errs.length, errs.slice(0, 5).join(' | '));

  const checks = [
    ['drawer closed at boot', boot.open === false],
    ['rail K opens drawer', afterClick.open === true && afterClick.hasHead === true],
    // Essentials left the MENU on 2026-07-23 (it duplicated Coverage) while staying a live route.
    // Asserting its ABSENCE is the point: if it ever reappears here, that is a regression.
    ['tab bar: exactly the 6 tabs, Essentials absent', tabBar.tabs.length === 6 && ['Home','Absorption','ORAC','Conditions','Explore','Products'].every(t => tabBar.tabs.includes(t)) && !tabBar.tabs.includes('Essentials')],
    ['tab bar: Corpus + Doctrine removed', !tabBar.tabs.includes('Corpus') && !tabBar.tabs.includes('Doctrine')],
    ['tab bar: Home is the default active tab', tabBar.active === 'Home'],
    ['home: tab renders its container', tabBar.homeShown === true],
    ['home: Common conditions shelf shows top-8 rows', homeConds.count === 8],
    ['home: every condition row carries the nav attr', homeConds.allNav === true],
    ['home: condition row meta = "N claims · M nutrients"', /\d+ claims? · \d+ nutrients?/.test(homeConds.firstMeta)],
    ['home search: Explore topic surfaces (testosterone -> data-kd-topic result)', homeTopicSearch.hasTopic === true],
    ['products count parsed from head', products.count > 0],
    ['products: ALL listed (no 30 cap)', products.rowCount === products.count && products.rowCount >= 200],
    ['products: every row is clickable', products.clickable === products.rowCount],
    ['no unnamed product rows', products.anyUnnamed === false],
    ['product row opens the kd-ep--prod detail (hero name + at-a-glance + supplement facts, form-tinted)', productDeep.shown === true && productDeep.hasName === true && productDeep.hasGlance === true && productDeep.hasComponent === true && productDeep.hasFactsOrBlend === true && productDeep.formTinted === true],
    ['essentials BEST SOURCES list renders (Magnesium)', chipToProduct.srcCount > 0],
    ['best-source rows show a pointer cursor (look clickable)', chipToProduct.srcCursor === 'pointer'],
    ['best-source row opens the product panel on the Products tab', chipToProduct.productShown === true && chipToProduct.onProductsTab === true],
    ['essentials: all shown (>= 90 tiles)', essentials.tileCount >= 90],
    ['essentials: 6 demo subsections', essentials.sectionCount >= 6],
    // Luneth 2026-07-27: the covered/not-covered LEGEND + the per-tile status DOT were removed from
    // THIS drawer screen (they duplicated the Coverage page, which keeps its own). Asserting their
    // ABSENCE makes a future re-addition a regression -- same guard style as "Essentials absent" above.
    ['essentials screen: coverage legend removed (this screen only)', essentials.hasLegend === false],
    ['essentials screen: no coverage dot on any tile (this screen only)', essentials.withDot === 0],
    ['essentials: Magnesium tile expands the entity page', deep.shown === true && deep.hasName === true && deep.hasGlance === true],
    ['entity page: the full record renders with claim cards (Magnesium)', deep.recordShown === true && deep.recordClaimCount > 0],
    ['coverage: numeric target shows the real ep-bar (Magnesium)', deep.hasBar === true],
    ['coverage: rare-earth group shows the shared group meter + tag + note, no pill (Dysprosium)', traceMeter.hasBar === true && traceMeter.hasGroupTag === true && traceMeter.hasNote === true && traceMeter.hasPill === false],
    ['record: few-claim entity auto-expands its kind groups (Dysprosium, 2 claims)', traceMeter.recordKindsOpen === true],
    ['record: large entity keeps kind groups collapsed (Magnesium, 89 claims)', deep.recordKindsCollapsed === true],
    ['conditions: list rendered', conditions.rowCount >= 1],
    ['conditions: deep view opens (diabetes)', condDeep.shown === true],
    ['conditions: claims grouped by kind (full record)', condDeep.groupCount >= 1 && condDeep.claimCount >= 1],
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
    ['home: Explore preview = curated topic chips, A-Z, navigable', homeExplore.count >= 10 && homeExplore.count <= 20 && homeExplore.allNav === true && homeExplore.sortedAZ === true],
    ['explore: type-grouped chips render (Mercury present)', explore.groups >= 4 && explore.chips >= 30 && explore.hasMercury === true],
    ['explore: a chip opens the faceted topic page (Mercury, 5+ facets, 8+ cards)', topic.shown === true && topic.title === 'Mercury' && topic.facets >= 5 && topic.cards >= 8],
    ['topic page: hero lede + Wallach-cited claim cards', topic.hasLede === true && topic.hasCite === true],
    ['topic (from Explore): back label = "All topics" + kicker "Explore" link present', /All topics/i.test(topic.back) && topic.hasKickerLink === true],
    ['kicker "Explore" link jumps back to the all-topics grid', kickerBack.onGrid === true],
    ['topic (from Absorption card): overlay w/ derived intro lede (beef has no basics claim)', foodsTopic.shown === true && foodsTopic.title === 'Beef' && foodsTopic.ledeLen > 0],
    ['topic (from Absorption): back label = "Go back" + returns to Absorption', /Go back/i.test(foodsTopic.back) && foodsBack.onFoods === true],
    ['foods: rich landing renders (3-colour lockup + orange subject + 3 numbered headers + pull-stat + 2 villi scans + villi gloss)', foods.shown === true && foods.headlineLen > 12 && foods.hasDeck === true && foods.hasEyebrow === true && foods.hasBrand === true && foods.hasScan === true && foods.noScuffedPulse === true && foods.hasOrangeSubject === true && foods.hasSecHeaders === true && foods.hasExplain === true && foods.hasVilliTerm === true && foods.hasPullQuote === true && foods.hasStat === true && foods.villiArts === 2 && foods.villiFingers >= 14 && foods.villiDots === 12],
    ['foods: full record = 3 thesis + 5 enzyme crown-jewel cards, facet-grouped + Wallach-cited', foods.cards === 8 && foods.facets >= 2 && foods.allCited === true],
    ['foods: section 04 pH ladder -- 2 Wallach anchor cards (stomach 1.0 / pancreatic 8.2) + blood band + why-1.0 triad', foods.phCards === 2 && foods.phBand === true && foods.phTriad === 3],
    ['foods: section 04 fortress scene -- 2 cutaway cells, 2 SVG figures, 4-item legend', foods.frtCells === 2 && foods.frtFigs === 2 && foods.frtLegend === 4],
    ['foods: section 04 inversion callout marks the too-little-acid twist', foods.inversion === true],
    ['foods: section 04 one pull-stat (75%) + the Wallach "sterile" pull-quote', foods.sec04Stat === '75%' && foods.sec04Pq === 'sterile'],
    ['foods: Ultimate Enzymes strip -- 5 tiles, every amount derived live from the product DB', foods.enzTiles === 5 && foods.enzAmounts.filter(a => /\d\s*mg/.test(a)).length === 5],
    ['foods: CTA routes to the ultimate-enzymes product page at the derived $/serving', foods.ctaProduct === 'ultimate-enzymes' && /^\$\d/.test(foods.ctaPrice)],
    ['foods: section 04 ends in the shared full-record wrap', foods.recordWrap === true],
    ['foods: REMOVE/EAT contrast (5/6) + form strip (4) render, all topic-linked', foods.removeItems === 5 && foods.eatItems === 6 && foods.formItems === 4 && foods.itemsLinked === true],
    ['no page errors', errs.length === 0],
  ];
  const failed = checks.filter(([, ok]) => !ok).map(([n]) => n);
  await browser.close();
  if (failed.length) { console.log('FAIL', JSON.stringify(failed)); process.exit(1); }
  console.log('PASS · Knowledge drawer wired · Products list-all + clickable detail panel + essentials-chip link · Essentials/Conditions deep-dives + sealed-corpus claims');
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
