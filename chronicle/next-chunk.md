# Next chunk — ★ PIVOT 2026-07-09 · mining PAUSED, building SEARCH · NEXT = the Mercury thin-slice (visual reference)

**★ CURRENT STATE (2026-07-09).** Phases A–F COMPLETE + SEALED. **knowledge_version 319 · 1246 claims · board 52/52 green.** Mining is **PAUSED** at Immortality element A-Z **Mn-Manganese** (45/94 headers done, Ag→Mg) — kept on the list. We PULLED **Search (blueprint G-7 / §5.5) FORWARD** because we can't keep mining into a format Luneth can't see + steer.

## Why the pivot (Luneth, 2026-07-09)
Search is the corpus's **LARGER consumer by design** — the near-complete Wallach knowledge base powering plain-language "Ask-Wallach" Q&A; the wow-factor. Tier-1 (Conditions/Essentials/Coverage) is the small operational slice carved out of it. Today the ratio is inverted (186 search / 1060 operational); it must flip. I was **regressing** — a fully-mined element is 9–13 claims (mercury=13, hydrogen=9: basics/discovery/uses/mechanism/sources/stances/big-questions + tier-1); my La/Li/Lu/Mg captured only the tier-1 half. Fix the FORMAT first, then resume mining search-first.

## The doctrine (AUTHORITATIVE — read before search work)
- **`.claude/rules/search-corpus.md`** — the operating spine (inclusion test · facet taxonomy · structured template · tier-1 boundary · completeness layers). **SUPERSEDES** the old "search is tier-2/secondary" + "capture case-by-case / present candidates for yes/no" framings (reconciled to zero across rules+memory 2026-07-09; historical logs untouched by design).
- **`chronicle/search-build-blueprint.md`** — the full build plan (data model · entity registry · display · retrieval · sharding · migration · gates · sequence).
- **`chronicle/search-corpus-plan.md`** — the capture criteria + the density/question-inventory/harness completeness layers.

## Luneth's LOCKED decisions (2026-07-09)
1. Search lives in **BOTH** a top **search bar** AND a **"SEARCH" tab placed above "KNOWLEDGE"**, visible from every page.
2. The **entity page** (product-detail-style, categorized by facet) is the primary "wow" view; the demo-style **Ask** answer is the quick path.
3. First visual reference = the **Mercury** thin-slice (richest, 13 claims).
4. **Entity registry** = a new curated `eden/catalog/search-entities.json` (display/type/synonyms/related), reusing canon/catalog slugs (no duplication). Keep prose CONTAINED + single-source.
5. Facet list approved; stay grounded — **never invent/hallucinate** to chase the wow-factor.

## NEXT = the Mercury thin-slice (the visual reference — STOP for sign-off)
1. Restructure Immortality's **13 mercury claims** into the new template (subject · facet · question · answer_short · answer · verbatim · cite · topics) — split the blob (`claim_text` currently jams summary + verbatim).
2. Seed the mercury entry in `search-entities.json`.
3. Build a **minimal Search surface** (the SEARCH tab + top search bar) rendering just Mercury: the entity page (facet sections) + one Ask answer.
4. **STOP → Luneth visual sign-off** on the info format. Iterate on this slice until right.

## THEN (after the format is validated)
Mass-migrate the 186 → new template (script + review) · seed the full entity registry · add `assets/data/search/` folder sharding (lazy-load) · retrieval index (retrieval-first, offline) · NEW gates (`search_claim_wellformed`, `facet_in_taxonomy`, `search_entity_resolves`, `search_index_fresh`, `render_probe_search`) · **then RESUME mining search-first** — backfill La/Li/Lu/Mg to standard + Immortality from Mn-Manganese onward.

## The paused mining roadmap (still on the list — blueprint §7)
G-4 finish **Immortality** (resume element A-Z at **Mn-Manganese ~char 309953**, then Ch11-12 anti-aging protocols = 0 claims / unmined + Ch4/6-10) · G-5 DDDL re-mine · G-6 the 3 new books · G-7 = the Search build (now active, pulled forward) · G-8 close-out + seal. Phases H (app completion) + I (design) after.

## Mining loop (when resumed — READ `.claude/rules/mining-veins.md` + `search-corpus.md`)
Luneth pastes a section → diff vs sealed `.txt` → correct `.txt` (safe_write → `corpus_resnap --write` [+`--fix`]) → **capture search-first** (every search-worthy statement, structured) + tier-1 promotion where it maps → auto-seal per vein (Luneth-authorized) → build → invariants → build-log → Creator's Log → re-inline → commit → SHOW Luneth. Vein-map: `eden/tools/mining-coverage.json`. Faithful paraphrase synonyms may be added during mining (shown for veto); front-facing labels stay display_name.

## Carried follow-ups (deferred; NOT blockers)
`search_density_report` + per-region question-inventory (Layer 2/3) · lithium coverage target could derive (targets_derive, 38→39) · rare-earths/lets-play-doctor per-page accounting (G-8) · deep linguistic sweep + book purification (G-8) · 3 parked claim notes.
