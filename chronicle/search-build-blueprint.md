# Search Subsystem — Full Build Blueprint

_Proposal for Luneth (2026-07-09). Mining is PAUSED (kept on the list at Immortality → Mn-Manganese); we pull Search (blueprint G-7 / §5.5) forward so there's a VISUAL REFERENCE to validate the info format before mining more. Interprets Luneth's intent: treat search like the Youngevity products — a structured, categorized TEMPLATE, not a wall of text per claim; future-looking, high-quality, massive-scale (folder-sharded). Faithful to the demo where it makes sense; slight evolution is expected + fine._

## 0. Why now (the pivot)
We cannot keep mining into a format Luneth can't see and steer. Build a thin, real Search slice → get visual sign-off on the info structure → then mass-migrate + resume mining. This is the gold-standard workflow (one surface to visual sign-off before the next).

## 1. What the demo gives us (the starting aesthetic)
The search UX in the v3 demo lives in the **Command Palette (⌘K)** (`command-palette-v3-PROPOSAL.html`):
- **Nav rows** (jump to workspaces), **entity rows** (products, corpus claims with `book · ch · pg`),
- an **Ask-result**: a `?`-badge **question**, an **italic serif Wallach quote** with an accent left-border, and a **mono citation** (`book · page`).
The demo's Ask = *ask a question → get one Wallach quote + cite.* We keep that aesthetic and EVOLVE it: a plain-language query resolves to either a **direct answer** (quote+cite, demo-style) OR a **structured entity page** (product-detail-style) when the query is a subject ("magnesium", "mercury"). Two modes, one surface.

## 2. The core problem to fix (the "wall of text")
Today a search claim is a blob: `claim_text` crams a plain summary AND the verbatim quote ("In his words: …"), and `verbatim` duplicates it. The only structure is `kind` + freeform `tags`. There is no **subject** and no **category** as real fields. Result: querying "mercury" would dump 13 text blobs with no organization.

**Fix = give every search claim a structured, faceted template (the products treatment).**

## 3. The data model — the structured search claim (kills the blob)
Restructure each search claim into layered, categorized fields (mirrors the product record's structure):

```
search claim
├─ id                     (WAL-CLM-…, unchanged)
├─ subject                ← the PRIMARY entity slug this is about  (mercury, cholesterol, acid_base_balance, wallach_bio, vaccines_autism)
├─ also_about[]           ← secondary entity slugs (cross-surfacing)
├─ facet                  ← ONE category from the controlled facet taxonomy (§4)
├─ question               ← the plain-language question this answers ("What is mercury?")  — powers Ask + the L3 question-inventory
├─ answer_short           ← ≤160-char one-line answer (the palette/preview line)
├─ answer                 ← modern-voice explanation, NO inline verbatim (the wall-of-text, de-blobbed)
├─ verbatim               ← Wallach's exact words (separate, byte-faithful, as today)
├─ cite                   ← composed from locator (book_id → display + page); never hand-typed
├─ topics[]               ← search-topic:* routing handles (vaccines-autism, quicksilver, …)
├─ tier1_link{}?          ← if dual-homed: the condition/essential slugs it also feeds
├─ locator / confidence / review_state …   (unchanged plumbing)
```

Key change: **`answer` no longer contains the verbatim.** `answer_short` + `answer` + `verbatim` are three distinct display layers. `subject` + `facet` make the content organizable. This is a pure superset of today's schema — old claims migrate mechanically (§8).

## 4. The two controlled vocabularies (the "template that covers every breakdown")

**A. Facet taxonomy** (the category each claim falls in — the neat breakdown, from §3 of the search-corpus plan):
`basics` · `discovery` · `etymology` · `uses` · `mechanism` (biological role) · `sources` (abundance/exposure) · `stance` (is-X-good/bad, X-causes-Y) · `big_question` (vaccines↔autism, cholesterol…) · `biography` (about-Wallach/credentials/vindication) · `history` · `warning` (toxicity/contraindication/interaction) · `physiology` (body content/levels) · `protocol` (search-side how-to).
Closed set, gated (`facet_in_taxonomy`). Extensible only by an explicit, reasoned addition.

**B. Entity registry** (`eden/catalog/search-entities.json`, a NEW small pillar-adjacent registry):
`entity slug → { display_name, type, synonyms[], related[] }`.
- **type** ∈ {`element`, `nutrient`, `substance`, `condition`, `concept`, `topic`, `person`, `event`}.
- Where an entity IS already a canon essential or a catalog condition, it **reuses** that slug (no duplication; `no_hand_duplicated_canonical` respected) — the registry only ADDS entities the catalog doesn't have (mercury, cholesterol, acid_base_balance, wallach_bio…).
- `synonyms` power retrieval + the display label stays `display_name` ([[synonyms-internal-display-human]]).
Gated: `search_entity_resolves` (every claim `subject`/`also_about` ∈ the registry or an existing catalog).

## 5. The display model (faithful-to-demo, evolved)
Two render modes on ONE Search surface + the ⌘K Ask:
- **Ask answer** (query = a question): demo's `ask-result` — question badge · `answer_short`/`answer` · italic **verbatim** quote · mono **cite**. One best claim, with "more on {subject}" → the entity page.
- **Entity page** (query = a subject): a **product-detail-style panel** for the entity. Header (display_name · type · claim-count). Then **one collapsible section per facet present** (BASICS · DISCOVERY · USES · MECHANISM · SOURCES · STANCES · BIG QUESTIONS · WARNINGS …), each listing its claims as `answer_short` rows that expand to `answer` + verbatim + cite. Cross-links: related entities, and any `tier1_link` → the operational Condition/Essential deep-dive. This is the "organized, not a wall of text" view — the same respect as the product detail panel.

## 6. Retrieval (retrieval-first, offline, deterministic — blueprint D4)
No LLM (protects "never breaks / fully portable"). Build a deterministic offline index at derive-time:
- **Index fields per claim:** subject + entity synonyms, facet, question, topics, answer_short, full-text(answer+verbatim).
- **Query flow:** normalize → (1) exact/synonym **entity** hit → entity page; (2) **question/topic** hit → Ask answer (ranked best claim); (3) full-text fallback → ranked claim list grouped by subject.
- **Ranking:** field-weighted (subject/synonym > question/topic > answer > verbatim), tie-broken by newest book + confidence.
- Templated synthesis only; a bundled small model stays a later opt-in.
- **Gate:** `corpus_runtime_purity` (zero network) — already exists.

## 7. File / folder structure (massive scale — the sharding)
`corpus-embed.json` is already 1.67 MB at 1,246 claims; a search-majority corpus (5–10k+ claims) → 10–20 MB. A single load breaks the "instant, portable" feel. So:
- **Source of truth stays per-book claim shards** (`eden/corpus/claims/claims-<book>.json`) — the mining unit is unchanged.
- **Derived, sharded search index** in a NEW folder `dashboard/assets/data/search/`:
  - `search-entities.json` — the entity registry (light: slug → display/type/synonyms/related + claim counts + shard pointer).
  - `entities/<bucket>.json` — per-entity claim bundles, **bucketed** (e.g. by first letter or by a fixed shard count) so no file is huge.
  - `ask-index.json` — a compact question/topic → claim-id map for the Ask path.
- **Lazy-load:** the Search view loads `search-entities.json` (small) on open; an entity page loads only its bucket on demand. The JS bundle never inlines the corpus (stays under the 250 KB gzip budget).
- **Derive-fresh gated:** `search_index_fresh` (regenerate from claims, byte-compare) joins the manifest, exactly like the other derived artifacts.

## 8. Migrating the existing 186 (+ enrichment)
1. **Mechanical restructure (script):** for each `search-only` claim — split `claim_text` → `answer` (drop the "In his words:" tail) + keep `verbatim`; derive `answer_short`; assign `subject` (from the element/topic tag) + `facet` (from `kind` + content heuristics, human-confirmed on ambiguous). Emits a draft for review; never silent.
2. **Entity registry seeding:** collect all subjects → author `search-entities.json` (display/type/synonyms). Reuse catalog slugs where they exist.
3. **Enrichment pass:** thin subjects (the La/Li/Lu/Mg regression) get backfilled to the element standard during this pass.
4. **Gate:** `search_claim_wellformed` (subject∈registry, facet∈taxonomy, answer present, verbatim faithful, ≥1 topic, cite composed) — like `products_verify`. Negative-tested.

## 9. Engineering principles + gates (§00.B — codify, don't promise)
| Gate | Proves | Status |
|---|---|---|
| `search_claim_wellformed` | every search claim has subject/facet/answer/verbatim/cite/topic, structured not blob | NEW |
| `facet_in_taxonomy` | facet ∈ closed set | NEW |
| `search_entity_resolves` | subject/also_about ∈ registry or catalog | NEW |
| `search_index_fresh` | derived shards == regenerated from claims (manifest) | NEW |
| `search_only_indices_excluded` | search content never leaks to operational tabs | LIVE |
| `corpus_runtime_purity` | offline, zero network | LIVE |
| render probe `render_probe_search.js` | entity page + Ask answer render, no page errors | NEW |
Prose stays contained (R4), verbatim faithful (R5), citations composed (R3) — the existing gates extend to the new fields.

## 10. Build sequence (thin vertical slice FIRST — the visual reference)
1. **Define + approve** the schema (§3), facet taxonomy (§4A), entity types (§4B). ← this doc.
2. **Thin slice:** migrate ONE rich entity (**Mercury**, 13 claims) into the new template + seed its entity registry entry + build a **minimal Search entity view + Ask answer** rendering just Mercury. **STOP → Luneth visual sign-off.** (This is the visual reference he needs to steer the format.)
3. **Iterate** the structure/design with Luneth on that slice until the info format is right.
4. **Mass-migrate** the 186 → new template (script + review); seed the full entity registry; add sharding (§7).
5. **Full Search surface + ⌘K Ask** wiring; retrieval index (§6); gates (§9) + render probe.
6. **Resume mining, search-first** (the paused Mn-onward + the La/Li/Lu/Mg backfill) now that the format is validated + the density/inventory tooling exists.
7. G-7 harness loop → seal.

## 11. Open decisions for Luneth
1. **Where does Search live?** A dedicated **Search surface/tab** (its own workspace), the **⌘K Ask** path, or both (recommend: both — ⌘K for quick asks, a full Search surface for entity browsing)?
2. **Entity page vs Ask** — is the product-detail-style **entity page** (categorized facet sections) the primary "wow" view, with Ask as the quick path? (My read of your intent: yes.)
3. **Thin-slice entity** — Mercury (13 claims, richest) as the first visual reference? Or pick another.
4. **Entity registry home** — `eden/catalog/search-entities.json` (a new sealed registry) OK, or keep entities purely derived from claim `subject` fields (lighter, but no curated display/synonyms/related)?
5. **Facet list** (§4A) — does that set cover "every breakdown" you picture, or are there categories I'm missing?
