# Dashboard Architecture (v3 — Round 161+)

This document describes the **new modular architecture** introduced in the Round 161 total-overhaul. The legacy `dashboard.html` v1 architecture is still in place during migration; see `README.md` for legacy doc. As each round of the strangler-fig migration completes, sections of this document supersede sections of the legacy README, until Round 5 collapses both into one.

## At a glance

```
dashboard/
├── dashboard.html              ← slim shell (post-Round 1·B), loads dist/main.js
├── package.json                ← TS + esbuild devDependencies
├── tsconfig.json               ← strict mode, ES2022 target
├── ARCHITECTURE.md             ← this file
├── README.md                   ← legacy doc (retires in Round 5)
│
├── assets/
│   ├── styles/
│   │   ├── design-system.css   ← single source of visual truth (sealed)
│   │   ├── design-system.golden.sha256
│   │   └── STYLE-GUIDE.md
│   │
│   ├── fonts/                  ← 5 in-housed font families (SIL OFL 1.1)
│   │
│   ├── data/                   ← extracted from legacy in Round 1·A
│   │   ├── *.json              ← 8 data blocks (essentials, vault, etc.)
│   │   └── creators-log/*.md   ← 5 markdown blocks (saga, lessons, …)
│   │
│   └── js/
│       ├── src/                ← .ts canonical truth (edit here)
│       │   ├── main.ts                       — entry point
│       │   ├── core/{storage,events,eden,source-rule}.ts
│       │   ├── state/{regimen,coverage,scanner,goals,journey}.ts
│       │   └── views/{coverage,regimen,scanner,knowledge,journey,palette}.ts
│       │
│       ├── dist/main.js        ← BUILT artifact (committed, browser loads this)
│       └── (legacy-dashboard.js will land here in Round 1·B)
│
└── components/                 ← v3 mockups (the design-locked references)
    ├── workspace-coverage-v3.2-PROPOSAL.html
    ├── workspace-regimen-v3-PROPOSAL.html
    ├── workspace-scanner-v3-PROPOSAL.html
    ├── drawer-knowledge-v3-PROPOSAL.html
    ├── drawer-journey-v3-PROPOSAL.html
    └── command-palette-v3-PROPOSAL.html
```

## The 3-layer module graph

```
┌─────────────────────────────────────────────────────────────────┐
│  views/   coverage  regimen  scanner  knowledge  journey  palette │  ← render only · no LS writes
├─────────────────────────────────────────────────────────────────┤
│  state/   regimen   coverage  scanner   goals   journey         │  ← domain state · gated mutations
├─────────────────────────────────────────────────────────────────┤
│  core/    storage   events   eden   source-rule                 │  ← infrastructure primitives
└─────────────────────────────────────────────────────────────────┘
                              ↑
            dependencies always flow upward; never down.
```

**Hard rule:** `views/` never imports another `views/` module, and never reads `localStorage` directly. `state/` modules never import each other (they communicate via `core/events` pub/sub). `core/` modules are leaves — they import nothing else from this graph.

## How the §31 chokepoint discipline becomes architectural

In the legacy file, §31 was enforced by **285 comments** reminding the author "go through `window.persistRegimen`, don't write LS directly." That works if you remember; it fails silently if you don't.

In v3, the rule is enforced by the module graph:

1. **Only `core/storage.ts` calls `localStorage.{get,set,remove}Item`.** Every other file imports `set()`, `get()`, `remove()` from there. Any direct `localStorage` access elsewhere is a code-review red flag and would eventually become a lint rule.

2. **Only `state/regimen.ts` writes regimen LS keys.** Every other module that needs to mutate regimen state imports `persistRegimen`, `saveRgOverride`, `rgRemove`, `adoptFromRec`, etc. from `state/regimen.ts`. Views never own state; they call the chokepoint and then re-render when the event fires.

3. **State change announcement is the chokepoint's last line.** Each public API in `state/regimen.ts` ends with `events.emit('regimen:changed', {...})`. Subscribers register via `events.on('regimen:changed', handler)` in their `mount()` and unsubscribe in their `unmount()`. Forgetting to subscribe means a stale view, which is a visible bug — much louder than a silent state-sync miss.

4. **Cross-tab sync rides the same bus.** `core/storage.ts` listens for the native `storage` event and re-fires the corresponding typed event. A regimen write in tab A reaches every subscriber in tab B with zero extra plumbing.

The Round-archaeology comments (1,530 of them in legacy) travel with the code they explain. They land in the relevant `.ts` file as JSDoc / inline block comments, documenting **why** every decision was made.

## How to build

```bash
cd dashboard
npm install                       # first-time only — installs TypeScript + esbuild
bash ../tools/build-dashboard.sh  # compiles src/ → dist/main.js
```

The browser loads `dist/main.js` directly via `<script type="module">`. **You only need Node to rebuild.** Open `dashboard.html` in any browser after a build and it works with zero runtime dependencies (modulo Tesseract.js, the lone external carve-out for OCR).

### What the build does

1. `tsc --noEmit` — strict type-check (every chokepoint API surface gets verified)
2. `esbuild` — bundles `src/main.ts` + all its imports into a single `dist/main.js` (browser-runnable ES module, ~1ms per build typically)
3. Verifies the output exists + is non-empty
4. Fails loudly on any type error

### Build-freshness invariant

`tools/invariants.py` runs `check_dashboard_dist_fresh` (added in Round 1·A): if any file under `assets/js/src/**/*.ts` is newer than `assets/js/dist/main.js`, the invariant fails. This prevents shipping a dashboard whose runtime contract is stale relative to its source.

## The strangler-fig migration plan

| Round | Phase | What moves | What stays in legacy |
|-------|-------|------------|----------------------|
| **1·A** | Toolchain + scaffolds + data extraction | Build pipeline, empty TS modules, `assets/data/*.json` + `assets/data/creators-log/*.md` | All JS, all HTML |
| **1·B** | Skeleton swap | New slim `dashboard.html` + `assets/js/legacy-dashboard.js` (verbatim copy of old JS, still wired) | Logic — but inside a parked file |
| **2** | Coverage workspace | Periodic table → `views/coverage.ts` + `state/coverage.ts`. Live-recompute layer → `state/coverage.ts`. | Regimen, Scanner, drawers, palette, Creator's Log |
| **3** | Regimen workspace | All §31 regimen chokepoints → `state/regimen.ts`. Slot ops, dose math, cart actions → `views/regimen.ts`. | Scanner, drawers, palette, Creator's Log |
| **4** | Scanner workspace | OCR pipeline → `state/scanner.ts` + `views/scanner.ts`. Tesseract dynamic-import. | Drawers, palette, Creator's Log |
| **5** | Drawers + palette + sealing | Knowledge, Journey, Command Palette. Drop Google Fonts CSP. Promote design-system invariants warn → error. Seal golden hash. Retire `legacy-dashboard.js`. Merge this doc + README.md. | Nothing — legacy file deleted |

At every round boundary the dashboard fully works. A regression in any round rolls back to the previous round's chokepoint sourcing, with no downstream impact.

## Source-rule enforcement

Wallach allowlist (`core/source-rule.ts` exports `ALLOWLIST_MARKERS`):
- `dddl` — Dead Doctors Don't Lie
- `rbs` — Rare Earths: Forbidden Cures
- `eps` — Epigenetics: The Death of the Genetic Theory
- `ygy` — YGY Product Compendium (secondary; label data only)
- `wallach-lecture` — transcribed lecture corpus

Every numeric claim displayed by the system must cite a source whose string contains at least one of these markers. `core/source-rule.parseCitation()` throws on a citation that doesn't match; the dashboard refuses to render the offending claim.

Adding a marker requires a documented amendment (see legacy `source-rule.md`).

## The 4-year-portability promise

A user opening `dashboard.html` in a browser 4 years from now should see exactly what they see today. To honor that:

- **Zero runtime CDN deps.** Every font, every image, every style is local.
- **Zero unsupported web APIs.** Only ES2022 + standard DOM APIs.
- **The compiled `dist/main.js` is the runtime contract.** Even if Node, npm, esbuild, and TypeScript all evolve away, the committed JS keeps working.
- **Tesseract.js is the lone carve-out** (OCR). Dynamically imported only when a scan starts.
- **Hash anchors on canonical files.** `design-system.css`, Eden data files. If drift happens, the dashboard knows and surfaces the alert.

The build pipeline is a developer convenience, not a runtime requirement.
