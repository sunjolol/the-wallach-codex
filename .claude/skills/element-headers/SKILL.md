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
