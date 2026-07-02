#!/usr/bin/env python3
"""
post_write_verify.py — PostToolUse hook for Bash.

Independent corruption re-scan of every project file written via safe_write.
safe_write already does atomic-rename + readback + UTF-8/null verification AT
write time; this hook re-reads the file a moment LATER to catch the §17
incident-#5 class: corruption that appears AFTER a verified write with no
identified trigger (filesystem indexer, sync daemon, the Win<->Linux mount
layer). Detection is this hook's job; the git anchor (v0.0.0-pre-cleanup) is the
recovery.

Why Bash (not Edit|Write|MultiEdit): pre_write_guard BLOCKS those tools from
touching repo files, so every real repo write is a `python tools/safe_write.py`
call routed through Bash. This hook parses safe_write's `OK <path> — …` success
lines out of the command's stdout and scans exactly those paths.

Per-file checks (open 'rb'):
  - no NUL byte (b"\\x00")        — the mass-corruption signature
  - decodes as UTF-8 round-trip  — caught incident #4 (mid-char cut at byte 2638)
  - non-empty                    — caught truncation-to-zero

Contract: stdin JSON {tool_name:"Bash", tool_input:{command}, tool_response:…}.
exit 2 = surface the corruption to the agent (with a git-checkout recovery hint).
exit 0 = clean / not-applicable. Fail-open on any internal error — a hook bug
must never brick the session; defense-in-depth lives in safe_write + the anchor.
"""
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
# safe_write prints e.g. "OK   chronicle/build-log.md — appended (52211 B on disk)".
# The (?!\[) guard skips invariants.py lines ("OK   [critical] name: … — …") that
# share the em-dash shape but are NOT safe_write paths (else they parse as a bogus
# path that then "vanished" — a false PostToolUse block, SESSION 37).
OK_LINE = re.compile(r"^OK\s+(?!\[)(\S.*?)\s+—", re.MULTILINE)


def _ok(note=""):
    if note:
        print(f"[post_write_verify] {note}", file=sys.stderr)
    sys.exit(0)


def _flag(message):
    print(message, file=sys.stderr)
    sys.exit(2)


def _stdout_of(resp):
    if isinstance(resp, str):
        return resp
    if isinstance(resp, dict):
        return (resp.get("stdout") or "") + "\n" + (resp.get("stderr") or "")
    return ""


def main():
    try:
        raw = sys.stdin.buffer.read().decode("utf-8", errors="replace")
        payload = json.loads(raw) if raw.strip() else {}
    except Exception:
        _ok("unparseable stdin — failing open")
        return

    if payload.get("tool_name") != "Bash":
        _ok()
        return
    cmd = (payload.get("tool_input") or {}).get("command", "") or ""
    if "safe_write.py" not in cmd:
        _ok()  # not one of our writes — nothing to verify
        return

    out = _stdout_of(payload.get("tool_response"))
    paths = OK_LINE.findall(out)
    if not paths:
        _ok()  # safe_write produced no OK line (it FAILed loudly itself, or was a check)
        return

    problems = []
    for raw_path in paths:
        raw_path = raw_path.strip().strip('"').strip("'")
        try:
            p = Path(raw_path)
            if not p.is_absolute():
                p = REPO_ROOT / p
            target = p.resolve()
            target.relative_to(REPO_ROOT)  # only scan repo files
        except Exception:
            continue
        if not target.exists():
            problems.append(f"{raw_path}: vanished after write")
            continue
        try:
            data = target.read_bytes()
        except Exception as e:
            problems.append(f"{raw_path}: unreadable post-write ({e})")
            continue
        if b"\x00" in data:
            problems.append(f"{raw_path}: NUL byte(s) present — corruption signature")
        try:
            data.decode("utf-8")
        except UnicodeDecodeError as e:
            problems.append(f"{raw_path}: not valid UTF-8 ({e})")
        if len(data) == 0:
            problems.append(f"{raw_path}: empty after write")

    if problems:
        _flag(
            "POST-WRITE CORRUPTION DETECTED (independent re-scan after safe_write):\n  - "
            + "\n  - ".join(problems)
            + "\nRecover before continuing:\n"
            "  git checkout HEAD -- <path>     # restore the last committed copy\n"
            "or re-run the safe_write from the staged payload, then:\n"
            "  python tools/safe_write.py check <path>"
        )
        return
    _ok()


if __name__ == "__main__":
    main()
