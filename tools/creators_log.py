#!/usr/bin/env python3
"""tools/creators_log.py — CLI writer for the Creator's Log file-mirror.

The Creator's Log is the §00 audit trail (.claude/rules/logging-doctrine.md
rule 6). In-app it lives in localStorage via state/log.ts::log(); this tool is
the CLI mirror that makes the Round-close ritual's step 5 fireable from the
terminal, and keeps the log in the repo as a committed teaching record.

Appends ONE schema-valid JSON line to chronicle/creators-log.jsonl through
safe_write (§17 atomic-verify). The entry shape mirrors
core/schemas/log.ts::LogEntrySchema; KINDS mirrors LogKindSchema — if that enum
grows, update KINDS here in the same patch (the creators_log_well_formed
invariant validates every committed line against this same allowlist).

Usage:
  PYTHONUTF8=1 python tools/creators_log.py append --surface tools \\
      --kind milestone --summary "..." [--detail "..."] \\
      [--metadata-json '{"k":"v"}']
  PYTHONUTF8=1 python tools/creators_log.py verify          # validate every line
  PYTHONUTF8=1 python tools/creators_log.py list [--n 10]   # scan recent entries
"""
import argparse
import datetime
import json
import pathlib
import random
import sys
import time

ROOT = pathlib.Path(__file__).resolve().parent.parent
LOG_PATH = ROOT / "chronicle" / "creators-log.jsonl"
sys.path.insert(0, str(ROOT / "tools"))
import safe_write  # noqa: E402

# Mirrors core/schemas/log.ts::LogKindSchema — keep in sync (same patch).
KINDS = (
    "session-start", "session-end", "round-close", "build", "invariant-pass",
    "invariant-fail", "incident", "milestone", "design-decision", "note",
)
SUMMARY_MAX = 280  # mirrors LogEntrySchema.summary.max(280)
_B36 = "0123456789abcdefghijklmnopqrstuvwxyz"


def _b36(n: int) -> str:
    if n == 0:
        return "0"
    out = ""
    while n:
        n, r = divmod(n, 36)
        out = _B36[r] + out
    return out


def _gen_id() -> str:
    """Mirror state/log.ts: lg_<base36 ms>_<6 base36 rand>."""
    rand = "".join(random.choice(_B36) for _ in range(6))
    return f"lg_{_b36(int(time.time() * 1000))}_{rand}"


def _now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def validate_entry(e: dict) -> list[str]:
    """Return a list of problems (empty = valid). Mirrors LogEntrySchema."""
    errs: list[str] = []
    for field in ("id", "ts", "surface", "kind", "summary"):
        v = e.get(field)
        if not isinstance(v, str) or not v:
            errs.append(f"missing/empty {field}")
    if e.get("kind") not in KINDS:
        errs.append(f"kind {e.get('kind')!r} not in allowlist")
    summ = e.get("summary")
    if isinstance(summ, str) and len(summ) > SUMMARY_MAX:
        errs.append(f"summary >{SUMMARY_MAX} chars ({len(summ)})")
    if "detail" in e and not isinstance(e["detail"], str):
        errs.append("detail not a string")
    if "metadata" in e and not isinstance(e["metadata"], dict):
        errs.append("metadata not an object")
    return errs


def _read_lines() -> list[str]:
    if not LOG_PATH.exists():
        return []
    return [ln for ln in LOG_PATH.read_text(encoding="utf-8").splitlines() if ln.strip()]


def cmd_append(args) -> None:
    entry: dict = {
        "id": _gen_id(),
        "ts": _now_iso(),
        "surface": args.surface,
        "kind": args.kind,
        "summary": args.summary,
    }
    if args.detail is not None:
        entry["detail"] = args.detail
    if args.metadata_json is not None:
        try:
            md = json.loads(args.metadata_json)
        except json.JSONDecodeError as ex:
            print(f"--metadata-json is not valid JSON: {ex}", file=sys.stderr)
            sys.exit(2)
        if not isinstance(md, dict):
            print("--metadata-json must be a JSON object", file=sys.stderr)
            sys.exit(2)
        entry["metadata"] = md
    errs = validate_entry(entry)
    if errs:
        print("INVALID entry: " + "; ".join(errs), file=sys.stderr)
        sys.exit(2)
    line = json.dumps(entry, ensure_ascii=False, separators=(",", ":")) + "\n"
    safe_write.safe_append(LOG_PATH, line)
    print(f"OK  appended {entry['kind']} entry {entry['id']}")


def verify_file() -> tuple[bool, list[str], int]:
    """Validate every line of the ledger. Returns (ok, problems, total_lines).

    Single source of validation truth — both the `verify` CLI command and the
    `creators_log_well_formed` invariant call this so they can never drift.
    """
    lines = _read_lines()
    problems: list[str] = []
    for i, ln in enumerate(lines, 1):
        try:
            e = json.loads(ln)
        except json.JSONDecodeError as ex:
            problems.append(f"line {i}: JSON parse error: {ex}")
            continue
        if not isinstance(e, dict):
            problems.append(f"line {i}: not a JSON object")
            continue
        for err in validate_entry(e):
            problems.append(f"line {i}: {err}")
    return (len(problems) == 0, problems, len(lines))


def cmd_verify(_args) -> None:
    ok, problems, total = verify_file()
    for p in problems:
        print(p, file=sys.stderr)
    print(f"{total} entr{'y' if total == 1 else 'ies'}, {len(problems)} problem(s)")
    sys.exit(0 if ok else 1)


def cmd_list(args) -> None:
    for ln in _read_lines()[-args.n:]:
        e = json.loads(ln)
        print(f"{e['ts']}  [{e['kind']:14}] {e['surface']:12} {e['summary']}")


def main() -> None:
    ap = argparse.ArgumentParser(description="Creator's Log CLI mirror")
    sub = ap.add_subparsers(dest="cmd", required=True)

    pa = sub.add_parser("append", help="append one validated entry")
    pa.add_argument("--surface", required=True, help="origin surface/module")
    pa.add_argument("--kind", required=True, choices=KINDS, help="entry kind")
    pa.add_argument("--summary", required=True, help=f"<= {SUMMARY_MAX} chars")
    pa.add_argument("--detail", default=None, help="optional longer body")
    pa.add_argument("--metadata-json", default=None, help="optional JSON object")
    pa.set_defaults(func=cmd_append)

    pv = sub.add_parser("verify", help="validate every line")
    pv.set_defaults(func=cmd_verify)

    pl = sub.add_parser("list", help="print recent entries")
    pl.add_argument("--n", type=int, default=10, help="how many (default 10)")
    pl.set_defaults(func=cmd_list)

    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
