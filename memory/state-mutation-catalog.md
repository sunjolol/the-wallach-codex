# State-mutation Catalog

_Created: 2026-06-19 Round 150. Maintained as the visible enumeration of every runtime UI state mutation in the dashboard — where a localStorage write must propagate to N consuming surfaces._

## Why this exists

Sibling artifact to `memory/paired-write-catalog.md`. Where the paired-write catalog covers FILE-system pairs across the codebase, this catalog covers RUNTIME state pairs in the dashboard: an `lsWrite` to a regimen LS key + every screen that reads from that key. The failure family the catalog addresses: a mutation on surface A leaves stale state on surface B (the Wishlist still says "Remove from regimen" after the Regimen tab removed the item; the slot card still shows "1 supplement" after the Scanner tab removed it).

Round 150 closes the loop via §31 (Cross-Surface State Sync). Four chokepoint save helpers each fire `window.triggerRegimenRerender(label)` after their `lsWrite`, which re-renders every subscribed surface AND dispatches a `regimen:mutated` DOM event for external subscribers. The `check_regimen_state_mutation_routing` invariant verifies every direct `lsWrite` to a regimen LS key occurs inside one of the chokepoints AND every chokepoint contains the trigger call.

## The chokepoint helpers

| Chokepoint helper | LS key written | IIFE | Mutation sites that route through it |
|---|---|---|---|
| `persistRegimen(r)` | `lcRegimen_v1` | Label Check | `addToRegimen` (Wishlist add), `removeFromRegimen` (Wishlist remove), `addItemToRegimen` (cross-IIFE) |
| `saveRgOverride(id, patch)` | `rgOverrides_v1` | Regimen tab | Adopt button, Unadopt button, Quick-edit save, Full-edit save |
| `saveRgManual(items)` | `rgManualItems_v1` | Regimen tab | Manual add (Add item by hand), manual remove |
| `saveRgRemoved(set)` | `rgRemoved_v1` | Regimen tab | rg-remove handler (per-item remove), Restore-defaults button |
| `saveRgUserGoals(goalsArray)` | `rgUserGoals_v1` | Regimen tab | Goal-picker pill toggle (Round 156 follow-up); future goal-input surfaces |

## Subscribed surfaces (re-renders fired by `triggerRegimenRerender`)

| Surface | Render function | IIFE | Reads from |
|---|---|---|---|
| Regimen Slots showcase | `renderRegimenSlots` | Save System | All 4 LS keys (via `computeSlotStats(bundle)`) |
| Regimen tab | `renderRegimen` (alias `renderRegimenTab`) | Regimen tab | All 4 LS keys + `getUnifiedRegimenItems()` |
| Wishlist (Scanner tab) | `renderWishlist` | Label Check | `lcRegimen_v1` (via `inRegimen()` per-item label check) |
| Goal Picker (Regimen tab top) | `renderGoalPicker` | Regimen tab | `rgUserGoals_v1` (live "selected" pill state) |
| Periodic Table (You tab — Your 90 Essentials) | `buildEssentialsGrid` | Periodic Table | All 4 regimen LS keys (via `getUnifiedRegimenItems()` per-essential coverage) |

Future surfaces register by exposing their render function on `window` AND adding a row here. New rows are added in the same patch as the surface itself per §1 closing-move-atomic + §31 chokepoint discipline.

## Pre-§31 mutation sites that needed routing through chokepoints

Round 150's ship audited and confirmed every mutation site now writes via a chokepoint helper:

- **`addToRegimen` (Label Check IIFE)** — calls `persistRegimen` ✓ (via `r.items.unshift(...) → persistRegimen(r)`)
- **`removeFromRegimen` (Label Check IIFE)** — calls `persistRegimen` ✓ (the Round 149 bug surface; now structurally correct)
- **`addItemToRegimen` (Save System IIFE)** — calls `lsWrite('lcRegimen_v1', ...)` directly — **flagged for follow-up patch**: should route through `persistRegimen` for consistency
- **Adopt / Unadopt button handlers** — call `saveRgOverride` ✓
- **`rg-remove` handler (Regimen tab)** — calls `saveRgRemoved` ✓ (the Round 149 cross-tab sync bug surface; now structurally correct)
- **Restore-defaults button** — calls `saveRgRemoved` ✓ (Round 149's broadened version)
- **Quick-edit / Full-edit save** — call `saveRgOverride` ✓
- **Manual add / remove** — call `saveRgManual` ✓

## When to add a row

Add a row to the **chokepoint helpers** table when introducing a new regimen-state LS key. The closing-move-atomic discipline requires:

1. Row added here in the same patch as the new LS key
2. New chokepoint helper that fires `window.triggerRegimenRerender(label)` after its `lsWrite`
3. `check_regimen_state_mutation_routing` invariant updated to include the new LS key in the allowlist
4. Documentation in `operating-protocols.md §31`

Add a row to the **subscribed surfaces** table when a new screen consumes regimen state:

1. Row added here naming the render function + LS keys read
2. Render function exposed via `window.<name>` (cross-IIFE pattern per Round 135's `_CROSS_IIFE_SYMBOLS` allowlist)
3. `triggerRegimenRerender` updated to call the new render function

## Related

- Operating doctrine: [`memory/operating-protocols.md`](operating-protocols.md) §31 (Cross-Surface State Sync discipline)
- Paired-write catalog (sibling artifact): [`memory/paired-write-catalog.md`](paired-write-catalog.md)
- Round 149 lesson root cause: [`memory/essence/lessons.md`](essence/lessons.md) — cross-boundary-contract-drift family
- Round 150 lesson: chokepoint-as-discipline-anchor
- Verified-patterns linkage: chokepoint-with-paired-invariant is a candidate pattern for [`memory/verified-patterns.md`](verified-patterns.md) after Round 151 if a second instance lands
