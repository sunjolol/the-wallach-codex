// Guards the APPROVED food tile (design F, signed off 2026-08-21) in BOTH places it now
// exists: the signed-off record, across all 190 catalog foods, and the SHIPPED app.
//
// ★ WHY BOTH. The record is the spec and never changes; the app is what a person actually
// sees, and it was wired to that spec on 2026-08-22 with renamed classes (.fs-* rather than
// .lb-*, so a generic two-letter namespace does not enter a stylesheet that loads over every
// workspace). A probe that only read the record would go on passing for ever while the app
// drifted away from it -- which is the whole failure mode this file exists for.
//
// WHAT IT PROVES, and why each clause exists rather than being assumed:
//   1. never more than 7 essentials shown        - the owner's budget
//   2. never more than 3 chip rows               - and the "+N" may NEVER start a fourth
//   3. the "+N" equals what was actually dropped - a truncation that lies is worse than none
//   4. + and x render at ONE size                - they were 18px and 28px and looked wrong
//   5. each control is centred in its own cell   - the old + was a text glyph, optically off
//
// Clause 2 caught a real defect the eye could not: the fit first ran in FALLBACK-FONT metrics,
// so chips measured narrow, "fitted" in three rows, then grew when the display face loaded and
// spilled to a fourth - hidden by the max-height belt. Two of 190 cards failed exactly that way.
// The fit now waits on document.fonts.ready.
const REPO = 'C:/Users/Light/Desktop/claude/health expert';
let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* next */ }
}
if (!pup) { console.log('NO_PUPPETEER'); process.exit(2); }

// F is the approved design; E was the rejected alternative and is not carried here.
const RECORD = { key: 'F · label (THE APPROVED RECORD)', tile: '.lb-tile', chips: '.lb-chips', chip: '.lb-chip', more: '.lb-more', cov: '.lb-meta', cell: '.lb-a' };
// ★ `root` SCOPES THE QUERY TO THE VISIBLE WORKSPACE. Both workspaces stay in the DOM and
// the inactive one is merely hidden, so a bare querySelectorAll picks up the hidden copy's
// tiles as well -- they measure 0x0 and fail the control-size clause for a reason that has
// nothing to do with the design. render_probe_foods.js learned this the same way.
const APP = { key: 'F · label (AS SHIPPED)', root: '.fs-block', tile: '.fs-tile', chips: '.fs-chips', chip: '.fs-chip', more: '.fs-more', cov: '.fs-tile__meta', cell: '.fs-a' };

(async () => {
  const b = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1240, height: 1200, deviceScaleFactor: 1 });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  // The COMMITTED design page, not temporary/ -- that directory is gitignored, so a probe
  // pointed there would silently stop running on a fresh clone.
  const PAGE = '/chronicle/decisions/2026-08-21-food-tile-F-approved.html';
  await p.goto('file:///' + REPO + PAGE + '?all=1', { waitUntil: 'networkidle0', timeout: 60000 });
  await p.waitForFunction(() => window.__efready === true, { timeout: 30000 });
  await new Promise(r => setTimeout(r, 500));

  const measure = (PANELS) => {
    const out = {};
    for (const P of PANELS) {
      const scope = P.root
        ? [...document.querySelectorAll(P.root)].filter(e => e.getBoundingClientRect().height > 0)[0]
        : document;
      if (!scope) { out[P.key] = { n: 0, maxChips: 0, maxRows: 0, withBadge: 0, sizes: [], overCap: [], overRows: [], badCount: [], offCentre: [], hMin: 0, hMax: 0 }; continue; }
      const cards = [...scope.querySelectorAll(P.tile)];
      const overCap = [], overRows = [], badCount = [], offCentre = [];
      const sizes = new Set();
      let maxChips = 0, maxRows = 0, withBadge = 0, hMin = 1e9, hMax = 0;
      for (const card of cards) {
        const host = card.querySelector(P.chips);
        const chips = [...host.querySelectorAll(P.chip)];
        const badge = host.querySelector(P.more);
        const tops = [...new Set([...host.children].map(k => Math.round(k.offsetTop)))].sort((a, z) => a - z);
        maxChips = Math.max(maxChips, chips.length);
        maxRows = Math.max(maxRows, tops.length);
        const name = card.querySelector('[title]') ? card.querySelector('[title]').getAttribute('title') : '?';
        if (chips.length > 7) overCap.push(`${name}: ${chips.length} chips`);
        if (tops.length > 3) overRows.push(`${name}: ${tops.length} rows`);
        if (badge) {
          withBadge++;
          // Prefer the tile's OWN hit count where it publishes one (the shipped app does):
          // the meta line is a rendering of the same fact, and checking a badge against a
          // sibling rendering proves only that two renderings agree.
          const total = (card.dataset && card.dataset.hits
            ? +card.dataset.hits
            : +card.querySelector(P.cov).textContent.match(/(\d+)\s*of 90/)[1]) - 1;
          const claimed = +badge.textContent.replace('+', '');
          if (claimed !== total - chips.length) badCount.push(`${name}: +${claimed} vs ${total - chips.length}`);
        }
        // control: identical size, and centred in its own cell
        const btn = card.querySelector('button.ui-close');
        const cell = card.querySelector(P.cell);
        const rb = btn.getBoundingClientRect(), rc = cell.getBoundingClientRect();
        sizes.add(`${Math.round(rb.width)}x${Math.round(rb.height)}`);
        const dx = Math.abs((rb.left + rb.width / 2) - (rc.left + rc.width / 2));
        const dy = Math.abs((rb.top + rb.height / 2) - (rc.top + rc.height / 2));
        if (dx > 0.75 || dy > 0.75) offCentre.push(`${name}: off by ${dx.toFixed(1)},${dy.toFixed(1)}`);
        const h = card.getBoundingClientRect().height;
        hMin = Math.min(hMin, h); hMax = Math.max(hMax, h);
      }
      out[P.key] = { n: cards.length, maxChips, maxRows, withBadge, sizes: [...sizes],
                     overCap, overRows, badCount, offCentre,
                     hMin: +hMin.toFixed(1), hMax: +hMax.toFixed(1) };
    }
    return out;
  };

  const R = await p.evaluate(measure, [RECORD]);

  // ── THE SHIPPED APP, held to the same five clauses ────────────────────────
  // The Regimen console shows three foods at a time and the list ADVANCES as they are
  // added, so adding repeatedly walks the catalog through the real renderer. 40 rounds is
  // 120 tiles -- far past the point where a chip budget or a row overflow would show.
  await p.goto('file:///' + REPO + '/dashboard/dashboard.html', { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 900));
  await p.evaluate(() => {
    const x = document.querySelector('.wc-veil .ui-close, .wc-veil button');
    if (x) { x.click(); }
  });
  await p.evaluate(() => window.dispatchEvent(
    new CustomEvent('wallach:navigate', { detail: { to: 'regimen' } })));
  await new Promise(r => setTimeout(r, 800));

  const appWorst = { n: 0, maxChips: 0, maxRows: 0, withBadge: 0, sizes: [],
                     overCap: [], overRows: [], badCount: [], offCentre: [],
                     hMin: 1e9, hMax: 0 };
  for (let round = 0; round < 40; round += 1) {
    const r = (await p.evaluate(measure, [APP]))[APP.key];
    if (!r || r.n === 0) { break; }
    appWorst.n += r.n;
    appWorst.maxChips = Math.max(appWorst.maxChips, r.maxChips);
    appWorst.maxRows = Math.max(appWorst.maxRows, r.maxRows);
    appWorst.withBadge += r.withBadge;
    appWorst.hMin = Math.min(appWorst.hMin, r.hMin);
    appWorst.hMax = Math.max(appWorst.hMax, r.hMax);
    for (const k of ['overCap', 'overRows', 'badCount', 'offCentre']) { appWorst[k].push(...r[k]); }
    for (const s of r.sizes) { if (!appWorst.sizes.includes(s)) { appWorst.sizes.push(s); } }
    const advanced = await p.evaluate(() => {
      const blk = [...document.querySelectorAll('.fs-block')]
        .filter(e => e.getBoundingClientRect().height > 0)[0];
      const btn = blk && blk.querySelector('[data-food-add]');
      if (!btn) { return false; }
      btn.click();
      return true;
    });
    if (!advanced) { break; }
    await new Promise(r2 => setTimeout(r2, 120));
  }
  appWorst.hMin = +appWorst.hMin.toFixed(1);
  appWorst.hMax = +appWorst.hMax.toFixed(1);
  R[APP.key] = appWorst;

  let bad = 0;
  for (const [key, r] of Object.entries(R)) {
    console.log(`\n=== ${key}`);
    console.log(`   cards ${r.n} · max chips ${r.maxChips} · max rows ${r.maxRows} · with +N ${r.withBadge}`);
    console.log(`   height ${r.hMin} – ${r.hMax} px · control sizes rendered: ${r.sizes.join(', ')}`);
    const checks = [
      ['never more than 7 essentials shown', r.overCap.length === 0, r.overCap],
      ['never more than 3 chip rows', r.overRows.length === 0, r.overRows],
      ['+N equals what was dropped', r.badCount.length === 0, r.badCount],
      ['+ and × render at ONE size', r.sizes.length === 1, r.sizes],
      ['control is centred in its cell (<=0.75px)', r.offCentre.length === 0, r.offCentre],
    ];
    for (const [name, ok, detail] of checks) {
      console.log(`   ${ok ? 'PASS' : 'FAIL'} · ${name}`);
      if (!ok) { bad++; detail.slice(0, 4).forEach(d => console.log('           ' + d)); }
    }
  }
  console.log(`\n${errs.length ? 'FAIL' : 'PASS'} · no page errors${errs.length ? ': ' + errs.join(' | ') : ''}`);
  if (errs.length) bad++;
  await b.close();
  if (bad) { console.log(`\n${bad} CHECK(S) FAILED`); process.exit(1); }
  console.log('\nPASS · the approved food tile holds — 190 foods in the record, '
    + `${R[APP.key].n} tiles walked in the shipped app`);
})();
