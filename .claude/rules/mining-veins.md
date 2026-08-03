# Mining doctrine — as-needed, never-guess book mining

_Read before mining any book claim (Phase G). **SUPERSEDES the page-by-page / vein-sweep model** (Luneth, 2026-07-17). The source rule (§00.A) and the R5 mine gate still bind in full. The file keeps its old name `mining-veins.md` so the CLAUDE.md pointer resolves; the "vein" sweep method it was named for is retired — see the ruling below._

## The ruling that rewrote this file (Luneth, 2026-07-17)
Verbatim, because the WHY is the whole point:
- **"Page-by-page mining is retired. Mine as-needed, per element / per condition."**
- **"These books are PEPPERED with errors, which is why a manual review process is required."**
- **"Never guess. Never guess silently."** His grievance with the old process: it *"would literally just make guesses WITHOUT EVEN TELLING ME it was guessing."*

Three shifts follow: the METHOD (front-to-back sweep → on-demand), the SAFETY (a mandatory human review pass), and the CARDINAL RULE (no silent guessing, ever). The old "vein vs non-vein region" framing is gone; what replaces it is below.

## Pattern
The corpus is mined ON DEMAND. When a surface — a condition page, an essential, a coverage goal, a search question — needs a Wallach claim, you mine exactly that element or condition from the source, verify it, and stop. Not a sweep. Coverage is still PROVEN, not assumed: the completeness ledger accounts for every page before a book is flagged done, so on-demand never means "forgotten."

## The cardinal rule — never guess, never guess silently
This is the heart of the doctrine and the reason the old process failed. When the source is unreadable, ambiguous, or silent:
1. **Do not invent a value, mapping, or reading to fill the gap.** A fabricated number under Wallach's name is the exact disease every gate and the 2026-07-17 audit exist to stop (memory: say-unreadable-never-guess, outside-knowledge-injected-as-wallach).
2. **Do not resolve it silently.** Any judgment call made under uncertainty is SURFACED to Luneth in the same turn — named and explicit. The old process's fatal move was guessing *without telling him*. The silence is the violation, not the uncertainty.
3. **When you cannot read it, say UNREADABLE** and note it against the literal page screenshot for his eyes (`temporary/` shots — memory: verify-against-source-images, page-images-exist-for-three-books). Over-flagging an unknown is recoverable; a silent guess is not.

## The manual review gate (non-negotiable)
Because the books are peppered with errors, no mined batch is canon until Luneth has reviewed it: **Claude proposes, Luneth ratifies.** Every unknown, every ambiguous number, every OCR-vs-page disagreement is surfaced for his pass, never resolved unilaterally. `corpus_seal` is user-only for exactly this reason (next-chunk trap #10): sealing is the human's act of ratifying canon.

## The input loop (mining + source-purification in ONE pass) — unchanged
1. **Luneth pastes** a section's PDF/OCR text into chat.
2. **Claude diffs** it against the sealed source `.txt` (the canonical). The page image / paste is the arbiter for numbers; disagreement flags an OCR defect to verify against the source image (`temporary/` screenshots, never uploaded).
3. **Correct the `.txt`** where it differs — typos, OCR defects, reused cross-book errors — via `safe_write` → `PYTHONUTF8=1 python eden/tools/corpus_resnap.py --write` (mind the draft→shard offset ordering, next-chunk trap #1; add `--fix` to re-quote verbatim-changing claims) → re-seal. Purification happens AS we mine, never as a separate later sweep.
4. **Extract claims** from the corrected span: `corpus_extract finalize` (ADD) + `mine_batch apply` (EDIT, §17-routed). Unknown substances with no catalog slug → park in the substance-triage buffer (`eden/tools/substance_triage.py park …`), leave OUT of the claim so `references_resolve` stays strict.
5. **One `corpus_seal` per coherent unit** (user-authorized), then build → invariants → build-log → Creator's Log.

## Completeness — still proven, not promised
`eden/tools/mining-coverage.json` + the `mining_coverage_accounted` invariant remain the denominator, unchanged by the method shift. A book flagged `mining_status:"complete"` must have EVERY page (screenshot-basis) or section (chapter-basis) either **claim-bearing** OR **`reviewed-empty` with a reason**. As-needed mining POPULATES this ledger element by element; a book flips to `complete` only when the whole denominator is accounted. `incomplete` books are reported informationally, never RED — so on-demand mining never blocks the board mid-campaign, and a *forgotten* region still reddens the board at completion.

## The guardrail (on-demand ≠ thin)
Mining one element on demand does NOT license capturing less of it. Inside the element / condition you mine, completeness OUTRANKS speed: capture every canon trace mineral, every book's dose even when an older book already stated it (favor the newest for placement, keep the older), and every thin-but-real substance stance. Capture EVERY search-worthy statement systematically — search is the LARGER home (`.claude/rules/search-corpus.md`). The recurring failure mode is dogmatically over-applying "be efficient" into cutting corners on real data; when unsure whether a datum matters, ASK Luneth. Over-capture is recoverable; a dropped dose is not.

## Homes for a mined claim
Each mined claim routes to its correct home — one of the three: an **essential** (essentials[]), a **condition/symptom** (conditions[]/symptoms[]), or an **Explore topic** (an enrichment subject). SEARCH pulls from all three; there is NO `search-only` silo (retired 2026-07-27). A claim can be dual-home (mapped operationally AND enriched): enriched claims show in Worth Knowing, operationally-mapped claims in The Full Record.

## Gates (unchanged — the method shift never relaxes these)
The R5 mine gate (verbatim ⊆ source · citation ∈ registry · mappings ∈ catalog · prose-contained · units-sane · amount-has-Wallach-source), plus `mined_pages_clean`, `verbatim_names_mapped_conditions`, `internal_refs_out_of_prose`, the gloss gates, `substance_triage_accounted`, `corpus_audit_gate`, and the seal hash gates. A claim cannot land unless it passes all of them.

## Enforcement
- **LIVE:** `mining_coverage_accounted` (the completeness denominator), `mined_pages_clean`, the full R5 mine-gate family, `substance_triage_accounted`. A silent DROP is machine-caught at book-completion. `no_duplicate_claims` (2026-08-03) catches the opposite failure — a silent DOUBLE: one extraction emitting a truncated take AND a full take, or a later pass re-mining a span an earlier pass covered. Both mechanisms were real and both reached the reader as twin cards.
- **Discipline (WISH, R7 — labeled, never sold as gated):** the never-guess / never-guess-silently cardinal rule and the manual review gate rest on discipline + Luneth's pass. **No machine check can prove a number was READ rather than GUESSED when the guess happens to be byte-present in the source** — the 2026-07-17 corpus audit exists precisely because that class slips every gate. The human review is the control; the completeness gate catches a silent DROP, not a silent GUESS. That honest gap IS the reason the manual review pass is non-negotiable.
