#!/usr/bin/env python3
r"""Negative test for slot_invariants (P3 slot-system structural guards).

Proof artifact (§00.B "codify, don't promise" / R7). slot_invariants is the STATIC half of the
§3 slot invariants: it proves the enforcing CODE EXISTS (SlotDocSchema's .min(1)/.max(4)/
.max(20)/superRefine; writeSlotDoc's setValidated boundary; addSlot's cap-refusal; deleteSlot's
last-refusal + activeSlot promotion). It CANNOT prove the code RUNS correctly -- that is
tools/render_probe_slots.js on the real file:// app. Selling a green static check as runtime
correctness is exactly the mineral-tiers failure this project is scarred by, so the split is
explicit and the runtime half is a labelled probe, not a claim.

Each RED case plants one missing guard. If any goes GREEN, that guard is no longer enforced.

Run:  PYTHONUTF8=1 python tools/test_slot_invariants.py
Exit 0 = every case behaves; non-zero = a slot guard stopped being enforced."""
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._slot_invariants_impl

# Minimal SlotDocSchema region (the gate slices from `SlotDocSchema = z` to `// Inferred types`).
GOOD_SCHEMA = """
export const SlotDocSchema = z
  .object({
    version: z.literal(1),
    slots: z.array(SlotSchema).min(1).max(4),
    activeSlot: z.string(),
    trash: z.array(TrashEntrySchema).max(20),
    slotTrash: z.array(SlotTrashEntrySchema).max(7).optional(),
  })
  .superRefine((doc, ctx) => {
    if (!doc.slots.some(s => s.id === doc.activeSlot)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'x', path: ['activeSlot'] });
    }
  });

// Inferred types
export type SlotDoc = z.infer<typeof SlotDocSchema>;
"""

# Minimal state/regimen.ts with the writer + the two refusable ops.
GOOD_REGIMEN = """
function writeSlotDoc(doc: SlotDoc, opts?: { emit?: boolean }): WriteResult {
  const res = setValidated(RG_SLOTS_KEY, doc, SlotDocSchema);
  if (opts?.emit !== false) { emit('regimen:changed', { slotId: RG_SLOTS_KEY, reason: 'restore' }); }
  return res;
}
export function addSlot(name?: string): SlotOpResult {
  const doc = loadSlotDoc();
  if (doc.slots.length >= MAX_SLOTS) {
    return { ok: false, reason: 'You can have at most 4 slots.' };
  }
  writeSlotDoc({ ...doc, slots: [...doc.slots, mk()] }, { reason: 'add' });
  return { ok: true };
}
export function deleteSlot(id: string): SlotOpResult {
  const doc = loadSlotDoc();
  if (doc.slots.length <= 1) {
    return { ok: false, reason: 'This is your only slot.' };
  }
  const survivors = doc.slots.filter(s => s.id !== id);
  const promoted = survivors[0];
  writeSlotDoc({ ...doc, slots: survivors, activeSlot: doc.activeSlot === id ? promoted.id : doc.activeSlot }, { reason: 'remove' });
  return { ok: true };
}
"""

CASES = []


def case(name, schema, reg, want_green, why):
    ok, msg = impl(schema, reg)
    good = (ok == want_green)
    print("%s %-32s expect=%-5s got=%-5s  %s"
          % ("ok  " if good else "FAIL", name, "GREEN" if want_green else "RED",
             "GREEN" if ok else "RED", msg[:52]))
    if not good:
        CASES.append((name, why, msg))


ok, msg = inv.check_slot_invariants()
print("%s %-32s expect=GREEN got=%-5s  %s"
      % ("ok  " if ok else "FAIL", "real_tree", "GREEN" if ok else "RED", msg[:52]))
if not ok:
    CASES.append(("real_tree", "the gate must pass on the real tree or it is unusable", msg))
print()

case("baseline_good", GOOD_SCHEMA, GOOD_REGIMEN, True,
     "the planted-good shape must pass, or every RED below is meaningless")

# --- schema half ----------------------------------------------------------------------
case("schema_no_min1", GOOD_SCHEMA.replace(".min(1).max(4)", ".max(4)"), GOOD_REGIMEN, False,
     "without .min(1) the >=1-slot invariant is not enforced -- an empty slots[] could be read back")
case("schema_no_max4", GOOD_SCHEMA.replace(".min(1).max(4)", ".min(1)"), GOOD_REGIMEN, False,
     "without .max(4) the <=4-slot cap is not enforced at the Zod boundary")
case("schema_no_max20", GOOD_SCHEMA.replace(".max(20)", ""), GOOD_REGIMEN, False,
     "without .max(20) the trash ring cap is not enforced -- an unbounded trash could be read back")
case("schema_no_max7", GOOD_SCHEMA.replace(".max(7)", ""), GOOD_REGIMEN, False,
     "without .max(7) the save-bin ring cap is not enforced -- an unbounded slotTrash could be read back")
case("schema_no_superrefine", GOOD_SCHEMA.replace("superRefine", "transform"), GOOD_REGIMEN, False,
     "without a superRefine naming activeSlot, a document whose activeSlot dangles reads as valid")

# --- state half -----------------------------------------------------------------------
case("writer_not_validated",
     GOOD_SCHEMA, GOOD_REGIMEN.replace("setValidated(RG_SLOTS_KEY, doc, SlotDocSchema)", "set(RG_SLOTS_KEY, doc)"),
     False, "writeSlotDoc must write through setValidated(..., SlotDocSchema) -- else the write "
            "boundary does not re-validate")
case("addslot_no_cap",
     GOOD_SCHEMA, GOOD_REGIMEN.replace(
         "  if (doc.slots.length >= MAX_SLOTS) {\n"
         "    return { ok: false, reason: 'You can have at most 4 slots.' };\n"
         "  }\n", ""),
     False, "addSlot with no MAX_SLOTS refusal could silently drop the 5th add")
case("deleteslot_no_last_refusal",
     GOOD_SCHEMA, GOOD_REGIMEN.replace(
         "  if (doc.slots.length <= 1) {\n"
         "    return { ok: false, reason: 'This is your only slot.' };\n"
         "  }\n", ""),
     False, "deleteSlot with no last-slot refusal could delete the only regimen")
case("deleteslot_no_promotion",
     GOOD_SCHEMA, GOOD_REGIMEN.replace(
         "writeSlotDoc({ ...doc, slots: survivors, activeSlot: doc.activeSlot === id ? promoted.id : doc.activeSlot }, { reason: 'remove' });",
         "writeSlotDoc({ ...doc, slots: survivors }, { reason: 'remove' });"),
     False, "deleteSlot that does not reassign activeSlot could leave it dangling at a deleted slot")

print()
if CASES:
    print("%d CASE(S) FAILED -- a slot guard is not enforced:" % len(CASES))
    for n, why, msg in CASES:
        print("  %s: %s" % (n, why))
        print("     got: %s" % msg[:150])
    sys.exit(1)
print("all cases behave -- the slot-system guards exist; runtime behaviour is render_probe_slots.js.")
sys.exit(0)
