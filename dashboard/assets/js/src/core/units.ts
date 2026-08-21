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

/** Convert an amount to a common unit. Faithful legacy `toMg`: IU stays IU. */
export function toMg(value: number, unit: string | undefined, slug?: string): { v: number; u: 'mg' | 'iu' } {
  // Robust unit parse: labels/regimen snapshots carry SUFFIXED units ("mcg RAE", "mg NE",
  // "mcg DFE") and micro-sign variants. Match by token/prefix, not exact string, so a
  // "mcg RAE" can never fall through to the mg default and inflate 1000x (the Vitamin A bug).
  const u = (unit ?? 'mg').toLowerCase().trim();
  if (u.includes('iu')) {
    // A/D/E: convert IU into the mg-family so an IU-listed product still counts toward its
    // metric target. Other IU nutrients stay IU-family (they have no metric target).
    const f = slug !== undefined ? IU_TO_MG[slug] : undefined;
    return (f !== undefined) ? { v: value * f, u: 'mg' } : { v: value, u: 'iu' };
  }
  if (u.startsWith('mcg') || u.startsWith('ug') || u.includes('μg') || u.includes('µg')) {
    return { v: value / 1000, u: 'mg' };
  }
  if (u === 'g' || u.startsWith('gram')) {
    return { v: value * 1000, u: 'mg' };
  }
  return { v: value, u: 'mg' }; // 'mg' + 'mg RAE'/'mg NE' + unknown -> mg-family
}
