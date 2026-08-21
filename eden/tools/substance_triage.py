#!/usr/bin/env python3
"""substance_triage.py -- the low-friction manager for the source-anchored substance triage buffer.

WHY this exists (the design principle): make the HONEST path the path of LEAST
resistance. While mining, a claim may name a substance that has no slug in
eden/catalog/nutrients.json -- a real new herb Wallach names, OR book-OCR garbage. The strict
references_resolve gate reds on an unregistered other_substances slug, so without a relief valve
the only exits from the red board are "heavy correct work now" or "cheat" (typo-pollute the
registry / silently drop the substance). This buffer is the legitimate low-effort THIRD exit:
park the substance here with full source context, leave it OUT of the claim's other_substances
FOR NOW (so the claim still seals green), and let the substance_triage_accounted gate keep the
pile visible until the book is fully mined.

This tool is NOT a source of truth and it NEVER registers a substance. It only PARKS raw names
for later human review and records their disposition. The single registry stays nutrients.json.

Buffer file: eden/tools/substance-triage-buffer.json  (staging scaffolding, NOT a pillar, NOT sealed).

All writes route through safe_write.safe_rewrite -- validate-then-atomic-swap.

Subcommands (argparse; NOTHING mutates on --help or a bare invocation -- user-only-tools rule):
  park     --raw-name N --book B --locator L --context C [--claim-id ID]
               Append a pending entry (auto-assigns the next STB-#### id). Prints the new id.
  resolve  --id STB-#### --status {resolved,rejected} --resolution TEXT
               Mark an entry reviewed. `resolution` is required + non-empty (the gate enforces it too).
  list     [--book B] [--status {pending,resolved,rejected}]
               Print entries (read-only).
  selftest
               Exercise park + resolve + id-assignment on a TEMP copy; never touches the real buffer.

Resolution workflow (the review pass):
  1. Batch-review each pending entry against the source page IMAGE, never against the OCR text.
  2. Real substance -> register the slug in eden/catalog/nutrients.json + re-seal the catalog,
     backfill it into the claim's other_substances via mine_batch, then `resolve --status resolved`.
  3. OCR garbage / not-a-substance -> `resolve --status rejected` with the reason.
The gate turns any book flagged mining_status:'complete' with a still-pending entry RED, so this
pile can never be silently forgotten before a book seals as fully mined.
"""
import argparse
import json
import sys
import tempfile
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent  # eden/tools/ -> eden/ -> ROOT
BUFFER_PATH = ROOT / "eden" / "tools" / "substance-triage-buffer.json"

sys.path.insert(0, str(ROOT / "tools"))
import safe_write  # noqa: E402

STATUS_TERMINAL = {"resolved", "rejected"}
REQUIRED_ENTRY_FIELDS = ("id", "raw_name", "book_id", "locator", "context", "claim_id",
                         "noticed_at", "status", "resolution")


def _load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _next_id(entries: list) -> str:
    """Next STB-#### id -- max existing numeric suffix + 1 (stable, never reuses a freed id)."""
    nums = []
    for e in entries:
        eid = str(e.get("id", ""))
        if eid.startswith("STB-") and eid[4:].isdigit():
            nums.append(int(eid[4:]))
    return f"STB-{(max(nums) + 1) if nums else 1:04d}"


def _dump(data: dict) -> str:
    # 2-space indent + trailing newline -- matches the hand-authored buffer + repo JSON convention.
    return json.dumps(data, indent=2, ensure_ascii=False) + "\n"


def cmd_park(args, path: Path = BUFFER_PATH) -> int:
    data = _load(path)
    entries = data.setdefault("entries", [])
    entry = {
        "id": _next_id(entries),
        "raw_name": args.raw_name,
        "book_id": args.book,
        "locator": args.locator,
        "context": args.context,
        "claim_id": args.claim_id,  # None when noticed before the claim id exists
        "noticed_at": date.today().isoformat(),
        "status": "pending",
        "resolution": "",
    }
    entries.append(entry)
    safe_write.safe_rewrite(str(path), _dump(data))
    print(f"parked {entry['id']}: '{entry['raw_name']}' ({entry['book_id']} @ {entry['locator']}) -> pending")
    return 0


def cmd_resolve(args, path: Path = BUFFER_PATH) -> int:
    if not args.resolution.strip():
        print("ERROR: --resolution must be non-empty (record WHY: promoted+backfilled, or rejected garbage)",
              file=sys.stderr)
        return 2
    data = _load(path)
    entries = data.get("entries", [])
    hit = next((e for e in entries if e.get("id") == args.id), None)
    if hit is None:
        print(f"ERROR: no entry with id {args.id}", file=sys.stderr)
        return 2
    hit["status"] = args.status
    hit["resolution"] = args.resolution.strip()
    safe_write.safe_rewrite(str(path), _dump(data))
    print(f"{args.id} -> {args.status}: {hit['resolution']}")
    return 0


def cmd_list(args, path: Path = BUFFER_PATH) -> int:
    data = _load(path)
    entries = data.get("entries", [])
    shown = [e for e in entries
             if (not args.book or e.get("book_id") == args.book)
             and (not args.status or e.get("status") == args.status)]
    if not shown:
        print("(no matching entries)")
        return 0
    for e in shown:
        cid = e.get("claim_id") or "-"
        print(f"{e.get('id')}  [{e.get('status')}]  '{e.get('raw_name')}'  "
              f"{e.get('book_id')} @ {e.get('locator')}  claim={cid}")
        if e.get("resolution"):
            print(f"        -> {e['resolution']}")
    print(f"\n{len(shown)} entr{'y' if len(shown) == 1 else 'ies'} "
          f"({sum(1 for e in shown if e.get('status') == 'pending')} pending)")
    return 0


def cmd_selftest(_args) -> int:
    """Exercise park + resolve on a TEMP buffer -- proves the logic without touching the real file."""
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td) / "buf.json"
        tmp.write_text(_dump({"schema_version": 1, "entries": []}), encoding="utf-8")

        class A:  # tiny arg carrier
            pass
        a = A(); a.raw_name = "zumba"; a.book = "rare-earths"; a.locator = "Screenshot(42)"
        a.context = "...take zumba root daily..."; a.claim_id = "WAL-CLM-RARE-TEST"
        assert cmd_park(a, tmp) == 0
        a2 = A(); a2.raw_name = "gymnema"; a2.book = "rare-earths"; a2.locator = "Screenshot(43)"
        a2.context = "..."; a2.claim_id = None
        assert cmd_park(a2, tmp) == 0
        d = _load(tmp)
        assert [e["id"] for e in d["entries"]] == ["STB-0001", "STB-0002"], "id assignment broke"
        assert d["entries"][1]["claim_id"] is None, "null claim_id not preserved"

        r = A(); r.id = "STB-0001"; r.status = "rejected"; r.resolution = "OCR garbage for 'Zumbani'"
        assert cmd_resolve(r, tmp) == 0
        # empty resolution must be refused
        r2 = A(); r2.id = "STB-0002"; r2.status = "resolved"; r2.resolution = "   "
        assert cmd_resolve(r2, tmp) == 2, "empty resolution was not refused"
        d = _load(tmp)
        assert d["entries"][0]["status"] == "rejected"
        assert d["entries"][1]["status"] == "pending", "failed resolve should not mutate"
    print("selftest OK -- park assigns ids, preserves null claim_id, resolve requires a reason")
    return 0


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description="Manage the source-anchored substance triage buffer.")
    sub = p.add_subparsers(dest="cmd", required=True)

    pp = sub.add_parser("park", help="park an unregistered substance with source context")
    pp.add_argument("--raw-name", required=True, help="the substance name AS IT APPEARED (raw OCR)")
    pp.add_argument("--book", required=True, help="book_id (e.g. rare-earths)")
    pp.add_argument("--locator", required=True, help="where in the source (e.g. 'Screenshot(42)' / 'Ch17 p.203')")
    pp.add_argument("--context", required=True, help="surrounding text for later image review")
    pp.add_argument("--claim-id", default=None, help="the claim it belongs to (for backfill); omit if pre-claim")
    pp.set_defaults(func=cmd_park)

    rp = sub.add_parser("resolve", help="mark an entry reviewed (promoted or rejected)")
    rp.add_argument("--id", required=True)
    rp.add_argument("--status", required=True, choices=sorted(STATUS_TERMINAL))
    rp.add_argument("--resolution", required=True, help="WHY (non-empty): what was promoted+backfilled, or why rejected")
    rp.set_defaults(func=cmd_resolve)

    lp = sub.add_parser("list", help="print entries (read-only)")
    lp.add_argument("--book", default=None)
    lp.add_argument("--status", default=None, choices=["pending", "resolved", "rejected"])
    lp.set_defaults(func=cmd_list)

    sp = sub.add_parser("selftest", help="self-check park/resolve on a temp buffer")
    sp.set_defaults(func=cmd_selftest)

    args = p.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
