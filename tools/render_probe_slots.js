// tools/render_probe_slots.js — P3 slot-system RUNTIME probe.
//
// Usage: node tools/render_probe_slots.js
//
// slot_invariants (the static gate) proves the guard CODE exists; this probe proves it RUNS
// correctly on the real file:// app — the half a Python-reads-TS gate cannot observe. It drives
// the §31 slot ops through the window.* bridges (installed by main.ts::bootstrap → installBridges,
// which was dead code until P3) and asserts the blueprint §3 invariants:
//
//   1. there is always >= 1 slot          — a fresh boot has exactly the Default slot;
//   2. activeSlot always resolves          — after deleting the active slot it points at a survivor;
//   3. <= 4 slots, 5th refused WITH a reason (never a silent drop);
//   4. deleting the active slot promotes the lowest-numbered survivor;
//   1'. the last slot cannot be deleted     — refused with a reason.
//
// Plus a trash round-trip (saveRgRemoved → restoreFromTrash) proving the remove-to-trash adapter
// and restore path end-to-end. Exits non-zero on any mismatch. Requires puppeteer.

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

  // Start from a clean origin so the migration builds a fresh Default slot.
  await page.evaluateOnNewDocument(() => {
    try { localStorage.clear(); } catch (e) { window.__clearErr = String(e); }
  });

  const url = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.log('GOTO_ERR', e.message));
  await new Promise(r => setTimeout(r, 1500));

  const info = await page.evaluate(() => {
    const w = window;
    if (typeof w.addSlot !== 'function' || typeof w.loadSlots !== 'function') {
      return { bridgesInstalled: false };
    }
    const active = (doc) => doc.slots.find(s => s.id === doc.activeSlot);
    const itemCount = (doc) => { const a = active(doc); return a ? a.items.length : -1; };

    const r = { bridgesInstalled: true };

    // Fresh boot: exactly one Default slot, active + resolving.
    const start = w.loadSlots();
    r.startSlots = start.slots.length;
    r.startActiveResolves = !!active(start);
    r.startDefaultName = start.slots[0] && start.slots[0].name;

    // Add up to the cap.
    const a1 = w.addSlot('Cutting');
    const a2 = w.addSlot('Bulking');
    const a3 = w.addSlot('Travel');
    r.after3 = w.loadSlots().slots.length;
    r.addIds = [a1.slotId, a2.slotId, a3.slotId];
    r.addsOk = a1.ok === true && a2.ok === true && a3.ok === true;

    // The 5th add is refused WITH a reason (never a silent drop).
    const a5 = w.addSlot('Fifth');
    r.fifthRefused = a5.ok === false;
    r.fifthReason = a5.ok === false ? a5.reason : null;
    r.after5 = w.loadSlots().slots.length;

    // Switch to a created slot, then delete THAT (the active) slot → promotion.
    const sw = w.setActiveSlot(a1.slotId);
    r.switchOk = sw.ok === true;
    r.activeBeforeDelete = w.loadSlots().activeSlot;
    const delActive = w.deleteSlot(a1.slotId);
    r.delActiveOk = delActive.ok === true;
    const afterDel = w.loadSlots();
    r.afterDelSlots = afterDel.slots.length;
    r.activeAfterDelete = afterDel.activeSlot;
    r.activeAfterDeleteResolves = !!active(afterDel);
    r.promotedToFirstSurvivor = afterDel.activeSlot === afterDel.slots[0].id;
    r.deletedIsGone = !afterDel.slots.some(s => s.id === a1.slotId);

    // Delete down to one, then the last delete is refused.
    let doc = w.loadSlots();
    while (doc.slots.length > 1) {
      const victim = doc.slots.find(s => s.id !== doc.activeSlot) || doc.slots[0];
      w.deleteSlot(victim.id);
      doc = w.loadSlots();
    }
    r.downToOne = doc.slots.length;
    const delLast = w.deleteSlot(doc.slots[0].id);
    r.lastRefused = delLast.ok === false;
    r.lastReason = delLast.ok === false ? delLast.reason : null;
    r.afterLastAttempt = w.loadSlots().slots.length;

    // Trash round-trip on the surviving (active) slot.
    const item = { id: 77001, label: { name: 'Probe Item', nutrients: [] }, addedDate: '2026-07-16', provenance: 'user_manual' };
    w.saveRgManual([item]);
    r.itemsAfterAdd = itemCount(w.loadSlots());
    w.saveRgRemoved(new Set([77001]));
    const afterRemove = w.loadSlots();
    r.itemsAfterRemove = itemCount(afterRemove);
    r.trashHasItem = afterRemove.trash.some(e => e.item.id === 77001);
    const restored = w.restoreFromTrash(77001);
    r.restoreOk = restored.ok === true;
    const afterRestore = w.loadSlots();
    r.itemsAfterRestore = itemCount(afterRestore);
    r.trashEmptyAfterRestore = afterRestore.trash.length === 0;

    return r;
  });

  console.log('SLOTS', JSON.stringify(info));
  console.log('PAGE_ERRORS', pageErrors.length, pageErrors.slice(0, 2).join(' | '));

  if (info.bridgesInstalled !== true) {
    await browser.close();
    console.log('FAIL · window.* slot bridges not installed — main.ts::bootstrap must call installBridges()');
    process.exit(1);
  }

  const checks = [
    ['fresh boot has exactly 1 slot (invariant 1: always >=1)', info.startSlots === 1],
    ['fresh boot activeSlot resolves', info.startActiveResolves === true],
    ['the fresh slot is named Default', info.startDefaultName === 'Default'],
    ['three adds reach 4 slots', info.after3 === 4],
    ['all three adds returned ok', info.addsOk === true],
    ['the 5th add is REFUSED (invariant 3: <=4)', info.fifthRefused === true],
    ['the 5th refusal carries a reason (never a silent drop)', typeof info.fifthReason === 'string' && info.fifthReason.length > 0],
    ['slot count stays 4 after the refused 5th', info.after5 === 4],
    ['setActiveSlot to a created slot succeeds', info.switchOk === true],
    ['deleting the active slot succeeds', info.delActiveOk === true],
    ['after active-delete there are 3 slots', info.afterDelSlots === 3],
    ['activeSlot resolves after active-delete (invariant 2)', info.activeAfterDeleteResolves === true],
    ['activeSlot promoted to the lowest-numbered survivor (invariant 4)', info.promotedToFirstSurvivor === true],
    ['the deleted slot is gone', info.deletedIsGone === true],
    ['deletes reach exactly 1 slot', info.downToOne === 1],
    ['the LAST slot delete is REFUSED (invariant 1)', info.lastRefused === true],
    ['the last-slot refusal carries a reason', typeof info.lastReason === 'string' && info.lastReason.length > 0],
    ['slot count stays 1 after the refused last delete', info.afterLastAttempt === 1],
    ['saveRgManual added 1 item to the active slot', info.itemsAfterAdd === 1],
    ['saveRgRemoved emptied the active slot', info.itemsAfterRemove === 0],
    ['the removed item is in the trash', info.trashHasItem === true],
    ['restoreFromTrash succeeds', info.restoreOk === true],
    ['the restored item is back in the active slot', info.itemsAfterRestore === 1],
    ['the trash is empty after restore', info.trashEmptyAfterRestore === true],
    ['no page errors', pageErrors.length === 0],
  ];
  const failed = checks.filter(([, ok]) => !ok).map(([n]) => n);
  await browser.close();
  if (failed.length) { console.log('FAIL', JSON.stringify(failed)); process.exit(1); }
  console.log('PASS · slots: >=1 always · <=4 refused-with-reason · active-delete promotes · last refused · trash round-trip');
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
