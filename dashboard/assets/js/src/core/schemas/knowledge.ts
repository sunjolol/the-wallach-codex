/**
 * core/schemas/knowledge.ts — Zod schemas for knowledge-drawer data sources
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Covers the two embedded JSON blocks the knowledge drawer reads:
 *   `essentials-targets-data` — Wallach targets DB (90 essentials + Omega-9) with stance + citations
 *   `regimen-label-lookup`    — product vault, keyed by id (mixed shapes)
 *
 * Both are read via getElementById + JSON.parse at the boundary; schemas
 * validate before any field access enters typed-land.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { z } from 'zod';

/** A single essential entry from `essentials-targets-data`. */
export const EssentialSchema = z.object({
  name: z.string(),
  /** Canon slug — the join key to the registry resolver (added A2). */
  slug: z.string(),
  category: z.string(),
  target: z.unknown().optional(),
  wallach_stance: z.object({
    // §00.A educational layer, two honest fields:
    //   summary  — our modern-voice, plain-language reading of Wallach's position
    //   verbatim — Wallach's exact words from `citation` (null when the cited
    //              source is a Youngevity label with no quotable prose)
    // The wallach_stance_verbatim_in_book invariant enforces verbatim ⊆ cited book.
    summary: z.string().optional(),
    verbatim: z.string().nullable().optional(),
    citation: z.string().optional(),
    context: z.string().optional(),
  }).optional(),
}).passthrough();

/** The full `essentials-targets-data` JSON shape — `{ essentials: [...] }`. */
export const EssentialsDataSchema = z.object({
  essentials: z.array(EssentialSchema),
}).passthrough();

/** A single product entry — minimal shape, allow additional fields. */
export const ProductEntrySchema = z.object({
  canonical_name: z.string().optional(),
  name: z.string().optional(),
  brand: z.string().optional(),
  nutrients: z.array(z.unknown()).optional(),
}).passthrough();

/**
 * The `regimen-label-lookup` shape — keyed by product id with mixed values
 * (single entries, arrays of entries, occasionally other shapes). We
 * permissively type the values as unknown; the reader pattern walks the
 * record and validates each value against ProductEntrySchema.
 */
export const ProductsLookupSchema = z.record(z.string(), z.unknown());

export type Essential = z.infer<typeof EssentialSchema>;
export type EssentialsData = z.infer<typeof EssentialsDataSchema>;
export type ProductEntry = z.infer<typeof ProductEntrySchema>;
export type ProductsLookup = z.infer<typeof ProductsLookupSchema>;
