# Phase H — Redesign Migration Blueprint

_The plan that carries the signed-off UI/UX redesign demos into the live app WITHOUT copying their shortcuts, and WITHOUT leaving the old system behind. Opened 2026-07-11 (Luneth). This is OVERHAUL-BLUEPRINT **Phase H**, expanded into its own execution doc (the master plan's §7 Phase H line points here)._

**Relationship to the other docs.** `chronicle/entity-page-redesign-blueprint.md` = the DESIGN record (the vision, the demos, the colour language, why each decision was made) — it FREEZES as design-origin at H7 close. THIS doc = the MIGRATION record (phases, deletes, gates, verification). If the two disagree, this wins for execution order; the design doc wins for what a surface should look like. `chronicle/OVERHAUL-BLUEPRINT.md` remains the master index.

**The one job.** Turn four gitignored `temporary/*.html` prototypes into shipped `views/` + `styles/` + generated `assets/data/`, where every entity page is a pure projection of the pillars, all prose lives in one contained store, and — the hard part Luneth named — **no loose piece of the old Knowledge/Search system survives to resurface.** Past overhauls left dead rules, orphaned data, and contradictions that kept creeping back; this plan makes that structurally hard.

**The philosophy (why foundation-first).** The demos are deliberately not pristine — they inline prose and data as literals for speed. The migration risk is copying those shortcuts into the app. So the enforcement floor lands BEFORE the surfaces (H0): once the gates are live, the app physically cannot accept inline prose, a hand-built entity map, demo scaffold, or an unstyled class. Every phase then ends board-green; nothing old is deleted until its replacement generates correctly (never a gap where the app breaks); every user-facing surface gets a Luneth visual sign-off (visual-verification.md).

**Serves.** §00.A (Wallach source-of-truth — every amount still traces to a Wallach claim) · §00.B (elite engineering — no silent failures, single source of truth, codify-don't-promise) · R1/R3/R4 (derive-don't-duplicate, one source per fact, prose contained) · R7 (every enforceable rule ships its gate in the same patch; unenforceable = labeled WISH).

---

## 1 · What the audit found (2026-07-11, 13-agent survey + adversarial verify)

_Full raw findings archived from workflow `wf_a7a3e3ca-40d`. This section is the durable summary._

### 1.1 · Prose leaks + fake-functions (Audit A)
Per-prototype user-facing strings: essential 49 (12 high-leak / 4 fake) · condition 33 (11 / 5) · browse-shell 65 (38 / 3) · knowledge-drawer 87 (43 / 6). The 115 KB data blobs in the prototypes are REAL content that must re-home to GENERATED artifacts, never migrate as inline literals.

**Containment model (the "one source of prose"):** exactly two homes — (a) the segregated content-store (ID-referenced) for view prose (labels, hints, hero copy, glosses); (b) generated `assets/data/*.json` for everything derived from the pillars (claim text, verbatim, citations, targets, composition). Nothing user-facing stays a literal in `views/`.

**The 6 fake-functions → real functions** (copy that masquerades as computed data):
1. **Coverage %, numerator, bar-fill** ("80% of target — one more source closes the gap", "1,200", CSS `width:80%`) → `pct = Σ(this-essential delivered across regimen items, using Youngevity composition × servings) ÷ Wallach target`, wired to regimen state; the trailing sentence = the COMPUTED remaining deficit + the single best next source that closes it.
2. **"covers N/16", "8+ of the 16", best-value tag** → the recommender ranker output (adequacy·.6 + breadth·.3 + value·.1 on WHOLESALE), computed over live composition ∩ mapped-essentials.
3. **Related-entity chips** (hardcoded `['Magnesium','Phosphorus',…]`) → computed from the catalog graph + corpus co-occurrence for the current entity.
4. **"also: ca" / synonyms** → catalog / search-entities synonym list, human-rendered.
5. **Hardcoded counts** ("91 essentials", "506 conditions", "browse all 506") → interpolate live `Object.keys().length`. (Also: the label NEVER says "91"; counts say "90".)
6. **Generic protocol boilerplate** ("Restore the missing nutrients Wallach ties to {condition}") → real per-condition protocol summary from the mapped protocol claims.

### 1.2 · Claim / pill / cross-reference fit (Audit B — counts for manual review)
After an adversarial verify pass that OVERTURNED borderline flags (so counts are not inflated): D1 Calcium — **5 loose, 0 misfit** survive (of 29). D2 Osteoporosis — **3 loose, 5 misfit** survive (of 60).

**The root cause is one systematic derivation defect, not per-claim judgment:** the "works with" / "nutrients to restore" pills are computed by flattening `essentials[]` across MULTI-condition claims, so a nutrient that maps to a DIFFERENT condition in the same claim leaks onto the page. Fix the derivation → most of the list clears automatically.

The concrete items surviving verify (for Luneth's manual call — NOT auto-removed):

- **D2 misfits — spurious "nutrients to restore" pills (no osteoporosis mapping anywhere in the corpus; pure `essentials[]`-union leak):** Zinc (maps Zn→diabetes/immunity), Chromium (Cr→diabetes), Selenium (Se→cancer/cardiomyopathy), Tin (Sn→deafness), Vanadium (Va→diabetes).
- **D2 loose:**
  - **Fluoride** (the anchor) — claim `WAL-CLM-LETS-000051`, Let's Play Doctor 1995, `kind='dose'`, `other_substances=['fluoride']`, `conditions=['osteoporosis']`, `tags=['fig-8-1','base-line-program','dose-table']`. It is a base-line dose-TABLE row promoted into the default-open GREEN "What to do" primary slot, **contradicting the page's own "avoid fluoride" summary.** Root = PROMINENCE: a table row must not auto-promote into a curated primary slot.
  - **Phosphorus (toxicity signs)** — mis-coloured red "cautions"; toxicity is amber "signs" per the locked colour language (checkable colour drift).
  - **Phosphorus (in "restore")** — phosphorus is osteoporosis-relevant as a LIMIT (ideal Ca:P 2:1; excess P drives bone loss); placing it in "nutrients to RESTORE" inverts the guidance.
- **D1 Calcium loose:** the lede "interacts with 41 other nutrients" overstates co-occurrence as interaction — only 3 genuine interaction-kind claims exist; the spurious "works with" pills are **Gallium, Germanium, Tin, Oxygen** (each traces to a single multi-mineral list or physiological O2 mention, not a calcium partner).

**The going-forward rule (H1):** (i) fix the `essentials[]`-union derivation so a pill only appears when the nutrient maps to THIS entity (or is a genuine interaction-kind claim); (ii) the kind→colour-category map is TOTAL over all corpus kinds (no default branch); (iii) a PROMINENCE rule — dose-table / base-line-program rows never auto-populate a curated primary slot. Items (i)–(iii) are gated; the residual "is THIS claim genuinely primary for THIS entity" stays human review (labeled WISH).

### 1.3 · Wholesale rule — verified, not a bug
The gate audit flagged a "live retail violation." **Verified false:** `eden/tools/recommender_derive.py:52-71` prefers `price_wholesale` (retail is fallback-only; none fall back) and `state/recommender.ts` consumes that wholesale float. The locked rule ([[wholesale-featured-price]]) is correctly implemented today — it is simply UNGATED, so H5 adds `cost_calcs_use_wholesale` to prevent regression.

---

## 2 · The gate set (proof, not promises)

Every gate names its proof anchor (pinned to committed source bytes or the sealed pillars — never a stale-to-stale compare) and its negative test (the planted defect that proves it fires). Each ships in the SAME phase as the thing it governs (R7). Semantic-judgment residue is labeled WISH honestly, never sold as guarded.

| Gate | Lands | Proof mechanism | Negative test | Status |
|---|---|---|---|---|
| `views_no_inline_prose` | H0 | Deterministic re-scan of committed `views/`+`state/` .ts: strip comments, RED any prose-shaped literal (≥12 words OR a sentence boundary in a >40-char run) rendered into a DOM/HTML return. Allowlist: JSDoc/`//`, aria/title microcopy, short labels. | Plant `return \`<p>Selenium is an essential trace mineral Wallach links to Keshan disease…</p>\`` in a view → RED. | can-be-gate (closes the #1 WISH; semantic "is it the RIGHT prose" stays review) |
| `entity_render_is_projection` | H0 | AST/regex scan of the entity view against the real entity-id sets from the pillars (canon slugs, catalog condition/symptom ids, product ids): RED any object literal KEYED by those ids (any size), or any `slug==='calcium'`-style content branch. Closes the sub-10-element hole `views_state_no_inline_data` can't see. | Add `const PAGES={calcium:{…},osteoporosis:{…}}` (2 keys) → RED. | can-be-gate |
| `no_stub_render_paths` / `no_demo_scaffold_in_app` | H0 | Forbidden-token scan (same mechanism as `no_dead_legacy_paths`) over shipped view+css bytes: demo markers (`kn-stub`, `next chunk`, `real build`, `exemplar`, `PROTOTYPE`, `sh-stub`) = RED. | Copy a `<span class="kn-stub__mark">P1 · next chunk</span>` into a shipped view → RED. | can-be-gate |
| `class_css_backed` | H6 | Extract class literals emitted by `views/*.ts`; cross-reference the union of selectors in shipped `styles/*.css`; an emitted class with no rule = RED. Catches the historic unstyled-`kd-*`/`jd-*` drift. Caveat (honest): static extractor misses string-concatenated class names — literal-drift only. | Emit `<div class="ep-newthing">` with no `.ep-newthing` rule → RED. | can-be-gate (PARTIAL; computed-class residue = review) |
| `claim_category_mapping_total` + `view_category_not_hardcoded` | H1 | (1) one kind→colour-category table maps ALL corpus `claim.kind` values exactly once, no default/fallback — cross-checked against the distinct kinds in the sealed shards; a missing/extra kind = RED. (2) views read category via that table, never assign a colour by a per-claim literal. | Add an unmapped kind, or drop a kind from the map, or hardcode `color='orange'` for a claim id → RED. | can-be-gate; semantic FIT = WISH |
| no-positional-hero (prominence) | H1 | The primary/hero claim per entity is chosen by an explicit reviewed prominence signal (a field OR a fixed kind-priority order) — RED if the primary slot is filled by array position / first-in-file, and RED if a `dose-table`/`base-line-program`-tagged claim lands in a curated primary slot. | Make the entity page take `claims[0]` as hero, or let a `base-line-program` row into "What to do" → RED. | can-be-gate |
| `cost_calcs_use_wholesale` | H5 | Field-reference scan pinned to the price schema `{retail,wholesale}`: the recommender cost-tuner + any primary-price binding must reference `wholesale`; ranking math may not read `retail`; retail may appear only in a slot labelled secondary/reference. | Point the value term at `.retail` → RED (would have caught a real regression). | can-be-gate (cost basis); visual prominence = review |

Existing gates that already cover parts of this migration and MUST stay green throughout: `derived_artifacts_fresh` + `data_artifacts_accounted` (every artifact is a fresh pillar projection, none unaccounted), `amounts_wallach_only` (targets Wallach-only), `citations_reference_registry` (composed cites), `prose_contained` (no prose in fact fields), `no_hand_duplicated_canonical`, `no_product_marketing_prose`, `no_dead_legacy_paths`, `no_operating_doc_contradiction`, `charter_gates_present`, `search_only_indices_excluded`, `corpus_runtime_purity`.

---

## 3 · The delete-manifest (nothing forgotten)

The consolidated obsolescence list. Each item is deleted/replaced only AFTER its replacement generates correctly, and its removal is verified (grep-to-zero) at H7. `risk_if_left` is why it matters.

**Knowledge views (`dashboard/assets/js/src/views/`):**
- DELETE — `knowledge-corpus.ts` Corpus tab + book browser (`renderCorpusTab`, `renderBookDeep`, `listBooksWithId`) + the `state/corpus.ts` book fns it uniquely feeds. *Risk: the browsable book/claim-count surface IS the flat-corpus-dump model the redesign exists to kill (+ legal liability).*
- DELETE — `knowledge.ts` Doctrine tab (`DOCTRINES` const, `doctrineCite`, the doctrine `case`). *Risk: a self-referential meta-feature the redesign removed; keeps its data one import from resurfacing.*
- DELETE — the in-drawer per-tab search (`kd-search` box in `renderShell`). *Risk: a second competing search UI = the two-search pattern the overhaul purges.*
- REPLACE — `renderEssentialDeep` (knowledge.ts) + `renderConditionDeep` + `renderProductDeep`/`renderProductRow` (knowledge-corpus/products) with the data-driven entity page. Delete the dormant WALLACH-SAYS scaffold with them. *Risk: parallel render paths drift; the old flat "dump" format survives.*
- SUPERSEDE — claim-render primitives (`renderCorpusClaim`, `renderDoseCard`): the new page owns claim rendering; keep the Fig-8-1/ref-header handling knowledge (port, don't re-derive). *Risk: two claim renderers drift.*
- REPLACE — the drawer shell: `type Tab = 'corpus'|…|'doctrine'` + `renderShell`'s tab array (the literal definition of the old tab set).

**Search views + wiring:**
- DELETE — `search.ts` `mount()` drawer lifecycle + `renderLanding()` browse grid + standalone answer card; `search-highlight.ts` WHOLE FILE (dead code welded to the retired per-tab search). *Risk: a live second search box running beside the palette.*
- SUPERSEDE — `resolveQuery` 3-mode brain, `navStack`/`gotoEntity`/`goBack`, `renderEntity`/`renderFacet` (two implementations of claim/facet/pill rendering). *Risk: a future dev re-wires the palette to `resolveQuery`; back-behaviour diverges.*
- REPLACE — `main.ts` `DRAWER_SPECS` search entry + the `'s'` key; `dashboard.html` `#drawer-search-mount` host (line ~118) + the `drawer-search.css` `<link>`; `tools/render_probe_search.js` (rewrite for the palette, else a green probe pressures keeping the old drawer alive).

**CSS (`dashboard/assets/styles/`):**
- REBUILD FROM EMPTY — `drawer-knowledge.css` (~90% superseded `kd-*` content families: `kd-essential-*`, `kd-condition-*`, `kd-corpus`/`kd-claim`, `kd-book-*`, `kd-product-*`, `kd-featured-citation`, `kd-section-head`). *Piecemeal editing is how loose pieces get left behind — a from-empty rebuild in `kd-*`/`pd-*` + `class_css_backed` proves nothing dangles.* Highest single resurfacing risk: `kd-product-*` (expresses the same panel as `pd-*`).
- DELETE — the `kd-*` half of every paired chrome rule in `drawer-shared.css` (selectors still MATCH `#drawer-knowledge-mount`, so stale markup re-styles). SUPERSEDE — `drawer-search.css` `sr-*` CHROME duplicates + `sr-landing`/`sr-ent-card` (the entity-page `.sr-*` CONTENT vocabulary is the winner and is KEPT).

**Data + schemas:**
- DELETE — `assets/data/doctrine-data.json` + `core/schemas/doctrine.ts` + its MANIFEST `accounted` entry (orphaned prose store once the Doctrine tab is gone).

**Operating docs (H7, supersede EXPLICITLY — never silently; "older loses"):**
- CLAUDE.md "Architecture" — the "Surfaces:" sentence (blesses a standalone Search + separate ⌘K palette).
- OVERHAUL-BLUEPRINT §5.2 (Knowledge = old flat drawer) + §5.5 (**re-opens the generative-LLM DECISION D4 — a landmine that kills the 350 MB offline budget; defuse UP FRONT in H0**).
- `entity-page-redesign-blueprint.md` — freeze as design-origin; mark §4/§8.5 status resolved so a reader can't re-derive the already-rejected passes.
- `drawer-knowledge.css` header (a lying "420px / 4-tabs" comment — a defect per typescript.md).
- Memory files whose index line asserts the old Knowledge/Search model; rewrite `next-chunk.md`.

---

## 4 · The phases

Foundation-first (Luneth 2026-07-11). Each phase: build → invariants (≥ baseline, zero NEW red) → render probe(s) for touched surfaces → visual sign-off if user-facing → build-log + Creator's Log → commit + push. Gates land in the phase that needs them. Multi-agent fan-out (the adversarial-verify pattern that worked on the wholesale audit) is used where flagged.

### H0 · Foundation & guardrails (NO user-facing change)
The enforcement floor + the data pipeline, so the surfaces cannot be built wrong.
- **Content-store** — the single home for view prose (labels, hints, hero copy, glosses), ID-referenced; the display-label maps (the 10 kind labels, 13 facet labels) centralize here.
- **Per-entity derived artifact + generator** — every entity page is a PURE PROJECTION of the pillars (essentials-canon + catalog + corpus + products). The 2 hand-built exemplars (Calcium, Osteoporosis) become GENERATED like every other entity. Registered in the MANIFEST → `derived_artifacts_fresh` + `data_artifacts_accounted` cover it.
- **Wire the 6 fake-functions' real data sources** (coverage math via regimen state; recommender covers-N; catalog synonyms; computed related-entities; live counts; per-condition protocol summary).
- **Gates land:** `views_no_inline_prose`, `entity_render_is_projection`, `no_stub_render_paths`/`no_demo_scaffold_in_app` — each with its negative test committed alongside.
- **Governance up-front:** create THIS doc + point OVERHAUL-BLUEPRINT §7 Phase H at it; **defuse the §5.5 generative-LLM landmine**; freeze the redesign doc's status.
- **Verify:** invariants green incl. the new gates + their negative tests; no probe (no surface yet).

### H1 · Claim-fit / derivation correctness (Audit B, operationalized)
- Fix the `essentials[]`-union leak: a "works with"/"restore" pill appears only when the nutrient maps to THIS entity or is a genuine interaction-kind claim.
- Make the kind→colour-category map TOTAL; add the PROMINENCE rule (dose-table / base-line-program rows never auto-fill a curated primary slot; Phosphorus toxicity → amber signs).
- **Gates land:** `claim_category_mapping_total`, `view_category_not_hardcoded`, no-positional-hero.
- **Manual review:** present Luneth the surviving per-claim list (§1.2) for keep/move/drop calls (fluoride, both phosphorus items). The systematic fix clears the 5 D2 misfits + the D1 spurious pills automatically; the human calls are the residue.
- **Multi-agent:** fan out a per-entity fit re-check + adversarial verify once the derivation is fixed, to confirm the leak is gone corpus-wide (not just on the 2 exemplars).

### H2 · Entity page for real — essential + condition (data-driven)
- Build the entity render in `views/knowledge.ts` (`sr-*` content + `kd-*` chrome) from the H0 artifact. REPLACE `renderEssentialDeep` + `renderConditionDeep`; delete the old deep-views + WALLACH-SAYS scaffold as the new lands.
- **Verify:** render probes (essential + condition) + Luneth visual sign-off. Adversarial "did any old render path or inline-prose leak survive" verify agent at close.

### H3 · The 5-tab drawer shell (Home · Essentials · Conditions · Explore · Products)
- Build the 900px drawer + segmented tabs on the real shell. DELETE the Corpus tab + Doctrine tab + in-drawer per-tab search + `doctrine-data.json`/`doctrine.ts`/book-browser.
- **Verify:** drawer probe + visual sign-off.

### H4 · Ask-Wallach palette (unify the two searches)
- Build the `ap-*` command palette (Jump-to entities + In-the-books claims); reframe the Search rail item. Port the charged-content gate + synonym table from the prototype. DELETE `search.ts` drawer + `search-highlight.ts` + `#drawer-search-mount` + the `'s'`-key spec; rewrite `render_probe_search.js` for the palette.
- **Verify:** palette probe (incl. charged-gate assertion) + visual sign-off.

### H5 · Product detail page (`pd-*`) + Coverage dashboard (D4)
- Product page from `product-detail-data.json` (wholesale-featured, colour bars, nutrient rows linked to essentials); REPLACE `renderProductDeep`. **Gate lands:** `cost_calcs_use_wholesale`.
- Coverage dashboard (D4) built DIRECTLY from the locked entity-page format (no separate demo — Luneth 2026-07-11), handing off into essential pages; the "your coverage %" wired to real regimen state.
- **Verify:** product + coverage probes + visual sign-off each.

### H6 · CSS from-empty rebuild
- Rebuild `drawer-knowledge.css` from scratch in `kd-*`/`pd-*`; delete every superseded `kd-*` family + the `drawer-shared.css` `kd-*` half + `drawer-search.css` chrome duplicates.
- **Gate lands:** `class_css_backed` (every emitted class has a backing rule).
- **Verify:** `tools/style_diff.js` to 0 diffs vs the signed-off prototypes; all probes still green.

### H7 · Governance reconcile + poison purge (CLOSE)
- Supersede every old-model assertion in the delete-manifest §3 (docs + memory + next-chunk).
- **Grep-to-zero:** fan out a multi-agent sweep (the wholesale-audit pattern) across the whole repo + the memory dir; ANY surface still asserting the old Knowledge/Search model, the two-search UI, the Corpus/Doctrine tabs, or a demo shortcut = a finding to purge ([[doctrine-change-reconcile-all-surfaces]]).
- Final R1–R9 re-audit; confirm `no_operating_doc_contradiction` + `no_dead_legacy_paths` green with the new reality.
- **Done when:** the app renders every entity page from the pillars, one prose store, one search, one drawer — and no grep finds the old system anywhere.

---

## 5 · Open questions + deferrals
- **Per-claim corpus fit at scale** — H1 fixes the derivation + gates the structure and reviews the 2 exemplars' residue. A corpus-WIDE per-claim category review (every entity, not just Calcium/Osteoporosis) stays parked with the Phase-G/G-8 mining cleanup (§10 of the redesign doc) unless Luneth pulls it forward.
- **Claim `?` badge on non-question statements** — decide during H2 (keep, or a neutral mark).
- **Coverage-count data gaps** — a condition's "covers N/16" counts only involved nutrients that HAVE recommender data (e.g. 14/16 for osteoporosis; germanium + tin have none). Directionally honest; revisit if it matters.
- **`no_product_marketing_prose` / legal** — the full legal/copyright/a11y pass stays the single end pass (Phase I, [[legal-copyright-pass-at-end]]); H-phases keep the repo private and defer it.

---

_Authored 2026-07-11 from the 13-agent Phase-H migration audit (`wf_a7a3e3ca-40d`) + Luneth's four structural decisions (dedicated doc · foundation-first · claim-fit as foundation · build D4 directly). Execution begins at H0._
