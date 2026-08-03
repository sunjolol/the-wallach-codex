#!/usr/bin/env python3
"""Negative test for charter_gates_present (Charter R7 -- the meta-gate).

Proof artifact (§00.B "codify, don't promise" / R7). This is the gate whose entire purpose
is "the Charter can no longer oversell its own enforcement" -- so it is the LAST gate that
may be trusted on faith.

THE BUG IT NOW PINS (found 2026-07-15, fixed same patch per R9). The WISH exemption was
PER-ROW:

    is_wish = "WISH" in status_cell or "WISH" in gate_cell
    ...
    if is_wish: continue

so ANY rule whose status prose merely CONTAINED the word "WISH" had EVERY gate name in its
column skipped from existence-checking. R2 was exempt not because it was unenforced but
because its status says a gate "LANDED" and uses the word in passing. Measured: a planted
fake gate name was caught in R6 and R9 ONLY -- 2 of 9 rules, 22% -- while the gate reported
"all 9 Charter rules name real gates or are labeled WISH". That message READS as
verification of 9 and WAS verification of 2. R7's own gate committed the exact failure R7
exists to prevent, and nothing noticed because the message counted ROWS PARSED, not GATES
CHECKED.

Case 'planted_fake_in_every_row' is the load-bearing one: it re-runs that measurement. If
the caught-count ever drops below 9 again, the per-row loosening has crept back.

Run:  PYTHONUTF8=1 python tools/test_charter_gates_present.py

Exit 0 = every case behaves; non-zero = the meta-gate stopped biting."""
import importlib.util
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._charter_gates_present_impl
wished = inv._charter_name_is_wished

CHARTER = (ROOT / ".claude" / "skills" / "charter" / "SKILL.md").read_text(encoding="utf-8")
LIVE = {i.name for i in inv.INVARIANTS}
FAKE = "totally_fake_gate_xyz"


def rule_rows(text):
    return [l for l in text.splitlines() if re.match(r"\|\s*R[0-9]\b", l.strip())]


def plant_into_row(text, rule_id, token):
    """Inject a fake gate name into ONE rule's GATE column."""
    out = []
    for line in text.splitlines():
        s = line.strip()
        if re.match(r"\|\s*" + rule_id + r"\b", s):
            cells = s.strip("|").split("|")
            cells[2] = cells[2] + " `" + token + "`"
            line = "| " + " | ".join(c.strip() for c in cells) + " |"
        out.append(line)
    return "\n".join(out)


def main():
    fails = []

    # 0. the real Charter must be green, or the gate is unusable
    ok, msg = impl(CHARTER, LIVE)
    print("%s real_charter        expect=GREEN got=%-5s  %s"
          % ("ok  " if ok else "FAIL", "GREEN" if ok else "RED", msg[:74]))
    if not ok:
        fails.append(("real_charter", msg))

    # 1. THE MEASUREMENT: a fake gate planted in each rule must RED in ALL 9.
    #    Pre-fix this caught 2 of 9 (R6, R9 only).
    print()
    caught = []
    missed = []
    for n in range(1, 10):
        rid = "R%d" % n
        ok, msg = impl(plant_into_row(CHARTER, rid, FAKE), LIVE)
        (missed if ok else caught).append(rid)
        print("  %-4s planted fake gate -> %s" % (rid, "RED (caught)" if not ok else "**GREEN (MISSED)**"))
    print()
    print("  caught %d/9  %s" % (len(caught), caught))
    if missed:
        print("  MISSED %d/9  %s   <- the per-row loosening is back" % (len(missed), missed))
        fails.append(("planted_fake_in_every_row",
                      "a fake gate name went unchecked in %s -- pre-fix this was 7/9" % missed))

    # 2. an HONEST per-name WISH must still be excused (the fix must not over-fire)
    print()
    honest = CHARTER.replace(
        "| R8 |", "| R8x | placeholder | `%s` | **WISH.** `%s` lands in a later phase |" % (FAKE, FAKE), 1)
    cell_status = "**WISH.** `%s` lands in a later phase" % FAKE
    got = wished(FAKE, cell_status)
    print("%s honest_wish_excused expect=True  got=%s" % ("ok  " if got else "FAIL", got))
    if not got:
        fails.append(("honest_wish_excused",
                      "a gate honestly labeled WISH must still be excused; over-firing would "
                      "push authors to delete the WISH label, which is worse than the bug"))

    # 3. the R2-shaped trap: a status that says LANDED and merely MENTIONS wish must NOT
    #    excuse an unrelated gate name.
    r2ish = ("**LIVE.** `real_gate` -- ... `citations_reference_registry` (the last "
             "R2/R3-family WISH) LANDED Phase D-c")
    got = wished(FAKE, r2ish)
    print("%s r2_trap_not_excused expect=False got=%s" % ("ok  " if not got else "FAIL", got))
    if got:
        fails.append(("r2_trap_not_excused",
                      "a row that merely MENTIONS the word WISH must not excuse its gates -- "
                      "this is the exact R2 case that disabled the gate for 7 of 9 rules"))

    # 4. clause scoping: a name AFTER a WISH marker but BEYOND the next LIVE marker is a
    #    different clause and must not be excused.
    scoped = "WISH: `%s` later. LIVE: `other_gate` now." % FAKE
    print("%s wish_clause_scoped  expect=True  got=%s"
          % ("ok  " if wished(FAKE, scoped) else "FAIL", wished(FAKE, scoped)))
    if not wished(FAKE, scoped):
        fails.append(("wish_clause_scoped", "a name inside the WISH clause must be excused"))
    after = "WISH: `something_else` later. LIVE: `%s` now." % FAKE
    print("%s live_clause_checked expect=False got=%s"
          % ("ok  " if not wished(FAKE, after) else "FAIL", wished(FAKE, after)))
    if wished(FAKE, after):
        fails.append(("live_clause_checked",
                      "a name in the LIVE clause must NOT inherit the row's earlier WISH"))

    print()
    if fails:
        print("%d CASE(S) FAILED -- the meta-gate stopped biting:" % len(fails))
        for n, why in fails:
            print("  %s: %s" % (n, why))
        return 1
    print("all cases behave -- the Charter can no longer oversell its own enforcement.")
    print("(caught %d/9 planted fakes; pre-fix 2026-07-15 this was 2/9)" % len(caught))
    return 0


if __name__ == "__main__":
    sys.exit(main())
