/**
 * core/schemas/view-copy.ts — the VIEW-prose content-store schema (Phase H0)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Validates dashboard/assets/data/view-copy.json — the single hand-authored home
 * for VIEW prose (Charter R4): the claim-kind + search-facet display-label maps and
 * generic UI chrome copy. Consumed via state/copy.ts (esbuild JSON import + parse at
 * load, same pattern as glossary / ocr-dict); a bad/absent store degrades to empty so
 * a view falls back to the slug-transform label and never shows `undefined`.
 *
 * This is authored UI copy, NOT a Wallach fact — no dose, no number, no claim — so it
 * carries no §00.A obligation. The store is on the prose_contained clean surface
 * (_CLEAN_SURFACE_STORES) and its kind_labels coverage is gated by
 * kind_label_covers_corpus (every sealed claim.kind has a label).
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { z } from 'zod';

/** Root shape of view-copy.json (the `_purpose`/`_note` header keys are ignored). */
export const ViewCopySchema = z.object({
  /** claim.kind → uppercase display label (covers every sealed kind). */
  kind_labels: z.record(z.string()),
  /**
   * claim.kind → colour-category family (green/teal/amber/orange/violet/red), the locked
   * colour language (redesign blueprint §6). TOTAL over the sealed kinds — gated by
   * claim_category_mapping_total; state/copy.ts::kindCategory reads it.
   */
  kind_categories: z.record(z.string()),
  /** search facet → uppercase section header. */
  facet_labels: z.record(z.string()),
  /** generic chrome copy by id; grows as views migrate (H2-H4). */
  ui: z.record(z.string()),
});
export type ViewCopy = z.infer<typeof ViewCopySchema>;
