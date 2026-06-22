# Domain glossary — The Wallach Codex

One- or two-sentence definitions for the terms a fresh session meets constantly.
Fast orientation, not exhaustive documentation. See `CLAUDE.md` for the full
operating contract and `sunjo/02-clarifications-and-plan.md` for the build plan.

## Module layers (import direction: `views → state → core`, never the reverse)

- **`core/`** — Primitives: the `localStorage` chokepoint, Zod schemas, the event
  bus, the Eden loader. Imports only `zod`, nothing of ours.
- **`state/`** — Reactive state + the §31 chokepoint mutations. May import
  `core/`; may not import `views/`.
- **`views/`** — Render functions + DOM event handlers. May read `state/` and
  `core/`; may **not** write `localStorage` directly.
- **`main.ts`** — The entry point. Wires every layer once at boot (`navigateTo`,
  drawer toggles, the `window.*` bridge).

## The six surfaces (+ Profile)

- **Coverage (⌘1)** — Periodic-table grid of the 92 essentials; each tile's status
  is computed live from the effective regimen. **Migrated, live.**
- **Regimen (⌘2)** — The user's supplement stack with full CRUD (add / edit-dose /
  remove), all through §31 chokepoints. **Migrated, live.**
- **Scanner (⌘3)** — Drop/paste/upload a label → OCR → parse → verdict →
  adopt-to-regimen. **Migrated, live.**
- **Knowledge drawer (K)** — Wallach corpus excerpts + product facts. **Not yet
  migrated off legacy.**
- **Journey drawer (J)** — User progression / milestone timeline. **Not yet
  migrated off legacy.**
- **Command palette (⌘K)** — Universal navigation across surfaces.
- **Profile panel** — Click "Luneth" in the header → Creator's Log + invariant
  scoreboard + build status. Mounts; content to be extended.

## Systems (the app is "The Wallach Codex"; the internal systems keep their names)

- **Eden** — The sealed canonical source corpus. Every Wallach/Youngevity number
  and claim originates here, hash-anchored and user-only-writable once sealed.
  Loaded via `core/eden.ts`.
- **Cura** — The health/care content layer (Wallach corpus → user-facing logic).
- **Aegis** — Defense-in-depth: validation, atomic writes, escape-by-default.
- **Chronicle** — The discipline ledger (`chronicle/`): build-log, contradictions,
  CHANGELOG, versions, this glossary. Replaced the retired `brain/`.
- **Tacitus** — The historical audit/integrity layer. Now a standalone repo
  (`the-tacitus-system`); scheduled for excision from this repo in Phase 1.

## §31 chokepoints (the only writers to regimen `localStorage`)

Defined in `state/regimen.ts`; each emits a typed `regimen:changed` event:

- **`persistRegimen(slot, items)`** — full slot write.
- **`saveRgOverride(key, value)`** — per-item dose / scaling override.
- **`saveRgManual(items)`** — manual / vault / scanned additions.
- **`saveRgRemoved(ids)`** — removal tracking (hides items, incl. the negative-id
  base foundation).
- **`saveRgUserGoals(goals)`** — goal state.

## Key types (all real in `src/`)

- **`CoverageSnapshot`** — The computed per-tile coverage state for all 92
  essentials, derived once from the effective regimen (`state/coverage.ts`). Feeds
  both the hero count and the section counts — one source of truth.
- **`RegimenItem`** — One stack entry: `{ id, label:{ name, dose_text?, nutrients },
  addedDate, provenance }`. `provenance` distinguishes `wallach_hbsp_default` /
  `user_manual` / `user_scanned`.
- **`ScanLabel`** — A parsed supplement label (name, nutrients, container hint)
  produced by the OCR/parse pipeline in `state/ocr.ts`.
- **`ScanResult`** — A scored label: the `ScanLabel` plus verdict (ADD / SAVE /
  REJECT), gap-fills, matched goals, and anti-flags (`state/scanner.ts`).
- **`EdenManifest`** — The hash-anchor manifest proving the sealed Eden corpus is
  intact (`core/eden.ts`).
- **The `window.lc*` bridge** — `window.lcScan` / `lcScanImage` / `lcParseLabel` /
  `lcLastResult`: the IIFE-to-`window` exports that let DOM handlers and headless
  probes reach the migrated engine. (The plan's "LcScan / LcVerdict" map to these
  plus `ScanResult`; there is no `WallachStance` type — the verdict ladder lives in
  `state/scanner.ts::decideVerdict`.)

## Discipline terms

- **§00.A** — Wallach source-of-truth mandate (100/100): every numeric / health
  claim cites a Wallach allowlist primary (`dddl · rbs · eps · ygy ·
  wallach-lecture`).
- **§00.B** — Senior-dev coding standard (99/100): no inline canonical data in
  views, no `any`, layer boundaries held. Now invariant-enforced
  (`views_state_no_inline_data`), not lint-only.
- **§17** — Corruption discipline: all project-file writes route through
  `tools/safe_write.py` (atomic write + readback verify). Direct Edit/Write is
  hook-blocked. Born from six silent-corruption incidents in one day.
- **§31** — Chokepoint discipline: the five helpers above are the only writers to
  regimen state.
- **Round / Chunk** — A closed unit of work that ends with the round-close ritual.
- **Round-close ritual** — A chunk is not "done" until: (1) build exits 0,
  (2) `vitest run state/**` exits 0, (3) invariants ≥ baseline, (4) a
  `chronicle/build-log.md` line is appended, (5) a Creator's Log event fires.
  (Step 5 is currently CLI-unfireable pending the file-mirror — see `next-chunk.md`.)
- **Anti-fakery** — The prime behavioural rule: if a render needs data that does
  not exist yet, add it to Eden / `assets/data/` behind a schema — never fake it in
  the view. The 91-hardcoded-tile incident is why this rule exists.
