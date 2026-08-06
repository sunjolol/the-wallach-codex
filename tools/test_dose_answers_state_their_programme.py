#!/usr/bin/env python3
"""Negative test for dose_answers_state_their_programme.

Proof artifact: the gate must GREEN on the real store, REDDEN when a general-programme dose
answer states a bare number with no programme and no year, and STAY GREEN when the same bare
number belongs to a condition-scoped therapeutic dose -- a rickets protocol is not a rival to a
maintenance target and must not be dragged into the rule. Drives
_dose_answers_state_their_programme_impl against tampered copies of the real enrichment store.

Case 3 is the one that matters most: a gate that fires on everything is not a gate, it is noise.

    PYTHONUTF8=1 python tools/test_dose_answers_state_their_programme.py

Exit 0 = every case behaves; non-zero = the gate stopped biting."""
import copy
import importlib.util
import json
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CLAIMS = ROOT / "eden" / "corpus" / "claims"
ENRICH = ROOT / "eden" / "corpus" / "search-enrichment.json"

spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._dose_answers_state_their_programme_impl

MARKERS = inv._DOSE_PROGRAMME_MARKERS
store = json.loads(ENRICH.read_text(encoding="utf-8"))
claims = {}
for shard in sorted(CLAIMS.glob("claims-*.json")):
    for c in json.loads(shard.read_text(encoding="utf-8"))["claims"]:
        claims[c["id"]] = c


def is_programme_dose(c):
    d = c.get("dose") or {}
    return (c.get("kind") == "dose" and d.get("amount") is not None
            and any(m in str(d.get("for_condition") or "").lower() for m in MARKERS))


def run(tampered):
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as fh:
        json.dump(tampered, fh, ensure_ascii=False)
        path = fh.name
    try:
        return impl(CLAIMS, path)
    finally:
        Path(path).unlink(missing_ok=True)


fails = []

# 1 — the real store passes
ok, msg = impl(CLAIMS, ENRICH)
if not ok:
    fails.append(f"case 1: real store should be GREEN, got: {msg}")

# 2 — strip programme + year from one general-programme answer -> RED
victim = next(cid for cid, c in claims.items() if is_programme_dose(c) and cid in store["enrichment"])
t = copy.deepcopy(store)
t["enrichment"][victim]["answer_short"] = "10 to 100 mg a day."
ok, msg = run(t)
if ok:
    fails.append(f"case 2: a bare general-programme answer ({victim}) should REDDEN, got GREEN: {msg}")
elif victim not in msg:
    fails.append(f"case 2: reddened but did not name the offender {victim}: {msg}")

# 3 — the SAME bare wording on a condition-scoped therapeutic dose must stay GREEN
scoped = next((cid for cid, c in claims.items()
               if c.get("kind") == "dose" and (c.get("dose") or {}).get("amount") is not None
               and not is_programme_dose(c) and cid in store["enrichment"]), None)
if scoped is None:
    fails.append("case 3: no condition-scoped dose claim to test with — scope check did not run")
else:
    t = copy.deepcopy(store)
    t["enrichment"][scoped]["answer_short"] = "10 to 100 mg a day."
    ok, msg = run(t)
    if not ok:
        fails.append(f"case 3: therapeutic dose ({scoped}) is out of scope and must stay GREEN, got: {msg}")

# 4 — an unreadable store fails LOUD, never silently green
ok, msg = impl(CLAIMS, ROOT / "eden" / "corpus" / "does-not-exist.json")
if ok:
    fails.append("case 4: an unreadable enrichment store must REDDEN, got GREEN")

if fails:
    print("FAIL — the gate stopped biting:")
    for f in fails:
        print("  - " + f)
    sys.exit(1)
print("PASS — gate greens on truth, reddens on a bare general-programme answer, stays green on a "
      "condition-scoped therapeutic dose, and fails loud on an unreadable store")
