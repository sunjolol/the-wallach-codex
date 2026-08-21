#!/usr/bin/env python3
"""test_goal_members_actionable.py — NEGATIVE test for the goal-membership gate.

A gate that has never been SEEN to fail is theater. This plants each defect the gate claims to
catch and asserts RED, then asserts GREEN on the real files. Run:

    PYTHONUTF8=1 python tools/tests/test_goal_members_actionable.py

WHY EACH CASE EXISTS. Every one is SILENT — the board stays green and the field simply starts
telling the user to do something they cannot do, or quietly stops highlighting something:
   1  trace_pdm member   -> ★ STRONTIUM is plant-derived with no individual Wallach amount, so
                            a ring on it under stronger-bones is a to-do the user cannot do:
                            nothing they buy closes it individually — the group verdict owns it.
   2  fiat member        -> a ring on OXYGEN. You breathe; there is nothing to take, so there
                            is no goal to set. It can never leave the ring state.
   3  FIAT DRIFT         -> ★ THE CASE THAT EARNS THE GATE. The H/C/N/O list is written twice,
                            in Python and TypeScript, because Python cannot import TS. Change
                            one and goal membership silently diverges from the field's own
                            fiat. This is the mineral-tiers shape: consistent, sealed, wrong.
   4  fiat const missing -> the mirror cannot be checked at all; that must be RED, not a skip.
   5  per-goal `total`   -> ★ THE DENOMINATOR. "bone 3/14" asserts bone health IS 14 things,
                            inverting Wallach's thesis that you need all 90. Six hand-typed
                            unsourced totals once rode the derive into a MANIFEST-gated
                            artifact, so derived_artifacts_fresh certified them as "fresh".
   6  empty members      -> a chip that highlights nothing — a promise the field cannot keep.
   7  stray member       -> a slug not on the board; the ring would target a tile that is not
                            there, so the goal silently under-highlights.
   8  no goals at all    -> ANTI-VACUITY. A gate over an empty set certifies nothing.
   9  real files GREEN   -> the gate must not over-fire on the shipped data.
"""
import copy
import json
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))
from invariants import _goal_members_actionable_impl  # noqa: E402

LAYOUT = ROOT / "dashboard/assets/data/coverage-layout-data.json"
TARGETS = ROOT / "dashboard/assets/data/essentials-targets-data.json"
DERIVE = ROOT / "eden/tools/coverage_layout_derive.py"
COV_TS = ROOT / "dashboard/assets/js/src/state/coverage.ts"

results = []


def run(name, expect_ok, layout=None, derive=None, cov=None):
    with tempfile.TemporaryDirectory() as d:
        d = Path(d)
        lp, dp, cp = d / "layout.json", d / "derive.py", d / "coverage.ts"
        lp.write_text(json.dumps(layout) if layout is not None
                      else LAYOUT.read_text(encoding="utf-8"), encoding="utf-8")
        dp.write_text(derive if derive is not None
                      else DERIVE.read_text(encoding="utf-8"), encoding="utf-8")
        cp.write_text(cov if cov is not None
                      else COV_TS.read_text(encoding="utf-8"), encoding="utf-8")
        ok, msg = _goal_members_actionable_impl(lp, TARGETS, dp, cp)
    good = (ok == expect_ok)
    results.append((good, name, "GREEN" if ok else "RED", msg[:110]))
    return good


base = json.loads(LAYOUT.read_text(encoding="utf-8"))
derive_src = DERIVE.read_text(encoding="utf-8")

# 1 — a trace_pdm member (the demo's own strontium bug)
d1 = copy.deepcopy(base)
d1["goals"][0]["members"].append("strontium")
run("1  trace_pdm member (strontium) -> RED", False, layout=d1)

# 2 — a fiat member
d2 = copy.deepcopy(base)
d2["goals"][0]["members"].append("oxygen")
run("2  fiat-covered member (oxygen) -> RED", False, layout=d2)

# 3 — FIAT DRIFT: the derive's list loses a slug the TS still has
run("3  FIAT DRIFT (derive drops carbon) -> RED", False,
    derive=derive_src.replace('frozenset({"hydrogen", "carbon", "nitrogen", "oxygen"})',
                              'frozenset({"hydrogen", "nitrogen", "oxygen"})'))

# 4 — the mirrored const is gone entirely
run("4  FIAT_COVERED_SLUGS missing -> RED", False,
    derive=derive_src.replace("FIAT_COVERED_SLUGS = frozenset(", "RENAMED_AWAY = frozenset("))

# 5 — a per-goal total (the denominator)
d5 = copy.deepcopy(base)
d5["goals"][0]["total"] = 14
run("5  per-goal `total` (a denominator) -> RED", False, layout=d5)

# 6 — an empty goal
d6 = copy.deepcopy(base)
d6["goals"][0]["members"] = []
run("6  empty members -> RED", False, layout=d6)

# 7 — a member not on the board
d7 = copy.deepcopy(base)
d7["goals"][0]["members"].append("unobtanium")
run("7  stray member (not a tile) -> RED", False, layout=d7)

# 8 — anti-vacuity
d8 = copy.deepcopy(base)
d8["goals"] = []
run("8  no goals at all -> RED (anti-vacuity)", False, layout=d8)

# 9 — the real files must be GREEN
run("9  REAL FILES -> GREEN", True)

print("\n  test_goal_members_actionable")
print("  " + "─" * 74)
for good, name, got, msg in results:
    print(f"  {'ok ' if good else 'XX '} {name:52s} {got}")
    if not good:
        print(f"        -> {msg}")
bad = [r for r in results if not r[0]]
print("  " + "─" * 74)
print(f"  {len(results) - len(bad)}/{len(results)} cases behaved as specified")
sys.exit(1 if bad else 0)
