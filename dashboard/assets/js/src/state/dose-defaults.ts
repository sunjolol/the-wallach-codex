/**
 * state/dose-defaults.ts — read boundary for per-product starting quantities
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Surfaces dashboard/assets/data/dose-defaults.json. Every product NOT listed there starts at
 * exactly one label serving, which is Youngevity's own stated serving and therefore adds no
 * number of ours. The file holds only the exceptions.
 *
 * ★ WHAT THIS IS NOT. Not a Wallach dose, and structurally unable to become one: the schema's
 * provenance vocabulary has no 'wallach' member and the gate forbids a source_claim_id here.
 * Wallach's numbers remain TARGETS — the coverage tiles still grade delivery against them, so
 * a starting quantity short of a target renders as a partial bar rather than hiding the gap.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import doseDefaultsData from '../../../data/dose-defaults.json';
import { type DoseDefaults, DoseDefaultsSchema } from '../core/schemas/index.js';

/** Parsed once at load. Throws loudly rather than degrading — a silently empty table would
 *  reset every curated starting quantity to one serving with no visible failure. */
const DATA: DoseDefaults = DoseDefaultsSchema.parse(doseDefaultsData);

const BY_ID: ReadonlyMap<string, number> = new Map(
  DATA.defaults.map(d => [d.product_id, d.units_per_day]),
);

/**
 * The starting quantity for a product, in SERVINGS — the unit readScale and the coverage math
 * speak. Converted here rather than at the call sites so the two add paths cannot disagree.
 *
 * @param productId    canon product id
 * @param servingUnits discrete units in one label serving, or null when the serving IS the
 *                     unit (liquids, powders). Null means units and servings are the same
 *                     thing, so the conversion is the identity.
 */
export function defaultServingsFor(productId: string, servingUnits: number | null): number {
  const units = BY_ID.get(productId);
  if (units === undefined) {
    return 1; // one label serving — the default default
  }
  return servingUnits !== null && servingUnits > 0 ? units / servingUnits : units;
}
