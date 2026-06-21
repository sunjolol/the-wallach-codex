# Engineering Doctrine

The eleven principles that govern how this project is built, in priority order.
Every substantive change answers: which of these does this honor, stress, or violate?

Sibling to `operating-protocols.md` (process), `paired-write-catalog.md` (cross-file integrity), and `state-mutation-catalog.md` (runtime state integrity).

Adopted: [DATE] — bootstrapped from the Tacitus brain (parent-project Wallach v1.0).

---

## Scope

This project is built with production-grade rigor where failure has real consequences; conservative elsewhere. The places where failure matters:

- **Data correctness.** Wrong data displayed → wrong decisions → real harm.
- **Data preservation.** User accumulates state over time; schema changes can't break it.
- **Resilience to input abuse.** Accidental (info-dumps) and adversarial (scripts in input fields).
- **Resilience to developer mistakes.** Silent failures hit a finite number of times before structural cures are required. The integrity tools catch the developer automatically.

## The Eleven Principles

### 1. No silent failures
Every write verifies its result. Every check is loud or logged. Every error path runs to a known surface. When a tool reports success, the caller verifies on disk (see §11 below).

### 2. Defense in depth
Every data path has at least two validation layers. Write-time check (caller-side) AND read-time check (integrity tool / audit). Single-layer enforcement erodes; two layers don't.

### 3. Single source of truth
No information lives in two places without an enforced sync. When duplication is unavoidable (e.g., canonical file + dashboard embed), the sync is mechanical (a script) and audited by an invariant (see `paired-write-catalog.md`).

### 4. Atomic operations
Writes succeed fully or fail fully. Partial state is forbidden. For multi-file operations: stage to temp files, verify all, atomically swap. `tools/safe_write.py` (or equivalent in your stack) is the canonical primitive.

### 5. Escape by default
All embedded content is untrusted text. Use the safe-text API of your rendering layer (`textContent` in DOM, `escape()` in templating). The unsafe API (`innerHTML`, raw f-string into HTML) requires explicit audit per use.

### 6. Verifiable invariants
State the rule; write an automatic check that proves it. If you can't write the check, the rule isn't really a rule — it's a hope. Hopes drift; rules with paired checks don't.

### 7. Graceful degradation
One component fails, the rest keeps working. A render function throwing doesn't kill the cascade. A check throwing doesn't kill the audit. Catch + log + move on, unless the failure is structurally fatal (then loud-fail immediately, per §1).

### 8. Bounded inputs
Every user input has explicit length and format limits. Untrusted input is never trusted by length; that's a footgun. Bounded inputs make the rest of the system easier to reason about.

### 9. Reversibility
Destructive operations are reversible or require explicit confirmation. Soft-delete + recovery vault patterns over hard-delete where possible. When hard-delete is required, the confirmation step itself is structural (cannot be skipped with a single click).

### 10. Self-documenting structure
File layout reveals architecture. Naming reveals behavior. A new contributor reading the file tree should be able to guess what each file does. When you can't guess, the structure is wrong; refactor.

### 11. Truth-anchored invariants
When a check verifies `A == B`, it must also pin to an external truth anchor that can't drift with A or B. Two surfaces sharing the same cache can lie in lockstep. Anchors include: committed hashes, deterministic recomputation, primary-source files, user-confirmed snapshots, low-level OS reads.

---

## How to use this doctrine

Before every substantive change, ask: **which of these eleven does this honor, stress, or violate?**

- Honors → proceed.
- Stresses → proceed with explicit acknowledgment in the saga round entry.
- Violates → either re-design, or escalate to the user with an explicit "this violates §N" warning.

The doctrine is binding on YOU (Claude). The user can override per-instance with an explicit "yes, ship it anyway" — but the saga round entry must record the override.

---

## What this doctrine does NOT do

- It does not replace product judgment. "Should we build feature X?" is a product question; the doctrine governs HOW you build it once decided.
- It does not eliminate all bugs. It eliminates a known FAMILY of bugs (silent failures, cache-collision lies, partial-state corruptions, etc.). New bug families will emerge; the doctrine refines through saga rounds.
- It does not apply to throwaway prototypes. Mark prototypes explicitly; doctrine is for the persistent codebase.

---

## Audit cadence

The doctrine is audited two ways:

1. **Per-change.** Every saga round entry includes a `**Patterns consulted:**` marker (see `operating-protocols.md §27`) which implicitly references the doctrine.
2. **Periodic.** Quarterly or as-needed, the user can request a doctrine-audit: a Tacitus Cura session focused on "where are the eleven principles being stressed in current architecture?"

---

_Adopted [DATE]. Refinements through saga-logged rounds with closing-move-atomic discipline._
