# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-26 · BATCH 2 (high-value 6) SEALED LIVE at kv402; 31 elements remain; NEXT = Batch 3)

# ★★★★★ READ FIRST (plain language)
The enrichment queue (39 elements of "Worth knowing" search claims) is being pushed live in **selective batches** — Luneth reviews a batch in an exact-form review artifact, approves, then authorizes the seal. **Batch 1 (zinc + magnesium) + Batch 2 (the high-value 6: omega-3 · vitamin-c · vitamin-a · vitamin-d · iron · calcium) are DONE + LIVE** (corpus sealed kv402; board green 77/77). The review→filter→finalize→**pre-seal RED-gate check**→seal→wire→build→probe pipeline is PROVEN, TOOLED, and PERSISTED. `corpus_seal` is Luneth-authorized each time (he ran/OK'd it).

## ★★★ NEXT TASK: SEAL BATCH 3 (Luneth picks the elements)
31 elements remain (list below). Recommend the next tier by search-value: the **B-vitamins** (b1·b2·b3·b5·b6·b9·b12 — commonly searched) + **copper · chromium · potassium · iodine · vitamin-e**. Luneth names the batch; then run the proven recipe below using `temporary/enrichment-queue/pilot/corrected_master_queue.json` as the seal source (all fixes + touch-ups baked in).

## THE 31 REMAINING ELEMENTS (queued, re-verified, ready to batch)
vitamin-b1 · vitamin-b2 · vitamin-b3 · vitamin-b5 · vitamin-b6 · vitamin-b9 · vitamin-b12 · vitamin-e · vitamin-k · biotin · choline · inositol · flavonoids · chromium · copper · vanadium · iodine · germanium · manganese · sodium · potassium · phosphorus · boron · sulfur · cobalt · lithium · molybdenum · chloride · arginine · taurine · tryptophan

## HOW TO SEAL THE NEXT BATCH (proven recipe — Batch 1 + 2)
The reusable scripts live in this session's scratchpad (`.../eaf40b58-.../scratchpad/`): `build_batch2_seal.py`, `verify_drafts_batch2.py`, `compute_wiring_batch2.py`, `precheck_new_claims.py`, `reset_two_drafts.py`, `fix_atp_gloss.py`, `add_glossary_term.py`, `build_review_html.py`, `batch2_analyze.py`. Repoint the PILOT list + the scratchpad STAGE paths, then:
1. Luneth names the elements.
2. Build a focused exact-form REVIEW ARTIFACT (batch2_analyze.py → build_review_html.py: byte-verify every verbatim ⊆ book source, resolve every enrich_existing, render Q→short→full→verbatim) → Luneth approves (the visual-verification gate). SendUserFile the HTML.
3. `build_batch2_seal.py` (repoint PILOT + STAGE): filters per-book raw+enrichmap to the chosen elements from the corrected queue; also_about filtered to resolvable slugs; writes seal-staging.
4. `corpus_extract finalize --book <b> --raw <staged raw>` per affected book — **ONE finalize per book** (a 2nd finalize DROPS the 1st AND inflates ids). If you must re-finalize (e.g. to fix a claim_text), FIRST reset that book's draft to sealed content (see reset_two_drafts.py) so ids stay contiguous (existing_max_seq reads shard+draft — memory refinalize-inflates-ids).
5. **★ NEW — PRE-SEAL RED-GATE CHECK (`precheck_new_claims.py`): run the 112-style new draft claims through references_resolve · claim_text_term_gloss · internal_refs_out_of_prose · prose_contained BEFORE the seal.** This caught the ATP-gloss red in Batch 2 pre-seal and saved a re-seal cycle. Fix any red in the queue's answer_full → re-finalize (with the reset above) → re-check. Add any missing jargon to glossary.json (hand-authored, writable) to clear the jargon warning.
6. Pre-flight: `corpus_verify.run_checks(skip_index_derive_check=True)` + `corpus_seal.draft_offset_failures()` both empty.
7. `verify_drafts_batch2.py` (capture new ids — run PRE-seal; the count math needs pre-seal sealed counts) → **Luneth authorizes `corpus_seal`**.
8. `compute_wiring_batch2.py` (merge enrichment + entities). **WATCH: id collisions → widen also_about, never clobber (self-subject widen suppressed); and ALREADY-REGISTERED entities (like iron/calcium in Batch 2) must be UNION-merged, never overwritten — preserve existing synonyms/related.** → `safe_write rewrite` search-enrichment.json + search-entities.json (post-seal).
9. **★ GLOSS AS YOU ENRICH (Luneth standing rule 2026-07-26 — memory gloss-scientific-terms-as-you-enrich):** before the build, add a plain-language DOTTED-LINE HOVER for every overly-scientific/lesser-known term in the batch's reader-facing text (spelling an acronym out is NOT the fix). Data-only: add to `dashboard/assets/data/glossary.json` ({term,plain,category,aliases?}; `plain` must be number-free per glossary_wellformed — vitamin designations like B2/D3 are fine, a real dose is not). `views/glossify.ts` auto-wraps the first occurrence everywhere (search answer + full claim_text + verbatim + entity pages). Tools in the scratchpad: `gloss_audit.py <subject>` surfaces candidates, `gloss_add.py::add_batch` inserts+dedups. Gloss the scientific (enzymes/hormones/chem/anatomy); SKIP the well-known (protein, hormone, cancer). **The 8 already-enriched elements (zinc·magnesium + the high-value 6) are DONE — glossary 234→325 terms, 2026-07-26.**
10. `build_embeds` → `build.mjs` → `invariants` → `render_probe_search` (update the calcium/other hardcoded answer-count anchors if the batch grew that element — verify the new number = distinct claim ids in the entity-page record, don't just bump to pass) → round-close (build-log · creators-log · re-inline build · commit+push).

## WHAT SHIPPED (batch 2, kv402)
- **112 new claims** across 6 books (dddl 26 · epigenetics 40 · hells-kitchen 11 · immortality 17 · lets-play-doctor 9 · rare-earths 9) + 42 reuse enrichments.
- search-enrichment 475→617 (142 new + 12 non-destructive collision merges), search-entities 88→92 (4 new + iron/calcium union-merged). glossary +avitaminosis. corpus_seal kv401→kv402 (1467→1579 claims).
- Board 77/77 · render_probe_search PASS · omega-3 Ask-Wallach visually confirmed (107 answers, 5 families).

## STILL DEFERRED (after the queue is sealed)
- **vitamin-d hero shows canonical "Cholecalciferol"** (canon display-name) — flag for a possible future "Vitamin D" display preference (applies to any vitamin whose canon name is the chemical form).
- ~14 substantive elements NOT yet mined (9 amino acids — re-stage; + omega-6, omega-9, silica, silver, tin, nickel, oxygen, hydrogen, carbon, nitrogen).
- 35 rare-earth trace minerals → the plant-derived-mineral GROUP treatment (never individual).
- **Design elements** (the illustrated hero per element, selenium/omega style) — the pass AFTER the claims are sealed.
