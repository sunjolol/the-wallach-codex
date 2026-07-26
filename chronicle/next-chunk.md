# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-26 · BATCH 1 (zinc+magnesium) LIVE at kv401; entity/search hero synonym-dump fixed; ALL 10 touch-ups done → the WHOLE 39-element queue is seal-ready; NEXT = Batch 2)

# ★★★★★ READ FIRST (plain language)
The enrichment queue (39 elements of "Worth knowing" search claims) is being pushed live in **selective batches** — Luneth reviews a batch, approves, then he seals it. **Batch 1 (zinc + magnesium) is DONE + LIVE** (corpus sealed kv401; board green 77/77). The re-verify→filter→finalize→seal→wire→build→probe pipeline is PROVEN, TOOLED, and PERSISTED; every remaining claim is verified seal-ready. `corpus_seal` is user-run (Luneth authorizes each seal).

## ★★★ NEXT TASK (Luneth 2026-07-26): SEAL BATCH 2 = the HIGH-VALUE 6
**omega-3 · vitamin-c · vitamin-a · vitamin-d · iron · calcium.** Run the proven pipeline (see "HOW TO SEAL THE NEXT BATCH" below), using `temporary/enrichment-queue/pilot/corrected_master_queue.json` as the seal source (it has all fixes + the 10 touch-ups baked in). Steps: build a focused exact-form REVIEW ARTIFACT for these 6 → Luneth approves → `scripts/build_pilot_seal.py` (repoint PILOT list + the scratchpad paths) filters raw+enrichmap → finalize per book → **Luneth runs corpus_seal** → wire enrichment+entities → build_embeds → build → invariants → render_probe_search → round-close. WATCH: enrichment id collisions (widen also_about, never clobber — see WAL-CLM-DDDL-000053 precedent) + the `claim_text_term_gloss` gate (a common_swaps term in a new claim_text reddens the board post-seal; fix the draft claim_text + re-seal). Then continue batching the remaining 31.

## WHAT SHIPPED (batch 1, commit c942e724)
- **zinc** (36 claims · Zn · 32 synonyms) + **magnesium** (35 · Mg · 44 synonyms) sealed + wired + live in Ask-Wallach search.
- 48 new claims finalized across 6 books + 24 reuse enrichments + 2 canon_ref entities. search-enrichment 404→475, search-entities 86→88.
- Re-sealed once (kv400→kv401) to fix one gloss regression the `claim_text_term_gloss` gate caught post-seal.

## THE RE-VERIFICATION IS DONE FOR ALL 39 ELEMENTS (do NOT repeat it)
The queue's army left 146 claims flagged REVISE with STALE/unreliable verify flags (some already-fixed, some genuinely broken — the flag can't be trusted as a seal filter). A 13-agent workflow re-verified ALL 146 against book context; every fix was deterministically re-checked against book bytes. Results persisted (gitignored) in **`temporary/enrichment-queue/pilot/`**:
- `corrected_master_queue.json` — the FULL queue with the 23 verified fixes applied (all elements). **Use THIS, not the original master_queue, as the seal source.**
- `reverify_results.json` — trustworthy per-claim status for all 146 REVISE (SEAL_READY / HOLD, with the fix text).
- `qid_map.json` — proven queue_id → {book, raw_index} map (all 547 mine_new claims).
- `scripts/` — the reusable seal pipeline (paths hardcode the OLD session scratchpad — repoint before reuse).

## HOW TO SEAL THE NEXT BATCH (proven recipe)
1. Luneth names the next elements (biggest/highest-search-value first — see the readiness table logic in `scripts/readiness.py`).
2. Build a focused exact-form REVIEW ARTIFACT for those elements (from `corrected_master_queue.json`) → Luneth approves (the visual-verification gate).
3. `scripts/build_pilot_seal.py` (repoint PILOT list + paths): filters per-book raw+enrichmap to the chosen elements from the corrected queue, fixes baked in, also_about filtered to resolvable slugs, writes `seal-staging/`.
4. `corpus_extract finalize --book <b> --raw <staged raw>` per affected book (ONE finalize per book — it appends onto the sealed shard; a 2nd finalize DROPS the 1st).
5. Pre-flight: `corpus_verify.run_checks(skip_index_derive_check=True)` + `corpus_seal.draft_offset_failures()` both empty → seal will pass.
6. **Luneth runs `corpus_seal`** (user-only).
7. `scripts/verify_drafts.py` (capture new ids) → `scripts/compute_wiring.py` (merge enrichment + entities; WATCH for id collisions → widen also_about, never clobber) → `safe_write rewrite` search-enrichment.json + search-entities.json.
8. `build_embeds` → `build.mjs` → `invariants.py` (WATCH `claim_text_term_gloss` — a common_swaps term in a new claim_text reddens it; fix the draft claim_text + re-seal) → `render_probe_search` → round-close.

## TOUCH-UPS — DONE (2026-07-26; applied to corrected_master_queue.json, re-reviewed at each element's batch-seal)
All 10 resolved + validated (exact book substring, 60-1200 chars, answer numbers grounded):
- **iron-035** re-verified SEAL_AS_IS (workflow had dropped it; faithful, verbatim carries the 8-12%/3-5% figures; advocacy-conclusion defect already removed).
- **vitamin-b9-009** folic-acid answers confirmed + verbatim widened to the FIG. 8-1 Folic-Acid row cluster (was the wrong Copper/Fluoride row).
- **calcium-035** verbatim widened to the FIG. 8-1 header + CALCIUM row (self-documenting).
- **phosphorus-020** verbatim widened to the PHOSPHORUS 800/0.0/0.0 row cluster.
- **vitamin-k-010** verbatim set to the VITAMIN K 70/140/140 row (the earlier "missing 30" was a false positive - "30-day" is a column label).
- **vitamin-b3-008 / sodium-032** de-hedged ("about 3,000"->"3,000"; "~15 grams"->"15 grams").
- **copper-032 / vitamin-b12-004 / manganese-000** verbatims re-snapped to the sentence carrying the answer's figure (copper: the 8-12%->3-5% availability sentence; b12: the 1926 raw-liver sentence; manganese: the 10-20 mg body-content -> ear-bones/joint-cartilage span).
The whole 39-element queue is now seal-ready in corrected_master_queue.json (the seal source); reverify_results.json HOLD flags for the 5 are superseded.

## THE 37 REMAINING ELEMENTS (queued, re-verified, ready to batch)
omega-3 · vitamin-a · vitamin-b1 · vitamin-b2 · vitamin-b3 · vitamin-b5 · vitamin-b6 · vitamin-b9 · vitamin-b12 · vitamin-c · vitamin-d · vitamin-e · vitamin-k · biotin · choline · inositol · flavonoids · chromium · copper · vanadium · iron · iodine · germanium · manganese · sodium · calcium · potassium · phosphorus · boron · sulfur · cobalt · lithium · molybdenum · chloride · arginine · taurine · tryptophan

## STILL DEFERRED (after the queue is sealed)
- ~14 substantive elements NOT yet mined (9 amino acids — batch 8 staged in the OLD scratchpad, gone now; re-stage; + omega-6, omega-9, silica, silver, tin, nickel, oxygen, hydrogen, carbon, nitrogen).
- 35 rare-earth trace minerals → the plant-derived-mineral GROUP treatment (never individual).
- **Design elements** (the illustrated hero per element, selenium/omega style) — the pass AFTER the claims are sealed.
