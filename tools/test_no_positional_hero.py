#!/usr/bin/env python3
"""Negative test for no_positional_hero (Phase H1 prominence gate).

Proof artifact: the gate must GREEN on the real artifact (no reference-table row in any curated
primary slot) + an empty view set, and REDDEN when (a) a base-line-program / dose-table claim is
injected into a condition's protocol_claim_ids, or (b) an entity view chooses its hero by array
position (claims[0]). Drives _no_positional_hero_impl with tampered data + synthetic view files.
Run:

    PYTHONUTF8=1 python tools/test_no_positional_hero.py

Exit 0 = every case behaves; non-zero = the gate stopped biting."""
import copy
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ARTIFACT = ROOT / "dashboard" / "assets" / "data" / "entity-page-data.json"
EMBED = ROOT / "dashboard" / "assets" / "data" / "corpus-embed.json"

spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._no_positional_hero_impl

art = json.loads(ARTIFACT.read_text(encoding="utf-8"))
embed = json.loads(EMBED.read_text(encoding="utf-8"))
claims = embed["claims"]

# a real base-line-table claim id (the prominence rule's target) -- found from the embed
BASE_LINE_ID = next(cid for cid, c in claims.items() if c.get("base_line_table"))

CLEAN_VIEW = ("views/knowledge.ts",
              "const primary = pickByProminence(rec.protocol_claim_ids);  // explicit, not positional\n")
POSITIONAL_VIEW = ("views/knowledge.ts",
                   "const hero = rec.record[0];  // WRONG: hero by array position\n")


def case(label, artifact, claim_map, view_files, expect_red, token=None):
    ok, msg = impl(artifact, claim_map, view_files)
    got = "RED" if not ok else "GREEN"
    want = "RED" if expect_red else "GREEN"
    named = (token is None) or (token.lower() in msg.lower())
    print(f"  [{label}] expect {want} -> {got} | token {token!r} named: {named}")
    good = ((not ok) == expect_red) and named
    if not good:
        print(f"    FAIL: {msg}")
    return good


def with_baseline_in_primary():
    d = copy.deepcopy(art)
    # inject the base-line-table claim into some condition's curated primary slot
    d["conditions"]["osteoporosis"]["protocol_claim_ids"].append(BASE_LINE_ID)
    return d


def main():
    results = [
        case("baseline_clean", art, claims, [], expect_red=False),
        case("clean_view_reads_prominence", art, claims, [CLEAN_VIEW], expect_red=False),
        case("base_line_in_primary", with_baseline_in_primary(), claims, [], expect_red=True, token=BASE_LINE_ID),
        case("positional_hero_view", art, claims, [POSITIONAL_VIEW], expect_red=True, token="record[0]"),
    ]
    passed = all(results)
    print(f"\nbase-line claim used: {BASE_LINE_ID}")
    print(f"{'ALL PASS' if passed else 'FAILED'} ({sum(results)}/{len(results)})")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
