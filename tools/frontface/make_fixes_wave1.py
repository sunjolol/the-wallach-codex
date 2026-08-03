"""Build the --fix payloads corpus_resnap needs for wave-1's corrected claims.

resnap can RELOCATE a claim whose bytes merely moved, and HEAL one whose whitespace or hyphens
changed, but a claim whose LETTERS were corrected inside its span is reported BROKEN and must be
handed the corrected verbatim explicitly. That is the intended path, not a workaround.

★ The edit pairs are IMPORTED from apply_wave1.EDITS rather than retyped. Re-transcribing 41 edits
into a second list is exactly how the two halves of a fix drift apart, and a silently wrong verbatim
is the thing this campaign exists to prevent. Each corrected verbatim is then ASSERTED to be a
byte-exact substring of the corrected .txt; if it is not, nothing is emitted for that book.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(r"C:\Users\Light\Desktop\claude\health expert")
sys.path.insert(0, str(ROOT / "tools" / "frontface"))
from apply_wave1 import EDITS  # noqa: E402

WORK = ROOT / "tools/frontface/work"
WORK.mkdir(parents=True, exist_ok=True)
BOOKS = ROOT / "eden/corpus/books"

FILE = {
    "epigenetics": "epigenetics.txt",
    "rare-earths": "rare-earths-forbidden-cures.txt",
    "lets-play-doctor": "lets-play-doctor-fourth-edition-1995.txt",
    "immortality": "immortality.txt",
    "hells-kitchen": "hk.txt",
}
SHARD = {b: ROOT / f"eden/corpus/claims/claims-{b}.json" for b in FILE}

# A claim whose verbatim ENDS INSIDE one of the edit windows cannot be corrected by replaying that
# edit against it -- the window's tail is simply not there to match. EPIGEN-000151 stops at "etc)"
# while the edit window runs through "etc).". Rather than widen the source edit (which would change
# what was page-verified), the corrected verbatim is stated explicitly and then asserted to be a
# byte-exact substring of the corrected .txt by the same check every other fix passes.
OVERRIDES = {
    "WAL-CLM-EPIGEN-000151":
        "Cholesterol*\n*While not generally considered a classic essential lipid, its deficiency does "
        "result in disease states (e.g.,\nAlzheimer\u2019s disease, type 2 diabetes, erectile dysfunction, "
        "low-T, menopause, adrenal exhaustion, etc.)",
}

# old -> new, in the order they were applied, restricted to the file each belongs to
PAIRS = {}
for fn, old, new, n, claim, why in EDITS:
    PAIRS.setdefault(fn, []).append((old, new))


def correct(v, fn):
    for old, new in PAIRS.get(fn, []):
        v = v.replace(old, new)
    return v


def skel(s):
    return re.sub(r"[^A-Za-z0-9]", "", s)


def main():
    rc = 0
    for book, fn in FILE.items():
        text = (BOOKS / fn).read_text(encoding="utf-8")
        tskel = skel(text)
        claims = json.loads(SHARD[book].read_text(encoding="utf-8"))["claims"]
        fixes, bad = {}, []
        for c in claims:
            v = c["verbatim"]
            if v in text:
                continue                        # resnap relocates this one itself
            sv = skel(v)
            if tskel.count(sv) == 1:
                continue                        # resnap heals a whitespace/hyphen-only change
            nv = OVERRIDES.get(c["id"]) or correct(v, fn)
            if nv == v:
                bad.append((c["id"], "no edit applies and the verbatim is no longer present"))
            elif nv not in text:
                bad.append((c["id"], "corrected verbatim is still not a substring"))
            else:
                fixes[c["id"]] = nv
        if fixes:
            p = WORK / f"fixes-{book}.json"
            p.write_text(json.dumps(fixes, indent=1, ensure_ascii=False), encoding="utf-8")
            print(f"  {book:18s} {len(fixes):3d} corrected verbatims -> {p.name}")
        else:
            print(f"  {book:18s}   0 needing --fix")
        if bad:
            print(f"     UNRESOLVED in {book}:")
            for cid, why in bad:
                print(f"       {cid}  {why}")
            rc = 1
    if rc == 0:
        print("\nall corrected verbatims verified as byte-exact substrings of their corrected source")
    return rc


sys.exit(main())
