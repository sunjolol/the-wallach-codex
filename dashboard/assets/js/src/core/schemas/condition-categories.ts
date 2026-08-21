/**
 * core/schemas/condition-categories.ts — the condition→body-system category schema
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Validates dashboard/assets/data/condition-categories.json — the hand-authored
 * curation layer that tags each Wallach condition with a body-system CATEGORY
 * (label + display colour), so the Conditions tab can colour-code + label every
 * card. Consumed via state/condition-categories.ts (esbuild JSON import + parse at
 * load, same pattern as home-curation / view-copy); a bad/absent store degrades to
 * empty so a card simply shows no category chip rather than throwing.
 *
 * Editorial ORGANISATION, NOT a Wallach fact — no dose, no number, no claim — so it
 * carries no §00.A obligation. The category is navigation/context colour only.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { z } from 'zod';

/** One body-system category: its human label + display colour (hex). */
export const ConditionCategoryDefSchema = z.object({
  label: z.string(),
  color: z.string(),
  /** Inner SVG markup for the body-system glyph (author-vetted; rendered stroke=--cat). Optional so pre-icon data degrades to no glyph. */
  icon: z.string().optional(),
});

/** Root shape of condition-categories.json. */
export const ConditionCategoriesSchema = z.object({
  /** category-id → { label, color, icon }. */
  categories: z.record(z.string(), ConditionCategoryDefSchema),
  /** condition-slug → category-id. */
  conditions: z.record(z.string(), z.string()),
});
export type ConditionCategories = z.infer<typeof ConditionCategoriesSchema>;
