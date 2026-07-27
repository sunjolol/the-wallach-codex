# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-26 · BATCH 4 SEALED LIVE at kv404; 14 elements remain; NEXT = Batch 5)

# ★★★★★ READ FIRST (plain language)
The enrichment queue (39 elements of "Worth knowing" search claims) ships live in **selective batches** — Luneth reviews a batch in an exact-form review artifact, approves, then authorizes the seal. **DONE + LIVE: Batch 1 (zinc+magnesium), Batch 2 (the high-value 6), Batch 3 (7 B-vitamins + copper·chromium·potassium·iodine·vitamin-e), Batch 4 (vitamin-k·biotin·choline·inositol·flavonoids — completes every vitamin/organic in the queue).** Corpus sealed kv404 (1782 claims); board green 77/77. The review→stage→finalize→**pre-seal RED-gate check**→seal→wire→**gloss**→build→probe pipeline is PROVEN, TOOLED, PERSISTED, and GENERIC (scripts take the element list + a stage dir as args). `corpus_seal` is Luneth-authorized each time.

## ★★★ NEXT TASK: SEAL BATCH 5 (Luneth picks the elements)
14 elements remain (list below). Run the proven recipe using `temporary/enrichment-queue/pilot/corrected_master_queue.json` as the seal source.

## THE 14 REMAINING ELEMENTS (queued, re-verified, ready to batch)
vanadium · germanium · manganese · sodium · phosphorus · boron · sulfur · cobalt · lithium · molybdenum · chloride · arginine · taurine · tryptophan

## ⚠ TWO FOLLOW-UPS LOGGED THIS SESSION (address when convenient — not blockers)
1. **flavonoids "What are flavonoids good for?" has no dedicated best-answer.** Batch 4's flavonoids-007 (a rich general-uses answer) was suppressed by a non-destructive collision on WAL-CLM-EPIGEN-000178 (already carrying the "Do flavonoids raise your ORAC?" antioxidants question). flavonoids WAS added to that claim's also_about, so the flavonoids page still surfaces it — but the crisp "what are flavonoids good for" question routes via the entity page rather than a dedicated answer. Options: mint a new claim from the EPIGEN-000178 benefits passage to host it, or leave it. Luneth aware.
2. **Batch-3 B3 enrichment on WAL-CLM-DDDL-000075 is ungrounded.** That claim's verbatim is a truncated Ca/Cr/V insomnia slice; the B3 enrichment ("Can niacin help with insomnia?") cites niacinamide/niacin doses that AREN'T in that quote. Same mis-grounding class Batch 4 caught for vitamin-k-010/inositol-013. Fix: re-point that enrichment to a claim whose verbatim carries the niacin dose (e.g. a fuller insomnia-protocol claim), or accept. Already sealed (kv403), so it's an enrichment-file edit, not a re-seal.

## HOW TO SEAL THE NEXT BATCH (proven recipe — Batches 1–4)
Generic reusable scripts PERSISTED in `temporary/enrichment-queue/pilot/scripts/` (gitignored but survives sessions on this machine): `review_analyze.py <out.json> <slug...>` + `review_html.py <analysis> <out.html> <title> <sub>` (byte-verified review artifact), `seal_stage.py <stage> <slug...>`, `verify_drafts_gen.py <stage>`, `compute_wiring_gen.py <stage>`, `precheck_new_claims.py <stage>`, `gloss_audit.py <subject>`, `gloss_add.py::add_batch`. Pass the element list as args — no repointing.
1. Luneth names the elements.
2. `review_analyze.py` → `review_html.py` → SendUserFile → Luneth approves (visual-verification gate). **WATCH the review analysis flags:** an enrich_existing whose queue verbatim DIFFERS from the sealed target is a mis-pointed existing_id (Batch 4 caught two — the answer pointed at a claim whose quote didn't contain the answered thing). Re-point to the correctly-grounded sealed claim, sync the queue verbatim + book/book_cite to that target, regenerate, THEN show Luneth.
3. `seal_stage.py <stage> <slugs>` (skips books with no raw file; iaiyh has none).
4. `corpus_extract finalize --book <b> --raw <stage>/raw/<b>.raw.json` per affected book — ONE finalize per book. To re-finalize (e.g. a claim_text fix), FIRST reset that book's draft to sealed content (truncate draft.claims to the sealed count via safe_write), else ids inflate (existing_max_seq reads shard+draft — memory refinalize-inflates-ids).
5. **PRE-SEAL RED-GATE CHECK: `precheck_new_claims.py <stage>`** — references_resolve · claim_text_term_gloss · internal_refs_out_of_prose · prose_contained (+ jargon WARN). Has caught the ATP gloss (B2 + B4) and the "Table 12-2" ref (B3) BEFORE their seals — fix in the queue's answer_full → reset+re-finalize that book → re-check. ATP fix = spell out "adenosine triphosphate (ATP)" (the gate wants the trigger word "adenosine" present).
6. Pre-flight: `corpus_verify.run_checks(skip_index_derive_check=True)` (errors == []) + `corpus_seal.draft_offset_failures()` (empty) both clean.
7. `verify_drafts_gen.py <stage>` (lockstep + captures ids + builds enrichment_addition.json) → **Luneth authorizes `corpus_seal`** → `python eden/tools/corpus_seal.py` (bare, no args — USER-ONLY, any flag is rejected).
8. `compute_wiring_gen.py <stage>` (WATCH: id collisions widen also_about NEVER clobber, self-subject suppressed; ALREADY-REGISTERED entities UNION-merged) → `safe_write rewrite` eden/corpus/search-enrichment.json + eden/catalog/search-entities.json from the stage's *.NEW.json (post-seal). **A collision on an already-enriched claim means OUR question is dropped (only also_about widens) — check the collision list and decide if the dropped question needs a home (see follow-up #1).**
9. **★ GLOSS AS YOU ENRICH (Luneth standing rule — memory gloss-scientific-terms-as-you-enrich):** `eden/tools/build_embeds.py` FIRST (regenerates search-index so gloss_audit sees the new claims), then `gloss_audit.py <subject>` per element → curate the scientific/lesser-known terms (skip well-known) → author plain defs → run a wrapper importing `gloss_add.add_batch(ADDS)` (dedups + rejects smuggled numbers; vitamin designations B2/D3 are fine). Clear any `jargon_terms_glossed` warnings too.
10. `build.mjs` → `invariants` (77/77) → `render_probe_search` + `render_probe_knowledge` → round-close (build-log · creators-log · **re-inline build** · commit+push).

## WHAT SHIPPED (batch 4, kv404)
- 65 claims (50 new + 15 reuse) across 4 books (dddl 8 · epigenetics 21 · immortality 20 · lets 1). search-enrichment 820→880, search-entities 100→105, glossary 393→446 (+53 in-batch). corpus_seal kv403→kv404 (1732→1782).
- Board 77/77 · probes PASS. Review re-pointed 2 mis-grounded enrich claims (vitamin-k-010→LETS-000076, inositol-013→LETS-000322 + vanadium trim); pre-seal check spelled out ATP.

## STILL DEFERRED (after the queue is sealed)
- **vitamin-d hero shows canonical "Cholecalciferol"** (canon display-name) — possible future "Vitamin D" display preference (applies to any vitamin whose canon name is the chemical form; B1 shows "Thiamine", B3 "Niacin", B9 "Folate", vitamin-k canon may show "Phylloquinone" — check).
- ~14 substantive elements NOT yet mined (9 amino acids — re-stage; + omega-6, omega-9, silica, silver, tin, nickel, oxygen, hydrogen, carbon, nitrogen). NOTE: arginine/taurine/tryptophan ARE in the queue (part of the remaining 14).
- 35 rare-earth trace minerals → the plant-derived-mineral GROUP treatment (never individual).
- **Design elements** (the illustrated hero per element, selenium/omega style) — the pass AFTER the claims are sealed.
- Memory index at ~21KB — run the consolidate-memory skill at a natural break (deferred all session; hook fires early per memory-consolidation-threshold).
