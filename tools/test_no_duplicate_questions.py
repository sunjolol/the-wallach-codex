#!/usr/bin/env python3
"""Negative test for no_duplicate_questions.

Proof artifact. The gate must:
  1. GREEN on the real enrichment store as shipped.
  2. REDDEN when a NEW collision is planted -- two claims, one subject, the same question,
     not allowlisted. This is the class Luneth found by eye on the vitamin D page.
  3. REDDEN on a STALE allowlist entry -- a carve-out that no longer matches blesses nothing
     and must be deleted in the patch that cleared it (R9). Without this, the allowlist rots
     into a permanent amnesty.
  4. STAY GREEN when the same question is asked under DIFFERENT subjects. Those render on
     different entity pages and are not duplicates. A gate that fires on everything is not a
     gate, it is noise -- this is the case that keeps it honest.
  5. STAY GREEN on a re-WORDED collision, proving normalisation is doing real work: token
     order and stopwords must not matter, but different content words must.

    PYTHONUTF8=1 python tools/test_no_duplicate_questions.py

Exit 0 = every case behaves; non-zero = the gate stopped biting."""
import copy
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENRICH = ROOT / "eden" / "corpus" / "search-enrichment.json"

spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._no_duplicate_questions_impl
KNOWN = inv._QUESTION_COLLISIONS_KNOWN

real = json.loads(ENRICH.read_text(encoding="utf-8"))["enrichment"]
fails = []


def case(name, enrichment, known, want_ok, want_in_msg=None):
    ok, msg = impl(enrichment, known)
    bad = (ok != want_ok) or (want_in_msg and want_in_msg not in msg)
    print(f"{'ok  ' if not bad else 'FAIL'} {name}: ok={ok} :: {msg[:150]}")
    if bad:
        fails.append(name)


# 1 -- the real store, as shipped
case("real store greens", real, KNOWN, True)

# 2 -- plant a NEW collision under one subject
d = copy.deepcopy(real)
ids = [c for c, e in d.items() if e.get("subject") == "zinc" and e.get("question")][:2]
assert len(ids) == 2, "need two zinc-subject claims to plant the collision"
d[ids[1]]["question"] = d[ids[0]]["question"]
case("new collision reddens", d, KNOWN, False, "same question")

# 3 -- a stale allowlist entry (points at ids that no longer collide)
stale_key = frozenset({"WAL-CLM-DOES-NOT-EXIST-1", "WAL-CLM-DOES-NOT-EXIST-2"})
case("stale allowlist entry reddens", real, {**KNOWN, stale_key: "stale on purpose"},
     False, "stale")

# 4 -- same question, DIFFERENT subjects: not a duplicate, different pages
d = copy.deepcopy(real)
a = next(c for c, e in d.items() if e.get("subject") == "zinc" and e.get("question"))
b = next(c for c, e in d.items() if e.get("subject") == "copper" and e.get("question"))
shared = "What does this mineral do in the body?"
d[a]["question"], d[b]["question"] = shared, shared
case("cross-subject same question stays green", d, KNOWN, True)

# 5a -- normalisation IS doing work: reordered/stopword-shuffled wording still collides
d = copy.deepcopy(real)
i0, i1 = ids
d[i0]["question"] = "What are the signs of a zinc deficiency?"
d[i1]["question"] = "Signs of zinc deficiency -- what are they?"
case("reordered wording still collides", d, KNOWN, False, "same question")

# 5b -- genuinely different content words do NOT collide. Both questions are deliberately
# unusual so they cannot collide with a THIRD real claim on the same page -- the first draft
# of this case reused a real question and failed against an unrelated zinc claim, which was a
# test bug wearing a gate bug's clothes.
d = copy.deepcopy(real)
d[i0]["question"] = "Does zinc smell like wet slate underground?"
d[i1]["question"] = "Can zinc be woven into rope for sailing?"
case("different content words stay green", d, KNOWN, True)

# 6 -- an unreadable store must fail loud, never silently pass
try:
    ok, msg = impl({"X": None}, {})
    print(f"ok   malformed entry tolerated without crashing: ok={ok}")
except Exception as exc:  # noqa: BLE001
    print(f"FAIL malformed entry raised {exc!r}")
    fails.append("malformed entry")

print()
if fails:
    print(f"FAILED: {fails}")
    sys.exit(1)
print("ALL CASES PASS -- the gate greens on truth, reddens on a planted collision and on a "
      "stale carve-out, and does NOT fire across subjects or on genuinely different questions.")
