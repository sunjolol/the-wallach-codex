# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-23, Ask-Wallach CATCH-ALL shipped)

# ★★★★★ The Ask-Wallach search is DONE + committed (board 77/77). It is now a TRUE catch-all with intent + no blur lag. NEXT = Luneth's dashboard-wide TOUCHUP notes (he has MANY) — await them at session start, do NOT assume scope.

## ✅ WHAT LANDED THIS SESSION (all live, committed, board 77/77, tsc + build + render_probe_search clean)
- **Catch-all entity results**: every exact match (any of ~600 conditions/essentials/topics, not just the 73 enriched) now shows ALL its claims — enriched Q&A FIRST, then the raw sealed corpus — grouped into the 5 families (The Science / Cautions / What To Do / Wallach's Take / The Story), each with a real "See N more <family>" reveal + a "Keep exploring" row of live related pills. (`state/search.ts::entityFamilies`, `views/search.ts::renderTopicPage/renderFamilyGroup/renderEntityRow/renderKeepExploring`)
- **Intent routing**: a query that MENTIONS an entity routes to that entity's page UNLESS the top-ranked claim's subject IS it — "what causes cancer" → the Cancer page (not a gold claim); "libido"/"potency" → sexual_health. (`entityInQuery` + hybrid `resolveQuery`)
- **Charged-topic gate PORTED** (was prototype-only, never in the real build): `CHARGED{homosexuality,intersex}` filtered from `askRanked` + empty-state suggestions UNLESS the query explicitly names one. (`chargedExplicit`/`isCharged`/`isChargedEntity`)
- **Blur lag KILLED**: removed `backdrop-filter: blur()` (it re-rasterizes the whole page behind the overlay every repaint = the recurring lag) → plain `rgba(18,14,10,0.74)` scrim. THIS is the fix — do NOT re-add a backdrop-filter blur.
- **Clickable hero**: the whole `.ehero--link` row is the Learn-More hit target; hovering anywhere lights the button; "Learn More" 0.54→0.7rem, vertically centered, +5px right margin.
- **render_probe_search.js**: the standing WISH is CLOSED — asserts the full rich behaviour (family grouping, qa-first, per-category See-N-more, keep-exploring, clickable hero) + intent routing + charged gate + Learn-More cross-nav.
- **Doctrine + memory**: `.claude/rules/search-corpus.md` + memory `mining-serves-ask-wallach` — ALL future mining now serves Ask-Wallach (the enrichment recipe).

## ▶ NEXT — Luneth's dashboard-wide touchup notes
Luneth has MANY touchup notes across the ENTIRE dashboard for next session. Await them at session start; do NOT assume scope. Apply visual-verification: build a coherent chunk → STOP → screenshot/verify → sign-off → next.

## 🔴 DEFERRED (search follow-ups, for when mining resumes)
- **THE BIG LEVER — mining-for-search** (memory `mining-serves-ask-wallach`): enrich the biggest entity pages with search-DESIGNED claims (question in real user phrasing · correct subject · rich LAY synonyms · topics tags · direct answer_short) + per-entity question-inventory coverage. This is what makes the search feel "magic". Elements pages already planned; add the biggest claims/condition pages.
- **testosterone → strength**: a MINING gap (NOT code) — the intent system is ready; it needs Wallach's vitality/strength material mined + tagged into a real entity with lay synonyms (memory `general-interest-lay-topic-tagging`).
- **Products in search**: a fast-follow (needs a state-level product read-boundary + product type/colour + a route to renderProductDeep).
- **Wide-entity synonyms**: conditions/essentials resolve by NAME only (their synonyms field is sparse — 2/502 conditions, 14/91 essentials); populate aliases (small data task).

## FILES (Ask-Wallach surface)
`state/search.ts` (resolve / intent / charged / entityFamilies) · `views/search.ts` (render + mount) · `core/schemas/search.ts` (SEARCH_FACETS + FACET_FAMILIES) · `state/entity-page.ts` + `state/corpus.ts` (the claim sources) · `state/copy.ts` + `view-copy.json` · `styles/drawer-search.css` · `core/events.ts` (`knowledge:open-entity`) · `main.ts` (wireSearchToKnowledge) · `views/knowledge.ts` (openEntity) · `tools/render_probe_search.js`. Signed-off demo: `temporary/ask-wallach-results-demo.html`.

## 🔧 MECHANICS (unchanged) — the load-bearing ones
- CSS is LINKED (no rebuild); JS/data need `node tools/build.mjs`. Creator's-Log embed inlines at BUILD → re-inline AFTER logging.
- Every write via `safe_write` (LF payloads — safe_write reads disk LF-normalized + re-applies CRLF on write, so pass LF; multi-edit → a Python driver of exact-string `safe_replace` with count==1 asserts). Never bare `cd subdir`.
- Round-close: build → invariants → probe → build-log → `creators_log.py append` (--summary ≤280) → RE-inline build → commit + push. `corpus_seal` is USER-ONLY.
- Headless verify: puppeteer from repo-root `node_modules`; dismiss the welcome veil ("just browsing"), click `.topbar__ask` (or press S) to open search.
- Mining still PAUSED (until Luneth resumes; when he does, it serves Ask-Wallach — memory `mining-serves-ask-wallach`).

## 🔴🔴 REVIEW PROCESS (every corpus/content touch): show each claim in EXACT final form (Q→short→[full if it adds]→quote), approve the CLAIM. Unreviewed = log "unreviewed". `corpus_seal` USER-ONLY.
