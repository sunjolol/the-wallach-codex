#!/usr/bin/env python3
"""Negative test for views_no_inline_prose (the code-side prose floor).

Proof artifact: the gate must GREEN on a clean view (labels/microcopy only) AND REDDEN on
every class of prose-shaped literal (a >=12-word run; a sentence-boundary run > 40 chars),
so a migrated view cannot carry user-facing prose inline instead of the view-copy store.
Drives _views_no_inline_prose_impl with synthetic (relpath, text) inputs. Run:

    PYTHONUTF8=1 python tools/tests/test_views_no_inline_prose.py

Exit 0 = every case behaves; non-zero = the gate stopped biting."""
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._views_no_inline_prose_impl

# prose-shaped poison (each is inline user-facing prose that belongs in the store)
LONG_SENTENCE = ("`<p>Selenium is an essential trace mineral that Wallach links to Keshan "
                 "disease and cardiomyopathy across three of his books.</p>`")
TWO_SENTENCE = "`The body can synthesize this. Shown for completeness only.`"
CORNERSTONE = ("`The body needs 60 minerals, 16 vitamins, 12 amino acids, and 2 essential "
               "fatty acids. Plant-derived minerals are the only vehicle the body absorbs.`")

# clean copy that must NOT trip (short labels, aria/title microcopy, interpolated markup)
CLEAN = (
    "const a = 'DOSE';\n"
    "const b = 'WHAT TO DO';\n"
    "const c = `<button aria-label=\"close\" title=\"dismiss\">x</button>`;\n"
    "const d = `<div class=\"ep-op\">${val}</div>`;\n"
    "const e = 'no matches';\n"
)


def case(label, text, expect_red):
    ok, msg = impl([(f"views/{label}.ts", text)])
    red = not ok
    good = red == expect_red
    print(f"  [{label}] expect {'RED' if expect_red else 'GREEN'} -> {'RED' if red else 'GREEN'}")
    if not good:
        print(f"    FAIL: {msg}")
    return good


def main():
    results = []
    # baseline: the real shipped view files must already carry no inline prose
    ok, msg = inv.check_views_no_inline_prose()
    print(f"  [baseline] expect GREEN -> {'GREEN' if ok else 'RED'} | {msg[:80]}")
    results.append(ok)
    results.append(case("clean", CLEAN, expect_red=False))
    results.append(case("long_sentence", f"function r(){{ return {LONG_SENTENCE}; }}", expect_red=True))
    results.append(case("two_sentence", f"const s = {TWO_SENTENCE};", expect_red=True))
    results.append(case("cornerstone", f"const q = {CORNERSTONE};", expect_red=True))
    passed = all(results)
    print(f"\n{'ALL PASS' if passed else 'FAILED'} ({sum(results)}/{len(results)})")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
