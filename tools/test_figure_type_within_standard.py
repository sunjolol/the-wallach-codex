#!/usr/bin/env python3
"""Negative test for figure_type_within_standard (element-header contract, 2026-07-29).

Proof artifact: the gate must GREEN on figure type that matches the MEASURED selenium
standard (labels 12.0px, element glyph 17.6px) and REDDEN on either drift direction —
a label off 12px, or anything above the 17.6px glyph ceiling. Both errors were made on
copper's header in one session: first the labels rendered far under standard, then the
overcorrection put them at 15/17/18/32, above selenium. Selenium is the CEILING, not a
floor. Drives _figure_type_within_standard_impl with synthetic CSS. Run:

    PYTHONUTF8=1 python tools/test_figure_type_within_standard.py

Exit 0 = every case behaves; non-zero = the gate stopped biting."""
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._figure_type_within_standard_impl

M = "#drawer-knowledge-mount "
OK_CSS = (M + ".kd-ep-fam__glabel { font-size: 12px; }\n"
          + M + ".kd-ep-fam__gsub { font-size: 12px; }\n"
          + M + ".kd-ep-fam__gname { font-size: 12px; }\n"
          + M + ".kd-ep-fam__gtag { font-size: 12px; letter-spacing: .1em; }\n"
          + M + ".kd-ep-fam__gstop { font-size: 12px; font-weight: 700; }\n"
          + M + ".kd-ep-fam__gglyph { font-size: 17.6px; }\n")

CASES = [
    ("the shipped standard passes", OK_CSS, True),
    # the OVERCORRECTION that was rejected on sight
    ("label at 15px REDDENS", M + ".kd-ep-fam__glabel { font-size: 15px; }", False),
    ("label at 17px REDDENS", M + ".kd-ep-fam__gstop { font-size: 17px; }", False),
    ("glyph at 32px REDDENS", M + ".kd-ep-fam__gglyph { font-size: 32px; }", False),
    ("any g-class above the 17.6px ceiling REDDENS",
     M + ".kd-ep-fam__gbanner { font-size: 24px; }", False),
    # drift the OTHER way is a defect too — 12px is exact, not a maximum
    ("label at 10px REDDENS", M + ".kd-ep-fam__gsub { font-size: 10px; }", False),
    ("label at 11.5px REDDENS", M + ".kd-ep-fam__gname { font-size: 11.5px; }", False),
    # exactly at the ceiling is allowed; a non-label class between the two is not pinned to 12
    ("glyph exactly 17.6px passes", M + ".kd-ep-fam__gglyph { font-size: 17.6px; }", True),
    ("non-label g-class at 14px passes (only the ceiling binds)",
     M + ".kd-ep-fam__gcaption { font-size: 14px; }", True),
    # spare the rest of the stylesheet: non-figure classes are out of scope
    ("a non-figure class at 32px is out of scope",
     M + ".kd-ep-fam__kill { font-size: 32px; }", True),
    ("a g-class with no font-size is skipped",
     M + ".kd-ep-fam__gretdot { fill: red; stroke-width: 2; }", True),
    ("empty stylesheet is vacuously green", "", True),
]

fails = []
for name, css, expect in CASES:
    ok, msg = impl(css)
    if ok != expect:
        fails.append(f"{name}: expected ok={expect}, got ok={ok} ({msg})")

for f in fails:
    print("FAIL ·", f)
print(f"{'PASS' if not fails else 'FAIL'} · test_figure_type_within_standard · "
      f"{len(CASES) - len(fails)}/{len(CASES)} cases")
sys.exit(1 if fails else 0)
