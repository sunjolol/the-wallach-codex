# Next chunk — Chunk 6 continues: Scanner (⌘3) **6a mount + 6b engine DONE** → next **6c OCR · 6d adopt** (or Knowledge K · Journey J · Profile)

**Status:** in progress. **Chunk 6a + 6b closed 2026-06-22 (commit `f516f4e`) — the Scanner surface now MOUNTS off legacy AND scores any label natively (verdict + gap-fill + goals + history), through `window.lcScan`.** What remains for a fully usable Scanner: **6c** native OCR (image→label, the user-facing input) and **6d** adopt (parsed product → §31 `saveRgManual` → coverage).
**This file is the fast-orient pointer.** `chronicle/build-log.md` (last ~14 entries) has the granular history — read the Chunk 6a/6b entries first so you do NOT re-map what's already figured out.

---

## READ THIS FIRST — already mapped; do NOT re-investigate

1. **The dashboard renders fine.** `dashboard_integrity` is RED only because its smoke test (`tools/dashboard_smoke.js`) is STALE (hunts legacy `.essential-tile[data-name]` markup the new `src/` replaced). Not a real break. (On 2026-06-22 it ALSO shows a `cl-data-notebook` embed size-mismatch + two other reds — all in the **Tacitus audit layer**, date-gated by the day rollover, NOT the Wallach dashboard. Baseline today is **58/61**; the 3 reds are dashboard_integrity, tacitus_modes_fired_today, tacitus_dashboard_extraction_health.)
2. **Legacy is NOT loaded.** `dashboard.html` loads ONLY `./assets/js/dist/main.js`. **THREE surfaces are now live off legacy: Coverage (⌘1), Regimen (⌘2), Scanner (⌘3).** Knowledge/Journey still hit `showLegacy()` in `main.ts::navigateTo()` → inert until migrated. **To migrate a surface: add a `target === 'X'` branch in `navigateTo()` mirroring coverage/regimen/scanner** (hideLegacy + mount `XView` into `#workspace-X-mount`, cache in `mounted.X`).
3. **Coverage (⌘1) is FULLY LIVE + populated by default** (≈20 covered + 5 partial / 92). `state/coverage.ts` classifies the EFFECTIVE regimen into authoritative per-tile `status`; views render it directly. It now ALSO exports `getTargets()` / `matchEssential()` / `currentDelivery()` — the shared matcher + per-essential delivery the Scanner engine reuses (one classifier, no drift).
4. **Regimen (⌘2) is FULLY migrated with working CRUD** (add via vault picker → `saveRgManual`; edit dose×per-day → `saveRgOverride`; remove → `saveRgRemoved`), each cascading to live coverage. Vault display names live under `canonical_name`, NOT `name`.
5. **Scanner (⌘3) — 6a mount + 6b engine DONE.**
   - **6a:** `navigateTo()` has a `scanner` branch mounting `scannerView` into `#workspace-scanner-mount` (idle v3 shell renders). Probe: `node tools/render_probe_scanner.js`.
   - **6b:** the native scan/verdict engine lives in `state/scanner.ts` (replaced the dead `window.lcScan` legacy bridge). The Wallach scan corpus is migrated VERBATIM to `assets/data/scanner-corpus-data.json` (Zod `ScanCorpusSchema`; extracted by node-eval of the legacy literals). Ported: alignment · gapFill · getEffectiveCoverage · matchGoals · antiFlags (gluten/oat/high-oleic nuance) · decideVerdict (ADD/SAVE/REJECT) · pushRecentScan (`lcRecentScans_v1`, cap 5). **The bridge:** `window.lcScan = scan` (probes/adopt/legacy callers route through it), `window.lcLastResult` drives the view via `scanner:scan-complete`. Probe: `node tools/render_probe_scan.js`.
   - **3 deliberate deviations (documented in `state/scanner.ts` header — for Luneth's end-pass):** (a) `matchGoals` reads `ess.target.low` (Round-99 shape; legacy read the since-removed `ess.low` → its pctOfTarget never fired, so goal-matching now actually evaluates nutrient meaningfulness); (b) container conflicts inert (OCR labels carry no container meta); (c) Eden-severance guard omitted (scanned labels are never Eden items).
   - **gapFill "current"** = `corpus.dietaryBaseline` (verbatim) + `coverage.currentDelivery()` (the live migrated regimen) — i.e. legacy `getEffectiveCoverage` with the dead `window.computeLiveCoverage` swapped for migrated state.
6. **Enforcement hooks are LIVE.** Route ALL repo writes through `python tools/safe_write.py {replace|append|rewrite|check}` (stage payloads in `C:/Users/Light/AppData/Local/Temp` via the Write tool). **GOTCHA: a bare `cd subdir` in a NON-subshell Bash command drifts cwd and blocks EVERY later Bash AND Write call** — use `(cd dir && ...)` subshells / absolute paths; PowerShell (`git -C <root>`) is the escape hatch. (Memory: `hooks-cwd-relative-trap`.)
   - **CRLF GOTCHA:** `src/` `.ts` files are CRLF on disk; `safe_write replace` matches literally → convert payloads LF→CRLF (`perl -pe 's/\r?\n/\r\n/g'`) before replace. ALSO: `safe_write` writes via Python text-mode, so it FLIPS an LF file (e.g. a `.md`/`.py`) to CRLF on disk on first write — for an LF file needing MULTIPLE edits, prefer one `rewrite` (git normalizes endings back to LF on commit, so committed diffs stay minimal).
7. **§00.B GREEN. eslint is the enforced style gate (NOT prettier); NEVER `eslint --fix` (§17); fix via safe_write.** Recurring lint: named imports/exports sort case-insensitively IGNORING `type`; regex `|`-of-single-things → char class AND `[^,]*\b`→`[^,]+\b` (regexp/no-contradiction); `Number.parseFloat`; no double blank lines; no use-before-define (hoist closure `let`s); **object/array literals >10 elements banned in views/state** (move to `assets/data/`) — note the heuristic now correctly EXCLUDES `import {…}` braces (fixed Chunk 6b, precedent Round 1.3).
8. **NUMBERS ARE PLACEHOLDER-FAITHFUL.** Luneth corrects ALL nutrient totals in one batch pass at the END. Build machinery to WORK; do NOT chase/flag number-only oddities. Never INVENT numbers (§00.A); migrate verbatim. (Memory: `numbers-corrected-at-end`.)

---

## CHUNK 6c — native OCR (image → ScanLabel), replacing `window.lcScanImage`
The view's drop/paste/upload handlers call `window.lcScanImage(dataUrl)` (still inert → dropping a label does nothing yet). Port the legacy OCR pipeline into `state/scanner.ts` (or a new `state/ocr.ts`), then wire `views/scanner.ts::handleImageFile` to the native path + set the result via the existing bridge (`scan(label)` → `window.lcLastResult` + `scanner:scan-complete`).
- **Legacy refs (`dashboard/assets/js/legacy-dashboard.js`):** `loadTesseract` (5432, vendored `./assets/vendor/tesseract/tesseract.min.js`) · `preprocessImage` (5445, canvas upscale→grayscale→contrast) · `runOcr` (5479, `Tesseract.createWorker` PSM 6) · `OCR_FUZZY_DICT` (5506, big dict → `assets/data/` behind Zod) · the label PARSER (text → `{name,brand,servings,nutrients,ingredients}`) ~5520–5867 · `lcScanImage` orchestrator (8779).
- **The parser is the bulk** (~300 lines of nutrition-panel heuristics) — port faithfully; test it in ISOLATION (feed raw OCR text → assert the parsed `ScanLabel`) rather than running the 22MB WASM headless. A real-OCR smoke can be a separate, slow opt-in probe.
- Tesseract is `window.Tesseract` (global from the vendored script) — type it via a narrow `LegacyWindow` interface; load lazily on first scan.

## CHUNK 6d — adopt parsed product → §31 `saveRgManual` → coverage
Wire the parsed-row / verdict-card adopt action so a scanned product enters the regimen and counts toward coverage (the core value path). The scored `ScanResult.label` → a `RegimenItem` (mirror `views/regimen.ts` `addItem`: `{id:Date.now(), label:{name,nutrients}, addedDate, provenance:'user_scanned'}`) → `saveRgManual([...loadRgManual(), item])` → `regimen:changed` → coverage recompute. Testable headless (scan via `window.lcScan`, click adopt, assert stack + coverage move).
- **OPEN UX QUESTION for Luneth:** the v3 parsed rows have a PER-ROW `ADOPT`/`CONFIRM`/`DISMISS` (per gap-fill essential), but "adopt to regimen" is naturally PER-PRODUCT. Decide: does any row's ADOPT add the whole scanned product, or is there a single product-level "ADD TO REGIMEN" action (cleaner)? Ask before wiring.

## Other surfaces (Luneth's call vs continuing Scanner)
- **Knowledge drawer (K)** — `views/knowledge.ts` reads `essentials-targets-data` + `regimen-label-lookup` (its product read filters on `name` but the vault uses `canonical_name` → product tab likely EMPTY; mirror `readVault`/`RegimenVaultEntrySchema` from the regimen view when you touch it). Drawer open/close wiring + render.
- **Journey drawer (J)** — `views/journey.ts` + `state/journey.ts`. Creator's-Log / history timeline.
- **Profile panel** — Creator's Log + invariant scoreboard + build status (the Genesis/discipline surface).

## Regimen leftovers (small, optional)
- Un-remove / re-add a hidden base item (drop its negative id from the removed-set). No UI yet.
- Still-placeholder panels in `views/regimen.ts` (`SLOT_PLACEHOLDERS`, `RECOMMENDATIONS`, `WISHLIST`, `itemContribution`) — inline mockup data, <10 elems so lint-legal.

## Coverage polish (optional)
- `renderGoalsStrip` approximates per-goal coverage as `coveredCount/totalCount * goal.total` — needs real per-goal essential membership (corpus data — ask Luneth).

---

## Working commands (verified on this Windows host)
- Build: `node tools/build.mjs` · Typecheck: `./dashboard/node_modules/.bin/tsc -p ./dashboard/tsconfig.json --noEmit`
- Lint one file: `(cd dashboard && node_modules/.bin/eslint assets/js/src/views/X.ts)` — SUBSHELL `( )`, never bare `cd` (gotcha #6)
- Invariants: `PYTHONUTF8=1 python tools/invariants.py`
- **Coverage renders:** `node tools/render_probe.js` (default ~20/92) · `node tools/render_probe_seeded.js` (classifier regression, exit≠0 on mismatch)
- **Scanner mount:** `node tools/render_probe_scanner.js` (6a idle shell) · **Scanner engine:** `node tools/render_probe_scan.js` (6b verdict+gapFill+history)
- madge cycles: `(cd dashboard && node_modules/.bin/madge --circular --extensions ts assets/js/src)`
- size-limit: `(cd dashboard && node_modules/.bin/size-limit)` — dist gzip 50.6KB / 250KB budget

## Windows / env gotchas
- Python stdout cp1252 -> prefix `PYTHONUTF8=1`. safe_write payloads: OS temp dir absolute paths.
- **Nested `dashboard/.git` AND root `.git`** — project history is the ROOT repo; always `git -C "C:/Users/Light/Desktop/claude/health expert"`.
- Git commit messages: `git commit -F <file>` with a BOM-less file (Write tool fine). CRLF->LF warnings harmless.

## Data architecture
- **Shared data** embeds as `<script type="application/json" id="...-data">` in `dashboard.html`, read via getElementById + JSON.parse + Zod (`views/knowledge.ts`, `state/coverage.ts`, regimen `readVault`).
- **NEW data** -> esbuild JSON import + `Schema.parse` (`coverage-layout-data.json`, `regimen-base-data.json`, `scanner-corpus-data.json`).
- **DATA OWNERSHIP:** Luneth owns the Wallach corpus DBs. Legacy JS literals with UNQUOTED keys (`new Set`, etc.) aren't strict JSON → extract by EVALUATING the exact legacy JS in node + JSON.stringify (Chunk 6b pattern), so values stay verbatim.

---

## Deferred backlog (not blocking)
- **Creator's Log file-mirror (USER APPROVED, still pending):** `state/log.ts::log()` is localStorage-only → un-fireable from CLI, so round-close step 5 has NOT been writable for Chunks 2.1–6b. Build `chronicle/creators-log.jsonl` + Zod + `tools/creators_log.py`; later a `main.ts` boot-merge into the Profile panel.
- **Tacitus layer date-gated reds (06-22):** dashboard_integrity (stale smoke + cl-data-notebook embed), tacitus_modes_fired_today (Vision), tacitus_dashboard_extraction_health (sidecar date) — run that layer's session ritual / `tools/build_tacitus_dashboard_live.py` to clear; NOT in the Wallach-dashboard path.
- **CORPUS DISCREPANCY (Luneth):** layout has CYSTEINE but the targets DB lists Taurine (no Cysteine) as the 12th amino; Germanium is a mineral target with no tile. Handled truthfully.
- **knowledge.ts product tab likely EMPTY** (filters on `name`; vault uses `canonical_name`) — fix when migrating the Knowledge drawer.
- **6 missing assets (404s):** 4 fonts + 2 bg jpgs (stray v3.2-mockup refs).
- **Re-base `tools/dashboard_smoke.js`** to the new `.tile`/`.regimen-item-row`/`.scanner-grid` markup → makes `dashboard_integrity` truthful.
- **knip unconfigured** (reports app files + zod/esbuild as "unused") — noise; add a `knip.json`.
- Commit noise: `knowledge/products-db-audit.{json,md}` + `tools/canaries/safe-write-probe.txt` regenerate on every invariant run.

---

## First commands of the next session
```
PYTHONUTF8=1 python tools/invariants.py | tail -1                       # expect 58/61 (3 date-gated Tacitus reds)
git -C "C:/Users/Light/Desktop/claude/health expert" log --oneline -6   # expect HEAD = f516f4e
node tools/build.mjs                                                     # expect Build OK
node tools/render_probe.js                                              # coveredStat ~20, /92, 0 errors
node tools/render_probe_seeded.js                                       # PASS
node tools/render_probe_scanner.js                                     # PASS (scanner idle mount)
node tools/render_probe_scan.js                                        # PASS (native scan engine)
```
Recovery anchors: `1626aa0` (Chunk 5 handoff) -> `3a36c1c` (6a mount) -> `f516f4e` (6b engine). Next §17 incident -> `git checkout HEAD -- <file>`.
