# Finalize / Polish Checklist — the pre-ship task ledger

_A living checklist of EVERY deferred "do it at the end" task, so nothing is lost as we keep mining. Luneth marks items off manually. Add to it the moment a task is deferred; never delete an unchecked item silently. Surfaced at genesis via `chronicle/next-chunk.md`._

_Legend: `[ ]` open · `[x]` done · `[~]` in progress. Owner: **L** = Luneth's call/hand · **C** = Claude executes · **C→L** = Claude drafts, Luneth signs off._

---

## 1 · Corpus truth & cleanup (the content must be RIGHT)

- [~] **Verbatim-remediation campaign → 0** (`verbatim_names_mapped_conditions`). Done: EPIGEN, RARE. Remaining: LETS ~224 · DDDL ~40 · IAIYH ~21. (C→L)
- [x] **Linguistic/logic sweep — Tier 1** (`anomaly_scan.py`) — DONE SESSION 36. All 6 books scanned; every confirmed real error fixed corpus-wide (source `.txt` + sealed verbatims); 10 true false-positives allowlisted in `eden/tools/anomaly-scan-baseline.json`. Memory [[linguistic-logic-sweep]]. (C→L)
- [ ] **Linguistic/logic sweep — Tier 2 (offline-LLM pass)** over every claim's summary+verbatim ("does this parse? unknown term? contradiction?") — the heavy-interpretation layer, leans on the Ask-Wallach model. (C→L)
- [ ] **Full dose-safety scan** — every dose/unit render-verified; dangerous misprints fixed even in verbatim. Memory [[dose-misprint-safety-mandate]]. (C→L)
- [ ] **Final number/nutrient-total correction batch** — L fixes ALL nutrient totals / targets in one end pass; don't chase number-only discrepancies mid-stream. Memory [[numbers-corrected-at-end]]. (L)
- [~] **Final per-book `.txt` OCR sweep** — SESSION 36 fixed every clear orthographic error in the ~25 verbatims TOUCHED by the anomaly campaign (systematic, all 4 mined books). REMAINING: (a) typo audit of the ~980 verbatims NOT yet touched (the book-wide typo audit Luneth deferred here SESSION 36); (b) global comma-spacing pass (` ,`→`,` book-wide, scripted + reviewed); (c) interleaved page-number / running-header lines. Memory [[source-correction-policy]]. (C)
- [ ] **Final per-book render-vs-`.txt` COMPLETENESS pass** — every table/figure/multi-column page (OCR silently DROPS sections). Risk order: DDDL first > LPD pre-Ch7 > RARE. (C)
- [ ] **Duplicate-slug audit** — scan for condition slugs that are the same thing under two names (menkes_disease/menkes_syndrome merged SESSION 35; find the rest). (C→L)
- [ ] **Finish mining remaining books** — LETS Ch10 completeness, then Immortality (2008), any other in-housed books. (C→L)
- [ ] **Fringe-knowledge disposition** — decide handling of `knowledge/fringe-knowledge/` (uncensored-edition candidate). Memory [[editorial-fringe-exclusion-policy]]. (L)

---

## 2 · Features still to build

- [ ] **Ask-Wallach offline LLM search** — natural-language search over ALL Wallach content (incl. tier-2 search-only claims). Memory [[ask-wallach-search-vision]]. (C→L)
- [ ] **Citation context expansion** — click a citation → popup with ±200 words of book context (sealed data already supports it, no re-extraction). Memory [[citation-context-expansion]]. (C)
- [ ] **anomaly_scan `unknown_botanical` detector** — needs a real genus database to be low-noise (deferred; near_miss covers misspelled genera for now). (C)
- [ ] **Search-highlight aesthetic** — tune color/weight if the flat warm `#ffe69c` needs it (optional). (L)

---

## 3 · Per-surface visual polish (each to 100% pixel + functional before "done")

_Gold-standard workflow: one surface fully finished before the next; Luneth is the visual gate._

- [ ] Coverage (⌘1) · [ ] Regimen (⌘2) · [ ] Scanner (⌘3) · [ ] Knowledge drawer (K) · [ ] Journey drawer (J) · [ ] Command Palette (⌘K) · [ ] Profile panel. (C→L)
- [ ] Final `style_diff.js` == 0 pass on every surface vs its v3 mockup (residual "live is better than the demo default" diffs are OK). (C)

---

## 4 · Phase-4 legal / distribution wave (Wild West Mode ends here)

_All deferred under `.claude/rules/wild-west-mode.md` — read `genesis/02-clarifications-and-plan.md` §8 for full scope, then DELETE wild-west-mode.md._

- [ ] **Copyright scrub** — remove/gate the ~95 MB Wallach PDFs under `knowledge/wallach-books/` before the repo/app goes public. (L + C)
- [ ] **TOS · Privacy Policy · Medical disclaimer.** (C→L)
- [ ] **LICENSE choice.** (L)
- [ ] **Attribution component.** (C)
- [ ] **Accessibility (a11y) audit.** (C→L)
- [ ] **i18n scaffolding / wrap.** (C)
- [ ] **SEO / landing page.** (C→L)
- [ ] **SECURITY.md.** (C)
- [ ] **Export raw + refined transcripts per book** for L's archive (raw lives in git history). (C)
- [ ] **DELETE `.claude/rules/wild-west-mode.md`** once the wave is done. (C)

---

## 5 · Ship gates (the final green light)

- [ ] Size budgets pass (`size-limit`): dist ≤ 250 KB gz · CSS ≤ 150 KB gz · dashboard ≤ 350 MB. (C)
- [ ] Full board green (`invariants.py`) with baseline at/near zero for the remediation invariants. (C)
- [ ] All render probes pass. (C)
- [ ] Offline / `file://` cold-open smoke test on a clean machine. (C→L)
- [ ] CDN (Cloudflare Pages) deploy dry-run. (L)

---

_Last touched: SESSION 36 (2026-07-01). When you defer something new, append it here in the same chunk — that is the whole point of this file._
