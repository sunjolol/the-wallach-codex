#!/usr/bin/env python3
"""
pre_bash_guard.py — PreToolUse hook for Bash.

A deliberately NARROW blocklist for catastrophic or §17-corrupting shell
commands. Everything not explicitly dangerous is allowed — a bash guard that
cripples normal shell work is worse than none. Backed by defense-in-depth:
safe_write, invariants, and the git recovery anchor.

BLOCKS (exit 2):
  • git push --force / -f (not --force-with-lease) — rewrites remote history
  • git reset --hard                               — destroys uncommitted work
  • git clean -d… -x/-X                            — nukes untracked + ignored
  • rm with -r and -f on a catastrophic target (/ ~ $HOME . ./ *)
  • direct bash writes (> >> tee sed -i) into a banned project dir, or any
    cp/mv/redirect touching design-system.css — the §17 corruption surface.
    Use tools/safe_write.py instead. (safe_write.py invocations are exempt.)

Contract: stdin JSON {"tool_name":"Bash","tool_input":{"command":"..."}}.
exit 2 = block (stderr shown to agent); exit 0 = allow. Fail-open on error.
"""
import json
import re
import sys

BANNED_DIRS = ("chronicle", "tools", "memory", "knowledge", "schemas", "eden")


def _allow(note=""):
    if note:
        print(f"[pre_bash_guard] {note}", file=sys.stderr)
    sys.exit(0)


def _block(reason):
    print(f"BLOCKED (Bash): {reason}", file=sys.stderr)
    sys.exit(2)


def main():
    try:
        raw = sys.stdin.read()
        payload = json.loads(raw) if raw.strip() else {}
    except Exception:
        _allow("unparseable stdin — failing open")
        return

    if payload.get("tool_name") != "Bash":
        _allow()
        return
    cmd = (payload.get("tool_input") or {}).get("command", "") or ""
    if not cmd.strip():
        _allow()
        return

    # git push --force / -f  (allow --force-with-lease)
    if re.search(r"\bgit\s+push\b.*?(--force(?!-with-lease)\b|\s-f\b)", cmd, re.DOTALL):
        _block("git push --force rewrites remote history — ask the user, or use --force-with-lease.")
        return
    # git reset --hard
    if re.search(r"\bgit\s+reset\b.*?--hard\b", cmd, re.DOTALL):
        _block("git reset --hard destroys uncommitted work. Stash/commit first or get user confirmation.")
        return
    # git clean -d + -x/-X
    if re.search(r"\bgit\s+clean\b", cmd) and re.search(r"-[a-zA-Z]*d", cmd) and re.search(r"-[a-zA-Z]*[xX]", cmd):
        _block("git clean -dx removes untracked AND ignored files. Delete specific paths instead.")
        return
    # rm -r -f on a catastrophic target
    rm = re.search(r"\brm\s+([^\n;&|]+)", cmd)
    if rm:
        args = rm.group(1)
        has_r = bool(re.search(r"(?:^|\s)-[a-zA-Z]*r|--recursive", args))
        has_f = bool(re.search(r"(?:^|\s)-[a-zA-Z]*f|--force", args))
        if has_r and has_f and re.search(r"(?:^|\s)(/|\.|\./|\*|~|\$HOME)(?:\s|$|/)", args):
            _block("rm -rf on a catastrophic target (/ ~ $HOME . ./ *). Scope the delete to a specific path.")
            return

    # §17 direct bash write into a banned project dir, or sealed css
    if "safe_write.py" not in cmd:
        dirs = "|".join(BANNED_DIRS)
        if re.search(r"(?:>>?\s*|\btee\s+(?:-a\s+)?|\bsed\s+-i\S*\s+[^|]*?)['\"]?(?:%s)/" % dirs, cmd):
            _block("direct bash write into a banned project dir (chronicle/ tools/ memory/ "
                   "knowledge/ schemas/ eden/ tacitus/). This is the §17 corruption surface — "
                   "route through `python tools/safe_write.py {replace|append|rewrite}`.")
            return
        if re.search(r"(?:>>?|\btee\b|\bsed\s+-i|\bcp\b|\bmv\b)[^|]*design-system\.css", cmd):
            _block("direct write to sealed design-system.css (user-only, hash-anchored). "
                   "Needs user sign-off + safe_write + golden-hash update.")
            return

    _allow()


if __name__ == "__main__":
    main()
