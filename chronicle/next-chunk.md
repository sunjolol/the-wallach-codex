# Next chunk — FULL OVERHAUL. Active plan = `chronicle/OVERHAUL-BLUEPRINT.md` (locked 2026-07-05, 8 sections, AUTHORITATIVE). Board 40/40 green; all work committed + pushed through the Knowledge>Doctrine chunk (2026-07-06 — run `genesis` for exact HEAD). Phases A–D COMPLETE; **Phase E UNDERWAY** — surface #1 (Knowledge>Doctrine) landed.

## The overhaul in one paragraph
The project pivoted from whack-a-mole bug-fixing to a full structural overhaul after Luneth caught book citations hand-typed ~200× (drifting from the sealed registry — a cite said 1999 while the registry said 2011). We designed the whole system on paper first (the blueprint), THEN built it. **Model:** TWO hand-edited sealed sources — the Wallach Corpus (`eden/corpus/`, live) + the Youngevity Product DB (`eden/products/`, Phase F) — plus the shared Catalog (`eden/catalog/`: conditions + symptoms; the 90/91 essentials live in `eden/corpus/essentials-canon.json`). **Everything else is GENERATED from the pillars + freshness-gated**, so drift can't ship. Read the blueprint for the Charter (R1–R9), data model, pipeline, enforcement table, per-surface plans, and the 9-phase migration.

## DONE — Phases A–D (the cleanup + gating half). Full per-chunk detail is in the Creator's Log + git; this is the compact map.
- **A — governance reset:** legacy dashboard fully severed; CLAUDE.md + the 12 `.claude/rules/` rewritten to the pillar model + Charter (permanent home `.claude/rules/charter.md`); `no_operating_doc_contradiction` gate; noise purge.
- **B — Catalog pillar built + SEALED** (`dcee79c` · `c22b527` · B3): `conditions.json` (512) + `symptoms.json` (164) + the `references_resolve` gate (a claim slug must be catalogued — closes the phantom-slug hole).
- **C — Derivation pipeline + THE POISON PURGE** (`811b418` · `d87b1d6` · `9b09aa1` · `d8d7e51`): `eden/derived/MANIFEST.json` + `build_embeds.py` + `derived_artifacts_fresh`; Coverage targets now derive from Wallach BOOK dose claims (Youngevity amounts gone) + `amounts_wallach_only` gate; all embeds → esbuild import (D1); the "WALLACH SAYS" stance layer DROPPED as poison (re-authored post-mining; styling kept — memory wallach-says-boxes-dropped-readd-post-mining).
- **D — Collapsed the rotten `knowledge/` layer + landed the R3/R4 gates** (`020fa46` · `d0b4656` · `638e8bb` · `e4cf937` · `0b9cfac`): re-homed `coverage_kind` onto the sealed canon + deleted the poison `essentials-targets.json` (D-b); deleted the too-basic `catalog/nutrients.json` (pure duplication → Phase-F rebuild) + added the 3 Charter gates `citations_reference_registry` / `prose_contained` / `no_hand_duplicated_canonical` LIVE-with-teeth on the clean surface at **Option-1 altitude** — legacy embeds + views left as labeled WISH (D-c); stripped the dead creators-log subsystem so dashboard.html is a TRUE pure shell (1.72 MB → 6 KB, D-review). `knowledge/` is gone except `products-db.json` (Phase F).

## ★ Phase E — per-surface finalize (blueprint §5). The VISUAL/UX half. UNDERWAY.
Rebuild the legacy surfaces onto the clean pipeline + EXTEND the gates to them. Discipline (non-negotiable): ONE surface to 100% before the next (memory gold-standard-page-workflow); functional gates (build · invariants · the per-surface render probe) THEN **STOP for Luneth's visual sign-off** before logging (memory visual-verification; no-ceremony-pragmatism — do the mechanical steps, keep the substantive gates). Build priority (blueprint §5): Coverage · Knowledge · Regimen · Scanner → Search → Journey (last).

### DONE this session — Knowledge > Doctrine tab (2026-07-06)
The Doctrine tab's 7 hand-typed cards (inline in `views/knowledge.ts` — R3/R4 poison: a retired "lecture corpus" cite, 2 cites to DELETED invariants, DOCT·01's body carrying the retired YGY-can-set-an-amount poison) → cleaned per **Option B**: the 4 app-guarantee cards moved to a NEW gated prose store `dashboard/assets/data/doctrine-data.json` (blueprint §2.4 prose home #4) + `core/schemas/doctrine.ts` Zod boundary; cites now COMPOSED from real gate/hook names (`doctrineCite()`). The 3 Wallach HEALTH cards (PDM / BTT / trace-mineral) **DROPPED** pending Phase-G mining (need real corpus claim IDs; same pattern as the WALLACH SAYS box). Gates extended: `citations_reference_registry` + `prose_contained` + `no_hand_duplicated_canonical` now cover the store (`_CLEAN_SURFACE_STORES` + `body` ∈ `_PROSE_HOME_KEYS` in `tools/invariants.py`); `render_probe_knowledge.js` +5 Doctrine assertions. Board 40/40, probe PASS, Luneth signed off.

### ★ CORRECTED PREMISE (the Phase-D-close handoff was WRONG here — do not chase it)
The 5 "WISH embeds" this handoff previously called live surfaces to re-derive — `essentials-benefits-data`, `essentials-best-supplements`, `goal-recommendations-data`, `ingredients-embed`, `ingredients-quickref-data` — are **ORPHANED DEAD files**: imported by NO source, absent from the shipped bundle, stranded when Phase A severed legacy dashboard.html/legacy-dashboard.js. Re-deriving them is **blocked**, not a quick clean: the corpus has ZERO benefit/function/role claims (benefits can't derive yet → Phase G); best-supplements + ingredients need the Phase-F Product DB. They are NOT the Phase-E "clean now" work.

### What actually remains in Phase E (pick next with Luneth — his visual call)
- **`views/regimen.ts` placeholders** — the other live view scaffold with hand-typed cites / inline prose. Phase-F/G-independent → natural next surface.
- **Coverage (⌘1)** — targets already clean/generated; the deep-dive's benefits/best-supplements richness is Phase-F/G-gated. A visual/UX pass on what it shows with currently-available clean data is doable now (flagship).
- **Dead-embed triage** — DECIDE keep-for-Phase-F/G-rebuild vs delete-now (git preserves) for the 5 orphaned embeds, so the tree carries no dead poison. Luneth deferred this when picking Knowledge-first; revisit.
- **Scanner wall** — add `scanner_user_items_marked` (blueprint §5.4).

## Then F → G → H → I
- **F — Youngevity Product DB** (Luneth hand-mines `eden/products/`): + `products_verify` + `products_derive`; the nutrient/ingredient registry rebuilds RICHER here (the deleted `catalog/nutrients.json` returns, product-shaped) → `references_resolve`'s substance half RE-LIGHTS; retire the vestigial `eden_build.py` / `tools/build_regimen_label_lookup.py` / `knowledge/products-db.json` / `eden/eden-catalog.json` (the old D3 reconcile, folded here).
- **G — resume book mining** into the clean gated pipeline — but ONLY AFTER the two owed items below.
- **H — Search** (retrieval-first, offline helper). **I — Journey** (last) + the portable offline browser.

## ★ OWED BEFORE PHASE G (do-NOT-forget, both Luneth-flagged)
1. **The FULL corpus audit** — spot-checks found mis-labels + off-source cites + a flawed daily-amount rule; audit ALL claims (every kind) before any new mining (memory full-corpus-audit-before-phase-g).
2. **Consolidate the mining-mechanics memory cluster** (reading-and-correcting-scanned-pdfs, editing-sealed-corpus-claims, batch-mining-workflow, cross-book-uniform-correction, quote-sync-mechanism, …) — they redundantly repeat the seal-order trap; merge preserving every recovery recipe (memory consolidate-mining-mechanics-before-phase-g).

## Backlog + left-noted (not lost)
- **OLD BACKLOG:** menaquinone→phylloquinone book correction + the K1/K2 alert-box → Phase E/G; Immortality + DDDL re-mine (both under-mined) → Phase G.
- **LEFT-noted cosmetics (no gate impact):** dashboard.html's header references a non-existent `dashboard/ARCHITECTURE.md` + carries stale "Round 2-5" mount-slot comments (fix in Phase E as the shell's surfaces finalize); the SEALED `design-system.css` header still references `knowledge/design-wisdom` (fix at the next design-system re-seal / project end).

## SET UP FOR NEXT SESSION
Start fresh → run `genesis` (expect board 40/40, HEAD `0b9cfac`, Phases A–D done). Begin **Phase E**: ask Luneth which surface first, then one-surface-to-100% with a STOP-for-visual-sign-off gate. The blueprint is authoritative for the how.
