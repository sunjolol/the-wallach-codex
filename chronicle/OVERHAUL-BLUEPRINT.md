# THE WALLACH CODEX — OVERHAUL BLUEPRINT

_The complete plan. Built and verified in full BEFORE any implementation (Luneth's mandate 2026-07-05). This supersedes genesis/02-clarifications-and-plan.md as the active plan._

**STATUS: LOCKED IN FULL — 2026-07-05.** All 8 sections verified by Luneth. Implementation begins at **Phase A** (Section 7) — the governance reset + noise purge, which also executes the Section 8 operating-file audit. Phase C's honest-gap trade-off (Wallach-only targets, empty where no claim exists yet) explicitly accepted.

**EXTENDED + LOCKED 2026-07-09:** Section 7's remaining phases (G book-mining, H, I) were expanded into the vein-selective mining → Search-validation → seal → app-completion → design roadmap; the mining HOW is `.claude/rules/mining-veins.md`.

_Status legend: `[DRAFT]` written, awaiting Luneth verification · `[LOCKED]` verified, may be built against · `[OPEN Qn]` a decision that blocks locking._

---

## Section 1 — THE CHARTER (the non-negotiable rules)  `[LOCKED 2026-07-05]`

**Permanent home: `.claude/rules/charter.md`** (promoted 2026-07-05) — the maintained, authoritative Charter, carrying each rule's live gate-status (LIVE / PARTIAL / WISH) and surviving this blueprint's pruning. This section is the frozen design origin; if the two disagree, the rule file wins.

Every rule names its **gate** — the code that proves it. A rule with no gate is labeled `WISH`, never sold as a guarantee (R7).

| # | Rule | Gate (the proof) |
|---|---|---|
| R1 | Only the two sources (Wallach Corpus, Youngevity Product DB) + the Catalog are hand-editable. Every shipped artifact is generated from them. | Generated files carry a content hash; invariant fails if any generated file ≠ regenerate-from-source. Write-guard blocks edits to generated paths. |
| R2 | Wallach-only for every recommended amount/range/dose. Youngevity = composition only, never a target. | `amounts_wallach_only`: every amount carries a `source_claim_id` → a Wallach claim; a Youngevity-sourced amount = RED. One-time poison sweep across all kept files. |
| R3 | One source per fact, referenced by ID. No value hand-written twice. | `references_resolve` (every ID resolves) + `no_hand_duplicated_canonical` (derived copies only). |
| R4 | Prose is contained: summaries/descriptions/alert-boxes/glosses live in ONE compartment, attached to their entity by ID, single-copy — never inline in code, never in a fact field. | `prose_contained`: prose only in designated prose fields; scan fails if prose-shaped text appears in code or fact fields. |
| R5 | The mining gate: a record cannot land unless it passes every structural check. | `mine` pipeline: verbatim⊆source · citation∈registry · mappings∈catalog · prose-contained · units-sane · amount-has-wallach-source. Fail → cannot seal → board RED. |
| R6 | Logs are sacred + append-only. Deletion structurally blocked; override = the 3-part ALL-CAPS ritual only. BUILD→TEST→LOG→REPEAT is sacred. | `creators_log_append_only` (exists) extended to every sacred log. Round-close + stop hook enforce the cycle. |
| R7 | Codify, don't promise. Every enforceable rule ships its gate in the same patch. Unenforceable items are labeled `WISH`. | The Charter's own gate column; an empty gate cell renders as a visible `WISH`. |
| R8 | No poison left behind. Everything kept is re-audited against R1–R6; violations purged, not grandfathered. | Migration runs every preserved file through the gates; board can't go green with a violation present. |
| R9 | Refinements are codified too. A misfiring gate is fixed by re-codifying with proof — tighten the check, or add an auditable, versioned exception with a reason + a test. Never a silent loosening. | Exceptions live in a baseline data file, each with reason + test; an invariant fails on an unjustified exception. Refinement ships with the misfire it fixes. |

---

## Section 2 — THE DATA MODEL  `[LOCKED 2026-07-05]`

### 2.1 · The finding that shapes everything
Two parallel systems exist today:
- **CLEAN** — `eden/corpus/` → `indices/` → `corpus-embed.json` → Knowledge drawer. Sealed, `verbatim`⊆book, structured `dose`, 11-check verify, derived-not-hand-written. Already ~80% of the Charter.
- **ROTTEN** — `knowledge/essentials-targets.json` → `essentials-targets-data.json` → 4 embeds → Coverage. Hand-maintained, prose baked in, citations hand-typed (the 1999 drift), targets tainted by Youngevity. **The entire source of the recurring failures.**

**The overhaul = collapse ROTTEN into CLEAN.** Everything the dashboard shows derives from the pillars via the derive pipeline, exactly as the Knowledge drawer already does.

### 2.2 · The three pillars

**Pillar 1 — The Wallach Corpus** (`eden/corpus/`, EXISTS, keep + extend)
The claim schema (from `eden/corpus/SCHEMA.md`) is already the right model: each claim = `{id, kind, essentials[], other_substances[], conditions[], symptoms[], claim_text, verbatim (⊆book), locator{char_offset}, dose{amount,unit,period,form,duration,for_condition}, confidence, review_state}`. Books referenced by `book_id` → `books-meta.json` (the sealed registry). This pillar already enforces R3/R5 for claims.

**Pillar 2 — The Youngevity Product DB** (`eden/products/`, NEW, you hand-build)
Sealed like the corpus. **ACTUAL LOCKED SHAPE (Phase F — richer than this original sketch; AUTHORITATIVE: `eden/products/README.md`):** product = `{product_id, name, sku, ygy_id, components:[{form, serving_size, servings_per_container, macros, nutrients:[{name, form, amount, unit, unit_detail, label_iu, pct_dv}], blends:[{name, total, as_labeled, ingredients:[{pos, name, part, form, latin, standardization, sub_ingredients}]}], other_ingredients, source_label}]}`. Pure composition, zero prose — the ONLY long free-text token is a blend's bounded `as_labeled`. Prices + YGY description → SEPARATE volatile `prices.json`; warnings → `warnings.json` (both source:ygy, quarantined, NEVER a target). Every ingredient ∈ the rebuilt Catalog nutrient/botanical registry. Sealed + hash-anchored + `products_verify` (structure + prose-containment, negative-tested), mirroring `corpus_verify`.

**Pillar 3 — The Catalog** (`eden/catalog/`, CONSOLIDATE from scattered pieces)
The canonical ID registries BOTH pillars reference:
- `essentials` — the immutable 90/91 (from `essentials-canon.json`, EXISTS). ✓
- `nutrients` — the broad nutrient/ingredient vocabulary products reference (NEW — supersets the 90 essentials with non-essential ingredients: herbs, fillers, carriers). `[OPEN Q1]`
- `conditions` + `symptoms` — canonical ID registries `[OPEN Q2]` (today these are *emergent* from claim slugs via the derived indices + `condition-taxonomy.json`; promoting them to a pre-registered catalog is the single-source move).

### 2.3 · Where the ROTTEN layer's data goes (the collapse map)
| Today (hand-maintained) | Becomes (derived from pillars) |
|---|---|
| `essentials-targets.json` daily **targets** | derived from Wallach `dose` claims (maintenance amount per essential); Youngevity NEVER a fallback (R2) |
| `wallach_stance` (summary + verbatim + citation) | verbatim = a REAL claim's `verbatim` (no fabrication possible); summary = a per-essential prose field in the prose store; citation composed from `book_id` |
| `essentials-benefits-data` | derived from claims (benefit-kind claims per essential) |
| `essentials-best-supplements` | derived: Pillar-2 products cross-referenced to essentials via `nutrient_id` |
| `coverage-layout-data` | derived from `essentials-canon` (layout_key/symbol already there) |
| `products-db.json`, `regimen-label-lookup.json`, `ingredients-quickref.json` | replaced by Pillar 2 + derived lookups |
| all `dashboard/assets/data/*.json` embeds | GENERATED by the derive pipeline; never hand-edited (R1) |

### 2.4 · Where prose lives (R4)
Exactly four homes, each single-copy, ID-keyed, never inline in code or fact fields:
1. `claim.claim_text` — paraphrase (exists) · `claim.verbatim` — Wallach's exact words (exists).
2. **Per-essential / per-condition summary** — our modern-voice reading. Proposed: a `prose` store keyed by entity ID `[OPEN Q3]`.
3. **Glosses** — `term-gloss-lexicon.json` (exists in `eden/tools/`). One place.
4. **Alert/warning-box copy** (K1/K2 alert, phosphorus 2:1, etc.) — a designated prose store, ID-keyed.
`prose_contained` scans that no prose-shaped text appears anywhere else.

### 2.5 · Decisions (RESOLVED 2026-07-05)
- **Q1 — Nutrient catalog: YES.** Build `eden/catalog/nutrients.json` — the broad ingredient vocabulary every product ingredient references (`{nutrient_id, display_name, is_essential(→canon slug or null), class}`). Required for Pillar 2 to reference anything by ID. **[SUPERSEDED 2026-07-05 D-c: nutrients.json was built in B2 then DELETED as too-basic duplication — its 91 canonical entries re-copied essentials-canon, its 408 substance names were byte-identical to the auto-humanized slug. The real nutrient/ingredient registry rebuilds from scratch, product-shaped, with the Youngevity Product DB in Phase F. Until then references_resolve's substance half is dormant.]**
- **Q2 — Conditions/symptoms as canonical catalog: AGREED.** Promote from emergent-claim-slugs to pre-registered catalogs with stable IDs (both pillars + UI reference them, can't drift), keeping `condition-taxonomy.json`'s umbrella structure. Closes the phantom-slug hole (a typo'd slug silently minting a condition).
- **Q3 — Stance/summary home: YES.** `verbatim` becomes a POINTER to a real claim (fabricating a quote becomes structurally impossible — the exact bug that triggered this overhaul); the modern-voice `summary` becomes a single-copy prose-store field keyed to the essential. The stance is fully derived, never hand-authored as a standalone.

---

## Section 3 — THE DERIVATION PIPELINE  `[LOCKED 2026-07-05]`

### 3.1 · The rule (R1 made concrete)
The three pillars are the ONLY hand-edited data. Every other data artifact in the repo is GENERATED by a deterministic, network-free, timestamp-free generator that is a pure function of the pillars. "Generated" is not a convention: the write-guard blocks hand-edits to generated paths, and a freshness gate regenerates every artifact and byte-compares to disk. Shipping drift is impossible.

### 3.2 · What exists today (and the gap)
- `corpus_derive.py`: `claims/` → `indices/` (conditions, symptoms, essentials, other-substances, consistency). Sealed, byte-verified (verify #8). ✓
- `corpus_embed.py`: `indices/` + `claims/` → `corpus-embed.json`, imported into the bundle by `state/corpus.ts` (esbuild JSON import). ✓ guarded by `derived_artifacts_fresh` (Phase C1: the manifest gate absorbed `corpus_embed_synced`).
- `eden_build.py`: `eden-catalog.json` → 3 embeds written INTO dashboard.html. Guarded only by a version-STAMP (weak — passes even if content drifted).
- **THE GAP — CLOSED through Phases C–E:** what was hand-maintained is now generated. `essentials-targets-data` (Phase C, from Wallach dose claims) + `coverage-layout-data` (Phase E, from `essentials-canon` via a hand-authored skeleton) both DERIVE + are freshness-gated. `essentials-benefits-data` + `essentials-best-supplements` were DELETED as orphaned dead embeds (regenerate in Phase F/G). The two-embed-mechanism split collapsed to esbuild-import (D1); the two catalogs (`essentials-canon` vs `eden-catalog.json`) reconcile in Phase F (D3).

### 3.3 · The target pipeline (one flow, fully generated)
```
PILLARS (sealed, hand-edited)              GENERATORS (pure)             ARTIFACTS (generated, never hand-edited)
  corpus/  (claims)          ──derive──▶  corpus_derive     ──▶ indices/
  products/ (NEW)            ──derive──▶  products_derive   ──▶ product rollups
  catalog/ (consolidated)    ──derive──▶  targets_derive    ──▶ per-essential Wallach targets (from dose claims)
        └────────── all three ──────────▶ build_embeds  ──▶ every dashboard/assets/data/*.json
                                                         ──▶ esbuild bundles them into main.js
```
Every shipped data file has exactly one generator and one source set. `build_embeds` absorbs `corpus_embed` + `eden_build` and replaces the hand-maintained embeds.

### 3.4 · Decisions
- **D1 — ONE embed mechanism.** Migrate ALL embeds to esbuild JSON-import (the `corpus-embed.json` pattern); retire the inline `<script type="application/json">` blocks. Effect: dashboard.html sheds ~130 KB of data (incl. the 96 KB essentials embed) and becomes a pure shell; ONE generation target, ONE freshness gate. `[recommend YES]`
- **D2 — Generated-file registry.** `eden/derived/MANIFEST.json` lists every generated artifact + its generator + input-pillar hashes. The freshness gate iterates the manifest, so nothing is silently unchecked. `[recommend YES]`
- **D3 — Reconcile the two catalogs.** Absorb `eden-catalog.json` into the consolidated Catalog pillar (§2.2); fold `eden_build.py` into `build_embeds`. `[recommend YES]`

### 3.5 · The freshness gate (R1's proof)
`derived_artifacts_fresh` (critical): for every artifact in the manifest, re-run its generator over the sealed pillars and byte-compare to disk. Any mismatch = RED. This replaces the weak version-stamp check with a content check and generalizes `corpus_embed_synced` to ALL derived artifacts. Build sequence: **seal pillars → run all generators → build bundle → `derived_artifacts_fresh` green.**

---

## Section 4 — THE ENFORCEMENT TABLE  `[LOCKED 2026-07-05]`

### 4.1 · The failure-mode → gate map (the proof surface)
Each row is a way the system could break, and the machine gate that makes it **un-shippable**. If a failure mode has no gate, it is a `WISH` (labeled, never sold as safe — R7). This table, all-green, IS the proof.

_Status column is DESIGN-ERA. The AUTHORITATIVE live status is `.claude/rules/charter.md` + the current **45-invariant** board. Every gate marked NEW below has since LANDED (Phases B–E + the 2026-07-06 crack-fixes)._

| Failure mode | Gate | Sev | Status |
|---|---|---|---|
| A generated file is hand-edited / drifts from source | `derived_artifacts_fresh` — regen every manifest artifact, byte-compare | critical | **LIVE** (Phase C) |
| The manifest list is INCOMPLETE (a hand-maintained data file escapes the freshness gate) | `data_artifacts_accounted` — every assets/data file ∈ manifest `artifacts`-or-`accounted` | critical | **LIVE** (crack #1, 2026-07-06) |
| A recommended amount comes from Youngevity, not Wallach | `amounts_wallach_only` — every amount → `source_claim_id` ∈ Wallach claims | critical | NEW |
| A reference points at a non-existent entity (typo'd slug / phantom condition) | `references_resolve` — every ID ∈ catalog/registry | critical | NEW (partly corpus_verify #3) |
| A book cited by hand-typed name (year/edition drift) | `citations_reference_registry` — book refs = `book_id`, display composed | critical | NEW |
| A fabricated quote presented as Wallach's | verbatim = pointer to a real claim + corpus_verify #2 (verbatim⊆book) | critical | STRUCTURAL via Q3 |
| Prose leaks into code or a fact field | `prose_contained` | critical | NEW |
| A claim lands unverified (bad verbatim / mapping / units) | the mine gate: corpus_verify's 11 checks + `mined_pages_clean` + `verbatim_names_mapped_conditions` | critical | EXISTS, extend for products |
| New claims mined onto an UN-AUDITED corpus (pre-Phase-G) | `corpus_audit_gate` — live claim count may not exceed the frozen baseline until the full audit signs off | critical | **LIVE** (crack #4, 2026-07-06) |
| A canonical value hand-duplicated across files | `no_hand_duplicated_canonical` | critical | NEW |
| A sacred log deleted / edited / reordered | `creators_log_append_only` (+ `build_log_append_only`, + any new sacred log) | critical | EXISTS |
| A Charter rule has no gate but is treated as safe | `charter_gates_present` — every rule → live gate or labeled WISH | critical | **LIVE** (2026-07-06) |
| A baseline exception is unjustified | `exceptions_justified` — reason + test per exception | critical | **LIVE** (2026-07-06) |
| Runtime reaches the network (breaks offline) | `corpus_runtime_purity` + `no_external_style_resources` | critical | EXISTS |
| An operating doc contradicts the Charter / cites a deleted structure | `no_operating_doc_contradiction` (extends `no_dead_legacy_paths`) | critical | NEW (S8) |
| Sealed source edited without re-seal | `*_hash_integrity` (corpus, products, catalog, design-system, graphics) | critical | EXISTS, add products/catalog |

### 4.2 · The invariant set — disposition  _(43 pre-migration → **45 LIVE** as of 2026-07-06; every planned Charter gate has landed)_
- **OBSOLETE (delete):** `wallach_stance_embed_sync`, `wallach_stance_source_rule`, `wallach_stance_verbatim_in_book` (guarded the rotten layer). `legacy_css_contained` retires with `legacy-dashboard.js`.
- **REPLACE / generalize:** `corpus_embed_synced` + `eden_embeds_match_canonical` → `derived_artifacts_fresh` (content, not version-stamp).
- **KEEP:** the corpus/mining gates, the log/sacred gates, the code/build gates, the offline/UX gates, §17/§31 gates, design/graphics seal gates, `search_only_indices_excluded`, `views_state_no_inline_data` (strengthened for R4). *(Exact per-invariant read happens in S8.)*
- **NEW (Charter gates):** the ~10 in 4.1 marked NEW.

### 4.3 · Honest pushback — the count is not the target
You expected far fewer than the count (43 at plan time; **45 LIVE now**). Here's the correction: **the goal is not fewer invariants — it's one gate per named failure mode, and zero dead gates.** ~4 die here; ~10 new Charter gates arrive. The number may end up *similar or higher*, and that is correct: a smaller set with coverage gaps is exactly how benefits/Fluoride and the 1999 drift slipped through. What we delete is **dead** gates (guarding things that no longer exist) and **redundant** gates (folded into a stronger one). The proof is 4.1's coverage, not a low number.

---

## Section 5 — PER-SURFACE PLANS  `[LOCKED 2026-07-05]`

Every surface is a READ-ONLY view of the pillars + the user's own localStorage. No surface writes a pillar. User state flows through the §31 chokepoints to localStorage only. Build priority: **Coverage · Knowledge · Regimen · Scanner (core) → Search → Journey (last).**

### 5.1 · Coverage (⌘1) — the 90-essentials dashboard
- **Derives from:** catalog(essentials) + corpus(targets from `dose` claims + stances) + products(composition) + user regimen(localStorage).
- **Renders:** periodic table of 90, per-essential coverage % (user intake vs Wallach target), deep-dive per essential.
- **Coverage math:** Σ(user regimen item nutrient amounts) ÷ Wallach-derived target, per essential. Targets Wallach-only (R2); products supply composition only.
- **Gates:** `derived_artifacts_fresh`, `amounts_wallach_only`, `references_resolve`.

### 5.2 · Knowledge (K) — education  `[SUPERSEDED 2026-07-11 → phase-h-migration-blueprint.md + redesign §8.5]`
> **SUPERSEDED — do not build from this section.** The flat essential/condition deep-dives are replaced by the universal ENTITY PAGE housed in a 950 px, 5-tab drawer (Home · Essentials · Conditions · Explore · Products). Build per `chronicle/phase-h-migration-blueprint.md` §4. The bullets below are the frozen pre-redesign origin — "older loses."
- **Derives from:** corpus (claims + indices) via the generated embed — already the clean system.
- **Renders:** essential/condition deep-dives, claims w/ verbatim + composed citation, glossary tooltips.
- **Gates:** `derived_artifacts_fresh`, the mine gates.

### 5.3 · Regimen (⌘2) — the game cartridge
- **Derives from:** catalog(nutrients) + products(itemize a product's nutrients) + corpus(gap-fill toward 90).
- **User state** (localStorage, §31 chokepoints): slots, items, doses, goals — the user OWNS this. Export/import = JSON cartridge; future marketplace = shared cartridges.
- **Wall:** references pillar IDs, never writes pillars. Zod-validated + length-bounded on load (R8 bounded inputs).
- **Gates:** `regimen_state_mutation_routing`, `regimen_slot_invariant_wired`.

### 5.4 · Scanner (⌘3) — the user's own items (THE WALL)
- **Derives from:** catalog(nutrients — match OCR names → IDs) + products(recognize known Youngevity items).
- **User state** (localStorage only): scanned/manual items → their regimen. OCR = local vendored Tesseract (offline). Bubble suggestions: OCR text → catalog match → user confirms.
- **THE WALL (Eden's purpose, vision 5a):** the scanner lets a user add ANY item to THEIR regimen, but it can NEVER modify the pillars. Architectural: the file:// browser has no fs-write; the scanner writes only localStorage via the chokepoint. Scanner-added items are MARKED user-provided so they never masquerade as Wallach/Youngevity canonical.
- **Gates:** `corpus_runtime_purity` (offline OCR), `scanner_user_items_marked` (NEW — user items flagged, never enter pillars/indices), storage chokepoint.

### 5.5 · Search — the offline helper agent  `[SUPERSEDED 2026-07-11 → phase-h-migration-blueprint.md + redesign §8.5]`
> **SUPERSEDED — do not build from this section.** The standalone Search drawer is retired: Search + the ⌘K command palette MERGE into ONE "Ask Wallach" retrieval palette (redesign §8.5 decision #3). **[DECISION D4] is RESOLVED, not open** — generative Ask-Wallach (a bundled offline LLM) is **SHELVED for feasibility**: it blows the 350 MB offline budget, so the engine is smart offline RETRIEVAL only — no generation, no "later opt-in" (redesign §8.5 decision #4 is the authority). Build per the migration blueprint §4 (H4). The bullets below are the frozen pre-redesign origin, kept for history.
- **Derives from:** the full corpus — search is the LARGER consumer (the near-complete Wallach knowledge base), tier-1 the operational slice. Doctrine: `.claude/rules/search-corpus.md` + `chronicle/search-build-blueprint.md`.
- **Renders:** natural-language Q&A over all-Wallach content, offline. The delight = off-path topics that don't fit the 90-essentials frame.
- **Boundary:** READ-ONLY over corpus; search-only content NEVER feeds the operational tabs (`search_only_indices_excluded`, exists).
- **[DECISION D4 — RESOLVED 2026-07-11, retrieval-only]:** ~~bundled offline LLM vs. smart offline retrieval~~ → RESOLVED to smart offline retrieval + templated synthesis ONLY (light, deterministic, never breaks, fully portable). The bundled-LLM option is **SHELVED** — no generation, **no later opt-in** (kills the 350 MB budget; redesign §8.5 decision #4 is the authority). `corpus_runtime_purity` keeps it network-free.
- **Gates:** `corpus_runtime_purity` (CRITICAL — the helper agent must never reach the network).

### 5.6 · Journey (J) — archaic, contained, LAST
- Fully quarantined: its own localStorage state, imports from NO other state module, touches no pillar (so it cannot corrupt anything). Rebuilt to the original demo-page vision, AFTER every other surface.
- **Gates:** boundary lint (Journey may not import other surfaces' state) + containment.

### 5.7 · Distribution — true offline portability
- Ship static files + a portable, permanently-offline browser (updates disabled) so the Codex runs forever on an air-gapped machine. The app is already file:// offline-first (no server, vendored OCR); the portable browser is a distribution wrapper. Phase-late, but noted so it is engineered-for: **no feature may assume network.**
- **Gate:** `corpus_runtime_purity` + `no_external_style_resources` (already enforce zero runtime network).

---

## Section 6 — FILE-BY-FILE DISPOSITION  `[LOCKED 2026-07-05]`

Legend: **KEEP** · **CHANGE** (rewrite for new model) · **GEN** (becomes generated, no longer hand-edited) · **CONSOLIDATE** · **RELOCATE** · **DELETE** · **FLAG** (ask first). Excludes `node_modules/`, `dashboard/assets/vendor/` (22 MB gitignored OCR), `temporary/` (1014 gitignored scratch — leave; optional cleanup).

**Pillars — `eden/` (KEEP, the good part)**
- `eden/corpus/{books,books-meta,claims,drafts,indices,essentials-canon,knowledge-version,seal-history}` — **KEEP** (the Wallach pillar; the model everything else copies).
- `eden/tools/*` — **KEEP**; the derive tools (`corpus_derive`, `corpus_embed`) consolidate into the unified `build_embeds` (§3).
- `eden/eden-catalog.json{,.draft,.golden}` — **CONSOLIDATE** (D3: absorb into the Catalog pillar; retire).
- `eden/derived/*` — **GEN** (regenerated by the unified pipeline).
- `eden/**/__pycache__` — **DELETE** (build artifacts; add to gitignore).
- NEW: `eden/products/` (Pillar 2), `eden/catalog/` (Pillar 3).

**App view layer — `dashboard/assets/js/src/` (KEEP the architecture)**
- `core/*`, `state/*`, `views/*` — **KEEP**. **CHANGE**: `coverage`+`goals` (read new derived data), `journey` (rebuild, contained §5.6), `main.ts` (wire D1 esbuild imports); schemas tied to rotten embeds (`coverage-layout`, `goals`) update.

**App data — `dashboard/assets/data/` (nearly all → GEN)**
- **DONE (MANIFEST `artifacts`, freshness-gated):** `corpus-embed`, `essentials-targets-data`, `coverage-layout-data` (Phase E, via `coverage-layout-skeleton`), `regimen-label-lookup`. **Hand-authored (MANIFEST `accounted`, disposition+reason):** `glossary`, `doctrine-data`, `coverage-layout-skeleton`, `regimen-base-data`, `scanner-corpus-data`, `ocr-dict-data`, `versions-data`, `creators-log-embed`. **DELETED (orphaned dead embeds → regenerate in F/G):** `essentials-benefits-data`, `essentials-best-supplements`, `goal-recommendations-data`, `ingredients-embed`, `ingredients-quickref-data`. Completeness of this accounting is gated by `data_artifacts_accounted`.
- `corpus-embed`, `creators-log-embed` — **GEN** (already). `versions-data` — **KEEP**. `creators-log/*.md` — **KEEP** (log render sources; confirm S8).

**App shell + styles**
- `dashboard.html` — **CHANGE** (pure shell; embeds removed, D1). `styles/design-system.css{,.golden}` — **KEEP** (sealed). Other `.css` — **KEEP**. `legacy-dashboard.css` — **DELETED (Phase A, 2026-07-05)** — full sever, link + host + rule all removed.
- `legacy-dashboard.js` — **DELETED (Phase A, 2026-07-05)** — Luneth: no deferral, full sever now; the #legacy-workspace-host fallback (dead code) + 5 legacy-IIFE invariants were removed with it. `creators-log-handler.js` — **REMOVED (Phase D-review, 2026-07-05)** — it was an unloaded orphan (dashboard.html loads only the bundle) whose target DOM elements + guard (`dashboard_integrity.py`/`check_script_blocks`, itself deleted in Phase A) were already gone; deleted together with the 5 orphaned `cl-data-*` markdown blocks + the dead inline `versions-data` block → dashboard.html is now a TRUE pure shell (1.72 MB / 8112 lines → 6 KB / 128 lines). Content preserved in git + chronicle/creators-log + assets/data/creators-log.
- `assets/*.ttf` — **KEEP**. `assets/*.{jpg,png,pdf}` (backgrounds/themes/slab-masks) — **KEEP**, audit unused (slab-mask variants, `.pdf`).
- `components/*.html` (v3 PROPOSALs) — **KEEP** (read-only design targets). `design-styles/*.jpg` (12) — **RELOCATE** (design inspiration, not shipped).
- `eslint.config.js`, `tsconfig.json`, `package*.json`, `.prettierrc` — **KEEP**.

**Tooling — `tools/`**
- `build.mjs`, `safe_write`, `creators_log`, `hooks/*`, `render_probe*`, `style_diff`, `vendor-tesseract` — **KEEP**. `invariants.py` — **CHANGE** (§4). `genesis.py` — **CHANGE** (S8).
- `build-dashboard.sh` — **DELETE** (superseded by `build.mjs`). `build_ingredients_quickref.py`, `build_regimen_label_lookup.py` — **REPLACE** (fold into `products_derive`/`build_embeds`).

**The rotten middle layer — `knowledge/` (empties out)**
- `essentials-targets.json`, `regimen-label-lookup.json`, `ingredients-quickref.json` — **DELETE** (→ GEN). `products-db.json` — **REPLACE** (→ Pillar 2, hand-mined). `corpus-changelog.md` (242 KB) — **DELETE** (git history holds it).
- `design-wisdom/` (~35 files) — **RELOCATE** (UI design references, not app data). `fringe-knowledge/` (5 md) — **RELOCATE** (Wallach-derived excluded content → designated store under `eden/`; preserved per policy).
- → `knowledge/` likely ceases to exist.

**`schemas/`** — `essentials-targets.schema.json` — **DELETE**. `products-db.schema.json` — **RELOCATE**→`eden/products/`. `versions.schema.json` — **KEEP**.

**Logs + chronicle (SACRED)** — `creators-log/*`, `build-log.md` — **SACRED KEEP**. `contradictions/`, `versions/`, `CHANGELOG`, `OVERHAUL-BLUEPRINT`, `single-source-of-truth-audit` — **KEEP**. `next-chunk.md` — **CHANGE** (rewrite to new plan; drop superseded blocks). `domain-glossary`, `worked-example-chunk`, `finalize-checklist`, `dose-target-matrix`, `restore-audit`, `wallach-fringe-excluded`, `evals/`, `proposals/` — **REVIEW** (S8).

**Governance (audited in S8)** — `CLAUDE.md`, `REVIEW.md`, `README.md`, `.claude/rules/*`, `genesis/*` — **CHANGE/AUDIT**. `genesis/02-clarifications-and-plan.md` — **SUPERSEDED** by this blueprint (archive).

**Dead** — `wallach-refresh/` — **DELETE** (severed podcast/ingest system) — but its `logs/` are FLAGGED below.

### 6.1 · FLAGGED ITEMS — RESOLVED 2026-07-05
1. **`dashboard/.git/`** — investigated: a stray hooks-only directory (no HEAD/refs/objects, untracked, main repo sees `dashboard/` normally) — a misfired `git init`. → **REMOVE** (Phase A).
2. **`wallach-refresh/logs/`** — → **DELETE** with the rest of `wallach-refresh/` (full sever; NOT a sacred log — only the Creator's Log carries the old record).
3. **Root `package.json` / `package-lock.json`** — `puppeteer` for the render probes → **KEEP**.
4. **`labels/`** (scanner test fixtures) — → **RELOCATE** to a new root `tests/scanner-labels/`. *Recommendation: a `tests/` home for test-only data, NOT a scanner app folder — scanner code lives in `dashboard/src`, and fixtures belong with tests; clearly non-poisoning, deletable once the scanner is complete.*
5. **`corpus-changelog.md` (242 KB) + `genesis/01-pre-handoff-conversation.md`** — → **DELETE** (legacy, backed up; git history retains them).

---

## Section 7 — MIGRATION ORDER  `[LOCKED 2026-07-05]`

The sequence from now → the new structure. **Rules:** every phase ends with the board GREEN (build→test→log→repeat); no phase deletes a thing until its replacement generates correctly (never a gap where the app breaks); user-facing changes get visual sign-off; the Creator's Log fires per phase. Ordered by dependency.

- **Phase A — Governance reset + noise purge (S8 runs HERE, first).** Fix the operating files so all later work runs under correct rules: rewrite `CLAUDE.md` + `REVIEW.md` to the Charter/pillar model; audit the 12 `.claude/rules/`; categorize the 43 invariants (delete the 3 rotten-layer guards + `legacy_css_contained`); rewrite `next-chunk.md`, supersede `genesis/02`; audit the 74 memory files. DELETE the clear dead weight: `wallach-refresh/`, `corpus-changelog.md`, `genesis/01`, `dashboard/.git/`, `__pycache__`; relocate `labels/`→`tests/scanner-labels/`. **Full legacy-dashboard sever DONE** (js/css/host/link/rule + 5 legacy-IIFE invariants removed; board 43→38). Add `no_operating_doc_contradiction`. *Nothing new is built — just a clean, correct foundation.*
- **Phase B — Catalog pillar (§2.2).** Build `eden/catalog/` (essentials from canon; `nutrients.json` NEW; conditions/symptoms promoted to catalogs). Absorb `eden-catalog.json`. Seal + verify. Add `references_resolve`. *(nutrients.json later DELETED in D-c → rebuilt in Phase F; see §2.5 Q1.)*
- **Phase C — Derivation pipeline (§3).** Unified `build_embeds` generates every dashboard embed from the pillars; migrate all embeds to esbuild-import (D1); add `derived_artifacts_fresh` + the manifest (D2). **Shift targets to Wallach `dose` claims + add `amounts_wallach_only` — the poison purge** (Youngevity-sourced amounts removed; essentials with no Wallach amount honestly show "no target stated," never a fabricated number). Visual sign-off (coverage numbers shift).
- **Phase D — Collapse the rotten layer (§6).** Only after C's generated data is verified correct: DELETE `knowledge/` + the inline embeds; `dashboard.html` → pure shell; relocate `design-wisdom/` + `fringe-knowledge/`. Add `citations_reference_registry`, `prose_contained` (verbatim = claim pointer, summary = prose store per Q3), `no_hand_duplicated_canonical`.
- **Phase E — Per-surface finalize (§5).** Update views to the new derived data (coverage/goals); Knowledge already clean; scanner wall + `scanner_user_items_marked`. *(Legacy sever already done in Phase A — no legacy fallback remains.)* Per-surface probes + visual sign-off.
- **Phase F — Pillar 2: Youngevity Products — DONE + SEALED.** `eden/products/` built + sealed (products.json + prices.json + warnings.json + README + `products_verify`); `catalog/nutrients.json` rebuilt (408 substances, `references_resolve` substance-half active); `products_derive` feeds coverage composition math + best-sources ranking across the 91 essentials. Full process + schema: `eden/products/README.md`.
- **Phase G — Book mining (vein-selective) → Search validation → seal.** _Expanded + LOCKED 2026-07-09; mining HOW: `.claude/rules/mining-veins.md`._ Finish the corpus by VEINS, not a full-page sweep — mine the rich regions 100%, review-and-disposition the filler with a reason, one seal per vein. Honesty is gated by `mining_coverage_accounted` (a book flips to `complete` only when every page/section is claim-bearing OR reviewed-empty+reason). Sub-phases:
  - **G-1 ✓** Epigenetics dose table · **G-2 ✓** glossary (2026-07-09).
  - **G-3** — adopt the vein doctrine; seed `eden/tools/mining-coverage.json` vein-maps for the remaining books.
  - **G-4** — finish **Immortality**: resume the element encyclopedia at `La-Lanthanum` (char 299,378) through Zr (canon elements tier-1; the ~21 non-canon inert/radioactive → search-only or reviewed-empty), then scan Ch 4–12 narrative for other veins.
  - **G-5** — full **DDDL** re-mine (as a new book, vein-selective; source already pristine).
  - **G-6** — the **3 newly-bought books**: Luneth reads + photographs the chapters he wants; Claude in-houses them (adding each `book_id` to the sealed `books-meta` allowlist with year) and mines the photographed veins.
  - **G-7 — build Search FIRST as the corpus's completeness harness** (offline helper §5.5; resolve D4 = retrieval-first). Search runs over the finished content, surfaces gaps / thin areas, and those feed back into targeted re-mining (loop to G-4/5/6) UNTIL Search is robust + complete enough that no re-mine is needed. _(Luneth 2026-07-09: Search validates the corpus BEFORE we seal it.)_
  - **G-8 — mining close-out + seal-up:** the deferred linguistic/logic sweep, finish source-purification, resolve the 3 parked claim notes + the substance-triage buffer, full R1–R9 re-audit → flip the books `complete` in the ledger → **book mining DONE + sealed.**
  - _Deferred: **Hell's Kitchen** — not in-housed yet; re-open later as its own mini-pass (Luneth's call)._
- **Phase H — App completion + the redesign migration.** **Execution plan: `chronicle/phase-h-migration-blueprint.md`** (the signed-off entity-page redesign carried into the live app, foundation-first, delete-as-you-go, gated — opened 2026-07-11). It folds in: the entity page as the universal presentation unit, the 5-tab Knowledge drawer, the unified Ask-Wallach palette, the product detail + Coverage (D4) pages, and the purge of the old Knowledge/Search system. Also in Phase H: Scanner (⌘3, §5.4), Regimen (⌘2, §5.3), Journey (§5.6) built to spec — one surface to 100% before the next, render probes + Luneth visual sign-off each; and wire every main button still lacking functionality. _(This §5.5 Search spec + §5.2 Knowledge spec are SUPERSEDED by the migration blueprint's new model — do not rebuild a standalone Search drawer or re-open the generative-LLM decision; see the migration doc §3.)_
- **Phase I — Final design touch-up (LAST) + distribution.** Luneth's many small template refinements (`style_diff`-driven; `design-system.css` is sealed → sign-off per change), one global styling pass, the deferred legal/copyright/a11y/i18n pass, and the portable permanently-offline browser wrapper (§5.7).

### 7.1 · The one sequencing risk (flagged, not hidden)
Phase C's Wallach-only targets depend on the corpus having a maintenance-dose claim per essential. Where it doesn't yet, the target is an **honest gap** ("no Wallach target stated") until Phase G mining fills it. This is correct per R2 (no Youngevity fallback) — so the coverage UI's "no target" states are **expected, not a bug**. This is the trade we accept to keep the cornerstone intact.

---

## Section 8 — GOVERNANCE & OPERATING-FILE AUDIT  `[planned — executes in Phase A]`

The rules that guide the work rot too — audit every operating file against the Charter and remove what contradicts it. Surface: `CLAUDE.md`, `.claude/rules/*` (12), `genesis/` boot + `chronicle/next-chunk.md` + `REVIEW.md`, the **74 memory files**, and `tools/invariants.py` (**43 invariants** → categorize KEEP / OBSOLETE / REPLACE / NEW; ≥3 already dead — `wallach_stance_embed_sync/_source_rule/_verbatim_in_book` guard the rotten middle layer). Prose/dead rules removed (marked superseded, never silently), anything alarming/unsure escalated to Luneth, outcomes codified where possible (e.g. a "no operating-doc contradicts the Charter / references a deleted structure" scan, extending `no_dead_legacy_paths`). **Runs EARLY in the migration** so all later implementation operates under correct rules, not rotten ones.
