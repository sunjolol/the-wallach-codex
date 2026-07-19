#!/usr/bin/env python3
"""Negative test for dose_amount_in_verbatim (Charter R2 -- the claim->book link).

Proof artifact (§00.B "codify, don't promise" / R7). A gate that has never fired is a gate
trusted on faith. This drives _dose_amount_in_verbatim_impl directly with PLANTED in-memory
claims and asserts it REDDENS on the exact bugs it was written for -- starting with the one
PROVEN on real data 2026-07-15 before the gate existed:

    a 10x sodium fabrication (3,300 -> 33,000 mg) planted in the sealed shard passed the
    ENTIRE board green -- "all 38 numeric coverage target(s) trace to a Wallach dose claim
    AND recompute exactly from its documented transform chain (R2 clean)" -- while the
    claim's own verbatim still literally read "3,300 mg".

Every planted claim MIRRORS a real corpus shape but is self-contained, so the test cannot
rot if the real claim is edited or re-sealed.

THE THREE ADVERSARIAL BREAKS are each pinned below. They broke the FIRST design; do not
weaken the gate without re-running these:
  * CROSS_ROW    -- a verbatim span carries the next nutrient's row (37 of 86 real spans
                    name >1 nutrient), so presence-checking accepted a neighbour's number.
  * UNIT_SWAP    -- choline 600 mg re-tagged mcg (1000x UNDER-dose) passed off chromium's
                    "300 to 600 mcg". Adjacency-capture does NOT fix this (600 is adjacent
                    to both units); only ROW IDENTITY does.
  * COLUMN_BLEED -- the base-line row is NAME|RDA|need|pharmacologic and dose.amount is
                    column 1, so sodium 3,300 -> 1,100 is a 3x understatement that
                    presence-checking can never see.

CASE 'prose_not_table' is load-bearing in the opposite direction: it pins that hard-wrapped
PROSE is NOT row-sliced. An early design split on newlines and severed "Twenty to 30 mg ...
for\ngermanium." from its own subject, RED-boarding a perfectly good claim. Scoping may only
ever TIGHTEN a real table; when in doubt it must fall back to the full span.

CASE 'zero_unitless' pins the no-exception design. The original spec wanted a baseline
exception for the phosphorus-0 row; an adversary proved that would NEUTER THE WHOLE GATE
(.claude/invariant-baseline.json is INVARIANT-scoped -- stop_round_close.py::_tolerated
returns a set of invariant NAMES -- so one entry tolerates all 86 claims). Handled in-gate
instead, so this gate ships with ZERO exceptions.

Run:  PYTHONUTF8=1 python tools/test_dose_amount_in_verbatim.py

Exit 0 = every case behaves; non-zero = the gate stopped biting (a real regression)."""
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._dose_amount_in_verbatim_impl

# A self-contained canon slice: only the names the planted claims need.
CANON = {"essentials": [
    {"slug": "sodium",      "display_name": "Sodium",        "common_name": "Sodium"},
    {"slug": "sulfur",      "display_name": "Sulfur",        "common_name": "Sulfur"},
    {"slug": "choline",     "display_name": "Choline",       "common_name": "Choline"},
    {"slug": "chromium",    "display_name": "Chromium",      "common_name": "Chromium"},
    {"slug": "vitamin-c",   "display_name": "Ascorbic Acid", "common_name": "Vitamin C"},
    {"slug": "vitamin-d",   "display_name": "Cholecalciferol", "common_name": "Vitamin D"},
    {"slug": "vitamin-a",   "display_name": "Retinol",       "common_name": "Vitamin A"},
    {"slug": "vitamin-b12", "display_name": "Cobalamin",     "common_name": "Vitamin B12"},
    {"slug": "silver",      "display_name": "Silver",        "common_name": "Silver"},
    {"slug": "germanium",   "display_name": "Germanium",     "common_name": "Germanium"},
    {"slug": "phosphorus",  "display_name": "Phosphorus",    "common_name": "Phosphorus"},
    {"slug": "gold",        "display_name": "Gold",          "common_name": "Gold"},
]}

BASE = "base-line supplement program (true supplement need)"

# Real shapes, lifted faithfully from the sealed corpus (see each `mirrors` note).
VB_SODIUM = "SODIUM 1,100 mg 3,300 mg 300 to 3,000 mg\nSULPHUR ? 500 mg 1,000 mg"
VB_CHOLINE = "CHOLINE 150 mg 600 mg 500 to 1,000 mg\nCHROMIUM 50 mcg 200 mcg 300 to 600 mcg"
VB_VITC = "VITAMIN C 60 mg 1,000 mg 10,000 mg\nVITAMIN D 400 IU 275 IU 1,000 IU"
VB_VITA = ("Vitamin A (retinol) 2,500 - 5,000 IU\n"
           "Vitamin A (beta-carotene) 5,000 - 25,000 IU")
VB_PHOS = "PHOSPHORUS 800 mg 0.0 0.0"
# Fig. 8-1's VITAMIN A row, byte-faithful: the ONLY row in that table whose RDA cell is
# BLANK (confirmed against the printed page, 2026-07-19). Its two printed values are the
# true-supplement-need 5,000 IU and the pharmacologic 20,000-300,000 IU -- and its range
# REPEATS the unit, which used to split one column into two and make the row look full.
VB_VITA_BASELINE = "VITAMIN A 5,000 IU 20,000 IU - 300,000 IU (beta carotene)\nVITAMIN B-12 3 mcg 200 mcg 1,000 mcg"
VB_SILVER = ("Humans can\nconsume 400 mcg of silver per day. A silver “deficiency” "
             "results in an\nimpaired immune system.")
VB_GERM = ("Twenty to 30 mg per day is the recommended maintenance dose for\n"
           "germanium. Fifty to 100 mg per day doses are commonly used when an\n"
           "individual has a serious illness that requires an")
VB_GOLD = ("Standard doses are given IM at weekly intervals: 10 mg initially, 25 mg second "
           "week and 50 mg per week until a total of 1 G has been administered then the "
           "maintenance dose is reduced to 50 mg every two to four weeks.")


def claim(cid, ess, amount, unit, vb, fc=None, form=None):
    return {"id": cid, "essentials": ess, "verbatim": vb,
            "dose": {"amount": amount, "unit": unit, "period": "daily", "form": form,
                     "duration": None, "for_condition": fc}}


# (name, claim, must_be_green, why-this-case-exists)
CASES = [
    # --- POSITIVE pins: the gate must NOT false-fire on these real shapes -------------
    ("real_sodium", claim("T-NA", ["sodium"], 3300, "mg", VB_SODIUM, BASE), True,
     "mirrors WAL-CLM-LETS-000066 -- the true value at its true column"),
    ("prose_not_table", claim("T-GE", ["germanium"], "20-30", "mg", VB_GERM), True,
     "mirrors WAL-CLM-DDDL-000011 -- SPELLED-OUT numeral, and hard-wrapped PROSE that must "
     "NOT be row-sliced (a newline-split design severed the dose from 'germanium.' and "
     "RED-boarded this good claim)"),
    ("rule_b_schedule", claim("T-AU", ["gold"], "10/25/50", "mg", VB_GOLD), True,
     "mirrors WAL-CLM-RARE-000096 -- an escalating '/'-joined schedule scattered across "
     "prose; the ONLY Rule-B claim in the corpus"),
    ("zero_unitless", claim("T-P", ["phosphorus"], 0, "mg", VB_PHOS, BASE), True,
     "mirrors WAL-CLM-LETS-000061 -- Wallach recommends NO supplemental phosphorus and the "
     "0.0 columns are unitless. Handled IN-GATE (0 mg == 0 mcg), which is why this gate "
     "needs ZERO baseline exceptions -- an invariant-scoped exception would tolerate ALL 86"),
    ("comma_range", claim("T-VC", ["vitamin-c"], 1000, "mg", VB_VITC, BASE), True,
     "comma-thousands in the verbatim vs bare digits in the amount"),
    ("range_with_form", claim("T-VA", ["vitamin-a"], "2500-5000", "IU", VB_VITA,
                              "daily multiple", "retinol"), True,
     "mirrors WAL-CLM-EPIGEN-000110 -- two rows BOTH named 'Vitamin A'; only dose.form "
     "disambiguates"),

    # --- THE HEADLINE ----------------------------------------------------------------
    ("HEADLINE_10x", claim("T-NA", ["sodium"], 33000, "mg", VB_SODIUM, BASE), False,
     "THE case: the 10x fabrication that passed the whole board green on 2026-07-15"),

    # --- BREAK 1: cross-row bleed ----------------------------------------------------
    ("CROSS_ROW", claim("T-NA", ["sodium"], 500, "mg", VB_SODIUM, BASE), False,
     "sodium 'proven' by the SULPHUR row's 500 mg in the same span"),
    ("CROSS_ROW_b12", claim("T-VC", ["vitamin-c"], 400, "mg", VB_VITC, BASE), False,
     "vitamin C 'proven' by the VITAMIN D row"),

    # --- BREAK 2: unit swap ----------------------------------------------------------
    ("UNIT_SWAP_1000x", claim("T-CH", ["choline"], 600, "mcg", VB_CHOLINE, BASE), False,
     "choline 600 mg -> mcg: a 1000x UNDER-dose, passed off CHROMIUM's '300 to 600 mcg'. "
     "The invisible failure -- an understated target silently marks a user COVERED"),
    ("UNIT_SWAP_class", claim("T-VC", ["vitamin-c"], 1000, "IU", VB_VITC, BASE), False,
     "vitamin C mg -> IU off VITAMIN D's row: dimensionally nonsense, still certified"),
    ("UNIT_SWAP_safety", claim("T-AG", ["silver"], 400, "mg", VB_SILVER), False,
     "silver 400 mcg -> mg. THE project's own safety incident (memory: silver is 400 MCG, "
     "400 mg is toxic). Must never pass"),

    # --- BREAK 3: in-row column bleed ------------------------------------------------
    ("COLUMN_BLEED_rda", claim("T-NA", ["sodium"], 1100, "mg", VB_SODIUM, BASE), False,
     "sodium -> its OWN RDA column: a 3x understatement, in-row, invisible to presence"),
    ("COLUMN_BLEED_pharm", claim("T-NA", ["sodium"], 3000, "mg", VB_SODIUM, BASE), False,
     "sodium -> its OWN pharmacologic column"),
    ("COLUMN_BLEED_vita", claim("T-VA", ["vitamin-a"], "5000-25000", "IU", VB_VITA,
                                "daily multiple", "retinol"), False,
     "retinol -> the BETA-CAROTENE row's range. 25,000 appears ONLY in the neighbouring "
     "row, so this is true cross-row bleed. (An earlier version of this case used 5,000 "
     "and FAILED -- correctly: 5,000 is retinol's OWN range top. The gate was right and "
     "the test was wrong. Kept as a caution: pick a value that exists ONLY in the "
     "neighbour, or you are testing nothing.)"),
    # --- the 2026-07-19 UNDER-FILLED ROW refinement (R9) ------------------------------
    # Luneth ruled this three times and I reverted it twice, siding with a gate that was
    # MISPARSING the row. The printed page settled it: the RDA cell is blank, so 5,000 IU is
    # the true-supplement-need, not the RDA. Positional indexing read column 1 as 20,000 and
    # RED-flagged a true value.
    ("UNDERFILLED_true", claim("T-VAB", ["vitamin-a"], 5000, "IU", VB_VITA_BASELINE, BASE), True,
     "the real Fig. 8-1 VITAMIN A row: blank RDA cell, so the true-supplement-need IS 5,000 IU. "
     "Was RED before the fix -- the gate compared the wrong cell"),
    ("UNDERFILLED_fabricated", claim("T-VAB", ["vitamin-a"], 7500, "IU", VB_VITA_BASELINE, BASE),
     False,
     "THE OTHER HALF. A value that appears NOWHERE in that same under-filled row must still be "
     "caught. Without this case the suite would also pass a gate the refinement had blinded"),
    ("UNDERFILLED_neighbour", claim("T-VAB", ["vitamin-a"], 200, "mcg", VB_VITA_BASELINE, BASE),
     False,
     "cross-row bleed still blocked on an under-filled row: 200 mcg is the VITAMIN B-12 row's "
     "true-supplement-need, in the same span. Row scoping survives the fallback"),

    ("range_low_collapse", claim("T-VA", ["vitamin-a"], 2500, "IU", VB_VITA,
                                 "daily multiple", "retinol"), False,
     "retinol '2500-5000' collapsed to the scalar LOW end -- a real understatement, since "
     "targets_derive takes upper-of-range (5,000 -> 2,500). Caught because 2,500 is not "
     "unit-adjacent in '2,500 - 5,000 IU'. NB the HIGH-end collapse (-> 5000) is "
     "deliberately NOT pinned RED: it is unit-adjacent AND target-equivalent under "
     "upper-of-range, so it is not a defect."),

    # --- Regression pins -------------------------------------------------------------
    ("zero_not_800", claim("T-P", ["phosphorus"], 800, "mg", VB_PHOS, BASE), False,
     "phosphorus 0 -> its RDA column. Also pins the digit-boundary bug: without the "
     "(?<![\\d.]) lookarounds, `0\\s*mg` matched the trailing 0 of '800 mg' and this "
     "false-PASSED in the first prototype"),
    ("zero_not_999", claim("T-P", ["phosphorus"], 999, "mg", VB_PHOS, BASE), False,
     "an out-of-span fabrication in the zero row must still RED -- proving the in-gate "
     "zero handling did NOT become a blanket skip"),
    ("noncanonical", claim("T-NA", ["sodium"], "03300", "mg", VB_SODIUM, BASE), False,
     "a leading-zero amount must not Decimal-normalize into looking fine"),
    ("unknown_unit", claim("T-NA", ["sodium"], 3300, "cc", VB_SODIUM, BASE), False,
     "an unknown unit fails CLOSED, forcing the synonym table to be extended deliberately"),
]


def main():
    fails = []
    for name, c, want_green, why in CASES:
        ok, msg = impl([c], CANON)
        good = (ok == want_green)
        mark = "ok  " if good else "FAIL"
        print("%s %-18s expect=%-5s got=%-5s  %s"
              % (mark, name, "GREEN" if want_green else "RED",
                 "GREEN" if ok else "RED", msg[:78]))
        if not good:
            fails.append((name, why, msg))

    # The gate must also be green on the REAL sealed corpus, or it is unusable.
    import json
    canon = json.loads((ROOT / "eden/corpus/essentials-canon.json").read_text(encoding="utf-8"))
    claims = []
    for p in sorted((ROOT / "eden/corpus/claims").glob("*.json")):
        d = json.loads(p.read_text(encoding="utf-8"))
        claims.extend(d.get("claims", d) if isinstance(d, dict) else d)
    ok, msg = impl(claims, canon)
    print()
    print("%s real-corpus       expect=GREEN got=%-5s  %s"
          % ("ok  " if ok else "FAIL", "GREEN" if ok else "RED", msg[:78]))
    if not ok:
        fails.append(("real_corpus", "the gate must pass on the sealed corpus", msg))

    print()
    if fails:
        print("%d CASE(S) FAILED — the gate stopped biting:" % len(fails))
        for n, why, msg in fails:
            print("  %s: %s" % (n, why))
            print("     got: %s" % msg[:150])
        return 1
    print("all %d planted cases + the real corpus behave — the gate bites." % len(CASES))
    return 0


if __name__ == "__main__":
    sys.exit(main())
