#!/usr/bin/env python3
"""test_recommendations_not_stored.py — NEGATIVE test for the derived-not-stored gate (R7/R9).

A gate that has never been SEEN to fail is theater. This plants each defect and asserts RED,
then asserts GREEN on the real tree. Run:

    PYTHONUTF8=1 python tools/test_recommendations_not_stored.py

WHY EACH CASE EXISTS. A cached rec list is INVISIBLE the moment it is written — it looks
identical on screen and only diverges later, surfacing as the user complaint "items keep
coming back". That is the whole reason the rule is structural rather than a convention:
   1  rec LS key         -> ★ THE DEFECT. Someone caches the list "for performance" and
                            Luneth's goal→add→remove-goal→remove-item loop becomes possible
                            again — the thing deriving-at-read-time made impossible.
   2  ranker reads LS    -> the ranker gains the ABILITY to persist; the rule then rests on it
                            choosing not to, which is not a guarantee.
   3  ranker imports storage -> same, one layer up.
   4  rec artifact       -> a stored list shipped as data.
   5  OVER-FIRE PIN: lcRecentScans_v1 -> ★ R9. The first cut matched any "rec" substring and
                            fired on RECENT SCANS — a real, legitimate recoverable buffer
                            (blueprint §8: "a new scan never silently destroys the last").
                            A gate that reddens a working feature gets deleted, not fixed.
                            This case pins the tightening: RecentScans must stay GREEN.
   6  OVER-FIRE PIN: the word in a COMMENT -> ★ R9. The gate fired on this very module's own
                            docstring saying the ranker touches NO localStorage — reading a
                            denial as the offence. Comments are prose; only code counts.
   7  real tree GREEN    -> the gate must not over-fire on the shipped source.
"""
import shutil
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from invariants import _recommendations_not_stored_impl  # noqa: E402

SRC = ROOT / "dashboard/assets/js/src"
DATA = ROOT / "dashboard/assets/data"

results = []


def run(name, expect_ok, mutate=None, add_data=None):
    with tempfile.TemporaryDirectory() as d:
        d = Path(d)
        src, data = d / "src", d / "data"
        shutil.copytree(SRC, src)
        data.mkdir()
        for p in DATA.glob("*.json"):
            (data / p.name).write_text("{}", encoding="utf-8")
        if mutate is not None:
            mutate(src)
        if add_data is not None:
            (data / add_data).write_text("{}", encoding="utf-8")
        ok, msg = _recommendations_not_stored_impl(src, data)
    good = (ok == expect_ok)
    results.append((good, name, "GREEN" if ok else "RED", msg[:110]))
    return good


def _append(rel, text):
    def m(src):
        p = src / rel
        p.write_text(p.read_text(encoding="utf-8") + text, encoding="utf-8")
    return m


# 1 — a stored rec list key
run("1  rec-shaped LS key -> RED", False,
    mutate=_append("state/recommender.ts",
                   "\nconst CACHE_KEY = 'lcRecommendations_v1';\n"))

# 2 — the ranker touches localStorage
run("2  ranker reads localStorage -> RED", False,
    mutate=_append("state/recommender.ts",
                   "\nfunction cache() { return localStorage.getItem('x'); }\n"))

# 3 — the ranker imports storage
run("3  ranker imports core/storage -> RED", False,
    mutate=_append("state/recommender.ts",
                   "\nimport { getValidated } from '../core/storage.js';\n"))

# 4 — a stored rec artifact
run("4  rec-list artifact in assets/data -> RED", False,
    add_data="stored-recommendations.json")

# 5 — OVER-FIRE PIN: recent scans is NOT a recommendation list
run("5  PIN: lcRecentScans_v1 stays GREEN", True,
    mutate=_append("state/scanner.ts", "\nconst K2 = 'lcRecentScans_v1';\n"))

# 6 — OVER-FIRE PIN: the word in a comment is prose, not code
run("6  PIN: 'localStorage' in a comment stays GREEN", True,
    mutate=_append("state/recommender.ts",
                   "\n// this module never touches localStorage, by design\n"
                   "/* no localStorage here either */\n"))

# 7 — the real tree
run("7  REAL TREE -> GREEN", True)

print("\n  test_recommendations_not_stored")
print("  " + "─" * 74)
for good, name, got, msg in results:
    print(f"  {'ok ' if good else 'XX '} {name:52s} {got}")
    if not good:
        print(f"        -> {msg}")
bad = [r for r in results if not r[0]]
print("  " + "─" * 74)
print(f"  {len(results) - len(bad)}/{len(results)} cases behaved as specified")
sys.exit(1 if bad else 0)
