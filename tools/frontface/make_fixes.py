"""Build the --fix payloads corpus_resnap needs for the claims whose LETTERS changed.

resnap can relocate a claim whose bytes only moved, and heal one whose whitespace/hyphens changed,
but a claim whose letters were corrected inside its span is reported BROKEN and must be handed the
corrected verbatim explicitly. That is the intended path, not a workaround.

The corrected verbatim is derived by applying the SAME edit list to the claim's current verbatim,
then ASSERTING the result is a byte-exact substring of the corrected .txt. If it is not, the fix is
not emitted -- resnap would reject it anyway, and a silently wrong verbatim is exactly what this
whole campaign exists to prevent.
"""
import json, re, sys, subprocess, os
from pathlib import Path

ROOT = Path(r"C:\Users\Light\Desktop\claude\health expert")
# Working data lives in tools/frontface/work/ (gitignored) so generated analysis never lands
# in a commit. Repointed from the session scratchpad 2026-08-02.
WORK = Path(__file__).resolve().parent / "work"
WORK.mkdir(parents=True, exist_ok=True)
SP = WORK
BOOKS = ROOT / "eden/corpus/books"

FILE = {
    "epigenetics": "epigenetics.txt",
    "rare-earths": "rare-earths-forbidden-cures.txt",
    "lets-play-doctor": "lets-play-doctor-fourth-edition-1995.txt",
    "immortality": "immortality.txt",
    "hells-kitchen": "hk.txt",
}
SHARD = {b: ROOT / f"eden/corpus/claims/claims-{b}.json" for b in FILE}

LITERAL = [
    ("Vitamin 81 (Thiamin)", "Vitamin B1 (Thiamin)"),
    ("Vitamin D\n\nVitamin\n\nVitamin K", "Vitamin D\n\nVitamin E\n\nVitamin K"),
    ("Vitamin B, (niacin)", "Vitamin B3 (niacin)"),
    ("Sealy, itchy", "Scaly, itchy"),
    ("diarthea", "diarrhea"),
    ("to avoit", "to avoid"),
    ("al zarniga", "al zarniqa"),
    ("The LDso", "The LD50"),
    ("an LDSO", "an LD50"),
    ("bacteria in the colon,", "bacteria in the colon."),
    ("It's more like a script", "It\u2019s more like a script"),
    ("Shakespeare's script", "Shakespeare\u2019s script"),
    ("\u201cNew World\" to Europe", "\u201cNew World\u201d to Europe"),
    ("newborm", "newborn"),
    ("tegulates", "regulates"),
    ("tissue salt\nCauses an imbalance", "tissue salt\ncauses an imbalance"),
    ("(not B,,)i", "(not B12),"),
    ("mg\nrv q6 h", "mg\nIV q6 h"),
    ("Verataim", "Veratrum"),
    ("fmctose", "fructose"),
    ("chemes", "cherries"),
    ("mcgt.i.d.,folicacidat", "mcg t.i.d., folic acid at"),
    ("tolerance.chelation", "tolerance,chelation"),
    ("Itisa", "It is a"),
]
GL = re.compile(r"\bGl(?=\s+(?:tract|bleeding|distress|discomfort)\b)")


def correct(v):
    for old, new in LITERAL:
        v = v.replace(old, new)
    return GL.sub("GI", v)


def main():
    written = {}
    skel = lambda s: re.sub(r"[^A-Za-z0-9]", "", s)
    for book, fn in FILE.items():
        text = (BOOKS / fn).read_text(encoding="utf-8")
        tskel = skel(text)
        claims = json.loads(SHARD[book].read_text(encoding="utf-8"))["claims"]
        fixes, bad = {}, []
        for c in claims:
            v = c["verbatim"]
            if v in text:
                continue                       # resnap can relocate this one itself
            # resnap's own BROKEN criterion: it HEALS a claim whose letters-only skeleton still
            # matches uniquely (whitespace/hyphen changed, letters did not). Only a claim failing
            # that test needs an explicit corrected verbatim. Hell's Kitchen's 52 rejoined hyphens
            # all heal, which is why they must NOT be handed a --fix.
            sv = skel(v)
            if tskel.count(sv) == 1:
                continue
            nv = correct(v)
            if nv == v:
                bad.append((c["id"], "no edit applies and the verbatim is no longer present"))
            elif nv not in text:
                bad.append((c["id"], "corrected verbatim is still not a substring"))
            else:
                fixes[c["id"]] = nv
        if bad:
            print(f"  {book}: UNRESOLVED -> {bad}")
        if fixes:
            p = SP / f"fixes-{book}.json"
            p.write_text(json.dumps(fixes, indent=1, ensure_ascii=False), encoding="utf-8")
            written[book] = (p, len(fixes))
            print(f"  {book:18s} {len(fixes):3d} corrected verbatims -> {p.name}")
        else:
            print(f"  {book:18s}   0 needing --fix")
        if bad:
            return 1
    print("\nall corrected verbatims verified as byte-exact substrings of their corrected source")
    return 0


sys.exit(main())
