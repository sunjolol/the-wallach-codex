#!/usr/bin/env python3
"""orac_data_derive.py — the ORAC knowledge tab's canonical NUMBERS (Phase 2).

Generates dashboard/assets/data/orac-data.json — every Wallach number the §02/§03/§08
narrative sections of the ORAC knowledge tab display (the mirror-test decade table, the
stolen-years gap + world-ranking decline, the daily target, the disease dose, the
calorie band, the payoff, and the longevity ceiling).

THE RULE (Charter R1/R3 + §00.A): a Wallach number lives in exactly ONE home. It is
NEVER hand-typed into a view or the view-copy prose store — that would be a second,
ungated home, the exact shape of the mineral-tiers invention (a value sealed as canon
that no gate could prove RIGHT). So this generator reads the numbers straight out of the
sealed corpus and the view interpolates them; the framing PROSE (with {placeholders})
lives in view-copy.json, the NUMBERS live here.

WHERE THE NUMBERS COME FROM — the byte-faithful `verbatim`, not our summary.
Every source claim below carries dose == null; the numbers are stated in Wallach's own
words inside `verbatim`, which corpus_verify pins to the sealed book .txt at char_offset
(and corpus_integrity seals). So parsing the verbatim anchors each number to the book:
R5 proves the quote is the book's; this parses the book's number out of that quote. A
number that is NOT present in its claim's verbatim raises here (the build hard-fails and
the artifact cannot be written or pass derived_artifacts_fresh) — never a silent guess.

  §02  decades       WAL-CLM-IMMORT-000261  Adelman aging-pigment decade table (p.29)
       stolen_years  WAL-CLM-IMMORT-000254  95-100 vs ~75; 20-25 years short
       rankings      WAL-CLM-IMMORT-000262  US longevity rank 17->24->46->48 (p.9)
  §03  target        WAL-CLM-IMMORT-000238  20,000-25,000 ORAC/day; to reach age 100
       disease       WAL-CLM-EPIGEN-000154  neurological disease: >100,000 ORAC/day
  §08  calories      WAL-CLM-IMMORT-000255  calorie-restricted band 1,250-1,800
       payoff        WAL-CLM-IMMORT-000259  +25-50 healthful years; 150-175 lb person
       ceiling       WAL-CLM-IMMORT-000260  "150, 175 or 200" — the ceiling (base 100
                     from the target claim; gap = ceiling - base)

CITATIONS are composed here from the sealed claim (books-meta title + the claim's own
locator.page + an author/agency attribution parsed from the verbatim) — never hand-typed
(R3), mirroring state/search.ts::composeCite. The connector words (", p.", " · after ")
are citation formatting in auditable generator code, not health data.

Deterministic (sorted keys, no timestamp) so build_data() byte-compares to disk
(derived_artifacts_fresh). Model: eden/tools/targets_derive.py.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
CORPUS = ROOT / "eden" / "corpus"
OUT_PATH = ROOT / "dashboard" / "assets" / "data" / "orac-data.json"

sys.path.insert(0, str(ROOT / "tools"))
import safe_write  # noqa: E402

DASH = "–"  # en dash, matching the signed-off demo's ranges


def _load_claims_by_id() -> dict:
    out = {}
    for shard in sorted((CORPUS / "claims").glob("claims-*.json")):
        for c in json.loads(shard.read_text(encoding="utf-8")).get("claims", []):
            out[c["id"]] = c
    return out


def _books_meta() -> dict:
    return {b["book_id"]: b
            for b in json.loads((CORPUS / "books-meta.json").read_text(encoding="utf-8"))["books"]}


def _short_title(books_meta: dict, book_id: str) -> str:
    """The book's short title (before any subtitle ':'), single-sourced from the registry."""
    b = books_meta.get(book_id)
    return (b["title"].split(":", 1)[0].strip()) if b else book_id


def _num(s) -> int:
    """A comma-grouped integer string -> int ('20,000' -> 20000)."""
    return int(str(s).replace(",", ""))


class ParseError(RuntimeError):
    """A required number/attribution was not found in the claim's own verbatim (never guess)."""


def _claim(claims: dict, cid: str) -> dict:
    c = claims.get(cid)
    if c is None:
        raise ParseError(f"source claim {cid} not found in the sealed corpus")
    if not str(c.get("verbatim") or "").strip():
        raise ParseError(f"source claim {cid} has no verbatim to parse")
    return c


def _search(pattern: str, text: str, cid: str, what: str):
    m = re.search(pattern, text)
    if m is None:
        raise ParseError(f"{cid}: could not read {what} from verbatim (pattern {pattern!r})")
    return m


def _decades(claims: dict, books_meta: dict) -> dict:
    cid = "WAL-CLM-IMMORT-000261"
    c = _claim(claims, cid)
    v = c["verbatim"]
    # "30 - 40  35" rows: (band-low, band-high, pct)
    rows = re.findall(r"(\d+)\s*-\s*(\d+)\s+(\d+)", v)
    if len(rows) != 4:
        raise ParseError(f"{cid}: expected 4 decade rows in verbatim, found {len(rows)}")
    out_rows = [{"age": f"{lo}{DASH}{hi}", "pct": int(pct)} for (lo, hi, pct) in rows]
    pcts = [r["pct"] for r in out_rows]
    if pcts != sorted(pcts) or not all(0 < p <= 100 for p in pcts):
        raise ParseError(f"{cid}: decade percentages not ascending in 1..100: {pcts}")
    # "(Adelman, et al., 1988)" -> "Adelman et al., 1988"
    attr = _search(r"\(([A-Za-z][^)]*\d{4})\)", v, cid, "study attribution").group(1)
    attr = attr.replace(", et al", " et al").strip()
    page = c["locator"].get("page")
    if page is None:
        raise ParseError(f"{cid}: no locator.page for the decade-table cite")
    title = _short_title(books_meta, c["locator"]["book"])
    return {"source_claim_id": cid,
            "cite": f"{title}, p.{page} · after {attr}",
            "rows": out_rows}


def _stolen_years(claims: dict) -> dict:
    cid = "WAL-CLM-IMMORT-000254"
    v = _claim(claims, cid)["verbatim"]
    sh = _search(r"between (\d+) and (\d+) years", v, cid, "should-average band")
    actual = int(_search(r"around (\d+) years", v, cid, "actual average").group(1))
    st = _search(r"(\d+) to (\d+) years short", v, cid, "years-short gap")
    low, high = int(st.group(1)), int(st.group(2))
    should_low, should_high = int(sh.group(1)), int(sh.group(2))
    if not (low < high and should_low < should_high):
        raise ParseError(f"{cid}: stolen-years bands not ordered")
    return {"source_claim_id": cid, "low": low, "high": high,
            "display": f"{low}{DASH}{high} years",
            "should_low": should_low, "should_high": should_high, "actual": actual}


def _rankings(claims: dict, books_meta: dict) -> dict:
    cid = "WAL-CLM-IMMORT-000262"
    c = _claim(claims, cid)
    v = c["verbatim"]
    years = [int(y) for y in re.findall(r"\b(19\d\d|20\d\d)\b", v)]
    ranks = [int(r) for r in re.findall(r"\b(\d+)(?:st|nd|rd|th)\b", v)]
    if not (len(years) == len(ranks) == 4):
        raise ParseError(f"{cid}: expected 4 year/rank pairs, found {len(years)} years {len(ranks)} ranks")
    if years != sorted(years) or ranks != sorted(ranks):
        raise ParseError(f"{cid}: year/rank progression not ascending: {years} {ranks}")
    if "CDC" not in v or "WHO" not in v:
        raise ParseError(f"{cid}: CDC/WHO attribution not present in verbatim")
    page = c["locator"].get("page")
    if page is None:
        raise ParseError(f"{cid}: no locator.page for the rankings cite")
    title = _short_title(books_meta, c["locator"]["book"])
    return {"source_claim_id": cid,
            "cite": f"{title}, p.{page} · CDC / WHO longevity rankings",
            "points": [{"year": y, "rank": r} for y, r in zip(years, ranks)]}


def _target(claims: dict) -> dict:
    cid = "WAL-CLM-IMMORT-000238"
    v = _claim(claims, cid)["verbatim"]
    base_age = int(_search(r"age of (\d+) years", v, cid, "target age").group(1))
    m = _search(r"([\d,]+) to ([\d,]+) per day", v, cid, "ORAC daily band")
    low, high = _num(m.group(1)), _num(m.group(2))
    if not low < high:
        raise ParseError(f"{cid}: ORAC band not ordered {low}/{high}")
    return {"source_claim_id": cid, "low": low, "high": high,
            "low_display": f"{low:,}", "high_display": f"{high:,}", "base_age": base_age}


def _disease(claims: dict) -> dict:
    cid = "WAL-CLM-EPIGEN-000154"
    v = _claim(claims, cid)["verbatim"]
    m = _search(r"in excess of ([\d,]+) ORAC", v, cid, "disease ORAC floor")
    val = _num(m.group(1))
    # `display` (with +) is the big side-panel number; `min_display` (no +) fills the prose.
    return {"source_claim_id": cid, "min": val, "display": f"{val:,}+", "min_display": f"{val:,}"}


def _calories(claims: dict) -> dict:
    cid = "WAL-CLM-IMMORT-000255"
    v = _claim(claims, cid)["verbatim"]
    m = _search(r"between ([\d,]+) and\s+([\d,]+) calories", v, cid, "calorie band")
    low, high = _num(m.group(1)), _num(m.group(2))
    if not low < high:
        raise ParseError(f"{cid}: calorie band not ordered {low}/{high}")
    return {"source_claim_id": cid, "low": low, "high": high,
            "display": f"{low:,}{DASH}{high:,}"}


def _payoff(claims: dict, books_meta: dict) -> dict:
    cid = "WAL-CLM-IMMORT-000259"
    c = _claim(claims, cid)
    v = c["verbatim"]
    w = _search(r"(\d+)\s*-\s*(\d+) pound", v, cid, "reference weight")
    y = _search(r"add\s+(\d+) to (\d+) additional healthful years", v, cid, "healthful-years gain")
    wl, wh = int(w.group(1)), int(w.group(2))
    yl, yh = int(y.group(1)), int(y.group(2))
    b = books_meta.get(c["locator"]["book"], {})
    cite = f"{_short_title(books_meta, c['locator']['book'])} ({b.get('year')})"
    return {"source_claim_id": cid, "cite": cite,
            "years_low": yl, "years_high": yh, "years_display": f"+{yl} to {yh} healthful years",
            "weight_low": wl, "weight_high": wh, "weight_display": f"{wl}{DASH}{wh} lb"}


def _ceiling(claims: dict, target: dict) -> dict:
    cid = "WAL-CLM-IMMORT-000260"
    v = _claim(claims, cid)["verbatim"]
    m = _search(r"to be (\d+), (\d+) or (\d+)", v, cid, "the ceiling trio")
    ceiling = int(m.group(1))  # "toward the 150" — the first of "150, 175 or 200"
    base = target["base_age"]  # 100, from the target claim's "reach the age of 100"
    if ceiling <= base:
        raise ParseError(f"{cid}: ceiling {ceiling} not above base {base}")
    return {"source_claim_id": cid, "base_claim_id": target["source_claim_id"],
            "base": base, "ceiling": ceiling, "gap": ceiling - base}


def build_data() -> dict:
    claims = _load_claims_by_id()
    books_meta = _books_meta()
    target = _target(claims)
    return {
        "_purpose": "The ORAC knowledge tab's canonical Wallach numbers (§02/§03/§08). GENERATED "
                    "by eden/tools/orac_data_derive.py — every value is parsed from a sealed claim's "
                    "byte-faithful verbatim (dose is null on all), so no ORAC number is hand-typed in a "
                    "view or in view-copy (R1/R3/§00.A). Framing prose lives in view-copy.json with "
                    "{placeholders}; these numbers fill them at render. Never hand-edit; run "
                    "eden/tools/build_embeds.py.",
        "decades": _decades(claims, books_meta),
        "stolen_years": _stolen_years(claims),
        "rankings": _rankings(claims, books_meta),
        "target": target,
        "disease_target": _disease(claims),
        "calories": _calories(claims),
        "payoff": _payoff(claims, books_meta),
        "ceiling": _ceiling(claims, target),
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
    print(f"OK  wrote orac-data.json ({n} B) · "
          f"decades {len(d['decades']['rows'])} rows · rankings {len(d['rankings']['points'])} pts · "
          f"target {d['target']['low_display']}-{d['target']['high_display']} · "
          f"disease {d['disease_target']['display']} · calories {d['calories']['display']} · "
          f"payoff {d['payoff']['years_display']} · ceiling {d['ceiling']['ceiling']} (gap {d['ceiling']['gap']})")
