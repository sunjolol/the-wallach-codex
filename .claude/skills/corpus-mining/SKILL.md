---
name: corpus-mining
description: Read before mining a claim out of a Wallach book, enriching an entity for search, correcting a book source .txt, or sealing the corpus. Covers on-demand mining, the claim format Luneth reviews, the three homes a claim can live in, and the Ask-Wallach enrichment recipe.
---

# Mining and the search corpus

Mining is **on demand**, per element or per condition -- never a front-to-back page sweep (retired
2026-07-17). When a surface needs a claim, mine exactly that entity, verify it, stop. Coverage is
still *proven*: `eden/tools/mining-coverage.json` plus `mining_coverage_accounted` is the denominator,
and a book flips to complete only when every page is claim-bearing or reviewed-empty with a reason.

The books are peppered with errors, so **Claude proposes, Luneth ratifies**. Read the
`wallach-source-rule` skill first -- never guess, never guess silently, and `corpus_seal` is his act.

## ★ The claim review format -- show it in EXACTLY this shape
When presenting claims for his approval, every claim renders as four parts, in this order,
**full text by default** -- never truncated, never summarized, never reordered:

1. **Question** -- in the exact words a real person would type
2. **Short answer** -- one crisp direct line
3. **Full answer** -- the complete modern-voice answer, no inline verbatim
4. **Quote** -- Wallach's byte-exact words

He approves *the claim*, so he has to see the claim. This has been re-sent more times than any other
instruction; if you are about to show him a table of ids, or a summary, or a truncated preview,
you are about to repeat it.

## The input loop -- mine and purify in one pass
1. Luneth pastes a section's PDF/OCR text.
2. Diff it against the sealed source `.txt`. The page image is the arbiter for numbers.
3. Correct the `.txt` where it differs -> `corpus_resnap.py --write` -> re-seal. Purify as you mine,
   never as a later sweep.
4. Extract claims: `corpus_extract finalize` (add) + `mine_batch apply` (edit).
   Unknown substances with no catalog slug get parked in the triage buffer and left OUT of the
   claim, so `references_resolve` stays strict.
5. One `corpus_seal` per coherent unit (**user-authorized**), then the round-close.

**Sync the drafts after every resnap.** Sealing without syncing silently restores stale offsets --
this has bitten five times. Prove `corpus_seal.draft_offset_failures() == []` before every seal.

## The three homes
Every claim lives in exactly one of: an **essential** (the 90), a **condition/symptom**, or an
**Explore topic**. Search is a retrieval layer that pulls from all three -- there is no search-only
silo (retired 2026-07-27). Enriched claims surface in Worth Knowing; operationally-mapped claims in
The Full Record.

## All mining serves Ask-Wallach
The primary purpose of mining is to make search magical: a user types any plausible question and
gets a real Wallach answer. The recipe, matching how `state/search.ts::scoreClaim` actually ranks:
a `question` in the exact words a person types (highest weight) · the correct `subject` (drives
intent routing) · rich lay `synonyms` on the entity (the single biggest lever) · `topics[]` ·
a crisp `answer_short` · `also_about` cross-links · the correct `facet` · per-entity question
coverage.

Facets are a closed set: `basics` `discovery` `etymology` `uses` `mechanism` `sources` `stance`
`big_question` `biography` `history` `warning` `physiology` `protocol`. Every element leads with a
`basics` "What is X?" claim. Questions must start capitalized.

## Capture test
Capture a claim if it carries real distinct information **and** a real person could plausibly ask
something it answers. When unsure, capture -- a dropped answer is a hole. Never invent to fill a gap.
Completeness outranks speed *within* the entity you are mining: every trace mineral, every book's
dose even when an older book said it, every thin-but-real stance.

Only genuinely **fringe or charged** content still needs asking every time.

## Enforcement
`corpus_integrity` · `mined_pages_clean` · `verbatim_names_mapped_conditions` · `book_source_clean` ·
`search_index_wellformed` · `no_duplicate_claims` · `substance_triage_accounted` · the gloss gates.
A claim cannot land unless it passes all of them.

**Not gated, by design:** never-guess and the manual review pass. No machine check can prove a number
was *read* rather than *guessed* when the guess happens to be byte-present in the source. That honest
gap is exactly why his review is non-negotiable.
