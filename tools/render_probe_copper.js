// tools/render_probe_copper.js — the COMPOSED mechanism header (copper).
//
// Usage: node tools/render_probe_copper.js   (exit 0 = PASS, non-zero = FAIL)
//
// Drives the live Copper entity page and asserts the composed "how it works" header:
// the cofactor-fork hero, the two-column split with its sealed-claim quote + proportion
// field, the connective bridge, the decline rail, the beats ROW with its accented turn
// beat, the reversal rail BELOW the beats, the sourced pull-stat, ONE Wallach quote, the
// why-this-number provenance link, and Best-Youngevity sources docked at the block bottom.
//
// It also guards the two regressions this design is prone to:
//   1. FIGURE TYPE — every figure must render at scale 1 with 12px labels (the measured
//      selenium standard) and nothing above its 17.6px glyph. The base rule
//      `.kd-ep-fam__figure { max-width: 560px }` is an ID selector, so a width override at
//      lower specificity silently loses and the whole figure renders at a fraction of its
//      viewBox — every size inside then pays a scale tax invisible in the source.
//   2. LABEL COLLISIONS — pairwise bounding-box check on every <text> in every figure.
// Plus a SELENIUM regression pass: the optional blocks must not have changed it.
const path = require('path');
const REPO = path.resolve(__dirname, '..');
let puppeteer;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { puppeteer = require(c); break; } catch (e) { /* try next */ }
}
if (!puppeteer) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

const SEL_LABEL = 12;     // measured off the shipped selenium figure
const SEL_GLYPH = 17.6;   // its element glyph — the ceiling for figure type

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

  const readMech = () => page.evaluate((selLabel, selGlyph) => {
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
    const cause = mech.querySelector('.kd-ep-fam__gtag--cause');
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
      miniq: !!mech.querySelector('.kd-ep-fam__miniq'),
      marks: mech.querySelectorAll('.kd-ep-fam__mark').length,
      mDead: mech.querySelectorAll('.kd-ep-fam__mark--dead').length,
      mEdge: mech.querySelectorAll('.kd-ep-fam__mark--dead_edge').length,
      mCarry: mech.querySelectorAll('.kd-ep-fam__mark--carry').length,
      legends: mech.querySelectorAll('.kd-ep-fam__fieldleg').length,
      quotes: mech.querySelectorAll('.ds-pull-quote').length,
      quoteTxt: (mech.querySelector('.ds-pull-quote')?.textContent || '').trim().slice(0, 40),
      mark: (mech.querySelector('.ds-mark')?.textContent || '').trim(),
      statNum: (mech.querySelector('.kd-ep-fam__statnum')?.textContent || '').trim(),
      turnHdColor: turnHd ? getComputedStyle(turnHd).color : '',
      causeWeight: cause ? getComputedStyle(cause).fontWeight : '',
      // the reversal rail must come AFTER the beats in document order
      beatsIdx: kids.findIndex(e => e.classList.contains('kd-ep-fam__steps')),
      turnFigIdx: kids.findIndex(e => e.classList.contains('kd-ep-fam__figure--turn')),
      srcInMech: !!mech.querySelector('.kd-ep-op__srclabel'),
      accent: getComputedStyle(mech).getPropertyValue('--kd-ep-fam').trim(),
      dataCat: deep?.getAttribute('data-category') || '',
      whyText: (why?.querySelector('.kd-ep-tip')?.textContent || '').trim(),
      selLabel, selGlyph,
    };
  }, SEL_LABEL, SEL_GLYPH);

  await openEssential('Copper');
  const cu = await readMech();
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-action="essential-close"]')?.click());
  await new Promise(r => setTimeout(r, 350));
  await openEssential('Selenium');
  const se = await readMech();

  const checks = [
    ['copper mechanism block renders', cu.mech],
    ['three figures (fork, decline, reversal)', cu.figCount === 3],
    ['split renders as a 2x2 grid (4 cells)', cu.splitCells === 4],
    ['evidence row top-aligns by construction', cu.evTops.length === 2 && Math.abs(cu.evTops[0] - cu.evTops[1]) <= 1],
    ['sealed-claim mini-quote in the split', cu.miniq],
    ['proportion field = 100 marks', cu.marks === 100],
    ['field bands 4 dead + 2 range-edge + 40 carrying', cu.mDead === 4 && cu.mEdge === 2 && cu.mCarry === 40],
    ['two legend rows', cu.legends === 2],
    ['connective bridge line', cu.bridge],
    ['beats laid out as a row', cu.beatsRow],
    ['three beats', cu.beats === 3],
    ['turn beat heading is the mineral blue', cu.turnHdColor === 'rgb(43, 111, 176)'],
    ['reversal rail renders AFTER the beats', cu.turnFigIdx > cu.beatsIdx && cu.beatsIdx >= 0],
    ['the reversal CAUSE label is bold', cu.causeWeight === '700'],
    ['pull-stat present (6 months)', /6\s*months/i.test(cu.statNum)],
    ['exactly ONE Wallach quote', cu.quotes === 1],
    ['the quote is the reversal', /When humans supplement/.test(cu.quoteTxt)],
    ['highlight is the payoff phrase', cu.mark === 'some aneurysms can heal'],
    ['why-this-number provenance renders', cu.whyText.length > 40 && /Epigenetics/.test(cu.whyText)],
    ['category = mineral', cu.dataCat === 'mineral'],
    ['accent = mineral blue #2b6fb0', cu.accent.toLowerCase() === '#2b6fb0'],
    ['sources docked at the block bottom', cu.srcInMech],
    ['no page errors', errors.length === 0],
    // selenium regression — the optional blocks must not have touched it
    ['selenium still renders', se.mech],
    ['selenium has no split', se.splitCells === 0],
    ['selenium has no bridge', !se.bridge],
    ['selenium keeps its 3 stacked beats', se.beats === 3 && !se.beatsRow],
    ['selenium keeps one figure', se.figCount === 1],
    ['selenium keeps its 13 -> 1 stat', /13/.test(se.statNum)],
  ];
  cu.figs.forEach((f, i) => {
    const n = ['fork', 'decline', 'reversal'][i];
    checks.push([`${n}: scale = 1.000 (px means px)`, f.scale === 1]);
    checks.push([`${n}: labels at the selenium 12px standard`, f.sizes.filter(s => s !== SEL_GLYPH).every(s => s === SEL_LABEL)]);
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
    ? `PASS · render_probe_copper · ${checks.length}/${checks.length} checks`
    : `FAIL · render_probe_copper · ${bad} of ${checks.length}`);
  if (bad !== 0) { console.log(JSON.stringify({ cu, se }, null, 1).slice(0, 4000)); }
  await browser.close();
  process.exit(bad === 0 ? 0 : 1);
})();
