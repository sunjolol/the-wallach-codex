#!/usr/bin/env python3
"""`user_supplied_provenance_single_home` is not vacuous: the drift it exists to catch REDs it.

WHAT THIS EXISTS TO CATCH
"Are these the user's own numbers?" decides two visible things: whether the coverage auto-heal
re-reads an item's composition from the sealed vault (state/coverage.ts::liveNutrients), and
whether a regimen row wears the YOURS mark (views/coverage.ts + views/regimen.ts). Before
core/provenance.ts those three asked the question with three hand-typed `=== 'user_scanned'`
comparisons. When `user_typed` landed for hand-entered items, all three had to change together.

Leave the auto-heal one behind and a hand-typed item whose name happens to match a vault product
has the user's OWN typed amounts silently replaced by sealed composition -- no error, no mark on
screen, and a coverage tile can flip on the strength of it. Leave a YOURS mark behind and the app
tells the user their own entry came from the product database. Neither is visible to Eden's wall
(scanner_user_items_marked): every token involved is a legitimate USER token, so that gate stays
green through the whole failure.

Run: PYTHONUTF8=1 python tools/tests/test_user_supplied_provenance_single_home.py
"""
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))

from invariants import _user_supplied_single_home_impl  # noqa: E402

HOME = ("export const USER_SUPPLIED_PROVENANCE: readonly string[] = ['user_scanned', 'user_typed'];\n"
        "export function isUserSupplied(provenance: string): boolean {\n"
        "  return USER_SUPPLIED_PROVENANCE.includes(provenance);\n"
        "}\n")

CLEAN = ("dashboard/assets/js/src/state/coverage.ts",
         "export function liveNutrients(item: RegimenItem): unknown[] {\n"
         "  if (isUserSupplied(item.provenance)) {\n"
         "    return snapshot;\n"
         "  }\n"
         "}\n")

fails = []


def case(name, home_src, files, expect_pass):
    ok, msg = _user_supplied_single_home_impl(home_src, files)
    good = ok is expect_pass
    print("%s %-52s expect=%s got=%s %s"
          % ("ok  " if good else "FAIL", name, "PASS" if expect_pass else "RED",
             "PASS" if ok else "RED", "" if ok else msg[:110]))
    if not good:
        fails.append(name)


# 1. The tree as it stands: one home, every caller delegating.
case("clean tree delegates", HOME, [CLEAN], True)

# 2. THE REAL BUG. The auto-heal fork left behind on a bare token -- the one that silently
#    overwrites a user's typed amounts with sealed vault composition.
case("auto-heal fork left on a bare token", HOME, [
    ("dashboard/assets/js/src/state/coverage.ts",
     "  if (item.provenance === 'user_scanned') {\n    return snapshot;\n  }\n"),
], False)

# 3. A YOURS mark left behind -- same class, different surface.
case("YOURS mark left on a bare token", HOME, [
    CLEAN,
    ("dashboard/assets/js/src/views/regimen.ts", "    const own = item.provenance === 'user_scanned';\n"),
], False)

# 4. The comparison written backwards still REDs (a rule that only reads left-to-right is
#    a rule you can walk around by swapping the operands).
case("reversed operands", HOME, [
    ("dashboard/assets/js/src/views/coverage.ts", "    if ('user_typed' === item.provenance) {\n"),
], False)

# 5. != is the same defect wearing a different operator.
case("inequality operator", HOME, [
    ("dashboard/assets/js/src/views/coverage.ts", "    if (item.provenance !== 'user_manual') {\n"),
], False)

# 6. The home file losing its export: every caller would have nothing to delegate to.
case("home lost isUserSupplied", HOME.replace("export function isUserSupplied", "function isUserSupplied"),
     [CLEAN], False)

# 7. The home file gone entirely.
case("home file missing", None, [CLEAN], False)

# 8. NOT over-broad: reading or assigning provenance is ordinary and must stay green.
case("assignment + property read stay green", HOME, [
    ("dashboard/assets/js/src/views/scanner.ts",
     "        ...(lbl.entry === 'typed' ? { provenance: 'user_typed' } : { provenance: 'user_scanned' }),\n"
     "  const p = item.provenance;\n"
     "  provenance: z.string(),\n"),
], True)

print()
if fails:
    print("FAIL — %d case(s) wrong: %s" % (len(fails), ", ".join(fails)))
    sys.exit(1)
print("PASS · user_supplied_provenance_single_home REDs on every way the question drifts to a "
      "second home, and stays green on ordinary provenance reads/writes")
