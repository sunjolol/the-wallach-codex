# Next chunk — CORPUS AUDIT UNDERWAY (Workstream A done) → Workstream B (dose-mislabel reclassifications) NEXT

**★ CURRENT STATE (2026-07-08).** Phases A–F COMPLETE + SEALED; task (a) (the Coverage/Knowledge deep-dive on real product data) COMPLETE. Now on **task (b) — the mandatory pre-Phase-G full-corpus audit** ([[full-corpus-audit-before-phase-g]]; gated by `corpus_audit_gate`, `phase_g_unlocked=false`, frozen 1203 claims). This session kicked it off:

- **Audit harness upgraded** (`eden/tools/corpus_audit.py`): parse-check (not type-check) + semantic dose-mislabel detectors (`dose_reports_rda/intake/toxicity`, `dose_per_kg`, `dose_range_high_lost`, `nondose_states_dose`) + an ALL-CAPS-row table detector. Run `PYTHONUTF8=1 python eden/tools/corpus_audit.py` → `eden/tools/corpus-audit-worklist.md` = a 3-tier worklist: **43 suspect · 9 needs-a-look · 1142 likely-fine**, each suspect carrying a proposed disposition (a CHECK, never a verdict).
- **Workstream A — the Base Line supplement table (33 claims, `LETS-000045–000077`) — RESOLVED via a VIEW template** (no corpus edit, no gate change). Source-image-verified all 33 rows vs Let's Play Doctor p.73 (fitz pg 84). The Knowledge deep-dive dose card is now the **presentation standard for dose data from ALL books**: DOSE section pinned to the top, the recommended amount as a bold labeled pill ("True Supplement Need · 1000 mg / daily"), the Base Line quote shows ONLY the clicked nutrient's own row (bleed hidden), and RDA / True Supplement Need / 30-Day Pharmacologic carry hover tooltips (`glossary.json`). Luneth signed off ("looks much better"). NOTE: the explored shared-full-table verbatim + 1200→1500 cap raise were REVERTED — this is view-only.

Board **50/50 green**; **34 of 91** essentials carry a numeric Wallach target today (rest are honest gaps); active plan = `chronicle/OVERHAUL-BLUEPRINT.md`.

## ★ RESUME HERE — Workstream B: the 11 dose-mislabel suspects (corpus edits, source-image per claim)

`kind=dose` claims that need reclassifying/restructuring. Route through draft → `vb_apply`/`corpus_resnap` → **USER-ONLY `corpus_seal`**; verify each against the book page ([[verify-against-source-images]], [[editing-sealed-corpus-claims]]). Highest-value first:
1. **★ cobalt/B12 missing target** — `IMMORT-000084` (dose_null; real 250–400 mcg never structured) + `RARE-000014` (250–400 mcg mis-scoped to "pregnancy" → excluded from targets). Structuring/re-scoping lights up cobalt/B12's coverage target (same "missed daily amount" class as Silica/Germanium/Silver in Phase C).
2. **RDA/intake reports → reclassify dose→definition/toxicity_sign**: `RARE-000173` (magnesium RDA + toxicity ceiling), `RARE-000180` (molybdenum avg-intake + RDA), `RARE-000146` (iodine avg-intake + toxicity).
3. `RARE-000164` lithium → mechanism · `IMMORT-000105` copper per-kg → definition · `RARE-000154` potassium (dup of `IMMORT-000193`) · `RARE-000207` phosphorus (dietary-intake mislabel **+ a real `targets_derive._parse_amount` comma-range bug: "1,000-1,500" drops the 1,500 high — fix + confirm it's a real target**) · `EPIGEN-000086` germanium (claim_text over-reaches its one-sentence verbatim) · `RARE-000096` gold (allopathic gold-injection schedule — leave as protocol, no target).

Then: sweep the **9 needs-a-look** (confirm each number, incl. the DDDL/RARE silver 400 mg duplicate), then the **1142 likely-fine** tier (lowest priority), then set `phase_g_unlocked=true` + re-anchor `frozen_claim_count` in `eden/tools/corpus-audit-status.json` → Phase G book-mining unblocks. [[substance-registry-and-triage-buffer]] (task-zero triage buffer) builds at Phase-G kickoff.

### Deferred (owed, not yet done)
- **Bled Base Line verbatims** stay in the sealed data (the view hides the bleed); a later **book-purification pass** can clean each to its own row (needs a MIN_VB-floor decision) + clean the pantothenic "...4 mg" OCR artifact.
- Still-open from the prior handoff: conditions→product suggestions (needs mining), recommender weight-tuning, canonical-unit unification, JS size budget (~846 KB vs 250 KB → code-splitting), global styling touch-ups (ONE end pass — Luneth 2026-07-08).

## The overhaul in one paragraph (context)
Full structural overhaul after book citations were caught hand-typed ~200×. **Model:** TWO hand-edited sealed sources — the Wallach Corpus (`eden/corpus/`) + the Youngevity Product DB (`eden/products/`, COMPLETE + SEALED) — plus the shared Catalog (`eden/catalog/`). Everything else is GENERATED + freshness-gated. Phases A–F DONE; task (a) COMPLETE. Task (b) = the owed corpus audit → Phase G mining, now UNDERWAY (harness + Workstream A landed). The Charter (R1–R9) + its gates are the enforceable spine; `.claude/rules/` carries the per-domain HOW.
