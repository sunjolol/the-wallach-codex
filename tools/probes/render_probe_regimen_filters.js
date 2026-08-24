// The six things he reported on 2026-08-24, each checked in the running app.
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
const fire = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };

(async () => {
  const b = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1600, height: 1300, deviceScaleFactor: 2 });
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/'), { waitUntil: 'domcontentloaded' });
  await sleep(2400);
  await p.evaluate(() => (() => { const btn = document.querySelector('.wc-veil .ui-close, .wc-veil [data-veil-close], .wc-veil button'); if (btn) { btn.click(); } document.querySelectorAll('.wc-veil, .wc').forEach(n => n.remove()); })());
  // Seed his five goals: on a fresh profile none are chosen, and the goal CHIPS are scoped to
  // the reader's own goals by design, so an unseeded run proves nothing about them.
  await p.evaluate(() => {
    // Through the app's own writer, not by poking localStorage: the slot doc is one atomic
    // document and hand-editing it is exactly what the single-writer rule exists to prevent.
    window.saveRgUserGoals(['muscle-strength', 'focus-attention', 'sharper-thinking',
      'better-mood', 'more-energy']);
  });
  await p.reload({ waitUntil: 'domcontentloaded' });
  await sleep(2200);
  await p.evaluate(() => (() => { const btn = document.querySelector('.wc-veil .ui-close, .wc-veil [data-veil-close], .wc-veil button'); if (btn) { btn.click(); } document.querySelectorAll('.wc-veil, .wc').forEach(n => n.remove()); })());
  await p.evaluate(() => document.querySelector('[data-rail-nav="regimen"]').click());
  await sleep(1800);

  // 1 — no dropdown renders blank
  const sels = await p.evaluate(() => [...document.querySelectorAll('.ck select, .fs-filter select')]
    .map(s => ({ attr: Object.keys(s.dataset)[0], value: s.value, shown: s.selectedIndex >= 0 ? s.options[s.selectedIndex].textContent.trim() : null, n: s.options.length })));
  console.log('dropdowns:', JSON.stringify(sels));
  check('1. every dropdown shows a label', sels.length > 0 && sels.every(s => s.shown && s.shown.length > 0), sels);
  check('1b. the sort picker defaults to its gap option',
    sels.some(s => s.attr === 'recSort' && s.value === 'gap' && /gap/i.test(s.shown)),
    sels.find(s => s.attr === 'recSort'));

  // 3 — no accent bar on the pinned lead
  const lead = await p.evaluate(() => {
    const el = document.querySelector('.ck-recgrid .rec--lead');
    return el ? { cls: el.className, shadow: getComputedStyle(el).boxShadow } : { cls: null };
  });
  check('3. the pinned lead carries no extra border', lead.cls === null || !/inset/.test(lead.shadow || ''), lead);

  // 2 — goal chips are earned and carry their number
  const chips = await p.evaluate(() => [...document.querySelectorAll('.ck-recgrid .rec')].map(c => ({
    name: (c.querySelector('.rec__name') || {}).textContent,
    tags: [...c.querySelectorAll('.ck-tag')].map(t => t.textContent.trim()),
  })));
  console.log('cards:', JSON.stringify(chips, null, 1));
  const allTags = chips.flatMap(c => c.tags);
  // The label carries ONE number and never a bare "0%" (owner, 2026-08-24: the "· 15/20" count
  // was ruled off the label for width and moved into the chip's title, which this cannot see).
  // A chip with no number at all is legal — it means no share exists to state.
  check('2. every goal chip states a real share, or none at all',
    allTags.length > 0 && allTags.every(t => !/%/.test(t) || /(<1|[1-9][0-9]*)%$/.test(t)),
    allTags.filter(t => /%/.test(t) && !/(<1|[1-9][0-9]*)%$/.test(t)).slice(0, 6));
  // ★ SELECTIVITY IS A PROPERTY OF THE CATALOGUE, NOT OF THE FIRST PAGE, and reading only the
  // first page was measuring the wrong thing. This list is sorted best-first, so its top three
  // are the broad flagship formulas — they genuinely deliver toward all five of the reader's
  // goals and SHOULD wear all five chips. The old form of this check asserted that one of those
  // three carried fewer than five, which held only while the chip's 0.30 bar was leaving 143 of
  // 149 products bare, i.e. it was passing BECAUSE of the defect the owner then reported.
  // The honest test walks to the other end of the same sort.
  const lastIdx = await p.evaluate(() => Math.max(...[...document.querySelectorAll('[data-rec-page]')]
    .map(x => Number(x.dataset.recPage)).filter(n => Number.isFinite(n))));
  await p.evaluate((n) => {
    const el = [...document.querySelectorAll('[data-rec-page]')].find(x => Number(x.dataset.recPage) === n);
    if (el) el.click();
  }, lastIdx);
  await sleep(400);
  const tail = await p.evaluate(() => [...document.querySelectorAll('.ck-recgrid .rec')]
    .map(c => [...c.querySelectorAll('.ck-tag')].length));
  check('2b. chips are SELECTIVE across the catalogue, not worn by every product',
    tail.length > 0 && tail.some(n => n === 0),
    { firstPage: chips.map(c => c.tags.length), lastPage: tail });
  check('2c. the strongest products carry MORE chips than the weakest — the chip discriminates',
    Math.max(...chips.map(c => c.tags.length)) > Math.max(0, ...tail),
    { firstPage: chips.map(c => c.tags.length), lastPage: tail });
  await p.evaluate(() => {
    const el = [...document.querySelectorAll('[data-rec-page]')].find(x => Number(x.dataset.recPage) === 0);
    if (el) el.click();
  });
  await sleep(300);

  // 2d — THE CHIPS SIT IN THEIR OWN ROW, AND THE + LANDS ON NONE OF THEM.
  // They used to be appended into .rec__meta, queueing behind the price / +new / formula size,
  // which left every card five and six wrapped lines deep. The owner picked this fix from four
  // he was shown (2026-08-24). The + is absolutely positioned at the card's bottom-right, so the
  // row beneath it must reserve its space — reserved on the LAST CHIP rather than across the
  // whole row, which is what keeps the line count down. Surveyed over 35 cards: with no
  // clearance at all the + lands on a chip on 8 of them, so a collision here means the
  // reservation was dropped, not that one card got unlucky.
  const cardShape = await p.evaluate(() => {
    const out = { cards: 0, chipsInMeta: 0, collisions: [], maxLines: 0 };
    for (const c of document.querySelectorAll('.ck-recgrid .rec')) {
      const tags = [...c.querySelectorAll('.ck-tag')];
      if (tags.length === 0) { continue; }
      out.cards += 1;
      out.chipsInMeta += c.querySelectorAll('.rec__meta .ck-tag').length;
      out.maxLines = Math.max(out.maxLines, new Set(tags.map(t => Math.round(t.getBoundingClientRect().top))).size);
      const plus = c.querySelector('.rec__add');
      if (!plus) { continue; }
      const a = plus.getBoundingClientRect();
      for (const t of tags) {
        const r = t.getBoundingClientRect();
        if (!(a.right < r.left || a.left > r.right || a.bottom < r.top || a.top > r.bottom)) {
          out.collisions.push(t.textContent.trim());
        }
      }
    }
    return out;
  });
  check('2d. the goal chips have a row of their own, never back in the meta line',
    cardShape.cards > 0 && cardShape.chipsInMeta === 0, cardShape);
  check('2e. the + button lands on no chip', cardShape.collisions.length === 0, cardShape);

  // 5 — nutrient options carry no scientific parenthetical
  const nut = await p.evaluate(() => {
    const s = document.querySelector('[data-rec-nutrient]');
    return [...s.options].map(o => o.textContent);
  });
  check('5. no nutrient option carries a scientific parenthetical',
    !nut.some(t => /\(/.test(t)), nut.filter(t => /\(/.test(t)).slice(0, 6));
  console.log('sample nutrient options:', JSON.stringify(nut.slice(0, 8)));

  // 4 — the FOODS block has the goal + nutrient filters, and they bite
  const foodCtl = await p.evaluate(() => ({
    goal: !!document.querySelector('#workspace-regimen-mount [data-food-goal]'),
    nutrient: !!document.querySelector('#workspace-regimen-mount [data-food-nutrient]'),
    cat: !!document.querySelector('[data-food-cat]'),
    q: !!document.querySelector('#workspace-regimen-mount [data-food-q]'),
  }));
  check('4. the foods block has goal AND nutrient filters', foodCtl.goal && foodCtl.nutrient, foodCtl);

  const before = await p.evaluate(() => [...document.querySelectorAll('#workspace-regimen-mount [data-food-page]')].map(x => x.textContent));
  const narrowed = await p.evaluate(async () => {
    const s = document.querySelector('#workspace-regimen-mount [data-food-nutrient]');
    const pick = [...s.options].find(o => /^Boron$/.test(o.textContent)) || [...s.options].find(o => o.value);
    s.value = pick.value;
    s.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 700));
    return {
      picked: pick.textContent,
      cards: [...document.querySelectorAll('.fs-card__name, .fs-food__name, .fs-card h4')].map(n => n.textContent.trim()).slice(0, 6),
      pages: [...document.querySelectorAll('#workspace-regimen-mount [data-food-page]')].map(x => x.textContent),
      anyCard: document.querySelectorAll('#workspace-regimen-mount [data-food-add]').length,
    };
  });
  console.log('foods nutrient filter:', JSON.stringify(narrowed));
  check('4b. a nutrient filter narrows the foods list',
    narrowed.pages.length < before.length || narrowed.anyCard > 0, { before: before.length, after: narrowed.pages.length, cards: narrowed.anyCard });

  const byGoal = await p.evaluate(async () => {
    const n = document.querySelector('#workspace-regimen-mount [data-food-nutrient]');
    n.value = '';
    n.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 500));
    const g = document.querySelector('#workspace-regimen-mount [data-food-goal]');
    const pick = [...g.options].find(o => o.value);
    g.value = pick.value;
    g.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 700));
    return { picked: pick.textContent, cards: document.querySelectorAll('#workspace-regimen-mount [data-food-add]').length };
  });
  check('4c. a goal filter returns foods', byGoal.cards > 0, byGoal);

  // 6 — boron reaches the surface
  await p.evaluate(async () => {
    const g = document.querySelector('#workspace-regimen-mount [data-food-goal]');
    g.value = '';
    g.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 400));
    const q = document.querySelector('#workspace-regimen-mount [data-food-q]');
    q.value = 'avocado';
    q.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 800));
  });
  const boron = await p.evaluate(() => {
    const txt = document.querySelector('#workspace-regimen-mount .fs-block').textContent.replace(/\s+/g, ' ');
    return { hasAvocado: /Avocado/i.test(txt), hasBoron: /BORON/i.test(txt), snippet: txt.slice(0, 260) };
  });
  check('6. boron reaches the food card', boron.hasAvocado && boron.hasBoron, boron);

  const el = await p.$('.ck-main');
  if (el) await el.screenshot({ path: OUT + '/X-regimen.png' });

  check('no page errors', errs.length === 0, errs);
  console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILED`);
  await b.close();
  process.exit(fails === 0 ? 0 : 1);
})();
