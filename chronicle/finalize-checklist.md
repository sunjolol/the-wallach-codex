# Finalize / Polish Checklist — the pre-ship task ledger

_A living checklist of EVERY deferred "do it at the end" task, so nothing is lost as we keep mining. Luneth marks items off manually. Add to it the moment a task is deferred; never delete an unchecked item silently. Surfaced at genesis via `chronicle/next-chunk.md`._

_Legend: `[ ]` open · `[x]` done · `[~]` in progress. Owner: **L** = Luneth's call/hand · **C** = Claude executes · **C→L** = Claude drafts, Luneth signs off._

---

## 1 · Corpus truth & cleanup (the content must be RIGHT)

> **★ SESSION 41 — THE INVERT:** these items are now executed by the **Source-Purification campaign** (purify each book's source `.txt` to PRISTINE FIRST, then mine), tracked in `chronicle/next-chunk.md` + memory `book-source-purification-campaign`. No longer a deferred "final sweep" — each book is purified in ONE audited pass (book_purity scan → spec → resnap → `book_source_clean` gate). Order: IAIYH ✅ PRISTINE → DDDL ✅ PRISTINE → Immortality → Epigenetics → LETS → Rare Earths. The dose-safety scan, book-wide typo audit, and render-vs-txt COMPLETENESS pass below are FOLDED INTO each book's purification, not a separate end-sweep.

- [~] **Source-Purification campaign** (the ACTIVE effort) — purify each book's source `.txt` to PRISTINE, THEN mine on clean text. Done: **IAIYH · DDDL** (2/6). Remaining: **Immortality → Epigenetics → LETS → Rare Earths**. Gate: `book_source_clean` (0 unresolved each run). Memory [[book-source-purification-campaign]]. (C→L)
- [~] **Verbatim-remediation campaign → 0** (`verbatim_names_mapped_conditions`) — PAUSED until all 6 books pristine, then resumes on clean sources. Baseline 195 (known, shrinking). Done: EPIGEN, RARE. Remaining: LETS · DDDL · IAIYH. (C→L)
- [x] **Linguistic/logic sweep — Tier 1** (`anomaly_scan.py`) — DONE SESSION 36. All 6 books scanned; every confirmed real error fixed corpus-wide; 10 false-positives allowlisted. Memory [[linguistic-logic-sweep]]. (C→L)
- [ ] **Linguistic/logic sweep — Tier 2 (offline-LLM pass)** over every claim's summary+verbatim ("does this parse? unknown term? contradiction?") — the heavy-interpretation layer, leans on the Ask-Wallach model. (C→L)
- [ ] **Full dose-safety scan** — every dose/unit render-verified; dangerous misprints fixed even in verbatim. (A partial corpus-wide scan ran 2026-06-27; the full render-verified pass is folded into each book's purification — 2/6 books covered so far.) Memory [[dose-misprint-safety-mandate]]. (C→L)
- [ ] **Final number/nutrient-total correction batch** — L fixes ALL nutrient totals / targets in one end pass; don't chase number-only discrepancies mid-stream. Memory [[numbers-corrected-at-end]]. (L)
- [~] **Final per-book `.txt` OCR sweep** — SUPERSEDED by the Source-Purification campaign (more rigorous, per-book, gated). Done via purification: IAIYH, DDDL (0 unresolved). Remaining folded into Immortality/Epigenetics/LETS/Rare-Earths purification. Memory [[source-correction-policy]]. (C)
- [ ] **Final per-book render-vs-`.txt` COMPLETENESS pass** — every table/figure/multi-column page (OCR silently DROPS sections). Risk order: DDDL first > LPD pre-Ch7 > RARE. (C)
- [ ] **Duplicate-slug audit** — scan for condition slugs that are the same thing under two names (menkes_disease/menkes_syndrome merged SESSION 35; find the rest). (C→L)
- [~] **Finish / complete mining of all books** — the corpus is UNEVEN: (a) **DDDL RE-MINE** — under-mined at 94 claims / 0.60-per-1k-words (lowest of the narrative books); the pica/Lanzkowsky passage + most of Appendix B's ~200-entry A–Z disease encyclopedia were never captured (logged as a deliberate first-pass 2026-06-24; flagged for re-mine SESSION 43). Source already PRISTINE → unblocked. (b) **Immortality (2008)** — 0 claims, entirely unmined. (c) **LETS Ch10 completeness.** Memory [[wallach-corpus-revamp]]. (C→L)
- [ ] **Semantic-mapping re-review on meaning-changing source fixes** — byte-sync of verbatims to fixed sources is machine-enforced (`corpus_verify` #2 / `corpus_integrity`); but a fix that changes MEANING (not just spelling) must trigger a condition-mapping re-review (is the claim still correctly scoped / should it still be included?). Partial guard: `verbatim_names_mapped_conditions`. SESSION 43. (C→L)
- [ ] **Fringe-knowledge disposition** — decide handling of `knowledge/fringe-knowledge/` (uncensored-edition candidate). Memory [[editorial-fringe-exclusion-policy]]. (L)
- [ ] **Incomplete-description hunt (length rule)** — scan every claim summary+verbatim (and terse logs) for entries a 100–500-char extension would COMPLETE; extend past the 500 soft-limit when it serves truth/education (1200 hard cap), informing L per case. `verbatim_over_soft_limit` lists current >500s. Memory [[verbatim-length-rule]]. (C→L)

---

## 2 · Features still to build

- [x] **Archaic-clinical-unit tooltip layer** — DONE SESSION 43. `mg% · g% · mEq/L · cc` glossed (grams-percent = per-deciliter, a concentration, not a true %); our summaries modernized (`mg%→mg/dL`, `cc→mL`) while Wallach's verbatims stay faithful + tooltipped; matcher extended for symbol-terminated tokens (`(?!\w)`); `grains` excluded (food/dose ambiguity); render-probe unit assertion locks it. Memory [[term-gloss-standard]]. (C→L)
- [ ] **Ask-Wallach offline LLM search** — natural-language search over ALL Wallach content (incl. tier-2 search-only claims). Memory [[ask-wallach-search-vision]]. (C→L)
- [ ] **Citation context expansion** — click a citation → popup with ±200 words of book context (sealed data already supports it, no re-extraction). Memory [[citation-context-expansion]]. (C)
- [ ] **anomaly_scan `unknown_botanical` detector** — needs a real genus database to be low-noise (deferred; near_miss covers misspelled genera for now). (C)
- [ ] **Search-highlight aesthetic** — tune color/weight if the flat warm `#ffe69c` needs it (optional). (L)

---

## 3 · Per-surface visual polish (each to 100% pixel + functional before "done")

_Gold-standard workflow: one surface fully finished before the next; Luneth is the visual gate._

- [ ] Coverage (⌘1) · [ ] Regimen (⌘2) · [ ] Scanner (⌘3) · [ ] Knowledge drawer (K) · [ ] Journey drawer (J) · [ ] Command Palette (⌘K) · [ ] Profile panel. (C→L)
- [ ] Final `style_diff.js` == 0 pass on every surface vs its v3 mockup (residual "live is better than the demo default" diffs are OK). (C)

_(No surface is signed-off at 100% yet. The Knowledge drawer is the most built-out — corpus browse, Conditions, Essentials deep-dives, glossary + units tooltips, content search/highlight — but has not had a formal whole-surface 100% gate. Left open, conservatively.)_

---

## 4 · Phase-4 legal / distribution wave (Wild West Mode ends here)

_Deferred to the END of the build by Luneth's standing call (2026-07-05): no legal / copyright / disclaimer work interrupts the build — one clean legal + copyright pass happens here, at the end. (The old `.claude/rules/wild-west-mode.md` that encoded this was deleted 2026-07-05; its intent is folded into project memory + this checklist. Full scope: `genesis/02-clarifications-and-plan.md` §8, superseded-but-retained for reference.)_

- [x] **Copyright scrub (source PDFs)** — the ~95 MB Wallach source PDFs were deleted 2026-07-04; the copyrighted material remaining is the book texts under `eden/corpus/books/`, gated by the repo staying private. (L + C)
- [ ] **TOS · Privacy Policy · Medical disclaimer.** (C→L)
- [ ] **LICENSE choice.** (L)
- [ ] **Attribution component.** (C)
- [ ] **Accessibility (a11y) audit.** (C→L)
- [ ] **i18n scaffolding / wrap.** (C)
- [ ] **SEO / landing page.** (C→L)
- [ ] **SECURITY.md.** (C)
- [ ] **Export raw + refined transcripts per book** for L's archive (raw lives in git history). (C)

---

## 5 · Ship gates (the final green light)

- [ ] Size budgets pass (`size-limit`): dist ≤ 250 KB gz · CSS ≤ 150 KB gz · dashboard ≤ 350 MB. (C)
- [ ] Full board green (`invariants.py`) with baseline at/near zero for the remediation invariants. (C)
- [ ] All render probes pass. (C)
- [ ] Offline / `file://` cold-open smoke test on a clean machine. (C→L)
- [ ] CDN (Cloudflare Pages) deploy dry-run. (L)

---

_Last touched: SESSION 43 (2026-07-02) — units-tooltip layer shipped; DDDL under-mine flagged for re-mine; semantic-mapping re-review added; statuses reconciled at Luneth's request._
