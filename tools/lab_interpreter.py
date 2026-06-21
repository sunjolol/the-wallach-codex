#!/usr/bin/env python3
"""
lab_interpreter.py — Wallach-framework lab marker interpretation.

Parses common lab markers (TSH, Vit D, B12, ferritin, lipid panel, glucose,
testosterone, etc.) through Wallach's lens. Surfaces:
- Whether value is in Wallach-optimal range (often differs from standard)
- Deficiency pathways implicated
- First-action recommendations + relevant YGY products
- Corpus citations / framework notes (including framework-vs-modern conflicts)

Usage:
    python tools/lab_interpreter.py --marker vitamin_d_25oh --value 28
    python tools/lab_interpreter.py --marker tsh --value 3.2
    python tools/lab_interpreter.py --marker testosterone_total --value 380 --sex male
    python tools/lab_interpreter.py --panel "vitamin_d_25oh=28,tsh=3.2,vitamin_b12_serum=410"
    python tools/lab_interpreter.py --list   # show all markers available
"""
import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LAB_DATA = json.loads((ROOT / "knowledge/corpus-index/lab-markers.json").read_text())


def get_range(marker_data, sex=None):
    """Return (standard_low, standard_high, wallach_low, wallach_high) accounting for sex."""
    if sex == "male":
        sl = marker_data.get("standard_low_male", marker_data.get("standard_low"))
        sh = marker_data.get("standard_high_male", marker_data.get("standard_high"))
        wl = marker_data.get("wallach_optimal_low_male", marker_data.get("wallach_optimal_low"))
        wh = marker_data.get("wallach_optimal_high_male", marker_data.get("wallach_optimal_high"))
    elif sex == "female":
        sl = marker_data.get("standard_low_female", marker_data.get("standard_low"))
        sh = marker_data.get("standard_high_female", marker_data.get("standard_high"))
        wl = marker_data.get("wallach_optimal_low_female", marker_data.get("wallach_optimal_low"))
        wh = marker_data.get("wallach_optimal_high_female", marker_data.get("wallach_optimal_high"))
    else:
        sl = marker_data.get("standard_low")
        sh = marker_data.get("standard_high")
        wl = marker_data.get("wallach_optimal_low")
        wh = marker_data.get("wallach_optimal_high")
    return sl, sh, wl, wh


def classify(value, marker_data, sex=None):
    """Classify a value: below standard, below Wallach optimal, optimal, above Wallach, above standard."""
    sl, sh, wl, wh = get_range(marker_data, sex)
    if sl is not None and value < sl:
        return "below_standard"
    if wl is not None and value < wl:
        return "below_wallach_optimal"
    if wh is not None and value > wh:
        if sh is not None and value > sh:
            return "above_standard"
        return "above_wallach_optimal"
    return "in_optimal_range"


def interpret_marker(marker_key, value, sex=None):
    marker = LAB_DATA["markers"].get(marker_key)
    if not marker:
        return None
    classification = classify(value, marker, sex)
    sl, sh, wl, wh = get_range(marker, sex)
    return {
        "marker": marker["name"],
        "value": value,
        "unit": marker.get("unit", ""),
        "classification": classification,
        "standard_range": f"{sl}–{sh}" if sl is not None and sh is not None else "n/a",
        "wallach_optimal_range": f"{wl}–{wh}" if wl is not None and wh is not None else "n/a",
        "note": marker.get("note"),
        "deficiency_pathways": marker.get("deficiency_pathways", []),
        "first_actions": marker.get("first_actions", []),
        "products": marker.get("products", []),
    }


def format_marker_report(interp):
    if interp is None:
        return "Unknown marker."
    lines = []
    lines.append(f"# {interp['marker']}: {interp['value']} {interp['unit']}")
    lines.append("")
    cls = interp["classification"]
    badge = {
        "in_optimal_range": "✓ IN WALLACH-OPTIMAL RANGE",
        "below_wallach_optimal": "◐ BELOW WALLACH OPTIMAL (still in standard range)",
        "above_wallach_optimal": "◐ ABOVE WALLACH OPTIMAL (still in standard range)",
        "below_standard": "⚠ BELOW STANDARD RANGE — clinically low",
        "above_standard": "⚠ ABOVE STANDARD RANGE — clinically high",
    }.get(cls, cls)
    lines.append(f"**Classification:** {badge}")
    lines.append(f"**Standard range:** {interp['standard_range']}  ")
    lines.append(f"**Wallach-optimal range:** {interp['wallach_optimal_range']}")
    lines.append("")
    if interp["note"]:
        lines.append("**Framework note:**")
        lines.append(f"> {interp['note']}")
        lines.append("")
    if interp["deficiency_pathways"]:
        lines.append("**Deficiency pathways implicated:**")
        for d in interp["deficiency_pathways"]:
            lines.append(f"- {d}")
        lines.append("")
    if interp["first_actions"]:
        lines.append("**Wallach-framework first actions:**")
        for i, a in enumerate(interp["first_actions"], 1):
            lines.append(f"{i}. {a}")
        lines.append("")
    if interp["products"]:
        lines.append("**Relevant YGY products:**")
        for p in interp["products"]:
            lines.append(f"- {p}")
    return "\n".join(lines)


def format_panel_report(panel_results):
    out = ["# Lab Panel — Wallach-Framework Interpretation", ""]
    summary = {"in_optimal_range": 0, "below_wallach_optimal": 0, "above_wallach_optimal": 0, "below_standard": 0, "above_standard": 0}
    for r in panel_results:
        if r:
            summary[r["classification"]] = summary.get(r["classification"], 0) + 1
    out.append(f"_Summary: {summary['in_optimal_range']} optimal, {summary['below_wallach_optimal'] + summary['above_wallach_optimal']} sub-optimal (still in standard range), {summary['below_standard'] + summary['above_standard']} flagged_")
    out.append("")
    for r in panel_results:
        if r:
            out.append(format_marker_report(r))
            out.append("\n---\n")
    return "\n".join(out)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--marker", help="Single marker key (e.g., vitamin_d_25oh)")
    p.add_argument("--value", type=float, help="Value to interpret")
    p.add_argument("--sex", choices=["male", "female"], default=None)
    p.add_argument("--panel", help="Comma-separated panel: marker=value,marker=value")
    p.add_argument("--list", action="store_true", help="List all available markers")
    args = p.parse_args()

    if args.list:
        print("# Available lab markers:\n")
        by_cat = {}
        for k, m in LAB_DATA["markers"].items():
            cat = m.get("category", "other")
            by_cat.setdefault(cat, []).append((k, m["name"]))
        for cat, items in sorted(by_cat.items()):
            print(f"\n## {cat.upper()}")
            for k, name in items:
                print(f"  - {k}: {name}")
        return

    if args.panel:
        results = []
        for kv in args.panel.split(","):
            if "=" not in kv: continue
            key, val = kv.split("=", 1)
            try:
                results.append(interpret_marker(key.strip(), float(val.strip()), args.sex))
            except ValueError:
                pass
        print(format_panel_report(results))
        return

    if args.marker and args.value is not None:
        result = interpret_marker(args.marker, args.value, args.sex)
        print(format_marker_report(result))
        return

    p.print_help()


if __name__ == "__main__":
    main()
