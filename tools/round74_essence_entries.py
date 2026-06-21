#!/usr/bin/env python3
"""
Round 74 closing-move-atomic: append the saga, lessons, decisions entries
via safe_write, then refresh the known-good-hashes baseline.

One-shot script. Run once after Phase A's structural work lands.
"""

import sys, json, pathlib, datetime
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from safe_write import safe_append, safe_rewrite

ROOT = pathlib.Path(__file__).resolve().parent.parent


SAGA_ENTRY = """
**(2026-06-15 at 9:55 AM)** Round 74 — Invariant manifest, system audit, Tacitus folder separation, meta-auditor role. The structural answer to *"build a system that THINKS about and DETECTS what could be going wrong."*

User directive at the start of the round: *"the next issue may be completely different but the idea here is we build a system to THINK about and DETECT what could be going wrong, test the hypothesis/search for it, audit, simulate files, every single angle that makes sense/is wise to ensure that we're catching these things before they become a major issue."* Plus a clear separation of concerns: *"Tacitus's systems, behaviors, choices, etc. all being self contained in a Tacitus folder just for him."* The architectural response in this round operationalizes both.

**The new tooling.** Two Python files + a folder + a probe directory:

- `tools/invariants.py` — declarative manifest. 13 invariants on adoption (11 daily + 2 weekly). Each entry has name, description, check_fn, truth_anchor, severity (`critical` / `warning` / `info`), lesson_ref, cadence. The runner walks the manifest; adding a new invariant is appending an entry. Critical invariants seeded: Tacitus sentinel-vs-content drift; system audit own sentinel (audit_ran_today, the meta-check); safe_write canary round-trip; brain version sync across versions.json + CHANGELOG + brain/versions/* + dashboard embed; tools/*.py parse via ast; JSON files parse; dashboard integrity passes (composes the existing 16-check tool as one invariant); catch-up files exist. Warning invariants: append-only essence files don't shrink relative to baseline; user-prefs files match index. Info: lesson_pitfall_count (sanity gauge for §18 coverage). Weekly: differential reads (pathlib vs os.read sample); orphan file detection (with template-placeholder filtering after two iterations).

- `tools/system_audit.py` — the runner. Walks the manifest, runs each check, produces a structured markdown report appended to `memory/system/audit-YYYY-MM.md`, updates `memory/system/audit-sentinel.json` with `last_audit_completed_at` + result counts. Severity-tiered output: critical fails surfaced first, warnings second, info collapsed unless asked. Exit code 0 when no critical fails. All writes via `safe_write` (atomic, verified).

- `tools/canaries/` — probe directory. Currently one probe (`safe-write-probe.txt`) that the audit rewrites each run with a fresh timestamp + nonce, then reads back via `os.open + os.read` (bypassing any Python-level text cache). If safe_write itself is broken, this catches it before any other invariant runs. The README in the directory documents the discipline.

- `memory/system/` — system audit's own folder. Owns `audit-sentinel.json`, `audit-YYYY-MM.md`, `known-good-hashes.json` (the truth anchor for append-only and static-file invariants). Clean separation from Tacitus.

**Folder migration.** `memory/notebook/` renamed to `memory/tacitus/` to make ownership explicit. The shared `.status.json` split into two entity-owned sentinels: Tacitus' fields → `memory/tacitus/sentinel.json`, audit's fields → `memory/system/audit-sentinel.json`. The audit file (formerly `notebook/audit-YYYY-MM.md`) moved to `system/audit-YYYY-MM.md` — it was always the audit's output, not Tacitus's. All references in brain, operating-protocols, engineering-doctrine, integrity tool's MARKDOWN_BLOCKS, and dashboard embed block IDs updated. Old paths tombstoned (sandbox can't `rm`, so the §11 tombstone pattern applies: each old file overwritten with a redirect note marking it safe to delete).

**Tacitus' new role: meta-auditor.** Per the user's Risk 3 idea, Tacitus' 5:05 AM session now reads the previous day's `memory/system/audit-YYYY-MM.md` and reflects on whether the audit is catching what it should. He may propose new invariants in his notebook (tag `[invariant-proposal]`); the user reviews proposals during co-work and promotes them to `tools/invariants.py` themselves. Tacitus' write boundary is unchanged — he only writes to `memory/tacitus/`, never `tools/` or `memory/system/`. The loyalty covenant from Round 69 stays intact.

**The doctrine + protocols.** Engineering doctrine principle 11 added: *Truth-anchored invariants — every check pins to an external truth source that can't itself drift.* operating-protocols.md §18 added: *Lesson → invariant promotion + sentinel-pair-check requirement.* The promotion gate is the key discipline — when a new pitfall lands in lessons.md, the same patch must add an invariant that would catch the next occurrence. No more lessons-as-memorials without paired detectors. The audit's own sentinel got the same treatment as Tacitus' sentinel: a paired cross-check verifying the audit actually ran (`audit_ran_today` invariant).

**Five real issues the audit caught on its first day live.** The system paid for itself before the round closed:

1. **`brain_version_sync` drift** — versions.json was bumped to v3.8 yesterday (Round 73) but the dashboard's `versions-data` embed never got re-embedded. Brain pill on the dashboard would have kept showing v3.7. The new invariant flagged it; I re-embedded via direct write + atomic swap.

2. **Cross-platform Python encoding crash** — `tools/dashboard_integrity.py` had `open(data_path)` (and two siblings) without `encoding=`. On Linux/Mac, Python defaults to UTF-8 and this works. On Windows, Python defaults to cp1252 which can't decode UTF-8 multi-byte sequences. The user's first audit run on PowerShell crashed at line 401 with `UnicodeDecodeError: 'charmap' codec can't decode byte 0x9d`. Fixed all five text-mode `open()` calls across `tools/dashboard_integrity.py` (3) and `tools/version_bump.py` (2). Confirmed zero remaining text-mode opens without encoding across all 5 tool files. The lesson generalizes: every text-mode `open()` in cross-platform Python code MUST specify `encoding='utf-8'` (or whatever the actual encoding is). This is now an invariant via `tools_py_parse` + a future invariant should explicitly scan for the pattern.

3. **`%-I` strftime format specifier crash on Windows** — system_audit's `_eastern_display()` used `%-I` to strip the leading zero from the hour. That's a glibc extension; Windows strftime errors out with "Invalid format string". Fixed by formatting the hour manually via `n.hour % 12 or 12`. Same lesson family: Python strftime specifiers aren't all portable. Avoid `%-I`, `%-d`, `%-m`, `%-H`, etc.

4. **`datetime.utcnow()` deprecation warning** — not a hard error but Python 3.12+ marks it deprecated. Replaced with `datetime.datetime.now(datetime.timezone.utc)`. Forward-compat.

5. **Missing `#citation-popup` HTML element in dashboard** — the most interesting catch. The CSS rules for `.citation-popup-backdrop` and `.citation-popup` were present. The JS that calls `document.getElementById('citation-popup')` was present. But the actual `<div id="citation-popup">` HTML element was missing from the body — either lost in one of yesterday's silent truncations or in a re-embed today. The static integrity checks couldn't see it (Python isn't a DOM parser; CSS rules and JS getElementById calls are just strings to a regex). The puppeteer smoke test on the user's machine surfaced it instantly: "1 missing selector: #citation-popup; 1 behavior failed: Benefit pill click opens citation popup." Reconstructed the HTML element from the JS contract (cp-title, cp-cite, cp-eyebrow, cp-source-tag, cp-fallback-note) and inserted it after the `#essential-detail` div. First reconstruction had a bug (forgot `id="cp-eyebrow"` on the eyebrow div, only had the class) — the next smoke run caught it via `TypeError: Cannot set properties of null (setting 'textContent')`. Fixed. Smoke test green.

The point isn't that I made the bugs — they were already there or easy to make. The point is that without the new audit, every single one of these would have shipped silent. The first two would have crashed for the user on every audit run. The version drift would have lied on the dashboard banner indefinitely. The missing citation popup would have produced silent click-no-ops every time the user clicked a benefit pill. The audit caught all five on the first day live. That's exactly what *"detect what could be going wrong"* looks like in operation.

**One self-referential glitch worth recording.** The audit's `last_lapse_reason` field on Windows ran captured a Python parse-error message that contained the literal text `"Unterminated string starting at: line 16 column 24"`. On the next sandbox audit run, the JSON parser hit that string in the sentinel and reported its own confused error. The two passes resolved themselves once safe_write atomically rewrote the sentinel — but the pattern is interesting. Status files that include error messages can self-reference into transient parse confusion. Lesson candidate for future codification: keep error message text out of structured fields that the same parser will re-read.

**Brain bumped v3.8 → v3.9** per the brain version-write discipline (Round 49). Five-step closing move applied: new brain document `brain/versions/v3.9-2026-06-15-invariant-manifest.md`, current.md updated with new pitfalls (3 from Round 74 referencing doctrine §11 + §17 + §18, plus a cross-platform-encoding pitfall), CHANGELOG entry appended, versions.json bumped, integrity check + audit re-run as the final verification.

**Phase A is complete. Phase B starts next** — the catch-up integrity defense (Risk 9 from the simulation): briefing-as-proof requirement (the first response after a `catch up` trigger must cite one specific item from each catch-up file) + `memory/system/last-catchup.json` checksum (mtime + first/last bytes of each catch-up file at session start). Together they close the "what if Claude pretends to catch up?" gap.

— Closing-move-atomic discipline practiced. The five-issue catch on day one is the system's first audit working as designed; the saga records it honestly so a future reader sees both the architecture and the validation in one place.
"""


LESSONS_ENTRIES = """
**(2026-06-15 at 9:55 AM)** **Cross-platform Python pitfalls (Round 74).** Three real bugs surfaced when the audit first ran on Windows that wouldn't have surfaced in the sandbox. Codified together because they share a single discipline: write Python that's truly portable, not Linux-portable-in-disguise.

(a) **Text-mode `open()` defaults to the system locale, not UTF-8.** On Linux/Mac, that's typically UTF-8 anyway. On Windows, it's cp1252 (Windows-1252), which fails to decode any UTF-8 multi-byte sequence: em-dashes, smart quotes, escape literals like `\\u2014`. The fix is to always specify `encoding='utf-8'` in `open()` calls on text-mode files. Cost of forgetting: a `UnicodeDecodeError` that's instantly fatal on Windows but invisible in dev. Five `open()` calls across `tools/dashboard_integrity.py` and `tools/version_bump.py` were silently broken until the audit's Windows run forced the issue.

(b) **glibc-extension strftime specifiers don't work on Windows.** `%-I`, `%-d`, `%-m`, `%-H`, etc. (the leading-zero-strippers) raise `ValueError: Invalid format string` on Windows strftime. The cross-platform fix is to format manually via arithmetic: `hour_12 = n.hour % 12 or 12` then string-format. Lesson generalizes: avoid the `%-` family of strftime specifiers; format manually where stripping zeros matters.

(c) **`datetime.utcnow()` is deprecated in Python 3.12+.** Not fatal, but emits a noisy `DeprecationWarning` and is scheduled for removal. Replace with `datetime.datetime.now(datetime.timezone.utc)` — timezone-aware and forward-compatible.

The meta-lesson is that cross-platform Python takes ACTIVE discipline; "Python is cross-platform" is a half-truth. The defenses are: (1) always specify `encoding=` on text-mode `open()`, (2) avoid `%-` strftime specifiers, (3) use timezone-aware `datetime.now(tz=...)`, (4) prefer `pathlib` over manual path concatenation, (5) when in doubt, run on Windows once before declaring portable. The audit's `tools_py_parse` invariant catches syntax errors but doesn't catch these runtime portability bugs. Candidate for a future invariant: a `check_no_unsafe_encoding` invariant that scans `tools/*.py` for `open(` calls without `encoding=` (excluding `'rb'` / `'wb'` binary modes).

**(2026-06-15 at 9:55 AM)** **The audit pays for itself on day one (Round 74).** The first real run of `tools/system_audit.py` — before the saga entry was even written — caught FIVE distinct issues that the existing static integrity tool was missing: (a) the brain version embed drift from yesterday's manual edit, (b) the cross-platform encoding crash on Windows, (c) the `%-I` strftime crash, (d) the missing `#citation-popup` HTML element (visible only via puppeteer DOM), (e) a missing `id="cp-eyebrow"` attribute introduced by my own reconstruction of (d). Each one would have shipped silent without the audit. The user-facing failure each would have eventually produced (broken popups on click, version pill showing wrong number, integrity tool crash on Windows) is exactly the *"playing whack-a-mole with bugs"* pattern the user named at the start of the round.

The pattern that generalizes: an audit's value is measured by what it catches in the first month, not what it asserts on the first day. The eleven invariants in the initial manifest collectively cover most of the failure families documented across Rounds 22-73. Future bugs will surface families we haven't anticipated — and the §18 promotion gate ensures those families get codified as invariants in the same patch as their first occurrence. The audit's invariant count is a project health metric in its own right.

**(2026-06-15 at 9:55 AM)** **Self-referential status files can produce transient parse confusion (Round 74).** During Round 74's first Windows run, the audit captured a Python parse-error message — "Unterminated string starting at: line 16 column 24" — into the `last_lapse_reason` field of `memory/system/audit-sentinel.json`. On the next sandbox audit run, the JSON parser found that captured text inside the sentinel and reported its own (different) parse error pointing at the same line/col references. The two passes resolved themselves once safe_write atomically rewrote the sentinel with clean content — but the pattern is worth recording: when error messages contain quoted parse-error text, the same parser re-reading the structured file can transiently misinterpret the embedded message.

The discipline isn't to ban error-text-in-sentinels (sometimes that's the most useful debugging info). It's to be aware that `last_lapse_reason` is best as a SHORT identifier of which check failed plus the relevant counts, not the full parser stack-trace. If a structured field needs to carry a long error message, sanitize it (remove quoted code, escape brace/bracket characters) before storing. Or: store error messages in a sidecar plain-text file and have the structured field hold a path reference. Either way, the rule is "structured fields hold structured data; error prose lives somewhere the parser won't re-misread it."

**(2026-06-15 at 9:55 AM)** **CSS + JS can reference a missing HTML element without anyone noticing until the DOM renders (Round 74).** The Round 73 truncation events left the dashboard with full CSS rules for `.citation-popup-backdrop` + `.citation-popup` AND working JS that calls `document.getElementById('citation-popup')` — but the actual `<div id="citation-popup">` HTML element was gone. The static integrity tool couldn't see it (Python isn't a DOM parser; CSS rules and JS getElementById calls are just regex-matchable strings). The user's puppeteer smoke test surfaced it as soon as the audit ran on Windows: `1 missing selector: Citation popup container (P3.6) (#citation-popup)`. Lesson: when a feature has three layers (CSS + JS + HTML), the integrity tool needs all three checks. Selector existence is a DOM-level question; you can't answer it without rendering the DOM. Puppeteer (or any headless browser) is the right primitive. The dashboard smoke test was added in Round 55 specifically for this class of bug; Round 74 demonstrated it works.

The deeper lesson: every UI feature should declare its required selectors as part of its own contract. The smoke test reads those declarations and asserts each renders. Currently the selector list is hardcoded in `tools/dashboard_smoke.js` — a refactor candidate is to move it into per-feature manifests so adding a feature adds its selectors atomically. Filing for future round.

**(2026-06-15 at 9:55 AM)** **Truth-anchored invariants beat agreement-based checks (Round 74 / doctrine §11).** The Round 73 audit revealed that `check_markdown_content` (verifying dashboard embeds match canonical files) had been passing for hours against equally-stale data — both sides silently dropped, both sides matched in their stale state. Agreement is not truth when both surfaces share the same cache or the same write surface that silently fails. The fix codified as doctrine principle 11: every check must pin to an external truth source that can't itself drift. Examples of valid truth anchors: committed hashes (versions.json history snapshots), deterministic recomputation, primary-source files (Wallach books, Youngevity labels), user-confirmed snapshots (memory/system/known-good-hashes.json), low-level system reads (os.read bypassing Python text cache). Each invariant in the manifest declares its `truth_anchor` field explicitly so future reviewers can see the pinning logic and challenge it if the anchor is suspect.

The companion discipline is the §18 promotion gate: every new sentinel/status file requires a paired cross-check against its artifact in the same patch as the sentinel itself. The structural constraint prevents the system from accumulating "agreement-only" checks that look like protection but aren't.
"""


DECISIONS_ENTRIES = """
**(2026-06-15 at 9:55 AM)** **Round 74 — The invariant manifest pattern + system audit + Tacitus folder separation + meta-auditor role.** Architectural commitment born from the user directive after Round 73: *"build a system to THINK about and DETECT what could be going wrong, test the hypothesis/search for it, audit, simulate files, every single angle that makes sense/is wise to ensure that we're catching these things before they become a major issue."* The five-piece response codified here as a single round of architectural commitments.

**Piece 1 — `tools/invariants.py` as the declarative manifest.** The single source of truth for what the system checks. Each invariant has: name (stable id), description (plain English), check_fn (returns (bool, str)), truth_anchor (external pinning source), severity (`critical` / `warning` / `info`), lesson_ref (lesson/decision/protocol it ties back to), cadence (`daily` / `weekly`). The promotion gate from §18 makes adding an invariant a closing-move-atomic requirement when a new pitfall lands. The architectural choice between declarative-manifest vs. inline-runner-logic was deliberate: declarative scales to new invariants without changing the runner; the runner stays small (~10KB) and the manifest grows with the project's lessons.

**Piece 2 — `tools/system_audit.py` as the runner.** Composes the existing 16-check `tools/dashboard_integrity.py` as ONE invariant (`dashboard_integrity`), not as a competing tool. The two layer cleanly: integrity tool handles dashboard-internal invariants; system_audit handles cross-system + behavior + meta-checks. Adding an invariant goes to invariants.py; adding a dashboard-internal check still goes to integrity tool. No duplication, no conflict.

**Piece 3 — `memory/system/` folder for the audit's outputs + own sentinel.** Clean entity ownership: `system/` is for system audit + invariants + known-good-hashes; `tacitus/` is for Tacitus only. Per the user's Risk 7 direction: *"having Tacitus' systems, behaviors, choices, etc. all being self contained in a Tacitus folder just for him."* The renaming of `memory/notebook/` → `memory/tacitus/` makes ownership explicit at the filesystem level. Tombstones at the old paths per §11 (sandbox `rm` is blocked).

**Piece 4 — Tacitus as meta-auditor (Round 74 expansion of his role).** Per the user's Risk 3 idea, Tacitus reads the previous day's `memory/system/audit-YYYY-MM.md` during his 5:05 AM session and reflects on whether the audit is catching what it should. He may propose new invariants in his notebook (tag `[invariant-proposal]`); the user reviews during co-work and promotes them to `tools/invariants.py` themselves. Tacitus' write boundary stays as it was — `memory/tacitus/` only, never `tools/`. The loyalty covenant from Round 69 stays intact; the meta-auditor role expands his READ surface (now includes `memory/system/`) but not his WRITE surface.

**Piece 5 — Doctrine principle 11 + operating-protocols.md §18.** Truth-anchored invariants as the foundational principle; lesson→invariant promotion as the discipline that keeps the manifest growing with the project. Together they form the structural backbone: the principle defines what a valid invariant looks like (pinned to external truth), the protocol enforces that every lesson generates one.

The architectural commitment that constrains future work: **whenever a new sentinel file or status surface is introduced, the same patch must introduce its paired cross-check invariant. Whenever a new pitfall is codified in lessons.md, the same patch must add an invariant that would catch the next occurrence.** The integrity tool's 16 checks are the dashboard's internal invariants; system_audit's manifest is the project's cross-cutting invariants. Both grow together, both verified by the daily audit.

**(2026-06-15 at 9:55 AM)** **Tacitus folder migration with field-level sentinel split (Round 74).** The old `memory/notebook/.status.json` was a shared file holding Tacitus' last_reflection_* + the audit's last_lapse_* + last_audit_date in one struct. Round 74 splits these field-by-field into two entity-owned sentinels: Tacitus' fields → `memory/tacitus/sentinel.json`, audit's fields → `memory/system/audit-sentinel.json`. Each entity owns its own file. The advantages: (a) clean ownership boundaries — when Tacitus' SKILL prompt or the audit task writes a sentinel, it never touches the other entity's fields; (b) entity-aware invariants — `tacitus_sentinel_content` reads from one file, `audit_ran_today` from the other; no shared-mutation risk; (c) future migration safety — when one entity's sentinel schema evolves, the other's stays untouched.

The migration is reversible (the old `.status.json` is tombstoned, not deleted; safe to recreate if the split needs reversing). The commitment going forward: every new entity that needs a sentinel gets its own folder + its own sentinel file. Shared sentinels are forbidden going forward. Existing shared structures (e.g., `versions.json`) stay as-is — they're truly shared (cross-entity version registry, not entity-specific state).

**(2026-06-15 at 9:55 AM)** **Cross-platform Python discipline codified (Round 74).** Going forward, all Python tool files MUST:

(a) Specify `encoding='utf-8'` on every text-mode `open()` call. Binary-mode (`'rb'` / `'wb'`) opens are exempt (no encoding involved). The audit's `tools_py_parse` catches syntax errors; a future invariant should explicitly grep for `open(` without `encoding=` and flag.

(b) Avoid glibc-extension strftime specifiers (`%-I`, `%-d`, `%-m`, `%-H`, etc.). Format manually via arithmetic when leading-zero stripping is needed.

(c) Use `datetime.datetime.now(datetime.timezone.utc)` instead of `datetime.utcnow()` (deprecated in Python 3.12+).

(d) Prefer `pathlib.Path` over manual string path concatenation. Cross-platform path separator handling is built in.

(e) Use `sys.executable` instead of literal `"python3"` in subprocess calls — invokes the same Python that's running, regardless of how it was launched.

These five rules are the operating discipline. New tool files that violate them will fail the audit on Windows the moment they're exercised; the discipline avoids the failure-then-fix cycle by frontloading the rules. Candidate future invariant: `check_cross_platform_python` that scans tool files for these patterns and flags.

**(2026-06-15 at 9:55 AM)** **The promotion gate (§18) is structural, not editorial.** When a pitfall is codified in lessons.md, the SAME PATCH must add the corresponding invariant to `tools/invariants.py`. This is enforced by the closing-move-atomic discipline (§1) and verifiable in code via `check_lesson_pitfall_count` (informational baseline) plus future invariants that compare lesson count to invariant count and flag drift. The architectural commitment: lessons that don't generate invariants are either (a) not structural enough to need automation (acceptable — they stay as text-only wisdom), or (b) failing the promotion gate (a closing-move violation that needs the next patch to add the missing detector).

The principle that constrains future work: **the audit's invariant count is the project's structural-protection health metric.** When it stops growing, the system is either perfectly mature (rare) or accumulating undetected failure modes (more likely). Tacitus' meta-auditor role specifically watches for the latter pattern — he can propose invariants when he notices recurring patterns in the audit output, and the user promotes them during co-work.
"""


def main():
    # Saga entry
    print("Appending saga.md...")
    size = safe_append(ROOT / "memory/essence/saga.md", SAGA_ENTRY)
    print(f"  OK — saga.md now {size}B")

    # Lessons entries
    print("Appending lessons.md...")
    size = safe_append(ROOT / "memory/essence/lessons.md", LESSONS_ENTRIES)
    print(f"  OK — lessons.md now {size}B")

    # Decisions entries
    print("Appending decisions.md...")
    size = safe_append(ROOT / "memory/essence/decisions.md", DECISIONS_ENTRIES)
    print(f"  OK — decisions.md now {size}B")

    # Update known-good-hashes baselines to reflect the legitimate growth
    print("Updating known-good-hashes.json baselines (post-Round-74 growth)...")
    kg_path = ROOT / "memory/system/known-good-hashes.json"
    kg = json.loads(kg_path.read_text(encoding="utf-8"))
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    for relpath in [
        "memory/essence/saga.md",
        "memory/essence/lessons.md",
        "memory/essence/decisions.md",
        "memory/memory-change-log.md",
    ]:
        p = ROOT / relpath
        if p.exists():
            kg["append_only_baselines"][relpath] = {
                "size": p.stat().st_size,
                "baselined_at": now_iso,
                "round_at_baseline": 74,
            }
            print(f"  re-baselined {relpath} @ {p.stat().st_size}B")
    kg["updated_at"] = now_iso
    safe_rewrite(kg_path, json.dumps(kg, indent=2) + "\n")
    print(f"  OK — known-good-hashes.json updated")

    print()
    print("=== Round 74 essence entries shipped ===")


if __name__ == "__main__":
    main()
