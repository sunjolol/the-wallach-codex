#!/usr/bin/env python3
"""efa_coverage_derive.py — the essential-fatty-acid coverage metric (goal + per-product EFA mg).

Generates dashboard/assets/data/efa-coverage-data.json — read by state/coverage.ts to score
omega-3 + omega-6 as ONE GROUP against Wallach's single EFA amount. Mirrors
pdm_coverage_derive.py, which solves the identical shape for the 33 trace_pdm rare-earths.

WHY A GROUP AT ALL. Wallach states ONE amount for the essential fatty acids as a CATEGORY:
"Essential fatty acids are a must and should be consumed at the rate of 3 percent of your total
daily calorie consumption or supplemented at the rate of 9 grams per day in capsule form"
(Dead Doctors Don't Lie 3e 2011, L9106-9109 @ char_offset 609931 -> WAL-CLM-DDDL-000115). His
EFAs are exactly two: "only two (linoleic and linolenic) are designated as Essential Fatty Acids"
(L7171-7174). So 9 g is ONE budget shared by omega-3 + omega-6, never 9 g of each -- fanned out
per-slug it silently asserts 18 g, and amounts_wallach_only certifies that GREEN because it
audits each essential in isolation (proven 2026-07-15; see collective_doses_not_fanned).

THE GOAL (SS00.A / R2). 9 g -> 9000 mg is a UNIT change of Wallach's own finished number, not a
new amount: he states the supplement figure himself, so nothing here supplies a reference. That
is the whole reason no calorie basis appears in this file -- his "3 percent of total daily
calorie consumption" is the SAME requirement expressed the other way, and re-deriving it against
an FDA 2,000-kcal standard would yield 6.67 g and overrule the number he wrote (source-rule
review: chronicle/contradictions/2026-07-15-omega-efa-target-source.md).

OMEGA-9 IS DELIBERATELY EXCLUDED. Wallach names three PUFAs and oleic acid is not among them;
across all 7 sealed books he never once treats omega-9 as required (20 statements, every one
descriptive-only or not-required). Counting a product's oleic acid toward an EFA goal would
credit intake against a requirement he never stated.

TWO INPUTS, joined here (derive-don't-duplicate, R1):
  - eden/products/products.json (SEALED pillar) -- the COMPOSITION: each product's per-serving
    fatty-acid mg. SS00.A: composition feeds the coverage math, never a target.
  - eden/corpus/claims/* (SEALED pillar) -- the GOAL: the Wallach dose claim, cited by id.
Identity is delegated to nutrient_resolve.resolve() -- the ONE resolver (R3), which already
knows ALA/EPA/DHA -> omega-3 and LA/GLA/arachidonic -> omega-6. No fatty-acid name list lives
here; a second list would be a second truth.

DETERMINISTIC (R1): no wall-clock, sorted keys -- a fresh build_data() byte-equals disk.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
PRODUCTS_PATH = ROOT / "eden" / "products" / "products.json"
CLAIMS_DIR = ROOT / "eden" / "corpus" / "claims"
OUT_PATH = ROOT / "dashboard" / "assets" / "data" / "efa-coverage-data.json"

sys.path.insert(0, str(ROOT / "tools"))
sys.path.insert(0, str(ROOT / "eden" / "tools"))
import safe_write  # noqa: E402
import nutrient_resolve as nr  # noqa: E402

GROUP = "essential-fatty-acids"
MEMBERS = ("omega-3", "omega-6")   # Wallach's two designated EFAs; omega-9 is NOT one
G_TO_MG = 1000.0


class DeriveError(RuntimeError):
    pass


def _collective_claim():
    """The sealed dose claim carrying dose.collective_group == GROUP. Found by its STATED fact,
    not by a hard-coded id -- so a re-seal that renumbers cannot silently orphan this goal."""
    hits = []
    for shard in sorted(CLAIMS_DIR.glob("claims-*.json")):
        for c in json.loads(shard.read_text(encoding="utf-8")).get("claims", []):
            if c.get("kind") != "dose":
                continue
            dz = c.get("dose") or {}
            if dz.get("collective_group") == GROUP:
                hits.append(c)
    if len(hits) != 1:
        raise DeriveError(f"expected exactly 1 sealed collective dose claim for {GROUP!r}, found {len(hits)}")
    return hits[0]


def _rows(prod):
    """(name, form, amount, unit) for every quantified row — top-level nutrients + blend
    ingredients. Mirrors pdm_coverage_derive._rows."""
    out = []
    for comp in prod.get("components", []) or []:
        for nut in comp.get("nutrients", []) or []:
            out.append((nut.get("name"), nut.get("form"), nut.get("amount"), nut.get("unit")))
        for bl in comp.get("blends", []) or []:
            for ing in bl.get("ingredients", []) or []:
                out.append((ing.get("name"), ing.get("form"), ing.get("amount"), ing.get("unit")))
    return out


def _efa_mg(prod):
    """Per-serving mg of Wallach's two EFAs. Identity via the ONE resolver; unit via its
    to_canonical (fatty acids canonicalise to mg). Non-scalar label values ('<20') and
    unconvertible units return None from to_canonical and are skipped, never guessed."""
    total = 0.0
    by_member = {}
    for name, form, amount, unit in _rows(prod):
        slug = nr.resolve(name, form)
        if slug not in MEMBERS:
            continue
        conv = nr.to_canonical(amount, unit, slug)
        if conv is None:
            continue
        mg, cu = conv
        if cu != "mg":
            raise DeriveError(f"{slug} canonical unit {cu!r} is not mg — the goal math assumes mg")
        total += mg
        by_member[slug] = round(by_member.get(slug, 0.0) + mg, 4)
    return round(total, 4), by_member


def build_data() -> dict:
    claim = _collective_claim()
    dz = claim["dose"]
    if dz.get("unit") != "g":
        raise DeriveError(f"collective EFA dose unit {dz.get('unit')!r} is not 'g' — the g->mg chain assumes it")
    amount = dz.get("amount")
    if not isinstance(amount, (int, float)):
        raise DeriveError(f"collective EFA dose amount {amount!r} is not a scalar")
    maintenance_mg = round(float(amount) * G_TO_MG, 4)

    products = {}
    pillar = json.loads(PRODUCTS_PATH.read_text(encoding="utf-8"))["products"]
    for pid, prod in sorted(pillar.items()):
        mg, by_member = _efa_mg(prod)
        if mg <= 0:
            continue
        products[pid] = {
            "canonical_name": prod.get("name"),
            "efa_mg": mg,
            "by_member": by_member,
        }

    return {
        "_purpose": (
            "Essential-fatty-acid coverage metric. GENERATED by eden/tools/efa_coverage_derive.py "
            "from the sealed Products pillar (composition mg) + the sealed Wallach dose claim (goal). "
            "Read by state/coverage.ts: omega-3 + omega-6 are scored as ONE group, "
            "Sigma(regimen product efa_mg) / goal.maintenance_mg, because Wallach states ONE amount "
            "for the essential fatty acids as a category. omega-9 is EXCLUDED — he never names oleic "
            "acid an essential fatty acid. Never hand-edit; run eden/tools/build_embeds.py."
        ),
        "goal": {
            "collective_group": GROUP,
            "maintenance_mg": maintenance_mg,
            "members": list(MEMBERS),
            "provenance": {
                "formula": "maintenance_mg = wallach_dose_amount x 1000 (g->mg unit change only)",
                "note": (
                    "No body-weight or calorie scaling: Wallach states the finished supplement "
                    "amount himself ('supplemented at the rate of 9 grams per day in capsule form'), "
                    "so no reference is supplied here. His '3 percent of total daily calorie "
                    "consumption' is the same requirement expressed the other way."
                ),
                "wallach_dose_amount": amount,
                "wallach_dose_unit": dz.get("unit"),
            },
            "source_claim_id": claim["id"],
            "unit": "mg",
        },
        "products": products,
    }


def validate(d: dict) -> list:
    errs = []
    g = d.get("goal", {})
    if not g.get("source_claim_id"):
        errs.append("goal.source_claim_id missing")
    if not isinstance(g.get("maintenance_mg"), (int, float)) or g["maintenance_mg"] <= 0:
        errs.append(f"goal.maintenance_mg {g.get('maintenance_mg')!r} is not a positive number")
    if list(g.get("members") or []) != list(MEMBERS):
        errs.append(f"goal.members {g.get('members')!r} != {list(MEMBERS)}")
    for pid, r in (d.get("products") or {}).items():
        if not isinstance(r.get("efa_mg"), (int, float)) or r["efa_mg"] <= 0:
            errs.append(f"{pid}: efa_mg {r.get('efa_mg')!r} is not a positive number")
        stray = set(r.get("by_member") or {}) - set(MEMBERS)
        if stray:
            errs.append(f"{pid}: by_member carries non-EFA slug(s) {sorted(stray)}")
    return errs


def write_data() -> int:
    data = build_data()
    errs = validate(data)
    if errs:
        raise DeriveError("validate() failed:\n  - " + "\n  - ".join(errs))
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    return safe_write.safe_rewrite(OUT_PATH, json.dumps(data, ensure_ascii=False, sort_keys=True, indent=2) + "\n")


if __name__ == "__main__":
    d = build_data()
    errs = validate(d)
    if errs:
        print("VALIDATE FAILED:\n  - " + "\n  - ".join(errs))
        sys.exit(1)
    n = write_data()
    print(f"OK  wrote efa-coverage-data.json ({n} B) · goal {d['goal']['maintenance_mg']}mg "
          f"({d['goal']['provenance']['wallach_dose_amount']} {d['goal']['provenance']['wallach_dose_unit']}) "
          f"from {d['goal']['source_claim_id']} · {len(d['products'])} EFA-bearing product(s)")
