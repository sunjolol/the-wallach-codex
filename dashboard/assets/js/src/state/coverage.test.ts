/**
 * state/coverage.test.ts — the coverage matcher now credits via the registry resolver.
 *
 * Locks the resolver behaviour: every Wallach target carries its canon slug, and matchEssential()
 * routes a label name through the ONE resolver (core/nutrient-resolver.ts) → slug → target.
 * The headline shift is "Thiamin", which the old hand-rolled string matcher silently dropped
 * and now correctly credits to Vitamin B1. DOM-free: exercises only matchEssential + getTargets
 * (no localStorage), so it runs in the default node env.
 */

import { describe, expect, it } from 'vitest';
import { getTargets, matchEssential } from './coverage.js';

describe('coverage: matcher unified onto the registry resolver', () => {
  it('exposes the 91 Wallach targets, each carrying its canon slug', () => {
    const targets = getTargets();
    expect(targets).toHaveLength(91);
    expect(targets.every(t => typeof t.slug === 'string' && t.slug.length > 0)).toBe(true);
  });

  it('credits label names to the right essential (incl. the "Thiamin" shift)', () => {
    expect(matchEssential('Thiamin')?.slug).toBe('vitamin-b1');
    expect(matchEssential('Thiamin')?.name).toBe('Vitamin B1 (Thiamine)');
    // The base-foundation regimen labels carry parentheticals — must credit correctly.
    expect(matchEssential('Vitamin B1 (Thiamine)')?.slug).toBe('vitamin-b1');
    expect(matchEssential('Folic Acid (Folate)')?.slug).toBe('vitamin-b9');
    expect(matchEssential('Selenium')?.slug).toBe('selenium');
    expect(matchEssential('Folic Acid')?.slug).toBe('vitamin-b9');
    expect(matchEssential('Silicon')?.slug).toBe('silica');
    expect(matchEssential('Vitamin K2')?.slug).toBe('vitamin-k');
    expect(matchEssential('Caffeine')).toBeNull();
  });
});
