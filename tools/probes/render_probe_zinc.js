// tools/probes/render_probe_zinc.js — the composed mechanism header (ZINC): hook + metal-fingers + coda.
//
// Usage: node tools/probes/render_probe_zinc.js   (exit 0 = PASS, non-zero = FAIL)
//
// Drives the live Zinc entity page and asserts the composed header: the NAIL-SPOTS hook
// (figure + opening line + pivot) sitting ABOVE the hero, the metal-fingers hero with its four
// outcome labels, the connective bridge, three STACKED beats with an accented turn, the coda that
// returns the block to the fingernail it opened on, the sourced pull-stat, ONE Wallach quote, and
// the why-this-number provenance link.
//
// Two things here are deliberate and must not be "fixed" into drift:
//   1. The glyph is 14.6px, not 17.6. The selenium 17.6px figure is a CEILING, not a floor, and
//      zinc's node is smaller than copper's, so the glyph was cramped at 17.6.
//   2. The nail's white tip is CLIPPED to the nail path and the outline is stroked last. Merely
//      insetting the tip was not enough — it overshot the nail bed. The clip makes it structural.
//
// It also guards the two regressions this design is prone to:
//   1. FIGURE TYPE — every figure must render at scale 1. The base
//      `#drawer-knowledge-mount .kd-ep-fam__figure { max-width: 560px }` carries ID specificity
//      (the mount prefix), so a width override at lower specificity silently loses and the whole figure renders at a fraction of its viewBox —
//      every size inside then pays a scale tax invisible in the source.
//   2. LABEL COLLISIONS — pairwise bounding-box check on every <text> in every figure.
// Plus a COPPER + SELENIUM regression pass: the new optional blocks (hook, coda) and the new
// glyph modifier must not have touched either already-shipped header.
const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
let puppeteer;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { puppeteer = require(c); break; } catch (e) { /* try next */ }
}
if (!puppeteer) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

const SEL_LABEL = 12;     // measured off the shipped selenium figure
const SEL_GLYPH = 17.6;   // its element glyph — the CEILING for figure type
const ZN_GLYPH = 14.6;    // zinc's node is smaller, so its glyph sits below the ceiling

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1500, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  const url = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('a,button,[role="button"]')].find(e => /just browsing/i.test(e.textContent || ''));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 250));
  await page.evaluate(() => document.querySelector('[data-rail-nav="knowledge"]')?.click());
  await new Promise(r => setTimeout(r, 350));
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-tab="essentials"]')?.click());
  await new Promise(r => setTimeout(r, 350));

  const openEssential = async (name) => {
    await page.evaluate(n => document.querySelector(`#drawer-knowledge-mount [data-kd-essential="${n}"]`)?.click(), name);
    await new Promise(r => setTimeout(r, 700));
  };

  const readMech = () => page.evaluate(() => {
    const root = document.querySelector('#drawer-knowledge-mount');
    const mech = root?.querySelector('.kd-ep-fam--mech');
    if (!mech) { return { mech: false }; }
    const deep = mech.closest('.kd-essential-deep');
    const figs = [...mech.querySelectorAll('.kd-ep-fam__art')].map((svg) => {
      const box = svg.getBoundingClientRect();
      const vb = svg.viewBox.baseVal;
      const s = vb.width > 0 ? box.width / vb.width : 0;
      const texts = [...svg.querySelectorAll('text')].map(t => {
        const r = t.getBoundingClientRect();
        return { s: (t.textContent || '').trim().slice(0, 24),
                 px: Math.round(parseFloat(getComputedStyle(t).fontSize) * s * 10) / 10,
                 x1: r.left, x2: r.right, y1: r.top, y2: r.bottom };
      });
      const overlaps = [];
      for (let a = 0; a < texts.length; a++) {
        for (let b = a + 1; b < texts.length; b++) {
          const A = texts[a], B = texts[b];
          if (A.x1 < B.x2 - 2 && B.x1 < A.x2 - 2 && A.y1 < B.y2 - 2 && B.y1 < A.y2 - 2) {
            overlaps.push(`${A.s} X ${B.s}`);
          }
        }
      }
      return {
        cls: svg.getAttribute('class') || '', scale: Math.round(s * 1000) / 1000,
        sizes: [...new Set(texts.map(t => t.px))].sort((a, b) => a - b),
        overlaps, alt: (svg.getAttribute('aria-label') || '').length,
        escapes: texts.filter(t => t.x1 < box.left - 1 || t.x2 > box.right + 1).map(t => t.s),
      };
    });
    const evCells = [...mech.querySelectorAll('.kd-ep-fam__splitcell--ev')];
    const turnHd = mech.querySelector('.kd-ep-fam__step--turn .kd-ep-fam__steptitle');
    const kids = [...mech.children];
    const why = deep?.querySelector('.kd-ep-why');
    return {
      mech: true,
      figCount: figs.length, figs,
      beats: mech.querySelectorAll('.kd-ep-fam__step').length,
      beatsRow: !!mech.querySelector('.kd-ep-fam__steps--row'),
      splitCells: mech.querySelectorAll('.kd-ep-fam__splitcell').length,
      evTops: evCells.map(e => Math.round(e.getBoundingClientRect().top)),
      bridge: !!mech.querySelector('.kd-ep-fam__bridge'),
      marks: mech.querySelectorAll('.kd-ep-fam__mark').length,
      quotes: mech.querySelectorAll('.ds-pull-quote').length,
      quoteTxt: (mech.querySelector('.ds-pull-quote')?.textContent || '').trim().slice(0, 40),
      mark: (mech.querySelector('.ds-mark')?.textContent || '').trim(),
      statNum: (mech.querySelector('.kd-ep-fam__statnum')?.textContent || '').trim(),
      turnHdColor: turnHd ? getComputedStyle(turnHd).color : '',
      beatsIdx: kids.findIndex(e => e.classList.contains('kd-ep-fam__steps')),
      srcInMech: !!mech.querySelector('.kd-ep-op__srclabel'),
      accent: getComputedStyle(mech).getPropertyValue('--kd-ep-fam').trim(),
      dataCat: deep?.getAttribute('data-category') || '',
      whyText: (why?.querySelector('.kd-ep-tip')?.textContent || '').trim(),
      // ── the hook / coda / nail readings ──
      hook: !!mech.querySelector('.kd-ep-fam__opener'),
      hookTx: (mech.querySelector('.kd-ep-fam__openertx')?.textContent || '').trim(),
      hookQ: (mech.querySelector('.kd-ep-fam__openerq')?.textContent || '').trim(),
      hookIdx: kids.findIndex(e => e.classList.contains('kd-ep-fam__opener')),
      heroIdx: kids.findIndex(e => e.classList.contains('kd-ep-fam__figure')),
      coda: (mech.querySelector('.kd-ep-fam__coda')?.textContent || '').trim(),
      codaIdx: kids.findIndex(e => e.classList.contains('kd-ep-fam__coda')),
      statIdx: kids.findIndex(e => e.classList.contains('kd-ep-fam__stat')),
      nails: mech.querySelectorAll('.kd-ep-fam__nail').length,
      nailLines: mech.querySelectorAll('.kd-ep-fam__nailline').length,
      spots: mech.querySelectorAll('.kd-ep-fam__nspot').length,
      clips: mech.querySelectorAll('.kd-ep-fam__openerart clipPath').length,
      // the white tip must live inside a clipped <g> — that is what makes containment structural
      tipsClipped: [...mech.querySelectorAll('.kd-ep-fam__ntip')].every(t => {
        const g = t.parentElement;
        return !!g && g.tagName.toLowerCase() === 'g' && g.hasAttribute('clip-path');
      }),
      barsOn: mech.querySelectorAll('.kd-ep-fam__gbar:not(.kd-ep-fam__gbar--off)').length,
      barsOff: mech.querySelectorAll('.kd-ep-fam__gbar--off').length,
      nodesOn: mech.querySelectorAll('.kd-ep-fam__znode:not(.kd-ep-fam__znode--empty)').length,
      nodesOff: mech.querySelectorAll('.kd-ep-fam__znode--empty').length,
      glyphPx: (() => {
        const g = mech.querySelector('.kd-ep-fam__gglyph--sm');
        return g ? Math.round(parseFloat(getComputedStyle(g).fontSize) * 10) / 10 : 0;
      })(),
      offBarFill: (() => {
        const b = mech.querySelector('.kd-ep-fam__gbar--off');
        return b ? getComputedStyle(b).fill : '';
      })(),
    };
  });

  await openEssential('Zinc');
  const zn = await readMech();
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-action="essential-close"]')?.click());
  await new Promise(r => setTimeout(r, 350));
  await openEssential('Copper');
  const cu = await readMech();
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-action="essential-close"]')?.click());
  await new Promise(r => setTimeout(r, 350));
  await openEssential('Selenium');
  const se = await readMech();

  const checks = [
    ['zinc mechanism block renders', zn.mech],
    ['two figures (nail hook + metal fingers)', zn.figCount === 2],
    // ── the HOOK: opens the block on something checkable, ABOVE the hero ──
    ['nail-spots hook renders', zn.hook],
    ['hook comes BEFORE the hero figure', zn.hookIdx >= 0 && zn.heroIdx > zn.hookIdx],
    ['hook opening line present', zn.hookTx.length > 40 && /white spots/i.test(zn.hookTx)],
    ['hook pivot line present', zn.hookQ.length > 40 && /fingernail/i.test(zn.hookQ)],
    ['hook names ONLY the zinc nail sign (no bluish / ridges / brittle)',
      !/bluish|ridge|brittle/i.test(`${zn.hookTx} ${zn.hookQ} ${zn.coda}`)],
    ['three fingers drawn', zn.nails === 3],
    ['every nail carries its own outline pass', zn.nailLines === 3],
    ['four white spots', zn.spots === 4],
    ['one clipPath per nail', zn.clips === 3],
    ['white tip is CLIPPED to the nail, so it cannot overshoot the bed', zn.tipsClipped],
    // ── the HERO ──
    ['three gene bars lit, three empty', zn.barsOn === 3 && zn.barsOff === 3],
    ['three zinc nodes filled, three empty sockets', zn.nodesOn === 3 && zn.nodesOff === 3],
    ['the OFF bars read EMPTIER than the on bars (no fill)', zn.offBarFill === 'none'],
    ['glyph is 14.6px, deliberately UNDER the 17.6px ceiling',
      zn.glyphPx === ZN_GLYPH && zn.glyphPx < SEL_GLYPH],
    ['connective bridge line', zn.bridge],
    ['three beats, STACKED (not a row)', zn.beats === 3 && !zn.beatsRow],
    ['turn beat heading is the mineral blue', zn.turnHdColor === 'rgb(43, 111, 176)'],
    ['no split on zinc', zn.splitCells === 0],
    // ── the CODA: returns to the fingernail, AFTER the beats and BEFORE the stat ──
    ['coda renders and returns to the fingernail', zn.coda.length > 40 && /fingernail/i.test(zn.coda)],
    ['coda sits after the beats and before the stat',
      zn.codaIdx > zn.beatsIdx && zn.beatsIdx >= 0 && zn.statIdx > zn.codaIdx],
    ['pull-stat present (70)', zn.statNum === '70'],
    ['exactly ONE Wallach quote', zn.quotes === 1],
    ['the quote is the metal-fingers line', /Genetic engineers/.test(zn.quoteTxt)],
    ['highlight is the payoff phrase', zn.mark === 'DNA and genes are powerless'],
    ['why-this-number provenance renders', zn.whyText.length > 40 && /Epigenetics/.test(zn.whyText)],
    ['category = mineral', zn.dataCat === 'mineral'],
    ['accent = mineral blue #2b6fb0', zn.accent.toLowerCase() === '#2b6fb0'],
    ['sources docked at the block bottom', zn.srcInMech],
    ['no page errors', errors.length === 0],
    // ── COPPER regression: the hook / coda / glyph additions must not have touched it ──
    ['copper still renders', cu.mech],
    ['copper keeps its 3 figures', cu.figCount === 3],
    ['copper keeps its 2x2 split', cu.splitCells === 4],
    ['copper keeps its evidence top-alignment',
      cu.evTops.length === 2 && Math.abs(cu.evTops[0] - cu.evTops[1]) <= 1],
    ['copper keeps its 100-mark field', cu.marks === 100],
    ['copper keeps its beats ROW', cu.beatsRow],
    ['copper gained NO hook and NO coda', !cu.hook && cu.coda === ''],
    ['copper keeps its 17.6px glyph (the --sm modifier is scoped to zinc)', cu.glyphPx === 0],
    ['copper keeps its 6-months stat', /6\s*months/i.test(cu.statNum)],
    // ── SELENIUM regression ──
    ['selenium still renders', se.mech],
    ['selenium keeps one figure, no split, no bridge',
      se.figCount === 1 && se.splitCells === 0 && !se.bridge],
    ['selenium keeps its 3 stacked beats', se.beats === 3 && !se.beatsRow],
    ['selenium gained NO hook and NO coda', !se.hook && se.coda === ''],
    ['selenium keeps its 13 -> 1 stat', /13/.test(se.statNum)],
  ];
  zn.figs.forEach((f, i) => {
    const n = ['nail-hook', 'metal-fingers'][i];
    checks.push([`${n}: scale = 1.000 (a declared px IS a screen px)`, f.scale === 1]);
    checks.push([`${n}: labels at the selenium 12px standard`,
      f.sizes.filter(s => s !== ZN_GLYPH).every(s => s === SEL_LABEL)]);
    checks.push([`${n}: nothing above the selenium 17.6px glyph`, Math.max(...f.sizes) <= SEL_GLYPH]);
    checks.push([`${n}: no overlapping labels`, f.overlaps.length === 0]);
    checks.push([`${n}: no text escapes the figure`, f.escapes.length === 0]);
    checks.push([`${n}: carries alt text`, f.alt > 20]);
  });

  let bad = 0;
  for (const [name, ok] of checks) {
    if (!ok) { bad++; console.log('FAIL ·', name); }
  }
  if (errors.length > 0) { console.log(errors.slice(0, 3).join('\n')); }
  console.log(bad === 0
    ? `PASS · render_probe_zinc · ${checks.length}/${checks.length} checks`
    : `FAIL · render_probe_zinc · ${bad} of ${checks.length}`);
  if (bad !== 0) { console.log(JSON.stringify({ zn, cu, se }, null, 1).slice(0, 5000)); }
  await browser.close();
  process.exit(bad === 0 ? 0 : 1);
})();
