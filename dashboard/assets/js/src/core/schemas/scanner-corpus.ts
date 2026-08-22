/**
 * core/schemas/scanner-corpus.ts — Wallach scan-corpus schema
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Validates dashboard/assets/data/scanner-corpus-data.json — the Wallach
 * doctrine corpus the Scanner's verdict engine scores against — dietary baselines, goal
 * keywords, the nutrient-to-goal map, and the anti-list with its notes and hard/serious
 * tiers. §00.A: every number and every "why" citation is authored in the data file; this
 * schema narrows the shape, it does not author the data.
 *
 * This is the NEW-data pattern (esbuild JSON import + Schema.parse at load),
 * same as coverage-layout-data.json.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { z } from 'zod';

/** One Wallach-anchored nutrient→goal mapping with its why-snippet. */
export const NutrientGoalEntrySchema = z.object({
  nutrient: z.string(),
  why: z.string(),
});
export type NutrientGoalEntry = z.infer<typeof NutrientGoalEntrySchema>;

/** Root shape of scanner-corpus-data.json. */
export const ScanCorpusSchema = z.object({
  goalKeywords: z.record(z.string(), z.array(z.string())),
  nutrientToGoalMap: z.record(z.string(), z.array(NutrientGoalEntrySchema)),
  goalDisplayNames: z.record(z.string(), z.string()),
  antiList: z.record(z.string(), z.array(z.string())),
  antiListNotes: z.record(z.string(), z.string()),
  hardRejectTerms: z.array(z.string()),
  seriousAnti: z.array(z.string()),
});
export type ScanCorpus = z.infer<typeof ScanCorpusSchema>;
