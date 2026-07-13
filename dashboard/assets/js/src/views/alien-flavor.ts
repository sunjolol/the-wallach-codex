/**
 * views/alien-flavor.ts — the living "alien readout" flavour animation
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * A `.kd-foods-brand` stamp (the WALLACH-CORP callsign, rendered in the Fantocrypt alien
 * display face) SHIMMERS SLOWLY: on a calm tick a few glyphs morph, so it reads as a LIVING
 * alien inscription — obviously decorative flavour, not a broken or glitching label.
 *
 * Deliberately GENTLE (Luneth 2026-07-13: a fast every-letter shimmer "spazzed out"). Each tick
 * (~800ms) only 1–3 randomly-chosen letters morph to a new glyph; the display PERSISTS between
 * ticks (letters drift, they do not all reset), so at any instant just a couple of glyphs are
 * changing. The real callsign lives in `data-alien`; only [A-Za-z] positions ever change and
 * everything stays lowercase (Luneth wants no-caps) — separators (spaces, //, dots, dashes,
 * digits) are preserved so the silhouette stays a structured "callsign".
 *
 * ONE global interval (idempotent), delegated by class so it covers the element however many
 * times the tab re-renders. Decorative (the element is aria-hidden) — pure view behaviour, no
 * state, no storage. Math.random is runtime-only (never at build), so it does not affect the
 * deterministic render probe (which asserts the element's existence, not its text).
 * ═══════════════════════════════════════════════════════════════════════════
 */

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const TICK_MS = 800;
const MAX_MORPH = 3; // up to this many letters change per tick (min 1)
let wired = false;

/** Morph 1–MAX_MORPH random letter positions of one stamp's CURRENT display to new glyphs. */
function step(el: Element): void {
  const base = el.getAttribute('data-alien');
  if (base === null || base.length === 0) {
    return;
  }
  const letters: number[] = [];
  for (let i = 0; i < base.length; i += 1) {
    if (/[a-z]/i.test(base.charAt(i))) {
      letters.push(i);
    }
  }
  if (letters.length === 0) {
    return;
  }
  // Persist between ticks; (re)seed from the base (lowercased) only if out of sync (first run).
  let cur = (el.textContent ?? '').split('');
  if (cur.length !== base.length) {
    cur = base.toLowerCase().split('');
  }
  const k = 1 + Math.floor(Math.random() * MAX_MORPH);
  for (let j = 0; j < k; j += 1) {
    const pos = letters[Math.floor(Math.random() * letters.length)]!;
    cur[pos] = LOWER.charAt(Math.floor(Math.random() * LOWER.length));
  }
  el.textContent = cur.join('');
}

/** Wire the shared alien-flavour shimmer once at boot (idempotent). */
export function initAlienFlavor(): void {
  if (wired) {
    return;
  }
  wired = true;
  setInterval(() => {
    document.querySelectorAll('.kd-foods-brand[data-alien]').forEach(step);
  }, TICK_MS);
}
