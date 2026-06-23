// tools/render_probe.js — headless render check for the NEW dashboard.
//
// Usage: node tools/render_probe.js
//
// Loads dashboard.html from file:// in headless Chromium and reports what
// actually renders: tile counts by section, goal cards, the coverage-stat
// pill, status classes (covered/gap), page errors, and failed resources.
//
// Why this exists: it replaced the old tools/dashboard_smoke.js (deleted in the
// June-2026 cleanup), a stale legacy-contract test that hunted
// .essential-tile[data-name] + legacy window.* fns the new src/ architecture
// replaced. This probe checks the new architecture's real DOM.
// It is the build→test loop's eyes. Requires puppeteer (in node_modules).

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
    const txt = s => { const el = document.querySelector(s); return el ? el.textContent.trim() : null; };
    return {
      tiles: q('.tile'), vit: q('.tile--vitamin'), amino: q('.tile--amino'), fat: q('.tile--fat'),
      sections: q('.essentials-section'), goals: q('.goal-card'),
      coveredStat: txt('.coverage-stat__num'),
      totalStat: txt('.coverage-stat__den'),
      statusCovered: q('.tile.covered, .tile--vitamin.covered, .tile--amino.covered, .tile--fat.covered'),
      statusPartial: q('.tile.partial, .tile--vitamin.partial'),
      statusTrace: q('.tile.trace, .tile--vitamin.trace'),
      statusGap: q('.tile.gap, .tile--vitamin.gap'),
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
