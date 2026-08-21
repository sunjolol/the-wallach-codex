#!/usr/bin/env python3
"""corpus_derive.py — claims/* -> indices/* (pure, deterministic).

The five indices are NOT hand-edited; they are regenerated here and byte-compared
by corpus_verify.py (check #8), so an index can never silently drift from the claim
graph. Every list is sorted and every map is built in a stable order, so a re-derive
is byte-identical.

Index files are pure top-level maps (slug -> entry), except consistency.json which is
a list — matching eden/corpus/SCHEMA.md and the verifier's check #4 (other-substances
top-level keys must be disjoint from the canon slugs).
"""
import json
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
CORPUS = ROOT / "eden" / "corpus"
CANON_PATH = CORPUS / "essentials-canon.json"
sys.path.insert(0, str(Path(__file__).resolve().parent))
import catalog  # noqa: E402  (Catalog pillar: condition/symptom display names single-sourced)

INDEX_NAMES = ["essentials", "other-substances", "conditions", "symptoms", "consistency"]

# claim.kind -> the role bucket it plays inside a condition entry
COND_ROLE = {
    "mechanism": "causes", "protocol": "protocols", "dose": "doses",
    "prognosis": "prognosis", "personal_anecdote": "anecdotes",
    "deficiency_sign": "deficiency_signs", "toxicity_sign": "toxicity_signs", "prevalence": "prevalence",
    "quote": "quotes", "definition": "definitions", "interaction": "interactions",
    "contraindication": "contraindications", "diagnostic_pattern": "diagnostics",
    "food_source": "food_sources",
}


def humanize(slug: str) -> str:
    """Deterministic slug -> Title Case. Used for other-substances (not catalogued)
    and as the fallback for any condition/symptom slug not yet registered in the
    Catalog pillar. Curated condition/symptom display names live in the catalog
    (single source); e.g. "pms" -> "Premenstrual Syndrome (PMS)" is carried there,
    not here."""
    return slug.replace("_", " ").replace("-", " ").title()


def _load_claims(shards):
    claims = []
    for s in shards:
        data = json.loads(Path(s).read_text(encoding="utf-8"))
        claims.extend(data.get("claims", []))
    return claims


def _by_kind(rel):
    out = {}
    for c in rel:
        out.setdefault(c["kind"], []).append(c["id"])
    return {k: sorted(v) for k, v in sorted(out.items())}


def derive_indices(shards):
    """Map index-name -> index object, derived purely from the claim shards."""
    claims = _load_claims(shards)
    # NO TIER FILTER HERE, deliberately. Search is not a separate silo -- it pulls from the
    # same three homes as every tab (essentials, conditions, explore). So every claim with an
    # operational essentials[]/conditions[]/symptoms[] mapping feeds these indices (which
    # drive "The Full Record" on each page); the enriched subset is layered on top as "Worth
    # Knowing". No claim is hidden by a tag.
    canon = json.loads(CANON_PATH.read_text(encoding="utf-8"))["essentials"]

    # ---- essentials index: every canon entry (91: the 90 essentials + omega-9), in canon order ----
    essentials = {}
    for ce in canon:
        slug = ce["slug"]
        rel = [c for c in claims if slug in c.get("essentials", [])]
        defsigns = sorted(
            ({"sign": sym, "claim_id": c["id"], "confidence": c.get("confidence", "medium")}
             for c in rel if c["kind"] == "deficiency_sign" for sym in c.get("symptoms", [])),
            key=lambda d: (d["sign"], d["claim_id"]),
        )
        essentials[slug] = {
            "display_name": ce["display_name"],
            "canon_slug": slug,
            "category": ce["category"],
            "claim_count": len(rel),
            "claims_by_kind": _by_kind(rel),
            "deficiency_signs": defsigns,
            "conditions_treated": sorted({x for c in rel for x in c.get("conditions", [])}),
            "interacts_with": sorted({e for c in rel for e in c.get("essentials", []) if e != slug}),
            "books_cited": sorted({c["locator"]["book"] for c in rel}),
        }

    # ---- other-substances: top-level slug map, disjoint from canon ----
    other = {}
    for slug in sorted({s for c in claims for s in c.get("other_substances", [])}):
        rel = [c for c in claims if slug in c.get("other_substances", [])]
        other[slug] = {
            "display_name": catalog.nutrient_display(slug) or humanize(slug),
            "claim_count": len(rel),
            "claims_by_kind": _by_kind(rel),
            "conditions_treated": sorted({x for c in rel for x in c.get("conditions", [])}),
            "books_cited": sorted({c["locator"]["book"] for c in rel}),
        }

    # ---- conditions: condition slug -> roles ----
    conditions = {}
    for slug in sorted({x for c in claims for x in c.get("conditions", [])}):
        rel = [c for c in claims if slug in c.get("conditions", [])]
        roles = {}
        for c in rel:
            roles.setdefault(COND_ROLE.get(c["kind"], c["kind"]), []).append(c["id"])
        conditions[slug] = {
            "display_name": catalog.condition_display(slug) or humanize(slug),
            "claim_count": len(rel),
            "claims_by_role": {k: sorted(v) for k, v in sorted(roles.items())},
            "essentials_involved": sorted({e for c in rel for e in c.get("essentials", [])}),
            "other_substances_involved": sorted({e for c in rel for e in c.get("other_substances", [])}),
            "books_cited": sorted({c["locator"]["book"] for c in rel}),
        }

    # ---- symptoms: symptom slug -> likely deficiencies ----
    symptoms = {}
    for slug in sorted({x for c in claims for x in c.get("symptoms", [])}):
        rel = [c for c in claims if slug in c.get("symptoms", [])]
        likely = sorted(
            ({"essential": e, "claim_id": c["id"], "confidence": c.get("confidence", "medium"),
              "appears_in_books": 1}
             for c in rel for e in c.get("essentials", [])),
            key=lambda d: (d["essential"], d["claim_id"]),
        )
        symptoms[slug] = {
            "display_name": catalog.symptom_display(slug) or humanize(slug),
            "claim_count": len(rel),
            "likely_deficiencies": likely,
            "books_cited": sorted({c["locator"]["book"] for c in rel}),
        }

    # ---- consistency: claims sharing (essentials, conditions, kind) signature ----
    sig_map = defaultdict(list)
    for c in claims:
        sig = (tuple(sorted(c.get("essentials", []))), tuple(sorted(c.get("conditions", []))), c["kind"])
        sig_map[sig].append(c)
    consistency = []
    for n, sig in enumerate(sorted(sig_map.keys()), 1):
        group = sig_map[sig]
        if len(group) < 2:
            continue
        reps = sorted(({"claim_id": g["id"], "book": g["locator"]["book"]} for g in group),
                      key=lambda d: d["claim_id"])
        consistency.append({
            "id": f"CG-{len(consistency) + 1:04d}",
            "essentials": list(sig[0]),
            "conditions": list(sig[1]),
            "kind": sig[2],
            "repetitions": reps,
            "books_repeating": len({g["locator"]["book"] for g in group}),
            "claim_count": len(group),
        })

    return {
        "essentials": essentials,
        "other-substances": other,
        "conditions": conditions,
        "symptoms": symptoms,
        "consistency": consistency,
    }


if __name__ == "__main__":
    import sys
    shards = sorted((CORPUS / "claims").glob("claims-*.json"))
    out = derive_indices(shards)
    for name in INDEX_NAMES:
        obj = out[name]
        n = len(obj)
        print(f"  {name:18} {n} entr{'y' if n == 1 else 'ies'}")
    sys.exit(0)
