#!/usr/bin/env python
"""Build rare-earths finalize-raw + enrichment (by proposed_id). Validate all slugs resolve."""
import json, os, sys
BASE = r"C:/Users/Light/Desktop/claude/health expert"
sys.path.insert(0, os.path.join(BASE, "eden/tools"))
import catalog
RAT = os.path.join(BASE, "chronicle/ratify-unverified-2026-08-19/rare-earths")
land = {c["proposed_id"]: c for c in json.load(open(os.path.join(RAT, "landing-input.json"), encoding="utf-8"))}
ents = json.load(open(os.path.join(BASE, "eden/catalog/search-entities.json"), encoding="utf-8"))["entities"]
reg = set(ents.keys()) if isinstance(ents, dict) else set(e["slug"] for e in ents)
canon = set(e["slug"] for e in json.load(open(os.path.join(BASE, "eden/corpus/essentials-canon.json"), encoding="utf-8"))["essentials"])
cond = json.load(open(os.path.join(BASE, "eden/corpus/indices/conditions.json"), encoding="utf-8"))
cslug = set(k for k in cond if not k.startswith("_") and isinstance(cond[k], dict))
resolvable = reg | canon | cslug
FACETS = {"basics","discovery","etymology","uses","mechanism","sources","stance","big_question","biography","history","warning","physiology","protocol"}
TAGS = ["ratify-unverified-2026-08-19", "recovered-from-ruling-dashboard", "rare-earths-batch", "pdf-extracted"]

# proposed_id -> (subject, facet, essentials, conditions_final, also_about, topics)
P = {
 "WAL-CLM-RARE-000442": ("muscle_cramps","history",["calcium","vitamin-b12"],["muscle_cramps"],
    ["calcium","vitamin-b12","chromium"],
    ["leg cramps","numbness","calcium deficiency","vitamin b12","maybrick","chromium","vanadium"]),
 "WAL-CLM-RARE-000443": ("hypothyroidism","physiology",[],["hypothyroidism","muscle_cramps"],
    ["muscle_cramps","hashimotos_disease" if "hashimotos_disease" in resolvable else "muscle_cramps"],
    ["hypothyroidism","thyroid","hashimoto","muscle cramps","aching legs","cold intolerance","fatigue"]),
 "WAL-CLM-RARE-000446": ("osteoporosis","basics",["calcium","magnesium","boron","copper","sulfur"],
    ["osteoporosis","ankylosing_spondylitis","bone_spurs"],
    ["ankylosing_spondylitis","bone_spurs","calcium","magnesium","boron"],
    ["bone loss","osteoporosis","ankylosing spondylitis","bone spurs","degenerative disease","minerals","calcium","boron"]),
 "WAL-CLM-RARE-000447": ("chromium","physiology",["chromium"],["infertility"],
    ["infertility","oligospermia" if "oligospermia" in resolvable else "infertility"],
    ["chromium","chromium deficiency","male fertility","sperm count","infertility","blood sugar"]),
 "WAL-CLM-RARE-000448": ("varicose_veins","basics",[],["varicose_veins","hemorrhoids"],
    ["hemorrhoids"],
    ["calcarea fluor","calcium fluoride","cell salt","tissue salt","schuessler","varicose veins","hemorrhoids","elastic fibers"]),
 "WAL-CLM-RARE-000449": ("acne","protocol",[],[],
    ["acne"],
    ["calcarea sulph","cell salt","tissue salt","schuessler","pimples","pustules","acne","skin"]),
 "WAL-CLM-RARE-000453": ("hair-analysis","physiology",[],["celiac_disease"],
    ["celiac_disease","food_allergy","allergies"],
    ["hair analysis","food allergy","celiac disease","malabsorption","hypochlorhydria","cows milk","gluten","mineral deficiency"]),
 "WAL-CLM-RARE-000457": ("veganism","physiology",["calcium","copper","chromium","vanadium","zinc"],[],
    ["osteoporosis","phytic-acid" if "phytic-acid" in resolvable else "veganism"],
    ["vegan","vegetarian","phytic acid","mineral deficiency","weak bones","osteoporosis","zinc","copper"]),
 "WAL-CLM-RARE-000458": ("high_cholesterol","sources",["omega-3"],["high_cholesterol"],
    ["high_cholesterol","omega-3","cardiovascular_disease"],
    ["eskimo diet","high fat diet","cholesterol","essential fatty acids","omega-3","fish","heart disease"]),
 "WAL-CLM-RARE-000466": ("adhd","physiology",["chromium"],["adhd"],
    ["adhd","hyperactivity","sugar","chromium"],
    ["sugar","behavior","children","add","adhd","hyperactivity","drawings","chromium","vanadium","lithium"]),
 "WAL-CLM-RARE-000469": ("magnesium","mechanism",["magnesium"],["constipation"],
    ["constipation","magnesium"],
    ["epsom salts","magnesium","constipation","laxative","purgative","epsom water","mineral water"]),
 "WAL-CLM-RARE-000470": ("bismuth","warning",[],["constipation"],
    ["constipation","peptic_ulcers" if "peptic_ulcers" in resolvable else "constipation"],
    ["bismuth","pepto bismol","constipation","dyspepsia","gastric ulcers","trousseau"]),
 "WAL-CLM-RARE-000471": ("muscle_cramps","warning",[],["vertigo"],
    ["vertigo","muscle_cramps"],
    ["muscle relaxants","dizziness","drowsiness","falls","flexeril","robaxin","norflex","vertigo","elderly"]),
}

errors, finalize_claims, enrichment, order = [], [], {}, list(P.keys())
for pid in order:
    subject, facet, essentials, conditions, also_about, topics = P[pid]
    c = land[pid]
    if subject not in (reg | canon): errors.append(f"{pid[8:]}: subject {subject!r} UNRESOLVED")
    if facet not in FACETS: errors.append(f"{pid[8:]}: facet {facet!r} invalid")
    for ab in also_about:
        if ab not in resolvable: errors.append(f"{pid[8:]}: also_about {ab!r} UNRESOLVED")
    for cc in conditions:
        if cc not in cslug: errors.append(f"{pid[8:]}: condition {cc!r} not registered")
    for e in essentials:
        if e not in canon: errors.append(f"{pid[8:]}: essential {e!r} NOT canon")
    if not c["question"][0].isupper(): errors.append(f"{pid[8:]}: question not capitalized")
    also_about = [x for i, x in enumerate(also_about) if x not in also_about[:i] and x != subject]
    a_full = json.load(open(os.path.join(RAT, "..", "answer-fulls.json"), encoding="utf-8"))
    finalize_claims.append({"kind": c["kind"], "essentials": essentials, "other_substances": [],
        "conditions": conditions, "symptoms": [], "claim_text": c["claim_text"],
        "verbatim": c["verbatim"], "tags": TAGS, "confidence": "high"})
    enrichment[pid] = {"subject": subject, "also_about": also_about, "facet": facet,
        "question": c["question"], "answer_short": c["answer_short"], "answer_full": c["answer_full"], "topics": topics}

print("ERRORS:" if errors else "NO VALIDATION ERRORS")
for e in errors: print("  ", e)
if not errors:
    json.dump({"claims": finalize_claims}, open(os.path.join(RAT, "finalize-raw.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(enrichment, open(os.path.join(RAT, "enrichment-by-proposed.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(order, open(os.path.join(RAT, "input-order.json"), "w", encoding="utf-8"))
    print(f"wrote finalize-raw.json ({len(finalize_claims)}), enrichment-by-proposed.json, input-order.json")
