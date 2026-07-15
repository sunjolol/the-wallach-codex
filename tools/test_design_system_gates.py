#!/usr/bin/env python3
"""Negative test for the three design-system gates (Phase 0 / sealed-canonical protection).

Proof artifact (§00.B "codify, don't promise" / R7). These three are declared
severity="critical" and, until 2026-07-15, were STRUCTURALLY INCAPABLE of reddening the
board:

    _design_system_mode() read tacitus/feature-flags.json[design_system_enforcement].
    That file -- and the whole tacitus/ directory -- DOES NOT EXIST. The lookup hit a bare
    `except` and returned "warn"; in warn mode _ds_finalize() converted every violation
    into a PASS. Proven by forging a hash mismatch: the gate returned
    (True, "WARN (1 finding(s)) — design-system.css hash deadbeef... does not match
    golden 37c338b7..."). It printed "OK [critical]" directly above the violation text.

    The header even claimed "promotion criteria from 'warn' to 'error' are documented in
    the feature flag itself" -- documented in a file that never existed. invariants.py was
    its only reader. A knob whose off-switch is a missing file is not a knob, it is a
    disarm.

Every case below is a forgery that MUST now RED. `forged_hash_mismatch` is the exact
experiment that exposed the disarm; if it ever returns GREEN again, the escape hatch is
back.

`silent_reseal` is the one that adds NEW coverage: hash_integrity proves css == golden and
is structurally blind to an agent editing the css AND re-sealing the golden together. Only
the git anchor sees that (§00.B #11 -- stale-to-stale equality is not truth).

Run:  PYTHONUTF8=1 python tools/test_design_system_gates.py

Exit 0 = every forgery reddens; non-zero = a critical gate stopped biting."""
import importlib.util
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)

FAKE = "deadbeef" * 8
fails = []


def case(name, ok, msg, want_red, why):
    good = (ok is False) if want_red else (ok is True)
    print("%s %-22s expect=%-5s got=%-5s  %s"
          % ("ok  " if good else "FAIL", name, "RED" if want_red else "GREEN",
             "RED" if not ok else "GREEN", (msg or "")[:66]))
    if not good:
        fails.append((name, why, msg))


# 0. baseline: all three green on the real tree
for n, fn in (("hash_integrity", inv.check_design_system_hash_integrity),
              ("write_protection", inv.check_design_system_write_protection),
              ("external_style", inv.check_no_external_style_resources)):
    ok, msg = fn()
    case("real_" + n, ok, msg, False, "must be green on the real tree or it is unusable")

print()

# 1. THE EXPERIMENT that exposed the disarm: forge a content hash mismatch.
_real_hash = inv._file_hash
inv._file_hash = lambda p: FAKE
try:
    ok, msg = inv.check_design_system_hash_integrity()
    case("forged_hash_mismatch", ok, msg, True,
         "THE case: pre-2026-07-15 this returned (True, 'WARN (1 finding(s)) ...'). If it "
         "is GREEN again, the warn-mode escape hatch is back and a critical gate is fake")
finally:
    inv._file_hash = _real_hash

# 2. NEW COVERAGE: a silent re-seal (css edited AND golden moved together) is invisible to
#    hash_integrity by construction; only the git anchor catches it.
_real_run = subprocess.run


def _fake_git(args, **kw):
    if args[:2] == ["git", "show"]:
        class R:
            returncode = 0
            stdout = FAKE + "\n"
            stderr = ""
        return R()
    return _real_run(args, **kw)


inv.subprocess.run = _fake_git
try:
    ok, msg = inv.check_design_system_write_protection()
    case("silent_reseal", ok, msg, True,
         "an agent editing the css and re-sealing the golden together keeps css==golden, so "
         "hash_integrity cannot see it. The git anchor must")
finally:
    inv.subprocess.run = _real_run

# 3. the git anchor must fail CLOSED when git is unreachable, never silently pass
def _boom(*a, **k):
    raise OSError("git unavailable")


inv.subprocess.run = _boom
try:
    ok, msg = inv.check_design_system_write_protection()
    case("git_unreachable", ok, msg, True,
         "an unreachable anchor must fail CLOSED -- a bare except returning a pass is the "
         "exact bug that disarmed these three gates in the first place")
finally:
    inv.subprocess.run = _real_run

# 4. the mode knob must be GONE, not merely defaulted
print()
src = (ROOT / "tools" / "invariants.py").read_text(encoding="utf-8")
gone = ("_design_system_mode" not in src) and ("tacitus" not in src.split("THE MODE KNOB")[1][:400]
                                               if "THE MODE KNOB" in src else True)
print("%s mode_knob_deleted      expect=True  got=%s"
      % ("ok  " if "_design_system_mode" not in src else "FAIL",
         "_design_system_mode" not in src))
if "_design_system_mode" in src:
    fails.append(("mode_knob_deleted",
                  "the mode knob must be DELETED, not re-defaulted -- a re-introduced knob "
                  "reading a nonexistent file would disarm these three again", ""))

print()
if fails:
    print("%d CASE(S) FAILED — a 'critical' design gate is not critical:" % len(fails))
    for n, why, msg in fails:
        print("  %s: %s" % (n, why))
        if msg:
            print("     got: %s" % msg[:140])
    sys.exit(1)
print("all cases behave — the three design gates can actually fail.")
sys.exit(0)
