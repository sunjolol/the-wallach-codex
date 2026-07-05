# tools/

Operational scripts for the Wallach Codex, in three groups: the **build + verify**
toolchain the app depends on, the **discipline core** (the §17 write primitive,
the invariant gate, the Creator's Log, and the hooks that enforce them), and the
**data pipeline** that turns the Wallach corpus + Youngevity catalog into the
dashboard's embedded data. Python is user-side; the agent invokes everything
through bash.

(`tools/canaries/` has its own README. `__pycache__/` is generated + gitignored.)

## Build + verify

| File | What it does |
|---|---|
| `build.mjs` | The build: `tsc --noEmit` type-check + `esbuild` bundle of `dashboard/assets/js/src/` into one IIFE at `dist/main.js`. |
| `build-dashboard.sh` | bash wrapper around the Node build script. |
| `vendor-tesseract.js` | One-shot downloader that vendors Tesseract.js + language data into the dashboard's offline OCR folder. |
| `render_probe.js` | Headless Coverage render check — drives the surface, asserts visible state, exits 0 / non-zero. |
| `render_probe_seeded.js` | Coverage with a seeded regimen. |
| `render_probe_scan.js`, `render_probe_scanner.js` | Scanner verdict path. |
| `render_probe_ocr.js` | Scanner OCR path (no WASM load). |
| `render_probe_adopt.js` | Scanner → adopt → Coverage cascade. |
| `render_probe_knowledge.js` | Knowledge drawer + product vault. |
| `render_probe_journey.js` | Journey drawer. |
| `render_probe_profile.js` | Profile panel. |
| `style_diff.js` | Computed-style diff of a live surface vs its v3 mockup — prints only the `getComputedStyle` deltas (the "measure, don't eyeball" visual gate). |

## Discipline core

| File | What it does |
|---|---|
| `genesis.py` | The session-boot ritual — prints the scoreboard (invariants · build parity · last Creator's Log entry · `build-log.md` tail) + the live `chronicle/next-chunk.md` hand-off. Triggered by typing `genesis` at session start. |
| `safe_write.py` | The §17 atomic-verify write primitive (`replace`/`append`/`rewrite`/`check`). Every project-file write routes through it; direct write tools are hook-blocked. |
| `invariants.py` | The integrity gate — runs the invariant manifest. Round-close blocks on any NEW red beyond `.claude/invariant-baseline.json`. |
| `creators_log.py` | CLI writer for the sacred, append-only Creator's Log (`chronicle/creators-log/log.jsonl` + generated `LOG.md`): `append`/`verify`/`digest`/`list`. No delete path by design. |
| `hooks/pre_write_guard.py` | PreToolUse (Edit/Write/MultiEdit) — blocks direct project-file writes; forces `safe_write`. |
| `hooks/pre_bash_guard.py` | PreToolUse (Bash) — blocks catastrophic / §17-corrupting shell commands and protects the sacred Creator's Log. |
| `hooks/post_write_verify.py` | PostToolUse (Bash) — scans for NUL bytes / UTF-8 round-trip / emptiness after writes. |
| `hooks/stop_round_close.py` | Stop hook — hard-blocks declaring a round done with a NEW invariant red, or a `build-log.md` line missing its Creator's Log entry. |

## Data pipeline

Turns the sealed corpus + Youngevity catalog into the dashboard's embedded data
(all output is Zod-validated at load; final nutrient numbers are corrected by the
user in one end pass).

| File | What it does |
|---|---|
| `build_ingredients_quickref.py` | Builds the ingredients quick-reference for non-essential ingredients (botanicals, amino acids, blend components, fatty acids) the essentials dataset doesn't cover. |
| `build_regimen_label_lookup.py` | Builds the regimen ↔ label lookup the Regimen "Full edit" Label-Check form consults by product name. |

