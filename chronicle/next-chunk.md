# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-24 · Detox topic + ORAC search polish SHIPPED · next = product-ORAC, Luneth sending notes)

# ★★★★★ This session shipped the Detox/Microplastics Ask-Wallach topics AND two ORAC search-polish fixes. NEXT is the product-ORAC portion — Luneth sends full specs/notes at the next genesis. Do NOT start product-ORAC without his notes.

## ✅ SHIPPED THIS SESSION (2026-07-24)
- **Detox & Microplastics topics** (commit 1d547fb1, kv=389): 6 new search-only claims (DDDL-000126/127, IMMORT-000265/266, LETS-000489/490) — Wallach's xenobiotic/detox framework, routed so any plastics/microplastics question returns a real, honest answer flagged as NOT-about-plastics. Microplastics topic (routes microplastics/nanoplastics/plastics/xenobiotic) + Detox & Heavy Metals topic (5 claims grouped by family). LPD source de-hyphenated (colloidal×4/organic×1/treatment×4) via safe_write→resnap. Detail: build-log + Creator's Log.
- **ORAC ranking fix** (commit pending, kv=390): 'highest antioxidant food' was surfacing a weight-loss WARNING as the top answer; tagged the two ORAC food-ranking claims (IMMORT-000240, HELLS-000014) with 'antioxidants' so they now rank above it (21/20 vs warning 19). A DATA fix in search-enrichment.json, not a scoreClaim code change (ORAC IS antioxidant capacity).
- **Great white sharks quote** (kv=390): mined Roy Walford's 'great white sharks in the biochemical sea' free-radical metaphor (immortality.txt:1896-1899) as WAL-CLM-IMMORT-000267 (kind=quote, subject=free_radicals, also_about orac/antioxidants). Wins 'free radicals' + the literal 'great white sharks'; shows on the ORAC page.

## ▶ NEXT — product-ORAC (Luneth's notes incoming)
1. **★ Product-ORAC scores** — Luneth has the full specs/list for how he wants ORAC scores on Youngevity products implemented; he sends them at the next genesis. Only Beyond Tangy Tangerine currently states an ORAC score. **DO NOT begin without his notes.** This is the immediate next task.
2. **Ask-Wallach enrichment** (★★★ the elevated ongoing mission — memory mining-serves-ask-wallach): enrich the biggest, most-searched entities so any plausible question returns a real Wallach answer.
3. **8 orphan related-pill slugs** (digestion, epigenetics, margarine, ph, poultry, silicon, villi, wheat) — Explore-topic mining candidates.

## 🔎 FYI (carried — ORAC cite fallbacks)
- Reach caption + payoff cite render book-level "Immortality (2008)" (those claims locate by screenshot / have no page locator). Luneth aware/accepted.
- Forces copy says "toward the 150" per the demo; Wallach's stated max is 200 (IMMORT-000260). Luneth aware.

## 🔧 MECHANICS — load-bearing
- **Search layer:** hand-author `eden/catalog/search-entities.json` (entities: display_name/type/synonyms/related) + `eden/corpus/search-enrichment.json` (per-claim subject/facet/question/answer_short/topics, keyed by claim id) → `build_embeds.py` regenerates `dashboard/assets/data/search/search-index.json` → `search_index_wellformed` gates. Enrichment is NOT sealed (search source layer); the base CLAIM is sealed. subject + also_about must resolve to a registered entity (or canon). facet ∈ the closed taxonomy.
- **Mining:** `corpus_extract.py finalize --book <b> --raw <raw.json>` snaps each verbatim to exact book bytes (tolerates line-wraps + curly quotes) + assigns a WAL-CLM id → draft; `corpus_seal.py` (USER-authorizable, bare run, no args) promotes draft→shard + re-derives indices + reseals goldens + runs corpus_verify. `build_embeds.py` regenerates all 14 derived artifacts. Creator's-Log embed inlines at BUILD → re-inline AFTER logging.
- **Source de-hyphenation (sealed book):** safe_write must write LF (it round-trips via read_text; CRLF content fails its verify) → read .txt universal-newline, replace on LF, safe_rewrite; `corpus_resnap.py --write` heals offsets + book hash (0 broken if no sealed verbatim crosses the edited span), then re-finalize the affected draft claims clean. Reseal (user).
- **Ranking is deterministic** (`state/search.ts::scoreClaim`: per token — question 6 / subject 5 / topics 4 / answer_short 3 / answer+verbatim 1; +3 whole-query subject match). Verify a ranking fix by recomputing scores over `search-index.json` in Python — the file:// browser preview CACHES the old bundle, so a stale browser is NOT evidence a fix failed.
- Every project-file write via `safe_write` (LF payloads).

## 🔴 STILL DEFERRED (carried)
- testosterone→strength (mining gap). design-system.css stale reduced-motion comment (needs a per-file seal green light).

## 🔴🔴 REVIEW PROCESS (every corpus/content touch): show each claim in EXACT final form (Q→short→[full if it adds]→quote), Luneth approves the CLAIM. **Short-only collapse is a defect** — ~90% of claims carry BOTH a short AND a full answer (memory claim-summary-verbatim-format). `corpus_seal` is USER-authorizable. Visual/UX work ENDS at a STOP for Luneth's sign-off.
