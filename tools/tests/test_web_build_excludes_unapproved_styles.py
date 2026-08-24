#!/usr/bin/env python3
"""Negative test for web_build_excludes_unapproved_styles.

Proof artifact: the gate must GREEN on the real repo and REDDEN on each way the phone layer could
reach the website, or leave an unstyled control there:

  (1) the exclusion set is gone entirely — the glob carries every sheet;
  (2) mobile.css is dropped from the exclusion set;
  (3) dashboard.html stops linking it, so the LOCAL dashboard silently loses the layer;
  (4) no SHIPPING sheet hides .cov-panes — the website gets the markup with no rule matching it
      and draws raw user-agent buttons, which is the defect that shipped locally on 2026-08-23;
  (5) a held-back sheet is found in a built dist-web/.

Run: PYTHONUTF8=1 python tools/tests/test_web_build_excludes_unapproved_styles.py
Exit 0 = every case behaves; non-zero = the gate stopped biting."""
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._web_build_excludes_unapproved_styles_impl

GOOD_BUILD = "WEB_EXCLUDED_CSS = {'mobile.css'}\n"
GOOD_SHELL = '<link rel="stylesheet" href="./assets/styles/mobile.css">\n'
GOOD_SHIPS = {'workspace-coverage.css': '.cov-panes { display: none; }\n'}

failures = []

ok, msg = impl(GOOD_BUILD, GOOD_SHELL, GOOD_SHIPS, ['dashboard.abc123.css'], '<link href="dashboard.abc123.css">')
if not ok:
    failures.append(f"expected GREEN on a correct arrangement, got RED: {msg}")

# (0) GREEN on the REAL repo too, not only on a fixture.
ok, msg = inv.check_web_build_excludes_unapproved_styles()
if not ok:
    failures.append(f"expected GREEN on the real repo, got RED: {msg}")

cases = [
    ("no exclusion set at all", "IGNORED = {}\n", GOOD_SHELL, GOOD_SHIPS, None, None),
    ("mobile.css not excluded", "WEB_EXCLUDED_CSS = {'other.css'}\n", GOOD_SHELL, GOOD_SHIPS, None, None),
    ("shell stopped linking it", GOOD_BUILD, '<link href="./assets/styles/theme.css">\n', GOOD_SHIPS, None, None),
    ("no shipping sheet hides .cov-panes", GOOD_BUILD, GOOD_SHELL, {'theme.css': '.foo { color: red; }\n'}, None, None),
    ("held-back sheet found in dist-web", GOOD_BUILD, GOOD_SHELL, GOOD_SHIPS, ['mobile.9f8e7d.css'], None),
    ("dist-web index still references it", GOOD_BUILD, GOOD_SHELL, GOOD_SHIPS, ['dashboard.abc.css'], '<link href="mobile.9f8e.css">'),
]
for label, bw, shell, ships, ds, di in cases:
    ok, msg = impl(bw, shell, ships, ds, di)
    if ok:
        failures.append(f"expected RED for: {label} — got GREEN")

if failures:
    print("FAIL web_build_excludes_unapproved_styles negative test:")
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("OK  web_build_excludes_unapproved_styles: GREEN on real + fixture; RED on all six ways the "
      "phone layer could reach the web or leave an unstyled control there")
