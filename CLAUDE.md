# CLAUDE.md — Operating contract for the Wallach project

_Single source of human-judgment truth. Read at session start. ≤250 lines, enforced._
_The lint/type/test layers enforce what this file says. If lint disagrees with this file, this file is wrong — fix it, don't override lint._

---

## §00 — The two prime directives

This project has exactly two prime directives. They are ranked. Any other rule (in `memory/`, in `brain/`, in tool descriptions) is a sub-directive and yields to these.

**§00.A — Wallach source-of-truth mandate (100 / 100).**
Every numeric claim, every health assertion, every recommendation cites a Wallach allowlist primary: `dddl` · `rbs` · `eps` · `ygy` · `wallach-lecture`. No outside sources contradict Wallach without explicit user review. Enforced by `tools/invariants.py::check_source_rule`.

**§00.B — Senior-dev coding standard (99 / 100).**
This codebase is engineered to the standard of a small team of elite open-source maintainers (calibration references: Anthony Fu's vitesse ecosystem, tldraw's `@tldraw/state` + `@tldraw/store`, Excalidraw's client-only SPA architecture). Discipline lives in tooling, not in promises. Specific rules below.

**Conflict protocol.** If §00.A and §00.B appear to conflict, STOP. Write `brain/contradictions/<date>-<slug>.md` describing the conflict. Surface in chat with `⚠ PRIME DIRECTIVE CONFLICT` prefix. User resolves manually. Do not self-resolve. Default precedence is A > B, but silent prioritization is itself a violation.

---

## Architecture (the whole system in one paragraph)

A single-HTML offline-first health dashboard for the Wallach framework. TypeScript source under `dashboard/assets/js/src/` compiles to one bundled IIFE at `dashboard/assets/js/dist/main.js` via `tsc --noEmit` + `esbuild`. The dashboard opens directly from `file://` — no server, no internet, no runtime dependencies. Six surfaces: Coverage (⌘1), Regimen (⌘2), Scanner (⌘3), Knowledge drawer (K), Journey drawer (J), Command Palette (⌘K), plus a Profile panel (click "Luneth" in header) that surfaces Creator's Log, invariant scoreboard, and build status. State persists to `localStorage` through one chokepoint module. OCR runs locally via vendored Tesseract.js (~22MB in `assets/vendor/tesseract/`). Sealed canonical: `design-system.css` (hash-anchored, user-only writer).

---

## Module layer rules — enforced by `eslint-plugin-boundaries`

```
views/   ──imports──▶  state/   ──imports──▶  core/
  │                       │                      │
  └──────────────may import────────────▶────────┘
                  but not the reverse
```

- `core/` — primitives. May import: nothing of ours. Imports `zod` only.
- `state/` — reactive state + chokepoint mutations. May import: `core/`. May not import `views/`.
- `views/` — render functions + DOM event handlers. May import: `state/`, `core/`. May not write to `localStorage` directly.
- `main.ts` — entry. May import: all layers. Wires everything once at boot.

**Path aliases** (in `tsconfig.json`): `@core/*`, `@state/*`, `@views/*`. Cross-layer imports must use aliases — relative `../../` imports across layers are banned by lint.

---

## Build / test / verify — copy-paste commands

```bash
# Type-check + bundle (the canonical build)
bash tools/build-dashboard.sh

# Type-check only (fast iteration)
cd dashboard && npx tsc --noEmit

# Lint (fix what's safe)
cd dashboard && npx eslint . --fix

# Unit tests (state modules only — views verified visually)
cd dashboard && npx vitest run "assets/js/src/state/**"

# Dead-code scan
cd dashboard && npx knip

# Circular-dep scan
cd dashboard && npx madge --circular assets/js/src

# Bundle size check
cd dashboard && npx size-limit

# Full invariant pass
python3 tools/invariants.py

# First-time Tesseract vendor (~22MB download, one-shot)
node tools/vendor-tesseract.js
```

**`pre-commit` hook runs:** `tsc --noEmit` + `eslint --fix` + `prettier --write` + `vitest run state/**`.
**`pre-push` hook runs:** full build + `knip` + `madge --circular` + `size-limit` + `python3 tools/invariants.py`.
**Either failing blocks the commit/push.** Discipline is not optional — git refuses.

---

## Size budgets — enforced by `size-limit`

| What | Budget | Catches |
|---|---|---|
| `dist/main.js` gzipped | ≤ 250 KB | Spaghetti accumulation in the JS runtime |
| `assets/styles/*.css` combined gzipped | ≤ 150 KB | Design-vocabulary bloat (intentionally generous — design wins) |
| `dashboard/` total shipped size | ≤ 350 MB (warn at 150 MB) | Portability ceiling |

**Design generosity lives in CSS, fonts, and assets.** Adding glow effects, animations, new font weights, denser layouts → CSS budget. JS budget unaffected. If JS budget fails, the answer is "split into a lazy-loaded chunk," not "raise the budget."

---

## Never-dos (the explicit blocklist)

1. **Never edit `dist/main.js` directly.** It is generated. Edit `.ts` source, run the build. The pre-push hook re-bundles and fails if your hand-edited dist differs from the rebuild.
2. **Never inline demo/fixture data in `state/` or `views/`.** Fixtures live under `assets/data/fixtures/` and load only behind `?fixture=1`. Lint bans literal arrays/objects above 10 elements outside `assets/data/`.
3. **Never touch `window.localStorage` outside `core/storage.ts`.** All reads pass through Zod schemas; all writes go through one of the named chokepoints. Lint rejects bare `localStorage.` references elsewhere.
4. **Never use `any`.** `unknown` at boundaries; narrow with Zod. `@typescript-eslint/no-explicit-any: error`.
5. **Never write prose-as-comments narrating your reasoning.** JSDoc only. `multiline-comment-style: starred-block`. If you have a multi-paragraph thought, it goes in `brain/`, not in code.
6. **Never claim "done" without `tools/build-dashboard.sh` exit 0 + invariants pass.** The Round-close ritual is non-negotiable.
7. **Never `Edit` files under `memory/`, `knowledge/`, `brain/`, `tools/`, `dashboard/assets/styles/design-system.css`, or `schemas/`.** Use `tools/safe_write.py replace` (the §17 ban exists because the Edit tool has silently truncated these files 7+ times).
8. **Never bypass the layer rules** (`views/` → `state/` → `core/`). If you find yourself wanting to, the architecture is wrong — refactor, don't pierce the boundary.

---

## Chokepoint discipline (§31)

Every regimen state mutation flows through exactly one of these five named helpers, defined in `state/regimen.ts` and exposed at `window.*` for the legacy bridge:

- `persistRegimen(slot, items)` — full slot write
- `saveRgOverride(key, value)` — per-item override
- `saveRgManual(items)` — manual entries
- `saveRgRemoved(ids)` — removal tracking
- `saveRgUserGoals(goals)` — goal state

These are the **only** allowed writers. Each emits a typed `regimen:changed` event. Subscribers in `core/events.ts` cascade re-renders. Direct `localStorage.setItem('wallachRegimen_*', …)` outside these helpers fails lint.

---

## Round-close ritual (the discipline that closes the corruption loop)

A round is not "shipped" until **all** of the following pass:

1. `bash tools/build-dashboard.sh` exits 0
2. `npx vitest run "state/**"` exits 0
3. `python3 tools/invariants.py` reports ≥ baseline passing
4. One-line entry appended to `brain/build-log.md`: `[timestamp] surface · concern · file(s) · rationale`
5. One Creator's Log event written via `state/log.ts::log()` (auto-mirrors to `wallachCreatorsLog_v1` LS key, visible in Profile panel)

**Skipping any of (1)–(5) means the round is not closed.** Do not write "shipped" or "done" in chat without all five. This is the audit trail Luneth needs to verify discipline is firing.

---

## File layout — where things live

```
dashboard/
├── dashboard.html                          ← slim shell
├── assets/
│   ├── styles/
│   │   ├── design-system.css               ← SEALED · hash-anchored · user-only writer
│   │   ├── design-system.golden.sha256
│   │   └── dashboard.css                   ← app-shell layout only
│   ├── fonts/                              ← 5 in-housed TTF families (SIL OFL 1.1)
│   ├── data/
│   │   ├── *.json                          ← validated by Zod schemas at load
│   │   └── fixtures/                       ← demo data, ?fixture=1 only
│   ├── vendor/tesseract/                   ← 22MB offline OCR
│   └── js/
│       ├── src/
│       │   ├── core/                       ← primitives · storage · schemas · events · eden
│       │   ├── state/                      ← reactive state + chokepoint mutations + tests
│       │   └── views/                      ← render functions + DOM handlers
│       └── dist/main.js                    ← GENERATED — never hand-edit
├── package.json
├── tsconfig.json
├── eslint.config.js                        ← @antfu/eslint-config + layer-boundary plugin
├── .size-limit.json                        ← bundle budgets
└── components/                             ← v3 design-mockup references (read-only)

tools/
├── build-dashboard.sh                      ← tsc --noEmit + esbuild
├── invariants.py                           ← all integrity invariants
├── safe_write.py                           ← the §17-compliant edit primitive
└── vendor-tesseract.js                     ← one-shot OCR vendor

memory/                                     ← long-term preferences + saga
brain/
├── CHANGELOG.md                            ← version-by-version narrative
├── versions/                               ← detailed per-version notes
├── build-log.md                            ← Round-close discipline log
└── contradictions/                         ← prime-directive conflict reports

knowledge/                                  ← Wallach corpus + design wisdom + research
schemas/                                    ← JSON Schemas for data files
```

---

## Glossary

- **§17** — Edit-tool ban for `memory/`, `knowledge/`, `brain/`, `tools/`, `dashboard/assets/styles/design-system.css`, `schemas/`. Use `safe_write.py`.
- **§31** — Chokepoint discipline. Five named helpers are the only writers to regimen state.
- **§00** — The two prime directives + the senior-dev coding standard rules above.
- **Round** — A closed unit of work that ends with the Round-close ritual. Multiple rounds per version.
- **Version** — A coherent release captured in `brain/versions/v*.md`.
- **Sealed canonical** — A file with a hash anchor (`*.golden.sha256`). User-only writer. Read freely, never edit after seal.
- **Eden corpus** — The Wallach allowlist primaries under `knowledge/`. Source-rule cornerstone.
- **The bridge** — The IIFE-local-to-`window.*` overwrite in `state/regimen.ts` that lets legacy callers route through new chokepoints.
- **Genesis** — The session-start boot ritual. User types `genesis`, Claude reports the five-step catch-up before any work begins. See Genesis section below.
- **Tacitus** — The historical audit/integrity layer (silent observer). Houses feature flags + invariant baselines.
- **Cura** — Health/care content layer (Wallach corpus → user-facing logic).
- **Aegis** — Defense-in-depth shield layer (validation, atomic ops, escape-by-default).
- **Eden** — Sealed canonical primary sources. Wallach allowlist lives here. Hash-anchored, user-only writer.

---

## Genesis — the session-start ritual

User types **`genesis`** as the first substantive message of every session. That triggers a five-step catch-up Claude reports in chat before any work begins.

The five steps:

1. **CLAUDE.md loaded** — confirm operating contract is in context.
2. **Build-log tail** — last 5 entries from `brain/build-log.md`.
3. **Invariant scoreboard** — run `python3 tools/invariants.py`, surface any red.
4. **Build parity** — confirm `dist/main.js` matches a fresh rebuild (or call out drift).
5. **Latest Creator's Log entry** — surface the most recent `wallachCreatorsLog_v1` entry. This is the discipline audit — if work shipped last session but no log line exists, the *absence* is the alarm.

Output format:

```
∴ GENESIS ∴
⊢ CLAUDE.md loaded
⊢ build-log last 5: <…>
⊢ invariants: N/total passing · red: <list or "none">
⊢ dist parity: fresh | drift
⊢ last log entry: <ts · surface · summary>
⊢ ready.
```

If any step fails (missing log, drift detected, invariants regressed beyond baseline), Claude STOPs and surfaces the failure as the only response — no other work begins until acknowledged.

If the user begins with substantive work without typing `genesis`, Claude runs a silent micro-check (CLAUDE.md loaded + invariant baseline known) and proceeds. The full ritual is reserved for the explicit invocation — discipline visible by user choice.

If anything in this file conflicts with anything older — older loses. This file is the operating contract.
