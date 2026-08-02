#!/usr/bin/env python3
"""Negative test for glossary_keys_denylisted (§00.B "codify, don't promise" / R7 · R9).

The gate exists because glossary_wellformed proves an entry is well-SHAPED and that its keys
do not collide, and is blind to a perfectly-formed key that is a COMMON ENGLISH WORD. Measured
2026-08-02 across 9,211 front-facing blocks: the entry "reduce in chemistry" could never match
its own term and fired only through its aliases -- "reduced" decorated 105 sentences, "reduction"
24, every one the ordinary-English sense. 129 wrong tooltips, 0 right ones, on a green 80/80
board. Luneth found it by reading the page.

CASES 'reduced_alias_readded_trips' and 'reduction_term_readded_trips' are the load-bearing ones:
they are the exact shape of the entry that shipped. If either flips silent, the gate has stopped
catching the defect it was built for.

The SPARING cases matter just as much (R9 -- tighten, never over-fire). The ban is on the EXACT
normalized key, so 'oxidation-reduction' and 'reduced glutathione' -- legitimate multi-word terms
that merely CONTAIN a banned word -- must stay silent, and the live glossary on disk must stay
green. A containment match instead of equality would redden all three.

Run:  PYTHONUTF8=1 python tools/test_glossary_keys_denylisted.py
Exit 0 = every case behaves; non-zero = the gate stopped biting."""
import importlib.util
import json
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)

DENY = {"reduced": "measured 105 ordinary-sense firings", "reduction": "measured 24",
        "reduce": "same family", "reducing": "same family"}

results = []


def kcase(name, terms, want_clean):
    """Drive the pure helper: want_clean=True means NO violation may be reported."""
    violations, checked = inv._glossary_denylist_violations(terms, DENY)
    ok = (len(violations) == 0) == want_clean
    verdict = "clean" if not violations else f"{len(violations)} violation(s)"
    print(f"  {'PASS' if ok else 'FAIL'}  {name:38s} want={'clean' if want_clean else 'RED':5s} got={verdict}"
          + (f"  [{violations[0][:70]}]" if violations else ""))
    results.append(ok)
    return ok


print("=" * 100)
print("glossary_keys_denylisted -- key-matching cases (drives _glossary_denylist_violations)")
print("=" * 100)

k_cases = [
    # LOAD-BEARING: the exact shape that shipped -- the alias Luneth reported.
    ("reduced_alias_readded_trips",
     [{"term": "reduce in chemistry", "aliases": ["reduced", "reduction"]}], False),
    # LOAD-BEARING: the same word promoted to a term instead of an alias.
    ("reduction_term_readded_trips", [{"term": "reduction"}], False),
    # NORMALIZATION: capitalisation must not launder a banned key (runtime matches case-insensitively).
    ("capitalised_variant_trips", [{"term": "Vitamin X", "aliases": ["Reduced"]}], False),
    # NORMALIZATION, the SPARING half: "re- ducing" normalizes to the two-word key "re ducing",
    # which at runtime matches "re-ducing"/"re ducing" but NOT the bare word -- a different key,
    # correctly spared. Named for what it asserts; a case whose label contradicts its expectation
    # is worse than no case.
    ("hyphen_split_is_a_different_key_spared",
     [{"term": "thing", "aliases": ["re- ducing"]}], True),
    # NORMALIZATION, the CATCHING half: padding and capitalisation must not launder a banned key.
    ("whitespace_padded_variant_trips", [{"term": "thing", "aliases": ["  Reducing  "]}], False),
    # A never-registered member of the closed morphological family.
    ("family_member_reduce_trips", [{"term": "reduce"}], False),
    # SPARING: multi-word key CONTAINING a banned word -- equality, not containment.
    ("oxidation_reduction_spared", [{"term": "oxidation-reduction"}], True),
    ("reduced_glutathione_spared", [{"term": "reduced glutathione"}], True),
    ("reduction_inside_phrase_spared", [{"term": "reduction of healing time"}], True),
    # SPARING: an ordinary unrelated entry.
    ("unrelated_entry_spared", [{"term": "selenium", "aliases": ["Se"]}], True),
]
for c in k_cases:
    kcase(*c)

print()
print("=" * 100)
print("glossary_keys_denylisted -- end-to-end cases (drives check_glossary_keys_denylisted on disk)")
print("=" * 100)


def fcase(name, glossary_terms, denylist, want_clean):
    """Point the invariant at a crafted tree so the whole check runs, reason-guard included."""
    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        gp = root / "dashboard" / "assets" / "data"
        gp.mkdir(parents=True)
        (gp / "glossary.json").write_text(json.dumps({"terms": glossary_terms}), encoding="utf-8")
        lp = root / "eden" / "tools"
        lp.mkdir(parents=True)
        (lp / "term-gloss-lexicon.json").write_text(
            json.dumps({"glossary_key_denylist": denylist}), encoding="utf-8")
        real = inv.ROOT
        try:
            inv.ROOT = root
            ok_flag, msg = inv.check_glossary_keys_denylisted()
        finally:
            inv.ROOT = real
    ok = ok_flag == want_clean
    print(f"  {'PASS' if ok else 'FAIL'}  {name:38s} want={'clean' if want_clean else 'RED':5s} "
          f"got={'clean' if ok_flag else 'RED':5s}  [{msg[:78]}]")
    results.append(ok)


fcase("live_shape_clean", [{"term": "selenium"}], DENY, True)
fcase("readded_key_red", [{"term": "x", "aliases": ["reduced"]}], DENY, False)
# R9 reviewability: a denylist entry with no recorded measurement is itself a defect.
fcase("reasonless_denylist_entry_red", [{"term": "selenium"}], {"reduced": ""}, False)
# An empty denylist is vacuously clean -- the gate must not invent a failure.
fcase("empty_denylist_vacuously_clean", [{"term": "selenium"}], {}, True)

print()
print("=" * 100)
print("LIVE BOARD -- the real files on disk must be clean")
print("=" * 100)
ok_flag, msg = inv.check_glossary_keys_denylisted()
print(f"  {'PASS' if ok_flag else 'FAIL'}  live_repo_clean                        {msg}")
results.append(ok_flag)

failures = sum(1 for r in results if not r)
print("-" * 100)
if failures:
    print(f"FAIL -- {failures}/{len(results)} case(s) misbehaved.")
    sys.exit(1)
print(f"PASS -- every one of {len(results)} case(s) behaves; the gate re-catches a re-registered "
      f"common-word key (term OR alias, any capitalisation or separator), spares every multi-word "
      f"key that merely contains one, and rejects a denylist entry with no recorded measurement.")
