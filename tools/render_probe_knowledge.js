// tools/render_probe_knowledge.js — Knowledge drawer wiring + Products vault + Essentials.
//
// Usage: node tools/render_probe_knowledge.js   (exit 0 = PASS, non-zero = FAIL)
//
// Verifies the Knowledge drawer end-to-end: the K rail item toggles the overlay,
// the Products tab lists REAL vault entries (canonical_name fix in readProducts),
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

  // 3. Switch to the Products tab; read the vault count + the rendered names.
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-tab="products"]')?.click());
  await wait(300);
  const products = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const heads = root ? [...root.querySelectorAll('.kd-section-head')].map(e => e.textContent.trim()) : [];
    const head = heads.find(t => /PRODUCTS VAULT/.test(t)) || '';
    const m = head.match(/·\s*(\d+)\s*ENTRIES/);
    const rows = root ? [...root.querySelectorAll('.kd-product-row__name')].map(e => e.textContent.trim()) : [];
    return {
      head,
      count: m ? parseInt(m[1], 10) : 0,
      rowCount: rows.length,
      firstNames: rows.slice(0, 3),
      anyUnnamed: rows.some(n => n === '(unnamed)' || n === ''),
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
      corpusShown: corpus !== null,
      claimCount: claims.length,
      groupCount: corpus ? corpus.querySelectorAll('.kd-corpus__group').length : 0,
      countTxt: corpus ? (corpus.querySelector('.kd-corpus__count')?.textContent || '').trim() : '',
      firstText: first ? (first.querySelector('.kd-claim__text')?.textContent || '').length > 0 : false,
      firstVerbatim: first ? (first.querySelector('.kd-claim__verbatim')?.textContent || '').length > 0 : false,
      firstCite: first ? /DEAD DOCTORS|DDDL/i.test(first.querySelector('.kd-claim__cite')?.textContent || '') : false,
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

  const out = { boot, afterClick, corpus, products, essentials, deep, afterEsc, afterK };
  console.log('KNOWLEDGE', JSON.stringify(out));
  console.log('PAGE_ERRORS', errs.length, errs.slice(0, 5).join(' | '));

  const checks = [
    ['drawer closed at boot', boot.open === false],
    ['rail K opens drawer', afterClick.open === true && afterClick.hasHead === true],
    ['corpus: in-housed books rendered', corpus.bookCount >= 1],
    ['corpus: DDDL shows a real claim count', corpus.dddlShowsClaims === true],
    ['corpus: no fabricated CITES/CHAPTERS', corpus.fakeCites === false],
    ['corpus: coming-soon books shown', corpus.plannedCount >= 1],
    ['products vault non-empty', products.count > 0],
    ['product rows rendered', products.rowCount > 0],
    ['no unnamed product rows', products.anyUnnamed === false],
    ['essentials: all shown (>= 90 tiles)', essentials.tileCount >= 90],
    ['essentials: every section present (>= 4 heads)', essentials.sectionCount >= 4],
    ['essentials: coverage states rendered', essentials.stateTiles > 0],
    ['essentials: Magnesium tile expands deep-dive', deep.shown === true && deep.hasPill === true && deep.hasName === true],
    ['corpus: claim block rendered in deep-dive', deep.corpusShown === true],
    ['corpus: sealed claims present (Magnesium)', deep.claimCount > 0],
    ['corpus: claims grouped by kind', deep.groupCount > 0],
    ['corpus: claim shows paraphrase + verbatim + citation', deep.firstText && deep.firstVerbatim && deep.firstCite],
    ['Esc closes drawer', afterEsc.open === false],
    ['bare K reopens drawer', afterK.open === true],
    ['no page errors', errs.length === 0],
  ];
  const failed = checks.filter(([, ok]) => !ok).map(([n]) => n);
  await browser.close();
  if (failed.length) { console.log('FAIL', JSON.stringify(failed)); process.exit(1); }
  console.log('PASS · Knowledge drawer wired · Products vault real · Essentials all-shown + deep-dive + sealed-corpus claims');
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
