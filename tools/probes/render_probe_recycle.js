// render_probe_recycle.js — the recycle bin: migration (no loss), delete→save-bin, restore
// slot (non-full + replace-when-full), restore item (origin + orphan→active), and the ring caps.
// Drives the real window.* slot bridges. NEGATIVE CONTROLS baked into the asserts.
const path = require('path');
const REPO = require('path').resolve(__dirname, '..', '..');
let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* next */ }
}
if (!pup) { console.log('NO_PUPPETEER'); process.exit(2); }
const wait = ms => new Promise(r => setTimeout(r, ms));

const item = (id, name) => ({ id, label: { name, nutrients: [{ name: 'Zinc' }] }, addedDate: '2026-08-15', provenance: 'user_manual' });
const slot = (id, name, colour, items) => ({ id, name, items: items || [], overrides: {}, createdAt: '2026-08-15', editedAt: '2026-08-15', colour, goals: [] });

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  const url = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate(() => localStorage.setItem('wallachUserProfile_v1', JSON.stringify({ name: 'L', browsing: false, chosenAt: '2026-07-15' })));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await wait(1000);

  // set a raw doc, then read it back through the migrating loader
  const load = (doc) => page.evaluate((d) => { localStorage.setItem('rgSlots_v1', JSON.stringify(d)); return window.loadSlots(); }, doc);
  const call = (fn, ...args) => page.evaluate((f, a) => window[f](...a), fn, args);
  const get = () => page.evaluate(() => window.loadSlots());
  const fails = [];
  const chk = (cond, msg) => { if (!cond) fails.push(msg); };

  // ── 1. MIGRATION: v1 doc (6 trash items, NO slotTrash, NO slotName) → v2, no loss beyond the cap ──
  const v1trash = [];
  for (let i = 0; i < 6; i++) v1trash.push({ item: item(500 + i, 'Old' + i), slotId: 'default', removedAt: '2026-08-1' + i });
  let d = await load({ version: 1, slots: [slot('default', 'Main', '#ff7e3c', [])], activeSlot: 'default', trash: v1trash });
  chk(Array.isArray(d.slotTrash) && d.slotTrash.length === 0, `mig: slotTrash not []: ${JSON.stringify(d.slotTrash)}`);
  chk(d.trash.length === 4, `mig: item bin not capped to 4: ${d.trash.length}`);
  chk(d.trash.every(e => e.slotName === 'Main'), `mig: slotName not backfilled`);

  // ── 2. DELETE a save → save bin (whole snapshot), then RESTORE (non-full) ──
  await load({ version: 1, slots: [slot('default', 'Main', '#ff7e3c', []), slot('trip', 'Trip', '#2b6fb0', [item(9, 'X')])], activeSlot: 'default', trash: [], slotTrash: [] });
  await call('deleteSlot', 'trip');
  d = await get();
  chk(d.slots.length === 1 && !d.slots.some(s => s.id === 'trip'), `del: trip still a live slot`);
  chk(d.slotTrash.length === 1 && d.slotTrash[0].slot.id === 'trip' && d.slotTrash[0].slot.items.length === 1, `del: trip not snapshotted whole into the save bin`);
  const key = d.slotTrash[0].deletedAt;
  const r2 = await call('restoreDeletedSlot', key);
  d = await get();
  chk(r2 && r2.ok === true, `restore-slot: not ok: ${JSON.stringify(r2)}`);
  chk(d.slots.some(s => s.id === 'trip') && d.activeSlot === 'trip' && d.slotTrash.length === 0, `restore-slot: trip not back+active+out-of-bin`);

  // ── 3. RESTORE ITEM: origin (exists) + orphan (origin gone → active) ──
  await load({ version: 1, activeSlot: 'default', slotTrash: [],
    slots: [slot('default', 'Main', '#ff7e3c', [])],
    trash: [{ item: item(601, 'FromMain'), slotId: 'default', slotName: 'Main', removedAt: '2026-08-15' },
            { item: item(602, 'Orphan'), slotId: 'ghost', slotName: 'Gone', removedAt: '2026-08-15' }] });
  await call('restoreDeletedItem', 601);
  await call('restoreDeletedItem', 602);
  d = await get();
  const main = d.slots.find(s => s.id === 'default');
  chk(main.items.some(i => i.id === 601), `restore-item: origin item not restored to Main`);
  chk(main.items.some(i => i.id === 602), `restore-item: orphan not restored to active`);
  chk(d.trash.length === 0, `restore-item: bin not emptied: ${d.trash.length}`);

  // ── 4. REPLACE-WHEN-FULL: 4 slots + 1 in bin → refuse w/o replace, then swap ──
  await load({ version: 1, activeSlot: 's1', trash: [],
    slots: [slot('s1', 'S1', '#ff7e3c', []), slot('s2', 'S2', '#2b6fb0', []), slot('s3', 'S3', '#5aa82c', []), slot('s4', 'S4', '#8a4fae', [])],
    slotTrash: [{ slot: slot('binned', 'Binned', '#c8781a', [item(70, 'Y')]), deletedAt: '2026-08-14' }] });
  const rNo = await call('restoreDeletedSlot', '2026-08-14');
  chk(rNo && rNo.ok === false, `replace: full restore w/o a target should refuse`);
  const rYes = await call('restoreDeletedSlot', '2026-08-14', 's2');
  d = await get();
  chk(rYes && rYes.ok === true, `replace: swap not ok: ${JSON.stringify(rYes)}`);
  chk(d.slots.length === 4 && d.slots.some(s => s.id === 'binned') && !d.slots.some(s => s.id === 's2'), `replace: binned not swapped in for s2`);
  chk(d.slotTrash.some(e => e.slot.id === 's2'), `replace: replaced save s2 not moved to the bin`);

  // ── 5. CAPS: save bin holds 7 (oldest drops); item bin holds 4 ──
  const seven = [];
  for (let i = 0; i < 7; i++) seven.push({ slot: slot('old' + i, 'Old' + i, '#2b6fb0', []), deletedAt: '2026-08-0' + i });
  await load({ version: 1, activeSlot: 'a', trash: [],
    slots: [slot('a', 'A', '#ff7e3c', []), slot('b', 'B', '#2b6fb0', [])], slotTrash: seven });
  await call('deleteSlot', 'b');
  d = await get();
  chk(d.slotTrash.length === 7 && d.slotTrash[0].slot.id === 'b', `caps: save bin not ring-capped at 7 newest-first`);

  await load({ version: 1, activeSlot: 'a', slotTrash: [],
    slots: [slot('a', 'A', '#ff7e3c', [item(1, 'i1'), item(2, 'i2'), item(3, 'i3'), item(4, 'i4'), item(5, 'i5')])],
    trash: [] });
  await page.evaluate(() => window.saveRgRemoved(new Set([1, 2, 3, 4, 5])));
  d = await get();
  chk(d.trash.length === 4, `caps: item bin not ring-capped at 4: ${d.trash.length}`);

  console.log('PAGE_ERRORS', errs.length, errs.slice(0, 3).join(' | '));
  if (errs.length) fails.push(`page errors: ${errs.length}`);
  await browser.close();
  if (fails.length) { console.log('FAIL', JSON.stringify(fails, null, 1)); process.exit(1); }
  console.log('PASS — migration (no loss), delete→save-bin, restore slot (+replace-when-full), restore item (origin+orphan), ring caps 7/4');
})();
