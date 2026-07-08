/**
 * core/nutrient-resolver.test.ts — the TS half of the A2 parity proof.
 *
 * The nutrient_resolver_parity invariant proves the resolver ARTIFACT + the committed fixture
 * both equal the Python nutrient_resolve.resolve(). THIS test proves the TS resolveSlug() reads
 * that artifact correctly by reproducing the fixture over every distinct pillar (name, form).
 * Together: TS runtime resolver ≡ Python resolver.
 */

import { describe, expect, it } from 'vitest';
import fixture from './__fixtures__/nutrient-resolver-fixture.json';
import { resolveSlug } from './nutrient-resolver.js';

describe('nutrient-resolver: TS resolveSlug ≡ Python resolve() (via the shared fixture)', () => {
  it('resolves every distinct pillar (name, form) to the fixture slug', () => {
    const mismatches: string[] = [];
    for (const row of fixture) {
      const got = resolveSlug(row.name, row.form);
      if (got !== row.slug) {
        mismatches.push(`${row.name} (form=${String(row.form)}): TS=${String(got)} vs py=${String(row.slug)}`);
      }
    }
    expect(mismatches.slice(0, 8).join('\n')).toBe('');
    expect(mismatches).toHaveLength(0);
    expect(fixture.length).toBeGreaterThan(1000);
  });

  it('locks the headline resolutions A2 relies on', () => {
    expect(resolveSlug('Thiamin')).toBe('vitamin-b1'); // used to drop under the old matcher
    // Parenthetical label forms (base-foundation regimen + OCR scans) must also resolve.
    expect(resolveSlug('Vitamin B1 (Thiamine)')).toBe('vitamin-b1');
    expect(resolveSlug('Vitamin A (beta-carotene)')).toBe('vitamin-a');
    expect(resolveSlug('Folic Acid (Folate)')).toBe('vitamin-b9');
    expect(resolveSlug('Folic Acid')).toBe('vitamin-b9');
    expect(resolveSlug('Silicon')).toBe('silica');
    expect(resolveSlug('L-Arginine')).toBe('arginine');
    expect(resolveSlug('Alpha-Linolenic Acid (ALA)', 'Omega 3')).toBe('omega-3');
    expect(resolveSlug('EPA')).toBe('omega-3');
    expect(resolveSlug('Caffeine')).toBeNull();
    expect(resolveSlug('')).toBeNull();
  });
});
