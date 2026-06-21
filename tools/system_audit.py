#!/usr/bin/env python3
"""
tools/system_audit.py — the detective. Walks tools/invariants.py manifest,
runs every check applicable to the current cadence (daily / weekly),
produces a structured report, and updates the audit's own sentinel.

Round 74 / 2026-06-15. Replaces the hand-written daily audit checks with
a manifest-driven runner. Adding/removing/changing checks is now an edit
to tools/invariants.py — no changes here required.

The audit's own sentinel (memory/system/audit-sentinel.json) is updated
LAST, only after a successful run. If the audit itself crashes mid-run,
the sentinel stays unmoved — which is the correct user-facing signal
(the catch-up trigger / morning briefing will surface "audit did not run").

Writes:
  - memory/system/audit-YYYY-MM.md  (append daily audit report)
  - memory/system/audit-sentinel.json (full rewrite, atomic)

Both writes go through tools/safe_write.py — atomic, verified.

CLI:
  python3 tools/system_audit.py             # daily run
  python3 tools/system_audit.py --weekly    # daily + weekly invariants
  python3 tools/system_audit.py --dry-run   # print report, don't persist
"""

import argparse
import datetime
import json
import pathlib
import sys
import traceback
from dataclasses import asdict

# Local imports
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from invariants import INVARIANTS, list_invariants, Invariant  # noqa: E402
from safe_write import safe_append, safe_rewrite, SafeWriteError  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent

AUDIT_DIR = ROOT / "memory/system"
SENTINEL_PATH = AUDIT_DIR / "audit-sentinel.json"


# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------

def _eastern_now() -> datetime.datetime:
    """Current time in Eastern (UTC-4 during EDT). Timezone-aware."""
    return datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=4)


def _eastern_date_str() -> str:
    return _eastern_now().strftime("%Y-%m-%d")


def _eastern_display() -> str:
    """e.g. '(2026-06-15 at 6:40 AM EDT)'. Cross-platform safe (Windows
    strftime doesn't support %-I; format manually instead)."""
    n = _eastern_now()
    hour_12 = n.hour % 12 or 12
    ampm = "AM" if n.hour < 12 else "PM"
    return f"({n.strftime('%Y-%m-%d')} at {hour_12}:{n.strftime('%M')} {ampm} EDT)"


def _utc_now_iso() -> str:
    """ISO 8601 with explicit UTC offset for storage in sentinels."""
    return datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

def _maybe_refresh_best_practices(weekly: bool) -> dict | None:
    """Round 155 / Saturday Item 5 (Vision Survivor B): on weekly Sunday runs,
    fetch tracked docs.claude.com pages, hash-compare, append findings on
    diff. Failure here MUST NOT abort the audit (doctrine §7). Returns the
    refresh summary, or None if skipped or errored.

    Sunday-conditional: weekday() == 6 (Python: Mon=0..Sun=6).
    """
    if not weekly:
        return None
    if _eastern_now().weekday() != 6:
        return None
    try:
        from best_practices_refresh import refresh_and_compare
        summary = refresh_and_compare()
        return summary
    except Exception as e:
        # Graceful degradation — never abort the audit on refresh failure.
        return {
            "fetched_at": _utc_now_iso(),
            "tracked_urls": 0,
            "fetched_ok": 0,
            "fetch_errors": 0,
            "baselines_written": 0,
            "changes_detected": 0,
            "findings": [],
            "wrapper_error": f"{type(e).__name__}: {e}",
        }


def run_audit(weekly: bool = False, dry_run: bool = False) -> int:
    """Run all applicable invariants. Returns exit code (0 = all critical pass)."""
    started_at = _utc_now_iso()
    # Refresh BEFORE invariants so check_best_practices_refresh_status sees
    # the freshly updated snapshot. Returns None on non-Sunday-weekly runs.
    bp_summary = _maybe_refresh_best_practices(weekly)
    chosen = list_invariants(weekly=weekly)

    results = []
    for inv in chosen:
        try:
            passed, message = inv.check_fn()
        except Exception as e:
            passed = False
            message = f"check raised: {type(e).__name__}: {e}"
        results.append({
            "name": inv.name,
            "severity": inv.severity,
            "cadence": inv.cadence,
            "passed": passed,
            "message": message,
            "truth_anchor": inv.truth_anchor,
            "lesson_ref": inv.lesson_ref,
            "description": inv.description,
        })

    completed_at = _utc_now_iso()

    # Tally
    n_pass = sum(1 for r in results if r["passed"])
    n_fail = len(results) - n_pass
    critical_fails = [r for r in results if not r["passed"] and r["severity"] == "critical"]
    warning_fails = [r for r in results if not r["passed"] and r["severity"] == "warning"]
    info_fails    = [r for r in results if not r["passed"] and r["severity"] == "info"]

    # ----- Print to stdout (for the scheduled task's logs) -----
    print(f"=== System Audit {_eastern_display()} ===")
    print(f"Cadence: {'weekly' if weekly else 'daily'}")
    print(f"Invariants checked: {len(results)}")
    print(f"Pass: {n_pass}  Fail: {n_fail}  (Critical: {len(critical_fails)}, Warning: {len(warning_fails)}, Info: {len(info_fails)})")
    print()
    for r in results:
        status = "OK  " if r["passed"] else "FAIL"
        print(f"{status} [{r['severity']:8}] {r['name']}: {r['message']}")
    if critical_fails:
        print()
        print("CRITICAL FAILURES — these will hard-wrap the next session's catch-up:")
        for r in critical_fails:
            print(f"  • {r['name']}: {r['message']}")
            print(f"    truth anchor: {r['truth_anchor']}")
            print(f"    lesson ref:   {r['lesson_ref']}")

    if dry_run:
        print("\n[dry-run — no files written]")
        return 0 if not critical_fails else 1

    # ----- Build the markdown audit entry -----
    md_lines = [
        "",
        f"## System Audit — {_eastern_display()}",
        "",
        f"**Cadence:** {'weekly' if weekly else 'daily'}",
        f"**Invariants checked:** {len(results)}",
        f"**Result:** {n_pass}/{len(results)} pass ({len(critical_fails)} critical fail, {len(warning_fails)} warning fail, {len(info_fails)} info)",
        "",
    ]

    if critical_fails:
        md_lines.append("### Critical failures — surface FIRST in morning briefing")
        md_lines.append("")
        for r in critical_fails:
            md_lines.append(f"- **{r['name']}** — {r['message']}")
            md_lines.append(f"  - Truth anchor: `{r['truth_anchor']}`")
            md_lines.append(f"  - Lesson ref: {r['lesson_ref']}")
        md_lines.append("")

    if warning_fails:
        md_lines.append("### Warnings")
        md_lines.append("")
        for r in warning_fails:
            md_lines.append(f"- **{r['name']}** — {r['message']}")
        md_lines.append("")

    if info_fails:
        md_lines.append("### Info")
        md_lines.append("")
        for r in info_fails:
            md_lines.append(f"- {r['name']}: {r['message']}")
        md_lines.append("")

    if bp_summary is not None:
        md_lines.append("### docs.claude.com refresh (Sunday-conditional sub-check)")
        md_lines.append("")
        if "wrapper_error" in bp_summary:
            md_lines.append(f"- **refresh wrapper error:** `{bp_summary['wrapper_error']}` (audit continued; see best_practices_refresh.py logs)")
        md_lines.append(f"- Tracked URLs: {bp_summary['tracked_urls']}")
        md_lines.append(f"- Fetched OK: {bp_summary['fetched_ok']}; fetch errors: {bp_summary['fetch_errors']}")
        md_lines.append(f"- Baselines written: {bp_summary['baselines_written']}; changes detected: {bp_summary['changes_detected']}")
        if bp_summary.get("findings"):
            md_lines.append("")
            md_lines.append("Findings this run:")
            for f in bp_summary["findings"]:
                md_lines.append(f"- **{f['kind']}** — {f['url']} — {f['summary']}")
        md_lines.append("")
        md_lines.append("Manual ack: `python3 tools/best_practices_refresh.py ack <url>` clears the unreviewed-changes flag for that URL.")
        md_lines.append("")

    md_lines.append("### All invariants checked (full result table)")
    md_lines.append("")
    md_lines.append("| Status | Severity | Name | Message |")
    md_lines.append("|---|---|---|---|")
    for r in results:
        status = "OK" if r["passed"] else "FAIL"
        # Escape pipes in message
        msg = r["message"].replace("|", "\\|")
        md_lines.append(f"| {status} | {r['severity']} | `{r['name']}` | {msg} |")
    md_lines.append("")

    md_content = "\n".join(md_lines)

    # ----- Persist via safe_write -----
    AUDIT_DIR.mkdir(parents=True, exist_ok=True)

    today_str = _eastern_date_str()
    yyyy_mm = today_str[:7]
    audit_md_path = AUDIT_DIR / f"audit-{yyyy_mm}.md"

    # Initialize the monthly audit file if it doesn't exist
    if not audit_md_path.exists():
        header = f"# System Audit Log — {yyyy_mm}\n\nAppend-only. Written by `tools/system_audit.py`.\n"
        try:
            safe_rewrite(audit_md_path, header)
        except SafeWriteError as e:
            print(f"\nFAILED to initialize audit file: {e}", file=sys.stderr)
            return 2

    try:
        safe_append(audit_md_path, md_content)
    except SafeWriteError as e:
        print(f"\nFAILED to append audit report: {e}", file=sys.stderr)
        return 2

    # ----- Update audit sentinel (atomic rewrite) -----
    # Sanitize last_lapse_reason to prevent the self-referential parse-confusion
    # failure family (Round 74 Phase C). If the lapse text is long OR contains
    # JSON-parser-confusing patterns ("line X column Y", "char N"), truncate the
    # sentinel field and write the full text to a sidecar file the human can read.
    lapse_reason_full = (
        "; ".join(f"{r['name']}: {r['message']}" for r in critical_fails)
        if critical_fails else None
    )
    lapse_reason_short = lapse_reason_full
    lapse_detail_path = None
    if lapse_reason_full:
        # Detect parser-confusion patterns
        has_parse_pattern = bool(
            "line " in lapse_reason_full and " column " in lapse_reason_full
        ) or len(lapse_reason_full) > 200
        if has_parse_pattern:
            # Truncate to short form + write full detail to sidecar
            lapse_detail_path = AUDIT_DIR / "last-lapse-detail.txt"
            try:
                detail_content = (
                    f"# Last lapse detail — {completed_at}\n\n"
                    f"Audit: {today_str} ({'weekly' if weekly else 'daily'})\n"
                    f"Critical failures: {len(critical_fails)}\n\n"
                    f"{lapse_reason_full}\n"
                )
                safe_rewrite(lapse_detail_path, detail_content)
            except SafeWriteError:
                lapse_detail_path = None  # don't block the audit on sidecar write
            # Build short form: list invariant names ONLY (no message text)
            # to avoid embedding parse-error patterns that could fool the next
            # audit's parser. Full text in sidecar.
            names = [r["name"] for r in critical_fails]
            lapse_reason_short = (
                f"{len(critical_fails)} critical fail(s): {', '.join(names[:5])}"
                f"{' (+more)' if len(names) > 5 else ''}"
                f". Full detail: memory/system/last-lapse-detail.txt"
            )

    sentinel = {
        "_purpose": "System audit's own sentinel. Updated AFTER successful audit run. "
                    "Catch-up trigger reads this to verify the audit itself didn't fail. "
                    "Round 74 — meta-check, who audits the auditor.",
        "last_audit_completed_at": completed_at,
        "last_audit_started_at": started_at,
        "last_audit_date": today_str,
        "last_audit_cadence": "weekly" if weekly else "daily",
        "last_audit_result": {
            "total": len(results),
            "pass": n_pass,
            "fail": n_fail,
            "critical_fail": len(critical_fails),
            "warning_fail": len(warning_fails),
            "info_fail": len(info_fails),
        },
        "last_lapse_detected": today_str if critical_fails else None,
        "last_lapse_reason": lapse_reason_short,
        "last_lapse_detail_path": (
            str(lapse_detail_path.relative_to(ROOT)) if lapse_detail_path else None
        ),
        "schema_version": 2,
    }

    try:
        safe_rewrite(SENTINEL_PATH, json.dumps(sentinel, indent=2) + "\n")
    except SafeWriteError as e:
        print(f"\nFAILED to update audit sentinel: {e}", file=sys.stderr)
        return 2

    print(f"\nAudit complete. Report appended to {audit_md_path.relative_to(ROOT)}")
    print(f"Sentinel updated: {SENTINEL_PATH.relative_to(ROOT)}")

    return 0 if not critical_fails else 1


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> int:
    p = argparse.ArgumentParser(
        prog="system_audit.py",
        description="System-wide detective audit (Round 74)"
    )
    p.add_argument("--weekly", action="store_true",
                   help="Run daily + weekly invariants")
    p.add_argument("--dry-run", action="store_true",
                   help="Print report to stdout, do not write audit file or sentinel")
    args = p.parse_args()

    try:
        return run_audit(weekly=args.weekly, dry_run=args.dry_run)
    except Exception:
        print("FATAL: system_audit.py crashed", file=sys.stderr)
        traceback.print_exc()
        return 3


if __name__ == "__main__":
    sys.exit(main())
