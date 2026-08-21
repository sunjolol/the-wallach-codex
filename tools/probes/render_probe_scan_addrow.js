// tools/probes/render_probe_scan_addrow.js — the Scanner's MANUAL ROW entry.
//
// Usage: node tools/probes/render_probe_scan_addrow.js   (exit 0 = PASS, non-zero = FAIL)
//
// Drives the path that had no exit before this control existed: drop an image OCR cannot read,
// land on Confirm with ZERO rows, and add the reads by hand. That is the only route into the
// regimen for an item whose label is not machine-readable (a food, or a bottle OCR misses), and
// the Confirm step could previously edit or delete rows but never create one.
//
// WHY A PROBE AND NOT A UNIT TEST: the defect it guards is a REGRESSION IN COMMITTED STATE —
// "Add a row" must re-render (a new row needs a live index the readback can find), and a naive
// re-render silently discards every edit already typed on screen. Only a real DOM round-trip
// catches that, so the negative control below is the point of the file, not decoration.
//
// Requires puppeteer.

const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

const wait = ms => new Promise(r => setTimeout(r, ms));
const checks = [];
const ck = (name, ok, detail) => {
  checks.push(ok);
  console.log((ok ? '  ok   ' : '  FAIL ') + name + (detail ? '   ' + detail : ''));
};

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1100 });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));

  const url = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.log('GOTO_ERR', e.message));
  await wait(2200);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button,a')].find(e => /just browsing/i.test(e.textContent || ''));
    if (b) { b.click(); }
  });
  await wait(600);
  await page.evaluate(() => document.querySelector('[data-rail-nav="scanner"]')?.click());
  await wait(900);

  // A blank PNG: OCR reads nothing, which IS the case under test.
  await page.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 600; c.height = 400;
    const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, 600, 400);
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    const dt = new DataTransfer();
    dt.items.add(new File([blob], 'blank.png', { type: 'image/png' }));
    const host = document.getElementById('workspace-scanner-mount') || document.body;
    host.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
  });
  for (let i = 0; i < 40; i++) {
    await wait(1000);
    if (await page.evaluate(() => document.querySelector('.vd-nlist') !== null)) { break; }
  }

  ck('an unreadable image still reaches Confirm', await page.evaluate(() => document.querySelector('.vd-nlist') !== null));
  const rows0 = await page.evaluate(() => document.querySelectorAll('.vd-nrow[data-nrow]').length);
  ck('Confirm opens with zero OCR rows', rows0 === 0, 'rows=' + rows0);
  const hasBtn = await page.evaluate(() => document.querySelector('[data-nadd]') !== null);
  ck('the add-row control is present', hasBtn === true);
  if (!hasBtn) { await browser.close(); process.exit(1); }

  await page.evaluate(() => document.querySelector('[data-nadd]').click());
  await wait(700);
  ck('clicking it creates the first row',
    await page.evaluate(() => document.querySelectorAll('.vd-nrow[data-nrow]').length) === 1);

  const fill = (nm, amt, unit) => page.evaluate((n, a, u) => {
    const rows = [...document.querySelectorAll('.vd-nrow[data-nrow]')];
    const last = rows[rows.length - 1];
    const set = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
    set(last.querySelector('.vd-edit'), n);
    set(last.querySelector('.vd-amt'), a);
    set(last.querySelector('.vd-unit'), u);
  }, nm, amt, unit);

  await fill('Germanium', '30', 'mg');
  await wait(700);
  ck('a hand-typed name maps to an essential',
    await page.evaluate(() => {
      const rows = [...document.querySelectorAll('.vd-nrow[data-nrow]')];
      return rows[rows.length - 1].dataset.nmap;
    }) === 'essential');

  // ★ THE NEGATIVE CONTROL. Adding a SECOND row repaints the step; row 0's typed value must
  // survive. Without the commit-before-render this reads back as '' and the probe goes red.
  await page.evaluate(() => document.querySelector('[data-nadd]').click());
  await wait(700);
  const kept = await page.evaluate(() => {
    const i = document.querySelector('.vd-edit[data-nedit="0"]');
    return i ? i.value : null;
  });
  ck('the first row survives the second add (edits committed, not lost)', kept === 'Germanium', 'row0="' + kept + '"');

  await fill('Silver', '400', 'mcg');
  await wait(700);
  ck('the unit field shows "mcg" un-clipped',
    await page.evaluate(() => {
      const u = [...document.querySelectorAll('.vd-unit')].pop();
      return u !== undefined && u.scrollWidth <= u.clientWidth + 1;
    }) === true);

  await page.evaluate(() => document.querySelector('[data-sc-confirm]')?.click());
  await wait(1600);
  const adopted = await page.evaluate(() => {
    const e = document.querySelector('[data-sc-adopt]');
    if (!e) { return false; }
    e.click();
    return true;
  });
  ck('the hand-built label adopts into the regimen', adopted === true);
  await wait(1300);

  await page.evaluate(() => document.querySelector('[data-rail-nav="coverage"]')?.click());
  await wait(1500);
  const tiles = await page.evaluate(() => {
    const g = (n) => {
      const e = [...document.querySelectorAll('.tile')].find(x => (x.dataset.tile || '') === n);
      return e ? (['covered', 'partial', 'trace', 'gap', 'present'].find(s => e.classList.contains(s)) || '(none)') : '(no tile)';
    };
    return { ge: g('GERMANIUM'), ag: g('SILVER'), zn: g('ZINC') };
  });
  ck('GERMANIUM covers off the hand-added row', tiles.ge === 'covered', 'tile=' + tiles.ge);
  ck('SILVER covers off the hand-added row', tiles.ag === 'covered', 'tile=' + tiles.ag);
  // Control: nothing was typed for zinc, so nothing may move it.
  ck('an untouched tile (ZINC) did not move', tiles.zn === 'gap', 'zinc=' + tiles.zn);
  ck('no page errors', errs.length === 0, errs.join(' | '));

  await browser.close();
  const bad = checks.filter(x => !x).length;
  console.log('\n' + (checks.length - bad) + '/' + checks.length + ' checks ' + (bad ? 'FAILED' : 'PASS'));
  process.exit(bad ? 1 : 0);
})();
