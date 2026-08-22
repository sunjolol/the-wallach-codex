"""Extract the USDA Database for the Proanthocyanidin Content of Selected Foods, Release 2 (2015).

WHY THIS MATTERS AND WHY IT WAS MISSED. The flavonoid figures this campaign first produced summed
the FIVE subclasses in the Flavonoid database (flavonols, flavones, flavanones, flavan-3-ols,
anthocyanidins). Proanthocyanidins are a SIXTH class, published by USDA as a SEPARATE database,
and they are a large mass contributor in exactly the foods a flavonoid target cares about --
berries, cocoa, nuts, cinnamon. Omitting them makes every total systematically LOW.

Same table shape as the flavonoid release, so the same defence applies: columns are read by
x-position, never by whitespace runs.

The header states "blank cells indicate values were not reported". A blank is therefore NOT a
zero and is never treated as one -- a food's total is the sum of what was MEASURED, and the
count of measured classes travels with it so a reader can see how complete it is.
"""
import collections
import json
import re
import sys

import fitz

PDF, OUT = sys.argv[1], sys.argv[2]

BANDS = [(50, 100, "ndb"), (100, 222, "description"), (222, 289, "pa_class"),
         (289, 336, "mean"), (336, 356, "n"), (356, 397, "sd"),
         (397, 441, "min"), (441, 479, "max"), (479, 502, "cc"), (502, 700, "sources")]

NDB = re.compile(r"^\d{5}$")
NUM = re.compile(r"^\d+(?:\.\d+)?$")
CLASSES = {"Dimers", "Trimers", "4-6mers", "7-10mers", "Polymers", "Monomers"}


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
    foods, current = collections.OrderedDict(), None
    for pno in range(len(doc)):
        for c in page_rows(doc[pno]):
            ndb = c.get("ndb", "").strip()
            desc = c.get("description", "").strip()
            klass = c.get("pa_class", "").strip()
            mean = c.get("mean", "").strip()

            if NDB.match(ndb):
                current = ndb
                foods.setdefault(current, {"ndb": ndb, "description": desc,
                                           "classes": [], "page": pno + 1})
            elif current and desc and not klass and not NUM.match(mean or "x"):
                foods[current]["description"] = (
                    foods[current]["description"] + " " + desc).strip()

            if current and klass in CLASSES and NUM.match(mean or ""):
                foods[current]["classes"].append({
                    "class": klass, "mean_mg_per_100g": mean,
                    "n": c.get("n", "").strip(), "min": c.get("min", "").strip(),
                    "max": c.get("max", "").strip(), "cc": c.get("cc", "").strip(),
                })

    out = []
    for ndb, f in foods.items():
        if not f["classes"]:
            continue
        total = sum(float(x["mean_mg_per_100g"]) for x in f["classes"])
        out.append({
            "ndb": ndb,
            "description": re.sub(r"\s+", " ", f["description"]),
            "total_proanthocyanidins_mg_per_100g": round(total, 3),
            "classes_measured": len(f["classes"]),
            "classes": f["classes"],
            "page": f["page"],
        })

    json.dump(out, open(OUT, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    nz = [f for f in out if f["total_proanthocyanidins_mg_per_100g"] > 0]
    print(f"foods extracted            : {len(out)}")
    print(f"class rows                 : {sum(f['classes_measured'] for f in out)}")
    print(f"foods with a non-zero total: {len(nz)}")
    print("\n-- highest total proanthocyanidins (mg/100 g) --")
    for f in sorted(nz, key=lambda f: -f["total_proanthocyanidins_mg_per_100g"])[:15]:
        print(f"   {f['total_proanthocyanidins_mg_per_100g']:9.2f}  {f['ndb']}  "
              f"{f['description'][:52]}  ({f['classes_measured']} classes)")


main()
