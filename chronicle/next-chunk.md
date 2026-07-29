# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-28, end of the thin-claim FINISH session)

# ★★★★★ READ FIRST (plain language)
Board **76/76 green · corpus kv430 · repo clean + pushed**. This session (1) shipped the small entity-page
question-indexing fix, and (2) FINISHED the thin-claim re-mine (Task A): 21 of the 25 staged upgrades landed.
The 4 unfinished items are all deliberate/deferred — nothing is blocking. Two follow-ups below.

---

## DONE THIS SESSION (all committed + pushed)
1. **Entity-page question-indexing fix** (commit `aaaf4c30`): the "full record" keyword filter now also matches the
   enrichment QUESTION (carried as a `data-question` attr; `applyRecordFilter` reads it). Closes the RARE-000306
   "no result" finding. Proven by a self-proving check added to `render_probe_entity.js`.
2. **Task A — thin-claim re-mine FINISHED** (corpus kv428→kv430): 21 upgrades applied via the refined **keep-verbatim
   method** — keep the current green verbatim, apply richer claim_text + answer_short (may synthesize across books);
   verbatim upgraded in-book only for DDDL-022. Claims: DDDL 022/035/036/043/047/053 · IMMORT 001/211/212/213/214 ·
   LETS 015/043/486 · RARE 004/243/306/307/308/309/311. 0 fabrications; every applied verbatim is real book text.

## ★ THE EPIGEN-137 LESSON (memory [[remine-verbatim-vs-condition-gate]] + a NEW one)
EPIGEN-137 was folded in as a re-map (silica→potassium, kind dose→definition, clean verbatim). It sealed kv429 then
turned the board RED (3 gates). **ROOT CAUSE: EPIGEN-137's table verbatim ("Silica 1 - 25 mg") is the `source_claim_id`
of silica's numeric coverage target.** Re-mapping it orphaned silica's target. → REVERTED to kv428 original, re-sealed
kv430 green, targets-data byte-identical to kv428. **NEW RULE: before re-mapping a claim's essentials/kind, grep
essentials-targets-data.json for its id as a source_claim_id — a dose claim can be a target source.** The board caught
what analysis missed (mechanical verification, never assert).

---

## TASK B — ★ TWO SMALL FOLLOW-UPS (both optional, non-blocking)
1. **EPIGEN-137 potassium-cap** — the question "Why are potassium supplements limited to 99 mg?" is real, but the
   answer must NOT cannibalize silica's target. Correct fix = give the potassium 99 mg FDA cap its OWN new claim
   (mine it: verbatim "The FDA restricts the amount of potassium in supplements to 99 mg." is an exact epigenetics.txt
   substring at the "INA:" footnote), map ess=[potassium], kind=definition; then re-point EPIGEN-137's enrichment
   question/answer_short to silica's dose (it currently mismatches — a silica dose claim with a potassium Q&A). Both
   are pre-existing mis-enrichments, now documented.
2. **3 honest GAPs (LEAVE)** — chromium/niacin/B6 TOXICITY thin claims: no doctrine in the books, only a flow-chart
   table row. Correct to leave un-remined (do NOT pad). These were always the intended endpoint for those 3.

## Staged artifacts (audit trail, temporary/enrichment-queue/thin-claims/)
proposals.json (76), REVIEW.md, targets.json, revert.json. The 21 applied are done; the 3 gaps + EPIGEN-137 remain.

## STANDING DOCTRINES (unchanged)
1. Every claim lives in ONE of three homes (essentials/conditions/Explore); search is a retrieval layer. 0 orphans.
2. Diet not food; nutrients from the DIET (food OR supplements).
3. NEVER fabricate — verbatim ⊆ the sealed book, or GAP.
4. corpus_seal + catalog_seal are USER-ONLY (this session's seals were explicit one-time authorizations).

**Corpus kv430 · 2263 sealed claims · board 76/76 green · repo clean + pushed. Fresh-session ready.**
