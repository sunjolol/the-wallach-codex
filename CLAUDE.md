# CLAUDE.md — The Wallach Codex

_Operating contract. Read at session start. ≤ 200 lines, self-enforced._
_High-level orientation + repository layout + constraints that apply everywhere. Behavioral defaults live in `.claude/rules/` — read the matching file before working in that domain._

## First 5 minutes

1. Read this file in full.
2. Read `genesis/02-clarifications-and-plan.md` — active phased plan.
3. Read `REVIEW.md` — enforcement contract.
4. `tail -n 20 chronicle/build-log.md` — recent project state.
5. `chronicle/next-chunk.md` — rolling session pointer + any active time-bound notes.
6. `PYTHONUTF8=1 python tools/invariants.py` — confirm baseline (tolerated reds in `.claude/invariant-baseline.json`; only NEW reds are blocking).

---

## Mission

A single-HTML, offline-first health-coverage dashboard for Dr. Joel Wallach's framework. Opens from `file://`. No server, no backend, no accounts, no telemetry, no runtime network. The user owns 100 % of their data on their device; export/import is JSON. Distributed as static files behind a CDN (Cloudflare Pages) so it cannot be attacked into bankruptcy and cannot be taken offline. Designed to run at least four years with no upkeep. Phasing and deferred-polish scope: `genesis/02-clarifications-and-plan.md`.

---

## §00 — The two prime directives

Ranked. Every other rule yields to these. Behavioral rules under `.claude/rules/` are sub-directives.

**§00.A — Wallach source-of-truth mandate (100 / 100).**
Every numeric claim, every health assertion, every recommendation traces to a Wallach allowlist primary: `dddl` · `rbs` · `eps` · `ygy` · `wallach-lecture`. No outside source contradicts Wallach without explicit user review. This serves three purposes simultaneously: (a) a single durable source of truth — the project's reason for existing; (b) legal defensibility — every claim is attributable, not invented; (c) one consistent voice across surfaces — user trust. Sealed canonical data lives in `eden/`. Enforced by `tools/invariants.py::check_wallach_stance_source_rule`. Detail: `.claude/rules/source-rule.md`.

**§00.B — Engineering standard of an elite open-source maintainer (99 / 100).**
Three operational consequences (detail: `.claude/rules/engineering-doctrine.md`):

1. **Code stays pristine.** No prose-as-comments. JSDoc only, starred-block. Narrative belongs in `chronicle/build-log.md`, commit messages, and `chronicle/contradictions/`.
2. **Discipline lives in tooling, not in promises.** Every rule that can be enforced by a hook, a lint rule, or an invariant *is*.
3. **No canonical data in views.** Data lives behind Zod schemas in `eden/` and `dashboard/assets/data/`. Views are pure renderers.

**Conflict protocol.** §00.A and §00.B disagree → STOP, write `chronicle/contradictions/<date>-<slug>.md`, surface in chat prefixed `⚠ PRIME DIRECTIVE CONFLICT`, user resolves. Default precedence A > B; silent prioritization is itself a violation.

---

## Architecture (one paragraph)

TypeScript source under `dashboard/assets/js/src/` compiles via `tsc --noEmit` + `esbuild` to one IIFE at `dashboard/assets/js/dist/main.js`. The page loads from `dashboard/dashboard.html`. Six surfaces: Coverage (⌘1), Regimen (⌘2), Scanner (⌘3), Knowledge drawer (K), Journey drawer (J), Command Palette (⌘K); plus a Profile panel. State persists to `localStorage` through one chokepoint module. OCR runs locally via vendored Tesseract.js (~22 MB in `assets/vendor/tesseract/`). Sealed canonicals: `design-system.css` and the Eden corpus (hash-anchored, user-only writer).

---

## Module layers — enforced by `eslint-plugin-boundaries`

```
views/   ──imports──▶  state/   ──imports──▶  core/
  │                       │                      │
  └──────────────may import────────────▶────────┘
                  but not the reverse
```

- `core/` — primitives. Imports only `zod`.
- `state/` — reactive state + §31 chokepoint mutations. Imports `core/`. May not import `views/`.
- `views/` — render + DOM handlers. Imports `state/`, `core/`. May not write `localStorage` directly.
- `main.ts` — entry. Imports all layers; wires once at boot.

Path aliases: `@core/*`, `@state/*`, `@views/*`. Cross-layer relative imports are banned by lint.

**Data flow (every surface):** `eden/* → schemas/* → core/* → state/* → views/*`. No view holds a canonical value as a literal.

---

## Disciplines (each is a transferable pattern with this project's instance)

- **§00 — Ranked prime directives.** Pattern: name N ≤ 3 directives, rank them, define a conflict protocol that requires writing a contradiction report instead of self-resolving. Instance: §00.A · §00.B above.
- **§17 — Write discipline.** Pattern: every project-file write routes through one atomic-verify primitive; direct write tools are hook-blocked at the boundary. Instance: `tools/safe_write.py` + `tools/hooks/pre_write_guard.py` + `tools/hooks/post_write_verify.py`. Detail: `.claude/rules/write-discipline.md`.
- **§31 — Chokepoint discipline.** Pattern: all mutations of a sensitive state surface flow through a small fixed set of named helpers that emit typed events. Direct mutation paths are lint-blocked. Instance: five helpers in `state/regimen.ts`. Detail: `.claude/rules/chokepoint-discipline.md`.
- **Hooks-enforce-everything.** Pattern: every machine-checkable rule is wired to a `PreToolUse` / `PostToolUse` / `Stop` hook so the agent cannot ship past it. Instance: `.claude/settings.json` + `tools/hooks/*.py`.
- **Round-close ritual.** Pattern: a unit of work is not "done" until a fixed verification sequence passes; the agent must not declare done otherwise. Instance: build → invariants → render probe → build-log line → Creator's Log → commit + push. Detail: `.claude/rules/commits-and-rounds.md`.
- **Render-probe contract.** Pattern: views are verified by headless end-to-end probes that assert visible state, not by isolated unit tests. Instance: `tools/render_probe*.js`. Detail: `.claude/rules/testing.md`.
- **Anti-fakery.** Pattern: if a render needs data that does not exist yet, add it to the canonical store behind a schema; never fake or stub in the view. Instance: invariant `views_state_no_inline_data` blocks any literal array/object > 10 elements outside `assets/data/`.
- **Sealed canonical.** Pattern: high-value source files carry a `*.golden.sha256` sibling; agents read freely but writes require explicit user sign-off. Instance: `dashboard/assets/styles/design-system.css`, Eden manifests.

---

## Behavioral rules — `.claude/rules/`

Read the matching file before the first write in that domain:

| When working on… | Read |
|---|---|
| any project-file write | `write-discipline.md` |
| anything under `state/` | `chokepoint-discipline.md` |
| anything touching canonical data or a view render | `data-flow.md` |
| anything under `dashboard/assets/js/src/` | `typescript.md` |
| render probes, vitest | `testing.md` |
| chunk close, commit, push | `commits-and-rounds.md` |
| bash / python on the Windows host | `windows-host.md` |
| Phase-bounded scope authorizations | `wild-west-mode.md` |
| any health number / dose / claim (§00.A) | `source-rule.md` |
| proposing a new system, tool, or invariant (§00.B) | `engineering-doctrine.md` |
| logging · history · what & why to record | `logging-doctrine.md` |

---

## Size budgets — enforced by `size-limit`

| What | Budget |
|---|---|
| `dist/main.js` gzipped | ≤ 250 KB |
| `assets/styles/*.css` combined gzipped | ≤ 150 KB |
| `dashboard/` total shipped | ≤ 350 MB (warn at 150 MB) |

JS budget failure splits into a lazy-loaded chunk. Design generosity lives in CSS, fonts, assets.

---

## File layout

```
dashboard/                                  ← the app
├── dashboard.html                          ← slim shell
├── assets/
│   ├── styles/{design-system.css,*.golden.sha256,dashboard.css}
│   ├── fonts/                              ← 5 in-housed TTF families (SIL OFL 1.1)
│   ├── data/{*.json,fixtures/}             ← Zod-validated at load · ?fixture=1 only
│   ├── vendor/tesseract/                   ← 22 MB offline OCR (gitignored)
│   └── js/{src/{core,state,views}/, dist/main.js}  ← dist GENERATED
├── package.json · tsconfig.json · eslint.config.js · .size-limit.json
└── components/                             ← v3 design-mockup references (read-only)

eden/                                       ← sealed canonical source corpus
schemas/                                    ← JSON Schemas (paired validators)
knowledge/                                  ← general health + cleaned transcripts + book extracts
transcripts/                                ← raw Wallach .en.vtt captions
wallach-refresh/                            ← self-maintaining corpus ingest pipeline
labels/                                     ← sample supplement-label JSON fixtures

chronicle/                                  ← discipline ledger
├── build-log.md · next-chunk.md            ← pre-write contract + handoff pointer
├── CHANGELOG.md · versions/                ← version narrative
├── contradictions/                         ← prime-directive + §17 incident reports
├── domain-glossary.md · worked-example-chunk.md
└── evals/

genesis/                                    ← session boot system + archived original pass-off

tools/
├── build.mjs · build-dashboard.sh          ← tsc --noEmit + esbuild
├── invariants.py · safe_write.py           ← integrity gate · §17 write primitive
├── render_probe*.js                        ← headless probes per surface
└── hooks/{pre_write_guard,pre_bash_guard,post_write_verify,stop_round_close}.py

.claude/
├── settings.json                           ← hook wiring (committed)
├── settings.local.json                     ← per-user overrides (gitignored)
├── invariant-baseline.json                 ← tolerated reds for stop_round_close.py
└── rules/                                  ← behavioral defaults (see table above)
```

---

## Glossary

- **§00 / §17 / §31** — Prime directives · Write discipline · Chokepoint discipline.
- **Round / Chunk** — Closed unit of work that ends with the Round-close ritual.
- **Version** — A coherent release captured in `chronicle/versions/v*.md`.
- **Sealed canonical** — File with a `*.golden.sha256` sibling. User-only writer.
- **Eden** — Sealed canonical source corpus under `eden/`. Every Wallach / Youngevity number originates here.
- **Chronicle** — The discipline ledger (`chronicle/`).
- **Tacitus** — Retired/excised to its own `the-tacitus-system` repo; not part of this project. Do not re-introduce.
- **The bridge** — IIFE-local → `window.*` exports in `state/*` (`lcScan`, `lcScanImage`, `lcParseLabel`, `lcLastResult`) that let DOM handlers and headless probes reach migrated engines.
- **Render probe** — A headless puppeteer script under `tools/render_probe_*.js` that drives one surface end-to-end and asserts visible state.
- **Genesis** — The session-start boot ritual.

---

## Genesis — session-start boot

User types **`genesis`** as the first message of a session. Claude runs the boot
command, presents the report, then **asks which task to resume — never a
flair-only boot.** One command:

```
PYTHONUTF8=1 python tools/genesis.py
```

It prints the banner + scoreboard (invariants · build parity · last Creator's Log
entry · build-log tail) and the live pass-off (`chronicle/next-chunk.md` — the
rolling handoff that hands a fresh session past depth instantly). The `genesis/`
folder is the boot system's home + the archived original pass-off.

Then Claude: (1) if a NEW invariant red beyond the baseline appears, STOP and
surface it as the only response; (2) else report + end with the action question —
"resume <next-order task>, or redirect?". If the user opens with substantive work
and skips `genesis`, run a silent micro-check (contract loaded + baseline known)
and proceed.

---

If anything in this file conflicts with anything older, older loses. This file is the operating contract.
