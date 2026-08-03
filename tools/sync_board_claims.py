#!/usr/bin/env python3
"""Sync CLAUDE.md's board description to the live INVARIANTS registry.

`board_claims_match_reality` reddens whenever CLAUDE.md's stated gate total or external-anchor
count drifts from the registry. That gate tells you the doc is wrong; this tool fixes it, reading
both numbers off the registry so a hand-typed count can never be reintroduced.

Run it after adding or removing any invariant:

    PYTHONUTF8=1 python tools/sync_board_claims.py

Exit 0 = in sync (nothing written, or written and verified). Non-zero = the claims are no longer
where this tool expects them, which means the sentence was reworded and this tool must be
re-anchored rather than silently skipped.
"""
import importlib.util
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from safe_write import safe_replace, _read_exact  # noqa: E402

spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)

TOTAL = len(inv.INVARIANTS)
EXTERNAL = sum(1 for i in inv.INVARIANTS if i.anchor_class == "external")

DOC = ROOT / "CLAUDE.md"
text = _read_exact(DOC)

TOTAL_RE = re.compile(r"(invariants\.py`[^\n]*?)(\d+)(\s+gates)")
EXT_RE = re.compile(r"(Only the\s+)~?\s*(\d+)(\s+gates anchored outside)")

edits, missing = [], []

m = TOTAL_RE.search(text)
if not m:
    missing.append("the '<N> gates' claim beside the invariants.py command")
elif int(m.group(2)) != TOTAL:
    edits.append(("gate total", m.group(0), m.group(1) + str(TOTAL) + m.group(3)))

m = EXT_RE.search(text)
if not m:
    missing.append("the 'Only the <N> gates anchored outside' claim")
elif int(m.group(2)) != EXTERNAL:
    edits.append(("external count", m.group(0), m.group(1) + str(EXTERNAL) + m.group(3)))

if missing:
    print("FAIL — CLAUDE.md no longer states " + " and ".join(missing))
    print("       The sentence was reworded. Re-anchor this tool and the gate together;")
    print("       do not delete the claim to make either of them quiet.")
    raise SystemExit(1)

if not edits:
    print(f"in sync — {TOTAL} gates, {EXTERNAL} externally anchored")
    raise SystemExit(0)

for label, old, new in edits:
    safe_replace(DOC, old, new)
    print(f"  {label}: {old.strip()!r} -> {new.strip()!r}")

ok, msg = inv.check_board_claims_match_reality()
print(("OK   " if ok else "FAIL ") + msg)
raise SystemExit(0 if ok else 1)
