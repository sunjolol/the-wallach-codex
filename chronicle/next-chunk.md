# Next chunk — Chunk 6 (Scanner ⌘3) **COMPLETE** → next: Knowledge (K) · Journey (J) · Profile (Luneth's call)

**Status:** Chunk 6 closed 2026-06-22. The Scanner now runs the FULL loop natively: **image → OCR → parse → verdict → adopt → live coverage.** Sub-chunks: 6a mount (`3a36c1c`) · 6b engine (`f516f4e`) · 6c OCR (`47d7244`) · 6d adopt (`2a1b155`). Coverage (⌘1), Regimen (⌘2), Scanner (⌘3) are ALL fully live off legacy. **The remaining unmigrated surfaces are the Knowledge drawer (K), the Journey drawer (J), and the Profile panel** — pick one (or a backlog item) next; all are Luneth's call.
**This file is the fast-orient pointer.** `chronicle/build-log.md` (last ~16 entries) has the granular history — read the Chunk 6a–6d entries first so you do NOT re-map what's figured out.

---

## READ THIS FIRST — already mapped; do NOT re-investigate

1. **The dashboard renders fine.** `dashboard_integrity` is RED only because its smoke test (`tools/dashboard_smoke.js`) is STALE (hunts legacy `.essential-tile[data-name]` markup the new `src/` replaced). Not a real break. The 3 reds today are dashboard_integrity, tacitus_modes_fired_today, tacitus_dashboard_extraction_health — all in the **Tacitus audit layer**, date-gated by the day rollover, NOT the Wallach dashboard. Baseline is **58/61**.
2. **Legacy is NOT loaded.** `dashboard.html` loads ONLY `./assets/js/dist/main.js`. **THREE surfaces are live off legacy: Coverage (⌘1), Regimen (⌘2), Scanner (⌘3).** Knowledge/Journey still hit `showLegacy()` in `main.ts::navigateTo()` → inert until migrated. **To migrate a ⌘-workspace: add a `target === 'X'` branch in `navigateTo()` mirroring coverage/regimen/scanner** (hideLegacy + mount `XView` into `#workspace-X-mount`, cache in `mounted.X`). Knowledge/Journey are DRAWERS (K/J keys), not ⌘-workspaces — check their drawer-toggle wiring, not navigateTo.
3. **Coverage (⌘1) is FULLY LIVE + populated by default** (≈20 covered + 5 partial / 92). `state/coverage.ts` classifies the EFFECTIVE regimen into per-tile `status`. Exports `getTargets()` / `matchEssential()` / `currentDelivery()` — the shared matcher + delivery the Scanner reuses (one classifier, no drift). The view re-renders on `regimen:changed` + `coverage:recomputed`.
4. **Regimen (⌘2) is FULLY migrated with working CRUD** (add via vault picker → `saveRgManual`; edit dose×per-day → `saveRgOverride`; remove → `saveRgRemoved`), each cascading to live coverage. Vault display names live under `canonical_name`, NOT `name`.
5. **Scanner (⌘3) — COMPLETE (6a mount · 6b engine · 6c OCR · 6d adopt).**
   - **6b engine** `state/scanner.ts`: native scan/verdict (alignment · gapFill · matchGoals · antiFlags · decideVerdict ADD/SAVE/REJECT · pushRecentScan). Bridge: `window.lcScan = scan`, `window.lcLastResult` drives the view via `scanner:scan-complete`. **3 deliberate deviations documented in its header for Luneth's end-pass** (matchGoals reads `ess.target.low`; container conflicts inert; Eden-severance guard omitted).
   - **6c OCR** `state/ocr.ts`: `loadTesseract` (lazy-injects vendored `./assets/vendor/tesseract/tesseract.min.js`, ~22MB, on first scan only) · `preprocessImage` (canvas upscale→grayscale→contrast) · `runOcr` (PSM 6) · Levenshtein fuzzy-fix (dict in `assets/data/ocr-dict-data.json`) · `parseOcrText` · `scanImage`→`runScan`. Bridges: `window.lcScanImage = scanImage`, `window.lcParseLabel = parseLabel` (probe feeds raw text, no WASM). `views/scanner.ts` imports `scanImage` directly.
   - **6d adopt** `views/scanner.ts`: a SINGLE product-level **"ADD TO REGIMEN"** button on the verdict card (Luneth's UX call) → `adoptProduct(label)` builds a `RegimenItem` (provenance `'user_scanned'`) → §31 `saveRgManual` → `regimen:changed` → live coverage. The v3 per-row parsed buttons stay **display-only** (decision) — the click handler ignores `data-sc-action=adopt/dismiss`.
   - **Probes:** `render_probe_scanner` (idle mount) · `render_probe_scan` (engine) · `render_probe_ocr` (parser → ScanLabel, no WASM) · `render_probe_adopt` (adopt → coverage).
6. **Enforcement hooks are LIVE.** Route ALL repo writes through `python tools/safe_write.py {replace|append|rewrite|check}` (stage payloads in `C:/Users/Light/AppData/Local/Temp` via the Write tool; `rewrite` creates new files). (Memory: `hooks-cwd-relative-trap`, `safe-write-crlf-flip`.)
   - **CWD-DRIFT (refined this session):** a non-subshell `cd subdir` — even with an ABSOLUTE path — PERSISTS and is SHARED by the Bash AND PowerShell tools; once it drifts off-root it blocks EVERY Bash + Write/Edit call (the hooks run `tools/hooks/*.py` via a RELATIVE path). **RECOVERY: run a PowerShell `Set-Location "<repo root>"` — it resets the shared cwd and unblocks Bash too.** Prefer `(cd dir && …)` subshells to never drift.
   - **CRLF (corrected this session):** `safe_write` reads BOTH the payload and the target via Python `read_text`, which normalizes CRLF→LF in memory — so `replace` old/new payloads must be **LF** (the prior "convert LF→CRLF before replace" note was WRONG for the match path). On-disk lands CRLF (text-mode write); git normalizes to LF on commit (CRLF→LF warnings are harmless).
7. **§00.B GREEN. eslint is the enforced style gate (NOT prettier); NEVER `eslint --fix` (§17); fix via safe_write.** Recurring lint — the OCR port (`src/` regexes now linted for the first time) adds: `regexp/use-ignore-case` (`[A-Za-z]`→`[a-z]` when the regex already has `/i` — behaviour-identical) · `regexp/no-dupe-characters-character-class` · `regexp/no-super-linear-backtracking` (BOUND the quantifiers, e.g. `\s{0,8}`, `{0,54}?` — bounded ⇒ not super-linear) · `regexp/no-unused-capturing-group` (`(?:…)`) · `prefer-template` · `unicorn/no-new-array` (`Array.from`) · `ts/promise-function-async` (mark `async`; `require-await` is OFF so `async fn { return new Promise(...) }` is fine) · `style/multiline-ternary`. Plus the prior set: named import/export sort case-insensitive IGNORING `type`; `Number.parseFloat`; no double blank lines; no use-before-define; object/array literals >10 elems → `assets/data/` (heuristic correctly EXCLUDES `import {…}` braces).
8. **NUMBERS ARE PLACEHOLDER-FAITHFUL.** Luneth corrects ALL nutrient totals in one batch pass at the END. Build machinery to WORK; do NOT chase/flag number-only oddities. Never INVENT numbers (§00.A); migrate verbatim. (Memory: `numbers-corrected-at-end`.)

---

## NEXT — pick a surface (Luneth's call)
- **Knowledge drawer (K)** — `views/knowledge.ts` reads `essentials-targets-data` + `regimen-label-lookup`; its product read filters on `name` but the vault uses `canonical_name` → product tab likely EMPTY (mirror `readVault`/`RegimenVaultEntrySchema` from the regimen view). Wire the drawer open/close (K key) + render.
- **Journey drawer (J)** — `views/journey.ts` + `state/journey.ts`. Creator's-Log / history timeline.
- **Profile panel** — ALREADY mounts (click "Luneth" in the header → `showProfilePanel()` in `main.ts` → `profileView.mount`). Creator's Log + invariant scoreboard + build status. Verify/extend its content (and see the Creator's-Log file-mirror backlog item — it would make the Profile's log live).

## Scanner leftovers / polish (optional)
- **OCR progress wiring:** `state/ocr.ts` already dispatches a window `lcscan:progress` CustomEvent per OCR stage; `views/scanner.ts` could subscribe to drive the pipeline % live (currently the scanning shell is static).
- Design polish on `.verdict__actions` / `.scan-btn--adopt` (sealed `design-system.css` untouched).
- No de-dup when the same product is adopted twice (each click → distinct id; matches the vault add-item behaviour).
- **"Boron"→"Bran" fuzzy snap** (Levenshtein dist 2; minerals are deliberately excluded from the fuzzy dict) is FAITHFUL legacy behaviour, surfaced by the OCR probe — flagged for Luneth, NOT a port bug.

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
- **Coverage:** `node tools/render_probe.js` (default ~20/92) · `node tools/render_probe_seeded.js` (classifier regression)
- **Scanner:** `node tools/render_probe_scanner.js` (6a mount) · `node tools/render_probe_scan.js` (6b engine) · `node tools/render_probe_ocr.js` (6c parser, no WASM) · `node tools/render_probe_adopt.js` (6d adopt → coverage)
- madge cycles: `(cd dashboard && node_modules/.bin/madge --circular --extensions ts assets/js/src)`
- size-limit: `(cd dashboard && node_modules/.bin/size-limit)` — dist gzip ~55KB / 250KB budget

## Windows / env gotchas
- Python stdout cp1252 -> prefix `PYTHONUTF8=1`. safe_write payloads: OS temp dir absolute paths (use fresh unique names — stale temp files trip the Write tool's "read first" guard).
- **Nested `dashboard/.git` AND root `.git`** — project history is the ROOT repo; always `git -C "C:/Users/Light/Desktop/claude/health expert"`.
- Git commit messages: `git commit -F <file>` with a BOM-less file (Write tool fine). CRLF->LF warnings harmless.

## Data architecture
- **Shared data** embeds as `<script type="application/json" id="...-data">` in `dashboard.html`, read via getElementById + JSON.parse + Zod.
- **NEW data** -> esbuild JSON import + `Schema.parse` (`coverage-layout-data.json`, `regimen-base-data.json`, `scanner-corpus-data.json`, `ocr-dict-data.json`).
- **DATA OWNERSHIP:** Luneth owns the Wallach corpus DBs. Legacy JS literals with UNQUOTED keys (`new Set`, etc.) aren't strict JSON → extract by EVALUATING the exact legacy JS in node + JSON.stringify (Chunk 6b/6c pattern), so values stay verbatim.

---

## Deferred backlog (not blocking)
- **Creator's Log file-mirror (USER APPROVED, still pending):** `state/log.ts::log()` is localStorage-only → un-fireable from CLI, so round-close step 5 has NOT been writable for Chunks 2.1–6d. Build `chronicle/creators-log.jsonl` + Zod + `tools/creators_log.py`; later a `main.ts` boot-merge into the Profile panel. (Natural pairing if you take the Profile surface next.)
- **Tacitus layer date-gated reds:** dashboard_integrity (stale smoke + cl-data-notebook embed), tacitus_modes_fired_today (Vision), tacitus_dashboard_extraction_health (sidecar date) — run that layer's session ritual / `tools/build_tacitus_dashboard_live.py` to clear; NOT in the Wallach-dashboard path.
- **CORPUS DISCREPANCY (Luneth):** layout has CYSTEINE but the targets DB lists Taurine (no Cysteine) as the 12th amino; Germanium is a mineral target with no tile. Handled truthfully.
- **knowledge.ts product tab likely EMPTY** (filters on `name`; vault uses `canonical_name`) — fix when migrating the Knowledge drawer.
- **6 missing assets (404s):** 4 fonts + 2 bg jpgs (stray v3.2-mockup refs).
- **Re-base `tools/dashboard_smoke.js`** to the new `.tile`/`.regimen-item-row`/`.scanner-grid` markup → makes `dashboard_integrity` truthful.
- **knip unconfigured** (reports app files + zod/esbuild as "unused") — noise; add a `knip.json`.
- Commit noise: `knowledge/products-db-audit.{json,md}` + `tools/canaries/safe-write-probe.txt` regenerate on every invariant run (leave unstaged).

---

## GitHub — keep the work logged (connected 2026-06-22)
Mirrored to GitHub: `origin` = https://github.com/sunjolol/the-wallach-codex (**PRIVATE**, branch `master`; auth via the machine's Git Credential Manager — no token needed). App name: **The Wallach Codex** (internal systems keep theirs: Eden, Tacitus, Cura, Aegis). **After each chunk's commit, also push:**
```
git -C "C:/Users/Light/Desktop/claude/health expert" push
```
NOTE: the repo holds ~95MB of copyrighted Wallach book PDFs (`knowledge/wallach-books/`) — fine while PRIVATE; do NOT flip the repo public without stripping those from history first.

## First commands of the next session

```
PYTHONUTF8=1 python tools/invariants.py | tail -1                       # expect 58/61 (3 date-gated Tacitus reds)
git -C "C:/Users/Light/Desktop/claude/health expert" log --oneline -6   # expect HEAD = 2a1b155 (Chunk 6d)
node tools/build.mjs                                                     # expect Build OK
node tools/render_probe.js                                              # coveredStat ~20, /92, 0 errors
node tools/render_probe_seeded.js                                       # PASS
node tools/render_probe_scanner.js                                     # PASS (scanner idle mount)
node tools/render_probe_scan.js                                        # PASS (native scan engine)
node tools/render_probe_ocr.js                                         # PASS (OCR parser → ScanLabel)
node tools/render_probe_adopt.js                                       # PASS (adopt → coverage)
```
Recovery anchors: `3a36c1c` (6a) -> `f516f4e` (6b) -> `47d7244` (6c) -> `2a1b155` (6d). Next §17 incident -> `git checkout HEAD -- <file>`.
