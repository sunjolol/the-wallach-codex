#!/usr/bin/env python3
"""Negative test for search_index_wellformed (Search G-7 faceted-template gate).

Proof artifact (§00.B "codify, don't promise" / stop-the-leak-before-building): the gate must
GREEN on the real enrichment AND REDDEN on every class of poison it exists to catch. Drives
eden/tools/search_index_derive.validate() directly with tampered IN-MEMORY copies of the real
enrichment/registry (validate() takes them as params), so it can never go stale vs the live gate.
Run:

    PYTHONUTF8=1 python tools/test_search_index_wellformed.py

Exit 0 = every case behaves; non-zero = the gate stopped biting (a real regression)."""
import copy
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "eden" / "tools"))

spec = importlib.util.spec_from_file_location("search_index_derive", ROOT / "eden" / "tools" / "search_index_derive.py")
sid = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sid)

# Live source snapshots (the real data the gate validates).
ENR = sid._load("eden/corpus/search-enrichment.json")["enrichment"]
REG = sid._load("eden/catalog/search-entities.json")["entities"]
CANON = sid._canon()
CLAIMS = sid._claims_by_id()

A_CLAIM = "WAL-CLM-IMMORT-000062"   # a real calcium enrichment entry
results = []


def case(label, mutate_enr=None, mutate_reg=None, needle=None):
    enr = copy.deepcopy(ENR)
    reg = copy.deepcopy(REG)
    if mutate_enr:
        mutate_enr(enr)
    if mutate_reg:
        mutate_reg(reg)
    errs = sid.validate(enr, reg, CANON, CLAIMS)
    red = len(errs) > 0
    hit = needle is None or any(needle.lower() in e.lower() for e in errs)
    ok = red and hit
    print(f"  [{label}] expect RED -> {'RED' if red else 'GREEN'} | needle {needle!r} matched: {hit}")
    if not ok:
        print(f"    FAIL: errs={errs}")
    results.append(ok)


# 0) POSITIVE — the real data must be clean (the gate greens on truth, not just reds on poison).
_pos = sid.validate(ENR, REG, CANON, CLAIMS)
print(f"  [positive/real-data] expect GREEN -> {'GREEN' if not _pos else 'RED'}")
if _pos:
    print(f"    FAIL: {_pos}")
results.append(not _pos)

# 1) bad facet -> not in the closed taxonomy
case("bad-facet", mutate_enr=lambda e: e[A_CLAIM].__setitem__("facet", "vibes"), needle="taxonomy")
# 2) subject resolves to nothing
case("unresolved-subject", mutate_enr=lambda e: e[A_CLAIM].__setitem__("subject", "unobtanium"), needle="subject")
# 3) also_about resolves to nothing
case("unresolved-also_about", mutate_enr=lambda e: e[A_CLAIM].__setitem__("also_about", ["florbium"]), needle="also_about")
# 4) missing authored field (empty question)
case("empty-question", mutate_enr=lambda e: e[A_CLAIM].__setitem__("question", "  "), needle="question")
# 5) enrichment points at a claim id that does not exist
case("ghost-claim", mutate_enr=lambda e: e.__setitem__("WAL-CLM-NOPE-999999", copy.deepcopy(e[A_CLAIM])), needle="does not exist")
# 6) registry canon_ref that hand-stores a display_name (no_hand_duplicated_canonical)
case("canon_ref-with-name", mutate_reg=lambda r: r["calcium"].__setitem__("display_name", "Calcium"), needle="display_name")
# 7) registry canon_ref pointing at a non-canon slug
case("canon_ref-not-canon", mutate_reg=lambda r: r.__setitem__("florbium", {"canon_ref": True, "type": "nutrient", "synonyms": [], "related": []}), needle="canon")
# 8) registry catalog_ref (condition) that hand-stores a display_name (no dup)
case("catalog_ref-with-name", mutate_reg=lambda r: r["diabetes"].__setitem__("display_name", "Diabetes"), needle="display_name")
# 9) registry catalog_ref pointing at a slug that is not a catalog condition
case("catalog_ref-not-condition", mutate_reg=lambda r: r.__setitem__("florbium", {"catalog_ref": True, "type": "condition", "synonyms": [], "related": []}), needle="catalog")

passed = sum(results)
total = len(results)
print(f"\n{passed}/{total} cases behaved as expected")
sys.exit(0 if passed == total else 1)
