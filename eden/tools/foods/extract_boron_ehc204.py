#!/usr/bin/env python3
"""extract_boron_ehc204.py -- Table 11 of WHO/IPCS EHC 204: boron in foods, by chemical analysis.

Usage: extract_boron_ehc204.py <payload.html> <out.json>

WHY THIS SOURCE OUTRANKS THE ONE IT JOINS

The boron figures a web search returns are software estimates their own publishers disclaim (see
extract_boron.py, which reads the corrected ten-food table from the same review). This table is a
different thing again: WHO's own compilation of the TWO primary chemical analyses, introduced in
its own words -- "Most of the concentrations of boron in foods reported before 1985 are of
questionable validity because of inadequate analytical methods. Two recent reports (Hunt et al.,
1991; Anderson et al., 1994b) provide an adequate indication of the amounts of boron found in
various foods". Those two papers are paywalled and neither is held; this is WHO reprinting their
numbers side by side, which is the closest to primary that is freely and stably retrievable.

★ THE UNIT IS ug/g, NOT mg/100 g, AND CONFUSING THEM IS A FACTOR OF TEN.
Every other boron table this project has read publishes mg/100 g. This one publishes ug/g fresh
weight -- raisins read "19.0" here and 1.9 mg/100 g in the same breath. The unit line is therefore
re-read from the payload rather than assumed, and the value is carried in the source's own unit
with the conversion declared on the binding, where the gate re-does the arithmetic.

★ TWO COLUMNS, AND THE LOWER ONE IS TAKEN.
Hunt and Anderson analysed overlapping foods and disagree by up to a factor of three (apple sauce
2.83 vs 1.04). Neither is more recent in a way that settles it and WHO endorses both, so the
CONSERVATIVE reading wins, which is the same rule the catalog already applies where a source
measures several varieties of one food. A boron number that is too low understates a food; one
that is too high tells someone they are covered when they are not.

★ BEVERAGES ARE EXCLUDED BECAUSE THEIR UNIT IS DIFFERENT.
The table's last block (wine, beer) is footnoted "Boron concentration in ug/ml" -- a volume basis,
not a mass basis. Parsing it with the rest would silently mix the two.

Rows are emitted for every food the table lists. Where the conservative reading is a
below-detection bound ("<0.015"), the value is null and the raw strings are kept: the derive skips
a null and a reader can still see what the source actually printed.
"""
import json
import re
import sys
from pathlib import Path

CAPTION = "Table 11.  Boron content of some common foods"
END_MARKER = "5.2.5"
# Re-read, never assumed -- this is the factor-of-ten guard.
EXPECTED_UNIT = "µg/g, fresh weight basis"
EXPECTED_COLUMNS = ("Hunt et al.", "Anderson et al.")
# The beverages block is a different basis (ug/ml) and stops the parse.
STOP_HEADING = "Beverages"
EXPECTED_ROWS = 37
# Column geometry, measured off the payload: the food name occupies columns 10-40, Hunt's value
# is right-aligned ending at column 49, Anderson's ending at column 67. A name that ran past 40
# would silently truncate, so the parser asserts rather than trusting the measurement.
NAME = slice(10, 40)
HUNT = slice(40, 50)
ANDERSON = slice(50, 68)
# Prunes at 27 ug/g is the table's richest food. The disclaimed Food Processor table that this
# project has already been burned by reads in mg/100 g, where its top entries are 4.51 and 2.82 --
# so a value under 4.6 in a column that should be reaching the twenties is the signature of a
# wrong-table or wrong-unit read, and a value over 40 is a parse that has slipped a column.
MAX_PLAUSIBLE_UG_PER_G = 40.0
MIN_TABLE_MAX_UG_PER_G = 5.0


def _plain(payload: str) -> str:
    """The table as text: tags out, entities in. `<0.015` arrives as `&lt;0.015` and must be
    unescaped BEFORE the columns are measured, or every below-detection row shifts by four."""
    import html
    return html.unescape(re.sub(r"<[^>]+>", "", payload))


def _num(cell: str):
    """(value_or_None, raw). A below-detection bound is not a small number, it is an absence
    with a ceiling on it -- carried through as its own string and left unusable on purpose."""
    raw = cell.strip()
    return (raw if re.fullmatch(r"\d+(?:\.\d+)?", raw) else None), raw


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: extract_boron_ehc204.py <payload.html> <out.json>", file=sys.stderr)
        return 2
    # The payload is latin-1: its micro sign is the single byte 0xB5. Reading it as UTF-8
    # replaces that byte and the unit check below would then fail on a correct file.
    payload = Path(sys.argv[1]).read_bytes().decode("latin-1")

    start = payload.find(CAPTION)
    if start < 0:
        print(f"caption {CAPTION!r} not found -- refusing to guess which table is Table 11",
              file=sys.stderr)
        return 1
    end = payload.find(END_MARKER, start)
    text = _plain(payload[start:end if end > start else None])

    if EXPECTED_UNIT not in text:
        print(f"REFUSED: the unit line {EXPECTED_UNIT!r} is not in Table 11. This table has "
              f"always published ug/g; if it now reads mg/100 g every value is 10x wrong.",
              file=sys.stderr)
        return 1
    for col in EXPECTED_COLUMNS:
        if col not in text:
            print(f"REFUSED: column header {col!r} missing -- the two analyses are what makes "
                  f"the conservative rule meaningful.", file=sys.stderr)
            return 1

    rows = []
    for line in text.split("\r\n"):
        # The heading reads "Beveragesa" -- the footnote marker that carries the ug/ml basis is
        # flattened into the word when the tags come out, so an equality test silently never
        # fires and wine and beer join the table on the wrong basis. Prefix, and only at a
        # heading's indent, so no food row can ever end the parse early.
        if not line.startswith(" " * 10) and line.strip().startswith(STOP_HEADING):
            break
        # Food rows are indented ten spaces; category headings sit at four.
        if not line.startswith(" " * 10) or not line.strip():
            continue
        food = line[NAME].strip()
        if not food:
            continue
        if len(line[NAME]) == (NAME.stop - NAME.start) and line[NAME.stop - 1] != " ":
            print(f"REFUSED: {food!r} fills the name column to its edge, so it may be "
                  f"truncated. Re-measure the geometry.", file=sys.stderr)
            return 1
        hunt, hunt_raw = _num(line[HUNT])
        anderson, anderson_raw = _num(line[ANDERSON])
        if not hunt_raw and not anderson_raw:
            continue
        # CONSERVATIVE: the lower of the two analyses, and the only one either may be when
        # the other did not measure this food.
        usable = [v for v in (hunt, anderson) if v is not None]
        value = min(usable, key=float) if usable else None
        rows.append({
            "food": food,
            "boron_ug_per_g": value,
            "hunt_1991": hunt_raw or None,
            "anderson_1994b": anderson_raw or None,
        })

    if len(rows) != EXPECTED_ROWS:
        print(f"expected {EXPECTED_ROWS} food rows, parsed {len(rows)}", file=sys.stderr)
        return 1
    values = [float(r["boron_ug_per_g"]) for r in rows if r["boron_ug_per_g"] is not None]
    if not values:
        print("REFUSED: no usable value parsed at all", file=sys.stderr)
        return 1
    if max(values) > MAX_PLAUSIBLE_UG_PER_G:
        print(f"REFUSED: {max(values)} ug/g exceeds anything Table 11 prints -- a slipped "
              f"column, not a rich food.", file=sys.stderr)
        return 1
    if max(values) < MIN_TABLE_MAX_UG_PER_G:
        print(f"REFUSED: the richest row is {max(values)} ug/g. Table 11 reaches the twenties; "
              f"this looks like a mg/100 g table read as ug/g.", file=sys.stderr)
        return 1

    Path(sys.argv[2]).write_text(
        json.dumps(rows, indent=1, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    print(f"{len(rows)} rows -> {sys.argv[2]}  (richest {max(values)} ug/g)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
