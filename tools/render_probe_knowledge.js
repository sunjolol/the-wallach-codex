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
      hasHead: el ? el.querySelector('.kd-head') !== null : null,
    };
  });

  // 1. Closed at boot.
  const boot = await drawerState();

  // 2. Click the K rail item -> opens.
  await page.evaluate(() => document.querySelector('[data-rail-nav="knowledge"]')?.click());
  await wait(300);
  const afterClick = await drawerState();

  // 2b. Corpus tab (default on open) — books driven by the sealed corpus, NOT a
  //     hard-coded list; real per-book claim counts; planned books 'coming soon'.
  const corpus = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const rows = root ? [...root.querySelectorAll('.kd-book-row:not(.kd-book-row--planned)')] : [];
    const planned = root ? [...root.querySelectorAll('.kd-book-row--planned')] : [];
    const dddl = rows.find(r => /Dead Doctors/i.test(r.querySelector('.kd-book-row__title')?.textContent || ''));
    return {
      bookCount: rows.length,
      plannedCount: planned.length,
      dddlShowsClaims: dddl ? /\d+\s*claims/i.test(dddl.querySelector('.kd-book-row__count')?.textContent || '') : false,
      fakeCites: rows.some(r => /CITES|CHAPTERS/i.test(r.textContent || '')),
    };
  });

  // 2c. Book browser -- a book row opens all its tier-1 claims (incl. the
  //     composition/dose tables that carry no essential/condition), then closes.
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-book="rare-earths"]')?.click());
  await wait(300);
  const bookOpen = await page.evaluate(() => {
    const bd = document.querySelector('#drawer-knowledge-mount .kd-book-deep');
    const claims = bd ? [...bd.querySelectorAll('.kd-claim')] : [];
    return { shown: bd !== null, claimCount: claims.length };
  });
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-action="book-close"]')?.click());
  await wait(200);

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
  // Click Magnesium specifically — it carries 11 sealed DDDL claims, so its
  // deep-dive must render the FROM-THE-CORPUS block (grouped claims + verbatim).
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-essential="Magnesium"]')?.click());
  await wait(250);
  const deep = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const d = root ? root.querySelector('.kd-essential-deep') : null;
    const corpus = root ? root.querySelector('.kd-corpus') : null;
    const claims = corpus ? [...corpus.querySelectorAll('.kd-claim')] : [];
    const first = claims[0] || null;
    return {
      shown: d !== null,
      hasPill: d ? d.querySelector('.kd-essential-deep__status-pill') !== null : false,
      hasName: d ? (d.querySelector('.kd-essential-deep__name')?.textContent || '').length > 0 : false,
      meterText: d ? (d.querySelector('.kd-meter')?.textContent || '').replace(/\s+/g, ' ').trim() : '',
      corpusShown: corpus !== null,
      claimCount: claims.length,
      groupCount: corpus ? corpus.querySelectorAll('.kd-corpus__group').length : 0,
      countTxt: corpus ? (corpus.querySelector('.kd-corpus__count')?.textContent || '').trim() : '',
      firstText: first ? (first.querySelector('.kd-claim__text')?.textContent || '').length > 0 : false,
      firstVerbatim: first ? (first.querySelector('.kd-claim__verbatim')?.textContent || '').length > 0 : false,
      firstCite: first ? /DEAD DOCTORS|DDDL|RARE EARTHS|EPIGENETICS|IMMORTALITY|PLAY DOCTOR|YOUR HEAD/i.test(first.querySelector('.kd-claim__cite')?.textContent || '') : false,
      whyShown: root ? root.querySelector('.kd-why') !== null : false,
      whyHasDerivation: root ? /how we got this/i.test(root.querySelector('.kd-why')?.textContent || '') : false,
    };
  });

  // 4-why. The "why this number?" box appears ONLY where the newest Wallach number
  //   DISAGREES with an older book (Luneth 2026-07-09). Magnesium (Epigenetics 770 vs
  //   LPD 1000) shows it with the full derivation (asserted on `deep` above); Boron --
  //   one book, no earlier figure -- must NOT show it.
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-essential="Boron"]')?.click());
  await wait(200);
  const whyHidden = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    return { boronHasWhy: root ? root.querySelector('.kd-why') !== null : true };
  });

  // 4a. Meter fallback -- a trace essential (no numeric Wallach target) shows the
  //     covered/not-covered pill ONLY, never an invented ratio.
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-essential="Dysprosium"]')?.click());
  await wait(200);
  const traceMeter = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const d = root ? root.querySelector('.kd-essential-deep') : null;
    return {
      hasMeter: d ? d.querySelector('.kd-meter') !== null : null,
      hasPill: d ? d.querySelector('.kd-essential-deep__status-pill') !== null : null,
    };
  });

  // 4a2. Essentials "BEST SOURCES" — the cost-per-nutrient recommender (A3) ranks the
  //       vault products that deliver the essential (rank + delivered amount + breadth/
  //       price), each row clickable -> product detail panel on the Products tab. With no
  //       Wallach target yet, the honest-gap adequacy note must show.
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-essential="Magnesium"]')?.click());
  await wait(200);
  const magSources = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const rows = root ? [...root.querySelectorAll('.kd-source[data-kd-product]')] : [];
    const subs = root ? [...root.querySelectorAll('.kd-essential-deep__sub')].map(s => s.textContent.trim()) : [];
    const first = rows[0] || null;
    return {
      count: rows.length,
      hasHeader: subs.some(s => /BEST SOURCES/i.test(s)),
      firstRank: first ? (first.querySelector('.kd-source__rank')?.textContent || '').trim() : '',
      firstHasAmount: first ? (first.querySelector('.kd-source__amt')?.textContent || '').trim().length > 0 : false,
      firstHasName: first ? (first.querySelector('.kd-source__name')?.textContent || '').trim().length > 0 : false,
      cursor: first ? getComputedStyle(first).cursor : '',
      hasNote: root ? root.querySelector('.kd-source-note') !== null : false,
    };
  });
  // 4a2-exp. BEST SOURCES overflow expander — Magnesium has >8 vault sources, so the top-N
  //          render visible and the rest stay hidden (kd-source--extra) behind the "Show N
  //          more" button until it is clicked, which toggles .is-expanded on the list.
  const srcExpand = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const vis = () => [...root.querySelectorAll('.kd-source[data-kd-product]')]
      .filter(r => getComputedStyle(r).display !== 'none').length;
    const before = vis();
    const btn = root.querySelector('.kd-source-more[data-kd-action="sources-more"]');
    const hadButton = btn !== null;
    if (btn) btn.click();
    const list = root.querySelector('.kd-sources');
    return { hadButton, before, after: vis(), expanded: list ? list.classList.contains('is-expanded') : false };
  });
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount .kd-source[data-kd-product]')?.click());
  await wait(250);
  const chipToProduct = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const d = root ? root.querySelector('.kd-product-deep') : null;
    const active = root ? (root.querySelector('.kd-tab.active')?.textContent || '') : '';
    return { productShown: d !== null, onProductsTab: /Products/i.test(active) };
  });
  // Honest-gap essential (no numeric Wallach target) — Strontium — DOES show the adequacy
  // note over its ranked sources, whereas Magnesium (numeric target) hides it.
  // (Boron was the old example; Epigenetics 2014 gave it a target, so it is no longer a gap.)
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-tab="essentials"]')?.click());
  await wait(120);
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-essential="Strontium"]')?.click());
  await wait(200);
  const gapNote = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    return {
      hasNote: root ? root.querySelector('.kd-source-note') !== null : false,
      sources: root ? root.querySelectorAll('.kd-source[data-kd-product]').length : 0,
    };
  });
  chipToProduct.srcCount = magSources.count;
  chipToProduct.srcCursor = magSources.cursor;
  chipToProduct.hasHeader = magSources.hasHeader;
  chipToProduct.firstRank = magSources.firstRank;
  chipToProduct.firstHasAmount = magSources.firstHasAmount;
  chipToProduct.firstHasName = magSources.firstHasName;
  chipToProduct.magHasNote = magSources.hasNote;
  chipToProduct.gapHasNote = gapNote.hasNote;
  chipToProduct.gapSources = gapNote.sources;

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

  // 4f. Doctrine tab — the app-guarantee cards read from the doctrine-data.json
  //     prose store (Phase E). Assert: 4 cards (the 3 Wallach health cards dropped),
  //     DOCT·01 the featured cornerstone, cites COMPOSED ("ENFORCED BY <real gate>"),
  //     and NO retired "lecture corpus" / dead-invariant text survives.
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-tab="doctrine"]')?.click());
  await wait(300);
  const doctrine = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const cards = root ? [...root.querySelectorAll('.kd-doctrine-card')] : [];
    const cites = cards.map(c => (c.querySelector('.kd-doctrine-card__cite')?.textContent || '').trim());
    const ids = cards.map(c => (c.querySelector('.kd-doctrine-card__id')?.textContent || '').trim());
    const bodies = cards.map(c => c.querySelector('.kd-doctrine-card__body')?.textContent || '').join(' ');
    const featured = root ? root.querySelector('.kd-doctrine-card.featured') : null;
    return {
      count: cards.length,
      allCitesComposed: cites.length > 0 && cites.every(t => /^ENFORCED BY /.test(t)),
      featuredCornerstone: featured ? /CORNERSTONE/.test(featured.querySelector('.kd-doctrine-card__id')?.textContent || '') : false,
      hasLectureText: /lecture/i.test(bodies + ' ' + cites.join(' ') + ' ' + ids.join(' ')),
      hasDeadInvariant: /check_no_unsourced_claims|check_regimen_state_mutation_routing/.test(cites.join(' ')),
      citeSample: cites[0] || '',
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

  const out = { boot, afterClick, corpus, bookOpen, products, productDeep, prodSearch, prodClear, chipToProduct, srcExpand, essentials, deep, traceMeter, conditions, condDeep, unitGloss, umbrellaTip, doctrine, afterEsc, afterK, search, highlight, searchClear };
  console.log('KNOWLEDGE', JSON.stringify(out));
  console.log('PAGE_ERRORS', errs.length, errs.slice(0, 5).join(' | '));

  const checks = [
    ['drawer closed at boot', boot.open === false],
    ['rail K opens drawer', afterClick.open === true && afterClick.hasHead === true],
    ['corpus: in-housed books rendered', corpus.bookCount >= 1],
    ['corpus: DDDL shows a real claim count', corpus.dddlShowsClaims === true],
    ['corpus: no fabricated CITES/CHAPTERS', corpus.fakeCites === false],
    ['corpus: coming-soon books shown', corpus.plannedCount >= 1],
    ['corpus: book row opens a claim browser (rare-earths)', bookOpen.shown === true && bookOpen.claimCount > 0],
    ['products count parsed from head', products.count > 0],
    ['products: ALL listed (no 30 cap)', products.rowCount === products.count && products.rowCount >= 200],
    ['products: every row is clickable', products.clickable === products.rowCount],
    ['no unnamed product rows', products.anyUnnamed === false],
    ['product row opens the detail panel (price + components + facts/blend)', productDeep.shown === true && productDeep.hasName === true && productDeep.hasPrice === true && productDeep.hasComponent === true && productDeep.hasFactsOrBlend === true],
    ['essentials BEST SOURCES list renders with header (Magnesium)', chipToProduct.srcCount > 0 && chipToProduct.hasHeader === true],
    ['best-source rows are ranked (#1) + show a name + delivered amount', chipToProduct.firstRank === '1' && chipToProduct.firstHasName === true && chipToProduct.firstHasAmount === true],
    ['best-source rows show a pointer cursor (look clickable)', chipToProduct.srcCursor === 'pointer'],
    ['best-source row opens the product panel on the Products tab', chipToProduct.productShown === true && chipToProduct.onProductsTab === true],
    ['numeric-target essential hides the honest-gap note (Magnesium adequacy is real)', chipToProduct.magHasNote === false],
    ['honest-gap essential shows the adequacy note over ranked sources (Strontium)', chipToProduct.gapHasNote === true && chipToProduct.gapSources > 0],
    ['essentials: all shown (>= 90 tiles)', essentials.tileCount >= 90],
    ['essentials: every section present (>= 4 heads)', essentials.sectionCount >= 4],
    ['essentials: coverage states rendered', essentials.stateTiles > 0],
    ['essentials: Magnesium tile expands deep-dive', deep.shown === true && deep.hasPill === true && deep.hasName === true],
    ['corpus: claim block rendered in deep-dive', deep.corpusShown === true],
    ['corpus: sealed claims present (Magnesium)', deep.claimCount > 0],
    ['corpus: claims grouped by kind', deep.groupCount > 0],
    ['corpus: claim shows paraphrase + verbatim + citation', deep.firstText && deep.firstVerbatim && deep.firstCite],
    ['meter: numeric target shows intake-vs-goal (Magnesium)', /WALLACH GOAL/.test(deep.meterText)],
    ['why-this-number: box shows with full derivation where a newer book overrode an older (Magnesium)', deep.whyShown === true && deep.whyHasDerivation === true],
    ['why-this-number: box hidden where no earlier figure exists (Boron)', whyHidden.boronHasWhy === false],
    ['meter: trace element shows pill only, no meter (Dysprosium)', traceMeter.hasMeter === false && traceMeter.hasPill === true],
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
    ['doctrine: 4 app-guarantee cards (health cards dropped)', doctrine.count === 4],
    ['doctrine: DOCT·01 is the featured cornerstone', doctrine.featuredCornerstone === true],
    ['doctrine: cites COMPOSED from real gates (ENFORCED BY …)', doctrine.allCitesComposed === true],
    ['doctrine: no retired lecture-corpus text', doctrine.hasLectureText === false],
    ['doctrine: no dead-invariant cite', doctrine.hasDeadInvariant === false],
    ['products search: composition match narrows rows (boron via blends)', prodSearch.visible > 0 && prodSearch.visible < prodSearch.total && prodSearch.matchedByComposition === true],
    ['products search: clear (×) affordance appears while querying', prodSearch.hasQueryClass === true && prodSearch.clearVisible === true],
    ['products search: clear button resets the filter in one click', prodClear.visible === prodClear.total && prodClear.inputEmpty === true],
    ['best sources: expander reveals the hidden overflow rows', srcExpand.hadButton === true && srcExpand.after > srcExpand.before && srcExpand.expanded === true],
    ['Esc closes drawer', afterEsc.open === false],
    ['bare K reopens drawer', afterK.open === true],
    ['no page errors', errs.length === 0],
  ];
  const failed = checks.filter(([, ok]) => !ok).map(([n]) => n);
  await browser.close();
  if (failed.length) { console.log('FAIL', JSON.stringify(failed)); process.exit(1); }
  console.log('PASS · Knowledge drawer wired · Products list-all + clickable detail panel + essentials-chip link · Essentials/Conditions deep-dives + sealed-corpus claims');
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
