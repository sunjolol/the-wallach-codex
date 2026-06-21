#!/usr/bin/env python3
"""
eden_bootstrap_from_existing.py — ONE-TIME migration tool.

Reads the existing data sources in dashboard.html (regimen-label-lookup,
goal-recommendations-data, REGIMEN_BASE_DATA.recommended) + the
catalog-index/goal-to-products.json file, and produces a draft Eden catalog.

This is a USER-REVIEW tool. Output goes to eden/eden-catalog.draft.json
for the user to inspect, edit, and (if approved) rename to
eden-catalog.json + seal.

The draft is opinionated — it makes reasonable choices about:
  - canonical_name (uses existing names from the lookup verbatim)
  - brand classification (from category text + name patterns)
  - brand_tier (1 = mainline Youngevity OR explicit exception; 2 = sub-brand)
  - source_citations (each product gets a youngevity_url placeholder citation
    that the user will need to fill in with actual product page URLs)

The agent (Claude) MAY run this tool. The user reviews the output.
The user is the only one who can promote draft → canonical.
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
EDEN_DIR = ROOT / "eden"
DASHBOARD_PATH = ROOT / "dashboard" / "dashboard.html"
DRAFT_PATH = EDEN_DIR / "eden-catalog.draft.json"
GOAL_TO_PRODUCTS_PATH = ROOT / "knowledge" / "catalog-index" / "goal-to-products.json"


# Sub-brand patterns — name substring match
SUB_BRAND_PATTERNS = [
    "ProJoba", "Good Herbs", "True2Life", "Tai Wellness",
    "Nature's Pearl", "ChiYo3", "Harmony Drops", "Sea Mineral", "Sta-Natural",
]
# Explicit exception allowlist — these stay tier 1 even if name matches a sub-brand pattern
TIER_1_EXCEPTIONS = {
    "ReVERSE!®",  # Tai Wellness brand, Wallach-endorsed collab
    "ChiYo3 Energy (Goji Juice)",  # sub-brand product, well-curated for energy goal
}


def slugify(name: str) -> str:
    """Produce a stable slug. Lowercase, replace non-alphanumeric with -,
    collapse runs of -, strip leading/trailing -."""
    s = name.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s)
    s = s.strip("-")
    return s


def eden_id(name: str) -> str:
    return f"EDEN-LOCKED-{slugify(name)}"


def infer_brand_tier(name: str) -> int:
    if name in TIER_1_EXCEPTIONS:
        return 1
    for pat in SUB_BRAND_PATTERNS:
        if pat in name:
            return 2
    return 1


def infer_brand(name: str, category: str) -> str:
    if name in TIER_1_EXCEPTIONS:
        # Wallach-endorsed exceptions: brand is the actual maker
        if name == "ReVERSE!®":
            return "Tai Wellness (Wallach collab)"
    # Sub-brand name matches → brand is the sub-brand
    for pat in SUB_BRAND_PATTERNS:
        if pat in name:
            return pat
    # Biometics moved to tier 1 but is still "Biometics" as the brand line
    if "Biometics" in name or "Biometics" in (category or ""):
        return "Biometics (Youngevity-owned)"
    return "Youngevity"


def extract_embed(html: str, block_id: str) -> dict:
    m = re.search(
        r'<script\s+type="application/json"\s+id="' + re.escape(block_id) + r'"[^>]*>(.*?)</script>',
        html, re.DOTALL,
    )
    if not m:
        return {}
    return json.loads(m.group(1))


def main() -> int:
    if not DASHBOARD_PATH.exists():
        print(f"FAIL: dashboard.html missing: {DASHBOARD_PATH}", file=sys.stderr)
        return 1

    html = DASHBOARD_PATH.read_text(encoding="utf-8")
    lookup = extract_embed(html, "regimen-label-lookup").get("products", {})
    goal_recs = extract_embed(html, "goal-recommendations-data")
    g2p = goal_recs.get("goal_to_products", {})
    pricing = goal_recs.get("product_pricing", {})

    # Also load the canonical goal-to-products from knowledge/catalog-index
    canonical_g2p = {}
    if GOAL_TO_PRODUCTS_PATH.exists():
        canonical_g2p = json.loads(GOAL_TO_PRODUCTS_PATH.read_text(encoding="utf-8"))

    # Collect all unique product names referenced anywhere
    all_names = set(lookup.keys())
    for goal, items in canonical_g2p.items():
        for it in items:
            n = it.get("product")
            if n:
                all_names.add(n)
    for goal, items in g2p.items():
        for it in items:
            n = it.get("product")
            if n:
                all_names.add(n)

    print(f"Discovered {len(all_names)} unique product names across sources.")
    print(f"  regimen-label-lookup: {len(lookup)}")
    print(f"  embedded goal_to_products: {sum(len(v) for v in g2p.values())} entries")
    print(f"  canonical goal-to-products: {sum(len(v) for v in canonical_g2p.values())} entries")
    print()

    # Build product records
    products = {}
    for name in sorted(all_names):
        eid = eden_id(name)
        lo = lookup.get(name, {})
        # Collect goal references from canonical_g2p
        goals_for_product = []
        for gkey, items in canonical_g2p.items():
            for it in items:
                if it.get("product") == name and gkey not in goals_for_product:
                    goals_for_product.append(gkey)
        # If not found in canonical, fall back to embedded
        if not goals_for_product:
            for gkey, items in g2p.items():
                for it in items:
                    if it.get("product") == name and gkey not in goals_for_product:
                        goals_for_product.append(gkey)

        category = lo.get("category", "")
        nutrients = lo.get("nutrients", []) or []
        non_essentials = lo.get("non_essentials_parsed", []) or []

        product = {
            "canonical_name": name,
            "display_short": None,  # user to fill if desired
            "brand": infer_brand(name, category),
            "brand_tier": infer_brand_tier(name),
            "source_citations": [
                {
                    "kind": "youngevity_url",
                    "ref": f"https://youngevity.com/us_en/{slugify(name)}.html (USER: replace with actual product page URL)"
                }
            ],
            "nutrients": nutrients,
            "non_essentials": non_essentials,
            "category_label": category,
            "serving_size": lo.get("serving_size", ""),
            "servings_per_container": lo.get("servings_per_container", 0),
            "dose_text": (lo.get("serving_size", "") + " daily") if lo.get("serving_size") else "",
            "pricing": {
                "retail": (pricing.get(name) or {}).get("retail"),
                "daily_cost_at_1_serving": (pricing.get(name) or {}).get("daily_cost_at_1_serving"),
            },
            "goals": goals_for_product,
            "features": lo.get("features", []) or [],
            "what_it_does": lo.get("what_it_does", "") or "",
            "tagline": "",
            "notes": "",
            "eden_metadata": {
                "added_at": "2026-06-20T00:00:00Z",
                "last_modified_at": "2026-06-20T00:00:00Z",
                "added_by": "bootstrap_from_existing",
                "eden_id_version": 1,
            },
        }
        # Mark empty nutrients explicitly
        if not nutrients:
            product["nutrients_explicit_empty"] = True
            product["nutrients_empty_reason"] = "no nutrient panel in existing data; needs user verification"

        products[eid] = product

    # Build goals taxonomy from canonical goal-to-products keys
    GOAL_CATEGORIES = {
        "essential_baseline": ("Essential Baseline", "◆", "foundation", "Foundational coverage of the 90 essentials."),
        "cognition": ("Cognition", "◍", "mind_energy", "Mental performance, memory, focus."),
        "energy_metabolism": ("Energy & Metabolism", "⚡", "mind_energy", "Energy production + metabolic health."),
        "sleep_stress": ("Sleep & Stress", "☾", "mind_energy", "Sleep quality + stress resilience."),
        "thyroid_endocrine": ("Thyroid & Endocrine", "T", "mind_energy", "Thyroid + endocrine system function."),
        "bone_skeletal": ("Bone & Skeletal", "⊞", "structure", "Bone density + skeletal integrity."),
        "joints_collagen": ("Joints & Collagen", "⊙", "structure", "Joint health + collagen support."),
        "skin_hair_nails": ("Skin, Hair & Nails", "✦", "structure", "Connective tissue + appearance."),
        "cardiovascular": ("Cardiovascular", "♥", "internal", "Heart, blood vessels, circulation."),
        "gut_digestion": ("Gut & Digestion", "◯", "internal", "Digestive system + microbiome."),
        "immunity": ("Immunity", "✚", "internal", "Immune system function + resilience."),
        "detox_cleanse": ("Detox & Cleanse", "↻", "internal", "Liver + kidney + cellular detox."),
        "blood_sugar": ("Blood Sugar", "◐", "internal", "Glucose regulation + insulin sensitivity."),
        "hormones_strength": ("Hormones & Strength", "⚏", "hormonal", "Hormonal balance + muscle/strength."),
        "prostate_urinary": ("Prostate & Urinary", "▽", "hormonal", "Prostate health + urinary function."),
        "weight_management": ("Weight Management", "⚖", "longevity_vision", "Metabolic + dietary support for weight goals."),
        "longevity_anti_aging": ("Longevity & Anti-aging", "∞", "longevity_vision", "Long-term cellular + tissue health."),
        "eye_vision": ("Eye & Vision", "◎", "longevity_vision", "Eye health + visual acuity."),
    }
    goals = {}
    for gkey in sorted(canonical_g2p.keys()):
        if gkey in GOAL_CATEGORIES:
            display, symbol, category, description = GOAL_CATEGORIES[gkey]
            goals[gkey] = {
                "display_name": display,
                "symbol": symbol,
                "category": category,
                "description": description,
                "wallach_anchor": "(USER: fill in Wallach corpus citation for this goal)",
                "education": {
                    "framing": "(USER: fill in education content)",
                    "wallach_citations": []
                }
            }
        else:
            print(f"WARNING: goal '{gkey}' not in GOAL_CATEGORIES map — skipping in draft.")

    # HBSP tier: use Powder (not Liquid) per user direction
    hbsp_names = ["BTT 2.5 Canister", "Beyond Osteo FX Powder", "Ultimate EFA Plus"]
    hbsp_ids = [eden_id(n) for n in hbsp_names if eden_id(n) in products]

    catalog = {
        "schema_version": 1,
        "_doctrine": "Eden — sealed catalog. Source of truth for all recommendation surfaces. User (Luneth) is sole writer. Agent (Claude) is forbidden from writing to this file.",
        "eden_version": 1,
        "sealed_at": "2026-06-20T00:00:00Z",
        "_draft_notice": "This is a DRAFT generated by eden/tools/eden_bootstrap_from_existing.py. USER must review, edit as desired, rename to eden-catalog.json, then seal via eden_seal.py.",
        "_user_action_items": [
            "Review every product's brand, brand_tier, source_citations (the youngevity_url placeholders need to become real URLs)",
            "Rename problematic canonical_name values (e.g. 'BTT 2.5 Canister' → 'Beyond Tangy Tangerine 2.5')",
            "Fill in goals[].wallach_anchor and goals[].education for each goal",
            "Fill in product notes, tagline, features where the lookup didn't have them",
            "Add display_short for products with cryptic canonical names",
            "Confirm sub-brand classification (brand_tier=2 vs tier=1 exceptions)",
            "Add any missing products (energy_boost goal will need its own products once you split the energy taxonomy)"
        ],
        "products": products,
        "goals": goals,
        "tiers": {
            "hbsp_default": hbsp_ids,
            "wallach_exception_mainline": [eden_id(n) for n in TIER_1_EXCEPTIONS if eden_id(n) in products]
        }
    }

    DRAFT_PATH.write_text(json.dumps(catalog, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"DRAFT written to: {DRAFT_PATH}")
    print()
    print("Stats:")
    print(f"  products: {len(products)} ({sum(1 for p in products.values() if p['brand_tier'] == 1)} tier-1, {sum(1 for p in products.values() if p['brand_tier'] == 2)} tier-2)")
    print(f"  goals: {len(goals)}")
    print(f"  HBSP default: {len(hbsp_ids)} ({hbsp_ids})")
    print(f"  Wallach exceptions: {len(catalog['tiers']['wallach_exception_mainline'])}")
    print()
    print("USER NEXT STEPS:")
    print("  1. Review eden/eden-catalog.draft.json")
    print("  2. Edit as desired (canonical_name renames, source_citations, etc.)")
    print("  3. When satisfied: mv eden/eden-catalog.draft.json eden/eden-catalog.json")
    print("  4. python3 eden/tools/eden_seal.py")
    print("  5. python3 eden/tools/eden_verify.py")
    print("  6. python3 eden/tools/eden_build.py  (writes dashboard embeds)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
