/**
 * core/schemas/starter-pack.ts — the curated starter-pack ordering schema
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Validates dashboard/assets/data/starter-pack.json — the hand-authored, ORDERED list of
 * products every user is offered first, ahead of anything the scorer picks. Consumed via
 * state/starter-pack.ts (esbuild JSON import + parse at load, the same pattern as
 * kids-exclusion / home-curation / foods-curation).
 *
 * Editorial CURATION config, NOT a Wallach fact — no dose, no amount, no claim — so it
 * carries no §00.A obligation. It changes the ORDER we show products in, never a target.
 *
 * ★ WHY THIS FAILS LOUD rather than degrading to empty. An empty starter pack is not a
 * degraded feature: the rail silently reverts to the pure scored ranking, which is the exact
 * behaviour the pack exists to replace, and it looks completely healthy while doing it. The
 * store is inlined at BUILD time (esbuild JSON import), so a parse failure here means the
 * build is broken and must not ship. Same reasoning as kids-exclusion — never trade
 * fail-safe for fail-green.
 *
 * ★ ORDER IS THE ARRAY, and the schema enforces no `rank` field precisely so it cannot be
 * added casually: a position stored twice is a position that can disagree with itself.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { z } from 'zod';

/** One pinned product: the pillar id, plus the editorial reason it holds its position. */
const StarterPackEntrySchema = z.object({
  /**
   * Canon product id — MUST resolve against eden/products/products.json. The display name
   * and price are deliberately NOT stored here (Charter R3: the sealed pillar is their one
   * home); the rec card reads both through the generated vault at render time. The
   * `starter_pack_resolves` invariant resolves every id and REDs on an unknown one, so a
   * typo cannot silently drop a pin from the pack.
   */
  product_id: z.string().min(1),
  /**
   * WHY this product holds this position. Editorial rationale for a future maintainer —
   * NOT user-facing copy, and deliberately not rendered anywhere. Any text shown to a user
   * about a product goes through the reviewed copy surfaces, not through this file.
   */
  note: z.string().min(1),
});

/** Root shape of starter-pack.json (the `_`-prefixed header keys are ignored). */
export const StarterPackSchema = z.object({
  /**
   * The pinned products, IN THE ORDER THEY ARE OFFERED. Non-empty by construction: an
   * empty pack is indistinguishable from "the pack is broken" and would fail open into
   * the pure scored ranking.
   */
  pinned: z.array(StarterPackEntrySchema).min(1),
});
export type StarterPack = z.infer<typeof StarterPackSchema>;
