# Paired-write Catalog

_Created: 2026-06-19 Round 148. Maintained as the visible enumeration of every paired-write surface in this project — where a substantive action lands at TWO OR MORE artifacts that must stay in sync._

## Why this exists

The Round 120 lesson (lessons.md:572) named the failure family: when a discipline rule fires on agent intent rather than externally-observable artifacts, the discipline drifts silently. The Round 120 cure (§24 trigger-phrase recognition + dual-surface logging) shipped without a paired structural detector — the candidate invariant task-log↔implementations-log pairing was filed as Deferred (never registered with a `check_*` name because the dependency it needed — task-list on-disk export — never materialized) — and the discipline lapsed within 24 hours.

Round 148 closes the loop project-wide: every paired-write surface gets enumerated here with its truth anchors + saga marker + paired invariant. When a future round introduces a NEW paired-write surface, the closing-move discipline (§30) requires adding the row to this catalog in the same patch. The `check_paired_write_catalog_coverage` invariant verifies every cited `check_*` here resolves to a real registered invariant.

The catalog is the visible answer to: *"do we have equivalent systems for ALL the logs, or are we still playing whack-a-mole?"*

## The canonical surfaces

| Surface pair | Trigger | Marker | Paired invariant | Status |
|---|---|---|---|---|
| `memory/versions.json` ↔ `brain/CHANGELOG.md` ↔ `brain/versions/` ↔ dashboard embed | brain version bump | (no marker — `version_bump.py` enforces atomicity) | `check_brain_version_sync` | ✅ covered |
| `memory/essence/saga.md` ↔ `memory/versions.json` history | round close | (round headers + history entries) | `check_saga_versions_history_match` | ✅ covered |
| canonical `knowledge/wallach-stance.json` ↔ `dashboard/dashboard.html` embed | wallach_stance data ship | (no marker — build script enforces) | `check_wallach_stance_embed_sync` | ✅ covered |
| `memory/user-prefs/index.md` ↔ `memory/user-prefs/*.md` | new file added | (index table) | `check_user_prefs_match_index` | ✅ covered |
| `memory/essence/saga.md` round marker `**Patterns consulted:**` ↔ `memory/verified-patterns.md` | round close | `**Patterns consulted:**` | `check_round_markers_truthful (umbrella)` | ✅ covered (Round 140) |
| **`tacitus/notebook/YYYY-MM.md` survivor ↔ `memory/system/implementations.jsonl`** | user approval of survivor | `**Implementations logged:**` | `check_round_markers_truthful (umbrella)` + `check_survivor_implementation_logged` | ✅ covered (Round 148) |
| **`memory/essence/saga.md` round ↔ `memory/essence/lessons.md`** | lesson observed during round | `**Lessons logged:**` | `check_round_markers_truthful (umbrella)` | ✅ covered (Round 148) |
| **`memory/essence/saga.md` round ↔ `memory/essence/decisions.md`** | architectural commitment | `**Decisions logged:**` | `check_round_markers_truthful (umbrella)` | ✅ covered (Round 148) |
| **`memory/essence/saga.md` round ↔ `memory/memory-change-log.md`** | memory file written | `**Memory writes logged:**` | `check_round_markers_truthful (umbrella)` | ✅ covered (Round 148) |
| `memory/essence/saga.md` round ↔ `memory/design-knowledge.md` | design lesson observed | (no marker yet) | `(none yet — structurally hard to detect)` | ⚠️ partial — relies on §1 discipline + `check_lesson_freshness_vs_saga` |
| `memory/essence/saga.md` round-touch clusters ↔ §32 doctrine | bug-fix cycle | (in-conversation §32 self-check + brain prompt directive #6) | `check_whack_a_mole_clusters` | ✅ covered (Round 159) — ADVISORY-tier; surfaces clusters from last 14 rounds for next catch-up to mention |

## Marker discipline (Round 148)

Every substantive saga round close uses the unified `**Closing-move record:**` block, enumerating each paired-write surface this round touched. Format:

```
**Closing-move record:**
- Implementations logged: <citations OR N/A>
- Lessons logged: <citations OR N/A>
- Decisions logged: <citations OR N/A>
- Memory writes logged: <citations OR N/A>
```

Each line maps to its paired invariant above. The invariants enforce truthfulness — citations must resolve to real entries; N/A is acceptable only if genuinely no addition this round.

The `**Patterns consulted:**` marker (Round 140 / §27) is structurally identical — declared discipline + paired invariant. Round 148 generalizes the pattern.

## When to add a row

Add a row to this catalog when introducing a new paired-write surface (e.g., a new structured log, a new derived artifact). The closing-move-atomic discipline requires:

1. Row added here in the same patch as the new surface
2. Paired invariant filed in `tools/invariants.py`
3. If applicable, a marker added to the Round 148 closing-move discipline

If a row is missing its paired invariant, mark the invariant column `(none yet — <reason>)` rather than leaving it blank. The catch-22 of declaring without enforcement IS the failure mode this catalog exists to make visible.

## Related

- Operating doctrine: [`memory/operating-protocols.md`](operating-protocols.md) §30 (Closing-move record discipline)
- Round 120 lesson root cause: [`memory/essence/lessons.md`](essence/lessons.md) lines 572–574
- Round 148 lesson: catalog generalization of paired-write integrity
- Verified-patterns linkage: paired-write integrity is itself a verified pattern; see [`memory/verified-patterns.md`](verified-patterns.md) "Append-only structured log + resolution invariant"
