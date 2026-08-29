#!/usr/bin/env node
/*
 * make_share_card.js — generate the 1200x630 social share card (og:image).
 *
 *   node tools/make_share_card.js            # writes the card into the repo
 *   node tools/make_share_card.js --check    # verify only, write nothing
 *
 * WHY THIS IS GENERATED, NOT DRAWN. The card carries the app's own palette, its
 * own display face, and its own coverage strip. Hand-drawing it in an image
 * editor would make those a second, hand-maintained copy of values that already
 * live in design-system.css and coverage-layout-data.json -- exactly the shape
 * section 00.B.1 forbids. Deriving it means the card cannot drift from the app.
 *
 * WHAT IT ASSERTS BEFORE WRITING (a card that renders wrong is worse than none):
 *   1. every @font-face really loaded -- a bad face falls back SILENTLY, and the
 *      silent fallback is why the first draft of this card shipped in the wrong
 *      typeface twice before anyone looked
 *   2. no rendered text is under 34px. A 1200x630 card renders ~340px wide in a
 *      phone timeline (0.28x), so 34px lands at ~9.5px. Below that it is
 *      decoration, not copy. This floor was set by the owner after a first pass
 *      whose 17px description text was illegible at feed size.
 *   3. no text INK escapes the card or collides with the strip. Measure the ink,
 *      not the box: a long unbreakable word overflows its box while the box's
 *      own rect stays innocent, which is how a headline ran under the artwork
 *      and still measured clean.
 *   4. no region is taller than 630px -- the card's overflow:hidden would
 *      otherwise hide content that silently fell off the bottom.
 *
 * THE IMAGE IS NEVER FETCHED BY THE APP. Only a crawler reads og:image, so this
 * file has no bearing on the offline promise. It is checked in as bytes because
 * the live site must serve it; regenerate with this script, never by hand.
 */
const path = require('path');
const fs = require('fs');

const REPO = path.resolve(__dirname, '..');
const CARD = path.join(REPO, 'dashboard', 'assets', 'favicons', 'share-card.png');
const CHECK_ONLY = process.argv.includes('--check');

const TYPE_FLOOR = 34;
const W = 1200;
const H = 630;

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try the next candidate */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

/* Faces are embedded as data: URIs rather than linked. A setContent() page has an
   opaque origin, so a file:// @font-face src is blocked there even with
   --allow-file-access-from-files -- and it fails silently. */
const face = (n) => 'data:font/ttf;base64,' + fs
  .readFileSync(path.join(REPO, 'dashboard/assets/fonts', n)).toString('base64');

const FONTS = `
@font-face{font-family:'Unbounded';src:url('${face('Unbounded-VariableFont_wght.ttf')}') format('truetype');font-weight:200 900;font-display:block}
@font-face{font-family:'Space Grotesk';src:url('${face('SpaceGrotesk-VariableFont_wght.ttf')}') format('truetype');font-weight:300 700;font-display:block}
@font-face{font-family:'JetBrains Mono';src:url('${face('JetBrainsMono-VariableFont_wght.ttf')}') format('truetype');font-weight:100 800;font-display:block}
@font-face{font-family:'Bruno Ace';src:url('${face('BrunoAce-Regular.ttf')}') format('truetype');font-weight:400;font-display:block}
`;
const FACES = ['Unbounded', 'Space Grotesk', 'JetBrains Mono', 'Bruno Ace'];

/* The strip is 30 cells, mostly unfilled. That is deliberate and it is the whole
   argument of the product: a card showing a nearly-full row would sell the
   opposite of what the app says. These indices are a fixed illustration, NOT a
   measurement of any real person's coverage -- nothing here claims a number. */
const STRIP = 30;
const FILLED = new Set([3, 11, 18, 26]);
const PARTIAL = new Set([7, 22]);

/* Tokens copied from design-system.css:102-137 (cream paper + ember accent, the
   shipped defaults). If those move, move these -- the parity is not gated. */
const CARD_HTML = `<style>${FONTS}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden}
:root{
  --paper:#faf5e8; --paper-deep:#f2ead3;
  --ink:#1a1612; --ink-soft:#6a5d50;
  --accent:#ff7e3c; --accent-hot:#ff6420; --accent-deep:#c8552a; --accent-soft:#ffd0b3;
}
body{background:var(--paper-deep);color:var(--ink);
     font-family:'Space Grotesk',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.card{position:relative;width:${W}px;height:${H}px;overflow:hidden;
  background:linear-gradient(158deg,#fffbf2 0%,var(--paper) 56%,var(--paper-deep) 100%);
  padding:66px 76px 0;display:flex;flex-direction:column}
.card::after{content:'';position:absolute;right:-10%;top:-26%;width:56%;aspect-ratio:1;
  border-radius:50%;
  background:radial-gradient(circle at 36% 36%,rgba(255,126,60,.22),rgba(255,126,60,0) 68%)}
.kick{position:relative;font-family:'JetBrains Mono',monospace;font-weight:600;
  text-transform:uppercase;letter-spacing:.16em;color:var(--accent-deep);font-size:34px;
  display:flex;align-items:center;gap:18px}
.kick::before{content:'';width:46px;height:3px;background:var(--accent);flex:none}
h1{position:relative;font-family:'Unbounded',sans-serif;font-weight:800;font-size:88px;
  letter-spacing:-.035em;line-height:.99;max-width:13ch;margin-top:30px}
h1 em{font-style:normal;color:var(--accent-deep)}
.spacer{flex:1}
.row{position:relative;display:grid;grid-template-columns:repeat(${STRIP},1fr);gap:7px;
  margin-bottom:38px}
.t{height:48px;border-radius:2px;background:rgba(26,22,18,.11)}
.t.on{background:linear-gradient(180deg,var(--accent) 0%,var(--accent-hot) 100%)}
.t.part{background:var(--accent-soft)}
.foot{position:relative;display:flex;justify-content:flex-end;padding-bottom:42px}
.dom{font-family:'Bruno Ace',sans-serif;font-size:34px;color:var(--ink-soft)}
</style>
<div class="card">
  <div class="kick">90 essentials</div>
  <h1>What your supplements <em>miss</em>.</h1>
  <div class="spacer"></div>
  <div class="row">${Array.from({ length: STRIP }, (_, i) =>
    `<div class="t ${FILLED.has(i) ? 'on' : PARTIAL.has(i) ? 'part' : ''}"></div>`).join('')}</div>
  <div class="foot"><span class="dom">nutrientcodex.com</span></div>
</div>`;

(async () => {
  const browser = await pup.launch({
    headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const p = await browser.newPage();
  await p.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await p.setContent(CARD_HTML, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);

  const fail = [];

  // 1. faces. load() first: an unused face is simply never loaded and check()
  //    reports false for it, which would be a false alarm rather than a defect.
  const faces = await p.evaluate(async (fams) => {
    const out = [];
    for (const f of fams) {
      try { await document.fonts.load(`600 16px "${f}"`); } catch (e) { /* reported below */ }
      out.push([f, document.fonts.check(`600 16px "${f}"`)]);
    }
    return out;
  }, FACES);
  faces.filter(([, ok]) => !ok).forEach(([f]) => fail.push(`font fell back silently: ${f}`));

  // 2/3/4. type floor, ink extent, collisions, region height
  const measured = await p.evaluate((floor) => {
    const bad = [];
    let min = Infinity;
    let minText = '';
    const id = (el) => `${el.tagName}.${(el.className || '').toString().trim() || '(none)'}`;
    const art = [...document.querySelectorAll('.row')];

    document.querySelectorAll('body *').forEach((el) => {
      const t = (el.textContent || '').trim();
      if (!t || el.children.length) { return; }
      const px = parseFloat(getComputedStyle(el).fontSize);
      if (px < min) { min = px; minText = t.slice(0, 40); }
      if (px < floor) { bad.push(`"${t.slice(0, 30)}" is ${px}px — under the ${floor}px feed floor`); }

      if (el.scrollWidth > el.clientWidth + 1) {
        bad.push(`${id(el)} ink overflows its box by ${el.scrollWidth - el.clientWidth}px`);
      }
      const rng = document.createRange();
      rng.selectNodeContents(el);
      const ink = rng.getBoundingClientRect();
      if (ink.right > 1200.5) { bad.push(`${id(el)} ink past the right edge (${Math.round(ink.right)})`); }
      if (ink.bottom > 630.5) { bad.push(`${id(el)} ink past the bottom edge (${Math.round(ink.bottom)})`); }
      if (ink.left < -0.5) { bad.push(`${id(el)} ink past the left edge (${Math.round(ink.left)})`); }
      art.forEach((a) => {
        if (a.contains(el) || el.contains(a)) { return; }
        const b = a.getBoundingClientRect();
        if (ink.left < b.right && ink.right > b.left && ink.top < b.bottom && ink.bottom > b.top) {
          bad.push(`${id(el)} ink collides with .${a.className}`);
        }
      });
    });

    document.querySelectorAll('.card').forEach((el) => {
      const b = el.getBoundingClientRect();
      if (b.height > 630.5) { bad.push(`.card is ${Math.round(b.height)}px tall, over the 630px frame`); }
    });
    return { bad, min, minText };
  }, TYPE_FLOOR);

  fail.push(...measured.bad);

  if (fail.length) {
    console.log('FAIL · the card was NOT written:');
    fail.forEach((f) => console.log(`  ✗ ${f}`));
    await browser.close();
    process.exit(1);
  }

  console.log(`  faces      ${FACES.length}/${FACES.length} really loaded`);
  console.log(`  type floor smallest rendered text ${measured.min}px ("${measured.minText}") — floor ${TYPE_FLOOR}px`);
  console.log('  geometry   no ink escapes the frame, no collision with the strip');

  if (CHECK_ONLY) {
    console.log('\nOK · --check, nothing written');
    await browser.close();
    process.exit(0);
  }

  fs.mkdirSync(path.dirname(CARD), { recursive: true });
  await p.screenshot({ path: CARD, fullPage: false });
  await browser.close();

  const bytes = fs.statSync(CARD).size;
  console.log(`\nOK · ${path.relative(REPO, CARD).split(path.sep).join('/')} — ${W}x${H}, ${(bytes / 1024).toFixed(1)} KB`);
})();
