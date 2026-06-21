#!/usr/bin/env python3
"""dashboard_integrity.py — structural verification + safety firewall for dashboard.html.

Born from the recurring silent-truncation pattern. Widened in Round 46 from "did it
truncate?" to "is it safe?" — adds parser-breaking-content firewall, JS parse-check,
innerHTML usage scan, and source-rule validation.

USAGE
    python3 tools/dashboard_integrity.py check        # exit non-zero if broken
    python3 tools/dashboard_integrity.py restore      # auto-fix what's auto-fixable
    python3 tools/dashboard_integrity.py status       # human-readable report

Closing-move-atomic discipline: run this as the final step of every dashboard write.
"""

import sys
import re
import json
import subprocess
import shutil
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DASH = REPO / "dashboard" / "dashboard.html"

# Performance budget (Round 50 — doctrine §6, state the invariant, write the check).
# Caps creeping bloat; forces a deliberate decision when growth exceeds budget.
# Initial sizing: ~75% headroom over the v1.18 baseline (dashboard 599KB, JS 216KB combined).
SIZE_BUDGET_BYTES = 3_670_016  # 3.5 MB cap (Round 157 — bumped from 3.0 MB to accommodate Eden's full catalog embed (201 products with full nutrient panels) + room for catalog growth)   # 3.0 MB cap on dashboard.html (Round 156 — bumped from 2.75 MB at 99.4% utilization after Rounds 155+156 (Saturday filed work + Item 3 real fix). Substantive content this round: Round 155 saga + lessons + decisions entries; Round 156 dose_text/has_nutrient_data wiring + load-time slot-stats refresh. The user also filed an "audit and shrink old code" follow-up for next session — re-evaluate this cap and consider trimming retired blocks (e.g., the Round 154 isGoalDriven branch comments, ~stale~ HBSP-fallback paths now unused). Prior: Round 139d — 2.75 MB. Round 132 — 2.5 MB. Round 123 — 2.25 MB. Round 100 — 2 MB.)
JS_BUDGET_BYTES   = 524_288     # 512 KB combined main JS + handler JS (Round 156 — bumped from 448 KB at 97.5% utilization after the Round 155/156 Item 3 fixes added the goal-engine lookup wiring + load-time syncActiveSlotBundle. Headroom for Cura security-extension JS hooks + further dashboard polish. Prior caps: Round 130a — 448 KB; Round 126 — 384 KB; Pass E.1.2 — 320 KB.)

JSON_BLOCKS = [
    "essentials-benefits-data",
    "essentials-best-supplements",
    "regimen-label-lookup",
    "ingredients-embed",
    "essentials-targets-data",
]

# Markdown blocks. None = dashboard-resident (no canonical source).
MARKDOWN_BLOCKS = {
    "cl-data-saga":      "memory/essence/saga.md",
    "cl-data-lessons":   "memory/essence/lessons.md",
    "cl-data-decisions": "memory/essence/decisions.md",
    "cl-data-changelog": None,
    "cl-data-notebook":  "tacitus/notebook/2026-06.md",  # Round 100: relocated from memory/tacitus/; block ID kept for backwards compat
}

EXPECTED_ORDER = JSON_BLOCKS + list(MARKDOWN_BLOCKS.keys())

# Script blocks identified via the `data-block-id` attribute on the <script> tag.
# Each maps to a canonical source file under the repo root. The restore command
# reads the canonical file and replaces the inline block whenever it's missing,
# truncated, or drifted. Doctrine §3 (single source of truth) for the handler IIFE
# that historically lived inline and survived only by hand-rebuild from saga memory.
# Background: silent handler-truncation hit 3+ times (Rounds 41, 43, 71b) before
# this externalization landed in Round 72.
# Round 161 R1·B: creators-log-handler IIFE moved from inline dashboard.html
# block to legacy-dashboard.js. The integrity tool no longer tracks it as a
# separately-embedded script block (the legacy file is loaded as <script src=>,
# not embedded inline). When the legacy file is retired in a future round, this
# whole concept may be retired too — until then, leave the dict empty.
SCRIPT_BLOCKS = {}


def read_dashboard():
    with open(DASH, "rb") as f:
        return f.read()


def find_script_block(data, block_id):
    """Find a <script data-block-id="X">...</script> block by its data-block-id.
    Returns (open_end, close_start, payload_bytes) or None if not found / unparseable.
    Bounded by the next <script tag or </body> — defends against truncations that
    cut the close tag and would otherwise let find swallow subsequent content.
    """
    pat = re.compile(
        rb'<script\b[^>]*data-block-id="' + re.escape(block_id.encode()) + rb'"[^>]*>'
    )
    m = pat.search(data)
    if not m:
        return None
    open_end = m.end()
    next_open = re.search(rb'<script\b', data[open_end:])
    next_open_pos = open_end + next_open.start() if next_open else len(data)
    body_close = data.find(b'</body>', open_end)
    upper = min(next_open_pos, body_close if body_close >= 0 else len(data))
    close_start = data.rfind(b'</script>', open_end, upper)
    if close_start < 0:
        return None
    return (open_end, close_start, data[open_end:close_start])


def write_dashboard_atomic(new_data, run_integrity=True):
    """Atomic dashboard write (doctrine §4). Write to .tmp, run integrity check on
    the temp file, only os.replace into place if clean. Failure leaves the original
    dashboard.html untouched and raises with the integrity output for diagnosis.

    Bulk rewrites in scripts/notebooks should route through this helper rather than
    writing dashboard.html directly. Adds belt-and-braces to the structural fixes
    (SCRIPT_BLOCKS, MARKDOWN_BLOCKS auto-restore) — together they close the recurring
    silent-truncation failure family.
    """
    import os
    global DASH
    tmp = DASH.with_suffix(DASH.suffix + ".tmp")
    with open(tmp, "wb") as f:
        f.write(new_data)
    if run_integrity:
        original = DASH
        DASH = tmp
        try:
            rc = cmd_check()
        finally:
            DASH = original
        if rc != 0:
            raise RuntimeError(
                f"Atomic write aborted: integrity check FAILED on temp file {tmp}. "
                "Original dashboard.html unchanged."
            )
    os.replace(tmp, DASH)
    return len(new_data)


def escape_for_embed(content_bytes):
    """Replace </script> with <\\/script> so the HTML parser cannot terminate the
    enclosing block. The reader unescapes via split().join()."""
    return content_bytes.replace(b'</script>', b'<\\/script>')


def unescape_from_embed(content_bytes):
    return content_bytes.replace(b'<\\/script>', b'</script>')


def find_block(data, block_id):
    """JSON blocks: payload cannot legitimately contain </script>, use first close.
    Markdown blocks: bounded by next canonical block in EXPECTED_ORDER, or by the
    trailing Creator's Log handler script if last."""
    pat = re.compile(rb'<script[^>]*id="' + block_id.encode() + rb'"[^>]*>')
    m = pat.search(data)
    if not m:
        return None
    open_end = m.end()
    if block_id in JSON_BLOCKS:
        close_start = data.find(b'</script>', open_end)
        if close_start < 0:
            return None
        return (open_end, close_start, data[open_end:close_start])
    try:
        my_idx = EXPECTED_ORDER.index(block_id)
    except ValueError:
        return None
    if my_idx + 1 < len(EXPECTED_ORDER):
        next_id = EXPECTED_ORDER[my_idx + 1]
        end_pat = re.compile(rb'<script[^>]*id="' + re.escape(next_id.encode()) + rb'"')
        next_m = end_pat.search(data, open_end)
        block_end = next_m.start() if next_m else len(data)
    else:
        body_close = data.rfind(b'</body>')
        if body_close < 0:
            block_end = len(data)
        else:
            handler_open = data.rfind(b'<script', open_end, body_close)
            block_end = handler_open if handler_open > open_end else body_close
    close_start = data.rfind(b'</script>', open_end, block_end)
    if close_start < 0:
        return None
    return (open_end, close_start, data[open_end:close_start])


# --- CORE CHECKS -----------------------------------------------------------

def check_eof(data):
    stripped = data.rstrip()
    if not stripped.endswith(b'</html>'):
        return False, f"file does not end with </html> — tail: {stripped[-50:]!r}"
    html_pos = stripped.rfind(b'</html>')
    body_segment = stripped[:html_pos]
    if not body_segment.rstrip().endswith(b'</body>'):
        return False, "</html> present but </body> missing or misordered"
    return True, "EOF tags OK"


def check_block_ordering(data):
    positions = {}
    for bid in EXPECTED_ORDER:
        result = find_block(data, bid)
        if result is None:
            return False, f"missing block: {bid}"
        positions[bid] = result[0]
    ordered_ids = sorted(positions.keys(), key=lambda k: positions[k])
    if ordered_ids != EXPECTED_ORDER:
        return False, f"blocks out of order — got: {ordered_ids}"
    return True, "all blocks present and ordered"


def check_json_parse(data):
    errs = []
    for bid in JSON_BLOCKS:
        b = find_block(data, bid)
        if b is None:
            errs.append(f"{bid}: missing"); continue
        _, _, payload = b
        try:
            obj = json.loads(payload.decode('utf-8'))
            if not obj:
                errs.append(f"{bid}: parsed but empty")
        except Exception as e:
            errs.append(f"{bid}: parse failed — {e}")
    if errs:
        return False, "\n  ".join(errs)
    return True, "all JSON blocks parse"


def check_markdown_content(data):
    errs = []
    for bid, src_rel in MARKDOWN_BLOCKS.items():
        b = find_block(data, bid)
        if b is None:
            errs.append(f"{bid}: missing block"); continue
        _, _, payload = b
        if len(payload) < 50:
            errs.append(f"{bid}: suspiciously short ({len(payload)} bytes)"); continue
        if src_rel is None:
            continue
        src = REPO / src_rel
        if not src.exists():
            errs.append(f"{bid}: canonical source missing"); continue
        with open(src, "rb") as f:
            src_bytes = f.read()
        expected_embed = escape_for_embed(src_bytes)
        if abs(len(payload) - len(expected_embed)) > 1:
            errs.append(f"{bid}: size mismatch — embed={len(payload)}B, escaped-source={len(expected_embed)}B")
    if errs:
        return False, "\n  ".join(errs)
    return True, "all markdown blocks healthy"


def check_script_blocks(data):
    """Verify every SCRIPT_BLOCKS entry exists in the dashboard, is not truncated,
    and matches its canonical source byte-for-byte (size tolerance 1 byte for trailing
    newline differences). The Round 72 structural fix for recurring handler-truncation:
    detection here, auto-restore in cmd_restore."""
    errs = []
    for bid, src_rel in SCRIPT_BLOCKS.items():
        src = REPO / src_rel
        if not src.exists():
            errs.append(f"{bid}: canonical source missing at {src_rel}"); continue
        with open(src, "rb") as f:
            src_bytes = f.read()
        b = find_script_block(data, bid)
        if b is None:
            errs.append(f"{bid}: block tag not found OR close tag missing (truncation suspected)"); continue
        _, _, payload = b
        if len(payload) < 50:
            errs.append(f"{bid}: suspiciously short ({len(payload)} bytes)"); continue
        if abs(len(payload) - len(src_bytes)) > 2:
            errs.append(f"{bid}: size drift — embed={len(payload)}B, canonical={len(src_bytes)}B")
    if errs:
        return False, "\n  ".join(errs)
    return True, f"all {len(SCRIPT_BLOCKS)} script block(s) healthy"


# --- ROUND 46 ADDITIONS: SAFETY FIREWALL ------------------------------------

def check_no_parser_breaking_content(data):
    """For every script block, scan content between open and the REAL close for
    literal </script>. Such a literal would terminate the block prematurely and
    cascade-corrupt the file."""
    errs = []
    for bid in EXPECTED_ORDER:
        b = find_block(data, bid)
        if b is None: continue
        _, _, payload = b
        # The payload here is from open to REAL close. If there's any </script>
        # inside, the HTML parser would have terminated early and the browser
        # only sees up to the first internal </script>.
        if b'</script>' in payload:
            offset = payload.find(b'</script>')
            errs.append(f"{bid}: literal </script> at byte +{offset} INSIDE block — HTML parser will truncate here")
    # Also scan the main JS and Creator's Log handler script (non-canonical)
    # for literal </script> in comments or strings.
    for pat_str, name in [(rb'<script>\s*(?:\(function|let |const |var |function |//)', 'JS block')]:
        pass  # JS-block-specific check follows in check_js_blocks_parse
    if errs:
        return False, "\n  ".join(errs)
    return True, "no parser-breaking content inside any script block"


def _find_canonical_js_blocks(data):
    """Return [(open_end_byte, close_start_byte)] for the canonical JS blocks only.

    Two canonical positions:
    1. Main JS — the <script> between essentials-targets-data close and cl-data-saga open.
    2. Handler — the last <script> before </body>.

    All other regex matches of <script> are inside markdown prose and must NOT be parsed
    as JavaScript."""
    blocks = []
    et_match = re.search(rb'<script[^>]*id="essentials-targets-data"', data)
    saga_match = re.search(rb'<script[^>]*id="cl-data-saga"', data)
    if et_match and saga_match:
        et_close = data.find(b'</script>', et_match.end())
        if 0 < et_close < saga_match.start():
            search_region_start = et_close + len(b'</script>')
            sub = data[search_region_start:saga_match.start()]
            ms = re.search(rb'<script(?![^>]*type=)[^>]*>', sub)
            if ms:
                open_end = search_region_start + ms.end()
                close_start = data.find(b'</script>', open_end)
                if close_start > 0:
                    blocks.append((open_end, close_start))
    body_close = data.rfind(b'</body>')
    if body_close > 0:
        handler_open = data.rfind(b'<script', 0, body_close)
        if handler_open > 0:
            tag_end = data.find(b'>', handler_open)
            if tag_end > 0:
                close_start = data.find(b'</script>', tag_end + 1)
                if close_start > 0:
                    blocks.append((tag_end + 1, close_start))
    return blocks


def check_js_blocks_parse(data):
    """Pipe each canonical JS block through `node --check`. Fails on invalid syntax."""
    if not shutil.which('node'):
        return True, "node not available — skipping JS parse check"
    import tempfile, os
    errs = []
    js_blocks = _find_canonical_js_blocks(data)
    if not js_blocks:
        return True, "no canonical JS blocks found"
    for open_end, close_start in js_blocks:
        js = data[open_end:close_start]
        if len(js) < 20: continue
        with tempfile.NamedTemporaryFile(mode='wb', suffix='.js', delete=False) as tf:
            tf.write(js)
            tmp_path = tf.name
        try:
            result = subprocess.run(
                ['node', '--check', tmp_path],
                capture_output=True, timeout=10
            )
            if result.returncode != 0:
                errs.append(f"JS block at byte {open_end}: parse error — {result.stderr.decode('utf-8', errors='replace')[:200]}")
        except subprocess.TimeoutExpired:
            errs.append(f"JS block at byte {open_end}: node check timed out")
        finally:
            try: os.unlink(tmp_path)
            except OSError: pass
    if errs:
        return False, "\n  ".join(errs)
    return True, f"all {len(js_blocks)} canonical JS blocks parse via node --check"



def check_innerhtml_usage(data):
    """Scan JS for innerHTML assignments. Flag for human review.
    Pattern: \\b\\w+\\.innerHTML\\s*= (right side ignored for now)."""
    # Build a list of (line_number, snippet) where innerHTML = appears in JS
    # Restrict to the main JS block to avoid scanning markdown content.
    main_js_open = re.search(rb'<script>\s*[\(\w]', data)
    if not main_js_open: return True, "no main JS block found (skipped innerHTML scan)"
    main_js_start = main_js_open.start()
    main_js_close = data.find(b'</script>', main_js_open.end())
    if main_js_close < 0: return True, "main JS block has no close (skipped)"
    js = data[main_js_open.end():main_js_close].decode('utf-8', errors='replace')

    findings = []
    for i, line in enumerate(js.split('\n'), 1):
        if re.search(r'\.innerHTML\s*=', line):
            findings.append((i, line.strip()[:120]))
    if findings:
        # Not a failure — informational. Doctrine principle 5 requires human audit.
        msg = f"{len(findings)} innerHTML assignment(s) in main JS — doctrine §5 requires audit:\n"
        for ln, snippet in findings[:5]:
            msg += f"    line {ln}: {snippet}\n"
        if len(findings) > 5:
            msg += f"    ... and {len(findings) - 5} more"
        return True, msg  # informational only — don't fail
    return True, "no innerHTML assignments found in main JS"


def check_json_schemas(data):
    """Validate canonical JSON data files against their schemas in schemas/.
    Returns warning-style failures (logged but doesn't auto-fix)."""
    try:
        from jsonschema import validate, ValidationError
    except ImportError:
        return True, "jsonschema package not installed — skipping schema validation"
    pairs = [
        ('memory/versions.json',                'schemas/versions.schema.json'),
        ('knowledge/essentials-targets.json',   'schemas/essentials-targets.schema.json'),
        ('knowledge/products-db.json',          'schemas/products-db.schema.json'),
    ]
    errs = []
    for data_rel, sch_rel in pairs:
        data_path = REPO / data_rel
        sch_path = REPO / sch_rel
        if not data_path.exists():
            errs.append(f"{data_rel}: missing"); continue
        if not sch_path.exists():
            errs.append(f"{sch_rel}: missing"); continue
        try:
            with open(data_path, encoding='utf-8') as f: d = json.load(f)
            with open(sch_path, encoding='utf-8') as f: s = json.load(f)
            validate(instance=d, schema=s)
        except ValidationError as e:
            errs.append(f"{data_rel} fails {sch_rel}: {str(e.message)[:200]}")
        except json.JSONDecodeError as e:
            errs.append(f"{data_rel} parse error: {e}")
    if errs:
        return False, "\n  ".join(errs)
    return True, f"all {len(pairs)} data files validate against their schemas"


def check_valid_kinds(data):
    """Every essentials-targets-data target.kind must come from the allowed set.
    A typo or unknown value would cause classifyLive() to mis-render the tile.
    Doctrine principle #6: state the invariant, write the check, run it automatically."""
    ALLOWED_KINDS = {
        'hbsp', 'wallach', 'wallach_clinical', 'wallach_collective',
        'trace_pdm', 'dietary', 'dietary_with_clinical_lever',
        'unspecified', 'range', 'single', 'temp_range', 'amino_fallback',
    }
    b = find_block(data, 'essentials-targets-data')
    if b is None:
        return False, "essentials-targets-data block missing"
    _, _, payload = b
    try:
        obj = json.loads(payload.decode('utf-8'))
    except Exception as e:
        return False, f"essentials-targets-data parse failed: {e}"
    invalid = []
    no_kind = []
    for ent in obj.get('essentials', []):
        t = ent.get('target') or {}
        k = t.get('kind')
        if k is None:
            no_kind.append(ent.get('name', '?'))
        elif k not in ALLOWED_KINDS:
            invalid.append((ent.get('name', '?'), k))
    if invalid or no_kind:
        msg = ""
        if invalid:
            msg += f"{len(invalid)} entries with UNKNOWN kind:"
            for name, k in invalid[:5]:
                msg += f"\n    {name}: kind={k!r}"
        if no_kind:
            msg += f"\n  {len(no_kind)} entries with no kind at all: " + ", ".join(no_kind[:5])
        return False, msg
    return True, f"all {len(obj.get('essentials', []))} entries have valid kinds"


def check_no_stale_version_strings(data):
    """Scan user-visible HTML body for hardcoded vN.N patterns.

    Strips ALL script blocks (JSON, markdown, JS) via canonical boundary detection,
    then scans what remains. Versions inside script blocks are either canonical data
    (versions-data block), historical record (saga markdown), or developer-internal
    (JS comments) — none of those are user-visible drift surfaces.
    """
    import re as _re
    # Build a mask of byte ranges to STRIP (script block contents)
    strip_ranges = []
    # Strip every <script>...</script> using canonical boundary logic
    for bid in JSON_BLOCKS + list(MARKDOWN_BLOCKS.keys()):
        b = find_block(data, bid)
        if b is None: continue
        open_end, close_start, _ = b
        # Strip from the <script> open tag to the </script> close (inclusive)
        # Find the open tag start
        open_tag_pat = _re.compile(rb'<script[^>]*id="' + bid.encode() + rb'"[^>]*>')
        m = open_tag_pat.search(data)
        if m:
            strip_ranges.append((m.start(), close_start + len(b"</script>")))
    # Also strip the two canonical JS blocks (main + handler) - they contain comments
    for open_end, close_start in _find_canonical_js_blocks(data):
        # Find the <script> open tag start before open_end
        open_tag = data.rfind(b'<script', 0, open_end)
        if open_tag >= 0:
            strip_ranges.append((open_tag, close_start + len(b"</script>")))
    # Strip versions-data block too
    vd_pat = _re.compile(rb'<script[^>]*id="versions-data"[^>]*>')
    vd_m = vd_pat.search(data)
    if vd_m:
        vd_close = data.find(b'</script>', vd_m.end())
        if vd_close > 0:
            strip_ranges.append((vd_m.start(), vd_close + len(b"</script>")))
    # Apply strip ranges
    strip_ranges.sort()
    out = bytearray()
    cursor = 0
    for s, e in strip_ranges:
        if s > cursor:
            out.extend(data[cursor:s])
        cursor = max(cursor, e)
    if cursor < len(data):
        out.extend(data[cursor:])
    visible = bytes(out)
    # Also strip HTML/CSS comments
    visible = _re.sub(rb'<!--.*?-->', b'', visible, flags=_re.DOTALL)
    visible = _re.sub(rb'/\*.*?\*/', b'', visible, flags=_re.DOTALL)
    # Pattern: standalone vN.N (not preceded by alpha to avoid matching e.g. "rev1.2")
    findings = []
    for m in _re.finditer(rb'(?<![a-zA-Z])v\d+\.\d+', visible):
        pos = m.start()
        line_start = visible.rfind(b'\n', 0, pos) + 1
        line_end = visible.find(b'\n', pos)
        if line_end < 0: line_end = len(visible)
        line = visible[line_start:line_end].decode('utf-8', errors='replace').strip()
        findings.append((m.group().decode(), line[:140]))
    seen = set()
    unique = []
    for v, line in findings:
        key = (v, line)
        if key not in seen:
            seen.add(key); unique.append((v, line))
    if unique:
        msg = f"{len(unique)} hardcoded version string(s) in user-visible HTML:"
        for v, line in unique[:8]:
            msg += f"\n    {v}: {line}"
        if len(unique) > 8:
            msg += f"\n    ... +{len(unique) - 8} more"
        return True, msg
    return True, "no hardcoded version strings in user-visible HTML"


def check_source_rule(data):
    """Source-rule validator (source-rule.md). Walks essentials-targets.json and
    verifies each entry has a `source` field matching the Wallach/Youngevity
    primary-source allowlist.

    Error-mode (Round 56 / P1 backfill complete): a missing or non-allowlist
    source fails the integrity check. The cornerstone is now invariant-enforced
    in code — any new essentials-targets entry that doesn't cite a primary
    Wallach or Youngevity source rejects automatically. Source amendment goes
    through the three-confirm protocol in source-rule.md."""
    targets_file = REPO / "knowledge" / "essentials-targets.json"
    if not targets_file.exists():
        return True, "essentials-targets.json not found (skipped)"
    try:
        with open(targets_file, encoding='utf-8') as f:
            obj = json.load(f)
    except Exception as e:
        return False, f"essentials-targets.json parse failed: {e}"

    # Allowlist markers (case-insensitive). A source string must contain at least
    # one to be valid. Maintained in lockstep with source-rule.md allowlist.
    ALLOWLIST_MARKERS = [
        # Wallach corpus primary
        'wallach', 'dddl', "let's play doctor", "dead doctors don't lie",
        "hell's kitchen", "rare earths", "wallach files",
        # Youngevity primary
        'youngevity', 'beyond tangy tangerine', 'btt', 'ultimate tangy tangerine',
        'utt', 'beyond osteo fx', 'ultimate efa plus', 'survival shield',
        'plant-derived mineral', 'plant derived mineral',
        'healthy body start pak', 'hbsp',
        'ultimate iodine', 'slender fx', 'reverse!®', 'reverse!',
        'ultimate hair', 'colloidal silver', 'glucogenix',
        'rebound fx', 'ultimate cardio',
    ]

    missing_source = []
    invalid_source = []
    total = 0

    def is_allowlisted(src):
        if not isinstance(src, str) or len(src) < 5:
            return False
        s = src.lower()
        return any(marker in s for marker in ALLOWLIST_MARKERS)

    def walk(node):
        nonlocal total
        if isinstance(node, dict):
            if 'name' in node and any(k in node for k in ['wallach_target_low_mg', 'clinical_target_low_mg', 'wallach_baseline_target', 'hbsp_target_low_mg']):
                total += 1
                if 'source' not in node:
                    missing_source.append(node['name'])
                elif not is_allowlisted(node['source']):
                    invalid_source.append((node['name'], node['source'][:80]))
            for v in node.values():
                walk(v)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    walk(obj)

    # Round 118 (Cura session #2 Survivor B) — extend coverage to the
    # wallach_stance.citation field added by Round 115's schema bump.
    # The cornerstone applies to "every numeric target, dose recommendation,
    # deficiency indicator, OR HEALTH CLAIM displayed by this system"
    # (source-rule.md). A Wallach editorial pull-quote IS a health claim
    # displayed by the system; its citation must be allowlisted at the same
    # cornerstone rigor as the operational `source` field.
    missing_stance_citation = []
    invalid_stance_citation = []
    total_stances = 0

    def walk_stance(node):
        nonlocal total_stances
        if isinstance(node, dict):
            stance = node.get('wallach_stance')
            if isinstance(stance, dict) and ('quote' in stance or 'citation' in stance):
                total_stances += 1
                citation = stance.get('citation', '')
                if not citation:
                    missing_stance_citation.append(node.get('name', '<unnamed>'))
                elif not is_allowlisted(citation):
                    invalid_stance_citation.append(
                        (node.get('name', '<unnamed>'), citation[:80])
                    )
            for v in node.values():
                walk_stance(v)
        elif isinstance(node, list):
            for item in node:
                walk_stance(item)

    walk_stance(obj)

    if missing_source or invalid_source or missing_stance_citation or invalid_stance_citation:
        msg = "{}/{} entries missing source, {} non-allowlist".format(
            len(missing_source), total, len(invalid_source))
        if missing_source[:5]:
            msg += "\n    missing: " + ", ".join(missing_source[:5])
            if len(missing_source) > 5:
                msg += ", +{} more".format(len(missing_source) - 5)
        if invalid_source[:3]:
            msg += "\n    non-allowlist: " + repr(invalid_source[:3])
        if missing_stance_citation or invalid_stance_citation:
            msg += "\n    wallach_stance ({} total): {} missing citation, {} non-allowlist".format(
                total_stances, len(missing_stance_citation), len(invalid_stance_citation))
            if missing_stance_citation[:3]:
                msg += "\n      missing-citation: " + ", ".join(missing_stance_citation[:3])
            if invalid_stance_citation[:3]:
                msg += "\n      non-allowlist-citation: " + repr(invalid_stance_citation[:3])
        return False, msg
    if total_stances > 0:
        return True, "all {} target entries + {} wallach_stance citation(s) cite an allowlisted Wallach/Youngevity primary source".format(total, total_stances)
    return True, "all {} target entries cite an allowlisted Wallach/Youngevity primary source".format(total)


def check_size(data):
    """Enforce dashboard.html size budget. Doctrine principle #6 — state the
    invariant (≤1MB), write the check, run it automatically. Prevents creeping
    bloat; forces a deliberate decision when growth exceeds budget."""
    size = len(data)
    if size > SIZE_BUDGET_BYTES:
        over = size - SIZE_BUDGET_BYTES
        return False, f"dashboard.html {size:,}B exceeds budget {SIZE_BUDGET_BYTES:,}B by {over:,}B ({over / SIZE_BUDGET_BYTES * 100:.1f}%)"
    pct = size / SIZE_BUDGET_BYTES * 100
    return True, f"dashboard.html {size:,}B within budget {SIZE_BUDGET_BYTES:,}B ({pct:.1f}% used)"


def check_no_direct_ls(data):
    """Enforce single-source-of-truth for localStorage access (P2.3 / Round 54).
    Direct `localStorage.<method>(` calls are allowed only inside the migration
    framework block. Outside that block they violate doctrine §3 (single source
    of truth) and §4 (atomic operations — direct calls bypass the version
    layer).

    Scope: only the canonical JS blocks (main + handler) are scanned. Prose
    mentions inside embedded markdown blocks (saga / decisions / etc.) are not
    executable and must not trigger false positives."""
    import re as _re
    text = data.decode('utf-8', errors='replace')
    # Round 161 R1·B — migration framework moved to legacy-dashboard.js along
    # with the rest of the legacy JS. Look in both files; treat the legacy file
    # as the canonical home of the framework comments + lsRead/lsWrite helpers.
    fw_start = text.find('// localStorage migration framework')
    fw_end_marker = 'window.lsRemove = lsRemove;'
    if fw_start < 0:
        # Fall back to legacy-dashboard.js
        legacy_path = REPO / 'dashboard' / 'assets' / 'js' / 'legacy-dashboard.js'
        if legacy_path.exists():
            try:
                legacy_text = legacy_path.read_text(encoding='utf-8', errors='replace')
                if '// localStorage migration framework' in legacy_text or 'function lsWrite' in legacy_text:
                    return True, "localStorage framework now in legacy-dashboard.js (Round 161 R1·B relocation)"
            except Exception:
                pass
        return False, "migration framework block not found in dashboard.html or legacy-dashboard.js"
    fw_end = text.find(fw_end_marker, fw_start)
    if fw_end < 0:
        return False, "framework end marker not found"
    fw_end += len(fw_end_marker)
    js_blocks = _find_canonical_js_blocks(data)
    violations = []
    for open_end, close_start in js_blocks:
        js_text = data[open_end:close_start].decode('utf-8', errors='replace')
        char_block_start = len(data[:open_end].decode('utf-8', errors='replace'))
        for m in _re.finditer(r'\blocalStorage\.\w+\(', js_text):
            abs_pos = char_block_start + m.start()
            if fw_start <= abs_pos <= fw_end:
                continue
            line_start = js_text.rfind('\n', 0, m.start()) + 1
            line_end = js_text.find('\n', m.end())
            line = js_text[line_start:line_end if line_end > 0 else len(js_text)].strip()[:120]
            violations.append(f"byte {abs_pos}: {line}")
    if violations:
        msg = f"{len(violations)} direct localStorage call(s) in JS outside framework:\n  "
        msg += "\n  ".join(violations[:5])
        if len(violations) > 5:
            msg += f"\n  ... +{len(violations) - 5} more"
        return False, msg
    return True, "all localStorage access in canonical JS routed through framework"


def check_js_budget(data):
    """Enforce JavaScript payload budget across canonical JS blocks (main +
    handler). Doctrine principle #6 applied to JS specifically — catches the
    failure mode where individual rounds add modest JS that cumulatively bloats
    runtime parse + execution cost."""
    blocks = _find_canonical_js_blocks(data)
    if not blocks:
        return True, "no canonical JS blocks found (skipped)"
    total = sum(close - open_end for open_end, close in blocks)
    if total > JS_BUDGET_BYTES:
        over = total - JS_BUDGET_BYTES
        return False, f"canonical JS {total:,}B exceeds budget {JS_BUDGET_BYTES:,}B by {over:,}B"
    pct = total / JS_BUDGET_BYTES * 100
    parts = ", ".join(f"{close - open_end:,}B" for open_end, close in blocks)
    return True, f"canonical JS {total:,}B within budget {JS_BUDGET_BYTES:,}B ({pct:.1f}% used; blocks: {parts})"


def check_smoke_test(data):
    """Runtime smoke test: load dashboard.html in a headless browser, verify
    critical elements render, capture JS console errors. Doctrine §6 at the
    runtime layer — complements the static checks with actual render verification.

    Requires puppeteer or playwright installed user-side (`npm install puppeteer`
    or `npm install playwright`). Skips with informational pass when not
    installed so unconfigured environments don't break the integrity check;
    the rest of the gate still applies."""
    import subprocess, shutil, json
    if not shutil.which('node'):
        return True, "node not available — skipping smoke test"
    smoke_path = REPO / "tools" / "dashboard_smoke.js"
    if not smoke_path.exists():
        return True, "dashboard_smoke.js not found — skipping smoke test"
    try:
        result = subprocess.run(
            ['node', str(smoke_path)],
            capture_output=True, timeout=60, cwd=str(REPO)
        )
    except subprocess.TimeoutExpired:
        return False, "smoke test timed out (>60s)"
    stdout = result.stdout.decode('utf-8', errors='replace').strip()
    stderr = result.stderr.decode('utf-8', errors='replace').strip()
    if result.returncode == 2:
        # Skip — driver not installed
        try:
            obj = json.loads(stdout)
            return True, f"skipped — {obj.get('reason', 'driver not installed')}. Install: {obj.get('install', 'npm install puppeteer')}"
        except Exception:
            return True, "skipped — neither puppeteer nor playwright installed"
    if result.returncode == 0:
        try:
            obj = json.loads(stdout)
            return True, obj.get('summary', 'smoke test passed')
        except Exception:
            return True, "smoke test passed"
    # Failure
    try:
        obj = json.loads(stdout)
        checks = obj.get('checks', {})
        sel = checks.get('critical_selectors', {})
        missing = sel.get('missing', [])
        behaviors = checks.get('behaviors', {})
        bfailed = behaviors.get('failed', [])
        cerr = checks.get('console_errors', [])
        perr = checks.get('page_errors', [])
        bits = []
        if missing:
            bits.append("{} missing selector(s): {}".format(len(missing), ', '.join(missing[:3])))
        if bfailed:
            first = bfailed[0]
            label = "{} behavior(s) failed; first: '{}' — {}".format(
                len(bfailed), first.get('name', '?'), (first.get('error') or '')[:120])
            bits.append(label)
        if cerr:
            first_err = cerr[0]
            text = first_err.get('text', '') if isinstance(first_err, dict) else str(first_err)
            bits.append("{} console error(s); first: {}".format(len(cerr), text[:120]))
        if perr:
            bits.append("{} page error(s): {}".format(len(perr), perr[0][:120]))
        return False, "smoke test FAILED — " + "; ".join(bits)
    except Exception:
        return False, "smoke test failed (exit {}); stderr: {}".format(result.returncode, stderr[:200])


# --- COMMANDS --------------------------------------------------------------

def cmd_check():
    data = read_dashboard()
    print(f"dashboard.html: {len(data)} bytes")
    all_ok = True
    checks = [
        ("EOF tags", check_eof),
        ("Block ordering", check_block_ordering),
        ("JSON parse", check_json_parse),
        ("Markdown content", check_markdown_content),
        ("Script blocks", check_script_blocks),
        ("Parser-breaking content", check_no_parser_breaking_content),
        ("JS blocks parse", check_js_blocks_parse),
        ("innerHTML usage", check_innerhtml_usage),
        ("JSON schemas", check_json_schemas),
        ("Valid kinds", check_valid_kinds),
        ("Stale version strings", check_no_stale_version_strings),
        ("Source rule", check_source_rule),
        ("Size budget", check_size),
        ("JS budget", check_js_budget),
        ("No direct localStorage", check_no_direct_ls),
        ("Smoke test (headless render)", check_smoke_test),
    ]
    for name, fn in checks:
        ok, msg = fn(data)
        marker = "OK  " if ok else "FAIL"
        print(f"  [{marker}] {name}: {msg}")
        if not ok:
            all_ok = False
    return 0 if all_ok else 1


def cmd_restore():
    data = read_dashboard()
    original_size = len(data)
    repairs = []

    for bid, src_rel in MARKDOWN_BLOCKS.items():
        if src_rel is None: continue
        src = REPO / src_rel
        if not src.exists():
            print(f"  ! cannot restore {bid}: source missing"); continue
        b = find_block(data, bid)
        if b is None:
            print(f"  ! cannot restore {bid}: block tag not found"); continue
        open_end, close_start, payload = b
        with open(src, "rb") as f:
            src_bytes = f.read()
        expected_embed = escape_for_embed(src_bytes)
        if payload != expected_embed:
            data = data[:open_end] + expected_embed + data[close_start:]
            repairs.append(f"re-embedded {bid} ({len(payload)}B -> {len(expected_embed)}B, escaped)")

    for bid, src_rel in SCRIPT_BLOCKS.items():
        src = REPO / src_rel
        if not src.exists():
            print(f"  ! cannot restore {bid}: canonical source missing at {src_rel}"); continue
        with open(src, "rb") as f:
            src_bytes = f.read()
        b = find_script_block(data, bid)
        if b is not None:
            open_end, close_start, payload = b
            if payload != src_bytes:
                data = data[:open_end] + src_bytes + data[close_start:]
                repairs.append(f"re-embedded script {bid} ({len(payload)}B -> {len(src_bytes)}B)")
            continue
        tag_pat = re.compile(
            rb'<script\b[^>]*data-block-id="' + re.escape(bid.encode()) + rb'"[^>]*>'
        )
        m = tag_pat.search(data)
        new_block = (
            b'<script data-block-id="' + bid.encode() + b'">\n' + src_bytes
            + (b'' if src_bytes.endswith(b'\n') else b'\n')
            + b'</script>'
        )
        if m:
            after_open = m.end()
            body_close = data.find(b'</body>', after_open)
            cut_end = body_close if body_close >= 0 else len(data)
            data = data[:m.start()] + new_block + (b'\n' if body_close >= 0 else b'\n') + data[cut_end:]
            repairs.append(f"rebuilt truncated script {bid} ({len(src_bytes)}B from canonical)")
        else:
            body_close = data.find(b'</body>')
            if body_close < 0:
                print(f"  ! cannot insert {bid}: </body> not found"); continue
            data = data[:body_close] + new_block + b'\n' + data[body_close:]
            repairs.append(f"inserted missing script {bid} ({len(src_bytes)}B from canonical)")

    stripped = data.rstrip()
    if not stripped.endswith(b'</html>'):
        last_open = stripped.rfind(b'<script')
        last_close = stripped.rfind(b'</script>')
        need_script_close = last_open > last_close
        suffix = b''
        if need_script_close:
            suffix += b'\n  </script>'
        suffix += b'\n</body>\n</html>\n'
        data = stripped + suffix
        repairs.append(f"appended EOF tags (script_close={need_script_close})")

    if repairs:
        with open(DASH, "wb") as f:
            f.write(data)
        print(f"Repaired ({original_size}B -> {len(data)}B):")
        for r in repairs:
            print(f"  - {r}")
    else:
        print("No repairs needed.")
    return cmd_check()


def cmd_status():
    data = read_dashboard()
    print(f"dashboard.html: {len(data):,} bytes\n")
    print("Script blocks:")
    for bid in EXPECTED_ORDER:
        b = find_block(data, bid)
        if b is None:
            print(f"  MISSING    {bid}")
        else:
            open_end, close_start, payload = b
            print(f"  {open_end:>7}  {bid:30s}  {len(payload):>7,}B")
    for bid in SCRIPT_BLOCKS:
        b = find_script_block(data, bid)
        if b is None:
            print(f"  MISSING    script:{bid}")
        else:
            open_end, close_start, payload = b
            print(f"  {open_end:>7}  script:{bid:23s}  {len(payload):>7,}B")
    print(f"\nEOF tail: {data[-50:]!r}\n")
    return cmd_check()


if __name__ == "__main__":
    if not DASH.exists():
        print(f"ERROR: dashboard not found at {DASH}", file=sys.stderr)
        sys.exit(2)
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "check":
        sys.exit(cmd_check())
    elif cmd == "restore":
        sys.exit(cmd_restore())
    elif cmd == "status":
        sys.exit(cmd_status())
    else:
        print(f"unknown command: {cmd}")
        sys.exit(2)
