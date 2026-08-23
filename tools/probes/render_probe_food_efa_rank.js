// tools/probes/render_probe_food_efa_rank.js — the EFA group inside the food ranking key.
//
// Usage: node tools/probes/render_probe_food_efa_rank.js
//
// `strength` is the DEFAULT order of all 192 foods whenever no goal is chosen, and until
// 2026-08-22 it summed nutrient ROWS only. The essential-fatty-acid group is not a row —
// omega-3 and omega-6 carry no individual Wallach dose, so they share one meter — so a food
// delivering 220% of his nine grams scored ZERO for it. Walnuts sat on page 47 of 64 in a
// list ordered by nutrition, with the card beside them printing the 220% the whole time.
//
// It walks the REAL pager in the REAL app, which is the only way to catch a fix that lives
// in the artifact and never reaches the page. Four assertions:
//
//   1. OVERTAKING, not a page number. Each measured food must now rank AHEAD of a named food
//      that outscores it on rows alone and delivers no qualifying EFA — true only if the
//      group is counted, and independent of how many foods the block happens to be showing.
//   2. Each of them carries the group on its own card, as the LEAD figure or as a chip: the
//      delivery the key counts is the same one the reader can see.
//   3. With a goal that NAMES an omega (24 of the 30 do), the block leads with a food that
//      actually delivers the group — the property the blind key could not produce.
//   4. The control: a goal naming NO omega is led by something else.
//
// ★ WHY NOT ABSOLUTE POSITIONS. The first version asserted "#21 of 192" and failed on Tahini
// and Pecans by exactly 3 — because those numbers came from a node PREDICTION over the old
// artifact's full-precision EFA fractions, while the shipped key sums the 4-dp figures the
// generator stores, and three near-ties fall the other way. The app agreed with the artifact
// to the position; the prediction did not. An ordinal is the wrong thing to write down here:
// it also moves with the catalog and with what the reader already covers. What CANNOT drift
// without the fix being gone is that these foods overtake specific foods they used to trail.
//
// ★ A DOM PROBE IS NOT A VISUAL CHECK. Screenshots at the end, for human eyes.

const path = require('path');
const fs = require('fs');
const REPO = path.resolve(__dirname, '..', '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER'); process.exit(2); }

const OUT = process.env.FOODS_SHOT_DIR || path.join(REPO, 'temporary');
fs.mkdirSync(OUT, { recursive: true });

// Each pair: a food whose rank depends on the EFA term, and a food it must now beat. Every
// `beats` entry outscores its `name` on nutrient ROWS ALONE and delivers no qualifying EFA,
// so it led before 2026-08-22 and trails now. Read off the artifact once, written down here
// so this file FAILS on drift instead of agreeing with whatever the app currently does.
const OVERTAKES = [
  { name: 'Walnuts', efaPct: 220, beats: 'Sockeye salmon, cooked' },
  { name: 'Hemp seeds', efaPct: 184, beats: 'Green peas, cooked' },
  { name: 'Tahini', efaPct: 110, beats: 'Sweet potato, baked' },
  { name: 'Pecans', efaPct: 101, beats: 'Rockfish, cooked' },
];
const GOAL_WITH_OMEGA = 'healthy-heart';     // names omega-3 AND omega-6
const GOAL_WITHOUT = 'stronger-bones';       // names neither — the control

const fails = [];
const check = (label, cond, detail) => {
  console.log(`  ${cond ? 'ok  ' : 'FAIL'}  ${label}${detail === undefined ? '' : `  ${detail}`}`);
  if (!cond) { fails.push(label); }
};

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto('file://' + path.join(REPO, 'dashboard', 'dashboard.html').replace(/\\/g, '/'),
    { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 900));
  await page.evaluate(() => {
    const btn = document.querySelector('.wc-veil .ui-close, .wc-veil [data-wc-close], .wc-veil button');
    if (btn) { btn.click(); }
  });
  await new Promise(r => setTimeout(r, 400));

  const gotoRegimen = async () => {
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('wallach:navigate', { detail: { to: 'regimen' } }));
    });
    await new Promise(r => setTimeout(r, 700));
  };
  await gotoRegimen();

  /** The laid-out food block only — both workspaces stay in the DOM and the hidden copy
   *  reports zero-size rects, which would let an invisible list pass every assertion.
   *
   *  ★ THE LEAD IS READ ALONGSIDE THE CHIPS. The biggest figure on a card is drawn as
   *  `.fs-lead`, not as a `.fs-chip`, so a chips-only reader reports "no OMEGA EFAS" about
   *  exactly the foods that deliver the MOST of it — which is what the first run did. */
  const readPage = () => page.evaluate(() => {
    const block = [...document.querySelectorAll('.fs-block')]
      .filter(b => b.getBoundingClientRect().height > 0)[0];
    if (!block) { return { present: false, cards: [] }; }
    const cur = [...block.querySelectorAll('.fs-pager__b')]
      .find(b => b.getAttribute('aria-current') === 'page');
    return {
      present: true,
      page: cur ? Number((cur.textContent || '').trim()) : null,
      cards: [...block.querySelectorAll('.fs-tile')].map(t => {
        const leadPct = t.querySelector('.fs-lead__pct');
        const leadOf = t.querySelector('.fs-lead__of');
        const lead = leadOf
          ? `${(leadOf.textContent || '').trim()} ${(leadPct.textContent || '').trim()}` : '';
        return {
          name: (t.querySelector('.fs-tile__name') || {}).textContent || '',
          lead,
          readout: [lead, ...[...t.querySelectorAll('.fs-chip')]
            .map(c => (c.textContent || '').trim())].filter(Boolean),
        };
      }),
    };
  });

  const nextPage = async () => page.evaluate(() => {
    const block = [...document.querySelectorAll('.fs-block')]
      .filter(b => b.getBoundingClientRect().height > 0)[0];
    const arrow = [...block.querySelectorAll('.fs-pager__b')]
      .find(x => (x.textContent || '').trim() === '›');
    if (arrow && !arrow.disabled) { arrow.click(); return true; }
    return false;
  });

  // ── 1 + 2 · walk the whole shipped list by CLICKING, page by page ───────────
  console.log('\nwalking the real pager (nothing re-derived in node):');
  const order = [];
  const card = new Map();
  for (let guard = 0; guard < 90; guard += 1) {
    const s = await readPage();
    if (!s.present) { break; }
    for (const c of s.cards) {
      if (!card.has(c.name)) { card.set(c.name, c); order.push(c.name); }
    }
    if (!(await nextPage())) { break; }
    await new Promise(r => setTimeout(r, 110));
  }
  console.log(`  ${order.length} food(s) walked`);

  const at = n => order.indexOf(n);
  for (const o of OVERTAKES) {
    const a = at(o.name);
    const b = at(o.beats);
    check(`${o.name} (${o.efaPct}% of his 9 g) now outranks ${o.beats}`,
      a >= 0 && b >= 0 && a < b, a < 0 || b < 0 ? `#${a + 1} vs #${b + 1} — one is absent`
        : `#${a + 1} vs #${b + 1}`);
    const c = card.get(o.name);
    check(`${o.name} shows the group it is ranked for`,
      !!c && c.readout.some(x => /OMEGA\s*EFAS/i.test(x)),
      c ? c.readout.slice(0, 3).join(' | ') : '—');
  }

  // Land back on the page the headline food sits on, for the screenshot.
  await page.evaluate(() => {
    const block = [...document.querySelectorAll('.fs-block')]
      .filter(b => b.getBoundingClientRect().height > 0)[0];
    const first = [...block.querySelectorAll('.fs-pager__b')]
      .find(x => (x.textContent || '').trim() === '1');
    if (first) { first.click(); }
  });
  await new Promise(r => setTimeout(r, 200));
  const walnutPage = Math.floor(at('Walnuts') / 3) + 1;
  for (let i = 1; i < walnutPage; i += 1) { await nextPage(); await new Promise(r => setTimeout(r, 90)); }
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: path.join(OUT, 'food-efa-rank-page.png'), fullPage: false });

  // ── 3 + 4 · a goal that names an omega, and one that does not ───────────────
  const withGoal = async (id) => {
    await page.evaluate((g) => { window.saveRgUserGoals([g]); }, id);
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('wallach:navigate', { detail: { to: 'coverage' } }));
    });
    await new Promise(r => setTimeout(r, 400));
    await gotoRegimen();
    // ★ THE PAGER SURVIVES THE GOAL CHANGE. The walk above leaves it deep in the list, and
    // a repaint does not reset it — so reading straight after a goal change reports page 7
    // and calls its first card "the lead". It did, and named Pistachios the top food for a
    // heart goal that Walnuts leads by a mile. Go back to page one before believing anything.
    await page.evaluate(() => {
      const block = [...document.querySelectorAll('.fs-block')]
        .filter(b => b.getBoundingClientRect().height > 0)[0];
      const one = [...block.querySelectorAll('.fs-pager__b')]
        .find(x => (x.textContent || '').trim() === '1');
      if (one) { one.click(); }
    });
    await new Promise(r => setTimeout(r, 300));
    return readPage();
  };

  console.log(`\nwith the "${GOAL_WITH_OMEGA}" goal (names omega-3 AND omega-6):`);
  const hot = await withGoal(GOAL_WITH_OMEGA);
  for (const c of hot.cards) { console.log(`   · ${c.name}  —  ${c.readout.slice(0, 4).join(' | ')}`); }
  check('the lead food actually delivers the EFA group',
    hot.cards.length > 0 && hot.cards[0].readout.some(x => /OMEGA\s*EFAS/i.test(x)),
    hot.cards.length ? hot.cards[0].name : 'no cards');
  await page.screenshot({ path: path.join(OUT, 'food-efa-rank-goal.png'), fullPage: false });

  console.log(`\nCONTROL — the "${GOAL_WITHOUT}" goal (names neither omega):`);
  const cold = await withGoal(GOAL_WITHOUT);
  for (const c of cold.cards) { console.log(`   · ${c.name}  —  ${c.readout.slice(0, 4).join(' | ')}`); }
  check('a goal naming no omega is led by something else',
    cold.cards.length > 0 && hot.cards.length > 0 && cold.cards[0].name !== hot.cards[0].name,
    `${cold.cards.length ? cold.cards[0].name : '—'} vs ${hot.cards.length ? hot.cards[0].name : '—'}`);

  await page.evaluate(() => { window.saveRgUserGoals([]); });

  console.log('\npage errors: ' + (errors.length ? errors.join(' | ') : 'none'));
  console.log('screenshots: ' + path.join(OUT, 'food-efa-rank-page.png'));
  console.log('             ' + path.join(OUT, 'food-efa-rank-goal.png'));
  await browser.close();
  if (errors.length) { fails.push('page errors'); }
  console.log(`\nRESULT: ${fails.length ? 'FAIL — ' + fails.join('; ') : 'PASS (now look at the screenshots)'}`);
  process.exit(fails.length ? 1 : 0);
})();
