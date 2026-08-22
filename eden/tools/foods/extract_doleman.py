"""Extract Table 1 of Doleman et al. 2017 -- the sulphur content of 32 commonly eaten foods.

Doleman JF, Grisar K, Van Liedekerke L, Saha S, Roe M, Tapp HS, Mithen RF, 'The contribution
of alliaceous and cruciferous vegetables to dietary sulphur intake', Food Chemistry
2017;234:38-45. CC BY 4.0, read from the Europe PMC open-access full text (PMC5460521).

WHY THE XML AND NOT THE PDF. Every other extractor here reads a PDF by x-coordinate because
that is all the publisher gives. Europe PMC serves this paper as JATS XML with the table as
real <tr>/<td> cells, so the columns cannot be spliced by a stray watermark or a wrapped line.
When a structured rendering exists, using it is strictly safer than reconstructing one.

WHAT IS EXTRACTED, AND WHAT IS NOT. Only the two columns this app uses: the sulphur amino
acids (cysteine + methionine) and the other sulphur including sulphate, both in umoles/g DRY
WEIGHT, as the paper's own strings. The TOTAL is deliberately NOT stored: it is summed at
derive time from these two, so a transcription slip has to survive addition to reach a screen.

★ THE VALUES ARE DRY WEIGHT AND ARE NOT SHIPPABLE AS THEY STAND. The paper measures
freeze-dried samples and never prints a moisture percentage, so the fresh-weight number a
person eating the food needs cannot be read off the page. The conversion

    mg S / 100 g fresh = umol_per_g_dry x 32.06 ug/umol x dry_matter_fraction x 0.1

happens in eden/tools/foods_composition_derive.py, NOT here, because `dry_matter_fraction`
depends on WHICH catalog food the row was paired with -- it is 1 - (that food's USDA water
g/100 g) / 100. Doing it here would bake a pairing into the extraction and make the committed
candidate change every time a curation decision changed. Luneth ruled on 2026-08-21: convert,
and show the working; the working is carried on every shipped row's provenance.

★ AND THAT IS WHY EVERY DOLEMAN ROW IS APPROXIMATE TIER, permanently. The umol/g is Doleman's
sample; the moisture is a USDA sample of a nominally similar food; no id joins the two.

TOTAL sulphur is what gets converted, not the amino-acid fraction. For garlic the amino acids
are only 10.5% of the sulphur, which is exactly why the earlier methionine+cystine shortcut
failed for alliums and crucifers.

Usage: python extract_doleman.py <PMC5460521_fullTextXML.xml> <out.json>
"""
import json
import re
import sys
from xml.etree import ElementTree as ET

XML, OUT = sys.argv[1], sys.argv[2]

# The paper's own column headings, so a re-ordered or re-labelled table FAILS rather than
# silently shifting which number means what.
SAA_HEADING = "Sulphur amino acids"
OTHER_HEADING = "Other sulphur"
NUMBER = re.compile(r"^\d+(?:\.\d+)?$")


def main():
    raw = open(XML, encoding="utf-8").read()
    wrap = re.search(
        r"<table-wrap[^>]*>(?:(?!</table-wrap>).)*?<label>Table 1</label>.*?</table-wrap>",
        raw, re.S)
    if wrap is None:
        raise SystemExit("Table 1 is not in this XML -- the source has changed shape")

    caption = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "",
                     re.search(r"<caption>(.*?)</caption>", wrap.group(0), re.S).group(1)))
    if "moles/g dry weight" not in caption:
        raise SystemExit(
            f"Table 1 no longer states dry weight in its caption -- the unit under this "
            f"whole conversion may have changed: {caption[:160]}")

    table = ET.fromstring(re.search(r"<table[ >].*</table>", wrap.group(0), re.S).group(0))
    headings = [" ".join(c.itertext()) for c in table.iter("th")]
    joined = " ".join(headings)
    for want in (SAA_HEADING, OTHER_HEADING):
        if want not in joined:
            raise SystemExit(
                f"Table 1 no longer carries a {want!r} column. Re-read the paper before "
                f"touching anything downstream; the columns are positional here.")

    out = []
    for tr in table.iter("tr"):
        cells = ["".join(c.itertext()).strip() for c in tr.findall("td")]
        # (food, SAA, (SAA %), other S, (other %), ...) -- the percentages are the paper's
        # own parenthesised shares and are not used, but their POSITION is what makes
        # columns 1 and 3 the two numbers we want, so both are checked to be numeric.
        if len(cells) < 4 or not cells[0]:
            continue
        if not (NUMBER.match(cells[1]) and NUMBER.match(cells[3])):
            continue
        out.append({
            "food": cells[0],
            "saa_umol_g_dry": cells[1],
            "other_s_umol_g_dry": cells[3],
        })

    if len(out) != 32:
        raise SystemExit(
            f"Table 1 gave {len(out)} food rows; the paper states 32. Extraction is not "
            f"reproducing the source and nothing downstream may use it.")

    with open(OUT, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)
        fh.write("\n")

    print(f"foods extracted : {len(out)}")
    top = sorted(out, key=lambda r: -(float(r["saa_umol_g_dry"])
                                      + float(r["other_s_umol_g_dry"])))[:5]
    print("-- highest total sulphur (umol/g DRY, summed here for display only) --")
    for r in top:
        print(f"  {float(r['saa_umol_g_dry']) + float(r['other_s_umol_g_dry']):8.1f}  {r['food']}")


if __name__ == "__main__":
    main()
