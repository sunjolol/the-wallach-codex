// Reproduce the owner's screenshot (5x "Pasted ingredients" + a saved "Powder") and MEASURE the
// alignment. A screenshot alone cannot prove two right edges agree; getBoundingClientRect can.
const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
const OUT = __dirname;   // probe output lands beside the probe, not in a dead session's scratchpad
let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* next */ }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const check = (n, ok, d) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d === undefined ? '' : '  — ' + JSON.stringify(d)}`); if (!ok) fails++; };

(async () => {
  const b = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1500, height: 1100, deviceScaleFactor: 2 });
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const url = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');
  const boot = async () => {
    await p.goto(url, { waitUntil: 'domcontentloaded' }); await sleep(2200);
    await p.evaluate(() => (() => { const btn = document.querySelector('.wc-veil .ui-close, .wc-veil [data-veil-close], .wc-veil button'); if (btn) { btn.click(); } document.querySelectorAll('.wc-veil, .wc').forEach(n => n.remove()); })());
  };
  await boot();

  // His exact shelf state, written as LEGACY entries: no `seq` field at all, which is what
  // history from before this change looks like. The backfill has to rescue these.
  await p.evaluate(() => {
    const day = 86400000, now = Date.parse('2026-08-24T12:00:00Z');
    const mk = (id, name, verdict, daysAgo, ing) => ({
      id, ts: new Date(now - daysAgo * day).toISOString(), verdict,
      label: { name, brand: '', servings: '1', nutrients: [{ name: 'Zinc', amount: 15, unit: 'mg' }], ingredients: ing },
      alignment: { score: 1, aligned: 1, total: 2, misaligned: 0 }, goals: [], gapFills: [],
    });
    localStorage.setItem('lcRecentScans_v1', JSON.stringify({ items: [
      mk(105, 'Pasted ingredients', 'REJECT', 4, 'wheat flour'),
      mk(104, 'Pasted ingredients', 'REJECT', 4, 'corn syrup'),
      mk(103, 'Pasted ingredients', 'SAVE', 4, 'water'),
      mk(102, 'Pasted ingredients', 'SAVE', 4, 'salt'),
      mk(101, 'Pasted ingredients', 'SAVE', 4, 'rice'),
    ] }));
    localStorage.setItem('lcSavedScans_v1', JSON.stringify({ items: [
      mk(100, 'powder', 'ADD', 9, 'magnesium citrate'),
    ] }));
  });
  await boot();
  await p.evaluate(() => document.querySelector('[data-rail-nav="scanner"]').click());
  await sleep(1600);

  const rows = await p.evaluate(() => [...document.querySelectorAll('.vd-hrow')].map((r) => {
    const name = r.querySelector('.rl-row__name');
    const pill = r.querySelector('.vd-pill');
    const when = r.querySelector('.vd-when');
    const rb = r.getBoundingClientRect();
    const box = el => { const b = el.getBoundingClientRect(); return { right: +(b.right).toFixed(1), top: +(b.top - rb.top).toFixed(1) }; };
    return {
      src: r.dataset.scSrc, name: name.textContent.trim(),
      pill: pill ? pill.textContent.trim() : null, when: when ? when.textContent.trim() : null,
      pillRight: pill ? box(pill).right : null, whenRight: when ? box(when).right : null,
      pillTop: pill ? box(pill).top : null, whenTop: when ? box(when).top : null,
    };
  }));
  console.log(JSON.stringify(rows, null, 1));

  check('legacy rows were backfilled and are now distinguishable',
    new Set(rows.map(r => r.name)).size === rows.length, rows.map(r => r.name));
  check('the oldest capture is number 1',
    rows.some(r => /Powder 1$/.test(r.name)), rows.map(r => r.name));
  check('every age reads as an elapsed time',
    rows.every(r => /AGO$/i.test(r.when)), rows.map(r => r.when));

  const drift = rows.map(r => +(r.pillRight - r.whenRight).toFixed(1));
  check('the age shares the pill\'s right edge on EVERY row', drift.every(d => Math.abs(d) <= 0.6), drift);
  const savedDrift = rows.filter(r => r.src === 'saved').map(r => r.pillRight);
  const recentDrift = rows.filter(r => r.src === 'recent').map(r => r.pillRight);
  check('Saved and Recent agree with each other',
    Math.abs(savedDrift[0] - recentDrift[0]) <= 0.6, { saved: savedDrift[0], recent: recentDrift[0] });
  check('the age sits BELOW the pill, not beside it',
    rows.every(r => r.whenTop > r.pillTop), rows.map(r => [r.pillTop, r.whenTop]));
  check('no page errors', errs.length === 0, errs);

  const el = await p.$('.vd-rail');
  if (el) await el.screenshot({ path: OUT + '/S4-rail-aligned.png' });
  console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILED`);
  await b.close();
  process.exit(fails === 0 ? 0 : 1);
})();
