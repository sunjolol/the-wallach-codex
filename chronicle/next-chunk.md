# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-14, session wrap)

> ★★★ THIS FILE + the memory files OVERRIDE ALL OLDER BLUEPRINT / PLAN / DEMO NOTES ("older loses"). Board **64/64** green. **NEXT = finish the goals-first Coverage UX overhaul (below).** The PHAZON detour is PARKED and fully reverted — do not reopen it. This file is the temporary rolling handoff; DURABLE principles live in the memory files (read at genesis).

## ★★★★ START HERE NEXT SESSION

**Resume the Coverage UX overhaul, exactly where it paused.** There is UNCOMMITTED work in the tree (below) — read it before touching anything. Luneth's remaining asks, in his order.

### The tree is DIRTY on purpose — the paused UX work
Uncommitted, working, board-green, NOT yet visually signed off:
- `views/coverage.ts` — the goals strip is replaced by **the CONSOLE**: goals promoted ABOVE the table as compact chips (his ask: "it feels like it should be the first thing you see"), plus the orange kicker line he wanted back ("// what you're absorbing, what you're missing").
- `workspace-coverage.css` — the console block; the old `.goals-strip` / `.goal-card` CSS is deleted.
- `view-copy.json` — `+cov_console_q`, `−cov_goal_pending`.
- `render_probe.js` — `.goal-card` → `.goal-chip` (the old selector reported goals:0 against markup that no longer exists).

★ **The chips deliberately show NO ratio.** Real membership needs `eden/catalog/goals.json`, which does not exist. The old goal cards fabricated BOTH numbers; typing a plausible ratio in to make it look finished would re-commit exactly that. **Decide with Luneth: commit this as-is, or keep iterating before committing.**

### What Luneth still wants on Coverage (his items, unstarted)
1. **The TOP BAR overhaul** (his items 3/5/6, creative freedom granted; he named the Knowledge drawer + Absorption tab as the quality bar). ⚠ The kicker is currently DUPLICATED — the topbar still says `// WHERE YOU ARE, WHAT YOU'RE MISSING` while the console says `// what you're absorbing…`. The topbar's copy dies here.
2. **Phase 2b — wire the GOALS live.** Author `eden/catalog/goals.json` (goal → CONDITION slugs; the ONLY human authoring, every slug catalog-resolvable → gated by `references_resolve`). Members = essentials whose corpus-derived `conditions_treated` ∩ the goal's conditions. Coverage = members ∩ the snapshot's covered tiles. Zero new amounts → §00.A clean. Probe: bone/skeletal derives **27 real members** vs the hand-typed 14. **Honest caveat: 30 of 91 essentials have NO `conditions_treated` yet** — sparse goals stay sparse, never padded.
3. **Then the RECOMMENDER** ("top 10 products for all goals, or top 4 per goal — I'm just not sure"). The chips ARE the mechanism: all six lit = "top 10 for all goals". ⚠ **BLOCKER — see the unit bug below.**
4. **The RAIL** ("the daily protocol tab on the right would also be refined in this same way"). Honest now (0 items) but untouched.

## ★★★★ SHIPPED THIS SESSION (2 commits, pushed)
- **`f4d20292` — a11y.** `prefers-reduced-motion` capped animation-DURATION but never ITERATION-COUNT, so an `infinite` animation didn't stop, it ran at **~100Hz**. 7 painted elements strobing for exactly the users who asked for less motion. One line fixed it (sealed `design-system.css`, golden re-sealed with sign-off). **NEW GATE** `tools/render_probe_reduced_motion.js`, anchored to computed style in a real browser (a CSS grep would be satisfied by a reworded rule); proven with a negative test (7 offenders/exit 1 → 0/exit 0). ⚠ **KNOWN GAP: the gate reads CSS animations only — it is BLIND to canvas/rAF.** Labeled WISH.
- **`86cbadda` — the starter pack is gone.** A fresh user was silently credited with 3 products they never agreed to (HBSP demo seed merged into the real stack). True empty state is **4/90, not 13/90**. Nothing lost — all 3 live in the Products pillar, so the pak becomes a *recommendation* instead of a pre-fill.

## ★★★★ THE PHAZON DETOUR — PARKED, DO NOT REOPEN
A long stylistic exploration (Metroid-Prime phazon theme). **Fully reverted from the live dashboard and grep-proven gone** (16 tokens checked: plasma-strip/plasma-window/reactor/light-mesh/data-light-mode/ds-filter-goo/…). Everything is recorded in the design-wisdom library:
- **5 references** filed as **#029–#033** (`design-wisdom/references/`, catalogued in `references-data.json` + `index.md`). ⚠ codepen returned **403** — these pastes are the ONLY copy. Byte-exactness verified.
- **The full direction + every lesson:** `design-wisdom/learnings/2026-07-14-phazon-direction.md`.
- **The mockup + a faithful Plasma-2 replica + renders:** `design-wisdom/applications/phazon/`.
- ⚠ **`applications/phazon/images/README.md` has 5 EMPTY SLOTS** — Luneth's Metroid reference images. Claude cannot save chat attachments to disk; **Luneth must drop them in.** Detailed descriptions stand in until he does.
- ★ **The ONE thing carried forward:** a toggleable **DARK THEME** — see [[dark-theme-is-a-planned-toggle]]. Cream stays default; dark is a future option; build new elements anticipating a dark counterpart so the toggle isn't a retrofit. **Not started, and not a now-task.**

## ★ REAL DEFECTS FOUND, NOT YET FIXED (each verified live)
- **★ RECOMMENDER UNIT BUG — blocks the goal-recommendations work (#3 above).** `rankSources` (`state/recommender.ts:98`) computes `adequacy = min(1, amount / targetLow)` with **NO unit reconciliation**. Exactly 2 essentials mismatch: **boron** (products in mcg, target 9.2 **mg**) reads adequacy **1.0000** for all 4 candidates when the truth is 0.16–0.54 — adequacy is the 0.6-weight keystone and it SATURATES, so the ranking silently collapses to breadth+price; **silver** (products in mg, target 400 **mcg**) reads 0.0001 where the truth is 0.10. Also `views/knowledge-products.ts:291`'s comment ("Today every target is an honest gap") is DRIFTED — 35 targets carry numeric lows since Phase C2.
- **THE CHROME IS ALL FABRICATED** (the audit that started this session). Topbar: `SYNCED` + pulse-dot (no sync system exists, and can't — offline; a second copy survives at `views/regimen.ts:247`), `CODEX v3.27` (that's the **brain** version, not the app's — the app is `dashboard: 1.106`), `WS·01` (no workspace numbering exists), and the `COVERAGE` h1 is **hardcoded** — false on 5 of 6 workspaces. Footer: `READY · all systems` (nothing computes readiness), `EDEN v1 · sealed 8E594A01` (**a real hash of a DELETED file**, sealed at products=201; the pillar holds 215), `BUILD v3 · native` (build.mjs stamps nothing). The `.pulse-dot` doesn't pulse (no animation property). The chrome `.ds-cipher`s are **inert** (the engine is scoped to the view mount).
- **`nutrientToGoalMap` is poison-in-waiting** (`scanner-corpus-data.json`): 66 hand-typed goal→nutrient entries, **13 stating a Wallach-attributed DOSE with no claim id** ("Wallach: 4 g/day clinical for memory / focus"). NOT live — `state/scanner.ts:373` reads only `gn.nutrient`, never `why`. But it is the obvious shortcut for goal chips and MUST NOT be used; the corpus-derived `conditions_treated` route is the plan.
- **SIZE BUDGET BLOWN 4.9x.** `dist/main.js` = **1,227,022 B gzipped** vs the declared 250KB. `size-limit` is configured correctly — it just isn't in the round-close, so it never runs. (CSS fine: 55KB/150KB.)
- **`main.ts` fails lint at HEAD** (3 pre-existing errors: import sort, useless return, padded block). Not mine; untouched.

## ★ KEY DOCTRINE (memory files authoritative — read at genesis)
- **NEW:** [[webgl-headless-context-loss]] (★★ headless WebGL shots LIE — `--use-gl=swiftshader` loses the context → identical shots + `aPos: -1` + white; use `--use-angle=swiftshader`. **The general lesson: when N different edits produce byte-identical output, suspect the INSTRUMENT.** It cost most of a session, and the same class of error bit twice more — a greedy regex "disproved" byte-preservation that was fine) · [[safe-write-multi-edit-clobber]] (★ 2 edits to one file in a safe_rewrite script = the last write silently clobbers the first; chain onto ONE in-memory copy. Code edits get caught by tsc; **comment edits have no gate**) · [[dark-theme-is-a-planned-toggle]].
- ★★ **Render the reference BEFORE adapting it** ([[signed-off-demo-is-the-spec]], [[demo-vision-not-letter]]). Reference #032's two apparent filter bugs ARE its effect; "fixing" them unrendered destroyed the look. **The render is the arbiter, never the code's apparent intent.**
- [[prove-completion-dont-narrate-it]] · [[screenshot-verify-visual-chunks]] · [[pin-the-exact-element-dont-overcorrect]] · [[token-indirection-grep-the-readers]] · [[visual-design-bar-and-principles]] (NO L-brackets).
- [[hooks-cwd-relative-trap]] — a bare `cd subdir` drifts the shared CWD + deadlocks the repo-root-relative hooks; recover via PowerShell `Set-Location <root>`. **Bit twice this session — always use a subshell: `(cd dashboard && …)`.**
- [[safe-write-crlf-flip]] — stage payloads with the Write tool, NEVER a bash heredoc (a heredoc ate backslashes in a probe this session).
- Round-close: build → invariants → probe → build-log → Creator's Log → **rebuild** → commit + push. `creators_log.py --summary` hard-capped at **280 chars**; `--kind` must be one of the enum (`design-decision`, not `decision`).
