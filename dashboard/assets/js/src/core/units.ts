/**
 * core/units.ts — the ONE unit converter (mass + IU) for the whole app
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * WHY THIS FILE EXISTS (2026-07-15). `toMg` + `IU_TO_MG` lived privately inside
 * `state/coverage.ts`. `state/recommender.ts` needed the same conversion and
 * could not have it: `eslint-plugin-boundaries` allows `state → core` only, so
 * state cannot import state. The two honest options were "duplicate the
 * converter" (an R3 violation — one source per fact) or "promote it to core".
 * The layer rule was right; this is the promotion. Both state modules now share
 * ONE conversion truth, and the next consumer gets it for free.
 *
 * The bug that forced it: `rankSources` divided a candidate's amount by a
 * Wallach target WITHOUT reconciling units. Measured across the 34 essentials
 * carrying both a numeric target and vault candidates, 2 disagree —
 * boron (target mg vs candidates mcg) and silver (target mcg vs candidates mg)
 * — so boron's adequacy saturated at 1.0 for every candidate and silver's read
 * ~0.0001. Adequacy is the 0.6 keystone of the match score, so the ranking
 * silently collapsed to breadth+price on exactly those two. `state/coverage.ts`
 * had been converting both sides correctly the whole time (`toMg(lowRaw,
 * target.unit)`), 20 lines from the ranker that was not — which is the tell
 * that this belonged in core from the start.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * IU→mg for the three fat-soluble vitamins that labels/Wallach state in IU. MUST mirror
 * eden/tools/targets_derive.py IU_CONVERSIONS: the A/D/E TARGET is derived there in mcg/mg,
 * so a product listing them in IU has to use the SAME physical factor to land in the same
 * mg-family the target lives in (§00.B #3 — one conversion truth across the Python/TS line).
 * Values are IU→mg: retinol/beta-carotene 0.3 mcg RAE/IU ÷1000; D 0.025 mcg/IU ÷1000; E 0.67 mg/IU.
 * The factors are pinned to these physical constants by the `amounts_wallach_only` gate.
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
    // metric target (Phase G-1 residual). Other IU nutrients stay IU-family (no metric target).
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
