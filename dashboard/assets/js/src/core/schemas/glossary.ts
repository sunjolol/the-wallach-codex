/**
 * core/schemas/glossary.ts — plain-language term-glossary schema
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Validates dashboard/assets/data/glossary.json — the plain-language definitions
 * the Knowledge-drawer tooltip layer (state/glossary.ts + views) uses so no reader
 * is left not understanding a medical/technical term (memory: term-gloss-standard).
 *
 * These are GENERAL descriptive reference definitions (standard terminology), NOT
 * Wallach health claims — this schema narrows the shape, it does not author the data.
 * The invariant `glossary_wellformed` forbids any UNANCHORED digit in a definition, so
 * the glossary can never smuggle an unverifiable dose (§00.A stays clean); a number is
 * allowed only via `number_exempt`, which cites a sealed claim that literally contains
 * it (R9 2026-07-21, Luneth's reviewed override).
 *
 * NEW-data pattern (esbuild JSON import + Schema.parse at load), same as ocr-dict.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { z } from 'zod';

/** One plain-language glossary entry. */
export const GlossaryEntrySchema = z.object({
  term: z.string(),
  plain: z.string(),
  category: z.string(),
  aliases: z.array(z.string()).optional(),
  // Build-time provenance only: marks a definition permitted to carry a Wallach number,
  // ANCHORED to a sealed claim that literally contains it (invariant glossary_wellformed,
  // R9 2026-07-21). The app does not render it — it exists so the gate can prove the number
  // is cited, not smuggled into the one content layer the §00.A source gates do not cover.
  number_exempt: z
    .object({
      reason: z.string(),
      claim_ids: z.array(z.string()),
      approved: z.string(),
    })
    .optional(),
});
export type GlossaryEntry = z.infer<typeof GlossaryEntrySchema>;

/** Root shape of glossary.json (the `_doc` note is ignored by the object schema). */
export const GlossarySchema = z.object({
  terms: z.array(GlossaryEntrySchema),
});
export type Glossary = z.infer<typeof GlossarySchema>;
