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
  /**
   * Canon essential slug — the join key for GOAL MEMBERSHIP (goals carry slugs, tiles
   * render display names, and the two DIVERGE for 16 of 91: canon `vitamin-c` renders
   * `ASCORBIC ACID`). Derived from canon, never hand-typed. A name-based join here
   * silently dropped every vitamin from every goal once already.
   */
  slug: z.string().min(1),
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
  /**
   * Stable identity, present only where a subsection is addressable as a WHOLE — today just
   * `plant-derived`, which a goal may name via `LayoutGoal.groups`. Optional because the
   * other subsections are pure chrome with nothing to bind to; matching on `label` or `rank`
   * instead would make a display string ("PLANT DERIVED") load-bearing.
   */
  id: z.string().optional(),
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
 * A goal ring/definition (stronger bones, less joint pain, …).
 *
 * `members` = the canon essential slugs this goal highlights. STILL NO `total`, and the
 * distinction is the whole doctrine: MEMBERSHIP is what you LOOK AT; a TOTAL is what you
 * are MEASURED AGAINST. A goal may change the first and may never change the second — the
 * denominator is always 90. So `members.length` must never be rendered as a fraction
 * ("bone 3/14" asserts that bone health IS 14 things, which inverts Wallach's thesis that
 * you need all 90 regardless). The old `total` was six hand-typed unsourced numbers no view
 * read, riding the derive into a MANIFEST-gated artifact so `derived_artifacts_fresh`
 * certified fabricated data as "fresh" (R8). It is deleted, not optional.
 *
 * WHERE THESE COME FROM (2026-07-16, the live Coverage build):
 * - `id`/`name`/`conditions` are CURATION, hand-authored in coverage-layout-skeleton.json.
 *   Ours, explicitly not a Wallach claim — he enumerates no "goals". Luneth authors the real
 *   set; the 14 shipped today are a placeholder he rewrites (the machinery does not change).
 * - `members` is DERIVED, never hand-stored (R3): coverage_layout_derive.py intersects the
 *   sealed claims against each goal's Catalog condition slugs. The goal SET is ours; the
 *   MEMBERSHIP is Wallach's.
 * ! Supersedes this comment's old prediction that membership "will live in
 *   eden/catalog/goals.json, gated by references_resolve". It does not: the Catalog is a
 *   SEALED pillar, so a goals file there needs a seal sign-off per write-discipline rule 6,
 *   and the goal list is editorial curation that Luneth re-authors freely — sealing it would
 *   make every edit a ceremony. The skeleton (hand-authored, MANIFEST-registered, no seal) is
 *   the home; the derive is the gate.
 */
export const LayoutGoalSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Sealed-Catalog condition slugs. The derive hard-fails on one that does not resolve. */
  conditions: z.array(z.string()).min(1),
  /** Canon essential slugs, derived. The derive hard-fails on a goal with zero. */
  members: z.array(z.string()).min(1),
  /**
   * Subsection ids this goal names AS A WHOLE — today only `plant-derived`. Derived, never
   * hand-stored: coverage_layout_derive.py emits it when a sealed claim whose OWN VERBATIM
   * says "colloidal minerals" maps one of the goal's conditions (9 of the 14 today).
   *
   * ★ WHY A GROUP AND NOT 34 MEMBERS (Luneth's ruling, 2026-07-16): the plant-derived 34 have
   * no individual Wallach amount and share ONE verdict off the colloidal-mineral bottle, so a
   * ring on strontium is a to-do nobody can act on — they stay OUT of `members`
   * (EXCLUDE_PLANT_DERIVED). But Wallach prescribes the COMPLEX by name for these conditions,
   * and the group is one thing you CAN do. One member, one marker. Ringing all 34 would light
   * 37% of the field on 9 of 14 goals and make the goal system read as noise.
   *
   * OMITTED, never empty, on the 5 goals where he never names the complex (more energy,
   * better sleep, blood-sugar, digestion, healthy weight) — an honest gap.
   */
  groups: z.array(z.string()).optional(),
});
export type LayoutGoal = z.infer<typeof LayoutGoalSchema>;

/** Root shape of coverage-layout-data.json. */
export const CoverageLayoutSchema = z.object({
  sections: z.array(LayoutSectionSchema),
  goals: z.array(LayoutGoalSchema),
});
export type CoverageLayout = z.infer<typeof CoverageLayoutSchema>;
