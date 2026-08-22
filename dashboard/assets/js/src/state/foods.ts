/**
 * state/foods.ts — the FOOD half of the recommendation engine
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Surfaces dashboard/assets/data/foods-composition-data.json and ranks foods the same way
 * state/recommender.ts ranks products — against the essentials the user is still missing.
 *
 * ★ WHY THIS IS A SEPARATE MODULE AND NOT A BRANCH INSIDE recommender.ts.
 * `CoverageRec` carries a non-nullable `price`, and its value term
 * (`perDollar = supplies / price`) scores an unpriced row at ZERO — so a food merged into
 * that list would silently forfeit the full 10% value weight and sink beneath every product.
 * Fixing that in place would mean making `price` nullable across nine fields, three view
 * renderers and the vault join. A food has no price, is not in the product vault, and is not
 * capped by the starter pack — it is a different KIND of thing, so it gets its own ranker
 * and the views render two streams with a labelled rule between them.
 *
 * ★ THE SCORE IS RENORMALISED, NOT PATCHED. Products score
 * 0.6·adequacy + 0.3·breadth + 0.1·value. Foods drop the value term entirely and renormalise
 * the remaining two to sum to 1 (0.667·adequacy + 0.333·breadth), so a food competes on what
 * it actually delivers instead of being penalised for not being for sale. Owner ruling,
 * 2026-08-21. Inventing a neutral price would be a number nobody sourced.
 *
 * ★ WHOSE NUMBERS. Every amount here is USDA COMPOSITION measured against a WALLACH target.
 * See core/schemas/foods-composition.ts. This module authors no number of its own.
 *
 * ★ WHAT A FOOD CANNOT DO. The generator emits rows only for essentials with a numeric
 * Wallach target, so a food can never contribute to a tile that covers on the mere PRESENCE
 * of a source (silver, the twelve amino acids) or to a trace_pdm mineral. That is enforced
 * in the DATA, which is why there is no guard for it here — there is nothing to guard.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import efaCoverageData from '../../../data/efa-coverage-data.json';
import foodsCompositionData from '../../../data/foods-composition-data.json';
import foodsCatalogCuration from '../../../data/foods-catalog-curation.json';
import { EfaCoverageSchema, type Food, FoodsCompositionSchema } from '../core/schemas/index.js';

/**
 * Parsed ONCE at module load, and deliberately NOT wrapped in a safe fallback — same
 * reasoning as state/starter-pack.ts. The store is inlined at BUILD time (esbuild JSON
 * import), so a parse failure means the build is broken and must not ship. An empty catalog
 * is not a degraded feature; it is the foods surface silently vanishing while the page looks
 * perfectly healthy.
 */
const DATA = FoodsCompositionSchema.parse(foodsCompositionData);

/** id → food. Built once; the catalog is immutable at runtime. */
const BY_ID = new Map<string, Food>(DATA.foods.map(f => [f.id, f]));

/**
 * The curated pins, IN OFFER ORDER — eggs first, by owner ruling (2026-08-21).
 *
 * Read out of the curation rather than written down here, for the same reason the starter
 * pack is: a second hand-typed copy of an ordering is a second thing to forget to update.
 * An id that does not resolve is dropped rather than thrown on, because the food catalog is
 * curated far more often than the product pillar and a typo must not blank the tab —
 * `food_catalog_pins_resolve` REDs on exactly that case at build time instead.
 */
const PINNED: readonly string[] = (
  (foodsCatalogCuration as { pinned?: { ids?: unknown } }).pinned?.ids as string[] | undefined
  ?? []
).filter(id => BY_ID.has(id));

/** The weights, renormalised from the product formula with the value term removed. */
const W_ADEQ = 0.6 / 0.9;
const W_BREADTH = 0.3 / 0.9;
/** Breadth half-saturation, matching state/recommender.ts's BREADTH_HALF so the two
 *  streams' breadth terms mean the same thing. */
const BREADTH_HALF = 5;

/**
 * One essential a serving delivers, as the TILE needs it: a short label, the canon category
 * that picks its colour, the rounded percentage, and enough provenance for the card to gloss
 * the number honestly.
 */
export interface FoodHit {
  slug: string;
  /** Short display name from the artifact — "Vitamin B12", not the canon's full form. */
  label: string;
  /** The canon's own category, unmapped. The card turns it into a colour. */
  category: string;
  /** Percentage of Wallach's daily target one serving delivers, rounded for display. */
  pct: number;
  /** EXACT (joined by id) or APPROXIMATE (a curated name pair). */
  tier: 'EXACT' | 'APPROXIMATE';
  /** The words for the source this number came from, read from the artifact. */
  source: string;
  /** True when this is the LOWEST of several varieties the source measured — a floor. */
  conservative: boolean;
}

/** One food card on the Regimen console or the Coverage rail. */
export interface FoodRec {
  /** The catalog slug. What the regimen stores. */
  foodId: string;
  name: string;
  category: string;
  /** USDA's own words for the serving — what a product card shows a price in. */
  portionLabel: string;
  grams: number;
  /** How many of the WANTED essentials one serving of this food reaches. */
  supplies: number;
  /**
   * How many numbers this serving actually delivers — i.e. `hits.length`, which the tile
   * prints as "N of 90".
   *
   * ★ NOT the artifact's `breadth`, which counts nutrient ROWS only. The EFA group is not a
   * row (omega-3 and omega-6 carry no individual target) but it IS something the serving
   * delivers and the card shows it, so a count that ignored it would disagree with the chips
   * beside it. The signed-off demo counts the EFA group as ONE line — Natto reads "10 of 90"
   * with ten hits, one of them Omega EFAs — even though the group covers two of the ninety.
   * That is the approved reading and it is followed here.
   */
  breadth: number;
  /** Which ACTIVE goals this food touches — the card's coloured dots. */
  goalIds: string[];
  /** True iff this card holds its position by curation (the eggs pin), not by score. */
  pinned: boolean;
  /** The sort key that produced this position. Pinned cards sit above the scored band. */
  score: number;
  /**
   * EVERY essential this serving delivers, strongest first. `hits[0]` is the card's lead
   * number and the rest are its chips; the tile decides how many fit. Each carries its own
   * provenance because the card glosses each NUMBER, and a gloss naming the wrong source is
   * worse than no gloss — with two sources for sulfur, that is now a live possibility.
   */
  hits: FoodHit[];
}

/** The whole catalog, for the education-mode ordering and for exhaustion checks. */
export function foodCatalogSize(): number {
  return DATA.foods.length;
}

export function foodById(id: string): Food | undefined {
  return BY_ID.get(id);
}




/**
 * The nutrient rows to credit for a food in the regimen, shaped like a product label's.
 *
 * This is the auto-heal path: a saved food stores only its id, and its numbers are re-read
 * from the live catalog on every paint — so a corrected portion or a re-derived source
 * reaches an existing regimen with no migration. Returns [] for an unknown id, which drops
 * the item's contribution to zero rather than inventing one.
 */
export function foodNutrientRows(id: string): { name: string; amount: number; unit: string }[] {
  const food = BY_ID.get(id);
  if (food === undefined) {
    return [];
  }
  return food.nutrients.map(n => ({ name: n.slug, amount: n.amount, unit: n.unit }));
}

/**
 * The words the gloss uses for a row's source.
 *
 * Looked up by SOURCE ID, not by essential: one essential can resolve to either of two
 * publications depending on the food — sulfur reads from AFCD where AFCD measured it and
 * from Doleman where it did not — so only the row itself knows what to credit. Every name
 * lives in the artifact, so no view ever hand-types one.
 *
 * An unknown id falls back to the id itself rather than to a wrong source's name: showing a
 * slug is a visible defect, and crediting the wrong publication is an invisible one.
 */
function sourceWordsFor(sourceId: string): string {
  return DATA._meta.source_display[sourceId] ?? sourceId;
}

/** slug → short label + canon category, from the artifact. Never typed in a view. */
const DISPLAY = DATA._meta.essential_display;

/**
 * Wallach's EFA dose, in the mg of flaxseed oil the meter counts.
 *
 * Read from the SAME artifact state/coverage.ts scores the meter against, so a food and a
 * product are measured against one number and not two copies of it. The pseudo-slug below
 * is what the tile shows the group as; it is never a canon slug, because the group is not
 * one of the 90 — omega-3 and omega-6 are, and they share this meter.
 */
const EFA_GOAL_MG = EfaCoverageSchema.parse(efaCoverageData).goal.maintenance_mg;
const EFA_SLUG = 'essential-fatty-acids';

/**
 * The flaxseed oil a serving of this food is worth, or 0.
 *
 * ★ EXPORTED FOR state/coverage.ts, which sums it into the shared EFA meter beside the
 * products. Foods enter in OIL because that is the currency Wallach's nine grams is stated
 * in; converting there instead would put the conversion in two places.
 */
export function foodEfaOilMg(id: string): number {
  return BY_ID.get(id)?.efa?.oil_equivalent_mg ?? 0;
}

/**
 * The food's whole readout, strongest first.
 *
 * Sorted by fraction and then by SLUG, so two essentials that deliver the same percentage
 * always land in the same order — an unstable sort would reshuffle chips between paints and
 * make the card look alive when nothing changed.
 */
function hitsOf(food: Food): FoodHit[] {
  // ★ THE EFA GROUP RIDES ALONGSIDE THE NUTRIENT ROWS, not among them. It has no numeric
  // per-essential target to be a row against (see the schema), but it IS something a serving
  // delivers, and a tile that hid it would under-report walnuts by 220 points. It is held to
  // the same qualify_fraction as every other number on the card.
  const floor = Math.round(DATA._meta.qualify_fraction * 100);
  const rows: FoodHit[] = food.nutrients.map(n => ({
    slug: n.slug,
    label: DISPLAY[n.slug]?.label ?? n.slug,
    category: DISPLAY[n.slug]?.category ?? '',
    pct: Math.round(n.fraction * 100),
    tier: n.provenance.tier,
    source: sourceWordsFor(n.provenance.source_id),
    conservative: n.provenance.conservative === true,
  }));
  if (food.efa !== undefined && EFA_GOAL_MG > 0) {
    const pct = Math.round((food.efa.oil_equivalent_mg / EFA_GOAL_MG) * 100);
    if (pct >= floor) {
      rows.push({
        slug: EFA_SLUG,
        label: DATA._meta.efa_reference.label,
        category: DATA._meta.efa_reference.category,
        pct,
        tier: 'EXACT',
        source: sourceWordsFor('usda-sr-legacy'),
        conservative: false,
      });
    }
  }
  return rows.sort((a, b) => (b.pct - a.pct) || a.slug.localeCompare(b.slug));
}

/**
 * Rank foods against what the user is still missing.
 *
 * Mirrors rankProductsForCoverage's contract deliberately, so the two streams behave the
 * same way from a caller's point of view:
 *   - `want`     the essentials still outstanding
 *   - `owned`    food ids already in the regimen — they leave the list, which is what makes
 *                the list ADVANCE rather than repeat
 *   - `goals`    active goals, for the coloured dots and the goal-first ordering
 *   - `greedy`   consume each emitted food's essentials, so three cards cover three
 *                different gaps instead of three cards all covering the same one
 *   - `education` once nothing is outstanding, keep going by nutrient density instead of
 *                returning []. Owner ruling (2026-08-21): the foods list never exhausts on
 *                Regimen, because seeing the catalog IS the point.
 *   - `browse`   don't STOP at the end of the gap-fill list — rank whatever is left by
 *                nutrient density and keep emitting until `limit` or the catalog runs out.
 *
 * ★ WHY `browse` IS NOT THE SAME AS `education`. Education mode changes the ranking from
 * the FIRST card: nothing is outstanding, so adequacy is meaningless and every card is ranked
 * by density. `browse` leaves the recommendation itself untouched — the gap-fill cards come
 * out in exactly the order they always did — and only extends the TAIL past the point where
 * the greedy walk runs dry. Which it does early: each emitted card consumes its essentials
 * from the outstanding set, so about seven cards close everything a food can reach and the
 * eighth has nothing left to supply. That is correct for a RECOMMENDATION and wrong for a
 * pager, which is why the flag exists (owner ruling, 2026-08-22: browsing must reach the
 * whole catalog on both tabs).
 */
export function rankFoodsForCoverage(input: {
  want: readonly string[];
  owned?: readonly string[];
  goals?: readonly { id: string; members: readonly string[] }[];
  limit?: number;
  greedy?: boolean;
  education?: boolean;
  browse?: boolean;
}): FoodRec[] {
  const owned = new Set(input.owned ?? []);
  const goals = input.goals ?? [];
  const limit = input.limit ?? 3;
  const greedy = input.greedy ?? true;
  const education = input.education ?? false;
  const browse = input.browse ?? false;
  const outstanding = new Set(input.want);

  const available = DATA.foods.filter(f => !owned.has(f.id));
  if (available.length === 0) {
    return [];
  }

  const suppliesOf = (f: Food): number => {
    let n = 0;
    for (const row of f.nutrients) {
      if (outstanding.has(row.slug)) {
        n += 1;
      }
    }
    return n;
  };
  const goalIdsFor = (f: Food): string[] =>
    goals.filter(g => g.members.some(m => f.nutrients.some(n => n.slug === m))).map(g => g.id);

  const out: FoodRec[] = [];
  const emitted = new Set<string>();

  const emit = (food: Food, score: number, isPinned: boolean): void => {
    const hits = hitsOf(food);
    out.push({
      foodId: food.id,
      name: food.name,
      category: food.category,
      portionLabel: food.portion_label,
      grams: food.grams,
      supplies: suppliesOf(food),
      breadth: hits.length,
      goalIds: goalIdsFor(food),
      pinned: isPinned,
      score,
      hits,
    });
    emitted.add(food.id);
    if (greedy) {
      for (const row of food.nutrients) {
        outstanding.delete(row.slug);
      }
    }
  };

  // ── the curated pins first, in curation order ──────────────────────────────
  // A pin holds ORDER and nothing else: it still leaves the list once owned, and its
  // `supplies` is still measured against the live outstanding set like any other card.
  // The synthetic score sits above the scored band (which is strictly < 1, since the two
  // weights sum to exactly 1 and breadthScore is asymptotic to 1) so `score` means ONE
  // thing on every row — the key this position came from.
  let pinRank = 0;
  for (const id of PINNED) {
    if (out.length >= limit) {
      break;
    }
    const food = BY_ID.get(id);
    if (food === undefined || owned.has(id)) {
      continue;
    }
    // ★ A PIN HOLDS ORDER, NOT IMMUNITY FROM RELEVANCE — the same standing a pinned
    // product has, which still leaves the list once owned. In gap-fill mode a pin that
    // closes nothing outstanding is not a recommendation, it is noise wearing first
    // position, so it is skipped exactly as a scored food with supplies 0 would be.
    // Education mode is different by design: there nothing is outstanding for ANY food,
    // and the pin leading the teaching list is the intended behaviour.
    if (!education && suppliesOf(food) === 0) {
      continue;
    }
    emit(food, 100 - pinRank, true);
    pinRank += 1;
  }

  // ── then the scored tail ───────────────────────────────────────────────────
  while (out.length < limit) {
    let bestFood: Food | null = null;
    let bestScore = -1;

    // The yardsticks are recomputed each round against the CURRENT outstanding set, the
    // same way the product scorer does it — otherwise a food that covered everything in
    // round one keeps defining "best" for rounds it can no longer help with.
    let bestSupply = 0;
    for (const f of available) {
      if (emitted.has(f.id)) {
        continue;
      }
      const s = suppliesOf(f);
      if (s > bestSupply) {
        bestSupply = s;
      }
    }

    for (const f of available) {
      if (emitted.has(f.id)) {
        continue;
      }
      const supplies = suppliesOf(f);
      if (!education && supplies === 0) {
        // In gap-fill mode a food that closes nothing outstanding is not a recommendation.
        continue;
      }
      const adequacy = bestSupply > 0 ? supplies / bestSupply : 0;
      const breadth = f.breadth / (f.breadth + BREADTH_HALF);
      // EDUCATION MODE: nothing is outstanding, so adequacy is meaningless and every food
      // would tie at zero. Rank by nutrient DENSITY instead — the sum of how much of
      // Wallach's targets one serving delivers — which is "most nutritious first".
      const score = education
        ? f.strength
        : W_ADEQ * adequacy + W_BREADTH * breadth;
      if (score > bestScore) {
        bestScore = score;
        bestFood = f;
      }
    }

    if (bestFood === null) {
      break;
    }
    emit(bestFood, bestScore, false);
  }

  // ── the browse tail ───────────────────────────────────────────────────────
  // Everything the greedy walk could not justify recommending, most nutritious first — the
  // same density key education mode ranks by, so a food sits in the same relative place
  // whichever mode surfaced it.
  //
  // ★ A SORT, NOT ANOTHER ARGMAX LOOP. `strength` is a static property of the food, so the
  // remainder can be ordered in one pass instead of re-scanning the catalog once per emitted
  // card. That is what keeps a whole-catalog request cheap enough to run on every paint
  // (~1.5 ms for all 192, measured) rather than something the views have to cache.
  if (browse && out.length < limit) {
    const rest = available
      .filter(f => !emitted.has(f.id))
      // The id tiebreak is what makes the order STABLE: two foods of equal strength must not
      // swap places between paints, or the page under the reader's cursor would shuffle.
      .sort((a, b) => (b.strength - a.strength) || a.id.localeCompare(b.id));
    for (const food of rest) {
      if (out.length >= limit) {
        break;
      }
      emit(food, food.strength, false);
    }
  }

  return out;
}
