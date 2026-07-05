#!/usr/bin/env python3
"""tools/genesis.py — session boot sequence (the `genesis` command).

A new Claude Code session opens with the word `genesis`; this prints the boot
report so past depth is regained instantly: the integrity scoreboard, build
parity, the latest Creator's Log entry, the build-log tail, and the live
pass-off (chronicle/next-chunk.md — the rolling handoff). The genesis/ folder
archives the original Cowork pass-off that shaped the project.

Read-only. After it runs, Claude reports + asks which task to resume — never a
flair-only boot. Contract: CLAUDE.md "Genesis".

Run:  PYTHONUTF8=1 python tools/genesis.py
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def _utf8():
    os.environ.setdefault("PYTHONUTF8", "1")
    for stream in (sys.stdout, sys.stderr):
        rc = getattr(stream, "reconfigure", None)
        if rc is not None:
            try:
                rc(encoding="utf-8")
            except Exception:
                pass


BANNER = (
    "╔══════════════════════════════════════════════════════════════╗\n"
    "║  ░▒▓█ THE WALLACH CODEX █▓▒░     ·     G E N E S I S          ║\n"
    "║  offline-first health coverage  ·  session boot sequence     ║\n"
    "╚══════════════════════════════════════════════════════════════╝"
)


def invariants_status():
    try:
        r = subprocess.run(
            [sys.executable, str(ROOT / "tools" / "invariants.py")],
            capture_output=True, text=True, timeout=120,
            env={**os.environ, "PYTHONUTF8": "1", "PYTHONIOENCODING": "utf-8"},
        )
        out = (r.stdout or "") + "\n" + (r.stderr or "")
        reds = re.findall(r"^(?:FAIL|ERR )\s*\[[^\]]*\]\s*([A-Za-z0-9_]+):", out, re.M)
        m = re.search(r"(\d+)/(\d+) passed \((\d+) failed\)", out)
        status = f"{m.group(1)}/{m.group(2)} passed" if m else "ran (unparsed)"
        return status, reds
    except Exception as e:
        return f"UNVERIFIED ({e})", []


def build_parity():
    dist = ROOT / "dashboard/assets/js/dist/main.js"
    src = ROOT / "dashboard/assets/js/src"
    if not dist.exists():
        return "MISSING dist — run `node tools/build.mjs`"
    newest = max((p.stat().st_mtime for p in src.rglob("*.ts")), default=0.0)
    return "fresh" if dist.stat().st_mtime >= newest else "DRIFT — run `node tools/build.mjs`"


def last_creators_log():
    p = ROOT / "chronicle/creators-log/log.jsonl"
    lines = [l for l in p.read_text(encoding="utf-8").splitlines() if l.strip()] if p.exists() else []
    if not lines:
        return "(none yet)"
    try:
        e = json.loads(lines[-1])
        ts = e.get("ts", "")[:16].replace("T", " ")
        return f"{ts} · {e.get('kind', '?')} · {e.get('surface', '?')} — {e.get('summary', '')[:88]}"
    except Exception:
        return "(unparseable last entry)"


def build_log_tail(n=3):
    p = ROOT / "chronicle/build-log.md"
    lines = [l for l in p.read_text(encoding="utf-8").splitlines() if l.strip()] if p.exists() else []
    return [(l[:150] + "…") if len(l) > 150 else l for l in lines[-n:]] or ["(none)"]


def passoff():
    p = ROOT / "chronicle/next-chunk.md"
    if not p.exists():
        return ["(no pass-off — chronicle/next-chunk.md missing)"]
    lines = p.read_text(encoding="utf-8").splitlines()
    start = next((i for i, l in enumerate(lines) if l.startswith("## LATEST")), None)
    if start is None:
        return [l for l in lines[:14] if l.strip()]
    # The current handoff is ONLY the first "## LATEST" block. Terminate at the next
    # "## " heading (older SUPERSEDED/LATEST blocks pile up below it) — NOT at the lone
    # legacy "**Status" anchor ~1200 lines down, which swallowed every accumulated
    # history block into the boot dump (the 2026-07-04 "genesis printed 438 KB"
    # incident: no "## " cap + next-chunk.md grew unbounded). Hard-cap the slice as
    # defense-in-depth so a future structural change can never re-trigger a whole dump.
    end = next((i for i, l in enumerate(lines[start + 1:], start + 1) if l.startswith("## ")), len(lines))
    return [l for l in lines[start:end] if l.strip()][:40]


def main():
    _utf8()
    inv, reds = invariants_status()
    print(BANNER)
    print("\n∴ GENESIS ∴ booting The Wallach Codex\n")
    print(f"⊢ invariants ....... {inv} · new reds: {', '.join(reds) if reds else 'none'}")
    print(f"⊢ build parity ..... {build_parity()}")
    print(f"⊢ creator's log .... {last_creators_log()}")
    print("⊢ build-log (last 3):")
    for l in build_log_tail():
        print(f"    {l}")
    print("⊢ pass-off (chronicle/next-chunk.md · live rolling handoff):")
    for l in passoff():
        print(f"    {l}")
    print("\n⊢ ready. Claude: report the above, then ask — resume the NEXT-ORDER task, or redirect?")


if __name__ == "__main__":
    main()
