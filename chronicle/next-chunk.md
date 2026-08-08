# ★ NEXT SESSION — element-header demos continue (the clean-slate method is working)

Four elements' worth of header demos are banked and approved; the clean-slate method (trust the LIBERATED
`element-headers` skill) is landing consistently now. Board 90/90. Run genesis, then **ask Luneth** whether to
REFINE the banked sets toward porting, or BUILD more elements.

## Banked demos (all in `temporary/awaiting-refinement/`, all Luneth-approved as starting points)
- **vitamin-d-demos-r4.html** — 4 sun-forward (A sun+cholesterol, B 400%/sunscreen, C sun-dose, D Goldilocks). Round-closed `ceaaa3d6`.
- **vitamin-k-demos-r1.html** — 4 (A Two Jobs, B Homemade Half, C Read the Bruise, D Activator X). "All 4 good, some tweaks."
- **vitamin-b12-demos-r1.html** — 6 (A Red Crystal **[his FAVORITE]**, B Made by Microbes, C What Survives, D Losing the Insulation, E Why B12 energises you, F Why you're secretly low). E/F are the ENERGY angle he demanded; reworked to the "oh THIS is why" framing with punchy personal headlines.
- **iron-demos-r1.html** — 4, FIRST mineral / blue (A oxygen-seat+CO, B pica+trial, C earth-core, D "it was never the iron" **[his BEST]**). His note: "some combination of them all will likely be the final state."
- vitamin-c-demos-r2.html, vitamin-e-demos.html — older, liked, not finalised.

## The workflow (standing policy, Luneth 2026-08-07)
- Header/demo HTML lives in `temporary/awaiting-refinement/` **by default** until he graduates it to
  `temporary/ready-to-be-ported/` (new folder). Port to the LIVE app ONLY from ready-to-be-ported, with his
  explicit approval + STOP-for-sign-off. Memory: [[header-demos-default-to-awaiting-refinement]].
- MOVING a demo between `temporary/` depths → **regenerate via `tools/mockup_harness.py` to the new path, never `mv`**
  (the `../dashboard` link depth is baked in; a plain move silently unstyles it). Verify with `mockup_measure` + a screenshot.
- Per-element process: read `chronicle/header-research/<el>.md` (+ `design-prep/<el>.md`) → pull exact verbatims BY CLAIM-ID
  (never grep prose) → build **4 genuinely distinct** fragments (`mockup_harness --category <mineral|vitamin|…>`; mineral=blue
  #2b6fb0, vitamin=orange) → `mockup_measure` (every scale must be 1.000; fixed-px SVGs + CSS-gradient art avoid the scale trap)
  → screenshot each → park in awaiting-refinement → STOP for his pick. Trust the LIBERATED skill (cinematic light/motion/gradient
  art), NOT the old static-SVG memories.
- The "why it matters / benefit" panel must deliver a visceral **"oh, so THIS is why"** — personal, topical, mechanism-revealing;
  headlines punchy + personal ("Ever wonder why X? Here's the Y"), never dry-mechanism or debunk-first. Memory:
  [[element-header-benefit-panel-needs-the-aha]]. (B12's energy panels took 3 tries to get this right.)

## Next task (ask Luneth via genesis)
Either **(a) REFINE** a banked set toward porting — he picks the element + concept/combination (iron "some combination," B12
A-favorite, iron D-best) — then graduate it to `ready-to-be-ported/` and port LIVE into the entity page (needs the composed
`blocks[]` shape + his explicit approval + STOP-for-sign-off); OR **(b) BUILD** the next element's 4 demos. Remaining dossiers:
B1 B2 B3 B5 B6 B9 · iodine manganese vanadium germanium boron sodium sulfur chromium potassium phosphorus silica cobalt silver ·
omega-3/6 · choline flavonoids · the amino acids. His call — cast a wide net, build all 4.

## Still binding / OPEN for Luneth (carried forward)
- Deferred (postmortem §Flagged): 5 header-memories → skill consolidation; the `figure.width` mech/fork/rail enum; a supervised
  `/consolidate-memory` pass (MEMORY.md near threshold — 2 more added this session).
- The twin-card gate (`search_no_twin_questions`) + the Aug 3–5 / dedup deletions stay as they are.
