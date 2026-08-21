#!/usr/bin/env python3
"""Negative control for the no-goal recommendation join in views/coverage.ts.

WHAT BROKE, AND WHY A DOM PROBE COULD NOT SEE IT
`wantedSlugs()` turns the field's current gaps back into canon slugs so the recommender has
something to aim at when the user has picked no goals. It did that by mapping each layout tile's
slug to the tile's DISPLAY name, then looking the snapshot's gap tiles up by that name. But a
CoverageSnapshot tile carries the layout tile's `key` (the canonical target name), not its display
name -- and 16 of the 91 tiles differ beyond case: all twelve vitamins plus folate, flavonoids and
the three omegas. 'RETINOL' never matched 'Vitamin A (Retinol / beta-carotene)', so every one of
those gaps was silently dropped and NO VITAMIN GAP COULD EVER PULL A RECOMMENDATION.

Nothing went red. The rail still rendered cards (the mineral gaps resolved fine), so the surface
looked healthy; the defect was an absence, and an absence is exactly what a render probe cannot
distinguish from "the recommender had nothing to say". This test replays the join over the shipped
data instead, and plants the old defect to prove it would be caught.

Run: PYTHONUTF8=1 python tools/tests/test_nogoal_wanted_join.py
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
LAYOUT = json.loads((ROOT / "dashboard/assets/data/coverage-layout-data.json").read_text(encoding="utf-8"))
VIEW = (ROOT / "dashboard/assets/js/src/views/coverage.ts").read_text(encoding="utf-8")


def tiles():
    out = []
    for sec in LAYOUT["sections"]:
        subs = sec.get("subsections")
        out.extend(sec.get("tiles", []) if subs is None else [t for s in subs for t in s["tiles"]])
    return [t for t in out if t.get("slug") is not None]


def join(field):
    """Replay wantedSlugs()' reverse lookup, mapping slug -> tile[field].

    The snapshot's tile.name IS the layout tile's `key`, so `key` is the correct join column.
    Returns the number of tiles that fail to resolve.
    """
    ts = tiles()
    lookup = {t[field].lower(): t["slug"] for t in ts}
    return sum(1 for t in ts if lookup.get(t["key"].lower()) is None)


fails = []

# 1. THE FIX: joining on `key` resolves every tile.
dropped = join("key")
ok = dropped == 0
print("%s join_on_key            expect=0 dropped        got=%d" % ("ok  " if ok else "FAIL", dropped))
if not ok:
    fails.append("join_on_key dropped %d tile(s)" % dropped)

# 2. NEGATIVE CONTROL: the old display-name join must still lose the 16 divergent tiles.
#    If this ever reads 0, the layout has changed shape and case 1 has stopped proving anything.
dropped_name = join("name")
divergent = [t["slug"] for t in tiles() if t["name"].lower() != t["key"].lower()]
ok = dropped_name == len(divergent) > 0
print("%s negative_control       expect=%d dropped       got=%d" %
      ("ok  " if ok else "FAIL", len(divergent), dropped_name))
if not ok:
    fails.append("negative control: display-name join dropped %d, expected %d" % (dropped_name, len(divergent)))

# 3. The vitamins are the point: every vitamin tile must survive the join.
vits = [t["slug"] for t in tiles() if t["slug"].startswith("vitamin-")]
lookup = {t["key"].lower(): t["slug"] for t in tiles()}
missing = [t["slug"] for t in tiles() if t["slug"] in vits and lookup.get(t["key"].lower()) != t["slug"]]
ok = len(vits) >= 12 and not missing
print("%s vitamins_resolve       expect=%d resolve       got=%d" %
      ("ok  " if ok else "FAIL", len(vits), len(vits) - len(missing)))
if not ok:
    fails.append("vitamin tiles unresolved: %s" % missing)

# 4. Pin the source so a revert cannot pass quietly.
pinned = "m.set(t.slug, t.key);" in VIEW and "m.set(t.slug, t.name);" not in VIEW
print("%s source_pinned          expect=maps to t.key   got=%s" %
      ("ok  " if pinned else "FAIL", "t.key" if pinned else "t.name"))
if not pinned:
    fails.append("views/coverage.ts slugToTileKey no longer maps to t.key")

print()
if fails:
    print("FAIL -- %d case(s) misbehaved" % len(fails))
    for f in fails:
        print("   " + f)
    sys.exit(1)
print("PASS -- the no-goal gap->slug join resolves all %d tiles; the old display-name join "
      "still loses %d" % (len(tiles()), dropped_name))
