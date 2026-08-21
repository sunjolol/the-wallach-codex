#!/usr/bin/env python3
"""test_views_state_no_inline_data.py — proves the record-shape TIGHTENING is not a loosening.

The heuristic used to measure every `{...}` by its comma count, so a RECORD SHAPE scored the
same as a data blob: state/coverage.ts's tile struct sat at exactly 10 (the limit) and the two
cobalt mirror fields tripped a §00.B "inline data" RED on an object containing no data.

The fix: object literals count only when >= half their top-level values are literal constants;
array literals always count. This test exists to prove the DATA cases the rule was WRITTEN for
still fire — a tightening that quietly stopped catching the original incident would be a
loosening wearing a disguise.

    PYTHONUTF8=1 python tools/tests/test_views_state_no_inline_data.py
"""
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("inv", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)

FAILS = []


def case(name, src, want_over_10):
    got = inv._max_inline_literal_elements(src)
    over = got > 10
    ok = over == want_over_10
    if not ok:
        FAILS.append(name)
    print(f"  {'PASS' if ok else 'FAIL'}  {name}\n         -> {got} elems ({'COUNTS' if over else 'ignored'}), "
          f"want {'COUNTS' if want_over_10 else 'ignored'}")


print("views_state_no_inline_data — the record-shape tightening (data vs struct)\n")

# ── MUST STILL FIRE: the data the rule was written for ───────────────────────
specs = ", ".join("{ name: 'E%d', sym: 'X%d', num: %d }" % (i, i, i) for i in range(91))
case("★ THE 2026-06-21 INCIDENT: 91 hardcoded tile specs (array of literal objects)",
     "const TILES = [%s];" % specs, want_over_10=True)

lookup = ", ".join("'K%d': 'v%d'" % (i, i) for i in range(14))
case("★ a 14-entry literal lookup MAP (every value a literal)",
     "const M = { %s };" % lookup, want_over_10=True)

case("★ a 12-element array of bare strings",
     "const A = ['a','b','c','d','e','f','g','h','i','j','k','l'];", want_over_10=True)

case("★ a 12-entry numeric map (canonical amounts hidden in a view)",
     "const DOSE = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9, j: 10, k: 11, l: 12 };",
     want_over_10=True)

case("★ a mixed map, majority literal (11 of 12) — still data",
     "const M = { a: 'x', b: 'x', c: 'x', d: 'x', e: 'x', f: 'x', g: 'x', h: 'x', i: 'x', "
     "j: 'x', k: 'x', l: compute() };", want_over_10=True)

# ── MUST NOT FIRE: shapes, not payloads ─────────────────────────────────────
case("the tile STRUCT that caused the misfire (12 computed fields, 1 literal)",
     """const base = {
       tileId: buildTileId(entry.name), category: catFromTarget(entry.category), symbol: '',
       name: entry.name, status, covered: status === 'covered' || status === 'trace',
       fillPercent: isPdm ? (PDM_GOAL > 0 ? pdm.totalMg / PDM_GOAL : 0) : deliveryRatio(t, status, d),
       contributesTo: isPdm ? pdm.sources : d.sources, aggregateVehicle: isPdm && status === 'covered',
       intakeVsTarget, mirrorsOf: null, mirrorsSlug: null,
     };""", want_over_10=False)

case("a 12-field struct of pure expressions (a ternary colon must not read as a key)",
     "const o = { a: f(1), b: g(2), c: x ? y : z, d: h(), e: i(), f2: j(), g2: k(), h2: l(), "
     "i2: m(), j2: n(), k2: o2(), l2: p() };", want_over_10=False)

# ── the REAL sources must be clean ──────────────────────────────────────────
ok, msg = inv.check_views_state_no_inline_data()
if not ok:
    FAILS.append("real sources clean")
print(f"  {'PASS' if ok else 'FAIL'}  the REAL views/ + state/ sources are clean\n         -> {msg[:100]}")

print()
if FAILS:
    print(f"FAILED ({len(FAILS)}): {FAILS}")
    sys.exit(1)
print("ALL PASS — every DATA case the rule was written for still fires; only STRUCT shapes stopped.")
