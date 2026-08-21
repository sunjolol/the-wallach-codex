#!/usr/bin/env python3
"""Negative test for element_header_complete (element-header contract, 2026-07-29).

Proof artifact: the gate must GREEN when every shipped header carries BOTH its opening lede
and its why-this-number provenance, and REDDEN the moment either is missing, blank, or the
whole entity-copy entry is absent. This is the exact defect that shipped on copper — the
header went live with `why` and no `lede`, and a half-filled entry is indistinguishable from
a complete one on the rendered page. Drives _element_header_complete_impl with synthetic
stores so the gate is proven to bite without tampering with the real files. Run:

    PYTHONUTF8=1 python tools/tests/test_element_header_complete.py

Exit 0 = every case behaves; non-zero = the gate stopped biting."""
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._element_header_complete_impl

MECH_ONE = {"mechanisms": [{"slug": "copper"}]}
MECH_TWO = {"mechanisms": [{"slug": "copper"}, {"slug": "selenium"}]}
GOOD = {"lede": "An opening line.", "why": "From the 2014 table, scaled."}

CASES = [
    # (name, mech_store, copy_store, expect_ok)
    ("complete entry passes",
     MECH_ONE, {"essentials": {"copper": dict(GOOD)}}, True),
    ("two complete entries pass",
     MECH_TWO, {"essentials": {"copper": dict(GOOD), "selenium": dict(GOOD)}}, True),
    # THE SHIPPED DEFECT: why present, lede missing
    ("missing lede REDDENS",
     MECH_ONE, {"essentials": {"copper": {"why": GOOD["why"]}}}, False),
    ("missing why REDDENS",
     MECH_ONE, {"essentials": {"copper": {"lede": GOOD["lede"]}}}, False),
    ("blank lede REDDENS",
     MECH_ONE, {"essentials": {"copper": {"lede": "   ", "why": GOOD["why"]}}}, False),
    ("blank why REDDENS",
     MECH_ONE, {"essentials": {"copper": {"lede": GOOD["lede"], "why": ""}}}, False),
    ("entry absent entirely REDDENS",
     MECH_ONE, {"essentials": {}}, False),
    ("one complete + one half-filled REDDENS",
     MECH_TWO, {"essentials": {"copper": dict(GOOD), "selenium": {"lede": GOOD["lede"]}}}, False),
    # a copy entry for an element with NO header is none of this gate's business
    ("extra entry without a header is ignored",
     MECH_ONE, {"essentials": {"copper": dict(GOOD), "calcium": {"lede": "x"}}}, True),
    # vacuous-but-honest: no headers shipped yet
    ("no headers = vacuously green",
     {"mechanisms": []}, {"essentials": {}}, True),
]

fails = []
for name, mech, copy, expect in CASES:
    ok, msg = impl(mech, copy)
    if ok != expect:
        fails.append(f"{name}: expected ok={expect}, got ok={ok} ({msg})")

for f in fails:
    print("FAIL ·", f)
print(f"{'PASS' if not fails else 'FAIL'} · test_element_header_complete · "
      f"{len(CASES) - len(fails)}/{len(CASES)} cases")
sys.exit(1 if fails else 0)
