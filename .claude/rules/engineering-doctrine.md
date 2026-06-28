# Engineering doctrine (§00.B) — the principles behind the senior-dev standard

_Read when proposing a new system, tool, or architectural surface. The WHY behind CLAUDE.md §00.B; the behavioral HOW lives in the other `.claude/rules/` files._

## Pattern
A small, ranked set of irreducible principles. Every substantive change answers, for each: does this honor it, stress it, or violate it? Higher on the list wins ties.

## Scope
A personal health framework shipping as an offline app — production-grade where failure has real consequences, conservative elsewhere. Failure matters most at: **data correctness** (wrong dose → real harm), **data preservation** (users accumulate months of regimen data; schema changes must not break it), **resilience to input abuse** (accidental info-dumps + adversarial input), and **resilience to our own mistakes** (silent-corruption events are why the write primitive exists).

## The principles (priority order)
1. **No silent failures.** Every write verifies its result; every check is verifiable; errors are loud or logged.
2. **Defense in depth.** Minimum two validation layers on every data path (schema + parse + invariant, or type + bounds + invariant). Different perspective per layer so the same mistake can't slip both.
3. **Single source of truth.** No information lives in two places without an enforced sync. Eden is the canonical data home; views never hold a canonical value as a literal.
4. **Atomic operations.** Writes succeed fully or fail fully — temp-file → verify → swap. Multi-file updates all-land-or-all-roll-back. (This is the `safe_write` shape; see `write-discipline.md`.)
5. **Escape by default.** All embedded content is untrusted text unless explicitly marked code. `textContent` is the default; `innerHTML =` is reserved for author-vetted constants and gets explicit review.
6. **Verifiable invariants.** State the rules the system must always satisfy; write automatic checks that prove them; run them every round-close (`tools/invariants.py`).
7. **Graceful degradation.** When one component fails, the rest keeps working — optional features wrapped with safe fallbacks.
8. **Bounded inputs.** Every input field has explicit length limits, format validation, and a rejection path. Default cap 10,000 chars unless the field needs more.
9. **Reversibility.** Every destructive operation is reversible or requires explicit confirmation. Autonomous operations use check-then-act.
10. **Self-documenting + auditable structure.** File layout reveals architecture; naming reveals behavior; comments carry the truthful WHY/decision trail for future auditors (not WHAT-noise; a drifted or lying comment is a defect). User-facing educational prose stays in the segregated content store, never inline. Detail: `typescript.md`.
11. **Truth-anchored invariants.** Every check pins to an external truth source that can't itself drift (committed hashes, deterministic recomputation, primary-source files, low-level `os.read` bypassing the text cache). Stale-to-stale equality is not truth. When two surfaces share the same write primitive, treat them as one surface and find an independent anchor.

## How to use
- **Before a substantive change:** for each principle, name honor / stress / violate. Record stresses so the trade-off is visible; fix or justify violations.
- **Investigating a bug:** identify which principle was violated and fix it *systemically* (a check, a tool, a discipline), not just the one symptom — patching one bug at a time is the failure mode this doctrine exists to escape.
- **When in doubt:** the higher principle wins. Data correctness beats convenience; no-silent-failures beats brevity; single-source-of-truth beats local optimization.

## What this is not
Not a complete engineering checklist — the irreducible minimum for this project's scope. It does not replace judgment, and it does not freeze the design: principles can be amended, but only with explicit reasoning recorded in `chronicle/`, never by implicit drift.
