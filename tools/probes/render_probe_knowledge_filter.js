// tools/probes/render_probe_knowledge_filter.js — Knowledge drawer filter-reset on close/reopen (exit 0 = PASS).
//
// Usage: node tools/probes/render_probe_knowledge_filter.js
//
// Regression guard: filtering within Conditions / Explore / Products, then CLOSING
// and RE-OPENING the drawer, left the stale query in effect — Home rendered "nothing in home matches X"
// with no search box to clear it (close() reset activeTab + selections + trail but NOT searchQuery). This
// probe filters each of those tabs with a nonsense term, confirms the filter engaged (the empty affordance
// shows), closes + re-opens, and asserts the re-opened Home is CLEAN: on the Home tab, no empty affordance,
// no lingering query. Requires puppeteer.

const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }
const wait = ms => new Promise(r => setTimeout(r, ms));

const NONSENSE = 'zzqxwvno';
const TABS = ['conditions', 'explore', 'products'];

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  const url = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.log('GOTO_ERR', e.message));
  await wait(1500);
  // dismiss the welcome veil if present
  await page.evaluate(() => {
    const veil = document.querySelector('.wc-veil');
    const btn = veil ? [...veil.querySelectorAll('button, a')].find(b => /browsing/i.test(b.textContent || '')) : null;
    if (btn) btn.click();
  });
  await wait(300);

  const KD = '#drawer-knowledge-mount';
  const isOpen = () => page.evaluate((s) => document.querySelector(s)?.classList.contains('kd-open') === true, KD);
  const openDrawer = async () => { if (!(await isOpen())) { await page.evaluate(() => document.querySelector('[data-rail-nav="knowledge"]')?.click()); await wait(350); } };
  const closeDrawer = async () => { await page.evaluate((s) => document.querySelector(s + ' [data-kd-action="close"]')?.click(), KD); await wait(300); };

  const fails = [];
  for (const tab of TABS) {
    await openDrawer();
    await page.evaluate((a) => document.querySelector(a.KD + ' [data-kd-tab="' + a.tab + '"]')?.click(), { KD, tab });
    await wait(250);
    // type a nonsense filter term
    await page.evaluate((a) => {
      const i = document.querySelector(a.KD + ' .kd-search-input');
      if (i) { i.value = a.q; i.dispatchEvent(new Event('input', { bubbles: true })); }
    }, { KD, q: NONSENSE });
    await wait(250);
    const engaged = await page.evaluate((s) => document.querySelector(s + ' .kd-search-empty') !== null, KD);

    await closeDrawer();
    await openDrawer();
    const after = await page.evaluate((s) => {
      const root = document.querySelector(s);
      const activeTab = (root?.querySelector('.kd-knh__tab.active')?.textContent || '').trim();
      const input = root?.querySelector('.kd-search-input');
      return {
        activeTab,
        emptyShown: root?.querySelector('.kd-search-empty') !== null,
        hasQueryClass: root?.querySelector('.kd-search.has-query') !== null,
        inputValue: input ? input.value : '',
      };
    }, KD);

    const engagedOk = engaged === true;             // filter really ran in the origin tab
    const cleanOk = after.activeTab === 'Home' && after.emptyShown === false && after.hasQueryClass === false && after.inputValue === '';
    const pass = engagedOk && cleanOk;
    console.log((pass ? 'PASS ' : 'FAIL ') + tab + '  -> engaged=' + engaged + '  reopen{tab=' + after.activeTab + ' empty=' + after.emptyShown + ' hasQuery=' + after.hasQueryClass + " inputVal='" + after.inputValue + "'}");
    if (!engagedOk) fails.push(tab + ': filter never engaged (probe could not exercise the path)');
    if (!cleanOk) fails.push(tab + ': re-opened drawer still carries a stale filter on Home');
    await closeDrawer();
  }

  if (errs.length) { console.log('PAGE ERRORS:', errs); fails.push('page errors present'); }
  await browser.close();
  if (fails.length) {
    console.log('\nFAILED:');
    for (const f of fails) console.log('  - ' + f);
    process.exit(1);
  }
  console.log('\nKNOWLEDGE FILTER-RESET PROBE OK — ' + TABS.length + '/' + TABS.length + ' tabs clean after close/reopen');
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
