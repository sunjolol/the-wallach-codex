# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-28, end of the thin-claim FINISH session)

# ★★★★★ READ FIRST (plain language)
Board **76/76 green · corpus kv431 · 2264 sealed claims · repo clean + pushed**. This session shipped three things
and left NO blocking work. The only remaining staged items are the 3 honest gaps, which are correct to leave.

---

## DONE THIS SESSION (all committed + pushed)
1. **Entity-page question-indexing fix** (`aaaf4c30`): the "full record" keyword filter now also matches the enrichment
   QUESTION (carried as a `data-question` attr; `applyRecordFilter` reads it). Closes the RARE-000306 "no result"
   finding. Proven by a self-proving check in `render_probe_entity.js`.
2. **Task A — thin-claim re-mine FINISHED** (`85ac75e2`, kv428→kv430): 21 upgrades via the refined **keep-verbatim**
   method (keep the current green verbatim, apply richer claim_text + answer_short; DDDL-022 also got an in-book
   verbatim upgrade). Claims: DDDL 022/035/036/043/047/053 · IMMORT 001/211/212/213/214 · LETS 015/043/486 ·
   RARE 004/243/306/307/308/309/311. 0 fabrications.
3. **EPIGEN-137 potassium-cap follow-up** (`8dcea900`, kv430→kv431): gave the FDA's 99 mg potassium cap its OWN new
   claim `WAL-CLM-EPIGEN-000463` (kind=definition, ess=[potassium], facet=basics) instead of cannibalizing silica's
   target; re-pointed EPIGEN-137's mismatched enrichment (it's a silica DOSE claim) from potassium→silica.

## ★ THE EPIGEN-137 LESSON (memory [[remap-claim-can-orphan-target]])
During Task A, folding EPIGEN-137 in as a re-map (silica→potassium) sealed kv429 and turned the board RED: **its table
verbatim "Silica 1 - 25 mg" is the `source_claim_id` of silica's coverage target**, so re-mapping orphaned it. Reverted
→ kv430 green. Then handled the potassium cap correctly as its own claim (follow-up #3 above). **NEW RULE: before
re-mapping a claim's essentials/kind, grep essentials-targets-data.json for its id as a source_claim_id.** Also: the
build-log lost its trailing newline at one commit → a later safe_append merged two entries onto one line and reddened
`build_log_append_only`; split + added a trailing newline (fixed).

---

## REMAINING (deliberately un-applied — NOT blocking)
- **3 honest GAPs (LEAVE)** — chromium/niacin/B6 TOXICITY thin claims: no doctrine in the books, only a flow-chart
  table row. Correct to leave un-remined (do NOT pad). These were always the intended endpoint for those 3.
- Staged audit trail (untouched): `temporary/enrichment-queue/thin-claims/` (proposals.json, REVIEW.md, revert.json).

## STANDING DOCTRINES (unchanged)
1. Every claim lives in ONE of three homes (essentials/conditions/Explore); search is a retrieval layer. 0 orphans.
2. Diet not food; nutrients from the DIET (food OR supplements).
3. NEVER fabricate — verbatim ⊆ the sealed book, or GAP.
4. corpus_seal + catalog_seal are USER-ONLY (this session's seals were explicit per-invocation authorizations).

**Corpus kv431 · 2264 sealed claims · board 76/76 green · repo clean + pushed. Fresh-session ready.**
