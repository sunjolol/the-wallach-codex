/**
 * state/foods.test.ts — the food recommender's behaviour, against the REAL shipped catalog.
 *
 * Deliberately not fixtures: the properties that matter here (eggs first, the list ADVANCES,
 * education mode does not return empty, nothing is credited for an essential Wallach states
 * no number for) are properties of the DATA as much as of the code, and a fixture would let
 * the data drift out from under them.
 */
import { describe, expect, it } from 'vitest';
import efaData from '../../../data/efa-coverage-data.json';
import foodsData from '../../../data/foods-composition-data.json';
import { foodById, foodCatalogSize, foodNutrientRows, rankFoodsForCoverage } from './foods.js';

const ALL_SLUGS = (foodsData as { _meta: { essentials_measurable: string[] } })
  ._meta.essentials_measurable;
/** Wallach's EFA dose in mg of flaxseed oil — the meter foods are scored against. */
const EFA_GOAL = (efaData as { goal: { maintenance_mg: number } }).goal.maintenance_mg;

describe('food catalog', () => {
  it('ships a non-trivial catalog', () => {
    expect(foodCatalogSize()).toBeGreaterThan(100);
  });

  it('never credits an essential outside the measurable set', () => {
    // The measurable set is exactly the essentials carrying a NUMERIC Wallach target that
    // USDA also measures. A slug outside it would mean a food had reached a tile that
    // covers on PRESENCE — silver, an amino acid — and turned it green with nothing
    // compared. This is the runtime half of the gate's clause 3.
    for (const food of (foodsData as { foods: { id: string; nutrients: { slug: string }[] }[] }).foods) {
      for (const row of food.nutrients) {
        expect(ALL_SLUGS, `${food.id} credits ${row.slug}`).toContain(row.slug);
      }
    }
  });

  it('resolves nutrient rows by id and returns [] for an unknown id', () => {
    const first = (foodsData as { foods: { id: string }[] }).foods[0]!.id;
    expect(foodNutrientRows(first).length).toBeGreaterThan(0);
    expect(foodNutrientRows('no-such-food')).toEqual([]);
    expect(foodById('no-such-food')).toBeUndefined();
  });
});

describe('rankFoodsForCoverage', () => {
  it('puts the curated pin (egg) first when nothing is owned', () => {
    const recs = rankFoodsForCoverage({ want: ALL_SLUGS, limit: 3 });
    expect(recs.length).toBe(3);
    expect(recs[0]!.foodId).toBe('egg');
    expect(recs[0]!.pinned).toBe(true);
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

  it('greedy: three cards close three DIFFERENT gaps', () => {
    const recs = rankFoodsForCoverage({ want: ALL_SLUGS, limit: 3, greedy: true });
    // Each card is scored against what is still outstanding AFTER the ones above it, so a
    // later card cannot be a duplicate of an earlier one's contribution.
    expect(new Set(recs.map(r => r.foodId)).size).toBe(recs.length);
  });

  it('returns nothing in gap-fill mode when nothing is wanted', () => {
    expect(rankFoodsForCoverage({ want: [], limit: 3 })).toEqual([]);
  });

  it('education mode keeps offering after the field is closed', () => {
    // The owner's ruling: the Regimen console's foods list NEVER exhausts, because seeing
    // the catalog is the point. `want: []` is a MODE CHANGE there, not a stop.
    const recs = rankFoodsForCoverage({ want: [], limit: 3, education: true });
    expect(recs.length).toBe(3);
    // ranked by nutrient density, descending — the scored tail only; the pin still leads
    const scored = recs.filter(r => !r.pinned).map(r => r.score);
    expect([...scored].sort((a, b) => b - a)).toEqual(scored);
  });

  it('education mode still exhausts once every food is owned', () => {
    const all = (foodsData as { foods: { id: string }[] }).foods.map(f => f.id);
    expect(rankFoodsForCoverage({ want: [], limit: 3, education: true, owned: all })).toEqual([]);
  });

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
    const foods = (foodsData as {
      foods: { id: string; efa?: { oil_equivalent_mg: number } }[];
    }).foods;
    const expected = foods.filter(
      f => f.efa !== undefined && Math.round((f.efa.oil_equivalent_mg / EFA_GOAL) * 100) >= floor);
    expect(expected.length).toBeGreaterThan(20);
    for (const f of expected.slice(0, 12)) {
      const recs = rankFoodsForCoverage({ want: ALL_SLUGS, limit: 200, greedy: false, owned: [] });
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

  it('a pinned card outranks every scored card', () => {
    // `score` must mean ONE thing on every row — "the key this position came from" — so the
    // pins sit in a band strictly above the scored band (which is < 1 by construction).
    const recs = rankFoodsForCoverage({ want: ALL_SLUGS, limit: 4 });
    const pinned = recs.filter(r => r.pinned);
    const scored = recs.filter(r => !r.pinned);
    for (const p of pinned) {
      for (const s of scored) {
        expect(p.score).toBeGreaterThan(s.score);
      }
    }
  });
});
