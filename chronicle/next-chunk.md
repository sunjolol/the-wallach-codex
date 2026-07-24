# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-24 · ORAC Phase 3 MINING SHIPPED · next = §04–07 tables VIEW build)

# ★★★★★ The live ORAC knowledge tab (Knowledge drawer, right after Absorption) is built in phases from the signed-off design `temporary/orac-EDITED.html` (LOCAL ONLY, gitignored — the only copy; read it first). Full plan + LOCKED decisions: memory `orac-live-view-build-plan`.

## ✅ SHIPPED so far
- **Phase 1** (cb8bda74): editorial hero §01 + full-record claims index §09 (31 live cards from `oracClaims()`).
- **§02 mining** (9adedbbd): the two mirror-test visuals sealed (IMMORT-000261 decade table, 000262 rank decline).
- **Phase 2 view** (31cfd969): §02 (mirror / stolen-years / damage-chain) + §03 (daily target) + §08 (four pieces / forces / payoff), spliced between hero and claims. Every number DERIVED from sealed claims via `eden/tools/orac_data_derive.py` → `dashboard/assets/data/orac-data.json` (MANIFEST-registered, byte-gated). NEW `core/schemas/orac-data.ts` + `state/orac.ts`; +59 `kd_orac_*` view-copy keys (numbers as {placeholders}). `render_probe_orac.js` asserts the sections + computed colours. Luneth signed off.
- **§04–07 food-table MINING** (36a3024c): the last 39 per-serving ORAC food rows (Immortality pp.378–381) sealed as WAL-CLM-IMMORT-000263 (16 rows) + 000264 (23 rows), both `food_source`, contiguous byte-faithful spans, tags [orac,food-sources,search-only]. The full table (54 rows) is now claims: 000240 (11) + 000241 (4 wines) + 000263 (16) + 000264 (23). knowledge_version 388, 1381 claims. Board 77/77.

## ▶ NEXT — §04–07 tables VIEW (the food league-tables). NO mining left; all data is in the corpus.
Recreate the signed-off demo's food sections on the DERIVED data (mineral-tiers lesson: never hand-type the values). Sections + sources:
- **§04 REACH** — a curated ~9 foods as % of the 25,000/day target (target.high from orac-data.json); % = round(value/25,000·100). e.g. pecan 17,940→72%, hazelnuts 9,275→37%, blueberry juice 9,019→36%.
- **§05 SCALE** — the spice-outlier bars (~6 foods), bar% relative to cloves 314,446 (=100%).
- **§06 TABLES** — 8 category league tables (Spices · Nuts · Beans & grains · Berries & fruit · Juices · Vegetables & tea · Wine · Chocolate) each sorted desc, bars relative to the category max; PLUS the Hell's Kitchen top-ten (HELLS-000014, per-100 g — a DIFFERENT basis, labelled not silently mixed).
- **§07 WINE** — the 13:1 red-vs-white (from 000241): cabernet 5,034 (=100%) · merlot 3,873 · rosé 1,005 · white 392.

**The build (mirrors Phase 2):**
1. **NEW derive** `eden/tools/orac_foods_derive.py` → `dashboard/assets/data/orac-foods-data.json`: parse (name, ORAC) from the `food_source` claim VERBATIMS (240/241/263/264 + HELLS-14), then compute the reach/scale/tables/wine structures. MANIFEST-register → byte-gated by `derived_artifacts_fresh`. HARD-FAIL on a parse miss.
2. **The editorial CURATION** (food→category map, the reach ~9 + scale ~6 selections, display-name fixes: Suavignon→Sauvignon, Pomagranate→Pomegranate, Gogi→Goji, "Aronia Black chokeberry"→"Aronia chokeberry") lives in a HAND-AUTHORED, numbers-free curation file (like foods-curation.json), MANIFEST-`accounted`. The NUMBERS stay in the derive (from claims); only NAMES/grouping/selection are curated. Mirror the demo's exact groupings + selections.
3. `core/schemas/orac-foods-data.ts` + `state/` reader (Zod boundary) + the 4 view sections in `views/knowledge-orac.ts`, spliced BETWEEN §03 and §08 (they currently sit adjacent — inserting 04–07 makes the section numbers contiguous 01–09).
4. Framing prose → `kd_orac_*` view-copy keys (the demo's section kickers/headings/intros + the scale note + the reach caption "hatching marks the portion above target" + the tables intro "different basis, labelled").
5. build → invariants (0 new red) → extend `render_probe_orac.js` (assert the 4 sections + a spot value) → **STOP for Luneth's visual sign-off** → round-close (build-log · Creator's Log · re-inline · commit).

⚠ CSS for §04–07 is ALREADY ported in `drawer-orac.css` (`.kd-orac-reach/scale/tables/tbl/row/…`). Watch the CSS comment-`*/` trap ([[css-comment-star-slash-drops-rule]]) if you touch that file; the probe now asserts computed colour.

## ▶ THEN — Phase 4: claim-card expand-to-verbatim (the §09 cards are static by design today).

## 🔎 FYI (carried from the Phase-2/mining sign-offs)
- Payoff cite renders book-level ("Immortality (2008)") — claim 000259 has no page locator (demo showed "pp.32 · 376–377 · 380").
- Forces copy says "toward the 150" per the signed-off demo; Wallach's stated max is 200 (IMMORT-000260). Luneth aware.
- The 4 baby-food rows in 000263 are captured byte-faithfully but the demo omits baby food — the §06 curation should likewise NOT surface them.

## 🔧 MECHANICS — load-bearing
- CSS is LINKED (no rebuild); JS/data need `node tools/build.mjs`. Creator's-Log embed inlines at BUILD → re-inline AFTER logging.
- **Derived-artifact flow:** generator (build_data/write_data via safe_write) → register in `eden/derived/MANIFEST.json` artifacts[] → `build_embeds.py` regenerates → `derived_artifacts_fresh` byte-gates. Deterministic (sorted keys, NO timestamp) so build_fn byte-compares.
- Every write via `safe_write` (LF payloads; multi-edit → Python driver with count==1 asserts).
- `corpus_seal` is USER-ONLY (per-invocation approval); Luneth authorized the mining seal explicitly this session.

## 🔴 STILL DEFERRED (carried)
- **Ask-Wallach ranking miss:** "highest antioxidant food" ranks the weight-loss WARNING above "Which foods have the highest ORAC score?" (`state/search.ts::scoreClaim`).
- **Products in search / product-ORAC:** only Beyond Tangy Tangerine states an ORAC score; deferred by Luneth until we fully understand ORAC.
- **8 related-pill slugs with no page** (digestion, epigenetics, margarine, ph, poultry, silicon, villi, wheat) — Explore-topic mining candidates.
- testosterone→strength (mining gap). design-system.css stale reduced-motion comment (needs a per-file seal green light).

## 🔴🔴 REVIEW PROCESS (every corpus/content touch): show each claim in EXACT final form (Q→short→[full if it adds]→quote), Luneth approves the CLAIM. `corpus_seal` USER-ONLY.
