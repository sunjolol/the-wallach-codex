# Next chunk — Chunk 5: finish Regimen add/edit (then move to the next surface)

**Status:** queued. Previous: **Chunk 4 closed 2026-06-21 20:48 EDT (commit `8f330be`) — the Regimen surface (⌘2) is migrated off legacy: live stack + live count + working remove.**
**This file is the fast-orient pointer.** `chronicle/build-log.md` (last ~11 entries) has the granular history; read this first so you do NOT re-map what was already figured out.

---

## READ THIS FIRST — already mapped; do NOT re-investigate

1. **The dashboard renders fine.** `dashboard_integrity` is RED only because its smoke test (`tools/dashboard_smoke.js`) is STALE (hunts legacy `.essential-tile[data-name]` markup the new `src/` replaced). Not a real break.
2. **Legacy is NOT loaded.** `dashboard.html` loads ONLY `./assets/js/dist/main.js`. `window.*` legacy globals/fns do not exist at runtime. **Two surfaces are migrated to the new `src/`: Coverage (⌘1) + Regimen (⌘2).** The other rail targets (Scanner/Knowledge/Journey) still hit `showLegacy()` in `main.ts::navigateTo()` → inert until their round lands. To migrate a surface: add a `target === 'X'` branch in `navigateTo()` mirroring coverage/regimen (mount the view into `#workspace-X-mount`, cache in `mounted.X`).
3. **Coverage is FULLY LIVE + populated by default.** `state/coverage.ts` reads the embedded targets DB (92 essentials, canonical `key` join) and classifies the EFFECTIVE regimen (native port of legacy computeLiveCoverage/classifyLive/toMg/matchToEssential) into an authoritative per-tile `status` the view renders directly. Default ≈ 20 covered + 5 partial / 92.
4. **The regimen is now a real layer: `state/regimen.ts::loadEffectiveRegimen()`** = HBSP base foundation (`assets/data/regimen-base-data.json`, negative-id items, migrated verbatim from legacy REGIMEN_BASE_DATA) + committed (`lcRegimen_v1`) + manual − the §31 removed-set. Coverage, the coverage rail, AND the regimen active-slot all read it. **Remove is wired** (regimen view 'remove' action → `saveRgRemoved` → cascades to coverage). NOT yet wired: **add-item** + **dose/scaling edit**.
5. **Enforcement hooks are LIVE.** Route ALL repo writes through `python tools/safe_write.py {replace|append|rewrite|check}` (stage payloads in `C:/Users/Light/AppData/Local/Temp` via the Write tool). **GOTCHA: a bare `cd subdir` in a NON-subshell Bash command drifts the persistent cwd and then blocks EVERY later Bash AND Write call (cwd-relative hook path) until the turn resets.** Use `(cd dir && ...)` subshells or absolute paths; PowerShell (`git -C <root>`) is the escape hatch. (Memory: `hooks-cwd-relative-trap`.)
6. **§00.B GREEN.** **eslint is the enforced style gate (NOT prettier — unenforced + fights @antfu); NEVER `eslint --fix` (§17); fix via safe_write.** Recurring lint to pre-empt: named imports/exports sort case-insensitively IGNORING the `type` modifier; regex `|`-of-single-things → char class; `Number.parseFloat`; no double blank lines.
7. **NUMBERS ARE PLACEHOLDER-FAITHFUL.** Luneth corrects ALL nutrient totals (~50–80 trace-mineral entries) in one batch pass at the END. Build machinery to WORK over current data; do NOT chase/flag number-only oddities (e.g. removing BTT drops coverage to 1 — that's data, not a bug). Never INVENT numbers (§00.A); migrate verbatim. (Memory: `numbers-corrected-at-end`.)

---

## CHUNK 5 — finish the Regimen surface (add + edit), then next surface
Remove works; the remaining stack-management pieces:
- **Add-item.** The 'add-item' action currently no-ops (legacy `showAddItemModal` is gone). Needs a product source + picker UI. Product data exists: `regimen-label-lookup` (embedded, the product vault — read via getElementById like `views/knowledge.ts::readProducts`) and `essentials-best-supplements.json`. Adding writes through `saveRgManual` (the §31 chokepoint for user-added items): build a RegimenItem `{id: Date.now(), label:{name, nutrients}, addedDate, provenance:'user_manual'}` and persist. Then coverage cascades automatically.
- **Dose / scaling edit.** The dose inputs + `×1.0` scaling in `renderItemRow` are hardcoded. Wire them to `saveRgOverride(id, {scaling_factor})`; `state/coverage.ts::readScale()` already reads override scaling, so edits cascade to coverage. Re-add (un-remove) a base item is the inverse of remove (drop id from the removed-set).
- **Still-placeholder panels (inline mockup data, <10 elements so lint-legal):** `SLOT_PLACEHOLDERS` (5 fake cartridges), `RECOMMENDATIONS` (4), `WISHLIST` (2), and `itemContribution` (nutrient-count proxy). These back features not yet migrated (slot save/load via rgSlot* keys; goal-driven recs). Migrate when those features land — or move the demo data to `assets/data/fixtures/` per CLAUDE.md.

## Next surfaces (same pattern: add a navigateTo branch + migrate the view; views -> state -> core, no inline data, v3 vocab)
Scanner (⌘3 — OCR via vendored Tesseract), Knowledge drawer (K), Journey drawer (J), Profile panel.

## Coverage polish (optional)
- `renderGoalsStrip` still APPROXIMATES per-goal coverage as `coveredCount/totalCount * goal.total` — wire to ACTUAL per-goal essential membership once that mapping exists in data (corpus data — ask Luneth).

---

## Working commands (verified on this Windows host)
- Build: `node tools/build.mjs` · Typecheck: `./dashboard/node_modules/.bin/tsc -p ./dashboard/tsconfig.json --noEmit`
- Lint one file: `(cd dashboard && node_modules/.bin/eslint assets/js/src/views/X.ts)` — SUBSHELL `( )`, never bare `cd` (gotcha #5)
- Invariants: `PYTHONUTF8=1 python tools/invariants.py` (`--only <name>`)
- **Default coverage render:** `node tools/render_probe.js` (expect coveredStat ~20, /92, 0 errors)
- **Classifier regression:** `node tools/render_probe_seeded.js` (seeds a stack, base hidden; asserts covered/partial/trace; exit≠0 on mismatch)
- madge cycles: `(cd dashboard && node_modules/.bin/madge --circular assets/js/src)`
- (Ad-hoc surface probes: drive `[data-rail-nav="X"]` clicks in puppeteer + scope queries to `#workspace-X-mount` — see the Chunk 4 regimen probe pattern in build-log.)

## Windows / env gotchas
- Python stdout cp1252 -> prefix `PYTHONUTF8=1`. safe_write payloads: OS temp dir absolute paths.
- **Nested `dashboard/.git` AND root `.git`** — project history is the ROOT repo; always `git -C "C:/Users/Light/Desktop/claude/health expert"`.
- Git commit messages: `git commit -F <file>` with a BOM-less file (Write tool is fine; PS `Set-Content -Encoding utf8` adds a BOM). CRLF->LF warnings harmless.

## Data architecture
- **Shared data** embeds as `<script type="application/json" id="...-data">` in `dashboard.html`, read via getElementById + JSON.parse + Zod (`views/knowledge.ts`, `state/coverage.ts`).
- **NEW data** -> esbuild JSON import + `Schema.parse` (`coverage-layout-data.json`, `regimen-base-data.json`).
- **DATA OWNERSHIP:** Luneth owns the Wallach corpus DBs. To migrate legacy embedded data: brace-match + strict `JSON.parse` the object literal so values are verbatim (see Chunk 3 extraction).

---

## Deferred backlog (not blocking Chunk 5)
- **Creator's Log file-mirror (USER APPROVED, still pending):** `state/log.ts::log()` is localStorage-only -> un-fireable from CLI, so round-close step 5 has NOT been writable for Chunks 2.1–4. Build `chronicle/creators-log.jsonl` + Zod + `tools/creators_log.py`; later a `main.ts` boot-merge into the Profile panel.
- **CORPUS DISCREPANCY (Luneth):** layout has CYSTEINE but the targets DB lists Taurine (no Cysteine) as the 12th amino; Germanium is a mineral target with no tile. Handled truthfully.
- **6 missing assets (404s):** 4 fonts + 2 bg jpgs (stray v3.2-mockup refs). In-house TTFs or fall back to the 5 in-housed families.
- **Re-base `tools/dashboard_smoke.js`** to the new `.tile`/`.regimen-item-row` markup -> makes `dashboard_integrity` truthful again.
- Commit noise: `knowledge/products-db-audit.{json,md}` + `tools/canaries/safe-write-probe.txt` regenerate on every invariant run.
- **knip unconfigured** (reports app files + zod/esbuild as "unused") — noise, not a gate; add a `knip.json` entry config.

---

## First commands of the next session
```
PYTHONUTF8=1 python tools/invariants.py | tail -3     # expect 59/61
git -C "C:/Users/Light/Desktop/claude/health expert" log --oneline -8   # expect HEAD = 8f330be
node tools/build.mjs                                   # expect Build OK
node tools/render_probe.js                             # expect coveredStat ~20, /92, 0 errors
node tools/render_probe_seeded.js                      # expect PASS
```
Recovery anchors: `0f907ae` -> `6506f44` -> `8f330be`. Next §17 incident -> `git checkout HEAD -- <file>`.
