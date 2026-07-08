/**
 * core/schemas/nutrient-resolver.ts — Zod schema for the runtime identity-resolver map
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Narrows `dashboard/assets/data/nutrient-resolver-data.json` — the map the offline app
 * inlines so core/nutrient-resolver.ts resolves a nutrient label name to a canon slug
 * through the SAME tables as the Python resolver (eden/tools/nutrient_resolve.py). The
 * artifact is GENERATED from that resolver + the sealed pillars (registry + canon), so it
 * cannot drift; the nutrient_resolver_parity invariant + a vitest prove TS ≡ Python.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { z } from 'zod';

/** name(lower) → canon-slug maps + the rule tables `resolve()` consults. */
export const NutrientResolverSchema = z.object({
  vitamin_aliases: z.record(z.string(), z.string()),
  mineral_aliases: z.record(z.string(), z.string()),
  mineral_names: z.record(z.string(), z.string()),
  amino_names: z.record(z.string(), z.string()),
  /** [essential slug, regex source] pairs — fatty-acid family resolution. */
  fatty_acid_patterns: z.array(z.tuple([z.string(), z.string()])),
  /** Regex whose capture group is an explicit omega digit (3/6/9) — wins over the keywords. */
  omega_digit_pattern: z.string(),
  stereo_prefixes: z.array(z.string()),
}).passthrough();
export type NutrientResolverMap = z.infer<typeof NutrientResolverSchema>;
