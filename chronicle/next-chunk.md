# Next chunk — ★ AUTHORITATIVE HANDOFF (set up 2026-07-28 for a FRESH session)

# ★★★★★ READ FIRST (plain language)
Board **76/76 green · corpus kv432 · 2267 sealed claims · repo clean + pushed**. The previous session is fully
closed. **The SEARCH-enhancement round is DONE** (all 34 of Luneth's test queries handled across 3 checkpoints).
The **one remaining agenda item** Luneth set:

1. **The 90-essentials HEADERS** — FINALLY build the per-essential page headers. Luneth's own words: the fun part
   he's been looking forward to. This is VISUAL/design work → the visual-verification gate applies (build → STOP →
   his sign-off, every chunk). **DESIGN task — start by getting the specifics from Luneth** (what he wants each
   essential header to look/feel like). Do NOT guess the spec; he drives it.

---

## TASK 1 — the 90-essentials HEADERS (the fun part) — spec TBD with Luneth
The essential detail page already renders a `kd-ep-hero` (symbol + name) in `views/entity-page.ts`
(`renderEssentialPage`). This task builds it into a real, designed per-essential header. Load first:
- The visual BAR + principles: `dashboard/components/trace-mineral-tile-detail.html` + memory
  [[visual-design-bar-and-principles]]; other demos in `dashboard/components/`.
- Rules: `.claude/rules/visual-verification.md` (the human-in-the-loop gate — Luneth is the tester; STOP for sign-off),
  `.claude/rules/data-flow.md` (no canonical value as a literal; header data derives from the pillars behind a schema).
- Memories: [[category-color-coding]] (minerals=blue vitamins=orange aminos=green omegas=purple),
  [[element-intro-what-is-claim]], [[daily-target-provenance-always]], [[element-sources-at-bottom]],
  [[gold-standard-page-workflow]] (build ONE surface to 100% before the next), [[screenshot-verify-visual-chunks]]
  (a DOM probe is NOT a visual check — screenshot-verify), [[svg-figure-size-in-screen-px]].

---

## DONE this session — SEARCH-enhancement round COMPLETE (3 checkpoints, all committed + pushed)
Luneth pasted 34 plain-language test queries that mis-routed; fixed them in 3 reviewed checkpoints:
- **Checkpoint 1** (`f318a2dc`): made the resolver PUNCTUATION-PROOF (new `matchKey` in `state/search.ts` collapses
  punctuation symmetrically on the query AND every entity phrase; two-pass `entityHit` so a canonical slug beats a
  synonym collision — fixed a `vitamin-b12`->cobalt regression) + 17 existing-entity routing/hero fixes (lay synonyms
  on 9 entities, gluten/fried/meat hero-refinements, palpitations synonym de-dup). Refreshed the stale
  `render_probe_search_routing.js` (was 5/6 red at HEAD — routing had evolved, NOT a regression) to 6/6.
- **Checkpoint 2** (`b29ee782`): 5 NEW hub pages fixing 14 more queries — `muscle_strength`, `intelligence`,
  `veganism`, `healthy_foods`, gender-neutral `frequent_urination`. Needed a derive change: added an explicit
  `hub: true` registry flag so `search_index_derive.build_index` registers also_about-only hubs (index 512->517,
  scoped — NOT the 159 conditions reachable via also_about). Flag never reaches the runtime Zod schema. Then per
  Luneth: deduped a veganism B12 twin + enriched Intelligence 3->18 with brain-nutrition claims.
- **Checkpoint 3** (this commit): MINED + SEALED the aspirin/ibuprofen safety answer (kv431->432, +3 claims:
  DDDL-318 aspirin warning, DDDL-319 ibuprofen warning, HELLS-096 the ibuprofen->Alzheimer's antioxidant benefit —
  TWO-SIDED because Wallach is). New `painkillers` entity ("Painkillers & NSAIDs") + activated the empty `aspirin`
  entity. Kept combined (Wallach has ~no dedicated prescription-opioid content).

## Honest items LEFT UN-FORCED (Luneth's explicit call — do NOT "fix" without him)
- **"which supplements are best?"** — genuinely ambiguous (best for WHAT?); any synonym fix hijacks the
  "best supplements for <condition>" family. Left as-is by design.
- **"sharp pain in lower right abdomen"** — Wallach's corpus has NO acute-abdomen / appendicitis-diagnosis content;
  refused to fabricate a route. Stays on the generic Pain page.
- **dark-urine queries** ("why is my urine dark") — no Wallach urine-color content; soft-land on the Water page
  (honest least-bad landing, Luneth OK'd).

## NEW mechanism worth knowing (from this round)
- `hub: true` in `eden/catalog/search-entities.json` = register an also_about-only aggregation entity in the search
  index (see `search_index_derive.build_index`). Use it for future topic hubs; it is EXPLICIT so it never floods the
  browse grid.
- The resolver is now punctuation-insensitive (`matchKey`); a trailing "?" no longer defeats entity-mention routing.

## STANDING DOCTRINES (unchanged)
1. Every claim lives in ONE of three homes (essentials/conditions/Explore); search is a retrieval layer.
2. Diet not food; nutrients from the DIET (food OR supplements).
3. NEVER fabricate — verbatim subset of the sealed book, or GAP.
4. corpus_seal + catalog_seal are USER-ONLY (per-invocation authorization).
5. Memory index: leave it until >200 lines, THEN remind Luneth ([[memory-consolidation-threshold]]).

**Corpus kv432 · 2267 sealed claims · board 76/76 green · repo clean + pushed. Next session: the 90-essentials HEADERS (the fun part).**
