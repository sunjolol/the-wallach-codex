#!/usr/bin/env python3
"""Negative test for shell_title_matches_runtime_default.

A new gate that has only ever been seen GREEN has not been shown to do anything. This
drives the check against a synthetic tree and re-breaks it five ways, asserting it goes
red each time -- and green on the shape that is actually correct.

Nothing here touches the real repo: every case is written into a temp directory and
invariants.ROOT is pointed at it for the duration.

WHY THE GATE EXISTS. main.ts assigns document.title = displayTitle(profile) on every boot,
so dashboard.html's <title> is overwritten before a JS-rendering crawler reads it. The
markup title is therefore inert on its own, and editing it alone fails SILENTLY -- which is
the failure mode this gate converts into a red board.

Run:  PYTHONUTF8=1 python tools/tests/test_shell_title_parity.py
Exit 0 = the gate bites; non-zero = it has stopped biting."""
import importlib.util
import shutil
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
sys.modules["invariants"] = inv
spec.loader.exec_module(inv)

TITLE = "The Wallach Codex — what your supplements miss"

SHELL = '<!doctype html>\n<html lang="en">\n<head>\n<title>{t}</title>\n</head>\n<body></body>\n</html>\n'
PROF = "const GUEST_TITLE = '{t}';\n\nexport function displayTitle(p) {{ return GUEST_TITLE; }}\n"
MAIN = "function paint(p) {\n    document.title = profileState.displayTitle(p);\n}\n"


def build(tmp, shell=None, prof=None, main=None, omit=()):
    """Write a synthetic tree and return it. `omit` drops files entirely."""
    d = Path(tmp)
    (d / "dashboard" / "assets" / "js" / "src" / "state").mkdir(parents=True, exist_ok=True)
    if "shell" not in omit:
        (d / "dashboard" / "dashboard.html").write_text(
            shell if shell is not None else SHELL.format(t=TITLE), encoding="utf-8")
    if "prof" not in omit:
        (d / "dashboard" / "assets" / "js" / "src" / "state" / "profile.ts").write_text(
            prof if prof is not None else PROF.format(t=TITLE), encoding="utf-8")
    if "main" not in omit:
        (d / "dashboard" / "assets" / "js" / "src" / "main.ts").write_text(
            main if main is not None else MAIN, encoding="utf-8")
    return d


CASES = [
    ("the correct shape — both titles identical", {}, True),
    ("THE REAL DEFECT: shell edited, runtime left behind",
     {"shell": SHELL.format(t="The Wallach Codex — what your supplements miss"),
      "prof": PROF.format(t="Your Health Journey")}, False),
    ("runtime edited, shell left behind",
     {"prof": PROF.format(t="Something Else"),
      "shell": SHELL.format(t=TITLE)}, False),
    ("a single trailing space is still a difference",
     {"prof": PROF.format(t=TITLE + " ")}, False),
    ("GUEST_TITLE renamed away", {"prof": "const OTHER = 'x';\n"}, False),
    ("the shell lost its <title>", {"shell": "<html><head></head></html>\n"}, False),
    ("main.ts stopped overwriting document.title — the premise died",
     {"main": "function paint(p) {\n    /* nothing */\n}\n"}, False),
    ("profile.ts missing entirely", {"omit": ("prof",)}, False),
]

real_root = inv.ROOT
fails = []
for name, kwargs, want_pass in CASES:
    tmp = tempfile.mkdtemp(prefix="titleparity-")
    try:
        inv.ROOT = build(tmp, **kwargs)
        ok, msg = inv.check_shell_title_matches_runtime_default()
        good = ok is want_pass
        want = "must PASS" if want_pass else "must RED "
        got = "passed" if ok else "red   "
        print(f"{'ok  ' if good else 'FAIL'} {want} · {got} · {name}")
        if not good:
            fails.append(f"{name} -> {msg}")
    finally:
        inv.ROOT = real_root
        shutil.rmtree(tmp, ignore_errors=True)

# and against the REAL tree, which must be green
ok, msg = inv.check_shell_title_matches_runtime_default()
print(f"{'ok  ' if ok else 'FAIL'} real tree · {msg}")
if not ok:
    fails.append("real tree: " + msg)

print("\nPASS — the gate reds on every drift shape and passes only on agreement"
      if not fails else "\nFAILED:\n  " + "\n  ".join(fails))
sys.exit(0 if not fails else 1)
