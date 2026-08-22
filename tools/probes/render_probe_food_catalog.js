// tools/probes/render_probe_food_catalog.js — catalog FOODS on the Knowledge Products tab.
//
// Usage: node tools/probes/render_probe_food_catalog.js
//
// Proves the mixed catalog and the nutrient sheet behave on the real page, driven through the
// real controls:
//
//   1. the grid holds BOTH kinds, and the section head's counts match what is actually there
//   2. one order over both — the ghost numbers never rise as you go down the grid
//   3. a food's colour is none of the seven delivery-form colours (the whole point of the hue)
//   4. the All / Products / Foods control shows exactly what it says, sits on the section
//      head's own row at the grid's right edge, and adds NO height to that row
//   5. the tab search still reaches a food, by name AND by a nutrient it carries
//   6. clicking a food opens a nutrient sheet whose row count EQUALS its card's ghost number
//   7. the sheet's third column is "% of target" — Wallach's, never the FDA's %DV
//   8. the sheet's rows descend, carry a real amount + unit, and link to essential pages
//   9. the sheet's Add button is STYLED — measured against the product sheet's, because a
//      rule scoped to one sheet kind is invisible to every check that only asks whether the
//      button exists (it shipped that way once, on 2026-08-22)
//  10. Home's live-suggest answers with a Foods group and a Products group
//
// ★ A DOM PROBE IS NOT A VISUAL CHECK. Screenshots at the end; a person still has to look.

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
const KD = '#drawer-knowledge-mount';

const fails = [];
const check = (label, cond, detail) => {
  console.log(`  ${cond ? 'ok  ' : 'FAIL'}  ${label}${detail === undefined ? '' : `  ${detail}`}`);
  if (!cond) { fails.push(label); }
};
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto('file://' + path.join(REPO, 'dashboard', 'dashboard.html').replace(/\\/g, '/'),
    { waitUntil: 'networkidle0' });
  await wait(900);
  await page.evaluate(() => {
    const b = document.querySelector('.wc-veil .ui-close, .wc-veil [data-wc-close], .wc-veil button');
    if (b) { b.click(); }
  });
  await wait(400);
  await page.evaluate(() => document.querySelector('[data-rail-nav="knowledge"]')?.click());
  await wait(450);
  await page.evaluate(k => document.querySelector(k + ' [data-kd-tab="products"]')?.click(), KD);
  await wait(450);

  const readGrid = () => page.evaluate((k) => {
    const rows = [...document.querySelectorAll(k + ' .kd-product-row')];
    const visible = rows.filter(r => !r.classList.contains('kd-hidden'));
    const of = r => ({
      food: r.classList.contains('kd-product-row--food'),
      name: (r.querySelector('.kd-product-row__name') || {}).textContent || '',
      ghost: Number((r.querySelector('.kd-product-row__ghost') || {}).textContent || '0'),
      foot: (r.querySelector('.kd-product-row__foot') || {}).textContent || '',
      cat: (r.querySelector('.kd-product-row__cat') || {}).textContent || '',
      form: getComputedStyle(r).getPropertyValue('--form').trim(),
    });
    const head = document.querySelector(k + ' .kd-section-head');
    const filter = [...document.querySelectorAll(k + ' .kd-catfilter__b')]
      .map(b => ({ id: b.dataset.kdCatfilter, on: b.classList.contains('is-on') }));
    const bar = document.querySelector(k + ' .kd-catbar');
    const filtEl = document.querySelector(k + ' .kd-catfilter');
    const grid = document.querySelector(k + ' .kd-products-grid');
    const mid = e => Math.round(e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2);
    const geo = (bar && head && filtEl && grid) ? {
      // ★ THE BAR MUST BE NO TALLER THAN THE HEAD ALONE. The pills stand 21px against a
      // 15px line and pushed the whole grid down 6px when they first landed; a negative
      // block margin takes it back. Measured here so it cannot drift back.
      barH: Math.round(bar.getBoundingClientRect().height),
      headH: Math.round(head.getBoundingClientRect().height),
      sameRow: mid(head) === mid(filtEl),
      filterRight: Math.round(filtEl.getBoundingClientRect().right),
      gridRight: Math.round(grid.getBoundingClientRect().right),
      headLeft: Math.round(head.getBoundingClientRect().left),
      gridLeft: Math.round(grid.getBoundingClientRect().left),
    } : null;
    return {
      total: rows.length,
      rows: visible.map(of),
      head: head ? (head.textContent || '').trim() : null,
      headHidden: head ? head.classList.contains('kd-hidden') : null,
      filter,
      geo,
      filterPresent: !!filtEl,
    };
  }, KD);

  console.log('\n── the mixed grid ──');
  let g = await readGrid();
  const foods = g.rows.filter(r => r.food);
  const products = g.rows.filter(r => !r.food);
  console.log('  head:', JSON.stringify(g.head));
  check('both kinds render', foods.length > 0 && products.length > 0,
    `${products.length} product(s), ${foods.length} food(s)`);
  // ★ THE HEAD IS CHECKED AGAINST THE DOM, not against a number this probe knows. A count
  // that agrees with the grid is the only kind that cannot go stale.
  const m = (g.head || '').match(/ALL (\d+) PRODUCTS \+ (\d+) FOODS/);
  check('the head names both counts', m !== null, g.head || '');
  if (m !== null) {
    check('the head agrees with the grid',
      Number(m[1]) === products.length && Number(m[2]) === foods.length,
      `head ${m[1]}+${m[2]} vs grid ${products.length}+${foods.length}`);
  }
  check('every food row is labelled FOOD', foods.every(f => f.cat.trim() === 'FOOD'));
  check('every food row shows its serving, and no price',
    foods.every(f => /essentials · /.test(f.foot) && !f.foot.includes('$')),
    JSON.stringify(foods[0] ? foods[0].foot : ''));

  // one order over both kinds
  const ghosts = g.rows.map(r => r.ghost);
  check('one order over both kinds — ghost numbers never rise',
    ghosts.every((v, i) => i === 0 || ghosts[i - 1] >= v));
  check('a food outranks some product', (() => {
    const firstFood = g.rows.findIndex(r => r.food);
    const lastProduct = g.rows.map(r => !r.food).lastIndexOf(true);
    return firstFood >= 0 && lastProduct > firstFood;
  })(), 'foods are interleaved, not appended');

  const FORM_COLORS = ['#3f8fa8', '#c08a3e', '#5f8a4b', '#5a63a8', '#a8517f', '#9a7b3c', '#6a6f77'];
  const foodHue = foods[0] ? foods[0].form.toLowerCase() : '';
  check('the food hue is none of the seven product hues',
    foodHue.length > 0 && !FORM_COLORS.includes(foodHue), foodHue);

  // ── the All / Products / Foods control ──
  console.log('\n── the tab filter ──');
  check('the control renders, with All on', g.filterPresent
    && (g.filter.find(b => b.id === 'all') || {}).on === true);
  check('the control shares the section head\'s row', g.geo !== null && g.geo.sameRow === true);
  check('the control adds no height to that row',
    g.geo !== null && g.geo.barH === g.geo.headH, `bar ${g.geo.barH}px vs head ${g.geo.headH}px`);
  check('the control ends at the grid\'s right edge',
    g.geo !== null && g.geo.filterRight === g.geo.gridRight,
    `${g.geo.filterRight} vs ${g.geo.gridRight}`);
  check('the head still starts at the grid\'s left edge',
    g.geo !== null && g.geo.headLeft === g.geo.gridLeft,
    `${g.geo.headLeft} vs ${g.geo.gridLeft}`);
  const setKind = async (id) => {
    await page.evaluate((a) => document.querySelector(a.k + ' [data-kd-catfilter="' + a.id + '"]')?.click(), { k: KD, id });
    await wait(300);
    return readGrid();
  };
  g = await setKind('foods');
  check('Foods shows only foods', g.rows.length > 0 && g.rows.every(r => r.food), `${g.rows.length} row(s)`);
  check('…and the head says so', /^ALL \d+ FOODS/.test(g.head || ''), g.head || '');
  g = await setKind('products');
  check('Products shows only products', g.rows.length > 0 && g.rows.every(r => !r.food), `${g.rows.length} row(s)`);
  g = await setKind('all');
  check('All brings both back', g.rows.some(r => r.food) && g.rows.some(r => !r.food));

  // ── the tab search still reaches a food ──
  console.log('\n── search, on the tab ──');
  const search = async (q) => {
    await page.evaluate((a) => {
      const i = document.querySelector(a.k + ' .kd-search-input');
      if (i) { i.value = a.q; i.dispatchEvent(new Event('input', { bubbles: true })); }
    }, { k: KD, q });
    await wait(300);
    return readGrid();
  };
  g = await search('salmon');
  check('a food answers its own name', g.rows.some(r => r.food && /salmon/i.test(r.name)),
    `${g.rows.length} row(s)`);
  g = await search('selenium');
  check('a food answers a nutrient it carries', g.rows.some(r => r.food),
    `${g.rows.filter(r => r.food).length} food(s) of ${g.rows.length}`);
  check('the tab filter survives a search that hides the head',
    g.filterPresent === true);
  await search('');

  // ── the nutrient sheet ──
  console.log('\n── the nutrient sheet ──');
  const target = (await readGrid()).rows.filter(r => r.food).sort((a, b) => b.ghost - a.ghost)[0];
  await page.evaluate((a) => {
    const row = [...document.querySelectorAll(a.k + ' .kd-product-row--food')]
      .find(r => (r.querySelector('.kd-product-row__name') || {}).textContent === a.name);
    if (row) { row.click(); }
  }, { k: KD, name: target.name });
  await wait(450);

  const sheet = await page.evaluate((k) => {
    const deep = document.querySelector(k + ' .kd-ep--food');
    if (!deep) { return { present: false }; }
    const rows = [...deep.querySelectorAll('.kd-pf-nrow')];
    const heads = [...deep.querySelectorAll('.kd-pf-nhead span')].map(s => (s.textContent || '').trim());
    return {
      present: true,
      name: (deep.querySelector('.kd-ep-hero__name') || {}).textContent || '',
      chip: (deep.querySelector('.kd-ep-hero__form') || {}).textContent || '',
      lede: (deep.querySelector('.kd-ep-lede') || {}).textContent || '',
      glance: (deep.querySelector('.kd-pf-glance__num') || {}).textContent || '',
      heads,
      rows: rows.map(r => ({
        nm: (r.querySelector('.kd-pf-nrow__nm') || {}).textContent || '',
        amt: (r.querySelector('.kd-pf-nrow__amt') || {}).textContent || '',
        pct: Number(((r.querySelector('.kd-pf-nrow__dv') || {}).textContent || '').replace('%', '')),
        linked: r.classList.contains('kd-pf-nrow--link'),
        gloss: r.getAttribute('title') || '',
      })),
      addBtn: !!deep.querySelector('[data-add-food]'),
      addStyle: (() => {
        const b = deep.querySelector('[data-add-food]');
        if (!b) { return null; }
        const s = getComputedStyle(b);
        return {
          font: s.fontFamily, size: s.fontSize, weight: s.fontWeight,
          transform: s.textTransform, pad: s.padding, radius: s.borderRadius,
          bg: s.backgroundColor, colour: s.color,
        };
      })(),
      backBtn: (deep.querySelector('[data-kd-action="food-close"]') || {}).textContent || '',
      // EVERY note, not the first: the sheet carries two (the glance's provenance line and
      // the label's own limits), and querySelector returned the wrong one on the first run.
      notes: [...deep.querySelectorAll('.kd-pf-note')].map(n => n.textContent || ''),
      foot: (deep.querySelector('.kd-corpus__foot') || {}).textContent || '',
      hasDV: deep.innerHTML.includes('%DV'),
      crumbs: [...document.querySelectorAll(k + ' .kd-crumb')].map(c => (c.textContent || '').trim()),
    };
  }, KD);

  check('the sheet opens', sheet.present === true);
  check('it names the food it was clicked from', sheet.name === target.name, `${sheet.name} vs ${target.name}`);
  check('the chip reads FOOD', sheet.chip.trim() === 'FOOD');
  // ★ THE CROSS-SURFACE CHECK. The card's ghost and the sheet's row count are computed the
  // same way and MUST agree; a food claiming two different breadths on two surfaces is the
  // exact defect this pairs the two numbers to catch.
  check('the sheet has exactly as many rows as the card promised',
    sheet.rows.length === target.ghost, `sheet ${sheet.rows.length} vs card ${target.ghost}`);
  check('the glance repeats that number', Number(sheet.glance) === target.ghost, sheet.glance);
  check('the third column is Wallach\'s target, not the FDA\'s %DV',
    sheet.heads[2] === '% of target' && sheet.hasDV === false, JSON.stringify(sheet.heads));
  check('every row carries a real amount and unit',
    sheet.rows.every(r => /\d/.test(r.amt) && /[a-z]/i.test(r.amt)),
    JSON.stringify(sheet.rows[0] ? sheet.rows[0].amt : ''));
  check('the rows descend by percentage',
    sheet.rows.every((r, i) => i === 0 || sheet.rows[i - 1].pct >= r.pct));
  check('every row glosses its own source',
    sheet.rows.every(r => /Food composition from /.test(r.gloss) && /Wallach/.test(r.gloss)));
  check('most rows link to their essential page',
    sheet.rows.filter(r => r.linked).length >= sheet.rows.length - 1,
    `${sheet.rows.filter(r => r.linked).length}/${sheet.rows.length}`);
  check('it says what the label does NOT hold',
    sheet.notes.some(n => /Not a complete nutrition label/.test(n)),
    `${sheet.notes.length} note(s)`);
  check('it names its sources', /^SOURCE · /.test(sheet.foot), sheet.foot.slice(0, 60));
  check('it offers Add to regimen', sheet.addBtn === true);
  check('the breadcrumb names the food', sheet.crumbs.some(c => c === target.name),
    JSON.stringify(sheet.crumbs));

  const shotSheet = path.join(OUT, 'food-sheet.png');
  await page.screenshot({ path: shotSheet });

  // ── the Add button, measured against the product sheet's ──────────────────
  // ★ NOT "is it there". It WAS there, and unstyled: the fill rule was scoped to
  // .kd-ep--prod, so the food sheet fell through to the browser default and every
  // existence check still passed. The honest test is that the two sheets' buttons agree.
  await page.evaluate(k => document.querySelector(k + ' [data-kd-action="food-close"]')?.click(), KD);
  await wait(400);
  await page.evaluate(k => document.querySelector(k + ' .kd-product-row[data-kd-product]')?.click(), KD);
  await wait(450);
  const prodAdd = await page.evaluate((k) => {
    const b = document.querySelector(k + ' .kd-ep--prod [data-add-product]');
    if (!b) { return null; }
    const s = getComputedStyle(b);
    return {
      font: s.fontFamily, size: s.fontSize, weight: s.fontWeight,
      transform: s.textTransform, pad: s.padding, radius: s.borderRadius,
      bg: s.backgroundColor, colour: s.color,
    };
  }, KD);
  const fa = sheet.addStyle;
  check('the product sheet\'s Add button was found to compare against', prodAdd !== null);
  if (prodAdd !== null && fa !== null) {
    for (const key of ['font', 'size', 'weight', 'transform', 'pad', 'radius', 'colour']) {
      check(`Add button: ${key} matches the product sheet`, fa[key] === prodAdd[key],
        `${fa[key]} vs ${prodAdd[key]}`);
    }
    // The FILL must differ — each sheet fills in its own --form — but both must be a real
    // fill. A transparent background is exactly what an unstyled button reports.
    check('Add button: filled in the food\'s own colour, not transparent',
      /^rgba?\(/.test(fa.bg) && !/rgba\(0, 0, 0, 0\)/.test(fa.bg) && fa.bg !== prodAdd.bg,
      `${fa.bg} vs ${prodAdd.bg}`);
  }
  await page.evaluate(k => document.querySelector(k + ' [data-kd-action="product-close"]')?.click(), KD);
  await wait(350);

  const shotGrid = path.join(OUT, 'food-catalog-grid.png');
  await page.screenshot({ path: shotGrid });

  // ── Home's live-suggest ──
  console.log('\n── home live-suggest ──');
  await page.evaluate(k => document.querySelector(k + ' [data-kd-tab="home"]')?.click(), KD);
  await wait(400);
  const suggest = await page.evaluate(async (k) => {
    const i = document.querySelector(k + ' .kh-search');
    i.value = 'salmon';
    i.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 200));
    const panel = document.querySelector(k + ' .sh-search__results');
    return {
      groups: [...panel.querySelectorAll('.sh-res__group')].map(g => (g.textContent || '').trim()),
      rows: [...panel.querySelectorAll('.sh-res')].map(b => ({
        nm: (b.querySelector('.sh-res__nm') || {}).textContent || '',
        meta: (b.querySelector('.sh-res__meta') || {}).textContent || '',
        food: b.hasAttribute('data-kd-food'),
        product: b.hasAttribute('data-kd-product'),
      })),
    };
  }, KD);
  console.log('  groups:', JSON.stringify(suggest.groups));
  check('a food reaches the home panel', suggest.rows.some(r => r.food),
    JSON.stringify(suggest.rows.filter(r => r.food).slice(0, 2)));
  check('the food row says serving + category, not "0 claims"',
    suggest.rows.filter(r => r.food).every(r => !/claim/.test(r.meta) && r.meta.includes('·')));
  const shotSuggest = path.join(OUT, 'food-home-suggest.png');
  await page.screenshot({ path: shotSuggest });

  const suggest2 = await page.evaluate(async (k) => {
    const i = document.querySelector(k + ' .kh-search');
    i.value = 'beyond tangy';
    i.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 200));
    const panel = document.querySelector(k + ' .sh-search__results');
    return [...panel.querySelectorAll('.sh-res')].filter(b => b.hasAttribute('data-kd-product')).length;
  }, KD);
  check('a product reaches the home panel too', suggest2 > 0, `${suggest2} row(s)`);

  console.log('\npage errors:', errors.length ? errors.slice(0, 4) : 'none');
  console.log('screenshots:', [shotGrid, shotSheet, shotSuggest].join('\n             '));
  console.log(`\n${fails.length === 0 ? 'RESULT: PASS (now look at the screenshots)' : 'RESULT: FAIL — ' + fails.join(' | ')}`);
  await browser.close();
  process.exit(fails.length === 0 && errors.length === 0 ? 0 : 1);
})();
