# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-25 · ELEMENT-ENRICHMENT ARMY ran while Luneth was away: 39 substantive elements enriched + verified + QUEUED for sealing; NOTHING sealed yet — corpus_seal is user-only)

# ★★★★★ READ FIRST (plain language)
While you were away, a parallel mining "army" read Wallach's books and wrote the **"Worth knowing" search claims** for **39 elements** — the same golden standard as Selenium (question → short answer → full answer → exact quote), CLAIMS ONLY (no design/illustration this pass — that is the next one). It is all a **verified, deduped QUEUE waiting for your review + seal**. I sealed nothing (that is yours). Every claim was machine-proven to be exact book text and adversarially fact-checked. **ALL 16 vitamins are now done.**

## WHERE IT IS
- **Review artifact (open first):** https://claude.ai/code/artifact/c06c7495-f959-4650-81af-bf511d2713fc — every claim as Q → short → FULL → quote + citation + verify verdict, grouped by element. **746 claims · 39 elements · 310 curated-out (parked, recoverable).**
- **Deliverables persisted in the repo (gitignored):** `temporary/enrichment-queue/`
  - `master_queue.json` — the full review structure (source of the artifact).
  - `raw/<book>.raw.json` — NEW claims per book, ready for `corpus_extract finalize`. ONE file per book holds ALL this campaign's new claims for that book (finalize is not-additive → one finalize per book covers everything).
  - `raw/<book>.enrichmap.json` — search-enrichment metadata in the SAME ORDER as the raw file → zip with the finalize-assigned WAL-CLM ids.
  - `enrich_existing.json` — 181 enrichment entries keyed by EXISTING sealed claim ids (reuse of proven claims; NO finalize needed).
  - `entities.json` — proposed `search-entities.json` registry entries per element (canon_ref:true + rich lay synonyms + related).
  - `parked.json` + `master_queue.parked` — curated-out claims (unfaithful/redundant/charged/not-selected) with reasons.
  - `scripts/` — the whole reusable pipeline. NOTE: scripts hardcode THIS session's scratchpad absolute paths; a new session must repoint the `SC`/`OUT`/`base` paths before re-running — see `CAMPAIGN.md`.

## THE 39 ELEMENTS (this session) — selenium was already done before
zinc · magnesium · omega-3 · vitamin-a · vitamin-b1 · vitamin-b2 · vitamin-b3 · vitamin-b5 · vitamin-b6 · vitamin-b9 · vitamin-b12 · vitamin-c · vitamin-d · vitamin-e · vitamin-k · biotin · choline · inositol · flavonoids · chromium · copper · vanadium · iron · iodine · germanium · manganese · sodium · calcium · potassium · phosphorus · boron · sulfur · cobalt · lithium · molybdenum · chloride · arginine · taurine · tryptophan

## HOW TO SEAL + WIRE (per book; corpus_seal is USER-run)
1. **Finalize** new claims per book: `PYTHONUTF8=1 python eden/tools/corpus_extract.py finalize --book <book_id> --raw temporary/enrichment-queue/raw/<book_id>.raw.json` (snaps each verbatim to book bytes — already gate-verified, will pass). Read the draft report.
2. **Seal (USER):** `corpus_seal` — promotes drafts, re-derives, rewrites golden hashes, runs corpus_verify.
3. **Wire enrichment:** for each book, the finalize-assigned ids (in order) zip with `raw/<book>.enrichmap.json` (same order) → add each as an entry in `eden/corpus/search-enrichment.json` keyed by the new id. Add every `enrich_existing.json` entry by its existing id. Add `entities.json` entries to `eden/catalog/search-entities.json`.
4. `PYTHONUTF8=1 python eden/tools/build_embeds.py` → `node tools/build.mjs` → invariants → `render_probe_search`.

## ★ SELECTIVE SEAL — Luneth's plan (do NOT seal everything by default)
Luneth reviewed the queue: most claims look good, but he wants to **push only SOME live now and keep reviewing the rest.** IMPORTANT MECHANIC: `corpus_seal` promotes **ALL** drafts at once — it is not selective. So "push some live" = **finalize ONLY the approved subset** into the drafts, THEN seal:
1. Luneth names the approved set (by element, or by specific queue_ids/claim from the artifact).
2. FILTER the per-book raw files to only the approved claims before finalize (e.g. a small script: read `temporary/enrichment-queue/raw/<book>.raw.json` + its `enrichmap.json`, keep only the approved rows IN LOCKSTEP ORDER, write filtered raw+enrichmap, finalize from the filtered file). The `master_queue.json` carries `element` + `queue_id` per claim to map an approval back to its raw row.
3. Finalize the filtered raws → `corpus_seal` → wire enrichment (zip filtered enrichmap with the new ids) + the approved `enrich_existing`/`entities` entries → build_embeds → build → probe.
4. The UN-approved claims stay in `temporary/enrichment-queue/` untouched, still in the queue/artifact, for a later review+seal round. Re-review them before their turn.
A `seal_selection.py` helper (filter raw+enrichmap by an approved element/queue_id list) is worth writing at the start of that session.

## QUALITY NOTES (eye these in review)
- **Dose/protocol claims are the weak spot.** Their verbatims are often table/chart fragments, and a few had number confusion (a manganese dose that used magnesium's figures; a choline dose whose verbatim was actually the biotin row — that one was REJECTED; RDA-vs-Wallach-need mixups). The adversarial verifier flagged these REVISE/REJECT and applied passage-grounded fixes — but SCAN the `protocol`-facet claims per element yourself before sealing.
- Every claim cleared the DETERMINISTIC anti-fabrication gate (verbatim = exact book bytes, 0 fabrications shipped) AND an adversarial faithfulness re-read (caught outside-knowledge injection, invented numbers/dates, cross-passage bleed, cross-nutrient dose confusion, R4 inline-verbatim, added hedges — all fixed or parked). It works; review still holds final say.
- Some `also_about` cross-links used non-registered slugs and were dropped (soft loss). A small alias map (folic-acid→vitamin-b9, pregnancy→its condition slug, etc.) would recover routing.
- Each element's `curation.gaps` in `master_queue.json` lists real questions the set does NOT yet answer — a targeted backfill list.

## DEFERRED (after the weekly cap resets)
- **~14 substantive elements not yet mined:** 9 amino acids (lysine, methionine, tyrosine, phenylalanine, histidine, isoleucine, leucine, threonine, valine — **BATCH 8 sources + chunk ALREADY STAGED**, just relaunch mineA.js); fatty acids omega-6, omega-9; minerals silica, silver, tin, nickel, oxygen; structural hydrogen, carbon, nitrogen (very thin in Wallach).
- **35 rare-earth trace minerals** → the existing plant-derived-mineral GROUP treatment (do NOT mine individually).
- **Design elements** (the omega/ORAC/rancidity-style illustrated hero per element) — the separate pass you planned for AFTER the claims exist. Do it once these are sealed.

## BUDGET
This session ran 7 mine + 7 verify workflows (batches 1–7) across two go-rounds (~7-unit budget, then +25% more). Stopped at your instruction ("stop after this next one"). Batch 8 (9 amino acids) is fully staged — a single "keep going" resumes it instantly.

## THE PIPELINE (reusable; scripts in temporary/enrichment-queue/scripts/, full loop in CAMPAIGN.md)
source_builder.py → chunk.py (cross-book bounded work-items) → mineA.js (GOLDEN2 recipe, parallel miners) → verify_claims.py (DETERMINISTIC snap gate = anti-fabrication) → build_survivors.py (dup→enrich conversion + ground-truth context) → wfB.js (adversarial verify + curate/select + "What is X?" intro + entity synonyms) → assemble.py (cumulative queue + per-book raw/enrichmap) → build_artifact.py → Artifact republish (same URL).
