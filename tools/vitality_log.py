#!/usr/bin/env python3
"""vitality_log.py — persistent append-only log for vitality-check lapse findings.

Round 105 (2026-06-17). Closes the failure mode surfaced when the 9 AM EDT
vitality check wrote a real lapse to `memory/system/audit-sentinel.json`,
which was then silently overwritten by subsequent system_audit.py runs that
were locally clean. The vitality finding (essence stale relative to active
dashboard work) was unresolved; the surface that announced it had been
clobbered; the agent didn't see it until the user mentioned it ~5 hours later.

The structural fix: vitality findings persist to their own append-only log
that audit runs do not write to. Each finding records timestamp, kind,
summary, and status. Resolution is recorded as a separate append-only entry
that refers to the original finding's timestamp. Unresolved findings are any
"active" entries without a matching resolution — surfaced via
`latest_unresolved()` and the `check_no_unresolved_vitality_findings`
invariant in `tools/invariants.py`.

The vitality-check task's SKILL prompt invokes this tool's CLI to record
findings. The agent's closing-move-atomic discipline (operating-protocols
§21) requires reading this log before declaring a round closed.

USAGE
    # Append a new finding (called by the vitality check scheduled task)
    python3 tools/vitality_log.py append --kind essence_stale --summary "..."

    # Mark a finding resolved (by timestamp of the finding)
    python3 tools/vitality_log.py resolve --ts 2026-06-17T13:00:00-04:00 --note "Round 103 close"

    # Print status: unresolved + recent log
    python3 tools/vitality_log.py status

    # CI-friendly: exit 1 if any unresolved, 0 if clean
    python3 tools/vitality_log.py unresolved

Library API:
    from vitality_log import record_lapse, mark_resolved, latest_unresolved, summarize
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
LOG_PATH = REPO / "memory" / "system" / "vitality-findings.jsonl"

# EDT/EST offset for human-readable timestamps. Eastern time is the project's
# canonical timezone (Creator's Log discipline since 2026-06-13).
_EDT = timezone(timedelta(hours=-4))


def _now_iso() -> str:
    return datetime.now(_EDT).isoformat(timespec="seconds")


def _append(entry: dict) -> None:
    """Atomic append: write-line + fsync. JSONL is forgiving of partial writes
    because each line is a complete record; a partial last line is ignored
    on read via the try/except in _read_entries."""
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    line = json.dumps(entry, ensure_ascii=False) + "\n"
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        f.write(line)
        f.flush()


def _read_entries() -> list[dict]:
    if not LOG_PATH.exists():
        return []
    entries = []
    with open(LOG_PATH, encoding="utf-8") as f:
        for raw in f:
            raw = raw.strip()
            if not raw:
                continue
            try:
                entries.append(json.loads(raw))
            except json.JSONDecodeError:
                # Skip partial/corrupt lines; the log is best-effort durable.
                continue
    return entries


def record_lapse(kind: str, summary: str, *, source: str = "vitality-check") -> dict:
    """Append an active lapse finding. Returns the recorded entry."""
    entry = {
        "ts": _now_iso(),
        "kind": kind,
        "summary": summary,
        "status": "active",
        "source": source,
    }
    _append(entry)
    return entry


def mark_resolved(ref_ts: str, note: str) -> dict:
    """Append a resolution entry referring to the original finding's ts.

    Does NOT mutate the original entry — the log is append-only. The
    "is this lapse resolved" question is answered by walking the log:
    a lapse is resolved iff a later entry with kind=resolution carries
    ref_ts equal to the lapse's ts."""
    entry = {
        "ts": _now_iso(),
        "kind": "resolution",
        "ref_ts": ref_ts,
        "note": note,
    }
    _append(entry)
    return entry


def latest_unresolved() -> list[dict]:
    """Return the list of active findings that don't have a matching
    resolution entry. Caller can decide whether to act on them."""
    entries = _read_entries()
    resolved_refs = {
        e.get("ref_ts") for e in entries
        if e.get("kind") == "resolution" and e.get("ref_ts")
    }
    return [
        e for e in entries
        if e.get("status") == "active" and e.get("ts") not in resolved_refs
    ]


def summarize() -> str:
    """Human-readable status summary. Used by `status` CLI subcommand."""
    entries = _read_entries()
    if not entries:
        return "vitality-findings.jsonl is empty (no findings recorded yet)"
    unresolved = latest_unresolved()
    lines = []
    if unresolved:
        lines.append(f"!! {len(unresolved)} UNRESOLVED vitality findings:")
        for e in unresolved:
            lines.append(f"   - [{e['ts']}] {e.get('kind','')}: {e.get('summary','')[:160]}")
    else:
        lines.append("OK — no unresolved vitality findings")
    lines.append("")
    lines.append(f"Recent log entries (most recent 5 of {len(entries)} total):")
    for e in entries[-5:]:
        if e.get("kind") == "resolution":
            lines.append(f"   resolved: ref_ts={e.get('ref_ts','')} — {e.get('note','')[:80]}")
        else:
            lines.append(f"   {e.get('ts','')} [{e.get('kind','')}] {e.get('summary','')[:80]}")
    return "\n".join(lines)


def _cli() -> int:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = p.add_subparsers(dest="cmd", required=True)

    p_append = sub.add_parser("append", help="Record a new lapse finding")
    p_append.add_argument("--kind", required=True, help="Lapse category: essence_stale, embed_drift, etc.")
    p_append.add_argument("--summary", required=True, help="Single-line description of the lapse")
    p_append.add_argument("--source", default="vitality-check", help="Source task name")

    p_resolve = sub.add_parser("resolve", help="Mark a prior finding resolved")
    p_resolve.add_argument("--ts", required=True, help="Timestamp of the finding to resolve")
    p_resolve.add_argument("--note", required=True, help="How it was resolved")

    sub.add_parser("status", help="Print summary of recent findings + unresolved")
    sub.add_parser("unresolved", help="Exit 1 if any unresolved, 0 if clean (for CI/audit)")

    args = p.parse_args()

    if args.cmd == "append":
        entry = record_lapse(args.kind, args.summary, source=args.source)
        print(f"recorded: {entry['ts']} [{entry['kind']}] {entry['summary']}")
        return 0

    if args.cmd == "resolve":
        entry = mark_resolved(args.ts, args.note)
        print(f"resolution recorded: ref_ts={entry['ref_ts']} note={entry['note']}")
        return 0

    if args.cmd == "status":
        print(summarize())
        return 0

    if args.cmd == "unresolved":
        unresolved = latest_unresolved()
        if unresolved:
            for e in unresolved:
                print(f"unresolved: {e['ts']} [{e.get('kind','')}] {e.get('summary','')}")
            return 1
        print("no unresolved findings")
        return 0

    return 2


if __name__ == "__main__":
    sys.exit(_cli())
