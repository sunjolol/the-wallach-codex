/* Drive the disclaimer layer for real: click it open, prove the welcome is STILL
   there behind it, close it three ways, and photograph both states.

   The specific contract asked for is "opens ANOTHER popup WITHOUT closing the previous
   popup" — so the assertion that matters is not "the disclaimer is visible", it is
   "the welcome is visible AT THE SAME TIME". */
const path = require('path');
const fs = require('fs');
const REPO = path.resolve(__dirname, '..', '..');
let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* next */ }
}
if (!pup) { console.log('NO_PUPPETEER'); process.exit(2); }

const URL = process.env['PROBE_URL']
  || ('file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/'));
const OUT = process.env['OG_OUT'] || __dirname;

let fails = 0;
const ok = (name, cond, detail) => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}  ${detail === undefined ? '' : JSON.stringify(detail)}`);
  if (!cond) { fails++; }
};

(async () => {
  const b = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1 });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'networkidle0', timeout: 90000 });
  await new Promise(r => setTimeout(r, 1800));

  const vis = (sel) => p.evaluate((s) => {
    const e = document.querySelector(s);
    if (!e) { return null; }
    const r = e.getBoundingClientRect();
    const cs = getComputedStyle(e);
    return { w: Math.round(r.width), h: Math.round(r.height), display: cs.display,
             visible: r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden' };
  }, sel);

  // ── arrival ────────────────────────────────────────────────────────────────
  ok('the welcome veil is up on a fresh profile', (await vis('.wc-veil'))?.visible === true);
  const link = await p.evaluate(() => {
    const e = document.querySelector('[data-legal-open]');
    if (!e) { return null; }
    const cs = getComputedStyle(e);
    return { text: e.textContent.trim(), transform: cs.textTransform,
             size: cs.fontSize, rendered: e.getBoundingClientRect().width > 0 };
  });
  ok('a DISCLAIMER link exists in the welcome', link !== null && link.rendered, link);
  ok('it renders uppercase, as asked', link?.transform === 'uppercase', link?.transform);

  const legalBefore = await vis('.wc-legal');
  ok('the disclaimer starts CLOSED', legalBefore?.display === 'none', legalBefore?.display);
  await p.screenshot({ path: path.join(OUT, 'legal-1-welcome.png') });

  // ── open it ────────────────────────────────────────────────────────────────
  await p.click('[data-legal-open]');
  await new Promise(r => setTimeout(r, 450));

  const legal = await vis('.wc-legal__box');
  const wcStill = await vis('.wc');
  ok('the disclaimer opened', legal?.visible === true, legal);
  ok('★ the WELCOME IS STILL OPEN behind it', wcStill?.visible === true, wcStill);

  const stack = await p.evaluate(() => {
    const l = document.querySelector('.wc-legal');
    const v = document.querySelector('.wc-veil');
    return { legalZ: getComputedStyle(l).zIndex, veilZ: getComputedStyle(v).zIndex,
             legalInsideVeil: v.contains(l) };
  });
  ok('the disclaimer stacks ABOVE the veil', Number(stack.legalZ) > Number(stack.veilZ), stack);

  const closeBtns = await p.evaluate(() =>
    [...document.querySelectorAll('[data-legal-close]')].map(e => e.getAttribute('aria-label') || e.textContent.trim()));
  ok('it has a close control', closeBtns.length >= 1, closeBtns);

  const body = await p.evaluate(() => (document.querySelector('.wc-legal__box')?.innerText || ''));
  for (const need of ['not medical advice', 'FDA', 'not affiliated', 'emergency', 'warranty', 'Wallach']) {
    ok(`the copy covers: ${need}`, body.toLowerCase().includes(need.toLowerCase()));
  }
  ok('the disclaimer is scrollable if it overflows',
    (await p.evaluate(() => { const e = document.querySelector('.wc-legal__box'); return getComputedStyle(e).overflowY; })) === 'auto');
  await p.screenshot({ path: path.join(OUT, 'legal-2-open.png') });

  // ── close by the X ─────────────────────────────────────────────────────────
  await p.click('.wc-legal__x');
  await new Promise(r => setTimeout(r, 350));
  ok('the X closes the disclaimer', (await vis('.wc-legal'))?.display === 'none');
  ok('★ and the WELCOME SURVIVES the close', (await vis('.wc'))?.visible === true);

  // ── Escape closes only the top layer ───────────────────────────────────────
  await p.click('[data-legal-open]');
  await new Promise(r => setTimeout(r, 300));
  await p.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 350));
  ok('Escape closes the disclaimer', (await vis('.wc-legal'))?.display === 'none');
  ok('★ Escape does NOT dismiss the welcome underneath', (await vis('.wc'))?.visible === true);

  // ── typed state survives opening the disclaimer ────────────────────────────
  await p.type('[data-name]', 'Luneth');
  await p.click('[data-legal-open]');
  await new Promise(r => setTimeout(r, 300));
  await p.click('.wc-legal__x');
  await new Promise(r => setTimeout(r, 300));
  const kept = await p.evaluate(() => document.querySelector('[data-name]')?.value);
  ok('★ a half-typed name survives the round trip', kept === 'Luneth', kept);

  ok('no page errors', errs.length === 0, errs.slice(0, 3));

  await b.close();
  console.log(fails === 0 ? '\nALL PASS · the disclaimer layers over the welcome and never dismisses it'
                          : `\nFAILED: ${fails}`);
  process.exit(fails === 0 ? 0 : 1);
})();
