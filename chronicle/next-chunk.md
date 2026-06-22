# Next chunk — Chunk 6: migrate the next surface (Scanner ⌘3 · Knowledge K · Journey J · Profile)

**Status:** queued. Previous: **Chunk 5 closed 2026-06-21 21:11 EDT (commit `a671e64`) — the Regimen surface now does full CRUD (add via vault · edit dose · remove), all through §31 → live coverage.**
**This file is the fast-orient pointer.** `chronicle/build-log.md` (last ~12 entries) has the granular history; read this first so you do NOT re-map what was already figured out.

---

## READ THIS FIRST — already mapped; do NOT re-investigate

1. **The dashboard renders fine.** `dashboard_integrity` is RED only because its smoke test (`tools/dashboard_smoke.js`) is STALE (hunts legacy `.essential-tile[data-name]` markup the new `src/` replaced). Not a real break.
2. **Legacy is NOT loaded.** `dashboard.html` loads ONLY `./assets/js/dist/main.js`. **Two surfaces are migrated off legacy: Coverage (⌘1) + Regimen (⌘2).** Scanner/Knowledge/Journey still hit `showLegacy()` in `main.ts::navigateTo()` → inert until migrated. **To migrate a surface: add a `target === 'X'` branch in `navigateTo()` mirroring coverage/regimen** (hideLegacy + mount `XView` into `#workspace-X-mount`, cache in `mounted.X`). The view modules exist as scaffolds in `views/` (palette.ts throws "pending"; check each).
3. **Coverage is FULLY LIVE + populated by default** (≈20 covered + 5 partial / 92). `state/coverage.ts` classifies the EFFECTIVE regimen (native port of legacy computeLiveCoverage/classifyLive/toMg/matchToEssential) into authoritative per-tile `status`; views render it directly.
4. **The Regimen surface (⌘2) is FULLY migrated with working CRUD.** `state/regimen.ts::loadEffectiveRegimen()` = HBSP base (`regimen-base-data.json`, negative-id items, verbatim from legacy REGIMEN_BASE_DATA) + committed (`lcRegimen_v1`) + manual − the §31 removed-set; coverage + both rails read it. The regimen view wires all three CRUD ops through §31 chokepoints, each cascading to live coverage: **add** (inline picker → `saveRgManual` from the `regimen-label-lookup` vault via a native datalist; vault display names live under `canonical_name`, NOT `name`), **edit** dose×per-day → `saveRgOverride({dose_amount,dose_freq,scaling_factor})`, **remove** → `saveRgRemoved` (works on base + user items). Verified via headless probes (see build-log Chunk 4/5).
5. **Enforcement hooks are LIVE.** Route ALL repo writes through `python tools/safe_write.py {replace|append|rewrite|check}` (stage payloads in `C:/Users/Light/AppData/Local/Temp` via the Write tool). **GOTCHA: a bare `cd subdir` in a NON-subshell Bash command drifts the persistent cwd and then blocks EVERY later Bash AND Write call (cwd-relative hook path) until the turn resets.** Use `(cd dir && ...)` subshells / absolute paths; PowerShell (`git -C <root>`) is the escape hatch. (Memory: `hooks-cwd-relative-trap`.)
6. **§00.B GREEN. eslint is the enforced style gate (NOT prettier — fights @antfu); NEVER `eslint --fix` (§17); fix via safe_write.** Recurring lint to pre-empt: named imports/exports sort case-insensitively IGNORING `type`; regex `|`-of-single-things → char class; `Number.parseFloat`; no double blank lines; no unnecessary type assertions after `in`-narrowing; no use-before-define (hoist closure `let`s above the fns that close over them).
7. **NUMBERS ARE PLACEHOLDER-FAITHFUL.** Luneth corrects ALL nutrient totals (~50–80 trace-mineral entries) in one batch pass at the END. Build machinery to WORK; do NOT chase/flag number-only oddities (e.g. removing BTT drops coverage to 1; adding an overlapping product doesn't move the count). Never INVENT numbers (§00.A); migrate verbatim. (Memory: `numbers-corrected-at-end`.)

---

## CHUNK 6 — migrate the next surface (pick one; Luneth's call)
Same recipe each time: (a) `navigateTo()` branch in `main.ts` to mount the view; (b) rewrite the view to read real state through `views → state → core` (no inline data >10 elems; v3 vocab); (c) cascade mutations through the right chokepoint; (d) headless probe + invariants.
- **Scanner (⌘3)** — OCR via vendored Tesseract.js (`assets/vendor/tesseract/`, ~22MB, offline). `views/scanner.ts` + `state/scanner.ts` (+ `core/schemas/scanner.ts`) exist. Scanned labels become RegimenItems → `saveRgManual` (same path the add-picker uses) → coverage. Biggest/most valuable surface; OCR wiring is the work.
- **Knowledge drawer (K)** — `views/knowledge.ts` already reads `essentials-targets-data` + `regimen-label-lookup` (NOTE: its product read filters on `name` but the vault uses `canonical_name` → its product tab is likely EMPTY; fix when you touch it, mirror `readVault` in regimen view). Drawer open/close wiring + render.
- **Journey drawer (J)** — `views/journey.ts` + `state/journey.ts`. Creator's-Log / history timeline.
- **Profile panel** — Creator's Log + invariant scoreboard + build status (the Genesis/discipline surface).

## Regimen leftovers (small, optional)
- **Un-remove / re-add a hidden base item** (inverse of remove: drop its negative id from the removed-set). No UI yet.
- **Still-placeholder panels** in `views/regimen.ts` (inline mockup data, <10 elems so lint-legal): `SLOT_PLACEHOLDERS` (slot save/load via rgSlot* keys — not migrated), `RECOMMENDATIONS`, `WISHLIST`, and `itemContribution` (nutrient-count proxy, not real per-item essential attribution). Migrate when those features land or move demo data to `assets/data/fixtures/`.
- The add-row uses a native `<datalist>` (functional, unstyled) — Luneth may want a designed picker later.

## Coverage polish (optional)
- `renderGoalsStrip` still APPROXIMATES per-goal coverage as `coveredCount/totalCount * goal.total` — needs real per-goal essential membership (corpus data — ask Luneth).

---

## Working commands (verified on this Windows host)
- Build: `node tools/build.mjs` · Typecheck: `./dashboard/node_modules/.bin/tsc -p ./dashboard/tsconfig.json --noEmit`
- Lint one file: `(cd dashboard && node_modules/.bin/eslint assets/js/src/views/X.ts)` — SUBSHELL `( )`, never bare `cd` (gotcha #5)
- Invariants: `PYTHONUTF8=1 python tools/invariants.py`
- **Coverage renders:** `node tools/render_probe.js` (default ~20/92) · `node tools/render_probe_seeded.js` (classifier regression, exit≠0 on mismatch)
- madge cycles: `(cd dashboard && node_modules/.bin/madge --circular assets/js/src)`
- **Surface probe pattern** (drive a migrated surface headless): click `[data-rail-nav="X"]`, wait, scope queries to `#workspace-X-mount`, set inputs + `dispatchEvent(new Event('change',{bubbles:true}))` / click `[data-rg-action=...]`. See the Chunk 4/5 probes (remove/dose/add) reproduced in build-log.

## Windows / env gotchas
- Python stdout cp1252 -> prefix `PYTHONUTF8=1`. safe_write payloads: OS temp dir absolute paths.
- **Nested `dashboard/.git` AND root `.git`** — project history is the ROOT repo; always `git -C "C:/Users/Light/Desktop/claude/health expert"`.
- Git commit messages: `git commit -F <file>` with a BOM-less file (Write tool fine; PS `Set-Content -Encoding utf8` adds a BOM). CRLF->LF warnings harmless. Heredocs to git via Bash are fine (`git commit -F - <<'EOF'`).

## Data architecture
- **Shared data** embeds as `<script type="application/json" id="...-data">` in `dashboard.html`, read via getElementById + JSON.parse + Zod (`views/knowledge.ts`, `state/coverage.ts`, regimen `readVault`).
- **NEW data** -> esbuild JSON import + `Schema.parse` (`coverage-layout-data.json`, `regimen-base-data.json`).
- **DATA OWNERSHIP:** Luneth owns the Wallach corpus DBs. To migrate legacy embedded data: brace-match + strict `JSON.parse` the object literal so values are verbatim (Chunk 3 pattern).

---

## Deferred backlog (not blocking Chunk 6)
- **Creator's Log file-mirror (USER APPROVED, still pending):** `state/log.ts::log()` is localStorage-only -> un-fireable from CLI, so round-close step 5 (a Creator's Log event) has NOT been writable for Chunks 2.1–5. Build `chronicle/creators-log.jsonl` + Zod + `tools/creators_log.py`; later a `main.ts` boot-merge into the Profile panel.
- **CORPUS DISCREPANCY (Luneth):** layout has CYSTEINE but the targets DB lists Taurine (no Cysteine) as the 12th amino; Germanium is a mineral target with no tile. Handled truthfully.
- **knowledge.ts product tab likely EMPTY** (filters on `name`; vault uses `canonical_name`) — fix when migrating the Knowledge drawer.
- **6 missing assets (404s):** 4 fonts + 2 bg jpgs (stray v3.2-mockup refs). In-house TTFs or fall back.
- **Re-base `tools/dashboard_smoke.js`** to the new `.tile`/`.regimen-item-row` markup -> makes `dashboard_integrity` truthful.
- **knip unconfigured** (reports app files + zod/esbuild as "unused") — noise; add a `knip.json` entry config.
- Commit noise: `knowledge/products-db-audit.{json,md}` + `tools/canaries/safe-write-probe.txt` regenerate on every invariant run.

---

## First commands of the next session
```
PYTHONUTF8=1 python tools/invariants.py | tail -3     # expect 59/61
git -C "C:/Users/Light/Desktop/claude/health expert" log --oneline -9   # expect HEAD = a671e64
node tools/build.mjs                                   # expect Build OK
node tools/render_probe.js                             # expect coveredStat ~20, /92, 0 errors
node tools/render_probe_seeded.js                      # expect PASS
```
Recovery anchors: `8f330be` -> `edd0adc` -> `a671e64`. Next §17 incident -> `git checkout HEAD -- <file>`.
