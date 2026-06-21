#!/usr/bin/env python3
"""
stack_coverage.py — Wallach-framework stack coverage analyzer.

Joins user-stack.json + products-db.json + essentials-targets.json to produce
per-essential coverage: actual daily intake, Wallach's baseline target, the
delta, and form alignment.

Two scenarios computed by default:
  1. CURRENT — what the user actually takes today.
  2. RECOMMENDED — current + recommended additions (non-blocked).

Optional dietary contribution layer:
  --include-diet adds knowledge/diet-contribution.json × user-stack 'current_diet'
  --diet-only computes coverage from diet alone (no supplements)

Output formats:
  - markdown (default) — readable report
  - json — structured data
  - html — dashboard-ready table rows (for the Gaps tab)

Usage:
    python tools/stack_coverage.py                              # markdown, both scenarios
    python tools/stack_coverage.py --scenario current --format json
    python tools/stack_coverage.py --scenario recommended --format html
    python tools/stack_coverage.py --scenario current --gaps-only
    python tools/stack_coverage.py --scenario current --include-diet
    python tools/stack_coverage.py --diet-only --gaps-only
"""
import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PRODUCTS_DB = ROOT / "knowledge" / "products-db.json"
USER_STACK = ROOT / "memory" / "user-stack.json"
ESSENTIALS = ROOT / "knowledge" / "essentials-targets.json"
DIET_DB = ROOT / "knowledge" / "diet-contribution.json"


# ---------------------------------------------------------------------------
# Unit normalization
# ---------------------------------------------------------------------------

UNIT_TO_BASE = {
    "mcg": ("mass_mcg", 1.0),
    "mg": ("mass_mcg", 1000.0),
    "g": ("mass_mcg", 1_000_000.0),
    "iu": ("iu", 1.0),
    "mcg rae": ("mass_mcg", 1.0),
}

# Mass-to-IU crosswalks for vitamins where the conversion is well-defined.
MASS_TO_IU = {
    "vitamin d": 40.0,    # 1 mcg cholecalciferol = 40 IU
    "vitamin e": 1.49,    # 1 mg d-alpha tocopherol = 1.49 IU
    "vitamin a": 3.33,    # 1 mcg retinol = 3.33 IU; beta-carotene RAE complicates this but use as approx
}


def normalize_unit(amount, unit):
    if amount is None:
        return None, None
    u = unit.lower().strip()
    if u in UNIT_TO_BASE:
        family, mult = UNIT_TO_BASE[u]
        return family, amount * mult
    return u, amount


def mass_mcg_to_iu(amount_mcg, nutrient_name):
    if amount_mcg is None:
        return None
    name_lower = nutrient_name.lower()
    for key, factor in MASS_TO_IU.items():
        if key in name_lower:
            if "vitamin e" in name_lower:
                return (amount_mcg / 1000.0) * factor  # mcg -> mg -> IU
            return amount_mcg * factor  # per mcg
    return None


def format_amount(amount, family="mass_mcg"):
    if amount is None:
        return "—"
    if family == "iu":
        return f"{amount:.0f} IU"
    if amount >= 1_000_000:
        return f"{amount / 1_000_000:.1f} g"
    if amount >= 1000:
        return f"{amount / 1000:.1f} mg"
    return f"{amount:.0f} mcg"


# ---------------------------------------------------------------------------
# Target parsing
# ---------------------------------------------------------------------------

TARGET_RE = re.compile(r"(\d[\d,]*(?:\.\d+)?)\s*(?:to\s*(\d[\d,]*(?:\.\d+)?))?\s*(mcg|mg|g|IU)\b", re.IGNORECASE)


def parse_target(target_str):
    if not target_str or "trace via PDM" in target_str or "via diet" in target_str or "via water" in target_str or "via breathing" in target_str:
        return None, None, "trace_or_diet", target_str
    m = TARGET_RE.search(target_str.replace(",", ""))
    if not m:
        return None, None, None, target_str
    low = float(m.group(1).replace(",", ""))
    high = float(m.group(2).replace(",", "")) if m.group(2) else low
    unit = m.group(3)
    family, low_b = normalize_unit(low, unit)
    _, high_b = normalize_unit(high, unit)
    return low_b, high_b, family, target_str


# ---------------------------------------------------------------------------
# Stack computation
# ---------------------------------------------------------------------------

def compute_intake(stack_entries, products_db, intake=None, source_label_field="product", item_key="products"):
    """Accumulate per-nutrient totals across stack_entries.

    Accepts a starting `intake` dict to permit additive accumulation across
    supplement-stack and diet sources. `source_label_field` is the key in each
    entry that names the consumable ("product" for stack, "food" for diet).
    `item_key` is the top-level dict key in the source DB ("products" or "foods").
    """
    if intake is None:
        intake = defaultdict(lambda: {"amount_mcg": 0.0, "amount_iu": 0.0,
                                       "sources": [], "forms": [], "covered_essentials_groups": []})

    for entry in stack_entries:
        product_name = entry[source_label_field]
        scale = entry["scaling_factor"]
        product = products_db[item_key].get(product_name)
        if not product:
            print(f"WARN: {source_label_field} '{product_name}' not in DB", file=sys.stderr)
            continue

        covers_group = product.get("covers_essentials", [])

        for nutrient_name, info in product.get("nutrients", {}).items():
            amount = info.get("amount")
            unit = info.get("unit", "")
            form = info.get("form", "")
            alignment = info.get("form_alignment", "unknown")

            family, base_amount = normalize_unit(amount, unit)
            if family == "mass_mcg" and base_amount is not None:
                intake[nutrient_name]["amount_mcg"] += base_amount * scale
            elif family == "iu" and base_amount is not None:
                intake[nutrient_name]["amount_iu"] += base_amount * scale

            intake[nutrient_name]["sources"].append({
                "product": product_name,
                "per_serving": f"{amount} {unit}" if amount is not None else "undisclosed",
                "scaled_amount_per_day": f"{(amount * scale):.1f} {unit}" if isinstance(amount, (int, float)) else "—",
                "form": form,
                "alignment": alignment,
                "scaling_factor": scale,
            })
            intake[nutrient_name]["forms"].append({"form": form, "alignment": alignment, "product": product_name})

        for ess in covers_group:
            intake[ess]["covered_essentials_groups"].append({"product": product_name, "via": "Plant Derived Minerals (humic shale)"})

    return intake


# ---------------------------------------------------------------------------
# Coverage classification
# ---------------------------------------------------------------------------

STATUS_COVERED = "covered"
STATUS_PARTIAL = "partial"
STATUS_GAP = "gap"
STATUS_TRACE_OK = "trace_ok"
STATUS_DIET = "diet"
STATUS_UNKNOWN = "unknown"


def classify_coverage(nutrient_name, target_info, intake_record):
    low_b, high_b, family, raw_target = target_info

    if family == "trace_or_diet":
        if "trace via PDM" in raw_target:
            if intake_record["covered_essentials_groups"]:
                return STATUS_TRACE_OK, "", "Covered via Plant Derived Minerals"
            return STATUS_GAP, "", "No PDM in stack — trace not covered"
        return STATUS_DIET, "", "Dietary, not supplemented"

    if low_b is None:
        return STATUS_UNKNOWN, "", "Target not parsed (corpus dose unclear)"

    if "OCR error" in raw_target or "likely OCR" in raw_target:
        return STATUS_UNKNOWN, "data review needed", "Target string flagged as OCR error in essentials-targets.json"

    intake_mcg = intake_record["amount_mcg"]
    intake_iu = intake_record["amount_iu"]

    if family == "iu":
        if intake_iu <= 0 and intake_mcg > 0:
            converted = mass_mcg_to_iu(intake_mcg, nutrient_name)
            if converted is not None:
                actual = converted
            else:
                return STATUS_UNKNOWN, "unit mismatch (mass→IU crosswalk unknown)", "Need conversion factor"
        else:
            actual = intake_iu
    else:
        actual = intake_mcg if intake_mcg > 0 else intake_iu

    if actual <= 0:
        return STATUS_GAP, f"need {format_amount(low_b, family)}", "No intake in stack"

    if actual >= low_b * 0.9:
        if high_b > low_b and actual > high_b * 1.2:
            return STATUS_COVERED, f"+{format_amount(actual - high_b, family)} above range", "Above range top"
        return STATUS_COVERED, "on target", "Within Wallach range"

    delta = low_b - actual
    pct = actual / low_b
    if pct >= 0.3:
        return STATUS_PARTIAL, f"+{format_amount(delta, family)} to hit target", f"At {pct*100:.0f}% of target low"
    return STATUS_GAP, f"+{format_amount(delta, family)} to hit target", f"At {pct*100:.0f}% of target low"


# ---------------------------------------------------------------------------
# Name matching helpers (essentials list ↔ product DB nutrient keys)
# ---------------------------------------------------------------------------

_GENERIC_TOKENS = {"vitamin", "acid", "complex", "extract", "from", "the", "as", "and", "or"}


def _tokens(name):
    parts = re.split(r"[^a-z0-9]+", name.lower())
    return {t for t in parts if t and t not in _GENERIC_TOKENS and len(t) >= 2}


def _names_match(essential_name, intake_key):
    return bool(_tokens(essential_name) & _tokens(intake_key))


def form_alignment_summary(intake_record):
    forms = intake_record.get("forms", [])
    if not forms:
        return None
    aligned = sum(1 for f in forms if f["alignment"] == "aligned")
    partial = sum(1 for f in forms if f["alignment"] == "partial")
    misaligned = sum(1 for f in forms if f["alignment"] == "misaligned")
    if misaligned > 0:
        return "misaligned"
    if partial > 0 and aligned == 0:
        return "partial"
    if aligned > 0:
        return "aligned"
    return "unknown"


# ---------------------------------------------------------------------------
# Report builders
# ---------------------------------------------------------------------------

STATUS_LABELS = {
    STATUS_COVERED: ("Covered", "ok"),
    STATUS_PARTIAL: ("Partial", "warn"),
    STATUS_GAP: ("Gap", "gap"),
    STATUS_TRACE_OK: ("Covered (trace via PDM)", "ok"),
    STATUS_DIET: ("Dietary", "diet"),
    STATUS_UNKNOWN: ("Unknown", "unknown"),
}


def build_rows(essentials, intake, gaps_only=False):
    rows = []
    for category, items in essentials["categories"].items():
        for ess in items:
            name = ess["name"]
            target_str = ess.get("wallach_baseline_target", "")
            target_info = parse_target(target_str)

            # Direct hit first
            intake_record = intake.get(name)
            if intake_record is None or (intake_record["amount_mcg"] == 0 and intake_record["amount_iu"] == 0 and not intake_record["covered_essentials_groups"]):
                # Token-overlap match across all intake keys
                merged = {"amount_mcg": 0.0, "amount_iu": 0.0, "sources": [], "forms": [], "covered_essentials_groups": []}
                for k, v in intake.items():
                    if _names_match(name, k):
                        merged["amount_mcg"] += v["amount_mcg"]
                        merged["amount_iu"] += v["amount_iu"]
                        merged["sources"].extend(v["sources"])
                        merged["forms"].extend(v["forms"])
                        merged["covered_essentials_groups"].extend(v["covered_essentials_groups"])
                if merged["amount_mcg"] > 0 or merged["amount_iu"] > 0 or merged["covered_essentials_groups"]:
                    intake_record = merged
                elif intake_record is None:
                    intake_record = {"amount_mcg": 0, "amount_iu": 0, "sources": [], "forms": [], "covered_essentials_groups": []}

            status, delta_str, reason = classify_coverage(name, target_info, intake_record)
            if gaps_only and status in (STATUS_COVERED, STATUS_TRACE_OK, STATUS_DIET):
                continue

            sources_str = "; ".join(
                f"{s['product']} {s['scaled_amount_per_day']}"
                for s in intake_record["sources"]
                if isinstance(s.get("scaled_amount_per_day"), str) and s["scaled_amount_per_day"] != "—"
            )
            if intake_record["covered_essentials_groups"] and not sources_str:
                sources_str = "; ".join(g["product"] for g in intake_record["covered_essentials_groups"])

            form_summary = form_alignment_summary(intake_record)

            rows.append({
                "category": category,
                "name": name,
                "status": status,
                "status_label": STATUS_LABELS[status][0],
                "status_class": STATUS_LABELS[status][1],
                "target_str": target_str,
                "intake_str": sources_str or "—",
                "delta_str": delta_str,
                "reason": reason,
                "form_alignment": form_summary,
                "sources": intake_record["sources"],
                "notes": ess.get("notes", ""),
                "clinical_doses": ess.get("wallach_clinical_doses", []),
            })
    return rows


def render_markdown(rows, scenario_label):
    out = [f"# Stack Coverage — {scenario_label}", ""]
    by_status = defaultdict(int)
    for r in rows:
        by_status[r["status"]] += 1
    summary = ", ".join(f"{STATUS_LABELS[s][0]}: {n}" for s, n in by_status.items())
    out.append(f"_Summary: {summary}_")
    out.append("")

    by_cat = defaultdict(list)
    for r in rows:
        by_cat[r["category"]].append(r)

    for category in ["minerals", "vitamins", "amino_acids", "fatty_acids"]:
        if category not in by_cat:
            continue
        out.append(f"## {category.replace('_', ' ').title()}")
        out.append("")
        out.append("| Essential | Status | What you get | Wallach target | Delta |")
        out.append("|---|---|---|---|---|")
        for r in by_cat[category]:
            form_flag = ""
            if r["form_alignment"] == "misaligned":
                form_flag = " ⚠️form"
            elif r["form_alignment"] == "partial":
                form_flag = " ◐form"
            elif r["form_alignment"] == "aligned":
                form_flag = " ✓form"
            out.append(f"| {r['name']} | **{r['status_label']}**{form_flag} | {r['intake_str']} | {r['target_str']} | {r['delta_str']} |")
        out.append("")
    return "\n".join(out)


def render_json(rows, scenario_label):
    return json.dumps({"scenario": scenario_label, "rows": rows}, indent=2, default=str)


CAT_LABELS = {
    "fatty_acids": "Fatty Acids (3)",
    "vitamins": "Vitamins (16)",
    "amino_acids": "Amino Acids (12)",
    "minerals": "Minerals (60)",
}


def render_html(rows, scenario_label):
    by_cat = defaultdict(list)
    for r in rows:
        by_cat[r["category"]].append(r)

    out = [f"<!-- generated by tools/stack_coverage.py · scenario: {scenario_label} -->"]
    for category in ["fatty_acids", "vitamins", "amino_acids", "minerals"]:
        if category not in by_cat:
            continue
        cat_label = CAT_LABELS.get(category, category)
        out.append(f'<div class="gap-table" data-category="{category}">')
        out.append(f'<h3>{cat_label}</h3>')
        out.append('<table><thead>')
        out.append('<tr><th style="width: 22%;">Essential</th><th style="width: 18%;">Status</th><th style="width: 25%;">What you get</th><th style="width: 18%;">Wallach target</th><th style="width: 17%;">Delta</th></tr>')
        out.append('</thead><tbody>')
        for r in by_cat[category]:
            status_class = r["status_class"]
            form_badge = ""
            if r["form_alignment"] == "misaligned":
                form_badge = ' <span class="form-badge form-warn" title="Form misaligned with Wallach">form ⚠</span>'
            elif r["form_alignment"] == "partial":
                form_badge = ' <span class="form-badge form-partial" title="Form acceptable, not preferred">form ◐</span>'
            elif r["form_alignment"] == "aligned":
                form_badge = ' <span class="form-badge form-ok" title="Wallach-aligned form">form ✓</span>'
            out.append(f'<tr class="gap-row" data-status="{status_class}">')
            out.append(f'<td><span class="nutrient-name">{r["name"]}</span></td>')
            out.append(f'<td><span class="badge badge-{status_class}">{r["status_label"]}</span>{form_badge}</td>')
            out.append(f'<td class="what-you-get">{r["intake_str"]}</td>')
            out.append(f'<td class="recommends">{r["target_str"]}</td>')
            out.append(f'<td class="needed">{r["delta_str"] or "—"}</td>')
            out.append('</tr>')
        out.append('</tbody></table>')
        out.append('</div>')
    return "\n".join(out)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--scenario", choices=["current", "recommended", "both"], default="both")
    p.add_argument("--format", choices=["markdown", "json", "html"], default="markdown")
    p.add_argument("--gaps-only", action="store_true")
    p.add_argument("--include-diet", action="store_true",
                   help="Add dietary contribution from knowledge/diet-contribution.json + user-stack 'current_diet' array.")
    p.add_argument("--diet-only", action="store_true",
                   help="Compute coverage from diet ONLY (no supplements). Useful for 'what does my food alone deliver' isolation.")
    args = p.parse_args()

    products_db = json.loads(PRODUCTS_DB.read_text(encoding="utf-8"))
    user_stack = json.loads(USER_STACK.read_text(encoding="utf-8"))
    essentials = json.loads(ESSENTIALS.read_text(encoding="utf-8"))
    diet_db = json.loads(DIET_DB.read_text(encoding="utf-8")) if (args.include_diet or args.diet_only) else None

    diet_entries = user_stack.get("current_diet", [])

    scenarios = []
    if args.diet_only:
        scenarios.append(("diet only (no supplements)", "diet_only", []))
    else:
        if args.scenario in ("current", "both"):
            scenarios.append(("current" + (" + diet" if args.include_diet else ""), "current", user_stack["current"]))
        if args.scenario in ("recommended", "both"):
            recommended = user_stack["current"] + [
                {**r, "scaling_factor": r.get("scaling_factor", 1.0)}
                for r in user_stack.get("recommended_pending_decision", [])
                if not r.get("blocked_until")
            ]
            scenarios.append(("recommended (current + non-blocked additions)" + (" + diet" if args.include_diet else ""),
                              "recommended", recommended))

    chunks = []
    for label, _kind, entries in scenarios:
        intake = compute_intake(entries, products_db) if entries else None
        if args.include_diet or args.diet_only:
            intake = compute_intake(diet_entries, diet_db, intake=intake,
                                    source_label_field="food", item_key="foods")
        if intake is None:
            continue
        rows = build_rows(essentials, intake, gaps_only=args.gaps_only)
        if args.format == "markdown":
            chunks.append(render_markdown(rows, label))
        elif args.format == "json":
            chunks.append(render_json(rows, label))
        elif args.format == "html":
            chunks.append(render_html(rows, label))

    sep = "\n\n---\n\n" if args.format == "markdown" else "\n"
    print(sep.join(chunks))


if __name__ == "__main__":
    main()
