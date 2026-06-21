#!/usr/bin/env python3
"""
Best-practices refresh — Round 155 / Saturday Item 5
====================================================

Periodic docs.claude.com fetch + hash-compare + jsonl-append on diff.

Why this exists
---------------
`memory/claude-best-practices.md` is the reference standard Cura's
translation-quality sub-check measures lessons against. It's manually
maintained. Without an automated drift surface, the file silently rots while
Anthropic publishes new guidance.

Vision session #3 Survivor B (2026-06-19 at 4:44 AM EDT) proposed a weekly
fetch-and-diff to catch this. User direction (Saturday filed work item #5):
fold into the EXISTING weekly system audit rather than add a new scheduled
task. This module is the implementation of that direction.

Operating cadence
-----------------
- Invoked from `tools/system_audit.py` when `--weekly` is set AND today is
  Sunday EDT. The weekly audit fires Sun 11 AM EDT (cron `0 11 * * 0`).
- Fetches each tracked URL, computes SHA-256 of the response body, compares
  to the last-known hash in the snapshot. On diff, appends a structured
  record to `memory/system/best-practices-findings.jsonl` and updates the
  snapshot.
- Manual ack: `python3 tools/best_practices_refresh.py --ack <url>` sets
  `last_review_acked_at` on the named URL so the next freshness check
  reports it as reviewed.

Data surfaces
-------------
- Snapshot (sentinel): `memory/system/best-practices-snapshot.json`
  Schema: `{ "pages": { url: { "last_hash", "last_fetched_at",
  "last_changed_at", "last_review_acked_at" } }, "schema_version": 1 }`
- Findings log (append-only jsonl): `memory/system/best-practices-findings.jsonl`
  Schema: `{ "id", "observed_at", "url", "prior_hash", "new_hash", "kind",
  "summary" }` where kind ∈ {"baseline", "change", "fetch_error"}

Patterns consulted
------------------
- Append-only structured log + resolution invariant (verified-patterns.md)
  → findings.jsonl shape mirrors `vitality-findings.jsonl` and
  `implementations.jsonl` precedents.
- Cron + sentinel + paired invariant
  → the weekly audit IS the cron; snapshot.json IS the sentinel;
  `check_best_practices_refresh_status` (invariant) IS the paired check.
- Atomic safe_write + byte-verify
  → all writes go through `safe_rewrite` / `safe_append`.

Bounded inputs (doctrine §8)
----------------------------
- Fetch timeout: 30 seconds per URL (hard cap).
- Response size cap: 5 MB per page (truncate + flag as fetch_error if
  exceeded — docs pages don't legitimately exceed this).
- URL list is hardcoded — user-edited only via this file.

Graceful degradation (doctrine §7)
----------------------------------
- Network failure on one URL → log as `kind: fetch_error`; other URLs still
  process. Audit run does NOT abort.
- Snapshot file missing → bootstrap with empty pages and write baseline on
  first successful fetch.
"""

from __future__ import annotations

import argparse
import datetime
import hashlib
import json
import sys
import urllib.error
import urllib.request
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SNAPSHOT_PATH = ROOT / "memory" / "system" / "best-practices-snapshot.json"
FINDINGS_PATH = ROOT / "memory" / "system" / "best-practices-findings.jsonl"

# URLs to track. User-edited only via this constant. If a URL 404s or the
# schema changes, the refresher logs as kind=fetch_error and continues —
# never aborts the wrapping audit.
TRACKED_URLS = (
    "https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview",
    "https://docs.claude.com/en/docs/build-with-claude/context-windows",
    "https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview",
)

FETCH_TIMEOUT_SECONDS = 30
MAX_BODY_BYTES = 5 * 1024 * 1024  # 5 MB hard cap per URL
USER_AGENT = "wallach-health-agent best-practices-refresh/1.0 (+contact: serenitybackto@gmail.com)"

SCHEMA_VERSION = 1


# ---------------------------------------------------------------------------
# Snapshot I/O via safe_write
# ---------------------------------------------------------------------------

def _import_safe_write():
    """Lazy import so this module can be imported in test contexts that don't
    have the tools/ directory on sys.path."""
    sys.path.insert(0, str(ROOT / "tools"))
    from safe_write import safe_rewrite, safe_append, SafeWriteError
    return safe_rewrite, safe_append, SafeWriteError


def _utc_now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def _load_snapshot() -> dict:
    """Load the snapshot JSON. Returns the empty-bootstrap shape if missing."""
    if not SNAPSHOT_PATH.exists():
        return {"pages": {}, "schema_version": SCHEMA_VERSION}
    try:
        with open(SNAPSHOT_PATH, encoding="utf-8") as f:
            data = json.load(f)
    except (json.JSONDecodeError, OSError):
        # If the snapshot is corrupt, treat as empty-bootstrap. The next run
        # will write a fresh snapshot. Findings log preserves history.
        return {"pages": {}, "schema_version": SCHEMA_VERSION}
    if "pages" not in data:
        data["pages"] = {}
    if "schema_version" not in data:
        data["schema_version"] = SCHEMA_VERSION
    return data


def _write_snapshot(data: dict) -> None:
    safe_rewrite, _safe_append, _err = _import_safe_write()
    SNAPSHOT_PATH.parent.mkdir(parents=True, exist_ok=True)
    safe_rewrite(SNAPSHOT_PATH, json.dumps(data, indent=2) + "\n")


def _append_finding(finding: dict) -> None:
    _safe_rewrite, safe_append, _err = _import_safe_write()
    FINDINGS_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not FINDINGS_PATH.exists():
        # Initialize with empty content; safe_append will then add the first
        # JSON line atomically.
        _safe_rewrite, safe_append, _err = _import_safe_write()
        _safe_rewrite(FINDINGS_PATH, "")
    safe_append(FINDINGS_PATH, json.dumps(finding) + "\n")


# ---------------------------------------------------------------------------
# Fetch + hash
# ---------------------------------------------------------------------------

def _fetch(url: str) -> tuple[str | None, str | None]:
    """Fetch URL. Returns (body_text, error_str). One of them is None.
    Bounded by FETCH_TIMEOUT_SECONDS + MAX_BODY_BYTES per doctrine §8."""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=FETCH_TIMEOUT_SECONDS) as resp:
            raw = resp.read(MAX_BODY_BYTES + 1)
            if len(raw) > MAX_BODY_BYTES:
                return None, f"response exceeds {MAX_BODY_BYTES} byte cap"
            charset = resp.headers.get_content_charset() or "utf-8"
            try:
                return raw.decode(charset, errors="replace"), None
            except LookupError:
                return raw.decode("utf-8", errors="replace"), None
    except urllib.error.HTTPError as e:
        return None, f"HTTP {e.code}: {e.reason}"
    except urllib.error.URLError as e:
        return None, f"URL error: {e.reason}"
    except TimeoutError:
        return None, f"timeout after {FETCH_TIMEOUT_SECONDS}s"
    except OSError as e:
        return None, f"OS error: {e}"


def _hash_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


# ---------------------------------------------------------------------------
# Refresh entry point
# ---------------------------------------------------------------------------

def refresh_and_compare() -> dict:
    """Fetch every tracked URL, hash, compare to snapshot, append findings
    on diff. Returns a summary dict suitable for inclusion in the weekly
    audit's markdown report.

    Summary shape:
      {
        "fetched_at": iso,
        "tracked_urls": int,
        "fetched_ok": int,
        "fetch_errors": int,
        "baselines_written": int,
        "changes_detected": int,
        "findings": [ { "url", "kind", "summary" }, ... ],
      }
    """
    snapshot = _load_snapshot()
    pages = snapshot["pages"]
    fetched_at = _utc_now_iso()

    findings_for_report: list[dict] = []
    fetched_ok = 0
    fetch_errors = 0
    baselines_written = 0
    changes_detected = 0

    for url in TRACKED_URLS:
        body, error = _fetch(url)
        if error:
            fetch_errors += 1
            finding = {
                "id": str(uuid.uuid4()),
                "observed_at": fetched_at,
                "url": url,
                "prior_hash": pages.get(url, {}).get("last_hash"),
                "new_hash": None,
                "kind": "fetch_error",
                "summary": error,
            }
            _append_finding(finding)
            findings_for_report.append({
                "url": url, "kind": "fetch_error", "summary": error,
            })
            continue

        fetched_ok += 1
        new_hash = _hash_text(body)
        prior = pages.get(url, {})
        prior_hash = prior.get("last_hash")

        if prior_hash is None:
            # First time we've seen this URL — record baseline.
            baselines_written += 1
            finding = {
                "id": str(uuid.uuid4()),
                "observed_at": fetched_at,
                "url": url,
                "prior_hash": None,
                "new_hash": new_hash,
                "kind": "baseline",
                "summary": f"baseline recorded ({len(body)} bytes)",
            }
            _append_finding(finding)
            findings_for_report.append({
                "url": url, "kind": "baseline",
                "summary": f"baseline {len(body)} bytes",
            })
            pages[url] = {
                "last_hash": new_hash,
                "last_fetched_at": fetched_at,
                "last_changed_at": fetched_at,
                "last_review_acked_at": fetched_at,
            }
            continue

        if new_hash != prior_hash:
            changes_detected += 1
            finding = {
                "id": str(uuid.uuid4()),
                "observed_at": fetched_at,
                "url": url,
                "prior_hash": prior_hash,
                "new_hash": new_hash,
                "kind": "change",
                "summary": (
                    f"content changed ({len(body)} bytes; "
                    f"prior hash {prior_hash[:12]}… → new hash {new_hash[:12]}…)"
                ),
            }
            _append_finding(finding)
            findings_for_report.append({
                "url": url, "kind": "change",
                "summary": f"content changed (new hash {new_hash[:12]}…)",
            })
            pages[url] = {
                **prior,
                "last_hash": new_hash,
                "last_fetched_at": fetched_at,
                "last_changed_at": fetched_at,
                # last_review_acked_at preserved from prior — change requires
                # explicit user ack to clear.
            }
        else:
            pages[url] = {
                **prior,
                "last_fetched_at": fetched_at,
                "last_hash": new_hash,
            }

    snapshot["pages"] = pages
    snapshot["last_refresh_at"] = fetched_at
    _write_snapshot(snapshot)

    return {
        "fetched_at": fetched_at,
        "tracked_urls": len(TRACKED_URLS),
        "fetched_ok": fetched_ok,
        "fetch_errors": fetch_errors,
        "baselines_written": baselines_written,
        "changes_detected": changes_detected,
        "findings": findings_for_report,
    }


def get_freshness_status() -> dict:
    """Read-only freshness snapshot. Used by the paired invariant — no fetch
    is performed. Returns a dict the invariant can stringify into a message.
    """
    snapshot = _load_snapshot()
    pages = snapshot.get("pages", {})
    last_refresh = snapshot.get("last_refresh_at")

    days_since_refresh = None
    if last_refresh:
        try:
            t = datetime.datetime.fromisoformat(last_refresh)
            if t.tzinfo is None:
                t = t.replace(tzinfo=datetime.timezone.utc)
            now = datetime.datetime.now(datetime.timezone.utc)
            days_since_refresh = (now - t).total_seconds() / 86400.0
        except ValueError:
            pass

    unreviewed_changes = []
    for url, page in pages.items():
        last_changed = page.get("last_changed_at")
        last_acked = page.get("last_review_acked_at")
        if last_changed and last_acked and last_changed > last_acked:
            unreviewed_changes.append(url)

    return {
        "tracked_urls": len(TRACKED_URLS),
        "snapshot_pages": len(pages),
        "last_refresh_at": last_refresh,
        "days_since_refresh": days_since_refresh,
        "unreviewed_changes": unreviewed_changes,
    }


def ack_url(url: str) -> bool:
    """Mark a URL as reviewed. Returns True on success, False if URL not tracked."""
    snapshot = _load_snapshot()
    pages = snapshot.get("pages", {})
    if url not in pages:
        return False
    pages[url]["last_review_acked_at"] = _utc_now_iso()
    snapshot["pages"] = pages
    _write_snapshot(snapshot)
    return True


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> int:
    p = argparse.ArgumentParser(
        prog="best_practices_refresh.py",
        description="Periodic docs.claude.com fetch + hash-compare. "
                    "Invoked by tools/system_audit.py on weekly Sunday runs.",
    )
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("refresh", help="Fetch all tracked URLs, hash, diff, append findings")
    sub.add_parser("status", help="Read-only freshness report (no fetch)")
    sub.add_parser("urls", help="Print tracked URLs")
    ack = sub.add_parser("ack", help="Mark a URL as reviewed")
    ack.add_argument("url", help="The URL to ack (must be in the tracked list)")

    args = p.parse_args()

    if args.cmd == "refresh":
        summary = refresh_and_compare()
        print(json.dumps(summary, indent=2))
        return 0

    if args.cmd == "status":
        status = get_freshness_status()
        print(json.dumps(status, indent=2))
        return 0

    if args.cmd == "urls":
        for u in TRACKED_URLS:
            print(u)
        return 0

    if args.cmd == "ack":
        if ack_url(args.url):
            print(f"OK — acked {args.url}")
            return 0
        print(f"FAIL — {args.url} not in snapshot (tracked URLs: {len(TRACKED_URLS)})",
              file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
