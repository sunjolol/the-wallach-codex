# Next chunk — FULL OVERHAUL IN PROGRESS. Active plan = `chronicle/OVERHAUL-BLUEPRINT.md` (locked in full 2026-07-05, 8 sections). This handoff points there. Do NOT resume the old SESSION-49 stance sweep — it is SUPERSEDED by the overhaul.

## WHERE WE ARE (2026-07-05)
The project pivoted from whack-a-mole bug-fixing to a full structural overhaul after Luneth caught that book citations were hand-typed ~200× (drifting from the sealed registry — the year said 1999 while the registry says 2011). We designed the ENTIRE system on paper first (the blueprint) before implementing. **Core model:** TWO hand-edited sealed sources — Wallach Corpus (`eden/corpus/`, live) + Youngevity Products (`eden/products/`, hand-built later) — plus a shared Catalog (`eden/catalog/`: essentials · nutrients · conditions · symptoms). **Everything else is GENERATED + freshness-gated** so drift can't ship. The rotten middle layer (`knowledge/essentials-targets.json` → embeds → Coverage) collapses into the clean `eden → derive → views` system. Read the blueprint for the Charter (R1–R9), the data model, the pipeline, the enforcement table, per-surface plans, file disposition, and the 9-phase migration.

## DONE THIS SESSION (all committed + pushed; board 38/38 green)
- **P0** (`8aae6d8`) — corrected the wrong DDDL citation year 1999→2011 + a stale Fluoride benefits card (live drifts).
- **Blueprint** (`9da6bc6`) — `OVERHAUL-BLUEPRINT.md` locked in full, 8 sections, Charter R1–R9, every section Luneth-verified.
- **Phase A noise purge** (`20ac372`) — deleted `wallach-refresh/`, `corpus-changelog.md`, `genesis/01`, stray `dashboard/.git/`; moved `labels/`→`tests/scanner-labels/`.
- **Phase A legacy sever** (`fca48c9`) — DELETED the entire legacy dashboard (js/css + `#legacy-workspace-host` DOM + `main.ts` fallback) + 5 legacy-IIFE invariants (board 43→38). App verified working across coverage/scanner/knowledge. Luneth: no deferral, gone for good.
- **Phase A CLAUDE.md rewrite** (`8de0a3e`) — rewrote the operating contract to the pillar model + Wallach-only-amounts + the Charter (the reboot trigger).
- **Phase A rules audit** (`72d2d71`) — reconciled the 12 `.claude/rules/` + `REVIEW.md` to the Charter. Rewrote `source-rule.md` (two-role split RETIRED → Wallach drives every amount, Youngevity = composition only; pack-extrapolation-as-target → "Retired/poison"; Enforcement split CURRENT-vs-WISH per R7). Fixed `chokepoint-discipline.md` (lint = `no-restricted-globals` WARN; `regimen_state_mutation_routing` noted WISH, re-gated Phase C). DELETED `wild-west-mode.md` — legal/copyright pass deferred to END of build (now memory `legal-copyright-pass-at-end.md` + finalize-checklist §4). 8 other rule files clean; `data-flow.md` + `REVIEW.md` flagged accurate-today (doomed-invariant ref; five-vs-seven round-close), left for their retiring phase.

## PHASE A REMAINING (governance reset — blueprint §8; finish BEFORE building pillars)
★ **CHARTER PERMANENT HOME** — R1–R9 live only in the temporary/living blueprint; promote them to a permanent rule file so they survive the blueprint's pruning. CLAUDE.md references it.
★ **74-MEMORY AUDIT** — the memory files (`C:\Users\Light\.claude\projects\C--Users-Light-Desktop-claude-health-expert\memory\`) encode OLD approaches (middle layer, stance sweep, Youngevity-targets). Audit against the blueprint; prune/mark-superseded the contradictions. ⚠ **Until done, recalled memories may contradict the new model — CLAUDE.md + the blueprint are authoritative.**
★ `genesis/02-clarifications-and-plan.md` — mark SUPERSEDED by the blueprint (archive).
★ ADD `no_operating_doc_contradiction` gate — a scan that no operating doc contradicts the Charter / references a deleted structure (extends `no_dead_legacy_paths`).

## THEN — blueprint §7 migration order
Phase B Catalog pillar → **Phase C derivation pipeline (the poison purge: targets ← Wallach `dose` claims + `amounts_wallach_only`; honest "no target stated" gaps where no claim exists yet — Luneth pre-approved that loss)** → Phase D collapse the rotten middle layer → Phase E per-surface finalize → Phase F Pillar 2 (Youngevity, Luneth hand-mines) → Phase G resume book mining → Phase H Search (retrieval-first) → Phase I Journey (last) + portable-offline-browser.

## OLD BACKLOG (SESSION 48/49) — SUBSUMED, not lost
menaquinone→phylloquinone book correction + K1/K2 alert-box → Phase E/G · target-number-shift → Phase C · archaic-rules audit → Phase A rules audit (above) · Immortality/DDDL re-mine → Phase G. The blueprint is authoritative.

## IMMEDIATE NEXT TASK = the remaining Phase A governance items (any order; genesis will ask).
Suggested next: **Charter permanent home** (small, self-contained — promote R1–R9 out of the temporary/living blueprint so pruning can't lose them; CLAUDE.md already references "the Charter" as if it has one). Then the **74-memory audit** (larger; stale memories actively mislead until done — the ⚠ above). Also owed: genesis/02 supersede-archive + the `no_operating_doc_contradiction` gate.
Board: 38/38 green. Tree clean after the rules-audit commit (`72d2d71`).
