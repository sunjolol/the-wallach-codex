/**
 * state/copy.ts — read boundary for the VIEW-prose content store (Phase H0)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Surfaces dashboard/assets/data/view-copy.json to the views: the claim-kind and
 * search-facet display-label maps + generic UI chrome copy. The single home for
 * view prose (Charter R4) — a view imports a label by id here, never inlines it.
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
 * locked colour language (redesign blueprint §6) — the ONE place a view learns a
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
