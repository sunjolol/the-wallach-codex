// tools/render_probe_rail_sync.js — the rail highlight tells the truth, + the nameplate face.
//
// Usage: node tools/render_probe_rail_sync.js   (exit 0 = PASS, non-zero = FAIL)
//
// WHY THIS EXISTS (Luneth, 2026-07-23): "when I click into any of the side tabs then
// close out of them, they stay highlighted". The rail's active class is DERIVED state,
// and the shell only re-derived it on the paths IT drove (rail click, Esc, the
// search->knowledge swap). Closing a drawer from INSIDE — its own [X], or the search
// scrim — flipped the drawer's isOpen without telling the shell, so the button stayed
// lit for a drawer that was already gone.
//
// The fix is an emitted 'drawer:toggled'. A static check would only prove the emit
// EXISTS (the mineral-tiers lesson); this drives each drawer through its OWN close
// affordance and asserts the highlight actually drops. Run against the pre-fix bundle
// it must FAIL on all three — that negative control is what makes a pass mean anything.

const path = require('path');
const REPO = path.resolve(__dirname, '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

const wait = ms => new Promise(r => setTimeout(r, ms));

// Each drawer, with the close affordance that lives INSIDE it — deliberately not Esc
// and not the rail button, since those are the two paths that already worked.
const DRAWERS = [
  { target: 'knowledge', mount: 'drawer-knowledge-mount', openCls: 'kd-open', closeSel: '[data-kd-action="close"]' },
  // Search has no [X]: the mount host IS the scrim, and a click outside the panel closes.
  { target: 'search',    mount: 'drawer-search-mount',    openCls: 'sr-open', closeSel: null },
];

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));

  const url = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.log('GOTO_ERR', e.message));
  await wait(1500);

  const readState = (mount, openCls, target) => page.evaluate((m, c, t) => {
    const el = document.getElementById(m);
    const btn = document.querySelector(`.rail__item[data-rail-nav="${t}"]`);
    return {
      drawerOpen: el ? el.classList.contains(c) : null,
      railActive: btn ? btn.classList.contains('active') : null,
    };
  }, mount, openCls, target);

  const fails = [];
  const report = {};

  for (const d of DRAWERS) {
    // 1. Open from the rail.
    await page.evaluate(t => document.querySelector(`[data-rail-nav="${t}"]`)?.click(), d.target);
    await wait(350);
    const opened = await readState(d.mount, d.openCls, d.target);

    // 2. Close from INSIDE the drawer — the path the shell never saw.
    if (d.closeSel === null) {
      // The search scrim: click the mount host itself, outside [data-aw-pop].
      await page.evaluate(m => document.getElementById(m)?.click(), d.mount);
    } else {
      await page.evaluate(s => document.querySelector(s)?.click(), d.closeSel);
    }
    await wait(350);
    const closed = await readState(d.mount, d.openCls, d.target);

    report[d.target] = { opened, closed };

    // Open must light the rail (guards against "fixed" by never highlighting at all).
    if (opened.drawerOpen !== true) fails.push(`${d.target}: rail click did not open the drawer`);
    if (opened.railActive !== true) fails.push(`${d.target}: rail item not highlighted while OPEN`);
    // Close from inside must drop both.
    if (closed.drawerOpen !== false) fails.push(`${d.target}: internal close did not close the drawer`);
    if (closed.railActive !== false) fails.push(`${d.target}: rail item STAYED highlighted after close (the bug)`);
  }

  // The nameplate: Unbounded at 0.85rem (= 13.6px at the 16px root).
  const np = await page.evaluate(() => {
    const el = document.querySelector('.np__name');
    if (el === null) return null;
    const cs = getComputedStyle(el);
    return { font: cs.fontFamily, size: cs.fontSize, text: (el.textContent || '').trim() };
  });
  report.nameplate = np;
  if (np === null) fails.push('nameplate: .np__name not found');
  else {
    if (!/Unbounded/i.test(np.font)) fails.push(`nameplate: font is ${np.font}, expected Unbounded`);
    if (np.size !== '13.6px') fails.push(`nameplate: size is ${np.size}, expected 13.6px (0.85rem)`);
  }

  console.log('RAIL_SYNC', JSON.stringify(report));
  console.log('PAGE_ERRORS', errs.length, errs.slice(0, 3).join(' | '));

  await browser.close();
  if (fails.length) { console.log('FAIL', JSON.stringify(fails)); process.exit(1); }
  console.log('PASS — rail highlight drops on every internal close; nameplate is Unbounded 0.85rem');
})();
