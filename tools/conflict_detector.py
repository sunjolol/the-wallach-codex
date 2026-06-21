#!/usr/bin/env python3
"""
conflict_detector.py — Analyze user-stack for Wallach-framework conflicts.

Checks user-stack.json + products-db.json against interactions-rules.json
for absorption conflicts, missing cofactors, timing rules, and depletion chains.

Usage:
    python tools/conflict_detector.py                    # report on current stack
    python tools/conflict_detector.py --scenario recommended  # report on recommended additions
    python tools/conflict_detector.py --severity high   # show high-severity only
    python tools/conflict_detector.py --json
"""
import argparse
import json
import re
import sys
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent

INTERACTIONS = json.loads((ROOT / "knowledge/corpus-index/interactions-rules.json").read_text())
PRODUCTS_DB = json.loads((ROOT / "knowledge/products-db.json").read_text())
USER_STACK = json.loads((ROOT / "memory/user-stack.json").read_text())


def compute_stack_intake(entries):
    """Sum daily intake per nutrient across stack entries."""
    intake = defaultdict(lambda: {"mg": 0.0, "mcg": 0.0, "iu": 0.0, "sources": []})
    for entry in entries:
        product = PRODUCTS_DB["products"].get(entry["product"])
        if not product:
            continue
        scale = entry["scaling_factor"]
        for nname, ninfo in product.get("nutrients", {}).items():
            amt = ninfo.get("amount")
            unit = (ninfo.get("unit") or "").lower().strip()
            if amt is None or not isinstance(amt, (int, float)):
                continue
            scaled = amt * scale
            if "mcg" in unit:
                intake[nname]["mcg"] += scaled
            elif "mg" in unit and "mcg" not in unit:
                intake[nname]["mg"] += scaled
            elif "iu" in unit:
                intake[nname]["iu"] += scaled
            elif unit == "g":
                intake[nname]["mg"] += scaled * 1000
            intake[nname]["sources"].append({
                "product": entry["product"],
                "amount": amt,
                "unit": unit,
                "form": ninfo.get("form"),
            })
    return intake


def has_nutrient(intake, nutrient_key, min_mg=0, min_mcg=0):
    """Check if a nutrient in user intake exceeds threshold."""
    nutrient_key = nutrient_key.lower()
    for nname, ndata in intake.items():
        if nutrient_key in nname.lower():
            if ndata["mg"] >= min_mg and ndata["mcg"] >= min_mcg:
                return ndata
    return None


def nutrient_total(intake, nutrient_key):
    """Return total mg and mcg for a nutrient across all products."""
    nutrient_key = nutrient_key.lower()
    mg = 0
    mcg = 0
    sources = []
    for nname, ndata in intake.items():
        if nutrient_key in nname.lower():
            mg += ndata["mg"]
            mcg += ndata["mcg"]
            sources.extend(ndata["sources"])
    return mg, mcg, sources


def check_zn_cu_ratio(intake):
    """Check Zn:Cu ratio at clinical doses."""
    zn_mg, zn_mcg, zn_src = nutrient_total(intake, "zinc")
    cu_mg, cu_mcg, cu_src = nutrient_total(intake, "copper")
    zn_total_mg = zn_mg + (zn_mcg / 1000)
    cu_total_mg = cu_mg + (cu_mcg / 1000)
    if zn_total_mg < 1:
        return None
    if zn_total_mg > 30:
        recommended_cu = zn_total_mg / 15
        if cu_total_mg < recommended_cu * 0.7:
            return {
                "triggered": True,
                "details": f"Zn intake {zn_total_mg:.1f} mg/day with Cu {cu_total_mg:.2f} mg/day — Cu insufficient",
                "recommendation": f"Add ~{recommended_cu:.1f} mg Cu/day. Ancestral Liver delivers 7.5 mg Cu food-form. Most YGY multis under-deliver Cu.",
                "zn_total": zn_total_mg,
                "cu_total": cu_total_mg,
            }
    return None


def check_ca_mg_ratio(intake):
    """Check Ca:Mg ratio."""
    ca_mg, _, _ = nutrient_total(intake, "calcium")
    mg_mg, _, _ = nutrient_total(intake, "magnesium")
    if ca_mg < 100:
        return None
    if mg_mg < ca_mg * 0.4:
        return {
            "triggered": True,
            "details": f"Ca {ca_mg:.0f} mg/day with only {mg_mg:.0f} mg Mg — ratio {ca_mg/max(mg_mg,1):.1f}:1, Wallach targets 2:1",
            "recommendation": f"Increase Mg to ~{ca_mg/2:.0f} mg/day. Cal Toddy Liquid has 600 mg Mg; Beyond Osteo FX 300 mg.",
        }
    return None


def check_caffeine_cr(intake, products_in_stack):
    """Estimate caffeine + Cr loss."""
    caffeine_products = {
        "Neutonic Productivity Drink": 120,
        "ACT Energy Stick Pack": 120,
        "ACT Energy Canister": 120,
        "Pollen Burst Plus (Strawberry-Acai)": 75,
        "Pollen Burst Plus (Dragonfruit)": 75,
        "Pollen Burst Plus (Berry/Cassis)": 75,
        "Pollen Burst Plus (Orange)": 75,
        "Soul Stiks": 15,
        "SmartStiks": 25,
        "Slender FX Keto Power Up": 75,
        "ElectroFuel": 110,
        "ChiYo3 Energy (Goji Juice)": 100,
        "Tazza di Vita (Mushroom Coffee)": 50,  # typical coffee
        "Rebound FX (Can)": 150,
        "Rebound FX Citrus Punch (Powder)": 100,
        "Activate GLP-1": 0,  # no caffeine
        "Ultimate Cardio Stx": 120,
        "VitalStart (Cardiovascular Stick Pack)": 0,
        "BE Trim Sticks (Mango or Pina Colada)": 28,
        "TRIM Sticks (Kiwi-Strawberry M-THERMX)": 104,
    }
    total_caffeine = 0
    sources = []
    for entry in products_in_stack:
        p = entry["product"]
        if p in caffeine_products:
            per = caffeine_products[p]
            total = per * entry["scaling_factor"]
            if total > 0:
                total_caffeine += total
                sources.append(f"{p}: {total:.0f} mg")
    if total_caffeine < 100:
        return None
    cr_mg, cr_mcg, cr_src = nutrient_total(intake, "chromium")
    cr_total = cr_mg * 1000 + cr_mcg  # all in mcg
    if total_caffeine >= 200 and cr_total < 200:
        return {
            "triggered": True,
            "details": f"Caffeine {total_caffeine:.0f} mg/day from [{', '.join(sources)}]; Cr only {cr_total:.0f} mcg/day",
            "recommendation": "Wallach: caffeine raises urinary Cr loss. Add Cr to 200+ mcg/day GTF-aligned. Glucogenix (Cr polynicotinate 70mcg/2tabs) or Ultimate Selenium 3 caps (Cr 300mcg nicotinate glycinate).",
            "caffeine_mg": total_caffeine,
            "cr_mcg": cr_total,
        }
    return None


def check_d3_mg_k2(intake):
    """High-dose D3 without Mg and K2 cofactors."""
    d_mg, d_mcg, d_src = nutrient_total(intake, "vitamin d")
    d_iu = 0
    for s in d_src:
        if s["unit"].strip().lower() == "iu":
            try:
                d_iu += float(s["amount"])
            except (ValueError, TypeError):
                pass
    if d_iu == 0 and (d_mg > 0 or d_mcg > 0):
        d_iu = (d_mg * 1000 + d_mcg) * 40  # mcg cholecalciferol → IU
    if d_iu < 2000:
        return None
    mg_mg, _, _ = nutrient_total(intake, "magnesium")
    k_mg, k_mcg, k_src = nutrient_total(intake, "vitamin k")
    k_mk7_present = any("mk-7" in (s.get("form") or "").lower() or "menaquinone-7" in (s.get("form") or "").lower() or "menatetrenone" in (s.get("form") or "").lower() for s in k_src)
    issues = []
    if mg_mg < 400:
        issues.append(f"Mg only {mg_mg:.0f} mg (target 400+ mg for high-D3)")
    if not k_mk7_present:
        issues.append("No K2 MK-7 detected — Integris Vitamin K2 (100 mcg MK-7) or BTT 2.5/ProJoint FX recommended")
    if issues:
        return {
            "triggered": True,
            "details": f"D3 intake {d_iu:.0f} IU/day. Missing cofactors: {'; '.join(issues)}",
            "recommendation": "High-D3 without Mg + K2 cofactors risks soft-tissue calcification per Wallach calcification-conservative framing.",
        }
    return None


def check_stack(scenario="current", severity_filter=None):
    """Run all checks on the specified scenario."""
    if scenario == "current":
        entries = USER_STACK["current"]
    else:
        entries = USER_STACK["current"] + [
            r for r in USER_STACK.get("recommended_pending_decision", [])
            if not r.get("blocked_until")
        ]

    intake = compute_stack_intake(entries)

    # Run programmatic checks
    triggered = []

    zn_cu = check_zn_cu_ratio(intake)
    if zn_cu:
        zn_cu["rule"] = next(r for r in INTERACTIONS["interactions"] if r["id"] == "zn-cu-ratio")
        triggered.append(zn_cu)

    ca_mg = check_ca_mg_ratio(intake)
    if ca_mg:
        ca_mg["rule"] = next(r for r in INTERACTIONS["interactions"] if r["id"] == "ca-mg-ratio")
        triggered.append(ca_mg)

    caf_cr = check_caffeine_cr(intake, entries)
    if caf_cr:
        caf_cr["rule"] = next(r for r in INTERACTIONS["interactions"] if r["id"] == "caffeine-cr-loss")
        triggered.append(caf_cr)

    d3_mg_k2 = check_d3_mg_k2(intake)
    if d3_mg_k2:
        d3_mg_k2["rule"] = next(r for r in INTERACTIONS["interactions"] if r["id"] == "vit-d-without-mg-k2")
        triggered.append(d3_mg_k2)

    # Check products for known per-product flags — only flag products whose presence MEETS the rule trigger
    # (a product in the products_to_check list is a CANDIDATE to address that rule, not a trigger of it)
    # Programmatic checks above handle the actual triggers.

    # However, we do want to flag products with specific built-in concerns:
    PRODUCT_SPECIFIC_FLAGS = [
        ("Sta-Balanced", "yohimbe-cardiac-risk"),  # contains yohimbe
    ]
    product_names = {e["product"] for e in entries}
    for pn, rule_id in PRODUCT_SPECIFIC_FLAGS:
        if pn in product_names:
            rule = next((r for r in INTERACTIONS["interactions"] if r["id"] == rule_id), None)
            if rule:
                triggered.append({
                    "triggered": True,
                    "rule": rule,
                    "details": f"Product '{pn}' contains flagged ingredient",
                    "recommendation": rule["rule"],
                })

    # Always-relevant lifestyle/diet checks (apply to all users by default).
    # Aluminum split into Tier-A (cookware/personal-care — always surface) and
    # Tier-B (beverage cans — moderate, mention once with practical framing).
    LIFESTYLE_RULES = [
        "salt-restriction-b12",
        "aluminum-tier-a-cookware-personal-care",
        "aluminum-tier-b-beverage-cans",
        "fried-foods-rancid-oils",
        "fluoride-water-additive", "food-allergens-pulse-test", "low-fat-cholesterol-myelin",
    ]
    for rule_id in LIFESTYLE_RULES:
        rule = next((r for r in INTERACTIONS["interactions"] if r["id"] == rule_id), None)
        if rule:
            triggered.append({
                "triggered": True,
                "rule": rule,
                "details": "Lifestyle/diet baseline rule applies to all users",
                "recommendation": rule["rule"],
                "is_baseline": True,
            })

    # Filter severity
    if severity_filter:
        triggered = [t for t in triggered if t["rule"]["severity"] == severity_filter]

    return triggered, intake


def format_report(triggered, intake, scenario):
    out = [f"# Conflict Detector — Scenario: {scenario}", ""]
    out.append(f"_{len(triggered)} flagged interactions / rules_")
    out.append("")

    # Group by severity
    by_sev = defaultdict(list)
    for t in triggered:
        by_sev[t["rule"]["severity"]].append(t)

    for sev in ["high", "moderate", "low"]:
        if sev not in by_sev:
            continue
        out.append(f"## {sev.upper()} SEVERITY ({len(by_sev[sev])})")
        out.append("")
        for t in by_sev[sev]:
            r = t["rule"]
            tag = "**[BASELINE LIFESTYLE]**" if t.get("is_baseline") else ""
            out.append(f"### {r['id']} {tag}")
            out.append(f"**Type:** {r['type']}  ")
            out.append(f"**Trigger:** {r['trigger']}")
            out.append("")
            out.append(f"**Status:** {t['details']}")
            out.append("")
            out.append(f"**Rule:** {r['rule']}")
            out.append("")
            out.append(f"**Recommendation:** {t['recommendation']}")
            out.append("")
            out.append(f"_Source: {r['source']} · {r['wallach_evidence'][:300]}_")
            out.append("")
            out.append("---")
            out.append("")

    return "\n".join(out)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--scenario", choices=["current", "recommended"], default="current")
    p.add_argument("--severity", choices=["high", "moderate", "low"], default=None)
    p.add_argument("--json", action="store_true")
    args = p.parse_args()

    triggered, intake = check_stack(args.scenario, args.severity)

    if args.json:
        # Strip non-serializable parts
        clean = []
        for t in triggered:
            clean.append({
                "rule_id": t["rule"]["id"],
                "severity": t["rule"]["severity"],
                "type": t["rule"]["type"],
                "details": t["details"],
                "recommendation": t["recommendation"],
            })
        print(json.dumps({"scenario": args.scenario, "flagged": clean}, indent=2))
    else:
        print(format_report(triggered, intake, args.scenario))


if __name__ == "__main__":
    main()
