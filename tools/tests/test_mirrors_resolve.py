#!/usr/bin/env python3
"""test_mirrors_resolve.py — NEGATIVE test for the mirrors_resolve gate.

A gate that has never been SEEN to fail is theater. This plants each defect the gate claims to
catch and asserts RED, then asserts GREEN on the real sealed data. Run:

    PYTHONUTF8=1 python tools/tests/test_mirrors_resolve.py

WHY EACH CASE EXISTS (every one is a real failure mode, not a shape check):
  1  no mirrors_slug        -> the view has nothing to point at; tile blanks with no explanation.
  2  slug resolves to nothing -> a typo leaves the tile permanently blank, looking exactly like
                              an essential that has no Wallach amount yet. Silent by construction.
  3  mirror of a mirror     -> coverage.ts does a SINGLE hop, so a chain silently truncates.
  4  cycle (a<->b)          -> same, and it is what "no cycles" in the design actually means.
  5  numeric low on a mirror -> ★ THE DEFECT THIS WHOLE PATCH REMOVED. amounts_wallach_only
                              SKIPS non-numeric targets, so if a number returns here it is the
                              only gate watching. This case is the 400 mcg coming back.
  6  canon says mirror, artifact does not -> a stale/hand-edited artifact drops the routing.
  7  artifact says mirror, canon does not -> a mirror the sealed pillar never declared.
  8  the REAL data          -> must be GREEN (cobalt -> vitamin-b12), or the gate is useless.
"""
import importlib.util
import json
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("inv", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)

FAILS = []


def run(name, canon_ess, art_ess, want_red):
    with tempfile.TemporaryDirectory() as td:
        cp = Path(td) / "canon.json"
        ap = Path(td) / "art.json"
        cp.write_text(json.dumps({"essentials": canon_ess}), encoding="utf-8")
        ap.write_text(json.dumps({"essentials": art_ess}), encoding="utf-8")
        ok, msg = inv._mirrors_resolve_impl(ap, cp)
    red = not ok
    verdict = "PASS" if red == want_red else "FAIL"
    if red != want_red:
        FAILS.append(name)
    print(f"  {verdict}  {name}\n         -> {'RED' if red else 'GREEN'}: {msg[:110]}")


C_OK = [
    {"slug": "cobalt", "coverage_kind": "mirrors", "mirrors_slug": "vitamin-b12"},
    {"slug": "vitamin-b12", "coverage_kind": "unspecified"},
]
A_OK = [
    {"slug": "cobalt", "target": {"kind": "mirrors", "mirrors_slug": "vitamin-b12"}},
    {"slug": "vitamin-b12", "target": {"kind": "wallach", "low": 400.0}},
]

print("mirrors_resolve — negative test\n")

run("1 kind 'mirrors' with NO mirrors_slug",
    C_OK, [{"slug": "cobalt", "target": {"kind": "mirrors"}}, A_OK[1]], want_red=True)

run("2 mirrors_slug resolves to no canon essential",
    [{"slug": "cobalt", "coverage_kind": "mirrors", "mirrors_slug": "vitamin-b12"}, C_OK[1]],
    [{"slug": "cobalt", "target": {"kind": "mirrors", "mirrors_slug": "vitamin-b-twelve"}}, A_OK[1]],
    want_red=True)

run("3 mirror OF a mirror (chain)",
    [{"slug": "cobalt", "coverage_kind": "mirrors", "mirrors_slug": "vitamin-b12"},
     {"slug": "vitamin-b12", "coverage_kind": "mirrors", "mirrors_slug": "folate"},
     {"slug": "folate", "coverage_kind": "unspecified"}],
    [{"slug": "cobalt", "target": {"kind": "mirrors", "mirrors_slug": "vitamin-b12"}},
     {"slug": "vitamin-b12", "target": {"kind": "mirrors", "mirrors_slug": "folate"}},
     {"slug": "folate", "target": {"kind": "wallach", "low": 400.0}}],
    want_red=True)

run("4 CYCLE: cobalt <-> vitamin-b12",
    [{"slug": "cobalt", "coverage_kind": "mirrors", "mirrors_slug": "vitamin-b12"},
     {"slug": "vitamin-b12", "coverage_kind": "mirrors", "mirrors_slug": "cobalt"}],
    [{"slug": "cobalt", "target": {"kind": "mirrors", "mirrors_slug": "vitamin-b12"}},
     {"slug": "vitamin-b12", "target": {"kind": "mirrors", "mirrors_slug": "cobalt"}}],
    want_red=True)

run("5 ★ THE 400 MCG RETURNS: a mirror posts a numeric low",
    C_OK,
    [{"slug": "cobalt", "target": {"kind": "mirrors", "mirrors_slug": "vitamin-b12",
                                   "low": 400.0, "unit": "mcg"}}, A_OK[1]],
    want_red=True)

run("6 canon declares a mirror the artifact dropped",
    C_OK, [{"slug": "cobalt", "target": {"kind": "trace_pdm"}}, A_OK[1]], want_red=True)

run("7 artifact invents a mirror the canon never declared",
    [{"slug": "cobalt", "coverage_kind": "trace_pdm"}, C_OK[1]], A_OK, want_red=True)

ok, msg = inv.check_mirrors_resolve()
v = "PASS" if ok else "FAIL"
if not ok:
    FAILS.append("8 real data green")
print(f"  {v}  8 the REAL sealed data must be GREEN\n         -> {'GREEN' if ok else 'RED'}: {msg[:110]}")

print()
if FAILS:
    print(f"FAILED ({len(FAILS)}): {FAILS}")
    sys.exit(1)
print("ALL 8 CASES PASS — the gate goes RED on every planted defect and GREEN on the real data.")
