# The Wallach Codex

An offline-first, single-file health dashboard built around Dr. Joel Wallach's
"90 essential nutrients" framework. It runs entirely from `file://` — no server,
no network, no runtime dependencies — and scans supplement labels locally with
vendored OCR (Tesseract.js).

> The **app** is *The Wallach Codex*. Its internal **systems keep their own
> names**: **Eden** (the sealed canonical source pillars), and **Chronicle**
> (the discipline ledger + the sacred, append-only Creator's Log audit trail).

> **Mid-overhaul.** The project is partway through a full structural overhaul to
> a strict "pillars in, everything else generated" model (see
> [`chronicle/OVERHAUL-BLUEPRINT.md`](chronicle/OVERHAUL-BLUEPRINT.md), the active
> plan). A few files named below are labeled *vestigial* — kept until their
> replacement lands in a later phase. `CLAUDE.md` + the blueprint are the
> authoritative current-state description.

## This repo is also a working log

The commit history is meant to be *read*. Work lands in small, self-contained
commits — each one builds, tests, logs, and commits in a single step. If you're
here to see how the project is being built, start with these:

- **[`CLAUDE.md`](CLAUDE.md)** — the operating contract: architecture, the
  `core/ → state/ → views/` module-layer rules, build/test commands, and the
  engineering discipline the project holds itself to.
- **[`chronicle/OVERHAUL-BLUEPRINT.md`](chronicle/OVERHAUL-BLUEPRINT.md)** — the
  active plan: the Charter (R1–R9), the three-pillar data model, the derivation
  pipeline, the enforcement table, and the phased migration.
- **[`chronicle/build-log.md`](chronicle/build-log.md)** — a chronological,
  plain-language narrative of every chunk of work: what changed, why, and how it
  was verified.
- **[`chronicle/next-chunk.md`](chronicle/next-chunk.md)** — the rolling
  session hand-off pointer (what's done, what's next).
- The **commit history** itself — read it newest-to-oldest to watch the system
  get built and hardened surface by surface.

## Architecture (one paragraph)

TypeScript source under `dashboard/assets/js/src/` (layered `core/ → state/ →
views/`) compiles to one bundled IIFE at `dashboard/assets/js/dist/main.js` via
`tsc` + `esbuild`. The dashboard opens directly from `dashboard/dashboard.html`
— a pure shell that carries no baked data. Every data file the app reads is
**generated from the sealed `eden/` pillars** (never hand-edited) and inlined into
the bundle at build time. All user state persists to `localStorage` through one
`state/` chokepoint (§31). Surfaces: Coverage, Regimen, Scanner, Knowledge,
Journey, and a Command Palette — plus a Profile panel.

## Build / verify

```bash
node tools/build.mjs                    # type-check (tsc) + bundle (esbuild)
PYTHONUTF8=1 python tools/invariants.py # integrity invariants (the gate)
node tools/render_probe.js              # headless render check
```

## Directory glossary

Top-level folders, one line each:

- **`dashboard/`** — the app: the single-HTML shell, TypeScript `src/`
  (`core/ → state/ → views/`), bundled `dist/main.js`, the sealed
  `design-system.css`, in-housed fonts, vendored Tesseract OCR, and v3 mockup
  references under `components/`.
- **`eden/`** — **THE sealed source.** Three hand-edited pillars —
  `corpus/` (the Wallach claim graph, live), `catalog/` (the conditions +
  symptoms ID registries, live), and `products/` (the Youngevity Product DB,
  arriving in Phase F) — plus `graphics/` (sacred hand-made graphics). Everything
  the app ships is *generated* from these by `eden/tools/` into `eden/derived/`
  and `dashboard/assets/data/`; a freshness gate regenerates and byte-compares it,
  so drift can't ship. `eden/fringe-knowledge/` holds Wallach content deliberately
  kept out of the app (contained, never front-facing).
- **`schemas/`** — JSON Schemas that validate data files at load
  (`versions.schema.json`; `products-db.schema.json` for the Phase-F pillar).
- **`knowledge/`** — *vestigial.* Now holds only `products-db.json`, the interim
  Youngevity product data that the Phase-F `eden/products/` pillar replaces.
- **`chronicle/`** — the discipline ledger + audit trail: `OVERHAUL-BLUEPRINT.md`
  (active plan), `build-log.md`, `next-chunk.md`, `creators-log/` (the sacred,
  append-only Creator's Log), `CHANGELOG.md`, `versions/`, `contradictions/`,
  `evals/`.
- **`tools/`** — the app + discipline toolchain: `build.mjs`, `invariants.py`,
  `safe_write.py`, `creators_log.py`, `genesis.py` (session boot), the
  enforcement `hooks/`, and the headless render probes. (The data-derivation
  pipeline lives under `eden/tools/`.)
- **`.claude/`** — Claude Code settings, the enforcement-hook wiring
  (`settings.json`), and the behavioral `rules/`.

## Sources & licensing note

Nutrient targets and health assertions trace to the Wallach primary-source
corpus (the Eden system). The Wallach book texts in `eden/corpus/books/`
are the authors' copyrighted works, kept here only for the project's own
reference — **this repository is private** and not for redistribution.
