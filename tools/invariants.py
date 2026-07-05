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


def check_wallach_stance_verbatim_in_book():
    """SESSION 49 stance sweep — the §00.A faithfulness guard for the
    educational stance layer.

    Each wallach_stance carries `summary` (our modern-voice reading) and
    `verbatim` (Wallach's exact words from `citation`). A non-null verbatim
    MUST appear — after light normalization (case, unicode dashes/quotes,
    de-hyphenated line breaks, collapsed whitespace, punctuation stripped) —
    as a contiguous substring of the cited Eden book text. This is the
    machine anchor that stops a synthesized/fabricated quote from being
    presented as Wallach's words (the vit-K fabrication that motivated the
    sweep: a modern-voice summary reads plausibly but is nobody's verbatim).

    verbatim == null is allowed: Youngevity-label-only citations have no
    quotable book prose, so the summary + citation stand alone. A non-null
    verbatim whose citation resolves to NO Eden book fails loudly (a label
    citation must use verbatim:null; a book citation must be verifiable).

    Truth anchor: eden/corpus/books/*.txt (the sealed corpus), read fresh —
    same standard as corpus_verify #2 (verbatim ⊆ book) for claims.
    Severity: critical — the cornerstone's error-mode enforcement applied to
    the educational layer.
    """
    import unicodedata
    canonical = ROOT / "knowledge/essentials-targets.json"
    if not canonical.exists():
        return False, "knowledge/essentials-targets.json missing"
    try:
        data = json.loads(canonical.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return False, f"essentials-targets.json parse failed: {e}"

    # citation-substring -> Eden book text. Name-based, matching how citations
    # are written; a citation may match more than one (compound sources).
    books = {
        "rare earths": "eden/corpus/books/rare-earths-forbidden-cures.txt",
        "dead doctors": "eden/corpus/books/dddl-third-edition-2011.txt",
        "let's play doctor": "eden/corpus/books/lets-play-doctor-fourth-edition-1995.txt",
        "lets play doctor": "eden/corpus/books/lets-play-doctor-fourth-edition-1995.txt",
        "epigenetics": "eden/corpus/books/epigenetics.txt",
        "immortality": "eden/corpus/books/immortality.txt",
        "all in your head": "eden/corpus/books/iaiyh.txt",
    }

    def norm(s):
        s = unicodedata.normalize("NFKD", s)
        s = re.sub(r"-\s*\n\s*", "", s)   # heal line-break hyphenation (book side)
        s = (s.replace("—", " ").replace("–", " ")
               .replace("’", "'").replace("‘", "'")
               .replace("“", '"').replace("”", '"'))
        s = s.lower()
        s = re.sub(r"[^a-z0-9 ]+", " ", s)
        s = re.sub(r"\s+", " ", s).strip()
        return s

    norm_cache = {}

    def norm_book(path):
        if path not in norm_cache:
            p = ROOT / path
            norm_cache[path] = norm(p.read_text(encoding="utf-8")) if p.exists() else None
        return norm_cache[path]

    def walk(obj):
        if isinstance(obj, dict):
            if isinstance(obj.get("wallach_stance"), dict):
                yield obj.get("name", "<unnamed>"), obj["wallach_stance"]
            for v in obj.values():
                yield from walk(v)
        elif isinstance(obj, list):
            for it in obj:
                yield from walk(it)

    n_checked = 0
    n_null = 0
    fails = []
    for name, st in walk(data):
        vb = st.get("verbatim")
        if vb is None:
            n_null += 1
            continue
        if not isinstance(vb, str) or not vb.strip():
            fails.append(f"{name}: verbatim present but empty/non-string")
            continue
        citation = (st.get("citation") or "").lower()
        paths = {p for key, p in books.items() if key in citation}
        if not paths:
            fails.append(
                f"{name}: non-null verbatim but citation resolves to no Eden book "
                f"(label-only citations must use verbatim:null): "
                f"'{st.get('citation', '')[:60]}'"
            )
            continue
        nvb = norm(vb)
        found = False
        for p in paths:
            nb = norm_book(p)
            if nb and nvb in nb:
                found = True
                break
        if found:
            n_checked += 1
        else:
            fails.append(
                f"{name}: verbatim NOT found in cited book text "
                f"(fabrication or mis-citation): '{vb[:60]}...'"
            )

    if fails:
        return False, (
            f"{len(fails)} stance verbatim faithfulness failure(s): "
            + "; ".join(fails[:3])
        )
    total = n_checked + n_null
    return True, (
        f"all {total} stance verbatim(s) faithful: {n_checked} verified ⊆ cited book, "
        f"{n_null} null (label-only / pending backfill)"
    )


# ---------------------------------------------------------------------------
# Round 135 — Discipline invariants (lesson logging + raw-key surfacing +
# cross-IIFE bare refs). Codified after the Round 135 meta-failure: lessons
# were being recorded but not applied; raw keys were leaking through render
# sites; cross-IIFE bare refs silently fell back to empty. The 30+ existing
# invariants audit STRUCTURE; these three audit DISCIPLINE.
# ---------------------------------------------------------------------------


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


def check_creators_log_well_formed():
    """Every line of chronicle/creators-log.jsonl is a schema-valid Creator's
    Log entry. tools/creators_log.py is the sanctioned CLI producer; this
    invariant reuses its verify_file() as the audit-time defense-in-depth layer
    so a hand-edit or bad append can't silently corrupt the §00 audit trail.
    An absent/empty ledger passes vacuously."""
    sys.path.insert(0, str(ROOT / "tools"))
    import creators_log
    ok, problems, total = creators_log.verify_file()
    if not ok:
        return False, "; ".join(problems[:8])
    plural = "y" if total == 1 else "ies"
    return True, f"all {total} creators-log entr{plural} well-formed"


def check_creators_log_append_only():
    """The Creator's Log is sacred + append-only. The committed ledger
    (`git show HEAD:chronicle/creators-log/log.jsonl`) must remain a line-PREFIX
    of the working file — every committed entry still present, in order, at the
    start. Catches any delete / truncate / edit / reorder of a past entry — incl.
    a COMMITTED deletion (path gone from HEAD but with prior history → RED). A
    genuinely-new path (no history) passes; git being unavailable fails OPEN but
    LOUD (⚠ UNVERIFIED message, never a silent green). Truth anchor: git history."""
    import subprocess
    rel = "chronicle/creators-log/log.jsonl"
    try:
        r = subprocess.run(["git", "-C", str(ROOT), "show", f"HEAD:{rel}"],
                           capture_output=True, text=True, timeout=15)
    except Exception as e:
        return True, (f"⚠ UNVERIFIED — git unavailable ({e}); the sacred append-only "
                      f"anchor could NOT be checked this run (fail-open, not a silent pass)")
    if r.returncode != 0:
        try:
            hist = subprocess.run(["git", "-C", str(ROOT), "log", "--oneline", "--", rel],
                                  capture_output=True, text=True, timeout=15)
            ever_committed = hist.returncode == 0 and bool(hist.stdout.strip())
        except Exception:
            ever_committed = False
        if ever_committed:
            return False, (f"SACRED LEDGER REMOVED FROM HEAD — {rel} has committed history but "
                           f"is absent from the current commit (a committed deletion). violated")
        return True, "ledger not yet committed (new path) — nothing to anchor"
    committed = [ln for ln in r.stdout.splitlines() if ln.strip()]
    path = ROOT / rel
    if not path.exists():
        return False, f"SACRED LEDGER DELETED — {rel} is committed but now missing"
    working = [ln for ln in path.read_text(encoding="utf-8").splitlines() if ln.strip()]
    if len(working) < len(committed):
        return False, (f"SACRED LEDGER TRUNCATED — {len(committed)} committed entries, "
                       f"{len(working)} present (append-only violated)")
    for i, cl in enumerate(committed):
        if working[i] != cl:
            return False, (f"SACRED LEDGER MUTATED at entry {i + 1} — a committed entry was "
                           f"edited or reordered (append-only violated)")
    return True, (f"append-only intact — {len(committed)} committed entries preserved, "
                  f"{len(working) - len(committed)} new")


def check_build_log_append_only():
    """chronicle/build-log.md hardened to append-only 2026-07-04 (Luneth) to close
    the gap the sacred ledger already covers. The committed file
    (`git show HEAD:chronicle/build-log.md`) must stay a line-PREFIX of the working
    file — every committed line still present, in order, at the start. Blocks any
    truncate / edit / reorder of past log content; APPENDS (new lines at the end)
    always pass, so normal round-close logging is unaffected. New path (no history)
    passes; git unavailable fails OPEN but LOUD. Truth anchor: git history. NOTE: a
    deliberate future archival split moves old lines out and would trip this BY
    DESIGN — that operation must re-anchor (commit the split) in the same patch."""
    import subprocess
    rel = "chronicle/build-log.md"
    try:
        r = subprocess.run(["git", "-C", str(ROOT), "show", f"HEAD:{rel}"],
                           capture_output=True, text=True, timeout=15)
    except Exception as e:
        return True, (f"⚠ UNVERIFIED — git unavailable ({e}); the build-log append-only "
                      f"anchor could NOT be checked this run (fail-open, not a silent pass)")
    if r.returncode != 0:
        try:
            hist = subprocess.run(["git", "-C", str(ROOT), "log", "--oneline", "--", rel],
                                  capture_output=True, text=True, timeout=15)
            ever_committed = hist.returncode == 0 and bool(hist.stdout.strip())
        except Exception:
            ever_committed = False
        if ever_committed:
            return False, (f"BUILD-LOG REMOVED FROM HEAD — {rel} has committed history but "
                           f"is absent from the current commit (a committed deletion). violated")
        return True, "build-log not yet committed (new path) — nothing to anchor"
    committed = [ln for ln in r.stdout.splitlines() if ln.strip()]
    path = ROOT / rel
    if not path.exists():
        return False, f"BUILD-LOG DELETED — {rel} is committed but now missing"
    working = [ln for ln in path.read_text(encoding="utf-8").splitlines() if ln.strip()]
    if len(working) < len(committed):
        return False, (f"BUILD-LOG TRUNCATED — {len(committed)} committed lines, "
                       f"{len(working)} present (append-only violated)")
    for i, cl in enumerate(committed):
        if working[i] != cl:
            return False, (f"BUILD-LOG MUTATED at line {i + 1} — a committed line was "
                           f"edited or reordered (append-only violated)")
    return True, (f"append-only intact — {len(committed)} committed lines preserved, "
                  f"{len(working) - len(committed)} new")


def check_no_dead_legacy_paths():
    """No live code / data / active-doc may reference a pre-Eden legacy path
    severed 2026-07-04 -- the old book PDFs, the transcript scraper, and the
    ingredient/stance generators that fed off them. Eden is the single source of
    truth; a re-reference is the exact contamination vector the sever eliminated
    (the old chain even fed stale book text into the live dashboard). Immutable
    history is allowlisted -- chronicle/, genesis/, generated dist/, the
    to-be-retired legacy-dashboard.js, this file's own token list, and the
    embedded Creator's-Log / versions blocks inside dashboard.html (past-tense
    record, stripped before scanning). It records the past; it is not a live
    reference. Truth anchor: git-tracked file contents, scanned each run."""
    import subprocess
    FORBIDDEN = ["wallach-books", "books-clean", "wallach-refresh", "transcripts-clean",
                 "podcast-transcripts", "wallach-topic-notes", "youngevity-product-notes",
                 "health-resources", "catalog-index", "corpus-index"]
    ALLOW_PREFIXES = ("chronicle/", "genesis/",
                      "dashboard/assets/data/creators-log",
                      "dashboard/assets/data/versions-data.json",
                      "dashboard/assets/js/dist/",
                      "dashboard/assets/js/legacy-dashboard.js",
                      "tools/invariants.py")
    SKIP_EXT = (".png", ".jpg", ".jpeg", ".ttf", ".pdf", ".ico", ".bmp", ".gif", ".map")
    embed_re = re.compile(
        r'<script[^>]*id="(cl-data-[^"]*|creators-log-embed|versions-data)"[^>]*>.*?</script>',
        re.DOTALL)
    try:
        r = subprocess.run(["git", "-C", str(ROOT), "ls-files"],
                           capture_output=True, text=True, timeout=30)
    except Exception as e:
        return True, (f"⚠ UNVERIFIED — git unavailable ({e}); dead-legacy-path guard could "
                      f"NOT run this pass (fail-open, not a silent green)")
    hits = []
    for rel in r.stdout.splitlines():
        if not rel or rel.startswith(ALLOW_PREFIXES) or rel.endswith(SKIP_EXT):
            continue
        try:
            text = (ROOT / rel).read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        if rel == "dashboard/dashboard.html":
            text = embed_re.sub("", text)  # drop the embedded Creator's-Log/versions history
        for tok in FORBIDDEN:
            if tok in text:
                hits.append(f"{rel}:{tok}")
                break
    if hits:
        return False, (f"{len(hits)} live file(s) RE-REFERENCE a severed pre-Eden path (poison "
                       f"re-introduced): " + ", ".join(hits[:6]) + (" ..." if len(hits) > 6 else ""))
    return True, f"no live reference to any severed pre-Eden legacy path ({len(FORBIDDEN)} tokens guarded)"


def check_no_operating_doc_contradiction():
    """No OPERATING DOC may present a structure the overhaul DELETED as if it were
    live, nor point at a `.claude/rules/` file that no longer exists. Operating
    docs = the steady-state contract a future session runs under: CLAUDE.md, every
    .claude/rules/*.md, REVIEW.md. This extends no_dead_legacy_paths (which guards
    LIVE CODE against severed pre-Eden paths) to the DOC surface for the overhaul's
    own severances -- the deleted legacy dashboard (js/css/host) and the deleted
    wild-west-mode rule. Two machine-checkable halves:
      (1) forbidden-token scan -- an operating doc naming a deleted structure is a
          stale pointer that would send a future reader to something that is gone;
      (2) rule-file pointer resolution -- every `.claude/rules/<name>.md` an
          operating doc cites must resolve on disk (a dangling rule pointer = a
          deleted/renamed rule the doc never got reconciled to).
    NOT covered (WISH per R7 -- do NOT sell it as guarded): the SEMANTIC half, a
    doc that contradicts the Charter's SUBSTANCE without naming a deleted structure
    (e.g. asserting a retired policy as current). That has no non-gaming machine
    check; it rests on the Phase-A rules-audit discipline + review. Living/planning
    docs that legitimately narrate the deletions in past/planning tense
    (chronicle/*, the blueprint, genesis/*, next-chunk.md) are OUT of scope by
    design -- scanning them would flag correct history. Truth anchor: operating-doc
    bytes + os-level file existence, recomputed each run."""
    forbidden = ["legacy-dashboard", "legacy-workspace-host", "wild-west-mode"]
    rules_dir = ROOT / ".claude" / "rules"
    docs = [ROOT / "CLAUDE.md", ROOT / "REVIEW.md"] + sorted(rules_dir.glob("*.md"))
    rule_ref_re = re.compile(r"\.claude/rules/([A-Za-z0-9_-]+\.md)")
    token_hits, dangling, scanned = [], [], 0
    for path in docs:
        if not path.exists():
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except Exception:
            continue
        scanned += 1
        rel = path.relative_to(ROOT).as_posix()
        for tok in forbidden:
            if tok in text:
                token_hits.append(f"{rel}:{tok}")
        for m in rule_ref_re.finditer(text):
            if not (rules_dir / m.group(1)).exists():
                dangling.append(f"{rel}->.claude/rules/{m.group(1)}")
    problems = token_hits + dangling
    if problems:
        return False, (
            f"{len(problems)} operating-doc contradiction(s) — a doc cites a "
            f"deleted structure or a non-existent rule file: "
            + "; ".join(problems[:6]) + (" ..." if len(problems) > 6 else "")
        )
    return True, (
        f"{scanned} operating docs clean — no deleted-structure token "
        f"({len(forbidden)} guarded), no dangling .claude/rules pointer"
    )


def check_creators_log_digest_synced():
    """LOG.md must equal the deterministic render of log.jsonl. It is a generated
    human view; drift means a hand-edit or a missed regeneration, which would let
    the human-facing log lie. Reuses the tool's render_digest()."""
    sys.path.insert(0, str(ROOT / "tools"))
    import creators_log
    digest = ROOT / "chronicle/creators-log/LOG.md"
    if not digest.exists():
        return False, "LOG.md (human digest) missing — run `python tools/creators_log.py digest`"
    if digest.read_text(encoding="utf-8") == creators_log.render_digest():
        return True, "LOG.md matches the canonical ledger render"
    return False, "LOG.md is STALE or hand-edited — run `python tools/creators_log.py digest`"


def check_creators_log_embed_synced():
    """The dashboard build-time embed (dashboard/assets/data/creators-log-embed.json)
    must equal the canonical ledger (chronicle/creators-log/log.jsonl) parsed to a
    JSON array, in file order. The offline file:// app inlines this at build (esbuild
    JSON import in state/log.ts, merged with localStorage); drift means a stale build
    or a hand-edit, which would make the in-app Creator's Log lie. Regenerate via
    `python tools/creators_log.py digest` (or `node tools/build.mjs`)."""
    import json as _json
    sys.path.insert(0, str(ROOT / "tools"))
    import creators_log
    embed = ROOT / "dashboard/assets/data/creators-log-embed.json"
    if not embed.exists():
        return False, "creators-log-embed.json missing — run `python tools/creators_log.py digest`"
    try:
        on_disk = _json.loads(embed.read_text(encoding="utf-8"))
    except Exception as e:
        return False, f"creators-log-embed.json is not valid JSON: {e}"
    expected = creators_log.read_entries()
    if on_disk == expected:
        return True, f"embed in sync with the ledger ({len(expected)} entries)"
    return False, "creators-log-embed.json is STALE — run `python tools/creators_log.py digest`"


def check_creators_log_bundle_synced():
    """The BUILT bundle the browser actually loads (dashboard/assets/js/dist/main.js)
    must carry the CURRENT ledger. esbuild inlines creators-log-embed.json at BUILD
    time (state/log.ts JSON import) and the offline file:// app cannot fetch() it at
    runtime, so a log append not followed by `node tools/build.mjs` leaves the in-app
    Profile log SILENTLY stale: the entries live in the ledger + the source embed
    (embed_synced stays green) but never reach the shipped bundle. embed_synced proves
    source==ledger; THIS proves the ARTIFACT the user loads matches. Anchor: the newest
    ledger entry id must appear verbatim in the minified bundle. Fix: node tools/build.mjs."""
    sys.path.insert(0, str(ROOT / "tools"))
    import creators_log
    bundle = ROOT / "dashboard/assets/js/dist/main.js"
    if not bundle.exists():
        return False, "dist/main.js missing — run `node tools/build.mjs`"
    entries = creators_log.read_entries()
    if not entries:
        return True, "no ledger entries yet — nothing to embed"
    newest = entries[-1]
    newest_id = newest.get("id", "") if isinstance(newest, dict) else ""
    if not newest_id:
        return False, "newest ledger entry has no id — ledger malformed"
    text = bundle.read_text(encoding="utf-8", errors="replace")
    if newest_id in text:
        return True, f"bundle carries the current ledger head ({newest_id})"
    return False, (
        f"dist/main.js is STALE — newest ledger entry {newest_id} "
        f"({newest.get('ts', '?')}) is NOT in the built bundle; the in-app Profile log "
        f"is missing the latest entries. Run `node tools/build.mjs`."
    )


def check_creators_log_archive_synced():
    """The navigable archive (chronicle/creators-log/INDEX.md + digests/YYYY-MM.md)
    must match what regenerates from the canonical ledger. Full-history human
    fidelity lives here (LOG.md is a recent-window view), so this is the check that
    proves no past entry's human view drifts. A missed regen or hand-edit fails it;
    regenerate via `python tools/creators_log.py digest`."""
    sys.path.insert(0, str(ROOT / "tools"))
    import creators_log
    base = ROOT / "chronicle/creators-log"
    index = base / "INDEX.md"
    if not index.exists():
        return False, "INDEX.md missing — run `python tools/creators_log.py digest`"
    if index.read_text(encoding="utf-8") != creators_log.render_index():
        return False, "INDEX.md is STALE — run `python tools/creators_log.py digest`"
    digdir = base / "digests"
    expected = set(creators_log.month_set())
    present = {p.stem for p in digdir.glob("*.md")} if digdir.exists() else set()
    if expected != present:
        return False, (f"monthly digests drift — missing {sorted(expected - present)} "
                       f"extra {sorted(present - expected)} (run digest)")
    for ym in sorted(expected):
        if (digdir / f"{ym}.md").read_text(encoding="utf-8") != creators_log.render_month(ym):
            return False, f"digests/{ym}.md is STALE — run `python tools/creators_log.py digest`"
    return True, f"archive in sync — INDEX + {len(expected)} monthly digest(s)"


def check_legacy_css_contained():
    """legacy-dashboard.css is the parked old dashboard, loaded AFTER the v3
    design system. Its BARE element/universal selectors leak into the new
    .app-* shell — the 2026-06-23 containment incident (a 15px document root
    shrinking the whole UI, a teal header veil over .app-topbar, teal <h2>/
    <table> waiting to hit the next surface). This invariant makes the leak
    structurally impossible: NO selector in the file may have a bare element
    type or the universal '*' as its FIRST compound. Every element-level rule
    must be scoped under #legacy-workspace-host (plain — the host element) or
    :where(#legacy-workspace-host) (descendant rules; :where adds ZERO
    specificity so the legacy cascade is preserved byte-for-byte). :root may
    hold ONLY custom properties (a non-var :root declaration cascades to the
    whole document). @font-face / @keyframes are exempt. As this file shrinks
    to its Round-5 deletion, nothing it holds can ever again style the shell."""
    import re as _re
    import bisect as _bisect
    path = ROOT / "dashboard" / "assets" / "styles" / "legacy-dashboard.css"
    if not path.exists():
        return True, "legacy-dashboard.css already deleted (Round-5 sever complete)"
    raw = path.read_text(encoding="utf-8")
    # strip /* ... */ comments, preserving byte offsets for line numbers
    out, i, n = [], 0, len(raw)
    while i < n:
        if raw[i:i + 2] == "/*":
            j = raw.find("*/", i + 2)
            j = n if j == -1 else j + 2
            out.append(" " * (j - i))
            i = j
        else:
            out.append(raw[i])
            i += 1
    clean = "".join(out)
    line_starts = [0] + [m.end() for m in _re.finditer("\n", raw)]
    HTML_ELEMENTS = set((
        "a abbr address area article aside audio b base blockquote body br button canvas "
        "caption cite code col colgroup data datalist dd del details dfn dialog div dl dt "
        "em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header "
        "hgroup hr html i iframe img input ins kbd label legend li main map mark menu meter "
        "nav object ol optgroup option output p param picture pre progress q rp rt ruby s "
        "samp section select slot small source span strong sub summary sup table tbody td "
        "template textarea tfoot th thead time tr u ul var video wbr "
        "svg path circle rect line polyline polygon g text defs"
    ).split())
    violations = []
    # 1) :root must be custom-properties only
    for rm in _re.finditer(r":root\s*\{([^{}]*)\}", clean):
        for decl in rm.group(1).split(";"):
            decl = decl.strip()
            if decl and not decl.startswith("--"):
                prop = decl.split(":", 1)[0].strip()
                violations.append(f":root sets non-custom property '{prop}' (cascades document-wide)")
    # 2) no bare element / universal first compound on any style rule
    for m in _re.finditer(r"([^{}]+)\{", clean):
        grp = m.group(1)
        sel = grp.strip()
        if not sel or sel.startswith("@"):
            continue
        off = m.start(1) + (len(grp) - len(grp.lstrip()))
        ln = _bisect.bisect_right(line_starts, off)
        for part in sel.split(","):
            part = part.strip()
            if not part:
                continue
            first = _re.split(r"[ >+~]", part)[0]
            if not first:
                continue
            if first[0] in ".#[&:":
                continue
            if first[0] == "*":
                violations.append(f"L{ln}: universal '*' not host-scoped -- {part}")
                continue
            mm = _re.match(r"[a-zA-Z][a-zA-Z0-9-]*", first)
            tok = mm.group(0).lower() if mm else ""
            if tok in HTML_ELEMENTS:
                violations.append(f"L{ln}: bare <{tok}> leaks to the shell -- {part}")
    if violations:
        head = "; ".join(violations[:8])
        more = f" (+{len(violations) - 8} more)" if len(violations) > 8 else ""
        return False, ("legacy CSS leak vector(s) -- scope under "
                       ":where(#legacy-workspace-host): " + head + more)
    return True, "legacy-dashboard.css fully contained -- 0 bare element/universal selectors"


def check_corpus_integrity():
    """Phase alpha — eden/corpus sealed claim-graph integrity. Delegates to the single
    implementation eden/tools/corpus_verify.py (one source of the 11 checks, no
    duplication): exit 0 = sealed & healthy, 2 = BOOTSTRAP (unsealed; always-valid
    checks passed), 1 = FAIL. Truth-anchored on book bytes + golden hashes."""
    verify = ROOT / "eden" / "tools" / "corpus_verify.py"
    if not verify.exists():
        return True, "eden/tools/corpus_verify.py missing (corpus not installed; bootstrap-guard)"
    env = dict(os.environ)
    env.setdefault("PYTHONUTF8", "1")
    r = subprocess.run([sys.executable, str(verify)], capture_output=True, text=True, env=env)
    lines = (r.stdout or "").strip().splitlines()
    head = lines[0] if lines else (r.stderr or "").strip()[:160]
    if r.returncode in (0, 2):
        return True, head
    return False, f"corpus integrity FAIL: {head}"


def check_corpus_runtime_purity():
    """Phase alpha — the shipped dashboard bundle must make no LLM / external-network
    call (offline-forever; proposal section 5). Greps dist/main.js for LLM-SDK +
    API-endpoint markers. Same family as no_external_style_resources."""
    dist = ROOT / "dashboard" / "assets" / "js" / "dist" / "main.js"
    if not dist.exists():
        return True, "dist/main.js missing (build not present; bootstrap-guard)"
    text = dist.read_text(encoding="utf-8", errors="replace").lower()
    markers = [
        "anthropic", "openai", "generativelanguage", "x-api-key",
        "api.anthropic", "api.openai", "/v1/messages", "/v1/chat/completions",
        "claude-opus", "claude-sonnet", "claude-haiku", "gpt-4", "gpt-3",
    ]
    hits = [m for m in markers if m in text]
    if hits:
        return False, f"dist/main.js carries LLM/network marker(s) {hits} -- offline-forever / extraction-purity breach"
    return True, "dist/main.js carries no LLM/external-network markers (extraction stays offline)"


def check_corpus_embed_synced():
    """Phase epsilon — the dashboard build-time corpus embed
    (dashboard/assets/data/corpus-embed.json) must equal a fresh projection of the
    sealed corpus (eden/tools/corpus_embed.py::build_embed). The offline file:// app
    cannot fetch(), so the slim claim graph is inlined into the bundle at build
    (esbuild JSON import in state/corpus.ts); drift means a stale build or a hand-edit,
    which would make the Knowledge drawer's Essential/Condition deep-dive lie.
    build_embed() is pure (no write); regenerate the embed via
    `python eden/tools/corpus_embed.py`. Mirrors creators_log_embed_synced."""
    import json as _json
    embed = ROOT / "dashboard" / "assets" / "data" / "corpus-embed.json"
    builder = ROOT / "eden" / "tools" / "corpus_embed.py"
    if not builder.exists():
        return True, "eden/tools/corpus_embed.py missing (corpus not installed; bootstrap-guard)"
    if not embed.exists():
        return False, "corpus-embed.json missing — run `python eden/tools/corpus_embed.py`"
    sys.path.insert(0, str(ROOT / "tools"))
    sys.path.insert(0, str(ROOT / "eden" / "tools"))
    import corpus_embed
    try:
        on_disk = _json.loads(embed.read_text(encoding="utf-8"))
    except Exception as e:
        return False, f"corpus-embed.json is not valid JSON: {e}"
    expected = corpus_embed.build_embed()
    if on_disk == expected:
        n = len(expected.get("claims", {}))
        return True, (f"corpus embed in sync with the sealed corpus "
                      f"({n} claims, knowledge_version={expected.get('knowledge_version')})")
    return False, "corpus-embed.json is STALE — run `python eden/tools/corpus_embed.py`"


def check_search_only_indices_excluded():
    """Tier-2 / "search-only" claims (the Ch7 modality survey: color/light therapy,
    aromatherapy, faith-healing, Schuessler, Bach, chiropractic, etc.) feed ONLY the
    offline search feature. They must NEVER appear in the operational 90-essentials
    indices (conditions / symptoms / essentials / other-substances / consistency) that
    drive the Knowledge-drawer tabs -- wiring a modality name-drop ("blue light -> jaundice")
    into the conditions tab reads as AI slop and dilutes Wallach's solid-cure doctrine,
    the credibility core of the app. corpus_derive excludes any claim tagged `search-only`;
    THIS is the independent semantic guard, truth-anchored on the claim tag + the sealed
    index claim references (not on derive's own logic). See memory:
    search-vs-operational-index-separation."""
    import json as _json
    claims_dir = ROOT / "eden" / "corpus" / "claims"
    idx_dir = ROOT / "eden" / "corpus" / "indices"
    if not claims_dir.exists() or not idx_dir.exists():
        return True, "eden/corpus not installed (bootstrap-guard)"
    search_ids = set()
    for shard in claims_dir.glob("claims-*.json"):
        for c in _json.loads(shard.read_text(encoding="utf-8")).get("claims", []):
            if "search-only" in c.get("tags", []):
                search_ids.add(c["id"])
    if not search_ids:
        return True, "no search-only (tier-2) claims present"
    referenced = set()

    def _idx(name):
        f = idx_dir / name
        return _json.loads(f.read_text(encoding="utf-8")) if f.exists() else {}

    for _slug, e in _idx("conditions.json").items():
        for ids in e.get("claims_by_role", {}).values():
            referenced.update(ids)
    for _slug, e in _idx("symptoms.json").items():
        for d in e.get("likely_deficiencies", []):
            referenced.add(d.get("claim_id"))
    for _slug, e in _idx("essentials.json").items():
        for ids in e.get("claims_by_kind", {}).values():
            referenced.update(ids)
        for d in e.get("deficiency_signs", []):
            referenced.add(d.get("claim_id"))
    for _slug, e in _idx("other-substances.json").items():
        for ids in e.get("claims_by_kind", {}).values():
            referenced.update(ids)
    for grp in _idx("consistency.json") if isinstance(_idx("consistency.json"), list) else []:
        for rep in grp.get("repetitions", []):
            referenced.add(rep.get("claim_id"))

    leak = sorted(search_ids & referenced)
    if leak:
        return False, (f"{len(leak)} search-only (tier-2) claim(s) leaked into the operational "
                       f"indices: {leak[:5]}{' ...' if len(leak) > 5 else ''} -- modality/search content "
                       f"must stay OUT of the conditions/symptoms/essentials tabs (tag `search-only` + "
                       f"re-seal so corpus_derive excludes them)")
    return True, f"all {len(search_ids)} search-only (tier-2) claim(s) correctly excluded from operational indices"


def check_verbatim_names_mapped_conditions():
    """Luneth rule (SESSION 31, 2026-07-01): a Wallach quote shown under a condition
    MUST name that condition (or a registered synonym) in the SHOWN verbatim text --
    else the link is unverifiable (indistinguishable from a hallucination). This
    guards against NEW/regressed violations while the measured 601-mapping backlog is
    remediated: eden/tools/verbatim-audit-baseline.json allowlists the currently-known
    violations, so ONLY new mappings whose verbatim does not name their condition fail.
    The allowlist shrinks to {} as verbatims are extended / mappings dropped and the
    baseline is regenerated. Truth-anchored on the sealed shard verbatims x the derived
    conditions index (exactly what surfaces under a condition; search-only excluded),
    matched name-or-synonym via eden/tools/condition-synonyms.json. The matcher +
    baseline logic live in eden/tools/verbatim_audit.py. See memory
    verbatim-must-name-mapped-condition."""
    if not (ROOT / "eden" / "corpus" / "indices" / "conditions.json").exists():
        return True, "eden/corpus not installed (bootstrap-guard)"
    sys.path.insert(0, str(ROOT / "eden" / "tools"))
    import verbatim_audit
    new = verbatim_audit.new_violations()
    tolerated = len(verbatim_audit.load_baseline())
    if new:
        sample = sorted(f"{cid}->{s}" for cid, s in new)[:5]
        return False, (f"{len(new)} NEW verbatim-names-condition violation(s) — a claim maps a "
                       f"condition its verbatim does not name: {sample}{' ...' if len(new) > 5 else ''} "
                       f"(extend the verbatim to name the condition, or drop the mapping, then "
                       f"`python eden/tools/verbatim_audit.py baseline`). memory: "
                       f"verbatim-must-name-mapped-condition")
    return True, (f"0 new verbatim-names-condition violations ({tolerated} known baselined, "
                  f"shrinking as remediation runs)")


def check_graphics_integrity():
    """Phase alpha — the sacred hand-made graphics (eden/graphics) must match their
    sealed manifest. Delegates to eden/tools/graphics_verify.py: 0 = sealed & healthy,
    2 = BOOTSTRAP (manifest unsealed; image hashes still verified), 1 = FAIL."""
    verify = ROOT / "eden" / "tools" / "graphics_verify.py"
    if not verify.exists():
        return True, "eden/tools/graphics_verify.py missing (graphics not installed; bootstrap-guard)"
    env = dict(os.environ)
    env.setdefault("PYTHONUTF8", "1")
    r = subprocess.run([sys.executable, str(verify)], capture_output=True, text=True, env=env)
    lines = (r.stdout or "").strip().splitlines()
    head = lines[0] if lines else (r.stderr or "").strip()[:160]
    if r.returncode in (0, 2):
        return True, head
    return False, f"graphics integrity FAIL: {head}"


def check_verbatim_over_soft_limit():
    """Length rule (Luneth, 2026-07-01): completeness of truth/education OUTRANKS the
    500-char verbatim limit. 500 is a SOFT threshold, not a truth-limiter — a verbatim
    MAY exceed it when the full faithful excerpt needs the room, up to a 1200 HARD
    ceiling (a load-time/file-size guard, enforced as critical by corpus_verify #2).
    This check is the INFORM surface: it lists every 501-1200 verbatim each board run so
    the (allowed) over-soft cases stay visible for Luneth's spot-check, never hidden.
    Informational — never fails here (the hard ceiling is corpus_verify's job).
    memory: verbatim-length-rule."""
    claims_dir = ROOT / "eden" / "corpus" / "claims"
    shards = sorted(claims_dir.glob("claims-*.json"))
    if not shards:
        return True, "eden/corpus not installed (bootstrap-guard)"
    over = []
    for sh in shards:
        for c in json.loads(sh.read_text(encoding="utf-8")).get("claims", []):
            n = len(c.get("verbatim", ""))
            if n > 500:
                over.append((c["id"], n))
    if not over:
        return True, "all verbatims <= soft-500"
    over.sort(key=lambda t: -t[1])
    sample = ", ".join(f"{cid}:{n}c" for cid, n in over[:6])
    return True, (f"{len(over)} verbatim(s) over soft-500 (ALLOWED when completeness needs it; "
                  f"listed for Luneth review): {sample}{' ...' if len(over) > 6 else ''}")


def check_umbrella_proxy_named():
    """Umbrella named-by-proxy (Luneth SESSION 37): a broad 'library' condition (e.g.
    cancer) is accepted as named when a claim's verbatim names a registered CHILD
    subtype (e.g. leukemia) via eden/tools/condition-taxonomy.json — child->parent
    only. The exact-condition-named rule stays the DEFAULT; this info check LISTS every
    proxy-satisfied mapping each board run so a human eye stays on each umbrella
    exception. Never fails. memory: condition-umbrella-taxonomy."""
    if not (ROOT / "eden" / "corpus" / "indices" / "conditions.json").exists():
        return True, "eden/corpus not installed (bootstrap-guard)"
    sys.path.insert(0, str(ROOT / "eden" / "tools"))
    import verbatim_audit
    m = verbatim_audit.proxy_named_mappings()
    if not m:
        return True, "no umbrella proxy-named mappings"
    sample = ", ".join(f"{cid}:{umb}<={child}" for cid, umb, child in m[:6])
    return True, (f"{len(m)} umbrella mapping(s) named-by-proxy via a child subtype "
                  f"(reviewed exceptions): {sample}{' ...' if len(m) > 6 else ''}")


def check_claim_text_term_gloss():
    """Term-gloss standard (Luneth SESSION 39): front-facing claim_text must never carry a
    garbled/obsolete botanical form (defects) or an obscure common name that has a simpler
    approved alternative (common_swaps); defects must ALSO be absent from the sacred verbatim
    (they are blatant book errors, fixed everywhere per Luneth's ruling). The reviewed
    decisions are the single source of truth in eden/tools/term-gloss-lexicon.json; this check
    enforces they never regress -- the machine guard against re-touching the same entry.
    memory: term-gloss-standard, perfect-entry-no-deferral."""
    lex_path = ROOT / "eden" / "tools" / "term-gloss-lexicon.json"
    claims_dir = ROOT / "eden" / "corpus" / "claims"
    shards = sorted(claims_dir.glob("claims-*.json"))
    if not shards or not lex_path.exists():
        return True, "eden/corpus or term-gloss lexicon not installed (bootstrap-guard)"
    lex = json.loads(lex_path.read_text(encoding="utf-8"))
    defects = lex.get("defects", {})
    swaps = lex.get("common_swaps", {})
    abbrevs = lex.get("abbrev_require_explained", {})
    violations = []
    for sh in shards:
        for c in json.loads(sh.read_text(encoding="utf-8")).get("claims", []):
            ct = c.get("claim_text") or ""
            vb = c.get("verbatim") or ""
            low = ct.lower()
            for k in defects:
                if k in ct:
                    violations.append(f"{c['id']} claim_text:{k!r}")
                if k in vb:
                    violations.append(f"{c['id']} verbatim:{k!r}")
            for k in swaps:
                if k in ct:
                    violations.append(f"{c['id']} claim_text:{k!r}")
            # obscure abbreviation must be spelled out somewhere in the same summary
            # (universally-grasped acronyms are intentionally not listed -> not enforced)
            for ab, trigs in abbrevs.items():
                if re.search(r"\b" + re.escape(ab) + r"\b", ct) and not any(t in low for t in trigs):
                    violations.append(f"{c['id']} unexplained-abbr:{ab!r}")
    if violations:
        sample = "; ".join(violations[:8])
        return False, (f"{len(violations)} term-gloss regression(s) (a defect/obscure form or "
                       f"unexplained abbreviation reappeared): {sample}{' ...' if len(violations) > 8 else ''}")
    n = len(defects) + len(swaps) + len(abbrevs)
    return True, (f"claim_text term-gloss clean -- 0 issues across {n} lexicon rules "
                  f"({len(abbrevs)} obscure abbreviations explained in-claim)")


def check_glossary_wellformed():
    """Glossary integrity (SESSION 39 Phase 1): dashboard/assets/data/glossary.json parses,
    every entry has a non-empty term + plain definition + category, terms are unique, and NO
    definition asserts a number/dose (the glossary is plain-language reference ONLY, never a
    Wallach claim or target -- keeps it clear of the §00.A source rule). memory:
    term-gloss-standard."""
    p = ROOT / "dashboard" / "assets" / "data" / "glossary.json"
    if not p.exists():
        return True, "glossary.json not installed (bootstrap-guard)"
    try:
        g = json.loads(p.read_text(encoding="utf-8"))
    except Exception as e:
        return False, f"glossary.json does not parse: {e}"
    terms = g.get("terms")
    if not isinstance(terms, list) or not terms:
        return False, "glossary.json has no 'terms' array"
    seen = set()
    problems = []
    for t in terms:
        name = (t.get("term") or "").strip()
        if not name:
            problems.append("entry with empty term")
            continue
        if name.lower() in seen:
            problems.append(f"duplicate term {name!r}")
        seen.add(name.lower())
        if not (t.get("plain") or "").strip():
            problems.append(f"{name}: empty definition")
        if not (t.get("category") or "").strip():
            problems.append(f"{name}: missing category")
        if re.search(r"\d", t.get("plain", "")):
            problems.append(f"{name}: definition has a digit (glossary must not assert numbers)")
    if problems:
        return False, f"{len(problems)} glossary problem(s): {'; '.join(problems[:6])}"
    return True, f"glossary.json well-formed -- {len(terms)} plain-language definitions, no numeric assertions"


_JARGON_SUFFIX = re.compile(
    r"\b[a-z]{4,}(osis|itis|emia|aemia|uria|pathy|plasia|trophy|algia|ectomy|otomy|graphy|"
    r"genic|lysis|stasis|sclerosis|megaly|penia|rrhea|rrhage|edema|oma|cele|plegia|otic)\b", re.I)
# common words + botanical scientific-name fragments (Fucus vesiculosis, Aristolochia
# clematitis) that match the suffix pattern but are NOT medical jargon to gloss
_JARGON_SKIP = {
    "diagnosis", "prognosis", "analysis", "emphasis", "osmosis", "symbiosis", "hypnosis",
    "homeopathy", "naturopathy", "osteopathy", "macrobiotic", "probiotic", "antibiotic",
    "hypoallergenic", "allergenic", "photography", "orthotic", "glucogenic", "ketogenic",
    "proteinogenic", "pathogenic", "bronchogenic", "bronchiogenic", "glycolysis", "hemolysis",
    "paralysis", "clematitis", "vesiculosis", "oklahoma",
}


def check_jargon_terms_glossed():
    """Term-gloss coverage guard (SESSION 39 Phase 1): every medical-jargon word (a latinate
    -osis/-itis/-emia/... term, minus a small common-word + botanical-fragment skip list) that
    appears in a front-facing claim_text SHOULD have a plain-language entry in glossary.json so
    the tooltip layer can explain it. Surfaced as a warning every board run so coverage grows and
    no un-glossed jargon is silently left behind (the heuristic can false-match a scientific name,
    so this warns rather than hard-blocks). memory: term-gloss-standard, perfect-entry-no-deferral."""
    gp = ROOT / "dashboard" / "assets" / "data" / "glossary.json"
    claims_dir = ROOT / "eden" / "corpus" / "claims"
    shards = sorted(claims_dir.glob("claims-*.json"))
    if not shards or not gp.exists():
        return True, "eden/corpus or glossary.json not installed (bootstrap-guard)"
    g = json.loads(gp.read_text(encoding="utf-8"))
    keys = set()
    for t in g.get("terms", []):
        keys.add(t["term"].lower())
        for a in t.get("aliases", []):
            keys.add(a.lower())
    gaps = {}
    for sh in shards:
        for c in json.loads(sh.read_text(encoding="utf-8")).get("claims", []):
            ct = c.get("claim_text") or ""
            for m in _JARGON_SUFFIX.finditer(ct):
                w = m.group(0).lower()
                if w in _JARGON_SKIP or w in keys:
                    continue
                gaps.setdefault(w, c["id"])
    if gaps:
        sample = ", ".join(f"{w} ({cid})" for w, cid in list(gaps.items())[:6])
        return False, (f"{len(gaps)} jargon term(s) in claim_text missing a glossary definition "
                       f"(add to glossary.json): {sample}{' ...' if len(gaps) > 6 else ''}")
    return True, f"all medical-jargon terms in claim_text have a glossary entry ({len(keys)} glossary keys)"


def check_book_source_clean():
    """Every book marked 'pristine' in eden/tools/purity-status.json must scan to 0
    unresolved defects (book_purity after its per-book baseline) — a purified source
    .txt can never silently regress. raw/purifying books are listed informationally.
    The Source-Purification campaign's 'never circle back to the same OCR' gate."""
    sys.path.insert(0, str(ROOT / "eden" / "tools"))
    import book_purity
    status_path = ROOT / "eden" / "tools" / "purity-status.json"
    if not status_path.exists():
        return True, "no purity-status.json — purification campaign not started"
    status = json.loads(status_path.read_text(encoding="utf-8")).get("books", {})
    regressions, note = [], []
    speller_ok = True
    for book_id, st in status.items():
        if st != "pristine":
            note.append(f"{book_id}={st}")
            continue
        n, findings, sp = book_purity.unresolved(book_id)
        speller_ok = speller_ok and sp
        note.append(f"{book_id}=PRISTINE:{n}")
        if n > 0:
            dets = ", ".join(sorted({f["detector"] for f in findings}))
            regressions.append(f"{book_id}: {n} unresolved ({dets})")
    if regressions:
        return False, "PRISTINE regression -- " + "; ".join(regressions)
    pristine = [b for b, s in status.items() if s == "pristine"]
    warn = "" if speller_ok else " [WARN: pyspellchecker unavailable -- spell detection skipped]"
    return True, f"{len(pristine)} pristine book(s) at 0 unresolved - {', '.join(note)}{warn}"


def check_mined_pages_clean():
    """Mined-page cleanliness gate (SESSION 44). Every screenshot page carrying a
    sealed claim, in a book that has entered the purification campaign (purity-status
    purifying|pristine), must be free of high-confidence OCR defects in its source
    .txt -- the tight, ~zero-false-positive classes: punctuation-spacing
    (space_before_punct / space_in_paren) and gibberish (repeated_char /
    post_marker_fragment, e.g. "eee", "Sei ee a"). This turns "clean the books as we
    go" from an advisory memory into a machine gate: a chunk cannot close having left
    detectable garbage on a page it mined -- prose is rationalizable, a red board is
    not. FP-heavy classes (spell proper nouns, run-togethers, double_space table
    alignment) are deliberately OUT of scope (whole-book pristine sweep); reading-order
    scrambles no detector can catch stay covered by the paste cross-check. Genuine FPs
    are triaged (with a reason) in eden/tools/mined-page-triage.json. Truth-anchored on
    sealed claim locators x deterministic book_purity detectors. memory:
    perfect-entry-no-deferral. Detail: eden/tools/mined_page_audit.py."""
    if not (ROOT / "eden" / "tools" / "mined_page_audit.py").exists():
        return True, "mined_page_audit.py not installed (bootstrap-guard)"
    sys.path.insert(0, str(ROOT / "eden" / "tools"))
    import mined_page_audit
    books = mined_page_audit.all_books()
    total = sum(len(v) for v in books.values())
    if total:
        parts = []
        for b, fs in books.items():
            if fs:
                s = fs[0]
                parts.append(f"{b}:{len(fs)} (e.g. Screenshot "
                             f"{mined_page_audit._page_of(s.get('source',''))} "
                             f"[{s['detector']}] {s['term']!r})")
        return False, (f"{total} OCR defect(s) on MINED source pages -- fix the source (or triage a "
                       f"genuine FP in mined-page-triage.json): {'; '.join(parts)} "
                       f"(run: python eden/tools/mined_page_audit.py audit). memory: perfect-entry-no-deferral")
    gated = ", ".join(sorted(mined_page_audit.gated_books())) or "(none)"
    return True, f"all mined source pages clean across campaign books [{gated}] (tight gibberish+spacing gate)"


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
        name="wallach_stance_verbatim_in_book",
        description="Every non-null wallach_stance.verbatim in essentials-targets.json appears (normalized) as a substring of the cited Eden book text",
        check_fn=check_wallach_stance_verbatim_in_book,
        truth_anchor="eden/corpus/books/*.txt (sealed corpus), de-hyphenated normalized substring match; same standard as corpus_verify #2 (verbatim ⊆ book) for claims",
        severity="critical",
        lesson_ref="SESSION 49 stance sweep — vit-K proved synthesized 'quotes' were presented as Wallach's words. Splitting the stance into summary (ours) + verbatim (his) and anchoring verbatim to the corpus makes fabrication un-shippable. Null verbatim (label-only sources) is allowed.",
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
    Invariant(
        name="creators_log_well_formed",
        description="every line of chronicle/creators-log/log.jsonl is a schema-valid Creator's Log entry (id/ts/surface/kind/summary, allowlisted kind, summary<=280)",
        check_fn=check_creators_log_well_formed,
        truth_anchor="tools/creators_log.py::verify_file() applied to chronicle/creators-log/log.jsonl — the same validator the CLI writer uses",
        severity="warning",
        lesson_ref="Creator's-Log file-mirror (logging-doctrine rule 6) — the §00 audit trail must stay machine-valid so the Phase-2 boot-merge can ingest it; defense-in-depth second layer over the CLI writer's write-time validation",
    ),
    Invariant(
        name="creators_log_append_only",
        description="the Creator's Log ledger is append-only — committed entries are never deleted, truncated, edited, or reordered (sacred covenant)",
        check_fn=check_creators_log_append_only,
        truth_anchor="git show HEAD:chronicle/creators-log/log.jsonl must be a line-prefix of the working file — git-committed history is the immutable anchor",
        severity="critical",
        lesson_ref="Creator's Log sacred covenant (logging-doctrine) — a broad delete authorization never includes the ledger; this is the git-anchored teeth that block any removal/mutation of a past entry at round-close",
    ),
    Invariant(
        name="build_log_append_only",
        description="chronicle/build-log.md is append-only — committed lines are never deleted, truncated, edited, or reordered (hardened 2026-07-04; appends always allowed)",
        check_fn=check_build_log_append_only,
        truth_anchor="git show HEAD:chronicle/build-log.md must be a line-prefix of the working file — git-committed history is the immutable anchor",
        severity="critical",
        lesson_ref="Luneth 2026-07-04: build-log had no append-only teeth (only §17 write-discipline), so a rewrite could silently truncate it. Mirrors creators_log_append_only so the public-teaching log layer is git-anchored too; a deliberate archival split must re-anchor in the same patch.",
    ),
    Invariant(
        name="no_dead_legacy_paths",
        description="no live code/data/active-doc references a severed pre-Eden legacy path (wallach-books, books-clean, wallach-refresh, transcripts-clean, podcast-transcripts, wallach-topic-notes, youngevity-product-notes, health-resources, catalog-index, corpus-index)",
        check_fn=check_no_dead_legacy_paths,
        truth_anchor="git ls-files contents scanned each run; immutable history (chronicle/, genesis/, dist/, legacy-dashboard.js, the embedded Creator's-Log/versions blocks) allowlisted -- it records the past, it is not a live reference",
        severity="critical",
        lesson_ref="Luneth 2026-07-04 full pre-Eden sever: the old book PDFs + transcript scraper + ingredient/stance generators were still poisoning the system (even feeding stale book text into the live dashboard). This guard makes re-introduction impossible -- 'no chance of them ever being referenced again' turned into a machine check per §00.B.",
    ),
    Invariant(
        name="no_operating_doc_contradiction",
        description="no operating doc (CLAUDE.md, .claude/rules/*.md, REVIEW.md) names an overhaul-DELETED structure (legacy dashboard js/css/host, the wild-west-mode rule) as live, nor points at a non-existent .claude/rules/*.md; the semantic 'contradicts the Charter's substance' half is a labeled WISH resting on the rules-audit discipline (R7)",
        check_fn=check_no_operating_doc_contradiction,
        truth_anchor="operating-doc bytes + os-level existence of every cited .claude/rules/*.md, scanned each run; living/planning docs (chronicle/, the blueprint, genesis/, next-chunk) are OUT of scope -- they narrate the deletions in past/planning tense",
        severity="critical",
        lesson_ref="Blueprint S8 / Phase A governance audit (Charter R1/R7) -- the rules that guide the work rot too; after the legacy-dashboard sever + wild-west-mode deletion, a machine gate keeps any operating doc from silently pointing a future session at a structure that no longer exists. Extends no_dead_legacy_paths from live-code to the doc surface; the semantic Charter-contradiction half stays a labeled WISH (no non-gaming machine check yet).",
    ),
    Invariant(
        name="creators_log_digest_synced",
        description="LOG.md equals the deterministic render of log.jsonl (the human view never drifts from the canonical ledger)",
        check_fn=check_creators_log_digest_synced,
        truth_anchor="tools/creators_log.py::render_digest() vs chronicle/creators-log/LOG.md",
        severity="warning",
        lesson_ref="Creator's Log sacred covenant — the generated human digest must always tell the same truth as the canonical jsonl; a hand-edit or missed regen is caught here",
    ),
    Invariant(
        name="creators_log_embed_synced",
        description="the dashboard build-time embed (dashboard/assets/data/creators-log-embed.json) equals the canonical ledger parsed to a JSON array (the in-app Creator's Log never drifts from log.jsonl)",
        check_fn=check_creators_log_embed_synced,
        truth_anchor="json.loads(dashboard/assets/data/creators-log-embed.json) == tools/creators_log.py::read_entries() over chronicle/creators-log/log.jsonl",
        severity="warning",
        lesson_ref="Creator's Log L2 (dashboard boot-merge) — the file:// app inlines the ledger at build; this catches a stale build or hand-edit that would make the in-app Profile log lie",
    ),
    Invariant(
        name="creators_log_bundle_synced",
        description="the BUILT bundle the browser loads (dashboard/assets/js/dist/main.js) carries the CURRENT ledger head — esbuild inlines the embed at build, so a log append without a rebuild leaves the in-app Profile log silently stale",
        check_fn=check_creators_log_bundle_synced,
        truth_anchor="the newest chronicle/creators-log/log.jsonl entry id appears verbatim in dashboard/assets/js/dist/main.js (the esbuild-inlined artifact the file:// app actually loads) — checks the BUILT artifact, not a source-vs-source pair",
        severity="critical",
        lesson_ref="2026-07-02 silent-log-staleness incident — 3 round-close entries fired into the ledger + source embed but were never rebuilt into the bundle; embed_synced stayed green (source==ledger) while the Profile panel showed nothing past 17:07. §00.B #11: pin the check to the artifact the user loads, not a stale-to-stale source pair",
    ),
    Invariant(
        name="creators_log_archive_synced",
        description="the navigable archive (chronicle/creators-log/INDEX.md + digests/YYYY-MM.md) matches what regenerates from log.jsonl — full-history human fidelity (LOG.md is the recent-window view)",
        check_fn=check_creators_log_archive_synced,
        truth_anchor="tools/creators_log.py::render_index()/render_month() vs INDEX.md + digests/*.md; month set derived from log.jsonl",
        severity="warning",
        lesson_ref="Creator's Log Chunk N (navigability) — as the ledger grows the full history lives in monthly digests; this keeps them + the index byte-true to the canonical jsonl so deep history never silently drifts",
    ),
    Invariant(
        name="legacy_css_contained",
        description="legacy-dashboard.css (the parked old dashboard, loaded after the v3 design system) must have ZERO bare element/universal selectors at any level — every element-level rule scoped under #legacy-workspace-host or :where(#legacy-workspace-host); :root holds custom properties only",
        check_fn=check_legacy_css_contained,
        truth_anchor="deterministic re-parse of dashboard/assets/styles/legacy-dashboard.css — every selector's first compound must be a class/id/pseudo/host-scope, never a bare element or '*'; recomputed each run, no stale-to-stale comparison",
        severity="critical",
        lesson_ref="2026-06-23 containment incident — legacy bare selectors (html/body 15px root, header veil, teal h2/table) bled into the new .app-* shell and cost a full session of eyeball-debugging; the fix had to become a machine gate (§00.B: discipline lives in tooling, not vigilance) so the leak can never silently recur as the file shrinks to its Round-5 death",
    ),
    Invariant(
        name="corpus_integrity",
        description="eden/corpus sealed claim graph is coherent — verbatim substrings real, book hashes anchored, slugs in canon, indices an honest derivation (delegates to corpus_verify.py; BOOTSTRAP passes pre-seal)",
        check_fn=check_corpus_integrity,
        truth_anchor="eden/tools/corpus_verify.py — substring/hash checks over eden/corpus/books bytes + *.golden.sha256; deterministic, cannot lie",
        severity="critical",
        lesson_ref="Wallach Knowledge Revamp Phase alpha (2026-06-24) — Eden gains a second sealed wing; the corpus is the single source of Wallach claim-truth and must fail loud on drift",
    ),
    Invariant(
        name="corpus_runtime_purity",
        description="dashboard dist/main.js carries no LLM / external-network markers — the LLM lives only at extraction time; the shipped app is pure offline-static",
        check_fn=check_corpus_runtime_purity,
        truth_anchor="grep of dashboard/assets/js/dist/main.js for LLM-SDK + API-endpoint markers",
        severity="critical",
        lesson_ref="Wallach Knowledge Revamp Phase alpha (2026-06-24) — L10 portability guarantee: extraction may use an LLM, the runtime never may (offline-forever)",
    ),
    Invariant(
        name="corpus_embed_synced",
        description="the dashboard build-time corpus embed (dashboard/assets/data/corpus-embed.json) equals a fresh projection of the sealed corpus (eden/tools/corpus_embed.py::build_embed) — the Knowledge drawer's claim graph never drifts from claims/*",
        check_fn=check_corpus_embed_synced,
        truth_anchor="json.loads(dashboard/assets/data/corpus-embed.json) == eden/tools/corpus_embed.py::build_embed() over the sealed indices + claim shards",
        severity="warning",
        lesson_ref="Wallach Knowledge Revamp Phase epsilon (2026-06-24) — the offline file:// dashboard inlines the sealed claim graph at build; this catches a stale build or hand-edit that would make the in-app Essential/Condition deep-dive lie",
    ),
    Invariant(
        name="search_only_indices_excluded",
        description="tier-2 'search-only' claims (Ch7 modality survey: color/light therapy, aromatherapy, faith-healing, etc.) never appear in the operational conditions/symptoms/essentials/other-substances indices that drive the Knowledge-drawer tabs -- they feed the offline search feature ONLY",
        check_fn=check_search_only_indices_excluded,
        truth_anchor="claim `search-only` tag (eden/corpus/claims/*) vs claim ids referenced by the sealed indices (eden/corpus/indices/*); independent of corpus_derive's own filter",
        severity="critical",
        lesson_ref="Wallach SESSION 12 (2026-06-28) — Luneth: baking modality name-drops (color->jaundice) into the conditions tab reads as AI slop + dilutes the 90-essentials solid-cure doctrine; tier-1 doctrine vs tier-2 search-only must stay separated (memory search-vs-operational-index-separation)",
    ),
    Invariant(
        name="verbatim_names_mapped_conditions",
        description="every claim shown under a condition names that condition (or a registered synonym) in its verbatim; NEW violations beyond the remediation baseline block the board",
        check_fn=check_verbatim_names_mapped_conditions,
        truth_anchor="sealed shard verbatims x derived conditions index (what surfaces under a condition), name-or-synonym via eden/tools/condition-synonyms.json; allowlist eden/tools/verbatim-audit-baseline.json",
        severity="critical",
        lesson_ref="SESSION 31 (2026-07-01) — Luneth: a quote shown under a condition must NAME it or the link is unverifiable; regressed because it was prose not a machine guard; memory verbatim-must-name-mapped-condition",
    ),
    Invariant(
        name="verbatim_over_soft_limit",
        description="informational: lists every verbatim over the 500 soft-limit (up to the 1200 hard ceiling) so allowed over-length excerpts stay visible for review; never fails (hard ceiling is corpus_verify #2)",
        check_fn=check_verbatim_over_soft_limit,
        truth_anchor="sealed shard verbatim lengths",
        severity="info",
        lesson_ref="SESSION 37 (2026-07-01) — Luneth: completeness of truth/education outranks a char limit; the 500 cap is a load-time/file-size guard, exceed it when needed, but ALWAYS inform; memory verbatim-length-rule",
    ),
    Invariant(
        name="umbrella_proxy_named",
        description="informational: lists every umbrella condition accepted as named-by-proxy because the verbatim names a child subtype (leukemia->cancer) via condition-taxonomy.json; keeps a human eye on each exception; never fails",
        check_fn=check_umbrella_proxy_named,
        truth_anchor="condition-taxonomy.json x sealed shard verbatims x conditions index",
        severity="info",
        lesson_ref="SESSION 37 (2026-07-01) — Luneth: keep specific subtypes as own tags AND surface under the umbrella; make logical child->parent exceptions but notify per case; memory condition-umbrella-taxonomy",
    ),
    Invariant(
        name="book_source_clean",
        description="every source book marked 'pristine' in eden/tools/purity-status.json scans to 0 unresolved defects (book_purity.py after its per-book baseline) -- a purified book's .txt can never silently regress; raw/purifying books listed informationally",
        check_fn=check_book_source_clean,
        truth_anchor="deterministic re-scan of the sealed book .txt each run (book_purity detectors + per-book purity-baselines allowlist); no stale-to-stale comparison",
        severity="critical",
        lesson_ref="Source-Purification campaign (2026-07-02) -- Luneth: we kept circling back because source .txt fixes were deferred; purify each book to pristine FIRST then GUARD it so we never re-fight the same OCR; memory book-source-purification-campaign",
    ),
    Invariant(
        name="mined_pages_clean",
        description="every screenshot page carrying a sealed claim (in a purifying/pristine campaign book) is free of high-confidence OCR defects in its source .txt (tight punctuation-spacing + gibberish classes); FP-heavy classes + reading-order scrambles are out of scope",
        check_fn=check_mined_pages_clean,
        truth_anchor="sealed claim locator.screenshot x deterministic book_purity detectors, re-scanned each run; genuine FPs triaged in eden/tools/mined-page-triage.json",
        severity="critical",
        lesson_ref="SESSION 44 (2026-07-04) -- Luneth: I keep catching you deferring OCR garbage on pages we just mined; advisory memories are rationalizable, so make it a red-board gate on the pages we actually touch; memory perfect-entry-no-deferral",
    ),
    Invariant(
        name="graphics_integrity",
        description="the sacred hand-made Wallach graphics (eden/graphics) match their sealed manifest hashes (delegates to graphics_verify.py; BOOTSTRAP passes pre-seal)",
        check_fn=check_graphics_integrity,
        truth_anchor="eden/tools/graphics_verify.py — raw-byte sha256 of each image vs graphics-manifest.json; manifest vs golden",
        severity="critical",
        lesson_ref="Wallach Knowledge Revamp Phase alpha (2026-06-24) — Wing 3; Luneth's user-authored Wallach-derived graphics admitted Tier-1 by source-owner authority (proposal section 8)",
    ),
    Invariant(
        name="claim_text_term_gloss",
        description="front-facing claim_text carries no garbled/obsolete botanical form or obscure common name that has a simpler approved alternative (eden/tools/term-gloss-lexicon.json); listed defects are also absent from verbatims",
        check_fn=check_claim_text_term_gloss,
        truth_anchor="eden/tools/term-gloss-lexicon.json {defects, common_swaps} scanned against every sealed claim_text (+ verbatim for defects)",
        severity="critical",
        lesson_ref="SESSION 39 (2026-07-02) -- Luneth mandate: every reader-facing term gets a minimal common gloss (common-word-first) and source nomenclature defects get fixed; enforce so summaries never drift back into a fixed loop; memory term-gloss-standard + perfect-entry-no-deferral",
    ),
    Invariant(
        name="glossary_wellformed",
        description="dashboard/assets/data/glossary.json parses; every entry has term+plain+category; terms unique; NO definition asserts a number/dose (plain-language reference only)",
        check_fn=check_glossary_wellformed,
        truth_anchor="dashboard/assets/data/glossary.json structural scan",
        severity="critical",
        lesson_ref="SESSION 39 (2026-07-02) -- glossary/tooltip layer Phase 1; plain-language term definitions carry no §00.A obligation but must never assert a number; memory term-gloss-standard",
    ),
    Invariant(
        name="jargon_terms_glossed",
        description="every medical-jargon word (latinate -osis/-itis/-emia/... minus common-word + botanical-fragment skips) in a claim_text has a plain-language entry in glossary.json; warns to force coverage growth",
        check_fn=check_jargon_terms_glossed,
        truth_anchor="_JARGON_SUFFIX matches in every sealed claim_text vs glossary.json keys+aliases",
        severity="warning",
        lesson_ref="SESSION 39 (2026-07-02) -- Luneth 'nothing behind me': glossary coverage guard so no un-glossed jargon slips; warning (heuristic can false-match a scientific name); memory term-gloss-standard + perfect-entry-no-deferral",
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
