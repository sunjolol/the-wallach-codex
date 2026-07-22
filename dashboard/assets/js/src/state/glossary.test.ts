import { describe, expect, it } from 'vitest';
import { glossaryDef, glossaryRegex } from './glossary.js';

// Pins the separator-insensitive glossary matcher (Luneth 2026-07-22). The "Age Beater" gloss must
// fire whether the running text writes it singular, plural, spaced, or HYPHENATED — the hyphen form
// ("Age-Beater", how the full answer read) was the live bug that never lit the dotted underline.
describe('glossary matcher - separator insensitivity', () => {
  const forms = ['Age Beaters', 'Age Beater', 'Age-Beater', 'age-beaters', 'Age  Beater'];

  it('resolves every space / hyphen / plural surface form to the SAME definition', () => {
    const defs = forms.map(f => glossaryDef(f));
    expect(defs.every(d => d !== null)).toBe(true);
    expect(new Set(defs).size).toBe(1);
  });

  it('the built regex matches the hyphenated form inside running text', () => {
    const re = glossaryRegex();
    expect(re).not.toBeNull();
    const m = (re as RegExp).exec('the secret of the five "Age-Beater" cultures');
    expect(m).not.toBeNull();
    expect((m as RegExpExecArray)[0].toLowerCase().replace(/[\s-]+/g, ' ')).toBe('age beater');
  });

  it('does not resolve a non-term', () => {
    expect(glossaryDef('definitely not a glossary term at all')).toBeNull();
  });
});
