// Clicking a food in an essential's "Best food sources" list OPENS that food, and the back
// button returns to the ESSENTIAL rather than dumping the reader on a tab.
//
// The bug this exists to prevent is specific and was shipped: the food row rendered as a plain
// <div> with no id on it, directly above Youngevity rows that were real buttons. It LOOKED
// clickable and did nothing. A DOM assertion that the row exists would have passed throughout,
// so this probe drives the actual click and reads where it lands.
const path = require('path');
const REPO = 'C:/Users/Light/Desktop/claude/health expert';
let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* next */ }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const check = (n, ok, d) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d === undefined ? '' : '  - ' + JSON.stringify(d).slice(0, 240)}`);
  if (!ok) fails++;
};

const STATE = () => ({
  crumbs: [...document.querySelectorAll('[data-kd-crumb]')].map(n => n.textContent.trim()),
  back: (document.querySelector('.kd-ep-back')?.textContent ?? '').trim(),
  heading: (document.querySelector('.kd-ep-hero')?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40),
  // An essential page is open when it has a glance AND its food list — the pair is what tells
  // this apart from a food sheet, which also renders a hero.
  onEssential: document.querySelectorAll('.kd-ep-op').length > 0
    && document.querySelectorAll('.kd-ep-src--food').length > 0,
  rowTag: document.querySelector('.kd-ep-src--food')?.tagName ?? null,
  rowHasId: document.querySelector('.kd-ep-src--food')?.hasAttribute('data-kd-food') ?? false,
  rowCursor: (() => {
    const e = document.querySelector('.kd-ep-src--food');
    return e ? getComputedStyle(e).cursor : null;
  })(),
});

(async () => {
  const b = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1500, height: 1200, deviceScaleFactor: 2 });
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/'), { waitUntil: 'domcontentloaded' });
  await sleep(2400);
  // .wc is the dialog; .wc-veil is a SEPARATE full-viewport blur behind it. Removing only the
  // first leaves every screenshot shot through a blur while every assertion still passes.
  await p.evaluate(() => { document.querySelectorAll('.wc-veil, .wc').forEach(n => n.remove()); });
  await p.evaluate(() => document.querySelector('[data-rail-nav="knowledge"]').click());
  await sleep(1200);

  // ── the path the owner described: essential → food → back ────────────────
  await p.evaluate(() => { const t = document.querySelector('#drawer-knowledge-mount [data-kd-tab="essentials"]'); if (t) t.click(); });
  await sleep(700);
  await p.evaluate(() => {
    const e = [...document.querySelectorAll('#drawer-knowledge-mount [data-kd-essential]')]
      .find(x => x.getAttribute('data-kd-essential') === 'Boron');
    if (e) e.click();
  });
  await sleep(1400);
  const onEssential = await p.evaluate(STATE);
  check('the essential opens with food rows', onEssential.onEssential, onEssential.heading);
  check('a food row is a real button carrying its id',
    onEssential.rowTag === 'BUTTON' && onEssential.rowHasId,
    { tag: onEssential.rowTag, hasId: onEssential.rowHasId });
  // The CSS half. A button that renders `cursor: default` denies on hover what it does on click,
  // and four rules at .kd-ep-src--food used to do exactly that.
  check('and it offers a pointer, not a dead cursor', onEssential.rowCursor === 'pointer', onEssential.rowCursor);

  await p.evaluate(() => document.querySelector('.kd-ep-src--food').click());
  await sleep(1400);
  const onFood = await p.evaluate(STATE);
  check('clicking it opens the FOOD', /Prunes/.test(onFood.heading) && !onFood.onEssential, onFood.heading);
  check('the back button reads "Go back", not "All products"',
    /Go back/.test(onFood.back) && !/All products/.test(onFood.back), onFood.back);
  check('the trail remembers the essential', onFood.crumbs.includes('Boron'), onFood.crumbs);

  await p.evaluate(() => document.querySelector('.kd-ep-back').click());
  await sleep(1400);
  const back = await p.evaluate(STATE);
  check('BACK RETURNS TO THE ESSENTIAL, not the essentials grid',
    back.onEssential && /Boron/.test(back.heading), back.heading);

  // ── control: a food opened FROM the Products tab must not have changed ────
  await p.evaluate(() => { const t = document.querySelector('#drawer-knowledge-mount [data-kd-tab="products"]'); if (t) t.click(); });
  await sleep(1000);
  await p.evaluate(() => { const e = document.querySelector('[data-kd-food]'); if (e) e.click(); });
  await sleep(1400);
  const fromProducts = await p.evaluate(STATE);
  check('CONTROL: a Products-tab open still reads "All products"',
    /All products/.test(fromProducts.back), fromProducts.back);
  await p.evaluate(() => document.querySelector('.kd-ep-back').click());
  await sleep(1300);
  const list = await p.evaluate(STATE);
  check('CONTROL: and its back still clears to the product list', list.crumbs.length === 0, list.crumbs);

  check('no page errors', errs.length === 0, errs);
  console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILED`);
  await b.close();
  process.exit(fails === 0 ? 0 : 1);
})();
