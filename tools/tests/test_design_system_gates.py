#!/usr/bin/env python3
"""Negative test for the three design-system gates (sealed-canonical protection).

Proof artifact (§00.B "codify, don't promise"). These three are declared severity="critical"
and were once STRUCTURALLY INCAPABLE of reddening the board:

    a _design_system_mode() helper read an enforcement flag out of a feature-flag file that
    DID NOT EXIST. The lookup hit a bare `except` and returned "warn"; in warn mode
    _ds_finalize() converted every violation into a PASS. Proven by forging a hash mismatch:
    the gate returned (True, "WARN (1 finding(s)) — design-system.css hash deadbeef... does
    not match golden 37c338b7..."). It printed "OK [critical]" directly above the violation
    text.

    The header even claimed the promotion criteria from 'warn' to 'error' were documented in
    the feature flag itself -- documented in a file that never existed, and invariants.py was
    its only reader. A knob whose off-switch is a missing file is not a knob, it is a
    disarm.

Every case below is a forgery that MUST now RED. `forged_hash_mismatch` is the exact
experiment that exposed the disarm; if it ever returns GREEN again, the escape hatch is
back.

`silent_reseal` is the one that adds NEW coverage: hash_integrity proves css == golden and
is structurally blind to an agent editing the css AND re-sealing the golden together. Only
the git anchor sees that (§00.B #11 -- stale-to-stale equality is not truth).

Run:  PYTHONUTF8=1 python tools/tests/test_design_system_gates.py

Exit 0 = every forgery reddens; non-zero = a critical gate stopped biting."""
import importlib.util
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
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
#    Patches _lf_file_hash, NOT _file_hash: since 2026-07-15 the gate hashes LF-normalized
#    content. Patching the old name would leave the gate calling the REAL function, so this
#    case would go GREEN against expect=RED and the suite would fail loudly (verified).
_real_hash = inv._lf_file_hash
inv._lf_file_hash = lambda p: FAKE
try:
    ok, msg = inv.check_design_system_hash_integrity()
    case("forged_hash_mismatch", ok, msg, True,
         "THE case: pre-2026-07-15 this returned (True, 'WARN (1 finding(s)) ...'). If it "
         "is GREEN again, the warn-mode escape hatch is back and a critical gate is fake")
finally:
    inv._lf_file_hash = _real_hash

# 1b. PROOF that the EOL fix is a TIGHTENING, not a loosening. The PAIR is the
#     point: the gate must ignore line endings and NOTHING else.
#
#     THE BUG IT GUARDS: the gate hashed RAW bytes. design-system.css is CRLF in this working
#     tree but git stores the blob LF (`git ls-files --eol` -> `i/lf w/crlf`; core.autocrlf=
#     input does not convert on checkout). So the golden recorded the digest of a byte
#     sequence git had NEVER stored: green on the sealing machine, RED on every fresh clone —
#     a critical gate reading as TAMPERING of a sealed canonical when nothing was tampered
#     with. These cases run against real temp files through the gate's own function.
_tmp = Path(tempfile.mkdtemp(prefix="ds_eol_"))
_css_bytes = (ROOT / "dashboard" / "assets" / "styles" / "design-system.css").read_bytes()
_as_lf = _css_bytes.replace(b"\r\n", b"\n").replace(b"\r", b"\n")
_as_crlf = _as_lf.replace(b"\n", b"\r\n")

_f_lf = _tmp / "lf.css"
_f_lf.write_bytes(_as_lf)
_f_crlf = _tmp / "crlf.css"
_f_crlf.write_bytes(_as_crlf)

_golden = (ROOT / "dashboard" / "assets" / "styles"
           / "design-system.golden.sha256").read_text(encoding="utf-8").strip().split()[0]

# 1b-i. EOL-AGNOSTIC: identical content under both line endings must hash identically, and
#       must equal the sealed golden. This is the case the PRE-FIX gate fails.
case("eol_agnostic",
     inv._lf_file_hash(_f_lf) == inv._lf_file_hash(_f_crlf) == _golden, "", False,
     "the fix's whole claim: ONE digest for the same content regardless of EOL, equal to the "
     "golden. If this REDs, the seal is anchored to one machine's line endings again and "
     "every fresh clone REDs a critical gate")

# 1b-ii. NEGATIVE CONTROL — the load-bearing half. A real content edit (one byte, NOT an EOL
#        byte) must STILL move the digest. Without this, "ignores line endings" could be
#        satisfied by a function that ignores everything. A test that cannot reproduce the
#        bug it guards proves nothing.
_f_edit = _tmp / "edited.css"
_f_edit.write_bytes(_as_lf.replace(b"}", b"} ", 1))  # one added space inside real css
case("content_edit_still_caught",
     inv._lf_file_hash(_f_edit) != inv._lf_file_hash(_f_lf), "", False,
     "the EOL fix must not loosen the seal. A one-byte NON-EOL edit must still change the "
     "digest, or LF-normalizing has quietly disarmed the gate it was meant to repair")

# 1b-iii. The raw-byte hasher must remain RAW — eden/graphics/*.jpg are binary and marked
#         `binary` in .gitattributes; LF-normalizing a JPEG's hash would corrupt that seal.
#         _file_hash keeps a live caller (the graphics gate), so prove it did not drift.
case("file_hash_still_raw",
     inv._file_hash(_f_lf) != inv._file_hash(_f_crlf), "", False,
     "_file_hash must still see EOL differences: it hashes the binary graphics canonicals, "
     "where raw bytes ARE the truth. If it stopped distinguishing, the split was botched")

shutil.rmtree(_tmp, ignore_errors=True)

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
