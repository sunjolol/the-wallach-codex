#!/usr/bin/env python3
"""Negative test for view_category_not_hardcoded (Phase H1 colour-language gate).

Proof artifact: the gate must GREEN when an entity view reads its colour category from the
map (state/copy.ts::kindCategory) and REDDEN when a view hardcodes a colour-family literal
('green'/'teal'/'amber'/'orange'/'violet'/'red'). Drives _view_category_not_hardcoded_impl
with synthetic (relpath, text) file tuples (the impl is param-taking). Run:

    PYTHONUTF8=1 python tools/test_view_category_not_hardcoded.py

Exit 0 = every case behaves; non-zero = the gate stopped biting."""
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._view_category_not_hardcoded_impl

# The legitimate path: the view reads the family from the map, no family literal in sight.
CLEAN = ("views/knowledge.ts",
         "const cat = kindCategory(claim.kind);\n"
         "el.className = `sr-claim sr-cat-${cat}`;  // colour flows from view-copy\n")

# The violation: a per-claim colour hardcoded as a family literal.
HARDCODED = ("views/knowledge.ts",
             "const cat = claim.kind === 'dose' ? 'orange' : 'teal';\n"
             "el.className = `sr-claim sr-cat-${cat}`;\n")

# A family word appearing only INSIDE a larger class string is NOT a bare family literal.
CLASS_ONLY = ("views/knowledge.ts",
              "el.className = 'sr-claim sr-cat-red';  // full class token, not a bare family\n")


def case(label, files, expect_red, expect_token=None):
    ok, msg = impl(files)
    got = "RED" if not ok else "GREEN"
    want = "RED" if expect_red else "GREEN"
    named = (expect_token is None) or (expect_token.lower() in msg.lower())
    print(f"  [{label}] expect {want} -> {got} | token {expect_token!r} named: {named}")
    good = (not ok) == expect_red and named
    if not good:
        print(f"    FAIL: {msg}")
    return good


def main():
    results = [
        case("baseline_empty", [], expect_red=False),
        case("clean_reads_map", [CLEAN], expect_red=False),
        case("class_token_only", [CLASS_ONLY], expect_red=False),
        case("hardcoded_family", [HARDCODED], expect_red=True, expect_token="orange"),
    ]
    passed = all(results)
    print(f"\n{'ALL PASS' if passed else 'FAILED'} ({sum(results)}/{len(results)})")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
