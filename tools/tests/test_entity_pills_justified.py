#!/usr/bin/env python3
"""Negative test for entity_pills_justified (the pill-derivation gate).

Proof artifact: the gate must GREEN on the real generated artifact (every pill backed by a
qualifying claim) and REDDEN when an essentials[]-union-style leaked pill is injected -- a
restore nutrient with no directed maps() claim, a help-with condition likewise, or a works-with
partner sharing no interaction claim. Drives _entity_pills_justified_impl with a tampered copy
of the real artifact + the real corpus-embed. Run:

    PYTHONUTF8=1 python tools/tests/test_entity_pills_justified.py

Exit 0 = every case behaves; non-zero = the gate stopped biting."""
import copy
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ARTIFACT = ROOT / "dashboard" / "assets" / "data" / "entity-page-data.json"
EMBED = ROOT / "dashboard" / "assets" / "data" / "corpus-embed.json"

spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._entity_pills_justified_impl

art = json.loads(ARTIFACT.read_text(encoding="utf-8"))
embed = json.loads(EMBED.read_text(encoding="utf-8"))


def tampered(label, mutate, expect_token):
    data = copy.deepcopy(art)
    mutate(data)
    ok, msg = impl(data, embed)
    named = expect_token.lower() in msg.lower()
    print(f"  [{label}] expect RED -> {'RED' if not ok else 'GREEN'} | {expect_token!r} named: {named}")
    if ok or not named:
        print(f"    FAIL: {msg}")
    return (not ok) and named


CASES = [
    # zinc maps to diabetes/immunity, never osteoporosis (only via the 10x10 shotgun) -> leaked restore pill
    ("leaked_restore", lambda d: d["conditions"]["osteoporosis"]["restore"].append("zinc"), "zinc"),
    # deafness reaches calcium only via the shotgun -> leaked help-with pill
    ("leaked_helpwith", lambda d: d["essentials"]["calcium"]["conditions"].append("deafness"), "deafness"),
    # oxygen shares no interaction claim with calcium -> leaked works-with pill
    ("leaked_workswith", lambda d: d["essentials"]["calcium"]["works_with"].append("oxygen"), "oxygen"),
]


def main():
    ok, msg = impl(art, embed)
    print(f"  [baseline] expect GREEN -> {'GREEN' if ok else 'RED'} | {msg[:80]}")
    results = [ok] + [tampered(*c) for c in CASES]
    passed = all(results)
    print(f"\n{'ALL PASS' if passed else 'FAILED'} ({sum(results)}/{len(results)})")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
