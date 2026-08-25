#!/usr/bin/env python3
"""Negative test for stylesheets_no_dead_rules.

THIS TEST DID NOT EXIST UNTIL 2026-08-25, which is itself the finding that prompted it: the
gate's implementation was deliberately split into a pure core with the docstring "Split out so
the negative test can feed a synthetic dead class" -- and that test was never written. A fence
with no proof it bites is a fence you are trusting on its own say-so.

Proof artifact: the gate must GREEN on the real repo and REDDEN on each way stylesheet rot can
enter or be hidden:

  (1) a class rule nothing renders;
  (2) a @keyframes defined in the sheet and animated nowhere;
  (3) a class that is ONLY named in a code comment -- comments must not count as references, or
      the fence is defeated by describing the dead code instead of deleting it;
  (4) NEW rot in drawer-knowledge.css despite the 121-entry unruled backlog -- the backlog must
      not become a blanket that hides everything that comes after it;
  (5) a class allowlisted by NAME still passes -- the escape hatch works, deliberately, so a
      dormant class can be kept with a written reason rather than by weakening the gate.

Run: PYTHONUTF8=1 python tools/tests/test_dead_rules.py
Exit 0 = every case behaves; non-zero = the fence stopped biting."""
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._workspace_coverage_no_dead_rules_impl

failures = []

# (0) GREEN on the real repo, across every fenced sheet.
ok, msg = inv.check_stylesheets_no_dead_rules()
if not ok:
    failures.append("expected GREEN on the real repo, got RED: %s" % msg)

# The fence must actually be pointed at more than one sheet.
sheets = [rel for rel, _ in inv._DEAD_RULE_SHEETS]
if len(sheets) < 3:
    failures.append("expected at least 3 fenced sheets, got %r" % sheets)
for expected in ("workspace-coverage.css", "drawer-shared.css", "drawer-knowledge.css"):
    if not any(s.endswith(expected) for s in sheets):
        failures.append("%s is not fenced" % expected)

# drawer-shared.css must carry NO allowlist -- it was cleaned, and an empty dict is the claim.
if inv._DRAWER_SHARED_DEAD_RULE_ALLOWLIST:
    failures.append("drawer-shared.css grew an allowlist: %r"
                    % sorted(inv._DRAWER_SHARED_DEAD_RULE_ALLOWLIST))

# The backlog must be labelled as unruled, not as a justification.
for name, reason in list(inv._DRAWER_KNOWLEDGE_UNRULED_BACKLOG.items())[:3]:
    if "UNRULED" not in reason:
        failures.append("backlog entry %r reads as an exception, not a backlog: %r" % (name, reason))

RUNS = {"live-thing"}
STUBS = set()
DATA = set()

GOOD = ".live-thing { color: red; }\n"
DEADCLASS = ".live-thing { color: red; }\n.nobody-renders-this { color: blue; }\n"
COMMENTED = (".live-thing { color: red; }\n"
             "/* .nobody-renders-this is described here but nothing renders it */\n"
             ".nobody-renders-this { color: blue; }\n")
KEYFRAME = ".live-thing { color: red; }\n@keyframes nothing-animates-me { from { opacity: 0; } }\n"

ok, msg = impl(GOOD, RUNS, STUBS, DATA, [GOOD], {})
if not ok:
    failures.append("expected GREEN on a clean sheet, got RED: %s" % msg)

cases = [
    ("a class rule nothing renders", DEADCLASS, [DEADCLASS], {}),
    ("a class named ONLY in a comment (comments must not count as a reference)",
     COMMENTED, [COMMENTED], {}),
    ("a @keyframes animated nowhere", KEYFRAME, [KEYFRAME], {}),
]
for label, css, all_css, allow in cases:
    ok, msg = impl(css, RUNS, STUBS, DATA, all_css, allow)
    if ok:
        failures.append("expected RED for: %s - got GREEN" % label)

# (5) the escape hatch works when the class is named WITH a reason
ok, msg = impl(DEADCLASS, RUNS, STUBS, DATA, [DEADCLASS],
               {"nobody-renders-this": "deliberately dormant, wire-up-later hook"})
if not ok:
    failures.append("expected GREEN when the dead class is allowlisted by name, got RED: %s" % msg)

# (4) NEW rot in drawer-knowledge.css still reds despite the 121-entry backlog.
#     Fed through the REAL backlog, so this proves the real dict does not act as a blanket.
ok, msg = impl(DEADCLASS, RUNS, STUBS, DATA, [DEADCLASS], inv._DRAWER_KNOWLEDGE_UNRULED_BACKLOG)
if ok:
    failures.append("the 121-entry backlog acted as a BLANKET: new rot passed instead of redding")

# ...and a class that IS on the backlog passes, which is the point of seeding it.
some_backlogged = sorted(inv._DRAWER_KNOWLEDGE_UNRULED_BACKLOG)[0]
css_backlogged = ".live-thing { color: red; }\n.%s { color: blue; }\n" % some_backlogged
ok, msg = impl(css_backlogged, RUNS, STUBS, DATA, [css_backlogged],
               inv._DRAWER_KNOWLEDGE_UNRULED_BACKLOG)
if not ok:
    failures.append("a backlogged class reddened the board: %s" % msg)

if failures:
    print("FAIL stylesheets_no_dead_rules negative test:")
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("OK  stylesheets_no_dead_rules: GREEN on the real repo across 3 fenced sheets; RED on a dead "
      "class, a comment-only reference, and an orphan keyframe; the named-allowlist hatch works; "
      "and the 121-entry unruled backlog does NOT blanket new rot")
