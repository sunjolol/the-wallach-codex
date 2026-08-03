---
name: design-language
description: Read before designing any visual surface - element headers, the regimen/scanner/journal tabs, the profile system, or a new theme. Covers what is actually available (vendored libraries, a pinned engine, the mockup harness), the taste rubric a design is judged against, and what offline-first does and does not restrict.
---

# Design language

## What offline-first actually restricts
**One thing: nothing may load off-machine at runtime.** No CDN, no Google Fonts, no live API,
no websocket. That is the whole constraint, and `offline_no_runtime_network` enforces it.

It has never meant small, static, or plain. That misreading produced years of flat SVG line-art and
is the reason this file exists. **Vendored, pinned, and permanently working** is the bar. A 300 KB
animation library that ships in the repo and runs forever satisfies it completely.

The old `dist/main.js gzipped <= 250 KB` budget is **retired**. It was measured at 2.67 MB — failing
by 10.7x and routinely bypassed — so it was capping ambition without enforcing anything. The
replacement tripwire sits at 8 MB and exists only to catch a runaway, never to simplify a design.

## What is available right now
Vendored in `dashboard/assets/vendor/libs/`, hash-pinned in `vendor-manifest.json`, all MIT/ISC:

| Library | Use |
|---|---|
| `motion` | modern animation, scroll-driven and spring physics |
| `animejs` | timeline animation, staggering, morphing |
| `roughjs` | hand-drawn / sketched rendering — fits the paper aesthetic |
| `d3` | data-driven figures, scales, layouts |
| `lottie-web` | plays After Effects animations from JSON |

The app bundle gets them from npm through esbuild. **Standalone mockups load the vendored copies
directly** — the harness wires them in automatically. Want something not on this list? Vendor it the
same way and add it to the manifest; the gate will pin it.

## The pinned engine
The app targets **one pinned browser build** that never auto-updates. Design against it directly:
modern CSS and JS, no fallbacks, no polyfills, no defensive coding for browsers that will never load
this. Container queries, `:has()`, view transitions, scroll-driven animations, backdrop-filter, CSS
nesting, `color-mix()` — all fair game.

**Status, honestly:** the decision is made and binds design choices now; the browser has not been
acquired and pinned yet. Until it is, this rests on the decision rather than on a shipped artifact.
See `chronicle/decisions/2026-08-03-pinned-engine.md`.

## The harness — stop guessing at geometry
```bash
python tools/mockup_harness.py --out temporary/<name>-demos.html --category mineral --title "..." --panel "A. concept:frag-a.html"
node tools/mockup_measure.js temporary/<name>-demos.html
```
The shell reads its stylesheet list **out of `dashboard.html`**, so it cannot drift from the app. It
reproduces the real ancestry, so a mockup renders in true geometry — verified: container 865px,
24px padding, **figure ceiling 817px**.

`mockup_measure.js` reports every figure's authored-vs-rendered scale. **Anything but 1.000 means a
declared px is not a screen px** — nearly always the ID-selector cascade trap. It also lists failed
resources, because a 404'd font falls back silently and shifts metrics everywhere.

Its collision check is text-vs-text only. It cannot see a stroke through a label or a label behind an
opaque shape. Those need eyes.

## The rubric — what a design is judged against
Score honestly before showing him. These are the dimensions his rejections have actually landed on:

1. **Does it stop the scroll?** The bar is *engaging*, not merely legible or correct.
2. **One idea per figure.** Multi-exit funnels, tick fields, and 21-label circuits were all rejected
   as clutter. Fewest possible elements carrying the point.
3. **Bespoke to this element.** Would this figure work for a different nutrient with the labels
   swapped? Then it is a template, and templates are the standing complaint.
4. **Nothing crosses text.** The single most common rejection.
5. **Prose earns its length.** Beats past two sentences stop being read.
6. **The mechanism is explicit.** If a mechanism is the point, a skim-reader must land on a named,
   emphasised label. Implicit-everywhere/explicit-nowhere is a defect.
7. **One arc, no seams.** Not two designs stitched together; carry the turn with a sentence, not a
   divider. Never print scaffolding a reader cannot interpret.
8. **Would it look at home on CodePen?** That is the stated aspiration. Motion, depth, texture and
   interaction are the difference between "correct" and "good."

## Process, non-negotiable
Four **genuinely distinct** mockups — different layout AND different illustration, not four
variations of one idea. He picks or mixes. **Never build live without explicit permission.** Then
STOP for visual sign-off before logging or committing. A DOM probe is not a visual check.

## Category accents
minerals blue · vitamins orange · amino acids green · omegas purple. Cream paper is the default
theme; more themes are planned and must change style only, never functionality.
