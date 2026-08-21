#!/usr/bin/env python3
"""Negative test for corpus_resnap.relocate() edge preservation (§00.B "codify, don't promise").

THE DEFECT, measured 2026-08-02. relocate()'s HEAL path anchors on the letters-only skeleton, so it
spanned first-alphanumeric..last-alphanumeric and silently DROPPED a verbatim's leading/trailing
non-alphanumeric run. A de-hyphenation pass healed 77 claims and 69 came back trimmed: 68 lost a
closing '.' / '"' / ')' and WAL-CLM-RARE-000342 lost all four of its '!!!!'; four also gained a stray
leading letter. NOTHING CAUGHT IT -- the trimmed text is still a byte-exact substring of the source,
so corpus_verify check #2, check #9 and the entire invariant board stayed green while 69 user-facing
quotes ended mid-punctuation.

CASE 'trailing_period_kept' is the load-bearing one: it is the shape of all 68. If it flips, the
regression is back and no other gate will tell you.

The SPARING cases matter as much (tighten, never over-fire): an edge run that the corrected
book text does NOT actually carry must NOT be invented, and an untouched verbatim must still take
the cheap 'relocated' path unchanged.

Run:  PYTHONUTF8=1 python tools/tests/test_corpus_resnap_edges.py
Exit 0 = every case behaves."""
import importlib.util, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("rs", ROOT/"eden"/"tools"/"corpus_resnap.py")
rs = importlib.util.module_from_spec(spec); spec.loader.exec_module(rs)

rs.MIN_VB = 5   # the real floor is 60; these fixtures are short by design

def run(name, book, raw_vb, want_status, want_vb):
    sk, mp = rs.skeleton(book)
    st, vb, off = rs.relocate(book, sk, mp, raw_vb)
    ok = (st == want_status) and (vb == want_vb)
    print(f"  {'PASS' if ok else 'FAIL'}  {name:34s} status={st:10s} vb={vb!r}")
    if not ok:
        print(f"        wanted status={want_status!r} vb={want_vb!r}")
    return ok

res = []
# LOAD-BEARING: the exact shape of the 68. Source de-hyphenated 'mal-\nabsorption' -> 'malabsorption';
# the stored verbatim still carries the old hyphen, so it must HEAL -- and keep its closing period.
book = "You know the rest of it, a classic case of malabsorption. The next sentence."
res.append(run("trailing_period_kept", book,
               "You know the rest of it, a classic case of mal-\nabsorption.",
               "healed", "You know the rest of it, a classic case of malabsorption."))
# RARE-000342's shape: a multi-character trailing run.
book2 = "back in the good old days of Homer!!!! Jehoshaphat and others."
res.append(run("multichar_trailing_run_kept", book2,
               "back in the good old days of Ho-\nmer!!!!",
               "healed", "back in the good old days of Homer!!!!"))
# A leading run (opening quote) must survive too.
book3 = 'He said "the trace minerals are essential for life." Then he left.'
res.append(run("leading_quote_kept", book3,
               '"the trace min-\nerals are essential for life."',
               "healed", '"the trace minerals are essential for life."'))
# SPARING: the corrected book does NOT carry that trailing run -> do not invent one.
book4 = "a classic case of malabsorption and nothing else follows"
res.append(run("absent_edge_not_invented", book4,
               "a classic case of mal-\nabsorption;",
               "healed", "a classic case of malabsorption"))
# SPARING: an untouched verbatim still takes the cheap exact path, byte-identical.
res.append(run("exact_match_unchanged", book,
               "a classic case of malabsorption.",
               "relocated", "a classic case of malabsorption."))
# SPARING: genuinely missing text is still BROKEN, never healed into something.
res.append(run("absent_text_still_broken", book,
               "a passage that does not appear anywhere in this book at all",
               "broken", None))

print("-"*92)
if not all(res):
    print(f"FAIL — {sum(1 for r in res if not r)}/{len(res)} case(s) misbehaved."); sys.exit(1)
print(f"PASS — all {len(res)} cases: a heal keeps the verbatim's own leading/trailing run, never "
      f"invents one the source lacks, and leaves the exact/broken paths untouched.")
