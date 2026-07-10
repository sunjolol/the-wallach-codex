# Next chunk — ★ Search G-7 bulk migration UNDERWAY · batches 1–4 DONE (26 entities: 12 element + 4 concept + 10 topic) · accelerating

**★ CURRENT STATE (2026-07-10).** Phases A–F COMPLETE + SEALED. **knowledge_version 319 · 1246 sealed claims · board 53/53 green.** Search build (G-7) bulk migration is ACTIVE. Search SOURCE now = **129 enriched claims · 34 entities** (landing = 33 browse cards). Mining is PAUSED at Immortality element A-Z **Mn-Manganese**.

## ★ Where we are — 4 golden-quality batches landed + signed off
**B1** (6, 33 claims, 474bc7fd): Iron, Iodine, Germanium, Hydrogen, Potassium, Fluoride + 3 template refinements (patterns 9–11).
**B2** (6, 15, df43ea5d): Copper, Chromium, Gold, Aluminum, Gallium, Krypton.
**B3** (4 CONCEPT, 16, bedf1edc): Essential Nutrients, Vitamins, Amino Acids, Macronutrients (interlinked).
**B4** (10 TOPIC, 24): Light Therapy, Chiropractic, Aromatherapy, Ayurveda, Homeopathy, Hydrotherapy, Negative Ion Therapy, Urine Therapy, Macrobiotics, Herbal Medicine — the modality "delight" cluster; cross-links weave (Herbal↔Aromatherapy/Ayurveda/Homeopathy, Color↔Light reconnected).
**26 entities across 4 batches** — template proven for ALL types (mineral, element, concept, topic). Luneth OK'd accelerating (batch 4 was 10). **★ VALIDATION:** Luneth learned of Negative Ion Therapy from the live app + bought a generator — "the app is working" (memory [[search-delight-validated]]). Keep investing in breadth/off-path delight.

## ★ The golden template (LOCKED — apply to EVERY entity)
1. **Field home** = `eden/corpus/search-enrichment.json` (authored subject/also_about/facet/question/answer_short/topics [+ optional `see_also`]); everything DERIVES via `eden/tools/search_index_derive.py` → `search-index.json`. Registry = `eden/catalog/search-entities.json`.
2. **Canon/catalog display, no dup:** canon → `canon_ref:true` (name/symbol from essentials-canon); catalog conditions → `catalog_ref:true`; non-canon → `display_name` (+`symbol` for elements). **Type convention: canon minerals/elements → `nutrient`; non-canon elements → `element`; framework/category pages → `concept`; healing modalities/practices/subjects → `topic`.**
3. **Per-type facet ORDER** (`FACET_ORDER_BY_TYPE`): conditions lead stance→mechanism→protocol→warning; else default.
4. **Per-type ICONS** + bespoke `ENTITY_ICON`; elements/minerals keep atomic symbol.
5. **`tier1_link` fires ONLY for non-search-only claims.**
6. **ONE pill rule** (`renderPill`): a slug pill is a clickable link iff `getEntity(slug)!==null`, else a plain chip; self-upgrades as entities are authored (this is how cross-links light up). Nav back-stack.
7. **BIOGRAPHY** facet label (generic).
8. `answer` byte-faithful to the sealed summary (keep the lead label).
9. **Glosses in Search answers**: shared `views/glossify.ts` glossifies `answer`+`verbatim`; `.gloss` CSS global; add plain-language terms to `dashboard/assets/data/glossary.json` (hand-authored, NO digits).
10. **Scroll-to-top on nav**: `search.ts paintBody` resets `.sr-body.scrollTop=0` every repaint.
11. **`see_also` in-text cross-reference** (gated): enrichment may carry `see_also: { phrase, target }`; view links the first occurrence of `phrase` to the `target` claim's card (same page) + flashes it. GATE: target = enriched claim of SAME subject; phrase occurs in the answer.
- **Concept/topic grouping:** several thin claims can group into ONE rich concept/topic entity (Macronutrients = carbs+fats+proteins; Light Therapy = UV+infrared). Prefer a rich page over many 1-claim entities — BUT keep genuinely-distinct subjects separate.
- **Cross-linking is the wander-through-it feel:** author `also_about` + registry `related` to weave entities together; they self-upgrade to links as targets are authored.

## ★ KEY REMINDERS
- **Search corpus LARGER than 186 `search-only`** — dual-home tier-1 claims belong to entities too. Boundary runs the other way (`search_only_indices_excluded`, LIVE).
- **Epigenetics DEFERRED** — charged content needing Luneth's per-instance sign-off. Do NOT bulk silently.
- **answer_short: ASCII + ≤~160 chars** (soft, no gate; dense modality lines ran ~180). Authored fields ASCII for the safe_write pipeline.
- **Creator's Log summary HARD-CAPPED at 280 chars** (the append REJECTS over — batch 4 hit it twice; keep the headline tight).
- **safe_write scripting:** editing ONE file multiple times → read once + apply all replaces in-memory + write once ([[safe-write-crlf-flip]]).

## NEXT — CONTINUE BULK MIGRATION (accelerating; still review in batches)
~**89 non-epigenetics search-only claims remain**. Clusters:
1. **Remaining Lets-Play-Doctor modalities + Wallach philosophy** — thin modality singles (osteopathy, reflexology, Rolfing, naturopathy, megavitamin therapy, cell salts/Biochemics, Bach flower remedies, laying-on-of-hands/faith healing, Christian Science) — group where sensible (e.g. a "Bodywork" or "Energy Healing" topic) OR thin standalone. PLUS Wallach self-reliance/philosophy claims (be-your-own-doctor, hospital dangers, lifespan 120-130, birth defects 98% preventable, infertility, cystic fibrosis dual-home, premature ejaculation, contraception history, immunization stance, metabolic therapy) — likely a "Self-Reliance / Be Your Own Doctor" topic + condition dual-homes.
2. **Remaining Immortality elements** (thin 1–2 claims): Cobalt (85/86), Silver (31), Bromine (48), Cadmium (77), Cesium (95), Bismuth (46), Actinium (35), Helium (156/157), Hafnium (158), Holmium (172), Indium (185), Iridium (186), Lutetium (203), rare earths Dysprosium/Erbium/Europium (112/113/114), Gadolinium (137), Cerium (RARE-000112).
3. Rare-earths book: tranquilizer/muscle-relaxant "unsuitable for elderly" lists (RARE 276/277/284).
4. **When entities accumulate**: seal `search-entities.json` + `search-enrichment.json`; add index sharding (blueprint §7) if large.
5. **THEN resume mining search-first** from Immortality Mn-Manganese, full taxonomy per `.claude/rules/search-corpus.md`.

## The doctrine (AUTHORITATIVE — read before search work)
- `.claude/rules/search-corpus.md` (operating spine) · `chronicle/search-build-blueprint.md` (build plan) · `chronicle/search-corpus-plan.md` (capture criteria).

## Gates + tooling (all LIVE, board 53/53)
`derived_artifacts_fresh` (covers search-index.json) · `search_index_wellformed` (facet∈taxonomy · subject/also_about resolve · fields present · answer+verbatim non-empty · TS==Python taxonomy · canon_ref/catalog_ref · see_also same-subject + phrase-in-answer) + negative test `tools/test_search_index_wellformed.py` (13 cases) · `render_probe_search.js`.

## The paused mining roadmap (blueprint §7)
G-4 finish Immortality (resume A-Z at Mn-Manganese) · G-5 DDDL re-mine · G-6 the 3 new books · **G-7 = the Search build (ACTIVE — bulk migration underway, 26 entities done)** · G-8 close-out + seal. Phases H (app completion) + I (design) after.

## Carried follow-ups (deferred; NOT blockers)
Epigenetics concept (charged content) · `search_density_report` + per-region question-inventory (Layer 2/3) · seal the 2 search source files once entities accumulate · index sharding at scale · lithium coverage target could derive · rare-earths/lets-play-doctor per-page accounting (G-8) · deep linguistic sweep + book purification (G-8, 2/6 pristine) · 3 parked claim notes · pre-existing eslint style debt in search.ts/schema.ts (not blocking).
