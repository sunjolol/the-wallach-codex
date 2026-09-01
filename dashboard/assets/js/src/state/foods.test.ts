/**
 * state/foods.test.ts — the food recommender's behaviour, against the REAL shipped catalog.
 *
 * Deliberately not fixtures: the properties that matter here (the order is TOTAL, the list
 * ADVANCES, an empty want does not empty the list, nothing is credited for an essential
 * Wallach states no number for) are properties of the DATA as much as of the code, and a
 * fixture would let the data drift out from under them.
 *
 * ★ THE EXPECTED ORDER IS RECOMPUTED FROM THE ARTIFACT, never written down. Every ordering
 * assertion below builds its own answer out of foods-composition-data.json and compares —
 * so a test cannot keep passing by agreeing with a copy of the ranker's opinion.
 */
import { describe, expect, it } from 'vitest';
import layoutData from '../../../data/coverage-layout-data.json';
import efaData from '../../../data/efa-coverage-data.json';
import foodsData from '../../../data/foods-composition-data.json';
import { foodById, foodCatalogSize, foodCategories, foodNutrientRows, rankFoodsForCoverage } from './foods.js';

const ALL_SLUGS = (foodsData as { _meta: { essentials_measurable: string[] } })
  ._meta.essentials_measurable;
/** The two essentials the one EFA meter answers for. Read from the goal, never typed here. */
const EFA_MEMBERS = (efaData as { goal: { members: string[] } }).goal.members;

interface RawFood {
  id: string;
  name: string;
  category: string;
  strength: number;
  nutrients: { slug: string; fraction: number }[];
  efa?: {
    oil_equivalent_mg: number;
    fraction: number;
    qualifies: boolean;
    by_member: Record<string, { fraction: number; qualifies: boolean }>;
  };
}
const FOODS = (foodsData as { foods: RawFood[] }).foods;

/**
 * Σ min(fraction, 1) over a gap set — the ranker's goal key, minus its constant divisor.
 *
 * ★ EACH OMEGA IN THE GAP SET FILLS FROM ITS OWN SHARE (owner ruling, 2026-08-31). Neither is
 * a nutrient row — they carry no individual Wallach dose — so a model summed over rows alone
 * would score a goal naming an omega identically for every candidate, and would therefore
 * agree, in perfect health, with a ranker that had gone blind to them.
 *
 * ★ AND IT MUST NOT USE THE PAIR'S COMBINED FRACTION, which is what shipped between
 * 2026-08-22 and 2026-08-31. That figure is capped at 1 here, so it handed every
 * EFA-qualifying food an identical full point — a qualify/do-not-qualify flag wearing a
 * magnitude's clothes. A model written that way agrees with that defect exactly.
 */
function fillOver(f: RawFood, gaps: Set<string>): number {
  const rows = f.nutrients.reduce(
    (s, n) => s + (gaps.has(n.slug) ? Math.min(n.fraction, 1) : 0), 0);
  return EFA_MEMBERS.filter(m => gaps.has(m)).reduce((s, m) => {
    const share = f.efa?.by_member[m];
    return s + (share?.qualifies === true ? Math.min(share.fraction, 1) : 0);
  }, rows);
}

/** The catalog in the order the ranker must produce for this gap set. */
function expectedOrder(gaps: Set<string>): RawFood[] {
  const key = (f: RawFood): number => (gaps.size > 0 ? fillOver(f, gaps) / gaps.size : f.strength);
  return [...FOODS].sort((a, b) =>
    (key(b) - key(a)) || (b.strength - a.strength) || a.id.localeCompare(b.id));
}

describe('food catalog', () => {
  it('ships a non-trivial catalog', () => {
    expect(foodCatalogSize()).toBeGreaterThan(100);
  });

  it('never credits an essential outside the measurable set', () => {
    // The measurable set is exactly the essentials carrying a NUMERIC Wallach target that
    // USDA also measures. A slug outside it would mean a food had reached a tile that
    // covers on PRESENCE — silver, an amino acid — and turned it green with nothing
    // compared. This is the runtime half of the gate's clause 3.
    for (const food of FOODS) {
      for (const row of food.nutrients) {
        expect(ALL_SLUGS, `${food.id} credits ${row.slug}`).toContain(row.slug);
      }
    }
  });

  it('resolves nutrient rows by id and returns [] for an unknown id', () => {
    const first = FOODS[0]!.id;
    expect(foodNutrientRows(first).length).toBeGreaterThan(0);
    expect(foodNutrientRows('no-such-food')).toEqual([]);
    expect(foodById('no-such-food')).toBeUndefined();
  });

  it('offers the catalog’s own categories, A–Z and deduplicated', () => {
    expect(foodCategories())
      .toEqual([...new Set(FOODS.map(f => f.category))].sort((a, b) => a.localeCompare(b)));
  });
});

describe('rankFoodsForCoverage — the order', () => {
  it('with no goals, most nutritious first', () => {
    // The owner's rule, 2026-08-22: with nothing chosen to aim at, the honest ordering is
    // the food's own Σ of Wallach fractions — how much of his targets one serving delivers.
    const recs = rankFoodsForCoverage({ want: ALL_SLUGS, limit: 8 });
    expect(recs.map(r => r.foodId))
      .toEqual(expectedOrder(new Set()).slice(0, 8).map(f => f.id));
  });

  it('with goals, the food that fills most of the OUTSTANDING goal targets leads', () => {
    const members = ALL_SLUGS.slice(0, 2);
    const recs = rankFoodsForCoverage({
      want: ALL_SLUGS,
      limit: 6,
      goals: [{ id: 'g', members }],
    });
    expect(recs.map(r => r.foodId))
      .toEqual(expectedOrder(new Set(members)).slice(0, 6).map(f => f.id));
    // …and the page really is non-increasing in the key it was sorted by.
    const keys = recs.map(r => r.score);
    expect([...keys].sort((a, b) => b - a)).toEqual(keys);
  });

  it('a goal nutrient already covered drops out of the key', () => {
    // This is the whole difference between "the goal" and "what is LEFT of the goal"
    // (owner's choice, 2026-08-22): covering one member must re-order the list.
    const members = ALL_SLUGS.slice(0, 2);
    const want = ALL_SLUGS.filter(s => s !== members[0]);
    const recs = rankFoodsForCoverage({ want, limit: 6, goals: [{ id: 'g', members }] });
    expect(recs.map(r => r.foodId))
      .toEqual(expectedOrder(new Set([members[1]!])).slice(0, 6).map(f => f.id));
  });

  it('a goal naming an omega is FILLED by that omega\'s own share, not left unfillable', () => {
    // 24 of the 30 shipped goals name omega-3 or omega-6, and no nutrient row can ever credit
    // either — they carry no individual Wallach dose and share one meter. Until 2026-08-22
    // that gap diluted every candidate by the same unfillable amount, so the foods that
    // actually answer the goal ranked as though they did nothing about it. This is the test
    // that would have caught it: with rows alone, the lead below is not an EFA food.
    const members = [EFA_MEMBERS[0]!];
    const recs = rankFoodsForCoverage({
      want: [...ALL_SLUGS, ...EFA_MEMBERS],
      limit: 6,
      goals: [{ id: 'g', members }],
    });
    expect(recs.map(r => r.foodId))
      .toEqual(expectedOrder(new Set(members)).slice(0, 6).map(f => f.id));
    const lead = FOODS.find(f => f.id === recs[0]!.foodId)!;
    expect(lead.efa?.by_member[members[0]!]?.qualifies,
      `${recs[0]!.foodId} leads a goal whose only gap is ${members[0]!}, and does not carry it`)
      .toBe(true);
  });

  /**
   * ★ THE TWO OMEGAS ARE NOT INTERCHANGEABLE — the unit-level form of the lesson that cost
   * two rounds on 2026-08-31. Every arithmetic assertion above passes just as happily when
   * both members read the SAME number, because a shared figure is perfectly consistent with
   * itself. Only asking whether the two answers DIFFER can see it.
   *
   * Asserted by existence rather than by a snapshot: no count here moves when the catalogue
   * legitimately gains a food.
   */
  it('ranks a goal naming omega-3 differently from one naming omega-6', () => {
    const orders = EFA_MEMBERS.map(m => rankFoodsForCoverage({
      want: [...ALL_SLUGS, ...EFA_MEMBERS],
      limit: 8,
      goals: [{ id: 'g', members: [m] }],
    }).map(r => r.foodId));
    expect(orders[0], 'the two omegas produced one identical ranking — the pair\'s combined '
      + 'figure is being read for a goal that names ONE of them').not.toEqual(orders[1]);
    const lead3 = FOODS.find(f => f.id === orders[0]![0])!;
    const lead6 = FOODS.find(f => f.id === orders[1]![0])!;
    expect(lead3.efa!.by_member[EFA_MEMBERS[0]!]!.fraction,
      `${orders[0]![0]} leads the ${EFA_MEMBERS[0]} goal on less ${EFA_MEMBERS[0]} than it has ${EFA_MEMBERS[1]}`)
      .toBeGreaterThan(lead3.efa!.by_member[EFA_MEMBERS[1]!]!.fraction);
    expect(lead6.efa!.by_member[EFA_MEMBERS[1]!]!.fraction)
      .toBeGreaterThan(lead6.efa!.by_member[EFA_MEMBERS[0]!]!.fraction);
  });

  it('with every goal nutrient covered it falls back to most nutritious', () => {
    const members = ALL_SLUGS.slice(0, 2);
    const want = ALL_SLUGS.filter(s => !members.includes(s));
    const recs = rankFoodsForCoverage({ want, limit: 4, goals: [{ id: 'g', members }] });
    expect(recs.map(r => r.foodId))
      .toEqual(expectedOrder(new Set()).slice(0, 4).map(f => f.id));
  });

  it('the goal key is a fraction — never above 1, never below 0', () => {
    // A serving carrying 500% of one target has not filled five nutrients, so each member is
    // capped at its own target. Without the cap one extreme row would own the whole list.
    const members = ALL_SLUGS.slice(0, 3);
    for (const r of rankFoodsForCoverage({
      want: ALL_SLUGS,
      limit: 40,
      goals: [{ id: 'g', members }],
    })) {
      expect(r.score, r.foodId).toBeLessThanOrEqual(1);
      expect(r.score, r.foodId).toBeGreaterThanOrEqual(0);
    }
  });

  it('the order is TOTAL: two identical requests agree exactly, with no repeats', () => {
    // The id tiebreak is what buys this. Without it two foods of equal key could swap places
    // between paints and the page under the reader's cursor would shuffle for no reason.
    const a = rankFoodsForCoverage({ want: ALL_SLUGS, limit: 40 }).map(r => r.foodId);
    const b = rankFoodsForCoverage({ want: ALL_SLUGS, limit: 40 }).map(r => r.foodId);
    expect(a).toEqual(b);
    expect(new Set(a).size).toBe(a.length);
  });

  it('ADVANCES: an owned food leaves the list', () => {
    // This is what makes the list terminate instead of repeating. Without it the same
    // three cards come back forever and adding one changes nothing on screen.
    const first = rankFoodsForCoverage({ want: ALL_SLUGS, limit: 3 });
    const second = rankFoodsForCoverage({
      want: ALL_SLUGS, limit: 3, owned: first.map(r => r.foodId),
    });
    for (const r of second) {
      expect(first.map(x => x.foodId)).not.toContain(r.foodId);
    }
  });

  it('an empty want no longer empties the list', () => {
    // It used to return [] — "nothing outstanding, nothing to recommend". Under one global
    // order there is no gap-fill mode to fall out of: with no goal gap the key is nutrition,
    // which is an answer, not a stop.
    expect(rankFoodsForCoverage({ want: [], limit: 3 }).length).toBe(3);
  });

  it('exhausts once every food is owned', () => {
    const all = FOODS.map(f => f.id);
    expect(rankFoodsForCoverage({ want: ALL_SLUGS, limit: 3, owned: all })).toEqual([]);
  });
});

describe('rankFoodsForCoverage — the filter', () => {
  it('the category filter narrows the POOL, not the page', () => {
    // The pager counts pages off this length, so a filter that only trimmed the returned
    // slice would leave it advertising pages that do not exist.
    const cat = foodCategories()[0]!;
    const recs = rankFoodsForCoverage({ want: ALL_SLUGS, limit: 500, category: cat });
    expect(recs.length).toBe(FOODS.filter(f => f.category === cat).length);
    for (const r of recs) {
      expect(r.category).toBe(cat);
    }
  });

  it('the name query matches name or category, case-insensitively', () => {
    const target = FOODS[0]!;
    const hit = rankFoodsForCoverage({
      want: ALL_SLUGS,
      limit: 500,
      query: target.name.toUpperCase(),
    });
    expect(hit.some(r => r.foodId === target.id)).toBe(true);
    const byCat = rankFoodsForCoverage({
      want: ALL_SLUGS,
      limit: 500,
      query: target.category.toLowerCase(),
    });
    expect(byCat.length)
      .toBeGreaterThanOrEqual(FOODS.filter(f => f.category === target.category).length);
    expect(rankFoodsForCoverage({ want: ALL_SLUGS, limit: 500, query: 'zzzz no such food' }))
      .toEqual([]);
  });

  it('the two filters compose', () => {
    const target = FOODS[0]!;
    const recs = rankFoodsForCoverage({
      want: ALL_SLUGS,
      limit: 500,
      category: target.category,
      query: target.name,
    });
    for (const r of recs) {
      expect(r.category).toBe(target.category);
      expect(r.name.toLowerCase()).toContain(target.name.toLowerCase());
    }
    expect(recs.some(r => r.foodId === target.id)).toBe(true);
  });
});

describe('rankFoodsForCoverage — the readout', () => {
  it('the readout leads with the essential the serving delivers most of', () => {
    const recs = rankFoodsForCoverage({ want: ALL_SLUGS, limit: 5 });
    for (const r of recs) {
      expect(r.hits.length).toBeGreaterThan(0);
      const food = foodById(r.foodId)!;
      // The lead is the best of the nutrient rows AND the EFA group, which is not a row:
      // omega-3/omega-6 carry no individual Wallach target, so the EFAs share one meter and
      // ride alongside. Walnuts deliver 220% of his nine grams and would lead on it.
      // Only a QUALIFYING group is on the card, so only one can be the lead — and the
      // percentage is the generator's own, not this file's second rounding of the division.
      const efaPct = food.efa?.qualifies === true ? Math.round(food.efa.fraction * 100) : 0;
      const best = Math.max(
        Math.round(Math.max(...food.nutrients.map(n => n.fraction)) * 100), efaPct);
      expect(r.hits[0]!.pct).toBe(best);
      // The tile paints hits in order, so the order has to BE the ranking — a card whose
      // chips outrank its lead number would read as if the big figure were the best one.
      const pcts = r.hits.map(h => h.pct);
      expect([...pcts].sort((a, b) => b - a)).toEqual(pcts);
    }
  });

  it('the EFA group reaches the readout, and only above the threshold', () => {
    // It is NOT a nutrient row — omega-3 and omega-6 have no individual Wallach target — so
    // nothing else in this suite would notice if it silently stopped being shown.
    //
    // ★ THE BAR IS THE GENERATOR'S `qualifies`, NOT A PERCENTAGE RE-ROUNDED HERE — and this
    // test used to do the re-rounding, which is exactly how the split survived: seven foods
    // (black beans at 6.521%, kiwifruit at 6.996%) round UP to the 7% floor, so the card drew
    // them a chip for delivery the ranking key scored at zero. Both directions are asserted.
    const shown = FOODS.filter(f => f.efa?.qualifies === true);
    const hidden = FOODS.filter(f => f.efa !== undefined && f.efa.qualifies === false);
    expect(shown.length).toBeGreaterThan(20);
    expect(hidden.length).toBeGreaterThan(0);
    const recs = rankFoodsForCoverage({ want: ALL_SLUGS, limit: 500 });
    const chipped = (id: string): boolean | undefined =>
      recs.find(r => r.foodId === id)?.hits.some(h => h.slug === 'essential-fatty-acids');
    for (const f of shown.slice(0, 12)) {
      if (chipped(f.id) === undefined) {
        continue;
      }
      expect(chipped(f.id), `${f.id} delivers ${f.efa!.fraction} and must be shown`).toBe(true);
    }
    for (const f of hidden.slice(0, 12)) {
      if (chipped(f.id) === undefined) {
        continue;
      }
      expect(chipped(f.id), `${f.id} is under the bar and must not be shown`).toBe(false);
    }
  });

  it('every hit carries the words for its own source', () => {
    // With two sources for sulfur, a hit that borrowed the neighbouring row's citation
    // would render as a perfectly ordinary chip. Nothing may fall back to a slug.
    for (const r of rankFoodsForCoverage({ want: ALL_SLUGS, limit: 8 })) {
      for (const h of r.hits) {
        expect(h.source, `${r.foodId}/${h.slug}`).not.toBe('');
        expect(h.label, `${r.foodId}/${h.slug}`).not.toBe(h.slug);
        expect(h.pct, `${r.foodId}/${h.slug}`).toBeGreaterThan(0);
        expect(h.category, `${r.foodId}/${h.slug}`).not.toBe('');
      }
    }
  });
});

/**
 * The goal filter's FLOOR — added 2026-08-24 after it returned 156-237 of 248 foods for every
 * goal it was given. A control that keeps almost everything is not a control, and the probe
 * that proved this one FIRED could not see that.
 */
describe('rankFoodsForCoverage — the goal filter has a bar', () => {
  const GOALS = (layoutData as { goals: { id: string; members: string[] }[] }).goals;
  /** Recomputed from the artifact, never a copy of the ranker's opinion. */
  const passes = (f: RawFood, members: string[]): boolean =>
    f.nutrients.some(n => members.includes(n.slug) && n.fraction >= 0.25)
    || members.some((m) => {
      // PER MEMBER since 2026-08-31. Against the pair's combined fraction this read true for
      // every EFA food on all 24 goals naming an omega — almonds included, at 0.0% omega-3.
      const share = f.efa?.by_member[m];
      return EFA_MEMBERS.includes(m) && share?.qualifies === true && share.fraction >= 0.25;
    });

  it('returns only foods delivering a real share of one of that goal\'s essentials', () => {
    for (const goal of GOALS) {
      const recs = rankFoodsForCoverage({ want: ALL_SLUGS, limit: 500, goalMembers: goal.members });
      for (const r of recs) {
        const raw = FOODS.find(f => f.id === r.foodId)!;
        expect(passes(raw, goal.members), `${r.foodId} under ${goal.id}`).toBe(true);
      }
    }
  });

  it('keeps every food that clears the bar — the filter narrows, it does not sample', () => {
    for (const goal of GOALS) {
      const recs = rankFoodsForCoverage({ want: ALL_SLUGS, limit: 500, goalMembers: goal.members });
      expect(recs.length, goal.id).toBe(FOODS.filter(f => passes(f, goal.members)).length);
    }
  });

  it('lands every goal inside a usable band, in both directions', () => {
    for (const goal of GOALS) {
      const n = rankFoodsForCoverage({ want: ALL_SLUGS, limit: 500, goalMembers: goal.members }).length;
      expect(n, `${goal.id} returns too few`).toBeGreaterThanOrEqual(10);
      expect(n, `${goal.id} keeps most of the catalogue`)
        .toBeLessThanOrEqual(Math.round(foodCatalogSize() * 0.6));
    }
  });
});

/**
 * The two surfaces that a negative control caught NAKED on 2026-08-31, in the same patch that
 * split them onto the per-member share. Re-breaking `goalFillOf` and `deliversGoal` turned the
 * suite red; re-breaking the NUTRIENT FILTER and the GOAL TINT left it perfectly green, so
 * both had shipped a per-member promise with nothing holding them to it.
 *
 * ★ THE FILTER IS THE STRONGEST CLAIM OF THE FOUR. A reader who picks "Omega-3" from a
 * dropdown has asked one unambiguous question. Against the pair's combined fraction that
 * returned 85 foods, 59 of them under the bar for omega-3 itself, while the omega-3 essential
 * page showed 25 — one app answering one question two ways on two screens.
 */
describe('rankFoodsForCoverage — a filter that names ONE nutrient returns that nutrient', () => {
  const GOALS = (layoutData as { goals: { id: string; members: string[] }[] }).goals;

  /** Recomputed from the artifact, never asked of the ranker. */
  const carries = (f: RawFood, slug: string): boolean =>
    f.nutrients.some(n => n.slug === slug) || f.efa?.by_member[slug]?.qualifies === true;

  it('returns only foods that actually carry the nutrient asked for', () => {
    for (const slug of [...ALL_SLUGS, ...EFA_MEMBERS]) {
      for (const r of rankFoodsForCoverage({ want: ALL_SLUGS, limit: 500, nutrient: slug })) {
        const raw = FOODS.find(f => f.id === r.foodId)!;
        expect(carries(raw, slug), `${r.foodId} came back under the ${slug} filter`).toBe(true);
      }
    }
  });

  it('keeps every food that carries it — the filter narrows, it does not sample', () => {
    for (const slug of [...ALL_SLUGS, ...EFA_MEMBERS]) {
      const n = rankFoodsForCoverage({ want: ALL_SLUGS, limit: 500, nutrient: slug }).length;
      expect(n, slug).toBe(FOODS.filter(f => carries(f, slug)).length);
    }
  });

  /**
   * ★ DISTINCTNESS, ASSERTED BY EXISTENCE. Every assertion above passes when both omegas read
   * the SAME number — a shared figure is entirely consistent with itself, which is precisely
   * why two rounds of this defect shipped green. Only asking whether the two answers DIFFER
   * can see it. No count here moves when the catalogue legitimately gains a food.
   */
  it('the two omega filters do not return one shared list', () => {
    const [a, b] = EFA_MEMBERS.map(m =>
      rankFoodsForCoverage({ want: ALL_SLUGS, limit: 500, nutrient: m }).map(r => r.foodId));
    expect(a, 'both omega filters returned one identical list').not.toEqual(b);
    expect(a!.filter(id => !b!.includes(id)).length,
      `no food is on the ${EFA_MEMBERS[0]} list alone`).toBeGreaterThan(0);
    expect(b!.filter(id => !a!.includes(id)).length,
      `no food is on the ${EFA_MEMBERS[1]} list alone`).toBeGreaterThan(0);
  });

  /**
   * The card's goal TINT. Loose about HOW MUCH by design (see goalIdsFor), never about WHICH:
   * against the combined figure it tinted pumpkin seeds, at 0.5% omega-3, for every goal
   * naming omega-3.
   */
  it('tints a card only for goals it actually moves', () => {
    const goals = GOALS.map(g => ({ id: g.id, members: g.members }));
    for (const r of rankFoodsForCoverage({ want: ALL_SLUGS, limit: 500, goals })) {
      const raw = FOODS.find(f => f.id === r.foodId)!;
      for (const gid of r.goalIds) {
        const g = GOALS.find(x => x.id === gid)!;
        expect(g.members.some(m => carries(raw, m)),
          `${r.foodId} is tinted for ${gid}, which names nothing it carries`).toBe(true);
      }
    }
  });

  /**
   * The tint's own negative control. The check above can only see a food that carries NOTHING
   * a goal names — a food riding in on the pair's combined figure while also carrying, say,
   * that goal's magnesium is invisible to it. This one names the case directly: a food that
   * qualifies for exactly ONE omega must not be tinted by the OTHER omega's account.
   */
  it('does not tint a food for an omega it does not carry', () => {
    const [o3, o6] = EFA_MEMBERS as [string, string];
    const oneSided = FOODS.filter(f => f.efa !== undefined
      && f.efa.by_member[o3]!.qualifies !== f.efa.by_member[o6]!.qualifies);
    expect(oneSided.length, 'no food qualifies for one omega and not the other').toBeGreaterThan(0);
    // A goal naming ONLY the omega this food lacks, and nothing else it carries, must not tint.
    const goals = GOALS.map(g => ({ id: g.id, members: g.members }));
    const recs = rankFoodsForCoverage({ want: ALL_SLUGS, limit: 500, goals });
    for (const f of oneSided) {
      const lacked = f.efa!.by_member[o3]!.qualifies ? o6 : o3;
      const rec = recs.find(r => r.foodId === f.id);
      if (rec === undefined) {
        continue;
      }
      for (const gid of rec.goalIds) {
        const g = GOALS.find(x => x.id === gid)!;
        const onlyByTheLackedOmega = g.members.every(m => m === lacked || !carries(f, m));
        expect(onlyByTheLackedOmega,
          `${f.id} is tinted for ${gid} solely through ${lacked}, which it does not carry`)
          .toBe(false);
      }
    }
  });
});
