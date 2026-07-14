# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-13, session wrap)

> ★★★ THIS FILE + the memory files OVERRIDE ALL OLDER BLUEPRINT / PLAN NOTES ("older loses"). Board **63/63** green. Session wrapped after a long run (dead-code purge + gate, font survey, Coverage scoping). **NEXT MAJOR TASK = COVERAGE-TAB OVERHAUL — but Luneth gives DIRECTION FIRST** (design + the single-source-of-truth architecture). THEN return to the unfinished Knowledge-drawer **Conditions + Products** tabs. This file is the temporary rolling handoff; DURABLE principles live in the memory files (read at genesis).

## ★★★★ WHAT SHIPPED THIS SESSION (commit 9a46f55f · pushed)
- **Dead-code purge + FOREVER-GATE.** Removed the Corpus + Doctrine tab corpses (code that survived UI-removal + 10+ sessions of "audits") and wired **`no_new_dead_code` (critical)** into `tools/invariants.py`: runs knip vs `dashboard/knip-baseline.json` (48 accepted migration-scaffold keys; ratchet may only SHRINK) → new orphaned export/file/type turns the board RED. Proven with a negative test. Root cause: removing a tab's UI ≠ deleting its code, and NO gate checked dead code (knip was in package.json but unconfigured → noise → never enforced). See [[prove-completion-dont-narrate-it]].
- **BURN-DOWN owed (deferred, not silent):** the 48 baselined keys = 8 state helpers reserved for pending rounds + 40 zero-runtime zod `z.infer` type-aliases. Delete dead code → prune its key → regenerate.
- **Font survey RESOLVED** (no code change): orange hero line + inline verbatims → KEEP synth italic (Unbounded + Space Grotesk have NO true italic; Luneth: synth looks great, leave it). **Space Grotesk KEPT** as the body face (geometry matches). Accent micro-polish PARKED — candidate **B = JetBrains-Mono UPPERCASE tracked** ("technical designation", Empower lockup DNA; also fixes the wrong italic on chemical names like "Ascorbic Acid") was liked but NOT implemented. Playfair stays only on the ONE crown-jewel Absorption pull-quote.

## ★★★★ NEXT MAJOR TASK — COVERAGE-TAB OVERHAUL (Luneth directs FIRST)
Luneth: "a good bit falls short, both design-wise and coding-wise." **He gives direction on design + architecture BEFORE building.** Verified scope so far:
- **★★ SINGLE SOURCE OF TRUTH (the north star).** ALL periodic-table coverage calculations must flow from ONE canonical per-essential computation. Currently FRAGMENTED — VERIFIED: the goal-cards compute a SEPARATE global-ratio proportional FAKE (`views/coverage.ts:171-174`: `Math.round(coveredCount/totalCount × g.total)` → every goal shows the SAME ~10%), NOT the tile snapshot. The tiles + the 9/90 stat DO read the real snapshot; the goal-cards are the outlier. Another silent failing (glad caught). **Task: map the full coverage-calc graph (`state/coverage.ts` — note `recompute`/`getSnapshot` are knip-baselined; check for stale/parallel paths) + consolidate every coverage number to one source.**
- **2 FAKE numbers to KILL (verified in code):**
  1. Goal-card coverage % (`coverage.ts:171-174`) — the proportional fake above. Real fix needs each goal's own essential list ∩ the user's covered essentials; if `LAYOUT.goals` lacks member essentials, the honest fix is a real state or NO number (never a fabricated one — §00.A).
  2. Regimen-rail "Slot **2 of 5**" (`coverage.ts:222`) — hardcoded literal; no real 5-slot protocol system exists. (Neighboring numbers ARE real: `items.length` + each item's nutrient count.)
- **Header deck** "// what you're absorbing, what you're missing" (`coverage.ts`) — same SYNTH ITALIC we retired everywhere else; drop it to match the futurist pivot.
- **Raise to Knowledge-tab quality** — Luneth defines the specific design gaps (visual-verification: HIS call). The current Coverage tab is already a strong v3 surface (the periodic-table motif is its signature — keep it). Build in PHASES with STOP-for-sign-off ([[gold-standard-page-workflow]], [[screenshot-verify-visual-chunks]]).

## ★★★★ THEN — finish the Knowledge-drawer CONDITIONS + PRODUCTS tabs (return AFTER Coverage)
Luneth (2026-07-13): "we haven't even finished the new conditions and products tabs within the knowledge drawer and I want to get back to that afterwards." Part of the Phase-H entity/knowledge overhaul, INCOMPLETE. Return here after the Coverage overhaul lands.

## ★ FONT SURVEY — essentially DONE (one loose end)
The futurist pivot (Unbounded display + Space Grotesk body via `type-futurist.css` override; [[futurist-type-direction]]) is settled. **Loose end = the FOLD-IN:** fold `type-futurist.css` into the sealed `design-system.css` properly, re-seal the golden (**needs Luneth's sign-off** — sealed canonical), retire the override → restores single-source-of-truth. Also queued: the drifted "Playfair stays" comments in `workspace-coverage.css` now lie (token already flipped to Unbounded) — fix next time in that file.

## ★ BACKLOG (still valid)
- **HK Amish-stats verbatim expansion** — expand HELLS-000004's verbatim if we want the Amish pork angle back as the pork intro (currently = clean IMMORT-000229 red-meat stance).
- **Part A — persistent absorption caveat** across Coverage / Essentials / entity pages (ONE great pointer; restraint [[persuade-dont-shove-restraint]]).
- **Content pass (reseal):** poached-eggs EPIGEN-000155 missing-outcome + a diet-vein OUTCOME AUDIT ([[state-the-outcome-when-known]]); normalise `--`→`—` dashes in diet `answer_short`s (salt's intro still shows `--`).
- **THREAD 2 — Search G-7 + book mining:** SEAL the 2 unsealed search files (`search-enrichment.json` + `catalog/search-entities.json`); resume Immortality A-Z at Mn-Manganese; charged-treatise capture; lay-topic tagging; port the P2 CHARGED gate.
- **Phase-H** entity-page + Search overhaul per `chronicle/OVERHAUL-BLUEPRINT.md` (the Conditions/Products tabs above are part of this).
- Trace/rare small owed (therapeutic-note seal · Cal Toddy label · Group-B factor).

## ★ KEY DOCTRINE (memory files authoritative — read at genesis)
- [[prove-completion-dont-narrate-it]] + [[standards-exception-to-ask-not-assume]] + [[live-supersedes-demo-log-micro-deltas]] (this session's lessons) · [[futurist-type-direction]] · [[visual-design-bar-and-principles]] · [[demo-vision-not-letter]].
- [[hooks-cwd-relative-trap]] (a bare `cd subdir` drifts the shared shell CWD + deadlocks the repo-root-relative hooks; recover via PowerShell `Set-Location <root>`).
- Round-close: build → invariants → probe → build-log → Creator's Log → rebuild → commit + push. New gate `no_new_dead_code` runs on the board.
