/**
 * core/dose-units.ts — counting a dose in the product's own units
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Shared by the Coverage rail and the Regimen console, which render the same stepper twice.
 * It lives in core/ for the reason core/units.ts and core/goal-display.ts do: both views need
 * it, and a views→views import would couple two surfaces that should only share data.
 *
 * ★ THE PROBLEM THIS SOLVES. The stepper counts SERVINGS and printed the bare number, so a
 * product whose label serving is 2 tablets showed "1 /day". The coverage math was right — the
 * stored amounts are per-serving, so one serving is exactly what it delivered — but the label
 * was ambiguous in the dangerous direction: read "1" as one tablet, step it to 2, and you have
 * silently asked for four tablets.
 *
 * ★ WHAT DOES NOT CHANGE. Everything below is DISPLAY and STEP SIZE. readScale still returns
 * servings, the stored amounts are still per-serving, and no coverage number moves: at the
 * default, 2 tablets x (per-serving / 2) is the same total the tile always saw.
 *
 * A product with no discrete unit — liquid, powder, spray, tea — has `perServing` null, and
 * every function below degrades to exactly the old servings-counting behaviour.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** How a product's label divides one serving. Null = the serving IS the unit. */
export interface DoseUnits {
  /** Discrete units in one label serving (2 for "2 tablets"), or null. */
  perServing: number | null;
  /** Singular noun for one unit ("tablet"), or null. */
  noun: string | null;
}

/** Read the unit facts off a regimen item's label (the vault copies them in on add). */
export function doseUnitsOf(label: unknown): DoseUnits {
  const l = (label ?? {}) as Record<string, unknown>;
  const n = l['serving_units'];
  const noun = l['serving_unit'];
  const perServing = typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : null;
  return {
    perServing,
    noun: perServing !== null && typeof noun === 'string' && noun !== '' ? noun : null,
  };
}

/** Servings → the number actually shown on the stepper. */
export function doseCount(servings: number, u: DoseUnits): number {
  return u.perServing !== null ? servings * u.perServing : servings;
}

/**
 * The stepper's trailing label: "tablets/day", "softgel/day", "servings/day".
 *
 * ★ A PRODUCT WITH NO COUNTABLE UNIT NAMES ITS UNIT ANYWAY — "serving/day", not a bare
 * "/day". The bare form left the reader to guess what the number counted, which is the same
 * ambiguity the countable products just had fixed; a liquid measured in servings should say
 * so rather than say nothing.
 *
 * Singular at exactly one, because "1 tablets/day" is the kind of small wrongness that makes
 * a careful surface read as careless.
 */
export function doseUnitLabel(count: number, u: DoseUnits): string {
  const noun = u.noun ?? 'serving';
  return `${noun}${count === 1 ? '' : 's'}/day`;
}

/**
 * Step the dose by `delta` UNITS and return the new servings figure.
 *
 * Floored at ONE UNIT, not one serving: on a 4-tablet serving the old floor trapped the user
 * at four tablets when they may want one. Zero stays impossible — a 0/day item is a REMOVED
 * item, and removal has its own control.
 *
 * ★ THE STEP IS RELATIVE, which preserves a fractional starting point rather than rounding it
 * away — the same reasoning the servings stepper carried for Plant Derived Minerals' sourced
 * 1.54.
 */
export function stepDose(servings: number, delta: number, u: DoseUnits): number {
  const per = u.perServing !== null ? u.perServing : 1;
  const stepServings = 1 / per;
  return Math.max(stepServings, servings + delta * stepServings);
}

/** True when the stepper's minus button should be disabled (already at one unit). */
export function atMinimumDose(servings: number, u: DoseUnits): boolean {
  return doseCount(servings, u) <= 1;
}
