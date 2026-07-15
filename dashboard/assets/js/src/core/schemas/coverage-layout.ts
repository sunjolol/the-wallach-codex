/**
 * core/schemas/coverage-layout.ts — periodic-table layout schema
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Validates dashboard/assets/data/coverage-layout-data.json — the v3.2
 * periodic-table-of-essentials PRESENTATION layout (section grouping, atomic
 * numbers, symbols, display abbreviations). This is display metadata, not the
 * Wallach targets DB (that lives in essentials-targets-data.json and is the
 * user's to maintain). §00.B: this data was relocated out of views/coverage.ts
 * (the 91 hardcoded tile specs) into assets/data/ behind this schema.
 *
 * Coverage STATUS (covered / fillPercent) does NOT live here — it is joined in
 * at render time from the CoverageSnapshot (state/coverage.ts), keeping one
 * source of truth for the live numbers.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { z } from 'zod';

/** One tile. Display fields vary by section; all optional except name. */
export const LayoutTileSchema = z.object({
  /**
   * Canonical essential name — the join key into the CoverageSnapshot
   * (state/coverage.ts). Equals the `name` field in essentials-targets-data.json.
   * Display fields below (name/sym/letter/abbr) are abbreviated chrome; `key` is
   * the stable identity used to look up live status.
   */
  key: z.string().min(1),
  /** Atomic number (minerals). */
  num: z.number().optional(),
  /** Chemical symbol (minerals). */
  sym: z.string().optional(),
  /** Vitamin letter code (e.g. "B12"). */
  letter: z.string().optional(),
  /** Amino three-letter abbreviation (e.g. "Arg"). */
  abbr: z.string().optional(),
  /** Section sequence code (e.g. "V·01", "AA·03", "F·02"). */
  code: z.string().optional(),
  /** Display name (abbreviated, uppercase). */
  name: z.string().min(1),
  /** Optional sub-hint line (fatty acids). */
  hint: z.string().optional(),
  /**
   * Essential vs non-essential per Wallach's "90 Essential Nutrients" framing.
   * Absent/true = one of the 90 essentials. `false` marks a nutrient the body
   * can synthesize — shown for completeness + coverage, but NOT counted toward
   * the 90 (e.g. Omega-9 / oleic, included by Youngevity for cardiovascular
   * balance). Source: the sealed essentials-canon (eden/corpus/essentials-canon.json),
   * keyed to Wallach's 90-nutrients graphic (books-only; no lecture/embed source).
   */
  essential: z.boolean().optional(),
});
export type LayoutTile = z.infer<typeof LayoutTileSchema>;

/** A labelled run of tiles inside a section (minerals: foundational/individually-dosed/plant-derived). */
export const LayoutSubsectionSchema = z.object({
  rank: z.string(),
  label: z.string(),
  hint: z.string(),
  tiles: z.array(LayoutTileSchema),
});
export type LayoutSubsection = z.infer<typeof LayoutSubsectionSchema>;

/** A top-level periodic-table section. Holds either subsections or tiles. */
export const LayoutSectionSchema = z.object({
  num: z.string(),
  title: z.string(),
  sub: z.string(),
  gridClass: z.string(),
  tileClass: z.enum(['tile', 'tile--vitamin', 'tile--amino', 'tile--fat']),
  subsections: z.array(LayoutSubsectionSchema).optional(),
  tiles: z.array(LayoutTileSchema).optional(),
});
export type LayoutSection = z.infer<typeof LayoutSectionSchema>;

/**
 * A goal ring/definition (bone, cognition, …).
 *
 * NO `total`. It was six hand-typed, unsourced numbers (14/13/11/12/18/10) that no view
 * ever read — the goal cards that rendered them were deleted 2026-07-14 — yet they rode
 * the derive into the MANIFEST-gated artifact, so `derived_artifacts_fresh` was certifying
 * fabricated data as "fresh" (R8: no poison left behind). They also contradicted the only
 * membership map in the repo (scanner-corpus's nutrientToGoalMap implies 6/6/13/6/3/4).
 *
 * It is DELETED rather than made optional: a per-goal total is a DENOMINATOR, and the rule
 * this surface is now built on forbids one — a goal may change what you LOOK AT, or what
 * you're RECOMMENDED, but never what you're MEASURED AGAINST. The denominator is always 90.
 * Real membership derives from the corpus (`conditions_treated` ∩ a goal's conditions) and
 * will live in eden/catalog/goals.json, gated by references_resolve. It is never stored here.
 */
export const LayoutGoalSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type LayoutGoal = z.infer<typeof LayoutGoalSchema>;

/** Root shape of coverage-layout-data.json. */
export const CoverageLayoutSchema = z.object({
  sections: z.array(LayoutSectionSchema),
  goals: z.array(LayoutGoalSchema),
});
export type CoverageLayout = z.infer<typeof CoverageLayoutSchema>;
