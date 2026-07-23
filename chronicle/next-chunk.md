# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-23, Ask-Wallach DESIGN signed off)
# ★★★★★ 2026-07-23 — Ask-Wallach REDESIGN fully designed + Luneth-signed-off (opening screen + results view). Board 77/77. NO app code changed this session (design-only; the mockups are gitignored temporary/). ▶ NEXT SESSION = BUILD IT LIVE.
# The old "Ask-Wallach WORDING only" handoff is SUPERSEDED — Luneth expanded it into a full search revamp (fonts + colour-coding + delight). Mining still PAUSED.

## ▶ NEXT — BUILD the Ask-Wallach redesign live (a real CODE chunk → full round-close: build → invariants → render_probe → build-log → creators-log → re-inline build → commit)

### THE SPEC LIVES IN 2 SIGNED-OFF MOCKUPS (gitignored, on disk — READ THEM FIRST; they carry the exact CSS values):
- `temporary/ask-wallach-B-refined.html` — the OPENING screen (Direction B, "Browse by kind"): green chrome + neumorphic search bar.
- `temporary/ask-wallach-results-demo.html` — the RESULTS view (3 result types).
- (`temporary/ask-wallach-opening-brainstorm.html` — the 4 opening directions Luneth picked B from; A/C/D are the rejected alts.)

### FORM: a centered command-palette POPUP, green-coded — NOT the current left slide-in drawer.
  ⚠ The shipped surface today is the `.sr-*` slide-in-from-left drawer (views/search.ts + drawer-search.css). The signed-off design is a centered popup. This is a REBUILD of the surface, not a restyle. (memory search-is-ask-wallach-popup: "Ask Wallach = popup; drawer = all pages".)

### KEY DESIGN DECISIONS (all realised in the mockups):
- GREEN CHROME — Ask-Wallach's brand colour = `--fam-action` #5aa82c (the demo's green, `--aw-green`):
  - "Ask Wallach" title CENTERED, "Wallach" word green.
  - top border = `linear-gradient(90deg, transparent, #5aa82c 20%, #5aa82c 80%, transparent)` (solid centre, faded both edges — copies the demo `.ap::before`).
  - popup: faint green ring + green-tinted drop shadow.
- NEUMORPHIC SEARCH BAR (adapted from design-wisdom ref #007 = soft-UI; NOT the ref's grey/near-black — cream + green, smaller):
  - raised cream card: `box-shadow: 6px 6px 16px rgba(150,126,84,.28), -6px -6px 14px rgba(255,252,244,.92), 0 0 22px -4px rgba(90,168,44,.20)`; inset input well: `inset 5px 5px 11px -6px rgba(150,126,84,.48), inset -5px -5px 11px -6px rgba(255,252,244,.95)`.
  - :focus-within → green glow INTENSIFIES (`0 0 34px -2px rgba(90,168,44,.45)` + a 1.5px green ring).
  - green CIRCLE search button on the RIGHT (`border-radius:50%`, gradient #6cbb3a→#4a8f24, white magnifier).
  - input = Chakra Petch (`--ds-font-display-interface`), **1.1rem, weight 500** (NOT bold when typed). Placeholder "Ask about a nutrient, food, condition, or symptom…".
- COLOUR = FACET FAMILY (the 13→5 map ALREADY design-signed-off on the kd-ep-facet entity pages — reuse, don't reinvent):
  science(mechanism/basics/sources/physiology)=#2f9dba · action(protocol/uses)=#5aa82c · stance(stance/big_question)=`--ds-accent` #ff7e3c · signs(warning)=#d69a24 · story(history/discovery/biography/etymology)=#8a52d6.
  TOPIC/entity cards colour by entity TYPE: element/nutrient=#2f9dba · condition=#a83f48 · concept=#8a52d6 · substance(food)=#bd7b34 · topic=#5f7599.
  ⚠ `--fam-*` are scoped to `#drawer-knowledge-mount` today — REDECLARE `--fam-*` (+ `--aw-green`) on the search-popup root, or the tokens resolve empty.
- OPENING (B) = "Browse by kind": 5 facet-family cards (left colour-rail, Unbounded name, mono facet list, faded Unbounded ghost count in family colour). Real counts: **Science 137 · What To Do 53 · Wallach's Take 44 · Cautions 36 · The Story 51**.
- RESULTS — 3 types:
  1. QUESTION query → **best-answer card** (facet-coloured left bar + facet pill + question[Chakra Petch] + answer_short[Space Grotesk, facet-deep colour] + answer body + PLAYFAIR verbatim pull-quote (the ONE serif; "— Dr. Wallach, in his own words" attr; NO book cite) + related pills[type-coloured]) → "More answers" collapsible `.arow` rows (facet pill + question + 2-line preview → expand to answer + verbatim) → "Keep exploring" topic ghost-number card.
  2. EXACT topic name → jump STRAIGHT to the TOPIC PAGE (exact-match-first): entity hero (type-coloured symbol tile + Unbounded name + "TYPE · N answers" + back) → facet GROUPS (coloured label + count pill + hairline + `.arow` rows; "+N more" on big groups).
  3. NO match → "Nothing on that yet" + real suggestion chips (facet/type coloured) — never a bare "no results".
- BOOK SOURCING STAYS SILENT everywhere: NO titles / years / counts. Verbatims ARE shown (real corpus text), attributed to "Dr. Wallach" (the person, not the book). This is WHY we removed the book claim-counts. (memory the-field-shows-gaps / front-facing-human-first.)
- ⚠ ANTI-FAKERY (§00.A): EVERY verbatim shown must be the REAL corpus text — never a placeholder quote. (I caught + replaced 2 fabricated quotes in the results mockup before sign-off; pull the real verbatim from search-index.json or omit it. memory outside-knowledge-injected-as-wallach + say-unreadable-never-guess.)

### RANKING / MATCHING (dashboard/assets/js/src/state/search.ts):
- KEEP entity-exact-first: `entityHit` (exact slug OR display_name OR synonym match) already routes mode:'entity' → the topic page BEFORE `ask()` — that IS the exact-match-first behaviour; VERIFY it still fires for "mercury"/"calcium"/"diabetes".
- UPGRADE `scoreClaim` from whole-substring `.includes(q)` to TOKEN-based: tokenize the query, drop stopwords, score per token over question(+6)/subject(+5)/topics(+4)/answer_short(+3)/answer(+1)/verbatim(+1); sum. Real plain-language questions ("why are fried eggs bad") then rank properly. Still 100% OFFLINE string matching, NO LLM (blueprint §6).

### TARGET FILES:
- `dashboard/assets/js/src/views/search.ts` — render → the new popup + 3 result types.
- `dashboard/assets/styles/drawer-search.css` — rewrite `sr-*` → new green-chrome + neumorphic + facet-coloured vocabulary (aw-* namespace, rooted at the popup mount).
- `dashboard/assets/js/src/state/search.ts` — token ranking; keep entity-exact-first.
- maybe `dashboard/assets/js/src/core/schemas/search.ts` — the facet→family map + FACET_ORDER.
- `dashboard/assets/js/src/main.ts` — topbar "Ask Wallach" + rail 's' already `toggleDrawer('search')`; surface is a centered popup now → check mount/positioning + close-on-scrim.
- `tools/render_probe_search.js` — ADD it (currently a WISH per search-corpus.md): assert the popup opens, a query renders a best-answer, an exact topic jumps to its page, empty state shows.

### BUILD DISCIPLINE:
- SMALL visual chunks, VISUAL SIGN-OFF each (Luneth is the tester); MEASURE / headless screenshot (scratchpad shot.js), never eyeball. memory screenshot-verify-visual-chunks + measured-change-not-extremes.
- The CURRENT card vocabulary IS the bar (Unbounded names, mono micro labels, Bruno Ace numbers, cream `paper-light` cards, ghost numbers) — the Conditions/Products tabs + brainstorm files. Do NOT reach for retired v3 primitives (the dark `ds-pull-stat` panel, chip-strips) — that was this session's first-attempt miss. memory demo-layout-yes-demo-style-no.
- ⚠ Any standalone mockup linking workspace-coverage.css inherits `html,body{height:100%;overflow:hidden}` (the app-shell lock) → add `html,body{height:auto;overflow:visible}`; a puppeteer `fullPage` shot HIDES scroll-lock (verify scroll behaviour explicitly). memory standalone-page-scroll-lock.

## ⏸ PARKED — Batch-4 book mining (resume only if Luneth redirects): re-dedup each teal-new candidate vs ALL 7 sealed books first (memory dedup-across-all-books-before-authoring). Byte-verified passages in temporary/plant-derived-research-2026-07-17/.

## 🔴🔴 REVIEW PROCESS — Luneth's hard rule (EVERY corpus/content touch): before sealing ANY claim show it in EXACT final form — QUESTION → SHORT ANSWER → (full only if it adds) → QUOTE — and approve the CLAIM, never a side-question. Unreviewed = log "unreviewed", never "approved". corpus_seal is USER-ONLY.

## 🔧 KEY MECHANICS
- Preview pane CACHES the bundle — for a reliable visual use a headless puppeteer screenshot (scratchpad shot.js): fresh chrome loads current dist + CSS; DISMISS the onboarding modal ("just browsing") first if driving the real app, then screenshot. Element-screenshot the target node to crop.
- CSS is LINKED not bundled — CSS edits need NO rebuild; JS/data edits need `node tools/build.mjs`. The Creator's-Log embed inlines at BUILD time → re-inline AFTER appending a log entry.
- Curation-layer pattern: `assets/data/*.json` (hand-authored) + `core/schemas/*.ts` (+ index export) + `state/*.ts` reader + MANIFEST `accounted` entry.
- Round-close: build → invariants → probe → build-log → `creators_log.py append` (--summary ≤280) → RE-inline build → commit + push.
- Windows/UTF-8: prefix `PYTHONUTF8=1`; every project write via `safe_write` (LF payloads; multi-edit → a Python driver of `safe_replace`/`safe_rewrite`; `safe_replace` asserts count==1). NEVER bare `cd subdir` (drifts cwd → cwd-relative hooks fail; recover with PowerShell Set-Location).
