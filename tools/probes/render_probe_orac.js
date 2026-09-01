// tools/probes/render_probe_orac.js — ORAC knowledge tab (hero + narrative + live claims).
//
// Usage: node tools/probes/render_probe_orac.js   (exit 0 = PASS, non-zero = FAIL)
//
// Verifies the ORAC tab end-to-end: the K rail opens the drawer, the ORAC menu tab
// (after Absorption) activates the .kd-orac page, and the page renders in three bands —
//   (1) the editorial hero,
//   (2) the narrative sections (the mirror test, stolen-years rank decline,
//       the damage chain, the daily target, the four pieces / forces / payoff) with their
//       Wallach numbers DERIVED from the sealed corpus (orac-data.json), and
//   (3) the full-record claims index — the rendered card count equals the live oracClaims()
//       query (the anti-silent-drop anchor), facet-grouped, each Wallach-cited.
//
// RE-POINTED 2026-08-31. Two groups of checks here described a SUPERSEDED design and had been
// red since the redesign: the mirror test's four .kd-orac-dec decade bars (now ONE scrubbable
// .kd-orac-cell driven by .kd-orac-scrub__range) and the per-category .kd-orac-tbl league
// tables (now the .kd-orac-lane plot inside .kd-orac-field). Neither dead class appeared in the
// view or in any stylesheet. The header said so and nothing happened, because THE PROBE SUITE
// IS NOT ON THE INVARIANT BOARD: genesis prints a clean board while a probe sits red for weeks.
// A note is not a gate.
//
// ★ THE REPLACEMENTS DERIVE THEIR EXPECTATIONS FROM orac-foods-data.json rather than naming
// them. render_probe_group_dots went red the same way on the same day — it had typed out which
// goals name a mineral complex, the data moved, and its NEGATIVE CONTROL ended up asserting the
// opposite of the truth. A probe that hardcodes what it measures against stops being an
// instrument the moment the world moves.

const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

const wait = ms => new Promise(r => setTimeout(r, ms));

// ★ DERIVED, NOT TYPED. Every §04/§06 expectation below comes out of the same generated file
// the view reads, so a legitimate change to the ORAC data moves the probe with it and only a
// RENDER that stops following the data can go red.
const OF = require(path.join(REPO, 'dashboard/assets/data/orac-foods-data.json'));
const CATS = OF.tables.categories;
const BASE_BASIS = CATS[0].basis;
const DIVERGENT = CATS.filter(c => c.basis !== BASE_BASIS).map(c => c.basis);
const TOTAL_ROWS = CATS.reduce((n, c) => n + c.rows.length, 0);
const REACH = OF.reach.rows;
// §01's anchor points — the four measured (band, pct) pairs Wallach states. The scrubber
// INTERPOLATES between them, which is a reading device; at the anchors themselves it must
// report his number exactly (§00.A — the view authors nothing).
const OD = require(path.join(REPO, 'dashboard/assets/data/orac-data.json'));
const DECADES = OD.decades.rows.map((r) => {
  const e = String(r.age).split(/[\u2013-]/).map(s => Number(s.trim()));
  return { mid: ((e[0] || 0) + (e[1] === undefined ? (e[0] || 0) : e[1])) / 2, pct: r.pct };
});
const EXPECT_UNITS = [...new Set(CATS.map(c => `ORAC \u00b7 ${c.basis}`))].sort();
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));

  const url = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.log('GOTO_ERR', e.message));
  await wait(1500);

  // Open the drawer, then switch to the ORAC tab.
  await page.evaluate(() => document.querySelector('[data-rail-nav="knowledge"]')?.click());
  await wait(300);
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-tab="orac"]')?.click());
  await wait(300);

  const orac = await page.evaluate((AGES) => {
    const root = document.getElementById('drawer-knowledge-mount');
    const pageEl = root ? root.querySelector('.kd-orac') : null;
    const q = sel => (pageEl ? [...pageEl.querySelectorAll(sel)] : []);
    const txt = pageEl ? (pageEl.textContent || '') : '';
    const cards = q('.kd-orac-claim');
    const groups = q('.kd-orac-fgroup');
    const groupCounts = groups.map(g => parseInt(g.querySelector('.kd-orac-fgroup__n')?.textContent || '0', 10));
    const cites = cards.map(c => c.querySelector('.kd-orac-claim__src')?.textContent || '');
    const live = (window.wallachSearch && typeof window.wallachSearch.oracClaims === 'function')
      ? window.wallachSearch.oracClaims().length : -1;
    // §01 mirror test — ONE cell, scrubbed. Read the MECHANISM, not a static shape: drive the
    // range from end to end and prove the render actually follows it. A cell that renders
    // perfectly and ignores the scrubber passes every structural check ever written.
    const scrubEl = pageEl ? pageEl.querySelector('.kd-orac-scrub__range') : null;
    const fillEl = pageEl ? pageEl.querySelector('.kd-orac-cell__fill') : null;
    const pctvEl = pageEl ? pageEl.querySelector('.kd-orac-read__pctv') : null;
    // What the scrubber actually drives: the cell's fill HEIGHT and the printed percentage.
    // (.kd-orac-cell__nuc is a static nucleus and never moves — reading it proves nothing.)
    const readScrub = () => ({
      h: fillEl ? Math.round(parseFloat(fillEl.style.height) || 0) : -1,
      pct: pctvEl ? Number((pctvEl.textContent || '').trim()) : -1,
    });
    let scrubLo = null;
    let scrubHi = null;
    const scrubAnchors = [];
    if (scrubEl !== null && fillEl !== null) {
      const setTo = (v) => {
        scrubEl.value = String(v);
        scrubEl.dispatchEvent(new Event('input', { bubbles: true }));
      };
      const was = scrubEl.value;
      setTo(scrubEl.min);
      scrubLo = readScrub();
      setTo(scrubEl.max);
      scrubHi = readScrub();
      for (const age of AGES) { setTo(age); scrubAnchors.push(readScrub()); }
      setTo(was);
    }
    const rank0 = pageEl ? pageEl.querySelector('.kd-orac-rank__v') : null;
    // --sev-calm lives on the FIRST force's key figure, which is where the token is actually
    // used. Reading it here keeps the original CSS-comment-drop guard alive on a rule that
    // exists: a token glob written inside a CSS comment can end that comment early and
    // silently drop the rule after it.
    const force0k = pageEl ? pageEl.querySelector('.kd-orac-force--a .kd-orac-force__k') : null;
    const secNums = q('.kd-orac-sec__num').map(s => (s.textContent || '').trim());
    const absBtn = pageEl ? pageEl.querySelector('.kd-orac-abs__btn') : null;
    // §04-07 food sections — DERIVED from orac-foods-data.json. (.kd-orac-tbl below is dead;
    // see the STALE READS note in the header before trusting those reads.)
    const reachRows = q('#reach .kd-orac-reach__row');
    const reachFirst = reachRows[0] || null;
    const reachFill0 = pageEl ? pageEl.querySelector('#reach .kd-orac-reach__fill') : null;
    const scaleRows = q('#scale .kd-orac-scale__row');
    const wineRows = q('#wine .kd-orac-scale__row');
    // §06 THE FIELD — one .kd-orac-lane per category, one .kd-orac-dot per row. The
    // divergent-basis label is an <i> inside the lane name, and every dot carries its own
    // basis in data-unit, so a per-100 g food can never be read off the same axis as a
    // per-serving one without saying so.
    const laneEls = q('.kd-orac-lane');
    const laneSubs = q('.kd-orac-lane__n i').map(i => (i.textContent || '').trim());
    const dotUnits = q('.kd-orac-dot').map(d => d.getAttribute('data-unit') || '');
    const reachTrack0 = pageEl ? pageEl.querySelector('#reach .kd-orac-reach__track') : null;
    // §09 claim-card expand — cards are <details>; verbatim hidden until opened
    const claimCards = q('.kd-orac-claim');
    const cardsAreDetails = claimCards.length > 0 && claimCards.every(c => c.tagName === 'DETAILS');
    const firstCard = claimCards[0] || null;
    const firstVerb = firstCard ? firstCard.querySelector('.kd-orac-claim__verbatim') : null;
    const closedCardH = firstCard ? firstCard.offsetHeight : 0;
    if (firstCard) { firstCard.open = true; }
    const openCardH = firstCard ? firstCard.offsetHeight : 0;
    const chevEl = firstCard ? firstCard.querySelector('.kd-orac-claim__chev') : null;
    const chevRot = chevEl ? getComputedStyle(chevEl).transform : '';
    if (firstCard) { firstCard.open = false; }
    return {
      shown: pageEl !== null,
      heroShown: pageEl ? pageEl.querySelector('.kd-orac-hero') !== null : false,
      deckBold: pageEl ? pageEl.querySelector('.kd-orac-hero__deck strong') !== null : false,
      subject: pageEl ? (pageEl.querySelector('.kd-orac-eyebrow__r')?.textContent || '').trim() : '',
      // narrative structure
      mirrorEmShown: pageEl ? pageEl.querySelector('.kd-orac-mirror__h em') !== null : false,
      cellCount: q('.kd-orac-cell').length,
      cellWrapCount: q('.kd-orac-cellwrap').length,
      scrubCount: q('.kd-orac-scrub__range').length,
      nucCount: q('.kd-orac-cell__nuc').length,
      scrubMoves: scrubLo !== null && scrubHi !== null
        && (scrubLo.h !== scrubHi.h || scrubLo.pct !== scrubHi.pct),
      scrubLo,
      scrubHi,
      scrubAnchors,
      rankCount: q('.kd-orac-rank__c').length,
      rankArrows: q('.kd-orac-rank__arrow').length,
      // computed COLOUR (not just structure): writing a token glob inside a CSS comment can end
      // that comment early and silently drop the rule after it, leaving these transparent or
      // default-ink while the source still looks correct. A real colour here is the anchor.
      rank0Color: rank0 ? getComputedStyle(rank0).color : '',
      force0kColor: force0k ? getComputedStyle(force0k).color : '',
      chainSteps: q('.kd-orac-chain__step').length,
      targetNum: pageEl ? (pageEl.querySelector('.kd-orac-target__num')?.textContent || '').replace(/\s+/g, ' ').trim() : '',
      targetSide: pageEl ? (pageEl.querySelector('.kd-orac-target__sn')?.textContent || '').trim() : '',
      pieceCount: q('.kd-orac-piece').length,
      forceCount: q('.kd-orac-force').length,
      payoffNum: pageEl ? (pageEl.querySelector('.kd-orac-payoff__n')?.textContent || '').trim() : '',
      absBtnTab: absBtn ? absBtn.getAttribute('data-kd-tab') : null,
      secNums,
      reachRowCount: reachRows.length,
      reachFirstName: reachFirst ? (reachFirst.querySelector('.kd-orac-reach__name')?.textContent || '').trim() : '',
      reachFirstPct: reachFirst ? (reachFirst.querySelector('.kd-orac-reach__pct')?.textContent || '').trim() : '',
      reachFill0Bg: reachFill0 ? getComputedStyle(reachFill0).backgroundColor : '',
      scaleRowCount: scaleRows.length,
      scaleFirstVl: scaleRows[0] ? (scaleRows[0].querySelector('.kd-orac-scale__vl')?.textContent || '').trim() : '',
      laneCount: laneEls.length,
      keybCount: q('.kd-orac-keyb').length,
      dotCount: q('.kd-orac-dot').length,
      laneSubs,
      dotUnits: [...new Set(dotUnits)].sort(),
      reachFillW: reachFill0 ? reachFill0.getBoundingClientRect().width : 0,
      reachTrackW: reachTrack0 ? reachTrack0.getBoundingClientRect().width : 0,
      wineRowCount: wineRows.length,
      cardsAreDetails,
      verbatimCount: q('.kd-orac-claim__verbatim').length,
      expandGrows: openCardH > closedCardH + 20,
      verbatimHasText: firstVerb ? (firstVerb.textContent || '').trim().length > 0 : false,
      chevRotated: chevRot !== '' && chevRot !== 'none',
      // numbers that MUST have come from the derived corpus data (regression anchor)
      hasTargetRange: /20,000\s*–\s*25,000/.test(txt),
      hasDiseaseDose: txt.indexOf('100,000') !== -1,
      hasCalories: txt.indexOf('1,250') !== -1 && txt.indexOf('1,800') !== -1,
      hasRank17: txt.indexOf('17th') !== -1 && txt.indexOf('48th') !== -1,
      hasEssentials90: txt.indexOf('90 essentials') !== -1,
      // claims record
      cardCount: cards.length,
      liveCount: live,
      groupCount: groups.length,
      groupSum: groupCounts.reduce((a, b) => a + b, 0),
      allCited: cards.length > 0 && cites.every(c => /EPIGENETICS|DEAD DOCTORS|RARE EARTHS|IMMORTALITY|PLAY DOCTOR|YOUR HEAD|HELL/i.test(c)),
      allHaveQ: cards.length > 0 && cards.every(c => (c.querySelector('.kd-orac-claim__q')?.textContent || '').length > 0),
    };
  }, DECADES.map(d => d.mid));

  console.log('ORAC', JSON.stringify(orac));
  console.log('PAGE_ERRORS', errs.length, errs.slice(0, 5).join(' | '));

  const checks = [
    ['ORAC tab renders its container', orac.shown === true],
    ['hero: emphasised deck + ORAC subject', orac.heroShown === true && orac.deckBold === true && orac.subject === 'ORAC'],
    // ── narrative sections ──
    ['mirror test: one scrubbable cell with a nucleus and a range control',
      orac.cellCount === 1 && orac.cellWrapCount === 1 && orac.scrubCount === 1 && orac.nucCount === 1],
    // The MECHANISM, not the shape. A cell that renders correctly and ignores its scrubber
    // satisfies every structural check; only driving the control can tell the two apart.
    ['mirror test: driving the scrubber end to end CHANGES what is shown', orac.scrubMoves === true],
    // ★ AND IT REPORTS HIS NUMBERS. A scrubber that moves smoothly through invented values
    // passes the check above. At each MEASURED band midpoint the printed percentage must be
    // the one orac-data.json carries, and the cell must be filled to it — the view is a
    // reading device for Wallach's four points, never an author of a fifth (§00.A).
    [`mirror test: at each measured age it prints Wallach\u2019s own pct (${DECADES.map(d => d.pct).join('/')}, derived)`,
      orac.scrubAnchors.length === DECADES.length
      && DECADES.every((d, i) => orac.scrubAnchors[i].pct === d.pct && orac.scrubAnchors[i].h === d.pct)],
    ['mirror heading emphasis (<em>) renders', orac.mirrorEmShown === true],
    ['stolen years: 4 rank cells + 3 arrows', orac.rankCount === 4 && orac.rankArrows === 3],
    // The CSS-comment-drop guard, re-pointed at the element that actually uses --sev-calm.
    ['--sev-calm resolves on the first force\u2019s key figure', orac.force0kColor === 'rgb(14, 165, 183)'],
    ['rank value carries a real colour, not a dropped rule', /^rgba?\((?!0, 0, 0, 0)/.test(orac.rank0Color)],
    ['rank ordinals present (17th … 48th)', orac.hasRank17 === true],
    ['damage chain: 5 steps', orac.chainSteps === 5],
    ['daily target range 20,000–25,000 (derived)', orac.hasTargetRange === true && /20,000/.test(orac.targetNum)],
    ['disease dose 100,000+ (derived)', orac.targetSide.indexOf('100,000') !== -1 && orac.hasDiseaseDose === true],
    ['calorie band 1,250–1,800 (derived)', orac.hasCalories === true],
    ['four pieces render', orac.pieceCount === 4],
    ['two forces render', orac.forceCount === 2],
    ['essentials count interpolated (90 essentials)', orac.hasEssentials90 === true],
    ['payoff +25 to 50 healthful years (derived)', /\+?25 to 50/.test(orac.payoffNum)],
    ['Absorption button routes to foods tab', orac.absBtnTab === 'foods'],
    ['section numbers 02–09 present (04-07 food tables spliced in)', ['02', '03', '04', '05', '06', '07', '08', '09'].every(n => orac.secNums.includes(n))],
    // ── §04-07 food sections (derived) ──
    [`§04 reach: ${REACH.length} rows, ${REACH[0].name} ${REACH[0].pct}% first (derived)`,
      orac.reachRowCount === REACH.length && orac.reachFirstName === REACH[0].name
      && orac.reachFirstPct.startsWith(`${REACH[0].pct}%`)],
    // The bar is a SOLID category colour, not a gradient — so measure what it is for: the fill
    // must be the stated share of its track. This is the assertion the gradient test only stood
    // in for, and it catches a bar that paints beautifully at the wrong width.
    ['§04 reach bar is filled to the share it prints (\u00b12 pts)',
      orac.reachTrackW > 0
      && Math.abs(orac.reachFillW / orac.reachTrackW * 100 - REACH[0].pct) <= 2],
    ['§04 reach fill carries a real colour, not a dropped rule',
      /^rgba?\((?!0, 0, 0, 0)/.test(orac.reachFill0Bg)],
    ['§05 scale: 6 rows, cloves 314,446 first (derived)', orac.scaleRowCount === 6 && orac.scaleFirstVl === '314,446'],
    [`§06 the field: one lane, one legend key per category (${CATS.length}, derived)`,
      orac.laneCount === CATS.length && orac.keybCount === CATS.length],
    [`§06 every row is plotted (${TOTAL_ROWS} dots, derived)`, orac.dotCount === TOTAL_ROWS],
    // The truth-critical one, and the reason this section is gated at all: Wallach's Hell's
    // Kitchen table is scored per 100 g and the Immortality table per serving. Plotted on one
    // axis without saying so, they would read as directly comparable and they are not. EXACTLY
    // the categories that diverge from the base must be labelled — no more, no fewer, so a
    // label that gets dropped AND a label sprayed on everything both go red.
    ['§06 exactly the divergent-basis lanes are labelled (different basis, not silently mixed)',
      eq(orac.laneSubs, DIVERGENT)],
    ['§06 every dot carries its own basis, so no two bases mix unremarked',
      eq(orac.dotUnits, EXPECT_UNITS)],
    // ── §09 claim-card expand ──
    ['§09 claim cards are <details> disclosures', orac.cardsAreDetails === true],
    ['§09 every card carries a verbatim body (== card count)', orac.verbatimCount === orac.cardCount && orac.verbatimCount === 33],
    ['§09 card grows when opened (body gated behind the expand)', orac.expandGrows === true],
    ['§09 revealed verbatim carries Wallach text', orac.verbatimHasText === true],
    ['§09 chevron rotates on expand', orac.chevRotated === true],
    // ── claims record ──
    ['claims record renders live cards', orac.cardCount > 0],
    // The anti-silent-drop anchor: the view renders EXACTLY what the query returns. The first
    // half (cardCount === liveCount) needs no literal; the 33 is a THIRD hand-maintained copy of
    // a derived count -- state/search.ts and views/knowledge-orac.ts each carry their own, and
    // both have already drifted to 31 -- so update every copy when mining changes the corpus.
    ['rendered card count == live oracClaims() (== 33 today)', orac.cardCount === orac.liveCount && orac.liveCount === 33],
    ['claims facet-grouped, tallies sum to the card total', orac.groupCount >= 1 && orac.groupSum === orac.cardCount],
    ['every card has a question', orac.allHaveQ === true],
    ['every card is Wallach-cited', orac.allCited === true],
    ['no page errors', errs.length === 0],
  ];
  const failed = checks.filter(([, ok]) => !ok).map(([n]) => n);
  await browser.close();
  if (failed.length) { console.log('FAIL', JSON.stringify(failed)); process.exit(1); }
  console.log('PASS · ORAC tab · hero + §02/§03/§08 narrative (derived numbers) + live full-record ('
    + orac.cardCount + ' cards == live query)');
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
