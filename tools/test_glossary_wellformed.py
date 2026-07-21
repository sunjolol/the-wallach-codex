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

R9 REFINEMENT 2026-07-21 (Luneth's manual override + review): a number IS allowed
when the entry declares an ANCHORED `number_exempt` -- a reason + claim_ids that
resolve to sealed claims AND literally contain every digit-run in the definition.
The second block below pins that anchoring is NON-GAMEABLE: an entry may not (a)
carry a number with no exempt block, (b) cite an unresolved claim, (c) cite a claim
that does not contain the number, or (d) omit the reason. If any of those flips to
'allowed', the smuggling hole the gate exists to close is reopened.

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
exempt_valid = inv._glossary_number_exemption_valid


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

# ---------------------------------------------------------------------------
# R9 2026-07-21 -- the ANCHORED number_exempt block. A digit is allowed ONLY when the
# entry cites a sealed claim that literally contains it. Fake claim-run index so this
# drives _glossary_number_exemption_valid directly, no disk.
# ---------------------------------------------------------------------------
RUNS = {
    "WAL-CLM-RARE-000061": {"98", "8", "12"},        # colloidal 98% vs 8-12%
    "WAL-CLM-RARE-000071": {"60", "72", "3", "20"},  # glacial-milk 60-72 vs 3-20
}
GOOD_REASON = "Wallach's own figure, manually verified + ratified by Luneth; tooltip frozen."


def excase(label, entry, expect_ok):
    ok_actual, why = exempt_valid(entry, RUNS)
    ok = ok_actual == expect_ok
    print(f"  {'OK' if ok else 'FAIL'}  {label:<40}  expect_ok={expect_ok}  actual={ok_actual}  why={why!r}")
    return ok


print("-" * 100)
print("anchored number_exempt -- must ALLOW a cited+contained number, REFUSE everything else")

ex_cases = [
    # ALLOWED: number is cited and literally present in the cited claim.
    ("anchored_98_vs_8_12_passes",
     {"plain": "About 98% absorbed, versus only 8–12% as ground-up rock.",
      "number_exempt": {"reason": GOOD_REASON, "claim_ids": ["WAL-CLM-RARE-000061"]}}, True),
    ("anchored_60_72_vs_3_20_passes",
     {"plain": "Glacial milk holds 60–72 minerals while most hold only 3–20.",
      "number_exempt": {"reason": GOOD_REASON, "claim_ids": ["WAL-CLM-RARE-000071"]}}, True),
    # REFUSED: a number with no exempt block at all (the original smuggling threat).
    ("number_no_exempt_block_fails",
     {"plain": "About 98% absorbed."}, False),
    # REFUSED: cites a claim that does not exist -> cannot be anchored.
    ("unresolved_claim_fails",
     {"plain": "About 98% absorbed.",
      "number_exempt": {"reason": GOOD_REASON, "claim_ids": ["WAL-CLM-RARE-999999"]}}, False),
    # REFUSED: cites a REAL claim that does NOT contain the number (98 not in 071). Non-gameable.
    ("wrong_claim_missing_number_fails",
     {"plain": "About 98% absorbed.",
      "number_exempt": {"reason": GOOD_REASON, "claim_ids": ["WAL-CLM-RARE-000071"]}}, False),
    # REFUSED: no reason.
    ("empty_reason_fails",
     {"plain": "About 98% absorbed.",
      "number_exempt": {"reason": "  ", "claim_ids": ["WAL-CLM-RARE-000061"]}}, False),
    # REFUSED: no claim_ids.
    ("no_claim_ids_fails",
     {"plain": "About 98% absorbed.",
      "number_exempt": {"reason": GOOD_REASON, "claim_ids": []}}, False),
]

results += [excase(*c) for c in ex_cases]

# ---------------------------------------------------------------------------
# task_4ba8c8bd 2026-07-21 -- the term+alias KEY-SPACE collision guard. The runtime
# matcher (state/glossary.ts) folds term + every alias into ONE lowercased Map, so a
# repeated normalized key is a SILENT last-write-wins override, not a harmless dup. The
# OLD check only saw term-vs-term and missed all four real collisions (an alias == another
# entry's term made a dedicated 'myelosclerosis' definition dead; meq/l, Supralife, glacial
# milk were aliases == their own term). These cases pin that the full key-space is guarded.
# ---------------------------------------------------------------------------
collide = inv._glossary_key_collisions

print("-" * 100)
print("term+alias key-space -- every normalized key GLOBALLY unique (no silent Map override)")


def kcase(label, terms, expect_clean):
    probs = collide(terms)
    clean = (len(probs) == 0)
    ok = clean == expect_clean
    print(f"  {'OK' if ok else 'FAIL'}  {label:<44}  expect_clean={expect_clean}  problems={probs}")
    return ok


k_cases = [
    # CLEAN: distinct terms + distinct aliases -> no problems (the post-fix glossary shape).
    ("distinct_terms_and_aliases_clean",
     [{"term": "mEq/L", "aliases": ["meq"]},
      {"term": "myelosclerosis"},
      {"term": "myelofibrosis", "aliases": []}], True),
    # THE REAL BUG: an alias equals ANOTHER entry's term -> silent override, MUST trip.
    ("alias_equals_other_term_trips",
     [{"term": "myelosclerosis"},
      {"term": "myelofibrosis", "aliases": ["myelosclerosis"]}], False),
    # REDUNDANT self-alias: alias == own term's lowercase -> dead weight, MUST trip.
    ("self_alias_lowercase_trips",
     [{"term": "Glacial Milk", "aliases": ["glacial milk"]}], False),
    # Two entries sharing the SAME alias -> collision, MUST trip.
    ("shared_alias_across_entries_trips",
     [{"term": "alpha", "aliases": ["shared"]},
      {"term": "beta", "aliases": ["shared"]}], False),
    # term-vs-term duplicate is STILL caught (the old check's job, now subsumed).
    ("duplicate_term_still_trips",
     [{"term": "arthritis"}, {"term": "Arthritis"}], False),
    # case-insensitive: 'SupraLife' term vs 'supralife' alias collide.
    ("case_insensitive_collision_trips",
     [{"term": "SupraLife", "aliases": ["supralife"]}], False),
]

results += [kcase(*c) for c in k_cases]

failures = sum(1 for r in results if not r)
print("-" * 100)
if failures:
    print(f"FAIL -- {failures}/{len(results)} case(s) misbehaved.")
    sys.exit(1)
print(f"PASS -- every one of {len(results)} case(s) behaves; the gate catches unanchored health "
      f"numbers, permits historical dates, allows ONLY cited+contained numbers, and rejects term/alias key collisions.")
