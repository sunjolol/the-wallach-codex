#!/usr/bin/env python3
"""implementation_log.py — canonical persistent record of Cura/Vision finding outcomes.

Round 108 (2026-06-17). Per the user's stated value: *"if anything ever gets
implemented/rejected on accident or without my knowledge/full understanding I
can look back and easily say 'wait... I never approved/rejected that'"* — the
log is the audit trail that makes finding-fate visible and verifiable.

Shape: append-only JSONL at `memory/system/implementations.jsonl`. Each entry
records ONE outcome decision for ONE deepen-survivor from a Tacitus session.
Status updates (e.g., implemented → in_progress → implemented) are recorded
as separate append entries; the latest entry for a given (source_date,
source_mode, source_session, candidate) tuple is the current status.

Truth anchor: every entry's (source_date, source_mode, source_session) MUST
reference a real notebook session header. The `check_implementations_log_
well_formed` invariant verifies this on every daily audit. Drift between
log claims and actual state is caught within 24 hours.

USAGE
    # Record an implementation (called from closing-move-atomic of executing round)
    python tools/implementation_log.py append \\
        --source-date 2026-06-17 --source-mode Cura --source-session 1 \\
        --candidate "open-threads.md cross-section staleness" \\
        --status implemented --round 107 \\
        --summary "Codified as operating-protocols §1 bullet 6"

    # List all entries
    python tools/implementation_log.py list

    # Query by filter
    python tools/implementation_log.py query --status implemented
    python tools/implementation_log.py query --source-date 2026-06-17

    # Get latest status for one specific finding (used by build script)
    python tools/implementation_log.py latest \\
        --source-date 2026-06-17 --source-mode Cura --source-session 1 \\
        --candidate "open-threads.md cross-section staleness"

Library API:
    from implementation_log import append_entry, latest_status, all_entries
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path


def _normalize_candidate(s: str) -> str:
    """Round 121 — strip surface-level formatting differences before
    candidate prefix-matching. Backticks, smart-quotes, em-dashes,
    colons, etc. are formatting noise that shouldn't break the (date,
    mode, session, candidate) identity tuple. Vision session #2's
    candidates carried backticks around code identifiers
    (`check_cura_phase_0_present`) and double-quotes around concept
    names ("last refreshed") in the parsed notebook prose; the
    user-friendly log entries we appended omitted those, so the
    first-60-char comparison fell out. Normalize both sides identically
    before comparing.
    """
    s = (s or "").lower().strip()
    # Replace common formatting variants with a single space:
    # - backticks (code-fence markers in notebook prose)
    # - smart quotes (curly single + double)
    # - straight quotes (single + double)
    # - em-dash, en-dash, hyphen (different writers use different ones)
    # - colon, semicolon, comma, period (subtitle separators)
    for ch in "`‘’“”'\"—–-:;,.":
        s = s.replace(ch, " ")
    # Collapse runs of whitespace to single space
    s = re.sub(r"\s+", " ", s).strip()
    return s[:60]

REPO = Path(__file__).resolve().parent.parent
LOG_PATH = REPO / "memory" / "system" / "implementations.jsonl"

_EDT = timezone(timedelta(hours=-4))

ALLOWED_STATUSES = {"implemented", "in_progress", "rejected", "deferred"}
ALLOWED_MODES = {"Cura", "Vision", "Aegis"}


def _now_iso() -> str:
    return datetime.now(_EDT).isoformat(timespec="seconds")


def _append(entry: dict) -> None:
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    line = json.dumps(entry, ensure_ascii=False) + "\n"
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        f.write(line)
        f.flush()


def all_entries() -> list[dict]:
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
                continue
    return entries


def append_entry(
    *,
    source_date: str,
    source_mode: str,
    source_session: int,
    candidate: str,
    status: str,
    round_num: int | None = None,
    summary: str = "",
) -> dict:
    """Append a status entry. Validates status + mode against allowlist."""
    if status not in ALLOWED_STATUSES:
        raise ValueError(
            f"status must be one of {sorted(ALLOWED_STATUSES)}, got {status!r}"
        )
    if source_mode not in ALLOWED_MODES:
        raise ValueError(
            f"source_mode must be one of {sorted(ALLOWED_MODES)}, got {source_mode!r}"
        )
    entry = {
        "ts": _now_iso(),
        "source_date": source_date,
        "source_mode": source_mode,
        "source_session": int(source_session),
        "candidate": candidate,
        "status": status,
        "summary": summary,
    }
    if round_num is not None:
        entry["round"] = int(round_num)
    _append(entry)
    return entry


def latest_status(
    *,
    source_date: str,
    source_mode: str,
    source_session: int,
    candidate: str,
) -> dict | None:
    """Return the LATEST entry matching the tuple (status updates supersede).

    Match strategy on candidate: case-insensitive prefix match on the first
    60 characters. This tolerates light editing of the survivor title in the
    notebook prose between Cura's writing and the user's later reference.
    """
    target_key = (source_date, source_mode, int(source_session), _normalize_candidate(candidate))
    latest = None
    for e in all_entries():
        # Round 148 bug fix: user-mode entries carry source_session=null.
        # Calling int(None) raised TypeError under the old code, and
        # build_tacitus_dashboard_live.py silently swallowed it via
        # `except Exception: impl = None`, dropping ALL impl-badges from
        # the dashboard. Skip entries whose session is None — they can
        # never match a Cura/Vision session-keyed lookup anyway.
        raw_sess = e.get("source_session")
        if raw_sess is None:
            continue
        e_key = (
            e.get("source_date"),
            e.get("source_mode"),
            int(raw_sess),
            _normalize_candidate(e.get("candidate", "") or ""),
        )
        if e_key == target_key:
            latest = e
    return latest


def by_source(source_date: str | None = None, source_mode: str | None = None,
              status: str | None = None) -> list[dict]:
    """Filter entries by any combination of source_date, source_mode, status."""
    out = []
    for e in all_entries():
        if source_date and e.get("source_date") != source_date:
            continue
        if source_mode and e.get("source_mode") != source_mode:
            continue
        if status and e.get("status") != status:
            continue
        out.append(e)
    return out


def _cli() -> int:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = p.add_subparsers(dest="cmd", required=True)

    p_append = sub.add_parser("append", help="Record an outcome entry")
    p_append.add_argument("--source-date", required=True)
    p_append.add_argument("--source-mode", required=True, choices=sorted(ALLOWED_MODES))
    p_append.add_argument("--source-session", required=True, type=int)
    p_append.add_argument("--candidate", required=True)
    p_append.add_argument("--status", required=True, choices=sorted(ALLOWED_STATUSES))
    p_append.add_argument("--round", type=int, default=None, dest="round_num")
    p_append.add_argument("--summary", default="")

    sub.add_parser("list", help="Show all entries")

    p_query = sub.add_parser("query", help="Filter entries")
    p_query.add_argument("--source-date", default=None)
    p_query.add_argument("--source-mode", default=None, choices=sorted(ALLOWED_MODES) + [None])
    p_query.add_argument("--status", default=None, choices=sorted(ALLOWED_STATUSES) + [None])

    p_latest = sub.add_parser("latest", help="Get latest status for one finding")
    p_latest.add_argument("--source-date", required=True)
    p_latest.add_argument("--source-mode", required=True, choices=sorted(ALLOWED_MODES))
    p_latest.add_argument("--source-session", required=True, type=int)
    p_latest.add_argument("--candidate", required=True)

    args = p.parse_args()

    if args.cmd == "append":
        entry = append_entry(
            source_date=args.source_date,
            source_mode=args.source_mode,
            source_session=args.source_session,
            candidate=args.candidate,
            status=args.status,
            round_num=args.round_num,
            summary=args.summary,
        )
        print(f"recorded: [{entry['ts']}] {entry['source_mode']} #{entry['source_session']} "
              f"({entry['source_date']}) — {entry['status']} — {entry['candidate'][:60]}")
        return 0

    if args.cmd == "list":
        entries = all_entries()
        if not entries:
            print("(implementations.jsonl is empty)")
            return 0
        print(f"{len(entries)} entries:")
        for e in entries:
            r = f" Round {e['round']}" if e.get("round") else ""
            print(f"  [{e['ts']}] {e['source_mode']} #{e['source_session']} "
                  f"({e['source_date']}) — {e['status']}{r} — {(e.get('candidate','') or '')[:60]}")
        return 0

    if args.cmd == "query":
        entries = by_source(
            source_date=args.source_date,
            source_mode=args.source_mode,
            status=args.status,
        )
        if not entries:
            print("(no entries matched)")
            return 0
        print(f"{len(entries)} matched:")
        for e in entries:
            r = f" Round {e['round']}" if e.get("round") else ""
            print(f"  [{e['ts']}] {e['source_mode']} #{e['source_session']} "
                  f"({e['source_date']}) — {e['status']}{r} — {(e.get('candidate','') or '')[:60]}")
        return 0

    if args.cmd == "latest":
        e = latest_status(
            source_date=args.source_date,
            source_mode=args.source_mode,
            source_session=args.source_session,
            candidate=args.candidate,
        )
        if not e:
            print("(no entry for this finding)")
            return 1
        r = f" Round {e['round']}" if e.get("round") else ""
        print(f"[{e['ts']}] {e['source_mode']} #{e['source_session']} "
              f"({e['source_date']}) — {e['status']}{r}")
        print(f"  candidate: {e.get('candidate', '')}")
        if e.get("summary"):
            print(f"  summary:   {e['summary']}")
        return 0

    return 2


if __name__ == "__main__":
    raise SystemExit(_cli())
