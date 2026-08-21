// tools/probes/render_probe_coverage_add_remove.js — the Coverage loop, end to end.
//
// Usage: node tools/probes/render_probe_coverage_add_remove.js
//
// WHAT IT PROVES, and why a static gate could not:
//   · the arrival veil appears ONCE (never asked -> asked), and "Show me my field" is gated
//     on a name + >=1 goal;
//   · a rec card's `+` ADDS through the regimen write chokepoint and the field RELIGHTS;
//   · ★ THE DOSE STEPPER MOVES THE COUNTS. A stepper that only renders a number is inert;
//     live it must scale delivered amounts and re-measure the field. This is the only check
//     watching that.
//   · stepping back down RESTORES the exact prior counts (reversible, not approximate);
//   · remove DIMS the field and the removed product RETURNS to the recommendations —
//     because the list is derived, never stored (recommendations_not_stored is the static
//     half; this is the behavioural half);
//   · the DENOMINATOR never moves: a goal changes what you LOOK AT, never what you are
//     MEASURED against. Asserted at EVERY step — the locked rule's only live guard.
//   · no kids product ever appears in a rec list (the behavioural half of the
//     kids_products_not_recommended gate — a ranker with no exclusion will surface one).
//
// A static gate proves a guard EXISTS, never that it RUNS. That is why this is a probe.
const puppeteer = require('puppeteer');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const KIDS = require(path.join(ROOT, 'dashboard/assets/data/kids-exclusion.json'));
// DERIVED, never snapshotted: read the same curation file the app reads, so re-ordering
// the pack updates this probe's expectation automatically instead of turning it red.
const PACK = require(path.join(ROOT, 'dashboard/assets/data/starter-pack.json'))
  .pinned.map(p => p.product_id);

const readState = () => {
  const n = (label) => {
    const e = [...document.querySelectorAll('.ledger__item')].find(x => x.textContent.includes(label));
    return e ? Number(e.querySelector('.ledger__n').textContent) : -1;
  };
  return {
    covered: n('COVERED'), partial: n('PARTIAL'), present: n('PRESENT'),
    gap: n('NOT COVERED'), pending: n('NO WALLACH NUMBER YET'),
    recon: ((document.querySelector('.ledger__recon') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
    rows: document.querySelectorAll('.rl-row').length,
    dose: (document.querySelector('.rl-dose__n') || {}).textContent,
    recs: [...document.querySelectorAll('.rec__name')].map(e => e.textContent),
    slot: (document.querySelector('.rail-panel__slot') || {}).textContent,
  };
};

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--allow-file-access-from-files', '--use-angle=swiftshader'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') pageErrors.push(m.text()); });

  await page.goto('file:///' + path.posix.join(ROOT.replace(/\\/g, '/'), 'dashboard/dashboard.html'),
    { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 700));

  const checks = [];
  const veil = await page.$('.wc-veil');
  checks.push(['the arrival veil appears when never asked', !!veil]);
  const goBefore = veil ? await page.$eval('[data-go]', b => b.disabled) : true;
  checks.push(['Show-me-my-field is disabled with no name and no goals', goBefore === true]);

  await page.type('.wc__name', 'Luneth');
  await page.click('.wc-goal[data-goal="stronger-bones"]');
  await page.click('.wc-goal[data-goal="less-joint-pain"]');
  const goAfter = await page.$eval('[data-go]', b => b.disabled);
  checks.push(['Show-me-my-field enables with a name and 2 goals', goAfter === false]);
  await page.click('[data-go]');
  await new Promise(r => setTimeout(r, 500));

  checks.push(['the veil is gone after entering', (await page.$('.wc-veil')) === null]);
  const s0 = await page.evaluate(readState);
  checks.push(['the rail reads the ACTIVE SLOT name (D4)', s0.slot === 'DEFAULT']);
  checks.push(['the empty field is 5 covered (HCNO fiat + the phosphorus zero target)', s0.covered === 5]);
  // 3 = REC_PAGE in views/coverage.ts. There is no pager: the list ADVANCES instead —
  // adding one of the three removes it (owned products are filtered out) and the next
  // surfaces in its place, up to the nine-product budget the Coverage tab will ever spend.
  checks.push(['3 recommendation cards', s0.recs.length === 3]);
  checks.push(['no pager control — the list advances rather than pages',
    (await page.$('[data-recs-more]')) === null]);

  // ★ THE STARTER PACK LEADS, IN ITS CURATED ORDER. A fresh field owns nothing, so the first
  // cards must be the pack — if scoring were still deciding the opening, this is the check
  // that would catch it.
  const packNames = await page.evaluate((ids) => ids.map((id) => {
    const el = document.querySelector(`[data-rec-add="${id}"] .rec__name`);
    return el ? el.textContent : null;
  }), PACK.slice(0, 3));
  checks.push(['the first 3 cards ARE the first 3 pinned products, in order',
    packNames.every(Boolean) && JSON.stringify(packNames) === JSON.stringify(s0.recs)]);

  // ── ADD via the rec card + ────────────────────────────────────────────────
  await page.click('.rec');
  await new Promise(r => setTimeout(r, 600));
  const s1 = await page.evaluate(readState);
  checks.push(['the + adds a row', s1.rows === 1]);
  checks.push(['the field RELIGHTS on add', s1.covered > s0.covered]);
  checks.push(['the added product LEAVES its own rec list', !s1.recs.includes(s0.recs[0])]);
  checks.push(['the default dose is 1 per day', s1.dose === '1']);

  // ── THE NAMED EXAMPLE: increasing the dose must move the counts ───────────
  await page.click('[data-dose-up]');
  await new Promise(r => setTimeout(r, 450));
  const s2 = await page.evaluate(readState);
  checks.push(['the dose stepper reads 2 per day', s2.dose === '2']);
  checks.push(['INCREASING THE DOSE MOVES THE COUNTS', s2.covered > s1.covered]);
  // ★ THE LAW IS "TILES MOVE TOWARD COVERED", NOT "GAP SHRINKS". A dose increase can only
  // move essentials the product actually DELIVERS, and those sit in PARTIAL. GAP holds the
  // essentials it does not contain at all, which no dose can reach — so asserting gap alone
  // was an accident of whichever product happened to rank first. Measured here: covered
  // 12 -> 49, partial 49 -> 12, gap 14 -> 14 (37 tiles moved partial -> covered).
  checks.push(['more covered means fewer NOT-YET-covered',
    (s2.partial + s2.gap) < (s1.partial + s1.gap)]);

  // ── reversible, exactly ───────────────────────────────────────────────────
  await page.click('[data-dose-down]');
  await new Promise(r => setTimeout(r, 450));
  const s3 = await page.evaluate(readState);
  checks.push(['stepping back down RESTORES the exact counts',
    s3.covered === s1.covered && s3.gap === s1.gap && s3.partial === s1.partial]);

  // ── remove -> the field dims and the product returns ──────────────────────
  await page.click('[data-row-remove]');
  await new Promise(r => setTimeout(r, 600));
  const s4 = await page.evaluate(readState);
  checks.push(['remove empties the rail', s4.rows === 0]);
  checks.push(['the field DIMS back to the zero state', s4.covered === s0.covered && s4.gap === s0.gap]);
  checks.push(['the removed product RETURNS to the recs (derived, never stored)',
    s4.recs.includes(s0.recs[0])]);

  // ── the denominator never moved, at any step ──────────────────────────────
  const recons = [s0, s1, s2, s3, s4].map(s => s.recon);
  checks.push(['the DENOMINATOR never moves across every mutation', new Set(recons).size === 1]);
  const sums = [s0, s1, s2, s3, s4].map(s => s.covered + s.partial + s.present + s.gap + s.pending);
  checks.push(['the ledger always sums to 90 counted', sums.every(x => x === 90)]);

  // ── no kids product may ever be recommended ───────────────────────────────
  const kidIds = (KIDS.excluded || KIDS.products || []).map(k => String(k.product_id || k.id || k));
  const allRecs = [s0, s1, s2, s3, s4].flatMap(s => s.recs).join(' | ').toLowerCase();
  const kidHit = kidIds.filter(k => allRecs.includes(k.replace(/-/g, ' ')));
  checks.push(['no excluded kids product appears in any rec list', kidHit.length === 0]);

  // ── THE STICKY STRIP vs AN OVERLAY. TWO facts that pull in OPPOSITE directions, which is
  //    exactly why both are pinned here. The strip must sit ABOVE the field (so hover-focus
  //    survives a scroll) and BELOW a drawer (an overlay owns the screen). A z-index chosen
  //    without drawers in mind once left the strip not merely visible over an open drawer but
  //    CLICKABLE over it.
  //    ★ AND: a later fix set z-index correctly while silently DELETING the sticky — new prose
  //    landed after the comment had already terminated, so the CSS parser dropped the
  //    declarations and the strip fell back to position:static. It fixed one half by breaking
  //    the other, and only a measurement caught it. Hence both halves are asserted, forever.
  const wsTop = await page.evaluate(() => Math.round(document.querySelector('.app-workspace').getBoundingClientRect().top));
  await page.evaluate(() => { document.querySelector('.app-workspace').scrollTop = 585; });
  await new Promise(r => setTimeout(r, 350));
  const stuck = await page.evaluate(() => Math.round(document.querySelector('.goalstrip').getBoundingClientRect().top));
  checks.push(['the goal strip STICKS to the workspace top after a 585px scroll', stuck === wsTop]);
  const bleed = await page.evaluate(() => {
    const r = document.querySelector('.goalstrip').getBoundingClientRect();
    const e = document.elementFromPoint(r.left + 400, r.top + r.height / 2);
    return e ? e.className.toString() : '';
  });
  checks.push(['the field does not scroll THROUGH the strip', !bleed.includes('tile')]);
  await page.evaluate(() => { document.querySelector('.app-workspace').scrollTop = 0; });
  await new Promise(r => setTimeout(r, 250));

  await page.keyboard.press('s');
  await new Promise(r => setTimeout(r, 600));
  const drawer = await page.evaluate(() => {
    const open = !!document.querySelector('#drawer-search-mount.sr-open');
    const gs = document.querySelector('.goalstrip');
    const r = gs.getBoundingClientRect();
    const e = document.elementFromPoint(r.left + 80, r.top + r.height / 2);
    return { open, inDrawer: e ? !!e.closest('#drawer-search-mount') : false,
             sticky: getComputedStyle(gs).position };
  });
  checks.push(['the Search drawer opens', drawer.open]);
  checks.push(['an open drawer COVERS the sticky goal strip', drawer.inDrawer]);
  checks.push(['the strip is STILL position:sticky (the fix must not delete it)', drawer.sticky === 'sticky']);

  // -- the NO-GOAL recommender (regression gate) --------------------------------
  //   Goal-mode recs rank by goal members and always worked; the goal-LESS fallback joins
  //   snapshot gaps back to slugs and shipped BROKEN -- layout tile keys are UPPERCASE
  //   ('HYDROGEN'), snapshot names Title-case ('Hydrogen'), so every gap missed, want=[],
  //   and the panel told an empty-regimen user "everything covered." Remove every goal and
  //   assert real gaps still surface, and that removing a goal leaves no stuck dim.
  await page.keyboard.press('Escape'); // close the Search drawer opened by the prior check
  await new Promise(r => setTimeout(r, 300));
  let goalGuard = 0;
  while ((await page.$('[data-goal-remove]')) && goalGuard++ < 12) {
    await page.click('[data-goal-remove]');
    await new Promise(r => setTimeout(r, 300));
  }
  const nogoal = await page.evaluate(() => ({
    goals: document.querySelectorAll('[data-goal-remove]').length,
    recs: [...document.querySelectorAll('.rec__name')].map(e => e.textContent),
    recsText: ((document.querySelector('[data-recs]') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
    focusing: document.body.classList.contains('focusing'),
  }));
  console.log('NOGOAL', JSON.stringify(nogoal, null, 1));
  checks.push(['all goals removed (no-goal mode reached)', nogoal.goals === 0]);
  checks.push(['COV-01: no-goal recommender still surfaces real gaps (empty regimen is NOT "all covered")', nogoal.recs.length > 0]);
  checks.push(['COV-01: recs panel does not falsely claim everything is covered', !/every essential|nothing left to add|everything.{0,12}covered/i.test(nogoal.recsText)]);
  checks.push(['COV-02: removing a goal leaves no stuck-dimmed field', nogoal.focusing === false]);

  checks.push(['no page errors', pageErrors.length === 0]);

  console.log('STATES', JSON.stringify({ s0, s1, s2, s3, s4 }, null, 1));
  console.log('PAGE_ERRORS', pageErrors.length, pageErrors.slice(0, 2).join(' | '));
  const failed = checks.filter(([, ok]) => !ok).map(([n]) => n);
  await browser.close();
  if (failed.length) {
    console.log('FAIL', JSON.stringify(failed, null, 1));
    process.exit(1);
  }
  console.log('PASS · ' + checks.length + ' checks — the Coverage loop holds end to end '
    + '(veil -> goals -> add -> the dose moves the counts -> reversible -> remove -> the rec '
    + 'returns; the denominator never moved)');
})();
