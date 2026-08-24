// ═══════════════════════════════════════════════════════════════════════════
// render_probe_goal_filter_census.js — DOES EACH GOAL RETURN A SENSIBLE NUMBER?
// ═══════════════════════════════════════════════════════════════════════════
// render_probe_regimen_filters.js proves the two goal filters FIRE. It cannot see that they
// fired and returned nonsense, which is exactly what shipped on 2026-08-24: the PRODUCTS
// filter returned 1-9 of 149 (thyroid-support returned zero) and the FOODS filter returned
// 156-237 of 248 — miscalibrated in opposite directions, with every gate green.
//
// So this one drives EVERY option of BOTH goal filters in the running app and censuses what
// each actually returns, by reading the pool the way the reader does: the pager's last page
// plus the cards on it. A control that empties the list, and a control that keeps almost all
// of it, both fail here.
//
// ★ THE BAND IS A PROPERTY, NOT A SNAPSHOT. Nothing below asserts a count that a data change
// may legitimately move. It asserts that no goal is emptied and no goal keeps most of the
// catalogue — the two failure modes actually observed.
// ═══════════════════════════════════════════════════════════════════════════
const path = require('path');
const REPO = 'C:/Users/Light/Desktop/claude/health expert';
const OUT = process.env.PROBE_OUT || REPO + '/tools/probes';
let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* next */ }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
/**
 * ★ EVERY QUERY IS SCOPED TO THE REGIMEN MOUNT. Coverage renders a foods block of its own with
 * the SAME classes and the SAME `data-foodsblock` / `data-food-page` hooks, and it stays in the
 * DOM while the Regimen tab is showing. An unscoped `.fs-grid .fs-tile` counted both and put
 * every foods number in this census three too high — the probe agreeing with itself while
 * disagreeing with the screen.
 */
const M = '#workspace-regimen-mount ';
let fails = 0;
const check = (n, ok, d) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d === undefined ? '' : '  - ' + JSON.stringify(d).slice(0, 300)}`);
  if (!ok) fails++;
};

/** The floor and ceiling a usable filter has to land between, as a share of the whole pool. */
const FLOOR = 10;
const CEILING_SHARE = 0.60;

(async () => {
  const b = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1600, height: 1300, deviceScaleFactor: 2 });
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/'), { waitUntil: 'domcontentloaded' });
  await sleep(2400);
  await p.evaluate(() => (() => { const btn = document.querySelector('.wc-veil .ui-close, .wc-veil [data-veil-close], .wc-veil button'); if (btn) { btn.click(); } document.querySelectorAll('.wc-veil, .wc').forEach(n => n.remove()); })());
  // The owner's own five goals, through the app's own writer — the chips are scoped to the
  // reader's goals and an unseeded run would prove nothing about them. The FILTER reaches all
  // thirty either way, which is half the point of this census.
  await p.evaluate(() => {
    window.saveRgUserGoals(['muscle-strength', 'focus-attention', 'sharper-thinking',
      'better-mood', 'more-energy']);
  });
  await p.reload({ waitUntil: 'domcontentloaded' });
  await sleep(2200);
  await p.evaluate(() => (() => { const btn = document.querySelector('.wc-veil .ui-close, .wc-veil [data-veil-close], .wc-veil button'); if (btn) { btn.click(); } document.querySelectorAll('.wc-veil, .wc').forEach(n => n.remove()); })());
  await p.evaluate(() => document.querySelector('[data-rail-nav="regimen"]').click());
  await sleep(1800);

  /**
   * How many rows one filter option actually returns, counted the way the reader could count
   * them: jump to the last page the pager offers and add the cards on it. Deriving the total
   * from the pager is what keeps this honest — a total read off some internal field could
   * agree with the code while the pager disagreed with both.
   */
  const censusOne = async (selAttr, pageAttr, cardSel, value, pageSize) => {
    await p.evaluate((sa, v, m) => {
      const s = document.querySelector(`${m}[data-${sa}]`);
      s.value = v;
      s.dispatchEvent(new Event('input', { bubbles: true }));
    }, selAttr, value, M);
    await sleep(320);
    const last = await p.evaluate((pa, m) => {
      const btns = [...document.querySelectorAll(`${m}[data-${pa}]`)]
        .map(el => Number(el.dataset[pa.replace(/-([a-z])/g, (m, c) => c.toUpperCase())]))
        .filter(n => Number.isFinite(n));
      return btns.length === 0 ? 0 : Math.max(...btns);
    }, pageAttr, M);
    if (last > 0) {
      await p.evaluate((pa, n, m) => {
        const key = pa.replace(/-([a-z])/g, (s, c) => c.toUpperCase());
        const el = [...document.querySelectorAll(`${m}[data-${pa}]`)].find(x => Number(x.dataset[key]) === n);
        if (el) el.click();
      }, pageAttr, last, M);
      await sleep(320);
    }
    const onLast = await p.evaluate((cs, m) => document.querySelectorAll(m + cs).length, cardSel, M);
    return last * pageSize + onLast;
  };

  const options = await p.evaluate(m => ({
    products: [...document.querySelectorAll(m + '[data-rec-goal] option')].map(o => ({ v: o.value, t: o.textContent.trim() })),
    foods: [...document.querySelectorAll(m + '[data-food-goal] option')].map(o => ({ v: o.value, t: o.textContent.trim() })),
  }), M);
  // ★ NOTHING MAY BE COVERING THE SURFACE WHEN A PROBE READS OR SHOOTS IT. The welcome card
  // is `.wc`; the thing that blurs the app behind it is `.wc-veil` — a FIXED, full-viewport
  // backdrop-filter: blur(9px). Six probes dismissed the first and left the second, so every
  // screenshot any of them produced was shot through a 9px blur, and no DOM assertion could see
  // it: the tree is perfectly correct underneath. The owner is the one who caught it, by eye,
  // after a day of unreadable screenshots.
  const veils = await p.evaluate(() => [...document.querySelectorAll('*')]
    .filter((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return (cs.backdropFilter !== 'none' || cs.filter.includes('blur'))
        && r.width > window.innerWidth * 0.5 && r.height > window.innerHeight * 0.5;
    })
    .map(el => el.tagName + '.' + String(el.className).slice(0, 40) + ' ' + getComputedStyle(el).backdropFilter));
  check('no full-screen blur or veil is covering the app', veils.length === 0, veils);

  check('both goal pickers offer every goal plus an all-option',
    options.products.length === options.foods.length && options.products.length > 25,
    { products: options.products.length, foods: options.foods.length });

  const table = [];
  for (const surface of [
    { key: 'products', sel: 'rec-goal', page: 'rec-page', card: '.ck-recgrid .rec', size: 3 },
    { key: 'foods', sel: 'food-goal', page: 'food-page', card: '[data-foodsblock] .fs-tile', size: 3 },
  ]) {
    const all = await censusOne(surface.sel, surface.page, surface.card, '', surface.size);
    check(`${surface.key}: the unfiltered pool is the whole catalogue`, all > 100, { all });
    const ceiling = Math.round(all * CEILING_SHARE);
    let worstLow = { n: Infinity }; let worstHigh = { n: -1 };
    for (const o of options[surface.key]) {
      if (o.v === '') continue;
      const n = await censusOne(surface.sel, surface.page, surface.card, o.v, surface.size);
      table.push({ surface: surface.key, goal: o.v, n, of: all });
      if (n < worstLow.n) worstLow = { goal: o.v, n };
      if (n > worstHigh.n) worstHigh = { goal: o.v, n };
    }
    check(`${surface.key}: no goal returns fewer than ${FLOOR}`, worstLow.n >= FLOOR, { ...worstLow, of: all });
    check(`${surface.key}: no goal keeps more than ${Math.round(CEILING_SHARE * 100)}% of the catalogue`,
      worstHigh.n <= ceiling, { ...worstHigh, ceiling, of: all });
    // A filter can only ever NARROW. If some goal out-counted the unfiltered pool, the pool
    // arithmetic would be wrong rather than the calibration — a different bug wearing the
    // same clothes, and one a band alone would not separate.
    check(`${surface.key}: no goal returns more than the unfiltered pool`, worstHigh.n <= all,
      { ...worstHigh, of: all });
    // Reset so the next surface starts from the whole pool.
    await censusOne(surface.sel, surface.page, surface.card, '', surface.size);
  }

  console.log('\nCENSUS  (goal · products of pool · foods of pool)');
  const byGoal = new Map();
  for (const r of table) {
    const e = byGoal.get(r.goal) || { goal: r.goal };
    e[r.surface] = r.n; e[r.surface + 'Of'] = r.of; byGoal.set(r.goal, e);
  }
  for (const e of byGoal.values()) {
    console.log('  ' + String(e.goal).padEnd(22)
      + String(e.products).padStart(4) + '/' + e.productsOf
      + String(e.foods).padStart(6) + '/' + e.foodsOf);
  }

  // ─── The report that named the defect, end to end ─────────────────────────
  // A 24-essential daily multi that delivers ALL of Wallach's vitamin B2 was absent from every
  // one of the owner's five goals. This walks the filtered list page by page and looks for it
  // on screen, rather than trusting the pool arithmetic that put it there.
  await p.evaluate(m => {
    const s = document.querySelector(m + '[data-rec-goal]');
    s.value = 'more-energy';
    s.dispatchEvent(new Event('input', { bubbles: true }));
  }, M);
  await sleep(320);
  await p.evaluate(m => {
    const el = [...document.querySelectorAll(m + '[data-rec-page]')].find(x => Number(x.dataset.recPage) === 0);
    if (el) el.click();
  }, M);
  await sleep(320);
  const names = [];
  const chipTexts = [];
  for (let i = 0; i < 60; i++) {
    const page = await p.evaluate(m => [...document.querySelectorAll(m + '.ck-recgrid .rec__name')].map(n => n.textContent.trim()), M);
    names.push(...page);
    chipTexts.push(...await p.evaluate(m => [...document.querySelectorAll(m + '.ck-recgrid .ck-tag')].map(n => n.textContent.trim()), M));
    const moved = await p.evaluate(m => {
      const btns = [...document.querySelectorAll(m + '[data-rec-page]')];
      const cur = btns.find(x => x.getAttribute('aria-current') === 'page');
      const now = cur ? Number(cur.dataset.recPage) : 0;
      const next = btns.find(x => Number(x.dataset.recPage) === now + 1 && !x.disabled);
      if (!next) return false;
      next.click();
      return true;
    }, M);
    if (!moved) break;
    await sleep(220);
  }
  check('ultimate-daily is on screen under "more energy"',
    names.includes('Ultimate Daily - 180 Tablets'),
    { pagesWalked: Math.ceil(names.length / 3), found: names.filter(n => /^Ultimate Daily/.test(n)) });

  // ★ NO CHIP MAY READ "0%". A product can be listed under a goal on an essential Wallach puts
  // no number on; the card then has no share to state and must stay silent rather than print a
  // measured-looking zero. 134 chips read that way on 2026-08-24 before the EFA group was bound
  // into the scorer. Walked across every page of a real filtered list, not sampled.
  const zeroChips = chipTexts.filter(t => /(^|\s)0\s*%/.test(t));
  check('no goal chip states a share of zero', zeroChips.length === 0,
    { chips: chipTexts.length, zero: zeroChips.slice(0, 6) });
  // A chip that carries a percentage carries a REAL one. The breadth it has to be read against
  // ("15 of 20") lives in the chip's title since the owner ruled it off the label for width, so
  // it is out of this check's reach — state/recommender.ts is where that pair is enforced.
  const malformed = chipTexts.filter(t => /%/.test(t) && !/(<1|[1-9][0-9]*)%$/.test(t));
  check('every chip with a number states a real share', chipTexts.length > 0 && malformed.length === 0,
    { chips: chipTexts.length, bad: malformed.slice(0, 6), sample: chipTexts.slice(0, 3) });

  check('no page errors', errs.length === 0, errs.slice(0, 3));
  await p.screenshot({ path: path.join(OUT, 'goal_filter_census.png') });
  await b.close();
  console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILED`);
  process.exit(fails === 0 ? 0 : 1);
})();
