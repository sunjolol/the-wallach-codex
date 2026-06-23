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

Promotion gate (engineering-doctrine §6 — verifiable invariants): whenever a
new pitfall is recorded in the chronicle or a `.claude/rules/` file, the same
patch must add an invariant here that would catch the next occurrence. No
new pitfalls without detectors.
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


def check_critical_json_parse():
    """All JSON files in schemas/ and dashboard/assets/data must parse. Catches
    Edit-tool silent truncation of JSON (Round 73 versions.json event)."""
    failures = []
    count = 0
    for d in ["schemas", "dashboard/assets/data"]:
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


def check_wallach_stance_source_rule():
    """Round 118 — Cura session #2 Survivor B: every wallach_stance.citation
    in knowledge/essentials-targets.json must cite an allowlisted Wallach or
    Youngevity primary source (same allowlist as the existing `source` field
    check). Runs daily over the canonical file so the §00.A cornerstone is enforced
    in-code — this invariant is now the sole in-code allowlist check (the
    old dashboard_integrity co-writer was retired in the June-2026 cleanup).

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

    # Allowlist markers — the canonical in-code home for the §00.A allowlist.
    # (The old tools/dashboard_integrity.py co-writer was retired in the
    # June-2026 cleanup, so this is now the single source.) If the allowlist
    # grows, update it here and the note in .claude/rules/source-rule.md.
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


# ---------------------------------------------------------------------------
# Eden — sealed catalog architecture (Round 157 / 2026-06-20)
# ---------------------------------------------------------------------------
# Two invariants that hold the sealed garden together:
#   1. check_eden_hash_integrity — actual SHA-256 of eden-catalog.json must
#      match the locked golden hash. Truth anchor: math (deterministic hash).
#   2. check_eden_embeds_match_canonical — the three dashboard embeds
#      (regimen-label-lookup, goal-recommendations-data, REGIMEN_BASE_DATA
#      .recommended) must carry the same eden_version as the canonical
#      catalog. Drift = loud failure.
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
    """Scan dashboard.html + dashboard/assets/styles/*.css
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

def _max_inline_literal_elements(src: str) -> int:
    """Heuristic scan for the largest array/object literal in TS source, by
    top-level element count. Ignores string + comment content and () call args.
    Not a parser — a cheap backstop for the §00.B 'no inline data' rule.
    Returns the max element estimate (top-level commas + 1) found."""
    max_elems = 0
    stack = []  # entries: [bracket_char, comma_count, dirty_since_comma, count_this]
    in_str = None
    in_line_comment = False
    in_block_comment = False
    i, n = 0, len(src)
    while i < n:
        c = src[i]
        nxt = src[i + 1] if i + 1 < n else ""
        if in_line_comment:
            if c == "\n":
                in_line_comment = False
        elif in_block_comment:
            if c == "*" and nxt == "/":
                in_block_comment = False
                i += 1
        elif in_str is not None:
            if c == "\\":
                i += 1
            elif c == in_str:
                in_str = None
        elif c == "/" and nxt == "/":
            in_line_comment = True
            i += 1
        elif c == "/" and nxt == "*":
            in_block_comment = True
            i += 1
        elif c in ('"', "'", '`'):
            if stack:
                stack[-1][2] = True
            in_str = c
        elif c in "[{(":
            if stack:
                stack[-1][2] = True
            count_this = True
            if c == "{" and not stack:
                stmt = src[src.rfind(";", 0, i) + 1:i]
                if re.match(r"\s*(?:import|export)\b", stmt) and "=" not in stmt:
                    count_this = False
            stack.append([c, 0, False, count_this])
        elif c in "]})":
            if stack:
                ch, commas, dirty, count_this = stack.pop()
                if ch in "[{" and count_this:
                    elems = commas + (1 if dirty else 0)
                    if elems > max_elems:
                        max_elems = elems
        elif c == "," and stack and stack[-1][0] in "[{":
            stack[-1][1] += 1
            stack[-1][2] = False
        elif (not c.isspace()) and stack:
            stack[-1][2] = True
        i += 1
    return max_elems


def check_views_state_no_inline_data():
    """§00.B — no array/object literal with more than max_inline top-level
    elements may live in views/ or state/. Canonical data belongs in
    assets/data/ behind a Zod schema, loaded once at boot. This is the
    invariant the 2026-06-21 §00.B incident report prescribed (remediation
    item 7): the 91 hardcoded tile specs in views/coverage.ts slipped past the
    lint-warn layer across two rounds. Heuristic scan, not a TS parser.
    Truth anchor: the .ts source under views/ + state/."""
    max_inline = 10
    roots = (
        ROOT / "dashboard/assets/js/src/views",
        ROOT / "dashboard/assets/js/src/state",
    )
    violations = []
    for root in roots:
        if not root.exists():
            continue
        for ts in sorted(root.rglob("*.ts")):
            if ts.name.endswith((".test.ts", ".spec.ts")):
                continue
            try:
                src = ts.read_text(encoding="utf-8")
            except Exception as exc:
                violations.append(f"{ts.relative_to(ROOT).as_posix()} unreadable ({exc})")
                continue
            elems = _max_inline_literal_elements(src)
            if elems > max_inline:
                violations.append(f"{ts.relative_to(ROOT).as_posix()} (~{elems}-element literal)")
    if violations:
        return False, (
            f"§00.B inline data (> {max_inline} elements) in views/state — move to "
            f"assets/data/ behind a Zod schema: " + "; ".join(violations[:10])
        )
    return True, f"no inline literal > {max_inline} elements in views/ or state/"


INVARIANTS = [
    Invariant(
        name="safe_write_canary",
        description="safe_write must round-trip a known payload byte-equal via os.read",
        check_fn=check_safe_write_canary,
        truth_anchor="tools/canaries/safe-write-probe.txt readback via os.read",
        severity="critical",
        lesson_ref="Round 73 §17 — Edit-tool ban + safe_write primacy",
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
        name="critical_json_parse",
        description="All JSON files in schemas/ and dashboard/assets/data must parse",
        check_fn=check_critical_json_parse,
        truth_anchor="json.loads",
        severity="critical",
        lesson_ref="Round 73 — versions.json truncation event",
    ),
    Invariant(
        name="views_state_no_inline_data",
        description="§00.B — no array/object literal > 10 elements in views/ or state/ (canonical data lives in assets/data/ behind Zod)",
        check_fn=check_views_state_no_inline_data,
        truth_anchor="dashboard/assets/js/src/{views,state}/**/*.ts literal scan",
        severity="critical",
        lesson_ref="2026-06-21 §00.B incident — 91 hardcoded tile specs in views/coverage.ts; report remediation items 7-8 (lint-warn -> invariant-block)",
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
        name="wallach_stance_source_rule",
        description="Every wallach_stance.citation in knowledge/essentials-targets.json cites an allowlisted Wallach/Youngevity primary source",
        check_fn=check_wallach_stance_source_rule,
        truth_anchor=".claude/rules/source-rule.md allowlist (in-code) applied to wallach_stance.citation in essentials-targets.json",
        severity="critical",
        lesson_ref="Round 118 / Cura session #2 Survivor B — Round 115's wallach_stance schema addition left check_source_rule's hard-coded scope behind; defense-in-depth pair for the dashboard_integrity extension shipping in the same patch.",
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
        name="regimen_slot_invariant_wired",
        description="dashboard.html has assertRegimenSlotInvariant() defined + window-exposed + load-time wired + ≥3 call sites",
        check_fn=check_regimen_slot_invariant_wired,
        truth_anchor="grep patterns on dashboard.html (function def + window export + DOMContentLoaded handler + call site count)",
        severity="warning",
        lesson_ref="Round 134 architectural commitment / vision-default-regimen.md Phase 6 — REGIMEN_SLOT_INVARIANT runtime self-healing",
    ),
    Invariant(
        name="regimen_state_mutation_routing",
        description="every regimen LS write in dashboard.html occurs inside a §31 chokepoint helper, and every chokepoint fires triggerRegimenRerender",
        check_fn=check_regimen_state_mutation_routing,
        truth_anchor="grep patterns on dashboard.html — lsWrite call positions vs chokepoint function-body ranges",
        severity="critical",
        lesson_ref="Round 149 cross-boundary-contract-drift family — chokepoint discipline closes the cross-surface sync loop; §31 codifies the rule",
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
    # Windows stdout/stderr default to cp1252, which raises UnicodeEncodeError
    # on the non-ASCII glyphs (arrows, command symbols) many invariant messages
    # carry; the prior sessions never hit it because they ran in a UTF-8 Linux
    # sandbox. Force UTF-8 on our own streams and export it so child processes
    # we spawn inherit it, so the audit runs to completion on every host.
    os.environ.setdefault("PYTHONUTF8", "1")
    os.environ.setdefault("PYTHONIOENCODING", "utf-8")
    for _stream in (sys.stdout, sys.stderr):
        _reconfigure = getattr(_stream, "reconfigure", None)
        if _reconfigure is not None:
            try:
                _reconfigure(encoding="utf-8")
            except Exception:
                pass
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
