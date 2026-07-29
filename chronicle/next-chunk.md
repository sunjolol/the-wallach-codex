# Next chunk — ★ AUTHORITATIVE HANDOFF (set 2026-07-29, after Copper's header SHIPPED)

# ★★★★★ READ FIRST (plain language)
Board **76/76 green · corpus kv432 · 2267 sealed claims · repo clean + pushed** (`bd72fb20`).
**Copper's element header is LIVE** — the first bespoke per-essential header. The task now is
**the remaining 89 essentials**, one at a time, using the process below.

## The PROCESS Luneth locked in — use it for EVERY element
For each element: build **4 genuinely distinct mockups** (different layout + illustration, bespoke
to THAT element's content) → **Luneth PICKS** one or a mix → build the winner into the live entity
page → **STOP for his visual sign-off**. He drives; this is the fun part for him.
**Every mockup MUST be authored AND previewed inside the REAL container** — a shell reproducing
`#drawer-knowledge-mount > .kd-body > .kd-essential-deep[data-category=…]` loading the app's real
stylesheets, so the tan `--ds-paper-deep` box, the category accent and the measured **867px**
content width are hard constraints. `temporary/copper-header-{mockups,combined}.html` are the
worked example — copy that shell. (Standalone white pages got 4 mockups rejected on sight.)

## What Copper established (reuse, don't re-derive)
- **Composed-header schema** (`core/schemas/mechanism-clarity.ts`): OPTIONAL, self-suppressing
  blocks — `figure_labels` · `split{left,right}` (2×2 grid; evidence = a claim quote OR a
  `field{total,columns,bands[]}` proportion figure) · `bridge` · `figure_pre_beats` /
  `figure_post_beats` · `beats_layout:"row"` · `beat.turn` · `beat.hook` optional.
  A new element composes from these; only a genuinely new SHAPE needs a schema addition.
- **Figures dispatch on a GENERIC key**, never a slug (`cofactor_fork` · `decline_rail` ·
  `reversal_rail` live today). `entity_render_is_projection` enforces it.
- **ALL copy — including every in-figure label — lives in `mechanism-clarity-data.json`**
  (`views_no_inline_prose` / R4). Numbers + quotes are pulled BY CLAIM ID at render (R3).
- **CSS**: the `kd-ep-fam__*` vocabulary in `drawer-knowledge.css` (split · miniq · field · bridge ·
  steps--row · the figure primitives). Reuse before adding.
- **Probe**: `tools/render_probe_copper.js` (47 checks) is the template — copy it per element.

## ★ THE TWO TRAPS THAT COST THIS SESSION (do NOT repeat)
1. **ID-specificity width trap.** `#drawer-knowledge-mount .kd-ep-fam__figure { max-width: 560px }`
   is an ID selector. A bare-class width override LOSES, so an 800-unit viewBox renders at 560 —
   **scale 0.70, every label inside silently 30% smaller.** Author at **scale 1** (viewBox width ==
   CSS max-width) and write the override at matching ID specificity.
2. **Figure type = the MEASURED selenium standard: labels 12.0px, glyph 17.6px.** Selenium is the
   **CEILING**, not a floor — an invented "better" scale got a hard rejection. Measure the shipped
   figure, match it. And **measure label widths** before placing them (the display face is far wider
   than a chars×guess; two collisions came from estimating). [[illustration-type-scale]]

## OPEN DEFERRAL (carry forward)
**`entity-copy.json` holds 3 of 91 essentials** (calcium · selenium · copper), so the
**"why this number?" dotted explainer is still ABSENT on the other 88** — Luneth wants it on EVERY
element ([[daily-target-provenance-always]]). Each entry must derive from the documented transform
chain in `essentials-targets-data.json` (source claim → upper-of-range → IU factor → ×1.54 →
round-2sf), in the voice of the calcium/selenium/copper entries. This is a per-element job that
rides along with each header, or a dedicated pass.

## LOAD FIRST next session
- `.claude/rules/visual-verification.md` (the human-in-the-loop STOP gate) + [[screenshot-verify-visual-chunks]].
- The live gold standards in `views/entity-page.ts`: `renderMechanism` (composed, copper) ·
  `renderOmega6Experience` · `renderPdmClarity`, and their CSS in `drawer-knowledge.css`.
- Memories: [[illustration-type-scale]] · [[header-mockups-in-real-container]] ·
  [[category-color-coding]] · [[element-intro-what-is-claim]] · [[daily-target-provenance-always]] ·
  [[element-sources-at-bottom]] · [[gold-standard-page-workflow]] · [[svg-figure-size-in-screen-px]].

## STANDING DOCTRINES (unchanged)
1. Every claim lives in ONE of three homes (essentials/conditions/Explore); search is a retrieval layer.
2. Diet not food; nutrients from the DIET (food OR supplements). 3. NEVER fabricate — verbatim ⊆ sealed book, or GAP.
4. `corpus_seal` + `catalog_seal` are USER-ONLY (per-invocation authorization). 5. Memory index: consolidate only past ~200 lines ([[memory-consolidation-threshold]]).

**Corpus kv432 · 2267 claims · board 76/76 green · repo clean + pushed. Next: pick the SECOND element and run the 4-mockup process.**
