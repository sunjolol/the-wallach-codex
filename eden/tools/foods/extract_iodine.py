"""Extract the USDA/FDA/ODS-NIH Iodine Database (Release 4) from its PDF.

Column-by-x-position, NOT by whitespace runs. pdftotext -layout interleaves this table's
continuation lines and would silently attach one food's Min/Max to another's row -- the exact
shape of a wrong-but-plausible number. Word coordinates cannot do that.

Emits one record per data row with the source's own strings preserved unparsed, so a gate can
byte-compare later.
"""
import json
import re
import sys

import fitz

PDF = sys.argv[1]
OUT = sys.argv[2]

# x-band -> field. Bands come from the header row's own word positions (verified on page 2).
BANDS = [
    (55, 84, "db_id"),
    (84, 155, "ndb_raw"),      # NDB No., sometimes "a/b", sometimes "(100297)" = FDC id
    (155, 172, "tds_no"),
    (172, 320, "description"),
    (320, 336, "n"),
    (336, 388, "iodine"),      # mcg/100 g
    (388, 410, "sd"),
    (410, 440, "min"),
    (440, 462, "max"),
    (462, 500, "sources"),
    (500, 600, "years"),
]

# A row is anchored by a DB_ID: a bare integer in the leftmost band.
DBID = re.compile(r"^\d{1,4}$")
NUM = re.compile(r"^\d+(?:\.\d+)?$")


def band_of(x):
    for lo, hi, name in BANDS:
        if lo <= x < hi:
            return name
    return None


def page_lines(page):
    """Group words into visual lines, then bucket each line's words by column band."""
    lines = {}
    for x0, y0, x1, y1, word, *_ in page.get_text("words"):
        lines.setdefault(round(y0 / 4.0), []).append((x0, word))
    out = []
    for key in sorted(lines):
        cells = {}
        for x, w in sorted(lines[key]):
            b = band_of(x)
            if b:
                cells.setdefault(b, []).append(w)
        out.append({k: " ".join(v) for k, v in cells.items()})
    return out


def main():
    doc = fitz.open(PDF)
    records = []
    current = None
    for pno in range(len(doc)):
        for cells in page_lines(doc[pno]):
            dbid = cells.get("db_id", "").strip()
            desc = cells.get("description", "").strip()
            # Header/footer/category noise carries no DB_ID and no numeric iodine value.
            if DBID.match(dbid):
                if current:
                    records.append(current)
                current = {k: cells.get(k, "").strip() for _, _, k in BANDS}
                current["page"] = pno + 1
            elif current and desc and not cells.get("db_id"):
                # continuation of a wrapped description ONLY -- never a numeric field
                if not any(NUM.match(cells.get(f, "").strip() or "x")
                           for f in ("iodine", "n", "min", "max")):
                    current["description"] = (current["description"] + " " + desc).strip()
    if current:
        records.append(current)

    clean = []
    for r in records:
        ndb_raw = r.get("ndb_raw", "")
        ndbs = re.findall(r"\b(\d{5})\b", ndb_raw)
        fdcs = re.findall(r"\((\d{6})\)", ndb_raw)
        if not NUM.match(r.get("iodine", "")):
            continue                       # no usable value -- dropped, never defaulted to 0
        clean.append({
            "db_id": r["db_id"],
            "ndb_numbers": ndbs,
            "fdc_ids": fdcs,
            "tds_no": r.get("tds_no", ""),
            "description": re.sub(r"\s+", " ", r.get("description", "")),
            "n": r.get("n", ""),
            "iodine_mcg_per_100g": r["iodine"],   # the source's own string, unparsed
            "sd": r.get("sd", ""),
            "min": r.get("min", ""),
            "max": r.get("max", ""),
            "sources": r.get("sources", ""),
            "years": r.get("years", ""),
            "page": r["page"],
        })

    json.dump(clean, open(OUT, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    with_ndb = sum(1 for c in clean if c["ndb_numbers"])
    with_tds = sum(1 for c in clean if c["tds_no"])
    print(f"rows extracted   : {len(clean)}")
    print(f"  carrying NDB   : {with_ndb}")
    print(f"  carrying TDS # : {with_tds}")
    print(f"  carrying BOTH  : {sum(1 for c in clean if c['ndb_numbers'] and c['tds_no'])}")


main()
