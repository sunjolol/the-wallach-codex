# Decisions

Architectural commitments. Add only when a real choice was made that constrains future work.

Each decision entry uses the format:

```
**(YYYY-MM-DD at H:MM AM/PM)** **Round N — Short title.** Architectural commitment: [the choice, in action-language]. Going forward: [what this implies for future work]. **Constraint:** [what's now off-limits OR what's now required].
```

Decisions differ from lessons:
- **Lessons** are observations about how to operate (general wisdom from failure).
- **Decisions** are choices that bind future architecture (e.g., "we use localStorage for X, not IndexedDB").

When you make a decision, ALSO file a lesson if the decision was triggered by a failure mode worth naming.

---

## Initial decisions (inherited from Tacitus brain v1.0)

**Bootstrap decisions any project inherits when porting via Tacitus:**

- Production-grade rigor where failure has real consequences. Conservative elsewhere.
- localStorage (or equivalent client-side state) as the user-edit layer; canonical files as the source of truth. Render-time merge applies overrides; canonical writes are explicit user actions.
- Closing-move-atomic discipline as universal — every substantive round closes the saga + lessons + decisions + memory-change-log + integrity + invariants in the same patch.
- Living the Logos as universal — the round that codifies a discipline is the first round to apply it.
- Paired-write integrity (operating-protocols §30) for every cross-file dependency.
- Cross-Surface State Sync via chokepoints (operating-protocols §31) for every runtime state mutation.

---

_New decisions appended below. Newest at bottom._
