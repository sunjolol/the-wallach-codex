#!/usr/bin/env python3
"""Acceptance test: does the pinned engine stay inside its folder?

The requirement is absolute -- the engine must be fully self-contained, write nothing to the
registry, and never leak outside engine/. That claim was NOT written down as fact until this
test measured it, because two things are known to break it:

  1. `--user-data-dir` does NOT confine Chromium. Portable Chromium builds exist precisely
     because it writes registry keys anyway (HKCU\\Software\\...\\PreReadFieldTrial, \\Extensions,
     HKCU\\Software\\Classes\\<progID> for file associations).
  2. Crashpad has been reported to create its folder under %LOCALAPPDATA%\\Chromium\\User Data\\
     even when --user-data-dir points elsewhere.

Method: snapshot registry + the AppData roots, launch the engine with the portability flags,
exercise it briefly, kill ONLY our own processes, snapshot again, diff.

★ THE ENGINE IS CURRENTLY ABSENT BY DECISION. The choice is deferred to the very end (see
chronicle/decisions/2026-08-03-pinned-engine-acquisition.md), so this exits immediately with
"engine missing" until one is installed. It is kept because it already earned its place: it
caught a real registry write, and the FIRST version of it did not.

★ Process safety: this NEVER kills chrome.exe by image name. It matches on our unique
  --user-data-dir path in the command line, so a Chrome the user has open is untouched.

★ What this does NOT prove: that the dashboard RENDERS correctly. A launch is not a visual
  check. That remains Luneth's eyes on a screenshot.

Run:  PYTHONUTF8=1 python tools/engine_leak_test.py
Exit 0 = nothing leaked outside engine/. Non-zero = leaks found, listed.
"""
import json
import os
import pathlib
import subprocess
import sys
import time
import winreg

ROOT = pathlib.Path(__file__).resolve().parent.parent
ENGINE = ROOT / "engine"
CHROME = ENGINE / "chrome.exe"
PROFILE = ENGINE / "profile"
CRASH = ENGINE / "crash"
DASH = ROOT / "dashboard" / "dashboard.html"

FLAGS = [
    f"--user-data-dir={PROFILE}",
    "--disable-machine-id",
    "--disable-encryption",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-breakpad",
    f"--crash-dumps-dir={CRASH}",
]


def reg_subkeys(root, path):
    """Enumerate subkey names, or None if the key does not exist."""
    try:
        with winreg.OpenKey(root, path) as k:
            out = []
            i = 0
            while True:
                try:
                    out.append(winreg.EnumKey(k, i))
                except OSError:
                    break
                i += 1
            return set(out)
    except FileNotFoundError:
        return None
    except OSError:
        return None


def reg_tree_values(root, path, _depth=0, _budget=None):
    """Every (subpath, value-name, value) under a key, recursively.

    ★ Why this exists: the first version of this test compared SUBKEY NAMES only, and
    HKCU\\Software\\Chromium already existed on this machine. A value written into an
    already-existing key would have been completely invisible, and the test would have reported
    a confident "unchanged". A null is only worth something once the instrument is shown capable
    of a hit."""
    if _budget is None:
        _budget = [20000]
    out = set()
    if _depth > 6 or _budget[0] <= 0:
        return out
    try:
        with winreg.OpenKey(root, path) as k:
            n_sub, n_val, _ = winreg.QueryInfoKey(k)
            for i in range(n_val):
                _budget[0] -= 1
                if _budget[0] <= 0:
                    break
                try:
                    name, val, _t = winreg.EnumValue(k, i)
                    out.add(f"{path}::{name}={val!r}"[:400])
                except OSError:
                    break
            for i in range(n_sub):
                if _budget[0] <= 0:
                    break
                try:
                    sub = winreg.EnumKey(k, i)
                except OSError:
                    break
                out |= reg_tree_values(root, path + "\\" + sub, _depth + 1, _budget)
    except FileNotFoundError:
        return out
    except OSError:
        return out
    return out


def snapshot():
    la = pathlib.Path(os.environ["LOCALAPPDATA"])
    ra = pathlib.Path(os.environ["APPDATA"])
    return {
        "HKCU/Software": reg_subkeys(winreg.HKEY_CURRENT_USER, r"Software"),
        "HKCU/Software/Chromium": reg_subkeys(winreg.HKEY_CURRENT_USER, r"Software\Chromium"),
        "HKCU/Software/Google": reg_subkeys(winreg.HKEY_CURRENT_USER, r"Software\Google"),
        "HKCU/Software/Classes": {n for n in (reg_subkeys(winreg.HKEY_CURRENT_USER, r"Software\Classes") or set())
                                  if "chrom" in n.lower()},
        "LOCALAPPDATA": {p.name for p in la.iterdir()} if la.exists() else set(),
        "APPDATA": {p.name for p in ra.iterdir()} if ra.exists() else set(),
        "LOCALAPPDATA/Chromium exists": (la / "Chromium").exists(),
        # VALUE-level, not just subkey names — see reg_tree_values' docstring for why.
        "values:HKCU/Software/Chromium": reg_tree_values(winreg.HKEY_CURRENT_USER, r"Software\\Chromium"),
        "values:HKCU/Software/Google": reg_tree_values(winreg.HKEY_CURRENT_USER, r"Software\\Google"),
    }


def our_pids():
    """PIDs of chrome.exe processes whose command line names OUR profile. Never a blanket match."""
    ps = (
        "Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | "
        f"Where-Object {{ $_.CommandLine -like '*{PROFILE.name}*' -and $_.CommandLine -like '*{ENGINE.name}*' }} | "
        "Select-Object -ExpandProperty ProcessId"
    )
    r = subprocess.run(["powershell", "-NoProfile", "-Command", ps],
                       capture_output=True, text=True)
    return [int(x) for x in r.stdout.split() if x.strip().isdigit()]


def main():
    if not CHROME.exists():
        print(f"FAIL engine missing at {CHROME}")
        return 1
    if not DASH.exists():
        print(f"FAIL dashboard missing at {DASH}")
        return 1

    pre_existing = our_pids()
    if pre_existing:
        print(f"FAIL {len(pre_existing)} engine process(es) already running -- close them first")
        return 1

    print("snapshotting before...")
    before = snapshot()

    url = "file:///" + str(DASH).replace("\\", "/")
    print(f"launching pinned engine -> {url}")
    proc = subprocess.Popen([str(CHROME)] + FLAGS + [f"--app={url}"])

    print("letting it run 25s (first run creates the profile)...")
    time.sleep(25)

    pids = our_pids()
    print(f"our processes: {len(pids)}")
    if pids:
        subprocess.run(["taskkill", "/PID", str(proc.pid), "/T", "/F"],
                       capture_output=True, text=True)
        time.sleep(3)
        left = our_pids()
        for p in left:
            subprocess.run(["taskkill", "/PID", str(p), "/T", "/F"], capture_output=True)
        time.sleep(2)
    print(f"remaining after kill: {len(our_pids())}")

    print("snapshotting after...")
    after = snapshot()

    print()
    leaks = []
    for key in ("HKCU/Software", "HKCU/Software/Classes", "LOCALAPPDATA", "APPDATA"):
        b, a = before[key], after[key]
        if b is None and a is None:
            print(f"  {key:26} absent before and after")
            continue
        new = (a or set()) - (b or set())
        if new:
            leaks.append(f"{key}: NEW {sorted(new)}")
            print(f"  {key:26} ⚠ NEW: {sorted(new)}")
        else:
            print(f"  {key:26} unchanged")

    for key in ("HKCU/Software/Chromium", "HKCU/Software/Google"):
        b, a = before[key], after[key]
        if b is None and a is not None:
            leaks.append(f"{key}: CREATED with {sorted(a)}")
            print(f"  {key:26} ⚠ CREATED: {sorted(a)}")
        elif b is not None and a is not None and a - b:
            leaks.append(f"{key}: new subkeys {sorted(a - b)}")
            print(f"  {key:26} ⚠ new subkeys: {sorted(a - b)}")
        elif b is None:
            print(f"  {key:26} absent before and after")
        else:
            print(f"  {key:26} pre-existing, unchanged")

    # The load-bearing check: VALUES inside keys that already existed.
    for key in ("values:HKCU/Software/Chromium", "values:HKCU/Software/Google"):
        b, a = before[key], after[key]
        new = a - b
        gone = b - a
        label = key.replace("values:", "")
        if new or gone:
            leaks.append(f"{label} VALUES changed: +{len(new)} -{len(gone)} e.g. {sorted(new)[:2]}")
            print(f"  {label:26} ⚠ VALUES +{len(new)} -{len(gone)}: {sorted(new)[:2]}")
        else:
            print(f"  {label:26} {len(b)} value(s), byte-identical")

    if not before["LOCALAPPDATA/Chromium exists"] and after["LOCALAPPDATA/Chromium exists"]:
        leaks.append("%LOCALAPPDATA%\\Chromium CREATED -- the Crashpad leak is real")
        print("  %LOCALAPPDATA%\\Chromium      ⚠ CREATED (Crashpad leak)")
    else:
        print("  %LOCALAPPDATA%\\Chromium      not created")

    print()
    print(f"  engine/profile created: {PROFILE.exists()}"
          + (f" ({sum(1 for _ in PROFILE.rglob('*') if _.is_file())} files)" if PROFILE.exists() else ""))
    print(f"  engine/crash created  : {CRASH.exists()}")

    print()
    if leaks:
        print(f"{len(leaks)} LEAK(S) — the engine is NOT fully self-contained:")
        for l in leaks:
            print(f"  {l}")
        print()
        print("Do NOT write 'no registry, never leaks' anywhere until these are eliminated")
        print("or explicitly accepted in the acquisition decision.")
        return 1
    print("NO LEAKS DETECTED — every write stayed inside engine/.")
    print("(Says nothing about whether the dashboard RENDERS. That needs Luneth's eyes.)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
