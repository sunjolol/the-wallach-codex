// tools/render_probe_scanner.js — headless mount check for the Scanner surface (⌘3).
//
// Usage: node tools/render_probe_scanner.js   (exit 0 = PASS, non-zero = FAIL)
//
// Chunk 6a: verifies the Scanner workspace mounts off legacy. Navigates to the
// scanner rail item, scopes queries to #workspace-scanner-mount, and asserts the
// v3 idle shell rendered (.scanner-grid + drop stage + pipeline + history rail),
// the legacy host is hidden, and no page errors fired. Mirrors render_probe.js.

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
  page.on('pageerror', e => pageErrors.push(e.message));

  const url = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.log('GOTO_ERR', e.message));
  await new Promise(r => setTimeout(r, 1500));

  const clicked = await page.evaluate(() => {
    const btn = document.querySelector('[data-rail-nav="scanner"]');
    if (!btn) return false;
    btn.click();
    return true;
  });
  await new Promise(r => setTimeout(r, 800));

  const info = await page.evaluate(() => {
    const mount = document.getElementById('workspace-scanner-mount');
    const inMount = s => (mount ? mount.querySelectorAll(s).length : -1);
    const mountVisible = mount ? getComputedStyle(mount).display !== 'none' : false;
    const legacyHost = document.getElementById('legacy-workspace-host');
    const legacyHidden = legacyHost ? getComputedStyle(legacyHost).display === 'none' : null;
    return {
      mountExists: !!mount,
      mountVisible,
      legacyHidden,
      grid: inMount('.scanner-grid'),
      stage: inMount('.scan-stage'),
      dropZone: inMount('.scan-canvas--empty'),
      pipeline: inMount('.pipeline'),
      parsed: inMount('.parsed'),
      verdict: inMount('.verdict'),
      historyRail: inMount('.scanner-side'),
    };
  });

  console.log('SCANNER', JSON.stringify(info));
  console.log('PAGE_ERRORS', pageErrors.length, pageErrors.slice(0, 5).join(' | '));

  const ok = clicked
    && info.mountExists && info.mountVisible
    && info.legacyHidden === true
    && info.grid >= 1 && info.stage >= 1 && info.dropZone >= 1
    && info.pipeline >= 1 && info.parsed >= 1 && info.verdict >= 1
    && info.historyRail >= 1
    && pageErrors.length === 0;
  console.log(ok ? 'PASS · scanner surface mounts off legacy (idle)' : 'FAIL · scanner surface did not mount cleanly');
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
