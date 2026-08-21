#!/usr/bin/env python3
"""pdm_coverage_derive.py — the plant-derived mineral coverage metric (goal + per-product vehicle mg).

Generates dashboard/assets/data/pdm-coverage-data.json — read by state/coverage.ts to score the
34 trace_pdm minerals as ONE GROUP against Wallach's plant-derived colloidal-mineral dose.
Those 34 carry no individual Wallach dose; instead they are covered collectively by any
plant-derived-mineral source in the regimen, measured Sigma(vehicle mg) / goal.

WHY STRONTIUM IS IN THIS GROUP, on Wallach's OWN words: humic shale IS the plant-derived
source -- "Humic Shale is a plant derived colloidal nutritional supplement"
(rare-earths-forbidden-cures.txt:20815) -- and his own assay of that shale lists Strontium at
14.0 ppm (rare-earths:20827, Table 10-5). Being FROM humic shale is what MAKES a mineral
plant-derived; it is not an exception to it.

The layout's PLANT DERIVED section and this metric read the same target.kind. The SECTIONS ARE
the dose structure itself (FOUNDATIONAL / INDIVIDUALLY DOSED / PLANT DERIVED). Cobalt renders in
INDIVIDUALLY DOSED via target.kind 'mirrors': it states no amount of its own and inherits vitamin
B12's verdict.

★ TIN IS NOT A COUNTEREXAMPLE TO THIS GROUP -- it is a SECOND, INDEPENDENT ROUTE, and this
docstring asserted the opposite until 2026-08-20. Tin keeps its own sealed 500 mcg dose and
still renders in INDIVIDUALLY DOSED, where that number still scores. It ALSO carries
target.vehicle_supplied, because Wallach names this vehicle as its supply route in his own
words -- "tin from plant derived colloidal minerals" (WAL-CLM-LETS-000451, 1995; repeated in
DDDL-000406/465/466, 2011), with DDDL-000287 recording his own hair regrowth using plant-derived
liquid colloidal tin. No food source for tin is named anywhere in the seven books. So
state/coverage.ts takes the BETTER of the vehicle verdict and the numeric one. The membership
list and its citations live in trace-mineral-vehicles.json; this file does not own that rule.

SILVER IS NOT IN THAT LIST. Wallach lists colloidal silver and the vehicle side by side as
SEPARATE items, which would be redundant if the vehicle supplied silver. Presence on the
humic-shale roster is not supply -- that roster also lists calcium.

NOT "the rare earths" -- do not rename it back. 19 of these 34 are not rare earths by Wallach's
own tagging: he header-tags exactly 15 of the 60 in Immortality's A-Z (cerium :5760 through
ytterbium :10233) and pointedly calls scandium "a rare element" (:9514), NOT a rare earth. This
group is defined by HAVING NO INDIVIDUAL WALLACH DOSE, never by chemistry.

TWO INPUTS, joined here (derive-don't-duplicate, R1):
  - eden/products/products.json (SEALED pillar) — the COMPOSITION: each vehicle product's
    per-serving plant-derived / trace-mineral mg (a quantified nutrient row or a blend total).
    §00.A: composition feeds the coverage math, never a target.
  - dashboard/assets/data/trace-mineral-vehicles.json (hand-authored, 'accounted') — the curated
    JUDGMENT: which products count, group (A/B/C/D), mode (amount/present), the tunable group
    factors, and the goal model. NO amount lives there; the amounts are pulled from the pillar.

THE GOAL (§00.A / R2). Wallach's maintenance dose of liquid plant-derived colloidal minerals is
1 fl oz per 100 lb/day (WAL-CLM-EPIGEN-000089, Epigenetics 2014; corroborated in Let's Play
Doctor). One serving of the reference product (plant-derived-minerals) = 1 fl oz = its per-serving
mg (COMPOSITION, read from the pillar). Scaled to the 154 lb reference adult (as every other
target), maintenance_mg = dose_amount x ref_mg_per_oz x (154 / per_bw_lb). Therapeutic = x2
(Wallach's "double the base line" doctrine). So the number is a Wallach dose expressed in mg via
composition — it cites the sealed claim; it is NOT a Youngevity target (source-rule review
2026-07-12, chronicle/contradictions/2026-07-12-trace-rare-600mg-goal-source.md).

DETERMINISTIC (R1): no wall-clock timestamp, sorted keys — a fresh build_data() byte-equals disk.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
PRODUCTS_PATH = ROOT / "eden" / "products" / "products.json"
CONFIG_PATH = ROOT / "dashboard" / "assets" / "data" / "trace-mineral-vehicles.json"
CLAIMS_DIR = ROOT / "eden" / "corpus" / "claims"
OUT_PATH = ROOT / "dashboard" / "assets" / "data" / "pdm-coverage-data.json"

BODY_WEIGHT_LB = 154  # 70 kg reference adult; mirrors targets_derive.BODY_WEIGHT_LB

sys.path.insert(0, str(ROOT / "tools"))
import safe_write  # noqa: E402


class DeriveError(Exception):
    """A structural failure — the derive refuses rather than emit a wrong metric."""


def _to_mg(amount: float, unit) -> float:
    """Composition amount -> mg. Mirrors coverage.ts toMg for the mass units the vehicles use."""
    u = (unit or "mg").lower().strip()
    if u.startswith("mcg") or u.startswith("ug") or "µg" in u or "μg" in u:
        return amount / 1000.0
    if u == "g" or u.startswith("gram"):
        return amount * 1000.0
    return amount  # mg + unknown -> mg-family


def _load_json(p: Path):
    return json.loads(p.read_text(encoding="utf-8"))


def _dose_claim(claim_id: str) -> dict:
    """The sealed Wallach dose claim behind the goal (read straight from the sealed shard)."""
    for shard in sorted(CLAIMS_DIR.glob("claims-*.json")):
        for c in _load_json(shard).get("claims", []):
            if c.get("id") == claim_id:
                return c
    raise DeriveError(f"dose claim {claim_id!r} not found in the sealed corpus")


def _num(v):
    if isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, str):
        m = re.match(r"\s*([\d.]+)", v)
        if m:
            return float(m.group(1))
    return None


def _matches(name, patterns) -> bool:
    n = (name or "").lower()
    return any(p in n for p in patterns)


def _vehicle_rows(prod: dict):
    """(name, amount, unit) for every quantified vehicle-eligible row — top-level nutrients
    and blend TOTALS (the vehicle mg lives in one or the other). other_ingredients carriers
    have no amount and are handled by mode 'present', not here (so a double-listed PDM that is
    also a bare other-ingredient is counted ONCE, via its quantified row)."""
    rows = []
    for comp in prod.get("components", []) or []:
        for nut in comp.get("nutrients", []) or []:
            amt = _num(nut.get("amount"))
            if amt is not None:
                rows.append((nut.get("name"), amt, nut.get("unit")))
        for bl in comp.get("blends", []) or []:
            tot = bl.get("total") or {}
            amt = _num(tot.get("amount"))
            if amt is not None:
                rows.append((bl.get("name"), amt, tot.get("unit")))
    return rows


def _by_group(prod: dict, cfg: dict, patterns) -> dict:
    """Raw vehicle mg per group for one amount-mode product. A product with an explicit `rows`
    override (multi-group, e.g. Ultimate Mineral Caps PDM+Aquamin) attributes each matched row
    to its named group; otherwise every vehicle-pattern row rolls into the product's `group`."""
    rows = _vehicle_rows(prod)
    out: dict = {}
    if "rows" in cfg:
        for spec in cfg["rows"]:
            frag = spec["match"].lower()
            mg = sum(_to_mg(a, u) for n, a, u in rows if frag in (n or "").lower())
            if mg > 0:
                out[spec["group"]] = round(out.get(spec["group"], 0.0) + mg, 4)
    else:
        mg = sum(_to_mg(a, u) for n, a, u in rows if _matches(n, patterns))
        if mg > 0:
            out[cfg["group"]] = round(mg, 4)
    return out


def build_data() -> dict:
    products = _load_json(PRODUCTS_PATH).get("products", {})
    cfg = _load_json(CONFIG_PATH)
    patterns = [p.lower() for p in cfg["vehicle_name_patterns"]]
    factors = cfg["group_factors"]
    gm = cfg["goal_model"]

    # ── goal ── Wallach dose (sealed claim) x reference-product composition (pillar) x 154 lb
    claim = _dose_claim(gm["wallach_dose_claim_id"])
    dose = claim.get("dose") or {}
    dose_amt = _num(dose.get("amount"))
    per_bw = _num((dose.get("per_body_weight") or "").replace("lb", ""))
    if dose_amt is None or not per_bw:
        raise DeriveError(f"{gm['wallach_dose_claim_id']} lacks a usable dose amount / per_body_weight")

    ref_id = gm["reference_composition_product_id"]
    ref_prod = products.get(ref_id)
    if ref_prod is None:
        raise DeriveError(f"reference composition product {ref_id!r} not in the pillar")
    ref_serv = " ".join(str(c.get("serving_size") or "") for c in ref_prod.get("components", []))
    m = re.search(r"([\d.]+)\s*fl\s*oz", ref_serv, re.IGNORECASE)
    if not m:
        raise DeriveError(f"{ref_id} serving_size {ref_serv!r} does not state fl oz — cannot anchor mg/oz")
    serv_oz = float(m.group(1))
    ref_mg = sum(v for v in _by_group(ref_prod, cfg["products"][ref_id], patterns).values())
    if ref_mg <= 0 or serv_oz <= 0:
        raise DeriveError(f"reference {ref_id}: mg={ref_mg} serv_oz={serv_oz} — cannot form the goal")
    ref_mg_per_oz = ref_mg / serv_oz
    maintenance = round(dose_amt * ref_mg_per_oz * BODY_WEIGHT_LB / per_bw, 2)

    goal = {
        "maintenance_mg": maintenance,
        "unit": "mg",
        "source_claim_id": gm["wallach_dose_claim_id"],
        "provenance": {
            "wallach_dose_amount": dose_amt,
            "wallach_dose_unit": dose.get("unit"),
            "wallach_dose_per_body_weight_lb": per_bw,
            "reference_product_id": ref_id,
            "reference_serving_fl_oz": serv_oz,
            "reference_mg_per_serving": round(ref_mg, 4),
            "reference_mg_per_fl_oz": round(ref_mg_per_oz, 4),
            "body_weight_lb": BODY_WEIGHT_LB,
            "formula": "maintenance_mg = dose_amount x (reference_mg / serving_fl_oz) x (body_weight_lb / per_bw_lb)",
        },
    }

    # ── per-product vehicle mg ──
    out_products: dict = {}
    for pid, pc in sorted(cfg["products"].items()):
        prod = products.get(pid)
        if prod is None:
            raise DeriveError(f"config product {pid!r} not in the pillar")
        name = prod.get("name")
        if pc.get("mode") == "present":
            out_products[pid] = {"canonical_name": name, "pdm_mg": 0.0, "present": True, "by_group": {}}
            continue
        by_group = _by_group(prod, pc, patterns)
        pdm_mg = round(sum(mg * float(factors.get(g, 1.0)) for g, mg in by_group.items()), 4)
        out_products[pid] = {
            "canonical_name": name,
            "pdm_mg": pdm_mg,
            "present": False,
            "by_group": {g: by_group[g] for g in sorted(by_group)},
        }

    return {
        "_purpose": (
            "Trace/rare-mineral coverage metric. GENERATED by eden/tools/pdm_coverage_derive.py from "
            "the sealed Products pillar (composition mg) + the curated trace-mineral-vehicles.json "
            "(judgment) + the sealed Wallach dose claim (goal). Read by state/coverage.ts: the 34 "
            "trace_pdm minerals are scored as one group, Sigma(regimen product pdm_mg) / goal.maintenance_mg. "
            "goal is a Wallach dose expressed in mg via composition (§00.A-clean; cites source_claim_id). "
            "Never hand-edit; run eden/tools/build_embeds.py."
        ),
        "goal": goal,
        "group_factors": {g: float(factors[g]) for g in sorted(factors) if not g.startswith("_")},
        "products": out_products,
    }


def validate(data: dict):
    """Structural gate shared with the invariant: goal present + positive, every amount-mode
    product yields a positive pdm_mg (a zero would mean a vehicle pattern silently missed)."""
    errs = []
    g = data.get("goal", {})
    if not isinstance(g.get("maintenance_mg"), (int, float)) or g["maintenance_mg"] <= 0:
        errs.append("goal.maintenance_mg missing or non-positive")
    if not g.get("source_claim_id"):
        errs.append("goal.source_claim_id missing (goal must cite a Wallach dose claim)")
    for pid, rec in data.get("products", {}).items():
        if rec.get("present"):
            if rec.get("pdm_mg", 0) != 0:
                errs.append(f"{pid}: present-mode must have pdm_mg 0")
        elif not (isinstance(rec.get("pdm_mg"), (int, float)) and rec["pdm_mg"] > 0):
            errs.append(f"{pid}: amount-mode product has no positive pdm_mg (vehicle pattern missed?)")
    return errs


def render() -> str:
    return json.dumps(build_data(), ensure_ascii=False, sort_keys=True, indent=2) + "\n"


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
    amount_n = sum(1 for r in d["products"].values() if not r["present"])
    print(f"OK  wrote pdm-coverage-data.json ({n} B) · goal {d['goal']['maintenance_mg']}mg maint · "
          f"{amount_n} amount + {len(d['products']) - amount_n} present products")
