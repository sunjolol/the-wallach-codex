# Next chunk — ★ Search G-7 golden standard LOCKED (7 types) · NEXT = BULK MIGRATION (grounded)

**★ CURRENT STATE (2026-07-09).** Phases A–F COMPLETE + SEALED. **knowledge_version 319 · 1246 sealed claims · board 53/53 green.** The Search build (G-7) is ACTIVE; its **golden standard is locked** — one reference entity for every type. Mining is PAUSED at Immortality element A-Z **Mn-Manganese** (~char 309953, kept on the list).

## ★ Where we just landed — one golden-standard entity per TYPE, signed off (commit pending in this session's last commit)
The Search index now has a validated reference for all **7 active entity types** (41 enriched claims, 8 registry entities):
| type | exemplar | note |
|---|---|---|
| element | Mercury (13) | basics → warnings → lore |
| nutrient | Calcium (8) | physiology → mechanism → stance |
| substance | Cholesterol (2) | deliberately thin |
| condition | Diabetes (6) | from **tier-1** claims; leads with STANCE |
| concept | Colloidal Minerals (5) | basics → mechanism → stance |
| topic | Color Therapy (3) | the "delight" content; **color-wheel icon** |
| person | Dr. Joel Wallach (4) | stance → history → biography |

**`event` was DROPPED as a standalone type** — events (Minamata, Iraq) live as `history` facets inside other entities.

## ★ The LOCKED golden-standard patterns — apply to EVERY entity in bulk migration
1. **Field home** = `eden/corpus/search-enrichment.json` (authored subject/also_about/facet/question/answer_short/topics); everything else DERIVES via `eden/tools/search_index_derive.py` → `dashboard/assets/data/search/search-index.json`. Registry = `eden/catalog/search-entities.json`.
2. **Canon/catalog display, no dup:** canon essentials use `canon_ref:true` (name/symbol from essentials-canon); catalog **conditions use `catalog_ref:true`** (name from conditions.json); non-canon entities carry `display_name`.
3. **Per-type facet ORDER** (`FACET_ORDER_BY_TYPE`, core/schemas/search.ts): conditions lead stance → mechanism → protocol → warning; everything else uses the default order (basics → warning → …).
4. **Per-type ICONS** (`TYPE_ICON`) + bespoke `ENTITY_ICON` overrides (color_therapy = a color wheel). Elements/minerals keep their atomic symbol.
5. **`tier1_link` fires ONLY for non-search-only claims** (a search-only modality claim may carry a conditions array for search matching, but shows no operational cross-links).
6. **ONE pill rule** (`renderPill`, views/search.ts): a slug pill is a clickable accent link iff `getEntity(slug)!==null`, else a plain chip — used everywhere; pills self-upgrade as entities are authored. Nav back-stack: gotoEntity pushes, "‹ BACK" pops.
7. **BIOGRAPHY** facet label (generic, works for any person).
8. `answer` stays **byte-faithful** to the sealed summary (keep the lead label).

## ★ KEY REMINDERS (do not forget)
- **The search corpus is LARGER than 186 `search-only`** — dual-home tier-1 claims (e.g. all 6 diabetes claims, 6 of mercury's 13) belong to search entities too. Enrichment covers ANY real claim; the tier-1 boundary runs the other way (`search_only_indices_excluded`, LIVE).
- **Epigenetics is DEFERRED** — its usable claims are the charged homosexuality/intersex content that needs Luneth's per-instance sign-off (editorial-fringe / spiritual-vs-mystical policies). Do NOT bulk it silently.

## NEXT — BULK MIGRATION (Luneth 2026-07-09: start bulking, but STAY GROUNDED)
1. **Migrate the remaining ~180 search-only + dual-home claims into entities**, following the 8 golden patterns above. **Keep the FIRST FEW DOZEN at golden-standard quality before accelerating** — don't get ahead / don't bulk too soon. Each entity: author enrichment → add registry entry → derive → build → probe. Review in batches.
2. Watch for new entity slugs that need registry entries; canon essentials → canon_ref, catalog conditions → catalog_ref, else authored.
3. **When entities accumulate**: seal `eden/catalog/search-entities.json` + `eden/corpus/search-enrichment.json`; add index sharding (blueprint §7) if it grows large.
4. **THEN resume mining search-first** from Immortality Mn-Manganese, full taxonomy per `.claude/rules/search-corpus.md`; backfill La/Li/Lu/Mg.

## The doctrine (AUTHORITATIVE — read before search work)
- `.claude/rules/search-corpus.md` (operating spine) · `chronicle/search-build-blueprint.md` (build plan) · `chronicle/search-corpus-plan.md` (capture criteria).

## Gates + tooling (all LIVE, board 53/53)
`derived_artifacts_fresh` (covers search-index.json) · `search_index_wellformed` (facet∈taxonomy · subject/also_about resolve · fields present · answer+verbatim non-empty · TS==Python taxonomy · canon_ref/catalog_ref rules) + negative test `tools/test_search_index_wellformed.py` (10 cases) · `render_probe_search.js` (35 checks).

## The paused mining roadmap (blueprint §7)
G-4 finish Immortality (resume A-Z at Mn-Manganese) · G-5 DDDL re-mine · G-6 the 3 new books · **G-7 = the Search build (ACTIVE)** · G-8 close-out + seal. Phases H (app completion) + I (design) after.

## Carried follow-ups (deferred; NOT blockers)
Epigenetics concept (charged content, reviewed pass) · `search_density_report` + per-region question-inventory (Layer 2/3) · seal the 2 search source files once entities accumulate · index sharding at scale · lithium coverage target could derive · rare-earths/lets-play-doctor per-page accounting (G-8) · deep linguistic sweep + book purification (G-8, 2/6 pristine) · 3 parked claim notes · further Search visual polish.
