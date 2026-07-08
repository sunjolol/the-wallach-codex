#!/usr/bin/env python3
"""recommender_derive.py -- the cost-per-nutrient RECOMMENDER input artifact (A3, 2026-07-08).

Derives dashboard/assets/data/product-recommender-data.json -- the per-essential
ranking INPUTS the "best source of nutrient X" recommender scores at runtime
(state/recommender.ts). One row per (essential, product): how much of the essential
the product delivers (composition), how many distinct essentials that product
delivers (breadth), and an indicative retail price (the cost tuner).

WHY inputs, not a score: the match-score weights (adequacy / breadth / value) are a
transparent runtime tuner -- Luneth eyeballs real outputs and adjusts (memory
cost-per-nutrient-match-score). Baking a float score here would (a) make the
artifact non-deterministic to re-tune and (b) hide the formula from the code that
owns it. So this artifact carries only the deterministic raw facts; the curve lives
in state/.

SOURCES + boundary (§00.A):
  - amount  <- product COMPOSITION (products_composition_derive.build_data(), the
               registry rollup: nutrient_resolve + to_canonical, summed per product,
               canonical unit). Composition is what a product CONTAINS -- NEVER a
               Wallach target.
  - breadth <- the same composition rollup (distinct essentials a product delivers).
  - price   <- prices.json retail (source:ygy, VOLATILE commercial data). A cost
               tuner for the recommender ONLY -- it never touches the coverage math
               and is never a target.
There is NO Wallach number in this file. The saturating-adequacy term
(min(1, delivered / wallach_target)) that makes "best source" mean *enough* (not
*most*) needs Wallach dose targets, which are all honest gaps until corpus
dose-mining (blueprint task b). Until then the runtime ranks by amount-potency +
breadth + value; adequacy lights up the moment a target carries a number.

Contract (eden/derived/MANIFEST.json): build_data() -> object (PURE + deterministic
-- no timestamp, every list sorted -- so derived_artifacts_fresh byte-compares it to
disk); write_data() -> regenerates the file via safe_write (§17).
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
PRODUCTS_PATH = ROOT / "eden" / "products" / "products.json"
PRICES_PATH = ROOT / "eden" / "products" / "prices.json"
ARTIFACT_PATH = ROOT / "dashboard" / "assets" / "data" / "product-recommender-data.json"

sys.path.insert(0, str(ROOT / "eden" / "tools"))
import products_composition_derive as comp  # noqa: E402


def _retail_by_product(products: dict, prices: dict) -> dict:
    """product_id -> retail price (float) or None, joined by ygy_id (same join key
    product_detail_derive uses). Retail only -- wholesale is a member price, not the
    listing a shopper sees."""
    out: dict = {}
    for pid, prod in products.items():
        ygy_id = prod.get("ygy_id")
        price = None
        if ygy_id is not None:
            entry = prices.get(str(ygy_id))
            if isinstance(entry, dict):
                r = entry.get("price_retail")
                if isinstance(r, (int, float)):
                    price = float(r)
        out[pid] = price
    return out


def build_data() -> dict:
    """PURE derive of the recommender input rows, keyed by essential slug (canon
    order). No writes, no wall-clock timestamp -- a fresh call always equals the
    on-disk artifact (the freshness gate's contract)."""
    composition = comp.build_data()["essentials"]
    products = json.loads(PRODUCTS_PATH.read_text(encoding="utf-8")).get("products", {})
    prices = json.loads(PRICES_PATH.read_text(encoding="utf-8")).get("prices", {})
    retail = _retail_by_product(products, prices)

    # Breadth: distinct essentials each product delivers, across the whole rollup.
    breadth: dict = {}
    for e in composition.values():
        for p in e["products"]:
            breadth[p["product_id"]] = breadth.get(p["product_id"], 0) + 1

    essentials: dict = {}
    priced_rows = 0
    for slug, e in composition.items():
        candidates = []
        for p in e["products"]:
            pid = p["product_id"]
            price = retail.get(pid)
            if price is not None:
                priced_rows += 1
            candidates.append({
                "product_id": pid,
                "amount": p["amount"],          # already 4dp-rounded, canonical unit
                "breadth": breadth.get(pid, 1),
                "price": price,                 # retail float or null
            })
        # RAW deterministic order: amount DESC, product_id ASC (runtime re-sorts by
        # the match score; this keeps the artifact stable + reviewable).
        candidates.sort(key=lambda c: (-c["amount"], c["product_id"]))
        essentials[slug] = {"unit": e["unit"], "candidates": candidates}

    total_rows = sum(len(v["candidates"]) for v in essentials.values())
    return {
        "schema_version": 1,
        "_meta": {
            "purpose": (
                "Per-essential RANKING INPUTS for the cost-per-nutrient recommender "
                "(state/recommender.ts scores these at runtime). Each candidate: "
                "amount (composition, canonical unit -- what the product CONTAINS), "
                "breadth (distinct essentials the product delivers), price (retail, "
                "the cost tuner). GENERATED from eden/products/products.json + "
                "prices.json via products_composition_derive -- never hand-edited (R1). "
                "§00.A: composition + price are DISPLAY/recommender data, never a "
                "Wallach target; there is no Wallach number here. Saturating adequacy "
                "(min(1, delivered/target)) awaits corpus dose-mining (blueprint b); "
                "until then the runtime ranks by amount-potency + breadth + value."
            ),
            "source": "eden/products/products.json + eden/products/prices.json",
            "generator": "eden/tools/recommender_derive.py",
            "essential_count": len(essentials),
            "candidate_rows": total_rows,
            "priced_rows": priced_rows,
        },
        "essentials": essentials,
    }


def write_data() -> int:
    """Regenerate the on-disk artifact via safe_write (§17). Returns byte count."""
    sys.path.insert(0, str(ROOT / "tools"))
    from safe_write import safe_rewrite
    ARTIFACT_PATH.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(build_data(), indent=2, ensure_ascii=False) + "\n"
    safe_rewrite(str(ARTIFACT_PATH), text)
    return len(text.encode("utf-8"))


if __name__ == "__main__":
    n = write_data()
    d = build_data()
    print(f"OK  wrote product-recommender-data.json ({n} B) - "
          f"{d['_meta']['essential_count']} essentials, "
          f"{d['_meta']['candidate_rows']} rows, {d['_meta']['priced_rows']} priced")
