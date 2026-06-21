#!/usr/bin/env python3
"""
symptom_lookup.py — Query a symptom or condition, get Wallach's named causes + products.

Inputs:
- knowledge/corpus-index/symptom-keywords.json (curated mapping)
- knowledge/corpus-index/condition-causes.json (corpus-extracted)
- knowledge/corpus-index/nutrient-to-symptoms.json
- knowledge/corpus-index/conditions.json (full condition blocks for protocol lookup)
- knowledge/products-db.json
- knowledge/essentials-targets.json

Output: ranked list of likely-implicated nutrients with corpus citations and
ranked YGY products that deliver them.

Usage:
    python tools/symptom_lookup.py "brittle nails"
    python tools/symptom_lookup.py "low testosterone"
    python tools/symptom_lookup.py "memory loss"
    python tools/symptom_lookup.py --condition "osteoporosis"
"""
import argparse
import json
import re
import sys
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "knowledge/corpus-index"


def load_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def normalize(s):
    return re.sub(r'\s+', ' ', s.lower().strip())


def find_matching_symptom(query, symptom_map):
    """Find the best matching symptom key in the curated map."""
    qn = normalize(query)
    # Exact match
    if qn in symptom_map:
        return qn, "exact"
    # Substring match: either direction
    for key in symptom_map:
        if qn in key or key in qn:
            return key, "substring"
    # Token overlap
    qtokens = set(qn.split())
    best = None
    best_score = 0
    for key in symptom_map:
        ktokens = set(key.split())
        overlap = len(qtokens & ktokens)
        if overlap > best_score:
            best_score = overlap
            best = key
    if best_score >= 1:
        return best, "token-overlap"
    return None, None


def find_matching_condition(query, condition_causes, condition_blocks):
    """Find conditions whose heading contains the query terms."""
    qn = normalize(query)
    matches = []
    for cond, causes in condition_causes.items():
        if qn in cond.lower() or cond.lower() in qn:
            matches.append((cond, causes))
    # Also search condition blocks if no header match
    if not matches:
        for cond_entry in condition_blocks:
            heading = cond_entry["heading"]
            if qn in heading.lower():
                matches.append((heading, []))
    return matches


def find_products_with_nutrient(nutrient, products_db):
    """Return products that carry a nutrient (by name token match)."""
    nut_norm = normalize(nutrient)
    results = []
    for pname, p in products_db["products"].items():
        for nname, ninfo in p.get("nutrients", {}).items():
            if nut_norm in normalize(nname) or normalize(nname).split(" (")[0] in nut_norm:
                amount = ninfo.get("amount")
                unit = ninfo.get("unit", "")
                form = ninfo.get("form", "")
                alignment = ninfo.get("form_alignment", "unknown")
                results.append({
                    "product": pname,
                    "amount": amount,
                    "unit": unit,
                    "form": form,
                    "alignment": alignment,
                })
    # Sort by amount descending (where parseable), aligned forms first
    def sort_key(r):
        align_rank = {"aligned": 0, "partial": 1, "misaligned": 2, "unknown": 3}.get(r["alignment"], 3)
        try:
            amt = float(r["amount"] or 0)
        except (ValueError, TypeError):
            amt = 0
        return (align_rank, -amt)
    results.sort(key=sort_key)
    return results


def get_essential_target(nutrient, essentials):
    """Look up Wallach's stated dose target for a nutrient."""
    nut_norm = normalize(nutrient)
    for category, items in essentials["categories"].items():
        for ess in items:
            name = ess["name"]
            if nut_norm in normalize(name) or normalize(name).split(" (")[0] in nut_norm:
                return {
                    "essential_name": name,
                    "wallach_baseline_target": ess.get("wallach_baseline_target"),
                    "clinical_doses": ess.get("wallach_clinical_doses", []),
                    "notes": ess.get("notes"),
                }
    return None


def format_symptom_response(query, symptom_key, match_type, nutrients,
                            cond_matches, products_db, essentials,
                            nutrient_to_symptoms, condition_causes, condition_blocks):
    out = []
    out.append(f"# Symptom Lookup: \"{query}\"")
    out.append("")
    if symptom_key and symptom_key != query.lower():
        out.append(f"_Matched to '{symptom_key}' ({match_type})_")
        out.append("")

    if not nutrients and not cond_matches:
        out.append("No Wallach-corpus-named cause found for this symptom in the curated index.")
        out.append("Try `corpus_search.py` with related keywords for primary-source exploration.")
        return "\n".join(out)

    if nutrients:
        out.append("## Wallach-named nutrient deficiencies for this symptom")
        out.append("")
        for nut in nutrients:
            out.append(f"### {nut.title()}")
            # Corpus evidence
            evidence = nutrient_to_symptoms.get(nut, [])
            if evidence:
                out.append(f"_{len(evidence)} corpus mention(s) — sample:_")
                for e in evidence[:2]:
                    out.append(f"> {e['symptom_claim'][:300]} _[{e['book']}]_")
            # Target dose
            target = get_essential_target(nut, essentials)
            if target:
                out.append(f"\n**Wallach baseline target:** {target['wallach_baseline_target']}")
                if target.get("clinical_doses"):
                    out.append("**Clinical doses by condition:**")
                    for cd in target["clinical_doses"][:3]:
                        out.append(f"- {cd['condition']}: {cd['dose']}")
            # Products
            products = find_products_with_nutrient(nut, products_db)[:5]
            if products:
                out.append("\n**Top YGY products carrying this nutrient (aligned forms first):**")
                for p in products:
                    align_icon = "✓" if p["alignment"] == "aligned" else "◐" if p["alignment"] == "partial" else "⚠" if p["alignment"] == "misaligned" else "?"
                    out.append(f"- {align_icon} **{p['product']}**: {p['amount']} {p['unit']} ({p['form']})")
            out.append("")

    if cond_matches:
        out.append("## Related Wallach conditions")
        out.append("")
        for cond, causes in cond_matches[:5]:
            out.append(f"### {cond}")
            # Find condition block for protocol excerpt
            for cb in condition_blocks:
                if cb["heading"] == cond:
                    excerpt = cb["block"][:600]
                    out.append(f"_[{cb['book']} page {cb.get('page','?')}]_")
                    out.append(f"> {excerpt}")
                    break
            if causes:
                out.append(f"**Named deficiency causes:** {', '.join(c['deficiency'] for c in causes)}")
            out.append("")

    out.append("---")
    out.append("_For full corpus passages, run `python tools/corpus_search.py \"<symptom>\"`_")
    return "\n".join(out)


def main():
    p = argparse.ArgumentParser(description="Wallach symptom → deficiency cross-reference.")
    p.add_argument("query", nargs="*", help="Symptom or condition.")
    p.add_argument("--query", "-q", dest="query_flag")
    p.add_argument("--condition", "-c", help="Search by condition name explicitly.")
    args = p.parse_args()

    query = args.query_flag or " ".join(args.query) or args.condition or ""
    if not query.strip():
        p.error("query required")

    symptom_map = load_json(INDEX / "symptom-keywords.json")
    nutrient_to_symptoms = load_json(INDEX / "nutrient-to-symptoms.json")
    condition_causes = load_json(INDEX / "condition-causes.json")
    condition_blocks = load_json(INDEX / "conditions.json")
    products_db = load_json(ROOT / "knowledge/products-db.json")
    essentials = load_json(ROOT / "knowledge/essentials-targets.json")

    symptom_key, match_type = find_matching_symptom(query, symptom_map)
    nutrients = symptom_map.get(symptom_key, []) if symptom_key else []

    cond_matches = find_matching_condition(query, condition_causes, condition_blocks)

    # Also pull condition-cause nutrients
    for cond, causes in cond_matches:
        for c in causes:
            n = c["deficiency"]
            if n not in nutrients:
                nutrients.append(n)

    out = format_symptom_response(
        query, symptom_key, match_type, nutrients, cond_matches,
        products_db, essentials, nutrient_to_symptoms,
        condition_causes, condition_blocks,
    )
    print(out)


if __name__ == "__main__":
    main()
