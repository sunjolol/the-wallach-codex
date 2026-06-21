# Paired-write Catalog

_Created: [DATE] (bootstrap from Tacitus brain v1.0). Maintained as the visible enumeration of every paired-write surface in this project — where a substantive action lands at TWO OR MORE artifacts that must stay in sync._

## Why this exists

Sibling artifact to `state-mutation-catalog.md` (runtime UI state). Where the state-mutation catalog covers runtime localStorage / cache pairs, this catalog covers FILE-system pairs across the codebase. The failure family the catalog addresses: a write to file A leaves file B silently out-of-sync until manual reload or until a developer notices weeks later.

The catalog is the visible answer to: *"do we have equivalent systems for ALL the logs, or are we still playing whack-a-mole?"*

## The canonical surfaces

| Surface pair | Trigger | Marker | Paired invariant | Status |
|---|---|---|---|---|
| _Add your project's first paired-write surface here_ | _e.g., "version bump"_ | _e.g., "open-threads masthead line"_ | _e.g., `check_brain_version_sync`_ | _✅ covered / ⚠️ partial / ❌ none yet_ |

_Recommended seeds for any project:_

| Surface pair | Trigger | Marker | Paired invariant | Status |
|---|---|---|---|---|
| `memory/essence/saga.md` round ↔ `memory/essence/lessons.md` | lesson observed during round | `**Lessons logged:**` (in Closing-move record) | `check_round_lessons_marker_truthful` | template — implement when essence files are in use |
| `memory/essence/saga.md` round ↔ `memory/essence/decisions.md` | architectural commitment | `**Decisions logged:**` (in Closing-move record) | `check_round_decisions_marker_truthful` | template |
| `memory/essence/saga.md` round ↔ `memory/memory-change-log.md` | memory file written | `**Memory writes logged:**` (in Closing-move record) | `check_round_memory_writes_marker_truthful` | template |
| `memory/essence/saga.md` round ↔ `memory/versions.json` history | round close with version bump | (round headers + history entries) | `check_saga_versions_history_match` | template |
| versions.json ↔ CHANGELOG.md ↔ versions/ ↔ dashboard embed | version bump | (no marker — `version_bump.py` enforces atomicity) | `check_<component>_version_sync` | template |

## Marker discipline (from operating-protocols §30)

Every substantive saga round close uses the unified `**Closing-move record:**` block:

```
**Closing-move record:**
- Implementations logged: <citations OR N/A>
- Lessons logged: <citations OR N/A>
- Decisions logged: <citations OR N/A>
- Memory writes logged: <citations OR N/A>
```

Each line maps to its paired invariant above.

## When to add a row

Add a row when introducing a new paired-write surface (a new structured log, a new derived artifact, a new cross-file relationship). The closing-move-atomic discipline requires, in the same patch:

1. Row added here.
2. Paired invariant filed in `tools/invariants.py` — OR explicit `(none yet — <reason>)` in the invariant column.
3. If the surface fires on round close: a marker added to the Closing-move record block.

If a row is missing its paired invariant, mark the invariant column `(none yet — <reason>)`. The catch-22 of declaring without enforcement IS the failure mode this catalog exists to make visible.

## Related

- Operating doctrine: `memory/operating-protocols.md` §30 (Closing-move record discipline)
- Sibling catalog: `memory/state-mutation-catalog.md` (runtime UI state)
