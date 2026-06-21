#!/usr/bin/env python3
"""
label_scorer.py — Wallach-framework + personal-fit label evaluator.

Scan a non-YGY product label (or any product not yet in products-db.json) and
get a single coherent report covering:
  1. Wallach alignment score (form-alignment + essentials match + anti-list flags)
  2. Personalized gap-fill report — per nutrient, how much would this product
     close the user's current 90-essentials coverage gap?
  3. Goal-specific contribution — which user-goal does this product serve and
     by how much?
  4. Conflict check — would adding this trigger any rules in
     interactions-rules.json against the user's current stack?
  5. Verdict — ADD / REJECT / SAVE-FOR-LATER, with reasoning.

Optional wishlist persistence to memory/product-wishlist.json — "shopping cart"
for products to revisit later.

LABEL JSON SCHEMA (the input shape):
{
  "name": "HYDRA DNA Collagen Sparkling Beverage",
  "brand": "HYDRA DNA",
  "category": "beverage / collagen drink",
  "serving_size": "1 can (12 fl oz / 355 mL)",
  "servings_per_unit": 1,
  "intended_daily_servings": 1.5,
  "container_format": "aluminum_can",   // triggers Tier-B aluminum flag
  "ingredients_text": "Carbonated Water, Collagen Peptides, ...",
  "description": "marketing text",
  "nutrients": {
    "Collagen Peptides": {"amount": 12, "unit": "g", "form": "...", "form_alignment": "aligned"},
    ...
  },
  "framework_adjacent": {
    "Mushroom extract (unspecified)": {"amount": "unknown", "unit": "n/a", "note": "..."}
  }
}

Usage:
    python tools/label_scorer.py --label-file labels/hydra-dna.json
    python tools/label_scorer.py --label-json '{...}'
    python tools/label_scorer.py --wishlist list
    python tools/label_scorer.py --wishlist add --label-file labels/foo.json --user-notes "saw at whole foods"
    python tools/label_scorer.py --wishlist remove --name "Product Name"
    python tools/label_scorer.py --label-file labels/foo.json --format json
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
INTERACTIONS = ROOT / "knowledge" / "corpus-index" / "interactions-rules.json"
CATALOG_GOAL_IDX = ROOT / "knowledge" / "catalog-index" / "goal-to-products.json"
WISHLIST_PATH = ROOT / "memory" / "product-wishlist.json"

# Goal keywords — same set as catalog_index.py for consistency
GOAL_KEYWORDS = {
    "cognition": ["cogniti", "memory", "focus", "brain", "neuro", "mental", "concentration",
                  "alzheimer", "dementia", "lecithin", "choline", "phosphatidyl", "nerve",
                  "synaptic", "myelin", "korsakoff", "mood"],
    "hormones_strength": ["testosterone", "hormone", "libido", "strength", "muscle", "androgen",
                          "estrogen", "boron", "tribulus", "anabolic", "vitality", "sexual",
                          "male enhanc", "androsten", "performance"],
    "longevity_anti_aging": ["aging", "longevity", "anti-aging", "antiaging", "youthful", "lifespan",
                              "telomere", "wrinkle", "rejuven", "centenarian", "resveratrol", "century"],
    "joints_collagen": ["joint", "cartilage", "collagen", "msm", "glucosamine", "chondroitin",
                        "arthritis", "flexibility", "mobility", "tendon", "ligament", "hyaluron"],
    "energy_metabolism": ["energy", "metabolism", "fatigue", "stamina", "endurance", "atp",
                          "mitochondri", "tired", "vigor", "co-q10", "coq10", "b-complex"],
    "immunity": ["immun", "infection", "antiviral", "antimicrobial", "antibacter", "cold ",
                 "flu", "virus", "antioxidant defense", "lymph", "thymus"],
    "gut_digestion": ["digesti", "gut", "probiotic", "enzyme", "stomach", "intestin", "ibs",
                      "ulcer", "betaine", "hcl", "leaky", "microbiome", "constipation", "bowel",
                      "colon", "candida"],
    "cardiovascular": ["cardiovasc", "heart", "blood pressure", "cholesterol", "circulation",
                       "artery", "arteries", "vein", "aneurysm", "stroke"],
    "bone_skeletal": ["bone", "osteoporosis", "osteo", "skeletal", "spine", "fracture", "vertebr"],
    "thyroid_endocrine": ["thyroid", "iodine", "selenium", "adrenal", "endocrine", "cortisol"],
    "skin_hair_nails": ["skin", "hair", "nail", "complexion", "wrinkle", "acne", "biotin", "silica"],
    "blood_sugar": ["blood sugar", "glucose", "diabet", "insulin", "glycemic", "chromium", "vanadium"],
    "sleep_stress": ["sleep", "insomnia", "stress", "relax", "anxiety", "calm", "rest", "melatonin"],
    "hydration_electrolyte": ["hydrat", "electrolyte", "salt", "sodium", "potassium"],
}

# Anti-list keywords that label_scorer checks ingredients_text for
ANTI_LIST_KEYWORDS = {
    "fried-oils-seed-oils": ["canola oil", "soybean oil", "vegetable oil", "sunflower oil",
                             "safflower oil", "corn oil", "cottonseed oil", "rapeseed oil",
                             "hydrogenated"],
    "added-sugar": ["high fructose corn syrup", "corn syrup", "cane sugar", "evaporated cane juice",
                    "dextrose", "maltodextrin"],
    "artificial-sweeteners": ["sucralose", "aspartame", "acesulfame", "saccharin", "neotame"],
    "caffeine": ["caffeine", "yerba mate", "guarana", "kola nut"],
    "gluten-sources": ["wheat", "barley", "rye", "malt", "spelt",
                       "oats", "oat", "oatmeal", "oat flour", "oat syrup", "oat groats", "oat bran"],
    "msg-glutamate": ["monosodium glutamate", "msg", "hydrolyzed protein", "yeast extract"],
}

# Hard-reject terms (single hit triggers REJECT regardless of dose)
HARD_REJECT_TERMS = {"high fructose corn syrup", "corn syrup", "hydrogenated",
                     "monosodium glutamate", "aspartame", "acesulfame"}

# Serious categories — 1 hit = SAVE only, 2+ hits = REJECT (unless softened)
SERIOUS_ANTI = {"fried-oils-seed-oils", "added-sugar", "gluten-sources", "msg-glutamate"}

# Hard gluten proteins (no softening regardless of GF claim)
HARD_GLUTEN_TERMS = {"wheat", "barley", "rye", "malt", "spelt"}
# Oat-derivative terms (softenable if "gluten free oats" anchor present)
OAT_DERIVED_TERMS = {"oats", "oat", "oatmeal", "oat flour", "oat syrup", "oat groats", "oat bran"}

# Framework explanations rendered in the result panel alongside each flag
ANTI_LIST_NOTES = {
    "fried-oils-seed-oils": "Wallach: 'if it has oil in name, don't use it' — broad rule against industrial seed oils due to omega-6 oxidation. High-oleic variants (sunflower/safflower/canola bred for >80% oleic acid) are framework-adjacent — significantly more stable than standard, but the broad rule still applies.",
    "added-sugar": "Wallach-direct: sugar raises urinary chromium loss 300% for 12 hours (Rare Earths Cr entry). Severity scales with daily exposure; low-dose trace use is bounded harm.",
    "artificial-sweeteners": "Wallach acknowledges sucralose as acceptable (Hell's Kitchen). Aspartame and acesulfame are mainstream-controversial — framework-adjacent. Stevia is Wallach-friendly.",
    "caffeine": "Wallach-direct: caffeine raises urinary Cr loss for ~12 hrs per dose. Not anti-coffee absolute, but flag for Cr cofactor balance.",
    "gluten-sources": "Wallach-direct on actual gluten proteins: wheat / barley / rye / malt / spelt — these always flag serious regardless of marketing. Oats flag by default (commercial supply chains carry cross-contamination risk). Operational rule: if ANY oat ingredient in the label is declared 'gluten-free' (in either word order — 'gluten free oats' or 'oats (gluten free)') — ALL oat-derivatives in that product are presumed GF. Hard gluten proteins still flag independently — no shutoff trick. Buckwheat is a pseudocereal, gluten-free despite the name.",
    "msg-glutamate": "Wallach: free glutamate is a neurotoxin concern. Common hidden sources: yeast extract, hydrolyzed protein.",
}


# ---------------------------------------------------------------------------
# Shared unit helpers (mirrors stack_coverage.py)
# ---------------------------------------------------------------------------

UNIT_TO_BASE = {
    "mcg": ("mass_mcg", 1.0), "mg": ("mass_mcg", 1000.0), "g": ("mass_mcg", 1_000_000.0),
    "iu": ("iu", 1.0), "mcg rae": ("mass_mcg", 1.0),
}
MASS_TO_IU = {"vitamin d": 40.0, "vitamin e": 1.49, "vitamin a": 3.33}
TARGET_RE = re.compile(r"(\d[\d,]*(?:\.\d+)?)\s*(?:to\s*(\d[\d,]*(?:\.\d+)?))?\s*(mcg|mg|g|IU)\b", re.IGNORECASE)


def normalize_unit(amount, unit):
    if amount is None or not isinstance(amount, (int, float)):
        return None, None
    u = (unit or "").lower().strip()
    if u in UNIT_TO_BASE:
        family, mult = UNIT_TO_BASE[u]
        return family, amount * mult
    return u, amount


def parse_target(target_str):
    if not target_str or "trace via PDM" in target_str or "via diet" in target_str:
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


def _tokens(name):
    return {t for t in re.split(r"[^a-z0-9]+", name.lower())
            if t and t not in {"vitamin","acid","complex","extract","from","the","as","and","or"} and len(t) >= 2}


def names_match(a, b):
    return bool(_tokens(a) & _tokens(b))


# ---------------------------------------------------------------------------
# Personal coverage delta — what does the user currently have vs. need?
# ---------------------------------------------------------------------------

def current_coverage(user_stack, products_db, diet_db):
    """Reuse stack_coverage logic to compute current per-nutrient intake."""
    intake = defaultdict(lambda: {"amount_mcg": 0.0, "amount_iu": 0.0})
    # Supplements
    for entry in user_stack.get("current", []):
        product = products_db["products"].get(entry["product"])
        if not product: continue
        scale = entry["scaling_factor"]
        for nname, info in product.get("nutrients", {}).items():
            family, base = normalize_unit(info.get("amount"), info.get("unit", ""))
            if family == "mass_mcg" and base is not None:
                intake[nname]["amount_mcg"] += base * scale
            elif family == "iu" and base is not None:
                intake[nname]["amount_iu"] += base * scale
    # Diet
    for entry in user_stack.get("current_diet", []):
        food = diet_db["foods"].get(entry["food"])
        if not food: continue
        scale = entry["scaling_factor"]
        for nname, info in food.get("nutrients", {}).items():
            family, base = normalize_unit(info.get("amount"), info.get("unit", ""))
            if family == "mass_mcg" and base is not None:
                intake[nname]["amount_mcg"] += base * scale
            elif family == "iu" and base is not None:
                intake[nname]["amount_iu"] += base * scale
    return intake


def find_target_for_nutrient(nname, essentials):
    """Find the matching essential entry for a label nutrient."""
    nn = nname.lower()
    for cat, items in essentials["categories"].items():
        for ess in items:
            if names_match(ess["name"], nname):
                return ess, cat
    return None, None


def gap_fill_for_nutrient(nname, label_info, daily_servings, current_intake, essentials):
    """For one nutrient on the label, compute how much it closes the user's gap."""
    ess, cat = find_target_for_nutrient(nname, essentials)
    if not ess:
        return None  # not a 90-essential

    target_str = ess.get("wallach_baseline_target", "")
    low_b, high_b, family, raw = parse_target(target_str)

    label_family, label_base = normalize_unit(label_info.get("amount"), label_info.get("unit", ""))
    if label_base is None:
        return {"essential": ess["name"], "category": cat, "label_form": label_info.get("form", ""),
                "label_amount_per_serving": f"{label_info.get('amount')} {label_info.get('unit', '')}",
                "added_per_day": "unknown", "current_intake": "n/a", "target": target_str,
                "gap_fill_pct": None, "note": "amount/unit unparseable"}

    added_per_day_base = label_base * daily_servings
    # Sum current intake across token-matched essential keys
    curr_mcg = curr_iu = 0.0
    for k, v in current_intake.items():
        if names_match(ess["name"], k):
            curr_mcg += v["amount_mcg"]
            curr_iu += v["amount_iu"]
    curr_for_family = curr_iu if family == "iu" else (curr_mcg if curr_mcg > 0 else curr_iu)
    added_for_family = added_per_day_base if (label_family == family or (family == "mass_mcg" and label_family == "mass_mcg")) else added_per_day_base

    gap_fill_pct = None
    delta_note = ""
    if low_b is not None and low_b > 0:
        gap_before = max(0, low_b - curr_for_family)
        if gap_before > 0:
            gap_fill_pct = round(100 * min(added_for_family, gap_before) / low_b, 1)
            delta_note = f"closes {gap_fill_pct}% of remaining gap"
        else:
            gap_fill_pct = 0
            delta_note = "already at/above target"

    fmt = lambda v, fam: (f"{v:.0f} IU" if fam == "iu" else
                          f"{v/1_000_000:.2f} g" if v >= 1_000_000 else
                          f"{v/1000:.1f} mg" if v >= 1000 else f"{v:.1f} mcg")

    return {
        "essential": ess["name"],
        "category": cat,
        "label_form": label_info.get("form", ""),
        "label_alignment": label_info.get("form_alignment", "unknown"),
        "label_amount_per_serving": f"{label_info.get('amount')} {label_info.get('unit', '')}",
        "added_per_day": fmt(added_for_family, family or label_family),
        "current_intake": fmt(curr_for_family, family or label_family),
        "target": target_str,
        "gap_fill_pct": gap_fill_pct,
        "note": delta_note,
    }


# ---------------------------------------------------------------------------
# Goal contribution
# ---------------------------------------------------------------------------

def match_goals(label):
    text = " ".join([label.get("name", ""), label.get("description", ""),
                     label.get("category", ""), label.get("ingredients_text", "")]).lower()
    matched = []
    for goal, kws in GOAL_KEYWORDS.items():
        for kw in kws:
            if kw in text:
                matched.append(goal)
                break
    return matched


# ---------------------------------------------------------------------------
# Anti-list / red flags from ingredients
# ---------------------------------------------------------------------------

def _match_keyword(text, kw):
    """Word-boundary keyword match — prevents false positives like 'buckwheat' matching 'wheat'."""
    escaped = re.escape(kw)
    return bool(re.search(r"\b" + escaped + r"\b", text, re.IGNORECASE))


def anti_list_flags(label):
    text = (label.get("ingredients_text", "") + " " + label.get("description", "")).lower()
    flags = []
    for category, kws in ANTI_LIST_KEYWORDS.items():
        hits = [kw for kw in kws if _match_keyword(text, kw)]
        if not hits:
            continue
        flag = {"category": category, "matched_terms": hits, "nuance": None,
                "softened": False, "severity": "mild"}

        # ---- High-oleic nuance for sunflower/safflower/canola ----
        if category == "fried-oils-seed-oils":
            variants = {"sunflower oil", "safflower oil", "canola oil"}
            variant_hits = [h for h in hits if h in variants]
            other_hits = [h for h in hits if h not in variants]
            if variant_hits and not other_hits:
                if re.search(r"high oleic[^,.]*(sunflower|safflower|canola)", text, re.IGNORECASE):
                    flag["nuance"] = ("High-oleic variant detected — significantly more oxidation-stable than "
                                       "standard seed oil (>80% oleic acid, low omega-6). Wallach's broad rule "
                                       "still applies but severity is softened.")
                    flag["softened"] = True

        # ---- Oat-anchored gluten-free declaration ----
        if category == "gluten-sources":
            hard_hits = [h for h in hits if h in HARD_GLUTEN_TERMS]
            oat_hits = [h for h in hits if h in OAT_DERIVED_TERMS]
            # Pattern 1: "gluten free [oat term]" — GF declaration precedes oat ingredient
            oat_gf_pre = re.search(
                r"gluten[-\s]+free[^,]*\b(oats|oat|oatmeal|oat\s+flour|oat\s+groats|oat\s+bran|oat\s+syrup)\b",
                text, re.IGNORECASE)
            # Pattern 2: "[oat term] ... gluten free" — GF trails oat in same segment
            oat_gf_post = re.search(
                r"\b(oats|oat|oatmeal|oat\s+flour|oat\s+groats|oat\s+bran|oat\s+syrup)\b[^,]*gluten[-\s]+free",
                text, re.IGNORECASE)
            has_gf_oat_anchor = bool(oat_gf_pre or oat_gf_post)

            if hard_hits:
                flag["nuance"] = ("Hard gluten proteins detected: " + ", ".join(f'"{t}"' for t in hard_hits) +
                                   ". Wallach-direct: wheat / barley / rye / malt / spelt are the actual gluten "
                                   "proteins. No softening — a 'gluten free oats' declaration cannot shut off the "
                                   "trigger for actual gluten elsewhere on the label.")
            elif oat_hits:
                if has_gf_oat_anchor:
                    flag["nuance"] = ("Oat-anchored gluten-free declaration detected on the label. Per the operational "
                                       "rule: once a brand certifies ANY oat ingredient as GF, they are operating in a "
                                       "GF-aware supply chain across all oat ingredients. All oat hits (" +
                                       ", ".join(f'"{t}"' for t in oat_hits) + ") are presumed gluten-free. Flag softened.")
                    flag["softened"] = True
                else:
                    flag["nuance"] = ("Oat ingredients detected (" + ", ".join(f'"{t}"' for t in oat_hits) +
                                       ") with no 'gluten free oats' declaration on the label. Standard commercial "
                                       "oats carry real cross-contamination risk from shared supply chains.")

        # ---- Severity tier ----
        if any(t in HARD_REJECT_TERMS for t in hits):
            flag["severity"] = "hard"
        elif category in SERIOUS_ANTI and not flag["softened"]:
            flag["severity"] = "serious"
        elif flag["softened"]:
            flag["severity"] = "softened"
        else:
            flag["severity"] = "mild"

        flags.append(flag)
    return flags


def container_flags(label):
    """Tier-B aluminum check per the interactions-rules split.

    Tier-A (cookware, deodorant, hidden personal-care) is a user-lifestyle audit, not a label scan.
    Tier-B (beverage cans) is what label_scorer can detect from container_format.
    """
    fmt = label.get("container_format", "").lower()
    if "aluminum" in fmt and "can" in fmt:
        return [{
            "rule_id": "aluminum-tier-b-beverage-cans",
            "severity": "moderate",
            "framing": "Tier-B exposure — practical-trade-off. Mention once briefly; do not over-emphasize. Primary aluminum focus stays on cookware + personal-care hidden sources (Tier-A) which require a separate lifestyle audit.",
        }]
    return []


# ---------------------------------------------------------------------------
# Conflict check against user's current stack
# ---------------------------------------------------------------------------

def conflict_check(label, interactions, current_coverage_intake, user_stack):
    """Check whether adding this product would push current stack into conflict territory.

    Specifically: Zn cumulative, Cu cumulative, Ca:Mg ratio shift, caffeine, etc.
    """
    flags = []
    label_n = label.get("nutrients", {})

    # Extract label's contribution at intended daily servings
    daily = label.get("intended_daily_servings", 1)
    additions = {}
    for nname, info in label_n.items():
        _, base = normalize_unit(info.get("amount"), info.get("unit", ""))
        if base is not None:
            additions[nname.lower()] = additions.get(nname.lower(), 0) + base * daily

    # Check key Wallach-direct interactions
    # Zn cumulative
    zn_added = additions.get("zinc", 0)
    zn_current = 0
    for k, v in current_coverage_intake.items():
        if "zinc" in k.lower(): zn_current += v["amount_mcg"]
    zn_total_mg = (zn_current + zn_added) / 1000
    if zn_total_mg > 30:
        flags.append({
            "rule_id": "zn-cu-ratio",
            "severity": "moderate" if zn_total_mg < 75 else "high",
            "details": f"After adding this product, Zn would total ~{zn_total_mg:.1f} mg/day. Wallach: ensure 1-2 mg Cu per 15-20 mg Zn at this dose.",
            "source": "wallach-direct",
        })

    # Caffeine — flag any caffeine addition
    if "caffeine" in (label.get("ingredients_text", "") + " " + label.get("description", "")).lower():
        flags.append({
            "rule_id": "caffeine-cr-loss",
            "severity": "moderate",
            "details": "Product contains caffeine. Wallach: caffeine raises urinary Cr loss for ~12 hrs/dose. If stacking with existing caffeine sources, ensure Cr ≥ 200 mcg/day GTF-aligned.",
            "source": "wallach-direct",
        })

    # Container format check
    flags.extend(container_flags(label))

    return flags


# ---------------------------------------------------------------------------
# Alignment score
# ---------------------------------------------------------------------------

def alignment_score(label):
    """Per catalog_index.py method: aligned*2 + partial*1 + misaligned*-1 / total."""
    a = p = m = u = 0
    for n, info in label.get("nutrients", {}).items():
        al = info.get("form_alignment", "unknown")
        if al == "aligned": a += 1
        elif al == "partial": p += 1
        elif al == "misaligned": m += 1
        else: u += 1
    total = a + p + m + u
    score = (a*2 + p*1 + m*-1) / total if total else 0
    return {"score": round(score, 2), "aligned": a, "partial": p, "misaligned": m, "unknown": u, "total": total}


def essentials_covered_count(label, essentials):
    covered = []
    for n in label.get("nutrients", {}):
        ess, _ = find_target_for_nutrient(n, essentials)
        if ess:
            covered.append(ess["name"])
    return covered


# ---------------------------------------------------------------------------
# Verdict
# ---------------------------------------------------------------------------

def verdict(alignment, gap_fills, conflicts, anti_flags, goals_matched, label=None):
    """Compose ADD / REJECT / SAVE-FOR-LATER with reasoning.

    Tiered anti-flag handling:
      - hard hits (HFCS, hydrogenated, MSG, aspartame): single hit = REJECT
      - serious hits (in SERIOUS_ANTI, not softened): 2+ hits = REJECT; single hit = SAVE
      - softened hits (high-oleic, oat-anchored GF): noted but don't trigger REJECT
      - mild hits: noted only
    """
    reasons_for = []
    reasons_against = []

    # Sparse-data acknowledgment
    sparse_nut = bool(label and not label.get("nutrients"))
    sparse_ing = bool(label and not label.get("ingredients_text"))
    if sparse_nut and sparse_ing:
        reasons_against.append("No nutrients and no ingredients entered — verdict based on name/category only")
    elif sparse_nut:
        reasons_for.append("No nutrient panel — verdict from ingredients + goal-matching only (Wallach: most modern food is nutrient-stripped anyway; supplementation necessary)")
    elif sparse_ing:
        reasons_for.append("No ingredients text — anti-list scan skipped (assumes pure-supplement context)")

    # Alignment-side reasons
    if alignment["score"] >= 1.5:
        reasons_for.append(f"High form alignment score ({alignment['score']}, {alignment['aligned']}/{alignment['total']} nutrients aligned)")
    elif alignment["score"] >= 0.5:
        reasons_for.append(f"Moderate form alignment ({alignment['score']})")
    elif alignment["misaligned"] > 0:
        reasons_against.append(f"{alignment['misaligned']} misaligned forms — non-Wallach-preferred")

    # Gap-fill reasons
    meaningful_fills = [g for g in gap_fills if g and g.get("gap_fill_pct") and g["gap_fill_pct"] >= 10]
    if meaningful_fills:
        top = sorted(meaningful_fills, key=lambda g: -g["gap_fill_pct"])[:3]
        reasons_for.append("Meaningful gap-fill: " + ", ".join(
            f"{g['essential']} (+{g['gap_fill_pct']}%)" for g in top))
    elif gap_fills and not meaningful_fills:
        reasons_against.append("No nutrient closes >10% of a current gap")

    # Goals
    if goals_matched:
        reasons_for.append(f"Goal coverage: {', '.join(goals_matched[:4])}")

    # Conflicts
    high_conflicts = [c for c in conflicts if c.get("severity") == "high"]
    if high_conflicts:
        reasons_against.append(f"High-severity conflicts: {', '.join(c['rule_id'] for c in high_conflicts)}")

    # Tiered anti-flag handling
    hard_hits = [f for f in anti_flags if f.get("severity") == "hard"]
    serious_hits = [f for f in anti_flags if f.get("severity") == "serious"]
    soft_hits = [f for f in anti_flags if f.get("severity") in ("softened", "mild")]
    if hard_hits:
        reasons_against.append(f"Hard-reject ingredients: {', '.join(f['category'] for f in hard_hits)}")
    if serious_hits:
        reasons_against.append(f"Serious anti-list flags: {', '.join(f['category'] for f in serious_hits)}")
    if soft_hits:
        reasons_against.append(f"Softened / mild flags (nuance applied): {', '.join(f['category'] for f in soft_hits)}")

    # Verdict logic — hard hits OR 2+ serious hits trigger REJECT; otherwise SAVE/ADD ladder
    if high_conflicts or hard_hits or len(serious_hits) >= 2:
        return "REJECT", reasons_for, reasons_against
    if alignment["score"] >= 1.0 and meaningful_fills and not serious_hits:
        return "ADD", reasons_for, reasons_against
    if meaningful_fills or alignment["score"] >= 0.5 or goals_matched or serious_hits or soft_hits:
        return "SAVE-FOR-LATER", reasons_for, reasons_against
    return "REJECT", reasons_for, reasons_against


# ---------------------------------------------------------------------------
# Wishlist persistence
# ---------------------------------------------------------------------------

def load_wishlist():
    if WISHLIST_PATH.exists():
        return json.loads(WISHLIST_PATH.read_text())
    return {"schema_version": "1.0", "items": []}


def save_wishlist(w):
    WISHLIST_PATH.write_text(json.dumps(w, indent=2))


def wishlist_add(label, verdict_str, gap_fills, user_notes=""):
    w = load_wishlist()
    import datetime
    item = {
        "name": label.get("name", "unnamed"),
        "brand": label.get("brand", ""),
        "category": label.get("category", ""),
        "added_date": datetime.date.today().isoformat(),
        "verdict": verdict_str,
        "label_data": label,
        "top_gap_fills": sorted([g for g in gap_fills if g and g.get("gap_fill_pct")],
                                 key=lambda g: -g["gap_fill_pct"])[:5],
        "user_notes": user_notes,
    }
    w["items"].append(item)
    save_wishlist(w)
    return len(w["items"])


def wishlist_list():
    w = load_wishlist()
    return w["items"]


def wishlist_remove(name):
    w = load_wishlist()
    before = len(w["items"])
    w["items"] = [i for i in w["items"] if name.lower() not in i["name"].lower()]
    save_wishlist(w)
    return before - len(w["items"])


# ---------------------------------------------------------------------------
# Report rendering
# ---------------------------------------------------------------------------

def render_markdown(label, alignment, gap_fills, goals_matched, conflicts, anti_flags,
                    essentials_covered_list, verdict_str, reasons_for, reasons_against):
    out = []
    name = label.get("name", "Unnamed product")
    daily = label.get("intended_daily_servings", 1)

    out.append(f"# Label Scorer — {name}")
    out.append("")
    out.append(f"**Category:** {label.get('category', 'n/a')}  ")
    out.append(f"**Intended daily servings:** {daily}  ")
    out.append(f"**Container:** {label.get('container_format', 'unspecified')}")
    out.append("")

    out.append(f"## Verdict: **{verdict_str}**")
    out.append("")
    if reasons_for:
        out.append("**For:**")
        for r in reasons_for: out.append(f"- {r}")
        out.append("")
    if reasons_against:
        out.append("**Against:**")
        for r in reasons_against: out.append(f"- {r}")
        out.append("")

    out.append("## Wallach alignment")
    out.append("")
    out.append(f"- **Form alignment score:** {alignment['score']} (out of 2.0)")
    out.append(f"- **Form distribution:** ✓{alignment['aligned']} aligned · ◐{alignment['partial']} partial · ⚠{alignment['misaligned']} misaligned · ?{alignment['unknown']} unknown")
    out.append(f"- **90-essentials covered:** {len(essentials_covered_list)} ({', '.join(essentials_covered_list[:8])}{'...' if len(essentials_covered_list) > 8 else ''})")
    out.append(f"- **Goal tags matched:** {', '.join(goals_matched) if goals_matched else 'none'}")
    out.append("")

    if gap_fills:
        out.append("## Personalized gap-fill (against your current coverage)")
        out.append("")
        out.append("| Essential | Your current | This adds | Wallach target | Gap-fill |")
        out.append("|---|---|---|---|---|")
        gap_fills_sorted = sorted([g for g in gap_fills if g], key=lambda g: -(g.get("gap_fill_pct") or 0))
        for g in gap_fills_sorted[:20]:
            pct = g.get("gap_fill_pct")
            pct_str = f"+{pct}%" if pct and pct > 0 else ("at target" if pct == 0 else "—")
            out.append(f"| {g['essential']} | {g['current_intake']} | {g['added_per_day']} | {g['target'][:50]} | {pct_str} |")
        out.append("")

    if conflicts:
        out.append("## Conflict checks (against your current stack + lifestyle baseline)")
        out.append("")
        for c in conflicts:
            sev = c.get("severity", "?").upper()
            out.append(f"- **[{sev}] {c['rule_id']}** — {c.get('details', c.get('framing', ''))}")
            if c.get("source"):
                out.append(f"  _Source: {c['source']}_")
        out.append("")

    if anti_flags:
        out.append("## Ingredient red-flags")
        out.append("")
        for f in anti_flags:
            out.append(f"- **{f['category']}**: {', '.join(f['matched_terms'])}")
        out.append("")

    fa = label.get("framework_adjacent", {})
    if fa:
        out.append("## Framework-adjacent components (modern science, not Wallach-direct)")
        out.append("")
        for k, v in fa.items():
            if isinstance(v, dict):
                out.append(f"- **{k}**: {v.get('amount', 'n/a')} {v.get('unit', '')} — {v.get('note', '')}")
        out.append("")

    out.append("---")
    out.append("_Doctrine §11: Wallach corpus is the engine; this report is a complement that completes but never drives._")
    return "\n".join(out)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def load_label(args):
    if args.label_file:
        return json.loads(Path(args.label_file).read_text())
    if args.label_json:
        return json.loads(args.label_json)
    return None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--label-file", help="Path to label JSON file")
    ap.add_argument("--label-json", help="Inline JSON string for the label")
    ap.add_argument("--format", choices=["markdown", "json"], default="markdown")
    ap.add_argument("--wishlist", choices=["add", "list", "remove"], help="Wishlist operation")
    ap.add_argument("--name", help="Product name (for wishlist remove)")
    ap.add_argument("--user-notes", default="", help="Optional user notes for wishlist add")
    args = ap.parse_args()

    # Wishlist-only operations
    if args.wishlist == "list":
        items = wishlist_list()
        if not items:
            print("# Wishlist is empty.")
            return
        print(f"# Product Wishlist ({len(items)} items)\n")
        for i, item in enumerate(items, 1):
            print(f"## {i}. {item['name']} [{item['verdict']}]")
            print(f"_{item['category']} · saved {item['added_date']}_")
            if item.get("user_notes"):
                print(f"> {item['user_notes']}")
            if item.get("top_gap_fills"):
                print("**Top gap-fills:** " + ", ".join(
                    f"{g['essential']} (+{g['gap_fill_pct']}%)" for g in item["top_gap_fills"][:3]))
            print()
        return

    if args.wishlist == "remove":
        if not args.name:
            ap.error("--wishlist remove requires --name")
        n = wishlist_remove(args.name)
        print(f"Removed {n} item(s) matching '{args.name}'")
        return

    # Scan operations need a label
    label = load_label(args)
    if not label:
        ap.error("Need --label-file or --label-json")

    products_db = json.loads(PRODUCTS_DB.read_text())
    user_stack = json.loads(USER_STACK.read_text())
    essentials = json.loads(ESSENTIALS.read_text())
    diet_db = json.loads(DIET_DB.read_text())
    interactions = json.loads(INTERACTIONS.read_text())

    # Compute current coverage (supps + diet)
    current_intake = current_coverage(user_stack, products_db, diet_db)

    # Gap-fill per nutrient
    daily_servings = label.get("intended_daily_servings", 1)
    gap_fills = []
    for nname, info in label.get("nutrients", {}).items():
        gf = gap_fill_for_nutrient(nname, info, daily_servings, current_intake, essentials)
        if gf: gap_fills.append(gf)

    # Goals
    goals_matched = match_goals(label)

    # Conflicts
    conflicts = conflict_check(label, interactions, current_intake, user_stack)

    # Anti-list
    anti_flags = anti_list_flags(label)

    # Alignment + essentials count
    alignment = alignment_score(label)
    essentials_covered_list = essentials_covered_count(label, essentials)

    # Verdict
    verdict_str, reasons_for, reasons_against = verdict(
        alignment, gap_fills, conflicts, anti_flags, goals_matched, label=label)

    # Wishlist add operation (auto-uses scan results)
    if args.wishlist == "add":
        n = wishlist_add(label, verdict_str, gap_fills, args.user_notes)
        print(f"Added '{label.get('name')}' to wishlist as item #{n} (verdict: {verdict_str})")
        return

    # Render
    if args.format == "json":
        print(json.dumps({
            "label": label, "verdict": verdict_str,
            "reasons_for": reasons_for, "reasons_against": reasons_against,
            "alignment": alignment, "goals_matched": goals_matched,
            "essentials_covered": essentials_covered_list,
            "gap_fills": gap_fills, "conflicts": conflicts, "anti_flags": anti_flags,
        }, indent=2, default=str))
    else:
        print(render_markdown(label, alignment, gap_fills, goals_matched,
                              conflicts, anti_flags, essentials_covered_list,
                              verdict_str, reasons_for, reasons_against))


if __name__ == "__main__":
    main()
