# ★★★ NEXT SESSION — READ THIS FIRST.

**ACTIVE CAMPAIGN: introduce the 452 ruled claims into Search.** The prior session sealed 177 raw
claims but never ran the search-enrichment→index pipeline, so nothing showed in search. This session
found the root cause, proved the fix, and shipped the two verified-book engines. See memory
[[search-two-stage-and-verified-book-gate]].

## STATE (2026-08-18, board 92/92 green, corpus kv=473)
- **262 DDDL claims LIVE in search** (107 clean + 155 dirty). Search index **2140 → 2402 (+262)**.
  Family counts: Science 956 / What-To-Do 747 / Wallach's-Take 224 / Cautions 200 / Story 275.
- **Engine 1 (DDDL-dirty finalize) DONE.** The 157 dirty DDDL claims were verified against Wallach's
  own words (Luneth's rule: quote must back the claim). Result, all applied + sealed:
  - 13+2 condition synonyms added (pyorrhea→periodontal, impotence→ED, caries/cavities→tooth_decay,…)
  - 78 verbatims RE-SNAPPED to name the condition (Wallach's `HEADING → treatment` structure)
  - 36 condition-mappings dropped (quote sat in a different section) + **2 whole claims dropped**
    (#541 gum-disease, #461 eczema — mis-sourced) → **155 of 157 kept + live**
  - 11 abbreviations → plain language; 3 glosses added; 71 keep-both dup pairs allowlisted in-gate
    (`_DUPLICATE_KEEP_BOTH`, pinned in tools/test_no_duplicate_claims.py).
  - Findability check: all 157 quotes are REAL (found verbatim in DDDL). Zero fabricated.

## ✅ ENTITY-RENDER CONSISTENCY FIX (2026-08-18, committed)
Condition detail pages now render the enriched "Worth knowing" Q&A (`renderFacetGroups`) — conditions
were the ONLY entity type stuck on RAW claim cards; essentials + explore topics already rendered
enriched. Fix in `dashboard/assets/js/src/views/entity-page.ts`: `renderConditionPage` swaps raw
`renderConditionProtocol` → `renderFacetGroups` (signature broadened to `EssentialPage | ConditionPage`;
dead fn removed). Ask-Wallach ↔ condition ↔ essential ↔ topic now identical. If you touch ANY entity
render, keep all four consistent. 3 render probes green.

## THE 2 REMAINING ENGINES

1. **DDDL dose audit (22 claims).** Compare each dose to existing doses; SURFACE contradictions to
   Luneth (his "favor newest, but prove it" rule); then finalize + enrich + seal like Engine 1.
   Sources in `0ce0c20f` scratchpad (introduced-claims.json kind=dose; enrich_src has no dose entries —
   author enrichment fresh). These are §00.A-critical (amounts) — read every quote.
2. **Vision-verify the 162 unverified-book claims** → then front-face. 70 already sealed (raw records),
   92 still unsealed. Blocked by `enriched_book_is_verified` until each span is page-read against the
   in-repo images (`temporary/` PDFs + Screenshot dirs). Toolkit `tools/frontface/`; process
   `chronicle/frontface-ocr/BLUEPRINT.md` (corroboration RANKS, only a page-read VERIFIES).

## HOW ENGINE 1 WAS DONE (repeat for dose + vision)
- Verified pass: `verbatim_audit.names()` on each (claim, condition); for failures, a workflow +
  deterministic resolver classified synonym / resnap / drop against the real source (agent ±200-char
  windows OVER-DROP — always cross-check the wider source: the condition name is usually in the
  section HEADING above the treatment sentence).
- Finalize path: build `{claims:[…]}` raw → `corpus_extract finalize --book <b> --raw <f>` (writes
  DRAFT; snaps verbatims to exact bytes) → verify `corpus_seal.draft_offset_failures()==[]` →
  `catalog_seal` + `corpus_seal` (Luneth granted seal permission this session — RE-ASK each session).
- Enrich: map nkey→sealed id **positionally** (finalize assigns ids in raw order; verbatim-match
  COLLIDES when claims share a resnapped span) → resolve subjects (register new entities) → merge
  search-enrichment → derive → build. Then keep-both allowlist for surviving same-subject/facet dups.
- Key scratchpad (`279f366a`): FINAL.json, dirty_nk2id.json, resolution.json, dup_final.json,
  entity_plan.json, ddd_dirty_FINAL_raw.json.

## GOTCHAS
- Search reads `search-enrichment.json`→`search-index.json`, NOT corpus-embed. Verify by on-screen
  number. `search-enrichment.json`(LF)/`search-entities.json`,`conditions.json`(CRLF, GOLDEN-sealed).
- Draft/shard line endings: draft is CRLF — stage CRLF for safe_write.
- `catalog_seal` recomputes nothing — if you change a condition's synonyms, update
  `counts.with_synonyms` in conditions.json or the seal refuses.

## GENESIS
`genesis` → run genesis.py, report the board, then resume ENGINE 1 (dose audit) unless redirected.
