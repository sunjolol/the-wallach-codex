# Search corpus doctrine — the second consumer, treated with equal respect

_Read before mining for search or building the Search surface. The full design lives in `chronicle/search-build-blueprint.md` (build) + `chronicle/search-corpus-plan.md` (capture criteria); this is the durable operating spine. Locked 2026-07-09 (Luneth)._

## Pattern
The corpus has TWO consumers, and search is the LARGER one by design:
- **Tier-1 (operational)** — the Conditions / Essentials / Coverage tabs. A small, high-precision, correctness-gated slice.
- **Search / Ask-Wallach** — the near-complete Wallach knowledge base powering plain-language Q&A, offline. It must be **robust, complete, and massive** so it answers almost any question a user could plausibly ask, with real Wallach info — the "wow factor."

**Search claims should FAR outweigh tier-1**, because most of what Wallach wrote is educational/stance/narrative, not operationally-mappable. That ratio is an OUTCOME of honest capture, never a padding target.

## ★ ALL MINING SERVES ASK-WALLACH (Luneth 2026-07-23 — elevated once the catch-all search shipped)
From now on the PRIMARY purpose of every mining operation is to make Ask-Wallach magical: mine FOR the search, biggest / most-searched entities first, capturing as many common real-person questions as Wallach's books actually support. The wow-factor bar — a user types ANY plausible question and gets a real Wallach answer. The enrichment RECIPE (matches how `state/search.ts::scoreClaim` really ranks): a `question` in the EXACT words a person types (the highest-weighted field) · the correct `subject` (drives intent routing + best-answer pick) · rich LAY `synonyms` on the entity (the single biggest lever — powers exact-match + the entity-in-query intent routing) · `topics[]` tags · a crisp direct `answer_short` · `also_about` cross-links · the correct `facet` (family grouping) · per-entity QUESTION-INVENTORY coverage (L3 below). Two levers: rich synonyms ROUTE any phrasing to the right page; inventory coverage gives sharp best-answers. The code system (entity-in-query routing, charged gate, five-family grouping, See-N-more, clickable hero) shipped 2026-07-23 — it now just needs the enriched data. Full detail: memory [[mining-serves-ask-wallach]].

## What SUPERSEDES the old framings (deleted, do not resurrect)
- ❌ "Search is tier-2 / secondary / broader-guidance afterthought." → Search is a first-class, primary corpus held to the SAME respect as tier-1.
- ❌ "Capture search content CASE-BY-CASE / ask Luneth per candidate / present candidates for yes/no during calibration." → Capture EVERY search-worthy statement SYSTEMATICALLY via the criteria + facet template below. The per-candidate-ask calibration is retired.
- ❌ The "wall-of-text" blob claim (summary + inline verbatim jammed into `claim_text`). → The structured, faceted template below.

The ONLY thing that still asks Luneth every time is genuinely **fringe / charged / editorial** content (the fringe rules are unchanged: `editorial-fringe-exclusion-policy`, `editorial-spiritual-vs-mystical`).

## The inclusion test (systematic, not case-by-case)
Capture a search claim iff BOTH hold: (1) it carries **real, distinct information** (a fact, stance, mechanism, story, use, warning — not a bare slogan or a raw number with no interpretive value), AND (2) a real person could **plausibly ask a question it answers**. Broad catch-all; the "real info" gate stops padding. When unsure → capture (a dropped answer is a hole in the wow-factor). **Stay grounded — never invent/hallucinate to fill a gap; the verbatim-faithfulness gates forbid it, and the question-inventory only ever points back to real book content.**

## The facet taxonomy (the neat breakdown — capture one claim per distinct instance)
`basics` · `discovery` · `etymology` · `uses` · `mechanism` · `sources` · `stance` · `big_question` · `biography` · `history` · `warning` · `physiology` · `protocol`. Closed set, gated by `search_index_wellformed` (critical, LIVE — `tools/invariants.py`; negative test `tools/test_search_index_wellformed.py`). **Corrected 2026-07-17:** this line read "gated `facet_in_taxonomy`" — **no such invariant has ever existed** in the repo. The taxonomy IS enforced, under the real gate's name; the doc named a gate that does not exist, which is the R7 failure the Charter's `charter_gates_present` meta-gate catches on the Charter surface but NOT here (it parses only `.claude/rules/charter.md`'s R1–R9 table). A rules file can still oversell its enforcement unchecked.

## The structured template (NOT a blob — the "products treatment")
Every search claim carries: `subject` (entity slug) · `also_about[]` · `facet` · `question` · `answer_short` · `answer` (modern voice, **no inline verbatim**) · `verbatim` (byte-faithful) · `cite` (composed) · `topics[]`. Prose stays contained (R4) + single-source (R3): the `answer` is the one home for the plain-language gloss; the `verbatim` is Wallach's exact words; neither duplicates the other. Entities resolve to `eden/catalog/search-entities.json` (reusing canon/catalog slugs where they exist — no duplication).

## The tier-1 boundary (UNCHANGED — still enforced)
`search-only`-tagged content NEVER feeds the operational Conditions/Symptoms/Essentials tabs (`search_only_indices_excluded`, LIVE). Dual-home is allowed: a claim that also maps an operational condition/essential is BOTH searchable and tier-1. The boundary is about the OPERATIONAL tabs, not about search being lesser.

## Completeness — proven, not promised (same respect as tier-1)
Layered: **L1** no page skipped (`mining_coverage_accounted`, LIVE) · **L2** `search_density_report` flags under-mined outlier pages (informational, not a hard floor — a floor breeds padding) · **L3** a per-region question-inventory (list the questions a region answers, verify each has a claim) · **L4** the G-7 Search-as-harness gap-loop (query Search, any answerable-but-unanswered question = a gap → backfill) — the ultimate validator before seal.

## Enforcement
- **LIVE (measured 2026-07-17, not promised):** `search_index_wellformed` (critical) already enforces THREE of what this line used to list as future work — facet ∈ the closed taxonomy, `subject`/`also_about` resolve to registry/canon, and the claim is structured with non-empty answer+verbatim (i.e. not a blob). The old names `search_claim_wellformed` / `facet_in_taxonomy` / `search_entity_resolves` describe live enforcement under one real gate; they were never separate invariants.
- **STILL A WISH (R7):** `search_index_fresh` (the derived search index is not yet byte-gated against the enrichment source) + `render_probe_search` (no headless probe drives the Search surface).
- **Corrected 2026-07-17:** this line was stale in BOTH directions at once — it named a gate that does not exist (`facet_in_taxonomy`) while listing as "to build" three checks that were already shipped and green. That is the same drift the Charter recorded for R3/R5, and it has the same cause: **nothing re-audits a rules file against the invariant list.** `no_operating_doc_contradiction` catches deleted-structure tokens and dangling pointers, not a gate name that never existed.- **LIVE:** `search_only_indices_excluded`, `corpus_runtime_purity` (offline), plus the shared corpus gates (verbatim faithful R5, prose contained R4, citations composed R3).
- **Discipline (WISH, R7):** the search-worthiness + question-inventory judgment stays human + harness-validated, exactly like the fringe/editorial calls.
