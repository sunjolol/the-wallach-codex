/**
 * core/schemas/kids-exclusion.ts — the kids-product recommendation-exclusion schema
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Validates dashboard/assets/data/kids-exclusion.json — the hand-authored curation
 * list of products that must never be RECOMMENDED because they are formulated for
 * children (Luneth 2026-07-16). Consumed via state/kids-exclusion.ts (esbuild JSON
 * import + parse at load, same pattern as home-curation / foods-curation).
 *
 * Editorial CURATION config, NOT a Wallach fact — no dose, no number, no claim — so
 * it carries no §00.A obligation. It changes what we SHOW, never a target.
 *
 * ★ WHY THIS SCHEMA IS STRICTER THAN ITS SIBLINGS (the fail-open trap).
 * home-curation degrades to empty on a bad store, and that is right for it: an empty
 * Explore preview renders nothing — the failure is VISIBLE and harmless. An empty
 * EXCLUSION list is the opposite: it silently un-excludes every kids product and puts
 * them straight back into the recommendation ranking, looking exactly like success.
 * So this schema requires a NON-EMPTY list (`.min(1)`) and state/kids-exclusion.ts
 * THROWS on a parse failure rather than falling back to empty. A build that cannot
 * read this list must not ship — never trade fail-safe for fail-green
 * (memory: derive-elegance-is-not-user-truth).
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { z } from 'zod';

/** One excluded product: the pillar id + the evidence that justifies excluding it. */
const KidsExclusionEntrySchema = z.object({
  /**
   * Canon product id — MUST resolve against eden/products/products.json. The display
   * name is deliberately NOT stored here (R3: the pillar is its one home); the
   * `kids_products_not_recommended` invariant resolves every id and REDs on an
   * unknown one, so a typo cannot silently un-exclude a kids product.
   */
  product_id: z.string().min(1),
  /**
   * WHY this product is excluded, quoting the Youngevity copy / label panel it was
   * read from. Never a product NAME inference — the name heuristic both over- and
   * under-fires (see the artifact's `_evidence_note`).
   */
  evidence: z.string().min(1),
});
/** Root shape of kids-exclusion.json (the `_`-prefixed header keys are ignored). */
export const KidsExclusionSchema = z.object({
  /**
   * The excluded products. NON-EMPTY by construction: an empty list is
   * indistinguishable from "the filter is broken", and would fail open.
   */
  excluded: z.array(KidsExclusionEntrySchema).min(1),
});
export type KidsExclusion = z.infer<typeof KidsExclusionSchema>;
