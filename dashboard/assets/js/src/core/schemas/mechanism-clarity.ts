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
 * TWO SHAPES live here, and the second one is the whole point (2026-07-30):
 *   • LEGACY — `MechanismSchema`. A fixed skeleton plus optional extras, emitted by
 *     renderMechanism in ONE hard-coded order. Selenium, copper and zinc are this shape and are
 *     signed off; the legacy schema and its render path are deliberately UNCHANGED.
 *   • COMPOSED — `MechComposedSchema`. An ORDERED, self-describing `blocks` list: the entry names
 *     its own blocks in its own sequence and may omit ANY of them.
 *
 * WHY the composed shape exists: the legacy REQUIRED set (eyebrow · kill · figure · figure_alt ·
 * beats · quote_claim) IS the chassis eight calcium mockups were rejected for — "you keep following
 * the same structure/template… stop constraining yourself under this template" (Luneth 2026-07-30,
 * now Rule 0 in .claude/rules/element-headers.md). Everything that LOOKED like design freedom —
 * hook, split, bridge, the two figure slots, coda, stat — was an optional extra bolted onto that one
 * skeleton, and the renderer fixed their order, so a "bespoke" header could only ever wear different
 * clothes on the same body. Playbook prose could not fix that: the STRUCTURE had to be able to say a
 * different shape. A composed entry can carry no beats, no stat, no quote, the quote first, or
 * nothing but an annotated figure.
 *
 * What stays fixed is only what Rule 0 fixes, and NONE of it lives in the block list: the opening
 * lede and the why-this-number line live in entity-copy.json, and the width + the tan content box +
 * the Best-Youngevity-sources dock are the frame renderMechanism emits AROUND the blocks.
 *
 * In-figure LABELS live here too (`labels`), never as view literals — views_no_inline_prose (R4)
 * puts every user-facing string in this store.
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
  // An optional CTA button (calcium's "After" beat -> the absorption tab). `tab` is a
  // data-kd-tab target the knowledge-drawer tab handler already switches on; `label` is prose.
  cta: z.object({ label: z.string(), tab: z.string() }).passthrough().optional(),
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
  // A TRIMMED literal quote: the card DISPLAYS quote_trim (a contiguous slice of quote_claim's
  // sealed verbatim -- gated by mech_quote_trim_faithful, so it can only TRIM Wallach, never
  // fabricate) while the cite still composes from quote_claim's book_id (R3). Lets a card stop the
  // quote before a trailing sentence (calcium drops "The normal range is 9-10.8 mg") WITHOUT
  // re-sealing the claim, so the full verbatim stays intact everywhere else it is used.
  quote_trim: z.string().optional(),
  field: MechFieldSchema.optional(),
  // A prose evidence card. ALONE it renders as plain prose. PAIRED with quote_claim (and no
  // quote_trim) it is a SOURCED PARAPHRASE — our tightened summary of that claim, shown in the quote
  // style with the claim's composed cite so a reader can trace it, but NOT a verbatim quote (no
  // quote marks; faithfulness human-reviewed, not gated — Luneth's ruling 2026-07-30). Mutually
  // exclusive with quote_trim, which is the gated-verbatim path.
  note: z.string().optional(),
}).passthrough();

const MechSplitSchema = z.object({
  left: MechSideSchema,
  right: MechSideSchema,
}).passthrough();

/** The HOOK: a small figure plus two short lines that open the block on something the reader
 *  can check on their own body before the mechanism is explained (zinc's white nail spots are
 *  the first instance). Optional, so every earlier entry renders unchanged. */
const MechHookSchema = z.object({
  figure: MechFigureSchema,
  text: z.string(),
  pivot: z.string(),
}).passthrough();

const MechanismSchema = z.object({
  slug: z.string(),
  facet: z.string(),
  eyebrow: z.string(),
  kill: z.string(),
  hook: MechHookSchema.optional(),
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
  // The CODA: one closing line that returns the block to whatever its hook opened on, so an
  // opening the reader checked on themselves is paid off rather than abandoned.
  coda: z.string().optional(),
  quote_claim: z.string(),
  highlight: z.string().optional(),
  stat: MechStatSchema.optional(),
}).passthrough();

// ── THE COMPOSED SHAPE: an ordered, self-describing block list ────────────────────────────────
// Each block declares its OWN type, so the data — not the renderer — decides which blocks exist
// and in what order. Every type below maps 1:1 onto a unit the renderer already draws: this patch
// frees the ORDER and the SELECTION, it does not invent new visual vocabulary (that is a per-element
// design decision Luneth picks, and a new type is then one case in the block dispatch).

/** The figure width slot. REQUIRED and CLOSED on purpose (R9 codification of a trap that cost two
 *  rounds): the base rule `#drawer-knowledge-mount .kd-ep-fam__figure { max-width: 560px }` is an
 *  ID selector, so a figure with no matching-specificity width override silently renders at 560px
 *  — scale < 1, and every label inside is quietly shrunk with nothing wrong in the source. Naming
 *  the slot from a closed set means a typo is a LOUD parse failure instead. Values are the shipped
 *  modifiers in drawer-knowledge.css: --mech 600px · --fork 700px · --rail 660px. A new width needs
 *  a new CSS modifier AND an entry here, in the same patch. */
const MechFigureWidthSchema = z.enum(['mech', 'fork', 'rail']);

/** One card of the two-column COMPARE block (vitamin A's β-carotene vs retinol trade-off). Carries
 *  its own kicker, a big form-name label (optionally struck through, with a `star`/`tick` marker),
 *  a fine caption, and PRO then CON rows — each an editorial `lead` + `body`. All strings are prose
 *  (R4): they live here in data, never in the view. Chip colour (green/rust) is depictive and lives
 *  in the stylesheet, not as a per-card literal. */
const MechCompareCardSchema = z.object({
  kicker: z.string(),
  big: z.object({
    text: z.string(),
    struck: z.boolean().optional(),
    mark: z.enum(['star', 'tick']).optional(),
  }).passthrough(),
  fine: z.string(),
  accent: z.boolean().optional(),
  pros: z.array(z.object({ lead: z.string(), body: z.string() }).passthrough()),
  cons: z.array(z.object({ lead: z.string(), body: z.string() }).passthrough()),
}).passthrough();

const MechBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('eyebrow'), text: z.string() }).passthrough(),
  z.object({ type: z.literal('kill'), text: z.string() }).passthrough(),
  // The opener/hook: a figure plus an opening line and a pivot line.
  MechHookSchema.extend({ type: z.literal('opener') }),
  // A figure on its own row. `turn` adds the accent spacing the post-beats slot used.
  z.object({
    type: z.literal('figure'),
    figure: MechFigureSchema,
    width: MechFigureWidthSchema,
    turn: z.boolean().optional(),
  }).passthrough(),
  // One connective paragraph. `tone` picks the shipped class — a bridge INTO what follows, or a
  // coda that closes the block. Required: the two read differently, so defaulting would guess.
  z.object({
    type: z.literal('prose'),
    text: z.string(),
    tone: z.enum(['bridge', 'coda']),
  }).passthrough(),
  MechSplitSchema.extend({ type: z.literal('split') }),
  // The numbered steps. `items` rather than `beats` so a block never shadows the legacy field.
  z.object({
    type: z.literal('beats'),
    items: z.array(MechBeatSchema),
    layout: z.enum(['stack', 'row']).optional(),
    // Opt-in to big Unbounded step numerals (magnesium's cycle). Scoped, so other headers keep
    // their existing mono numbers.
    bignum: z.boolean().optional(),
  }).passthrough(),
  MechStatSchema.extend({ type: z.literal('stat') }),
  // The pull quote, BY CLAIM ID (R3) — `highlight` is the phrase .ds-mark emphasises.
  z.object({
    type: z.literal('quote'),
    claim: z.string(),
    // A faithful contiguous slice of the sealed verbatim (gated by mech_quote_trim_faithful, now
    // extended to composed quote blocks) so a standalone pull-quote can stop before a trailing
    // sentence while the cite still composes from `claim` (R3). Trims Wallach, never fabricates.
    trim: z.string().optional(),
    // Opt-in to a larger pull-quote (a short quote can read bigger). Scoped; other quotes unchanged.
    big: z.boolean().optional(),
    highlight: z.string().optional(),
  }).passthrough(),
  // The two-column COMPARE block — two trade-off cards side by side (vitamin A #6, 2026-08-01).
  z.object({
    type: z.literal('compare'),
    left: MechCompareCardSchema,
    right: MechCompareCardSchema,
  }).passthrough(),
  // A titled EXPLAIN callout — a mono section label plus one accent-bordered paragraph. `text` may
  // carry the controlled inline <b>/<em> the compare/curio bodies use.
  z.object({
    type: z.literal('explain'),
    label: z.string(),
    text: z.string(),
  }).passthrough(),
  // A "did you know?" CURIO box — its own eyebrow, a display headline, a prose body (inline
  // <b>/<em> allowed), and a composed cite line.
  z.object({
    type: z.literal('curio'),
    eyebrow: z.string(),
    head: z.string(),
    body: z.string(),
    cite: z.string(),
  }).passthrough(),
]);

/** A composed entry. `slug` + `facet` are the only non-block fields, and `blocks` must be
 *  non-empty — an entry that renders nothing is a bug, not a design. Nothing else is required:
 *  there is deliberately no minimum shape, because a minimum shape is how the chassis got in. */
const MechComposedSchema = z.object({
  slug: z.string(),
  facet: z.string(),
  blocks: z.array(MechBlockSchema).min(1),
  // Opt-in to the card treatment (calcium): the renderer adds `kd-ep-fam--cards` to the section and
  // the stylesheet restyles THIS entry's split cells + beat steps as tinted cards. Scoped so the
  // signed-off legacy headers (which never carry this field) render visually unchanged.
  cards: z.boolean().optional(),
  // Opt-in to a per-header scoping modifier `kd-ep-fam--<variant>` on the section, so a header can
  // tighten a SHARED class (vitamin A adjusts .kd-ep-fam__eyebrow/__kill) without disturbing the
  // signed-off headers. Same containment pattern as `cards`.
  variant: z.string().optional(),
}).passthrough();

export const MechanismClaritySchema = z.object({
  disclaimer: z.string(),
  // COMPOSED IS TRIED FIRST, and the order is load-bearing: a legacy entry carries no `blocks`, so
  // it fails the composed member and falls through to the untouched legacy schema. A composed entry
  // matches on its first try. A composed entry with a bad block (unknown `type`, missing `width`)
  // fails BOTH members and throws at module load — loud, which is the point.
  mechanisms: z.array(z.union([MechComposedSchema, MechanismSchema])),
}).passthrough();

// Only the types the view actually consumes are exported — an unused alias is dead code
// (no_new_dead_code catches it). A figure slot flows through renderMechanism inline.
export type MechField = z.infer<typeof MechFieldSchema>;
export type MechSide = z.infer<typeof MechSideSchema>;
export type MechBlock = z.infer<typeof MechBlockSchema>;
export type MechCompareCard = z.infer<typeof MechCompareCardSchema>;
export type MechLegacy = z.infer<typeof MechanismSchema>;
export type MechComposed = z.infer<typeof MechComposedSchema>;

/** Which shape an entry is. A bare `'blocks' in m` CANNOT narrow this union: every member is
 *  `.passthrough()`, which infers an index signature, so TypeScript considers any key present on
 *  both members and the check discriminates nothing. A type predicate narrows explicitly — and it
 *  tests the ARRAY rather than the key, so a malformed `blocks: null` reads as legacy instead of
 *  crashing the block walk. */
export function isComposedMech(m: MechLegacy | MechComposed): m is MechComposed {
  return Array.isArray((m as MechComposed).blocks);
}
// A single beat, shared by the legacy `beats` field and the composed `beats` block, so both render
// paths hand the SAME shape to the one beats emitter (no second copy of the step markup).
export type MechBeat = z.infer<typeof MechBeatSchema>;
