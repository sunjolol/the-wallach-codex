#!/usr/bin/env python3
"""Negative test for kind_label_covers_corpus (Phase H0 content-store gate).

Proof artifact: the gate must GREEN when view-copy.json labels every sealed claim.kind AND
REDDEN when any kind lacks a label (so the entity page can never render a raw/blank kind
header). Drives _kind_label_covers_corpus_impl with a tampered copy of the real store. Run:

    PYTHONUTF8=1 python tools/test_kind_label_covers_corpus.py

Exit 0 = every case behaves; non-zero = the gate stopped biting."""
import copy
import importlib.util
import json
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STORE = ROOT / "dashboard" / "assets" / "data" / "view-copy.json"
CLAIMS = ROOT / "eden" / "corpus" / "claims"

spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._kind_label_covers_corpus_impl

real = json.loads(STORE.read_text(encoding="utf-8"))
_tmp = Path(tempfile.mkdtemp(prefix="klc_negtest_"))


def tampered(label, mutate, expect_kind):
    data = copy.deepcopy(real)
    mutate(data)
    p = _tmp / f"{label}.json"
    p.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    ok, msg = impl(p, CLAIMS)
    named = expect_kind.lower() in msg.lower()
    print(f"  [{label}] expect RED -> {'RED' if not ok else 'GREEN'} | {expect_kind!r} named: {named}")
    if ok or not named:
        print(f"    FAIL: {msg}")
    return (not ok) and named


CASES = [
    ("drop_protocol", lambda d: d["kind_labels"].pop("protocol"), "protocol"),
    ("drop_dose", lambda d: d["kind_labels"].pop("dose"), "dose"),
    ("empty_all", lambda d: d.__setitem__("kind_labels", {}), "food_source"),
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
