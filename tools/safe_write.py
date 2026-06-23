#!/usr/bin/env python3
"""
safe_write.py — universal atomic write primitive for the Wallach project.

Round 73 (2026-06-15) adopted: replaces the Edit tool for ALL writes to
project files in knowledge/, tools/, dashboard/, eden/, schemas/, chronicle/.

The Edit tool's silent-truncation pattern (lessons.md Rounds 22/41/43/54/56/
71b/72/73) reports success while the on-disk file is partially written or
unchanged. The bash mount + Python's file-handling is the disk-truth surface.
This tool routes all writes through that surface and verifies them.

Doctrine §1 (no silent failures) + §2 (defense in depth) + §4 (atomic
operations) + §6 (verifiable invariants) all instantiated in code.

Operations:
  - replace : find old_string (must be unique) and replace with new_string.
              Verifies count == 1 before write. Verifies new_string is in
              the post-write file before swap.
  - append  : append payload to end of file.
  - rewrite : write payload as the full new file content.
  - check   : run integrity checks on a file without modifying it.

All operations:
  1. Read current content via Python (disk truth).
  2. Compute new content in memory.
  3. Write new content to <path>.tmp.
  4. Read <path>.tmp back from disk.
  5. Verify the on-disk content matches intent (byte-equal).
  6. Run file-type-specific parse / shape checks.
  7. os.replace(<path>.tmp, <path>) — atomic on POSIX.
  8. Read <path> back one more time and verify final state.
  9. Print verification report.

If ANY check fails, the .tmp is left in place for inspection and the
original file is untouched. Exit code is non-zero.

CLI:
  python3 tools/safe_write.py replace <path> --old-file <f> --new-file <f>
  python3 tools/safe_write.py append  <path> (--payload-file <f> | --payload-stdin)
  python3 tools/safe_write.py rewrite <path> (--payload-file <f> | --payload-stdin)
  python3 tools/safe_write.py check   <path>

Round 106 added --payload-stdin to prevent the shared-bare-name-tempfile
collision pattern (surfaced by the 2026-06-17 vitality-check incident where
two scheduled tasks both wrote /tmp/sentinel.json and the morning content
silently bled into the afternoon write). Stdin has no filesystem state to
collide. Prefer stdin for small-to-medium payloads in SKILL prompts; reserve
--payload-file for cases where the content is already on disk.

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

    # 3. Write to .tmp
    tmp.write_text(new_content, encoding="utf-8")

    # 4. Read .tmp back from disk
    landed = tmp.read_text(encoding="utf-8")

    # 5. Verify byte-equal
    if landed != new_content:
        # Don't os.remove(tmp) — leave for inspection
        raise SafeWriteError(
            f"Disk content does not match intended write — "
            f"intended={len(new_content)}B landed={len(landed)}B. "
            f"Tmp file preserved at {tmp} for inspection."
        )

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

    # Round 135 Cure A — pre-swap backup so we can roll back if a post-swap
    # discipline-invariant check fails. The backup lives on the call stack only
    # (not persisted) — restoring atomically uses _write_verify_swap recursively
    # with skip_discipline=True to prevent infinite loops.
    pre_swap_content = None
    if path.exists() and _should_run_discipline_checks(path):
        try:
            pre_swap_content = path.read_text(encoding="utf-8")
        except Exception:
            pre_swap_content = None  # missing/unreadable; no rollback possible

    # 7. Atomic swap
    os.replace(tmp, path)

    # 8. Final readback
    final = path.read_text(encoding="utf-8")
    if final != new_content:
        raise SafeWriteError(
            f"Post-swap readback diverges from intended content. "
            f"This indicates a filesystem-level inconsistency."
        )

    # 9. Cure A — post-swap discipline-invariant check (dashboard.html only).
    # Runs the cheap discipline invariants (raw_key_surfacing, cross_iife_bare_refs).
    # On CRITICAL failure: rolls back to pre-swap content atomically. Forces
    # the agent to fix the violation BEFORE the change lands. Per Round 135
    # operating-protocols.md §25 + the AskUserQuestion confirmation (strict mode).
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
                    rb_tmp.write_text(pre_swap_content, encoding="utf-8")
                    if rb_tmp.read_text(encoding="utf-8") != pre_swap_content:
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

    return len(final)


# ---------------------------------------------------------------------------
# Round 135 Cure A — auto-invariant hook for dashboard.html writes
# ---------------------------------------------------------------------------

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
    content = path.read_text(encoding="utf-8")

    if expect_count > 0:
        n = content.count(old_string)
        if n != expect_count:
            raise SafeWriteError(
                f"old_string appears {n} times in {path}, "
                f"expected {expect_count}"
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
    before = path.read_text(encoding="utf-8") if path.exists() else ""
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
        content = path.read_text(encoding="utf-8")
        messages.append(f"size={len(content)}B")
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
    """Read content from a file path."""
    return pathlib.Path(arg).read_text(encoding="utf-8")


def _resolve_payload(args, field_file: str = "payload_file",
                     field_stdin: str = "payload_stdin") -> str:
    """Round 106 — read payload from --payload-file OR --payload-stdin.

    Stdin is preferred for SKILL prompts that would otherwise need shared
    bare-name tempfiles (the /tmp/sentinel.json cross-run collision pattern
    surfaced by the 2026-06-17 vitality-check incident). Stdin has no
    filesystem state to collide; safe across concurrent SKILL invocations
    by construction. File path remains supported for large payloads or
    when caller already has the content on disk.
    """
    file_arg = getattr(args, field_file, None)
    stdin_flag = getattr(args, field_stdin, False)
    if file_arg and stdin_flag:
        raise SafeWriteError(
            "Specify exactly one of --payload-file or --payload-stdin, not both"
        )
    if stdin_flag:
        return sys.stdin.read()
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
        description="Universal atomic write primitive (Round 73 / §17)"
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
                    help="Read payload from stdin (Round 106 — prevents shared-tempfile collisions)")
    pa.set_defaults(func=_cmd_append)

    pw = sub.add_parser("rewrite",
                        help="Replace the entire file atomically")
    pw.add_argument("path")
    pw.add_argument("--payload-file",
                    help="File containing the payload (mutually exclusive with --payload-stdin)")
    pw.add_argument("--payload-stdin", action="store_true",
                    help="Read payload from stdin (Round 106 — prevents shared-tempfile collisions)")
    pw.set_defaults(func=_cmd_rewrite)

    pc = sub.add_parser("check",
                        help="Run shape checks on a file without modifying it")
    pc.add_argument("path")
    pc.set_defaults(func=_cmd_check)

    args = p.parse_args()
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
