#!/usr/bin/env python3
"""targets_derive.py — per-essential Wallach coverage targets (Phase G-1 upgrade).

Generates dashboard/assets/data/essentials-targets-data.json — the DB the Coverage
surface reads to answer "how much of each of the 90 essentials does the regimen cover."

THE RULE (Charter R2 / §00.A): every numeric target is a Wallach maintenance dose,
sourced ONLY from Wallach's BOOKS. A target-eligible dose is a DAILY / MAINTENANCE dose
(the "supplement program" / "base line" / "true supplement need" tables + any general
daily dose). Disease-specific therapeutic doses are excluded.

PHASE G-1 policy (Luneth 2026-07-09), layered on top of the source rule:
  1. POST THE UPPER of Wallach's stated range (a single number, not a range). The upper
     IS a number Wallach wrote (top of his own range); the full range is preserved in
     `range` for a "he recommends a range" quote. Applied to every target.
  2. NEWEST BOOK WINS. When an essential has doses in several books, the newest book's
     dose is the default (posted); older ones are kept in `other_claims` for the detail
     view + the "his guidance evolved" gloss. (Epigenetics 2014 > Let's Play Doctor 1995.)
  3. UNIT-NORMALIZE to the unit Youngevity products use, so goal and product amounts line
     up. Only Vitamin A/D/E need it (IU -> metric); everything else is already mg/mcg. The
     IU factors are physical/definitional constants (USP/FDA label conventions), NOT Wallach
     numbers — they only re-express Wallach's amount in a different unit. His original IU
     value is preserved in `range` + `provenance` (§00.B #11: the transform is auditable).
  4. WEIGHT-SCALE the per-100-lb mineral doses to a 154 lb / 70 kg reference adult (×1.54),
     then round to 2 significant figures DETERMINISTICALLY (so the gate can reproduce the
     exact chain raw×factor→round, nothing hand-typed).
  5. VITAMIN A is one essential with two complementary forms (retinol + beta-carotene);
     both convert to retinol-equivalents (mcg RAE) and SUM into one coverage target, with
     both sub-recs kept in `parts`.

WHAT COMES FROM WHERE:
  - STRUCTURE (name, category, order) -> essentials-canon.json (pillar).
  - NUMERIC TARGET -> sealed corpus dose claims (pillar); the transform is deterministic here.
  - CITATION -> composed from books-meta.json (never hand-typed).
  - coverage_kind (non-numeric coverage) -> essentials-canon.json.

amounts_wallach_only proves every posted number traces to a Wallach dose claim mapping the
essential AND recomputes exactly from the documented transform chain — it anchors each
`provenance.original_*` to the sealed claim's dose, pins IU factors to the known physical
constants, and byte-compares the re-derived value to the posted number (tightened 2026-07-09;
the provenance stamp exists for exactly this).
"""
import collections
import json
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
CORPUS = ROOT / "eden" / "corpus"
OUT_PATH = ROOT / "dashboard" / "assets" / "data" / "essentials-targets-data.json"

sys.path.insert(0, str(ROOT / "tools"))
import safe_write  # noqa: E402

CAT_MAP = {"mineral": "minerals", "vitamin": "vitamins",
           "amino_acid": "amino_acids", "fatty_acid": "fatty_acids"}

# IU -> Youngevity-common metric unit. Physical/definitional constants (USP/FDA supplement-
# label conventions), NOT Wallach numbers: they re-express his stated amount in the unit the
# products use. (slug, form) -> (factor, out_unit, factor_source, unit_detail).
IU_CONVERSIONS = {
    ("vitamin-a", "retinol"):       (0.3,   "mcg", "USP: 1 IU retinol = 0.3 mcg RAE", "RAE"),
    ("vitamin-a", "beta-carotene"): (0.3,   "mcg", "USP: 1 IU supplemental beta-carotene = 0.3 mcg RAE", "RAE"),
    ("vitamin-d", None):            (0.025, "mcg", "1 mcg vitamin D = 40 IU", None),
    ("vitamin-e", None):            (0.67,  "mg",  "1 IU natural d-alpha-tocopherol = 0.67 mg", None),
}
BODY_WEIGHT_LB = 154  # 70 kg reference adult; Epigenetics mineral doses are stated per 100 lb

# for_condition -> maintenance priority (lower preferred). None => therapeutic (excluded).
_COND_MARKERS = [
    ("base-line", 0), ("base line", 0), ("true supplement need", 0), ("supplement program", 0),
    ("daily maintenance", 1), ("maintenance", 2),
]


def _cond_priority(cond):
    if cond is None or str(cond).strip() == "":
        return 3
    c = str(cond).lower()
    for marker, rank in _COND_MARKERS:
        if marker in c:
            return rank
    return None


def _round_2sf(x):
    """Round to 2 significant figures (deterministic — the gate can reproduce it)."""
    if not x:
        return 0.0
    return round(x, 1 - int(math.floor(math.log10(abs(x)))))


def _load_claims() -> list:
    claims = []
    for shard in sorted((CORPUS / "claims").glob("claims-*.json")):
        claims += json.loads(shard.read_text(encoding="utf-8")).get("claims", [])
    return claims


def _parse_amount(a):
    if isinstance(a, (int, float)):
        return float(a), None
    if isinstance(a, str):
        m = re.match(r"\s*([\d.,]+)\s*[-–]\s*([\d.,]+)", a)
        if m:
            return float(m.group(1).replace(",", "")), float(m.group(2).replace(",", ""))
        m = re.match(r"\s*([\d.,]+)", a)
        if m:
            return float(m.group(1).replace(",", "")), None
    return None, None


def _book_display(books_meta: dict, book_id: str) -> str:
    b = books_meta.get(book_id)
    if not b:
        return book_id
    yr = b.get("year")
    return f"{b['title']} (Wallach{', ' + str(yr) if yr else ''})"


def _maintenance_doses(claims: list, books_meta: dict) -> dict:
    """slug -> list of maintenance dose records (parsed range + year + form + per_bw)."""
    out = collections.defaultdict(list)
    for c in claims:
        if c.get("kind") != "dose":
            continue
        dz = c.get("dose") or {}
        if dz.get("amount") is None:
            continue
        pr = _cond_priority(dz.get("for_condition"))
        if pr is None:
            continue
        low, high = _parse_amount(dz.get("amount"))
        if low is None:
            continue
        year = (books_meta.get(c["locator"]["book"], {}) or {}).get("year") or 0
        for slug in c.get("essentials", []):
            out[slug].append({
                "id": c["id"], "book": c["locator"]["book"], "year": year,
                "low": low, "high": high, "unit": dz.get("unit"),
                "form": dz.get("form"), "per_bw": dz.get("per_body_weight"),
                "priority": pr,
            })
    return out


def _convert(slug: str, d: dict):
    """Apply upper-of-range -> IU conversion -> weight-scaling -> rounding.
    Returns (value, unit_out, provenance)."""
    upper = d["high"] if d["high"] is not None else d["low"]
    prov = {"original_low": d["low"], "original_high": d["high"],
            "original_unit": d["unit"], "upper_taken": upper}
    value, unit_out = upper, d["unit"]
    conv = IU_CONVERSIONS.get((slug, d.get("form"))) or IU_CONVERSIONS.get((slug, None))
    if d["unit"] == "IU" and conv:
        factor, unit_out, src, detail = conv
        value = upper * factor
        prov["factor"] = factor
        prov["factor_source"] = src
        if detail:
            prov["unit_detail"] = detail
    if d.get("per_bw") == "100lb":
        value = _round_2sf(value * (BODY_WEIGHT_LB / 100.0))
        prov["scale_factor"] = BODY_WEIGHT_LB / 100.0
        prov["body_weight_basis"] = f"{BODY_WEIGHT_LB} lb (70 kg reference); source stated per 100 lb"
        prov["rounding"] = "2 significant figures"
    return value, unit_out, prov


def build_data() -> dict:
    canon = json.loads((CORPUS / "essentials-canon.json").read_text(encoding="utf-8"))["essentials"]
    claims = _load_claims()
    books_meta = {b["book_id"]: b for b in
                  json.loads((CORPUS / "books-meta.json").read_text(encoding="utf-8"))["books"]}
    doses = _maintenance_doses(claims, books_meta)

    essentials = []
    for e in canon:
        slug = e["slug"]
        name = e["layout_key"]
        category = CAT_MAP.get(e["category"], "minerals")
        lst = doses.get(slug, [])

        if lst:
            max_year = max(d["year"] for d in lst)
            primary = sorted([d for d in lst if d["year"] == max_year],
                             key=lambda d: (d["priority"], d["id"]))
            others = [d for d in lst if d["year"] != max_year]

            forms = [d.get("form") for d in primary]
            complementary = len(primary) > 1 and all(forms) and len(set(forms)) == len(forms)
            if not complementary:
                # not distinct complementary forms -> one primary, the rest are "other" doses
                others = primary[1:] + others
                primary = primary[:1]
            others.sort(key=lambda d: (-d["year"], d["priority"], d["id"]))

            conv = [_convert(slug, d) for d in primary]  # list of (value, unit, prov)
            unit_out = conv[0][1]
            if complementary:
                scaled = any(d.get("per_bw") for d in primary)
                total = sum(c[0] for c in conv)
                value = _round_2sf(total) if scaled else total
                parts = [{
                    "form": d.get("form"), "value": c[0], "unit": c[1],
                    "claim_id": d["id"],
                    "range": {"low": d["low"], "high": d["high"], "unit": d["unit"]},
                    "provenance": c[2],
                } for d, c in zip(primary, conv)]
            else:
                value = conv[0][0]
                parts = None

            p0 = primary[0]
            target = {
                "kind": "wallach",
                "low": value,
                "unit": unit_out,
                "period": "daily",
                "source_claim_id": p0["id"],
                "source": f"Wallach — {_book_display(books_meta, p0['book'])}",
                "range": {"low": p0["low"], "high": p0["high"], "unit": p0["unit"]},
                "provenance": conv[0][2],
            }
            if parts:
                target["parts"] = parts
            if others:
                target["other_claims"] = [{
                    "claim_id": d["id"], "book": d["book"], "year": d["year"],
                    "low": d["low"], "high": d["high"], "unit": d["unit"],
                    "source": _book_display(books_meta, d["book"]),
                } for d in others]
        else:
            target = {
                "kind": e.get("coverage_kind", "unspecified"),
                "source": "Wallach framework — no maintenance amount stated (honest gap; blueprint §7.1)",
            }

        essentials.append({"name": name, "slug": slug, "category": category, "target": target})

    return {
        "_purpose": "Per-essential Wallach coverage targets. GENERATED by eden/tools/targets_derive.py "
                    "from essentials-canon + sealed corpus dose claims. Numeric targets are Wallach-only, "
                    "books-only (R2); the posted number is the UPPER of Wallach's newest stated maintenance "
                    "range, unit-normalized to Youngevity units + (minerals) scaled to 154 lb. The full range "
                    "+ transform live in `range`/`provenance`; older books in `other_claims`. Never hand-edit; "
                    "run eden/tools/build_embeds.py.",
        "essentials": essentials,
    }


def render() -> str:
    return json.dumps(build_data(), ensure_ascii=False, sort_keys=True,
                      separators=(",", ":")) + "\n"


def write_data() -> int:
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    return safe_write.safe_rewrite(OUT_PATH, render())


if __name__ == "__main__":
    n = write_data()
    d = build_data()
    numeric = sum(1 for e in d["essentials"] if isinstance(e["target"].get("low"), (int, float)))
    print(f"OK  wrote essentials-targets-data.json ({n} B) · {len(d['essentials'])} essentials · "
          f"{numeric} Wallach numeric targets · {len(d['essentials']) - numeric} honest-gap/non-numeric")
