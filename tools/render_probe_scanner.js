// tools/render_probe_scanner.js — headless mount check for the Scanner surface (⌘3).
//
// Usage: node tools/render_probe_scanner.js   (exit 0 = PASS, non-zero = FAIL)
//
// Verifies the Scanner workspace mounts as the Scan·Confirm·Result design (2026-08-13
// live port): navigates to the scanner rail item, scopes queries to
// #workspace-scanner-mount, and asserts the .vd idle shell rendered — the Scan step
// (.vd-step--scan) with its New Scan button + drop zone — AND that the retired
// in-content stepper strip (.vd-flow) is ABSENT (the flow line lives in the topbar
// now). No page errors. Mirrors render_probe.js.

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
    // Layout guard (regression 2026-08-19): the ingredients box (.vd-paste) must render FULL-WIDTH
    // BELOW the upload zone (.vd-drop), never beside it. It has no explicit flex-basis-safety unless
    // .vd-paste pins flex: 1 1 100%; a content change once shrank it and it jumped into a side column.
    const drop = mount ? mount.querySelector('.vd-drop') : null;
    const paste = mount ? mount.querySelector('.vd-paste') : null;
    let pasteBelowDrop = null, pasteFullWidth = null;
    if (drop && paste) {
      const dr = drop.getBoundingClientRect(), pr = paste.getBoundingClientRect();
      pasteBelowDrop = pr.top >= dr.bottom - 2;
      pasteFullWidth = pr.width >= dr.width - 4;
    }
    return {
      mountExists: !!mount,
      mountVisible,
      vd: inMount('.vd'),
      scanStep: inMount('.vd-step--scan'),
      dropZone: inMount('.vd-drop'),
      newScan: inMount('.vd-newscan'),
      stepBadge: inMount('.vd-step__badge'),
      stepper: inMount('.vd-flow'),
      pasteBelowDrop,
      pasteFullWidth,
    };
  });

  console.log('SCANNER', JSON.stringify(info));
  console.log('PAGE_ERRORS', pageErrors.length, pageErrors.slice(0, 5).join(' | '));

  const ok = clicked
    && info.mountExists && info.mountVisible
    && info.vd >= 1 && info.scanStep >= 1 && info.dropZone >= 1
    && info.newScan >= 1 && info.stepBadge >= 1
    && info.stepper === 0
    && info.pasteBelowDrop === true && info.pasteFullWidth === true
    && pageErrors.length === 0;
  console.log(ok ? 'PASS · scanner mounts Scan·Confirm·Result idle shell; no in-content stepper' : 'FAIL · scanner surface did not mount cleanly');
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
