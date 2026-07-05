/**
 * core/schemas/ocr-dict.ts — OCR fuzzy-correction dictionary schema
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Validates dashboard/assets/data/ocr-dict-data.json — the two word lists the
 * native OCR pipeline (state/ocr.ts) uses to clean up Tesseract misreads:
 *   - fuzzyDict: food / ingredient terms; a Levenshtein pass snaps near-misses
 *     (e.g. "Suntlower" → "Sunflower") onto the nearest known term.
 *   - knownNutrientNames: nutrition-panel nutrient labels the parser scans the
 *     whole OCR text for, to recover data when PSM-6 collapses the panel into a
 *     single line and the per-line regex can't anchor.
 *
 * Migrated VERBATIM (Chunk 6c) from the pre-TS inline dashboard (OCR_FUZZY_DICT +
 * KNOWN_NUTRIENT_NAMES); the runtime dedups fuzzyDict into a Set, so duplicate
 * source terms are preserved here unchanged. §00.A: this schema narrows the
 * shape, it does not author the data (Luneth owns the corpus).
 *
 * NEW-data pattern (esbuild JSON import + Schema.parse at load), same as
 * scanner-corpus-data.json / coverage-layout-data.json.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { z } from 'zod';

/** Root shape of ocr-dict-data.json. */
export const OcrDictSchema = z.object({
  fuzzyDict: z.array(z.string()),
  knownNutrientNames: z.array(z.string()),
});
export type OcrDict = z.infer<typeof OcrDictSchema>;
