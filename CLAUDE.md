# CLAUDE.md — The Wallach Codex

_Operating contract. Read at session start. ≤ 200 lines, self-enforced._
_High-level orientation + repository layout + constraints that apply everywhere. Behavioral defaults live in `.claude/rules/` — read the matching file before working in that domain._

## First 5 minutes

1. Read this file in full.
2. Read `chronicle/OVERHAUL-BLUEPRINT.md` — the active plan (the full overhaul blueprint + its Charter). **Temporary + living**: pruned as phases land, so it never carries stale prose.
3. Read `REVIEW.md` — enforcement contract.
4. `tail -n 20 chronicle/build-log.md` — recent project state.
5. `chronicle/next-chunk.md` — rolling session pointer + any active time-bound notes.
6. `PYTHONUTF8=1 python tools/invariants.py` — confirm the board is green (baseline is empty by design; any red is a real regression).

---

## Mission

A single-HTML, offline-first health-coverage dashboard for Dr. Joel Wallach's framework. Opens from `file://`. No server, no backend, no accounts, no telemetry, no runtime network. The user owns 100 % of their data on their device; export/import is JSON. Distributed as static files (Cloudflare Pages) — plus, eventually, a portable permanently-offline browser — so it cannot be attacked into bankruptcy, taken offline, or broken by an update. Designed to run for years with no upkeep. Full architecture + phasing: `chronicle/OVERHAUL-BLUEPRINT.md`.

---

## §00 — The two prime directives

Ranked. Every other rule yields to these. Behavioral rules under `.claude/rules/` are sub-directives.

**§00.A — Wallach source-of-truth mandate (100 / 100).**
Every numeric target, dose, deficiency sign, and health claim traces to a Wallach allowlist primary: `dddl` · `rbs` · `eps` · `ygy` · `wallach-lecture`. **Wallach drives every recommended amount / dose / range; Youngevity products contribute composition only — NEVER a target** (no Youngevity-derived amounts; the old "two-role split" was poison and is retired). Book citations reference the sealed registry (`eden/corpus/books-meta.json`), never hand-typed. No outside source contradicts Wallach without explicit user review. Purpose: (a) one durable source of truth — the project's reason for existing; (b) legal defensibility — every claim attributable, not invented; (c) one consistent voice across surfaces. Sealed canonical data lives in the `eden/` pillars. Detail: `.claude/rules/source-rule.md`. Enforcement (per the blueprint): `amounts_wallach_only` + `citations_reference_registry`.

**§00.B — Engineering standard of an elite open-source maintainer (99 / 100).**
Operational consequences (detail: `.claude/rules/engineering-doctrine.md` + the Charter, blueprint §1):

1. **Two hand-edited sources, everything else generated.** Only the three sealed `eden/` pillars are hand-edited; every shipped artifact is derived from them and a freshness gate regenerates + byte-compares it, so drift can't ship. No canonical value lives in two hand-maintained places.
2. **Codify, don't promise.** Every rule that can be a hook / lint / invariant *is* one, shipped in the same patch as the thing it governs. A rule with no gate is labeled a WISH, never sold as safe.
3. **Code + prose stay pristine + contained.** Comments are the truthful WHY/decision audit-trail (never WHAT-noise; a drifted comment is a defect). Surface uncertainty LOUDLY. User-facing prose (summaries, glosses, alerts) lives single-copy in the segregated content store, never inline in code or a fact field. Session narrative belongs in `chronicle/` + commits. Detail: `.claude/rules/typescript.md`.

**Conflict protocol.** §00.A and §00.B disagree → STOP, write `chronicle/contradictions/<date>-<slug>.md`, surface in chat prefixed `⚠ PRIME DIRECTIVE CONFLICT`, user resolves. Default precedence A > B; silent prioritization is itself a violation.

---

## Architecture (one paragraph)

**Three sealed data pillars are the only hand-edited data:** the Wallach Corpus (`eden/corpus/`, exists), the Youngevity Product DB (`eden/products/`, hand-built), and the shared Catalog (`eden/catalog/`: essentials · nutrients · conditions · symptoms). *(products/ + catalog/ are being built per the blueprint; corpus/ is live.)* Every shipped artifact is **generated** from the pillars — `eden/tools/` derive scripts project them into `dashboard/assets/data/*.json`, which esbuild inlines into one bundle at `dashboard/assets/js/dist/main.js`. The page loads from `dashboard/dashboard.html` (a pure shell). Surfaces: Coverage (⌘1), Regimen (⌘2), Scanner (⌘3), Knowledge (K), Journey (J, rebuilt last), Command Palette (⌘K), Search (offline retrieval helper), Profile. User state persists to `localStorage` through the §31 chokepoint only — the scanner lets users add any item but can **never** write a pillar (Eden's wall). OCR runs locally via vendored Tesseract.js (~22 MB, `assets/vendor/tesseract/`, gitignored). Sealed canonicals carry a `*.golden.sha256` sibling (user-only writer): `design-system.css` + every pillar.

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

**Data flow (every surface):** `pillars (eden/) → generators (eden/tools/) → assets/data/*.json → core/ → state/ → views/`. No view holds a canonical value as a literal; no artifact under `assets/data/` is hand-edited.

---

## Disciplines (each is a transferable pattern with this project's instance)

- **§00 — Ranked prime directives.** Instance: §00.A · §00.B above.
- **§17 — Write discipline.** Every project-file write routes through one atomic-verify primitive; direct write tools are hook-blocked. Instance: `tools/safe_write.py` + `tools/hooks/{pre_write_guard,post_write_verify}.py`. Detail: `.claude/rules/write-discipline.md`.
- **§31 — Chokepoint discipline.** All mutations of a sensitive state surface flow through a small fixed set of named helpers that emit typed events; direct paths are lint-blocked. Instance: five helpers in `state/regimen.ts` (+ ESLint `no-restricted-globals` on `localStorage`). Detail: `.claude/rules/chokepoint-discipline.md`.
- **Derive-don't-duplicate.** Generated artifacts are never hand-edited; a freshness gate regenerates + byte-compares them. Instance: `corpus_embed_synced` (generalizing to `derived_artifacts_fresh`). Detail: blueprint §3.
- **Hooks-enforce-everything.** Every machine-checkable rule is wired to a `PreToolUse` / `PostToolUse` / `Stop` hook. Instance: `.claude/settings.json` + `tools/hooks/*.py`.
- **Round-close ritual.** A unit of work is not "done" until: build → invariants → render probe → build-log line → Creator's Log → re-inline build → commit + push. Detail: `.claude/rules/commits-and-rounds.md`.
- **Render-probe contract.** Views are verified by headless end-to-end probes that assert visible state. Instance: `tools/render_probe*.js`. Detail: `.claude/rules/testing.md`.
- **Anti-fakery.** If a render needs data that does not exist yet, add it to a pillar behind a schema; never fake or stub in a view. Instance: invariant `views_state_no_inline_data`.
- **Sealed canonical.** High-value source files carry a `*.golden.sha256` sibling; agents read freely, writes require explicit user sign-off. Instance: `design-system.css` + the `eden/` pillars.
- **Logs are sacred.** The Creator's Log (+ named working logs) are append-only — never deleted/edited/reordered; deletion needs the 3-part ALL-CAPS override ritual. `build → test → log → repeat` is non-negotiable. Detail: `.claude/rules/logging-doctrine.md`.

---

## Behavioral rules — `.claude/rules/`

Read the matching file before the first write in that domain:

| When working on… | Read |
|---|---|
| any project-file write | `write-discipline.md` |
| anything under `state/` | `chokepoint-discipline.md` |
| anything touching a pillar or a view render | `data-flow.md` |
| anything under `dashboard/assets/js/src/` | `typescript.md` |
| render probes, vitest | `testing.md` |
| chunk close, commit, push | `commits-and-rounds.md` |
| bash / python on the Windows host | `windows-host.md` |
| Phase-bounded scope authorizations | `wild-west-mode.md` |
| any health number / dose / claim (§00.A) | `source-rule.md` |
| proposing a new system, tool, or invariant (§00.B) | `engineering-doctrine.md` |
| logging · history · what & why to record | `logging-doctrine.md` |
| building/perfecting a page or any visual/UX surface | `visual-verification.md` |

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
eden/                                       ← THE SOURCE — three sealed pillars + tooling
├── corpus/{books,books-meta,claims,drafts,indices,essentials-canon}   ← Wallach pillar (live)
├── products/                               ← Youngevity Product DB pillar (hand-built)
├── catalog/{essentials,nutrients,conditions,symptoms}                 ← shared ID Catalog pillar
├── graphics/ · derived/ (GENERATED) · tools/  ← mining + derive pipeline; *.golden.sha256 siblings
                                            ← eden-catalog.json folds into catalog/ (blueprint D3)

dashboard/                                  ← the app (pure views over generated data)
├── dashboard.html                          ← slim shell (no baked data)
├── assets/
│   ├── styles/{design-system.css + *.golden.sha256, dashboard.css, …}
│   ├── fonts/                              ← 7 in-housed TTF families (SIL OFL 1.1)
│   ├── data/*.json                         ← GENERATED from the pillars · never hand-edited
│   ├── vendor/tesseract/                   ← 22 MB offline OCR (gitignored)
│   └── js/{src/{core,state,views}/, dist/main.js}  ← dist GENERATED
├── package.json · tsconfig.json · eslint.config.js
└── components/                             ← v3 design-mockup references (read-only)

chronicle/                                  ← discipline ledger
├── OVERHAUL-BLUEPRINT.md                   ← active plan (temporary/living)
├── build-log.md · next-chunk.md            ← pre-write contract + handoff pointer
├── creators-log/ (SACRED, append-only) · CHANGELOG.md · versions/ · contradictions/

tests/scanner-labels/                       ← scanner test fixtures (deletable when scanner done)
schemas/                                    ← JSON Schemas (versions; product schema → eden/products/)
genesis/                                    ← boot system (genesis.py); 02-plan SUPERSEDED by the blueprint

tools/{build.mjs, invariants.py, safe_write.py, creators_log.py, render_probe*.js, hooks/*}
.claude/{settings.json, settings.local.json (gitignored), invariant-baseline.json, rules/}
```

---

## Glossary

- **§00 / §17 / §31** — Prime directives · Write discipline · Chokepoint discipline.
- **Pillar** — One of the three sealed, hand-edited data sources under `eden/`: Corpus · Products · Catalog. Everything else is generated from them.
- **Generated artifact** — Any file derived from the pillars (all `assets/data/*.json`, indices, the bundle). Never hand-edited; a freshness gate proves it matches source.
- **The Charter** — The R1–R9 enforceable rules + their machine gates (blueprint §1); a rule with no gate is a labeled WISH.
- **Sealed canonical** — File with a `*.golden.sha256` sibling. User-only writer.
- **Eden** — The three sealed pillars under `eden/`. Every Wallach / Youngevity number originates here.
- **Round / Chunk** — Closed unit of work that ends with the Round-close ritual.
- **Chronicle** — The discipline ledger (`chronicle/`). The Creator's Log within it is SACRED (append-only).
- **The bridge** — `window.*` exports in `state/*` (`persistRegimen`, `lcScan`, …) that let DOM handlers + headless probes reach the engines.
- **Render probe** — A headless puppeteer script under `tools/render_probe_*.js` that drives one surface end-to-end and asserts visible state.
- **Genesis** — The session-start boot ritual.

---

## Genesis — session-start boot

User types **`genesis`** as the first message of a session. Claude runs the boot command, presents the report, then **asks which task to resume — never a flair-only boot.** One command:

```
PYTHONUTF8=1 python tools/genesis.py
```

It prints the banner + scoreboard (invariants · build parity · last Creator's Log entry · build-log tail) and the live pass-off (`chronicle/next-chunk.md`). Then Claude: (1) if a NEW invariant red appears, STOP and surface it as the only response; (2) else report + end with the action question — "resume <next-order task>, or redirect?". If the user opens with substantive work and skips `genesis`, run a silent micro-check (contract loaded + board green) and proceed.

---

If anything in this file conflicts with anything older, older loses. This file is the operating contract.
