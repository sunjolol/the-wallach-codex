# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-24 · ORAC Phase 3b food-table VIEW SHIPPED · next = Phase 4 claim-card expand-to-verbatim)

# ★★★★★ The live ORAC knowledge tab (Knowledge drawer, right after Absorption) is built in phases from the signed-off design `temporary/orac-EDITED.html` (LOCAL ONLY, gitignored — the only copy; read it first). Full plan + LOCKED decisions: memory `orac-live-view-build-plan`.

## ✅ SHIPPED so far
- **Phase 1** (cb8bda74): editorial hero §01 + full-record claims index §09 (31 live cards from `oracClaims()`).
- **§02 mining** (9adedbbd): the two mirror-test visuals sealed (IMMORT-000261 decade table, 000262 rank decline).
- **Phase 2 view** (31cfd969): §02 (mirror / stolen-years / damage-chain) + §03 (daily target) + §08 (four pieces / forces / payoff). Every number DERIVED from sealed claims via `eden/tools/orac_data_derive.py` → `orac-data.json` (byte-gated). `core/schemas/orac-data.ts` + `state/orac.ts` + 59 `kd_orac_*` keys.
- **§04–07 food-table MINING** (36a3024c): the last 39 per-serving ORAC food rows sealed as IMMORT-000263 (16) + 000264 (23). Full table = 54 per-serving rows (240 + 241 + 263 + 264) + 10 per-100 g (HELLS-000014).
- **Phase 3b food-table VIEW** (1c3d9a09, 2026-07-24): §04 REACH (9 foods vs the 25,000 target) · §05 SCALE (spice outlier) · §06 TABLES (8 per-serving category league-tables + the Hell's Kitchen per-100 g top-ten, labelled a DIFFERENT BASIS not silently mixed) · §07 WINE (13:1 red-vs-white), spliced between §03 and §08. NEW `eden/tools/orac_foods_derive.py` parses the food_source claim verbatims (240/241/263/264 + HELLS-14) + the hand-authored numbers-free curation `dashboard/assets/data/orac-foods-curation.json` (names/grouping/colour/selection/omit; HARD-FAILS on an unresolved name or a silently-dropped pool row) → byte-gated `orac-foods-data.json`. NEW `core/schemas/orac-foods-data.ts` + `state/orac-foods.ts`; +12 `kd_orac_*` keys (numbers = {placeholders}); `render_probe_orac.js` +6 food checks. Board 77/77. Independent 3-agent adversarial verify clean. Luneth signed off. **No new seal** — the food claims were sealed in the 3a mining.

## ▶ NEXT — Phase 4: claim-card expand-to-verbatim (the §09 cards are static by design today)
`oracClaimCard()` in `views/knowledge-orac.ts` renders each §09 record as question + `answer_short` + `composeShortCite()` — STATIC (no expand). Phase 4 makes a card expand to the full `verbatim` + full cite on click, the way `renderSearchCard` does on other Knowledge surfaces (reuse that path if it fits the ORAC card markup / CSS in `drawer-orac.css`). Match the demo's claim-card interaction. Ends at Luneth's visual sign-off.

## 🔎 FYI (carried)
- **Reach caption cite** renders book-level "Immortality (2008)" (not the demo's "pp.378–381") — the food_source claims locate by SCREENSHOT (no printed-page locator), the same accepted fallback as the §08 payoff cite. If Luneth wants the page range, add printed-page locators to claims 000240/241/263/264 and compose it.
- **Payoff cite** renders book-level ("Immortality (2008)") — claim 000259 has no page locator (demo showed "pp.32 · 376–377 · 380").
- **Forces copy** says "toward the 150" per the signed-off demo; Wallach's stated max is 200 (IMMORT-000260). Luneth aware.
- **Still to mine (deferred from Phase 2):** the Walford "great white sharks" quote (immortality.txt:1896–1899) is currently framing prose in `kd_orac_chain_intro`; capture as a search-only claim.

## 🔧 MECHANICS — load-bearing
- CSS is LINKED (no rebuild); JS/data need `node tools/build.mjs`. Creator's-Log embed inlines at BUILD → re-inline AFTER logging.
- **Derived-artifact flow:** generator (build_data/write_data via safe_write) → register in `eden/derived/MANIFEST.json` artifacts[] → `build_embeds.py` regenerates → `derived_artifacts_fresh` byte-gates. Deterministic (sorted keys, NO timestamp) so build_fn byte-compares. Hand-authored data files go in MANIFEST accounted[] (data_artifacts_accounted).
- Every write via `safe_write` (LF payloads; MANIFEST/view-copy/index are CRLF — use a Python driver that reads with universal newlines + re-emits via safe_write; multi-edit → count==1 asserts).
- `corpus_seal` is USER-ONLY (per-invocation approval).

## 🔴 STILL DEFERRED (carried)
- **Ask-Wallach ranking miss:** "highest antioxidant food" ranks the weight-loss WARNING above "Which foods have the highest ORAC score?" (`state/search.ts::scoreClaim`).
- **Products in search / product-ORAC:** only Beyond Tangy Tangerine states an ORAC score; deferred by Luneth until we fully understand ORAC.
- **8 related-pill slugs with no page** (digestion, epigenetics, margarine, ph, poultry, silicon, villi, wheat) — Explore-topic mining candidates.
- testosterone→strength (mining gap). design-system.css stale reduced-motion comment (needs a per-file seal green light).

## 🔴🔴 REVIEW PROCESS (every corpus/content touch): show each claim in EXACT final form (Q→short→[full if it adds]→quote), Luneth approves the CLAIM. `corpus_seal` USER-ONLY.
