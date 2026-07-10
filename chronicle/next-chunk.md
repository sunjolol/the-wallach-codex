# Next chunk — ★ Search G-7 migration COMPLETE (batches 1–9, 56 entities · 198 claims) · SEAL the 2 search source files, then resume mining

**★ CURRENT STATE (2026-07-10).** Phases A–F COMPLETE + SEALED. **knowledge_version 320 · 1246 sealed claims · board 53/53 green.** Search build (G-7) migration is **COMPLETE** — non-charged (batches 1–8) + the deferred CHARGED cluster (batch 9). Search SOURCE now = **198 enriched claims · 56 entities** (landing = 56 browse cards). Mining is PAUSED at Immortality element A-Z **Mn-Manganese**.

## ★ Batch 9 — the deferred CHARGED cluster (DONE + signed off 2026-07-10)
14 of the 15 most-sensitive search claims authored into browsable pages after a per-instance review with Luneth (fringe/editorial rules). All faithful + neutral + search-only.
- **Homosexuality** (topic, 6 claims) — congenital/preventable reframe, brain anatomy (Simon LeVay + preoptic hypothalamus), twins/no-gay-gene (Dean Hamer), prevalence↔soil-minerals, prevention. Luneth: "the opposite of offensive... freeing... not their fault, misunderstood, preventable." He loved the scientific + misconception-dismantling approach.
- **Intersex** (topic, 4) — definition/98-types, cause+prevention (John Money 4%), animal/freemartin evidence, Greek history (Plato / Hermes+Aphrodite / Christine Jorgenson / Olympic sex-testing).
- **Quackbusters & Medical Freedom** (topic, 1) — his medical-monopoly polemic (names Victor Herbert / Stephen Barrett — earmarked for the end legal pass). ★ Luneth wants MORE such material captured as we mine.
- **Pregnancy & Birth** (existing, +2) — the 2 birth-defect claims folded here: EPIGEN-018 = WARNING (deficiency = #1 cause of birth defects), EPIGEN-017 = HISTORY & LORE (teratology → thalidomide). "birth defects / congenital defects / teratology" added as pregnancy_birth synonyms so discoverability survives. **Birth Defects dropped as its own entity** (re-introduce later ONLY if pregnancy_birth bloats — Luneth's call).
- **Longevity** (existing, +1) — 1990 Lepe Harvard survey (Scandinavian dairy farmers vs fried-food regions; "diet not doctors").
- **Dropped:** IMMORT-020 cross-book list-mention (→ folded into the proper cross-book pass below, not a standalone "his other books?" Q).

## ★ DOCTRINE FIX (2026-07-10, same session — purged to zero)
The invented **"newest-book-only capture"** rule was WRONG and is PURGED from every live surface. Newest-wins is **CONTRADICTION-handling ONLY** (differing numbers/stances → newest wins); **ALL books are captured in search** — older books fill gaps / add context / cross-reference (many of the best search claims are from older books). Deleted the `homosexuality-intersex-newest-book-only` memory; corrected editorial-fringe-exclusion-policy / epigenetics-mining-policy / favor-newest-wallach-number / enrich-tier1-every-book-favor-newer. See [[favor-newest-wallach-number]] + [[enrich-tier1-every-book-favor-newer]].

## ★ The golden template (LOCKED — apply to EVERY entity)
1. **Field home** = `eden/corpus/search-enrichment.json` (authored subject/also_about/facet/question/answer_short/topics [+ optional `see_also`]); everything DERIVES via `eden/tools/search_index_derive.py` → `search-index.json`. Registry = `eden/catalog/search-entities.json`.
2. **Canon/catalog display, no dup:** canon → `canon_ref:true` (name/symbol from essentials-canon); catalog conditions → `catalog_ref:true` (name from conditions.json); non-canon → `display_name` (+`symbol` for elements). **Type convention: canon minerals/elements → `nutrient`; non-canon elements → `element`; framework/category → `concept`; modalities/practices/subjects → `topic`; a disease page from tier-1/dual-home claims → `condition` (catalog_ref, facet order leads with STANCE).** ★ Charged identity/sexuality subjects (homosexuality/intersex) = `topic` + display_name, NEVER catalog_ref condition even though the slug IS a catalog condition ("condition" framing sends the wrong message; fringe policy).
3. **Per-type facet ORDER** (`FACET_ORDER_BY_TYPE`): conditions lead stance→mechanism→protocol→warning; else default.
4. **Per-type ICONS** + bespoke `ENTITY_ICON`; elements/minerals keep atomic symbol.
5. **`tier1_link` fires ONLY for non-search-only claims.**
6. **ONE pill rule** (`renderPill`): a slug pill is a clickable link iff `getEntity(slug)!==null`, else a plain chip; self-upgrades as entities are authored. Nav back-stack.
7. **BIOGRAPHY** facet label (generic).
8. `answer` byte-faithful to the sealed summary (keep the lead label); `answer_short` authored, ASCII, ≤~160 soft.
9. **Glosses in Search answers**: shared `views/glossify.ts`; add plain-language terms to `dashboard/assets/data/glossary.json` (hand-authored, NO digits).
10. **Scroll-to-top on nav**: `search.ts paintBody` resets `.sr-body.scrollTop=0`.
11. **`see_also` in-text cross-reference** (gated): target = enriched claim of SAME subject; phrase occurs in answer.
- **`related` is UNCAPPED** — author generously with REAL connections (hub links essential_nutrients/colloidal_minerals/be_your_own_doctor/pregnancy_birth). Don't pad thin entities.
- **Concept/topic grouping:** group thin claims into one rich concept/topic; keep genuinely-distinct subjects separate.
- **Charged/editorial/intimate content:** ask Luneth per-instance (he decides include/exclude); when included, keep his words verbatim.

## ★ KEY REMINDERS
- Search corpus LARGER than the ~186 `search-only` claims; boundary runs the other way (`search_only_indices_excluded`).
- **Epigenetics charged content now DONE** (batch 9). Only the deferred homosexuality claim IMMORT-020 was set aside → cross-book pass.
- **Round-close gotchas** ([[creators-log-append-gotchas]]): Creator's Log `--summary` HARD-capped 280; pass args via `"$(cat file)"` WITHOUT escaping inner quotes; remove any botched empty tail before commit.
- safe_write scripting: edit ONE file multiple times → read once + apply all + write once ([[safe-write-crlf-flip]]).

## NEXT (fresh session)
1. **SEAL the 2 search source files** — `eden/corpus/search-enrichment.json` + `eden/catalog/search-entities.json` are now stable (migration complete). Add index sharding (blueprint §7) if the index grows large.
2. **Resume mining search-first** from Immortality **Mn-Manganese**, full taxonomy per `.claude/rules/search-corpus.md` (search is the LARGER consumer — capture systematically).
3. **Cross-book capture** the wrongly-skipped older homosexuality/intersex treatises (Rare Earths Ch7 + DDDL) + the Immortality IMMORT-020 parallel + MORE Quackbusters / medical-freedom material — all per the purged-newest-only doctrine (capture all books, cross-reference, dedupe genuine dups only, run charged content past Luneth).

## The doctrine (AUTHORITATIVE — read before search work)
- `.claude/rules/search-corpus.md` (operating spine) · `chronicle/search-build-blueprint.md` (build plan) · `chronicle/search-corpus-plan.md` (capture criteria).

## Gates + tooling (all LIVE, board 53/53)
`derived_artifacts_fresh` (covers search-index.json) · `search_index_wellformed` (facet∈taxonomy · subject/also_about resolve · fields present · answer+verbatim non-empty · TS==Python taxonomy · canon_ref/catalog_ref · see_also same-subject + phrase-in-answer) + negative test `tools/test_search_index_wellformed.py` · `render_probe_search.js`.

## The paused mining roadmap (blueprint §7)
G-4 finish Immortality (resume A-Z at Mn-Manganese) · G-5 DDDL re-mine · G-6 the 3 new books · **G-7 = the Search build (migration COMPLETE — 56 entities / 198 claims; SEAL next)** · G-8 close-out + seal. Phases H (app completion) + I (design) after.

## Carried follow-ups (deferred; NOT blockers)
Seal the 2 search source files (now due) · cross-book homo/intersex capture (RARE Ch7 + DDDL + IMMORT-020) · more Quackbusters/medical-freedom material · Epigenetics concept enrichment · `search_density_report` + per-region question-inventory (Layer 2/3) · index sharding at scale · lithium coverage target could derive · rare-earths/lets-play-doctor per-page accounting (G-8) · deep linguistic sweep + book purification (G-8, 2/6 pristine) · 3 parked claim notes · pre-existing eslint style debt in search.ts/schema.ts (not blocking).
