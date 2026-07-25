# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-25 10:13 CDT · Search browse-by-kind SHIPPED + signed off + pushed; NEXT = Epigenetics topic mining, OR redirect)

# ★★★★★ READ FIRST: **The Ask-Wallach "Browse by kind of answer" cards are now LIVE + wired (shipped 2026-07-25).** The five opening "kind of answer" cards were dead links; each now opens a BROWSE page of the topics under that kind, with search-wide navigation (back arrow · Go Back · home-on-title · close ✕). Build OK · invariants 77/77 · render_probe_search_browse PASS · existing search probes PASS · screenshots signed off · committed + pushed. **NEXT (Luneth's prior pick): the Epigenetics topic — mine it now, small batches, his review each.** See § NEXT below; Luneth may redirect at session start.

## ✅ WHAT SHIPPED THIS SESSION (Search browse-by-kind — all verified)
- **The dead cards are wired.** Clicking a "kind of answer" card (The Science / What To Do / Wallach's Take / Cautions / The Story) opens a BROWSE page listing the TOPICS that have that kind of answer — light cards (facet micro-label + in-family count + a one-line peek), so a 159-answer family browses as ~60 short cards, never a flood of answer bodies. Clicking a topic card opens its existing full topic page.
- **Zero new cataloguing.** `state/search.ts::familyTopics(familyId)` is a pure filter-and-group over data every claim already carries (facet + subject, both gate-enforced). No new data authored; counts + peeks derive live.
- **Search-wide navigation added:** top-left round ← (steps back one page — topic→topic→browse→opening; hidden only on the pristine opening), header "‹ Go Back" (→ opening kinds), clickable "Ask Wallach" title (→ home, clears history), top-right round ✕ (close). A small nav-history stack in `views/search.ts` (pushNav/goBack/goHome/syncNav); each entry is a full page state `{query, browseFamily}` so restoring one re-renders deterministically.
- **Charged content:** browse INCLUDES homosexuality/intersex under "Wallach's Take" — **Luneth ratified 2026-07-25**, consistent with the Knowledge Explore tab which also lists them; the search charged-gate stays search-results-only (memory: charged-search-gate).
- **Files:** `state/search.ts` (+familyTopics +bridge export) · `views/search.ts` (+renderBrowse/renderBrowseCard + nav-history stack + wiring the dead data-aw-family cards + corner nav) · `styles/drawer-search.css` (.brow-* card/grid/head + corner .scr-nav circular buttons + .scr-id → button) · `tools/render_probe_search_browse.js` (NEW ~20-check probe).
- **Design call (Luneth aware):** the header "Go Back" jumps to the opening kinds while the top-left ← steps back one page — deliberately differentiated, not redundant. If he wants them unified, it is a one-line change in the click handler. Micro-labels use the app's facet labels (HOW IT WORKS / SOURCES & EXPOSURE / IN THE BODY), not raw slugs.

## ▶ NEXT, IN ORDER
1. **Epigenetics topic** — the 8th/last dead pill on `wallach.related`. Only IAIYH-000020 carries the word vs 509 book hits → NEW mining from `epigenetics.txt`. Luneth chose "mine it now, small batches, my review each." (Mining doctrine: as-needed, never-guess, his manual review gate — `.claude/rules/mining-veins.md`. Epigenetics policy — memory: epigenetics-mining-policy.)
2. **Gloss card SHORT answers** — extending glossing to `answer_short` is a system-wide visual change; its own chunk + screenshot. (Expanded-answer glossing is done.)
3. **D1 · Trim 3 claim_texts that outrun their verbatim** — LETS-000122, LETS-000259, IMMORT-000081. Re-check first: the DDDL digestion mining likely resolved most (DDDL-000128 now states the 75%; DDDL-000129 the dyspepsia framing in properly-quoted words).
4. **Book-wide `betaine HC1` → `HCl`** — real OCR artifact across both books, quoted by sealed verbatims. Its own campaign (resnap + re-quote + reseal).

## ⚠ SEARCH BROWSE — small follow-ups (none blocking, Luneth aware)
- **nav-history does NOT push per-keystroke** — typing over a page replaces it, so ← skips a typed-over page. Deliberate (avoids a history entry per character). Revisit only if it feels wrong in use.
- **Two back affordances on the browse page** — the header "Go Back" and the top-left ← both appear; they do DIFFERENT things (opening vs step-back). If it reads redundant to Luneth, drop the header one.

## ⚠ STILL SETTLED — do not re-litigate
- **betaine HCl is NOT digestive enzymes** — it is supplemental stomach ACID. Two different supplements, two different jobs. The live §04 respects this (betaine HCl sits in the acid/ladder story; pancreatic enzymes are separate). Copy must never conflate them.
- The corpus does NOT support "digestive enzymes let you handle gluten." Gluten is always a food to ELIMINATE; enzymes are separate digestive support.
- The one non-Wallach sentence Luneth once requested (enzymes *reduce the bad effects of bad foods*) was granted-then-WITHDRAWN — **no precedent, no gate built.** Full record: `chronicle/contradictions/2026-07-24-digestive-enzymes-nonwallach-sentence.md`.

## 🔧 MECHANICS — load-bearing
- **`corpus_extract finalize` is NOT additive** — it writes `draft = sealed shard + THIS run's claims`. A 2nd finalize before sealing silently DROPS the 1st batch. One finalize per seal cycle.
- **Book-text edit order:** edit `.txt` via safe_write (LF) → `corpus_resnap --write [--fix json]` → **SYNC every draft from its corrected shard** → `corpus_seal`. The seal guard (`draft_offset_failures`) blocks the failure but does not sync for you.
- **View edits need a bundle rebuild** — anything under `views/` (incl. `views/search.ts`) compiles into `dist/main.js`; CSS files are linked live (no rebuild). The round-close re-inlines the Creator's Log at build time, so rebuild AFTER `creators_log.py append`.
- **Screenshots (live SEARCH drawer):** load `dashboard/dashboard.html` via file://, dismiss the `.wc-veil` first-run modal (button matching /browsing/i), open with `.topbar__ask` click, then drive `#drawer-search-mount` (click `[data-aw-family="…"]` for browse, `.brow-card` for a topic). Live screenshots come from `tools/live_shots*.js`-style puppeteer (in scratchpad). The in-app preview renders file:// as a STATIC snapshot (JS runs once) — always drive via puppeteer. For the KNOWLEDGE drawer use `[data-rail-nav="knowledge"]` + the same veil dismiss.
- **Editing mixed line-endings:** `state/search.ts` + `drawer-search.css` are CRLF, `views/search.ts` is LF — a transformer that normalizes on read and restores each file's original endings on write is the safe pattern (scratchpad `build_browse*.py` are the templates).

## 🔴🔴 REVIEW PROCESS (unchanged)
Show EVERY mined claim in exact final form — **Q → short answer → FULL answer → quote**. Default is BOTH answers; the full answer must ADD context from the surrounding book text. `corpus_seal` is user-authorizable. Visual/UX work ENDS at a STOP for Luneth's sign-off; an unsigned surface is logged as unsigned.
