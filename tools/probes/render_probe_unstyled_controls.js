// tools/probes/render_probe_unstyled_controls.js — NO VISIBLE CONTROL MAY RENDER UNSTYLED.
//
// Usage: node tools/probes/render_probe_unstyled_controls.js   (exit 0 = PASS)
//
// ★ WHY THIS EXISTS. On 2026-08-23 the Coverage page grew four raw browser buttons — 2px outset
// border, #f0f0f0, Arial, square corners. Cause: coverage.ts renders the phone pane switch at
// EVERY width while every rule styling it sat inside `@media (max-width: 767px)`, so on a desktop
// the markup arrived with no rule matching it and the UA drew its own. The board was 103/103
// throughout.
//
// It is the third time this exact shape has shipped here (the food sheet's Add button, an
// over-scoped .kd-ep--prod rule, now .cov-panes__btn), and no static check can see it: the
// element EXISTS, the class EXISTS, the CSS file EXISTS — the rule just does not apply at this
// width. Only the rendered page knows.
//
// ★ HOW IT CALIBRATES. It does not hold a list of approved fonts or colours, which would go stale
// the moment the design system moved. It creates a fresh un-classed <button> in the live document
// and reads ITS computed style — that IS the user-agent default, by construction. Any visible
// control matching the UA default on font AND border AND background is unstyled. Self-calibrating,
// so it cannot rot.
//
// ★ WHAT THIS CANNOT DO. It proves a control received SOME styling, never that the styling is
// GOOD. A beautifully wrong button passes.

const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer']) { try { pup = require(c); break; } catch (e) { /* next */ } }
if (!pup) { console.log('NO_PUPPETEER'); process.exit(2); }

const wait = ms => new Promise(r => setTimeout(r, ms));
const WIDTHS = [[1440, 900, 'desktop'], [820, 900, 'narrow-desktop'], [375, 812, 'phone']];
const RAILS = ['coverage', 'regimen', 'scanner'];

/** Runs IN the page. Returns every visible control whose computed style matches the UA default. */
function findUnstyled() {
  const ref = document.createElement('button');
  ref.textContent = 'x';
  ref.style.position = 'absolute';
  ref.style.left = '-9999px';
  document.body.appendChild(ref);
  const ua = getComputedStyle(ref);
  const uaFont = ua.fontFamily;
  const uaBorder = ua.borderTopStyle;
  const uaBg = ua.backgroundColor;
  ref.remove();

  const out = [];
  for (const el of document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]')) {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) { continue; }          // not rendered — an ancestor hid it
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.opacity === '0') { continue; }
    // ALL THREE must match the UA reference. Any one alone is a legitimate design choice —
    // a designed button may sit on a #f0f0f0 ground, or deliberately carry no border.
    if (cs.fontFamily === uaFont && cs.borderTopStyle === uaBorder && cs.backgroundColor === uaBg) {
      out.push({
        cls: el.className || '(no class)',
        text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30),
        font: cs.fontFamily.split(',')[0],
        border: cs.borderTopWidth + ' ' + cs.borderTopStyle,
        bg: cs.backgroundColor,
      });
    }
  }
  return { uaFont: uaFont.split(',')[0], uaBorder, uaBg, hits: out };
}

/** NEGATIVE CONTROL: a gate never shown to fail is not evidence. */
function injectStray() {
  const b = document.createElement('button');
  b.className = 'probe-negative-control';
  b.textContent = 'stray';
  document.querySelector('.app-workspace, .coverage-workspace, body').appendChild(b);
}

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const url = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');
  const violations = [];
  let checked = 0;

  for (const [w, h, label] of WIDTHS) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: w < 768, hasTouch: w < 768 });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await wait(1800);
    // the first-run veil covers the app on a fresh profile and would hide every control
    await page.evaluate(() => { [...document.querySelectorAll('.wc, .wc-veil')].forEach(e => e.remove()); });

    for (const rail of RAILS) {
      await page.evaluate(r => document.querySelector(`[data-rail-nav="${r}"]`)?.click(), rail);
      await wait(700);
      const res = await page.evaluate(findUnstyled);
      checked += 1;
      for (const hit of res.hits) {
        violations.push(`${label} ${w}px · ${rail} · .${hit.cls} "${hit.text}" — ${hit.font}, ${hit.border}, ${hit.bg}`);
      }
      if (rail === RAILS[0] && label === 'desktop') {
        console.log(`  UA reference on this engine: font=${res.uaFont} border=${res.uaBorder} bg=${res.uaBg}`);
      }
    }
  }

  // ── negative control: the detector must SEE a deliberately unstyled button ──
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await wait(1500);
  await page.evaluate(() => { [...document.querySelectorAll('.wc, .wc-veil')].forEach(e => e.remove()); });
  await page.evaluate(injectStray);
  const control = await page.evaluate(findUnstyled);
  const sawStray = control.hits.some(x => String(x.cls).includes('probe-negative-control'));

  await browser.close();

  console.log(`\n  surfaces checked: ${checked} (3 widths x 3 workspaces)`);
  console.log(`  negative control: ${sawStray ? 'DETECTED the stray button' : 'MISSED IT'}`);
  if (!sawStray) {
    console.log('\nRESULT: FAIL — the detector did not fire on a deliberately unstyled button, so a PASS proves nothing.');
    process.exit(1);
  }
  if (violations.length > 0) {
    console.log(`\n  ${violations.length} unstyled control(s):`);
    violations.forEach(v => console.log('    x ' + v));
    console.log('\nRESULT: FAIL — a visible control is rendering with user-agent default styling.');
    process.exit(1);
  }
  console.log('\nRESULT: PASS — every visible control carries project styling at every width checked.');
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
