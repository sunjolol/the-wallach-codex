#!/usr/bin/env python3
"""tools/creators_log.py — CLI writer for the Creator's Log file-mirror.

The Creator's Log is the §00 sacred audit trail (.claude/rules/logging-doctrine.md
— "The two layers" + "The sacred covenant"). In-app it lives in localStorage via
state/log.ts::log(); this tool is the CLI mirror that makes the Round-close
ritual's step 5 fireable from the terminal and keeps the log in the repo as a
committed, append-only teaching record.

Layout (chronicle/creators-log/):
  log.jsonl  — THE canonical append-only ledger (one schema-valid JSON entry per
               line; machine source of truth; NEVER edited/deleted/reordered).
  LOG.md     — GENERATED human-readable digest, newest first (regenerated from
               log.jsonl on every append; never hand-edited).
  README.md  — orientation + the sacred covenant + how to read/append.

`append` auto-stamps id + ISO-8601 UTC ts, validates against the LogEntrySchema
shape (mirrors core/schemas/log.ts), appends one JSON line through
safe_write.safe_append (§17 atomic-verify), then regenerates LOG.md. KINDS
mirrors LogKindSchema — if that enum grows, update KINDS here in the same patch
(the creators_log_well_formed invariant reuses verify_file() below).

Usage:
  PYTHONUTF8=1 python tools/creators_log.py append --surface tools \\
      --kind milestone --summary "..." [--detail "..."] \\
      [--metadata-json '{"k":"v"}']
  PYTHONUTF8=1 python tools/creators_log.py verify          # validate every line
  PYTHONUTF8=1 python tools/creators_log.py digest          # regenerate LOG.md
  PYTHONUTF8=1 python tools/creators_log.py list [--n 10]   # scan recent entries
"""
import argparse
import datetime
import json
import pathlib
import random
import re
import sys
import time

ROOT = pathlib.Path(__file__).resolve().parent.parent
LOG_DIR = ROOT / "chronicle" / "creators-log"
LOG_PATH = LOG_DIR / "log.jsonl"
DIGEST_PATH = LOG_DIR / "LOG.md"
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
    if isinstance(summ, str) and ("\n" in summ or "\r" in summ):
        errs.append("summary contains a newline (must be a single-line headline)")
    if "detail" in e and not isinstance(e["detail"], str):
        errs.append("detail not a string")
    if "metadata" in e and not isinstance(e["metadata"], dict):
        errs.append("metadata not an object")
    return errs


def _read_lines() -> list[str]:
    if not LOG_PATH.exists():
        return []
    return [ln for ln in LOG_PATH.read_text(encoding="utf-8").splitlines() if ln.strip()]


def read_entries() -> list[dict]:
    """Parsed entries in file order (oldest first). Skips unparseable lines —
    verify_file() is the gate that flags those."""
    out = []
    for ln in _read_lines():
        try:
            e = json.loads(ln)
        except json.JSONDecodeError:
            continue
        if isinstance(e, dict):
            out.append(e)
    return out


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


def _fmt_ts(ts: str) -> str:
    """ISO-8601 -> 'YYYY-MM-DD HH:MM UTC' for the human digest (best-effort)."""
    try:
        dt = datetime.datetime.fromisoformat(ts)
        return dt.strftime("%Y-%m-%d %H:%M UTC")
    except Exception:
        return ts


def _flatten(s: str) -> str:
    """Collapse any newline run to a single space so user content can never
    inject extra markdown blocks (a fake heading/entry) into the human digest."""
    return re.sub(r"[\r\n]+", " ", s).strip()


def _safe_md(s: str) -> str:
    """Digest-safe headline: flattened + a leading markdown control char escaped
    so a crafted summary cannot masquerade as a heading/quote (a separate entry)."""
    s = _flatten(s)
    if s[:1] in "#>":
        s = "\\" + s
    return s


def render_digest() -> str:
    """Render LOG.md from the canonical ledger — newest first. Pure function of
    log.jsonl, so it can be diffed against the on-disk LOG.md (digest-sync)."""
    entries = read_entries()
    head = (
        "<!-- GENERATED by tools/creators_log.py — DO NOT EDIT BY HAND.\n"
        "     Canonical source of truth: log.jsonl (append-only). -->\n"
        "# The Creator's Log\n\n"
        "The sacred, append-only audit trail of this project — what we did and why,\n"
        "so the path is never lost (see `.claude/rules/logging-doctrine.md`). The\n"
        "machine source of truth is `log.jsonl` (one entry per line, never edited);\n"
        "this file is a generated human-readable view, **newest first**.\n\n"
        f"_{len(entries)} entr{'y' if len(entries) == 1 else 'ies'} · "
        "deterministic render of log.jsonl_\n\n---\n"
    )
    blocks = []
    for e in reversed(entries):
        line = f"\n## {_fmt_ts(e.get('ts', ''))} · {e.get('kind', '?')} · {e.get('surface', '?')}\n"
        line += _safe_md(e.get("summary", "") or "") + "\n"
        detail = e.get("detail")
        if isinstance(detail, str) and detail.strip():
            line += f"  ↳ {_flatten(detail)}\n"
        blocks.append(line)
    return head + "".join(blocks)


def write_digest() -> int:
    """Regenerate LOG.md from the ledger via safe_write. Returns bytes written."""
    return safe_write.safe_rewrite(DIGEST_PATH, render_digest())


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
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    safe_write.safe_append(LOG_PATH, line)
    write_digest()
    print(f"OK  appended {entry['kind']} entry {entry['id']} (digest regenerated)")


def cmd_verify(_args) -> None:
    ok, problems, total = verify_file()
    for p in problems:
        print(p, file=sys.stderr)
    print(f"{total} entr{'y' if total == 1 else 'ies'}, {len(problems)} problem(s)")
    sys.exit(0 if ok else 1)


def cmd_digest(_args) -> None:
    n = write_digest()
    print(f"OK  regenerated {DIGEST_PATH.relative_to(ROOT).as_posix()} ({n} B)")


def cmd_list(args) -> None:
    for e in read_entries()[-args.n:]:
        print(f"{e.get('ts','')}  [{e.get('kind','?'):14}] {e.get('surface','?'):12} {e.get('summary','')}")


def main() -> None:
    ap = argparse.ArgumentParser(description="Creator's Log CLI mirror (sacred, append-only)")
    sub = ap.add_subparsers(dest="cmd", required=True)

    pa = sub.add_parser("append", help="append one validated entry + regenerate the digest")
    pa.add_argument("--surface", required=True, help="origin surface/module")
    pa.add_argument("--kind", required=True, choices=KINDS, help="entry kind")
    pa.add_argument("--summary", required=True, help=f"<= {SUMMARY_MAX} chars")
    pa.add_argument("--detail", default=None, help="optional longer body")
    pa.add_argument("--metadata-json", default=None, help="optional JSON object")
    pa.set_defaults(func=cmd_append)

    pv = sub.add_parser("verify", help="validate every line")
    pv.set_defaults(func=cmd_verify)

    pd = sub.add_parser("digest", help="regenerate LOG.md from the ledger")
    pd.set_defaults(func=cmd_digest)

    pl = sub.add_parser("list", help="print recent entries")
    pl.add_argument("--n", type=int, default=10, help="how many (default 10)")
    pl.set_defaults(func=cmd_list)

    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
