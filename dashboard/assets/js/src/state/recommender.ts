/**
 * state/recommender.ts — the cost-per-nutrient "best source of X" ranker
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Ranks the Youngevity products that deliver a given essential, best first, for the
 * Knowledge Essentials deep-dive "BEST SOURCES" list. Pure over the GENERATED
 * `product-recommender-data.json` (composition amount + breadth + wholesale price per
 * candidate) + Zod-validated at the boundary — no DOM, no localStorage, no state.
 *
 * The match score:
 *
 *   score = W_ADEQ·adequacy + W_BREADTH·breadth + W_VALUE·value
 *
 * The KEYSTONE is SATURATING ADEQUACY — min(1, delivered/target) — so "best source"
 * means *enough* of the nutrient, not *most* of it (full credit at the target, ~zero
 * reward beyond → no over-dose bias). That needs a Wallach dose target, and only some
 * essentials carry one — views/knowledge-products.ts passes it through where it exists, so
 * the gap is real but PARTIAL. Where no target exists, the keystone falls back to
 * amount-POTENCY (delivered / best-in-set):
 * an honest "more is provisionally better" proxy that ranks by composition alone. §00.A:
 * potency is a composition ratio, NEVER a coverage verdict — it does not claim "enough".
 *
 * The weights are a TRANSPARENT tuner — meant to be eyeballed against real output and
 * hand-adjusted (the same "your eyes are the test" gate as visuals). They live here in
 * code, never baked into the data artifact, so tuning is a one-line edit.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import recommenderData from '../../../data/product-recommender-data.json';
import regimenLabelLookup from '../../../data/regimen-label-lookup.json';
import { ProductEntrySchema, ProductsLookupSchema, RecommenderDataSchema } from '../core/schemas/index.js';
import { toMg } from '../core/units.js';
import { isExcludedFromRecommendations } from './kids-exclusion.js';
import { isSupersededProduct } from './superseded-products.js';

// ─── Weights + curves (the tuner) ──────────────────────────────────────────
const W_ADEQ = 0.6; // keystone: adequacy (or the potency proxy until targets exist)
const W_BREADTH = 0.3; // reward well-rounded formulas, anti-mono-product
const W_VALUE = 0.1; // banded cost tuner: only re-orders near-ties, never upsells

// Breadth saturates as n/(n+K): K=5 → 1 essential ≈0.17, 5 ≈0.5, 35 ≈0.875, so a jump
// from 30→35 essentials barely moves the score (the diminishing-returns curve the design
// calls for — a 35-nutrient multi isn't "7× better" than a 5-nutrient one).
const BREADTH_HALF = 5;

/**
 * The floor of the PINNED score band. Every scored card is strictly < 1 (the three weights
 * sum to 1 and `breadthScore` never reaches it), so any base >= 1 keeps the whole starter
 * pack above the whole scored tail. 2 leaves the band obvious at a glance in a debugger.
 */
const PIN_SCORE_BASE = 2;

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
 * @param slug       Canon essential slug (the recommender artifact's key).
 * @param targetLow  The Wallach maintenance amount, when one has been mined. Given it (WITH
 *                   its unit), the keystone is saturating adequacy; pass null (an honest gap
 *                   for the essentials with no Wallach number) for the amount-potency proxy.
 * @param targetUnit `targetLow`'s unit — REQUIRED to get target-based adequacy.
 *
 *   ★ WHY targetUnit IS NOT OPTIONAL-BY-CONVENIENCE. The target's unit comes
 *   from Wallach; the candidates' unit comes from Youngevity labels. THEY DISAGREE: measured
 *   across the essentials carrying both, 2 mismatch — boron (target mg, candidates mcg)
 *   and silver (target mcg, candidates mg). This function used to divide the two raw numbers,
 *   so boron's adequacy saturated at 1.0 for EVERY candidate (truth ≈0.16–0.54) and silver's
 *   read ~0.0001 (truth ≈0.10). Adequacy is the 0.6 keystone, so the ranking silently
 *   collapsed to breadth+price on exactly those two.
 *   FAIL-SAFE, NOT FAIL-QUIET: a target passed WITHOUT its unit cannot be reconciled, so it
 *   falls back to the proxy and reports `adequacyIsTarget: false` rather than guessing that
 *   the units happen to match. Same for an IU/mg family clash. Wrong-but-plausible is the
 *   failure mode this whole codebase exists to refuse.
 */
export function rankSources(
  slug: string,
  targetLow: number | null = null,
  targetUnit: string | null = null,
): RankedSource[] {
  const entry = DATA.essentials[slug];
  if (entry === undefined || entry.candidates.length === 0) {
    return [];
  }
  const { unit } = entry;
  // ★ THE KIDS FILTER for this ranker. The Knowledge Essentials deep-dive's BEST SOURCES
  // funnels through rankSources, so filtering here covers it. The Coverage/Regimen rail and
  // the condition pages use rankProductsForCoverage instead and are filtered separately in
  // coverageIndex() below — every rec path IS filtered, but there is MORE THAN ONE path, so
  // neither filter may be deleted as redundant. The Products TAB reads
  // essentialSlugsByProduct() and is deliberately left whole, because kids products must
  // stay discoverable in the database. See state/kids-exclusion.ts for why this is a
  // read-time filter and not a derive-time one (both consumers share this artifact).
  // FILTERED FIRST, ON PURPOSE: maxAmount (the potency-proxy denominator) and the
  // min/max cost-per-unit band below are computed over the candidate SET, so an
  // excluded product must be gone before they are derived — otherwise a kids product
  // it no longer ranks would still silently skew every surviving product's score.
  const candidates = entry.candidates.filter(
    c => !isExcludedFromRecommendations(c.product_id) && !isSupersededProduct(c.product_id),
  );
  if (candidates.length === 0) {
    return [];
  }
  const maxAmount = candidates.reduce((m, c) => (c.amount > m ? c.amount : m), 0);
  // A target is only usable if it is positive AND its unit reconciles with the candidates'
  // into the same family. Probe with amount 1: toMg reports the FAMILY ('mg' | 'iu'), and a
  // cross-family compare (an IU target vs an mg candidate) is meaningless, not merely scaled.
  const tgtProbe = (targetLow !== null && targetLow > 0 && targetUnit !== null)
    ? toMg(1, targetUnit, slug)
    : null;
  const candProbe = toMg(1, unit, slug);
  const useTarget = tgtProbe !== null && tgtProbe.u === candProbe.u;

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
    // Reconcile BOTH sides into the common family before dividing — never raw/raw.
    // state/coverage.ts has always done this (`toMg(lowRaw, target.unit)`); this ranker
    // did not, 20 lines away, which is what produced the boron/silver corruption.
    const adequacy = useTarget
      ? Math.min(1, toMg(c.amount, unit, slug).v / toMg(targetLow as number, targetUnit as string, slug).v)
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

/**
 * True when the essential has at least one RECOMMENDABLE (quantified) source in the vault.
 *
 * Kid-excluded candidates do not count — this predicate must agree with rankSources or
 * it lies: an essential whose only source is a kids product would otherwise report
 * `true` here while rankSources returns [], and a caller would render an empty
 * "BEST SOURCES" block it was told existed.
 */
export function hasSources(slug: string): boolean {
  const entry = DATA.essentials[slug];
  return entry !== undefined
    && entry.candidates.some(
      c => !isExcludedFromRecommendations(c.product_id) && !isSupersededProduct(c.product_id),
    );
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
 *
 * ★ DELIBERATELY NOT KID-FILTERED — do not "fix" this to match rankSources.
 * This is the PRODUCTS DATABASE path, and kids products must stay discoverable there.
 * They are better as a database item to be discovered in the products tab of the
 * knowledge drawer — excluded from being RECOMMENDED, never
 * hidden from the catalogue. rankSources filters; this does not. That asymmetry IS
 * the requirement, and `kids_products_not_recommended` asserts BOTH halves — adding a
 * filter here would turn the gate RED, on purpose.
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

// ─── The Coverage rail's recommender ─────────────────────────────────
//
// rankSources answers "what is the best source of ONE essential?" (the Knowledge deep-dive's
// BEST SOURCES). The Coverage rail asks a DIFFERENT question — "given everything I'm missing,
// what ONE product should I add next?" — so it needs a cross-essential ranker. That did not
// exist; this is it. Same score SHAPE (W_ADEQ/W_BREADTH/W_VALUE, saturating breadth) so the
// two rankers speak one language.
//
// ★ WHAT "ADEQUACY" MEANS HERE, and why it is NOT rankSources' adequacy. rankSources compares
// a delivered AMOUNT to a Wallach target (min(1, delivered/target)) — a per-essential
// quantity. This ranker compares a COUNT: how many of the essentials you want does this
// product reach, relative to the best product in the set. There is no Wallach number in it and
// it never claims one — a breadth-of-hit ratio, not a coverage verdict (§00.A: composition and
// price are display/recommender inputs, never a target).
//
// ★ FILTERED FOR KIDS ON PURPOSE, AND FIRST. Every rec surface applies the kids exclusion.
// The index below is built from already-filtered candidates so
// an excluded product cannot define the yardstick (bestSupply/bestValue) the survivors are
// scored against — the same ordering rankSources uses, for the same reason. The Products TAB
// path (essentialSlugsByProduct) stays deliberately UNfiltered; that asymmetry IS the
// requirement, and `kids_products_not_recommended` asserts both halves.

// The vault's root is { _meta, products: { id: entry } } — the NAMES live under `products`,
// not at the root. Mirrors state/coverage.ts::vaultNutrientsByName's read of the same
// artifact, including its root-fallback for the flat shape. Parsing the root and indexing
// it directly resolves EVERY id to undefined, so every rec card renders its raw product
// slug: a bug tsc cannot see, because the values are `unknown` either way.
const VAULT = ProductsLookupSchema.parse(
  (regimenLabelLookup as { products?: unknown }).products ?? regimenLabelLookup,
);

/** One recommendation card on the Coverage rail. */
export interface CoverageRec {
  productId: string;
  /** Display name, read from the generated product vault (never hand-typed). */
  name: string;
  /** Wholesale price (USD) — the featured price everywhere in this app. */
  price: number;
  /** How many of the WANTED essentials this product reaches. The card's "supplies N". */
  supplies: number;
  /** Distinct essentials the product delivers overall (the breadth term's input). */
  breadth: number;
  /** Which of the ACTIVE goals this product touches — the card's coloured dots. */
  goalIds: string[];
  /**
   * True iff this card came from the curated STARTER PACK (state/starter-pack.ts) rather
   * than from the scorer. Pinned cards hold their position by curation, not by `score`.
   */
  pinned: boolean;
  /**
   * The sort key that produced this card's position.
   *
   * Scored cards sit strictly BELOW 1: the three weights sum to exactly 1 and
   * `breadthScore` is asymptotic to 1 without reaching it, so the weighted sum cannot.
   * Pinned cards carry a synthetic score ABOVE that band, descending with pack order.
   * That keeps `score` meaning ONE thing for every card in the list — "the key this
   * position came from" — instead of a real number on some rows and a placeholder on
   * others.
   */
  score: number;
  /** `supplies` per $10 — the card's DISPLAYED value figure, not the sort key. */
  perTenDollars: number;
}

interface ProductAgg {
  essentials: Set<string>;
  breadth: number;
  price: number;
}

/**
 * product_id → display name, from the same generated vault state/coverage.ts reads.
 *
 * The vault's values are mixed shapes (single entry / array of entries), which is why the
 * schema types them `unknown` and each value is validated on read. An unresolvable id falls
 * back to the id itself rather than throwing: a rec card with a raw slug is ugly and visible;
 * a crashed rail is not (graceful degradation). All 155 recommender product_ids resolve
 * against the current vault, so the fallback is a guard, not a path.
 */
function productName(productId: string): string {
  const raw = VAULT[productId];
  const entry = ProductEntrySchema.safeParse(Array.isArray(raw) ? raw[0] : raw);
  if (!entry.success) {
    return productId;
  }
  return entry.data.canonical_name ?? entry.data.name ?? productId;
}

/**
 * A vault product by id — the add path's source for the item's label.
 *
 * Lives here because this module already parses the vault, and a second parse elsewhere
 * would be a second home for one fact. The Coverage rail's `+` needs a NAME and the
 * nutrient rows to mint a RegimenItem, exactly as views/regimen.ts::addItem does from the
 * picker — the two add paths must produce the same shape or the field disagrees with itself.
 */
export function vaultEntry(
  productId: string,
): { name: string; nutrients: unknown[]; servingUnits: number | null; servingUnit: string | null } | null {
  const raw = VAULT[productId];
  const parsed = ProductEntrySchema.safeParse(Array.isArray(raw) ? raw[0] : raw);
  if (!parsed.success) {
    return null;
  }
  const name = parsed.data.canonical_name ?? parsed.data.name;
  if (name === undefined || name === '') {
    return null;
  }
  // The unit facts ride along so the add paths can stamp them onto the item's label — the
  // stepper reads them from there, not from the vault, because a scanned item has a label
  // and no vault entry at all.
  return {
    name,
    nutrients: parsed.data.nutrients ?? [],
    servingUnits: parsed.data.serving_units ?? null,
    servingUnit: parsed.data.serving_unit ?? null,
  };
}

/**
 * canonical_name (lowercased) → product_id.
 *
 * ★ WHY NAME IS THE JOIN, and it is not a shortcut: a live RegimenItem carries NO
 * product_id. Its identity IS `label.name` — that is what views/regimen.ts::addItem matches
 * the vault on, and what state/coverage.ts's auto-heal re-resolves composition by. The rail
 * asked "which products do I already own?" — do NOT reach for `label.product_id`: it does
 * not exist, so `owned` comes back ALWAYS empty and a product you just added stays at the
 * top of its own recommendation list. tsc cannot catch it — the label is a passthrough
 * object, so the read typechecks and silently returns undefined.
 */
let nameToIdCache: Map<string, string> | null = null;
function nameToId(): Map<string, string> {
  if (nameToIdCache !== null) {
    return nameToIdCache;
  }
  const m = new Map<string, string>();
  for (const id of Object.keys(VAULT)) {
    const e = vaultEntry(id);
    if (e !== null) {
      m.set(e.name.trim().toLowerCase(), id);
    }
  }
  nameToIdCache = m;
  return m;
}

/** product_ids for the given regimen item NAMES (unresolvable names are simply not owned). */
export function productIdsForNames(names: readonly string[]): string[] {
  const idx = nameToId();
  return names
    .map(n => idx.get(n.trim().toLowerCase()))
    .filter((x): x is string => x !== undefined);
}

let coverageIndexCache: Map<string, ProductAgg> | null = null;

/**
 * product_id → {essentials it delivers, breadth, price}, KID-FILTERED. Memoized (the data is
 * immutable). Inverted from the same artifact rankSources reads. `breadth` and `price` repeat
 * identically on every candidate row for a product — the derive emits them per-product — so
 * the first row wins and the rest agree by construction.
 */
function coverageIndex(): Map<string, ProductAgg> {
  if (coverageIndexCache !== null) {
    return coverageIndexCache;
  }
  const m = new Map<string, ProductAgg>();
  for (const [slug, entry] of Object.entries(DATA.essentials)) {
    for (const c of entry.candidates) {
      // TWO curated exclusions, one filter point. Both must run BEFORE the yardsticks are
      // derived, or an excluded product still defines the scale the survivors are scored on.
      if (isExcludedFromRecommendations(c.product_id) || isSupersededProduct(c.product_id)) {
        continue;
      }
      const agg = m.get(c.product_id);
      if (agg === undefined) {
        m.set(c.product_id, {
          essentials: new Set([slug]),
          breadth: c.breadth,
          price: c.price ?? 0,
        });
      }
      else {
        agg.essentials.add(slug);
      }
    }
  }
  coverageIndexCache = m;
  return m;
}

/**
 * Rank products for the Coverage rail — "what should I add next?", best first.
 *
 * @param input        The query.
 * @param input.want   The essential slugs to target. With goals set, the union of their
 *                     members; with none, the field's current gaps (with no goals set this
 *                     ranks by breadth across all 90 — honest and still useful).
 * @param input.owned  product_ids already in the active slot. They LEAVE the list — which is
 *                     what makes it terminate, with no stored list to fall out of sync.
 *                     "Remove an item and it reappears" then costs no code at all.
 * @param input.goals  The ACTIVE goals + their members, for the card's dots. Empty in
 *                     no-goal mode.
 * @param input.limit  Cards to return.
 * @param input.pinned The curated STARTER PACK, in offer order (state/starter-pack.ts).
 *                     Emitted FIRST, ahead of anything scored — and still subject to the
 *                     owned and kids filters, because a pin is an ORDER, not an exemption.
 * @param input.greedy Subtract each emitted product's essentials from the outstanding set
 *                     before choosing the next card. Opt-in; see below.
 *
 * ★ WHY GREEDY EXISTS, and why it is OPT-IN rather than the default.
 * One-shot scoring ranks every product against the SAME want-set, so the top cards come back
 * near-duplicates: broad multis that each reach most of what you want, and each other's
 * essentials too. Measured against the shipped data, 124 card slots across every goal were
 * filled by only 12 distinct products. Greedy consumes what a card delivers before scoring
 * the next one, so card 2 answers "what does card 1 leave behind?" — the list stops
 * repeating itself and starts spanning.
 * It is OPT-IN because the condition pages (views/entity-page.ts) ask a genuinely different
 * question — "which products are best for THIS condition?" — where a spanning set would be
 * wrong and the honest answer really is "these are all good for it". Non-greedy therefore
 * takes the ORIGINAL one-shot path below, unchanged, rather than a loop that happens to
 * agree: both relative terms are rescaled by the surviving set, so an iterative non-greedy
 * loop would silently re-order that shipped surface.
 *
 * ★ WHAT `supplies` MEANS UNDER GREEDY. It counts what is STILL OUTSTANDING when the card is
 * offered, not the original want — so it reads "this adds N you do not have yet", and the
 * number matches the order. A pack product that adds nothing new honestly shows 0 rather
 * than re-counting what the card above it already covered.
 *
 * Pure: no DOM, no localStorage, no stored output — `recommendations_not_stored` gates that a
 * recommendation list is never persisted.
 */
export function rankProductsForCoverage(input: {
  want: readonly string[];
  owned?: readonly string[];
  goals?: readonly { id: string; members: readonly string[] }[];
  limit?: number;
  pinned?: readonly string[];
  greedy?: boolean;
}): CoverageRec[] {
  const owned = new Set(input.owned ?? []);
  const goals = input.goals ?? [];
  const limit = input.limit ?? 4;
  const greedy = input.greedy ?? false;
  const pins = input.pinned ?? [];
  /** The essentials still unaccounted for. Greedy shrinks this as each card is emitted. */
  const outstanding = new Set(input.want);
  if (outstanding.size === 0) {
    return [];
  }

  const index = coverageIndex();
  const out: CoverageRec[] = [];
  const emitted = new Set<string>();

  /** How many still-outstanding essentials this product reaches. */
  const suppliesOf = (agg: ProductAgg): number => {
    let n = 0;
    for (const slug of agg.essentials) {
      if (outstanding.has(slug)) {
        n += 1;
      }
    }
    return n;
  };

  const goalIdsFor = (agg: ProductAgg): string[] =>
    goals.filter(g => g.members.some(m => agg.essentials.has(m))).map(g => g.id);

  const perDollarOf = (price: number, supplies: number): number =>
    (price > 0 ? supplies / price : 0);

  /** Push one card built against the CURRENT outstanding set, then consume what it covers. */
  const emit = (productId: string, agg: ProductAgg, score: number, isPinned: boolean): void => {
    const supplies = suppliesOf(agg);
    out.push({
      productId,
      name: productName(productId),
      price: agg.price,
      supplies,
      breadth: agg.breadth,
      goalIds: goalIdsFor(agg),
      pinned: isPinned,
      score,
      perTenDollars: perDollarOf(agg.price, supplies) * 10,
    });
    emitted.add(productId);
    if (greedy) {
      for (const slug of agg.essentials) {
        outstanding.delete(slug);
      }
    }
  };

  // ── 1. THE STARTER PACK, in curated order, ahead of anything scored ──────────────────
  //
  // A pin the user already owns is SKIPPED, not held — that is what lets the pack drain as
  // they work through it, and it is the same rule that makes the scored tail terminate.
  // A pin missing from the index is skipped silently ON PURPOSE: the index is kid-filtered,
  // so this is the one place the kids exclusion must still win over curation.
  for (let i = 0; i < pins.length && out.length < limit; i += 1) {
    const productId = pins[i];
    if (productId === undefined || owned.has(productId) || emitted.has(productId)) {
      continue;
    }
    const agg = index.get(productId);
    if (agg === undefined) {
      continue;
    }
    // Above the scored band (strictly < 1) and descending with pack order.
    emit(productId, agg, PIN_SCORE_BASE - i / (pins.length + 1), true);
  }

  /** Score one candidate against the current relative yardsticks. */
  const scoreOf = (
    supplies: number, breadth: number, price: number, bestSupply: number, bestValue: number,
  ): number => {
    const adequacy = bestSupply > 0 ? supplies / bestSupply : 0;
    const value = bestValue > 0 ? perDollarOf(price, supplies) / bestValue : 0;
    return W_ADEQ * adequacy + W_BREADTH * breadthScore(breadth) + W_VALUE * value;
  };

  /** Every not-yet-emitted product reaching at least one still-outstanding essential. */
  const candidates = (): { productId: string; agg: ProductAgg; supplies: number }[] => {
    const rows: { productId: string; agg: ProductAgg; supplies: number }[] = [];
    for (const [productId, agg] of index) {
      if (owned.has(productId) || emitted.has(productId)) {
        continue;
      }
      const supplies = suppliesOf(agg);
      if (supplies === 0) {
        continue;
      }
      rows.push({ productId, agg, supplies });
    }
    return rows;
  };

  // Both relative terms are derived AFTER filtering (kids + owned + already-emitted), on
  // purpose: an excluded, owned or already-shown product must not define the yardstick the
  // survivors are scored against.
  const yardsticks = (
    rows: { agg: ProductAgg; supplies: number }[],
  ): { bestSupply: number; bestValue: number } => ({
    bestSupply: rows.reduce((m, r) => (r.supplies > m ? r.supplies : m), 0),
    bestValue: rows.reduce((m, r) => {
      const v = perDollarOf(r.agg.price, r.supplies);
      return v > m ? v : m;
    }, 0),
  });

  // ── 2a. THE SCORED TAIL — greedy: re-score against what is left after every pick ─────
  if (greedy) {
    while (out.length < limit && outstanding.size > 0) {
      const rows = candidates();
      if (rows.length === 0) {
        break;
      }
      const { bestSupply, bestValue } = yardsticks(rows);
      // Tie-break on product_id so the order is DETERMINISTIC — it must not depend on the
      // generated artifact's key order, and a probe asserting the rec list must not flake.
      let best = rows[0]!;
      let bestScore = scoreOf(best.supplies, best.agg.breadth, best.agg.price, bestSupply, bestValue);
      for (const r of rows) {
        const s = scoreOf(r.supplies, r.agg.breadth, r.agg.price, bestSupply, bestValue);
        if (s > bestScore || (s === bestScore && r.productId.localeCompare(best.productId) < 0)) {
          best = r;
          bestScore = s;
        }
      }
      emit(best.productId, best.agg, bestScore, false);
    }
    return out;
  }

  // ── 2b. THE SCORED TAIL — one-shot: the ORIGINAL path, behaviour-preserved ───────────
  const rows = candidates();
  if (rows.length === 0) {
    return out;
  }
  const { bestSupply, bestValue } = yardsticks(rows);
  const scored: CoverageRec[] = rows.map(r => ({
    productId: r.productId,
    name: productName(r.productId),
    price: r.agg.price,
    supplies: r.supplies,
    breadth: r.agg.breadth,
    goalIds: goalIdsFor(r.agg),
    pinned: false,
    score: scoreOf(r.supplies, r.agg.breadth, r.agg.price, bestSupply, bestValue),
    perTenDollars: perDollarOf(r.agg.price, r.supplies) * 10,
  }));
  // Tie-break on product_id so the order is DETERMINISTIC — it must not depend on the
  // generated artifact's key order, and a probe asserting the rec list must not flake.
  scored.sort((a, b) => (b.score - a.score) || a.productId.localeCompare(b.productId));
  return out.concat(scored).slice(0, limit);
}
