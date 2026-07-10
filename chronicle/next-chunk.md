# Next chunk — ★ Search G-7 bulk migration UNDERWAY · batch 1 DONE (6 element entities) · template refined

**★ CURRENT STATE (2026-07-09).** Phases A–F COMPLETE + SEALED. **knowledge_version 319 · 1246 sealed claims · board 53/53 green.** The Search build (G-7) bulk migration is ACTIVE and grounded. Search SOURCE now = **74 enriched claims · 14 entities**. Mining is PAUSED at Immortality element A-Z **Mn-Manganese** (~char 309953, kept on the list).

## ★ Where we just landed — BULK MIGRATION BATCH 1, signed off by Luneth
Migrated 33 sealed `search-only` claims into **6 finished element/mineral entities** (all Immortality A-Z veins):
| entity | reg kind | note |
|---|---|---|
| Iron (Fe) | canon_ref | basics · CO-mechanism · body-content · deficiency · absorption |
| Iodine (I) | canon_ref | 6 facets incl. discovery-in-kelp · thyroid mechanism · safety margin |
| Germanium (Ge) | canon_ref | the "delight" — Ge-132 supplement + **Lourdes holy waters** (history) |
| Hydrogen (H) | canon_ref | Cavendish (discovery) · **Hindenburg** (history) · pH mechanism |
| Potassium (K) | canon_ref | **etymology** (potash) · saltpeter · "you're slightly radioactive" |
| Fluoride (F) | display_name (non-canon element) | two-sided showcase: stance + **big_question** "Is fluoridated water safe?" |

## ★ THREE new golden-template elements added this batch (from Luneth's review — apply to ALL future entities)
1. **Glosses in Search answers.** `glossify()` now lives in shared `views/glossify.ts` (one source for Knowledge + Search); `search.ts` glossifies `answer`+`verbatim`; `.gloss` dotted-underline CSS is now GLOBAL (un-scoped from `#drawer-knowledge-mount`). Add plain-language terms to `dashboard/assets/data/glossary.json` (hand-authored, no digits per `glossary_wellformed`). Added "fluorine" (element vs fluoride).
2. **Scroll-to-top on nav.** `search.ts` `paintBody` resets `.sr-body.scrollTop=0` on every repaint — every entity/landing opens at the top.
3. **`see_also` in-text cross-reference (NEW, gated).** Enrichment may carry `see_also: { phrase, target }`; the view wraps the first occurrence of `phrase` in the answer as a solid-underline `.sr-xref` link that **jumps to the `target` claim's card on the same page + flashes it** (sealed answer stays byte-faithful — the view only decorates). GATE `search_index_wellformed`: `target` must be an enriched claim of the **same subject**; `phrase` must occur in the answer. First use: fluoride 118 → 124.

## ★ The LOCKED golden-standard patterns (unchanged from G-7, still authoritative)
1. **Field home** = `eden/corpus/search-enrichment.json` (authored subject/also_about/facet/question/answer_short/topics [+ optional see_also]); everything else DERIVES via `eden/tools/search_index_derive.py` → `dashboard/assets/data/search/search-index.json`. Registry = `eden/catalog/search-entities.json`.
2. **Canon/catalog display, no dup:** canon essentials use `canon_ref:true` (name/symbol from essentials-canon); catalog conditions use `catalog_ref:true`; non-canon entities carry `display_name` (+`symbol` for elements).
3. **Per-type facet ORDER** (`FACET_ORDER_BY_TYPE`, core/schemas/search.ts): conditions lead stance→mechanism→protocol→warning; everything else uses the default order.
4. **Per-type ICONS** + bespoke `ENTITY_ICON` overrides; elements/minerals keep their atomic symbol.
5. **`tier1_link` fires ONLY for non-search-only claims.**
6. **ONE pill rule** (`renderPill`): a slug pill is a clickable accent link iff `getEntity(slug)!==null`, else a plain chip; self-upgrades as entities are authored. Nav back-stack: gotoEntity pushes, "‹ BACK" pops.
7. **BIOGRAPHY** facet label (generic, works for any person).
8. `answer` stays **byte-faithful** to the sealed summary (keep the lead label).

## ★ KEY REMINDERS (do not forget)
- **The search corpus is LARGER than 186 `search-only`** — dual-home tier-1 claims belong to search entities too. Enrichment covers ANY real claim; the tier-1 boundary runs the other way (`search_only_indices_excluded`, LIVE).
- **Epigenetics is DEFERRED** — its usable claims are the charged homosexuality/intersex content that needs Luneth's per-instance sign-off (editorial-fringe / spiritual-vs-mystical). Do NOT bulk it silently.

## NEXT — CONTINUE BULK MIGRATION (grounded)
1. **Next element cluster at golden quality**: Copper (97/106/111), Chromium (91/92/93), then the rare-earth / trace minerals + remaining Immortality element A-Z search-only claims. Still "keep the first few dozen at golden quality before accelerating" — review in batches. ~144 non-epigenetics search-only claims remain unenriched (Immortality ~78 left, lets-play-doctor 54 modalities/philosophy, rare-earths 4, iaiyh 2).
2. After the elements, the **lets-play-doctor modality cluster** (hydrotherapy, homeopathy, Ayurveda, reflexology, etc. — great `topic` exemplars, like Color Therapy) + Wallach philosophy/self-reliance claims.
3. Watch for new entity slugs needing registry entries; canon → canon_ref, catalog conditions → catalog_ref, else authored display_name.
4. **When entities accumulate**: seal `eden/catalog/search-entities.json` + `eden/corpus/search-enrichment.json`; add index sharding (blueprint §7) if it grows large.
5. **THEN resume mining search-first** from Immortality Mn-Manganese, full taxonomy per `.claude/rules/search-corpus.md`; backfill La/Li/Lu/Mg.

## The doctrine (AUTHORITATIVE — read before search work)
- `.claude/rules/search-corpus.md` (operating spine) · `chronicle/search-build-blueprint.md` (build plan) · `chronicle/search-corpus-plan.md` (capture criteria).

## Gates + tooling (all LIVE, board 53/53)
`derived_artifacts_fresh` (covers search-index.json) · `search_index_wellformed` (facet∈taxonomy · subject/also_about resolve · fields present · answer+verbatim non-empty · TS==Python taxonomy · canon_ref/catalog_ref rules · **see_also target-same-subject + phrase-in-answer**) + negative test `tools/test_search_index_wellformed.py` (**13 cases**) · `render_probe_search.js`.

## The paused mining roadmap (blueprint §7)
G-4 finish Immortality (resume A-Z at Mn-Manganese) · G-5 DDDL re-mine · G-6 the 3 new books · **G-7 = the Search build (ACTIVE — bulk migration underway)** · G-8 close-out + seal. Phases H (app completion) + I (design) after.

## Carried follow-ups (deferred; NOT blockers)
Epigenetics concept (charged content, reviewed pass) · `search_density_report` + per-region question-inventory (Layer 2/3) · seal the 2 search source files once entities accumulate · index sharding at scale · lithium coverage target could derive · rare-earths/lets-play-doctor per-page accounting (G-8) · deep linguistic sweep + book purification (G-8, 2/6 pristine) · 3 parked claim notes · pre-existing eslint style debt in search.ts/schema.ts (import-sort, enum newline, house jsdoc) — not blocking, gate is invariants+probes.
