#!/usr/bin/env python3
"""Negative test for explore_entity_lede_authored (§00.B "codify, don't promise").

THE DEFECT this gate exists for: the knowledge-topic hero derived its header from a claim's
answer_short, so the new chocolate page was titled "It's a mineral-deficiency signal..." and NO
gate caught it. Case 'new_explore_entity_no_lede_fires' IS that defect reduced to one case; if it
flips silent, a new explore topic can ship an answer-shaped header again.

The SPARING cases matter as much: an essential (type nutrient), a condition, an entity with no
claim, and any grandfathered backlog entry must all stay silent, or the gate would redden every
existing explore page and be turned off within a day.

Run:  PYTHONUTF8=1 python tools/tests/test_explore_entity_lede_authored.py"""
import importlib.util, json, sys, tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec); spec.loader.exec_module(inv)
res = []

def fcase(name, ents, claims, topics, grand, want_clean):
    with tempfile.TemporaryDirectory() as td:
        r = Path(td)
        (r / "dashboard" / "assets" / "data" / "search").mkdir(parents=True)
        (r / "tools" / "gate-fixtures").mkdir(parents=True)
        (r / "dashboard" / "assets" / "data" / "search" / "search-index.json").write_text(
            json.dumps({"entities": ents, "claims": claims}), encoding="utf-8")
        (r / "dashboard" / "assets" / "data" / "entity-copy.json").write_text(
            json.dumps({"essentials": {}, "conditions": {}, "topics": topics}), encoding="utf-8")
        (r / "tools" / "gate-fixtures" / "lede-backlog.json").write_text(
            json.dumps({"grandfathered": grand}), encoding="utf-8")
        real = inv.ROOT
        try:
            inv.ROOT = r; ok_flag, msg = inv.check_explore_entity_lede_authored()
        finally:
            inv.ROOT = real
    ok = ok_flag == want_clean
    print(f"  {'PASS' if ok else 'FAIL'}  {name:42s} want={'clean' if want_clean else 'RED':5s} "
          f"got={'clean' if ok_flag else 'RED':5s}  [{msg[:56]}]")
    res.append(ok)

# one explore entity (a concept) with a claim; vary lede / backlog / type.
TOPIC = {"cocoa_x": {"type": "concept"}}
CLM = [{"subject": "cocoa_x", "also_about": []}]
print("=" * 100); print("explore_entity_lede_authored"); print("=" * 100)
# LOAD-BEARING -- THE DEFECT: a new explore entity, no hand lede, not grandfathered.
fcase("new_explore_entity_no_lede_fires", TOPIC, CLM, {}, [], False)
# SPARING: a hand lede satisfies it.
fcase("hand_lede_spared", TOPIC, CLM, {"cocoa_x": {"lede": "A real header."}}, [], True)
# SPARING: the frozen backlog spares a pre-existing page.
fcase("grandfathered_spared", TOPIC, CLM, {}, ["cocoa_x"], True)
# a whitespace-only lede is NOT authored -> still RED.
fcase("blank_lede_fires", TOPIC, CLM, {"cocoa_x": {"lede": "   "}}, [], False)
# SPARING: an essential (type nutrient) renders the essential page, never in scope.
fcase("essential_ignored", {"calcium": {"type": "nutrient"}},
      [{"subject": "calcium", "also_about": []}], {}, [], True)
# SPARING: a condition renders the condition page, never in scope.
fcase("condition_ignored", {"osteoporosis": {"type": "condition"}},
      [{"subject": "osteoporosis", "also_about": []}], {}, [], True)
# SPARING: an explore entity with NO claim has an empty page, out of scope.
fcase("no_claim_ignored", TOPIC, [], {}, [], True)
# also_about-only membership still counts as an explore page needing a lede.
fcase("also_about_only_fires", TOPIC, [{"subject": "flavonoids", "also_about": ["cocoa_x"]}], {}, [], False)

print(); print("=" * 100); print("LIVE REPO"); print("=" * 100)
ok_flag, msg = inv.check_explore_entity_lede_authored()
print(f"  {'PASS' if ok_flag else 'FAIL'}  live_repo_clean   {msg}")
res.append(ok_flag)
print("-" * 100)
if not all(res):
    print(f"FAIL -- {sum(1 for r in res if not r)}/{len(res)} case(s) misbehaved."); sys.exit(1)
print(f"PASS -- all {len(res)} cases: a NEW explore entity with no hand lede is RED (the defect), "
      f"while an essential, a condition, a claimless page and the frozen backlog stay silent.")
