#!/usr/bin/env python3
"""Negative test for web_build_stylesheet_parity.

Proof artifact: the gate must GREEN on the real repo and REDDEN on each way the two distribution
targets could silently disagree about their stylesheets:

  (1) the exclusion set is gone entirely -- there is no longer one place a sheet can be withheld,
      so withholding one becomes invisible;
  (2) dashboard.html links a sheet the web build neither ships nor names as held back -- it would
      404 on the website;
  (3) no SHIPPING sheet carries the `.cov-panes { display: none }` default -- coverage.ts renders
      the pane switch at every width, so a target without that rule draws raw user-agent buttons.
      This is the defect that shipped locally on 2026-08-23;
  (4) the same, for `.topbar__goals` -- the Goals button added on 2026-08-25, which is markup at
      every width and phone-only in appearance;
  (5) a sheet IS held back and a built dist-web/ ships it anyway;
  (6) a sheet IS held back and dist-web/index.html still references it.

HISTORY. Until 2026-08-25 this file tested the opposite claim: that mobile.css was HELD BACK from
the web. The owner approved the phone layer for nutrientcodex.com on 2026-08-25, so that assertion
became false and the gate was re-aimed at parity. Cases (5) and (6) keep the withholding mechanism
under test with a *hypothetical* excluded sheet, so the machinery still bites the day it is needed
again -- the mechanism is not exercised by the live repo any more, which is exactly why it needs a
fixture.

Run: PYTHONUTF8=1 python tools/tests/test_web_build_stylesheet_parity.py
Exit 0 = every case behaves; non-zero = the gate stopped biting."""
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._web_build_stylesheet_parity_impl

# The live shape: nothing held back, the phone layer ships.
GOOD_BUILD = "WEB_EXCLUDED_CSS: set[str] = set()\n"
GOOD_SHELL = (
    '<link rel="stylesheet" href="./assets/styles/dashboard.css">\n'
    '<link rel="stylesheet" href="./assets/styles/workspace-coverage.css">\n'
    '<link rel="stylesheet" href="./assets/styles/mobile.css">\n'
)
GOOD_SHIPS = {
    'dashboard.css': '.topbar__goals { display: none; }\n',
    'workspace-coverage.css': '.cov-panes { display: none; }\n',
    'mobile.css': '@media (max-width: 767px) { .app-rail { flex-direction: row; } }\n',
}
GOOD_DIST = ['dashboard.abc123.css', 'workspace-coverage.def456.css', 'mobile.789abc.css']
GOOD_INDEX = '<link href="./assets/styles/mobile.789abc.css">'

# A hypothetical withholding, so the mechanism stays under test now that the repo uses none.
HELD_BUILD = "WEB_EXCLUDED_CSS = {'experimental.css'}\n"
HELD_SHELL = GOOD_SHELL + '<link rel="stylesheet" href="./assets/styles/experimental.css">\n'

failures = []

ok, msg = impl(GOOD_BUILD, GOOD_SHELL, GOOD_SHIPS, GOOD_DIST, GOOD_INDEX)
if not ok:
    failures.append("expected GREEN on the live arrangement, got RED: %s" % msg)

# A correct WITHHOLDING must also be green: named, linked locally, absent from dist-web.
ok, msg = impl(HELD_BUILD, HELD_SHELL, GOOD_SHIPS, GOOD_DIST, GOOD_INDEX)
if not ok:
    failures.append("expected GREEN on a correct withholding, got RED: %s" % msg)

# (0) GREEN on the REAL repo too, not only on a fixture.
ok, msg = inv.check_web_build_stylesheet_parity()
if not ok:
    failures.append("expected GREEN on the real repo, got RED: %s" % msg)

NO_COV = dict(GOOD_SHIPS)
NO_COV['workspace-coverage.css'] = '.something-else { color: red; }\n'
NO_GOALS = dict(GOOD_SHIPS)
NO_GOALS['dashboard.css'] = '.something-else { color: red; }\n'

cases = [
    ("no exclusion set at all",
     "IGNORED = {}\n", GOOD_SHELL, GOOD_SHIPS, GOOD_DIST, GOOD_INDEX),
    ("a linked sheet is neither shipped nor held back",
     GOOD_BUILD, GOOD_SHELL + '<link href="./assets/styles/ghost.css">\n', GOOD_SHIPS, GOOD_DIST, GOOD_INDEX),
    ("no shipping sheet hides .cov-panes",
     GOOD_BUILD, GOOD_SHELL, NO_COV, GOOD_DIST, GOOD_INDEX),
    ("no shipping sheet hides .topbar__goals",
     GOOD_BUILD, GOOD_SHELL, NO_GOALS, GOOD_DIST, GOOD_INDEX),
    ("a held-back sheet is found in dist-web",
     HELD_BUILD, HELD_SHELL, GOOD_SHIPS, GOOD_DIST + ['experimental.9f8e7d.css'], GOOD_INDEX),
    ("dist-web index still references a held-back sheet",
     HELD_BUILD, HELD_SHELL, GOOD_SHIPS, GOOD_DIST, GOOD_INDEX + '<link href="experimental.9f8e.css">'),
]
for label, bw, shell, ships, ds, di in cases:
    ok, msg = impl(bw, shell, ships, ds, di)
    if ok:
        failures.append("expected RED for: %s — got GREEN" % label)

if failures:
    print("FAIL web_build_stylesheet_parity negative test:")
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("OK  web_build_stylesheet_parity: GREEN on the real repo, on the live arrangement and on a "
      "correct withholding; RED on all six ways the two targets could disagree")
