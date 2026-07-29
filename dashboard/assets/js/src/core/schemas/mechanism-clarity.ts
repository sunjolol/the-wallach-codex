/**
 * core/schemas/mechanism-clarity.ts — the MECHANISM explainer prose-store schema.
 * ═══════════════════════════════════════════════════════════════════════════
 * Narrows the hand-authored dashboard/assets/data/mechanism-clarity-data.json — the per-element
 * "how it works" hero (selenium's rancidity mechanism is the first instance). A plain-language
 * GLOSS of Wallach's OWN sealed claims: each beat's `traces` are provenance-only (never rendered),
 * and his exact words + the stat figure are pulled BY CLAIM ID at render (never hand-typed
 * verbatim, R3). Keyed as an ARRAY (built into a Map by .map) so no id-keyed literal — the entity
 * page stays a pure projection (entity_render_is_projection). Mirrors fatty-acid-clarity.ts.
 *
 * OPTIONAL COMPOSITION BLOCKS (added 2026-07-29 for copper's header). Each element's header is
 * designed bespoke to that element's content, so a mechanism may carry extra sections beyond the
 * selenium shape: a two-column `split`, a connective `bridge` line, and figures in the slots
 * before/after the beats. EVERY one is optional and self-suppresses, so selenium's entry is
 * untouched and renders byte-identically. In-figure LABELS live here too (`labels`), never as
 * view literals — views_no_inline_prose (R4) puts every user-facing string in this store.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { z } from 'zod';

const MechStatSchema = z.object({
  value: z.string(),
  readout: z.string(),
  label: z.string(),
  claim: z.string(),
}).passthrough();

const MechBeatSchema = z.object({
  n: z.string(),
  title: z.string(),
  text: z.string(),
  // `hook` is the selenium-era editorial payoff line; a beat that carries none omits it.
  hook: z.string().optional(),
  traces: z.array(z.string()),
  // Marks the beat where the story TURNS (deficiency -> remedy). Semantic, not a colour:
  // the stylesheet decides that a turn beat reads in the category accent.
  turn: z.boolean().optional(),
}).passthrough();

/** A figure slot: which GENERIC figure to draw (never a slug), its alt text, and the
 *  in-figure labels. Labels are content, so they live here rather than in the view. */
const MechFigureSchema = z.object({
  key: z.string(),
  alt: z.string(),
  labels: z.record(z.string(), z.string()),
}).passthrough();

/** One band of a proportion field — `count` of `total` marks drawn with `key`'s styling.
 *  A band with a non-empty `label` also prints a legend row. */
const MechFieldBandSchema = z.object({
  key: z.string(),
  count: z.number(),
  label: z.string(),
}).passthrough();

/** A proportion field: `total` marks in `columns` columns, partitioned by `bands`
 *  (any remainder renders as the neutral rest). The picture IS the number. Its heading
 *  is the side's `evidence_caption`, so both sides of a split caption identically. */
const MechFieldSchema = z.object({
  total: z.number(),
  columns: z.number(),
  bands: z.array(MechFieldBandSchema),
}).passthrough();

/** One side of the two-column split: heading, prose, and at most ONE piece of evidence —
 *  either a sealed-claim quote (BY ID, never hand-typed verbatim — R3) or a field. */
const MechSideSchema = z.object({
  head: z.string(),
  text: z.string(),
  evidence_caption: z.string().optional(),
  quote_claim: z.string().optional(),
  field: MechFieldSchema.optional(),
}).passthrough();

const MechSplitSchema = z.object({
  left: MechSideSchema,
  right: MechSideSchema,
}).passthrough();

const MechanismSchema = z.object({
  slug: z.string(),
  facet: z.string(),
  eyebrow: z.string(),
  kill: z.string(),
  figure: z.string(),
  figure_alt: z.string(),
  figure_labels: z.record(z.string(), z.string()).optional(),
  split: MechSplitSchema.optional(),
  bridge: z.string().optional(),
  figure_pre_beats: MechFigureSchema.optional(),
  beats: z.array(MechBeatSchema),
  // 'row' lays the beats out as side-by-side columns; absent = the selenium stack.
  beats_layout: z.string().optional(),
  figure_post_beats: MechFigureSchema.optional(),
  quote_claim: z.string(),
  highlight: z.string().optional(),
  stat: MechStatSchema.optional(),
}).passthrough();

export const MechanismClaritySchema = z.object({
  disclaimer: z.string(),
  mechanisms: z.array(MechanismSchema),
}).passthrough();

// Only the types the view actually consumes are exported — an unused alias is dead code
// (no_new_dead_code catches it). A figure slot flows through renderMechanism inline.
export type MechField = z.infer<typeof MechFieldSchema>;
export type MechSide = z.infer<typeof MechSideSchema>;
