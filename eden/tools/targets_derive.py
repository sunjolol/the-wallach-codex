#!/usr/bin/env python3
"""targets_derive.py — per-essential Wallach coverage targets (Phase C2 / the poison purge).

Generates dashboard/assets/data/essentials-targets-data.json — the DB the Coverage
surface reads to answer "how much of each of the 90 essentials does the regimen
cover." This is the artifact that carried the poison: its numeric targets used to
be sourced from Youngevity product labels (Healthy Body Start Pak component sums),
which R2 forbids — Youngevity may never define a recommended amount.

THE RULE (Charter R2 / §00.A): every numeric target here is a Wallach maintenance
dose, sourced ONLY from Wallach's BOOKS (no lectures/transcripts — Luneth 2026-07-05).
A target-eligible dose is a Wallach DAILY / MAINTENANCE dose — his "Base Line
Nutritional Supplement Program" table (Let's Play Doctor Fig. 8-1, the True Supplement
Need column) plus any general/maintenance daily dose stated in another book. It EXCLUDES
disease-specific therapeutic doses (herpes lysine, keshan selenium, cataracts arginine) —
those stay in the corpus for the Knowledge/protocol surfaces, never a coverage target.
When an essential has several eligible doses from DIFFERENT books, the NEWEST
book's number wins (Luneth 2026-07-05: always favor Wallach's most recent stated
daily amount — e.g. Potassium uses Immortality 2008's 5,000 mg, not Let's Play
Doctor 1995's 5,500 mg); ties within a year break to the Base Line table. Each numeric
target carries its source_claim_id → a real sealed claim. Essentials with NO Wallach
daily dose show no number (an honest gap, blueprint §7.1); nothing is invented.

WHAT COMES FROM WHERE:
  - STRUCTURE (name=layout_key, category, order) → eden/corpus/essentials-canon.json (pillar).
  - NUMERIC TARGET (low/high/unit + source_claim_id) → sealed corpus dose claims (pillar).
  - CITATION source string → composed from books-meta.json (never hand-typed).
  - coverage_kind (how Wallach covers a NON-numeric essential: trace_pdm, dietary,
    dietary_with_clinical_lever, unspecified) → eden/corpus/essentials-canon.json (the
    essentials pillar). Re-homed there in Phase D-b (2026-07-05); the old transitional
    knowledge/essentials-targets.json hand-file was deleted with its dead poison stances.

The "WALLACH SAYS" stance layer is DROPPED here (Luneth 2026-07-05): the old hand-file
stances carried lecture citations, Youngevity-sourced stances, and hand-typed cites
(the poison). A per-essential stance will be re-authored MANUALLY once every book is
mined; the Knowledge deep-dive shows the clean sealed corpus claims meanwhile.

amounts_wallach_only (the gate shipped with this) proves every numeric low here
resolves to a Wallach dose claim, so the poison can never creep back.
"""
import collections
import json
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

# for_condition -> target priority (lower = preferred). None => disease-specific
# therapeutic dose (NOT a maintenance target). A bare/empty condition is a general
# daily dose (priority 3).
_COND_MARKERS = [
    ("base-line", 0), ("base line", 0), ("true supplement need", 0), ("supplement program", 0),
    ("daily maintenance", 1),
    ("maintenance", 2),
]


def _cond_priority(cond):
    if cond is None or str(cond).strip() == "":
        return 3
    c = str(cond).lower()
    for marker, rank in _COND_MARKERS:
        if marker in c:
            return rank
    return None


def _load_claims() -> list:
    claims = []
    for shard in sorted((CORPUS / "claims").glob("claims-*.json")):
        claims += json.loads(shard.read_text(encoding="utf-8")).get("claims", [])
    return claims


def _target_doses(claims: list, books_meta: dict) -> dict:
    """slug -> the best Wallach daily/maintenance dose claim (amount/unit + id).

    Ranked NEWEST BOOK FIRST (Luneth: always favor Wallach's most recent stated
    daily number); within a year the Base Line table wins, then id. Therapeutic
    disease-specific doses are excluded entirely."""
    cand = collections.defaultdict(list)
    for c in claims:
        if c.get("kind") != "dose":
            continue
        dz = c.get("dose") or {}
        if dz.get("amount") is None:
            continue
        pr = _cond_priority(dz.get("for_condition"))
        if pr is None:
            continue
        year = (books_meta.get(c["locator"]["book"], {}) or {}).get("year") or 0
        for slug in c.get("essentials", []):
            cand[slug].append((pr, -year, c["id"], c))
    out = {}
    for slug, lst in cand.items():
        # NEWEST book first (x[1] = -year), then base-line-priority, then id.
        lst.sort(key=lambda x: (x[1], x[0], x[2]))
        _pr, _ny, cid, c = lst[0]
        dz = c.get("dose") or {}
        out[slug] = {"amount": dz.get("amount"), "unit": dz.get("unit"),
                     "period": dz.get("period"), "claim_id": cid,
                     "book": c["locator"]["book"],
                     "for_condition": dz.get("for_condition")}
    return out


def _parse_amount(a):
    if isinstance(a, (int, float)):
        return float(a), None
    if isinstance(a, str):
        m = re.match(r"\s*([\d.]+)\s*[-–]\s*([\d.]+)", a)
        if m:
            return float(m.group(1)), float(m.group(2))
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


def build_data() -> dict:
    """Deterministic projection of the pillars into the coverage targets DB."""
    canon = json.loads((CORPUS / "essentials-canon.json").read_text(encoding="utf-8"))["essentials"]
    claims = _load_claims()
    books_meta = {b["book_id"]: b for b in
                  json.loads((CORPUS / "books-meta.json").read_text(encoding="utf-8"))["books"]}
    targets = _target_doses(claims, books_meta)

    essentials = []
    for e in canon:
        slug = e["slug"]
        name = e["layout_key"]
        category = CAT_MAP.get(e["category"], "minerals")

        t = targets.get(slug)
        if t is not None:
            low, high = _parse_amount(t["amount"])
            cond = t.get("for_condition") or "daily dose"
            target = {
                "kind": "wallach",
                "low": low,
                "unit": t["unit"],
                "period": t.get("period") or "daily",
                "source_claim_id": t["claim_id"],
                "source": f"Wallach — {_book_display(books_meta, t['book'])}: {cond}",
            }
            if high is not None:
                target["high"] = high
        else:
            # coverage_kind lives on the essentials-canon pillar (Phase D-b) — the
            # per-essential classification of how Wallach covers a NON-numeric
            # essential (trace_pdm / dietary / dietary_with_clinical_lever /
            # unspecified). Already normalized at the pillar, so read it directly.
            target = {
                "kind": e.get("coverage_kind", "unspecified"),
                "source": "Wallach framework — no maintenance amount stated (honest gap; blueprint §7.1)",
            }

        essentials.append({"name": name, "category": category, "target": target})

    return {
        "_purpose": "Per-essential Wallach coverage targets. GENERATED by eden/tools/targets_derive.py "
                    "from essentials-canon + sealed corpus dose claims (numeric targets are Wallach-only, "
                    "books-only, R2). No stance layer (dropped 2026-07-05). Never hand-edit; run "
                    "eden/tools/build_embeds.py.",
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
