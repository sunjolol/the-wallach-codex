# Next chunk — ★ PRE-PHASE-G AUDIT SIGNED OFF (2026-07-09, kv 314) · PHASE G UNLOCKED → task-zero = source-anchored triage buffer

**★ CURRENT STATE (2026-07-09).** Phases A–F COMPLETE + SEALED. Task (a) (Coverage/Knowledge deep-dive on real product data) COMPLETE. **Task (b) — the mandatory pre-Phase-G full-corpus audit — is DONE + SIGNED OFF (Luneth, 2026-07-09, knowledge_version 314).** `corpus_audit_gate` now reads `phase_g_unlocked=true` ("mining unblocked; 1203 claims"); the freeze is re-anchored at 1203. Board **51/51 green**; **36 of 91** essentials carry a numeric Wallach target (rest are honest gaps). Active plan = `chronicle/OVERHAUL-BLUEPRINT.md`.

The audit's full ledger lives in the Creator's Log + `chronicle/build-log.md` + `eden/tools/corpus-audit-status.json` (sign-off record + `deferred_followups`). One-line recap of what it resolved: Workstream A (Base-Line dose-card template) · Workstream B (11 dose-mislabels) · Tier-2 (incl. the silver 400 mg→mcg SAFETY fix) · whole-corpus dose-safety scan · internal-ref-in-prose cleanup (labeled-table-header via CLEAN-DATA + the `internal_refs_out_of_prose` gate, kv 314, [[labeled-table-header-view]]) · 23-claim stratified spot-check · chilblains→Hypothermia relabel.

## ★ RESUME HERE — Phase G kickoff

**task-zero (BEFORE mining resumes): the source-anchored triage buffer** ([[substance-registry-and-triage-buffer]]) — the honest low-resistance escape hatch for substances/claims that don't cleanly fit the strict slug registries (Phase F re-lit the strict substance-half of `references_resolve`). Build it first so mining has a sanctioned home for the awkward cases; then resume book mining.

Book-mining reminders when it resumes: favor the NEWEST book for placement but keep older ([[enrich-tier1-every-book-favor-newer]] / [[favor-newest-wallach-number]]); ≥1 solid claim per book per topic; batch workflow = `corpus_extract finalize` (ADD) + `mine_batch apply` (EDIT) + one USER-authorized `corpus_seal` per batch ([[batch-mining-workflow]], [[editing-sealed-corpus-claims]]); per-book policies: [[iaiyh-mining-policy]] · [[epigenetics-mining-policy]] · [[immortality-mining-policy]] · [[dddl-undermined-remine]]. Every summary is ref-free now — keep internal Table/Fig/page pointers OUT of `claim_text` (gate `internal_refs_out_of_prose`, [[front-facing-human-first]]).

## Carried follow-ups (deferred at sign-off — NOT Phase-G blockers; recorded in corpus-audit-status.json `deferred_followups`)
1. **Deep linguistic/logic anomaly sweep** ([[linguistic-logic-sweep]], the "Zumba→Zumbani" class of plausible-looking author errors) — deterministic surfacer + heavy offline-LLM pass = FINALIZATION-phase work; the human-read portion was partly covered by the spot-check.
2. **Book-source purification** ([[book-source-purification-campaign]]) — 2/6 pristine (iaiyh, DDDL); Immortality → Epigenetics → LETS → Rare-Earths still raw (RARE last). Gated by `book_source_clean`; scanner-blind caveat = the owed exhaustive human scan-read.
3. **3 parked claim notes:** `WAL-CLM-IAIYH-000020` (a `quote` whose claim_text asserts an award its verbatim doesn't cover) · germanium "osteoarthritis" vs "osteoporosis" wording (faithful, Luneth to interpret) · `WAL-CLM-RARE-000048` selenium verbatim extension (1 mg selenite 3×/wk dose confirmed in-book; verbatim quotes the study RESULTS, extend via `vb_apply`, no target impact).

## Other still-open (from the prior handoff, not audit-scoped)
Conditions → product suggestions (needs mining) · recommender weight-tuning · canonical-unit unification · JS size budget (~846 KB gz vs 250 KB → code-splitting) · global styling touch-ups (ONE end pass — Luneth 2026-07-08) · legal/copyright/a11y/i18n ([[legal-copyright-pass-at-end]], ONE end pass).

## The overhaul in one paragraph (context)
Full structural overhaul after book citations were caught hand-typed ~200×. Model: TWO hand-edited sealed sources — the Wallach Corpus (`eden/corpus/`) + the Youngevity Product DB (`eden/products/`, COMPLETE + SEALED) — plus the shared Catalog (`eden/catalog/`). Everything else is GENERATED + freshness-gated. Phases A–F DONE; task (a) COMPLETE; task (b) audit DONE + SIGNED OFF (kv 314). Phase G (book mining) now UNLOCKED. The Charter (R1–R9) + its gates are the enforceable spine; `.claude/rules/` carries the per-domain HOW.
