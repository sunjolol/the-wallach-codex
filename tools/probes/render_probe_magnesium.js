// tools/probes/render_probe_magnesium.js — the COMPOSED magnesium "cycle of life" header.
//
// Usage: node tools/probes/render_probe_magnesium.js   (exit 0 = PASS, non-zero = FAIL)
//
// Drives the live Magnesium entity page and asserts the composed header: the mg_cycle hero figure
// (ONE Mg atom followed soil -> chlorophyll -> you), the centred bridge, the three big-Unbounded
// beats, the TRIMMED Wallach pull-quote pulled BY CLAIM ID, and the Best-Youngevity-sources dock.
// Guards the two figure regressions this design is prone to:
//   1. FIGURE TYPE — scale == 1 (a declared px is a screen px) + every label >= 12px, glyph <= 17.6.
//   2. LABEL COLLISIONS — pairwise bounding-box check on every <text> in the figure.
// Plus a COPPER regression pass: a previously-shipped header must be unchanged (the shared emitters
// were touched to add trim/bignum), incl. its figure still at scale 1.
const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
let puppeteer;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { puppeteer = require(c); break; } catch (e) { /* next */ }
}
if (!puppeteer) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

const SEL_LABEL = 12;     // measured selenium label floor
const SEL_GLYPH = 17.6;   // measured selenium glyph ceiling

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1600, deviceScaleFactor: 1 });
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

  const openEssential = async (slug) => {
    await page.evaluate((s) => {
      const el = [...document.querySelectorAll('#drawer-knowledge-mount [data-kd-essential]')]
        .find(e => (e.getAttribute('data-kd-essential') || '').toLowerCase().startsWith(s));
      if (el) el.click();
    }, slug);
    await new Promise(r => setTimeout(r, 800));
  };
  const closeEssential = async () => {
    await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-action="essential-close"]')?.click());
    await new Promise(r => setTimeout(r, 300));
  };

  // Read the mechanism figure: scale, label sizes, glyph sizes, pairwise text collisions.
  const readFig = () => page.evaluate((selLabel, selGlyph) => {
    const svg = document.querySelector('#drawer-knowledge-mount .kd-ep-fam--mech .kd-ep-fam__art');
    if (!svg) return { ok: false };
    const box = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const scale = vb.width > 0 ? box.width / vb.width : 0;
    const texts = [...svg.querySelectorAll('text')].map(t => {
      const r = t.getBoundingClientRect();
      const cls = t.getAttribute('class') || '';
      return { s: (t.textContent || '').trim().slice(0, 20),
        px: Math.round(parseFloat(getComputedStyle(t).fontSize) * scale * 10) / 10,
        isGlyph: /mgglyph/.test(cls), hasFill: t.hasAttribute('fill'),
        x1: r.left, x2: r.right, y1: r.top, y2: r.bottom, w: r.width };
    });
    const small = texts.filter(t => t.px > 0 && t.px < selLabel).map(t => `${t.s}@${t.px}`);
    const bigGlyph = texts.filter(t => t.isGlyph && t.px > selGlyph).map(t => `${t.s}@${t.px}`);
    const fillAttr = texts.filter(t => t.hasFill).map(t => t.s);
    const collisions = [];
    for (let a = 0; a < texts.length; a++) for (let b = a + 1; b < texts.length; b++) {
      const A = texts[a], B = texts[b]; if (!A.w || !B.w) continue;
      const ox = Math.min(A.x2, B.x2) - Math.max(A.x1, B.x1);
      const oy = Math.min(A.y2, B.y2) - Math.max(A.y1, B.y1);
      if (ox > 2 && oy > 2) collisions.push(`"${A.s}"x"${B.s}"`);
    }
    return { ok: true, scale: Math.round(scale * 1000) / 1000, vbw: vb.width, small, bigGlyph, fillAttr, collisions, nText: texts.length };
  }, SEL_LABEL, SEL_GLYPH).catch(() => ({ ok: false }));

  const checks = [];
  const push = (name, ok) => checks.push([name, !!ok]);

  // ── MAGNESIUM ─────────────────────────────────────────────────────────────
  await openEssential('magnesium');
  const parts = await page.evaluate(() => {
    const sec = document.querySelector('#drawer-knowledge-mount .kd-ep-fam--mech');
    if (!sec) return null;
    const q = sec.querySelector('.kd-ep-fam__quote');
    const beats = [...sec.querySelectorAll('.kd-ep-fam__steps .kd-ep-fam__step')];
    const bigNums = [...sec.querySelectorAll('.kd-ep-fam__num--big')];
    const br = sec.querySelector('.kd-ep-fam__bridge');
    return {
      hasSec: true,
      eyebrow: (sec.querySelector('.kd-ep-fam__eyebrow')?.textContent || '').trim(),
      hasFig: !!sec.querySelector('.kd-ep-fam__art'),
      figFork: !!sec.querySelector('.kd-ep-fam__figure--fork .kd-ep-fam__art'),
      quoteText: (q?.textContent || '').replace(/\s+/g, ' ').trim(),
      nBeats: beats.length, nBig: bigNums.length,
      bridgeAlign: br ? getComputedStyle(br).textAlign : '',
      hasNote: !!sec.querySelector('.kd-ep-fam__note'),
      hasSrc: !!sec.querySelector('.kd-ep-op__srclabel'),
    };
  });
  const fig = await readFig();
  push('magnesium: mechanism section renders', parts && parts.hasSec);
  push('magnesium: eyebrow is the cycle title', parts && /cycle of life of magnesium/i.test(parts.eyebrow));
  push('magnesium: mg_cycle figure present at --fork width', parts && parts.figFork);
  push('magnesium: figure renders at scale 1', fig.ok && Math.abs(fig.scale - 1) <= 0.02);
  push('magnesium: no sub-12px figure label', fig.ok && fig.small.length === 0);
  push('magnesium: no glyph over the 17.6px ceiling', fig.ok && fig.bigGlyph.length === 0);
  push('magnesium: no fill-attr on figure text (invisible-glyph guard)', fig.ok && fig.fillAttr.length === 0);
  push('magnesium: no figure label collisions', fig.ok && fig.collisions.length === 0);
  push('magnesium: three beats', parts && parts.nBeats === 3);
  push('magnesium: three big-Unbounded numerals', parts && parts.nBig === 3);
  push('magnesium: bridge is centred', parts && parts.bridgeAlign === 'center');
  push('magnesium: quote shows the TRIMMED sentence (not the full paragraph)',
    parts && /Magnesium, the source of the deep green color of plants, is the ultimate source of all biological energy!/.test(parts.quoteText)
    && !/metallic atom found in/.test(parts.quoteText));
  push('magnesium: quote carries the composed cite', parts && /IMMORTALITY/i.test(parts.quoteText));
  push('magnesium: disclaimer note in frame', parts && parts.hasNote);
  push('magnesium: Best-Youngevity sources docked', parts && parts.hasSrc);
  await closeEssential();

  // ── COPPER regression (shared emitters were touched) ──────────────────────
  await openEssential('copper');
  const cu = await page.evaluate(() => {
    const sec = document.querySelector('#drawer-knowledge-mount .kd-ep-fam--mech');
    return { hasSec: !!sec, hasFig: !!sec?.querySelector('.kd-ep-fam__art'),
      hasSplit: !!sec?.querySelector('.kd-ep-fam__split'),
      noBig: !sec?.querySelector('.kd-ep-fam__num--big') };
  });
  const cuFig = await readFig();
  push('copper regression: section still renders', cu.hasSec && cu.hasFig);
  push('copper regression: fork figure still scale 1', cuFig.ok && Math.abs(cuFig.scale - 1) <= 0.02);
  push('copper regression: did NOT gain big numerals', cu.noBig);

  push('no page errors', errors.length === 0);

  let bad = 0;
  for (const [name, ok] of checks) { if (!ok) { bad++; console.log('FAIL ·', name); } }
  if (!fig.ok) console.log('  (magnesium figure not read)');
  if (fig.ok && fig.collisions.length) console.log('  collisions:', fig.collisions.join('; '));
  if (fig.ok && fig.small.length) console.log('  sub-12px:', fig.small.join('; '));
  if (errors.length) console.log(errors.slice(0, 3).join('\n'));
  console.log(bad === 0
    ? `PASS · render_probe_magnesium · ${checks.length}/${checks.length} checks`
    : `FAIL · render_probe_magnesium · ${bad} of ${checks.length}`);
  await browser.close();
  process.exit(bad === 0 ? 0 : 1);
})();
