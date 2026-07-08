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
import { hasSources, rankSources } from './recommender.js';

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

  it('switches to saturating adequacy when a target is supplied (capped at 1)', () => {
    const target = 55; // mcg — below several sources, so some saturate at 1
    const ranked = rankSources(SLUG, target);
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
