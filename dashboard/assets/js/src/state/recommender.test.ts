/**
 * state/recommender.test.ts — the cost-per-nutrient ranker (A3).
 *
 * Locks the match-score behavior over the REAL generated product-recommender-data.json:
 *   - ranks best-first by score (a total order);
 *   - the keystone is the amount-potency PROXY until a Wallach target is supplied, then it
 *     is saturating adequacy min(1, delivered/target) — capped at 1, flagged as real;
 *   - value + adequacy stay in [0,1]; an unknown slug yields [].
 * DOM-free (pure over the imported artifact), so it runs in the default node env.
 */

import { describe, expect, it } from 'vitest';
import { essentialSlugsByProduct, hasSources, rankSources } from './recommender.js';
import { excludedProductIds } from './kids-exclusion.js';

const SLUG = 'selenium'; // 33 quantified vault sources — a stable, well-populated essential

describe('recommender: cost-per-nutrient ranking', () => {
  it('returns a non-empty list ordered best-first by score', () => {
    const ranked = rankSources(SLUG);
    expect(ranked.length).toBeGreaterThan(1);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1]!.score).toBeGreaterThanOrEqual(ranked[i]!.score);
    }
  });

  it('uses the amount-potency proxy when no Wallach target is given', () => {
    const ranked = rankSources(SLUG);
    // Proxy adequacy = delivered / best-in-set, so the top amount scores exactly 1.
    const maxAmount = Math.max(...ranked.map(r => r.amount));
    const topByAmount = ranked.find(r => r.amount === maxAmount)!;
    expect(topByAmount.adequacyIsTarget).toBe(false);
    expect(topByAmount.adequacy).toBeCloseTo(1, 10);
    for (const r of ranked) {
      expect(r.adequacy).toBeGreaterThanOrEqual(0);
      expect(r.adequacy).toBeLessThanOrEqual(1);
      expect(r.valueScore).toBeGreaterThanOrEqual(0);
      expect(r.valueScore).toBeLessThanOrEqual(1);
    }
  });

  it('IGNORES a target passed without its unit — fail-safe, never a guessed compare', () => {
    // 2026-07-15: the unit is REQUIRED for target-based adequacy. Omitting it used to mean
    // "assume the units match", which is exactly how boron divided mcg by mg. Now it falls
    // back to the potency proxy and SAYS SO via adequacyIsTarget:false.
    const ranked = rankSources(SLUG, 55);
    for (const r of ranked) {
      expect(r.adequacyIsTarget).toBe(false);
    }
  });

  it('reconciles units before dividing — a mcg target vs mcg candidates', () => {
    const target = 55;
    const ranked = rankSources(SLUG, target, 'mcg');
    for (const r of ranked) {
      expect(r.adequacyIsTarget).toBe(true);
      expect(r.adequacy).toBeCloseTo(Math.min(1, r.amount / target), 10);
    }
  });

  it('a mg-stated target of the SAME magnitude scales 1000x — the boron/silver bug, pinned', () => {
    // 0.055 mg === 55 mcg. Both must yield IDENTICAL adequacy. Pre-fix the mg form divided
    // mcg amounts by 0.055 and saturated everything at 1.0 — boron's exact failure.
    const inMcg = rankSources(SLUG, 55, 'mcg');
    const inMg = rankSources(SLUG, 0.055, 'mg');
    expect(inMg.length).toBe(inMcg.length);
    for (let i = 0; i < inMcg.length; i++) {
      expect(inMg[i]!.productId).toBe(inMcg[i]!.productId);
      expect(inMg[i]!.adequacy).toBeCloseTo(inMcg[i]!.adequacy, 10);
    }
    // and the bug's signature — NOT everything pinned to 1.0
    expect(inMg.some(r => r.adequacy < 1)).toBe(true);
  });

  it('refuses a cross-family (IU vs mass) target rather than compare nonsense', () => {
    const ranked = rankSources(SLUG, 55, 'IU');
    for (const r of ranked) {
      expect(r.adequacyIsTarget).toBe(false);
    }
  });

  it('switches to saturating adequacy when a target + unit is supplied (capped at 1)', () => {
    const target = 55; // mcg — below several sources, so some saturate at 1
    const ranked = rankSources(SLUG, target, 'mcg');
    let sawSaturated = false;
    for (const r of ranked) {
      expect(r.adequacyIsTarget).toBe(true);
      expect(r.adequacy).toBeCloseTo(Math.min(1, r.amount / target), 10);
      expect(r.adequacy).toBeLessThanOrEqual(1);
      if (r.amount >= target) {
        sawSaturated = true;
        expect(r.adequacy).toBe(1);
      }
    }
    expect(sawSaturated).toBe(true);
  });

  it('is deterministic — same order on repeat calls', () => {
    const a = rankSources(SLUG).map(r => r.productId);
    const b = rankSources(SLUG).map(r => r.productId);
    expect(a).toEqual(b);
  });

  it('returns [] for an unknown slug and reports hasSources correctly', () => {
    expect(rankSources('___not-an-essential___')).toEqual([]);
    expect(hasSources('___not-an-essential___')).toBe(false);
    expect(hasSources(SLUG)).toBe(true);
  });
});

describe('recommender: product → delivered-essentials index', () => {
  it('inverts the data so a product lists every essential it delivers', () => {
    const idx = essentialSlugsByProduct();
    expect(idx.size).toBeGreaterThan(0);
    // Every (slug → product) edge in the ranking must appear in the inverted (product → slug) index.
    const someSlug = rankSources(SLUG);
    expect(someSlug.length).toBeGreaterThan(0);
    for (const r of someSlug) {
      expect(idx.get(r.productId)).toContain(SLUG);
    }
  });

  it('surfaces trace minerals delivered through blends (boron), not just labeled rows', () => {
    const idx = essentialSlugsByProduct();
    // boron has quantified vault sources; each must be reachable by the "boron" query.
    const boronProducts = [...idx.entries()].filter(([, slugs]) => slugs.includes('boron'));
    expect(boronProducts.length).toBeGreaterThan(0);
  });

  it('is memoized — returns a stable reference', () => {
    expect(essentialSlugsByProduct()).toBe(essentialSlugsByProduct());
  });
});

/**
 * The kids exclusion (Luneth 2026-07-16) — the BEHAVIOURAL half.
 *
 * `kids_products_not_recommended` is a STATIC gate: it proves the filter code exists and is
 * wired the right way round. It cannot prove the filter RUNS. That is the mineral-tiers
 * lesson (sealed, green, and wrong for three weeks) and the reason slot_invariants ships
 * beside a render probe. These tests run it against the REAL artifact.
 *
 * NEGATIVE CONTROL BY CONSTRUCTION: each case asserts the excluded product is a genuine
 * candidate in the underlying data (via the unfiltered Products-tab index) and THEN absent
 * from the ranking. Without that first half, a passing test could just mean "kids-toddy
 * delivers no calcium" — proving nothing (memory: negative-control-or-it-proves-nothing).
 */
describe('recommender: kids products are excluded from recommendations, never from the DB', () => {
  // Read the REAL list rather than re-typing it: a hardcoded copy here would be a second
  // home for the curation list (R3) that silently goes stale the day a 5th product is added
  // — the test would then pass while the new product went unchecked.
  const KIDS = excludedProductIds();

  it('anchors on the known list — non-empty, and containing the audited products', () => {
    // The ANTI-CIRCULARITY anchor. Every assertion below is driven BY the list, so an
    // emptied list would make them all vacuously true. This case is what makes them mean
    // something: the list must actually be populated, with the 2026-07-16 audit's findings.
    expect(KIDS.length).toBeGreaterThanOrEqual(2);
    expect(KIDS).toContain('kids-toddy');
    expect(KIDS).toContain('kidsprinklz');
  });

  it('never returns a kids product from rankSources, on ANY essential', () => {
    const idx = essentialSlugsByProduct();
    const slugs = new Set<string>();
    for (const k of KIDS) {
      for (const s of idx.get(k) ?? []) {
        slugs.add(s);
      }
    }
    // The control: these products ARE in the data, on real essentials — so the assertion
    // below is testing a live branch, not an empty set.
    expect(slugs.size).toBeGreaterThan(0);

    for (const slug of slugs) {
      const ranked = rankSources(slug).map(r => r.productId);
      for (const k of KIDS) {
        expect(ranked).not.toContain(k);
      }
    }
  });

  it('still lists kids products in the Products-tab index (the database stays whole)', () => {
    const idx = essentialSlugsByProduct();
    // Luneth: they are "better as a database item to be discovered in the products tab".
    // Excluded from being RECOMMENDED, never hidden from the catalogue.
    const present = KIDS.filter(k => (idx.get(k) ?? []).length > 0);
    expect(present.length).toBeGreaterThan(0);
    expect(present).toContain('kids-toddy');
  });

  it('does not let an excluded product skew the surviving products\' scores', () => {
    // The proxy denominator (max amount) and the cost-per-unit band are derived from the
    // candidate SET, so the filter must apply BEFORE they are computed. If kids-toddy were
    // the top amount for a slug and were filtered afterwards, every surviving product's
    // adequacy would still be measured against a product that is never shown.
    const idx = essentialSlugsByProduct();
    const slug = (idx.get('kids-toddy') ?? [])[0];
    expect(slug).toBeDefined();
    const ranked = rankSources(slug!);
    expect(ranked.length).toBeGreaterThan(0);
    // Proxy adequacy is delivered/best-in-set, so SOME surviving product must score exactly
    // 1 — proving the denominator came from the filtered set, not the raw one.
    const top = Math.max(...ranked.map(r => r.adequacy));
    expect(top).toBeCloseTo(1, 10);
  });

  it('hasSources agrees with rankSources (never claims a source it would not return)', () => {
    const idx = essentialSlugsByProduct();
    for (const slug of new Set([...(idx.get('kids-toddy') ?? [])])) {
      expect(hasSources(slug)).toBe(rankSources(slug).length > 0);
    }
  });
});
