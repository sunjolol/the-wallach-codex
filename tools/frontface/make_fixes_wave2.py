"""Build corpus_resnap --fix payloads for wave 2, merging TWO different repair kinds.

  (a) LETTER corrections -- claims whose verbatim changed because the source span was corrected.
      Derived by replaying apply_wave2.EDITS against each claim's own verbatim, never retyped.
  (b) EXTENT re-cuts -- four claims whose source was always correct but whose verbatim was cut at
      the wrong boundary (three swallowed a page separator, one stopped two characters short).
      These come from build_extent_fixes.py.

Both kinds end up in one --fix map per book, because resnap applies `fixes.get(cid, current)`
unconditionally for any listed id.

OVERRIDES exist for the same reason as in wave 1: a claim whose verbatim ENDS INSIDE an edit window
cannot be corrected by replaying that edit -- the window's tail is not there to match. EPIGEN-000096
is the notable one: its verbatim is a SUB-SPAN of the three-line region restoration, so its corrected
text is stated explicitly and then asserted against the repaired source like every other fix.
"""
import json
import sys
from pathlib import Path

ROOT = Path(r"C:\Users\Light\Desktop\claude\health expert")
sys.path.insert(0, str(ROOT / "tools" / "frontface"))
from apply_wave2 import EDITS  # noqa: E402

WORK = ROOT / "tools/frontface/work"
BOOKS = ROOT / "eden/corpus/books"

FILE = {
    "epigenetics": "epigenetics.txt",
    "rare-earths": "rare-earths-forbidden-cures.txt",
    "lets-play-doctor": "lets-play-doctor-fourth-edition-1995.txt",
    "immortality": "immortality.txt",
    "hells-kitchen": "hk.txt",
}
SHARD = {b: ROOT / f"eden/corpus/claims/claims-{b}.json" for b in FILE}

OVERRIDES = {
    # verbatim is a SUB-SPAN of the three-line region restoration, so replaying that edit cannot
    # match. The restored middle line is the one the page prints and our text had lost entirely.
    "WAL-CLM-EPIGEN-000096":
        "In humans, manic depression, clinical depression, \u201cbi-polar\u201d disease\n"
        "\u201cDr. Jekyll/Mr. Hyde\u201d and \u201cBad Seed\u201d behavior, hyperactivity, ADD, ADHD and\n"
        "autism are hallmarks of Li deficiency.",
}

PAIRS = {}
for fn, old, new, n, claim, why in EDITS:
    PAIRS.setdefault(fn, []).append((old, new))


def correct(v, fn):
    for old, new in PAIRS.get(fn, []):
        v = v.replace(old, new)
    return v


import re  # noqa: E402


def skel(s):
    return re.sub(r"[^A-Za-z0-9]", "", s)


def main():
    rc = 0
    for book, fn in FILE.items():
        text = (BOOKS / fn).read_text(encoding="utf-8")
        tskel = skel(text)
        claims = json.loads(SHARD[book].read_text(encoding="utf-8"))["claims"]

        # (b) extent re-cuts staged earlier
        extent = {}
        ep = WORK / f"extentfix-{book}.json"
        if ep.exists():
            extent = json.loads(ep.read_text(encoding="utf-8"))

        fixes, bad = dict(extent), []
        for c in claims:
            cid, v = c["id"], c["verbatim"]
            if cid in fixes:
                continue
            if cid in OVERRIDES:
                fixes[cid] = OVERRIDES[cid]
                continue
            if v in text:
                continue                        # resnap relocates it itself
            if tskel.count(skel(v)) == 1:
                continue                        # resnap heals a whitespace/hyphen-only change
            nv = correct(v, fn)
            if nv == v:
                bad.append((cid, "no edit applies and the verbatim is no longer present"))
            elif nv not in text:
                bad.append((cid, "corrected verbatim is still not a substring"))
            else:
                fixes[cid] = nv

        # every fix, from EITHER source, must be a byte-exact substring of the repaired book
        for cid, nv in list(fixes.items()):
            if nv not in text:
                bad.append((cid, "staged fix is not a substring of the corrected source"))

        if fixes:
            p = WORK / f"fixes2-{book}.json"
            p.write_text(json.dumps(fixes, indent=1, ensure_ascii=False), encoding="utf-8")
            print(f"  {book:18s} {len(fixes):3d} corrected verbatims "
                  f"({len(extent)} extent re-cut, {len(fixes)-len(extent)} letter) -> {p.name}")
        else:
            print(f"  {book:18s}   0 needing --fix")
        if bad:
            print(f"     UNRESOLVED in {book}:")
            for cid, why in bad:
                print(f"       {cid}  {why}")
            rc = 1
    if rc == 0:
        print("\nevery corrected verbatim verified as a byte-exact substring of its corrected source")
    return rc


sys.exit(main())
