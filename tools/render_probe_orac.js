// tools/render_probe_orac.js — ORAC knowledge tab (Phase 2: hero + narrative + live claims).
//
// Usage: node tools/render_probe_orac.js   (exit 0 = PASS, non-zero = FAIL)
//
// Verifies the ORAC tab end-to-end: the K rail opens the drawer, the ORAC menu tab
// (after Absorption) activates the .kd-orac page, and the page renders in three bands —
//   (1) the editorial hero,
//   (2) the Phase-2 narrative sections (mirror-test decade bars, stolen-years rank decline,
//       the damage chain, the daily target, the four pieces / forces / payoff) with their
//       Wallach numbers DERIVED from the sealed corpus (orac-data.json), and
//   (3) the full-record claims index — the rendered card count equals the live oracClaims()
//       query (the anti-silent-drop anchor), facet-grouped, each Wallach-cited.

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

  // Open the drawer, then switch to the ORAC tab.
  await page.evaluate(() => document.querySelector('[data-rail-nav="knowledge"]')?.click());
  await wait(300);
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-tab="orac"]')?.click());
  await wait(300);

  const orac = await page.evaluate(() => {
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
    const decFills = q('.kd-orac-dec__fill').map(f => Math.round(parseFloat(f.style.height) || 0));
    const fill0 = pageEl ? pageEl.querySelector('.kd-orac-dec__fill') : null;
    const rank0 = pageEl ? pageEl.querySelector('.kd-orac-rank__v') : null;
    const secNums = q('.kd-orac-sec__num').map(s => (s.textContent || '').trim());
    const absBtn = pageEl ? pageEl.querySelector('.kd-orac-abs__btn') : null;
    // §04-07 food league-tables (Phase 3b) — DERIVED from orac-foods-data.json
    const reachRows = q('#reach .kd-orac-reach__row');
    const reachFirst = reachRows[0] || null;
    const reachFill0 = pageEl ? pageEl.querySelector('#reach .kd-orac-reach__fill') : null;
    const scaleRows = q('#scale .kd-orac-scale__row');
    const wineRows = q('#wine .kd-orac-scale__row');
    const tblMetas = q('.kd-orac-tbl__meta').map(m => (m.textContent || '').trim());
    // §09 claim-card expand (Phase 4) — cards are <details>; verbatim hidden until opened
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
      // Phase-2 narrative structure
      mirrorEmShown: pageEl ? pageEl.querySelector('.kd-orac-mirror__h em') !== null : false,
      decadeCount: q('.kd-orac-dec').length,
      decFills,
      rankCount: q('.kd-orac-rank__c').length,
      rankArrows: q('.kd-orac-rank__arrow').length,
      // computed COLOUR (not just structure): the dropped --sev-* comment bug left these
      // transparent / default-ink. A real colour here is the regression anchor for it.
      decFill0Bg: fill0 ? getComputedStyle(fill0).backgroundImage : '',
      rank0Color: rank0 ? getComputedStyle(rank0).color : '',
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
      reachFill0Bg: reachFill0 ? getComputedStyle(reachFill0).backgroundImage : '',
      scaleRowCount: scaleRows.length,
      scaleFirstVl: scaleRows[0] ? (scaleRows[0].querySelector('.kd-orac-scale__vl')?.textContent || '').trim() : '',
      tblCount: q('.kd-orac-tbl').length,
      hasPer100: tblMetas.some(m => /per 100 g/.test(m)),
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
      // claims record (Phase 1)
      cardCount: cards.length,
      liveCount: live,
      groupCount: groups.length,
      groupSum: groupCounts.reduce((a, b) => a + b, 0),
      allCited: cards.length > 0 && cites.every(c => /EPIGENETICS|DEAD DOCTORS|RARE EARTHS|IMMORTALITY|PLAY DOCTOR|YOUR HEAD|HELL/i.test(c)),
      allHaveQ: cards.length > 0 && cards.every(c => (c.querySelector('.kd-orac-claim__q')?.textContent || '').length > 0),
    };
  });

  console.log('ORAC', JSON.stringify(orac));
  console.log('PAGE_ERRORS', errs.length, errs.slice(0, 5).join(' | '));

  const decadesOk = orac.decFills.length === 4 && [35, 41, 55, 78].every((v, i) => orac.decFills[i] === v);
  const checks = [
    ['ORAC tab renders its container', orac.shown === true],
    ['hero: emphasised deck + ORAC subject', orac.heroShown === true && orac.deckBold === true && orac.subject === 'ORAC'],
    // ── Phase 2 narrative ──
    ['mirror test: 4 decade bars, heights == derived pcts 35/41/55/78', orac.decadeCount === 4 && decadesOk],
    // Guards the CSS-comment-drop class: a dropped --sev-* var leaves the fill transparent.
    ['decade bar has a real gradient fill (--f resolves, not none)', /gradient/.test(orac.decFill0Bg)],
    ['mirror heading emphasis (<em>) renders', orac.mirrorEmShown === true],
    ['stolen years: 4 rank cells + 3 arrows', orac.rankCount === 4 && orac.rankArrows === 3],
    ['rank value is severity-coloured (--sev-calm resolves)', orac.rank0Color === 'rgb(14, 165, 183)'],
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
    // ── §04-07 food league-tables (Phase 3b, derived) ──
    ['§04 reach: 9 rows, pecan 72% first (derived)', orac.reachRowCount === 9 && orac.reachFirstName === 'Pecan' && orac.reachFirstPct === '72%'],
    ['§04 reach bar has a real gradient fill (--c resolves, not none)', /gradient/.test(orac.reachFill0Bg)],
    ['§05 scale: 6 rows, cloves 314,446 first (derived)', orac.scaleRowCount === 6 && orac.scaleFirstVl === '314,446'],
    ['§06 league tables: 9 categories', orac.tblCount === 9],
    ['§06 Hell\u2019s Kitchen labelled per-100 g (different basis, not silently mixed)', orac.hasPer100 === true],
    // ── §09 claim-card expand (Phase 4) ──
    ['§09 claim cards are <details> disclosures', orac.cardsAreDetails === true],
    ['§09 every card carries a verbatim body (== card count)', orac.verbatimCount === orac.cardCount && orac.verbatimCount === 33],
    ['§09 card grows when opened (body gated behind the expand)', orac.expandGrows === true],
    ['§09 revealed verbatim carries Wallach text', orac.verbatimHasText === true],
    ['§09 chevron rotates on expand', orac.chevRotated === true],
    // ── claims record (Phase 1) ──
    ['claims record renders live cards', orac.cardCount > 0],
    // The anti-silent-drop anchor: the view renders EXACTLY what the query returns.
    // 33 is the locked scope; update this literal when mining changes the corpus.
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
