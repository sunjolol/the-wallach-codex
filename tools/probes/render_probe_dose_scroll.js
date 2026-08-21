// tools/probes/render_probe_dose_scroll.js — the dose stepper must not move the page.
//
// Coverage and Regimen both repaint by replacing container.innerHTML, and every dose step fires a
// recompute. Without the scroll guard, a `+` halfway down the 91-tile field threw the reader back
// to the top and they had to find their place again on every single step.
//
// This has to be a PROBE, not a test: the defect is what the browser does to scrollTop when a
// subtree is swapped, and no static read of the source can see it. It asserts the scroll position
// SURVIVES, and — as a negative control — that the scroller was genuinely scrolled first, so a
// page too short to scroll can never pass this vacuously.
//
// Usage: node tools/probes/render_probe_dose_scroll.js
const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
let puppeteer = null;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { puppeteer = require(c); break; } catch (e) { /* try the next candidate */ }
}
if (puppeteer === null) { console.log('NO_PUPPETEER — install puppeteer to run this probe'); process.exit(2); }

const URL = 'file:///' + REPO.replace(/\\/g, '/') + '/dashboard/dashboard.html';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900 });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 900));
  if (await page.$('[data-browse]')) { await page.click('[data-browse]'); }
  await new Promise(r => setTimeout(r, 1000));

  // Seed two products so the Daily Protocol rail has steppers at all.
  for (let i = 0; i < 2; i++) {
    const add = await page.$('.rec__add');
    if (add) { await add.click(); await new Promise(r => setTimeout(r, 700)); }
  }

  const checks = [];
  for (const view of ['coverage', 'regimen']) {
    await page.evaluate(v => window.dispatchEvent(new CustomEvent('wallach:navigate', { detail: { to: v } })), view);
    await new Promise(r => setTimeout(r, 1200));
    await page.evaluate(() => { document.querySelector('.app-workspace').scrollTop = 500; });
    await new Promise(r => setTimeout(r, 300));
    const before = await page.evaluate(() => document.querySelector('.app-workspace').scrollTop);
    // NEGATIVE CONTROL: if the page never scrolled, "it did not move" proves nothing.
    checks.push([`${view}: the workspace actually scrolled first`, before > 0]);
    const clicked = await page.evaluate(() => {
      const el = document.querySelector('[data-dose-up]');
      if (!el) { return false; }
      el.click();
      return true;
    });
    checks.push([`${view}: a dose stepper is present`, clicked]);
    await new Promise(r => setTimeout(r, 1100));
    const after = await page.evaluate(() => document.querySelector('.app-workspace').scrollTop);
    checks.push([`${view}: scroll survives the dose step (${before} -> ${after})`, before === after]);
  }

  const failed = checks.filter(c => !c[1]);
  checks.forEach(c => console.log(`  ${c[1] ? 'ok  ' : 'FAIL'} · ${c[0]}`));
  console.log('PAGE_ERRORS', errors.length, errors.slice(0, 2));
  await browser.close();
  if (failed.length > 0 || errors.length > 0) {
    console.log(`FAIL · ${failed.length} check(s), ${errors.length} page error(s)`);
    process.exit(1);
  }
  console.log(`PASS · ${checks.length} checks — a dose step repaints without moving the reader`);
})();
