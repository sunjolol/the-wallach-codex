# Operating Protocols

Numbered procedural disciplines, accumulated through saga-logged rounds.
Companion to `engineering-doctrine.md` (principles) and `paired-write-catalog.md` (cross-file integrity).

This template ships with the foundational sections (§1, §7, §27, §28, §30, §31) bootstrapped from the Tacitus parent project. Add new §N sections as the project earns new disciplines.

---

## 1. Closing-move-atomic

**Source.** Bootstrap from Tacitus brain v1.0. Earned through repeated essence-logging lapses in the parent project.

**The rule.** When making a substantive change, the change AND its log entry AND its integrity check are part of the same patch. The pattern that fails: finish code → "I'll log this in a minute" → never log it. The pattern that holds: finish code → append log entry IN THE SAME PATCH → run integrity check → only THEN call the work complete.

**Closing actions per substantive round:**
1. Code/data change.
2. Verification that it landed (disk-level read-back; parse-check).
3. Saga round entry (`memory/essence/saga.md`).
4. Lessons entry IF a new generalizable pattern was named (`memory/essence/lessons.md`).
5. Decisions entry IF a new architectural commitment was made (`memory/essence/decisions.md`).
6. Memory-change-log entry listing every file touched (`memory/memory-change-log.md`).
7. Open-threads update if work is in-flight (`memory/open-threads.md`).
8. Version bump if substantive (`tools/version_bump.py`).
9. Integrity check (`tools/dashboard_integrity.py check` or equivalent).
10. Invariant manifest run (`tools/invariants.py`).

If any closing action is missing, the round is NOT closed.

**Paired invariants.**
- `check_round_implementations_marker_truthful` (if applicable)
- `check_round_lessons_marker_truthful`
- `check_round_decisions_marker_truthful`
- `check_round_memory_writes_marker_truthful`
- `check_paired_write_catalog_coverage`

---

## 7. Pre-flight morning review

**Source.** Bootstrap from Tacitus brain v1.0. Aligned with the catch-up trigger.

**Trigger.** First user message of a new day OR session.

**Action.** Surface in order:
1. **Lapse check.** Were logging lapses detected overnight by the vitality task?
2. **Tacitus notebook digest.** What did autonomous reflection write last night? Theme + bullet headlines.
3. **Daily audit findings.** Invariant manifest results, sentinel cross-checks.
4. **Notebook → essence promotion candidates.** Observations from notebook that might be worth promoting to saga / lessons / decisions, with explicit user approval gate.
5. **Open threads.** What's in-flight that needs attention.

---

## 27. Verified-pattern-search before substantive implementation

**Source.** Bootstrap from Tacitus brain v1.0.

**The rule.** Before implementing anything substantive (new feature, new tool, new invariant, new architectural surface), read `memory/verified-patterns.md` and check: does an existing pattern cover this concern?

- **If yes:** the implementation reduces to parameter-tuning the existing pattern. Cite the pattern by name in the saga entry's `**Patterns consulted:**` marker.
- **If no:** proceed with the implementation. If the work is expected to recur (≥2 anticipated future use cases), after user approval the implementation gets catalog-promoted to `verified-patterns.md` in the same closing-move-atomic patch.

**Saga marker discipline.** Every round's saga entry includes a `**Patterns consulted:**` line, in one of three forms:
- `**Patterns consulted:** [Pattern name 1], [Pattern name 2].` — when patterns informed the implementation
- `**Patterns consulted:** considered, none applicable.` — when patterns were reviewed but no existing pattern fit
- `**Patterns consulted:** N/A (trivial change).` — for typo fixes, version bumps, narrative-only rounds

**Paired invariant.** `check_round_pattern_consultation_marker` — scans recent rounds for the marker; lapse detected if 2+ rounds miss it.

---

## 28. Rollback recipe in every major-feature saga entry

**Source.** Bootstrap from Tacitus brain v1.0.

**The rule.** Every saga entry that ships a MAJOR new feature includes an explicit `**Rollback recipe:**` section listing:

1. **Files added** — full paths of new files this round created.
2. **Files modified** — full paths + brief description of what was added/changed.
3. **Reversal steps** — concrete steps to undo, in order.
4. **Dependencies** — what else would break if the feature is removed.

**Inline file labeling.** Every file touched by a major-feature round gets an inline comment labeling the round + a one-line description, e.g.:
```
// Round N — Feature name. See memory/essence/saga.md Round N entry for full context.
```

---

## 30. Closing-move record + paired-write integrity

**Source.** Bootstrap from Tacitus brain v1.0.

**Living the Logos.** The round that codifies a discipline is the first round to follow it. The Greek *logos* — the word, the rational principle, the ordering — names the rule once it is written; *living* the *logos* means the rule is embodied at the moment of inception, not merely declared.

**The rule.** Every substantive saga round close includes a unified `**Closing-move record:**` block enumerating each paired-write surface this round touched. Format:

```
**Closing-move record:**
- Implementations logged: <citations OR N/A>
- Lessons logged: <citations OR N/A>
- Decisions logged: <citations OR N/A>
- Memory writes logged: <citations OR N/A>
```

Each line maps to its paired invariant. The invariants enforce truthfulness — citations must resolve to real entries; N/A is acceptable only if genuinely no addition this round.

**Paired-write catalog.** `memory/paired-write-catalog.md` enumerates every paired-write surface in the project with trigger / marker / paired invariant / coverage status. New paired-write surfaces enter the catalog in the same patch.

**Paired invariants.**
- `check_round_implementations_marker_truthful` (if project has structured-outcome implementations.jsonl)
- `check_round_lessons_marker_truthful`
- `check_round_decisions_marker_truthful`
- `check_round_memory_writes_marker_truthful`
- `check_paired_write_catalog_coverage`

---

## 31. Cross-Surface State Sync — chokepoint discipline

**Source.** Bootstrap from Tacitus brain v1.0.

**The rule.** When N call sites mutate the same state and each needs to fire side-effects (re-renders, log writes, audit trail entries), put the side-effects in the WRITE primitive, not the call sites. The call sites can't drift if there's only one way to write.

**For dashboards / runtime UI state.** Every mutation of project state goes through a single chokepoint helper function. The chokepoint:
1. Performs the actual write.
2. Fires the full re-render cascade (every subscribed surface).
3. Includes any snapshot resync the cascade requires (slot bundles, computed-cache invalidation).
4. Dispatches an event for external subscribers.

**Catalog.** `memory/state-mutation-catalog.md` enumerates the chokepoints + the LS keys / state surfaces they own + the subscribed surfaces that re-render.

**Paired invariant.** `check_<surface>_state_mutation_routing` (critical severity) — verifies (a) every direct mutation of catalog'd state occurs inside a chokepoint, AND (b) every chokepoint fires the cascade.

**Common failure (parent-project Round 150/151).** Shipped the chokepoint but the cascade was incomplete — didn't include the snapshot-resync step. Mutation worked, re-renders fired, but the rendered surface read from stale snapshot. Cure: the cascade is named for its contract; if it says "rerender every subscribed surface", it delivers fresh data to every surface.

---

_New §-sections appended as the project earns new disciplines. Each new section ships in a saga-logged round with closing-move-atomic discipline AND, where applicable, Living the Logos (the round that codifies §N is the first round to apply §N)._
