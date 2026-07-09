# Vein-mining doctrine — selective, efficient book mining

_Read before resuming any book-mining batch (Phase G). The efficient HOW for finishing the corpus WITHOUT a full-page sweep. The source rule (§00.A) and the R5 mine gate still bind in full — efficiency comes from SCOPE + SEAL CADENCE, never from relaxing a gate._

## Pattern
A book is mined for its VEINS — regions dense with mineable value — not swept page-by-page. Non-vein regions are reviewed and dispositioned with a reason, never silently dropped. "Fast" is achieved by (a) skipping low-value regions and (b) sealing once per vein — not by lowering the bar on any claim that DOES land.

## The input loop (mining + source-purification in ONE pass)
1. **Luneth pastes** a section's PDF/OCR text into chat.
2. **Claude diffs** it against the sealed source `.txt` (the canonical). The page image / paste is the arbiter for numbers; disagreement flags an OCR defect to verify against the source image (`temporary/` screenshots, never uploaded).
3. **Correct the `.txt`** where it differs — typos, OCR defects, reused cross-book errors — via `safe_write` → `PYTHONUTF8=1 python eden/tools/corpus_resnap.py --write` (add `--fix` to re-quote verbatim-changing claims) → re-seal. This completes the book-source-purification campaign as we go (2/6 books pristine at the start of Phase G), so purification is not a separate later sweep.
4. **Extract claims** from the corrected span: `corpus_extract finalize` (ADD) + `mine_batch apply` (EDIT, §17-routed). Unknown substances with no catalog slug → park in the substance-triage buffer (`eden/tools/substance_triage.py park …`), leave OUT of the claim so `references_resolve` stays strict.
5. **One `corpus_seal` per vein** (user-authorized), then build → invariants → build-log → Creator's Log.

## What is a vein
- **Vein — mine 100%:** A-Z element/mineral encyclopedias (e.g. Immortality's `Sym-Name` section), dose / protocol tables, condition→treatment sections (materia medica), deficiency-sign catalogs, "supplement program" / "base-line" dose lists — any region that yields dose / deficiency / protocol / definition / stance claims.
- **Non-vein — review + disposition:** narrative, biography, anecdote, industry-overview, polemic, and repetition already captured elsewhere.
- Each mined claim routes to its correct home: **tier-1 operational** (conditions / symptoms / essentials) OR **search-only** (broader Wallach guidance), per the per-book policies in the corpus rules.

## The guardrail (fast ≠ sloppy — the core risk to manage)
Selective means skipping low-value **regions** — NEVER valuable **data inside a mined region**. The judgment is region-level only. Inside a vein, completeness OUTRANKS speed: capture every canon trace mineral, every book's dose even when an older book already stated it (favor the newest for placement, keep the older), and every thin-but-real substance stance. The recurring failure mode is dogmatically over-applying "be efficient" into cutting corners on real data — when unsure whether a region is a vein, or whether a datum matters, ASK Luneth. Over-capture is recoverable; a dropped dose is not.

## Seal cadence (the efficiency Luneth asked for)
ONE vein — or a coherent run of elements / pages — per seal, sized to what can be verified accurately in a single pass. NOT a re-seal per letter. The mine gates run once per batch; the batch cannot seal until the board is green.

## Honest completeness (already gated — the safety net)
`eden/tools/mining-coverage.json` + the `mining_coverage_accounted` invariant are the denominator. A book flagged `mining_status: "complete"` must have EVERY page (screenshot-basis) or section (chapter-basis) either **claim-bearing** OR **`reviewed-empty` with a reason**. So a deliberately-skipped non-vein is HONEST (reviewed + reasoned) and a *forgotten* region reddens the board at completion. Populate the vein-map (mined regions + `reviewed_empty` reasons) as we mine; flip a book to `complete` only when the whole denominator is accounted. `incomplete` books are reported informationally, never RED — so mid-mining never blocks the board.

## Gates (unchanged — efficiency never relaxes these)
The R5 mine gate (verbatim ⊆ source · citation ∈ registry · mappings ∈ catalog · prose-contained · units-sane · amount-has-Wallach-source), plus `mined_pages_clean`, `verbatim_names_mapped_conditions`, `internal_refs_out_of_prose`, the gloss gates, `substance_triage_accounted`, `corpus_audit_gate`, and the seal hash gates. A vein cannot land unless it passes all of them.

## Enforcement
- **LIVE:** `mining_coverage_accounted` (the selective-completeness denominator), the full R5 mine-gate family, `substance_triage_accounted`. The doctrine's HONESTY (no silent drop) is machine-checked at book-completion.
- **Discipline:** the vein-vs-non-vein call and the paste→diff input loop are review discipline — Luneth is the decision + visual gate. The completeness gate catches a silent drop; the judgment stays human.
