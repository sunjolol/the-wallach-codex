"""Extract Table 1 of Powell et al. 2005 -- the silicon content of 207 UK foods.

Two defences against a wrong-but-plausible number:

  1. COLUMN BY X-POSITION. The page carries a vertical Cambridge watermark at x>=575 whose
     words land on every row; whitespace-run extraction splices it into the data.
  2. THE SOURCE'S OWN ARITHMETIC. The table prints BOTH mg/portion and mean mg/100 g, plus the
     portion's gram weight in its description. Those three are redundant:
         mg_per_portion == mean_mg_per_100g * grams / 100
     Every row is checked against its own identity and any row that fails is REPORTED, never
     silently kept or silently dropped.

Decimal separator in this paper is U+00B7 MIDDLE DOT, not a full stop.
"""
import json
import re
import sys

import fitz

PDF, OUT = sys.argv[1], sys.argv[2]

BANDS = [(45, 185, "food"), (185, 303, "portion"), (303, 360, "n"),
         (360, 412, "per_portion"), (412, 452, "mean_100g"), (452, 495, "sd"),
         (495, 575, "published")]
WATERMARK_X = 575

NUMBER = re.compile(r"^\d+(?:[·.]\d+)?$")
GRAMS = re.compile(r"\((\d+(?:[·.]\d+)?)\s*g\)")


def num(s):
    s = (s or "").strip()
    return float(s.replace("·", ".")) if NUMBER.match(s) else None


def band_of(x):
    for lo, hi, name in BANDS:
        if lo <= x < hi:
            return name
    return None


def rows_of(page):
    lines = {}
    for x0, y0, x1, y1, w, *_ in page.get_text("words"):
        if x0 >= WATERMARK_X:
            continue                       # the vertical Cambridge watermark
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
    recs, current = [], None
    for pno in range(len(doc)):
        for c in rows_of(doc[pno]):
            food = c.get("food", "").strip()
            mean = num(c.get("mean_100g", ""))
            portion = c.get("portion", "").strip()
            starts = bool(food) and bool(re.match(r"^[A-Z]", food))
            if starts and (mean is not None or "ND" in c.get("mean_100g", "")
                           or "ND" in c.get("per_portion", "")):
                if current:
                    recs.append(current)
                current = {"food": food, "portion": portion, "page": pno + 1,
                           "n": c.get("n", "").strip(),
                           "per_portion_raw": c.get("per_portion", "").strip(),
                           "mean_100g_raw": c.get("mean_100g", "").strip(),
                           "sd_raw": c.get("sd", "").strip(),
                           "published_raw": c.get("published", "").strip()}
            elif current and (food or portion) and mean is None:
                # a wrapped description line -- text only, never a number
                current["food"] = (current["food"] + " " + food).strip()
                current["portion"] = (current["portion"] + " " + portion).strip()
    if current:
        recs.append(current)

    out, failed, nd = [], [], 0
    for r in recs:
        mean = num(r["mean_100g_raw"])
        per_p = num(r["per_portion_raw"])
        g = GRAMS.search(r["portion"])
        grams = float(g.group(1).replace("·", ".")) if g else None
        if mean is None:
            nd += 1                        # ND / not detected -- kept out, never zeroed
            continue
        rec = {"food": re.sub(r"\s+", " ", r["food"]),
               "portion": re.sub(r"\s+", " ", r["portion"]),
               "grams": grams,
               "silicon_mg_per_100g": r["mean_100g_raw"].replace("·", "."),
               "mg_per_portion": r["per_portion_raw"].replace("·", "."),
               "sd": r["sd_raw"].replace("·", "."),
               "published": r["published_raw"], "page": r["page"]}
        if per_p is not None and grams:
            expect = mean * grams / 100.0
            rec["identity_ok"] = abs(expect - per_p) <= max(0.05, 0.02 * max(expect, per_p))
            if not rec["identity_ok"]:
                rec["identity_detail"] = f"{mean} x {grams}/100 = {expect:.3f}, printed {per_p}"
                failed.append(rec)
        else:
            rec["identity_ok"] = None
        out.append(rec)

    json.dump(out, open(OUT, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    ok = sum(1 for r in out if r["identity_ok"] is True)
    unk = sum(1 for r in out if r["identity_ok"] is None)
    print(f"rows extracted        : {len(out)}   (ND/no value skipped: {nd})")
    print(f"  identity CONFIRMED  : {ok}")
    print(f"  identity unverifiable: {unk}  (no printed mg/portion or no gram weight)")
    print(f"  identity FAILED     : {len(failed)}")
    for r in failed[:12]:
        print(f"     ! {r['food'][:44]:44} {r['identity_detail']}")


main()
