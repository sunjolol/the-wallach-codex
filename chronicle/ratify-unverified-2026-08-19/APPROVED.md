# APPROVED — 99 rewritten answer_fulls (2026-08-19)

**Luneth ruled "approve all"** on the rewritten full answers for the 99 kept unverified-book candidates
(dashboard `temporary/ratify-answers-dashboard-2026-08-19.html`). The approved answers are the
canonical record in `answer-fulls.json` (this directory). This file is the durable ruling so it
cannot be lost the way the original localStorage rulings were.

## What is approved
- The **answer_full** text for all 99 keeps — authored from a closed Wallach pool, §00.A-audited
  (0 fleet fabrications; the one "Armand" flag = OCR fix of "Armond" Trousseau; "B12" = OCR "B,,").
- **6 candidates dropped as question-duplicates of already-live claims** (not sealed, not authored):
  EPIGEN-532→465, HELLS-122→097, IMMORT-739→492, EPIGEN-552→480, IMMORT-774→516, IMMORT-732→486.
  (Plus IMMORT-743 Hunza, dropped earlier by Luneth.)

## What is NOT yet done (approval of the ANSWERS ≠ live)
These 99 are still **unsealed candidates**. To reach live search, each needs, in order:
1. **SEAL** into the corpus as a claim (claim_text + verbatim) — `corpus_extract finalize` per book →
   `corpus_seal`. **USER-ONLY act.** Watch the seal gotchas: dup keep-both allowlisting,
   verbatim-names-condition, condition-dose structuring, subject/facet/essentials mapping.
2. **ENRICH**: assemble search-enrichment (question, subject, facet, answer_short, **answer_full**,
   topics, also_about) — answer_full = the approved text here.
3. **VISION-VERIFY**: these are unverified-book verbatims → blocked from front-facing by
   `enriched_book_is_verified` until each span is page-read against the source image (same gate the
   prior 70 passed). Several claims carry a proper noun the one-line verbatim doesn't (Linus Pauling's
   father, Caucasus, Luigi/David first names) — confirm those at this step.
4. **DERIVE + BUILD** → live in search.

Pending Luneth's direction on sequencing the seal (his act).
