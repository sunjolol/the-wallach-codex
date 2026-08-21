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

FLAV_NAME = "Flavonoids / Bioflavonoids"


def FLAV(d):
    """The flavonoids target — the one essential that posts the LOWER end of a Wallach range."""
    return find(d, FLAV_NAME)["target"]


SILVER_NAME = "Silver"


def AG(d):
    """Silver's target — the one essential posting a stated CEILING instead of a target.

    Wallach writes "Humans can consume 400 mcg of silver per day" (WAL-CLM-DDDL-000013) — a
    tolerance, not a requirement, and silver has no row in his Base Line table at all. The
    number is still HIS, so it must survive the same trace + recompute as any target; only
    its ROLE changed. These cases prove the gate did not stop looking when the key was renamed."""
    return find(d, SILVER_NAME)["target"]


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
    # The lower-of-range exception (flavonoids posts Wallach's 1,000 rather than his 5,000). Both
    # ends are his own numbers from one claim, so the choice is legal — but it must be DECLARED and
    # must still equal that end of the range exactly. Each poison below is a way the declaration
    # could rot into "any number goes".
    ("lower_not_low",   lambda d: FLAV(d)["provenance"].__setitem__("lower_taken", 1234.0),       "Flavonoids"),
    ("lower_no_reason", lambda d: FLAV(d)["provenance"].pop("lower_taken_reason"),                "Flavonoids"),
    ("lower_prose",     lambda d: FLAV(d)["provenance"].__setitem__(
                            "lower_taken_reason", "the upper end is unreachable by any product"),  "Flavonoids"),
    ("lower_both_ends", lambda d: FLAV(d)["provenance"].__setitem__("upper_taken", 5000.0),       "Flavonoids"),
    ("lower_value_off", lambda d: FLAV(d).__setitem__("low", 5000.0),                             "Flavonoids"),
    # The CEILING reclassification (silver posts what Wallach says you CAN take, not a need).
    # Each poison is a way that reclassification could rot into an unaudited number.
    ("ceiling_no_reason",  lambda d: AG(d).pop("ceiling_reason"),                                 "Silver"),
    ("ceiling_prose",      lambda d: AG(d).__setitem__(
                               "ceiling_reason", "he says you can consume it, not that you need it"), "Silver"),
    ("ceiling_value_off",  lambda d: AG(d).__setitem__("ceiling", 4000.0),                        "Silver"),
    ("ceiling_trace_break", lambda d: AG(d)["provenance"].__setitem__("original_low", 250.0),     "Silver"),
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
