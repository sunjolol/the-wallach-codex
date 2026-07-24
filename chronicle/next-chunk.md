# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-24, ORAC corpus DONE · next = BUILD THE LIVE ORAC VIEW)

# ★★★★★ The ORAC topic is fully mined + sealed and its design is signed off. NEXT SESSION = **build the live ORAC knowledge tab** as a real wired view, from the signed-off design reference. The design + all the claims exist; this is a code build, not a design or mining task.

## ▶ NEXT — build the live ORAC view
**The signed-off design reference is LOCAL ONLY: `temporary/orac-EDITED.html`** (temporary/ is gitignored — memory `clean-root-temp-labeling`). It is Luneth's frozen inspect-edited snapshot (~50 of his DevTools fixes + 3 bold edits + 4 restored CSS drops), visually confirmed by him. **Do not lose it** — until the live view is committed, this file is the only copy of the design. Read it first.

**What to build:** a real `views/knowledge-*.ts` surface (like `knowledge-foods.ts` = the Absorption tab) that:
1. Reads the **32 ORAC-page claims** live from the search index (`subject in {orac, antioxidants, free_radicals, longevity} AND (subject==orac OR 'orac' in also_about)`), NOT hardcoded — the demo's `CLAIMS`/`TABLES`/etc. arrays were transcribed demo data; the live view pulls from `state/`.
2. Reproduces the demo's LAYOUT + CSS (the `.kd-orac-*` styles in orac-EDITED.html are proper, but were authored in a demo `<style>` — port them into a real stylesheet; the design-system tokens are already used throughout).
3. Wires the **"Explore the Absorption facts →"** button to open the Absorption (foods) tab.
4. Makes the **claim cards** open their entity/verbatim (the demo cards are static).
5. Adds **"ORAC"** as a menu tab in the knowledge drawer, **after "ABSORPTION"** (Luneth's placement). Confirm the menu still fits at 0.7rem before wiring (it was tight — memory on the menu centering).
6. The Coverage-layout + food tables use per-serving ORAC values transcribed from the sealed corpus tables (Immortality pp.378–381, Hell's Kitchen p.253). Decide their home: a hand-authored `assets/data` artifact (MANIFEST-registered) is the honest place, since these are corpus TABLE values not yet a derived artifact.

**The 150 anchor claim (WAL-CLM-IMMORT-000260)** is in the corpus + searchable but NOT on the frozen demo page — fold it into the live view's claim list when built.

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
