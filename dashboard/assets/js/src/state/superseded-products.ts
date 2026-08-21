/**
 * state/superseded-products.ts — read boundary for the superseded-product exclusion
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Surfaces dashboard/assets/data/superseded-products.json: products a newer version of the
 * same supplement has replaced, which must never be offered as a RECOMMENDATION.
 *
 * The rule, in the owner's words (2026-08-21): "never recommend the BTT 2.0 canister, since
 * the 2.5 supersedes it and no one is going to take 2 versions of 1 supplement." A ranker
 * that offers both versions of one product is not giving a richer list; it is giving a list
 * that contradicts itself, and it burns one of the nine slots Coverage will ever spend.
 *
 * ★ THE SAME ASYMMETRY AS kids-exclusion, and it matters for the same reason: excluded from
 * RECOMMENDATION, fully present in the Products DATABASE. Someone may already own the older
 * version and come looking for it; hiding it from the catalogue would be a different lie.
 * So this filter goes on the recommendation paths only — never on
 * recommender.essentialSlugsByProduct(), which is the Products-tab path.
 *
 * ★ WHY A SECOND FILE rather than widening kids-exclusion: that file, its schema, its state
 * module and its critical gate are all specifically and thoroughly about products formulated
 * for CHILDREN. Folding an unrelated curation into it would blur a well-documented rule to
 * save a file. Two reasons, two lists, two gates — one shared filter point.
 *
 * ★ CURATION, NOT A CLAIM. Ours, not Wallach's; it changes no target, dose, price or
 * composition. No §00.A obligation attaches.
 *
 * Gated by `superseded_products_not_recommended` (critical).
 * ═══════════════════════════════════════════════════════════════════════════
 */

import supersededData from '../../../data/superseded-products.json';
import { type SupersededProducts, SupersededProductsSchema } from '../core/schemas/index.js';

/**
 * Parsed ONCE at module load, deliberately NOT wrapped in a safe fallback — an empty list is
 * a SILENT POLICY REVERSAL, not a degraded feature. See the schema for the full reasoning.
 */
const DATA: SupersededProducts = SupersededProductsSchema.parse(supersededData);

const RETIRED: ReadonlySet<string> = new Set(DATA.superseded.map(e => e.product_id));

/**
 * True iff `productId` has been replaced by a newer version and must never be RECOMMENDED.
 *
 * Call this on every recommendation path, beside isExcludedFromRecommendations(). Do NOT
 * call it on the Products-tab / database path.
 */
export function isSupersededProduct(productId: string): boolean {
  return RETIRED.has(productId);
}
