/**
 * state/foods.ts — the FOOD half of the recommendation engine
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Surfaces dashboard/assets/data/foods-composition-data.json and feeds the FOOD SOURCES
 * blocks on Regimen and Coverage.
 *
 * ★ ONE ORDER, TOP TO BOTTOM — owner ruling 2026-08-22, which REVERSES two earlier ones.
 * The list used to lead with a curated pin (eggs, 2026-08-21) and then walk GREEDILY: each
 * emitted card consumed its essentials from the outstanding set, so three cards closed three
 * different gaps. Both were defensible for a THREE-CARD recommendation and both made the
 * sixty-four-page browse read as random — a pin is not a score, and a greedy walk re-scores
 * the whole catalog after every card, so position four owes nothing to position three. The
 * ruling: one honest sort key, applied to every food, page one to page sixty-four.
 *
 * ★ THE KEY. With goals chosen it is the share of your REMAINING GOAL TARGETS one serving
 * fills — Σ min(fraction, 1) over the goal nutrients you have not covered yet, over how many
 * there are. Capped at 1 per nutrient because a serving carrying 500% of one target has not
 * filled five of them. With no goals — or with every goal nutrient already covered — it is
 * `strength`, the food's own Σ of fractions, which is "most nutritious first". Ties fall back
 * to strength and then to the id, so the order is TOTAL and cannot reshuffle between paints.
 *
 * ★ BOTH HALVES OF THAT KEY COUNT THE EFA GROUP — 2026-08-22, and neither did before.
 * omega-3 and omega-6 carry no individual Wallach dose, so they are not nutrient rows, and a
 * key summed over rows scored a food's essential-fatty-acid delivery at exactly zero. Walnuts
 * supply 220% of his nine grams and sat on page 47 of 64 in a list ordered by nutrition —
 * with the card beside them printing that 220% the whole time. `strength` now adds the
 * group's own fraction (UNCAPPED, like every other term in it); the goal key fills each EFA
 * member in the gap set from the one delivery (CAPPED, like every other term in that one).
 * The second half mattered more: 24 of the 30 goals name an omega.
 *
 * ★ THE SCORE IS A SORT KEY AND NOTHING ELSE. It is never rendered, so its denominator has
 * only to be CONSTANT across the candidates. Reachability is no longer the free variable it
 * was: until the group entered the key, a goal naming omega-3 contributed a gap no food could
 * ever fill, which was harmless only because it diluted every candidate identically.
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
import essentialsTargetsData from '../../../data/essentials-targets-data.json';
import foodsCompositionData from '../../../data/foods-composition-data.json';
import { CoverageTargetSchema, EfaCoverageSchema, EssentialsDataSchema, type Food, FoodsCompositionSchema } from '../core/schemas/index.js';

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
  /**
   * How much one serving actually holds, in WALLACH'S OWN unit for this essential —
   * the numerator behind `pct`. The tile shows only the percentage; a nutrient sheet has
   * to print the amount too, or it is a chart rather than a label.
   */
  amount: number;
  /** Wallach's unit for this essential, copied from his target ('mg' | 'mcg'). */
  unit: string;
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
  /** The sort key that produced this position. See the header: never displayed. */
  score: number;
  /**
   * EVERY essential this serving delivers, strongest first. `hits[0]` is the card's lead
   * number and the rest are its chips; the tile decides how many fit. Each carries its own
   * provenance because the card glosses each NUMBER, and a gloss naming the wrong source is
   * worse than no gloss — with two sources for sulfur, that is now a live possibility.
   */
  hits: FoodHit[];
}

/** The whole catalog, for the whole-catalog request and for exhaustion checks. */
export function foodCatalogSize(): number {
  return DATA.foods.length;
}

export function foodById(id: string): Food | undefined {
  return BY_ID.get(id);
}

/**
 * The floor a value must clear to be in the catalog at all, as a whole percentage.
 *
 * ★ A SURFACE THAT PRINTS A FOOD'S WHOLE READOUT HAS TO SAY WHERE THAT READOUT STOPS. The
 * generator drops anything under this, so "every nutrient we hold" is not "every nutrient in
 * the food" — and a nutrient sheet that implied otherwise would be a complete label built out
 * of an incomplete one. Read from the artifact so the sentence cannot drift from the derive.
 */
export function foodQualifyPct(): number {
  return Math.round(DATA._meta.qualify_fraction * 100);
}

/**
 * The whole catalog, in catalog order — for surfaces that LIST foods rather than rank them.
 *
 * Returned readonly because it is the module's own array, not a copy: the catalog is
 * immutable at runtime and copying 192 records on every drawer paint would be waste.
 */
export function listFoods(): readonly Food[] {
  return DATA.foods;
}

/**
 * EVERY essential one serving of this food delivers, strongest first — the same readout
 * `rankFoodsForCoverage` puts on a card, for a surface that shows a food WITHOUT ranking it.
 *
 * [] for an unknown id, which renders as a food with no numbers rather than as an
 * invented one.
 */
export function foodHits(id: string): FoodHit[] {
  const food = BY_ID.get(id);
  return food === undefined ? [] : hitsOf(food);
}

/**
 * Every category the catalog actually uses, A–Z — the food filter's option list.
 *
 * DERIVED, never a written-down list (R3): the catalog is curated far more often than the
 * product pillar, and a hand-typed dropdown would keep offering a category the day its last
 * food left, or hide one the day a new one arrived.
 */
export function foodCategories(): string[] {
  return [...new Set(DATA.foods.map(f => f.category))].sort((a, b) => a.localeCompare(b));
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
 * The EFA group's shared goal — the ONE amount Wallach states for the essential fatty acids.
 *
 * ★ THE PERCENTAGE IS NO LONGER DIVIDED HERE. It is read off `food.efa.fraction`, which the
 * generator computed against the same sealed dose claim, so the card, the ranking key and
 * the gate all quote one number instead of three roundings of it. What this file still needs
 * from the goal is WHO the group answers for.
 */
const EFA_GOAL = EfaCoverageSchema.parse(efaCoverageData).goal;
/** The group's display pseudo-slug. Never a canon slug — the group is not one of the 90. */
const EFA_SLUG = 'essential-fatty-acids';
/**
 * The two essentials the one meter answers for, read from the goal rather than typed here.
 *
 * ★ CREDITING BOTH IS NOT FANNING HIS DOSE. Nothing splits nine grams into two numbers: the
 * pair share ONE delivery, and a serving that supplies it has moved both. That is already how
 * the tiles resolve — state/coverage.ts hands a single efaStatus to omega-3 and omega-6 alike.
 */
const EFA_MEMBERS: ReadonlySet<string> = new Set(EFA_GOAL.members);

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
  const rows: FoodHit[] = food.nutrients.map(n => ({
    slug: n.slug,
    label: DISPLAY[n.slug]?.label ?? n.slug,
    category: DISPLAY[n.slug]?.category ?? '',
    pct: Math.round(n.fraction * 100),
    amount: n.amount,
    unit: n.unit,
    tier: n.provenance.tier,
    source: sourceWordsFor(n.provenance.source_id),
    conservative: n.provenance.conservative === true,
  }));
  // ★ THE BAR IS READ, NOT RE-DERIVED. This used to divide the oil by the goal here and
  // compare a ROUNDED percentage against a rounded floor, which admitted seven foods the
  // generator's own full-precision test rejects — kiwifruit at 6.996% reads "7%". The card
  // then printed a chip for delivery the ranking key scored at zero. One flag, one rule.
  if (food.efa !== undefined) {
    const pct = Math.round(food.efa.fraction * 100);
    if (food.efa.qualifies) {
      rows.push({
        slug: EFA_SLUG,
        label: DATA._meta.efa_reference.label,
        category: DATA._meta.efa_reference.category,
        pct,
        // The EFA group's amount is FLAXSEED OIL, not the acid the source measured —
        // the same currency EFA_GOAL_MG is in, because that is the only pair of numbers
        // it is honest to print beside each other. The unit is mg by construction: the
        // goal field the percentage divides by is `maintenance_mg`.
        amount: food.efa.oil_equivalent_mg,
        unit: 'mg',
        tier: 'EXACT',
        source: sourceWordsFor('usda-sr-legacy'),
        conservative: false,
      });
    }
  }
  return rows.sort((a, b) => (b.pct - a.pct) || a.slug.localeCompare(b.slug));
}

/**
 * The goal nutrients still outstanding — the denominator the ranking key is measured over.
 *
 * INTERSECTED with `want` on purpose (owner's choice, 2026-08-22): a goal nutrient already
 * covered is not something a food can still help with, so counting it would score every
 * candidate on work already done and freeze the order against a regimen that is changing.
 */
function goalGapSlugs(want: readonly string[], goals: readonly { members: readonly string[] }[]): Set<string> {
  const outstanding = new Set(want);
  const gaps = new Set<string>();
  for (const g of goals) {
    for (const m of g.members) {
      if (outstanding.has(m)) {
        gaps.add(m);
      }
    }
  }
  return gaps;
}

/** Case-insensitive substring over the name and the category, or true for an empty query. */
function matchesQuery(food: Food, query: string): boolean {
  if (query === '') {
    return true;
  }
  return food.name.toLowerCase().includes(query) || food.category.toLowerCase().includes(query);
}

/**
 * Rank foods for the FOOD SOURCES blocks.
 *
 *   - `want`     the essentials still outstanding — the goal key is measured against these
 *   - `owned`    food ids already in the regimen. They leave the pool, which is what makes
 *                the list ADVANCE rather than repeat
 *   - `goals`    active goals: the ranking key when any of their nutrients are outstanding,
 *                and the card's coloured dots either way
 *   - `limit`    how many cards the caller wants. Pass the catalog size for a pager, whose
 *                page count must derive from the live pool and never be stored
 *   - `category` restrict the pool to one catalog category ('' = all)
 *   - `query`    restrict the pool to foods whose name or category contains this ('' = all)
 *
 * ★ THE FILTER IS APPLIED TO THE POOL, NOT TO THE PAGE. Filtering the returned slice would
 * leave the pager counting pages that no longer exist and pages that render empty; filtering
 * here means the page count still derives from exactly what will be shown.
 *
 * ★ A SORT, NOT AN ARGMAX LOOP. Every key is a static property of the food measured against
 * one fixed gap set, so the whole catalog orders in a single pass instead of a re-scan per
 * emitted card — which is what keeps a 192-food request cheap enough to run on every paint.
 */
/** The two essentials scored through the shared EFA meter rather than a nutrient row. */
const EFA_SLUGS = new Set(['omega-3', 'omega-6']);

/**
 * The share of Wallach's daily amount one serving must deliver, for at least ONE of a goal's
 * essentials, before that food is shown under that goal.
 *
 * The filter used to pass a food that carried ANY member at ANY amount. Goals hold up to 27
 * essentials, so it returned 156–237 of 248 foods — the same "a signal that is always on is not
 * a signal" failure the product chips had, reproduced here. The bar could not come from the
 * catalogue's own admission test either: every nutrient row recorded in it is ALREADY at least
 * 7% of its target (measured 2026-08-24 over all 974 rows, minimum 0.0701), which is precisely
 * why "carries any of them" read as almost every food.
 *
 * The comment this replaces argued FOR having no bar — a food is one ingredient rather than a
 * formula, so it cannot be asked to cover a whole goal. That reasoning is still right, and it is
 * why the test is a PER-NUTRIENT MAX rather than the mean a product's chip uses. It was the
 * absence of any bar at all that made the control useless.
 *
 * 0.25 is the same number and the same sentence the product filter uses
 * (state/recommender.ts::GOAL_CONTRIB_MIN). Censused over all 30 goals it returns 24–135 foods.
 */
const GOAL_CONTRIB_MIN = 0.25;

/**
 * Does one serving of this food contribute to this goal — see GOAL_CONTRIB_MIN.
 *
 * The EFA group answers for both of its members: 24 of the 30 goals name omega-3 or omega-6 and
 * neither carries an individual amount, so the group's own fraction is the only number there is
 * to test. Held to the same bar as a nutrient row rather than waved through on `qualifies`,
 * which is what made every EFA food match all 24 of those goals.
 */
function deliversGoal(f: Food, members: ReadonlySet<string>): boolean {
  for (const row of f.nutrients) {
    if (members.has(row.slug) && row.fraction >= GOAL_CONTRIB_MIN) {
      return true;
    }
  }
  const efa = f.efa;
  return efa?.qualifies === true && efa.fraction >= GOAL_CONTRIB_MIN
    && [...members].some(m => EFA_SLUGS.has(m));
}

export function rankFoodsForCoverage(input: {
  want: readonly string[];
  owned?: readonly string[];
  goals?: readonly { id: string; members: readonly string[] }[];
  limit?: number;
  category?: string;
  query?: string;
  /**
   * Show only foods delivering at least one of THESE essentials (undefined / empty = no goal
   * filter). The members are passed in rather than looked up from `goals` above, because that
   * list is the reader's own chosen few and the picker offers all thirty: resolving there meant
   * choosing any goal he had not already picked matched an empty set and emptied the list.
   */
  goalMembers?: readonly string[];
  /** Show only foods delivering this one essential ('' = every nutrient). */
  nutrient?: string;
}): FoodRec[] {
  const owned = new Set(input.owned ?? []);
  const goals = input.goals ?? [];
  const limit = input.limit ?? 3;
  const category = input.category ?? '';
  const query = (input.query ?? '').trim().toLowerCase();
  const goalFilter = input.goalMembers;
  const nutrient = input.nutrient ?? '';
  const outstanding = new Set(input.want);

  // A food passes the GOAL filter by delivering a REAL SHARE of at least one of that goal's
  // essentials — see GOAL_CONTRIB_MIN for the bar and for what having no bar at all did to this
  // list. "Which foods contribute to this" and "does this formula cover this" are still
  // different questions and still get different tests; both now have a floor.
  const goalMembers = goalFilter === undefined || goalFilter.length === 0
    ? null
    : new Set(goalFilter);
  const available = DATA.foods.filter(f =>
    !owned.has(f.id)
    && (category === '' || f.category === category)
    && (nutrient === '' || f.nutrients.some(n => n.slug === nutrient)
      || (EFA_SLUGS.has(nutrient) && f.efa?.qualifies === true))
    && (goalMembers === null || deliversGoal(f, goalMembers))
    && matchesQuery(f, query));
  if (available.length === 0) {
    return [];
  }

  const goalGaps = goalGapSlugs(input.want, goals);
  const suppliesOf = (f: Food): number => {
    let n = 0;
    for (const row of f.nutrients) {
      if (outstanding.has(row.slug)) {
        n += 1;
      }
    }
    return n;
  };
  /**
   * Which goals tint this food's card — ANY member it moves, deliberately loose (see
   * views/coverage.ts, which documents why this is a border tint and not a claim).
   *
   * The EFA group counts here for the same reason it counts below: 24 of the 30 goals name
   * omega-3 or omega-6, and walnuts at 220% of his nine grams were tinted for none of them.
   */
  const goalIdsFor = (f: Food): string[] =>
    goals.filter(g => g.members.some(
      m => f.nutrients.some(n => n.slug === m)
        || (f.efa?.qualifies === true && EFA_MEMBERS.has(m)),
    )).map(g => g.id);

  /**
   * The share of the outstanding GOAL targets one serving fills. Each nutrient is capped at
   * its own target: 500% of one is one nutrient filled, not five.
   *
   * ★ THE EFA GROUP FILLS ITS MEMBERS' GAPS — 2026-08-22, the same blind spot `strength`
   * had and a wider one. 24 of the 30 goals name omega-3 or omega-6, and NO nutrient row can
   * ever credit either: they carry no individual Wallach dose and share one meter. So every
   * candidate was diluted by an identical unfillable amount, and the foods that actually
   * answer the goal ranked as though they did nothing about it. The group's own fraction now
   * fills each of its members present in the gap set — the denominator already counts them
   * as two, one delivery genuinely moves both, and that is exactly how state/coverage.ts
   * resolves their tiles. Capped like every other term on this key.
   */
  const goalFillOf = (f: Food): number => {
    let filled = 0;
    for (const row of f.nutrients) {
      if (goalGaps.has(row.slug)) {
        filled += Math.min(row.fraction, 1);
      }
    }
    const efa = f.efa;
    if (efa?.qualifies === true) {
      for (const member of EFA_MEMBERS) {
        if (goalGaps.has(member)) {
          filled += Math.min(efa.fraction, 1);
        }
      }
    }
    return filled / goalGaps.size;
  };

  // With no goals chosen — or with every goal nutrient already covered — there is no goal
  // gap to measure against and `strength` IS the answer the owner asked for: most nutritious
  // first, which is Σ of how much of Wallach's targets one serving delivers.
  const byGoal = goalGaps.size > 0;
  const scored = available.map(f => ({ food: f, key: byGoal ? goalFillOf(f) : f.strength }));

  // The two tiebreaks are what make the order TOTAL. Without the id, two foods of equal key
  // could swap places between paints and the page under the reader's cursor would shuffle;
  // without strength between them, every food that fills none of the goal gaps would fall
  // into id order and the tail of the list would read as alphabetical noise.
  scored.sort((a, b) =>
    (b.key - a.key)
    || (b.food.strength - a.food.strength)
    || a.food.id.localeCompare(b.food.id));

  const out: FoodRec[] = [];
  for (const { food, key } of scored) {
    if (out.length >= limit) {
      break;
    }
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
      score: key,
      hits,
    });
  }
  return out;
}

// ─── "Best food sources" for ONE essential (the Knowledge entity page) ───────

/** One food offered as a source of a single essential, as the entity page's row needs it. */
export interface RankedFoodSource {
  id: string;
  name: string;
  /** Amount in that essential's own unit, on one serving. */
  amount: number;
  unit: string;
  /** Share of Wallach's daily target one serving delivers, 0..n. */
  fraction: number;
  /** True once the serving clears the artifact's STRONG threshold. */
  strong: boolean;
  grams: number;
}

/**
 * Why an essential's food block says what it says.
 *
 * The four no-food outcomes are NOT interchangeable, and collapsing them was the whole risk
 * here. "Wallach's target is therapeutic and no food on earth reaches it" is a finding;
 * "nobody has bound a composition source for this one" is an admission; "Wallach states no
 * amount, so nothing can be measured" is a third thing again. Printing the first sentence over
 * either of the others would put a claim on screen that the data does not support — and for the
 * twelve amino acids it would be flatly false, since protein is where they come from.
 */
export type FoodSourceVerdict =
  /** At least one catalog food clears the qualify threshold. */
  | 'foods'
  /** A plant-derived (trace_pdm) mineral: covered as a group by the colloidal-mineral vehicle. */
  | 'plant_derived'
  /** Wallach names the plant-derived vehicle as THIS essential's supply route, in his own words. */
  | 'vehicle_supplied'
  /** Bound to a composition source, swept, and no food reaches 7% of his target. */
  | 'unreachable'
  /** Carries a numeric Wallach target, but no composition source is bound yet. A GAP, not a finding. */
  | 'no_binding'
  /**
   * Wallach states a target of ZERO — he recommends none of it.
   *
   * Phosphorus is the only case, and it is deliberate: his Base Line table lists no supplemental
   * phosphorus because the ordinary diet already supplies a large excess, and that surplus pulls
   * calcium out of the bones (WAL-CLM-LETS-000061). Reporting this as a missing binding would put
   * "a gap in our sources" over a number he actually states.
   */
  | 'zero_target'
  /** Wallach states no amount, so there is no denominator any food could be measured against. */
  | 'no_target';

const MEASURABLE = new Set(DATA._meta.essentials_measurable ?? []);


/** slug → its target block, read once from the same artifact state/coverage.ts reads. */
const TARGET_BY_SLUG: Map<string, { kind?: string; vehicle_supplied?: boolean; low?: number }> = (() => {
  const parsed = EssentialsDataSchema.safeParse(essentialsTargetsData);
  const m = new Map<string, { kind?: string; vehicle_supplied?: boolean; low?: number }>();
  if (!parsed.success) {
    return m;
  }
  for (const e of parsed.data.essentials) {
    const t = CoverageTargetSchema.safeParse(e.target);
    m.set(e.slug, t.success
      ? {
        ...(t.data.kind === undefined ? {} : { kind: t.data.kind }),
        ...(t.data.vehicle_supplied === undefined ? {} : { vehicle_supplied: t.data.vehicle_supplied }),
        ...(t.data.low === undefined ? {} : { low: t.data.low }),
      }
      : {});
  }
  return m;
})();

/**
 * Every catalog food that credits this essential, richest serving first.
 *
 * Ranked by `fraction` — the share of Wallach's daily target one serving delivers — because the
 * question the block answers is "what should I eat for THIS", not "what is the most nutritious
 * food that happens to contain it". A raw amount would rank by unit size instead of by meaning.
 */
export function rankedFoodsForEssential(slug: string): RankedFoodSource[] {
  const out: RankedFoodSource[] = [];
  // The two omegas carry no individual Wallach dose, so the derive emits no nutrient row for
  // them; their delivery lives in the food's `efa` block, measured against his ONE collective
  // amount for the pair. Reading rows only would report "no food source" for the two essentials
  // whose food sources this app already prints a percentage for on every card.
  if (EFA_SLUGS.has(slug)) {
    for (const f of DATA.foods) {
      const e = f.efa;
      if (e === undefined || e.qualifies !== true) {
        continue;
      }
      out.push({
        id: f.id, name: f.name, amount: e.oil_equivalent_mg, unit: 'mg',
        fraction: e.fraction, strong: e.strong === true, grams: f.grams,
      });
    }
    out.sort((a, b) => (b.fraction - a.fraction) || a.id.localeCompare(b.id));
    return out;
  }
  for (const f of DATA.foods) {
    for (const n of f.nutrients) {
      if (n.slug !== slug) {
        continue;
      }
      out.push({
        id: f.id, name: f.name, amount: n.amount, unit: n.unit,
        fraction: n.fraction, strong: n.strong === true, grams: f.grams,
      });
    }
  }
  // Total order: fraction, then id, so the list cannot reshuffle between paints.
  out.sort((a, b) => (b.fraction - a.fraction) || a.id.localeCompare(b.id));
  return out;
}

/**
 * What the food block should say for an essential, and on what grounds.
 *
 * Derived end to end — there is no hand-kept list of "supplement-only" slugs anywhere, because
 * such a list is exactly the thing that goes stale silently. `vehicle_supplied` is stamped onto
 * the target by targets_derive from cited claims; `trace_pdm` is the target kind; `unreachable`
 * is a SWEPT result over the shipped catalog, not an assertion.
 */
export function foodSourceVerdict(slug: string): FoodSourceVerdict {
  if (rankedFoodsForEssential(slug).length > 0) {
    return 'foods';
  }
  const t = TARGET_BY_SLUG.get(slug);
  if (t === undefined) {
    return 'no_target';
  }
  if (t.kind === 'trace_pdm') {
    return 'plant_derived';
  }
  if (t.vehicle_supplied === true) {
    return 'vehicle_supplied';
  }
  if (t.kind !== 'wallach') {
    return 'no_target';
  }
  // A stated ZERO is a statement, not a silence — and it is the same test the derive uses to
  // decide what a food may be measured against, so the two cannot disagree.
  if (typeof t.low !== 'number' || t.low <= 0) {
    return 'zero_target';
  }
  return MEASURABLE.has(slug) ? 'unreachable' : 'no_binding';
}
