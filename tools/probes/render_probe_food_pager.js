// tools/probes/render_probe_food_pager.js — the Regimen console's food pager + filter.
//
// Usage: node tools/probes/render_probe_food_pager.js
//
// Proves the WINDOWED pager and the category/name filter behave on the real page, driven
// through the real controls:
//
//   1. page one lists   ‹ 1 2 3 4 5 … 64 ›
//   2. page twenty      ‹ 1 … 20 21 22 23 24 … 64 ›     (the window STARTS at the current
//                                                        page — the owner's shape, 2026-08-22)
//   3. the last page    ‹ 1 … 60 61 62 63 64 ›          (the window slides back rather than
//                                                        printing a lonely "1 … 64")
//   4. no ellipsis stands between two pages that ARE neighbours
//   5. the arrows disable at each end, and only there
//   6. the pager sits LEFT of the filter on a wide block, and BELOW it on a narrow one
//   7. the category select offers exactly the catalog's categories + "all"
//   8. a category narrows the POOL: the page count falls to the real number of pages
//   9. typing in the name box narrows further, KEEPS THE CARET, and resets to page one
//  10. a filter that matches nothing still leaves the filter on screen to undo
//
// ★ A DOM PROBE IS NOT A VISUAL CHECK. Everything below can pass while the row is unreadable,
// so the run also dismisses the welcome veil, asserts the pager is genuinely the topmost
// element at its own centre, and captures a screenshot for human eyes.

const path = require('path');
const fs = require('fs');
const REPO = path.resolve(__dirname, '..', '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER'); process.exit(2); }

const OUT = process.env.FOODS_SHOT_DIR || path.join(REPO, 'temporary');
fs.mkdirSync(OUT, { recursive: true });

const fails = [];
const check = (label, cond, detail) => {
  console.log(`  ${cond ? 'ok  ' : 'FAIL'}  ${label}${detail === undefined ? '' : `  ${detail}`}`);
  if (!cond) { fails.push(label); }
};

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto('file://' + path.join(REPO, 'dashboard', 'dashboard.html').replace(/\\/g, '/'),
    { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 900));
  await page.evaluate(() => {
    const btn = document.querySelector('.wc-veil .ui-close, .wc-veil [data-wc-close], .wc-veil button');
    if (btn) { btn.click(); }
  });
  await new Promise(r => setTimeout(r, 400));
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('wallach:navigate', { detail: { to: 'regimen' } }));
  });
  await new Promise(r => setTimeout(r, 800));

  // ── the one reader every assertion goes through ────────────────────────────
  // Scoped to the LAID-OUT block: both workspaces stay in the DOM and a bare selector finds
  // the hidden copy, which reports zero-size rects and would pass rows that are invisible.
  const read = () => page.evaluate(() => {
    const block = [...document.querySelectorAll('.fs-block')]
      .filter(b => b.getBoundingClientRect().height > 0)[0];
    if (!block) { return { present: false }; }
    const nav = block.querySelector('.fs-pager');
    const row = block.querySelector('.fs-controls');
    const filter = block.querySelector('.fs-filter');
    const cat = block.querySelector('[data-food-cat]');
    const q = block.querySelector('[data-food-q]');
    const rect = e => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), bottom: Math.round(r.bottom) }; };
    const items = nav ? [...nav.children].map(c => ({
      text: (c.textContent || '').trim(),
      page: c.dataset ? c.dataset.foodPage : undefined,
      disabled: c.disabled === true,
      current: c.getAttribute('aria-current') === 'page',
      gap: c.classList.contains('fs-pager__gap'),
      top: Math.round(c.getBoundingClientRect().top),
    })) : [];
    // ★ SCROLL IT INTO VIEW FIRST. elementFromPoint returns null for a point below the
    // fold, and a null read here is indistinguishable from an overlay — the first run of
    // this probe reported "something else is on top" about a pager that was simply
    // 40px past the bottom of a 950px viewport.
    if (nav) { nav.scrollIntoView({ block: 'center' }); }
    const mid = nav ? (() => { const r = nav.getBoundingClientRect(); return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); })() : null;
    return {
      present: true,
      hasRow: !!row,
      items,
      cards: block.querySelectorAll('.fs-tile').length,
      note: (block.querySelector('.fs-note') || {}).textContent || null,
      navRect: nav ? rect(nav) : null,
      filterRect: filter ? rect(filter) : null,
      rowRect: row ? rect(row) : null,
      options: cat ? [...cat.options].map(o => o.value) : null,
      catValue: cat ? cat.value : null,
      qValue: q ? q.value : null,
      focusIsQuery: !!(q && document.activeElement === q),
      caret: q && document.activeElement === q ? q.selectionStart : null,
      topmostInsideNav: nav && mid ? nav.contains(mid) : false,
    };
  });

  /** The pager as a reader sees it: "‹ 1 2 3 4 5 … 64 ›". */
  const shape = s => s.items.map(i => i.text).join(' ');
  /** Click a page button by its printed label. */
  const clickPage = async (label) => {
    await page.evaluate((l) => {
      const block = [...document.querySelectorAll('.fs-block')]
        .filter(b => b.getBoundingClientRect().height > 0)[0];
      const b = [...block.querySelectorAll('.fs-pager__b')]
        .find(x => (x.textContent || '').trim() === l);
      if (b) { b.click(); }
    }, label);
    await new Promise(r => setTimeout(r, 250));
  };

  console.log('\n── the windowed pager ──');
  let s = await read();
  check('the block and its pager render', s.present && s.items.length > 0);
  if (!s.present) { console.log('RESULT: FAIL (no block)'); await browser.close(); process.exit(1); }

  const lastLabel = s.items.filter(i => !i.gap && i.page !== undefined)
    .map(i => i.text).filter(t => /^\d+$/.test(t)).pop();
  console.log('  page 1 :', shape(s));
  check('page one is ‹ 1 2 3 4 5 … LAST ›', shape(s) === `‹ 1 2 3 4 5 … ${lastLabel} ›`, shape(s));
  check('page one is marked current', s.items.find(i => i.text === '1').current === true);
  check('prev is disabled at the start', s.items[0].disabled === true);
  check('next is live at the start', s.items[s.items.length - 1].disabled === false);
  check('the pager is topmost at its own centre', s.topmostInsideNav === true);
  // The ellipsis is a 10px span centred in an 18px row, so its top is LEGITIMATELY off
  // the buttons' — comparing every child's top reported a wrap that was not there. The
  // honest test is the nav's own height against one button's.
  check('the pager does not wrap',
    s.navRect.h <= 22 && new Set(s.items.filter(i => !i.gap).map(i => i.top)).size === 1,
    `nav ${s.navRect.h}px, ${new Set(s.items.filter(i => !i.gap).map(i => i.top)).size} button row(s)`);

  console.log('\n── the row: filters, with the pager beside them or below them ──');
  check('pager and filter share one row', s.hasRow && s.navRect !== null && s.filterRect !== null);
  const filterHome = s.filterRect.x;
  // ★ TWO CORRECT SHAPES SINCE 2026-08-24, and this probe has to know both. The row WRAPS now
  // (owner: "let the pagination wrap BELOW the filters on smaller screens"), because the sort
  // and goal pickers were widened to stop clipping their own labels and no longer fit beside a
  // pager on a narrow block. So: beside the filter on a wide block, under it on a narrow one.
  // What is never correct is the pager ABOVE the filter — that is what wrap-reverse exists to
  // prevent — or the pager crushed to nothing, which is the zero-width regression this file
  // caught in the first place. Both are still asserted, in both shapes.
  const sameLine = Math.abs(s.navRect.y - s.filterRect.y) < 6;
  console.log(`  (row is ${sameLine ? 'ONE line' : 'WRAPPED'} at this width: ${s.rowRect.h}px)`);
  if (sameLine) {
    check('the pager sits LEFT of the filter', s.navRect.x + s.navRect.w <= s.filterRect.x,
      `pager ends ${s.navRect.x + s.navRect.w}, filter starts ${s.filterRect.x}`);
    check('the unwrapped row is one line tall', s.rowRect.h <= Math.max(s.navRect.h, s.filterRect.h) + 2,
      `${s.rowRect.h}px`);
  }
  else {
    check('the wrapped pager sits BELOW the filter, never above it', s.navRect.y > s.filterRect.y,
      `pager y ${s.navRect.y}, filter y ${s.filterRect.y}`);
    check('the wrapped row is two lines tall, not more',
      s.rowRect.h <= s.navRect.h + s.filterRect.h + 12, `${s.rowRect.h}px`);
  }
  // The regression that made this file worth having: the filter grew and the pager absorbed the
  // whole overflow at zero width — in the DOM, invisible, every click target gone.
  check('the pager keeps its full width whatever the filter does', s.navRect.w > 100,
    `${s.navRect.w}px`);

  // ── walk to page twenty through the real controls ─────────────────────────
  // ★ A WINDOW CANNOT JUMP TO A PAGE IT DOES NOT LIST, and that is the shape rather
  // than a defect: from page one the furthest reachable number is five. Walk there the
  // way a reader does, clicking the furthest listed page that is not past the target.
  const gotoPage = async (target) => {
    for (let guard = 0; guard < 40; guard += 1) {
      const st = await read();
      const cur = Number((st.items.find(i => i.current) || {}).text);
      if (cur === target) { return true; }
      const reachable = st.items
        .filter(i => !i.gap && /^\d+$/.test(i.text))
        .map(i => Number(i.text))
        .filter(n => (target > cur ? n <= target && n > cur : n >= target && n < cur));
      if (reachable.length === 0) { return false; }
      await clickPage(String(target > cur ? Math.max(...reachable) : Math.min(...reachable)));
    }
    return false;
  };
  console.log('\n── page twenty ──');
  const reached = await gotoPage(20);
  check('page twenty is reachable through the window', reached === true);
  s = await read();
  console.log('  page 20:', shape(s));
  check('the window STARTS at the current page',
    shape(s) === `‹ 1 … 20 21 22 23 24 … ${lastLabel} ›`, shape(s));
  check('page twenty is marked current', (s.items.find(i => i.text === '20') || {}).current === true);
  check('both arrows are live in the middle',
    s.items[0].disabled === false && s.items[s.items.length - 1].disabled === false);

  console.log('\n── the last page ──');
  await clickPage(lastLabel);
  s = await read();
  console.log('  page N :', shape(s));
  const tail = Number(lastLabel);
  check('the window slides back rather than stranding the last page',
    shape(s) === `‹ 1 … ${tail - 4} ${tail - 3} ${tail - 2} ${tail - 1} ${tail} ›`, shape(s));
  check('next is disabled at the end', s.items[s.items.length - 1].disabled === true);
  check('prev is live at the end', s.items[0].disabled === false);
  check('no ellipsis stands between two neighbours', (() => {
    for (let i = 1; i < s.items.length - 1; i += 1) {
      if (!s.items[i].gap) { continue; }
      const before = Number(s.items[i - 1].text);
      const after = Number(s.items[i + 1].text);
      if (Number.isFinite(before) && Number.isFinite(after) && after - before <= 1) { return false; }
    }
    return true;
  })());

  // ── the filter ────────────────────────────────────────────────────────────
  console.log('\n── the filter ──');
  check('the select offers "all" first', s.options !== null && s.options[0] === '');
  check('the select offers more than one category', s.options.length > 2, `${s.options.length - 1} categories`);

  await clickPage('1');
  const beforePages = (await read()).items.filter(i => /^\d+$/.test(i.text)).map(i => Number(i.text)).pop();
  const firstCat = s.options[1];
  await page.select('.fs-block:not([hidden]) [data-food-cat]', firstCat).catch(async () => {
    await page.evaluate((v) => {
      const block = [...document.querySelectorAll('.fs-block')].filter(b => b.getBoundingClientRect().height > 0)[0];
      const el = block.querySelector('[data-food-cat]');
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, firstCat);
  });
  await new Promise(r => setTimeout(r, 300));
  s = await read();
  console.log(`  category "${firstCat}":`, shape(s) || '(no pager — one page)', `· ${s.cards} card(s)`);
  check('the category is applied', s.catValue === firstCat);
  const afterPages = s.items.filter(i => /^\d+$/.test(i.text)).map(i => Number(i.text)).pop() || 1;
  check('the page count FELL with the pool', afterPages < beforePages,
    `${beforePages} → ${afterPages} page(s)`);
  check('the filter is still on screen', s.filterRect !== null && s.filterRect.w > 0);

  // typing: the caret must survive the repaint, and the page must go back to one
  console.log('\n── typing in the name box ──');
  await page.evaluate(() => {
    const block = [...document.querySelectorAll('.fs-block')].filter(b => b.getBoundingClientRect().height > 0)[0];
    const el = block.querySelector('[data-food-cat]');
    el.value = '';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 250));
  await clickPage('3');
  await page.evaluate(() => {
    const block = [...document.querySelectorAll('.fs-block')].filter(b => b.getBoundingClientRect().height > 0)[0];
    block.querySelector('[data-food-q]').focus();
  });
  await page.keyboard.type('beef', { delay: 40 });
  await new Promise(r => setTimeout(r, 300));
  s = await read();
  console.log('  query "beef":', shape(s) || '(no pager — one page)', `· ${s.cards} card(s)`, `· caret ${s.caret}`);
  check('the query is applied', s.qValue === 'beef');
  // ★ THE FILTER MUST NOT MOVE. A narrow enough pool fits one page and the pager vanishes;
  // under space-between the filter then slid to the left edge, out from under the cursor
  // mid-word. Its x is the assertion, and it is measured against where it sat with a pager.
  check('the filter stayed exactly where it was', s.filterRect.x === filterHome,
    `${filterHome} -> ${s.filterRect.x}`);
  check('the caret stayed in the box across the repaint', s.focusIsQuery === true);
  check('the caret is at the end of what was typed', s.caret === 4, String(s.caret));
  check('the list narrowed', s.cards > 0 && s.cards <= 3);
  check('it went back to page one', s.items.length === 0 || (s.items.find(i => i.current) || {}).text === '1');

  console.log('\n── a filter that matches nothing ──');
  await page.evaluate(() => {
    const block = [...document.querySelectorAll('.fs-block')].filter(b => b.getBoundingClientRect().height > 0)[0];
    const el = block.querySelector('[data-food-q]');
    el.value = 'zzzz no such food';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 300));
  s = await read();
  console.log('  note:', JSON.stringify(s.note));
  check('it says the FILTER found nothing, not that no food moves a gap',
    typeof s.note === 'string' && /filter/i.test(s.note));
  check('the filter survives so it can be undone', s.filterRect !== null && s.filterRect.w > 0);
  check('no cards are painted', s.cards === 0);

  // back to a clean state for the screenshot
  await page.evaluate(() => {
    const block = [...document.querySelectorAll('.fs-block')].filter(b => b.getBoundingClientRect().height > 0)[0];
    const el = block.querySelector('[data-food-q]');
    el.value = '';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 300));
  await clickPage('20');
  const shot = path.join(OUT, 'food-pager-regimen.png');
  await page.screenshot({ path: shot });
  const blockShot = path.join(OUT, 'food-pager-block.png');
  const el = await page.$('.fs-block');
  const laid = await page.evaluateHandle(() => [...document.querySelectorAll('.fs-block')]
    .filter(b => b.getBoundingClientRect().height > 0)[0]);
  await (laid.asElement() || el).screenshot({ path: blockShot });

  console.log('\npage errors:', errors.length ? errors.slice(0, 4) : 'none');
  console.log('screenshots:', shot, '\n             ' + blockShot);
  console.log(`\n${fails.length === 0 ? 'RESULT: PASS (now look at the screenshots)' : 'RESULT: FAIL — ' + fails.join(' | ')}`);
  await browser.close();
  process.exit(fails.length === 0 && errors.length === 0 ? 0 : 1);
})();
