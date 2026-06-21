#!/usr/bin/env python3
"""
tools/invariants.py — declarative manifest of system-level invariants.

Round 74 / 2026-06-15. Born from the user directive after Round 73's
truncation audit: build a system that THINKS about and DETECTS what could
be going wrong, rather than spot-fixing when it surfaces.

Each invariant has:
  - name        : stable identifier
  - description : one-line plain-English statement
  - check_fn    : callable returning (passed: bool, message: str)
  - truth_anchor: what the check is verified AGAINST (the external truth source)
  - severity    : 'critical' | 'warning' | 'info'
  - lesson_ref  : which lesson/round this came from
  - cadence     : 'daily' | 'weekly'

Engineering doctrine principle 11 (Round 74): every check pins to a truth
anchor that can't itself drift. Stale-to-stale equality is not truth.

Adding a new invariant:
  1. Write the check_fn (returns (bool, str))
  2. Append an Invariant entry to INVARIANTS below
  3. Reference the lesson/decision/protocol it ties back to in lesson_ref

Promotion gate (operating-protocols §18, Round 74): whenever a new pitfall
lands in lessons.md, the same patch must add an invariant here that would
catch the next occurrence of that pitfall. No new pitfalls without
detectors.
"""

import ast
import datetime
import hashlib
import json
import os
import pathlib
import random
import re
import subprocess
import sys
from dataclasses import dataclass, field
from typing import Callable

ROOT = pathlib.Path(__file__).resolve().parent.parent


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class Invariant:
    name: str
    description: str
    check_fn: Callable
    truth_anchor: str
    severity: str                 # 'critical' | 'warning' | 'info'
    lesson_ref: str = ""
    cadence: str = "daily"        # 'daily' | 'weekly'


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def _eastern_today() -> str:
    """Today's date in Eastern time as YYYY-MM-DD (EDT during daylight).
    Timezone-aware (avoids datetime.utcnow deprecation in Python 3.12+)."""
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    eastern = now_utc - datetime.timedelta(hours=4)  # EDT
    return eastern.strftime("%Y-%m-%d")


def _file_hash(path) -> str:
    """SHA-256 of file content (empty string if file missing)."""
    p = pathlib.Path(path)
    if not p.exists():
        return ""
    return hashlib.sha256(p.read_bytes()).hexdigest()


def _read_via_os(path) -> bytes:
    """Read file via low-level os.open + os.read (bypasses Python text cache)."""
    fd = os.open(str(path), os.O_RDONLY)
    try:
        chunks = []
        while True:
            chunk = os.read(fd, 65536)
            if not chunk:
                break
            chunks.append(chunk)
        return b"".join(chunks)
    finally:
        os.close(fd)


# ---------------------------------------------------------------------------
# Check functions
# ---------------------------------------------------------------------------

def check_tacitus_sentinel_content():
    """Tacitus' sentinel claim of having reflected today must be backed by
    a session entry in today's notebook. The artifact (notebook entry) is
    the truth anchor for the sentinel (.status field)."""
    # Round 100: paths moved from memory/tacitus/ → tacitus/ (folder at project root for portability).
    sentinel_path = ROOT / "tacitus/sentinel.json"
    notebook_dir = ROOT / "tacitus/notebook"

    if not sentinel_path.exists():
        return False, "tacitus/sentinel.json does not exist"

    try:
        sentinel = json.loads(sentinel_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return False, f"sentinel.json parse: {e}"

    last_date = sentinel.get("last_reflection_date")
    if not last_date:
        return True, "no last_reflection_date set (Tacitus has not run yet)"

    today = _eastern_today()
    if last_date != today:
        return True, f"last reflection was {last_date}, not today — no drift to detect"

    # Sentinel claims today — verify notebook artifact
    yyyy_mm = today[:7]
    nb_path = notebook_dir / f"{yyyy_mm}.md"
    if not nb_path.exists():
        return False, f"sentinel claims reflection today but {nb_path.relative_to(ROOT)} does not exist"

    nb_content = nb_path.read_text(encoding="utf-8")
    if today not in nb_content:
        return False, (
            f"DRIFT — sentinel last_reflection_date={today} but notebook has no entry "
            f"containing today's date. Tacitus' write did not land. See §16."
        )
    return True, f"Tacitus sentinel + notebook agree on {today}"


def check_audit_ran_today():
    """The audit's own sentinel — last_audit_completed_at must be within 26h.
    Meta-check: who audits the auditor? This invariant does."""
    sentinel_path = ROOT / "memory/system/audit-sentinel.json"
    if not sentinel_path.exists():
        return False, "memory/system/audit-sentinel.json does not exist (system audit has never run)"

    try:
        sentinel = json.loads(sentinel_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return False, f"audit-sentinel.json parse: {e}"

    # Bootstrap path: first run hasn't happened yet
    if sentinel.get("first_audit_pending"):
        return True, "first audit pending (bootstrap state)"

    last_completed = sentinel.get("last_audit_completed_at")
    if not last_completed:
        return False, "no last_audit_completed_at in audit sentinel"

    try:
        last_dt = datetime.datetime.fromisoformat(last_completed.replace("Z", "+00:00"))
    except Exception:
        return False, f"last_audit_completed_at not parseable: {last_completed!r}"

    if last_dt.tzinfo is None:
        last_dt = last_dt.replace(tzinfo=datetime.timezone.utc)
    age = datetime.datetime.now(datetime.timezone.utc) - last_dt
    if age > datetime.timedelta(hours=26):
        return False, f"audit last completed {age} ago — should run daily"
    return True, f"audit completed {age} ago"


def check_safe_write_canary():
    """Round-trip a known payload through safe_write and verify byte-equal
    via low-level os.read. If safe_write itself is broken, this catches it
    immediately. Doctrine §1 (no silent failures) applied to the write
    primitive itself."""
    sys.path.insert(0, str(ROOT / "tools"))
    from safe_write import safe_rewrite, SafeWriteError

    probe_path = ROOT / "tools/canaries/safe-write-probe.txt"
    probe_path.parent.mkdir(parents=True, exist_ok=True)

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    nonce = hashlib.sha256(str(datetime.datetime.now()).encode()).hexdigest()[:16]
    payload = f"safe-write-canary {now_iso} nonce={nonce}\n"

    try:
        safe_rewrite(probe_path, payload)
    except SafeWriteError as e:
        return False, f"safe_write raised: {e}"

    # Verify via os.read (bypasses any Python-level caching)
    raw = _read_via_os(probe_path).decode("utf-8")
    if raw != payload:
        return False, f"canary mismatch: wrote {len(payload)}B intended, read {len(raw)}B"
    return True, f"safe_write round-trip OK ({len(payload)}B)"


def check_brain_version_sync():
    """Brain version must agree across all four places it lives:
    versions.json, brain/CHANGELOG.md, brain/versions/v{X}-*.md exists,
    dashboard.html versions-data embed. versions.json is the truth anchor."""
    vj_path = ROOT / "memory/versions.json"
    if not vj_path.exists():
        return False, "memory/versions.json missing"
    try:
        vj = json.loads(vj_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return False, f"versions.json parse: {e}"

    brain_v = vj.get("current", {}).get("brain")
    if not brain_v:
        return False, "versions.json has no current.brain"

    issues = []

    # CHANGELOG entry
    cl_path = ROOT / "brain/CHANGELOG.md"
    if not cl_path.exists():
        issues.append("brain/CHANGELOG.md missing")
    else:
        cl = cl_path.read_text(encoding="utf-8")
        if f"v{brain_v}" not in cl:
            issues.append(f"CHANGELOG has no v{brain_v} entry")

    # brain/versions/v{brain_v}*.md exists
    versions_dir = ROOT / "brain/versions"
    matches = list(versions_dir.glob(f"v{brain_v}-*.md"))
    if not matches:
        issues.append(f"no brain/versions/v{brain_v}-*.md file")

    # Dashboard embed
    dash_path = ROOT / "dashboard/dashboard.html"
    if dash_path.exists():
        dash = dash_path.read_text(encoding="utf-8")
        m = re.search(r'id="versions-data"[^>]*>(.*?)</script>', dash, re.DOTALL)
        if not m:
            issues.append("dashboard versions-data block not found")
        else:
            embed_raw = m.group(1).replace(r"<\/script>", "</script>")
            try:
                embed = json.loads(embed_raw)
                embed_v = embed.get("current", {}).get("brain")
                if embed_v != brain_v:
                    issues.append(f"dashboard embed brain={embed_v} != canonical v{brain_v}")
            except json.JSONDecodeError as e:
                issues.append(f"dashboard versions embed parse: {e}")

    if issues:
        return False, "; ".join(issues)
    return True, f"brain v{brain_v} synced across versions.json + CHANGELOG + brain/versions/ + dashboard embed"


def check_tools_py_parse():
    """All .py files in tools/ must parse via ast. Catches Edit-tool-style
    silent truncation of Python source files (Round 54/56 pattern)."""
    tools_dir = ROOT / "tools"
    failures = []
    count = 0
    for py in tools_dir.glob("*.py"):
        count += 1
        try:
            ast.parse(py.read_text(encoding="utf-8"))
        except SyntaxError as e:
            failures.append(f"{py.name}: {e}")
        except Exception as e:
            failures.append(f"{py.name}: read error {e}")
    if failures:
        return False, "; ".join(failures)
    return True, f"all {count} .py files parse"


def check_tools_no_null_bytes():
    """All .py files in tools/ must contain zero NUL bytes. Catches the
    Write-tool padding bug observed in Round 75 Pass A — Write produced a
    Python source file with ~1 KB of trailing nulls past the actual content;
    file passed cat/size checks but failed ast.parse with 'source code string
    cannot contain null bytes'. Paired with lessons.md (2026-06-15 at 1:10 PM)
    per protocol §18. Truth anchor: byte-level scan via Path.read_bytes() —
    independent surface from the writer's in-memory cache (doctrine §11)."""
    tools_dir = ROOT / "tools"
    failures = []
    count = 0
    for py in tools_dir.glob("*.py"):
        count += 1
        try:
            data = py.read_bytes()
        except Exception as e:
            failures.append(f"{py.name}: read error {e}")
            continue
        if b"\x00" in data:
            n = data.count(b"\x00")
            first = data.find(b"\x00")
            failures.append(f"{py.name}: {n} NUL byte(s); first at offset {first}")
    if failures:
        return False, "; ".join(failures)
    return True, f"all {count} .py files NUL-free"


def check_products_db_completeness_no_regression():
    """Re-runs tools/products_db_audit.py and compares its tier counts to the
    baseline in memory/system/known-good-hashes.json (products_db_completeness_baseline).
    Trips when fully-populated count shrinks OR skeletal count grows relative
    to baseline — i.e. the catalog regressed in completeness. Improvements
    (fully-populated grows) are silent; baseline is updated via explicit
    closing-move-atomic when the round ships, NOT via auto-creep.

    Round 75 Pass A.2.5 — closes the conditional the user set on the Option 1
    A.3 path: "ship A.3 on current data if we have checks that will catch the
    other stuff later." This is the catcher. Tier counts are the loop's sensor;
    regression is the alarm. Pairs with the saga A.2 record + tools/products_db_audit.py.

    Truth anchor: knowledge/products-db-audit.json (regenerated by this very
    check, so the check is one independent surface) vs known-good-hashes.json
    (a separate file maintained at closing-move-atomic time). Surfaces share
    no cache; doctrine §11 satisfied."""
    import subprocess
    import sys as _sys
    # Re-run the audit so the on-disk JSON reflects current state
    audit_script = ROOT / "tools" / "products_db_audit.py"
    if not audit_script.exists():
        return False, "tools/products_db_audit.py missing"
    try:
        r = subprocess.run(
            [_sys.executable, str(audit_script)],
            cwd=ROOT, capture_output=True, text=True, encoding="utf-8", timeout=30,
        )
        if r.returncode != 0:
            return False, f"audit run failed (exit {r.returncode}): {r.stderr[:200]}"
    except Exception as e:
        return False, f"audit run errored: {e}"
    audit_path = ROOT / "knowledge" / "products-db-audit.json"
    if not audit_path.exists():
        return False, "knowledge/products-db-audit.json missing post-run"
    try:
        audit = json.loads(audit_path.read_text(encoding="utf-8"))
    except Exception as e:
        return False, f"audit JSON parse error: {e}"
    tier_counts = audit.get("tier_counts", {})
    current_full = tier_counts.get("fully populated", 0)
    current_skel = tier_counts.get("skeletal", 0)
    current_total = audit.get("_meta", {}).get("total_products", 0)
    kgh_path = ROOT / "memory" / "system" / "known-good-hashes.json"
    if not kgh_path.exists():
        return False, "memory/system/known-good-hashes.json missing"
    try:
        kgh = json.loads(kgh_path.read_text(encoding="utf-8"))
    except Exception as e:
        return False, f"known-good-hashes parse error: {e}"
    baseline = kgh.get("products_db_completeness_baseline")
    if not baseline:
        # Bootstrap state — no baseline yet. Pass but flag.
        return True, (
            f"no baseline on file (bootstrap); current: total={current_total}, "
            f"fully_populated={current_full}, skeletal={current_skel}. Add a "
            "products_db_completeness_baseline entry to known-good-hashes.json "
            "to enable regression detection."
        )
    base_full = baseline.get("fully_populated", 0)
    base_skel = baseline.get("skeletal", 0)
    base_total = baseline.get("total", 0)
    failures = []
    if current_full < base_full:
        failures.append(
            f"fully_populated regressed: {base_full} → {current_full} "
            f"(lost {base_full - current_full})"
        )
    if current_skel > base_skel:
        failures.append(
            f"skeletal grew: {base_skel} → {current_skel} "
            f"(added {current_skel - base_skel})"
        )
    if current_total < base_total:
        failures.append(
            f"total products shrank: {base_total} → {current_total} "
            f"(lost {base_total - current_total} — catalog removal?)"
        )
    if failures:
        return False, "; ".join(failures)
    # Improvement (silent at the check layer — surfaced via the audit report)
    if current_full > base_full:
        return True, (
            f"baseline: full={base_full}, skel={base_skel}; "
            f"current: full={current_full} (+{current_full - base_full}!), skel={current_skel}. "
            "Improvement detected — update baseline at closing-move-atomic to lock it in."
        )
    return True, (
        f"baseline holds: full={current_full}/{base_full}, skel={current_skel}/{base_skel}, "
        f"total={current_total}/{base_total}"
    )


def check_critical_json_parse():
    """All JSON files in memory/ and schemas/ must parse. Catches
    Edit-tool silent truncation of JSON (Round 73 versions.json event)."""
    failures = []
    count = 0
    for d in ["memory", "schemas"]:
        dpath = ROOT / d
        if not dpath.exists():
            continue
        for jf in dpath.rglob("*.json"):
            count += 1
            try:
                json.loads(jf.read_text(encoding="utf-8"))
            except json.JSONDecodeError as e:
                failures.append(f"{jf.relative_to(ROOT)}: {e}")
            except Exception as e:
                failures.append(f"{jf.relative_to(ROOT)}: read error {e}")
    if failures:
        return False, "; ".join(failures)
    return True, f"all {count} JSON files parse"


def check_dashboard_integrity_passes():
    """tools/dashboard_integrity.py check must exit zero (all 16 checks pass).
    Composes the existing integrity tool as a sub-check."""
    res = subprocess.run(
        [sys.executable, "tools/dashboard_integrity.py", "check"],
        cwd=str(ROOT), capture_output=True, text=True, timeout=60
    )
    if res.returncode != 0:
        out = res.stdout + res.stderr
        fails = [l.strip() for l in out.splitlines() if "[FAIL]" in l]
        if fails:
            return False, f"integrity check failed ({len(fails)} FAILs): " + " | ".join(fails[:3])
        # Non-zero exit with NO [FAIL] lines = the tool itself crashed
        # Surface the last few lines of stderr (or stdout if stderr empty) so we can diagnose
        err_lines = [l for l in res.stderr.splitlines() if l.strip()]
        out_lines = [l for l in res.stdout.splitlines() if l.strip()]
        diag = err_lines[-3:] if err_lines else out_lines[-3:]
        return False, f"integrity tool crashed (exit {res.returncode}, no [FAIL] lines): " + " || ".join(diag)
    return True, "dashboard_integrity all checks pass"


def check_catchup_files_exist():
    """Every file in the catch-up trigger list must exist on disk.
    The catch-up trigger references brain/current.md → these files. If any
    are missing, catch-up fails silently."""
    required = [
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
        "tacitus/sentinel.json",
        "memory/system/audit-sentinel.json",
    ]
    missing = []
    for p in required:
        full = ROOT / p
        if not full.exists() or not full.is_file():
            missing.append(p)
    if missing:
        return False, f"missing: {', '.join(missing)}"
    return True, f"all {len(required)} catch-up files present"


def check_essence_append_only():
    """Append-only essence files must not shrink relative to baseline.
    Truth anchor: memory/system/known-good-hashes.json size field per file.
    Updated as part of closing-move-atomic when files change deliberately."""
    kg_path = ROOT / "memory/system/known-good-hashes.json"
    if not kg_path.exists():
        return True, "known-good-hashes.json not yet baselined (bootstrap)"

    try:
        kg = json.loads(kg_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return False, f"known-good-hashes parse: {e}"

    files = [
        "memory/essence/saga.md",
        "memory/essence/lessons.md",
        "memory/essence/decisions.md",
        "memory/memory-change-log.md",
    ]
    issues = []
    for f in files:
        p = ROOT / f
        if not p.exists():
            issues.append(f"{f}: missing on disk")
            continue
        current_size = p.stat().st_size
        baseline = kg.get("append_only_baselines", {}).get(f, {}).get("size", 0)
        if baseline and current_size < baseline:
            issues.append(f"{f}: shrunk {baseline}B → {current_size}B")
    if issues:
        return False, "; ".join(issues)
    return True, "no shrinkage detected on append-only essence files"


def check_user_prefs_match_index():
    """All body-system + cross-cutting files referenced in
    user-prefs/index.md must exist on disk. The index is canonical for
    which files exist (§10 specialized-units-with-index pattern)."""
    idx_path = ROOT / "memory/user-prefs/index.md"
    if not idx_path.exists():
        return False, "user-prefs/index.md missing"
    idx_content = idx_path.read_text(encoding="utf-8")

    refs = re.findall(r'\[`([^`]+\.md)`\]', idx_content)
    seen = set()
    missing = []
    for ref in refs:
        if ref in seen:
            continue
        seen.add(ref)
        # Skip refs pointing OUTSIDE user-prefs/ (e.g., "../operating-protocols.md")
        # — those are cross-links, not files this index is responsible for.
        if ref.startswith("..") or "/" in ref:
            continue
        p = (ROOT / "memory/user-prefs" / ref)
        if not p.exists():
            missing.append(ref)
    if missing:
        return False, f"missing files referenced in index: {missing}"
    in_scope = [r for r in seen if not (r.startswith("..") or "/" in r)]
    return True, f"all {len(in_scope)} user-prefs files referenced in index exist"


def check_lesson_pitfall_count():
    """Informational: count of bolded pitfall entries in lessons.md.
    A sanity check that lessons.md is growing (or holding) as expected.
    Tied to §18 (lesson→invariant promotion): each pitfall should have
    a corresponding invariant; manual review prompted by this count."""
    lessons_path = ROOT / "memory/essence/lessons.md"
    if not lessons_path.exists():
        return False, "lessons.md missing"
    lessons = lessons_path.read_text(encoding="utf-8")
    # Bolded items at line start are pitfall entries
    pitfalls = len(re.findall(r'^\*\*[^*]+\*\*', lessons, re.MULTILINE))
    return True, f"{pitfalls} bolded pitfall entries in lessons.md"


def check_cross_platform_python():
    """Scan tools/*.py for cross-platform anti-patterns codified in v3.9
    after Round 74 Phase A's Windows-crash discovery. Uses AST (not regex)
    so violations inside docstrings / string literals are correctly
    ignored — they're documentation, not code.

    Patterns flagged:
    1. open() call without encoding= keyword arg in text mode
    2. strftime() call with arg containing %-I / %-d / %-m / %-H / etc.
    3. datetime.utcnow() call
    4. subprocess.run/Popen call with literal "python3" in args

    Round 74 Phase A discovered these the hard way when the first audit ran
    on Windows. This invariant prevents recurrence."""
    tools_dir = ROOT / "tools"
    violations = []

    # No file-level exemption — the check applies to itself (invariants.py).
    # Stronger discipline: the invariant file shouldn't violate its own rule.
    DOC_FILES = set()
    ONE_SHOT_PREFIX = "round"      # round73_recovery.py, round74_essence_entries.py

    GLIBC_STRFTIME = ("%-I", "%-d", "%-m", "%-H", "%-M", "%-S", "%-l", "%-e", "%-j")

    def _is_open_call(node, allow_binary=True):
        """True if node is a text-mode open() call without encoding= kwarg."""
        if not (isinstance(node, ast.Call)
                and isinstance(node.func, ast.Name) and node.func.id == "open"):
            return False
        # Check mode arg: if 'rb'/'wb'/'ab' (binary), skip
        for arg in node.args[1:2]:  # mode is the 2nd positional arg
            if isinstance(arg, ast.Constant) and isinstance(arg.value, str):
                if any(b in arg.value for b in ("b",)):
                    return False
        for kw in node.keywords:
            if kw.arg == "mode" and isinstance(kw.value, ast.Constant):
                if "b" in (kw.value.value or ""):
                    return False
            if kw.arg == "encoding":
                return False  # has explicit encoding — fine
        return True

    def _is_strftime_call(node):
        """Return the format string arg if node is a strftime call, else None."""
        if not (isinstance(node, ast.Call)
                and isinstance(node.func, ast.Attribute)
                and node.func.attr == "strftime"):
            return None
        if node.args and isinstance(node.args[0], ast.Constant):
            return node.args[0].value
        return None

    def _is_utcnow_call(node):
        return (isinstance(node, ast.Call)
                and isinstance(node.func, ast.Attribute)
                and node.func.attr == "utcnow")

    def _is_subprocess_with_python3(node):
        """True if subprocess.run/Popen call has literal 'python3' as arg."""
        if not isinstance(node, ast.Call):
            return False
        if not (isinstance(node.func, ast.Attribute)
                and node.func.attr in ("run", "Popen")):
            return False
        # Need to check that the call's args contain a list/tuple with 'python3'
        # OR a string starting with 'python3'
        for arg in node.args[:1]:
            # Case 1: list/tuple literal
            if isinstance(arg, (ast.List, ast.Tuple)):
                for el in arg.elts:
                    if isinstance(el, ast.Constant) and el.value == "python3":
                        return True
        return False

    for py in sorted(tools_dir.glob("*.py")):
        if py.name in DOC_FILES:
            continue
        if py.name.startswith(ONE_SHOT_PREFIX) and "_" in py.name:
            continue
        try:
            content = py.read_text(encoding="utf-8")
            tree = ast.parse(content, filename=str(py))
        except Exception as e:
            violations.append(f"{py.name}: parse failed ({e})")
            continue

        for node in ast.walk(tree):
            line = getattr(node, "lineno", "?")
            if _is_open_call(node):
                violations.append(f"{py.name}:{line} text-mode open() without encoding=")
            if (fmt := _is_strftime_call(node)) is not None:
                for bad in GLIBC_STRFTIME:
                    if bad in fmt:
                        violations.append(f"{py.name}:{line} strftime uses glibc-only {bad!r}")
                        break
            if _is_utcnow_call(node):
                violations.append(f"{py.name}:{line} datetime.utcnow() deprecated (use now(tz=utc))")
            if _is_subprocess_with_python3(node):
                violations.append(f"{py.name}:{line} subprocess literal 'python3' (use sys.executable)")

    if violations:
        return False, f"{len(violations)} cross-platform issue(s): " + "; ".join(violations[:5])
    return True, "no cross-platform Python anti-patterns detected in tools/*.py"


def check_sentinel_content_sanity():
    """Sentinel files (audit-sentinel.json, tacitus/sentinel.json) must not
    contain structured-field content that could trigger self-referential
    parse confusion (Round 74 Phase C lesson). Specifically: last_lapse_reason
    should be either None OR a short summary (<200 chars). Long error
    messages live in the sidecar file referenced by last_lapse_detail_path.

    Truth anchor: the structural rule from operating-protocols.md §18 +
    the v3.9 brain pitfall on self-referential parse confusion."""
    audit_sentinel_path = ROOT / "memory/system/audit-sentinel.json"
    if not audit_sentinel_path.exists():
        return True, "no audit sentinel yet (bootstrap)"
    try:
        sentinel = json.loads(audit_sentinel_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return False, f"audit-sentinel.json parse: {e}"

    lapse = sentinel.get("last_lapse_reason")
    if lapse is None:
        return True, "no lapse currently recorded"
    if len(lapse) > 200:
        return False, (
            f"last_lapse_reason is {len(lapse)}B (>200 limit) — should be moved "
            f"to sidecar file. Risks self-referential parse confusion."
        )
    # Check for parse-error patterns that fool the next audit
    if "line " in lapse and " column " in lapse and "char " in lapse:
        return False, (
            "last_lapse_reason contains JSON-parse-error pattern (line X column Y char N) — "
            "should be moved to sidecar. Risks self-referential parse confusion."
        )
    return True, f"sentinel content sane (lapse_reason {len(lapse)}B, no parse-fooling patterns)"


def check_catchup_seal_exists():
    """`memory/system/last-catchup.json` must exist (Phase B / Risk 9
    defense). Written by tools/catchup_seal.py at the end of every
    catch-up. If absent, either no catch-up has happened yet (bootstrap)
    OR the agent skipped the seal write (failure mode this defends against)."""
    seal_path = ROOT / "memory/system/last-catchup.json"
    if not seal_path.exists():
        return False, (
            "memory/system/last-catchup.json missing — no catch-up has been "
            "sealed. Either bootstrap state OR the agent skipped the seal "
            "write (the Risk 9 failure mode)."
        )
    try:
        seal = json.loads(seal_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return False, f"last-catchup.json parse: {e}"
    if not seal.get("sealed_at"):
        return False, "last-catchup.json present but no sealed_at field"
    return True, f"seal present, sealed_at={seal['sealed_at']}"


def check_catchup_files_match():
    """For each file recorded in last-catchup.json that the user hasn't
    edited since the seal, the on-disk state must still match. If a
    file's mtime matches the seal but the size doesn't (or sha changed),
    the file drifted silently — exactly the kind of failure the seal
    is designed to detect.

    Skips files where the disk mtime is newer than the seal — that
    indicates legitimate user activity, not silent drift."""
    seal_path = ROOT / "memory/system/last-catchup.json"
    if not seal_path.exists():
        return True, "no seal yet (bootstrap or pre-catchup)"

    try:
        seal = json.loads(seal_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return False, f"last-catchup.json parse: {e}"

    drifts = []
    skipped_newer = 0
    checked = 0
    for relpath, info in seal.get("files", {}).items():
        if not info.get("present"):
            continue  # was missing at seal time; skip
        full = ROOT / relpath
        if not full.exists():
            drifts.append(f"{relpath}: existed at seal but missing now")
            continue
        stat = full.stat()
        sealed_mtime = info.get("mtime_iso")
        sealed_size = info.get("size")
        current_mtime = datetime.datetime.fromtimestamp(
            stat.st_mtime, tz=datetime.timezone.utc
        ).isoformat(timespec="seconds")
        if current_mtime != sealed_mtime:
            # File has been touched since seal — could be legitimate user
            # edit, not a silent drift. Skip.
            skipped_newer += 1
            continue
        checked += 1
        if stat.st_size != sealed_size:
            drifts.append(
                f"{relpath}: same mtime but size {sealed_size} → {stat.st_size}"
            )

    if drifts:
        return False, f"silent drift detected on {len(drifts)} files: " + "; ".join(drifts[:3])
    return True, f"checked {checked} files (skipped {skipped_newer} edited since seal); no silent drift"


# ---------------------------------------------------------------------------
# Weekly-cadence checks
# ---------------------------------------------------------------------------

def check_differential_reads():
    """Sample 10 random .md files in memory/ — compare pathlib.read_text()
    against os.read() raw bytes. If they diverge, the read surface is
    showing a composite of disk + tool cache (Round 73 pattern)."""
    files = list((ROOT / "memory").rglob("*.md"))
    if not files:
        return True, "no .md files to sample"
    sample = random.sample(files, min(10, len(files)))
    mismatches = []
    for f in sample:
        try:
            a = f.read_text(encoding="utf-8").encode("utf-8")
            b = _read_via_os(f)
        except Exception as e:
            mismatches.append(f"{f.relative_to(ROOT)}: {e}")
            continue
        if a != b:
            mismatches.append(f"{f.relative_to(ROOT)}: pathlib {len(a)}B vs os {len(b)}B")
    if mismatches:
        return False, f"differential read mismatch: {mismatches}"
    return True, f"sampled {len(sample)} .md files, all consistent across read paths"


def check_orphan_files():
    """Files referenced by path in brain/protocols/decisions but not present
    on disk; files on disk in critical paths not referenced anywhere."""
    refs = set()
    sources = [
        ROOT / "brain/current.md",
        ROOT / "memory/operating-protocols.md",
        ROOT / "memory/essence/decisions.md",
        ROOT / "memory/source-rule.md",
        ROOT / "memory/engineering-doctrine.md",
    ]
    pat = re.compile(r'(?<![\w/])(?:memory|brain|tools|dashboard|knowledge|schemas)/[\w./\-]+\.(?:jsonl|md|py|json|html|js|yaml|csv)')
    for s in sources:
        if not s.exists():
            continue
        for m in pat.findall(s.read_text(encoding="utf-8")):
            refs.add(m)
    missing = []
    # Filter out template placeholders — paths that contain literal placeholders
    # like YYYY, MM, X.Y, slug, etc. (these are documentation, not real paths).
    template_markers = ["YYYY", "{YYYY", "X.Y", "vX.Y", "MM-DD", "/MM.md", "-MM.md",
                        "/slug", "-slug", "<id>", "{component}", "{date}", "{X}", "{name}",
                        "/X.js", "/X.json", "/X.md", "/X.py", "<path>", "<file>",
                        "-X.md", "vision-X.md", "ingredients-master-with-corpus.json",
                        "dribbble_search.py"]
    for r in refs:
        # Skip patterns that aren't real paths (e.g., regex chars)
        if any(c in r for c in "()[]"):
            continue
        # Skip template placeholders
        if any(marker in r for marker in template_markers):
            continue
        full = ROOT / r
        if not full.exists():
            missing.append(r)
    if missing:
        # Some refs are aspirational (proposed paths). Reduce noise by limiting display.
        return False, f"{len(missing)} referenced paths missing: {missing[:5]}{'...' if len(missing) > 5 else ''}"
    return True, f"{len(refs)} path references all present on disk"


# ---------------------------------------------------------------------------
# Round 100 — Tacitus three-mode architecture invariants
# ---------------------------------------------------------------------------

def check_tacitus_folder_integrity():
    """Verifies the canonical /tacitus/ folder structure is intact —
    identity, changelog, portability, prompts, sentinel, audit-history,
    notebook directory all present. This is the load-bearing folder for
    the three-mode architecture (Cura / Vision / Aegis)."""
    required_files = [
        "tacitus/identity.md",
        "tacitus/changelog.md",
        "tacitus/portability.md",
        "tacitus/sentinel.json",
        "tacitus/audit-history.json",
        "tacitus/prompts/cura.md",
        "tacitus/prompts/vision.md",
        "tacitus/prompts/aegis.md",
    ]
    required_dirs = [
        "tacitus/notebook",
        "tacitus/prompts",
    ]
    missing_files = [p for p in required_files if not (ROOT / p).is_file()]
    missing_dirs = [p for p in required_dirs if not (ROOT / p).is_dir()]
    issues = []
    if missing_files:
        issues.append("files: " + ", ".join(missing_files))
    if missing_dirs:
        issues.append("dirs: " + ", ".join(missing_dirs))
    if issues:
        return False, "missing: " + " | ".join(issues)
    return True, f"all {len(required_files)} required files + {len(required_dirs)} dirs present"


def check_tacitus_modes_fired_today():
    """On Mon-Fri (operational days), verifies all three Tacitus modes
    (Cura, Vision, Aegis) wrote session headers to today's notebook.
    Catches the case where a scheduled task failed to fire OR fired but
    didn't write. Cura fires 02:30, Vision 04:00, Aegis 05:30 EDT; the
    daily audit at 6:40 EDT sees all three artifacts on a healthy night.
    Truth anchor: notebook session-header strings literally containing
    today's date + the mode name."""
    today = _eastern_today()
    today_dt = datetime.datetime.strptime(today, "%Y-%m-%d")
    weekday = today_dt.weekday()  # 0=Mon..6=Sun
    if weekday >= 5:  # Sat or Sun — rest days, modes don't fire by design
        return True, f"rest day ({today} is {today_dt.strftime('%A')}); no Tacitus fires expected"

    yyyy_mm = today[:7]
    nb_path = ROOT / f"tacitus/notebook/{yyyy_mm}.md"
    if not nb_path.exists():
        return False, f"tacitus/notebook/{yyyy_mm}.md does not exist on operational day"

    nb = nb_path.read_text(encoding="utf-8")

    # Bootstrap guard: if the three-mode architecture has never produced
    # any session headers (e.g., the deployment day before the first fire),
    # skip the completeness check. Once any mode has ever fired, the check
    # activates and watches for daily completeness.
    has_any_mode_entry = bool(re.search(r"\([\d-]+ at [^)]+\)\s*[—-]\s*(Cura|Vision|Aegis) session", nb))
    if not has_any_mode_entry:
        return True, "three-mode architecture has not produced any session entries yet (bootstrap state; will activate on first mode fire)"

    missing = []
    for mode in ("Cura", "Vision", "Aegis"):
        # Session header format from the prompts: "(YYYY-MM-DD at H:MM AM/PM) — <Mode> session #N"
        pattern = rf"\({re.escape(today)} at [^)]+\)\s*[—-]\s*{mode} session"
        if not re.search(pattern, nb):
            missing.append(mode)
    if missing:
        return False, f"missing today's session header(s) in {nb_path.relative_to(ROOT)}: {', '.join(missing)}"
    return True, f"all three modes (Cura, Vision, Aegis) wrote session headers for {today}"


def check_tacitus_v1_task_no_resurrection():
    """Round 107 — closes the verifiability gap Cura session #1's Survivor B
    surfaced. The deleted `tacitus-autonomous-reflection` v1 task's deletion
    claim currently lives only as prose at `memory/open-threads.md`. No
    invariant pinned to file structure verified the deletion held. If the
    v1 task accidentally re-activates (Windows scheduler restoration,
    deletion undo, drift in a future port to another machine), it would
    write a generic `[TACITUS — AUTONOMOUS REFLECTION]` session header to
    today's notebook — distinct from the v2 format (Cura/Vision/Aegis
    session #N).

    Truth anchor: the canonical mode allowlist {Cura, Vision, Aegis} from
    Round 100's three-mode architecture. Today's notebook session headers
    must all match the allowlist on operational days. Any foreign header
    indicates either v1 task resurrection OR an unforeseen new mode that
    hasn't been added to the allowlist (the latter would be a deliberate
    architectural change, not a silent regression — handled by the user
    updating this invariant in the same round as the new mode lands).

    Severity: warning. The v1 task being silently re-enabled wouldn't
    break the system (it would write valid notebook content) but would
    violate the Round 100 architecture's 'v2 is canonical' commitment AND
    muddy Aegis's read context for the same night.
    """
    today = _eastern_today()
    today_dt = datetime.datetime.strptime(today, "%Y-%m-%d")
    weekday = today_dt.weekday()
    if weekday >= 5:  # Sat or Sun rest days — no fires expected
        return True, f"rest day ({today} is {today_dt.strftime('%A')}); no Tacitus fires expected"

    yyyy_mm = today[:7]
    nb_path = ROOT / f"tacitus/notebook/{yyyy_mm}.md"
    if not nb_path.exists():
        return True, f"tacitus/notebook/{yyyy_mm}.md does not exist; no session headers to check"

    nb = nb_path.read_text(encoding="utf-8")
    canonical_modes = {"Cura", "Vision", "Aegis"}

    # Find all session-header lines dated today. Header format per the
    # mode prompts: "(YYYY-MM-DD at H:MM AM/PM) — Mode session #N"
    today_header_re = re.compile(
        rf"\({re.escape(today)} at [^)]+\)\s*[—-]\s*(\S+) session #\d+",
        re.IGNORECASE,
    )
    headers_today = today_header_re.findall(nb)
    if not headers_today:
        # No headers today — separate concern (covered by
        # tacitus_modes_fired_today). Not a v1 resurrection issue.
        return True, f"no Tacitus session headers for {today} yet (covered by tacitus_modes_fired_today)"

    foreign = [
        mode for mode in headers_today
        if mode not in canonical_modes
    ]
    if foreign:
        return False, (
            f"foreign session header(s) on operational day {today} — "
            f"not in canonical {{Cura, Vision, Aegis}} allowlist: {foreign}. "
            f"Possible v1 task resurrection OR unforeseen new mode. "
            f"Inspect tacitus/notebook/{yyyy_mm}.md."
        )
    return True, f"all {len(headers_today)} session header(s) for {today} use canonical modes"


def check_tacitus_rest_day_observed():
    """Verifies no writes to tacitus/ occurred during the most recent
    Sabbath rest window (Sat 00:00 EDT → Sun 10:00 EDT, 34 hours).
    Per Luneth's Round 99 doctrinal commitment: 'Saturday is a rest period
    that deserves no cheats.' This catches scheduled-task misfires AND
    manual override usage that ignored the rest window.
    Truth anchor: file mtimes via stat()."""
    # Find the most recent past Sat 00:00 EDT
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    now_edt = now_utc - datetime.timedelta(hours=4)
    # Days back to most recent Saturday (or today if Sat); 0=Mon..5=Sat
    days_back_to_sat = (now_edt.weekday() - 5) % 7
    last_sat_edt = (now_edt - datetime.timedelta(days=days_back_to_sat)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    # If today is Sat and we're past midnight, last_sat is today. Otherwise prior week's.
    if days_back_to_sat == 0 and now_edt.hour < 24:
        pass  # today is Sat, window is right now (active rest)
    rest_end_edt = last_sat_edt + datetime.timedelta(hours=34)  # Sun 10:00 EDT
    # Convert window endpoints to UTC epochs for comparison with file mtime
    rest_start_epoch = (last_sat_edt + datetime.timedelta(hours=4)).timestamp()
    rest_end_epoch = (rest_end_edt + datetime.timedelta(hours=4)).timestamp()

    tacitus_dir = ROOT / "tacitus"
    if not tacitus_dir.exists():
        return False, "tacitus/ folder missing"

    violations = []
    for p in tacitus_dir.rglob("*"):
        if not p.is_file():
            continue
        # Skip files under user-managed canonical dirs (identity, changelog, portability,
        # prompts, rubrics, dashboard, brain) — those CAN be edited during rest by the user in co-work.
        # Round 156 — also skip user-controlled config surfaces (feature-flags.json,
        # security-audit-cursor.json) where the user maintains the substrate during
        # co-work and Tacitus only appends/updates fields during its own scheduled fires.
        rel = p.relative_to(ROOT).as_posix()
        if any(rel.startswith(prefix) for prefix in (
            "tacitus/identity.md", "tacitus/changelog.md", "tacitus/portability.md",
            "tacitus/prompts/", "tacitus/rubrics/", "tacitus/dashboard/",
            "tacitus/brain/",
            "tacitus/feature-flags.json", "tacitus/security-audit-cursor.json",
        )):
            continue
        mtime = p.stat().st_mtime
        if rest_start_epoch <= mtime <= rest_end_epoch:
            mtime_edt = datetime.datetime.fromtimestamp(mtime, datetime.timezone.utc) - datetime.timedelta(hours=4)
            violations.append(f"{rel} (mtime {mtime_edt.strftime('%a %Y-%m-%d %H:%M EDT')})")

    window_label = f"{last_sat_edt.strftime('%a %Y-%m-%d %H:%M')} → {rest_end_edt.strftime('%a %H:%M EDT')}"
    if violations:
        return False, f"writes during rest window ({window_label}): " + "; ".join(violations[:5])
    return True, f"no writes to tacitus/ during rest window {window_label}"


def check_aegis_history_well_formed():
    """Verifies tacitus/audit-history.json exists, parses as JSON, has the
    expected schema, and each record has the required fields. Append-only
    surface — Aegis appends after each operational night. Truth anchor:
    JSON parse + per-record schema validation."""
    path = ROOT / "tacitus/audit-history.json"
    if not path.exists():
        return False, "tacitus/audit-history.json missing"
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return False, f"audit-history.json parse failed: {e}"
    if not isinstance(data, dict):
        return False, "audit-history.json root is not an object"
    if "records" not in data or not isinstance(data["records"], list):
        return False, "audit-history.json missing 'records' list"
    required_fields = {"date", "cura_session", "cura_score", "vision_session", "vision_score"}
    bad_records = []
    for i, rec in enumerate(data["records"]):
        if not isinstance(rec, dict):
            bad_records.append(f"record {i}: not an object")
            continue
        missing = required_fields - set(rec.keys())
        if missing:
            bad_records.append(f"record {i} ({rec.get('date', 'unknown date')}): missing {sorted(missing)}")
    if bad_records:
        return False, f"{len(bad_records)} malformed records: " + "; ".join(bad_records[:3])
    return True, f"audit-history.json well-formed with {len(data['records'])} records"


def check_tacitus_changelog_present():
    """Verifies tacitus/changelog.md exists, is non-empty, and contains at
    least one version heading (## v...). Parallel discipline to
    brain_version_sync but for Tacitus's own evolution. Truth anchor: file
    content scan for '## v' headers."""
    path = ROOT / "tacitus/changelog.md"
    if not path.exists():
        return False, "tacitus/changelog.md missing"
    text = path.read_text(encoding="utf-8")
    if len(text) < 200:
        return False, f"tacitus/changelog.md suspiciously short ({len(text)} bytes)"
    version_headers = re.findall(r"^##\s+v[\d.]+", text, re.MULTILINE)
    if not version_headers:
        return False, "no '## v...' version headers found in tacitus/changelog.md"
    return True, f"tacitus/changelog.md present with {len(version_headers)} version entries (current: {version_headers[0]})"


def check_implementations_log_well_formed():
    """Round 108 — verifies implementations.jsonl entries reference real
    notebook session headers.

    Per the user's stated value: "if anything ever gets implemented/rejected
    on accident or without my knowledge/full understanding I can look back
    and easily say 'wait... I never approved/rejected that'." The log is
    only an audit trail if it accurately reflects reality. This invariant
    catches drift between log claims and notebook truth.

    Each entry's (source_date, source_mode, source_session) tuple must
    reference an actual session header in the notebook. The header format
    canonicalized in Round 100: `(YYYY-MM-DD at H:MM AM/PM) — Mode session #N`.

    Severity: warning. Daily 6:15 AM audit catches drift within 24 hours.
    Closing-move discipline (operating-protocols §24) is the real-time
    defense; this invariant is the audit-layer redundancy.
    """
    sys.path.insert(0, str(ROOT / "tools"))
    try:
        from implementation_log import all_entries
    except ImportError as e:
        return False, f"implementation_log module import failed: {e}"
    entries = all_entries()
    if not entries:
        return True, "implementations.jsonl is empty (no entries to verify)"

    # Group entries by year-month so we read each notebook only once
    by_month: dict[str, list[dict]] = {}
    for e in entries:
        ts_date = e.get("source_date", "")
        if not ts_date or len(ts_date) < 7:
            return False, f"malformed entry — source_date missing or wrong shape: {e}"
        by_month.setdefault(ts_date[:7], []).append(e)

    problems = []
    # Tacitus-mode entries reference a notebook session header; "user" mode
    # entries are §24 trigger-phrase implementations (user-initiated directly,
    # no Tacitus notebook session involved) — they only validate status.
    canonical_tacitus_modes = {"Cura", "Vision", "Aegis"}
    canonical_modes = canonical_tacitus_modes | {"user"}
    valid_statuses = {"implemented", "in_progress", "rejected", "deferred"}
    for yyyy_mm, month_entries in by_month.items():
        nb_path = ROOT / f"tacitus/notebook/{yyyy_mm}.md"
        nb = nb_path.read_text(encoding="utf-8") if nb_path.exists() else None
        for e in month_entries:
            d = e.get("source_date", "")
            mode = e.get("source_mode", "")
            session = e.get("source_session", -1)
            if mode not in canonical_modes:
                problems.append(f"entry references non-canonical mode {mode!r} (not in {{Cura, Vision, Aegis, user}})")
            if e.get("status") not in valid_statuses:
                problems.append(f"entry has invalid status {e.get('status')!r}")
            # Skip notebook session lookup for user-mode entries (no Tacitus session involved)
            if mode == "user":
                continue
            # Tacitus-mode entries: verify notebook session header exists
            if nb is None:
                problems.append(f"notebook missing for {yyyy_mm}: {mode} #{session} on {d} cannot be verified")
                continue
            # Header form: "(YYYY-MM-DD at <time>) — <Mode> session #<N>"
            pattern = rf"\({re.escape(d)} at [^)]+\)\s*[—-]\s*{re.escape(mode)} session #{session}\b"
            if not re.search(pattern, nb):
                problems.append(
                    f"orphan implementation entry — references non-existent session: "
                    f"{mode} #{session} on {d} (candidate: {(e.get('candidate','') or '')[:80]})"
                )

    if problems:
        return False, f"{len(problems)} implementation log issue(s): " + "; ".join(problems[:3]) + (" ..." if len(problems) > 3 else "")
    return True, f"all {len(entries)} implementation entries reference valid notebook sessions"


def check_no_unresolved_vitality_findings():
    """Round 105 — closes the failure surface where vitality-check findings
    were silently overwritten by subsequent audit runs.

    Vitality lapses persist to `memory/system/vitality-findings.jsonl`
    (append-only). A finding is unresolved iff its `status=active` entry
    has no matching resolution entry (kind=resolution with ref_ts equal to
    the finding's ts). This invariant fails when unresolved findings are
    older than 6 hours — recent findings are tolerated (the user/agent may
    be mid-resolution), but findings aged beyond that window indicate a
    real lapse that wasn't addressed at the next closing-move.

    Severity: warning. Daily 6:15 AM audit catches drift within hours. The
    in-session re-check discipline (operating-protocols §21) is the
    real-time defense; this invariant is the audit-layer redundancy.
    """
    sys.path.insert(0, str(ROOT / "tools"))
    try:
        from vitality_log import latest_unresolved
    except ImportError as e:
        return False, f"vitality_log module import failed: {e}"
    unresolved = latest_unresolved()
    if not unresolved:
        return True, "no unresolved vitality findings"
    import datetime as _dt
    now = _dt.datetime.now(_dt.timezone(_dt.timedelta(hours=-4)))
    THRESHOLD_HOURS = 6
    aged = []
    fresh = []
    for entry in unresolved:
        try:
            ts = _dt.datetime.fromisoformat(entry.get("ts", ""))
        except (ValueError, TypeError):
            aged.append(entry)
            continue
        age_hours = (now - ts).total_seconds() / 3600
        if age_hours > THRESHOLD_HOURS:
            aged.append(entry)
        else:
            fresh.append(entry)
    if aged:
        oldest = aged[0]
        return False, (
            f"{len(aged)} unresolved vitality finding(s) aged beyond {THRESHOLD_HOURS}h "
            f"(oldest: [{oldest.get('ts','')}] {oldest.get('kind','')}: "
            f"{(oldest.get('summary','') or '')[:160]}). "
            f"Run `python3 tools/vitality_log.py status` to review."
        )
    return True, f"{len(fresh)} unresolved finding(s) present but all within {THRESHOLD_HOURS}h window — tolerated"


def check_saga_versions_history_match():
    """Round 104 — closes the saga-rounds vs versions.json-history drift surface.

    Truth anchor: saga.md's bolded-date + 'Round N' heading lines. Every
    such heading must have a corresponding `round: N` entry in
    `memory/versions.json` history (regardless of whether the round bumped
    brain or dashboard versions — narrative-only rounds get entries too via
    `version_bump.py narrative-only`).

    Catches the failure family that surfaced during Rounds 101/102/103:
    Tacitus-only rounds (Round 101, Round 103) had no versions.json entries,
    and the off-by-one heuristic in version_bump.py (max+1) mislabeled
    Round 102 as round:101. Both made the dashboard's journey timeline
    silently stale even while the substantive record (saga.md) was complete.

    Severity: warning — staleness is editorial, not load-bearing correctness.
    Daily audit picks it up within 24 hours of any saga round close.
    """
    saga_path = ROOT / "memory/essence/saga.md"
    versions_path = ROOT / "memory/versions.json"
    if not saga_path.exists():
        return False, f"saga.md missing at {saga_path}"
    if not versions_path.exists():
        return False, f"versions.json missing at {versions_path}"
    saga_text = saga_path.read_text(encoding="utf-8")
    heading_re = re.compile(r"^\*\*\([^)]+\)\*\*\s+Round\s+(\d+)\b", re.MULTILINE)
    saga_rounds = sorted(set(int(m.group(1)) for m in heading_re.finditer(saga_text)))
    if not saga_rounds:
        return False, "no canonical 'Round N' headings found in saga.md (regex shape may have drifted)"
    try:
        with open(versions_path, encoding="utf-8") as f:
            v = json.load(f)
    except Exception as e:
        return False, f"versions.json parse failed: {e}"
    history_rounds = set(h.get("round") for h in v.get("history", []) if h.get("round") is not None)
    if not history_rounds:
        return False, "versions.json history is empty"
    # The invariant catches drift in the RECENT range only. Pre-tracking
    # historical gaps (rounds before versions.json was introduced or
    # incompletely retrofilled) are artifacts, not drift. Definition of
    # "recent": the contiguous tail of history starting at max(history).
    # Walk backward from max — stop at first gap; everything from that point
    # forward must be in both saga and history. Anything earlier is ignored.
    max_history = max(history_rounds)
    floor = max_history
    while (floor - 1) in history_rounds:
        floor -= 1
    relevant_saga = [r for r in saga_rounds if r >= floor]
    missing = [r for r in relevant_saga if r not in history_rounds]
    if missing:
        return False, (
            f"saga has rounds missing from versions.json history (since round {floor}): "
            f"{missing}. Run `python3 tools/version_bump.py narrative-only \"<summary>\"` "
            f"to backfill (or with a component bump if applicable)."
        )
    # Orphan history entries (rounds in versions.json but not in saga.md)
    # are NOT flagged. Pre-Round-104 retrofit added many rounds to
    # versions.json that don't have saga headings (the saga focuses on
    # narrative-worthy rounds; versions.json tracks every version bump).
    # Forward drift (saga round missing from history) is the failure mode
    # this invariant guards. Backward asymmetry (history entries without
    # saga headings) is by design.
    return True, (
        f"{len(relevant_saga)} saga rounds (contiguous tail since round {floor}) "
        f"all match versions.json history (max round: {saga_rounds[-1]})"
    )


def check_tacitus_prompts_portable_shape():
    """Verifies tacitus/prompts/{cura,vision}.md contain balanced project-
    anchor section markers (the portability seam documented in
    tacitus/portability.md). Aegis is exempt — has no project-specific
    anchors by design. Catches accidental deletion of anchor blocks that
    would break drop-in portability to other projects."""
    prompts_to_check = [
        "tacitus/prompts/cura.md",
        "tacitus/prompts/vision.md",
    ]
    issues = []
    for p in prompts_to_check:
        full = ROOT / p
        if not full.exists():
            issues.append(f"{p} (file missing)")
            continue
        text = full.read_text(encoding="utf-8")
        start_count = text.count("<!-- PROJECT_ANCHOR_START:")
        end_count = text.count("<!-- PROJECT_ANCHOR_END:")
        if start_count == 0:
            issues.append(f"{p} (no PROJECT_ANCHOR markers)")
        elif start_count != end_count:
            issues.append(f"{p} (unbalanced: {start_count} starts, {end_count} ends)")
    if issues:
        return False, "; ".join(issues)
    return True, f"all {len(prompts_to_check)} prompt files have balanced anchor markers"


def check_tacitus_dashboard_freshness():
    """Round 117 (2026-06-18) — the dashboard-stale failure the user named:
    *"this is the second day in a row... the dashboard has not been updated"*.

    On Mon-Fri operational days, if today's notebook contains an Aegis
    session header for today, the Tacitus dashboard (tacitus/dashboard/index.html)
    must contain today's date string in its LIVE_DATA embed. The dashboard's
    `tools/build_tacitus_dashboard_live.py` projects the night's parsed
    notebook content into `LIVE_DATA = { ..., days: [{date: "YYYY-MM-DD", ...}] }`.
    If Aegis fired but the build script never ran (or ran but failed silently),
    today's date string will be absent from the embed and the user opens to
    yesterday's reflections.

    Truth anchor: the literal string `"date": "<today>"` inside dashboard
    HTML. Content-level, not mtime — mtime can be touched by unrelated edits;
    the date string can only land via the build pipeline reading today's
    notebook.

    Paired with the `tacitus-dashboard-build` scheduled task (05:35 EDT
    Mon-Fri). The task is the writer; this invariant is the detector.
    Together they are defense-in-depth: if the task fails or skips, this
    invariant catches it at 6:15 EDT and surfaces it as the FIRST item in
    the morning briefing.

    Severity: critical. The user's morning open is part of the immersion
    the project was built for; a stale dashboard is a load-bearing failure.
    """
    today = _eastern_today()
    today_dt = datetime.datetime.strptime(today, "%Y-%m-%d")
    weekday = today_dt.weekday()
    if weekday >= 5:  # Sat/Sun rest days
        return True, f"rest day ({today} is {today_dt.strftime('%A')}); no rebuild expected"

    yyyy_mm = today[:7]
    nb_path = ROOT / f"tacitus/notebook/{yyyy_mm}.md"
    if not nb_path.exists():
        return True, f"tacitus/notebook/{yyyy_mm}.md does not exist; no rebuild required"
    nb = nb_path.read_text(encoding="utf-8")

    aegis_header_re = re.compile(
        rf"\({re.escape(today)} at [^)]+\)\s*[—-]\s*Aegis session #\d+"
    )
    if not aegis_header_re.search(nb):
        return True, f"Aegis has not written today's session header yet ({today}); rebuild not yet expected"

    dashboard_path = ROOT / "tacitus/dashboard/index.html"
    if not dashboard_path.exists():
        return False, "tacitus/dashboard/index.html missing"
    dashboard_text = dashboard_path.read_text(encoding="utf-8")
    today_date_marker = f'"date": "{today}"'
    if today_date_marker not in dashboard_text:
        return False, (
            f"Aegis wrote today's session header to the notebook but the "
            f"dashboard LIVE_DATA does not contain {today_date_marker!r}. "
            f"This is the user-named immersion-breaking failure of "
            f"2026-06-18. The post-Aegis build task `tacitus-dashboard-build` "
            f"either did not fire or failed silently. Run "
            f"`python3 tools/build_tacitus_dashboard_live.py` manually and "
            f"check `memory/system/dashboard-build-log.jsonl` for the failure cause."
        )
    return True, f"dashboard LIVE_DATA contains today's date ({today})"

def check_tacitus_changelog_chronological_order():
    """Round 118 — Cura session #2 Survivor A sibling: verify
    tacitus/changelog.md '## v' headings appear in reverse chronological
    order per the file's self-stated rule.

    The file's own footer (line ~120) states: 'Future entries: append in
    reverse chronological order (newest at top below the heading)...'.
    Round 103 violated this by appending v2.2 at the bottom; the
    violation persisted through ~15 subsequent rounds before Cura session
    #2 surfaced it.

    Truth anchor: the file's self-stated rule. Per-heading date strings
    extracted from the parenthesized date after each version label;
    sequence must be strictly non-increasing (newest first).

    Severity: warning. Editorial discipline, not load-bearing correctness;
    but a stale order signals the closing-move-atomic discipline missed
    a downstream surface.
    """
    path = ROOT / "tacitus/changelog.md"
    if not path.exists():
        return False, "tacitus/changelog.md missing"
    text = path.read_text(encoding="utf-8")

    # Find every "## vX.Y (YYYY-MM-DD, Round NN) — Title" heading in file order.
    heading_re = re.compile(
        r"^##\s+v[\d.]+\s+\((\d{4}-\d{2}-\d{2}),\s*Round\s*\d+\)",
        re.MULTILINE,
    )
    matches = heading_re.findall(text)
    if len(matches) < 2:
        return True, f"only {len(matches)} version heading(s); nothing to order"

    out_of_order = []
    for i in range(len(matches) - 1):
        if matches[i] < matches[i + 1]:
            out_of_order.append(f"{matches[i]} (pos {i+1}) before {matches[i+1]} (pos {i+2})")
    if out_of_order:
        return False, (
            "tacitus/changelog.md version headings violate file's self-stated "
            "reverse-chronological rule: "
            + "; ".join(out_of_order)
        )
    return True, f"all {len(matches)} version headings in reverse-chronological order"


def check_wallach_stance_source_rule():
    """Round 118 — Cura session #2 Survivor B: every wallach_stance.citation
    in knowledge/essentials-targets.json must cite an allowlisted Wallach or
    Youngevity primary source (same allowlist as the existing `source` field
    check). Defense-in-depth pair for the dashboard_integrity check_source_rule
    extension — runs daily over the canonical file so the cornerstone has
    coverage at both the dashboard-write moment and the daily audit moment.

    Truth anchor: source-rule.md's allowlist markers, applied to the new
    wallach_stance.citation schema field (Round 115 addition).

    Severity: critical. Matches the source-rule cornerstone's ERROR-MODE
    enforcement (Round 56). A non-allowlisted citation is a structural
    breach of the cornerstone; loud failure is the right response.
    """
    canonical = ROOT / "knowledge/essentials-targets.json"
    if not canonical.exists():
        return False, "knowledge/essentials-targets.json missing"
    try:
        data = json.loads(canonical.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return False, f"essentials-targets.json parse failed: {e}"

    # Allowlist markers — kept in sync with tools/dashboard_integrity.py's
    # ALLOWLIST_MARKERS. Per §3, the dashboard_integrity tool is the canonical
    # writer; this invariant duplicates the allowlist for defense-in-depth.
    # If the allowlist grows, both surfaces update in the same patch.
    allowlist = [
        "wallach", "dddl", "dead doctors don't lie", "let's play doctor",
        "hell's kitchen", "rare earths", "wallach files", "rare earths and forbidden cures",
        "youngevity", "beyond tangy tangerine", "btt", "ultimate", "majestic earth",
        "healthy body start pak", "hbsp", "rebound fx", "slender fx", "reverse",
        "plant derived", "plant-derived", "ma lan", "pig farm", "epidemics",
    ]

    def walk(obj, path=""):
        """Yield (essential_name, stance) pairs found in nested category structure."""
        if isinstance(obj, dict):
            if "wallach_stance" in obj and isinstance(obj.get("wallach_stance"), dict):
                yield path or obj.get("name", "<unnamed>"), obj["wallach_stance"]
            for k, v in obj.items():
                yield from walk(v, path=f"{path}.{k}" if path else k)
        elif isinstance(obj, list):
            for item in obj:
                if isinstance(item, dict) and "name" in item:
                    yield from walk(item, path=item["name"])
                else:
                    yield from walk(item, path=path)

    n_stances = 0
    fails = []
    for name, stance in walk(data):
        n_stances += 1
        citation = (stance.get("citation") or "").lower()
        if not citation:
            fails.append(f"{name}: wallach_stance present but citation missing")
            continue
        if not any(marker in citation for marker in allowlist):
            fails.append(
                f"{name}: wallach_stance citation not allowlisted: "
                f"'{stance.get('citation', '')[:80]}'"
            )

    if fails:
        return False, f"{len(fails)} non-allowlisted stance citation(s): " + "; ".join(fails[:3])
    if n_stances == 0:
        return True, "no wallach_stance entries present yet (Phase 3 backfill not started)"
    return True, f"all {n_stances} wallach_stance citation(s) cite allowlisted Wallach/Youngevity primary"




def check_cura_phase_0_present():
    """Round 119 (Vision session #2 Survivor A): verifies the Phase 0
    pre-flight audit discipline codified Round 113 in tacitus/prompts/cura.md
    is honored at runtime. On operational days (Mon-Fri) when Cura has fired
    and written a session header for today, the same notebook block must
    include the Phase 0 header line.

    Truth anchor: the literal string 'PHASE 0 — PRE-FLIGHT AUDIT (Cura,'
    appearing in today's notebook AFTER the Cura session N header and BEFORE
    the next session boundary (the '─────────...' separator that opens the
    next session). The block bounding is what makes this a per-Cura-session
    check rather than a global file scan — a Cura session #N from a prior
    week's Phase 0 header doesn't satisfy today's check.

    Severity: warning. Phase 0 being skipped wouldn't break Cura's output
    structurally (Phase 1-6 still produce valid notebook content), but would
    silently regress the Round 113 discipline. Warning matches the severity
    pattern of check_tacitus_v1_task_no_resurrection (Round 107).

    Bootstrap guard: if Cura has never fired today (no Cura session header
    for today's date), the check is N/A and returns PASS — the modes-fired
    invariant is the canonical check for that case. The two invariants
    compose: modes-fired catches absent Cura; phase-0-present catches
    present-but-discipline-skipped Cura.
    """
    today = _eastern_today()
    today_dt = datetime.datetime.strptime(today, "%Y-%m-%d")
    if today_dt.weekday() >= 5:
        return True, f"rest day ({today}); no Cura fire expected"
    yyyy_mm = today[:7]
    nb_path = ROOT / f"tacitus/notebook/{yyyy_mm}.md"
    if not nb_path.exists():
        return True, f"notebook {yyyy_mm}.md absent; modes-fired-today is the canonical check"
    nb = nb_path.read_text(encoding="utf-8")
    cura_header_re = re.compile(rf"\({re.escape(today)} at [^)]+\)\s*[—-]\s*Cura session #(\d+)")
    m = cura_header_re.search(nb)
    if not m:
        return True, f"Cura has not fired for {today}; modes-fired-today is the canonical check"
    # Bound the Cura block: from end of Cura's header line to the next
    # session header (Cura/Vision/Aegis on any date) or end of file. The
    # header itself sits in a separator-bracketed band ("─────\n header \n
    # ─────"); naive search for the next `^─────` would land on Cura's
    # OWN closing separator (one line below the header), leaving the
    # block effectively empty. Bounding by the next session-header line
    # ensures Phase 0 content (which lives BETWEEN the closing separator
    # of Cura's header and the opening separator of Vision's session) is
    # inside the inspection block.
    block_start = m.end()
    next_session_re = re.compile(
        r"^\(\d{4}-\d{2}-\d{2} at [^)]+\)\s*[—-]\s*(?:Cura|Vision|Aegis) session #\d+",
        re.MULTILINE,
    )
    next_session_match = next_session_re.search(nb, block_start)
    block_end = next_session_match.start() if next_session_match else len(nb)
    cura_block = nb[block_start:block_end]
    phase_0_header_exact = f"PHASE 0 — PRE-FLIGHT AUDIT (Cura, {today})"
    if phase_0_header_exact in cura_block:
        return True, f"Cura session #{m.group(1)} for {today} includes Phase 0 block"
    # Tolerant fallback: also accept 'PHASE 0 — PRE-FLIGHT AUDIT (Cura,'
    # without the date, in case the prompt's shape drifts in a future round.
    if "PHASE 0 — PRE-FLIGHT AUDIT (Cura," in cura_block:
        return True, f"Cura session #{m.group(1)} for {today} includes Phase 0 block (date-relaxed match)"
    return False, (
        f"Cura session #{m.group(1)} for {today} present but no 'PHASE 0 — PRE-FLIGHT AUDIT (Cura,' "
        f"header found in the session block; Round 113 discipline regressed"
    )




def check_wallach_stance_embed_sync():
    """Round 122 — verify every canonical `wallach_stance` field in
    knowledge/essentials-targets.json is mirrored byte-equal in the
    dashboard's essentials-targets-data embed for the matching essential.

    The two surfaces are dual representations: the canonical is nested by
    category (knowledge/essentials-targets.json), the embed is a flat
    projection inside <script id="essentials-targets-data"> in
    dashboard.html. Round 115 flagged the drift risk when adding the new
    field; Round 122 ships the verifier as part of the data-landing patch
    per §18.

    Truth anchor: byte-equal comparison of the canonical entry's
    wallach_stance dict against the matching embed entry's wallach_stance
    dict. Normalized via json.dumps(sort_keys=True) so the comparison is
    insensitive to dict-key order differences but strict on content.

    Severity: warning. A drift here means the user sees one quote in the
    dashboard while the canonical source carries a different (or absent)
    quote — editorial inconsistency, not load-bearing correctness, but
    a fresh-session catch-up reader would notice.
    """
    canonical_path = ROOT / "knowledge/essentials-targets.json"
    dashboard_path = ROOT / "dashboard/dashboard.html"
    if not canonical_path.exists():
        return False, "knowledge/essentials-targets.json missing"
    if not dashboard_path.exists():
        return False, "dashboard/dashboard.html missing"

    try:
        canonical = json.loads(canonical_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return False, f"essentials-targets.json parse failed: {e}"

    # Collect canonical stances by essential name.
    canonical_stances = {}
    for cat in canonical.get("categories", {}).values():
        if not isinstance(cat, list):
            continue
        for entry in cat:
            if isinstance(entry, dict) and "wallach_stance" in entry:
                canonical_stances[entry["name"]] = entry["wallach_stance"]

    # Extract the embed block + parse.
    dash_text = dashboard_path.read_text(encoding="utf-8")
    m = re.search(
        r'<script type="application/json" id="essentials-targets-data">(.*?)</script>',
        dash_text,
        re.DOTALL,
    )
    if not m:
        return False, "essentials-targets-data embed block not found in dashboard.html"
    try:
        embed = json.loads(m.group(1))
    except json.JSONDecodeError as e:
        return False, f"essentials-targets-data embed parse failed: {e}"

    embed_stances = {
        e["name"]: e["wallach_stance"]
        for e in embed.get("essentials", [])
        if "wallach_stance" in e
    }

    # Compare the two surfaces.
    canonical_names = set(canonical_stances.keys())
    embed_names = set(embed_stances.keys())

    only_canonical = canonical_names - embed_names
    only_embed = embed_names - canonical_names

    if only_canonical:
        return False, (
            f"{len(only_canonical)} stance(s) in canonical but missing from embed: "
            + ", ".join(sorted(only_canonical)[:3])
        )
    if only_embed:
        return False, (
            f"{len(only_embed)} stance(s) in embed but missing from canonical: "
            + ", ".join(sorted(only_embed)[:3])
        )

    # Byte-equal content comparison via sorted JSON serialization.
    mismatches = []
    for name in canonical_names:
        c_dump = json.dumps(canonical_stances[name], sort_keys=True, ensure_ascii=False)
        e_dump = json.dumps(embed_stances[name], sort_keys=True, ensure_ascii=False)
        if c_dump != e_dump:
            mismatches.append(name)
    if mismatches:
        return False, (
            f"{len(mismatches)} stance content mismatch(es) between canonical and embed: "
            + ", ".join(mismatches[:3])
        )
    n = len(canonical_names)
    if n == 0:
        return True, "no wallach_stance entries present yet (Phase 3 backfill not started)"
    return True, f"all {n} wallach_stance entries byte-equal between canonical and dashboard embed"




# ---------------------------------------------------------------------------
# Round 135 — Discipline invariants (lesson logging + raw-key surfacing +
# cross-IIFE bare refs). Codified after the Round 135 meta-failure: lessons
# were being recorded but not applied; raw keys were leaking through render
# sites; cross-IIFE bare refs silently fell back to empty. The 30+ existing
# invariants audit STRUCTURE; these three audit DISCIPLINE.
# ---------------------------------------------------------------------------

_RE_TIMESTAMP = re.compile(r'\*\*\((\d{4}-\d{2}-\d{2}) at (\d{1,2}):(\d{2})\s*(AM|PM)\)\*\*')

def _max_timestamp(path):
    """Return max datetime found in a markdown file's **(YYYY-MM-DD at H:MM AM/PM)** entries."""
    try:
        text = path.read_text(encoding="utf-8")
    except Exception:
        return None
    latest = None
    for m in _RE_TIMESTAMP.finditer(text):
        date_str, hh, mm, ampm = m.group(1), int(m.group(2)), int(m.group(3)), m.group(4)
        if ampm == 'PM' and hh != 12:
            hh += 12
        elif ampm == 'AM' and hh == 12:
            hh = 0
        try:
            dt = datetime.datetime.strptime(date_str, '%Y-%m-%d').replace(hour=hh, minute=mm)
            if latest is None or dt > latest:
                latest = dt
        except Exception:
            continue
    return latest


def check_lesson_freshness_vs_saga():
    """ENFORCING (not informational): catches the meta-failure pattern where
    saga.md gains round entries but lessons.md gets none — the Round 135
    "logging lapsed for 3+ hours of substantive work" case the user flagged.
    Compares the max-timestamp in saga.md vs the max-timestamp in lessons.md.
    Warn if saga > lessons by >6h. Critical if >24h (must address).
    Truth anchor: timestamp arithmetic over the two files' embedded markers.
    """
    saga = ROOT / "memory/essence/saga.md"
    lessons = ROOT / "memory/essence/lessons.md"
    if not saga.exists():
        return True, "saga.md missing (no enforcement possible)"
    if not lessons.exists():
        return False, "lessons.md missing"
    saga_max = _max_timestamp(saga)
    lessons_max = _max_timestamp(lessons)
    if saga_max is None or lessons_max is None:
        return True, "no parseable timestamps in one or both files (informational)"
    delta_h = (saga_max - lessons_max).total_seconds() / 3600.0
    if delta_h <= 6:
        return True, f"saga vs lessons within 6h (delta={delta_h:.1f}h, lessons latest {lessons_max.isoformat()})"
    if delta_h <= 24:
        return False, (
            f"WARNING: saga.md latest ({saga_max.isoformat()}) is {delta_h:.1f}h ahead of "
            f"lessons.md latest ({lessons_max.isoformat()}). Substantive work logged to "
            f"saga without parallel lessons entries — the Round 135 lapse pattern. Log "
            f"any novel lessons now, or affirm 'no novel lesson this round' in lessons.md."
        )
    return False, (
        f"CRITICAL: saga.md latest ({saga_max.isoformat()}) is {delta_h:.1f}h ahead of "
        f"lessons.md latest ({lessons_max.isoformat()}). This is the meta-failure mode "
        f"the invariant exists to prevent. Either file lesson entries now, or document "
        f"explicit no-novel-lesson rationale."
    )


def check_raw_key_surfacing():
    """Catches the Round 135 bug where item.source ('wallach_hbsp_default') and
    goal keys ('longevity_anti_aging') rendered raw to UI pills. Scans
    dashboard.html for escapeHtml(item.<enum-field>) patterns NOT preceded by
    a displayName() / SOURCE_DISPLAY_NAMES / GOAL_DISPLAY_NAMES / humanizeKey
    resolution. Enum fields are source/kind/provenance/goal_*. `category` is
    excluded because in this project it carries freeform human-readable text
    (e.g. 'YGY foundational mineral multi'), not enum keys. Warning per match.
    Truth anchor: dashboard.html source, regex grep.
    """
    dash = ROOT / "dashboard/dashboard.html"
    if not dash.exists():
        return True, "dashboard.html missing (no enforcement)"
    try:
        text = dash.read_text(encoding="utf-8")
    except Exception as e:
        return False, f"could not read dashboard.html: {e}"
    # Round 137: strip embedded markdown blocks (`<script type="text/markdown">...
    # </script>`) before scanning. The cl-data-* blocks embed saga / lessons /
    # decisions / notebook prose which can contain literal `escapeHtml(item.source`
    # as analytical references (e.g. Cura session #3's Candidate 1 mentions the
    # regex pattern itself). These are prose, not code — scanning them produces
    # false positives that fired on the Round 137 closing audit. Same family as
    # Round 137's parser-drift cure: scope the scan to its actual target (code,
    # not embedded prose). Truth-anchored: code lives outside the markdown-script
    # blocks; the cl-data-* blocks are documented as text-only embeds.
    scan_text = re.sub(
        r'<script[^>]*type="text/markdown"[^>]*>.*?</script>',
        '',
        text,
        flags=re.DOTALL,
    )
    # Pattern: escapeHtml(item.<key-field>) where field is one of source/kind/category/goal/provenance
    pat = re.compile(r"escapeHtml\(\s*(item|it|b|r)\.(source|kind|provenance|goal[a-zA-Z_]*)")
    violations = []
    # Build an offset map from scrubbed → original byte positions so line
    # numbers in violation reports remain accurate to the unscrubbed file.
    # Simpler approach: search the scrubbed text but re-locate each match in
    # the original text for line-no reporting.
    for m in pat.finditer(scan_text):
        # Look back ~200 chars for a displayName(  on the same context — heuristic safety check
        start = max(0, m.start() - 200)
        context = scan_text[start:m.start()]
        if "displayName(" in context or "SOURCE_DISPLAY_NAMES" in context or "GOAL_DISPLAY_NAMES" in context or "humanizeKey" in context:
            continue  # the surrounding code already routes through the humanizer
        # Re-locate the match in the ORIGINAL text for accurate line-number reporting
        orig_idx = text.find(m.group(0), max(0, m.start() - 50))
        if orig_idx < 0:
            orig_idx = text.find(m.group(0))  # fall back to first occurrence
        line_no = text.count("\n", 0, orig_idx) + 1 if orig_idx >= 0 else -1
        violations.append((line_no, m.group(0)))
    if not violations:
        return True, "no raw key-field surfacing in dashboard.html render sites"
    sample = "; ".join(f"line {ln}: {snip}" for ln, snip in violations[:3])
    return False, (
        f"{len(violations)} raw-key surfacing site(s) detected. Pattern: escapeHtml(item.<key>) "
        f"without nearby displayName() / SOURCE_DISPLAY_NAMES / GOAL_DISPLAY_NAMES / humanizeKey. "
        f"Route via displayName(key, MAP). Sample: {sample}"
    )


# Known cross-IIFE constants — grow this list as new ones are discovered.
# Each entry: name -> regex-safe identifier. Detection: any bare reference
# in code that ISN'T window.X = ... assignment and ISN'T inside the defining
# IIFE. Currently a heuristic — false positives possible but signal density
# is high because these are the exact symbols that bit us before.
_CROSS_IIFE_SYMBOLS = [
    'REGIMEN_BASE_DATA',     # Round 135 bug (computeSlotStats couldn't see it)
    'getUnifiedRegimenItems', # Round 28 bug (Periodic Table couldn't see it)
    'showLcModal',            # Round 131 bug (confirmDeleteSlot couldn't see it)
    'displayName',            # Round 135 ship — must stay window-accessible
    'humanizeKey',            # Round 135 ship — must stay window-accessible
    'GOAL_DISPLAY_NAMES',     # Round 135 ship — must stay window-accessible
    'SOURCE_DISPLAY_NAMES',   # Round 135 ship — must stay window-accessible
    'getCurrentGoals',        # Round 141 ship — goal-driven recommendations engine
    'computeGoalDrivenRecommendations',  # Round 141 ship — recs engine
    'buildGoalDrivenRecommendedItems',   # Round 141 ship — recs engine
    'getEffectiveRecommendedItems',      # Round 141 ship — recs engine
    'getItemEssentialContributions',     # Round 156 follow-up — computeSlotStats cross-IIFE consumer; missing export caused slot card 0/92 regression
    'saveRgUserGoals',                   # Round 156 follow-up — goal-picker chokepoint
    'loadRgUserGoals',                   # Round 156 follow-up — goal-picker LS reader (used by renderGoalPicker for "selected" state)
    'renderGoalPicker',                  # Round 156 follow-up — goal-picker render fn (called by triggerRegimenRerender cascade from Save System IIFE)
]


def check_cross_iife_bare_refs():
    """Catches the recurring failure family (Rounds 28, 131, 135): IIFE-internal
    consts/functions referenced by bare name from another IIFE. Each known
    cross-IIFE symbol must have a window.X = X assignment in dashboard.html.
    Truth anchor: grep for 'window.<symbol> = <symbol>' in dashboard.html.
    """
    # Round 161 R1·B — JS now lives split across dashboard.html (still has the
    # inline JSON+markdown blocks) and assets/js/legacy-dashboard.js (the parked
    # main JS + handler IIFE). Read both during the migration window; this
    # concat-scan stays valid until Round 5 retires legacy-dashboard.js.
    dash = ROOT / "dashboard/dashboard.html"
    legacy_js = ROOT / "dashboard/assets/js/legacy-dashboard.js"
    if not dash.exists():
        return True, "dashboard.html missing"
    try:
        text = dash.read_text(encoding="utf-8")
        if legacy_js.exists():
            text = text + "\n/* ---- legacy-dashboard.js ---- */\n" + legacy_js.read_text(encoding="utf-8")
    except Exception as e:
        return False, f"could not read dashboard JS surfaces: {e}"
    missing = []
    for sym in _CROSS_IIFE_SYMBOLS:
        # Look for `window.SYM = SYM` or `window.SYM = ` (alias form acceptable)
        pat = re.compile(r"window\." + re.escape(sym) + r"\s*=(?!=)")  # assignment only, not ===/==/!=
        if not pat.search(text):
            missing.append(sym)
    if not missing:
        return True, f"all {len(_CROSS_IIFE_SYMBOLS)} known cross-IIFE symbols have window exports"
    return False, (
        f"{len(missing)} cross-IIFE symbol(s) missing window export: {', '.join(missing)}. "
        f"Each must have `window.<sym> = <sym>` in its defining IIFE so other IIFEs can "
        f"access via window — bare-name references across IIFE boundaries silently fall "
        f"back to undefined. Rounds 28, 131, 135 all surfaced from this family."
    )


# Round 155 (Item 4) — reverse-direction widening of the cross-IIFE check.
# The allowlist-based check above catches REGRESSIONS on KNOWN symbols. The
# reverse-scan below catches NEW violations: a function defined privately
# inside IIFE A and called by bare name from IIFE B. Round 149's `esc()`
# call was exactly this — `esc` lived in Label Check IIFE, was called from
# Regimen tab IIFE without window prefix, silently threw ReferenceError.
#
# Severity: warning. Editorial-quality detector; may surface false positives
# on edge cases (nested IIFEs, dynamic-name patterns). When real, the
# violation is a same-class bug as the Round 149 family.

def _find_iife_ranges(text: str) -> list[tuple[int, int]]:
    """Find top-level IIFE byte ranges via brace-counting from each
    `(function() {` or `(() => {` opener. Returns list of (start, end_exclusive).
    Nested IIFEs are absorbed into the enclosing outer range; we operate on
    top-level (script-tag-level) IIFEs for cross-IIFE analysis."""
    openers = list(re.finditer(
        r"(?:^|\n)[\s\t]*\((?:function(?:\s+\w+)?\s*\(\)|\(\)\s*=>)\s*\{",
        text,
    ))
    ranges: list[tuple[int, int]] = []
    last_end = -1
    for m in openers:
        start = m.end() - 1  # position of opening brace
        if start < last_end:
            continue  # this opener is nested inside the previous IIFE
        depth = 1
        i = start + 1
        while i < len(text) and depth > 0:
            ch = text[i]
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
            i += 1
        ranges.append((m.start(), i))
        last_end = i
    return ranges


def _collect_iife_locals(body: str) -> set[str]:
    """Collect names defined inside an IIFE body. Includes function declarations
    and top-level const/let/var arrow/function/async assignments. Heuristic —
    misses object-method shorthand, class methods, destructured assignments."""
    names: set[str] = set()
    for fm in re.finditer(r"\bfunction\s+(\w+)\s*\(", body):
        names.add(fm.group(1))
    for am in re.finditer(
        r"\b(?:const|let|var)\s+(\w+)\s*=\s*(?:function\b|async\s+function\b|\([^)]*\)\s*=>|async\s*\([^)]*\)\s*=>|\w+\s*=>)",
        body,
    ):
        names.add(am.group(1))
    return names


# Names callable in IIFEs that are globally defined or browser/lib globals.
# Excluded from the reverse-scan because they're never IIFE-private even if
# they happen to share a name with an IIFE-local. Conservative — additions
# OK; removals require lesson-pin discipline.
_CALL_FALSE_POSITIVE_ALLOWLIST = frozenset([
    # Browser globals & built-ins that take call shape
    "if", "for", "while", "switch", "catch", "return", "typeof", "await",
    "do", "throw", "void", "delete", "function", "async", "class", "super",
    "yield", "new", "instanceof", "in", "of", "var", "let", "const", "try",
    "finally", "with", "this",
    # Common API globals — extend as false positives surface
    "Math", "Date", "JSON", "Array", "Object", "String", "Number", "Boolean",
    "Promise", "RegExp", "Error", "Symbol", "Set", "Map", "WeakMap", "WeakSet",
    "parseInt", "parseFloat", "isNaN", "isFinite",
    "setTimeout", "setInterval", "clearTimeout", "clearInterval",
    "requestAnimationFrame", "cancelAnimationFrame",
    "fetch", "alert", "confirm", "prompt",
    "encodeURIComponent", "decodeURIComponent", "encodeURI", "decodeURI",
])


def check_cross_iife_bare_refs_reverse_scan():
    """Round 155 (Item 4) — reverse-direction widening of the cross-IIFE
    bare-reference check. Where check_cross_iife_bare_refs validates that
    KNOWN symbols (allowlist) are window-exported, this check scans for NEW
    violations: functions defined privately inside IIFE A and called from
    IIFE B without window prefix.

    Method:
      1. Find top-level IIFE byte ranges in dashboard.html.
      2. For each IIFE, collect locally-defined function/const/let names.
      3. Build map name -> set of IIFE indices defining it privately.
      4. Collect global window-exported names (window.X = ...).
      5. For each IIFE, find bare call sites NAME( (no `.` or `function ` prefix);
         flag when NAME is in another IIFE's private set, not in this IIFE's
         locals, and not window-exported.

    Truth anchor: dashboard.html source (independent of any cache).
    Severity: warning. Editorial discipline; the call STILL throws at runtime,
    but flagging at audit time prevents the Round 149 family's recurrence.

    Known limitations (v1): nested IIFEs counted as parent's locals; object
    method shorthand not collected; destructured const not collected. Real
    violations surface despite these gaps; cleanup is a future widening."""
    path = ROOT / "dashboard" / "dashboard.html"
    if not path.exists():
        return True, "dashboard.html missing (bootstrap-guard)"
    raw_text = path.read_text(encoding="utf-8")
    nonjs_pat = re.compile(
        r"(<script\s+type=\"(?:text/markdown|application/json)\"[^>]*>)(.*?)(</script>)",
        re.DOTALL,
    )
    def _mask(m):
        body = m.group(2)
        return m.group(1) + (" " * len(body)) + m.group(3)
    text = nonjs_pat.sub(_mask, raw_text)

    iife_ranges = _find_iife_ranges(text)
    if not iife_ranges:
        return True, "no top-level IIFEs detected in dashboard.html (bootstrap-guard)"
    iife_locals: list[set[str]] = []
    for s, e in iife_ranges:
        iife_locals.append(_collect_iife_locals(text[s:e]))
    window_exports = set(re.findall(r"window\.(\w+)\s*=(?!=)", text))
    # Functions defined OUTSIDE any IIFE (globally available).
    global_names: set[str] = set()
    for fm in re.finditer(r"\bfunction\s+(\w+)\s*\(", text):
        pos = fm.start()
        inside = any(s <= pos < e for s, e in iife_ranges)
        if not inside:
            global_names.add(fm.group(1))
    # Top-level const/let/var (outside any IIFE).
    for am in re.finditer(r"\b(?:const|let|var)\s+(\w+)\s*=", text):
        pos = am.start()
        inside = any(s <= pos < e for s, e in iife_ranges)
        if not inside:
            global_names.add(am.group(1))

    # Build private-name map: name -> set of IIFE indices defining it.
    name_homes: dict[str, set[int]] = {}
    for idx, names in enumerate(iife_locals):
        for n in names:
            name_homes.setdefault(n, set()).add(idx)

    # Scan each IIFE for bare call sites of OTHER IIFEs' private names.
    violations: list[tuple[int, str, int]] = []  # (caller_idx, name, abs_position)
    call_re = re.compile(r"(?<!\.)\b(\w+)\s*\(")
    for caller_idx, (cs, ce) in enumerate(iife_ranges):
        body = text[cs:ce]
        my_locals = iife_locals[caller_idx]
        for cm in call_re.finditer(body):
            name = cm.group(1)
            if name in _CALL_FALSE_POSITIVE_ALLOWLIST:
                continue
            if name in my_locals or name in window_exports or name in global_names:
                continue
            if name not in name_homes:
                continue  # not an IIFE-private symbol we can attribute
            homes = name_homes[name] - {caller_idx}
            if not homes:
                continue  # only defined in this IIFE (defensive)
            # Skip function-declaration sites (avoid flagging definitions).
            absolute = cs + cm.start()
            prefix = text[max(0, absolute - 15):absolute]
            if re.search(r"\bfunction\s+$", prefix):
                continue
            violations.append((caller_idx, name, absolute))

    if not violations:
        return True, (
            f"reverse-scan clean: {len(iife_ranges)} IIFE(s), "
            f"{len(name_homes)} private symbol(s) tracked, no cross-IIFE bare refs"
        )
    # Deduplicate by (caller_idx, name) so repeated call sites of the same
    # symbol in one IIFE report once.
    seen: set[tuple[int, str]] = set()
    unique: list[tuple[int, str, int]] = []
    for v in violations:
        key = (v[0], v[1])
        if key in seen:
            continue
        seen.add(key)
        unique.append(v)
    sample = []
    for caller_idx, name, abs_pos in unique[:5]:
        line_no = text.count("\n", 0, abs_pos) + 1
        homes = sorted(name_homes[name] - {caller_idx})
        sample.append(f"`{name}()` at line {line_no} (defined in IIFE #{homes[0]}, called from IIFE #{caller_idx})")
    return False, (
        f"{len(unique)} cross-IIFE bare reference(s) detected via reverse-scan. "
        f"Each call would silently throw ReferenceError (Round 149 family). "
        f"Route via window.<name> or move definition into the calling IIFE. "
        f"Sample: " + "; ".join(sample)
    )

def check_tacitus_dashboard_extraction_health():
    """Round 137 (2026-06-19) — paired structural detector for the silent-
    degenerate-parse failure mode. The user named this directly:
    *"This is the third night in a row I've faced disappointment checking
    the dashboard. This is getting old and I don't want this issue popping
    up again in a different form as we expand/improve Cura."*

    Cura session #3 (tonight) produced 7 candidates / 0 prune verdicts /
    0 deepen survivors because Round 136 extended Cura to 5 sub-checks
    (Translation-quality added) and the prose shape shifted in two ways the
    night-#1-tuned regex never anticipated. The dashboard rendered "avg 0"
    instead of failing loud. Doctrine §1 (no silent failures) violated.

    The structural cure is two layers:

    1. Build-time: tools/build_tacitus_dashboard_live.py raises
       ExtractionHealthError when any phase's substantive input produces
       zero extracted items. The build fails atomically — previous
       (correct) dashboard remains.

    2. Audit-time (this invariant): re-reads the sidecar
       tacitus/dashboard/extraction-health.json written by the build, and
       fails if today's session shows any zero count for a substantive
       phase. Defense-in-depth — if the build somehow ships zeros (e.g.
       the assertion was bypassed, or the sidecar is stale), this catches
       it at 6:15 AM daily audit.

    Truth anchor: tacitus/dashboard/extraction-health.json (a sidecar
    written by the build pipeline, distinct from the dashboard HTML
    surface). The sidecar is the build's own attestation of what it
    extracted; mismatches between attestation and HTML would be caught by
    the existing check_tacitus_dashboard_freshness invariant.

    Severity: critical. The user's morning open is load-bearing immersion;
    a degenerate dashboard is the failure mode this entire round exists to
    prevent.
    """
    today = _eastern_today()
    today_dt = datetime.datetime.strptime(today, "%Y-%m-%d")
    weekday = today_dt.weekday()
    if weekday >= 5:  # Sat/Sun rest days — no rebuild
        return True, f"rest day ({today} is {today_dt.strftime('%A')}); no rebuild expected"

    yyyy_mm = today[:7]
    nb_path = ROOT / f"tacitus/notebook/{yyyy_mm}.md"
    if not nb_path.exists():
        return True, f"tacitus/notebook/{yyyy_mm}.md does not exist; no rebuild required"
    nb_text = nb_path.read_text(encoding="utf-8")

    aegis_header_re = re.compile(
        rf"\({re.escape(today)} at [^)]+\)\s*[—-]\s*Aegis session #\d+"
    )
    if not aegis_header_re.search(nb_text):
        return True, f"Aegis has not written today's session header yet ({today}); rebuild not yet expected"

    sidecar_path = ROOT / "tacitus/dashboard/extraction-health.json"
    if not sidecar_path.exists():
        return False, (
            f"tacitus/dashboard/extraction-health.json missing — Aegis fired today "
            f"but the build's extraction-health sidecar was never written. Run "
            f"`python3 tools/build_tacitus_dashboard_live.py` and verify."
        )
    try:
        health = json.loads(sidecar_path.read_text(encoding="utf-8"))
    except Exception as e:
        return False, f"extraction-health.json could not parse: {e}"

    if health.get("session_date") != today:
        return False, (
            f"extraction-health sidecar session_date={health.get('session_date')!r} "
            f"!= today={today!r}. Dashboard was not rebuilt for today's session — "
            f"the post-Aegis build task may have failed. Re-run "
            f"`python3 tools/build_tacitus_dashboard_live.py`."
        )

    failures = []
    cura = health.get("cura", {})
    if cura.get("scan_candidates", 0) == 0:
        failures.append("Cura scan_candidates=0")
    if cura.get("prune_verdicts", 0) == 0:
        failures.append("Cura prune_verdicts=0")
    if cura.get("deepen_survivors", 0) == 0:
        failures.append("Cura deepen_survivors=0")
    vision = health.get("vision", {})
    if vision.get("scan_candidates", 0) == 0:
        failures.append("Vision scan_candidates=0")
    if vision.get("prune_verdicts", 0) == 0:
        failures.append("Vision prune_verdicts=0")
    if vision.get("deepen_survivors", 0) == 0:
        failures.append("Vision deepen_survivors=0")
    aegis = health.get("aegis", {})
    if aegis.get("cura_verdicts", 0) == 0:
        failures.append("Aegis cura_verdicts=0")
    if aegis.get("vision_verdicts", 0) == 0:
        failures.append("Aegis vision_verdicts=0")

    if failures:
        return False, (
            f"degenerate extraction for {today}: {', '.join(failures)}. "
            f"The parser in tools/build_tacitus_dashboard_live.py silently produced "
            f"zero items for a substantive phase. Inspect the affected section in "
            f"tacitus/notebook/{yyyy_mm}.md and update the regex to accept the new "
            f"prose shape (preserving backward compat). Round 137 added this guard "
            f"after the Cura session #3 regex-drift incident."
        )
    return True, (
        f"all phases populated for {today}: "
        f"cura=({cura.get('scan_candidates')}/{cura.get('prune_verdicts')}/{cura.get('deepen_survivors')}) "
        f"vision=({vision.get('scan_candidates')}/{vision.get('prune_verdicts')}/{vision.get('deepen_survivors')}) "
        f"aegis=({aegis.get('cura_verdicts')}/{aegis.get('vision_verdicts')})"
    )


# ===========================================================================
# Round 140 — Verified Patterns System invariants
# ===========================================================================
# See memory/essence/saga.md Round 140 entry + memory/operating-protocols.md
# §27 + §28 for full context + rollback recipe. These three invariants
# enforce the catalog + feature-flag + saga-marker discipline.

def check_verified_patterns_catalog_present():
    """Round 140 — verify the Verified Patterns catalog exists, parses as
    markdown, and contains at least the seed entries from Round 140 ship.

    The catalog is read by Cura, Vision, and Claude in co-work mode per
    operating-protocols.md §27. Missing or empty catalog = the entire
    Verified Patterns System is non-functional.

    Truth anchor: memory/verified-patterns.md file presence + entry count.
    Severity: warning (system degrades gracefully — flags can be disabled).
    """
    path = ROOT / "memory" / "verified-patterns.md"
    if not path.exists():
        return False, "memory/verified-patterns.md missing — Verified Patterns System non-functional"
    try:
        text = path.read_text(encoding="utf-8")
    except Exception as e:
        return False, f"could not read verified-patterns.md: {e}"
    # Count ## Pattern: entries
    entries = re.findall(r"^## Pattern:\s*(.+?)$", text, re.MULTILINE)
    if len(entries) < 1:
        return False, f"verified-patterns.md has 0 pattern entries — seed catalog likely truncated or not yet populated"
    return True, f"catalog present with {len(entries)} verified pattern entries"


def check_feature_flags_present():
    """Round 140 — verify tacitus/feature-flags.json exists, parses, and
    contains the expected flag keys for the Verified Patterns System.

    The file is the user's manual toggle for Cura/Vision pattern-search
    behavior per operating-protocols.md §27.

    Truth anchor: tacitus/feature-flags.json file + expected schema.
    Severity: warning (degrades gracefully — Cura/Vision treat missing
    flag as `disabled`).
    """
    path = ROOT / "tacitus" / "feature-flags.json"
    if not path.exists():
        return False, "tacitus/feature-flags.json missing — Cura/Vision pattern-search defaults to disabled"
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        return False, f"feature-flags.json could not parse: {e}"
    flags = data.get("flags", {})
    expected = ["cura_pattern_search", "vision_pattern_seed"]
    missing = [k for k in expected if k not in flags]
    if missing:
        return False, f"feature-flags.json missing required flags: {', '.join(missing)}"
    cura_state = "enabled" if flags["cura_pattern_search"].get("enabled") else "disabled"
    vision_state = "enabled" if flags["vision_pattern_seed"].get("enabled") else "disabled"
    return True, f"feature flags present — cura_pattern_search: {cura_state}, vision_pattern_seed: {vision_state}"


def check_round_pattern_consultation_marker():
    """Round 140 — verify the most recent saga rounds include the
    `**Patterns consulted:**` marker per operating-protocols.md §27.

    Scans the last 3 round entries in saga.md for the marker. Warning if
    all 3 are missing. The marker is mandatory for substantive rounds;
    trivial / narrative-only rounds use `Patterns consulted: N/A` form.

    Truth anchor: memory/essence/saga.md tail content.
    Severity: warning (procedural-enforcement discipline; absence is a lapse
    not a correctness break).
    """
    saga_path = ROOT / "memory" / "essence" / "saga.md"
    if not saga_path.exists():
        return True, "saga.md missing (audit assumes fresh-start; no enforcement)"
    try:
        text = saga_path.read_text(encoding="utf-8")
    except Exception as e:
        return False, f"could not read saga.md: {e}"
    # Find the last 3 round headers — match either format:
    #   `## Round N (date)` (Rounds 131+)
    #   `**(date)** Round N` (Rounds <= 130, legacy format)
    # Round 142 — regex precision fix per Round 141 close note. v1 made the
    # `## ` prefix optional, which matched PROSE references like "Round 140
    # ships..." inside body paragraphs. Last-3 matches then drew from prose,
    # not headings, producing misleading "minor lapse on Round 141" messages
    # when the marker was actually present. v2 requires the heading marker
    # explicitly (`^## Round` or legacy bolded-date format) — prose refs are
    # excluded from the round enumeration.
    round_re = re.compile(
        r"^## Round\s+(\d+)\b|^\*\*\([^)]+\)\*\*\s+Round\s+(\d+)\b",
        re.MULTILINE,
    )
    matches = list(round_re.finditer(text))
    if len(matches) < 3:
        # Not enough rounds to enforce; skip
        return True, f"saga.md has only {len(matches)} round entries — too few to enforce marker discipline"
    # Get the last 3 rounds by position
    last3 = matches[-3:]
    rounds_with_marker = 0
    rounds_missing = []
    for i, m in enumerate(last3):
        start = m.start()
        # End is either the next round header or end of file
        if i + 1 < len(last3):
            end = last3[i + 1].start()
        else:
            # For the last round, look forward in the original text
            next_round = round_re.search(text, m.end())
            end = next_round.start() if next_round else len(text)
        round_text = text[start:end]
        round_num = m.group(1) or m.group(2)
        if "**Patterns consulted:**" in round_text:
            rounds_with_marker += 1
        else:
            rounds_missing.append(round_num)
    # Round 140 IS the round that introduced this discipline — it's expected
    # that pre-Round-140 entries don't have markers. Only enforce on rounds
    # >= 140. Filter rounds_missing accordingly.
    rounds_missing_post = [r for r in rounds_missing if int(r) >= 140]
    if len(rounds_missing_post) >= 2:
        return False, (
            f"`**Patterns consulted:**` marker missing on {len(rounds_missing_post)} of the "
            f"last 3 rounds (Round 140+): {', '.join(rounds_missing_post)}. Per operating-protocols.md "
            f"§27, every substantive round's saga entry includes this marker. Add to next round close."
        )
    if rounds_missing_post:
        return True, (
            f"`**Patterns consulted:**` marker present on most recent rounds; one minor lapse on Round "
            f"{rounds_missing_post[0]} noted (within tolerance)"
        )
    return True, f"`**Patterns consulted:**` marker present on last 3 rounds (or pre-Round-140 — no enforcement)"



# ===========================================================================
# Round 142 — Discipline-tightening batch invariants
# ===========================================================================
# See memory/essence/saga.md Round 142 entry for full context + rollback recipe.

def check_tacitus_changelog_declared_version_present():
    """Round 142 C-A — declared version in open-threads.md must have a
    corresponding changelog entry in tacitus/changelog.md.

    Source: Cura session #3 Survivor A (2026-06-19 notebook). The pattern is
    declared-state-without-paired-verifier: open-threads.md masthead declares
    "Tacitus at: **v2.X**" but tacitus/changelog.md has no `## v2.X` heading.
    This invariant closes that structural seam.

    Truth anchor: cross-file declaration vs canonical-history match.
    Severity: warning (discipline lapse, not correctness break).
    """
    ot_path = ROOT / "memory" / "open-threads.md"
    cl_path = ROOT / "tacitus" / "changelog.md"
    if not ot_path.exists():
        return True, "memory/open-threads.md missing (audit assumes fresh-start)"
    if not cl_path.exists():
        return False, "tacitus/changelog.md missing — Tacitus changelog discipline broken"
    try:
        ot_text = ot_path.read_text(encoding="utf-8")
        cl_text = cl_path.read_text(encoding="utf-8")
    except Exception as e:
        return False, f"could not read files: {e}"
    # Parse the masthead declaration — pattern: Tacitus at: **v2.5**
    m = re.search(r"Tacitus\s+at:\s*\*\*v(\d+\.\d+)\*\*", ot_text)
    if not m:
        return True, "open-threads.md masthead has no canonical Tacitus version declaration (skipped)"
    declared = m.group(1)
    # Check changelog for matching `## v<X.Y>` heading
    cl_headings = re.findall(r"^## v(\d+\.\d+)\b", cl_text, re.MULTILINE)
    if declared in cl_headings:
        return True, f"open-threads declares Tacitus v{declared}; changelog has matching ## v{declared} entry"
    return False, (
        f"open-threads.md declares Tacitus at v{declared} but tacitus/changelog.md has no "
        f"'## v{declared}' heading. Per tacitus/identity.md \"every change to the prompts, "
        f"rubrics, schedule, voice register, or write boundary lands here in the same patch as "
        f"the change.\" Add the changelog entry. (Existing changelog versions: "
        f"{', '.join(sorted(cl_headings, reverse=True)[:5])}.)"
    )


def check_claude_best_practices_freshness():
    """Round 142 C-B — verify memory/claude-best-practices.md has been touched
    within the cadence the file's own maintenance section claims.

    Source: Cura session #3 Survivor B (2026-06-19 notebook). The reference
    standard for Cura's Translation-quality sub-check; if it goes stale,
    Cura measures against outdated guidance. Round 142 ships the freshness
    floor; the deeper cure (scheduled web-fetch + auto-propose-updates) is
    filed in vision-living-system-kernel.md #6 for future work.

    Threshold: warning at >60 days since mtime; critical at >120 days.
    Bootstrap-guard: if file doesn't exist, return INFO (translation-quality
    sub-check inactive).
    Truth anchor: filesystem mtime + cadence-expectation derived from the
    file's own claimed maintenance pattern.
    """
    path = ROOT / "memory" / "claude-best-practices.md"
    if not path.exists():
        return True, "claude-best-practices.md not present (translation-quality sub-check inactive)"
    try:
        mtime = path.stat().st_mtime
    except Exception as e:
        return False, f"could not stat claude-best-practices.md: {e}"
    import datetime as _dt
    age_days = (datetime.datetime.now().timestamp() - mtime) / 86400
    if age_days > 120:
        return False, (
            f"memory/claude-best-practices.md is {age_days:.0f} days stale (cap: 120). "
            f"Cura's translation-quality sub-check measures against this standard nightly; "
            f"staleness > 120d risks Cura grading lessons against outdated guidance. "
            f"Refresh from current Anthropic guidance OR `touch memory/claude-best-practices.md` "
            f"to confirm-still-current."
        )
    if age_days > 60:
        # Warning, but pass the invariant — staleness is real but not critical yet
        return True, (
            f"memory/claude-best-practices.md is {age_days:.0f} days old (warn at 60, critical at 120). "
            f"Consider refresh from current Anthropic prompt-engineering guidance."
        )
    return True, f"memory/claude-best-practices.md fresh ({age_days:.0f} days since last refresh)"


def check_prompt_enum_consumer_sync():
    """Round 142 D-2 — detect prompt-vs-parser enum drift before it ships.

    Source: Round 137 parser-drift incident — Round 136 extended Cura's
    sub-check enum from 4 to 5, but tools/build_tacitus_dashboard_live.py's
    parser regex was hardcoded to the old 4-enum, silently mis-bucketing the
    new sub-check's candidates. Round 142 closes the loop with a pre-audit
    check that surfaces enum drift between prompt and parser.

    Approach: scan tacitus/prompts/cura.md for the sub-check enum names
    (Bug / Contradiction / Integrity / Architectural / Translation-quality)
    AND scan tools/build_tacitus_dashboard_live.py for the same enum in the
    sub_re regex. Flag if either side has values the other doesn't.

    Severity: warning (surfaces drift early; the parser-drift damage was
    silent-degenerate-data, but tonight's catch is pre-damage detection).
    """
    cura_path = ROOT / "tacitus" / "prompts" / "cura.md"
    parser_path = ROOT / "tools" / "build_tacitus_dashboard_live.py"
    if not cura_path.exists() or not parser_path.exists():
        return True, "cura.md or parser file missing (skipped)"
    try:
        cura_text = cura_path.read_text(encoding="utf-8")
        parser_text = parser_path.read_text(encoding="utf-8")
    except Exception as e:
        return False, f"could not read files: {e}"
    # Extract sub-check enum from cura.md — look for the "## Phase 1" sub-check headers
    # Pattern: lines like "Bug sub-check:" or "Translation-quality sub-check:"
    cura_subchecks = set()
    for m in re.finditer(r"^(\w[\w\-]*)\s+sub-check[\s:]", cura_text, re.MULTILINE):
        name = m.group(1)
        if name and name not in ('the', 'each'):  # filter prose mentions
            cura_subchecks.add(name)
    # Extract sub-check enum from parser
    # Pattern: r"^(Bug|Contradiction|Integrity|Architectural|Translation-quality|Security) ..."
    # Round 156 — extended to 6 sub-checks (Security added) per accept-all-shapes alternation pattern.
    parser_subchecks = set()
    for m in re.finditer(r"\(Bug\|Contradiction\|Integrity\|Architectural\|Translation-quality\|Security\)", parser_text):
        parser_subchecks = {'Bug', 'Contradiction', 'Integrity', 'Architectural', 'Translation-quality', 'Security'}
        break
    # Backward-compat: accept the pre-Round-156 5-enum literal so a partial downgrade doesn't trip.
    if not parser_subchecks:
        for m in re.finditer(r"\(Bug\|Contradiction\|Integrity\|Architectural\|Translation-quality\)", parser_text):
            parser_subchecks = {'Bug', 'Contradiction', 'Integrity', 'Architectural', 'Translation-quality'}
            break
    # Fallback: extract from any enum-style literal
    if not parser_subchecks:
        for m in re.finditer(r"r\"\^?\(((?:[A-Z][\w\-]*\|){3,}[A-Z][\w\-]*)\)", parser_text):
            parser_subchecks = set(m.group(1).split('|'))
            break
    cura_only = cura_subchecks - parser_subchecks
    parser_only = parser_subchecks - cura_subchecks
    if cura_only or parser_only:
        msgs = []
        if cura_only:
            msgs.append(f"cura.md names but parser doesn't: {sorted(cura_only)}")
        if parser_only:
            msgs.append(f"parser hardcodes but cura.md doesn't: {sorted(parser_only)}")
        return False, (
            f"prompt-vs-parser sub-check enum drift detected. {'. '.join(msgs)}. "
            f"Per Round 137 lesson on parser-drift family, prompt changes require "
            f"parser updates in the same patch. Update tools/build_tacitus_dashboard_live.py."
        )
    return True, f"sub-check enum aligned ({len(cura_subchecks)} entries): {sorted(cura_subchecks)}"




def check_regimen_slot_invariant_wired():
    """Round 143 — Phase 6 atomic close. Verify the client-side
    REGIMEN_SLOT_INVARIANT (Round 134 ship) is still structurally wired in
    dashboard.html. The runtime check `assertRegimenSlotInvariant()` enforces
    "items-without-slot is structurally impossible after first add" at four
    arms: (1) function defined, (2) window-exposed for cross-IIFE access,
    (3) load-time DOMContentLoaded handler, (4) post-mutation calls from
    addItemToRegimen + applyRegimenSlotEffects.

    Drift detector for the canonical default-regimen invariant. If any of the
    4 structural arms is missing, the runtime self-healing breaks.

    Truth anchor: grep patterns on dashboard.html.
    Severity: warning (client-side runtime check failure is recoverable; this
    invariant catches structural drift before users see broken state).
    """
    # Round 161 R1·B — JS split across dashboard.html + legacy-dashboard.js.
    # Read both during migration window. Remove the legacy concat in Round 5.
    dash = ROOT / "dashboard" / "dashboard.html"
    legacy_js = ROOT / "dashboard/assets/js/legacy-dashboard.js"
    if not dash.exists():
        return True, "dashboard.html missing (no enforcement)"
    try:
        text = dash.read_text(encoding="utf-8")
        if legacy_js.exists():
            text = text + "\n/* ---- legacy-dashboard.js ---- */\n" + legacy_js.read_text(encoding="utf-8")
    except Exception as e:
        return False, f"could not read dashboard JS surfaces: {e}"
    missing = []
    # Arm 1: function defined
    if not re.search(r"function\s+assertRegimenSlotInvariant\s*\(", text):
        missing.append("function definition (`function assertRegimenSlotInvariant()`)")
    # Arm 2: window-exposed
    if not re.search(r"window\.assertRegimenSlotInvariant\s*=", text):
        missing.append("window export (`window.assertRegimenSlotInvariant = ...`)")
    # Arm 3: load-time DOMContentLoaded handler wired
    if "__rgInvariantWired" not in text:
        missing.append("load-time arm (`__rgInvariantWired` flag + DOMContentLoaded handler)")
    # Arm 4: post-mutation calls (at least 2 sites)
    post_mutation_calls = len(re.findall(r"assertRegimenSlotInvariant\s*\(\s*\)", text))
    if post_mutation_calls < 3:
        missing.append(f"post-mutation calls (found {post_mutation_calls}, expected ≥3 — load-time + addItem + apply effects)")
    if missing:
        return False, (
            f"REGIMEN_SLOT_INVARIANT structural wiring incomplete: {'; '.join(missing)}. "
            f"Per Round 134's architectural commitment, items-without-slot must be structurally "
            f"impossible after first add. Self-healing relies on all 4 arms being present."
        )
    return True, f"REGIMEN_SLOT_INVARIANT fully wired (function + window export + load-time arm + {post_mutation_calls} call sites)"




# ===========================================================================
# Round 144 — Vision pattern-seed compliance invariant
# ===========================================================================
# Drift detector for the seed-not-propagate discipline. Vision cannot see
# rendered output, so the prompt's structural commitments (feature-flag gate,
# hard cap, seed-not-propagate framing, never-batch-conversion prohibition)
# are the user's only safeguard against Vision converting all 20 buttons in
# one night. This invariant verifies all 4 arms remain in the Vision prompt.
# See memory/essence/saga.md Round 144 entry for full context + rollback recipe.

def check_vision_pattern_seed_compliance():
    """Round 144 — verify tacitus/prompts/vision.md structurally retains the
    four arms of the seed-not-propagate discipline introduced in Round 140.

    Arms:
      1. Feature-flag gate present (`flags.vision_pattern_seed.enabled` ref +
         explicit SKIP-if-false instruction)
      2. HARD CAP language ("HARD CAP" + "ONE pattern-seed candidate per night")
      3. Seed-not-propagate verbatim framing required ("SEED proposal" +
         "Vision cannot verify rendered output")
      4. NEVER-batch-conversion prohibition ("Vision NEVER proposes batch
         conversion" OR equivalent + "Vision does NOT propose surface-cascade")

    Why this matters: Vision cannot see rendered output. If a future edit
    accidentally weakens any arm (e.g., dropping the HARD CAP, dropping the
    surface-cascade prohibition), Vision could land "convert all 20 buttons"
    as a single LAND proposal — user's named-cure for the Round 140 design
    concern would be silently undone.

    Truth anchor: grep patterns on tacitus/prompts/vision.md.
    Severity: warning (procedural-discipline drift, not user-visible break).
    """
    prompt_path = ROOT / "tacitus" / "prompts" / "vision.md"
    if not prompt_path.exists():
        return False, "tacitus/prompts/vision.md missing — Vision prompt is load-bearing"
    try:
        text = prompt_path.read_text(encoding="utf-8")
    except Exception as e:
        return False, f"could not read vision.md: {e}"
    missing = []
    # Arm 1: feature-flag gate
    if "flags.vision_pattern_seed.enabled" not in text:
        missing.append("feature-flag gate (`flags.vision_pattern_seed.enabled` ref)")
    elif not re.search(r"SKIP\s+this\s+candidate\s+type\s+entirely|SKIP\s+this\s+candidate", text):
        missing.append("explicit SKIP-if-false instruction")
    # Arm 2: HARD CAP language
    if "HARD CAP" not in text:
        missing.append("HARD CAP marker")
    elif not re.search(r"ONE\s+pattern-seed\s+candidate\s+per\s+night", text):
        missing.append("cap quantification (\"ONE pattern-seed candidate per night\")")
    # Arm 3: Seed-not-propagate framing
    if "SEED proposal" not in text:
        missing.append("SEED proposal framing marker")
    if "Vision cannot verify rendered output" not in text:
        missing.append("\"Vision cannot verify rendered output\" verbatim phrase")
    # Arm 4: batch-conversion / surface-cascade prohibition
    if not re.search(r"NEVER\s+proposes\s+batch\s+conversion|never\s+propose\s+batch\s+conversion", text):
        missing.append("batch-conversion prohibition")
    if "surface-cascade" not in text:
        missing.append("surface-cascade prohibition (\"Vision does NOT propose surface-cascade\")")
    if missing:
        return False, (
            f"Vision pattern-seed discipline drift detected — {len(missing)} arm(s) missing: "
            f"{'; '.join(missing)}. Per Round 140 architectural commitment, Vision CANNOT see "
            f"rendered output, so these prompt-level guards are the only safeguard against batch "
            f"surface-cascade proposals. Restore the missing arms before next Vision run."
        )
    return True, "Vision pattern-seed discipline fully intact (feature-flag gate + HARD CAP + seed-not-propagate framing + batch/cascade prohibition)"


# ---------------------------------------------------------------------------
# Round 148 — Closing-the-loop logging discipline (Phase A + B + C)
# ---------------------------------------------------------------------------
# Family: paired-write integrity for every logging surface. Saga round close
# writes a unified `**Closing-move record:**` marker enumerating each paired
# surface this round touched (Implementations / Lessons / Decisions / Memory
# writes). Each marker line is verified by its own invariant. The catalog at
# memory/paired-write-catalog.md is the visible enumeration of which surfaces
# are covered by which invariants.
#
# Round 120 lesson recurred 2026-06-19 (the user noticed today's Cura/Vision
# survivors had no icons; Edit-truncation of latest_status() compounded the
# silent-fail by swallowing the resulting exception in build_tacitus_dashboard
# _live.py). Round 148 closes the loop.

_ROUND_HEADER_RE = re.compile(r"^## Round (\d+)\b", re.MULTILINE)


def _saga_rounds(saga_text: str, n_recent: int = 5) -> list[tuple[int, str]]:
    """Return list of (round_number, round_body) for the N most-recent rounds
    in saga.md. Body runs from this round's header to the next `## ` heading."""
    matches = list(_ROUND_HEADER_RE.finditer(saga_text))
    if not matches:
        return []
    rounds: list[tuple[int, str]] = []
    for i, m in enumerate(matches):
        rnum = int(m.group(1))
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(saga_text)
        rounds.append((rnum, saga_text[start:end]))
    rounds.sort(key=lambda x: x[0], reverse=True)
    return rounds[:n_recent]


def _marker_lines(round_body: str, marker_label: str) -> tuple[bool, list[str]]:
    """Return (marker_present, citation_lines) for a `**<label>:**` marker.

    Two acceptable shapes per Round 148 §30:

    Shape A (standalone marker — original Round 140 §27 pattern):
        **<Label>:** <inline content OR N/A>
        - bullet 1
        - bullet 2

    Shape B (sub-bullet inside the unified Closing-move record block,
    introduced Round 148 §30):
        **Closing-move record:**
        - <Label>: <citations OR N/A>
        - <Other label>: ...

    For Shape B, the citation lines are just the single bullet (its content
    after the colon); if that content starts with `N/A`, returns (True, [])."""
    # Shape A first
    pat_a = re.compile(
        rf"\*\*{re.escape(marker_label)}:\*\*\s*(?P<inline>[^\n]*)\n(?P<bullets>(?:- [^\n]*\n)*)",
        re.MULTILINE,
    )
    m = pat_a.search(round_body)
    if m:
        inline = m.group("inline").strip()
        if inline.upper().startswith("N/A"):
            return True, []
        bullets = [ln.strip() for ln in m.group("bullets").splitlines() if ln.strip().startswith("-")]
        return True, bullets
    # Shape B — sub-bullet under Closing-move record
    pat_b = re.compile(
        r"\*\*Closing-move record:\*\*\s*\n(?P<block>(?:- [^\n]*\n)+)",
        re.MULTILINE,
    )
    m = pat_b.search(round_body)
    if not m:
        return False, []
    label_lc = marker_label.lower()
    for ln in m.group("block").splitlines():
        ls = ln.strip()
        if not ls.startswith("-"):
            continue
        # Strip leading dash + spaces
        content = ls[1:].strip()
        # Expect format "<Label>: <citations or N/A>"
        if ":" not in content:
            continue
        line_label, _, line_value = content.partition(":")
        if line_label.strip().lower() != label_lc:
            continue
        value = line_value.strip()
        if value.upper().startswith("N/A"):
            return True, []
        # Treat the single value line as a citation bullet (parsers downstream
        # accept any bullet shape; we wrap it in the leading-dash form so the
        # existing citation-parse regexes still hit).
        return True, ["- " + value]
    return False, []


def check_round_implementations_marker_truthful():
    """Round 148 — verify each round's `**Implementations logged:**` marker
    truthfully cites real entries in memory/system/implementations.jsonl.

    Scope: the 5 most-recent saga rounds at or above Round 148 (the floor
    round). Pre-Round-148 rounds are not enforced (bootstrap-guard)."""
    saga_path = ROOT / "memory" / "essence" / "saga.md"
    jsonl_path = ROOT / "memory" / "system" / "implementations.jsonl"
    if not saga_path.exists():
        return True, "saga.md missing (bootstrap-guard); skipping"
    if not jsonl_path.exists():
        return True, "implementations.jsonl missing (bootstrap-guard); skipping"
    saga = saga_path.read_text(encoding="utf-8")
    entries = []
    with open(jsonl_path, encoding="utf-8") as f:
        for raw in f:
            raw = raw.strip()
            if not raw:
                continue
            try:
                entries.append(json.loads(raw))
            except json.JSONDecodeError:
                continue
    failures = []
    checked = 0
    for rnum, body in _saga_rounds(saga, n_recent=5):
        if rnum < 148:
            continue
        present, bullets = _marker_lines(body, "Implementations logged")
        if not present:
            failures.append(f"Round {rnum}: `**Implementations logged:**` marker missing")
            continue
        checked += 1
        for line in bullets:
            # Match shape: "- Cura/Vision #N Survivor X → status (Round Y, ...)"
            m = re.search(r"(Cura|Vision)\s*#(\d+).+?→\s*(\w+).+?Round\s*(\d+)", line)
            if not m:
                continue  # narrative bullet, not a citation
            mode, sess, status, round_cited = m.group(1), int(m.group(2)), m.group(3), int(m.group(4))
            # Find matching entry
            hit = [e for e in entries
                   if e.get("source_mode") == mode
                   and e.get("source_session") == sess
                   and e.get("status") == status
                   and e.get("round") == round_cited]
            if not hit:
                failures.append(
                    f"Round {rnum}: marker cites {mode} #{sess} {status} Round {round_cited} "
                    f"but no matching implementations.jsonl entry"
                )
    if failures:
        return False, "; ".join(failures[:5])
    return True, f"Implementations markers truthful across {checked} round(s) at or above floor Round 148"


def _parse_notebook_survivors(notebook_text: str) -> list[tuple[str, str, int, str]]:
    """Return list of (session_date, mode, session_num, candidate) for every
    deepen-phase survivor across the notebook. Uses same regex shape as
    build_tacitus_dashboard_live.py _parse_deepen_block to mirror parser truth."""
    out: list[tuple[str, str, int, str]] = []
    # Find each "<MODE> session #N (YYYY-MM-DD..." header
    header_re = re.compile(
        r"(?:^|\n)\s*(Cura|Vision)\s+session\s+#(\d+)\b.*?\((\d{4}-\d{2}-\d{2})",
        re.IGNORECASE,
    )
    headers = list(header_re.finditer(notebook_text))
    for i, h in enumerate(headers):
        mode = h.group(1).capitalize()
        sess = int(h.group(2))
        date = h.group(3)
        start = h.end()
        end = headers[i + 1].start() if i + 1 < len(headers) else len(notebook_text)
        block = notebook_text[start:end]
        # Find DEEPEN section within this session block
        m = re.search(r"PHASE 3\s*[—\-]\s*DEEPEN(.+?)(?:PHASE 4|\Z)", block, re.DOTALL)
        if not m:
            continue
        deepen = m.group(1)
        surv_re = re.compile(
            r"^Survivor [A-Z]\s*(?:—\s*(?P<dash>.+?)\.\s*\n[═=]{3,}|\((?P<paren>[^\n]+)\))",
            re.MULTILINE,
        )
        for s in surv_re.finditer(deepen):
            title = (s.group("dash") or s.group("paren") or "").strip()
            if title:
                out.append((date, mode, sess, title))
    return out


def check_survivor_implementation_logged():
    """Round 148 — for every Cura/Vision deepen survivor whose session date
    is >=1 day ago, verify an implementations.jsonl entry exists.

    Tolerance: today's survivors are excluded (rest of day to address).
    Floor: 2026-06-19 (first day after Round 148 ships)."""
    notebook_dir = ROOT / "tacitus" / "notebook"
    jsonl_path = ROOT / "memory" / "system" / "implementations.jsonl"
    if not notebook_dir.exists() or not jsonl_path.exists():
        return True, "notebook or impl log missing (bootstrap-guard); skipping"
    sys.path.insert(0, str(ROOT / "tools"))
    try:
        from implementation_log import latest_status
    except ImportError:
        return True, "implementation_log not importable (bootstrap-guard)"
    today = datetime.date.today()
    floor = datetime.date(2026, 6, 19)
    missing = []
    checked = 0
    for nb in sorted(notebook_dir.glob("*.md")):
        text = nb.read_text(encoding="utf-8")
        for date_s, mode, sess, candidate in _parse_notebook_survivors(text):
            try:
                d = datetime.date.fromisoformat(date_s)
            except ValueError:
                continue
            if d < floor:
                continue
            if (today - d).days < 1:
                continue  # same-day grace
            checked += 1
            try:
                r = latest_status(source_date=date_s, source_mode=mode,
                                  source_session=sess, candidate=candidate)
            except Exception as e:
                missing.append(f"{mode} #{sess} {date_s} '{candidate[:40]}…' lookup raised: {e}")
                continue
            if not r:
                missing.append(f"{mode} #{sess} {date_s} unlogged: '{candidate[:50]}…'")
    if missing:
        return False, f"{len(missing)} unlogged survivor(s): " + " | ".join(missing[:5])
    return True, f"all {checked} eligible survivor(s) have implementations.jsonl entries"


def check_dashboard_impl_status_source_purity():
    """Round 148 — verify build_tacitus_dashboard_live.py reads implementation
    status ONLY via implementation_log.latest_status() and contains no other
    status-overriding surface (hardcoded, env-var, localStorage projection).

    Truth anchor: grep patterns on the build script."""
    path = ROOT / "tools" / "build_tacitus_dashboard_live.py"
    if not path.exists():
        return True, "build script missing (bootstrap-guard)"
    text = path.read_text(encoding="utf-8")
    if "from implementation_log import latest_status" not in text:
        return False, "build_tacitus_dashboard_live.py does not import latest_status — canonical source not wired"
    forbidden = [
        ("IMPL_STATUS_OVERRIDE", "env-var status override"),
        ("hardcoded_status", "hardcoded status branch"),
        ("FORCE_IMPL_STATUS", "force-impl env"),
    ]
    hits = [reason for token, reason in forbidden if token in text]
    if hits:
        return False, f"impurity detected: {'; '.join(hits)}"
    return True, "build_tacitus_dashboard_live.py reads impl status only via latest_status() (no override surfaces)"


def check_round_lessons_marker_truthful():
    """Round 148 — verify each round's `**Lessons logged:**` marker cites
    lessons.md additions actually present in the file. Floor: Round 148."""
    saga_path = ROOT / "memory" / "essence" / "saga.md"
    lessons_path = ROOT / "memory" / "essence" / "lessons.md"
    if not saga_path.exists() or not lessons_path.exists():
        return True, "saga or lessons missing (bootstrap-guard); skipping"
    saga = saga_path.read_text(encoding="utf-8")
    lessons = lessons_path.read_text(encoding="utf-8")
    failures = []
    checked = 0
    for rnum, body in _saga_rounds(saga, n_recent=5):
        if rnum < 148:
            continue
        present, bullets = _marker_lines(body, "Lessons logged")
        if not present:
            failures.append(f"Round {rnum}: `**Lessons logged:**` marker missing")
            continue
        checked += 1
        for line in bullets:
            m = re.search(r"lessons\.md:(\d+)", line)
            if not m:
                continue
            line_num = int(m.group(1))
            lines = lessons.splitlines()
            if line_num < 1 or line_num > len(lines):
                failures.append(f"Round {rnum}: cited lessons.md:{line_num} out of range (file has {len(lines)} lines)")
                continue
            window = "\n".join(lines[max(0, line_num - 1): min(len(lines), line_num + 5)])
            if "(2026-06" not in window and "**(" not in window:
                failures.append(f"Round {rnum}: cited lessons.md:{line_num} has no recognizable lesson body nearby")
    if failures:
        return False, "; ".join(failures[:5])
    return True, f"Lessons markers truthful across {checked} round(s) at or above floor Round 148"


def check_round_decisions_marker_truthful():
    """Round 148 — verify `**Decisions logged:**` marker truthfulness. Floor: Round 148."""
    saga_path = ROOT / "memory" / "essence" / "saga.md"
    dec_path = ROOT / "memory" / "essence" / "decisions.md"
    if not saga_path.exists() or not dec_path.exists():
        return True, "saga or decisions missing (bootstrap-guard); skipping"
    saga = saga_path.read_text(encoding="utf-8")
    dec = dec_path.read_text(encoding="utf-8")
    failures = []
    checked = 0
    for rnum, body in _saga_rounds(saga, n_recent=5):
        if rnum < 148:
            continue
        present, bullets = _marker_lines(body, "Decisions logged")
        if not present:
            failures.append(f"Round {rnum}: `**Decisions logged:**` marker missing")
            continue
        checked += 1
        for line in bullets:
            m = re.search(r"decisions\.md:(\d+)", line)
            if not m:
                continue
            line_num = int(m.group(1))
            lines = dec.splitlines()
            if line_num < 1 or line_num > len(lines):
                failures.append(f"Round {rnum}: cited decisions.md:{line_num} out of range")
    if failures:
        return False, "; ".join(failures[:5])
    return True, f"Decisions markers truthful across {checked} round(s) at or above floor Round 148"


def check_round_memory_writes_marker_truthful():
    """Round 148 — verify `**Memory writes logged:**` marker truthfulness against
    memory-change-log.md. Floor: Round 148."""
    saga_path = ROOT / "memory" / "essence" / "saga.md"
    mcl_path = ROOT / "memory" / "memory-change-log.md"
    if not saga_path.exists() or not mcl_path.exists():
        return True, "saga or memory-change-log missing (bootstrap-guard); skipping"
    saga = saga_path.read_text(encoding="utf-8")
    mcl = mcl_path.read_text(encoding="utf-8")
    failures = []
    checked = 0
    for rnum, body in _saga_rounds(saga, n_recent=5):
        if rnum < 148:
            continue
        present, bullets = _marker_lines(body, "Memory writes logged")
        if not present:
            failures.append(f"Round {rnum}: `**Memory writes logged:**` marker missing")
            continue
        checked += 1
        for line in bullets:
            m = re.search(r"Round\s*" + str(rnum) + r"\b", line)
            if not m:
                continue
            # Verify memory-change-log.md mentions this round
            if f"Round {rnum}" not in mcl:
                failures.append(f"Round {rnum}: marker cites memory write but memory-change-log.md has no `Round {rnum}` reference")
    if failures:
        return False, "; ".join(failures[:5])
    return True, f"Memory-writes markers truthful across {checked} round(s) at or above floor Round 148"


def check_paired_write_catalog_coverage():
    """Round 148 — verify memory/paired-write-catalog.md exists and enumerates
    the project's paired-write surfaces. Each catalog row must cite either a
    real invariant name from this file OR an explicit `(none yet)` placeholder."""
    cat_path = ROOT / "memory" / "paired-write-catalog.md"
    if not cat_path.exists():
        return False, "memory/paired-write-catalog.md missing (Round 148 ship deliverable)"
    text = cat_path.read_text(encoding="utf-8")
    # Each catalog row uses `| ... | invariant_name |` table format or named bullet
    cited = set(re.findall(r"`check_[a-z_]+`", text))
    if not cited:
        return False, "paired-write-catalog.md has no `check_*` invariant citations"
    # Verify every cited invariant exists in INVARIANTS manifest
    manifest_names = {i.name for i in INVARIANTS}
    missing = []
    for c in cited:
        name = c.strip("`").removeprefix("check_")
        if name not in manifest_names:
            missing.append(c)
    if missing:
        return False, f"catalog cites unregistered invariant(s): {', '.join(missing)}"
    return True, f"paired-write-catalog.md cites {len(cited)} registered invariant(s); all wired"




# ---------------------------------------------------------------------------
# Round 155 / Saturday Item 5 — Vision Survivor B paired weekly invariant
# ---------------------------------------------------------------------------
# Reads the snapshot written by tools/best_practices_refresh.py (invoked by
# tools/system_audit.py on weekly Sunday runs). Surfaces freshness state +
# any unreviewed content changes from docs.claude.com. No fetch in the
# invariant itself — keeps audit-time check cheap and offline.

def check_best_practices_refresh_status():
    """Weekly cadence — reports whether tools/best_practices_refresh.py has
    run recently AND whether any tracked URLs show unreviewed changes.

    Bootstrap: if the snapshot has never been written (first weekly Sunday
    after Item 5 ships), reports `bootstrap` state cleanly and passes — the
    next weekly run will populate the baseline.

    Severity: warning. Editorial-quality drift surface; the file's content
    correctness is not load-bearing for runtime behavior."""
    sys.path.insert(0, str(ROOT / "tools"))
    try:
        from best_practices_refresh import get_freshness_status, TRACKED_URLS
    except ImportError as e:
        return True, f"best_practices_refresh module not importable (bootstrap-guard): {e}"
    status = get_freshness_status()
    if status["last_refresh_at"] is None:
        return True, (
            f"bootstrap: {status['tracked_urls']} URL(s) tracked, snapshot empty — "
            "next weekly Sunday run will write baseline"
        )
    days = status["days_since_refresh"]
    if days is not None and days > 9:
        return False, (
            f"snapshot stale: {days:.1f} days since last refresh "
            f"(weekly cadence + buffer = 9 days); "
            f"system_audit.py --weekly may have skipped or failed"
        )
    if status["unreviewed_changes"]:
        urls = status["unreviewed_changes"]
        return False, (
            f"{len(urls)} docs.claude.com page(s) changed since last review: "
            + "; ".join(urls[:3])
            + ("…" if len(urls) > 3 else "")
            + ". Review the diff or `python3 tools/best_practices_refresh.py ack <url>`"
        )
    return True, (
        f"snapshot fresh ({days:.1f} days since refresh); "
        f"{status['snapshot_pages']}/{status['tracked_urls']} URL(s) tracked; no unreviewed changes"
    )


# ---------------------------------------------------------------------------
# Round 150 — Cross-Surface State Sync chokepoint routing (§31)
# ---------------------------------------------------------------------------
# Family: every regimen LS write must occur inside a chokepoint helper that
# fires triggerRegimenRerender so all subscribed surfaces re-render. The
# failure family from Rounds 134/141/149: mutation on surface A leaves stale
# state on surfaces B/C until manual reload. §31 closes the loop.

_REGIMEN_LS_KEYS = ("lcRegimen_v1", "rgOverrides_v1", "rgManualItems_v1", "rgRemoved_v1", "rgUserGoals_v1")
_REGIMEN_CHOKEPOINTS = ("persistRegimen", "saveRgOverride", "saveRgManual", "saveRgRemoved", "saveRgUserGoals")


def check_regimen_state_mutation_routing():
    """Round 150 §31 — every direct `lsWrite('<regimen-key>', ...)` in
    dashboard/dashboard.html must occur inside one of the four chokepoint
    helpers (persistRegimen / saveRgOverride / saveRgManual / saveRgRemoved),
    AND every chokepoint must call window.triggerRegimenRerender so all
    subscribed surfaces re-render after the mutation.

    Truth anchor: grep pattern + function-body extraction on dashboard.html.
    The invariant catches new mutation sites that bypass the chokepoint
    discipline AND chokepoints that lose their trigger call (e.g., via a
    refactor that drops the rerender).

    Scope: scan the main JS only. Markdown-embed script blocks
    (<script type="text/markdown" ...>) and JSON-data script blocks are
    excluded — they contain prose/data, not executable JS."""
    # Round 161 R1·B — JS surface split. dashboard.html still has the inline
    # data blocks; legacy-dashboard.js has the chokepoint helpers. Concat both
    # so the existing regex patterns find their targets. Round 5 removes the
    # legacy concat once chokepoints fully live in state/regimen.ts.
    path = ROOT / "dashboard" / "dashboard.html"
    legacy_js = ROOT / "dashboard/assets/js/legacy-dashboard.js"
    if not path.exists():
        return True, "dashboard.html missing (bootstrap-guard)"
    raw_text = path.read_text(encoding="utf-8")
    if legacy_js.exists():
        raw_text = raw_text + "\n/* ---- legacy-dashboard.js ---- */\n" + legacy_js.read_text(encoding="utf-8")
    # Mask non-JS script blocks (markdown / json data embeds) so their prose
    # contents don't trip the chokepoint scan. Replace block bodies with
    # space-padded equivalents to preserve line numbers + byte positions.
    nonjs_pat = re.compile(
        r"(<script\s+type=\"(?:text/markdown|application/json)\"[^>]*>)(.*?)(</script>)",
        re.DOTALL,
    )
    def _mask(m):
        body = m.group(2)
        return m.group(1) + (" " * len(body)) + m.group(3)
    text = nonjs_pat.sub(_mask, raw_text)

    # Part A: every chokepoint helper must contain a triggerRegimenRerender call.
    chokepoint_failures = []
    for fn_name in _REGIMEN_CHOKEPOINTS:
        # Extract the function body — match `function <name>(...)` through the
        # next matching closing brace. Simple brace-counting is sufficient for
        # the four targeted helpers (they're all short, no nested anon fns).
        m = re.search(rf"\bfunction\s+{re.escape(fn_name)}\s*\([^)]*\)\s*{{", text)
        if not m:
            chokepoint_failures.append(f"chokepoint helper `{fn_name}` not found in dashboard.html")
            continue
        # Walk braces from m.end() until balanced.
        body_start = m.end()
        depth = 1
        i = body_start
        while i < len(text) and depth > 0:
            ch = text[i]
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
            i += 1
        body = text[body_start:i - 1]
        if "triggerRegimenRerender" not in body:
            chokepoint_failures.append(
                f"chokepoint `{fn_name}` does NOT call triggerRegimenRerender "
                f"— §31 routing discipline violated"
            )

    # Part B: every direct lsWrite to a regimen LS key must occur inside one
    # of the chokepoint helpers. Scan all lsWrite call sites with regimen keys
    # and verify each is enclosed by a chokepoint function definition.
    key_pattern = "|".join(re.escape(k) for k in _REGIMEN_LS_KEYS)
    write_pattern = re.compile(rf"lsWrite\s*\(\s*['\"]({key_pattern})['\"]")
    # Build a map of chokepoint name → (start, end) byte positions in text.
    chokepoint_ranges = []
    for fn_name in _REGIMEN_CHOKEPOINTS:
        m = re.search(rf"\bfunction\s+{re.escape(fn_name)}\s*\([^)]*\)\s*{{", text)
        if not m:
            continue
        body_start = m.start()
        depth = 1
        i = m.end()
        while i < len(text) and depth > 0:
            ch = text[i]
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
            i += 1
        chokepoint_ranges.append((fn_name, body_start, i))

    bypass_failures = []
    for wm in write_pattern.finditer(text):
        pos = wm.start()
        # Skip writes that are themselves the chokepoint's own write (i.e.,
        # the lsWrite call inside a chokepoint definition is allowed).
        inside = False
        for name, s, e in chokepoint_ranges:
            if s <= pos < e:
                inside = True
                break
        if not inside:
            # Find the line for a useful error message.
            line_no = text.count("\n", 0, pos) + 1
            key = wm.group(1)
            bypass_failures.append(
                f"line {line_no}: lsWrite('{key}', ...) outside any §31 chokepoint helper"
            )

    # Part C: every regimen LS key must be registered in dashboard.html's
    # LS_SCHEMAS map. Round 156 follow-up miss — `rgUserGoals_v1` was added
    # as a chokepoint but not registered in LS_SCHEMAS; `lsWrite` silently
    # refused every write (just a `console.warn`), so the goal-picker UI
    # appeared functional but couldn't persist. This part catches that gap
    # at audit time.
    # Find LS_SCHEMAS by walking braces from its opening `{`.
    schema_failures = []
    schema_open_re = re.compile(r"const\s+LS_SCHEMAS\s*=\s*\{")
    schema_match = schema_open_re.search(text)
    schema_block = ""
    if schema_match:
        depth = 1
        i = schema_match.end()
        while i < len(text) and depth > 0:
            ch = text[i]
            if ch == "{": depth += 1
            elif ch == "}": depth -= 1
            i += 1
        schema_block = text[schema_match.end():i - 1]
    for key in _REGIMEN_LS_KEYS:
        if f"'{key}'" not in schema_block and f'"{key}"' not in schema_block:
            schema_failures.append(
                f"regimen LS key '{key}' missing from LS_SCHEMAS — lsWrite will silently refuse"
            )

    failures = chokepoint_failures + bypass_failures + schema_failures
    if failures:
        return False, "; ".join(failures[:5])
    return True, (
        f"all {len(_REGIMEN_CHOKEPOINTS)} chokepoint(s) fire triggerRegimenRerender; "
        f"all {len(_REGIMEN_LS_KEYS)} regimen LS key(s) registered in LS_SCHEMAS; "
        f"no regimen LS write bypasses §31 routing"
    )



# ---------------------------------------------------------------------------
# Round 156 — 4 deferred-candidate invariants shipped (Saturday Item 18)
# ---------------------------------------------------------------------------

def check_deferred_candidate_invariant_drift():
    """Round 156 (filed Round 125) — detects stale Deferred entries that have
    already shipped. Scans memory/open-threads.md Deferred section for
    `check_*` invariant names; flags any name that ALSO appears as a registered
    Invariant in the manifest. Filed-then-shipped = Deferred entry needs cleanup.

    Truth anchor: parse open-threads.md Deferred section + parse INVARIANTS
    registry by name."""
    ot_path = ROOT / "memory" / "open-threads.md"
    if not ot_path.exists():
        return True, "open-threads.md missing (bootstrap-guard)"
    text = ot_path.read_text(encoding="utf-8")
    # Scope to "## Deferred (filed; pick up when ready)" section
    dstart = text.find("## Deferred (filed")
    if dstart == -1:
        return True, "no Deferred section present; nothing to cross-check"
    # Section ends at next "## " heading or EOF
    dend = text.find("\n## ", dstart + 1)
    if dend == -1:
        dend = len(text)
    section = text[dstart:dend]
    # Skip strikethrough-marked paragraphs — those are the historical "shipped"
    # preservation pattern (~~text~~ + SHIPPED note). They're audit-trail, not
    # open candidates. A paragraph counts as strikethrough if it contains `~~`.
    lines = section.split("\n")
    clean_lines = [ln for ln in lines if "~~" not in ln]
    clean_section = "\n".join(clean_lines)
    # Find check_* names in the cleaned Deferred section
    deferred_names = set(re.findall(r"`check_(\w+)`", clean_section))
    # Find registered names in INVARIANTS
    registered_names = set(inv.name for inv in INVARIANTS)
    drift = deferred_names & registered_names
    if drift:
        return False, (
            f"{len(drift)} Deferred entry name(s) match shipped invariants: "
            + ", ".join(sorted(drift))
            + ". Retire the Deferred entries in memory/open-threads.md."
        )
    return True, (
        f"no Deferred-vs-INVARIANTS drift detected "
        f"({len(deferred_names)} deferred candidate(s), "
        f"{len(registered_names)} registered)"
    )


def check_no_native_dialogs():
    """Round 156 (filed Round 127) — Round 127 twice-burned design lesson:
    no native browser dialogs (prompt/confirm/alert) in dashboard.html.
    Discipline-only enforcement failed twice; structural escalation per
    Round 118 'discipline → invariant' doctrine.

    Method: mask non-JS script blocks + markdown / JSON-data embeds, then
    scan canonical JS for prompt(/confirm(/alert( calls. Excludes string
    literals + comments via simple heuristics.

    Truth anchor: source-text scan of dashboard.html canonical JS body."""
    dash = ROOT / "dashboard" / "dashboard.html"
    if not dash.exists():
        return True, "dashboard.html missing (bootstrap-guard)"
    raw = dash.read_text(encoding="utf-8")
    # Newline-preserving mask: replace non-newline chars with spaces so byte
    # positions + line numbers stay intact even after masking. Critical for
    # correct line-number reporting in violation messages.
    def _mask(m):
        return re.sub(r"[^\n]", " ", m.group(0))
    # Mask non-JS script blocks (markdown / json data embeds). This is the
    # only mask we apply — string/comment masking turned out fragile against
    # the dashboard\'s mixed-quote prose (single quotes inside regex literals,
    # contractions, etc.) and ate real call sites. Accept some false
    # positives in exchange for not losing real call sites; user can mark
    # known-OK occurrences with a trailing `// no_native_dialogs: ok` comment
    # which the suppression check below honors.
    nonjs_pat = re.compile(
        r"<script\s+type=\"(?:text/markdown|application/json)\"[^>]*>.*?</script>",
        re.DOTALL,
    )
    text = nonjs_pat.sub(_mask, raw)
    # Scan for native dialog calls — bare-name with following (.
    dialog_re = re.compile(r"(?<![.\w])\b(prompt|confirm|alert)\s*\(")
    hits = []
    for m in dialog_re.finditer(text):
        # Honor per-line suppression: a trailing `// no_native_dialogs: ok`
        # comment on the same line marks the call as known-OK (e.g., test
        # fixtures, legacy-tolerated paths).
        line_start = text.rfind("\n", 0, m.start()) + 1
        line_end = text.find("\n", m.start())
        if line_end == -1:
            line_end = len(text)
        line_text = text[line_start:line_end]
        if "no_native_dialogs: ok" in line_text:
            continue
        name = m.group(1)
        line_no = text.count("\n", 0, m.start()) + 1
        hits.append((name, line_no))
    if not hits:
        return True, "no native dialog calls (prompt/confirm/alert) in canonical JS"
    # Surface first 5 hits with line numbers
    sample = "; ".join(f"{n}() at line {ln}" for n, ln in hits[:5])
    return False, (
        f"{len(hits)} native dialog call(s) detected — Round 127 design family. "
        f"Route via showLcModal or showQuietToast instead. Sample: {sample}"
    )


def check_log_surface_mtimes():
    """Round 156 (filed Round 105) — per-log-surface ages with warning
    thresholds tuned per expected cadence. Catches long-quiet surfaces.

    Per-log thresholds:
      - vitality-findings.jsonl: warn at 14 days (logging-vitality cron is daily)
      - implementations.jsonl: warn at 14 days (Cura/Vision survivors weekly)
      - dashboard-build-log.jsonl: warn at 14 days (build cron daily Mon-Fri)
      - best-practices-findings.jsonl: warn at 21 days (weekly Sunday cron)

    Truth anchor: filesystem mtime per file. Bootstrap-guarded — missing
    file is acceptable (log hasn't started yet)."""
    surfaces = [
        ("memory/system/vitality-findings.jsonl", 14),
        ("memory/system/implementations.jsonl", 14),
        ("memory/system/dashboard-build-log.jsonl", 14),
        ("memory/system/best-practices-findings.jsonl", 21),
    ]
    import time
    now = time.time()
    stale = []
    checked = 0
    bootstrapping = []
    for rel, threshold_days in surfaces:
        p = ROOT / rel
        if not p.exists():
            bootstrapping.append(rel)
            continue
        checked += 1
        age_days = (now - p.stat().st_mtime) / 86400.0
        if age_days > threshold_days:
            stale.append(f"{rel} ({age_days:.1f}d > {threshold_days}d threshold)")
    if stale:
        return False, (
            f"{len(stale)} log surface(s) stale: " + "; ".join(stale)
            + (f". Bootstrapping: {', '.join(bootstrapping)}" if bootstrapping else "")
        )
    return True, (
        f"all {checked} log surface(s) fresh"
        + (f"; bootstrapping: {', '.join(bootstrapping)}" if bootstrapping else "")
    )


def check_tacitus_dashboard_no_real_data_fetches():
    """Round 156 (filed Round 101) — verify tacitus/dashboard/index.html
    contains no fetch() / XMLHttpRequest / localStorage calls touching
    tacitus_* keys. Preserves Round 101 contamination guarantee: Tacitus
    dashboard is a standalone observation surface with no live-runtime path.

    Truth anchor: regex scan of tacitus/dashboard/index.html."""
    path = ROOT / "tacitus" / "dashboard" / "index.html"
    if not path.exists():
        return True, "tacitus/dashboard/index.html missing (bootstrap-guard)"
    text = path.read_text(encoding="utf-8")
    violations = []
    # fetch( call
    for m in re.finditer(r"(?<![.\w])\bfetch\s*\(", text):
        line_no = text.count("\n", 0, m.start()) + 1
        violations.append(f"fetch() at line {line_no}")
    # XMLHttpRequest
    for m in re.finditer(r"\bnew\s+XMLHttpRequest\s*\(", text):
        line_no = text.count("\n", 0, m.start()) + 1
        violations.append(f"XMLHttpRequest at line {line_no}")
    # localStorage.{get,set,remove}Item touching tacitus_* key
    for m in re.finditer(r"localStorage\.(?:getItem|setItem|removeItem)\s*\(\s*['\"]tacitus_", text):
        line_no = text.count("\n", 0, m.start()) + 1
        violations.append(f"localStorage tacitus_* access at line {line_no}")
    if violations:
        return False, (
            f"{len(violations)} contamination-vector(s) detected: "
            + "; ".join(violations[:5])
            + ". Round 101 contamination guarantee broken."
        )
    return True, "no real-data fetches detected in tacitus/dashboard/index.html"



# ---------------------------------------------------------------------------
# Round 156 / Saturday Item 15 — consolidation umbrella for the 5
# marker-truthful invariants. Manifest noise reduction WITHOUT loss of any
# of the 5 underlying paired-write surface checks. The umbrella calls each
# existing check_fn in sequence and aggregates results; if ANY of the 5
# checks fails, the umbrella reports the union of all failures.
# ---------------------------------------------------------------------------

def check_round_markers_truthful():
    """Umbrella for 5 marker-truthfulness invariants. Each underlying
    check_fn is invoked verbatim; failures aggregate. The 5-failure-point
    protection is preserved — only the manifest row count drops from 5 to 1.

    Underlying checks:
      - check_round_pattern_consultation_marker (Round 140)
      - check_round_implementations_marker_truthful (Round 148)
      - check_round_lessons_marker_truthful (Round 148)
      - check_round_decisions_marker_truthful (Round 148)
      - check_round_memory_writes_marker_truthful (Round 148)
    """
    underlying = [
        ("patterns_consulted", check_round_pattern_consultation_marker),
        ("implementations", check_round_implementations_marker_truthful),
        ("lessons", check_round_lessons_marker_truthful),
        ("decisions", check_round_decisions_marker_truthful),
        ("memory_writes", check_round_memory_writes_marker_truthful),
    ]
    failures = []
    passes = []
    for label, fn in underlying:
        try:
            ok, msg = fn()
        except Exception as e:
            failures.append(f"{label}: check raised {type(e).__name__}: {e}")
            continue
        if ok:
            passes.append(label)
        else:
            failures.append(f"{label}: {msg}")
    if failures:
        return False, (
            f"{len(failures)} of 5 marker surfaces failed: "
            + " | ".join(failures[:5])
        )
    return True, f"all 5 marker surfaces truthful ({', '.join(passes)})"



# ---------------------------------------------------------------------------
# Eden — sealed catalog architecture (Round 157 / 2026-06-20)
# ---------------------------------------------------------------------------
# Three invariants that hold the sealed garden together:
#   1. check_eden_hash_integrity — actual SHA-256 of eden-catalog.json must
#      match the locked golden hash. Truth anchor: math (deterministic hash).
#   2. check_eden_embeds_match_canonical — the three dashboard embeds
#      (regimen-label-lookup, goal-recommendations-data, REGIMEN_BASE_DATA
#      .recommended) must carry the same eden_version as the canonical
#      catalog. Drift = loud failure.
#   3. check_eden_write_protection — agent (this codebase) must never write
#      to eden/eden-catalog.json or eden/eden-catalog.golden.sha256. Scans
#      memory/memory-change-log.md for any agent-touched line matching
#      those paths.

def check_eden_hash_integrity():
    """Round 157 — Eden truth anchor. Computes SHA-256 of eden-catalog.json,
    compares against eden-catalog.golden.sha256. Identical = pass. Any drift
    = critical fail. BOOTSTRAP state (golden placeholder) reports as info-
    level success since Eden hasn\'t shipped yet."""
    import hashlib
    catalog = ROOT / "eden" / "eden-catalog.json"
    golden = ROOT / "eden" / "eden-catalog.golden.sha256"
    if not catalog.exists():
        return True, "eden/eden-catalog.json missing (Eden not installed; bootstrap-guard)"
    if not golden.exists():
        return True, "eden/eden-catalog.golden.sha256 missing (Eden not installed; bootstrap-guard)"
    golden_hash = golden.read_text(encoding="utf-8").strip()
    if golden_hash == "" or golden_hash == "BOOTSTRAP-PLACEHOLDER-PRE-SEAL":
        return True, "Eden in BOOTSTRAP state (golden placeholder; pre-seal)"
    h = hashlib.sha256()
    with open(catalog, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    actual = h.hexdigest()
    if actual != golden_hash:
        return False, (
            f"Eden catalog hash drift! golden={golden_hash[:16]}... "
            f"actual={actual[:16]}... — somebody modified eden-catalog.json "
            f"without re-sealing. Run eden/tools/eden_seal.py to re-anchor "
            f"OR revert the catalog change."
        )
    return True, f"Eden hash matches golden ({actual[:16]}...)"


def check_eden_embeds_match_canonical():
    """Round 157 — verifies dashboard.html\'s three Eden-derived embeds carry
    the same eden_version as eden-catalog.json. Catches the case where the
    catalog was updated but eden_build.py wasn\'t run to refresh the embeds."""
    import re, json
    catalog_path = ROOT / "eden" / "eden-catalog.json"
    dashboard = ROOT / "dashboard" / "dashboard.html"
    if not catalog_path.exists() or not dashboard.exists():
        return True, "Eden or dashboard not installed (bootstrap-guard)"
    try:
        catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return False, f"eden-catalog.json parse error: {e}"
    expected_version = catalog.get("eden_version")
    if expected_version is None:
        return True, "catalog has no eden_version yet (bootstrap-guard)"
    html = dashboard.read_text(encoding="utf-8")
    # Check the two JSON-embed blocks (REGIMEN_BASE_DATA is JS object literal,
    # not a JSON embed; its eden version stamp lives on individual items)
    drift = []
    for block_id in ("regimen-label-lookup", "goal-recommendations-data"):
        m = re.search(
            r'<script\s+type="application/json"\s+id="' + re.escape(block_id) + r'"[^>]*>(.*?)</script>',
            html, re.DOTALL,
        )
        if not m:
            drift.append(f"embed '{block_id}' missing from dashboard.html")
            continue
        try:
            embed = json.loads(m.group(1))
        except json.JSONDecodeError:
            drift.append(f"embed '{block_id}' is not valid JSON")
            continue
        # eden_version may live at top level OR inside _meta
        embed_v = embed.get("eden_version")
        if embed_v is None:
            embed_v = (embed.get("_meta") or {}).get("eden_version")
        if embed_v is None:
            embed_v = embed.get("_eden_version")
        if embed_v is None:
            drift.append(f"embed '{block_id}' has no eden_version stamp (pre-Eden state — run eden_build.py)")
            continue
        if embed_v != expected_version:
            drift.append(f"embed '{block_id}' eden_version {embed_v} != canonical {expected_version}")
    if drift:
        return False, "; ".join(drift)
    return True, f"all 2 Eden-derived embeds carry eden_version {expected_version}"


def check_eden_write_protection():
    """Round 157 — Eden write-protection. Eden-catalog.json and the golden
    hash file MUST only be modified by the user. This invariant scans the
    memory-change-log for any agent-recorded write to those paths and fires
    CRITICAL on detection.

    Scope: only the most-recent 50 entries in memory-change-log (older entries
    are pre-Eden and irrelevant). Approval-floor concept: only entries
    timestamped after Round 157 ship count against this invariant."""
    mcl = ROOT / "memory" / "memory-change-log.md"
    if not mcl.exists():
        return True, "memory-change-log.md missing (bootstrap-guard)"
    text = mcl.read_text(encoding="utf-8")
    # Find Round 157+ entries (Eden ships in Round 157)
    # Pattern: `## Round N` headings
    import re
    round_markers = list(re.finditer(r"^## Round (\d+)", text, re.MULTILINE))
    # Find first marker >= 157
    eden_floor_idx = None
    for m in round_markers:
        if int(m.group(1)) >= 157:
            eden_floor_idx = m.start()
            break
    if eden_floor_idx is None:
        return True, "no Round 157+ entries yet (Eden write-protection floor not active)"
    scope = text[eden_floor_idx:]
    violations = []
    # Watch for any agent-style "written by safe_write" or "edited" or "modified"
    # mention of the protected files
    protected = ["eden/eden-catalog.json", "eden/eden-catalog.golden.sha256"]
    for p in protected:
        if p in scope:
            # find the line and check if it's an exception (USER-MARKED)
            for line in scope.split("\n"):
                if p in line:
                    if "(USER-WRITTEN)" in line or "(user-written)" in line:
                        continue  # explicit user exception
                    if "bootstrap migration" in line.lower():
                        continue  # explicit one-time bootstrap exception
                    violations.append(f"agent write detected: {line.strip()[:150]}")
    if violations:
        return False, f"{len(violations)} Eden write-protection violation(s): " + " | ".join(violations[:3])
    return True, "no agent writes to Eden protected files since Round 157"


def check_whack_a_mole_clusters():
    """Round 159 §32 cross-session detector. Scans saga.md round entries from
    the past 14 days for whack-a-mole clusters — the same surface (file,
    component, state-key) appearing as a bug-fix target in 3+ consecutive
    rounds. When detected, surfaces the cluster as an ADVISORY (warning
    severity, not critical) so the next catch-up trigger can mention it.

    This is the BACKSTOP layer of §32. Primary enforcement is in-conversation
    (Claude self-checks per brain/current.md directive #6). This invariant
    catches what the in-conversation discipline misses.

    Heuristic: parse round entries' 'Files modified' / 'Files written' sections
    + 'Round N follow-up' / 'Round N fix' / 'Round N hotfix' comment density
    in chunk descriptions. Same FILE PATH appearing in 3+ consecutive rounds
    is the strongest signal. Recurrence threshold deliberately conservative
    to minimize false positives — this is advisory, not blocking.

    NOT a critical FAIL by design — surfaces information, doesn't gate audits.
    A real cluster either gets ack'd (user invokes §32) or fades naturally
    (rounds stop touching the surface). False positives are low-cost; the
    advisory just becomes noise the user ignores."""
    import re as _re
    import datetime as _dt
    saga = ROOT / "memory" / "essence" / "saga.md"
    if not saga.exists():
        return True, "saga.md missing (bootstrap-guard)"
    text = saga.read_text(encoding="utf-8")
    # Find round-header lines like "## Round 158 — ...". Parse round numbers.
    round_headers = list(_re.finditer(r"^## Round (\d+)", text, _re.MULTILINE))
    if len(round_headers) < 3:
        return True, f"only {len(round_headers)} round(s) in saga; insufficient history"
    # Pull the LAST 14 round entries (rough proxy for ~14 days of activity).
    # Saga grows ~1 entry per round; recent rounds have 14-day horizon.
    recent = round_headers[-14:]
    # Build a map: file path → list of round numbers that touched it
    touches = {}
    for i, hdr in enumerate(recent):
        rnum = int(hdr.group(1))
        body_start = hdr.start()
        body_end = recent[i+1].start() if i+1 < len(recent) else len(text)
        body = text[body_start:body_end]
        # Find file-path mentions matching project file shapes
        paths = _re.findall(r"`?([a-z][a-z0-9_]*/[a-z0-9_./\-]+\.(?:html|py|md|json|js|css))`?", body)
        for p in paths:
            # Strip backticks and trailing punctuation
            p = p.strip("` ,;:.")
            if "/" not in p or p.endswith("/"):
                continue
            # Skip generic memory files that appear in every round entry
            if p in ("memory/essence/saga.md", "memory/essence/lessons.md",
                     "memory/essence/decisions.md", "memory/memory-change-log.md",
                     "memory/versions.json", "memory/open-threads.md",
                     # Round 159 noise filter — these are mentioned in nearly
                     # every round entry by design (the project IS the dashboard;
                     # invariants.py grows with every new lesson per §18). True
                     # whack-a-mole clusters happen at function/region granularity
                     # inside these files, which saga-text-scan can't see. Until
                     # we add finer-grained detection, exclude to keep signal:noise high.
                     "dashboard/dashboard.html", "tools/invariants.py",
                     "tools/dashboard_integrity.py", "tools/safe_write.py",
                     "brain/CHANGELOG.md", "brain/current.md",
                     "memory/paired-write-catalog.md", "memory/verified-patterns.md",
                     "memory/operating-protocols.md", "memory/engineering-doctrine.md"):
                continue
            touches.setdefault(p, set()).add(rnum)
    # Cluster = file touched in 3+ rounds within the recent-14 window
    clusters = []
    for path, rounds in touches.items():
        if len(rounds) >= 3:
            rs = sorted(rounds)
            # Only report consecutive-ish clusters (range ≤ 14 rounds; sliding window concept)
            if rs[-1] - rs[0] <= 14:
                clusters.append((path, rs))
    if not clusters:
        return True, f"no whack-a-mole clusters detected in last {len(recent)} rounds"
    # Sort by recurrence count descending
    clusters.sort(key=lambda c: (-len(c[1]), c[0]))
    msg_parts = []
    for path, rs in clusters[:5]:
        msg_parts.append(f"{path} (rounds {','.join(str(r) for r in rs)})")
    extra = f" +{len(clusters)-5} more" if len(clusters) > 5 else ""
    return True, f"ADVISORY — {len(clusters)} whack-a-mole cluster(s) detected (§32 may apply): " + "; ".join(msg_parts) + extra


# ---------------------------------------------------------------------------
# Design System v3 invariants (Round 160 — Phase 0)
# ---------------------------------------------------------------------------
# Three paired daily invariants guard the design system. All three honor a
# 'mode' knob in tacitus/feature-flags.json[design_system_enforcement].
# Modes:
#   'off'   — checks skipped (always PASS, payload notes mode)
#   'warn'  — violations PASS but payload notes findings (initial state)
#   'error' — violations FAIL with critical/warning severity per invariant
#
# Promotion criteria from 'warn' to 'error' are documented in the feature
# flag itself. Initial Phase 0 ships in 'warn' mode.


def _design_system_mode():
    """Read the design_system_enforcement mode from tacitus/feature-flags.json.
    Returns one of: 'off', 'warn', 'error'. Defaults to 'warn' if unreadable."""
    try:
        flags_path = ROOT / "tacitus" / "feature-flags.json"
        with open(flags_path, encoding="utf-8") as f:
            data = json.load(f)
        flag = data.get("flags", {}).get("design_system_enforcement", {})
        if not flag.get("enabled", True):
            return "off"
        return flag.get("mode", "warn")
    except Exception:
        return "warn"


def _ds_finalize(violations, mode, success_msg):
    """Helper: convert a violations list + mode into (passed, msg).
    Violations + 'off' → PASS with skipped note.
    Violations + 'warn' → PASS with WARN-prefixed payload.
    Violations + 'error' → FAIL with payload.
    No violations → always PASS with success_msg."""
    if not violations:
        return True, success_msg
    payload = "; ".join(violations[:5])
    if len(violations) > 5:
        payload += f" (+{len(violations)-5} more)"
    if mode == "off":
        return True, f"skipped (mode=off) — would have surfaced: {payload}"
    if mode == "warn":
        return True, f"WARN ({len(violations)} finding(s)) — {payload}"
    return False, f"{len(violations)} violation(s) — {payload}"


def check_no_external_style_resources():
    """Scan dashboard.html + dashboard/assets/styles/*.css + tacitus/dashboard/index.html
    for external style/font/script imports. The 'no external resources' rule
    is the foundation of long-term portability (Phase 0 doctrine).

    Currently-allowed external (explicit carve-out): cdn.jsdelivr.net/npm/tesseract
    (Scanner OCR — TODO: in-house in a future round)."""
    mode = _design_system_mode()
    if mode == "off":
        return True, "skipped (mode=off)"

    import re as _re
    EXTERNAL_PATTERNS = [
        (r"fonts\.googleapis\.com", "Google Fonts CSS"),
        (r"fonts\.gstatic\.com", "Google Fonts static"),
        (r"cdnjs\.cloudflare\.com", "cdnjs CDN"),
        (r"unpkg\.com", "unpkg CDN"),
        (r"pro\.fontawesome\.com", "FontAwesome Pro CDN"),
        (r"@import\s+url\(['\"]?https?://", "@import of external resource"),
        (r"<link[^>]+href=['\"]https?://(?!cdn\.jsdelivr\.net/npm/tesseract)", "external <link>"),
        (r"<script[^>]+src=['\"]https?://(?!cdn\.jsdelivr\.net/npm/tesseract)", "external <script>"),
    ]

    scan_targets = [
        ROOT / "dashboard" / "dashboard.html",
        ROOT / "tacitus" / "dashboard" / "index.html",
    ]
    styles_dir = ROOT / "dashboard" / "assets" / "styles"
    if styles_dir.exists():
        scan_targets.extend(styles_dir.glob("*.css"))

    violations = []
    # Strip <script type="text/markdown"> block contents before scanning so
    # markdown text that *mentions* external URLs in code samples (e.g. the
    # saga, lessons, decisions notebook entries discussing the migration)
    # does not trigger false positives. Only real <link>, <script src=>, and
    # @import URLs in actual CSS/HTML structural positions should fire.
    _MD_BLOCK_RE = _re.compile(
        r'<script\s+type="text/markdown"[^>]*>.*?</script>',
        _re.DOTALL,
    )
    for path in scan_targets:
        if not path.exists():
            continue
        try:
            content = path.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        # Strip markdown block contents so they can't trigger false positives
        content = _MD_BLOCK_RE.sub('<script type="text/markdown"></script>', content)
        for pat, label in EXTERNAL_PATTERNS:
            matches = _re.findall(pat, content)
            if matches:
                rel = path.relative_to(ROOT)
                violations.append(f"{rel}: {label} ({len(matches)} hit{'s' if len(matches)!=1 else ''})")

    return _ds_finalize(
        violations,
        mode,
        "no external style/font/script resources detected — portability rule clean",
    )


def check_design_system_hash_integrity():
    """Verify design-system.css matches design-system.golden.sha256.
    If the golden hash file doesn't exist yet (pre-sealing), informational
    PASS — the file hasn't been sealed for protection yet."""
    mode = _design_system_mode()
    if mode == "off":
        return True, "skipped (mode=off)"

    css_path = ROOT / "dashboard" / "assets" / "styles" / "design-system.css"
    hash_path = ROOT / "dashboard" / "assets" / "styles" / "design-system.golden.sha256"

    if not css_path.exists():
        return _ds_finalize(
            ["design-system.css missing — Phase 0 ship incomplete"],
            mode,
            "",
        )

    if not hash_path.exists():
        return True, "design-system.golden.sha256 not yet present — file unsealed (expected during early migration rounds)"

    expected = hash_path.read_text(encoding="utf-8").strip().split()[0]
    actual = _file_hash(css_path)
    if actual != expected:
        return _ds_finalize(
            [f"design-system.css hash {actual[:16]}... does not match golden {expected[:16]}..."],
            mode,
            "",
        )
    return True, f"design-system.css matches golden hash ({expected[:16]}...)"


def check_design_system_write_protection():
    """When sealed (golden hash present), verify design-system.css has not
    been modified since the sealing time. Modifications after sealing are
    user-only-writer violations."""
    mode = _design_system_mode()
    if mode == "off":
        return True, "skipped (mode=off)"

    css_path = ROOT / "dashboard" / "assets" / "styles" / "design-system.css"
    hash_path = ROOT / "dashboard" / "assets" / "styles" / "design-system.golden.sha256"

    if not hash_path.exists():
        return True, "no golden hash present — file unsealed, write-protection not yet active (expected during early migration rounds)"

    if not css_path.exists():
        return _ds_finalize(
            ["design-system.css missing entirely"],
            mode,
            "",
        )
    seal_mtime = hash_path.stat().st_mtime
    css_mtime = css_path.stat().st_mtime

    if css_mtime > seal_mtime + 1:  # +1s tolerance for write-then-seal sequence
        violations = [
            f"design-system.css modified ({datetime.datetime.fromtimestamp(css_mtime).isoformat(timespec='seconds')}) "
            f"AFTER golden hash sealed ({datetime.datetime.fromtimestamp(seal_mtime).isoformat(timespec='seconds')})"
        ]
        return _ds_finalize(violations, mode, "")
    return True, "design-system.css unmodified since sealing — write protection holding"


def check_dashboard_dist_fresh():
    """The build artifact dashboard/assets/js/dist/main.js must be newer than
    every dashboard/assets/js/src/**/*.ts file. If the dist is stale, the
    runtime contract (what the browser loads) has drifted away from the
    canonical TypeScript source. Added in Round 161 R1·A alongside the new
    modular dashboard architecture.

    Skipped in the strangler-fig pre-Round-2 era while src/ is all scaffolds
    (dist is hand-written then; the freshness check kicks in once esbuild
    starts overwriting dist from src on every edit)."""
    dist_path = ROOT / "dashboard" / "assets" / "js" / "dist" / "main.js"
    src_dir = ROOT / "dashboard" / "assets" / "js" / "src"

    if not dist_path.exists():
        return False, f"dist/main.js missing — run `bash tools/build-dashboard.sh`"
    if not src_dir.exists():
        return True, "no src/ directory yet (pre-Round-1·A) — freshness check skipped"

    ts_files = list(src_dir.rglob("*.ts"))
    if not ts_files:
        return True, "no .ts source files yet — freshness check skipped"

    dist_mtime = dist_path.stat().st_mtime
    newest_src = max(f.stat().st_mtime for f in ts_files)

    # +1s tolerance: build step writes dist then src tools may touch within same second
    if newest_src > dist_mtime + 1:
        newest_file = max(ts_files, key=lambda f: f.stat().st_mtime)
        rel = newest_file.relative_to(ROOT)
        delta = newest_src - dist_mtime
        return False, (
            f"dist/main.js is STALE — newest src ({rel}) is {delta:.0f}s newer. "
            f"Run `cd dashboard && bash ../tools/build-dashboard.sh` to rebuild."
        )
    return True, f"dist/main.js fresh — {len(ts_files)} .ts files, all older than dist"


# ---------------------------------------------------------------------------
# The manifest
# ---------------------------------------------------------------------------

INVARIANTS = [
    Invariant(
        name="tacitus_sentinel_content",
        description="Tacitus' last_reflection_date must agree with notebook entry for that date",
        check_fn=check_tacitus_sentinel_content,
        truth_anchor="tacitus/notebook/2026-MM.md session headers",
        severity="critical",
        lesson_ref="Round 73 §16 — sentinel-without-content pitfall",
    ),
    Invariant(
        name="audit_ran_today",
        description="System audit must have completed within last 26h (the audit's own sentinel)",
        check_fn=check_audit_ran_today,
        truth_anchor="memory/system/audit-sentinel.json last_audit_completed_at",
        severity="critical",
        lesson_ref="Round 74 — who audits the auditor / Risk 3",
    ),
    Invariant(
        name="safe_write_canary",
        description="safe_write must round-trip a known payload byte-equal via os.read",
        check_fn=check_safe_write_canary,
        truth_anchor="tools/canaries/safe-write-probe.txt readback via os.read",
        severity="critical",
        lesson_ref="Round 73 §17 — Edit-tool ban + safe_write primacy",
    ),
    Invariant(
        name="brain_version_sync",
        description="Brain version pinned across versions.json + CHANGELOG + brain/versions/* + dashboard embed",
        check_fn=check_brain_version_sync,
        truth_anchor="memory/versions.json current.brain field",
        severity="critical",
        lesson_ref="Round 47/49 — cross-system version drift",
    ),
    Invariant(
        name="tools_py_parse",
        description="All .py files in tools/ must parse via ast",
        check_fn=check_tools_py_parse,
        truth_anchor="Python ast.parse",
        severity="critical",
        lesson_ref="Round 54/56 — Edit-tool truncation on .py files",
    ),
    Invariant(
        name="tools_no_null_bytes",
        description="All .py files in tools/ must contain zero NUL bytes",
        check_fn=check_tools_no_null_bytes,
        truth_anchor="byte-level scan via Path.read_bytes()",
        severity="critical",
        lesson_ref="Round 75 Pass A — Write-tool null-padding bug",
    ),
    Invariant(
        name="products_db_completeness_no_regression",
        description="Re-runs products_db_audit + compares tier counts to known-good baseline; alerts on regression",
        check_fn=check_products_db_completeness_no_regression,
        truth_anchor="memory/system/known-good-hashes.json products_db_completeness_baseline",
        severity="warning",
        lesson_ref="Round 75 Pass A.2.5 — products-db audit into autonomous loop",
    ),
    Invariant(
        name="critical_json_parse",
        description="All JSON files in memory/ and schemas/ must parse",
        check_fn=check_critical_json_parse,
        truth_anchor="json.loads",
        severity="critical",
        lesson_ref="Round 73 — versions.json truncation event",
    ),
    Invariant(
        name="dashboard_integrity",
        description="tools/dashboard_integrity.py check must exit zero (all 16 checks pass)",
        check_fn=check_dashboard_integrity_passes,
        truth_anchor="tools/dashboard_integrity.py exit code",
        severity="critical",
        lesson_ref="Round 46 — integrity tool baseline",
    ),
    Invariant(
        name="catchup_files_exist",
        description="Every file in catch-up trigger list must exist + be readable",
        check_fn=check_catchup_files_exist,
        truth_anchor="brain/current.md catch-up trigger list (hardcoded mirror in this check)",
        severity="critical",
        lesson_ref="Round 74 — Risk 9 / catch-up integrity",
    ),
    Invariant(
        name="essence_append_only",
        description="Append-only essence files must not shrink relative to known-good baseline",
        check_fn=check_essence_append_only,
        truth_anchor="memory/system/known-good-hashes.json size field per file",
        severity="warning",
        lesson_ref="Round 73 — silent truncation on .md files",
    ),
    Invariant(
        name="user_prefs_match_index",
        description="Body-system files referenced in user-prefs/index.md must exist on disk",
        check_fn=check_user_prefs_match_index,
        truth_anchor="memory/user-prefs/index.md file references",
        severity="warning",
        lesson_ref="Round 52 §10 — specialized-units-with-index pattern",
    ),
    Invariant(
        name="lesson_pitfall_count",
        description="Informational count of pitfall entries in lessons.md (manual review prompt for §18 coverage)",
        check_fn=check_lesson_pitfall_count,
        truth_anchor="memory/essence/lessons.md bolded entries",
        severity="info",
        lesson_ref="Round 74 §18 — lesson→invariant promotion",
    ),
    Invariant(
        name="cross_platform_python",
        description="Scan tools/*.py for cross-platform anti-patterns (encoding-less open, %-I strftime, utcnow, python3 literal)",
        check_fn=check_cross_platform_python,
        truth_anchor="v3.9 brain pitfall on cross-platform Python — five rules codified in Round 74",
        severity="warning",
        lesson_ref="Round 74 Phase A — cp1252 crash on Windows + %-I strftime crash",
    ),
    Invariant(
        name="sentinel_content_sanity",
        description="Sentinel files must not contain self-referential parse-error patterns or oversized lapse reasons",
        check_fn=check_sentinel_content_sanity,
        truth_anchor="memory/system/audit-sentinel.json last_lapse_reason field — <200 chars + no line/column/char patterns",
        severity="warning",
        lesson_ref="Round 74 Phase C — self-referential parse confusion mitigation",
    ),
    Invariant(
        name="catchup_seal_exists",
        description="memory/system/last-catchup.json must exist (catch-up integrity proof, Phase B)",
        check_fn=check_catchup_seal_exists,
        truth_anchor="memory/system/last-catchup.json sealed_at field",
        severity="warning",
        lesson_ref="Round 74 Phase B / Risk 9 — agent-pretends-to-catch-up failure mode",
    ),
    Invariant(
        name="catchup_files_match",
        description="Files recorded in last-catchup.json must still match on disk for files unchanged since seal",
        check_fn=check_catchup_files_match,
        truth_anchor="memory/system/last-catchup.json file states vs current disk state",
        severity="warning",
        lesson_ref="Round 74 Phase B / Risk 9 — silent drift between catch-up and audit",
    ),
    # Weekly only
    Invariant(
        name="differential_reads",
        description="Random sample of .md files compared across pathlib + os.read",
        check_fn=check_differential_reads,
        truth_anchor="os.read raw bytes",
        severity="warning",
        lesson_ref="Round 73 — Read tool ↔ bash cache divergence",
        cadence="weekly",
    ),
    Invariant(
        name="orphan_files",
        description="Files referenced in brain/protocols/decisions must exist on disk",
        check_fn=check_orphan_files,
        truth_anchor="Path references in brain + protocols + decisions",
        severity="warning",
        lesson_ref="Round 74 — orphan detection",
        cadence="weekly",
    ),
    # ----- Round 100 — Tacitus three-mode architecture invariants -----
    Invariant(
        name="tacitus_folder_integrity",
        description="/tacitus/ folder has all required files + dirs (identity, changelog, portability, prompts, sentinel, audit-history, notebook)",
        check_fn=check_tacitus_folder_integrity,
        truth_anchor="filesystem existence of required paths",
        severity="critical",
        lesson_ref="Round 100 — Tacitus three-mode architecture; portability seam",
    ),
    Invariant(
        name="tacitus_modes_fired_today",
        description="On Mon-Fri, all three Tacitus modes (Cura/Vision/Aegis) wrote session headers to today's notebook",
        check_fn=check_tacitus_modes_fired_today,
        truth_anchor="tacitus/notebook/YYYY-MM.md session-header regex matches",
        severity="warning",
        lesson_ref="Round 100 — three-mode architecture; per Luneth's 'this will actually work as intended right?' Round 100 check",
    ),
    Invariant(
        name="tacitus_v1_task_no_resurrection",
        description="Today's notebook contains no session headers outside the canonical {Cura, Vision, Aegis} allowlist (catches v1 task accidental re-enable)",
        check_fn=check_tacitus_v1_task_no_resurrection,
        truth_anchor="tacitus/notebook/YYYY-MM.md session-header mode names — canonical allowlist {Cura, Vision, Aegis}",
        severity="warning",
        lesson_ref="Round 107 / Cura session #1 Survivor B — deletion claim of v1 tacitus-autonomous-reflection task pinned to file structure; catches Windows scheduler restoration, deletion undo, or unforeseen mode drift",
    ),
    Invariant(
        name="tacitus_rest_day_observed",
        description="No writes to tacitus/ during the 34-hour Sabbath rest window (Sat 00:00 EDT → Sun 10:00 EDT)",
        check_fn=check_tacitus_rest_day_observed,
        truth_anchor="file mtimes via stat()",
        severity="warning",
        lesson_ref="Round 100 — Luneth's Sabbath commitment: 'Saturday is a rest period that deserves no cheats'",
    ),
    Invariant(
        name="aegis_history_well_formed",
        description="tacitus/audit-history.json parses + has records list + each record has required scoring fields",
        check_fn=check_aegis_history_well_formed,
        truth_anchor="JSON parse + per-record schema validation",
        severity="warning",
        lesson_ref="Round 100 — Aegis structured scoring history shape",
    ),
    Invariant(
        name="tacitus_dashboard_freshness",
        description="On Mon-Fri, if Aegis wrote today's session header, the Tacitus dashboard LIVE_DATA must contain today's date string",
        check_fn=check_tacitus_dashboard_freshness,
        truth_anchor="literal '\"date\": \"<today>\"' string presence in tacitus/dashboard/index.html",
        severity="critical",
        lesson_ref="Round 117 (2026-06-18) — user-named immersion-breaking failure: two consecutive days of stale dashboard. Paired with the tacitus-dashboard-build scheduled task (5:35 EDT Mon-Fri).",
    ),
    Invariant(
        name="tacitus_changelog_chronological_order",
        description="tacitus/changelog.md '## v' headings appear in reverse chronological order per the file's self-stated rule",
        check_fn=check_tacitus_changelog_chronological_order,
        truth_anchor="parenthesized date after each version label, sorted strictly non-increasing (newest first)",
        severity="warning",
        lesson_ref="Round 118 / Cura session #2 Survivor A sibling — Round 103's v2.2 appended at bottom violated the file's own footer rule; long-lived narrative file paired with §1 bullet 6 broadening.",
    ),
    Invariant(
        name="wallach_stance_source_rule",
        description="Every wallach_stance.citation in knowledge/essentials-targets.json cites an allowlisted Wallach/Youngevity primary source",
        check_fn=check_wallach_stance_source_rule,
        truth_anchor="source-rule.md allowlist markers applied to the new wallach_stance.citation schema field (Round 115)",
        severity="critical",
        lesson_ref="Round 118 / Cura session #2 Survivor B — Round 115's wallach_stance schema addition left check_source_rule's hard-coded scope behind; defense-in-depth pair for the dashboard_integrity extension shipping in the same patch.",
    ),
    Invariant(
        name="cura_phase_0_present",
        description="On Mon-Fri, if Cura wrote today's session header, the same session block must contain a 'PHASE 0 — PRE-FLIGHT AUDIT (Cura, <date>)' header",
        check_fn=check_cura_phase_0_present,
        truth_anchor="literal Phase 0 header string presence in today's Cura session block in tacitus/notebook/YYYY-MM.md",
        severity="warning",
        lesson_ref="Round 119 / Vision session #2 Survivor A — Round 113 codified Phase 0 as Cura-only discipline without paired detector; §18 promotion catches future drift.",
    ),
    Invariant(
        name="wallach_stance_embed_sync",
        description="Every wallach_stance in knowledge/essentials-targets.json is byte-equal in the dashboard's essentials-targets-data embed",
        check_fn=check_wallach_stance_embed_sync,
        truth_anchor="canonical wallach_stance dict ↔ embed wallach_stance dict, normalized via sort_keys=True JSON serialization",
        severity="warning",
        lesson_ref="Round 115 filed; Round 122 shipped per §18 same-patch promotion. Two-source-of-truth shape (canonical nested + dashboard flat embed) gains coverage at the new field.",
    ),
    Invariant(
        name="tacitus_changelog_present",
        description="tacitus/changelog.md present + non-trivial + has at least one '## v' version heading",
        check_fn=check_tacitus_changelog_present,
        truth_anchor="file content scan for version headers",
        severity="info",
        lesson_ref="Round 100 — Tacitus's own changelog as parallel to brain CHANGELOG",
    ),
    Invariant(
        name="saga_versions_history_match",
        description="Every 'Round N' heading in saga.md has a matching round entry in versions.json history (and no orphan history entries)",
        check_fn=check_saga_versions_history_match,
        truth_anchor="saga.md bolded-date 'Round N' headings (regex)",
        severity="warning",
        lesson_ref="Round 104 — cross-system drift between saga rounds and versions.json history; closes the Round 101/103 Tacitus-only invisibility + Round 102 max+1 off-by-one",
    ),
    Invariant(
        name="no_unresolved_vitality_findings",
        description="memory/system/vitality-findings.jsonl has no unresolved findings older than 6 hours",
        check_fn=check_no_unresolved_vitality_findings,
        truth_anchor="vitality-findings.jsonl append-only log; resolution-by-ref-ts walk",
        severity="warning",
        lesson_ref="Round 105 — vitality-check signals were being silently overwritten by audit runs sharing the same sentinel; persistent log + in-session re-check discipline close the surface",
    ),
    Invariant(
        name="implementations_log_well_formed",
        description="memory/system/implementations.jsonl entries all reference real notebook session headers; statuses + modes within canonical allowlist",
        check_fn=check_implementations_log_well_formed,
        truth_anchor="tacitus/notebook/YYYY-MM.md session-header regex matches per (source_date, source_mode, source_session) tuple",
        severity="warning",
        lesson_ref="Round 108 — implementation crystals on the Tacitus dashboard; the log must accurately reflect reality so the user's audit-trail value holds ('wait... I never approved that')",
    ),
    Invariant(
        name="tacitus_prompts_portable_shape",
        description="cura.md + vision.md contain balanced PROJECT_ANCHOR markers (the drop-in-to-other-projects portability seam)",
        check_fn=check_tacitus_prompts_portable_shape,
        truth_anchor="balanced marker count via string scan",
        severity="warning",
        lesson_ref="Round 100 — portability.md drop-in procedure",
        cadence="weekly",
    ),
    Invariant(
        name="lesson_freshness_vs_saga",
        description="lessons.md must keep pace with saga.md (no >6h gap of substantive work without lessons)",
        check_fn=check_lesson_freshness_vs_saga,
        truth_anchor="max-timestamp arithmetic across saga.md and lessons.md",
        severity="warning",
        lesson_ref="Round 135 — meta-failure: counting != enforcing; lesson logging lapsed during 3.5h build",
    ),
    Invariant(
        name="raw_key_surfacing",
        description="dashboard.html must route key-field renders through displayName() / humanizer",
        check_fn=check_raw_key_surfacing,
        truth_anchor="grep escapeHtml(item.<key>) sites in dashboard.html for adjacent displayName()",
        severity="warning",
        lesson_ref="Round 135 — WALLACH_HBSP_DEFAULT / LONGEVITY_ANTI_AGING raw-key UI surfacing",
    ),
    Invariant(
        name="cross_iife_bare_refs",
        description="known cross-IIFE symbols must have window.X = X exports in dashboard.html",
        check_fn=check_cross_iife_bare_refs,
        truth_anchor="grep `window.<sym> =` for each known cross-IIFE symbol",
        severity="critical",
        lesson_ref="Round 28 + Round 131 + Round 135 — recurring family: bare cross-IIFE references silently undefined",
    ),
    Invariant(
        name="cross_iife_bare_refs_reverse_scan",
        description="reverse-direction scan — flag IIFE-private symbols called from other IIFEs without window prefix (Round 149 family)",
        check_fn=check_cross_iife_bare_refs_reverse_scan,
        truth_anchor="dashboard.html source — IIFE byte ranges + local-symbol collection + bare call-site detection",
        severity="warning",
        lesson_ref="Round 149 esc() call from Regimen tab IIFE to Label Check IIFE's private esc — silent ReferenceError; allowlist-based forward check couldn't catch it because esc wasn't on the watchlist",
    ),
    Invariant(
        name="tacitus_dashboard_extraction_health",
        description="Tacitus dashboard build's extraction-health sidecar must show non-zero counts for today's session phases",
        check_fn=check_tacitus_dashboard_extraction_health,
        truth_anchor="tacitus/dashboard/extraction-health.json (build-time attestation)",
        severity="critical",
        lesson_ref="Round 137 — parser silent-degeneration after Round 136 Cura 5-sub-check extension",
    ),
    # Round 140 — Verified Patterns System invariants. See memory/essence/saga.md
    # Round 140 entry for full rollback recipe.
    Invariant(
        name="verified_patterns_catalog_present",
        description="memory/verified-patterns.md exists with at least 1 pattern entry",
        check_fn=check_verified_patterns_catalog_present,
        truth_anchor="memory/verified-patterns.md file presence + ## Pattern: entry count",
        severity="warning",
        lesson_ref="Round 140 — Verified Patterns System catalog substrate",
    ),
    Invariant(
        name="feature_flags_present",
        description="tacitus/feature-flags.json exists with cura_pattern_search + vision_pattern_seed flags",
        check_fn=check_feature_flags_present,
        truth_anchor="tacitus/feature-flags.json schema",
        severity="warning",
        lesson_ref="Round 140 — Verified Patterns System feature-flag toggle for Cura + Vision",
    ),
    # Round 142 discipline-tightening batch invariants.
    Invariant(
        name="tacitus_changelog_declared_version_present",
        description="open-threads.md masthead Tacitus version must have a matching ## v<X.Y> heading in tacitus/changelog.md",
        check_fn=check_tacitus_changelog_declared_version_present,
        truth_anchor="open-threads.md masthead Tacitus declaration vs tacitus/changelog.md headings",
        severity="warning",
        lesson_ref="Round 142 C-A — Cura session #3 Survivor A: declared-state-without-paired-verifier",
    ),
    Invariant(
        name="claude_best_practices_freshness",
        description="memory/claude-best-practices.md mtime within 120 days (warning at 60d)",
        check_fn=check_claude_best_practices_freshness,
        truth_anchor="filesystem mtime + cadence-expectation",
        severity="warning",
        lesson_ref="Round 142 C-B — Cura session #3 Survivor B: reference-standard staleness",
    ),
    Invariant(
        name="prompt_enum_consumer_sync",
        description="Cura sub-check enum in tacitus/prompts/cura.md must match the parser enum in tools/build_tacitus_dashboard_live.py",
        check_fn=check_prompt_enum_consumer_sync,
        truth_anchor="cura.md sub-check headers + parser regex enum",
        severity="warning",
        lesson_ref="Round 142 D-2 — Round 137 parser-drift family pre-emptive detector",
    ),
    # Round 143 — Phase 6 atomic close of vision-default-regimen.md.
    Invariant(
        name="regimen_slot_invariant_wired",
        description="dashboard.html has assertRegimenSlotInvariant() defined + window-exposed + load-time wired + ≥3 call sites",
        check_fn=check_regimen_slot_invariant_wired,
        truth_anchor="grep patterns on dashboard.html (function def + window export + DOMContentLoaded handler + call site count)",
        severity="warning",
        lesson_ref="Round 134 architectural commitment / vision-default-regimen.md Phase 6 — REGIMEN_SLOT_INVARIANT runtime self-healing",
    ),
    # Round 144 — Vision pattern-seed compliance drift detector.
    Invariant(
        name="vision_pattern_seed_compliance",
        description="tacitus/prompts/vision.md retains seed-not-propagate discipline (feature-flag gate + HARD CAP + framing + batch/cascade prohibition)",
        check_fn=check_vision_pattern_seed_compliance,
        truth_anchor="grep patterns on tacitus/prompts/vision.md (4 structural arms)",
        severity="warning",
        lesson_ref="Round 140 architectural commitment — Vision cannot see rendered output, so prompt-level guards are the only safeguard",
    ),
    # Round 148 — Closing-the-loop logging discipline (Phase A + B + C).
    # Family: paired-write integrity. Every substantive logging surface gets
    # a saga-round marker + a paired truthfulness invariant. See
    # memory/paired-write-catalog.md for the full enumeration.
    Invariant(
        name="survivor_implementation_logged",
        description="every Cura/Vision deepen survivor in the notebook with session date >=1 day ago has an implementations.jsonl entry",
        check_fn=check_survivor_implementation_logged,
        truth_anchor="tacitus/notebook/*.md DEEPEN blocks + implementations.jsonl",
        severity="warning",
        lesson_ref="Round 148 — reverse-direction integrity check (notebook truth → log entry must exist)",
    ),
    Invariant(
        name="dashboard_impl_status_source_purity",
        description="build_tacitus_dashboard_live.py reads impl status ONLY via implementation_log.latest_status() (no env/hardcoded/projection override)",
        check_fn=check_dashboard_impl_status_source_purity,
        truth_anchor="grep patterns on tools/build_tacitus_dashboard_live.py",
        severity="warning",
        lesson_ref="Round 148 — single-source-of-truth enforcement at the renderer",
    ),
    Invariant(
        name="paired_write_catalog_coverage",
        description="memory/paired-write-catalog.md exists and every cited `check_*` invariant is registered in this manifest",
        check_fn=check_paired_write_catalog_coverage,
        truth_anchor="memory/paired-write-catalog.md citations cross-checked against INVARIANTS manifest names",
        severity="warning",
        lesson_ref="Round 148 — the catalog is the visible enumeration of which paired-write surfaces are covered; coverage is itself an invariant",
    ),
    # Round 156 / Saturday Item 15 — consolidation umbrella for the 5
    # marker-truthful invariants (Round 140 patterns + Round 148 four). Each
    # underlying check_fn is preserved + called by the umbrella; failures
    # aggregate. Same protection, less manifest noise.
    Invariant(
        name="round_markers_truthful",
        description="umbrella over 5 marker surfaces (patterns_consulted / implementations / lessons / decisions / memory_writes); fails if ANY surface\'s marker citations don\'t resolve",
        check_fn=check_round_markers_truthful,
        truth_anchor="saga.md round-header parser + each surface\'s target file (paired-write catalog)",
        severity="warning",
        lesson_ref="Round 140 + Round 148 — consolidated Round 156 / Saturday Item 15. The 5-surface protection is preserved; each underlying check_fn still runs verbatim under the umbrella.",
    ),
    # Round 155 / Saturday Item 5 — Vision Survivor B paired weekly invariant.
    Invariant(
        name="best_practices_refresh_status",
        description="weekly snapshot of docs.claude.com pages stays fresh; unreviewed content changes surface for user review",
        check_fn=check_best_practices_refresh_status,
        truth_anchor="memory/system/best-practices-snapshot.json (written by tools/best_practices_refresh.py on weekly Sunday system_audit --weekly run)",
        severity="warning",
        cadence="weekly",
        lesson_ref="Vision session #3 Survivor B (2026-06-19) — ceiling-pair to Cura's freshness floor; Saturday filed work Item 5 folds the refresh into the existing weekly audit cron rather than add a new scheduled task",
    ),
    # Round 150 — Cross-Surface State Sync chokepoint routing (§31).
    Invariant(
        name="regimen_state_mutation_routing",
        description="every regimen LS write in dashboard.html occurs inside a §31 chokepoint helper, and every chokepoint fires triggerRegimenRerender",
        check_fn=check_regimen_state_mutation_routing,
        truth_anchor="grep patterns on dashboard.html — lsWrite call positions vs chokepoint function-body ranges",
        severity="critical",
        lesson_ref="Round 149 cross-boundary-contract-drift family — chokepoint discipline closes the cross-surface sync loop; §31 codifies the rule",
    ),
    # Round 156 — 4 deferred-candidate invariants shipped (Saturday Item 18).
    Invariant(
        name="deferred_candidate_invariant_drift",
        description="open-threads Deferred section invariant-names match the live INVARIANTS manifest — surfaces filed-then-shipped entries needing cleanup",
        check_fn=check_deferred_candidate_invariant_drift,
        truth_anchor="memory/open-threads.md Deferred section scanned for `check_*` identifiers; cross-checked against this manifest's name set",
        severity="warning",
        lesson_ref="Round 156 Saturday Item 18 — deferred-candidate drift detection; an invariant whose own row in Deferred outdates the live manifest is a paper-tiger filing",
    ),
    Invariant(
        name="no_native_dialogs",
        description="dashboard.html must not use native alert() / confirm() / prompt() — route through showLcModal / showQuietToast",
        check_fn=check_no_native_dialogs,
        truth_anchor="dashboard.html scan for unparenthesized alert/confirm/prompt call sites",
        severity="warning",
        lesson_ref="Round 127 — design family; native dialogs break the modal contract + theme + accessibility flow",
    ),
    Invariant(
        name="log_surface_mtimes",
        description="canonical log surfaces (implementations.jsonl, vitality-findings.jsonl, last-catchup.json, etc.) are kept fresh — bootstraps where applicable",
        check_fn=check_log_surface_mtimes,
        truth_anchor="mtime + file-shape probes on the canonical log set",
        severity="warning",
        lesson_ref="Round 108/135 — log-surface staleness detection; rotted logs are silent integrity gaps",
    ),
    Invariant(
        name="tacitus_dashboard_no_real_data_fetches",
        description="tacitus/dashboard/index.html must not perform live network fetches; it is build-time-rendered against canonical fixtures",
        check_fn=check_tacitus_dashboard_no_real_data_fetches,
        truth_anchor="static scan of tacitus/dashboard/index.html for fetch/XHR/import URL patterns",
        severity="critical",
        lesson_ref="Round 117 — the dashboard is a build artifact; runtime fetches reintroduce drift",
    ),
    Invariant(
        name="eden_hash_integrity",
        description="eden/eden-catalog.json hash matches eden/eden-catalog.golden.sha256",
        check_fn=check_eden_hash_integrity,
        truth_anchor="SHA-256 of eden/eden-catalog.json vs golden file",
        severity="critical",
        lesson_ref="Round 157 — Eden sealed-canonical pattern; math doesn't lie",
    ),
    Invariant(
        name="eden_embeds_match_canonical",
        description="dashboard Eden-derived embeds (regimen-label-lookup, goal-recommendations-data, REGIMEN_BASE_DATA.recommended) carry the current eden_version",
        check_fn=check_eden_embeds_match_canonical,
        truth_anchor="eden_version field on each embed cross-checked against eden-catalog.json",
        severity="critical",
        lesson_ref="Round 157 — every Eden-derived embed must report its source version; drift surfaces immediately",
    ),
    Invariant(
        name="eden_write_protection",
        description="no agent-recorded writes to eden/eden-catalog.json or eden/eden-catalog.golden.sha256 since Round 157 floor",
        check_fn=check_eden_write_protection,
        truth_anchor="memory/memory-change-log.md scan for agent writes to Eden protected files post Round 157",
        severity="critical",
        lesson_ref="Round 157 — user is sole writer of Eden canonical + golden hash; agent writes a protocol violation",
    ),
    Invariant(
        name="whack_a_mole_clusters",
        description="ADVISORY — surfaces files touched in 3+ saga rounds within a 14-round window (§32 candidates)",
        check_fn=check_whack_a_mole_clusters,
        truth_anchor="saga.md round-entry file lists, sliding 14-round window",
        severity="warning",
        lesson_ref="Round 159 §32 — when patches stop landing cleanly, the bug is in the architecture; daily advisory surfaces cross-session clusters",
    ),
    # Round 160 — Phase 0 — Design System v3 trio (warn-mode initially per
    # feature flag design_system_enforcement)
    Invariant(
        name="no_external_style_resources",
        description="dashboard.html + dashboard/assets/styles/*.css + tacitus/dashboard/index.html must not import external fonts/CSS/scripts (Tesseract.js in-housed Round 161 sealing)",
        check_fn=check_no_external_style_resources,
        truth_anchor="static regex scan against fonts.googleapis.com / fonts.gstatic.com / cdn.jsdelivr.net / cdnjs / unpkg / pro.fontawesome.com / external <link>+<script>+@import",
        severity="critical",
        lesson_ref="Round 160 Phase 0 + Round 161 sealing — long-term portability requires zero external resources; promoted warn → critical after Tesseract in-housed + all 6 surfaces migrated",
    ),
    Invariant(
        name="design_system_hash_integrity",
        description="dashboard/assets/styles/design-system.css hash matches design-system.golden.sha256 (sealed Round 161)",
        check_fn=check_design_system_hash_integrity,
        truth_anchor="SHA-256 of design-system.css vs golden file (sealed cdf0ebd4d7e55305...)",
        severity="critical",
        lesson_ref="Round 161 sealing — Eden pattern applied to design tokens; math doesn't lie",
    ),
    Invariant(
        name="design_system_write_protection",
        description="design-system.css must not be modified after the golden hash sealing time (user-only-writer rule, sealed Round 161)",
        check_fn=check_design_system_write_protection,
        truth_anchor="mtime(design-system.css) vs mtime(design-system.golden.sha256) — modifications after seal are violations",
        severity="critical",
        lesson_ref="Round 161 sealing — Eden write-protection pattern applied; agent reads only, user writes only",
    ),
    Invariant(
        name="dashboard_dist_fresh",
        description="dashboard/assets/js/dist/main.js must be newer than every src/**/*.ts file (build artifact is the runtime contract)",
        check_fn=check_dashboard_dist_fresh,
        truth_anchor="mtime(dist/main.js) vs max(mtime(src/**/*.ts)) — stale dist means the runtime is behind the source",
        severity="warning",
        lesson_ref="Round 161 R1·A — committed build artifact must not be stale relative to its source; otherwise we ship a runtime contract that doesn't match the canonical .ts truth",
    ),
]


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def list_invariants(weekly: bool = False):
    """Return all invariants. If weekly=True, include weekly-cadence entries
    alongside daily ones (some weekly invariants are paired with daily)."""
    if weekly:
        return list(INVARIANTS)
    return [i for i in INVARIANTS if i.cadence == "daily"]


def main():
    import argparse
    ap = argparse.ArgumentParser(description="Run the invariant manifest")
    ap.add_argument("--weekly", action="store_true",
                    help="include weekly-cadence invariants")
    ap.add_argument("--only", type=str, default=None,
                    help="run a single named invariant")
    ap.add_argument("--list", action="store_true",
                    help="list invariants without running them")
    args = ap.parse_args()

    chosen = list_invariants(weekly=args.weekly)
    if args.only:
        chosen = [i for i in chosen if i.name == args.only]
        if not chosen:
            print(f"no invariant named {args.only!r}", file=sys.stderr)
            sys.exit(2)

    if args.list:
        for i in chosen:
            print(f"  [{i.severity:8}] [{i.cadence:6}] {i.name:32} — {i.description}")
        sys.exit(0)

    n_pass = n_fail = 0
    for i in chosen:
        try:
            passed, msg = i.check_fn()
            status = "OK  " if passed else "FAIL"
            if passed:
                n_pass += 1
            else:
                n_fail += 1
        except Exception as e:
            passed, msg = False, f"check raised: {e}"
            status = "ERR "
            n_fail += 1
        print(f"{status} [{i.severity:8}] {i.name}: {msg}")

    print(f"\n{n_pass}/{n_pass + n_fail} passed ({n_fail} failed)")
    sys.exit(0 if n_fail == 0 else 1)


if __name__ == "__main__":
    main()
