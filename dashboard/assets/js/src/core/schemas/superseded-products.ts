/**
 * core/schemas/superseded-products.ts — the superseded-product exclusion schema
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Validates dashboard/assets/data/superseded-products.json — the hand-authored curation list
 * of products a newer version has replaced, which must therefore never be RECOMMENDED.
 * Consumed via state/superseded-products.ts (esbuild JSON import + parse at load, the same
 * pattern as kids-exclusion / starter-pack / home-curation).
 *
 * Editorial CURATION config, NOT a Wallach fact — no dose, no number, no claim — so it
 * carries no §00.A obligation. It changes what we SHOW, never a target.
 *
 * ★ FAILS LOUD, for the same reason kids-exclusion does. An empty exclusion list is not a
 * degraded feature: it silently puts both versions of one supplement back into the same
 * ranking and looks perfectly healthy doing it. The store is inlined at BUILD time, so a
 * parse failure means the build is broken and must not ship.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { z } from 'zod';

/** One superseded product: what is retired, what replaced it, and the evidence. */
const SupersededEntrySchema = z.object({
  /**
   * Canon product id of the RETIRED product — MUST resolve against the sealed pillar. The
   * `superseded_products_not_recommended` invariant REDs on an unknown id, so a typo cannot
   * silently un-exclude it.
   */
  product_id: z.string().min(1),
  /**
   * Canon product id of the product that REPLACED it. Required, not optional: excluding
   * something without naming its replacement leaves a hole in the catalogue and no way to
   * check the exclusion still makes sense. The gate proves this one resolves AND is not
   * itself superseded.
   */
  superseded_by: z.string().min(1),
  /** WHY these are two versions of one supplement, in terms of the pillar's own record. */
  evidence: z.string().min(1),
});

/** Root shape of superseded-products.json (the `_`-prefixed header keys are ignored). */
export const SupersededProductsSchema = z.object({
  /** Non-empty by construction — an empty list is indistinguishable from a broken filter. */
  superseded: z.array(SupersededEntrySchema).min(1),
});
export type SupersededProducts = z.infer<typeof SupersededProductsSchema>;
