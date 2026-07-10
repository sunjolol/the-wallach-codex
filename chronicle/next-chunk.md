# Next chunk — ★ Search G-7 bulk migration UNDERWAY · batches 1–3 DONE (12 element + 4 concept) · template stable

**★ CURRENT STATE (2026-07-10).** Phases A–F COMPLETE + SEALED. **knowledge_version 319 · 1246 sealed claims · board 53/53 green.** Search build (G-7) bulk migration is ACTIVE and grounded. Search SOURCE now = **105 enriched claims · 24 entities** (landing = 23 browse cards). Mining is PAUSED at Immortality element A-Z **Mn-Manganese** (~char 309953).

## ★ Where we are — 3 golden-quality batches landed + signed off
**Batch 1** (6 entities, 33 claims, commit 474bc7fd): Iron, Iodine, Germanium, Hydrogen, Potassium (canon) + Fluoride. Plus 3 template refinements (patterns 9–11 below).
**Batch 2** (6 entities, 15 claims, commit df43ea5d): Copper, Chromium, Gold, Aluminum, Gallium (canon) + Krypton. Pure data; emergent pill self-upgrade.
**Batch 3** (4 CONCEPT entities, 16 claims): Essential Nutrients, Vitamins, Amino Acids, Macronutrients. First concept-type bulk batch; the 4 cross-link EACH OTHER (Essential Nutrients→Vitamins+Amino Acids, Macronutrients→Amino Acids). Pure data.
**~16 entities migrated total** — near the end of the grounded "first few dozen"; can consider accelerating (still review in batches).

## ★ The golden template (LOCKED — apply to EVERY entity)
1. **Field home** = `eden/corpus/search-enrichment.json` (authored subject/also_about/facet/question/answer_short/topics [+ optional `see_also`]); everything DERIVES via `eden/tools/search_index_derive.py` → `search-index.json`. Registry = `eden/catalog/search-entities.json`.
2. **Canon/catalog display, no dup:** canon → `canon_ref:true` (name/symbol from essentials-canon); catalog conditions → `catalog_ref:true`; non-canon → `display_name` (+`symbol` for elements). **Convention: canon minerals/elements typed `nutrient`; non-canon elements `element`; framework/category pages typed `concept` (nodes icon, no symbol).**
3. **Per-type facet ORDER** (`FACET_ORDER_BY_TYPE`): conditions lead stance→mechanism→protocol→warning; else default.
4. **Per-type ICONS** + bespoke `ENTITY_ICON`; elements/minerals keep atomic symbol.
5. **`tier1_link` fires ONLY for non-search-only claims.**
6. **ONE pill rule** (`renderPill`): a slug pill is a clickable link iff `getEntity(slug)!==null`, else a plain chip; self-upgrades as entities are authored. Nav back-stack.
7. **BIOGRAPHY** facet label (generic).
8. `answer` stays **byte-faithful** to the sealed summary (keep the lead label).
9. **Glosses in Search answers**: shared `views/glossify.ts` glossifies `answer`+`verbatim`; `.gloss` CSS global; add plain-language terms to `dashboard/assets/data/glossary.json` (hand-authored, NO digits).
10. **Scroll-to-top on nav**: `search.ts paintBody` resets `.sr-body.scrollTop=0` every repaint.
11. **`see_also` in-text cross-reference** (gated): enrichment may carry `see_also: { phrase, target }`; view links the first occurrence of `phrase` to the `target` claim's card (same page) + flashes it. GATE: target = enriched claim of SAME subject; phrase occurs in the answer.

## ★ KEY REMINDERS
- **Search corpus is LARGER than 186 `search-only`** — dual-home tier-1 claims belong to entities too. Tier-1 boundary runs the other way (`search_only_indices_excluded`, LIVE).
- **Epigenetics DEFERRED** — charged homosexuality/intersex content needing Luneth's per-instance sign-off. Do NOT bulk silently.
- **answer_short: ASCII + ≤~160 chars** (soft; no gate). Authored fields ASCII for the safe_write pipeline; byte-faithful `answer`/`verbatim` keep real punctuation.
- **safe_write scripting:** editing ONE file multiple times → read once + apply all replaces in-memory + write once (deferred per-edit re-reads clobber — memory [[safe-write-crlf-flip]]).
- **Concept-grouping pattern (batch 3):** several thin primer claims can group into ONE rich `concept` entity (Macronutrients = carbs+fats+proteins). Prefer a rich concept page over many 1-claim entities.

## NEXT — CONTINUE BULK MIGRATION (grounded; can begin accelerating after Luneth's OK)
~**113 non-epigenetics search-only claims remain** unenriched. Remaining clusters:
1. **Remaining Immortality elements** (thin, 1–2 claims each): Cobalt (85/86, B12), Silver (31), Bromine (48), Cadmium (77), Cesium (95), Bismuth (46), Actinium (35), Helium (156/157), Hafnium (158), Holmium (172), Indium (185), Iridium (186), Lutetium (203), rare earths Dysprosium (112)/Erbium (113)/Europium (114), Gadolinium (137), Cerium (RARE-000112).
2. **Lets-Play-Doctor modality cluster (54 claims)** — hydrotherapy, homeopathy, Ayurveda, reflexology, chiropractic, aromatherapy, naturopathy, negative-ion, urine therapy, macrobiotics, megavitamin, Bach flower, cell salts, laying-on-of-hands, Christian Science, herbal, osteopathy, Rolfing — `topic` exemplars like Color Therapy; + Wallach self-reliance/philosophy claims (cystic fibrosis dual-home, infertility, birth defects 98% preventable, hospital dangers, lifespan 120-130, be-your-own-doctor).
3. Rare-earths book: tranquilizer/muscle-relaxant "unsuitable for elderly" lists (RARE 276/277/284) — a drug-safety-in-elderly `concept`/`topic`.
4. Watch for new entity slugs needing registry entries.
5. **When entities accumulate**: seal `search-entities.json` + `search-enrichment.json`; add index sharding (blueprint §7) if large.
6. **THEN resume mining search-first** from Immortality Mn-Manganese, full taxonomy per `.claude/rules/search-corpus.md`; backfill La/Li/Lu/Mg.

## The doctrine (AUTHORITATIVE — read before search work)
- `.claude/rules/search-corpus.md` (operating spine) · `chronicle/search-build-blueprint.md` (build plan) · `chronicle/search-corpus-plan.md` (capture criteria).

## Gates + tooling (all LIVE, board 53/53)
`derived_artifacts_fresh` (covers search-index.json) · `search_index_wellformed` (facet∈taxonomy · subject/also_about resolve · fields present · answer+verbatim non-empty · TS==Python taxonomy · canon_ref/catalog_ref rules · see_also same-subject + phrase-in-answer) + negative test `tools/test_search_index_wellformed.py` (13 cases) · `render_probe_search.js`.

## The paused mining roadmap (blueprint §7)
G-4 finish Immortality (resume A-Z at Mn-Manganese) · G-5 DDDL re-mine · G-6 the 3 new books · **G-7 = the Search build (ACTIVE — bulk migration underway, 16 entities done)** · G-8 close-out + seal. Phases H (app completion) + I (design) after.

## Carried follow-ups (deferred; NOT blockers)
Epigenetics concept (charged content, reviewed pass) · `search_density_report` + per-region question-inventory (Layer 2/3) · seal the 2 search source files once entities accumulate · index sharding at scale · lithium coverage target could derive · rare-earths/lets-play-doctor per-page accounting (G-8) · deep linguistic sweep + book purification (G-8, 2/6 pristine) · 3 parked claim notes · pre-existing eslint style debt in search.ts/schema.ts (not blocking).
