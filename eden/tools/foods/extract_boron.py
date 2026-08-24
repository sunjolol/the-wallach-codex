#!/usr/bin/env python3
"""extract_boron.py -- Table 2 of Pizzorno 2015 (PMC4712861): boron by CHEMICAL ANALYSIS.

Usage: extract_boron.py <payload.html> <out.json>

★ THE ARTICLE PUBLISHES TWO BORON TABLES AND TAKING THE WRONG ONE IS THE WHOLE RISK.

TABLE 1 (id="table001") is captioned, verbatim, "(Food Processor/Overestimated) Boron Content of
Richest Food Sources" and is adapted from Naghii et al. Its figures -- raisins 4.51 mg/100 g,
almonds 2.82, dried apricots 2.11 -- are the ones a web search returns for boron, and they are NOT
measurements: the article's own body states that Meacham et al "have shown that currently available
computer software databases such as Food Processor (ESHA, Salem, OR, USA) greatly overestimate the
boron content of foods", and reports the comparison -- chemical analysis of the same dietary
records found 1.2 mg/d where Food Processor reported 4.5 to 5.3 mg/d.

TABLE 2 (id="table002") is what this reads: "Chemical Analysis of Boron Content (mg/100 g) in the
Top 10 Foods", adapted from Meacham et al. Its values run 3-8x lower for the same foods.

This extractor pins itself to the section id AND re-reads the caption, so a re-ordered page cannot
silently hand it Table 1. Values are carried as the source's own STRINGS, unparsed -- the same
contract every other candidate here keeps, so the gate's byte comparison means something.
"""
import json
import re
import sys
from pathlib import Path

# Table 2's caption. Re-read rather than assumed: the id alone would not notice a re-ordered page.
CAPTION = "Chemical Analysis of Boron Content"
EXPECTED_ROWS = 10
# The richest figure Table 2 publishes is avocado at 1.43. Table 1's top entries (raisins 4.51,
# almonds 2.82, hazelnuts 2.77) all sit above 2.0, so a ceiling here catches a wrong-table read
# even if the caption check were ever defeated.
MAX_PLAUSIBLE = 2.0


def strip_tags(t: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", t)).strip()


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: extract_boron.py <payload.html> <out.json>", file=sys.stderr)
        return 2
    html = Path(sys.argv[1]).read_text(encoding="utf-8", errors="replace")

    m = re.search(r'<section[^>]*id="table002"(.*?)</section>', html, re.S)
    if m is None:
        print("Table 2 (id=table002) not found in the payload", file=sys.stderr)
        return 1
    block = m.group(1)
    if CAPTION.lower() not in strip_tags(block).lower():
        print(f"id=table002 does not carry the expected caption {CAPTION!r} -- refusing rather "
              f"than risk reading Table 1", file=sys.stderr)
        return 1

    rows = []
    for tr in re.findall(r"<tr>(.*?)</tr>", block, re.S):
        cells = [strip_tags(td) for td in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", tr, re.S)]
        if len(cells) != 2 or not re.fullmatch(r"\d+\.\d+", cells[1]):
            continue
        rows.append({"food": cells[0], "boron_mg_per_100g": cells[1]})

    if len(rows) != EXPECTED_ROWS:
        print(f"expected {EXPECTED_ROWS} rows, parsed {len(rows)}", file=sys.stderr)
        return 1
    over = [r for r in rows if float(r["boron_mg_per_100g"]) > MAX_PLAUSIBLE]
    if over:
        print(f"REFUSED: {over} exceeds Table 2's range -- this looks like the "
              f"Food Processor/Overestimated table", file=sys.stderr)
        return 1

    # newline="" so the bytes are the SAME on every host: write_text would translate to CRLF on
    # Windows and the gate compares this output to the committed candidate BYTE for byte (R1).
    Path(sys.argv[2]).write_text(json.dumps(rows, indent=1, ensure_ascii=False) + "\n",
                                 encoding="utf-8", newline="")
    print(f"OK  {len(rows)} rows from Table 2 (chemical analysis)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
