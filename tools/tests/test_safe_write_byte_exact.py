#!/usr/bin/env python3
"""Negative test for safe_write byte-exactness + the safe_write_canary gate.

Proof artifact (§00.B "codify, don't promise"). safe_write is the primitive EVERY other
write in this repo depends on, so it is the last tool that may be trusted on faith.

THE BUG THIS PINS (diagnosed 2026-08-03, fixed same patch). Every read and write in
safe_write ran in Python's translated-newline space -- Path.write_text turned LF into CRLF,
Path.read_text turned CRLF back into LF. The round trip was SYMMETRIC, so the tool's own
`landed != new_content` verify compared two translated strings and passed no matter what
was on disk. Measured before the fix:

    handed pure LF      -> disk got CRLF, reported 17 for a 20-byte file
    asked CRLF -> LF    -> returned OK having changed ZERO bytes
    handed a lone CR    -> "intended=3B landed=3B" on a FAILING check

The second is the one that cost a session: a CRLF -> LF repair was STRUCTURALLY IMPOSSIBLE
through this path, because the replacement happened in LF space and the write re-CRLF'd it.

AND THE GATE COULD NOT SEE ANY OF IT. safe_write_canary read the probe back with
os.open(path, os.O_RDONLY) -- and on Windows os.open defaults to TEXT mode, so os.read
applied the SAME CRLF -> LF translation as the write. The gate classified `external`, the
only anchor class CLAUDE.md says can catch a wrong-but-consistent value, shared the defect
it was auditing. It was green from Round 73 to 2026-08-03 while the primitive silently
rewrote every LF file in the repo to CRLF (554 CRLF vs 154 LF at diagnosis, against a repo
that stores LF -- core.autocrlf=input).

Cases D, E and F are the load-bearing ones: they re-break the primitive on purpose and
assert the gate goes RED. A test that only shows today's code working would have passed
just as happily on the broken version.

Run:  PYTHONUTF8=1 python tools/tests/test_safe_write_byte_exact.py

Exit 0 = every case behaves; non-zero = byte-exactness or the gate's teeth are gone."""
import importlib.util
import os
import shutil
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))

import safe_write as sw  # noqa: E402

spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)

FAILS = []
TMP = Path(tempfile.mkdtemp(prefix="sw-byte-exact-"))


def report(name, ok, detail=""):
    print("%s %-26s %s" % ("ok  " if ok else "FAIL", name, detail))
    if not ok:
        FAILS.append((name, detail))


def scratch(name, initial=b"seed"):
    p = TMP / name
    p.write_bytes(initial)
    return p


# ---------------------------------------------------------------------------
# A. every newline form survives a round trip byte-exact
# ---------------------------------------------------------------------------
def case_roundtrip():
    payloads = {
        "lf":       "alpha\nbeta\ngamma\n",
        "crlf":     "alpha\r\nbeta\r\ngamma\r\n",
        "lone_cr":  "alpha\rbeta\rgamma\r",
        "mixed":    "lf\ncrlf\r\nlone\rend\n",
        "no_eol":   "no trailing newline at all",
        "non_ascii": "café · § —\n",
    }
    for label, payload in payloads.items():
        p = scratch("rt_%s.txt" % label)
        sw.safe_rewrite(p, payload)
        got = p.read_bytes()
        want = payload.encode("utf-8")
        report("roundtrip[%s]" % label, got == want,
               "" if got == want else "wrote %r, disk holds %r" % (want, got))


# ---------------------------------------------------------------------------
# B. the returned size is a BYTE count, not a character count
# ---------------------------------------------------------------------------
def case_size_is_bytes():
    payload = "café · —\n"          # 9 chars, 13 bytes
    p = scratch("size.txt")
    reported = sw.safe_rewrite(p, payload)
    actual = p.stat().st_size
    report("size_is_true_bytes", reported == actual != len(payload),
           "reported=%d actual=%d chars=%d" % (reported, actual, len(payload)))


# ---------------------------------------------------------------------------
# C. the repair that was structurally impossible before the fix
# ---------------------------------------------------------------------------
def case_crlf_to_lf_repair():
    p = scratch("repair.txt", b"one\r\ntwo\r\nthree\r\n")
    sw.safe_replace(p, "one\r\ntwo\r\nthree\r\n", "one\ntwo\nthree\n")
    got = p.read_bytes()
    report("crlf_to_lf_repair", got == b"one\ntwo\nthree\n",
           "disk holds %r" % got)

    # ...and the inverse, so the tool is not merely biased toward LF
    q = scratch("repair2.txt", b"a\nb\n")
    sw.safe_replace(q, "a\nb\n", "a\r\nb\r\n")
    got2 = q.read_bytes()
    report("lf_to_crlf_repair", got2 == b"a\r\nb\r\n", "disk holds %r" % got2)


# ---------------------------------------------------------------------------
# D. LOAD-BEARING -- reintroduce the translating write; the gate must go RED
# ---------------------------------------------------------------------------
def case_gate_catches_translation():
    probe_tmp = ROOT / "tools" / "canaries" / "safe-write-probe.txt.tmp"
    original = sw._write_exact

    def translating_write(path, content):
        """A faithful `Path.write_text(newline=None)` revert: the disk gets CRLF while the
        caller's intent stays LF. This is the shape a careless revert actually takes, and
        the step-5 BYTE verify inside _write_verify_swap has to be what catches it."""
        path.write_bytes(content.replace("\r\n", "\n").replace("\n", "\r\n").encode("utf-8"))
        return content.encode("utf-8")          # intent, untranslated

    def symmetric_translation(path, content):
        """The nastier shape: the translation leaks into the reported intent too, so the
        byte verify compares two matching translated buffers -- the exact symmetry that
        made the old verify a tautology. Only the independent os.read(O_BINARY) readback
        can catch this one."""
        data = content.replace("\r\n", "\n").replace("\n", "\r\n").encode("utf-8")
        path.write_bytes(data)
        return data

    for label, fake in (("byte_verify", translating_write),
                        ("symmetric", symmetric_translation)):
        try:
            sw._write_exact = fake
            ok, msg = inv.check_safe_write_canary()
            report("gate_catches_translation[%s]" % label, not ok,
                   "gate said: %s" % msg[:74] if not ok else
                   "**GATE STAYED GREEN with newline translation reintroduced**")
        finally:
            sw._write_exact = original
            if probe_tmp.exists():
                probe_tmp.unlink()      # a failed write leaves its .tmp behind by design


# ---------------------------------------------------------------------------
# E. LOAD-BEARING -- reintroduce the character-count return; gate must go RED
# ---------------------------------------------------------------------------
def case_gate_catches_char_count():
    original = sw._write_verify_swap

    def char_counting_swap(path, new_content, *, intent_check=None):
        original(path, new_content, intent_check=intent_check)
        return len(new_content)          # characters, printed as "B on disk"

    try:
        sw._write_verify_swap = char_counting_swap
        ok, msg = inv.check_safe_write_canary()
        report("gate_catches_char_count", not ok,
               "gate said: %s" % msg[:88] if not ok else
               "**GATE STAYED GREEN with a character count reported as bytes**")
    finally:
        sw._write_verify_swap = original


# ---------------------------------------------------------------------------
# F. LOAD-BEARING -- the gate's own reader must return TRUE disk bytes
# ---------------------------------------------------------------------------
def case_reader_is_external():
    p = scratch("reader.txt", b"a\r\nb\r\n")
    got = inv._read_via_os(p)
    report("read_via_os_is_byte_exact", got == b"a\r\nb\r\n", "returned %r" % got)

    if hasattr(os, "O_BINARY"):
        # Demonstrate WHY the flag is load-bearing: without it this platform translates,
        # which is precisely how the gate audited a write using the write's own defect.
        fd = os.open(str(p), os.O_RDONLY)
        try:
            naive = os.read(fd, 4096)
        finally:
            os.close(fd)
        report("naive_os_read_translates", naive == b"a\nb\n",
               "os.open without O_BINARY returned %r -- this is the trap" % naive)
    else:
        print("ok   naive_os_read_translates  (POSIX: no translation either way)")


# ---------------------------------------------------------------------------
# G. the newline diagnostic fires on an EOL miss and STAYS SILENT otherwise
# ---------------------------------------------------------------------------
def case_newline_hint():
    p = scratch("hint.txt", b"hello\r\nworld\r\nend\r\n")
    try:
        sw.safe_replace(p, "hello\nworld\n", "X\n")
        report("hint_on_eol_miss", False, "an LF payload must NOT match a CRLF file")
    except sw.SafeWriteError as e:
        said = "line endings" in str(e) and "CRLF" in str(e)
        report("hint_on_eol_miss", said, "message names the cause" if said else str(e))

    try:
        sw.safe_replace(p, "genuinely-absent-string", "X")
        report("no_hint_on_real_miss", False, "a missing string must still raise")
    except sw.SafeWriteError as e:
        quiet = "line endings" not in str(e)
        report("no_hint_on_real_miss", quiet,
               "stays quiet" if quiet else "blamed line endings for a content miss: %s" % e)


# ---------------------------------------------------------------------------
# H. append must not impose endings on the file it appends to
# ---------------------------------------------------------------------------
def case_append_preserves():
    p = scratch("append.txt", b"first\r\n")
    sw.safe_append(p, "second\n")
    got = p.read_bytes()
    report("append_preserves_both", got == b"first\r\nsecond\n", "disk holds %r" % got)


def main():
    print("safe_write byte-exactness -- %s\n" % TMP)
    try:
        case_roundtrip()
        case_size_is_bytes()
        case_crlf_to_lf_repair()
        print()
        case_gate_catches_translation()
        case_gate_catches_char_count()
        case_reader_is_external()
        print()
        case_newline_hint()
        case_append_preserves()
    finally:
        shutil.rmtree(TMP, ignore_errors=True)

    print()
    if FAILS:
        print("%d CASE(S) FAILED -- safe_write is translating again, or the canary lost its "
              "teeth:" % len(FAILS))
        for n, why in FAILS:
            print("  %s: %s" % (n, why))
        return 1
    print("all cases behave -- safe_write is a byte-exact pipe and safe_write_canary bites.")
    print("(pre-fix 2026-08-03: LF became CRLF, a CRLF->LF repair was impossible, and the")
    print(" gate was green through all of it because its reader shared the translation.)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
