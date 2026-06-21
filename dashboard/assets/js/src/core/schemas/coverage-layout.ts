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
});
export type LayoutTile = z.infer<typeof LayoutTileSchema>;

/** A labelled run of tiles inside a section (minerals: foundational/major/rare). */
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

/** A goal ring/definition (bone, cognition, longevity, …). */
export const LayoutGoalSchema = z.object({
  id: z.string(),
  name: z.string(),
  total: z.number(),
});
export type LayoutGoal = z.infer<typeof LayoutGoalSchema>;

/** Root shape of coverage-layout-data.json. */
export const CoverageLayoutSchema = z.object({
  sections: z.array(LayoutSectionSchema),
  goals: z.array(LayoutGoalSchema),
});
export type CoverageLayout = z.infer<typeof CoverageLayoutSchema>;
