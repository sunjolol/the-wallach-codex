/**
 * core/schemas/foods-curation.ts -- the Foods & Absorption tab curation-config schema
 * ===========================================================================
 *
 * Validates dashboard/assets/data/foods-curation.json -- the hand-authored home for
 * the Foods & Absorption tab's SPECIAL curated selections (the home-page-curation
 * philosophy; mirrors home-curation.ts). Consumed via state/foods-curation.ts
 * (esbuild JSON import + parse at load); a bad/absent store degrades to empty so the
 * landing simply renders no thesis cards rather than throwing.
 *
 * Editorial UI config, NOT a Wallach fact -- no dose, no number -- so it carries no
 * source-rule obligation. hero_claims are sealed-claim IDs, resolved against the
 * search index at render (an unresolved id is skipped).
 * ===========================================================================
 */

import { z } from 'zod';

/** Root shape of foods-curation.json (the `_purpose` header key is ignored). */
export const FoodsCurationSchema = z.object({
  /** Curated crown-jewel claim IDs anchoring the landing's two-pronged thesis, in curated order. */
  hero_claims: z.array(z.string()),
});
export type FoodsCuration = z.infer<typeof FoodsCurationSchema>;
