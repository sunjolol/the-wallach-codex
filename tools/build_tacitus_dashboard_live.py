#!/usr/bin/env python3
"""
build_tacitus_dashboard_live.py — parse real Tacitus output → LIVE_DATA embed.

Reads:
  - tacitus/sentinel.json           (last_reflection_date, mode times)
  - tacitus/audit-history.json      (per-night Aegis records, for calendar)
  - tacitus/notebook/YYYY-MM.md     (current month — full prose for parsing)

Writes:
  - tacitus/dashboard/index.html    (replaces `const LIVE_DATA = null;` with
                                     `const LIVE_DATA = {...};`)

Discipline (Round 101 contamination guardrail extended):
  - reads tacitus/* files only; never writes to them.
  - dashboard write goes through safe_write.replace (atomic, byte-verified).
  - if parse fails on any required field, hard fail with explicit message.
    No silent fallback to demo data.

Run after every Tacitus night before the user opens the dashboard, or via the
Reload button workflow.
"""
from __future__ import annotations

import datetime as _dt
import json
import pathlib
import re
import sys

# Resolve project root from this file's location
ROOT = pathlib.Path(__file__).resolve().parent.parent
TACITUS = ROOT / "tacitus"
NOTEBOOK_DIR = TACITUS / "notebook"
SENTINEL = TACITUS / "sentinel.json"
AUDIT_HISTORY = TACITUS / "audit-history.json"
DASHBOARD = TACITUS / "dashboard" / "index.html"

# Import safe_write (sibling module)
sys.path.insert(0, str(ROOT / "tools"))
import safe_write  # type: ignore  # noqa: E402


# ─────────────────────────────────────────────────────────────────────────────
# Notebook parsing
# ─────────────────────────────────────────────────────────────────────────────

SESSION_HEADER_RE = re.compile(
    r"^\((?P<date>\d{4}-\d{2}-\d{2}) at (?P<time>[^)]+)\) — "
    r"(?P<mode>Cura|Vision|Aegis) session #(?P<session>\d+)"
    r"(?P<suffix>.*)$",
    re.MULTILINE,
)


def parse_notebook_sessions(notebook_text: str) -> list[dict]:
    """Yield ordered session dicts: date, time, mode, session, body.

    Body is the prose between this header's separator and the next header's
    separator (or EOF). Each header sits on its own line, with surrounding
    ─── dividers.
    """
    matches = list(SESSION_HEADER_RE.finditer(notebook_text))
    sessions = []
    for i, m in enumerate(matches):
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(notebook_text)
        body = notebook_text[start:end]
        sessions.append(
            {
                "date": m["date"],
                "time": m["time"].strip(),
                "mode": m["mode"],
                "session": int(m["session"]),
                "suffix": m["suffix"].strip(),
                "body": body,
            }
        )
    return sessions


# ─────────────────────────────────────────────────────────────────────────────
# Round 137 — fail-loud-when-degenerate guard
# ─────────────────────────────────────────────────────────────────────────────

class ExtractionHealthError(Exception):
    """Raised when a parser silently extracts zero items from a substantive section.

    Adopted Round 137 (2026-06-19) after Cura session #3's prose drift produced
    7 candidates / 0 prune verdicts / 0 deepen survivors that the dashboard
    rendered as "avg 0" instead of failing loudly. Doctrine §1 (no silent
    failures): when a parser's input has substantive body but its output is
    empty, raise rather than ship degenerate data downstream.
    """


def _looks_substantive(section: str, marker_word: str) -> bool:
    """A section is 'substantive' if it has >500 chars stripped.

    The marker_word arg is retained for documentation but is NOT consulted —
    early Round 137 implementation gated on `^marker_word` start-of-line, which
    silently passed the guard when the marker itself drifted (e.g., "Candidate"
    →  "Cnd" via a regex change upstream). The size-only check is robust
    against marker drift; any real Phase 2 PRUNE prose is multi-thousand chars,
    while a legitimate "no candidates this run" wrap-up paragraph is <300.
    Threshold of 500 cleanly distinguishes; future tuning is straightforward.
    """
    del marker_word  # retained in signature for self-documenting call sites
    return len(section.strip()) > 500


def _assert_extraction_health(
    mode: str,
    scan_section: str, candidates: list,
    prune_section: str, verdicts: list,
    deepen_section: str, deepen: list,
) -> None:
    """Raise if any phase has substantive input but zero extracted items.

    Structural cure for the silent-degenerate-parse failure mode. The build
    script's main() will catch this and re-raise as SystemExit so the dashboard
    write is aborted; the previous (correct) dashboard remains on disk. The
    paired daily invariant `check_tacitus_dashboard_extraction_health` provides
    defense-in-depth at audit-time.
    """
    failures: list[str] = []
    if _looks_substantive(scan_section, "Candidate") and len(candidates) == 0:
        failures.append(f"{mode} Phase 1 SCAN extracted 0 candidates from substantive section")
    if _looks_substantive(prune_section, "Candidate") and len(verdicts) == 0:
        failures.append(f"{mode} Phase 2 PRUNE extracted 0 verdicts from substantive section")
    if _looks_substantive(deepen_section, "Survivor") and len(deepen) == 0:
        failures.append(f"{mode} Phase 3 DEEPEN extracted 0 survivors from substantive section")
    if failures:
        raise ExtractionHealthError(
            "Parser degenerate output (Round 137 fail-loud guard):\n  - "
            + "\n  - ".join(failures)
            + "\n\nLikely cause: notebook prose shape drifted from regex expectations. "
            "Inspect the affected section in tacitus/notebook/YYYY-MM.md and update "
            "the regex in tools/build_tacitus_dashboard_live.py to accept the new shape "
            "(supporting both old and new shapes — defense in depth). Do NOT silently "
            "ship degenerate data; the dashboard at avg-0 is worse than a stale dashboard."
        )


# ─────────────────────────────────────────────────────────────────────────────
# Cura parsing — extracts scan candidates, prune verdicts, deepen survivors,
# cross-pollinate prose, self-audit prose.
# ─────────────────────────────────────────────────────────────────────────────

def _strip_text(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def parse_cura_session(body: str, aegis_scores: dict) -> dict:
    """Build the renderer-expected Cura phases dict.

    aegis_scores: {"scan": N, "prune": N, "deepen": N, "cross": N, "self": N}
    These come from the Aegis verdicts for this Cura session and supply the
    .score field. Cura's prose carries the substance; Aegis carries the score.
    """
    # Phase 1 candidates — pattern "  N. <text> (file: <surface>)"
    scan_section = _section(body, "PHASE 1 — SCAN", "PHASE 2 — PRUNE")
    candidates = []
    # Sub-sections are labeled "Bug sub-check:", "Contradiction sub-check:", etc.
    # Round 137: extended to 5 sub-checks (Translation-quality added Round 136) and
    # allow an optional trailing parenthetical (e.g. "(sampled oldest-first ...)").
    # Round 156: extended to 6 sub-checks (Security added) per accept-all-shapes
    # alternation pattern (verified-patterns.md). Never replace, always extend.
    sub_re = re.compile(
        r"^(Bug|Contradiction|Integrity|Architectural|Translation-quality|Security)"
        r"\s+sub-check(?:\s+\([^)]*\))?:\s*$",
        re.MULTILINE,
    )
    sub_matches = list(sub_re.finditer(scan_section))
    for si, sm in enumerate(sub_matches):
        sub = sm.group(1)
        sub_start = sm.end()
        sub_end = sub_matches[si + 1].start() if si + 1 < len(sub_matches) else len(scan_section)
        sub_body = scan_section[sub_start:sub_end]
        # Numbered candidates inside this sub-section
        cand_re = re.compile(
            r"^\s*(\d+)\.\s+(.*?)(?=^\s*\d+\.\s|\Z)",
            re.MULTILINE | re.DOTALL,
        )
        for cm in cand_re.finditer(sub_body):
            n = int(cm.group(1))
            text = _strip_text(cm.group(2))
            # Pull out trailing "(file: ...)" surface
            surf_m = re.search(r"\(file:\s*([^)]+)\)\s*$", text)
            surface = surf_m.group(1).strip() if surf_m else ""
            if surf_m:
                text = text[: surf_m.start()].rstrip()
            candidates.append(
                {"sub": sub, "n": n, "text": text, "surface": surface}
            )

    # Phase 2 prune verdicts
    prune_section = _section(body, "PHASE 2 — PRUNE", "PHASE 3 — DEEPEN")
    verdicts = []
    # Round 137: accept BOTH prose shapes observed in the wild.
    #   Two-line (cura.md prompt example, sessions #1/#2):
    #       Candidate N (kind — desc):
    #         VERDICT. reasoning...
    #   Single-line (session #3):
    #       Candidate N (kind — desc): VERDICT. reasoning...
    # The verdict word is restricted to the known enum (LAND/PRUNE/NEAR-MISS/
    # CONSIDERED) so accidental matches on prose tokens cannot false-positive.
    # Trailing period after the verdict is optional (session #3 wrote
    # "PRUNE per cap discipline" with no period — must still match).
    verdict_re = re.compile(
        r"^Candidates?\s+([\d\s\+]+)\s*\(([^)]+)\):\s+"
        r"(?:MERGE INTO\s+)?"  # Cura #2 candidate 4: "MERGE INTO LAND with Candidate 3"
        r"(LAND|PRUNE|NEAR-MISS|CONSIDERED)\b\.?\s*"
        r"(.*?)(?=^Candidates?\s+|\Z)",
        re.MULTILINE | re.DOTALL,
    )
    for vm in verdict_re.finditer(prune_section):
        ns = [int(x.strip()) for x in vm.group(1).replace("+", " ").split()]
        verdict = vm.group(3).strip()
        reasoning = _strip_text(vm.group(4))
        # Soft cap to bound JS payload; renderer does display truncation.
        if len(reasoning) > 2500:
            reasoning = reasoning[:2497] + "..."
        for n in ns:
            verdicts.append({"n": n, "verdict": verdict, "reasoning": reasoning})
    verdicts.sort(key=lambda v: v["n"])

    # Phase 3 deepen — Survivor A, Survivor B blocks
    deepen_section = _section(body, "PHASE 3 — DEEPEN", "PHASE 4 — CROSS-POLLINATE")
    deepen = _parse_deepen_block(deepen_section, aegis_scores)

    # Phase 4 cross-pollinate prose
    cross_section = _section(body, "PHASE 4 — CROSS-POLLINATE", "PHASE 5 — SELF-AUDIT")
    cross_text = _first_paragraph(cross_section, max_chars=3000)

    # Phase 5 self-audit prose
    self_section = _section(body, "PHASE 5 — SELF-AUDIT", "— Tacitus")
    self_text = _first_paragraph(self_section, max_chars=3000)

    # Round 137 — fail loud if any phase silently degenerated to zero items.
    # Defense in depth: paired with check_tacitus_dashboard_extraction_health
    # at audit time and with the safe_write byte-verify on dashboard writes.
    _assert_extraction_health(
        "Cura",
        scan_section, candidates,
        prune_section, verdicts,
        deepen_section, deepen,
    )

    return {
        "tags": ["cura"],
        "phases": {
            "scan": {
                "score": aegis_scores.get("scan", 0),
                "candidates": candidates,
                "note": f"{len(candidates)} candidates across the five sub-checks. See machinery for full prose.",
            },
            "prune": {
                "score": aegis_scores.get("prune", 0),
                "verdicts": verdicts,
            },
            "deepen": deepen,
            "cross_pollinate": {
                "score": aegis_scores.get("cross", 0),
                "text": cross_text,
            },
            "self_audit": {
                "score": aegis_scores.get("self", 0),
                "text": self_text,
            },
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# Vision parsing
# ─────────────────────────────────────────────────────────────────────────────

def parse_vision_session(body: str, aegis_scores: dict) -> dict:
    """Build the renderer-expected Vision phases dict.

    Vision's scan uses a numbered list (1., 2., ...) with "touches: ..." trailers.
    Vision's prune is gate-by-gate per candidate.
    """
    # Phase 1 scan
    scan_section = _section(body, "PHASE 1 — SCAN", "PHASE 2 — PRUNE")
    candidates = []
    cand_re = re.compile(
        r"^\s*(\d+)\.\s+(.*?)(?=^\s*\d+\.\s+|\Z)",
        re.MULTILINE | re.DOTALL,
    )
    for cm in cand_re.finditer(scan_section):
        n = int(cm.group(1))
        text = _strip_text(cm.group(2))
        touches_m = re.search(r"\(touches:\s*([^)]+)\)\s*$", text)
        touches = touches_m.group(1).strip() if touches_m else ""
        if touches_m:
            text = text[: touches_m.start()].rstrip()
        candidates.append({"n": n, "text": text, "touches": touches})

    # Phase 2 prune — gate-by-gate per candidate
    prune_section = _section(body, "PHASE 2 — PRUNE", "PHASE 3 — DEEPEN")
    verdicts = []
    # Pattern: "Candidate N — <name>:\n  Gate 1 (...): ...\n  Gate 2 ...\n  Gate 3 ...\n  Verdict: <V>"
    cand_block_re = re.compile(
        r"^Candidate\s+(\d+)\s+—\s+(.+?):\s*\n(.*?)(?=^Candidate\s+\d+\s+—|\Z)",
        re.MULTILINE | re.DOTALL,
    )
    for cb in cand_block_re.finditer(prune_section):
        n = int(cb.group(1))
        block = cb.group(3)
        gate1 = _extract_inline_gate(block, "Gate 1")
        gate2 = _extract_inline_gate(block, "Gate 2")
        gate3 = _extract_inline_gate(block, "Gate 3")
        vm = re.search(r"^\s*Verdict:\s*(\S[^.\n]*)", block, re.MULTILINE)
        verdict = "LAND"
        if vm:
            vtxt = vm.group(1).strip().rstrip(".").upper()
            if "NEAR-MISS" in vtxt:
                verdict = "NEAR-MISS"
            elif "CONSIDERED" in vtxt:
                verdict = "CONSIDERED"
            elif "LAND" in vtxt:
                verdict = "LAND"
            elif "PRUNE" in vtxt:
                verdict = "PRUNE"
        verdicts.append(
            {
                "n": n,
                "verdict": verdict,
                "gate1": _cap(gate1, 2500),
                "gate2": _cap(gate2, 2500),
                "gate3": _cap(gate3, 2500),
            }
        )
    # Count summary
    counts = {"LAND": 0, "NEAR-MISS": 0, "CONSIDERED": 0, "PRUNE": 0}
    for v in verdicts:
        counts[v["verdict"]] = counts.get(v["verdict"], 0) + 1
    summary_parts = [f"{n} {v}" for v, n in counts.items() if n > 0]
    prune_summary = " · ".join(summary_parts) if summary_parts else ""

    # Phase 3 deepen — Survivor A, B
    deepen_section = _section(body, "PHASE 3 — DEEPEN", "PHASE 4 — CROSS-POLLINATE")
    deepen = _parse_deepen_block(deepen_section, aegis_scores)

    cross_section = _section(body, "PHASE 4 — CROSS-POLLINATE", "PHASE 5 — SELF-AUDIT")
    cross_text = _first_paragraph(cross_section, max_chars=3000)

    self_section = _section(body, "PHASE 5 — SELF-AUDIT", "— Tacitus")
    self_text = _first_paragraph(self_section, max_chars=3000)

    # Round 137 — fail loud if any phase silently degenerated to zero items.
    _assert_extraction_health(
        "Vision",
        scan_section, candidates,
        prune_section, verdicts,
        deepen_section, deepen,
    )

    return {
        "tags": ["vision"],
        "phases": {
            "scan": {
                "score": aegis_scores.get("scan", 0),
                "candidates": candidates,
            },
            "prune": {
                "score": aegis_scores.get("prune", 0),
                "verdicts": verdicts,
                "summary": prune_summary,
            },
            "deepen": deepen,
            "cross_pollinate": {
                "score": aegis_scores.get("cross", 0),
                "text": cross_text,
            },
            "self_audit": {
                "score": aegis_scores.get("self", 0),
                "text": self_text,
            },
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# Aegis parsing
# ─────────────────────────────────────────────────────────────────────────────

PHASE_NAMES = ["Scan", "Prune", "Deepen", "Cross-pollinate", "Self-audit"]
PHASE_KEYS = ["scan", "prune", "deepen", "cross", "self"]


def parse_aegis_session(body: str) -> dict:
    """Extract Aegis's verdicts on Cura + Vision plus run-level + meta.

    Per-phase header line: "Cura / Phase 1 (Scan). Score: 80."
    Followed by 1+ paragraph(s) of judgment.
    """
    cura_verdicts = []
    vision_verdicts = []
    for mode_name, target_list in [("Cura", cura_verdicts), ("Vision", vision_verdicts)]:
        phase_re = re.compile(
            rf"^{mode_name} / Phase (\d+) \(([^)]+)\)\.\s+Score:\s*(\d+)\.\s*\n(.*?)(?=^(?:Cura|Vision) / Phase \d|^─+|^Run-level|^Meta observation|\Z)",
            re.MULTILINE | re.DOTALL,
        )
        for pm in phase_re.finditer(body):
            phase_label = pm.group(2).strip()
            score = int(pm.group(3))
            verdict_text = _strip_text(pm.group(4))
            target_list.append(
                {
                    "phase": phase_label,
                    "score": score,
                    "verdict": _cap(verdict_text, 3000),
                }
            )

    # Run-level scores: "Cura: ... = **82.9**." and "Vision: ... = **84.1**."
    cura_rl = _extract_run_level(body, "Cura")
    vision_rl = _extract_run_level(body, "Vision")

    # Trend block
    trend = _section(body, "Trend:", "Meta observation").strip() or _section(body, "no historical baseline", "Meta observation").strip()
    if not trend:
        # Aegis #1 form: paragraph starting "Trend:" already extracted; fall back to "no historical baseline" phrase
        tm = re.search(r"Trend.*?baseline.*?\.", body, re.DOTALL)
        trend = tm.group(0).strip() if tm else "Trend baseline establishing."
    trend = _cap(trend, 2500)

    # Meta observation block — accept FOUR prose shapes per Round 142 D-1
    # (Round 137 parser-drift family sibling instance). Observed:
    #   - Aegis #1: "Meta observation." (period-terminated header)
    #   - Aegis #2: bare "META OBSERVATION" (all caps, no PHASE 4 prefix)
    #   - Aegis #3: "PHASE 4 — META OBSERVATION" (full structured header)
    # Plus the legacy "Meta observation" without period. Accept-both/all-
    # shapes alternation per Round 137 doctrine; never replace, always extend.
    meta = _section(body, "PHASE 4 — META OBSERVATION", "— Aegis").strip()
    if not meta:
        meta = _section(body, "META OBSERVATION", "— Aegis").strip()
    if not meta:
        meta = _section(body, "Meta observation.", "— Aegis").strip()
    if not meta:
        meta = _section(body, "Meta observation", "— Aegis").strip()
    meta = _cap(meta, 4000)

    return {
        "cura_verdicts": cura_verdicts,
        "vision_verdicts": vision_verdicts,
        "run_level": {
            "cura_weighted": cura_rl,
            "vision_weighted": vision_rl,
        },
        "trend": trend,
        "meta_observation": meta,
        "concerns": [],
    }


def _extract_run_level(body: str, mode: str) -> float:
    # Session #2+ form (Aegis 2026-06-18 onward):
    #   "Cura session #2 weighted: scan ... = **88.3**."
    m = re.search(
        rf"{mode}\s+session\s+#\d+\s+weighted\s*:[^\n]*=\s*\*\*([\d.]+)\*\*",
        body,
    )
    if m:
        return float(m.group(1))
    # Session #1 form (Aegis 2026-06-17):
    #   "- Cura: scan 80 (10%) + ... = **82.9**."
    m = re.search(rf"-\s*{mode}:[^\n]*=\s*\*\*([\d.]+)\*\*", body)
    if m:
        return float(m.group(1))
    # Generic bare form fallback. Restrict to same line via [^\n] so we
    # don't accidentally pick up trend-section data ("Cura: 82.9 → 88.3").
    m = re.search(rf"{mode}[^=\n]*=\s*\*\*([\d.]+)\*\*", body)
    return float(m.group(1)) if m else 0.0


def _extract_phase_score(aegis_body: str, mode: str, phase_name: str) -> int:
    m = re.search(
        rf"^{mode} / Phase \d+ \({re.escape(phase_name)}\)\.\s+Score:\s*(\d+)\.",
        aegis_body,
        re.MULTILINE,
    )
    return int(m.group(1)) if m else 0


def aegis_scores_for_mode(aegis_body: str, mode: str) -> dict:
    return {
        "scan": _extract_phase_score(aegis_body, mode, "Scan"),
        "prune": _extract_phase_score(aegis_body, mode, "Prune"),
        "deepen": _extract_phase_score(aegis_body, mode, "Deepen"),
        "cross": _extract_phase_score(aegis_body, mode, "Cross-pollinate"),
        "self": _extract_phase_score(aegis_body, mode, "Self-audit"),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _parse_deepen_block(deepen_section: str, aegis_scores: dict) -> list[dict]:
    """Extract Survivor A / Survivor B blocks from a PHASE 3 — DEEPEN section.

    Round 137 accepts BOTH heading shapes observed in the wild:

    Format 1 (sessions #1/#2 — em-dash title + ═ box-drawing divider):
        ═════════════════════════════════════════════════════════
        Survivor A — <title>.
        ═════════════════════════════════════════════════════════

        Trace (...). <prose>
        ...
        Verdict. <verdict prose>

    Format 2 (session #3 — parenthetical kind+title, no divider):
        Survivor A (<kind> — <title>)

        Trace (3 levels). <prose>
        ...
        Verdict. <verdict prose>

    Named-group capture pulls the title from whichever shape fired.
    The look-ahead bounds the body at the NEXT Survivor heading of either shape.
    """
    surv_re = re.compile(
        r"^Survivor [A-Z]\s*"
        r"(?:"
        r"— (?P<dash_title>.+?)\.\s*\n[═=]{3,}\s*\n"
        r"|\((?P<paren_title>[^\n]+)\)\s*\n"
        r")"
        r"(?P<body>.*?)"
        r"(?=^Survivor [A-Z]\s*[—(]|\Z)",
        re.MULTILINE | re.DOTALL,
    )
    deepen: list[dict] = []
    for surv in surv_re.finditer(deepen_section):
        title = _strip_text(surv.group("dash_title") or surv.group("paren_title") or "")
        block = surv.group("body")
        trace = _extract_subsection(block, "Trace", "Sibling pattern|Propose")
        if not trace:
            trace = _extract_subsection(block, "Trace", "Propose")
        propose = _extract_subsection(block, "Propose", "Simulate")
        simulate = _extract_subsection(block, "Simulate", "Iterate|Downstream")
        iterate = _extract_subsection(block, "Iterate", "Audit")
        audit = _extract_subsection(block, "Audit", "Verdict")
        verdict_m = re.search(r"^Verdict\.\s*(.*?)$", block, re.MULTILINE | re.DOTALL)
        verdict = "LAND"
        if verdict_m:
            vtext = verdict_m.group(1).strip().upper()
            if vtext.startswith("PRUNE"):
                verdict = "PRUNE"
            elif vtext.startswith("NEAR-MISS"):
                verdict = "NEAR-MISS"
            elif vtext.startswith("CONSIDERED"):
                verdict = "CONSIDERED"
            elif vtext.startswith("LAND"):
                verdict = "LAND"
        deepen.append(
            {
                "candidate": title,
                "score": aegis_scores.get("deepen", 0),
                "trace": _cap(trace, 3000),
                "propose": _cap(propose, 3000),
                "simulate": _cap(simulate, 3000),
                "iterate": _cap(iterate, 2000),
                "audit": _cap(audit, 3000),
                "verdict": verdict,
            }
        )
    return deepen


def _section(text: str, start_marker: str, end_marker: str) -> str:
    """Return text between start_marker and end_marker (exclusive of both)."""
    si = text.find(start_marker)
    if si < 0:
        return ""
    si += len(start_marker)
    ei = re.search(end_marker, text[si:])
    if ei:
        return text[si : si + ei.start()]
    return text[si:]


def _extract_subsection(block: str, label: str, next_label_alts: str) -> str:
    """Match a labeled paragraph: `Label. <prose>` until the next label."""
    m = re.search(
        rf"^{label}\b[\.\s]+(.*?)(?=^(?:{next_label_alts})\b|\Z)",
        block,
        re.MULTILINE | re.DOTALL,
    )
    return _strip_text(m.group(1)) if m else ""


def _extract_inline_gate(block: str, gate_label: str) -> str:
    m = re.search(
        rf"^\s*{gate_label}\s*\([^)]*\):\s*(.*?)(?=^\s*Gate \d|^\s*Verdict:|\Z)",
        block,
        re.MULTILINE | re.DOTALL,
    )
    return _strip_text(m.group(1)) if m else ""


def _first_paragraph(text: str, max_chars: int) -> str:
    if not text.strip():
        return ""
    # Take everything up to the first blank line, or the whole thing
    para = text.strip().split("\n\n")[0]
    return _cap(_strip_text(para), max_chars)


def _cap(s: str, max_chars: int) -> str:
    if len(s) <= max_chars:
        return s
    return s[: max_chars - 3].rstrip() + "..."


def _parse_time_to_12h(t: str) -> str:
    """Normalize times like '3:48 AM' or '~3:48 AM' to '3:48 AM'."""
    return t.lstrip("~").strip()


# ─────────────────────────────────────────────────────────────────────────────
# Calendar
# ─────────────────────────────────────────────────────────────────────────────

WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
WEEKDAY_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def build_calendar(today: _dt.date, records: list[dict], detail_dates: set[str]) -> list[dict]:
    """Build a rolling ~14-day calendar window ending at today."""
    by_date = {r["date"]: r for r in records}
    days = []
    for offset in range(13, -1, -1):
        d = today - _dt.timedelta(days=offset)
        ds = d.isoformat()
        wd_idx = d.weekday()
        wd_name = WEEKDAY_NAMES[wd_idx]
        # Sabbath rest window: Sat 00:00 → Sun 10:00 EDT. Render Sat + Sun as rest cells.
        if wd_idx in (5, 6):
            days.append({"date": ds, "weekday": wd_name, "mode": "rest"})
            continue
        rec = by_date.get(ds)
        cell = {"date": ds, "weekday": wd_name, "mode": "operational"}
        if rec:
            cell["cura"] = rec["cura_score"]
            cell["vision"] = rec["vision_score"]
        if ds == today.isoformat():
            cell["current"] = True
        if ds in detail_dates:
            cell["has_detail"] = True
        days.append(cell)
    return days


# ─────────────────────────────────────────────────────────────────────────────
# Build a day block
# ─────────────────────────────────────────────────────────────────────────────

def _attach_implementations(day: dict) -> None:
    """Round 108 — join implementations.jsonl entries to deepen survivors.

    For each LANDed deepen survivor in cura/vision phases, look up the latest
    status in `memory/system/implementations.jsonl` by (source_date, source_mode,
    source_session, candidate). Attach as `implementation` field if found.
    Dashboard renders a status crystal next to the LAND badge.
    """
    sys.path.insert(0, str(ROOT / "tools"))
    try:
        from implementation_log import latest_status
    except ImportError:
        return  # No implementation_log yet — skip silently
    for mode_key, mode_name, session_key in [
        ("cura", "Cura", "cura_session"),
        ("vision", "Vision", "vision_session"),
    ]:
        deepen = day.get(mode_key, {}).get("phases", {}).get("deepen", [])
        for surv in deepen:
            try:
                impl = latest_status(
                    source_date=day["date"],
                    source_mode=mode_name,
                    source_session=day[session_key],
                    candidate=surv.get("candidate", ""),
                )
            except Exception:
                impl = None
            if impl:
                surv["implementation"] = {
                    "status": impl.get("status", ""),
                    "round": impl.get("round"),
                    "summary": impl.get("summary", ""),
                    "ts": impl.get("ts", ""),
                    # Round 109 — include source metadata so the dashboard
                    # modal can render the full detail block (mode + session
                    # + date) without needing to thread params through the
                    # render functions.
                    "source_date": day["date"],
                    "source_mode": mode_name,
                    "source_session": day[session_key],
                    "candidate": surv.get("candidate", ""),
                }

    # Round 110 — compute the SESSION-LEVEL aggregate for each mode and attach
    # to day.aegis.cura_session_impl + day.aegis.vision_session_impl. Same
    # canonical source (implementations.jsonl); same _attach_implementations
    # function; one derivation path → two projections (survivor-level badges
    # in Cura/Vision columns + per-phase verdict-card badges in Aegis column).
    # Aggregation rule (priority order): mixed-status → in_progress;
    # uniform-status → that status; no statuses set → no summary.
    aegis_block = day.get("aegis", {})
    for mode_key, mode_name, summary_field in [
        ("cura", "Cura", "cura_session_impl"),
        ("vision", "Vision", "vision_session_impl"),
    ]:
        deepen = day.get(mode_key, {}).get("phases", {}).get("deepen", [])
        survivors_with_status = [
            s for s in deepen
            if s.get("implementation") and s["implementation"].get("status")
        ]
        if not survivors_with_status:
            aegis_block[summary_field] = None
            continue
        statuses = [s["implementation"]["status"] for s in survivors_with_status]
        unique = set(statuses)
        if len(unique) == 1:
            aggregate_status = next(iter(unique))
        else:
            # Mixed outcomes → in_progress (the "halfway / heterogeneous" semantic)
            aggregate_status = "in_progress"
        # Per-survivor breakdown for the modal
        breakdown = [
            {
                "candidate": s.get("candidate", ""),
                "status": s["implementation"]["status"],
                "round": s["implementation"].get("round"),
                "summary": s["implementation"].get("summary", ""),
            }
            for s in survivors_with_status
        ]
        aegis_block[summary_field] = {
            "aggregate_status": aggregate_status,
            "source_mode": mode_name,
            "source_session": day.get(f"{mode_key}_session"),
            "source_date": day["date"],
            "n_survivors": len(deepen),
            "n_with_status": len(survivors_with_status),
            "breakdown": breakdown,
        }


# ─────────────────────────────────────────────────────────────────────────────
# Round 148 — Loud render + build gate for un-logged survivors.
# Closing-the-loop logging discipline (Phase A). When a deepen survivor has
# NO implementations.jsonl entry AND its session date is >1 day old, attach
# a synthetic `unknown_unlogged` status so the dashboard renders a ⚠ warning
# badge. When >3 days old, accumulate for the build gate. The build gate
# fails the dashboard build (exit 1) unless IMPL_LOG_UNGATED env var is set.
# ─────────────────────────────────────────────────────────────────────────────

def _apply_loud_render_and_build_gate(live: dict, today=None) -> list:
    """For every day in live['days'], attach a `unknown_unlogged` synthetic
    implementation to any deepen survivor whose impl is None AND date >1d old.

    Returns a list of (mode, session, candidate, days_old, date) tuples for
    survivors >3 days old that violate the build gate. Caller decides whether
    to fail based on the IMPL_LOG_UNGATED environment variable.
    """
    if today is None:
        today = _dt.date.today()
    build_gate_violations = []
    for day in live.get("days", []):
        try:
            session_date = _dt.date.fromisoformat(day.get("date", ""))
        except (ValueError, TypeError):
            continue
        days_old = (today - session_date).days
        if days_old < 1:
            continue  # same-day grace
        for mode_key, mode_name, session_key in [
            ("cura", "Cura", "cura_session"),
            ("vision", "Vision", "vision_session"),
        ]:
            deepen = day.get(mode_key, {}).get("phases", {}).get("deepen", [])
            for surv in deepen:
                if surv.get("implementation") and surv["implementation"].get("status"):
                    continue
                surv["implementation"] = {
                    "status": "unknown_unlogged",
                    "round": None,
                    "summary": (
                        f"This survivor from {mode_name} session #{day.get(session_key, '?')} "
                        f"({day['date']}, {days_old} day(s) ago) has NO entry in "
                        "memory/system/implementations.jsonl.\n\n"
                        "Either the work shipped but was never logged "
                        "(operating-protocols §24/§30 violation — back-log via "
                        "`python tools/implementation_log.py append ...`) OR the "
                        "work hasn't happened yet (file as 'deferred' if intentional)."
                    ),
                    "ts": "",
                    "source_date": day["date"],
                    "source_mode": mode_name,
                    "source_session": day.get(session_key, 0),
                    "candidate": surv.get("candidate", ""),
                }
                if days_old > 3:
                    build_gate_violations.append(
                        (mode_name, day.get(session_key, 0),
                         surv.get("candidate", ""), days_old, day["date"])
                    )
    return build_gate_violations


def build_day_block(date_str: str, cura: dict, vision: dict, aegis: dict, aegis_body: str) -> dict:
    """Compose a day's full Cura / Vision / Aegis block."""
    weekday_idx = _dt.date.fromisoformat(date_str).weekday()
    weekday = WEEKDAY_LONG[weekday_idx]
    cura_aegis_scores = aegis_scores_for_mode(aegis_body, "Cura")
    vision_aegis_scores = aegis_scores_for_mode(aegis_body, "Vision")
    day = {
        "date": date_str,
        "weekday": weekday,
        "expanded_by_default": True,
        "cura_session": cura["session"],
        "vision_session": vision["session"],
        "aegis_session": aegis["session"],
        "cura_score": aegis["aegis"]["run_level"]["cura_weighted"],
        "vision_score": aegis["aegis"]["run_level"]["vision_weighted"],
        "cura_time": _parse_time_to_12h(cura["time"]),
        "vision_time": _parse_time_to_12h(vision["time"]),
        "aegis_time": _parse_time_to_12h(aegis["time"]),
        "meta_observation": aegis["aegis"]["meta_observation"],
        "cura": parse_cura_session(cura["body"], cura_aegis_scores),
        "vision": parse_vision_session(vision["body"], vision_aegis_scores),
        "aegis": {
            "auditees": {
                "cura_session": cura["session"],
                "cura_time": _parse_time_to_12h(cura["time"]),
                "vision_session": vision["session"],
                "vision_time": _parse_time_to_12h(vision["time"]),
            },
            "cura_verdicts": aegis["aegis"]["cura_verdicts"],
            "vision_verdicts": aegis["aegis"]["vision_verdicts"],
            "run_level": aegis["aegis"]["run_level"],
            "trend": aegis["aegis"]["trend"],
            "meta_observation": aegis["aegis"]["meta_observation"],
            "concerns": aegis["aegis"]["concerns"],
        },
    }
    _attach_implementations(day)
    return day


# ─────────────────────────────────────────────────────────────────────────────
# Main build
# ─────────────────────────────────────────────────────────────────────────────

def build_live_data() -> dict:
    sentinel = json.loads(SENTINEL.read_text(encoding="utf-8"))
    history = json.loads(AUDIT_HISTORY.read_text(encoding="utf-8"))
    records = history.get("records", [])
    if not records:
        raise SystemExit("FAIL: tacitus/audit-history.json has no records — Aegis hasn't fired yet.")

    today_str = sentinel.get("last_reflection_date")
    if not today_str:
        raise SystemExit("FAIL: sentinel.json missing last_reflection_date.")
    today = _dt.date.fromisoformat(today_str)

    # Determine current month notebook
    month = today.strftime("%Y-%m")
    notebook_path = NOTEBOOK_DIR / f"{month}.md"
    if not notebook_path.exists():
        raise SystemExit(f"FAIL: notebook {notebook_path} does not exist.")
    notebook_text = notebook_path.read_text(encoding="utf-8")
    sessions = parse_notebook_sessions(notebook_text)

    # Group sessions by date
    by_date_mode: dict[str, dict[str, dict]] = {}
    for s in sessions:
        # Skip recovered / co-work entries; keep only the three canonical modes
        if s["mode"] not in ("Cura", "Vision", "Aegis"):
            continue
        # Skip Cura post-write addenda for the day block; keep canonical session #N
        if "addendum" in s["suffix"].lower():
            continue
        by_date_mode.setdefault(s["date"], {})[s["mode"]] = s

    # Build days list from audit-history records (newest first)
    days: list[dict] = []
    detail_dates: set[str] = set()
    for rec in sorted(records, key=lambda r: r["date"], reverse=True):
        d = rec["date"]
        modes = by_date_mode.get(d)
        if not modes or not all(k in modes for k in ("Cura", "Vision", "Aegis")):
            continue
        aegis_session = modes["Aegis"]
        aegis_parsed = parse_aegis_session(aegis_session["body"])
        day = build_day_block(
            date_str=d,
            cura=modes["Cura"],
            vision=modes["Vision"],
            aegis={**aegis_session, "aegis": aegis_parsed},
            aegis_body=aegis_session["body"],
        )
        # Only today's day block opens expanded; prior days collapse so the
        # page doesn't grow unbounded. Calendar-click still scrolls + expands
        # a chosen day. User-directed Round 117 polish.
        day["expanded_by_default"] = (d == today_str)
        days.append(day)
        detail_dates.add(d)

    if not days:
        raise SystemExit("FAIL: no complete (Cura+Vision+Aegis) day found in notebook+history.")

    # Calendar
    calendar = build_calendar(today, records, detail_dates)

    # Machinery: include the most recent canonical session bodies (newest first)
    today_sessions = [s for s in sessions if s["date"] == today_str]
    raw_entries: list[str] = []
    sep = "─" * 53
    for s in today_sessions:
        raw_entries.append(sep)
        header = f"[TACITUS — {s['mode'].upper()} SESSION #{s['session']}]"
        if s["suffix"]:
            header += f" {s['suffix']}"
        raw_entries.append(header)
        raw_entries.append(f"({s['date']} at {s['time']})")
        raw_entries.append(sep)
        # Strip the leading header lines we already represent and the trailing "— Tacitus"
        body = s["body"]
        # Cut off the matched header line itself
        lines = body.split("\n")
        # Find first PHASE line
        start_idx = 0
        for i, ln in enumerate(lines):
            if ln.startswith("PHASE ") or ln.startswith("Tonight's auditees"):
                start_idx = i
                break
        body_trimmed = "\n".join(lines[start_idx:]).strip()
        raw_entries.append(body_trimmed)
    raw_entries.append(sep)

    return {
        "schema_version": 2,
        "build_kind": "live",
        "meta": {
            "last_built_at": _dt.datetime.now().astimezone().isoformat(timespec="seconds"),
        },
        "note": f"Live data parsed from tacitus/notebook/{month}.md + tacitus/audit-history.json + tacitus/sentinel.json. Built by tools/build_tacitus_dashboard_live.py.",
        "calendar": calendar,
        "days": days,
        "machinery": {
            "note": "Raw notebook entries (newest day first). Tail of tacitus/notebook/" + month + ".md.",
            "raw_entries": raw_entries,
        },
    }


def embed_into_dashboard(live_data: dict) -> None:
    """Replace the inline `const LIVE_DATA = ...;` JS declaration with
    populated data. Anchored to column 0 / start of line via MULTILINE so
    prose passages embedded INSIDE the LIVE_DATA payload (which can literally
    contain the string 'const LIVE_DATA = null;' when notebook prose describes
    this build pipeline) don't falsely match. Brace-balanced scan walks
    forward from the start anchor to find the matching `};` that closes the
    JS const — never confused by `};` nesting inside the JSON payload."""
    if not DASHBOARD.exists():
        raise SystemExit(f"FAIL: dashboard {DASHBOARD} does not exist.")
    js_literal = json.dumps(live_data, ensure_ascii=False, indent=2)
    new_line = "const LIVE_DATA = " + js_literal + ";"

    text = DASHBOARD.read_text(encoding="utf-8")
    # Anchor on a column-0 occurrence — the only legitimate JS-level position.
    # Note: re.MULTILINE makes `^` match line starts; inside a JSON string
    # value the literal `const LIVE_DATA = ` is preceded by spaces/quotes so
    # `^const LIVE_DATA = ` cannot match the prose-embedded fragments.
    start_re = re.compile(r"^const LIVE_DATA = ", re.MULTILINE)
    starts = list(start_re.finditer(text))
    if not starts:
        raise SystemExit("FAIL: cannot locate `const LIVE_DATA = ` at column 0 in dashboard.")
    if len(starts) > 1:
        raise SystemExit(
            f"FAIL: found {len(starts)} column-0 `const LIVE_DATA = ` declarations; "
            f"expected exactly 1 (lines: {[text.count(chr(10), 0, m.start()) + 1 for m in starts]})."
        )
    start_idx = starts[0].start()

    # Walk forward from the value start to find the matching end-of-statement.
    # Two shapes are valid: `null;` or `{...};` (JSON object literal).
    value_start = starts[0].end()  # one char past "const LIVE_DATA = "
    if text[value_start:].startswith("null;"):
        end_idx = value_start + len("null;")
    elif text[value_start] == "{":
        # Brace-balanced scan, JSON-string-aware so braces inside strings
        # don't perturb the depth counter.
        depth = 0
        i = value_start
        in_string = False
        escape = False
        while i < len(text):
            ch = text[i]
            if in_string:
                if escape:
                    escape = False
                elif ch == "\\":
                    escape = True
                elif ch == '"':
                    in_string = False
            else:
                if ch == '"':
                    in_string = True
                elif ch == "{":
                    depth += 1
                elif ch == "}":
                    depth -= 1
                    if depth == 0:
                        # Expect `;` immediately after
                        if i + 1 < len(text) and text[i + 1] == ";":
                            end_idx = i + 2
                            break
                        else:
                            raise SystemExit("FAIL: closing `}` not followed by `;`.")
            i += 1
        else:
            raise SystemExit("FAIL: unmatched `{` in LIVE_DATA literal.")
    else:
        raise SystemExit(
            f"FAIL: unexpected character at LIVE_DATA value position: "
            f"{text[value_start:value_start+30]!r}"
        )

    old_block = text[start_idx:end_idx]
    sys.path.insert(0, str(ROOT / "tools"))
    safe_write.safe_replace(
        str(DASHBOARD),
        old_block,
        new_line,
        expect_count=1,
    )


QUOTES_JSON = TACITUS / "dashboard" / "assets" / "quotes" / "quotes.json"


def embed_quotes_into_dashboard() -> int:
    """Read tacitus/dashboard/assets/quotes/quotes.json and replace the
    inline INSPIRATIONAL_QUOTES const in the dashboard. Returns the count
    of quotes embedded.
    """
    if not QUOTES_JSON.exists():
        print(f"  (no quotes.json at {QUOTES_JSON} — skipping quote embed)")
        return 0
    src = json.loads(QUOTES_JSON.read_text(encoding="utf-8"))
    raw_quotes = src.get("quotes", []) if isinstance(src, dict) else src
    if not isinstance(raw_quotes, list) or not raw_quotes:
        print("  (quotes.json has empty quotes list — skipping)")
        return 0
    # Project the quotes to the renderer-expected shape; keep it lean.
    embed = []
    for q in raw_quotes:
        if not q.get("text"):
            continue
        embed.append({
            "text": q.get("text", ""),
            "attribution": q.get("attribution", ""),
            "year": q.get("year", ""),
            "context_url": q.get("context_url", ""),
            "source_tag": q.get("source_tag", ""),
        })
    js_literal = json.dumps(embed, ensure_ascii=False, indent=2)
    new_block = "const INSPIRATIONAL_QUOTES = " + js_literal + ";\n"
    text = DASHBOARD.read_text(encoding="utf-8")
    # Locate existing const INSPIRATIONAL_QUOTES = [ ... ]; (multi-line)
    m = re.search(r"const INSPIRATIONAL_QUOTES = \[.*?\];\n", text, re.DOTALL)
    if not m:
        raise SystemExit("FAIL: cannot locate `const INSPIRATIONAL_QUOTES = [...];` in dashboard.")
    safe_write.safe_replace(
        str(DASHBOARD),
        m.group(0),
        new_block,
        expect_count=1,
    )
    return len(embed)


def _write_extraction_health_sidecar(live: dict) -> pathlib.Path:
    """Round 137 — write extraction-health metadata to a sidecar JSON file.

    Holds per-phase extraction counts for today's session (cura + vision +
    aegis). Read by the paired daily invariant
    `check_tacitus_dashboard_extraction_health` so the audit can verify the
    dashboard was built from non-degenerate parse output without having to
    re-parse the inline JS LIVE_DATA literal from the HTML.

    Defense-in-depth: build-time `_assert_extraction_health` is the primary
    catch (fail-the-build); the sidecar + invariant is the safety net at
    audit time.
    """
    if not live["days"]:
        return ROOT  # build_live_data already raised earlier in this case
    today_block = live["days"][0]
    health = {
        "schema_version": 1,
        "_purpose": (
            "Round 137 — per-phase extraction counts for today's Tacitus session. "
            "Read by check_tacitus_dashboard_extraction_health invariant."
        ),
        "built_at": _dt.datetime.now().astimezone().isoformat(timespec="seconds"),
        "session_date": today_block["date"],
        "cura": {
            "scan_candidates": len(today_block["cura"]["phases"]["scan"]["candidates"]),
            "prune_verdicts": len(today_block["cura"]["phases"]["prune"]["verdicts"]),
            "deepen_survivors": len(today_block["cura"]["phases"]["deepen"]),
        },
        "vision": {
            "scan_candidates": len(today_block["vision"]["phases"]["scan"]["candidates"]),
            "prune_verdicts": len(today_block["vision"]["phases"]["prune"]["verdicts"]),
            "deepen_survivors": len(today_block["vision"]["phases"]["deepen"]),
        },
        "aegis": {
            "cura_verdicts": len(today_block["aegis"]["cura_verdicts"]),
            "vision_verdicts": len(today_block["aegis"]["vision_verdicts"]),
        },
    }
    sidecar = TACITUS / "dashboard" / "extraction-health.json"
    payload = json.dumps(health, ensure_ascii=False, indent=2) + "\n"
    safe_write.safe_rewrite(str(sidecar), payload)
    return sidecar


def main() -> int:
    print("Building Tacitus dashboard LIVE_DATA...")
    try:
        live = build_live_data()
    except ExtractionHealthError as e:
        print(f"FAIL: {e}", file=sys.stderr)
        raise SystemExit(2)
    print(f"  calendar cells: {len(live['calendar'])}")
    print(f"  day blocks: {len(live['days'])}")
    print(f"  machinery raw_entries lines: {len(live['machinery']['raw_entries'])}")

    # Round 148 — apply loud-render synthetic status + build-gate check.
    # See _apply_loud_render_and_build_gate() docstring for rationale.
    violations = _apply_loud_render_and_build_gate(live)
    if violations:
        print(f"  Round 148 loud-render: {len(violations)} survivor(s) >3 days old un-logged:", file=sys.stderr)
        for mode, sess, cand, days_old, date in violations:
            print(f"    - {mode} #{sess} ({date}, {days_old}d ago): {cand[:60]}", file=sys.stderr)
        if not os.environ.get("IMPL_LOG_UNGATED"):
            print(
                "FAIL: dashboard build gated (Round 148). Back-log via "
                "`python tools/implementation_log.py append ...` for each "
                "violation above, OR set IMPL_LOG_UNGATED=1 to override.",
                file=sys.stderr,
            )
            return 1
        print("  IMPL_LOG_UNGATED=1 — proceeding despite gate violations.", file=sys.stderr)

    embed_into_dashboard(live)
    print("OK — LIVE_DATA embedded; safe_write byte-verified the dashboard write.")
    sidecar = _write_extraction_health_sidecar(live)
    print(f"OK — extraction-health sidecar written to {sidecar.relative_to(ROOT)}.")
    n = embed_quotes_into_dashboard()
    if n:
        print(f"OK — {n} quotes embedded from {QUOTES_JSON.relative_to(ROOT)}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
