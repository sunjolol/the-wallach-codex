# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-27 · AMINO-ACID CATEGORY COMPLETE at kv410)

# ★★★★★ READ FIRST (plain language)
The **entire amino-acid category is now enriched** in Ask-Wallach. Batch 8 (2026-07-27) sealed the last 9 amino acids — every amino now has rich "Worth knowing" search answers, each with a SHORT and a FULL answer plus dotted-underline hover explainers for the dense science terms. **corpus at kv410, 2017 claims, enrichment 1173 entries, glossary 842 terms, board green 77/77.**

Two hard-won calibrations from this session (Luneth corrected both, MID-batch — honor them going forward):
1. **Every claim ships BOTH a short and a FULL answer** — the full answer is the STAR (it synthesizes context from across the book), the quote is supporting evidence. Short-only is a rare per-claim exception, NEVER the default. A mechanical guard now flags any claim whose full answer is missing or thinner than its quote. Memory [[claim-summary-verbatim-format]].
2. **Gloss density for hard domains is MUCH higher than instinct** — for the aminos Luneth flagged ~every technical word (sulfur-containing, S-adenosyl methionine, methyl donor, biosynthesis, cysteine, lecithin…). Default to EXPLAINING, not assuming. Memory [[gloss-scientific-terms-as-you-enrich]].

## What shipped this session (2026-07-27, Batch 8, kv409→kv410)
- 49 new search-only claims (epig +36, dddl +9, immortality +2, rare +2) + 19 reuse enriched = 68 enrichment entries; 9 amino entities w/ lay synonyms.
- 4 OCR source typos purified (Erlenmeyer / photosystem II / Kendall / post-translational ×2) + corpus_resnap (epig+rare, 0 BROKEN). Canker sealed-claim defect fixed (LETS-000202 dropped the "cold sores/fever blisters" herpes mislabel). Glossary +352 (490→842).
- Method: three fan-out workflows (authoring → adversarial verify → exhaustive gloss) + deterministic byte-verify (0/49 fail) + all pre-seal RED gates PASS. Scripts persisted in temporary/enrichment-queue/pilot/scripts/ + this session's workflow scripts in the session scratchpad.

## ENRICHMENT SCOREBOARD (subject-level, post-kv410)
| category | OK (≥7) | THIN (1-6) | NONE (0) | total |
|---|---|---|---|---|
| mineral | 20 | 6 | 34 | 60 |
| vitamin | 16 | 0 | 0 | 16 |
| amino_acid | 8 | 4 | 0 | 12 (DONE — thin ones are source-limited) |
| fatty_acid | 1 | 0 | 2 | 3 |

## ★★★ TWO WAYS TO GO (Luneth picks at genesis)
**(A) Continue enrichment** — the not-scouted list, biggest-value first (memory [[mining-serves-ask-wallach]], [[small-batch-build-test-log-mandate]]):
  - NONE, high-value dietary: **omega-6, omega-9** (fatty_acid), **nitrogen, oxygen, silica** (core minerals) — 5 elements.
  - NONE, plant-derived / rare-earth group (31): strontium, arsenic, barium, beryllium, bromine, cerium, cesium, dysprosium, erbium, europium, gadolinium, hafnium, holmium, lanthanum, lutetium, niobium, neodymium, nickel, praseodymium, rubidium, rhenium, scandium, samarium, tin, tantalum, terbium, titanium, thulium, yttrium, ytterbium, zirconium. **Luneth's directive: individual claims for EACH (group claims already exist; ≥7 unique each is the ideal, thin OK).**
  - THIN top-ups (want ≥7): minerals hydrogen(6), carbon(1), silver(1), aluminum(2), gold(2), gallium(2).

**(B) DESIGN ELEMENTS** — the deferred illustrated per-element hero screens (selenium/omega gold-standard visual pass). VISUAL / human-verification-gated: build ONE to 100%, STOP for sign-off, then next ([[visual-verification]] · [[gold-standard-page-workflow]] · [[demo-elements-still-to-do]] · [[visual-design-bar-and-principles]]).

## DEFERRED / FOLLOW-UPS (non-blocking)
- **137 unresolvable also_about cross-links dropped** this batch (dopamine, serotonin, collagen, parkinsons-disease, multiple-sclerosis, herpes, etc.) — a future entity-registration pass would register these as search entities + restore the cross-links.
- **3 scrambled OCR spans need page-image reconstruction** (histidine "His jidazole" opening L20947-53, methionine SAM cycle L21046-56, leucine India/sorghum tail immortality L3181-86) — NOT quoted by any claim, so non-blocking; fix in a source-purification pass against the page images.
- **Memory index ~22KB** — run consolidate-memory at a natural break (the "approaching limit" hook fires early per [[memory-consolidation-threshold]]).

## THE PROVEN ENRICHMENT PIPELINE (reusable)
seal_stage-equivalent (build the STAGE dir: raw/<book>.raw.json + enrichmap + enrich_existing + entities) → corpus_extract finalize per book (once per cycle — [[corpus-extract-finalize-not-additive]]) → precheck_new_claims → byte-verify verbatims → compute_wiring_gen → safe_write enrichment+entities → gloss_add → corpus_seal (USER-ONLY, "You can seal" = valid per-invocation approval) → build_embeds + search_index_derive + entity_page_derive → build → invariants → probes → round-close. Source edits: safe_write .txt → corpus_resnap --write → sync draft ← shard → finalize.
