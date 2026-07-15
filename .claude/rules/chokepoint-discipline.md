# Chokepoint discipline (§31)

_Read before touching anything under `state/`._

## Pattern
All mutations of a sensitive state surface flow through a small fixed set of named helpers. Each helper emits a typed event so subscribers cascade re-renders. Direct mutation paths are lint-blocked.

## Instance (regimen state)
Defined in `state/regimen.ts`; also exposed on `window.*` (the bridge — reached by DOM handlers + headless probes):

- `persistRegimen(slot, items)` — full slot write
- `saveRgOverride(key, value)` — per-item dose / scaling override
- `saveRgManual(items)` — manual / vault / scanned additions
- `saveRgRemoved(ids)` — removal tracking (hides items, including negative-id base foundation)
- `saveRgUserGoals(goals)` — goal state

Each emits `regimen:changed` (typed). Subscribers in `core/events.ts` cascade re-renders.

## Rules
1. The five helpers above are the **only** writers to regimen `localStorage` keys.
2. Direct `localStorage.setItem('wallachRegimen_*', …)` outside these helpers fails lint (and, once re-gated in Phase C, the routing invariant).
3. Adding a new mutation? Add a new named chokepoint, not an ad-hoc write site.
4. Reads go through `core/storage.ts::getValidated` (Zod boundary); bare `localStorage.getItem` outside `core/storage.ts` is also banned.

## Enforcement
- **Lint (live):** `no-restricted-globals` on `localStorage` (ESLint, `dashboard/eslint.config.js`) flags any direct `localStorage` access outside `core/storage.ts` — the one file that turns the rule off for itself. Currently a WARN.
- **Invariant (LIVE — restored 2026-07-15):** `regimen_state_mutation_routing` (critical) verifies that all five chokepoints exist, that each EMITS the typed `regimen:changed` cascade, that each owns exactly one LS key (no second writer), and that `localStorage` is touched only in `core/storage.ts` — never by a view. Negative test: `tools/test_regimen_state_mutation_routing.py`.
  - **It does NOT restore the old `LS_SCHEMAS` check.** That registry died with the legacy dashboard; re-asserting it would gate a structure that no longer exists. The gate checks the contract that is true today, and says so.
  - **The 10-day gap, recorded so it is not repeated:** this gate was removed 2026-07-05 (`fca48c9d`) and slated to "return in Phase C". Phase C landed the SAME DAY; Phase F finished; it never came back. This rule file was honest about the gap (labeled WISH per R7) — but `CLAUDE.md` went on asserting §31 flatly and unqualified, so the operating contract oversold what the rule file admitted. **A gate promised "next phase" is a gate nobody re-checks:** the phase passes and the promise stays.
