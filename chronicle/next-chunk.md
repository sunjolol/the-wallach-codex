# ★★★ NEXT SESSION — READ THIS FIRST.

**Board 93/93 green** (was 92; added `entity_page_enriched_matches_search`). Corpus **kv=476** (no re-seal — search-enrichment is the deliberately-unsealed working file).

## ✅ DONE 2026-08-19 — pages now match search + nutrient pages cleaned + See-N-more cap
- **Completeness fix (GATED, forever):** every condition/essential page now lists EXACTLY the claims search finds for it. `entity_page_derive.search_sections` now includes `also_about` (was subject-only — the root of the recurring "search shows more than the page" bug; 1,086 also_about claim-instances were dropped from pages). New gate **`entity_page_enriched_matches_search`** (+ negative test) independently re-derives `claimsForSubject` and asserts page.search == it on all 601 pages, so it can never silently drift again.
- **See-N-more cap:** entity-page.ts Worth-Knowing caps each facet at 7 answers with a "See N more answers" reveal (`kd-ep-more--answers`). render_probe_knowledge record-collapse assertions made robust to record volume.
- **Relevance prune (ESSENTIALS ONLY):** 425 `also_about` removals from search-enrichment.json = 120 other-nutrient definitions + 297 incidental name-drops + 8 residual. **ALL condition-protocol claims KEPT** (Luneth's decision — broad nutrients like vitamin C are NOT gutted; they keep their treatment uses). Lean-conservative keeps: electrolyte/omega group claims + the cobalt↔B12 pair. Conditions/Explore keep full also_about breadth (unchanged).
- **answer_full visual CONFIRMED:** the 41 rich answers render well (paragraph breaks fine) — the prior "⚠ VISUAL UNCONFIRMED" item is closed.

## ▶ NEXT TASK — the 28 needs_new_topic ruled claims (Luneth's curation)
`chronicle/frontface-ocr/ruled-2026-08-18/enrich-worklist.json` — the `needs_new_topic:true` claims (Hunza / Glacial Milk, resveratrol, Blue Zones, culinary ashes, longevity, Li-Ching-Yun, etc.). No resolving subject → NEW topic entities = your curation. Author topic names/structure WITH him, register in search-entities, enrich to the same rich `answer_full` bar. 8 also need a question authored (`recovered_question:null`).

## AFTER THAT
The **92 UNSEALED** unverified ruled claims: recover from `temporary/claim-ruling-dashboard.html` ([[ruling-dashboard-is-recovery-source]]), seal, vision-verify, enrich — same pipeline, same answer_full bar.

## GENESIS
`genesis` → run genesis.py, report the board, then resume the 28 needs_new_topic curation unless redirected. New invariant red = the only response.
