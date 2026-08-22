"""Extract the USDA Database for the Flavonoid Content of Selected Foods, Release 3.3.

The distributed data file is an Access .accdb and this host has no Access driver. The same
values are printed in the release PDF, one line per (food, flavonoid compound), keyed by NDB
number -- which is exactly the join our catalog already carries.

Column-by-x-position again, for the same reason as the other two extractors: whitespace-run
extraction of this table interleaves the wrapped Description lines with the numeric columns.

A food's TOTAL flavonoids is the SUM of its individual compound means. That sum is computed
here and the compound list is kept alongside it, so the total is never an unsupported number --
you can always see the rows it came from.
"""
import collections
import json
import re
import sys

import fitz

PDF, OUT = sys.argv[1], sys.argv[2]

BANDS = [(20, 62, "ndb"), (62, 196, "description"), (196, 272, "flav_class"),
         (272, 405, "compound"), (405, 450, "mean"), (450, 473, "n"),
         (473, 530, "se"), (530, 576, "min"), (576, 616, "max"), (616, 639, "cc"),
         (639, 900, "sources")]

NDB = re.compile(r"^\d{5}$")
NUM = re.compile(r"^\d+(?:\.\d+)?$")


def band_of(x):
    for lo, hi, name in BANDS:
        if lo <= x < hi:
            return name
    return None


def page_rows(page):
    lines = {}
    for x0, y0, x1, y1, w, *_ in page.get_text("words"):
        lines.setdefault(round(y0 / 3.0), []).append((x0, w))
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
    foods = collections.OrderedDict()
    current = None
    for pno in range(len(doc)):
        for c in page_rows(doc[pno]):
            ndb = c.get("ndb", "").strip()
            desc = c.get("description", "").strip()
            comp = c.get("compound", "").strip()
            mean = c.get("mean", "").strip()

            if NDB.match(ndb):
                current = ndb
                foods.setdefault(current, {"ndb": ndb, "description": desc,
                                           "compounds": [], "page": pno + 1})
            elif current and desc and not comp and not NUM.match(mean or "x"):
                # wrapped description line: text only, never a value
                foods[current]["description"] = (
                    foods[current]["description"] + " " + desc).strip()

            if current and comp and NUM.match(mean or ""):
                foods[current]["compounds"].append({
                    "class": c.get("flav_class", "").strip(),
                    "compound": comp,
                    "mean_mg_per_100g": mean,          # source's own string, unparsed
                    "n": c.get("n", "").strip(),
                    "min": c.get("min", "").strip(),
                    "max": c.get("max", "").strip(),
                    "cc": c.get("cc", "").strip(),
                })

    out = []
    for ndb, f in foods.items():
        if not f["compounds"]:
            continue
        total = sum(float(x["mean_mg_per_100g"]) for x in f["compounds"])
        out.append({
            "ndb": ndb,
            "description": re.sub(r"\s+", " ", f["description"]),
            "total_flavonoids_mg_per_100g": round(total, 3),
            "compound_count": len(f["compounds"]),
            "classes": sorted({x["class"] for x in f["compounds"] if x["class"]}),
            "compounds": f["compounds"],
            "page": f["page"],
        })

    json.dump(out, open(OUT, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    print(f"foods extracted : {len(out)}")
    print(f"compound rows   : {sum(f['compound_count'] for f in out)}")
    nz = [f for f in out if f["total_flavonoids_mg_per_100g"] > 0]
    print(f"foods with a non-zero total: {len(nz)}")
    print("\n-- highest total flavonoids (mg/100 g) --")
    for f in sorted(nz, key=lambda f: -f["total_flavonoids_mg_per_100g"])[:18]:
        print(f"   {f['total_flavonoids_mg_per_100g']:9.2f}  {f['ndb']}  "
              f"{f['description'][:56]}  ({f['compound_count']} compounds)")


main()
