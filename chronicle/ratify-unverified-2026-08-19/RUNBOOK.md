# RUNBOOK — landing the ruled unverified-book claims (per-book, end-to-end)

_The complete how-to, decisions, and gotchas. Hell's Kitchen ran this clean (commit `544ff3d7`, kv=480).
Nothing here should be re-derived — it's all captured. Read this before touching the next book._

## STATE (2026-08-19)
- **99 `answer_full`s APPROVED** ("approve all" + "push live", Luneth). Canonical: `../answer-fulls.json` (keyed by `proposed_id`).
- **Luneth's keep/drop rulings for all 113 candidates**: `../luneth-rulings-113.json` (decision ∈ keep|merge|drop).
- **HELL'S KITCHEN — LANDED** (kv 476→480, board 94/94). 23 live, 116 dropped (Accutane dup), 101+102 keep-both. Worked example: `hells-kitchen/` (finalize-raw, enrichment, idmap, vision-results).
- **REMAINING (79 keeps):** immortality (33), epigenetics (18), rare-earths (13), let's-play-doctor (15).

## WHERE EVERYTHING LIVES (all committed)
- `../recovered-candidates.json` — all 113: `{proposed_id, book, kind, conditions, question, answer_short, claim_text, verbatim, dedup, notes, default_ruling}`.
- `../answer-fulls.json` — the 99 approved: `{proposed_id, answer_full, used_claim_ids, genuinely_short, notes}`.
- `../luneth-rulings-113.json` — his keep/drop.
- `scripts/` — `build_ratify.py` (recover+dedup+audit), `gen_dashboard*.py` (review boards), `audit_answers.py` (§00.A number+name trace), `author-input.json` (per-claim payload + 8-claim tidbit pool used to author answers).
- **Per-book landing input** = `recovered-candidates.json` filtered by `book` ∩ `luneth-rulings-113.json` decision==keep, joined to `answer-fulls.json`.

## BOOK VERIFICATION STATUS
- `books_verified` = {dddl, iaiyh}. The 5 tranche books are **UNVERIFIED** → every claim needs **vision-verify → `claims_verified`** before it can front-face (root-cause gate `enriched_book_is_verified`; ledger `chronicle/frontface-ocr/verified.json`).
- **PDF-clean books** (easy vision path): rare-earths, let's-play-doctor (+ hells-kitchen done). Mapped in `tools/frontface/{pdf_corroborate,render}.py`.
- **Screenshot-spread books** (harder — dual-monitor crop): immortality, epigenetics. Use the Tesseract cache path (`tools/frontface/corr_shots.py`) + crop x≈0.028–0.48; retry the adjacent Screenshot before declaring UNVERIFIABLE.

## THE PER-BOOK PIPELINE

### Phase 0 — assemble the keep set + QUESTION-DEDUP FIRST
- keeps = candidates for BOOK with ruling==keep.
- **Run the question-dedup BEFORE anything** (catches near-dup questions like Hunza/Accutane early, not at the seal gate): each keep's `question` vs (a) live `search-enrichment` questions and (b) other candidates — `difflib.SequenceMatcher.ratio()≥0.82` OR token-Jaccard≥0.72. Exact/near dups → drop (or keep-both if genuinely distinct). This is the check that would have caught HELLS-116.

### Phase 1 — VISION-VERIFY (mandatory; the page image is the §00.A arbiter)
- **Locate:** `import pdf_corroborate as pc; pc.run(BOOK, [{id,verbatim,verbatim_len}])` → per-claim PDF page + OCR-disagreement hunks. (All 24 HK located ≥0.85 coverage.)
- **Render:** `fitz` `get_pixmap(matrix=Matrix(3.2,3.2))` on the located page (+ next page) → PNG. `render.py` also does this.
- **Fleet:** one general-purpose agent per claim (Workflow, `agentType:'general-purpose'`); each Reads its page PNG(s) + the verbatim + ocr hunks; returns `{id, located, verdict: VERIFIED-CLEAN|DEFECTS|UNVERIFIABLE, defects:[{ours,page_says}], corrected_verbatim, notes}`. Rule: faithful line-break hyphens ("Beri- beri") are NOT defects; confirm every DIGIT. (HK: 21 clean, 3 tiny OCR typos, 0 dose defects.)

### Phase 2 — CONDITION-MAPPING SIMULATION (do this BEFORE sealing — the biggest gotcha)
Simulate `verbatim_names_mapped_conditions` on the draft: `verbatim_audit.names(verbatim_audit.norm(vb), slug, display, syn)` per claim×condition (syn from `verbatim_audit.load_syn()`; display from `conditions.json`). A False = the mapped condition is NOT named in the quote → the gate will red the board.
**Remediation policy (Luneth-approved 2026-08-19):**
- **EXTEND** the verbatim to a coherent nearby span that names the condition (only if the source names it within ~a paragraph — check ±900 chars; do NOT grab a journal-name citation just to pass).
- **DROP** the mapping if the quote genuinely doesn't name it → claim becomes **search-only** (still surfaces in search + Explore via subject/topics, just not on that condition page). HK dropped: thyroid×2, obesity×3, constipation, exercise/bone = 7 search-only.
- **ADD a DEFENSIBLE catalog synonym** (`conditions.json`, Luneth ratifies via `catalog_seal`) where the quote uses a faithful generic term for the specific slug — e.g. `cholesterol`→high_cholesterol, `beri beri`→beriberi. NOT for stretches (thyroid/obesity/constipation were declined).
- **DEDUP** (gate `no_duplicate_claims`, post-build): per-pair ruling — drop one, or keep-both via `_DUPLICATE_KEEP_BOTH` in `tools/invariants.py`. **NEEDS LUNETH per pair.**

### Phase 3 — build the seal bundle
- **finalize-raw** `{claims:[{kind, essentials, other_substances:[], conditions(normalized+registered), symptoms:[], claim_text, verbatim(ORIGINAL — snaps to current .txt; OCR fixes go in at resnap), tags, confidence:"high"}]}`. Conditions MUST be registered catalog slugs (validate vs `conditions.json['conditions']` keys; map variants: drop synonym-covered like "childhood-obesity"→obesity syn, fix "birth defects"→`birth_defects`). `essentials` only where nutrient-central (HK: thiamine→vitamin-b1, chromium claim→chromium).
- **enrichment** keyed by SEALED id (via idmap): `{subject, also_about, facet, question, answer_short, answer_full(approved), topics}`.
  - `facet` = kind→facet: mechanism→mechanism, deficiency_sign→physiology, protocol→protocol, food_source→sources, quote→stance, toxicity_sign→warning, prevalence→history, contraindication→warning.
  - **`subject` MUST resolve** to the substance registry OR essentials-canon (`search_index_derive` HARD-FAILS otherwise). thiamine→`vitamin-b1`. Unregistered substances (accutane, statins, trans fats, blueberries) → use a resolving subject (the condition, or `cholesterol` which resolves).

### Phase 4 — SEAL SEQUENCE (exact order; every `*_seal` is USER-ONLY, needs per-invocation approval)
1. Synonyms (if any): surgical CRLF edit of `conditions.json` + bump `counts.with_synonyms` + `python eden/tools/catalog_seal.py`.
2. `python eden/tools/corpus_extract.py finalize --book BOOK --raw finalize-raw.json` → draft (existing+N), assigns ids (idmap = **input order → sealed ids**). Board stays green.
3. If remediation dropped mappings: edit those conditions in the draft in place (safe_write).
4. `python eden/tools/corpus_seal.py` → promotes ALL drafts (others are byte-identical mirrors = no-op), kv+1, internal corpus_verify.
5. Fix source `.txt` OCR defects + de-hyphenate front-facing spans (`python tools/frontface/fix_hk_hyphens.py` — it DEFAULT-WRITES; adapt for other books).
6. `python eden/tools/corpus_resnap.py --book BOOK --write --fix fixes.json` — letters-changed→BROKEN needs `--fix {sealed_id: corrected_verbatim}`; whitespace/hyphen→auto-HEAL. Writes shard + re-hashes books-meta.
7. **SYNC the draft from the corrected shard** (`draft['claims']=shard['claims']`, safe_write) — reseal REFUSES if draft stale.
8. `python eden/tools/corpus_seal.py` (reseal).
9. `claims_verified += sealed ids` → `chronicle/frontface-ocr/verified.json` (CRLF).
10. Merge enrichment → `eden/corpus/search-enrichment.json` (LF).
11. `python eden/tools/search_index_derive.py` (fix subject-resolve fails) + `python eden/tools/build_embeds.py` + `node tools/build.mjs`.
12. `PYTHONUTF8=1 python tools/invariants.py`. Fix post-build reds: frontface hyphens (fix→resnap→sync→reseal), jargon gloss (`dashboard/assets/data/glossary.json` `terms` list, CRLF), no_duplicate_claims (per-pair ruling), subject-resolve.
13. Green when board 94/94 AND `entity_page_enriched_matches_search` passes (= the "search but not on topic" defect is clean — Luneth's #1 concern).

## GOTCHAS (all hit on HK)
- `corpus_seal` promotes ALL drafts and verifies AFTER promoting → **simulate gates on the draft first** (verbatim-names-condition, dup).
- `corpus_resnap` edits the SEALED shard, not the draft → **sync the draft before reseal** (5×-bitten footgun).
- `catalog_seal` refuses if `counts.with_synonyms` is stale → bump it when adding a synonym.
- `search_index_derive` hard-fails on an unresolvable `subject`.
- `fix_hk_hyphens.py` DEFAULT-WRITES (no `--dry`).
- **Line endings per file** (safe_write is byte-exact — match them): CRLF = `conditions.json`, `verified.json`, the draft, `glossary.json`; LF = `hk.txt`, `search-enrichment.json`, `invariants.py`.
- §00.A: every dose/number AND proper noun in an `answer_full` must trace to the closed pool (verbatim + tidbit pool + the claim's own claim_text/answer_short) — deterministic audit (`audit_answers.py`). Agents DO occasionally import (HK: "Schuessler", "Armand", "Luigi") — the audit + Luneth's review catch them.

## ANSWER BAR (approved)
Rich WHERE the Wallach corpus genuinely supports it, **no padding, natural length** (a genuinely short answer is fine). Authored from a CLOSED pool (verbatim + 8 related sealed claims) — **no outside facts**. The 99 approved answers in `answer-fulls.json` are the exemplars/bar.
