/**
 * state/copy.ts — read boundary for the VIEW-prose content store
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Surfaces dashboard/assets/data/view-copy.json to the views: the claim-kind and
 * search-facet display-label maps + generic UI chrome copy. The single home for
 * view prose — a view imports a label by id here, never inlines it.
 *
 * The offline file:// app cannot fetch(), so the store is inlined at build via
 * esbuild JSON import and validated ONCE through the Zod boundary; a bad/absent
 * store reads as empty and every accessor degrades to a safe fallback (the
 * slug-transform label, or an empty string) so a view never renders `undefined`.
 *
 * Pure reads only. View copy is authored UI text, never a Wallach claim/number, so
 * this module carries no §00.A obligation.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import copyData from '../../../data/view-copy.json';
import { type ViewCopy, ViewCopySchema } from '../core/schemas/index.js';

const EMPTY: ViewCopy = { kind_labels: {}, kind_categories: {}, facet_labels: {}, ui: {} };

let cached: ViewCopy | null = null;

/** Parse + cache once (bad/absent data → empty; accessors fall back gracefully). */
function data(): ViewCopy {
  if (cached === null) {
    const parsed = ViewCopySchema.safeParse(copyData);
    cached = parsed.success ? parsed.data : EMPTY;
  }
  return cached;
}

/** Slug → UPPERCASE SPACED, the graceful fallback for an unmapped kind/facet. */
function slugLabel(slug: string): string {
  return slug.replace(/[_-]+/g, ' ').toUpperCase();
}

/** Uppercase display label for a claim.kind; falls back to the slug transform. */
export function kindLabel(kind: string): string {
  return data().kind_labels[kind] ?? slugLabel(kind);
}

/**
 * Colour-category family for a claim.kind (green/teal/amber/orange/violet/red), the
 * locked colour language — the ONE place a view learns a
 * claim's colour, so a view never hardcodes a family literal (view_category_not_hardcoded).
 * Falls back to '' (no family, a neutral card) for an unmapped kind; the map is TOTAL over
 * the sealed kinds (claim_category_mapping_total), so the fallback is unreachable in practice.
 */
export function kindCategory(kind: string): string {
  return data().kind_categories[kind] ?? '';
}

/** Uppercase section header for a search facet; falls back to the slug transform. */
export function facetLabel(facet: string): string {
  return data().facet_labels[facet] ?? slugLabel(facet);
}

/** Generic UI chrome copy by id; empty string if missing (never `undefined`). */
export function ui(id: string): string {
  return data().ui[id] ?? '';
}

/**
 * The ONE place the phone breakpoint is written for a COPY decision.
 *
 * mobile.css owns the same number for layout; this is the text half of it, and it is a
 * constant rather than a second hand-typed `(max-width: 767px)` at each call site. A view
 * reads it — `matchMedia(PHONE_MEDIA).matches` — because a view may touch the browser and this
 * module may not: state/copy.ts is a pure read boundary over the prose store.
 */
export const PHONE_MEDIA = '(max-width: 767px)';

/**
 * UI copy for a control that has to fit a PHONE as well as a desktop.
 *
 * Returns `<id>_narrow` when the caller says the viewport is narrow AND that key exists;
 * otherwise the ordinary string. CSS cannot do this — a `placeholder` is an ATTRIBUTE, not
 * rendered text, so no amount of `text-overflow` reaches it and a long one is simply cut
 * mid-word by the input's own box. MEASURED at 375px: the Ask-Wallach box showed
 * "Ask about a nutrient, food," of "Ask about a nutrient, food, condition, or symptom…", and
 * the Knowledge hero stopped at "osteoporosis", o. Reported 2026-08-28.
 *
 * ★ FALLING BACK TO THE LONG STRING IS THE POINT. A missing `_narrow` key means a slightly
 * clipped placeholder, never an EMPTY one — so adding a control here can never blank the copy
 * on a phone by forgetting a key, and the two strings stay optional rather than paired.
 * A placeholder is read at RENDER, so a rotation mid-session keeps the string it was built
 * with until that view repaints. Both callers repaint often; neither is worth a resize listener.
 */
export function uiNarrow(id: string, narrow: boolean): string {
  if (narrow) {
    const short = data().ui[`${id}_narrow`];
    if (short !== undefined && short !== '') {
      return short;
    }
  }
  return ui(id);
}
