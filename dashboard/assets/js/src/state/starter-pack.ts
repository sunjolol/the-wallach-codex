/**
 * state/starter-pack.ts — read boundary for the curated starter-pack ordering
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Surfaces dashboard/assets/data/starter-pack.json: the fixed, ordered products every user
 * is offered FIRST, ahead of anything the scorer picks.
 *
 * ★ WHY A CURATED ORDER EXISTS AT ALL, and why it is not an admission the ranker is broken.
 * The scorer answers "which single product reaches the most of what you want, per dollar?"
 * — and it answers it correctly. The problem is that the question has nearly the same answer
 * for everyone: the breadth term reads each product's GLOBAL breadth, so it is identical no
 * matter which goal is picked, and broad multis therefore win everywhere. Measured against
 * the shipped data: 124 card slots across every goal were filled by only 12 distinct
 * products. A scorer that returns the same list for all goals is not ranking, it is
 * repeating. The pack makes that opening deliberate and legible instead of emergent, and
 * frees the scored tail to do the thing scoring is actually good at — closing whatever gap
 * the pack left behind.
 *
 * ★ CURATION, NOT A CLAIM. This list is OURS. It is not a Wallach statement, and it changes
 * no target, dose, price or composition — only the order we surface products in. No §00.A
 * obligation attaches to it. Same standing as state/kids-exclusion.ts.
 *
 * ★ WHAT A PIN DOES NOT BUY. A pinned product is still kid-filtered, still leaves the list
 * once owned (which is what makes the list terminate), and still gets its `supplies N` from
 * composition like any other card. Pinning sets ORDER and nothing else.
 *
 * Gated by `starter_pack_resolves` (critical): every pinned id resolves to a real product in
 * the sealed pillar, and no pinned id is also on the kids-exclusion list.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import starterPackData from '../../../data/starter-pack.json';
import { type StarterPack, StarterPackSchema } from '../core/schemas/index.js';

/**
 * Parsed ONCE at module load, and deliberately NOT wrapped in a safe fallback.
 *
 * ★ WHY THIS THROWS instead of degrading to empty: an empty pack is not a degraded feature,
 * it is a SILENT REVERSION to the pure scored ranking — the exact behaviour the pack was
 * added to replace — and the UI looks perfectly healthy while doing it. The store is inlined
 * at BUILD time (esbuild JSON import), so a parse failure means the build is broken and must
 * not ship. Loud beats plausible.
 */
const DATA: StarterPack = StarterPackSchema.parse(starterPackData);

/**
 * The pinned product ids, IN OFFER ORDER.
 *
 * Read-only by type (a compile-time guarantee, not a runtime freeze): this is policy, not
 * mutable state. Callers pass it straight to rankProductsForCoverage's `pinned`.
 */
const PINNED: readonly string[] = DATA.pinned.map(e => e.product_id);

/** The starter pack, in the order it is offered. */
export function starterPackIds(): readonly string[] {
  return PINNED;
}

/** How many products the pack holds. Derived from the list — never write this number down. */
export function starterPackSize(): number {
  return PINNED.length;
}
