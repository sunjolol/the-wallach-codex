#!/usr/bin/env python3
"""
Trace-mineral verification sweep helper.

Purpose: drive the 56-product manual verification of YGY trace-mineral data.
User-paste-driven; agent (Claude) parses each paste into a structured nutrient
delta against products-db.json; user confirms; commits atomically.

Subcommands:
  list                — show queue progress + next pending
  next                — print the next pending product's prompt block
  prompt <product_id> — print the prompt block for a specific product
  status <product_id> <new_status>  — set status (pending | in_progress | verified | skipped)
  raw   <product_id>  — read paste content from stdin and store as raw_paste backup
  log                 — append the current commit to memory/trace-verification-log.md

Cross-platform Python discipline (Round 74): UTF-8 explicit, sys.executable,
pathlib.Path, datetime.timezone.utc.

Atomicity: state file written via tools/safe_write.py (atomic on-disk replace).
The raw_paste backup is preserved for every product so we can re-derive a delta
if a parse turns out wrong. Doctrine-compliant per source-rule.md.
"""

from __future__ import annotations

import argparse
import datetime as _dt
import json
import os
import pathlib
import subprocess
import sys
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parent.parent
STATE_PATH = ROOT / 'knowledge' / '_trace_verification_state.json'
PRODUCTS_DB_PATH = ROOT / 'knowledge' / 'products-db.json'
LOG_PATH = ROOT / 'memory' / 'trace-verification-log.md'
RAW_DIR = ROOT / 'knowledge' / '_trace_verification_raw'


def _load_state() -> dict[str, Any]:
    with open(STATE_PATH, encoding='utf-8') as f:
        return json.load(f)


def _save_state(state: dict[str, Any]) -> None:
    # Use safe_write for atomic replace
    payload = json.dumps(state, indent=2, ensure_ascii=False)
    safe = ROOT / 'tools' / 'safe_write.py'
    p = subprocess.run(
        [sys.executable, str(safe), 'rewrite', str(STATE_PATH), '--payload-stdin'],
        input=payload, encoding='utf-8', capture_output=True,
    )
    if p.returncode != 0:
        # Fallback: atomic rename
        tmp = STATE_PATH.with_suffix('.tmp')
        tmp.write_text(payload, encoding='utf-8')
        os.replace(tmp, STATE_PATH)


def _now_iso() -> str:
    return _dt.datetime.now(_dt.timezone.utc).isoformat(timespec='seconds')


def _now_eastern_human() -> str:
    # Eastern time human-readable (matches Creator's Log discipline)
    # On Linux this works; on Windows fall back to UTC string
    try:
        return subprocess.check_output(
            ['date', '+%Y-%m-%d at %-I:%M %p'],
            env={**os.environ, 'TZ': 'America/New_York'},
            encoding='utf-8',
        ).strip()
    except Exception:
        return _now_iso()


def _get_entry(state: dict, product_id: str) -> dict | None:
    for q in state['queue']:
        if q['product_id'] == product_id:
            return q
    return None


def _recompute_totals(state: dict) -> None:
    from collections import Counter
    c = Counter(q['status'] for q in state['queue'])
    state['totals'] = {
        'queued': len(state['queue']),
        'pending': c.get('pending', 0),
        'in_progress': c.get('in_progress', 0),
        'verified': c.get('verified', 0),
        'skipped': c.get('skipped', 0),
    }


# ─────────────────────────── Subcommands ───────────────────────────


def cmd_list(args: argparse.Namespace) -> int:
    state = _load_state()
    _recompute_totals(state)
    print(f"Queue: {state['totals']['verified']}/{state['totals']['queued']} verified "
          f"({state['totals']['pending']} pending, "
          f"{state['totals'].get('in_progress',0)} in_progress, "
          f"{state['totals']['skipped']} skipped)")
    print()
    for i, q in enumerate(state['queue'], 1):
        marker = {'pending': '·', 'in_progress': '►', 'verified': '✓', 'skipped': '⊘'}.get(q['status'], '?')
        print(f"  {marker} {i:2d}. [T{q['priority']}] {q['product_id']}")
    return 0


def cmd_next(args: argparse.Namespace) -> int:
    state = _load_state()
    for q in state['queue']:
        if q['status'] == 'pending':
            print(_format_prompt(q))
            return 0
    print("No pending products. Sweep complete.")
    return 0


def cmd_prompt(args: argparse.Namespace) -> int:
    state = _load_state()
    q = _get_entry(state, args.product_id)
    if not q:
        print(f"ERROR: no queue entry for {args.product_id!r}", file=sys.stderr)
        return 1
    print(_format_prompt(q))
    return 0


def _format_prompt(q: dict) -> str:
    """Compact verification prompt — minimize agent token spend per product."""
    n = sum(1 for x in q.get('current_nutrient_keys', []))
    out = [
        f"### [{q['priority']}] {q['product_id']}",
        f"Category: `{q['category']}`",
        f"Label: `{q.get('verified_source','(none)')}`",
        f"Current state: {n} nutrients itemized → {', '.join(q.get('current_nutrient_keys', []))}",
        '',
        '**Paste the full Supplement Facts panel + Other Ingredients section verbatim below.**',
    ]
    return '\n'.join(out)


def cmd_status(args: argparse.Namespace) -> int:
    state = _load_state()
    q = _get_entry(state, args.product_id)
    if not q:
        print(f"ERROR: no queue entry for {args.product_id!r}", file=sys.stderr)
        return 1
    if args.new_status not in ('pending', 'in_progress', 'verified', 'skipped'):
        print(f"ERROR: invalid status {args.new_status!r}", file=sys.stderr)
        return 1
    q['status'] = args.new_status
    q['status_at'] = _now_iso()
    _recompute_totals(state)
    _save_state(state)
    print(f"OK — {args.product_id} → {args.new_status}")
    return 0


def cmd_raw(args: argparse.Namespace) -> int:
    """Store the user's raw paste for a product. Reads stdin."""
    raw = sys.stdin.read()
    state = _load_state()
    q = _get_entry(state, args.product_id)
    if not q:
        print(f"ERROR: no queue entry for {args.product_id!r}", file=sys.stderr)
        return 1
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    safe_id = args.product_id.replace('/', '_').replace(' ', '_').replace('®','').replace('™','')
    raw_path = RAW_DIR / f"{safe_id}.txt"
    raw_path.write_text(raw, encoding='utf-8')
    q['raw_paste'] = str(raw_path.relative_to(ROOT))
    q['raw_paste_captured_at'] = _now_iso()
    q['raw_paste_bytes'] = len(raw.encode('utf-8'))
    if q['status'] == 'pending':
        q['status'] = 'in_progress'
        q['status_at'] = _now_iso()
    _recompute_totals(state)
    _save_state(state)
    print(f"OK — {args.product_id} raw paste stored ({len(raw)} chars) → {raw_path.relative_to(ROOT)}")
    return 0


def cmd_log(args: argparse.Namespace) -> int:
    """Append a log line for the most recently verified product."""
    state = _load_state()
    q = _get_entry(state, args.product_id)
    if not q:
        print(f"ERROR: no queue entry for {args.product_id!r}", file=sys.stderr)
        return 1
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not LOG_PATH.exists():
        LOG_PATH.write_text(
            '# Trace-mineral verification sweep — log\n\n'
            '_Per-product confirmations during the manual verification sweep '
            '(see `knowledge/_trace_verification_state.json` for full state). '
            'Each entry: timestamp + product + nutrient-delta summary. Raw pastes '
            'preserved in `knowledge/_trace_verification_raw/`._\n\n',
            encoding='utf-8',
        )
    ts = _now_eastern_human()
    line = f"- ({ts}) **{q['product_id']}** — {args.summary}\n"
    with open(LOG_PATH, 'a', encoding='utf-8') as f:
        f.write(line)
    print(f"OK — logged: {line.strip()}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest='cmd', required=True)

    sub.add_parser('list')
    sub.add_parser('next')

    p_prompt = sub.add_parser('prompt')
    p_prompt.add_argument('product_id')

    p_status = sub.add_parser('status')
    p_status.add_argument('product_id')
    p_status.add_argument('new_status')

    p_raw = sub.add_parser('raw')
    p_raw.add_argument('product_id')

    p_log = sub.add_parser('log')
    p_log.add_argument('product_id')
    p_log.add_argument('summary')

    args = ap.parse_args()
    fn = {
        'list': cmd_list, 'next': cmd_next, 'prompt': cmd_prompt,
        'status': cmd_status, 'raw': cmd_raw, 'log': cmd_log,
    }[args.cmd]
    return fn(args)


if __name__ == '__main__':
    sys.exit(main())
