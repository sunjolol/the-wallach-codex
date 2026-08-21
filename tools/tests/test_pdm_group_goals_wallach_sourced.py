#!/usr/bin/env python3
"""test_pdm_group_goals_wallach_sourced.py — NEGATIVE test for the group-goal gate.

A gate that has never been SEEN to fail is theater. This plants each defect the gate claims to
catch and asserts RED, then asserts GREEN on the real files. Run:

    PYTHONUTF8=1 python tools/tests/test_pdm_group_goals_wallach_sourced.py

WHY EACH CASE EXISTS. Every one is SILENT — the board stays green while the field either makes
a health claim Wallach never made, or quietly drops one he did:

   1  over-claim        -> ★ THE §00.A CASE. A goal posts `groups` with no sealed claim naming
                           the complex for it. The field then tells the user the plant-derived
                           bottle serves a goal Wallach never connected it to. This is the
                           direction that puts an invented attribution on screen.
   2  under-claim       -> the inverse, and the one nobody would ever notice: a real Wallach
                           attribution silently missing from the field. Invisible on screen —
                           an absent dot looks exactly like a goal he never named.
   3  dangling group id -> `groups` names a subsection that does not exist; the dots bind to
                           nothing and render nowhere, so the goal silently loses its mark.
   4  SINGLE ELEMENT    -> ★ THE CASE THAT EARNS THE GATE. "plant derived colloidal CALCIUM"
                           (LETS-000322, insomnia) is NOT the complex — calcium is one of the
                           INDIVIDUALLY DOSED 21, with its own Wallach amount. The claim's
                           `other_substances` tag says `colloidal-minerals` for it anyway,
                           which is exactly why this gate reads the VERBATIM and not the tag.
                           If `colloidal calcium` ever satisfies the phrase, the group absorbs
                           attributions belonging to individual elements.
   5  neighbouring bleed-> "Colloidal tin" under a DIFFERENT condition's entry must not license
                           a group claim. Reading the claim's OWN verbatim makes this
                           impossible by construction — this case pins that it stays so. Bleed
                           was the dominant false-positive source in adversarial review.
   6  HYPHENATION       -> ★ THE SILENT-MISS CASE. The books are OCR'd from print and wrap
                           words across lines ("Plant de-\\nrived colloi-\\ndal min-\\nerals" —
                           LETS-000419's real shape). Without de-hyphenation the gate UNDER-
                           matches, red-flags a true attribution as an over-claim, and gets
                           itself deleted as a false alarm. This asserts the rejoin holds.
   7  search-only       -> a claim tagged `search-only` belongs to the Ask-Wallach index alone
                           and must never feed an operational surface. It may not license a
                           goal dot.
   8  no group claims   -> ANTI-VACUITY. With no claims naming the complex, cases 1-3 pass
                           trivially and the gate certifies nothing.
   9  no goal posts     -> ANTI-VACUITY, the other half: claims exist but the rule is switched
                           off. The gate would pass forever while the feature is dead.
  10  real files GREEN  -> the gate must not over-fire on the shipped data.
"""
import json
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))
from invariants import _pdm_group_goals_wallach_sourced_impl  # noqa: E402

LAYOUT = ROOT / "dashboard/assets/data/coverage-layout-data.json"
CLAIMS = ROOT / "eden/corpus/claims"

results = []


def run(name, expect_ok, layout=None, claims=None):
    """claims: list of claim dicts to write as a single shard, or None for the real corpus."""
    with tempfile.TemporaryDirectory() as d:
        d = Path(d)
        lp = d / "layout.json"
        lp.write_text(json.dumps(layout) if layout is not None
                      else LAYOUT.read_text(encoding="utf-8"), encoding="utf-8")
        cd = d / "claims"
        cd.mkdir()
        if claims is not None:
            (cd / "claims-planted.json").write_text(
                json.dumps({"claims": claims}), encoding="utf-8")
        else:
            for sh in sorted(CLAIMS.glob("claims-*.json")):
                (cd / sh.name).write_text(sh.read_text(encoding="utf-8"), encoding="utf-8")
        ok, msg = _pdm_group_goals_wallach_sourced_impl(lp, cd)
    good = (ok == expect_ok)
    results.append((name, good, ok, msg))
    print(f"  {'ok  ' if good else 'FAIL'} · {name}  (expected {'GREEN' if expect_ok else 'RED'}, got "
          f"{'GREEN' if ok else 'RED'})")
    if not good:
        print(f"        msg: {msg[:220]}")


# ── a minimal world: one subsection with an id, two goals ──────────────────────
def world(goals, sub_id="plant-derived"):
    return {
        "sections": [{"subsections": [{"id": sub_id, "rank": "C", "label": "PLANT DERIVED",
                                       "hint": "", "tiles": []}]}],
        "goals": goals,
    }


def claim(cid, verbatim, conditions, tags=None):
    return {"id": cid, "verbatim": verbatim, "conditions": conditions, "tags": tags or []}


GOOD_CLAIM = claim("C-1", "Treatment should include plant derived colloidal minerals.",
                   ["osteoporosis"])

print("PLANTED DEFECTS (each must go RED):")

# 1. over-claim — a goal names the group with nothing behind it.
run("1  over-claim: goal posts groups with NO supporting claim", False,
    layout=world([{"id": "g1", "conditions": ["osteoporosis"], "members": ["calcium"],
                   "groups": ["plant-derived"]}]),
    claims=[claim("C-1", "Treatment should include calcium at 2000 mg/day.", ["osteoporosis"])])

# 2. under-claim — a real attribution dropped.
run("2  under-claim: supporting claim exists but goal posts no groups", False,
    layout=world([{"id": "g1", "conditions": ["osteoporosis"], "members": ["calcium"]}]),
    claims=[GOOD_CLAIM])

# 3. dangling group id.
run("3  dangling: groups names a subsection id that does not exist", False,
    layout=world([{"id": "g1", "conditions": ["osteoporosis"], "members": ["calcium"],
                   "groups": ["not-a-subsection"]}], sub_id="plant-derived"),
    claims=[GOOD_CLAIM])

# 4. ★ SINGLE ELEMENT must not satisfy the phrase.
run("4  SINGLE ELEMENT: 'colloidal calcium' must NOT license a group dot", False,
    layout=world([{"id": "g1", "conditions": ["insomnia"], "members": ["calcium"],
                   "groups": ["plant-derived"]}]),
    claims=[claim("C-1", "Treatment for insomnia includes calcium (especially plant derived "
                         "colloidal calcium), chromium at 25-200 mcg t.i.d.", ["insomnia"])])

# 5. neighbouring-entry bleed: colloidal tin belongs to another entry/condition.
run("5  BLEED: 'Colloidal tin' under another condition must not license a group dot", False,
    layout=world([{"id": "g1", "conditions": ["backache"], "members": ["calcium"],
                   "groups": ["plant-derived"]}]),
    claims=[claim("C-1", "Treatment includes massage, chiropractic, hydrotherapy.", ["backache"]),
            claim("C-2", "Colloidal tin is reported to be effective!", ["alopecia"])])

# 6. ★ HYPHENATION must still match (else the gate under-matches and false-alarms).
run("6  HYPHENATION: 'colloi-\\ndal min-\\nerals' MUST count (real OCR shape)", True,
    layout=world([{"id": "g1", "conditions": ["arthritis"], "members": ["calcium"],
                   "groups": ["plant-derived"]}]),
    claims=[claim("C-1", "Plant de-\nrived colloi-\ndal min-\nerals have proved great benifit "
                         "here.", ["arthritis"])])

# 7. search-only must not license an operational dot.
run("7  search-only claim must NOT license a group dot", False,
    layout=world([{"id": "g1", "conditions": ["osteoporosis"], "members": ["calcium"],
                   "groups": ["plant-derived"]}]),
    claims=[claim("C-1", "Plant derived colloidal minerals are wonderful.", ["osteoporosis"],
                  tags=["search-only"])])

# 8. anti-vacuity — no claim names the complex at all.
run("8  ANTI-VACUITY: no claim names the complex", False,
    layout=world([{"id": "g1", "conditions": ["osteoporosis"], "members": ["calcium"]}]),
    claims=[claim("C-1", "Treatment should include calcium.", ["osteoporosis"])])

# 9. anti-vacuity — claims exist, rule switched off everywhere.
run("9  ANTI-VACUITY: claims exist but NO goal posts groups", False,
    layout=world([{"id": "g1", "conditions": ["diabetes"], "members": ["chromium"]}]),
    claims=[GOOD_CLAIM])

print("\nTHE REAL FILES (must be GREEN — the gate must not over-fire):")
run("10 real coverage-layout-data.json + the sealed corpus", True)

bad = [r for r in results if not r[1]]
print()
if bad:
    print(f"FAIL · {len(bad)} of {len(results)} case(s) behaved wrongly")
    sys.exit(1)
print(f"PASS · {len(results)} cases — the gate fires on every defect it claims to catch, "
      f"spares the OCR-hyphenated true positive, and stays green on the shipped data")
