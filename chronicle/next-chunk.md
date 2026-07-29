# Next chunk — ★ AUTHORITATIVE HANDOFF (set up 2026-07-28 for a FRESH session)

# ★★★★★ READ FIRST (plain language)
Board **76/76 green · corpus kv431 · 2264 sealed claims · repo clean + pushed** (HEAD `6c2c9ebb`). The previous
session is fully closed (summary below). **The NEW agenda Luneth set, IN ORDER:**
1. **SEARCH enhancements** (first).
2. **The 90-essentials HEADERS** — FINALLY build the per-essential page headers. Luneth's own words: the fun part
   he's been looking forward to. This is VISUAL/design work → the visual-verification gate applies (build → STOP →
   his sign-off, every chunk).

**These are ENHANCEMENT + DESIGN tasks — start each by getting the specifics from Luneth** (what the search
enhancements are; what he wants each essential header to look/feel like). Do NOT guess the spec; he drives it.

---

## TASK 1 — SEARCH enhancements (do FIRST) — spec TBD with Luneth
Ask Luneth what the enhancements are, then build in small batches with his review. Context to load first:
- Doctrine: `.claude/rules/search-corpus.md` (the search corpus is the LARGER consumer; ALL mining serves Ask-Wallach).
- Build/plan: `chronicle/search-build-blueprint.md` + `chronicle/search-corpus-plan.md`.
- Memories: [[mining-serves-ask-wallach]] ★★★, [[ask-wallach-search-vision]], [[search-is-a-catch-all-over-everything]],
  [[search-routing-verify-not-scoreclaim]] (queries ROUTE via resolveQuery/entityInQuery, not scoreClaim),
  [[ask-search-indexes-only-enriched]] (unenriched = invisible to Ask), [[topic-opener-lede-mechanism]].
- Code: `state/search.ts` (scoreClaim/resolveQuery/getSearchClaim), `views/*` search surface; probes
  `tools/render_probe_search.js` (23-check catch-all) + `tools/render_probe_search_routing.js`.

## TASK 2 — the 90-essentials HEADERS (the fun part) — spec TBD with Luneth
The essential detail page already renders a `kd-ep-hero` (symbol + name) in `views/entity-page.ts` (~line 1303,
`renderEssentialPage`). This task builds it out into a real, designed per-essential header. Load first:
- The visual BAR + principles: `dashboard/components/trace-mineral-tile-detail.html` + memory
  [[visual-design-bar-and-principles]]; other demos in `dashboard/components/` (drawer-knowledge-v3-PROPOSAL.html …).
- Rules: `.claude/rules/visual-verification.md` (the human-in-the-loop gate — Luneth is the tester; STOP for sign-off),
  `.claude/rules/data-flow.md` (no canonical value as a literal; header data derives from the pillars behind a schema).
- Memories: [[category-color-coding]] (minerals=blue vitamins=orange aminos=green omegas=purple),
  [[element-intro-what-is-claim]], [[daily-target-provenance-always]], [[element-sources-at-bottom]],
  [[gold-standard-page-workflow]] (build ONE surface to 100% before the next), [[screenshot-verify-visual-chunks]]
  (a DOM probe is NOT a visual check — screenshot-verify), [[svg-figure-size-in-screen-px]].

---

## DONE last session (all committed + pushed)
- Entity-page **question-indexing** filter fix (`aaaf4c30`) — full-record filter matches the enrichment question.
- **Task A thin-claim re-mine FINISHED** (`85ac75e2`, kv428→kv430): 21 upgrades, keep-verbatim method.
- **EPIGEN-137 potassium-cap follow-up** (`8dcea900`, kv430→kv431): new claim WAL-CLM-EPIGEN-000463 + silica enrichment fix.
- **Stale product-panel probe fixed** (`6c2c9ebb`): render_probe_entity checked the retired `.kd-product-deep`; the
  panel renders as `.kd-ep--prod`. Nav always worked; probe now PASSES in full. NOT a real bug.
- Lesson: [[remap-claim-can-orphan-target]] — grep source_claim_id before re-mapping a claim's essentials/kind.

## Only staged/deferred item left from the old agenda (non-blocking)
- The **3 honest GAPs** (chromium/niacin/B6 toxicity) — no doctrine in the books; correct to LEAVE un-remined.

## STANDING DOCTRINES (unchanged)
1. Every claim lives in ONE of three homes (essentials/conditions/Explore); search is a retrieval layer.
2. Diet not food; nutrients from the DIET (food OR supplements).
3. NEVER fabricate — verbatim ⊆ the sealed book, or GAP.
4. corpus_seal + catalog_seal are USER-ONLY (per-invocation authorization).
5. Memory index: leave it until >200 lines, THEN remind Luneth ([[memory-consolidation-threshold]]).

**Corpus kv431 · 2264 sealed claims · board 76/76 green · repo clean + pushed. Next session: SEARCH, then HEADERS.**
