#!/usr/bin/env python3
"""Negative test for claim_category_mapping_total (the colour-language gate).

Proof artifact: the gate must GREEN when view-copy.json kind_categories maps every sealed
claim.kind to exactly one of the six locked colour families, and REDDEN when the map is not
TOTAL/exact -- a sealed kind dropped, a category outside the locked language, or an entry for
a kind not in the corpus. Drives _claim_category_mapping_total_impl with a tampered copy of the
real store. Run:

    PYTHONUTF8=1 python tools/tests/test_claim_category_mapping_total.py

Exit 0 = every case behaves; non-zero = the gate stopped biting."""
import copy
import importlib.util
import json
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STORE = ROOT / "dashboard" / "assets" / "data" / "view-copy.json"
CLAIMS = ROOT / "eden" / "corpus" / "claims"

spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._claim_category_mapping_total_impl

real = json.loads(STORE.read_text(encoding="utf-8"))
_tmp = Path(tempfile.mkdtemp(prefix="ccm_negtest_"))


def tampered(label, mutate, expect_token):
    data = copy.deepcopy(real)
    mutate(data)
    p = _tmp / f"{label}.json"
    p.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    ok, msg = impl(p, CLAIMS)
    named = expect_token.lower() in msg.lower()
    print(f"  [{label}] expect RED -> {'RED' if not ok else 'GREEN'} | {expect_token!r} named: {named}")
    if ok or not named:
        print(f"    FAIL: {msg}")
    return (not ok) and named


CASES = [
    # a sealed kind loses its colour -> missing (not total)
    ("drop_deficiency_sign", lambda d: d["kind_categories"].pop("deficiency_sign"), "deficiency_sign"),
    ("drop_protocol", lambda d: d["kind_categories"].pop("protocol"), "protocol"),
    # a category outside the six locked families
    ("bad_family", lambda d: d["kind_categories"].__setitem__("dose", "pink"), "pink"),
    # a category entry for a kind that is not in the corpus (map not pinned to reality)
    ("extra_kind", lambda d: d["kind_categories"].__setitem__("made_up_kind", "green"), "made_up_kind"),
    # empty map -> every sealed kind missing
    ("empty_all", lambda d: d.__setitem__("kind_categories", {}), "no colour category"),
]


def main():
    ok, msg = impl(STORE, CLAIMS)
    print(f"  [baseline] expect GREEN -> {'GREEN' if ok else 'RED'} | {msg[:80]}")
    results = [ok] + [tampered(*c) for c in CASES]
    passed = all(results)
    print(f"\n{'ALL PASS' if passed else 'FAILED'} ({sum(results)}/{len(results)})")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
