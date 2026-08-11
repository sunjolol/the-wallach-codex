// tools/render_probe.js — headless render check for the NEW dashboard.
//
// Usage: node tools/render_probe.js
//
// Loads dashboard.html from file:// in headless Chromium and reports what
// actually renders: tile counts by section, goal chips, the ledger recon line,
// status classes (covered/partial/present/gap), page errors, and failed
// resources. A fast BOOT/SMOKE reporter — does the app render at all, no page
// errors, sane counts. The deep coverage-loop assertions (add → dose → remove,
// the denominator holds) live in tools/render_probe_coverage_add_remove.js.
//
// Why this exists: it replaced the old tools/dashboard_smoke.js (deleted in the
// June-2026 cleanup), a stale legacy-contract test that hunted
// .essential-tile[data-name] + legacy window.* fns the new src/ architecture
// replaced. This probe checks the new architecture's real DOM.
// It is the build→test loop's eyes. Requires puppeteer (in node_modules).
//
// Selectors refreshed 2026-08-11: the pre-2026-07-16 .goal-chip / .coverage-stat__*
// / .tile.trace names had gone dead in that coverage revamp (goal chips became
// .gchip, the kill-shot stat became the .ledger recon bar, and the status
// vocabulary became covered/partial/present/gap). Verified against the live view
// via tools/render_probe_coverage_add_remove.js.

const path = require('path');
const REPO = path.resolve(__dirname, '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const pageErrors = [];
  const failed = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('requestfailed', r => failed.push(r.url().split('/').slice(-2).join('/')));

  const url = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.log('GOTO_ERR', e.message));
  await new Promise(r => setTimeout(r, 1800));

  const info = await page.evaluate(() => {
    const q = s => document.querySelectorAll(s).length;
    const txt = s => { const el = document.querySelector(s); return el ? el.textContent.trim().replace(/\s+/g, ' ') : null; };
    return {
      tiles: q('.tile'), vit: q('.tile--vitamin'), amino: q('.tile--amino'), fat: q('.tile--fat'),
      sections: q('.essentials-section'), goals: q('.gchip:not(.gchip--add)'),
      recon: txt('.ledger__recon'),
      statusCovered: q('.tile.covered, .tile--vitamin.covered, .tile--amino.covered, .tile--fat.covered'),
      statusPartial: q('.tile.partial, .tile--vitamin.partial, .tile--amino.partial, .tile--fat.partial'),
      statusPresent: q('.tile.present, .tile--vitamin.present, .tile--amino.present, .tile--fat.present'),
      statusGap: q('.tile.gap, .tile--vitamin.gap, .tile--amino.gap, .tile--fat.gap'),
    };
  });

  console.log('RENDER', JSON.stringify(info));
  console.log('PAGE_ERRORS', pageErrors.length, pageErrors.slice(0, 3).join(' | '));
  if (failed.length) {
    const u = {};
    failed.forEach(f => { u[f] = (u[f] || 0) + 1; });
    console.log('FAILED_RESOURCES', failed.length, JSON.stringify(u));
  }
  await browser.close();
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
