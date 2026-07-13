# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-12, end of session)

> ★★★ THIS FILE + the memory files OVERRIDE ALL OLDER BLUEPRINT / PLAN NOTES. If `OVERHAUL-BLUEPRINT.md`, `phase-h-migration-blueprint.md`, `entity-page-redesign-blueprint.md`, or older text conflicts with this, **THIS wins** ("older loses"). Board **62/62**, knowledge_version **324**.

## ★★★★ TOP PRIORITY — EXCLUSIVE NEXT FOCUS: DIET & ABSORPTION (the second prong)
**Do this to completion + get Luneth's sign-off BEFORE resuming anything else.** Full plan (READ IT IN FULL FIRST): **`chronicle/diet-absorption-blueprint.md`**.

The short version — Luneth's explicit, emphatic mandate (2026-07-12):
- Wallach's model is **TWO PRONGS, inseparable**: (1) get all 90 essentials, (2) **remove bad foods — above all GLUTEN (wheat/barley/rye/oats) — so the body can ABSORB them.** "You are not what you eat — you are what you absorb" (Epigenetics). Diet is **JUST AS IMPORTANT as the 90 essentials** and can NEVER be separated from them.
- **The blind spot (never repeat):** this stance saturates the corpus (**283 gluten/celiac/leaky-gut/malabsorption/villi hits**) and has **sealed Good/Bad-Foods flyers** (`eden/graphics/{Bad,Good}-Foods-{Front,Back}.jpg`), yet the app NEVER surfaced it across many sessions — Luneth (lifelong Wallach follower) couldn't tell if the app even knew. MASSIVE repeated error. Meta-lesson: proactively surface the IMPORTANCE of prevalent Wallach stances; don't wait to be asked. (Memory [[surface-prevalent-wallach-stances]].)
- **The build ("total overhaul without the overhaul"):** (A) a **persistent absorption caveat + the mantra across the board** — everywhere coverage/% shows — so it can NEVER be missed; (B) a dedicated **Foods & Absorption** section (surface the sealed flyers + the re-mined citations) with modern, PERSUASIVE UX that guides the user to eliminate gluten as a lifestyle (partial is not enough).
- **The mine:** re-mine ALL 6 books for EVERY food / gluten / absorption / malabsorption / digestion / leaky-gut / good-foods / bad-foods stance (a major systematic campaign; per `.claude/rules/mining-veins.md` + `search-corpus.md`; §00.A cites every claim).
- **Suggested order + definition of done:** blueprint §6. Done = Luneth signs off that the two-pronged stance is inescapable app-wide AND the Foods & Absorption section is complete + persuasive. He ended this session early specifically to fund the resources — get it right the first time.
- **THEN resume** the Phase-H work below (do NOT forget it).

## ★ JUST COMPLETED (2026-07-12) — the TRACE/RARE-MINERAL COVERAGE INNER PAGE (committed + pushed)
The 33 rare-earth/trace minerals are scored **as one group** vs Wallach's plant-derived colloidal-mineral dose (924 mg maintenance). Earlier this session: data + derive + engine + the `pdm_goal_wallach_sourced` gate + the Essentials-tab dots. This session's final chunk shipped the **INNER page** for a rare-earth mineral:
- `views/entity-page.ts::renderPdmGroupGlance` — 924 mg GROUP target + "how is this calculated?" hover (composed from `pdmGoalProvenance()`, numbers from data) + Σ vehicle mg / 924 with a bar that goes **green when met, orange in progress** (`barFillClass`, applied to ALL coverage bars) + a "Rare Earth Minerals" tag + a "scored as one group" note + best-PDM-sources ranked by mg (`rankedPdmSources()`) + a subtle **30-day therapeutic alert box** (accent stripe + wash + info mark).
- Section-label fix: "Electrolytes & major minerals" → **"Essential trace minerals"** (that group holds boron/cobalt/zinc, no electrolytes).
- Record **auto-expand** when `claim_count < 20` (a 2-claim page no longer hides its claims); gated both ways in the probe.
- Note number corrected: "60-77 elements" → book-faithful **"60 to 72 minerals"** (RARE-000071), clarified as the whole mineral spectrum (rare earths are a subset), not a rare-earth count.
- Full detail: this session's build-log + Creator's Log entries. Background math: `chronicle/mineral-coverage-investigation.md`.

### Owed on trace/rare (SMALL — after the diet/absorption workstream):
1. **Therapeutic-note formal seal** — the "double the base line" doubling (DDDL + Let's Play Doctor, verbatim, opiate-withdrawal context) is currently shown as book-grounded educational prose; Luneth was offered (a) leave as-is or (b) mine+seal it as a formal citable claim — undecided.
2. **Cal Toddy** label reconciliation (`Cal_Toddy_Facts.png` in temporary/labels/ — present-only → re-derive/re-seal).
3. **Group-B tunable factor** default; **best-source prices** + the 600 mg **tie-ordering** (feature Plant Derived Minerals first).

## ★ THE PAGE-REPLICATION TECHNIQUE (how to build a demo-faithful page — still applies to the Foods & Absorption surface)
1. **Extract the demo's EXACT CSS/JS with PYTHON — never grep** (grep truncates the demo's 600 KB inlined lines), never infer a base rule ([[extract-demo-css-exact-with-python]]).
2. **Translate bad demo code → clean app code.** Adopt only STYLES/FONTS; reuse existing design tokens; do NOT copy demo code/data/prose; don't bloat CSS ([[demo-vision-not-letter]]).
3. **VISUALLY VERIFY — screenshot + LOOK.** A structural probe (DOM counts) is NOT a visual check ([[screenshot-verify-visual-chunks]]).

## ★ THE GOVERNING DOCTRINE (unchanged; non-negotiable)
- Canonical demo = ONLY `temporary/knowledge-drawer-prototype.html` — the VISION; RE-CREATE on REAL data, never copy.
- NEVER reuse an old app component to fill a gap; if the design doesn't specify something, STOP and ASK.
- Prose is machine-contained (`view-copy.json` via `ui()`); the only inline prose is the reviewed entity lede.
- PROVE everything (grep / invariant / **rendered screenshot**). Luneth is the visual sign-off gate: build one small chunk → build+invariants+probe → **screenshot + show him** → sign-off → round-close.

## THREAD 2 (QUEUED — AFTER diet/absorption) — Search G-7 + book mining
(1) SEAL the 2 search source files (`eden/corpus/search-enrichment.json` + `eden/catalog/search-entities.json`); (2) resume mining search-first from Immortality element A-Z at **Mn-Manganese**; (3) cross-book capture the wrongly-skipped charged treatises; (4) general-interest lay topics [[general-interest-lay-topic-tagging]]; (5) port the P2 CHARGED gate [[charged-search-gate]]. (The diet/absorption mine can run alongside/first — see the blueprint.)

## ★ KEY REMINDERS
- **Round-close** ([[creators-log-append-gotchas]]): Creator's Log `--summary` ≤280; pass `--detail` via `"$(cat file)"`; the log embed bakes into `dist/main.js` at BUILD time → **log → rebuild → commit**.
- **safe_write** ([[safe-write-crlf-flip]]): pass **LF-only** content; edit one file many times → read once + apply all + write once. For many TS edits, use a Python compute-script with per-anchor assertions → `safe_write rewrite` (proven this session).
- **Corpus edits** ([[editing-sealed-corpus-claims]]): edit the DRAFT via `mine_batch.py apply` → `corpus_seal.py` (USER-ONLY, per-invocation approval) → `build_embeds.py` → invariants.
- **Inline-data gate**: an object literal in views/state with > 10 top-level fields reddens `views_state_no_inline_data`; split it (base + spread).
- Authoritative doctrine = the memory files + THIS file + `chronicle/diet-absorption-blueprint.md`. Master plan: `chronicle/OVERHAUL-BLUEPRINT.md`.
