"""Extract Table 1 of the NIH ODS boron fact sheet — the boron content of 39 foods.

★ THIS SOURCE IS PINNED AS EVIDENCE AND IS DELIBERATELY NOT BOUND TO ANY ESSENTIAL. Nothing
it contains reaches a screen. Read `_boron_finding` in sources.json before changing that.

WHY IT IS EXTRACTED ANYWAY. Boron was the last essential with no source at all, and "we never
went and got it" is a different statement from "we got it and it cannot carry a number". This
file turns the first into the second, and the numbers are here so nobody has to re-fetch the
page to check the reasoning.

WHAT THE TABLE IS, AND WHY IT CANNOT BE JOINED TO OUR CATALOG:

  1. IT IS PER SERVING, NOT PER 100 g. Every other source this project reads publishes per
     100 g, which composes with any portion. This one publishes "Apples, 1 medium — 0.66 mg"
     and never says what a medium apple weighs.

  2. IT IS NOT USDA-BASED, so USDA's gram weights are not its gram weights. The fact sheet
     says so itself, in as many words: "The U.S. Department of Agriculture's (USDA's)
     FoodData Central does not list the boron content of foods or provide lists of foods
     containing boron." Its two references are Rainey 1999 (J Am Diet Assoc) and Meacham &
     Hunt 1998 (Biol Trace Elem Res). Supplying a USDA weight for "1/2 cup cubed avocado"
     would be inventing a number this source never stated, which is exactly the kind of
     quiet guess section 00.A exists to forbid.

  3. THE ONE CLEAN JOIN CARRIES ALMOST NOTHING. Six rows share an identical household measure
     with a catalog food, and of those only "Apples, 1 medium" (0.66 mg) reaches 7% of
     Wallach's 9.2 mg — at 7.2%, and only if a medium apple means the same size in both
     tables, which the fact sheet does not say.

Usage: python extract_boron.py <Boron-HealthProfessional.html> <out.json>
"""
import html
import json
import re
import sys

PAGE, OUT = sys.argv[1], sys.argv[2]

CAPTION = "Boron Content of Selected Foods"
HEADING = "Milligrams (mg) per serving"


def text(fragment):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", fragment))).strip()


def main():
    page = open(PAGE, encoding="utf-8", errors="replace").read()
    m = re.search(r"<table[^>]*>(?:(?!</table>).)*?" + re.escape(CAPTION) + r".*?</table>",
                  page, re.S)
    if m is None:
        raise SystemExit(f"no table captioned {CAPTION!r} — the fact sheet has changed shape")
    table = m.group(0)

    rows = []
    header_seen = False
    for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", table, re.S):
        cells = [text(c) for c in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", tr, re.S)]
        if len(cells) < 2:
            continue
        if HEADING in cells[1]:
            header_seen = True
            continue
        if not re.fullmatch(r"\d+(?:\.\d+)?", cells[1]):
            continue
        rows.append({"food": cells[0], "mg_per_serving": cells[1]})

    if not header_seen:
        raise SystemExit(
            f"Table 1 no longer declares {HEADING!r}. The unit under every value in it may "
            f"have changed; re-read the fact sheet before anything uses this.")
    if len(rows) != 39:
        raise SystemExit(f"Table 1 gave {len(rows)} food rows; 39 were published. Extraction "
                         f"is not reproducing the source.")

    with open(OUT, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(rows, fh, ensure_ascii=False, indent=1)
        fh.write("\n")

    print(f"foods extracted : {len(rows)}")
    print("-- richest, mg per THEIR serving (not per 100 g) --")
    for r in sorted(rows, key=lambda x: -float(x["mg_per_serving"]))[:6]:
        print(f"  {float(r['mg_per_serving']):5.2f}  {r['food']}")


if __name__ == "__main__":
    main()
