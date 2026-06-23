# Chokepoint discipline (§31)

_Read before touching anything under `state/`._

## Pattern
All mutations of a sensitive state surface flow through a small fixed set of named helpers. Each helper emits a typed event so subscribers cascade re-renders. Direct mutation paths are lint-blocked.

## Instance (regimen state)
Defined in `state/regimen.ts`; also exposed on `window.*` for the legacy bridge:

- `persistRegimen(slot, items)` — full slot write
- `saveRgOverride(key, value)` — per-item dose / scaling override
- `saveRgManual(items)` — manual / vault / scanned additions
- `saveRgRemoved(ids)` — removal tracking (hides items, including negative-id base foundation)
- `saveRgUserGoals(goals)` — goal state

Each emits `regimen:changed` (typed). Subscribers in `core/events.ts` cascade re-renders.

## Rules
1. The five helpers above are the **only** writers to regimen `localStorage` keys.
2. Direct `localStorage.setItem('wallachRegimen_*', …)` outside these helpers fails lint and the routing invariant.
3. Adding a new mutation? Add a new named chokepoint, not an ad-hoc write site.
4. Reads go through `core/storage.ts::getValidated` (Zod boundary); bare `localStorage.getItem` outside `core/storage.ts` is also banned.

## Enforcement
- Lint rule: `no-direct-localstorage-outside-core-storage`.
- Invariant: `regimen_state_mutation_routing` — verifies all five chokepoints fire `triggerRegimenRerender` and all regimen LS keys are registered in `LS_SCHEMAS`.
