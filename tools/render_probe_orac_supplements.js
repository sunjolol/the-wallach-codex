// tools/render_probe_orac_supplements.js — ORAC "Best Supplement Sources" section + cross-nav (exit 0 = PASS).
//
// Usage: node tools/render_probe_orac_supplements.js
//
// Guards the §07 supplement league-table added 2026-07-24: the ORAC tab renders a leader card + rows
// (each a Youngevity product with an official per-serving ORAC), clicking a row opens that product's
// detail page with an ORAC breadcrumb AND an origin-aware "‹ Go back" button that returns to ORAC,
// while a product opened normally from the Products tab still reads "‹ All products". Requires puppeteer.

const path = require('path');
const REPO = path.resolve(__dirname, '..');
let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* next */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  const url = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.log('GOTO_ERR', e.message));
  await wait(1500);
  await page.evaluate(() => { const v = document.querySelector('.wc-veil'); const b = v ? [...v.querySelectorAll('button,a')].find(x => /browsing/i.test(x.textContent || '')) : null; if (b) b.click(); });
  await wait(300);
  await page.evaluate(() => document.querySelector('[data-rail-nav="knowledge"]')?.click()); await wait(400);
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-tab="orac"]')?.click()); await wait(500);

  const section = await page.evaluate(() => {
    const s = document.querySelector('#supplements');
    return s ? {
      leader: s.querySelector('.kd-orac-supp__leader') !== null,
      rows: s.querySelectorAll('.kd-orac-supp__row').length,
      badges: s.querySelectorAll('.kd-orac-supp__form').length,
      leaderTinted: (s.querySelector('.kd-orac-supp__leader')?.getAttribute('style') || '').includes('--fc'),
    } : null;
  });

  // open the leader from ORAC -> expect "Go back" + ORAC crumb + returns to ORAC
  await page.evaluate(() => document.querySelector('.kd-orac-supp__leader')?.click()); await wait(500);
  const viaOrac = await page.evaluate(() => {
    const root = document.querySelector('#drawer-knowledge-mount');
    return {
      back: (root.querySelector('.kd-ep-back')?.textContent || '').trim(),
      crumbs: [...root.querySelectorAll('.kd-crumb')].map(c => c.textContent.trim()),
      detail: root.querySelector('.kd-ep-back') !== null,
    };
  });
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount .kd-ep-back')?.click()); await wait(400);
  const afterBack = await page.evaluate(() => ({ tab: (document.querySelector('#drawer-knowledge-mount .kd-knh__tab.active')?.textContent || '').trim(), onOrac: document.querySelector('#supplements') !== null }));

  // open a product normally from the Products tab -> expect "All products"
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-tab="products"]')?.click()); await wait(500);
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-product]')?.click()); await wait(500);
  const viaProducts = await page.evaluate(() => (document.querySelector('#drawer-knowledge-mount .kd-ep-back')?.textContent || '').trim());

  const checks = [
    ['section renders (leader + >=5 rows + badges)', section !== null && section.leader && section.rows >= 5 && section.badges >= 6],
    ['leader accent is form-tinted (inline --fc), not fixed orange', section !== null && section.leaderTinted === true],
    ['open-from-ORAC: product detail shows', viaOrac.detail === true],
    ['open-from-ORAC: back button reads "Go back"', /go back/i.test(viaOrac.back)],
    ['open-from-ORAC: breadcrumb includes an ORAC crumb', viaOrac.crumbs.some(c => /orac/i.test(c))],
    ['"Go back" returns to the ORAC tab', afterBack.tab.toUpperCase() === 'ORAC' && afterBack.onOrac === true],
    ['open-from-Products: back button still reads "All products"', /all products/i.test(viaProducts)],
    ['no page errors', errs.length === 0],
  ];
  console.log('SECTION', JSON.stringify(section), '| viaOrac', JSON.stringify(viaOrac), '| afterBack', JSON.stringify(afterBack), '| viaProducts', JSON.stringify(viaProducts));
  const failed = checks.filter(([, ok]) => !ok).map(([n]) => n);
  await browser.close();
  if (failed.length) { console.log('FAIL:\n  - ' + failed.join('\n  - ')); if (errs.length) console.log('ERRS', errs.slice(0, 4)); process.exit(1); }
  console.log('ORAC SUPPLEMENTS PROBE OK — ' + checks.length + '/' + checks.length + ' checks passed');
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
