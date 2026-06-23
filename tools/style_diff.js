// tools/style_diff.js — objective computed-style diff: the LIVE shell vs a mockup.
//
// Usage:  node tools/style_diff.js [mockupRelPath]
//   default mockup: dashboard/components/workspace-coverage-v3.2-PROPOSAL.html
//
// WHY THIS EXISTS (2026-06-23 lesson): when matching a surface to a v3 mockup,
// do NOT eyeball it and do NOT trust a CSS read — both mislead. This loads the
// live dashboard.html AND the mockup headless, compares getComputedStyle() for a
// selector list, and prints ONLY the deltas. Fix until `TOTAL DIFFS: 0`. Residual
// diffs where the LIVE uses a correct --ds-* token vs the mockup's UNSET browser
// default (black / Times New Roman) are the live being BETTER than the demo — keep
// them. See .claude/rules/visual-verification.md "Getting to exact".
//
// Edit SELS / PROPS for the surface you are matching.
const path = require('path');
const REPO = path.resolve(__dirname, '..');
let pup;
for (const c of [REPO + '/dashboard/node_modules/puppeteer', REPO + '/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer in dashboard/)'); process.exit(2); }

const mock = process.argv[2] || 'dashboard/components/workspace-coverage-v3.2-PROPOSAL.html';
const toUrl = rel => 'file://' + path.join(REPO, rel).split(path.sep).join('/');
const LIVE = toUrl('dashboard/dashboard.html');
const MOCK = toUrl(mock);

const SELS = [
  '.app-topbar', '.topbar__workspace-tag', '.topbar__title', '.topbar__sub',
  '.topbar__cmd', '.topbar__cmd-input', '.topbar__cmd-kbd', '.telemetry__item',
  '.app-rail', '.rail__brand-name', '.rail__item', '.app-footer',
];
const PROPS = ['color', 'backgroundColor', 'backgroundImage', 'borderTopLeftRadius',
  'boxShadow', 'opacity', 'borderTopColor', 'borderTopWidth', 'borderTopStyle',
  'fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'paddingTop', 'paddingLeft', 'textTransform'];

async function grab(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  return page.evaluate((SELS, PROPS) => {
    const out = {};
    for (const s of SELS) {
      const el = document.querySelector(s);
      if (!el) { out[s] = null; continue; }
      const cs = getComputedStyle(el);
      const o = {};
      PROPS.forEach(p => { o[p] = cs[p]; });
      o['::after bg-image'] = getComputedStyle(el, '::after').backgroundImage;
      out[s] = o;
    }
    return out;
  }, SELS, PROPS);
}

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const live = await grab(await browser.newPage(), LIVE);
  const mockv = await grab(await browser.newPage(), MOCK);
  await browser.close();
  let total = 0;
  for (const s of SELS) {
    const L = live[s], M = mockv[s];
    if (!L || !M) { console.log(`\n[${s}] MISSING ${!L ? 'LIVE' : 'MOCK'}`); continue; }
    const d = Object.keys(M).filter(k => L[k] !== M[k])
      .map(k => `    ${k}:\n      live= ${L[k]}\n      mock= ${M[k]}`);
    total += d.length;
    console.log(d.length ? `\n[${s}]  ${d.length} diff(s):\n${d.join('\n')}` : `\n[${s}]  MATCH`);
  }
  console.log(`\nTOTAL DIFFS: ${total}`);
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
