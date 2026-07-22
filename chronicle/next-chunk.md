# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-22, Conditions-tab redesign close)
# ★★★★★ 2026-07-22 — Conditions TAB redesigned (ghost-number cards + 12-category colour-coding + Unbounded) · board 77/77 · committed+pushed
# ▶ NEXT: the CONDITION DETAIL view (Osteoporosis exemplar). Mining is PAUSED; demo-to-live work continues.

## TASK CONTEXT (carries across the whole demo-to-live effort — memory demo-elements-still-to-do + demo-layout-yes-demo-style-no)
- THE demo = `file:///…/temporary/knowledge-drawer-prototype.html` (NOT dashboard/components/*.html). Only 5 surfaces from it are not-yet-live:
  1. Products tab · 2. Products detail · 3. Conditions tab ✅ DONE · 4. Conditions detail (Osteoporosis is the ONLY designed exemplar) ← NEXT · 5. Ask-Wallach popup/side-menu WORDING.
- HARD RULE: take the demo's LAYOUT/STRUCTURE, RESTYLE to CURRENT standards. Fonts: `--ds-font-display`=Unbounded (display), `--ds-font-sans`/`--ds-font-serif`=Space Grotesk (body), `--ds-font-display-interface`=Chakra Petch (labels), `--ds-font-display-artifact`=Bruno Ace (numbers), `--ds-font-mono`=JetBrains. NO serif except crown-jewel Wallach pull-quotes. Visuals identical in spirit, CODE PROPER (no spaghetti/inline prose/cut corners). Reference current-best surfaces: omega-3/6 detail, Absorption tab, plant-derived-mineral detail.

## ✅ LANDED THIS SESSION — Conditions TAB (the "ghost number" design, option D of a 4-option mockup)
- 1-col A-Z list → 3-col GRID of cards: big faded claim-count (Unbounded ~3rem) in the condition's CATEGORY COLOUR top-right (the "ghost"); category CHIP (coloured dot + mono label — the browsing "delight", context on what each condition affects); NAME in Unbounded; foot "N CLAIMS · M NUTRIENTS" (mono). Sorted claim_count desc (conditionsByWeight, presentation-only). Hover: border+ghost → category colour, bg → white, lift. `--cat` carries the colour inline per card.
- NEW 12-category body-system system mapping ALL 502 conditions (Luneth-approved taxonomy + "map all then review"; he'll refine later with agents):
  - Data: `dashboard/assets/data/condition-categories.json` (hand-authored curation: `{categories:{id:{label,color}}, conditions:{slug:id}}`). Registered in `eden/derived/MANIFEST.json` accounted (data_artifacts_accounted green, 24 files).
  - Schema `core/schemas/condition-categories.ts` (+ index export); reader `state/condition-categories.ts` (`conditionCategory(slug)→{slug,label,color}|null`, graceful).
  - Cats+colours: bones-joints-muscles #4f76a3 · mind-nerves #7b62a3 · heart-blood-circulation #a83f48 · skin-hair-nails #bd7b34 · digestion-liver #6b8a43 · hormones-metabolism #2c8a7e · reproductive-urinary #a25490 · respiratory #3f8fa8 · immunity-infection #c9a13b · eyes-ears-mouth #5860a8 · cellular-systemic #5f636b · general-other #8a8a86.
- Render: `views/knowledge-corpus.ts` renderConditionRow (D markup) + `drawer-knowledge.css` .kd-condition-row block. Content-aware search filter preserved (grid wrapper doesn't change the flat querySelectorAll).
- Design ref (LOCAL, gitignored): `temporary/condition-cards-brainstorm.html` — the 4-option mockup (A editorial / B colour-rail / C colour-band / D ghost-number ← chosen). Ghost fix he asked for: `top:0` not negative (overflow:hidden clips a negative top).
- Verified: build OK · invariants 77/77 · render_probe_knowledge PASS (rowCount 502, PAGE_ERRORS 0) · headless screenshots default+hover. Earlier this session a CHECKPOINT commit (4b722122, tan first-iteration cards) preceded the D redesign — superseded, kept in history.

## ▶ NEXT — CONDITION DETAIL VIEW (Osteoporosis exemplar; open demo → Conditions → Osteoporosis. Depression etc. show a "generated in the real build" placeholder — only Osteoporosis + Calcium are wired)
Demo detail = faceted entity-page in the SAME card language, with condition blocks:
1. Header: name + "N CLAIMS · N BOOKS · ALSO: <synonyms>". claim_count ✓ + books_cited.length ✓ live; SYNONYMS are NOT in CorpusCondition (they ARE in entity-page/search schemas) — decide: derive/add-a-field/omit-when-absent.
2. Intro lede — live has a DERIVED conditionSynopsis ("Wallach links X to a deficiency of …"); demo has bespoke prose. Keep the derived (scalable to 502, honest); don't fabricate.
3. ★ WALLACH'S PROTOCOL ("THE APPROACH" green card). ⚠ §00.A: the demo text COMPOSITES several claims — do NOT compose. FEATURE the REAL sourced protocol claim_text. Osteoporosis = WAL-CLM-DDDL-000060 ("Osteoporosis treatment includes betaine hydrochloride and pancreatic enzymes (75-200 mg three times daily before meals) plus calcium and magnesium at 2,000 and 1,000 mg/day or more for the first 30 days."). Condition carries a `protocols` role in claims_by_role.
4. NUTRIENTS TO RESTORE chips — essentials_involved (demo unifies; live splits cause/treated/also — decide).
5. ★ BEST PRODUCTS FOR THIS — rows "covers N/M · $price" ranked by how many of the condition's nutrients each product covers. NEW capability: state/recommender.ts + product-recommender-data.json exist; scope the coverage to a condition's essentials subset. Wholesale-featured price (memory wholesale-featured-price).
6. THE FULL PICTURE — claims_by_role groups as a COLLAPSIBLE facet accordion (WHAT TO DO / WHY IT HAPPENS / …) with facet-coloured borders. Live renderConditionDeep already renders role-groups (renderCorpusClaim); restyle to the collapsible faceted format (reuse the entity-page kd-ep-* facet pattern). Consider colouring the detail by the condition's CATEGORY colour (conditionCategory(slug)).

## ⏸ AFTER the detail: remaining 3 demo surfaces — Products tab+detail (confirm what the demo ADDS beyond live knowledge-products.ts before rebuilding) · Ask-Wallach WORDING (rail "SEARCH"→"Ask Wallach" + drawer copy; NOT a rebuild).

## ⏸ PARKED — Batch-4 book mining (resume only if Luneth redirects): re-dedup each teal-new candidate vs ALL 7 sealed books first (memory dedup-across-all-books-before-authoring). Byte-verified passages in temporary/plant-derived-research-2026-07-17/.

## 🔴🔴 REVIEW PROCESS — Luneth's hard rule (EVERY corpus/content touch): before sealing ANY claim show it in EXACT final form — QUESTION → SHORT ANSWER → (full only if it adds) → QUOTE — and approve the CLAIM, never a side-question. Unreviewed = log "unreviewed", never "approved". corpus_seal is USER-ONLY.

## 🔧 KEY MECHANICS
- Preview pane CACHES the bundle + snapshots new tabs as `data:` — for a reliable visual use the headless puppeteer screenshot (scratchpad `shot_conditions.js` pattern): fresh chrome loads current dist + CSS; dismiss the onboarding modal ("just browsing") first, then screenshot.
- CSS is LINKED not bundled — CSS edits need NO rebuild; JS/data edits need `node tools/build.mjs`.
- Curation-layer pattern (reused for categories): `assets/data/*.json` (hand-authored) + `core/schemas/*.ts` (+ index export) + `state/*.ts` reader + MANIFEST `accounted` entry.
- Round-close: build → invariants → probe → build-log → `creators_log.py append` → RE-inline build → commit + push.
- Windows/UTF-8: prefix `PYTHONUTF8=1`; safe_write payloads LF; every project write via `safe_write`.
