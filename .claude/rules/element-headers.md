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

## ★★★ Rule 0 — ONLY FOUR THINGS ARE FIXED. The rest is not a template. (Luneth 2026-07-30)
He rejected **eight** calcium mockups across two rounds for one reason, and it outranks every other
rule in this file:

> "you keep following the same structure/template. There's no way 3 minerals in a row fit cleanly as
> an illustration > into a 1-2-3 point > into a big number statement > into a wallach quote — as the
> BEST way to display all of these… stop constraining yourself under this template which I've
> explicitly told you to avoid over and over."

**The ONLY fixed parts of an element header:**
1. The **opening statement** (the `lede` above "At a glance").
2. **"why this number?"** (the daily-target provenance tip).
3. The **width** — it must match the element detail screen exactly.
4. The **background colour / main content box** — because it leads into the Best Youngevity
   sources block.

**Everything else in the main block adapts to the content and the claims.** The number of sections,
whether there are beats at all, whether there is a big stat number, whether there is a pull quote,
what the illustration is, and the ORDER of all of it — all of that is a per-element design decision.
A header with no beats, or two figures and no quote, or a quote first, or nothing but an annotated
illustration, are all legitimate if that is what the element's material wants.

### ✔ THE SCHEMA WAS THE TEMPLATE — fixed 2026-07-30, a composed shape now exists
The diagnosis, kept because it is the WHY: this file had said "bespoke, not stamped from a template"
since it was written and it did not help, because **the data structure only permitted one shape.**
`MechanismSchema` REQUIRED `eyebrow` · `kill` · `figure` · `figure_alt` · `beats[]` · `quote_claim`
— that mandatory set *is* the rejected chassis — and everything that looked like design freedom
(`hook` · `split` · `bridge` · `figure_pre_beats` · `figure_post_beats` · `beats_layout` · `coda` ·
`stat`) was an OPTIONAL EXTRA bolted onto it, emitted by `renderMechanism` in ONE hard-coded order.
So "compose it bespoke from the optional blocks" could only ever produce the same skeleton wearing
new clothes. No amount of prose here could have fixed that.

**A mechanism entry now takes either of two shapes:**

- **LEGACY** — the fixed skeleton. Selenium, copper and zinc are this shape, are signed off, and
  render byte-for-byte what they always did. Do not build a new header this way.
- **COMPOSED** — `{slug, facet, blocks:[…]}`: an ORDERED, self-describing list. Each entry declares
  its own `type`, NOTHING is required, and the sequence is whatever the element's material wants.
  The vocabulary: `eyebrow` · `kill` · `opener` (figure + line + pivot) · `figure` · `prose`
  (`tone: bridge|coda`) · `split` · `beats` (`items[]`, `layout: stack|row`) · `stat` · `quote`.
  An entry may carry no beats, no stat, no quote, the quote first, two figures and nothing else, or
  nothing but an annotated illustration.

A `figure` block names its own `width` from a CLOSED set (`mech` 600px · `fork` 700px · `rail` 660px)
and it is REQUIRED — because a width override that loses the cascade renders at the 560px base and
silently shrinks every label in the figure (Rule 2's trap). A typo is now a loud parse failure.

**Adding a new block type = one literal in `MechBlockSchema` + one case in `renderMechBlocks`.**
`mechanism_blocks_wellformed` REDDENS if you add one without the other, in either direction: a
data-driven dispatch fails SILENTLY, so an undispatched type would just render nothing.

So designing an element header now starts from its content and lets the shape follow. What is
unchanged: four genuinely distinct mockups, not four variations of one idea — and the chassis is no
longer the path of least resistance, but it is still reachable, so do not drift back into it.

## ★ Rule 1 — mock up inside the REAL container, never a bespoke sheet
A header does not live on a blank page. It renders inside the tan `.kd-ep-fam` box
(`--ds-paper-deep`), tinted by the element's category accent.

**Two different widths, and confusing them silently mis-scales every label (measured 2026-07-30):**
the `.kd-ep` detail screen is ~867px, but `.kd-ep-fam` has `clientWidth` **865px** and carries
`padding: var(--ds-space-5)` (24px a side), so the real ceiling for a FIGURE is **817px**. A figure
authored at 820 rendered at scale 0.996 and quietly taxed every label in it. Prefer the two shipped
slots, which are exact and need no new CSS: `--fork` = **700px**, `--rail` = **660px**.
*(This line previously read "a measured 867px content width" with no distinction — that number is the
outer screen, not the figure box.)*

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

**A CEILING, NOT A FLOOR.** 17.6px is the maximum, not the required value. Zinc's glyph sits in a
smaller node than copper's and was cramped at 17.6, so it ships at **14.6px** via a
`--sm` modifier — and `figure_type_within_standard` stays green, because it only fires on
`px > 17.6`. Do not "restore" a smaller glyph to 17.6 thinking it has drifted.

**The same cascade trap bites font-size too.** That `--sm` modifier had to be declared as
`#drawer-knowledge-mount .kd-ep-fam__gglyph--sm`; a bare-class rule loses to the ID-scoped base
rule and the size silently does not change. Any override of a `kd-ep-fam__*` property needs
matching specificity, not just width.

**A THIRD invisible-in-source trap (2026-07-30): an SVG `fill="…"` presentation attribute LOSES
to any CSS class rule.** A white glyph written `<text class="kd-ep-fam__gglyph" fill="#fff">` over an
accent shape rendered accent-on-accent — invisible. Use `style="fill:#fff"`. This shipped twice on one
page before a screenshot caught it.

**Gated:** `figure_type_within_standard` (source side) + the per-element render probe (rendered
side: scale == 1, and a pairwise bounding-box collision check over every `<text>`).
**Probe gap found 2026-07-30:** a text-vs-text collision check is blind to a label painted BEFORE an
opaque shape that covers it — it renders truncated and every check stays green. Add a paint-order
occlusion check, intersect each shape against its nearest `clip-path` ancestor (a clipped-away shape
still reports a full bounding box, which over-fires), and ship it with a negative control proving the
detector fires ([[negative-control-or-it-proves-nothing]]).

## ★ Rule 7 — grep the class name before you claim it, and keep a regression pass
Two failures, both from the zinc header, both invisible on the element's own page:

1. **A reused class name silently restyles the shipped headers.** The new opener row was first
   named `.kd-ep-fam__hook` — which **already exists** as the per-beat payoff line. Both rules are
   ID-scoped, mine landed later in the file, so it turned selenium's and copper's beat hooks into a
   380px grid with a bottom border. **Zinc's page looked perfect.** Only the copper/selenium
   regression checks in the probe caught it. `grep -c 'kd-ep-fam__<name>'` before naming anything.
2. **Containment must be structural.** Zinc's white nail tip overshot the nail bed; insetting the
   coordinates was not enough. The fix is a `clipPath` per nail with the outline stroked **last**,
   so overshoot is impossible rather than merely unlikely — Rule 4 applied to fills.

So: every per-element probe **keeps its regression pass on the already-shipped elements**, and that
pass asserts the shipped headers did NOT gain the new block (`!cu.hook && cu.coda === ''`), not just
that they still render.

## ★ Rule 8 — a request for "slightly clearer" is not a licence to redesign
Luneth asked for small clarity tweaks to zinc's illustration; it came back as a total redraw and he
rejected it ("MUCH worse... the previous was wayyyy better. I only wanted SLIGHT changes"). The same
turn, the beat prose had grown to five lines each and he stopped reading it altogether ("so long now
I don't even want to read them... no one will dive into walls of text that big").

- **Change the labels before the geometry.** Zinc's figure was fixed by editing four text labels and
  nothing else — `GENES ACTIVATED` (which names nothing a reader can picture) became
  `each bar is one gene` → `THE INSTRUCTIONS GET READ`, and `still there, all of them` →
  `NOTHING CAN READ THEM`. That was the whole fix.
- **Beat prose ceiling: 2 sentences.** More than that and it does not get read, however good it is.
  Padding is worse than brevity — cut the filler list, keep the claim.
- Memory: [[measured-change-not-extremes]].

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
- **Composition** — the `blocks[]` vocabulary in `core/schemas/mechanism-clarity.ts`
  (`MechBlockSchema`), rendered in the declared order by `views/entity-page.ts::renderMechBlocks`.
  A `split` side's evidence is either a claim quote or a `field{total,columns,bands[]}` proportion
  figure. Compose from the existing types before adding one; adding one means a schema literal AND
  a render case, together, or `mechanism_blocks_wellformed` reddens.
- **Figures** — dispatch on a **generic key**, never a slug (`entity_render_is_projection`).
  Live: `rancidity` · `cofactor_fork` · `decline_rail` · `reversal_rail` · `nail_spots` ·
  `metal_fingers`. A key the dispatch does not know renders '' — gated by
  `mechanism_blocks_wellformed`.
- **CSS** — the `kd-ep-fam__*` vocabulary in `drawer-knowledge.css`. Reuse before adding.
- **Probe** — copy `tools/render_probe_copper.js` (47 checks) per element. It must include a
  **regression pass on a previously-shipped element**: the optional blocks make it easy to change
  shared code and not notice.

## Enforcement
- **LIVE:** `element_header_complete` · `figure_type_within_standard` ·
  `mechanism_blocks_wellformed` (negative tests: `tools/test_element_header_complete.py`,
  `tools/test_figure_type_within_standard.py`, `tools/test_mechanism_blocks_wellformed.py`) ·
  `views_no_inline_prose` · `entity_render_is_projection` · `view_category_not_hardcoded` ·
  per-element render probes · `tools/render_probe_mech_shape.js` (every signed-off header renders
  BYTE-IDENTICAL to `tools/goldens/mechanism-sections.json`, with a negative control proving the
  byte comparison fires).
- **Discipline (WISH, R7):** rules 1, 3, 4 and 5 — container fidelity, measured placement,
  alignment construction, and narrative cohesion — rest on review and Luneth's visual sign-off. No
  machine check can tell a cohesive story from a stitched one. The STOP-for-sign-off gate IS the
  control.
