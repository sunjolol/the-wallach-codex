#!/usr/bin/env python3
"""Negative test for collective_doses_not_fanned (Charter R2 — the half amounts_wallach_only
is structurally blind to).

Proof artifact (SS00.B "codify, don't promise" / R7). A gate that has never fired is a gate
trusted on faith. This drives _collective_doses_not_fanned_impl directly with planted
in-memory data (temp files, never a tracked path) and asserts it REDDENS on the exact bug it
was written for -- the one PROVEN on real data 2026-07-15 before the gate existed:

    with the 9 g EFA claim sealed, targets_derive emitted omega-3 = 9 g AND omega-6 = 9 g
    (18 g of board target from a 9 g source), and amounts_wallach_only returned
    "all 40 numeric coverage target(s) trace ... (R2 clean)".

CASE 'control_r2_blind' is the load-bearing one: it re-proves that R2 says GREEN on the very
artifact this gate says RED on. If that case ever flips, the two gates have converged and
this one may be redundant -- but until then it is the only thing standing between a shared
Wallach budget and a doubled board number.

Run:  PYTHONUTF8=1 python tools/test_collective_doses_not_fanned.py

Exit 0 = every case behaves; non-zero = the gate stopped biting (a real regression)."""
import importlib.util
import json
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CANON = ROOT / "eden" / "corpus" / "essentials-canon.json"
CLAIMS = ROOT / "eden" / "corpus" / "claims"
EMBED = ROOT / "dashboard" / "assets" / "data" / "essentials-targets-data.json"

spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._collective_doses_not_fanned_impl
r2_impl = inv._amounts_wallach_only_impl

_tmp = Path(tempfile.mkdtemp(prefix="cdnf_negtest_"))
CID = "WAL-CLM-EFA-TEST-000001"

# A planted claims dir: one sealed COLLECTIVE dose (9 g shared across the two omegas),
# mirroring WAL-CLM-DDDL-000115's shape. Self-contained so the test cannot rot if the real
# claim is edited or re-sealed.
_claims = _tmp / "claims"
_claims.mkdir()
(_claims / "claims-efa-test.json").write_text(json.dumps({
    "schema_version": 1, "book_id": "efa-test",
    "claims": [{
        "id": CID, "kind": "dose", "essentials": ["omega-3", "omega-6"],
        "claim_text": "planted", "verbatim": "planted",
        "locator": {"book": "efa-test", "scheme": "chapter_page", "char_offset": 0},
        "dose": {"amount": 9, "unit": "g", "period": "daily", "form": None,
                 "duration": None, "for_condition": None,
                 "collective_group": "essential-fatty-acids"},
    }],
}, ensure_ascii=False), encoding="utf-8")


def artifact(members):
    """members: slug -> target dict."""
    return {"_purpose": "planted",
            "essentials": [{"name": s, "slug": s, "category": "fatty_acids", "target": t}
                           for s, t in members.items()]}


SHARED_OK = {
    "omega-3": {"kind": "wallach_collective", "collective_group": "essential-fatty-acids",
                "source_claim_id": CID, "source": "planted"},
    "omega-6": {"kind": "wallach_collective", "collective_group": "essential-fatty-acids",
                "source_claim_id": CID, "source": "planted"},
}
FANNED = {
    "omega-3": {"kind": "wallach", "low": 9.0, "unit": "g", "source_claim_id": CID,
                "provenance": {"original_low": 9.0, "original_unit": "g", "upper_taken": 9.0}},
    "omega-6": {"kind": "wallach", "low": 9.0, "unit": "g", "source_claim_id": CID,
                "provenance": {"original_low": 9.0, "original_unit": "g", "upper_taken": 9.0}},
}
HALF_FANNED = {
    "omega-3": {"kind": "wallach", "low": 9.0, "unit": "g", "source_claim_id": CID,
                "provenance": {"original_low": 9.0, "original_unit": "g", "upper_taken": 9.0}},
    "omega-6": {"kind": "wallach_collective", "collective_group": "essential-fatty-acids",
                "source_claim_id": CID, "source": "planted"},
}
# The exact override refused on 2026-07-15: Ultimate EFA Plus label x 6 softgels/day.
# Youngevity composition driving a target is R2 poison (the RETIRED pack-extrapolation
# route). It must not sneak back in wearing a collective claim's source id.
LABEL_DERIVED = {
    "omega-3": {"kind": "wallach", "low": 3510.0, "unit": "mg", "source_claim_id": CID,
                "provenance": {"original_low": 3510.0, "original_unit": "mg"}},
    "omega-6": {"kind": "wallach_collective", "collective_group": "essential-fatty-acids",
                "source_claim_id": CID, "source": "planted"},
}


def case(label, members, expect_red, expect_named=None):
    p = _tmp / f"{label}.json"
    p.write_text(json.dumps(artifact(members), ensure_ascii=False), encoding="utf-8")
    ok, msg = impl(p, _claims)
    got = "RED" if not ok else "GREEN"
    want = "RED" if expect_red else "GREEN"
    named = (expect_named is None) or (expect_named.lower() in msg.lower())
    good = ((not ok) == expect_red) and named
    print(f"  [{label:16}] expect {want:5} -> {got:5} | "
          + (f"{expect_named!r} named: {named}" if expect_named else msg[:64]))
    if not good:
        print(f"    FAIL: {msg}")
    return good


def control_r2_is_blind():
    """THE LOAD-BEARING CASE: R2 must say GREEN on the artifact this gate says RED on.
    That divergence is the entire reason this gate exists."""
    p = _tmp / "r2_blind.json"
    # Give the fanned artifact the shape amounts_wallach_only reads (canon layout_key names).
    data = {"_purpose": "planted", "essentials": [
        {"name": "Omega-3 (Alpha-Linolenic Acid / ALA)", "slug": "omega-3",
         "category": "fatty_acids", "target": FANNED["omega-3"]},
        {"name": "Omega-6 (Linoleic Acid / LA)", "slug": "omega-6",
         "category": "fatty_acids", "target": FANNED["omega-6"]},
    ]}
    p.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    r2_ok, r2_msg = r2_impl(p, CANON, _claims)
    mine_ok, _ = impl(p, _claims)
    good = r2_ok and (not mine_ok)
    print(f"  [control_r2_blind ] R2 -> {'GREEN' if r2_ok else 'RED'} (blind, as designed) | "
          f"this gate -> {'RED' if not mine_ok else 'GREEN'} (catches it)")
    if not good:
        print(f"    FAIL: R2 said {'GREEN' if r2_ok else 'RED'}, this gate said "
              f"{'GREEN' if mine_ok else 'RED'} — R2: {str(r2_msg)[:110]}")
    return good


def unannotated_multi_essential_fails_closed():
    """THE FAIL-OPEN, PINNED (2026-07-15). The gate used to key ENTIRELY on the hand-authored
    `dose.collective_group` field and early-return "no collective dose claims sealed
    (vacuously clean)" when it found none. So it protected only against fan-outs someone had
    REMEMBERED to annotate -- mine a new shared-budget dose, forget the field, and the gate
    reports clean while the board target doubles. The 9 g EFA claim that MADE this gate
    necessary was, itself, an annotation nobody had needed to write yet.

    Now a dose claim mapping >1 essential must be EITHER annotated collective OR a declared
    same-substance pair. This plants an UNANNOTATED two-essential dose (the exact shape of the
    original bug, minus the annotation) and asserts RED."""
    import tempfile as _tf
    d = Path(_tf.mkdtemp(prefix="cdnf_unann_"))
    (d / "claims-planted.json").write_text(json.dumps({"claims": [{
        "id": "WAL-CLM-PLANT-000001", "kind": "dose",
        "essentials": ["omega-3", "omega-6"],
        "verbatim": "Essential fatty acids ... 9 grams per day in capsule form.",
        "dose": {"amount": 9, "unit": "g", "period": "daily"},   # <-- NO collective_group
    }]}, ensure_ascii=False), encoding="utf-8")
    p2 = d / "targets.json"
    p2.write_text(json.dumps({"essentials": []}, ensure_ascii=False), encoding="utf-8")
    ok, msg = impl(p2, d)
    good = not ok
    print(f"  [unannotated_multi] expect RED   -> {'RED' if not ok else 'GREEN'} | {msg[:62]}")
    if not good:
        print("    FAIL: an unannotated multi-essential dose claim must RED — the gate is "
              "fail-OPEN again and only catches fan-outs someone remembered to label")
    return good


def same_substance_pair_still_allowed():
    """The fail-closed check must NOT over-fire on cobalt/vitamin-b12: ONE substance carrying
    two canon names (cobalt is the metal atom at the centre of cobalamin), so a single dose
    legitimately fans to both. If this REDs, the arity check has become a blanket ban and the
    corpus's 2 real cobalt/B12 claims are collateral."""
    import tempfile as _tf
    d = Path(_tf.mkdtemp(prefix="cdnf_same_"))
    (d / "claims-planted.json").write_text(json.dumps({"claims": [{
        "id": "WAL-CLM-PLANT-000002", "kind": "dose",
        "essentials": ["cobalt", "vitamin-b12"],
        "verbatim": "a vitamin B12/cobalt intake of 250 to 400 mcg/day",
        "dose": {"amount": "250-400", "unit": "mcg", "period": "daily"},
    }]}, ensure_ascii=False), encoding="utf-8")
    p2 = d / "targets.json"
    p2.write_text(json.dumps({"essentials": []}, ensure_ascii=False), encoding="utf-8")
    ok, msg = impl(p2, d)
    print(f"  [same_substance   ] expect GREEN -> {'GREEN' if ok else 'RED'} | {msg[:62]}")
    if not ok:
        print(f"    FAIL: {msg}")
    return ok


def main():
    print("  --- the real board (must stay GREEN) ---")
    real_ok, real_msg = impl(EMBED, CLAIMS)
    print(f"  [real_artifact   ] expect GREEN -> {'GREEN' if real_ok else 'RED'} | {real_msg[:70]}")
    print("  --- planted cases ---")
    results = [
        real_ok,
        case("shared_ok", SHARED_OK, expect_red=False),
        case("fanned_both", FANNED, expect_red=True, expect_named="omega-3"),
        case("fanned_one", HALF_FANNED, expect_red=True, expect_named="omega-3"),
        case("label_derived", LABEL_DERIVED, expect_red=True, expect_named="3510"),
        control_r2_is_blind(),
        unannotated_multi_essential_fails_closed(),
        same_substance_pair_still_allowed(),
    ]
    passed = all(results)
    print(f"\n{'ALL PASS' if passed else 'FAILED'} ({sum(results)}/{len(results)})")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
