#!/usr/bin/env python3
"""Negative test for search_synonyms_sole_owner.

Proof artifact (section 00.B "codify, don't promise"): the gate must GREEN on the real registry AND
REDDEN on every class of ambiguity it exists to catch. It drives the gate's own helper
(_search_synonym_violations) against tampered IN-MEMORY copies of the real registry, so it cannot
drift from the live gate.

The defect being fenced (2026-09-17): state/search.ts entityHit() pass 2 returns the FIRST entity
whose synonym matches and the registry is slug-ALPHABETICAL, so two entities sharing a synonym means
the alphabetically-earlier one silently takes every query carrying it. Typing "uti" opened Cystitis;
"b12" opened Cobalt. 352 phrases were contested the day this gate landed.

Run:

    PYTHONUTF8=1 python tools/tests/test_search_synonyms_sole_owner.py

Exit 0 = every case behaves; non-zero = the gate stopped biting (a real regression)."""
import copy
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)

REG = json.loads((ROOT / "eden" / "catalog" / "search-entities.json").read_text(encoding="utf-8"))["entities"]
INDEXED = inv._search_indexed_slugs()
results = []


def case(label, mutate, expect_red, needle=None):
    ents = copy.deepcopy(REG)
    if mutate:
        mutate(ents)
    contested, duplicate, shadow, exempt = inv._search_synonym_violations(ents, INDEXED)
    found = {"contested": contested, "duplicate": duplicate, "shadow": shadow}
    red = bool(contested or duplicate or shadow)
    ok = red == expect_red
    if ok and expect_red and needle:
        # not merely red -- red FOR THE PLANTED REASON, so a pre-existing violation cannot
        # make a broken gate look like it is still biting.
        ok = needle in str(found)
    results.append((label, ok, f"contested={len(contested)} duplicate={len(duplicate)} shadow={len(shadow)} exempt={len(exempt)}"))


# ── the live registry must be CLEAN, or the gate is meaningless ──────────────
case("the real registry is clean (no ambiguity anywhere)", None, expect_red=False)

# ── class 1: two entities claiming one phrase ────────────────────────────────
def plant_contested(ents):
    a, b = sorted(ents)[0], sorted(ents)[-1]
    ents[a].setdefault("synonyms", []).append("zzz planted collision")
    ents[b].setdefault("synonyms", []).append("ZZZ  planted   collision!")   # same matchKey


case("two entities claiming one phrase (differently spelled) REDDENS",
     plant_contested, expect_red=True, needle="zzz planted collision")

# ── class 2: one entity listing the same phrase twice ────────────────────────
def plant_duplicate(ents):
    a = sorted(ents)[0]
    ents[a].setdefault("synonyms", []).extend(["zzz planted dupe", "ZZZ-PLANTED-DUPE"])


case("one entity listing a phrase twice REDDENS", plant_duplicate, expect_red=True)

# ── class 3: an entity shadowing ANOTHER entity's canonical name ─────────────
def plant_shadow(ents):
    # the victim must be INDEXED, or the shadow is exempt by design (it cannot be a destination)
    victim = sorted(s for s in ents if s in INDEXED and s != sorted(ents)[0])[-1]
    thief = sorted(ents)[0]
    ents[thief].setdefault("synonyms", []).append(victim.replace("_", " "))


case("an entity shadowing an INDEXED entity's canonical name REDDENS", plant_shadow, expect_red=True)

# ── and the documented exemption must still hold: shadowing an UNINDEXED entity is green ──
def plant_exempt_shadow(ents):
    # the victim must be UNINDEXED *and* its name must not already be someone's synonym, or the
    # plant would register as CONTESTED and prove nothing about the exemption.
    held = {inv._search_synonym_key(x) for e in ents.values() for x in e.get("synonyms", [])}
    victim = next(s for s in sorted(ents)
                  if s not in INDEXED and inv._search_synonym_key(s.replace("_", " ")) not in held)
    thief = next(s for s in sorted(ents) if s != victim)
    ents[thief].setdefault("synonyms", []).append(victim.replace("_", " "))


case("shadowing an entity that has NO claims (cannot be a destination) stays green",
     plant_exempt_shadow, expect_red=False)

# ── the real regression that started this: cystitis vs urinary_tract_infection ─
def replant_uti(ents):
    if "cystitis" in ents and "urinary_tract_infection" in ents:
        ents["cystitis"].setdefault("synonyms", []).append("uti")


case("replanting the original UTI collision REDDENS", replant_uti, expect_red=True, needle="uti")

# ── and the second real one: b12 on cobalt as well as vitamin-b12 ────────────
def replant_b12(ents):
    if "cobalt" in ents and "vitamin-b12" in ents:
        ents["cobalt"].setdefault("synonyms", []).append("B12")


case("replanting the original b12 collision REDDENS", replant_b12, expect_red=True, needle="b12")

# ── a NON-violation must stay green: an entity may list its OWN name ─────────
def own_name(ents):
    a = sorted(ents)[0]
    mine = a.replace("_", " ")
    have = {inv._search_synonym_key(x) for x in ents[a].get("synonyms", [])}
    if inv._search_synonym_key(mine) not in have:
        ents[a].setdefault("synonyms", []).append(mine)


case("an entity listing its OWN name stays green (not a violation)", own_name, expect_red=False)

print()
for label, ok, detail in results:
    print(("PASS " if ok else "FAIL ") + label + "   [" + detail + "]")
bad = [r for r in results if not r[1]]
print()
if bad:
    print("FAILED " + str(len(bad)) + "/" + str(len(results)) + " -- the gate is not biting as documented")
    sys.exit(1)
print("OK -- " + str(len(results)) + " cases: the gate greens on the real registry and reddens on all "
      "three ambiguity classes, including the two real collisions that started the round")
