"""Extract the gap nutrients from the Australian Food Composition Database, Release 3.

AFCD is the only source we hold that measures FOUR of the essentials USDA SR Legacy does not
touch at all -- chloride, biotin, molybdenum and sulphur -- plus a second reading of iodine,
chromium and selenium. It publishes them as one flat sheet, one row per food, per 100 g.

TWO DEFENCES AGAINST A WRONG-BUT-PLAUSIBLE NUMBER.

  1. THE UNIT IS READ OFF THE HEADER, AND THE HEADER MUST BE EXACTLY WHAT WE EXPECT. Every
     column below is required to be spelled, byte for byte, the way this release spells it --
     including its unit. If AFCD ever republishes 'Chloride (Cl) \\n(mg)' as '(g)', this
     script FAILS rather than quietly multiplying every chloride number by a thousand. The
     composition gate re-runs this extractor against the sha256-pinned payload, so that
     failure is a RED board, not a surprise months later.

  2. 'NOT MEASURED' IS CARRIED THROUGH AS ITSELF. An empty cell means AFCD did not measure
     that nutrient in that food; it does NOT mean zero, and the empty string is preserved
     rather than turned into a 0 that would later read as a real measurement of absence.
     (The same trap CoFID sets with 'N' and 'Tr', recorded in sources.json.)

Values are kept as the SOURCE'S OWN STRINGS, unparsed -- '11.7', not 11.7 -- because that
string is what the shipped number is byte-compared against.

Usage: python extract_afcd.py <AFCD_Release3_Nutrient_profiles.xlsx> <out.json>
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import xlsx_read  # noqa: E402

XLSX, OUT = sys.argv[1], sys.argv[2]

SHEET = "All solids & liquids per 100 g"
HEADER_ROW = 2          # rows 0-1 are the release title and a spacer
KEY_HEADER = "Public Food Key"
NAME_HEADER = "Food Name"

# slug -> the header string this release uses, INCLUDING its unit. Byte-exact on purpose:
# see defence 1 above. The unit in parentheses is the unit the value is in.
COLUMNS = {
    "chromium":   "Chromium (Cr) \n(ug)",
    "chloride":   "Chloride (Cl) \n(mg)",
    "iodine":     "Iodine (I) \n(ug)",
    "molybdenum": "Molybdenum (Mo) \n(ug)",
    "selenium":   "Selenium (Se) \n(ug)",
    "sulfur":     "Sulphur (S) \n(mg)",   # AFCD spells it sulphur; our canon slug is sulfur
    "biotin":     "Biotin (B7) \n(ug)",
}


def main():
    rows = list(xlsx_read.rows(XLSX, SHEET))
    header = rows[HEADER_ROW]
    index = {}
    for slug, want in [("_key", KEY_HEADER), ("_food", NAME_HEADER)] + sorted(COLUMNS.items()):
        try:
            index[slug] = header.index(want)
        except ValueError:
            raise SystemExit(
                f"AFCD header changed: no column spelled {want!r} in '{SHEET}' row "
                f"{HEADER_ROW}. Re-read the release before touching anything downstream -- "
                f"a renamed unit here is a silent 1000x on every value in that column."
            )

    out = []
    for r in rows[HEADER_ROW + 1:]:
        def cell(slug):
            i = index[slug]
            return (r[i] if i < len(r) else "").strip()

        food = cell("_food")
        if food == "":
            continue
        rec = {"key": cell("_key"), "food": food}
        for slug in sorted(COLUMNS):
            rec[slug] = cell(slug)     # '' means NOT MEASURED, and stays ''
        out.append(rec)

    with open(OUT, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)
        fh.write("\n")

    measured = {s: sum(1 for x in out if x[s] not in ("", "0")) for s in sorted(COLUMNS)}
    dup = len(out) - len({x["food"] for x in out})
    print(f"foods extracted : {len(out)}")
    print(f"duplicate names : {dup}")
    for s, n in measured.items():
        print(f"  {s:<11} measured non-zero: {n}")


if __name__ == "__main__":
    main()
