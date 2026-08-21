#!/usr/bin/env python3
"""Negative test for term_gloss_ratified_present (§00.B "codify, don't promise").

The gate exists because check_claim_text_term_gloss guards ONE direction -- the superseded
form reappearing -- and is blind to the ratified gloss being REMOVED. Measured 2026-07-18:
two pending audit fixes proposed exactly that, and neither tripped the old gate, because its
literal FROM-key match misses near-variants. Both would have landed on a fully green board.

CASES 'epigen_097_hickory_stripped' and 'lets_253_horseweed_stripped' are the load-bearing
ones: they are the VERBATIM proposed_edit text of those two real fixes. If either ever flips
silent, the gate has stopped catching the exact defect it was built for.

The sparing cases matter just as much (tighten, never over-fire): the current sealed
text of both claims, and a claim naming neither genus, must stay silent.

Run:  PYTHONUTF8=1 python tools/tests/test_term_gloss_ratified_present.py
Exit 0 = every case behaves; non-zero = the gate stopped biting."""
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)

import json

lex = json.loads((ROOT / "eden" / "tools" / "term-gloss-lexicon.json").read_text(encoding="utf-8"))
RULES = inv._term_gloss_ratified_rules(lex["common_swaps"])


def fires(text):
    return bool(inv._term_gloss_scan_ratified(RULES, [("T", text)]))


# (name, claim_text, must_fire)
CASES = [
    # --- the two real defects this gate was built for -----------------------------
    ("epigen_097_hickory_stripped",
     "gives only its natural distribution in parts per million (ppm) across igneous rocks, "
     "shale, sandstone, limestone, land plants (notably Carya species) and animals, where it "
     "appears in bone.", True),
    ("lets_253_horseweed_stripped",
     "lily-of-the-valley (Convallaria majalis), hawthorn (Crataegus oxyacantha), Canadian "
     "fleabane (Erigeron canadensis), kidney bean (Phaseolus vulgaris)", True),
    # --- the near-variant evasions the OLD gate missed ----------------------------
    ("carya_bare_no_gloss", "accumulates up to 460 ppm in Carya spp.", True),
    ("erigeron_bare_no_gloss", "a tea of Erigeron canadensis was used", True),
    ("superseded_name_returns", "horseweed (Erigeron canadensis), also called Canadian fleabane", True),
    # --- must stay SILENT (tighten, do not over-fire) -----------------------------
    ("epigen_097_current_sealed",
     "across igneous rocks, shale, sandstone, limestone, land plants (notably hickory, Carya "
     "species) and animals, where it appears in bone.", False),
    ("lets_253_current_sealed",
     "hawthorn (Crataegus oxyacantha), horseweed (Erigeron canadensis), kidney bean "
     "(Phaseolus vulgaris)", False),
    ("gloss_present_reordered", "the hickory genus Carya can concentrate it to 460 ppm", False),
    ("neither_genus_named", "selenium at 250 mcg t.i.d. for muscular dystrophy", False),
    ("unrelated_binomial", "lily-of-the-valley (Convallaria majalis) is potentially dangerous", False),
]

fails = 0
for name, text, must_fire in CASES:
    got = fires(text)
    ok = (got == must_fire)
    if not ok:
        fails += 1
    verb = "FIRES" if got else "silent"
    want = "FIRES" if must_fire else "silent"
    print(f"  {'ok  ' if ok else 'FAIL'} {name:32s} -> {verb:6s} (want {want})")

# the live corpus must be clean, or shipping this gate reddens the board
live_ok, live_msg = inv.check_term_gloss_ratified_present()
print(f"  {'ok  ' if live_ok else 'FAIL'} {'live_corpus_clean':32s} -> {live_msg}")
if not live_ok:
    fails += 1

print(f"\n{len(CASES) + 1 - fails}/{len(CASES) + 1} cases behaved")
sys.exit(1 if fails else 0)
