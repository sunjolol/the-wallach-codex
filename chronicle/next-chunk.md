# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-28 · NEXT SESSION = a 4-TASK AGENDA)

# ★★★★★ READ FIRST (plain language)
Night3 is DONE, LIVE, and PUSHED (commit 76042d6c, corpus **kv424 · 2263 claims**, board **76/76 green**, repo
clean). This is a clean start. Luneth has set a **4-task agenda for THIS session** — address all four. Recommended
order: the quick housekeeping + two small corpus fixes first, then the big nuance scan (the main event).

---

## TASK 1 — Housekeeping: memory-index consolidation (quick; do first to clear the nag)
`C:\Users\Light\.claude\projects\C--Users-Light-Desktop-claude-health-expert\memory\MEMORY.md` tripped its size
limit (~183 lines; 200-line read cap). Per [[memory-consolidation-threshold]] the REAL constraint is the ~24.4 KB
byte cap, and the compaction method is: **shorten the one-line hooks first (lossless), then merge duplicate/stale
entries.** Use the `consolidate-memory` skill (proper reflective pass) or do it manually. Target the hook's
<140 lines WITHOUT losing hard-won lessons. Known merge candidate already flagged: ~6 overlapping mining-mechanics
memories → one canonical home ([[consolidate-mining-mechanics-before-phase-g]]).

## TASK 2 — Task 3: antioxidant-FOOD search routing fix (small; RE-VERIFY then apply)
Staged in `temporary/enrichment-queue/night3/`. `node tools/render_probe_search_routing.js` is **2/6** (pre-existing):
antioxidant-FOOD queries route wrong because of an orac/antioxidants data split. Ruling + a Python-port sim (6/6)
in `temporary/enrichment-queue/night3/TASK3-routing-ruling.md`.
- **FIRST re-verify** the ruling still holds against the NOW-LIVE corpus (kv424) — it was sim-verified when the
  corpus was kv420; the corpus changed since.
- Apply: `python temporary/enrichment-queue/night3/scripts/apply_task3.py` → widen FOODS (2→4 ids) in
  `tools/render_probe_search_routing.js` → `python eden/tools/search_index_derive.py` → `node tools/build.mjs` →
  `node tools/render_probe_search_routing.js` (expect **6/6**).

## TASK 3 — Register mangosteen + pomegranate in the catalog (small; catalog_seal is USER-ONLY)
This session DROPPED `mangosteen`/`pomegranate` from `other_substances` on 3 noni/ORAC claims (WAL-CLM-HELLS-000090,
WAL-CLM-HELLS-000091, WAL-CLM-IMMORT-000476) to keep the corpus seal valid without touching the catalog pillar.
They're real antioxidant fruits Wallach names in his ORAC tables.
- Register: add `{ "display_name": ..., "canon_slug": null }` for each in `eden/catalog/nutrients.json` →
  **catalog_seal (USER-ONLY — Luneth runs it or authorizes it).**
- Then DECIDE with Luneth: re-attach them to the 3 claims' `other_substances` (mine_batch → corpus re-seal, so
  the fruit → claim link exists on their entity pages) OR just register for future use and leave the claims as-is.

## TASK 4 — ★ THE BIG ONE: nuance / begs-the-question FULL scan across all claims (Luneth's main task)
Two passes over the corpus (enriched claims first — 761 enriched; especially "what does Wallach think of X" framings):
- **Pass A — begs-the-question / cliffhanger:** a claim that raises a question or names a bad-form without resolving
  it (an unexplained term, a "rude awakening"-style dangle, "so is it good or bad?"). Luneth hit ~2 back-to-back in
  Night3 despite a prior "already fixed" — a real SYSTEMATIC sweep is warranted, not spot fixes.
- **Pass B — good-forms-vs-bad-forms nuance:** a claim warning against a BAD form must not read as "avoid the whole
  thing" — it must also name the GOOD form (the honey / low-fat-yogurt pattern). Luneth estimates ~30–40 claims.
  **RULE: NEVER fabricate the good-form — it must be Wallach's own words (search his 7 books) or you surface the gap.**
- **Harness:** an Ask-Wallach-query + adversarial-verify WORKFLOW (the exact pattern that caught 2 of Claude's own
  edits this session — see Creator's Log lg_ms501m1r_02y6ev). **PROPOSE → Luneth RATIFIES before ANY edit.** Small
  batches, his review each round, shown in exact form ([[small-batch-build-test-log-mandate]],
  [[review-claims-in-exact-form-approve-the-claim]]).

---

## ALSO FLAGGED (from Night3, for awareness during Task 4)
- **"what causes cancer" routing** now surfaces the on-topic best-answer WAL-CLM-RARE-000306 (cancer = selenium
  deficiency) instead of routing to the Cancer page — correct per the search's own rule, but Luneth wanted it in
  his post-push search review. Confirm he's happy with it during Task 4.

## STANDING DOCTRINES (unchanged, still bind)
1. **"search-only" is DEAD** — every claim lives in ONE of three homes (90 essentials / conditions / Explore);
   Search is a retrieval layer over all three.
2. **Wallach's supplement thesis** — essential nutrients come from the DIET (food OR supplements), never
   "from food" alone.
3. **NEVER GUESS / NEVER FABRICATE when mining/editing** — verbatim ⊆ the sealed book, or honestly skip; surface
   every judgment call. (This session proved its worth: mediterranean-diet reprint, microwave no-stance, +2 self-edits caught.)
4. **corpus_seal + catalog_seal are USER-ONLY** — sealing is the human's act of ratifying canon.
5. **A staged batch's `validation_report: clean` is NOT the real gates** — finalize/seal/invariants surface latent
   defects at apply ([[staged-batch-validation-report-not-real-gate]]). Budget a fix-loop for Task 2/3.

**Corpus: kv424 · 2263 sealed claims · board 76/76 green · repo clean + pushed. Ready for the 4-task agenda.**
