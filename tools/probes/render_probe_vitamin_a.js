// render_probe_vitamin_a.js — per-element probe for the vitamin A header + a REGRESSION
// pass on selenium (a shipped header) so the shared renderer/CSS can't drift it unnoticed.
// Run: node tools/probes/render_probe_vitamin_a.js
const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
let puppeteer;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { puppeteer = require(c); break; } catch (e) { /* try next */ }
}
if (!puppeteer) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1500, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  const url = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(500);
  await page.evaluate(() => { const b = [...document.querySelectorAll('a,button,[role="button"]')].find(e => /just browsing/i.test(e.textContent || '')); if (b) b.click(); });
  await sleep(250);
  await page.evaluate(() => document.querySelector('[data-rail-nav="knowledge"]')?.click());
  await sleep(350);
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-tab="essentials"]')?.click());
  await sleep(350);

  const openEssential = async (name) => {
    await page.evaluate(n => document.querySelector(`#drawer-knowledge-mount [data-kd-essential="${n}"]`)?.click(), name);
    await sleep(700);
  };
  const backToList = async () => {
    await page.evaluate(() => (document.querySelector('#drawer-knowledge-mount [data-kd-action="essential-close"]')
      || document.querySelector('#drawer-knowledge-mount .kd-ep-hero__back'))?.click());
    await sleep(300);
    await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-tab="essentials"]')?.click());
    await sleep(300);
  };

  const readVita = () => page.evaluate(() => {
    const mech = document.querySelector('#drawer-knowledge-mount .kd-ep-fam--mech');
    const deep = mech?.closest('.kd-essential-deep');
    if (!mech) { return { mech: false }; }
    return {
      mech: true,
      vita: mech.classList.contains('kd-ep-fam--vita'),
      cards: mech.querySelectorAll('.mkA-card').length,
      pts: mech.querySelectorAll('.mkA-pt').length,
      chipUp: mech.querySelectorAll('.mkA-pt--up .mkA-pt__chip').length,
      chipDown: mech.querySelectorAll('.mkA-pt--down .mkA-pt__chip').length,
      sectionLabel: (mech.querySelector('.mk-section-label')?.textContent || '').trim(),
      explain: !!mech.querySelector('.mk-explain'),
      curio: !!mech.querySelector('.mk-curio'),
      curioHead: (mech.querySelector('.mk-curio__head')?.textContent || '').trim(),
      curioCite: !!mech.querySelector('.mk-curio__cite'),
      quotes: mech.querySelectorAll('.ds-pull-quote').length,
      mark: (mech.querySelector('.ds-mark')?.textContent || '').trim(),
      note: !!mech.querySelector('.kd-ep-fam__note'),
      srcInMech: !!mech.querySelector('.kd-ep-op__srclabel'),
      symBox: (deep?.querySelector('.kd-ep-hero__sym')?.textContent || '').trim(),
      meta: (deep?.querySelector('.kd-ep-hero__meta')?.textContent || '').trim(),
      noSciSub: !deep?.querySelector('.kd-ep-hero__sci'),
    };
  });
  const readSel = () => page.evaluate(() => {
    const mech = document.querySelector('#drawer-knowledge-mount .kd-ep-fam--mech');
    if (!mech) { return { mech: false }; }
    return {
      mech: true,
      beats: mech.querySelectorAll('.kd-ep-fam__step').length,
      splitCells: mech.querySelectorAll('.kd-ep-fam__splitcell').length,
      figs: mech.querySelectorAll('.kd-ep-fam__art').length,
      statNum: (mech.querySelector('.kd-ep-fam__statnum')?.textContent || '').trim(),
      vitaBlocks: mech.querySelectorAll('.mkA-card, .mk-curio, .mk-explain, .mk-section-label').length,
    };
  });

  await openEssential('Vitamin A (Retinol / beta-carotene)');
  const v = await readVita();
  await backToList();
  await openEssential('Selenium');
  const se = await readSel();

  const checks = [
    ['vitamin A mechanism renders', v.mech === true],
    ['carries the kd-ep-fam--vita scope', v.vita === true],
    ['two comparison cards', v.cards === 2],
    ['four pro/con rows', v.pts === 4],
    ['two PRO chips + two CON chips', v.chipUp === 2 && v.chipDown === 2],
    ['In practice section label', v.sectionLabel === 'In practice'],
    ['explainer callout present', v.explain === true],
    ['curio present with a headline', v.curio === true && v.curioHead.length > 10],
    ['curio cite present', v.curioCite === true],
    ['exactly ONE pull-quote', v.quotes === 1],
    ['highlight is the carotene-conversion phrase', /poor conversion of carotene/.test(v.mark)],
    ['disclaimer note in the frame', v.note === true],
    ['sources docked in the block', v.srcInMech === true],
    ['element box shows the letter A', v.symBox === 'A'],
    ['meta line leads with Retinol', /^Retinol\b/i.test(v.meta)],
    ['no separate scientific subtitle row', v.noSciSub === true],
    ['no page errors', errors.length === 0],
    // ── regression: selenium (a signed-off header) must be untouched ──
    ['selenium still renders', se.mech === true],
    ['selenium keeps its 3 stacked beats', se.beats === 3],
    ['selenium has no split', se.splitCells === 0],
    ['selenium keeps one figure', se.figs === 1],
    ['selenium keeps its 13 -> 1 stat', /13/.test(se.statNum)],
    ['selenium did NOT gain vitamin-A blocks', se.vitaBlocks === 0],
  ];

  let bad = 0;
  for (const [name, ok] of checks) { if (!ok) { bad++; console.log('FAIL ·', name); } }
  console.log(bad === 0
    ? `PASS · render_probe_vitamin_a · ${checks.length}/${checks.length} checks`
    : `FAIL · render_probe_vitamin_a · ${bad} of ${checks.length}`);
  if (bad !== 0) { console.log(JSON.stringify({ v, se }, null, 1).slice(0, 3500)); }
  await browser.close();
  process.exit(bad === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
