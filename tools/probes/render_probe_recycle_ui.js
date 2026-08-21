// recycle popup UI wiring — trigger opens; Restore (save + item) works and refreshes; × closes.
const path = require('path');
const REPO = require('path').resolve(__dirname, '..', '..');
let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) {}
}
if (!pup) { console.log('NO_PUPPETEER'); process.exit(2); }
const wait = ms => new Promise(r => setTimeout(r, ms));
const slot = (id, name, items) => ({ id, name, items: items || [], overrides: {}, createdAt: '2026-08-10', editedAt: '2026-08-15', colour: '#ff7e3c', goals: [] });
const item = (id, name) => ({ id, label: { name, nutrients: [{ name: 'Zinc' }] }, addedDate: '2026-08-15', provenance: 'user_manual' });

(async () => {
  const b = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await b.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/'), { waitUntil: 'domcontentloaded', timeout: 30000 });
  const now = Date.now(); const ago = m => new Date(now - m * 60000).toISOString();
  const doc = {
    version: 1, activeSlot: 'default',
    slots: [slot('default', 'Main', [])],
    trash: [{ item: item(601, 'Osteo FX'), slotId: 'default', slotName: 'Main', removedAt: ago(5) }],
    slotTrash: [
      { slot: slot('trip', 'Trip', [item(11, 'A')]), deletedAt: ago(2) },
      { slot: slot('cut', 'Cutting', [item(21, 'B')]), deletedAt: ago(60) },
    ],
  };
  await page.evaluate((d) => { localStorage.setItem('wallachUserProfile_v1', JSON.stringify({ name: 'L', browsing: false, chosenAt: '2026-07-15' })); localStorage.setItem('rgSlots_v1', JSON.stringify(d)); }, doc);
  await page.reload({ waitUntil: 'domcontentloaded' }); await wait(1000);
  await page.evaluate(() => document.querySelector('[data-rail-nav="regimen"]')?.click()); await wait(800);
  const click = sel => page.evaluate(s => { const el = document.querySelector(s); if (el) { el.click(); return true; } return false; }, sel);
  const snap = () => page.evaluate(() => {
    const d = window.loadSlots();
    return { slots: d.slots.length, saveBin: (d.slotTrash || []).length, itemBin: d.trash.length,
      popOpen: !!document.querySelector('.rc-pop') && document.querySelector('[data-rc-host]') && !document.querySelector('[data-rc-host]').hidden,
      tiles: document.querySelectorAll('.rc-gtile').length, items: document.querySelectorAll('.rc-item').length };
  });
  const fails = []; const chk = (c, m) => { if (!c) fails.push(m); };

  chk(await click('[data-rc-open]'), 'trigger not found');
  await wait(300);
  let s = await snap();
  chk(s.popOpen && s.tiles === 2 && s.items === 1, `open: ${JSON.stringify(s)}`);

  // restore the first deleted save
  chk(await click('.rc-gtile [data-rc-restore-slot]'), 'save Restore not found');
  await wait(400);
  s = await snap();
  chk(s.slots === 2 && s.saveBin === 1, `after restore-save: slots=${s.slots} saveBin=${s.saveBin}`);
  chk(s.popOpen && s.tiles === 1, `popup did not refresh after restore-save: ${JSON.stringify(s)}`);

  // restore the removed item
  chk(await click('.rc-item [data-rc-restore-item]'), 'item Restore not found');
  await wait(400);
  s = await snap();
  chk(s.itemBin === 0, `after restore-item: itemBin=${s.itemBin}`);
  chk(s.popOpen && s.items === 0, `popup did not refresh after restore-item: ${JSON.stringify(s)}`);

  // close via the ×
  chk(await click('[data-rc-close]'), 'close button not found');
  await wait(250);
  s = await snap();
  chk(!s.popOpen, `popup did not close on ×: ${JSON.stringify(s)}`);

  console.log('PAGE_ERRORS', errs.length, errs.slice(0, 2).join(' | '));
  if (errs.length) fails.push('page errors: ' + errs.length);
  await b.close();
  if (fails.length) { console.log('FAIL', JSON.stringify(fails)); process.exit(1); }
  console.log('PASS — trigger opens; Restore (save + item) works and refreshes the popup; × closes');
})();
