/**
 * core/schemas/scanner-corpus.ts — Wallach scan-corpus schema
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Validates dashboard/assets/data/scanner-corpus-data.json — the Wallach
 * doctrine corpus the Scanner's verdict engine scores against. Migrated VERBATIM
 * (Chunk 6b) from the pre-TS inline dashboard (DIETARY_BASELINE · GOAL_KEYWORDS ·
 * NUTRIENT_TO_GOAL_MAP · GOAL_DISPLAY_NAMES · ANTI_LIST · ANTI_LIST_NOTES ·
 * HARD_REJECT_TERMS · SERIOUS_ANTI). §00.A: every number + every "why" citation
 * is the legacy value unchanged — this schema narrows the shape, it does not
 * author the data (Luneth owns the corpus).
 *
 * This is the NEW-data pattern (esbuild JSON import + Schema.parse at load),
 * same as coverage-layout-data.json.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { z } from 'zod';

/** One assumed-dietary-intake entry (mass/IU per day). */
export const DietaryBaselineEntrySchema = z.object({
  amount: z.number(),
  unit: z.string(),
});
export type DietaryBaselineEntry = z.infer<typeof DietaryBaselineEntrySchema>;

/** One Wallach-anchored nutrient→goal mapping with its why-snippet. */
export const NutrientGoalEntrySchema = z.object({
  nutrient: z.string(),
  why: z.string(),
});
export type NutrientGoalEntry = z.infer<typeof NutrientGoalEntrySchema>;

/** Root shape of scanner-corpus-data.json. */
export const ScanCorpusSchema = z.object({
  dietaryBaseline: z.record(z.string(), DietaryBaselineEntrySchema),
  goalKeywords: z.record(z.string(), z.array(z.string())),
  nutrientToGoalMap: z.record(z.string(), z.array(NutrientGoalEntrySchema)),
  goalDisplayNames: z.record(z.string(), z.string()),
  antiList: z.record(z.string(), z.array(z.string())),
  antiListNotes: z.record(z.string(), z.string()),
  hardRejectTerms: z.array(z.string()),
  seriousAnti: z.array(z.string()),
});
export type ScanCorpus = z.infer<typeof ScanCorpusSchema>;
