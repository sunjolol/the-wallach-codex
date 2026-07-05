# Single-Source-of-Truth Audit — 2026-07-05

_A full inventory of every canonical→derived data pairing in the repo, whether a machine guards it, and the remediation plan. Triggered when Luneth caught the DDDL citation year hardcoded as "1999" ~200 times while the sealed registry says 2011._

---

## Why this exists (the root defect)

CLAUDE.md §00.B asserts two guarantees: principle **#3** — _"no information lives in two places without an enforced sync"_ — and the operational rule _"every rule that CAN be enforced by a hook, lint, or invariant IS."_ **Both are overstated.** The reality, measured 2026-07-05:

- There are **43 invariants**. ~15 enforce some sync. **Each is hand-written for one specific pair of surfaces.** There is no general guarantee.
- "No duplication without enforced sync" holds **only where a specific check was written for that specific duplication.** It is a patchwork, not a law.
- Where the discipline was applied (Creator's Log, corpus) drift is impossible. Where it was not (essentials benefits/best-supplements/coverage-layout, all book citations) copies were created as hand-maintained parallel files with **no paired guard**, and nothing in the round-close ritual or doctrine required one.

So a "#1 rule" was breakable because it was never universally enforced — only guarded in the spots we built guards. The doctrine's wording created a false sense of a guarantee that does not exist. **That false confidence is itself a defect** (a doctrine that overstates enforcement violates the logging-doctrine "never poison the future" rule). This audit + the P-plan below correct it.

**The model to emulate:** the project already contains a perfect pattern — the **Creator's Log**: derive the copies, then pin every derived copy to its source with a content invariant at critical severity (`creators_log_{embed,bundle,digest,archive}_synced` + `_append_only`). Where that shape is applied, drift cannot ship.

---

## The inventory (measured 2026-07-05)

### A · Essentials data (the 90/91 nutrients) — worst-covered, user-facing core
Canonical list: `eden/corpus/essentials-canon.json` (sealed). Canonical targets+stances: `knowledge/essentials-targets.json`.

| Derived copy | Enforcement | Status |
|---|---|---|
| `dashboard/assets/data/essentials-targets-data.json` (flat) | stance dict only via `wallach_stance_embed_sync` (**warning**) | targets/names **unguarded** |
| `#essentials-targets-data` embed | same (stance dict, canonical↔embed only) | matches now |
| `essentials-benefits-data.json` + `#essentials-benefits-data` | **NONE** | **DRIFTED (live):** embed 96 entries vs file 95 — stale `Fluoride` left in shipped embed |
| `essentials-best-supplements.json` + embed | **NONE** | matches by luck, not guard |
| `coverage-layout-data.json` | **NONE** | drifted before (Taurine/Phylloquinone) — fixed **by hand** S47–48 |
| `dashboard/assets/js/legacy-dashboard.js` | **NONE** | stale 4th copy (202 essential/stance refs) |
| name-set vs sealed `essentials-canon.json` | **NONE** | canon list tied to no embed — the reason Fluoride & Taurine could drift |

### B · Book bibliographic metadata
Canonical: `eden/corpus/books-meta.json` (sealed) — DDDL **2011**, Rare Earths **1994**, LPD 1995, Epigenetics 2014, Immortality 2008, IAIYH 2020.
Derived: hand-written display strings — ~45 / 56 / 59 / 51 copies across the 4 files above. Enforcement: **NONE** (`wallach_stance_source_rule` only checks the citation contains an allowlisted *word*). Status: **13 distinct forms; 3 contradictory for DDDL** ("(Wallach, 1999)", "(2011 edition, …)", "(1994 lecture)"); contradicts the registry.

### C · Corpus / claims — well guarded
`corpus_integrity`, `corpus_embed_synced`, `eden_hash_integrity`. Exception: `ingredients-embed` (derived from corpus) has 0 content guard — matches now, unenforced.

### D · Creator's Log — GOLD STANDARD
ledger → embed → built bundle → digest → archive, each pinned by its own invariant (5). Drift cannot ship. **The template for A + B.**

### E · Versions — guarded
`versions-data.json` (single sanctioned writer `version_bump.py`) → embed. 2 guards, matches.

### F · Version-stamp-only (weak)
`goal-recommendations-data`, `regimen-label-lookup`: `eden_embeds_match_canonical` checks a **version number**, not content. Passes even if content drifted, as long as the stamp was bumped.

### G · Sealed files (file-integrity only)
design-system, eden-catalog, graphics, claims, indices, books-meta, knowledge-version each carry a golden hash. Guards the **file** against edits — does **not** guard that derived copies match it.

---

## Drifts found by this audit
1. **Book citations** — 1999 vs sealed-registry 2011 (+ 2 other contradictory DDDL forms). Live.
2. **Benefits embed** — stale `Fluoride` (96 vs 95). Live. _(Direction to fix: verify against `essentials-canon.json` — if Fluoride is non-canon, the file is correct and the embed is stale.)_
3. **Coverage-layout** — Taurine/Phylloquinone. Past; hand-fixed S47–48 (evidence the gap is real and recurring).

---

## Remediation plan (separate chunks, each with sign-off)

- [ ] **P0 — stop the live bleed.** Correct the benefits/Fluoride drift + the 1999 citations so nothing shipping is wrong while the structure is built. Data-only, objective correctness.
- [ ] **P1 — citation model.** Citations become `{book_id, locator}` resolved from `books-meta.json`; display composed at build. New invariant `citations_reference_registry` (**critical**): every reference resolves to a real `book_id` and **zero** hand-written "Title (…, YYYY)" strings survive. Applies to `wallach_stance.citation` + the `source`/clinical-dose fields.
- [ ] **P2 — generate-at-build for essentials** (Luneth: generate, not just guard). Regenerate benefits/best-supplements/coverage/targets embeds + data.json from `knowledge/essentials-targets.json` at build time so drift is structurally impossible. Add `dashboard_embeds_match_source` (**critical**, all 8 data embeds) + `embeds_match_essentials_canon` (name-set vs sealed canon).
- [ ] **P3 — process + doctrine.** Amend §00.B to the honest posture and add the missing rule: _introducing a derived/duplicated copy without its sync-or-derivation invariant in the same patch is itself a violation._ Add it as a round-close checklist gate.
- [ ] **P4 — retire `legacy-dashboard.js`'s data copy** (indefensible 4th copy once P2 lands).

### Decisions locked (2026-07-05)
- **Chunking:** separate reviewable chunks, P0 → P1 → P2 → P3(→P4), each with its own sign-off.
- **P2 mechanism:** generate-at-build (structural impossibility), not keep-and-guard.
- The 14-vitamin stance content (well-rounded summaries + Table 11-9 verbatims) is **approved and pending** — it lands into the clean citation model (after P1), not the old hand-written one.

### The process rule going forward
No finite invariant set can auto-detect every duplication. Enforcement = **discipline** (every new derived copy ships with its guard in the same patch) + a **growing net** of content invariants + the doctrine correction (P3). This audit is the map; check items off as they land.
