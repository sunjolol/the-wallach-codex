# Next chunk — ★ PLAN LOCKED 2026-07-09 · NEXT = Phase G mining (G-3 vein-maps → G-4 finish Immortality @ La-Lanthanum)

**★ CURRENT STATE (2026-07-09).** Phases A–F COMPLETE + SEALED. Phase-G book mining UNLOCKED (`corpus_audit_gate` = `phase_g_unlocked`). **knowledge_version 315 · 1233 claims · board 52/52 green · 38 of 91 essentials carry a numeric Wallach target · glossary 204 terms.** `amounts_wallach_only` now recomputes the full dose-transform chain (7-class negative test). **Remaining-work roadmap LOCKED 2026-07-09** — active plan = `chronicle/OVERHAUL-BLUEPRINT.md` §7; mining HOW = `.claude/rules/mining-veins.md`.

## The locked roadmap (blueprint §7)
- **Phase G — book mining (vein-selective) → Search validation → seal.** Mine rich VEINS only, review-and-disposition filler (honesty gated by `mining_coverage_accounted`), ONE seal per vein.
  - G-1 ✓ Epigenetics dose table · G-2 ✓ glossary · (R2 chain-tightening ✓ 2026-07-09)
  - **G-3 (NEXT)** — adopt the vein doctrine; seed `eden/tools/mining-coverage.json` vein-maps for the remaining books.
  - **G-4** — finish **Immortality**: resume the element encyclopedia at **`La-Lanthanum` (char 299,378)** through Zr (41/95 headers mined Ag→Kr; canon elements tier-1, ~21 non-canon inert/radioactive → search-only / reviewed-empty), then scan Ch 4–12 narrative for other veins.
  - G-5 — full **DDDL** re-mine (source pristine). · G-6 — the **3 newly-bought books** (Luneth photographs favorite chapters → Claude in-houses + adds each `book_id` to the sealed `books-meta` allowlist + mines). · G-7 — **build Search** as the corpus completeness-harness → re-mine gaps it finds BEFORE seal. · G-8 — close-out audit + seal.
  - Deferred: **Hell's Kitchen** (not in-housed yet).
- **Phase H — app completion:** Scanner / Regimen / Journey to spec (one surface to 100% before the next, render probes + visual sign-off) + periodic-table **element-click detail** + **product detail panel** + wire every dead button.
- **Phase I — design touch-up (LAST) + distribution + legal/a11y/i18n.**

## What 2026-07-09 landed (all committed + pushed)
1. "Why this number?" box refine (`75cfbcab`) · 2. G-2 glossary +56 (`fccbb88a`) · 3. Regimen snapshot auto-heal (`22188a0e`) · 4. R2 `amounts_wallach_only` chain-tightening + 7-class negative test (`95424a85`) · 5. Remaining-work roadmap expanded + LOCKED into the blueprint + new `.claude/rules/mining-veins.md` doctrine (`7bf88c4a`).

## Mining workflow (Phase G — READ `.claude/rules/mining-veins.md` first)
The input loop: **Luneth pastes** a section's PDF/OCR → **Claude diffs** vs the sealed `.txt` → **corrects the `.txt`** (safe_write → `corpus_resnap.py --write` [+`--fix` for quoting claims] → re-seal) → **extract claims** (`corpus_extract finalize` ADD + `mine_batch apply` EDIT) → **ONE `corpus_seal` per vein** (user-authorized) → build → invariants → build-log → Creator's Log → re-inline build → commit. Unknown substances with no slug → `eden/tools/substance_triage.py park …` (leave out of the claim). Favor the newest book for placement, keep older. Per-book policies + the vein guardrail: mine every vein 100%, skip only low-value regions never valuable data — ASK when unsure.

## Carried follow-ups (deferred; NOT blockers — `corpus-audit-status.json` deferred_followups)
1. Deep linguistic/logic anomaly sweep (finalization / G-8). 2. Book-source purification — 2/6 pristine (iaiyh, DDDL); completes via the Phase-G mining loop. 3. 3 parked claim notes: IAIYH-000020 (award vs verbatim) · germanium "osteoarthritis" vs "osteoporosis" wording · RARE-000048 selenium verbatim extension.

## Other still-open (Phase H / I)
Conditions → product suggestions · recommender weight-tuning · canonical-unit unification · JS size budget (code-splitting) · global styling touch-ups (Phase I) · legal/copyright/a11y/i18n (Phase I, ONE end pass).

## The overhaul in one paragraph
Full structural overhaul after book citations were caught hand-typed ~200×. Model: TWO sealed hand-edited sources — the Wallach Corpus (`eden/corpus/`) + the Youngevity Product DB (`eden/products/`, sealed) — plus the shared Catalog (`eden/catalog/`). Everything else GENERATED + freshness-gated. Phases A–F done; Phase G (mining → Search → seal) active; H (app completion) + I (design) remain. Charter R1–R9 + gates = the enforceable spine; `.claude/rules/` = the per-domain HOW.
