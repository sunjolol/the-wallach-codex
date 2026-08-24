// tools/probes/render_probe_food_block_position.js
// EVERY essential page, not a sample: the FOOD SOURCES block must render exactly ONCE, and it
// must sit directly above the sources list it belongs to — never stranded in the top "at a
// glance" panel while that list sits hundreds of pixels below.
//
// This exists because four hand-picked pages passed while Tin was broken: its note rendered at
// y=477 and its sources list at y=1351. The owner found it by looking; nothing here could.
// A per-page adjacency check is the only thing that covers the four different render paths an
// essential page can take (standard glance, mechanism section, plant-derived hero, omega family).

const path = require('path');
const REPO = 'C:/Users/Light/Desktop/claude/health expert';
let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* next */ }
}
if (!pup) { console.log('NO_PUPPETEER'); process.exit(2); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

// How far the food label may sit above the sources label it belongs to. A block with rows is
// tall; a block with just a note is short. 900 px is generous for five rows plus a "show all"
// and still nowhere near the 874 px gap the Tin defect produced.
const MAX_GAP_PX = 900;

// ── THE SIX PAGES THAT CORRECTLY HAVE NO FOOD BLOCK ─────────────────────────
// Each takes a purpose-built glance instead of the standard one, and each ALREADY answers the
// question the food block answers, in better words than a generic block could:
//   Hydrogen/Carbon/Nitrogen/Oxygen — "You get all you need from the air you breathe, the water
//     you drink, and ordinary food."
//   Phosphorus — "Wallach's own supplement table lists this at a need of zero — you already get
//     enough from food, so there is nothing to add."
//   Cobalt — "your cobalt rides on your B12".
// The exemption is NOT a free pass: every page named here must still carry that panel
// (.kd-ep-mirror__body). Strip the explanation and this list stops protecting the page.
const NO_BLOCK_EXPECTED = new Set(['Hydrogen', 'Carbon', 'Nitrogen', 'Oxygen', 'Phosphorus', 'Cobalt']);

(async () => {
  const b = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1500, height: 1200, deviceScaleFactor: 1 });
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/'), { waitUntil: 'domcontentloaded' });
  await sleep(2400);
  await p.evaluate(() => (() => { const btn = document.querySelector('.wc-veil .ui-close, .wc-veil [data-veil-close], .wc-veil button'); if (btn) { btn.click(); } document.querySelectorAll('.wc-veil, .wc').forEach(n => n.remove()); })());
  await p.evaluate(() => document.querySelector('[data-rail-nav="knowledge"]').click());
  await sleep(1200);
  await p.evaluate(() => {
    const t = document.querySelector('#drawer-knowledge-mount [data-kd-tab="essentials"]');
    if (t) t.click();
  });
  await sleep(900);

  const keys = await p.evaluate(() =>
    [...document.querySelectorAll('#drawer-knowledge-mount [data-kd-essential]')]
      .map(e => e.getAttribute('data-kd-essential')));
  console.log(`essentials on the tab: ${keys.length}`);

  const bad = [];
  let withRows = 0, withNote = 0, exempt = 0;
  for (const key of keys) {
    await p.evaluate(() => {
      const t = document.querySelector('#drawer-knowledge-mount [data-kd-tab="essentials"]');
      if (t) t.click();
    });
    await sleep(220);
    const opened = await p.evaluate((k) => {
      const el = [...document.querySelectorAll('#drawer-knowledge-mount [data-kd-essential]')]
        .find(e => e.getAttribute('data-kd-essential') === k);
      if (!el) return false;
      el.click();
      return true;
    }, key);
    if (!opened) { bad.push([key, 'tile not found']); continue; }
    await sleep(420);

    const r = await p.evaluate(() => {
      const labels = [...document.querySelectorAll('.kd-ep-op__srclabel')];
      const food = labels.filter(n => n.textContent.trim() === 'Best food sources');
      const y = n => Math.round(n.getBoundingClientRect().top + window.scrollY);
      if (food.length !== 1) {
        return { n: food.length, labels: labels.map(n => n.textContent.trim()) };
      }
      const fy = y(food[0]);
      // the next sources label BELOW the food one is the list it belongs to
      const below = labels.filter(n => n !== food[0] && y(n) > fy).sort((a, b) => y(a) - y(b))[0];
      return {
        n: 1,
        gap: below ? y(below) - fy : null,
        next: below ? below.textContent.trim() : null,
        hasRows: !!document.querySelector('.kd-ep-src--food'),
        hasNote: !!document.querySelector('.kd-ep-foodnote'),
        labels: labels.map(n => n.textContent.trim()),
      };
    });

    if (NO_BLOCK_EXPECTED.has(key)) {
      // Exempt — but only while the page still explains itself.
      const explains = await p.evaluate(() => {
        const el = document.querySelector('.kd-ep-mirror__body, .kd-ep-present__body');
        return el ? el.textContent.trim().length > 40 : false;
      });
      if (r.n !== 0) bad.push([key, `exempt, yet rendered ${r.n} food block(s)`, r.labels]);
      else if (!explains) bad.push([key, 'exempt, but the page no longer explains where it comes from']);
      else exempt++;
      continue;
    }
    if (r.n !== 1) { bad.push([key, `rendered ${r.n} times`, r.labels]); continue; }
    if (r.hasRows) withRows++; else if (r.hasNote) withNote++;
    if (r.next === null) {
      bad.push([key, 'no sources list below it — the block is stranded', r.labels]);
    } else if (r.gap > MAX_GAP_PX) {
      bad.push([key, `${r.gap}px above "${r.next}" — detached from its list`, r.labels]);
    }
  }

  console.log(`\nwith food rows: ${withRows}   with a note: ${withNote}   exempt (and still explained): ${exempt}   flagged: ${bad.length}`);
  for (const [k, why, extra] of bad) {
    console.log(`  FAIL ${k}: ${why}${extra ? '  ' + JSON.stringify(extra) : ''}`);
  }
  if (errs.length) console.log('page errors:', errs);
  const ok = bad.length === 0 && errs.length === 0;
  console.log(ok
    ? '\nRESULT: PASS — every essential renders the food block exactly once, adjacent to its sources list.'
    : `\nRESULT: FAIL — ${bad.length} page(s)`);
  await b.close();
  process.exit(ok ? 0 : 1);
})();
