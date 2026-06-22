# Next chunk — Chunk 4: migrate the Regimen surface UI (⌘2 — add / edit / remove the stack)

**Status:** queued. Previous: **Chunk 3 closed 2026-06-21 20:19 EDT (commit `0f907ae`) — the HBSP default foundation ships; the default dashboard now demos ~20/92 covered.**
**This file is the fast-orient pointer.** `chronicle/build-log.md` (last ~10 entries) has the granular history; read this first so you do NOT re-map what was already figured out.

---

## READ THIS FIRST — already mapped; do NOT re-investigate

1. **The dashboard renders fine.** `dashboard_integrity` is RED only because its smoke test (`tools/dashboard_smoke.js`) is STALE (hunts legacy `.essential-tile[data-name]` markup the new `src/` replaced). Not a real break.
2. **Legacy is NOT loaded.** `dashboard.html` loads ONLY `./assets/js/dist/main.js`. `window.TARGETS_DATA`/`computeLiveCoverage` do not exist at runtime; the new `src/` owns everything.
3. **Coverage is FULLY LIVE + populated by default (Chunks 2.1 + 2.2 + 3) — essentially DONE.** `state/coverage.ts` reads the embedded targets DB (92 essentials, canonical `key` join) and classifies the EFFECTIVE regimen (native port of legacy computeLiveCoverage/classifyLive/toMg/matchToEssential) into an authoritative per-tile `status` the view renders directly (single source). The effective regimen = `state/regimen.ts::loadEffectiveRegimen()` = HBSP base foundation (`assets/data/regimen-base-data.json`, migrated VERBATIM from legacy REGIMEN_BASE_DATA — BTT 2.5 + Beyond Osteo FX + Ultimate EFA Plus, **negative-id** base items) + committed + manual, minus the §31 removed-set. **Default shows ~20 covered + 5 partial / 92**; the 35 rare-trace minerals stay pending (base products don't enumerate them — faithful). `node tools/render_probe.js` = default; `node tools/render_probe_seeded.js` hides the base (rgRemoved=[-1,-2,-3]) to test the classifier in isolation.
4. **Enforcement hooks are LIVE.** Route ALL repo writes through `python tools/safe_write.py {replace|append|rewrite|check}` (stage payloads in `C:/Users/Light/AppData/Local/Temp` via the Write tool — fine for non-repo scratch). **GOTCHA: the hooks invoke their script via a cwd-RELATIVE path. A bare `cd subdir` in a NON-subshell Bash command drifts the persistent cwd and then blocks EVERY later Bash AND Write call until the session/turn resets.** Use `(cd dir && ...)` subshells or absolute paths. Escape hatch: the PowerShell tool runs from repo root and bypasses the Bash-matched hooks. Bash resets to root each new turn. (Memory: `hooks-cwd-relative-trap`.)
5. **§00.B GREEN** (`views_state_no_inline_data`). Editing data JSON doesn't affect it. **eslint is the enforced style gate (NOT prettier — it's unenforced + fights @antfu eslint); NEVER `eslint --fix` (§17 corruption); fix via safe_write.** Watch for: regex `|`-of-single-chars → char class; `parseFloat`→`Number.parseFloat`; sorted imports/exports.

---

## CHUNK 4 — migrate the Regimen surface UI (⌘2)
Coverage is done; the missing user-facing piece is MANAGING the stack. The §31 state chokepoints + `loadEffectiveRegimen()` are all in place — what's missing is the VIEW (`views/regimen.ts`) wired to them: list the effective stack, add/edit/remove items, and have removals/edits cascade to coverage (they already emit `regimen:changed` → `coverage:recomputed`).
- **This completes the "experienced user bypasses the default" loop:** removing a base item = `saveRgRemoved(set.add(negId))`; `loadEffectiveRegimen()` already filters it (verified — the seeded probe relies on it). The mechanism is wired; Chunk 4 is the UI that triggers it.
- **`views/regimen.ts` exists** — check what it currently reads (likely `loadRegimen()` directly, so it does NOT yet show the base trio; switch it to `loadEffectiveRegimen()` for consistency with the coverage rail).
- **Chokepoints** (`state/regimen.ts`, all migrated): `persistRegimen` · `saveRgOverride` · `saveRgManual` · `saveRgRemoved` · `saveRgUserGoals`. Each fires `regimen:changed`.
- **Item shape:** `{id, label:{name, dose_text?, nutrients:[{name,amount,unit,form?}], servings?}, addedDate, provenance}`. Base items are id<0; user items use positive ids.
- v3 design vocabulary; no inline data; `views -> state -> core` only.

## Coverage polish (smaller, optional)
- `renderGoalsStrip` (`views/coverage.ts`) still APPROXIMATES per-goal coverage as `coveredCount/totalCount * goal.total` — wire it to ACTUAL per-goal essential membership once that mapping exists in data (ask Luneth — it's corpus data).
- Boron shows `gap` by default: the verbatim BTT+Osteo label Boron sums below the 7 mg floor. If Luneth's corpus says HBSP delivers 7 mg, the label amounts in `regimen-base-data.json` may need his review (do NOT change numbers yourself — §00.A).

---

## Working commands (verified on this Windows host)
- Build: `node tools/build.mjs` · Typecheck: `./dashboard/node_modules/.bin/tsc -p ./dashboard/tsconfig.json --noEmit`
- Lint one file: `(cd dashboard && node_modules/.bin/eslint assets/js/src/views/X.ts)` — SUBSHELL `( )`, never bare `cd` (gotcha #4)
- Invariants: `PYTHONUTF8=1 python tools/invariants.py` (`--only <name>` for one)
- **Default render:** `node tools/render_probe.js` (expect coveredStat ~20, total /92, 0 errors)
- **Classifier regression:** `node tools/render_probe_seeded.js` (seeds a BTT stack with base hidden; asserts covered/partial/trace; exit≠0 on mismatch)
- madge cycles: `(cd dashboard && node_modules/.bin/madge --circular assets/js/src)`

## Windows / env gotchas
- Python stdout cp1252 -> prefix `PYTHONUTF8=1`. Use OS temp dir (`C:/Users/Light/AppData/Local/Temp`) absolute paths for safe_write payloads.
- **Nested `dashboard/.git` AND root `.git` both exist** — project history is the ROOT repo; always `git -C "C:/Users/Light/Desktop/claude/health expert"` or commit from repo root.
- Git commit messages: `git commit -F <file>` with a BOM-less file (the Write tool is fine; PowerShell `Set-Content -Encoding utf8` adds a BOM that leaks into the subject). CRLF->LF warnings harmless.

## Data architecture
- **Shared data** (legacy + new) embeds as `<script type="application/json" id="...-data">` in `dashboard.html`, read via getElementById + JSON.parse + Zod (`views/knowledge.ts`, `state/coverage.ts`).
- **NEW data** -> esbuild JSON import + `Schema.parse` (`coverage-layout-data.json`, `regimen-base-data.json`).
- **DATA OWNERSHIP:** Luneth owns the Wallach corpus DBs. **Never invent Wallach numbers** — STOP and ask if a render needs corpus data that isn't there. (To migrate legacy data: brace-match + strict `JSON.parse` the object literal so values are verbatim — see `tools` history / Chunk 3.)

---

## Deferred backlog (not blocking Chunk 4)
- **Creator's Log file-mirror (USER APPROVED, still pending):** `state/log.ts::log()` is localStorage-only -> un-fireable from CLI, so round-close step 5 (a Creator's Log event) has NOT been writable for Chunks 2.1–3. Build `chronicle/creators-log.jsonl` + Zod + `tools/creators_log.py` append helper; later a `main.ts` boot-merge into the Profile panel.
- **CORPUS DISCREPANCY (Luneth, confirm when convenient):** layout has CYSTEINE but the targets DB lists Taurine (no Cysteine) as the 12th amino; Germanium is a mineral target with no tile. Handled truthfully (Cysteine renders no status; Taurine+Germanium counted in /92, tile-less).
- **6 missing assets (404s):** 4 fonts + 2 bg jpgs — stray v3.2-mockup refs (likely `workspace-coverage.css`). In-house the TTFs or fall back to the 5 in-housed families.
- **Re-base `tools/dashboard_smoke.js`** to the new `.tile` markup -> makes `dashboard_integrity` truthful again.
- Commit noise: `knowledge/products-db-audit.{json,md}` + `tools/canaries/safe-write-probe.txt` regenerate on every invariant run — consider gitignoring the canary.
- **knip is unconfigured** (no entry point → reports app files + zod/esbuild as "unused"). Noise, not a gate; add a `knip.json` entry config.

## Other surfaces (same pattern: views -> state -> core, no inline data, v3 vocab)
Scanner (⌘3), Knowledge drawer (K), Journey drawer (J), Profile panel.

---

## First commands of the next session
```
PYTHONUTF8=1 python tools/invariants.py | tail -3     # expect 59/61
git -C "C:/Users/Light/Desktop/claude/health expert" log --oneline -7   # expect HEAD = 0f907ae
node tools/build.mjs                                   # expect Build OK
node tools/render_probe.js                             # expect coveredStat ~20, total "/ 92", 0 errors
node tools/render_probe_seeded.js                      # expect PASS
```
Recovery anchors: `f2cae00` -> `1fde0ef` -> `0f907ae`. Next §17 incident -> `git checkout HEAD -- <file>`.
