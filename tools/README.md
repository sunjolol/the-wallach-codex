# tools/

Operational scripts for the Wallach Codex, in two groups: the **build + verify**
toolchain the app depends on, and the **discipline core** (the atomic write primitive,
the invariant gate, the Creator's Log, and the hooks that enforce them). Everything here
is run from the command line; nothing runs at app runtime.

> The **data-derivation pipeline** (pillars → generated `dashboard/assets/data/*.json`)
> lives under **`eden/tools/`**, not here — `build_embeds.py` (the unified generator),
> `corpus_derive` / `corpus_embed`, `targets_derive`, `catalog_*`, `products_embed`.
> See `eden/README.md` and `eden/corpus/README.md`.

## Layout

```
tools/            build + discipline scripts (the twelve files below)
  probes/         37 headless Puppeteer render probes, hand-run
  tests/          42 negative-control tests, hand-run
  hooks/          the four enforcement hooks the harness wires in
  gate-fixtures/  frozen inputs a few gates and probes compare against
  canaries/       written on every board run to prove the write path (own README)
  design-libs/    hash-pinned browser libraries used ONLY by design mockups
```


## Build + verify

| File | What it does |
|---|---|
| `build.mjs` | The build: `tsc --noEmit` type-check + `esbuild` bundle of `dashboard/assets/js/src/` into one IIFE at `dist/main.js` (inlining the generated `assets/data/*.json`). The canonical build entry point. |
| `vendor-tesseract.js` | One-shot downloader that vendors Tesseract.js + language data into the dashboard's offline OCR folder. |
| `render_probe.js` | Headless Coverage boot/smoke **reporter** — prints tile counts by section, goal chips, the ledger recon line, page errors and failed resources. It reports; it does not assert. The asserting Coverage probe is `render_probe_coverage_add_remove.js`. |
| `render_probe_seeded.js` | Coverage with a seeded regimen. |
| `render_probe_scan.js` | Native scan engine — verdict + gap-fill + goal tagging + scan-history write, driven through `window.lcScan`. |
| `render_probe_scanner.js` | Scanner surface mount — the Scan-step idle shell renders, the retired in-content stepper strip stays absent, and the ingredients box stays full-width below the upload zone. |
| `render_probe_scan_verdicts.js` | The verdict matrix — the gluten/oats hard reject and its gluten-free-oats exception, the redeemable seed-oil offset, and exact-match dye detection with mis-fire guards. |
| `render_probe_scanner_concurrency.js` | Scanner re-entrancy + Tesseract load idempotency — the "Reading the label…" hang regression gate. |
| `render_probe_ocr.js` | Scanner OCR path (no WASM load). |
| `render_probe_adopt.js` | Scanner → adopt → Coverage cascade. |
| `render_probe_knowledge.js` | Knowledge drawer. |
| `render_probe_profile.js` | Profile panel. |
| `mockup_measure.js` | Rendered-geometry report for a standalone page — per-figure authored-vs-rendered scale, SVG text collisions, clipped labels, and a real-wheel scroll test. `hooks/post_write_verify.py` prints this command as the proof step after a standalone-page write. |
| `style_diff.js` | Computed-style diff of a live surface vs a mockup — prints only the `getComputedStyle` deltas (the "measure, don't eyeball" visual gate). |

Plus 27 further per-surface probes under `probes/` (element headers, the coverage classifier, the recycle
bin, regimen slots, search, ORAC, reduced motion). Each states its scope in its own header
comment; `head -20 tools/probes/render_probe_<name>.js` shows what it guards.

## Discipline core

| File | What it does |
|---|---|
| `genesis.py` | The session-boot ritual — prints the scoreboard (invariants · build parity · last Creator's Log entry · `build-log.md` tail) + the local `chronicle/next-chunk.md` hand-off. Triggered by typing `genesis` at session start. |
| `safe_write.py` | The atomic-verify write primitive (`replace`/`append`/`rewrite`/`check`). Every project-file write routes through it; direct write tools are hook-blocked. |
| `invariants.py` | The integrity gate — runs the invariant manifest (currently 94). Round-close blocks on any NEW red beyond `.claude/invariant-baseline.json`. |
| `creators_log.py` | CLI writer for the sacred, append-only Creator's Log (`chronicle/creators-log/log.jsonl` + generated `LOG.md`/`INDEX.md`/`digests/`): `append`/`verify`/`digest`/`list`. No delete path by design. |
| `hooks/pre_write_guard.py` | PreToolUse (Edit/Write/MultiEdit) — blocks direct project-file writes; forces `safe_write`. Auto-protects any path with a `*.golden.sha256` sibling. |
| `hooks/pre_bash_guard.py` | PreToolUse (Bash) — blocks catastrophic / corruption-prone shell commands, bans bash writes into the guarded project dirs (`chronicle/`, `tools/`, `eden/`), and protects the sacred Creator's Log. |
| `hooks/post_write_verify.py` | PostToolUse (Bash) — re-reads every file `safe_write` reported OK: NUL bytes / UTF-8 round-trip / emptiness, plus the standalone-page scroll-unlock check on any `.html` that links the app stylesheets. |
| `hooks/stop_round_close.py` | Stop hook — hard-blocks declaring a round done with a NEW invariant red, a `build-log.md` line missing its Creator's Log entry, or a stale bundle (the ledger head not yet re-inlined into `dist/main.js`). |

## Gate fixtures

| File | What it does |
|---|---|
| `gate-fixtures/frontface-verified.json` | The frontface verification ledger read by the `enriched_book_is_verified` gate — which books are source-verified, which claim ids have been page-read, and the frozen backlog that predates the gate. |
| `gate-fixtures/lede-backlog.json` | The frozen lede backlog read by the `explore_entity_lede_authored` gate. It can only shrink: a NEW explore entity is never grandfathered, so it stays red until a lede is authored. |
| `gate-fixtures/mechanism-sections.json` | The pre-refactor element-header snapshot `render_probe_mech_shape.js` compares the current bundle against. |

## Corpus + design tooling

| File | What it does |
|---|---|
| `claim_review.py` | Renders sealed (or `--draft`) claims in the one review shape: QUESTION → SHORT ANSWER → FULL ANSWER → QUOTE, complete, never truncated. No summary mode by design. |
| `mockup_harness.py` | Generates a design-mockup shell that renders in the REAL container geometry, reading the stylesheet list out of `dashboard.html` rather than copying it. |
| `sync_board_claims.py` | Rewrites `CLAUDE.md`'s gate total and external-anchor count from the live invariant registry, so a hand-typed count can never be reintroduced. |

## Render probes and negative tests

`probes/render_probe_*.js` — 37 hand-run headless Puppeteer probes. Each file's header comment
states what it asserts and carries its own usage line. Read that header before trusting a
probe's silence: some assert and exit non-zero, and `render_probe.js` only reports.

`tests/test_*.py` — 42 hand-run negative controls. A negative control plants a defect and proves
the gate meant to catch it actually goes red; most are cited by name from the `lesson_ref`
of the gate they prove. A gate with no negative control has never been shown able to fail.
