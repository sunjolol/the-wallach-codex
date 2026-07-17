#!/usr/bin/env python3
"""Negative test for glossary_wellformed (§00.B "codify, don't promise" / R7 · R9).

The gate's digit-check was tightened 2026-07-17 so historical dates (1997, 1980s,
"June 15, 1997") pass while HEALTH numbers (500mg, 60%, 1500 IU) still trip. This
extension exists because the Mineral-Toddy / SupraLife / Rockland lineage glossary
entries legitimately reference product-lineage YEARS. Without a negative test, the
looser regex could quietly stop biting the real threat -- a smuggled dose in a
plain-language definition.

CASE 'health_500mg_trips' is the load-bearing one: it re-proves the ORIGINAL bug
the check was written for. If that case ever flips green, the gate has stopped
enforcing §00.A and the glossary is a backdoor for undocumented health claims.

Run:  PYTHONUTF8=1 python tools/test_glossary_wellformed.py
Exit 0 = every case behaves; non-zero = the gate stopped biting."""
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)

# The tightened check is exposed as a module-level helper so this test drives it
# directly (no need to plant a fake glossary.json on disk).
check = inv._glossary_definition_has_smuggled_number


def case(label, plain, expect_flagged):
    actual = check(plain)
    ok = actual == expect_flagged
    print(f"  {'OK' if ok else 'FAIL'}  {label:<40}  input={plain!r:<70}  expect={expect_flagged}  actual={actual}")
    return ok


print("test_glossary_wellformed -- tightened digit check (R9)")
print("-" * 100)

cases = [
    # HEALTH numbers -- MUST trip. The load-bearing evidence the gate still enforces the §00.A intent.
    ("health_500mg_trips",         "Take 500mg of calcium daily.",                                      True),
    ("health_percent_trips",       "Absorbable up to 60% via the small intestine.",                    True),
    ("health_iu_trips",            "The Wallach target is 1500 IU per day.",                            True),
    ("health_g_per_day_trips",     "He recommends 9g of essential fatty acids per day.",                True),
    ("health_mcg_trips",           "400 mcg is the maintenance dose.",                                  True),
    ("health_no_units_trips",      "Aim for 100 to 200 per day.",                                       True),
    # HISTORICAL dates -- MUST pass. Legitimate for product-history entries.
    ("year_1997_passes",           "Wallach founded American Longevity in 1997.",                       False),
    ("year_1998_passes",           "Renamed itself SupraLife International in 1998.",                   False),
    ("decade_1980s_passes",        "Historical name from the 1980s.",                                   False),
    ("decade_90s_passes",          "Sold from the 1980s and 90s.",                                      False),
    ("full_date_passes",           "First commissions paid June 15, 1997.",                             False),
    ("year_range_passes",          "1980s-90s: the Rockland era.",                                      False),
    ("year_with_month_passes",     "In December 1998 the arbitration ruled for Wallach.",               False),
    # NON-numeric definitions -- MUST pass. Baseline sanity.
    ("plain_definition_passes",    "The historical manufacturer of Mineral Toddy.",                    False),
    # ADVERSARIAL edge -- a real-looking dose that HAPPENS to be near year-shaped: 1500 does not
    # match 19XX/20XX so it still trips. Guard against a future loosening that would let it through.
    ("year_shaped_dose_trips",     "Wallach's IU target sits at 1500.",                                 True),
]

results = [case(*c) for c in cases]
failures = sum(1 for r in results if not r)
print("-" * 100)
if failures:
    print(f"FAIL -- {failures}/{len(cases)} case(s) misbehaved.")
    sys.exit(1)
print(f"PASS -- every one of {len(cases)} case(s) behaves; the gate still catches health numbers AND permits historical dates.")
