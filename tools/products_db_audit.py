"""Products-db completeness audit.

Round 75 Pass A.2. Surfaces per-product field coverage so the team knows what
to fill in before Pass A.3 (master ingredients DB) ships. The audit categorizes
each of the 201 Youngevity products into a four-tier completeness gradient
(fully populated -> partially -> sparse -> skeletal) based on which canonical
fields are present, and emits actionable lists of:
- products needing re-scraping (no product page text on file)
- products with pdf_sources but no parsed nutrients (label OCR candidates)
- products with the richest data (template / reference for upgrading sparse ones)

Output:
- knowledge/products-db-audit.md   (human-readable report)
- knowledge/products-db-audit.json (machine-readable summary; downstream tools)

Both files overwrite on each run. Git history (or saga round entries) is the
historical record. Doctrine §3 - audit output is derived; products-db is source.

Cross-platform discipline per Round 74:
- encoding='utf-8' on every text-mode open()
- pathlib.Path
- datetime.now(tz=utc)
- sys.executable in any subprocess

Edit-tool ban per §17 - all writes via tools/safe_write.py.
"""

from __future__ import annotations

import datetime
import json
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
PRODUCTS_DB = REPO / "knowledge" / "products-db.json"
AUDIT_MD = REPO / "knowledge" / "products-db-audit.md"
AUDIT_JSON = REPO / "knowledge" / "products-db-audit.json"
SAFE_WRITE = REPO / "tools" / "safe_write.py"


# ---------------------------------------------------------------------------
# Categorization
# ---------------------------------------------------------------------------

# Field weights for the "richness score" (higher = more substantive data).
# Used for sorting + per-product completeness percentage.
FIELD_WEIGHTS = {
    "nutrients":              4,  # heaviest: powers the 90-essentials math
    "non_essentials":         2,
    "serving_size":           1,
    "servings_per_container": 1,
    "pricing":                1,
    "features":               2,
    "description":            2,
    "what_it_does":           1,
    "who_its_for":            1,
    "pdf_sources":            1,
    "verified":               1,
    "category":               1,
}
MAX_SCORE = sum(FIELD_WEIGHTS.values())


def has_data(value):
    """A field is considered populated only if its value is non-empty."""
    if value is None:
        return False
    if isinstance(value, (str, list, dict)) and len(value) == 0:
        return False
    if value == 0:
        return False
    return True


def score_product(p):
    """Return (score, max_score, present_fields_set)."""
    if not isinstance(p, dict):
        return 0, MAX_SCORE, set()
    present = set()
    total = 0
    for field, weight in FIELD_WEIGHTS.items():
        v = p.get(field)
        if has_data(v):
            present.add(field)
            total += weight
    return total, MAX_SCORE, present


# Coverage gradient tiers. Critical-field criterion: nutrients AND
# (description OR what_it_does) AND pricing -> at least "partial".
# Without nutrients OR without ANY context text -> "skeletal".
TIER_FULL = "fully populated"
TIER_PARTIAL = "partially populated"
TIER_SPARSE = "sparse"
TIER_SKELETAL = "skeletal"


def classify_tier(present):
    has_nutrients = "nutrients" in present
    has_context = bool(present & {"description", "features", "what_it_does"})
    has_label_meta = "serving_size" in present and "servings_per_container" in present
    has_pricing = "pricing" in present
    has_pdf = "pdf_sources" in present
    if has_nutrients and has_context and has_label_meta and has_pricing and has_pdf:
        # "fully populated" reserved for the richest cohort - all five anchors
        if {"features", "description", "what_it_does"}.issubset(present):
            return TIER_FULL
        return TIER_PARTIAL
    if has_nutrients and (has_context or has_label_meta):
        return TIER_PARTIAL
    if has_nutrients or (has_context and has_label_meta):
        return TIER_SPARSE
    return TIER_SKELETAL


# ---------------------------------------------------------------------------
# Action-item identification
# ---------------------------------------------------------------------------

def needs_rescrape(p, present):
    """Product has no product-page evidence on file. Best path: re-scrape."""
    return "description" not in present and "features" not in present and "pdf_sources" not in present


def needs_label_ocr(p, present):
    """Has pdf_sources (label PDFs on file) but no parsed nutrients - the
    label data exists in PDF form but never got extracted into the catalog."""
    return "pdf_sources" in present and "nutrients" not in present


def is_reference_product(score, max_score, present):
    """High-completeness products that can serve as templates for upgrading sparse ones."""
    if score < max_score - 2:
        return False
    return {"nutrients", "description", "features", "pricing", "what_it_does"}.issubset(present)


# ---------------------------------------------------------------------------
# Audit
# ---------------------------------------------------------------------------

def run_audit():
    with open(PRODUCTS_DB, "r", encoding="utf-8") as f:
        db = json.load(f)
    products = db.get("products", {})
    per_product = {}
    tier_counts = {TIER_FULL: 0, TIER_PARTIAL: 0, TIER_SPARSE: 0, TIER_SKELETAL: 0}
    field_coverage = {f: 0 for f in FIELD_WEIGHTS}
    rescrape_candidates = []
    ocr_candidates = []
    reference_products = []
    for name, p in products.items():
        score, max_score, present = score_product(p)
        tier = classify_tier(present)
        tier_counts[tier] += 1
        for f in present:
            if f in field_coverage:
                field_coverage[f] += 1
        entry = {
            "name": name,
            "tier": tier,
            "score": score,
            "max_score": max_score,
            "pct": round(score / max_score * 100, 1),
            "present_fields": sorted(present),
            "missing_fields": sorted(set(FIELD_WEIGHTS) - present),
            "nutrient_count": len(p.get("nutrients") or {}) if isinstance(p, dict) else 0,
            "non_essentials_count": len(p.get("non_essentials") or []) if isinstance(p, dict) else 0,
            "category": (p.get("category") if isinstance(p, dict) else "") or "",
        }
        per_product[name] = entry
        if needs_rescrape(p, present):
            rescrape_candidates.append(name)
        if needs_label_ocr(p, present):
            ocr_candidates.append(name)
        if is_reference_product(score, max_score, present):
            reference_products.append(name)
    # Sort lists by name for stability
    rescrape_candidates.sort()
    ocr_candidates.sort()
    reference_products.sort()
    return {
        "_meta": {
            "purpose": "Per-product completeness audit of knowledge/products-db.json. Surfaces fully-populated vs partial vs sparse vs skeletal tiers + actionable candidates for re-scraping / label OCR / manual research. Generated by tools/products_db_audit.py.",
            "generated_iso": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "source": "knowledge/products-db.json",
            "generator": "tools/products_db_audit.py",
            "schema_version": 1,
            "total_products": len(products),
        },
        "tier_counts": tier_counts,
        "field_coverage": field_coverage,
        "field_coverage_pct": {f: round(field_coverage[f] / max(1, len(products)) * 100, 1) for f in field_coverage},
        "action_candidates": {
            "rescrape": rescrape_candidates,
            "label_ocr": ocr_candidates,
            "reference_products": reference_products,
        },
        "per_product": per_product,
    }


# ---------------------------------------------------------------------------
# Markdown rendering
# ---------------------------------------------------------------------------

def render_markdown(audit):
    meta = audit["_meta"]
    tc = audit["tier_counts"]
    fc = audit["field_coverage"]
    fcp = audit["field_coverage_pct"]
    total = meta["total_products"]
    ac = audit["action_candidates"]
    lines = []
    lines.append("# Products-DB Completeness Audit")
    lines.append("")
    lines.append("_Generated: {0} UTC by `tools/products_db_audit.py`._".format(meta["generated_iso"]))
    lines.append("_Source: `knowledge/products-db.json` ({0} products)._".format(total))
    lines.append("")
    lines.append("## Summary")
    lines.append("")
    lines.append("| Tier | Count | % |")
    lines.append("|---|---:|---:|")
    for tier in (TIER_FULL, TIER_PARTIAL, TIER_SPARSE, TIER_SKELETAL):
        count = tc[tier]
        pct = round(count / max(1, total) * 100, 1)
        lines.append("| {0} | {1} | {2}% |".format(tier, count, pct))
    lines.append("")
    lines.append("**Tier definitions:**")
    lines.append("- **Fully populated**: nutrients + description + features + what_it_does + serving_size + servings_per_container + pricing + pdf_sources.")
    lines.append("- **Partially populated**: nutrients present + at least one of (description / features / what_it_does) OR full label-meta (serving/container).")
    lines.append("- **Sparse**: has nutrients OR has both context text AND label meta — but missing multiple key fields.")
    lines.append("- **Skeletal**: no nutrients AND no context text. Product was registered but never substantively populated.")
    lines.append("")
    lines.append("## Field coverage")
    lines.append("")
    lines.append("| Field | Products with | % | Weight |")
    lines.append("|---|---:|---:|---:|")
    for field in sorted(FIELD_WEIGHTS.keys(), key=lambda k: -FIELD_WEIGHTS[k]):
        count = fc[field]
        pct = fcp[field]
        weight = FIELD_WEIGHTS[field]
        lines.append("| `{0}` | {1} | {2}% | {3} |".format(field, count, pct, weight))
    lines.append("")
    lines.append("## Action candidates")
    lines.append("")
    lines.append("### Re-scrape candidates ({0})".format(len(ac["rescrape"])))
    lines.append("")
    lines.append("Products with no `description`, no `features`, AND no `pdf_sources`. The product page was likely never scraped — start the data-completion pass here.")
    lines.append("")
    if ac["rescrape"]:
        for n in ac["rescrape"]:
            lines.append("- {0}".format(n))
    else:
        lines.append("_None._")
    lines.append("")
    lines.append("### Label OCR candidates ({0})".format(len(ac["label_ocr"])))
    lines.append("")
    lines.append("Products with `pdf_sources` on file (label PDFs available) but no parsed `nutrients` — the label data exists in PDF form and would surface via OCR.")
    lines.append("")
    if ac["label_ocr"]:
        for n in ac["label_ocr"]:
            lines.append("- {0}".format(n))
    else:
        lines.append("_None._")
    lines.append("")
    lines.append("### Reference products ({0})".format(len(ac["reference_products"])))
    lines.append("")
    lines.append("Highest-completeness entries in the catalog. Use as templates when upgrading sparse / skeletal entries.")
    lines.append("")
    if ac["reference_products"]:
        for n in ac["reference_products"]:
            lines.append("- {0}".format(n))
    else:
        lines.append("_None._")
    lines.append("")
    lines.append("## Per-product gradient (sorted by completeness ASC — lowest first)")
    lines.append("")
    lines.append("| Product | Tier | Score | Nutrients | Non-ess | Missing |")
    lines.append("|---|---|---:|---:|---:|---|")
    sorted_products = sorted(audit["per_product"].values(), key=lambda x: (x["score"], x["name"]))
    for p in sorted_products:
        missing_str = ", ".join(p["missing_fields"][:5])
        if len(p["missing_fields"]) > 5:
            missing_str += ", +" + str(len(p["missing_fields"]) - 5) + " more"
        if not missing_str:
            missing_str = "_(none)_"
        lines.append("| {0} | {1} | {2}/{3} ({4}%) | {5} | {6} | {7} |".format(
            p["name"], p["tier"], p["score"], p["max_score"], p["pct"],
            p["nutrient_count"], p["non_essentials_count"], missing_str
        ))
    lines.append("")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Safe write helper
# ---------------------------------------------------------------------------

def safe_rewrite(path, payload_bytes):
    tmp = path.with_suffix(path.suffix + ".payload.tmp")
    tmp.write_bytes(payload_bytes)
    try:
        result = subprocess.run(
            [sys.executable, str(SAFE_WRITE), "rewrite",
             str(path.relative_to(REPO)), "--payload-file", str(tmp)],
            cwd=REPO, capture_output=True, text=True, encoding="utf-8",
        )
        if result.returncode != 0:
            raise RuntimeError(
                "safe_write rewrite failed for {0}:\n  stdout: {1}\n  stderr: {2}".format(
                    path, result.stdout, result.stderr
                )
            )
        print(result.stdout.strip())
    finally:
        try:
            if tmp.exists():
                tmp.unlink()
        except (PermissionError, OSError):
            pass


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    if not PRODUCTS_DB.exists():
        print("FATAL: products-db not found at {0}".format(PRODUCTS_DB), file=sys.stderr)
        return 2
    audit = run_audit()
    json_bytes = json.dumps(audit, ensure_ascii=False, indent=2).encode("utf-8")
    safe_rewrite(AUDIT_JSON, json_bytes)
    md_bytes = render_markdown(audit).encode("utf-8")
    safe_rewrite(AUDIT_MD, md_bytes)
    tc = audit["tier_counts"]
    total = audit["_meta"]["total_products"]
    ac = audit["action_candidates"]
    print("")
    print("Completeness gradient (n={0}):".format(total))
    for tier in (TIER_FULL, TIER_PARTIAL, TIER_SPARSE, TIER_SKELETAL):
        pct = round(tc[tier] / max(1, total) * 100, 1)
        print("  {0:>22s}: {1:>4} ({2}%)".format(tier, tc[tier], pct))
    print("")
    print("Action queues:")
    print("  re-scrape candidates:        {0}".format(len(ac["rescrape"])))
    print("  label-OCR candidates:        {0}".format(len(ac["label_ocr"])))
    print("  reference products (templates): {0}".format(len(ac["reference_products"])))
    return 0


if __name__ == "__main__":
    sys.exit(main())
