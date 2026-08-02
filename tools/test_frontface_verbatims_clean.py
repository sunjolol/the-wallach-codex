#!/usr/bin/env python3
"""Negative test for frontface_verbatims_clean (§00.B "codify, don't promise" / R7 · R9).

THE INCIDENT, 2026-08-02: Luneth found raw OCR in USER-FACING quotes -- WAL-CLM-RARE-000336 showing
"tisk"/"rea"/"ancer", WAL-CLM-LETS-000502 showing line-break splits and "1 20" for 120. 180 mid-word
hyphen splits across 91 front-facing quotes were repaired. This gate stops that class returning.

CASE 'hyphen_split_fires' is the load-bearing one: it is the exact shape of all 180. If it flips
silent, the class is back and no other gate will notice -- a split verbatim is still a byte-exact
substring of its source, so corpus_verify stays green on it.

The SPARING cases matter as much (R9 -- tighten, never over-fire): a mid-line compound hyphen is
CORRECT and must stay silent, and an exception must cover ONLY the claim+detector it names.

Run:  PYTHONUTF8=1 python tools/test_frontface_verbatims_clean.py"""
import importlib.util, json, sys, tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("invariants", ROOT/"tools"/"invariants.py")
inv = importlib.util.module_from_spec(spec); spec.loader.exec_module(inv)
res = []

def dcase(name, vb, want):
    got = inv._frontface_defects(vb)
    ok = sorted(got) == sorted(want)
    print(f"  {'PASS' if ok else 'FAIL'}  {name:38s} detected={got} want={want}")
    res.append(ok)

print("=" * 96); print("detector cases (drives _frontface_defects)"); print("=" * 96)
# LOAD-BEARING: the shape of all 180 repaired splits.
dcase("hyphen_split_fires", "a classic case of mal-\nabsorption. You know", ["hyphen_split"])
dcase("hyphen_split_indented_fires", "had been try-\n  ing for a pregnancy", ["hyphen_split"])
dcase("mojibake_fires", "trace minerals are essenti\uFFFDl for life", ["mojibake_or_control"])
dcase("control_char_fires", "minerals are\u0007 the currency of life", ["mojibake_or_control"])
dcase("both_fire", "mal-\nabsorption and \uFFFD", ["hyphen_split", "mojibake_or_control"])
# SPARING -- a mid-line compound hyphen is CORRECT (15 such were deliberately kept on 2026-08-02).
dcase("midline_compound_spared", "gold may have anti-inflammatory effects", [])
dcase("hyphen_then_newline_word_spared", "the anti-\n\nNext paragraph starts", [])
dcase("clean_verbatim_spared", "minerals are the currency of life.", [])
dcase("empty_spared", "", [])

# ── the five classes promoted 2026-08-02, each with its FIRING case and its SPARING case ──
# space_before_punct: a spurious space before a comma is a defect (LETS-000324/-000348 were fixed)...
dcase("space_before_punct_fires", "topical applications of Caladryl , aloe vera", ["space_before_punct"])
# ...but a table LEADER-DOT run is not (PANTOTHENIC ACID ...4 mg). This exclusion IS the gate.
dcase("leader_dots_spared", "PANTOTHENIC ACID ...4 mg 50 mg 300 to 1,000 mg", [])
# number_split: "1 20 days" was really 120 (page-verified)...
dcase("number_split_fires", "supplementation (1 20 days - BINGO!!", ["number_split"])
# ...but a vitamin designation is a NAME plus a dose, not a split number.
dcase("vitamin_designation_spared", "zinc 50 mg t.i.d., B-2 50 mg b.i.d.", [])
# run_together: "anWor" was really "and/or" (page-verified) -- the detector must stay strict...
dcase("run_together_fires", "hydrogen ions may be generated anWor retained", ["run_together"])
# ...and camelCase brands/surnames are handled by NAMED EXCEPTIONS, not by loosening the regex,
# which is why this still fires here and is excused per-claim in the exception list.
dcase("brand_camelcase_still_fires", "marketed as Equal and NutraSweet, both of which", ["run_together"])
# double_space: OCR noise fires...
dcase("double_space_fires", "the currency  of life", ["double_space"])
# digit_in_word: "in1881" shape fires (that specific claim is a page-verified book typo, excused)...
dcase("digit_in_word_fires", "were discovered in Death Valley in1881. The deposits", ["digit_in_word"])
# ...but ordinals, decades, vitamin designations, units and chemical formulae must NOT.
dcase("ordinal_spared", "the fourth quarter of the 20th century", [])
dcase("decade_spared", "common in the 1990s and again in the 1880s", [])
dcase("unit_adjacency_spared", "colloids (1nm to 100nm) and up to 146mcg/day and a 1cm hole", [])
dcase("mercury_unit_spared", "low levels of mercury (2-5ug/kg); moderate consumers", [])
dcase("chemical_formula_spared", "Eighteen percent of dietary As2O3 was stored", [])
dcase("medical_frequency_spared", "tetracycline at 500 mg IV q6 h, sedation", [])
dcase("vitamin_b12_spared", "absorption of minerals and B12 (intrinsic factor)", [])

print(); print("=" * 96); print("end-to-end cases (drives check_frontface_verbatims_clean on disk)"); print("=" * 96)

def fcase(name, claims, exceptions, want_clean):
    with tempfile.TemporaryDirectory() as td:
        r = Path(td)
        (r/"eden"/"corpus"/"claims").mkdir(parents=True); (r/"eden"/"tools").mkdir(parents=True)
        (r/"eden"/"corpus"/"claims"/"claims-x.json").write_text(
            json.dumps({"book_id": "x", "claims": claims}), encoding="utf-8")
        (r/"eden"/"tools"/"frontface-exceptions.json").write_text(
            json.dumps({"exceptions": exceptions}), encoding="utf-8")
        real = inv.ROOT
        try:
            inv.ROOT = r; ok_flag, msg = inv.check_frontface_verbatims_clean()
        finally:
            inv.ROOT = real
    ok = ok_flag == want_clean
    print(f"  {'PASS' if ok else 'FAIL'}  {name:38s} want={'clean' if want_clean else 'RED':5s} "
          f"got={'clean' if ok_flag else 'RED':5s}  [{msg[:66]}]")
    res.append(ok)

DIRTY = [{"id": "WAL-CLM-X-000001", "verbatim": "a case of mal-\nabsorption"}]
CLEAN = [{"id": "WAL-CLM-X-000001", "verbatim": "a case of malabsorption"}]
GOODEXC = [{"claim_id": "WAL-CLM-X-000001", "detector": "hyphen_split", "reason": "table artefact, verified against p85"}]
fcase("defect_with_no_exception_red", DIRTY, [], False)
fcase("defect_with_named_exception_clean", DIRTY, GOODEXC, True)
# R9: an exception must cover ONLY what it names -- wrong detector must NOT excuse it.
fcase("exception_for_other_detector_red", DIRTY,
      [{"claim_id": "WAL-CLM-X-000001", "detector": "mojibake_or_control", "reason": "unrelated"}], False)
# R9: an exception for a DIFFERENT claim must not excuse this one.
fcase("exception_for_other_claim_red", DIRTY,
      [{"claim_id": "WAL-CLM-X-999999", "detector": "hyphen_split", "reason": "unrelated"}], False)
# An exception with no reason is itself RED -- a carve-out is a factual claim.
fcase("reasonless_exception_red", CLEAN,
      [{"claim_id": "WAL-CLM-X-000001", "detector": "hyphen_split", "reason": "  "}], False)
fcase("clean_corpus_clean", CLEAN, [], True)

print(); print("=" * 96); print("LIVE REPO"); print("=" * 96)
ok_flag, msg = inv.check_frontface_verbatims_clean()
print(f"  {'PASS' if ok_flag else 'FAIL'}  live_repo_clean   {msg}")
res.append(ok_flag)
print("-" * 96)
if not all(res):
    print(f"FAIL — {sum(1 for r in res if not r)}/{len(res)} case(s) misbehaved."); sys.exit(1)
print(f"PASS — all {len(res)} cases: the gate catches all SEVEN mechanical classes, spares the legitimate "
      f"typography each one lives beside (compound hyphens, table leader dots, vitamin designations, "
      f"ordinals, decades, units, chemical formulae), honours an exception ONLY for the claim+detector "
      f"it names, and rejects a carve-out with no reason.")
