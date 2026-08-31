#!/usr/bin/env python3
"""foods_composition_derive.py -- the FOOD half of the coverage recommender.

Generates dashboard/assets/data/foods-composition-data.json -- every per-serving nutrient
amount the Regimen and Coverage tabs display under the FOOD SOURCES rule, plus the byte-exact
extract eden/foods/extract/*.csv that lets the composition gate run on a fresh clone with no
6 MB download.

WHERE THE NUMBERS COME FROM, and why that is allowed (SOURCE RULE, section 00.A)
-------------------------------------------------------------------------------
Every AMOUNT, DOSE, RANGE, DAILY TARGET, DEFICIENCY SIGN and HEALTH CLAIM in this app is
Dr. Wallach's. That is unchanged here and this generator adds none of them: it reads its
denominators straight out of essentials-targets-data.json, which is itself gated by
`amounts_wallach_only`.

What a food-composition source supplies is COMPOSITION -- what a food CONTAINS, and what a
household portion WEIGHS. Composition is a NUMERATOR. It occupies exactly the role a
Youngevity label already occupies in the product half of the same arithmetic.

Ruled admissible by Luneth on 2026-08-21 (chronicle/contradictions/2026-08-21-usda-food-
composition-third-source.md), on three grounds recorded there:
  1. Section 00.A's subject is amounts/doses/targets/signs/claims. A food's composition is
     none of those.
  2. Wallach HIMSELF quantifies foods in USDA units -- cashews at 20% of the USDA RDA for
     magnesium, pistachios 25% B6, 24 hazelnuts 90% manganese (Hell's Kitchen) -- and cites
     USDA food tables by name (Immortality: "a USDA vitamin-A food table"; a USDA database
     comparing common foods 1975 vs 2004).
  3. This project ALREADY ships a USDA per-food table on his citation: the 277-food ORAC list
     (eden/tools/orac_foods_derive.py).
This app is in fact STRICTER than his own text: he measures those foods against the USDA
denominator; we measure them against his.

THE INPUTS, joined here (derive-don't-duplicate, R1)
-----------------------------------------------------
  - eden/foods/FoodData_Central_sr_legacy_food_csv_2018-04.zip -- the pinned PRIMARY source.
    URL + sha256 + per-member sha256 in eden/foods/usda-source.json. Gitignored (6 MB,
    re-downloadable); eden/foods/extract/ carries the rows this app uses, BYTE-EXACT, and is
    committed so the gate and a fresh clone both work without it.
  - eden/foods/sources/ -- the SECOND sources (see below), pinned in sources.json, their
    payloads gitignored, their extracted rows committed in eden/foods/candidates/.
  - dashboard/assets/data/foods-catalog-curation.json -- hand-authored and NUMBERS-FREE.
    It decides only WHICH foods appear, what they are CALLED, WHICH PORTION is a serving, and
    (for a name-joined second source) WHICH ROW a food pairs with and why. Where a source
    measures SEVERAL VARIETIES of what our generic row calls one food, the pair takes the
    LOWEST and sets `conservative`. It does NOT drop the food: a blank card reads as "not a
    source", which is a stronger claim than the ambiguity being avoided and a false one
    (Luneth, 2026-08-22). Every `fdc_id`,
    `portion_id` and `matches[].key` in it is a byte-exact join key into a source. THE DERIVE
    HARD-FAILS (FoodsCompositionError) if a key does not resolve, if a portion belongs to a
    different food, or if a curated food qualifies for nothing -- a silent drop reddens the
    board, never ships.

SECOND SOURCES, AND THE TWO TIERS (owner ruling, Luneth 2026-08-21)
--------------------------------------------------------------------
SR Legacy does not measure thirteen essentials that carry a numeric Wallach target. Rather
than leave every one of them permanently unreachable, Luneth ruled on 2026-08-21: branch out
to other reputable published sources, verify, and label what you get. Two tiers ship, and
the surface says which:

  EXACT       joined by an ID both tables carry -- here the NDB number, which sr_legacy_food.csv
              maps every catalog food to. No human judgment enters the join.
  APPROXIMATE joined by the source's own food NAME, one human decision per pair, each recorded
              in the curation with the reasoning that accepted it.

TIER IS DERIVED FROM THE JOIN, never typed per row: an ndb join may be EXACT, a name join is
APPROXIMATE forever. `food_composition_traces_to_source` REDs an EXACT tier sitting on a name
join, because a tier label that could quietly become a lie is worse than no label.

The bindings -- payload, candidate file, extractor, join kind, value field -- have ONE home,
eden/foods/sources/sources.json's `nutrient_bindings`. The gate re-walks every step of it,
including re-running the extractor against the pinned payload when that payload is present.

THE 7% RULE
-----------
A food is only credited for an essential when one realistic serving delivers at least
QUALIFY_FRACTION of Wallach's daily target for it. Luneth set 7% on 2026-08-21 (raised from the
5% first discussed) so the surface carries meaningful sources rather than trace mentions. The
threshold lives HERE, once, and is stamped into the artifact's _meta so a reader can see it.

WHAT A FOOD CANNOT DO
---------------------
A food is credited ONLY against a numeric Wallach target. It can never satisfy a tile that
covers on the mere PRESENCE of a source -- silver and the twelve amino acids -- because those
turn green with no amount compared, and every protein-bearing food names several. Luneth ruled
this on 2026-08-21. The rule is enforced in state/coverage.ts, not here; this generator simply
emits nothing for an essential with no numeric target, so there is nothing for such a tile to
read. The essentials that carry a numeric Wallach target and are not BOUND to any source are
listed in the artifact's `essentials_without_composition` and are stated as gaps rather than
filled from anywhere else.

★ THAT LIST IS "NOT BOUND", NOT "NOT MEASURABLE", and the two are not the same thing. Four of
its members -- sulfur, chloride, biotin, molybdenum -- ARE measured by AFCD, a source already
pinned in sources.json, and boron by a table not yet pinned at all. They are absent here
because no binding names them yet, which is a piece of work not yet done, not a finding about
the food world. Saying otherwise would be the more comfortable sentence and the false one.

PROVENANCE IS CARRIED, NOT IMPLIED
----------------------------------
Every emitted nutrient row carries a `provenance` block naming its source, its tier, the join
that produced it, and -- for a name join -- the human reasoning. `per_100g` is the SOURCE'S OWN
STRING, unparsed, wherever the source publishes the value as one cell; that string is the join
key the gate re-reads and byte-compares. Where a source publishes the value as component rows
instead (flavonoids), the total is Sigma of them in DECIMAL, never float, so the same string
comes out on every host, and the components it came from ride along in `provenance.parts`.
The derived per-serving `amount` is reproducible from (per_100g, grams, unit factor) by anyone,
including the gate.

DETERMINISTIC (R1): no wall-clock timestamp, sorted keys -- a fresh build_data() byte-equals
disk, which is what `derived_artifacts_fresh` re-executes and compares.
"""
import csv
import io
import json
import re
import sys
import zipfile
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
FOODS_DIR = ROOT / "eden" / "foods"
SOURCE_META = FOODS_DIR / "usda-source.json"
ARCHIVE = FOODS_DIR / "FoodData_Central_sr_legacy_food_csv_2018-04.zip"
EXTRACT_DIR = FOODS_DIR / "extract"
CANDIDATE_DIR = FOODS_DIR / "candidates"
SECOND_SOURCES = FOODS_DIR / "sources" / "sources.json"
ARCHIVE_ROOT = "FoodData_Central_sr_legacy_food_csv_2018-04/"

DATA = ROOT / "dashboard" / "assets" / "data"
CURATION_PATH = DATA / "foods-catalog-curation.json"
TARGETS_PATH = DATA / "essentials-targets-data.json"
OUT_PATH = DATA / "foods-composition-data.json"

sys.path.insert(0, str(ROOT / "tools"))
sys.path.insert(0, str(ROOT / "eden" / "tools"))
import safe_write  # noqa: E402
# Wallach's ONE amount for the essential-fatty-acid GROUP, located in the sealed corpus by
# its STATED FACT rather than by a hard-coded id. IMPORTED rather than re-implemented so a
# single function owns "which claim is the EFA dose" (R1) -- and imported from the CLAIM
# FINDER rather than read out of efa-coverage-data.json, so this generator never depends on
# a sibling artifact having been written first. Reading the artifact would make MANIFEST
# ORDER load-bearing with nothing anywhere saying so.
from efa_coverage_derive import _collective_claim as _efa_dose_claim  # noqa: E402

# A serving must deliver at least this fraction of Wallach's daily target to be credited.
# ★ THE EFA GROUP IS HELD TO THIS TOO. It is not a nutrient row -- omega-3 and omega-6 carry
# no individual Wallach dose, so they share one meter -- but it is measured against a Wallach
# number exactly as a row is, it is drawn beside the rows on the same card, and it is summed
# into `strength` beside them. A second entry rule for it would be a split the reader sees.
QUALIFY_FRACTION = 0.07
# At or above this fraction the UI calls the food a STRONG source.
STRONG_FRACTION = 0.20

USDA_SOURCE_ID = "usda-sr-legacy"
# USDA "Water, g per 100 g". Not an essential and never credited as one -- it is the
# denominator term in Doleman's dry-to-fresh conversion. Declared in
# usda-source.json's support_nutrients, which is deliberately NOT nutrient_map.
WATER_NUTRIENT_ID = "1051"

MEMBERS = ("food.csv", "food_nutrient.csv", "food_portion.csv",
           "nutrient.csv", "food_category.csv", "measure_unit.csv", "sr_legacy_food.csv")
# Small enough to carry whole; the big three are filtered to the curated rows.
WHOLE_MEMBERS = ("nutrient.csv", "food_category.csv", "measure_unit.csv")

UNIT_TO_MG = {"MG": 1.0, "UG": 0.001, "G": 1000.0}
WALLACH_UNIT_TO_MG = {"mg": 1.0, "mcg": 0.001, "g": 1000.0}


class FoodsCompositionError(RuntimeError):
    """A curation key did not resolve, or a curated food qualified for nothing (never guess)."""


# ── source access ────────────────────────────────────────────────────────────
def _read_member_lines(member: str) -> list:
    """Raw lines of one source member, from the archive if present, else the extract.

    The extract is byte-identical to the archive's rows for everything this app uses, so
    the two paths agree by construction -- `food_composition_traces_to_source` proves it.
    """
    if ARCHIVE.exists():
        with zipfile.ZipFile(ARCHIVE) as z:
            raw = z.read(ARCHIVE_ROOT + member).decode("utf-8-sig")
        return raw.splitlines()
    p = EXTRACT_DIR / member
    if not p.exists():
        raise FoodsCompositionError(
            f"neither the pinned archive nor the extract is present for {member}. "
            f"Re-download from usda-source.json's url, or restore eden/foods/extract/."
        )
    return p.read_text(encoding="utf-8").splitlines()


def _rows(member: str) -> list:
    lines = _read_member_lines(member)
    return list(csv.DictReader(io.StringIO("\n".join(lines))))


# ── inputs ───────────────────────────────────────────────────────────────────
def _source_meta() -> dict:
    return json.loads(SOURCE_META.read_text(encoding="utf-8"))


def _curation() -> dict:
    return json.loads(CURATION_PATH.read_text(encoding="utf-8"))


def _bindings() -> dict:
    """slug -> binding, from the ONE home. Underscore keys are prose, not bindings."""
    doc = json.loads(SECOND_SOURCES.read_text(encoding="utf-8"))
    block = doc.get("nutrient_bindings") or {}
    return {k: v for k, v in block.items() if not k.startswith("_")}


def _candidate(name: str) -> list:
    """One committed candidate file -- the extracted rows of a pinned second source.

    Committed for exactly the reason eden/foods/extract/ is: the payload itself is gitignored
    (Cambridge copyright for Powell, sheer weight for the rest), and a gate that cannot run on
    a fresh clone is not a gate.
    """
    p = CANDIDATE_DIR / name
    if not p.exists():
        raise FoodsCompositionError(
            f"the committed candidate {name} is missing. It is the only copy of the extracted "
            f"rows on a clone without the gitignored payloads -- restore it, do not re-derive "
            f"the numbers from somewhere else."
        )
    return json.loads(p.read_text(encoding="utf-8"))


def _essential_display() -> dict:
    """slug -> {label, category} for the tile's chips, DERIVED from the canon name.

    A chip is eight pixels tall and holds a name and a percentage, so it needs the SHORT form
    of an essential's name -- "Vitamin A", not "Vitamin A (Retinol / beta-carotene)". Rather
    than hand-type 29 short labels into a view (a second home for a name, R3), the short form
    is derived from the canon by two rules that between them cover every essential:

      1. drop EVERY parenthetical       -- "Vitamin B12 (Cobalamin)"  -> "Vitamin B12"
      2. drop a "/ ..." alternative     -- "Flavonoids / Bioflavonoids" -> "Flavonoids"

    Rule 1 removes every parenthetical rather than splitting at the first, because
    "Vitamin D2 (Ergocalciferol) + D3 (Cholecalciferol)" must come out as "Vitamin D2 + D3".
    Splitting at the first left "Vitamin D2", which quietly drops half of what the tile
    covers and reads as a narrower claim than the canon makes.

    ⚠ TWO ESSENTIALS COME OUT DIFFERENT FROM THE APPROVED DEMO, and that is stated here rather
    than papered over: the demo's mock data said "Vitamin D" and "Folate" where the canon gives
    "Vitamin D2 + D3" and "Folic Acid". Both are the canon's own words for them. Changing that
    is an editorial ruling, not a rendering fix, so the canon wins until he says otherwise.

    `category` is the canon's own, unmapped -- the CARD picks its colour from it, so no
    category-to-colour table is duplicated in code.
    """
    doc = json.loads(TARGETS_PATH.read_text(encoding="utf-8"))
    out = {}
    for e in doc["essentials"]:
        label = re.sub(r"\s*\([^)]*\)", "", e["name"])
        label = re.sub(r"\s+", " ", label.split(" / ")[0]).strip()
        out[e["slug"]] = {"label": label, "category": e["category"]}
    return out


def _wallach_targets() -> dict:
    """slug -> (low, unit) for every essential carrying a NUMERIC Wallach target.

    Read from the artifact `amounts_wallach_only` already audits. No target is defined here.
    """
    doc = json.loads(TARGETS_PATH.read_text(encoding="utf-8"))
    out = {}
    for e in doc["essentials"]:
        t = e.get("target") or {}
        low = t.get("low")
        unit = t.get("unit")
        if t.get("kind") == "wallach" and isinstance(low, (int, float)) and low > 0 and unit:
            out[e["slug"]] = (float(low), unit)
    return out


# ── the second-source join ───────────────────────────────────────────────────
def _index_part(part: dict, rows: list) -> dict:
    """Index one candidate file by its join key.

    ndb  -- five-digit, ZERO-PADDED ON BOTH SIDES. Ours are stored unpadded (1009) and every
            published table uses five digits (01009); the unpadded join finds a quarter of the
            foods and silently reports the rest as absent. It cost real time once already.
    name -- the source's own food string, byte-exact. Those strings carry PDF artefacts (fi/fl
            ligatures, a bled-in section heading) and they are kept EXACTLY as extracted, so
            the curation's key and the gate's lookup both join to the real row.
    """
    kind = part["join_kind"]
    field = part["join_field"]
    out = {}
    for r in rows:
        v = r.get(field)
        keys = v if isinstance(v, list) else ([v] if v else [])
        for k in keys:
            k = str(k).zfill(5) if kind == "ndb" else str(k)
            out.setdefault(k, r)
    return out


# Sulphur's atomic mass, g/mol. A PHYSICAL CONSTANT, not a choice: it converts Doleman's
# umoles/g into micrograms. The gate carries its own copy and REDs if this one is edited,
# which is the same treatment the vitamin conversion factors get.
S_ATOMIC_MASS = 32.06


def _part_value(part: dict, row: dict) -> tuple:
    """(value_string, note) for one candidate row, in the SOURCE's own units.

    Three shapes, because three sources publish differently:
      cell       -- one cell, carried through as its own unparsed string
      sum        -- Sigma of component ROWS (USDA prints one row per flavonoid compound)
      sum_fields -- Sigma of named FIELDS of one row (Doleman prints sulphur split in two)

    Every sum is added in DECIMAL, never float: '147.63' + '19.58' must be '167.21' on every
    host, because that string is what the gate re-derives and compares. A float sum gives
    167.20999999999998 here and something else elsewhere.
    """
    kind = part["value_kind"]
    if kind == "cell":
        raw = row.get(part["value_field"])
        raw = "" if raw is None else str(raw).strip()
        return (raw or None), None

    if kind == "sum_fields":
        total = Decimal(0)
        n = 0
        for f in part["value_fields"]:
            v = str(row.get(f) or "").strip()
            if v == "":
                continue
            total += Decimal(v)
            n += 1
        if n != len(part["value_fields"]):
            # A half-present row is not a smaller number, it is an unreadable one.
            return None, None
        return str(total), {"source": Path(part["candidate"]).stem, "rows": n,
                            "total": str(total)}

    rows = row.get(part["rows_field"]) or []
    total = Decimal(0)
    n = 0
    for c in rows:
        v = str(c.get(part["value_field"]) or "").strip()
        if v == "":
            continue
        total += Decimal(v)
        n += 1
    if n == 0:
        return None, None

    # The extractor also computed and stored this total independently. Disagreement means one
    # of the two is wrong and neither may ship -- the same redundancy Powell's own printed
    # mg/portion column gives the silicon extractor.
    stated = row.get(part["total_field"])
    if stated is not None and abs(float(total) - float(stated)) > 1e-6:
        raise FoodsCompositionError(
            f"{part['candidate']}: summing {part['rows_field']} gives {total} but the file's "
            f"own {part['total_field']} says {stated}. Re-extract; do not pick one."
        )
    return str(total), {"source": Path(part["candidate"]).stem, "rows": n, "total": str(total)}


def _part_mg_per_100g(part: dict, value: str, water: float, food_id: str, slug: str) -> tuple:
    """(mg per 100 g of food, working) for one part's value.

    Most parts publish per 100 g of the food already and only need a unit factor. Two do not,
    and both declare a conversion rather than folding the factor into a unit.

    WHO EHC 204 publishes ug of boron per GRAM of food, so its factor is a flat tenth. It is
    small enough to look like it belongs in UNIT_TO_MG and it does not: that table maps a unit
    of MASS, and this is a change of BASIS. Folding it in would make 'UG' mean per-gram for one
    source and per-100 g for every other, which is how a clean 10x error gets in.

    Doleman publishes umoles per gram of FREEZE-DRIED sample, which nobody eats, so its rows
    carry a declared conversion too:

        mg S / 100 g fresh = umol_per_g_dry x 32.06 ug/umol x dry_matter_fraction x 0.1

    where dry_matter_fraction is 1 - (this food's USDA water g/100 g) / 100. Luneth ruled on
    2026-08-21: convert, and SHOW THE WORKING -- so every term is returned and ends up on the
    shipped row's provenance, where the gate re-does the arithmetic and a reader can too.

    ★ THIS IS THE HONEST LIMIT OF THE WHOLE ROW. The umol/g is Doleman's sample; the moisture
    is a USDA sample of a nominally similar food; no id joins them. A watery cultivar or a
    different cooking state moves the answer, which is why no Doleman row can ever be EXACT.
    """
    convert = part.get("convert")
    if convert is None:
        return float(value) * UNIT_TO_MG[part["unit"]], None
    if convert == "ug_per_g_to_mg_per_100g":
        # A tenth, and nothing else -- no moisture, no sample basis. The working is still
        # returned so the gate can re-do it and a reader can see the basis change happen.
        mg = float(value) * 0.1
        return mg, {
            "ug_per_g": value,
            "arithmetic": f"{value} ug/g x 0.1 = {round(mg, 4)} mg/100 g",
        }
    if convert != "dry_umol_per_g_to_mg_per_100g_fresh":
        raise FoodsCompositionError(f"{slug}: unknown convert {convert!r}")
    if water is None:
        raise FoodsCompositionError(
            f"{food_id}/{slug}: the conversion from dry weight needs this food's USDA water "
            f"content and nutrient {WATER_NUTRIENT_ID} is not in the extract for it. A "
            f"missing moisture is a missing conversion, never a default one."
        )
    dry = 1.0 - float(water) / 100.0
    if not 0.0 < dry <= 1.0:
        raise FoodsCompositionError(
            f"{food_id}/{slug}: USDA water reads {water} g/100 g, giving a dry-matter "
            f"fraction of {dry:g}. Re-read the source.")
    mg = float(value) * S_ATOMIC_MASS * dry * 0.1
    return mg, {
        "umol_per_g_dry": value,
        "water_g_per_100g": str(water),
        "dry_matter_fraction": round(dry, 4),
        "arithmetic": (f"{value} umol/g dry x {S_ATOMIC_MASS} ug/umol x {round(dry, 4)} "
                       f"dry matter x 0.1 = {round(mg, 4)} mg/100 g fresh"),
    }


def _second_source_rows(food_id: str, ndb: str, grams: float, water: float, matches: dict,
                        bindings: dict, indexes: dict, targets: dict) -> list:
    """Every second-source nutrient row one serving of this food earns.

    ★ TWO WAYS TO COMBINE PARTS, AND CONFUSING THEM DOUBLE-COUNTS.
      sum   -- the parts measure DIFFERENT THINGS about the same food and add up. USDA
               publishes proanthocyanidins in a separate database from the other flavonoid
               classes; a food's flavonoid total is genuinely both.
      first -- the parts measure the SAME THING and only one may be used. AFCD and Doleman
               both measure sulphur; adding them would report a food as twice as sulphurous
               as either source says. The parts are tried IN ORDER and the first that has a
               value for this food wins, so the order in sources.json IS the precedence
               (owner ruling 2026-08-22: AFCD primary, Doleman second).
    """
    out = []
    for slug, binding in sorted(bindings.items()):
        tgt = targets.get(slug)
        if tgt is None:
            raise FoodsCompositionError(
                f"nutrient_bindings names '{slug}', which carries no numeric Wallach target. "
                f"A food can only be measured against a Wallach number (section 00.A)."
            )
        low, wunit = tgt

        parts = binding["parts"]
        combine = binding.get("combine", "sum" if len(parts) > 1 else "first")
        if len(parts) > 1 and "combine" not in binding:
            raise FoodsCompositionError(
                f"{slug}: {len(parts)} parts and no `combine`. Say whether they SUM "
                f"(different measurements of the same food) or whether the FIRST with a "
                f"value wins (the same measurement from two sources) -- guessing here "
                f"double-counts."
            )

        got = []          # (part, key, value_string, mg_per_100g, note, working, why, cons)
        for part in parts:
            kind = part["join_kind"]
            why = None
            conservative = False
            if kind == "ndb":
                key = ndb
            elif kind == "name":
                m = (matches or {}).get(part["source_id"])
                if m is None:
                    continue
                key = m["key"]
                why = m.get("why")
                conservative = bool(m.get("conservative"))
                if not why:
                    raise FoodsCompositionError(
                        f"{food_id}/{slug}: a name-joined pair must carry the reasoning "
                        f"that accepted it. Add `why` to its curation entry."
                    )
            else:
                raise FoodsCompositionError(
                    f"{slug}: unknown join_kind {kind!r} in nutrient_bindings")

            idx = indexes[(slug, part["candidate"])]
            row = idx.get(key)
            if row is None:
                if kind == "name":
                    # A curated pair naming a row that is not there is a broken hand-decision,
                    # not an absence. It must RED rather than quietly credit nothing.
                    raise FoodsCompositionError(
                        f"{food_id}/{slug}: curation pairs it with {key!r} in "
                        f"{part['candidate']}, which has no such row. Fix the key or drop "
                        f"the pair -- never leave a pair that resolves to nothing."
                    )
                continue

            value, note = _part_value(part, row)
            if value is None:
                continue
            mg, working = _part_mg_per_100g(part, value, water, food_id, slug)
            got.append((part, key, value, mg, note, working, why, conservative))
            if combine == "first":
                break

        if not got:
            continue

        # TIER FROM THE JOIN, never from the declaration. A name join is APPROXIMATE however
        # confident the pair looks; the gate REDs the other combination.
        used = [g[0] for g in got]
        kinds = {p["join_kind"] for p in used}
        tier = "APPROXIMATE" if "name" in kinds else "EXACT"
        declared = binding["tier"]
        if declared != ("APPROXIMATE" if any(p["join_kind"] == "name" for p in parts)
                        else "EXACT"):
            raise FoodsCompositionError(
                f"{slug}: nutrient_bindings declares tier {declared} but its parts join by "
                f"{sorted({p['join_kind'] for p in parts})}. A name join is APPROXIMATE; "
                f"only an id join may be EXACT."
            )

        total_mg = sum(g[3] for g in got)
        mg_serving = total_mg * (grams / 100.0)
        fraction = mg_serving / (low * WALLACH_UNIT_TO_MG[wunit])
        if fraction < QUALIFY_FRACTION:
            continue

        winner = got[0][0]
        prov = {
            "source_id": winner["source_id"] if combine == "first" else binding["source_id"],
            "tier": tier,
            "join": f"{got[0][0]['join_kind']}:{got[0][1]}",
            "value_kind": winner["value_kind"] if combine == "first" else (
                "sum" if any(p["value_kind"] != "cell" for p in used) else "cell"),
        }
        if len(parts) > 1:
            # Only meaningful where there is more than one part to combine. On a
            # single-source row it would be noise on 90 rows, and noise is what a reader
            # learns to skip past.
            prov["combine"] = combine
        parts_note = [g[4] for g in got if g[4] is not None]
        if parts_note:
            prov["parts"] = parts_note
        if got[0][5] is not None:
            prov["working"] = got[0][5]
        if got[0][6]:
            prov["why"] = got[0][6]
        if got[0][7]:
            # ★ THE LOWEST OF SEVERAL MEASURED VARIETIES. Carried so the card can SAY it is a
            # floor rather than a reading of this exact item -- a conservative number that
            # looks like an exact one is a quieter kind of overstatement.
            prov["conservative"] = True

        per_100g = (str(sum((Decimal(g[2]) for g in got), Decimal(0)))
                    if len(got) > 1 else got[0][2])
        out.append({
            "slug": slug,
            "amount": round(mg_serving / WALLACH_UNIT_TO_MG[wunit], 4),
            "unit": wunit,
            "fraction": round(fraction, 4),
            "strong": fraction >= STRONG_FRACTION,
            "per_100g": per_100g,
            "source_unit": winner["unit"] if combine == "first" else binding["unit"],
            "provenance": prov,
        })
    return out


# ── the essential-fatty-acid aggregate ───────────────────────────────────────
# ★ WHY FOODS ENTER THE EFA METER IN OIL, NOT IN ACID. Wallach's dose is nine grams of
# FLAXSEED OIL ("essential fatty acids as flaxseed oil at 9 grams per day"), so the meter
# products already feed counts OIL MASS. USDA measures a food's fatty ACIDS. Those are
# different quantities and summing them into one meter would be adding pounds to kilograms
# -- a salmon fillet's 12 g of fat is not 12 g of the oil Wallach doses.
#
# ★ AND WHY THERE ARE TWO REFERENCE OILS, NOT ONE (owner ruling, Luneth 2026-08-31). He does
# not name one oil. He names two, and he doses them INTERCHANGEABLY at the same rate:
#   "Essential fatty acids are of great value and may be taken alternately as salmon oil and
#    flaxseed oil at the rate of 5 grams t.i.d."        -- Let's Play Doctor (1995)
#   "other than the essentials-- i.e. flaxseed oil and/or salmon oil"
#                                                       -- Dead Doctors Don't Lie (2011)
#   "The salmon and other cold water fish in their diet provide rich sources of the
#    essential fatty acids required by the liver..."    -- Rare Earths (1994)
# A gram of salmon oil is worth a gram of flaxseed oil in his protocol, so a food's acids are
# converted against whichever of his two oils actually carries them, and the two oil masses
# are SUMMED -- both are grams of an oil he prescribes at nine per day:
#   18:2 + 18:3 - CLA  ->  FLAXSEED oil (fdc 167702, 67.695% LA+ALA)
#   20:5 + 22:6        ->  SALMON   oil (fdc 172343, 31.255% EPA+DHA)
#
# ⚠ ONE OIL FOR BOTH SHARES IS WRONG IN THE DIRECTION THAT MATTERS. Flaxseed oil reads
# 0.000 g of BOTH 20:5 and 22:6 in this same pinned archive, so "grams of flaxseed oil" is
# not a currency a fish can be paid in. Until 2026-08-31 neither marine row was extracted at
# all and every food's EFA was its trace 18:2/18:3 alone: canned salmon scored 1.5% of his
# nine grams and did not appear on the omega-3 list, pork ribs sat at 36%, and a fish-oil
# softgel was still credited its full label oil mass. 2 of 25 fish qualified -- and both of
# those qualified on their omega-SIX. See chronicle/decisions/2026-08-31-efa-marine-forms.md.
#
# ⚠ DPA (22:5 n-3, USDA 1280) IS DELIBERATELY OUT of both the numerator and the salmon
# denominator. Wallach names EPA and DHA; he never names DPA. Adding a form he does not name
# to a meter measured against his amount would be widening his claim by inference. See
# usda-source.json::_efa_why_no_dpa.
#
# Both fractions are READ FROM THE PINNED ARCHIVE at derive time, never typed: if the pinned
# release ever restates either oil, every food moves with it.
#
# ⚠ ONE DELIBERATE ASYMMETRY, PRESERVED. CLA is subtracted from a FOOD's 18:2 but not from
# the flaxseed reference, because that is how the denominator was stated when it was
# approved (67.695%). Flaxseed oil's CLA is 0.031 g/100 g, so the asymmetry is 0.05% --
# immaterial, and recorded rather than silently "fixed", because the approved number is the
# approved number. The salmon reference carries no such history: it is exactly its own
# 20:5 + 22:6, and salmon oil reports no CLA at all.
FLAX_FDC = "167702"          # Oil, flaxseed, cold pressed
SALMON_FDC = "172343"        # Fish oil, salmon -- the second oil he names, at the same dose
EFA_NUTRIENTS = ("linoleic", "linolenic", "conjugated_linoleic", "epa", "dha")
PLANT_EFA = ("linoleic", "linolenic")
MARINE_EFA = ("epa", "dha")


def _oil_fraction(comp_all: dict, support: dict, fdc: str, keys: tuple, what: str) -> tuple:
    """One reference oil's own EFA fraction by mass, from the pinned source. Never a literal.

    Returns (fraction, {key: g_per_100g}). A missing cell is a HARD FAIL: the oil is the
    conversion's denominator, and a missing denominator is a missing conversion, never a
    default one.
    """
    row = comp_all.get(fdc) or {}
    cells = {}
    for k in keys:
        v = row.get(support[k]["nutrient_id"])
        if v in (None, ""):
            raise FoodsCompositionError(
                f"{what} (fdc {fdc}) carries no {support[k]['nutrient_id']} ({k}) in the "
                f"extract, so the oil-equivalent conversion has no denominator. It must be "
                f"in the extract's wanted_fdc set and its nutrient_id in support_nutrients "
                f"-- a missing reference is a missing conversion, never a default."
            )
        cells[k] = v
    fraction = sum(float(v) for v in cells.values()) / 100.0
    if not 0.2 < fraction < 1.0:
        raise FoodsCompositionError(
            f"{what} reads {fraction:.4f} EFA by mass, which is not a plausible oil. "
            f"Re-read the source.")
    return fraction, cells


def _efa_reference(comp_all: dict, support: dict) -> dict:
    """The TWO reference oils Wallach names, read from the pinned source. Never a literal.

    ★ `efa_fraction` STAYS THE FLAX ONE at the top level. It is the plant conversion, it is
    what the shipped Zod schema requires under that name, and re-pointing a published key at
    a different quantity is exactly the token-indirection failure this project keeps meeting.
    The marine oil ships BESIDE it under `marine`, so both are legible and neither is hidden.
    """
    flax_fraction, flax_cells = _oil_fraction(
        comp_all, support, FLAX_FDC, PLANT_EFA, "flaxseed oil")
    salmon_fraction, salmon_cells = _oil_fraction(
        comp_all, support, SALMON_FDC, MARINE_EFA, "salmon oil")
    return {
        "fdc_id": FLAX_FDC,
        "description": "Oil, flaxseed, cold pressed",
        "linoleic_g_per_100g": flax_cells["linoleic"],
        "linolenic_g_per_100g": flax_cells["linolenic"],
        "efa_fraction": round(flax_fraction, 5),
        "label": "Omega EFAs",
        "category": "fatty_acids",
        # The second oil, for the 20:5/22:6 share. Same shape, same provenance, read the
        # same way -- so a fish is converted against the oil Wallach names for a fish.
        "marine": {
            "fdc_id": SALMON_FDC,
            "description": "Fish oil, salmon",
            "epa_g_per_100g": salmon_cells["epa"],
            "dha_g_per_100g": salmon_cells["dha"],
            "efa_fraction": round(salmon_fraction, 5),
            "_why": (
                "Wallach doses salmon oil and flaxseed oil ALTERNATELY at the same 5 g "
                "t.i.d., so a gram of either is a gram of his EFA dose -- but flaxseed oil "
                "carries 0.000 g of both 20:5 and 22:6 in this archive, so a fish's omega-3 "
                "cannot be honestly expressed in flaxseed grams. The marine share converts "
                "against this oil instead, and the two oil masses are summed."
            ),
        },
        "_label_why": (
            "The one display string in this artifact that is NOT derived from the canon. The "
            "essential-fatty-acid GROUP has no canonical short name -- omega-3 and omega-6 "
            "have their own, the group has only 'essential-fatty-acids' -- and the signed-off "
            "tile demo showed 'Omega EFAs'. The canon-derived alternative, 'Essential Fatty "
            "Acids', is 21 characters and would blow out the lead column's nowrap label on a "
            "340px card. The demo's label is used and the reason is written down."
        ),
    }


def _efa_goal() -> dict:
    """Wallach's ONE amount for the EFA group, in the mg of oil this file counts.

    9 g -> 9000 mg is a UNIT CHANGE of a figure he wrote, never a new amount, and it ships
    with the id of the claim it came from (section 00.A). The group is scored on ONE meter
    because omega-3 and omega-6 carry no individual Wallach dose; splitting his nine grams
    between them would fan a collective dose into two he never stated, which is exactly what
    the collective_doses_not_fanned gate exists to stop.

    A missing or unconvertible dose is a HARD FAIL, never a default -- a silent 0 here would
    make every food's EFA fraction infinite and a silent fallback would be an invented target.
    """
    claim = _efa_dose_claim()
    dz = claim.get("dose") or {}
    amount, unit = dz.get("amount"), dz.get("unit")
    if not isinstance(amount, (int, float)) or amount <= 0 or unit not in WALLACH_UNIT_TO_MG:
        raise FoodsCompositionError(
            f"the sealed EFA dose claim {claim.get('id')!r} reads amount={amount!r} "
            f"unit={unit!r}, which this generator cannot convert to mg. A missing denominator "
            f"is a missing denominator, never a default one."
        )
    return {
        "maintenance_mg": round(float(amount) * WALLACH_UNIT_TO_MG[unit], 4),
        "unit": "mg",
        "collective_group": dz.get("collective_group"),
        "source_claim_id": claim["id"],
        "wallach_dose_amount": amount,
        "wallach_dose_unit": unit,
        "_why": (
            "The denominator the EFA group is ranked and drawn against. Read from the SEALED "
            "claim, not from efa-coverage-data.json, so a food and a product are measured "
            "against one Wallach number without this artifact depending on that one existing."
        ),
    }


def _efa_of(row: dict, support: dict, grams: float, ref: dict,
            target_mg: float) -> dict:
    """One food's EFA delivery, in Wallach's own currency: grams of the oil he doses.

    TWO SHARES, each converted against the oil that actually carries it, then summed:
      plant  = 18:2 + 18:3 - CLA, over flaxseed oil's 67.695%
      marine = 20:5 + 22:6,       over salmon   oil's 31.255%
    Both are grams of an oil he prescribes at nine per day, so the sum is one number in one
    currency. A food with neither share returns {} and carries no EFA term at all.

    `fraction` and `qualifies` MIRROR A NUTRIENT ROW exactly -- same kind of denominator (a
    Wallach number), same 7% entry bar, tested at full precision before rounding, so the group
    enters the card and the ranking key under the one rule every row already obeys.

    ★ `fraction` IS ROUNDED AND `qualifies` IS NOT. A row is filtered on its exact fraction and
    stored rounded to 4 dp; this does the same, so a food sitting just under the bar can store
    0.07 and still read `qualifies: false`. That is the row rule reproduced faithfully, not a
    defect -- and it is why nothing may re-derive this bar from the stored number.
    """
    def cell(key):
        v = row.get(support[key]["nutrient_id"])
        return None if v in (None, "") else v

    la, ala, cla = cell("linoleic"), cell("linolenic"), cell("conjugated_linoleic")
    epa, dha = cell("epa"), cell("dha")
    if la is None and ala is None and epa is None and dha is None:
        return {}
    serving = grams / 100.0
    # ★ CLA IS SUBTRACTED FROM THE OMEGA-6 SHARE ONLY. 18:2 is an aggregate that INCLUDES its
    # conjugated forms, so the subtraction belongs to that aggregate and nowhere else -- not to
    # 18:3, and not to the marine forms. A source row reading CLA ABOVE its own 18:2 would make
    # the split unsound in a way no floor can honestly repair, so it HARD-FAILS rather than
    # clamping. 0 of the 250 catalog foods do that today; 24 carry a CLA cell at all.
    if cla is not None and float(cla) > float(la or 0):
        raise FoodsCompositionError(
            f"a food reads CLA {cla} above its own 18:2 {la} per 100 g. The conjugated forms are "
            f"a SUBSET of the 18:2 aggregate, so this is a contradiction in the source, not a "
            f"value to clamp -- re-read the source before deriving."
        )
    omega6_acid_g = max(0.0, float(la or 0) - float(cla or 0))
    omega3_plant_acid_g = float(ala or 0)
    marine_acid_g = float(epa or 0) + float(dha or 0)
    plant_acid_g = omega6_acid_g + omega3_plant_acid_g
    if plant_acid_g <= 0 and marine_acid_g <= 0:
        return {}
    plant_oil_mg = plant_acid_g * 1000.0 * serving / ref["efa_fraction"]
    marine_oil_mg = marine_acid_g * 1000.0 * serving / ref["marine"]["efa_fraction"]
    acid_mg = (plant_acid_g + marine_acid_g) * 1000.0 * serving
    oil_mg = plant_oil_mg + marine_oil_mg
    fraction = oil_mg / target_mg

    # ── the per-member split, and why it is NOT a fanned dose ────────────────────────────
    # ★ ONE BUDGET, ATTRIBUTED. `collective_doses_not_fanned` forbids putting a NUMERIC TARGET
    # on omega-3 or omega-6 sourced from Wallach's one 9 g EFA claim -- 9 g posted twice is 18 g
    # of board target from a 9 g source. Nothing here does that: the denominator stays the single
    # `target_mg`, and no per-member target exists anywhere. What is split is the FOOD's own
    # measured delivery, which is composition, not an amount of his. The two shares sum back to
    # `oil_mg` exactly, and that identity is ASSERTED below rather than trusted.
    #
    # ★ WHY IT HAD TO EXIST (owner ruling, Luneth 2026-08-31, the same session as the marine
    # forms). "Best food sources" on an essential's page answers "what should I eat for THIS" --
    # its own docstring in state/foods.ts says so. Ranked on the COLLECTIVE figure it answered a
    # different question, and both pages lied in opposite directions: the omega-3 page led with
    # sunflower seeds at 152.9% (0.3% omega-3) and almonds at 57.4% (0.0% omega-3), while the
    # omega-6 page led with herring at 68.7% (3.4% omega-6). 58 of 83 foods were on the omega-3
    # list purely for their omega-6, and 30 of 83 on the omega-6 list purely for their omega-3.
    #
    # ★ WHICH ACIDS BELONG TO WHICH MEMBER, and only these:
    #     omega-6 = 18:2 - CLA                    (converted against FLAXSEED oil)
    #     omega-3 = 18:3          -> flaxseed oil
    #             + 20:5 + 22:6   -> SALMON oil
    # Wallach files the marine forms under omega-3 himself -- "further divided into the Omega-3
    # (DHA and EPA)" (Epigenetics, 2014) -- so this mapping is his, not an inference.
    #
    # ⚠ THE COLLECTIVE FIGURE IS STILL THE ONE THAT COUNTS ELSEWHERE. `fraction`/`qualifies`
    # above remain the food tile's "Omega EFAs" chip, the `strength` ranking term, the regimen
    # meter (state/coverage.ts) and the goal-gap fill. Those are all questions ABOUT THE GROUP,
    # which shares one meter because Wallach states one amount. Only the per-ESSENTIAL list
    # reads `by_member`. Do not cross the two.
    omega6_oil_mg = omega6_acid_g * 1000.0 * serving / ref["efa_fraction"]
    omega3_oil_mg = (omega3_plant_acid_g * 1000.0 * serving / ref["efa_fraction"]
                     + marine_acid_g * 1000.0 * serving / ref["marine"]["efa_fraction"])
    if abs((omega6_oil_mg + omega3_oil_mg) - oil_mg) > 1e-9:
        raise FoodsCompositionError(
            f"the per-member EFA split does not reconstitute the group: omega-6 "
            f"{omega6_oil_mg:.6f} + omega-3 {omega3_oil_mg:.6f} != {oil_mg:.6f} mg of oil. A "
            f"split that loses or invents delivery is worse than no split at all."
        )

    def _member(oil: float, acid_g: float) -> dict:
        """One member's own delivery, held to the SAME bar as the group and as a nutrient row."""
        frac = oil / target_mg
        return {
            "acid_mg": round(acid_g * 1000.0 * serving, 4),
            "oil_equivalent_mg": round(oil, 4),
            "fraction": round(frac, 4),
            "qualifies": frac >= QUALIFY_FRACTION,
            "strong": frac >= STRONG_FRACTION,
        }

    out = {
        "acid_mg": round(acid_mg, 4),
        "plant_acid_mg": round(plant_acid_g * 1000.0 * serving, 4),
        "marine_acid_mg": round(marine_acid_g * 1000.0 * serving, 4),
        "oil_equivalent_mg": round(oil_mg, 4),
        "plant_oil_equivalent_mg": round(plant_oil_mg, 4),
        "marine_oil_equivalent_mg": round(marine_oil_mg, 4),
        "fraction": round(fraction, 4),
        "qualifies": fraction >= QUALIFY_FRACTION,
        "strong": fraction >= STRONG_FRACTION,
        "by_member": {
            "omega-6": _member(omega6_oil_mg, omega6_acid_g),
            "omega-3": _member(omega3_oil_mg, omega3_plant_acid_g + marine_acid_g),
        },
        "linoleic_g_per_100g": la,
        "linolenic_g_per_100g": ala,
    }
    if cla is not None:
        out["conjugated_linoleic_g_per_100g"] = cla
    if epa is not None:
        out["epa_g_per_100g"] = epa
    if dha is not None:
        out["dha_g_per_100g"] = dha
    return out


# ── the join ─────────────────────────────────────────────────────────────────
def build_data() -> dict:
    meta = _source_meta()
    nutrient_map = {k: v for k, v in meta["nutrient_map"].items() if not k.startswith("_")}
    curation = _curation()
    targets = _wallach_targets()
    display = _essential_display()
    bindings = _bindings()

    for slug in sorted(nutrient_map):
        if slug not in targets:
            raise FoodsCompositionError(
                f"nutrient_map names '{slug}', which carries no numeric Wallach target. "
                f"A food can only be measured against a Wallach number (section 00.A)."
            )
    both = sorted(set(nutrient_map) & set(bindings))
    if both:
        raise FoodsCompositionError(
            f"{both} are bound to BOTH the USDA nutrient_map and a second source. One "
            f"essential, one composition home (R3) -- decide which source owns it."
        )

    foods_rows = {r["fdc_id"]: r for r in _rows("food.csv")}
    categories = {r["id"]: r["description"] for r in _rows("food_category.csv")}
    units = {r["id"]: r["name"] for r in _rows("measure_unit.csv")}
    nutrients_meta = {r["id"]: r for r in _rows("nutrient.csv")}
    ndb_of = {r["fdc_id"]: r["NDB_number"].zfill(5) for r in _rows("sr_legacy_food.csv")}

    portions = {r["id"]: r for r in _rows("food_portion.csv")}

    # every candidate file, indexed once by its join key
    indexes = {}
    for slug, binding in bindings.items():
        for part in binding["parts"]:
            indexes[(slug, part["candidate"])] = _index_part(part, _candidate(part["candidate"]))

    wanted_nid = {v["nutrient_id"] for v in nutrient_map.values()}
    wanted_nid |= {v["nutrient_id"] for k, v in
                   (meta.get("support_nutrients") or {}).items() if not k.startswith("_")}
    wanted_fdc = {str(f["fdc_id"]) for f in curation["foods"]} | {FLAX_FDC, SALMON_FDC}
    comp = {}
    for r in _rows("food_nutrient.csv"):
        if r["fdc_id"] in wanted_fdc and r["nutrient_id"] in wanted_nid:
            comp.setdefault(r["fdc_id"], {})[r["nutrient_id"]] = r["amount"]
    support = {k: v for k, v in (meta.get("support_nutrients") or {}).items()
               if not k.startswith("_")}
    efa_ref = _efa_reference(comp, support)
    efa_goal = _efa_goal()

    # the USDA unit is RE-READ from nutrient.csv, never trusted from the map
    for slug, m in sorted(nutrient_map.items()):
        nid = m["nutrient_id"]
        row = nutrients_meta.get(nid)
        if row is None:
            raise FoodsCompositionError(f"{slug}: nutrient_id {nid} is not in nutrient.csv")
        if row["unit_name"] != m["usda_unit"]:
            raise FoodsCompositionError(
                f"{slug}: usda-source.json says unit {m['usda_unit']} but nutrient.csv "
                f"says {row['unit_name']} for nutrient {nid} ({row['name']}). "
                f"Re-read the source; do not re-point the map."
            )

    out_foods = []
    # Every failure is collected and raised TOGETHER. Raising on the first one turns a
    # curation pass into N build-fix-build rounds and hides how big the problem is.
    failures = []
    for entry in curation["foods"]:
        fdc_id = str(entry["fdc_id"])
        food = foods_rows.get(fdc_id)
        if food is None:
            raise FoodsCompositionError(
                f"curated fdc_id {fdc_id} ({entry.get('name')}) is not in food.csv")

        portion_id = str(entry["portion_id"])
        portion = portions.get(portion_id)
        if portion is None:
            raise FoodsCompositionError(
                f"{entry.get('name')}: portion_id {portion_id} is not in food_portion.csv")
        if portion["fdc_id"] != fdc_id:
            raise FoodsCompositionError(
                f"{entry.get('name')}: portion_id {portion_id} belongs to fdc_id "
                f"{portion['fdc_id']}, not {fdc_id}. A portion cannot be borrowed."
            )
        grams = float(portion["gram_weight"])
        if grams <= 0:
            raise FoodsCompositionError(f"{entry.get('name')}: portion weighs {grams} g")

        # ── A DRY SEED IS SERVED AS THE AMOUNT THAT COOKS INTO ONE COOKED PORTION ──────
        # Owner ruling 2026-08-24: keep both legume states, fix the portion. USDA publishes
        # exactly ONE portion for every raw mature seed here -- "1 cup" -- and a cup of dry
        # seed swells into roughly three cooked cups, so scoring it against Wallach's daily
        # amounts credited a serving nobody eats. Winged beans read 5.97 on the ranking key
        # against 1.68 for their own cooked row, and one dry legume led every one of the 30
        # goals.
        #
        # The honest serving is derived, never typed: the seed and its cooked twin are the
        # same dry matter plus water, and BOTH water contents are in the pinned USDA source.
        #
        #     dry grams = cooked portion g x (1 - water_cooked/100) / (1 - water_dry/100)
        #
        # `serving_yields` names the cooked twin by CATALOG ID -- a join key, not a number,
        # so foods-catalog-curation.json stays numbers-free (Charter R3). The working is
        # returned onto the food and `food_composition_traces_to_source` re-does it with its
        # own copy of the arithmetic.
        yields_id = entry.get("serving_yields")
        dry_working = None
        if yields_id is not None:
            twin = next((f for f in curation["foods"] if f["id"] == yields_id), None)
            if twin is None:
                raise FoodsCompositionError(
                    f"{entry.get('name')}: serving_yields names {yields_id!r}, which is not a "
                    f"catalog food. A yield must point at a row that exists.")
            twin_portion = portions.get(str(twin["portion_id"]))
            if twin_portion is None:
                raise FoodsCompositionError(
                    f"{entry.get('name')}: the cooked twin {yields_id} has no portion row.")
            w_dry = (comp.get(fdc_id) or {}).get(WATER_NUTRIENT_ID)
            w_cooked = (comp.get(str(twin["fdc_id"])) or {}).get(WATER_NUTRIENT_ID)
            if w_dry is None or w_cooked is None:
                raise FoodsCompositionError(
                    f"{entry.get('name')}: the dry-yield conversion needs the USDA water "
                    f"content of BOTH states and one is missing (dry={w_dry}, "
                    f"cooked={w_cooked}). A missing moisture is a missing conversion, never "
                    f"a default one.")
            dm_dry = 1.0 - float(w_dry) / 100.0
            dm_cooked = 1.0 - float(w_cooked) / 100.0
            if not 0.0 < dm_dry <= 1.0 or not 0.0 < dm_cooked <= 1.0:
                raise FoodsCompositionError(
                    f"{entry.get('name')}: water reads dry={w_dry} cooked={w_cooked} g/100 g; "
                    f"one of those is not a food.")
            cooked_g = float(twin_portion["gram_weight"])
            grams = round(cooked_g * dm_cooked / dm_dry, 1)
            # A seed that cooks into LESS than itself, or into more than ten times itself, is
            # a mis-paired twin rather than a surprising legume.
            if not 1.2 <= cooked_g / grams <= 10.0:
                raise FoodsCompositionError(
                    f"{entry.get('name')}: {cooked_g} g cooked works out to {grams} g dry, a "
                    f"yield of {cooked_g / grams:.2f}x. Check that {yields_id} is really its "
                    f"cooked twin.")
            dry_working = {
                "cooked_twin": yields_id,
                "cooked_portion_g": str(cooked_g),
                "water_dry_g_per_100g": str(w_dry),
                "water_cooked_g_per_100g": str(w_cooked),
                "arithmetic": (f"{cooked_g} g cooked x {round(dm_cooked, 4)} dry matter / "
                               f"{round(dm_dry, 4)} dry matter = {grams} g of dry seed"),
            }

        ndb = ndb_of.get(fdc_id)
        if ndb is None:
            raise FoodsCompositionError(
                f"{entry.get('name')}: fdc_id {fdc_id} has no NDB number in "
                f"sr_legacy_food.csv, so it cannot join any id-keyed second source.")

        rows = []
        for slug, m in sorted(nutrient_map.items()):
            raw = (comp.get(fdc_id) or {}).get(m["nutrient_id"])
            if raw is None or raw.strip() == "":
                continue
            per100 = float(raw)
            if per100 <= 0:
                continue
            low, wunit = targets[slug]
            mg = per100 * UNIT_TO_MG[m["usda_unit"]] * (grams / 100.0)
            fraction = mg / (low * WALLACH_UNIT_TO_MG[wunit])
            if fraction < QUALIFY_FRACTION:
                continue
            amount = mg / WALLACH_UNIT_TO_MG[wunit]  # expressed in Wallach's own unit
            rows.append({
                "slug": slug,
                "amount": round(amount, 4),
                "unit": wunit,
                "fraction": round(fraction, 4),
                "strong": fraction >= STRONG_FRACTION,
                # the SOURCE's own string, unparsed -- the gate's byte-exact join key
                "per_100g": raw,
                "usda_unit": m["usda_unit"],
                "nutrient_id": m["nutrient_id"],
                "provenance": {
                    "source_id": USDA_SOURCE_ID,
                    "tier": "EXACT",
                    "join": f"fdc:{fdc_id}/nutrient:{m['nutrient_id']}",
                    "value_kind": "cell",
                },
            })

        water_raw = (comp.get(fdc_id) or {}).get(WATER_NUTRIENT_ID)
        water = float(water_raw) if water_raw not in (None, "") else None
        rows.extend(_second_source_rows(entry["id"], ndb, grams, water,
                                        entry.get("matches"), bindings, indexes,
                                        targets))
        rows.sort(key=lambda r: r["slug"])

        if not rows:
            failures.append(
                f"{entry.get('name')} (fdc_id {fdc_id}, {grams:g} g) qualifies for "
                f"NOTHING at {QUALIFY_FRACTION:.0%}"
            )
            continue

        efa = _efa_of(comp.get(fdc_id) or {}, support, grams, efa_ref,
                      efa_goal["maintenance_mg"])

        portion_label = entry.get("portion_label") or _portion_label(portion, units)
        # ★ THE LABEL MOVES WITH THE GRAMS. Both legume states carry USDA's "1 cup", so a
        # rescaled dry row printing "1 cup" beside its own cooked row printing "1 cup" would
        # be the same lie in a quieter place -- the tile's only other clue is the word "dry"
        # in the name. It states the weight it actually scored and what that weight makes.
        if dry_working is not None:
            portion_label = (f"{grams:g} g dry \u00b7 makes "
                             f"{_portion_label(twin_portion, units)} cooked")
        out_foods.append({
            "id": entry["id"],
            "name": entry["name"],
            "category": entry.get("category") or categories.get(
                food["food_category_id"], food["food_category_id"]),
            "fdc_id": fdc_id,
            "usda_description": food["description"],
            "portion_id": portion_id,
            "portion_label": portion_label,
            "grams": grams,
            **({"dry_yield": dry_working} if dry_working is not None else {}),
            "nutrients": rows,
            "breadth": len(rows),
            # ★ THE RANKING KEY, AND WHY THE EFA GROUP IS IN IT (owner ruling 2026-08-22).
            # `strength` is "most nutritious first" -- the sum of how much of Wallach's
            # targets one serving delivers -- and it is the DEFAULT order of all 192 foods
            # whenever no goal is chosen. It counted nutrient ROWS only, and the EFA group is
            # not a row, so a food could deliver TWICE his stated nine grams and score zero
            # for it: walnuts at 220% sat on page 47 of 64 in a list titled by nutrition.
            # The card had shown that 220% all along -- only the order was blind to it.
            #
            # Summed UNCAPPED, because every other term is (his ruling, measured: capping
            # only this one leaves the group the single under-weighted term against rows that
            # routinely run 200-300%). Counted ONCE, never once per member: crediting
            # omega-3 and omega-6 separately would fan a collective dose he states as one.
            # Gated by food_strength_reproduces_its_own_terms.
            "strength": round(sum(r["fraction"] for r in rows)
                              + (efa["fraction"] if efa.get("qualifies") else 0.0), 4),
            **({"efa": efa} if efa else {}),
        })

    if failures:
        raise FoodsCompositionError(
            f"{len(failures)} curated food(s) credit nothing at {QUALIFY_FRACTION:.0%}. "
            f"Remove them from the curation, or give them a portion a person would "
            f"actually eat -- never lower the threshold to admit them:\n  "
            + "\n  ".join(failures)
        )

    out_foods.sort(key=lambda f: f["id"])

    measurable = sorted(set(nutrient_map) | set(bindings))
    doc = {
        "_purpose": (
            "GENERATED by eden/tools/foods_composition_derive.py. Per-serving nutrient "
            "amounts for the FOOD SOURCES blocks on the Regimen and Coverage tabs. "
            "COMPOSITION comes from the pinned USDA SR Legacy source and from the second "
            "sources pinned in eden/foods/sources/sources.json (all numerators); every "
            "TARGET it is measured against is Dr. Wallach's, read from "
            "essentials-targets-data.json. A food is credited for an essential only when one "
            "serving delivers at least the qualify_fraction of his daily target, and only "
            "for essentials carrying a NUMERIC Wallach target -- never for a tile that "
            "covers on presence alone. Every row carries its own provenance and match tier. "
            "`strength` is the ranking key -- the sum of every qualifying fraction one "
            "serving delivers, INCLUDING the essential-fatty-acid group, which is not a row "
            "(omega-3 and omega-6 carry no individual Wallach dose, so they share one meter) "
            "but is measured against efa_goal, held to the same qualify_fraction, and summed "
            "ONCE beside the rows. Never hand-edit; run eden/tools/build_embeds.py."
        ),
        "_meta": {
            "source": {
                "dataset": meta["dataset"],
                "display": meta["display"],
                "release": meta["release"],
                "url": meta["url"],
                "archive_sha256": meta["archive"]["sha256"],
                "licence": meta["licence"],
            },
            "second_sources": {
                slug: {"source_id": b["source_id"], "tier": b["tier"]}
                for slug, b in sorted(bindings.items())
            },
            # source_id -> the words the CARD uses. Keyed by id, not by essential,
            # because a `combine: first` binding can resolve to either of its
            # sources per food and the card has to name the one actually used.
            "source_display": {
                USDA_SOURCE_ID: meta["display"],
                **{p["source_id"]: p["display"]
                   for b in bindings.values() for p in b["parts"]},
                **{b["source_id"]: b["display"] for b in bindings.values()
                   if "display" in b},   # absent for a `first` binding, by design
            },
            "qualify_fraction": QUALIFY_FRACTION,
            "strong_fraction": STRONG_FRACTION,
            "essentials_measurable": measurable,
            # slug -> {label, category} for the tile's chips. Derived from the canon, never
            # typed in a view; `category` is the canon's own value so the card can pick its
            # colour from it without a mapping table living in two places.
            "essential_display": {s: display[s] for s in measurable},
            # NOT-BOUND, not not-measurable: see the note in this module's docstring.
            "essentials_without_composition": sorted(
                s for s in meta["no_usda_composition"]["slugs"] if s not in bindings),
            "food_count": len(out_foods),
            # The TWO reference oils, read from the pinned archive so a food's EFA can be
            # stated in the same currency Wallach's dose is: grams of an oil he prescribes.
            # `efa_fraction` is FLAXSEED oil's, for the 18:2/18:3 share; `marine.efa_fraction`
            # is SALMON oil's, for the 20:5/22:6 share -- he doses the two alternately at the
            # same rate, so their oil masses are summed into one figure.
            "efa_reference": efa_ref,
            # ...and the Wallach amount that currency is measured against. Shipped so the
            # surface can hold the group to the same bar as a row without re-deriving the
            # denominator, and so the gate can recompute every fraction from these bytes.
            "efa_goal": efa_goal,
        },
        "foods": out_foods,
    }
    return doc


def _portion_label(portion: dict, units: dict) -> str:
    """USDA's own words for the portion -- assembled, never invented."""
    desc = (portion.get("portion_description") or "").strip()
    mod = (portion.get("modifier") or "").strip()
    unit = units.get(portion.get("measure_unit_id"), "")
    label = desc or mod
    if unit and unit != "undetermined" and unit not in label:
        label = f"{label} {unit}".strip()
    amount = (portion.get("amount") or "").strip()
    return f"{amount} {label}".strip() if amount else label


# ── the committed extract ────────────────────────────────────────────────────
def write_extract() -> None:
    """Byte-exact rows for everything the curation touches, so a fresh clone needs no archive.

    Every line here is copied VERBATIM out of the archive -- no re-serialisation, no
    re-quoting, no reordering within a member. That is what makes the extract a legitimate
    stand-in for the source and what the gate byte-compares.
    """
    if not ARCHIVE.exists():
        raise FoodsCompositionError(
            "the pinned archive is absent, so the extract cannot be regenerated. "
            "Download it from usda-source.json's url first.")
    curation = _curation()
    meta = _source_meta()
    wanted_fdc = {str(f["fdc_id"]) for f in curation["foods"]} | {FLAX_FDC, SALMON_FDC}
    wanted_portion = {str(f["portion_id"]) for f in curation["foods"]}
    wanted_nid = {v["nutrient_id"] for k, v in meta["nutrient_map"].items()
                  if not k.startswith("_")}
    wanted_nid |= {v["nutrient_id"] for k, v in
                   (meta.get("support_nutrients") or {}).items() if not k.startswith("_")}

    EXTRACT_DIR.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(ARCHIVE) as z:
        for member in MEMBERS:
            raw = z.read(ARCHIVE_ROOT + member).decode("utf-8-sig")
            lines = raw.splitlines()
            header = lines[0]
            if member in WHOLE_MEMBERS:
                kept = lines[1:]
            else:
                cols = next(csv.reader(io.StringIO(header)))
                kept = []
                for line in lines[1:]:
                    try:
                        rec = dict(zip(cols, next(csv.reader(io.StringIO(line)))))
                    except StopIteration:
                        continue
                    if member == "food.csv":
                        keep = rec.get("fdc_id") in wanted_fdc
                    elif member == "food_portion.csv":
                        keep = rec.get("id") in wanted_portion
                    elif member == "sr_legacy_food.csv":
                        keep = rec.get("fdc_id") in wanted_fdc
                    else:  # food_nutrient.csv
                        keep = (rec.get("fdc_id") in wanted_fdc
                                and rec.get("nutrient_id") in wanted_nid)
                    if keep:
                        kept.append(line)
            payload = "\n".join([header] + kept) + "\n"
            safe_write.safe_rewrite(EXTRACT_DIR / member, payload)


def write_data() -> int:
    """The MANIFEST's write_fn. Deterministic: sorted keys, no timestamp."""
    doc = build_data()
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    return safe_write.safe_rewrite(
        OUT_PATH, json.dumps(doc, ensure_ascii=False, sort_keys=True, indent=1) + "\n")


def main() -> int:
    try:
        if "--extract" in sys.argv:
            write_extract()
            print("extract written")
        write_data()
        doc = build_data()
    except FoodsCompositionError as exc:
        print(f"FOODS COMPOSITION DERIVE FAILED: {exc}", file=sys.stderr)
        return 1
    second = sum(1 for f in doc["foods"] for r in f["nutrients"]
                 if r["provenance"]["source_id"] != USDA_SOURCE_ID)
    print(f"OK  {OUT_PATH.name}: {doc['_meta']['food_count']} foods, "
          f"{len(doc['_meta']['essentials_measurable'])} measurable essentials "
          f"({len(doc['_meta']['second_sources'])} from second sources, {second} row(s)), "
          f"threshold {doc['_meta']['qualify_fraction']:.0%}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
