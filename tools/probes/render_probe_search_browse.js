// tools/probes/render_probe_search_browse.js — Ask-Wallach BROWSE-BY-KIND flow + corner nav end-to-end.
//
// Usage: node tools/probes/render_probe_search_browse.js   (exit 0 = PASS, non-zero = FAIL)
//
// Verifies the browse feature: the five opening "kind of answer" cards (data-aw-family)
// each open a BROWSE page listing that family's TOPICS as light cards (facet
// micro-label + in-family count + a peek). Lens pills (no count, one line) switch families in place;
// a topic card opens that topic's full page. Corner nav: the top-left back arrow steps back one
// navigation (history), the browse "Go Back" + the "Ask Wallach" title both return to the opening
// screen, and a top-right close button exists. Requires puppeteer.

const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

const wait = ms => new Promise(r => setTimeout(r, ms));
const SR = '#drawer-search-mount';
const fails = [];
const check = (cond, msg) => { if (!cond) fails.push(msg); };

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.setViewport({ width: 860, height: 1240 });

  const url = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.log('GOTO_ERR', e.message));
  await wait(1500);
  await page.evaluate(() => {
    const veil = document.querySelector('.wc-veil');
    if (!veil) return;
    const btn = [...veil.querySelectorAll('button, a')].find(b => /browsing/i.test(b.textContent || ''));
    if (btn) btn.click();
  });
  await wait(400);
  await page.evaluate(() => document.querySelector('.topbar__ask')?.click());
  await wait(500);

  // 1. Opening: five kcards, no lens row, close button present, back arrow HIDDEN.
  const opening = await page.evaluate(s => ({
    kcards: document.querySelectorAll(s + ' .kcard').length,
    lens: document.querySelectorAll(s + ' .brow-lens__b').length,
    close: document.querySelector(s + ' [data-aw-nav-close]') !== null,
    home: document.querySelector(s + ' [data-aw-home]') !== null,
    backHidden: document.querySelector(s + ' .scr-nav--back')?.hasAttribute('hidden'),
  }), SR);
  check(opening.kcards === 5, `opening kcards = ${opening.kcards} (want 5)`);
  check(opening.lens === 0, `opening should have NO lens row, found ${opening.lens}`);
  check(opening.close === true, 'missing top-right close button');
  check(opening.home === true, '"Ask Wallach" title is not a home button');
  check(opening.backHidden === true, 'back arrow should be HIDDEN on the opening screen');

  // 2. Click "The Science" -> browse; back arrow now visible; lens pills carry NO number.
  await page.evaluate(s => document.querySelector(s + ' [data-aw-family="science"]').click(), SR);
  await wait(350);
  const sci = await page.evaluate(s => {
    const r = document.querySelector(s);
    return {
      head: (r.querySelector('.brow-head__t')?.textContent || '').trim(),
      cards: r.querySelectorAll('.brow-card').length,
      lens: r.querySelectorAll('.brow-lens__b').length,
      active: (r.querySelector('.brow-lens__b.is-active')?.textContent || '').trim(),
      lensHasDigit: [...r.querySelectorAll('.brow-lens__b')].some(b => /\d/.test(b.textContent || '')),
      goBack: r.querySelector('.brow-head__back[data-aw-browse-back]') !== null,
      backHidden: r.querySelector('.scr-nav--back')?.hasAttribute('hidden'),
      hasCard: (r.querySelector('.brow-card__cat')?.textContent || '').trim().length > 0
        && (r.querySelector('.brow-card__name')?.textContent || '').trim().length > 0
        && (r.querySelector('.brow-card__peek')?.textContent || '').trim().length > 0,
    };
  }, SR);
  check(sci.head === 'The Science', `science head = "${sci.head}"`);
  check(sci.cards >= 40, `science cards = ${sci.cards} (want >= 40)`);
  check(sci.lens === 5, `science lens pills = ${sci.lens} (want 5)`);
  check(/The Science/.test(sci.active), `active lens = "${sci.active}"`);
  check(sci.lensHasDigit === false, 'lens pills should carry NO count number');
  check(sci.goBack === true, 'browse header missing "Go Back" button');
  check(sci.backHidden === false, 'back arrow should be VISIBLE inside browse');
  check(sci.hasCard === true, 'browse card missing cat/name/peek');

  // 3. Switch lens to Cautions in place.
  await page.evaluate(s => document.querySelector(s + ' .brow-lens__b[data-aw-family="signs"]').click(), SR);
  await wait(350);
  const cau = await page.evaluate(s => ({
    head: (document.querySelector(s + ' .brow-head__t')?.textContent || '').trim(),
    cards: document.querySelectorAll(s + ' .brow-card').length,
  }), SR);
  check(cau.head === 'Cautions', `cautions head = "${cau.head}"`);
  check(cau.cards > 0 && cau.cards < sci.cards, `cautions cards = ${cau.cards} (want >0 and < science ${sci.cards})`);

  // 4. Browse "Go Back" -> opening screen (even after a lens switch).
  await page.evaluate(s => document.querySelector(s + ' [data-aw-browse-back]').click(), SR);
  await wait(300);
  const back = await page.evaluate(s => ({
    kcards: document.querySelectorAll(s + ' .kcard').length,
    lens: document.querySelectorAll(s + ' .brow-lens__b').length,
  }), SR);
  check(back.kcards === 5 && back.lens === 0, `"Go Back" did not return to opening: ${JSON.stringify(back)}`);

  // 5. Re-enter Science, click a topic card -> its topic page.
  await page.evaluate(s => document.querySelector(s + ' [data-aw-family="science"]').click(), SR);
  await wait(300);
  await page.evaluate(s => document.querySelector(s + ' .brow-card').click(), SR);
  await wait(400);
  const topic = await page.evaluate(s => ({
    hero: (document.querySelector(s + ' .ehero__name')?.textContent || '').trim(),
    groups: document.querySelectorAll(s + ' .fgroup').length,
    stillBrowse: document.querySelectorAll(s + ' .brow-card').length,
  }), SR);
  check(topic.hero.length > 0, 'topic card did not open a topic page (empty hero)');
  check(topic.groups > 0, `topic page has no family groups (${topic.groups})`);
  check(topic.stillBrowse === 0, `browse cards should be gone on the topic page, found ${topic.stillBrowse}`);

  // 6. Top-left back arrow -> steps back to the Science browse (history pop).
  await page.evaluate(s => document.querySelector(s + ' [data-aw-nav-back]').click(), SR);
  await wait(350);
  const stepBack = await page.evaluate(s => ({
    head: (document.querySelector(s + ' .brow-head__t')?.textContent || '').trim(),
    cards: document.querySelectorAll(s + ' .brow-card').length,
  }), SR);
  check(stepBack.head === 'The Science' && stepBack.cards >= 40, `back arrow did not return to Science browse: ${JSON.stringify(stepBack)}`);

  // 7. "Ask Wallach" title -> home (opening).
  await page.evaluate(s => document.querySelector(s + ' [data-aw-home]').click(), SR);
  await wait(300);
  const home = await page.evaluate(s => ({
    kcards: document.querySelectorAll(s + ' .kcard').length,
    backHidden: document.querySelector(s + ' .scr-nav--back')?.hasAttribute('hidden'),
  }), SR);
  check(home.kcards === 5, `"Ask Wallach" did not return home: ${home.kcards} kcards`);
  check(home.backHidden === true, 'back arrow should be hidden again at home');

  check(errs.length === 0, `page errors: ${errs.join(' | ')}`);

  await browser.close();
  if (fails.length > 0) {
    console.log('FAIL · Ask-Wallach browse-by-kind\n  - ' + fails.join('\n  - '));
    process.exit(1);
  }
  console.log(`PASS · Ask-Wallach browse-by-kind · opening(5,no-lens) → Science(${sci.cards} topics, 5 lenses, no counts) → lens→Cautions(${cau.cards}) → GoBack→opening → topic(${topic.hero}) → ←back→Science → home · 0 errors`);
})().catch(e => { console.error(e); process.exit(1); });
