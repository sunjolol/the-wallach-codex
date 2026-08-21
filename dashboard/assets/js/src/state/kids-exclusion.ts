/**
 * state/kids-exclusion.ts — read boundary for the kids-product recommendation exclusion
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Surfaces dashboard/assets/data/kids-exclusion.json: the products that must never be
 * offered as a RECOMMENDATION because they are formulated for children.
 *
 * The product rule: kids-formulated products are never RECOMMENDED. They are good products,
 * but no adult will take them and this app has no child users — so they belong in the
 * products database to be discovered, not in a recommendation list.
 *
 * ★ THE BOUNDARY THIS DRAWS (get this wrong and the policy silently reverses).
 * There are TWO consumers of the product data and they want OPPOSITE things:
 *   · RECOMMENDATION surfaces — the essentials deep-dive's BEST SOURCES funnels through
 *     state/recommender.rankSources; the Coverage/Regimen rail and the condition pages
 *     funnel through state/recommender.rankProductsForCoverage. BOTH filter through
 *     isExcludedFromRecommendations() below, so neither filter is redundant.
 *   · THE PRODUCTS DATABASE (the Knowledge drawer's Products tab) — reads
 *     recommender.essentialSlugsByProduct(), which is deliberately NOT filtered. Kids
 *     products stay fully present + discoverable there. That is the whole point: they
 *     are good products, just not for this app's user.
 * This is ALSO why the filter is applied at READ time and NOT baked into the derive:
 * both consumers read the same generated product-recommender-data.json, so stripping
 * kids products from the artifact would erase them from the Products tab too — a fix
 * elegant in the derive that lies on the screen.
 *
 * ★ CURATION, NOT A CLAIM. This list is OURS. It is not a Wallach statement, and it
 * changes no target, dose, or composition — only what we choose to surface. No §00.A
 * obligation attaches to it.
 *
 * Gated by `kids_products_not_recommended` (critical): every id resolves to a real
 * product, rankSources filters, essentialSlugsByProduct does not.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import exclusionData from '../../../data/kids-exclusion.json';
import { type KidsExclusion, KidsExclusionSchema } from '../core/schemas/index.js';

/**
 * Parsed ONCE at module load, and deliberately NOT wrapped in a safe fallback.
 *
 * ★ WHY THIS THROWS instead of degrading to empty like its home-curation sibling:
 * an empty exclusion list is not a degraded feature, it is a SILENT POLICY REVERSAL —
 * every kids product flows straight back into the ranking and the UI looks perfectly
 * healthy while doing the one thing this list exists to prevent. The store is inlined
 * at BUILD time (esbuild JSON import), so a parse failure here means the build itself
 * is broken and must not ship. Loud beats plausible — no silent failures.
 */
const DATA: KidsExclusion = KidsExclusionSchema.parse(exclusionData);

/** product_id → excluded. Read-only by type (a compile-time guarantee, not a runtime
 *  freeze): this is policy, not mutable state. */
const EXCLUDED: ReadonlySet<string> = new Set(DATA.excluded.map(e => e.product_id));

/**
 * True iff `productId` must never appear as a RECOMMENDATION.
 *
 * Call this on every recommendation path. Do NOT call it on the Products-tab /
 * database path — kids products are meant to be discoverable there.
 */
export function isExcludedFromRecommendations(productId: string): boolean {
  return EXCLUDED.has(productId);
}

/**
 * Every excluded product id. Exposed for the gate + tests (and any future "why is this
 * not recommended?" affordance); views should call isExcludedFromRecommendations().
 */
export function excludedProductIds(): readonly string[] {
  return DATA.excluded.map(e => e.product_id);
}
