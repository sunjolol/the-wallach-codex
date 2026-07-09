# Next chunk — ★ PHASE G-1 (Epigenetics dose table) DONE (2026-07-09, commits bd324a7e + 7b27414e, board 52/52) → PICK NEXT PHASE-G ITEM

**★ CURRENT STATE (2026-07-09).** Phases A–F COMPLETE + SEALED. Phase-G book mining is UNLOCKED (`corpus_audit_gate` = `phase_g_unlocked`). **knowledge_version 315 · 1233 claims · board 52/52 green · 38 of 91 essentials carry a numeric Wallach target** (was 36). Active plan = `chronicle/OVERHAUL-BLUEPRINT.md`.

## What Phase G-1 landed (this session) — [[phase-g1-epigenetics-dose-table]]
A density scan of all 6 books found the SECOND Fig-8-1-class dose table: **Epigenetics (2014) "Daily Multiple Vitamin & Mineral" supplement program**. Mined it (30 dose claims WAL-CLM-EPIGEN-000110–139) + rewrote `eden/tools/targets_derive.py` to the new target policy: post the UPPER of Wallach's NEWEST maintenance range (single number); unit-normalize to Youngevity units (IU→metric for A/D/E only, USP constants in `IU_CONVERSIONS`); per-100-lb minerals ×1.54 (154 lb=70 kg) + 2-sig-fig rounding; newest-book-wins with older kept in `other_claims`; Vitamin A = retinol+β-carotene summed to 9,000 mcg RAE (both in `parts`); every transform carries a `provenance` stamp. Boron + Bioflavonoids gaps filled. Detail-view: a collapsed **"why this number?"** expander (below the now-leading dose claims) shows the range + "we target the upper end" framing + Vitamin A parts + older-book gloss. `coverage.ts toMg` fixed to (a) convert IU→mcg per-vitamin so IU-listed products count and (b) parse units by prefix/token so "mcg RAE" can't inflate 1000× (the Vitamin A 810000 bug).

## ★ NEXT — pick one (all Luneth-OK'd, none blocking)
1. **G-2: Epigenetics end-of-book GLOSSARY → term-gloss overlays** (the easiest high-value win). Harvest the definitions into `eden/tools/term-gloss-lexicon.json` (dotted-underline overlays); feeds `claim_text_term_gloss` / `jargon_terms_glossed`.
2. **Regimen snapshot AUTO-HEAL** ([[auto-heal-not-user-debug]]) — have `state/coverage.ts` re-read live product composition by product id so a stale VALUE self-corrects without re-adding (the unit fix already auto-heals on reload; only value drift remains). Edge case: user-scanned items not in the product DB keep their own data.
3. **Resume the element A-Z sweep.** Immortality is mined only to ~38% (iodine/potassium frontier, char ~299k of 794k); the **back 62% is untouched** — Lanthanum, Magnesium, Manganese, Molybdenum, Sodium, Sulfur, Tin, Titanium, Vanadium, Zinc + the rest of the rare earths. Also Rare-Earths + DDDL under-mined for doses.
4. **Tighten `amounts_wallach_only`** to validate the full transform CHAIN (trace-to-claim + documented factor), not just provenance-existence — the provenance stamp exists for it. Labeled WISH.

## Book-mining workflow (when resuming mining)
Favor the NEWEST book for placement but keep older ([[enrich-tier1-every-book-favor-newer]] / [[favor-newest-wallach-number]]); ≥1 solid claim per book per topic; batch = `corpus_extract finalize` (ADD) + `mine_batch apply` (EDIT) + one USER-authorized `corpus_seal` per batch ([[batch-mining-workflow]], [[editing-sealed-corpus-claims]]); per-book policies: [[iaiyh-mining-policy]] · [[epigenetics-mining-policy]] · [[immortality-mining-policy]] · [[dddl-undermined-remine]]. Keep internal Table/Fig/page pointers OUT of `claim_text` (gate `internal_refs_out_of_prose`, [[front-facing-human-first]]). Text-surgery on a sealed book = edit `.txt` via safe_write → `corpus_resnap --write` → seal (as done this session for the Epigenetics table).

## Substance triage buffer ([[substance-registry-and-triage-buffer]])
When mining hits a substance with no slug in `eden/catalog/nutrients.json`: leave it OUT of the claim (board stays green), then `PYTHONUTF8=1 python eden/tools/substance_triage.py park --raw-name <raw OCR> --book <book_id> --locator <loc> --context "<text>" [--claim-id <id>]`. At the book's review pass, resolve each against the source IMAGE ([[verify-against-source-images]]): promote real ones to `nutrients.json` + `mine_batch` backfill; reject OCR garbage. `substance_triage_accounted` REDs at book-completion if any entry is still pending.

## Carried follow-ups (deferred at the pre-Phase-G audit sign-off — NOT blockers; in corpus-audit-status.json `deferred_followups`)
1. **Deep linguistic/logic anomaly sweep** ([[linguistic-logic-sweep]]) — FINALIZATION-phase.
2. **Book-source purification** ([[book-source-purification-campaign]]) — 2/6 pristine (iaiyh, DDDL); Immortality → Epigenetics → LETS → Rare-Earths still raw. (NB: the Epigenetics table region was normalized this session but the book stays `raw` overall.)
3. **3 parked claim notes:** IAIYH-000020 (award vs verbatim) · germanium "osteoarthritis" vs "osteoporosis" wording · RARE-000048 selenium verbatim extension.

## Other still-open
Conditions → product suggestions · recommender weight-tuning · canonical-unit unification · JS size budget (code-splitting) · global styling touch-ups (ONE end pass) · legal/copyright/a11y/i18n ([[legal-copyright-pass-at-end]], ONE end pass).

## The overhaul in one paragraph (context)
Full structural overhaul after book citations were caught hand-typed ~200×. Model: TWO hand-edited sealed sources — the Wallach Corpus (`eden/corpus/`) + the Youngevity Product DB (`eden/products/`, COMPLETE + SEALED) — plus the shared Catalog (`eden/catalog/`). Everything else is GENERATED + freshness-gated. Phases A–F DONE; Phase G (book mining) UNLOCKED; Phase G-1 (Epigenetics dose table) DONE. The Charter (R1–R9) + its gates are the enforceable spine; `.claude/rules/` carries the per-domain HOW.
