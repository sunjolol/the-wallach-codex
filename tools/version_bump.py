#!/usr/bin/env python3
"""version_bump.py — bump brain or dashboard version, write to canonical store, propagate to dashboard.

Single sanctioned writer for memory/versions.json. After a bump, embeds the updated
versions.json into dashboard.html as the `versions-data` script block. The dashboard's
runtime JS reads from that block on load and updates the banner + Creator's Log sysinfo.

USAGE
    python3 tools/version_bump.py brain minor "Tacitus + integrity tool"
    python3 tools/version_bump.py dashboard minor "Pass 7 dietary tile-render"
    python3 tools/version_bump.py brain major "Paradigm shift label"
    python3 tools/version_bump.py status                 # show current

After bump, propagation is automatic: writes versions.json, re-embeds into dashboard.html,
runs the integrity tool. The closing-move-atomic discipline applies — if this lands, the
bump is part of the same patch as the change.
"""

import sys
import json
import re
from datetime import datetime
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
VERSIONS = REPO / "memory" / "versions.json"
DASH = REPO / "dashboard" / "dashboard.html"
INTEGRITY = REPO / "tools" / "dashboard_integrity.py"


def load_versions():
    with open(VERSIONS, encoding='utf-8') as f:
        return json.load(f)


def save_versions(obj):
    """Atomic + verified write via tools/safe_write. Round 74 Phase C migration —
    the previous open()/json.dump path worked but wasn't atomic. safe_rewrite
    writes to .tmp, verifies on-disk content matches intent, runs the JSON
    parse shape-check, then os.replace() into place."""
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from safe_write import safe_rewrite
    payload = json.dumps(obj, indent=2, ensure_ascii=False) + "\n"
    safe_rewrite(VERSIONS, payload)


def bump(version_str, level):
    parts = version_str.split(".")
    if len(parts) != 2:
        raise ValueError(f"Expected major.minor, got {version_str!r}")
    major, minor = int(parts[0]), int(parts[1])
    if level == "minor":
        minor += 1
    elif level == "major":
        major += 1
        minor = 0
    else:
        raise ValueError(f"Unknown bump level: {level!r}")
    return f"{major}.{minor}"


def embed_into_dashboard(versions_obj):
    """Replace or insert <script type='application/json' id='versions-data'> block."""
    with open(DASH, "rb") as f:
        data = f.read()
    # Escape </script> within JSON string literals so the HTML parser can't
    # terminate the script block on prose that legitimately mentions </script>.
    # JSON treats \/ as a valid escape for /, so the parsed value is unchanged.
    json_str = json.dumps(versions_obj, separators=(",", ":"))
    json_str = json_str.replace("</script>", "<\\/script>")
    new_block = (
        b'<script type="application/json" id="versions-data">'
        + json_str.encode("utf-8")
        + b"</script>"
    )
    # Look for existing block
    existing_open = re.search(
        rb'<script[^>]*id="versions-data"[^>]*>', data
    )
    if existing_open:
        open_end = existing_open.end()
        # Use canonical boundary: the LAST </script> before the next <script tag.
        # Defends against orphan fragments when an earlier embedded JSON contained
        # internal </script> literals that confused first-close detection.
        next_script = re.search(rb'<script\b', data[open_end:])
        next_script_pos = open_end + next_script.start() if next_script else len(data)
        close_start = data.rfind(b"</script>", open_end, next_script_pos)
        if close_start < 0:
            close_start = data.find(b"</script>", open_end)
        new_data = data[: existing_open.start()] + new_block + data[close_start + len(b"</script>") :]
    else:
        # Insert just before the first <script type="application/json" id="essentials-benefits-data">
        first_json = re.search(
            rb'<script type="application/json" id="essentials-benefits-data"', data
        )
        if not first_json:
            raise RuntimeError("Cannot find anchor point for versions-data block")
        insert_pos = first_json.start()
        new_data = data[:insert_pos] + new_block + b"\n" + data[insert_pos:]
    # Use write_dashboard_atomic (Round 72) — write-to-tmp + integrity-check + atomic swap
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from dashboard_integrity import write_dashboard_atomic
    write_dashboard_atomic(new_data, run_integrity=True)
    print(f"Embedded versions-data into dashboard.html ({len(data)} -> {len(new_data)} bytes)")


SAGA = REPO / "memory" / "essence" / "saga.md"
_SAGA_HEADING_RE = re.compile(
    # Round 137 — accept BOTH historical saga heading shapes (defense in depth):
    #   Shape 1 (rounds ≤130, bolded-date inline): `**(date)** Round N — ...`
    #   Shape 2 (rounds 131+, H2 heading):         `## Round N (date) — ...`
    # Same family as the Round 137 Tacitus parser drift; the latest_saga_round
    # function silently returned 130 forever because every saga round 131-137
    # used Shape 2 which the prior single-shape regex didn't match. Codified the
    # alternation pattern from decisions.md Round 137 — never replace, always
    # extend via alternation; the regex grows linearly with prose evolution.
    r"^(?:\*\*\([^)]+\)\*\*\s+|##\s+)Round\s+(\d+)\b",
    re.MULTILINE,
)


def latest_saga_round() -> int:
    """Read the canonical saga round number from `memory/essence/saga.md`.

    The saga's bolded-date + 'Round N' heading form is the truth anchor for
    round numbering across the project. version_bump.py reads this rather
    than inventing a number from `max(history.round) + 1` — the older heuristic
    drifted whenever a saga round happened without a versions.json bump
    (e.g., Round 101 Tacitus-standalone, Round 103 Tacitus-only). Round 104
    closed the drift surface at its source.
    """
    if not SAGA.exists():
        raise RuntimeError(f"saga.md not found at {SAGA}")
    text = SAGA.read_text(encoding="utf-8")
    matches = [int(m.group(1)) for m in _SAGA_HEADING_RE.finditer(text)]
    if not matches:
        raise RuntimeError("No canonical 'Round N' heading found in saga.md")
    return max(matches)


def cmd_bump(component, level, label, *, narrative_only=False, tacitus_bump=None):
    """Bump brain or dashboard version, or record a narrative-only round.

    - component: "brain" | "dashboard"  (or None when narrative-only with no bump)
    - level: "minor" | "major"  (ignored when narrative-only)
    - label: label / summary for the history entry
    - narrative_only: True → no version change to brain/dashboard; record the
      saga round in history with the current versions. Used for Tacitus-only
      rounds, structural cleanups, doctrinal codifications that warrant a
      timeline entry without a numeric bump on the main components.
    - tacitus_bump: optional "vX.Y" string. Appended to the history entry
      as `tacitus_bump` so the journey timeline surfaces Tacitus rounds.
    """
    obj = load_versions()
    today = datetime.now().strftime("%Y-%m-%d")

    if not narrative_only:
        if component not in ("brain", "dashboard"):
            print(f"Unknown component: {component!r}")
            return 1
        if level not in ("minor", "major"):
            print(f"Unknown level: {level!r}")
            return 1
        old = obj["current"][component]
        new = bump(old, level)
        obj["current"][component] = new
        obj["current"][f"{component}_label"] = label
        bumped_msg = f"{component} v{new} — {label}"
        print(f"Bumped {component}: v{old} -> v{new} ({label!r})")
    else:
        bumped_msg = label

    obj["current"]["updated_iso"] = today
    obj["current"]["updated_display"] = today

    # Round number = latest saga 'Round N' heading. Single source of truth.
    next_round = latest_saga_round()
    entry = {
        "round": next_round,
        "date": today,
        "brain": obj["current"]["brain"],
        "dashboard": obj["current"]["dashboard"],
        "summary": bumped_msg,
    }
    if narrative_only:
        entry["narrative_only"] = True
    if tacitus_bump:
        entry["tacitus_bump"] = tacitus_bump
    # If a history entry for this round already exists, replace it (idempotent
    # close-the-round; supports re-running for fix-ups). Else insert at front.
    existing_idx = next(
        (i for i, h in enumerate(obj["history"]) if h.get("round") == next_round),
        None,
    )
    if existing_idx is not None:
        obj["history"][existing_idx] = entry
        print(f"Updated existing history entry for round {next_round}")
    else:
        obj["history"].insert(0, entry)
        print(f"Appended history entry for round {next_round}")
    # Round 156 — atomicity fix for the Round 114 silent-overwrite family at
    # the tool level. Prior bug: save_versions(obj) committed first, then
    # embed_into_dashboard ran the integrity check; if the dashboard write
    # failed (e.g., cl-data markdown drift), versions.json was already at
    # the new value. Re-running bumped AGAIN from the new value — today's
    # brain v3.20 → v3.22 double-bump came from exactly this.
    #
    # Snapshot-and-rollback pattern: capture the on-disk versions.json before
    # mutation; if embed fails, restore. Both writes go through safe_write;
    # neither write commits unless the other can also.
    snapshot = load_versions()  # disk-truth pre-mutation
    save_versions(obj)
    try:
        embed_into_dashboard(obj)
    except Exception as e:
        # Roll versions.json back to pre-mutation state.
        print(f"[version_bump] embed failed — rolling versions.json back to v{snapshot['current']['brain']}/v{snapshot['current']['dashboard']}: {e}")
        save_versions(snapshot)
        raise
    return 0


def cmd_status():
    obj = load_versions()
    c = obj["current"]
    print(f"  brain     v{c['brain']:6s} {c.get('brain_label','')}")
    print(f"  dashboard v{c['dashboard']:6s} {c.get('dashboard_label','')}")
    print(f"  updated:  {c.get('updated_display','?')}")
    print(f"\nRecent history:")
    for h in obj["history"][:5]:
        print(f"  Round {h['round']:3d} ({h['date']}): brain v{h['brain']}, dash v{h['dashboard']} — {h['summary'][:80]}")
    return 0


def cmd_propagate():
    """Re-embed current versions.json into dashboard without bumping."""
    obj = load_versions()
    embed_into_dashboard(obj)
    print(f"Propagated current versions to dashboard.")
    return 0


def _parse_argv(argv):
    """Tolerant arg parser. Supports:
      version_bump.py brain minor "Label"
      version_bump.py dashboard major "Label"
      version_bump.py narrative-only "Summary text" [--tacitus-bump v2.2]
      version_bump.py propagate
      version_bump.py status
    """
    if len(argv) == 1 or argv[1] == "status":
        return ("status", None)
    if argv[1] == "propagate":
        return ("propagate", None)
    # Pull optional --tacitus-bump
    tacitus_bump = None
    args = list(argv[1:])
    if "--tacitus-bump" in args:
        i = args.index("--tacitus-bump")
        tacitus_bump = args[i + 1]
        del args[i : i + 2]
    if args and args[0] == "narrative-only":
        if len(args) < 2:
            print("narrative-only requires a label/summary argument")
            return ("error", None)
        summary = args[1]
        # Round 125 — footgun guard. Round 114 hit this: `narrative-only --help`
        # got consumed as the summary positional, silently overwrote Round 113's
        # history entry with the literal string "--help". The tool's idempotent
        # "update if exists" write became a silent-overwrite vector when key
        # targeting was ambiguous. Two-layer defense:
        #   1. Explicit help-flag detection routes to docstring print
        #   2. Any summary starting with -- errors out with a clear message
        #      (defensive against future similar typos: --label, --what-i-meant,
        #      etc.). A real summary that intentionally starts with -- can be
        #      rephrased; the rejection is loud, not silent.
        if summary in ("--help", "-h", "--h", "-help", "help"):
            print(__doc__)
            return ("error", None)  # do NOT write
        if summary.startswith("-"):
            print(
                "ERROR: summary argument starts with '-' which looks like a "
                "flag: " + repr(summary) + ".\n"
                "If you meant to ask for help, use `python3 tools/version_bump.py` "
                "with no args, or `--help` as the FIRST argument.\n"
                "If your summary genuinely starts with a dash, rephrase it — "
                "the leading-dash rejection is intentional after the Round 114 "
                "silent-overwrite incident (see lessons.md)."
            )
            return ("error", None)
        return ("bump", {
            "component": None,
            "level": None,
            "label": summary,
            "narrative_only": True,
            "tacitus_bump": tacitus_bump,
        })
    if len(args) < 3:
        print(__doc__)
        return ("error", None)
    return ("bump", {
        "component": args[0],
        "level": args[1],
        "label": args[2],
        "narrative_only": False,
        "tacitus_bump": tacitus_bump,
    })


if __name__ == "__main__":
    action, kwargs = _parse_argv(sys.argv)
    if action == "status":
        sys.exit(cmd_status())
    if action == "propagate":
        sys.exit(cmd_propagate())
    if action == "error":
        sys.exit(2)
    if action == "bump":
        sys.exit(cmd_bump(**kwargs))
    sys.exit(2)
