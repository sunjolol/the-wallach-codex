/**
 * core/schemas/corpus.ts — Zod boundary for the sealed-corpus embed
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Validates dashboard/assets/data/corpus-embed.json — the build-time projection
 * of the sealed Wallach claim graph (eden/corpus). The offline file:// app
 * inlines this via esbuild JSON import in state/corpus.ts; these schemas are the
 * single point where that untyped JSON crosses into typed-land.
 *
 * Shapes mirror the ACTUAL derived output of eden/tools/corpus_derive.py +
 * corpus_embed.py (byte-verified by corpus_verify check #8), NOT the aspirational
 * shape in SCHEMA.md §4 — the derive output is the canonical runtime truth.
 * .passthrough() keeps the boundary tolerant to additive corpus evolution.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { z } from 'zod';

/** A dose atom — only populated when kind === 'dose'; every field may be null. */
export const CorpusDoseSchema = z.object({
  amount: z.union([z.number(), z.string()]).nullable().optional(),
  unit: z.string().nullable().optional(),
  period: z.string().nullable().optional(),
  form: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  for_condition: z.string().nullable().optional(),
}).passthrough();

/** One slim claim atom — the runtime-needed projection of a sealed claim. */
export const CorpusClaimSchema = z.object({
  id: z.string(),
  kind: z.string(),
  claim_text: z.string(),
  verbatim: z.string(),
  dose: CorpusDoseSchema.nullable(),
  book: z.string(),
  essentials: z.array(z.string()),
  other_substances: z.array(z.string()),
  conditions: z.array(z.string()),
  symptoms: z.array(z.string()),
  confidence: z.string(),
}).passthrough();

/** A deficiency-sign edge inside an essential entry. */
export const CorpusDeficiencySignSchema = z.object({
  sign: z.string(),
  claim_id: z.string(),
  confidence: z.string(),
}).passthrough();

/** One essential entry — derived index joined with canon layout_key + symbol. */
export const CorpusEssentialSchema = z.object({
  slug: z.string(),
  display_name: z.string(),
  layout_key: z.string(),
  category: z.string(),
  symbol: z.string(),
  claim_count: z.number(),
  claims_by_kind: z.record(z.string(), z.array(z.string())),
  deficiency_signs: z.array(CorpusDeficiencySignSchema),
  conditions_treated: z.array(z.string()),
  interacts_with: z.array(z.string()),
  books_cited: z.array(z.string()),
}).passthrough();

/** One condition entry — derived index (slug -> claim roles). */
export const CorpusConditionSchema = z.object({
  slug: z.string(),
  display_name: z.string(),
  claim_count: z.number(),
  claims_by_role: z.record(z.string(), z.array(z.string())),
  essentials_involved: z.array(z.string()),
  other_substances_involved: z.array(z.string()),
  books_cited: z.array(z.string()),
}).passthrough();

/** An in-housed book — label fields + real per-book claim_count + spine code. */
export const CorpusBookSchema = z.object({
  title: z.string(),
  edition: z.string().nullable().optional(),
  year: z.union([z.number(), z.string()]).nullable().optional(),
  authors: z.array(z.string()).optional(),
  code: z.string().optional(),
  claim_count: z.number().optional(),
  status: z.string().optional(),
}).passthrough();

/** A planned (not-yet-in-housed) book — shown 'coming soon' in the Corpus tab. */
export const CorpusPlannedBookSchema = z.object({
  title: z.string(),
  authors: z.array(z.string()).optional(),
  code: z.string().optional(),
}).passthrough();

/** The whole embed — knowledge_version is the freshness stamp (no timestamp). */
export const CorpusEmbedSchema = z.object({
  knowledge_version: z.number(),
  books: z.record(z.string(), CorpusBookSchema),
  planned_books: z.array(CorpusPlannedBookSchema),
  essentials: z.record(z.string(), CorpusEssentialSchema),
  conditions: z.record(z.string(), CorpusConditionSchema),
  claims: z.record(z.string(), CorpusClaimSchema),
}).passthrough();

export type CorpusDose = z.infer<typeof CorpusDoseSchema>;
export type CorpusClaim = z.infer<typeof CorpusClaimSchema>;
export type CorpusDeficiencySign = z.infer<typeof CorpusDeficiencySignSchema>;
export type CorpusEssential = z.infer<typeof CorpusEssentialSchema>;
export type CorpusCondition = z.infer<typeof CorpusConditionSchema>;
export type CorpusBook = z.infer<typeof CorpusBookSchema>;
export type CorpusPlannedBook = z.infer<typeof CorpusPlannedBookSchema>;
export type CorpusEmbed = z.infer<typeof CorpusEmbedSchema>;
