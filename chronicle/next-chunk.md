# ★★★ NEXT SESSION — READ THIS FIRST.

**ACTIVE CAMPAIGN: introduce the 452 ruled claims into Search.** Luneth ruled 452 claims INTRODUCE in
the triaged dashboard (prior session `0ce0c20f` scratchpad). The prior session sealed 177 raw claims
but **never ran the search-enrichment→index pipeline**, so nothing showed in search. This session found
the root cause, proved the fix, and is working the campaign to completion. See memory
[[search-two-stage-and-verified-book-gate]] — it explains why a sealed claim ≠ a searchable claim.

## STATE (2026-08-18, committed, board 92/92 green)
- **107 DDDL-clean claims LIVE in search** (index 2140 → 2247). Family counts moved
  (Science 903 / What-To-Do 656 / Wallach's-Take 218 / Cautions 191 / Story 274).
- **Dup ruling done:** of 56 true gate-dup pairs, Luneth kept 52 (different questions on a shared span
  = the gate's keep-both case) and DROPPED 4 nkeys: `dddl-3e-2011#518, #106, #96, #633` (all dirty,
  unsealed — just excluded from finalize). Dashboard: scratchpad `dup-ruling-dashboard.html`.

## Where all 448 introduce claims stand (452 − 4 drops)
| State | Count | DDDL | Unverified |
|---|--:|--:|--:|
| ✅ Live in search | 107 | 107 | 0 |
| 🔒 Sealed, needs vision-verify | 70 | 0 | 70 |
| ⏳ Not sealed — dirty finalize | 248 | 157 | 91 |
| ⏳ Not sealed — dose audit | 23 | 22 | 1 |

**Only DDDL + IAIYH are verified books.** The 162 unverified-book claims (70 sealed + 92 unsealed)
CANNOT front-face until vision-verified against the in-repo page images — that is the §00.A gate
`enriched_book_is_verified`. Sources are all in-repo under `temporary/` (PDFs for hk/lets/rare;
Screenshot dirs + `immortality-ocr/pages` for epig/immort). Toolkit: `tools/frontface/` (read its
README); process: `chronicle/frontface-ocr/BLUEPRINT.md` — corroboration RANKS, only a page-read
VERIFIES (~14% of agreeing claims still hid a defect).

## THE 3 REMAINING ENGINES (in priority order)
1. **DDDL-dirty finalize (157) — IN PROGRESS.** Seal the 157 DDDL dirty claims (exclude the 4 drops).
   Gate trips to clear: `verbatim_names` (add a synonym to the catalog condition so the verbatim's
   term matches, or drop the mapping — NEVER silence it blindly), `frontface` (dehyphenate the
   verbatim, byte-exact), jargon (gloss), 1 unexpl_abbr (ACE). Then enrich + add the surviving
   keep-both pairs to `_DUPLICATE_KEEP_BOTH` in tools/invariants.py (+ pin tools/test_no_duplicate_claims.py).
   Ends with Luneth's `corpus_seal` (USER-ONLY).
2. **DDDL dose audit (22).** Compare each to existing doses; SURFACE contradictions to Luneth (his
   "favor newest, but prove it" rule); enrich the non-conflicting ones.
3. **Vision-verify the 162** (frontface campaign) → then front-face them.

## KEY SCRATCHPAD ARTIFACTS (this session, `279f366a` scratchpad)
- `subject_resolution.json` / `entity_plan.json` — subject→slug map + the 53 new topics still to
  author (mostly unverified-book, so they wait for the vision phase).
- `clean_nk2id.json` — nkey→sealed-id map (verbatim+conditions verified) for the 177 clean.
- `true_dups.json` / `dup_rows.json` / `dup_rulings.json` — the 56 pairs + the 4 drops.
- `nk2id.json` — verbatim→sealed-id for all 429.
- The 452 rulings + enrich_src: prior scratchpad `0ce0c20f` (`introduced-claims.json`,
  `enrich_src.json` (429 authored enrichments), `clean_subset.json`, `audit_map.json`, `finalize_raw/`).

## GOTCHAS
- **Search reads `search-enrichment.json` → `search-index.json`, NOT corpus-embed.** Adding a raw
  claim never makes it searchable; needs an enrichment entry (subject resolving to a REGISTERED entity
  or canon) + `python eden/tools/search_index_derive.py` + `node tools/build.mjs`. Verify by the
  on-screen number, never the data file. `search-enrichment.json` (LF) + `search-entities.json` (CRLF)
  are NOT golden-sealed — normal safe_write.
- **Registered 25 new search entities this session** (14 conditions incl. endometriosis/rosacea/
  uterine_fibroids/celiac + 3 topics immunotherapy/nausea/lactation_suppression + the prior 8). New
  condition subjects need a `{catalog_ref:true,type:condition,synonyms:[…]}` registry entry.
- **Prior session hardened the 3 seal tools** (`_guard_cli` blocks `seal.py --help` from sealing).

## GENESIS
`genesis` → run `PYTHONUTF8=1 python tools/genesis.py`, report the board, then resume ENGINE 1
(DDDL-dirty finalize) unless Luneth redirects.
