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
- **Invariant (WISH — re-gated in Phase C):** `regimen_state_mutation_routing` (which verified all five chokepoints fire the re-render event and every regimen LS key is registered in `LS_SCHEMAS`) is **not in the current invariant set** — it is slated to return in Phase C (blueprint §5.3). Until then, §31 routing rests on lint + review discipline, labeled WISH, not sold as a guarantee (R7).
