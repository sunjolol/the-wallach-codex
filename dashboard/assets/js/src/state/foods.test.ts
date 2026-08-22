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
import efaData from '../../../data/efa-coverage-data.json';
import foodsData from '../../../data/foods-composition-data.json';
import { foodById, foodCatalogSize, foodCategories, foodNutrientRows, rankFoodsForCoverage } from './foods.js';

const ALL_SLUGS = (foodsData as { _meta: { essentials_measurable: string[] } })
  ._meta.essentials_measurable;
/** Wallach's EFA dose in mg of flaxseed oil — the meter foods are scored against. */
const EFA_GOAL = (efaData as { goal: { maintenance_mg: number } }).goal.maintenance_mg;

interface RawFood {
  id: string;
  name: string;
  category: string;
  strength: number;
  nutrients: { slug: string; fraction: number }[];
  efa?: { oil_equivalent_mg: number };
}
const FOODS = (foodsData as { foods: RawFood[] }).foods;

/** Σ min(fraction, 1) over a gap set — the ranker's goal key, minus its constant divisor. */
function fillOver(f: RawFood, gaps: Set<string>): number {
  return f.nutrients.reduce((s, n) => s + (gaps.has(n.slug) ? Math.min(n.fraction, 1) : 0), 0);
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
      const efaPct = food.efa === undefined
        ? 0 : Math.round((food.efa.oil_equivalent_mg / EFA_GOAL) * 100);
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
    const floor = Math.round(
      (foodsData as { _meta: { qualify_fraction: number } })._meta.qualify_fraction * 100);
    const expected = FOODS.filter(
      f => f.efa !== undefined && Math.round((f.efa.oil_equivalent_mg / EFA_GOAL) * 100) >= floor);
    expect(expected.length).toBeGreaterThan(20);
    const recs = rankFoodsForCoverage({ want: ALL_SLUGS, limit: 500 });
    for (const f of expected.slice(0, 12)) {
      const rec = recs.find(r => r.foodId === f.id);
      if (rec === undefined) { continue; }
      expect(rec.hits.some(h => h.slug === 'essential-fatty-acids'), f.id).toBe(true);
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
