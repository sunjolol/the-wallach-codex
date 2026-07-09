# Search corpus doctrine — the second consumer, treated with equal respect

_Read before mining for search or building the Search surface. The full design lives in `chronicle/search-build-blueprint.md` (build) + `chronicle/search-corpus-plan.md` (capture criteria); this is the durable operating spine. Locked 2026-07-09 (Luneth)._

## Pattern
The corpus has TWO consumers, and search is the LARGER one by design:
- **Tier-1 (operational)** — the Conditions / Essentials / Coverage tabs. A small, high-precision, correctness-gated slice.
- **Search / Ask-Wallach** — the near-complete Wallach knowledge base powering plain-language Q&A, offline. It must be **robust, complete, and massive** so it answers almost any question a user could plausibly ask, with real Wallach info — the "wow factor."

**Search claims should FAR outweigh tier-1**, because most of what Wallach wrote is educational/stance/narrative, not operationally-mappable. That ratio is an OUTCOME of honest capture, never a padding target.

## What SUPERSEDES the old framings (deleted, do not resurrect)
- ❌ "Search is tier-2 / secondary / broader-guidance afterthought." → Search is a first-class, primary corpus held to the SAME respect as tier-1.
- ❌ "Capture search content CASE-BY-CASE / ask Luneth per candidate / present candidates for yes/no during calibration." → Capture EVERY search-worthy statement SYSTEMATICALLY via the criteria + facet template below. The per-candidate-ask calibration is retired.
- ❌ The "wall-of-text" blob claim (summary + inline verbatim jammed into `claim_text`). → The structured, faceted template below.

The ONLY thing that still asks Luneth every time is genuinely **fringe / charged / editorial** content (the fringe rules are unchanged: `editorial-fringe-exclusion-policy`, `editorial-spiritual-vs-mystical`).

## The inclusion test (systematic, not case-by-case)
Capture a search claim iff BOTH hold: (1) it carries **real, distinct information** (a fact, stance, mechanism, story, use, warning — not a bare slogan or a raw number with no interpretive value), AND (2) a real person could **plausibly ask a question it answers**. Broad catch-all; the "real info" gate stops padding. When unsure → capture (a dropped answer is a hole in the wow-factor). **Stay grounded — never invent/hallucinate to fill a gap; the verbatim-faithfulness gates forbid it, and the question-inventory only ever points back to real book content.**

## The facet taxonomy (the neat breakdown — capture one claim per distinct instance)
`basics` · `discovery` · `etymology` · `uses` · `mechanism` · `sources` · `stance` · `big_question` · `biography` · `history` · `warning` · `physiology` · `protocol`. Closed set (gated `facet_in_taxonomy`).

## The structured template (NOT a blob — the "products treatment")
Every search claim carries: `subject` (entity slug) · `also_about[]` · `facet` · `question` · `answer_short` · `answer` (modern voice, **no inline verbatim**) · `verbatim` (byte-faithful) · `cite` (composed) · `topics[]`. Prose stays contained (R4) + single-source (R3): the `answer` is the one home for the plain-language gloss; the `verbatim` is Wallach's exact words; neither duplicates the other. Entities resolve to `eden/catalog/search-entities.json` (reusing canon/catalog slugs where they exist — no duplication).

## The tier-1 boundary (UNCHANGED — still enforced)
`search-only`-tagged content NEVER feeds the operational Conditions/Symptoms/Essentials tabs (`search_only_indices_excluded`, LIVE). Dual-home is allowed: a claim that also maps an operational condition/essential is BOTH searchable and tier-1. The boundary is about the OPERATIONAL tabs, not about search being lesser.

## Completeness — proven, not promised (same respect as tier-1)
Layered: **L1** no page skipped (`mining_coverage_accounted`, LIVE) · **L2** `search_density_report` flags under-mined outlier pages (informational, not a hard floor — a floor breeds padding) · **L3** a per-region question-inventory (list the questions a region answers, verify each has a claim) · **L4** the G-7 Search-as-harness gap-loop (query Search, any answerable-but-unanswered question = a gap → backfill) — the ultimate validator before seal.

## Enforcement
- **NEW gates (build with the surface):** `search_claim_wellformed` (structured not blob), `facet_in_taxonomy`, `search_entity_resolves`, `search_index_fresh`, `render_probe_search`.
- **LIVE:** `search_only_indices_excluded`, `corpus_runtime_purity` (offline), plus the shared corpus gates (verbatim faithful R5, prose contained R4, citations composed R3).
- **Discipline (WISH, R7):** the search-worthiness + question-inventory judgment stays human + harness-validated, exactly like the fringe/editorial calls.
