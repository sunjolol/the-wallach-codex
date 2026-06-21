#!/usr/bin/env python3
"""
extract_deficiency_map.py — Build comprehensive nutrient ↔ symptom map from Wallach corpus.

Strategy: Wallach's element entries in Rare Earths + DDDL list deficiency symptoms
per mineral. The LPD condition entries list which deficiencies CAUSE specific
conditions. Combine both for a bidirectional map.

Outputs:
- knowledge/corpus-index/nutrient-to-symptoms.json — for each named nutrient, list its deficiency symptoms
- knowledge/corpus-index/symptom-to-nutrients.json — reverse: for each symptom, which nutrients address it
- knowledge/corpus-index/condition-causes.json — for each condition, deficiency causes Wallach names
"""
import json
import re
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "knowledge/corpus-index"
OUT_DIR.mkdir(parents=True, exist_ok=True)

LPD = (ROOT / "knowledge/books-clean/421125261-Let-s-Play-Doctor-PDF-by-Joel-Wallach-Lan-Ma.txt").read_text(encoding="utf-8", errors="replace")
HK = (ROOT / "knowledge/books-clean/788873904-Dr-Joel-Wallach-Joel-D-Wallach-JD-Wallach-Ma-Lan-MD-Hell-s-Kitchen-Cau.txt").read_text(encoding="utf-8", errors="replace")
DDDL = (ROOT / "knowledge/books-clean/Joel_D__Wallach_-_Dead_Doctors_Don_t_Lie__2011___EPUB__-_roflcopter2110.txt").read_text(encoding="utf-8", errors="replace")
RE_BOOK = (ROOT / "knowledge/books-clean/pdfcoffee_com_rare-earths-forbidden-cures-pdf-by-joel-wallach-lan-ma-pdf-free.txt").read_text(encoding="utf-8", errors="replace")

# Existing extracted data
CONDS = json.loads((OUT_DIR / "conditions.json").read_text())


# Canonical list of nutrients Wallach treats (the 90 essentials + key vitamins)
KNOWN_NUTRIENTS = {
    # Minerals
    "calcium", "magnesium", "potassium", "sodium", "chloride", "phosphorus",
    "iron", "zinc", "copper", "manganese", "selenium", "chromium", "vanadium",
    "iodine", "molybdenum", "boron", "fluoride", "fluorine", "sulfur", "sulphur",
    "lithium", "germanium", "strontium", "silicon", "silica", "cobalt",
    "tin", "nickel", "rubidium", "gold", "silver",
    # Vitamins
    "vitamin a", "vitamin c", "vitamin d", "vitamin e", "vitamin k",
    "vitamin b1", "thiamine", "thiamin", "vitamin b2", "riboflavin",
    "vitamin b3", "niacin", "niacinamide",
    "vitamin b5", "pantothenic acid", "pantothenate",
    "vitamin b6", "pyridoxine", "vitamin b12", "cobalamin",
    "biotin", "folate", "folic acid", "choline", "inositol", "paba",
    "beta carotene", "beta-carotene", "carotene",
    # Amino acids
    "lysine", "arginine", "glycine", "glutamine", "tryptophan", "tyrosine",
    "methionine", "cysteine", "taurine", "phenylalanine", "histidine",
    "threonine", "valine", "leucine", "isoleucine", "alanine", "ornithine",
    "gaba", "glutamic acid", "aspartic acid",
    # Fatty acids / categories
    "essential fatty acid", "essential fatty acids", "efa", "efas",
    "omega-3", "omega 3", "omega-6", "omega 6", "dha", "epa",
    "linoleic acid", "alpha-linolenic", "ala",
    # Other essentials per Wallach
    "lecithin", "phosphatidyl choline", "phosphatidylcholine",
    "bioflavonoid", "bioflavonoids", "rutin", "quercetin", "hesperidin",
    "alpha lipoic acid", "alpha-lipoic acid", "ala",
    "coq10", "coenzyme q10", "ubiquinone",
    "msm", "methylsulfonylmethane", "glucosamine", "chondroitin",
    "betaine hcl", "pancreatic enzyme", "pancreatic enzymes",
    "hydrogen peroxide", "h2o2",
    "plant derived mineral", "plant-derived mineral", "pdm", "colloidal mineral",
    "amino acid", "amino acids",
}


def normalize_nutrient(s):
    """Normalize for matching: lowercase, strip 'vitamin', 'mineral' modifiers etc."""
    s = s.lower().strip()
    s = re.sub(r'\s+', ' ', s)
    return s


# ---------------------------------------------------------------------------
# Phase 1: Parse condition blocks for "X deficiency" mentions and "symptoms include"
# ---------------------------------------------------------------------------

DEFICIENCY_IN_BLOCK_RE = re.compile(
    r'((?:chronic\s+)?(?:vitamin\s+)?[a-zA-Z][a-zA-Z\-\d\s]{2,30}?)\s+deficien(?:cy|cies)',
    re.IGNORECASE
)

SYMPTOMS_INCLUDE_RE = re.compile(
    r'(?:symptoms?\s+(?:of\s+\w+\s+)?(?:include|of\s+\w+\s+include|are|may\s+include))\s*[:\.]?\s*([^\.]{20,1500}?\.)',
    re.IGNORECASE
)

CAUSED_BY_RE = re.compile(
    r'(?:is|can\s+be|may\s+be|are)\s+caused\s+by\s+([^\.]{20,500}?\.)',
    re.IGNORECASE
)


def parse_condition_block(cond):
    """Extract deficiencies named in block + symptom lists + caused-by clauses."""
    block = cond["block"]
    result = {
        "deficiencies_named": [],
        "symptoms_listed": [],
        "caused_by": [],
    }

    # Deficiencies named in protocol
    for m in DEFICIENCY_IN_BLOCK_RE.finditer(block):
        nutrient = normalize_nutrient(m.group(1))
        # Filter: must contain a known nutrient
        match = None
        for n in KNOWN_NUTRIENTS:
            if n in nutrient:
                match = n
                break
        if match:
            result["deficiencies_named"].append(match)

    # Symptoms
    for m in SYMPTOMS_INCLUDE_RE.finditer(block):
        result["symptoms_listed"].append(m.group(1).strip())

    # Caused by
    for m in CAUSED_BY_RE.finditer(block):
        result["caused_by"].append(m.group(1).strip())

    return result


# ---------------------------------------------------------------------------
# Phase 2: Mine Rare Earths element entries
# ---------------------------------------------------------------------------

# Rare Earths has "X - Mineralname is found in igneous rocks at Y ppm..." pattern
ELEMENT_ENTRY_RE = re.compile(
    r'\b([A-Z][a-z]{0,2})\s*[-—]\s*([A-Z][a-z]+)\s+is\s+found\s+in\s+igneous\s+rocks',
)


def extract_element_entries(text):
    """Find Rare Earths element entries and capture ~3000 chars after each."""
    entries = {}
    for m in ELEMENT_ENTRY_RE.finditer(text):
        symbol = m.group(1)
        element = m.group(2)
        start = m.start()
        end = min(start + 4000, len(text))
        block = text[start:end]
        entries[element.lower()] = {"symbol": symbol, "block": block}
    return entries


# Inside each element block, find "X deficiency causes/results in/produces"
DEF_CAUSE_RE = re.compile(
    r'(?:deficienc(?:y|ies)|symptoms?\s+of\s+deficiency)\s+(?:in\s+\w+\s+)?(?:causes?|cause|results?\s+in|produces?|leads?\s+to|manifests?\s+as|is\s+characterized\s+by|include[s]?)\s*[:.]?\s*([^.]{20,800}?\.)',
    re.IGNORECASE
)


def extract_element_deficiencies(element_block):
    symptoms = []
    for m in DEF_CAUSE_RE.finditer(element_block):
        symptoms.append(m.group(1).strip())
    return symptoms


# ---------------------------------------------------------------------------
# Phase 3: Build the maps
# ---------------------------------------------------------------------------

def build_maps():
    # nutrient → list of symptoms / conditions
    nutrient_to_symptoms = defaultdict(list)
    # nutrient → list of conditions where it's named as deficiency cause
    nutrient_to_conditions = defaultdict(list)
    # condition → deficiency causes named
    condition_causes = defaultdict(list)
    # condition → symptoms listed
    condition_symptoms = defaultdict(list)

    # Parse condition blocks
    for cond in CONDS:
        info = parse_condition_block(cond)
        cond_key = cond["heading"]
        for nut in info["deficiencies_named"]:
            nutrient_to_conditions[nut].append({
                "condition": cond_key,
                "book": cond["book"],
                "page": cond.get("page"),
            })
            condition_causes[cond_key].append({
                "deficiency": nut,
                "book": cond["book"],
                "page": cond.get("page"),
            })
        if info["symptoms_listed"]:
            condition_symptoms[cond_key].extend(info["symptoms_listed"])

    # Parse Rare Earths element entries
    re_elements = extract_element_entries(RE_BOOK)
    dddl_elements = extract_element_entries(DDDL)

    for source_name, elements in [("RE", re_elements), ("DDDL", dddl_elements)]:
        for element, data in elements.items():
            symptoms = extract_element_deficiencies(data["block"])
            for sym in symptoms:
                nutrient_to_symptoms[element].append({
                    "symptom_claim": sym,
                    "book": source_name,
                    "element_symbol": data["symbol"],
                })

    # Sort all lists
    def sort_dict_lists(d):
        return {k: v for k, v in sorted(d.items())}

    return (
        sort_dict_lists({k: list(v) for k, v in nutrient_to_symptoms.items()}),
        sort_dict_lists({k: list(v) for k, v in nutrient_to_conditions.items()}),
        sort_dict_lists({k: list(v) for k, v in condition_causes.items()}),
        sort_dict_lists({k: list(v) for k, v in condition_symptoms.items()}),
    )


# ---------------------------------------------------------------------------
# Phase 4: Symptom → nutrient reverse index
# ---------------------------------------------------------------------------

# Known Wallach symptom keywords → candidate nutrients
# Built by parsing element entries + condition blocks for symptom mentions
SYMPTOM_KEYWORDS = {
    # Hair/skin/nails
    "white spots on nails": ["zinc"],
    "premature gray": ["copper"],
    "premature gray hair": ["copper"],
    "brittle nails": ["sulfur", "amino acid"],
    "vertical ridges": ["iron", "calcium"],
    "ridges in nails": ["iron", "calcium"],
    "alopecia": ["zinc", "tin", "biotin"],
    "baldness": ["zinc", "tin", "biotin"],
    "stretch marks": ["copper", "zinc"],
    "wrinkles": ["copper", "vitamin c"],
    # Bone
    "osteoporosis": ["calcium", "magnesium", "boron", "vitamin d", "vitamin k", "strontium", "sulfur"],
    "arthritis": ["calcium", "magnesium", "sulfur", "msm", "boron"],
    "joint pain": ["sulfur", "msm", "calcium", "magnesium", "boron"],
    "kidney stones": ["calcium", "magnesium", "manganese"],
    # Cardiovascular
    "aneurysm": ["copper"],
    "ruptured aneurysm": ["copper"],
    "varicose veins": ["copper", "bioflavonoids"],
    "high blood pressure": ["calcium", "magnesium", "potassium"],
    "hypertension": ["calcium", "magnesium", "potassium"],
    # Endocrine
    "low testosterone": ["zinc", "boron"],
    "low t": ["zinc", "boron"],
    "infertility": ["zinc", "selenium", "boron"],
    "low libido": ["zinc", "boron"],
    "bph": ["zinc", "essential fatty acids"],
    "enlarged prostate": ["zinc", "essential fatty acids"],
    "menopause": ["boron", "calcium", "magnesium"],
    "hot flashes": ["vitamin e", "essential fatty acids"],
    "low thyroid": ["iodine", "selenium", "vitamin b12"],
    "hypothyroid": ["iodine", "selenium", "vitamin b12"],
    "goiter": ["iodine"],
    # Cognitive
    "memory loss": ["choline", "lecithin", "vitamin b1", "vitamin b12"],
    "alzheimer": ["lecithin", "choline", "vitamin b1", "vitamin e", "selenium"],
    "korsakoff": ["vitamin b1", "lecithin", "chromium", "vanadium"],
    "dementia": ["lecithin", "choline", "vitamin b12"],
    "depression": ["essential fatty acids", "vitamin b6", "lithium", "chromium"],
    "anxiety": ["calcium", "magnesium", "chromium", "vitamin b6"],
    "insomnia": ["calcium", "magnesium"],
    # Energy
    "fatigue": ["iron", "vitamin b12", "iodine", "magnesium"],
    "chronic fatigue": ["essential fatty acids", "vitamin b12", "iron", "selenium"],
    "low energy": ["iron", "vitamin b12", "iodine"],
    # Eyes
    "cataracts": ["selenium", "zinc", "vitamin e", "vitamin c", "amino acid"],
    "macular degeneration": ["selenium", "taurine", "methionine"],
    "glaucoma": ["bioflavonoids", "vitamin c", "rutin"],
    "night blindness": ["vitamin a", "zinc"],
    "dry eyes": ["essential fatty acids"],
    # Skin / hair / general
    "acne": ["zinc", "vitamin a", "essential fatty acids"],
    "eczema": ["zinc", "essential fatty acids"],
    "psoriasis": ["folic acid", "vitamin a", "lecithin", "essential fatty acids"],
    "dandruff": ["zinc", "selenium"],
    # Digestive
    "gerd": ["betaine hcl"],
    "heartburn": ["betaine hcl"],
    "indigestion": ["betaine hcl", "pancreatic enzymes"],
    "bloating": ["betaine hcl", "pancreatic enzymes"],
    "constipation": ["magnesium", "essential fatty acids"],
    "diarrhea": ["zinc"],
    # Blood sugar
    "diabetes": ["chromium", "vanadium"],
    "hypoglycemia": ["chromium", "vanadium", "magnesium"],
    "blood sugar swings": ["chromium", "vanadium"],
    "sugar cravings": ["chromium"],
    # Muscle
    "muscle cramps": ["calcium", "magnesium"],
    "muscle weakness": ["selenium", "vitamin e"],
    "muscular dystrophy": ["selenium", "vitamin e"],
    "fibromyalgia": ["magnesium", "essential fatty acids"],
    # Immune
    "frequent infections": ["zinc", "vitamin c", "vitamin a"],
    "slow wound healing": ["zinc", "vitamin c"],
    "allergies": ["essential fatty acids", "vitamin c", "bioflavonoids"],
    # Other
    "anemia": ["iron", "vitamin b12", "folic acid", "copper"],
    "pernicious anemia": ["vitamin b12"],
    "demyelination": ["vitamin b12"],
    "tremors": ["calcium", "magnesium", "lithium"],
    "convulsions": ["calcium", "magnesium"],
    "seizures": ["calcium", "magnesium"],
    "epilepsy": ["calcium", "magnesium", "essential fatty acids"],
    # Wallach-specific markers
    "carpal tunnel": ["vitamin b6", "manganese", "arsenic"],
    "morning sickness": ["vitamin b6"],
    "tinnitus": ["manganese", "zinc"],
    "vertigo": ["calcium", "magnesium", "manganese"],
    "hearing loss": ["manganese"],
    "easy bruising": ["vitamin c", "bioflavonoids"],
    "bleeding gums": ["vitamin c", "vitamin k"],
    "cavities": ["calcium", "fluoride"],
    "tooth decay": ["calcium", "fluoride"],
}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("Building nutrient ↔ symptom maps...")

    nutrient_to_symptoms, nutrient_to_conditions, condition_causes, condition_symptoms = build_maps()

    # Save
    (OUT_DIR / "nutrient-to-symptoms.json").write_text(json.dumps(nutrient_to_symptoms, indent=2))
    (OUT_DIR / "nutrient-to-conditions.json").write_text(json.dumps(nutrient_to_conditions, indent=2))
    (OUT_DIR / "condition-causes.json").write_text(json.dumps(condition_causes, indent=2))
    (OUT_DIR / "condition-symptoms.json").write_text(json.dumps(condition_symptoms, indent=2))
    (OUT_DIR / "symptom-keywords.json").write_text(json.dumps(SYMPTOM_KEYWORDS, indent=2))

    print(f"\n  nutrient_to_symptoms: {len(nutrient_to_symptoms)} nutrients")
    print(f"  nutrient_to_conditions: {len(nutrient_to_conditions)} nutrients")
    print(f"  condition_causes: {len(condition_causes)} conditions with named deficiency causes")
    print(f"  condition_symptoms: {len(condition_symptoms)} conditions with symptom lists")
    print(f"  SYMPTOM_KEYWORDS (curated): {len(SYMPTOM_KEYWORDS)} symptoms mapped to nutrients")

    print("\nSample nutrient_to_symptoms (zinc):")
    for entry in nutrient_to_symptoms.get("zinc", [])[:3]:
        print(f"  - [{entry['book']}] {entry['symptom_claim'][:200]}")


if __name__ == "__main__":
    main()
