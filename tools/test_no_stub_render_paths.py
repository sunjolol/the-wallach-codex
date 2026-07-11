#!/usr/bin/env python3
"""Negative test for no_stub_render_paths (Phase H0 enforcement floor).

Proof artifact (R7 / stop-the-leak-before-building): the gate must GREEN on the real
shipped views/styles AND REDDEN on every prototype/demo scaffold token, so a future
migration chunk cannot paste the prototype's scaffolding into a shipped view. Drives
_no_stub_render_paths_impl with synthetic (relpath, text) inputs. Run:

    PYTHONUTF8=1 python tools/test_no_stub_render_paths.py

Exit 0 = every case behaves; non-zero = the gate stopped biting."""
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._no_stub_render_paths_impl

# one poison per scaffold token, each as it appears in temporary/*.html
TOKENS = {
    "kn-stub":    '`<span class="kn-stub__mark">P1</span>`',
    "sh-stub":    '`<div class="sh-stub">x</div>`',
    "next chunk": '`<span>P1 · next chunk</span>`',
    "real build": '`this wires in the real build`',
    "demo wires": '`the demo wires two exemplars`',
    "PROTOTYPE":  '`PROTOTYPE v4 footer`',
    "exemplar":   '// chunk-1 exemplar: only Calcium has a page',
}


def case(label, files, expect_red, expect_substr=None):
    ok, msg = impl(files)
    red = not ok
    named = (expect_substr is None) or (expect_substr.lower() in msg.lower())
    good = (red == expect_red) and named
    print(f"  [{label}] expect {'RED' if expect_red else 'GREEN'} -> "
          f"{'RED' if red else 'GREEN'} | substr {expect_substr!r} named: {named}")
    if not good:
        print(f"    FAIL: {msg}")
    return good


def main():
    results = []
    # baseline: the real shipped views/styles must be clean
    ok, msg = inv.check_no_stub_render_paths()
    print(f"  [baseline] expect GREEN -> {'GREEN' if ok else 'RED'} | {msg[:80]}")
    results.append(ok)
    # a clean synthetic view: no token
    results.append(case("clean_view",
                        [("views/entity.ts", "const label = 'DOSE'; return `<div>${label}</div>`;")],
                        expect_red=False))
    # one RED per scaffold token
    for tok, payload in TOKENS.items():
        results.append(case(f"tok:{tok}",
                            [("views/knowledge.ts", f"const x = {payload};")],
                            expect_red=True, expect_substr=tok))
    passed = all(results)
    print(f"\n{'ALL PASS' if passed else 'FAILED'} ({sum(results)}/{len(results)})")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
