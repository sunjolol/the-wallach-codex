#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Negative test for mech_quote_trim_faithful.

A mechanism split card may DISPLAY a trimmed literal quote (quote_trim) -- Wallach's words cut
before a trailing sentence -- while the cite composes from the sealed claim. Trimming may only
choose where a quote STOPS; the displayed text stays a literal slice. This proves the gate bites
when
the displayed text is NOT a faithful slice of the sealed verbatim (fabrication behind a real cite),
when it names no claim, or when the claim does not resolve -- and passes a faithful trim, a
whitespace-only variance, and the legacy split shape.

Drives _mech_quote_trim_faithful_impl with synthetic stores + a claims map, so the gate is proven to
bite without touching the real files. Run:

    PYTHONUTF8=1 python tools/tests/test_mech_quote_trim_faithful.py

Exit 0 = every case behaves; non-zero = the gate stopped biting."""
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._mech_quote_trim_faithful_impl

# A structurally real verbatim: multi-line (as sealed shards are), so norm() has real work to do.
VERB = ("Muscle cramps and twitches\n(eye twitches) are signals of calcium deficiency. Serious life "
        "threatening\nconvulsions from low cell levels of calcium\nwill occur before low blood levels "
        "show up.\nThe normal range is 9-10.8 mg")
CLAIMS = {"WAL-CLM-LETS-000078": VERB}

# faithful: the verbatim minus its last sentence
TRIM_OK = ("Muscle cramps and twitches (eye twitches) are signals of calcium deficiency. Serious life "
           "threatening convulsions from low cell levels of calcium will occur before low blood levels "
           "show up.")
# whitespace-only difference is still faithful (norm collapses it)
TRIM_WS = "Muscle cramps    and twitches (eye twitches) are signals of calcium deficiency."
# words Wallach never wrote, behind a real cite
TRIM_FABRICATED = "Serious life threatening convulsions occur, and calcium cures every disease."
# a real-looking sentence with a MADE-UP number
TRIM_ALTERED = "The normal range is 8-11 mg"


def split_store(side):
    return {"mechanisms": [{"slug": "calcium", "blocks": [
        {"type": "split", "left": side, "right": {"head": "h", "text": "t"}}]}]}


def composed_quote_store(claim, trim):
    # The COMPOSED standalone pull-quote path (magnesium): the trim lives on the quote block itself,
    # keyed `claim`/`trim` (not the split's quote_claim/quote_trim).
    block = {"type": "quote", "claim": claim}
    if trim is not None:
        block["trim"] = trim
    return {"mechanisms": [{"slug": "magnesium", "blocks": [block]}]}


CASES = [
    ("no quote_trim anywhere passes (nothing to check)",
     split_store({"head": "h", "text": "t", "quote_claim": "WAL-CLM-LETS-000078"}), CLAIMS, True),
    ("faithful trim (last sentence dropped) passes",
     split_store({"quote_claim": "WAL-CLM-LETS-000078", "quote_trim": TRIM_OK}), CLAIMS, True),
    ("whitespace-only variance passes (norm collapses it)",
     split_store({"quote_claim": "WAL-CLM-LETS-000078", "quote_trim": TRIM_WS}), CLAIMS, True),
    ("legacy-shape split trim is checked too",
     {"mechanisms": [{"slug": "x", "split": {
         "left": {"quote_claim": "WAL-CLM-LETS-000078", "quote_trim": TRIM_OK}, "right": {}}}]},
     CLAIMS, True),
    ("fabricated words behind a real cite REDDENS",
     split_store({"quote_claim": "WAL-CLM-LETS-000078", "quote_trim": TRIM_FABRICATED}), CLAIMS, False),
    ("an altered number REDDENS",
     split_store({"quote_claim": "WAL-CLM-LETS-000078", "quote_trim": TRIM_ALTERED}), CLAIMS, False),
    ("quote_trim with no quote_claim REDDENS (a cite with no source)",
     split_store({"quote_trim": TRIM_OK}), CLAIMS, False),
    ("quote_trim whose claim does not resolve REDDENS",
     split_store({"quote_claim": "WAL-CLM-NOPE-000999", "quote_trim": TRIM_OK}), CLAIMS, False),
    ("empty claims map makes a real trim REDDEN (loader-bug guard)",
     split_store({"quote_claim": "WAL-CLM-LETS-000078", "quote_trim": TRIM_OK}), {}, False),
    # -- composed standalone pull-quote (magnesium) path --
    ("composed quote block with a faithful trim passes",
     composed_quote_store("WAL-CLM-LETS-000078", TRIM_OK), CLAIMS, True),
    ("composed quote block with no trim is not checked (passes)",
     composed_quote_store("WAL-CLM-LETS-000078", None), CLAIMS, True),
    ("composed quote block with a fabricated trim REDDENS",
     composed_quote_store("WAL-CLM-LETS-000078", TRIM_FABRICATED), CLAIMS, False),
    ("composed quote block whose claim does not resolve REDDENS",
     composed_quote_store("WAL-CLM-NOPE-000999", TRIM_OK), CLAIMS, False),
]


def main():
    bad = 0
    for name, store, claims, expect in CASES:
        ok, msg = impl(store, claims)
        if ok != expect:
            bad += 1
            print(f"FAIL - {name} - expected ok={expect}, got ok={ok} - {msg}")
        else:
            print(f"ok   - {name}")
    print(f"\n{'PASS' if bad == 0 else 'FAIL'} - test_mech_quote_trim_faithful - "
          f"{len(CASES) - bad}/{len(CASES)} cases")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
