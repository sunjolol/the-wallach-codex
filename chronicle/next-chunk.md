# Next chunk — ★ Search G-7 pipeline BUILT (enrichment→derived index · Calcium+Mercury live) · NEXT = author the next entity (Hydrogen), entity-by-entity

**★ CURRENT STATE (2026-07-09).** Phases A–F COMPLETE + SEALED. **knowledge_version 319 · 1246 claims · board 53/53 green.** Mining is **PAUSED** at Immortality element A-Z **Mn-Manganese** (~char 309953, 45/94 headers done Ag→Mg) — kept on the list. **The Search build (G-7) is ACTIVE and past its architecture milestone.**

## ★ Where we just landed — the REAL Search pipeline is built + 2 entities live (committed, board 53/53)
The signed-off Mercury thin-slice became the real, drift-proof architecture:
- **Field home = a hand-edited ENRICHMENT file** (Luneth's decision): `eden/corpus/search-enrichment.json` carries ONLY the authored fields (subject/also_about/facet/question/answer_short/topics) per claim id. Everything else the reader sees — answer (= claim_text minus the " In his words:" tail, byte-faithful), verbatim, page, tier1_link (from the claim's essentials/conditions/symptoms), composed cite — **DERIVES** from the sealed claim + books-meta.
- **Shipped index is GENERATED**: `eden/tools/search_index_derive.py` (build_index/write_index + shared validate()) joins enrichment + claims + registry + canon → `dashboard/assets/data/search/search-index.json` {books,entities,claims}. Registered in `eden/derived/MANIFEST.json` → `derived_artifacts_fresh` proves it can't drift. The 2 draft artifacts (mercury-slice.json + hand search-entities.json) are DELETED.
- **Entity registry** `eden/catalog/search-entities.json` (NOT sealed yet): non-canon entities carry display_name; canon entities use `canon_ref:true` → name/symbol pull from essentials-canon (no_hand_duplicated_canonical).
- **Gate** `search_index_wellformed` (facet∈taxonomy · subject/also_about resolve · authored fields present · answer+verbatim non-empty · TS==Python facet taxonomy) + negative test `tools/test_search_index_wellformed.py` (8/8, greens real / reds 7 poison classes).
- **2 entities authored + reviewed**: Mercury (13, re-homed byte-faithful) + **Calcium (8, newly authored to Mercury quality)**. `render_probe_search.js` = 27 checks, drives both.

## ★ Luneth's LOCKED format decisions (2026-07-09) — apply to EVERY future entity
1. **Field home = enrichment file** (not on-claim); **cadence = entity-by-entity, per-entity review** (STOP + show before scaling).
2. **Facet order: WARNINGS right after BASICS**, rendered in caution AMBER — a poison flags itself immediately (an essential simply has no warning section, stays calm).
3. **Drawer 700px** (NOT full-screen; ebook-comfortable reading) with **facet color-coding** (`--sr-facet-accent`: warning=amber, protocol=green, stance/big_question=orange, mechanism/physiology/sources=tech-blue). This is a RESTRAINED first enrichment pass — headroom to push further (per-claim accent borders, richer tag styling, facet icons) when Luneth wants.
4. `answer` stays **byte-faithful** to the sealed summary — KEEP the lead label (e.g. "Mercury — the basics.").

## ★ KEY DISCOVERY (do not forget)
The search corpus is **LARGER than the 186 search-only figure**: 6 of Mercury's 13 claims are **dual-home tier-1** (they map operational conditions AND are searchable). Enrichment covers ANY real claim — search-only OR dual-home tier-1. The tier-1 boundary runs the OTHER way (search-only must not leak INTO the operational tabs — `search_only_indices_excluded`, LIVE).

## NEXT (entity-by-entity, review each)
1. **Author the next entity** — **Hydrogen** suggested (6 claims, the other rich Immortality A-Z element: Cavendish, the Hindenburg, acid-base; carries its own dual-home `essentials:[hydrogen]`). Or a condition / big-question topic to test a different entity TYPE. Author → build → probe → **STOP for Luneth's review**.
2. **Continue authoring entities** into the enrichment file (the ~186 search-only + the dual-home tier-1 claims), reviewed in batches.
3. **When entities accumulate**: seal `eden/catalog/search-entities.json` + `eden/corpus/search-enrichment.json`; add sharding (blueprint §7) if the index grows large.
4. **THEN resume mining search-first** from Immortality Mn-Manganese, capturing the FULL taxonomy per `.claude/rules/search-corpus.md`; backfill La/Li/Lu/Mg.

## The doctrine (AUTHORITATIVE — read before search work)
- `.claude/rules/search-corpus.md` (operating spine) · `chronicle/search-build-blueprint.md` (build plan) · `chronicle/search-corpus-plan.md` (capture criteria).

## The paused mining roadmap (blueprint §7)
G-4 finish Immortality (resume A-Z at Mn-Manganese ~char 309953) · G-5 DDDL re-mine · G-6 the 3 new books · **G-7 = the Search build (ACTIVE)** · G-8 close-out + seal. Phases H (app completion) + I (design) after.

## Carried follow-ups (deferred; NOT blockers)
`search_density_report` + per-region question-inventory (Layer 2/3) · seal the 2 search source files once entities accumulate · index sharding at scale · lithium coverage target could derive (targets_derive, 38→39) · rare-earths/lets-play-doctor per-page accounting (G-8) · deep linguistic sweep + book purification (G-8, 2/6 pristine) · 3 parked claim notes · further Search visual enrichment (per-claim accents / tags / facet icons).
