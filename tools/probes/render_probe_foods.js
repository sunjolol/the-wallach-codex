// tools/probes/render_probe_foods.js — the FOOD SOURCES block, on both tabs.
//
// Usage: node tools/probes/render_probe_foods.js
//
// Proves the foods recommender actually RENDERS — on the Regimen console (three food cards
// ABOVE the products) and on the Coverage rail (three BELOW them) — and captures a
// screenshot of each for human eyes.
//
// ★ A DOM PROBE IS NOT A VISUAL CHECK. Everything below can pass while the block is
// invisible under an overlay, so the run also DISMISSES the welcome veil (.wc-veil, which
// covers a fresh profile's workspace and silently ruins every screenshot) and then asserts
// with elementFromPoint that the block is genuinely the topmost element at its own centre.
// The screenshots still need a person to look at them.

const path = require('path');
const fs = require('fs');
const REPO = path.resolve(__dirname, '..', '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER'); process.exit(2); }

const OUT = process.env.FOODS_SHOT_DIR || path.join(REPO, 'temporary');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto('file://' + path.join(REPO, 'dashboard', 'dashboard.html').replace(/\\/g, '/'),
    { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 900));

  // The welcome veil covers the workspace on a fresh profile. Dismiss it BEFORE anything else.
  const veil = await page.evaluate(() => {
    const btn = document.querySelector('.wc-veil .ui-close, .wc-veil [data-wc-close], .wc-veil button');
    if (btn) { btn.click(); return 'dismissed'; }
    return document.querySelector('.wc-veil') ? 'PRESENT-BUT-NO-BUTTON' : 'absent';
  });
  await new Promise(r => setTimeout(r, 400));
  console.log('welcome veil:', veil);

  const shots = [];

  async function visit(tab, label) {
    await page.evaluate((t) => {
      window.dispatchEvent(new CustomEvent('wallach:navigate', { detail: { to: t } }));
    }, tab);
    await new Promise(r => setTimeout(r, 800));

    const info = await page.evaluate(() => {
      // ★ BOTH workspaces stay in the DOM; the inactive one is simply hidden. A bare
      // querySelector returns whichever comes first in document order, which on Regimen
      // was the HIDDEN copy — reporting y=0 and "foods BELOW" for a block that is
      // actually above. Pick the one that is genuinely laid out.
      const blocks = [...document.querySelectorAll('.fs-block')]
        .filter(b => b.getBoundingClientRect().height > 0);
      const block = blocks[0];
      if (!block) return { present: false, hiddenCopies: document.querySelectorAll('.fs-block').length };
      const cards = [...block.querySelectorAll('.fs-tile')];
      const r = block.getBoundingClientRect();
      // elementFromPoint at the block's own centre — is it actually on top?
      const mid = document.elementFromPoint(r.left + r.width / 2, r.top + Math.min(40, r.height / 2));
      return {
        present: true,
        rule: (block.querySelector('.fs-rule__label') || {}).textContent || null,
        cards: cards.map(c => ({
          name: (c.querySelector('.fs-tile__name') || {}).textContent,
          portion: (c.querySelector('.fs-tile__meta') || {}).textContent,
          amount: ((c.querySelector('.fs-lead__pct') || {}).textContent || '')
            + ' ' + ((c.querySelector('.fs-lead__of') || {}).textContent || ''),
          gloss: (c.querySelector('.fs-lead') || {}).title,
          adds: (c.querySelectorAll('.fs-chip').length || 0) + ' chips',
        })),
        note: (block.querySelector('.fs-note') || {}).textContent || null,
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        topmostIsInsideBlock: mid ? block.contains(mid) : false,
        // where the block sits relative to the PRODUCT recs — the ruling was foods ABOVE
        // on Regimen and BELOW on Coverage, so this is the assertion that ruling survives
        productsY: (() => {
          const p = [...document.querySelectorAll('.ck-recgrid, [data-recs]')]
            .filter(e => e.getBoundingClientRect().height > 0)[0];
          return p ? Math.round(p.getBoundingClientRect().y) : null;
        })(),
      };
    });

    console.log(`\n── ${label} ──`);
    console.log('  block present      :', info.present);
    if (info.present) {
      console.log('  separator label    :', JSON.stringify(info.rule));
      console.log('  topmost at centre  :', info.topmostIsInsideBlock ? 'the block (good)' : 'SOMETHING ELSE (overlay?)');
      console.log('  block y / products y:', info.rect.y, '/', info.productsY,
        info.productsY === null ? '' : (info.rect.y < info.productsY ? '(foods ABOVE)' : '(foods BELOW)'));
      for (const c of info.cards) {
        console.log(`   · ${String(c.name).padEnd(26)} ${String(c.portion).padEnd(20)} ${String(c.amount).padEnd(20)} ${c.adds || ''}`);
      }
      if (info.cards[0]) console.log('  provenance gloss   :', JSON.stringify(info.cards[0].gloss));
      if (info.note) console.log('  note               :', JSON.stringify(info.note));
    }

    const file = path.join(OUT, `foods-${label.toLowerCase()}.png`);
    await page.screenshot({ path: file });
    shots.push(file);
    return info;
  }

  const regimen = await visit('regimen', 'Regimen');
  const coverage = await visit('coverage', 'Coverage');

  console.log('\npage errors:', errors.length ? errors.slice(0, 4) : 'none');
  console.log('screenshots:', shots.join('\n             '));

  const ok = regimen.present && coverage.present
    && regimen.cards.length > 0 && coverage.cards.length > 0
    && regimen.topmostIsInsideBlock && coverage.topmostIsInsideBlock
    && errors.length === 0;
  console.log('\nRESULT:', ok ? 'PASS (now look at the screenshots)' : 'ATTENTION NEEDED');
  await browser.close();
  process.exit(ok ? 0 : 1);
})();
