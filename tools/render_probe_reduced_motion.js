// tools/render_probe_reduced_motion.js — the flash-hazard gate.
//
// Usage: node tools/render_probe_reduced_motion.js
//
// WHY THIS EXISTS (2026-07-14): design-system.css capped animation-DURATION under
// `prefers-reduced-motion: reduce` but never capped animation-ITERATION-COUNT. A capped
// duration does not stop an `infinite` animation — it accelerates it. Seven painted
// elements were measured looping at ~100Hz (ds-scan-sweep, ds-numeric-glow, ds-stat-pulse,
// ds-travel-top/-bottom, 2x ds-pulse-animate): a strobe served to precisely the users who
// had asked for LESS motion, well past the 3-per-second flash threshold. No gate could see
// it — the CSS declared the right intent and did the opposite, so reading it proved nothing.
//
// The anchor is the RENDERED computed style in a real browser under the real media feature
// (§00.B #11: pin to a truth that cannot drift, not to a source-text grep that a comment or
// a reworded rule could satisfy). It generalises: any future animation added ANYWHERE that
// loops fast under a reduce preference reddens this probe, not just the original block.
//
// PASS 2 exists so the gate cannot be satisfied degenerately: deleting every animation would
// trivially pass PASS 1, so PASS 2 asserts the ambient motion still runs for normal users.
// Requires puppeteer (in node_modules).

const path = require('path');
const REPO = path.resolve(__dirname, '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

// A loop this short is not motion, it is a flash. WCAG 2.3.1 draws the line at 3 per second;
// 0.05s (20Hz) is far above it and far below any legitimate authored duration in this app
// (the fastest real ambient loop is 2s), so the band is unambiguous.
const FLASH_S = 0.05;

const URL = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');

// Collect every animation on the page, including the ones that live only on ::before/::after
// (a scan that reads getComputedStyle(el) with no pseudo argument silently misses those —
// it undercounted this very hazard 5-to-7 on first measurement).
const COLLECT = (flashS) => {
  const out = [];
  const scan = (el, pseudo) => {
    const cs = getComputedStyle(el, pseudo);
    if (!cs.animationName || cs.animationName === 'none') return;
    const r = el.getBoundingClientRect();
    const painted = r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden';
    const durs = cs.animationDuration.split(',').map(s => parseFloat(s));
    const iters = cs.animationIterationCount.split(',').map(s => s.trim());
    out.push({
      name: cs.animationName,
      where: ((typeof el.className === 'string' && el.className.trim())
        ? '.' + el.className.trim().split(/\s+/)[0]
        : el.tagName) + (pseudo || ''),
      painted,
      infinite: iters.some(s => s === 'infinite'),
      fast: durs.some(d => d > 0 && d <= flashS),
      dur: cs.animationDuration,
      iter: cs.animationIterationCount,
    });
  };
  for (const el of document.querySelectorAll('*')) {
    scan(el, null); scan(el, '::before'); scan(el, '::after');
  }
  return out;
};

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const pageErrors = [];

  const load = async (reduced) => {
    const page = await browser.newPage();
    page.on('pageerror', e => pageErrors.push(e.message));
    if (reduced) {
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    }
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
      .catch(e => console.log('GOTO_ERR', e.message));
    await new Promise(r => setTimeout(r, 1800));
    const honored = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    const anims = await page.evaluate(COLLECT, FLASH_S);
    return { honored, anims };
  };

  // ── PASS 1 — the hazard gate. Under a reduce preference, nothing may loop fast. ──
  const reduce = await load(true);
  if (!reduce.honored) {
    console.log('PROBE_ERR emulateMediaFeatures did not take — the probe cannot prove anything');
    await browser.close();
    process.exit(1);
  }
  const offenders = reduce.anims.filter(a => a.infinite && a.fast && a.painted);

  // ── PASS 2 — the anti-degenerate check. Normal users must still get the ambient motion. ──
  const normal = await load(false);
  const ambient = normal.anims.filter(a => a.infinite && a.painted);

  console.log('REDUCED_MOTION honored=' + reduce.honored
    + ' scanned=' + reduce.anims.length
    + ' flash_offenders=' + offenders.length);
  for (const o of offenders) {
    console.log('  FLASH ~' + Math.round(1 / parseFloat(o.dur)) + 'Hz  '
      + o.name + '  dur=' + o.dur + ' iter=' + o.iter + '  ' + o.where);
  }
  console.log('NORMAL_MOTION ambient_infinite=' + ambient.length
    + ' [' + [...new Set(ambient.map(a => a.name))].sort().join(' ') + ']');
  if (pageErrors.length) console.log('PAGE_ERRORS', pageErrors.length, pageErrors.slice(0, 3).join(' | '));

  if (offenders.length > 0) {
    console.log('FAIL — ' + offenders.length + ' painted element(s) loop faster than '
      + FLASH_S + 's for users who asked for LESS motion. Cap animation-iteration-count '
      + 'in the prefers-reduced-motion block.');
    await browser.close();
    process.exit(1);
  }
  if (ambient.length === 0) {
    console.log('FAIL — no ambient animation survives for normal users. PASS 1 is passing '
      + 'degenerately (motion deleted rather than reduced).');
    await browser.close();
    process.exit(1);
  }
  console.log('PASS — 0 flash offenders under reduce · ' + ambient.length + ' ambient loops intact for normal users.');
  await browser.close();
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
