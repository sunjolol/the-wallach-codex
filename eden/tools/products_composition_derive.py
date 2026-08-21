#!/usr/bin/env python3
"""products_composition_derive.py -- derive the product COMPOSITION rollup from the sealed
Products pillar via the nutrient registry.

Two authoritative rollups the registry enables, both DERIVED (never hand-edited):
  - essentials: per essential (of the 91), which products deliver it + how much, summed per
    product and converted to the essential's canonical unit (nutrient_resolve.to_canonical).
    Powers cost-per-nutrient ("cheapest product for my selenium goal") +, later, the Coverage
    delivery when the runtime matcher is unified onto the registry (it will read THIS -- so the
    pillar's resolution has ONE authoritative home).
  - botanicals: the canonical botanical/active search vocabulary (canonicalize + slug_of),
    each -> the products that contain it. Powers blend/ingredient search.

Nutrient panel rows AND blend ingredients are distinct label entries -> both summed (additive).
Sub-ingredients (actives named inside a blend ingredient) are currently all botanicals, so they
never double-count an essential; they are included for completeness.

DETERMINISTIC: no timestamp; every list sorted; amounts rounded (4dp). Composition only
(§00.A): an `amount` is what a product CONTAINS, never a Wallach target.

Contract (eden/derived/MANIFEST.json): build_data() -> object (pure; the derived_artifacts_fresh
gate compares json.loads(disk) == build_data()); write_data() -> regenerates via safe_write.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
ARTIFACT = ROOT / "eden" / "derived" / "product-composition.json"
sys.path.insert(0, str(ROOT / "eden" / "tools"))
import nutrient_resolve as nr  # noqa: E402


def build_data() -> dict:
    disp = {e["slug"]: e["display_name"] for e in nr.CANON}
    ess: dict = {}          # essential slug -> {product_id -> {"amount": sum, "rows": n}}
    ess_unit: dict = {}     # essential slug -> canonical unit
    unconverted: list = []  # essential rows we could NOT convert (should stay empty)
    bot: dict = {}          # botanical slug -> {"name": canonical, "products": set}

    for pid, r in sorted(nr.PRODUCTS.items()):
        for c in r["components"]:
            rows = list(c.get("nutrients", []))
            for b in c.get("blends", []):
                for ing in b.get("ingredients", []):
                    rows.append(ing)
                    for s in ing.get("sub_ingredients", []) or []:
                        rows.append(s)
            for row in rows:
                name, form = row.get("name"), row.get("form")
                amt, unit = row.get("amount"), row.get("unit")
                slug = nr.resolve(name, form)
                if slug:
                    if amt is None:
                        continue  # unquantified (%DV-only) row -- presence, no summable amount
                    conv = nr.to_canonical(amt, unit, slug)
                    if conv is None:
                        unconverted.append({"product_id": pid, "name": name,
                                            "amount": amt, "unit": unit, "essential": slug})
                        continue
                    val, cu = conv
                    ess_unit[slug] = cu
                    pe = ess.setdefault(slug, {}).setdefault(pid, {"amount": 0.0, "rows": 0})
                    pe["amount"] += val
                    pe["rows"] += 1
                elif name:
                    e = bot.setdefault(nr.slug_of(name),
                                       {"name": nr.canonicalize(name), "products": set()})
                    e["products"].add(pid)

    essentials = {}
    for e in nr.CANON:                       # canon order
        slug = e["slug"]
        if slug not in ess:
            continue
        # best source first: amount DESC, product_id ASC as the deterministic tiebreak. This is
        # the RAW highest-first view; the intelligent match-score recommender (saturating adequacy
        # + breadth + banded cost) is a separate ranking feature, not this rollup.
        products = sorted(
            ({"product_id": pid, "amount": round(v["amount"], 4), "rows": v["rows"]}
             for pid, v in ess[slug].items()),
            key=lambda x: (-x["amount"], x["product_id"]))
        essentials[slug] = {"display_name": disp[slug], "unit": ess_unit[slug],
                            "product_count": len(products), "products": products}

    botanicals = {s: {"name": bot[s]["name"], "product_count": len(bot[s]["products"]),
                      "products": sorted(bot[s]["products"])}
                  for s in sorted(bot)}

    return {
        "schema_version": 1,
        "_doctrine": ("Derived product COMPOSITION rollup (Phase F). essentials: per essential, "
                      "the products that deliver it + summed amount in the canonical unit. "
                      "botanicals: canonical search vocab -> products. Composition only (SS00.A): "
                      "an amount is what a product CONTAINS, never a Wallach target. GENERATED "
                      "from eden/products/products.json + eden/catalog/nutrients.json via "
                      "nutrient_resolve; freshness-gated, never hand-edited."),
        "essentials": essentials,
        "botanicals": botanicals,
        "_stats": {"essentials_with_a_product": len(essentials),
                   "distinct_botanicals": len(botanicals),
                   "unconverted_essential_rows": unconverted},
    }


def write_data() -> int:
    sys.path.insert(0, str(ROOT / "tools"))
    from safe_write import safe_rewrite
    text = json.dumps(build_data(), indent=2, ensure_ascii=False) + "\n"
    safe_rewrite(ARTIFACT, text)
    return len(text.encode("utf-8"))


if __name__ == "__main__":
    n = write_data()
    print(f"product-composition.json regenerated ({n} B)")
