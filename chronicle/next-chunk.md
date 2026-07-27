# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-26 · BATCH 3 SEALED LIVE at kv403; 19 elements remain; NEXT = Batch 4)

# ★★★★★ READ FIRST (plain language)
The enrichment queue (39 elements of "Worth knowing" search claims) ships live in **selective batches** — Luneth reviews a batch in an exact-form review artifact, approves, then authorizes the seal. **DONE + LIVE: Batch 1 (zinc+magnesium), Batch 2 (the high-value 6), Batch 3 (7 B-vitamins + copper·chromium·potassium·iodine·vitamin-e).** Corpus sealed kv403; board green 77/77. The review→stage→finalize→**pre-seal RED-gate check**→seal→wire→**gloss**→build→probe pipeline is PROVEN, TOOLED, PERSISTED, and now GENERIC (scripts take the element list + a stage dir as args). `corpus_seal` is Luneth-authorized each time.

## ★★★ NEXT TASK: SEAL BATCH 4 (Luneth picks the elements)
19 elements remain (list below). Run the proven recipe using `temporary/enrichment-queue/pilot/corrected_master_queue.json` as the seal source.

## THE 19 REMAINING ELEMENTS (queued, re-verified, ready to batch)
vitamin-k · biotin · choline · inositol · flavonoids · vanadium · germanium · manganese · sodium · phosphorus · boron · sulfur · cobalt · lithium · molybdenum · chloride · arginine · taurine · tryptophan

## HOW TO SEAL THE NEXT BATCH (proven recipe — Batches 1–3)
Generic reusable scripts in this session's scratchpad (`.../eaf40b58-.../scratchpad/`): `review_analyze.py <out.json> <slug...>` + `review_html.py <analysis> <out.html> <title> <sub>` (byte-verified review artifact), `seal_stage.py <stage> <slug...>`, `verify_drafts_gen.py <stage>`, `compute_wiring_gen.py <stage>`, `precheck_new_claims.py <stage>`, `gloss_audit.py <subject>`, `gloss_add.py::add_batch`. Pass the element list as args — no repointing.
1. Luneth names the elements.
2. `review_analyze.py` → `review_html.py` → SendUserFile → Luneth approves (visual-verification gate).
3. `seal_stage.py <stage> <slugs>` (skips books with no raw file; iaiyh has none).
4. `corpus_extract finalize --book <b> --raw <stage>/raw/<b>.raw.json` per affected book — ONE finalize per book. To re-finalize (e.g. a claim_text fix), FIRST reset that book's draft to sealed content, else ids inflate (existing_max_seq reads shard+draft — memory refinalize-inflates-ids).
5. **PRE-SEAL RED-GATE CHECK: `precheck_new_claims.py <stage>`** — references_resolve · claim_text_term_gloss · internal_refs_out_of_prose · prose_contained. Caught the ATP gloss (B2) and the "Table 12-2" ref (B3) BEFORE their seals — fix in the queue's answer_full → reset+re-finalize → re-check.
6. Pre-flight: `corpus_verify.run_checks(skip_index_derive_check=True)` + `corpus_seal.draft_offset_failures()` both empty.
7. `verify_drafts_gen.py <stage>` (capture ids, run PRE-seal) → **Luneth authorizes `corpus_seal`**.
8. `compute_wiring_gen.py <stage>` (WATCH: id collisions widen also_about never clobber, self-subject suppressed; ALREADY-REGISTERED entities UNION-merged, never overwritten) → `safe_write rewrite` search-enrichment.json + search-entities.json (post-seal).
9. **★ GLOSS AS YOU ENRICH (Luneth standing rule — memory gloss-scientific-terms-as-you-enrich):** `build_embeds` FIRST (so gloss_audit sees the new claims via the regenerated search index), then `gloss_audit.py <subject>` per element → curate the scientific/lesser-known terms (skip well-known) → `gloss_add.py::add_batch` (dedups + rejects smuggled numbers; vitamin designations B2/D3 are fine). Add a plain DOTTED-LINE HOVER for every scientific term; `views/glossify.ts` auto-wraps it. Clear any `jargon_terms_glossed` warnings too.
10. `build.mjs` → `invariants` → `render_probe_search` + `render_probe_knowledge` (update any hardcoded answer-count anchor if the batch grew that element — verify the new number = distinct claim ids in the entity-page record) → round-close (build-log · creators-log · re-inline build · commit+push).

## WHAT SHIPPED (batch 3, kv403)
- 217 claims (153 new + 64 reuse) across 6 books. search-enrichment 617→820, search-entities 92→100, glossary 325→393 (+68 in-batch). corpus_seal kv402→kv403 (1579→1732).
- Board 77/77 · probes PASS · tooltips render (vitamin-b1→thiamine, copper→ceruloplasmin, iodine→thyroid).

## STILL DEFERRED (after the queue is sealed)
- **vitamin-d hero shows canonical "Cholecalciferol"** (canon display-name) — possible future "Vitamin D" display preference (applies to any vitamin whose canon name is the chemical form; e.g. B1 shows "Thiamine", B3 "Niacin", B9 "Folate").
- ~14 substantive elements NOT yet mined (9 amino acids — re-stage; + omega-6, omega-9, silica, silver, tin, nickel, oxygen, hydrogen, carbon, nitrogen).
- 35 rare-earth trace minerals → the plant-derived-mineral GROUP treatment (never individual).
- **Design elements** (the illustrated hero per element, selenium/omega style) — the pass AFTER the claims are sealed.
- Memory index at ~21KB — run the consolidate-memory skill at a natural break (deferred all session; hook fires early per memory-consolidation-threshold).
