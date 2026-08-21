#!/usr/bin/env python3
r"""Negative test for regimen_state_mutation_routing (single-chokepoint state discipline).

Proof artifact (§00.B "codify, don't promise"). This gate was once removed with a promise to
return "next phase", and for ten days the only enforcement of the chokepoint rule was an ESLint
rule at WARN level, which fails nothing -- while the operating contract went on stating the rule
flatly. A gate promised for later is a gate nobody re-checks, and a WARN is not enforcement.

THE SLOT MODEL RE-CODIFIED the gate: regimen state now lives in ONE atomic document
(rgSlots_v1) written by ONE private writer (writeSlotDoc via setValidated), which the public
chokepoints delegate to. The old 1-fn<->1-key<->direct-set() model did not fit. Two of the old
gate's clauses would have MISFIRED on the correct single-source design:
  - clause 3a `if key not in body` demanded each chokepoint NAME its key constant -- a
    delegating op does not;
  - the body slice ran to the next `\nexport function`, so a NON-exported `function
    writeSlotDoc` was SWALLOWED into whichever export textually preceded it -- a
    placement-dependent false match.

CASE 'swallow_guard' is the load-bearing pin: a gutted saveRgRemoved sitting IMMEDIATELY
before the private writeSlotDoc must still RED. The old text-slice would have found
`writeSlotDoc(` inside the swallowed definition line and FALSE-PASSED it. If this case ever
goes GREEN, the brace-aware body matching has regressed to text-slicing.

CASE 'prose_mentions_localStorage' pins an early bug in this very scan: r"\blocalStorage\s*\."
matched the FULL STOP in a comment reading "no localStorage. The corpus is canonical" and
RED-flagged five innocent files -- it read a denial as the offence. If it REDs again, the scan
is matching prose.

Run:  PYTHONUTF8=1 python tools/tests/test_regimen_state_mutation_routing.py
Exit 0 = every case behaves; non-zero = chokepoint routing stopped being enforced."""
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._regimen_state_mutation_routing_impl

# A minimal, self-contained regimen.ts mirroring the real delegating shape: one private writer
# and ALL FIVE legacy chokepoints delegating to writeSlotDoc (goals fold into the slot
# doc, so saveRgUserGoals delegates too; rgUserGoals_v1 is now a retired read-only key). Kept
# small so it cannot rot when the real file is refactored.
GOOD_REGIMEN = """
export const RG_SLOTS_KEY = 'rgSlots_v1';
export const RG_USER_GOALS_KEY = 'rgUserGoals_v1';
export const REGIMEN_KEY = 'lcRegimen_v1';
export const RG_OVERRIDES_KEY = 'rgOverrides_v1';
export const RG_MANUAL_KEY = 'rgManualItems_v1';
export const RG_REMOVED_KEY = 'rgRemoved_v1';

function writeSlotDoc(doc: SlotDoc, opts?: { emit?: boolean; reason?: string }): WriteResult {
  const res = setValidated(RG_SLOTS_KEY, doc, SlotDocSchema);
  if (opts?.emit !== false) {
    emit('regimen:changed', { slotId: RG_SLOTS_KEY, reason: opts?.reason ?? 'restore' });
  }
  return res;
}

function migrate(): SlotDoc {
  // The migration reads the retired keys once; it never writes them.
  const a = getValidated(REGIMEN_KEY, RegimenSchema);
  const b = getValidated(RG_OVERRIDES_KEY, OverridesMapSchema);
  const c = getValidated(RG_MANUAL_KEY, RgManualSchema);
  const d = getValidated(RG_REMOVED_KEY, RgRemovedSchema);
  return build(a, b, c, d);
}

export function persistRegimen(r: Regimen): void {
  writeSlotDoc(withActiveSlot(loadSlotDoc(), s => ({ ...s, items: r.items })), { reason: 'restore' });
}
export function saveRgOverride(id: number, patch: OverridePatch): void {
  writeSlotDoc(withActiveSlot(loadSlotDoc(), s => ({ ...s })), { reason: 'dose-edit' });
}
export function saveRgManual(items: RegimenItem[]): void {
  writeSlotDoc(withActiveSlot(loadSlotDoc(), s => ({ ...s, items })), { reason: 'add' });
}
export function saveRgRemoved(setOfIds: Set<number>): void {
  writeSlotDoc(loadSlotDoc(), { reason: 'remove' });
}
export function saveRgUserGoals(goalsArray: unknown): void {
  writeSlotDoc(withActiveSlot(loadSlotDoc(), s => ({ ...s, goals: cleaned })), { reason: 'add' });
}
export function addSlot(name?: string): SlotOpResult {
  writeSlotDoc({ ...loadSlotDoc() }, { reason: 'add' });
  return { ok: true };
}
"""
GOOD_STORAGE = "export function set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }"

CASES = []


def case(name, reg, sto, views, want_green, why):
    ok, msg = impl(reg, sto, views)
    good = (ok == want_green)
    print("%s %-30s expect=%-5s got=%-5s  %s"
          % ("ok  " if good else "FAIL", name, "GREEN" if want_green else "RED",
             "GREEN" if ok else "RED", msg[:56]))
    if not good:
        CASES.append((name, why, msg))


# --- the real tree must be green -------------------------------------------------------
ok, msg = inv.check_regimen_state_mutation_routing()
print("%s %-30s expect=GREEN got=%-5s  %s"
      % ("ok  " if ok else "FAIL", "real_tree", "GREEN" if ok else "RED", msg[:56]))
if not ok:
    CASES.append(("real_tree", "the gate must pass on the real tree or it is unusable", msg))
print()

case("baseline_good", GOOD_REGIMEN, GOOD_STORAGE, [], True,
     "the planted-good delegating shape must pass, or every RED below is meaningless")

# --- THE OVER-FIRE PIN -----------------------------------------------------------------
case("prose_mentions_localStorage", GOOD_REGIMEN, GOOD_STORAGE,
     [("state/corpus.ts", "/** Pure reads only -- no mutation, no localStorage. The corpus is canonical. */\n"
                          "export function readCorpus() { return EMBED; }")], True,
     "THE PROSE TRAP: r'\\blocalStorage\\s*\\.' matches the FULL STOP in this exact "
     "comment. If this REDs, the scan is matching prose again")

# --- THE SWALLOW GUARD (the load-bearing case) -----------------------------------------
SWALLOW = GOOD_REGIMEN.replace(
    "export function saveRgRemoved(setOfIds: Set<number>): void {\n"
    "  writeSlotDoc(loadSlotDoc(), { reason: 'remove' });\n"
    "}",
    # saveRgRemoved gutted to a no-op, placed (as in the real file) before writeSlotDoc's def
    # by moving a copy of the private writer to sit right after it:
    "export function saveRgRemoved(setOfIds: Set<number>): void {\n"
    "  const x = setOfIds; // forgot to persist -- no writeSlotDoc call\n"
    "}\n"
    "function writeSlotDocTwin(doc: SlotDoc): WriteResult {\n"
    "  return setValidatedTwin(doc);\n"
    "}")
case("swallow_guard", SWALLOW, GOOD_STORAGE, [], False,
     "THE SWALLOW PIN: a gutted saveRgRemoved sitting right before a private writer must RED. The "
     "OLD text-slice ran to the next `export function`, swallowing the private writer whose "
     "definition line contains `writeSlotDoc(` -> false GREEN. Brace-aware matching extracts "
     "only saveRgRemoved's true body (no writeSlotDoc call) -> RED. If GREEN, we regressed")

# --- real violations must RED ----------------------------------------------------------
case("chokepoint_not_delegating",
     GOOD_REGIMEN.replace(
         "export function saveRgManual(items: RegimenItem[]): void {\n"
         "  writeSlotDoc(withActiveSlot(loadSlotDoc(), s => ({ ...s, items })), { reason: 'add' });\n"
         "}",
         "export function saveRgManual(items: RegimenItem[]): void {\n"
         "  const nope = items; // does not route through the single writer\n"
         "}"),
     GOOD_STORAGE, [], False,
     "a chokepoint that does not call writeSlotDoc bypasses the single writer -- the mutation "
     "never persists + the cascade never fires")

case("second_writer_of_slot_doc",
     GOOD_REGIMEN + "\nexport function sneak(d: SlotDoc): void { setValidated(RG_SLOTS_KEY, d, SlotDocSchema); }",
     GOOD_STORAGE, [], False,
     "a second setValidated(RG_SLOTS_KEY) means the slot doc no longer has ONE writer")

case("writer_missing",
     GOOD_REGIMEN.replace("setValidated(RG_SLOTS_KEY, doc, SlotDocSchema)", "returnStub(doc)"),
     GOOD_STORAGE, [], False,
     "no setValidated(RG_SLOTS_KEY) at all -- the single-writer spine is gone")

case("writer_no_emit",
     GOOD_REGIMEN.replace(
         "  if (opts?.emit !== false) {\n"
         "    emit('regimen:changed', { slotId: RG_SLOTS_KEY, reason: opts?.reason ?? 'restore' });\n"
         "  }\n", ""),
     GOOD_STORAGE, [], False,
     "THE CASCADE POINT: a writer that does not emit leaves every subscriber stale -- the cascade "
     "IS the discipline")

case("raw_set_of_slot_doc",
     GOOD_REGIMEN.replace("setValidated(RG_SLOTS_KEY, doc, SlotDocSchema)", "set(RG_SLOTS_KEY, doc)"),
     GOOD_STORAGE, [], False,
     "the slot doc must go through setValidated (the Zod write boundary), not the unchecked set()")

case("retired_key_written",
     GOOD_REGIMEN.replace("return build(a, b, c, d);", "set(REGIMEN_KEY, a); return build(a, b, c, d);"),
     GOOD_STORAGE, [], False,
     "a write to a retired key means the migration is not one-way -- the legacy store is live again")

case("chokepoint_missing",
     GOOD_REGIMEN.replace("export function saveRgRemoved", "function saveRgRemoved"),
     GOOD_STORAGE, [], False,
     "a chokepoint that stops being exported breaks the views that import it (API preservation)")

case("goals_chokepoint_not_delegating",
     GOOD_REGIMEN.replace(
         "export function saveRgUserGoals(goalsArray: unknown): void {\n"
         "  writeSlotDoc(withActiveSlot(loadSlotDoc(), s => ({ ...s, goals: cleaned })), { reason: 'add' });\n"
         "}",
         "export function saveRgUserGoals(goalsArray: unknown): void {\n"
         "  const nope = goalsArray; // does not route through the single writer\n"
         "}"),
     GOOD_STORAGE, [], False,
     "goals moved per-slot into the slot doc, so saveRgUserGoals must now delegate to "
     "writeSlotDoc like every other chokepoint -- a non-delegating goals write never persists "
     "and never fires the cascade")

case("goals_key_now_retired",
     GOOD_REGIMEN.replace("return build(a, b, c, d);", "set(RG_USER_GOALS_KEY, x); return build(a, b, c, d);"),
     GOOD_STORAGE, [], False,
     "rgUserGoals_v1 is retired: a write to it means goals are no longer single-sourced in the "
     "slot doc -- the global store is live again")

case("view_writes_storage", GOOD_REGIMEN, GOOD_STORAGE,
     [("views/coverage.ts", "export function r() { localStorage.setItem('x', '1'); }")], False,
     "a view writing localStorage directly bypasses the chokepoint entirely")

case("view_reads_storage", GOOD_REGIMEN, GOOD_STORAGE,
     [("views/coverage.ts", "const v = localStorage.getItem('rgSlots_v1');")], False,
     "reads must route through core/storage.ts::getValidated (the Zod boundary)")

case("bracket_access", GOOD_REGIMEN, GOOD_STORAGE,
     [("state/x.ts", "const v = localStorage['rgSlots_v1'];")], False,
     "bracket access is the obvious way around a dot-only scan")

case("chokepoint_moved", GOOD_REGIMEN, "export function set(k, v) { /* moved */ }", [], False,
     "if core/storage.ts stops writing localStorage the chokepoint moved and this gate is "
     "pointing at the wrong file -- it must say so, not pass")

print()
if CASES:
    print("%d CASE(S) FAILED -- chokepoint routing is not enforced:" % len(CASES))
    for n, why, msg in CASES:
        print("  %s: %s" % (n, why))
        print("     got: %s" % msg[:150])
    sys.exit(1)
print("all cases behave -- the single writer is the only regimen mutation path, and it emits.")
sys.exit(0)
