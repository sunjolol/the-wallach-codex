#!/usr/bin/env python3
"""products_embed.py — the product-vault embed generator.

Derives dashboard/assets/data/regimen-label-lookup.json — the per-product label
vault read by the Regimen "Full edit" flow (views/regimen.ts) and the Knowledge
Products tab (views/knowledge.ts) — from the SEALED Products pillar. Exposes the
manifest generator contract the freshness gate + build_embeds iterate:

  build_embed() -> dict   (PURE; the derived_artifacts_fresh gate byte-compares it
                           to disk -- so it MUST be deterministic)
  write_embed() -> int    (regenerates the on-disk artifact via safe_write)

SOURCE: eden/products/products.json (Pillar 2). An earlier transitional catalog file
was retired here: the whole old product subsystem (catalog + scraped marketing prose
+ brand tiering) was deleted as poison. Composition is COMPOSITION ONLY
(§00.A): an amount is what a product CONTAINS, never a Wallach target.

The vault carries ONLY what the two view consumers read -- a display name
(canonical_name) + the product's quantified nutrient rows {name, amount, unit}.
NO marketing prose (what_it_does / tagline / features / brand tier): those are
gone, and no_product_marketing_prose keeps them out. Product "prose" now comes
from book-mining claim->ingredient matching, not scraped descriptions.

FLATTEN (mirrors nutrient_resolve.py::_iter_substances so the runtime coverage
matcher resolves the SAME substance set): every quantified substance across ALL
components -- top-level nutrients[], plus blends[].ingredients[] and their
sub_ingredients[] -- that carries a numeric amount + a unit. Blend-level totals
are skipped (a proprietary-blend total is not attributable to one essential), and
non-numeric label amounts ("<1", null) are skipped (not summable). Keeping blend
ingredient amounts avoids the coverage undercount.

DETERMINISTIC: the artifact carries NO wall-clock timestamp, so a fresh
build_embed() always equals the on-disk artifact (the freshness gate's contract).
"""
import json
import re as _re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
PRODUCTS_PATH = ROOT / "eden" / "products" / "products.json"
ARTIFACT_PATH = ROOT / "dashboard" / "assets" / "data" / "regimen-label-lookup.json"

sys.path.insert(0, str(ROOT / "tools"))
import safe_write  # noqa: E402


def _numeric(value):
    """Return value as float iff it is a real number; None for strings ("<1"),
    None, or bools. Only summable amounts enter the vault (coverage sums them)."""
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    return None


def _add_row(rows, name, amount, unit):
    """Append a slim {name, amount, unit} row iff the substance is quantified --
    a non-empty name, a numeric amount, and a unit to convert it by."""
    amt = _numeric(amount)
    if not name or amt is None or not unit:
        return
    rows.append({"name": name, "amount": amt, "unit": unit})


def _collect_ingredient(ing, rows):
    """A blend ingredient + its sub_ingredients (recursive). Blend TOTALS are not
    collected here -- an unlabeled proprietary total maps to no single essential."""
    _add_row(rows, ing.get("name"), ing.get("amount"), ing.get("unit"))
    for sub in ing.get("sub_ingredients") or []:
        _collect_ingredient(sub, rows)


def _flatten_nutrients(product) -> list:
    """The product's quantified nutrient rows, flattened across every component.
    Mirrors nutrient_resolve.py::_iter_substances so A2's runtime matcher sees the
    same set. Duplicates across components are kept (coverage sums them)."""
    rows: list = []
    for comp in product.get("components", []) or []:
        for n in comp.get("nutrients", []) or []:
            _add_row(rows, n.get("name"), n.get("amount"), n.get("unit"))
        for blend in comp.get("blends", []) or []:
            for ing in blend.get("ingredients", []) or []:
                _collect_ingredient(ing, rows)
    return rows


# Countable label units, singular -> the noun the views print. A serving measured in fl oz,
# scoops, grams or mL is NOT countable: there is no discrete unit to step, so those products
# keep 1 = 1 serving and the views print the bare count exactly as they do today.
_UNIT_NOUNS = {
    "tablet": "tablet",
    "tablets": "tablet",
    "capsule": "capsule",
    "capsules": "capsule",
    "caplet": "caplet",
    "caplets": "caplet",
    "softgel": "softgel",
    "softgels": "softgel",
    "soft gel": "softgel",
    "soft gels": "softgel",
    "gummy": "gummy",
    "gummies": "gummy",
    "lozenge": "lozenge",
    "lozenges": "lozenge",
    "chewable": "chewable",
    "chewables": "chewable",
}

# "2 tablets", "1 vegetable capsule", "4 soft gels" -- an optional adjective is allowed between
# the count and the noun, which is the whole reason this is a regex and not a split().
_SERVING_UNITS_RE = _re.compile(
    r"^\s*(\d+)\s+(?:[a-z][a-z-]*\s+)?"
    r"(tablets?|capsules?|caplets?|soft\s?gels?|gummies|gummy|lozenges?|chewables?)\b",
    _re.I,
)


def _serving_units(product):
    """(count, singular noun) of discrete units in ONE label serving, or (None, None).

    None means "the serving IS the unit" -- liquids, powders, sprays, teas -- and the views
    fall back to counting servings, unchanged.

    ★ SINGLE-COMPONENT ONLY, on purpose. Five products in the pillar ship multiple components
    whose servings disagree ('reverse' is 6 tablets AND 2 softgels; 'liverpure' is a powder
    AND a bottle). Picking the first component's count would print a number that is true of
    part of the serving and false of the serving -- worse than printing none.
    """
    comps = product.get("components") or []
    if len(comps) != 1:
        return None, None
    m = _SERVING_UNITS_RE.match((comps[0].get("serving_size") or "").strip())
    if m is None:
        return None, None
    noun = _UNIT_NOUNS.get(_re.sub(r"\s+", " ", m.group(2).lower()))
    if noun is None:
        return None, None
    count = int(m.group(1))
    return (count, noun) if count > 0 else (None, None)


def build_embed() -> dict:
    """PURE derive of the product-vault embed from the sealed Products pillar --
    one slim record per product, keyed by product_id. No writes, no wall-clock
    timestamp, so a fresh call always equals the on-disk artifact (the freshness
    gate's contract). Matches the shape the consumers validate (RegimenVaultEntry
    / ProductEntry): a display name + quantified nutrient rows, nothing else."""
    pillar = json.loads(PRODUCTS_PATH.read_text(encoding="utf-8"))
    products = pillar.get("products", {})
    out_products: dict = {}
    for product_id, prod in products.items():
        name = prod.get("name")
        if not name:
            continue
        units, noun = _serving_units(prod)
        record = {
            "canonical_name": name,
            "nutrients": _flatten_nutrients(prod),
        }
        # Omitted rather than emitted null when the serving is not countable: an absent key
        # reads as "no discrete unit" at every consumer, and keeps the artifact from growing
        # 215 null pairs that mean nothing.
        if units is not None:
            record["serving_units"] = units
            record["serving_unit"] = noun
        out_products[product_id] = record
    return {
        "_meta": {
            "purpose": (
                "Per-product label vault keyed by product_id -- a display name, "
                "the product's quantified nutrient rows {name, amount, unit}, and (for "
                "single-component products whose serving is countable) serving_units + "
                "serving_unit: how many tablets/capsules/softgels make ONE label serving, so "
                "the dose stepper can say '2 tablets /day' instead of a bare '1'. Those two "
                "are DISPLAY facts read off the label's own serving_size -- no amount depends "
                "on them and no coverage math changes. Read "
                "by the Regimen Full-edit flow + the Knowledge Products tab. "
                "GENERATED from eden/products/products.json by "
                "eden/tools/products_embed.py -- never hand-edited (R1). Composition "
                "only (§00.A); NO marketing prose (no_product_marketing_prose)."
            ),
            "source": "eden/products/products.json",
            "generator": "eden/tools/products_embed.py",
            "product_count": len(out_products),
        },
        "products": out_products,
    }


def write_embed() -> int:
    """Regenerate the on-disk artifact via safe_write. Returns byte count."""
    ARTIFACT_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(build_embed(), ensure_ascii=False, indent=2)
    return safe_write.safe_rewrite(str(ARTIFACT_PATH), payload)


if __name__ == "__main__":
    n = write_embed()
    e = build_embed()
    print(f"OK  wrote regimen-label-lookup.json ({n} B) - "
          f"{e['_meta']['product_count']} products")
