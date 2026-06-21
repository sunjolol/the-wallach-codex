"""Build the ingredients-quickref dataset — curated quick-reference snippets
for non-essential ingredients (botanicals, amino acids, blend components,
fatty acids, etc.) that the products-db sweep surfaces but the 92-essential
benefits dataset doesn't cover.

Pass E.1.2 — extends Pass E.1's "Quick reference" UX so the ingredient popup
has educational content for botanicals like Ashwagandha and Lion's Mane the
same way it has it for Vitamin D3 and Zinc. User's framing: "ALL the nutrients
should be known about at this point ... one source for ALL the snippets, no
need to code them per item."

This file IS that source — one database, many surfaces (popup, future Tacitus
references, future per-card detail panels). Snippets are concise general
nutritional-tradition statements. They're not numeric targets — the source-rule
cornerstone (Wallach/Youngevity-primary citations) governs amounts, not
educational tidbits. Where Youngevity product pages give the framing, we
mirror it; where general nutritional knowledge applies, we use it directly.

Output:
  knowledge/ingredients-quickref.json    — canonical data file
  dashboard/dashboard.html                — embedded as id="ingredients-quickref-data"

Schema mirrors essentials-benefits-data exactly so a single matcher can serve
both: dict keyed by ingredient name, values are arrays of {t: text, p: 0|1}
where p=1 marks the primary/lead benefit.

Cross-platform discipline per lessons.md (2026-06-15 at 9:55 AM):
- encoding='utf-8' on every text-mode open()
- pathlib.Path
- datetime.now(tz=utc)
- sys.executable for subprocess
"""

from __future__ import annotations

import datetime
import json
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DATA_OUT = REPO / "knowledge" / "ingredients-quickref.json"
DASH = REPO / "dashboard" / "dashboard.html"
SAFE_WRITE = REPO / "tools" / "safe_write.py"

BLOCK_ID = "ingredients-quickref-data"
INSERT_AFTER_BLOCK_ID = "essentials-benefits-data"


# ---------------------------------------------------------------------------
# Curated quick-reference snippets
# ---------------------------------------------------------------------------
# Each key is the ingredient name as it appears in the slim ingredients-embed
# (case-sensitive match preferred, but the matcher in dashboard JS is token-
# subset case-insensitive so close variants resolve).
#
# Each value is a list of {t: text, p: 0|1}. p=1 marks the lead/primary
# benefit (renders with a dot prefix in the popup). Keep statements concise
# (< 80 chars when possible). Avoid Wallach-specific framing — these are
# general nutritional-tradition descriptions of common roles.
#
# Categories represented (approximate):
#   - Adaptogens (Ashwagandha, Rhodiola, Holy Basil, etc.)
#   - Antioxidants (CoQ10, ALA, Astaxanthin, Quercetin, Resveratrol, etc.)
#   - Brain/cognition (Lion's Mane, Ginkgo, L-Theanine, GABA, Melatonin)
#   - Joint/inflammation (Glucosamine, Chondroitin, MSM, Turmeric, Bromelain)
#   - Immune (Olive Leaf, Garlic, Elderberry, Ginger, Reishi, IgY)
#   - Heart/circulation (Hawthorn, L-Arginine, L-Citrulline, Beet Root)
#   - Digestion (Papain, Bromelain, Marshmallow, Fennel, Chamomile, FOS)
#   - Liver/detox (Milk Thistle implicit via blends)
#   - Amino acids (L-Carnitine, L-Glutamine, Glycine, Betaine)
#   - Foods (berries, greens, cruciferous, etc.)
#   - Spices (Cayenne, Cinnamon, Clove, Turmeric, Ginger)
#   - Youngevity-specific (Plant Derived Minerals, BioPerine, IgY Max)

QUICKREF = {
    # ---------- Adaptogens ----------
    "Ashwagandha": [
        {"t": "adaptogen — helps the body adapt to stress", "p": 1},
        {"t": "supports balanced cortisol response"},
        {"t": "traditionally used in Ayurveda for vitality + stamina"},
        {"t": "may support sleep quality + recovery"},
    ],
    "Rhodiola": [
        {"t": "adaptogen — supports mental + physical endurance under stress", "p": 1},
        {"t": "traditionally used for fatigue resistance"},
        {"t": "may support focus + mood under load"},
    ],
    "Holy Basil": [
        {"t": "adaptogen — supports stress response + balanced cortisol", "p": 1},
        {"t": "Ayurvedic herb (Tulsi) used for centuries for resilience"},
        {"t": "supports immune + metabolic balance"},
    ],
    "Maca": [
        {"t": "Peruvian root traditionally used for energy + libido", "p": 1},
        {"t": "supports hormonal balance + endurance"},
        {"t": "rich in glucosinolates + sterols"},
    ],
    "Astragalus": [
        {"t": "Traditional Chinese Medicine herb for immune support", "p": 1},
        {"t": "contains polysaccharides studied for immune modulation"},
        {"t": "long history as a 'qi tonic' for vitality"},
    ],
    "cordyceps": [
        {"t": "medicinal mushroom traditionally used for stamina + lung function", "p": 1},
        {"t": "may support cellular energy (ATP) production"},
        {"t": "popular with endurance athletes"},
    ],
    "Panax ginseng": [
        {"t": "classic adaptogen — supports energy + mental clarity", "p": 1},
        {"t": "contains ginsenosides studied for cognitive + immune effects"},
        {"t": "Traditional Chinese Medicine staple for vitality"},
    ],
    "Ginseng Root": [
        {"t": "adaptogen — supports energy + endurance", "p": 1},
        {"t": "long history of use for stress resilience + mental clarity"},
    ],
    "eleuthero": [
        {"t": "Siberian ginseng — adaptogen for stamina + recovery", "p": 1},
        {"t": "traditionally used for fatigue + immune support"},
    ],
    "lemon balm": [
        {"t": "calming herb in the mint family", "p": 1},
        {"t": "traditionally used for relaxation + sleep support"},
        {"t": "may help ease occasional nervous tension"},
    ],
    "Schisandra": [
        {"t": "adaptogen — one of the 'five-flavor berries' of TCM", "p": 1},
        {"t": "traditionally used for liver + endurance support"},
    ],

    # ---------- Antioxidants ----------
    "CoQ10": [
        {"t": "key coenzyme for cellular energy (ATP) production in mitochondria", "p": 1},
        {"t": "supports cardiovascular health + endothelial function"},
        {"t": "antioxidant — protects cells from oxidative damage"},
        {"t": "levels decline with age + statin use"},
    ],
    "CoEnzyme Q10": [
        {"t": "key coenzyme for cellular energy (ATP) production", "p": 1},
        {"t": "supports cardiovascular health + endothelial function"},
        {"t": "antioxidant — protects cells from oxidative damage"},
    ],
    "Alpha Lipoic Acid": [
        {"t": "antioxidant active in both water + fat-soluble environments", "p": 1},
        {"t": "supports glucose metabolism + nerve health"},
        {"t": "recycles other antioxidants (vitamin C, glutathione)"},
    ],
    "Astaxanthin": [
        {"t": "carotenoid antioxidant from microalgae (the pink in salmon)", "p": 1},
        {"t": "supports skin + eye health + UV resilience"},
        {"t": "studied for cardiovascular + recovery support"},
    ],
    "Lycopene": [
        {"t": "carotenoid antioxidant from tomatoes + watermelon", "p": 1},
        {"t": "studied for prostate + cardiovascular health"},
    ],
    "lutein": [
        {"t": "carotenoid concentrated in the macula of the eye", "p": 1},
        {"t": "supports eye health + blue-light filtration"},
        {"t": "paired with zeaxanthin for full macular support"},
    ],
    "quercetin": [
        {"t": "flavonoid antioxidant from onions, apples, berries", "p": 1},
        {"t": "supports normal histamine response"},
        {"t": "studied for cardiovascular + immune support"},
    ],
    "Quercetin Dihydrate": [
        {"t": "flavonoid antioxidant — bioavailable form of quercetin", "p": 1},
        {"t": "supports normal histamine response + immune function"},
    ],
    "resveratrol": [
        {"t": "polyphenol antioxidant from grape skins + Japanese knotweed", "p": 1},
        {"t": "studied for cardiovascular + longevity pathways (SIRT1)"},
        {"t": "supports endothelial function"},
    ],
    "pomegranate": [
        {"t": "rich in punicalagins — potent polyphenol antioxidants", "p": 1},
        {"t": "studied for cardiovascular + prostate health"},
    ],
    "Grape seed": [
        {"t": "rich in OPCs (oligomeric proanthocyanidins) — potent antioxidants", "p": 1},
        {"t": "supports capillary integrity + circulation"},
    ],
    "bilberry": [
        {"t": "European blueberry rich in anthocyanin antioxidants", "p": 1},
        {"t": "traditionally used for eye + circulation support"},
    ],
    "acerola": [
        {"t": "tropical cherry — one of the highest natural sources of vitamin C", "p": 1},
        {"t": "delivers vitamin C in a whole-food matrix with bioflavonoids"},
    ],
    "Citrus Bioflavonoids": [
        {"t": "flavonoids from citrus peel — work synergistically with vitamin C", "p": 1},
        {"t": "supports capillary integrity + venous health"},
    ],
    "cherry": [
        {"t": "rich in anthocyanin antioxidants (especially tart cherry)", "p": 1},
        {"t": "studied for recovery + sleep support (melatonin content)"},
    ],
    "Blueberry": [
        {"t": "anthocyanin-rich antioxidant berry", "p": 1},
        {"t": "studied for cognitive + cardiovascular support"},
    ],
    "cranberry": [
        {"t": "rich in proanthocyanidins (PACs)", "p": 1},
        {"t": "supports urinary tract health"},
    ],
    "Elderberry": [
        {"t": "anthocyanin-rich berry traditionally used for immune support", "p": 1},
        {"t": "studied for upper-respiratory wellness"},
    ],
    "Raspberry": [
        {"t": "antioxidant berry rich in ellagic acid + anthocyanins", "p": 1},
    ],
    "Strawberry": [
        {"t": "vitamin-C-rich antioxidant berry", "p": 1},
        {"t": "ellagic acid + anthocyanin content"},
    ],

    # ---------- Brain / Cognition ----------
    "Lion's Mane": [
        {"t": "medicinal mushroom studied for nerve growth factor (NGF) support", "p": 1},
        {"t": "supports cognitive function + memory"},
        {"t": "traditional in East Asian cuisine + medicine"},
    ],
    "Ginkgo": [
        {"t": "supports cerebral circulation + memory", "p": 1},
        {"t": "long-standing herbal for cognitive aging"},
    ],
    "Ginkgo Leaf": [
        {"t": "supports cerebral circulation + memory", "p": 1},
        {"t": "studied for cognitive aging + microcirculation"},
    ],
    "L-Theanine": [
        {"t": "amino acid from green tea — promotes calm focus", "p": 1},
        {"t": "supports alpha-wave brain activity"},
        {"t": "pairs with caffeine for smoother stimulation"},
    ],
    "GABA": [
        {"t": "primary inhibitory neurotransmitter — supports relaxation", "p": 1},
        {"t": "studied for occasional stress + sleep onset"},
    ],
    "Melatonin": [
        {"t": "hormone signaling sleep onset + circadian rhythm", "p": 1},
        {"t": "naturally rises with darkness"},
        {"t": "supports occasional sleep difficulty + jet lag"},
    ],
    "**Citicoline**": [
        {"t": "phospholipid precursor — supports brain membrane integrity", "p": 1},
        {"t": "studied for memory, focus, + cognitive aging"},
    ],
    "DMG": [
        {"t": "dimethylglycine — methyl donor + cellular oxygen utilization support", "p": 1},
        {"t": "studied for athletic performance + immune support"},
    ],

    # ---------- Joint / Inflammation ----------
    "Glucosamine": [
        {"t": "amino sugar — building block of cartilage + joint fluid", "p": 1},
        {"t": "supports joint comfort + cartilage maintenance"},
        {"t": "commonly paired with chondroitin + MSM"},
    ],
    "Glucosamine sulfate 2KCL": [
        {"t": "stabilized form of glucosamine for joint cartilage support", "p": 1},
    ],
    "Chondroitin": [
        {"t": "component of cartilage that helps retain water + elasticity", "p": 1},
        {"t": "supports joint comfort + mobility"},
        {"t": "commonly paired with glucosamine"},
    ],
    "MSM": [
        {"t": "methylsulfonylmethane — bioavailable source of sulfur", "p": 1},
        {"t": "supports joint comfort + connective tissue"},
        {"t": "supports skin, hair, + nail integrity"},
    ],
    "Turmeric": [
        {"t": "curcumin-rich root with potent anti-inflammatory tradition", "p": 1},
        {"t": "supports joint + cardiovascular health"},
        {"t": "absorption improved with black pepper (piperine)"},
    ],
    "Bromelain": [
        {"t": "enzyme from pineapple stems", "p": 1},
        {"t": "supports digestion + recovery from soreness"},
        {"t": "studied for occasional inflammation response"},
    ],
    "Boswellia": [
        {"t": "frankincense resin — traditional anti-inflammatory", "p": 1},
        {"t": "boswellic acids studied for joint comfort"},
    ],
    "Olive Leaf": [
        {"t": "rich in oleuropein — supports immune + cardiovascular health", "p": 1},
        {"t": "long traditional use in Mediterranean herbalism"},
    ],

    # ---------- Heart / Circulation ----------
    "Hawthorn berry": [
        {"t": "long-standing cardiovascular herb", "p": 1},
        {"t": "supports heart muscle function + healthy blood pressure"},
    ],
    "L-Arginine": [
        {"t": "amino acid precursor to nitric oxide (NO)", "p": 1},
        {"t": "supports vasodilation + circulation"},
        {"t": "studied for endothelial function"},
    ],
    "L-Citrulline": [
        {"t": "amino acid that converts to L-arginine, then nitric oxide", "p": 1},
        {"t": "supports endurance + circulation more effectively than oral arginine"},
    ],
    "Beet Root": [
        {"t": "rich in dietary nitrates — converts to nitric oxide", "p": 1},
        {"t": "supports endurance, circulation, + healthy blood pressure"},
    ],
    "Beet": [
        {"t": "rich in dietary nitrates — supports circulation + endurance", "p": 1},
    ],

    # ---------- Digestion ----------
    "Papain": [
        {"t": "proteolytic enzyme from papaya", "p": 1},
        {"t": "supports protein digestion + occasional discomfort relief"},
    ],
    "Marshmallow Root": [
        {"t": "mucilaginous herb that soothes mucous membranes", "p": 1},
        {"t": "traditionally used for digestive + respiratory comfort"},
    ],
    "Fennel": [
        {"t": "carminative herb traditionally used after meals", "p": 1},
        {"t": "supports digestion + occasional bloating"},
    ],
    "chamomile": [
        {"t": "calming herb traditionally used for relaxation + digestion", "p": 1},
        {"t": "may support sleep onset + occasional stress"},
    ],
    "FOS": [
        {"t": "fructooligosaccharides — prebiotic fiber that feeds beneficial gut bacteria", "p": 1},
        {"t": "supports microbiome diversity + short-chain fatty acid production"},
    ],
    "Bitter Melon": [
        {"t": "traditionally used to support healthy blood sugar metabolism", "p": 1},
        {"t": "long culinary + medicinal history in Asian cuisine"},
    ],
    "Betaine": [
        {"t": "trimethylglycine (TMG) — methyl donor + osmolyte", "p": 1},
        {"t": "supports homocysteine metabolism + cellular hydration"},
        {"t": "found in beets, spinach, + whole grains"},
    ],

    # ---------- Spices / Anti-inflammatory ----------
    "Cayenne": [
        {"t": "capsaicin-rich spice — supports circulation + metabolism", "p": 1},
        {"t": "long traditional use as a 'warming' herb"},
    ],
    "Cinnamon": [
        {"t": "supports healthy blood sugar response after meals", "p": 1},
        {"t": "warming spice with antioxidant polyphenols"},
    ],
    "Cinnamon Bark": [
        {"t": "supports healthy blood sugar response", "p": 1},
        {"t": "antioxidant polyphenol content"},
    ],
    "Clove": [
        {"t": "eugenol-rich spice with antioxidant + antimicrobial tradition", "p": 1},
    ],
    "ginger": [
        {"t": "warming root supporting digestion + circulation", "p": 1},
        {"t": "traditional use for nausea + occasional soreness"},
    ],
    "garlic": [
        {"t": "allicin-rich bulb — cardiovascular + immune tradition", "p": 1},
        {"t": "studied for healthy blood pressure + circulation"},
    ],

    # ---------- Immune / Mushrooms ----------
    "Reishi": [
        {"t": "medicinal mushroom — 'mushroom of immortality' in TCM", "p": 1},
        {"t": "supports immune balance + stress resilience"},
    ],
    "Shiitake": [
        {"t": "medicinal + culinary mushroom rich in beta-glucans", "p": 1},
        {"t": "supports immune function"},
    ],
    "Spirulina": [
        {"t": "blue-green microalga — complete protein + phycocyanin antioxidant", "p": 1},
        {"t": "rich in B-vitamins, iron, + chlorophyll"},
    ],
    "IgY Max Hyperimmune Egg Powder": [
        {"t": "Youngevity's hyperimmune egg powder — immune support via avian antibodies", "p": 1},
        {"t": "produced from hens hyperimmunized against specific antigens"},
    ],

    # ---------- Amino Acids ----------
    "L-Carnitine": [
        {"t": "shuttles fatty acids into mitochondria for energy production", "p": 1},
        {"t": "supports cardiovascular health + endurance"},
    ],
    "L-Carnitine Tartrate": [
        {"t": "bioavailable form of L-carnitine — supports fat-burning + recovery", "p": 1},
    ],
    "L-Glutamine": [
        {"t": "most abundant amino acid in the body", "p": 1},
        {"t": "supports gut lining integrity + immune function"},
        {"t": "fuel for enterocytes + rapidly dividing cells"},
    ],
    "Glycine": [
        {"t": "smallest amino acid — building block of collagen", "p": 1},
        {"t": "supports sleep quality + connective tissue"},
        {"t": "precursor to glutathione"},
    ],
    "L-Aspartic Acid": [
        {"t": "amino acid involved in the urea cycle + neurotransmitter synthesis", "p": 1},
    ],

    # ---------- Fatty Acids / Oils ----------
    "Fish Oil": [
        {"t": "marine source of EPA + DHA omega-3 fatty acids", "p": 1},
        {"t": "supports cardiovascular, brain, + joint health"},
    ],
    "Flax Seed": [
        {"t": "plant source of alpha-linolenic acid (ALA) omega-3", "p": 1},
        {"t": "rich in lignans + soluble fiber"},
    ],

    # ---------- Youngevity-specific ----------
    "Plant Derived Minerals": [
        {"t": "Wallach's signature concept — colloidal trace minerals from prehistoric humic shale", "p": 1},
        {"t": "delivers up to ~77 trace minerals in plant-derived form"},
        {"t": "Youngevity's foundation product line"},
    ],
    "Plant Derived Mineral Complex": [
        {"t": "colloidal trace minerals from humic shale — Youngevity signature", "p": 1},
        {"t": "broad-spectrum trace mineral coverage"},
    ],
    "Majestic Earth Plant Derived Minerals": [
        {"t": "Youngevity's flagship PDM — ~77 trace minerals from prehistoric Utah humic shale", "p": 1},
        {"t": "the foundation of Wallach's 90-essentials protocol"},
    ],
    "BioPerine": [
        {"t": "patented black pepper extract — boosts absorption of paired nutrients", "p": 1},
        {"t": "the piperine carrier used in many curcumin + nutrient formulas"},
    ],
    "BioPerine Black Pepper Extract": [
        {"t": "standardized black pepper extract — enhances nutrient absorption", "p": 1},
        {"t": "commonly paired with curcumin + fat-soluble nutrients"},
    ],

    # ---------- Misc ----------
    "PABA": [
        {"t": "para-aminobenzoic acid — B-complex factor + skin health support", "p": 1},
        {"t": "naturally occurring in folate metabolism"},
    ],
    "Caffeine": [
        {"t": "natural stimulant — supports alertness + focus", "p": 1},
        {"t": "works on adenosine receptors"},
        {"t": "pairs well with L-theanine for smoother effect"},
    ],
    "Glucuronolactone": [
        {"t": "naturally-occurring metabolite — used in energy formulas", "p": 1},
        {"t": "studied for mental performance support"},
    ],
    "Gamma Oryzanol": [
        {"t": "rice bran extract — antioxidant + cholesterol support", "p": 1},
    ],
    "Fucoidans": [
        {"t": "sulfated polysaccharides from brown seaweed", "p": 1},
        {"t": "studied for immune + cellular health support"},
    ],
    "GDL": [
        {"t": "glucono-delta-lactone — naturally-occurring acidulant + cell signaling molecule", "p": 1},
    ],

    # ---------- Foods (cruciferous, greens, etc.) ----------
    "Broccoli": [
        {"t": "cruciferous vegetable rich in sulforaphane + fiber", "p": 1},
        {"t": "supports detoxification pathways + cellular health"},
    ],
    "Spinach": [
        {"t": "leafy green rich in folate, iron, magnesium, lutein", "p": 1},
    ],
    "carrot": [
        {"t": "rich in beta-carotene (provitamin A) + fiber", "p": 1},
    ],
    "Celery": [
        {"t": "hydrating vegetable with natural electrolytes + phytalides", "p": 1},
    ],
    "Alfalfa": [
        {"t": "deep-rooted legume rich in chlorophyll, minerals, + saponins", "p": 1},
        {"t": "traditionally used as a 'whole-food multi'"},
    ],
}


def build_quickref():
    """Validate + return the curated dict (alphabetized by canonical key)."""
    out = {}
    for name in sorted(QUICKREF.keys(), key=lambda s: s.lower().lstrip('*')):
        items = QUICKREF[name]
        if not isinstance(items, list) or not items:
            raise ValueError("Empty/invalid entry for {0}".format(name))
        for it in items:
            if not isinstance(it, dict) or "t" not in it:
                raise ValueError("Bad item shape in {0}: {1}".format(name, it))
            if "p" not in it:
                it["p"] = 0
        out[name] = items
    return out


def write_json_file(data):
    DATA_OUT.parent.mkdir(parents=True, exist_ok=True)
    # Write atomically via safe_write
    tmp = DATA_OUT.parent / (DATA_OUT.name + ".tmp")
    payload = json.dumps(data, indent=2, ensure_ascii=False)
    tmp.write_text(payload, encoding="utf-8")
    tmp.replace(DATA_OUT)
    return len(payload.encode("utf-8"))


def embed_into_dashboard(data):
    """Insert (or replace) the ingredients-quickref-data script block in
    dashboard.html immediately after essentials-benefits-data."""
    html = DASH.read_text(encoding="utf-8")
    block_open = '<script type="application/json" id="{0}">'.format(BLOCK_ID)
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    new_block = "{0}{1}{2}".format(
        block_open, payload, "</" + "script>"
    )
    # Replace if present
    pattern = re.compile(
        r'<script[^>]*id="' + re.escape(BLOCK_ID) + r'"[^>]*>.*?</' + 'script>',
        re.S,
    )
    if pattern.search(html):
        new_html = pattern.sub(new_block, html)
    else:
        # Insert after the anchor block
        anchor_pattern = re.compile(
            r'(<script[^>]*id="' + re.escape(INSERT_AFTER_BLOCK_ID) + r'"[^>]*>.*?</' + r'script>)',
            re.S,
        )
        m = anchor_pattern.search(html)
        if not m:
            raise RuntimeError("Anchor block id={0} not found in dashboard.html".format(INSERT_AFTER_BLOCK_ID))
        new_html = html[:m.end()] + "\n" + new_block + html[m.end():]
    # Atomic write via safe_write rewrite
    tmp = DASH.parent / (DASH.name + ".qr.tmp")
    tmp.write_text(new_html, encoding="utf-8")
    proc = subprocess.run(
        [sys.executable, str(SAFE_WRITE), "rewrite", str(DASH), "--payload-file", str(tmp)],
        capture_output=True, text=True,
    )
    if proc.returncode != 0:
        sys.stderr.write(proc.stdout + proc.stderr)
        raise SystemExit("safe_write rewrite failed (exit {0})".format(proc.returncode))
    try:
        tmp.unlink()
    except FileNotFoundError:
        pass
    return len(new_html.encode("utf-8"))


def main():
    data = build_quickref()
    json_size = write_json_file(data)
    print("Wrote {0} entries to {1} ({2} bytes)".format(
        len(data), DATA_OUT.relative_to(REPO), json_size,
    ))
    dash_size = embed_into_dashboard(data)
    print("Embedded into dashboard.html ({0} bytes total)".format(dash_size))
    print("Build timestamp:", datetime.datetime.now(tz=datetime.timezone.utc).isoformat())


if __name__ == "__main__":
    main()
