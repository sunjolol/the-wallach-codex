---
name: element-headers
description: Read before designing or building the illustrative header for any of the 90 essentials, or any comparable rich editorial block. Covers what is actually fixed (four things), the container geometry and cascade traps that silently wreck figures, and the failure modes that have been rejected before.
---

# Element headers

Each of the 90 essentials gets its own illustrative header -- the block between "At a glance" and
"Worth knowing" -- designed **bespoke to that element's material**. The process is fixed. The design
is not.

## Only four things are fixed
1. The **opening statement** (the `lede` above "At a glance").
2. **"why this number?"** -- the daily-target provenance line.
3. The **width** -- it matches the element detail screen.
4. The **background / main content box** -- it leads into the Best Youngevity sources block, which
   always sits at the bottom.

**Everything else follows the content.** How many sections, whether there are beats at all, whether
there is a big number, a pull quote, a figure, several figures, or none -- and the order of all of
it -- is a per-element design decision. A header with no beats, or a quote first, or nothing but one
arresting illustration, are all legitimate.

## You are not limited to static SVG
This is the correction that matters most. Earlier headers were static SVG line-art with small text
labels because that was the only vocabulary the guidance described -- not because it was chosen.
**Animation, interaction, real imagery, canvas, scroll-driven and hover-driven behaviour, and
vendored libraries are all available and all encouraged where the material wants them.**

Offline-first means every asset is vendored, pinned, and works forever with the network off. It has
never meant small, static, or plain. The app targets one pinned browser engine, so use modern CSS and
JS directly -- no fallbacks, no polyfills, no defensive coding for browsers that will never load it.

**Start from dashboard/design-wisdom/, every time.** It holds 33 CodePen captures Luneth
personally chose plus 
eferences-data.json carrying his own notes -- a standing statement of his
taste. Their titles are the brief: crazy good animation effect, 3D-feeling effect on a 2D plane, a
liquid thermometer with a movable slider, bold magazine-style, high-end editorial typography,
brutalist high-end, brownian tendrils, plasma sphere, radial wave rays. **Not opening that folder,
and shipping flat static SVG instead, has now caused three rejections** (Vitamin D, B6, manganese r3).

**Never start from a previous header file or its CSS class vocabulary.** Copying the last approved
header's classes carries its 15px/11.5px label sizes and fixed-width SVG into the new one, and that is
how the small-static-diagram idiom propagates. Generate the shell fresh and choose the medium from the
content. There is no fixed type ceiling.

Reach for the form the content deserves. A mineral that accumulates over decades might want a
scrubbable timeline. A deficiency cascade might want a sequence that plays. A comparison might want
real photography. Ask what would make someone *stop scrolling*.

## The process -- unchanged, and it works
1. Build **4 genuinely distinct mockups** -- different layout AND different illustration, each
   bespoke. Not four variations of one idea.
2. **Luneth picks** one, or a mix. He drives this part and he enjoys it.
3. Build the winner into the live entity page -- **only after he approves it. Never build live
   without explicit permission.**
4. **STOP for his visual sign-off** before logging or committing.

Read the dossier first if one exists -- `chronicle/header-research/` holds grounded head-starts for
many of the remaining elements.

**Generate the mockup shell, never hand-build it:**
```bash
python tools/mockup_harness.py --out temporary/<name>-demos.html --category mineral --title "..."
node tools/mockup_measure.js temporary/<name>-demos.html
```
It reads its stylesheet list out of `dashboard.html` so it cannot drift, and reproduces the real
container -- verified at 865px with an 817px figure ceiling. The measure step reports every figure's
authored-vs-rendered scale; anything but 1.000 means the cascade trap below has bitten you. The
vendored libraries are wired into the shell automatically -- see the `design-language` skill.

## Container physics -- these are real, and cheap to respect
Mock up inside the **real container**, never a bespoke white full-width sheet. Four mockups were once
rejected on sight for that alone. Reproduce the live ancestry and load the app's real stylesheets:

```
#drawer-knowledge-mount.kd-open > .kd-body > .kd-essential-deep.kd-ep[data-category="..."]
```

Override only position/overflow to put it back in document flow. Never width, padding, border, or
box-sizing -- or the geometry stops being the real geometry.

- The `.kd-ep` screen is ~867px, but `.kd-ep-fam` is **865px** with 24px padding a side, so the real
  ceiling for a figure is **817px**.
- **The base rule is an ID selector.** A bare-class width override loses the cascade and renders at
  the 560px base -- an 800-unit viewBox then draws at scale 0.70 and every label inside is silently
  30% smaller. Write overrides at matching specificity:
  `#drawer-knowledge-mount .kd-ep-fam__figure.<modifier>`. This applies to font-size too, not just
  width.
- **An SVG `fill="..."` presentation attribute loses to any CSS class rule.** A white glyph written
  as an attribute over an accent shape renders accent-on-accent -- invisible. Use `style="fill:#fff"`.
- Author figures at scale 1 so a declared px is a screen px.
- **Measure label widths, never estimate.** The display face is far wider than chars x guess -- one
  label measured 197px against a ~140px estimate and collided twice.
- **Grep a class name before you claim it.** A new block named `.kd-ep-fam__hook` collided with an
  existing one and silently restyled two already-shipped headers. The new element's own page looked
  perfect; only the regression pass caught it.

## The two things that cause almost every rejection

Four rounds have now died on one or both of these (Vitamin D, B6, manganese r3, phosphorus r1).
They are cheap to avoid and expensive to miss.

### 1. SCALE. `.kd-ep-fam__kill` is pinned to 1.14rem by an ID rule.
`#drawer-knowledge-mount .kd-ep-fam__kill { font-size: var(--ds-text-lg) }` -- so a headline written
with that class renders at **document size, not magazine size**, and a panel built on it reads as a
"boring wall of text" however good the words are. `--ds-text-4xl` (2.8-4.2rem) and `--ds-text-5xl`
(5-7.5rem) exist and were unused for four rounds. **Write your own headline class** so nothing is
pinned; the approved sets run headlines at 2.5-3.2rem and numerals at 4.5-6.4rem.

### 2. NEVER DRAW THE NOUN IN YOUR OWN HEADLINE.
A broccoli headline with drawn broccoli under it, a glowing-lump headline with a drawn glowing lump --
that is the corniness, and rendering it in canvas instead of SVG does not save it. Verdict on
phosphorus r1: *"absolutely hideously ugly and childish illustration."* **Nothing in
`dashboard/design-wisdom/` or in `dashboard/components/trace-mineral-tile-detail.html` (the BAR) is a
picture of an object.** The whole vocabulary is two things: editorial-technical typography (colour-split
headlines, oversized accent numerals, drop caps, corner-bracket frames, mono chrome) and ABSTRACT
luminous/generative fields (plasma, glow, particle drift). If a figure wants light, light the TYPE --
phosphorus C lights the word PHOSPHORUS itself and draws no object at all.

⚠ **`type-futurist.css` loads LAST and overrides the faces.** `--ds-font-display` becomes Unbounded and
`--ds-font-serif` becomes Space Grotesk, so the bar's Playfair magazine look is NOT available in the
drawer. Copy the bar's RELATIONSHIPS, not its font stack. Repointing that token is a design-system
change [[token-indirection-grep-the-readers]].

## What has failed before -- and why
Not a list of bans. These are diagnosed failures, so you can avoid the cause rather than the shape.

- **A stroke routed through a label.** The single most common rejection. A rail, arrow, or needle
  crossing text is invisible to the probe, which compares text against text only. Route strokes
  around text or move the label.
- **Diagram clutter.** Multi-exit funnels, two-lane bars, tick fields, a 21-label plumbing circuit --
  all rejected as chaotic. The bar is *engaging*, not merely legible.
- **Walls of text.** Beat prose past two sentences stops being read however good it is. Cut filler,
  keep the claim.
- **A total redraw when he asked for a small change.** "Slightly clearer" means slightly. Change the
  labels before the geometry -- one header was fixed entirely by editing four text labels.
- **Scaffolding the reader cannot interpret**, like a movement bar, reads as leaked inside info.
- **Four variations of one idea** presented as four mockups.

## Where things live
- **Copy** -- all of it, including every in-figure label -- `mechanism-clarity-data.json`. The view
  holds no user-facing string.
- **Numbers and quotes** -- pulled by claim id at render. Never hand-typed.
- **Composition** -- the `blocks[]` vocabulary in `core/schemas/mechanism-clarity.ts`, rendered in
  declared order by `views/entity-page.ts::renderMechBlocks`. Adding a block type means a schema
  literal AND a render case together, or `mechanism_blocks_wellformed` reddens -- a data-driven
  dispatch fails silently, so an undispatched type would render nothing.
- **Figures** dispatch on a **generic key**, never a slug.
- **Every header ships a complete `entity-copy.json` entry** -- both `lede` and `why`. A half-filled
  entry is invisible from the page; one shipped with `why` and no `lede` and nobody noticed.

## Enforcement
`element_header_complete` · `mechanism_blocks_wellformed` · `views_no_inline_prose` ·
`entity_render_is_projection` · `view_category_not_hardcoded` · per-element render probes ·
`render_probe_mech_shape.js` (signed-off headers render byte-identical to their golden).

Container fidelity, measured placement, and narrative cohesion rest on review and his sign-off. No
machine check tells a cohesive story from a stitched one. **The STOP-for-sign-off is the control.**
