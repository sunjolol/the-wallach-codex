#!/usr/bin/env python3
"""
stop_round_close.py — Stop hook. The round-close safety net.

Fires when the agent finishes a turn. Intent (HANDOFF §7): stop a chunk from
being declared "done" while a real regression is unaddressed.

A Stop hook fires on EVERY turn and cannot tell "chunk close" from "status
report", so a literal "run build+vitest+invariants every turn and block unless
the full 5-item ritual passed" implementation would: (a) burn a full build on
every turn — at odds with the project's token budget; (b) block on the Creator's
Log step, which is CLI-unfireable until the file-mirror lands; (c) block on the
known-stale, date-gated Tacitus reds. So this hook implements the INTENT safely:

  * It does cheap work and stays SILENT unless real dashboard source/dist work is
    uncommitted — chat/plan/docs turns, post-commit states, and the ever-present
    audit-file noise never trip it.
  * When source work IS in flight, it runs the invariant manifest ONCE and
    HARD-BLOCKS (exit 2) only on a GENUINELY NEW failure — a failing invariant
    whose name is not in the tolerated baseline (.claude/invariant-baseline.json).
    The known date-gated reds never block.
  * build / vitest / build-log / Creator's-Log are surfaced as REMINDERS, never a
    block — the agent and the human own those; this hook owns "no new regression
    ships."

DEVIATIONS from HANDOFF §7 are deliberate and documented here + in the build-log.
Revisit the hard-block scope once the Creator's-Log file-mirror exists and a
cheap incremental build/test is available.

Contract: stdin JSON {stop_hook_active, ...}. exit 2 = block (stderr to agent);
exit 0 = allow. Fail-open on any internal error.
Test seams: STOP_ROUND_CLOSE_FORCE=1 forces the source-work branch;
STOP_ROUND_CLOSE_BASELINE=<path> overrides the baseline file.
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
BASELINE_FILE = REPO_ROOT / ".claude" / "invariant-baseline.json"
SOURCE_PREFIXES = (
    "dashboard/assets/js/src/",
    "dashboard/assets/js/dist/main.js",
    "dashboard/dashboard.html",
)
FAIL_NAME = re.compile(r"^(?:FAIL|ERR )\s*\[[^]]*\]\s*([A-Za-z0-9_]+):", re.MULTILINE)


def _allow(note=""):
    if note:
        print(f"[stop_round_close] {note}", file=sys.stderr)
    sys.exit(0)


def _block(message):
    print(message, file=sys.stderr)
    sys.exit(2)


def _porcelain(*paths):
    try:
        r = subprocess.run(
            ["git", "-C", str(REPO_ROOT), "status", "--porcelain", *paths],
            capture_output=True, text=True, timeout=15,
        )
        return r.stdout or ""
    except Exception:
        return ""


def _source_changes():
    hits = []
    for line in _porcelain().splitlines():
        path = line[3:].strip().strip('"')
        if " -> " in path:  # rename
            path = path.split(" -> ", 1)[1]
        if any(path.startswith(pre) for pre in SOURCE_PREFIXES):
            hits.append(path)
    return hits


def _build_log_pending():
    return bool(_porcelain("chronicle/build-log.md").strip())


def _round_close_in_flight():
    """A real round-close leaves the build-log or the Creator's Log dirty; chat and
    status turns leave both clean, so this keeps the bundle gate silent off-ritual."""
    return bool(_porcelain("chronicle/build-log.md", "chronicle/creators-log/log.jsonl").strip())


def _bundle_stale():
    """True iff the newest ledger entry is not yet inlined in the built bundle the
    browser loads (dashboard/assets/js/dist/main.js). esbuild inlines the embed at
    BUILD time and the file:// app cannot fetch() it at runtime, so a log append with
    no rebuild leaves the in-app Profile log silently behind. Mirrors the
    creators_log_bundle_synced invariant; fail-open on any read error."""
    try:
        jsonl = REPO_ROOT / "chronicle/creators-log/log.jsonl"
        lines = [ln for ln in jsonl.read_text(encoding="utf-8").splitlines() if ln.strip()]
        if not lines:
            return False
        newest_id = json.loads(lines[-1]).get("id", "")
        if not newest_id:
            return False
        bundle = REPO_ROOT / "dashboard/assets/js/dist/main.js"
        return newest_id not in bundle.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return False


def _tolerated():
    path = os.environ.get("STOP_ROUND_CLOSE_BASELINE") or str(BASELINE_FILE)
    try:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
        # Entries are R9 justification objects {invariant, reason, test} (gated by
        # exceptions_justified); tolerate a bare-string entry too for forward-compat.
        return {e if isinstance(e, str) else e.get("invariant")
                for e in data.get("tolerated_failures", [])}
    except Exception:
        return None  # missing/unreadable → cannot judge regressions; fail-open


def main():
    try:
        raw = sys.stdin.buffer.read().decode("utf-8", errors="replace")
        payload = json.loads(raw) if raw.strip() else {}
    except Exception:
        _allow("unparseable stdin — failing open")
        return

    if payload.get("stop_hook_active"):
        _allow()  # loop guard — never recurse on our own continuation
        return

    # Never-skip the Creator's Log (sacred covenant): if this round-close added a
    # chronicle/build-log.md line but no new Creator's Log entry, HARD-BLOCK. Only
    # triggers when build-log is dirty (a real round-close), so chat/plan turns are free.
    if _porcelain("chronicle/build-log.md").strip() and not _porcelain(
            "chronicle/creators-log/log.jsonl").strip():
        _block(
            "ROUND NOT CLOSED — chronicle/build-log.md has a new line but the Creator's Log "
            "(chronicle/creators-log/log.jsonl) has no new entry this batch. The Creator's Log "
            "is sacred and must fire every round-close (.claude/skills/round-close). Fire one:\n"
            "  PYTHONUTF8=1 python tools/creators_log.py append --surface <s> --kind round-close "
            "--summary <\u2264280>\nthen commit both together."
        )
        return

    # Bundle-freshness gate (2026-07-02 silent-staleness fix). A Creator's Log entry
    # that fired but was never re-inlined into dist/main.js leaves the in-app Profile
    # log silently stale — the file:// app inlines the embed at BUILD time, not at
    # runtime. The rounds that hit this are doctrine/tooling closes with NO dashboard
    # source change, exactly what the source-changes gate below waves through — so
    # gate it here on any round-close in flight (build-log or ledger dirty).
    if _round_close_in_flight() and _bundle_stale():
        _block(
            "ROUND NOT CLOSED — the Creator's Log fired but dist/main.js was not rebuilt, "
            "so the in-app Profile log would silently OMIT the newest entries (the file:// "
            "app inlines the embed at BUILD time; the entries are safe in the ledger but not "
            "in the shipped bundle). Re-inline, then commit:\n"
            "  node tools/build.mjs\n"
            "Round-close order: append the Creator's Log entry, THEN build, THEN commit."
        )
        return

    forced = os.environ.get("STOP_ROUND_CLOSE_FORCE", "").strip() in ("1", "true", "yes")
    source_changes = _source_changes()
    if not source_changes and not forced:
        _allow()  # no dashboard work in flight — nothing to close
        return

    try:
        r = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "invariants.py")],
            capture_output=True, text=True, timeout=120,
            env={**os.environ, "PYTHONUTF8": "1", "PYTHONIOENCODING": "utf-8"},
        )
    except Exception as e:
        _allow(f"invariants did not run ({e}) — run it manually before closing the chunk")
        return

    out = (r.stdout or "") + "\n" + (r.stderr or "")
    failing = set(FAIL_NAME.findall(out))
    tolerated = _tolerated()

    if tolerated is not None:
        new_reds = sorted(failing - tolerated)
        if new_reds:
            _block(
                "ROUND NOT CLOSED — new invariant regression(s) introduced:\n  - "
                + "\n  - ".join(new_reds)
                + "\nThese were passing at baseline. Fix them — or, if intentional and "
                "user-approved, add them to .claude/invariant-baseline.json — before "
                "declaring the chunk done.\nUncommitted source: "
                + ", ".join(source_changes[:6] or ["(forced check)"])
            )
            return

    summary = ""
    m = re.search(r"\d+/\d+ passed \(\d+ failed\)", out)
    if m:
        summary = m.group(0)
    bl = "[PENDING — not in this batch]" if not _build_log_pending() else "[done]"
    _allow(
        "Round-close reminder — source/dist work is uncommitted. Before calling it done:\n"
        f"  • invariants: {summary or 'ran'} — no NEW regression, ok to proceed\n"
        "  • node tools/build.mjs (build must exit 0)\n"
        '  • npx vitest run "state/**" (if state/ changed)\n'
        f"  • append a chronicle/build-log.md line  {bl}\n"
        "  • commit (+ push) the chunk\n"
        "  • Creator's Log event — fire one: python tools/creators_log.py append … (mirror landed in L1; round-close firing-enforcement pending)"
    )


if __name__ == "__main__":
    main()
