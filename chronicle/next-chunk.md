# Next chunk — Chunk 2: wire coverage STATUS to real data

**Status:** queued. Previous: Chunk 1.3 closed 2026-06-21 18:52 EDT (commit `d0d5efb`).
**This file is the fast-orient pointer.** `chronicle/build-log.md` (last ~7 entries) has the granular history; read this first so you do NOT re-map what was already figured out. It supersedes stale parts of `HANDOFF.md` (which described the pre-work state).

---

## READ THIS FIRST — already mapped; do NOT re-investigate

1. **The dashboard is NOT broken — it renders.** Headless probe: 60 mineral + 16 vitamin + 12 amino + 3 fat tiles, 4 sections, 3 goal cards, **0 page errors**. The `dashboard_integrity` invariant is RED only because its smoke test (`tools/dashboard_smoke.js`) is a STALE legacy-contract test: it hunts `.essential-tile[data-name]` markup + legacy `window.*` fns (`buildDataExport`, `lsRead`, "Pass F") that the new `src/` architecture deliberately replaced. **Do not chase "why is the dashboard broken." It isn't.**
2. **The enforcement hooks are LIVE** (loaded from `.claude/settings.json` at session start):
   - `pre_write_guard` BLOCKS Edit/Write/MultiEdit on any repo file → route ALL project writes through `python tools/safe_write.py {replace|append|rewrite|check}`. Stage payloads in the OS temp dir (outside the repo); the Write tool is fine for scratch files there.
   - `pre_bash_guard` blocks destructive bash (`git push --force`, `git reset --hard`, catastrophic `rm -rf`, direct `>`/`tee`/`sed -i` into banned dirs). `safe_write.py` invocations are exempt.
3. **`invariants.py` runs clean on Windows now** (UTF-8 forced). Board = **59/61**. The only 2 reds: `dashboard_integrity` (stale, see #1) and `tacitus_rest_day_observed` (user-pardoned Sat write; self-expires next Saturday). Both are documented baseline-tolerated. A regression below 59 is a real alarm.
4. **§00.B is fully resolved + enforced.** `coverage.ts` is a pure renderer over `assets/data/coverage-layout-data.json` (Zod via `core/schemas/coverage-layout.ts`). The `views_state_no_inline_data` invariant is GREEN and accurate (trailing-comma off-by-one fixed in 1.3).

---

## Working commands (verified on this Windows host)
- Build (tsc --noEmit + esbuild → `dist/main.js`): `node tools/build.mjs`
- Typecheck only: `./dashboard/node_modules/.bin/tsc -p ./dashboard/tsconfig.json --noEmit`
- Lint one file: `(cd dashboard && node_modules/.bin/eslint assets/js/src/views/X.ts)`
- Invariants: `PYTHONUTF8=1 python tools/invariants.py` (add `--only <name>` for one)
- **Visual render test: `node tools/render_probe.js`** — reports tile counts, goal cards, coverage-stat pill, status classes (covered/gap), page errors, failed resources. This is your build→test loop's eyes (the smoke test is stale).
- **NEVER `eslint --fix`** — documented §17 corruption surface (incidents #3/#4). Fix/reorder via `safe_write`.

## Windows gotchas (cost time last session)
- Python stdout is cp1252 → prefix audit/scripts with `PYTHONUTF8=1`.
- Git Bash `/tmp` ≠ native-Windows-Python `/tmp`. Do NOT write a file in bash `/tmp` then read it in Python. Pipe (`node x | python -c ...`) or use the OS temp dir (`C:/Users/Light/AppData/Local/Temp`) with absolute paths for both writer and reader.
- CRLF→LF git warnings are harmless.
- Avoid `cd` inside a compound bash command (permission prompt) — use direct binary paths or a `( … )` subshell.

## Data architecture (wire surfaces correctly, no fakery)
- Legacy/shared data embeds as `<script type="application/json" id="…-data">` in `dashboard.html`, read via `getElementById` + `JSON.parse` + Zod (see `views/knowledge.ts`). Build tools inject these (`tools/build_*.py`); `dashboard_integrity` tracks/validates them.
- NEW view-only data → **esbuild JSON import** (`import x from '../../../data/foo.json'`) + `Schema.parse(x)` at the boundary. Offline-safe, no `dashboard.html` edit (`resolveJsonModule` is on). This is what coverage-layout uses.
- **DATA OWNERSHIP:** Luneth owns the Wallach targets DB (`essentials-targets-data.json`) and will fill correct numbers later. Build the MACHINERY to spec; presentation/layout is yours. **Never invent Wallach numbers** — if a render needs corpus data that isn't there, STOP and ask (he has full backups and can reproduce anything named).

---

## CHUNK 2 — make coverage LIVE
`coverage.ts` renders the layout, but tile STATUS + the hero count come from `state/coverage.ts`'s `CoverageSnapshot`, which reads `window.TARGETS_DATA` + legacy `window.computeLiveCoverage`. The original §00.B smoking gun was a live `0/0` because that snapshot was empty.
- **First, verify reality, don't assume:** `dashboard.html` loads `legacy-dashboard.js`, so `window.TARGETS_DATA` + `computeLiveCoverage` MAY already be populated. Run `node tools/render_probe.js` and check `coveredStat`/`totalStat` + `statusCovered`/`statusGap`. If totalStat is 92 → snapshot is live; if 0 → wire it.
- **Goal:** tile status (covered/partial/trace/gap) + section + hero counts ALL derive from the one snapshot. No divergent counts. Trace minerals = "covered by presence" (PDM aggregate-vehicle rule, already in `state/coverage.ts` DOCT·02).
- Tight chunks, build→test→log→commit. Test with `render_probe.js` (status classes + stat pill) + invariants.

---

## Deferred backlog (not blocking Chunk 2)
- **Creator's Log file-mirror (USER APPROVED):** `state/log.ts::log()` is localStorage-only → un-fireable from CLI. Build `chronicle/creators-log.jsonl` + Zod + `tools/creators_log.py` append helper so round-close events are CLI-writable; later a `main.ts` boot-merge so they surface in the Profile panel. Then `stop_round_close.py` + `post_write_verify.py` hooks can enforce it (fail-safe; check `stop_hook_active`).
- **6 missing assets (404s):** 4 fonts (`BrunoAce-Regular`, `ChakraPetch-Regular/SemiBold/Bold`) + 2 bg jpgs (`background-3.jpg`, `header-bg.jpg`) — stray v3.2-mockup refs (likely `workspace-coverage.css`). Either in-house the TTFs (Luneth has backups) or fall back to the 5 in-housed families. Also a stray `../assets/styles/design-system.css` ref in `dashboard.html` (the `./` one is correct).
- **Re-base `tools/dashboard_smoke.js`** to the new architecture (new `.tile` markup, drop legacy window-fn checks) → makes `dashboard_integrity` a truthful signal again.
- 3 stale `brain/current.md` refs in `invariants.py` (~lines 788, 3555, 3871) + `brain_version_sync` success-string still cosmetically says "brain/versions/".
- Commit noise: `knowledge/products-db-audit.{json,md}` + `tools/canaries/safe-write-probe.txt` churn on every commit (regenerated by invariant runs) — consider gitignoring the canary.

## Other surfaces (after coverage is live) — same pattern
Regimen (⌘2), Scanner (⌘3), Knowledge drawer (K), Journey drawer (J), Profile panel. Each: real state through `views → state → core`, no inline data, v3 design vocabulary.

---

## First commands of the next session
```
PYTHONUTF8=1 python tools/invariants.py | tail -3     # expect 59/61
git log --oneline -5                                   # expect HEAD = d0d5efb
node tools/build.mjs                                   # expect Build OK
node tools/render_probe.js                             # see current coverage render + status
```
Recovery anchors: `a8e1bd2` → `6060960` → `44d65de` → `d0d5efb`. Next §17 incident → `git checkout HEAD -- <file>`.
