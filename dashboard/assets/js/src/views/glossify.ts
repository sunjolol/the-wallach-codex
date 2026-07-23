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
 * Escape-per-segment (§00.B #5): the matcher runs against the RAW text, NOT a
 * pre-escaped copy — so a term carrying an apostrophe or quote (e.g. "Wallach's
 * Fibrous Dysplasia") can match at all; when the scan ran on escaped text the ' had
 * already become &#39; and such a term could never fire. Every emitted piece — each
 * gap, the matched word, and the definition attributes — is then HTML-escaped
 * individually, so no author-controlled HTML ever reaches innerHTML.
 * ═════════════════════════════════════════════════════════════════
 */

import { glossaryDef, glossaryRegex } from '../state/glossary.js';

function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] as string));
}

/**
 * Wrap the FIRST occurrence of each glossary term in a `.gloss` tooltip span (dotted
 * underline; hover/tap shows the plain definition via the shared gloss-tooltip). The
 * scan runs on the RAW string; each gap and the matched word are HTML-escaped as they
 * are emitted. First-occurrence-per-block keeps a paragraph from becoming a field of
 * dotted words.
 */
export function glossify(raw: string): string {
  const re = glossaryRegex();
  if (re === null) {
    return escHTML(raw);
  }
  const seen = new Set<string>();
  let out = '';
  let last = 0;
  for (let m = re.exec(raw); m !== null; m = re.exec(raw)) {
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
    out += escHTML(raw.slice(last, m.index));
    out += `<span class="gloss" tabindex="0" role="button" aria-label="${escHTML(word)}: ${escHTML(def)}" data-def="${escHTML(def)}">${escHTML(word)}</span>`;
    last = m.index + word.length;
  }
  out += escHTML(raw.slice(last));
  return out;
}
