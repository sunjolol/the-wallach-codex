# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-26 · FIRST SELECTIVE SEAL DONE: zinc + magnesium are LIVE canon; the re-verify→seal→wire→build pipeline is PROVEN + TOOLED; 37 elements remain queued)

# ★★★★★ READ FIRST (plain language)
The enrichment queue (39 elements of "Worth knowing" search claims) is now being pushed live in **selective batches** — Luneth reviews a batch, approves, then it seals. **Batch 1 (zinc + magnesium) is DONE and LIVE** (corpus sealed at knowledge_version=401; search index carries them; board green 77/77). The rest of the queue is untouched and waiting for its turn. Nothing is auto-sealed — `corpus_seal` is user-run (Luneth authorized batch 1 explicitly).

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

## TOUCH-UPS STILL OWED (Luneth said "fix them all now" — NOT yet done; none are in batch 1)
Fix these in `corrected_master_queue.json` before their element's batch seals:
- **5 HOLD:** `iron-035` (re-verify — agent dropped it), `vitamin-b9-009` · `calcium-035` · `phosphorus-020` (re-snapped verbatim >1200-char cap → trim to a tighter exact slice containing the needed line), `vitamin-k-010` (dose number '30' absent from verbatim → proper re-snap or park).
- **2 hedge:** `vitamin-b3-008` ("about 3,000"→flat), `sodium-032` ("~15 grams"→flat).
- **3 resnap (optional polish):** `copper-032`, `vitamin-b12-004`, `manganese-000` (faithful to book but the quote is a narrower adjacent sentence than the answer's figure).

## THE 37 REMAINING ELEMENTS (queued, re-verified, ready to batch)
omega-3 · vitamin-a · vitamin-b1 · vitamin-b2 · vitamin-b3 · vitamin-b5 · vitamin-b6 · vitamin-b9 · vitamin-b12 · vitamin-c · vitamin-d · vitamin-e · vitamin-k · biotin · choline · inositol · flavonoids · chromium · copper · vanadium · iron · iodine · germanium · manganese · sodium · calcium · potassium · phosphorus · boron · sulfur · cobalt · lithium · molybdenum · chloride · arginine · taurine · tryptophan

## STILL DEFERRED (after the queue is sealed)
- ~14 substantive elements NOT yet mined (9 amino acids — batch 8 staged in the OLD scratchpad, gone now; re-stage; + omega-6, omega-9, silica, silver, tin, nickel, oxygen, hydrogen, carbon, nitrogen).
- 35 rare-earth trace minerals → the plant-derived-mineral GROUP treatment (never individual).
- **Design elements** (the illustrated hero per element, selenium/omega style) — the pass AFTER the claims are sealed.
