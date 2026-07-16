// tools/render_probe_coverage_add_remove.js — the Coverage loop, end to end (blueprint §11).
//
// Usage: node tools/render_probe_coverage_add_remove.js
//
// WHAT IT PROVES, and why a static gate could not:
//   · the arrival veil appears ONCE (never asked -> asked), and "Show me my field" is gated
//     on a name + >=1 goal;
//   · a rec card's `+` ADDS through §31 and the field RELIGHTS;
//   · ★ THE DOSE STEPPER MOVES THE COUNTS — Luneth's named requirement for this build
//     ("such as increasing dosage changing counts"). The demo's stepper is INERT; live it
//     must scale delivered amounts and re-measure. This is the only check watching that.
//   · stepping back down RESTORES the exact prior counts (reversible, not approximate);
//   · remove DIMS the field and the removed product RETURNS to the recommendations —
//     because the list is derived, never stored (recommendations_not_stored is the static
//     half; this is the behavioural half);
//   · the DENOMINATOR never moves: a goal changes what you LOOK AT, never what you are
//     MEASURED against. Asserted at EVERY step — the locked rule's only live guard.
//   · no kids product ever appears in a rec list (the behavioural half of
//     kids_products_not_recommended; in the demo, Kid's Toddy ranked #1).
//
// R7: a static gate proves a guard EXISTS, never that it RUNS (the mineral-tiers lesson).
const puppeteer = require('puppeteer');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const KIDS = require(path.join(ROOT, 'dashboard/assets/data/kids-exclusion.json'));

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
  checks.push(['4 recommendation cards', s0.recs.length === 4]);

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
  checks.push(['more covered means fewer not-covered', s2.gap < s1.gap]);

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
