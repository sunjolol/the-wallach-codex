#!/usr/bin/env python
"""Build finalize-raw.json + enrichment.json (keyed by proposed_id) for the 25 keepers.
Validate: subject resolves, also_about resolves, facet valid, conditions registered."""
import json, os, sys
BASE = r"C:/Users/Light/Desktop/claude/health expert"
sys.path.insert(0, os.path.join(BASE, "eden/tools"))
import catalog
RAT = os.path.join(BASE, "chronicle/ratify-unverified-2026-08-19/immortality")
land = {c["proposed_id"]: c for c in json.load(open(os.path.join(RAT, "landing-input.json"), encoding="utf-8"))}
answers = {a["proposed_id"]: a for a in json.load(open(os.path.join(RAT, "..", "answer-fulls.json"), encoding="utf-8"))}
ents = json.load(open(os.path.join(BASE, "eden/catalog/search-entities.json"), encoding="utf-8"))["entities"]
reg_slugs = set(ents.keys()) if isinstance(ents, dict) else set(e["slug"] for e in ents)
canon = set(e["slug"] for e in json.load(open(os.path.join(BASE, "eden/corpus/essentials-canon.json"), encoding="utf-8"))["essentials"])
cond = json.load(open(os.path.join(BASE, "eden/corpus/indices/conditions.json"), encoding="utf-8"))
cond_slugs = set(k for k in cond if not k.startswith("_") and isinstance(cond[k], dict))
resolvable = reg_slugs | canon | cond_slugs
FACETS = {"basics","discovery","etymology","uses","mechanism","sources","stance","big_question","biography","history","warning","physiology","protocol"}

TAGS = ["ratify-unverified-2026-08-19", "recovered-from-ruling-dashboard", "immortality-batch", "raw-ocr"]

# PLAN: proposed_id -> (subject, facet, essentials, conditions[kept], also_about, topics)
P = {
 "WAL-CLM-IMMORT-000734": ("longevity","protocol",[],["cancer","cardiovascular_disease"],
    ["cancer","cardiovascular_disease","stress"],
    ["meditation","cancer","heart disease","dhea","cortisol","anti-aging","stress","blood pressure"]),
 "WAL-CLM-IMMORT-000738": ("minerals","mechanism",[],["obesity","diabetes"],
    ["obesity","diabetes","minerals"],
    ["navajo","culinary ash","baking soda","wood ash","obesity","diabetes","minerals"]),
 "WAL-CLM-IMMORT-000747": ("hunza","history",[],["birth_defects"],
    ["birth_defects"],
    ["hunza","birth defects","hermaphrodites","mukhanas","longevity"]),
 "WAL-CLM-IMMORT-000752": ("diabetes","protocol",[],["diabetes"],
    ["diabetes"],
    ["bitter melon","goya","momordica charantia","blood sugar","diabetes","okinawa"]),
 "WAL-CLM-IMMORT-000757": ("resveratrol","basics",[],["cancer","diabetes","cardiovascular_disease"],
    ["cancer","diabetes","cardiovascular_disease","red-wine" if "red-wine" in resolvable else "resveratrol"],
    ["grape cure","johanna brandt","red grapes","resveratrol","cancer","heart disease","diabetes"]),
 "WAL-CLM-IMMORT-000764": ("resveratrol","mechanism",[],[],
    ["alzheimers"],
    ["resveratrol","amyloid-beta","alzheimer's","plaques","brain"]),
 "WAL-CLM-IMMORT-000767": ("resveratrol","mechanism",[],["insulin_resistance","cardiovascular_disease","liver_disease"],
    ["insulin_resistance","cardiovascular_disease","liver_disease"],
    ["resveratrol","high-fat diet","insulin resistance","heart disease","liver damage","longevity"]),
 "WAL-CLM-IMMORT-000771": ("chocolate","mechanism",["flavonoids"],[],
    ["flavonoids","antioxidants"],
    ["chocolate","cocoa","weight loss","energy","thermogenic","antioxidant","theobromine","caffeine"]),
 "WAL-CLM-IMMORT-000772": ("antioxidants","mechanism",[],["atherosclerosis","arthritis","peptic_ulcers","cardiovascular_disease","allergies"],
    ["atherosclerosis","arthritis","peptic_ulcers","cardiovascular_disease","allergies"],
    ["anthocyanins","free radicals","blood vessels","atherosclerosis","allergies","arthritis","antioxidant"]),
 "WAL-CLM-IMMORT-000773": ("chocolate","mechanism",[],[],
    ["cancer"],
    ["chocolate","catechins","epicatechins","cancer","carcinogens","detoxification"]),
 "WAL-CLM-IMMORT-000777": ("chocolate","sources",[],[],
    ["antioxidants"],
    ["chocolate","cacao butter","stearic acid","palmitic acid","oleic acid","saturated fat"]),
 "WAL-CLM-IMMORT-000778": ("chocolate","mechanism",["flavonoids"],["high_cholesterol","cardiovascular_disease"],
    ["high_cholesterol","cardiovascular_disease","flavonoids"],
    ["chocolate","cholesterol","ldl","flavonoids","blood flow","cacao"]),
 "WAL-CLM-IMMORT-000806": ("sulfur","physiology",["sulfur"],["osteoarthritis","degenerative_disc_disease"],
    ["osteoarthritis","degenerative_disc_disease","chondroitin"if "chondroitin" in resolvable else "cartilage"],
    ["sulfur","chondroitin sulfate","cartilage","discs","spinal discs","osteoarthritis","connective tissue"]),
 "WAL-CLM-IMMORT-000809": ("malnutrition","physiology",[],["infertility","low_libido"],
    ["infertility","low_libido","malnutrition"],
    ["calorie restriction","crash dieting","under-eating","libido","sex drive","infertility","malnutrition"]),
 "WAL-CLM-IMMORT-000810": ("gout","biography",[],["gout","obesity"],
    ["gout","obesity"],
    ["cornaro","gout","obesity","overeating","rich living","gluttony"]),
 "WAL-CLM-IMMORT-000811": ("longevity","biography",[],[],
    ["gout"],
    ["cornaro","calorie restriction","diet","longevity","103 years","gout"]),
 "WAL-CLM-IMMORT-000812": ("antioxidants","mechanism",[],["allergies"],
    ["allergies","histamine"if "histamine" in resolvable else "antioxidants"],
    ["anthocyanins","allergies","histamine","colorful fruits","inflammation","antioxidant"]),
 "WAL-CLM-IMMORT-000814": ("longevity","protocol",[],[],
    ["hypertension"],
    ["meditation","blood pressure","hypertension","dhea","cortisol","relaxation"]),
 "WAL-CLM-IMMORT-000815": ("longevity","history",[],[],
    ["hypertension"],
    ["blood pressure","caucasus","georgians","longevity","age 100","104/72","long-lived"]),
 "WAL-CLM-IMMORT-000816": ("malnutrition","mechanism",[],[],
    ["anxiety","hyperirritability"],
    ["mccarrison","junk food","processed diet","nervous","irritable","behavior","white bread"]),
 "WAL-CLM-IMMORT-000817": ("veganism","physiology",[],["gray_hair"],
    ["gray_hair","alopecia","periodontal_disease","anemia"],
    ["vegan","veganism","gray hair","minerals","supplements","receding gums","anemia"]),
 "WAL-CLM-IMMORT-000820": ("phosphorus","mechanism",["phosphorus"],["periodontal_disease"],
    ["periodontal_disease","phytates"if "phytates" in resolvable else "phosphorus","calcium"if "calcium" in resolvable else "phosphorus"],
    ["phosphorus","phytates","phytic acid","high protein diet","whole grains","periodontal disease","mineral absorption","loose teeth"]),
 "WAL-CLM-IMMORT-000821": ("vitamin-c","physiology",["vitamin-c"],["bleeding_gums","periodontal_disease"],
    ["bleeding_gums","periodontal_disease","scurvy"],
    ["vitamin c","scurvy","bleeding gums","loose teeth","swollen gums","deficiency"]),
 "WAL-CLM-IMMORT-000824": ("vitamin-b12","physiology",["vitamin-b12"],["neuropathy"],
    ["neuropathy","anemia","celiac_disease","crohns_disease"],
    ["vitamin b12","b12","intrinsic factor","vegan","neuropathy","megaloblastic anemia","stomach acid","meat"]),
 "WAL-CLM-IMMORT-000826": ("vitamin-b5","physiology",["vitamin-b5"],[],
    ["peripheral_neuropathy"],
    ["pantothenic acid","vitamin b5","burning feet","burning sensations","nerve","deficiency"]),
}

# search-only conditions per claim (from remediation plan) - for the record + note in enrichment
SEARCH_ONLY = json.load(open(os.path.join(RAT, "condition-remediation.json"), encoding="utf-8"))["final_mappings"]

errors = []
finalize_claims = []
enrichment = {}
order = list(P.keys())  # INPUT ORDER -> maps to sealed ids via idmap after finalize
for pid in order:
    subject, facet, essentials, conditions, also_about, topics = P[pid]
    c = land[pid]; a = answers[pid]
    # validate
    if subject not in (reg_slugs | canon): errors.append(f"{pid[8:]}: subject {subject!r} UNRESOLVED")
    if facet not in FACETS: errors.append(f"{pid[8:]}: facet {facet!r} invalid")
    for ab in also_about:
        if ab not in resolvable: errors.append(f"{pid[8:]}: also_about {ab!r} UNRESOLVED")
    for cc in conditions:
        if cc not in cond_slugs: errors.append(f"{pid[8:]}: condition {cc!r} not registered")
    for e in essentials:
        if e not in canon: errors.append(f"{pid[8:]}: essential {e!r} not canon")
    if not a["answer_full"].strip(): errors.append(f"{pid[8:]}: empty answer_full")
    if not c["question"][0].isupper(): errors.append(f"{pid[8:]}: question not capitalized")
    # dedupe also_about (some conditional exprs may collide with subject)
    also_about = [x for i,x in enumerate(also_about) if x not in also_about[:i] and x != subject]

    finalize_claims.append({
        "kind": c["kind"], "essentials": essentials, "other_substances": [],
        "conditions": conditions, "symptoms": [],
        "claim_text": c["claim_text"], "verbatim": c["verbatim"],
        "tags": TAGS, "confidence": "high",
    })
    enrichment[pid] = {
        "subject": subject, "also_about": also_about, "facet": facet,
        "question": c["question"], "answer_short": c["answer_short"],
        "answer_full": a["answer_full"], "topics": topics,
    }

print("ERRORS:" if errors else "NO VALIDATION ERRORS")
for e in errors: print("  ", e)

json.dump({"claims": finalize_claims}, open(os.path.join(RAT, "finalize-raw.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump(enrichment, open(os.path.join(RAT, "enrichment-by-proposed.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump(order, open(os.path.join(RAT, "input-order.json"), "w", encoding="utf-8"))
print(f"\nwrote finalize-raw.json ({len(finalize_claims)} claims), enrichment-by-proposed.json, input-order.json")
