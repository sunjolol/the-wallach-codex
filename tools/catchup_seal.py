#!/usr/bin/env python3
"""
tools/catchup_seal.py — write the catch-up integrity seal.

Round 74 / Phase B (2026-06-15). Born from Risk 9 in the system-resilience
simulation: the worry that the agent could "pretend" to catch up — claiming
to have read files in the catch-up trigger list without actually reading
them. This script writes a structured proof-of-catchup to
`memory/system/last-catchup.json` that:

  1. Records the mtime + size + first 256 bytes + last 256 bytes of each
     file the catch-up trigger references.
  2. Timestamps the seal.
  3. Provides the audit with a verifiable artifact: did catch-up happen,
     and at what file state?

The seal alone doesn't prove the agent READ the content — the agent's
first response after catch-up must also include a briefing-as-proof
(specific substantive item cited from each file). The two together
form the defense:

  - Briefing-as-proof: forces the agent to put real content from each
    file into the response. Spot-checkable by the user.
  - This seal: provides an audit trail (file state at catch-up time)
    that subsequent audits can verify.

CLI:
  python tools/catchup_seal.py        # write the seal
  python tools/catchup_seal.py --print # print summary without writing
  python tools/catchup_seal.py --list  # list the catch-up file targets

Run this at the END of the catch-up reads, before responding to the user.
"""

import argparse
import datetime
import hashlib
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from safe_write import safe_rewrite, SafeWriteError

ROOT = pathlib.Path(__file__).resolve().parent.parent
SEAL_PATH = ROOT / "memory/system/last-catchup.json"


# The catch-up trigger list — must stay in sync with the trigger list in
# brain/current.md. If the brain trigger list changes, update this constant.
# (A future audit invariant can verify these two stay in sync.)
def _current_tacitus_notebook() -> str:
    """Round 98 — derive the current-month tacitus notebook path at run-time.
    Round 100: notebook moved from memory/tacitus/ → tacitus/notebook/ as part of
    the Tacitus folder split (folder lives at project root for portability).
    The brain's catch-up trigger reads `tacitus/notebook/YYYY-MM.md` (current
    month); the seal must match what the brain reads. Computed each call
    rather than hardcoded so month-rollover doesn't require a code change."""
    now = datetime.datetime.now(datetime.timezone.utc)
    return "tacitus/notebook/{0}-{1:02d}.md".format(now.year, now.month)


# Static portion of the catch-up file list — the brain trigger reads these
# unconditionally. The current-month tacitus notebook is appended dynamically
# at the call sites below (Round 98 addition).
# Round 100: tacitus sentinel moved to tacitus/sentinel.json.
CATCHUP_FILES = [
    "memory/identity.md",
    "memory/preferences.md",
    "memory/user-prefs/index.md",
    "memory/user-prefs/communication.md",
    "memory/user-prefs/lifestyle.md",
    "memory/user-prefs/aesthetic.md",
    "memory/open-threads.md",
    "memory/essence/saga.md",
    "memory/essence/lessons.md",
    "memory/essence/decisions.md",
    "memory/operating-protocols.md",
    "memory/source-rule.md",
    "memory/engineering-doctrine.md",
    "memory/system/audit-sentinel.json",
]


def catchup_files() -> list:
    """Round 98 — the live list including the current-month tacitus notebook.
    Use this everywhere instead of CATCHUP_FILES directly."""
    return list(CATCHUP_FILES)


def _utc_now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")


def _summarize_file(path: pathlib.Path, peek_bytes: int = 256) -> dict:
    """Read mtime + size + first N + last N bytes of a file.
    Returns a dict for inclusion in the seal."""
    if not path.exists():
        return {"present": False}
    stat = path.stat()
    size = stat.st_size
    with open(path, "rb") as f:
        if size <= 2 * peek_bytes:
            # Small file — record full content via hash + verbatim peek
            raw = f.read()
            first = raw[:peek_bytes]
            last = raw[-peek_bytes:] if size > peek_bytes else b""
        else:
            first = f.read(peek_bytes)
            f.seek(-peek_bytes, 2)  # seek to N bytes before EOF
            last = f.read(peek_bytes)
    return {
        "present": True,
        "size": size,
        "mtime_iso": datetime.datetime.fromtimestamp(
            stat.st_mtime, tz=datetime.timezone.utc
        ).isoformat(timespec="seconds"),
        "sha256_first_256": hashlib.sha256(first).hexdigest()[:16],
        "sha256_last_256": hashlib.sha256(last).hexdigest()[:16],
        "first_text_preview": first.decode("utf-8", errors="replace")[:80].replace("\n", " "),
    }


def build_seal() -> dict:
    """Build the seal dict by walking the catch-up file list."""
    seal = {
        "_purpose": (
            "Catch-up integrity proof (Phase B, Round 74). Written by "
            "tools/catchup_seal.py at the end of every co-work session's "
            "catch-up reads. Records the on-disk state of every file in the "
            "catch-up trigger list at the moment the agent claims to have "
            "read them. The audit's `catchup_freshness` invariant verifies "
            "this file is fresh + plausible. Defends against the 'agent "
            "pretends to catch up' failure mode (Risk 9)."
        ),
        "schema_version": 1,
        "sealed_at": _utc_now_iso(),
        "files": {},
        "summary": {},
    }

    present_count = 0
    missing = []
    live_files = catchup_files()
    for rel in live_files:
        full = ROOT / rel
        info = _summarize_file(full)
        seal["files"][rel] = info
        if info.get("present"):
            present_count += 1
        else:
            missing.append(rel)

    seal["summary"] = {
        "total_files": len(live_files),
        "present": present_count,
        "missing": missing,
        "all_present": len(missing) == 0,
    }
    return seal


def write_seal() -> dict:
    """Build + persist the seal atomically. Returns the seal dict."""
    seal = build_seal()
    SEAL_PATH.parent.mkdir(parents=True, exist_ok=True)
    safe_rewrite(SEAL_PATH, json.dumps(seal, indent=2, ensure_ascii=False) + "\n")
    return seal


def _cmd_write(args) -> int:
    try:
        seal = write_seal()
    except SafeWriteError as e:
        print(f"FAIL — seal write failed: {e}", file=sys.stderr)
        return 1
    print(f"OK — catch-up seal written to {SEAL_PATH.relative_to(ROOT)}")
    print(f"     sealed_at: {seal['sealed_at']}")
    print(f"     files: {seal['summary']['present']}/{seal['summary']['total_files']} present")
    if seal["summary"]["missing"]:
        print(f"     MISSING: {seal['summary']['missing']}")
    return 0 if seal["summary"]["all_present"] else 1


def _cmd_print(args) -> int:
    seal = build_seal()
    print(json.dumps(seal, indent=2))
    return 0


def _cmd_list(args) -> int:
    live_files = catchup_files()
    print(f"Catch-up trigger files ({len(live_files)}):")
    for rel in live_files:
        full = ROOT / rel
        marker = "✓" if full.exists() else "✗ MISSING"
        print(f"  {marker} {rel}")
    return 0


def main() -> int:
    p = argparse.ArgumentParser(
        prog="catchup_seal.py",
        description="Write the catch-up integrity seal at session start.",
    )
    sub = p.add_subparsers(dest="cmd")
    # Default action = write
    p.add_argument("--print", action="store_true",
                   help="Print the seal to stdout without writing")
    p.add_argument("--list", action="store_true",
                   help="List the catch-up file targets")
    args = p.parse_args()

    if args.list:
        return _cmd_list(args)
    if args.print:
        return _cmd_print(args)
    return _cmd_write(args)


if __name__ == "__main__":
    sys.exit(main())
