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
/**
 * Author-only inline emphasis: *phrase* -> <em>phrase</em>. Runs on ALREADY-ESCAPED text, so the
 * only markup it introduces is the <em> it controls and the inner phrase stays escaped (§00.B #5).
 * Opt-in via glossify's `emph` flag — OFF for corpus verbatims, so a literal asterisk in a quote is
 * never reinterpreted. Emphasis around a GLOSS term is not supported (it lives in the gaps between
 * gloss spans); the only current use is a non-glossed word ("before").
 */
function emphasize(escaped: string): string {
  return escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

export function glossify(raw: string, emph = false): string {
  // Every gap segment is HTML-escaped; when emph is on it is ALSO run through emphasize (which only
  // adds <em> around already-escaped text). emph defaults off, so every existing caller — including
  // corpus verbatims — is byte-unchanged.
  const esc = (s: string): string => (emph ? emphasize(escHTML(s)) : escHTML(s));
  const re = glossaryRegex();
  if (re === null) {
    return esc(raw);
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
    out += esc(raw.slice(last, m.index));
    out += `<span class="gloss" tabindex="0" role="button" aria-label="${escHTML(word)}: ${escHTML(def)}" data-def="${escHTML(def)}">${escHTML(word)}</span>`;
    last = m.index + word.length;
  }
  out += esc(raw.slice(last));
  return out;
}
