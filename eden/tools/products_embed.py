#!/usr/bin/env python3
"""products_embed.py — the product-vault embed generator (Phase C3 / blueprint D2).

Derives dashboard/assets/data/regimen-label-lookup.json — the per-product label
vault read by the Regimen "Full edit" flow (views/regimen.ts) and the Knowledge
Products tab (views/knowledge.ts) — from the sealed product catalog. Exposes the
manifest generator contract the freshness gate + build_embeds iterate:

  build_embed() -> dict   (PURE; the derived_artifacts_fresh gate byte-compares it
                           to disk — so it MUST be deterministic)
  write_embed() -> int    (regenerates the on-disk artifact via safe_write, §17)

TRANSITIONAL SOURCE: reads eden/eden-catalog.json (the current sealed 201-product
Youngevity draft). Phase F swaps the source to the Products pillar (eden/products/)
with no change to this artifact's shape or its consumers — the same transitional
pattern targets_derive uses for its knowledge/ hand-file (MANIFEST note).

DETERMINISTIC (R1): the artifact carries NO timestamp. The retired eden_build.py
stamped `_meta.generated_at`, which forced the weak version-STAMP gate
(eden_embeds_match_canonical) because a content compare would always differ. With
the timestamp gone, derived_artifacts_fresh content-compares a fresh re-derive to
disk every run — a real freshness proof, and that stamp gate is retired.

Supersedes for this artifact: eden/tools/eden_build.py::derive_regimen_label_lookup
(now vestigial; retires with eden-catalog.json in Phase D/F) and the older
tools/build_regimen_label_lookup.py (products-db.json source, long superseded).
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
CATALOG_PATH = ROOT / "eden" / "eden-catalog.json"
ARTIFACT_PATH = ROOT / "dashboard" / "assets" / "data" / "regimen-label-lookup.json"

sys.path.insert(0, str(ROOT / "tools"))
import safe_write  # noqa: E402


def build_embed() -> dict:
    """PURE derive of the product-vault embed from eden-catalog.json — keyed by
    canonical_name, one slim record per product. No writes, no timestamp, so a
    fresh call always equals the on-disk artifact (the freshness gate's contract).
    Mirrors the shape the two view consumers already validate (ProductsLookupSchema
    + RegimenVaultEntry / ProductEntry)."""
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    products = catalog.get("products", {})
    out_products: dict = {}
    for eden_id, prod in products.items():
        name = prod.get("canonical_name")
        if not name:
            continue
        out_products[name] = {
            "eden_id": eden_id,
            "canonical_name": name,
            "brand": prod.get("brand"),
            "brand_tier": prod.get("brand_tier"),
            "category": prod.get("category_label", ""),
            "serving_size": prod.get("serving_size", ""),
            "servings_per_container": prod.get("servings_per_container"),
            "dose_text": prod.get("dose_text", ""),
            "nutrients": prod.get("nutrients", []),
            "non_essentials_parsed": prod.get("non_essentials", []),
            "features": prod.get("features", []),
            "what_it_does": prod.get("what_it_does", ""),
            "tagline": prod.get("tagline", ""),
        }
    return {
        "_meta": {
            "purpose": (
                "Per-product label vault keyed by canonical_name. Read by the "
                "Regimen Full-edit flow + the Knowledge Products tab. GENERATED "
                "from eden-catalog.json by eden/tools/products_embed.py — never "
                "hand-edited (R1). Inlined into the bundle via esbuild JSON import."
            ),
            "source": "eden/eden-catalog.json",
            "generator": "eden/tools/products_embed.py",
            "eden_version": catalog.get("eden_version"),
            "sealed_at": catalog.get("sealed_at"),
            "product_count": len(out_products),
        },
        "products": out_products,
    }


def write_embed() -> int:
    """Regenerate the on-disk artifact via safe_write (§17). Returns byte count."""
    ARTIFACT_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(build_embed(), ensure_ascii=False, indent=2)
    return safe_write.safe_rewrite(str(ARTIFACT_PATH), payload)


if __name__ == "__main__":
    n = write_embed()
    e = build_embed()
    print(f"OK  wrote regimen-label-lookup.json ({n} B) · "
          f"{e['_meta']['product_count']} products · eden_version={e['_meta']['eden_version']}")
