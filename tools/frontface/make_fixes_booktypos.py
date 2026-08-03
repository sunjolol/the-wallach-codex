"""Build corpus_resnap --fix payloads for the book-typo batch.

Replays apply_booktypos.EDITS (and its `\\bBl\\b` PATTERN edit) against each claim's own verbatim
rather than retyping them, then asserts each result is a byte-exact substring of the corrected source.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(r"C:\Users\Light\Desktop\claude\health expert")
sys.path.insert(0, str(ROOT / "tools" / "frontface"))
from apply_booktypos import EDITS, BL  # noqa: E402

WORK = ROOT / "tools/frontface/work"
BOOKS = ROOT / "eden/corpus/books"

FILE = {
    "dddl-3e-2011": "dddl-third-edition-2011.txt",
    "epigenetics": "epigenetics.txt",
    "rare-earths": "rare-earths-forbidden-cures.txt",
    "lets-play-doctor": "lets-play-doctor-fourth-edition-1995.txt",
    "immortality": "immortality.txt",
    "hells-kitchen": "hk.txt",
    "iaiyh": "iaiyh.txt",
}

PAIRS = {}
for fn, old, new, n, why in EDITS:
    PAIRS.setdefault(fn, []).append((old, new))


def correct(v, fn):
    for old, new in PAIRS.get(fn, []):
        v = v.replace(old, new)
    if fn == BL[0]:
        v = BL[1].sub(BL[2], v)
    return v


def skel(s):
    return re.sub(r"[^A-Za-z0-9]", "", s)


rc = 0
for book, fn in FILE.items():
    shard = ROOT / f"eden/corpus/claims/claims-{book}.json"
    if not shard.exists():
        continue
    text = (BOOKS / fn).read_text(encoding="utf-8")
    tskel = skel(text)
    claims = json.loads(shard.read_text(encoding="utf-8"))["claims"]
    fixes, bad = {}, []
    for c in claims:
        v = c["verbatim"]
        if v in text:
            continue
        if tskel.count(skel(v)) == 1:
            continue
        nv = correct(v, fn)
        if nv == v:
            bad.append((c["id"], "no edit applies and the verbatim is no longer present"))
        elif nv not in text:
            bad.append((c["id"], "corrected verbatim is still not a substring"))
        else:
            fixes[c["id"]] = nv
    if fixes:
        p = WORK / f"fixes4-{book}.json"
        p.write_text(json.dumps(fixes, indent=1, ensure_ascii=False), encoding="utf-8")
        print(f"  {book:20s} {len(fixes):3d} corrected verbatims -> {p.name}")
    else:
        print(f"  {book:20s}   0 needing --fix")
    if bad:
        print(f"     UNRESOLVED in {book}:")
        for cid, why in bad:
            print(f"       {cid}  {why}")
        rc = 1

if rc == 0:
    print("\nevery corrected verbatim verified as a byte-exact substring of its corrected source")
sys.exit(rc)
