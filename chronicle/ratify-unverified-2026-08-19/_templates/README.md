# Landing-pipeline template scripts (durable handoff, 2026-08-19)

These are the concrete, working scripts used to land the last 3 books
(immortality = screenshot-spread; rare-earths + lets-play-doctor = PDF-clean).
They are REFERENCE TEMPLATES to adapt per book, not run as-is (session-scoped
absolute paths are embedded). The authoritative method is
`chronicle/ratify-unverified-2026-08-19/RUNBOOK.md`; these show the exact code.

## For the LAST remaining book, epigenetics (SCREENSHOT-SPREAD, like immortality)
Reuse the `01..08` screenshot scripts. Change the book id to `epigenetics`,
screenshots dir to `temporary/Epigenetics.../`, OCR cache glob to
`ocr-epig-*.json`. The vision fleet reads dual-monitor Kindle `Screenshot (N).png`
(book on the LEFT ~48%); locate via `tools/frontface/corr_shots.py` ShotBook.

## Pipeline order (proven 4x)
0. assemble keeps (candidate ∩ keep ∩ has-answer) + QUESTION dedup (01) + CLAIM_TEXT dedup vs sealed (02)
1. locate verbatims -> screenshot pages (03) -> vision fleet (04, one agent per page)
2. build corrected verbatims: de-hyphenate + content/misspelling fixes; KEEP ours on page-typos, log divergence (06)
   condition-mapping analysis (05): extend / drop-to-search-only / defensible synonym (catalog_seal) / remap
3. build finalize-raw + enrichment (07): subject MUST resolve to registry/essentials; unregistered topic -> resolving fallback
4. SEAL: catalog_seal(if synonyms) -> finalize -> corpus_seal -> patch .txt spans (08) + corpus_resnap --write --fix
   -> sync draft <- shard -> reseal -> claims_verified += ids -> merge enrichment -> derive + build_embeds + build.mjs
5. clear post-build reds (esp. no_duplicate_claims: a NEW claim can twin an EXISTING sealed one -> re-facet/re-subject
   or per-pair rule) -> board 94/94 -> round-close (divergences log, next-chunk, build-log, creator's log, rebuild, commit+push)

## Gotchas (all hit this session)
- PNG page renders: render to SCRATCHPAD, not the repo (rare-earths bloated a commit 18MB). See PDF_render..._TO_SCRATCHPAD.
- Workflow .js must be LF-only (a CR trips the approval-dialog control-char check).
- The PDF/OCR text layer is often WORSE than our purified .txt; the page IMAGE is the arbiter, KEEP ours on page typos.
- Line endings per file: CRLF = conditions.json/verified.json/draft/glossary.json; LF = book .txt/search-enrichment.json/invariants.py.
- corpus_seal promotes ALL drafts; corpus_resnap edits the SEALED shard so SYNC the draft before reseal.
