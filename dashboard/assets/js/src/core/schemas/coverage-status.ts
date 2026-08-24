/**
 * core/schemas/coverage-status.ts — narrowing schemas for the live coverage engine
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The shared blocks type their interesting fields loosely on purpose:
 *   `EssentialSchema.target`        is `z.unknown()` (shape varies by kind)
 *   `RegimenLabelSchema.nutrients`  is `z.array(z.unknown())`
 *
 * state/coverage.ts narrows them HERE at the point of use, so the classifier reads typed
 * numbers without forcing a strict shape onto the hand-maintained targets DB upstream.
 * Both are `.passthrough()` — extra fields are preserved, never rejected.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { z } from 'zod';

/** A Wallach target as the coverage classifier needs it (`essentials-targets-data`). */
export const CoverageTargetSchema = z.object({
  /** trace_pdm · hbsp · dietary · wallach · wallach_clinical · wallach_collective · dietary_with_clinical_lever · mirrors · unspecified · … */
  kind: z.string().optional(),
  /** Lower bound of the Wallach target in `unit`. */
  low: z.number().optional(),
  high: z.number().optional(),
  unit: z.string().optional(),
  /**
   * For kind 'wallach_collective': the group whose ONE shared Wallach amount covers this
   * essential (e.g. 'essential-fatty-acids' — his 9 g/day covers omega-3 + omega-6 together).
   * Such a target carries NO `low` on purpose: the shared budget lives in that group's own
   * artifact, and a per-essential number would be the fan-out collective_doses_not_fanned
   * exists to stop. TYPED, not left to passthrough, because classify() routes on it — an
   * untyped read here once sent the omegas into the rare-earth mineral meter.
   */
  collective_group: z.string().optional(),
  /**
   * For kind 'mirrors': the slug of the essential whose verdict this one carries.
   *
   * Wallach states NO amount for a mirroring essential and his position is that its
   * requirement is met through the named one — cobalt is the case: "the requirement is for a
   * cobalt complex known as cyanocobalamine or vitamin B12" (immortality.txt:5882-5885), and
   * no book states an elemental cobalt amount (all 7 swept). So the target carries NO `low`
   * on purpose: there is no number to post, and inventing one is the exact bug this replaced
   * (a 400 mcg elemental cobalt target fanned off a B12 dose).
   *
   * ★ TYPED, not left to passthrough — for the same reason collective_group above is: state/
   * coverage.ts ROUTES on it, and an untyped routing read here once sent the omegas into the
   * rare-earth mineral meter. Resolution + no-cycle proof: mirrors_resolve (tools/invariants.py).
   */
  mirrors_slug: z.string().optional(),
  /**
   * True when Wallach names the plant-derived colloidal mineral vehicle as THIS essential's
   * supply route — THREE essentials carry it, not one. Tin is the case his own words settle:
   * "tin from plant derived colloidal minerals" (WAL-CLM-LETS-000451, 1995; repeated in
   * DDDL-000406/465/466, 2011), with DDDL-000287 recording his own use of it. GERMANIUM and
   * VANADIUM were admitted on 2026-08-21 by OWNER RULING rather than by that supply-sentence
   * test — both appear on his humic-shale roster (WAL-CLM-HELLS-000069), and the reasoning that
   * accepted each is recorded beside it in trace-mineral-vehicles.json.
   *
   * ⚠ This comment read "tin is the only case" until 2026-08-24, three days after the other two
   * landed in the data it describes. It was caught by a reader who trusted it, checked the
   * artifact, and got a different answer — the failure §00.B.3 names: a comment out of sync with
   * its code is a defect worse than no comment.
   *
   * Membership is hand-authored WITH citations in trace-mineral-vehicles.json and stamped here
   * by targets_derive, which refuses to build on a citation that does not resolve.
   *
   * It is NOT presence on the humic-shale roster — that roster lists calcium, sodium and
   * potassium, so presence cannot be the test and never becomes it.
   *
   * ★ TYPED, not left to passthrough, for the same reason as collective_group and
   * mirrors_slug above: state/coverage.ts ROUTES on it.
   */
  vehicle_supplied: z.boolean().optional(),
  /** The sealed claim ids proving the line above. Display + audit; classify does not read them. */
  vehicle_claim_ids: z.array(z.string()).optional(),
  /**
   * A stated SAFE INTAKE where Wallach gives no required amount — what he says you CAN take.
   * Silver is the only case: "Humans can consume 400 mcg of silver per day"
   * (WAL-CLM-DDDL-000013), with no row in his Base Line table and, in Epigenetics 2014, an
   * explicit "not required by any known biological system".
   *
   * It is NOT a `low` and must never be scored against: an essential carrying this has no
   * numeric floor, so classify covers it on a genuine source. It is carried so the page can
   * show what Wallach actually said — deleting his number would be its own dishonesty.
   * Audited by amounts_wallach_only exactly like a target (it is still his figure).
   */
  ceiling: z.number().optional(),
  /** Short kebab token naming why this is a ceiling. Gate-enforced; prose lives in the derive. */
  ceiling_reason: z.string().optional(),
}).passthrough();
export type CoverageTarget = z.infer<typeof CoverageTargetSchema>;

/** One nutrient line off a regimen item label (`name` + `amount` + `unit`). */
export const RegimenNutrientSchema = z.object({
  name: z.string(),
  amount: z.coerce.number(),
  unit: z.string().optional(),
  /** Optional label form (e.g. "Omega 3") — feeds fatty-acid resolution. */
  form: z.string().nullable().optional(),
}).passthrough();
export type RegimenNutrient = z.infer<typeof RegimenNutrientSchema>;

/** A product-vault entry (`regimen-label-lookup`) as the add-item picker needs it. The vault keys its display name as `canonical_name`. */
export const RegimenVaultEntrySchema = z.object({
  canonical_name: z.string().optional(),
  name: z.string().optional(),
  nutrients: z.array(z.unknown()).optional(),
  /** Discrete units in ONE label serving (2 for "2 tablets"). Absent when the serving has no
   *  countable unit — liquids, powders — in which case 1 dose = 1 serving, as before. */
  serving_units: z.number().int().positive().optional(),
  /** Singular noun for one unit ("tablet"). Present iff serving_units is. */
  serving_unit: z.string().optional(),
}).passthrough();
export type RegimenVaultEntry = z.infer<typeof RegimenVaultEntrySchema>;
