#!/usr/bin/env python3
"""
catalog_index.py — Bidirectional product-catalog indexer.

Builds three derived indexes from products-db.json:
  1) nutrient-to-products.json     — for any nutrient, what products carry it (with dose, form, alignment)
  2) goal-to-products.json         — products grouped by health goal (cognition, hormones, longevity, joints, energy, immunity, gut, cardio, bone, thyroid, detox, skin)
  3) product-coverage-summary.json — per-product summary: % of 90 essentials covered, top 3 nutrients by Wallach-target %, alignment score

Outputs land in knowledge/catalog-index/.

Usage:
    python tools/catalog_index.py                       # build all 3 indexes
    python tools/catalog_index.py --query "cognition"   # query goal index
    python tools/catalog_index.py --nutrient zinc       # query nutrient index
    python tools/catalog_index.py --product "Beyond Tangy Tangerine"
"""
import argparse
import json
import re
import sys
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
INDEX_DIR = ROOT / "knowledge/catalog-index"
INDEX_DIR.mkdir(parents=True, exist_ok=True)

# Goal keywords matched against product description + who_its_for + what_it_does + features
GOAL_KEYWORDS = {
    "cognition": [
        "cogniti", "memory", "focus", "brain", "neuro", "mental", "concentration",
        "alzheimer", "dementia", "lecithin", "choline", "phosphatidyl", "nerve",
        "synaptic", "myelin", "korsakoff", "mood",
    ],
    "hormones_strength": [
        "testosterone", "hormone", "libido", "strength", "muscle", "androgen",
        "estrogen", "boron", "tribulus", "anabolic", "vitality", "sexual",
        "male enhanc", "androsten", "performance",
    ],
    "longevity_anti_aging": [
        "aging", "longevity", "anti-aging", "antiaging", "youthful", "lifespan",
        "telomere", "wrinkle", "rejuven", "centenarian", "telomeres", "elder",
        "resveratrol", "youthful", "century",
    ],
    "joints_collagen": [
        "joint", "cartilage", "collagen", "msm", "glucosamine", "chondroitin",
        "arthritis", "flexibility", "mobility", "tendon", "ligament", "hyaluron",
    ],
    "energy_metabolism": [
        "energy", "metabolism", "fatigue", "stamina", "endurance", "atp",
        "mitochondri", "tired", "vigor", "co-q10", "coq10", "b-complex", "b complex",
    ],
    "immunity": [
        "immun", "infection", "antiviral", "antimicrobial", "antibacter", "cold ",
        "flu", "virus", "antioxidant defense", "lymph", "thymus",
    ],
    "gut_digestion": [
        "digesti", "gut", "probiotic", "enzyme", "stomach", "intestin", "ibs",
        "ulcer", "betaine", "hcl", "leaky", "microbiome", "constipation", "bowel",
        "colon", "candida",
    ],
    "cardiovascular": [
        "cardiovasc", "heart", "blood pressure", "cholesterol", "circulation",
        "artery", "arteries", "vein", "aneurysm", "stroke", "atheroscler",
        "homocyst", "lipid", "ldl", "hdl", "triglyc", "vascular",
    ],
    "bone_skeletal": [
        "bone", "osteoporosis", "osteo", "skeletal", "spine", "fracture",
        "calcium absorption", "vertebr", "marrow",
    ],
    "thyroid_endocrine": [
        "thyroid", "hashimoto", "hypothyroid", "hyperthyroid", "iodine", "selenium",
        "adrenal", "endocrine", "cortisol", "pituitary",
    ],
    "detox_cleanse": [
        "detox", "cleanse", "liver", "kidney", "purif", "toxin", "heavy metal",
        "glutathione", "milk thistle", "bilberry",
    ],
    "skin_hair_nails": [
        "skin", "hair", "nail", "complexion", "wrinkle", "acne", "psoriasis",
        "eczema", "biotin", "silica", "sulfur",
    ],
    "blood_sugar": [
        "blood sugar", "glucose", "diabet", "insulin", "glycemic", "hyperglycem",
        "hypoglycem", "chromium", "vanadium",
    ],
    "weight_management": [
        "weight", "fat loss", "appetite", "lean", "obesity", "slim", "tone",
    ],
    "sleep_stress": [
        "sleep", "insomnia", "stress", "relax", "anxiety", "calm", "rest",
        "melatonin", "gaba", "valerian",
    ],
    "eye_vision": [
        "eye", "vision", "macular", "retina", "cataract", "lutein", "zeaxanth",
    ],
    "prostate_urinary": [
        "prostate", "urinary", "saw palmetto", "bladder",
    ],
    "essential_baseline": [
        "90 essential", "complete nutrient", "multivitamin", "multimineral",
        "full spectrum", "daily essential", "foundation",
    ],
}

# 90 essentials roll-up names (keyword form for fuzzy matching)
ESSENTIAL_TOKENS = [
    "calcium", "magnesium", "potassium", "sodium", "zinc", "copper", "iron",
    "manganese", "chromium", "selenium", "iodine", "molybdenum", "vanadium",
    "boron", "tin", "nickel", "germanium", "lithium", "rubidium", "strontium",
    "cobalt", "phosphorus", "sulfur", "vitamin a", "vitamin c", "vitamin d",
    "vitamin e", "vitamin k", "vitamin b1", "vitamin b2", "vitamin b3",
    "vitamin b5", "vitamin b6", "vitamin b12", "biotin", "folic", "choline",
    "lecithin", "omega-3", "omega-6", "omega-9", "amino acid",
]


def normalize(s):
    return re.sub(r"\s+", " ", s.lower().strip())


def match_goals(product):
    """Return goal tags for this product based on its text fields."""
    text_blob = " ".join([
        product.get("description", "") or "",
        product.get("who_its_for", "") or "",
        product.get("what_it_does", "") or "",
        " ".join(product.get("features", []) or []),
    ]).lower()
    matched = set()
    for goal, keywords in GOAL_KEYWORDS.items():
        for kw in keywords:
            if kw in text_blob:
                matched.add(goal)
                break
    return sorted(matched)


def alignment_score(product):
    """Return tuple (aligned_count, partial_count, misaligned_count, unknown_count)."""
    a = p = m = u = 0
    for n, info in product.get("nutrients", {}).items():
        align = info.get("form_alignment", "unknown")
        if align == "aligned":
            a += 1
        elif align == "partial":
            p += 1
        elif align == "misaligned":
            m += 1
        else:
            u += 1
    return a, p, m, u


def essentials_covered(product):
    """Return list of essential nutrient tokens this product covers."""
    nuts_lower = [normalize(n) for n in product.get("nutrients", {}).keys()]
    covered = []
    for ess in ESSENTIAL_TOKENS:
        for nl in nuts_lower:
            if ess in nl:
                covered.append(ess)
                break
    return covered


def build_indexes(db):
    nutrient_idx = defaultdict(list)
    goal_idx = defaultdict(list)
    product_summary = {}

    for pname, p in db["products"].items():
        # nutrient → products
        for nname, ninfo in p.get("nutrients", {}).items():
            nutrient_idx[nname].append({
                "product": pname,
                "amount": ninfo.get("amount"),
                "unit": ninfo.get("unit"),
                "form": ninfo.get("form"),
                "alignment": ninfo.get("form_alignment", "unknown"),
            })
        # goals
        goals = match_goals(p)
        for g in goals:
            goal_idx[g].append({
                "product": pname,
                "category": p.get("category"),
                "tagline": (p.get("what_it_does") or "")[:200],
            })
        # summary
        a, pa, m, u = alignment_score(p)
        total_nut = a + pa + m + u
        score = (a * 2 + pa * 1 + m * -1) / total_nut if total_nut else 0
        ess = essentials_covered(p)
        product_summary[pname] = {
            "goals": goals,
            "essentials_covered_count": len(ess),
            "essentials_covered_pct": round(100 * len(ess) / len(ESSENTIAL_TOKENS), 1),
            "essentials_list": ess,
            "alignment_score": round(score, 2),
            "aligned_count": a,
            "partial_count": pa,
            "misaligned_count": m,
            "unknown_count": u,
            "total_nutrients": total_nut,
            "category": p.get("category"),
        }

    # Sort each list deterministically
    for n in nutrient_idx:
        align_rank = {"aligned": 0, "partial": 1, "misaligned": 2, "unknown": 3}

        def k(e):
            try:
                amt = float(e["amount"] or 0)
            except (ValueError, TypeError):
                amt = 0
            return (align_rank.get(e["alignment"], 3), -amt, e["product"])

        nutrient_idx[n].sort(key=k)

    for g in goal_idx:
        goal_idx[g].sort(key=lambda e: (-product_summary[e["product"]]["alignment_score"], e["product"]))

    return dict(nutrient_idx), dict(goal_idx), product_summary


def query_nutrient(nutrient, nutrient_idx, n_top=10):
    qn = normalize(nutrient)
    hits = []
    for n, entries in nutrient_idx.items():
        if qn in normalize(n):
            hits.append((n, entries))
    if not hits:
        return f"No nutrient matching '{nutrient}' in catalog."
    out = []
    for name, entries in hits:
        out.append(f"# {name}")
        out.append(f"_{len(entries)} products carry this nutrient_\n")
        for e in entries[:n_top]:
            icon = {"aligned": "✓", "partial": "◐", "misaligned": "⚠", "unknown": "?"}.get(e["alignment"], "?")
            out.append(f"- {icon} **{e['product']}**: {e['amount']} {e['unit'] or ''} ({e['form'] or 'form n/a'})")
        out.append("")
    return "\n".join(out)


def query_goal(goal, goal_idx, n_top=15):
    qn = normalize(goal)
    hit_keys = [g for g in goal_idx if qn in g.lower() or g.lower() in qn]
    if not hit_keys:
        return f"No goal matching '{goal}'. Available: {', '.join(sorted(goal_idx))}"
    out = []
    for k in hit_keys:
        entries = goal_idx[k]
        out.append(f"# Goal: {k}")
        out.append(f"_{len(entries)} products tagged_\n")
        for e in entries[:n_top]:
            out.append(f"- **{e['product']}** [{e['category']}]")
            if e["tagline"]:
                out.append(f"  > {e['tagline']}")
        out.append("")
    return "\n".join(out)


def query_product(product_name, summary, db):
    qn = normalize(product_name)
    hits = [k for k in summary if qn in k.lower()]
    if not hits:
        return f"No product matching '{product_name}'."
    out = []
    for h in hits[:5]:
        s = summary[h]
        p = db["products"][h]
        out.append(f"# {h}")
        out.append(f"**Category:** {s['category']}")
        out.append(f"**Goals:** {', '.join(s['goals']) or 'none tagged'}")
        out.append(f"**Essential coverage:** {s['essentials_covered_count']}/{len(ESSENTIAL_TOKENS)} = {s['essentials_covered_pct']}%")
        out.append(f"**Form alignment:** ✓{s['aligned_count']} ◐{s['partial_count']} ⚠{s['misaligned_count']} ?{s['unknown_count']} (score {s['alignment_score']})")
        if p.get("what_it_does"):
            out.append(f"**What it does:** {p['what_it_does'][:300]}")
        out.append("")
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--query", "--goal", dest="goal", help="Query goal index")
    ap.add_argument("--nutrient", help="Query nutrient index")
    ap.add_argument("--product", help="Query product summary")
    ap.add_argument("--rebuild", action="store_true", help="Force rebuild of indexes")
    ap.add_argument("--list-goals", action="store_true")
    args = ap.parse_args()

    nut_path = INDEX_DIR / "nutrient-to-products.json"
    goal_path = INDEX_DIR / "goal-to-products.json"
    sum_path = INDEX_DIR / "product-coverage-summary.json"

    db = json.loads((ROOT / "knowledge/products-db.json").read_text())

    if args.rebuild or not nut_path.exists() or not goal_path.exists() or not sum_path.exists():
        nut_idx, goal_idx, summary = build_indexes(db)
        nut_path.write_text(json.dumps(nut_idx, indent=2))
        goal_path.write_text(json.dumps(goal_idx, indent=2))
        sum_path.write_text(json.dumps(summary, indent=2))
        print(f"Built indexes:")
        print(f"  - {nut_path.name}: {len(nut_idx)} nutrient keys")
        print(f"  - {goal_path.name}: {len(goal_idx)} goals")
        print(f"  - {sum_path.name}: {len(summary)} product summaries")
        if not (args.goal or args.nutrient or args.product or args.list_goals):
            return
    else:
        nut_idx = json.loads(nut_path.read_text())
        goal_idx = json.loads(goal_path.read_text())
        summary = json.loads(sum_path.read_text())

    if args.list_goals:
        print("# Available goals:")
        for g in sorted(goal_idx):
            print(f"  - {g}: {len(goal_idx[g])} products")
        return
    if args.goal:
        print(query_goal(args.goal, goal_idx))
        return
    if args.nutrient:
        print(query_nutrient(args.nutrient, nut_idx))
        return
    if args.product:
        print(query_product(args.product, summary, db))
        return


if __name__ == "__main__":
    main()
