#!/usr/bin/env python3
"""Negative test for split_data_manifest_agrees.

Proof artifact: the gate must GREEN on the real pair of files and REDDEN on each way the two
hand-maintained lists can drift apart. This matters more than most gates because the defect it
guards is INVISIBLE LOCALLY -- on file:// every artifact is still inlined, so a broken split
renders perfectly on the developer's machine and empties only on the website.

★ The tampering below is DERIVED from whatever the real files currently say, never hardcoded.
An earlier version pinned the literal text of a one-key SplitKey union; the moment the union
grew to three keys the fixture silently stopped matching and the test failed with "could not
rewrite" instead of testing anything. Failing loudly was correct, but a fixture that breaks
every time the list it guards changes is a fixture that will eventually be deleted rather than
fixed. Derive, so it survives the list growing.

Drives _split_data_manifest_agrees_impl with tampered copies of the real file texts. Run:

    PYTHONUTF8=1 python tools/tests/test_split_data_manifest.py

Exit 0 = every case behaves; non-zero = the gate stopped biting."""
import importlib.util
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MJS = ROOT / "tools" / "esbuild_web.mjs"
TS = ROOT / "dashboard" / "assets" / "js" / "src" / "state" / "data-split.ts"

spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._split_data_manifest_agrees_impl

mjs = MJS.read_text(encoding="utf-8")
ts = TS.read_text(encoding="utf-8")
all_present = lambda key: True  # noqa: E731 — the artifact-existence probe, satisfied by default

failures = []
GHOST = "no-such-artifact"

# (0) GREEN on the real files.
ok, msg = impl(mjs, ts, all_present)
if not ok:
    failures.append(f"expected GREEN on the real files, got RED: {msg}")

# Derive a real key to tamper with, rather than naming one.
union_match = re.search(r"export type SplitKey\s*=\s*([^;]+);", ts)
keys = sorted(re.findall(r"\{\s*key:\s*'([^']+)'", mjs))
if union_match is None or not keys:
    failures.append("fixture: could not read the real manifests — both files changed shape")
    victim = None
else:
    victim = keys[0]

if victim is not None:
    # (1) STUBBED BUT NOT DECLARED -> RED. The payload leaves the bundle and nothing fetches it:
    #     that dataset renders EMPTY on the web and perfect locally.
    tampered_union = union_match.group(0).replace(f"'{victim}'", f"'{GHOST}'")
    tampered_ts = ts.replace(union_match.group(0), tampered_union)
    ok, msg = impl(mjs, tampered_ts, all_present)
    if ok:
        failures.append("expected RED when an artifact is stubbed but not declared, got GREEN")
    elif victim not in msg:
        failures.append(f"RED message should name the stubbed-only key {victim!r}: {msg}")

    # (2) DECLARED BUT NOT STUBBED -> RED. The file is fetched AND still inlined: paid for twice.
    tampered_mjs = re.sub(rf"(\{{\s*key:\s*)'{re.escape(victim)}'", rf"\1'{GHOST}'", mjs, count=1)
    if tampered_mjs == mjs:
        failures.append("fixture: could not rewrite SPLIT_ARTIFACTS — esbuild_web.mjs changed shape")
    else:
        ok, msg = impl(tampered_mjs, ts, all_present)
        if ok:
            failures.append("expected RED when an artifact is declared but not stubbed, got GREEN")

# (3) DECLARED, STUBBED, BUT NOT ON DISK -> RED. build_web.py would ship nothing.
ok, msg = impl(mjs, ts, lambda key: False)
if ok:
    failures.append("expected RED when the declared artifact is absent from assets/data/, got GREEN")
elif "absent" not in msg:
    failures.append(f"RED message should say the artifact is absent: {msg}")

# (4) EMPTY MANIFEST -> RED, never a vacuous pass. A gate that greens on nothing is worse than
#     no gate: it reports success for a build that stubs nothing at all.
ok, msg = impl("export const SPLIT_ARTIFACTS = [];", "export type SplitKey = 'x';", all_present)
if ok:
    failures.append("expected RED on an empty SPLIT_ARTIFACTS, got GREEN (vacuous pass)")

# (5) UNION GONE -> RED. If data-split.ts is reshaped, the gate must announce it is blind rather
#     than silently comparing against an empty set and greening.
ok, msg = impl(mjs, "// the union was refactored away", all_present)
if ok:
    failures.append("expected RED when the SplitKey union cannot be found, got GREEN")

# (6) The real manifests must not be EMPTY in the first place — a green gate over a list that
#     has quietly become empty would mean the web build stopped splitting anything at all.
if victim is not None and len(keys) < 1:
    failures.append("the real SPLIT_ARTIFACTS list is empty — nothing is being split")

if failures:
    print("FAIL — the gate stopped biting:")
    for f in failures:
        print(f"  · {f}")
    sys.exit(1)
print(f"OK — greens on the real {len(keys)} artifact(s) and reds on all 5 drift shapes")
