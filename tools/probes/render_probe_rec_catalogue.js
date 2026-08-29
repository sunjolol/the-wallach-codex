// The Regimen product CATALOGUE: 3 at a time, paged, sortable, filterable, Ultimate Classic
// pinned in every order. Driven in the real app — a sort that only looks right on page one is
// exactly the kind of thing a screenshot passes and a probe does not.
const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
const OUT = __dirname;   // probe output lands beside the probe, not in a dead session's scratchpad
let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* next */ }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const check = (n, ok, d) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d === undefined ? '' : '  - ' + JSON.stringify(d).slice(0, 260)}`);
  if (!ok) fails++;
};

const readGrid = () => ({
  cards: [...document.querySelectorAll('.ck-recgrid .rec')].map(c => ({
    name: (c.querySelector('.rec__name') || {}).textContent,
    lead: c.classList.contains('rec--lead'),
    meta: (c.querySelector('.rec__meta') || {}).textContent.replace(/\s+/g, ' ').trim(),
    breadth: parseInt(((c.querySelector('.rec__br') || {}).textContent || '0'), 10),
  })),
  pages: [...document.querySelectorAll('[data-reccontrols] [data-rec-page]')].map(b => b.textContent),
  current: (document.querySelector('[data-reccontrols] [aria-current="page"]') || {}).textContent,
  note: (document.querySelector('.ck-recgrid .ck-recs__note') || {}).textContent,
});

(async () => {
  const b = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 2 });
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/'), { waitUntil: 'domcontentloaded' });
  await sleep(2400);
  await p.evaluate(() => document.querySelectorAll('.wc').forEach(n => n.remove()));
  await p.evaluate(() => document.querySelector('[data-rail-nav="regimen"]').click());
  await sleep(1800);

  const g0 = await p.evaluate(readGrid);
  console.log('page 1:', JSON.stringify(g0, null, 1).slice(0, 700));
  check('exactly three cards a page', g0.cards.length === 3, g0.cards.map(c => c.name));
  check('a numbered pager is painted', g0.pages.length > 3, g0.pages);
  check('Ultimate Classic leads the default order',
    /Ultimate Classic/.test(g0.cards[0].name) && g0.cards[0].lead, g0.cards[0]);

  // total catalogue size, from the pager's last page number
  const lastPage = Math.max(...g0.pages.map(n => parseInt(n, 10)).filter(Number.isFinite));
  check('the whole catalogue is reachable (>30 pages of 3)', lastPage > 30, { lastPage, approx: lastPage * 3 });

  // ── page 2 shows DIFFERENT products ─────────────────────────────────────
  await p.evaluate(() => {
    const btns = [...document.querySelectorAll('[data-reccontrols] [data-rec-page]')];
    const two = btns.find(x => x.textContent === '2');
    if (two) two.click();
  });
  await sleep(900);
  const g1 = await p.evaluate(readGrid);
  check('page 2 shows different products',
    g1.cards.length === 3 && g1.cards.every(c => !g0.cards.some(o => o.name === c.name)),
    g1.cards.map(c => c.name));
  check('page 2 is marked current', g1.current === '2', g1.current);

  // ── sort: most nutrients ────────────────────────────────────────────────
  await p.evaluate(() => {
    const s = document.querySelector('[data-rec-sort]');
    s.value = 'nutrients';
    // The view listens on 'input'. A real <select> fires input AND change; dispatching only
    // change exercised a path no person can reach and reported the whole feature as dead.
    s.dispatchEvent(new Event('input', { bubbles: true }));
    s.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await sleep(900);
  const g2 = await p.evaluate(readGrid);
  console.log('most nutrients:', JSON.stringify(g2.cards, null, 1));
  check('sorting resets to page one', g2.current === '1', g2.current);
  check('Ultimate Classic STILL leads, even though it is not the biggest formula',
    /Ultimate Classic/.test(g2.cards[0].name) && g2.cards[0].lead, g2.cards[0]);
  const tail = g2.cards.slice(1);
  check('the rest are ordered by formula size, descending',
    tail.every((c, i) => i === 0 || tail[i - 1].breadth >= c.breadth), tail.map(c => [c.name, c.breadth]));
  check('and the runner-up really does out-nutrient the pinned lead',
    tail[0].breadth >= g2.cards[0].breadth, { lead: g2.cards[0].breadth, next: tail[0].breadth });

  // ── sort: A-Z ───────────────────────────────────────────────────────────
  await p.evaluate(() => {
    const s = document.querySelector('[data-rec-sort]');
    s.value = 'name';
    // The view listens on 'input'. A real <select> fires input AND change; dispatching only
    // change exercised a path no person can reach and reported the whole feature as dead.
    s.dispatchEvent(new Event('input', { bubbles: true }));
    s.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await sleep(900);
  const g3 = await p.evaluate(readGrid);
  check('A-Z: Ultimate Classic still pinned first', g3.cards[0].lead, g3.cards.map(c => c.name));
  const az = g3.cards.slice(1).map(c => c.name);
  check('A-Z: the rest are alphabetical',
    az.every((n, i) => i === 0 || az[i - 1].localeCompare(n) <= 0), az);

  // ── filter by nutrient ──────────────────────────────────────────────────
  const narrowed = await p.evaluate(async () => {
    const s = document.querySelector('[data-rec-nutrient]');
    const opts = [...s.options].filter(o => o.value !== '');
    const pick = opts.find(o => /Iodine|Selenium|Boron/i.test(o.textContent)) || opts[0];
    s.value = pick.value;
    // The view listens on 'input'. A real <select> fires input AND change; dispatching only
    // change exercised a path no person can reach and reported the whole feature as dead.
    s.dispatchEvent(new Event('input', { bubbles: true }));
    s.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 700));
    const pages = [...document.querySelectorAll('[data-reccontrols] [data-rec-page]')].map(x => x.textContent);
    return {
      picked: pick.textContent,
      cards: [...document.querySelectorAll('.ck-recgrid .rec .rec__name')].map(n => n.textContent),
      lastPage: Math.max(0, ...pages.map(n => parseInt(n, 10)).filter(Number.isFinite)),
    };
  });
  console.log('nutrient filter:', JSON.stringify(narrowed));
  check('a nutrient filter narrows the catalogue', narrowed.lastPage < lastPage, narrowed);
  check('and still returns products', narrowed.cards.length > 0, narrowed.cards);

  const el = await p.$('.ck-recs');
  if (el) await el.screenshot({ path: OUT + '/R-catalogue.png' });

  check('no page errors', errs.length === 0, errs);
  console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILED`);
  await b.close();
  process.exit(fails === 0 ? 0 : 1);
})();
