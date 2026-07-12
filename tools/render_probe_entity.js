// tools/render_probe_entity.js — the unified ENTITY PAGE (Phase H2 chunk 1b, essential).
//
// Usage: node tools/render_probe_entity.js   (exit 0 = PASS, non-zero = FAIL)
//
// Drives the essential entity page end-to-end via the Knowledge drawer, replicating the
// signed-off D1 design: open -> Essentials -> click Calcium -> assert hero · store-authored
// lede · "at a glance" (Wallach target + dotted-hover why + REAL coverage bar + ep-src best
// sources w/ best-value tag) · facet Q&A cards (? badge) · condition/works-with/explore pills
// · full-record kind groups w/ claim cards (? badge) · and the interactions (open a claim,
// filter the record, source -> product panel, pill nav). Requires puppeteer.

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

  await page.evaluate(() => document.querySelector('[data-rail-nav="knowledge"]')?.click());
  await wait(300);
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-tab="essentials"]')?.click());
  await wait(300);
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-essential="Calcium"]')?.click());
  await wait(300);

  const s = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    const d = root ? root.querySelector('.kd-essential-deep.kd-ep') : null;
    if (d === null) { return { shown: false }; }
    const facets = [...d.querySelectorAll('.kd-ep-facet[data-facet]')];
    const kinds = [...d.querySelectorAll('.kd-ep-kind[data-family]')];
    const recordCards = [...d.querySelectorAll('.kd-ep-kind .kd-ep-claim')];
    const facetCards = [...d.querySelectorAll('.kd-ep-facet__body .kd-ep-claim')];
    const srcRows = [...d.querySelectorAll('.kd-ep-src[data-kd-product]')];
    const bar = d.querySelector('.kd-ep-bar > i');
    return {
      shown: true,
      name: (d.querySelector('.kd-ep-hero__name')?.textContent || '').trim(),
      sym: (d.querySelector('.kd-ep-hero__sym')?.textContent || '').trim(),
      lede: (d.querySelector('.kd-ep-lede')?.textContent || '').trim(),
      hasGlance: d.querySelector('.kd-ep-op') !== null,
      targetText: (d.querySelector('.kd-ep-v')?.textContent || '').replace(/\s+/g, ' ').trim(),
      whyDotted: d.querySelector('.kd-ep-why') !== null,
      whyTipText: (d.querySelector('.kd-ep-why .kd-ep-tip')?.textContent || '').trim(),
      hasBar: d.querySelector('.kd-ep-bar') !== null,
      barWidth: bar ? (bar.style.width || '') : '',
      srcCount: srcRows.length,
      srcClickable: srcRows.length > 0 && srcRows.every(r => r.hasAttribute('data-kd-product')),
      hasBestValueTag: d.querySelector('.kd-ep-vtag') !== null,
      recordBadge: recordCards.length ? (recordCards[0].querySelector('.kd-ep-claim__badge')?.textContent || '').trim() : '',
      facetBadge: facetCards.length ? (facetCards[0].querySelector('.kd-ep-claim__badge')?.textContent || '').trim() : '',
      firstRecVerbatim: recordCards.length ? (recordCards[0].querySelector('.kd-ep-claim__verbatim')?.textContent || '').trim().length > 0 : false,
      firstRecCite: recordCards.length ? (recordCards[0].querySelector('.kd-ep-claim__cite')?.textContent || '').trim().length > 0 : false,
      facetCount: facets.length,
      facetHasData: facets.length > 0 && facets.every(f => (f.getAttribute('data-facet') || '').length > 0),
      facetCardCount: facetCards.length,
      kindCount: kinds.length,
      kindHasFamily: kinds.length > 0 && kinds.every(k => (k.getAttribute('data-family') || '').length > 0),
      recordShown: d.querySelector('.kd-ep-record') !== null,
      recordCardCount: recordCards.length,
      condPills: d.querySelectorAll('.kd-ep-pill--cond').length,
      nutPills: d.querySelectorAll('.kd-ep-pill--nut').length,
      explorePills: d.querySelectorAll('.kd-ep-pill--explore').length,
    };
  });

  // Open a record kind group + its first claim -> the card opens.
  const claimOpen = await page.evaluate(() => {
    const d = document.querySelector('#drawer-knowledge-mount .kd-essential-deep.kd-ep');
    const kind = d ? d.querySelector('.kd-ep-kind') : null;
    if (kind) { kind.querySelector('summary')?.click(); }
    const claim = kind ? kind.querySelector('.kd-ep-claim') : null;
    if (claim) { claim.querySelector('.kd-ep-claim__summary')?.click(); }
    return { opened: claim ? claim.hasAttribute('open') : false };
  });

  // Expand a facet Q&A card -> answer + verbatim visible (only when the essential is enriched).
  const facetOpen = await page.evaluate(() => {
    const d = document.querySelector('#drawer-knowledge-mount .kd-essential-deep.kd-ep');
    const card = d ? d.querySelector('.kd-ep-facet__body .kd-ep-claim') : null;
    if (!card) { return { present: false, opened: false, hasAnswer: false, hasVerbatim: false }; }
    card.querySelector('.kd-ep-claim__summary')?.click();
    return {
      present: true,
      opened: card.hasAttribute('open'),
      hasAnswer: (card.querySelector('.kd-ep-claim__answer')?.textContent || '').trim().length > 0,
      hasVerbatim: (card.querySelector('.kd-ep-claim__verbatim')?.textContent || '').trim().length > 0,
    };
  });

  // Filter the full record: a no-match query hides every kind group.
  await page.click('#drawer-knowledge-mount .kd-ep-filter');
  await page.type('#drawer-knowledge-mount .kd-ep-filter', 'zzzznomatch', { delay: 8 });
  await wait(150);
  const filtered = await page.evaluate(() => {
    const d = document.querySelector('#drawer-knowledge-mount .kd-essential-deep.kd-ep');
    const kinds = [...d.querySelectorAll('.kd-ep-kind')];
    return { total: kinds.length, visible: kinds.filter(k => !k.classList.contains('kd-hidden')).length };
  });
  await page.evaluate(() => {
    const i = document.querySelector('#drawer-knowledge-mount .kd-ep-filter');
    if (i) { i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await wait(120);
  const cleared = await page.evaluate(() => {
    const d = document.querySelector('#drawer-knowledge-mount .kd-essential-deep.kd-ep');
    return { visible: [...d.querySelectorAll('.kd-ep-kind')].filter(k => !k.classList.contains('kd-hidden')).length };
  });

  // A best-source row opens the product detail panel on the Products tab.
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount .kd-ep-src[data-kd-product]')?.click());
  await wait(250);
  const srcNav = await page.evaluate(() => {
    const root = document.getElementById('drawer-knowledge-mount');
    return {
      productShown: root.querySelector('.kd-product-deep') !== null,
      onProductsTab: /Products/i.test(root.querySelector('.kd-tab.active')?.textContent || ''),
    };
  });

  // A works-with (green) pill navigates to that essential's page in the same tab.
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-tab="essentials"]')?.click());
  await wait(150);
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-essential="Calcium"]')?.click());
  await wait(200);
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount .kd-ep-pill--nut')?.click());
  await wait(300);
  const nav = await page.evaluate(() => {
    const d = document.querySelector('#drawer-knowledge-mount .kd-essential-deep.kd-ep');
    return { name: (d?.querySelector('.kd-ep-hero__name')?.textContent || '').trim() };
  });

  const out = { s, claimOpen, facetOpen, filtered, cleared, srcNav, nav };
  console.log('ENTITY', JSON.stringify(out));
  console.log('PAGE_ERRORS', errs.length, errs.slice(0, 5).join(' | '));

  const checks = [
    ['entity page renders for Calcium', s.shown === true],
    ['hero shows name + symbol', s.name === 'Calcium' && s.sym === 'Ca'],
    ['lede comes from the approved store (hand-written, not the metallic-table)', /abundant mineral/i.test(s.lede) && !/1,000 mg tablet/i.test(s.lede)],
    ['"at a glance" card renders', s.hasGlance === true],
    ['Wallach target shows the derived number (1,500 mg)', /1,500/.test(s.targetText)],
    ['why-this-number is a dotted-underline HOVER tooltip with text', s.whyDotted === true && s.whyTipText.length > 0],
    ['coverage is the real ep-bar with a fill width', s.hasBar === true && /%/.test(s.barWidth)],
    ['best sources are ep-src rows, clickable, with a best-value tag', s.srcCount > 0 && s.srcClickable === true && s.hasBestValueTag === true],
    ['every claim card uses the ? badge (no § deviation)', s.recordBadge === '?' && (s.facetCardCount === 0 || s.facetBadge === '?')],
    ['worth-knowing facet sections render, tagged by facet', s.facetCount >= 1 && s.facetHasData === true],
    ['full record renders kind groups, each tagged by colour family', s.recordShown === true && s.kindCount > 0 && s.kindHasFamily === true],
    ['record groups hold claim cards with verbatim + citation', s.recordCardCount > 0 && s.firstRecVerbatim === true && s.firstRecCite === true],
    ['condition pills (orange) render', s.condPills > 0],
    ['works-with pills (green) render', s.nutPills > 0],
    ['keep-exploring pills (violet) render', s.explorePills > 0],
    ['a record claim card opens on click', claimOpen.opened === true],
    ['a facet Q&A card opens to answer + verbatim (when enriched)', facetOpen.present === false || (facetOpen.opened === true && facetOpen.hasAnswer === true && facetOpen.hasVerbatim === true)],
    ['record filter: a no-match query hides every kind group', filtered.total > 0 && filtered.visible === 0],
    ['record filter: clearing restores the groups', cleared.visible === filtered.total],
    ['a best-source row opens the product panel on the Products tab', srcNav.productShown === true && srcNav.onProductsTab === true],
    ['a works-with pill navigates to that essential (same-tab)', nav.name.length > 0 && nav.name !== 'Calcium'],
    ['no page errors', errs.length === 0],
  ];
  const failed = checks.filter(([, ok]) => !ok).map(([n]) => n);
  await browser.close();
  if (failed.length) { console.log('FAIL', JSON.stringify(failed)); process.exit(1); }
  console.log('PASS · entity page (essential) replicates D1 · store lede + dotted-hover why + ep-bar + ep-src + ? badges + interactions');
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
