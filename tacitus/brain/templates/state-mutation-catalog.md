# State-mutation Catalog

_Created: [DATE] (bootstrap from Tacitus brain v1.0). Maintained as the visible enumeration of every runtime UI state mutation in this project — where a localStorage write (or equivalent runtime-state write) must propagate to N consuming surfaces._

## Why this exists

Sibling artifact to `paired-write-catalog.md`. Where the paired-write catalog covers FILE-system pairs across the codebase, this catalog covers RUNTIME state pairs: a write to a runtime key + every screen that reads from that key. The failure family the catalog addresses: a mutation on surface A leaves stale state on surface B until manual reload.

The §31 chokepoint discipline (operating-protocols §31) closes the loop: each row enumerates the chokepoint helper that owns the state, the consuming surfaces that re-render via the cascade, and the paired invariant that catches drift.

## The chokepoint helpers

| Chokepoint helper | State key written | Module/scope | Mutation sites routed through it |
|---|---|---|---|
| _Add your first chokepoint here_ | _e.g., `userPrefs_v1`_ | _e.g., main UI IIFE_ | _e.g., "settings save, defaults reset"_ |

## Subscribed surfaces (re-renders fired by the cascade)

| Surface | Render function | Module/scope | Reads from |
|---|---|---|---|
| _Add the first subscribed surface here_ | _e.g., `renderPreferencesPanel`_ | _e.g., Preferences module_ | _e.g., `userPrefs_v1`_ |

## When to add a row

Add a row to the **chokepoint helpers** table when introducing a new runtime-state key. The closing-move-atomic discipline requires, in the same patch:

1. Row added here.
2. New chokepoint helper that fires the cascade (re-renders + event dispatch + snapshot resync if applicable) after the write.
3. `check_<surface>_state_mutation_routing` invariant updated to include the new state key + chokepoint pair.
4. Documentation in `operating-protocols.md §31`.

Add a row to the **subscribed surfaces** table when a new screen consumes runtime state:

1. Row added here naming the render function + state keys read.
2. Render function exposed via module-boundary (cross-IIFE or cross-module pattern).
3. Cascade trigger updated to call the new render function.

## Related

- Operating doctrine: `memory/operating-protocols.md` §31 (Cross-Surface State Sync discipline)
- Sibling catalog: `memory/paired-write-catalog.md` (file-system pairs)
- Parent-project source: Tacitus brain v1.0 §9 (Chokepoint discipline)
