// tools/probes/render_probe_food_tier.js — the EXACT / APPROXIMATE mark on a food card.
//
// Usage: node tools/probes/render_probe_food_tier.js
//
// WHY THIS EXISTS. On 2026-08-21 the food catalog gained numbers from sources other than the
// pinned USDA archive, joined two different ways: by an id both tables carry (EXACT) and by
// the source's own food NAME, one human decision per pair (APPROXIMATE). Luneth ruled that
// both ship and THE SURFACE SAYS WHICH. `food_composition_traces_to_source` proves the tier
// is right in the DATA and is completely blind to whether it ever reaches a screen — a tier
// recorded in an artifact and never rendered is a label nobody can act on.
//
// What this asserts, on the real app driven through its real controls:
//   · an APPROXIMATE reading carries .fs-lead__pct--approx (lead) or .fs-chip--approx
//     (chip) AND the CSS rule is live (the '≈' comes back from getComputedStyle ::after,
//     not merely from the stylesheet text)
//   · its gloss names the actual source and explains what the pairing does and does not mean
//   · ★ THE NEGATIVE CONTROL: an EXACT card in the SAME run carries neither. Without it this
//     probe would pass just as happily if every card were marked approximate.
//
// ★ THIS PROBE PASSED FOR MONTHS WITHOUT EVER ADVANCING THE LIST -- fixed 2026-08-24.
// Its walk clicked `.fs-card`, a class that has NEVER existed in this app: the tile is
// `.fs-tile` and its add control is `.fs-ctl--add[data-food-add]`. `git log -S fs-card --all`
// finds the string only inside probe files, never in a view or a stylesheet. So the click
// returned false on the very first iteration, the loop broke at `adds = 0`, and the probe only
// ever saw PAGE ONE. It went green anyway because page one happened to carry an APPROXIMATE
// reading -- until the 2026-08-24 food re-ordering put seven dry-legume rows at the top and made
// page one all-EXACT, at which point the latent no-op finally showed as a red.
//
// It now walks the PAGER, which is a real control, is deterministic, and does not mutate the
// reader's regimen the way adding a food does. The lesson is the general one: a probe that
// cannot fail for the reason it claims to test is not a gate, and only a NEGATIVE CONTROL
// (deliberately break the thing, watch it go red) proves otherwise.
//
// ★ A DOM PROBE IS NOT A VISUAL CHECK. It screenshots the card it found; a person still looks.

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

const MAX_PAGES = 200;        // a hard stop only; the walk ends when the pager stops advancing

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

  const veil = await page.evaluate(() => {
    const btn = document.querySelector('.wc-veil .ui-close, .wc-veil [data-wc-close], .wc-veil button');
    if (btn) { btn.click(); return 'dismissed'; }
    return document.querySelector('.wc-veil') ? 'PRESENT-BUT-NO-BUTTON' : 'absent';
  });
  await new Promise(r => setTimeout(r, 400));
  console.log('welcome veil:', veil);

  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('wallach:navigate', { detail: { to: 'regimen' } }));
  });
  await new Promise(r => setTimeout(r, 800));

  // Read every visible food card, with the two things that decide the tier on screen.
  const readCards = () => page.evaluate(() => {
    const block = [...document.querySelectorAll('.fs-block')]
      .filter(b => b.getBoundingClientRect().height > 0)[0];
    if (!block) return { present: false, cards: [] };
    return {
      present: true,
      note: (block.querySelector('.fs-note') || {}).textContent || null,
      // ★ EVERY NUMBER ON THE TILE, not just the lead. Design F shows the lead plus up
      // to seven chips, and each is a separate measurement from a possibly different
      // source -- an egg's choline is USDA's and its sulfur is Doleman's. A probe that
      // only read the lead would have proved nothing about the chips.
      cards: [...block.querySelectorAll('.fs-tile')].flatMap((c) => {
        const name = (c.querySelector('.fs-tile__name') || {}).textContent;
        const lead = c.querySelector('.fs-lead');
        const pct = c.querySelector('.fs-lead__pct');
        const out = [];
        if (lead && pct) {
          out.push({
            name, where: 'lead',
            amount: pct.textContent,
            gloss: lead.title,
            approxClass: pct.classList.contains('fs-lead__pct--approx'),
            after: getComputedStyle(pct, '::after').content,
          });
        }
        for (const ch of c.querySelectorAll('.fs-chip')) {
          out.push({
            name, where: 'chip',
            amount: ch.textContent,
            gloss: ch.title,
            approxClass: ch.classList.contains('fs-chip--approx'),
            // the RENDERED mark, not the stylesheet's intention
            after: getComputedStyle(ch, '::after').content,
          });
        }
        return out;
      }),
    };
  });

  // Walk the REAL pager until an APPROXIMATE reading shows up. Both tiers have to be found in
  // the SAME run, because the negative control is the whole point: without an EXACT card to
  // compare against, this probe would pass just as happily if every reading were marked.
  let approx = null;
  let exact = null;
  let pages = 0;
  const seenExact = [];
  for (; pages < MAX_PAGES; pages += 1) {
    const state = await readCards();
    if (!state.present || state.cards.length === 0) { break; }
    for (const c of state.cards) {
      if (c.approxClass && approx === null) { approx = c; }
      if (!c.approxClass && exact === null && c.amount) { exact = c; seenExact.push(c.name); }
    }
    if (approx !== null && exact !== null) { break; }
    // ★ THE ADVANCE MUST BE ABLE TO FAIL LOUDLY. A selector that matches nothing used to end
    // this loop silently at page one and the probe reported a pass; now a walk that cannot
    // advance and has not found both tiers is reported as the reason for the red.
    const advanced = await page.evaluate(() => {
      const block = [...document.querySelectorAll('.fs-block')]
        .filter(b => b.getBoundingClientRect().height > 0)[0];
      if (!block) return false;
      const next = [...block.querySelectorAll('.fs-pager__b--arrow')]
        .find(n => (n.textContent || '').trim() === '›' && !n.disabled);
      if (!next) return false;
      next.click();
      return true;
    });
    if (!advanced) { break; }
    await new Promise(r => setTimeout(r, 180));
  }

  console.log('\npager pages walked to find both tiers:', pages + 1);
  if (approx === null) {
    console.log('  \u26a0 the walk ended without an APPROXIMATE reading. If it stopped at page 1,',
      'the advance selector is broken again \u2014 that is the 2026-08-24 failure, not a data change.');
  }
  console.log('\n── APPROXIMATE card ──');
  if (approx) {
    console.log('  name           :', approx.name);
    console.log('  amount         :', JSON.stringify(approx.amount));
    console.log('  marker class   :', approx.approxClass);
    console.log('  rendered ::after:', JSON.stringify(approx.after));
    console.log('  gloss          :', JSON.stringify(approx.gloss));
  } else {
    console.log('  NONE FOUND in', pages + 1, 'pages');
  }
  console.log('\n── EXACT card (the negative control) ──');
  if (exact) {
    console.log('  name           :', exact.name);
    console.log('  marker class   :', exact.approxClass);
    console.log('  rendered ::after:', JSON.stringify(exact.after));
    console.log('  gloss          :', JSON.stringify(exact.gloss));
  } else {
    console.log('  NONE FOUND — the negative control could not run');
  }

  const shot = path.join(OUT, 'foods-tier-mark.png');
  await page.screenshot({ path: shot });

  const glossOk = !!approx && /Powell|USDA|Doleman|Database/i.test(approx.gloss || '')
    && /paired with theirs by hand/.test(approx.gloss || '');
  const markOk = !!approx && approx.approxClass && /≈/.test(approx.after || '');
  // ★ the negative control: an EXACT card must carry NEITHER the class NOR the pairing
  //   sentence, or this probe proves nothing about the mark being selective.
  const controlOk = !!exact && exact.approxClass === false
    && !/paired with theirs by hand/.test(exact.gloss || '')
    && !/≈/.test(exact.after || '');

  console.log('\npage errors:', errors.length ? errors.slice(0, 4) : 'none');
  console.log('screenshot:', shot);
  console.log('\n  mark renders on APPROXIMATE :', markOk);
  console.log('  gloss explains the pairing  :', glossOk);
  console.log('  EXACT card carries neither  :', controlOk);

  const ok = markOk && glossOk && controlOk && errors.length === 0;
  console.log('\nRESULT:', ok ? 'PASS (now look at the screenshot)' : 'FAIL');
  await browser.close();
  process.exit(ok ? 0 : 1);
})();
