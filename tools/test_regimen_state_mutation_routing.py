#!/usr/bin/env python3
"""Negative test for regimen_state_mutation_routing (§31 chokepoint discipline).

Proof artifact (§00.B "codify, don't promise" / R7). This gate was REMOVED 2026-07-05
(fca48c9d) "to return in Phase C". Phase C landed the SAME DAY; Phase F finished; nobody
noticed for ten days. Meanwhile CLAUDE.md stated flatly that user state persists "through
the §31 chokepoint only" -- unqualified, in the file loaded at every session boot -- while
the only actual enforcement was an ESLint rule at WARN, which fails nothing. A gate
promised "next phase" is a gate nobody re-checks: the phase passes and the promise stays.

CASE 'prose_mentions_localStorage' is the load-bearing one, and it pins MY OWN bug. The
first cut of the scan used r"\\blocalStorage\\s*\\." and RED-flagged FIVE INNOCENT FILES by
matching the FULL STOP in a comment:

    "Pure reads only -- no mutation, no localStorage. The corpus is canonical"

Three of those comments were promising exactly the opposite of the violation they were
accused of. If that case ever REDs again, the scan has gone back to matching prose -- and
an over-firing gate teaches people to switch gates off, which is worse than the hole.

Run:  PYTHONUTF8=1 python tools/test_regimen_state_mutation_routing.py

Exit 0 = every case behaves; non-zero = §31 routing stopped being enforced."""
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._regimen_state_mutation_routing_impl

# A minimal, self-contained regimen.ts mirroring the real chokepoint shape, so the test
# cannot rot when the real file is refactored.
GOOD_REGIMEN = """
export const REGIMEN_KEY = 'lcRegimen_v1';
export const RG_OVERRIDES_KEY = 'rgOverrides_v1';
export const RG_MANUAL_KEY = 'rgManualItems_v1';
export const RG_REMOVED_KEY = 'rgRemoved_v1';
export const RG_USER_GOALS_KEY = 'rgUserGoals_v1';

export function persistRegimen(r: Regimen): void {
  set(REGIMEN_KEY, r);
  emit('regimen:changed', { slotId: REGIMEN_KEY, reason: 'restore' });
}
export function saveRgOverride(id: number, patch: OverridePatch): void {
  set(RG_OVERRIDES_KEY, all);
  emit('regimen:changed', { slotId: RG_OVERRIDES_KEY, reason: 'dose-edit' });
}
export function saveRgManual(items: RegimenItem[]): void {
  set(RG_MANUAL_KEY, items);
  emit('regimen:changed', { slotId: RG_MANUAL_KEY, reason: 'add' });
}
export function saveRgRemoved(setOfIds: Set<number>): void {
  set(RG_REMOVED_KEY, [...setOfIds]);
  emit('regimen:changed', { slotId: RG_REMOVED_KEY, reason: 'remove' });
}
export function saveRgUserGoals(goalsArray: unknown): void {
  set(RG_USER_GOALS_KEY, cleaned);
  emit('regimen:changed', { slotId: RG_USER_GOALS_KEY, reason: 'add' });
}
"""
GOOD_STORAGE = "export function set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }"

CASES = []


def case(name, reg, sto, views, want_green, why):
    ok, msg = impl(reg, sto, views)
    good = (ok == want_green)
    print("%s %-28s expect=%-5s got=%-5s  %s"
          % ("ok  " if good else "FAIL", name, "GREEN" if want_green else "RED",
             "GREEN" if ok else "RED", msg[:60]))
    if not good:
        CASES.append((name, why, msg))


# --- the real tree must be green -------------------------------------------------------
ok, msg = inv.check_regimen_state_mutation_routing()
print("%s %-28s expect=GREEN got=%-5s  %s"
      % ("ok  " if ok else "FAIL", "real_tree", "GREEN" if ok else "RED", msg[:60]))
if not ok:
    CASES.append(("real_tree", "the gate must pass on the real tree or it is unusable", msg))
print()

case("baseline_good", GOOD_REGIMEN, GOOD_STORAGE, [], True,
     "the planted-good shape must pass, or every RED below is meaningless")

# --- THE OVER-FIRE PIN -----------------------------------------------------------------
case("prose_mentions_localStorage", GOOD_REGIMEN, GOOD_STORAGE,
     [("state/corpus.ts", "/** Pure reads only — no mutation, no localStorage. The corpus is canonical. */\n"
                          "export function readCorpus() { return EMBED; }")], True,
     "MY OWN BUG (2026-07-15): r'\\blocalStorage\\s*\\.' matched the FULL STOP in this exact "
     "comment and RED-flagged 5 innocent files, three of which were promising the opposite "
     "of the violation. If this REDs, the scan is matching prose again")

# --- real violations must RED ----------------------------------------------------------
case("view_writes_storage", GOOD_REGIMEN, GOOD_STORAGE,
     [("views/coverage.ts", "export function r() { localStorage.setItem('x', '1'); }")], False,
     "a view writing localStorage directly bypasses §31 entirely — the doctrine's whole claim")

case("view_reads_storage", GOOD_REGIMEN, GOOD_STORAGE,
     [("views/coverage.ts", "const v = localStorage.getItem('lcRegimen_v1');")], False,
     "reads must route through core/storage.ts::getValidated (the Zod boundary) — a raw read "
     "is an untyped value crossing into typed-land")

case("bracket_access", GOOD_REGIMEN, GOOD_STORAGE,
     [("state/x.ts", "const v = localStorage['lcRegimen_v1'];")], False,
     "bracket access is the obvious way around a dot-only scan")

case("chokepoint_missing", GOOD_REGIMEN.replace("export function saveRgRemoved", "function saveRgRemoved"),
     GOOD_STORAGE, [], False,
     "a chokepoint that stops being exported is no longer the named writer")

case("silent_write_no_emit", GOOD_REGIMEN.replace(
        "  set(RG_MANUAL_KEY, items);\n  emit('regimen:changed', { slotId: RG_MANUAL_KEY, reason: 'add' });",
        "  set(RG_MANUAL_KEY, items);"),
     GOOD_STORAGE, [], False,
     "THE §31 POINT: a write that does not emit leaves every subscriber stale. The cascade "
     "IS the discipline — a silent writer is the bug the doctrine exists to prevent")

case("second_writer_for_key", GOOD_REGIMEN + "\nexport function sneak() { set(RG_MANUAL_KEY, x); }",
     GOOD_STORAGE, [], False,
     "a second writer for a slot means the slot no longer has ONE chokepoint")

case("chokepoint_moved", GOOD_REGIMEN, "export function set(k, v) { /* moved */ }", [], False,
     "if core/storage.ts stops writing localStorage the chokepoint moved and this gate is "
     "pointing at the wrong file — it must say so, not pass")

print()
if CASES:
    print("%d CASE(S) FAILED — §31 routing is not enforced:" % len(CASES))
    for n, why, msg in CASES:
        print("  %s: %s" % (n, why))
        print("     got: %s" % msg[:130])
    sys.exit(1)
print("all cases behave — the five chokepoints are the only regimen writers, each emits.")
sys.exit(0)
