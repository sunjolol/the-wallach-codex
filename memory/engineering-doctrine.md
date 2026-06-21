# Engineering Doctrine

The ten principles that govern how this system is built, in priority order.
Every Pass / Round answers: which of these does this honor, stress, or violate?
Sibling to `operating-protocols.md` (which codifies process), `source-rule.md` (which
codifies the immutable truth-source boundary), and `decisions.md` (which logs
architectural commitments).

Adopted: 2026-06-14, Round 46. The trigger: the user named the recurring failure
pattern — individually patched bugs accumulating into a house of cards — and
committed the project to production-grade rigor from the foundation up.

---

## Scope

This is a personal health framework that will ship as an app. Not enterprise SaaS,
not throwaway prototype. The engineering bar is right-sized: production-grade where
failure has real consequences, conservative elsewhere. The places where failure
matters here:

- **Data correctness.** Wrong dose displayed → user over-supplements → real harm.
- **Data preservation.** Users will have months of accumulated regimen data when
  we ship — schema changes can't break it.
- **Resilience to input abuse.** Accidental (info-dumps) and adversarial (scripts
  in input fields).
- **Resilience to my own mistakes.** Silent-truncation events hit 7+ times in
  two sessions before the integrity tool landed. The system must catch the
  developer automatically.

---

## The Ten Principles

### 1. No silent failures
Every write verifies its result. Every check is verifiable. Errors are loud or
logged. The integrity tool exists because we hit this principle's violation
seven times before codifying it.

### 2. Defense in depth
Minimum two validation layers on every data path: schema + parse + integrity, or
type + bounds + invariant, etc. Single-layer guards have a failure mode of "one
missed case = full breach." Two layers + a different perspective per layer = the
classes of mistakes don't align.

### 3. Single source of truth
No information lives in two places without an enforced sync mechanism.
`memory/versions.json` is the canonical source for versions; the dashboard reads
it on load. Same pattern will apply to schemas, configs, and any other data that
historically drifted across surfaces.

### 4. Atomic operations
Writes succeed fully or fail fully — never half-write. Write to a temp file,
verify, then swap. Multi-file updates either all land or all roll back. The
silent-truncation pattern was a violation of this: writes that appeared to
succeed but actually dropped content mid-stream.

### 5. Escape by default
All embedded content is treated as untrusted text unless explicitly marked as
code. `textContent` is the default for any dynamic content insertion. `innerHTML`
is reserved for author-vetted HTML constants only. Every use of `innerHTML =`
in JS gets explicit doctrine review.

### 6. Verifiable invariants
State the rules the system must always satisfy. Write automatic checks that
prove them. Run the checks as part of every commit-equivalent (here: every
closing-move-atomic cycle via the integrity tool). Examples of invariants we
currently verify: dashboard ends with `</html>`, all script blocks parse,
markdown blocks match canonical sources by size, JS blocks parse via `node --check`,
no parser-breaking `</script>` literals inside script content, all essentials
targets cite an allowed source.

### 7. Graceful degradation
When one component fails, the rest keeps working. Optional features wrapped in
try/catch with empty fallbacks. The version-reader in the Creator's Log handler
is the model: if versions.json is missing or malformed, the reader silently
no-ops and the rest of the page still works.

### 8. Bounded inputs
Every user input field has explicit length limits, format validation, and
rejection paths. No unbounded free-text. Default cap: 10,000 characters per
field unless the field's purpose specifically requires more. This handles both
accidental info-dumps and the adversarial case.

### 9. Reversibility
Every destructive operation is reversible or requires explicit confirmation.
Backups, version history, restore commands. The user creates backup files
manually; the system makes the versions clear so backups self-document. For
operations the system performs autonomously (restore, embed), the integrity
tool's check-then-restore pattern enforces this.

### 10. Self-documenting structure
File layout reveals architecture. Naming reveals behavior. Comments explain WHY,
not WHAT. The `memory/` tree is the architecture diagram:
- `memory/versions.json` = canonical versions
- `memory/source-rule.md` = the immutable truth-source rule
- `memory/source-rule-audit.md` = log of every time the rule was approached
- `memory/engineering-doctrine.md` = this file
- `memory/operating-protocols.md` = process rules
- `memory/essence/saga.md` = narrative history
- `memory/essence/lessons.md` = methodology insights
- `memory/essence/decisions.md` = architectural commitments
- `memory/tacitus/` = Tacitus' autonomous reflection space (renamed from `memory/notebook/` in Round 74)
- `memory/system/` = System audit's space (audit reports + sentinels + known-good-hashes)

### 11. Truth-anchored invariants
Every check must pin to an external truth source that can't itself drift.
Stale-to-stale equality is not truth. Adopted Round 74 (2026-06-15) after
the truncation audit discovery: the integrity tool was passing while
canonical files and dashboard embeds were equally stale, because the check
verified agreement between two surfaces that shared the same cache.

The discipline:
- When a check verifies A == B, identify the truth anchor — what external,
  independent source pins A or B to ground truth? Examples of valid anchors:
  committed hashes (versions.json history), deterministic recomputation,
  primary-source files (Wallach books, Youngevity labels), user-confirmed
  snapshots (known-good-hashes.json), low-level system reads (os.read
  bypassing Python text cache).
- When introducing a new sentinel/status file, introduce the cross-check
  against its artifact in the same patch. A sentinel without an artifact
  cross-check is a structural liability.
- When two surfaces are both maintained by the same write primitive,
  treat them as one surface for purposes of the truth anchor. Find an
  independent anchor.

Currently enforced via `tools/invariants.py` (the manifest) +
`tools/system_audit.py` (the runner). See operating-protocols.md §18 for
the lesson→invariant promotion rule that keeps the manifest growing with
the project.

---

## How to use this doctrine

**Before every Pass / Round:** read the proposed change. Ask, for each
principle, "does this honor it, stress it, or violate it?" Where a principle is
violated, name the violation explicitly and explain the rationale (or fix the
proposal). Where a principle is stressed but not violated, note the tension so
future reviewers see the trade-off recorded.

**When proposing a new system, tool, or file:** answer the same question. New
infrastructure should advance the doctrine, not erode it.

**When investigating a bug or failure:** identify which principles were
violated. Fix the violation systemically (a check, a tool, a discipline), not
just the specific bug. Patching one bug at a time is the failure mode we are
trying to escape.

**When in doubt:** the principle higher on this list wins. Data correctness
beats convenience. No-silent-failures beats brevity. Single source of truth
beats local optimization.

---

## What this doctrine does NOT do

- It is not a complete checklist of every engineering concern. It is the
  irreducible minimum for our project's scope.
- It does not replace judgment. It tells you what to check; you still have to
  think about the case in front of you.
- It does not freeze the design. Principles can be amended — but amendments
  require explicit reasoning logged in `decisions.md`, not implicit drift.

---

## Audit

This doctrine is audited each major release (version bump in the major position
or annual cycle, whichever comes first). The audit asks:
- Have we honored each principle this cycle?
- Are there new failure modes the doctrine should anticipate?
- Are any principles obsolete or in tension with newer commitments?

The audit's findings are logged in `decisions.md` with the date and the round
number.
