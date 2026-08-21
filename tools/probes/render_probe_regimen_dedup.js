// tools/probes/render_probe_regimen_dedup.js — a re-added product bumps its dose,
// it does NOT append a second row (which coverage.accumulate would sum into a phantom
// double-count on the 90-field).
//
// Usage: node tools/probes/render_probe_regimen_dedup.js   (exit 0 = PASS, non-zero = FAIL)
//
// WHY THIS EXISTS: views/regimen.ts (typeahead/rec add) and views/scanner.ts (adopt)
// both appended a fresh item with a new Date.now() id on every add, so adding the same
// product twice made TWO rows. views/coverage.ts::addVaultProduct
// already deduped-and-bumped; all three now route through the shared state helper
// state/regimen.ts::addOrBumpRegimenItem. This drives the REAL typeahead twice and
// asserts one row + a 1→2 dose bump. NEGATIVE CONTROL: on the pre-fix bundle the second
// add appended, so rows/items would be 2 — a static read could not tell the difference.

const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* next */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }
const wait = ms => new Promise(r => setTimeout(r, ms));

const EMPTY_SLOT = {
  version: 1,
  slots: [{ id: 'default', name: 'My Regimen', items: [], overrides: {},
    createdAt: '2026-08-15', editedAt: '2026-08-15', colour: '#ff7e3c', goals: [] }],
  activeSlot: 'default', trash: [],
};

const typeAndAdd = async (page, query) => {
  await page.evaluate((q) => {
    const inp = document.querySelector('[data-add-input]');
    if (inp) { inp.value = q; inp.dispatchEvent(new Event('input', { bubbles: true })); }
  }, query);
  await wait(250);
  const clicked = await page.evaluate(() => {
    const b = document.querySelector('[data-ta-add]');
    if (b) { b.click(); return true; }
    return false;
  });
  await wait(500); // let regimen:changed re-render
  return clicked;
};

const snapshot = page => page.evaluate(() => {
  const doc = window.loadSlots ? window.loadSlots() : null;
  const slot = doc ? doc.slots.find(s => s.id === doc.activeSlot) : null;
  const firstId = slot && slot.items[0] ? String(slot.items[0].id) : null;
  const ov = slot && firstId ? slot.overrides[firstId] : null;
  return {
    rows: document.querySelectorAll('.rr-row').length,
    dose: document.querySelector('.rr-dose__n')?.textContent ?? null,
    items: slot ? slot.items.length : null,
    scaling: ov ? ov.scaling_factor ?? null : null,
  };
});

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1024 });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));

  const url = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate((doc) => {
    localStorage.setItem('wallachUserProfile_v1', JSON.stringify({ name: 'Luneth', browsing: false, chosenAt: '2026-07-15' }));
    localStorage.setItem('rgSlots_v1', JSON.stringify(doc));
  }, EMPTY_SLOT);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await wait(1000);
  await page.evaluate(() => document.querySelector('[data-rail-nav="regimen"]')?.click());
  await wait(900);

  const fails = [];
  if (!(await typeAndAdd(page, 'beyond tangy'))) fails.push('first typeahead Add button not found');
  const s1 = await snapshot(page);
  if (s1.rows !== 1) fails.push(`after 1st add: rows=${s1.rows}, expected 1`);
  if (s1.items !== 1) fails.push(`after 1st add: items=${s1.items}, expected 1`);
  if (s1.dose !== '1') fails.push(`after 1st add: dose=${s1.dose}, expected 1`);

  if (!(await typeAndAdd(page, 'beyond tangy'))) fails.push('second typeahead Add button not found');
  const s2 = await snapshot(page);
  if (s2.rows !== 1) fails.push(`after 2nd add: rows=${s2.rows}, expected 1 (DEDUP — pre-fix would be 2)`);
  if (s2.items !== 1) fails.push(`after 2nd add: items=${s2.items}, expected 1 (no phantom double-count)`);
  if (s2.dose !== '2') fails.push(`after 2nd add: dose=${s2.dose}, expected 2 (BUMP)`);
  if (s2.scaling !== 2) fails.push(`after 2nd add: override scaling_factor=${s2.scaling}, expected 2`);

  console.log('S1', JSON.stringify(s1));
  console.log('S2', JSON.stringify(s2));
  console.log('PAGE_ERRORS', errs.length, errs.slice(0, 3).join(' | '));
  if (errs.length) fails.push(`page errors: ${errs.length}`);

  await browser.close();
  if (fails.length) { console.log('FAIL', JSON.stringify(fails)); process.exit(1); }
  console.log('PASS — re-add dedups to one row and bumps dose 1→2 (no double-count)');
})();
