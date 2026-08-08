# ★ NEXT SESSION — element-header demos continue (the clean-slate method is working)

Seven banked demo sets and counting; the clean-slate method (trust the LIBERATED `element-headers` skill) is landing
consistently. Board 90/90. Run genesis, then **ask Luneth** whether to REFINE a banked set toward porting, or BUILD more.

## Banked demos (all in `temporary/awaiting-refinement/`, all Luneth-approved as starting points)
- **vitamin-d-demos-r4.html** — 4 sun-forward (A sun+cholesterol, B 400%/sunscreen, C sun-dose, D Goldilocks). Round-closed `ceaaa3d6`.
- **vitamin-k-demos-r1.html** — 4 (A Two Jobs, B Homemade Half, C Read the Bruise, D Activator X). "All 4 good, some tweaks."
- **vitamin-b12-demos-r1.html** — 6 (A Red Crystal **[his FAVORITE]**, B Made by Microbes, C What Survives, D Losing the Insulation, E Why B12 energises you, F Why you're secretly low). E/F = the ENERGY angle.
- **iron-demos-r1.html** — 4, FIRST mineral / blue (A oxygen-seat+CO, B pica+trial, C earth-core, D "it was never the iron" **[his BEST]**). "some combination of them all will likely be the final state."
- **iodine-demos-r1.html** — 4, mineral / blue (A the dial hypo↔hyper mirror, B copper-twist **[the "wow"]**, C sea-to-gland gradient, D goitrogen block). Round-closed `3fc5a40f`. B/D share a theme → only ONE ships; lede+why (230 mcg) await ratification (canon coverage_kind still "unspecified").
- **amino-trio-demos-r1.html** — FIRST amino_acid / green AND first GROUP page: "the three Wallach added" = arginine + taurine + tyrosine (each too thin solo; all share IMMORT-000058). 7 concepts, **dopamine-forward** at his call: A roster · B disease-triptych · C nine-vs-twelve · D from-dinner-to-dopamine pathway (EPIGEN-000053) · E tyrosine's fork · F when-dopamine-runs-dry Parkinson's (LETS-000396) · G amino-for-hard-times stress (EPIGEN-000057). Banked "workable, needs some changes." He SCRAPPED a body-map + an anatomical eye as amateurish → **hand-drawn anatomy is a weak spot; favor abstract/flow/molecular/typographic.** Unbuilt-but-offered deeper dopamine angles: drive/reward hook · dopamine→noradrenaline→adrenaline cascade · depression protocol (LETS-000244) · rate-limiting "gentle vs L-Dopa."
- **chromium-demos-r1.html** — mineral / blue, one of the richest palettes. 5 concepts: A vicious-circle (sugar⟳chromium loop, RARE-000039+IMMORT-000091) · B **[KEPT as-is]** a-third-more-life +33.3% lifespan bars (RARE-000124) · C 1-in-100 grain field (99 ghosts, 1 glows; RARE-000074) · D **[KEPT as-is]** GTF gem emblem (DDDL-000200) · E dark provocation "a whole specialty wiped out" (DDDL-000046). **REVAMP LESSON (pro-ambition, not restrictive):** Luneth called A/C/E "very boring/clinical" (a boxed loop, a bar chart, a stat dashboard) → the fix was a **visceral hero visual + motion** (glowing loop, one grain among 99, a bold dark provocation); B/D never needed it (each already had a hero — the +33.3% reversal, the Cr³⁺ gem). A's ring took extra passes (caption overlap → arrowhead overlap → a stuttering animation) and is now **RESOLVED** — arrowheads removed (circulation via the central ↻ + the ↓/↑ caption tags), ring reworked to a seamless rigid rotation (transform-rotate + pathLength=380); Luneth confirmed. **That was a VERIFICATION miss, not a design one:** I claimed "fixed" ~3× from editing code — always view the render and confirm the exact flagged thing before saying fixed. Design ambition + animation stay fully encouraged. Target 620 mcg/day (Wallach-sourced, not a gap). Unbuilt angles: behavioral (sugar-crash→ADHD/depression/"Jekyll rages"/allergic shiners); serum-decline curio (1948→1985, numbers claim_text-only).
- vitamin-c-demos-r2.html, vitamin-e-demos.html — older, liked, not finalised.

## The workflow (standing policy)
- Header/demo HTML lives in `temporary/awaiting-refinement/` **by default** until he graduates it to
  `temporary/ready-to-be-ported/`. Port to LIVE only from there, with explicit approval + STOP-for-sign-off. [[header-demos-default-to-awaiting-refinement]].
- MOVING a demo between `temporary/` depths → **regenerate via `tools/mockup_harness.py` to the new path, never `mv`** (the `../dashboard` depth is baked in).
- Per-element process: read `chronicle/header-research/<el>.md` (+ `design-prep/<el>.md`) → pull verbatims BY CLAIM-ID **and verify each id is still
  in the sealed corpus** (see drift flag) → build **genuinely-distinct** fragments (`mockup_harness --category <mineral|vitamin|amino_acid|…>`;
  mineral=blue #2b6fb0, vitamin=orange, amino=green #5aa82c, omega=purple) → `mockup_measure` (every scale 1.000; fixed-px SVG + CSS-gradient art avoid
  the scale trap; the in-app browser may refuse file:// on a new file → screenshot via a puppeteer script with NODE_PATH set to repo node_modules) →
  park → STOP for his pick. **Cast a wide net — 4+ concepts, or a GROUP page when the element is too thin solo** (the amino trio proved the group pattern; reuse it for other thin clusters).
- **Give every figure a HERO moment — be ambitious.** A boxed loop / bar chart / stat-tile dashboard reads "boring/clinical" to Luneth; a visceral
  centrepiece + motion is what lands (chromium revamp, B12 crystal, iron seat). This is a push toward BOLD, not a list of banned shapes.
- The benefit panel must land a visceral **"oh, so THIS is why"** — personal, topical ("Ever wonder why X? Here's the Y"). [[element-header-benefit-panel-needs-the-aha]], [[element-header-illustration-failure-modes]].
- **Verify with your eyes, not the code.** When he flags a visual issue, view the actual rendered output (screenshot/zoom) and confirm the EXACT thing before claiming fixed; for motion you can't screenshot, reason honestly about the mechanism. (Chromium-A cost several rounds because I claimed "fixed" from reading code.) [[screenshot-verify-visual-chunks]], [[verification-doctrine]].

## Next task (ask Luneth via genesis)
Either **(a) REFINE** a banked set toward porting (he picks element + concept/combination), graduate to `ready-to-be-ported/`, port LIVE
(needs the composed `blocks[]` shape + **a live `--ds-accent` category override for anything non-mineral/vitamin** — amino=green + omega=purple
are NOT in drawer-knowledge.css yet, only mineral is — + his STOP-for-sign-off); OR **(b) BUILD** the next element. Remaining dossiers:
B1 B2 B3 B5 B6 B9 · manganese vanadium germanium boron sodium sulfur potassium phosphorus silica cobalt silver ·
omega-3/6 · choline flavonoids · the remaining amino acids (phenylalanine, lysine, methionine, tryptophan, histidine, leucine, isoleucine, valine, threonine — several are thin → candidate group pages).

## Still binding / OPEN for Luneth (carried forward)
- **Dossier drift — VERIFY every cited claim-id before quoting.** Dossiers predate a corpus reseal, so some cited ids are dead/renumbered even
  though the content survives. Confirmed dead so far: WAL-CLM-IMMORT-000178, WAL-CLM-RARE-000147 (iodine), WAL-CLM-DDDL-000066 (amino stance),
  WAL-CLM-IMMORT-000087 + WAL-CLM-RARE-000116 (chromium GTF — survives in WAL-CLM-DDDL-000200). Run `claim_review.py --ids …` (it prints "not in
  the sealed corpus") and substitute the sealed sibling. [[header-research-dossiers-exist]].
- Deferred (postmortem §Flagged): 5 header-memories → skill consolidation; the `figure.width` mech/fork/rail enum; a supervised
  `/consolidate-memory` pass (MEMORY.md near threshold).
- The twin-card gate (`search_no_twin_questions`) + the Aug 3–5 / dedup deletions stay as they are.
