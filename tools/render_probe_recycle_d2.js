// recycle D2 "Replace a save" — restoring a bin save at 4/4 opens the replace step, a pick updates
// the summary, back/Esc return to D1, and Replace & restore performs the swap (chosen → bin, saved
// one → live). UI-only feature over the batch-1 state op (restoreDeletedSlot with a replaceSlotId).
const path = require('path');
const REPO = require('path').resolve(__dirname, '..');
let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) {}
}
if (!pup) { console.log('NO_PUPPETEER'); process.exit(2); }
const wait = ms => new Promise(r => setTimeout(r, ms));
const slot = (id, name, items, colour) => ({ id, name, items: items || [], overrides: {}, createdAt: '2026-08-10', editedAt: '2026-08-15', colour: colour || '#ff7e3c', goals: [] });
const item = (id, name) => ({ id, label: { name, nutrients: [{ name: 'Zinc' }] }, addedDate: '2026-08-15', provenance: 'user_manual' });

(async () => {
  const b = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await b.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/'), { waitUntil: 'domcontentloaded', timeout: 30000 });
  const now = Date.now(); const ago = m => new Date(now - m * 60000).toISOString();
  const doc = {
    version: 1, activeSlot: 'main',
    slots: [
      slot('main', 'Main', [item(1, 'A')], '#ff7e3c'),
      slot('base', 'Baseline', [item(2, 'B')], '#8a4fae'),
      slot('bulk', 'Bulk', [item(3, 'C')], '#2b6fb0'),
      slot('wint', 'Winter', [item(4, 'D')], '#5aa82c'),
    ],
    trash: [],
    slotTrash: [{ slot: slot('trip', 'Trip', [item(11, 'E')], '#2b6fb0'), deletedAt: ago(2) }],
  };
  await page.evaluate((d) => { localStorage.setItem('wallachUserProfile_v1', JSON.stringify({ name: 'L', browsing: false, chosenAt: '2026-07-15' })); localStorage.setItem('rgSlots_v1', JSON.stringify(d)); }, doc);
  await page.reload({ waitUntil: 'domcontentloaded' }); await wait(1000);
  await page.evaluate(() => document.querySelector('[data-rail-nav="regimen"]')?.click()); await wait(800);

  const click = sel => page.evaluate(s => { const el = document.querySelector(s); if (el) { el.click(); return true; } return false; }, sel);
  const clickRow = i => page.evaluate(n => { const r = document.querySelectorAll('.rc-rep-row')[n]; if (r) { r.click(); return true; } return false; }, i);
  const d2 = () => page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.rc-rep-row'));
    return {
      title: (document.querySelector('.rc-pop__title')?.textContent || '').trim(),
      note: !!document.querySelector('.rc-rep-note'),
      back: !!document.querySelector('.rc-pop__back'),
      foot: !!document.querySelector('.rc-pop__foot'),
      rows: rows.length,
      selIndex: rows.findIndex(r => r.classList.contains('is-sel')),
      selChecked: rows.filter(r => r.getAttribute('aria-checked') === 'true').length,
      names: rows.map(r => r.querySelector('.rc-rep-name')?.textContent || ''),
      summary: (document.querySelector('.rc-rep-summary')?.textContent || '').trim(),
      tiles: document.querySelectorAll('.rc-gtile').length,
    };
  });
  const store = () => page.evaluate(() => {
    const d = window.loadSlots();
    return {
      slots: d.slots.length,
      slotNames: d.slots.map(s => s.name),
      saveBin: (d.slotTrash || []).length,
      binNames: (d.slotTrash || []).map(e => e.slot.name),
      active: d.activeSlot,
    };
  });
  const fails = []; const chk = (c, m) => { if (!c) fails.push(m); };

  // Open the popup (D1), then Restore the bin save while all four slots are full → D2 opens.
  chk(await click('[data-rc-open]'), 'trigger not found');
  await wait(250);
  chk((await d2()).tiles === 1, 'D1 did not show the one bin save');
  chk(await click('.rc-gtile [data-rc-restore-slot]'), 'bin-save Restore not found');
  await wait(300);
  let s = await d2();
  chk(s.title === 'Replace a save', `D2 title: ${s.title}`);
  chk(s.note && s.back && s.foot, `D2 chrome missing: ${JSON.stringify({ note: s.note, back: s.back, foot: s.foot })}`);
  chk(s.rows === 4, `D2 rows: ${s.rows} (want 4)`);
  chk(s.tiles === 0, `D2 still shows D1 tiles: ${s.tiles}`);
  chk(s.selIndex === 0 && s.selChecked === 1, `default selection: idx=${s.selIndex} checked=${s.selChecked}`);
  chk(/Main/.test(s.summary) && /Trip/.test(s.summary), `summary#1: ${s.summary}`);

  // Pick the 3rd save (Bulk) → selection + summary follow.
  chk(await clickRow(2), 'row 2 not clickable');
  await wait(200);
  s = await d2();
  chk(s.selIndex === 2 && s.selChecked === 1, `after pick: idx=${s.selIndex} checked=${s.selChecked}`);
  chk(/Bulk/.test(s.summary) && /Trip/.test(s.summary), `summary#2: ${s.summary}`);

  // Back-arrow → D1 (rep rows gone, tiles back).
  chk(await click('[data-rc-back]'), 'back button not found');
  await wait(200);
  s = await d2();
  chk(s.rows === 0 && s.tiles === 1, `back did not return to D1: rows=${s.rows} tiles=${s.tiles}`);

  // Re-enter D2, Escape backs out to D1 (does NOT close the popup).
  chk(await click('.rc-gtile [data-rc-restore-slot]'), 're-open D2 failed');
  await wait(250);
  chk((await d2()).rows === 4, 'D2 did not re-open');
  await page.keyboard.press('Escape');
  await wait(200);
  s = await d2();
  const popOpen = await page.evaluate(() => { const h = document.querySelector('[data-rc-host]'); return !!h && !h.hidden; });
  chk(s.rows === 0 && s.tiles === 1 && popOpen, `Esc should back to D1 (still open): rows=${s.rows} tiles=${s.tiles} open=${popOpen}`);

  // Re-enter D2, pick Bulk (idx 2), Replace & restore → the swap.
  chk(await click('.rc-gtile [data-rc-restore-slot]'), 're-open D2 (2) failed');
  await wait(250);
  chk(await clickRow(2), 'row 2 not clickable (2)');
  await wait(150);
  chk(await click('[data-rc-replace]'), 'Replace & restore not found');
  await wait(400);
  const st = await store();
  chk(st.slots === 4, `after swap slots=${st.slots} (want 4)`);
  chk(st.slotNames.includes('Trip'), `restored save not live: ${JSON.stringify(st.slotNames)}`);
  chk(!st.slotNames.includes('Bulk'), `replaced save still live: ${JSON.stringify(st.slotNames)}`);
  chk(st.saveBin === 1 && st.binNames.includes('Bulk'), `bin should hold Bulk: ${JSON.stringify(st.binNames)}`);
  chk(!st.binNames.includes('Trip'), `Trip still in bin: ${JSON.stringify(st.binNames)}`);
  chk(st.active === 'main', `active changed unexpectedly: ${st.active}`);
  // Popup live-refreshed back to D1 showing the newly-binned save.
  s = await d2();
  chk(s.rows === 0 && s.tiles === 1, `after swap not on D1: rows=${s.rows} tiles=${s.tiles}`);

  console.log('PAGE_ERRORS', errs.length, errs.slice(0, 2).join(' | '));
  if (errs.length) fails.push('page errors: ' + errs.length);
  await b.close();
  if (fails.length) { console.log('FAIL', JSON.stringify(fails, null, 2)); process.exit(1); }
  console.log('PASS — D2 opens at 4/4; pick updates summary; back+Esc return to D1; Replace & restore swaps (chosen→bin, saved→live) and refreshes to D1');
})();
