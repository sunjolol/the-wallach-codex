// #8a — slot delete now takes a two-step confirm. Drives the REAL tile trash icon.
// Negative control: pre-fix, the first trash click deleted immediately (slots→1); this
// asserts slots STAY 2 after the first click (confirm shown, not deleted).
const path = require('path');
const REPO = require('path').resolve(__dirname, '..');
let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* next */ }
}
if (!pup) { console.log('NO_PUPPETEER'); process.exit(2); }
const wait = ms => new Promise(r => setTimeout(r, ms));

const mkItem = (id, name) => ({ id, label: { name, nutrients: [{ name: 'Zinc' }] }, addedDate: '2026-08-15', provenance: 'user_manual' });
const TWO_SLOTS = {
  version: 1,
  slots: [
    { id: 'default', name: 'Main', items: [mkItem(1, 'Beyond Tangy Tangerine')], overrides: {}, createdAt: '2026-08-15', editedAt: '2026-08-15', colour: '#ff7e3c', goals: [] },
    { id: 'trip', name: 'Trip', items: [mkItem(2, 'Osteo FX')], overrides: {}, createdAt: '2026-08-15', editedAt: '2026-08-15', colour: '#2b6fb0', goals: [] },
  ],
  activeSlot: 'default', trash: [],
};

const state = page => page.evaluate(() => {
  const doc = window.loadSlots ? window.loadSlots() : null;
  return {
    slots: doc ? doc.slots.length : null,
    trip: doc ? doc.slots.some(s => s.id === 'trip') : null,
    confirm: document.querySelectorAll('.ck-slot__confirm').length,
    q: document.querySelector('.ck-slot__confirm-q')?.textContent ?? null,
    sub: document.querySelector('.ck-slot__confirm-sub')?.textContent ?? null,
    tripInBin: doc ? (doc.slotTrash || []).some(e => e.slot.id === 'trip') : null,
  };
});
const click = (page, sel) => page.evaluate(s => { const el = document.querySelector(s); if (el) { el.click(); return true; } return false; }, sel);

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1024, deviceScaleFactor: 2 });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  const url = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate((doc) => { localStorage.setItem('wallachUserProfile_v1', JSON.stringify({ name: 'Luneth', browsing: false, chosenAt: '2026-07-15' })); localStorage.setItem('rgSlots_v1', JSON.stringify(doc)); }, TWO_SLOTS);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await wait(1000);
  await page.evaluate(() => document.querySelector('[data-rail-nav="regimen"]')?.click());
  await wait(900);

  const fails = [];
  const s0 = await state(page);
  if (s0.slots !== 2) fails.push(`start: slots=${s0.slots}, expected 2`);

  // 1) click trash on 'trip' → confirm shows, NOT deleted
  if (!(await click(page, '[data-slot="trip"] [data-slot-delete]'))) fails.push('trip trash button not found');
  await wait(300);
  const s1 = await state(page);
  if (s1.confirm !== 1) fails.push(`after trash click: confirm overlays=${s1.confirm}, expected 1`);
  if (s1.slots !== 2) fails.push(`after trash click: slots=${s1.slots}, expected 2 (NOT deleted on first click — pre-fix would be 1)`);
  if (s1.q !== 'Delete this save?') fails.push(`confirm question=${JSON.stringify(s1.q)}`);
  if (s1.sub !== '1 item → Trash') fails.push(`confirm sub=${JSON.stringify(s1.sub)}`);

  // 2) cancel → overlay gone, still 2 slots
  if (!(await click(page, '[data-slot-confirm-cancel]'))) fails.push('cancel button not found');
  await wait(250);
  const s2 = await state(page);
  if (s2.confirm !== 0) fails.push(`after cancel: confirm overlays=${s2.confirm}, expected 0`);
  if (s2.slots !== 2) fails.push(`after cancel: slots=${s2.slots}, expected 2`);

  // 3) trash again → confirm → Delete → slot gone, item in trash
  await click(page, '[data-slot="trip"] [data-slot-delete]');
  await wait(300);
  if (!(await click(page, '[data-slot-confirm-do]'))) fails.push('delete (confirm) button not found');
  await wait(400);
  const s3 = await state(page);
  if (s3.slots !== 1) fails.push(`after confirm-delete: slots=${s3.slots}, expected 1`);
  if (s3.trip !== false) fails.push(`after confirm-delete: 'trip' still present`);
  if (s3.tripInBin !== true) fails.push(`after confirm-delete: 'trip' save not in the recycle bin (slotTrash)`);

  console.log('S1', JSON.stringify(s1));
  console.log('S3', JSON.stringify(s3));
  console.log('PAGE_ERRORS', errs.length, errs.slice(0, 3).join(' | '));
  if (errs.length) fails.push(`page errors: ${errs.length}`);
  await browser.close();
  if (fails.length) { console.log('FAIL', JSON.stringify(fails)); process.exit(1); }
  console.log('PASS — slot delete takes a confirm; Cancel keeps, Delete removes (save → recycle bin)');
})();
