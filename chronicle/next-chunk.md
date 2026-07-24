# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-24 · ORAC Phase 2 SHIPPED · next = Phase 3 FOOD-TABLE MINING)

# ★★★★★ The live ORAC knowledge tab (Knowledge drawer, right after Absorption) is built in phases from the signed-off design `temporary/orac-EDITED.html` (LOCAL ONLY, gitignored — the only copy; read it first). Full plan + LOCKED decisions: memory `orac-live-view-build-plan`.

## ✅ Phase 1 + Phase 2 SHIPPED
- **Phase 1** (cb8bda74): editorial hero §01 + full-record claims index §09 (31 live cards from `oracClaims()`).
- **§02 mining** (9adedbbd): the two mirror-test visuals sealed as claims (IMMORT-000261 decade table, 000262 rank decline).
- **Phase 2** (THIS commit): the §02 (mirror-test / stolen-years / damage-chain) + §03 (daily target) + §08 (four pieces / forces / payoff) narrative sections, spliced BETWEEN the hero and the claims record. **Every Wallach number is DERIVED from sealed claims** — `eden/tools/orac_data_derive.py` parses each figure out of the source claims' byte-faithful verbatim → `dashboard/assets/data/orac-data.json` (registered in `eden/derived/MANIFEST.json` artifacts[], byte-gated by `derived_artifacts_fresh`). NEW `core/schemas/orac-data.ts` + `state/orac.ts`; +59 `kd_orac_*` view-copy keys (numbers ONLY as {placeholders}). Caught+fixed a CSS comment `*/` bug that had blanked the bar colours (memory `css-comment-star-slash-drops-rule`); `render_probe_orac.js` now asserts computed colour. Board 77/77. Luneth signed off ("looks identical").

## ▶ NEXT — Phase 3: the food league-tables (§04–07). HAS A MINING DEPENDENCY.
The demo's **§04 REACH · §05 SCALE · §06 TABLES · §07 WINE** need per-serving ORAC food values. **15 rows already mined** (IMMORT-000240/241, HELLS-000014). **~39 MORE rows are UNMINED** in `immortality.txt` pp.378–381 (lines ~16760–16821) — incl. the demo's hero foods pecan 17,940 + blueberry juice 9,019.
- **MINE them into the corpus FIRST** — small batches, Luneth reviews EACH claim, NEVER guess (`.claude/rules/mining-veins.md`; memories `small-batch-build-test-log-mandate`, `say-unreadable-never-guess`, `verify-against-source-images`). `corpus_seal` is USER-ONLY.
- Then a DERIVED food artifact (same pattern as `orac-data.json`) parses the rows → the reach / scale / tables / wine computed bars. **DON'T hand-type the values** (the mineral-tiers poison; R1/R3).
- Also mine here: the Walford **"great white sharks in the biochemical sea"** quote (real book text, `immortality.txt:1896–1899`) — currently framing prose in the §02 damage-chain intro.
- When §04–07 land, the section numbers become contiguous (Phase 2 currently jumps 03→08).

## ▶ THEN — Phase 4: claim-card expand-to-verbatim (the §09 cards are static by design today).

## 🔎 FYI carried from Phase 2 sign-off
- Payoff cite renders book-level ("Immortality (2008)") because claim 000259 has no page locator (the demo showed "pp.32 · 376–377 · 380").
- Forces copy says "toward the 150" per the signed-off demo; Wallach's stated max is actually 200 (IMMORT-000260: "150, 175 or 200"). Luneth is aware; left as the demo has it.

## 🔧 MECHANICS — load-bearing
- CSS is LINKED (no rebuild); JS/data need `node tools/build.mjs`. Creator's-Log embed inlines at BUILD → re-inline AFTER logging.
- **Derived-artifact flow:** write generator (build_data/write_data via safe_write) → register in `eden/derived/MANIFEST.json` artifacts[] → `build_embeds.py` regenerates → `derived_artifacts_fresh` byte-gates. Deterministic (sorted keys, NO timestamp) so build_fn byte-compares to disk.
- **Corpus mining flow:** purify `.txt` (record in `eden/tools/purity-specs/<book>.json`) → `corpus_resnap --write` (AFTER the LAST .txt edit — else seal refuses) → sync draft offsets → `corpus_seal` (USER-ONLY) → `build_embeds` → `search_index_derive` → `build.mjs`.
- Every write via `safe_write` (LF payloads; multi-edit → Python driver with count==1 asserts).

## 🔴 STILL DEFERRED (carried)
- **Ask-Wallach ranking miss:** "highest antioxidant food" ranks the weight-loss WARNING above "Which foods have the highest ORAC score?" (a real scoring miss in `state/search.ts::scoreClaim`).
- **Products in search / product-ORAC:** only Beyond Tangy Tangerine states an ORAC score (5,745 / 8,000 / 160,000 — the last per-container vs per-serving); deferred by Luneth until we fully understand ORAC. "Top-10 products by ORAC" is NOT buildable from the pillars today.
- **8 related-pill slugs with no page** (digestion, epigenetics, margarine, ph, poultry, silicon, villi, wheat) — Explore-topic mining candidates.
- testosterone→strength (mining gap). design-system.css stale reduced-motion comment (7→6 offenders; needs a per-file seal green light).

## 🔴🔴 REVIEW PROCESS (every corpus/content touch): show each claim in EXACT final form (Q→short→[full if it adds]→quote), Luneth approves the CLAIM. `corpus_seal` USER-ONLY.
