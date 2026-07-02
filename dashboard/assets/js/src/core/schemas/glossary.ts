/**
 * core/schemas/glossary.ts — plain-language term-glossary schema
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Validates dashboard/assets/data/glossary.json — the plain-language definitions
 * the Knowledge-drawer tooltip layer (state/glossary.ts + views) uses so no reader
 * is left not understanding a medical/technical term (memory: term-gloss-standard).
 *
 * These are GENERAL descriptive reference definitions (standard terminology), NOT
 * Wallach health claims or numeric targets — this schema narrows the shape, it does
 * not author the data, and the invariant `glossary_wellformed` forbids any digit in
 * a definition so the glossary can never assert a dose/target (§00.A stays clean).
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
});
export type GlossaryEntry = z.infer<typeof GlossaryEntrySchema>;

/** Root shape of glossary.json (the `_doc` note is ignored by the object schema). */
export const GlossarySchema = z.object({
  terms: z.array(GlossaryEntrySchema),
});
export type Glossary = z.infer<typeof GlossarySchema>;
