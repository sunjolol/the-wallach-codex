/**
 * views/glossify.ts — the shared claim-text glossifier
 * ═════════════════════════════════════════════════════════════════
 *
 * Wraps the FIRST occurrence of each glossary term in a `.gloss` dotted-underline
 * tooltip span (the definition rides in an escaped data-attribute; the shared
 * gloss-tooltip layer, wired once at boot, shows it on hover/tap). Used by BOTH the
 * Knowledge corpus view and the Search drawer so a reader meets the same explained
 * term everywhere — one implementation, no duplication (§00.B single-source).
 *
 * Escape-first (§00.B #5): the matched text is already HTML-escaped and the definition
 * rides in an escaped attribute, so no author-controlled HTML ever reaches innerHTML.
 * ═════════════════════════════════════════════════════════════════
 */

import { glossaryDef, glossaryRegex } from '../state/glossary.js';

function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] as string));
}

/**
 * Escape `raw`, then wrap the FIRST occurrence of each glossary term in a `.gloss`
 * tooltip span (dotted underline; hover/tap shows the plain definition via the shared
 * gloss-tooltip). First-occurrence-per-block keeps a paragraph from becoming a field
 * of dotted words.
 */
export function glossify(raw: string): string {
  const esc = escHTML(raw);
  const re = glossaryRegex();
  if (re === null) {
    return esc;
  }
  const seen = new Set<string>();
  let out = '';
  let last = 0;
  for (let m = re.exec(esc); m !== null; m = re.exec(esc)) {
    const word = m[0];
    const key = word.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    const def = glossaryDef(key);
    if (def === null) {
      continue;
    }
    seen.add(key);
    out += esc.slice(last, m.index);
    out += `<span class="gloss" tabindex="0" role="button" aria-label="${escHTML(word)}: ${escHTML(def)}" data-def="${escHTML(def)}">${word}</span>`;
    last = m.index + word.length;
  }
  out += esc.slice(last);
  return out;
}
