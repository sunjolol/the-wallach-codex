#!/usr/bin/env python3
"""orac_foods_derive.py -- the ORAC tab's food league-tables NUMBERS (Phase 3b).

Generates dashboard/assets/data/orac-foods-data.json -- every Wallach ORAC score the
sections 04-07 of the ORAC knowledge tab display (the REACH bars vs the daily target,
the SCALE spice-outlier bars, the eight category LEAGUE TABLES + the Hell's Kitchen
top-ten, and the red-vs-white WINE gap).

THE RULE (Charter R1/R3 + SS00.A -- the mineral-tiers lesson): a Wallach number lives in
exactly ONE home. No ORAC score is hand-typed into a view, into view-copy, or into the
curation file -- that would be a second, ungated home. This generator reads every score
straight out of the sealed corpus (the byte-faithful `verbatim` of five food_source
claims, each carrying dose == null) and the view interpolates them. A number that is NOT
present in its claim's verbatim cannot be produced here.

WHERE THE NUMBERS COME FROM -- the two ORAC bases, kept separate and LABELLED:
  per-serving pool (Immortality)   WAL-CLM-IMMORT-000240 (11) · 000241 (4 wines)
                                   · 000263 (16) · 000264 (23)  = 54 rows
  per-100 g pool  (Hell's Kitchen) WAL-CLM-HELLS-000014                = 10 rows
  reach target                     WAL-CLM-IMMORT-000238  (20,000-25,000/day; high=denominator)

WHAT THE CURATION DECIDES (dashboard/assets/data/orac-foods-curation.json -- hand-authored,
numbers-free): only NAMES (display fixes for the source's OCR typos), GROUPING (food ->
category), COLOUR (per category), and SELECTION (the reach 9 + scale 6 + the omitted baby
foods). Each curation `raw` is a byte-exact join key into a pool. THE DERIVE HARD-FAILS
(FoodsError) if a `raw` does not resolve, or if any per-serving pool row is neither placed
in a category nor listed in `omit` -- a silent drop reddens the board, never ships.

Deterministic (sorted keys, no timestamp) so build_data() byte-compares to disk
(derived_artifacts_fresh). Model: eden/tools/orac_data_derive.py.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
CORPUS = ROOT / "eden" / "corpus"
CURATION_PATH = ROOT / "dashboard" / "assets" / "data" / "orac-foods-curation.json"
OUT_PATH = ROOT / "dashboard" / "assets" / "data" / "orac-foods-data.json"

sys.path.insert(0, str(ROOT / "tools"))
import safe_write  # noqa: E402

PERSERV_IDS = ["WAL-CLM-IMMORT-000240", "WAL-CLM-IMMORT-000241",
               "WAL-CLM-IMMORT-000263", "WAL-CLM-IMMORT-000264"]
HELLS_ID = "WAL-CLM-HELLS-000014"
TARGET_ID = "WAL-CLM-IMMORT-000238"


class FoodsError(RuntimeError):
    """A curation name did not resolve, or a pool row was silently dropped (never guess)."""


def _load_claims_by_id() -> dict:
    out = {}
    for shard in sorted((CORPUS / "claims").glob("claims-*.json")):
        for c in json.loads(shard.read_text(encoding="utf-8")).get("claims", []):
            out[c["id"]] = c
    return out


def _books_meta() -> dict:
    return {b["book_id"]: b
            for b in json.loads((CORPUS / "books-meta.json").read_text(encoding="utf-8"))["books"]}


def _claim(claims: dict, cid: str) -> dict:
    c = claims.get(cid)
    if c is None:
        raise FoodsError(f"source claim {cid} not found in the sealed corpus")
    if not str(c.get("verbatim") or "").strip():
        raise FoodsError(f"source claim {cid} has no verbatim to parse")
    return c


def _book_cite(claims: dict, books_meta: dict, cid: str) -> str:
    """Book-level cite 'ShortTitle (Year)', composed from the sealed registry (R3).

    The food_source claims locate by SCREENSHOT (no printed page), so -- exactly like the
    Phase-2 payoff cite (WAL-CLM-IMMORT-000259) -- the cite renders book-level rather than
    the demo's hand-typed 'pp.378-381'. Never hand-typed."""
    book = _claim(claims, cid)["locator"]["book"]
    b = books_meta.get(book, {})
    title = (b.get("title", book).split(":", 1)[0]).strip()
    return f"{title} ({b.get('year')})"


def _parse_immort(verbatim: str) -> list:
    """'Name 1,234' per line -> [(name, int)]. Every non-blank line MUST parse (no guess)."""
    out = []
    for line in verbatim.split("\n"):
        line = line.strip()
        if not line:
            continue
        m = re.match(r"^(.*?)\s+([\d,]+)$", line)
        if m is None:
            raise FoodsError(f"per-serving verbatim line did not parse: {line!r}")
        out.append((m.group(1).strip(), int(m.group(2).replace(",", ""))))
    return out


def _parse_hells(verbatim: str) -> list:
    """'rank Name 1,234' per line, skipping the header -> [(name, int)]."""
    out = []
    for line in verbatim.split("\n"):
        line = line.strip()
        if not line or line.lower().startswith("orac rating"):
            continue
        m = re.match(r"^\d+\s+(.*?)\s+([\d,]+)$", line)
        if m is None:
            raise FoodsError(f"per-100g verbatim line did not parse: {line!r}")
        out.append((m.group(1).strip(), int(m.group(2).replace(",", ""))))
    return out


def _pools(claims: dict) -> tuple:
    """The two ORAC score pools keyed by byte-exact source name; each name unique within a pool."""
    perserv, order = {}, []
    for cid in PERSERV_IDS:
        for name, val in _parse_immort(_claim(claims, cid)["verbatim"]):
            if name in perserv:
                raise FoodsError(f"duplicate per-serving source name {name!r} (pool must be unique)")
            perserv[name] = val
            order.append(name)
    per100 = {}
    for name, val in _parse_hells(_claim(claims, HELLS_ID)["verbatim"]):
        if name in per100:
            raise FoodsError(f"duplicate per-100g source name {name!r}")
        per100[name] = val
    return perserv, order, per100


def _reach_target(claims: dict) -> int:
    """The daily-target HIGH (25,000), parsed from the target claim's verbatim -- the reach
    denominator, so even the '25,000' is claim-sourced, never hand-typed here."""
    v = _claim(claims, TARGET_ID)["verbatim"]
    m = re.search(r"([\d,]+) to ([\d,]+) per day", v)
    if m is None:
        raise FoodsError(f"{TARGET_ID}: could not read the ORAC daily band from verbatim")
    return int(m.group(2).replace(",", ""))


def build_data() -> dict:
    claims = _load_claims_by_id()
    books_meta = _books_meta()
    curation = json.loads(CURATION_PATH.read_text(encoding="utf-8"))
    perserv, perserv_order, per100 = _pools(claims)

    def pool_for(src: str) -> dict:
        if src == "perserv":
            return perserv
        if src == "per100":
            return per100
        raise FoodsError(f"unknown category source {src!r} (expected perserv|per100)")

    def lookup(src: str, raw: str, where: str) -> int:
        p = pool_for(src)
        if raw not in p:
            raise FoodsError(f"[{where}] curation name {raw!r} not found in the {src} pool "
                             f"(HARD-FAIL: a curated food resolves to no sealed claim row)")
        return p[raw]

    # --- category league tables (04-07 body) + raw->colour for perserv foods --------
    raw_color = {}
    placed_perserv = set()
    categories = []
    for cat in curation["categories"]:
        src = cat["source"]
        rows = []
        for r in cat["rows"]:
            raw, disp = r["raw"], r["display"]
            val = lookup(src, raw, f"category {cat['key']}")
            rows.append((disp, val))
            if src == "perserv":
                if raw in placed_perserv:
                    raise FoodsError(f"per-serving food {raw!r} placed in more than one category")
                placed_perserv.add(raw)
                raw_color[raw] = cat["color"]
        cmax = max(v for _, v in rows)
        categories.append({
            "key": cat["key"], "label": cat["label"], "color": cat["color"],
            "basis": cat["basis"],
            "rows": [{"name": disp, "value_display": f"{val:,}",
                      "bar": round(val / cmax * 100, 1)} for disp, val in rows],
        })

    # --- completeness: no per-serving row silently dropped -----------------------------
    omit = {o["raw"] for o in curation["omit"]}
    for raw in omit:
        if raw not in perserv:
            raise FoodsError(f"omit lists {raw!r}, which is not a per-serving pool row")
    missing = [r for r in perserv_order if r not in placed_perserv and r not in omit]
    if missing:
        raise FoodsError(f"per-serving rows neither placed nor omitted (silent drop): {missing}")
    both = placed_perserv & omit
    if both:
        raise FoodsError(f"rows both placed and omitted: {sorted(both)}")

    # --- 04 REACH: each food as % of the daily target ---------------------------------
    target = _reach_target(claims)
    reach_rows = []
    for r in curation["reach"]:
        raw, disp = r["raw"], r["display"]
        val = lookup("perserv", raw, "reach")
        if raw not in raw_color:
            raise FoodsError(f"[reach] {raw!r} has no category colour (place it in a category)")
        pct = round(val / target * 100)
        reach_rows.append({"name": disp, "color": raw_color[raw],
                           "pct": pct, "over": val > target})

    # --- 05 SCALE: spice-outlier bars relative to the first (cloves) -------------------
    scale_src = [(r["display"], lookup("perserv", r["raw"], "scale"), raw_color.get(r["raw"], ""))
                 for r in curation["scale"]]
    for r, (_disp, _val, col) in zip(curation["scale"], scale_src):
        if not col:
            raise FoodsError(f"[scale] {r['raw']!r} has no category colour")
    smax = scale_src[0][1]
    scale_rows = [{"name": disp, "color": col, "value": val,
                   "value_display": f"{val:,}", "bar": round(val / smax * 100, 1)}
                  for disp, val, col in scale_src]

    # --- 07 WINE: the wine category, re-presented as scale-style bars ------------------
    wine_cat = next((c for c in categories if c["key"] == "wine"), None)
    if wine_cat is None:
        raise FoodsError("no 'wine' category in curation for the section-07 wine block")
    wine_rows = [{"name": row["name"], "color": wine_cat["color"],
                  "value_display": row["value_display"], "bar": row["bar"]}
                 for row in wine_cat["rows"]]

    return {
        "_purpose": "The ORAC knowledge tab's food league-table numbers (Phase 3b, sections "
                    "04-07). GENERATED by eden/tools/orac_foods_derive.py -- every ORAC score is "
                    "parsed from a sealed food_source claim's byte-faithful verbatim (dose is null "
                    "on all 5), so no score is hand-typed in a view, in view-copy, or in the "
                    "curation (R1/R3/SS00.A). The curation (orac-foods-curation.json) decides only "
                    "names/grouping/colour/selection. Never hand-edit; run eden/tools/build_embeds.py.",
        "reach": {
            "source_claim_id": TARGET_ID,
            "target": target,
            "target_display": f"{target:,}",
            "cite": _book_cite(claims, books_meta, PERSERV_IDS[0]),
            "rows": reach_rows,
        },
        "scale": {
            "max_display": f"{smax:,}",
            "rows": scale_rows,
        },
        "tables": {"categories": categories},
        "wine": {"rows": wine_rows},
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
    print(f"OK  wrote orac-foods-data.json ({n} B) · "
          f"reach {len(d['reach']['rows'])} (target {d['reach']['target_display']}) · "
          f"scale {len(d['scale']['rows'])} (max {d['scale']['max_display']}) · "
          f"tables {len(d['tables']['categories'])} categories "
          f"({sum(len(c['rows']) for c in d['tables']['categories'])} rows) · "
          f"wine {len(d['wine']['rows'])} · cite {d['reach']['cite']}")
