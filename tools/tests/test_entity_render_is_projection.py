#!/usr/bin/env python3
"""Negative test for entity_render_is_projection (the entity-view projection floor).

Proof artifact: the gate must GREEN on a pure projection (reads DATA[slug]) AND REDDEN on a
hand-built per-entity content map or content branch -- including a 2-key map that slips under
the >10-element views_state_no_inline_data gate. Drives _entity_render_is_projection_impl with
synthetic (relpath, text) inputs against the real entity-id set. Run:

    PYTHONUTF8=1 python tools/tests/test_entity_render_is_projection.py

Exit 0 = every case behaves; non-zero = the gate stopped biting."""
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._entity_render_is_projection_impl
IDS = inv._entity_id_set()

# poison: hand-built per-entity content, keyed / branched by real entity ids
UNQUOTED_MAP = "const PAGES = { calcium: { name: 'Calcium' }, osteoporosis: { name: 'Osteo' } };"
QUOTED_MAP = "const PAGES = { 'calcium': { name: 'Calcium' } };"
EQ_BRANCH = "function hero(slug){ if (slug === 'calcium') return special(); return generic(slug); }"

# HYPHENATED + DIGIT-LEADING POISON -- the cases that caught the gate asleep. BOTH regexes once
# capped at [A-Za-z0-9_] with no hyphen, so roughly a fifth of the real entity ids were invisible:
# `slug === 'omega-9'` passed GREEN while `slug === 'calcium'` reddened. This
# test never noticed because EVERY exemplar above -- calcium, osteoporosis -- is in the visible set.
# A negative test whose poison is drawn only from the cases the gate can already see proves nothing
# about the ones it cannot. Two ids also START WITH A DIGIT, which a letter-only opener would still
# have missed, so DIGIT_MAP is not redundant with EQ_HYPHEN.
EQ_HYPHEN = "function hero(slug){ if (slug === 'omega-9') return special(); return generic(slug); }"
HYPHEN_MAP = "const PAGES = { 'omega-9': { name: 'Omega-9' } };"
DIGIT_MAP = "const PAGES = { '18-and-20-daily-super-blend': { name: 'Blend' } };"

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
    # baseline: the real shipped entity-view files must already be pure projections
    ok, msg = inv.check_entity_render_is_projection()
    print(f"  [baseline] expect GREEN -> {'GREEN' if ok else 'RED'} | {msg[:80]}")
    results.append(ok)
    results.append(case("clean", CLEAN, expect_red=False))
    results.append(case("unquoted_map", UNQUOTED_MAP, expect_red=True))
    results.append(case("quoted_map", QUOTED_MAP, expect_red=True))
    results.append(case("eq_branch", EQ_BRANCH, expect_red=True))
    # the hyphen/digit blind spot, closed 2026-07-15
    results.append(case("eq_hyphen", EQ_HYPHEN, expect_red=True))
    results.append(case("hyphen_map", HYPHEN_MAP, expect_red=True))
    results.append(case("digit_map", DIGIT_MAP, expect_red=True))
    # SWEEP: no hyphenated id may be a free pass ever again. Asserts the WHOLE class,
    # not one exemplar -- a single sample is what let 208 ids through for weeks.
    hy = sorted(i for i in IDS if "-" in i)
    missed = [i for i in hy
              if impl([("v.ts", f"function r(s){{ if (s === '{i}') return x(); return p(s); }}")], IDS)[0]]
    print(f"  [sweep] all {len(hy)} hyphenated ids redden -> {len(hy) - len(missed)}/{len(hy)}"
          + (f" MISSED: {missed[:5]}" if missed else ""))
    results.append(not missed)
    passed = all(results)
    print(f"\n{'ALL PASS' if passed else 'FAILED'} ({sum(results)}/{len(results)})")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
