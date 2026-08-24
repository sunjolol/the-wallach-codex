/**
 * views/pager.ts — the shared numbered/arrow pager
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Lifted OUT of views/foods-block.ts unchanged when the Regimen product list needed the same
 * control (owner ruling, 2026-08-24: "still shows 3 at a time, add pagination same as foods").
 * Copying ninety lines of DOM building would have put one shape in two hand-maintained places
 * and guaranteed they drift — Charter R1. The foods surface is design-signed-off, so the
 * extraction changes nothing it emits: same classes, same glyphs, same window arithmetic, same
 * aria. `render_probe_food_pager.js` is what proves that rather than this sentence.
 *
 * ★ THE ONLY PARAMETER THAT MATTERS IS `dataAttr`. Each caller's delegated click handler reads
 * its own dataset key off the button — `foodPage` on the foods grid, `recPage` on the regimen
 * products — so one pager can serve two lists without either one stealing the other's clicks.
 *
 * ★ THE CALLER OWNS THE PAGE. This module holds no state. The views re-render from their own
 * cascades, so a page index kept here would be a second source of truth the next repaint
 * silently discarded.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { ui } from '../state/copy.js';

/** The pager's two arrows. Single glyphs, so they inherit the mono face like the numbers. */
const PAGER_PREV = '‹';
const PAGER_NEXT = '›';
/** What stands between two page numbers that are not neighbours. */
const PAGER_GAP = '…';
/**
 * How many page numbers the moving window holds.
 *
 * ★ THE WINDOW STARTS AT THE CURRENT PAGE, it does not centre on it — the owner's shape,
 * 2026-08-22: "1 2 3 4 5 … 64" on page one, and "1 … 20 21 22 23 24 … 64" on page twenty.
 * It only slides backwards when the end of the list would otherwise cut it short, so the
 * last page reads "1 … 60 61 62 63 64" instead of a lonely "1 … 64".
 */
const PAGER_WINDOW = 5;

export interface PagerSpec {
  page: number;
  pages: number;
  /**
   * `arrows` on Coverage, whose list is short and bounded by what may still be added;
   * `numbers` in the Regimen console, where the reader can jump straight to a page.
   */
  kind: 'arrows' | 'numbers';
  /** The dataset key the caller's click handler reads — e.g. 'foodPage', 'recPage'. */
  dataAttr: string;
}

function pagerButton(label: string, page: number, disabled: boolean, dataAttr: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.className = 'fs-pager__b';
  b.type = 'button';
  b.textContent = label;
  b.dataset[dataAttr] = String(page);
  b.disabled = disabled;
  return b;
}

/**
 * Which page numbers the numbered pager lists, in order — a `null` is an ellipsis.
 *
 * The first and last pages are ALWAYS listed, because they are the two a reader reaches for
 * without counting; everything else is the window described at PAGER_WINDOW. An ellipsis is
 * emitted only where the numbers on either side of it are genuinely not neighbours, so the
 * pager never prints "1 … 2" — a gap mark over no gap is chrome that lies.
 */
export function windowedPages(page: number, pages: number): (number | null)[] {
  const last = pages - 1;
  const start = Math.max(0, Math.min(page, last - (PAGER_WINDOW - 1)));
  const end = Math.min(last, start + PAGER_WINDOW - 1);
  const out: (number | null)[] = [0];
  if (start > 1) {
    out.push(null);
  }
  for (let i = Math.max(start, 1); i <= Math.min(end, last - 1); i += 1) {
    out.push(i);
  }
  if (end < last - 1) {
    out.push(null);
  }
  if (last > 0) {
    out.push(last);
  }
  return out;
}

function pagerGap(): HTMLElement {
  const gap = document.createElement('span');
  gap.className = 'fs-pager__gap';
  gap.textContent = PAGER_GAP;
  gap.setAttribute('aria-hidden', 'true');
  return gap;
}

function arrow(label: string, page: number, disabled: boolean, aria: string, dataAttr: string): HTMLButtonElement {
  const b = pagerButton(label, page, disabled, dataAttr);
  b.classList.add('fs-pager__b--arrow');
  b.setAttribute('aria-label', aria);
  return b;
}

/**
 * The pager, or null when there is nothing to page to.
 *
 * ★ NEVER PAINTED OVER A SINGLE PAGE. A pager is a claim that more exists; rendering one
 * for a one-page list is that claim made falsely, and either list is one page whenever a
 * filter narrows the pool to a handful.
 */
export function pagerNode(p: PagerSpec): HTMLElement | null {
  if (p.pages < 2) {
    return null;
  }
  const nav = document.createElement('nav');
  // The modifier is what lets the Regimen console size its pager up without touching
  // Coverage's (owner, 2026-08-22: "only for the regimen tab, coverage stays the same").
  // Scoping that off `.fs-controls` instead would tie a control's SIZE to whether a
  // filter happens to sit beside it, which is a coincidence, not a reason.
  nav.className = `fs-pager fs-pager--${p.kind}`;
  nav.setAttribute('aria-label', ui('fs_pager_label'));
  const prev = arrow(PAGER_PREV, p.page - 1, p.page <= 0, ui('fs_pager_prev'), p.dataAttr);
  const next = arrow(PAGER_NEXT, p.page + 1, p.page >= p.pages - 1, ui('fs_pager_next'), p.dataAttr);
  if (p.kind === 'arrows') {
    // The readout is what makes the arrows honest: without it a disabled arrow is the only
    // signal that the list has ended, and the reader cannot tell how far it went.
    const at = document.createElement('span');
    at.className = 'fs-pager__at';
    at.textContent = `${p.page + 1} / ${p.pages}`;
    nav.append(prev, at, next);
    return nav;
  }
  nav.appendChild(prev);
  for (const i of windowedPages(p.page, p.pages)) {
    if (i === null) {
      nav.appendChild(pagerGap());
      continue;
    }
    const b = pagerButton(String(i + 1), i, false, p.dataAttr);
    b.setAttribute('aria-label', ui('fs_pager_page').replace('{n}', String(i + 1)).replace('{of}', String(p.pages)));
    if (i === p.page) {
      b.setAttribute('aria-current', 'page');
    }
    nav.appendChild(b);
  }
  nav.appendChild(next);
  return nav;
}
