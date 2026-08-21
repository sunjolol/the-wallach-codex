#!/usr/bin/env python3
"""Negative test for essentials_canon_matches_graphic (the MEMBERSHIP anchor).

Proof artifact (§00.B "codify, don't promise").

THE HOLE. essentials-canon.json's membership -- which 91 substances are the 90 essentials --
had NO anchor outside our own app until 2026-07-15. Its own provenance field said so:
"Bootstrapped 2026-06-24 from dashboard/assets/data/coverage-layout-data.json". One link
further back, that layout came from workspace-coverage-v3.2-PROPOSAL.html -- a UI DESIGN
MOCKUP dated three days earlier. The tell: the canon's mineral order inside the invented
rare_trace tier is alphabetical BY ATOMIC SYMBOL (Ag, Al, As, Au, Ba, Be) -- how a list is
lifted off a rendered table, not authored from a source.

Every gate was blind BY CONSTRUCTION: corpus_integrity proves the canon has not CHANGED
(sealing a fabrication makes it permanent, not correct); derived_artifacts_fresh proved the
layout regenerates from the canon, which was GUARANTEED because the canon was bootstrapped
FROM that artifact -- "zero diff" proved ring consistency, not truth; graphics_integrity
sha256s the JPG but cannot read membership out of an image.

The membership turned out to be RIGHT -- zero diff on all four categories, first run. That
is precisely why nobody ever caught that it had no anchor. A correct value with no anchor
looks exactly like a correct value with one, right up until it doesn't.

CASE 'stale_transcription' is the load-bearing one: it pins the binding. Without
source.file_sha256 the transcription is just another hand-typed file free to drift from its
own source -- the same bug this gate exists to fix, one level up.

Run:  PYTHONUTF8=1 python tools/tests/test_essentials_canon_matches_graphic.py

Exit 0 = every case behaves; non-zero = the membership anchor stopped biting."""
import copy
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._essentials_canon_matches_graphic_impl

CANON = json.loads((ROOT / "eden/corpus/essentials-canon.json").read_text(encoding="utf-8"))
TR = json.loads((ROOT / "eden/graphics/90-nutrients-front.transcription.json").read_text(encoding="utf-8"))
SHA = TR["source"]["file_sha256"]

fails = []


def case(name, canon, tr, sha, want_green, why):
    ok, msg = impl(canon, tr, sha)
    good = (ok == want_green)
    print("%s %-24s expect=%-5s got=%-5s  %s"
          % ("ok  " if good else "FAIL", name, "GREEN" if want_green else "RED",
             "GREEN" if ok else "RED", msg[:58]))
    if not good:
        fails.append((name, why, msg))


case("real_tree", CANON, TR, SHA, True,
     "the canon must match the graphic on the real tree, or the gate is unusable")

# --- THE BINDING: a transcription free to drift from its image is not an anchor ---------
case("stale_transcription", CANON, TR, "0" * 64, False,
     "THE BINDING. If the JPG changes and the transcription still claims the old hash, the "
     "transcription describes an image that no longer exists. Without this the fixture is "
     "just another hand-typed file drifting from its source — the exact bug, one level up")

tr_nohash = copy.deepcopy(TR)
del tr_nohash["source"]["file_sha256"]
case("unbound_transcription", CANON, tr_nohash, SHA, False,
     "a transcription with no source hash is bound to nothing and anchors nothing")

# --- MEMBERSHIP drift, both directions --------------------------------------------------
c_extra = copy.deepcopy(CANON)
c_extra["essentials"].append({"slug": "unobtainium", "display_name": "Unobtainium",
                              "common_name": "Unobtainium", "category": "mineral",
                              "essential": True})
case("canon_invents_mineral", c_extra, TR, SHA, False,
     "a 61st mineral smuggled into the canon must RED — this is the class of defect the "
     "mockup bootstrap could have introduced silently")

c_drop = copy.deepcopy(CANON)
c_drop["essentials"] = [e for e in c_drop["essentials"] if e["slug"] != "germanium"]
case("canon_drops_mineral", c_drop, TR, SHA, False,
     "a DROPPED essential must RED too. Germanium specifically: the 2026-06-24 ruling that "
     "put it in was itself decided against unanchored evidence")

c_swap = copy.deepcopy(CANON)
for e in c_swap["essentials"]:
    if e["slug"] == "biotin":
        e["slug"] = "biotin-x"
case("canon_renames_slug", c_swap, TR, SHA, False,
     "a renamed slug breaks every reference and must RED")

# --- COUNT drift ------------------------------------------------------------------------
tr_badcount = copy.deepcopy(TR)
tr_badcount["counts"]["minerals"] = 59
case("transcription_miscounts", CANON, tr_badcount, SHA, False,
     "the transcription's own declared count must match what it LISTS — catches a fixture "
     "claiming 60 while listing 59, i.e. a transcription that lies about itself")

# --- the gate must NOT re-litigate the settled fatty-acid divergence --------------------
print()
notes = json.dumps(TR.get("_reading_notes", {}))
ok_scope = ("omega-9" in notes.lower() or "arachidonic" in notes.lower())
print("%s fatty_divergence_labeled expect=True  got=%s"
      % ("ok  " if ok_scope else "FAIL", ok_scope))
if not ok_scope:
    fails.append(("fatty_divergence_labeled",
                  "the graphic prints Omega 3 (Linoleic) / Omega 6 (Linolenic) — SWAPPED vs "
                  "standard biochemistry — and Omega 9 (Arachidonic) where the canon says "
                  "Oleic. That divergence is ADJUDICATED (2026-07-08 contradiction report). "
                  "The transcription must record it, and the gate must compare MEMBERSHIP "
                  "only — widening to sub-names would re-litigate a settled ruling", ""))

print()
if fails:
    print("%d CASE(S) FAILED — the membership anchor is not holding:" % len(fails))
    for n, why, msg in fails:
        print("  %s: %s" % (n, why))
        if msg:
            print("     got: %s" % msg[:120])
    sys.exit(1)
print("all cases behave — the canon's membership is anchored to the sealed graphic.")
print("NOT proven, and cannot be: that the transcription READS the image correctly. Open the")
print("JPG and check it by eye — that is the honest limit of this chain.")
sys.exit(0)
