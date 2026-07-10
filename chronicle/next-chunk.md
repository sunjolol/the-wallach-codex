# Next chunk — ★ Search thin-slice BUILT + SIGNED OFF · NEXT = mass-migrate the 186 → template + derived index

**★ CURRENT STATE (2026-07-09).** Phases A–F COMPLETE + SEALED. **knowledge_version 319 · 1246 claims · board 52/52 green.** Mining is **PAUSED** at Immortality element A-Z **Mn-Manganese** (~char 309953, 45/94 headers done Ag→Mg) — kept on the list. **The Search build (G-7) is ACTIVE.**

## ★ Where we just landed — the Mercury thin-slice is SIGNED OFF
The offline "Ask-Wallach" Search surface has a first real, validated slice. Luneth signed off on the **info format** ("THIS is the vision — makes reading Wallach enjoyable instead of a boring wall of text"). What exists now:
- A **Search drawer** (rail item ABOVE Knowledge · bare-`S` · the topbar **"Ask Wallach"** button) rendering **just Mercury**: a product-detail-style **entity page** = a faceted FAQ (BASICS · HOW IT WORKS · SOURCES & EXPOSURE · WHAT TO DO · WARNINGS · HISTORY & LORE · BIG QUESTIONS), each row a bold quick-answer header → full modern-voice answer + italic Wallach **verbatim** + composed **cite**; plus a demo-style **Ask** answer card + "more on {subject}".
- **Draft artifacts (NOT sealed):** `dashboard/assets/data/search/{mercury-slice.json (13 claims), search-entities.json (mercury registry)}` — verbatim+answer byte-faithful from the sealed corpus; faceting/question/answer_short authored. Registered in `eden/derived/MANIFEST.json` accounted (hand_authored, TO BE REPLACED by the derived index).
- **Code:** `core/schemas/search.ts` (SEARCH_FACETS taxonomy + FACET_LABEL, in core/) · `state/search.ts` (offline retrieval + `window.wallachSearch`) · `views/search.ts` (sr-* drawer) · `assets/styles/drawer-search.css`. **Wired** via dashboard.html/main.ts/events.ts/schemas index. `dashboard.css` `.topbar__ask` = green-by-default (design-system `--ds-status-ok`), **one-class pivot to a plain orange matching button** (delete `topbar__ask--green`). `tools/render_probe_search.js` (21 checks, PASS).

## Open format questions Luneth may still steer (not blockers)
1. ~~Strip the answer's topic-lead label~~ — **RESOLVED (Luneth 2026-07-09): KEEP as-is** (reads fine; only shows on an expanded row). The migration must keep each `answer` **byte-faithful** to the sealed summary — do NOT strip the lead.
2. **Facet label wording + order** (friendly "HOW IT WORKS" vs raw "MECHANISM"; should WARNINGS sit higher for a poison?) — still open, not yet raised.
3. **Drawer vs. full workspace** for Search (currently a left drawer with EXPAND) — still open.
4. The **Ask Wallach button**: green shipped by default; one-class pivot to plain orange (delete `topbar__ask--green`). Luneth OK to keep green for now.

## NEXT (the real build — after any format tweaks land)
1. **Mass-migrate the 186 existing `search-only` claims** → the faceted template (script + review; split `claim_text` → answer, drop the "In his words:" tail, keep verbatim byte-faithful, assign subject/facet/question/answer_short — human-confirmed on ambiguous). Emit a draft for review, never silent.
2. **Seed the full entity registry** → promote to the **sealed `eden/catalog/search-entities.json`** (reuse canon/catalog slugs; no duplication).
3. **Derived, sharded index** in `assets/data/search/` (entities bucketed + ask-index) — lazy-load; join `eden/derived/MANIFEST.json` + a `search_index_fresh` gate. Retire the two hand-authored draft artifacts.
4. **Real gates** (build with the surface): `search_claim_wellformed` · `facet_in_taxonomy` · `search_entity_resolves` · `search_index_fresh` (+ the LIVE `search_only_indices_excluded` / `corpus_runtime_purity`). Negative-test each.
5. **THEN resume mining search-first** — backfill La/Li/Lu/Mg to the element standard + Immortality from Mn-Manganese onward, capturing the FULL taxonomy per `.claude/rules/search-corpus.md`.

## The doctrine (AUTHORITATIVE — read before search work)
- **`.claude/rules/search-corpus.md`** — operating spine (inclusion test · facet taxonomy · structured template · tier-1 boundary · completeness layers). SUPERSEDES the old "search is tier-2/secondary" + "capture case-by-case" framings.
- **`chronicle/search-build-blueprint.md`** — full build plan (data model · entity registry · display · retrieval · sharding · migration · gates · sequence).
- **`chronicle/search-corpus-plan.md`** — capture criteria + density/question-inventory/harness completeness layers.

## Luneth's LOCKED decisions (2026-07-09)
1. Search in **BOTH** a top entry (now the **"Ask Wallach"** button) AND a **SEARCH tab above KNOWLEDGE**, visible from every page. ✓ built.
2. The **entity page** (product-detail-style, faceted) is the primary "wow" view; the demo **Ask** answer is the quick path. ✓ built.
3. First visual reference = **Mercury** (13 claims). ✓ done + signed off.
4. **Entity registry** = curated `eden/catalog/search-entities.json` (sealed, post-signoff), reusing canon/catalog slugs. (Draft under assets/data/search/ for now.)
5. Facet list approved; **stay grounded — never invent/hallucinate** to chase the wow-factor.

## The paused mining roadmap (still on the list — blueprint §7)
G-4 finish **Immortality** (resume element A-Z at **Mn-Manganese ~char 309953**, then Ch11-12 anti-aging protocols + Ch4/6-10) · G-5 DDDL re-mine · G-6 the 3 new books · **G-7 = the Search build (ACTIVE)** · G-8 close-out + seal. Phases H (app completion) + I (design) after.

## Carried follow-ups (deferred; NOT blockers)
`search_density_report` + per-region question-inventory (Layer 2/3) · lithium coverage target could derive (targets_derive, 38→39) · rare-earths/lets-play-doctor per-page accounting (G-8) · deep linguistic sweep + book purification (G-8) · 3 parked claim notes.
