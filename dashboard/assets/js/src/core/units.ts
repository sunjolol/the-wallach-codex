/**
 * core/units.ts — the ONE unit converter (mass + IU) for the whole app
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * WHY IT LIVES IN core/. `toMg` + `IU_TO_MG` are needed by BOTH `state/coverage.ts`
 * and `state/recommender.ts`, and `eslint-plugin-boundaries` allows `state → core`
 * only — state cannot import state. The two honest options were "duplicate the
 * converter" (a violation of one-source-per-fact) or "promote it to core". This is the
 * promotion, so both state modules share ONE conversion truth.
 *
 * WHY IT MATTERS. `rankSources` once divided a candidate's amount by a Wallach target
 * WITHOUT reconciling units. Across the essentials carrying both a numeric target and
 * product candidates, two disagreed — boron (target mg vs candidates mcg) and silver
 * (target mcg vs candidates mg) — so boron's adequacy saturated at 1.0 for every
 * candidate and silver's read ~0.0001. Adequacy is the 0.6 keystone of the match score,
 * so the ranking silently collapsed to breadth+price on exactly those two. Convert BOTH
 * sides of every ratio: a score computed across mismatched units fails silently, with
 * no error and a plausible-looking number.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * IU→mg for the three fat-soluble vitamins that labels/Wallach state in IU. MUST mirror
 * eden/tools/targets_derive.py IU_CONVERSIONS: the A/D/E TARGET is derived there in mcg/mg,
 * so a product listing them in IU has to use the SAME physical factor to land in the same
 * mg-family the target lives in (§00.B #3 — one conversion truth across the Python/TS line).
 * Values are IU→mg: retinol/beta-carotene 0.3 mcg RAE/IU ÷1000; D 0.025 mcg/IU ÷1000; E 0.67 mg/IU.
 * The `amounts_wallach_only` gate pins these constants on the PYTHON side
 * (eden/tools/targets_derive.py). This TS copy is NOT gated — WISH, not enforced: no
 * invariant reads this file, so a typo here would leave the board green. Check it
 * against IU_CONVERSIONS by hand whenever either side changes.
 */
export const IU_TO_MG: Record<string, number> = {
  'vitamin-a': 0.3 / 1000,
  'vitamin-d': 0.025 / 1000,
  'vitamin-e': 0.67,
};

/** The mass units the app compares in. */
export type MassUnit = 'mcg' | 'mg' | 'g' | 'kg' | 'oz' | 'lb';
/** Every unit `canonicalUnit` can resolve: the mass family plus IU (an activity unit). */
export type CanonicalUnit = MassUnit | 'iu';

/**
 * Resolve however a unit was WRITTEN to what it MEANS — the one home for unit spelling.
 *
 * ★ WHY THIS EXISTS. The scanner's Confirm grid is typed by hand, and people write
 * "milligrams", "micrograms", "ounces". Every reader in the app used to test units by exact
 * string or by a short prefix list, so those spellings behaved in two different bad ways:
 * state/scanner.ts's `normalize` returned null and the nutrient vanished from the hit count
 * and the gap-fill with no error at all, while `toMg` fell through to its mg default — so a
 * hand-typed "500 micrograms" was credited as 500 MILLIGRAMS, a 1000x overstatement of a
 * dose, rendered as a confident number.
 *
 * ★ ORDER IS THE WHOLE TRICK. "micrograms" contains "grams" and starts the same way as
 * "milligrams". Micro is tested before milli and both before plain grams; get that order
 * wrong and the 1000x error comes straight back. A FLUID ounce is a volume and is refused
 * outright rather than being quietly weighed.
 *
 * Returns null for anything not recognised — including deliberate non-masses like "million
 * CFU" and "mL". Callers decide what null means; `toMg` keeps its documented legacy
 * fallback (unknown -> mg-family) so no existing product's arithmetic moves.
 */
export function canonicalUnit(raw: string | undefined): CanonicalUnit | null {
  // Punctuation and repeated spaces collapse first, so "I.U.", "mcg  RAE" and "MICROGRAMS"
  // all reach the same tests.
  const u = (raw ?? '').toLowerCase().replace(/[.,()/]/g, ' ').replace(/\s+/g, ' ').trim();
  if (u === '') {
    return null;
  }
  if (u.startsWith('fl ') || u.includes('fluid')) {
    return null; // a fluid ounce is a VOLUME — never weigh it
  }
  if (/^i ?u\b/.test(u) || u.includes('international unit')) {
    return 'iu';
  }
  if (u.startsWith('mcg') || u.startsWith('ug') || u.startsWith('microgram') || u.includes('μg') || u.includes('µg')) {
    return 'mcg';
  }
  if (u.startsWith('mg') || u.startsWith('milligram')) {
    return 'mg';
  }
  if (u.startsWith('kg') || u.startsWith('kilogram')) {
    return 'kg';
  }
  if (u === 'g' || u.startsWith('g ') || u.startsWith('gram') || u.startsWith('gm')) {
    return 'g';
  }
  if (u.startsWith('oz') || u.startsWith('ounce')) {
    return 'oz';
  }
  if (u.startsWith('lb') || u.startsWith('pound')) {
    return 'lb';
  }
  return null;
}

/**
 * The abbreviation to SHOW for a resolved unit, or null when the text is not a plain
 * one-word unit. A qualifier must survive: "mcg RAE" resolves to mcg for arithmetic but is
 * NOT rewritten to "mcg" on screen, because RAE is a real distinction a reader may want.
 */
export function unitAbbreviation(raw: string | undefined): CanonicalUnit | null {
  const text = (raw ?? '').trim();
  if (text === '' || /\s/.test(text)) {
    return null; // more than one token — leave the author's wording alone
  }
  return canonicalUnit(text);
}

// ─── The three exact ladders ────────────────────────────────────────────────
// Three, not one shared factor, and deliberately so: `v * 0.001` and `v / 1000` disagree in
// the last bit for ~13% of doubles, and the mcg base, the mg base and the reverse leg each
// need their own exact expression to reproduce the arithmetic that shipped. They are pinned
// against each other by core/units.test.ts, which also proves every unit string present in
// the product data converts EXACTLY as it did before this file existed -- toBe, not
// toBeCloseTo, because that is the whole claim.

/** `value` in `unit`, expressed in MILLIGRAMS. */
export function massToMg(value: number, unit: MassUnit): number {
  switch (unit) {
    case 'mcg': return value / 1000;
    case 'mg': return value;
    case 'g': return value * 1000;
    case 'kg': return value * 1000000;
    case 'oz': return value * 28349.523125; // international avoirdupois ounce, exact by definition
    case 'lb': return value * 453592.37; // 16 oz, exact by definition
  }
}

/** `value` in `unit`, expressed in MICROGRAMS. */
export function massToMcg(value: number, unit: MassUnit): number {
  switch (unit) {
    case 'mcg': return value;
    case 'mg': return value * 1000;
    case 'g': return value * 1000000;
    case 'kg': return value * 1000000000;
    case 'oz': return value * 28349523.125;
    case 'lb': return value * 453592370;
  }
}

/** `mg` milligrams, expressed in `unit`. */
export function mgToMass(mg: number, unit: MassUnit): number {
  switch (unit) {
    case 'mcg': return mg * 1000;
    case 'mg': return mg;
    case 'g': return mg / 1000;
    case 'kg': return mg / 1000000;
    case 'oz': return mg / 28349.523125;
    case 'lb': return mg / 453592.37;
  }
}

/** Convert an amount to a common unit. Faithful legacy `toMg`: IU stays IU. */
export function toMg(value: number, unit: string | undefined, slug?: string): { v: number; u: 'mg' | 'iu' } {
  // Labels and regimen snapshots carry SUFFIXED units ("mcg RAE", "mg NE", "mcg DFE"),
  // micro-sign variants, and — since hand-entry — long-form words. canonicalUnit owns all of
  // that, so a "mcg RAE" or a "micrograms" can never fall through to the mg default and
  // inflate 1000x (the Vitamin A bug).
  const canon = canonicalUnit(unit ?? 'mg');
  if (canon === 'iu') {
    // A/D/E: convert IU into the mg-family so an IU-listed product still counts toward its
    // metric target. Other IU nutrients stay IU-family (they have no metric target).
    const f = slug !== undefined ? IU_TO_MG[slug] : undefined;
    return (f !== undefined) ? { v: value * f, u: 'mg' } : { v: value, u: 'iu' };
  }
  if (canon === null) {
    return { v: value, u: 'mg' }; // unknown ("million CFU", "mL") -> mg-family, as it always has
  }
  return { v: massToMg(value, canon), u: 'mg' };
}
