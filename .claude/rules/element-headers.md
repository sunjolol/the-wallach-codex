# Element headers — the per-essential design playbook

_Read BEFORE building or mocking up any element header. Written 2026-07-29 after copper's header
took a full session and three rejections that were all avoidable. Every rule below is a mistake that
was actually made; the point of this file is that the next 89 elements go fast._

## Pattern
Each of the 90 essentials gets its own illustrative header — the block between "At a glance" and
"Worth knowing" — designed **bespoke to that element's content**, not stamped from a template. The
process is fixed even though the design is not, and the fixed parts are written down here so no
session re-derives them.

## The workflow (Luneth's, locked in)
1. Build **4 genuinely distinct mockups** — different layout AND different illustration, each
   bespoke to that element's material. Not four variations of one idea, and not the selenium
   eyebrow → 3-beats → quote chassis wearing new copy.
2. **Luneth picks** one, or a mix. He drives; this is the part he enjoys.
3. Build the winner into the live entity page.
4. **STOP for his visual sign-off** before logging or committing (`visual-verification.md`).

## ★ Rule 1 — mock up inside the REAL container, never a bespoke sheet
A header does not live on a blank page. It renders inside the tan `.kd-ep-fam` box
(`--ds-paper-deep`) at a **measured 867px** content width, tinted by the element's category accent.

Build the mockup shell by reproducing the live DOM ancestry and loading the app's real stylesheets:

```
#drawer-knowledge-mount.kd-open > .kd-body > .kd-essential-deep.kd-ep[data-category="…"]
```

Override **only** position/overflow to put it back in document flow — never width, padding, border
or box-sizing, or the geometry stops being the real geometry. Working example:
`temporary/copper-header-combined.html`. Copy that shell.

_Why it is rule 1: four mockups were authored as standalone WHITE full-width pages and rejected on
sight — "all of these are white backgrounds and won't look right if ported." The container's colour
and width are hard constraints, not details._

## ★ Rule 2 — figure type is the SELENIUM standard, and selenium is the CEILING
Measured off the shipped selenium figure: **labels 12.0px, element glyph 17.6px.** Match them. Do
not derive a "better" scale — one was invented (15/17/18/32) and rejected immediately.

**Author every figure at scale 1** — `viewBox` width == the figure's CSS `max-width` — so a declared
px is a screen px.

**The trap that actually causes "the text is too small":** the base rule is
`#drawer-knowledge-mount .kd-ep-fam__figure { max-width: 560px }` — an **ID selector**. A bare-class
width override loses the cascade, so an 800-unit viewBox renders at 560px: **scale 0.70, and every
label inside is silently 30% smaller.** Nothing in the source looks wrong. Write the override at
matching specificity:
`#drawer-knowledge-mount .kd-ep-fam__figure.<modifier> { max-width: …px; }`

**Gated:** `figure_type_within_standard` (source side) + the per-element render probe (rendered
side: scale == 1, and a pairwise bounding-box collision check over every `<text>`).

## ★ Rule 3 — measure label widths, never estimate them
The display face is far wider than a chars × guess: "STRUCTURE GOES" measured **197px** against a
~140px estimate, and collided twice. Render headless, read
`getBoundingClientRect().width / scale`, then place from the measurement. Budget every adjacent gap
before rendering.

## ★ Rule 4 — alignment is a CONSTRUCTION, not a nudge
- Two columns whose content differs in length → a **2×N grid** (all prose cells, then all evidence
  cells), so the evidence row top-aligns by construction. A flex column with `margin-top: auto`
  does **not** fix this — it only moves the dead space inside the shorter column.
- A figure with two tracks (a decline and a return) → both span the **same** x-range, and every
  centred caption sits on **one** centre axis.
- A marker with no sub-caption among markers that have one → shift its baseline to the optical
  centre of their two-line block, or it floats.

## ★ Rule 5 — one arc, no seams, no meta
The block is a single story, not two designs stitched together. When merging picks:
- **One** eyebrow and **one** kill for the whole block.
- Carry the turn with a **connective sentence**, not a divider.
- **Never** print scaffolding the reader can't interpret — a `—— 02 ——` movement bar shipped once
  and read as "inside info leaking out."
- Order the argument: make the problem real → offer the solution, and close on the resolution.
- If a mechanism is the point (e.g. what reverses a deficiency), make it **explicit** — a named,
  emphasised label a skim-reader lands on. Implicit-everywhere/explicit-nowhere is a defect.

## ★ Rule 6 — every header ships a COMPLETE entity-copy entry
`dashboard/assets/data/entity-copy.json` has two fields and both are required:
- **`lede`** — the opening line, what the element IS, above "At a glance". It must not restate the
  header's opening beat.
- **`why`** — the why-this-number provenance behind the daily target, derived from the documented
  transform chain in `essentials-targets-data.json` (source claim → upper-of-range → IU factor →
  ×1.54 → round-2sf). Match the calcium/selenium/copper voice.

A half-filled entry is **invisible from the page** — copper shipped with `why` and no `lede`, and
before that the `why` was missing entirely because the store held only two elements.

**Gated:** `element_header_complete` (critical). **Scope, honestly:** it binds on elements that HAVE
a header, not all 91 — the rest have no entry yet and gating them would redden work not yet started.
**WISH (R7):** the remaining essentials still need entries; that is a real gap, not a covered one.

## Where things live
- **Copy** — ALL of it, including every in-figure label — `mechanism-clarity-data.json`
  (`views_no_inline_prose` / R4). The view holds no user-facing string.
- **Numbers + quotes** — pulled BY CLAIM ID at render (R3). Never hand-typed verbatim.
- **Composition** — the optional schema blocks in `core/schemas/mechanism-clarity.ts`:
  `figure_labels` · `split{left,right}` (2×2 grid; evidence = a claim quote OR a
  `field{total,columns,bands[]}` proportion figure) · `bridge` · `figure_pre_beats` /
  `figure_post_beats` · `beats_layout` · `beat.turn`. All optional and self-suppressing — compose
  from these before adding to the schema.
- **Figures** — dispatch on a **generic key**, never a slug (`entity_render_is_projection`).
  Live: `rancidity` · `cofactor_fork` · `decline_rail` · `reversal_rail`.
- **CSS** — the `kd-ep-fam__*` vocabulary in `drawer-knowledge.css`. Reuse before adding.
- **Probe** — copy `tools/render_probe_copper.js` (47 checks) per element. It must include a
  **regression pass on a previously-shipped element**: the optional blocks make it easy to change
  shared code and not notice.

## Enforcement
- **LIVE:** `element_header_complete` · `figure_type_within_standard` (negative tests:
  `tools/test_element_header_complete.py`, `tools/test_figure_type_within_standard.py`) ·
  `views_no_inline_prose` · `entity_render_is_projection` · `view_category_not_hardcoded` ·
  per-element render probes.
- **Discipline (WISH, R7):** rules 1, 3, 4 and 5 — container fidelity, measured placement,
  alignment construction, and narrative cohesion — rest on review and Luneth's visual sign-off. No
  machine check can tell a cohesive story from a stitched one. The STOP-for-sign-off gate IS the
  control.
