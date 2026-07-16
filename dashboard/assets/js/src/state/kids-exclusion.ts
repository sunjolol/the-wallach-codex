/**
 * state/kids-exclusion.ts — read boundary for the kids-product recommendation exclusion
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Surfaces dashboard/assets/data/kids-exclusion.json: the products that must never be
 * offered as a RECOMMENDATION because they are formulated for children.
 *
 * Luneth, 2026-07-16: "no kids products ever get recommended as items … they are good
 * but no adult is ever going to take those and they're better as a database item to be
 * discovered in the products tab … kids will never use our app."
 *
 * ★ THE BOUNDARY THIS DRAWS (get this wrong and it breaks his actual requirement).
 * There are TWO consumers of the product data and they want OPPOSITE things:
 *   · RECOMMENDATION surfaces (Coverage recs · condition pages · the element/entity
 *     detail view's BEST SOURCES) — all funnel through state/recommender.rankSources,
 *     which filters through isExcludedFromRecommendations() below.
 *   · THE PRODUCTS DATABASE (the Knowledge drawer's Products tab) — reads
 *     recommender.essentialSlugsByProduct(), which is deliberately NOT filtered. Kids
 *     products stay fully present + discoverable there. That is the whole point: they
 *     are good products, just not for this app's user.
 * This is ALSO why the filter is applied at READ time and NOT baked into the derive:
 * both consumers read the same generated product-recommender-data.json, so stripping
 * kids products from the artifact would erase them from the Products tab too — a fix
 * elegant in the derive that lies on the screen (memory: derive-elegance-is-not-user-truth).
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
 * healthy while doing the one thing Luneth asked it never to do. The store is inlined
 * at BUILD time (esbuild JSON import), so a parse failure here means the build itself
 * is broken and must not ship. Loud beats plausible (§00.B #1: no silent failures).
 */
const DATA: KidsExclusion = KidsExclusionSchema.parse(exclusionData);

/** product_id → excluded. Frozen: this is policy, not mutable state. */
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
