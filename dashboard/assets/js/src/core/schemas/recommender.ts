/**
 * core/schemas/recommender.ts — Zod schema for the cost-per-nutrient recommender inputs
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Narrows `dashboard/assets/data/product-recommender-data.json` — the per-essential
 * ranking INPUTS the "best source of nutrient X" ranker scores at runtime
 * (state/recommender.ts). The artifact is GENERATED (eden/tools/recommender_derive.py)
 * from product composition + retail price; freshness-gated (derived_artifacts_fresh).
 *
 * §00.A: `amount` is what a product CONTAINS (composition) and `price` is a volatile
 * retail listing — recommender/display data, never a Wallach target. No Wallach number
 * lives here; the saturating-adequacy curve reads a target supplied at runtime, which is
 * an honest gap until corpus dose-mining lands.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { z } from 'zod';

/** One product's ranking inputs for a single essential. */
export const RecommenderCandidateSchema = z.object({
  product_id: z.string(),
  /** Amount of the essential this product delivers, in the essential's canonical unit. */
  amount: z.number(),
  /** Distinct essentials this product delivers — the well-roundedness / anti-mono signal. */
  breadth: z.number().int().nonnegative(),
  /** Indicative retail price (USD) — the value tuner; null when the product is unpriced. */
  price: z.number().nullable(),
});

/** The candidate set that delivers one essential (sorted amount-desc in the artifact). */
export const RecommenderEssentialSchema = z.object({
  unit: z.string(),
  candidates: z.array(RecommenderCandidateSchema),
});

/** The full `product-recommender-data.json` shape — `{ essentials: { slug: {...} } }`. */
export const RecommenderDataSchema = z.object({
  essentials: z.record(z.string(), RecommenderEssentialSchema),
}).passthrough();

export type RecommenderCandidate = z.infer<typeof RecommenderCandidateSchema>;
export type RecommenderEssential = z.infer<typeof RecommenderEssentialSchema>;
export type RecommenderData = z.infer<typeof RecommenderDataSchema>;
