# Next chunk — ★ UI-REDESIGN DEMO PHASE active · D1+D2 signed off · RESUME AT D3 · (search-seal + mining queued behind it)

**★ CURRENT STATE (2026-07-10) — two live threads.**

## THREAD 1 (ACTIVE) — Entity-Page Redesign demo phase
**★ READ FIRST for this work: `chronicle/entity-page-redesign-blueprint.md`** — the demo-phase blueprint (vision + every decision + the colour language; separate from the master OVERHAUL-BLUEPRINT, feeds its Phase H).

The vision: **one presentation unit — the entity page — for every subject.** Search's delightful format (quick answer → operational card → colour-coded faceted claims → progressive disclosure → branching) generalized to essentials + conditions. Search = the front door; tabs = curated browse rooms into the same pages; the flat claims-dump is gone (claims tuck inside each page's "full record").

**Done + SIGNED OFF:** **D1 — Essential page (Calcium)** + **D2 — Condition page (Osteoporosis, help-first)**. Prototypes (self-contained, real app CSS + `.sr-*` classes + real data, gitignored) live in **`temporary/essential-page-prototype.html`** + **`temporary/condition-page-prototype.html`** — reopen from `file://`.

**Colour language (LOCKED):** teal=science · orange=Wallach's positions (reserved, sparse) · green=what-to-do · amber=signs · violet=story/lore · red=cautions. Pills: conditions=orange · nutrients=green · explore=violet. Orange TEXT = deep (`--ds-accent-deep`), never bright; opened cards keep their own family colour.

**RESUME AT D3** — the browse + navigation shell (search front-door + curated storefront + moving between pages; proves it coheres into one app). Then **D4** (Coverage dashboard) → **D5** (Product page, optional) → **unified master blueprint** → **build (Phase H)**. Sign off each demo before advancing (visual-verification gate). Deferred follow-ups are in the blueprint §10 (loose-claim cleanup pass, product-DB wiring, coverage math, claim-badge-on-statements).

## THREAD 2 (QUEUED) — Search G-7 + book mining
**knowledge_version 320 · 1246 sealed claims · board 53/53 green.** Search G-7 migration is COMPLETE (56 entities / 198 enriched claims; batch 9 = the charged cluster, landed + committed `e632b204`). Outstanding, in order:
1. **SEAL the 2 search source files** — `eden/corpus/search-enrichment.json` + `eden/catalog/search-entities.json` (now stable). Add index sharding if large.
2. **Resume mining search-first** from Immortality element A-Z at **Mn-Manganese**, full taxonomy per `.claude/rules/search-corpus.md`.
3. **Cross-book capture** the wrongly-skipped older homosexuality/intersex treatises (Rare Earths Ch7 + DDDL + IMMORT-000020) + MORE Quackbusters/medical-freedom material — per the CORRECTED doctrine (capture ALL books; newest-wins is CONTRADICTION-handling ONLY; run charged content past Luneth). The "newest-book-only capture" rule was PURGED 2026-07-10.

## ★ KEY REMINDERS
- **Round-close gotchas** ([[creators-log-append-gotchas]]): Creator's Log `--summary` HARD-capped 280; pass args via `"$(cat file)"` WITHOUT escaping inner quotes; remove any botched empty tail before commit. Log embed bakes into `dist/main.js` at BUILD time — log → rebuild → commit or Profile goes stale.
- safe_write scripting: edit ONE file multiple times → read once + apply all + write once ([[safe-write-crlf-flip]]).
- Prototypes reuse the app's REAL stylesheets + `.sr-*` classes so cohesion is structural; new bits use an `ep-*` namespace + tokens only.

## The doctrine (AUTHORITATIVE)
- Redesign: `chronicle/entity-page-redesign-blueprint.md`.
- Search: `.claude/rules/search-corpus.md` · `chronicle/search-build-blueprint.md` · `chronicle/search-corpus-plan.md`.
- Master plan: `chronicle/OVERHAUL-BLUEPRINT.md` (redesign = Phase H design spine; mining = Phase G).

## Gates + tooling (all LIVE, board 53/53)
`derived_artifacts_fresh` (covers search-index.json) · `search_index_wellformed` + negative test `tools/test_search_index_wellformed.py` · `render_probe_search.js`. The redesign demos are gitignored `temporary/` prototypes — they touch NO pillar, artifact, or app code, so the board is unaffected by them.

## The paused mining roadmap (blueprint §7)
G-4 finish Immortality (resume Mn-Manganese) · G-5 DDDL re-mine · G-6 the 3 new books · **G-7 Search build = migration COMPLETE (seal pending)** · G-8 close-out + seal. Phases H (app completion — now getting its design spine via this redesign) + I (design) after.
