# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-13, end of session)

> ★★★ THIS FILE + the memory files OVERRIDE ALL OLDER BLUEPRINT / PLAN NOTES ("older loses"). Board **62/62**, knowledge_version **331** (bumped this session by the food-mining seals). This session SHIPPED the Absorption diet food-mining + the tab's visual pass — committed + pushed (**171e3af9**). **Luneth is REVIEWING it now** and will likely bring follow-up tweaks.
>
> This file is the **temporary** rolling handoff (current state + what's next); DURABLE principles live in the memory files (read at genesis), NOT here.

## ★★★★ WHAT JUST SHIPPED (2026-07-13 · commit 171e3af9)
The Absorption tab (`views/knowledge-foods.ts`, Knowledge drawer 6th tab, id `foods`) is now a persuasive landing backed by REAL mined food claims.
- **Hell's Kitchen added as sealed book #7** — `book_id` **hells-kitchen** ("Causes, Prevention and Cure of Obesity, Diabetes and Metabolic Syndrome", 3rd ed Jan 2015, Wallach + Ma Lan). Registered in `books-meta.json` + `eden/tools/mining-coverage.json` (incomplete, food-topic vein). Source = `eden/corpus/books/hk.txt` (Internet-Archive scan; page markers "HELLS KITCHEN NNN"; locator chapter_page). **Only lightly mined** (food topics), NOT a full mine.
- **56 new sealed search claims** (kv 328→331 over 4 seal cycles) for butter/beef/chicken/pork/eggs/fish across all 7 books + **7 new search-entities** (butter/beef/chicken/pork/fish + **salmon/tuna** as thin Explore topics). Enrichment in `eden/corpus/search-enrichment.json`; entities in `eden/catalog/search-entities.json`. Butter dual-homes to arteriosclerosis/atherosclerosis/stroke/xerophthalmia/cerebrovascular/rickets + vit A/D/K.
- **"Put these in" cards** = Butter · Beef · Chicken · Pork · Eggs · Salt (`dashboard/assets/data/foods-curation.json` `eat[]`); the generic "Meat & Animal Foods (3–6×/day)" card is **RETIRED** (`meat` survives as an umbrella topic only). `state/foods-curation.ts` `foodsEat()` now leads with the **stance** facet (never a dose) and caps the card `why` to a ~200-char **`teaser()`** — the full answer lives on the linked topic page.
- **Visual pass done**: static blue **THE FIRST STEP** in the FIG-01 mono (the Fantocrypt alien-flavour shimmer is SCRAPPED — `views/alien-flavor.ts` + `Fantocrypt.ttf` + the @font-face DELETED); villi pull-quote +spacing (space-5→space-7) + larger font; contrast **"03"** numbered header (last FIG-NN kicker + dead `secKicker`/CSS retired); "THE PREMISE" aligned to the 02/03 kicker column (136px) with a left rule; 01 hero lifted 10px.
- **Quality pass** (Luneth flagged terse/AI-shorthand summaries): 16 summaries redone with source-VERIFIED numbers (Okinawa 78/86 + 5/10,000, Amish 4%/6%, rickets +400%, CF 1-in-2,500); numerals-over-spelled-words sweep; **3 removed** — beef-7 (verbatim was Wallach QUOTING vegetarian author Ellen Buchman Ewald, not his view — caught by a misattribution scan; see [[verbatim-can-misattribute-third-party]]), pork-9 (empty), eggs-7 (literal "Breakfast should always be eaten" — see [[no-endorse-morning-eating]]).

## ★ AWAITING LUNETH'S REVIEW (do NOT re-litigate; wait for his notes)
- He is reviewing the shipped work now. ONE thing he asked to sanity-check: the **~200-char card `teaser()` cap** (`state/foods-curation.ts`) — tune if he wants cards longer/shorter.
- The **topic pages** (butter/beef/chicken/pork/eggs/fish/salmon/tuna) now carry the full rich summaries — a card → topic click shows the payoff.
- Expect follow-up tweaks to the Absorption cards / topic-page summaries; apply his notes, don't assume.

## ★ NEXT — Absorption/diet follow-ups + deferred purification
1. **HK txt de-hyphenation** — the mined HK (+ a few other-book) spans keep OCR line-wrap hyphens in stored verbatims (e.g. "car- bohydrate", "symp- tom", "un- processed"). Deferred source-purification: correct the .txt in-span → `corpus_resnap` → USER-authorized reseal. [[dehyphenation-reflow-method]] [[book-source-purification-campaign]].
2. **Salmon/tuna** stay thin Explore topics (Wallach lacks prep/sourcing specifics — no wild/farmed, smoked/frozen, albacore/light). Fine as-is unless Luneth pastes more source.
3. Bulk-enrich the ~180 on-theme diet claims into the food entities (no new seal).

## ★ BACKLOG (still valid, unchanged by this session)
- **Part A — persistent absorption caveat** across Coverage / Essentials / entity pages (ONE great pointer; restraint [[persuade-dont-shove-restraint]]).
- **Coverage-tab OVERHAUL** to Knowledge-tab quality; fix the 2 fake coverage numbers (goal-card proportional fake + regimen-slot hardcoded literals). In scope (Luneth 2026-07-12).
- **Content pass (reseal):** poached-eggs EPIGEN-000155 missing-outcome + a diet-vein OUTCOME AUDIT ([[state-the-outcome-when-known]]); normalise `--`→`—` dashes in diet `answer_short`s.
- **THEN resume Phase-H** (entity-page + Search overhaul) per `chronicle/OVERHAUL-BLUEPRINT.md`.
- Trace/rare small owed (therapeutic-note seal · Cal Toddy label · Group-B factor) — 2026-07-12, still valid.
- THREAD 2: Search G-7 + book mining — **SEAL the 2 still-unsealed search files** (`search-enrichment.json` + `catalog/search-entities.json` are edited-but-not-golden-sealed); resume Immortality A-Z at Mn-Manganese; charged-treatise capture; lay-topic tagging; port the P2 CHARGED gate.

## ★ KEY DOCTRINE (memory files are authoritative — read at genesis)
- Design bar + HOW: [[visual-design-bar-and-principles]] (mesh art+UX; fill negative space PURPOSEFULLY; NO L-brackets; numbered demo headers). Reference = `dashboard/components/trace-mineral-tile-detail.html` (translate GOOD design → clean code, NEVER copy).
- [[accent-text-fills-space]] — accent text FILLS negative space; content rides alongside, NEVER pushed to a separate line.
- [[narrate-named-steps]] — announce named file/step actions AS you do them.
- Verify visually every chunk — screenshot + LOOK ([[screenshot-verify-visual-chunks]]); Luneth is the sign-off gate.
- Round-close: build → invariants → probe → build-log → Creator's Log → **rebuild** → commit + push ([[creators-log-append-gotchas]] [[log-embed-build-inline]]).
