#!/usr/bin/env python3
"""Negative test for food_nutrient_slugs_reach_coverage.

Proof artifact: the gate must GREEN on the real three artifacts and REDDEN on each way the food
catalog and the essentials registry can stop speaking the same language.

WHY THIS ONE MATTERS. The defect it guards was invisible on every surface the project already
watches. The board was green, tsc was clean, every render probe passed, and the app looked
perfect — while nine nutrient slugs (every hyphenated vitamin, 154 rows) were being dropped by a
`continue` with no error. It surfaced only because a user noticed that adding spinach did not
move the vitamin K bar its own card said was 296% full. A gate whose defect class is SILENT has
to be shown failing, or it is a comment.

★ THE TAMPERING IS DERIVED from whatever the real files currently say, never hardcoded. It picks
a slug that exists TODAY and breaks the link to it; if the catalog is re-derived tomorrow the
test still tests something.

Run:  PYTHONUTF8=1 python tools/tests/test_food_nutrient_slugs.py
Exit 0 = the gate behaves; non-zero = it stopped biting."""
import copy
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "dashboard" / "assets" / "data"

spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
sys.modules["invariants"] = inv
spec.loader.exec_module(inv)
impl = inv._food_nutrient_slugs_reach_coverage_impl

foods = json.loads((DATA / "foods-composition-data.json").read_text(encoding="utf-8"))
ess = json.loads((DATA / "essentials-targets-data.json").read_text(encoding="utf-8"))
res = json.loads((DATA / "nutrient-resolver-data.json").read_text(encoding="utf-8"))

fails = []


def case(label, ok_expected, f, e, r):
    ok, msg = impl(f, e, r)
    good = (ok == ok_expected)
    print(f"{'ok  ' if good else 'FAIL'} {label}\n       -> {ok} · {msg[:120]}")
    if not good:
        fails.append(label)


# 1 — the real artifacts must be GREEN.
case("the shipped artifacts pass", True, foods, ess, res)

# Pick a slug the catalog actually uses, preferring one carried by many foods.
rows = foods.get("foods") or foods.get("items") or []
counts = {}
for fd in rows:
    for n in fd.get("nutrients", []):
        s = str(n.get("slug", ""))
        if s:
            counts[s] = counts.get(s, 0) + 1
victim = max(counts, key=lambda s: counts[s])
print(f"\n   tampering with '{victim}' ({counts[victim]} rows) — derived, not hardcoded\n")

# 2 — THE EXACT DEFECT: the essentials registry no longer carries that slug, and the resolver
#     has no display-name alias that reaches it either. Every row carrying it goes silently
#     unscored — which is what shipped.
e2 = copy.deepcopy(ess)
e2["essentials"] = [x for x in e2["essentials"] if x.get("slug") != victim]
r2 = copy.deepcopy(res)
for key in ("vitamin_aliases", "mineral_names", "mineral_aliases", "amino_names"):
    r2[key] = {k: v for k, v in r2.get(key, {}).items() if v != victim}
r2["fatty_acid_patterns"] = [p for p in r2.get("fatty_acid_patterns", []) if p[0] != victim]
case("a slug the catalog uses vanishes from the essentials registry", False, foods, e2, r2)

# 3 — the food catalog is re-derived with a slug spelling nothing else knows.
f3 = copy.deepcopy(foods)
for fd in (f3.get("foods") or f3.get("items") or []):
    for n in fd.get("nutrients", []):
        if n.get("slug") == victim:
            n["slug"] = victim + "-renamed"
case("the catalog renames a slug out from under the registry", False, f3, ess, res)

# 4 — the resolver map is emptied. Slugs that ARE canon still pass (coverage scores them
#     directly), so this must stay GREEN: the gate must not demand a resolver entry for a name
#     that never needed resolving. A gate that reddens here would be testing the wrong thing.
r4 = {"vitamin_aliases": {}, "mineral_names": {}, "mineral_aliases": {}, "amino_names": {},
      "fatty_acid_patterns": [], "omega_digit_pattern": res.get("omega_digit_pattern", "")}
case("an empty resolver map does NOT redden it (canon slugs need no resolving)", True, foods, ess, r4)

# 5 — an empty catalog is a broken input, not a pass.
case("an empty food catalog reddens rather than vacuously passing", False,
     {"foods": []}, ess, res)

print("\nPASS — the gate bites" if not fails else "\nFAILED: " + "; ".join(fails))
sys.exit(0 if not fails else 1)
