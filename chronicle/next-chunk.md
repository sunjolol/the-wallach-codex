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

## ★ CURRENT STATE (2026-07-11) — board 61/61, all clean
**Chunk 1 — DONE + committed (`22f12a34`) + Luneth-signed-off:**
- Drawer width → **950px**.
- Menu re-created to match the demo: a compact **`.kd-knh`** header (`❡ KNOWLEDGE · [Home·Essentials·Conditions·Explore·Products] pill group · ×`), replacing the old big-title + wrapping 4-column tab grid. Label-only. Corpus/Doctrine removed as tabs.
- Best-sources best-value fix (`views/entity-page.ts`): the cheapest-per-unit product is always swapped into the visible top-5 (demo parity).
- New files: `views/knowledge-home.ts` + `views/knowledge-explore.ts` (tab shells; `exploreEntities()` = `entityList()` minus nutrient/condition).
- Verified: build 0 · invariants 61/61 · `render_probe_knowledge` PASS · `render_probe_entity` PASS · 0 page errors.

## ★ NEXT — chunk 2+: Home + Explore tab CONTENT (each ends in a Luneth visual STOP + round-close)
Build the Home body (`renderHomeTab()` in `views/knowledge-home.ts`) to match the demo's `vHome` vision, one section at a time:
- **Chunk 2 — the hero:** headline + subcopy with LIVE counts (books 6 · conditions 506 · claims 1,259) + a live-suggest search box (wire to `state/search.ts` `resolveQuery`/`entityList`) + quick-hint chips. All copy → `ui()` keys.
- **Chunk 3 — "The essentials":** top-18 tiles by claim count (add a trivial `listEssentials()` to `state/corpus.ts`, a mirror of `listConditions()`) + the category colour legend; tile → the essential's page.
- **Chunk 4 — "Common conditions" + "Explore" cloud:** top-8 conditions (`listConditions()`) + top-14 topic chips (`entityList()` topic/concept); wire nav.
- **Chunk 5 — the Explore tab:** `renderExploreTab()` — 5 type-groups over `exploreEntities()`; chip → that entity's page **in the Knowledge drawer**.

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
