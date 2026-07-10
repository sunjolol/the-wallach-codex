# Next chunk — ★ Search G-7 bulk migration UNDERWAY · batches 1–7 DONE (52 entities · 181 claims) · non-charged backlog NEARLY CLEAR

**★ CURRENT STATE (2026-07-10).** Phases A–F COMPLETE + SEALED. **knowledge_version 320 · 1246 sealed claims · board 53/53 green.** Search build (G-7) bulk migration is ACTIVE. Search SOURCE now = **181 enriched claims · 52 entities** (landing = 52 browse cards). Mining is PAUSED at Immortality element A-Z **Mn-Manganese**.

## ★ Where we are — 7 batches landed + signed off
**B1** (6, 33 claims, 474bc7fd) minerals + Fluoride + 3 template refinements (patterns 9–11).
**B2** (6, 15, df43ea5d) Copper/Chromium/Gold/Aluminum/Gallium/Krypton.
**B3** (4 CONCEPT, 16, bedf1edc) Essential Nutrients, Vitamins, Amino Acids, Macronutrients.
**B4** (10 TOPIC, 24, 7807196e) modality "delight" cluster (Light Therapy … Herbal Medicine).
**B5** (7, 21) self-reliance/philosophy: Be Your Own Doctor, Hospital Dangers, Pregnancy & Birth, Longevity, **Cystic Fibrosis (condition, catalog_ref, stance-first)**, Sexual Health, Home Remedies. Includes the 4 charged/editorial claims Luneth reviewed + said include-all (vaccine-mandate politics, contraception verbatim, premature ejaculation, mosquito B1). **Related-enrichment pass:** the "max 3 related" was NOT a cap (renderRelated shows all; CSS wraps) — I'd just authored ~3. Now enriched with REAL links (canon nutrient→essential_nutrients, minerals→colloidal_minerals, modalities→be_your_own_doctor, air-treatment→negative_ion_therapy, + EXTRA map); distribution 4+ on 20 entities (max 6), thin left thin.
**B6** (9 claims, 3 new topics) Somatic Therapies (osteopathy/reflexology/Rolfing), Faith & Energy Healing (faith healing/Christian Science), Naturopathy; + fold-ins cell-salts/Bach -> Homeopathy, megavitamin/orthomolecular -> Vitamins. FIRST batch to EDIT+RESEAL the corpus (kv 320): Luneth's faith-healing mystical-clause trim (WAL-CLM-LETS-000102) + Bodywork->Somatic Therapies rename.
**B7** (22 claims, 8 entities) cleared the Immortality thin-element backlog: GROUPED concepts Rare Earth Elements (Dy/Er/Eu/Gd/Ho/Lu + Cerium, multi-book) + Obscure Elements (actinium/bromine/cesium/hafnium/indium/iridium); STANDALONE Cobalt/Helium/Silver/Cadmium/Bismuth/Carbon (canon ones = canon_ref); hydrogen fold. Carbon = his climate STANCE (Luneth per-instance OK); Carbon.related emptied (no nutrition padding). Grouping approach was Luneth's up-front call (sets precedent for thin trace minerals). Pure data, no reseal.
**52 entities across 7 batches**, all types. Template proven; Luneth OK'd accelerating.

## ★ The golden template (LOCKED — apply to EVERY entity)
1. **Field home** = `eden/corpus/search-enrichment.json` (authored subject/also_about/facet/question/answer_short/topics [+ optional `see_also`]); everything DERIVES via `eden/tools/search_index_derive.py` → `search-index.json`. Registry = `eden/catalog/search-entities.json`.
2. **Canon/catalog display, no dup:** canon → `canon_ref:true` (name/symbol from essentials-canon); catalog conditions → `catalog_ref:true` (name from conditions.json); non-canon → `display_name` (+`symbol` for elements). **Type convention: canon minerals/elements → `nutrient`; non-canon elements → `element`; framework/category → `concept`; modalities/practices/subjects → `topic`; a disease page from tier-1/dual-home claims → `condition` (catalog_ref, facet order leads with STANCE).**
3. **Per-type facet ORDER** (`FACET_ORDER_BY_TYPE`): conditions lead stance→mechanism→protocol→warning; else default.
4. **Per-type ICONS** + bespoke `ENTITY_ICON`; elements/minerals keep atomic symbol.
5. **`tier1_link` fires ONLY for non-search-only claims.**
6. **ONE pill rule** (`renderPill`): a slug pill is a clickable link iff `getEntity(slug)!==null`, else a plain chip; self-upgrades as entities are authored. Nav back-stack.
7. **BIOGRAPHY** facet label (generic).
8. `answer` byte-faithful to the sealed summary (keep the lead label).
9. **Glosses in Search answers**: shared `views/glossify.ts` glossifies `answer`+`verbatim`; `.gloss` CSS global; add plain-language terms to `dashboard/assets/data/glossary.json` (hand-authored, NO digits).
10. **Scroll-to-top on nav**: `search.ts paintBody` resets `.sr-body.scrollTop=0` every repaint.
11. **`see_also` in-text cross-reference** (gated): `see_also: { phrase, target }`; view links first occurrence of `phrase` to `target`'s card (same page) + flashes. GATE: target = enriched claim of SAME subject; phrase occurs in answer.
- **`related` is UNCAPPED** — author it generously with REAL connections (5–7 where they exist; hub links like essential_nutrients/colloidal_minerals/be_your_own_doctor). Don't pad thin entities.
- **Concept/topic grouping:** group thin claims into one rich concept/topic; keep genuinely-distinct subjects separate.
- **Charged/editorial/intimate content:** ask Luneth per-instance (he decides include/exclude); when included, keep his words verbatim.

## ★ KEY REMINDERS
- Search corpus LARGER than 186 `search-only`; boundary runs the other way (`search_only_indices_excluded`).
- **Epigenetics DEFERRED** (charged content, per-instance sign-off).
- answer_short: ASCII, ≤~160 soft (dense ones ran ~180-220; fine).
- **Round-close gotchas** ([[creators-log-append-gotchas]]): Creator's Log `--summary` HARD-capped 280; pass args via `"$(cat file)"` WITHOUT escaping inner quotes; a botched append can land an empty ledger entry — remove the uncommitted tail before commit.
- safe_write scripting: edit ONE file multiple times → read once + apply all + write once ([[safe-write-crlf-flip]]).

## NEXT — CONTINUE BULK MIGRATION (accelerating; review in batches)
**Only 18 search-only claims remain, and just 3 are NON-deferred.** Clusters:
1. ~~Thin modality singles~~ ✓ DONE (batch 6) → Somatic Therapies + Faith & Energy Healing + Naturopathy; cell-salts/Bach folded into Homeopathy, megavitamin/orthomolecular into Vitamins.
2. ~~Remaining Immortality elements~~ ✓ DONE (batch 7) → grouped Rare Earth Elements + Obscure Elements concepts + standalone Cobalt/Helium/Silver/Cadmium/Bismuth/Carbon + hydrogen fold. Only the deferred homosexuality claim (IMMORT-000020) remains search-only there.
3. **← NEXT (the last non-charged cluster):** Rare-earths book tranquilizer/muscle-relaxant "unsuitable for elderly" lists (RARE 276/277/284) → a drug-safety-in-elderly concept.
   **DEFERRED charged cluster (15 claims, needs a dedicated per-instance review with Luneth):** 14 Epigenetics (homosexuality/intersex/teratology/quackbusters/longevity-cooking) + 1 Immortality homosexuality (IMMORT-000020).
4. **When entities accumulate**: seal `search-entities.json` + `search-enrichment.json`; add index sharding (blueprint §7) if large.
5. **THEN resume mining search-first** from Immortality Mn-Manganese, full taxonomy per `.claude/rules/search-corpus.md`.

## The doctrine (AUTHORITATIVE — read before search work)
- `.claude/rules/search-corpus.md` (operating spine) · `chronicle/search-build-blueprint.md` (build plan) · `chronicle/search-corpus-plan.md` (capture criteria).

## Gates + tooling (all LIVE, board 53/53)
`derived_artifacts_fresh` (covers search-index.json) · `search_index_wellformed` (facet∈taxonomy · subject/also_about resolve · fields present · answer+verbatim non-empty · TS==Python taxonomy · canon_ref/catalog_ref · see_also same-subject + phrase-in-answer) + negative test `tools/test_search_index_wellformed.py` (13 cases) · `render_probe_search.js`.

## The paused mining roadmap (blueprint §7)
G-4 finish Immortality (resume A-Z at Mn-Manganese) · G-5 DDDL re-mine · G-6 the 3 new books · **G-7 = the Search build (ACTIVE — bulk migration underway, 52 entities done; non-charged backlog nearly clear)** · G-8 close-out + seal. Phases H (app completion) + I (design) after.

## Carried follow-ups (deferred; NOT blockers)
Epigenetics concept (charged) · `search_density_report` + per-region question-inventory (Layer 2/3) · seal the 2 search source files once entities accumulate · index sharding at scale · lithium coverage target could derive · rare-earths/lets-play-doctor per-page accounting (G-8) · deep linguistic sweep + book purification (G-8, 2/6 pristine) · 3 parked claim notes · pre-existing eslint style debt in search.ts/schema.ts (not blocking).
