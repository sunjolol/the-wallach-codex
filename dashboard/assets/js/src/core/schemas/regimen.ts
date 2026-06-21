/**
 * core/schemas/regimen.ts — Zod schemas for §31 chokepoint LS keys
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Every regimen LS key has a Zod schema here. Reads go through `getValidated`
 * (in core/storage.ts) so bad data never enters typed-land. Writes can go
 * through `setValidated` for the same guarantee at the write boundary.
 *
 * Schemas are the single source of truth for BOTH runtime validation AND
 * static types — `z.infer<typeof RegimenSchema>` gives you the TS type for
 * free, no parallel interface definitions to drift.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { z } from 'zod';

/** A single product/item label as stored in localStorage. */
export const RegimenLabelSchema = z.object({
  name: z.string(),
  brand: z.string().optional(),
  nutrients: z.array(z.unknown()).optional(),
}).passthrough(); // allow additional fields per the legacy [k: string]: unknown

/** A regimen item — what one saved supplement looks like in LS. */
export const RegimenItemSchema = z.object({
  id: z.number(),
  label: RegimenLabelSchema,
  addedDate: z.string(), // ISO YYYY-MM-DD
  provenance: z.string(), // 'user_scanned' | 'user_manual' | 'wishlist_promoted' | ...
});

/** The full regimen as stored in 'lcRegimen_v1'. */
export const RegimenSchema = z.object({
  items: z.array(RegimenItemSchema),
});

/** Per-item dose overrides as stored in 'rgOverrides_v1'. */
export const OverridesMapSchema = z.record(z.string(), z.record(z.string(), z.unknown()));

/** Manually-added items as stored in 'rgManualItems_v1'. */
export const RgManualSchema = z.array(RegimenItemSchema);

/** Hidden item IDs as stored in 'rgRemoved_v1'. */
export const RgRemovedSchema = z.array(z.number());

/** User-selected goal keys as stored in 'rgUserGoals_v1'. */
export const RgUserGoalsSchema = z.array(z.string());

// Inferred types (so consumers can `import type { Regimen } from '@core/schemas/regimen'`)
export type RegimenLabel = z.infer<typeof RegimenLabelSchema>;
export type RegimenItem = z.infer<typeof RegimenItemSchema>;
export type Regimen = z.infer<typeof RegimenSchema>;
export type OverridesMap = z.infer<typeof OverridesMapSchema>;
export type RgManual = z.infer<typeof RgManualSchema>;
export type RgRemoved = z.infer<typeof RgRemovedSchema>;
export type RgUserGoals = z.infer<typeof RgUserGoalsSchema>;
