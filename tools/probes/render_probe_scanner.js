// tools/probes/render_probe_scanner.js — headless mount check for the Scanner surface (rail item 3).
//
// Usage: node tools/probes/render_probe_scanner.js   (exit 0 = PASS, non-zero = FAIL)
//
// Verifies the Scanner workspace mounts as the Scan·Confirm·Result design: navigates to
// the scanner rail item, scopes queries to #workspace-scanner-mount, and asserts the .vd
// idle shell rendered — the Scan step (.vd-step--scan) with its New Scan button + drop
// zone — AND that the retired in-content stepper strip (.vd-flow) is ABSENT: each step is
// carried by its own .vd-step block, so a separate strip would be a second copy of the same
// state, free to drift. (.vd-flow rules survive in workspace-scanner.css with no emitter —
// that CSS is dead.) No page errors. Mirrors render_probe.js.
//
// IT ALSO DRIVES THE HAND-ENTRY PATH, because three things about it are invisible to any
// static gate:
//   1. GEOMETRY. "New Scan, slightly less tall, with a hand-entry link under it" is delivered
//      by ONE rule — .vd-newscan-wrap making the button share a stretched row with the link.
//      Drop the wrapper, or restore `flex: 0 0 auto`, and the button silently returns to the
//      drop zone's full height with the link floating loose. Nothing else would notice.
//   2. THE COPY FORK. Hand-entry reuses the Confirm step, so every "what we read" line has to
//      flip to "what you entered". A regression here does not throw — it just tells the user
//      we read a label that was never photographed.
//   3. THE PROVENANCE. Adopting a hand-entry must mint user_typed, or state/coverage's
//      auto-heal replaces the user's own typed amounts with sealed vault composition the
//      moment the name they typed matches a product. That failure is silent by construction:
//      no error, no mark, just a different number.
//   4. LONG-FORM UNITS. Someone typing "micrograms" must land on exactly the same verdict as
//      someone typing "mcg". This is checked as an EQUIVALENCE between two runs rather than
//      against a hard-coded hit count, so it stays true when a Wallach target changes. Before
//      core/units::canonicalUnit the long form returned null out of state/scanner's normalize
//      and the nutrient dropped out of the hit count with nothing on screen to say so.

const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

const sleep = ms => new Promise(r => setTimeout(r, ms));

// A real vault product name: typing it is what arms the auto-heal trap. Its sealed calcium is
// far above the token amount below, so a heal would be unmistakable in the stored item.
const VAULT_NAME = 'Beyond Osteo FX™ Powder';
const TYPED_MG = 7;

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100 });
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));

  const url = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.log('GOTO_ERR', e.message));
  await sleep(1600);

  const clicked = await page.evaluate(() => {
    const btn = document.querySelector('[data-rail-nav="scanner"]');
    if (!btn) return false;
    btn.click();
    return true;
  });
  await sleep(800);

  const info = await page.evaluate(() => {
    const mount = document.getElementById('workspace-scanner-mount');
    const inMount = s => (mount ? mount.querySelectorAll(s).length : -1);
    const mountVisible = mount ? getComputedStyle(mount).display !== 'none' : false;
    // Layout guard: the ingredients box (.vd-paste) must render FULL-WIDTH BELOW the upload zone
    // (.vd-drop), never beside it. The only thing holding it there is `flex: 1 1 100%` in
    // workspace-scanner.css; drop that and a content change can shrink it into a side column.
    const drop = mount ? mount.querySelector('.vd-drop') : null;
    const paste = mount ? mount.querySelector('.vd-paste') : null;
    let pasteBelowDrop = null, pasteFullWidth = null;
    if (drop && paste) {
      const dr = drop.getBoundingClientRect(), pr = paste.getBoundingClientRect();
      pasteBelowDrop = pr.top >= dr.bottom - 2;
      pasteFullWidth = pr.width >= dr.width - 4;
    }
    // The hand-entry pairing: the link sits UNDER the button, and the button is shorter than
    // the drop zone it used to match exactly. Both come from .vd-newscan-wrap.
    const btn = mount ? mount.querySelector('.vd-newscan') : null;
    const link = mount ? mount.querySelector('.vd-manual') : null;
    let linkUnderButton = null, buttonShortenedBy = null;
    if (btn && link && drop) {
      const br = btn.getBoundingClientRect(), lr = link.getBoundingClientRect(), dr = drop.getBoundingClientRect();
      linkUnderButton = lr.top >= br.bottom - 1;
      buttonShortenedBy = +(dr.height - br.height).toFixed(1);
    }
    return {
      mountExists: !!mount,
      mountVisible,
      vd: inMount('.vd'),
      scanStep: inMount('.vd-step--scan'),
      dropZone: inMount('.vd-drop'),
      newScan: inMount('.vd-newscan'),
      manualLink: inMount('.vd-manual'),
      stepBadge: inMount('.vd-step__badge'),
      stepper: inMount('.vd-flow'),
      pasteBelowDrop,
      pasteFullWidth,
      linkUnderButton,
      buttonShortenedBy,
    };
  });

  console.log('SCANNER', JSON.stringify(info));

  // ── Hand-entry: link → Confirm (blank grid, no photo panel, no "what we read") ──
  await page.evaluate(() => document.querySelector('.vd-manual').click());
  await sleep(500);
  const hand = await page.evaluate(() => {
    const mount = document.getElementById('workspace-scanner-mount');
    const text = mount ? mount.textContent : '';
    const nameEl = mount ? mount.querySelector('[data-sc-name]') : null;
    return {
      confirmStep: mount ? mount.querySelectorAll('.vd-step--hero').length : -1,
      blankRows: mount ? mount.querySelectorAll('.vd-nrow[data-nrow]').length : -1,
      nameEmpty: nameEl ? nameEl.value === '' : null,
      // No photo was taken, so no photo panel -- but its column stays reserved, so a nutrient
      // row is the same width here as it is on a scan. Measured as "the row FILLS the edit
      // column": if the column ever collapses to full width, or the row is capped short of it,
      // the two stop agreeing and hand-entry silently becomes a different size than a scan.
      photoPanels: mount ? mount.querySelectorAll('.vd-cf__ref').length : -1,
      rowFillsColumn: (() => {
        const row = mount && mount.querySelector('.vd-nrow__main');
        const col = mount && mount.querySelector('.vd-cf__edits');
        if (!row || !col) return null;
        return Math.abs(row.getBoundingClientRect().width - col.getBoundingClientRect().width) <= 1;
      })(),
      photoColumnReserved: (() => {
        const grid = mount && mount.querySelector('.vd-cf__grid');
        if (!grid) return null;
        // Two tracks even with no photo to put in the second one -- that reservation is what
        // makes a hand-entry the same width as a scan.
        return getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length === 2;
      })(),
      // The copy fork: nothing may claim a read on a surface where nothing was read.
      claimsARead: /what we read|decoded locally|OCR is imperfect/.test(text),
      saysEntered: /what you entered/.test(text),
    };
  });
  console.log('HAND_ENTRY', JSON.stringify(hand));

  // ── Type a vault-named item, judge it, adopt it, and read what actually landed ──
  await page.evaluate((nm, mg) => {
    const mount = document.getElementById('workspace-scanner-mount');
    const set = (sel, v) => {
      const el = mount.querySelector(sel);
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    set('[data-sc-name]', nm);
    set('.vd-edit[data-nedit="0"]', 'Calcium');
    set('[data-aedit="0"]', String(mg));
    set('[data-uedit="0"]', 'mg');
  }, VAULT_NAME, TYPED_MG);
  await sleep(400);
  await page.evaluate(() => document.querySelector('[data-sc-confirm]').click());
  await sleep(700);
  await page.evaluate(() => document.querySelector('[data-sc-adopt]').click());
  await sleep(700);

  // ── The same entry, spelled two ways, must reach the same verdict ──────────────
  const spellingRun = async (unit) => {
    await page.evaluate(() => {
      const b = document.querySelector('[data-sc-reject]') || document.querySelector('[data-sc-clear]');
      if (b) b.click();
    });
    await sleep(400);
    await page.evaluate(() => document.querySelector('.vd-manual').click());
    await sleep(400);
    await page.evaluate((u) => {
      const mount = document.getElementById('workspace-scanner-mount');
      const set = (sel, v) => {
        const el = mount.querySelector(sel);
        el.value = v;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      };
      set('[data-sc-name]', 'Spelling Probe');
      set('.vd-edit[data-nedit="0"]', 'Selenium');
      set('[data-aedit="0"]', '100');
      set('[data-uedit="0"]', u);
    }, unit);
    await sleep(300);
    const shown = await page.evaluate(() => {
      const mount = document.getElementById('workspace-scanner-mount');
      return mount.querySelector('[data-uedit="0"]').value;
    });
    await page.evaluate(() => document.querySelector('[data-sc-confirm]').click());
    await sleep(600);
    const hits = await page.evaluate(() => {
      const el = document.querySelector('#workspace-scanner-mount .vd-cov-gnum');
      return el ? Number(el.textContent.trim()) : -1;
    });
    return { shown, hits };
  };
  const abbrev = await spellingRun('mcg');
  const longform = await spellingRun('micrograms');
  console.log('UNIT_SPELLING', JSON.stringify({ abbrev, longform }));

  const adopted = await page.evaluate((nm) => {
    const doc = JSON.parse(localStorage.getItem('rgSlots_v1') || '{}');
    const slot = (doc.slots || []).find(s => s && s.id === doc.activeSlot) || (doc.slots || [])[0];
    const it = ((slot && slot.items) || []).find(i => i.label && i.label.name === nm);
    if (!it) return { found: false };
    const cal = (it.label.nutrients || []).find(n => n.name === 'Calcium');
    return { found: true, provenance: it.provenance, calcium: cal ? cal.amount : null };
  }, VAULT_NAME);
  console.log('ADOPTED', JSON.stringify(adopted));
  console.log('PAGE_ERRORS', pageErrors.length, pageErrors.slice(0, 5).join(' | '));

  const checks = [
    ['rail nav reached the scanner', clicked],
    ['mount exists + visible', info.mountExists && info.mountVisible],
    ['idle shell rendered', info.vd >= 1 && info.scanStep >= 1 && info.dropZone >= 1 && info.stepBadge >= 1],
    ['New Scan button present', info.newScan >= 1],
    ['hand-entry link present', info.manualLink === 1],
    ['link sits under the button', info.linkUnderButton === true],
    ['button shorter than the drop zone', info.buttonShortenedBy > 0],
    ['no in-content stepper strip', info.stepper === 0],
    ['ingredients box below the drop zone', info.pasteBelowDrop === true],
    ['ingredients box full width', info.pasteFullWidth === true],
    ['hand-entry opens Confirm', hand.confirmStep === 1],
    ['one blank row to type into', hand.blankRows === 1],
    ['name field starts empty', hand.nameEmpty === true],
    ['no photo panel without a photo', hand.photoPanels === 0],
    ['the row fills the edit column', hand.rowFillsColumn === true],
    ['the photo column stays reserved with no photo', hand.photoColumnReserved === true],
    ['nothing claims a read', hand.claimsARead === false],
    ['copy says "what you entered"', hand.saysEntered === true],
    ['adopted item landed', adopted.found === true],
    ['minted user_typed', adopted.provenance === 'user_typed'],
    ['kept the TYPED amount, not the vault composition', adopted.calcium === TYPED_MG],
    ['"mcg" hits at least one essential (the check is not vacuous)', abbrev.hits >= 1],
    ['"micrograms" reaches the SAME verdict as "mcg"', longform.hits === abbrev.hits],
    ['the long form is shown back as its abbreviation', longform.shown === 'mcg'],
    ['no page errors', pageErrors.length === 0],
  ];
  const failed = checks.filter(c => !c[1]);
  for (const [name, ok] of checks) {
    if (!ok) console.log('  FAIL ·', name);
  }
  console.log(failed.length === 0
    ? 'PASS · scanner mounts Scan·Confirm·Result; hand-entry opens Confirm with honest copy and adopts as user_typed keeping its own amounts'
    : 'FAIL · ' + failed.length + ' scanner check(s) failed');
  await browser.close();
  process.exit(failed.length === 0 ? 0 : 1);
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
