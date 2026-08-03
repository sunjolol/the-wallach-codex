---
name: engineering-doctrine
description: Read when proposing a new system, tool, or architectural surface, or when deciding how systemically to fix a bug. Holds the ranked engineering principles behind section 00.B - what to optimize when two good practices conflict.
---

# Engineering doctrine (section 00.B)

Ranked. Higher wins ties. For any substantive change, name honor / stress / violate for each.

1. **No silent failures.** Every write verifies its result; errors are loud or logged.
2. **Defense in depth.** Two validation layers minimum on every data path, from *different*
   perspectives, so one mistake cannot slip both.
3. **Single source of truth.** No information lives in two places without an enforced sync.
4. **Atomic operations.** Writes succeed fully or fail fully. Multi-file updates all-land-or-roll-back.
5. **Escape by default.** Embedded content is untrusted text; `textContent` is the default.
6. **Verifiable invariants.** State the rule, write the check that proves it, run it every round-close.
7. **Graceful degradation.** One component failing does not take the rest down.
8. **Bounded inputs.** Explicit length limits, format validation, and a rejection path.
9. **Reversibility.** Destructive operations are reversible or need explicit confirmation.
10. **Self-documenting structure.** Layout reveals architecture; comments carry the truthful WHY, not
    WHAT-noise. A drifted comment is a defect worse than none.
11. **Truth-anchored invariants.** Every check pins to something that cannot itself drift -- committed
    hashes, deterministic recomputation, primary-source bytes. **Stale-to-stale equality is not
    truth.** When two surfaces share a write primitive, treat them as one surface and find an
    independent anchor.

## Where failure actually matters here
Data correctness (a wrong dose harms someone), data preservation (users accumulate months of regimen
state; schema changes must not break it), resilience to input abuse, and resilience to our own
mistakes. Be production-grade there and conservative elsewhere.

## Fixing bugs
Identify which principle was violated and fix it **systemically** -- a check, a tool, a discipline --
not just the one symptom. Patching one bug at a time is the failure mode this exists to escape.

Principles can be amended, but only with reasoning recorded in `chronicle/`, never by drift.
