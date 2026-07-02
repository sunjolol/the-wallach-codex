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
  /** Matches any glossary key on a word boundary (longest-first alternation). */
  re: RegExp | null;
  /** Lowercased term/alias → plain-language definition. */
  defByKey: Map<string, string>;
}

let cached: GlossIndex | null = null;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Build the match index once (bad/absent data → empty; drawer degrades). */
function index(): GlossIndex {
  if (cached === null) {
    const parsed = GlossarySchema.safeParse(glossaryData);
    const g = parsed.success ? parsed.data : EMPTY;
    const defByKey = new Map<string, string>();
    for (const e of g.terms) {
      defByKey.set(e.term.toLowerCase(), e.plain);
      for (const a of e.aliases ?? []) {
        defByKey.set(a.toLowerCase(), e.plain);
      }
    }
    // Longest key first so the alternation prefers the most specific term.
    const keys = [...defByKey.keys()].sort((a, b) => b.length - a.length);
    const re = keys.length > 0
      ? new RegExp(`\\b(${keys.map(escapeRegExp).join('|')})\\b`, 'gi')
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

/** Plain-language definition for a matched key (case-insensitive), or null. */
export function glossaryDef(key: string): string | null {
  return index().defByKey.get(key.toLowerCase()) ?? null;
}
