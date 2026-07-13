# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-13, end of session)

> ★★★ THIS FILE + the memory files OVERRIDE ALL OLDER BLUEPRINT / PLAN NOTES. If `OVERHAUL-BLUEPRINT.md`, `phase-h-migration-blueprint.md`, `entity-page-redesign-blueprint.md`, or older text conflicts, **THIS wins** ("older loses"). Board **62/62**, knowledge_version **327** (UNCHANGED this session — no corpus reseal happened). Diet/absorption workstream: the **Absorption tab (Part B) is BUILT + committed + pushed** (chunks 1–4). knowledge/design NOT finalized.

## ★★★★ TOP PRIORITY — EXCLUSIVE NEXT FOCUS: perfect the ABSORPTION tab's VISUAL DESIGN
**Luneth is bringing detailed design notes at the very start of the next session — get them FIRST, then iterate the tab to perfect before anything else.** The current visual style is a **WORK IN PROGRESS**. Luneth's words (2026-07-13): *"it's missing a lot and you're still not getting it."* **DO NOT treat the current `.kd-foods-*` visuals as canonical/settled** — expect significant rework from his notes. (This is why the design was logged LIGHT this session, on purpose.)

- **The design bar + how to hit it:** memory [[visual-design-bar-and-principles]]. Reference page = `dashboard/components/trace-mineral-tile-detail.html` (translate its GOOD design → clean code; NEVER copy its bad code). Principles Luneth stated: **mesh art + UX** (each surface an art piece AND good UX); **fill negative space with PURPOSEFUL accents** (context / colour variation / flavor), never random; **high-tech / nanotech / futuristic / alien** vibes but purposeful; **AVOID** the reference's scattered blue **L-shaped corner brackets** (he dislikes them); use the design-system `ds-*` primitives + fonts (`.ds-pull-stat` for kill-shot numbers, `.ds-pulse`, mono readouts, accent-notch rules, `.ds-h-hero`/`.ds-deck`/`.ds-kicker`). Animation = life.
- **Verify visually every chunk** — screenshot + LOOK, never trust a DOM probe for looks ([[screenshot-verify-visual-chunks]]). A puppeteer shot script was used this session (viewport 1180× tall, deviceScaleFactor 2, click `[data-kd-tab="foods"]`, `.screenshot()` the `#drawer-knowledge-mount` element).

### What's built so far (chunks 1–4, all committed + pushed, board 62/62)
A 6th Knowledge sub-tab **"Absorption"** (Tab id `foods`, label "Absorption", 2nd in the strip). A curated persuasive landing, top → bottom:
1. **Editorial hero** — 2-line Playfair headline ("You are not what you eat. / *You are what you absorb.*"), an eyebrow **accent-notch rule** ("THE SECOND PRONG ——◆——"), a pulsing **top-right readout** ("WALLACH · CORPUS / PRONG 2 OF 2").
2. **`.ds-pull-stat` kill-shot** — the 115M gluten-intolerance prevalence beat (readout `// MAYO CLINIC · 2009` → glowing `115M` → body + `<small>` cite). Sourced to EPIGEN-000141.
3. **Villi "scan"** — damaged LEFT / healthy RIGHT; thin **square** bars on a faint tech-grid + baseline ticks; **pulsing 9px** nutrient dots (healthy nestled among villi, damaged drifting high); "Absorb ↑/↓" metric readouts.
4. **REMOVE ⟷ EAT contrast** — "What to change on your plate": 5 remove (red) / 3 eat (green, incl. the counterintuitive **Salt**) / 4 amber "Sometimes it's the form, not the food" (dairy/water/cruciferous/phytates). Each food card's one-line "why" is its OWN sealed claim's answer (leading "Yes/No —" stripped); each links to its topic page via `data-kd-topic`.
5. **"In his own words"** — the 3 sealed crown-jewel claims (mantra EPIGEN-000140 / prevalence 000141 / two-prong fix 000142) via the shared `renderSearchCard`, facet-grouped.

**Files:** `views/knowledge-foods.ts` (renderFoodsTab + parametric villi SVG); `dashboard/assets/data/foods-curation.json` (curation config: hero_claims + remove/eat/conditional slug lists; registered hand_authored in `eden/derived/MANIFEST.json`); `core/schemas/foods-curation.ts` + `state/foods-curation.ts` (accessors: foodsThesisClaims / foodsRemove / foodsEat / foodsConditional; `pickWhy` picks a food's why by facet priority); `.kd-foods-*` in `dashboard/assets/styles/drawer-knowledge.css`; `kd_foods_*` in `dashboard/assets/data/view-copy.json`; `render_probe_knowledge.js` (6-tab + Foods checks). Pure projection (R1): framing via `ui()`, claims via data, villi decorative SVG. NO knowledge_version bump (no corpus mining this session).

## ★ BACKLOG — finish the Absorption workstream, THEN resume Phase-H (nothing lost)
Deferred WITHIN the diet/absorption workstream (do after the design is perfected):
1. **3 open questions Luneth deferred answering:** (a) **food-card routing** — clicking a REMOVE/EAT food opens its topic page on the **Explore** tab (existing `data-kd-topic` handler switches tabs); decide whether to host the topic page IN the Absorption tab instead (needs a `selectedFoodTopic` state in knowledge.ts + a `backAction` param on `renderTopicPage`). (b) keep the amber **"it's the form"** bucket? (c) the **`--`→`—` dash cleanup** in some food "why" lines (raw claim answer_short dash style; a few claims use `--`).
2. **Content pass (corpus reseal — USER-ONLY `corpus_seal`):** the **poached-eggs EPIGEN-000155 missing-outcome fix** (Luneth flagged: the book states "3 months later… He was excited, energetic, and totally symptom free!" — currently dropped). Batch it with a **diet-vein OUTCOME AUDIT** across every case-study/protocol claim (rule [[state-the-outcome-when-known]]: show the result when the book states one — expand/truncate the quote AND put success in the summary; never fabricate). + normalize `--`→`—` in the diet claim `answer_short`s in the same reseal.
3. **Bulk-enrich the ~180 remaining on-theme diet/absorption claims** (NO seal — enrich existing sealed claims into the food entities) to deepen the THIN topics (salt/meat/dairy/cruciferous/water/processed_meat, each ≤2 claims today). Data map: 45 diet subject-claims live; ~124–211 on-theme sealed claims un-enriched.
4. **Part A — the persistent absorption caveat** across Coverage / Essentials / entity pages. RESTRAINT ([[persuade-dont-shove-restraint]]): ONE great pointer near the top-line coverage number ("these numbers assume you absorb them →"), never saturate/nag.
5. **Coverage-tab OVERHAUL** (in scope, Luneth 2026-07-12) — rebuild to Knowledge-tab quality, absorb the diet framing natively, fix the 2 fake coverage numbers (goal-card proportional fake + regimen-slot hardcoded literals).
6. **THEN resume Phase-H** (entity-page + Search overhaul) per `chronicle/OVERHAUL-BLUEPRINT.md` + the sections below.

## ★ OWED ON TRACE/RARE (small — from 2026-07-12, still valid)
1. **Therapeutic-note formal seal** — the "double the base line" doubling (DDDL + Let's Play Doctor, opiate-withdrawal context) shown as educational prose; Luneth undecided (leave as-is vs mine+seal as a citable claim).
2. **Cal Toddy** label reconciliation (`Cal_Toddy_Facts.png` in temporary/labels/ — present-only → re-derive/re-seal).
3. **Group-B tunable factor** default; **best-source prices** + the 600 mg **tie-ordering** (feature Plant Derived Minerals first).

## THREAD 2 (QUEUED — after diet/absorption) — Search G-7 + book mining
(1) SEAL the 2 search source files (`eden/corpus/search-enrichment.json` + `eden/catalog/search-entities.json` — currently UNSEALED, edited via plain safe_write). (2) resume mining search-first from Immortality element A-Z at **Mn-Manganese**. (3) cross-book capture the wrongly-skipped charged treatises. (4) general-interest lay topics [[general-interest-lay-topic-tagging]]. (5) port the P2 CHARGED gate [[charged-search-gate]].

## ★ THE PAGE-REPLICATION TECHNIQUE (still applies to any visual surface)
1. **Extract a demo's EXACT CSS/JS with PYTHON — never grep** (grep truncates long inlined lines), never infer a base rule ([[extract-demo-css-exact-with-python]]).
2. **Translate bad demo code → clean app code.** Adopt STYLES/FONTS only; reuse existing `--ds-*` tokens + `ds-*` primitives; do NOT copy demo code/data/prose ([[demo-vision-not-letter]]).
3. **VISUALLY VERIFY — screenshot + LOOK** ([[screenshot-verify-visual-chunks]]).

## ★ GOVERNING DOCTRINE (unchanged; non-negotiable)
- Canonical demo (Phase-H drawer) = `temporary/knowledge-drawer-prototype.html`; visual-quality reference = `dashboard/components/trace-mineral-tile-detail.html`. RE-CREATE on REAL data, never copy.
- NEVER reuse an old app component to fill a gap; if the design doesn't specify something, STOP and ASK.
- Prose is machine-contained (`view-copy.json` via `ui()`); the only inline prose is the reviewed entity lede.
- PROVE everything (grep / invariant / rendered screenshot). Luneth is the visual sign-off gate: build one small chunk → build+invariants+probe → screenshot + show him → sign-off → round-close.

## ★ KEY REMINDERS
- **Round-close** ([[creators-log-append-gotchas]]): Creator's Log `--summary` ≤280; pass `--detail` via `"$(cat file)"`; the log embed bakes into `dist/main.js` at BUILD time → **log → rebuild → commit**.
- **safe_write** ([[safe-write-crlf-flip]]): pass **LF-only** content; the repo normalizes to LF on commit (CRLF warnings on commit are expected/harmless). Multi-edit one file → a Python compute-script with per-anchor `count==1` asserts → `safe_replace`/`safe_rewrite` (proven repeatedly this session).
- **New assets/data file** → register it in `eden/derived/MANIFEST.json` `accounted[]` (hand_authored + reason) or `data_artifacts_accounted` reddens.
- **Inline-data gate**: object/array literal > 10 elements in views/state reddens `views_no_inline_prose`/`views_state_no_inline_data`; keep curation in data files.
- Authoritative doctrine = the memory files + THIS file + `chronicle/diet-absorption-blueprint.md`. Master plan: `chronicle/OVERHAUL-BLUEPRINT.md`.
