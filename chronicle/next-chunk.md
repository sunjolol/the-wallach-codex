# Next chunk — ★ PHASE H · Knowledge + Search overhaul · AUTHORITATIVE HANDOFF (updated 2026-07-12)

> ★★★ THIS FILE + the memory files OVERRIDE ALL OLDER BLUEPRINT / PLAN NOTES. If `OVERHAUL-BLUEPRINT.md`, `phase-h-migration-blueprint.md`, `entity-page-redesign-blueprint.md`, or older text conflicts with this, **THIS wins** ("older loses"). Board **62/62**, knowledge_version **324**.

## ★★★ JUST COMPLETED (2026-07-12) — the TRACE/RARE-MINERAL COVERAGE SYSTEM (chunks 1-6, all committed + pushed)
The 33 rare-earth / trace minerals used to be permanently "pending" (the crediting rule was dead code). They are now scored **as one group** against Wallach's plant-derived colloidal-mineral dose. Full investigation + the Luneth-approved product tables + the golden-standard math live in **`chronicle/mineral-coverage-investigation.md`**. What shipped:
- **Data (chunks 1-2):** `dashboard/assets/data/trace-mineral-vehicles.json` — the CURATED one-off-rules layer (per-product group A/B/C/D + mode amount/present + tunable Group-B factor + goal model; JUDGMENT only, amounts stay in the sealed pillar). And the sealed claim **`WAL-CLM-EPIGEN-000089`** was enriched with a structured `dose {1 fl oz / 100 lb / day}` (via mine_batch → corpus_seal, knowledge_version 323→324).
- **Derive (chunk 3):** `eden/tools/pdm_coverage_derive.py` → `dashboard/assets/data/pdm-coverage-data.json` (manifest artifact, freshness-gated). Goal = **924 mg maintenance / 1,848 mg therapeutic** + per-product plant-derived-mineral vehicle mg + canonical_name.
- **Engine (chunk 4):** `state/coverage.ts` — the dead trace_pdm regex is replaced by `pdmAggregate` (Σ regimen vehicle mg, name-matched) + one shared verdict (Σmg/924; 95%/30% thresholds) applied to all 33 trace_pdm tiles; new `'present'` (hollow) status; silver/tin/cobalt keep their own Wallach dose → numeric path. `core/schemas/pdm-coverage.ts`.
- **Gate (chunk 5):** NEW invariant `pdm_goal_wallach_sourced` (Charter R2/§00.A) — recomputes the goal from the sealed dose × pillar composition × 154 lb, independently of the derive; tamper-proven (924→999 reddens).
- **Essentials tab (chunk 6):** converted to the demo's `sh-tile` + a corner coverage **dot** (green/yellow/red/hollow-blue) + a top **dot legend**. Luneth: **"good enough"** (a few small tweaks he'll make himself).
- **§00.A:** the 924/1848 goal is **Wallach-sourced** (EPIGEN-000089: 1 oz/100 lb, corroborated in Let's Play Doctor), expressed in mg via product composition — NOT a Youngevity target. Resolved source-rule review: `chronicle/contradictions/2026-07-12-trace-rare-600mg-goal-source.md`.

## ★ THE PAGE-REPLICATION TECHNIQUE (how to build a demo-faithful page — learned the hard way this session)
This is the method that makes demo pages go right the first time. When it was skipped (chunk 6 attempt 1), the tab shipped a bad visual match and Luneth rejected it. **Follow it for every visual/page chunk:**
1. **Extract the demo's EXACT CSS/JS with PYTHON — never grep** (grep truncates the demo's 600 KB inlined long lines) and **never infer** a base rule. Read the real bytes (memory [[extract-demo-css-exact-with-python]]).
2. **Translate bad demo code → clean app code.** Adopt only the STYLES/FONTS; reuse existing app design tokens; do NOT copy the demo's code/data/prose; do NOT bloat the build with walls of CSS (memory [[demo-vision-not-letter]]).
3. **VISUALLY VERIFY — screenshot + LOOK.** Render the surface headless (puppeteer), Read the PNG, compare to the demo. **A structural render-probe (DOM counts, "dots exist") is NOT a visual check** — it passes on a surface that looks completely wrong. This was the failure. (memory [[screenshot-verify-visual-chunks]])
4. **Common gotchas found this chunk:** CSS-variable **scope** (`--fam-*` were on `.kd-ep`, not the drawer, so `.sh-tile` never inherited them → transparent bars); use the friendly **`common_name`**, not the layout's UPPERCASE display name, for tile names.

## ★ THE GOVERNING DOCTRINE (unchanged; still non-negotiable)
- Canonical demo = ONLY `temporary/knowledge-drawer-prototype.html`. It is the DESIGN / VISION; its code is deliberately messy — RE-CREATE on REAL data, never copy.
- NEVER reuse an old app component to fill a gap; if the demo doesn't specify something, STOP and ASK.
- Prose is machine-contained (`view-copy.json` via `ui()`); the only prose is the reviewed entity lede.
- PROVE everything (grep / invariant / **rendered screenshot**). Luneth is the visual sign-off gate: build one small chunk → build+invariants+probe → **screenshot + show him** → sign-off → round-close.

## ★ NEXT (Luneth's call — do NOT assume; confirm)
1. ✓ **Chunk-6 tweaks — DONE (2026-07-12, commit d6bf79fc).** Coverage dots 9px→6px; legend dots nudged onto the uppercase cap-height (`.kd-cov-legend .kd-cov-dot { top:-1px }`); tiles KEEP our friendly common_name (Luneth chose our naming over the demo's "Vitamin B3/D3"); the hollow "Present" dot is KEPT (Luneth confirmed — it is the live present-but-unquantified state for ~8 products, not obsolete). STILL OPEN (Luneth has not ruled): the mid-dose trace group's section label "Electrolytes & major minerals" (holds boron/cobalt/…/zinc) is likely a demo typo, kept 1:1 — confirm keep-or-fix before the inner-page work.
2. **Trace/rare INNER-page design (the next real piece):** when you click a trace/rare mineral, show the "covered as a GROUP" explanation + how 924 was calculated + the therapeutic **1,848 mg** tier (2 separate doses). Per Luneth this is a per-element design conversation — design fresh from the demo vision, get his eyes. The therapeutic number is derived + carried in `pdm-coverage-data.json` but NOT displayed yet.
3. **Owed data fixes:** Cal Toddy label reconciliation (`Cal_Toddy_Facts.png` in temporary/labels/ — currently present-only; re-derive + re-seal); Group-B tunable factor default 1.0 (red-algae rare-earth content not §00.A-established).

## THREAD 2 (QUEUED — separate workstream) — Search G-7 + book mining
Outstanding, in order: (1) SEAL the 2 search source files (`eden/corpus/search-enrichment.json` + `eden/catalog/search-entities.json`); (2) resume mining search-first from Immortality element A-Z at **Mn-Manganese** (`.claude/rules/search-corpus.md`); (3) cross-book capture the wrongly-skipped charged treatises; (4) general-interest lay topics (men's-health/strength/testosterone) [[general-interest-lay-topic-tagging]]; (5) port the P2 CHARGED gate (homosexuality/intersex never in search unless explicitly named) [[charged-search-gate]].

## ★ KEY REMINDERS
- **Round-close** ([[creators-log-append-gotchas]]): Creator's Log `--summary` ≤280; pass `--detail` via `"$(cat file)"`; the log embed bakes into `dist/main.js` at BUILD time → **log → rebuild → commit**.
- **safe_write** ([[safe-write-crlf-flip]]): pass **LF-only** content (safe_write applies the platform EOL itself + verifies byte-equal — passing CRLF breaks its self-check); edit one file many times → read once + apply all + write once.
- **Corpus edits** ([[editing-sealed-corpus-claims]]): edit the DRAFT via `mine_batch.py apply` (dose is an editable field) → `corpus_seal.py` (USER-ONLY, needs explicit per-invocation approval) → `build_embeds.py` → invariants.
- Authoritative doctrine = memory [[demo-vision-not-letter]] + [[search-is-ask-wallach-popup]] + [[home-page-curation-philosophy]] + THIS file. Master index: `chronicle/OVERHAUL-BLUEPRINT.md`.
