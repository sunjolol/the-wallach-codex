/**
 * state/recommender.test.ts — the cost-per-nutrient ranker.
 *
 * Locks the match-score behavior over the REAL generated product-recommender-data.json:
 *   - ranks best-first by score (a total order);
 *   - the keystone is the amount-potency PROXY until a Wallach target is supplied, then it
 *     is saturating adequacy min(1, delivered/target) — capped at 1, flagged as real;
 *   - value + adequacy stay in [0,1]; an unknown slug yields [].
 * DOM-free (pure over the imported artifact), so it runs in the default node env.
 */

import { describe, expect, it } from 'vitest';
import efaData from '../../../data/efa-coverage-data.json';
import layoutData from '../../../data/coverage-layout-data.json';
import { contributesToGoal, essentialSlugsByProduct, goalDelivery, hasSources, listCatalogProducts, rankSources } from './recommender.js';
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
    // The unit is REQUIRED for target-based adequacy. Omitting it used to mean
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
 * The kids exclusion — the BEHAVIOURAL half.
 *
 * `kids_products_not_recommended` is a STATIC gate: it proves the filter code exists and is
 * wired the right way round. It cannot prove the filter RUNS — a gate can be green because
 * of the very defect it is meant to catch. These tests run the filter against the REAL
 * artifact.
 *
 * NEGATIVE CONTROL BY CONSTRUCTION: each case asserts the excluded product is a genuine
 * candidate in the underlying data (via the unfiltered Products-tab index) and THEN absent
 * from the ranking. Without that first half, a passing test could just mean "kids-toddy
 * delivers no calcium" — proving nothing.
 */
describe('recommender: kids products are excluded from recommendations, never from the DB', () => {
  // Read the REAL list rather than re-typing it: a hardcoded copy here would be a second
  // home for the curation list that silently goes stale the day a 5th product is added
  // — the test would then pass while the new product went unchecked.
  const KIDS = excludedProductIds();

  it('anchors on the known list — non-empty, and containing the audited products', () => {
    // The ANTI-CIRCULARITY anchor. Every assertion below is driven BY the list, so an
    // emptied list would make them all vacuously true. This case is what makes them mean
    // something: the list must actually be populated with the audited products.
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
    // They are better as a database item to be discovered in the products tab.
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

/**
 * The goal filter and the goal chip run ONE test, and the number on the chip is what
 * discriminates. Both halves of that were learned the hard way on 2026-08-24: a mean across the
 * whole goal as the FILTER left nine goals showing three products or fewer, and the same mean
 * as the CHIP left 143 of 149 products carrying no chip at all.
 *
 * ★ THE BANDS ARE PROPERTIES, NOT SNAPSHOTS. Nothing here asserts a count that a data change
 * may legitimately move; it asserts that no goal is emptied and no goal keeps most of the
 * catalogue — the two failure modes actually observed, in the two directions.
 */
describe('the goal filter and the goal chip run one test', () => {
  const GOALS = (layoutData as { goals: { id: string; members: string[] }[] }).goals;
  const POOL = listCatalogProducts({ want: [], goals: GOALS });
  /** The owner's own five, and the product his report named. */
  const HIS = ['muscle-strength', 'focus-attention', 'sharper-thinking', 'better-mood', 'more-energy'];

  it('shows ultimate-daily under all five goals it had been invisible in', () => {
    // The report that named the defect. A 24-essential daily multi delivering ALL of Wallach's
    // vitamin B2 scored 0.12-0.22 as a MEAN across 9-19 essentials, missed the chip's 0.30, and
    // so was filtered out of every one of them.
    const g = (id: string): string[] => GOALS.find(x => x.id === id)!.members;
    for (const id of HIS) {
      expect(contributesToGoal('ultimate-daily', g(id)), id).toBe(true);
    }
  });

  it('never lists a product under a goal its own card says nothing about', () => {
    // The exact report: "Ultimate Daily still shows nothing even though it filters under
    // sharper thinking". The filter reads `goals` and so does the card, so a product in the
    // list ALWAYS carries the chip that put it there. This is the assertion that keeps the two
    // from being split again.
    for (const p of POOL) {
      for (const goal of GOALS) {
        expect(p.goals.some(g => g.id === goal.id), `${p.productId}/${goal.id}`)
          .toBe(contributesToGoal(p.productId, goal.members));
      }
    }
  });

  it('publishes exactly what goalDelivery computes, ordered by whole-goal coverage', () => {
    for (const p of POOL) {
      for (const tag of p.goals) {
        const goal = GOALS.find(g => g.id === tag.id)!;
        expect(tag.delivery, `${p.productId}/${tag.id}`).toEqual(goalDelivery(p.productId, goal.members));
      }
      // ORDERED BY depth x breadth, not by the depth on show — a narrow product is 100% deep on
      // many goals at once, and ordering on that would lead every card with its thinnest claim.
      const keys = p.goals.map(g => g.delivery === null ? -1 : g.delivery.depth * g.delivery.delivers / g.delivery.of);
      expect(keys, p.productId).toEqual([...keys].sort((a, b) => b - a));
    }
  });

  it('never states a depth without the breadth it has to be read against', () => {
    // Depth alone over-claims: measured 2026-08-24, it puts 44 product/goal pairs at 90% or
    // better, the worst being a vitamin D spray at 100% for "healthy heart" on ONE of that
    // goal's twenty-five essentials. The pair is what makes that honest, so the pair is what
    // the type carries — this asserts the two can never come apart.
    let narrowAndDeep = 0;
    for (const p of POOL) {
      for (const tag of p.goals) {
        const d = tag.delivery;
        if (d === null) { continue; }
        expect(d.delivers, `${p.productId}/${tag.id}`).toBeGreaterThan(0);
        expect(d.delivers, `${p.productId}/${tag.id}`).toBeLessThanOrEqual(d.of);
        expect(d.of, `${p.productId}/${tag.id}`).toBeGreaterThanOrEqual(3);
        expect(d.depth, `${p.productId}/${tag.id}`).toBeLessThanOrEqual(1);
        if (d.depth >= 0.9 && d.delivers < d.of / 4) { narrowAndDeep += 1; }
      }
    }
    // The case that made the count non-optional is REAL and still in the data — if this ever
    // hits zero, the guard has stopped guarding anything and should be re-argued, not deleted.
    expect(narrowAndDeep).toBeGreaterThan(0);
  });

  it('answers for a goal that no strength test can score at all', () => {
    // thyroid-support names five essentials; only copper and iodine carry a Wallach amount, so
    // it cannot reach the minimum measurable membership and goalDelivery is null for all of
    // them. Every strength-based filter returned an empty list for it, and no threshold could
    // have rescued that. Contribution still has something true to say.
    const thyroid = GOALS.find(g => g.id === 'thyroid-support')!;
    expect(POOL.every(p => goalDelivery(p.productId, thyroid.members) === null)).toBe(true);
    expect(POOL.filter(p => contributesToGoal(p.productId, thyroid.members)).length)
      .toBeGreaterThan(0);
  });

  it('lands every goal inside a usable band — the census the last miscalibration lacked', () => {
    for (const goal of GOALS) {
      const n = POOL.filter(p => p.goals.some(g => g.id === goal.id)).length;
      expect(n, `${goal.id} returns too few`).toBeGreaterThanOrEqual(10);
      expect(n, `${goal.id} keeps most of the catalogue`).toBeLessThanOrEqual(Math.round(POOL.length * 0.6));
    }
  });

  it('leaves a real share of the catalogue unchipped for any one goal', () => {
    // A chip on almost every card is the failure the 0.30 bar was reaching for, and it is worth
    // keeping a floor under: measured 2026-08-24, 43% of the catalogue carries no chip at all
    // against the owner's five goals. The band above bounds this per goal; this bounds it for
    // the reader who has chosen several.
    const HIS_GOALS = GOALS.filter(g => HIS.includes(g.id));
    const unchipped = POOL.filter(p => !HIS_GOALS.some(g => p.goals.some(t => t.id === g.id)));
    expect(unchipped.length).toBeGreaterThan(POOL.length * 0.2);
  });
});

/**
 * The essential fatty acids, in the PRODUCT scorer — the blind spot that printed "0%".
 *
 * omega-3 and omega-6 carry no individual Wallach amount; he states ONE for the category, and
 * that number is sealed (WAL-CLM-DDDL-000115) and generated into efa-coverage-data.json. The
 * scorer dropped both members from the numerator and the denominator, so a product whose only
 * essential is an omega averaged to exactly zero while still being listed under the goal.
 */
describe('the EFA group is scored, and no chip states a share of zero', () => {
  const GOALS = (layoutData as { goals: { id: string; members: string[] }[] }).goals;
  const EFA = efaData as {
    goal: { maintenance_mg: number; members: string[]; source_claim_id: string };
    products: Record<string, { efa_oil_mg: number }>;
  };
  const POOL = listCatalogProducts({ want: [], goals: GOALS });
  const NAMES_OMEGA = GOALS.filter(g => g.members.some(m => EFA.goal.members.includes(m)));

  it('takes its EFA amount from a sealed Wallach claim, not from anything here', () => {
    // §00.A: the only number this file may rely on is one that traces to a book. If the
    // artifact ever ships an amount with no claim behind it, this scorer must not use it.
    expect(EFA.goal.source_claim_id).toMatch(/^WAL-CLM-/);
    expect(EFA.goal.maintenance_mg).toBeGreaterThan(0);
    expect(NAMES_OMEGA.length).toBeGreaterThan(20);
  });

  it('never states a share of zero — the state the owner reported', () => {
    // A rounded "0%" claims a measurement of nothing. Either a depth exists and is above zero,
    // or none exists and the chip carries no number at all.
    for (const p of POOL) {
      for (const tag of p.goals) {
        if (tag.delivery !== null) {
          expect(tag.delivery.depth, `${p.productId}/${tag.id}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('reads an omega-only product at its true share of Wallach\'s 9 grams', () => {
    // The owner's own arithmetic, and the whole point of the restructure: "if 9 Ultimate EFA
    // Plus gets you 100%, then 1 capsule is 11.1%". A product that carries nothing but the two
    // omegas must read EXACTLY the group's own fraction — no dilution by the fifteen other
    // essentials the goal happens to name. Recomputed from the artifact, never written down.
    for (const id of ['ultimate-efa-plus', 'ultimate-efa', 'omega', 'ultimate-smart-fx']) {
      if (!POOL.some(p => p.productId === id)) { continue; }
      const share = EFA.products[id]!.efa_oil_mg / EFA.goal.maintenance_mg;
      for (const goal of NAMES_OMEGA) {
        const d = goalDelivery(id, goal.members);
        if (d === null || d.delivers !== goal.members.filter(m => EFA.goal.members.includes(m)).length) {
          continue; // carries something else in this goal too — not the pure case
        }
        expect(d.depth, `${id}/${goal.id}`).toBeCloseTo(share, 10);
      }
    }
    // And the anchor itself: one soft gel of Ultimate EFA Plus against his nine grams.
    expect(EFA.products['ultimate-efa-plus']!.efa_oil_mg / EFA.goal.maintenance_mg)
      .toBeCloseTo(1 / 9, 3);
  });

  it('keeps every EFA product reachable through the goals that name an omega', () => {
    // One serving of every EFA product in the catalogue is a fraction of Wallach's 9 grams, so
    // the per-serving contribution bar would empty all of them out of all 25 goals. That is why
    // contributesToGoal tests the group by PRESENCE — this is the assertion that would go red
    // if that reasoning were ever quietly dropped.
    for (const id of Object.keys(EFA.products)) {
      if (!POOL.some(p => p.productId === id)) { continue; }
      const reached = NAMES_OMEGA.filter(g => contributesToGoal(id, g.members)).length;
      expect(reached, id).toBeGreaterThan(0);
    }
  });
});
