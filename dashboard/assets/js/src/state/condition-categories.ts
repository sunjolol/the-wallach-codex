/**
 * state/condition-categories.ts — read boundary for the condition→category curation
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Surfaces dashboard/assets/data/condition-categories.json to the Conditions tab:
 * each condition's body-system CATEGORY (label + colour) for the coloured card.
 * Inlined at build via esbuild JSON import and validated ONCE through the Zod
 * boundary; a bad/absent store reads as empty so a card falls back to no category
 * (graceful, never `undefined`).
 *
 * Pure reads only. Editorial ORGANISATION, not a Wallach claim/number — no §00.A
 * obligation. The 502 assignments are a curation layer (Luneth-approved 2026-07-22),
 * refined over time; a wrong category mis-colours a card, it never mis-states a fact.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import categoriesData from '../../../data/condition-categories.json';
import { type ConditionCategories, ConditionCategoriesSchema } from '../core/schemas/index.js';

const EMPTY: ConditionCategories = { categories: {}, conditions: {} };

let cached: ConditionCategories | null = null;

/** Parse + cache once (bad/absent data → empty; cards then show no category chip). */
function store(): ConditionCategories {
  if (cached === null) {
    const parsed = ConditionCategoriesSchema.safeParse(categoriesData);
    cached = parsed.success ? parsed.data : EMPTY;
  }
  return cached;
}

/** A resolved category: its slug + human label + display colour. */
export interface ConditionCategory {
  slug: string;
  label: string;
  color: string;
  /** Inner SVG markup for the category glyph (author-vetted; '' when the curation carries none). */
  icon: string;
}

/**
 * The body-system category (label + colour) for a condition slug, or null when the
 * condition is unmapped or its category id is unknown — graceful, the card then
 * shows no category chip and inherits the app accent instead of a category colour.
 */
export function conditionCategory(slug: string): ConditionCategory | null {
  const s = store();
  const catId = s.conditions[slug];
  if (catId === undefined) {
    return null;
  }
  const def = s.categories[catId];
  if (def === undefined) {
    return null;
  }
  return { slug: catId, label: def.label, color: def.color, icon: def.icon ?? '' };
}
