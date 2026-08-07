# Vitamin-D header regression — post-mortem

> 2026-08-07. Why the Vitamin-D element header missed ~5–6 times despite clear direction, and
> what was changed so the next header starts clean. Written by Claude at Luneth's request; his
> hypothesis ("you accumulated new design rules that caused this again") is confirmed.

## The ask

Delete the rejected header demos (keep only the 5–7 he liked), and **inspect the rules / memories
/ skills for whatever caused the repeated Vitamin-D miss** — apply the clear fixes, flag the rest.

## What actually happened

The element-headers work went **minerals → vitamins**. The minerals (Copper, Zinc, Calcium,
Magnesium, 2026-07-29 → 07-31) shipped, but each was a slog (copper "3 rejections, a whole
session"; calcium "8 mockups across 2 rounds"). Vitamin A took **7 rounds**. Vitamin D then ran
r1 (08-01) → r2 (08-05, expanded to A–G) → r3 (08-05) and was abandoned, not shipped.

- **r1 (08-01):** four *static SVG line-diagrams* — a gauge bar, a convergence funnel, a
  transformation line, another convergence — all with ~12px mono labels and the same skeleton
  (eyebrow → kill-line → prose → one static SVG → quote). Four variations of one idea.
- **r3 (08-05):** genuinely better in one panel — panel A is a real **canvas animation** (a
  day→night sky that advances as you hover the six "doctor's orders," from design-wisdom ref
  #021). But panels **B, C, D, E reverted to static SVG diagrams** with 10.5–12px labels. Every
  panel's CSS carried the same line: *"No faces, no station diagrams, no plain charts (all
  previously rejected)."* — design-by-avoidance.

His own verdicts (`chronicle/demo-revamp-brief.md`, 2026-08-05) rhyme across the whole batch:
*"boring and uninformative," "walls of text, not scannable," "reads like boomer material,"
"presented poorly in a basic ugly way,"* and for Vitamin D: *"the one vitamin that could carry
beautiful sun imagery, and there is NOTHING. Go crazy with sun / sunlight / beach / skin — fun
(but adult, through solid modern design)."*

So the miss was **not** ignorance of the direction. r3 answered the *content* (all sun) but only
1 of 5 panels hit the *form* bar. Something kept pulling the figures back to small static diagrams.

## Root cause (confirmed)

On **2026-08-03** a doctrine sweep rewrote the rules: *"112 KB of always-loaded rules → 5 KB +
ten on-demand skills."* The `element-headers` **skill** was liberated in that sweep — it now says
*"you are not limited to static SVG… animation, interaction, real imagery, canvas… all
encouraged,"* and *"measure label widths"* with **no type ceiling**.

But the sweep touched the **skill**, not the **memory files**. ~10 header memories load **every
single turn** via `MEMORY.md`; several still encoded the pre-liberation static-minimalist regime
as hard rules:

- `element-header-playbook`: *"Type: selenium is the CEILING — labels 12.0px, glyph 17.6px…
  never invent a bigger scale"* (a static-SVG type ceiling) **and** *"Copy
  temporary/copper-header-combined.html"* (start each header by copying the last static one — the
  literal transmission mechanism; you can see `vd-glyph 17.6px / vd-label 12px` carried straight
  into the Vitamin-D demos).
- `element-header-illustration-failure-modes`: *"the four failure modes… are now hard
  constraints… budget simplicity BEFORE designing — one figure, ≤8 labels… take the one with
  fewer marks"* — minimalism-by-mandate, the opposite of "go crazy," and it produced
  design-by-avoidance.
- `measured-change-not-extremes`: *"undershoot / cut / measured"* — correct for **refining** an
  existing artifact, but it bled into **fresh** concept work and made first swings timid.

**The mechanism:** a skill and the memories are two hand-maintained homes for the same doctrine
(a §00.B single-source violation, in the operating layer). When they disagree, *frequency wins* —
memory is in context every message, the skill only when the work matches. Liberating the skill
while leaving the memories intact changed nothing in practice, and read as done. The minerals
succeeded *through* this drag (many rejections + heavy hand-holding); Vitamin D is simply where
the drag became undeniable.

## Fixes applied (2026-08-07)

1. **`element-header-playbook`** — removed the "12.0px / 17.6px, never bigger" type ceiling
   (there is no fixed ceiling; the medium dictates) and the "copy the last header" start
   (generate the shell via `mockup_harness.py`, don't copy a prior static header).
2. **`element-header-illustration-failure-modes`** — reframed from "hard constraints / fewest
   marks" to the skill's own "diagnosed CAUSES, not banned shapes," and added the positive bar
   (beautiful · modern · engaging · adult; go crazy where the material wants it).
3. **`measured-change-not-extremes`** — scoped explicitly to *refinement*; first concepts must be
   ambitious, not timid.
4. **New memory `always-loaded-memory-overrides-on-demand-skill`** — the durable meta-lesson, so
   this class of failure is caught next time: when you change doctrine in a skill, reconcile the
   memories in the same pass, and prefer thin memories that point at the skill over ones that
   restate its rules.
5. **`MEMORY.md`** — index hooks reframed to match, and tightened (zero-loss).

## Flagged — not applied (your call)

- **Consolidate the header doctrine into the skill.** Five memories
  (`element-header-playbook`, `-illustration-failure-modes`, `-only-four-things-fixed`,
  `header-mockups-in-real-container`, `visual-design-bar-and-principles`) restate what the skill
  already covers. They should become thin pointers, with the skill the single source. This is a
  deliberate refactor, not a quick edit.
- **The `figure.width` closed enum (mech/fork/rail) in `core/schemas/mechanism-clarity.ts`.**
  A closed 3-width set for figures is a code-level static-diagram assumption (r3 broke out to
  817px by hand). Worth revisiting when a header wants a non-standard figure — but it's a schema
  change touching gates, so left for you.
- **A one-line addition to the skill** making the anti-patterns explicit (no fixed label ceiling;
  don't design by avoidance; don't copy a prior header's figure vocabulary). The skill is already
  liberated; this only reinforces it.
- **`MEMORY.md` is near the soft compaction threshold (~19.6KB).** Tightened zero-loss here;
  a real reduction wants a supervised `/consolidate-memory` pass (merge/drop), not unsupervised.

## Deletion record

73 rejected header files (the 29-set first-pass batch + all Vitamin-D rounds + all intermediate
rounds of the kept headers + build scripts) were **moved**, not hard-deleted, to
`temporary/_purged-2026-08-07/`. `temporary/` is git-ignored, so a plain delete would have been
unrecoverable; the archive is the recovery window. Say the word and I'll hard-purge it.

**Kept (final file of each, per your pick of 7):** Calcium v5 · Copper combined · Zinc B3 ·
Magnesium r5 · Vitamin A r7 · Vitamin C r2 · Vitamin E. The workbench index
(`temporary/demo-index.html`) was regenerated — no dead links, the 7 keepers remain.
