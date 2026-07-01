/**
 * views/search-highlight.ts — live search-term highlighting for the Knowledge drawer
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * A warm flat "marker swipe" (<mark class="kd-search-hl">) over every occurrence
 * of the active query inside the elements the caller passes — scoped by
 * views/knowledge.ts::applyKnowledgeSearch to what's ON SCREEN (the visible rows
 * + any open deep-view), never the hidden rows. Pure DOM text-wrap: no re-render,
 * no SVG filter (the textured .ds-mark is for a few static author marks; this
 * paints live across many matches, so it stays a cheap flat background — Luneth
 * ruled lightweight, SESSION 35). Cleared + reapplied in place each keystroke.
 *
 * Layer `views`; imports nothing of ours (generic DOM utilities).
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** The class marking a live search highlight (styled in drawer-knowledge.css). */
const KD_HL_CLASS = 'kd-search-hl';

/** Unwrap every existing highlight mark back to plain text — restore before re-highlight. */
export function clearSearchHighlights(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>(`mark.${KD_HL_CLASS}`).forEach((m) => {
    const parent = m.parentNode;
    if (parent !== null) {
      parent.replaceChild(document.createTextNode(m.textContent ?? ''), m);
      parent.normalize();
    }
  });
}

/**
 * Wrap every occurrence of `needle` (already lowercased) in one text node with
 * <mark class="kd-search-hl">, splitting the node into a fragment of text + marks
 * so only the matched runs are wrapped.
 */
function wrapTextMatches(textNode: Text, needle: string): void {
  const text = textNode.nodeValue ?? '';
  const lower = text.toLowerCase();
  const frag = document.createDocumentFragment();
  let from = 0;
  let idx = lower.indexOf(needle, from);
  while (idx !== -1) {
    if (idx > from) {
      frag.appendChild(document.createTextNode(text.slice(from, idx)));
    }
    const mark = document.createElement('mark');
    mark.className = KD_HL_CLASS;
    mark.textContent = text.slice(idx, idx + needle.length);
    frag.appendChild(mark);
    from = idx + needle.length;
    idx = lower.indexOf(needle, from);
  }
  if (from < text.length) {
    frag.appendChild(document.createTextNode(text.slice(from)));
  }
  textNode.parentNode?.replaceChild(frag, textNode);
}

/**
 * Highlight every occurrence of `needle` within `el`'s visible text. Collects the
 * target text nodes first (mutating mid-walk is unsafe), skipping nodes already
 * inside a highlight mark. The caller scopes `el` to on-screen elements only.
 */
export function highlightMatchesIn(el: HTMLElement, needle: string): void {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const targets: Text[] = [];
  let node: Node | null = walker.nextNode();
  while (node !== null) {
    const t = node as Text;
    const parent = t.parentElement;
    if (parent !== null
      && parent.closest(`mark.${KD_HL_CLASS}`) === null
      && (t.nodeValue ?? '').toLowerCase().includes(needle)) {
      targets.push(t);
    }
    node = walker.nextNode();
  }
  for (const t of targets) {
    wrapTextMatches(t, needle);
  }
}
