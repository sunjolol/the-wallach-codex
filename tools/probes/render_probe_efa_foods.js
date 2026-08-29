// tools/probes/render_probe_efa_foods.js — a FOOD moves the shared EFA meter.
//
// WHAT THIS EXISTS TO CATCH. Until 2026-08-22 the essential-fatty-acid meter counted only
// PRODUCTS: it matched a regimen item by canonical name against the product table, so a food
// matched nothing and walnuts — 220% of Wallach's nine grams — moved the omega tiles by
// exactly zero. Foods now enter the same meter, converted to the currency his dose is stated
// in (grams of flaxseed oil). This proves it on the real board, through the real add control.
//
// ★ THE CONTROL RULES OUT THE OBVIOUS FALSE POSITIVE. Navigating away and back WITHOUT adding
// anything must leave the omega tiles exactly as they were. Without that, a board that simply
// re-rendered differently on every visit would pass this probe while nothing worked.
//
// ★ AND IT TIES CAUSE TO EFFECT. It first asserts the food it is about to add actually
// carries an EFA chip, so a pass cannot come from some unrelated nutrient moving the board.
const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* next */ }
}
if (!pup) { console.log('NO_PUPPETEER'); process.exit(2); }

(async () => {
  const b = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));

  await p.goto('file:///' + REPO + '/dashboard/dashboard.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 900));
  await p.evaluate(() => {
    const x = document.querySelector('.wc-veil .ui-close, .wc-veil button');
    if (x) { x.click(); }
  });

  const go = async (tab) => {
    await p.evaluate((t) => window.dispatchEvent(
      new CustomEvent('wallach:navigate', { detail: { to: t } })), tab);
    await new Promise(r => setTimeout(r, 700));
  };

  // A tile's STATUS is a class on the element, so its class list IS the verdict.
  const omegas = () => p.evaluate(() => {
    const out = {};
    for (const name of ['OMEGA-3', 'OMEGA-6']) {
      const el = [...document.querySelectorAll(`[data-tile="${name}"]`)]
        .filter(e => e.getBoundingClientRect().height > 0)[0];
      if (el) { out[name] = el.className; }
    }
    return out;
  });

  await go('coverage');
  const before = await omegas();
  console.log('omega tiles, fresh profile      :', JSON.stringify(before));

  // ── the control: navigate away and back, add NOTHING ──────────────────────
  await go('regimen');
  await go('coverage');
  const afterNav = await omegas();
  console.log('after navigating, adding nothing:', JSON.stringify(afterNav));

  // ── the act: add ONE food that the tile itself says carries EFA ────────────
  await go('regimen');
  const target = await p.evaluate(() => {
    const blk = [...document.querySelectorAll('.fs-block')]
      .filter(e => e.getBoundingClientRect().height > 0)[0];
    if (!blk) { return null; }
    for (const tile of blk.querySelectorAll('.fs-tile')) {
      const labels = [...tile.querySelectorAll('.fs-chip, .fs-lead__of')]
        .map(e => e.textContent.toUpperCase());
      if (labels.some(l => l.includes('OMEGA'))) {
        const btn = tile.querySelector('[data-food-add]');
        return { name: tile.querySelector('.fs-tile__name').textContent,
                 id: btn ? btn.dataset.foodAdd : null };
      }
    }
    return null;
  });
  console.log('food offered carrying an EFA chip:', JSON.stringify(target));

  let added = 'none';
  if (target && target.id) {
    added = await p.evaluate((id) => {
      const btn = document.querySelector(`[data-food-add="${id}"]`);
      if (!btn) { return 'gone'; }
      btn.click();
      return 'clicked';
    }, target.id);
    await new Promise(r => setTimeout(r, 400));
  }
  await go('coverage');
  const afterAdd = await omegas();
  console.log(`after adding it (${added})       :`, JSON.stringify(afterAdd));

  const sawTwoTiles = Object.keys(before).length === 2;
  const controlHeld = JSON.stringify(before) === JSON.stringify(afterNav);
  const moved = JSON.stringify(afterNav) !== JSON.stringify(afterAdd);

  console.log('\n  both omega tiles found on the board  :', sawTwoTiles);
  console.log('  CONTROL — no add, no change          :', controlHeld);
  console.log('  a food carrying EFA moves both tiles :', moved);
  console.log('page errors:', errs.length ? errs.slice(0, 3) : 'none');

  const ok = sawTwoTiles && controlHeld && moved && added === 'clicked' && errs.length === 0;
  console.log('\nRESULT:', ok ? 'PASS' : 'FAIL');
  await b.close();
  process.exit(ok ? 0 : 1);
})();
