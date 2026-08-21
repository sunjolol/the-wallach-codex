/**
 * core/units.test.ts — unit SPELLING resolves to unit MEANING, and nothing already shipped moved.
 *
 * Two jobs, and the second is the one that keeps this honest:
 *
 *  1. The spellings a person actually types are understood. Hand-entry landed in the scanner,
 *     so "milligrams", "micrograms", "ounces" now reach the same arithmetic as "mg", "mcg",
 *     "oz". Before canonicalUnit they failed in two different silent ways: state/scanner's
 *     normalize returned null (the nutrient vanished from the hit count and the gap-fill with
 *     no error) and toMg fell through to its mg default (a typed "500 micrograms" credited as
 *     500 MILLIGRAMS — a 1000x overstatement of a dose, rendered as a confident number).
 *
 *  2. Every unit string that exists in the shipped product data converts EXACTLY as it did
 *     before, bit for bit. The legacy expressions are re-stated here as literals and compared
 *     with toBe, not toBeCloseTo: `v * 0.001` and `v / 1000` disagree in the last bit for ~13%
 *     of doubles, which is why core/units keeps three exact ladders instead of one factor.
 *     If that ever collapses into a single multiply, this file goes red.
 *
 * DOM-free and data-free: pure functions over literals.
 */

import { describe, expect, it } from 'vitest';
import { canonicalUnit, massToMcg, massToMg, mgToMass, toMg, unitAbbreviation } from './units.js';

// Awkward for binary floating point (0.1, 0.3, 0.025, 66.7) as well as ordinary label amounts.
// Kept to ten so the inline-data rule stays satisfied without a fixture file for six numbers.
const VALUES = [0.025, 0.1, 0.3, 0.67, 2.5, 66.7, 100, 500, 924, 9000];

describe('canonicalUnit: how a unit was written vs what it means', () => {
  it('resolves the abbreviations that already ship in the product data', () => {
    expect(canonicalUnit('mg')).toBe('mg');
    expect(canonicalUnit('mcg')).toBe('mcg');
    expect(canonicalUnit('g')).toBe('g');
    expect(canonicalUnit('IU')).toBe('iu');
    expect(canonicalUnit('iu')).toBe('iu');
  });

  it('keeps the suffixed label forms on their own family', () => {
    expect(canonicalUnit('mcg RAE')).toBe('mcg');
    expect(canonicalUnit('mcg DFE')).toBe('mcg');
    expect(canonicalUnit('mg NE')).toBe('mg');
    expect(canonicalUnit('I.U.')).toBe('iu');
  });

  it('understands the long forms a person types by hand', () => {
    for (const s of ['milligram', 'milligrams', 'MILLIGRAMS', ' Milligrams ']) {
      expect(canonicalUnit(s)).toBe('mg');
    }
    for (const s of ['microgram', 'micrograms', 'MICROGRAM', 'ug', 'µg', 'μg']) {
      expect(canonicalUnit(s)).toBe('mcg');
    }
    for (const s of ['gram', 'grams', 'gm']) {
      expect(canonicalUnit(s)).toBe('g');
    }
    for (const s of ['ounce', 'ounces', 'oz']) {
      expect(canonicalUnit(s)).toBe('oz');
    }
    for (const s of ['pound', 'pounds', 'lb', 'lbs']) {
      expect(canonicalUnit(s)).toBe('lb');
    }
    for (const s of ['kilogram', 'kilograms', 'kg']) {
      expect(canonicalUnit(s)).toBe('kg');
    }
    expect(canonicalUnit('international units')).toBe('iu');
  });

  it('★ tests MICRO before MILLI — the 1000x trap', () => {
    // "micrograms" contains "grams" and opens like "milligrams". Resolve it as either and a
    // dose is overstated a thousandfold with nothing on screen to show for it.
    expect(canonicalUnit('micrograms')).toBe('mcg');
    expect(canonicalUnit('micrograms')).not.toBe('mg');
    expect(canonicalUnit('micrograms')).not.toBe('g');
    expect(canonicalUnit('milligrams')).not.toBe('g');
  });

  it('refuses a FLUID ounce — that is a volume, not a mass', () => {
    expect(canonicalUnit('fl oz')).toBeNull();
    expect(canonicalUnit('fluid ounce')).toBeNull();
    expect(canonicalUnit('FL OZ')).toBeNull();
  });

  it('returns null for quantities that are not masses at all', () => {
    for (const s of ['million CFU', 'billion CFU', 'mL', 'ml', '%', '', undefined]) {
      expect(canonicalUnit(s)).toBeNull();
    }
  });
});

describe('unitAbbreviation: what to SHOW, which is not always what it means', () => {
  it('rewrites a single-word long form to its abbreviation', () => {
    expect(unitAbbreviation('milligrams')).toBe('mg');
    expect(unitAbbreviation('MICROGRAM')).toBe('mcg');
    expect(unitAbbreviation('ounces')).toBe('oz');
  });

  it('never rewrites a qualified unit — RAE is a distinction worth keeping', () => {
    expect(unitAbbreviation('mcg RAE')).toBeNull();
    expect(unitAbbreviation('mg NE')).toBeNull();
    expect(unitAbbreviation('million CFU')).toBeNull();
  });
});

describe('toMg reproduces the shipped arithmetic EXACTLY', () => {
  it('mg / mcg / g are bit-for-bit what they were', () => {
    for (const v of VALUES) {
      expect(toMg(v, 'mg')).toEqual({ v, u: 'mg' });
      expect(toMg(v, 'mcg')).toEqual({ v: v / 1000, u: 'mg' });
      expect(toMg(v, 'g')).toEqual({ v: v * 1000, u: 'mg' });
      expect(toMg(v, 'mcg RAE')).toEqual({ v: v / 1000, u: 'mg' });
      expect(toMg(v, 'mg NE')).toEqual({ v, u: 'mg' });
    }
  });

  it('leaves IU as IU without a slug, and converts it with one', () => {
    expect(toMg(400, 'IU')).toEqual({ v: 400, u: 'iu' });
    expect(toMg(400, 'iu', 'vitamin-d')).toEqual({ v: 400 * (0.025 / 1000), u: 'mg' });
  });

  it('an unrecognized unit still falls back to the mg family, as it always has', () => {
    // "million CFU" and "mL" both exist in the product data and both took this path before
    // canonicalUnit existed. Changing that would move numbers on shipped products.
    expect(toMg(5, 'million CFU')).toEqual({ v: 5, u: 'mg' });
    expect(toMg(5, 'mL')).toEqual({ v: 5, u: 'mg' });
    expect(toMg(5, undefined)).toEqual({ v: 5, u: 'mg' });
  });

  it('converts the long forms that used to be swallowed by that fallback', () => {
    expect(toMg(500, 'micrograms')).toEqual({ v: 0.5, u: 'mg' });
    expect(toMg(500, 'milligrams')).toEqual({ v: 500, u: 'mg' });
    expect(toMg(1, 'ounce').v).toBe(28349.523125);
  });
});

describe('the three ladders agree with each other', () => {
  it('mcg base is exactly 1000x the mg base', () => {
    for (const u of ['mcg', 'mg', 'g', 'kg', 'oz', 'lb'] as const) {
      for (const v of VALUES) {
        expect(massToMcg(v, u)).toBeCloseTo(massToMg(v, u) * 1000, 6);
      }
    }
  });

  it('mgToMass is the inverse of massToMg', () => {
    for (const u of ['mcg', 'mg', 'g', 'kg', 'oz', 'lb'] as const) {
      for (const v of VALUES) {
        expect(mgToMass(massToMg(v, u), u)).toBeCloseTo(v, 9);
      }
    }
  });

  it('holds the ounce and pound to their exact legal definitions', () => {
    expect(massToMg(1, 'oz')).toBe(28349.523125); // international avoirdupois ounce
    expect(massToMg(16, 'oz')).toBeCloseTo(massToMg(1, 'lb'), 6); // a pound is 16 ounces
    expect(massToMg(1, 'kg')).toBe(1000000);
  });
});
