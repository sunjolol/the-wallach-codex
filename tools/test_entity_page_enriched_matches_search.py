#!/usr/bin/env python3
"""Negative test for entity_page_enriched_matches_search.

Proof artifact: the gate must GREEN on the real generated artifact (every condition/essential
page lists exactly the enriched claims search finds for it) and REDDEN when the two derivations
drift -- a claim search surfaces that the page drops (the "search > page" defect that this gate
exists to kill), or a claim the page lists that search cannot reach. Drives
_entity_page_enriched_matches_search_impl with tampered copies of the real artifact. Run:

    PYTHONUTF8=1 python tools/test_entity_page_enriched_matches_search.py

Exit 0 = every case behaves; non-zero = the gate stopped biting."""
import copy
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ARTIFACT = ROOT / "dashboard" / "assets" / "data" / "entity-page-data.json"
INDEX = ROOT / "dashboard" / "assets" / "data" / "search" / "search-index.json"

spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._entity_page_enriched_matches_search_impl

art = json.loads(ARTIFACT.read_text(encoding="utf-8"))
idx = json.loads(INDEX.read_text(encoding="utf-8"))

failures = []

# (0) GREEN on the real, freshly-derived artifact.
ok, msg = impl(art, idx)
if not ok:
    failures.append(f"expected GREEN on real artifact, got RED: {msg}")

def a_condition_with_search():
    for slug, rec in art.get("conditions", {}).items():
        for sec in rec.get("search", []):
            if sec.get("claim_ids"):
                return slug, sec["facet"], sec["claim_ids"][0]
    return None

pick = a_condition_with_search()
if pick is None:
    failures.append("fixture: no condition has an enriched claim to tamper with")
else:
    slug, facet, cid = pick

    # (1) MISSING: drop a claim the page shows (and search finds) -> RED (subset / search>page).
    tampered = copy.deepcopy(art)
    for sec in tampered["conditions"][slug]["search"]:
        if sec["facet"] == facet:
            sec["claim_ids"] = [x for x in sec["claim_ids"] if x != cid]
    ok, msg = impl(tampered, idx)
    if ok:
        failures.append("expected RED when a searchable claim is dropped from the page, got GREEN")
    elif slug not in msg:
        failures.append(f"RED message should name the offending condition {slug!r}: {msg}")

    # (2) EXTRA: add a claim id search cannot reach -> RED (superset).
    tampered2 = copy.deepcopy(art)
    tampered2["conditions"][slug]["search"][0]["claim_ids"].append("WAL-CLM-FAKE-999999")
    ok, msg = impl(tampered2, idx)
    if ok:
        failures.append("expected RED when a non-searchable claim is on the page, got GREEN")

if failures:
    print("FAIL entity_page_enriched_matches_search negative test:")
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("OK  entity_page_enriched_matches_search: GREEN on real; RED on missing (search>page) + RED on extra")
