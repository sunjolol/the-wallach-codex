// tools/render_probe_journey.js — Journey drawer (J3 mount + J4 styling).
//
// Usage: node tools/render_probe_journey.js   (exit 0 = PASS, non-zero = FAIL)
//
// Verifies the Journey drawer is wired end-to-end and STYLED: the J rail item
// opens the new jd-* drawer (NOT the legacy teal #tab-journey fallback — that is
// the "kill the last teal" proof), the panel + chrome carry drawer-journey.css
// (computed width 600px, non-transparent head), a logged event renders a styled
// timeline entry, tabs switch, and Esc / bare-J close + reopen. Requires puppeteer.

const path = require('path');
const REPO = path.resolve(__dirname, '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
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

  const state = () => page.evaluate(() => {
    const el = document.getElementById('drawer-journey-mount');
    const head = el ? el.querySelector('.jd-head') : null;
    const legacy = document.getElementById('legacy-workspace-host');
    return {
      open: el ? el.classList.contains('jd-open') : null,
      hasHead: head !== null,
      tabCount: el ? el.querySelectorAll('.jd-tab').length : 0,
      hasLogBtn: el ? el.querySelector('.jd-action--primary') !== null : null,
      panelWidth: el ? getComputedStyle(el).width : null,
      headBg: head ? getComputedStyle(head).backgroundColor : null,
      legacyShown: legacy ? (getComputedStyle(legacy).display !== 'none') : null,
    };
  });

  // 1. closed at boot
  const boot = await state();

  // 2. rail J opens the new drawer
  await page.evaluate(() => document.querySelector('[data-rail-nav="journey"]')?.click());
  await wait(300);
  const afterOpen = await state();

  // 3. log an event -> exercises the timeline event styling with real data
  await page.evaluate(() => document.querySelector('#drawer-journey-mount [data-jd-action="log-event"]')?.click());
  await wait(200);
  await page.evaluate(() => { const i = document.querySelector('#drawer-journey-mount [data-jd-field="title"]'); if (i) { i.value = 'Probe test event'; } });
  await page.evaluate(() => document.querySelector('#drawer-journey-mount [data-jd-action="event-save"]')?.click());
  await wait(300);
  const timeline = await page.evaluate(() => {
    const root = document.getElementById('drawer-journey-mount');
    const ev = root ? root.querySelector('.jd-tl-event') : null;
    const glyph = ev ? ev.querySelector('.jd-tl-event__glyph') : null;
    const title = ev ? ev.querySelector('.jd-tl-event__title') : null;
    return {
      eventRendered: ev !== null,
      glyphBordered: glyph ? getComputedStyle(glyph).borderTopStyle === 'solid' : false,
      title: title ? title.textContent.trim() : null,
    };
  });

  // 4. tab switch
  await page.evaluate(() => document.querySelector('#drawer-journey-mount [data-jd-tab="goals"]')?.click());
  await wait(200);
  const afterTab = await page.evaluate(() => {
    const a = document.querySelector('#drawer-journey-mount .jd-tab.active');
    return { activeTab: a ? a.getAttribute('data-jd-tab') : null };
  });

  // 5. Esc closes, bare J reopens
  await page.keyboard.press('Escape');
  await wait(200);
  const afterEsc = await state();
  await page.keyboard.press('KeyJ');
  await wait(200);
  const afterJ = await state();

  const out = { boot, afterOpen, timeline, afterTab, afterEsc, afterJ };
  console.log('JOURNEY', JSON.stringify(out));
  console.log('PAGE_ERRORS', errs.length, errs.slice(0, 5).join(' | '));

  const checks = [
    ['drawer closed at boot', boot.open === false],
    ['rail J opens drawer', afterOpen.open === true && afterOpen.hasHead === true],
    ['four tabs render', afterOpen.tabCount === 4],
    ['LOG EVENT button present', afterOpen.hasLogBtn === true],
    ['panel styled (width 600px)', afterOpen.panelWidth === '600px'],
    ['head styled (non-transparent bg)', !!afterOpen.headBg && afterOpen.headBg !== 'rgba(0, 0, 0, 0)'],
    ['legacy host not shown (teal killed)', afterOpen.legacyShown === false],
    ['logged event renders styled timeline entry', timeline.eventRendered === true && timeline.glyphBordered === true],
    ['timeline event carries the logged title', /probe test event/i.test(timeline.title || '')],
    ['tab switch works', afterTab.activeTab === 'goals'],
    ['Esc closes drawer', afterEsc.open === false],
    ['bare J reopens drawer', afterJ.open === true],
    ['no page errors', errs.length === 0],
  ];
  const failed = checks.filter(([, ok]) => !ok).map(([n]) => n);
  await browser.close();
  if (failed.length) { console.log('FAIL', JSON.stringify(failed)); process.exit(1); }
  console.log('PASS · Journey drawer mounted + styled (rail J + Esc + bare J) · timeline event renders · legacy teal tab killed');
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
