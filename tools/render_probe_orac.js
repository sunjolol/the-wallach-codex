// tools/render_probe_orac.js — ORAC knowledge tab (Phase 1: hero + live claims record).
//
// Usage: node tools/render_probe_orac.js   (exit 0 = PASS, non-zero = FAIL)
//
// Verifies the ORAC tab end-to-end: the K rail opens the drawer, the ORAC menu tab
// (after Absorption) activates the .kd-orac page, the editorial hero renders, and the
// full-record claims index renders LIVE — the rendered card count equals the live
// oracClaims() query (the anti-silent-drop anchor), facet-grouped, each Wallach-cited.

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
    const cards = pageEl ? [...pageEl.querySelectorAll('.kd-orac-claim')] : [];
    const groups = pageEl ? [...pageEl.querySelectorAll('.kd-orac-fgroup')] : [];
    const groupCounts = groups.map(g => parseInt(g.querySelector('.kd-orac-fgroup__n')?.textContent || '0', 10));
    const cites = cards.map(c => c.querySelector('.kd-orac-claim__src')?.textContent || '');
    const live = (window.wallachSearch && typeof window.wallachSearch.oracClaims === 'function')
      ? window.wallachSearch.oracClaims().length : -1;
    return {
      shown: pageEl !== null,
      heroShown: pageEl ? pageEl.querySelector('.kd-orac-hero') !== null : false,
      headlineLen: pageEl ? (pageEl.querySelector('.kd-orac-hero__h')?.textContent || '').length : 0,
      hasDeck: pageEl ? (pageEl.querySelector('.kd-orac-hero__deck')?.textContent || '').length > 40 : false,
      deckBold: pageEl ? pageEl.querySelector('.kd-orac-hero__deck strong') !== null : false,
      hasEyebrowRule: pageEl ? pageEl.querySelector('.kd-orac-eyebrow__rule') !== null : false,
      subject: pageEl ? (pageEl.querySelector('.kd-orac-eyebrow__r')?.textContent || '').trim() : '',
      cardCount: cards.length,
      liveCount: live,
      groupCount: groups.length,
      groupSum: groupCounts.reduce((a, b) => a + b, 0),
      kicker: pageEl ? (pageEl.querySelector('.kd-orac-sec__k')?.textContent || '') : '',
      allCited: cards.length > 0 && cites.every(c => /EPIGENETICS|DEAD DOCTORS|RARE EARTHS|IMMORTALITY|PLAY DOCTOR|YOUR HEAD|HELL/i.test(c)),
      allHaveQ: cards.length > 0 && cards.every(c => (c.querySelector('.kd-orac-claim__q')?.textContent || '').length > 0),
    };
  });

  console.log('ORAC', JSON.stringify(orac));
  console.log('PAGE_ERRORS', errs.length, errs.slice(0, 5).join(' | '));

  const checks = [
    ['ORAC tab renders its container', orac.shown === true],
    ['hero: headline + emphasised deck + eyebrow rule + ORAC subject', orac.heroShown === true && orac.headlineLen > 12 && orac.hasDeck === true && orac.deckBold === true && orac.hasEyebrowRule === true && orac.subject === 'ORAC'],
    ['claims record renders live cards', orac.cardCount > 0],
    // The anti-silent-drop anchor: the view renders EXACTLY what the query returns.
    // 31 is the locked Phase-1 scope; update this literal when mining changes the corpus.
    ['rendered card count == live oracClaims() (== 31 today)', orac.cardCount === orac.liveCount && orac.liveCount === 31],
    ['claims facet-grouped, tallies sum to the card total', orac.groupCount >= 1 && orac.groupSum === orac.cardCount],
    ['live claim count shown in the kicker', orac.kicker.indexOf(String(orac.cardCount)) !== -1],
    ['every card has a question', orac.allHaveQ === true],
    ['every card is Wallach-cited', orac.allCited === true],
    ['no page errors', errs.length === 0],
  ];
  const failed = checks.filter(([, ok]) => !ok).map(([n]) => n);
  await browser.close();
  if (failed.length) { console.log('FAIL', JSON.stringify(failed)); process.exit(1); }
  console.log('PASS · ORAC tab · hero + live full-record (' + orac.cardCount + ' cards == live query), facet-grouped + Wallach-cited');
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
