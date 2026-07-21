# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-21)
# ★★★★ 2026-07-21 (SESSION 8) — PLANT-DERIVED ENRICHMENT · BATCH 1 SEALED + LIVE · board 77/77, committed + pushed (01cc5a42)

**New phase (Luneth):** enrich ALL 90 elements in the uniform entity-page style so browsing becomes second-nature — but FIRST complete the 35 plant-derived (trace_pdm) minerals so the whole complex is accounted for before moving on. A read-only 6-book scout produced the full candidate inventory (30 new + 12 retags, organised by colour-family, 67 metallic-trap rejects) → the **Ratification Console** artifact: https://claude.ai/code/artifact/26714d57-f84e-44d0-8c62-ca48c749ef04

## What shipped this session (batch 1 — "clean colour wins", commit 01cc5a42)
6 new group claims tagged `about:[colloidal-minerals]` (corpus_seal → kv 371, 1341 claims), propagated onto all 35 trace_pdm pages' group_record:
- **quote (orange):** DDDL-000121 Fountain-of-Youth · DDDL-000122 astringency · DDDL-000125 control-group-of-five
- **personal_anecdote (violet):** DDDL-000123 discovery · DDDL-000124 Mineral Toddy battle + resolution (full arc in claim_text — cheaper-source degradation → American Longevity / Virgin Earth return to the original Rockland deposit; **book-facts only, no "still sold today"**) · IMMORT-000234 Mandela
- +6 search-enrichment entries (subject `colloidal_minerals`). Group section: **9→15 claims, 2 blocks/1 colour → 4 blocks/3 colours** (teal+violet+orange). Screenshot-verified on strontium.

## The mining flow that WORKED — reuse verbatim for batches 2-4
1. Author raw.json per book: `{kind, about:["colloidal-minerals"], conditions:[], claim_text=<full summary — becomes the displayed `answer`>, verbatim=<byte-exact from the .txt>, tags:["plant-derived-group",<book_id>], confidence:"high"}`.
2. `PYTHONUTF8=1 python eden/tools/corpus_extract.py finalize --book <id> --raw <raw>` → snaps verbatim to book bytes, assigns IDs, writes drafts/ + reports/. (locator convention: DDDL chapter/page=null + char_offset; immortality has `Screenshot (NN)` markers → set screenshot.)
3. Present report + enrichment card-copy → Luneth ratifies.
4. `PYTHONUTF8=1 python eden/tools/corpus_seal.py` (bare) — Luneth authorised me to run it; normally USER-ONLY. Promotes drafts + reseals + bumps kv.
5. Merge search-enrichment entries (subject/also_about/facet/question/answer_short/topics) via safe_write. `answer` DERIVES from claim_text; `answer_short`+`question` are authored.
6. `build_embeds.py` (12 artifacts) → `node tools/build.mjs` → `invariants.py` → render-probe screenshot (strontium entity page) → build-log + creators_log → RE-inline build.mjs → commit + push.
- **COLOUR = claim KIND's family** (kindCategory in view-copy.json): teal=definition/mechanism/interaction/diagnostic_pattern/food_source · green=dose/protocol · amber=deficiency_sign/toxicity_sign · orange=prevalence/prognosis/quote · violet=personal_anecdote · red=contraindication.

## NEXT — remaining plant-derived batches (all in the Ratification Console)
- **Batch 2 — 12 teal RETAGS:** tag existing already-sealed claims into the group (add `about:[colloidal-minerals]` via mine_batch/edit-path, verbatim untouched) + author enrichment. Audit the 67 metallic-trap rejects while here.
- **Batch 3 — 4 green dose/protocol** (NEW-26 maintenance dose 1 oz/100 lb, NEW-27 cravings, NEW-28 water, NEW-29 Nez Perce): **ALL carry numbers needing page-image verification; NEW-29 fringe.** First real green on the group.
- **Batch 4 — 19 teal new** (origin/sources/history/mechanism). Several **cross-book number conflicts to rule on:** humic-shale ~19,000 mg/qt (HK) vs ~38,000 mg/L (RARE/EPS); 77 vs 60 minerals; Carboniferous vs 75-million-years; "five" vs "eight" long-lived cultures.
- **Fringe parked for Luneth:** rare-earths-double-lifespan (NEW-17, NEW-22), Nez Perce 30-50% glucose (NEW-29); HK four-forms dedup question.
- **THEN (after plant-derived complete):** bring the 3 still-to-do demo surfaces live — **Ask Wallach, Products tab, Conditions tab** (+ their detail views). Everything else in live already beats the dated demo. See memory `demo-elements-still-to-do`.
