/**
 * core/schemas/coverage-status.ts — narrowing schemas for the live coverage engine
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The shared blocks type their interesting fields loosely on purpose:
 *   `EssentialSchema.target`        is `z.unknown()` (shape varies by kind)
 *   `RegimenLabelSchema.nutrients`  is `z.array(z.unknown())`
 *
 * state/coverage.ts narrows them HERE at the point of use, so the classifier
 * (faithful port of legacy classifyLive / computeLiveCoverage) reads typed
 * numbers without forcing a strict shape onto Luneth-owned data upstream.
 * Both are `.passthrough()` — extra fields are preserved, never rejected.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { z } from 'zod';

/** A Wallach target as the coverage classifier needs it (`essentials-targets-data`). */
export const CoverageTargetSchema = z.object({
  /** trace_pdm · hbsp · dietary · wallach · wallach_clinical · dietary_with_clinical_lever · unspecified · … */
  kind: z.string().optional(),
  /** Lower bound of the Wallach target in `unit`. */
  low: z.number().optional(),
  high: z.number().optional(),
  unit: z.string().optional(),
}).passthrough();
export type CoverageTarget = z.infer<typeof CoverageTargetSchema>;

/** One nutrient line off a regimen item label (`name` + `amount` + `unit`). */
export const RegimenNutrientSchema = z.object({
  name: z.string(),
  amount: z.coerce.number(),
  unit: z.string().optional(),
  /** Optional label form (e.g. "Omega 3") — feeds fatty-acid resolution (A2). */
  form: z.string().nullable().optional(),
}).passthrough();
export type RegimenNutrient = z.infer<typeof RegimenNutrientSchema>;

/** A product-vault entry (`regimen-label-lookup`) as the add-item picker needs it. The vault keys its display name as `canonical_name`. */
export const RegimenVaultEntrySchema = z.object({
  canonical_name: z.string().optional(),
  name: z.string().optional(),
  nutrients: z.array(z.unknown()).optional(),
}).passthrough();
export type RegimenVaultEntry = z.infer<typeof RegimenVaultEntrySchema>;
