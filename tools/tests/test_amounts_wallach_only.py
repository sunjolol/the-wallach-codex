#!/usr/bin/env python3
"""Negative test for amounts_wallach_only (Charter R2 transform-chain gate).

Proof artifact (§00.B "codify, don't promise" / stop-the-leak-before-building): the gate must
GREEN on the real artifact AND REDDEN on every class of poison the chain tightening exists to
catch. Drives _amounts_wallach_only_impl directly with tampered in-memory copies of the real
artifact (written to a temp file, never a tracked path), so it can never go stale vs the live
gate. Run:

    PYTHONUTF8=1 python tools/tests/test_amounts_wallach_only.py

Exit 0 = every case behaves; non-zero = the gate stopped biting (a real regression)."""
import copy
import importlib.util
import json
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CANON = ROOT / "eden" / "corpus" / "essentials-canon.json"
CLAIMS = ROOT / "eden" / "corpus" / "claims"
EMBED = ROOT / "dashboard" / "assets" / "data" / "essentials-targets-data.json"

spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._amounts_wallach_only_impl

real = json.loads(EMBED.read_text(encoding="utf-8"))
_tmp = Path(tempfile.mkdtemp(prefix="awo_negtest_"))

VITA = "Vitamin A (Retinol / beta-carotene)"
VITD = "Vitamin D2 (Ergocalciferol) + D3 (Cholecalciferol)"


def find(data, name):
    for e in data["essentials"]:
        if e["name"] == name:
            return e
    raise KeyError(name)


def tampered(label, mutate, expect_name):
    data = copy.deepcopy(real)
    mutate(data)
    p = _tmp / f"{label}.json"
    p.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    ok, msg = impl(p, CANON, CLAIMS)
    named = expect_name.lower() in msg.lower()
    print(f"  [{label}] expect RED -> {'RED' if not ok else 'GREEN'} | {expect_name!r} named: {named}")
    if ok or not named:
        print(f"    FAIL: {msg}")
    return (not ok) and named


def _part0(d):
    find(d, VITA)["target"]["parts"][0]["value"] = 2000.0


# Each case is one class of poison the tightening closes.
CASES = [
    ("posted_low",    lambda d: find(d, "Magnesium")["target"].__setitem__("low", 800.0),                    "Magnesium"),
    ("bad_factor",    lambda d: find(d, VITD)["target"]["provenance"].__setitem__("factor", 0.05),           "Vitamin D"),
    ("trace_break",   lambda d: find(d, "Sodium")["target"]["provenance"].__setitem__("original_low", 3000.0), "Sodium"),
    ("planted_scale", lambda d: find(d, "Sodium")["target"]["provenance"].__setitem__("scale_factor", 1.54), "Sodium"),
    ("part_value",    _part0,                                                                                 "Vitamin A"),
    ("no_provenance", lambda d: find(d, "Sulfur")["target"].pop("provenance"),                               "Sulfur"),
    ("bad_unit",      lambda d: find(d, "Sodium")["target"].__setitem__("unit", "g"),                        "Sodium"),
]


def main():
    ok, msg = impl(EMBED, CANON, CLAIMS)
    print(f"  [baseline] expect GREEN -> {'GREEN' if ok else 'RED'} | {msg[:80]}")
    results = [ok] + [tampered(*c) for c in CASES]
    passed = all(results)
    print(f"\n{'ALL PASS' if passed else 'FAILED'} ({sum(results)}/{len(results)})")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
