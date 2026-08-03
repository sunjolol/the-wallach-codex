"""Build corpus_resnap --fix payloads for the four CLAIM-EXTENT defects.

These are not source defects. The `.txt` is correct in all four cases; the claim's verbatim was cut
at the wrong boundary. Three swallowed the transcription's own page separator
(`===== Screenshot (N) =====`, legitimate scaffolding that appears 466 times in epigenetics and 255
in immortality), which means the app can render OCR scaffolding to a reader. The fourth stops two
characters short of the page.

WHY --fix AND NOT mine_batch: mine_batch HARD-REJECTS a verbatim edit -- verbatim/char_offset/
locator/id are snap-owned, and its own selftest asserts the rejection. corpus_resnap applies
`fixes.get(cid, current)` UNCONDITIONALLY for any listed id, not only for BROKEN ones, so it is the
sanctioned route for re-cutting an extent whose current text is still a valid substring.

Each corrected verbatim is asserted to occur EXACTLY ONCE in its source before anything is written.
"""
import json
import sys
from pathlib import Path

ROOT = Path(r"C:\Users\Light\Desktop\claude\health expert")
BOOKS = ROOT / "eden/corpus/books"
WORK = ROOT / "tools/frontface/work"

GOITROGENS = (
    "Many foods and food additives are known as\n\n\u201cgoitrogens\u201d because they interfere with "
    "the normal thyroid\n\nmetabolism and produce thyroid disease. These substances\n\ninclude "
    "nitrates and nitrites (i.e. ham, bacon, sausage, bologna,\nsalami, pastrami, pepperoni, jerky, "
    "deli-meats, etc.) and\ncruciferous vegetables (i.e. broccoli, Brussel sprouts, cabbage,\n"
    "cauliflower, etc.)."
)
FLATULENCE = (
    "Treatment of flatulence includes digestive\nenzymes at 75-200 mg t.i.d. 15-20 minutes\nbefore "
    "meals, avoidance and/or rotation of\noffending food allergens, autoimmune urine\ntherapy and "
    "herbs including angelica (Angelica archangelica), anise (Pimpinella\nanisum), caraway (Carum "
    "carvi), dill (Anethum\ngraveolens), fennel (Foeniculum vulgare)and\npepper (Piper nigrum)."
)

# ★ THE TRIM ALONE WAS NOT ENOUGH, and the seal caught it: stripping the page separator dropped
# these two verbatims to 40 and 20 characters, under corpus_seal check #2's 60-character floor.
# Which means THE SCAFFOLDING WAS THE ONLY THING CLEARING THAT FLOOR -- the gate had been satisfied
# by text the page never printed. So each is EXTENDED BACKWARD into genuinely adjacent rows of the
# same dose table (never forward, which would re-cross the page break that caused this). The two
# spans are kept distinct and nested: -000124 covers Choline AND Inositol so it takes the wider
# five-row span, -000125 covers Inositol alone and takes the four-row span inside it.
FIXES = {
    "epigenetics": {
        "WAL-CLM-EPIGEN-000124": (
            "Niacinamide (niacin) 10 - 30 mg\nBiotin 100 - 300 mcg\nFolic acid 400 mcg\n"
            "Choline 10 - 100 mg\nInositol 10 - 100 mg"),
        "WAL-CLM-EPIGEN-000125": (
            "Biotin 100 - 300 mcg\nFolic acid 400 mcg\nCholine 10 - 100 mg\n"
            "Inositol 10 - 100 mg"),
    },
    "immortality": {
        "WAL-CLM-IMMORT-000230": GOITROGENS,
    },
    "lets-play-doctor": {
        "WAL-CLM-LETS-000278": FLATULENCE,
    },
}

# ★ AN END-TRUNCATION IS INVISIBLE TO resnap, and that is why this entry is here rather than being
# picked up automatically. EPIGEN-000322's verbatim ends '...vegetables and frui'. After the source
# was corrected to '...vegetables and fruit.', the OLD text is STILL a valid substring of the NEW one
# (a truncation is a prefix), so resnap RELOCATED the claim and never called it BROKEN. The claim
# would have stayed cut mid-word on a fully green board. Any fix that LENGTHENS a verbatim at its end
# needs an explicit --fix; only a fix that changes letters INSIDE the span is self-detecting.
FIXES["epigenetics"]["WAL-CLM-EPIGEN-000322"] = (
    "\u201cSalt hunger\u201d dates back to the very beginning of animals and man and is one\n"
    "of the very basic cravings of living organisms. Carnivores (man or beast) do not\n"
    "typically show the great craving for salt because meat contains relatively large\n"
    "amounts of NaCl, but herbivores and human vegetarians demand large amounts\n"
    "of NaCl because there is little or no natural NaCl in grains, vegetables and fruit."
)
SRC = {
    "epigenetics": "epigenetics.txt",
    "immortality": "immortality.txt",
    "lets-play-doctor": "lets-play-doctor-fourth-edition-1995.txt",
}

WHY = {
    "WAL-CLM-EPIGEN-000124": "trailing '===== Screenshot (675) -- Page 818 of 936 =====' separator dropped",
    "WAL-CLM-EPIGEN-000125": "trailing '===== Screenshot (675) -- Page 818 of 936 =====' separator dropped",
    "WAL-CLM-IMMORT-000230": "leading 'Goiter' (last item of a symptom list on the PREVIOUS page) and the "
                             "'===== Screenshot (94) =====' separator dropped; the claim starts at the goitrogens paragraph",
    "WAL-CLM-LETS-000278": "extended two characters to the page's 'pepper (Piper nigrum).'",
    "WAL-CLM-EPIGEN-000322": "end-truncation: our verbatim stopped mid-word at 'frui'; the page prints "
                             "'vegetables and fruit.' as the paragraph's last line. Invisible to resnap "
                             "because a truncation is still a valid substring of the corrected text",
}

fail = 0
for book, fixes in FIXES.items():
    text = (BOOKS / SRC[book]).read_text(encoding="utf-8")
    for cid, v in fixes.items():
        n = text.count(v)
        flag = "OK  " if n == 1 else "FAIL"
        if n != 1:
            fail += 1
        print(f"  {flag} {cid:24s} occurrences={n}  len={len(v):4d}  {WHY[cid][:70]}")
    if not fail:
        p = WORK / f"extentfix-{book}.json"
        p.write_text(json.dumps(fixes, indent=1, ensure_ascii=False), encoding="utf-8")
        print(f"       -> {p.name}")

print()
if fail:
    print(f"ABORTED: {fail} corrected verbatim(s) are not a unique substring. Nothing staged.")
    sys.exit(1)
print("all four corrected extents verified as UNIQUE byte-exact substrings; fix files staged")
