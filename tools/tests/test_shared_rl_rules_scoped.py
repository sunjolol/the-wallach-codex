#!/usr/bin/env python3
"""A workspace stylesheet may not declare a BARE rule for a class another workspace owns.

WHAT THIS CAUGHT, TWICE
`.rl-row__x` is the Coverage Daily Protocol rail's per-row remove button, styled in
workspace-coverage.css as a grid cell of its own row. workspace-scanner.css also carried a rule
for it -- unscoped, `position: absolute; top: 4px; right: 2px` -- for markup the Scanner never
emits (its rail removes with `.rl-row__rm`). Because dashboard.html loads the scanner sheet AFTER
the coverage sheet and both selectors have specificity (0,1,0), the later one won on every
Coverage row: each X was pulled out of its row grid and stacked on ONE spot at the panel's
top-right, so the single visible X deleted whichever row happened to be on top.

The board was green throughout. No gate reads across stylesheets for a cross-workspace capture,
and a DOM probe that only checks a button EXISTS sees three buttons and reports success -- the
defect is in their POSITIONS, which is why the geometry has to be part of the assertion.

Run: PYTHONUTF8=1 python tools/tests/test_shared_rl_rules_scoped.py
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
STYLES = ROOT / "dashboard/assets/styles"

# Shared component classes: emitted by more than one workspace, so exactly ONE sheet may own
# their bare rules. Everyone else must qualify with their own workspace scope.
SHARED_PREFIXES = (".rl-row", ".rl-src", ".rl-dose", ".rail-panel")
OWNER = "workspace-coverage.css"
GUESTS = ("workspace-scanner.css", "workspace-regimen.css")

RULE = re.compile(r"(?m)^([^{}/@\n][^{}\n]*)\{")


def bare_shared_selectors(css: str):
    """Selectors in `css` whose FIRST compound is a shared class (i.e. unscoped)."""
    out = []
    for m in RULE.finditer(css):
        for sel in m.group(1).split(","):
            sel = sel.strip()
            if not sel or sel.startswith(("@", "/*", "*")):
                continue
            head = re.split(r"[\s>+~]", sel, maxsplit=1)[0]
            base = head.split(":")[0].split("[")[0]
            if any(base.startswith(p) for p in SHARED_PREFIXES):
                out.append(sel)
    return out


fails = []

# 1. THE RULE: no guest sheet declares a bare shared-class rule.
for name in GUESTS:
    p = STYLES / name
    bare = bare_shared_selectors(p.read_text(encoding="utf-8")) if p.exists() else []
    ok = not bare
    print("%s %-26s expect=0 bare rules      got=%d %s"
          % ("ok  " if ok else "FAIL", name, len(bare), bare[:3] if bare else ""))
    if not ok:
        fails.append("%s declares bare %s -- scope it to that workspace" % (name, bare[:3]))

# 2. The owner IS allowed them (proves the check isn't vacuous by banning them everywhere).
owner_bare = bare_shared_selectors((STYLES / OWNER).read_text(encoding="utf-8"))
ok = len(owner_bare) > 0
print("%s %-26s expect>0 bare rules      got=%d" % ("ok  " if ok else "FAIL", OWNER, len(owner_bare)))
if not ok:
    fails.append("%s no longer owns the shared .rl- base rules -- ownership moved, update OWNER" % OWNER)

# 3. NEGATIVE CONTROL: replant the exact rule that shipped the bug; the check must go RED.
poison = (".rl-row__x { position: absolute; top: 4px; right: 2px; width: 20px; height: 20px; }\n")
planted = bare_shared_selectors(poison)
ok = len(planted) == 1
print("%s negative_control           expect=1 caught         got=%d" % ("ok  " if ok else "FAIL", len(planted)))
if not ok:
    fails.append("negative control: the replanted unscoped rule was NOT caught")

# 4. A correctly-scoped rule must NOT be flagged (the check must not over-fire).
clean = ".vd-rail .rl-row__rm { position: absolute; top: 50%; right: 9px; }\n"
ok = not bare_shared_selectors(clean)
print("%s scoped_rule_spared        expect=0 flagged        got=%d"
      % ("ok  " if ok else "FAIL", len(bare_shared_selectors(clean))))
if not ok:
    fails.append("over-fire: a properly .vd-rail-scoped rule was flagged")

print()
if fails:
    print("FAIL -- %d case(s) misbehaved" % len(fails))
    for f in fails:
        print("   " + f)
    sys.exit(1)
print("PASS -- shared .rl- base rules live only in %s; guest sheets are scoped" % OWNER)
