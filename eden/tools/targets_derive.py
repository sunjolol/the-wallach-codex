#!/usr/bin/env python3
"""targets_derive.py — per-essential Wallach coverage targets.

Generates dashboard/assets/data/essentials-targets-data.json — the DB the Coverage
surface reads to answer "how much of each of the 90 essentials does the regimen cover."

THE RULE (§00.A): every numeric target is a Wallach maintenance dose,
sourced ONLY from Wallach's BOOKS. A target-eligible dose is a DAILY / MAINTENANCE dose
(the "supplement program" / "base line" / "true supplement need" tables + any general
daily dose). Disease-specific therapeutic doses are excluded.

POLICY, layered on top of the source rule:
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
     value is preserved in `range` + `provenance` (§00.B: the transform is auditable).
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
constants, and byte-compares the re-derived value to the posted number — the provenance stamp
exists for exactly this.
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
VEHICLES_PATH = ROOT / "dashboard" / "assets" / "data" / "trace-mineral-vehicles.json"

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


def _collective_doses(claims: list) -> dict:
    """slug -> the COLLECTIVE dose record covering it (one shared budget, not a per-slug amount).

    THE BUG THIS EXISTS TO PREVENT. Wallach states ONE amount for a
    CATEGORY: "Essential fatty acids ... supplemented at the rate of 9 grams per day in
    capsule form" (DDDL 3e 2011, WAL-CLM-DDDL-000115). That claim maps BOTH omega-3 and
    omega-6, because his EFAs ARE those two ("only two (linoleic and linolenic) are
    designated as Essential Fatty Acids"). Fanned out per-slug by _maintenance_doses, one
    9 g claim posts 9 g to omega-3 AND 9 g to omega-6 -- an 18 g board target from a 9 g
    source. amounts_wallach_only certifies that GREEN: both targets trace to a real sealed
    Wallach claim and both recompute exactly from the documented chain, so a gate that audits
    each essential in isolation is blind to it by construction.

    THE MARKER IS A FACT ABOUT THE CLAIM, NOT A MODELLING FLAG: dose.collective_group
    records that Wallach's amount applies to the named group AS A WHOLE. A second, DIFFERENT
    fact is dose.applies_to: the claim maps several essentials but the AMOUNT is only one of
    theirs. Hence explicit markers rather than "any dose mapping >1 essential".

    ★ WHY dose.applies_to EXISTS -- THE COBALT/B12 TRAP. It is tempting to read the
    cobalt/vitamin-b12 dose (WAL-CLM-IMMORT-000084, "250-400 mcg") as a non-collective dose
    that merely maps two slugs because ONE substance carries two names. THAT PREMISE IS FALSE,
    and acting on it fanned a B12 dose onto cobalt as a 400 mcg ELEMENTAL cobalt target for
    weeks under a green board. Cobalt is an ATOM INSIDE a MOLECULE -- Wallach writes that a
    single cobalt atom is the central metal component of vitamin B12 (Immortality) -- a
    PART-OF relation, not the IDENTITY relation "two names for one substance". 400 mcg of B12
    carries ~4% of that mass as cobalt, not 400 mcg.
    THE PROOF IT IS A B12 NUMBER, from Wallach's own dose table (Epigenetics): the VITAMIN
    section carries "Vitamin B12 (methylcobalamin) 400 mcg" while the MINERAL section lists 14
    minerals with NO COBALT ROW. The RDA he contrasts it against ("3 to 4 mcg") is the B12 RDA
    -- there is no cobalt RDA -- and the claim's own verbatim closes "supplement with the
    optimum levels of B12". No book states an elemental cobalt amount (all 7 swept).
    Both claims now carry dose.applies_to = ["vitamin-b12"], so the amount reaches B12 alone.
    Full evidence: chronicle/contradictions/2026-07-15-cobalt-elemental-vs-b12.md

    The shared budget is NOT a per-essential target and never becomes one here; it is
    projected into its own group artifact (the pdm-coverage-data.json shape), whose goal
    carries its own independently-recomputing gate. Enforced by
    collective_doses_not_fanned -- a mechanism ships with its gate.
    """
    out = {}
    for c in claims:
        if c.get("kind") != "dose":
            continue
        dz = c.get("dose") or {}
        group = dz.get("collective_group")
        if not group or dz.get("amount") is None:
            continue
        for slug in c.get("essentials", []):
            out[slug] = {"id": c["id"], "group": group, "book": c["locator"]["book"]}
    return out


def _maintenance_doses(claims: list, books_meta: dict) -> dict:
    """slug -> list of maintenance dose records (parsed range + year + form + per_bw).

    Collective doses (dose.collective_group) are EXCLUDED: one shared budget must never be
    fanned into an independent per-essential number. See _collective_doses.

    dose.applies_to NARROWS the fan: when present, the amount reaches ONLY the listed slugs.
    A claim may legitimately be ABOUT several essentials while stating a number for just one
    of them -- Wallach's "B12/cobalt" passages are the case that forced this (the claim is his
    richest cobalt text AND its 250-400 mcg is a B12 dose). Without this, mapping == dosing,
    and the only way to stop the fan would be to delete cobalt's mapping and with it the
    content on cobalt's page. See the docstring above for the proof and the evidence doc.
    """
    out = collections.defaultdict(list)
    for c in claims:
        if c.get("kind") != "dose":
            continue
        dz = c.get("dose") or {}
        if dz.get("amount") is None:
            continue
        if dz.get("collective_group"):
            continue
        pr = _cond_priority(dz.get("for_condition"))
        if pr is None:
            continue
        low, high = _parse_amount(dz.get("amount"))
        if low is None:
            continue
        year = (books_meta.get(c["locator"]["book"], {}) or {}).get("year") or 0
        applies = dz.get("applies_to")
        for slug in c.get("essentials", []):
            if applies is not None and slug not in applies:
                continue  # the claim maps this essential, but the NUMBER is not its number
            out[slug].append({
                "id": c["id"], "book": c["locator"]["book"], "year": year,
                "low": low, "high": high, "unit": dz.get("unit"),
                "form": dz.get("form"), "per_bw": dz.get("per_body_weight"),
                "priority": pr,
            })
    return out


# Essentials that post the LOWER end of Wallach's stated range instead of the upper.
# BOTH ends are Wallach's own numbers from the same sealed claim, so this is a choice WITHIN the
# source rule, not an exception to it — the posted figure still traces to his book and his range.
# Keep this dict tiny and always give the reason: it is the only place the "post the upper" policy
# bends, and an unexplained entry here would read as drift.
# The VALUE is a short stable token, because this dict's output ships into a fact field and
# prose_contained (R4) rightly refuses prose there. The full reasoning lives in the comment on
# each entry — in the generator, which is where someone asking "why is this one different?" looks.
LOWER_OF_RANGE = {
    # Wallach states 1,000-5,000 mg (WAL-CLM-EPIGEN-000126). The 5,000 upper is unreachable by any
    # combination of catalog products: the best single source carries 100 mg and all four stacked
    # reach 143 mg — 2.9% of it — so the tile could never leave 'gap' and the board would be posting
    # a target no user could act on. The 1,000 lower end is Wallach's OWN figure from the SAME
    # range, so the posted number still traces to his book. Owner-ratified 2026-08-20.
    "flavonoids": "upper-unreachable-by-any-catalog-combination",
}


# ── CEILING, NOT A TARGET ────────────────────────────────────────────────────────
# The essential's only stated number is what Wallach says you CAN take, not what he says you
# NEED. Posting such a figure as a daily target makes the board demand a number he never asked
# anyone to reach — and then reads the shortfall back as a deficiency. That is a §00.A defect of
# ROLE, not of value: the number is genuinely his, in the wrong column.
#
# SILVER is the only case, and the evidence is threefold:
#   1. His one sentence is a TOLERANCE: "Humans can consume 400 mcg of silver per day"
#      (WAL-CLM-DDDL-000013, Dead Doctors Don't Lie 3e 2011; printed identically in Immortality
#      2008, WAL-CLM-IMMORT-000027). "Can consume", never "requires" — and he puts his own
#      following word "deficiency" in scare quotes.
#   2. SILVER HAS NO ROW in the Base Line Nutritional Supplement Program. That True Supplement
#      Need table IS the source of tin's 500 mcg, sulphur's 500 mg and sodium's 3,300 mg. Its
#      absence is not an OCR drop: WAL-CLM-LETS-000064 prints RIBOFLAVIN and SELENIUM adjacent,
#      so alphabetically nothing sits between them.
#   3. The NEWEST book denies the requirement outright: silver "is not required by any known
#      biological system" (WAL-CLM-EPIGEN-000064, Epigenetics 2014). He counts it essential for
#      its disinfectant and immune-stimulant role, not as an enzymatic need.
# The only quantitative caution he attaches to silver is the UPPER end — argyria on chronic
# overdose — which is exactly what a ceiling is for.
#
# The kind becomes dietary_with_clinical_lever WITH NO `low`, which is how state/coverage.ts
# already scores taurine: covered on a genuine source, no threshold. The figure is NOT deleted —
# it stays on the target as `ceiling` so the page can show what Wallach actually said.
# Like LOWER_OF_RANGE above, the VALUE is a short stable token because it ships into a fact
# field and prose_contained (R4) refuses prose there; the reasoning lives in this comment.
CEILING_NOT_TARGET = {
    "silver": "stated-as-safe-intake-not-a-requirement",
}


def _convert(slug: str, d: dict):
    """Apply end-of-range choice -> IU conversion -> weight-scaling -> rounding.
    Returns (value, unit_out, provenance)."""
    upper = d["high"] if d["high"] is not None else d["low"]
    prov = {"original_low": d["low"], "original_high": d["high"],
            "original_unit": d["unit"]}
    if slug in LOWER_OF_RANGE and d["low"] is not None:
        taken = d["low"]
        prov["lower_taken"] = taken
        prov["lower_taken_reason"] = LOWER_OF_RANGE[slug]
    else:
        taken = upper
        prov["upper_taken"] = taken
    upper = taken  # everything downstream scales the CHOSEN end of the range
    value, unit_out = taken, d["unit"]
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


def _vehicle_supplied(claim_ids: set) -> dict:
    """slug -> the claim ids proving Wallach names the plant-derived vehicle as its route.

    The JUDGMENT is hand-authored in trace-mineral-vehicles.json (one home, R1); this only
    reads it and REFUSES on a citation that does not resolve to a sealed claim. That check is
    the whole point: without it an entry here would be an unfalsifiable green -- the exact
    failure mode the 2026-08-20 contradiction file warned about ("no gate could ever catch
    that being wrong"). A dangling id must stop the build, never be skipped."""
    cfg = json.loads(VEHICLES_PATH.read_text(encoding="utf-8")).get("vehicle_supplied", {})
    out = {}
    for slug, entry in cfg.items():
        if slug.startswith("_"):
            continue
        ids = list(entry.get("claim_ids") or [])
        if not ids:
            raise SystemExit(f"targets_derive: vehicle_supplied[{slug}] cites no claim")
        missing = [i for i in ids if i not in claim_ids]
        if missing:
            raise SystemExit(f"targets_derive: vehicle_supplied[{slug}] cites unknown claim(s) {missing}")
        out[slug] = ids
    return out


def build_data() -> dict:
    canon = json.loads((CORPUS / "essentials-canon.json").read_text(encoding="utf-8"))["essentials"]
    claims = _load_claims()
    books_meta = {b["book_id"]: b for b in
                  json.loads((CORPUS / "books-meta.json").read_text(encoding="utf-8"))["books"]}
    doses = _maintenance_doses(claims, books_meta)
    collective = _collective_doses(claims)
    vehicle_supplied = _vehicle_supplied({c["id"] for c in claims})

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
            # A stated SAFE INTAKE is not a target — see CEILING_NOT_TARGET. Dropping `low`
            # is what changes the verdict: with no numeric floor, classify's
            # dietary_with_clinical_lever branch covers on a genuine source instead of
            # measuring against a number Wallach never asked for. The figure is KEPT as
            # `ceiling` — this reclassifies what he said, it does not hide it.
            if slug in CEILING_NOT_TARGET:
                target["ceiling"] = target.pop("low")
                target["kind"] = "dietary_with_clinical_lever"
                target["ceiling_reason"] = CEILING_NOT_TARGET[slug]
                target["source"] = (f"Wallach — {_book_display(books_meta, p0['book'])} — a stated "
                                    f"safe intake, not a required amount")
            if parts:
                target["parts"] = parts
            # VEHICLE-SUPPLIED: Wallach names the plant-derived vehicle as this essential's
            # supply route in his own words. The numeric target above STAYS -- this is an
            # additional route, so state/coverage.ts takes the better of the two verdicts.
            if slug in vehicle_supplied:
                target["vehicle_supplied"] = True
                target["vehicle_claim_ids"] = vehicle_supplied[slug]
            if others:
                target["other_claims"] = [{
                    "claim_id": d["id"], "book": d["book"], "year": d["year"],
                    "low": d["low"], "high": d["high"], "unit": d["unit"],
                    "source": _book_display(books_meta, d["book"]),
                } for d in others]
        elif slug in collective:
            # Wallach DID state an amount, but for the GROUP as a whole — so this
            # essential has no number of its own and the honest-gap wording below would
            # be a lie. NO numeric `low` is emitted here ON PURPOSE: the shared budget
            # lives in the group artifact under its own gate, and a number posted here
            # would be the 18 g fan-out this branch exists to prevent.
            cg = collective[slug]
            target = {
                "kind": "wallach_collective",
                "collective_group": cg["group"],
                "source_claim_id": cg["id"],
                "source": f"Wallach — {_book_display(books_meta, cg['book'])} — one shared amount "
                          f"for the {cg['group'].replace('-', ' ')} group, not a per-essential amount",
            }
        else:
            kind = e.get("coverage_kind", "unspecified")
            target = {
                "kind": kind,
                "source": "Wallach framework — no maintenance amount stated (honest gap; blueprint §7.1)",
            }
            if kind == "mirrors":
                # This essential states NO amount of its own and never will: Wallach's
                # position is that its requirement is met through ANOTHER essential. So it
                # posts no number (nothing to invent) and inherits that essential's verdict.
                # The routing is the canon's (a MODELLING field -- trace_pdm / dietary /
                # unspecified are our vocabulary, not Wallach's words), so the pillar owns it
                # and no slug is hardcoded here. Gated by mirrors_resolve.
                target["mirrors_slug"] = e["mirrors_slug"]
                target["source"] = (
                    "Wallach framework — no separate amount is stated for this essential; "
                    "his position is that the requirement is met through "
                    f"{e['mirrors_slug'].replace('-', ' ')}, so it carries that verdict"
                )

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
