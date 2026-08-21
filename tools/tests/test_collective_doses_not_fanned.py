#!/usr/bin/env python3
"""Negative test for collective_doses_not_fanned (Charter R2 — the half amounts_wallach_only
is structurally blind to).

Proof artifact (§00.B "codify, don't promise"). A gate that has never fired is a gate
trusted on faith. This drives _collective_doses_not_fanned_impl directly with planted
in-memory data (temp files, never a tracked path) and asserts it REDDENS on the exact bug it
was written for -- the one PROVEN on real data before the gate existed:

    with the 9 g EFA claim sealed, targets_derive emitted omega-3 = 9 g AND omega-6 = 9 g
    (18 g of board target from a 9 g source), and amounts_wallach_only reported every numeric
    coverage target as tracing cleanly to a Wallach dose claim (R2 clean).

CASE 'control_r2_blind' is the load-bearing one: it re-proves that R2 says GREEN on the very
artifact this gate says RED on. If that case ever flips, the two gates have converged and
this one may be redundant -- but until then it is the only thing standing between a shared
Wallach budget and a doubled board number.

THE THREE CLASSIFICATIONS a multi-essential dose claim may declare, each a STATED FACT on the
claim rather than an inference from arity: `dose.collective_group` (one budget shared across
members) · `dose.applies_to` (the amount belongs to a proper SUBSET) · nothing, which is RED.

★ A FOURTH ROUTE ONCE EXISTED AND WAS A FABRICATION. `_SAME_SUBSTANCE_SLUGS` exempted cobalt/B12
on the reasoning that "cobalt is the metal atom at the centre of cobalamin" -- a PART-OF relation
masquerading as IDENTITY. 400 mcg of B12 carries only ~4% of that mass as cobalt, so the carve-out
let a B12 dose post a 400 mcg ELEMENTAL COBALT target while this very gate reported green. It was
purged after the books were read directly: no elemental-cobalt target ever, cobalt auto-fills from
B12 (canon `coverage_kind: "mirrors"`, `mirrors_slug: "vitamin-b12"`). Its successor,
`applies_to_scopes_the_dose`, keeps the INTENT (don't red-board the 2 real cobalt/B12 claims) on
the mechanism that actually shipped: `dose.applies_to`, a STATED FACT on the claim.

Run:  PYTHONUTF8=1 python tools/tests/test_collective_doses_not_fanned.py

Exit 0 = every case behaves; non-zero = the gate stopped biting (a real regression)."""
import importlib.util
import json
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
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
# The exact override that was refused: Ultimate EFA Plus label x 6 softgels/day.
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


def _planted(claim, artifact_essentials=None):
    """One planted dose claim + a targets artifact, in their own temp dir."""
    import tempfile as _tf
    d = Path(_tf.mkdtemp(prefix="cdnf_ap_"))
    (d / "claims-planted.json").write_text(
        json.dumps({"claims": [claim]}, ensure_ascii=False), encoding="utf-8")
    p2 = d / "targets.json"
    p2.write_text(json.dumps({"essentials": artifact_essentials or []}, ensure_ascii=False),
                  encoding="utf-8")
    return impl(p2, d)


def _cobalt_claim(**dose_extra):
    """The REAL shape of WAL-CLM-IMMORT-000084 / WAL-CLM-RARE-000014: Wallach writes
    "B12/cobalt" as one token, so the claim is ABOUT both, but the 250-400 mcg is B12's."""
    dz = {"amount": "250-400", "unit": "mcg", "period": "daily"}
    dz.update(dose_extra)
    return {"id": "WAL-CLM-PLANT-000002", "kind": "dose",
            "essentials": ["cobalt", "vitamin-b12"],
            "verbatim": "a vitamin B12/cobalt intake of 250 to 400 mcg/day",
            "dose": dz}


def applies_to_scopes_the_dose():
    """THE SANCTIONED ESCAPE HATCH. The arity check must not become a blanket ban that red-boards
    the 2 real cobalt/B12 claims -- Wallach writes "B12/cobalt" as one token, so a claim is ABOUT
    both while the amount is B12's. The escape hatch is `dose.applies_to`, a STATED FACT on the
    claim naming a PROPER SUBSET, never an inference from arity. This pins that hatch.

    An earlier version of this case exempted cobalt/B12 on the reasoning that cobalt is the metal
    atom at the centre of cobalamin -- a PART-OF relation, not IDENTITY. 400 mcg of B12 carries
    only ~4% of that mass as cobalt, so the carve-out let a B12 dose post a 400 mcg ELEMENTAL
    COBALT target while the gate built to catch exactly that reported green. That exemption was
    purged; `_SAME_SUBSTANCE_SLUGS` has been `()` ever since."""
    ok, msg = _planted(_cobalt_claim(applies_to=["vitamin-b12"]))
    print(f"  [applies_to_scopes] expect GREEN -> {'GREEN' if ok else 'RED'} | {msg[:62]}")
    if not ok:
        print(f"    FAIL: a dose scoped by applies_to to a PROPER SUBSET must pass, or the "
              f"2 real cobalt/B12 claims are collateral: {msg}")
    return ok


def applies_to_malformed_fails_closed():
    """applies_to is VALIDATED, never trusted -- a malformed marker must not become a way to
    silence the gate. All three shapes were enforced in code long before any of them had a
    planted case, so none had ever been proven to fire."""
    cases = [
        ("empty", _cobalt_claim(applies_to=[]),
         "an EMPTY applies_to states nothing and must not buy silence"),
        ("not_subset", _cobalt_claim(applies_to=["selenium"]),
         "applies_to naming an essential the claim does not map is incoherent"),
        ("equals_all", _cobalt_claim(applies_to=["cobalt", "vitamin-b12"]),
         "applies_to listing EVERY mapped essential is a fan-out with extra steps"),
    ]
    good = True
    for label, claim, why in cases:
        ok, msg = _planted(claim)
        print(f"  [applies_to:{label:10}] expect RED   -> {'RED' if not ok else 'GREEN'} | {msg[:44]}")
        if ok:
            print(f"    FAIL: {why}")
            good = False
    return good


def applies_to_enforced_not_merely_accepted():
    """★ THE MARKER MUST HAVE TEETH. applies_to says the amount belongs to a SUBSET; if the
    derive still posts that number on a mapped-but-UNDOSED essential, the marker is a comment,
    not a gate. This plants exactly the world the 2026-07-15 fix existed to prevent: the claim
    says the 400 mcg is B12's, and the artifact posts it on COBALT anyway -- the fabricated
    elemental-cobalt target, returning."""
    ok, msg = _planted(
        _cobalt_claim(applies_to=["vitamin-b12"]),
        artifact_essentials=[{"name": "Cobalt", "slug": "cobalt", "category": "minerals",
                              "target": {"kind": "wallach", "low": 400.0, "unit": "mcg",
                                         "source_claim_id": "WAL-CLM-PLANT-000002"}}])
    good = (not ok) and "cobalt" in msg.lower()
    print(f"  [applies_to_teeth ] expect RED   -> {'RED' if not ok else 'GREEN'} | {msg[:62]}")
    if not good:
        print("    FAIL: a numeric target on an essential the claim explicitly does NOT dose "
              "must RED — otherwise applies_to is decorative and the 400 mcg comes back")
    return good


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
        applies_to_scopes_the_dose(),
        applies_to_malformed_fails_closed(),
        applies_to_enforced_not_merely_accepted(),
    ]
    passed = all(results)
    print(f"\n{'ALL PASS' if passed else 'FAILED'} ({sum(results)}/{len(results)})")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
