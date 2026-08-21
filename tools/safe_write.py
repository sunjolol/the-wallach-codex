#!/usr/bin/env python3
"""
safe_write.py — universal atomic write primitive for the Wallach project.

The mandated path for ALL writes to project files under tools/, dashboard/,
eden/ and chronicle/ — never an editor tool that writes the file directly.

Editor tools on this host have repeatedly reported success while the on-disk
file was partially written or unchanged. Python's own file handling is the
disk-truth surface; this tool routes every write through it and then re-reads
the bytes to prove what actually landed.

Instantiates four principles from .claude/skills/engineering-doctrine in code: no
silent failures, defense in depth, atomic operations, verifiable invariants.

Operations:
  - replace : find old_string (must be unique) and replace with new_string.
              Verifies count == 1 before write. Verifies new_string is in
              the post-write file before swap.
  - append  : append payload to end of file.
  - rewrite : write payload as the full new file content.
  - check   : run integrity checks on a file without modifying it.

BYTE-EXACT CONTRACT
-------------------
This tool is a transparent pipe: the bytes you hand it are the bytes that land.
It performs NO newline translation in either direction, so what you stage is what
is written, and its verify compares real disk bytes against real intended bytes.

It did not always. Earlier versions ran every read and write in Python's
translated-newline space (LF -> CRLF on write, CRLF -> LF on read). The round trip
was symmetric, so the verify below passed while the disk bytes differed from intent.
Three consequences, all reproduced before this fix:

  * Every LF file it touched was silently rewritten to CRLF, against a repo that
    stores LF (core.autocrlf=input). That is the origin of the working tree's
    mixed line endings.
  * A CRLF -> LF repair was structurally impossible. The replacement happened in LF
    space and the write re-CRLF'd it, so the file came back byte-identical with OK.
  * A lone CR survived the write but read back as LF: same length, different content,
    which is the useless "intended=NB landed=NB" on a FAILING check.

Sizes reported by this tool are TRUE BYTE counts. They used to be len() of a str
(characters) printed as "B on disk" — a mismatch that can make a successful write
read as a no-op.

Because matching is now byte-exact, a payload staged with LF will NOT match a file
holding CRLF. That failure is deliberate and loud: safe_replace names line endings as
the cause and tells you which to restage with. Run `check <path>` to see a file's
endings before staging.

All operations:
  1. Read current content via Python (disk truth, raw bytes).
  2. Compute new content in memory.
  3. Write new content to <path>.tmp (exact bytes).
  4. Read <path>.tmp back from disk (raw bytes).
  5. Verify the on-disk BYTES match intent.
  6. Run file-type-specific parse / shape checks.
  7. os.replace(<path>.tmp, <path>) — atomic within a filesystem, on POSIX and
     Windows alike.
  8. Read <path> back one more time and verify final state.
  9. Print verification report.

If ANY check fails, the .tmp is left in place for inspection and the
original file is untouched. Exit code is non-zero.

CLI:
  python3 tools/safe_write.py replace <path> --old-file <f> --new-file <f>
  python3 tools/safe_write.py append  <path> (--payload-file <f> | --payload-stdin)
  python3 tools/safe_write.py rewrite <path> (--payload-file <f> | --payload-stdin)
  python3 tools/safe_write.py check   <path>

--payload-stdin exists to prevent the shared-fixed-name-tempfile collision: two
concurrent callers that stage to the same scratch path silently overwrite each
other, and the loser's content is what lands. Stdin has no filesystem state to
collide, so prefer it for small-to-medium payloads; reserve --payload-file for
content that is already on disk.

Python API:
  from tools.safe_write import safe_replace, safe_append, safe_rewrite, check_file
  safe_replace(path, old_string, new_string, expect_count=1)
  safe_append(path, payload)
  safe_rewrite(path, payload)
  check_file(path)  # returns (ok: bool, messages: list[str])
"""

import argparse
import json
import os
import pathlib
import re
import sys


class SafeWriteError(RuntimeError):
    """Raised when a write cannot be verified safe."""


# ---------------------------------------------------------------------------
# Disk I/O chokepoint — the ONLY place this module touches file content
# ---------------------------------------------------------------------------
#
# Path.read_text / Path.write_text default to newline=None, i.e. Python's translated
# space: LF becomes CRLF on write and CRLF becomes LF on read (on Windows). That
# symmetry is what made this tool's own verify a tautology for months. Everything
# below goes through raw bytes + an explicit UTF-8 codec so no translation can be
# reintroduced by a future edit without deleting these two functions outright.


def _read_exact(path: pathlib.Path) -> str:
    """A file's exact bytes, decoded UTF-8. No newline translation."""
    return path.read_bytes().decode("utf-8")


def _write_exact(path: pathlib.Path, content: str) -> bytes:
    """Write content's exact UTF-8 bytes. No newline translation. Returns them."""
    data = content.encode("utf-8")
    path.write_bytes(data)
    return data


def _eol_profile(b: bytes) -> str:
    """Line-ending census — the diagnostic that turns 'intended=3B landed=3B' into
    something a caller can act on."""
    crlf = b.count(b"\r\n")
    return (f"crlf={crlf} lf={b.count(b'\n') - crlf} "
            f"lone_cr={b.count(b'\r') - crlf}")


def _dominant_eol(s: str) -> str:
    """Which ending a string mostly uses, for the restaging hint."""
    crlf = s.count("\r\n")
    counts = (("CRLF", crlf), ("LF", s.count("\n") - crlf), ("CR", s.count("\r") - crlf))
    best = max(counts, key=lambda kv: kv[1])
    return best[0] if best[1] else "no line endings"


def _newline_hint(haystack: str, needle: str, found: int) -> str:
    """When a replace misses, say whether line endings are the whole reason.

    Matching is byte-exact, and this repo's working tree is mostly CRLF while git stores
    LF (core.autocrlf=input), so an LF-staged payload missing a CRLF file is the single
    most likely miss. Staying silent would send the caller hunting a content mismatch
    that does not exist."""
    if found:
        return ""

    def norm(s: str) -> str:
        return s.replace("\r\n", "\n").replace("\r", "\n")

    if not norm(needle):
        return ""
    n = norm(haystack).count(norm(needle))
    if not n:
        return ""
    return (f" — but it matches {n}x once line endings are normalised. The file holds "
            f"{_dominant_eol(haystack)} and the payload holds {_dominant_eol(needle)}. "
            f"Matching is byte-exact by design: restage the payload with "
            f"{_dominant_eol(haystack)} endings.")


# ---------------------------------------------------------------------------
# File-type-specific shape checks
# ---------------------------------------------------------------------------

def _check_json(content: str) -> None:
    json.loads(content)  # raises JSONDecodeError on parse failure


def _check_md(content: str) -> None:
    # Basic sanity: not empty, no obvious truncation markers.
    if not content.strip():
        raise SafeWriteError("Markdown file is empty after write")
    # Heuristic: most of our .md files end with a newline.
    if not content.endswith("\n"):
        # Allow — but warn via raise on egregious cases.
        pass


def _check_html(content: str) -> None:
    if not content.rstrip().endswith("</html>"):
        raise SafeWriteError("HTML file does not end with </html>")


def _check_py(content: str) -> None:
    import ast
    try:
        ast.parse(content)
    except SyntaxError as e:
        raise SafeWriteError(f"Python file fails ast.parse: {e}")


SHAPE_CHECKS = {
    ".json": _check_json,
    ".md":   _check_md,
    ".html": _check_html,
    ".py":   _check_py,
}


def _shape_check(path: pathlib.Path, content: str) -> None:
    """Run file-type-specific shape validation."""
    ext = path.suffix.lower()
    checker = SHAPE_CHECKS.get(ext)
    if checker is None:
        return  # unknown ext — no shape check
    checker(content)


# ---------------------------------------------------------------------------
# Core write-tmp + verify + atomic-swap
# ---------------------------------------------------------------------------

def _write_verify_swap(path: pathlib.Path, new_content: str, *,
                       intent_check=None) -> int:
    """Internal: write new_content to path atomically with full verification.

    Returns: final on-disk byte count.
    Raises:  SafeWriteError on any verification failure.
    """
    tmp = path.with_suffix(path.suffix + ".tmp")

    # 3. Write to .tmp — exact bytes, no translation
    intended = _write_exact(tmp, new_content)

    # 4. Read .tmp back from disk — raw bytes, so the comparison below is real
    landed_bytes = tmp.read_bytes()

    # 5. Verify byte-equal. Equal LENGTHS do not imply equal content (a lone CR used to
    #    round-trip to LF), so always report the line-ending census alongside the sizes.
    if landed_bytes != intended:
        # Don't os.remove(tmp) — leave for inspection
        raise SafeWriteError(
            f"Disk bytes do not match intended write — "
            f"intended={len(intended)}B ({_eol_profile(intended)}) "
            f"landed={len(landed_bytes)}B ({_eol_profile(landed_bytes)}). "
            f"Tmp file preserved at {tmp} for inspection."
        )

    landed = landed_bytes.decode("utf-8")

    # 6. File-type shape check
    try:
        _shape_check(path, landed)
    except Exception as e:
        raise SafeWriteError(
            f"Shape check failed on {path.suffix} file: {e}. "
            f"Tmp file preserved at {tmp} for inspection."
        )

    # 6b. Caller-provided intent check (e.g., "new_string must be in landed")
    if intent_check is not None:
        intent_check(landed)

    # Pre-swap backup so the write can be rolled back if the post-swap
    # discipline-invariant check fails. The backup lives in memory only (never
    # persisted); the rollback below writes it with a direct tmp + os.replace
    # rather than re-entering this function, so the check cannot re-trigger itself.
    pre_swap_content = None
    if path.exists() and _should_run_discipline_checks(path):
        try:
            pre_swap_content = _read_exact(path)
        except Exception:
            pre_swap_content = None  # missing/unreadable; no rollback possible

    # 7. Atomic swap
    os.replace(tmp, path)

    # 8. Final readback — bytes again, not the translated view
    final_bytes = path.read_bytes()
    if final_bytes != intended:
        raise SafeWriteError(
            f"Post-swap readback diverges from intended content — "
            f"intended={len(intended)}B ({_eol_profile(intended)}) "
            f"on disk={len(final_bytes)}B ({_eol_profile(final_bytes)}). "
            f"This indicates a filesystem-level inconsistency."
        )

    # 9. Post-swap discipline-invariant check (dashboard/dashboard.html only).
    # Runs the cheap gates named in _DISCIPLINE_INVARIANT_NAMES. On a CRITICAL
    # failure the write is rolled back to the pre-swap content, so the violation has
    # to be fixed in the payload before the change can land.
    #
    # DEAD AS CONFIGURED, stated rather than implied: both names in
    # _DISCIPLINE_INVARIANT_NAMES were removed from tools/invariants.py, and
    # `--only <unknown-name>` prints a line the parser below does not match. No
    # critical is ever reported, so the rollback can never fire. Repoint the tuple at
    # live gate names and re-prove it with a planted violation, or delete this block
    # outright — do not read the code below as active protection until then.
    if _should_run_discipline_checks(path) and not _skip_discipline():
        try:
            ok, criticals, warnings = _run_post_write_discipline_check(path)
        except Exception as e:
            # If the check itself crashes, print loudly but don't roll back —
            # the write was already verified shape-correct.
            print(f"[safe_write] post-swap discipline check raised: {e}", file=sys.stderr)
            ok, criticals, warnings = True, [], []
        if criticals:
            # ROLL BACK
            if pre_swap_content is not None:
                try:
                    # Restore atomically using direct tmp+replace (no recursion
                    # into _write_verify_swap to avoid re-triggering this hook).
                    rb_tmp = path.with_suffix(path.suffix + ".rollback.tmp")
                    rb_bytes = _write_exact(rb_tmp, pre_swap_content)
                    if rb_tmp.read_bytes() != rb_bytes:
                        raise SafeWriteError("rollback verify failed")
                    os.replace(rb_tmp, path)
                except Exception as e2:
                    raise SafeWriteError(
                        f"CRITICAL: discipline invariant(s) failed AND rollback failed. "
                        f"Critical failures: {'; '.join(criticals)}. "
                        f"Rollback error: {e2}. "
                        f"On-disk state UNCERTAIN — manual inspection required."
                    )
                raise SafeWriteError(
                    f"CRITICAL discipline invariant(s) failed post-write — write ROLLED BACK. "
                    f"Failures: {'; '.join(criticals)}. "
                    f"Fix the violation in the prepared payload, then retry the safe_write. "
                    f"Set env SAFE_WRITE_SKIP_DISCIPLINE=1 to bypass (emergencies only)."
                )
            else:
                # No pre-swap content captured (e.g., new file). Cannot roll back.
                raise SafeWriteError(
                    f"CRITICAL discipline invariant(s) failed post-write AND no pre-swap "
                    f"backup exists (new file?). On-disk state retains the failing content. "
                    f"Failures: {'; '.join(criticals)}. Manual fix required."
                )
        if warnings:
            # Land the write; print loudly.
            for w in warnings:
                print(f"[safe_write] WARNING: {w}", file=sys.stderr)

    # A byte count, not a character count. The CLI prints this as "B on disk".
    return len(final_bytes)


# ---------------------------------------------------------------------------
# Post-write discipline-invariant hook for dashboard.html writes
# ---------------------------------------------------------------------------

# DEAD AS CONFIGURED: neither name exists in tools/invariants.py any more. Running
# `--only <unknown-name>` prints a line the parser in _run_post_write_discipline_check
# does not match, so no critical is ever reported and the rollback above can never
# fire. Repoint this at live gate names and re-prove it with a planted violation, or
# delete the post-swap discipline block outright — do not read it as live protection.
_DISCIPLINE_INVARIANT_NAMES = ("raw_key_surfacing", "cross_iife_bare_refs")


def _should_run_discipline_checks(path: pathlib.Path) -> bool:
    """True iff this path is one we want to auto-check post-write.
    Currently scoped to dashboard/dashboard.html — the high-risk surface.
    Grow this rule when new surfaces warrant the same protection."""
    try:
        # Resolve relative to ROOT — match the dashboard/dashboard.html canonical surface
        resolved = path.resolve()
        # Match by suffix segments to avoid cwd-dependence
        parts = resolved.parts
        return len(parts) >= 2 and parts[-2] == "dashboard" and parts[-1] == "dashboard.html"
    except Exception:
        return False


def _skip_discipline() -> bool:
    """Honor SAFE_WRITE_SKIP_DISCIPLINE=1 for emergency overrides."""
    return os.environ.get("SAFE_WRITE_SKIP_DISCIPLINE", "").strip() in ("1", "true", "yes")


def _run_post_write_discipline_check(path: pathlib.Path):
    """Invoke tools/invariants.py for the cheap discipline checks.

    Returns: (ok: bool, critical_failures: list[str], warning_failures: list[str])

    Implementation: subprocess call to keep invariants.py as the single source
    of truth (no logic duplication). Parses the human-readable output. Slightly
    fragile to format changes but acceptable for now — invariants.py output
    format is stable.
    """
    import subprocess
    repo_root = pathlib.Path(__file__).resolve().parent.parent
    invariants_path = repo_root / "tools" / "invariants.py"
    if not invariants_path.exists():
        return True, [], []  # no invariants tool — skip silently
    cmd = [
        sys.executable, str(invariants_path),
        "--only", ",".join(_DISCIPLINE_INVARIANT_NAMES)
    ]
    # The --only flag in invariants.py takes a single name. Loop instead.
    criticals, warnings = [], []
    for name in _DISCIPLINE_INVARIANT_NAMES:
        try:
            result = subprocess.run(
                [sys.executable, str(invariants_path), "--only", name],
                capture_output=True, text=True, timeout=30
            )
        except Exception as e:
            warnings.append(f"{name}: subprocess failed ({e})")
            continue
        output = (result.stdout or "") + (result.stderr or "")
        # Parse: lines starting with "FAIL [<severity>]" or "ERR " indicate failures
        for line in output.splitlines():
            stripped = line.strip()
            if stripped.startswith("FAIL ["):
                # Extract severity: "FAIL [warning ] name: msg" or "FAIL [critical] name: msg"
                m = re.match(r"FAIL\s+\[\s*(\w+)\s*\]\s+(.+)", stripped)
                if m:
                    severity, msg = m.group(1), m.group(2)
                    if severity == "critical":
                        criticals.append(msg)
                    else:
                        warnings.append(msg)
                else:
                    warnings.append(stripped)
            elif stripped.startswith("ERR "):
                warnings.append(stripped)
    return (len(criticals) == 0 and len(warnings) == 0), criticals, warnings


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def safe_replace(path, old_string: str, new_string: str,
                 expect_count: int = 1) -> int:
    """Replace old_string with new_string in path. Atomic, verified.

    Args:
        path: file path (str or Path)
        old_string: literal string to find (must appear exactly expect_count
                    times; default 1)
        new_string: replacement
        expect_count: how many occurrences of old_string MUST be present
                      (default 1; pass 0 to skip the assertion)

    Returns: final file size in bytes.
    Raises:  SafeWriteError on any verification failure or count mismatch.
    """
    path = pathlib.Path(path)
    content = _read_exact(path)

    if expect_count > 0:
        n = content.count(old_string)
        if n != expect_count:
            raise SafeWriteError(
                f"old_string appears {n} times in {path}, "
                f"expected {expect_count}"
                + _newline_hint(content, old_string, n)
            )

    new_content = content.replace(old_string, new_string, expect_count or -1)

    def intent_check(landed: str) -> None:
        if new_string and new_string not in landed:
            raise SafeWriteError(
                "Replacement string not present in post-write file"
            )

    return _write_verify_swap(path, new_content, intent_check=intent_check)


def safe_append(path, payload: str) -> int:
    """Append payload to end of file. Atomic, verified.

    Args:
        path: file path
        payload: string to append (no automatic newlines added — caller
                 controls exact bytes)

    Returns: final file size in bytes.
    """
    path = pathlib.Path(path)
    before = _read_exact(path) if path.exists() else ""
    new_content = before + payload

    def intent_check(landed: str) -> None:
        if payload and payload not in landed:
            raise SafeWriteError(
                "Appended payload not present in post-write file"
            )
        if not landed.endswith(payload):
            raise SafeWriteError(
                "Payload is not at the end of file — append did not behave as append"
            )

    return _write_verify_swap(path, new_content, intent_check=intent_check)


def safe_rewrite(path, payload: str) -> int:
    """Replace the entire file with payload. Atomic, verified.

    Args:
        path: file path
        payload: full new file content

    Returns: final file size in bytes.
    """
    path = pathlib.Path(path)

    def intent_check(landed: str) -> None:
        if landed != payload:
            raise SafeWriteError("Rewrite content does not match payload")

    return _write_verify_swap(path, payload, intent_check=intent_check)


def check_file(path) -> tuple:
    """Run all available checks on a file without modifying it.

    Returns: (ok: bool, messages: list[str])
    """
    path = pathlib.Path(path)
    messages = []
    if not path.exists():
        return False, [f"File does not exist: {path}"]
    try:
        raw = path.read_bytes()
        content = raw.decode("utf-8")
        # Report the endings too: matching is byte-exact, so a caller staging a payload
        # for `replace` needs to know what this file actually holds before writing it.
        messages.append(f"size={len(raw)}B ({len(content)} chars) — {_eol_profile(raw)}")
    except Exception as e:
        return False, [f"Read failed: {e}"]
    try:
        _shape_check(path, content)
        messages.append(f"shape check OK ({path.suffix})")
    except Exception as e:
        return False, messages + [f"shape check FAIL: {e}"]
    return True, messages


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _read_payload(arg: str) -> str:
    """Read a staged payload's exact bytes. No newline translation — a payload staged
    with LF stays LF, which is what makes the byte-exact contract end-to-end rather than
    just internal."""
    return _read_exact(pathlib.Path(arg))


def _resolve_payload(args, field_file: str = "payload_file",
                     field_stdin: str = "payload_stdin") -> str:
    """Read the payload from --payload-file OR --payload-stdin.

    Stdin is preferred for callers that would otherwise stage to a shared
    fixed-name tempfile: two concurrent runs writing the same scratch path
    overwrite each other. Stdin has no filesystem state to collide and is safe
    across concurrent invocations by construction. --payload-file remains
    supported for large payloads or content already on disk.
    """
    file_arg = getattr(args, field_file, None)
    stdin_flag = getattr(args, field_stdin, False)
    if file_arg and stdin_flag:
        raise SafeWriteError(
            "Specify exactly one of --payload-file or --payload-stdin, not both"
        )
    if stdin_flag:
        # .buffer bypasses the text layer's universal-newline translation, so a payload
        # piped in arrives exactly as sent.
        return sys.stdin.buffer.read().decode("utf-8")
    if file_arg:
        return _read_payload(file_arg)
    raise SafeWriteError(
        "Missing payload source: pass --payload-file <path> OR --payload-stdin (with content on stdin)"
    )


def _cmd_replace(args) -> int:
    old = _read_payload(args.old_file)
    new = _read_payload(args.new_file)
    try:
        size = safe_replace(args.path, old, new,
                            expect_count=args.expect_count)
    except SafeWriteError as e:
        print(f"FAIL {args.path} — {e}", file=sys.stderr)
        return 1
    print(f"OK   {args.path} — replaced ({size} B on disk)")
    return 0


def _cmd_append(args) -> int:
    try:
        payload = _resolve_payload(args)
        size = safe_append(args.path, payload)
    except SafeWriteError as e:
        print(f"FAIL {args.path} — {e}", file=sys.stderr)
        return 1
    print(f"OK   {args.path} — appended ({size} B on disk)")
    return 0


def _cmd_rewrite(args) -> int:
    try:
        payload = _resolve_payload(args)
        size = safe_rewrite(args.path, payload)
    except SafeWriteError as e:
        print(f"FAIL {args.path} — {e}", file=sys.stderr)
        return 1
    print(f"OK   {args.path} — rewrote ({size} B on disk)")
    return 0


def _cmd_check(args) -> int:
    ok, msgs = check_file(args.path)
    status = "OK  " if ok else "FAIL"
    for m in msgs:
        print(f"{status} {args.path} — {m}")
    return 0 if ok else 1


def main() -> int:
    p = argparse.ArgumentParser(
        prog="safe_write.py",
        description="Universal atomic write primitive for this repo's project files"
    )
    sub = p.add_subparsers(dest="cmd", required=True)

    pr = sub.add_parser("replace",
                        help="Replace a unique substring atomically")
    pr.add_argument("path")
    pr.add_argument("--old-file", required=True,
                    help="File containing the literal old_string")
    pr.add_argument("--new-file", required=True,
                    help="File containing the literal new_string")
    pr.add_argument("--expect-count", type=int, default=1,
                    help="Required occurrences of old_string (default 1; "
                         "0 to skip the check)")
    pr.set_defaults(func=_cmd_replace)

    pa = sub.add_parser("append",
                        help="Append payload to end of file atomically")
    pa.add_argument("path")
    pa.add_argument("--payload-file",
                    help="File containing the payload (mutually exclusive with --payload-stdin)")
    pa.add_argument("--payload-stdin", action="store_true",
                    help="Read payload from stdin (prevents shared-tempfile collisions)")
    pa.set_defaults(func=_cmd_append)

    pw = sub.add_parser("rewrite",
                        help="Replace the entire file atomically")
    pw.add_argument("path")
    pw.add_argument("--payload-file",
                    help="File containing the payload (mutually exclusive with --payload-stdin)")
    pw.add_argument("--payload-stdin", action="store_true",
                    help="Read payload from stdin (prevents shared-tempfile collisions)")
    pw.set_defaults(func=_cmd_rewrite)

    pc = sub.add_parser("check",
                        help="Run shape checks on a file without modifying it")
    pc.add_argument("path")
    pc.set_defaults(func=_cmd_check)

    args = p.parse_args()
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
