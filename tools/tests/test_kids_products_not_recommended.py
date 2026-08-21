#!/usr/bin/env python3
"""test_kids_products_not_recommended.py — NEGATIVE test for the kids-exclusion gate.

A gate that has never been SEEN to fail is theater. This plants each defect the gate claims to
catch and asserts RED, then asserts GREEN on the real files. Run:

    PYTHONUTF8=1 python tools/tests/test_kids_products_not_recommended.py

WHY EACH CASE EXISTS (every one is a real, SILENT failure mode — none of them shows on screen;
the app just quietly starts recommending kids formulas to adults again):
   1  missing list          -> the exclusion cannot be enforced at all.
   2  empty `excluded`      -> FAILS OPEN. An empty list is indistinguishable from a working
                              one, and un-excludes every kids product while looking healthy.
   3  unknown product_id    -> ★ THE TYPO CASE. A mistyped id silently un-excludes exactly one
                              kids product. Nothing anywhere goes red; it just comes back.
   4  duplicate id          -> a list that has been hand-edited carelessly; cheap to catch.
   5  blank product_id      -> ditto, and it would match nothing.
   6  rankSources unfiltered-> ★ THE REGRESSION CASE. The exclusion is a read-time filter, so it
                              is one refactor from vanishing. This is what the gate is FOR.
   7  no import at all      -> the wiring was removed wholesale.
   8  essentialSlugs FILTERS-> ★ THE OVER-FIX. Someone "makes it consistent" and filters the
                              Products-TAB path too, hiding kids products from the database
                              they are meant to stay discoverable in. Both directions are
                              defects; a gate that only checked one half would bless this.
   9  brace-swallow         -> ★ THE SCAN-SHAPE CASE (same lesson as regimen_state_mutation_routing).
                              The filter EXISTS in the file, but in a NEIGHBOURING function, not
                              in rankSources. A naive line-window scan passes this; brace-aware
                              body matching must not.
  10  anti-vacuity          -> no excluded id is a live candidate, so the filter filters nothing
                              and the gate would certify a dead branch as green.
  11  synthetic-clean world -> the assembled-good fixture must be GREEN, or every RED above is
                              meaningless.
  12  the REAL files        -> must be GREEN, or the gate is useless.
"""
import importlib.util
import json
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("inv", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)

FAILS = []

# ── Synthetic fixtures ─────────────────────────────────────────────────────────
EXCL_OK = {"excluded": [
    {"product_id": "kids-toddy", "evidence": "age-banded label"},
    {"product_id": "cheri-mins", "evidence": "kid-marketed copy"},
]}
PILLAR_OK = {"products": {"kids-toddy": {}, "cheri-mins": {}, "plant-derived-minerals": {}}}
RECDATA_OK = {"essentials": {
    "calcium": {"candidates": [{"product_id": "kids-toddy"}, {"product_id": "plant-derived-minerals"}]},
    "sodium": {"candidates": [{"product_id": "cheri-mins"}]},
}}

SRC_OK = """
import { isExcludedFromRecommendations } from './kids-exclusion.js';
export function rankSources(slug) {
  const candidates = entry.candidates.filter(c => !isExcludedFromRecommendations(c.product_id));
  return candidates;
}
export function essentialSlugsByProduct() {
  const m = new Map();
  return m;
}
"""
# 6: the filter is gone from rankSources (the plain regression).
SRC_UNFILTERED = """
import { isExcludedFromRecommendations } from './kids-exclusion.js';
export function rankSources(slug) {
  const candidates = entry.candidates;
  return candidates;
}
export function essentialSlugsByProduct() {
  const m = new Map();
  if (isExcludedFromRecommendations('x')) { return m; }
  return m;
}
"""
# 7: no wiring at all.
SRC_NOIMPORT = """
export function rankSources(slug) { return entry.candidates; }
export function essentialSlugsByProduct() { return new Map(); }
"""
# 8: the over-fix — the Products-tab path filters too.
SRC_OVERFIX = """
import { isExcludedFromRecommendations } from './kids-exclusion.js';
export function rankSources(slug) {
  const candidates = entry.candidates.filter(c => !isExcludedFromRecommendations(c.product_id));
  return candidates;
}
export function essentialSlugsByProduct() {
  const m = new Map();
  for (const c of all) {
    if (isExcludedFromRecommendations(c.product_id)) { continue; }
    m.set(c.product_id, []);
  }
  return m;
}
"""
# 9: the swallow guard — the filter is in a NEIGHBOURING function, never in rankSources.
#    A "read the next 12 lines after the header" scan would call this green.
SRC_SWALLOW = """
import { isExcludedFromRecommendations } from './kids-exclusion.js';
export function rankSources(slug) {
  const candidates = entry.candidates;
  return candidates;
}
export function someOtherHelper(c) {
  return !isExcludedFromRecommendations(c.product_id);
}
export function essentialSlugsByProduct() {
  return new Map();
}
"""


def run(name, excl, pillar, src, recdata, want_red):
    with tempfile.TemporaryDirectory() as td:
        d = Path(td)
        ep = d / "kids-exclusion.json"
        pp = d / "products.json"
        sp = d / "recommender.ts"
        rp = d / "rec-data.json"
        if excl is not None:
            ep.write_text(json.dumps(excl), encoding="utf-8")
        pp.write_text(json.dumps(pillar), encoding="utf-8")
        sp.write_text(src, encoding="utf-8")
        rp.write_text(json.dumps(recdata), encoding="utf-8")
        ok, msg = inv._kids_products_not_recommended_impl(ep, pp, sp, rp)
    red = not ok
    verdict = "PASS" if red == want_red else "FAIL"
    if red != want_red:
        FAILS.append(name)
    print(f"  {verdict}  {name}\n         -> {'RED' if red else 'GREEN'}: {msg[:108]}")


print("kids_products_not_recommended — negative test\n")

run("1  missing kids-exclusion.json", None, PILLAR_OK, SRC_OK, RECDATA_OK, True)
run("2  empty `excluded` list (FAILS OPEN)", {"excluded": []}, PILLAR_OK, SRC_OK, RECDATA_OK, True)
run("3  ★ unknown product_id (the typo that un-excludes)",
    {"excluded": [{"product_id": "kids-toddyy", "evidence": "x"}]}, PILLAR_OK, SRC_OK, RECDATA_OK, True)
run("4  duplicate product_id",
    {"excluded": [{"product_id": "kids-toddy", "evidence": "x"},
                  {"product_id": "kids-toddy", "evidence": "y"}]}, PILLAR_OK, SRC_OK, RECDATA_OK, True)
run("5  blank product_id",
    {"excluded": [{"product_id": "", "evidence": "x"}]}, PILLAR_OK, SRC_OK, RECDATA_OK, True)
run("6  ★ rankSources no longer filters (the regression)",
    EXCL_OK, PILLAR_OK, SRC_UNFILTERED, RECDATA_OK, True)
run("7  no isExcludedFromRecommendations wiring at all",
    EXCL_OK, PILLAR_OK, SRC_NOIMPORT, RECDATA_OK, True)
run("8  ★ over-fix: essentialSlugsByProduct filters (hides the DB)",
    EXCL_OK, PILLAR_OK, SRC_OVERFIX, RECDATA_OK, True)
run("9  ★ swallow guard: filter is in a NEIGHBOURING fn, not rankSources",
    EXCL_OK, PILLAR_OK, SRC_SWALLOW, RECDATA_OK, True)
run("10 anti-vacuity: no excluded id is a live candidate",
    EXCL_OK, PILLAR_OK, SRC_OK,
    {"essentials": {"calcium": {"candidates": [{"product_id": "plant-derived-minerals"}]}}}, True)
run("11 synthetic-clean world must be GREEN", EXCL_OK, PILLAR_OK, SRC_OK, RECDATA_OK, False)

# ── The real files ─────────────────────────────────────────────────────────────
ok, msg = inv.check_kids_products_not_recommended()
verdict = "PASS" if ok else "FAIL"
if not ok:
    FAILS.append("12 the REAL repo files")
print(f"  {verdict}  12 the REAL repo files\n         -> {'GREEN' if ok else 'RED'}: {msg[:108]}")

print()
if FAILS:
    print(f"FAILED ({len(FAILS)}): {', '.join(FAILS)}")
    sys.exit(1)
print("all 12 cases behaved as specified — the gate catches every defect it claims to")
