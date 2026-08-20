# The Wallach Codex

An offline-first, single-page health dashboard built around Dr. Joel Wallach's
"90 essential nutrients" framework. It opens straight from `file://` — no server,
no backend, no accounts, no network at runtime — and scans supplement labels on
your own device with vendored OCR (Tesseract.js). Your data stays yours: everything
persists to `localStorage`, and export/import is plain JSON.

> The **app** is *The Wallach Codex*. Its internal systems keep their own names:
> **Eden** — the three sealed, hand-edited source pillars — and **Chronicle** —
> the build ledger plus the append-only Creator's Log.

## Not medical advice

This is an educational tool that organizes one author's framework. Nutrient targets
and health claims trace to Dr. Wallach's books and are presented as *his* stated
positions, not as verified medical fact. Nothing here is medical advice — consult a
qualified professional before acting on any of it.

## This repo is meant to be read

Work lands in small, self-contained commits — each one builds, tests, logs, and
commits in a single step. To see how it is built:

- **[`CLAUDE.md`](CLAUDE.md)** — the operating contract: the two prime directives
  (Wallach is the only source of amounts; codify rather than promise), the
  `core/ → state/ → views/` layering, the build/test commands, and the engineering
  discipline the project holds itself to.
- **[`chronicle/build-log.md`](chronicle/build-log.md)** — a chronological,
  plain-language narrative of every chunk of work: what changed, why, and how it was
  verified.
- **[`chronicle/creators-log/`](chronicle/creators-log/)** — the append-only
  Creator's Log: the durable, never-rewritten record of decisions and milestones.
- The **commit history** itself — read it newest-to-oldest to watch each surface get
  built and hardened.

## Architecture

TypeScript source under `dashboard/assets/js/src/` (layered `core/ → state/ →
views/`) type-checks with `tsc` and bundles to a single IIFE at
`dashboard/assets/js/dist/main.js` via `esbuild`. The page opens directly from
`dashboard/dashboard.html` — a pure shell that carries no baked-in data. Every data
file the app reads is **generated from the sealed `eden/` pillars** (never
hand-edited) and inlined into the bundle at build time; a freshness gate regenerates
and byte-compares that data, so drift cannot ship. All user state flows through one
`state/` localStorage chokepoint. Surfaces: Coverage, Regimen, Scanner, Knowledge,
Journey, a Profile panel, and a Command Palette.

## Build / verify

```bash
node tools/build.mjs                     # type-check (tsc) + bundle (esbuild)
PYTHONUTF8=1 python tools/invariants.py  # 94 integrity gates — the board
node tools/render_probe.js               # a headless render check
```

`node tools/build.mjs` installs its own dev dependencies on first run. Alongside the
build, `tools/` holds ~40 headless render probes and ~45 Python tests that cover the
individual surfaces.

## Layout

- **`dashboard/`** — the app: the single-HTML shell, TypeScript `src/`
  (`core/ → state/ → views/`), the bundled `dist/main.js`, the sealed
  `design-system.css` and the themeable `theme.css`, in-housed fonts, and vendored
  Tesseract OCR.
- **`eden/`** — **the sealed source of truth.** Three hand-edited pillars —
  `corpus/` (the Wallach claim graph), `catalog/` (the condition + symptom
  registries), and `products/` (the Youngevity product-composition DB) — plus
  `graphics/` (sacred hand-made graphics). Everything the app ships is *generated*
  from these by `eden/tools/` into `dashboard/assets/data/`. `eden/fringe-knowledge/`
  holds Wallach content deliberately kept out of the app.
- **`tools/`** — the build + discipline toolchain: `build.mjs`, `invariants.py`,
  `safe_write.py`, `creators_log.py`, `genesis.py` (session boot), the enforcement
  `hooks/`, gate fixtures, canaries, the render probes, and the Python test suite.
- **`chronicle/`** — the record: `build-log.md`, the append-only `creators-log/`,
  and the ratified-decision docs (`contradictions/`, `decisions/`, `proposals/`).
- **`schemas/`** — JSON Schemas that validate data files at load.
- **`.claude/`** — Claude Code configuration: `settings.json` (the enforcement-hook
  wiring), the on-demand `skills/`, and the invariant baseline.

## Sources & the book texts

Every recommended amount, dose, and health claim traces to one of Dr. Wallach's
seven books, registered in `eden/corpus/books-meta.json`. **The book texts
themselves are not distributed in this repository** — they are the authors'
copyrighted works. The derived, non-infringing corpus data the app uses *is*
committed and sealed; the handful of integrity gates that read the raw book bytes
skip with a clear message when the sources are absent, so the board still runs on a
fresh clone.
