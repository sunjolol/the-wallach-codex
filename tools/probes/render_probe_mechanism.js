// tools/probes/render_probe_mechanism.js — the per-element MECHANISM design block (selenium).
// Drives the selenium entity page and asserts the data-driven "rancidity mechanism" hero renders:
// the block, its figure, 3 beats, the sourced pull-stat, Wallach's highlighted quote, the category
// (mineral=blue) accent, and Best-Youngevity sources docked at the BOTTOM of the block. Exit 0/1.
const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
let puppeteer;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { puppeteer = require(c); break; } catch (e) {}
}
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1180, height: 1500, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  const url = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 400));
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('a,button,[role="button"]')].find(e => /just browsing/i.test(e.textContent || ''));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => document.querySelector('[data-rail-nav="knowledge"]')?.click());
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-tab="essentials"]')?.click());
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-essential="Selenium"]')?.click());
  await new Promise(r => setTimeout(r, 600));

  const s = await page.evaluate(() => {
    const root = document.querySelector('#drawer-knowledge-mount');
    const mech = root?.querySelector('.kd-ep-fam--mech');
    const container = mech?.closest('.kd-essential-deep');
    // best-sources must sit INSIDE the mech block (docked at its bottom), not up in the glance
    const srcInMech = !!mech?.querySelector('.kd-ep-op__srclabel');
    const srcInGlance = !!root?.querySelector('.kd-ep-glance .kd-ep-op__srclabel, .kd-ep-op .kd-ep-op__srclabel');
    return {
      mech: !!mech,
      figure: !!mech?.querySelector('.kd-ep-fam__art--mech'),
      beats: mech?.querySelectorAll('.kd-ep-fam__step').length || 0,
      statNum: mech?.querySelector('.kd-ep-fam__statnum')?.textContent?.trim() || '',
      quote: !!mech?.querySelector('.ds-pull-quote'),
      mark: !!mech?.querySelector('.ds-mark'),
      accent: mech ? getComputedStyle(mech).getPropertyValue('--kd-ep-fam').trim() : '',
      dataCat: container?.getAttribute('data-category') || '',
      srcInMech,
    };
  });

  const checks = [
    ['mechanism block renders', s.mech],
    ['membrane figure renders', s.figure],
    ['exactly 3 beats', s.beats === 3],
    ['pull-stat present (13 -> 1)', /13/.test(s.statNum) && /1/.test(s.statNum)],
    ['Wallach quote present', s.quote],
    ['highlight mark present', s.mark],
    ['category = mineral', s.dataCat === 'mineral'],
    ['accent = mineral blue #2b6fb0', s.accent.toLowerCase() === '#2b6fb0'],
    ['Best-Youngevity sources docked at block bottom', s.srcInMech],
    ['no page errors', errors.length === 0],
  ];
  await browser.close();
  const fails = checks.filter(c => !c[1]).map(c => c[0]);
  console.log('MECH ' + JSON.stringify(s));
  if (fails.length > 0 || errors.length > 0) {
    console.log('FAIL ' + JSON.stringify(fails) + (errors.length ? ' ' + JSON.stringify(errors) : ''));
    process.exit(1);
  }
  console.log('PASS · selenium mechanism block · figure + 3 beats + sourced stat + highlighted quote + mineral-blue accent + sources-at-bottom');
})().catch(e => { console.log('ERR ' + e.message); process.exit(1); });
