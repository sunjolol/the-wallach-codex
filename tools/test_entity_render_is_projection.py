#!/usr/bin/env python3
"""Negative test for entity_render_is_projection (Phase H0 enforcement floor, R1).

Proof artifact: the gate must GREEN on a pure projection (reads DATA[slug]) AND REDDEN on a
hand-built per-entity content map or content branch -- including a 2-key map that slips under
the >10-element views_state_no_inline_data gate. Drives _entity_render_is_projection_impl with
synthetic (relpath, text) inputs against the real entity-id set. Run:

    PYTHONUTF8=1 python tools/test_entity_render_is_projection.py

Exit 0 = every case behaves; non-zero = the gate stopped biting."""
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._entity_render_is_projection_impl
IDS = inv._entity_id_set()

# poison: hand-built per-entity content, keyed / branched by real entity ids
UNQUOTED_MAP = "const PAGES = { calcium: { name: 'Calcium' }, osteoporosis: { name: 'Osteo' } };"
QUOTED_MAP = "const PAGES = { 'calcium': { name: 'Calcium' } };"
EQ_BRANCH = "function hero(slug){ if (slug === 'calcium') return special(); return generic(slug); }"

# clean: a pure projection -- no entity id appears as a literal key or branch
CLEAN = ("function render(slug, data){ const rec = data[slug];\n"
         "  return `<h1>${rec.name}</h1>` + rec.claims.map(renderClaim).join(''); }")


def case(label, text, expect_red):
    ok, msg = impl([(f"views/{label}.ts", text)], IDS)
    red = not ok
    good = red == expect_red
    print(f"  [{label}] expect {'RED' if expect_red else 'GREEN'} -> {'RED' if red else 'GREEN'}")
    if not good:
        print(f"    FAIL: {msg}")
    return good


def main():
    results = []
    # the test's own premise: the two exemplar ids must be in the real id set
    premise = "calcium" in IDS and "osteoporosis" in IDS
    print(f"  [premise] calcium+osteoporosis in id set ({len(IDS)} ids) -> {premise}")
    results.append(premise)
    # baseline: the empty H0 target surface is vacuously green
    ok, msg = inv.check_entity_render_is_projection()
    print(f"  [baseline] expect GREEN -> {'GREEN' if ok else 'RED'} | {msg[:80]}")
    results.append(ok)
    results.append(case("clean", CLEAN, expect_red=False))
    results.append(case("unquoted_map", UNQUOTED_MAP, expect_red=True))
    results.append(case("quoted_map", QUOTED_MAP, expect_red=True))
    results.append(case("eq_branch", EQ_BRANCH, expect_red=True))
    passed = all(results)
    print(f"\n{'ALL PASS' if passed else 'FAILED'} ({sum(results)}/{len(results)})")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
