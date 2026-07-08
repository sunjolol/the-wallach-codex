#!/usr/bin/env python3
"""nutrient_resolve.py — resolve a Product-DB substance name to the canonical registry.

Every quantified substance in the Product DB resolves to either:
  - an ESSENTIAL (one of the 91 in essentials-canon) -> feeds the coverage math, or
  - None (a BOTANICAL / ACTIVE) -> its own entry for blend/ingredient search + potency compare.

TWO layers, backed by the hand-curated registry `eden/catalog/nutrients.json` (Catalog pillar):
  - IDENTITY (`resolve`): product name -> essential slug or None. Uses the registry's
    essential_aliases (vitamin/mineral label-name -> canon slug) PLUS rules that don't need a
    table: strip L-/D-/DL-; canon mineral/amino display-name direct match; fatty-acid family by
    keyword. Unit conversion is a separate concern (amounts are already mg/mcg/g/iu).
  - CANONICAL FORM (`canonicalize`/`slug_of`): collapse label-faithful surface variants of the
    SAME botanical/active to ONE display form + slug (Ginkgo biloba/Ginkgo Biloba,
    L-glutamine/L-Glutamine, Green Tea/Green tea) via the registry's canonical_forms map, so
    aggregation + search group correctly. The products pillar stays byte-faithful to the labels;
    canonicalization lives HERE (registry layer), never lossily in-pillar.

Design note (2026-07-08): all 91 Wallach targets are currently honest gaps, so the
"% toward target" verdict awaits corpus dose mining; this resolver already enables
composition aggregation, cost-per-nutrient, and potency comparison.

CLI: `python nutrient_resolve.py report`  (validates every substance + known values +
zero remaining collisions). Exit 0 = all resolved/classified + all assertions pass.
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
CANON = json.loads((ROOT/"eden"/"corpus"/"essentials-canon.json").read_text(encoding="utf-8"))["essentials"]
REGISTRY = json.loads((ROOT/"eden"/"catalog"/"nutrients.json").read_text(encoding="utf-8"))
PRODUCTS = json.loads((ROOT/"eden"/"products"/"products.json").read_text(encoding="utf-8"))["products"]

DISPLAY2SLUG = {e["display_name"]: e["slug"] for e in CANON}
CAT = {e["slug"]: e["category"] for e in CANON}
MINERALS = {e["display_name"].lower(): e["slug"] for e in CANON if e["category"] == "mineral"}
AMINOS   = {e["display_name"].lower(): e["slug"] for e in CANON if e["category"] == "amino_acid"}

# Hand-curated judgment layers, externalized to the Catalog pillar (single source of truth):
VIT_ALIAS = REGISTRY["essential_aliases"]["vitamins"]   # product vitamin name (lower) -> canon slug
MIN_ALIAS = REGISTRY["essential_aliases"]["minerals"]   # crediting mineral name (lower) -> canon slug
CANONICAL_FORMS = REGISTRY["canonical_forms"]           # norm-key -> ONE canonical display form

# canonical unit per essential for aggregation display (standard supplement unit; trace -> mcg)
TRACE_MCG = {"selenium","chromium","iodine","molybdenum","boron","vanadium"}
def canonical_unit(slug):
    c = CAT.get(slug)
    if c == "amino_acid" or c == "fatty_acid": return "mg"
    if c == "vitamin": return {"retinol":"mcg","cholecalciferol":"mcg","phylloquinone":"mcg",
                               "cobalamin":"mcg","folate":"mcg","biotin":"mcg"}.get(slug, "mg")
    if c == "mineral": return "mcg" if slug in TRACE_MCG else "mg"
    return None

def strip_stereo(n):
    for p in ("l-", "d-", "dl-"):
        if n.startswith(p): return n[len(p):]
    return n

def fa_of(name, form):
    s = f"{name} {form or ''}".lower()
    if re.search(r'omega\s*3|alpha-linolenic|\bala\b|eicosapentaenoic|\bepa\b|docosahexaenoic|\bdha\b', s): return "omega-3"
    if re.search(r'omega\s*6|linoleic|\bla\b|gamma-linolenic|\bgla\b|arachidonic', s): return "omega-6"
    if re.search(r'omega\s*9|oleic|\boa\b', s): return "omega-9"
    return None

def _clean(name):
    """Strip trademark marks + collapse whitespace; the display-faithful cleanup."""
    n = name or ""
    for ch in "™®©": n = n.replace(ch, "")
    return re.sub(r'\s+', ' ', n).strip()

def _norm(name):
    """Lookup key for canonical_forms: lowercase, drop punctuation, hyphen->space, collapse ws.
    Every surface variant of the same substance normalizes to the same key."""
    n = (name or "").lower()
    for ch in "™®©.,": n = n.replace(ch, "")
    return re.sub(r'\s+', ' ', n.replace("-", " ")).strip()

def resolve(name, form=None):
    """Return an essential slug, or None if the substance is a botanical/active."""
    if not name: return None
    n = _clean(name).lower()
    fa = fa_of(name, form)
    if fa: return fa
    if n in VIT_ALIAS: return VIT_ALIAS[n]
    if n in MINERALS: return MINERALS[n]
    if n in MIN_ALIAS: return MIN_ALIAS[n]
    a = strip_stereo(n).split(" ")[0].strip()
    if a in AMINOS: return AMINOS[a]
    return None

def canonicalize(name):
    """Collapse a label-faithful surface form to its ONE canonical display form.
    Non-colliding names keep their (cleaned) authored form."""
    if not name: return name
    return CANONICAL_FORMS.get(_norm(name), _clean(name))

def slug_of(name):
    """kebab slug of the canonical display form (botanical/active search-registry key)."""
    s = canonicalize(name).lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

# ---------------- report / self-test ----------------
def _iter_substances():
    """Yield (name, form, amount, unit) over every quantified substance in the pillar."""
    for pid, r in PRODUCTS.items():
        for c in r["components"]:
            for n in c.get("nutrients", []):
                yield pid, (n.get("name"), n.get("form"), n.get("amount"), n.get("unit"))
            for b in c.get("blends", []):
                for ing in b.get("ingredients", []):
                    yield pid, (ing.get("name"), ing.get("form"), ing.get("amount"), ing.get("unit"))
                    for s in ing.get("sub_ingredients", []) or []:
                        yield pid, (s.get("name"), s.get("form"), s.get("amount"), s.get("unit"))

def report():
    from collections import defaultdict
    ess_cov = defaultdict(lambda: {"amt": {}, "noamt": set()})
    botanicals = defaultdict(int)   # keyed by CANONICAL form (collapsed)
    for pid, (name, form, amt, unit) in _iter_substances():
        slug = resolve(name, form)
        if slug:
            if amt is not None: ess_cov[slug]["amt"].setdefault(pid, f"{amt}{unit}")
            else: ess_cov[slug]["noamt"].add(pid)
        elif name:
            botanicals[canonicalize(name)] += 1

    hit = sum(1 for s in DISPLAY2SLUG.values() if ess_cov[s]["amt"] or ess_cov[s]["noamt"])
    with_amt = sum(1 for s in DISPLAY2SLUG.values() if ess_cov[s]["amt"])
    print(f"essentials touched: {hit}/91 | with a usable amount: {with_amt}/91 | distinct botanicals (canonical): {len(botanicals)}")

    # zero-collision proof: no two DISTINCT canonical forms share a normalized key
    by_key = defaultdict(set)
    for canon in botanicals: by_key[_norm(canon)].add(canon)
    collisions = {k: v for k, v in by_key.items() if len(v) > 1}

    # known-value assertions (identity + canonicalization + amounts hand-verified vs labels)
    checks = [
        ("Vitamin A -> vitamin-a", resolve("Vitamin A") == "vitamin-a"),
        ("Thiamin -> vitamin-b1", resolve("Thiamin") == "vitamin-b1"),
        ("Vitamin B6 -> vitamin-b6", resolve("Vitamin B6") == "vitamin-b6"),
        ("Folic Acid -> vitamin-b9", resolve("Folic Acid") == "vitamin-b9"),
        ("L-Arginine -> arginine", resolve("L-Arginine") == "arginine"),
        ("Taurine -> taurine", resolve("Taurine") == "taurine"),
        ("Silicon -> silica", resolve("Silicon") == "silica"),
        ("Phosphorous -> phosphorus", resolve("Phosphorous") == "phosphorus"),
        ("Vitamin K2 -> vitamin-k", resolve("Vitamin K2") == "vitamin-k"),
        ("ALA(form Omega 3) -> omega-3", resolve("Alpha-Linolenic Acid (ALA)", "Omega 3") == "omega-3"),
        ("EPA -> omega-3", resolve("EPA") == "omega-3"),
        ("PABA -> botanical(None)", resolve("PABA") is None),
        ("Caffeine -> botanical(None)", resolve("Caffeine") is None),
        ("CoQ10 -> botanical(None)", resolve("CoQ10") is None),
        ("Taurine amount in rebound-fx-citrus-punch = 200mg",
         ess_cov["taurine"]["amt"].get("rebound-fx-citrus-punch") == "200mg"),
        ("canon: 'Ginkgo Biloba' -> 'Ginkgo biloba'", canonicalize("Ginkgo Biloba") == "Ginkgo biloba"),
        ("canon: 'Green tea' -> 'Green Tea'", canonicalize("Green tea") == "Green Tea"),
        ("canon: 'L-glutamine' -> 'L-Glutamine'", canonicalize("L-glutamine") == "L-Glutamine"),
        ("canon: 'Saccharomyces Boulardii' -> 'Saccharomyces boulardii'",
         canonicalize("Saccharomyces Boulardii") == "Saccharomyces boulardii"),
        ("slug: 'Grape seed' -> 'grape-seed'", slug_of("Grape seed") == "grape-seed"),
        ("ZERO remaining botanical collisions", len(collisions) == 0),
    ]
    ok = True
    print("\nknown-value checks:")
    for label, passed in checks:
        print(f"  [{'PASS' if passed else 'FAIL'}] {label}")
        ok = ok and passed

    if collisions:
        print("\n!! REMAINING COLLISIONS (should be none):")
        for k, v in collisions.items(): print(f"  [{k}] {sorted(v)}")

    print(f"\nbotanicals/actives (top 40 — scan for any MISSED essential):")
    for nm, cnt in sorted(botanicals.items(), key=lambda x: -x[1])[:40]:
        print(f"  {cnt:>3}  {nm}")

    return 0 if ok else 1

if __name__ == "__main__":
    sys.exit(report())
