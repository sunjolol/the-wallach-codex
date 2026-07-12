# Next chunk — ★ PHASE H · Knowledge + Search overhaul · AUTHORITATIVE HANDOFF (2026-07-11)

**★★ THIS FILE + the memory files OVERRIDE ALL OLDER BLUEPRINT / PLAN NOTES.** If anything in `OVERHAUL-BLUEPRINT.md`, `phase-h-migration-blueprint.md`, `entity-page-redesign-blueprint.md`, or older next-chunk text conflicts with what's below, **THIS wins** ("older loses" — CLAUDE.md). Before touching the drawer, read this + memory **[[demo-vision-not-letter]]** + **[[search-is-ask-wallach-popup]]** (both load every session).

## ★ THE GOVERNING DOCTRINE — how to work (non-negotiable; Luneth reset this 2026-07-11)
- The demo `temporary/knowledge-drawer-prototype.html` is the intended **DESIGN / VISION ONLY**. Its code is **deliberately messy — NEVER copy its code, data, or prose.** RE-CREATE every part with pristine modern TS on **REAL data**.
- **NEVER reuse an OLD app component to fill a gap** (no `renderIntakeMeter` / `renderEssentialSources` / `renderWhyThisNumber` / `kd-meter` / `kd-source` / old claim primitives). If the demo doesn't specify something, or you're unsure, **STOP and ASK Luneth** — do not guess, do not reach for old code.
- **Prose is machine-contained** (`view-copy.json` via `ui()`; gated by `prose_contained` + `views_no_inline_prose`). It must be IMPOSSIBLE for prose to leak. The ONLY prose is the short, reviewed entity-summary lede.
- **PROVE everything** — grep / invariant / rendered screenshot. Luneth cannot take Claude's word; never assert "it matches / it's done" without proof.
- **Luneth is the visual sign-off gate.** Build ONE small chunk → build + invariants + probe → **render + show him** → get his eyes → THEN continue. Never chain past a stop. Then round-close (build-log + Creator's Log + rebuild + commit + push).
- **Canonical demo = ONLY `temporary/knowledge-drawer-prototype.html`** (950px, 5 tabs). The decoys (`essential-page-prototype` / `condition-page-prototype` / `browse-shell-prototype`) are QUARANTINED in `temporary/_superseded/` — do NOT read them.

## ★ THE ARCHITECTURE — the redesign (current; overrides older notes)
- "Search" → **"Ask Wallach" = a search POPUP ONLY** (holds no entity pages).
- The **Knowledge drawer holds ALL entity pages** — essentials, conditions, AND topics / concepts / elements / substances / people. A topic/entity click opens IN the Knowledge drawer (**NOT** cross-surface to a Search drawer — that old recommendation is RETIRED).
- The **Explore tab is the new home for today's search topics**; the search-index topic data migrates into the Knowledge drawer.
- Hero "sourced claims" count = **1,259** (full corpus); all 1,259 get wired into search over time (a goal, not an overstatement).
- Drawer = **950px** (900 / 520 / 420 all RETIRED). Tabs = **Home · Essentials · Conditions · Explore · Products** — a compact centered **PILL** menu, **label-only** (no count sub-lines), **Home default**, **close reopens Home**. **Corpus + Doctrine are DROPPED as front-facing tabs** (their book/doctrine DATA stays back-end for citations; `doctrine-data.json` is PARKED, not deleted — it's manifest-tracked).

## ★ CURRENT STATE (2026-07-12) — board 61/61, all clean
**Chunk 1 — DONE + committed (`22f12a34`) + signed-off:** drawer 950px; compact `.kd-knh` pill header (Home·Essentials·Conditions·Explore·Products, label-only, Corpus/Doctrine dropped as tabs); best-sources best-value fix.
**Chunk 2 — DONE + signed-off (2026-07-12):** the Home HERO, re-created from the demo on real data.
- Headline + subcopy with LIVE counts (1,259 claims · 6 books · 506 conditions; counts = `{tokens}` in `view-copy.json`, substituted in-view). Curated placeholder kept as-is.
- **Working live-suggest** (`renderHomeSuggestions`, `views/knowledge-home.ts`): type → grouped Essentials/Conditions results (best-match-first, capped 10, first-active), ↑/↓ + Enter + Esc + click-outside; dot colour via `[data-kd-essential]`/`[data-kd-condition]` (no colour literal). New `state/entity-page.ts` accessors `listEssentialPages`/`listConditionPages` over entity-page-data.
- `views/knowledge.ts`: delegated input+keydown for `.kh-search` (panel-only repaint keeps focus); `data-kd-essential/-condition` clicks now switch to their tab (mirrors the product branch) → hero results + cross-link pills open the entity page.
- 4 hint chips (Calcium · Arthritis · Selenium · Depression, all navigable; demo 'mercury' topic dropped, vitamin-d→selenium pending friendly names). "1 claim"/"N claims" singular rule applied.
- Verified: build 0 · invariants 61/61 · both render probes PASS · 0 page errors · screenshots + Luneth sign-off.

## ★ HOME-PAGE PHILOSOPHY (Luneth 2026-07-11 — governs chunks 3-5; memory [[home-page-curation-philosophy]])
Home is a SPECIAL curated "enticing" surface. Curated (hand-tuned, allowed): search placeholder · suggested-topic chips (placeholder now → top-5 topics by entries eventually) · Explore preview list (Luneth hand-picks; keep the demo's). Everything else = PURE FORMULA: Home "essentials"/"conditions" previews = most→least claims; Essentials tab = by category; Explore tab = **alphabetical grouped by category** (demo was random); Products = most→least coverage + a **NEW alphabetical-sort option**. Curation is NOT a prose-leak excuse.

## ★ NEXT — foundational display-name fix, THEN Home shelves (each ends in a Luneth visual STOP + round-close)
- **NEXT (foundational, app-wide) — human-friendly display names.** Vitamins store the SCIENTIFIC name as `display_name` (Cholecalciferol/Retinol/Ascorbic Acid/Cobalamin); Luneth wants the FRIENDLY form ("Vitamin D") front-facing EVERYWHERE (hero, shelves, entity-page H1, search), with the scientific name in the click-into detail view (progressive disclosure — simple first). Investigate the source (`layout_key` carries "Vitamin D (…)"; essentials-canon may need a friendly field). Land this BEFORE the essentials shelf so it displays correctly. Fold in app-wide "1 claim" pluralization. See memory [[synonyms-internal-display-human]].
- **Chunk 3 — Home "The essentials" shelf:** top-18 essentials by claim count (FORMULA, real data) + category colour legend; tile → the essential's page. Do NOT add to the demo's structure.
- **Chunk 4 — Home "Common conditions" + "Explore" preview:** top-8 conditions by claim count (formula) + the curated Explore topic-chip cloud (Luneth's hand-picked list); wire nav (conditions navigate today; topics await topic entity-pages).
- **Chunk 5 — the Explore tab:** `renderExploreTab()` — type-groups over `exploreEntities()`, **alphabetical within each category**; chip → that entity's page in the Knowledge drawer (needs topic entity-pages).

Re-derive each section's structure from the DEMO (`vHome`/`vExplore` in the canonical demo) — that is the source of truth. Reading: memory [[demo-vision-not-letter]] · [[search-is-ask-wallach-popup]] · [[entity-page-redesign-demo-phase]]; `.claude/rules/visual-verification.md`.

## ★ IGNORE THESE OLD NOTES (RETIRED — do NOT act on them)
- ❌ "best sources show **6** products, not 5" / "the demo shows 6" — **FABRICATED.** The demo shows **5**; the live matches it. Count is per the demo, confirmed by Luneth.
- ❌ "REUSE `renderIntakeMeter` / `renderEssentialSources` / `renderWhyThisNumber`", "PORT the claim primitives", "two claim renderers" — **retired** (that is reusing old components; RE-CREATE from the demo on real data).
- ❌ "cross-surface to the Search drawer" for a topic click — **retired** (topic pages live IN the Knowledge drawer).
- ❌ "**900px**" / "520px" / "420px" drawer — **retired** (it is **950px**).
- ❌ old tab set (**Corpus · … · Doctrine**) — **retired** (see the architecture above).
- ❌ "`essential-page-prototype.html`" / "`browse-shell-prototype.html`" as "the demo" — **retired** (quarantined; the ONLY demo is `knowledge-drawer-prototype.html`).
- ❌ the "H2 chunk 1b WIP / open issues" framing that used to head this file — **superseded** (the essential entity page shipped; the drawer rebuild is the live work). The H0/H1/mis-tag history is preserved in git + the Creator's Log, not here.

## THREAD 2 (QUEUED — a SEPARATE workstream from the drawer build) — Search G-7 + book mining
knowledge_version 322 · 1259 sealed claims · board 61/61. Search G-7 migration COMPLETE (56 entities / 198 enriched claims). Outstanding, in order:
1. **SEAL** the 2 search source files — `eden/corpus/search-enrichment.json` + `eden/catalog/search-entities.json` (stable now).
2. **Resume mining search-first** from Immortality element A-Z at **Mn-Manganese** (per `.claude/rules/search-corpus.md`).
3. **Cross-book capture** the wrongly-skipped charged treatises + more Quackbusters material (capture ALL books; newest-wins = CONTRADICTION-handling only; run charged content past Luneth).
4. **General-interest lay topics** (men's-health / strength / testosterone) with lay synonyms — the ranking machinery is ready, it needs the tagged data. [[general-interest-lay-topic-tagging]].
5. **Charged-search-gate:** homosexuality/intersex NEVER in search unless the query explicitly names them; Explore-tab only. PORT the P2 `CHARGED` gate to the real search build + backfill synonyms. [[charged-search-gate]].

## ★ KEY REMINDERS
- **Round-close** ([[creators-log-append-gotchas]]): Creator's Log `--summary` capped 280; pass args via `"$(cat file)"`; the log embed bakes into `dist/main.js` at BUILD time → **log → rebuild → commit** or the in-app log goes stale.
- **safe_write** ([[safe-write-crlf-flip]]): edit ONE file many times → read once + apply all in memory + write once; payloads LF.
- **Authoritative doctrine** = memory [[demo-vision-not-letter]] + [[search-is-ask-wallach-popup]] (load every session) + THIS file. Design record: `chronicle/entity-page-redesign-blueprint.md`. Migration: `chronicle/phase-h-migration-blueprint.md` (its PHILOSOPHY is current; its §4/H2 BUILD notes are SUPERSEDED — see "IGNORE" above). Master index: `chronicle/OVERHAUL-BLUEPRINT.md`.
