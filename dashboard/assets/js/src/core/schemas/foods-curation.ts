/**
 * core/schemas/foods-curation.ts -- the Absorption tab curation-config schema
 * ===========================================================================
 *
 * Validates dashboard/assets/data/foods-curation.json -- the hand-authored home for the
 * Absorption tab's SPECIAL curated selections (the home-page-curation philosophy; mirrors
 * home-curation.ts). Consumed via state/foods-curation.ts (esbuild JSON import + parse at
 * load); a bad/absent store degrades to empty so the landing renders nothing rather than
 * throwing.
 *
 * Editorial UI config, NOT a Wallach fact -- no dose, no number -- so it carries no
 * source-rule obligation. hero_claims are sealed-claim IDs; remove/eat/conditional are the
 * good/bad-foods classification (entity slugs), each resolved against the search index at
 * render (an unresolved id/slug is skipped).
 * ===========================================================================
 */

import { z } from 'zod';

/** Root shape of foods-curation.json (the `_purpose` header key is ignored). */
export const FoodsCurationSchema = z.object({
  /** Curated crown-jewel claim IDs anchoring the landing's two-pronged thesis, in curated order. */
  hero_claims: z.array(z.string()),
  /** Foods to take out (bad) -- entity slugs, in display order. */
  remove: z.array(z.string()).default([]),
  /** Foods to favor (good) -- entity slugs, in display order. */
  eat: z.array(z.string()).default([]),
  /** Conditional foods (stance turns on the form/context) -- entity slugs, in display order. */
  conditional: z.array(z.string()).default([]),
  /**
   * Section 04 (digestive enzymes): sealed claim IDs, in curated reading order. Defaulted so a
   * config predating the section still parses rather than emptying the whole tab.
   */
  enzyme_claims: z.array(z.string()).default([]),
  /** Featured pull-quote under the villi scan: a sealed search-claim id + the substring to highlight from (to the end). */
  villi_quote: z.object({ id: z.string(), highlight_from: z.string() }).optional(),
  /** Section 04 pull-quote: a sealed claim id + a faithful contiguous excerpt of its verbatim (excerpt_from..excerpt_to) with `mark` highlighted; the boundaries point INTO the sealed verbatim, never hand-typed. */
  sec04_quote: z.object({ id: z.string(), excerpt_from: z.string(), excerpt_to: z.string(), mark: z.string() }).optional(),
});
export type FoodsCuration = z.infer<typeof FoodsCurationSchema>;
