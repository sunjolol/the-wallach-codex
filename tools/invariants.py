#!/usr/bin/env python3
"""
tools/invariants.py — declarative manifest of system-level invariants.

Built after a source-truncation audit, on the principle that the system should
DETECT what could be going wrong rather than spot-fix each failure as it
surfaces.

Each invariant has:
  - name        : stable identifier
  - description : one-line plain-English statement
  - check_fn    : callable returning (passed: bool, message: str)
  - truth_anchor: what the check is verified AGAINST (the external truth source)
  - severity    : 'critical' | 'warning' | 'info'
  - lesson_ref  : the rule or incident this check came from
  - cadence     : 'daily' | 'weekly'. NOTE: nothing currently declares 'weekly',
                  so every invariant runs on the daily board and --weekly is a no-op.

Engineering doctrine principle 11: every check pins to a truth
anchor that can't itself drift. Stale-to-stale equality is not truth.

Adding a new invariant:
  1. Write the check_fn (returns (bool, str))
  2. Append an Invariant entry to INVARIANTS below
  3. Reference the lesson/decision/protocol it ties back to in lesson_ref

Promotion gate (engineering-doctrine §6 — verifiable invariants): whenever a
new pitfall is recorded in the chronicle or a `.claude/skills/` file, the same
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
import unicodedata
from decimal import Decimal
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
    # WHAT this gate anchors to. NO DEFAULT, deliberately: a new invariant that does not
    # declare its anchor class fails at import, so this can never be forgotten the way a
    # documentation rule would be. It exists because a bare "N of N green" was being read as
    # a statement about WALLACH, when most of the board only ever proved our own files agree
    # with each other. A single integer laundered bookkeeping into confidence. The board is
    # excellent at proving nothing DRIFTED and weak at proving anything is RIGHT; the score
    # must say which. (The count itself is derived, never written down here -- a total in
    # prose is one gate away from being false.)
    #   'external'    — anchored to something OUTSIDE our own hand-maintained data: Wallach's
    #                   book bytes, a known physical constant, or git-committed history. Only
    #                   these can catch a value that is WRONG BUT CONSISTENT with our files.
    #   'consistency' — our file A vs our file B (derived == regenerate(source), embed ==
    #                   ledger, hash == golden). Catches DRIFT. Cannot catch a value that was
    #                   wrong when it was written: it would be wrong in both places.
    #   'structural'  — shape/wellformedness only (parses, resolves, no prose in a fact
    #                   field). Says nothing about whether a value is correct.
    #   'meta'        — checks a DOCUMENT about the gates, or guards a currently-empty set.
    anchor_class: str
    lesson_ref: str = ""
    cadence: str = "daily"        # 'daily' | 'weekly'


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------


def _file_hash(path) -> str:
    """SHA-256 of RAW file bytes (empty string if file missing).

    Correct for BINARY sealed canonicals (eden/graphics/*.jpg — `.gitattributes` marks them
    `binary`, so git never EOL-converts them and raw bytes are clone-stable by construction).
    WRONG for a sealed TEXT file: see _lf_file_hash below."""
    p = pathlib.Path(path)
    if not p.exists():
        return ""
    return hashlib.sha256(p.read_bytes()).hexdigest()


def _lf_file_hash(path) -> str:
    """SHA-256 of LF-NORMALIZED UTF-8 content (empty string if file missing).

    The hash for a sealed TEXT canonical. Matches eden/tools/{corpus,catalog,products}_seal.py's
    lf_sha256() — one hash for the same content regardless of the working tree's line endings.

    WHY THIS EXISTS (2026-07-15). design_system_hash_integrity used _file_hash (raw bytes) on
    design-system.css. The css is CRLF in this working tree but git stores the blob LF
    (`git ls-files --eol` -> `i/lf w/crlf`), and core.autocrlf=input does not convert on
    checkout. So the golden held 37c338b7... — the hash of a byte sequence GIT HAS NEVER
    STORED — and the gate was green ONLY on the machine that sealed it. Any fresh clone
    computes 037d0e3e... and REDs a critical gate, reading as seal TAMPERING rather than an
    EOL artifact. Every other sealed-text gate (corpus/catalog/products) already LF-normalized;
    this one was the sole holdout. Re-sealed to the LF digest in the same patch.

    NOT a loosening: the digest still changes on any real content edit. It stops changing
    only for a difference git itself does not record."""
    p = pathlib.Path(path)
    if not p.exists():
        return ""
    text = p.read_bytes().replace(b"\r\n", b"\n").replace(b"\r", b"\n")
    return hashlib.sha256(text).hexdigest()


def _read_via_os(path) -> bytes:
    """Read a file's TRUE disk bytes via low-level os.open + os.read.

    ★ O_BINARY is load-bearing, not decoration. On Windows os.open defaults to TEXT mode,
    so os.read silently translates CRLF -> LF. Without this flag the read applied the SAME
    newline translation as the write it was meant to audit, which is how this canary stayed
    green for months while safe_write rewrote every LF payload to CRLF on disk. A truth
    anchor that shares the defect under test is not a truth anchor.
    os.O_BINARY does not exist on POSIX, where no translation happens either way."""
    fd = os.open(str(path), os.O_RDONLY | getattr(os, "O_BINARY", 0))
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
    """Round-trip a known payload through safe_write and verify the TRUE DISK BYTES
    match it exactly, via os.open(O_BINARY) + os.read.

    The payload deliberately carries all three newline forms and a non-ASCII character.
    Each guards a way this primitive has actually failed (all three reproduced 2026-08-03):

      LF / CRLF  safe_write read and wrote in Python's translated-newline space, so it
                 rewrote every LF file to CRLF while its own verify passed. A CRLF -> LF
                 repair was structurally impossible through it: the replacement happened
                 in LF space and the write re-CRLF'd it, yielding a byte-identical file
                 and a cheerful OK.
      lone CR    survives a translated write but reads back as LF -- same length, different
                 content, which is the 'intended=NB landed=NB' on a FAILING check.
      non-ASCII  makes len(str) != len(bytes), so a size counted in characters but labelled
                 'B on disk' can no longer masquerade as a byte count.

    Doctrine §1 (no silent failures) applied to the write primitive itself."""
    sys.path.insert(0, str(ROOT / "tools"))
    from safe_write import safe_rewrite, SafeWriteError

    probe_path = ROOT / "tools/canaries/safe-write-probe.txt"
    probe_path.parent.mkdir(parents=True, exist_ok=True)

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    nonce = hashlib.sha256(str(datetime.datetime.now()).encode()).hexdigest()[:16]
    payload = (
        f"safe-write-canary {now_iso} nonce={nonce}\n"
        "lf-terminated\n"
        "crlf-terminated\r\n"
        "lone-cr\rafter-lone-cr\n"
        "non-ascii · § —\n"
    )
    expected = payload.encode("utf-8")

    try:
        reported = safe_rewrite(probe_path, payload)
    except SafeWriteError as e:
        return False, f"safe_write raised: {e}"

    raw = _read_via_os(probe_path)
    if raw != expected:
        def _eol(b: bytes) -> str:
            crlf = b.count(b"\r\n")
            return (f"crlf={crlf} lf={b.count(chr(10).encode()) - crlf} "
                    f"lone_cr={b.count(chr(13).encode()) - crlf}")
        return False, (
            f"DISK BYTES != intent -- intended {len(expected)}B ({_eol(expected)}), "
            f"on disk {len(raw)}B ({_eol(raw)}). safe_write is translating newlines."
        )

    if reported != len(expected):
        return False, (
            f"safe_write reported {reported} for a {len(expected)}-byte file -- the return "
            f"value is a CHARACTER count printed as 'B on disk'. Never compare it to a byte "
            f"count from another tool."
        )

    return True, (f"byte-exact round-trip OK ({len(expected)}B; LF, CRLF and lone CR all "
                  f"preserved; reported size is true bytes)")


def check_tools_py_parse():
    """All .py files in tools/ must parse via ast. Catches Edit-tool-style
    silent truncation of a Python source file by an editing tool."""
    tools_dir = ROOT / "tools"
    failures = []
    count = 0
    for py in tools_dir.rglob("*.py"):
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
    """All .py files in tools/ must contain zero NUL bytes. Catches a file-writer
    padding bug: a write produced a Python source file with ~1 KB of trailing
    NULs past the real content, which passed cat/size checks but failed
    ast.parse with 'source code string cannot contain null bytes'. Truth anchor:
    byte-level scan via Path.read_bytes() — an independent surface from the
    writer's own in-memory cache (doctrine principle 11)."""
    tools_dir = ROOT / "tools"
    failures = []
    count = 0
    for py in tools_dir.rglob("*.py"):
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
    """Every JSON file under dashboard/assets/data must parse. Catches silent
    truncation of a data file by an editing tool — a half-written JSON blob that
    still looks plausible on disk but breaks the surface that loads it."""
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
    """Scan tools/*.py for cross-platform anti-patterns. Uses AST (not regex)
    so violations inside docstrings / string literals are correctly
    ignored — they're documentation, not code.

    Patterns flagged:
    1. open() call without encoding= keyword arg in text mode
    2. strftime() call with arg containing %-I / %-d / %-m / %-H / etc.
    3. datetime.utcnow() call
    4. subprocess.run/Popen call with literal "python3" in args

    Every one of these is invisible on Linux and breaks the moment the
    toolchain runs on Windows. This invariant prevents recurrence."""
    tools_dir = ROOT / "tools"
    violations = []

    # No file-level exemption — the check applies to itself (invariants.py).
    # Stronger discipline: the invariant file shouldn't violate its own rule.
    DOC_FILES = set()
    ONE_SHOT_PREFIX = "round"      # one-shot recovery scripts. No file in tools/ carries
                                   # this prefix today, so the skip below never fires.

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

    for py in sorted(tools_dir.rglob("*.py")):
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


def check_no_native_dialogs():
    """No native browser dialogs (prompt/confirm/alert) in dashboard.html.
    A blocking native dialog is unstyleable, unthemeable, and freezes the page;
    the rule was broken twice under discipline alone, so it is a gate.

    Method: mask non-JS script blocks (markdown / JSON-data embeds), then scan
    the remaining inline JS for prompt(/confirm(/alert( calls. String literals
    and comments are excluded only heuristically, so false positives are
    possible; suppress a known-OK site with a trailing `// no_native_dialogs: ok`.

    KNOWN SCOPE LIMIT — read this before trusting a green: this scans ONLY
    dashboard.html. That file is now a pure shell with a single external
    <script src> and no inline JS, so this gate is currently VACUOUS. It does
    not read dashboard/assets/js/src/**/*.ts or the built dist/main.js, where
    all application code actually lives. Widen the scan to src/ before citing
    this gate as proof that the app raises no native dialogs.

    Truth anchor: source-text scan of dashboard.html."""
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
        f"{len(hits)} native dialog call(s) detected — a blocking native dialog is "
        f"unstyleable and freezes the page. Use the view's own in-page confirm/toast "
        f"UI instead. Sample: {sample}"
    )


# ---------------------------------------------------------------------------
# Product vault — composition-only gate
# ---------------------------------------------------------------------------
# An earlier product subsystem carried scraped marketing prose, and that prose
# leaked into the corpus. It was deleted wholesale. The product vault now derives
# from the SEALED Products pillar (products.json, guarded by
# products_hash_integrity) as COMPOSITION ONLY -- what a product contains, never
# what it claims to do. This gate is the enforcement half of that severance:
# marketing prose can never re-enter the vault.
_VAULT_ARTIFACT = "dashboard/assets/data/regimen-label-lookup.json"
_VAULT_PROSE_KEYS = {
    "what_it_does", "tagline", "features", "description", "brand_tier",
    "dose_text", "non_essentials_parsed", "summary", "blurb", "marketing",
}
_VAULT_PRODUCT_KEYS = {"canonical_name", "nutrients"}
_VAULT_NUTRIENT_KEYS = {"name", "amount", "unit"}
_DETAIL_ARTIFACT = "dashboard/assets/data/product-detail-data.json"


def _walk_forbidden_keys(node, hits, path=""):
    """Recurse an arbitrary JSON node; record every dict KEY that is a known
    marketing-prose field. For the rich product-DISPLAY artifact, whose full
    label structure can't take a strict allowlist -- but a marketing key
    anywhere is still RED (stops the price join re-importing a description)."""
    if isinstance(node, dict):
        for k, v in node.items():
            sub = f"{path}/{k}" if path else str(k)
            if k in _VAULT_PROSE_KEYS:
                hits.append(sub)
            _walk_forbidden_keys(v, hits, sub)
    elif isinstance(node, list):
        for i, v in enumerate(node):
            _walk_forbidden_keys(v, hits, f"{path}[{i}]")


def check_no_product_marketing_prose():
    """The product SURFACES must be COMPOSITION ONLY -- no marketing prose can
    re-enter. Deleting the subsystem that leaked it removed the leak; this gate is
    what makes the removal permanent. Two artifacts:
    (1) the slim vault (regimen-label-lookup.json) = {canonical_name,
    nutrients:[{name, amount, unit}]} under a STRICT key-allowlist (any extra key
    is RED); (2) the rich display artifact (product-detail-data.json) carries the
    whole label structure, so it is scanned for any marketing-prose KEY anywhere
    (what_it_does / tagline / description / ...) -- which stops the price join from
    ever re-importing prices.json's stripped description."""
    art = ROOT / _VAULT_ARTIFACT
    if not art.exists():
        return True, f"{_VAULT_ARTIFACT} missing (bootstrap-guard)"
    data = json.loads(art.read_text(encoding="utf-8"))
    products = data.get("products", {})
    problems = []
    for pid, rec in products.items():
        if not isinstance(rec, dict):
            problems.append(f"{pid}: record is not an object")
            continue
        extra = set(rec.keys()) - _VAULT_PRODUCT_KEYS
        if extra:
            prose = extra & _VAULT_PROSE_KEYS
            problems.append(f"{pid}: {'MARKETING-PROSE ' if prose else ''}unexpected key(s) {sorted(extra)}")
        for row in rec.get("nutrients", []) or []:
            if not isinstance(row, dict):
                problems.append(f"{pid}: a nutrient row is not an object")
                continue
            nextra = set(row.keys()) - _VAULT_NUTRIENT_KEYS
            if nextra:
                problems.append(f"{pid}: nutrient {row.get('name', '?')!r} unexpected key(s) {sorted(nextra)}")
    # The rich product-DISPLAY artifact carries the whole label structure, so it
    # can not take a strict allowlist -- instead RED-flag any marketing-prose KEY
    # anywhere in it (stops the price join re-importing prices.json's description).
    detail = ROOT / _DETAIL_ARTIFACT
    if detail.exists():
        dhits = []
        _walk_forbidden_keys(json.loads(detail.read_text(encoding="utf-8")).get("products", {}), dhits)
        for h in dhits:
            problems.append(f"{_DETAIL_ARTIFACT}: MARKETING-PROSE key '{h}'")
    if problems:
        return False, (
            f"product surfaces carry {len(problems)} marketing/non-composition field(s) -- "
            f"prose must never re-enter the product data: "
            + "; ".join(problems[:6]) + (" ..." if len(problems) > 6 else "")
        )
    return True, (
        f"product surfaces composition-only -- vault ({len(products)} products, strict "
        f"key-allowlist) + detail artifact (no marketing-prose key anywhere); no prose re-entry"
    )


# ---------------------------------------------------------------------------
# Design-system invariants
# ---------------------------------------------------------------------------
# Three paired daily invariants guard the design system. They ENFORCE — there is
# no mode knob, and there must never be one again.
#
# WHY NO KNOB. These three once read an enforcement 'mode' from a feature-flag
# file. That file was deleted; the lookup hit a bare `except` and defaulted to
# "warn"; and in warn mode the shared finalizer converted every violation into a
# PASS. Three invariants declared severity="critical" were STRUCTURALLY INCAPABLE
# of reddening the board — a forged hash mismatch returned (True, "WARN ...does
# not match golden..."). A knob whose off-switch is a missing file is not a knob,
# it is a disarm. Default-permissive on a missing config is the bug.


def _ds_finalize(violations, success_msg):
    """Violations -> FAIL. No violations -> PASS. No mode, no escape hatch."""
    if not violations:
        return True, success_msg
    payload = "; ".join(violations[:5])
    if len(violations) > 5:
        payload += f" (+{len(violations)-5} more)"
    return False, f"{len(violations)} violation(s) — {payload}"


def check_no_external_style_resources():
    """Scan dashboard.html + dashboard/assets/styles/*.css for external
    style/font/script imports. The 'no external resources' rule is the
    foundation of long-term portability: the app opens from file:// and must
    never depend on a host that can disappear.

    The regexes below carry a negative-lookahead carve-out for
    cdn.jsdelivr.net/npm/tesseract. It is UNUSED today -- the Scanner's OCR
    engine is vendored at dashboard/assets/vendor/tesseract/ and no scanned
    file references the CDN. Remove the carve-out rather than let anything
    grow back into it."""
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
    # markdown text that *mentions* external URLs in prose or code samples
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
        "no external style/font/script resources detected — portability rule clean",
    )


def check_design_system_hash_integrity():
    """Verify design-system.css matches design-system.golden.sha256.
    If the golden hash file doesn't exist yet (pre-sealing), informational
    PASS — the file hasn't been sealed for protection yet.

    Hashes LF-NORMALIZED content (_lf_file_hash), matching every other sealed-text gate.
    See _lf_file_hash for why: until 2026-07-15 this hashed RAW bytes, so the golden recorded
    a CRLF digest git had never stored and this critical gate would RED on any fresh clone."""
    css_path = ROOT / "dashboard" / "assets" / "styles" / "design-system.css"
    hash_path = ROOT / "dashboard" / "assets" / "styles" / "design-system.golden.sha256"

    if not css_path.exists():
        return _ds_finalize(["design-system.css missing — the sealed stylesheet is absent"], "")

    if not hash_path.exists():
        return True, "design-system.golden.sha256 not yet present — file unsealed (expected during early migration rounds)"

    expected = hash_path.read_text(encoding="utf-8").strip().split()[0]
    actual = _lf_file_hash(css_path)
    if actual != expected:
        # Name the EOL suspect explicitly. A bare "hash mismatch" on a SEALED CANONICAL reads
        # as tampering, and that misdiagnosis is expensive; if the raw-byte digest matches the
        # golden while the LF digest does not, the golden is a stale pre-2026-07-15 raw seal,
        # not an edit. Say which it is instead of making the next reader guess.
        hint = ""
        if _file_hash(css_path) == expected:
            hint = (" — NOTE: the golden matches this file's RAW-BYTE hash but not its "
                    "LF-normalized hash, so this is a stale raw-byte seal (pre-2026-07-15), "
                    "NOT a content edit. Re-seal to the LF digest.")
        return _ds_finalize(
            [f"design-system.css hash {actual[:16]}... does not match golden "
             f"{expected[:16]}...{hint}"],
            "")
    return True, f"design-system.css matches golden hash ({expected[:16]}..., LF-normalized)"


def check_design_system_write_protection():
    """design-system.css is a SEALED CANONICAL (user-only writer). This gate anchors the
    GOLDEN ITSELF to git: the working golden must equal the git-committed golden.

    WHY THIS, AND NOT THE OBVIOUS THING. hash_integrity proves css == golden. It is
    structurally BLIND to the tamper that actually matters: an agent edits the css AND
    re-seals the golden -- both files move together, hash_integrity stays green, and the
    user's sole-writer rule is broken invisibly. Only an anchor OUTSIDE the pair can see
    that (stale-to-stale equality is not truth; the same lesson that produced
    creators_log_append_only's git anchor). git is that outside: HEAD's golden is a value
    the working tree cannot rewrite without a commit the user can see.

    A legitimate re-seal is a USER act and lands as a committed golden change -- so this
    goes green the moment the user commits their re-seal, and RED only while a golden is
    changed-but-uncommitted. That is the correct shape: it does not forbid re-sealing, it
    forbids re-sealing SILENTLY.

    REPLACED -- re-codified with proof, never loosened. The old check compared
    MTIMES: `css_mtime > seal_mtime + 1`. Two defects, both fatal:
      (1) mtime is a LYING INSTRUMENT -- it moves on a touch, a git checkout, a no-op save.
          It was reporting a live "violation" (css touched 2 min after the golden was
          written) while the content hash MATCHED. The finding was noise.
      (2) it was strictly REDUNDANT with hash_integrity anyway: if the content is equal no
          write happened, and if it differs hash_integrity already REDs. It could never
          contribute a finding that gate did not already have.
    And the warn-mode escape hatch (also deleted 2026-07-15) meant nobody ever noticed it
    was firing, because "OK [critical]" was printed above the violation text.

    NOT covered (WISH, R7 -- do not sell as guarded): whether a committed golden change was
    genuinely authored BY the user. git proves a re-seal is visible + deliberate; it cannot
    prove who typed it. The pre_write_guard hook (which blocks any write to a file carrying
    a *.golden.sha256 sibling) is the enforcement half; this is the audit half.
    Truth anchor: `git show HEAD:<golden>` vs the working golden, recomputed each run."""
    hash_path = ROOT / "dashboard" / "assets" / "styles" / "design-system.golden.sha256"
    css_path = ROOT / "dashboard" / "assets" / "styles" / "design-system.css"
    rel = "dashboard/assets/styles/design-system.golden.sha256"

    if not hash_path.exists():
        return True, "no golden hash present — file unsealed, write-protection not yet active"
    if not css_path.exists():
        return _ds_finalize(["design-system.css missing entirely"], "")

    working = hash_path.read_text(encoding="utf-8").strip().split()[0]
    try:
        out = subprocess.run(["git", "show", f"HEAD:{rel}"], cwd=str(ROOT),
                             capture_output=True, text=True, timeout=20)
    except Exception as e:
        return _ds_finalize([f"cannot reach the git anchor ({e}) — fail closed"], "")
    if out.returncode != 0:
        # Not yet committed: nothing to anchor against. Say so plainly rather than
        # pretending the seal is verified (this is the honest bootstrap path, not a pass).
        return True, f"golden not yet committed — no git anchor to compare (unverified, not proven)"
    committed = out.stdout.strip().split()[0] if out.stdout.strip() else ""
    if working != committed:
        return _ds_finalize(
            [f"design-system.golden.sha256 CHANGED but not committed: working "
             f"{working[:16]}... vs HEAD {committed[:16]}... — the seal was moved. A re-seal "
             f"is the user's act and must be committed deliberately; an agent re-sealing to "
             f"match its own css edit is exactly what this catches"], "")
    return True, (f"golden matches its git anchor ({committed[:16]}...) — the seal has not "
                  f"been silently moved")


def check_dashboard_dist_fresh():
    """The build artifact dashboard/assets/js/dist/main.js must be newer than
    every dashboard/assets/js/src/**/*.ts file. If the dist is stale, the
    runtime contract (what the browser loads) has drifted away from the
    canonical TypeScript source. dist/main.js is a BUILD ARTIFACT — never edit it;
    edit src/ and run `node tools/build.mjs`.

    The bootstrap branches below (no src/ directory, no .ts files) exist so a
    fresh or partial checkout does not RED on a check that has nothing to
    compare."""
    dist_path = ROOT / "dashboard" / "assets" / "js" / "dist" / "main.js"
    src_dir = ROOT / "dashboard" / "assets" / "js" / "src"

    if not dist_path.exists():
        return False, f"dist/main.js missing — run `node tools/build.mjs`"
    if not src_dir.exists():
        return True, "no src/ directory present — freshness check skipped (bootstrap)"

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
            f"Run `node tools/build.mjs` to rebuild."
        )
    return True, f"dist/main.js fresh — {len(ts_files)} .ts files, all older than dist"


# ---------------------------------------------------------------------------
# The manifest
# ---------------------------------------------------------------------------

def _max_inline_literal_elements(src: str) -> int:
    """Heuristic scan for the largest DATA literal in TS source, by top-level element count.
    Ignores string + comment content and () call args. Not a parser — a cheap backstop for the
    §00.B 'no inline data' rule. Returns the max element estimate (top-level commas + 1).

    ★ TIGHTENED — IT COUNTED STRUCTS AS DATA. Every `{...}` was measured by its
    top-level comma count, so a RECORD SHAPE scored the same as a data blob. A tile
    object in state/coverage.ts sat at exactly 10 — the limit — purely because it has
    10 fields; adding two more tripped a §00.B "inline data" RED on a struct
    containing no data at all.
    That is a misfire, and the rule it enforces does not say "no object may have 11 fields".

    THE DISTINCTION NOW DRAWN, and why it is the right one. The rule exists to stop CANONICAL
    DATA living in views/state (the 2026-06-21 incident: 91 hardcoded tile specs in
    views/coverage.ts slipped past lint across two rounds). Those specs looked like
    `[{ name: 'Calcium', sym: 'Ca', num: 20 }, ...]` — every value a literal constant. A struct
    looks like `{ tileId: buildTileId(x), status: classify(...), covered: s === 'covered' }` —
    every value an expression computed at runtime. So:
      - ARRAY literals always count. A long array in views/state is data by construction, and
        the incident case was an array. Unchanged, deliberately — this is the load-bearing half.
      - OBJECT literals count ONLY when at least HALF their top-level values are literal
        constants (string/number/boolean/null). A record of computed expressions is a shape,
        not a payload, and moving it to assets/data/ would be nonsense.
    Proven by tools/tests/test_views_state_no_inline_data.py: the 91-spec blob the rule was WRITTEN
    for still REDs (both as an array and as a >10-key literal map), while the tile struct passes.
    NOT a loosening — the data cases it was built to catch all still fire; only the shape cases
    it was never aimed at stop firing.

    KNOWN LIMIT (honest, per R7): the 50% threshold is a heuristic, not a parser. A blob whose
    values are half computed (`{ name: 'Calcium', target: TARGETS.ca }` × 40) would slip. The
    array half catches the realistic shape of that mistake, and `derived_artifacts_fresh` +
    `data_artifacts_accounted` are the real defence for canonical data. This is a backstop.
    """
    max_elems = 0
    # frame: [bracket, commas, dirty_since_comma, count_this, vals_total, vals_literal,
    #         key_colon_seen_since_comma, expecting_value]
    stack = []
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
                _note_value(stack[-1], is_literal=True)
                stack[-1][2] = True
            in_str = c
        elif c in "[{(":
            if stack:
                # An object/array/call STARTING a value means the value is not a scalar literal.
                _note_value(stack[-1], is_literal=False)
                stack[-1][2] = True
            count_this = True
            if c == "{" and not stack:
                stmt = src[src.rfind(";", 0, i) + 1:i]
                if re.match(r"\s*(?:import|export)\b", stmt) and "=" not in stmt:
                    count_this = False
            stack.append([c, 0, False, count_this, 0, 0, False, False])
        elif c in "]})":
            if stack:
                fr = stack.pop()
                ch, commas, dirty, count_this = fr[0], fr[1], fr[2], fr[3]
                vals_total, vals_literal = fr[4], fr[5]
                if ch in "[{" and count_this:
                    if ch == "{":
                        # DATA MAP vs STRUCT: a payload's values are literal constants; a
                        # record's are expressions. No key:value pairs at all (a shorthand
                        # struct, or a block) is likewise not a payload.
                        is_data = vals_total > 0 and vals_literal * 2 >= vals_total
                    else:
                        is_data = True  # array literal — always measured
                    if is_data:
                        elems = commas + (1 if dirty else 0)
                        if elems > max_elems:
                            max_elems = elems
        elif c == "," and stack and stack[-1][0] in "[{":
            stack[-1][1] += 1
            stack[-1][2] = False
            stack[-1][6] = False   # next colon in this frame is a KEY colon again
            stack[-1][7] = False
        elif c == ":" and stack and stack[-1][0] == "{" and not stack[-1][6]:
            # The FIRST colon after a comma is the key's. Later colons at the same depth are
            # ternaries (`x: isPdm ? a : b`) and must not be read as another key.
            stack[-1][6] = True
            stack[-1][7] = True
            stack[-1][2] = True
        elif (not c.isspace()) and stack:
            if c.isdigit() or src.startswith(("true", "false", "null"), i):
                _note_value(stack[-1], is_literal=True)
            else:
                _note_value(stack[-1], is_literal=False)
            stack[-1][2] = True
        i += 1
    return max_elems


def _note_value(frame, is_literal):
    """Classify the first token of a `{` frame's value as a literal constant or an expression.
    No-op unless that frame is awaiting a value (i.e. we just passed its key colon)."""
    if frame[0] != "{" or not frame[7]:
        return
    frame[4] += 1
    if is_literal:
        frame[5] += 1
    frame[7] = False


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
    """Every line of chronicle/creators-log/log.jsonl is a schema-valid Creator's
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
    """chronicle/build-log.md is append-only, on the same footing as the Creator's
    Log: an editable build log is not a record. The committed file
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
    history is allowlisted -- chronicle/, generated dist/, this file's own token
    list, and the embedded Creator's-Log block inside dashboard.html (past-tense
    record, stripped before scanning). It records the past; it is not a live
    reference. Truth anchor: git-tracked file contents, scanned each run."""
    import subprocess
    FORBIDDEN = ["wallach-books", "books-clean", "wallach-refresh", "transcripts-clean",
                 "podcast-transcripts", "wallach-topic-notes", "youngevity-product-notes",
                 "health-resources", "catalog-index", "corpus-index"]
    # The record of the past is allowed to name a severed path; live code is not.
    ALLOW_PREFIXES = ("chronicle/",
                      "dashboard/assets/data/creators-log",
                      "dashboard/assets/js/dist/",
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
    live, nor point at a guidance file that no longer exists. Operating docs = the
    steady-state contract a future session runs under: CLAUDE.md, REVIEW.md, and
    every .claude/skills/*/SKILL.md. This extends no_dead_legacy_paths (which guards
    LIVE CODE against severed pre-Eden paths) to the DOC surface for the overhaul's
    own severances -- the deleted legacy dashboard (js/css/host) and the deleted
    wild-west-mode rule. Two machine-checkable halves:
      (1) forbidden-token scan -- an operating doc naming a deleted structure is a
          stale pointer that would send a future reader to something that is gone;
      (2) guidance-pointer resolution -- every `.claude/skills/<name>` and every
          legacy `.claude/rules/<name>.md` an operating doc cites must resolve on
          disk (a dangling pointer = a deleted/renamed rule the doc never got
          reconciled to). The `.claude/rules/` directory itself no longer exists;
          that spelling is still resolved so a leftover pointer to it is caught
          rather than silently ignored.
    NOT covered (a labeled WISH -- do NOT sell it as guarded): the SEMANTIC half, a
    doc that contradicts the Charter's SUBSTANCE without naming a deleted structure
    (e.g. asserting a retired policy as current). That has no non-gaming machine
    check; it rests on review discipline. Living/planning docs that legitimately
    narrate the deletions in past or planning tense (anything under chronicle/)
    are OUT of scope by design -- scanning them would flag correct history. Truth anchor: operating-doc
    bytes + os-level file existence, recomputed each run."""
    forbidden = ["legacy-dashboard", "legacy-workspace-host", "wild-west-mode"]
    skills_dir = ROOT / ".claude" / "skills"
    legacy_rules_dir = ROOT / ".claude" / "rules"
    docs = ([ROOT / "CLAUDE.md", ROOT / "REVIEW.md"]
            + sorted(skills_dir.glob("*/SKILL.md")))
    # Both spellings resolve: a `.claude/skills/<name>` pointer must have a SKILL.md,
    # and any surviving `.claude/rules/<name>.md` pointer must still resolve on disk.
    # The rules form is kept ONLY so a stale pointer left behind by the 2026-08-03
    # skills migration is caught rather than silently ignored.
    skill_ref_re = re.compile(r"\.claude/skills/([A-Za-z0-9_-]+)")
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
        for m in skill_ref_re.finditer(text):
            if not (skills_dir / m.group(1) / "SKILL.md").exists():
                dangling.append(f"{rel}->.claude/skills/{m.group(1)}")
        for m in rule_ref_re.finditer(text):
            if not (legacy_rules_dir / m.group(1)).exists():
                dangling.append(f"{rel}->.claude/rules/{m.group(1)}")
    # An EMPTY skills dir means the domain guidance vanished, not that it is clean.
    # Without this the gate would go green precisely BECAUSE its subject was deleted --
    # the "a gate can be green because of the defect" failure mode.
    if not sorted(skills_dir.glob("*/SKILL.md")):
        return False, (".claude/skills/ holds no SKILL.md — the on-demand domain "
                       "guidance is missing entirely; this gate must not pass vacuously")
    problems = token_hits + dangling
    if problems:
        return False, (
            f"{len(problems)} operating-doc contradiction(s) — a doc cites a "
            f"deleted structure or a non-existent skill/rule file: "
            + "; ".join(problems[:6]) + (" ..." if len(problems) > 6 else "")
        )
    return True, (
        f"{scanned} operating docs clean — no deleted-structure token "
        f"({len(forbidden)} guarded), no dangling .claude/skills or .claude/rules pointer"
    )


def check_board_claims_match_reality():
    """CLAUDE.md's own account of the board must match the board.

    §00.B rule 1 -- no canonical value lives in two hand-maintained places. The gate total
    and the external-anchor count are COMPUTED here and RETYPED in CLAUDE.md's "What a green
    board actually means" section: exactly the two-homes shape that rots. It did. The
    contract has drifted before: gates were added to the board while CLAUDE.md went
    on quoting the older totals.

    That section is the one place the contract explains what a green board is WORTH, so a
    stale number there misstates the size of the only anchor class that can catch a value
    which is wrong but consistent with our own files. Understating it is not a harmless typo.

    Both claims must be PRESENT and CORRECT. A reworded sentence is RED, not a silent pass --
    otherwise this gate would go green precisely BECAUSE its subject vanished, which is the
    failure mode the sweep hit twice.

    Truth anchor: our own INVARIANTS registry vs CLAUDE.md bytes, recomputed each run. This is
    a CONSISTENCY gate: it proves the contract DESCRIBES the board, never that a gate is right."""
    doc = ROOT / "CLAUDE.md"
    if not doc.exists():
        return False, "CLAUDE.md missing -- the operating contract is this gate's subject"
    text = doc.read_text(encoding="utf-8")

    total = len(INVARIANTS)
    external = sum(1 for i in INVARIANTS if i.anchor_class == "external")

    m_total = re.search(r"invariants\.py`[^\n]*?(\d+)\s+gates", text)
    m_ext = re.search(r"Only the\s+~?\s*(\d+)\s+gates anchored outside", text)

    missing = []
    if not m_total:
        missing.append("the '<N> gates' claim beside the invariants.py command")
    if not m_ext:
        missing.append("the 'Only the <N> gates anchored outside' claim")
    if missing:
        return False, ("CLAUDE.md no longer states " + " and ".join(missing)
                       + " -- restore the wording or re-anchor this gate, but never let the "
                         "contract stop accounting for what a green board is worth")

    wrong = []
    if int(m_total.group(1)) != total:
        wrong.append(f"total: doc says {m_total.group(1)}, board runs {total}")
    if int(m_ext.group(1)) != external:
        wrong.append(f"external: doc says {m_ext.group(1)}, board has {external}")
    if wrong:
        return False, "CLAUDE.md misdescribes the board -- " + "; ".join(wrong)

    return True, (f"CLAUDE.md's board description matches reality: {total} gates, "
                  f"{external} externally anchored")


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


def _books_present():
    """True when the source book .txt files are present locally. They are NOT distributed in the
    public repo (copyright); gates that read book bytes skip with a clear reason when absent, and
    run in full when a developer places the sources back in eden/corpus/books/."""
    d = ROOT / "eden" / "corpus" / "books"
    return d.is_dir() and any(d.glob("*.txt"))


def check_corpus_integrity():
    """eden/corpus sealed claim-graph integrity. Delegates to the single
    implementation eden/tools/corpus_verify.py (one source of the 12 checks, no
    duplication): exit 0 = sealed & healthy, 2 = BOOTSTRAP (unsealed; always-valid
    checks passed), 1 = FAIL. Truth-anchored on book bytes + golden hashes."""
    verify = ROOT / "eden" / "tools" / "corpus_verify.py"
    if not verify.exists():
        return True, "eden/tools/corpus_verify.py missing (corpus not installed; bootstrap-guard)"
    if not _books_present():
        return True, "book source .txt not distributed in the public repo (copyright) — corpus was sealed & integrity-verified pre-publish; place eden/corpus/books/*.txt locally to re-run"
    env = dict(os.environ)
    env.setdefault("PYTHONUTF8", "1")
    r = subprocess.run([sys.executable, str(verify)], capture_output=True, text=True, env=env)
    lines = (r.stdout or "").strip().splitlines()
    head = lines[0] if lines else (r.stderr or "").strip()[:160]
    if r.returncode in (0, 2):
        return True, head
    return False, f"corpus integrity FAIL: {head}"


def check_catalog_integrity():
    """Catalog pillar (eden/catalog/) integrity. Delegates to the single implementation
    eden/tools/catalog_verify.py (one source, no duplication): exit 0 = sealed & healthy,
    2 = BOOTSTRAP (unsealed; structural checks passed), 1 = FAIL. Verifies the catalog's
    internal structure (counts, well-formed slugs, umbrella children resolve); the
    cross-pillar claim->catalog resolution is the separate references_resolve gate.
    The nutrient registry nutrients.json is part of the same pillar; it lights the
    substance half of references_resolve."""
    verify = ROOT / "eden" / "tools" / "catalog_verify.py"
    if not verify.exists():
        return True, "eden/tools/catalog_verify.py missing (catalog not installed; bootstrap-guard)"
    env = dict(os.environ)
    env.setdefault("PYTHONUTF8", "1")
    r = subprocess.run([sys.executable, str(verify)], capture_output=True, text=True, env=env)
    lines = (r.stdout or "").strip().splitlines()
    head = lines[0] if lines else (r.stderr or "").strip()[:160]
    if r.returncode in (0, 2):
        return True, head
    return False, f"catalog integrity FAIL: {head}"


def check_references_resolve():
    """references_resolve. Every condition/symptom slug a claim maps to MUST
    be pre-registered in the Catalog pillar (eden/catalog/{conditions,symptoms}.json). This
    closes the phantom-slug hole: without it a typo'd slug ('diabtes') silently mints a
    brand-new condition in the derived index with nothing to catch it. Delegates to the single
    implementation eden/tools/corpus_verify.py::unresolved_references (one source, no
    duplication). Skipped (pass) until the catalog is installed (bootstrap-safe). Truth-anchored
    on the sealed claim shards x the catalog registries, recomputed each run."""
    if not (ROOT / "eden" / "catalog" / "conditions.json").exists():
        return True, "eden/catalog not installed (bootstrap-guard)"
    sys.path.insert(0, str(ROOT / "eden" / "tools"))
    import corpus_verify
    unresolved = corpus_verify.unresolved_references()
    if unresolved:
        return False, (f"{len(unresolved)} claim slug(s) reference an UNREGISTERED "
                       f"condition/symptom (add to eden/catalog/): {unresolved[0]}"
                       f"{' ...' if len(unresolved) > 1 else ''}")
    import catalog
    nutr_active = (ROOT / "eden" / "catalog" / "nutrients.json").exists()
    substance_note = (
        f"the substance (other_substances) half is ACTIVE: every claim substance resolves to "
        f"nutrients.json ({len(catalog.nutrient_slugs())} substances registered)"
        if nutr_active else
        "the substance (other_substances) half is DORMANT — eden/catalog/nutrients.json is not installed")
    return True, (f"all claim condition/symptom slugs resolve to the Catalog "
                  f"({len(catalog.condition_slugs())} conditions, {len(catalog.symptom_slugs())} symptoms); "
                  f"{substance_note}")


def check_product_registry_resolves():
    """Product-DB registry health. Delegates to the single implementation
    eden/tools/nutrient_resolve.py, which for every quantified Product-DB substance resolves it
    to an essential slug OR classifies it as a botanical, collapses the botanical vocabulary to
    ZERO surface collisions, and asserts a bank of known identity + unit-conversion values
    (incl. substance-specific IU->mass for A/D/E). Exit 0 = all pass. Bootstrap-guarded until the
    Products pillar + the nutrient registry exist. Truth-anchored on the sealed products.json +
    catalog/nutrients.json, recomputed each run -- no stale-to-stale compare."""
    resolver = ROOT / "eden" / "tools" / "nutrient_resolve.py"
    products = ROOT / "eden" / "products" / "products.json"
    registry = ROOT / "eden" / "catalog" / "nutrients.json"
    if not (resolver.exists() and products.exists() and registry.exists()):
        return True, "products pillar / nutrient registry not installed (bootstrap-guard)"
    env = dict(os.environ)
    env.setdefault("PYTHONUTF8", "1")
    r = subprocess.run([sys.executable, str(resolver)], capture_output=True, text=True, env=env)
    out = (r.stdout or "").strip().splitlines()
    head = out[0] if out else (r.stderr or "").strip()[:160]
    if r.returncode == 0:
        return True, head
    fails = [ln.strip() for ln in out if "[FAIL]" in ln]
    return False, f"product registry resolve FAIL: {('; '.join(fails))[:200] or head}"


def check_products_verify():
    """Products pillar (eden/products/products.json) structural + prose-containment integrity.
    Delegates to eden/tools/products_verify.py (one source, no duplication): exit 0 = clean.
    Bootstrap-guarded until the pillar exists. Recomputed over the sealed pillar each run."""
    verify = ROOT / "eden" / "tools" / "products_verify.py"
    products = ROOT / "eden" / "products" / "products.json"
    if not (verify.exists() and products.exists()):
        return True, "eden/products not installed (bootstrap-guard)"
    env = dict(os.environ)
    env.setdefault("PYTHONUTF8", "1")
    r = subprocess.run([sys.executable, str(verify)], capture_output=True, text=True, env=env)
    out = (r.stdout or "").strip().splitlines()
    tail = out[-1] if out else (r.stderr or "").strip()[:160]
    if r.returncode == 0:
        return True, tail
    return False, f"products_verify FAIL: {tail}"


def check_products_hash_integrity():
    """Eden's wall for the Products pillar: products.json's LF-content hash must match its golden
    sibling. Bootstrap-safe until the user seals (eden/tools/products_seal.py writes the golden).
    Any drift after sealing = RED -- the scanner/user path can never silently rewrite the pillar.
    LF-normalized (clone/CRLF-stable). Truth anchor: deterministic hash."""
    import hashlib
    products = ROOT / "eden" / "products" / "products.json"
    golden = products.parent / (products.name + ".golden.sha256")
    if not products.exists():
        return True, "eden/products/products.json missing (bootstrap-guard)"
    if not golden.exists():
        return True, "products.json not yet sealed (no golden; bootstrap-guard -- run eden/tools/products_seal.py)"
    lf = products.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n")
    actual = hashlib.sha256(lf.encode("utf-8")).hexdigest()
    want = golden.read_text(encoding="utf-8").strip()
    if actual != want:
        return False, (f"products.json hash drift! golden={want[:16]}... actual={actual[:16]}... -- "
                       f"the sealed pillar was modified without re-sealing. Revert or re-run products_seal.py.")
    return True, f"products.json matches golden ({actual[:16]}...)"


def check_corpus_runtime_purity():
    """The shipped dashboard bundle must make no LLM / external-network call.
    The app has no network at runtime, so any such marker in the bundle is a
    breach of that promise. Greps dist/main.js for LLM-SDK + API-endpoint
    markers. Same family as no_external_style_resources."""
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


def check_derived_artifacts_fresh():
    """Every GENERATED data artifact listed in
    eden/derived/MANIFEST.json must equal a fresh run of its ONE pure generator
    over the sealed pillars. The offline file:// app inlines these into the bundle
    at build (esbuild JSON import), so a hand-edit or a stale build would make a
    surface lie. Regenerate via `python eden/tools/build_embeds.py`. Generalizes
    the retired corpus_embed_synced to ALL manifest artifacts: the gate covers
    whatever the manifest lists, so a newly added artifact is guarded the day it
    enters the manifest and no gate edit is needed. Truth-anchored on a
    deterministic re-derive from the sealed source each run — never stale-to-stale."""
    import importlib.util as _ilu
    import json as _json
    manifest_path = ROOT / "eden" / "derived" / "MANIFEST.json"
    if not manifest_path.exists():
        return True, "eden/derived/MANIFEST.json missing (bootstrap-guard)"
    try:
        manifest = _json.loads(manifest_path.read_text(encoding="utf-8"))
    except Exception as e:
        return False, f"MANIFEST.json is not valid JSON: {e}"
    sys.path.insert(0, str(ROOT / "tools"))
    sys.path.insert(0, str(ROOT / "eden" / "tools"))

    def _load(rel):
        p = ROOT / rel
        spec = _ilu.spec_from_file_location(p.stem, p)
        mod = _ilu.module_from_spec(spec)
        spec.loader.exec_module(mod)
        return mod

    artifacts = manifest.get("artifacts", [])
    if not artifacts:
        return True, "manifest empty — no derived artifacts to verify"
    stale, checked = [], 0
    for entry in artifacts:
        artifact, gen = entry["artifact"], entry["generator"]
        if not (ROOT / gen).exists():
            continue  # generator not installed (bootstrap-guard)
        compare = entry.get("compare", "json")
        if compare != "json":
            stale.append(f"{artifact} UNSUPPORTED compare='{compare}'")
            continue
        apath = ROOT / artifact
        if not apath.exists():
            stale.append(f"{artifact} MISSING — run build_embeds.py")
            continue
        try:
            mod = _load(gen)
            expected = getattr(mod, entry["build_fn"])()
            on_disk = _json.loads(apath.read_text(encoding="utf-8"))
        except Exception as e:
            stale.append(f"{artifact} ERROR: {e}")
            continue
        checked += 1
        if on_disk != expected:
            stale.append(f"{artifact} STALE")
    if stale:
        return False, ("derived artifact(s) drift from the pillars — run "
                       f"`python eden/tools/build_embeds.py`: {'; '.join(stale)}")
    return True, f"all {checked} derived artifact(s) in sync with the sealed pillars"


def _amounts_wallach_only_impl(embed_p, canon_p, claims_dir):
    """§00.A (Wallach is the only source of amounts) — every NUMERIC
    coverage target in dashboard/assets/data/essentials-targets-data.json is a Wallach
    dose, AND the posted number is the DETERMINISTIC result of the documented transform
    chain applied to that sealed Wallach dose. Two layers of proof (§00.B defense in
    depth + truth-anchoring):

      TRACE (the anchor) -- source_claim_id resolves to a sealed corpus `dose` claim mapping
        the essential's slug, AND provenance.original_{low,high,unit} EQUALS that claim's dose
        amount/unit. So the "original" the transform starts from really is Wallach's number,
        not a hand-inserted value.
      CHAIN (the recompute) -- re-run the documented chain here, independently:
        upper-of-range -> x IU-factor (if any) -> x 1.54 weight-scale + round-to-2sf (if
        per-100lb), and compare the result to the posted `low`. Any IU factor must equal the
        known physical constant for that vitamin (0.3 RAE / 0.025 vit-D / 0.67 vit-E); any
        weight scale must equal 154/100; IU/weight scaling is only legal when the claim itself
        is IU / per-100lb. So a fabricated number, a wrong-or-planted factor, an arithmetic
        drift, or a stale artifact all go RED -- the transform can no longer LAUNDER a
        non-Wallach amount past mere provenance-existence.

    Non-numeric (honest-gap / trace / dietary) targets carry no number and are skipped.
    Truth-anchored on the sealed claim shards + externally-true physical constants, recomputed
    each run (nothing imported from the derive script, so a derive bug cannot slip both
    surfaces). Split out from check_amounts_wallach_only so a negative test can drive the same
    logic with a tampered artifact (proving the gate reddens on poison, not just greens on truth)."""
    import json as _json
    import math
    # IU conversions are USP/FDA definitional constants (physical truth, NOT project-chosen
    # values), re-stated here as the INDEPENDENT anchor for the derive script's IU_CONVERSIONS
    # table -- if a derive factor ever drifts from the true constant, this catches it (§00.B #2/#11).
    iu_factor = {"vitamin-a": 0.3, "vitamin-d": 0.025, "vitamin-e": 0.67}
    iu_out_unit = {"vitamin-a": "mcg", "vitamin-d": "mcg", "vitamin-e": "mg"}
    weight_scale = 154 / 100.0  # 70 kg / 154 lb reference adult; source states doses per 100 lb

    if not embed_p.exists() or not canon_p.exists() or not claims_dir.exists():
        return True, "essentials-targets-data / corpus not installed (bootstrap-guard)"
    try:
        data = _json.loads(embed_p.read_text(encoding="utf-8"))
    except Exception as e:
        return False, f"essentials-targets-data.json not valid JSON: {e}"
    canon = _json.loads(canon_p.read_text(encoding="utf-8"))["essentials"]
    name2slug = {c["layout_key"]: c["slug"] for c in canon}
    dose_claims = {}
    for shard in claims_dir.glob("claims-*.json"):
        for c in _json.loads(shard.read_text(encoding="utf-8")).get("claims", []):
            if c.get("kind") == "dose":
                dose_claims[c["id"]] = c

    def parse_amt(a):
        # Independent re-implementation of the derive's amount grammar (number OR "low-high").
        if isinstance(a, (int, float)):
            return float(a), None
        if isinstance(a, str):
            m = re.match(r"\s*([\d.,]+)\s*[-–]\s*([\d.,]+)", a)
            if m:
                return float(m.group(1).replace(",", "")), float(m.group(2).replace(",", ""))
            m = re.match(r"\s*([\d.,]+)", a)
            if m:
                return float(m.group(1).replace(",", "")), None
        return None, None

    def round_2sf(x):
        # The documented "2 significant figures" rounding, recomputed independently.
        if not x:
            return 0.0
        return round(x, 1 - int(math.floor(math.log10(abs(x)))))

    def close(a, b):
        if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
            return False
        return abs(a - b) <= 1e-6 * max(1.0, abs(b))

    def leaf(name, slug, claim, prov):
        """Verify one dose's provenance against its sealed claim + recompute its value.
        Returns (recomputed_value_or_None, scaled_bool, list_of_errors)."""
        errs = []
        dz = claim.get("dose") or {}
        clow, chigh = parse_amt(dz.get("amount"))
        if prov.get("original_low") != clow or prov.get("original_high") != chigh:
            errs.append(f"{name}: provenance original {prov.get('original_low')}-{prov.get('original_high')} "
                        f"!= claim {claim['id']} dose {clow}-{chigh}")
        if prov.get("original_unit") != dz.get("unit"):
            errs.append(f"{name}: provenance unit {prov.get('original_unit')!r} != claim unit {dz.get('unit')!r}")
        exp_upper = chigh if chigh is not None else clow
        if exp_upper is not None and not close(prov.get("upper_taken"), exp_upper):
            errs.append(f"{name}: upper_taken {prov.get('upper_taken')} != upper-of-range {exp_upper}")
        if "factor" in prov:
            legit = iu_factor.get(slug)
            if legit is None or not close(prov["factor"], legit):
                errs.append(f"{name}: IU factor {prov['factor']} is not the known constant for {slug} ({legit})")
            if dz.get("unit") != "IU":
                errs.append(f"{name}: factor applied but claim unit is {dz.get('unit')!r}, not IU")
        elif dz.get("unit") == "IU" and slug in iu_factor:
            errs.append(f"{name}: IU dose for {slug} but no conversion factor recorded")
        if "scale_factor" in prov:
            if not close(prov["scale_factor"], weight_scale):
                errs.append(f"{name}: scale_factor {prov['scale_factor']} != 1.54 (154 lb / 100 lb)")
            if dz.get("per_body_weight") != "100lb":
                errs.append(f"{name}: scaled but claim {claim['id']} is not per-100lb")
        elif dz.get("per_body_weight") == "100lb":
            errs.append(f"{name}: claim {claim['id']} is per-100lb but no scale_factor recorded")
        v = prov.get("upper_taken")
        scaled = "scale_factor" in prov
        if isinstance(v, (int, float)):
            if "factor" in prov:
                v = v * prov["factor"]
            if scaled:
                v = round_2sf(v * prov["scale_factor"])
        else:
            v = None
        return v, scaled, errs

    viol, numeric = [], 0
    for e in data.get("essentials", []):
        t = e.get("target") or {}
        low = t.get("low")
        if not isinstance(low, (int, float)):
            continue
        numeric += 1
        name = e.get("name", "?")
        slug = name2slug.get(name)
        scid = t.get("source_claim_id")
        if not scid:
            viol.append(f"{name}: numeric target {low}{t.get('unit', '')} with NO source_claim_id")
            continue
        claim = dose_claims.get(scid)
        if claim is None:
            viol.append(f"{name}: source_claim_id {scid} is not a sealed Wallach dose claim")
            continue
        if slug is None or slug not in claim.get("essentials", []):
            viol.append(f"{name}: dose claim {scid} does not map essential '{slug}'")
            continue
        prov = t.get("provenance")
        if not isinstance(prov, dict):
            viol.append(f"{name}: numeric target {low} has no provenance to audit (R2 chain)")
            continue
        parts = t.get("parts")
        if isinstance(parts, list) and parts:
            # Complementary (summed) target, e.g. Vitamin A = retinol + beta-carotene.
            part_vals, any_scaled, perrs = [], False, []
            for p in parts:
                pclaim = dose_claims.get(p.get("claim_id"))
                pprov = p.get("provenance") or {}
                if pclaim is None:
                    perrs.append(f"{name}: part claim_id {p.get('claim_id')} is not a dose claim")
                    continue
                if slug not in pclaim.get("essentials", []):
                    perrs.append(f"{name}: part claim {p.get('claim_id')} does not map '{slug}'")
                pv, psc, pe = leaf(name, slug, pclaim, pprov)
                perrs += pe
                any_scaled = any_scaled or psc
                if pv is not None:
                    part_vals.append(pv)
                    if not close(p.get("value"), pv):
                        perrs.append(f"{name}: part value {p.get('value')} != recomputed {pv}")
                exp_pu = iu_out_unit.get(slug) if "factor" in pprov else pprov.get("original_unit")
                if p.get("unit") != exp_pu:
                    perrs.append(f"{name}: part unit {p.get('unit')!r} != expected {exp_pu!r}")
            if perrs:
                viol += perrs
                continue
            expected = round_2sf(sum(part_vals)) if any_scaled else sum(part_vals)
            if not close(low, expected):
                viol.append(f"{name}: posted {low} != sum of recomputed parts {expected}")
            exp_unit = iu_out_unit.get(slug, t.get("unit"))
            if t.get("unit") != exp_unit:
                viol.append(f"{name}: target unit {t.get('unit')!r} != expected {exp_unit!r}")
        else:
            v, scaled, errs = leaf(name, slug, claim, prov)
            if errs:
                viol += errs
                continue
            if v is None or not close(low, v):
                viol.append(f"{name}: posted {low} != value recomputed from its transform chain ({v})")
            exp_unit = iu_out_unit.get(slug) if "factor" in prov else prov.get("original_unit")
            if t.get("unit") != exp_unit:
                viol.append(f"{name}: target unit {t.get('unit')!r} != expected {exp_unit!r}")
            if t.get("unit") == "IU":
                viol.append(f"{name}: posted target still in IU (should be unit-normalized to metric)")
    if viol:
        return False, ("non-Wallach / unsourced / mis-derived amount(s) in essentials-targets-data "
                       "(R2 poison / broken chain): " + "; ".join(viol[:8]))
    return True, (f"all {numeric} numeric coverage target(s) trace to a Wallach dose claim AND "
                  "recompute exactly from its documented transform chain (R2 clean)")


# ---------------------------------------------------------------------------
# R2 / §00.A -- dose_amount_in_verbatim (2026-07-15)
# ---------------------------------------------------------------------------
# THE HOLE THIS CLOSES. Nothing else in the repo ties a claim's structured
# `dose.amount` to the book text. amounts_wallach_only anchors a target's
# provenance to the CLAIM's dose field -- which is ours, and unverified.
# corpus_integrity proves the VERBATIM is a substring of the book, but never
# that the number we EXTRACTED matches the number printed beside it. So the
# chain ran airtight from the rendered target back to the claim, and then
# stopped. DEMONSTRATED with a planted 10x sodium fabrication (3,300 -> 33,000
# mg): it passed the whole board GREEN while the claim's own verbatim still
# read "3,300 mg". This gate is that missing link.
#
# THE THREE ADVERSARIAL BREAKS that shaped the design (each is now a pinned
# case in tools/tests/test_dose_amount_in_verbatim.py -- do not weaken without one):
#   1. CROSS-ROW BLEED. A verbatim span often carries the NEXT nutrient's table
#      row. A naive presence check accepts any number in the span, so choline's
#      600 could be "proven" by chromium's row. A large minority of spans name
#      more than one nutrient, so presence alone can never be sound.
#   2. UNIT SWAP. LETS-000048 choline 600 mg re-tagged `mcg` (a 1000x UNDER-dose
#      -- the invisible failure: an understated target silently marks a user
#      covered) passed, because chromium's row supplies "300 to 600 mcg".
#      LETS-000073 vitamin C mg->IU passed off vitamin D's row. Adjacency-capture
#      does NOT fix this: 600 is adjacent to mg AND mcg. Row identity does.
#   3. IN-ROW COLUMN BLEED. The base-line table row is
#      NAME | RDA | true-supplement-need | pharmacologic, and dose.amount is the
#      2nd column -- so sodium 3,300 -> 1,100 (its own RDA) is a 3x understatement
#      that presence-checking can never see.
#
# HOW IT ANSWERS THEM: scope first, then check.
#   * Row scoping -- slice the span on NUTRIENT-NAME boundaries, not newlines.
#     Table rows are sometimes space-joined on one line; prose is hard-wrapped
#     mid-phrase ("Twenty to 30 mg ... for\ngermanium."), so a newline split
#     SEVERS a dose from its subject. The discriminator is the follow-test: a
#     name heads a table row iff a number (or a "?" placeholder) follows it,
#     optionally past a form parenthetical -- "Vitamin A (retinol) 2,500 IU".
#     In prose a name is followed by a word ("chromium and vanadium at 250 mcg"),
#     which fails the test and leaves the span whole. Fail-safe by construction:
#     every ambiguity falls back to the FULL span, which is only ever looser.
#   * Positional column check -- where for_condition names the column, index it
#     and compare numerically + by unit. Verified against real data: 30 rows
#     column-checked, ZERO false-fires (a RED here would mean the rule is wrong,
#     not the corpus).
#
# NO BASELINE EXCEPTION. The original spec wanted one for LETS-000061
# (phosphorus 0 / "PHOSPHORUS 800 mg 0.0 0.0"). That would NEUTER THE WHOLE
# GATE: .claude/invariant-baseline.json is INVARIANT-scoped
# (stop_round_close.py::_tolerated returns a set of invariant NAMES), so one
# entry tolerates EVERY claim this gate checks. Handled in-gate instead: a
# unitless column is accepted ONLY when the amount is zero (0 mg == 0 mcg;
# "0.0" means no supplemental need). A non-zero unitless column is
# unverifiable -> fail closed.
#
# Truth anchor: the claim's own verbatim bytes, which corpus_integrity
# independently pins to the sealed book .txt. The two compose -- R5 proves the
# quote is the book's, this proves the number is the quote's, and
# amounts_wallach_only proves the target is the number's.
_DOSE_UNIT_SYN = {
    "mg":    r"(?:mg|milligrams?)",
    "mcg":   r"(?:mcg|ug|µg|micrograms?)",
    "IU":    r"(?:IU)",
    "g":     r"(?:g|gm|grams?)",
    "fl oz": r"(?:fl\.?\s*oz|ounces?|oz)",
}
_DOSE_UNIT_ALT = r"(?:mcg|mg|IU|gm|grams?|milligrams?|micrograms?|ug|µg|g)"

# Standalone numerals ONLY. 'hundred'/'thousand' are deliberately ABSENT: a
# per-token map turns "five hundred mcg" into "5 100 mcg", which BOTH destroys
# the real 500 (false-fire) and manufactures a 100 that was never printed (miss).
# Zero compound numerals exist in the corpus today; _DOSE_COMPOUND detects one
# arriving from a future mine and bails to the full span rather than lying.
_DOSE_NUM_WORDS = {
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6,
    "seven": 7, "eight": 8, "nine": 9, "ten": 10, "eleven": 11, "twelve": 12,
    "thirteen": 13, "fourteen": 14, "fifteen": 15, "sixteen": 16, "seventeen": 17,
    "eighteen": 18, "nineteen": 19, "twenty": 20, "thirty": 30, "forty": 40,
    "fifty": 50, "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90,
}
_DOSE_COMPOUND = re.compile(
    r"\b(" + "|".join(_DOSE_NUM_WORDS) + r")[\s-]+(hundred|thousand)\b", re.I)
_DOSE_WORD_RE = re.compile(r"\b(" + "|".join(_DOSE_NUM_WORDS) + r")\b", re.I)
_DOSE_DASHES = "‐‑‒–—―−"
_DOSE_FOLLOW = re.compile(r"\s*(?:\([^)]*\)\s*)?(?:\?|\d)")
_DOSE_PGROUP = re.compile(
    r"(\?)|((?:\d+(?:\.\d+)?)(?:\s*(?:-|to)\s*(?:\d+(?:\.\d+)?))?)\s*("
    + _DOSE_UNIT_ALT + r")?\b", re.I)

# Spelling variants the canon's display/common names do not carry. Every entry is
# a real token observed in a sealed verbatim; keep it tiny and evidence-backed.
_DOSE_ALIASES = {
    "sulfur": ["sulphur"],
    "vitamin-b9": ["folacin", "folate", "folic acid"],
    "vitamin-b3": ["niacin", "niacinamide"],
}

# for_condition -> the 0-based value-column (after the name) that dose.amount MUST be.
# The Let's Play Doctor base-line table prints NAME | RDA | true-need | pharmacologic.
_DOSE_COLUMN_OF = {"base-line supplement program (true supplement need)": 1}
# Fig. 8-1 prints RDA | true-supplement-need | pharmacologic. A row yielding fewer
# groups than this has a blank cell and cannot be positionally indexed (see
# _dose_row_groups). VITAMIN A is the only such row in the table.
_DOSE_BASELINE_COLS = 3


def _dose_prep(s):
    """Returns (normalized, compound_present)."""
    s = unicodedata.normalize("NFKC", s)
    for d in _DOSE_DASHES:
        s = s.replace(d, "-")
    s = re.sub(r"\s+", " ", s).strip()
    prev = None
    while prev != s:                       # loop: 1,234,567 needs >1 pass
        prev = s
        s = re.sub(r"(?<=\d),(?=\d{3}\b)", "", s)
    if _DOSE_COMPOUND.search(s):
        return s, True
    return _DOSE_WORD_RE.sub(lambda m: str(_DOSE_NUM_WORDS[m.group(1).lower()]), s), False


def _dose_numlit(p):
    """A number literal with DIGIT BOUNDARIES. The lookarounds are load-bearing, not
    cosmetic: without them `0\\s*mg` matches the trailing 0 of "800 mg" (a real
    false-pass in the first prototype), and they are what stops a planted 3300 from
    matching inside a verbatim's 33000."""
    d = Decimal(p)
    if d == d.to_integral_value():
        core = r"%d(?:\.0+)?" % int(d)
    else:
        core = re.escape(str(d.normalize())) + r"0*"
    return r"(?<![\d.])(?:" + core + r")(?![\d.])"


def _dose_components(amount):
    """Split an amount into numeric components. Non-canonical ('050') -> RED, so a
    malformed amount cannot enter the pillar and Decimal-normalize into looking fine."""
    raw, _ = _dose_prep(str(amount))
    parts = re.split(r"\s*(?:-|/|\bto\b)\s*", raw)
    out = []
    for p in parts:
        p = p.strip()
        if not re.fullmatch(r"(?:0|[1-9]\d*)(?:\.\d+)?", p):
            return None, p
        out.append(p)
    return out, None


def _dose_name_pattern(t):
    """Build from TOKENS. Never do surgery on an re.escape'd string: re.escape escapes
    the space, so a naive .replace(' ', r'\\s+') yields a pattern matching a literal
    backslash (this cost a full regression pass on 2026-07-15). Canon says
    'Vitamin B12'; the book prints 'VITAMIN B-12' -- separators must be flexible."""
    parts = re.findall(r"[A-Za-z]+|\d+", t)
    if not parts:
        return None
    return r"\b" + r"[-\s]*".join(re.escape(p) for p in parts) + r"\b"


def _dose_name_res(canon):
    out = {}
    for e in canon.get("essentials", []):
        toks = [e.get("display_name"), e.get("common_name")]
        toks = [t for t in toks if t] + _DOSE_ALIASES.get(e["slug"], [])
        pats = [_dose_name_pattern(t) for t in sorted(set(toks), key=len, reverse=True)]
        res = [re.compile(p, re.I) for p in pats if p]
        if res:
            out[e["slug"]] = res
    return out


def _dose_name_hits(text, res_by_slug):
    hits = []
    for slug, res in res_by_slug.items():
        for r in res:
            for m in r.finditer(text):
                hits.append((m.start(), m.end(), slug))
    hits.sort(key=lambda h: (h[0], -(h[1] - h[0])))
    out = []
    for h in hits:
        if out and h[0] < out[-1][1]:
            continue                       # nested/overlapping name; keep the longer
        out.append(h)
    return out


def _dose_scope(claim, res_by_slug):
    """(scope_text, kind). Every ambiguous path returns the FULL span -- scoping may
    only ever TIGHTEN, never invent a narrower window that hides a real mismatch."""
    vb, compound = _dose_prep(claim.get("verbatim") or "")
    if compound:
        return vb, "full-compound"
    ess = claim.get("essentials") or []
    if len(ess) != 1:
        return vb, "full-multi"
    led = [h for h in _dose_name_hits(vb, res_by_slug)
           if _DOSE_FOLLOW.match(vb[h[1]:h[1] + 24])]
    mine = []
    for i, (s, e, slug) in enumerate(led):
        if slug != ess[0]:
            continue
        end = led[i + 1][0] if i + 1 < len(led) else len(vb)
        mine.append(vb[s:end].strip())
    positional = _DOSE_COLUMN_OF.get((claim.get("dose") or {}).get("for_condition")) is not None
    # >=2 led names == a real table. A positional claim is a table row BY DECLARATION,
    # so one led name suffices -- that is how "ZINC 15 mg 25 mg 150 mg * <prose>" is
    # still column-checked despite naming only one nutrient.
    if len(led) < 2 and not positional:
        return vb, "full-prose"
    if len(mine) > 1:
        form = (claim.get("dose") or {}).get("form")
        if form:
            f = [m for m in mine if re.search(re.escape(form), m, re.I)]
            if len(f) == 1:
                return f[0], "row+form"
    if len(mine) == 1:
        return mine[0], "row"
    return vb, "full-norow"


def _dose_row_groups(row, res_for_slug):
    body = row
    for r in res_for_slug:
        m = r.match(body)
        if m:
            body = body[m.end():]
            break
    raw = []
    for m in _DOSE_PGROUP.finditer(body):
        if m.group(1):
            raw.append(("?", None, m.start(), m.end()))
        elif m.group(2):
            raw.append((m.group(2).strip(), m.group(3), m.start(), m.end()))
    # MERGE a unit-repeated range into the ONE column it actually is. Fig. 8-1 prints
    # "VITAMIN A ... 20,000 IU - 300,000 IU": the unit repeats on both sides, so the naive
    # scan sees two columns where the page shows one, and an UNDER-FILLED row then looks full.
    # Every other range prints its unit once ("500 to 3,000 mcg", "2 - 5 mg") and is unaffected.
    out = []
    for g in raw:
        val, unit, a, b = g
        if out and unit is not None and out[-1][1] == unit and val != "?" and out[-1][0] != "?":
            gap = body[out[-1][3]:a]
            if re.fullmatch(r"\s*(?:-|to)\s*", gap, re.I):
                out[-1] = (out[-1][0] + " - " + val, unit, out[-1][2], b)
                continue
        out.append(g)
    return [(v, u) for v, u, _a, _b in out]


def _dose_check_one(claim, res_by_slug):
    """(ok, why). Params so the negative test can drive planted claims."""
    dose = claim.get("dose") or {}
    amt, unit = dose.get("amount"), dose.get("unit")
    if amt is None or unit is None:
        return False, "dose has no amount/unit"
    if unit not in _DOSE_UNIT_SYN:
        return False, "unknown unit %r (fail-closed: extend the table deliberately)" % unit
    comps, bad = _dose_components(amt)
    if comps is None:
        return False, "non-canonical amount component %r" % bad
    scope, kind = _dose_scope(claim, res_by_slug)
    U = _DOSE_UNIT_SYN[unit]
    SEP = r"\s*(?:-|to|/|and|,)\s*"

    idx = _DOSE_COLUMN_OF.get(dose.get("for_condition"))
    if idx is not None and kind in ("row", "row+form"):
        ess = (claim.get("essentials") or [None])[0]
        gs = _dose_row_groups(scope, res_by_slug.get(ess, []))
        # An UNDER-FILLED row (fewer groups than the table has columns) has a blank cell, so
        # which column a value sits in is unknowable -- positional indexing would compare the
        # wrong cell and RED-flag a true value, as it did for VITAMIN A (blank RDA). Fall
        # through to the row-scoped presence check: the gate's documented fail-safe.
        if len(gs) >= _DOSE_BASELINE_COLS and len(gs) > idx and gs[idx][0] != "?":
            val, gu = gs[idx]
            got, _ = _dose_components(val)
            if got is not None:
                same = (len(comps) == len(got)
                        and all(Decimal(a) == Decimal(b) for a, b in zip(comps, got)))
                if not same:
                    return False, ("column-%d mismatch: the row's own column reads %s %s, "
                                   "dose says %s %s" % (idx, val, gu or "(no unit)", amt, unit))
                if gu is None:
                    if all(Decimal(x) == 0 for x in comps):
                        return True, "col0/" + kind
                    return False, ("column-%d has no unit; cannot verify %s %s"
                                   % (idx, amt, unit))
                if not re.fullmatch(U, gu, re.I):
                    return False, ("column-%d unit mismatch: the row reads %s, dose says %s"
                                   % (idx, gu, unit))
                return True, "col/" + kind

    inner = (r"(?:\s*" + U + r"\b)?" + SEP).join(_dose_numlit(c) for c in comps)
    if re.search(inner + r"\s*" + U + r"\b", scope, re.I):
        return True, "A/" + kind
    # Rule B: per-component, ONLY for '/'-joined escalating schedules (RARE-000096's
    # "10 mg initially, 25 mg second week and 50 mg per week"). Gated to '/' so it can
    # never silently loosen a RANGE into two independent scattered matches.
    if "/" in str(amt):
        if all(re.search(_dose_numlit(c) + r"\s*" + U + r"\b", scope, re.I) for c in comps):
            return True, "B/" + kind
    return False, "amount %s %s is NOT in this claim's own verbatim (scope=%s)" % (amt, unit, kind)


def _dose_amount_in_verbatim_impl(claims, canon):
    res = _dose_name_res(canon)
    bad, checked = [], 0
    for c in claims:
        if not (c.get("dose") or {}).get("amount") is not None:
            continue
        checked += 1
        ok, why = _dose_check_one(c, res)
        if not ok:
            bad.append("%s: %s" % (c.get("id"), why))
    if bad:
        return False, ("%d of %d dose claim(s) FABRICATED or mis-transcribed -- the number "
                       "is not in the claim's own verbatim: " % (len(bad), checked)
                       + "; ".join(bad[:4]) + (" ..." if len(bad) > 4 else ""))
    return True, ("all %d structured dose(s) match their own verbatim bytes, unit-adjacent "
                  "and row-scoped (R2: the claim->book link)" % checked)


# ---------------------------------------------------------------------------
# Section 31 -- regimen_state_mutation_routing
# ---------------------------------------------------------------------------
# WHY THIS IS A GATE AND NOT A RULE. The contract states flatly that user state
# reaches localStorage through the section-31 chokepoint only. For a stretch that
# claim rested on a warn-level lint rule and nothing else -- an operating document
# asserting an enforcement that did not exist. A rule that can be a gate must be
# one, in the same patch.
#
# WHAT IT CHECKS. The contract that is actually true today:
#   (1) the five legacy chokepoints still EXIST as export functions (API preserved so the
#       existing views keep compiling -- the single writer EXTENDS the five, it does
#       not replace them);
#   (2) regimen state has exactly ONE writer -- setValidated(RG_SLOTS_KEY, ...) appears once,
#       in the private writeSlotDoc -- and that writer EMITS the typed `regimen:changed`
#       cascade (a silent writer would leave every subscriber stale);
#   (3) ALL FIVE legacy chokepoints DELEGATE to writeSlotDoc (route through the one writer).
#       P4 folded goals into the slot doc, so saveRgUserGoals now delegates like the rest --
#       it is no longer a separate GLOBAL chokepoint with its own key + a direct emit;
#   (4) the five RETIRED keys (lcRegimen/rgOverrides/rgManual/rgRemoved/rgUserGoals) are never
#       WRITTEN -- they are read once by the migration, then inert;
#   (5) `localStorage` is touched ONLY in core/storage.ts, and no view writes storage directly.
#
# PLACEMENT-INDEPENDENT BY CONSTRUCTION — do not regress this. An earlier version
# sliced each function's body up to the next `\nexport function`, so the private
# `function writeSlotDoc` was SWALLOWED into whichever export textually preceded it:
# a false match that depended on source ORDER. The current impl uses a
# length-preserving comment/string blanker + paren-then-brace body matching (below),
# so reordering functions cannot change what it proves.
# tools/tests/test_regimen_state_mutation_routing.py pins both the good delegating shape
# and every real violation.
# The real localStorage API surface. Deliberately NOT r"\blocalStorage\s*\." -- see the note
# in _regimen_state_mutation_routing_impl: that pattern matches the period ending a sentence
# in a code comment.
_LS_API_RE = re.compile(
    r"\blocalStorage\s*(?:\.\s*(?:getItem|setItem|removeItem|clear|key|length)\b|\[)")


# The five legacy chokepoints whose EXPORT must survive (API preservation: existing
# callers keep compiling while every write routes through the one private writer).
_S31_LEGACY_CHOKEPOINTS = (
    "persistRegimen", "saveRgOverride", "saveRgManual", "saveRgRemoved", "saveRgUserGoals",
)
# All five delegate to writeSlotDoc. P4 (2026-08-13) folded goals into the slot doc, so
# saveRgUserGoals now routes through the one writer like the rest -- it is no longer a
# separate GLOBAL chokepoint with its own key + direct emit.
_S31_SLOT_BACKED = ("persistRegimen", "saveRgOverride", "saveRgManual", "saveRgRemoved", "saveRgUserGoals")
# The keys retired by the slot migration -- read once at migration, never written again.
# RG_USER_GOALS_KEY joined them in P4: goals moved into the slot doc, so the global key is
# read once to seed per-slot goals, then inert.
_S31_RETIRED_KEYS = ("REGIMEN_KEY", "RG_OVERRIDES_KEY", "RG_MANUAL_KEY", "RG_REMOVED_KEY", "RG_USER_GOALS_KEY")


def _blank_noncode(s):
    """Blank comment/string/template CONTENT with spaces, preserving length + newlines.

    So a later brace/paren match sees only STRUCTURAL brackets -- not a `{` inside a comment,
    a reason string, or a template `${...}` expression. Length preservation means the indices
    it returns still address the ORIGINAL source (where the event-name string is intact)."""
    res = []
    i, n = 0, len(s)
    state = "code"  # code | line | block | sq | dq | tmpl
    while i < n:
        c = s[i]
        nxt = s[i + 1] if i + 1 < n else ""
        if state == "code":
            if c == "/" and nxt == "/":
                res.append("  "); i += 2; state = "line"; continue
            if c == "/" and nxt == "*":
                res.append("  "); i += 2; state = "block"; continue
            if c == "'":
                res.append(c); i += 1; state = "sq"; continue
            if c == '"':
                res.append(c); i += 1; state = "dq"; continue
            if c == "`":
                res.append(c); i += 1; state = "tmpl"; continue
            res.append(c); i += 1; continue
        if state == "line":
            if c == "\n":
                res.append("\n"); i += 1; state = "code"; continue
            res.append("\t" if c == "\t" else " "); i += 1; continue
        if state == "block":
            if c == "*" and nxt == "/":
                res.append("  "); i += 2; state = "code"; continue
            res.append("\n" if c == "\n" else " "); i += 1; continue
        # inside a string/template
        quote = "'" if state == "sq" else ('"' if state == "dq" else "`")
        if c == "\\":
            res.append("  "); i += 2; continue
        if c == quote:
            res.append(c); i += 1; state = "code"; continue
        res.append("\n" if c == "\n" else " "); i += 1; continue
    return "".join(res)


def _ts_fn_span(blanked, header_regex):
    """(start, end) of a function's `{...}` body on BLANKED source, or None.

    Paren-match the parameter list first, THEN take the first `{` after it -- so an inline
    param type like `opts?: { emit?: boolean }` (writeSlotDoc) is not mistaken for the body."""
    m = re.search(header_regex, blanked)
    if not m:
        return None
    p = blanked.find("(", m.end())
    if p == -1:
        return None
    depth, q = 0, None
    for j in range(p, len(blanked)):
        ch = blanked[j]
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
            if depth == 0:
                q = j
                break
    if q is None:
        return None
    b = blanked.find("{", q)
    if b == -1:
        return None
    depth = 0
    for j in range(b, len(blanked)):
        ch = blanked[j]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return (b, j + 1)
    return None


def _regimen_state_mutation_routing_impl(regimen_src, storage_src, view_srcs):
    """Params are source strings so the negative test can drive planted code.
    See the block comment above for the full contract and why the model changed."""
    viol = []
    blanked = _blank_noncode(regimen_src)

    def body(header_regex):
        sp = _ts_fn_span(blanked, header_regex)
        if sp is None:
            return None, None
        b, e = sp
        return regimen_src[b:e], blanked[b:e]  # (original, blanked)

    # (4) the retired keys are never WRITTEN (read-only via getValidated after migration).
    for key in _S31_RETIRED_KEYS:
        w = re.findall(r"\bset(?:Validated)?\(\s*" + key + r"\b", blanked)
        if w:
            viol.append(f"retired key `{key}` is WRITTEN {len(w)}x -- after the slot migration "
                        f"it must be read-only (getValidated), never a write target")

    # (2) exactly ONE writer of the slot document, through the Zod boundary.
    slot_writes = re.findall(r"\bsetValidated\(\s*RG_SLOTS_KEY\b", blanked)
    if len(slot_writes) == 0:
        viol.append("no setValidated(RG_SLOTS_KEY, ...) -- the single slot-doc writer is missing")
    elif len(slot_writes) > 1:
        viol.append(f"RG_SLOTS_KEY is written {len(slot_writes)}x -- a second writer bypasses the "
                    f"single chokepoint; ALL mutation must route through writeSlotDoc")
    if re.search(r"\bset\(\s*RG_SLOTS_KEY\b", blanked):
        viol.append("RG_SLOTS_KEY is written via raw set() -- the slot doc must go through "
                    "setValidated (the Zod write boundary), not the unchecked fast path")

    # (2) the one writer EMITS the cascade.
    w_orig, w_blank = body(r"function\s+writeSlotDoc\b")
    if w_orig is None:
        viol.append("private writer writeSlotDoc not found -- the single-writer spine is gone")
    else:
        if "emit(" not in w_blank:
            viol.append("writeSlotDoc does not call emit() -- a silent write leaves every "
                        "subscriber stale (the cascade IS the discipline)")
        elif "regimen:changed" not in w_orig:
            viol.append("writeSlotDoc emits, but not the `regimen:changed` event")

    # (1)+(3) the five legacy chokepoints survive; the four slot-backed ones DELEGATE.
    for fn in _S31_LEGACY_CHOKEPOINTS:
        b_orig, b_blank = body(r"export\s+function\s+" + fn + r"\b")
        if b_orig is None:
            viol.append(f"chokepoint `{fn}` is MISSING from state/regimen.ts (its export must "
                        f"survive -- the burning views still import it)")
            continue
        if "writeSlotDoc(" not in b_blank:
            viol.append(f"`{fn}` does not route through writeSlotDoc -- every regimen "
                        f"mutation must reach the single writer")

    # (5) localStorage confined to core/storage.ts. Match the real LS API surface, NOT a
    # bare `localStorage.` -- an earlier cut used r"\blocalStorage\s*\." and RED-flagged FIVE
    # INNOCENT FILES by matching the FULL STOP in prose: "Pure reads only -- no mutation, no
    # localStorage. The corpus is canonical". Three of those comments were promising exactly
    # the opposite of the violation they were accused of, which only reading the flagged lines
    # revealed. An over-firing gate teaches people to switch gates off, which is worse than
    # the hole it guards.
    for rel, src in view_srcs:
        if _LS_API_RE.search(src):
            viol.append(f"{rel} touches localStorage directly -- the storage chokepoint is "
                        f"core/storage.ts alone")
    if not re.search(r"localStorage\.setItem", storage_src):
        viol.append("core/storage.ts no longer writes localStorage -- the chokepoint moved; "
                    "this gate is now pointing at the wrong file and must be re-anchored")
    return (False, "S31 routing broken: " + "; ".join(viol[:5])) if viol else (
        True, f"slot model: 1 writer (setValidated RG_SLOTS_KEY, emits regimen:changed); all "
              f"{len(_S31_LEGACY_CHOKEPOINTS)} legacy chokepoints survive + route correctly; "
              f"{len(_S31_RETIRED_KEYS)} retired keys write-free; localStorage confined to "
              f"core/storage.ts across {len(view_srcs)} scanned file(s)")


def check_regimen_state_mutation_routing():
    """Storage-chokepoint discipline -- see the block comment above for the full contract:
    every regimen mutation routes through one private writer, and only core/storage.ts is
    allowed to touch localStorage."""
    src_dir = ROOT / "dashboard" / "assets" / "js" / "src"
    reg = src_dir / "state" / "regimen.ts"
    sto = src_dir / "core" / "storage.ts"
    if not (reg.exists() and sto.exists()):
        return True, "dashboard src not installed (bootstrap-guard)"
    others = []
    for pth in sorted(src_dir.rglob("*.ts")):
        if pth == sto:
            continue          # the one file allowed to touch localStorage
        if pth.name.endswith(".test.ts"):
            continue
        others.append((pth.relative_to(ROOT).as_posix(), pth.read_text(encoding="utf-8")))
    return _regimen_state_mutation_routing_impl(
        reg.read_text(encoding="utf-8"), sto.read_text(encoding="utf-8"), others)


# ---------------------------------------------------------------------------
# slot_invariants -- the slot system's structural guards
# ---------------------------------------------------------------------------
# HONEST STATIC/RUNTIME SPLIT. A Python gate reading TS SOURCE can prove the
# enforcing CODE EXISTS; it cannot observe runtime state. So this STATIC gate proves:
#   - SlotDocSchema enforces >=1 slot (.min(1)), <=4 (.max(4)), <=20 trash (.max(20)), <=7 slotTrash (.max(7)),
#     and activeSlot-resolves (a superRefine naming activeSlot) -- at the Zod boundary,
#     so a torn/hand-edited document cannot be READ BACK as valid;
#   - writeSlotDoc re-validates on WRITE (setValidated(..., SlotDocSchema));
#   - addSlot has a cap-refusal branch (MAX_SLOTS -> {ok:false}), never a silent drop;
#   - deleteSlot refuses the last slot (length <= 1 -> {ok:false}) AND reassigns activeSlot
#     (promotes a survivor).
# The runtime BEHAVIOUR (the 5th add is actually refused; deleting the active slot actually
# promotes the lowest survivor) is proven by tools/probes/render_probe_slots.js on the real file://
# app. If that probe is not run, invariants 2 + 4 are unenforced and must be labeled WISH,
# never sold as statically gated: a green static check is not proof the code runs correctly.


def _slot_invariants_impl(schema_src, regimen_src):
    """Params are source strings so the negative test can drive planted code."""
    viol = []

    # --- schema half: the runtime guards EXIST on SlotDocSchema ---
    si = schema_src.find("SlotDocSchema = z")
    sj = schema_src.find("// Inferred types", si) if si != -1 else -1
    doc = schema_src[si:sj] if (si != -1 and sj != -1) else ""
    if not doc:
        viol.append("SlotDocSchema definition not found in core/schemas/regimen.ts")
    else:
        if ".min(1)" not in doc:
            viol.append("SlotDocSchema.slots missing .min(1) -- the >=1-slot invariant is not "
                        "enforced at the Zod boundary")
        if ".max(4)" not in doc:
            viol.append("SlotDocSchema.slots missing .max(4) -- the <=4-slot cap is not "
                        "enforced at the Zod boundary")
        if ".max(20)" not in doc:
            viol.append("SlotDocSchema.trash missing .max(20) -- the trash ring cap is not "
                        "enforced at the Zod boundary")
        if ".max(7)" not in doc:
            viol.append("SlotDocSchema.slotTrash missing .max(7) -- the save-bin ring cap is not "
                        "enforced at the Zod boundary")
        if "superRefine" not in doc or "activeSlot" not in doc:
            viol.append("SlotDocSchema has no superRefine naming activeSlot -- a document whose "
                        "activeSlot does not resolve could be read back as valid")

    # --- state half: the refusal + promotion CODE exists ---
    blanked = _blank_noncode(regimen_src)

    def body(header_regex):
        sp = _ts_fn_span(blanked, header_regex)
        if sp is None:
            return None
        b, e = sp
        return blanked[b:e]

    w = body(r"function\s+writeSlotDoc\b")
    if w is None:
        viol.append("writeSlotDoc not found -- the single-writer spine is gone")
    elif "setValidated(" not in w or "SlotDocSchema" not in w:
        viol.append("writeSlotDoc does not write through setValidated(..., SlotDocSchema) -- "
                    "the write boundary is not re-validating the document")

    a = body(r"export\s+function\s+addSlot\b")
    if a is None:
        viol.append("addSlot not found")
    elif "MAX_SLOTS" not in a or "ok: false" not in a:
        viol.append("addSlot has no cap-refusal branch (MAX_SLOTS check returning {ok:false}) -- "
                    "the 5th add could be silently dropped")

    d = body(r"export\s+function\s+deleteSlot\b")
    if d is None:
        viol.append("deleteSlot not found")
    else:
        if "ok: false" not in d or ("<= 1" not in d and "<=1" not in d):
            viol.append("deleteSlot has no last-slot refusal (length <= 1 -> {ok:false}) -- the "
                        "only regimen slot could be deleted")
        if "activeSlot" not in d:
            viol.append("deleteSlot does not reassign activeSlot -- deleting the active slot "
                        "could leave activeSlot dangling")

    return (False, "slot invariants unenforced: " + "; ".join(viol[:5])) if viol else (
        True, "SlotDocSchema enforces >=1/<=4 slots + <=20 trash + <=7 slotTrash + activeSlot-resolves (Zod, both "
              "boundaries); addSlot refuses the 5th with a reason; deleteSlot refuses the last + "
              "promotes a survivor. Runtime BEHAVIOUR proven by render_probe_slots.js (R7: this "
              "static gate proves the guards EXIST, not that they RUN)")


def check_slot_invariants():
    """Slot-system structural guards -- see the block comment above for the static/runtime
    split and why the runtime half rests on render_probe_slots.js."""
    src_dir = ROOT / "dashboard" / "assets" / "js" / "src"
    schema = src_dir / "core" / "schemas" / "regimen.ts"
    reg = src_dir / "state" / "regimen.ts"
    if not (schema.exists() and reg.exists()):
        return True, "dashboard src not installed (bootstrap-guard)"
    return _slot_invariants_impl(
        schema.read_text(encoding="utf-8"), reg.read_text(encoding="utf-8"))


# ---------------------------------------------------------------------------
# essentials_canon_matches_graphic -- THE MEMBERSHIP ANCHOR
# ---------------------------------------------------------------------------
# THE HOLE THIS CLOSES. essentials-canon.json's MEMBERSHIP -- which 91 substances are the
# 90 essentials -- had no anchor outside our own app. Its own `provenance` field says it
# plainly: "Bootstrapped 2026-06-24 from dashboard/assets/data/coverage-layout-data.json".
# Traced back one more link, that layout came from
# dashboard/components/workspace-coverage-v3.2-PROPOSAL.html (since deleted) -- a UI DESIGN
# MOCKUP, dated three days before the canon. The tell: the canon's mineral order inside the invented
# rare_trace tier is alphabetical BY ATOMIC SYMBOL (Ag, Al, As, Au, Ba, Be), which is how a
# list is lifted off a rendered table, not authored from a source.
#
# Every existing gate was blind to this BY CONSTRUCTION. corpus_integrity + the golden
# hashes prove the canon has not CHANGED (stale-to-stale equality is not truth --
# sealing a fabrication makes it permanent, not correct). derived_artifacts_fresh proved the
# layout regenerates from the canon, which was guaranteed: the canon was bootstrapped FROM
# that artifact, so "zero diff" proved ring consistency, not truth. graphics_integrity
# sha256s the JPG but cannot read membership out of an image.
#
# THE ANCHOR CHAIN this establishes:
#   sealed JPG bytes  ->  the transcription (bound by source.file_sha256)  ->  the canon
#      graphics_integrity          THIS GATE (both halves)            THIS GATE
#
# WHAT IS NOT PROVEN, and cannot be -- label it, never sell it: that the transcription
# is an accurate READING of the image. No machine checks that; it is human-verifiable by
# opening the JPG. That is a real limit. It is still strictly better than the mockup: a
# misread is visible to anyone who looks, whereas the mockup ancestry was invisible for
# three weeks under a green board.
#
# SCOPE: MEMBERSHIP ONLY -- which slugs, and how many per category. Deliberately NOT the
# parenthetical sub-names: the graphic prints "Omega 3 (Linoleic)" / "Omega 6 (Linolenic)"
# (swapped vs standard biochemistry) and "Omega 9 (Arachidonic)" where the canon says Oleic.
# That divergence is adjudicated in chronicle/contradictions/2026-07-08-omega9-arachidonic-
# correction.md. Widening this gate to sub-names would re-litigate a settled ruling.
#
# The graphic ALSO independently corroborates that the app's mineral TIERS are invented: it
# prints all 60 minerals as one flat A-Z list, with no grouping of any kind.
def _essentials_canon_matches_graphic_impl(canon, transcription, jpg_sha):
    viol = []
    src = transcription.get("source", {})

    # (1) the transcription must be bound to the EXACT image it claims to transcribe.
    # Without this the transcription is just another hand-typed file that can drift from
    # its own source -- i.e. the bug this gate exists to fix, one level up.
    claimed = src.get("file_sha256")
    if not claimed:
        viol.append("transcription declares no source.file_sha256 — it is not bound to any image")
    elif jpg_sha and claimed != jpg_sha:
        viol.append(f"the graphic CHANGED since transcription: jpg is {jpg_sha[:16]}... but the "
                    f"transcription was taken from {claimed[:16]}... — re-read the image, do not "
                    f"re-point the hash")

    # (2) canon membership == the graphic's membership, per category.
    want = {
        "mineral":    {m.lower() for m in transcription.get("minerals", [])},
        "vitamin":    {v["canon_slug"] for v in transcription.get("vitamins", [])},
        "amino_acid": {a["canon_slug"] for a in transcription.get("amino_acids", [])},
        "fatty_acid": {f["canon_slug"] for f in transcription.get("fatty_acids", [])},
    }
    for cat in ("mineral", "vitamin", "amino_acid", "fatty_acid"):
        rows = [e for e in canon.get("essentials", []) if e.get("category") == cat]
        # minerals are matched on display_name (the graphic prints element names); the other
        # three on slug (the graphic prints labels + its own typos, mapped in the fixture).
        got = ({e["display_name"].lower() for e in rows} if cat == "mineral"
               else {e["slug"] for e in rows})
        missing, extra = want[cat] - got, got - want[cat]
        if missing:
            viol.append(f"{cat}: in the GRAPHIC but NOT the canon: {sorted(missing)[:6]}")
        if extra:
            viol.append(f"{cat}: in the CANON but NOT the graphic: {sorted(extra)[:6]}")

    # (3) the declared counts must match both sides -- catches a transcription that lists 59
    # minerals while claiming 60.
    tc = transcription.get("counts", {})
    for cat, key in (("mineral", "minerals"), ("vitamin", "vitamins"),
                     ("amino_acid", "amino_acids"), ("fatty_acid", "fatty_acids")):
        n_canon = len([e for e in canon.get("essentials", []) if e.get("category") == cat])
        if tc.get(key) != n_canon:
            viol.append(f"count drift on {key}: transcription says {tc.get(key)}, canon has {n_canon}")
        if tc.get(key) != len(want[cat]):
            viol.append(f"transcription's own {key} count ({tc.get(key)}) != the {len(want[cat])} "
                        f"it actually lists")
    if viol:
        return False, ("the canon's membership does NOT match the sealed authority graphic: "
                       + "; ".join(viol[:4]))
    return True, (f"canon membership matches the sealed authority graphic "
                  f"({tc.get('minerals')} minerals · {tc.get('vitamins')} vitamins · "
                  f"{tc.get('amino_acids')} aminos · {tc.get('fatty_acids')} fatty acids = "
                  f"{tc.get('total')}, {tc.get('essential')} essential), transcription bound to "
                  f"the image bytes. NOTE: proves membership, not that the transcription READS "
                  f"the image correctly — verify that by eye")


def check_essentials_canon_matches_graphic():
    """The membership anchor -- see the block comment above for the loop this breaks and the
    one thing it deliberately does NOT prove."""
    canon_p = ROOT / "eden/corpus/essentials-canon.json"
    tr_p = ROOT / "eden/graphics/90-nutrients-front.transcription.json"
    jpg_p = ROOT / "eden/graphics/90-nutrients-front.jpg"
    if not (canon_p.exists() and tr_p.exists()):
        return True, "canon / graphic transcription not installed (bootstrap-guard)"
    jpg_sha = _file_hash(jpg_p) if jpg_p.exists() else ""
    return _essentials_canon_matches_graphic_impl(
        json.loads(canon_p.read_text(encoding="utf-8")),
        json.loads(tr_p.read_text(encoding="utf-8")),
        jpg_sha)


def check_dose_amount_in_verbatim():
    """§00.A -- see the block comment above for the full contract, the three
    adversarial breaks that shaped it, and what it does NOT check."""
    canon = json.loads((ROOT / "eden/corpus/essentials-canon.json").read_text(encoding="utf-8"))
    claims = []
    for p in sorted((ROOT / "eden/corpus/claims").glob("*.json")):
        d = json.loads(p.read_text(encoding="utf-8"))
        claims.extend(d.get("claims", d) if isinstance(d, dict) else d)
    return _dose_amount_in_verbatim_impl(claims, canon)


def check_amounts_wallach_only():
    """§00.A wrapper -- see _amounts_wallach_only_impl for the full contract.
    Thin path-binding shell over the impl so a negative test can drive the same logic with a
    tampered artifact (proving the gate goes RED on poison, not just green on truth)."""
    embed = ROOT / "dashboard" / "assets" / "data" / "essentials-targets-data.json"
    canon_p = ROOT / "eden" / "corpus" / "essentials-canon.json"
    claims_dir = ROOT / "eden" / "corpus" / "claims"
    return _amounts_wallach_only_impl(embed, canon_p, claims_dir)


# Slug sets where ONE substance legitimately carries >1 canon name, so a single dose DOES
# fan to both. This is the ONLY exemption from collective_doses_not_fanned's fail-closed
# arity check -- every entry needs a stated reason, and adding one is a deliberate act.
#
# ★ EMPTY, AND ITS ONLY EVER ENTRY WAS A FABRICATION. Removing it was a tightening,
# never a loosening. It read:
#     cobalt/vitamin-b12: cobalt is the metal atom at the centre of the cobalamin molecule;
#     Wallach's "250-400 mcg" is one intake described by both names, not a split budget.
# That reason REFUTES ITSELF: "the metal atom at the centre of" is a PART-OF relation; "one
# intake described by both names" is an IDENTITY relation. An atom inside a molecule is not
# the molecule -- 400 mcg of B12 carries ~4% of that mass as cobalt. The carve-out let a B12
# dose post a 400 mcg ELEMENTAL COBALT target, and because the exemption lived HERE, the gate
# built to catch exactly that class reported green while it happened.
# Both claims now carry dose.applies_to = ["vitamin-b12"] (the amount is B12's), so they map
# one dosed essential each and need no exemption. The evidence and the ruling that
# removed the carve-out: chronicle/contradictions/2026-07-15-cobalt-elemental-vs-b12.md
#
# THE LESSON, for whoever is tempted to add the next entry: an exemption is a claim about the
# WORLD, not a build fix. This one was chemistry nobody checked against the books, written
# into gate source where no reviewer looks for chemistry. If you cannot cite a Wallach
# verbatim for the identity, there is no identity -- split the claim or use applies_to.
_SAME_SUBSTANCE_SLUGS = ()


def _pdm_group_not_named_rare_earths_impl(copy_p, layout_p):
    """The PLANT DERIVED group may not be LABELLED "rare earth(s)" on any user-facing surface.

    NOT pedantry — it is the original sin one layer down. The group is defined by HAVING NO
    INDIVIDUAL WALLACH DOSE, never by chemistry: Wallach header-tags exactly 15 of the 60 as
    rare earths in Immortality's A-Z (cerium :5760 ... ytterbium :10233) and pointedly calls
    scandium "a rare element" (:9514), NOT a rare earth. So 19 of the 34 in this group are not
    rare earths by his OWN tagging, and naming the group after them asserts a chemical
    hierarchy he does not hold -- the same invention as the deleted FOUNDATIONAL / MAJOR TRACE
    / RARE TRACE tiers, since removed for exactly this reason. The affirmative kill is his own sentence,
    hk.txt:7312-7314 (book sources are not distributed publicly -- see eden/corpus/README):
    "The concentration of trace elements in tissue or requirement levels does
    not represent their relative importance as an essential nutrient."

    WHY THIS GATE EXISTS AT ALL: pdm_coverage_derive.py's docstring has said "do
    not rename it back" since the group was created -- and the USER-FACING copy said "Rare Earth
    Minerals" and "of the rare-earth group goal" the whole time. A rule with no gate is a WISH
    (R7), and this one had already been broken on the only surface a user can see. The code
    comment governed the code; nothing governed the label.

    SCOPE, deliberately narrow: only the group's NAME/LABEL fields (the grouptag chip, the
    coverage-of caption, the layout section labels). Prose that MENTIONS rare earths in passing
    is legitimate and untouched -- Wallach really does tag 15 of them that way.
    """
    import json as _json
    if not copy_p.exists():
        return True, "view-copy not installed (bootstrap-guard)"

    bad = []
    ui = (_json.loads(copy_p.read_text(encoding="utf-8")) or {}).get("ui", {})
    for key in ("kd_ep_pdm_grouptag", "kd_ep_pdm_covof", "kd_ep_pdm_targetlabel"):
        val = str(ui.get(key, ""))
        if "rare earth" in val.lower() or "rare-earth" in val.lower():
            bad.append(f"view-copy.json ui.{key} = {val!r}")

    if layout_p.exists():
        layout = _json.loads(layout_p.read_text(encoding="utf-8"))
        def _walk(o):
            if isinstance(o, dict):
                lab = str(o.get("label", ""))
                if lab and ("rare earth" in lab.lower() or "rare-earth" in lab.lower()):
                    bad.append(f"coverage-layout label = {lab!r}")
                for v in o.values():
                    _walk(v)
            elif isinstance(o, list):
                for v in o:
                    _walk(v)
        _walk(layout)

    if bad:
        return False, ("the plant-derived group is LABELLED 'rare earth' on a user-facing "
                       "surface — 19 of its 34 are not rare earths by Wallach's own tagging; "
                       "the group is defined by having no individual dose: " + "; ".join(bad[:3]))
    return True, ("the plant-derived group's user-facing labels name it by its DEFINITION "
                  "(no individual Wallach dose), not by a chemistry Wallach does not assert")


def check_pdm_group_not_named_rare_earths():
    """Thin path-binding shell so a negative test can drive the impl on planted copy."""
    return _pdm_group_not_named_rare_earths_impl(
        ROOT / "dashboard/assets/data/view-copy.json",
        ROOT / "dashboard/assets/data/coverage-layout-data.json",
    )


def _fn_body(src, name):
    """Return the brace-balanced body of `export function <name>(...)`, or None.

    Brace-aware ON PURPOSE (the same R9 lesson as regimen_state_mutation_routing): a naive
    "next N lines" window lets a neighbouring function's code be read as this one's, so a
    filter living in the WRONG function would satisfy a lazy scan. We find the header, walk
    to its opening brace, then count depth to the matching close.
    """
    import re as _re
    m = _re.search(r"export\s+function\s+" + _re.escape(name) + r"\s*\(", src)
    if not m:
        return None
    i = src.find("{", m.end())
    if i < 0:
        return None
    depth, j = 0, i
    while j < len(src):
        if src[j] == "{":
            depth += 1
        elif src[j] == "}":
            depth -= 1
            if depth == 0:
                return src[i:j + 1]
        j += 1
    return None


def _kids_products_not_recommended_impl(excl_p, products_p, rec_src_p, rec_data_p):
    """Kids-formulated products may NEVER reach a recommendation surface — and MUST stay in the DB.

    THE PRODUCT RULE: kids-formulated products are never RECOMMENDED as items -- no adult is
    going to take them -- but they must STAY in the database, discoverable in the Products tab
    of the knowledge drawer. The app's audience is adults; kids never use it directly.

    THE ASYMMETRY IS THE REQUIREMENT, so this gate asserts BOTH halves:
      rankSources (every rec surface funnels through it)      MUST filter.
      essentialSlugsByProduct (the Products-tab database path) MUST NOT.
    Filtering the second would "fix" the first into a violation — hiding kids products from the
    catalogue where they must stay discoverable. Both directions are RED here.

    WHY IT IS NOT A DERIVE-TIME FILTER (and why this gate reads SOURCE, not just data): both
    consumers read the same generated product-recommender-data.json, so stripping kids products
    from the artifact would erase them from the Products tab too — elegant in the derive, a lie
    on the screen. The exclusion is therefore a
    read-time filter, which means it is exactly one careless refactor from vanishing. Hence a gate.

    THE FAIL-OPEN TRAP THIS CLOSES: every failure mode here is SILENT and looks like success —
    a typo'd product_id, a dropped filter, an empty list. Nothing goes red on screen; kids
    products simply start being recommended again. So an unresolvable id is RED (never skipped),
    and the anti-vacuity check below refuses to certify a filter that is filtering nothing.

    SCOPE / HONEST LIMIT: this proves the PLUMBING — the list resolves and the filter is
    wired the right way round. It CANNOT prove the list is COMPLETE. That no further kids
    product is sitting unlisted in the pillar rests on a manual sweep of every product label
    and marketing description, and on human review — not on this check. Membership is a
    curation judgment; only its enforcement is mechanical.
    """
    import json as _json
    if not excl_p.exists():
        return False, "kids-exclusion.json is MISSING — the do-not-recommend list cannot be enforced"

    doc = _json.loads(excl_p.read_text(encoding="utf-8"))
    excluded = doc.get("excluded")
    if not isinstance(excluded, list) or not excluded:
        return False, ("kids-exclusion.json has an empty/absent `excluded` list — this FAILS OPEN "
                       "(every kids product silently returns to the ranking while the UI looks fine)")

    ids = [e.get("product_id") for e in excluded if isinstance(e, dict)]
    if any((not isinstance(i, str)) or not i for i in ids):
        return False, "kids-exclusion.json has an entry with a missing/blank product_id"
    if len(set(ids)) != len(ids):
        return False, "kids-exclusion.json lists a duplicate product_id"

    # (a) Every id must resolve against the sealed pillar. A typo here would silently
    #     un-exclude a kids product — the exact fail-open this list exists to prevent.
    if products_p.exists():
        pillar = (_json.loads(products_p.read_text(encoding="utf-8")) or {}).get("products", {})
        unknown = [i for i in ids if i not in pillar]
        if unknown:
            return False, ("kids-exclusion.json names product_id(s) that do NOT resolve in the "
                           "sealed Products pillar — a typo silently un-excludes a kids product: "
                           + ", ".join(sorted(unknown)[:4]))

    # (b)+(c) The two halves of the boundary, read from SOURCE.
    if not rec_src_p.exists():
        return False, "state/recommender.ts is MISSING — cannot verify the recommendation filter"
    src = rec_src_p.read_text(encoding="utf-8")

    if "isExcludedFromRecommendations" not in src:
        return False, ("state/recommender.ts does not import/apply isExcludedFromRecommendations — "
                       "the kids exclusion is NOT wired into the recommender at all")

    rank_body = _fn_body(src, "rankSources")
    if rank_body is None:
        return False, "state/recommender.ts: could not locate `export function rankSources` to verify the filter"
    if "isExcludedFromRecommendations" not in rank_body:
        return False, ("state/recommender.ts::rankSources does NOT filter through "
                       "isExcludedFromRecommendations — kids products can reach EVERY recommendation "
                       "surface (Coverage recs, condition pages, the element detail view's BEST SOURCES)")

    idx_body = _fn_body(src, "essentialSlugsByProduct")
    if idx_body is None:
        return False, ("state/recommender.ts: could not locate `export function essentialSlugsByProduct` "
                       "to verify the Products-tab path is left whole")
    if "isExcludedFromRecommendations" in idx_body:
        return False, ("state/recommender.ts::essentialSlugsByProduct FILTERS kids products — that is "
                       "the Products-tab DATABASE path, where they must stay "
                       "discoverable. Excluded from being RECOMMENDED, never hidden from the catalogue")

    # (d) ANTI-VACUITY. If no excluded product is even a candidate, the filter is filtering
    #     nothing and this gate would certify a dead branch as green — a check that cannot
    #     fail proves nothing.
    live = []
    if rec_data_p.exists():
        rec = (_json.loads(rec_data_p.read_text(encoding="utf-8")) or {}).get("essentials", {})
        for slug, entry in rec.items():
            for c in (entry or {}).get("candidates", []):
                if c.get("product_id") in ids:
                    live.append(c.get("product_id"))
        if not live:
            return False, ("no excluded product appears as a recommender candidate — the kids filter "
                           "is a DEAD BRANCH and this gate would be certifying nothing. Either the "
                           "recommender data changed shape or the ids drifted")

    n_live = len(set(live))
    return True, (f"{len(ids)} kids product(s) excluded from every recommendation surface, all "
                  f"resolving in the sealed pillar ({n_live} live as recommender candidates, so the "
                  f"filter is load-bearing); rankSources filters, essentialSlugsByProduct (the "
                  f"Products-tab database path) deliberately does not")


def _goal_members_actionable_impl(layout_p, targets_p, derive_p, coverage_ts_p):
    """Gate for GOAL MEMBERSHIP on the Coverage board.

    A goal RING means "a goal nutrient you have NOT covered" -- a to-do marker. So a goal may
    only name an essential the user can actually ACT on individually. Two classes cannot be,
    and both are asserted here because NOTHING else watches them:

      1. The PLANT DERIVED 34 (target.kind == 'trace_pdm'). Wallach states no individual
         amount for these; they share ONE verdict off the colloidal-mineral bottle, so a ring
         on one is a to-do the user cannot do: Wallach never itemises these, so they can never
         be "named for" a goal.
      2. The fiat-covered FOUNDATIONAL 4 (H/C/N/O) -- forced covered because you breathe.
         Nothing to take, so there is no goal to set. PHOSPHORUS is deliberately NOT in this
         class: its covered status traces to a sealed Wallach claim (target.low == 0), not to
         the fiat, so it stays goal-nameable.

    THE CHECK THAT EARNS THIS GATE'S KEEP is #3: coverage_layout_derive.py must MIRROR
    state/coverage.ts's FOUNDATIONAL_PRESENT_SLUGS, because Python cannot import TypeScript
    and the list is therefore written twice. A silent drift there would quietly change which
    essentials a goal may name, on a green board, with no other check watching -- the exact
    shape of every expensive failure in this project. Single-source-of-truth by ENFORCEMENT,
    since it cannot be single-source by construction.
    """
    import json as _json
    import re as _re

    problems = []
    layout = _json.loads(layout_p.read_text(encoding="utf-8"))
    targets = _json.loads(targets_p.read_text(encoding="utf-8"))
    derive_src = derive_p.read_text(encoding="utf-8")
    cov_src = coverage_ts_p.read_text(encoding="utf-8")

    pdm = {e["slug"] for e in targets["essentials"]
           if (e.get("target") or {}).get("kind") == "trace_pdm"}

    # 3. The mirrored fiat list must MATCH coverage.ts's FOUNDATIONAL_PRESENT_SLUGS.
    m = _re.search(r"FOUNDATIONAL_PRESENT_SLUGS[^=]*=\s*new Set\(\[(.*?)\]\)", cov_src, _re.S)
    if m is None:
        problems.append("state/coverage.ts: FOUNDATIONAL_PRESENT_SLUGS not found -- the fiat "
                        "set moved or was renamed; the derive's mirror can no longer be checked")
        ts_fiat = set()
    else:
        ts_fiat = set(_re.findall(r"'([a-z0-9-]+)'", m.group(1)))
    m2 = _re.search(r"FIAT_COVERED_SLUGS\s*=\s*frozenset\(\{(.*?)\}\)", derive_src, _re.S)
    if m2 is None:
        problems.append("coverage_layout_derive.py: FIAT_COVERED_SLUGS not found")
        py_fiat = set()
    else:
        py_fiat = set(_re.findall(r'"([a-z0-9-]+)"', m2.group(1)))
    if ts_fiat and py_fiat and ts_fiat != py_fiat:
        problems.append(
            f"FIAT DRIFT: coverage_layout_derive.FIAT_COVERED_SLUGS {sorted(py_fiat)} != "
            f"state/coverage.ts FOUNDATIONAL_PRESENT_SLUGS {sorted(ts_fiat)} -- one list "
            "changed and the other did not; goal membership silently diverges from the field")

    goals = layout.get("goals", [])
    if not goals:
        problems.append("coverage-layout-data.json carries NO goals -- anti-vacuity: a gate "
                        "over an empty set certifies nothing")

    # canon slugs actually on the board, for the resolution check
    tiles = []
    for sec in layout.get("sections", []):
        tiles += sec.get("tiles") or [t for s in sec.get("subsections", []) for t in s["tiles"]]
    board = {t["slug"] for t in tiles if "slug" in t}

    for g in goals:
        gid = g.get("id", "?")
        members = g.get("members") or []
        if not members:
            problems.append(f"goal {gid!r}: ZERO members -- an empty chip highlights nothing")
        # 1 + 2: no unactionable member
        for bad, why in ((pdm, "trace_pdm (no individual Wallach amount -- one shared verdict)"),
                         (py_fiat, "fiat-covered (nothing to take, so no goal to set)")):
            hit = sorted(set(members) & bad)
            if hit:
                problems.append(f"goal {gid!r} names UNACTIONABLE member(s) {hit} -- {why}")
        # every member must be a real tile on the board
        stray = sorted(set(members) - board)
        if stray:
            problems.append(f"goal {gid!r} names member(s) not on the board: {stray}")
        # NO per-goal total, ever: membership is what you LOOK AT; a total is a DENOMINATOR,
        # and the denominator is always 90.
        if "total" in g:
            problems.append(f"goal {gid!r} carries a `total` -- a per-goal denominator is "
                            "forbidden (a goal may never change what you are MEASURED against)")

    if problems:
        return False, "; ".join(problems[:6])
    return True, (f"{len(goals)} goals: every member is actionable "
                  f"(no trace_pdm, no fiat-covered), resolves on the board, and carries no "
                  f"per-goal total; the derive's fiat list matches coverage.ts "
                  f"({sorted(py_fiat)})")


def check_goal_members_actionable():
    """Thin path-binding shell so a negative test can drive the impl on planted copies."""
    return _goal_members_actionable_impl(
        ROOT / "dashboard/assets/data/coverage-layout-data.json",
        ROOT / "dashboard/assets/data/essentials-targets-data.json",
        ROOT / "eden/tools/coverage_layout_derive.py",
        ROOT / "dashboard/assets/js/src/state/coverage.ts",
    )


def _pdm_group_goals_wallach_sourced_impl(layout_p, claims_dir):
    """Gate for GROUP goal membership (the plant-derived dots on the Coverage board).

    THE RULE: the plant-derived 34 can never be named INDIVIDUALLY by a goal (Wallach states
    no per-element amount -- that half is `goal_members_actionable`). But he DOES prescribe the
    colloidal-mineral COMPLEX by name for named conditions, so a goal may name the GROUP:
    coverage-layout-data.json's `goals[].groups`. This gate proves every such claim of ours is
    HIS, and that we dropped none of his.

    WHY IT RE-DERIVES INSTEAD OF TRUSTING THE ARTIFACT: it recomputes membership
    from the SEALED CLAIMS ITSELF and byte-compares to the posted `groups`. It deliberately
    does NOT import coverage_layout_derive -- a gate that asks the derive whether the derive was
    right is a derive bug silencing its own alarm.

    Checks, and each one's failure mode:
      1. OVER-CLAIM -- a goal posts `groups` with no sealed claim naming the complex for any of
         its conditions. This is the dangerous direction: it would put a health attribution on
         the field that Wallach never made (§00.A).
      2. UNDER-CLAIM -- a sealed claim names the complex for a goal's condition but the goal
         posts no `groups`. Silent, invisible on screen, and exactly how a real Wallach
         attribution rots out of the app as mining continues.
      3. DANGLING -- a `groups` id with no matching subsection `id` in the layout. The dots
         would bind to nothing and render nowhere.
      4. ANTI-VACUITY -- if NO goal names the group, checks 1-3 pass trivially forever. A gate
         that cannot fail proves nothing.

    ★ THE PHRASE IS THE POINT, and the negative test pins it: `colloidal minerals` (plural, the
    COMPLEX) matches; `colloidal calcium` / `colloidal selenium` / `colloidal tin` (a SINGLE
    element, which belongs to the INDIVIDUALLY DOSED 21) must NOT. Reading the claim's OWN
    verbatim -- not a window around it, and not its `other_substances` tag -- is what makes
    neighbouring-entry bleed impossible: a character window around a match reads the NEXT
    entry's text and produces confident false positives.

    ★ HONEST LIMIT (R7, labelled not hidden): matching the WORDS does not prove the STANCE. A
    verbatim reading "colloidal minerals are useless for X" would satisfy this gate. That half
    rests on the mining review + the adversarial read, and no non-gaming machine check exists
    for it. This gate proves PROVENANCE, never MEANING.
    """
    import json as _json
    import re as _re

    problems = []
    layout = _json.loads(layout_p.read_text(encoding="utf-8"))

    # The layout's own subsection ids — a `groups` entry must resolve to one.
    sub_ids = {
        s["id"]
        for sec in layout.get("sections", [])
        for s in (sec.get("subsections") or [])
        if s.get("id")
    }

    GROUP_RE = _re.compile(r"colloidal\s+minerals?", _re.I)

    def dehy(s):
        """Rejoin print line-wraps ("colloi-\\ndal min-\\nerals") before matching. Without this
        the gate silently UNDER-matches every hyphenated occurrence and would red-flag a real
        attribution as an over-claim — a false alarm that gets a gate deleted."""
        return _re.sub(r"\s+", " ", _re.sub(r"-\s*\n\s*", "", s or "")).strip()

    # Recompute from the sealed pillar, independently of the derive.
    claims = []
    for shard in sorted(claims_dir.glob("claims-*.json")):
        claims.extend(_json.loads(shard.read_text(encoding="utf-8")).get("claims", []))
    group_claims = [
        c for c in claims
        if "search-only" not in (c.get("tags") or [])
        and GROUP_RE.search(dehy(c.get("verbatim")))
    ]

    posted = 0
    for g in layout.get("goals", []):
        conds = set(g.get("conditions") or [])
        supporting = sorted(
            c["id"] for c in group_claims if set(c.get("conditions") or []) & conds
        )
        groups = g.get("groups") or []
        if groups:
            posted += 1
        # 3. dangling id
        for gid in groups:
            if gid not in sub_ids:
                problems.append(
                    f"goal {g['id']!r} names group {gid!r}, which is not a subsection id in "
                    f"the layout ({sorted(sub_ids)}) — the dots would bind to nothing"
                )
        # 1. over-claim
        if groups and not supporting:
            problems.append(
                f"goal {g['id']!r} posts groups={groups} but NO sealed claim names the "
                f"colloidal-mineral complex for any of its conditions {sorted(conds)} — a "
                f"health attribution Wallach did not make (§00.A)"
            )
        # 2. under-claim
        if supporting and not groups:
            problems.append(
                f"goal {g['id']!r} posts no groups, but sealed claim(s) {supporting} name the "
                f"colloidal-mineral complex for its conditions — a real Wallach attribution "
                f"dropped silently"
            )

    # 4. anti-vacuity
    if not group_claims:
        problems.append(
            "NO sealed claim names the colloidal-mineral complex — the corpus half of this "
            "gate is vacuous and every check above passes trivially"
        )
    elif posted == 0:
        problems.append(
            f"{len(group_claims)} sealed claim(s) name the complex but NO goal posts `groups` — "
            "the rule is switched off and this gate would pass forever"
        )

    if problems:
        return False, "; ".join(problems)
    return True, (
        f"{posted} of {len(layout.get('goals', []))} goals name the plant-derived group, each "
        f"traced to a sealed claim whose OWN verbatim says 'colloidal minerals' "
        f"({len(group_claims)} such claims); no goal over- or under-claims; every group id "
        f"resolves to a layout subsection. PROVENANCE only — never the stance (R7)"
    )


def check_pdm_group_goals_wallach_sourced():
    """Thin path-binding shell so a negative test can drive the impl on planted copies."""
    return _pdm_group_goals_wallach_sourced_impl(
        ROOT / "dashboard/assets/data/coverage-layout-data.json",
        ROOT / "eden/corpus/claims",
    )


def _recommendations_not_stored_impl(src_dir, data_dir):
    """A recommendation list is DERIVED at read time, never STORED.

    This is not a performance rule. It is what makes the requirement structurally true rather
    than defended-against: "remove an item -> it reappears in recommendations" is not a
    feature anyone codes, because there is no stored list to fall out of sync. The
    goal -> add -> remove-goal -> remove-item loop CANNOT exist if the list is a pure
    function of (goals, active slot, product DB).

    Checks:
      1. No localStorage key looks like a stored recommendation list.
      2. No assets/data artifact is a stored recommendation list.
      3. The ranker is PURE: state/recommender.ts must not import storage or touch
         localStorage -- if it could persist, the rule would rest on it choosing not to.
    """
    import re as _re

    def _strip_comments(s):
        """Comments are PROSE, not code. Scanning them for 'localStorage' fired on this very
        module's docstring, which says the ranker touches no localStorage -- the gate reading
        its own denial as the offence. R9: tightened with the case pinned in the test, never
        loosened."""
        s = _re.sub(r"/\*[\s\S]*?\*/", "", s)
        return _re.sub(r"//[^\n]*", "", s)

    problems = []
    rec_src = _strip_comments((src_dir / "state/recommender.ts").read_text(encoding="utf-8"))

    # 3. purity of the ranker -- real ACCESS (localStorage.foo / localStorage[...]), not the word
    if _re.search(r"\blocalStorage\s*[.\[]", rec_src):
        problems.append("state/recommender.ts touches localStorage -- the ranker must be pure")
    if _re.search(r"from\s+'[^']*core/storage", rec_src):
        problems.append("state/recommender.ts imports core/storage -- the ranker must be pure")

    # 1. no LS key that stores recommendations.
    # ★ 'recommend', NOT 'rec': the first cut matched any "rec" substring and fired on
    # scanner.ts's `lcRecentScans_v1` -- RECENT SCANS, a legitimate recoverable buffer that has
    # nothing to do with recommendations (a new scan must never silently destroy the last).
    # Over-firing on a real feature is how a gate gets deleted instead of fixed; the check was
    # tightened with the case pinned in tools/tests/test_recommendations_not_stored.py.
    KEY_RE = _re.compile(r"""['"]([A-Za-z0-9_]*[Rr]ecommend[A-Za-z0-9_]*_v\d+)['"]""")
    for p in sorted(src_dir.rglob("*.ts")):
        for k in KEY_RE.findall(_strip_comments(p.read_text(encoding="utf-8"))):
            problems.append(f"{p.relative_to(src_dir)}: localStorage-shaped key {k!r} "
                            "looks like a STORED recommendation list")

    # 2. no artifact that stores recommendations
    for p in sorted(data_dir.glob("*.json")):
        if _re.search(r"recommendation", p.name, _re.I) and "recommender-data" not in p.name:
            problems.append(f"assets/data/{p.name}: an artifact named like a stored "
                            "recommendation list")

    if problems:
        return False, "; ".join(problems[:5])
    return True, ("recommendations are derived, never stored: no rec-shaped LS key, no "
                  "rec-list artifact, and the ranker is pure (no storage import, no "
                  "localStorage). product-recommender-data.json is RANKING INPUT "
                  "(composition + price), not a stored list")


def check_recommendations_not_stored():
    """Thin path-binding shell so a negative test can drive the impl on planted copies."""
    return _recommendations_not_stored_impl(
        ROOT / "dashboard/assets/js/src",
        ROOT / "dashboard/assets/data",
    )


def check_kids_products_not_recommended():
    """Thin path-binding shell so a negative test can drive the impl on planted copies."""
    return _kids_products_not_recommended_impl(
        ROOT / "dashboard/assets/data/kids-exclusion.json",
        ROOT / "eden/products/products.json",
        ROOT / "dashboard/assets/js/src/state/recommender.ts",
        ROOT / "dashboard/assets/data/product-recommender-data.json",
    )


def _mirrors_resolve_impl(embed_p, canon_p):
    """Gate for the 'mirrors' target kind.

    A mirroring essential states NO Wallach amount and carries another essential's verdict
    instead (cobalt -> vitamin-b12: "the requirement is for a cobalt complex known as
    cyanocobalamine or vitamin B12", immortality.txt:5882-5885; no book states an elemental
    cobalt amount). state/coverage.ts resolves it in a second pass. This proves the resolution
    can never be ambiguous, circular, or silently wrong.

    FIVE CHECKS, all anchored to the SEALED canon rather than to the derive's opinion of it
    (stale-to-stale equality is not truth), so a targets_derive bug cannot also silence this:
      1. kind 'mirrors' carries a non-empty mirrors_slug -- else the view has nothing to point
         at and the tile falls statusless with no explanation.
      2. mirrors_slug RESOLVES to a real canon essential. A typo'd slug would leave the tile
         permanently blank and look exactly like an unmined essential.
      3. The mirrored essential is NOT itself a mirror -> no chains, no cycles. coverage.ts
         does a SINGLE hop; a chain would silently truncate rather than error.
      4. A mirrors target posts NO numeric `low`. This is the R2 half: the whole defect was a
         number on this tile. If one ever reappears, amounts_wallach_only would not see it
         (it skips non-numeric targets and would then start auditing a fabricated one), so
         this is the only gate watching.
      5. The canon and the artifact AGREE on which essentials mirror -- a hand-edited artifact
         cannot introduce a mirror the pillar never declared.

    ★ WHAT THIS GATE DOES NOT PROVE, stated plainly: that cobalt SHOULD mirror
    B12. That is an editorial call on a source that says it BOTH ways -- Wallach also
    writes that cobalt is "also required as a necessary cofactor for the production of the
    thyroid hormone thyroxin" (immortality.txt:5946-5947, in 3 books). This gate is structural
    only; it cannot catch a wrong mirror, only an unresolvable one. The reasoning is recorded
    in chronicle/contradictions/2026-07-15-cobalt-elemental-vs-b12.md, not certified here.
    """
    import json as _json
    if not (embed_p.exists() and canon_p.exists()):
        return True, "targets embed / canon not installed (bootstrap-guard)"

    canon = _json.loads(canon_p.read_text(encoding="utf-8"))
    ess = canon.get("essentials", canon) if isinstance(canon, dict) else canon
    by_slug = {e["slug"]: e for e in ess if isinstance(e, dict) and e.get("slug")}
    canon_mirrors = {s for s, e in by_slug.items() if e.get("coverage_kind") == "mirrors"}

    data = _json.loads(embed_p.read_text(encoding="utf-8"))
    problems = []
    art_mirrors = set()
    for entry in data.get("essentials", []):
        t = entry.get("target") or {}
        if t.get("kind") != "mirrors":
            continue
        slug = entry.get("slug")
        art_mirrors.add(slug)
        tgt = t.get("mirrors_slug")
        if not tgt:                                                       # 1
            problems.append(f"{slug}: kind 'mirrors' with no mirrors_slug")
            continue
        if tgt not in by_slug:                                            # 2
            problems.append(f"{slug}: mirrors_slug {tgt!r} resolves to no canon essential")
            continue
        if by_slug[tgt].get("coverage_kind") == "mirrors":                # 3
            problems.append(f"{slug}: mirrors {tgt!r}, which is ITSELF a mirror (chain/cycle)")
        if isinstance(t.get("low"), (int, float)):                        # 4
            problems.append(
                f"{slug}: mirrors target posts a numeric low={t['low']} — a mirroring essential "
                f"has NO Wallach amount by definition; this is the 400 mcg defect returning")

    if art_mirrors != canon_mirrors:                                      # 5
        problems.append(
            f"canon/artifact disagree on which essentials mirror: canon={sorted(canon_mirrors)} "
            f"artifact={sorted(art_mirrors)}")

    if problems:
        return False, "mirrors: " + "; ".join(problems[:4])
    if not canon_mirrors:
        return True, "no mirroring essentials declared (vacuously clean; fails closed on the first)"
    pairs = ", ".join(f"{s}->{by_slug[s].get('mirrors_slug')}" for s in sorted(canon_mirrors))
    return True, (f"{len(canon_mirrors)} mirroring essential(s) resolve to a real non-mirror "
                  f"essential and post no number ({pairs})")


def check_mirrors_resolve():
    """R7 wrapper -- see _mirrors_resolve_impl. Thin path-binding shell so a negative test can
    drive the same logic on planted data."""
    return _mirrors_resolve_impl(
        ROOT / "dashboard/assets/data/essentials-targets-data.json",
        ROOT / "eden/corpus/essentials-canon.json",
    )


def _collective_doses_not_fanned_impl(embed_p, claims_dir):
    """The half amounts_wallach_only is STRUCTURALLY BLIND TO.

    THE HOLE THIS CLOSES, proven on real data 2026-07-15 before it was written:
    Wallach states ONE amount for a CATEGORY -- "Essential fatty acids ... supplemented at
    the rate of 9 grams per day in capsule form" (DDDL 3e 2011, WAL-CLM-DDDL-000115). That
    claim maps BOTH omega-3 and omega-6, because his EFAs ARE those two. Fanned out
    per-slug, one 9 g claim posts 9 g to omega-3 AND 9 g to omega-6 -- 18 g of board target
    from a 9 g source. amounts_wallach_only certified exactly that as GREEN: "all 40 numeric
    coverage target(s) trace to a Wallach dose claim AND recompute exactly from its
    documented transform chain (R2 clean)". Both targets DO trace, and both DO recompute --
    R2 audits each essential in ISOLATION, so a shared budget split across two of them is
    invisible to it by construction. Every existing gate passed while the number was double
    what Wallach wrote.

    THE CHECK: for every sealed dose claim carrying `dose.collective_group`, NO essential in
    essentials-targets-data.json may carry a NUMERIC target sourced from it. The shared
    budget belongs in its own group artifact under its own recomputing goal gate (the
    pdm_goal_wallach_sourced shape); a number on a member essential is the fan-out.

    Anchored to the SEALED claims, not to the derive's opinion of them -- stale-to-stale
    equality is not truth: a
    targets_derive bug that starts fanning again cannot also silence this, because the truth
    is read from eden/corpus/claims/* independently.

    Deliberately NOT "any dose mapping >1 essential is collective": collectivity is a stated
    fact on the claim, not an inference from arity. A dose may map several essentials and
    still not be collective -- but then its amount belongs to a SUBSET, which the claim states
    via dose.applies_to (targets_derive._maintenance_doses honours it) rather than fanning.
    ★ This paragraph used to cite cobalt/vitamin-b12 as a legitimate fan ("ONE substance
    carries two names"). That was FALSE and it was the bug -- see _SAME_SUBSTANCE_SLUGS above.

    THE FAIL-OPEN, SINCE CLOSED. The check keyed ENTIRELY on `dose.collective_group`
    -- a HAND-AUTHORED annotation -- and returned "no collective dose claims sealed (vacuously
    clean)" when it found none. So the gate protected against fan-out only for claims someone
    had REMEMBERED to annotate: mine a new shared-budget dose, forget the field, and the gate
    says clean while the target doubles. The gate's own reason for existing (a 9 g EFA claim
    posting 18 g of board target) was an annotation nobody had needed to write yet.

    Now every dose claim mapping >1 essential must DECLARE its classification -- one of
    `dose.collective_group` (one budget shared across members) or `dose.applies_to` (the amount
    belongs to a proper SUBSET). Neither -> RED. Both are STATED FACTS on the claim, never
    inferred from arity, and applies_to is VALIDATED here (empty / not-a-subset / equals-every-
    essential are all RED) and ENFORCED below, so a malformed marker cannot buy silence.
    The corpus has exactly 3 such claims today: 1 collective (the 9 g EFA) + 2 applies_to-scoped
    (the cobalt/B12 pair, whose 250-400 mcg is B12's). So this costs nothing now and fails
    CLOSED on the next multi-essential dose mined -- forcing a deliberate call at mine time
    instead of a silent fan-out discovered weeks later.

    ★ A THIRD ROUTE ONCE EXISTED AND WAS A FABRICATION: `_SAME_SUBSTANCE_SLUGS` (still read
    below, permanently EMPTY) exempted cobalt/B12 on a PART-OF relation masquerading as
    IDENTITY -- see the block comment on that tuple. The 2 claims carry applies_to instead.
    Negative test: tools/tests/test_collective_doses_not_fanned.py."""
    import json as _json
    if not (embed_p.exists() and claims_dir.exists()):
        return True, "targets embed / corpus not installed (bootstrap-guard)"

    collective = {}
    for shard in sorted(claims_dir.glob("claims-*.json")):
        for c in _json.loads(shard.read_text(encoding="utf-8")).get("claims", []):
            if c.get("kind") != "dose":
                continue
            dz = c.get("dose") or {}
            if dz.get("collective_group"):
                collective[c["id"]] = {"group": dz["collective_group"],
                                       "amount": dz.get("amount"), "unit": dz.get("unit"),
                                       "members": list(c.get("essentials", []))}
    # FAIL CLOSED: a multi-essential dose claim that is neither annotated collective nor a
    # declared same-substance pair is UNCLASSIFIED -- it may be a silent fan-out. Checked
    # BEFORE the `not collective` early-return, which is exactly where the old hole was.
    unclassified = []
    scoped = {}   # claim_id -> (applies_to set, mapped-but-undosed set)
    for shard in sorted(claims_dir.glob("claims-*.json")):
        for c in _json.loads(shard.read_text(encoding="utf-8")).get("claims", []):
            if c.get("kind") != "dose":
                continue
            es = set(c.get("essentials") or [])
            if len(es) < 2:
                continue
            dz = c.get("dose") or {}
            if dz.get("collective_group"):
                continue
            ap = dz.get("applies_to")
            if ap is not None:
                # THE THIRD CLASSIFICATION (2026-07-15): the claim is ABOUT several essentials
                # but the AMOUNT is only some of theirs. Like collective_group this is a STATED
                # FACT on the claim, never inferred from arity — and it is validated here, not
                # trusted: a malformed applies_to must not become a way to silence the gate.
                aps = set(ap)
                if not aps:
                    unclassified.append(f"{c['id']}: dose.applies_to is EMPTY (states nothing)")
                elif not aps <= es:
                    unclassified.append(
                        f"{c['id']}: dose.applies_to {sorted(aps - es)} not among its essentials")
                elif aps == es:
                    unclassified.append(
                        f"{c['id']}: dose.applies_to lists EVERY mapped essential — that is a fan-out "
                        f"with extra steps; drop it, or declare collective_group if the amount is shared")
                else:
                    scoped[c["id"]] = (aps, es - aps)
                continue
            if any(es <= pair for pair in _SAME_SUBSTANCE_SLUGS):
                continue
            unclassified.append(f"{c['id']} maps {sorted(es)}")
    if unclassified:
        return False, (
            f"{len(unclassified)} dose claim(s) map >1 essential but declare NEITHER "
            f"dose.collective_group NOR a known same-substance pair — a shared Wallach "
            f"budget fanned per-slug doubles the board target and every other gate passes: "
            + "; ".join(unclassified[:4]))

    # applies_to ENFORCED, not merely accepted: an essential the claim maps but does NOT dose
    # may carry no numeric target sourced from it. Without this the marker would be a comment
    # — the derive could ignore it and the gate would still say clean. Anchored to the sealed
    # claims + the artifact, independently of targets_derive -- stale-to-stale
    # equality is not truth.
    if scoped:
        art = _json.loads(embed_p.read_text(encoding="utf-8")) if embed_p.exists() else {}
        leaked = []
        for e in art.get("essentials", []):
            t = e.get("target") or {}
            cid = t.get("source_claim_id")
            if cid not in scoped:
                continue
            aps, undosed = scoped[cid]
            if e.get("slug") in undosed and isinstance(t.get("low"), (int, float)):
                leaked.append(
                    f"{e.get('slug')}: numeric target {t['low']} {t.get('unit')} sourced from {cid}, "
                    f"whose dose.applies_to says the amount is {sorted(aps)}'s — the fan-out the "
                    f"marker exists to stop")
        if leaked:
            return False, "applies_to declared but NOT honoured: " + "; ".join(leaked[:3])

    if not collective:
        return True, ("no collective dose claims sealed; "
                      f"{len(scoped)} applies_to-scoped claim(s) honoured "
                      f"({len(_SAME_SUBSTANCE_SLUGS)} same-substance exemption(s) — that route "
                      "is a purged fabrication and must stay 0), and every multi-essential dose "
                      "claim is classified (fails closed on the next one)")

    data = _json.loads(embed_p.read_text(encoding="utf-8"))
    bad = []
    for e in data.get("essentials", []):
        t = e.get("target") or {}
        cid = t.get("source_claim_id")
        if cid not in collective:
            continue
        low = t.get("low")
        if isinstance(low, (int, float)):
            c = collective[cid]
            bad.append(f"{e.get('slug')}: numeric target {low} {t.get('unit')} sourced from COLLECTIVE "
                       f"claim {cid} ({c['amount']} {c['unit']} shared across {c['members']}) — "
                       f"one shared budget fanned into a per-essential number")
    if bad:
        return False, ("collective dose(s) fanned into per-essential targets (R2 / the 18 g bug): "
                       + "; ".join(bad))
    n = sum(len(v["members"]) for v in collective.values())
    return True, (f"{len(collective)} collective dose claim(s) covering {n} essential(s) carry NO "
                  f"per-essential number (the shared budget is not fanned out); "
                  f"{len(scoped)} applies_to-scoped claim(s) dose only the essential(s) they name")


def check_collective_doses_not_fanned():
    """Wrapper -- see _collective_doses_not_fanned_impl for the full contract.
    Thin path-binding shell so a negative test can drive the same logic on planted data."""
    return _collective_doses_not_fanned_impl(
        ROOT / "dashboard/assets/data/essentials-targets-data.json",
        ROOT / "eden/corpus/claims",
    )


def check_efa_goal_wallach_sourced():
    """§00.A — the essential-fatty-acid coverage GOAL (efa-coverage-data.json) is
    Wallach's own number in a different unit. Recomputed here INDEPENDENTLY of
    efa_coverage_derive so a derive bug cannot slip both (§00.B #2/#11):

      TRACE (the anchor) — goal.source_claim_id resolves to a sealed corpus dose claim whose
        dose carries collective_group == goal.collective_group and a scalar amount (a real
        Wallach dose, not a hand-set number), and whose essentials ARE goal.members.
      CHAIN (the recompute) — re-run the documented transform from source: amount x 1000
        (g -> mg, a unit change of the figure Wallach wrote), byte-compare to
        goal.maintenance_mg.

    ★ WHY NO CALORIE BASIS APPEARS ANYWHERE IN THAT CHAIN, and why this gate would RED if one
    did: Wallach states BOTH the rate ("3 percent of your total daily calorie consumption") AND
    the finished supplement figure ("or supplemented at the rate of 9 grams per day in capsule
    form") in one sentence. Because he did the conversion himself, nothing here supplies a
    reference. Re-deriving 3% against the FDA 2,000-kcal label standard yields 6.67 g — which
    CONTRADICTS his stated 9 g, so the assumption would not fill a gap, it would overrule him
    with an FDA convention. That is the same violation class as the Youngevity-label route.
    The rule this encodes: supply a reference ONLY when
    Wallach's own words cannot produce a number, NEVER to replace one he wrote.

    A fabricated goal, one sourced from a non-collective or non-dose claim, a members/claim
    mismatch, or an arithmetic drift all go RED."""
    import json as _json
    art = ROOT / "dashboard/assets/data/efa-coverage-data.json"
    claims_dir = ROOT / "eden/corpus/claims"
    if not (art.exists() and claims_dir.exists()):
        return True, "efa-coverage / corpus not installed (bootstrap-guard)"

    data = _json.loads(art.read_text(encoding="utf-8"))
    goal = data.get("goal", {})
    cid = goal.get("source_claim_id")
    if not cid:
        return False, "goal.source_claim_id missing (the goal must cite a Wallach dose claim)"

    claim = None
    for shard in sorted(claims_dir.glob("claims-*.json")):
        for c in _json.loads(shard.read_text(encoding="utf-8")).get("claims", []):
            if c.get("id") == cid:
                claim = c
                break
        if claim:
            break
    if claim is None:
        return False, f"goal.source_claim_id {cid} resolves to no sealed claim"
    if claim.get("kind") != "dose":
        return False, f"{cid} is kind={claim.get('kind')!r}, not a dose claim"

    dz = claim.get("dose") or {}
    grp = goal.get("collective_group")
    if dz.get("collective_group") != grp:
        return False, (f"{cid} dose.collective_group {dz.get('collective_group')!r} != goal "
                       f"collective_group {grp!r} — the goal must cite the claim that states it")
    members = list(goal.get("members") or [])
    if sorted(claim.get("essentials", [])) != sorted(members):
        return False, (f"{cid} maps essentials {sorted(claim.get('essentials', []))} but the goal "
                       f"claims members {sorted(members)} — the group must be exactly who the claim covers")

    amount, unit = dz.get("amount"), dz.get("unit")
    if not isinstance(amount, (int, float)) or isinstance(amount, bool):
        return False, f"{cid} dose.amount {amount!r} is not a scalar Wallach amount"
    if unit != "g":
        return False, f"{cid} dose.unit {unit!r} is not 'g' — the g->mg chain does not apply"

    expect = round(float(amount) * 1000.0, 4)
    posted = goal.get("maintenance_mg")
    if not isinstance(posted, (int, float)) or round(float(posted), 4) != expect:
        return False, (f"goal.maintenance_mg {posted!r} != {expect} recomputed from {cid} "
                       f"({amount} {unit} x 1000) — fabricated or drifted")

    prov = goal.get("provenance") or {}
    if prov.get("wallach_dose_amount") != amount or prov.get("wallach_dose_unit") != unit:
        return False, (f"goal.provenance ({prov.get('wallach_dose_amount')!r} "
                       f"{prov.get('wallach_dose_unit')!r}) is not anchored to {cid}'s dose "
                       f"({amount!r} {unit!r})")

    n = len(data.get("products") or {})
    return True, (f"EFA goal {posted} mg recomputes exactly from {cid} ({amount} {unit} x 1000, a unit "
                  f"change of Wallach's own figure — no calorie or weight reference supplied); "
                  f"members {members} == the claim's essentials; {n} EFA-bearing product(s) scored")


def check_pdm_goal_wallach_sourced():
    """§00.A — the trace/rare coverage GOAL (pdm-coverage-data.json) is a Wallach
    dose expressed in mg via product composition. Two layers (§00.B #2/#11), recomputed here
    INDEPENDENTLY of pdm_coverage_derive so a derive bug cannot slip both:

      TRACE (the anchor) — goal.source_claim_id resolves to a sealed corpus claim carrying a
        `dose` with an amount + per_body_weight (a real Wallach dose, not a hand-set number).
      CHAIN (the recompute) — re-run the documented transform from source: dose_amount x
        (reference-product vehicle mg / serving fl oz, read from the SEALED pillar) x (154 / per_bw),
        byte-compare to goal.maintenance_mg.

    A fabricated goal, one sourced from a non-dose claim, or an arithmetic drift all go RED. The
    reference product's mg is COMPOSITION (§00.A lets composition feed the math); only the
    per-body-weight DOSE is a Wallach amount, and it must trace to the sealed claim."""
    import json as _json
    import re as _re
    art = ROOT / "dashboard/assets/data/pdm-coverage-data.json"
    cfg = ROOT / "dashboard/assets/data/trace-mineral-vehicles.json"
    pillar = ROOT / "eden/products/products.json"
    claims_dir = ROOT / "eden/corpus/claims"
    if not (art.exists() and cfg.exists() and pillar.exists() and claims_dir.exists()):
        return True, "pdm-coverage / config / pillar / corpus not installed (bootstrap-guard)"

    data = _json.loads(art.read_text(encoding="utf-8"))
    config = _json.loads(cfg.read_text(encoding="utf-8"))
    goal = data.get("goal", {})
    gm = config.get("goal_model", {})
    cid = goal.get("source_claim_id")
    if not cid:
        return False, "goal.source_claim_id missing (the goal must cite a Wallach dose claim)"

    def _num(v):
        if isinstance(v, bool):
            return None
        if isinstance(v, (int, float)):
            return float(v)
        if isinstance(v, str):
            m = _re.match(r"\s*([\d.]+)", v)
            return float(m.group(1)) if m else None
        return None

    claim = None
    for shard in claims_dir.glob("claims-*.json"):
        for c in _json.loads(shard.read_text(encoding="utf-8")).get("claims", []):
            if c.get("id") == cid:
                claim = c
                break
        if claim is not None:
            break
    if claim is None:
        return False, f"goal.source_claim_id {cid} not found in the sealed corpus"
    dose = claim.get("dose") or {}
    dose_amt = _num(dose.get("amount"))
    per_bw = _num((dose.get("per_body_weight") or "").replace("lb", ""))
    if dose_amt is None or not per_bw:
        return False, f"{cid} carries no usable Wallach dose (amount/per_body_weight) — cannot anchor the goal"

    ref_id = gm.get("reference_composition_product_id")
    prods = _json.loads(pillar.read_text(encoding="utf-8")).get("products", {})
    ref = prods.get(ref_id)
    if ref is None:
        return False, f"reference product {ref_id!r} not in the pillar"
    serv = " ".join(str(c.get("serving_size") or "") for c in ref.get("components", []))
    mo = _re.search(r"([\d.]+)\s*fl\s*oz", serv, _re.IGNORECASE)
    if not mo:
        return False, f"{ref_id} serving_size {serv!r} states no fl oz — cannot anchor mg/oz"
    serv_oz = float(mo.group(1))
    patterns = [p.lower() for p in config.get("vehicle_name_patterns", [])]

    def _to_mg(a, u):
        u = (u or "mg").lower()
        return a / 1000.0 if u.startswith("mcg") else (a * 1000.0 if u == "g" else a)

    ref_mg = 0.0
    for comp in ref.get("components", []):
        for nut in comp.get("nutrients", []):
            a = _num(nut.get("amount"))
            if a is not None and any(p in (nut.get("name") or "").lower() for p in patterns):
                ref_mg += _to_mg(a, nut.get("unit"))
        for bl in comp.get("blends", []):
            tot = bl.get("total") or {}
            a = _num(tot.get("amount"))
            if a is not None and any(p in (bl.get("name") or "").lower() for p in patterns):
                ref_mg += _to_mg(a, tot.get("unit"))
    if ref_mg <= 0 or serv_oz <= 0:
        return False, f"reference {ref_id}: mg={ref_mg} serv_oz={serv_oz} — cannot form the goal"

    exp_maint = round(dose_amt * (ref_mg / serv_oz) * 154 / per_bw, 2)
    if goal.get("maintenance_mg") != exp_maint:
        return False, (f"goal.maintenance_mg {goal.get('maintenance_mg')} != recompute {exp_maint} "
                       f"(dose {dose_amt} x {ref_mg:.0f}/{serv_oz} mg/oz x 154/{per_bw:.0f})")
    return True, (f"trace/rare goal {exp_maint}mg maint traces to Wallach dose "
                  f"{cid} ({dose_amt:.0f} {dose.get('unit')}/{per_bw:.0f}lb) x {ref_mg:.0f}mg/oz composition x 154lb")


def check_nutrient_resolver_parity():
    """Single source of truth -- the runtime IDENTITY resolver == the Python source of truth.
    The Coverage matcher (core/nutrient-resolver.ts) resolves label names to canon slugs
    from the GENERATED nutrient-resolver-data.json. Two proofs over the REAL input universe
    (every distinct (name, form) in the sealed Products pillar):
      (a) FIXTURE FRESH -- the committed parity fixture equals a fresh run of
          nutrient_resolve.resolve() over the pillar, so it can never go stale vs the Python
          source of truth (the vitest checks the TS code against this same fixture).
      (b) ARTIFACT FAITHFUL -- a resolver driven ONLY by the emitted nutrient-resolver-data.json
          reproduces resolve()'s output on every input, so the map the app inlines encodes the
          resolver exactly.
    Together with the vitest (TS == fixture): the TS runtime resolver == Python resolve().
    Truth-anchored on a live re-derive from the sealed pillar each run."""
    import importlib.util as _ilu
    art_p = ROOT / "dashboard" / "assets" / "data" / "nutrient-resolver-data.json"
    fix_p = (ROOT / "dashboard" / "assets" / "js" / "src" / "core" / "__fixtures__"
             / "nutrient-resolver-fixture.json")
    resolver_p = ROOT / "eden" / "tools" / "nutrient_resolve.py"
    embed_p = ROOT / "eden" / "tools" / "nutrient_resolver_embed.py"
    for p in (art_p, fix_p, resolver_p, embed_p):
        if not p.exists():
            return True, f"{p.name} not installed (bootstrap-guard)"
    sys.path.insert(0, str(ROOT / "eden" / "tools"))
    sys.path.insert(0, str(ROOT / "tools"))

    def _load(p):
        spec = _ilu.spec_from_file_location(p.stem, p)
        mod = _ilu.module_from_spec(spec)
        spec.loader.exec_module(mod)
        return mod

    try:
        emb = _load(embed_p)  # imports nutrient_resolve internally
    except Exception as e:
        return False, f"resolver embed import failed: {e}"

    # (a) fixture freshness vs live resolve()
    try:
        expected = emb.build_fixture()
        on_disk = json.loads(fix_p.read_text(encoding="utf-8"))
    except Exception as e:
        return False, f"fixture load/build failed: {e}"
    if on_disk != expected:
        return False, ("nutrient-resolver-fixture.json is STALE vs live nutrient_resolve.resolve() "
                       "-- run `python eden/tools/build_embeds.py`")

    # (b) artifact faithfulness -- an artifact-driven resolver must match resolve() on every input
    try:
        art = json.loads(art_p.read_text(encoding="utf-8"))
        fa = [(slug, re.compile(pat)) for slug, pat in art["fatty_acid_patterns"]]
        od = re.compile(art["omega_digit_pattern"])
        stereo = tuple(art["stereo_prefixes"])
        vit, min_al = art["vitamin_aliases"], art["mineral_aliases"]
        min_nm, amino = art["mineral_names"], art["amino_names"]
    except Exception as e:
        return False, f"resolver artifact invalid: {e}"

    def _clean(name):
        n = name or ""
        for ch in "™®©":
            n = n.replace(ch, "")
        return re.sub(r"\s+", " ", n).strip()

    def art_resolve(name, form):
        # Faithful mirror of nutrient_resolve.resolve(), driven ONLY by the artifact tables.
        if not name:
            return None
        n = re.sub(r"\s+", " ", re.sub(r"\s*\([^)]*\)\s*", " ", _clean(name).lower())).strip()
        s = f"{name} {form or ''}".lower()
        om = od.search(s)
        if om:
            return f"omega-{om.group(1)}"
        for slug, rx in fa:
            if rx.search(s):
                return slug
        if n in vit:
            return vit[n]
        if n in min_nm:
            return min_nm[n]
        if n in min_al:
            return min_al[n]
        a = n
        for p in stereo:
            if a.startswith(p):
                a = a[len(p):]
                break
        a = a.split(" ")[0].strip()
        if a in amino:
            return amino[a]
        return None

    mism = []
    for row in expected:
        got = art_resolve(row["name"], row["form"])
        if got != row["slug"]:
            mism.append(f"{row['name']!r}(form={row['form']!r}): artifact={got} vs resolve={row['slug']}")
    if mism:
        return False, ("resolver ARTIFACT disagrees with nutrient_resolve.resolve() on "
                       f"{len(mism)} input(s): " + "; ".join(mism[:6]))
    return True, (f"runtime resolver == Python resolve() over {len(expected)} distinct pillar "
                  "substance names (fixture fresh + artifact faithful)")


def _search_index_nonnumeric_pages(shipped):
    """Claim ids in a shipped search-index whose `page` is neither int nor null. The RUNTIME
    SearchClaimSchema requires page: number|null; a string page (a Roman-numeral front-matter
    page such as 'xix') passes every structural check but fails the runtime safeParse, which
    empties the WHOLE index (state/search.ts EMPTY_INDEX fallback) -> Explore/Foods/topics go
    silently blank. The derive coerces non-int pages to null; this proves the shipped artifact
    did. It has happened: WAL-CLM-RARE-000024 (p.xix) shipped a string page and blanked every
    search surface.
    Driven by tools/tests/test_search_index_wellformed.py."""
    return [c.get("id") for c in shipped.get("claims", [])
            if not (c.get("page") is None or type(c.get("page")) is int)]


def check_search_index_wellformed():
    """Search-corpus doctrine -- every ENRICHED search claim is STRUCTURED, not a
    blob: the authored fields (subject/facet/question/answer_short) are present, facet is in the
    closed taxonomy, subject resolves to the entity registry OR essentials-canon, every also_about
    resolves to a registry/canon/condition slug, the DERIVED answer + sealed verbatim are
    non-empty, and the authored question starts capitalized (never a lowercase opener; 25 shipped
    machine-lowercased at one point, hand-fixed to 0 and gated so it cannot regress).
    Delegates to eden/tools/search_index_derive.validate() -- the SAME check build_index()
    refuses to derive on -- so a bad facet / unresolved subject / empty answer can never reach the
    shipped search-index.json (R7: the gate ships with the derive; negative-tested by
    tools/tests/test_search_index_wellformed.py). Also cross-checks that the TS schema's SEARCH_FACETS
    taxonomy has not drifted from the Python one (two surfaces, one truth). Validates
    ONLY the enriched claims that exist (entity-by-entity build), so the board stays green as
    entities are added; full-corpus search completeness is a later gate. Truth-anchored on the sealed
    claim shards x the hand-authored enrichment/registry, recomputed each run."""
    tool = ROOT / "eden" / "tools" / "search_index_derive.py"
    enr_p = ROOT / "eden" / "corpus" / "search-enrichment.json"
    if not tool.exists() or not enr_p.exists():
        return True, "search subsystem not installed (bootstrap-guard)"
    sys.path.insert(0, str(ROOT / "eden" / "tools"))
    import search_index_derive
    errs = list(search_index_derive.validate())
    ts_p = ROOT / "dashboard" / "assets" / "js" / "src" / "core" / "schemas" / "search.ts"
    if ts_p.exists():
        m = re.search(r"SEARCH_FACETS\s*=\s*\[(.*?)\]\s*as const", ts_p.read_text(encoding="utf-8"), re.S)
        if m:
            ts_facets = set(re.findall(r"'([a-z_]+)'", m.group(1)))
            py_facets = set(search_index_derive.SEARCH_FACETS)
            if ts_facets != py_facets:
                errs.append(f"facet taxonomy DRIFT TS vs Python: {sorted(ts_facets ^ py_facets)}")
        mt = re.search(r"type:\s*z\.enum\(\[(.*?)\]\)", ts_p.read_text(encoding="utf-8"), re.S)
        if mt:
            ts_types = set(re.findall(r"'([a-z_]+)'", mt.group(1)))
            py_types = set(search_index_derive.ENTITY_TYPES)
            if ts_types != py_types:
                errs.append(f"entity type enum DRIFT TS vs Python: {sorted(ts_types ^ py_types)}")
    if errs:
        return False, ("search index NOT well-formed (" + str(len(errs)) + "): "
                       + "; ".join(errs[:6]) + (" ..." if len(errs) > 6 else ""))
    # Runtime-parity guard (2026-07-21): the shipped index page must be int|null (runtime
    # SearchClaimSchema); a string page empties the whole index at load. See helper above.
    idx_p = ROOT / "dashboard" / "assets" / "data" / "search" / "search-index.json"
    if idx_p.exists():
        try:
            shipped = json.loads(idx_p.read_text(encoding="utf-8"))
        except Exception as e:
            return False, f"shipped search-index.json does not parse: {e}"
        bad_page = _search_index_nonnumeric_pages(shipped)
        if bad_page:
            return False, (f"{len(bad_page)} shipped search claim(s) have a non-numeric page — the "
                           f"runtime SearchClaimSchema requires number|null and empties the whole "
                           f"index otherwise: {bad_page[:5]}")
    enr = json.loads(enr_p.read_text(encoding="utf-8"))["enrichment"]
    return True, (f"all {len(enr)} enriched search claim(s) well-formed (facet in taxonomy, subject "
                  f"resolves, answer+verbatim present, question capitalized; page int|null) + TS/Python facet taxonomy in sync")


def check_verbatim_names_mapped_conditions():
    """A Wallach quote shown under a condition
    MUST name that condition (or a registered synonym) in the SHOWN verbatim text --
    else the link is unverifiable (indistinguishable from a hallucination). This
    guards against NEW/regressed violations while the known backlog is remediated:
    eden/tools/verbatim-audit-baseline.json allowlists the currently-known violations (read
    its `_count` for the live size), so ONLY new mappings whose verbatim does not name their
    condition fail.
    The allowlist shrinks to {} as verbatims are extended / mappings dropped and the
    baseline is regenerated. Truth-anchored on the sealed shard verbatims x the derived
    conditions index (exactly what surfaces under a condition; search-only excluded),
    matched name-or-synonym via the Catalog pillar (eden/catalog/conditions.json). The matcher +
    baseline logic live in eden/tools/verbatim_audit.py."""
    if not (ROOT / "eden" / "corpus" / "indices" / "conditions.json").exists():
        return True, "eden/corpus not installed (bootstrap-guard)"
    sys.path.insert(0, str(ROOT / "eden" / "tools"))
    import verbatim_audit
    if not _books_present():
        return True, "book source .txt not distributed in the public repo (copyright); re-runs when eden/corpus/books/*.txt is placed locally"
    new = verbatim_audit.new_violations()
    tolerated = len(verbatim_audit.load_baseline())
    if new:
        sample = sorted(f"{cid}->{s}" for cid, s in new)[:5]
        return False, (f"{len(new)} NEW verbatim-names-condition violation(s) — a claim maps a "
                       f"condition its verbatim does not name: {sample}{' ...' if len(new) > 5 else ''} "
                       f"(extend the verbatim to name the condition, or drop the mapping, then "
                       f"`python eden/tools/verbatim_audit.py baseline`)")
    return True, (f"0 new verbatim-names-condition violations ({tolerated} known baselined, "
                  f"shrinking as remediation runs)")


def check_graphics_integrity():
    """The sacred hand-made graphics (eden/graphics) must match their
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
    """Length rule: completeness of truth/education OUTRANKS the
    500-char verbatim limit. 500 is a SOFT threshold, not a truth-limiter — a verbatim
    MAY exceed it when the full faithful excerpt needs the room, up to a 1200 HARD
    ceiling (a load-time/file-size guard, enforced as critical by corpus_verify #2).
    This check is the INFORM surface: it lists every 501-1200 verbatim each board run so
    the (allowed) over-soft cases stay visible for a human spot-check, never hidden.
    Informational — never fails here (the hard ceiling is corpus_verify's job)."""
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
                  f"listed for review): {sample}{' ...' if len(over) > 6 else ''}")


def check_umbrella_proxy_named():
    """Umbrella named-by-proxy: a broad 'library' condition (e.g.
    cancer) is accepted as named when a claim's verbatim names a registered CHILD
    subtype (e.g. leukemia) via the Catalog pillar (eden/catalog/conditions.json, umbrella_of) — child->parent
    only. The exact-condition-named rule stays the DEFAULT; this info check LISTS every
    proxy-satisfied mapping each board run so a human eye stays on each umbrella
    exception. Never fails."""
    if not (ROOT / "eden" / "corpus" / "indices" / "conditions.json").exists():
        return True, "eden/corpus not installed (bootstrap-guard)"
    if not _books_present():
        return True, "book source .txt not distributed in the public repo (copyright); re-runs when eden/corpus/books/*.txt is placed locally"
    sys.path.insert(0, str(ROOT / "eden" / "tools"))
    import verbatim_audit
    m = verbatim_audit.proxy_named_mappings()
    if not m:
        return True, "no umbrella proxy-named mappings"
    sample = ", ".join(f"{cid}:{umb}<={child}" for cid, umb, child in m[:6])
    return True, (f"{len(m)} umbrella mapping(s) named-by-proxy via a child subtype "
                  f"(reviewed exceptions): {sample}{' ...' if len(m) > 6 else ''}")


def check_claim_text_term_gloss():
    """Term-gloss standard: front-facing claim_text must never carry a
    garbled/obsolete botanical form (defects) or an obscure common name that has a simpler
    approved alternative (common_swaps); defects must ALSO be absent from the sacred verbatim
    (they are blatant book errors, corrected everywhere once ratified). The reviewed
    decisions are the single source of truth in eden/tools/term-gloss-lexicon.json; this check
    enforces they never regress -- the machine guard against re-touching the same entry."""
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


# --- the OTHER direction: a ratified gloss REMOVED --------------------------------
# check_claim_text_term_gloss guards one way only -- the superseded FROM-string must not
# REAPPEAR. It is blind to the ratified TO-side gloss being DELETED, and the literal
# # FROM-key match misses any near-variant. Two audit fixes once proposed stripping ratified
# glosses ("land plants (notably Carya species)" dropping hickory; "Canadian fleabane
# (Erigeron canadensis)" dropping horseweed) and NEITHER tripped the existing gate -- both
# would have landed on a fully green board. Each audit flagged the gloss as "an outside-world
# word Wallach never used", which is true and is precisely WHY it was ratified: the book
# prints bare Latin, and a lay reader cannot use it.
# Extracted as helpers so tools/tests/test_term_gloss_ratified_present.py can drive them directly.
def _term_gloss_tokens(s):
    return set(re.findall(r"[A-Za-z][A-Za-z'-]{3,}", s or ""))


def _term_gloss_ratified_rules(swaps):
    """(anchors, required, banned) per swap that anchors a ratified common name to a Latin genus.

    anchors  -- genus tokens surviving BOTH sides of the swap (Carya, Erigeron)
    required -- the ratified common name the swap ADDS (hickory, horseweed)
    banned   -- the superseded common name, only where the swap renames it in front of a
                binomial; the no-parenthesis entries are already covered by the FROM-key check.
    """
    rules = []
    for frm, to in swaps.items():
        ft, tt = _term_gloss_tokens(frm), _term_gloss_tokens(to)
        anchors = sorted(w for w in (ft & tt) if w[:1].isupper() and len(w) >= 4)
        dropped = {w for w in (ft - tt) if w.islower()}
        # a near-variant of a superseded token (canadensis vs canadense) is a binomial
        # spelling correction, NOT the ratified common name -- do not require it
        required = sorted(w for w in (tt - ft) if w.islower()
                          and not any(w[:7] == d[:7] for d in dropped))
        if not anchors or not required:
            continue
        banned = None
        if "(" in frm and "(" in to:
            fp, tp = frm.split("(")[0].strip(), to.split("(")[0].strip()
            if fp.lower() != tp.lower():
                banned = fp
        rules.append((anchors, required, banned))
    return rules


def _term_gloss_scan_ratified(rules, claims):
    """claims = iterable of (claim_id, claim_text). Returns deduped violation strings."""
    seen, out = set(), []
    for cid, ct in claims:
        low = (ct or "").lower()
        for anchors, required, banned in rules:
            if any(a in (ct or "") for a in anchors) and not any(r in low for r in required):
                v = f"{cid} gloss-removed:{required[0]!r} (anchor {anchors[0]!r})"
                if v not in seen:
                    seen.add(v)
                    out.append(v)
            if banned and banned.lower() in low:
                v = f"{cid} superseded-name:{banned!r}"
                if v not in seen:
                    seen.add(v)
                    out.append(v)
    return out


def check_term_gloss_ratified_present():
    """A ratified term gloss may not be silently REMOVED from claim_text.

    Complement to check_claim_text_term_gloss (which only blocks the superseded form from
    reappearing). Where a common_swaps entry attaches a ratified common name to a Latin genus,
    any claim_text naming that genus must still carry the common name, and the superseded
    common name must not return under a corrected binomial. This is the tightening that
    ships in the same patch as the misfire it fixes."""
    lex_path = ROOT / "eden" / "tools" / "term-gloss-lexicon.json"
    claims_dir = ROOT / "eden" / "corpus" / "claims"
    shards = sorted(claims_dir.glob("claims-*.json"))
    if not shards or not lex_path.exists():
        return True, "eden/corpus or term-gloss lexicon not installed (bootstrap-guard)"
    lex = json.loads(lex_path.read_text(encoding="utf-8"))
    rules = _term_gloss_ratified_rules(lex.get("common_swaps", {}))
    if not rules:
        return True, "no genus-anchored ratified gloss in the lexicon (vacuously clean)"
    claims = [(c["id"], c.get("claim_text") or "")
              for sh in shards
              for c in json.loads(sh.read_text(encoding="utf-8")).get("claims", [])]
    violations = _term_gloss_scan_ratified(rules, claims)
    if violations:
        sample = "; ".join(violations[:8])
        return False, (f"{len(violations)} ratified gloss removal(s) -- an approved common name "
                       f"was stripped from claim_text: {sample}{' ...' if len(violations) > 8 else ''}")
    return True, (f"ratified glosses intact -- {len(rules)} genus-anchored rule(s) "
                  f"({', '.join(r[1][0] for r in rules)}) upheld across {len(claims)} claims")


# A HEALTH number (dose, %, IU count) has no legitimate home in a glossary definition UNLESS it is
# ANCHORED: the gate exists to catch smuggling — an unverifiable Wallach number in the one content
# layer the §00.A source gates do not cover. Historical dates (1997, 1980s, "June 15, 1997") ARE
# legitimate in product-history entries and are NOT health claims; year-shaped tokens are stripped
# BEFORE the digit check so real health numbers still trip but dates pass (extended to cover
# the Mineral-Toddy / SupraLife / Rockland lineage entries).
#
# REFINEMENT, under reviewed override: a number IS permitted when the entry
# declares a `number_exempt` block that ANCHORS it — a reason + claim_ids that (a) resolve to sealed
# claims and (b) actually CONTAIN every digit-run in the definition. This turns "no numbers ever"
# into "no UNANCHORED numbers": the smuggling hole stays closed (you cannot cite an unrelated claim;
# the number must literally appear as a digit-run in the cited claim), while a hand-verified figure
# like the plant-derived 98%-vs-8-12% bioavailability (WAL-CLM-RARE-000061) may render in the tooltip.
# The number-is-SEMANTICALLY-faithful half rests on the human review recorded in `reason` (a
# labeled WISH): the gate proves the citation resolves AND the digits match, not that the sentence is true
# to the source. Proved by tools/tests/test_glossary_wellformed.py.
_GLOSSARY_DATE_TOKEN = re.compile(
    r"\b(?:19|20)\d{2}s?\b"                         # 1997, 1990s
    r"|\b\d{1,2}(?=[,\s]+(?:19|20)\d{2})\b"         # 15 in "June 15, 1997" (comma OR space)
    r"|\b\d{2}s\b"                                  # 80s, 90s
)


# R9 REFINEMENT 2026-07-24: a vitamin's DESIGNATION (B12, B-12, D3, K2, B6) is part of its NAME,
# not a health number - exactly like a year. The gate over-fired on the plain-language definition of
# "intrinsic factor", which cannot be written for a lay reader without naming vitamin B12 (the only
# alternative, "cobalamin", is the jargon the gloss exists to remove). Stripped BEFORE the digit
# check, same shape as the date exclusion. Deliberately NARROW: one A-K letter, an optional hyphen,
# and 1-2 digits with NO intervening space, so a real dose standing beside a vitamin name still
# trips - "B6 100 mg" strips the B6 and the 100 fires. Word-bounded, so the book's OCR token "HC1"
# is untouched. Proved by tools/tests/test_glossary_wellformed.py.
_GLOSSARY_VITAMIN_TOKEN = re.compile(r"\b[A-K]-?\d{1,2}\b")


def _glossary_definition_has_smuggled_number(plain):
    """True iff `plain` still contains a digit after every year-shaped token AND every vitamin
    designation is stripped. Extracted so the negative test in
    tools/tests/test_glossary_wellformed.py can drive it directly."""
    stripped = _GLOSSARY_VITAMIN_TOKEN.sub("", _GLOSSARY_DATE_TOKEN.sub("", plain))
    return bool(re.search(r"\d", stripped))


def _corpus_claim_digit_runs():
    """{claim_id: set of digit-run strings} over every SEALED claim's claim_text + verbatim.
    The truth anchor for a glossary number_exempt: a cited number must literally appear here."""
    runs = {}
    claims_dir = ROOT / "eden" / "corpus" / "claims"
    if not claims_dir.exists():
        return runs
    for shard in sorted(claims_dir.glob("claims-*.json")):
        try:
            data = json.loads(shard.read_text(encoding="utf-8"))
        except Exception:
            continue
        for c in data.get("claims", []):
            txt = f"{c.get('claim_text','')} {c.get('verbatim','')}"
            runs[c.get("id")] = set(re.findall(r"\d+", txt))
    return runs


def _glossary_number_exemption_valid(entry, runs_by_id):
    """A glossary definition carrying a number is legal ONLY with an anchored `number_exempt`.
    Returns (ok, why). Non-gameable: every digit-run in the definition must appear as a digit-run
    in a cited, resolving sealed claim. Driven directly by tools/tests/test_glossary_wellformed.py."""
    ex = entry.get("number_exempt")
    if not isinstance(ex, dict):
        return False, "has a health number but no number_exempt block"
    if not (ex.get("reason") or "").strip():
        return False, "number_exempt missing a reason"
    claim_ids = ex.get("claim_ids") or []
    if not claim_ids:
        return False, "number_exempt cites no claim_ids"
    unresolved = [c for c in claim_ids if c not in runs_by_id]
    if unresolved:
        return False, f"number_exempt cites unresolved claim(s): {unresolved}"
    cited = set()
    for c in claim_ids:
        cited |= runs_by_id[c]
    tip = set(re.findall(r"\d+", _GLOSSARY_DATE_TOKEN.sub("", entry.get("plain", ""))))
    missing = sorted(tip - cited, key=lambda s: (len(s), s))
    if missing:
        return False, f"number(s) {missing} not present in cited claim(s) — unanchored"
    return True, f"anchored to {','.join(claim_ids)}"


def _glossary_key_collisions(terms):
    """Every normalized (lowercased) key across term + aliases must be GLOBALLY UNIQUE.
    The runtime matcher (dashboard/assets/js/src/state/glossary.ts) folds term + every alias
    into ONE lowercased Map, so a repeated key is a SILENT last-write-wins override -- the
    later entry's definition wins and the earlier one is dead, with no error. Returns a list of
    human problem strings (empty == clean); driven directly by tools/tests/test_glossary_wellformed.py.
    2026-07-21 (task_4ba8c8bd): 'myelosclerosis' had a dedicated entry AND was an alias of
    'myelofibrosis' so the dedicated definition was dead; three others (meq/l, Supralife, glacial
    milk) were aliases equal to their own term's lowercase -- dead weight the Map collapses. The
    pre-existing term-vs-term check missed all four because it never looked at aliases."""
    owner = {}   # normalized key -> "role 'k' of 'term'"
    problems = []
    for t in terms:
        name = (t.get("term") or "").strip()
        pairs = []
        if name:
            pairs.append(("term", name))
        for a in (t.get("aliases") or []):
            a2 = (a or "").strip()
            if a2:
                pairs.append(("alias", a2))
        for role, k in pairs:
            kl = k.lower()
            if kl in owner:
                problems.append(f"key {k!r} ({role} of {name!r}) collides with {owner[kl]}")
            else:
                owner[kl] = f"{role} {k!r} of {name!r}"
    return problems


def check_glossary_wellformed():
    """Glossary integrity: dashboard/assets/data/glossary.json parses,
    every entry has a non-empty term + plain definition + category, every term+alias key is globally unique (the matcher folds them into one lowercased Map, so a collision silently overrides), and no
    definition asserts an UNANCHORED health number/dose (the glossary is the one content layer
    outside the §00.A source gates, so a bare number here would be an unverifiable Wallach claim).
    Historical dates pass; a health number trips UNLESS the entry declares an anchored
    `number_exempt` (a reviewed override — the number must resolve to a cited sealed claim that
    literally contains it)."""
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
    runs_by_id = _corpus_claim_digit_runs()
    # The runtime matcher (state/glossary.ts) folds term + every alias into ONE lowercased
    # Map, so any repeated normalized key is a SILENT last-write-wins override. Guard the FULL
    # key-space, not just term-vs-term (task_4ba8c8bd, 2026-07-21: an alias collision made a
    # dedicated 'myelosclerosis' definition dead, and the old term-only check never saw it).
    problems = list(_glossary_key_collisions(terms))
    exempted = 0
    for t in terms:
        name = (t.get("term") or "").strip()
        if not name:
            problems.append("entry with empty term")
            continue
        if not (t.get("plain") or "").strip():
            problems.append(f"{name}: empty definition")
        if not (t.get("category") or "").strip():
            problems.append(f"{name}: missing category")
        if _glossary_definition_has_smuggled_number(t.get("plain", "")):
            ok, why = _glossary_number_exemption_valid(t, runs_by_id)
            if ok:
                exempted += 1
            else:
                problems.append(f"{name}: definition has a health number ({why}); a glossary number needs an anchored number_exempt")
    if problems:
        return False, f"{len(problems)} glossary problem(s): {'; '.join(problems[:6])}"
    tail = f"; {exempted} anchored number-exempt entr(ies)" if exempted else ", no smuggled health numbers"
    return True, f"glossary.json well-formed -- {len(terms)} plain-language definitions{tail}"


# --- the OTHER failure direction: a key that fires where it must NOT -------------------------
# glossary_wellformed proves an entry is well-SHAPED and that its keys do not collide. It is
# blind to a key that is a perfectly-formed COMMON ENGLISH WORD, which decorates hundreds of
# unrelated sentences with an irrelevant tooltip. Measured 2026-08-02 across 9,211 front-facing
# # blocks (claim_text + verbatim + search answers + the mechanism/entity prose stores): the entry
# "reduce in chemistry" ("to give electrons back to a molecule") could never match its own term,
# and fired ONLY through its aliases -- "reduced" 105x and "reduction" 24x, every single one the
# ordinary-English sense ("reduced immune status", "a reduction in inflammation markers"). 129
# wrong tooltips, 0 right ones, on a fully green board, for weeks. It was found by reading the
# rendered page; no gate could have.
#
# The lock is a reviewed DENYLIST in eden/tools/term-gloss-lexicon.json (the single source of
# truth for term-gloss decisions), each key carrying the measurement that condemned it. Matching
# is on the EXACT normalized key, using the same normalization the runtime applies, so the ban is
# surgical: "oxidation-reduction" and a hypothetical "reduced glutathione" are untouched by
# construction -- only the bare common word is closed. The morphological family ("reduce",
# "reducing") is denylisted alongside the two that actually shipped, because the R9 lesson from
# term_gloss_ratified_present is that a literal key match misses near-variants.
#
# WHAT THIS DOES NOT DO (R7, labeled): it does not DISCOVER the next over-firing common word --
# there is no non-gaming machine test for "is this key a common English word", and a frequency
# floor would redden the many high-firing keys that are deliberate ('essential' 627x, 'chronic'
# 137x). It closes the door behind a key a human has judged and removed. Finding the next one
# stays a review job. Extracted as helpers so tools/tests/test_glossary_keys_denylisted.py drives them.
def _glossary_norm_key(s):
    """The runtime's key normalization, mirrored (dashboard/assets/js/src/state/glossary.ts::normKey):
    lower-cased, curly apostrophes folded to straight, every whitespace-or-hyphen run collapsed to ONE
    space. Anchoring to the RUNTIME form is the point -- a denylisted word re-added as "Reduced" or
    "re-duced" would normalize to the same key and fire identically, so it must fail identically."""
    return re.sub(r"[\s\-]+", " ", (s or "").lower().replace("\u2018", "'").replace("\u2019", "'")).strip()


def _glossary_denylist_violations(terms, denylist):
    """Returns (violations, checked_key_count). A violation = a glossary term or alias whose
    normalized key EQUALS a denylisted key. Equality, never containment: a multi-word key that
    merely contains the word is legitimate and must stay silent."""
    banned = {_glossary_norm_key(k): v for k, v in denylist.items()}
    violations, checked = [], 0
    for t in terms:
        name = (t.get("term") or "").strip()
        pairs = ([("term", name)] if name else []) + [("alias", (a or "").strip())
                                                      for a in (t.get("aliases") or []) if (a or "").strip()]
        for role, k in pairs:
            checked += 1
            nk = _glossary_norm_key(k)
            if nk in banned:
                why = banned[nk].split(":")[0] if banned[nk] else "denylisted"
                violations.append(f"{role} {k!r} of entry {name!r} re-registers denylisted key {nk!r} ({why})")
    return violations, checked


def check_glossary_keys_denylisted():
    """A glossary key removed for over-firing may not be re-registered as a term or an alias.

    Complement to check_glossary_wellformed (shape + collisions only, blind to a well-formed key
    that decorates the wrong words). The reviewed denylist lives in eden/tools/term-gloss-lexicon.json
    under `glossary_key_denylist`, each key carrying the measurement that condemned it.
    Negative test: tools/tests/test_glossary_keys_denylisted.py."""
    gp = ROOT / "dashboard" / "assets" / "data" / "glossary.json"
    lex_path = ROOT / "eden" / "tools" / "term-gloss-lexicon.json"
    if not gp.exists() or not lex_path.exists():
        return True, "glossary.json or term-gloss lexicon not installed (bootstrap-guard)"
    try:
        terms = json.loads(gp.read_text(encoding="utf-8")).get("terms", [])
    except Exception as e:
        return False, f"glossary.json does not parse: {e}"
    denylist = json.loads(lex_path.read_text(encoding="utf-8")).get("glossary_key_denylist", {})
    if not denylist:
        return True, "no glossary key denylisted (vacuously clean)"
    unreasoned = sorted(k for k, v in denylist.items() if not (v or "").strip())
    if unreasoned:
        return False, (f"{len(unreasoned)} denylist entr(ies) carry no reason: {unreasoned[:6]} -- "
                       "a removal without its measurement is not reviewable (R9)")
    violations, checked = _glossary_denylist_violations(terms, denylist)
    if violations:
        return False, (f"{len(violations)} denylisted glossary key(s) back in play: "
                       f"{'; '.join(violations[:4])}{' ...' if len(violations) > 4 else ''}")
    return True, (f"no denylisted glossary key re-registered -- {len(denylist)} banned key(s) "
                  f"({', '.join(sorted(denylist)[:4])}) absent from {checked} term/alias keys")


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
    "arthritis",  # matches the -itis pattern but is everyday English; too basic to gloss
}


# ── FRONT-FACING OCR: the two permanent guards ────────────────────────────────────────────
# WHY THEY EXIST: claims were ENRICHED (made front-facing) from books whose source .txt was never
# verified, and the rule "we fix source quotes as we enrich" was a promise with NO gate. Raw OCR
# was found live in user-facing quotes (WAL-CLM-RARE-000336: "tisk"/"rea"/"ancer";
# WAL-CLM-LETS-000502: "1 20" for 120). §00.B: a rule with no gate is a WISH. These two turn the
# two halves into gates.
# A word wrap never crosses a BLANK line: "anti-\n\nNext paragraph" is a paragraph break, not a
# split word. The first cut used \s* and over-fired on exactly that -- caught by this gate's own
# negative-test sparing case -- tighten, never loosen. Horizontal whitespace only.
#
# TIGHTENED again, in the same direction. The pattern allowed horizontal space AFTER
# the newline but required the hyphen to ABUT it. Hell's Kitchen wraps with a space BEFORE the
# newline, and it is the ONLY book that does (measured: hk.txt 1650 loose / 0 tight; every other
# book the exact reverse). So this gate read 0 for that book and the book was written off as
# clean. It was clean only to a BLIND DETECTOR: 76 front-facing splits sat
# inside it unseen (me-/dium, carcino-/gens, ribofla-/vin). Allowing the horizontal-space class on
# BOTH sides keeps the blank-line exclusion intact -- a second newline still breaks the match, so
# the original over-fire cannot return -- and catches exactly those 76, adding no new hit in any
# of the other six books.
_FF_MID_WORD_HYPHEN = re.compile(r"[A-Za-z]{2,}-[ \t]*\n[ \t]*[A-Za-z]{2,}")
_FF_MOJIBAKE = re.compile(r"[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F]")

# Five further classes, promoted 2026-08-02 after every residual hit was read off its page image.
# Each carries the exclusion that made it reach ZERO on legitimate content -- the exclusions ARE
# the gate; without them each detector fires on ordinary typography and gets switched off.
#   space_before_punct : a table LEADER-DOT run ('PANTOTHENIC ACID ...4 mg') is not a defect,
#                        so a punctuation mark followed by another dot is excluded.
#   number_split       : a vitamin designation ('B-2 50 mg') is a name plus a dose, not a split
#                        number, so 'B-<n>' is stripped first.
#   digit_in_word      : ordinals (20th), decades (1990s), vitamin designations (B12) and UNIT or
#                        formula adjacency (1nm, 2-5ug/kg, 1cm, 146mcg/day, As2O3, q6 h) are all
#                        legitimate; only a digit welded to ordinary prose survives.
#   run_together       : camelCase is normal in brands and surnames (NutraSweet, MacCoy,
#                        SuperOxy) -- those are named exceptions rather than a looser regex,
#                        because loosening it would blind the class to real damage like 'anWor'.
#   double_space       : column alignment inside a transcribed table is deliberate; both current
#                        cases are named exceptions.
_FF_SPACE_B4_PUNCT = re.compile(r"[A-Za-z]\s+[,;:](?!\.)|[A-Za-z]\s+\.(?!\.)")
_FF_RUN_TOGETHER = re.compile(r"[a-z]{2}[A-Z][a-z]{2}")
_FF_DOUBLE_SPACE = re.compile(r"\S  +\S")
_FF_VITAMIN_DESIG = re.compile(r"\bB-\d\b")
_FF_NUMBER_SPLIT = re.compile(r"\b\d+ \d{2}\b")
# stripped BEFORE the digit-in-word scan: ordinals, decades, vitamin designations, and any digit
# sitting against a unit or a chemical formula.
_FF_DIGIT_OK = re.compile(
    r"\b\d+(st|nd|rd|th)\b"
    r"|\b\d{2,4}s\b"
    r"|\b[A-K]-?\d{1,2}\b"
    r"|\d\s*(nm|mm|cm|km|ug|mcg|mg|gm|gms|g|kg|ml|cc|IU|ppm|oz|lb|%)\b"
    r"|\b[A-Z][a-z]?\d+[A-Z][a-z]?\d*\b"
    r"|\bq\s?\d+\b", re.I)
_FF_DIGIT_IN_WORD = re.compile(r"[a-z]\d|\d[a-z]")

# CLASS 8, added 2026-08-02 after the subscript sweep. A typeset subscript digit that OCR flattened
# into a comma or a lookalike letter: 'Vitamin B,,' for B12, 'Vitamin B,' for B3/B6, '(B,)' for
# (B6), 'LDso' for LD50, 'Vitamin 81' for Vitamin B1. It DESTROYS A VITAMIN IDENTITY on a surface
# the user reads, and 36 instances were live across 32 claims until they were page-read.
#
# ★ WHAT THIS PATTERN DELIBERATELY CANNOT SEE, and why it is not loosened to catch it: a BARE
# 'B,' with a single comma is ambiguous between a destroyed vitamin subscript and the element
# BORON followed by a real list comma. rare-earths Table 7-8 prints 'Ca, Mg, B, Cu, S' -- 10 such
# hits, all page-verified as boron. A pattern wide enough to catch 'amounts of B, to prevent'
# (which really was B6) would turn boron into a vitamin in 5 claims. So the gate covers the
# UNAMBIGUOUS shapes only and the bare-'B,' case stays a WISH resting on the vision pass (R7).
# The chemical-formula clause requires an UPPERCASE follower so 'Preparation H, sitz baths' -- a
# product name, page-verified -- does not fire.
_FF_SUBSCRIPT_DAMAGE = re.compile(
    r"[Vv]itamin\s+B\s*,"                  # vitamin B, / vitamin B,,
    r"|\bB\s*,,"                            # B,, -- two destroyed digits
    r"|\(\s*B\s*,\s*\)"                  # (B,) parenthesised designation
    r"|\bLD\s*(?:so|SO|s0|5o)\b"           # LD50 read as letters
    r"|[Vv]itamin\s+8[0-9]?\b"                # vitamin B read as the digit 8
    r"|\b(?:CO|H|SO|NO)\s*,\s*(?=[A-Z0-9])"  # CO,/H, formula subscript
)


def _frontface_defects(verbatim):
    """Detector classes that are MECHANICALLY decidable on a verbatim. Extracted so
    tools/tests/test_frontface_verbatims_clean.py drives them directly."""
    v = verbatim or ""
    out = []
    if _FF_MID_WORD_HYPHEN.search(v):
        out.append("hyphen_split")
    if _FF_MOJIBAKE.search(v):
        out.append("mojibake_or_control")
    if _FF_SPACE_B4_PUNCT.search(v):
        out.append("space_before_punct")
    if _FF_NUMBER_SPLIT.search(_FF_VITAMIN_DESIG.sub(" ", v)):
        out.append("number_split")
    if _FF_RUN_TOGETHER.search(v):
        out.append("run_together")
    if _FF_DOUBLE_SPACE.search(v):
        out.append("double_space")
    if _FF_DIGIT_IN_WORD.search(_FF_DIGIT_OK.sub(" ", v)):
        out.append("digit_in_word")
    if _FF_SUBSCRIPT_DAMAGE.search(v):
        out.append("subscript_damage")
    return out


# Transcription scaffolding: text the TRANSCRIPTION inserted that is not on the printed page. A
# verbatim asserts "these are Wallach's printed words", so scaffolding inside one is always a defect
# — there is no legitimate case, which is why this gate needs no exception list and has no
# false-positive surface. Contrast `subscript_damage`, whose candidate shapes are ambiguous with real
# content (a bare `B,` really is boron in a mineral list) and which therefore must stay narrow.
#
# The shapes are taken from what the sources ACTUALLY contain, enumerated rather than guessed:
# 1,512 equals-run separators, 757 `Screenshot (N)` frames, 497 `Page N of M` readouts and 3 Kindle
# location markers across the seven books. DELIBERATELY EXCLUDED: asterisk runs (3 in epigenetics)
# and underscore runs (5 in rare-earths), because a printed page can legitimately carry a rule of
# asterisks or an underscore blank — those are plausible book content, the four below are not.
_SCAFFOLDING = (
    ("harness frame name", re.compile(r"Screenshot\s*\(\d+\)")),
    ("reader page readout", re.compile(r"\bPage\s+\d+\s+of\s+\d+\b")),
    ("separator rule", re.compile(r"={3,}")),
    ("kindle location marker", re.compile(r"<\s*Page\s+\d+\s+of\s+\d+\s*\|")),
)


def check_verbatim_no_transcription_scaffolding():
    """No sealed claim's verbatim or claim_text contains transcription scaffolding.

    THE DEFECT: three claims (EPIGEN-000124, -000125, IMMORT-000230) carried
    `===== Screenshot (675) -- Page 818 of 936 =====` INSIDE their verbatim, i.e. the app could
    render OCR scaffolding to a reader as though Wallach had written it. A reader hit ONE of them;
    a grep found the other two -- which is why this is a gate and not a review item.

    The fix is never a source edit — those separators are legitimate scaffolding in the .txt (932 in
    epigenetics alone) and deleting them would corrupt the transcription. The repair is a verbatim
    RE-CUT via corpus_resnap --fix, which is why this gate guards the CLAIM and not the book.
    """
    claims_dir = ROOT / "eden" / "corpus" / "claims"
    shards = sorted(claims_dir.glob("claims-*.json"))
    if not shards:
        return True, "eden/corpus not installed (bootstrap-guard)"
    hits = []
    scanned = 0
    for shard in shards:
        data = json.loads(shard.read_text(encoding="utf-8"))
        items = data if isinstance(data, list) else data.get("claims", [])
        for c in items:
            if not isinstance(c, dict):
                continue
            scanned += 1
            for field in ("verbatim", "claim_text"):
                v = c.get(field)
                if not isinstance(v, str):
                    continue
                for label, rx in _SCAFFOLDING:
                    m = rx.search(v)
                    if m:
                        hits.append(f"{c.get('id')}.{field}: {label} {m.group(0)!r}")
    if hits:
        return False, (f"{len(hits)} transcription-scaffolding fragment(s) inside sealed claim text "
                       f"— a verbatim must contain only the printed page's words: "
                       + "; ".join(sorted(hits)[:6])
                       + (f" (+{len(hits) - 6} more)" if len(hits) > 6 else ""))
    return True, f"{scanned} sealed claims carry no transcription scaffolding in verbatim or claim_text"


def check_frontface_verbatims_clean():
    """No sealed (front-facing) verbatim carries a mid-word line-break hyphen or a
    mojibake/control character.

    SCOPE, stated honestly. EIGHT detector classes, all gated (the eighth, subscript_damage, was
    added after 36 destroyed vitamin subscripts were page-read and recovered). Every residual hit
    was read off its page image before its detector was promoted from WISH to enforced; that
    verification is what the exclusions encode -- ordinals, decades, vitamin designations, unit and
    formula adjacency, table leader dots -- and what the named exceptions record. Some residual
    cases turn out to be FAITHFUL rather than defects: the page really does print "(Levamisol ,"
    and really does print "in1881". Batch-fixing on the detector's say-so would corrupt both, so
    every hit is verified against the page before it is treated as damage.

    It CANNOT see the invisible class -- a valid-word OCR swap ("side" for "vide", "Jute" for
    "lute"). Four of those were found by eye, every one inside a pair this gate calls clean. Only
    a human read catches those; this gate holds the mechanical floor."""
    exc_path = ROOT / "eden" / "tools" / "frontface-exceptions.json"
    claims_dir = ROOT / "eden" / "corpus" / "claims"
    shards = sorted(claims_dir.glob("claims-*.json"))
    if not shards:
        return True, "eden/corpus not installed (bootstrap-guard)"
    allowed, unreasoned = {}, []
    if exc_path.exists():
        for e in json.loads(exc_path.read_text(encoding="utf-8")).get("exceptions", []):
            if not (e.get("reason") or "").strip():
                unreasoned.append(e.get("claim_id"))
            allowed.setdefault(e.get("claim_id"), set()).add(e.get("detector"))
    if unreasoned:
        return False, (f"{len(unreasoned)} frontface exception(s) carry no reason: {unreasoned[:5]} -- "
                       "an exception is a factual claim about the world and must be checkable (R9)")
    violations, scanned = [], 0
    for sh in shards:
        for c in json.loads(sh.read_text(encoding="utf-8")).get("claims", []):
            scanned += 1
            for d in _frontface_defects(c.get("verbatim", "")):
                if d not in allowed.get(c["id"], set()):
                    violations.append(f"{c['id']}:{d}")
    if violations:
        return False, (f"{len(violations)} front-facing verbatim defect(s): {'; '.join(violations[:6])}"
                       f"{' ...' if len(violations) > 6 else ''}")
    n_exc = sum(len(v) for v in allowed.values())
    return True, (f"{scanned} front-facing verbatim(s) clean across ALL 8 mechanical defect classes "
                  f"(hyphen split, mojibake, space-before-punct, number split, run-together, double "
                  f"space, digit-in-word, subscript damage) with {n_exc} named exception(s), each carrying its evidence")


def check_explore_entity_lede_authored():
    """Every EXPLORE-page entity (a search-index entity of type concept/substance/topic/element/
    person/event with >=1 resolving claim -- it renders knowledge-topic.ts, NOT an essential or a
    condition page) must carry a HAND-AUTHORED lede in entity-copy.json['topics'][slug], UNLESS its
    slug is in the frozen grandfathered backlog (tools/gate-fixtures/lede-backlog.json). Without a hand lede the
    topic hero DERIVES its header from a claim's answer_short (state/search.ts::entityLede), which
    reads as an answer, not a header -- one topic page was titled "It's a mineral-deficiency
    signal..." for exactly this reason. STRUCTURAL: this proves a lede EXISTS, never that it reads
    well (that rests on review). The backlog only ever SHRINKS; a NEW explore entity is not in it,
    so it is RED until authored -- the "never again" teeth."""
    si_p = ROOT / "dashboard" / "assets" / "data" / "search" / "search-index.json"
    ec_p = ROOT / "dashboard" / "assets" / "data" / "entity-copy.json"
    led_p = ROOT / "tools" / "gate-fixtures" / "lede-backlog.json"
    if not si_p.exists() or not ec_p.exists():
        return True, "search-index/entity-copy not installed (bootstrap-guard)"
    si = json.loads(si_p.read_text(encoding="utf-8"))
    ents = si.get("entities", {}) or {}
    claims = si.get("claims", [])
    claim_iter = claims.values() if isinstance(claims, dict) else claims
    have_claim = set()
    for c in claim_iter:
        s = c.get("subject")
        if s:
            have_claim.add(s)
        for a in (c.get("also_about") or []):
            have_claim.add(a)
    explore = {slug for slug, e in ents.items()
               if e.get("type") not in ("nutrient", "condition") and slug in have_claim}
    ec = json.loads(ec_p.read_text(encoding="utf-8"))
    topics = ec.get("topics", {}) or {}
    authored = {s for s, v in topics.items()
                if isinstance(v, dict) and (v.get("lede") or "").strip()}
    grand = set()
    if led_p.exists():
        grand = set(json.loads(led_p.read_text(encoding="utf-8")).get("grandfathered", []))
    missing = sorted(explore - authored - grand)
    if missing:
        sample = ", ".join(missing[:8])
        return False, (f"{len(missing)} explore entity(ies) render a topic page with no hand-authored "
                       f"lede and are not grandfathered -- author entity-copy.json['topics'] (only a "
                       f"PRE-EXISTING one may be added to tools/gate-fixtures/lede-backlog.json): {sample}"
                       f"{' ...' if len(missing) > 8 else ''}")
    return True, (f"all {len(explore)} explore-page entities carry a hand lede "
                  f"({len(authored)} authored) or are grandfathered ({len(explore & grand)} backlog)")


def check_enriched_book_is_verified():
    """ROOT-CAUSE gate: a claim may not be FRONT-FACING (carry a search-enrichment entry) unless its
    book is verified, the claim itself is verified, or it is in the frozen grandfathered backlog.

    Ledger: tools/gate-fixtures/frontface-verified.json.
    A NEW enrichment on an unverified book is RED, so the original failure -- enriching from a raw
    book and promising to fix it later -- cannot recur. The escape hatch is per-claim: vision-verify
    the claim, add its id to claims_verified, then enrich it.

    The grandfathered set is the claims already enriched when the gate landed -- 1,925 at freeze,
    and DESIGNED TO SHRINK as ids move into claims_verified (do not hard-code the current number
    anywhere; the gate's own output is the live count). It is an honest BACKLOG, not a waiver: being
    in it asserts only 'this was already front-facing on 2026-08-02', never 'this is correct'. An id
    appearing in it that was not frozen there is RED."""
    led_path = ROOT / "tools" / "gate-fixtures" / "frontface-verified.json"
    enr_path = ROOT / "eden" / "corpus" / "search-enrichment.json"
    if not led_path.exists() or not enr_path.exists():
        return True, "verification ledger or enrichment not installed (bootstrap-guard)"
    led = json.loads(led_path.read_text(encoding="utf-8"))
    gf = led.get("grandfathered", {})
    if not (gf.get("reason") or "").strip():
        return False, "grandfathered backlog carries no reason -- an unexplained waiver is not auditable (R9)"
    books_ok = set(led.get("books_verified", []))
    claims_ok = set(led.get("claims_verified", []))
    frozen = {cid for lst in (gf.get("claim_ids") or {}).values() for cid in lst}
    prefix_book = {}
    for sh in sorted((ROOT / "eden" / "corpus" / "claims").glob("claims-*.json")):
        d = json.loads(sh.read_text(encoding="utf-8"))
        for c in d.get("claims", []):
            prefix_book[c["id"]] = d.get("book_id")
    enriched = [k for k in json.loads(enr_path.read_text(encoding="utf-8")).get("enrichment", {})
                if k.startswith("WAL-CLM-")]
    ungated = [cid for cid in enriched
               if prefix_book.get(cid) not in books_ok and cid not in claims_ok and cid not in frozen]
    if ungated:
        return False, (f"{len(ungated)} claim(s) front-faced from an UNVERIFIED book and not in the "
                       f"ledger: {ungated[:6]}{' ...' if len(ungated) > 6 else ''} -- verify the source "
                       f"span against its page image and add the id to claims_verified")
    return True, (f"{len(enriched)} enriched claim(s) all accounted: {len(books_ok)} verified book(s), "
                  f"{len(claims_ok)} individually verified claim(s), {len(frozen)} grandfathered "
                  f"(an honest backlog, NOT a correctness claim)")


def check_jargon_terms_glossed():
    """Term-gloss coverage guard: every medical-jargon word (a latinate
    -osis/-itis/-emia/... term, minus a small common-word + botanical-fragment skip list) that
    appears in a front-facing claim_text SHOULD have a plain-language entry in glossary.json so
    the tooltip layer can explain it. Surfaced as a warning every board run so coverage grows and
    no un-glossed jargon is silently left behind (the heuristic can false-match a scientific name,
    so this warns rather than hard-blocks)."""
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
    The point is to never circle back to the same OCR damage twice."""
    sys.path.insert(0, str(ROOT / "eden" / "tools"))
    import book_purity
    status_path = ROOT / "eden" / "tools" / "purity-status.json"
    if not status_path.exists():
        return True, "no purity-status.json — purification campaign not started"
    if not _books_present():
        return True, "book source .txt not distributed in the public repo (copyright) — purity verified pre-publish; place eden/corpus/books/*.txt locally to re-run"
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
    """Mined-page cleanliness gate. Every screenshot page carrying a
    sealed claim, in a book that has entered the purification campaign (purity-status
    purifying|pristine), must be free of high-confidence OCR defects in its source
    .txt -- the tight, ~zero-false-positive classes: punctuation-spacing
    (space_before_punct / space_in_paren) and gibberish (repeated_char /
    post_marker_fragment, e.g. "eee", "Sei ee a"). This turns "clean the books as you
    go" from a convention into a machine gate: work cannot land having left
    detectable garbage on a page it mined -- a convention is rationalizable, a red board
    is not. FP-heavy classes (spell proper nouns, run-togethers, double_space table
    alignment) are deliberately OUT of scope (whole-book pristine sweep); reading-order
    scrambles no detector can catch stay covered by the paste cross-check. Genuine FPs
    are triaged (with a reason) in eden/tools/mined-page-triage.json. Truth-anchored on
    sealed claim locators x deterministic book_purity detectors.
    Detail: eden/tools/mined_page_audit.py."""
    if not (ROOT / "eden" / "tools" / "mined_page_audit.py").exists():
        return True, "mined_page_audit.py not installed (bootstrap-guard)"
    sys.path.insert(0, str(ROOT / "eden" / "tools"))
    import mined_page_audit
    if not _books_present():
        return True, "book source .txt not distributed in the public repo (copyright); re-runs when eden/corpus/books/*.txt is placed locally"
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
                       f"(run: python eden/tools/mined_page_audit.py audit)")
    gated = ", ".join(sorted(mined_page_audit.gated_books())) or "(none)"
    return True, f"all mined source pages clean across campaign books [{gated}] (tight gibberish+spacing gate)"


def check_mining_coverage_accounted():
    """Coverage-accounting gate for book mining -- the page/section DENOMINATOR.
    For each book flagged mining_status:'complete' in
    eden/tools/mining-coverage.json, prove no WHOLESALE skip: every source page
    (screenshot-scheme books) or section (chapter-scheme books) is either
    claim-bearing or explicitly reviewed-empty WITH A REASON. Books still
    'incomplete' are reported informationally, NEVER RED -- exactly as
    book_source_clean asserts only pristine books. Turns silent under-mining (a
    long tail of unread appendix pages; a whole book sitting at 0 claims) into a
    red board AT COMPLETION instead of an invisible dropped thread. Claim-bearing
    pages auto-derive from sealed locator.char_offset -> the nearest preceding
    '===== Screenshot(N) =====' marker: ONE internally-consistent text-position
    basis, deliberately NOT locator.screenshot (which is populated inconsistently
    per book -- epigenetics numbers by Page, iaiyh/immortality by marker N). The
    only human input is resolving zero-claim pages/sections with a reason
    (exceptions_justified pattern). Wholesale accounting only -- per-claim sub-page
    completeness stays with the corpus_audit end-pass; faithfulness is sampled by
    the manual mining checkpoint."""
    import bisect
    ledger_p = ROOT / "eden" / "tools" / "mining-coverage.json"
    meta_p = ROOT / "eden" / "corpus" / "books-meta.json"
    if not ledger_p.exists():
        return True, "no mining-coverage.json -- coverage ledger not installed (bootstrap-guard)"
    if not _books_present():
        return True, "book source .txt not distributed in the public repo (copyright); re-runs when eden/corpus/books/*.txt is placed locally"
    ledger = json.loads(ledger_p.read_text(encoding="utf-8")).get("books", {})
    meta = json.loads(meta_p.read_text(encoding="utf-8"))["books"]
    marker_re = re.compile(r"=====\s*Screenshot\s*\((\d+)\)")
    failures, info = [], []
    for m in meta:
        book_id = m["book_id"]
        entry = ledger.get(book_id, {})
        status = entry.get("mining_status", "incomplete")
        basis = entry.get("coverage_basis",
                          "screenshot" if m.get("locator_scheme") == "screenshot" else "section")
        shard = ROOT / "eden" / "corpus" / "claims" / f"claims-{book_id}.json"
        claims = []
        if shard.exists():
            sd = json.loads(shard.read_text(encoding="utf-8"))
            claims = sd.get("claims", []) if isinstance(sd, dict) else sd
        if basis == "screenshot":
            txt = (ROOT / m["file"]).read_text(encoding="utf-8")
            marks = [(mm.start(), int(mm.group(1))) for mm in marker_re.finditer(txt)]
            if not marks:
                info.append(f"{book_id}=no-markers({len(claims)} claims)")
                continue
            positions = [p for p, _ in marks]
            all_pages = {n for _, n in marks}
            bearing = set()
            for c in claims:
                off = (c.get("locator") or {}).get("char_offset")
                if off is None:
                    continue
                i = bisect.bisect_right(positions, off) - 1
                if i >= 0:
                    bearing.add(marks[i][1])
            zero = sorted(all_pages - bearing)
            reviewed = entry.get("reviewed_empty", {})
            if status == "complete":
                unresolved = [p for p in zero if str(p) not in reviewed]
                no_reason = [p for p in zero
                             if str(p) in reviewed and not str(reviewed[str(p)]).strip()]
                if unresolved:
                    failures.append(f"{book_id}: flagged COMPLETE but {len(unresolved)} page(s) neither "
                                    f"claim-bearing nor reviewed-empty (e.g. Screenshot {unresolved[:6]})")
                if no_reason:
                    failures.append(f"{book_id}: {len(no_reason)} reviewed-empty page(s) with no reason "
                                    f"(Screenshot {no_reason[:6]})")
                info.append(f"{book_id}=COMPLETE:{len(bearing)}/{len(all_pages)} pages mined")
            else:
                info.append(f"{book_id}=incomplete:{len(bearing)}/{len(all_pages)} pages "
                            f"({len(zero)} zero-claim, {len(claims)} claims)")
        else:  # section basis -- chapter-scheme books have no reliable page markers
            sections = entry.get("sections", [])
            if status == "complete":
                if not sections:
                    failures.append(f"{book_id}: flagged COMPLETE but no sections[] to prove coverage")
                pending = [s.get("name", "?") for s in sections
                           if s.get("status") not in ("mined", "reviewed-empty")]
                no_reason = [s.get("name", "?") for s in sections
                             if s.get("status") == "reviewed-empty" and not str(s.get("reason", "")).strip()]
                if pending:
                    failures.append(f"{book_id}: flagged COMPLETE but {len(pending)} section(s) pending "
                                    f"({pending[:6]})")
                if no_reason:
                    failures.append(f"{book_id}: {len(no_reason)} reviewed-empty section(s) with no reason")
                info.append(f"{book_id}=COMPLETE:{len(sections)} sections accounted")
            else:
                info.append(f"{book_id}=incomplete(section-basis, {len(claims)} claims)")
    if failures:
        return False, ("book mining coverage gaps -- " + "; ".join(failures) +
                       " (resolve in eden/tools/mining-coverage.json)")
    return True, "book mining coverage accounted -- " + "; ".join(info)


def check_substance_triage_accounted(buffer_path=None, coverage_path=None):
    """The substance triage buffer's accounting gate. references_resolve reds on any claim
    other_substances slug not registered in eden/catalog/nutrients.json. Its relief valve is
    eden/tools/substance-triage-buffer.json: a substance with no registry slug is PARKED there with
    source context and left out of the claim FOR NOW, so mining never has to choose between
    typo-polluting the registry and silently dropping a substance. This gate keeps that pile
    un-forgettable WITHOUT trusting it as a source (the single registry stays nutrients.json -- no
    drift): while a book is mining_status:'incomplete' its pending entries are informational (never
    RED, exactly as mining_coverage_accounted stays quiet on incomplete books), but the moment a
    book is flagged COMPLETE in eden/tools/mining-coverage.json, every entry for it MUST be
    resolved/rejected with a written reason -- an unresolved pending entry under a complete book is
    RED. Also structural: valid JSON, unique ids, required fields, a terminal status carries a
    non-empty resolution. Bootstrap-safe (missing buffer = pass). Truth-anchored on the buffer x the
    coverage ledger, recomputed each run -- the buffer is NEVER read for resolution, only accounting."""
    buffer_path = buffer_path or (ROOT / "eden" / "tools" / "substance-triage-buffer.json")
    coverage_path = coverage_path or (ROOT / "eden" / "tools" / "mining-coverage.json")
    if not buffer_path.exists():
        return True, "substance-triage-buffer.json missing (bootstrap-guard)"
    try:
        data = json.loads(buffer_path.read_text(encoding="utf-8"))
    except Exception as e:
        return False, f"substance-triage-buffer.json is not valid JSON: {e}"
    entries = data.get("entries", [])
    if not isinstance(entries, list):
        return False, "substance-triage-buffer.json 'entries' must be a list"
    # complete books (teeth fire ONLY here) -- mirrors mining_coverage_accounted's completion semantics
    complete = set()
    if coverage_path.exists():
        try:
            cov = json.loads(coverage_path.read_text(encoding="utf-8")).get("books", {})
            complete = {b for b, v in cov.items() if v.get("mining_status") == "complete"}
        except Exception as e:
            return False, f"mining-coverage.json unreadable for triage accounting: {e}"
    REQUIRED = ("id", "raw_name", "book_id", "locator", "context", "claim_id", "noticed_at",
                "status", "resolution")
    viol, seen, per_book_pending = [], set(), {}
    for i, e in enumerate(entries):
        if not isinstance(e, dict):
            viol.append(f"entry #{i} is not an object")
            continue
        missing = [k for k in REQUIRED if k not in e]
        if missing:
            viol.append(f"entry {e.get('id', '#' + str(i))} missing field(s): {missing}")
            continue
        eid = e["id"]
        if eid in seen:
            viol.append(f"duplicate id {eid}")
        seen.add(eid)
        status = e["status"]
        if status not in ("pending", "resolved", "rejected"):
            viol.append(f"entry {eid} has invalid status '{status}'")
            continue
        if status != "pending" and not str(e.get("resolution", "")).strip():
            viol.append(f"entry {eid} is {status} but carries no resolution reason")
        if status == "pending":
            per_book_pending[e["book_id"]] = per_book_pending.get(e["book_id"], 0) + 1
            if e["book_id"] in complete:
                viol.append(f"entry {eid} ('{e['raw_name']}') is PENDING but its book "
                            f"'{e['book_id']}' is flagged mining_status:complete -- resolve or reject "
                            f"it before the book seals (eden/tools/substance_triage.py resolve)")
    if viol:
        return False, ("substance triage buffer not accounted -- " + "; ".join(viol[:6])
                       + (" ..." if len(viol) > 6 else ""))
    total = len(entries)
    pending = sum(1 for e in entries if e.get("status") == "pending")
    if total == 0:
        return True, "substance triage buffer empty -- no parked substances (bootstrap-clean)"
    info = ", ".join(f"{b}:{n}" for b, n in sorted(per_book_pending.items())) or "none pending"
    return True, (f"substance triage buffer accounted -- {total} entr{'y' if total == 1 else 'ies'}, "
                  f"{pending} pending [{info}] (all pending books still incomplete)")


# ---------------------------------------------------------------------------
# Citation, prose and dedup gates
# ---------------------------------------------------------------------------
# These three gates enforce two rules -- one source per fact, referenced by ID (no
# value hand-written twice), and prose contained in ONE compartment -- over the
# CLEAN governed surface: the Wallach Corpus pillar (claims + essentials-canon)
# + the Catalog pillar (conditions/symptoms) + the corpus-DERIVED artifacts
# (essentials-targets-data, coverage-layout-data). This is where the rules HOLD
# today, so the gates have real teeth and stay green.
#
# The altitude is deliberate: real teeth on the clean surface now, and everything
# still outside it is a LABELED WISH -- documented, never sold as guarded. The
# scanner-corpus and OCR-dictionary stores were brought ONTO the clean surface
# (_CLEAN_SURFACE_LEGACY_DATA); the product label lookup is COMPOSITION-ONLY and
# carries its own dedicated gate, no_product_marketing_prose.
#
# What remains a WISH, stated plainly so nobody reads these gates as covering it:
#   * the un-migrated views (views/regimen.ts + views/knowledge.ts) still carry
#     user-facing copy inline instead of in the view-copy store;
#   * the FULL prose rule (verbatim = a claim POINTER plus a single-copy
#     per-essential prose store) only becomes meaningful once clean post-mining
#     stances exist.

_CLEAN_SURFACE_DERIVED = (   # corpus-derived artifacts that are clean today
    "dashboard/assets/data/essentials-targets-data.json",
    "dashboard/assets/data/coverage-layout-data.json",
)
_CLEAN_SURFACE_STORES = (   # hand-edited designated prose stores, clean today
    "dashboard/assets/data/view-copy.json",  # VIEW-prose store: kind/facet labels + UI chrome
    "dashboard/assets/data/entity-copy.json",  # per-entity approved lede + why-this-number
)
_CLEAN_SURFACE_LEGACY_DATA = (   # hand-authored data since brought under the prose/citation gates
    "dashboard/assets/data/scanner-corpus-data.json",  # scanner dietary baselines
    "dashboard/assets/data/ocr-dict-data.json",        # OCR normalization dictionary
)
# Designated prose / free-descriptor homes -- the ONLY keys allowed to hold
# prose-shaped text on the clean surface. This allowlist IS R4's "ONE compartment":
# the corpus's two prose fields, file-level metadata/audit prose, and the dose
# sub-fields whose values are inherently short free descriptors (a titration
# schedule, a target condition, a dose form).
_PROSE_HOME_KEYS = {
    "claim_text", "verbatim",                                  # corpus prose homes
    "_doctrine", "_purpose", "_doc", "provenance", "notes",    # file metadata prose
    "hash_note", "source", "_source", "description", "question",
    "resolution", "_note", "rationale", "file", "authors", "sealed_at",
    "duration", "for_condition", "form",                       # dose free descriptors
    "lede", "why",                                             # entity-copy approved lede + why-this-number
    "_prose_container",                                        # a leaf under a _PROSE_CONTAINER_KEYS subtree
}


def _clean_surface_files():
    """The CLEAN Charter-governed file set (see the block header). Missing files are
    skipped (bootstrap-safe)."""
    files = sorted((ROOT / "eden" / "corpus" / "claims").glob("claims-*.json"))
    for rel in ("eden/corpus/essentials-canon.json",
                "eden/catalog/conditions.json",
                "eden/catalog/symptoms.json",
                *_CLEAN_SURFACE_DERIVED,
                *_CLEAN_SURFACE_STORES,
                *_CLEAN_SURFACE_LEGACY_DATA):
        p = ROOT / rel
        if p.exists():
            files.append(p)
    return files


_PROSE_CONTAINER_KEYS = {"antiListNotes", "ui"}  # whole subtrees that ARE one designated prose
# home (its leaves are contained prose keyed by an entity name, not fact fields).
# "antiListNotes": scanner-corpus-data keeps its Wallach food-guidance PROSE there, cleanly
# apart from the antiList fact arrays; recognize it so the fact arrays stay gated while the
# contained prose gets its one home. KNOWN GAP, stated out loud: that prose still carries
# hand-authored Wallach health claims and inline book-refs that have not been sourced into
# corpus claims, and nothing here gates them.
# "ui": the view-copy VIEW-prose store's chrome-copy subtree -- its ep_* leads/notes are
# sentence-shaped prose BY DESIGN (the "one compartment" for view copy), so the whole
# ui{} subtree is a prose home, never a fact field. Only view-copy.json carries a top-level "ui".


def _walk_strings(obj, key=None, in_prose=False):
    """Yield (parent_key, value) for every string leaf. List elements inherit their
    enclosing key so `synonyms: [...]` leaves are tagged 'synonyms', etc. A leaf anywhere
    under a _PROSE_CONTAINER_KEYS subtree is tagged '_prose_container' (a prose home) so a
    designated prose block is not mis-read as fact-field prose."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            yield from _walk_strings(v, k, in_prose or k in _PROSE_CONTAINER_KEYS)
    elif isinstance(obj, list):
        for x in obj:
            yield from _walk_strings(x, key, in_prose)
    elif isinstance(obj, str):
        yield ("_prose_container" if in_prose else key), obj


def check_citations_reference_registry():
    """The citation gate -- a book is referenced by book_id and its
    display citation is COMPOSED from the sealed registry (books-meta.json), never hand-typed.
    Hand-typed citations (the ~200x drift where a cite said 1999 while the registry said 2011)
    are the exact failure this overhaul exists to kill. LIVE teeth over the CLEAN Charter
    surface: (1) every claim's locator.book resolves to a registry book_id; (2) no clean-surface
    FACT field carries a registry book TITLE literal -- titles live ONLY in books-meta + its
    derived projection, so a title in a fact field is a hand-typed citation. Prose homes
    (verbatim/claim_text/...) are allowlisted: Wallach may name a book in his own words. The
    claim->book_id substring is also gated by corpus_verify #2 (this makes the rule explicit +
    extends it to titles). OUT of scope (a labeled WISH -- do NOT sell as
    guarded): inline view prose (e.g. views/regimen.ts). The hand-authored DATA stores
    (scanner / ocr) ARE covered: the clean surface was widened to include them.
    Truth-anchored on books-meta titles + book_ids x the
    clean-surface bytes, recomputed each run."""
    meta_p = ROOT / "eden" / "corpus" / "books-meta.json"
    if not meta_p.exists():
        return True, "eden/corpus/books-meta.json missing (bootstrap-guard)"
    meta = json.loads(meta_p.read_text(encoding="utf-8"))["books"]
    titles = [b["title"] for b in meta]
    book_ids = {b["book_id"] for b in meta}
    viol = []
    for shard in sorted((ROOT / "eden" / "corpus" / "claims").glob("claims-*.json")):
        for c in json.loads(shard.read_text(encoding="utf-8")).get("claims", []):
            b = (c.get("locator") or {}).get("book")
            if b is not None and b not in book_ids:
                viol.append(f"claim {c.get('id')} locator.book '{b}' is not a registry book_id")
    for p in _clean_surface_files():
        for key, val in _walk_strings(json.loads(p.read_text(encoding="utf-8"))):
            if key in _PROSE_HOME_KEYS:
                continue
            for t in titles:
                if t in val:
                    viol.append(f"{p.name}: hand-typed book title {t!r} in fact field '{key}' "
                                f"(reference by book_id; compose the citation from the registry)")
                    break
    if viol:
        return False, ("hand-typed / unresolved book citation(s) on the clean surface (R3): "
                       + "; ".join(viol[:6]) + (" ..." if len(viol) > 6 else ""))
    return True, (f"all book references on the clean Charter surface use book_id + the sealed "
                  f"registry ({len(book_ids)} books); no hand-typed citation (legacy embeds + "
                  f"views are a labeled WISH)")


def check_prose_contained():
    """Prose lives in ONE designated compartment, never in a fact field. LIVE teeth
    over the CLEAN governed surface (corpus claims + canon + catalog + the corpus-derived
    targets/coverage-layout artifacts + the hand-authored scanner/ocr data):
    no prose-shaped string appears under a NON-prose key.
    Prose-shaped = >= 12 words OR a sentence boundary ('. X') in a > 40-char value. The designated
    prose/descriptor homes (_PROSE_HOME_KEYS: claim_text, verbatim, file-metadata prose, dose
    descriptors) are the "ONE compartment" -- everything else must stay structured. Catches a
    paragraph leaking into a slug/symbol/enum/numeric fact field. PARTIAL by design, and labeled
    so: the FULL rule (verbatim = a claim POINTER + a single-copy per-essential prose store) only
    matters once clean post-mining stances exist. Inline prose still living in the un-migrated
    views (views/regimen.ts) is a labeled WISH -- documented, never sold as guarded.
    Truth-anchored on the clean-surface bytes, recomputed each run."""
    def _prose_shaped(s):
        return len(s.split()) >= 12 or (len(s) > 40 and re.search(r"\. [A-Z]", s) is not None)
    viol = []
    files = _clean_surface_files()
    for p in files:
        for key, val in _walk_strings(json.loads(p.read_text(encoding="utf-8"))):
            if key in _PROSE_HOME_KEYS:
                continue
            if _prose_shaped(val):
                viol.append(f"{p.name}: prose-shaped text in fact field '{key}': {val[:50]!r}")
    if viol:
        return False, ("prose-shaped text in a fact field on the clean surface (R4) -- move it to a "
                       "designated prose home: " + "; ".join(viol[:6]) + (" ..." if len(viol) > 6 else ""))
    return True, (f"no prose in a fact field across {len(files)} clean-surface file(s); prose stays "
                  f"in its designated homes (the full prose-store form + inline view prose are "
                  f"a labeled WISH)")


def check_internal_refs_out_of_prose():
    """front-facing-human-first -- an internal book NAVIGATION ref (Table/Fig/page N)
    is provenance, not reader content, so it NEVER appears in a claim_text (the reader-facing
    summary): provenance rides on the source-ref tag (surfaced as a labeled attribution HEADER) and
    in the verbatim quote. Any ref token in ANY claim_text is RED. The 44 Rare-Earths/Immortality
    table claims + the 33 Let's-Play-Doctor Base-Line dose summaries were cleaned (2026-07-09); the
    Fig. 8-1 label survives only in the dose card's own legend + the verbatim. Replaces render-time
    prose REWRITING with a data-cleanliness gate: the fix lives in the sealed source, the view is a
    pure projection. Truth-anchored on the sealed shard claim_texts, recomputed each run."""
    pat = re.compile("\\b(Table|Fig\\.?|Figure|page|p\\.)\\s*\\d", re.I)
    claims_dir = ROOT / "eden" / "corpus" / "claims"
    if not claims_dir.exists():
        return True, "eden/corpus/claims missing (bootstrap-guard)"
    viol, n = [], 0
    for shard in sorted(claims_dir.glob("claims-*.json")):
        for c in json.loads(shard.read_text(encoding="utf-8")).get("claims", []):
            ct = c.get("claim_text", "") or ""
            m = pat.search(ct)
            if m:
                n += 1
                if len(viol) < 6:
                    viol.append(f"claim {c.get('id')}: claim_text carries internal ref '{m.group(0).strip()}'")
    if viol:
        return False, ("internal book ref in a reader-facing claim_text (front-facing-human-first) -- "
                       "provenance belongs in the source-ref tag/header + the verbatim: "
                       + "; ".join(viol) + (f" ... (+{n - 6} more)" if n > 6 else ""))
    return True, ("no internal Table/Fig/page ref in any claim_text; provenance lives in the source-ref "
                  "tag/header + the verbatim quote, never the reader-facing summary")


# ---------------------------------------------------------------------------
# no_duplicate_claims -- one span, one question
# ---------------------------------------------------------------------------
# THE DEFECT THIS EXISTS FOR, written out in full because a gate whose origin is
# forgotten is a gate the next reader loosens:
#   A reader opened the Vitamin A entity page and saw TWO near-identical
#   "What is Vitamin A?" cards. One extraction had emitted a TRUNCATED take and a
#   FULL take of the same span -- WAL-CLM-EPIGEN-000213 (128 chars) and -000214
#   (481 chars), identical char_offset 1065286, identical extracted_at, identical
#   subject/facet -- and both survived to the reader. 13 duplicates were removed
#   corpus-wide (commit b3551834). The board was fully green throughout. The
#   class was found by a human looking at a screen, which is not a control.
#
# TWO MECHANISMS, both measured in the real metadata, both must be caught:
#   1. SAME-BATCH DOUBLE EMISSION -- one extraction emits a truncated take AND a
#      full take. Identical offset AND identical extracted_at.
#   2. CROSS-BATCH RE-MINING -- a later pass re-mines a span an earlier pass
#      already covered. Same offset, DIFFERENT extracted_at.
# The gate keys on NEITHER timestamp NOR offset. Both mechanisms land the same
# reader-visible shape, and a third mechanism nobody has met yet would land it too;
# keying on the metadata that happened to differ would gate the symptom of these two.
#
# THE SIGNATURE -- all four, or it is not a duplicate:
#     same book . verbatim CONTAINMENT . same enrichment subject . same facet
#
# ★ CONTAINMENT ALONE IS NOT DUPLICATION. This is the trap that makes the naive
# version of this gate unshippable: 297 overlapping and 209 containment pairs exist
# corpus-wide BY DESIGN. Wallach writes one paragraph that answers several
# questions, so one span is legitimately quoted by several claims -- DDDL-000030
# (selenium/warning) and DDDL-000096 (dietary_oils/mechanism) quote the same bytes
# to say different things. What makes a duplicate READER-VISIBLE is landing on the
# SAME entity page under the SAME heading: `subject` routes both cards to one page,
# `facet` groups them into one section. Measured over the sealed corpus, the full
# four-part signature fires on a small fraction of the pairs that containment alone
# would flag -- two orders of magnitude fewer.
#
# WHY CONTAINMENT AND NOT OVERLAP: partial overlap is how ADJACENT claims look. The
# Let's-Play-Doctor base-line dose table gives 5 same-subject/same-facet pairs at
# 47-61% overlap (calcium, copper, inositol, iron, sodium) that are different doses
# from neighbouring rows, plus 4 more prose pairs. All 9 are legitimate and all 9
# are spared by requiring containment. HONEST GAP (WISH, R7): a duplicate whose two
# takes each add bytes the other lacks -- neither contained -- escapes this gate.
# None exists today; if one ever ships, TIGHTEN with the measurement, do not guess a
# threshold now (a % floor picked without evidence would red-board those 9).
#
# WHY STRING CONTAINMENT, NOT SPAN ARITHMETIC: both were measured over the sealed corpus and
# agreed exactly -- same pairs, zero divergence, every verbatim sitting at its stated
# char_offset. String containment wins because it is anchored on the claim's
# OWN bytes -- if a resnap ever drifted an offset, span arithmetic would quietly stop
# firing, and a gate that goes silent when the data gets WORSE is the failure mode
# this board keeps re-learning.
#
# TWO REJECTED DESIGNS, recorded so they are not re-proposed:
#   * A BASELINE EXCEPTION. The obvious move is to park keep-both pairs in
#     .claude/invariant-baseline.json. They must NOT go there: that file is
#     INVARIANT-scoped (stop_round_close.py::_tolerated returns a set of invariant
#     NAMES), so one entry tolerates EVERY duplicate this gate will ever find -- it
#     would ship the gate pre-neutered. Same trap already proven for dose_amount_in_verbatim; see
#     the "NO BASELINE EXCEPTION" note above _DOSE_UNIT_SYN. Handled in-gate instead.
#   * "SPARE THE PAIR IF ONLY ONE IS OPERATIONALLY MAPPED." Tempting, because in BOTH
#     approved pairs exactly one member carries `essentials`. Rejected: it is an n=2
#     generalization, and the next same-batch double emission that happens to map one
#     take would be spared silently. An ID allowlist fails CLOSED and each entry is a
#     deliberate, reviewable act.
#
# Truth anchor: the sealed claim verbatims x search-enrichment subject/facet,
# recomputed each run. Structural, not external -- it proves no two claims are
# REDUNDANT, never that any claim is RIGHT.

# Pairs that trip the signature and are nonetheless correct. Each entry is a claim
# about the WORLD (these two really do answer different reader questions), not a
# build fix -- see the `_SAME_SUBSTANCE_SLUGS` lesson earlier in this file:
# the one exemption this repo ever wrote into gate source was a fabrication that
# refuted itself in its own reason, and it sat green for weeks. Every
# entry states the two questions and is pinned in tools/tests/test_no_duplicate_claims.py.
# A pair here that STOPS firing is itself RED (see the stale check below): a
# carve-out that blesses nothing is a lie left in the source.
_DUPLICATE_KEEP_BOTH = {
    frozenset({"WAL-CLM-HELLS-000101", "WAL-CLM-HELLS-000102"}):
        "hypothyroidism/mechanism: one Wallach thyroid passage answering two different reader "
        "questions -- 000101 'Can crash dieting or cutting carbs slow down your thyroid?' "
        "(diet->thyroid hormone) and 000102 'Why does an underactive thyroid make you feel "
        "cold?' (thyroid-as-thermostat, a sub-span). Both search-only. Ruled keep-both: "
        "two different reader questions on a shared span.",
    frozenset({"WAL-CLM-DDDL-000071", "WAL-CLM-DDDL-000137"}):
        "selenium / physiology, the same 155-char preconception-selenium sentence, quoted twice to "
        "answer two different questions: -000071 'Can selenium prevent muscular dystrophy?' "
        "(essentials=[selenium], conditions=[muscular_dystrophy, keshan_disease]) and -000137 "
        "'Does selenium affect fertility and pregnancy?' (no operational mapping; its summary is "
        "the sterility / miscarriage / low-birth-weight / SIDS reproductive answer). Ruled "
        "keep-both -- recorded in commit b3551834.",
    frozenset({"WAL-CLM-IMMORT-000135", "WAL-CLM-IMMORT-000389"}):
        "gallium / uses, where -000389's 152-char British-research sentence is the tail of "
        "-000135's 391-char paragraph. -000135 answers 'Does gallium help protect against brain "
        "cancer?' -- the whole essentiality-plus-metalloenzyme case (essentials=[gallium], "
        "conditions=[brain_cancer]); -000389 answers the narrower 'Can taking gallium during "
        "pregnancy lower a child's risk of brain cancer?' (conditions=[brain_cancer], no "
        "essentials). Ruled keep-both -- recorded in commit b3551834.",
    frozenset({"WAL-CLM-DDDL-000092", "WAL-CLM-DDDL-000517"}):
        "menopause/protocol: one Wallach passage that answers two different reader questions -- A asks 'Should women take estrogen supplements for menopause?'; B asks 'How much calcium and magnesium should you take during menopause?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000115", "WAL-CLM-DDDL-000427"}):
        "omega-3/protocol: one Wallach passage that answers two different reader questions -- A asks 'How much omega-3 or essential fatty acids should I take per day?'; B asks 'How much essential fatty acid should you take for rosacea?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000168", "WAL-CLM-DDDL-000436"}):
        "vitamin-a/protocol: one Wallach passage that answers two different reader questions -- A asks 'How does Wallach treat acne with vitamin A?'; B asks 'Does vitamin A help clear up rosacea?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000337", "WAL-CLM-DDDL-000430"}):
        "rosacea/protocol: one Wallach passage that answers two different reader questions -- A asks \"What is Wallach's full treatment for acne rosacea?\"; B asks 'Is rosacea connected to poor digestion?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000337", "WAL-CLM-DDDL-000440"}):
        "rosacea/protocol: one Wallach passage that answers two different reader questions -- A asks \"What is Wallach's full treatment for acne rosacea?\"; B asks 'Does sunlight or UV light help rosacea?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000354", "WAL-CLM-DDDL-000434"}):
        "cataracts/protocol: one Wallach passage that answers two different reader questions -- A asks 'How do you treat cataracts caused by diabetes?'; B asks 'What does Wallach recommend for cataracts?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000356", "WAL-CLM-DDDL-000450"}):
        "hypertension/mechanism: one Wallach passage that answers two different reader questions -- A asks 'Can food allergies cause high blood pressure?'; B asks 'What causes high blood pressure according to Wallach?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000356", "WAL-CLM-DDDL-000451"}):
        "hypertension/mechanism: one Wallach passage that answers two different reader questions -- A asks 'Can food allergies cause high blood pressure?'; B asks 'Why do high blood pressure, arthritis, and kidney stones so often go together?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000357", "WAL-CLM-DDDL-000452"}):
        "peptic_ulcers/protocol: one Wallach passage that answers two different reader questions -- A asks 'Can a peptic ulcer be cured for good?'; B asks 'What does Wallach recommend for peptic or stomach ulcers?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000385", "WAL-CLM-DDDL-000448"}):
        "irritable_bowel_syndrome/protocol: one Wallach passage that answers two different reader questions -- A asks 'What should I eat for IBS?'; B asks 'Should I take digestive enzymes for IBS?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000385", "WAL-CLM-DDDL-000474"}):
        "irritable_bowel_syndrome/protocol: one Wallach passage that answers two different reader questions -- A asks 'What should I eat for IBS?'; B asks 'What foods should I avoid with IBS?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000394", "WAL-CLM-DDDL-000459"}):
        "alopecia/protocol: one Wallach passage that answers two different reader questions -- A asks 'Why does Wallach recommend digestive enzymes for hair loss?'; B asks 'Can cutting out wheat and dairy help with hair loss?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000397", "WAL-CLM-DDDL-000463"}):
        "hypertension/protocol: one Wallach passage that answers two different reader questions -- A asks 'Can losing weight lower my blood pressure?'; B asks 'Does flaxseed oil help with high blood pressure?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000397", "WAL-CLM-DDDL-000471"}):
        "hypertension/protocol: one Wallach passage that answers two different reader questions -- A asks 'Can losing weight lower my blood pressure?'; B asks 'Does CoQ10 help lower blood pressure?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000397", "WAL-CLM-DDDL-000476"}):
        "hypertension/protocol: one Wallach passage that answers two different reader questions -- A asks 'Can losing weight lower my blood pressure?'; B asks 'How does Wallach treat high blood pressure?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000397", "WAL-CLM-DDDL-000477"}):
        "hypertension/protocol: one Wallach passage that answers two different reader questions -- A asks 'Can losing weight lower my blood pressure?'; B asks 'What herbs does Wallach recommend for high blood pressure?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000397", "WAL-CLM-DDDL-000478"}):
        "hypertension/protocol: one Wallach passage that answers two different reader questions -- A asks 'Can losing weight lower my blood pressure?'; B asks 'What foods should I eat or avoid to lower blood pressure?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000397", "WAL-CLM-DDDL-000483"}):
        "hypertension/protocol: one Wallach passage that answers two different reader questions -- A asks 'Can losing weight lower my blood pressure?'; B asks 'How does Dr. Wallach say to lower high blood pressure naturally?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000406", "WAL-CLM-DDDL-000465"}):
        "tinnitus/protocol: one Wallach passage that answers two different reader questions -- A asks 'Do essential fatty acids or fish and flax oils help tinnitus?'; B asks 'Does zinc help tinnitus?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000406", "WAL-CLM-DDDL-000466"}):
        "tinnitus/protocol: one Wallach passage that answers two different reader questions -- A asks 'Do essential fatty acids or fish and flax oils help tinnitus?'; B asks 'Can poor digestion cause tinnitus, and do digestive enzymes help?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000408", "WAL-CLM-DDDL-000481"}):
        "uterine_fibroids/protocol: one Wallach passage that answers two different reader questions -- A asks 'How does Dr. Wallach treat uterine fibroids?'; B asks 'What foods should I avoid with uterine fibroids?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000408", "WAL-CLM-DDDL-000488"}):
        "uterine_fibroids/protocol: one Wallach passage that answers two different reader questions -- A asks 'How does Dr. Wallach treat uterine fibroids?'; B asks 'Can I shrink uterine fibroids without a hysterectomy?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000411", "WAL-CLM-DDDL-000485"}):
        "tinnitus/mechanism: one Wallach passage that answers two different reader questions -- A asks 'Can food allergies cause tinnitus?'; B asks 'Can heavy metals like lead or mercury cause tinnitus?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000415", "WAL-CLM-DDDL-000458"}):
        "uterine_fibroids/mechanism: one Wallach passage that answers two different reader questions -- A asks 'What causes uterine fibroids?'; B asks 'Are uterine fibroids related to fibrocystic breast disease?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000421", "WAL-CLM-DDDL-000467"}):
        "chronic_fatigue/protocol: one Wallach passage that answers two different reader questions -- A asks \"What foods should I avoid if I'm always tired?\"; B asks 'What does Wallach recommend for chronic fatigue?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000428", "WAL-CLM-DDDL-000429"}):
        "rosacea/mechanism: one Wallach passage that answers two different reader questions -- A asks 'What causes acne rosacea?'; B asks 'Can food allergies make rosacea worse?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000428", "WAL-CLM-DDDL-000444"}):
        "rosacea/mechanism: one Wallach passage that answers two different reader questions -- A asks 'What causes acne rosacea?'; B asks 'Can hormones or menopause trigger rosacea?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000429", "WAL-CLM-DDDL-000444"}):
        "rosacea/mechanism: one Wallach passage that answers two different reader questions -- A asks 'Can food allergies make rosacea worse?'; B asks 'Can hormones or menopause trigger rosacea?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000430", "WAL-CLM-DDDL-000440"}):
        "rosacea/protocol: one Wallach passage that answers two different reader questions -- A asks 'Is rosacea connected to poor digestion?'; B asks 'Does sunlight or UV light help rosacea?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000431", "WAL-CLM-DDDL-000432"}):
        "benign_prostatic_hyperplasia/uses: one Wallach passage that answers two different reader questions -- A asks 'Does saw palmetto help an enlarged prostate?'; B asks 'Is cranberry juice good for an enlarged prostate?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000431", "WAL-CLM-DDDL-000495"}):
        "benign_prostatic_hyperplasia/uses: one Wallach passage that answers two different reader questions -- A asks 'Does saw palmetto help an enlarged prostate?'; B asks 'Does vitamin C help an enlarged prostate?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000431", "WAL-CLM-DDDL-000498"}):
        "benign_prostatic_hyperplasia/uses: one Wallach passage that answers two different reader questions -- A asks 'Does saw palmetto help an enlarged prostate?'; B asks 'How much selenium should a man take for prostate health?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000431", "WAL-CLM-DDDL-000501"}):
        "benign_prostatic_hyperplasia/uses: one Wallach passage that answers two different reader questions -- A asks 'Does saw palmetto help an enlarged prostate?'; B asks 'Which amino acids does Wallach use for an enlarged prostate?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000432", "WAL-CLM-DDDL-000495"}):
        "benign_prostatic_hyperplasia/uses: one Wallach passage that answers two different reader questions -- A asks 'Is cranberry juice good for an enlarged prostate?'; B asks 'Does vitamin C help an enlarged prostate?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000432", "WAL-CLM-DDDL-000498"}):
        "benign_prostatic_hyperplasia/uses: one Wallach passage that answers two different reader questions -- A asks 'Is cranberry juice good for an enlarged prostate?'; B asks 'How much selenium should a man take for prostate health?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000432", "WAL-CLM-DDDL-000501"}):
        "benign_prostatic_hyperplasia/uses: one Wallach passage that answers two different reader questions -- A asks 'Is cranberry juice good for an enlarged prostate?'; B asks 'Which amino acids does Wallach use for an enlarged prostate?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000445", "WAL-CLM-DDDL-000523"}):
        "joint_pain/protocol: one Wallach passage that answers two different reader questions -- A asks 'What does Wallach recommend for joint pain?'; B asks 'What supplements help rebuild worn spinal joints and cartilage?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000448", "WAL-CLM-DDDL-000474"}):
        "irritable_bowel_syndrome/protocol: one Wallach passage that answers two different reader questions -- A asks 'Should I take digestive enzymes for IBS?'; B asks 'What foods should I avoid with IBS?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000449", "WAL-CLM-DDDL-000516"}):
        "menopause/physiology: one Wallach passage that answers two different reader questions -- A asks 'Does menopause cause vaginal dryness and bladder problems?'; B asks 'What are the symptoms of menopause?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000450", "WAL-CLM-DDDL-000451"}):
        "hypertension/mechanism: one Wallach passage that answers two different reader questions -- A asks 'What causes high blood pressure according to Wallach?'; B asks 'Why do high blood pressure, arthritis, and kidney stones so often go together?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000460", "WAL-CLM-DDDL-000461"}):
        "vertigo/protocol: one Wallach passage that answers two different reader questions -- A asks \"What does Wallach recommend for Wallach's Vertigo?\"; B asks \"How do you treat Wallach's vertigo naturally?\". Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000463", "WAL-CLM-DDDL-000471"}):
        "hypertension/protocol: one Wallach passage that answers two different reader questions -- A asks 'Does flaxseed oil help with high blood pressure?'; B asks 'Does CoQ10 help lower blood pressure?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000463", "WAL-CLM-DDDL-000477"}):
        "hypertension/protocol: one Wallach passage that answers two different reader questions -- A asks 'Does flaxseed oil help with high blood pressure?'; B asks 'What herbs does Wallach recommend for high blood pressure?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000463", "WAL-CLM-DDDL-000478"}):
        "hypertension/protocol: one Wallach passage that answers two different reader questions -- A asks 'Does flaxseed oil help with high blood pressure?'; B asks 'What foods should I eat or avoid to lower blood pressure?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000463", "WAL-CLM-DDDL-000483"}):
        "hypertension/protocol: one Wallach passage that answers two different reader questions -- A asks 'Does flaxseed oil help with high blood pressure?'; B asks 'How does Dr. Wallach say to lower high blood pressure naturally?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000465", "WAL-CLM-DDDL-000466"}):
        "tinnitus/protocol: one Wallach passage that answers two different reader questions -- A asks 'Does zinc help tinnitus?'; B asks 'Can poor digestion cause tinnitus, and do digestive enzymes help?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000471", "WAL-CLM-DDDL-000477"}):
        "hypertension/protocol: one Wallach passage that answers two different reader questions -- A asks 'Does CoQ10 help lower blood pressure?'; B asks 'What herbs does Wallach recommend for high blood pressure?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000471", "WAL-CLM-DDDL-000478"}):
        "hypertension/protocol: one Wallach passage that answers two different reader questions -- A asks 'Does CoQ10 help lower blood pressure?'; B asks 'What foods should I eat or avoid to lower blood pressure?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000471", "WAL-CLM-DDDL-000483"}):
        "hypertension/protocol: one Wallach passage that answers two different reader questions -- A asks 'Does CoQ10 help lower blood pressure?'; B asks 'How does Dr. Wallach say to lower high blood pressure naturally?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000476", "WAL-CLM-DDDL-000483"}):
        "hypertension/protocol: one Wallach passage that answers two different reader questions -- A asks 'How does Wallach treat high blood pressure?'; B asks 'How does Dr. Wallach say to lower high blood pressure naturally?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000477", "WAL-CLM-DDDL-000478"}):
        "hypertension/protocol: one Wallach passage that answers two different reader questions -- A asks 'What herbs does Wallach recommend for high blood pressure?'; B asks 'What foods should I eat or avoid to lower blood pressure?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000477", "WAL-CLM-DDDL-000483"}):
        "hypertension/protocol: one Wallach passage that answers two different reader questions -- A asks 'What herbs does Wallach recommend for high blood pressure?'; B asks 'How does Dr. Wallach say to lower high blood pressure naturally?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000478", "WAL-CLM-DDDL-000483"}):
        "hypertension/protocol: one Wallach passage that answers two different reader questions -- A asks 'What foods should I eat or avoid to lower blood pressure?'; B asks 'How does Dr. Wallach say to lower high blood pressure naturally?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000481", "WAL-CLM-DDDL-000488"}):
        "uterine_fibroids/protocol: one Wallach passage that answers two different reader questions -- A asks 'What foods should I avoid with uterine fibroids?'; B asks 'Can I shrink uterine fibroids without a hysterectomy?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000482", "WAL-CLM-DDDL-000559"}):
        "eczema/protocol: one Wallach passage that answers two different reader questions -- A asks 'Can folic acid help eczema?'; B asks 'Does zinc help eczema?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000490", "WAL-CLM-DDDL-000492"}):
        "endometriosis/uses: one Wallach passage that answers two different reader questions -- A asks 'What herbs are recommended for endometriosis discomfort?'; B asks 'Can natural progesterone help with endometriosis?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000490", "WAL-CLM-DDDL-000577"}):
        "endometriosis/uses: one Wallach passage that answers two different reader questions -- A asks 'What herbs are recommended for endometriosis discomfort?'; B asks 'How can severe endometriosis growths be removed?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000492", "WAL-CLM-DDDL-000577"}):
        "endometriosis/uses: one Wallach passage that answers two different reader questions -- A asks 'Can natural progesterone help with endometriosis?'; B asks 'How can severe endometriosis growths be removed?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000494", "WAL-CLM-DDDL-000578"}):
        "endometriosis/mechanism: one Wallach passage that answers two different reader questions -- A asks 'How does endometrial tissue end up outside the uterus?'; B asks 'Which organs can endometriosis affect?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000494", "WAL-CLM-DDDL-000581"}):
        "endometriosis/mechanism: one Wallach passage that answers two different reader questions -- A asks 'How does endometrial tissue end up outside the uterus?'; B asks 'What causes endometriosis?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000495", "WAL-CLM-DDDL-000498"}):
        "benign_prostatic_hyperplasia/uses: one Wallach passage that answers two different reader questions -- A asks 'Does vitamin C help an enlarged prostate?'; B asks 'How much selenium should a man take for prostate health?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000495", "WAL-CLM-DDDL-000501"}):
        "benign_prostatic_hyperplasia/uses: one Wallach passage that answers two different reader questions -- A asks 'Does vitamin C help an enlarged prostate?'; B asks 'Which amino acids does Wallach use for an enlarged prostate?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000498", "WAL-CLM-DDDL-000501"}):
        "benign_prostatic_hyperplasia/uses: one Wallach passage that answers two different reader questions -- A asks 'How much selenium should a man take for prostate health?'; B asks 'Which amino acids does Wallach use for an enlarged prostate?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000529", "WAL-CLM-DDDL-000571"}):
        "erectile_dysfunction/protocol: one Wallach passage that answers two different reader questions -- A asks 'Are there self-help or sex-therapy techniques for erectile dysfunction you can do at home?'; B asks 'Do minerals or supplements actually help with impotence?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000531", "WAL-CLM-DDDL-000562"}):
        "allergies/protocol: one Wallach passage that answers two different reader questions -- A asks 'Do vitamin C and bioflavonoids help with allergies?'; B asks 'Can fixing my digestion help with allergies?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000532", "WAL-CLM-DDDL-000548"}):
        "eczema/protocol: one Wallach passage that answers two different reader questions -- A asks 'Does vitamin A help eczema?'; B asks 'Do digestive enzymes help eczema?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000532", "WAL-CLM-DDDL-000563"}):
        "eczema/protocol: one Wallach passage that answers two different reader questions -- A asks 'Does vitamin A help eczema?'; B asks 'How do I find out which foods trigger my eczema?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000548", "WAL-CLM-DDDL-000563"}):
        "eczema/protocol: one Wallach passage that answers two different reader questions -- A asks 'Do digestive enzymes help eczema?'; B asks 'How do I find out which foods trigger my eczema?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000578", "WAL-CLM-DDDL-000581"}):
        "endometriosis/mechanism: one Wallach passage that answers two different reader questions -- A asks 'Which organs can endometriosis affect?'; B asks 'What causes endometriosis?'. Ruled keep-both: two different reader questions on a shared span, resnapped so each names its condition.",
    frozenset({"WAL-CLM-DDDL-000585", "WAL-CLM-DDDL-000387"}):
        "psoriasis/protocol: one Wallach psoriasis-protocol span answering two different reader questions -- A (dose facet) asks 'Does lecithin help psoriasis?'; B asks 'Which minerals help psoriasis?'. The lecithin facet routes on the condition because 'lecithin' is not a registered search subject. Ruled keep-both: two different reader questions on a shared span.",
    frozenset({"WAL-CLM-DDDL-000589", "WAL-CLM-DDDL-000497"}):
        "constipation/protocol: one Wallach constipation-protocol span answering two different reader questions -- A (dose facet) asks 'How much fiber should you take for constipation?'; B asks 'What are natural herbal laxatives for constipation?'. The fiber facet routes on the condition because 'dietary-fiber' is not a registered search subject. Ruled keep-both: two different reader questions on a shared span.",
    frozenset({"WAL-CLM-DDDL-000595", "WAL-CLM-DDDL-000522"}):
        "gallstones/protocol: one Wallach gallbladder-protocol span answering two different reader questions -- A (dose facet) asks 'Does lecithin help with gallstones?'; B asks 'Which herbs are good for the gallbladder?'. The lecithin facet routes on the condition because 'lecithin' is not a registered search subject. Ruled keep-both: two different reader questions on a shared span.",
    frozenset({"WAL-CLM-EPIGEN-000484", "WAL-CLM-EPIGEN-000479"}):
        "menopause/history: one Wallach Lydia-Pinkham passage answering two different reader questions -- A (000479) asks \"What was Lydia Pinkham's herbal remedy for women's complaints?\"; B (000484) asks 'What did women use for menopause before modern medicine?'. B carries a distinct claim_text (the pre-modern-practice framing) on the shared full-paragraph span; both route to menopause/history. Ruled keep-both, reviewed and approved.",
}


def _no_duplicate_claims_impl(claims, enrichment, approved=None):
    """The duplicate-claim signature, driven by data so a negative test can plant the real
    2026-08-03 vitamin-A pair and prove this REDDENS on it. See the block comment above for the
    defect, the two mechanisms, and the two rejected designs. `approved` defaults to the shipped
    keep-both allowlist; a test passes {} to see the raw signature."""
    approved = _DUPLICATE_KEEP_BOTH if approved is None else approved

    # Bucket on exactly what makes a duplicate visible: one book, one entity page
    # (subject), one section of it (facet). Claims with no enrichment bucket under
    # (None, None) together -- fail-closed, and measured to be 0 pairs today.
    buckets, n_scanned, books = {}, 0, set()
    for c in claims:
        loc = c.get("locator") or {}
        book, verbatim = loc.get("book"), c.get("verbatim") or ""
        if not book or not verbatim:
            continue
        n_scanned += 1
        books.add(book)
        e = enrichment.get(c.get("id")) or {}
        buckets.setdefault((book, e.get("subject"), e.get("facet")), []).append(c)

    viol, seen_approved = [], set()
    for key in sorted(buckets, key=lambda k: (k[0], str(k[1]), str(k[2]))):
        group = sorted(buckets[key], key=lambda c: c.get("id") or "")
        if len(group) < 2:
            continue
        book, subject, facet = key
        for i in range(len(group)):
            for j in range(i + 1, len(group)):
                ca, cb = group[i], group[j]
                va, vb = ca["verbatim"], cb["verbatim"]
                if va not in vb and vb not in va:
                    continue
                pair = frozenset((ca.get("id"), cb.get("id")))
                if pair in approved:
                    seen_approved.add(pair)
                    continue
                short, long = (ca, cb) if len(va) <= len(vb) else (cb, ca)
                viol.append(
                    f"{short.get('id')} + {long.get('id')} [{book} / subject={subject!r} / "
                    f"facet={facet!r}]: the {len(short['verbatim'])}-char verbatim is contained in "
                    f"the {len(long['verbatim'])}-char one -- two cards, one span, one page section")

    # An exception that no longer fires is a lie left in the source (R9). Deleting the
    # claim, re-mapping its subject, or merging the pair all land here, and all of them
    # mean the carve-out must go in the SAME patch that made it stale.
    stale = sorted(" + ".join(sorted(p)) for p in approved if p not in seen_approved)

    if viol or stale:
        parts = []
        if viol:
            parts.append("duplicate claim pair(s) -- one span answering one question twice, which "
                         "renders as twin cards on an entity page: " + "; ".join(viol[:6])
                         + (f" ... (+{len(viol) - 6} more)" if len(viol) > 6 else ""))
        if stale:
            parts.append("stale keep-both exception(s) in _DUPLICATE_KEEP_BOTH -- no longer match "
                         "the signature, so they now bless nothing and must be DELETED in the same "
                         "patch that made them stale (R9): " + "; ".join(stale))
        return False, " || ".join(parts)

    return True, (f"no duplicate claim pair across {n_scanned} claim(s) / {len(books)} book(s) "
                  f"(signature: same book + verbatim containment + same subject + same facet); "
                  f"{len(approved)} pair(s) ruled keep-both are allowlisted in-gate, each with a "
                  f"stated reason + a pinned test, and each still firing")


def check_no_duplicate_claims():
    """One source per fact -- see the block comment above _DUPLICATE_KEEP_BOTH for
    the 2026-08-03 vitamin-A twin-card defect this was written for, the two duplication mechanisms,
    why containment alone is NOT the signature, and the two designs that were rejected. Thin
    path-binding shell over the impl so the negative test can drive the same logic with the real
    duplicate pair planted back in."""
    claims_dir = ROOT / "eden" / "corpus" / "claims"
    if not claims_dir.exists():
        return True, "eden/corpus/claims missing (bootstrap-guard)"
    claims = []
    for shard in sorted(claims_dir.glob("claims-*.json")):
        claims.extend(json.loads(shard.read_text(encoding="utf-8")).get("claims", []))
    enr_p = ROOT / "eden" / "corpus" / "search-enrichment.json"
    enrichment = {}
    if enr_p.exists():
        enrichment = json.loads(enr_p.read_text(encoding="utf-8")).get("enrichment", {})
    return _no_duplicate_claims_impl(claims, enrichment)


# ---------------------------------------------------------------------------
# search_no_twin_questions -- one PAGE, one question (the CROSS-BOOK twin)
# ---------------------------------------------------------------------------
# THE DEFECT, in full, because the last twin-card gate was written too NARROW and
# the same class walked back onto the screen days later:
#   After a full duplicate review had run to a green board, a reader opened the
#   Vitamin D entity page and it STILL had twins: "Can too much vitamin D be dangerous?" beside "Can too much vitamin D
#   be harmful?", and "What are the symptoms of vitamin D deficiency?" beside "What
#   are the signs of vitamin D deficiency?". Two clusters, one page, green board.
#
# WHY no_duplicate_claims COULD NOT SEE IT -- its signature is
#   same book . verbatim CONTAINMENT . same subject . same facet.
# These twins break THREE of those four: they are CROSS-BOOK (dddl vs lets;
# epigenetics vs lets), their verbatims do NOT contain each other (different book
# tables list different signs -- answer-overlap measured as low as 0.04), and they
# often sit under different facets. That gate catches ONE extraction emitting a
# truncated + full take of ONE span. It was never built to catch the same TEACHING
# mined from several books, each given its own hand-authored question that differs
# only by a synonym (signs<->symptoms, dangerous<->harmful). This gate is that
# missing sibling.
#
# WHERE THE DUPLICATION LIVES -- NOT in the claims. Two "signs of X deficiency"
# claims from two books are legitimately different records, both true to their
# source, and the claim-level review correctly left them alone. The duplication is in
# the QUESTION the app mints per claim in search-enrichment.json: two claims -> two
# cards -> two near-identical questions on ONE page. So the gate reads the AUTHORED
# questions, grouped by the page they render on (enrichment subject).
#
# THE SIGNATURE -- deterministic, NO similarity threshold (the same discipline the
# no_duplicate_claims block records: a % floor picked without evidence red-boards
# legitimate neighbours). Two cards on one subject are twins IFF their questions
# reduce to the SAME token set after: lowercasing, dropping pure function words,
# dropping the subject's own name tokens, and folding a SMALL, EXPLICIT synonym set
# measured from the real corpus (signs=symptoms, dangerous=harmful=toxic,
# deficiency=low=lack, disease=disorder, cause=caused). Fold-EQUALITY, not fuzzy
# distance. When the signature was measured across the authored question set, every
# fold-equal pair it found was a real twin -- which is why the allowlist below is EMPTY
# by design. Only 'does'/'did' are dropped, NOT 'do': keeping 'do' as a content word
# means "what IS X" (definition) and "what does X DO" (function) reduce to DIFFERENT
# signatures, so the one shape that first looked like a false positive
# (negative_ion_therapy) is not one, and no carve-out is needed to spare it.
#
# HONEST GAP (WISH, R7): a twin whose two questions differ by MORE than a synonym
# (e.g. "what does deficiency do to your bones?" vs "what are the signs of
# deficiency?" -- a bone-specific take vs the general one, or a COMPOUND question
# like "what does X do, and what are the signs of low X?") is NOT fold-equal and
# escapes this gate. Those need a human ruling (merge vs keep-as-distinct-subquery)
# a machine cannot make without guessing a threshold. Roughly a hundred such
# borderline pairs exist and are handled by review; if a hard, recurring
# shape emerges, TIGHTEN with that evidence -- do not guess a floor now. also_about
# cross-page collisions are likewise out of v1 scope; subject-primary only.
#
# NO BASELINE EXCEPTION: like no_duplicate_claims, any future keep-both pair lives in
# the in-gate allowlist below with a stated reason + a pinned test, NEVER in
# .claude/invariant-baseline.json (that file is invariant-scoped -- one entry would
# tolerate every twin this gate will ever find). A carve-out that stops firing is
# itself RED (R9).
#
# Truth anchor: the hand-authored questions in search-enrichment.json x their
# subject, normalized + fold-compared each run. Structural -- proves no two cards on
# a page ASK THE SAME THING, never that any answer is RIGHT.

_TWIN_QUESTION_STOP = frozenset(
    "a an the is are was were be been being am does did of to in on at for and or "
    "with as by it its this that your you my our their his her i we they he she s t re ll about".split())

_TWIN_QUESTION_FOLD = {}
for _twin_bucket, _twin_words in [
    ("SIGN", "sign signs symptom symptoms"),
    ("TOX", "dangerous harmful toxic toxicity toxicities poisonous unsafe hazardous"),
    ("DEF", "deficiency deficient deficiencies low lack lacking shortage deficit"),
    ("DISEASE", "disease diseases disorder disorders"),
    ("CAUSE", "cause caused causes causing"),
]:
    for _twin_w in _twin_words.split():
        _TWIN_QUESTION_FOLD[_twin_w] = _twin_bucket

# Pairs that fold-equal and are nonetheless CORRECT -- each really asks a different
# reader question. EMPTY today: the 19 fold-equal pairs measured 2026-08-07 are all
# real twins, and the one shape that first looked distinct (negative_ion_therapy
# 'what IS it' vs 'what does it DO') is separated by the normalizer itself (it keeps
# 'do'), not by a carve-out. When a real false positive first appears, add it here
# with a stated reason + a pinned test (same rules as _DUPLICATE_KEEP_BOTH), NEVER in
# the baseline. A pair here that STOPS firing is RED (stale carve-out, R9).
_TWIN_QUESTION_KEEP_BOTH = {}


def _twin_question_sig(question, subject):
    """Deterministic token signature of an authored question, scoped to its page. Lowercase, strip
    punctuation, drop function words + the subject's own name tokens, fold the explicit synonym set.
    Two questions on one subject are twins IFF their signatures are EQUAL (no fuzzy threshold)."""
    q = re.sub(r"[^a-z0-9\s]", " ", (question or "").lower())
    subtok = set(re.sub(r"[^a-z0-9\s]", " ", (subject or "").replace("-", " ").lower()).split())
    out = set()
    for w in q.split():
        if w in _TWIN_QUESTION_STOP or w in subtok:
            continue
        out.add(_TWIN_QUESTION_FOLD.get(w, w))
    return frozenset(out)


def _search_no_twin_questions_impl(enrichment, approved=None):
    """Fold-equal question pairs within one subject -- the cross-book twin-card class the 2026-08-07
    vitamin-D page still showed. Data-driven so the negative test can pass approved={} and prove this
    REDDENS on the real vitamin-D signs/symptoms pair. See the block comment above for the defect, why
    no_duplicate_claims was blind to it, and why fold-equality (not fuzzy distance) is the signature."""
    approved = _TWIN_QUESTION_KEEP_BOTH if approved is None else approved

    bysub, n = {}, 0
    for cid, e in enrichment.items():
        e = e or {}
        q, sub = e.get("question"), e.get("subject")
        if not q or not sub:
            continue
        n += 1
        bysub.setdefault(sub, []).append((cid, _twin_question_sig(q, sub), q, e.get("facet")))

    viol, seen_approved = [], set()
    for sub in sorted(bysub):
        group = sorted(bysub[sub], key=lambda t: t[0])
        for i in range(len(group)):
            for j in range(i + 1, len(group)):
                (ia, sa, qa, fa), (ib, sb, qb, fb) = group[i], group[j]
                if sa != sb:
                    continue
                pair = frozenset((ia, ib))
                if pair in approved:
                    seen_approved.add(pair)
                    continue
                viol.append(f"{ia} + {ib} [subject={sub!r}]: {qa!r} <{fa}> == {qb!r} <{fb}> "
                            f"(fold-equal question -> twin cards on one page)")

    stale = sorted(" + ".join(sorted(p)) for p in approved if p not in seen_approved)
    if viol or stale:
        parts = []
        if viol:
            parts.append(f"{len(viol)} twin-question pair(s) -- two cards ask the same question on one "
                         "entity page (cross-book synonym twins): " + "; ".join(viol[:6])
                         + (f" ... (+{len(viol) - 6} more)" if len(viol) > 6 else ""))
        if stale:
            parts.append("stale keep-both exception(s) in _TWIN_QUESTION_KEEP_BOTH -- no longer fold-equal, "
                         "so they bless nothing and must be DELETED in the same patch that made them stale "
                         "(R9): " + "; ".join(stale))
        return False, " || ".join(parts)

    return True, (f"no twin-question pair across {n} authored question(s) / {len(bysub)} subject(s) "
                  f"(signature: same subject + fold-equal question; synonyms folded signs=symptoms / "
                  f"dangerous=harmful / deficiency=low); {len(approved)} keep-both exception(s) "
                  f"allowlisted in-gate (empty today), each with a reason + a pinned test and still firing")


def check_search_no_twin_questions():
    """One source per fact -- the CROSS-BOOK sibling of no_duplicate_claims. See the
    block comment above _TWIN_QUESTION_KEEP_BOTH for the 2026-08-07 vitamin-D twin the same-book gate
    could not see, and why fold-equality is the signature. Thin path-binding shell over the impl so
    tools/tests/test_search_no_twin_questions.py can drive the logic with the real twin planted back in."""
    enr_p = ROOT / "eden" / "corpus" / "search-enrichment.json"
    if not enr_p.exists():
        return True, "eden/corpus/search-enrichment.json missing (bootstrap-guard)"
    enrichment = json.loads(enr_p.read_text(encoding="utf-8")).get("enrichment", {})
    return _search_no_twin_questions_impl(enrichment)


def check_no_hand_duplicated_canonical():
    """No canonical value is hand-written twice; the pillar is the single hand-edited
    home, and derived copies are proven fresh (derived_artifacts_fresh IS R3's 'derived copies only'
    clause). LIVE teeth: the 90/91 canonical essential display_names live ONLY in essentials-canon.json
    among HAND-EDITED files -- no other hand-edited pillar file (catalog conditions/symptoms) may
    re-store one as a field value. This is exactly the duplication a since-deleted nutrient registry
    committed (every canon name re-copied by hand); the gate makes re-introducing that class RED.
    Generated artifacts are EXEMPT -- a display_name in corpus-embed is a DERIVED copy gated fresh by
    derived_artifacts_fresh. Truth-anchored on essentials-canon x the other hand-edited pillar files,
    KNOWN SCOPE LIMIT: it covers the canon's display names, not every identity field in every
    pillar; widening it to the Products pillar is a labeled WISH, not something this gate does."""
    canon_p = ROOT / "eden" / "corpus" / "essentials-canon.json"
    if not canon_p.exists():
        return True, "essentials-canon.json missing (bootstrap-guard)"
    names = {e["display_name"] for e in json.loads(canon_p.read_text(encoding="utf-8"))["essentials"]}
    others = [ROOT / "eden" / "catalog" / "conditions.json",
              ROOT / "eden" / "catalog" / "symptoms.json"]
    viol = []
    for p in others:
        if not p.exists():
            continue
        for key, val in _walk_strings(json.loads(p.read_text(encoding="utf-8"))):
            if val in names:
                viol.append(f"{p.name}: field '{key}' re-stores canonical essential name {val!r} "
                            f"(reference essentials-canon by slug, never re-type the name)")
    if viol:
        return False, ("canonical essential name hand-duplicated outside essentials-canon (R3): "
                       + "; ".join(viol[:6]) + (" ..." if len(viol) > 6 else ""))
    return True, (f"no canonical essential name ({len(names)}) hand-duplicated in another pillar file; "
                  f"essentials-canon is the single hand-edited home (derived copies exempt, gated by "
                  f"derived_artifacts_fresh)")


# ---------------------------------------------------------------------------
# Eden's WALL -- scanner_user_items_marked
# ---------------------------------------------------------------------------
# The scanner lets a user add ANY item to THEIR regimen, but a user/scanned item can
# NEVER masquerade as Wallach/Youngevity canonical, nor leak into a sealed pillar or a
# generated artifact. Three USER provenance tokens are the wall's subject; no non-user
# provenance is minted anywhere in code or data.
_USER_PROVENANCE = ("user_scanned", "user_manual", "wishlist_promoted")
_PROV_RE = re.compile(r"provenance:\s*['\"]([^'\"]+)['\"]")


def check_scanner_user_items_marked():
    """EDEN'S WALL. A user/scanner-added regimen item is MARKED
    user-provided (provenance) so it can never masquerade as canonical, and it never
    leaks into a sealed pillar or an operational artifact. Two clauses, both
    truth-anchored on committed bytes (recomputed each run):
      (A) FLAGGED -- RegimenItemSchema requires `provenance`, and every provenance
          LITERAL in the app source is a recognized USER token (user_scanned /
          user_manual / wishlist_promoted). No view/state code mints a regimen item
          marked as anything canonical.
      (B) CONTAINED -- no USER token appears in a sealed pillar (eden/corpus,
          eden/catalog) or an operational generated artifact (assets/data/*.json),
          proving a scanned/user item never got baked into canonical data. The
          append-only Creator's Log narrative (creators-log*) is EXCLUDED: it
          legitimately discusses these tokens as project history.
    Shipped with the wall it governs, and proven with a negative test: a user token
    injected into an artifact, or a masquerade provenance minted in code, must RED."""
    viol = []

    # (A1) the schema still requires the provenance marker.
    schema_p = ROOT / "dashboard" / "assets" / "js" / "src" / "core" / "schemas" / "regimen.ts"
    if schema_p.exists() and not re.search(r"provenance:\s*z\.", schema_p.read_text(encoding="utf-8")):
        viol.append("RegimenItemSchema no longer requires `provenance` (the wall's marker field)")

    # (A2) every provenance literal minted in the app source is a USER token.
    src_root = ROOT / "dashboard" / "assets" / "js" / "src"
    if src_root.exists():
        for p in sorted(src_root.rglob("*.ts")):
            if p.name.endswith(".test.ts") or (p.name == "regimen.ts" and p.parent.name == "schemas"):
                continue  # tests + the schema file's token-listing doc-comment
            for m in _PROV_RE.finditer(p.read_text(encoding="utf-8")):
                if m.group(1) not in _USER_PROVENANCE:
                    viol.append(f"{p.relative_to(ROOT).as_posix()}: code mints a regimen item with "
                                f"non-user provenance '{m.group(1)}' -- views/state may only ADD user "
                                f"items; canonical items come from sealed data, never minted in a view")

    # (B) no USER token in a sealed pillar or an operational artifact.
    scan = []
    for d in (ROOT / "eden" / "corpus", ROOT / "eden" / "catalog"):
        if d.exists():
            scan += sorted(d.rglob("*.json"))
    data_dir = ROOT / "dashboard" / "assets" / "data"
    if data_dir.exists():
        scan += sorted(data_dir.glob("*.json"))
    for p in scan:
        rel = p.relative_to(ROOT).as_posix()
        if "creators-log" in rel:  # append-only project NARRATIVE, not operational data
            continue
        try:
            blob = p.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        hit = next((tok for tok in _USER_PROVENANCE if tok in blob), None)
        if hit is not None:
            viol.append(f"{rel}: carries USER-provenance token '{hit}' -- a user/scanned item leaked "
                        f"into canonical data (Eden's wall breach)")

    if viol:
        return False, ("Eden's wall breached (scanner_user_items_marked): " + "; ".join(viol[:6])
                       + (" ..." if len(viol) > 6 else ""))
    return True, ("Eden's wall holds -- RegimenItemSchema requires provenance, every code provenance "
                  f"literal is a user token {_USER_PROVENANCE}, and no user token appears in any pillar "
                  "or operational artifact (scanned/manual items stay user-provided, never canonical)")


def check_data_artifacts_accounted():
    """The manifest-COMPLETENESS gate.
    derived_artifacts_fresh proves the files LISTED in eden/derived/MANIFEST.json are fresh;
    it does NOT prove the list is COMPLETE. This closes that hole: every
    dashboard/assets/data/*.json must appear either in the manifest's `artifacts` (derived +
    freshness-gated) or in `accounted` (hand-authored / externally-gated, each entry carrying
    a disposition + reason). A data file in NEITHER list is RED -- the exact 'is the list
    complete?' hole the 2026-07-06 audit found (a silently hand-maintained artifact that drift
    could ship). A stale `accounted` entry whose file is gone, a file in BOTH lists, or an
    accounted entry missing its disposition/reason, is also RED. Truth-anchored on the on-disk
    glob x the manifest, recomputed each run."""
    import json as _json
    manifest_path = ROOT / "eden" / "derived" / "MANIFEST.json"
    data_dir = ROOT / "dashboard" / "assets" / "data"
    if not manifest_path.exists() or not data_dir.exists():
        return True, "manifest / assets-data not installed (bootstrap-guard)"
    try:
        manifest = _json.loads(manifest_path.read_text(encoding="utf-8"))
    except Exception as e:
        return False, f"MANIFEST.json is not valid JSON: {e}"
    derived = {e["artifact"] for e in manifest.get("artifacts", [])}
    accounted_entries = manifest.get("accounted", [])
    accounted = {e.get("file") for e in accounted_entries}
    on_disk = {p.relative_to(ROOT).as_posix() for p in data_dir.glob("*.json")}
    registered = derived | accounted
    unaccounted = sorted(on_disk - registered)
    both = sorted(derived & accounted)
    stale = sorted(f for f in accounted if f and not (ROOT / f).exists())
    missing_reason = [e.get("file", "?") for e in accounted_entries
                      if not (e.get("disposition") and e.get("reason"))]
    viol = []
    if unaccounted:
        viol.append("unaccounted data file(s) -- add to MANIFEST artifacts or accounted: "
                    + ", ".join(unaccounted))
    if both:
        viol.append("file(s) in BOTH artifacts and accounted: " + ", ".join(both))
    if stale:
        viol.append("accounted entry(ies) whose file is gone: " + ", ".join(stale))
    if missing_reason:
        viol.append("accounted entry(ies) missing disposition/reason: " + ", ".join(missing_reason))
    if viol:
        return False, "manifest incomplete (R1): " + "; ".join(viol)
    return True, (f"all {len(on_disk)} assets/data/*.json accounted -- {len(derived)} derived "
                  f"(freshness-gated) + {len(accounted)} hand-authored/externally-gated (each with a reason)")


def _charter_name_is_wished(name, status_cell):
    """Is THIS gate name honestly labeled a WISH? STATUS-cell only, clause-scoped, per-name.

    A WISH clause runs from a `WISH` marker to the next LIVE / PARTIAL / LANDED marker (or
    end of cell); the name must appear INSIDE such a clause. TWO loosenings were removed
    here on 2026-07-15 (R9: re-codify with proof, never loosen silently). Both were caught
    by tools/tests/test_charter_gates_present.py, which measures the gate rather than trusting it:

    (1) PER-ROW -> PER-NAME. The old test was `"WISH" in status_cell or "WISH" in gate_cell`,
        so ANY rule whose status prose merely MENTIONED the word excused EVERY gate name in
        its column. Measured: a planted fake gate was caught in 2 of 9 rules (22%) while the
        gate reported "all 9 Charter rules name real gates or are labeled WISH" -- a message
        that counted ROWS PARSED, not GATES CHECKED. R7's own gate committed the exact
        failure R7 exists to prevent.
    (2) STATUS-CELL ONLY. Scanning the GATE cell as well still let R7 through, because R7's
        own gate cell ENDS with the word WISH ("...neither exists nor is labeled WISH") -- a
        fake planted after it landed inside the clause. Status-only is the right semantics
        anyway: the STATUS column is where LIVE/PARTIAL/WISH live; the GATE column only
        NAMES gates. It costs nothing (0 gates are excused by that path today) and closes a
        seam where a rule could hide a fake gate behind trailing prose.

    Params are cells, not a file, so the negative test can drive planted rows.
    """
    marker = re.compile(r"\b(LIVE|PARTIAL|LANDED)\b")
    tok = re.compile(r"`" + re.escape(name) + r"`")
    for m in re.finditer(r"WISH", status_cell):
        tail = status_cell[m.end():]
        nxt = marker.search(tail)
        clause = tail[:nxt.start()] if nxt else tail
        if tok.search(clause):
            return True
    return False


def _charter_gates_present_impl(charter_text, live):
    """The meta-gate -- 'codify, don't promise': every gate the Charter presents
    as its proof must actually EXIST, or the rule must be labeled WISH.
    Parses the rule table in .claude/skills/charter/SKILL.md; for each
    backtick-quoted gate name in a rule's GATE column, that name must be (a) a live invariant
    here, (b) a known non-invariant enforcement mechanism (a verify tool / hook / lint rule),
    or (c) that GATE NAME must itself be marked WISH (an honestly-labeled promise).

    TIGHTENED once -- a misfiring gate is fixed by re-codifying, never by a silent
    loosening. The exemption used to be PER-ROW: `is_wish = "WISH" in status_cell or "WISH"
    in gate_cell`, so ANY rule whose status prose merely CONTAINED the word "WISH" had EVERY
    gate name in its column skipped from existence-checking. R2 was exempt not because it was
    unenforced but because its status says a gate "LANDED" and uses the word in passing.
    Measured by negative control: a planted fake gate name was caught in only 2 of the 9
    rules, 22%. The gate then reported "all 9 Charter rules name real gates or are
    labeled WISH", which READS as verification of 9 and WAS verification of 2. The meta-gate
    whose entire purpose is "the Charter can no longer oversell its own enforcement" was
    overselling its own enforcement by 350%. This is the exact failure mode R7 exists to
    prevent, committed by R7's own gate.

    Now the exemption is PER-NAME and clause-scoped: a gate name is excused only if it appears
    inside a WISH clause (the run of text from a `WISH` marker to the next LIVE / PARTIAL /
    LANDED marker), so a rule may honestly label ONE gate a wish while its siblings stay
    checked. The message now reports gates checked vs excused, not just rule rows parsed.

    NOT covered (WISH, not sold as guarded): SEMANTIC verification that a present gate actually
    ENFORCES its rule -- no non-gaming machine check exists; that rests on review. Also not
    covered: the Charter's PROSE outside the R1-R9 table. This parses rule rows only, so a stale
    "future gate" claim written in the surrounding prose is invisible here — a rule can still
    oversell itself outside the table. Truth-anchored on the Charter skill's rule table x the
    live invariant names, recomputed each run."""
    KNOWN_MECHANISMS = {
        "corpus_verify", "catalog_verify", "book_purity", "mine", "mine_batch",
        "stop_round_close", "pre_write_guard", "post_write_verify", "pre_bash_guard",
        "no-restricted-globals", "eslint-plugin-boundaries",
    }
    # backticked identifiers that are field/ID names, not gates (they appear in gate-cell prose)
    SKIP = {"book_id", "nutrient_id", "condition_id", "essential_id", "source_claim_id",
            "layout_key", "for_condition", "review_state", "other_substances", "umbrella_of",
            "canon_slug", "display_name", "knowledge_version", "coverage_kind"}
    tok_re = re.compile(r"`([a-z][a-z0-9_]*(?:-[a-z0-9_]+)*)`")
    viol, rows, checked, excused = [], 0, 0, 0
    for line in charter_text.splitlines():
        s = line.strip()
        if not re.match(r"\|\s*R[0-9]\b", s):
            continue
        cells = [c.strip() for c in s.strip("|").split("|")]
        if len(cells) < 4:
            viol.append(f"{cells[0] if cells else '?'}: malformed rule row (expected 4 columns)")
            continue
        rows += 1
        rule_id, gate_cell, status_cell = cells[0], cells[2], cells[3]
        for m in tok_re.finditer(gate_cell):
            name = m.group(1)
            if name in SKIP or ("_" not in name and "-" not in name):
                continue  # not gate-shaped (a plain word) or a known field id
            if name in live or name in KNOWN_MECHANISMS:
                checked += 1
                continue
            if _charter_name_is_wished(name, status_cell):
                excused += 1
                continue
            viol.append(f"{rule_id}: Gate names `{name}`, which is neither a live gate nor "
                        f"labeled WISH (the Charter oversells its enforcement)")
    if rows != 9:
        viol.append(f"parsed {rows} rule rows, expected 9 (charter.md R1-R9 table drift?)")
    if viol:
        return False, "Charter gate honesty broken (R7): " + "; ".join(viol[:6])
    return True, (f"{rows} Charter rules parsed: {checked} named gate(s) verified to exist, "
                  f"{excused} labeled WISH per-name ({len(live)} live invariants cross-checked)")



def check_charter_gates_present():
    """Meta-gate wrapper -- see _charter_gates_present_impl for the full contract
    and the 2026-07-15 per-row -> per-name tightening."""
    charter = ROOT / ".claude" / "skills" / "charter" / "SKILL.md"
    # This used to `return True` on a missing charter as a "bootstrap-guard" -- which meant
    # DELETING the Charter turned its own meta-gate green. A gate that passes because its
    # subject vanished is not a passing gate. Missing is now RED.
    if not charter.exists():
        return False, (".claude/skills/charter/SKILL.md missing — the Charter's own "
                       "meta-gate cannot pass when the Charter is gone")
    return _charter_gates_present_impl(charter.read_text(encoding="utf-8"),
                                       {i.name for i in INVARIANTS})


def check_exceptions_justified():
    """Refinements are codified too, never a silent loosening.
    Every tolerated invariant failure in .claude/invariant-baseline.json must
    carry a JUSTIFICATION: an object with an `invariant` (the live gate it excepts), a
    non-empty `reason`, and a `test` reference (the proof the tolerated case is genuinely
    correct). A bare-string or reason-less exception is exactly the silent loosening this
    forbids -- RED. An empty baseline is vacuously green (nothing to justify), but the gate
    stands so the NEXT exception must be justified. Paired reader: tools/hooks/
    stop_round_close.py tolerates the SAME entries by their `invariant` name. Truth-anchored
    on the baseline file, recomputed each run."""
    import json as _json
    baseline = ROOT / ".claude" / "invariant-baseline.json"
    if not baseline.exists():
        return True, "invariant-baseline.json missing (bootstrap-guard)"
    try:
        data = _json.loads(baseline.read_text(encoding="utf-8"))
    except Exception as e:
        return False, f"invariant-baseline.json is not valid JSON: {e}"
    entries = data.get("tolerated_failures", [])
    live = {i.name for i in INVARIANTS}
    viol = []
    for i, e in enumerate(entries):
        if not isinstance(e, dict):
            viol.append(f"entry #{i + 1} is a bare {type(e).__name__} -- an exception must be an "
                        f"object with invariant+reason+test (R9: no silent loosening)")
            continue
        inv = e.get("invariant")
        if not inv:
            viol.append(f"entry #{i + 1} has no `invariant` name")
        elif inv not in live:
            viol.append(f"entry #{i + 1} excepts `{inv}`, not a live invariant (stale exception?)")
        if not e.get("reason"):
            viol.append(f"entry #{i + 1} ({inv or '?'}) has no `reason`")
        if not e.get("test"):
            viol.append(f"entry #{i + 1} ({inv or '?'}) has no `test` reference")
    if viol:
        return False, "unjustified baseline exception(s) (R9): " + "; ".join(viol[:6])
    n = len(entries)
    return True, (f"all {n} baseline exception(s) carry invariant+reason+test" if n else
                  "no baseline exceptions (vacuously clean); the R9 gate stands for the next one")


def check_corpus_audit_gate():
    """The MANDATORY full-corpus claim audit (all claims, every kind) that must
    run BEFORE book mining resumes, made STRUCTURAL instead of a convention that can be
    forgotten.
    eden/tools/corpus-audit-status.json records a `frozen_claim_count` (the corpus size at
    freeze) and a `phase_g_unlocked` flag. While the audit is NOT signed off
    (phase_g_unlocked=false), the live corpus claim count may not EXCEED the frozen count --
    i.e. new claims cannot be mined onto unaudited data. Growing the corpus is BLOCKED (RED)
    until either the audit signs off (set phase_g_unlocked=true after the corpus_audit.py
    worklist and a per-claim human review) or the freeze baseline is deliberately re-anchored.
    count == frozen -> pass (audit owed, mining locked); count < frozen (a deletion) -> pass.
    It never reds the board for standing still; it reds the instant unaudited mining begins.
    Truth-anchored on the live shard claim count x the frozen baseline, recomputed each run."""
    import json as _json
    status_p = ROOT / "eden" / "tools" / "corpus-audit-status.json"
    claims_dir = ROOT / "eden" / "corpus" / "claims"
    if not status_p.exists() or not claims_dir.exists():
        return True, "corpus-audit-status / corpus not installed (bootstrap-guard)"
    try:
        st = _json.loads(status_p.read_text(encoding="utf-8"))
    except Exception as e:
        return False, f"corpus-audit-status.json is not valid JSON: {e}"
    count = 0
    for shard in claims_dir.glob("claims-*.json"):
        count += len(_json.loads(shard.read_text(encoding="utf-8")).get("claims", []))
    if st.get("phase_g_unlocked") is True:
        return True, f"corpus audit signed off (phase_g_unlocked) -- mining unblocked; {count} claims"
    frozen = st.get("frozen_claim_count")
    if not isinstance(frozen, int):
        return False, "corpus-audit-status.json has no integer frozen_claim_count"
    if count > frozen:
        return False, (f"PHASE G LOCKED -- corpus grew to {count} claims (frozen at {frozen}) without "
                       f"the mandatory full-corpus audit sign-off; new claims may not land on unaudited "
                       f"data. Run eden/tools/corpus_audit.py, review, then set phase_g_unlocked=true.")
    note = "audit OWED, mining LOCKED" if count == frozen else f"corpus shrank to {count} (was {frozen})"
    return True, f"corpus audit gate holding -- {count} claims vs freeze {frozen}; {note}"


# ── Offline integrity ────────────────────────────────────────────────────────
# A bundle SIZE budget is only a proxy for offline-first, and a proxy that is routinely
# bypassed enforces nothing. These gates check the actual promise instead -- the app loads
# nothing off-machine, and every asset it does load is present and pinned.
_NET_LOAD_PATTERNS = [
    # constructs that would actually FETCH at runtime. Deliberately NOT a bare
    # "https?://" scan: the corpus legitimately QUOTES urls in prose, and the bundle
    # inlines the corpus. A mention is not a load.
    (re.compile(r"""fetch\s*\(\s*['"`]https?://""", re.I), "fetch() to a remote url"),
    (re.compile(r"""new\s+WebSocket\s*\(\s*['"`]wss?://""", re.I), "WebSocket to a remote host"),
    (re.compile(r"""importScripts\s*\(\s*['"`]https?://""", re.I), "importScripts() from a remote url"),
    (re.compile(r"""<script[^>]+src\s*=\s*['"](?:https?:)?//""", re.I), "<script src> to a remote url"),
    (re.compile(r"""<link[^>]+href\s*=\s*['"](?:https?:)?//""", re.I), "<link href> to a remote url"),
    (re.compile(r"""@import\s+(?:url\()?['"]?(?:https?:)?//""", re.I), "CSS @import of a remote sheet"),
    (re.compile(r"""url\(\s*['"]?(?:https?:)?//""", re.I), "CSS url() pointing off-machine"),
]


def _shipped_surfaces():
    """The files the user's browser actually loads from file://."""
    d = ROOT / "dashboard"
    out = [d / "dashboard.html"]
    out += sorted((d / "assets" / "styles").glob("*.css"))
    out += [d / "assets" / "js" / "dist" / "main.js"]
    return [p for p in out if p.exists()]


def check_offline_no_runtime_network():
    """Nothing the shipped app LOADS may point off-machine. The project's core promise is
    that it cannot be taken offline or broken by someone else's server, so a CDN script, a
    remote font, a live API call or a websocket is a breach of the product, not a style
    nit.

    SCOPE, stated honestly: this matches LOAD CONSTRUCTS (fetch/WebSocket/importScripts/
    <script src>/<link href>/@import/url()), not any occurrence of a url. That is
    deliberate -- the sealed corpus quotes urls in Wallach's prose and the bundle inlines
    the corpus, so a bare scheme scan would fire on quoted text forever. A load hidden
    behind a runtime-built string (e.g. fetch(base + path)) is NOT caught; that is a
    labeled WISH resting on review, not a covered case.

    Truth anchor: the bytes of the files the browser actually opens, re-read each run."""
    hits = []
    for p in _shipped_surfaces():
        try:
            text = p.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        rel = p.relative_to(ROOT).as_posix()
        for rx, label in _NET_LOAD_PATTERNS:
            m = rx.search(text)
            if m:
                frag = text[m.start():m.start() + 60].replace("\n", " ")
                hits.append(f"{rel}: {label} -> {frag!r}")
    if hits:
        return False, (f"{len(hits)} runtime network dependency(ies) in the shipped app — "
                       "offline-first is broken: " + "; ".join(hits[:4]))
    return True, (f"{len(_shipped_surfaces())} shipped surface(s) load nothing off-machine "
                  f"({len(_NET_LOAD_PATTERNS)} load constructs guarded)")


def check_vendor_assets_pinned():
    """Every vendored library matches the sha256 recorded in its manifest, and every local
    url(...) in shipped CSS resolves on disk.

    Half one makes "vendored + pinned" mean something: an asset silently swapped or
    truncated is caught, which is what lets the size budget go away without losing the
    offline-forever guarantee.

    Half two has a real incident behind it: a 404'd @font-face src does NOT error -- the
    token falls back and shifts metrics on EVERY element, presenting as "everything is
    slightly off" with nothing in the console. Truth anchor: file bytes + os-level
    existence, recomputed each run."""
    problems = []
    man_p = ROOT / "tools" / "design-libs" / "vendor-manifest.json"
    checked = 0
    if man_p.exists():
        man = json.loads(man_p.read_text(encoding="utf-8"))
        for lib in man.get("libs", []):
            f = ROOT / lib["file"]
            if not f.exists():
                problems.append(f"vendored lib MISSING: {lib['file']}")
                continue
            digest = hashlib.sha256(f.read_bytes()).hexdigest()
            if digest != lib["sha256"]:
                problems.append(f"vendored lib CHANGED: {lib['file']} "
                                f"({lib['package']}@{lib.get('version')})")
            checked += 1

    url_re = re.compile(r"""url\(\s*['"]?([^'")]+)['"]?\s*\)""")
    css_refs = 0
    for css in sorted((ROOT / "dashboard" / "assets" / "styles").glob("*.css")):
        text = css.read_text(encoding="utf-8", errors="replace")
        for m in url_re.finditer(text):
            ref = m.group(1).strip()
            if ref.startswith(("data:", "http:", "https:", "//", "#")):
                continue
            css_refs += 1
            target = (css.parent / ref.split("?")[0].split("#")[0]).resolve()
            if not target.exists():
                problems.append(f"{css.name}: url({ref}) does not resolve — "
                                "a 404'd font/image falls back SILENTLY")
    if problems:
        return False, (f"{len(problems)} vendored/asset integrity problem(s): "
                       + "; ".join(problems[:4]))
    return True, (f"{checked} vendored lib(s) hash-pinned, {css_refs} local CSS asset "
                  "reference(s) all resolve")


# ---------------------------------------------------------------------------
# Entity-page migration: the enforcement FLOOR
# ---------------------------------------------------------------------------
# Three gates landed BEFORE the surfaces they guard, so the app could not be built
# with the prototypes' shortcuts (inline prose, a hand-built entity map, demo
# scaffold). Each is a thin path-binding wrapper over a param-taking _impl so
# tools/tests/test_<name>.py can drive the same logic against planted poison (the
# committed negative test, on the amounts_wallach_only pattern).
#
# views_no_inline_prose + entity_render_is_projection are SURFACE-SCOPED to a
# growing allowlist (mirroring _clean_surface_files). Each migrated view is
# APPENDED to its list in the SAME patch that cleans it, so the gate's reach
# grows with the surface instead of waiting for it. The negative tests prove the
# gates FIRE independently of how much real scope the lists currently hold --
# which is what keeps a short list honest rather than reassuring.
# no_stub_render_paths is active over everything: it blocks pasting prototype
# scaffold into any shipped view or stylesheet.
# ---------------------------------------------------------------------------

# The (growing) CLEAN-view surface. A file listed here is asserted prose-free --
# every user-facing string lives in the view-copy content store via state/copy.ts.
# NOT empty and NOT vacuous: every file below BINDS. Read the tuple, never a count
# written in prose -- a number here is one migration away from being a lie.
_CLEAN_VIEW_FILES: tuple = (
    "dashboard/assets/js/src/views/entity-page.ts",
    "dashboard/assets/js/src/views/knowledge-home.ts",
    "dashboard/assets/js/src/views/knowledge-explore.ts",
    "dashboard/assets/js/src/views/knowledge-topic.ts",
    "dashboard/assets/js/src/views/knowledge-orac.ts",
)

# The entity-render view file(s). Asserted a PURE PROJECTION of the generated
# entity-page artifact: no object literal keyed by a real entity id, no per-entity
# content branch. This tuple is NOT empty and the gate BINDS on every file in it --
# read the tuple, never a count written in prose.
_ENTITY_VIEW_FILES: tuple = (
    "dashboard/assets/js/src/views/entity-page.ts",
    "dashboard/assets/js/src/views/knowledge-topic.ts",
)

# Prototype/demo scaffold markers that must NEVER reach a shipped view or css
# (they live only in gitignored temporary/*.html). Distinctive enough not to
# false-positive on legitimate view/css content (verified clean when the gate landed).
_STUB_SCAFFOLD_TOKENS = (
    "kn-stub", "sh-stub", "next chunk", "real build", "demo wires",
    "PROTOTYPE", "exemplar",
)


def _shipped_view_css_files():
    """git-tracked view (.ts) + style (.css) source -- where prototype scaffold
    would be pasted. Truth anchor: committed bytes. Returns None if git is
    unavailable so the caller fails open LOUDLY (never a silent green)."""
    import subprocess
    try:
        r = subprocess.run(["git", "-C", str(ROOT), "ls-files",
                            "dashboard/assets/js/src/views",
                            "dashboard/assets/styles"],
                           capture_output=True, text=True, timeout=30)
    except Exception:
        return None
    out = []
    for rel in r.stdout.splitlines():
        if rel.endswith((".test.ts", ".spec.ts")):
            continue
        if rel.endswith((".ts", ".css")):
            out.append(rel)
    return out


# Any <span ...>...</span> in a rendered template. The class is checked as a TOKEN below
# rather than inside this pattern: attribute order varies, ds-cipher is often one class
# among several, and folding that into the regex is where the escaping bugs live.
_SPAN_RE = re.compile(r"<span(?P<attrs>[^>]*)>(?P<content>.*?)</span>", re.DOTALL)
_CLASS_ATTR_RE = re.compile(r'class\s*=\s*"(?P<cls>[^"]*)"')


def _has_cipher_class(attrs: str) -> bool:
    """True if the span's class list carries ds-cipher as a whole token."""
    m = _CLASS_ATTR_RE.search(attrs)
    return m is not None and "ds-cipher" in m.group("cls").split()


# Identifiers a view imports FROM the state/ or core/ layers. The project's data flow runs
# pillars -> generators -> core/ -> state/ -> views/, so anything crossing that import boundary
# IS real data; anything defined locally in the view is chrome. That boundary is the gate's rule.
_DATA_IMPORT_RE = re.compile(
    r"import\s*\{(?P<names>[^}]*)\}\s*from\s*['\"][^'\"]*/(?:state|core)/[^'\"]*['\"]",
    re.DOTALL,
)
_IDENT_RE = re.compile(r"[A-Za-z_$][A-Za-z0-9_$]*")


def _data_layer_identifiers(text: str) -> set:
    """Names this view pulls in from state/ or core/ -- i.e. the real-data surface."""
    names = set()
    for m in _DATA_IMPORT_RE.finditer(text):
        for raw in m.group("names").split(","):
            ident = raw.replace("type ", " ").strip()
            if " as " in ident:
                ident = ident.split(" as ")[-1].strip()
            if ident:
                names.add(ident)
    return names


def _ciphered_data_refs(content: str, data_names: set) -> set:
    """Data-layer identifiers referenced inside a .ds-cipher span's interpolations."""
    hits = set()
    depth, buf = 0, []
    i = 0
    while i < len(content):
        if content.startswith("${", i):
            depth += 1
            i += 2
            continue
        if depth and content[i] == "}":
            depth -= 1
            if depth == 0:
                expr = "".join(buf)
                buf = []
                hits |= {t for t in _IDENT_RE.findall(expr) if t in data_names}
            i += 1
            continue
        if depth:
            buf.append(content[i])
        i += 1
    return hits


def _no_ciphered_data_impl(files):
    """RED if any (relpath, text) renders a .ds-cipher span whose content carries a
    ${...} interpolation. `files` = iterable of (relpath, text). Param-taking for the
    negative test."""
    hits = []
    files = list(files)
    for rel, text in files:
        data_names = _data_layer_identifiers(text)
        for m in _SPAN_RE.finditer(text):
            if not _has_cipher_class(m.group("attrs")):
                continue
            content = m.group("content")
            if "${" not in content:
                continue
            refs = _ciphered_data_refs(content, data_names)
            if refs:
                snippet = content.strip()[:50].replace("\n", " ")
                hits.append(f"{rel}:'{snippet}' (data: {', '.join(sorted(refs))})")
    if hits:
        return False, ("a .ds-cipher span scrambles a STATE/CORE-sourced value -- the cipher "
                       "engine overwrites the glyphs it wraps and restores the truth only every "
                       "5th tick, so real data renders WRONG ~80% of the time. The cipher may "
                       "wrap view-local chrome only, never data: " + ", ".join(hits[:6])
                       + (" ..." if len(hits) > 6 else ""))
    return True, f"no .ds-cipher span scrambles a state/core-sourced value across {len(files)} scanned view file(s)"


def check_views_no_ciphered_data():
    """§00.A -- the decorative .ds-cipher glyph-scrambler may never wrap REAL data.

    WHY THIS EXISTS (2026-07-14): views/coverage.ts wrapped essentialCount() -- the
    canon-derived count of Wallach's 90 essentials -- in .ds-cipher. That decorative engine
    replaced a random character every 1s tick and
    only restores the true text every 5th tick, so the app's headline fact rendered as
    30 / 80 / 94 four seconds in five. Measured live before the fix:
    ["80","90","30","90","90","91","90","94"]. A decorative animation was fabricating a
    health number -- exactly what §00.A forbids, arrived at by a route no existing gate
    watched (the number's SOURCE was impeccable; its RENDER was not).

    The rule: .ds-cipher wraps static decorative chrome only. Any ${...} inside a
    .ds-cipher span is RED. Truth anchor: the shipped view .ts bytes, scanned each run."""
    rels = _shipped_view_css_files()
    if rels is None:
        return True, ("⚠ UNVERIFIED -- git unavailable; ciphered-data guard could not run "
                      "this pass (fail-open, not a silent green)")
    files = []
    for rel in rels:
        if not rel.endswith(".ts"):
            continue
        try:
            files.append((rel, (ROOT / rel).read_text(encoding="utf-8", errors="ignore")))
        except Exception:
            continue
    return _no_ciphered_data_impl(files)


def _no_stub_render_paths_impl(files):
    """RED if any (relpath, text) carries a prototype/demo scaffold token.
    `files` = iterable of (relpath, text). Param-taking for the negative test."""
    hits = []
    for rel, text in files:
        for tok in _STUB_SCAFFOLD_TOKENS:
            if tok in text:
                hits.append(f"{rel}:{tok}")
                break
    if hits:
        return False, ("prototype/demo scaffold token in a shipped view/css (the migration must "
                       "RE-IMPLEMENT the prototype, never paste it): " + ", ".join(hits[:6])
                       + (" ..." if len(hits) > 6 else ""))
    return True, f"no demo scaffold token in shipped views/styles ({len(_STUB_SCAFFOLD_TOKENS)} tokens guarded)"


def check_no_stub_render_paths():
    """No prototype/demo scaffold (kn-stub / sh-stub / 'next chunk'
    / 'real build' / 'demo wires' / PROTOTYPE / exemplar) survives into a shipped
    view (.ts) or stylesheet (.css). The migration re-implements the prototypes'
    design; it must never paste their scaffolding. Truth anchor: git-tracked
    views/*.ts + styles/*.css bytes, scanned each run."""
    rels = _shipped_view_css_files()
    if rels is None:
        return True, ("⚠ UNVERIFIED -- git unavailable; stub-scaffold guard could not run "
                      "this pass (fail-open, not a silent green)")
    files = []
    for rel in rels:
        try:
            files.append((rel, (ROOT / rel).read_text(encoding="utf-8", errors="ignore")))
        except Exception:
            continue
    return _no_stub_render_paths_impl(files)


def _premature_comment_close_hits(text):
    """(line, col) of every '*/' that appears in CODE context -- NOT closing an open
    comment and NOT inside a string. Models the CSS tokenizer's comment + string state:
    a '*/' reached in code means an earlier '*/' in a comment body (the classic
    '--foo-*/' token-glob-in-a-comment) already closed that comment early, so the CSS
    after it was read as garbage and the following rule silently dropped. A '*/' inside a
    string (e.g. content: "*/") is legitimate and is NOT flagged."""
    hits = []
    i, n = 0, len(text)
    in_comment = False
    in_string = None       # the open quote char, or None
    line, col = 1, 1
    while i < n:
        c = text[i]
        nxt = text[i + 1] if i + 1 < n else ""
        if c == "\n":
            line += 1
            col = 1
            i += 1
            continue
        if in_comment:
            if c == "*" and nxt == "/":
                in_comment = False
                i += 2
                col += 2
                continue
            i += 1
            col += 1
            continue
        if in_string is not None:
            if c == "\\":              # escape -- skip the next char (e.g. \" inside a string)
                i += 2
                col += 2
                continue
            if c == in_string:
                in_string = None
            i += 1
            col += 1
            continue
        # code context
        if c == "/" and nxt == "*":
            in_comment = True
            i += 2
            col += 2
            continue
        if c == "*" and nxt == "/":
            hits.append((line, col))
            i += 2
            col += 2
            continue
        if c in ('"', "'"):
            in_string = c
        i += 1
        col += 1
    return hits


def _css_comment_no_premature_close_impl(files):
    """RED if any (relpath, text) .css carries a '*/' in code context (a premature comment
    close). `files` = iterable of (relpath, text). Param-taking for the negative test."""
    hits = []
    files = list(files)
    for rel, text in files:
        for (ln, _col) in _premature_comment_close_hits(text):
            hits.append(f"{rel}:{ln}")
    if hits:
        return False, ("premature '*/' comment-close in shipped CSS -- an earlier '*/' inside a "
                       "comment body (e.g. a token glob like '--foo-*/') closed the comment early, "
                       "so the rule that followed was silently DROPPED while the board stayed green: "
                       + ", ".join(hits[:8]) + (" ..." if len(hits) > 8 else "")
                       + ". Reword the comment so no '*/' appears before its intended close.")
    return True, f"no premature '*/' comment-close across {len(files)} shipped stylesheet(s)"


def check_css_comment_no_premature_close():
    """A '*/' inside a CSS comment body closes the comment EARLY; the parser then reads the
    author's comment tail as CSS and error-recovers by discarding the next rule -- silently.

    WHY THIS EXISTS: a dark-theme fix appended a theme.css comment reading
    '... The base --ds-status-*/--ds-accent-deep are left alone ...'. The '*/' in
    '--ds-status-*/' ended the comment; the '.rr-btn--danger' rule right after it was eaten
    by error-recovery and never applied -- and the board stayed fully GREEN,
    because nothing checked CSS comment balance. Caught only by reading the live CSSOM
    (getComputedStyle showed the rule absent). A recurring footgun; now a gate, not a
    convention.

    Truth anchor: a comment/string-state tokenizer scan of the git-tracked shipped
    stylesheets, each run."""
    rels = _shipped_view_css_files()
    if rels is None:
        return True, ("⚠ UNVERIFIED -- git unavailable; premature-comment-close guard could "
                      "not run this pass (fail-open, not a silent green)")
    files = []
    for rel in rels:
        if not rel.endswith(".css"):
            continue
        try:
            files.append((rel, (ROOT / rel).read_text(encoding="utf-8", errors="ignore")))
        except Exception:
            continue
    return _css_comment_no_premature_close_impl(files)


def _extract_ts_string_literals(src: str):
    """Yield the CONTENT of every string / template literal in TS source, skipping
    // and /* */ comments. A cheap backstop, not a parser -- mirrors
    _max_inline_literal_elements' comment/string state machine but COLLECTS the
    string bodies instead of discarding them."""
    out = []
    i, n = 0, len(src)
    in_line = in_block = False
    while i < n:
        c = src[i]
        nxt = src[i + 1] if i + 1 < n else ""
        if in_line:
            if c == "\n":
                in_line = False
            i += 1
            continue
        if in_block:
            if c == "*" and nxt == "/":
                in_block = False
                i += 2
                continue
            i += 1
            continue
        if c == "/" and nxt == "/":
            in_line = True
            i += 2
            continue
        if c == "/" and nxt == "*":
            in_block = True
            i += 2
            continue
        if c in ('"', "'", "`"):
            quote = c
            i += 1
            buf = []
            while i < n:
                ch = src[i]
                if ch == "\\":
                    buf.append(src[i:i + 2])
                    i += 2
                    continue
                if ch == quote:
                    break
                buf.append(ch)
                i += 1
            out.append("".join(buf))
            i += 1
            continue
        i += 1
    return out


def _looks_like_prose(s: str) -> bool:
    """Same predicate as check_prose_contained's inner test: a string reads like a
    sentence, not a label. HTML tags, ${...} interpolations, and &entities; are
    stripped first so markup does not inflate the word count."""
    txt = re.sub(r"<[^>]+>", " ", s)
    txt = re.sub(r"\$\{[^}]*\}", " ", txt)
    txt = re.sub(r"&[a-z]+;", " ", txt)
    txt = txt.strip()
    return len(txt.split()) >= 12 or (len(txt) > 40 and re.search(r"\. [A-Z]", txt) is not None)


def _views_no_inline_prose_impl(files):
    """RED if any (relpath, text) clean view file holds a prose-shaped string
    literal. `files` = iterable of (relpath, text). User-facing prose belongs in
    the view-copy content store, referenced by id -- never inline in a view."""
    files = list(files)
    viol = []
    for rel, text in files:
        for lit in _extract_ts_string_literals(text):
            if _looks_like_prose(lit):
                viol.append(f"{rel}: {lit.strip()[:60]!r}")
    if viol:
        return False, ("prose-shaped string literal inline in a clean view (move it to the "
                       "view-copy store via state/copy.ts): " + "; ".join(viol[:6])
                       + (" ..." if len(viol) > 6 else ""))
    return True, f"no inline prose across {len(files)} clean view file(s)"


def check_views_no_inline_prose():
    """The code-side complement of prose_contained: no
    user-facing prose lives as a string literal inside a CLEAN view file -- it
    belongs in the view-copy content store, referenced by id (state/copy.ts).
    Surface-scoped: `_CLEAN_VIEW_FILES` lists the views migrated onto the copy store so far and
    grows as each remaining view is migrated; the negative test proves the gate fires regardless
    of that list's size. NOT vacuous -- read the tuple, not this line. Truth anchor: the
    .ts bytes of the declared clean-view files, scanned each run."""
    files = []
    for rel in _CLEAN_VIEW_FILES:
        p = ROOT / rel
        if p.exists():
            files.append((rel, p.read_text(encoding="utf-8")))
    return _views_no_inline_prose_impl(files)


def _entity_id_set():
    """The real entity ids the entity view must NOT hardcode as content: canon
    essential slugs + catalog condition ids + catalog symptom ids + product ids.
    Missing pillar files are skipped (bootstrap-safe). Ids < 3 chars dropped so a
    two-letter token can't masquerade as an ordinary key."""
    import json as _j
    ids = set()
    canon = ROOT / "eden" / "corpus" / "essentials-canon.json"
    if canon.exists():
        for e in _j.loads(canon.read_text(encoding="utf-8")).get("essentials", []):
            if isinstance(e, dict) and e.get("slug"):
                ids.add(str(e["slug"]).lower())
    for rel, key in (("eden/catalog/conditions.json", "conditions"),
                     ("eden/catalog/symptoms.json", "symptoms")):
        p = ROOT / rel
        if p.exists():
            d = _j.loads(p.read_text(encoding="utf-8")).get(key, {})
            if isinstance(d, dict):
                ids.update(str(k).lower() for k in d.keys())
    prod = ROOT / "eden" / "products" / "products.json"
    if prod.exists():
        d = _j.loads(prod.read_text(encoding="utf-8")).get("products", {})
        if isinstance(d, dict):
            ids.update(str(k).lower() for k in d.keys())
    return {i for i in ids if len(i) >= 3}


def _strip_ts_comments(src: str) -> str:
    """Remove // and /* */ comments but KEEP string/template bodies (an equality
    branch like `slug === 'calcium'` needs its literal intact). String state is
    tracked so a // inside a string is not mistaken for a comment."""
    out = []
    i, n = 0, len(src)
    in_line = in_block = False
    in_str = None
    while i < n:
        c = src[i]
        nxt = src[i + 1] if i + 1 < n else ""
        if in_line:
            if c == "\n":
                in_line = False
                out.append(c)
            i += 1
            continue
        if in_block:
            if c == "*" and nxt == "/":
                in_block = False
                i += 2
                continue
            i += 1
            continue
        if in_str is not None:
            out.append(c)
            if c == "\\" and i + 1 < n:
                out.append(nxt)
                i += 2
                continue
            if c == in_str:
                in_str = None
            i += 1
            continue
        if c == "/" and nxt == "/":
            in_line = True
            i += 2
            continue
        if c == "/" and nxt == "*":
            in_block = True
            i += 2
            continue
        if c in ('"', "'", "`"):
            in_str = c
            out.append(c)
            i += 1
            continue
        out.append(c)
        i += 1
    return "".join(out)


def _entity_render_is_projection_impl(files, entity_ids):
    """RED if an entity-view file hardcodes per-entity CONTENT: an object literal
    keyed by a real entity id, or a `slug === 'entityid'` content branch. `files`
    = iterable of (relpath, text); `entity_ids` = the real id set. Param-taking for
    the negative test. Closes the sub-10-element hole views_state_no_inline_data
    cannot see (a 2-key content map keyed by entity ids)."""
    files = list(files)
    # HYPHENS + DIGIT-LEADING IDS ARE LOAD-BEARING.
    # These classes were [A-Za-z][A-Za-z0-9_]* / [A-Za-z0-9_]+ -- no hyphen -- so
    # roughly a fifth of the real entity ids -- every hyphenated one -- could NOT be
    # matched: `slug === 'omega-9'` sailed through GREEN while `slug === 'calcium'`
    # reddened. A per-entity branch on any hyphenated id was a free pass, so the gate
    # bound most of its own surface and said nothing about the rest. The class must ALSO open with
    # [A-Za-z0-9], not [A-Za-z]: two real ids start with a digit
    # ('18-and-20-daily-super-blend', '3-0-rise-and-restore'), and a letter-only
    # opener would still have missed exactly those. Not a false-positive risk: a
    # capture only violates if it is IN entity_ids.
    key_re = re.compile(r"""(?:[{,]|^)\s*['"]?([A-Za-z0-9][A-Za-z0-9_-]*)['"]?\s*:""", re.M)
    eq_re = re.compile(r"""===\s*['"]([A-Za-z0-9_-]+)['"]|['"]([A-Za-z0-9_-]+)['"]\s*===""")
    viol = []
    for rel, text in files:
        src = _strip_ts_comments(text)
        keyed = sorted({m.group(1).lower() for m in key_re.finditer(src)
                        if m.group(1).lower() in entity_ids})
        branched = sorted({(a or b).lower() for a, b in eq_re.findall(src)
                           if (a or b).lower() in entity_ids})
        if keyed:
            viol.append(f"{rel}: object literal keyed by entity id(s) {keyed[:5]}")
        if branched:
            viol.append(f"{rel}: per-entity content branch on {branched[:5]}")
    if viol:
        return False, ("entity view is NOT a pure projection -- hardcoded per-entity content "
                       "(must read from the generated entity-page artifact): " + "; ".join(viol[:6]))
    return True, f"entity view is a pure projection across {len(files)} file(s)"


def check_entity_render_is_projection():
    """The entity-render view is a PURE PROJECTION of the
    generated entity-page artifact -- never a hand-built map keyed by entity ids,
    never a per-entity content branch. Closes the sub-10-element hole
    views_state_no_inline_data cannot see. Surface-scoped: _ENTITY_VIEW_FILES holds
    the entity views built so far, every one of them BINDING, and grows in the same
    patch as a new one; the negative test proves the gate fires. NOT vacuous -- read the tuple. Truth anchor: the real entity-id sets
    from the pillars x the entity-view .ts bytes, recomputed each run."""
    ids = _entity_id_set()
    files = []
    for rel in _ENTITY_VIEW_FILES:
        p = ROOT / rel
        if p.exists():
            files.append((rel, p.read_text(encoding="utf-8")))
    return _entity_render_is_projection_impl(files, ids)




# ── Element-header contract (2026-07-29) ─────────────────────────────────────
# Two misses cost a full design session on copper's header, so both are codified here
# rather than left to memory + review:
#   (1) a shipped header whose entity-copy entry is only HALF-filled. Copper went live
#       with `why` but no `lede`; on the page a partial entry is indistinguishable from a
#       complete one, so nothing surfaced it until the user noticed the missing opening line.
#   (2) figure type drifting ABOVE the selenium standard. Selenium's shipped figure renders
#       its labels at 12.0px and its element glyph at 17.6px (MEASURED headlessly, not
#       chosen); a larger invented scale reads as shouting beside it.
# The build playbook these enforce: .claude/skills/element-headers/SKILL.md
_FIGURE_LABEL_PX = 12.0   # measured: selenium .kd-ep-fam__flabel renders at 12.0px on screen
_FIGURE_GLYPH_PX = 17.6   # measured: selenium .kd-ep-fam__seglyph renders at 17.6px -- the CEILING
_FIGURE_LABEL_CLASSES = ("__glabel", "__gsub", "__gname", "__gtag", "__gstop")


def _element_header_complete_impl(mech_store, copy_store):
    """RED if an essential with a shipped composed HEADER carries an incomplete entity-copy
    entry -- both `lede` (the opening line) and `why` (the target's provenance) must be
    present and non-empty. Params for the negative test."""
    mechs = mech_store.get("mechanisms", [])
    ess = copy_store.get("essentials", {})
    viol = []
    for m in mechs:
        slug = str(m.get("slug", ""))
        entry = ess.get(slug) or {}
        missing = [f for f in ("lede", "why") if not str(entry.get(f) or "").strip()]
        if missing:
            viol.append(f"{slug}: entity-copy missing {' + '.join(missing)}")
    if viol:
        return False, ("a shipped element header has an INCOMPLETE entity-copy entry -- every "
                       "header carries BOTH the opening lede and the why-this-number "
                       "provenance: " + "; ".join(viol))
    return True, (f"all {len(mechs)} shipped element header(s) carry a complete entity-copy "
                  "entry (lede + why)")


def check_element_header_complete():
    """Every element that ships a composed mechanism header also ships its opening lede AND
    its why-this-number provenance. SCOPE, stated honestly: this binds on the elements that
    HAVE a header (the mechanism-clarity entries), not on all 91 -- the other essentials have
    no entity-copy entry yet, and gating them would be a red for work not yet started. That
    remainder is an acknowledged coverage gap, not a claim that every essential is done.
    Truth anchor: the two hand-authored store files' bytes, re-read each run."""
    base = ROOT / "dashboard" / "assets" / "data"
    mech_p, copy_p = base / "mechanism-clarity-data.json", base / "entity-copy.json"
    if not mech_p.exists() or not copy_p.exists():
        return False, "mechanism-clarity-data.json or entity-copy.json missing"
    mech = json.loads(mech_p.read_text(encoding="utf-8"))
    copy = json.loads(copy_p.read_text(encoding="utf-8"))
    return _element_header_complete_impl(mech, copy)


def _figure_type_within_standard_impl(css_text):
    """RED if a generic element-figure text class (.kd-ep-fam__g*) declares a font-size above
    the selenium glyph, or a LABEL-tier class is not exactly the selenium label size. Param
    for the negative test."""
    viol = []
    for m in re.finditer(r"\.(kd-ep-fam__g[a-z-]*)[^{}]*\{([^{}]*)\}", css_text):
        cls, body = m.group(1), m.group(2)
        fm = re.search(r"font-size:\s*([0-9.]+)px", body)
        if fm is None:
            continue
        px = float(fm.group(1))
        if px > _FIGURE_GLYPH_PX:
            viol.append(f".{cls}: {px}px exceeds the selenium glyph ceiling {_FIGURE_GLYPH_PX}px")
        elif any(cls.endswith(t) for t in _FIGURE_LABEL_CLASSES) and px != _FIGURE_LABEL_PX:
            viol.append(f".{cls}: {px}px is not the selenium label standard {_FIGURE_LABEL_PX}px")
    if viol:
        return False, ("element-figure type is off the SELENIUM standard (labels "
                       f"{_FIGURE_LABEL_PX}px, glyph ceiling {_FIGURE_GLYPH_PX}px, both measured "
                       "off the shipped selenium figure): " + "; ".join(viol[:6]))
    return True, (f"element-figure type within the selenium standard (labels {_FIGURE_LABEL_PX}px, "
                  f"ceiling {_FIGURE_GLYPH_PX}px)")


def check_figure_type_within_standard():
    """Element-figure label type matches the MEASURED selenium standard and nothing exceeds its
    glyph. This is the SOURCE-side half; the RENDERED half (scale == 1, so a declared px is a
    screen px, plus a pairwise label-collision check) is proven only where a render probe exists --
    tools/probes/render_probe_copper.js covers copper and re-checks selenium, so a figure with no probe
    has no rendered proof. A declared size means nothing if the figure renders at a
    fraction of its viewBox. Truth anchor: drawer-knowledge.css bytes, scanned each run."""
    p = ROOT / "dashboard" / "assets" / "styles" / "drawer-knowledge.css"
    if not p.exists():
        return False, "drawer-knowledge.css missing"
    return _figure_type_within_standard_impl(p.read_text(encoding="utf-8"))


def _mech_span(src, opener):
    """The balanced-paren text of ONE declaration: from `opener` to the paren that closes the call it
    opens. Paren-MATCHED rather than scanned to a fixed closer string: a scan for a literal
    newline followed by ");" never matches the real declaration, which ends with a newline
    followed by "]);" -- so the span would silently run to end-of-file and any z.literal()
    declared later would answer for this vocabulary. That passed only while no such literal
    existed. Pinned by the ghost-literal test case."""
    i = src.find(opener)
    if i < 0:
        return ""
    j = src.find("(", i)
    if j < 0:
        return ""
    depth, k = 0, j
    while k < len(src):
        if src[k] == "(":
            depth += 1
        elif src[k] == ")":
            depth -= 1
            if depth == 0:
                return src[i:k + 1]
        k += 1
    return src[i:]


def _mech_fn_body(src, signature):
    """A function's body by brace matching from its signature. Brace-aware rather than
    regex-to-the-next-'}' so a nested block cannot end the scan early (the same swallow bug
    regimen_state_mutation_routing was re-codified for)."""
    i = src.find(signature)
    if i < 0:
        return ""
    i = src.find("{", i)
    if i < 0:
        return ""
    depth, k = 0, i
    while k < len(src):
        if src[k] == "{":
            depth += 1
        elif src[k] == "}":
            depth -= 1
            if depth == 0:
                return src[i:k + 1]
        k += 1
    return src[i:]


def _mech_refs(store):
    """Every (kind, value) reference a mechanism store makes to a sealed claim, across BOTH
    shapes: the legacy fields and the composed blocks. Beat `traces` are included -- they are
    provenance-only and never rendered, but a trace that resolves to nothing is a broken
    audit trail, which is the thing they exist for."""
    refs = []

    def side_refs(sp, where):
        for name in ("left", "right"):
            s = (sp or {}).get(name) or {}
            if s.get("quote_claim"):
                refs.append((f"{where}.{name}.quote_claim", str(s["quote_claim"])))

    def beat_refs(beats, where):
        for b in beats or []:
            for t in (b.get("traces") or []):
                refs.append((f"{where}.traces", str(t)))

    for m in store.get("mechanisms", []):
        slug = str(m.get("slug", "?"))
        blocks = m.get("blocks")
        if isinstance(blocks, list):
            for n, b in enumerate(blocks):
                if not isinstance(b, dict):
                    continue
                t = b.get("type")
                if t == "quote" and b.get("claim"):
                    refs.append((f"{slug}.blocks[{n}].claim", str(b["claim"])))
                elif t == "stat" and b.get("claim"):
                    refs.append((f"{slug}.blocks[{n}].claim", str(b["claim"])))
                elif t == "split":
                    side_refs(b, f"{slug}.blocks[{n}]")
                elif t == "beats":
                    beat_refs(b.get("items"), f"{slug}.blocks[{n}]")
            continue
        if m.get("quote_claim"):
            refs.append((f"{slug}.quote_claim", str(m["quote_claim"])))
        if (m.get("stat") or {}).get("claim"):
            refs.append((f"{slug}.stat.claim", str(m["stat"]["claim"])))
        side_refs(m.get("split"), f"{slug}.split")
        beat_refs(m.get("beats"), slug)
    return refs


def _mech_figure_keys(store):
    """Every (where, figure key) the store asks the renderer to draw, across both shapes."""
    keys = []
    for m in store.get("mechanisms", []):
        slug = str(m.get("slug", "?"))
        blocks = m.get("blocks")
        if isinstance(blocks, list):
            for n, b in enumerate(blocks):
                if isinstance(b, dict) and b.get("type") in ("figure", "opener"):
                    f = b.get("figure") or {}
                    keys.append((f"{slug}.blocks[{n}]", str(f.get("key", ""))))
            continue
        if m.get("figure"):
            keys.append((f"{slug}.figure", str(m["figure"])))
        if (m.get("hook") or {}).get("figure"):
            keys.append((f"{slug}.hook", str(m["hook"]["figure"].get("key", ""))))
        for fld in ("figure_pre_beats", "figure_post_beats"):
            if m.get(fld):
                keys.append((f"{slug}.{fld}", str(m[fld].get("key", ""))))
    return keys


def _mechanism_blocks_wellformed_impl(store, schema_src, view_src, claim_ids):
    """RED if the composed block vocabulary and its renderer have drifted apart, or if the
    mechanism store names a figure the renderer cannot draw or a claim that does not resolve.
    Params for the negative test.

    The failure mode this exists for: the composed shape moves the ORDER and SELECTION of a
    header's blocks out of the renderer and into data, and a data-driven dispatch fails SILENTLY
    -- an unknown block type or a mistyped figure key renders '' and the page just looks a bit
    empty. Nothing else catches that, so it is caught here at the source."""
    declared = set(re.findall(r"z\.literal\('([a-z_]+)'\)",
                              _mech_span(schema_src, "const MechBlockSchema = z.discriminatedUnion(")))
    dispatched = set(re.findall(r"case '([a-z_]+)':",
                                _mech_fn_body(view_src, "function renderMechBlocks(")))
    drawable = set(re.findall(r"case '([a-z_]+)':",
                              _mech_fn_body(view_src, "function mechanismFigure(")))
    viol = []
    if not declared or not dispatched or not drawable:
        return False, ("could not read the block vocabulary -- MechBlockSchema, renderMechBlocks or "
                       f"mechanismFigure not found (declared={len(declared)}, "
                       f"dispatched={len(dispatched)}, drawable={len(drawable)})")
    for t in sorted(declared - dispatched):
        viol.append(f"block type '{t}' is in the schema but renderMechBlocks has no case -- it "
                    "would render NOTHING")
    for t in sorted(dispatched - declared):
        viol.append(f"renderMechBlocks handles '{t}' but no schema literal declares it -- the data "
                    "could never reach it")
    for where, key in _mech_figure_keys(store):
        if key not in drawable:
            viol.append(f"{where}: figure key '{key}' is not one mechanismFigure draws -- renders ''")
    for where, cid in _mech_refs(store):
        if cid not in claim_ids:
            viol.append(f"{where}: claim '{cid}' does not resolve to a sealed corpus claim")
    for m in store.get("mechanisms", []):
        blocks = m.get("blocks")
        if isinstance(blocks, list) and len(blocks) == 0:
            viol.append(f"{m.get('slug', '?')}: composed entry with an EMPTY block list renders an "
                        "empty header")
    if viol:
        return False, ("mechanism block list is not well-formed: " + "; ".join(viol[:6])
                       + (f" ... (+{len(viol) - 6} more)" if len(viol) > 6 else ""))
    return True, (f"{len(declared)} block types declared == dispatched; "
                  f"{len(_mech_figure_keys(store))} figure ref(s) drawable, "
                  f"{len(_mech_refs(store))} claim ref(s) resolve")


def check_mechanism_blocks_wellformed():
    """The element-header block list is well-formed (the composed-shape gate).

    Three things, each anchored outside the thing it checks: (a) the schema's block vocabulary and
    renderMechBlocks' dispatch are the SAME set, in both directions -- a type declared with no case
    would silently render nothing, and a case with no declaration is unreachable; (b) every figure
    key the store names is one mechanismFigure actually draws; (c) every claim the store cites
    resolves in the sealed corpus. Covers BOTH shapes: the legacy entries get (b) and (c) too, which
    they never had.

    SCOPE, honestly: this proves the composed path cannot silently DROP a block or a figure. It says
    nothing about whether a header is well DESIGNED -- that is a human visual sign-off
    (.claude/skills/visual-verification/SKILL.md), and the byte-identity of the signed-off headers
    (whichever are recorded in tools/gate-fixtures/mechanism-sections.json) is proven separately by
    tools/probes/render_probe_mech_shape.js.

    Truth anchor: the schema .ts bytes x the view .ts bytes x the hand-authored store x the sealed
    corpus shards, all re-read each run."""
    base = ROOT / "dashboard" / "assets"
    store_p = base / "data" / "mechanism-clarity-data.json"
    schema_p = base / "js" / "src" / "core" / "schemas" / "mechanism-clarity.ts"
    view_p = base / "js" / "src" / "views" / "entity-page.ts"
    for p in (store_p, schema_p, view_p):
        if not p.exists():
            return False, f"{p.relative_to(ROOT)} missing"
    claim_ids = set()
    for shard in sorted((ROOT / "eden" / "corpus" / "claims").glob("claims-*.json")):
        for c in (json.loads(shard.read_text(encoding="utf-8")).get("claims") or []):
            # The sealed shard field is `id`, NOT `claim_id`. Reading the wrong key loads an
            # EMPTY id set, which reddens every real reference -- a gate lying about clean data,
            # and invisible without running it. Hence the negative test's positive-control case.
            if isinstance(c, dict) and c.get("id"):
                claim_ids.add(str(c["id"]))
    return _mechanism_blocks_wellformed_impl(
        json.loads(store_p.read_text(encoding="utf-8")),
        schema_p.read_text(encoding="utf-8"),
        view_p.read_text(encoding="utf-8"),
        claim_ids,
    )


def _mech_quote_trims(store):
    """Every (where, quote_claim, quote_trim) a split side declares, across BOTH shapes. A quote_trim
    DISPLAYS a trimmed literal quote; it must be a contiguous slice of the sealed verbatim (gated),
    so a 'prose quote' can only ever TRIM Wallach, never fabricate."""
    out = []

    def side_trims(sp, where):
        for name in ("left", "right"):
            s = (sp or {}).get(name) or {}
            if s.get("quote_trim"):
                out.append((f"{where}.{name}", s.get("quote_claim"), str(s["quote_trim"])))

    for m in store.get("mechanisms", []):
        slug = str(m.get("slug", "?"))
        blocks = m.get("blocks")
        if isinstance(blocks, list):
            for n, b in enumerate(blocks):
                if not isinstance(b, dict):
                    continue
                if b.get("type") == "split":
                    side_trims(b, f"{slug}.blocks[{n}]")
                elif b.get("type") == "quote" and b.get("trim"):
                    # A composed standalone pull-quote may trim its verbatim too -- policed here so a
                    # trimmed quote behind a real cite can only TRIM Wallach, never fabricate.
                    out.append((f"{slug}.blocks[{n}]", b.get("claim"), str(b["trim"])))
            continue
        side_trims(m.get("split"), f"{slug}.split")
    return out


def _mech_quote_trim_faithful_impl(store, claims_by_id):
    """RED if a split side's quote_trim is not a contiguous (whitespace-normalised) slice of its
    quote_claim's sealed verbatim -- a 'prose quote' that fabricates rather than trims -- or names no
    resolving claim (no source for its cite). claims_by_id is a param so the negative test drives it."""
    def norm(s):
        return re.sub(r"\s+", " ", s or "").strip()
    trims = _mech_quote_trims(store)
    viol = []
    for where, cid, trim in trims:
        if not cid:
            viol.append(f"{where}: quote_trim with no quote_claim -- a cited quote needs a source")
            continue
        verb = claims_by_id.get(cid)
        if verb is None:
            viol.append(f"{where}: quote_claim '{cid}' does not resolve to a sealed claim")
            continue
        if norm(trim) not in norm(verb):
            viol.append(f"{where}: quote_trim is NOT a contiguous slice of {cid}'s sealed verbatim "
                        "(a prose quote may only TRIM Wallach, never fabricate)")
    if viol:
        return False, ("mechanism quote_trim not faithful: " + "; ".join(viol[:6])
                       + (f" ... (+{len(viol) - 6} more)" if len(viol) > 6 else ""))
    return True, (f"{len(trims)} trimmed quote(s) are each a faithful contiguous slice of their sealed "
                  "verbatim (a prose quote trims Wallach, never fabricates)")


def check_mech_quote_trim_faithful():
    """A displayed 'prose quote' (a split card's quote_trim) is a faithful TRIM of the sealed verbatim.

    The mechanism split can show a card that LOOKS like a cited Wallach quote but is authored prose, so
    a card can stop the quote before a trailing sentence (calcium drops '...The normal range is
    9-10.8 mg') without re-sealing canon. That is exactly the surface where a cited quote could drift
    into words Wallach never wrote -- a misattribution the source rule (00.A) exists to stop. This
    anchors every quote_trim to the sealed claim's verbatim: it must be a contiguous whitespace-
    normalised slice, and it must name a resolving quote_claim (its cite's source). Truth anchor: the
    sealed corpus claim shards, re-read each run."""
    base = ROOT / "dashboard" / "assets"
    store_p = base / "data" / "mechanism-clarity-data.json"
    if not store_p.exists():
        return False, f"{store_p.relative_to(ROOT)} missing"
    claims_by_id = {}
    for shard in sorted((ROOT / "eden" / "corpus" / "claims").glob("claims-*.json")):
        for c in (json.loads(shard.read_text(encoding="utf-8")).get("claims") or []):
            if isinstance(c, dict) and c.get("id"):
                claims_by_id[str(c["id"])] = str(c.get("verbatim", ""))
    return _mech_quote_trim_faithful_impl(
        json.loads(store_p.read_text(encoding="utf-8")), claims_by_id)



def _kind_label_covers_corpus_impl(store_path, claims_dir):
    """RED if a distinct claim.kind in the sealed corpus has no entry in the
    view-copy content store's kind_labels map. `store_path`, `claims_dir` are
    params so the negative test can drive the same logic against a tampered store."""
    import json as _j
    try:
        labels = _j.loads(store_path.read_text(encoding="utf-8")).get("kind_labels", {})
    except Exception as e:
        return False, f"view-copy store unreadable ({e})"
    kinds = set()
    for shard in sorted(claims_dir.glob("claims-*.json")):
        d = _j.loads(shard.read_text(encoding="utf-8"))
        arr = d.get("claims", d) if isinstance(d, dict) else d
        for c in arr:
            k = c.get("kind")
            if k:
                kinds.add(k)
    missing = sorted(k for k in kinds if k not in labels)
    if missing:
        return False, (f"{len(missing)} sealed claim kind(s) have NO display label in view-copy.json "
                       f"kind_labels (the entity page would render a raw/blank header): {missing}")
    return True, f"all {len(kinds)} sealed claim kinds have a view-copy display label"


def check_kind_label_covers_corpus():
    """Codify, don't promise: every distinct claim.kind present in
    the sealed corpus has a display label in the view-copy content store, so the entity
    page can never render a raw/blank kind header. Truth anchor: the distinct kinds in the
    sealed claim shards x view-copy.json kind_labels keys, recomputed each run."""
    return _kind_label_covers_corpus_impl(
        ROOT / "dashboard" / "assets" / "data" / "view-copy.json",
        ROOT / "eden" / "corpus" / "claims")

_DOSE_PROGRAMME_MARKERS = ("base-line", "base line", "true supplement need",
                           "supplement program", "daily maintenance", "maintenance")
_DOSE_PROGRAMME_STATED = re.compile(r"base.?line|daily multiple|\b(?:19|20)\d\d\b", re.I)


def _dose_answers_state_their_programme_impl(claims_dir, enrichment_path):
    """RED unless every GENERAL-PROGRAMME dose card names the programme or the year it came from.

    A quarter of the essentials carry two or more different general-programme dose numbers, almost all of
    them Wallach's 1995 Base Line table against his 2014 Epigenetics daily multiple. When the
    reader-facing answer states a bare number, those land side by side on one element as rival
    answers to a single question -- which is exactly how vitamin D came to show four different IU
    figures under WHAT TO DO on one page, reading as four claims contradicting each other. Naming
    the programme is what makes supersession legible instead of looking like a contradiction.

    Scope is deliberately narrow: only claims whose dose.for_condition marks a general programme.
    A condition-scoped therapeutic dose ("400 IU orally b.i.d." for rickets) is not a rival to a
    maintenance target and is not checked. A claim with no enrichment renders no card, so there is
    nothing to scope. `claims_dir` and `enrichment_path` are parameters so the negative test can
    drive the same logic against a tampered store.
    """
    try:
        enrich = json.loads(pathlib.Path(enrichment_path).read_text(encoding="utf-8"))["enrichment"]
    except Exception as e:
        return False, f"search-enrichment store unreadable ({e})"
    bad, checked = [], 0
    for shard in sorted(pathlib.Path(claims_dir).glob("claims-*.json")):
        doc = json.loads(shard.read_text(encoding="utf-8"))
        for c in (doc.get("claims", doc) if isinstance(doc, dict) else doc):
            if c.get("kind") != "dose":
                continue
            dz = c.get("dose") or {}
            if dz.get("amount") is None:
                continue
            fc = str(dz.get("for_condition") or "").lower()
            if not any(m in fc for m in _DOSE_PROGRAMME_MARKERS):
                continue
            entry = enrich.get(c.get("id"))
            if not entry:
                continue
            checked += 1
            if not _DOSE_PROGRAMME_STATED.search(entry.get("answer_short") or ""):
                bad.append(c.get("id"))
    if bad:
        return False, (f"{len(bad)} of {checked} general-programme dose answer(s) give a number "
                       f"with no programme and no year, so rival figures read as rival answers to "
                       f"one question: " + ", ".join(sorted(bad)[:6]))
    return True, f"all {checked} general-programme dose answers name their programme or year"


def check_dose_answers_state_their_programme():
    """Every general-programme dose card names its programme or year -- the
    supersession-legibility rule, shipped as a gate rather than an unenforced promise."""
    return _dose_answers_state_their_programme_impl(
        ROOT / "eden" / "corpus" / "claims",
        ROOT / "eden" / "corpus" / "search-enrichment.json")


_CATEGORY_FAMILIES = {"green", "teal", "amber", "orange", "violet", "red"}


def _claim_category_mapping_total_impl(store_path, claims_dir):
    """RED unless view-copy.json kind_categories maps EVERY distinct sealed claim.kind to
    exactly one KNOWN colour family, with NO default branch: a sealed kind missing from the
    map, a map entry for a kind not in the corpus, or a family outside the locked colour
    language each RED. `store_path`, `claims_dir` are params so the negative test drives the
    same logic against a tampered store."""
    import json as _j
    try:
        cats = _j.loads(store_path.read_text(encoding="utf-8")).get("kind_categories", {})
    except Exception as e:
        return False, f"view-copy store unreadable ({e})"
    kinds = set()
    for shard in sorted(claims_dir.glob("claims-*.json")):
        d = _j.loads(shard.read_text(encoding="utf-8"))
        arr = d.get("claims", d) if isinstance(d, dict) else d
        for c in arr:
            k = c.get("kind")
            if k:
                kinds.add(k)
    missing = sorted(k for k in kinds if k not in cats)
    extra = sorted(k for k in cats if k not in kinds)
    bad = sorted(f"{k}->{cats[k]}" for k in cats if cats[k] not in _CATEGORY_FAMILIES)
    problems = []
    if missing:
        problems.append(f"{len(missing)} sealed kind(s) with NO colour category "
                        f"(entity page would render no colour bar): {missing}")
    if extra:
        problems.append(f"{len(extra)} category entr(ies) for a kind NOT in the corpus "
                        f"(map not pinned to reality): {extra}")
    if bad:
        problems.append(f"category outside the locked colour language "
                        f"{sorted(_CATEGORY_FAMILIES)}: {bad}")
    if problems:
        return False, "kind->colour-category map is not TOTAL/exact: " + "; ".join(problems)
    return True, (f"all {len(kinds)} sealed claim kinds map to exactly one of the "
                  f"{len(_CATEGORY_FAMILIES)} colour families (no default branch)")


def check_claim_category_mapping_total():
    """The claim.kind -> colour-category map
    in the view-copy content store (kind_categories) is TOTAL over the sealed corpus kinds and
    exact -- every distinct sealed claim.kind maps to exactly one of the six locked colour
    families (green/teal/amber/orange/violet/red), no default/fallback branch, no stale entry
    for a vanished kind. So a new corpus kind can never silently render with a wrong/absent
    colour. Truth anchor: distinct claim.kind in the sealed shards x view-copy.json
    kind_categories keys+values, recomputed each run."""
    return _claim_category_mapping_total_impl(
        ROOT / "dashboard" / "assets" / "data" / "view-copy.json",
        ROOT / "eden" / "corpus" / "claims")


def _view_category_not_hardcoded_impl(files):
    """RED if an entity-view file assigns a colour by a hardcoded family literal
    ('green'/'teal'/'amber'/'orange'/'violet'/'red') instead of reading the kind->category map
    (view-copy kind_categories via state/copy.ts::kindCategory). `files` = iterable of
    (relpath, text); param-taking for the negative test. A string literal whose whole body IS a
    family word is the tell -- the legitimate path never writes one (the family key flows from
    the map; the CSS colour value lives in the stylesheet, not TS)."""
    viol = []
    for rel, text in files:
        for lit in _extract_ts_string_literals(text):
            if lit.strip().lower() in _CATEGORY_FAMILIES:
                viol.append(f"{rel}: hardcoded colour-family literal {lit.strip()!r}")
    if viol:
        return False, ("entity view assigns a colour by a hardcoded family literal instead of the "
                       "kind->category map (read it via state/copy.ts::kindCategory): "
                       + "; ".join(viol[:6]))
    return True, f"no hardcoded colour-family literal across {len(files)} entity-view file(s)"


def check_view_category_not_hardcoded():
    """The entity view reads a claim's colour CATEGORY from the map
    (view-copy kind_categories via state/copy.ts::kindCategory) and never hardcodes a colour
    family per claim/kind. Surface-scoped: _ENTITY_VIEW_FILES lists the entity views this
    BINDS on; it grows in the same patch as each new view. NOT vacuous. Truth
    anchor: the entity-view .ts bytes scanned each run for a standalone family-word literal."""
    files = []
    for rel in _ENTITY_VIEW_FILES:
        p = ROOT / rel
        if p.exists():
            files.append((rel, p.read_text(encoding="utf-8")))
    return _view_category_not_hardcoded_impl(files)


# ── Pill relation -- keep in sync with eden/tools/entity_page_derive.py; a rule change must
# updates BOTH, with proof). entity_pills_justified recomputes the relation INDEPENDENTLY here
# so it proves every posted pill is backed even if the generator's logic regressed
# (derived_artifacts_fresh only proves the artifact matches the generator, not that the
# generator is leak-free). ──
_PILL_DIRECTED_KINDS = frozenset({"protocol", "dose"})           # directed prescription — always maps
_PILL_ASSOC_KINDS = frozenset({"deficiency_sign", "prognosis"})  # focused tie — unless shotgun
_PILL_SHOTGUN_ESS = 3
_PILL_SHOTGUN_COND = 3
_POSITIONAL_HERO_RE = re.compile(r"\b(?:claims|record|claim_ids)\s*\[\s*0\s*\]")


def _pill_relation_from_claims(claims, ess_slugs, cond_slugs):
    """Independently recompute the directed maps(E,C) + works_with relations from the corpus
    projection. Returns (ess->conds, cond->essentials, ess->works_with) as slug->set."""
    directed_ec: dict = {}
    directed_ce: dict = {}
    works: dict = {}
    for c in claims.values():
        k = c.get("kind")
        es = [e for e in c.get("essentials", []) if e in ess_slugs]
        cs = [s for s in c.get("conditions", []) if s in cond_slugs]
        if k in _PILL_DIRECTED_KINDS:
            contributes = True
        elif k in _PILL_ASSOC_KINDS:
            contributes = not (len(c.get("essentials", [])) >= _PILL_SHOTGUN_ESS
                               and len(c.get("conditions", [])) >= _PILL_SHOTGUN_COND)
        else:
            contributes = False
        if contributes:
            for e in es:
                for s in cs:
                    directed_ec.setdefault(e, set()).add(s)
                    directed_ce.setdefault(s, set()).add(e)
        if k == "interaction":
            for e in es:
                for e2 in es:
                    if e2 != e:
                        works.setdefault(e, set()).add(e2)
    return directed_ec, directed_ce, works


def _entity_pills_justified_impl(artifact, embed):
    """RED if any entity PILL lacks a qualifying source claim. `artifact` = entity-page-data
    dict, `embed` = corpus-embed dict. Param-taking for the negative test."""
    ess_slugs = set(embed.get("essentials", {}).keys())
    cond_slugs = set(embed.get("conditions", {}).keys())
    ec, ce, works = _pill_relation_from_claims(embed.get("claims", {}), ess_slugs, cond_slugs)
    viol = []
    for slug, rec in artifact.get("conditions", {}).items():
        for e in rec.get("restore", []):
            if e not in ce.get(slug, set()):
                viol.append(f"condition {slug}: restore pill '{e}' has no directed maps() claim")
    for slug, rec in artifact.get("essentials", {}).items():
        for cslug in rec.get("conditions", []):
            if cslug not in ec.get(slug, set()):
                viol.append(f"essential {slug}: help-with pill '{cslug}' has no directed maps() claim")
        for e2 in rec.get("works_with", []):
            if e2 not in works.get(slug, set()):
                viol.append(f"essential {slug}: works_with pill '{e2}' shares no interaction claim")
    if viol:
        return False, ("entity pill(s) NOT justified by a qualifying claim -- the essentials[]-union "
                       "leak produces exactly this: " + "; ".join(viol[:6])
                       + (f" (+{len(viol) - 6} more)" if len(viol) > 6 else ""))
    total = sum(len(r.get("restore", [])) for r in artifact.get("conditions", {}).values())
    total += sum(len(r.get("conditions", [])) + len(r.get("works_with", []))
                 for r in artifact.get("essentials", {}).values())
    return True, f"all {total} entity pills trace to a qualifying directed/interaction claim (no union leak)"


def check_entity_pills_justified():
    """Every PILL on a generated entity
    page (a condition's restore nutrients, an essential's help-with conditions + works-with
    partners) traces to a qualifying source claim. The essentials[]-union leak produces exactly
    an UNjustified pill -- a nutrient flattened in from a DIFFERENT condition in a multi-condition
    claim -- so this gate recomputes the directed maps() + interaction relations INDEPENDENTLY
    from the corpus projection and RED-flags any posted pill with no backing (defense in depth
    beyond derived_artifacts_fresh, which only proves the artifact matches the generator). Truth
    anchor: entity-page-data.json pills x an independent re-derivation from corpus-embed claims,
    recomputed each run."""
    artifact = json.loads((ROOT / "dashboard" / "assets" / "data" / "entity-page-data.json")
                          .read_text(encoding="utf-8"))
    embed = json.loads((ROOT / "dashboard" / "assets" / "data" / "corpus-embed.json")
                       .read_text(encoding="utf-8"))
    return _entity_pills_justified_impl(artifact, embed)


def _no_positional_hero_impl(artifact, embed_claims, view_files):
    """RED if a curated primary slot is auto-filled by a reference-table row, or an entity view
    chooses its hero by array position. `artifact` = entity-page-data dict; `embed_claims` =
    id->claim (carries base_line_table); `view_files` = iterable of (relpath, text).
    Param-taking for the negative test."""
    viol = []
    conds = artifact.get("conditions", {})
    for slug, rec in conds.items():
        for cid in rec.get("protocol_claim_ids", []):
            if embed_claims.get(cid, {}).get("base_line_table"):
                viol.append(f"condition {slug}: base-line-table row {cid} in curated primary (protocol_claim_ids)")
    view_files = list(view_files)
    for rel, text in view_files:
        src = _strip_ts_comments(text)
        for m in _POSITIONAL_HERO_RE.finditer(src):
            viol.append(f"{rel}: positional hero {m.group(0)!r} (choose the primary by explicit "
                        "prominence, never array position)")
    if viol:
        return False, ("prominence rule broken (a reference-table row auto-filled a curated primary "
                       "slot, or the hero is chosen by array position): " + "; ".join(viol[:6]))
    return True, (f"prominence holds: no base-line-table row in any curated primary across {len(conds)} "
                  f"conditions; no positional-hero pattern in {len(view_files)} entity-view file(s)")


def check_no_positional_hero():
    """Prominence: the entity page's CURATED
    PRIMARY 'what to do' slot is never auto-filled by a reference-table row, and the hero/primary
    claim is never chosen by array position. DATA half (binds now): no condition's
    protocol_claim_ids contains a base-line-program / dose-table claim. VIEW half (surface-scoped
    to the views listed in _ENTITY_VIEW_FILES, and BINDING on them): no `claims[0]`/`record[0]`
    hero pattern. Truth anchor: entity-page-data.json protocol_claim_ids x corpus-embed
    base_line_table + the entity-view .ts bytes, recomputed each run."""
    artifact = json.loads((ROOT / "dashboard" / "assets" / "data" / "entity-page-data.json")
                          .read_text(encoding="utf-8"))
    embed = json.loads((ROOT / "dashboard" / "assets" / "data" / "corpus-embed.json")
                       .read_text(encoding="utf-8"))
    files = []
    for rel in _ENTITY_VIEW_FILES:
        p = ROOT / rel
        if p.exists():
            files.append((rel, p.read_text(encoding="utf-8")))
    return _no_positional_hero_impl(artifact, embed.get("claims", {}), files)


def _entity_page_enriched_matches_search_impl(artifact, search_index):
    """RED if any condition/essential PAGE's enriched ("Worth Knowing") claim set differs from the
    set SEARCH finds for that entity. `artifact` = entity-page-data dict; `search_index` =
    search-index dict. Param-taking for the negative test.

    claimsForSubject (state/search.ts) = every search claim whose subject == slug OR whose
    also_about includes slug. The page's `search` sections (entity_page_derive.search_sections)
    MUST enumerate EXACTLY that set. A subset means the page shows fewer enriched claims than search
    surfaces (the recurring "search > page" defect); a superset means the page lists a claim search
    cannot reach. Recomputed independently here so a regression in the generator's predicate is
    caught even though derived_artifacts_fresh (artifact == generator output) stays green."""
    for_subject: dict = {}
    for c in search_index.get("claims", []):
        cid = c.get("id")
        subj = c.get("subject")
        targets = set()
        if subj:
            targets.add(subj)
        targets.update(c.get("also_about", []))
        for t in targets:
            for_subject.setdefault(t, set()).add(cid)

    viol = []
    checked = 0
    for kind in ("conditions", "essentials"):
        for slug, rec in artifact.get(kind, {}).items():
            expected = for_subject.get(slug, set())
            page = set()
            for sec in rec.get("search", []):
                page.update(sec.get("claim_ids", []))
            checked += 1
            missing = expected - page          # in search, NOT on the page (the reported defect)
            extra = page - expected            # on the page, NOT reachable by search
            if missing or extra:
                bits = []
                if missing:
                    bits.append(f"{len(missing)} in search but not on page (e.g. {sorted(missing)[0]})")
                if extra:
                    bits.append(f"{len(extra)} on page but not in search (e.g. {sorted(extra)[0]})")
                viol.append(f"{kind[:-1]} {slug}: " + ", ".join(bits))
    if viol:
        return False, ("entity page enriched set != claimsForSubject (search > page defect): "
                       + "; ".join(viol[:6])
                       + (f" (+{len(viol) - 6} more)" if len(viol) > 6 else ""))
    return True, (f"all {checked} condition/essential pages list EXACTLY the enriched claims search "
                  "finds for them (page.search == claimsForSubject, subject OR also_about)")


def check_entity_page_enriched_matches_search():
    """Every condition/essential page's "Worth Knowing" (enriched) section enumerates EXACTLY the
    claims the live search finds for that entity -- state/search.ts::claimsForSubject (subject OR
    also_about). The page and the search derive the "claims about this entity" set by two separate
    code paths (entity_page_derive.search_sections vs search.ts), and they silently drifted: the
    page used subject-only, so over a thousand also_about claim-instances were findable in search
    yet absent from their own pages. The rule: no entity page may ever show fewer claims than its
    own search. This recomputes claimsForSubject independently from the shipped index and RED-flags
    any page whose enriched set differs. Truth anchor: entity-page-data.json search sections x an
    independent claimsForSubject re-derivation from search-index.json, recomputed each run."""
    artifact = json.loads((ROOT / "dashboard" / "assets" / "data" / "entity-page-data.json")
                          .read_text(encoding="utf-8"))
    search_index = json.loads((ROOT / "dashboard" / "assets" / "data" / "search" / "search-index.json")
                              .read_text(encoding="utf-8"))
    return _entity_page_enriched_matches_search_impl(artifact, search_index)


# --- Dead-code gate ---------------------------------------------------------
# knip (dashboard/knip.json, configured with the real entry graph: main.ts + tests) is run here
# as a board gate so an orphaned export/file/type can never ship silently. A detector that only
# sits in package.json as an npm script is not enforcement: hand audits repeatedly missed the
# orphaned code a removed feature left behind, until knip was wired into the board.
_KNIP_BASELINE = ROOT / "dashboard" / "knip-baseline.json"


def _knip_run():
    """Run knip's JSON reporter from dashboard/; parsed dict, or None if the toolchain is absent."""
    import subprocess, shutil
    dash = ROOT / "dashboard"
    if not (dash / "node_modules" / "knip").exists():
        return None
    npx = shutil.which("npx") or shutil.which("npx.cmd")
    if npx is None:
        return None
    try:
        res = subprocess.run([npx, "knip", "--reporter", "json"], cwd=str(dash),
                             capture_output=True, text=True, timeout=180)
    except Exception:
        return None
    try:
        return json.loads(res.stdout)  # knip exits nonzero WHEN issues exist; JSON is still on stdout
    except Exception:
        return None


def _knip_dead_keys(data):
    """Stable <kind>|<file>|<symbol> keys for every dead-code finding (line/col excluded so a key
    survives edits above it). Covers unused files + exports + types + enum members + duplicates."""
    keys = set()
    for f in data.get("files", []) or []:
        keys.add(f"file|{f}|")
    for iss in data.get("issues", []) or []:
        rel = iss.get("file", "")
        for kind in ("exports", "types", "duplicates"):
            for e in iss.get(kind, []) or []:
                name = e.get("name") if isinstance(e, dict) else str(e)
                keys.add(f"{kind}|{rel}|{name}")
        for enum_name in (iss.get("enumMembers") or {}):
            keys.add(f"enumMembers|{rel}|{enum_name}")
    return keys


def check_no_new_dead_code():
    """Forever-gate for dead code. knip analyses the real import graph (main.ts +
    tests); this gate RED-flags any unused file/export/type NOT frozen in the ratchet baseline
    (dashboard/knip-baseline.json), so a removed feature can never leave orphaned code behind
    unnoticed again. The baseline is the known migration-scaffolding debt and may only SHRINK; a
    baseline key knip no longer reports is 'resolved' (noted, never fatal). Degrades to a non-fatal
    SKIP when node/knip is absent, so the pillar-only board still runs. Truth-anchored on knip's
    own graph analysis, recomputed each run."""
    data = _knip_run()
    if data is None:
        return True, "knip/node unavailable -- dead-code gate SKIPPED (run `npm ci` in dashboard/ to enforce)"
    current = _knip_dead_keys(data)
    if not _KNIP_BASELINE.exists():
        return False, "dashboard/knip-baseline.json missing -- generate it before enforcing"
    baseline = set(json.loads(_KNIP_BASELINE.read_text(encoding="utf-8")).get("accepted", []))
    new_dead = sorted(current - baseline)
    if new_dead:
        show = "; ".join(new_dead[:6]) + (f" (+{len(new_dead) - 6} more)" if len(new_dead) > 6 else "")
        return False, f"NEW dead code not in knip-baseline.json ({len(new_dead)}): {show}"
    resolved = len(baseline - current)
    tail = f"; {resolved} baseline key(s) resolved -- prune when convenient" if resolved else ""
    return True, f"no new dead code -- {len(current)} known item(s), all baselined{tail}"


# ---------------------------------------------------------------------------
# workspace-coverage.css dead-rule fence
# ---------------------------------------------------------------------------
# WHY THIS GATE EXISTS. workspace-coverage.css had accreted TWO whole superseded UI
# generations (the coverage-hero/coverage-stat/coverage-console/goal-chip layout and the
# regimen-rail/regimen-item protocol rail) plus a deleted footer -- 51 class rules,
# ~425 lines that NO live code referenced and only demos under temporary/ still pulled in,
# so those demos rendered ancient, revamped-away styling. Nothing caught it: knip
# (no_new_dead_code) reads the TS/JS entry graph and is structurally BLIND to CSS-rule
# liveness. This gate is that fence: every class-bearing selector in the sheet must
# trace to a LIVE reference, or sit on the allowlist WITH A REASON. It REDs the moment a revamp orphans a rule, or a dead rule is pasted back from a
# demo.
#
# FALSE-POSITIVE TRAPS THIS CLASSIFIER MUST NOT FALL INTO (each one cost a real debugging
# pass during the audit that built this gate):
#   1. SUBSTRING. `.coverage-stat` lives inside the filename coverage-status.ts -> bounded
#      tokens only, over the class-char alphabet [A-Za-z0-9_-].
#   2. DATA-DRIVEN CLASSES. `.essentials-grid--minerals` / `.tile--vitamin` reach the DOM as
#      gridClass/tileClass VALUES in coverage-layout-data.json, never as a code literal.
#   3. DYNAMIC CONSTRUCTION. `tile--${fam}` builds `.tile--vitamin` from the stub 'tile--'.
#   4. PROSE / COMMENT CONTAMINATION. creators-log-embed.json (inlined into dist) and code
#      comments NAME dead classes in changelog text; a class mentioned only there is NOT a
#      reference. Comments are stripped before matching.
# The classifier is deliberately CONSERVATIVE on the live side (a bare identifier run counts
# as live): its job is to catch a wholly-orphaned rule, never to cry wolf on a class that is
# merely hard to see. The exhaustive audit -- not this gate -- is what proved those rules dead.

_WC_CSS_REL = "dashboard/assets/styles/workspace-coverage.css"

# Intentionally-dormant styling kept in the sheet ON PURPOSE. Each key is a class token that
# is currently unreferenced BY DESIGN, with the reason it stays. This is not a blanket
# names specific tokens, so adding any NEW dead class still REDs the gate.
_WC_DEAD_RULE_ALLOWLIST = {
    "is-foundation":  "plant-derived FOUNDATION-block marker. The THIRD tile state is "
                      "designed but the coverage view does not yet apply the class; kept "
                      "as a wire-up-later hook. Delete both this entry and the .is-foundation rule "
                      "together if the concept is dropped.",
}


def _wc_live_class_refs():
    """Bounded-token live set + dynamic-construction stubs from COMMENT-STRIPPED src+html.
    Returns (runs, stubs). A class is live if it is a whole token in `runs` or starts with a
    stub. Comments are stripped so a class named only in a code comment is not a false ref."""
    texts = []
    src = ROOT / "dashboard" / "assets" / "js" / "src"
    if src.exists():
        for p in src.rglob("*.ts"):
            if p.name.endswith(".test.ts"):
                continue
            try:
                s = p.read_text(encoding="utf-8", errors="replace")
            except Exception:
                continue
            s = re.sub(r"/\*[\s\S]*?\*/", " ", s)      # block comments
            s = re.sub(r"(?<!:)//[^\n]*", " ", s)      # line comments (spare ://)
            texts.append(s)
    html = ROOT / "dashboard" / "dashboard.html"
    if html.exists():
        texts.append(re.sub(r"<!--[\s\S]*?-->", " ",
                            html.read_text(encoding="utf-8", errors="replace")))
    runs = set()
    stubs = set()
    for t in texts:
        runs |= set(re.findall(r"[A-Za-z0-9_-]+", t))
        for m in re.finditer(r"([A-Za-z0-9_-]*[-_])\$\{", t):      # `prefix-${`
            stubs.add(m.group(1))
        for m in re.finditer(r"['\"]([A-Za-z0-9_-]*[-_])['\"]\s*\+", t):  # 'prefix-' +
            stubs.add(m.group(1))
    return runs, {s for s in stubs if len(s) >= 3}


def _wc_data_class_refs():
    """Class tokens injected via DATA. Two legitimate channels: (1) a field whose whole
    value IS a class (gridClass/tileClass in the coverage-layout family), (2) a class="..."
    fragment in a copy/content JSON. Prose-heavy embeds (corpus/creators-log) are skipped so
    a changelog that merely names a dead class is not counted."""
    refs = set()
    data = ROOT / "dashboard" / "assets" / "data"
    layout = ("coverage-layout-data.json", "coverage-layout-skeleton.json",
              "efa-coverage-data.json", "pdm-coverage-data.json")
    for name in layout:                       # channel 1: whole-value class fields
        p = data / name
        if not p.exists():
            continue
        t = p.read_text(encoding="utf-8", errors="replace")
        for m in re.finditer(r'"([A-Za-z0-9_ -]{1,80})"', t):
            for tok in m.group(1).split():
                if re.match(r"^-?[_a-zA-Z][_a-zA-Z0-9-]*$", tok):
                    refs.add(tok)
    if data.exists():                         # channel 2: class="..." in copy/content json
        skip = {"corpus-embed.json", "creators-log-embed.json"}
        for p in data.rglob("*.json"):
            if p.name in skip:
                continue
            try:
                t = p.read_text(encoding="utf-8", errors="replace")
            except Exception:
                continue
            for m in re.finditer(r'class=\\?["\']([^"\'\\]+)', t):
                refs.update(m.group(1).split())
    return refs


def _wc_selector_classes(css_text):
    """Every class token that appears in a SELECTOR (the prelude before a `{`). Brace-walk
    with string-skipping so a `{`/`}`/`;` inside a value can't confuse the scan, and so a
    declaration (ends at `;`) is never mistaken for a selector."""
    t = re.sub(r"/\*.*?\*/", " ", css_text, flags=re.S)   # strip CSS comments
    classes = set()
    buf = []
    i, n = 0, len(t)
    while i < n:
        c = t[i]
        if c in "\"'":
            q = c
            i += 1
            while i < n and t[i] != q:
                if t[i] == "\\":
                    i += 1
                i += 1
            i += 1
            continue
        if c == "{":
            for cl in re.findall(r"\.(-?[_a-zA-Z][_a-zA-Z0-9-]*)", "".join(buf)):
                classes.add(cl)
            buf = []
            i += 1
            continue
        if c in "};":
            buf = []
            i += 1
            continue
        buf.append(c)
        i += 1
    return classes


def _wc_keyframe_orphans(css_text, all_css_texts):
    """@keyframes DEFINED in this sheet but referenced by no animation:/animation-name: in
    ANY shipped stylesheet. Deleting a rule can orphan the keyframe it animated, which a
    class-liveness scan alone would never see."""
    defined = set(re.findall(r"@keyframes\s+([A-Za-z0-9_-]+)", css_text))
    used = set()
    for t in all_css_texts:
        for m in re.finditer(r"animation(?:-name)?\s*:\s*([^;]+);", t):
            used |= set(re.findall(r"[A-Za-z0-9_-]+", m.group(1)))
    return sorted(defined - used)


def _workspace_coverage_no_dead_rules_impl(css_text, runs, stubs, data_refs, all_css_texts,
                                           allowlist):
    """Pure core: RED if a class-selector rule (or a defined-here keyframe) is dead and not
    allowlisted. Split out so the negative test can feed a synthetic dead class."""
    classes = _wc_selector_classes(css_text)
    dead = []
    for cl in sorted(classes):
        if cl in runs:
            continue
        if cl in data_refs:
            continue
        if any(cl.startswith(s) for s in stubs):
            continue
        dead.append(cl)
    unexpected = [c for c in dead if c not in allowlist]
    kf_orphans = _wc_keyframe_orphans(css_text, all_css_texts)
    problems = []
    if unexpected:
        problems.append(
            "dead class rule(s) with no live reference in dashboard/dashboard.html, the "
            "coverage-layout "
            "data/dynamic construction -- delete them, or if intentionally dormant add to "
            "_WC_DEAD_RULE_ALLOWLIST with a reason: "
            + ", ".join("." + c for c in unexpected))
    if kf_orphans:
        problems.append("orphaned @keyframes (defined here, animated nowhere): "
                        + ", ".join(kf_orphans))
    if problems:
        return False, " | ".join(problems)
    allow = ", ".join("." + c for c in sorted(allowlist)) or "none"
    return True, (f"{len(classes)} class selector(s) all trace to a live reference; "
                  f"{len(allowlist)} intentional-dormant allowlisted ({allow}); "
                  f"keyframes all animated")


def check_workspace_coverage_no_dead_rules():
    """FENCE: no class-selector rule in workspace-coverage.css may be dead. A rule is dead
    when none of its class tokens is referenced by any LIVE surface --
    src/**/*.ts (non-test, comment-stripped), dashboard.html, a class-valued field in the
    coverage-layout data family, or dynamic `prefix-${...}` construction. Deliberately dormant classes are
    allowlisted WITH REASONS in _WC_DEAD_RULE_ALLOWLIST (read the dict for the current set);
    a NEW dead class,
    or a keyframe defined-here-and-animated-nowhere, REDs the board. Scope is class rules +
    this sheet's keyframes -- NOT custom-property/@font-face liveness, which cannot be judged
    from one sheet: a single design token is read THROUGH by dozens of rules spread across
    every stylesheet, so its absence here proves nothing. Truth anchor: the sheet's bytes vs the live
    reference surface, re-derived each run."""
    css_path = ROOT / _WC_CSS_REL
    if not css_path.exists():
        return False, f"{_WC_CSS_REL} missing"
    css = css_path.read_text(encoding="utf-8", errors="replace")
    runs, stubs = _wc_live_class_refs()
    data_refs = _wc_data_class_refs()
    all_css = []
    styles = ROOT / "dashboard" / "assets" / "styles"
    if styles.exists():
        for p in styles.glob("*.css"):
            try:
                all_css.append(p.read_text(encoding="utf-8", errors="replace"))
            except Exception:
                continue
    return _workspace_coverage_no_dead_rules_impl(css, runs, stubs, data_refs, all_css,
                                                  _WC_DEAD_RULE_ALLOWLIST)


INVARIANTS = [
    Invariant(
        name="no_new_dead_code",
        anchor_class="consistency",  # our file A vs our file B — catches drift, not a born-wrong value
        description="knip (real entry graph) finds zero unused file/export/type beyond the ratchet baseline -- a removed feature can't leave orphaned code silently",
        check_fn=check_no_new_dead_code,
        truth_anchor="npx knip --reporter json over dashboard/ vs dashboard/knip-baseline.json",
        severity="critical",
        lesson_ref="2026-07-13 dead-code incident -- Corpus/Doctrine tab code survived removal + multiple audits because knip was configured-but-unenforced",
    ),
    Invariant(
        name="safe_write_canary",
        anchor_class="external",  # os.read WITH O_BINARY returns the true disk bytes, independent of whatever translation the write applied. Without that flag it shared the write's translation and was not external at all — it was green for weeks BECAUSE of the defect.
        description="safe_write must round-trip LF, CRLF and a lone CR byte-exact, and report a true BYTE count",
        check_fn=check_safe_write_canary,
        truth_anchor="tools/canaries/safe-write-probe.txt raw bytes via os.open(O_BINARY) + os.read",
        severity="critical",
        lesson_ref="the newline round-trip made safe_write's own verify a tautology, and this gate's reader shared the same defect until it was forced to read raw disk bytes",
    ),
    Invariant(
        name="tools_py_parse",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="All .py files in tools/ must parse via ast",
        check_fn=check_tools_py_parse,
        truth_anchor="Python ast.parse",
        severity="critical",
        lesson_ref="an editing tool silently truncated a .py source file mid-write",
    ),
    Invariant(
        name="tools_no_null_bytes",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="All .py files in tools/ must contain zero NUL bytes",
        check_fn=check_tools_no_null_bytes,
        truth_anchor="byte-level scan via Path.read_bytes()",
        severity="critical",
        lesson_ref="a writing tool padded a .py source file with trailing NUL bytes; the file passed size and cat checks but failed ast.parse",
    ),
    Invariant(
        name="critical_json_parse",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="All JSON files in dashboard/assets/data must parse (the scan list still names a schemas/ directory that no longer exists; that leg is a no-op)",
        check_fn=check_critical_json_parse,
        truth_anchor="json.loads",
        severity="critical",
        lesson_ref="a generated JSON artifact was silently truncated mid-write and nothing noticed until it failed to parse at runtime",
    ),
    Invariant(
        name="views_state_no_inline_data",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="§00.B — no array/object literal > 10 elements in views/ or state/ (canonical data lives in assets/data/ behind Zod)",
        check_fn=check_views_state_no_inline_data,
        truth_anchor="dashboard/assets/js/src/{views,state}/**/*.ts literal scan",
        severity="critical",
        lesson_ref="91 hardcoded tile specs shipped inline in views/coverage.ts; a lint warning did not stop it, so it was promoted to a blocking gate",
    ),
    Invariant(
        name="cross_platform_python",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="Scan tools/*.py for cross-platform anti-patterns (encoding-less open, %-I strftime, utcnow, python3 literal)",
        check_fn=check_cross_platform_python,
        truth_anchor="AST parse of every tools/*.py, recomputed each run — the codified anti-patterns are matched on the parse tree, not on source text",
        severity="warning",
        lesson_ref="a cp1252 decode crash and a %-I strftime crash, both invisible on Linux, the first time the toolchain ran on Windows",
    ),
    Invariant(
        name="no_native_dialogs",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="dashboard.html must not use native alert() / confirm() / prompt(). KNOWN SCOPE LIMIT: dashboard.html is now a pure shell with one external <script> and no inline JS, so this gate is currently VACUOUS — the app's JS lives in src/*.ts and dist/main.js, neither of which it reads",
        check_fn=check_no_native_dialogs,
        truth_anchor="dashboard.html scan for unparenthesized alert/confirm/prompt call sites",
        severity="warning",
        lesson_ref="a blocking native dialog is unstyleable and unthemeable, freezes the page, and breaks the accessibility flow; the rule was broken twice under discipline alone, so it became a gate",
    ),
    Invariant(
        name="no_product_marketing_prose",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="the product surfaces are composition-only -- the slim vault (regimen-label-lookup.json) under a strict key-allowlist + the rich display artifact (product-detail-data.json) scanned for any marketing-prose key anywhere; prose can never re-enter",
        check_fn=check_no_product_marketing_prose,
        truth_anchor="strict key-allowlist over regimen-label-lookup.json + recursive marketing-key scan over product-detail-data.json (both generated), recomputed each run",
        severity="critical",
        lesson_ref="a previous product subsystem carried scraped Youngevity marketing prose that contaminated the corpus. Deleting that subsystem removed the leak; this gate is what keeps prose from re-entering the vault, because severing a source without enforcing the boundary only delays the next leak.",
    ),
    Invariant(
        name="no_external_style_resources",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="dashboard.html + dashboard/assets/styles/*.css must not import external fonts/CSS/scripts",
        check_fn=check_no_external_style_resources,
        truth_anchor="static regex scan against fonts.googleapis.com / fonts.gstatic.com / cdn.jsdelivr.net / cdnjs / unpkg / pro.fontawesome.com / external <link>+<script>+@import",
        severity="critical",
        lesson_ref="long-term portability requires zero external resources: the app opens from file:// and must never depend on a host that can disappear. Promoted warn → critical once the OCR engine was vendored locally.",
    ),
    Invariant(
        name="css_comment_no_premature_close",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="no shipped stylesheet has a '*/' inside a comment body that closes the comment early and silently drops the rule after it",
        check_fn=check_css_comment_no_premature_close,
        truth_anchor="comment/string-state tokenizer scan of the git-tracked dashboard/assets/styles/*.css, recomputed each run",
        severity="critical",
        lesson_ref="a token glob written with a trailing star-slash inside a theme.css comment closed the comment early and silently dropped the rule after it (.rr-btn--danger) while the board stayed green; it was caught only by reading the live CSSOM",
    ),
    Invariant(
        name="design_system_hash_integrity",
        anchor_class="consistency",  # our file A vs our file B — catches drift, not a born-wrong value
        description="dashboard/assets/styles/design-system.css hash matches design-system.golden.sha256",
        check_fn=check_design_system_hash_integrity,
        truth_anchor="LF-normalized SHA-256 of design-system.css vs the golden file, recomputed each run. Do not hardcode a hash in prose — read the file. LF-normalization is load-bearing: hashing RAW bytes anchors the seal to whatever line endings the sealing machine happened to have, so the gate goes green only there and REDs on every fresh clone.",
        severity="critical",
        lesson_ref="the sealed-pillar pattern applied to design tokens: a hash cannot be talked out of a mismatch",
    ),
    Invariant(
        name="design_system_write_protection",
        anchor_class="external",  # git-committed golden — the anchor OUTSIDE the css/golden pair
        description="design-system.css's golden hash may not be silently re-sealed: the working *.golden.sha256 must equal the git-committed one, so an edit to the css plus a re-seal cannot hide itself (user-only-writer rule)",
        check_fn=check_design_system_write_protection,
        truth_anchor="`git show HEAD:dashboard/assets/styles/design-system.golden.sha256` vs the working golden — git-committed history is the anchor OUTSIDE the css/golden pair, so editing the css AND re-sealing cannot hide it (hash_integrity is blind to that by construction). Fails closed if git is unreachable.",
        severity="critical",
        lesson_ref="the sealed-pillar write-protection pattern applied to the design system: reads are free, writes are the owner's",
    ),
    Invariant(
        name="dashboard_dist_fresh",
        anchor_class="consistency",  # our file A vs our file B — catches drift, not a born-wrong value
        description="dashboard/assets/js/dist/main.js must be newer than every src/**/*.ts file (build artifact is the runtime contract)",
        check_fn=check_dashboard_dist_fresh,
        truth_anchor="mtime(dist/main.js) vs max(mtime(src/**/*.ts)) — stale dist means the runtime is behind the source",
        severity="warning",
        lesson_ref="a committed build artifact must not be stale relative to its source; otherwise the shipped runtime contract does not match the canonical .ts truth",
    ),
    Invariant(
        name="creators_log_well_formed",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="every line of chronicle/creators-log/log.jsonl is a schema-valid Creator's Log entry (id/ts/surface/kind/summary, allowlisted kind, summary<=280)",
        check_fn=check_creators_log_well_formed,
        truth_anchor="tools/creators_log.py::verify_file() applied to chronicle/creators-log/log.jsonl — the same validator the CLI writer uses",
        severity="warning",
        lesson_ref="the audit trail must stay machine-valid so the app can ingest it at boot; a second validation layer over the CLI writer's write-time check, because a hand-edited line would otherwise reach the ledger unvalidated",
    ),
    Invariant(
        name="creators_log_append_only",
        anchor_class="external",  # git-committed history: the working tree cannot rewrite HEAD without a commit the user can see
        description="the Creator's Log ledger is append-only — committed entries are never deleted, truncated, edited, or reordered (sacred covenant)",
        check_fn=check_creators_log_append_only,
        truth_anchor="git show HEAD:chronicle/creators-log/log.jsonl must be a line-prefix of the working file — git-committed history is the immutable anchor",
        severity="critical",
        lesson_ref="the ledger is append-only by covenant: a broad delete authorization never includes it. This is the git-anchored teeth that block any removal or mutation of a past entry.",
    ),
    Invariant(
        name="build_log_append_only",
        anchor_class="external",  # git-committed history
        description="chronicle/build-log.md is append-only — committed lines are never deleted, truncated, edited, or reordered (appends always allowed)",
        check_fn=check_build_log_append_only,
        truth_anchor="git show HEAD:chronicle/build-log.md must be a line-prefix of the working file — git-committed history is the immutable anchor",
        severity="critical",
        lesson_ref="the build log had no append-only teeth — only write discipline — so a rewrite could silently truncate it. Mirrors creators_log_append_only so the public-teaching log layer is git-anchored too; a deliberate archival split must re-anchor in the same patch.",
    ),
    Invariant(
        name="no_dead_legacy_paths",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="no live code/data/active-doc references a severed pre-Eden legacy path (wallach-books, books-clean, wallach-refresh, transcripts-clean, podcast-transcripts, wallach-topic-notes, youngevity-product-notes, health-resources, catalog-index, corpus-index)",
        check_fn=check_no_dead_legacy_paths,
        truth_anchor="git ls-files contents scanned each run; immutable history (chronicle/, generated dist/, the embedded Creator's-Log block) allowlisted -- it records the past, it is not a live reference",
        severity="critical",
        lesson_ref="the pre-Eden chain -- old book PDFs, a transcript scraper, and the ingredient/stance generators that fed off them -- was still poisoning the system, even feeding stale book text into the live dashboard. Severing it was not enough on its own: this guard turns 'never referenced again' from an intention into a machine check.",
    ),
    Invariant(
        name="no_operating_doc_contradiction",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="no operating doc (CLAUDE.md, REVIEW.md, .claude/skills/*/SKILL.md) names an overhaul-DELETED structure (legacy dashboard js/css/host, the wild-west-mode rule) as live, nor points at a non-existent .claude/skills/<name> or legacy .claude/rules/*.md file; the semantic 'contradicts the Charter's substance' half is a labeled WISH resting on review discipline",
        check_fn=check_no_operating_doc_contradiction,
        truth_anchor="operating-doc bytes + os-level existence of every cited skill or legacy rule pointer, scanned each run; living/planning docs (anything under chronicle/) are OUT of scope -- they narrate the deletions in past tense",
        severity="critical",
        lesson_ref="the rules that guide the work rot too. After the legacy-dashboard sever and the wild-west-mode deletion, a machine gate keeps any operating doc from silently pointing a future reader at a structure that no longer exists. Extends no_dead_legacy_paths from live code to the doc surface; the semantic contradiction half stays a labeled WISH, because no machine check for it survives being gamed.",
    ),
    Invariant(
        name="board_claims_match_reality",
        anchor_class="consistency",  # our file A vs our file B — catches drift, not a born-wrong value
        description="CLAUDE.md's 'what a green board actually means' section states the live gate total and the external-anchor count; both must be PRESENT and match the INVARIANTS registry (a reworded claim is RED, never a silent pass)",
        check_fn=check_board_claims_match_reality,
        truth_anchor="len(INVARIANTS) + the anchor_class census vs CLAUDE.md bytes, recomputed each run",
        severity="critical",
        lesson_ref="gates were added to the board while CLAUDE.md went on quoting the older totals. The contract's own account of what a green board is WORTH had drifted, in the one section that exists to stop the total being oversold as evidence about Wallach.",
    ),
    Invariant(
        name="creators_log_digest_synced",
        anchor_class="consistency",  # our file A vs our file B — catches drift, not a born-wrong value
        description="LOG.md equals the deterministic render of log.jsonl (the human view never drifts from the canonical ledger)",
        check_fn=check_creators_log_digest_synced,
        truth_anchor="tools/creators_log.py::render_digest() vs chronicle/creators-log/LOG.md",
        severity="warning",
        lesson_ref="Creator's Log sacred covenant — the generated human digest must always tell the same truth as the canonical jsonl; a hand-edit or missed regen is caught here",
    ),
    Invariant(
        name="creators_log_embed_synced",
        anchor_class="consistency",  # our file A vs our file B — catches drift, not a born-wrong value
        description="the dashboard build-time embed (dashboard/assets/data/creators-log-embed.json) equals the canonical ledger parsed to a JSON array (the in-app Creator's Log never drifts from log.jsonl)",
        check_fn=check_creators_log_embed_synced,
        truth_anchor="json.loads(dashboard/assets/data/creators-log-embed.json) == tools/creators_log.py::read_entries() over chronicle/creators-log/log.jsonl",
        severity="warning",
        lesson_ref="the file:// app inlines the ledger at build; this catches a stale build or hand-edit that would make the in-app Profile log lie",
    ),
    Invariant(
        name="creators_log_bundle_synced",
        anchor_class="consistency",  # our file A vs our file B — catches drift, not a born-wrong value
        description="the BUILT bundle the browser loads (dashboard/assets/js/dist/main.js) carries the CURRENT ledger head — esbuild inlines the embed at build, so a log append without a rebuild leaves the in-app Profile log silently stale",
        check_fn=check_creators_log_bundle_synced,
        truth_anchor="the newest chronicle/creators-log/log.jsonl entry id appears verbatim in dashboard/assets/js/dist/main.js (the esbuild-inlined artifact the file:// app actually loads) — checks the BUILT artifact, not a source-vs-source pair",
        severity="critical",
        lesson_ref="2026-07-02 silent-log-staleness incident — 3 round-close entries fired into the ledger + source embed but were never rebuilt into the bundle; embed_synced stayed green (source==ledger) while the Profile panel showed nothing past 17:07. §00.B #11: pin the check to the artifact the user loads, not a stale-to-stale source pair",
    ),
    Invariant(
        name="creators_log_archive_synced",
        anchor_class="consistency",  # our file A vs our file B — catches drift, not a born-wrong value
        description="the navigable archive (chronicle/creators-log/INDEX.md + digests/YYYY-MM.md) matches what regenerates from log.jsonl — full-history human fidelity (LOG.md is the recent-window view)",
        check_fn=check_creators_log_archive_synced,
        truth_anchor="tools/creators_log.py::render_index()/render_month() vs INDEX.md + digests/*.md; month set derived from log.jsonl",
        severity="warning",
        lesson_ref="as the ledger grows the full history lives in monthly digests; this keeps them and the index byte-true to the canonical jsonl so deep history never silently drifts",
    ),
    Invariant(
        name="corpus_integrity",
        anchor_class="external",  # Wallach's book .txt bytes + golden hashes
        description="eden/corpus sealed claim graph is coherent — verbatim substrings real, book hashes anchored, slugs in canon, indices an honest derivation (delegates to corpus_verify.py; BOOTSTRAP passes pre-seal)",
        check_fn=check_corpus_integrity,
        truth_anchor="eden/tools/corpus_verify.py — substring/hash checks over eden/corpus/books bytes + *.golden.sha256; deterministic, cannot lie",
        severity="critical",
        lesson_ref="the corpus is the single source of Wallach claim-truth and must fail loud on drift; sealing it is what makes every downstream number traceable",
    ),
    Invariant(
        name="corpus_runtime_purity",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="dashboard dist/main.js carries no LLM / external-network markers — the LLM lives only at extraction time; the shipped app is pure offline-static",
        check_fn=check_corpus_runtime_purity,
        truth_anchor="grep of dashboard/assets/js/dist/main.js for LLM-SDK + API-endpoint markers",
        severity="critical",
        lesson_ref="the portability guarantee: extraction may use an LLM, the runtime never may. The shipped app has no network, so an SDK marker in the bundle means the guarantee has already been broken.",
    ),
    Invariant(
        name="derived_artifacts_fresh",
        anchor_class="consistency",  # our file A vs our file B — catches drift, not a born-wrong value
        description="every GENERATED data artifact in eden/derived/MANIFEST.json equals a fresh run of its one pure generator over the sealed pillars — a hand-edit or stale build of any listed artifact is RED; generalizes the retired corpus_embed_synced, and covers whatever the manifest lists",
        check_fn=check_derived_artifacts_fresh,
        truth_anchor="for each manifest artifact: json.loads(on-disk) == generator.build_fn() re-derived from the sealed pillars each run (no stale-to-stale compare)",
        severity="critical",
        lesson_ref="hand-typed values drifted from their source roughly 200 times before this existed. One freshness gate over a manifest registry means no derived file can silently drift from the pillars. Replaces the standalone corpus_embed_synced, folded in.",
    ),
    Invariant(
        name="amounts_wallach_only",
        anchor_class="external",  # known physical constants (0.3 / 0.025 / 0.67, 154/100) + the sealed claim dose. NOTE: only the CONSTANTS are external; the base amount rests on dose_amount_in_verbatim
        description="every numeric coverage target in essentials-targets-data.json carries a source_claim_id resolving to a sealed Wallach dose claim that maps the essential (§00.A) -- a Youngevity-sourced or unsourced amount is RED",
        check_fn=check_amounts_wallach_only,
        truth_anchor="dashboard/assets/data/essentials-targets-data.json numeric targets x sealed corpus dose claims (eden/corpus/claims/*), joined by essentials-canon layout_key->slug, recomputed each run",
        severity="critical",
        lesson_ref="targets used to sum Youngevity Healthy Body Start Pak labels, which let a supplement vendor define the recommended amounts. Now every number is a Wallach dose claim carrying its source_claim_id: Youngevity contributes composition, never a target.",
    ),
    Invariant(
        name="dose_amount_in_verbatim",
        anchor_class="external",  # the claim's own verbatim bytes, which corpus_integrity pins to the book
        description="every claim's structured dose.amount is literally present in that claim's OWN verbatim -- unit-adjacent, scoped to the claim's own table row, and (where for_condition names the column) at the right column index. This is the link that was missing: amounts_wallach_only anchors a target to the CLAIM's dose field, which is ours; this anchors that field to the book text",
        check_fn=check_dose_amount_in_verbatim,
        truth_anchor="the claim's own verbatim bytes -- which corpus_integrity independently pins to the sealed book .txt. corpus_integrity proves the quote is the book's; this proves the number is the quote's; amounts_wallach_only proves the target is the number's. Recomputed each run.",
        severity="critical",
        lesson_ref="PROVEN by experiment: a planted 10x sodium fabrication (3,300 -> 33,000 mg) passed the ENTIRE board green while the claim's verbatim still read '3,300 mg' -- nothing tied dose.amount to the book. Adversaries then broke the first design 3 ways (cross-row bleed 72/86; a 1000x choline mg->mcg swap off chromium's row; in-row column bleed), all closed by row-scoping + positional column checks and pinned in tools/tests/test_dose_amount_in_verbatim.py. The board was excellent at proving nothing DRIFTED and weak at proving anything is RIGHT; this is the first gate that reads Wallach's printed number.",
    ),
    Invariant(
        name="essentials_canon_matches_graphic",
        anchor_class="external",  # the sealed authority GRAPHIC -- the first anchor the canon's membership has ever had outside our own app
        description="essentials-canon.json's MEMBERSHIP (which 91 substances, and how many per category) matches a byte-bound transcription of the sealed authority graphic (eden/graphics/90-nutrients-front.jpg — the ruled 90/91 source). Membership only; the fatty-acid sub-names deliberately diverge per an adjudicated contradiction report",
        check_fn=check_essentials_canon_matches_graphic,
        truth_anchor="the sealed JPG's raw bytes -> the transcription bound to them via source.file_sha256 -> the canon. graphics_integrity seals the image; this gate binds the transcription to the image AND the canon to the transcription. NOT proven, and labeled so: that the transcription READS the image correctly — human-verifiable only, by opening the JPG",
        severity="critical",
        lesson_ref="the canon's membership + tier partition + mineral symbols were bootstrapped from a UI DESIGN MOCKUP (dashboard/components/workspace-coverage-v3.2-PROPOSAL.html, since deleted) dated three days before the canon existed; the canon's own provenance field said so in plain text and nobody read it. The tell: rare_trace order is alphabetical BY ATOMIC SYMBOL, which is how a list is lifted off a rendered table. Every gate was blind BY CONSTRUCTION: corpus_integrity proves the canon hasn't CHANGED (sealing a fabrication makes it permanent, not correct), derived_artifacts_fresh proved the layout regenerates from the canon — guaranteed, since the canon came FROM that artifact — and graphics_integrity sha256s the JPG but cannot read membership out of an image. The membership turned out to be RIGHT (zero diff on all 4 categories, first run), which is exactly why nobody caught that it had no anchor. The graphic also prints all 60 minerals FLAT, A-Z, with no tiers — independent corroboration that FOUNDATIONAL/MAJOR TRACE/RARE TRACE is invention.",
    ),
    Invariant(
        name="regimen_state_mutation_routing",
        anchor_class="structural",  # shape + wellformedness only -- proves the five named writers exist and emit, not that what they write is correct
        description="the slot model: regimen state lives in ONE atomic document (rgSlots_v1) with ONE writer (private writeSlotDoc via setValidated, which EMITS regimen:changed). The five legacy chokepoints (persistRegimen, saveRgOverride, saveRgManual, saveRgRemoved, saveRgUserGoals) still EXIST as exports so the burning views compile; the four slot-backed ones DELEGATE to writeSlotDoc; saveRgUserGoals is the one GLOBAL chokepoint (own key + direct emit). The four retired keys (lcRegimen/rgOverrides/rgManual/rgRemoved) are never written. localStorage is touched only in core/storage.ts and never by a view",
        check_fn=check_regimen_state_mutation_routing,
        truth_anchor="the .ts bytes of state/regimen.ts + core/storage.ts + every other src/**/*.ts, scanned each run. NOT the old LS_SCHEMAS check -- that registry died with the legacy dashboard, and restoring it would assert a structure that no longer exists",
        severity="critical",
        lesson_ref="this gate was once removed 'to return next phase'. That phase landed the same day, the one after it finished, and nobody noticed for ten days -- while the operating contract stated flatly that user state persists through the chokepoint only, and the only actual enforcement was an ESLint rule at WARN, which fails nothing. A gate promised for later is a gate nobody re-checks: the deadline passes and the promise stays. It was re-codified for the single-writer slot model -- setValidated(RG_SLOTS_KEY) is the one writer, the four slot-backed chokepoints delegate, the four old keys are retired write-free -- with brace-aware body matching so the private writer can no longer be swallowed into a neighbouring export.",
    ),
    Invariant(
        name="slot_invariants",
        anchor_class="structural",  # proves the slot-system guard CODE exists; the runtime behaviour is render_probe_slots.js
        description="the slot system: SlotDocSchema enforces >=1 slot, <=4 slots, <=20 trash entries, and activeSlot-always-resolves at the Zod boundary (read AND write); writeSlotDoc re-validates on write; addSlot refuses the 5th slot with a reason; deleteSlot refuses the last slot and reassigns activeSlot (promotes a survivor). STATIC: proves the enforcing code EXISTS; the runtime behaviour is proven by tools/probes/render_probe_slots.js",
        check_fn=check_slot_invariants,
        truth_anchor="the .ts bytes of core/schemas/regimen.ts (the SlotDocSchema guards) + state/regimen.ts (the addSlot/deleteSlot refusal + promotion code), scanned each run. NOT proof the code RUNS correctly -- that is tools/probes/render_probe_slots.js on the real file:// app, and if that probe is off the board the runtime half is an unlabeled gap",
        severity="critical",
        lesson_ref="each of the four slot rules (>=1 slot, activeSlot always resolves, the 5th slot refused with a reason, mutations routed through the one writer) becomes a gate rather than a convention. The static half is here; promote-on-delete-active and activeSlot-resolves-after-delete genuinely need the runtime probe -- a Python-reads-TypeScript gate cannot observe them, and selling static presence as runtime correctness is how a fabricated value stays sealed and green.",
    ),
    Invariant(
        name="collective_doses_not_fanned",
        anchor_class="external",  # the sealed dose claims, read independently of the derive
        description="the half amounts_wallach_only is structurally blind to: a Wallach dose stated for a GROUP (dose.collective_group — e.g. 'essential fatty acids ... 9 grams per day', WAL-CLM-DDDL-000115, which maps BOTH omega-3 and omega-6) must NEVER be fanned into a per-essential number. Fanned out, one 9 g claim posts 9 g to EACH omega = 18 g of board target from a 9 g source — and R2 certifies it GREEN, because it audits each essential in isolation and both targets genuinely trace and recompute. A numeric target sourced from a collective claim is RED",
        check_fn=check_collective_doses_not_fanned,
        truth_anchor="eden/corpus/claims/* sealed dose claims carrying dose.collective_group x essentials-targets-data.json target.source_claim_id + target.low, read independently of targets_derive so a derive that starts fanning again cannot silence its own gate",
        severity="critical",
        lesson_ref="PROVEN before the gate was written: with the 9 g collective claim sealed, the derive emitted omega-3=9 g AND omega-6=9 g (18 g total) and amounts_wallach_only reported every numeric target tracing cleanly. Every existing gate passed while the board's number was double what Wallach wrote. Adjudicated in chronicle/contradictions/2026-07-15-omega-efa-target-source.md",
    ),
    Invariant(
        name="pdm_group_not_named_rare_earths",
        anchor_class="consistency",  # our copy vs our own sealed doctrine — see the honesty note
        description="The PLANT DERIVED group may not be LABELLED 'rare earth(s)' on any user-facing surface (the grouptag chip, the coverage-of caption, the layout section labels). The group is defined by HAVING NO INDIVIDUAL WALLACH DOSE, never by chemistry: Wallach header-tags exactly 15 of the 60 as rare earths in Immortality's A-Z and pointedly calls scandium 'a rare element' (:9514), NOT a rare earth — so 19 of the 34 are not rare earths by his own tagging, and naming the group after them re-commits the invented-tier sin one layer down. Prose that MENTIONS rare earths in passing is legitimate and out of scope",
        check_fn=check_pdm_group_not_named_rare_earths,
        truth_anchor="dashboard/assets/data/view-copy.json ui.kd_ep_pdm_* label fields + coverage-layout-data.json section labels. HONEST LIMIT: this is a CONSISTENCY anchor, not an external one — it pins our copy to our own doctrine. The doctrine itself is anchored externally (hk.txt:7312-7314, immortality.txt:5760-10233), but this check cannot read the books; it can only stop the label drifting back",
        severity="warning",
        lesson_ref="pdm_coverage_derive.py's docstring said 'do not rename it back' from the day the group was created, and the USER-FACING copy said 'Rare Earth Minerals' and 'of the rare-earth group goal' the entire time. The code comment governed the code; NOTHING governed the label, so the one surface a user can actually see carried the invention the work existed to delete. A rule with no gate is a WISH — and this one had already been broken where it mattered most.",
    ),
    Invariant(
        name="goal_members_actionable",
        anchor_class="consistency",  # our derive vs our canon/targets vs our TS — see the honest limit
        description="A goal may only name an essential the user can ACT on individually, because the ring MEANS 'a goal nutrient you have NOT covered' — a to-do marker. Asserts that no goal's derived `members` contains (a) a trace_pdm essential (the PLANT DERIVED 34 state no individual Wallach amount and share ONE verdict off the colloidal bottle, so a ring on one is a to-do nobody can do) or (b) a fiat-covered foundational slug (H/C/N/O — nothing to take, so no goal to set; PHOSPHORUS is deliberately NOT in that class, its covered traces to a sealed claim via target.low==0). Also: every member resolves to a real tile on the board, no goal is empty, and NO goal carries a `total` — membership is what you LOOK AT, a total is a DENOMINATOR, and the denominator is always 90. ★ THE CHECK THAT EARNS ITS KEEP: coverage_layout_derive.py's FIAT_COVERED_SLUGS must MATCH state/coverage.ts's FOUNDATIONAL_PRESENT_SLUGS — Python cannot import TypeScript, so that list is written twice, and this is the only thing watching the seam",
        check_fn=check_goal_members_actionable,
        truth_anchor="dashboard/assets/data/coverage-layout-data.json goals[].members × essentials-targets-data.json target.kind (for trace_pdm) × eden/tools/coverage_layout_derive.py FIAT_COVERED_SLUGS × dashboard/assets/js/src/state/coverage.ts FOUNDATIONAL_PRESENT_SLUGS. HONEST LIMIT: CONSISTENCY, not external. It proves membership obeys the rule and that the two fiat lists agree; it CANNOT prove the goal SET is right — the goal set is OUR curation (Wallach enumerates no 'goals') and is re-authored by hand. Only its enforcement is mechanical",
        severity="critical",
        lesson_ref="the signed-off demo STATES this rule in its own comment ('Wallach never itemises these, so they can never be named for a goal') and its own baked MEMBERSHIP then BREAKS it: STRONTIUM (a trace_pdm element) is listed under stronger-bones + less-joint-pain, off the real claim WAL-CLM-DDDL-000032. The claim is genuine; the demo's data simply was not filtered. We follow the demo's STATED rule over its generated data (a demo is the vision, not the letter) and the delta is logged for review. ★ The FIAT-DRIFT check exists because the H/C/N/O list is duplicated across a language boundary — the exact silent-divergence shape that let the mineral tiers sit sealed and green for three weeks. One source per fact, held by enforcement here because it cannot be held by construction.",
    ),
    Invariant(
        name="pdm_group_goals_wallach_sourced",
        anchor_class="external",  # recomputed from the SEALED claims, independently of the derive
        description="every goal that names the plant-derived GROUP (coverage-layout-data.json goals[].groups) traces to a sealed Wallach claim whose OWN verbatim says 'colloidal minerals' and maps one of the goal's conditions; the converse too (a dropped attribution REDs), plus every group id resolves to a layout subsection and the rule is non-vacuous. HONEST LIMIT: proves PROVENANCE, never the STANCE — a verbatim saying the complex is USELESS for X would satisfy it",
        check_fn=check_pdm_group_goals_wallach_sourced,
        truth_anchor="eden/corpus/claims/*.json sealed verbatims (themselves book-anchored by corpus_verify's verbatim-at-char_offset check) x coverage-layout-data.json goals[].groups, recomputed each run WITHOUT importing coverage_layout_derive so a derive bug cannot silence its own gate",
        severity="critical",
        lesson_ref="the question this answers is whether specific benefits can be attributed to the group as a whole. Wallach prescribes the colloidal-mineral COMPLEX by name for a large share of the goals, so the GROUP is goal-nameable even though the 34 individually are not (goal_members_actionable). The rule reads his OWN verbatim, not our `other_substances` tag: the tag over-includes single-element colloidals (colloidal CALCIUM/SELENIUM/TIN) and can be flat wrong (LETS-000152 carries it from a window that bled into BALDNESS's 'Colloidal tin'). Neighbouring-entry bleed produced 9 of 12 false positives under a 76-agent adversarial read and corrupted four character-window instruments that each returned a different answer (11/10/8 goals); reading the claim's own verbatim makes it impossible by construction. The repair that made this possible: 9 verbatims were truncated at the ~500 soft limit, cutting Wallach's colloidal sentence out of his own quote (kv=339).",
    ),
    Invariant(
        name="recommendations_not_stored",
        anchor_class="structural",  # code shape + artifact naming
        description="A recommendation list is DERIVED at read time, never STORED. Not a performance rule: it is what makes the no-zombie-recommendation guarantee structurally true rather than defended-against — 'remove an item and it reappears in recommendations' is not a feature anyone codes, and the goal→add→remove-goal→remove-item loop that produces it CANNOT exist when the list is a pure function of (goals, active slot, product DB). Asserts no rec-shaped localStorage key anywhere in src/, no rec-list artifact in assets/data/, and that state/recommender.ts is PURE (no localStorage, no core/storage import) — if the ranker COULD persist, the rule would rest on it choosing not to",
        check_fn=check_recommendations_not_stored,
        truth_anchor="dashboard/assets/js/src/**/*.ts SOURCE (key shapes + the ranker's imports) × dashboard/assets/data/*.json (artifact names). HONEST LIMIT: it proves nothing is stored under a rec-SHAPED name — a stored list under an unrelated key would slip. product-recommender-data.json is deliberately exempt: it is RANKING INPUT (composition + wholesale price), not a stored list",
        severity="warning",
        lesson_ref="the rule shipped with its gate in the same patch rather than as a WISH, because the failure is invisible: a cached rec list looks identical on screen the moment it is written and only diverges later, which is exactly the class of bug a user reports as 'items keep coming back'.",
    ),
    Invariant(
        name="kids_products_not_recommended",
        anchor_class="structural",  # code shape + our list vs the sealed pillar — see the honest limit
        description="Kids-formulated products may NEVER be offered as a RECOMMENDATION, and MUST stay discoverable in the Products database. No adult is going to take a children's formulation, so recommending one is noise; but the product is still a real catalogue item and hiding it would be a different lie. THE ASYMMETRY IS THE REQUIREMENT, so BOTH halves are asserted: state/recommender.ts::rankSources — the one function every rec surface funnels through (Coverage recs, condition pages, the element/entity detail view's BEST SOURCES) — MUST filter through isExcludedFromRecommendations; essentialSlugsByProduct, the Products-TAB database path, MUST NOT (filtering it would hide them from the catalogue where they must stay findable). Also proves every excluded product_id resolves in the sealed pillar (a typo silently un-excludes) and that at least one is a live recommender candidate (anti-vacuity — a filter over nothing certifies nothing). Function bodies are matched BRACE-AWARE so a filter in a neighbouring function cannot satisfy the scan",
        check_fn=check_kids_products_not_recommended,
        truth_anchor="dashboard/assets/data/kids-exclusion.json product_ids x eden/products/products.json (sealed pillar) for resolution, x dashboard/assets/data/product-recommender-data.json for liveness, x dashboard/assets/js/src/state/recommender.ts SOURCE for the wiring. HONEST LIMIT: this anchors the PLUMBING, not the MEMBERSHIP. It cannot prove the list is COMPLETE — that no further kids product sits unlisted rests on a manual sweep of every label image and every marketing description, plus review. Curation is a judgment; only its enforcement is mechanical",
        severity="critical",
        lesson_ref="LIVE, not hypothetical: with three goals selected, a children's product ranked #1 in the real recommender -- it wins on value precisely because it is cheap. WHY A CURATED LIST AND NOT A RULE: the Products pillar has NO audience or category field and no description at all, so nothing in the data can answer the question; membership is a judgment call, and the list records the judgment. ★ THE LINE: FORMULATED for children, not merely MARKETED to them. Two candidates proposed on marketing copy alone were rejected -- cheri-mins and strawberry-kiwi-mins carry explicitly kid-directed copy ('No more tantrums... back to playtime') but ARE the adult Plant Derived Minerals composition, chemically identical to the adult bottle, so an adult can take them. Do not re-add them by re-reading that copy. ★ A name regex is rejected on measurement, not taste: it over-fires ('Kidney & Bladder Support' matches 'kid'; FlexeoPlus says 'grandkids' and is FOR grandparents; 'Toddy' is a DRINK, not 'toddler' -- Ultra Body Toddy and Cal Toddy are adult) and under-fires. Reading 'toddy' as 'toddler' is exactly the mistake the regex would make, and a human made it first; the label refuted it.",
    ),
    Invariant(
        name="mirrors_resolve",
        anchor_class="external",  # the sealed canon's routing, read independently of the derive
        description="the 'mirrors' target kind: an essential that states NO Wallach amount and carries ANOTHER essential's verdict (cobalt -> vitamin-b12 — 'the requirement is for a cobalt complex known as cyanocobalamine or vitamin B12', immortality.txt:5882-5885; no book states an elemental cobalt amount, all 7 swept). Proves the mirror (1) names a slug, (2) that resolves in the sealed canon, (3) that is not ITSELF a mirror (no chain/cycle — coverage.ts does a single hop), (4) posts NO numeric low (a number here IS the 400 mcg elemental-cobalt defect returning, and amounts_wallach_only cannot see it because it skips non-numeric targets), and (5) that canon + artifact agree on WHICH essentials mirror. STRUCTURAL ONLY: it cannot prove cobalt SHOULD mirror B12 — that is an editorial call on a two-sided source, recorded in the contradictions doc, not certified here",
        check_fn=check_mirrors_resolve,
        truth_anchor="eden/corpus/essentials-canon.json (sealed) coverage_kind + mirrors_slug x essentials-targets-data.json target.kind/mirrors_slug/low, read independently of targets_derive so a derive bug cannot silence its own gate",
        severity="critical",
        lesson_ref="Cobalt (2026-07-15). The 400 mcg elemental cobalt target came from a B12 dose fanned across a claim mapping both slugs, and the exemption that allowed it lived in invariants.py itself ('cobalt is the metal atom at the centre of the cobalamin molecule; ... one intake described by both names') — a self-refuting chemistry assertion in gate source, where no reviewer looks for chemistry. THREE successive fixes were proposed on premises the books refuted; the mirror is the fourth and its premise is that Wallach answers this BOTH ways, so the call was escalated rather than assumed. chronicle/contradictions/2026-07-15-cobalt-elemental-vs-b12.md",
    ),
    Invariant(
        name="efa_goal_wallach_sourced",
        anchor_class="external",  # the sealed collective dose claim, recomputed independently
        description="the essential-fatty-acid coverage GOAL (efa-coverage-data.json) is Wallach's own number in a different unit (§00.A): goal.source_claim_id resolves to a sealed dose claim whose dose.collective_group matches and whose essentials ARE goal.members, and maintenance_mg recomputes exactly from that dose x 1000 (g->mg). ★ No calorie basis appears in the chain BY DESIGN — Wallach states both the 3%-of-calories rate AND the finished 9 g supplement figure, so nothing is supplied here; re-deriving 3% against the FDA 2,000-kcal standard would yield 6.67 g and OVERRULE the number he wrote. A fabricated goal, a members/claim mismatch, or arithmetic drift is RED",
        check_fn=check_efa_goal_wallach_sourced,
        truth_anchor="efa-coverage-data.json goal x the sealed collective dose claim (eden/corpus/claims/*), recomputed each run independently of efa_coverage_derive",
        severity="critical",
        lesson_ref="Omega EFA target (2026-07-15) — Wallach states ONE amount for the essential fatty acids as a category (9 g/day, WAL-CLM-DDDL-000115); omega-3 + omega-6 share it as a group, omega-9 is excluded because he never names oleic acid an EFA. The rule this encodes: supply a reference ONLY when Wallach's own words cannot produce a number, NEVER to replace one he wrote. chronicle/contradictions/2026-07-15-omega-efa-target-source.md",
    ),
    Invariant(
        name="pdm_goal_wallach_sourced",
        anchor_class="external",  # the sealed dose claim + reference product composition
        description="the trace/rare coverage GOAL (pdm-coverage-data.json) is a Wallach dose expressed in mg via composition (§00.A): goal.source_claim_id resolves to a sealed dose claim, and maintenance recomputes from that dose x the reference product's pillar composition x 154 lb — a fabricated or non-Wallach-sourced goal is RED",
        check_fn=check_pdm_goal_wallach_sourced,
        truth_anchor="pdm-coverage-data.json goal x the sealed dose claim (eden/corpus/claims/*) x the reference product composition (eden/products/products.json), recomputed each run independently of pdm_coverage_derive",
        severity="critical",
        lesson_ref="the 33 rare-earths are scored as one group against Wallach's colloidal-mineral dose (1 fl oz per 100 lb, WAL-CLM-EPIGEN-000089) expressed in mg via composition; this gate proves that goal is a Wallach dose, not a Youngevity target",
    ),
    Invariant(
        name="nutrient_resolver_parity",
        anchor_class="consistency",  # our file A vs our file B — catches drift, not a born-wrong value
        description="the runtime identity resolver (core/nutrient-resolver.ts, reading nutrient-resolver-data.json) == the Python source of truth nutrient_resolve.resolve(): the committed parity fixture is FRESH vs live resolve() AND an artifact-driven resolver reproduces resolve() on every distinct pillar substance name; with the vitest (TS == fixture) this proves the TS runtime matcher == the Python resolver (one resolution truth, no drift across the boundary)",
        check_fn=check_nutrient_resolver_parity,
        truth_anchor="every distinct (name,form) in eden/products/products.json -> nutrient_resolve.resolve() re-derived each run, compared to the committed core/__fixtures__/nutrient-resolver-fixture.json AND to an artifact-driven resolver over nutrient-resolver-data.json",
        severity="critical",
        lesson_ref="the runtime Coverage matcher was unified onto the registry resolver: state/coverage.ts held a hand-rolled string matcher independent of eden/tools/nutrient_resolve.py, so there were two resolution truths and the hand-rolled one silently dropped Thiamin -> Vitamin B1. This gate proves the single resolver cannot drift across the Python/TypeScript boundary.",
    ),
    Invariant(
        name="search_index_wellformed",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="every enriched search claim is structured (facet in the closed taxonomy, subject resolves to registry/canon, also_about resolves, answer+verbatim non-empty); TS/Python facet taxonomy in sync",
        check_fn=check_search_index_wellformed,
        truth_anchor="eden/corpus/search-enrichment.json x registry/canon/conditions via search_index_derive.validate() + the TS schema SEARCH_FACETS literal",
        severity="critical",
        lesson_ref="Search G-7 (2026-07-09) -- de-blobbed faceted search template (mercury+calcium first entities); negative test tools/tests/test_search_index_wellformed.py",
    ),
    Invariant(
        name="verbatim_names_mapped_conditions",
        anchor_class="external",  # the book-anchored verbatim
        description="every claim shown under a condition names that condition (or a registered synonym) in its verbatim; NEW violations beyond the remediation baseline block the board",
        check_fn=check_verbatim_names_mapped_conditions,
        truth_anchor="sealed shard verbatims x derived conditions index (what surfaces under a condition), name-or-synonym via the Catalog pillar (eden/catalog/conditions.json); allowlist eden/tools/verbatim-audit-baseline.json",
        severity="critical",
        lesson_ref="a quote shown under a condition must NAME it or the link is unverifiable -- indistinguishable from a hallucination. The rule regressed while it was prose rather than a machine guard.",
    ),
    Invariant(
        name="verbatim_over_soft_limit",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="informational: lists every verbatim over the 500 soft-limit (up to the 1200 hard ceiling) so allowed over-length excerpts stay visible for review; never fails (hard ceiling is corpus_verify #2)",
        check_fn=check_verbatim_over_soft_limit,
        truth_anchor="sealed shard verbatim lengths",
        severity="info",
        lesson_ref="completeness of truth outranks a character limit: the 500 cap is a load-time and file-size guard, so exceed it when the faithful excerpt needs the room -- but ALWAYS surface the over-soft cases rather than hiding them",
    ),
    Invariant(
        name="umbrella_proxy_named",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="informational: lists every umbrella condition accepted as named-by-proxy because the verbatim names a child subtype (leukemia->cancer) via the Catalog pillar (eden/catalog/conditions.json, umbrella_of); keeps a human eye on each exception; never fails",
        check_fn=check_umbrella_proxy_named,
        truth_anchor="the Catalog pillar umbrella_of (eden/catalog/conditions.json) x sealed shard verbatims x conditions index",
        severity="info",
        lesson_ref="specific subtypes keep their own tags AND surface under the umbrella condition; child->parent exceptions are legitimate but each one is reported so a human eye stays on it",
    ),
    Invariant(
        name="references_resolve",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="every condition/symptom slug a claim maps to is pre-registered in the Catalog pillar (eden/catalog/{conditions,symptoms}.json); an unregistered slug (typo / phantom condition) is RED -- closes the phantom-slug hole. The substance (other_substances) half is ACTIVE too: every claim substance must resolve to eden/catalog/nutrients.json, else RED",
        check_fn=check_references_resolve,
        truth_anchor="sealed claim shards (eden/corpus/claims/*) x the catalog registries (eden/catalog/*), recomputed each run via corpus_verify.unresolved_references -- no stale-to-stale comparison",
        severity="critical",
        lesson_ref="conditions and symptoms were promoted from emergent claim slugs to a pre-registered catalog: before that, a typo'd slug silently minted a brand-new condition in the derived index with nothing to catch it",
    ),
    Invariant(
        name="product_registry_resolves",
        anchor_class="external",  # a known identity/unit-conversion value bank, re-derived
        description="every quantified Product-DB substance resolves to an essential (one of the 91) OR is classified as a botanical, the botanical vocabulary collapses to ZERO surface-form collisions, and a bank of known identity + unit-conversion values holds -- proves eden/catalog/nutrients.json + nutrient_resolve keep the Products pillar machine-readable",
        check_fn=check_product_registry_resolves,
        truth_anchor="deterministic re-run of eden/tools/nutrient_resolve.py over the sealed products.json x catalog/nutrients.json each run (exit 0 = all resolve/classify + zero collisions + known values); no stale-to-stale comparison",
        severity="critical",
        lesson_ref="the resolver's alias table was externalized to the Catalog pillar and the botanical vocabulary canonicalized; the unit-conversion self-checks immediately caught a latent canonical_unit bug (mcg vitamins keyed by display-name instead of slug)",
    ),
    Invariant(
        name="products_verify",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="the Products pillar (eden/products/products.json) is structurally sound + prose-contained: every record shape valid, amounts are composition (never a Wallach target), and the only long free-text token is a blend's bounded as_labeled (R4/R5). A malformed record or leaked prose is RED",
        check_fn=check_products_verify,
        truth_anchor="deterministic re-run of eden/tools/products_verify.py over the sealed products.json each run (exit 0 = clean); no stale-to-stale comparison",
        severity="critical",
        lesson_ref="the products build-time verifier was promoted to a live board gate when the pillar was sealed, mirroring corpus_integrity and catalog_integrity",
    ),
    Invariant(
        name="products_hash_integrity",
        anchor_class="consistency",  # our file A vs our file B — catches drift, not a born-wrong value
        description="Eden's wall for the Products pillar: products.json's LF-content hash matches its *.golden.sha256 (written by the USER-approved products_seal.py). Bootstrap-safe pre-seal; after sealing, any drift = RED, so the scanner/user path can never silently rewrite the sealed composition",
        check_fn=check_products_hash_integrity,
        truth_anchor="math -- deterministic LF-normalized SHA-256 of products.json vs the locked golden, recomputed each run (clone/CRLF-stable)",
        severity="critical",
        lesson_ref="the sealed-canonical rule extended to the Products pillar; sealing is the owner's act (products_seal.py) and the golden hash is the anti-tamper anchor",
    ),
    Invariant(
        name="catalog_integrity",
        anchor_class="consistency",  # our file A vs our file B — catches drift, not a born-wrong value
        description="the Catalog pillar (eden/catalog/{conditions,symptoms}.json) is structurally sound: counts match, every umbrella_of child resolves, slugs are well-formed, and (when sealed) golden hashes hold",
        check_fn=check_catalog_integrity,
        truth_anchor="deterministic re-parse of eden/catalog/* + the essentials-canon slug set + golden hashes (LF-normalized), recomputed each run via eden/tools/catalog_verify.py; 0=sealed&healthy, 2=bootstrap, 1=fail",
        severity="critical",
        lesson_ref="the Catalog is a sealed pillar; its own integrity gate mirrors corpus_integrity so a hand-edit that breaks a count, dangles an umbrella child, or points canon_slug at a non-essential is caught at the board, not downstream",
    ),
    Invariant(
        name="book_source_clean",
        anchor_class="external",  # deterministic re-scan of the book .txt bytes
        description="every source book marked 'pristine' in eden/tools/purity-status.json scans to 0 unresolved defects (book_purity.py after its per-book baseline) -- a purified book's .txt can never silently regress; raw/purifying books listed informationally",
        check_fn=check_book_source_clean,
        truth_anchor="deterministic re-scan of the sealed book .txt each run (book_purity detectors + per-book purity-baselines allowlist); no stale-to-stale comparison",
        severity="critical",
        lesson_ref="deferred source .txt fixes meant the same OCR damage got re-fought on every pass. Purify each book to pristine FIRST, then GUARD it, so a correction never has to be made twice.",
    ),
    Invariant(
        name="mined_pages_clean",
        anchor_class="external",  # the book .txt bytes at each claim locator
        description="every screenshot page carrying a sealed claim (in a purifying/pristine campaign book) is free of high-confidence OCR defects in its source .txt (tight punctuation-spacing + gibberish classes); FP-heavy classes + reading-order scrambles are out of scope",
        check_fn=check_mined_pages_clean,
        truth_anchor="sealed claim locator.screenshot x deterministic book_purity detectors, re-scanned each run; genuine FPs triaged in eden/tools/mined-page-triage.json",
        severity="critical",
        lesson_ref="OCR garbage kept being left behind on pages that had just been mined. An advisory convention is rationalizable in the moment, so this is a red-board gate scoped to exactly the pages the work touched.",
    ),
    Invariant(
        name="mining_coverage_accounted",
        anchor_class="external",  # screenshot markers in the book .txt — a text position we did not author
        description="every book flagged mining_status:'complete' in eden/tools/mining-coverage.json accounts for every source page (screenshot books, auto-derived from locator.char_offset->nearest marker) or section (chapter books) with a claim OR a reviewed-empty+reason; 'incomplete' books reported informationally only -- makes WHOLESALE under-mining a red board at completion, not an invisible dropped thread",
        check_fn=check_mining_coverage_accounted,
        truth_anchor="sealed claim locator.char_offset -> nearest ===== Screenshot(N) ===== marker in the book .txt (one text-position basis, NOT the inconsistent locator.screenshot), re-derived each run vs the book's marker set; reviewed-empty reasons per the exceptions_justified pattern",
        severity="critical",
        lesson_ref="silent under-mining (a long tail of appendix pages skipped; one whole book left at zero claims) is invisible until it forces a full re-mine. Book mining gets the same coverage-accounting leg products get, asserted only at completion so it never falsely reds a corpus that is legitimately incomplete.",
    ),
    Invariant(
        name="substance_triage_accounted",
        anchor_class="consistency",  # our file A vs our file B — catches drift, not a born-wrong value
        description="the source-anchored substance triage buffer (eden/tools/substance-triage-buffer.json) is accounted for: valid JSON, unique ids, required fields, a resolved/rejected entry carries a reason, and -- the teeth -- NO entry stays 'pending' under a book flagged mining_status:'complete' in mining-coverage.json. Pending entries under an INCOMPLETE book are informational only. The relief valve for references_resolve's strict substance half; NEVER trusted as a source (registry stays nutrients.json). Missing/empty buffer = pass",
        check_fn=check_substance_triage_accounted,
        truth_anchor="eden/tools/substance-triage-buffer.json x the mining-coverage.json completion flags, recomputed each run -- the gate NEVER reads the buffer for resolution (single registry, no drift), only for accounting; no stale-to-stale comparison",
        severity="critical",
        lesson_ref="make the honest path the path of LEAST resistance: a legitimate low-effort third exit (park the unmatched substance) drains the incentive to typo-pollute the registry or silently under-capture. Mirrors mining_coverage_accounted -- teeth at completion, quiet while incomplete.",
    ),
    Invariant(
        name="graphics_integrity",
        anchor_class="consistency",  # our file A vs our file B — catches drift, not a born-wrong value
        description="the sacred hand-made Wallach graphics (eden/graphics) match their sealed manifest hashes (delegates to graphics_verify.py; BOOTSTRAP passes pre-seal)",
        check_fn=check_graphics_integrity,
        truth_anchor="eden/tools/graphics_verify.py — raw-byte sha256 of each image vs graphics-manifest.json; manifest vs golden",
        severity="critical",
        lesson_ref="the owner-authored, Wallach-derived graphics are admitted as a first-tier source by source-owner authority; sealing them keeps that admission auditable",
    ),
    Invariant(
        name="claim_text_term_gloss",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="front-facing claim_text carries no garbled/obsolete botanical form or obscure common name that has a simpler approved alternative (eden/tools/term-gloss-lexicon.json); listed defects are also absent from verbatims",
        check_fn=check_claim_text_term_gloss,
        truth_anchor="eden/tools/term-gloss-lexicon.json {defects, common_swaps} scanned against every sealed claim_text (+ verbatim for defects)",
        severity="critical",
        lesson_ref="every reader-facing term gets a minimal common-word-first gloss, and source nomenclature defects get corrected at the source. Enforced so a fixed entry cannot drift back and be fixed again.",
    ),
    Invariant(
        name="term_gloss_ratified_present",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="a ratified common-name gloss may not be REMOVED from claim_text: where a common_swaps entry anchors a common name to a Latin genus, any claim naming that genus still carries the name, and the superseded name does not return under a corrected binomial",
        check_fn=check_term_gloss_ratified_present,
        truth_anchor="eden/tools/term-gloss-lexicon.json common_swaps -> genus-anchored rules, scanned against every sealed claim_text",
        severity="critical",
        lesson_ref="during a bulk-sweep verify pass, two proposed audit fixes would have stripped ratified glosses (EPIGEN-000097 hickory/Carya, LETS-000253 horseweed/Erigeron) and NEITHER tripped claim_text_term_gloss, whose literal FROM-key match misses near-variants; both would have landed on a green 76/76 board. R9 tightening shipped with the misfire it fixes; negative test tools/tests/test_term_gloss_ratified_present.py",
    ),
    Invariant(
        name="glossary_wellformed",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="dashboard/assets/data/glossary.json parses; every entry has term+plain+category; terms unique; no definition asserts an UNANCHORED number/dose (a number needs a number_exempt citing a sealed claim that contains it -- R9 2026-07-21)",
        check_fn=check_glossary_wellformed,
        truth_anchor="dashboard/assets/data/glossary.json structural scan",
        severity="critical",
        lesson_ref="the glossary/tooltip layer carries plain-language definitions, which take on no §00.A obligation -- but a number in one would be an unverifiable Wallach claim, so an unanchored number is RED",
    ),
    Invariant(
        name="glossary_keys_denylisted",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="a glossary key REMOVED for over-firing may not be re-registered as a term or alias: every reviewed key in eden/tools/term-gloss-lexicon.json glossary_key_denylist (each carrying the measurement that condemned it) stays absent from glossary.json, matched on the EXACT runtime-normalized key so a multi-word term merely containing the word is spared",
        check_fn=check_glossary_keys_denylisted,
        truth_anchor="eden/tools/term-gloss-lexicon.json glossary_key_denylist x every term+alias key in dashboard/assets/data/glossary.json, normalized exactly as state/glossary.ts::normKey does at runtime",
        severity="critical",
        lesson_ref="the entry 'reduce in chemistry' could never match its own term and fired only via its aliases: measured across 9,211 front-facing blocks, 'reduced' decorated 105 sentences and 'reduction' 24, every one the ordinary-English sense and none the chemistry sense (129 wrong tooltips, 0 right), on a fully green board. glossary_wellformed saw a perfectly-shaped entry; it was caught only by a human reading the rendered page. LABELED LIMIT: this closes the door behind a key a human removed, it does NOT discover the next common word (a frequency floor would redden deliberate high-firing keys like 'essential' 627x). Negative test tools/tests/test_glossary_keys_denylisted.py",
    ),
    Invariant(
        name="frontface_verbatims_clean",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="no sealed front-facing verbatim carries any of EIGHT mechanical defect classes — mid-word line-break hyphen, mojibake/control char, space-before-punctuation, split number, run-together, double space, digit welded into a word, typeset subscript flattened to a comma or lookalike (Vitamin B,, for B12; LDso for LD50). Exclusions (ordinals, decades, vitamin designations, unit/formula adjacency, table leader dots) and 11 named exceptions in eden/tools/frontface-exceptions.json encode the page-image verification behind each; an exception with no reason is itself RED",
        check_fn=check_frontface_verbatims_clean,
        truth_anchor="every sealed claim verbatim in eden/corpus/claims/ re-scanned each run, minus the reasoned exception list",
        severity="critical",
        lesson_ref="raw OCR damage was found in user-facing quotes (RARE-000336 tisk/rea/ancer; LETS-000502 '1 20' for 120). 180 line-break hyphens were fixed across 91 quotes, then 5 further classes were promoted once every residual hit had been read off its page image. HONEST LIMITS, both measured: (1) it cannot see the INVISIBLE class -- four valid-word swaps (side/vide, tine/rine, Jute/lute, ties/ries) were found by EYE, every one inside a pair this gate calls clean; (2) it sees only the letter-digit and camelCase EDGES of the DROPPED-SPACE class caused by tight justification (page: 'magnesium at 2,000 mg', ours: 'at2,000'), whose letter-letter cases (andelectrolytes, ratherthan) are invisible to every detector here and whose size is UNMEASURED -- an attempted vocabulary measurement returned 387 candidates that were almost all legitimate words. Negative test tools/tests/test_frontface_verbatims_clean.py",
    ),
    Invariant(
        name="verbatim_no_transcription_scaffolding",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="no sealed claim's verbatim or claim_text contains transcription scaffolding — the capture harness's frame name (Screenshot (N)), the ebook reader's position readout (Page N of M), a ===-run separator, or a Kindle location marker. A verbatim asserts 'these are Wallach's printed words', so scaffolding inside one is always a defect and this gate needs no exception list",
        check_fn=check_verbatim_no_transcription_scaffolding,
        truth_anchor="every sealed claim verbatim + claim_text in eden/corpus/claims/ re-scanned each run against the four marker shapes the transcriptions actually contain",
        severity="critical",
        lesson_ref="on the first front-facing page-read pass, three claims (EPIGEN-000124, -000125, IMMORT-000230) carried '===== Screenshot (675) -- Page 818 of 936 =====' INSIDE their verbatim, i.e. the app could render OCR scaffolding to a reader as Wallach's words. A page-reading agent hit ONE; a grep found the other two, which is why the gate enumerates the marker shapes the sources CONTAIN rather than the one shape someone happened to hit. The fix is never a source edit -- those separators are legitimate scaffolding in the .txt (932 in epigenetics, 510 in immortality) -- so this guards the CLAIM, not the book. ★ SECOND FINDING, from the repair: stripping the separator dropped two verbatims to 40 and 20 chars, under corpus_seal check #2's 60-char floor -- THE SCAFFOLDING HAD BEEN THE ONLY THING CLEARING THAT FLOOR, so a length gate was being satisfied by text the page never printed. Both were extended into genuinely adjacent rows of the same dose table. DELIBERATELY NOT policed: asterisk runs (3 in epigenetics) and underscore runs (5 in rare-earths), because a printed page can legitimately carry a rule of asterisks or an underscore blank. Negative test tools/tests/test_verbatim_no_transcription_scaffolding.py (21 cases, incl. those two sparing cases)",
    ),
    Invariant(
        name="explore_entity_lede_authored",
        anchor_class="consistency",  # search-index entities x entity-copy topics x the frozen backlog -- file A vs file B
        description="every explore-page entity (concept/substance/topic/element/person/event with >=1 search claim -- it renders knowledge-topic.ts, not an essential/condition page) carries a HAND-AUTHORED lede in entity-copy.json['topics'], UNLESS its slug is in the frozen grandfathered backlog (tools/gate-fixtures/lede-backlog.json). A NEW explore entity is not grandfathered, so it is RED until a lede is authored. STRUCTURAL: proves a lede EXISTS, never that it reads well",
        check_fn=check_explore_entity_lede_authored,
        truth_anchor="dashboard/assets/data/search/search-index.json entities+claims x entity-copy.json['topics'] x tools/gate-fixtures/lede-backlog.json, recomputed each run; the backlog only SHRINKS and can never cover a NEW entity",
        severity="critical",
        lesson_ref="a topic page shipped titled \"It's a mineral-deficiency signal...\": the topic hero (knowledge-topic.ts) had ALWAYS derived its header from a claim's answer_short (entityLede), so 141 explore pages shipped answer-shaped headers and NO gate caught it. A claim's answer_short answers a question; it is not a page header. Fix: entity-copy.json gains a 'topics' section of hand-authored ledes, entityLede prefers it, and this gate forces every NEW explore entity to ship one. The pre-existing un-authored pages are an honest shrinking BACKLOG. Negative test tools/tests/test_explore_entity_lede_authored.py",
    ),
    Invariant(
        name="enriched_book_is_verified",
        anchor_class="consistency",  # our file A vs our file B — catches drift, blind to a value wrong in both
        description="a claim may not carry a search-enrichment entry (i.e. be front-facing) unless its book is in books_verified, its id is in claims_verified, or its id is in the frozen grandfathered backlog (tools/gate-fixtures/frontface-verified.json). A NEW enrichment on an unverified book is RED",
        check_fn=check_enriched_book_is_verified,
        truth_anchor="eden/corpus/search-enrichment.json keys x the verification ledger x each claim's book_id from the sealed shards",
        severity="critical",
        lesson_ref="2026-08-02, BLUEPRINT §5 lock gate #2 -- THE ROOT CAUSE. Claims were enriched from books officially 'raw' in purity-status.json on the promise that quotes get fixed as we enrich; the promise had no gate and was not kept, and nothing caught it. This makes it impossible: you cannot newly front-face a quote from an unverified book. The grandfathered claims (1,925 at freeze) are an honest BACKLOG asserting only 'already front-facing on 2026-08-02', never 'correct'; the count SHRINKS as ids move into claims_verified, so read the gate's live output rather than any number written down elsewhere. Negative test tools/tests/test_enriched_book_is_verified.py",
    ),
    Invariant(
        name="jargon_terms_glossed",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="every medical-jargon word (latinate -osis/-itis/-emia/... minus common-word + botanical-fragment skips) in a claim_text has a plain-language entry in glossary.json; warns to force coverage growth",
        check_fn=check_jargon_terms_glossed,
        truth_anchor="_JARGON_SUFFIX matches in every sealed claim_text vs glossary.json keys+aliases",
        severity="warning",
        lesson_ref="a coverage guard so no un-glossed jargon slips past; kept at warning severity because the heuristic can false-match a scientific name",
    ),
    Invariant(
        name="citations_reference_registry",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="on the CLEAN Charter surface (corpus claims + canon + catalog + corpus-derived targets/coverage-layout), every claim's locator.book resolves to a books-meta book_id and no fact field carries a hand-typed book TITLE -- book refs are IDs, display citations are composed from the sealed registry. Inline view prose is a labeled WISH, not covered here",
        check_fn=check_citations_reference_registry,
        truth_anchor="eden/corpus/books-meta.json titles + book_ids x the clean-surface bytes (corpus claims/canon + catalog + essentials-targets-data/coverage-layout-data), recomputed each run; prose homes allowlisted",
        severity="critical",
        lesson_ref="roughly 200 hand-typed citations had drifted from the registry (a cite said 1999 while books-meta said 2011). This makes 'book refs = book_id, display composed from the registry' a machine gate on the surface where the rule holds today: real teeth on the clean surface now, the rest labeled WISH rather than implied.",
    ),
    Invariant(
        name="prose_contained",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="on the CLEAN Charter surface, no prose-shaped string (>=12 words or a sentence boundary) appears under a NON-prose key -- prose lives in ONE designated compartment (claim_text/verbatim + file-metadata + dose descriptors), never in a fact field. The full form of the rule (verbatim = a pointer plus a per-essential prose store) and the inline view prose are a labeled WISH",
        check_fn=check_prose_contained,
        truth_anchor="the clean-surface bytes (corpus claims/canon + catalog + essentials-targets-data/coverage-layout-data) x the _PROSE_HOME_KEYS allowlist, recomputed each run",
        severity="critical",
        lesson_ref="prose leaking into a fact field is how hand-typed summaries got baked into data in the first place; this contains it on the clean surface. PARTIAL by design and labeled so: the full prose-store form only matters once clean post-mining stances exist, and inline view prose remains a WISH.",
    ),
    Invariant(
        name="internal_refs_out_of_prose",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="front-facing-human-first -- NO internal book navigation ref (Table/Fig/page N) appears in any claim_text (the reader-facing summary); provenance rides on the source-ref tag (surfaced as a labeled header) + the verbatim quote, never the summary prose. The 44 Rare-Earths/Immortality table claims + the 33 Base-Line dose summaries were cleaned; any ref left in a claim_text is RED",
        check_fn=check_internal_refs_out_of_prose,
        truth_anchor="every sealed claim's claim_text, recomputed each run",
        severity="critical",
        lesson_ref="rewriting prose with a render-time regex hides the defect instead of fixing it. The durable fix cleans the sealed claim_text and moves the label to a structured tag that renders as a header; this gate keeps navigation refs out of reader summaries from then on. The 33 base-line dose summaries were stripped in the same pass, so the whole corpus is ref-free in prose.",
    ),
    Invariant(
        name="no_duplicate_claims",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="no two sealed claims from the same book quote a CONTAINED verbatim under the same enrichment subject AND facet -- i.e. one span answering one question twice, which renders as twin cards in one section of one entity page (the 2026-08-03 vitamin-A defect). Containment ALONE is NOT the signature: 209 containment pairs exist by design, because one Wallach paragraph legitimately answers several questions. Two pairs ruled keep-both are allowlisted IN-GATE with stated reasons -- never in the baseline, which is invariant-scoped and would neuter the whole gate",
        check_fn=check_no_duplicate_claims,
        truth_anchor="the sealed claim verbatims (eden/corpus/claims/claims-*.json) x subject/facet from eden/corpus/search-enrichment.json, bucketed by book+subject+facet and containment-tested pairwise, recomputed each run; a keep-both exception that stops firing is itself RED",
        severity="critical",
        lesson_ref="two near-identical 'What is Vitamin A?' cards rendered on one entity page; EPIGEN-000213/-000214 were a truncated and a full take of the same span, same offset, same extracted_at, and 13 duplicates were removed corpus-wide. A fully green board caught none of it: the class was found by a human looking at a screen, which is not a control. Negative test: tools/tests/test_no_duplicate_claims.py replants the real vitamin-A pair.",
    ),
    Invariant(
        name="search_no_twin_questions",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="no two search cards on one entity page (same enrichment subject) ask the SAME question after synonym-folding (signs=symptoms, dangerous=harmful, deficiency=low) -- the CROSS-BOOK twin-card class no_duplicate_claims cannot see (it keys on same-book verbatim containment). On 2026-08-07, after a 3-day duplicate campaign, the vitamin-D page STILL rendered 'signs of' beside 'symptoms of' deficiency and 'dangerous' beside 'harmful' on an 89/89 board. Fold-EQUALITY, not a fuzzy threshold; any confirmed-distinct pair is allowlisted IN-GATE with a reason (empty today), never in the baseline",
        check_fn=check_search_no_twin_questions,
        truth_anchor="the hand-authored questions in eden/corpus/search-enrichment.json x their subject, normalized (drop function words + subject-name tokens, fold an explicit synonym set) and fold-compared pairwise within each subject, recomputed each run; a keep-both exception that stops firing is itself RED",
        severity="critical",
        lesson_ref="even after a dedicated duplicate sweep, the entity page STILL rendered signs/symptoms and dangerous/harmful twins, because no_duplicate_claims keys on same-book verbatim containment and these pairs are cross-book, different-content and synonym-worded. 19 fold-equal pairs across 17 subjects existed the day this gate landed, ALL real twins (the allowlist is empty; keeping 'do' as a content word separates 'what IS X' from 'what does X DO'). Negative test: tools/tests/test_search_no_twin_questions.py replants the real vitamin-D signs/symptoms pair.",
    ),
    Invariant(
        name="no_hand_duplicated_canonical",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="the 90/91 canonical essential display_names live ONLY in essentials-canon.json among hand-edited files -- no other hand-edited pillar file (catalog conditions/symptoms) re-stores one as a field value -- no value is hand-written twice; derived copies (corpus-embed) are exempt, gated fresh by derived_artifacts_fresh",
        check_fn=check_no_hand_duplicated_canonical,
        truth_anchor="essentials-canon.json display_names x every string leaf of the other hand-edited pillar files (catalog conditions/symptoms), recomputed each run",
        severity="critical",
        lesson_ref="a since-deleted nutrient registry hand-duplicated every canonical name; this gate makes re-introducing that class of duplication RED. Widening it to every identity field in every pillar is a labeled WISH, not something this gate does.",
    ),
    Invariant(
        name="scanner_user_items_marked",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="Eden's WALL: a user/scanner-added regimen item is provenance-marked user-provided (user_scanned/user_manual/wishlist_promoted) so it can never masquerade as Wallach/Youngevity canonical, and no user token ever appears in a sealed pillar or an operational generated artifact -- the scanner writes only the user's localStorage, never a pillar",
        check_fn=check_scanner_user_items_marked,
        truth_anchor="dashboard/assets/js/src provenance literals + RegimenItemSchema x a user-token scan of eden/{corpus,catalog}/*.json & dashboard/assets/data/*.json (excl. append-only creators-log narrative), recomputed each run",
        severity="critical",
        lesson_ref="the scanner lets a user add ANY item to THEIR regimen but can NEVER modify the sealed pillars. This codifies the wall as a gate: user items are flagged and never enter a pillar or a generated index.",
    ),
    Invariant(
        name="data_artifacts_accounted",
        anchor_class="consistency",  # our file A vs our file B — catches drift, not a born-wrong value
        description="the completeness half -- every dashboard/assets/data/*.json is registered in eden/derived/MANIFEST.json, either in `artifacts` (derived + freshness-gated) or in `accounted` (hand-authored/externally-gated, each with a disposition + reason); a data file in neither list is RED (no silent hand-maintained artifact can ship)",
        check_fn=check_data_artifacts_accounted,
        truth_anchor="the on-disk glob of dashboard/assets/data/*.json x the MANIFEST.json artifacts+accounted registries, recomputed each run",
        severity="critical",
        lesson_ref="derived_artifacts_fresh proved the LISTED artifacts fresh, but nothing proved the list COMPLETE -- coverage-layout-data and three others were being hand-maintained outside the gate entirely. This forces every data file into a visible bucket.",
    ),
    Invariant(
        name="charter_gates_present",
        anchor_class="meta",  # checks a document about the gates / guards a currently-empty set
        description="the meta-gate -- every gate named in the Gate column of the rule table in .claude/skills/charter/SKILL.md must be a live invariant, a known enforcement mechanism (verify tool / hook / lint), or the rule must be labeled WISH; a named gate that neither exists nor is WISH means the Charter oversells its own enforcement = RED",
        check_fn=check_charter_gates_present,
        truth_anchor="the parsed charter.md R1-R9 rule table (Gate + Status columns) x the live invariant name set + a fixed mechanism allowlist, recomputed each run",
        severity="critical",
        lesson_ref="'codify, don't promise' was itself only a promise -- nothing verified that the Charter's gate column named real gates. This makes the Charter unable to lie about its own enforcement. The semantic half, whether a named gate truly enforces its rule, stays review-only and is labeled as such.",
    ),
    Invariant(
        name="exceptions_justified",
        anchor_class="meta",  # checks a document about the gates / guards a currently-empty set
        description="every tolerated failure in .claude/invariant-baseline.json is a justification object {invariant, reason, test}; a bare-string or reason-less/test-less exception is a silent loosening = RED. Empty baseline is vacuously clean but the gate stands for the next exception",
        check_fn=check_exceptions_justified,
        truth_anchor="the tolerated_failures list in .claude/invariant-baseline.json x the live invariant names, recomputed each run; paired reader stop_round_close.py tolerates the same entries by their `invariant` name",
        severity="critical",
        lesson_ref="'refinements are codified too, never a silent loosening' was a promise -- the baseline could hold an unjustified exception with nothing to catch it. Now every exception must carry its reason and a proving test.",
    ),
    Invariant(
        name="corpus_audit_gate",
        anchor_class="consistency",  # our file A vs our file B — catches drift, not a born-wrong value
        description="the mandatory full-corpus audit made STRUCTURAL: while eden/tools/corpus-audit-status.json has phase_g_unlocked=false, the live claim count may not exceed frozen_claim_count -- new claims cannot be mined onto unaudited data (RED the instant they are). Green while count==freeze (audit owed, mining locked); unblocks on audit sign-off",
        check_fn=check_corpus_audit_gate,
        truth_anchor="the live corpus shard claim count x frozen_claim_count in eden/tools/corpus-audit-status.json, recomputed each run",
        severity="critical",
        lesson_ref="the full-corpus audit owed before mining resumes rested on a note that could be forgotten. This codifies it: mining new claims onto unaudited data is structurally blocked until sign-off. Harness: eden/tools/corpus_audit.py.",
    ),
    Invariant(
        name="views_no_inline_prose",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="the code-side half -- no user-facing prose lives as a string literal inside a CLEAN view file; it belongs in the view-copy content store (state/copy.ts), referenced by id. Surface-scoped: _CLEAN_VIEW_FILES lists the views migrated so far and BINDS on them (read the tuple, not this line); it grows as each further view is migrated. NOT vacuous; the negative test proves the gate fires",
        check_fn=check_views_no_inline_prose,
        truth_anchor="the .ts bytes of the declared clean-view files (_CLEAN_VIEW_FILES) scanned each run; a growing allowlist mirroring _clean_surface_files",
        severity="critical",
        lesson_ref="'no inline view prose' was the longest-standing WISH; it becomes a live gate, landed BEFORE the surfaces so they could not be built with inline copy in the first place. Negative test: tools/tests/test_views_no_inline_prose.py. Whether the prose is the RIGHT prose stays a review question.",
    ),
    Invariant(
        name="entity_render_is_projection",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="the entity-render view is a pure projection of the generated entity-page artifact: no object literal keyed by a real entity id, no per-entity content branch. Closes the sub-10-element hole views_state_no_inline_data cannot see. Surface-scoped (_ENTITY_VIEW_FILES): BINDING on the entity views listed there -- read the tuple -- and it grows in the same patch as each new view; negative test proves it fires",
        check_fn=check_entity_render_is_projection,
        truth_anchor="the real entity-id sets from the pillars (canon slugs + catalog condition/symptom ids + product ids) x the entity-view .ts bytes, recomputed each run",
        severity="critical",
        lesson_ref="a hand-built {calcium:{...},osteoporosis:{...}} content map is only 2 keys, so it slips under the >10-element inline-data gate; this closes that hole. Negative test: tools/tests/test_entity_render_is_projection.py.",
    ),
    Invariant(
        name="element_header_complete",
        anchor_class="consistency",  # our mechanism store vs our entity-copy store -- catches a half-filled entry, not a wrong one
        description="Every element shipping a composed mechanism header also ships BOTH its opening lede and its why-this-number provenance in entity-copy.json. Copper went live with `why` and no `lede`, and a partial entry looks identical to a complete one on the page. Scoped to elements that HAVE a header; the remaining essentials are an acknowledged coverage gap, not a claim that every essential is done",
        check_fn=check_element_header_complete,
        truth_anchor="the bytes of the two hand-authored stores (mechanism-clarity-data.json x entity-copy.json), re-read and cross-checked each run",
        severity="critical",
        lesson_ref="copper's missing opening line was caught only after the header had shipped, and the why-this-number line had been missing on the live page for the same reason -- the store held entries for only two essentials. A half-filled entry is invisible from the page itself. Negative test: tools/tests/test_element_header_complete.py. Playbook: .claude/skills/element-headers/SKILL.md",
    ),
    Invariant(
        name="figure_type_within_standard",
        anchor_class="structural",  # shape only -- says nothing about whether a figure is GOOD, only that its type is on-standard
        description="Element-figure label type matches the MEASURED selenium standard (labels 12.0px) and nothing exceeds its element glyph (17.6px). Selenium is the CEILING for figure type, not a floor -- an invented larger scale was rejected on sight. Source-side half only; the rendered half (scale == 1 + no label collisions) is proven per element by the render probe",
        check_fn=check_figure_type_within_standard,
        truth_anchor="drawer-knowledge.css bytes scanned each run against two sizes measured headlessly off the shipped selenium figure",
        severity="critical",
        lesson_ref="two passes were lost to figure type: first too small (the real cause was an ID-specificity width override losing the cascade, rendering an 800-unit viewBox at 560px -- scale 0.70, every label silently 30% smaller), then overcorrected to 15/17/18/32 above the selenium standard. Negative test: tools/tests/test_figure_type_within_standard.py. Playbook: .claude/skills/element-headers/SKILL.md",
    ),
    Invariant(
        name="mechanism_blocks_wellformed",
        anchor_class="consistency",  # our schema vs our renderer vs our store vs the sealed corpus -- proves nothing is silently DROPPED, not that a header is good
        description="The element-header block list is well-formed. The composed shape (2026-07-30) moves the ORDER and SELECTION of a header's blocks out of the renderer and into data, and a data-driven dispatch fails SILENTLY: an unknown block type or a mistyped figure key renders '' and the page just looks a little empty. So: the schema's block vocabulary and renderMechBlocks' dispatch must be the SAME set in BOTH directions, every figure key the store names must be one mechanismFigure actually draws, and every claim the store cites must resolve in the sealed corpus. Covers the legacy entries too, which never had the last two",
        check_fn=check_mechanism_blocks_wellformed,
        truth_anchor="the schema .ts bytes x the view .ts bytes x the hand-authored mechanism store x the sealed corpus shards, all re-read and cross-checked each run",
        severity="critical",
        lesson_ref="eight calcium header mockups were rejected because the SCHEMA was the template -- the required set (eyebrow/kill/figure/beats/quote) WAS the rejected chassis, so every 'bespoke' header regressed to it. Freeing the shape means the data now decides which blocks render, which buys a new silent-failure class this gate closes. Negative test: tools/tests/test_mechanism_blocks_wellformed.py. The byte-identity of the three signed-off headers is proven separately by tools/probes/render_probe_mech_shape.js",
    ),
    Invariant(
        name="mech_quote_trim_faithful",
        anchor_class="external",  # anchored to the SEALED verbatim bytes -- catches a cited "quote" that fabricates, which no our-file-vs-our-file check could
        description="00.A -- a mechanism split card may DISPLAY a trimmed literal quote (quote_trim) so it can stop before a trailing sentence (calcium drops '...The normal range is 9-10.8 mg') without re-sealing canon, while the cite still composes from the sealed claim. That is exactly where a cited quote could drift into words Wallach never wrote. So every quote_trim must be a contiguous whitespace-normalised SLICE of its quote_claim's sealed verbatim, and must name a resolving claim -- a prose quote may only TRIM Wallach, never fabricate",
        check_fn=check_mech_quote_trim_faithful,
        truth_anchor="the sealed corpus claim shards (verbatim bytes), re-read each run and substring-matched against the hand-authored quote_trim",
        severity="critical",
        lesson_ref="a card may trim a quote to drop an unwanted trailing sentence while keeping the real cite -- the text stays a literal Wallach quote, only its end moves. This codifies the literal half so a trim cannot quietly become fabrication behind a real citation. Negative test: tools/tests/test_mech_quote_trim_faithful.py",
    ),
    Invariant(
        name="views_no_ciphered_data",
        anchor_class="external",  # catches RENDER-TIME fabrication — a value with perfect provenance mangled at draw time, which every source-side gate is blind to
        description="§00.A -- the decorative .ds-cipher glyph-scrambler never wraps interpolated data. It rewrites a random character every 1s tick and restores the truth only every 5th, so wrapping a real number renders it WRONG ~80% of the time. Found live 2026-07-14: the hero kicker ciphered essentialCount(), rendering Wallach's 90 as 30/80/94. Any ${...} inside a .ds-cipher span is RED",
        check_fn=check_views_no_ciphered_data,
        truth_anchor="git-tracked dashboard/assets/js/src/views/*.ts bytes scanned each run; git-unavailable fails open LOUD, never a silent green",
        severity="critical",
        lesson_ref="A number with an impeccable SOURCE can still be fabricated at RENDER time -- no existing gate watched the presentation layer for this. Negative test: tools/tests/test_views_no_ciphered_data.py.",
    ),
    Invariant(
        name="no_stub_render_paths",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="no prototype/demo scaffold token (kn-stub, sh-stub, 'next chunk', 'real build', 'demo wires', PROTOTYPE, exemplar) survives into a shipped view (.ts) or stylesheet (.css); the migration re-implements the prototypes' design, never pastes their scaffolding",
        check_fn=check_no_stub_render_paths,
        truth_anchor="git-tracked dashboard/assets/js/src/views/*.ts + dashboard/assets/styles/*.css bytes scanned each run; git-unavailable fails open LOUD, never a silent green",
        severity="critical",
        lesson_ref="the prototypes inline prose, data and stubs for speed; this gate (same mechanism as no_dead_legacy_paths) blocks copying a stub render path or a demo mark into the shipped app. Negative test: tools/tests/test_no_stub_render_paths.py.",
    ),
    Invariant(
        name="kind_label_covers_corpus",
        anchor_class="consistency",  # our file A vs our file B — catches drift, not a born-wrong value
        description="every distinct claim.kind in the sealed corpus has a display label in the view-copy content store's kind_labels; a missing label would render a raw or blank kind header on the entity page. The set of kinds is read from the corpus, never counted in prose",
        check_fn=check_kind_label_covers_corpus,
        truth_anchor="distinct claim.kind values in the sealed claim shards x dashboard/assets/data/view-copy.json kind_labels keys, recomputed each run",
        severity="critical",
        lesson_ref="the display-label maps are centralized, and the rule ships with its gate: the kind map cannot be exhaustively typed (claim.kind is an open z.string()), so a truth-anchored invariant proves coverage instead. Negative test: tools/tests/test_kind_label_covers_corpus.py.",
    ),
    Invariant(
        name="dose_answers_state_their_programme",
        anchor_class="consistency",  # our sealed claims vs our enrichment store — catches drift, not a born-wrong number
        description="Every general-programme dose card (dose.for_condition marking a base-line/daily-multiple/maintenance programme) names the programme or the year its number came from. A quarter of the essentials carry rival general-programme figures -- mostly the 1995 Base Line table against the 2014 Epigenetics daily multiple -- and a bare number makes them read as rival answers to one question. Condition-scoped therapeutic doses are out of scope",
        check_fn=check_dose_answers_state_their_programme,
        truth_anchor="sealed claim shards (kind/dose.amount/dose.for_condition) x eden/corpus/search-enrichment.json answer_short, recomputed each run",
        severity="critical",
        lesson_ref="vitamin D's WHAT TO DO rendered four dose claims that read as four contradictions. Three of the four were correctly scoped claims whose reader-facing text had dropped the scope, so a maintenance target and a therapeutic dose sat side by side as rival answers to one question. Fixed across 27 answers and 16 superseded questions, then gated so it cannot regress. Negative test: tools/tests/test_dose_answers_state_their_programme.py.",
    ),
    Invariant(
        name="claim_category_mapping_total",
        anchor_class="consistency",  # our file A vs our file B — catches drift, not a born-wrong value
        description="the claim.kind -> colour-category map (view-copy.json kind_categories) is TOTAL and exact over the sealed corpus kinds: every distinct sealed kind maps to exactly one of the six locked families (green/teal/amber/orange/violet/red), no default branch, no stale entry for a vanished kind. A new/dropped kind reddens the board rather than rendering a wrong/absent colour",
        check_fn=check_claim_category_mapping_total,
        truth_anchor="distinct claim.kind in the sealed claim shards x dashboard/assets/data/view-copy.json kind_categories keys+values, recomputed each run",
        severity="critical",
        lesson_ref="the kind->colour map must be TOTAL, with no fallback branch, so a claim can never render with a mis-derived colour and a new kind reddens the board instead of quietly picking a default. Negative test: tools/tests/test_claim_category_mapping_total.py.",
    ),
    Invariant(
        name="view_category_not_hardcoded",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="the entity view reads a claim's colour CATEGORY from the map (view-copy kind_categories via state/copy.ts::kindCategory), never a hardcoded family literal per claim/kind. Surface-scoped: _ENTITY_VIEW_FILES lists the entity views this BINDS on -- read the tuple -- and it grows in the same patch as each new view; negative test proves it fires",
        check_fn=check_view_category_not_hardcoded,
        truth_anchor="the entity-view .ts bytes (_ENTITY_VIEW_FILES) scanned each run for a standalone colour-family-word string literal",
        severity="critical",
        lesson_ref="colour is assigned via the total kind->category table, never a per-claim literal, so the category logic stays single-source and cannot fork between the data and the view. Negative test: tools/tests/test_view_category_not_hardcoded.py.",
    ),
    Invariant(
        name="entity_pills_justified",
        anchor_class="external",  # an independent re-derivation from corpus-embed claims
        description="every PILL on a generated entity page (a condition's restore nutrients, an essential's help-with conditions + works-with partners) traces to a qualifying source claim. The essentials[]-union leak produces exactly an UNjustified pill (a nutrient flattened in from a DIFFERENT condition in a multi-condition claim); this gate recomputes the directed maps() + interaction relations independently and RED-flags any posted pill with no backing. Defense in depth beyond derived_artifacts_fresh (which only proves the artifact matches the generator)",
        check_fn=check_entity_pills_justified,
        truth_anchor="dashboard/assets/data/entity-page-data.json pills x an independent re-derivation from corpus-embed claims, recomputed each run",
        severity="critical",
        lesson_ref="the essentials[]-union fix, gated. Five misfit nutrients (Zinc, Chromium, Selenium, Tin, Vanadium on osteoporosis) and a set of phantom works-with pills leaked in via a single many-to-many claim: a nutrient named for one condition was flattened onto another in the same claim. This proves no such pill survives. Negative test: tools/tests/test_entity_pills_justified.py.",
    ),
    Invariant(
        name="no_positional_hero",
        anchor_class="structural",  # shape + wellformedness only — says nothing about whether a value is correct
        description="the entity page's curated primary 'what to do' slot is never auto-filled by a reference-table row (a base-line-program / dose-table claim in protocol_claim_ids), and the hero/primary is never chosen by array position. The DATA half binds unconditionally; the VIEW half is surface-scoped to _ENTITY_VIEW_FILES and BINDS on every file listed there -- read the tuple, not a count in prose",
        check_fn=check_no_positional_hero,
        truth_anchor="entity-page-data.json protocol_claim_ids x corpus-embed base_line_table + the entity-view .ts bytes scanned for a claims[0]/record[0] hero, recomputed each run",
        severity="critical",
        lesson_ref="a fluoride base-line dose-table row was promoted into the default-open GREEN 'what to do' slot purely because it came first, contradicting the same page's 'avoid fluoride'. A reference-table row is never a curated recommendation. Negative test: tools/tests/test_no_positional_hero.py.",
    ),
    Invariant(
        name="entity_page_enriched_matches_search",
        anchor_class="consistency",  # entity-page-data vs search-index — two derivations of one set; catches drift
        description="every condition/essential page's enriched 'Worth Knowing' section lists EXACTLY the claims the live search finds for that entity (state/search.ts::claimsForSubject = subject OR also_about). The page derive (search_sections) and the search derive computed this set two different ways and drifted -- the page used subject-only, dropping 1,086 also_about claim-instances that search still surfaced, so a page showed FEWER claims than its own search. This recomputes claimsForSubject independently and RED-flags any page whose enriched set differs (subset = search>page defect; superset = a page claim search can't reach)",
        check_fn=check_entity_page_enriched_matches_search,
        truth_anchor="dashboard/assets/data/entity-page-data.json search sections x an independent claimsForSubject (subject OR also_about) re-derivation from search-index.json, recomputed each run",
        severity="critical",
        lesson_ref="search surfaced more claims than the full topic page did -- no condition page should ever show less than its own search. Root cause: entity_page_derive.search_sections bucketed enriched claims by subject ONLY, while search.ts::claimsForSubject includes also_about -- so an also_about claim (Wallach's selenium answer naming hypothyroidism) was findable in search but absent from the hypothyroidism page. Fixed by including also_about in search_sections; gated here so the two derivations can never drift again. Negative test: tools/tests/test_entity_page_enriched_matches_search.py.",
    ),
    Invariant(
        name="offline_no_runtime_network",
        anchor_class="external",  # anchored outside our own data — the bytes the browser actually loads
        description="the shipped app (dashboard.html, assets/styles/*.css, dist/main.js) contains no construct that LOADS from off-machine — no fetch/WebSocket/importScripts to a remote url, no remote <script src>/<link href>/@import/url(). A url MENTIONED in sealed Wallach prose is not a load and is deliberately not matched; a load built from a runtime string is a labeled WISH",
        check_fn=check_offline_no_runtime_network,
        truth_anchor="the bytes of the files the browser actually opens from file://, re-read each run",
        severity="critical",
        lesson_ref="2026-08-03 doctor sweep — replaces the retired `dist/main.js gzipped <= 250 KB` size-limit budget, which measured 2.67 MB (10.7x over) and had been failing-and-bypassed rather than enforcing. Size was a proxy that also capped design ambition; this gates the actual promise (cannot be taken offline or broken by someone else's server) while vendored libraries are now explicitly allowed.",
    ),
    Invariant(
        name="vendor_assets_pinned",
        anchor_class="external",  # anchored outside our own data — file bytes + os-level existence
        description="every vendored design library in tools/design-libs/ matches the sha256 recorded in vendor-manifest.json, and every local url(...) in shipped CSS resolves on disk",
        check_fn=check_vendor_assets_pinned,
        truth_anchor="sha256 of each vendored file recomputed from disk x the committed manifest, plus os-level existence of every local CSS asset reference",
        severity="critical",
        lesson_ref="2026-08-03 doctor sweep — 'offline-first' now means vendored + pinned rather than small, so the pin has to be real. The CSS half has a prior incident: a 404'd @font-face src does not error, the token falls back and shifts metrics on EVERY element, presenting as 'everything slightly off' with a clean console.",
    ),
    Invariant(
        name="workspace_coverage_no_dead_rules",
        anchor_class="consistency",  # the sheet vs src/data — catches a rule whose referrer vanished, not a born-wrong value
        description="no class-selector rule in workspace-coverage.css is dead: every class token in a selector traces to a LIVE reference (src/**/*.ts non-test comment-stripped, dashboard.html, a coverage-layout data class field, or dynamic prefix-${...} construction) or sits on _WC_DEAD_RULE_ALLOWLIST with a reason; also flags a @keyframes defined here but animated nowhere. Fills the gap knip cannot see: CSS-rule liveness. Scope is class rules + this sheet's keyframes, NOT custom-property/@font-face liveness (the 2026-07-14 font-token disaster showed a token cannot be judged dead from this sheet alone)",
        check_fn=check_workspace_coverage_no_dead_rules,
        truth_anchor="workspace-coverage.css class selectors x the live reference surface (src + dashboard.html + coverage-layout data + dynamic stubs) + styles/*.css animation refs, re-derived each run",
        severity="critical",
        lesson_ref="a dead-CSS purge, prompted by the app being called clean when it was not. 51 dead class rules across two superseded UI generations (coverage-hero/stat/console/goal-chip + regimen-rail) plus a deleted footer, ~425 lines, that only demos still pulled in. knip (no_new_dead_code) is blind to CSS. Non-vacuous: an empty allowlist REDs on .is-foundation, and a synthetic .zzz-dead class REDs.",
    ),
]

# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def list_invariants(weekly: bool = False):
    """Return the invariants to run. weekly=True also includes weekly-cadence entries.

    NOTE: no invariant currently declares cadence='weekly', so both branches return
    the same list and --weekly cannot change the result today."""
    if weekly:
        return list(INVARIANTS)
    return [i for i in INVARIANTS if i.cadence == "daily"]


def _anchor_class_report(by_class):
    """The honest half of the score.

    A bare "N/N green" is a true sentence that does a false job. Read at a glance -- and
    restated by anyone summarising it -- it lands as a statement about WALLACH. It never was.
    Most of the board proves our files agree with each other, which is a statement about our
    bookkeeping: a planted 10x sodium fabrication once passed every gate green, because not
    one of them read Wallach's printed number.

    A single integer cannot carry that distinction, so it stops being the whole story here.
    This prints what each pass actually rests on. It is not a smaller number for its own
    sake -- consistency and structural gates catch real regressions and are worth keeping --
    it is a labelled one, so nobody can spend structural passes as if they were evidence
    about the source."""
    order = ("external", "consistency", "structural", "meta")
    gloss = {
        "external":    "anchored OUTSIDE our own data (book bytes · physical constants · git). "
                       "The only class that can catch a value that is WRONG BUT CONSISTENT.",
        "consistency": "our file A vs our file B. Catches DRIFT; blind to a value that was "
                       "wrong when written -- it would be wrong in both places.",
        "structural":  "shape + wellformedness only. Says nothing about whether a value is right.",
        "meta":        "checks a document about the gates, or guards a currently-empty set.",
    }
    lines = ["", "  what the board actually anchors to:"]
    for k in order:
        if k not in by_class:
            continue
        ok, bad = by_class[k]
        tot = ok + bad
        flag = "" if not bad else f"  <-- {bad} FAILING"
        lines.append(f"    {k:12} {ok:>2}/{tot:<2} {gloss[k]}{flag}")
    ext_ok, ext_bad = by_class.get("external", (0, 0))
    tot = sum(a + b for a, b in by_class.values())
    lines.append("")
    lines.append(f"  {ext_ok + ext_bad} of {tot} gates bear on truth outside our own files. "
                 f"A green board means NOTHING DRIFTED. It does not mean anything is RIGHT.")
    return "\n".join(lines)


def main():
    # Windows stdout/stderr default to cp1252, which raises UnicodeEncodeError
    # on the non-ASCII glyphs (arrows, command symbols) many invariant messages
    # carry; a UTF-8 Linux host never hits it, so the failure is host-specific.
    # Force UTF-8 on our own streams and export it so child processes
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
                    help="include weekly-cadence invariants (no-op today: nothing declares one)")
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
    by_class = {}
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
        p_, f_ = by_class.get(i.anchor_class, (0, 0))
        by_class[i.anchor_class] = (p_ + (1 if passed else 0), f_ + (0 if passed else 1))
        print(f"{status} [{i.severity:8}] {i.name}: {msg}")

    print(f"\n{n_pass}/{n_pass + n_fail} passed ({n_fail} failed)")
    print(_anchor_class_report(by_class))
    sys.exit(0 if n_fail == 0 else 1)


if __name__ == "__main__":
    main()
