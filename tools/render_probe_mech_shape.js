// tools/render_probe_mech_shape.js — the element-header SHAPE guard.
//
// Usage: node tools/render_probe_mech_shape.js   (exit 0 = PASS, non-zero = FAIL)
//
// WHY THIS EXISTS. The mechanism renderer grew a second shape on 2026-07-30: alongside the legacy
// fixed skeleton, an entry may now declare an ordered `blocks` list and render in ANY order with any
// subset of blocks. That was necessary — the required legacy set (eyebrow/kill/figure/beats/quote)
// WAS the chassis eight calcium mockups were rejected for (Rule 0, .claude/rules/element-headers.md).
// But it meant touching the one function that draws three headers Luneth has already signed off.
//
// So this probe answers exactly one question, byte-for-byte: do the SIGNED-OFF headers still render
// what they rendered before? It compares the live `.kd-ep-fam--mech` outerHTML against
// tools/goldens/mechanism-sections.json, which was captured from the PRE-refactor bundle.
//
// Two things learned the hard way while building it, recorded so the next snapshot does not repeat
// them:
//   1. The goldens live in JSON, not as .html siblings, because tools/safe_write.py writes text in
//      Windows text mode and silently turned an LF snapshot into CRLF — which read as "all 256 lines
//      differ" against an unchanged render. Inside a JSON string a newline is a two-char \n escape,
//      so the bytes survive that write path and this probe can compare RAW, with no line-ending
//      normalisation that could hide a real change.
//   2. The comparison is proven, not trusted: the NEGATIVE CONTROL below mutates the live DOM by one
//      character and asserts the comparison then FAILS. Without that, a comparator that always
//      returned "match" would pass this probe silently.
//
// Scope, honestly: this proves the legacy path is unchanged and that the frame (tan content box ·
// disclaimer · Best-Youngevity-sources dock) still wraps it. It does NOT exercise the composed path —
// no element declares `blocks` yet. The composed path's DATA contract is gated by the
// mechanism_blocks_wellformed invariant (schema<->renderer block-type sync, drawable figure keys,
// resolvable claim ids); its RENDER will be covered by the first composed element's own probe.
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '..');
let puppeteer;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { puppeteer = require(c); break; } catch (e) { /* try next */ }
}
if (!puppeteer) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

const GOLDENS = path.join(REPO, 'tools', 'goldens', 'mechanism-sections.json');
if (!fs.existsSync(GOLDENS)) { console.log('NO_GOLDENS · ' + GOLDENS); process.exit(2); }
const golden = JSON.parse(fs.readFileSync(GOLDENS, 'utf8')).sections;
const SLUGS = Object.keys(golden);

/** Where two strings first differ, with context — a 25 KB "differs" with no offset is unusable. */
function firstDelta(a, b) {
  const n = Math.min(a.length, b.length);
  let i = 0;
  while (i < n && a[i] === b[i]) { i++; }
  if (i === n && a.length === b.length) { return null; }
  return { at: i, golden: JSON.stringify(a.slice(i, i + 90)), live: JSON.stringify(b.slice(i, i + 90)) };
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1500, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  const url = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('a,button,[role="button"]')].find(e => /just browsing/i.test(e.textContent || ''));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 250));
  await page.evaluate(() => document.querySelector('[data-rail-nav="knowledge"]')?.click());
  await new Promise(r => setTimeout(r, 350));
  await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-tab="essentials"]')?.click());
  await new Promise(r => setTimeout(r, 350));

  // Open by SLUG, not by a hardcoded display name: match the essentials list entry whose
  // data-kd-essential slugifies to the golden's key, so the probe follows the data.
  const openBySlug = async (slug) => {
    const found = await page.evaluate((s) => {
      const norm = t => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const el = [...document.querySelectorAll('#drawer-knowledge-mount [data-kd-essential]')]
        .find(e => norm(e.getAttribute('data-kd-essential') || '').startsWith(s));
      if (!el) { return false; }
      el.click();
      return true;
    }, slug);
    await new Promise(r => setTimeout(r, 700));
    return found;
  };
  const readSection = () => page.evaluate(() => {
    const m = document.querySelector('#drawer-knowledge-mount .kd-ep-fam--mech');
    return m ? m.outerHTML : '';
  });
  const closeEssential = async () => {
    await page.evaluate(() => document.querySelector('#drawer-knowledge-mount [data-kd-action="essential-close"]')?.click());
    await new Promise(r => setTimeout(r, 350));
  };

  const checks = [];
  const deltas = [];
  let lastSlug = null;
  for (const slug of SLUGS) {
    const opened = await openBySlug(slug);
    checks.push([`${slug}: entity page opens`, opened]);
    const live = await readSection();
    checks.push([`${slug}: mechanism section renders`, live.length > 0]);
    const same = live === golden[slug];
    checks.push([`${slug}: renders BYTE-IDENTICAL to the pre-refactor golden`, same]);
    if (!same) {
      const d = firstDelta(golden[slug], live);
      deltas.push(`${slug}: ${d === null ? 'length-only difference' : `first delta at char ${d.at}\n    golden: ${d.golden}\n    live  : ${d.live}`}`);
    }
    // The frame Rule 0 fixes must still wrap the body.
    // The sources block is a FLAT run of siblings (label, buttons, a <details>), not one wrapper —
    // so "docked at the bottom" is an ORDER fact about child indices, not a last-child fact.
    const frame = await page.evaluate(() => {
      const m = document.querySelector('#drawer-knowledge-mount .kd-ep-fam--mech');
      if (!m) { return null; }
      const kids = [...m.children];
      const idx = sel => kids.findIndex(e => e.matches(sel));
      return { note: idx('.kd-ep-fam__note'), src: idx('.kd-ep-op__srclabel'), count: kids.length };
    });
    checks.push([`${slug}: disclaimer note still in the frame`, frame !== null && frame.note > 0]);
    checks.push([`${slug}: Best-Youngevity sources still docked BELOW the note, at the bottom`,
      frame !== null && frame.src > frame.note && frame.src === frame.note + 2]);
    lastSlug = slug;
    if (slug !== SLUGS[SLUGS.length - 1]) { await closeEssential(); }
  }

  // ── NEGATIVE CONTROL ────────────────────────────────────────────────────────────────────────────
  // Mutate the live section by ONE character and prove the comparison notices. A byte-comparison
  // that cannot fail proves nothing (memory: negative-control-or-it-proves-nothing).
  const mutated = await page.evaluate(() => {
    const t = document.querySelector('#drawer-knowledge-mount .kd-ep-fam--mech .kd-ep-fam__kill');
    if (!t) { return null; }
    t.textContent = `${t.textContent}!`;
    const m = document.querySelector('#drawer-knowledge-mount .kd-ep-fam--mech');
    return m ? m.outerHTML : null;
  });
  checks.push(['negative control: a one-character DOM edit is detected as a difference',
    mutated !== null && lastSlug !== null && mutated !== golden[lastSlug]]);
  checks.push(['negative control: the edit was the ONLY difference (control is surgical)',
    mutated !== null && lastSlug !== null
    && mutated.replace('!</h3>', '</h3>') === golden[lastSlug]]);

  checks.push(['no page errors', errors.length === 0]);

  let bad = 0;
  for (const [name, ok] of checks) {
    if (!ok) { bad++; console.log('FAIL ·', name); }
  }
  if (deltas.length > 0) { console.log(deltas.join('\n')); }
  if (errors.length > 0) { console.log(errors.slice(0, 3).join('\n')); }
  console.log(bad === 0
    ? `PASS · render_probe_mech_shape · ${checks.length}/${checks.length} checks · ${SLUGS.length} signed-off header(s) byte-identical`
    : `FAIL · render_probe_mech_shape · ${bad} of ${checks.length}`);
  await browser.close();
  process.exit(bad === 0 ? 0 : 1);
})();
