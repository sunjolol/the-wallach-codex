# Next chunk — ★ Search G-7 bulk migration UNDERWAY · batches 1–2 DONE (12 element entities) · template stable

**★ CURRENT STATE (2026-07-10).** Phases A–F COMPLETE + SEALED. **knowledge_version 319 · 1246 sealed claims · board 53/53 green.** Search build (G-7) bulk migration is ACTIVE and grounded. Search SOURCE now = **89 enriched claims · 20 entities**. Mining is PAUSED at Immortality element A-Z **Mn-Manganese** (~char 309953).

## ★ Where we are — 2 golden-quality batches landed + signed off
**Batch 1** (6 entities, 33 claims, commit 474bc7fd): Iron, Iodine, Germanium, Hydrogen, Potassium (canon) + Fluoride (non-canon). Plus 3 template refinements (see below).
**Batch 2** (6 entities, 15 claims): Copper, Chromium, Gold, Aluminum, Gallium (canon) + Krypton (non-canon noble gas). Pure data migration — the template held, no code changes. Emergent self-upgrade: Gallium→Aluminum, Krypton→Fluoride, Diabetes→Chromium pills went from grey chips to clickable links automatically.
Landing now = **19 browse cards** (+ the 7 G-7 originals: Mercury, Calcium, Cholesterol, Diabetes, Colloidal Minerals, Color Therapy, Dr. Wallach).

## ★ The golden template (LOCKED — apply to EVERY entity)
1. **Field home** = `eden/corpus/search-enrichment.json` (authored subject/also_about/facet/question/answer_short/topics [+ optional `see_also`]); everything DERIVES via `eden/tools/search_index_derive.py` → `dashboard/assets/data/search/search-index.json`. Registry = `eden/catalog/search-entities.json`.
2. **Canon/catalog display, no dup:** canon essentials → `canon_ref:true` (name/symbol from essentials-canon); catalog conditions → `catalog_ref:true`; non-canon → `display_name` (+`symbol` for elements). **Convention: canon minerals/elements typed `nutrient`; non-canon elements typed `element` (both still show the atomic symbol).**
3. **Per-type facet ORDER** (`FACET_ORDER_BY_TYPE`): conditions lead stance→mechanism→protocol→warning; else default order.
4. **Per-type ICONS** + bespoke `ENTITY_ICON` (color_therapy wheel); elements/minerals keep their atomic symbol.
5. **`tier1_link` fires ONLY for non-search-only claims.**
6. **ONE pill rule** (`renderPill`): a slug pill is a clickable link iff `getEntity(slug)!==null`, else a plain chip; self-upgrades as entities are authored. Nav back-stack.
7. **BIOGRAPHY** facet label (generic).
8. `answer` stays **byte-faithful** to the sealed summary (keep the lead label).
9. **Glosses in Search answers** (batch 1): shared `views/glossify.ts` glossifies `answer`+`verbatim`; `.gloss` CSS is global; add plain-language terms to `dashboard/assets/data/glossary.json` (hand-authored, NO digits per `glossary_wellformed`).
10. **Scroll-to-top on nav** (batch 1): `search.ts paintBody` resets `.sr-body.scrollTop=0` every repaint.
11. **`see_also` in-text cross-reference** (batch 1, gated): enrichment may carry `see_also: { phrase, target }`; the view links the first occurrence of `phrase` in the answer to the `target` claim's card (same page) + flashes it. GATE `search_index_wellformed`: target must be an enriched claim of the SAME subject; phrase must occur in the answer.

## ★ KEY REMINDERS
- **The search corpus is LARGER than 186 `search-only`** — dual-home tier-1 claims belong to search entities too. Tier-1 boundary runs the other way (`search_only_indices_excluded`, LIVE).
- **Epigenetics is DEFERRED** — its usable claims are charged homosexuality/intersex content needing Luneth's per-instance sign-off. Do NOT bulk silently.
- **answer_short: keep ASCII + ≤~160 chars** (soft; no gate). Authored fields ASCII to keep the safe_write pipeline clean; the byte-faithful `answer`/`verbatim` keep their real punctuation.
- **safe_write scripting:** when a script edits ONE file multiple times, read once + apply all replaces in-memory + write once (deferred per-edit re-reads clobber — see memory [[safe-write-crlf-flip]]).

## NEXT — CONTINUE BULK MIGRATION (grounded, review in batches)
~**129 non-epigenetics search-only claims remain** unenriched. Suggested next clusters:
1. **Remaining Immortality element A-Z**: Cobalt (85/86, B12 tie-in), Silver (31), Bromine (48), Cadmium (77), Cesium (95), Bismuth (46), Actinium (35), Helium (156/157), Hafnium (158), Holmium (172), Indium (185), Iridium (186), Lutetium (203), rare earths Dysprosium (112)/Erbium (113)/Europium (114), Gadolinium (137). Cerium (RARE-000112). Plus the general-nutrition "primer" claims (003/004/007/009/013/014/017/018/019/051/052/055/056/057/059/060 — carbs/fats/proteins/vitamins/amino-acids/mineral-count/deficiency-stages → likely `concept` entities like "Essential Nutrients", "Vitamins", "Amino Acids", "Trace Minerals").
2. **Lets-Play-Doctor modality cluster (54 claims)**: hydrotherapy, homeopathy, Ayurveda, reflexology, chiropractic, aromatherapy, naturopathy, etc. — great `topic` exemplars like Color Therapy; + Wallach self-reliance/philosophy claims (cystic fibrosis dual-home, infertility, birth defects, hospital dangers, lifespan 120-130).
3. Rare-earths book: tranquilizer/muscle-relaxant "unsuitable for elderly" lists (RARE 276/277/284) — likely a `concept`/`topic` on drug safety in the elderly.
4. Watch for new entity slugs needing registry entries; canon → canon_ref, catalog conditions → catalog_ref, else authored.
5. **When entities accumulate**: seal `search-entities.json` + `search-enrichment.json`; add index sharding (blueprint §7) if large.
6. **THEN resume mining search-first** from Immortality Mn-Manganese, full taxonomy per `.claude/rules/search-corpus.md`; backfill La/Li/Lu/Mg.

## The doctrine (AUTHORITATIVE — read before search work)
- `.claude/rules/search-corpus.md` (operating spine) · `chronicle/search-build-blueprint.md` (build plan) · `chronicle/search-corpus-plan.md` (capture criteria).

## Gates + tooling (all LIVE, board 53/53)
`derived_artifacts_fresh` (covers search-index.json) · `search_index_wellformed` (facet∈taxonomy · subject/also_about resolve · fields present · answer+verbatim non-empty · TS==Python taxonomy · canon_ref/catalog_ref rules · see_also same-subject + phrase-in-answer) + negative test `tools/test_search_index_wellformed.py` (13 cases) · `render_probe_search.js`.

## The paused mining roadmap (blueprint §7)
G-4 finish Immortality (resume A-Z at Mn-Manganese) · G-5 DDDL re-mine · G-6 the 3 new books · **G-7 = the Search build (ACTIVE — bulk migration underway, 12 element entities done)** · G-8 close-out + seal. Phases H (app completion) + I (design) after.

## Carried follow-ups (deferred; NOT blockers)
Epigenetics concept (charged content, reviewed pass) · `search_density_report` + per-region question-inventory (Layer 2/3) · seal the 2 search source files once entities accumulate · index sharding at scale · lithium coverage target could derive · rare-earths/lets-play-doctor per-page accounting (G-8) · deep linguistic sweep + book purification (G-8, 2/6 pristine) · 3 parked claim notes · pre-existing eslint style debt in search.ts/schema.ts (not blocking; gate is invariants+probes).
