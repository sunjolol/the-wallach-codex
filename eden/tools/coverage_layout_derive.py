#!/usr/bin/env python3
"""coverage_layout_derive.py -- derive the Coverage periodic-table layout from the
sealed canon (Phase E, crack #1 deferred half, 2026-07-06).

The Coverage tiles' CANONICAL fields (display name, and for minerals the atomic symbol +
number) used to be hand-typed in coverage-layout-data.json -- a silent duplication of
essentials-canon (91 names re-typed). This generator makes canon the single home for those
values: the hand-authored SKELETON (coverage-layout-skeleton.json) holds only the editorial
ARRANGEMENT (section/subsection chrome, per-tile codes/letters/abbrs/hints, the goals block)
plus each tile's `key` (a reference to a canon layout_key); this generator fills each tile's
`name` from canon display_name (uppercased) and, for minerals, `sym`+`num` from canon. So the
periodic table's canonical identity can never drift from the pillar again -- it IS the pillar.

GOAL MEMBERSHIP (added 2026-07-16, the live Coverage build). The skeleton's goals block holds
only the CURATION -- {id, name, conditions[]} -- and this generator derives each goal's
`members`: the canon essential slugs that Wallach's own sealed claims name for those
conditions. WHY DERIVED AND NOT HAND-STORED: a hand-typed member list would duplicate a fact
the corpus already owns (R3), and would rot silently as mining adds claims. The goal SET is
ours (curation, never a Wallach claim -- he enumerates no "goals"); the MEMBERSHIP is his.

  members(goal) = { essentials named by any sealed claim that maps >=1 of the goal's
                    conditions }  MINUS the unactionable (see EXCLUDED_FROM_GOALS)

Contract (eden/derived/MANIFEST.json): build_data() -> the artifact object (pure, no write;
the derived_artifacts_fresh gate compares json.loads(disk) == build_data()); write_data() ->
regenerates the on-disk artifact via safe_write (used by build_embeds.py).
"""
import copy
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
SKELETON = ROOT / "dashboard" / "assets" / "data" / "coverage-layout-skeleton.json"
CANON = ROOT / "eden" / "corpus" / "essentials-canon.json"
CLAIMS_DIR = ROOT / "eden" / "corpus" / "claims"
CONDITIONS = ROOT / "eden" / "catalog" / "conditions.json"
TARGETS = ROOT / "dashboard" / "assets" / "data" / "essentials-targets-data.json"
ARTIFACT = ROOT / "dashboard" / "assets" / "data" / "coverage-layout-data.json"

# ── What a goal may NOT name, and why ──────────────────────────────────────────────────
#
# A goal RING means "a goal nutrient you have NOT covered" -- a to-do marker. So a goal may
# only name an essential the user can actually ACT on individually. Two classes cannot be:
#
# 1. The PLANT DERIVED 34 (`target.kind == "trace_pdm"`). Wallach states NO individual amount
#    for these; they share ONE verdict off the colloidal-mineral bottle. The signed-off demo
#    states the rule in its own words: "Wallach never itemises these, so they can never be
#    'named for' a goal, but they are still required."
#    ! MEASURED DELTA vs the demo (2026-07-16, flagged for Luneth): the demo's baked
#      MEMBERSHIP does NOT actually honour its own rule -- it lists STRONTIUM (a trace_pdm
#      element) under stronger-bones + less-joint-pain, off the real claim WAL-CLM-DDDL-000032
#      ("Strontium deficiency is associated with certain calcium- and boron-resistant forms of
#      osteoporosis and arthritis"). That claim is genuine; the inconsistency is the demo's.
#      We follow the demo's STATED rule, not its generated data (demo = vision, not letter),
#      so strontium is excluded here and the delta is logged for review. Flip
#      EXCLUDE_PLANT_DERIVED to False to restore the demo's literal behaviour -- one line.
#
# 2. The fiat-covered FOUNDATIONAL 4 (hydrogen, carbon, nitrogen, oxygen). Forced `covered` on
#    Luneth's say-so because you breathe -- there is nothing to take, so there is no goal to
#    set. PHOSPHORUS is deliberately NOT here: its `covered` traces to a sealed Wallach claim
#    (target.low == 0), not to the breathing fiat, so it stays goal-nameable exactly as the
#    signed-off demo has it.
#    ! THIS SET IS A MIRROR of FOUNDATIONAL_PRESENT_SLUGS in state/coverage.ts -- Python
#      cannot import TypeScript, so the duplication is real and is GATED, not trusted:
#      `goal_members_actionable` parses that constant out of coverage.ts and REDs if the two
#      disagree (R3 by enforcement, R7 -- codify, don't promise).
EXCLUDE_PLANT_DERIVED = True
FIAT_COVERED_SLUGS = frozenset({"hydrogen", "carbon", "nitrogen", "oxygen"})

# Claims tagged `search-only` are the Ask-Wallach corpus and MUST NOT feed an operational
# surface -- the Coverage goal strip is one. Mirrors the live `search_only_indices_excluded`
# gate's boundary (.claude/rules/search-corpus.md).
SEARCH_ONLY_TAG = "search-only"


def _canon_by_key() -> dict:
    canon = json.loads(CANON.read_text(encoding="utf-8"))["essentials"]
    return {c["layout_key"]: c for c in canon}


def _derive_tile(skel_tile: dict, cbk: dict) -> dict:
    """Merge a skeleton tile (key + editorial fields) with its canon-derived identity.
    name <- canon display_name (uppercased); slug <- canon slug; minerals also get
    sym <- symbol, num <- atomic_number. Every other field on the tile is editorial and
    passes through.

    WHY `slug` (added 2026-07-16): goal `members` are canon SLUGS, while tiles are keyed by
    `key` (the layout_key) and rendered by display `name`. Without the slug on the tile the
    view would have to map names back to slugs by hand -- and the two DIVERGE for 16 of 91
    (all 12 vitamins + all 3 omegas + flavonoids: canon 'vitamin-c' renders 'ASCORBIC ACID').
    That exact join silently lost every vitamin from every goal once already. Derived from
    canon, so it is gated, never hand-typed."""
    key = skel_tile["key"]
    c = cbk.get(key)
    if c is None:
        raise KeyError(f"coverage-layout-skeleton tile key {key!r} is not a canon layout_key")
    out = dict(skel_tile)
    out["name"] = c["display_name"].upper()
    out["slug"] = c["slug"]
    if c["category"] == "mineral":
        out["num"] = c["atomic_number"]
        out["sym"] = c["symbol"]
    return out


def _sealed_claims() -> list:
    """Every sealed claim across the corpus shards. The shards ARE the pillar; there is no
    'all claims' file, so the union is taken here rather than trusting a derived index."""
    claims = []
    for shard in sorted(CLAIMS_DIR.glob("*.json")):
        claims.extend(json.loads(shard.read_text(encoding="utf-8")).get("claims", []))
    return claims


def _unactionable_slugs() -> set:
    """The essentials a goal may never name -- see EXCLUDED_FROM_GOALS in the module docstring.

    trace_pdm comes from essentials-targets-data.json rather than a hand list because
    "has no individual Wallach amount" is exactly what `target.kind` already records: the
    SEMANTIC fact, not a label match on the layout's 'PLANT DERIVED' heading."""
    out = set(FIAT_COVERED_SLUGS)
    if EXCLUDE_PLANT_DERIVED:
        targets = json.loads(TARGETS.read_text(encoding="utf-8"))["essentials"]
        out |= {
            e["slug"] for e in targets
            if (e.get("target") or {}).get("kind") == "trace_pdm"
        }
    return out


# ── The plant-derived GROUP as a goal member (2026-07-16, Luneth's ruling) ────────────
#
# The PLANT DERIVED 34 can never be named INDIVIDUALLY (see EXCLUDE_PLANT_DERIVED above):
# Wallach states no per-element amount and they share ONE verdict off the colloidal-mineral
# bottle, so a ring on strontium is a to-do nobody can do. But he DOES prescribe the COMPLEX
# AS A WHOLE for named conditions, in his own words -- and a goal may name THAT. One member,
# one marker, one thing to actually do: take the bottle.
#
#   groups(goal) contains GROUP_ID  iff  some sealed claim whose OWN VERBATIM says
#                                        "colloidal minerals" maps >=1 of the goal's conditions
#
# ★ WHY THE VERBATIM AND NOT `other_substances: colloidal-minerals` (the obvious choice, and
#   the wrong one -- measured 2026-07-16, do not "simplify" this back):
#   1. THE TAG OVER-INCLUDES. It sits on claims where Wallach named a SINGLE colloidal
#      ELEMENT -- "plant derived colloidal CALCIUM" (insomnia, LETS-000322), "plant derived
#      colloidal SELENIUM" (cardiomyopathy, -000204), "liquid colloidal calcium, magnesium and
#      potassium" (muscle cramps, -000374). Those are INDIVIDUALLY DOSED 21 members, not the
#      group. "colloidal minerals" does not match any of them -- that is the whole point of
#      the phrase, and the negative test pins all three.
#   2. THE TAG CAN BE WRONG. LETS-000152 (backache) carries it only because the miner's
#      window bled into the NEXT entry, where "Colloidal tin" appears under BALDNESS.
#   3. Reading the claim's OWN verbatim makes neighbouring-entry bleed IMPOSSIBLE BY
#      CONSTRUCTION. That bleed is not hypothetical: it produced 9 of the 12 rejections when
#      this question was settled by READING all 28 candidate passages under a 76-agent
#      adversarial panel (2026-07-16), and it silently corrupted four earlier character-window
#      instruments that each returned a different answer (11 / 10 / 8 goals).
#      That panel is this rule's VALIDATION, not its source: the rule independently
#      reproduces the panel's 9 goals from the sealed corpus alone.
#
# ★ HONEST LIMIT (R7): matching the WORDS does not prove the STANCE. A verbatim reading
#   "colloidal minerals are useless for X" would match this rule. The adversarial read covered
#   that for today's claims; no non-gaming gate can. This half rests on review, and says so
#   rather than pretending the gate is stronger than it is.
GROUP_ID = "plant-derived"
_GROUP_RE = re.compile(r"colloidal\s+minerals?", re.I)


def _dehyphenate(s: str) -> str:
    """Rejoin print line-wraps before matching.

    The books are OCR'd from print and hyphenate across lines -- "colloi-\\ndal min-\\nerals",
    "Plant de-\\nrived". A verbatim is byte-faithful to that, so matching the raw text would
    silently MISS every wrapped occurrence (LETS-000419's "Plant de-rived colloidal minerals
    have proved great benifit here." is exactly this shape). Silent under-matching is the
    dangerous direction here: it drops a real Wallach attribution with no error.
    """
    return re.sub(r"\s+", " ", re.sub(r"-\s*\n\s*", "", s or "")).strip()


def _group_claims(claims: list) -> list:
    """Sealed claims whose OWN verbatim names the plant-derived mineral COMPLEX."""
    return [
        c for c in claims
        if SEARCH_ONLY_TAG not in (c.get("tags") or [])
        and _GROUP_RE.search(_dehyphenate(c.get("verbatim")))
    ]


def _derive_goals(skel_goals: list, cbk: dict) -> list:
    """Curation (id/name/conditions) + the sealed claims -> each goal's `members` + `groups`.

    Hard-fails (never silently drops) on: an unresolvable condition slug, an unknown essential
    slug, or a goal that ends up with zero members. A goal with no members would render an
    empty chip that highlights nothing -- a promise the field cannot keep -- so it is a build
    error, not a warning nobody reads."""
    canon_slugs = {c["slug"] for c in cbk.values()}
    catalog = set(json.loads(CONDITIONS.read_text(encoding="utf-8"))["conditions"].keys())
    unactionable = _unactionable_slugs()
    claims = _sealed_claims()
    group_claims = _group_claims(claims)

    out = []
    for g in skel_goals:
        conds = set(g.get("conditions") or [])
        if not conds:
            raise ValueError(f"goal {g['id']!r} names no conditions")
        unknown = sorted(conds - catalog)
        if unknown:
            raise KeyError(
                f"goal {g['id']!r} names condition slug(s) not in the sealed Catalog: {unknown}"
            )
        members = set()
        for c in claims:
            if SEARCH_ONLY_TAG in (c.get("tags") or []):
                continue
            if not (set(c.get("conditions") or []) & conds):
                continue
            members.update(c.get("essentials") or [])
        stray = sorted(members - canon_slugs)
        if stray:
            raise KeyError(f"goal {g['id']!r} derived non-canon essential slug(s): {stray}")
        members -= unactionable
        if not members:
            raise ValueError(
                f"goal {g['id']!r} derived ZERO members -- an empty chip highlights nothing"
            )
        entry = {k: copy.deepcopy(v) for k, v in g.items()}
        entry["members"] = sorted(members)
        # `groups` is OMITTED, never emitted empty: 5 of the 14 goals (more energy, better
        # sleep, blood-sugar, digestion, healthy weight) have NO claim where Wallach names the
        # complex for their conditions, and an absent key renders nothing rather than an empty
        # marker. An honest gap, exactly like the 53 essentials with no stated amount.
        if any(set(c.get("conditions") or []) & conds for c in group_claims):
            entry["groups"] = [GROUP_ID]
        out.append(entry)
    return out


def build_data() -> dict:
    """Pure: skeleton + canon + sealed claims -> the full coverage-layout-data object. No write.
    Skeleton metadata (top-level keys starting with '_') is dropped -- the generated
    artifact carries only the rendered structure (sections + goals)."""
    skeleton = json.loads(SKELETON.read_text(encoding="utf-8"))
    cbk = _canon_by_key()
    out = {k: copy.deepcopy(v) for k, v in skeleton.items() if not k.startswith("_")}
    for sec in out.get("sections", []):
        if "tiles" in sec:
            sec["tiles"] = [_derive_tile(t, cbk) for t in sec["tiles"]]
        for sub in sec.get("subsections", []):
            sub["tiles"] = [_derive_tile(t, cbk) for t in sub["tiles"]]
    if "goals" in out:
        out["goals"] = _derive_goals(out["goals"], cbk)
    return out


def write_data() -> int:
    """Regenerate coverage-layout-data.json from the skeleton + canon via safe_write."""
    import sys
    sys.path.insert(0, str(ROOT / "tools"))
    from safe_write import safe_rewrite
    text = json.dumps(build_data(), indent=2, ensure_ascii=False) + "\n"
    safe_rewrite(ARTIFACT, text)
    return len(text.encode("utf-8"))


if __name__ == "__main__":
    n = write_data()
    print(f"coverage-layout-data.json regenerated from skeleton + canon ({n} B)")
