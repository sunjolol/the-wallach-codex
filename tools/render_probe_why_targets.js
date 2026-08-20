// tools/render_probe_why_targets.js — the "why this number?" provenance hover.
//
// Usage: node tools/render_probe_why_targets.js
//
// WHY THIS EXISTS (§00.B drift backstop). Every essential that shows a numeric
// Wallach daily target also shows a "why this number?" tooltip whose text ends in
// that same number (e.g. Boron: target "9.2 mg" · why "…≈ 9.2 mg/day."). The number
// lives in TWO places — the coverage-computed target (screen) and the hand/generated
// `why` prose in entity-copy.json — so it can silently DRIFT. No invariant catches
// this: the board is Python-only and cannot render the scaled/converted target. This
// probe is the truth anchor — it opens each essential that carries a `why` and asserts
//   (a) the why renders, and
//   (b) the displayed target's numeric value appears literally in the why text.
// It fails loudly if a target is re-derived (scale factor, IU conversion, rounding)
// without the why being updated, or vice versa.
const path = require('path');
const fs = require('fs');
const REPO = path.resolve(__dirname, '..');
let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* next */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

const DATA = path.join(REPO, 'dashboard', 'assets', 'data');
const entityCopy = JSON.parse(fs.readFileSync(path.join(DATA, 'entity-copy.json'), 'utf8'));
const targets = JSON.parse(fs.readFileSync(path.join(DATA, 'essentials-targets-data.json'), 'utf8')).essentials;
const skeleton = JSON.parse(fs.readFileSync(path.join(DATA, 'coverage-layout-skeleton.json'), 'utf8'));

// slug -> display name (targets), and the set of layout keys (skeleton)
const nameBySlug = {};
for (const e of targets) nameBySlug[e.slug] = e.name;
const keys = [];
(function walk(o) {
  if (Array.isArray(o)) o.forEach(walk);
  else if (o && typeof o === 'object') {
    if (typeof o.key === 'string') keys.push(o.key);
    Object.values(o).forEach(walk);
  }
})(skeleton);
function keyForSlug(slug) {
  const nm = nameBySlug[slug];
  if (!nm) return null;
  return keys.find(k => k === nm || k.startsWith(nm + ' (')) || null;
}

// every essential that carries a `why`
const whySlugs = Object.entries(entityCopy.essentials || {})
  .filter(([, v]) => v && typeof v.why === 'string' && v.why.trim().length > 0)
  .map(([slug]) => slug);

const PROFILE = { browsing: true, chosenAt: '2026-08-20', accent: 'ember' };
const URL = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');

async function inspect(browser, key) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1240, height: 1400, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.evaluateOnNewDocument((p) => {
    try { localStorage.clear(); localStorage.setItem('wallachUserProfile_v1', JSON.stringify(p)); } catch (e) {}
  }, PROFILE);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 450));
  await page.evaluate(() => document.querySelector('[data-rail-nav="knowledge"]')?.click());
  await new Promise(r => setTimeout(r, 220));
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-tab="essentials"]')?.click());
  await new Promise(r => setTimeout(r, 220));
  const clicked = await page.evaluate((k) => {
    const el = document.querySelector(`#drawer-knowledge-mount [data-kd-essential="${k}"]`);
    if (el) { el.click(); return true; } return false;
  }, key);
  await new Promise(r => setTimeout(r, 550));
  const info = await page.evaluate(() => {
    const root = document.querySelector('#drawer-knowledge-mount');
    const op = root?.querySelector('.kd-ep-op');
    return {
      target: op?.querySelector('.kd-ep-v')?.textContent?.trim() || null,
      tip: root?.querySelector('.kd-ep-why .kd-ep-tip')?.textContent?.trim() || null,
    };
  });
  await page.close();
  return { clicked, ...info, errs };
}

let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  PASS  ' : '  FAIL  ') + msg); if (!cond) fails++; };

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files'] });
  console.log(`checking ${whySlugs.length} essentials that carry a why…\n`);
  for (const slug of whySlugs) {
    const key = keyForSlug(slug);
    if (!key) { ok(false, `${slug}: no layout key found`); continue; }
    const r = await inspect(browser, key);
    if (!r.clicked) { ok(false, `${slug}: tile [data-kd-essential="${key}"] not clickable`); continue; }
    if (r.errs.length) { ok(false, `${slug}: page error ${JSON.stringify(r.errs)}`); continue; }
    if (!r.tip) { ok(false, `${slug}: why tooltip did not render`); continue; }
    if (!r.target) { ok(false, `${slug}: no displayed target (why present but no number on screen)`); continue; }
    const num = r.target.split(/\s+/)[0];   // e.g. "9.2" from "9.2 mg", "1,000" from "1,000 mcg"
    ok(r.tip.includes(num), `${slug}: target "${r.target}" · why names it (${r.tip.includes(num) ? 'yes' : 'NO — «' + r.tip.slice(0, 90) + '»'})`);
  }
  await browser.close();
  console.log(fails ? `\n${fails} FAILURE(S)` : `\nPASS · all ${whySlugs.length} why blurbs name their on-screen target number`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log('ERR ' + e.message); process.exit(1); });
