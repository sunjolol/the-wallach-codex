"""Negative test for verbatim_no_transcription_scaffolding.

A gate that has never been seen to FAIL proves nothing (memory: negative-control-or-it-proves-
nothing). Each case below plants one defect and asserts the detector fires, or plants a lookalike
and asserts it does NOT.

The sparing cases matter as much as the firing ones: this gate deliberately does not police asterisk
or underscore rules, because a printed page can carry those legitimately.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import invariants as INV  # noqa: E402


def fires(text):
    return any(rx.search(text) for _, rx in INV._SCAFFOLDING)


CASES = [
    # --- must FIRE: real scaffolding, all four shapes, incl. the exact strings found in the wild ---
    (True, "the harness frame name that shipped in EPIGEN-000124",
     "Choline 10 - 100 mg\nInositol 10 - 100 mg\n\n===== Screenshot (675) -- Page 818 of 936 ====="),
    (True, "the shorter form that shipped in IMMORT-000230",
     "Goiter\n\n===== Screenshot (94) =====\n \n\n\nMany foods and food additives"),
    (True, "bare Screenshot frame with no separator rule",
     "some quoted text Screenshot (12) more quoted text"),
    (True, "Screenshot with a space before the paren",
     "quoted text Screenshot  (7) tail"),
    (True, "bare reader page readout",
     "minerals are the currency of life Page 42 of 936 and the medical profession"),
    (True, "bare equals rule, three is enough",
     "first line\n===\nsecond line"),
    (True, "long equals rule",
     "first line\n==========\nsecond line"),
    (True, "kindle-style location marker",
     "text <Page 7 of 936 | Location 88 of 14342> text"),
    (True, "scaffolding at the very start of a verbatim",
     "===== Screenshot (1) ===== leading text"),
    (True, "scaffolding at the very end of a verbatim",
     "trailing text ===== Screenshot (999) ====="),

    # --- must NOT fire: legitimate printed content and near-misses ---
    (False, "an ordinary quote", "Simply said, minerals are the currency of life."),
    (False, "a double equals is not a rule (arithmetic / typography)", "a == b in the source"),
    (False, "an asterisk rule -- DELIBERATELY spared, a page can print one",
     "first line\n******\nsecond line"),
    (False, "an underscore rule -- DELIBERATELY spared, a page can print a blank",
     "Name: _________ Date: _________"),
    (False, "a dash rule -- not one of the four shapes",
     "first line\n--------\nsecond line"),
    (False, "the word screenshot without a frame number",
     "he took a screenshot of the label"),
    (False, "'page 42' without the 'of N' readout",
     "as described on page 42 of the appendix is fine only if no digits follow 'of'"),
    (False, "a real dose line with numbers that could look like a readout",
     "vitamin E at 800-1,200 IU per day and selenium at 200 mcg t.i.d."),
    (False, "a table row with many numbers",
     "Baby food, (peaches) 6,257\nBaby food, (apple/blueberry) 4,822"),
    (False, "an element list", "Beryllium Hydrogen\nBoron Iodine\nBromine Iron"),
]

fail = 0
for want, why, text in CASES:
    got = fires(text)
    ok = got == want
    if not ok:
        fail += 1
    print(f"  {'OK  ' if ok else 'FAIL'} expect_fire={str(want):5s} got={str(got):5s}  {why}")

# --- and the live corpus must be clean ---
ok, msg = INV.check_verbatim_no_transcription_scaffolding()
print(f"  {'OK  ' if ok else 'FAIL'} live corpus clean: {msg[:140]}")
if not ok:
    fail += 1

print()
print(f"{len(CASES) + 1 - fail}/{len(CASES) + 1} passed")
sys.exit(1 if fail else 0)
