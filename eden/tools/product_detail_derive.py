#!/usr/bin/env python3
"""product_detail_derive.py — the product DISPLAY artifact generator (Products surface).

Derives dashboard/assets/data/product-detail-data.json — the full per-product
display record read by the Knowledge Products surface (views/knowledge-products.ts):
the Products-tab list, the product detail panel, and the essentials "FOUND IN YGY
VAULT" chips. Exposes the manifest generator contract the freshness gate +
build_embeds iterate:

  build_data() -> dict   (PURE; derived_artifacts_fresh byte-compares it to disk,
                          so it MUST be deterministic -- no wall-clock timestamp)
  write_data() -> int    (regenerates the on-disk artifact via safe_write)

SOURCE: eden/products/products.json (composition, the sealed pillar) joined with
eden/products/prices.json PRICE fields by ygy_id. This is DISPLAY data only
(§00.A): an amount is what a product CONTAINS (never a Wallach target), and a
price is an indicative YGY listing (source:ygy, volatile) -- neither ever feeds
the coverage math. The marketing `description` no longer exists in prices.json and
is NEVER copied here (no_product_marketing_prose forbids the key anyway).

Distinct from products_embed.py's slim regimen-label-lookup vault (that stays
{canonical_name, nutrients} for the Regimen add-to-cartridge + coverage path).
This richer artifact carries the whole label structure the detail panel shows.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
PRODUCTS_PATH = ROOT / "eden" / "products" / "products.json"
PRICES_PATH = ROOT / "eden" / "products" / "prices.json"
ARTIFACT_PATH = ROOT / "dashboard" / "assets" / "data" / "product-detail-data.json"

sys.path.insert(0, str(ROOT / "tools"))
import safe_write  # noqa: E402

# Display-relevant component fields (drop the internal source_label provenance).
_COMPONENT_FIELDS = (
    "role", "form", "serving_size", "servings_per_container", "directions",
    "macros", "nutrients", "blends", "other_ingredients",
)
# Variant display fields (drop the internal source_label).
_VARIANT_FIELDS = ("sku", "ygy_id", "name", "form")


def _price_for(ygy_id, prices: dict):
    """The {retail, wholesale} listing for a product's ygy_id, or None. PRICE fields
    ONLY -- the marketing description is never read."""
    if ygy_id is None:
        return None
    entry = prices.get(str(ygy_id))
    if not isinstance(entry, dict):
        return None
    retail = entry.get("price_retail")
    wholesale = entry.get("price_wholesale")
    if retail is None and wholesale is None:
        return None
    return {"retail": retail, "wholesale": wholesale}


def _clean_component(comp: dict) -> dict:
    """Keep the display fields (label structure); drop internal source_label."""
    out: dict = {}
    for k in _COMPONENT_FIELDS:
        v = comp.get(k)
        if v not in (None, [], {}):
            out[k] = v
    return out


def build_data() -> dict:
    """PURE derive of the full product-display artifact, keyed by product_id. No
    writes, no wall-clock timestamp, so a fresh call always equals the on-disk
    artifact (the freshness gate's contract)."""
    pillar = json.loads(PRODUCTS_PATH.read_text(encoding="utf-8"))
    products = pillar.get("products", {})
    prices = json.loads(PRICES_PATH.read_text(encoding="utf-8")).get("prices", {})

    out_products: dict = {}
    priced = 0
    for product_id, prod in products.items():
        name = prod.get("name")
        if not name:
            continue
        rec: dict = {"product_id": prod.get("product_id", product_id), "name": name}
        for k in ("sku", "ygy_id"):
            if prod.get(k) is not None:
                rec[k] = prod[k]
        variants = prod.get("variants")
        if variants:
            rec["variants"] = [
                {k: v.get(k) for k in _VARIANT_FIELDS if v.get(k) is not None}
                for v in variants
            ]
        price = _price_for(prod.get("ygy_id"), prices)
        rec["price"] = price
        if price is not None:
            priced += 1
        rec["components"] = [_clean_component(c) for c in prod.get("components", []) or []]
        out_products[product_id] = rec

    return {
        "_meta": {
            "purpose": (
                "Full per-product DISPLAY record keyed by product_id -- the whole "
                "label structure (components: serving, directions, nutrients, blends, "
                "other ingredients) + an indicative YGY listing price {retail, "
                "wholesale} joined from prices.json by ygy_id. Read by the Knowledge "
                "Products surface (views/knowledge-products.ts). GENERATED from "
                "eden/products/products.json + prices.json -- never hand-edited (R1). "
                "DISPLAY ONLY (§00.A): composition is what a product contains + price "
                "is a volatile listing; neither is a Wallach target. NO marketing "
                "prose (no_product_marketing_prose)."
            ),
            "source": "eden/products/products.json + eden/products/prices.json",
            "generator": "eden/tools/product_detail_derive.py",
            "product_count": len(out_products),
            "priced_count": priced,
        },
        "products": out_products,
    }


def write_data() -> int:
    """Regenerate the on-disk artifact via safe_write. Returns byte count."""
    ARTIFACT_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(build_data(), ensure_ascii=False, indent=2)
    return safe_write.safe_rewrite(str(ARTIFACT_PATH), payload)


if __name__ == "__main__":
    n = write_data()
    d = build_data()
    print(f"OK  wrote product-detail-data.json ({n} B) - "
          f"{d['_meta']['product_count']} products, {d['_meta']['priced_count']} priced")
