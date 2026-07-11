/**
 * state/recommender.ts — the cost-per-nutrient "best source of X" ranker (A3)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Ranks the Youngevity products that deliver a given essential, best first, for the
 * Knowledge Essentials deep-dive "BEST SOURCES" list. Pure over the GENERATED
 * `product-recommender-data.json` (composition amount + breadth + wholesale price per
 * candidate) + Zod-validated at the boundary — no DOM, no localStorage, no state.
 *
 * The match score (design locked with Luneth 2026-07-08, memory
 * cost-per-nutrient-match-score):
 *
 *   score = W_ADEQ·adequacy + W_BREADTH·breadth + W_VALUE·value
 *
 * The KEYSTONE is SATURATING ADEQUACY — min(1, delivered/target) — so "best source"
 * means *enough* of the nutrient, not *most* of it (full credit at the target, ~zero
 * reward beyond → no over-dose bias). That needs a Wallach dose target, which is an
 * honest gap for every essential until corpus dose-mining (blueprint task b). Until a
 * target is supplied, the keystone falls back to amount-POTENCY (delivered / best-in-set):
 * an honest "more is provisionally better" proxy that ranks by composition alone. §00.A:
 * potency is a composition ratio, NEVER a coverage verdict — it does not claim "enough".
 *
 * The weights are a TRANSPARENT tuner — meant to be eyeballed against real output and
 * hand-adjusted (the same "your eyes are the test" gate as visuals). They live here in
 * code, never baked into the data artifact, so tuning is a one-line edit.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import recommenderData from '../../../data/product-recommender-data.json';
import { RecommenderDataSchema } from '../core/schemas/index.js';

// ─── Weights + curves (the tuner) ──────────────────────────────────────────
const W_ADEQ = 0.6; // keystone: adequacy (or the potency proxy until targets exist)
const W_BREADTH = 0.3; // reward well-rounded formulas, anti-mono-product
const W_VALUE = 0.1; // banded cost tuner: only re-orders near-ties, never upsells

// Breadth saturates as n/(n+K): K=5 → 1 essential ≈0.17, 5 ≈0.5, 35 ≈0.875, so a jump
// from 30→35 essentials barely moves the score (the diminishing-returns curve the design
// calls for — a 35-nutrient multi isn't "7× better" than a 5-nutrient one).
const BREADTH_HALF = 5;

const DATA = RecommenderDataSchema.parse(recommenderData);

export interface RankedSource {
  productId: string;
  /** Amount delivered, in the essential's canonical unit. */
  amount: number;
  unit: string;
  /** Distinct essentials the product delivers. */
  breadth: number;
  /** Indicative wholesale price (USD), or null if unpriced. */
  price: number | null;
  /**
   * 0..1 keystone term. Saturating adequacy — min(1, delivered/target) — when a Wallach
   * target is supplied; otherwise the amount-potency proxy (delivered / best-in-set).
   */
  adequacy: number;
  /** True iff `adequacy` is real saturating adequacy (a Wallach target was supplied). */
  adequacyIsTarget: boolean;
  breadthScore: number;
  valueScore: number;
  score: number;
}

function breadthScore(n: number): number {
  return n / (n + BREADTH_HALF);
}

/**
 * Rank the products that deliver `slug` (a canon essential slug), best first.
 *
 * @param slug      Canon essential slug (the recommender artifact's key).
 * @param targetLow The Wallach maintenance amount for the essential in its canonical unit,
 *                  when one has been mined. Given it, the keystone is saturating adequacy;
 *                  pass null (today's honest gap) to fall back to the amount-potency proxy.
 */
export function rankSources(slug: string, targetLow: number | null = null): RankedSource[] {
  const entry = DATA.essentials[slug];
  if (entry === undefined || entry.candidates.length === 0) {
    return [];
  }
  const { unit, candidates } = entry;
  const maxAmount = candidates.reduce((m, c) => (c.amount > m ? c.amount : m), 0);
  const useTarget = targetLow !== null && targetLow > 0;

  // Value = cost per unit delivered (price/amount), lower is better, min-max inverted to
  // 0..1 across the priced candidates. A low-weight BAND tuner — it nudges near-ties, it
  // never upsells to a mega-product nor chases an obscure-cheap one.
  const cpuOf = (price: number | null, amount: number): number | null =>
    (price !== null && amount > 0 ? price / amount : null);
  const cpus = candidates
    .map(c => cpuOf(c.price, c.amount))
    .filter((v): v is number => v !== null);
  const minCpu = cpus.length > 0 ? Math.min(...cpus) : 0;
  const maxCpu = cpus.length > 0 ? Math.max(...cpus) : 0;

  const ranked: RankedSource[] = candidates.map((c) => {
    const adequacy = (targetLow !== null && targetLow > 0)
      ? Math.min(1, c.amount / targetLow)
      : (maxAmount > 0 ? c.amount / maxAmount : 0);
    const bScore = breadthScore(c.breadth);
    const cpu = cpuOf(c.price, c.amount);
    // Neutral 0.5 when a product has no comparable cost-per-unit (unpriced or no range),
    // so the value term neither rewards nor penalizes it.
    const vScore = (cpu === null || maxCpu === minCpu) ? 0.5 : (maxCpu - cpu) / (maxCpu - minCpu);
    const score = W_ADEQ * adequacy + W_BREADTH * bScore + W_VALUE * vScore;
    return {
      productId: c.product_id,
      amount: c.amount,
      unit,
      breadth: c.breadth,
      price: c.price,
      adequacy,
      adequacyIsTarget: useTarget,
      breadthScore: bScore,
      valueScore: vScore,
      score,
    };
  });

  // Best first; deterministic tiebreak by amount then id so equal scores never shuffle.
  ranked.sort((a, b) =>
    b.score - a.score || b.amount - a.amount || a.productId.localeCompare(b.productId));
  return ranked;
}

/** True when the essential has at least one rankable (quantified) source in the vault. */
export function hasSources(slug: string): boolean {
  const entry = DATA.essentials[slug];
  return entry !== undefined && entry.candidates.length > 0;
}

// ─── Product → delivered-essentials index (for the Products-tab search) ──────

let productEssentialsCache: Map<string, string[]> | null = null;

/**
 * product_id → the canon essential slugs it delivers, inverted from the recommender
 * data (the quantified candidates). Powers the Products-tab search index so a
 * nutrient / trace-mineral query surfaces every product that carries it — including
 * the ones delivered THROUGH a blend (e.g. boron, vanadium) that never appear in the
 * printed label text. Canonical + auto-widening: as composition mining adds candidates,
 * the search index grows with zero view changes. Memoized (the data is immutable).
 */
export function essentialSlugsByProduct(): Map<string, string[]> {
  if (productEssentialsCache !== null) {
    return productEssentialsCache;
  }
  const m = new Map<string, string[]>();
  for (const [slug, entry] of Object.entries(DATA.essentials)) {
    for (const c of entry.candidates) {
      const arr = m.get(c.product_id);
      if (arr === undefined) {
        m.set(c.product_id, [slug]);
      }
      else {
        arr.push(slug);
      }
    }
  }
  productEssentialsCache = m;
  return m;
}
