/**
 * core/schemas/home-curation.ts — the Home-tab curation-config schema (Phase H2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Validates dashboard/assets/data/home-curation.json — the hand-authored home for
 * the Home tab's SPECIAL curated selections (the home-page-curation philosophy).
 * Consumed via state/home-curation.ts (esbuild JSON import + parse at load, same
 * pattern as view-copy / glossary); a bad/absent store degrades to empty so the
 * Home Explore preview simply renders nothing rather than throwing.
 *
 * Editorial UI config, NOT a Wallach fact — no dose, no number, no claim — so it
 * carries no §00.A obligation. The slugs are navigation keys, resolved against the
 * search entity index at render.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { z } from 'zod';

/** Root shape of home-curation.json (the `_purpose` header key is ignored). */
export const HomeCurationSchema = z.object({
  /** Curated Home "Explore" preview: entity slugs (topic/concept), resolved + A-Z at render. */
  explore_preview: z.array(z.string()),
});
export type HomeCuration = z.infer<typeof HomeCurationSchema>;
