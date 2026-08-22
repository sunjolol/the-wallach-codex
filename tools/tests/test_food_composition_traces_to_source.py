#!/usr/bin/env python3
"""`food_composition_traces_to_source` is not vacuous: each drift it exists to catch REDs it.

WHAT THIS EXISTS TO CATCH
This app shipped ZERO per-food nutrient numbers until 2026-08-21 and now ships hundreds, none
of them Wallach's. They are composition (a numerator) measured against his target (the
denominator). The entire §00.A gate family is structurally BLIND to them: `amounts_wallach_only`
reads essentials-targets-data.json and audits TARGETS, while a food number changes a tile's
verdict without touching any target. So a wrong food number would pass a green board exactly the
way the mockup-derived mineral tiers did -- sealed, green, and wrong for three weeks.

Every case below is a real way that goes wrong, and every one of them renders as a perfectly
plausible screen:
  - a hand-edited amount                 (the classic: someone "fixes" a number in the artifact)
  - a unit swapped MG <-> UG             (a silent 1000x, and 3 mg vs 3 mcg both look fine)
  - a portion borrowed from another food (spinach's grams on parsley's composition)
  - arithmetic that no longer reproduces (a refactor moves a rounding step)
  - a food credited for an essential with NO numeric Wallach target -- the presence-covered
    tiles (silver, the twelve amino acids). This is the one that turns 13 tiles green with
    nothing compared, and it is why clause 3 exists.
  - a curated food silently failing to derive
  - a hand-edited extract line, and a re-pointed archive hash (the "make it green" moves)

And, since the second sources landed (2026-08-21), every way THEIR longer chain goes wrong:
  - a hand-edited second-source value in the artifact
  - a tier upgraded from APPROXIMATE to EXACT -- the label quietly becoming a lie
  - a name pair that no human ever accepted, or whose reasoning was dropped
  - a lowest-of-varieties number that stopped saying it was a floor
  - a summed total trusted rather than re-added from its components
  - a hand-edited CANDIDATE file, and a re-pointed payload hash

And, since sulfur gained a SECOND source (2026-08-22), every way two sources for one
essential go wrong -- all of which render as a perfectly ordinary card:
  - the two parts SUMMED instead of one winning, reporting a food as twice as sulphurous
  - a multi-part binding with no `combine` at all, leaving the derive to guess
  - a row crediting the publication that did NOT supply its number
  - the dry-weight conversion swapped, or its working no longer showing the terms used

Run: PYTHONUTF8=1 python tools/tests/test_food_composition_traces_to_source.py
"""
import copy
import json
import pathlib
import shutil
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))

from invariants import _food_composition_impl  # noqa: E402

REAL_SOURCE = ROOT / "eden" / "foods" / "usda-source.json"
REAL_SECOND = ROOT / "eden" / "foods" / "sources" / "sources.json"
REAL_CURATION = ROOT / "dashboard" / "assets" / "data" / "foods-catalog-curation.json"
REAL_ARTIFACT = ROOT / "dashboard" / "assets" / "data" / "foods-composition-data.json"
REAL_EXTRACT = ROOT / "eden" / "foods" / "extract"
REAL_CANDIDATES = ROOT / "eden" / "foods" / "candidates"
REAL_PAYLOADS = ROOT / "eden" / "foods" / "sources"
REAL_ARCHIVE = ROOT / "eden" / "foods" / "FoodData_Central_sr_legacy_food_csv_2018-04.zip"

FAILED = []


def run(tmp, source=None, curation=None, artifact=None, extract=None, archive=None,
        second=None, candidates=None, payload_dir=None):
    """Write the (possibly poisoned) inputs into tmp and run the gate's impl over them."""
    sp = tmp / "usda-source.json"
    cp = tmp / "curation.json"
    ap = tmp / "artifact.json"
    np_ = tmp / "sources.json"
    ep = tmp / "extract"
    dp = tmp / "candidates"
    sp.write_text(json.dumps(source if source is not None
                             else json.loads(REAL_SOURCE.read_text(encoding="utf-8"))),
                  encoding="utf-8")
    cp.write_text(json.dumps(curation if curation is not None
                             else json.loads(REAL_CURATION.read_text(encoding="utf-8"))),
                  encoding="utf-8")
    ap.write_text(json.dumps(artifact if artifact is not None
                             else json.loads(REAL_ARTIFACT.read_text(encoding="utf-8"))),
                  encoding="utf-8")
    np_.write_text(json.dumps(second if second is not None
                              else json.loads(REAL_SECOND.read_text(encoding="utf-8"))),
                   encoding="utf-8")
    for src, dst in ((REAL_EXTRACT, ep), (REAL_CANDIDATES, dp)):
        if dst.exists():
            shutil.rmtree(dst)
        shutil.copytree(src, dst)
    if extract is not None:
        for member, text in extract.items():
            (ep / member).write_text(text, encoding="utf-8")
    if candidates is not None:
        for member, doc in candidates.items():
            (dp / member).write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n",
                                     encoding="utf-8")
    return _food_composition_impl(
        sp, cp, ap, ep, archive if archive is not None else REAL_ARCHIVE,
        second_p=np_, candidate_dir=dp,
        payload_dir=payload_dir if payload_dir is not None else REAL_PAYLOADS)


def expect_red(label, viol, needle=None):
    if not viol:
        FAILED.append(f"{label}: gate stayed GREEN on poisoned input")
        print(f"  FAIL  {label}: stayed GREEN")
        return
    if needle is not None and not any(needle.lower() in v.lower() for v in viol):
        FAILED.append(f"{label}: RED but never named {needle!r}")
        print(f"  FAIL  {label}: RED but did not name {needle!r} -- {viol[0][:90]}")
        return
    print(f"  ok    {label}: RED -- {viol[0][:88]}")


def find_row(art, predicate):
    """(food, row) for the first artifact row matching predicate -- or a loud failure."""
    for f in art["foods"]:
        for r in f["nutrients"]:
            if predicate(f, r):
                return f, r
    raise AssertionError("no artifact row matches -- the test would prove nothing")


def main():
    art0 = json.loads(REAL_ARTIFACT.read_text(encoding="utf-8"))
    if not art0["foods"]:
        print("no foods in the artifact -- nothing to test"); return 1

    def is_usda(_f, r):
        return r["provenance"]["source_id"] == "usda-sr-legacy"

    def is_second(_f, r):
        return r["provenance"]["source_id"] != "usda-sr-legacy"

    def is_approx(_f, r):
        return r["provenance"]["tier"] == "APPROXIMATE"

    def is_sum(_f, r):
        return r["provenance"]["value_kind"] == "sum"

    with tempfile.TemporaryDirectory() as td:
        tmp = pathlib.Path(td)

        # 0 — the real inputs must be GREEN, or every case below proves nothing
        viol = run(tmp)
        if viol:
            print(f"  FAIL  baseline: the REAL data is already RED -- {viol[0][:100]}")
            FAILED.append("baseline is red")
        else:
            print("  ok    baseline: the real data is GREEN")

        # 1 — a hand-edited amount
        a = copy.deepcopy(art0)
        find_row(a, is_usda)[1]["per_100g"] = "999.99"
        expect_red("edited per_100g", run(tmp, artifact=a), "byte-identical")

        # 2 — a unit swap: a silent 1000x that reads perfectly plausible on screen
        a = copy.deepcopy(art0)
        row = find_row(a, is_usda)[1]
        row["usda_unit"] = "UG" if row["usda_unit"] == "MG" else "MG"
        expect_red("swapped usda_unit", run(tmp, artifact=a), "nutrient.csv says")

        # 3 — a portion borrowed from a DIFFERENT food
        a = copy.deepcopy(art0)
        other = next(f for f in a["foods"][1:] if f["portion_id"] != a["foods"][0]["portion_id"])
        a["foods"][0]["portion_id"] = other["portion_id"]
        expect_red("borrowed portion", run(tmp, artifact=a), "belongs to fdc_id")

        # 4 — arithmetic that no longer reproduces
        a = copy.deepcopy(art0)
        row = find_row(a, is_usda)[1]
        row["amount"] = float(row["amount"]) * 2 + 1
        expect_red("amount does not reproduce", run(tmp, artifact=a), "reproduce")

        # 5 — grams that disagree with the source portion row
        a = copy.deepcopy(art0)
        a["foods"][0]["grams"] = float(a["foods"][0]["grams"]) + 7
        expect_red("grams disagree", run(tmp, artifact=a), "source portion row")

        # 6 ★ THE PRESENCE-TILE CASE. A food credited for an essential with no numeric
        #     Wallach target is exactly how silver and the twelve amino acids would turn
        #     green with nothing compared.
        a = copy.deepcopy(art0)
        find_row(a, is_usda)[1]["slug"] = "arginine"
        expect_red("credited vs a presence-covered essential",
                   run(tmp, artifact=a), "NO numeric Wallach target")

        # 6b — the same slug swap on a SECOND-source row must hit the same clause: a new
        #      source must not open a side door into the presence-covered tiles.
        a = copy.deepcopy(art0)
        find_row(a, is_second)[1]["slug"] = "arginine"
        expect_red("second source vs a presence-covered essential",
                   run(tmp, artifact=a), "NO numeric Wallach target")

        # 7 — a curated food silently failing to derive
        a = copy.deepcopy(art0)
        dropped = a["foods"].pop(0)["id"]
        expect_red("curated food missing from artifact", run(tmp, artifact=a), dropped)

        # 8 — a food shipping that nobody curated
        c = json.loads(REAL_CURATION.read_text(encoding="utf-8"))
        c["foods"] = [f for f in c["foods"] if f["id"] != art0["foods"][0]["id"]]
        expect_red("uncurated food ships", run(tmp, curation=c), "not in the curation")

        # 9 — a row with NO provenance at all. Before 2026-08-21 every row was USDA by
        #     assumption; an unprovenanced row must now be a RED, not a default.
        a = copy.deepcopy(art0)
        del find_row(a, is_second)[1]["provenance"]
        expect_red("row with no provenance", run(tmp, artifact=a), "no provenance")

        # ── the SECOND-SOURCE chain ────────────────────────────────────────────
        # 10 — a hand-edited second-source value in the artifact
        a = copy.deepcopy(art0)
        find_row(a, is_second)[1]["per_100g"] = "999.99"
        expect_red("edited second-source per_100g", run(tmp, artifact=a),
                   "what the candidate row(s) give")

        # 11 ★ THE TIER LIE. APPROXIMATE upgraded to EXACT is the one drift that changes
        #      nothing on screen except the honesty of the label.
        a = copy.deepcopy(art0)
        find_row(a, is_approx)[1]["provenance"]["tier"] = "EXACT"
        expect_red("APPROXIMATE upgraded to EXACT", run(tmp, artifact=a),
                   "only an id join may be EXACT")

        # 11b — the same lie told in the BINDING instead of the row
        s = json.loads(REAL_SECOND.read_text(encoding="utf-8"))
        for slug, b in s["nutrient_bindings"].items():
            if not slug.startswith("_") and b.get("tier") == "APPROXIMATE":
                b["tier"] = "EXACT"
        expect_red("binding declares EXACT on a name join", run(tmp, second=s),
                   "only an id join may be EXACT")

        # 12 ★ A PAIR NOBODY ACCEPTED. A name matcher proposes; a human decides. An
        #      artifact row whose pair is not in the curation is a matcher's guess shipping.
        c = json.loads(REAL_CURATION.read_text(encoding="utf-8"))
        f0, r0 = find_row(art0, is_approx)
        for f in c["foods"]:
            if f["id"] == f0["id"]:
                f.pop("matches", None)
        expect_red("name pair absent from the curation", run(tmp, curation=c),
                   "never a matcher's")

        # 13 — the pair is there but the REASONING was dropped
        c = json.loads(REAL_CURATION.read_text(encoding="utf-8"))
        for f in c["foods"]:
            if f["id"] == f0["id"]:
                for m in f["matches"].values():
                    m["why"] = ""
        expect_red("name pair with no reasoning", run(tmp, curation=c), "reasoning")

        # 13b ★ A FLOOR THAT STOPPED SAYING IT IS A FLOOR. Where the source measured
        #      several varieties the curation took the LOWEST; an understated number that
        #      reads as an exact one is a quieter overstatement than a wrong number.
        def is_conservative(_f, r):
            return r["provenance"].get("conservative") is True

        a = copy.deepcopy(art0)
        del find_row(a, is_conservative)[1]["provenance"]["conservative"]
        expect_red("conservative flag dropped", run(tmp, artifact=a), "stay labelled")

        # 14 — the artifact points at a different source row than the human accepted
        a = copy.deepcopy(art0)
        row = find_row(a, is_approx)[1]
        row["provenance"]["join"] = "name:Oat cakes"
        expect_red("joined to a row the curation did not pair",
                   run(tmp, artifact=a), "the curation pairs it with")

        # 15 — a second-source unit swap: the same silent 1000x, one chain further out
        a = copy.deepcopy(art0)
        row = find_row(a, is_second)[1]
        row["source_unit"] = "UG" if row["source_unit"] == "MG" else "MG"
        expect_red("swapped source_unit", run(tmp, artifact=a), "the source publishes")

        # 16 — a number re-labelled with a source it did not come from
        a = copy.deepcopy(art0)
        find_row(a, is_second)[1]["provenance"]["source_id"] = "some-blog-post"
        expect_red("row re-labelled with another source", run(tmp, artifact=a),
                   "but the binding says")

        # 16b — the binding itself deleted, leaving a shipped number with NO declared route
        #       back to any pinned payload. Deleting the binding is how a source would be
        #       "removed" without anyone noticing its numbers are still on screen.
        s = json.loads(REAL_SECOND.read_text(encoding="utf-8"))
        slug = find_row(art0, is_second)[1]["slug"]
        s["nutrient_bindings"].pop(slug, None)
        expect_red("binding deleted, numbers still shipping", run(tmp, second=s),
                   "no declared route")

        # 17 ★ A SUMMED TOTAL MUST BE RE-ADDED, NEVER TRUSTED. Poison one component of a
        #      flavonoid food and the gate must notice the total no longer follows from it.
        f_sum, r_sum = find_row(art0, is_sum)
        part = r_sum["provenance"]["parts"][0]
        cand_name = f"{part['source']}.json"
        cand = json.loads((REAL_CANDIDATES / cand_name).read_text(encoding="utf-8"))
        ndb = r_sum["provenance"]["join"].split(":", 1)[1]
        hit = next(r for r in cand if str(r.get("ndb", "")).zfill(5) == ndb)
        rows_field = "compounds" if "compounds" in hit else "classes"
        hit[rows_field][0]["mean_mg_per_100g"] = "999.99"
        expect_red("a component of a summed total was edited",
                   run(tmp, candidates={cand_name: cand}), "what the candidate row(s) give")

        # 18 — a hand-edited candidate VALUE, which is the second sources' equivalent of a
        #      hand-edited extract line
        cand = json.loads((REAL_CANDIDATES / "silicon-powell-2005.json").read_text(
            encoding="utf-8"))
        cand[0]["silicon_mg_per_100g"] = "99.99"
        viol = run(tmp, candidates={"silicon-powell-2005.json": cand})
        expect_red("hand-edited candidate file", viol, "edited by hand")

        # ── TWO SOURCES FOR ONE ESSENTIAL ──────────────────────────────────────
        # Sulfur reads from AFCD where AFCD measured it and from Doleman where it did not.
        # Every way that goes wrong is invisible on screen: the number still looks fine.
        def is_first(_f, r):
            return r["provenance"].get("combine") == "first"

        def is_converted(_f, r):
            return "working" in r["provenance"]

        # 22 ★ THE PARTS SUMMED INSTEAD OF ONE WINNING. AFCD and Doleman measure the SAME
        #     element in the SAME food; adding them reports it as twice as sulphurous as
        #     either source says, and nothing on the card would look odd.
        s = json.loads(REAL_SECOND.read_text(encoding="utf-8"))
        for slug, b in s["nutrient_bindings"].items():
            if not slug.startswith("_") and b.get("combine") == "first":
                b["combine"] = "sum"
        expect_red("a `first` binding switched to `sum`", run(tmp, second=s),
                   "but the binding says")

        # 23 — the `combine` declaration deleted, leaving the derive to guess
        s = json.loads(REAL_SECOND.read_text(encoding="utf-8"))
        for slug, b in s["nutrient_bindings"].items():
            if not slug.startswith("_") and len(b.get("parts", [])) > 1:
                b.pop("combine", None)
        expect_red("a multi-part binding with no `combine`", run(tmp, second=s),
                   "no `combine`")

        # 24 ★ THE ROW CREDITS THE WRONG PUBLICATION. With two sources in play this is a
        #     citation error that renders identically to a correct card.
        #     No needle: in practice the CURATION clause catches it first, because the
        #     other source either has no curated pair for this food or has one with a
        #     different key. Clause C6d sits behind that as the backstop for the case where
        #     both sources happen to name the same row. Asserting a specific message here
        #     would pin the test to whichever clause happens to win, which is not the
        #     property being defended -- that the swap cannot ship IS.
        a = copy.deepcopy(art0)
        f_first, r_first = find_row(a, is_first)
        others = [q for q in (json.loads(REAL_SECOND.read_text(encoding="utf-8"))
                              ["nutrient_bindings"][r_first["slug"]]["parts"])
                  if q["source_id"] != r_first["provenance"]["source_id"]]
        r_first["provenance"]["source_id"] = others[0]["source_id"]
        expect_red("row credits the other source of a two-source essential",
                   run(tmp, artifact=a))

        # 25 ★ THE DRY-WEIGHT CONVERSION. Doleman publishes umoles per gram of FREEZE-DRIED
        #     sample; the shipped number is that times sulphur's atomic mass times the food's
        #     dry-matter fraction. Editing the constant rescales every Doleman value at once.
        s = json.loads(REAL_SECOND.read_text(encoding="utf-8"))
        found = False
        for slug, b in s["nutrient_bindings"].items():
            if slug.startswith("_"):
                continue
            for q in b.get("parts", []):
                if q.get("convert"):
                    q["convert"] = "some_other_conversion"
                    found = True
        if found:
            expect_red("the declared conversion was swapped", run(tmp, second=s),
                       "unknown convert")

        # 26 — the WORKING no longer shows the terms the number was built from. The
        #      conversion joins two different samples, so the working IS the disclosure.
        a = copy.deepcopy(art0)
        find_row(a, is_converted)[1]["provenance"]["working"]["water_g_per_100g"] = "1.0"
        expect_red("provenance `working` does not match the terms used",
                   run(tmp, artifact=a), "actually built from")

        # 19 — the extract, and the archive it is anchored to
        if REAL_ARCHIVE.exists():
            lines = (REAL_EXTRACT / "food_nutrient.csv").read_text(encoding="utf-8").splitlines()
            lines[1] = lines[1] + ",tampered"
            expect_red("hand-edited extract line",
                       run(tmp, extract={"food_nutrient.csv": "\n".join(lines) + "\n"}),
                       "not present")

            # 20 — the "just re-point the hash" move, on the archive
            s = json.loads(REAL_SOURCE.read_text(encoding="utf-8"))
            s["archive"]["sha256"] = "0" * 64
            expect_red("re-pointed archive sha256", run(tmp, source=s), "sha256")
        else:
            print("  skip  archive-anchored cases (the gitignored archive is absent)")

        # 21 — the same move on a second source's payload
        s = json.loads(REAL_SECOND.read_text(encoding="utf-8"))
        pinned = next(k for k in s["sources"] if (REAL_PAYLOADS / k).exists())
        if pinned:
            s["sources"][pinned]["sha256"] = "0" * 64
            expect_red("re-pointed payload sha256", run(tmp, second=s), "pins")
        else:
            print("  skip  payload-anchored case (the gitignored payloads are absent)")

    print()
    if FAILED:
        print(f"FAILED ({len(FAILED)}):")
        for f in FAILED:
            print("  - " + f)
        return 1
    print("all cases pass — the gate catches every drift it claims to")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
