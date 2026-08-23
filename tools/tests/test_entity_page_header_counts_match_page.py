#!/usr/bin/env python3
"""Negative test for entity_page_header_counts_match_page.

Proof artifact: the gate must GREEN on the real generated artifact (every hero's "N claims -
M books" describes the claims that page renders) and REDDEN on each way the numbers can drift
away from the page:

  (1) the count says fewer claims than the page shows  -- the SHIPPED defect: memory_loss
      advertised "4 claims" over 34 cards, because the hero read the role-mapped claim_count
      instead of distinct_claim_count;
  (2) the count says more claims than the page shows;
  (3) the book list omits a book the page's own claims cite -- memory_loss said 3 books over
      cards from 5;
  (4) the book list names a book none of the page's claims cite.

A gate that has never been shown to fail is not evidence, so each case is driven through
_entity_page_header_counts_match_page_impl with a tampered copy of the real artifact. Run:

    PYTHONUTF8=1 python tools/tests/test_entity_page_header_counts_match_page.py

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
impl = inv._entity_page_header_counts_match_page_impl

art = json.loads(ARTIFACT.read_text(encoding="utf-8"))
claims = json.loads(EMBED.read_text(encoding="utf-8")).get("claims", {})

failures = []

# (0) GREEN on the real, freshly-derived artifact.
ok, msg = impl(art, claims)
if not ok:
    failures.append(f"expected GREEN on real artifact, got RED: {msg}")

def a_condition_with_claims():
    """A condition whose page renders at least two claims from at least two books."""
    for slug, rec in art.get("conditions", {}).items():
        shown = set()
        for key in ("record", "search"):
            for sec in rec.get(key, []):
                shown.update(sec.get("claim_ids", []))
        books = {claims.get(cid, {}).get("book") for cid in shown}
        books.discard(None)
        if len(shown) >= 2 and len(books) >= 2:
            return slug
    return None

slug = a_condition_with_claims()
if slug is None:
    failures.append("fixture: no condition renders 2+ claims from 2+ books")
else:
    # (1) UNDERCOUNT -- the exact shape of the shipped defect.
    t = copy.deepcopy(art)
    t["conditions"][slug]["distinct_claim_count"] -= 1
    ok, msg = impl(t, claims)
    if ok:
        failures.append("expected RED when the hero undercounts the page's claims, got GREEN")
    elif slug not in msg:
        failures.append(f"RED message should name the offending condition {slug!r}: {msg}")

    # (2) OVERCOUNT -- a hero promising claims that are not there.
    t = copy.deepcopy(art)
    t["conditions"][slug]["distinct_claim_count"] += 1
    ok, _ = impl(t, claims)
    if ok:
        failures.append("expected RED when the hero overcounts the page's claims, got GREEN")

    # (3) MISSING BOOK -- the second half of the shipped defect.
    t = copy.deepcopy(art)
    t["conditions"][slug]["books"] = t["conditions"][slug]["books"][:-1]
    ok, _ = impl(t, claims)
    if ok:
        failures.append("expected RED when the hero omits a book its claims cite, got GREEN")

    # (4) PHANTOM BOOK -- a book no claim on the page comes from.
    t = copy.deepcopy(art)
    t["conditions"][slug]["books"] = sorted(t["conditions"][slug]["books"] + ["no-such-book"])
    ok, _ = impl(t, claims)
    if ok:
        failures.append("expected RED when the hero names a book no claim cites, got GREEN")

# (5) The gate must watch ESSENTIALS too, not only conditions.
ess = next(iter(art.get("essentials", {})), None)
if ess is None:
    failures.append("fixture: no essential pages in the artifact")
else:
    t = copy.deepcopy(art)
    t["essentials"][ess]["distinct_claim_count"] += 7
    ok, msg = impl(t, claims)
    if ok:
        failures.append("expected RED when an ESSENTIAL hero miscounts, got GREEN")
    elif ess not in msg:
        failures.append(f"RED message should name the offending essential {ess!r}: {msg}")

if failures:
    print("FAIL entity_page_header_counts_match_page negative test:")
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("OK  entity_page_header_counts_match_page: GREEN on real; RED on undercount, overcount, "
      "missing book, phantom book, and on essentials as well as conditions")
