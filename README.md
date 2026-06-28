# The Wallach Codex

An offline-first, single-file health dashboard built around Dr. Joel Wallach's
"90 essential nutrients" framework. It runs entirely from `file://` — no server,
no network, no runtime dependencies — and scans supplement labels locally with
vendored OCR (Tesseract.js).

> The **app** is *The Wallach Codex*. Its internal **systems keep their own
> names**: **Eden** (the sealed canonical source corpus), and **Chronicle** 
> (the discipline ledger + the sacred, append-only Creator's Log audit trail)

## This repo is also a working log

The commit history is meant to be *read*. Work lands in small, self-contained
commits — each one builds, tests, logs, and commits in a single step. If you're
here to see how the project is being built, start with these:

- **[`CLAUDE.md`](CLAUDE.md)** — the operating contract: architecture, the
  `core/ → state/ → views/` module-layer rules, build/test commands, and the
  engineering discipline the project holds itself to.
- **[`chronicle/build-log.md`](chronicle/build-log.md)** — a chronological,
  plain-language narrative of every chunk of work: what changed, why, and how it
  was verified.
- **[`chronicle/next-chunk.md`](chronicle/next-chunk.md)** — the rolling
  session hand-off pointer (what's done, what's next).
- The **commit history** itself — read it newest-to-oldest, or follow the
  `Chunk N` commits forward to watch the dashboard get built surface by surface.

## Architecture (one paragraph)

TypeScript source under `dashboard/assets/js/src/` (layered `core/` → `state/`
→ `views/`) compiles to one bundled IIFE at `dashboard/assets/js/dist/main.js`
via `tsc` + `esbuild`. The dashboard opens directly from
`dashboard/dashboard.html`. All state persists to `localStorage` through one
chokepoint module. Six surfaces — Coverage, Regimen, Scanner, Knowledge,
Journey, and a Command Palette — plus a Profile panel.

## Build / verify

```bash
node tools/build.mjs                 # type-check (tsc) + bundle (esbuild)
python tools/invariants.py           # integrity invariants
node tools/render_probe.js           # headless render check
```

## Directory glossary

Top-level folders, one line each:

- **`dashboard/`** — the app: the single-HTML shell, TypeScript `src/`
  (`core/ → state/ → views/`), bundled `dist/main.js`, the sealed
  `design-system.css`, vendored Tesseract OCR, and v3 mockup references under
  `components/`.
- **`eden/`** — the sealed canonical source, in three wings: the Youngevity
  product catalog (`eden-catalog.json`), the **`corpus/`** Wallach claim graph
  (his books → extracted, hash-anchored claims + derived indices), and the
  hand-made `graphics/`. Every Wallach/Youngevity number, label, and claim
  originates here; hash-anchored, user-only-writable once sealed.
- **`schemas/`** — JSON Schemas that validate the data files at load.
- **`knowledge/`** — Wallach corpus + general health/educational reference
  (cleaned transcripts, book extracts, manifests, research images).
- **`transcripts/`** — raw Wallach lecture/interview captions (`.en.vtt`); the
  source `wallach-refresh/` ingests. See `transcripts/README.md`.
- **`wallach-refresh/`** — the self-maintaining corpus pipeline (yt-dlp captions,
  book + podcast ingest → `knowledge/`). See `wallach-refresh/README.md`.
- **`labels/`** — sample supplement-label JSON fixtures for Scanner testing. See
  `labels/README.md`.
- **`chronicle/`** — the discipline ledger + audit trail: `build-log.md`,
  `next-chunk.md`, `creators-log/` (the sacred, append-only Creator's Log),
  `domain-glossary.md`, `worked-example-chunk.md`, `CHANGELOG.md`, `versions/`,
  `contradictions/`, `evals/`.
- **`tools/`** — `build.mjs`, `invariants.py`, `safe_write.py`, the enforcement
  `hooks/`, and the headless render probes.
- **`genesis/`** — the session boot system + the archived Cowork → Claude-Code handoff: the pre-handoff conversation
  and the active build plan.
- **`.claude/`** — Claude Code settings + the enforcement-hook wiring
  (`settings.json`).

## Sources & licensing note

Nutrient targets and health assertions trace to the Wallach primary-source
corpus (the Eden system). Reference book PDFs under `knowledge/wallach-books/`
are the authors' copyrighted works, kept here only for the project's own
reference — **this repository is private** and not for redistribution.
