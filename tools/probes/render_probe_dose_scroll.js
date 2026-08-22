// tools/probes/render_probe_dose_scroll.js — a dose step must not move the reader.
//
// Coverage and Regimen both repaint by replacing container.innerHTML, and every dose step fires a
// recompute. Without the scroll guard, a `+` halfway down the 91-tile field threw the reader back
// to the top and they had to find their place again on every single step.
//
// ★ THERE ARE TWO SCROLLERS, AND FOR MONTHS THIS PROBE READ ONLY ONE. The page scroller
// (.app-workspace) was guarded and this file held it green. The Daily Protocol rail is its OWN
// scroller ([data-rail-list] — max-height + overflow-y:auto) rebuilt by buildRailRows through
// replaceChildren, and nothing guarded it: with more rows than fit, stepping the servings on a
// row near the bottom snapped the rail back to row one. The owner reported it on 2026-08-22, by
// which time this probe had been passing over the defect for as long as the rail had existed.
// A gate is exactly as wide as the thing it measures. It now measures both.
//
// ★ AND IT WAS CLICKING THE WRONG BUTTON. `document.querySelector('[data-dose-up]')` is not
// scoped to the visible workspace, and BOTH workspaces stay in the DOM — the inactive one is
// merely hidden. So the "regimen" pass was clicking Coverage's hidden stepper and watching the
// Regimen page react to it. Every click below is scoped to the workspace under test and the
// element is asserted visible before it is used.
//
// ★ SCROLLED TO THE MIDDLE, NOT THE BOTTOM, AND THE ASSERTION ALLOWS A CLAMP. A dose step
// legitimately changes the page's height — covering one more essential can drop a food from the
// list, or retire the foods pager — and no guard can restore a position the content no longer
// reaches. The old fixed 500 sat within 50px of the bottom and passed on that headroom alone;
// when a layout change spent it, this probe went red over correct behaviour. The rule asserted
// here is the honest one: the reader stays exactly where they were, unless the page can no
// longer reach that far, in which case they land at the new end.
//
// This has to be a PROBE, not a test: the defect is what the browser does to scrollTop when a
// subtree is swapped, and no static read of the source can see it. Negative controls assert both
// scrollers were genuinely scrolled first, so a page too short to scroll can never pass vacuously.
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
const sleep = ms => new Promise(r => setTimeout(r, ms));
// The rail only scrolls once it overflows its max-height, and the rail is HALF this probe.
const SEED = 14;

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900 });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await sleep(900);
  if (await page.$('[data-browse]')) { await page.click('[data-browse]'); }
  await sleep(1000);

  // Seed until the rail overflows. Products first, then foods — whichever the tab still offers.
  for (let i = 0; i < SEED; i++) {
    const add = await page.$('.rec__add') || await page.$('.fs-block [data-food-add]');
    if (!add) { break; }
    await add.click();
    await sleep(420);
  }

  const checks = [];
  // The workspace root of each tab, so every query below is scoped to the tab under test.
  const ROOT = { coverage: '.coverage-workspace', regimen: '.ck' };

  for (const view of ['coverage', 'regimen']) {
    await page.evaluate(v => window.dispatchEvent(new CustomEvent('wallach:navigate', { detail: { to: v } })), view);
    await sleep(1200);

    // Halfway down the page, and the rail to its end.
    const seeded = await page.evaluate((root) => {
      const scope = document.querySelector(root);
      const s = document.querySelector('.app-workspace');
      s.scrollTop = Math.floor((s.scrollHeight - s.clientHeight) / 2);
      const rail = scope && scope.querySelector('[data-rail-list]');
      if (rail) { rail.scrollTop = rail.scrollHeight - rail.clientHeight; }
      return {
        page: s.scrollTop,
        rail: rail ? rail.scrollTop : -1,
        railRows: rail ? rail.children.length : 0,
      };
    }, ROOT[view]);
    await sleep(300);

    // NEGATIVE CONTROLS: "it did not move" proves nothing about a scroller that never moved.
    checks.push([`${view}: the page scroller actually scrolled first (${seeded.page})`, seeded.page > 0]);
    checks.push([`${view}: the rail actually scrolled first (${seeded.rail}, ${seeded.railRows} rows)`, seeded.rail > 0]);

    // The stepper must be THIS tab's, and visible — both workspaces stay in the DOM.
    const clicked = await page.evaluate((root) => {
      const scope = document.querySelector(root);
      if (!scope) { return { ok: false, why: 'no workspace root' }; }
      const el = [...scope.querySelectorAll('[data-dose-up]')]
        .filter(e => e.getBoundingClientRect().height > 0).pop();
      if (!el) { return { ok: false, why: 'no visible stepper in this workspace' }; }
      el.click();
      return { ok: true, why: 'clicked the last visible stepper' };
    }, ROOT[view]);
    checks.push([`${view}: a visible dose stepper in this workspace (${clicked.why})`, clicked.ok]);
    await sleep(1100);

    const after = await page.evaluate((root) => {
      const scope = document.querySelector(root);
      const s = document.querySelector('.app-workspace');
      const rail = scope && scope.querySelector('[data-rail-list]');
      return {
        page: s.scrollTop,
        pageMax: s.scrollHeight - s.clientHeight,
        rail: rail ? rail.scrollTop : -1,
        railMax: rail ? rail.scrollHeight - rail.clientHeight : -1,
      };
    }, ROOT[view]);

    // Exactly where they were — or at the new end, when the content no longer reaches that far.
    const wantPage = Math.min(seeded.page, after.pageMax);
    const wantRail = Math.min(seeded.rail, after.railMax);
    checks.push([
      `${view}: page scroll survives the dose step (${seeded.page} -> ${after.page}, max ${after.pageMax})`,
      after.page === wantPage,
    ]);
    checks.push([
      `${view}: RAIL scroll survives the dose step (${seeded.rail} -> ${after.rail}, max ${after.railMax})`,
      after.rail === wantRail,
    ]);
  }

  const failed = checks.filter(c => !c[1]);
  checks.forEach(c => console.log(`  ${c[1] ? 'ok  ' : 'FAIL'} · ${c[0]}`));
  console.log('PAGE_ERRORS', errors.length, errors.slice(0, 2));
  await browser.close();
  if (failed.length > 0 || errors.length > 0) {
    console.log(`FAIL · ${failed.length} check(s), ${errors.length} page error(s)`);
    process.exit(1);
  }
  console.log(`PASS · ${checks.length} checks — a dose step repaints without moving the reader, on either scroller`);
})();
