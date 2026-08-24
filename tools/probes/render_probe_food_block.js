// The FOOD SOURCES block on essentials pages: one case per verdict, driven in the real app.
// The point of the probe is the COPY, not the layout: printing "requires supplementing" over a
// data gap is the failure this block exists to avoid, and only a per-essential check catches it.
const path = require('path');
const REPO = 'C:/Users/Light/Desktop/claude/health expert';
const OUT = 'C:/Users/Light/AppData/Local/Temp/claude/C--Users-Light-Desktop-claude-health-expert/3a1caf4b-796a-4455-ae4d-e12efd49f28f/scratchpad';
let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* next */ }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const check = (n, ok, d) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d === undefined ? '' : '  - ' + JSON.stringify(d).slice(0, 300)}`);
  if (!ok) fails++;
};

// `key` is the layout key the tile carries in data-kd-essential — the canon NAME, not the slug.
const CASES = [
  { slug: 'magnesium', key: 'Magnesium', want: 'rows', why: 'plenty of foods qualify' },
  { slug: 'omega-3', key: 'Omega-3 (Alpha-Linolenic Acid / ALA)', want: 'rows', why: 'scored through the shared EFA meter, not a nutrient row' },
  { slug: 'vitamin-b1', key: 'Vitamin B1 (Thiamine)', want: 'supplementing', why: 'bound, swept, no food reaches 100 mg' },
  { slug: 'tin', key: 'Tin', want: 'supplementing', why: 'Wallach names the colloidal vehicle as its route' },
  { slug: 'strontium', key: 'Strontium', want: 'supplementing', why: 'plant-derived, depleted soil' },
  // BOUND 2026-08-24 (AFCD). It was the `no_binding` case until then; abalone is the one food
  // in the catalog that clears 7% of his 620 mcg, at 19.5% on a 3 oz serving.
  { slug: 'chromium', key: 'Chromium', want: 'rows', why: 'bound to AFCD; abalone clears the floor' },
  { slug: 'inositol', key: 'Inositol', want: 'gap', why: 'still unbound - OURS, not a finding about food' },
  { slug: 'lysine', key: 'Lysine', want: 'no-target', why: 'no Wallach amount, so nothing to measure against' },
  { slug: 'gold', key: 'Gold', want: 'supplementing', why: 'plant-derived, second case' },
  { slug: 'lithium', key: 'Lithium', want: 'supplementing', why: 'plant-derived, third case' },
  { slug: 'germanium', key: 'Germanium', want: 'supplementing', why: 'vehicle-supplied AND carries group_record' },
];

const READ_BLOCK = () => {
  const labels = [...document.querySelectorAll('.kd-ep-op__srclabel')].map(n => n.textContent.trim());
  const foodLabel = [...document.querySelectorAll('.kd-ep-op__srclabel')]
    .find(n => n.textContent.trim() === 'Best food sources');
  if (!foodLabel) return { present: false, labels };
  const parts = [];
  let n = foodLabel.nextElementSibling;
  while (n && !n.classList.contains('kd-ep-op__srclabel') && n.tagName !== 'HR') {
    parts.push(n);
    n = n.nextElementSibling;
  }
  const note = parts.find(x => x.classList.contains('kd-ep-foodnote'));
  const rows = parts.filter(x => x.classList.contains('kd-ep-src--food'));
  const more = parts.find(x => x.classList.contains('kd-ep-more'));
  return {
    present: true, labels,
    foodIdx: labels.indexOf('Best food sources'),
    foodLabelCount: labels.filter(l => l === 'Best food sources').length,
    ygvIdx: labels.indexOf('Best Youngevity sources'),
    note: note ? note.textContent.trim() : null,
    noteSize: note ? getComputedStyle(note).fontSize : null,
    rowCount: rows.length + (more ? more.querySelectorAll('.kd-ep-src--food').length : 0),
    firstRows: rows.slice(0, 3).map(r => r.textContent.replace(/\s+/g, ' ').trim()),
    hrCount: document.querySelectorAll('hr.kd-ep-op__div').length,
  };
};

(async () => {
  const b = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1500, height: 1200, deviceScaleFactor: 2 });
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/'), { waitUntil: 'domcontentloaded' });
  await sleep(2400);
  await p.evaluate(() => (() => { const btn = document.querySelector('.wc-veil .ui-close, .wc-veil [data-veil-close], .wc-veil button'); if (btn) { btn.click(); } document.querySelectorAll('.wc-veil, .wc').forEach(n => n.remove()); })());
  await p.evaluate(() => document.querySelector('[data-rail-nav="knowledge"]').click());
  await sleep(1200);

  const openEssential = async (key) => {
    await p.evaluate(() => {
      const tab = document.querySelector('#drawer-knowledge-mount [data-kd-tab="essentials"]');
      if (tab) tab.click();
    });
    await sleep(700);
    const ok = await p.evaluate((k) => {
      const els = [...document.querySelectorAll('#drawer-knowledge-mount [data-kd-essential]')];
      const el = els.find(e => e.getAttribute('data-kd-essential') === k);
      if (!el) return false;
      el.click();
      return true;
    }, key);
    await sleep(1400);
    return ok;
  };

  for (const c of CASES) {
    const opened = await openEssential(c.key);
    console.log(`\n-- ${c.slug}  (${c.why})`);
    if (!opened) { check(`${c.slug}: tile found`, false, c.key); continue; }
    const got = await p.evaluate(READ_BLOCK);
    check(`${c.slug}: the block is present`, got.present, got.labels);
    if (!got.present) continue;
    check(`${c.slug}: rendered EXACTLY once`, got.foodLabelCount === 1, got.labels);
    check(`${c.slug}: food block sits ABOVE the Youngevity block`,
      got.ygvIdx === -1 || got.foodIdx < got.ygvIdx, { food: got.foodIdx, ygv: got.ygvIdx });
    check(`${c.slug}: a dashed rule separates the two blocks`,
      got.ygvIdx === -1 ? got.hrCount >= 1 : got.hrCount >= 2, got.hrCount);

    const saysSupp = /requires supplementing|obtained by supplementing/i.test(got.note ?? '');
    const saysGap = /gap in our sources/i.test(got.note ?? '');
    const saysNoTarget = /states no daily amount/i.test(got.note ?? '');

    if (c.want === 'rows') {
      check(`${c.slug}: real food rows, no note`, got.rowCount > 0 && got.note === null,
        { rows: got.rowCount, sample: got.firstRows });
    } else if (c.want === 'supplementing') {
      check(`${c.slug}: says it requires supplementing`, saysSupp, got.note);
    } else if (c.want === 'gap') {
      check(`${c.slug}: calls it OUR gap and never says supplement-only`, saysGap && !saysSupp, got.note);
    } else if (c.want === 'no-target') {
      check(`${c.slug}: says no Wallach amount and never says supplement-only`, saysNoTarget && !saysSupp, got.note);
    }
    if (got.note !== null) {
      const px = parseFloat(got.noteSize);
      check(`${c.slug}: note is 0.8-0.9rem`, px >= 12.8 && px <= 14.4, got.noteSize);
    }
  }

  for (const key of ['Magnesium', 'Strontium']) {
    await openEssential(key);
    await p.evaluate(() => {
      const l = [...document.querySelectorAll('.kd-ep-op__srclabel')].find(n => n.textContent.trim() === 'Best food sources');
      if (l) l.scrollIntoView({ block: 'center' });
    });
    await sleep(600);
    const el = await p.$('.kd-ep-op');
    if (el) await el.screenshot({ path: `${OUT}/F-${key.toLowerCase()}.png` });
  }

  check('no page errors', errs.length === 0, errs);
  console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILED`);
  await b.close();
  process.exit(fails === 0 ? 0 : 1);
})();
