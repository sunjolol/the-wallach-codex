#!/usr/bin/env python3
"""
pre_write_guard.py — PreToolUse hook for Edit | Write | MultiEdit.

Enforces the write discipline at the source: no project file may be written by
any tool other than tools/safe_write.py. The Edit / Write / MultiEdit tools have
silently truncated project files on this host more than once (the incidents are
recorded under chronicle/contradictions/). This hook blocks them from touching
anything under the repo root and points the caller at safe_write.py instead.

Scratch space outside the repo root (the OS temp dir, /tmp) is allowed — that
is where payloads are staged before a safe_write call.

Sealed canonicals (design-system.css, or any file with a *.golden.sha256
sibling) get a sharper message: they need explicit user sign-off, not just
safe_write.

Contract (Claude Code hook protocol):
  stdin  : JSON { "tool_name", "tool_input": {...}, "cwd", ... }
  exit 2 : BLOCK — the stderr message is shown to the caller.
  exit 0 : ALLOW.
Fail-open: any internal error exits 0. A hook bug must never brick the session;
defense in depth lives downstream in safe_write + invariants.
"""
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]


def _allow(note=""):
    if note:
        print(f"[pre_write_guard] {note}", file=sys.stderr)
    sys.exit(0)


def _block(message):
    print(message, file=sys.stderr)
    sys.exit(2)


def main():
    try:
        raw = sys.stdin.read()
        payload = json.loads(raw) if raw.strip() else {}
    except Exception:
        _allow("could not parse stdin JSON — failing open")
        return

    tool_name = payload.get("tool_name", "")
    if tool_name not in ("Edit", "Write", "MultiEdit"):
        _allow()
        return

    tool_input = payload.get("tool_input") or {}
    raw_path = tool_input.get("file_path") or tool_input.get("path") or ""
    if not raw_path:
        _allow()  # nothing concrete to guard
        return

    # Resolve the target against the call's cwd if it is relative.
    try:
        p = Path(raw_path)
        if not p.is_absolute():
            base = payload.get("cwd") or str(REPO_ROOT)
            p = Path(base) / p
        target = p.resolve()
    except Exception:
        _allow("could not resolve target path — failing open")
        return

    # Under the repo root?  If not, it is scratch space — allowed.
    try:
        rel_posix = target.relative_to(REPO_ROOT).as_posix()
    except Exception:
        _allow()
        return

    # Sealed canonical?  (design-system.css or any *.golden.sha256 sibling)
    sealed = False
    try:
        if target.name == "design-system.css":
            sealed = True
        elif target.name.endswith(".golden.sha256"):
            sealed = True
        elif (target.parent / (target.name + ".golden.sha256")).exists():
            sealed = True
    except Exception:
        sealed = False

    if sealed:
        _block(
            f"BLOCKED ({tool_name} -> {rel_posix}): sealed canonical.\n"
            f"This file is hash-anchored and user-only. Do not edit it without "
            f"explicit user sign-off in the same patch. If signed off, route the "
            f"write through `python tools/safe_write.py` and update the matching "
            f"*.golden.sha256 sidecar."
        )
        return

    _block(
        f"BLOCKED ({tool_name} -> {rel_posix}): project files may only be "
        f"written via tools/safe_write.py.\n"
        f"Edit/Write/MultiEdit have silently truncated project files on "
        f"this mount. Instead:\n"
        f"  1. Stage the new content in a scratch file under the OS temp dir "
        f"(outside the repo), or use --payload-stdin.\n"
        f"  2. Run: python tools/safe_write.py {{replace|append|rewrite}} "
        f"{rel_posix} ...\n"
        f"safe_write does atomic-rename + readback + UTF-8/null verification."
    )


if __name__ == "__main__":
    main()
