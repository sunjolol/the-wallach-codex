/**
 * state/glossary.ts — read boundary for the plain-language term glossary
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Surfaces dashboard/assets/data/glossary.json to the views so the Knowledge-drawer
 * tooltip layer can explain any medical/technical term. The offline file:// app
 * cannot fetch(), so the glossary is inlined at build via esbuild JSON import and
 * validated ONCE through the Zod boundary; a bad/absent glossary reads as empty so
 * the drawer degrades gracefully (terms simply render un-decorated).
 *
 * Pure reads only. The definitions are plain-language reference, never a Wallach
 * claim or number (the glossary_wellformed invariant forbids digits), so this
 * module carries no §00.A obligation.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import glossaryData from '../../../data/glossary.json';
import { type Glossary, GlossarySchema } from '../core/schemas/index.js';

const EMPTY: Glossary = { terms: [] };

interface GlossIndex {
  /** Matches any glossary key: word-start boundary + non-word-char end (longest-first). */
  re: RegExp | null;
  /** Lowercased term/alias → plain-language definition. */
  defByKey: Map<string, string>;
}

let cached: GlossIndex | null = null;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Canonical form of a glossary key / matched surface form: lower-cased, curly apostrophes
 *  folded to a straight ', and every whitespace-or-hyphen run collapsed to ONE space (Luneth
 *  2026-07-22). Stored keys AND lookup keys pass through this, so "Age-Beater", "Age  Beater"
 *  and "age beater" — and both apostrophe forms of an eponym — all resolve to one entry. */
function normKey(s: string): string {
  return s.toLowerCase().replace(/[‘’]/g, '\'').replace(/[\s-]+/g, ' ').trim();
}

/** A regex source for one (already normalized) key whose internal spaces match a space OR a
 *  hyphen, so a key stored as "age beater" also matches the text "Age-Beater". Each word is
 *  regex-escaped; a [\s-]+ bridge rejoins them. A single-word / symbol key is just its escape.
 *  A straight apostrophe in a word is widened to also match either curly form, so an eponym like
 *  "Wallach's Fibrous Dysplasia" glosses whichever apostrophe the running text happens to use. */
function keyToPattern(normalizedKey: string): string {
  return normalizedKey.split(' ').map(w => escapeRegExp(w).replace(/'/g, '[\'’‘]')).join('[\\s\\-]+');
}

/** Build the match index once (bad/absent data → empty; drawer degrades). */
function index(): GlossIndex {
  if (cached === null) {
    const parsed = GlossarySchema.safeParse(glossaryData);
    const g = parsed.success ? parsed.data : EMPTY;
    const defByKey = new Map<string, string>();
    for (const e of g.terms) {
      defByKey.set(normKey(e.term), e.plain);
      for (const a of e.aliases ?? []) {
        defByKey.set(normKey(a), e.plain);
      }
    }
    // Longest key first so the alternation prefers the most specific term.
    const keys = [...defByKey.keys()].sort((a, b) => b.length - a.length);
    // Leading \b anchors the start; a trailing (?!\w), not \b, ends the match, so
    // symbol-terminated unit keys ("mg%", "g%") also fire. For a word-ending key this is
    // identical to \b; but after "%" a \b would backwards demand a following word char, so
    // a "%"-key could otherwise never match. memory: term-gloss-standard (units layer).
    // keyToPattern makes each key separator-insensitive so "age beater" also matches the
    // hyphenated "Age-Beater" — the live bug where the full answer's dashed form never glossed.
    const re = keys.length > 0
      ? new RegExp(`\\b(${keys.map(keyToPattern).join('|')})(?!\\w)`, 'gi')
      : null;
    cached = { re, defByKey };
  }
  return cached;
}

/**
 * A FRESH global matcher for glossary terms (fresh so the caller's `lastIndex`
 * scan state is never shared), or null when the glossary is empty.
 */
export function glossaryRegex(): RegExp | null {
  const re = index().re;
  return re === null ? null : new RegExp(re.source, re.flags);
}

/** Plain-language definition for a matched key or surface form (case- and separator-insensitive),
 *  or null. The key is normalized (lower-case, [\s-] runs -> one space) so "Age-Beater" resolves to
 *  the stored "age beater" entry — the same normalization the stored keys pass through. */
export function glossaryDef(key: string): string | null {
  return index().defByKey.get(normKey(key)) ?? null;
}
