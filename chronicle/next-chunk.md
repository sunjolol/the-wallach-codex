# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-24 · ORAC knowledge tab COMPLETE, all 4 phases shipped · next = Luneth's pick)

# ★★★★★ The live ORAC knowledge tab (Knowledge drawer, right after Absorption) is DONE — built in phases from the signed-off design `temporary/orac-EDITED.html` (LOCAL ONLY, gitignored). Full plan + LOCKED decisions: memory `orac-live-view-build-plan`.

## ✅ ORAC TAB — COMPLETE (Phases 1–4)
- **Phase 1** (cb8bda74): editorial hero §01 + full-record claims index §09 (31 live cards).
- **§02 mining** (9adedbbd): the two mirror-test visuals sealed (IMMORT-000261/000262).
- **Phase 2 view** (31cfd969): §02/§03/§08 narrative, every number DERIVED via `orac_data_derive.py` → byte-gated `orac-data.json`.
- **§04–07 food MINING** (36a3024c): the last 39 per-serving rows sealed (IMMORT-000263/000264); full table = 54 per-serving + 10 per-100 g (HELLS-000014).
- **Phase 3b food-table VIEW** (1c3d9a09): §04 REACH · §05 SCALE · §06 TABLES (8 category + HK per-100 g, labelled) · §07 WINE — `orac_foods_derive.py` + numbers-free `orac-foods-curation.json` → byte-gated `orac-foods-data.json`; schema + `state/orac-foods.ts`; 12 `kd_orac_*` keys.
- **Phase 4 claim-card expand + sign-off tweaks** (b8eb40a2, 2026-07-24): the §09 cards are now native `<details>` disclosures — collapsed keep the ORAC look, expand to the fuller answer + glossified verbatim + full `composeCite`. Tweaks: hero heading 3rem→2.85rem; ORAC+Foods hero top padding 30→16px; `.kd-orac-tables` bottom margin -2rem→-3rem; chevron 0.85→1.2rem; §08 payoff copy "diseases you'd otherwise be buying"→"diseases that can otherwise occur". `render_probe_orac.js` +5 checks. Board 77/77. Luneth signed off. No seal needed (pure view/CSS/copy).

## ▶ NEXT — Luneth's pick (ORAC live-view is done; these are the open candidates)
Genesis should offer these; Luneth chooses. Ordered by apparent priority:
1. **Ask-Wallach enrichment** (the elevated ★★★ priority — memory `mining-serves-ask-wallach`): mine/enrich the biggest, most-searched entities so any plausible question returns a real Wallach answer (rich lay synonyms + question-inventory coverage). The primary ongoing mission.
2. **ORAC deferred polish** (small, ORAC-adjacent):
   - The **Ask-Wallach ranking miss**: "highest antioxidant food" ranks the weight-loss WARNING above "Which foods have the highest ORAC score?" (`state/search.ts::scoreClaim`).
   - Mine the **Walford "great white sharks"** quote (immortality.txt:1896–1899), currently framing prose in `kd_orac_chain_intro` — capture as a search-only claim.
   - **Products in search / product-ORAC** (only Beyond Tangy Tangerine states an ORAC score; deferred until ORAC fully understood).
3. **8 related-pill slugs with no page** (digestion, epigenetics, margarine, ph, poultry, silicon, villi, wheat) — Explore-topic mining candidates.

## 🔎 FYI (carried — ORAC cite fallbacks)
- Reach caption + payoff cite render book-level "Immortality (2008)" (those claims locate by screenshot / have no page locator). Luneth aware/accepted.
- Forces copy says "toward the 150" per the demo; Wallach's stated max is 200 (IMMORT-000260). Luneth aware.

## 🔧 MECHANICS — load-bearing
- CSS is LINKED (no rebuild); JS/data need `node tools/build.mjs`. Creator's-Log embed inlines at BUILD → re-inline AFTER logging.
- **Derived-artifact flow:** generator (build_data/write_data via safe_write) → register in `eden/derived/MANIFEST.json` artifacts[] → `build_embeds.py` regenerates → `derived_artifacts_fresh` byte-gates. Deterministic (sorted keys, NO timestamp). Hand-authored data files → MANIFEST accounted[] (data_artifacts_accounted).
- Every write via `safe_write` (LF payloads; MANIFEST/view-copy/index/CSS are CRLF — use a Python driver that reads with universal newlines + re-emits via safe_write; multi-edit → count==1 asserts).
- View expand pattern: native `<details>`/`<summary>` (no JS). Chromium's CLOSED `<details>` keeps a child's offsetHeight non-zero (content-visibility) — prove an expand reveal by the CARD's height growth, not a child's offsetHeight (Phase-4 probe lesson).
- `corpus_seal` is USER-ONLY (per-invocation approval).

## 🔴 STILL DEFERRED (carried)
- testosterone→strength (mining gap). design-system.css stale reduced-motion comment (needs a per-file seal green light).

## 🔴🔴 REVIEW PROCESS (every corpus/content touch): show each claim in EXACT final form (Q→short→[full if it adds]→quote), Luneth approves the CLAIM. `corpus_seal` USER-ONLY. Visual/UX work ENDS at a STOP for Luneth's sign-off.
