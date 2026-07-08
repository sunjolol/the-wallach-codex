#!/usr/bin/env python3
"""nutrient_resolve.py — resolve a Product-DB substance name to the canonical registry.

Every quantified substance in the Product DB resolves to either:
  - an ESSENTIAL (one of the 91 in essentials-canon) -> feeds the coverage math, or
  - None (a BOTANICAL / ACTIVE) -> its own entry for blend/ingredient search + potency compare.

Resolution is rule-based (strip L-/D-/DL-; vitamin-number <-> chemical name; fatty-acid
classification by name/form; direct mineral/amino match against the canon) plus a small
explicit ALIAS table for what rules can't cover. This is the IDENTITY layer; unit
conversion is a separate concern (the amounts are already mg/mcg/g/iu, convertible).

Design note (2026-07-08): all 91 Wallach targets are currently honest gaps, so the
"% toward target" verdict awaits corpus dose mining; this resolver already enables
composition aggregation, cost-per-nutrient, and potency comparison.

CLI: `python nutrient_resolve.py report`  (validates every substance + known values).
Exit 0 = every substance resolved or classified + all known-value assertions pass.
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
CANON = json.loads((ROOT/"eden"/"corpus"/"essentials-canon.json").read_text(encoding="utf-8"))["essentials"]
PRODUCTS = json.loads((ROOT/"eden"/"products"/"products.json").read_text(encoding="utf-8"))["products"]

DISPLAY2SLUG = {e["display_name"]: e["slug"] for e in CANON}
CAT = {e["slug"]: e["category"] for e in CANON}
MINERALS = {e["display_name"].lower(): e["slug"] for e in CANON if e["category"] == "mineral"}
AMINOS   = {e["display_name"].lower(): e["slug"] for e in CANON if e["category"] == "amino_acid"}

# product vitamin-name -> canon display_name (then -> slug)
VIT_ALIAS = {
    "vitamin a": "Retinol", "retinol": "Retinol",
    "vitamin b1": "Thiamine", "thiamin": "Thiamine", "thiamine": "Thiamine",
    "vitamin b2": "Riboflavin", "riboflavin": "Riboflavin",
    "vitamin b3": "Niacin", "niacin": "Niacin", "niacinamide": "Niacin",
    "vitamin b5": "Pantothenic Acid", "pantothenic acid": "Pantothenic Acid",
    "vitamin b6": "Pyridoxine", "pyridoxine": "Pyridoxine",
    "folate": "Folate", "folic acid": "Folate",
    "vitamin b12": "Cobalamin", "cobalamin": "Cobalamin",
    "vitamin c": "Ascorbic Acid", "ascorbic acid": "Ascorbic Acid",
    "vitamin d": "Cholecalciferol", "vitamin d3": "Cholecalciferol", "cholecalciferol": "Cholecalciferol",
    "vitamin e": "Tocopherol", "tocopherol": "Tocopherol",
    "vitamin k": "Phylloquinone", "vitamin k1": "Phylloquinone", "phylloquinone": "Phylloquinone",
    "vitamin k2": "Phylloquinone",   # decision #1: K2 (menaquinone) credits the vitamin-K essential
    "biotin": "Biotin", "choline": "Choline", "inositol": "Inositol",
    "flavonoids": "Flavonoids", "bioflavonoids": "Flavonoids",
    "citrus bioflavonoids": "Flavonoids", "citrus bioflavonoid complex": "Flavonoids",
}
MIN_ALIAS = {"silicon": "silica", "phosphorous": "phosphorus", "sulfate": "sulfur"}  # decision #2
# canonical unit per essential for aggregation display (standard supplement unit; trace -> mcg)
TRACE_MCG = {"selenium","chromium","iodine","molybdenum","boron","vanadium"}
def canonical_unit(slug):
    c = CAT.get(slug)
    if c == "amino_acid" or c == "fatty_acid": return "mg"
    if c == "vitamin": return {"retinol":"mcg","cholecalciferol":"mcg","phylloquinone":"mcg",
                               "cobalamin":"mcg","folate":"mcg","biotin":"mcg"}.get(slug, "mg")
    if c == "mineral": return "mcg" if slug in TRACE_MCG else "mg"
    return None

def strip_stereo(n):
    for p in ("l-", "d-", "dl-"):
        if n.startswith(p): return n[len(p):]
    return n

def fa_of(name, form):
    s = f"{name} {form or ''}".lower()
    if re.search(r'omega\s*3|alpha-linolenic|\bala\b|eicosapentaenoic|\bepa\b|docosahexaenoic|\bdha\b', s): return "omega-3"
    if re.search(r'omega\s*6|linoleic|\bla\b|gamma-linolenic|\bgla\b|arachidonic', s): return "omega-6"
    if re.search(r'omega\s*9|oleic|\boa\b', s): return "omega-9"
    return None

def resolve(name, form=None):
    """Return an essential slug, or None if the substance is a botanical/active."""
    if not name: return None
    n = name.strip().lower()
    for ch in "™®©": n = n.replace(ch, "")
    n = n.strip()
    fa = fa_of(name, form)
    if fa: return fa
    if n in VIT_ALIAS: return DISPLAY2SLUG[VIT_ALIAS[n]]
    if n in MINERALS: return MINERALS[n]
    if n in MIN_ALIAS: return MIN_ALIAS[n]
    a = strip_stereo(n).split(" ")[0].strip()
    if a in AMINOS: return AMINOS[a]
    return None

# ---------------- report / self-test ----------------
def report():
    from collections import defaultdict
    ess_cov = defaultdict(lambda: {"amt": {}, "noamt": set()})
    botanicals = defaultdict(int)
    for pid, r in PRODUCTS.items():
        for c in r["components"]:
            items = [(n.get("name"), n.get("form"), n.get("amount"), n.get("unit")) for n in c.get("nutrients", [])]
            for b in c.get("blends", []):
                for ing in b.get("ingredients", []):
                    items.append((ing.get("name"), ing.get("form"), ing.get("amount"), ing.get("unit")))
                    for s in ing.get("sub_ingredients", []) or []:
                        items.append((s.get("name"), s.get("form"), s.get("amount"), s.get("unit")))
            for name, form, amt, unit in items:
                slug = resolve(name, form)
                if slug:
                    if amt is not None: ess_cov[slug]["amt"].setdefault(pid, f"{amt}{unit}")
                    else: ess_cov[slug]["noamt"].add(pid)
                elif name:
                    botanicals[name] += 1

    hit = sum(1 for s in DISPLAY2SLUG.values() if ess_cov[s]["amt"] or ess_cov[s]["noamt"])
    with_amt = sum(1 for s in DISPLAY2SLUG.values() if ess_cov[s]["amt"])
    print(f"essentials touched: {hit}/91 | with a usable amount: {with_amt}/91 | distinct botanicals: {len(botanicals)}")

    # known-value assertions (identity + amounts we hand-verified against labels)
    checks = [
        ("Vitamin A -> vitamin-a", resolve("Vitamin A") == "vitamin-a"),
        ("Thiamin -> vitamin-b1", resolve("Thiamin") == "vitamin-b1"),
        ("Vitamin B6 -> vitamin-b6", resolve("Vitamin B6") == "vitamin-b6"),
        ("Folic Acid -> vitamin-b9", resolve("Folic Acid") == "vitamin-b9"),
        ("L-Arginine -> arginine", resolve("L-Arginine") == "arginine"),
        ("Taurine -> taurine", resolve("Taurine") == "taurine"),
        ("Silicon -> silica", resolve("Silicon") == "silica"),
        ("Phosphorous -> phosphorus", resolve("Phosphorous") == "phosphorus"),
        ("Vitamin K2 -> vitamin-k", resolve("Vitamin K2") == "vitamin-k"),
        ("ALA(form Omega 3) -> omega-3", resolve("Alpha-Linolenic Acid (ALA)", "Omega 3") == "omega-3"),
        ("EPA -> omega-3", resolve("EPA") == "omega-3"),
        ("PABA -> botanical(None)", resolve("PABA") is None),
        ("Caffeine -> botanical(None)", resolve("Caffeine") is None),
        ("CoQ10 -> botanical(None)", resolve("CoQ10") is None),
        ("Taurine amount in rebound-fx-citrus-punch = 200mg",
         ess_cov["taurine"]["amt"].get("rebound-fx-citrus-punch") == "200mg"),
    ]
    ok = True
    print("\nknown-value checks:")
    for label, passed in checks:
        print(f"  [{'PASS' if passed else 'FAIL'}] {label}")
        ok = ok and passed

    print(f"\nbotanicals/actives (top 40 — scan for any MISSED essential):")
    for nm, cnt in sorted(botanicals.items(), key=lambda x: -x[1])[:40]:
        print(f"  {cnt:>3}  {nm}")

    return 0 if ok else 1

if __name__ == "__main__":
    sys.exit(report())
