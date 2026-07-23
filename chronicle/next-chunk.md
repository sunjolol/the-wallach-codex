# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-23, Ask-Wallach BUILT LIVE)

# ★★★★★ Ask-Wallach search REBUILT LIVE this session (was design-only). Board 77/77, committed. The old `.sr-*` left drawer is GONE — it is now the signed-off centered green popup. NEXT = make the search a CATCH-ALL (read the memory first).

## ▶ NEXT — make the search cover the WHOLE knowledge base (the underlying fix Luneth demanded)
**READ FIRST: memory [[search-is-a-catch-all-over-everything]] + [[learn-more-links-to-knowledge-page]] — the vision lives there, do NOT re-derive it.**
The search today only knows its **73 enriched entities / 321 enriched claims** (`search-index.json`). It must reach **EVERYTHING**: 502 conditions + 91 essentials (`entity-page-data.json`) + Explore topics (`knowledge-explore.js::exploreEntities()`, page via `knowledge-topic.js::renderTopicPage`) + products + all ~1346 corpus claims. Luneth: this is **mostly a PRESENTATION problem** — style non-enriched entries to match the enriched look.

The 3 rule-level fixes (NOT per-instance patches — Luneth was explicit):
1. **Exact-match resolves against the FULL universe + synonyms, routes to the full page.** Today `state/search.ts::entityHit` checks only the 73 → "cancer" (a real condition page, `entity-page-data` HAS `cancer`) falls through to a junk "Is gold used to treat cancer?" ask result. Broaden it; a non-search-entity exact match should jump to its Knowledge page.
2. **"Learn More →" basically ALWAYS appears.** Predicate in `views/search.ts::renderTopicPage` is too narrow (conditions+essentials only) → Mercury (an Explore topic WITH a page) shows none. Broaden the predicate + extend `openEntity`/`openDetail` to Explore-topic (`data-kd-topic` exists) + product kinds.
3. **No arbitrary truncation.** Question "more answers" caps at 4 (`renderQuestionResults`, `.slice(1,5)`) with no see-more; topic groups cap at `GROUP_CAP=4`. Hundreds-of-entries topics must show more + a working "See N more".
(Keep-exploring "gold for cancer" nonsense is fixed for free once exact-match routes cancer correctly.)

⚠ Investigation was IN PROGRESS at session end: mapping the explore/topic/product page getters + condition synonym matching (how Knowledge Home search matches synonyms — reuse it). Resume there.

## ✅ WHAT LANDED (all live, board 77/77, tsc+build+my-lint clean, committed)
- **Opening screen**: centered green popup + neumorphic search bar + 5 facet-FAMILY "browse by kind" cards w/ REAL counts (Science137·WhatToDo53·Wallach's44·Cautions36·Story51). Scrim = darker+blur, LAG-FREE (no transitioned blur), z-index 200 full-cover.
- **Results (3 types)**: best-answer card (Playfair verbatim, "— Dr. Wallach", NO book cite) + colour-coded "more answers" + keep-exploring card · topic page (hero + facet groups + pills bottom-right, drop on expand) · empty state (real type-coloured chips). Green scrollbar.
- **Token ranking** (`state/search.ts::askRanked/scoreClaim`): tokenize+stopwords, per-token field-weighted. "why are fried eggs bad" now ranks right.
- **Learn More cross-nav** (conditions+essentials): event `knowledge:open-entity` → `main.ts::wireSearchToKnowledge` → `knowledge.ts::openEntity`. VERIFIED end-to-end (diabetes→condition page). Predicate too narrow — see fix #2.
- **Colour = DATA-DRIVEN** (never a TS colour literal, `view_category_not_hardcoded`): `data-facet`→family, `data-type`→entity colour, mapped in `drawer-search.css`. `--fam-*`/`--aw-green`/`--t-*` REDECLARED on `#drawer-search-mount`.

## FILES (this surface)
`views/search.ts` (render+mount) · `state/search.ts` (resolve/rank/families) · `core/schemas/search.ts` (SEARCH_FACETS + FACET_FAMILIES) · `state/copy.ts`+`view-copy.json` (family labels: ui `search_fam_*`) · `styles/drawer-search.css` · `core/events.ts` (`knowledge:open-entity`) · `main.ts` (wireSearchToKnowledge) · `views/knowledge.ts` (`openEntity`/`openDetail`). Signed-off mockups: `temporary/ask-wallach-B-refined.html` + `ask-wallach-results-demo.html`.

## 🔴 OPEN / DEFERRED
- **`render_probe_search.js` STILL A WISH** — never built (per-surface probe missing). Add it when the catch-all lands.
- **DATA bug (NOT UI)**: the fried-eggs claim's `verbatim` leads with an unrelated fragment ("the base line nutritional supplement including 5 gm of EFA t.i.d."). Corpus mining fix, USER-GATED review — do not silently trim.
- **Pre-existing `main.ts` lint** (import order / useless-return / multi-blank in navigateTo/bootstrap/wireWelcome) — NOT mine, left untouched. eslint is NOT board-gated.
- Mining still PAUSED.

## 🔧 MECHANICS (unchanged) — see the rules files; the load-bearing ones:
- CSS is LINKED (no rebuild); JS/data need `node tools/build.mjs`. Creator's-Log embed inlines at BUILD → re-inline AFTER logging.
- Every write via `safe_write` (LF payloads; multi-edit → a Python driver of exact-string replaces with `count==1` asserts; CRLF-normalize first). Never bare `cd subdir`.
- Round-close: build → invariants → probe → build-log → `creators_log.py append` (--summary ≤280) → RE-inline build → commit+push. `corpus_seal` is USER-ONLY.
- Headless verify: puppeteer from repo-root `node_modules/puppeteer`; dismiss the welcome veil ("just browsing"), click `.topbar__ask` (or press S) to open search.

## 🔴🔴 REVIEW PROCESS (every corpus/content touch): show each claim in EXACT final form (Q→short→[full if adds]→quote), approve the CLAIM. Unreviewed = log "unreviewed". `corpus_seal` USER-ONLY.
