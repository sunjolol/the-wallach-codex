// tools/probes/render_probe_mobile.js — THE PHONE ARRANGEMENT, end to end.
//
// Usage: node tools/probes/render_probe_mobile.js            (exit 0 = PASS)
//        node tools/probes/render_probe_mobile.js --negative  (proves the detector FIRES)
//
// ═══ WHAT THIS PROBE IS FOR ═══
// The phone layer is a media query over a desktop app: every rule in mobile.css re-arranges
// something authored for 1440px, and the failure mode is silent. Nothing throws. The board stays
// green. A control simply sits 12px past the right edge of the screen and the reader never sees
// it. That is exactly what happened to `.vd-tier` — the Scanner's ADD / SAVE / REJECT control,
// which IS the verdict — and an earlier audit missed it because it compared each element's WIDTH
// to the viewport. Nothing on that screen was wider than 375. It was pushed too far right.
//
// So the central assertion here is about the RIGHT EDGE, not about width:
//   for every painted element on every phone screen, rect.right <= innerWidth (+1 for rounding)
// with a short, reasoned allowlist for the two things that legitimately scroll inside their own
// container (see PAST_EDGE_OK).
//
// It also pins the contracts the 2026-08-25 phone round introduced, on both sides:
//   PHONE   — the drawer header collapses on a detail screen and expands on Home; the per-tab
//             search box drops on a detail screen; the Regimen filter row is a bar, not a stack;
//             the slot swatches are behind their handle; the 32px icon buttons keep a 44px target.
//   DESKTOP — every one of those controls is display:none or display:contents at 1440px, the
//             filter pickers keep their measured widths on ONE line, and the drawer header,
//             search box and slot pencils are untouched.
// The desktop half is the half that matters most: it is what proves the phone layer stayed a
// phone layer.
//
// ★ WHAT THIS CANNOT PROVE. It compares numbers. It is blind to anything merely ugly, to a label
// painted over an opaque shape, and to a colour that vanished. Two defects in the round that
// created this probe passed every measurement and were caught only by looking at a screenshot:
// a `box-shadow: none` that lost on specificity, and a backdrop that painted on top of the panel
// it was meant to sit behind. Screenshot the surface and stop for human eyes.
//
// Requires puppeteer.

const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

const NEGATIVE = process.argv.includes('--negative');
const wait = ms => new Promise(r => setTimeout(r, ms));
const URL = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');

/**
 * ★ THE EXEMPTION IS DERIVED FROM THE DOM, NOT FROM A LIST OF CLASS NAMES.
 *
 * Some content legitimately sits past the right edge: wide CHART ANNOTATION pinned to a datum
 * rather than to the layout — a target label hung off a marker that MOVES with the age scrubber,
 * a value label centred on its own bar. Neither can be re-flowed without moving the label off the
 * thing it labels, so mobile.css gives their plot `overflow-x: auto`. They scroll inside their
 * own container and never push the page, and every one of them is still reachable.
 *
 * The first cut of this scan exempted them BY CLASS NAME and immediately proved why that is the
 * wrong instrument: the offenders it flagged were bare `<b>` elements INSIDE those labels, with
 * no class at all, so the name list matched nothing and the probe went red on content that was
 * behaving correctly. The real rule is "does an ancestor actually scroll horizontally", which is
 * a fact about the page rather than a fact about naming — and it stays true for a chart added
 * next year that nobody thought to add here.
 *
 * `scrollWidth > clientWidth` is load-bearing in that test and is NOT redundant with the
 * overflow property. A box with `overflow-y: auto` computes `overflow-x` to `auto` even when the
 * author wrote `visible` — so testing the property alone would exempt EVERYTHING inside
 * `.kd-body`, which is the drawer's whole scroll region. Requiring that the ancestor genuinely
 * overflows keeps that exemption to containers that really do scroll sideways.
 */
const EDGE_SCAN = `(() => {
  const scrollsX = (el) => {
    const cs = getComputedStyle(el);
    return (cs.overflowX === 'auto' || cs.overflowX === 'scroll') && el.scrollWidth > el.clientWidth + 1;
  };
  const inScroller = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      if (scrollsX(p)) return true;
    }
    return false;
  };
  const past = [];
  document.querySelectorAll('body *').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.height <= 0 || r.width <= 0) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.opacity === '0') return;
    if (r.right <= window.innerWidth + 1) return;
    if (inScroller(el)) return;
    past.push({
      c: String(el.className || el.tagName).trim().slice(0, 52),
      txt: (el.textContent || '').trim().slice(0, 30),
      r: Math.round(r.right),
      w: Math.round(r.width),
    });
  });
  const seen = new Set();
  return past.filter(x => { const k = x.c + x.txt; if (seen.has(k)) return false; seen.add(k); return true; });
})()`;

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const fails = [];
  const check = (label, cond, got) => {
    console.log(`${cond ? 'ok  ' : 'FAIL'} ${label}  ${JSON.stringify(got)}`);
    if (!cond) fails.push(label);
  };

  // ─────────────────────────────────────────────────────────────── PHONE ────
  const p = await browser.newPage();
  await p.setViewport({ width: 375, height: 812, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  p.on('pageerror', e => { console.log('PAGEERR', e.message); fails.push('pageerror'); });
  await p.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await wait(2200);

  if (NEGATIVE) {
    // ★ THE NEGATIVE CONTROL — it re-breaks the REAL defect, both halves of it.
    // The first version of this control widened `.vd-tier` back to its natural 330px and the
    // probe stayed GREEN, which was itself the useful result: 330px only overflowed because
    // `.vd-card__body` was ALSO padding 40px per side, and with that padding fixed a 330px
    // control now fits. A negative control that restores half a defect proves half of nothing.
    // Both halves are restored here, which reproduces the exact geometry that shipped: content
    // starting at x=57 and a 330px control ending at 387, twelve pixels past the screen.
    await p.addStyleTag({ content: '@media (max-width: 767px) { .vd-card__body { padding: var(--ds-space-7) !important; } .vd-tier { display: inline-flex !important; width: 330px !important; } }' });
    console.log('NEGATIVE CONTROL: .vd-card__body padding and .vd-tier width restored to the shipped defect — this run MUST fail');
  }

  const edges = async (screen) => {
    const past = await p.evaluate(EDGE_SCAN);
    check(`nothing past the right edge · ${screen}`, past.length === 0, past.slice(0, 4));
  };
  const click = async (s) => { const ok = await p.evaluate(x => { const e = document.querySelector(x); if (!e) return false; e.click(); return true; }, s); await wait(650); return ok; };

  // 1. The arrival veil — the first screen anyone sees, and its goal chips are its whole task.
  const veil = await p.$('.wc-veil');
  check('veil: shown at boot', veil !== null, veil !== null);
  if (veil !== null) {
    await edges('welcome veil');
    const veilState = await p.evaluate(() => {
      const chip = document.querySelector('.wc-goal');
      const cat = document.querySelector('.wc__goal-cat');
      const grp = cat ? cat.closest('.wc__goal-group') : null;
      const firstChip = grp ? grp.querySelector('.wc-goal') : null;
      return {
        chipH: chip ? Math.round(chip.getBoundingClientRect().height) : null,
        // the category label must HEAD its group, not sit inline with a chip on the same line
        catTop: cat ? Math.round(cat.getBoundingClientRect().top) : null,
        chipTop: firstChip ? Math.round(firstChip.getBoundingClientRect().top) : null,
      };
    });
    check('veil: goal chips on the 44px floor', veilState.chipH >= 44, veilState.chipH);
    check('veil: category label heads its group, not inline with a chip',
      veilState.catTop !== null && veilState.chipTop !== null && veilState.chipTop > veilState.catTop,
      veilState);
    await p.type('.wc__name', 'Probe');
    await p.click('.wc-goal');
    await p.click('[data-go]');
    await wait(900);
  }

  // 2. Coverage — four panes, one at a time.
  await click('[data-rail-nav="coverage"]');
  for (const pane of ['field', 'products', 'foods', 'protocol']) {
    const ok = await p.evaluate(x => {
      const e = document.querySelector(`[data-cov-pane-set="${x}"]`)
        || Array.from(document.querySelectorAll('.cov-panes__btn')).find(b => (b.textContent || '').toLowerCase().includes(x.slice(0, 4)));
      if (!e) return false; e.click(); return true;
    }, pane);
    check(`coverage: pane switch reaches ${pane}`, ok, ok);
    await wait(800);
    await edges('coverage/' + pane);
  }

  // 3. Regimen — the slot card and the filter bar.
  await click('[data-rail-nav="regimen"]');
  await wait(1300);
  await edges('regimen');
  const rg = await p.evaluate(() => {
    const box = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; };
    const disp = s => { const e = document.querySelector(s); return e ? getComputedStyle(e).display : 'ABSENT'; };
    const pen = document.querySelector('.ck-slot--filled .ck-slot__pencil');
    return {
      hue: disp('.ck-slot--filled .ck-slot__hue'),
      swatches: disp('.ck-slot--filled .ck-slot__swatches'),
      pencil: box('.ck-slot--filled .ck-slot__pencil'),
      hit: pen ? getComputedStyle(pen, '::after').width : null,
      toggle: disp('.fs-filter__toggle'),
      sheet: disp('.fs-filter__sheet'),
      filterRowH: box('.fs-filter') ? box('.fs-filter').h : null,
    };
  });
  check('regimen: colour handle shown, swatches behind it', rg.hue !== 'none' && rg.hue !== 'ABSENT' && rg.swatches === 'none', [rg.hue, rg.swatches]);
  check('regimen: slot icons 32px VISIBLE', rg.pencil && rg.pencil.w === 32 && rg.pencil.h === 32, rg.pencil);
  check('regimen: slot icons keep a 44px TARGET', rg.hit === '44px', rg.hit);
  check('regimen: filter is a one-line bar, not a stack', rg.toggle !== 'none' && rg.sheet === 'none' && rg.filterRowH !== null && rg.filterRowH <= 50, [rg.toggle, rg.sheet, rg.filterRowH]);

  await click('.ck-slot--filled .ck-slot__hue');
  check('regimen: the handle expands the swatch row', (await p.evaluate(() => getComputedStyle(document.querySelector('.ck-slot--filled .ck-slot__swatches')).display)) === 'flex', true);
  await click('.ck-slot--filled .ck-slot__hue');

  await click('.fs-filter__toggle');
  await wait(500);
  const sheet = await p.evaluate(() => {
    const e = document.querySelector('.fs-filter__sheet.is-open');
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return {
      pos: getComputedStyle(e).position,
      left: Math.round(r.left), right: Math.round(r.right), bottom: Math.round(r.bottom),
      cats: Array.from(e.querySelectorAll('.fs-filter__cat')).map(c => Math.round(c.getBoundingClientRect().width)),
    };
  });
  check('regimen: the sheet is a fixed full-width panel that stops above the bar',
    sheet !== null && sheet.pos === 'fixed' && sheet.left === 0 && sheet.right === 375 && sheet.bottom === 812 - 53, sheet);
  check('regimen: pickers are full width in the sheet', sheet !== null && sheet.cats.length > 0 && sheet.cats.every(w => w > 300), sheet && sheet.cats);
  await edges('regimen/filter sheet');
  await click('[data-fs-done]');

  // 4. Scanner — step 1, then a real verdict. The verdict is where .vd-tier lives.
  await click('[data-rail-nav="scanner"]');
  await wait(800);
  await edges('scanner/step 1');
  const ta = await p.$('textarea');
  check('scanner: the paste box is reachable', ta !== null, ta !== null);
  if (ta !== null) {
    await ta.type('water, modified tapioca starch, canola oil, salt, wheat flour, high fructose corn syrup');
    await p.evaluate(() => document.querySelector('[data-sc-paste-check]')?.click());
    await wait(3000);
    const vd = await p.evaluate(() => {
      const t = document.querySelector('.vd-tier');
      const eb = document.querySelector('.vd-card__eyebrow');
      return {
        tierCells: document.querySelectorAll('.vd-tier__c').length,
        tierRight: t ? Math.round(t.getBoundingClientRect().right) : null,
        cellH: t ? Math.round(t.querySelector('.vd-tier__c').getBoundingClientRect().height) : null,
        eyebrowClipped: eb ? eb.scrollWidth > eb.clientWidth + 1 : null,
      };
    });
    check('scanner: the verdict rendered', vd.tierCells === 3, vd.tierCells);
    check('scanner: ADD/SAVE/REJECT all fit on screen', vd.tierRight !== null && vd.tierRight <= 375, vd.tierRight);
    check('scanner: each verdict cell is on the 44px floor', vd.cellH >= 44, vd.cellH);
    check('scanner: the card eyebrow is not truncated', vd.eyebrowClipped === false, vd.eyebrowClipped);
    await edges('scanner/verdict');
  }

  // 5. Search — the RESULTS, not the empty panel. Three touch defects hid in the difference.
  await click('[data-topbar-ask]');
  await wait(900);
  const si = await p.$('.aw-search__input');
  check('search: the drawer opened', si !== null, si !== null);
  if (si !== null) {
    const modal = await p.evaluate(() => {
      const e = document.querySelector('#drawer-search-mount .scr');
      const r = e.getBoundingClientRect();
      return { left: Math.round(r.left), right: Math.round(r.right) };
    });
    check('search: full-bleed on a phone, not a window in a window', modal.left === 0 && modal.right === 375, modal);
    await si.type('selenium');
    await wait(1800);
    await edges('search/results');
    const hero = await p.evaluate(() => {
      const name = document.querySelector('#drawer-search-mount .ehero__name');
      const back = document.querySelector('#drawer-search-mount .ehero .eback');
      if (!name || !back) return null;
      const n = name.getBoundingClientRect(), b = back.getBoundingClientRect();
      // the title and the Learn-More control must not share a horizontal band
      return { overlap: n.right > b.left && n.left < b.right && n.bottom > b.top && n.top < b.bottom, nameRight: Math.round(n.right), backLeft: Math.round(b.left) };
    });
    check('search: the entity title does not paint over Learn More', hero !== null && hero.overlap === false, hero);
    await p.keyboard.press('Escape');
    await wait(500);
  }

  // 6. Knowledge — the header contract, on Home and on a detail screen.
  await click('[data-rail-nav="knowledge"]');
  await wait(1000);
  const kdState = () => ({
    headH: (() => { const e = document.querySelector('.kd-knh'); return e ? Math.round(e.getBoundingClientRect().height) : null; })(),
    handle: (() => { const e = document.querySelector('.kd-knh__menu'); return e ? getComputedStyle(e).display : 'ABSENT'; })(),
    name: (() => { const e = document.querySelector('.kd-knh__menu-name'); return e ? e.textContent : null; })(),
    expanded: (() => { const e = document.querySelector('.kd-knh__menu'); return e ? e.getAttribute('aria-expanded') : null; })(),
    tabs: (() => { const e = document.querySelector('.kd-knh__tabs'); return e ? getComputedStyle(e).display !== 'none' : null; })(),
    searchH: (() => { const e = document.querySelector('.kd-search'); return e ? Math.round(e.getBoundingClientRect().height) : 0; })(),
  });
  let k = await p.evaluate(kdState);
  check('knowledge/home: the handle is shown and the menu is OPEN', k.handle !== 'none' && k.handle !== 'ABSENT' && k.expanded === 'true' && k.tabs === true, [k.handle, k.expanded, k.tabs]);
  const homeHead = k.headH;
  await edges('knowledge/home');

  for (const tab of ['foods', 'orac', 'conditions', 'explore', 'products']) {
    await click(`[data-kd-tab="${tab}"]`);
    await wait(900);
    await edges('knowledge/' + tab);
  }
  k = await p.evaluate(kdState);
  check('knowledge/tab: the menu collapses off Home', k.expanded === 'false' && k.tabs === false, [k.expanded, k.tabs]);
  check('knowledge/tab: the collapsed head is ~2/3 shorter', k.headH < homeHead - 80, [k.headH, homeHead]);
  check('knowledge/tab: the handle names the tab', k.name === 'Products', k.name);
  check('knowledge/products LIST: the search box is still there', k.searchH > 0, k.searchH);

  await click('.kd-knh__menu');
  check('knowledge: the handle reopens the grid', (await p.evaluate(kdState)).tabs === true, true);
  await click('.kd-knh__menu');

  // a product, a condition, an essential, a topic — every shape of detail screen
  await p.evaluate(() => document.querySelector('[data-kd-product]')?.click());
  await wait(1200);
  k = await p.evaluate(kdState);
  check('knowledge/product: menu collapsed, search box gone', k.expanded === 'false' && k.searchH === 0, [k.expanded, k.searchH]);
  await edges('knowledge/product detail');

  await click('[data-kd-tab="home"]');
  await wait(700);
  check('knowledge: Home expands the menu again', (await p.evaluate(kdState)).expanded === 'true', true);
  await click('a[data-kd-tab="essentials"]');
  await wait(900);
  const opened = await p.evaluate(() => {
    const e = Array.from(document.querySelectorAll('[data-kd-essential]')).find(x => x.getAttribute('data-kd-essential') === 'Calcium');
    if (!e) return false; e.click(); return true;
  });
  check('knowledge: Calcium reachable from the essentials list', opened, opened);
  await wait(1300);
  k = await p.evaluate(kdState);
  check('knowledge/essential: menu collapsed, search box gone', k.expanded === 'false' && k.searchH === 0, [k.expanded, k.searchH]);
  check('knowledge/essential: chrome above the body is one bar, not four',
    k.headH + k.searchH < 80, { head: k.headH, search: k.searchH });
  await edges('knowledge/essential detail');

  // THE DE-BOXING, on the page that named it. `.kd-ep-fam__splittx` measured 80px before the
  // 2026-08-25 round — two words per line. Pinned so a padding change cannot quietly undo it.
  const deboxed = await p.evaluate(() => {
    const t = document.querySelector('.kd-ep-fam__splittx');
    const deep = document.querySelector('.kd-essential-deep');
    const dr = deep ? deep.getBoundingClientRect() : null;
    return {
      splittx: t ? Math.round(t.getBoundingClientRect().width) : null,
      deepLeft: dr ? Math.round(dr.left) : null,
      deepRight: dr ? Math.round(dr.right) : null,
    };
  });
  check('essential page: the two-up split is one column at full width', deboxed.splittx !== null && deboxed.splittx > 250, deboxed.splittx);
  check('essential page: the detail card bleeds to both screen edges', deboxed.deepLeft === 0 && deboxed.deepRight === 375, deboxed);

  await click('.rail__profile');
  await wait(1100);
  const pf = await p.evaluate(() => {
    const t = document.querySelector('.pf-tile');
    const badge = document.querySelector('.pf-av__badge');
    return {
      tile: t ? Math.round(t.getBoundingClientRect().width) : null,
      chip: (() => { const c = document.querySelector('.pf-fchip'); return c ? Math.round(c.getBoundingClientRect().height) : null; })(),
      badgePos: badge ? getComputedStyle(badge).position : null,
      badgeHit: badge ? getComputedStyle(badge, '::after').width : null,
    };
  });
  check('profile: avatar tiles are over the touch floor', pf.tile !== null && pf.tile >= 40, pf.tile);
  check('profile: the filter chips are on the 44px floor', pf.chip >= 44, pf.chip);
  // ★ REGRESSION PIN. A touch-floor pass once set `position: relative` here, which beat the
  // badge's own `absolute` on source order and dropped it out of the avatar's corner onto the
  // profile name. Nothing measured caught it.
  check('profile: the avatar badge is still absolutely positioned', pf.badgePos === 'absolute', pf.badgePos);
  check('profile: the avatar badge keeps a 44px target', pf.badgeHit === '44px', pf.badgeHit);

  // ─────────────────────────────────────────────────────────── DESKTOP ────
  // The half that proves the phone layer stayed a phone layer.
  const d = await browser.newPage();
  await d.setViewport({ width: 1440, height: 900 });
  d.on('pageerror', e => { console.log('DESKTOP PAGEERR', e.message); fails.push('desktop pageerror'); });
  await d.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await wait(2200);
  if (await d.$('.wc-veil')) {
    await d.type('.wc__name', 'Probe');
    await d.click('.wc-goal');
    await d.click('[data-go]');
    await wait(900);
  }
  await d.evaluate(() => document.querySelector('[data-rail-nav="regimen"]').click());
  await wait(1500);
  const dr = await d.evaluate(() => {
    const disp = s => { const e = document.querySelector(s); return e ? getComputedStyle(e).display : 'ABSENT'; };
    const row = document.querySelector('.fs-filter');
    return {
      toggle: disp('.fs-filter__toggle'),
      sheet: disp('.fs-filter__sheet'),
      foot: disp('.fs-filter__foot'),
      hue: disp('.ck-slot--filled .ck-slot__hue'),
      swatches: disp('.ck-slot--filled .ck-slot__swatches'),
      pencil: (() => { const e = document.querySelector('.ck-slot--filled .ck-slot__pencil'); return e ? Math.round(e.getBoundingClientRect().width) : null; })(),
      cats: row ? Array.from(row.querySelectorAll('.fs-filter__cat')).map(c => Math.round(c.getBoundingClientRect().width)) : [],
      tops: row ? Array.from(row.querySelectorAll('.fs-filter__cat')).map(c => Math.round(c.getBoundingClientRect().top)) : [],
    };
  });
  check('desktop: the filter toggle and footer are display:none', dr.toggle === 'none' && dr.foot === 'none', [dr.toggle, dr.foot]);
  // ★ `display: contents` IS THE WHOLE REASON THE DESKTOP ROW SURVIVED A NEW WRAPPER ELEMENT.
  check('desktop: the sheet wrapper is display:contents', dr.sheet === 'contents', dr.sheet);
  check('desktop: the pickers keep their measured widths', dr.cats.length > 0 && dr.cats.every(w => w >= 155), dr.cats);
  check('desktop: the pickers still share ONE line', dr.tops.length > 0 && new Set(dr.tops).size === 1, dr.tops);
  check('desktop: the colour handle is display:none, swatches shown', dr.hue === 'none' && dr.swatches === 'flex', [dr.hue, dr.swatches]);
  check('desktop: the slot pencil is back at its own 24px', dr.pencil === 24, dr.pencil);

  await d.evaluate(() => document.querySelector('[data-rail-nav="knowledge"]').click());
  await wait(1000);
  await d.evaluate(() => document.querySelector('a[data-kd-tab="essentials"]')?.click());
  await wait(900);
  await d.evaluate(() => {
    const e = Array.from(document.querySelectorAll('[data-kd-essential]')).find(x => x.getAttribute('data-kd-essential') === 'Calcium');
    if (e) e.click();
  });
  await wait(1300);
  const dk = await d.evaluate(() => ({
    handle: (() => { const e = document.querySelector('.kd-knh__menu'); return e ? getComputedStyle(e).display : 'ABSENT'; })(),
    tabs: (() => { const e = document.querySelector('.kd-knh__tabs'); return e ? getComputedStyle(e).display !== 'none' : null; })(),
    searchH: (() => { const e = document.querySelector('.kd-search'); return e ? Math.round(e.getBoundingClientRect().height) : 0; })(),
    headH: (() => { const e = document.querySelector('.kd-knh'); return e ? Math.round(e.getBoundingClientRect().height) : null; })(),
    markWord: (() => { const e = document.querySelector('.kd-knh__mark b'); return e ? getComputedStyle(e).display : 'ABSENT'; })(),
    deepLeft: (() => { const e = document.querySelector('.kd-essential-deep'); return e ? Math.round(e.getBoundingClientRect().left) : null; })(),
  }));
  check('desktop: the tab handle is display:none', dk.handle === 'none', dk.handle);
  check('desktop: the tab grid is always shown', dk.tabs === true, dk.tabs);
  check('desktop: the wordmark keeps its word', dk.markWord !== 'none', dk.markWord);
  check('desktop: the per-tab search box is untouched on a detail screen', dk.searchH > 0, dk.searchH);
  check('desktop: the drawer head keeps its one-row height', dk.headH >= 60 && dk.headH <= 90, dk.headH);
  check('desktop: the detail card does NOT bleed', dk.deepLeft !== null && dk.deepLeft > 0, dk.deepLeft);

  await browser.close();

  if (NEGATIVE) {
    const caught = fails.some(f => f.startsWith('nothing past the right edge') || f.startsWith('scanner: ADD/SAVE/REJECT'));
    console.log(caught
      ? '\nPASS · negative control — the detector FIRED on a re-broken .vd-tier'
      : '\nFAIL · negative control — the detector did NOT fire, so it proves nothing');
    process.exit(caught ? 0 : 1);
  }
  console.log(fails.length === 0
    ? '\nPASS · the phone arrangement holds, and the desktop is untouched'
    : '\nFAIL ' + JSON.stringify(fails));
  process.exit(fails.length === 0 ? 0 : 1);
})();
