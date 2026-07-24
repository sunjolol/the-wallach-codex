# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-24 · ORAC Phase 1 + §02-mining SHIPPED · next = Phase 2 VIEW BUILD)

# ★★★★★ The live ORAC knowledge tab is UNDER CONSTRUCTION — built in phases from the signed-off design `temporary/orac-EDITED.html` (LOCAL ONLY, gitignored — the only copy of the design; read it first). Full plan + LOCKED decisions live in memory `orac-live-view-build-plan`.

## ✅ Phase 1 SHIPPED (commit cb8bda74)
The ORAC tab is live in the Knowledge drawer, after Absorption: the editorial hero (§01) + the full-record claims index (§09) — **31 claims** live from the search index (`state/search.ts::oracClaims()`), facet-grouped (canonical `facetLabel()`), short-cited ("Hell's Kitchen (2015)" via `composeShortCite()`). NEW: `views/knowledge-orac.ts`, `oracClaims()`+`composeShortCite()`, `dashboard/assets/styles/drawer-orac.css` (ALL ~130 `.kd-orac-*` rules already ported + scoped — **Phase 2/3 section styles already exist**), `render_probe_orac.js`. Menu fits at 6 tabs (headOverflow=0). The 150 anchor (`WAL-CLM-IMMORT-000260`) already renders (it's one of the 31, a big_question). Board 77/77.

## ✅ §02 mining SHIPPED (commit 9adedbbd) — the two mirror-test visuals are now sealed claims
`WAL-CLM-IMMORT-000261` (mechanism, p.29) = the Adelman decade table (35/41/55/78 % by band); `WAL-CLM-IMMORT-000262` (prevalence, p.9) = the world-ranking decline (17th→24th→46th→48th). Verified against the page image, 3 OCR errors purified (Chunk H), corpus v387/1379. Enriched (searchable) but NOT orac-tagged → oracClaims() stays 31. So EVERY §02/§03/§08 number now traces to a sealed claim.

## ▶ NEXT — Phase 2 VIEW BUILD: the §02/§03/§08 sections, spliced BETWEEN the hero and the claims record
Sections + their sources: **02** mirror-test (decade bars ← 000261) + stolen-years (20–25 yrs; ranks ← 000254 + 000262) + damage-chain (5 lay prose steps); **03** daily-target (20–25k ← 000238; 100,000+ ← EPIGEN-000148/154); **08** four-pieces (← 000250) / forces / payoff (+25–50 yrs ← 000259; calories ← 000255; minerals ← 000256). [**04** reach · **05** scale · **06** tables · **07** wine = FOOD sections → Phase-3 mining first.]
- **LOCKED data rule:** every number traces to a sealed claim → **NONE hand-typed, NONE in view-copy** (`copy.ts` forbids Wallach numbers). Build a **DERIVED `orac-data.json`** (generator reads the source claims by id → typed numbers; MANIFEST `artifacts`; byte-gated). Framing PROSE → view-copy `kd_orac_*`. The number→claim map is DONE (claim ids above).
- Wire **"Explore the Absorption facts →"** = `data-kd-tab="foods"`.

## ▶ THEN — Phase 3 (food tables, has a MINING dependency) · Phase 4 (interactions)
- **Phase 3:** MINE the ~39 unmined Immortality pp.378–381 per-serving rows (pecan 17,940, blueberry juice 9,019 …) into the corpus — small batches, Luneth reviews EACH (never-guess). 15 rows already mined (`IMMORT-000240/241`, `HELLS-000014`). Then derive the league tables + reach/scale/wine computed bars. **DON'T hand-type the values** (the mineral-tiers poison; R1/R3).
- **Phase 4:** claim cards open their entity/verbatim (currently static, by design).

## ✅ WHAT LANDED THIS SESSION (5 commits)
1. `64083732` — shell fixes: COVERAGE nameplate → Unbounded 0.85rem; rail drawer buttons stop staying highlighted after internal close (new `drawer:toggled` event + `render_probe_rail_sync.js` with negative control).
2. `f1e60981` — ORAC becomes a first-class topic: 20 claims, 3 entities (orac/antioxidants/free_radicals), purification chunks (Immortality pp.378–381 de-interleave + HK p.253 table).
3. `716c289b` — the four longevity pieces: 9 claims answering "what raises the ceiling" (antioxidants/calorie-restriction/minerals/land-mines); chunk E+F purification.
4. `f076b9e2` — the "150, 175 or 200" ceiling anchor: chunk G de-interleave (Screenshot 160) + 1 claim; applied Luneth's DevTools demo fixes + 3 bolds.
5. (local, gitignored) — restored 4 CSSOM-dropped `var()`-shorthands in orac-EDITED.html so the saved demo matches his live session.
- **Corpus: knowledge_version=386, 1377 claims, 7 books, board 77/77.** ORAC page = **32 claims across 12 facets**.

## 🔴 KNOWN, carried forward
- **Ask-Wallach ranking miss:** "highest antioxidant food" ranks the weight-loss WARNING above "Which foods have the highest ORAC score?" — a real scoring miss in `state/search.ts::scoreClaim`, flagged not patched. Good tuning task.
- **Products in search / product-ORAC:** only Beyond Tangy Tangerine states an ORAC score (2 products, values 5,745 / 8,000 / 160,000 — the last is per-container vs per-serving ambiguity). Deferred by Luneth until we fully understand ORAC; may change how product scores are computed. The "top-10 products by ORAC" section is NOT buildable from the pillars today.
- **DevTools extraction pitfall (new memory):** Chrome CSSOM `cssText` drops `var()`-containing SHORTHANDS to empty longhands on serialization. If Luneth inspect-edits again, the snapshot script silently loses every var-shorthand — grep the extracted file for `: ;` (empty decls) and restore from the source. See memory `devtools-cssom-var-shorthand-drop`.

## 🔴 STILL DEFERRED (unchanged)
- testosterone → strength (mining gap; intent system ready).
- The 8 related-pill slugs with no page (digestion, epigenetics, margarine, ph, poultry, silicon, villi, wheat) — good Explore-topic mining candidates.
- design-system.css stale reduced-motion comment (7→6 offenders) — needs a per-file seal green light.

## 🔧 MECHANICS — load-bearing
- CSS is LINKED (no rebuild); JS/data need `node tools/build.mjs`. Creator's-Log embed inlines at BUILD → re-inline AFTER logging.
- Corpus change flow: purify `.txt` (record in `eden/tools/purity-specs/<book>.json`) → `corpus_resnap --write` → sync draft offsets → **`corpus_seal` (USER-ONLY)** → `build_embeds` → `build.mjs`. ORDER TRAP: resnap must run AFTER the LAST `.txt` edit, or seal refuses with "references unknown/unhashed book" (hit this session).
- `corpus_extract finalize`: `kind` ∈ the 14 claim kinds (NOT the 13 search facets — 'stance' is a facet, not a kind); verbatim 60–1200 chars snapped to book bytes.
- Every write via `safe_write` (LF payloads; multi-edit → Python driver with `count==1` asserts).
- Two-column OCR de-interleave method (chunks B–G): read BOTH columns of the page image separately at 2.5–3x, reconstruct in reading order, guard with a token-preservation assert. Book PRINT spellings preserved (Florescein, principals, Cabernet Suavignon).

## 🔴🔴 REVIEW PROCESS (every corpus/content touch): show each claim in EXACT final form (Q→short→[full if it adds]→quote), Luneth approves the CLAIM. `corpus_seal` USER-ONLY.
