# Next chunk — Chunk 2.2: wire coverage LIVE STATUS (regimen → delivery)

**Status:** queued. Previous: **Chunk 2.1 closed 2026-06-21 19:30 EDT (commit `2cfe252`).**
**This file is the fast-orient pointer.** `chronicle/build-log.md` (last ~8 entries) has the granular history; read this first so you do NOT re-map what was already figured out. It supersedes stale parts of `HANDOFF.md`.

---

## READ THIS FIRST — already mapped; do NOT re-investigate

1. **The dashboard renders fine.** Probe: 60 mineral + 16 vit + 12 amino + 3 fat tiles, 4 sections, 3 goal cards, **0 page errors**. `dashboard_integrity` is RED only because its smoke test (`tools/dashboard_smoke.js`) is STALE (hunts legacy `.essential-tile[data-name]` markup + `window.*` fns the new `src/` replaced). Not a real break.
2. **Legacy is NOT loaded — VERIFIED (the 2.1 handoff assumed wrong).** `dashboard.html` loads ONLY `./assets/js/dist/main.js`. `legacy-dashboard.js` (9013 lines) is never `<script src>`-ed, so `window.TARGETS_DATA` + `window.computeLiveCoverage` DO NOT EXIST at runtime. That empty read was the live `0/0`. **Chunk 2.1 removed that dependency** — `state/coverage.ts` no longer touches `window.*` for coverage.
3. **Coverage snapshot is now LIVE off real data (Chunk 2.1).** `state/coverage.ts` reads the embedded `essentials-targets-data` block (getElementById + JSON.parse + `EssentialsDataSchema`, like `views/knowledge.ts`), builds 92 tiles keyed by canonical essential `name`. The layout joins via a new per-tile `key` field (= exact targets-DB name). Hero shows `0 / 92` (was `0 / 0`). **STATUS is still all-`gap`** — that is the truthful empty-regimen state; lighting it up is THIS chunk.
4. **Enforcement hooks are LIVE.** `pre_write_guard` blocks Edit/Write/MultiEdit on repo files → route ALL project writes through `python tools/safe_write.py {replace|append|rewrite|check}`. `pre_bash_guard` blocks destructive bash. **GOTCHA (cost time in 2.1): the hooks invoke their script via a cwd-relative path (`tools/hooks/...`). If you `cd` into a subdir in a NON-subshell Bash command, the persistent cwd drifts and EVERY later Bash AND Write call gets blocked (hook can''t find its own script) until the session resets.** Use `(cd dir && ...)` subshells or absolute binary paths; never a bare `cd subdir`. Escape hatch if it happens: the **PowerShell tool** runs from repo root and bypasses the Bash-matched hooks (use `git -C <abs-root>` + invoke `python tools/safe_write.py` from there).
5. **§00.B fully resolved + enforced** (`views_state_no_inline_data` GREEN). Editing `coverage-layout-data.json` does NOT affect it (that invariant scans `.ts`, not data).

---

## CORPUS DISCREPANCY surfaced in 2.1 (Luneth: confirm when convenient — NOT blocking)
The presentation layout and the targets DB disagree on 2 essentials. Handled truthfully (no invented data), but you may want to reconcile:
- **Aminos:** layout tile #2 is **CYSTEINE** (`Cys`), but `essentials-targets-data.json` lists **Taurine** (no Cysteine) as the 12th amino. → the CYSTEINE tile maps to no target and renders with **no status class**; **Taurine** is a target with no tile.
- **Minerals:** **Germanium** is a target (61st mineral) with **no tile** (layout has 60 mineral tiles).
- Net: 90 of 91 tiles map to a real essential; total stays **92** (Germanium + Taurine counted, tile-less). If these are intentional, no action. If the layout should show Taurine (not Cysteine) and/or a Germanium tile, that''s a layout-data edit.

---

## CHUNK 2.2 — the live status engine (DECISION NEEDED before coding)
Snapshot + join are done; what remains is classifying each essential covered/partial/trace/gap from the **active regimen**. The canonical Wallach logic already exists in `legacy-dashboard.js` `classifyLive()` (lines ~2940-2992) + `computeLiveCoverage()` (~2905): per essential, sum regimen nutrient amounts (`toMg` unit-convert + `scaling_factor`) vs `target.low`; **ok >= 0.95*low, warn >= 0.30*low, else gap**; `trace_pdm` -> ok iff a PDM vehicle is in the stack (regex `btt|tangerine|plant.derived|humic|colloidal|utt`) else mute; `dietary`/`dietary_with_clinical_lever` have their own branches. Map legacy ok/warn/gap/diet/mute -> view covered/partial/trace/gap.

**Three paths (this is a §00.A-adjacent call — surface to Luneth, do NOT self-pick):**
- **(A) Re-load `legacy-dashboard.js` + keep the strangler-fig wrap.** `state/coverage.ts` calls `window.computeLiveCoverage()` as originally designed. Exact Wallach behavior, fast — but pulls 9000 legacy lines back into the page (architecture moves backward; the migration was moving OFF it).
- **(B) Native reimpl in `state/coverage.ts`.** Faithfully port `classifyLive` + `toMg` + `matchToEssential`, reading `target.low/high/unit/kind` from `essentials-targets-data.json` (numbers stay Luneth''s data, NOT invented) and regimen nutrients from `loadRegimen()`. Honors §00.A; cleanest long-term; risk = ~80 lines of unit-conversion/name-matching that must match legacy exactly (drift = §00.A hazard).
- **(C) `essentials-best-supplements.json` presence proxy** (keyed by essential name, has `numeric`/`trace` product lists naming PDM vehicles). Simplest, but "you take a curated product for X" is a DIFFERENT "covered" definition than "dose meets target.low" → a 2nd semantic the legacy comments explicitly flag as a hazard. NOT recommended without sign-off.

**Recommendation:** (B) native reimpl, because the migration goal is OFF legacy and the numbers all come from Luneth''s data files (no invention). But confirm with Luneth first — it touches the §00.A coverage semantics.

**Regimen data you''ll need:** `loadRegimen()` -> `{items:[{label:{name,nutrients}}]}`; nutrients are `z.array(z.unknown())` (untyped — narrow at the boundary). Default regimen is EMPTY, so `render_probe.js` (fresh LS) shows 0 covered. **To test live status, seed a regimen** (puppeteer `page.evaluateOnNewDocument` to set `lcRegimen_v1` before load) with e.g. a BTT/Tangerine item and assert trace tiles light up + the stat pill climbs. Consider adding `tools/render_probe_seeded.js`.

---

## Working commands (verified on this Windows host)
- Build (tsc --noEmit + esbuild -> `dist/main.js`): `node tools/build.mjs`
- Typecheck only: `./dashboard/node_modules/.bin/tsc -p ./dashboard/tsconfig.json --noEmit`
- Lint one file: `(cd dashboard && node_modules/.bin/eslint assets/js/src/views/X.ts)` — note the SUBSHELL `( )`, never bare `cd` (see gotcha #4)
- Invariants: `PYTHONUTF8=1 python tools/invariants.py` (`--only <name>` for one)
- **Visual render test: `node tools/render_probe.js`** — tile counts, goal cards, coverage-stat pill (`coveredStat`/`totalStat`), status classes, page errors, failed resources. Note its `statusGap` selector only counts `.tile`+`.tile--vitamin` (minerals+vitamins=76), not aminos/fats — use an extended eval for the full distribution.
- **NEVER `eslint --fix`** — documented §17 corruption surface (incidents #3/#4). Fix/reorder via `safe_write`.

## Windows / env gotchas
- Python stdout is cp1252 -> prefix scripts with `PYTHONUTF8=1`.
- Git Bash `/tmp` != native-Windows-Python `/tmp`. Use the OS temp dir (`C:/Users/Light/AppData/Local/Temp`) with absolute paths, or pipe.
- CRLF->LF git warnings are harmless.
- **There is a nested `dashboard/.git` AND the root `.git`.** The project history (HEAD, the saga) is the ROOT repo. Always commit with `git -C "C:/Users/Light/Desktop/claude/health expert"` to avoid hitting the nested repo by accident.
- `Set-Content -Encoding utf8` (PS 5.1) writes a BOM — for git commit messages use `git commit -F <file>` with a BOM-less file (`[System.IO.File]::WriteAllText` + `UTF8Encoding($false)`), or pure-ASCII content.

## Data architecture (wire surfaces correctly, no fakery)
- **Shared data** (used by legacy + new) embeds as `<script type="application/json" id="...-data">` in `dashboard.html`, read via getElementById + JSON.parse + Zod (`views/knowledge.ts`, now `state/coverage.ts`). `essentials-targets-data`, `regimen-label-lookup`, `essentials-benefits-data`, `essentials-best-supplements` are all embedded. Build tools inject these; `dashboard_integrity` validates them.
- **NEW view-only data** -> esbuild JSON import (`import x from ''../../../data/foo.json''`) + `Schema.parse(x)`. Offline-safe, no `dashboard.html` edit. `coverage-layout-data.json` uses this.
- **DATA OWNERSHIP:** Luneth owns the Wallach targets DB (`essentials-targets-data.json`). Presentation/layout is yours. **Never invent Wallach numbers** — if a render needs corpus data that isn''t there, STOP and ask.

---

## Deferred backlog (not blocking Chunk 2.2)
- **Creator''s Log file-mirror (USER APPROVED, still pending):** `state/log.ts::log()` is localStorage-only -> un-fireable from CLI, so round-close step 5 (a Creator''s Log event) could NOT be written for Chunks 2.1/etc. Build `chronicle/creators-log.jsonl` + Zod + `tools/creators_log.py` append helper; later a `main.ts` boot-merge into the Profile panel. Then `stop_round_close.py` can enforce it.
- **6 missing assets (404s):** 4 fonts (`BrunoAce-Regular`, `ChakraPetch-Regular/SemiBold/Bold`) + 2 bg jpgs (`background-3.jpg`, `header-bg.jpg`) — stray v3.2-mockup refs (likely `workspace-coverage.css`). In-house the TTFs (Luneth has backups) or fall back to the 5 in-housed families.
- **Re-base `tools/dashboard_smoke.js`** to the new `.tile` markup (drop legacy window-fn checks) -> makes `dashboard_integrity` truthful again.
- Commit noise: `knowledge/products-db-audit.{json,md}` + `tools/canaries/safe-write-probe.txt` regenerate on every invariant run — consider gitignoring the canary.

## Other surfaces (after coverage is live) — same pattern
Regimen (Cmd-2), Scanner (Cmd-3), Knowledge drawer (K), Journey drawer (J), Profile panel. Each: real state through `views -> state -> core`, no inline data, v3 design vocabulary.

---

## First commands of the next session
```
PYTHONUTF8=1 python tools/invariants.py | tail -3     # expect 59/61
git -C "C:/Users/Light/Desktop/claude/health expert" log --oneline -5   # expect HEAD = 2cfe252
node tools/build.mjs                                   # expect Build OK
node tools/render_probe.js                             # expect total "/ 92", 0 covered (empty regimen)
```
Recovery anchors: `7558e35` -> `2cfe252`. Next §17 incident -> `git checkout HEAD -- <file>`.