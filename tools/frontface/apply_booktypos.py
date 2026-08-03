"""Apply the BOOK-TYPO class: places where the PAGE carries a clear typo and our text faithfully
reproduces it. Sanctioned by Luneth's 2026-08-02 ruling — "what we DO fix is when there's a clear
typo or error ... these fixes should be noted for my review" — so these are decided here and LOGGED,
not escalated one by one.

WHY THE WHOLE CLASS AND NOT JUST THE FLAGGED CLAIMS. The page-read waves flagged 12 claims, but the
same typos sit in other places the waves never looked. Each correction below is corroborated by the
CORPUS'S OWN correct usage elsewhere, which is stronger evidence than a single page read:
    Blue Zones        21 correct   vs  1 "Blues Zones"
    Humphry Davy       7 correct   vs  8 "Humphrey Davy"    (Sir Humphry Davy, the chemist)
    Blepharisma        1 correct   vs  5 "Blepherisma"      (rare-earths spells it BOTH ways)
    ilmenite           1 correct   vs  1 "ilemnite"
    Tinnitus           2 correct   vs  3 "Tinnitis"
    Meniere            1 correct   vs  1 "Meneire"
    phosphatidyl       7 correct   vs  2 "phosphytidyl" + 2 "phosphatydil"
"lightening rod" has NO correct instance anywhere (5 occurrences, 4 books) and is fixed on the plain
meaning: a lightning rod conducts lightning; "lightening" means making lighter.

★ THE Bl -> B1 CLASS IS THE ONE THAT NEEDED THE MOST CARE, because the sibling classes have taught
exactly how this goes wrong: a bare "B," is BORON in a mineral list, "Bi, Ca, Li" is BISMUTH, and the
same "Bg," token is B5 in one sentence and B6 in another. So all 17 dddl occurrences were enumerated
and read in context BEFORE writing: every one sits beside its own chemical name ("the vitamins
thiamine (Bl)"), its own disease ("Bl (i.e. beriberi)"), or other B-numbers ("Bl, B2, B3, B5, and
B6"). There is no vitamin "Bl" and no competing real token spelled Bl in this domain, so the
word-bounded replace is safe HERE and the count is asserted at exactly 17.

★ dddl-3e-2011 IS IN books_verified ("audited-pristine"). Editing it means that audit missed a
class. Recorded in the ledger rather than quietly patched.
"""
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(r"C:\Users\Light\Desktop\claude\health expert")
BOOKS = ROOT / "eden/corpus/books"
DRY = "--dry-run" in sys.argv

DD = "dddl-third-edition-2011.txt"
EP = "epigenetics.txt"
IM = "immortality.txt"
LP = "lets-play-doctor-fourth-edition-1995.txt"
RE_ = "rare-earths-forbidden-cures.txt"
HK = "hk.txt"

# (file, old, new, expected_count, why)
EDITS = [
    # --- proper nouns ---
    (IM, "Blues Zones", "Blue Zones", 1, "the book itself writes 'Blue Zones' 21 times"),
    (IM, "Walter\nNodack", "Walter\nNoddack", 1,
     "Walter Noddack, who co-discovered rhenium in 1925 with Ida Tacke and Otto Berg"),
    (IM, "constellation Cassiopia", "constellation Cassiopeia", 1,
     "the constellation is Cassiopeia; the element name 'cassiopium' in the same sentence is the "
     "correct historical name for lutetium and is left alone"),
    (EP, "Humphrey Davy", "Humphry Davy", 2, "Sir Humphry Davy; the corpus writes it correctly 7 times"),
    (IM, "Humphrey Davy", "Humphry Davy", 2, "same"),
    (RE_, "Humphrey Davy", "Humphry Davy", 2, "same"),
    (HK, "Humphrey Davy", "Humphry Davy", 2, "same"),

    # --- technical / taxonomic terms ---
    (DD, "Blepherisma", "Blepharisma", 1, "the ciliate genus Blepharisma; rare-earths spells it correctly once"),
    (EP, "Blepherisma", "Blepharisma", 1, "same"),
    (IM, "Blepherisma", "Blepharisma", 2, "same"),
    (RE_, "Blepherisma", "Blepharisma", 1, "same"),
    (IM, "ilemnite", "ilmenite", 1, "the titanium ore ilmenite; rare-earths spells it correctly"),
    (DD, "Tinnitis", "Tinnitus", 1, "tinnitus; dddl and iaiyh both spell it correctly elsewhere"),
    (IM, "Tinnitis", "Tinnitus", 2, "same"),
    (IM, "Meneire", "Meniere", 1, "Meniere's disease; iaiyh spells it correctly"),
    (EP, "polyphos-hoinositides", "polyphosphoinositides", 1,
     "polyphosphoinositides -- the 'p' was read as 'h' and a hyphen inserted at the break"),
    (DD, "phosphytidyl", "phosphatidyl", 1, "phosphatidyl choline; the corpus writes it correctly 7 times"),
    (LP, "phosphytidyl", "phosphatidyl", 1, "same"),
    (DD, "phosphatydil", "phosphatidyl", 1, "same"),
    (LP, "phosphatydil", "phosphatidyl", 1, "same"),

    # --- botanical Latin ---
    (DD, "Cassia aqutifolia", "Cassia acutifolia", 1, "senna, Cassia acutifolia"),
    (LP, "Cassia aqutifolia", "Cassia acutifolia", 1, "same"),
    (DD, "Linum ustatissimum", "Linum usitatissimum", 1, "flax, Linum usitatissimum"),
    (LP, "Linum ustatissimum", "Linum usitatissimum", 1, "same"),
    (DD, "Rhamnus fragula", "Rhamnus frangula", 1, "alder buckthorn, Rhamnus frangula"),
    (LP, "Rhamnus fragula", "Rhamnus frangula", 1, "same"),

    # --- plain-meaning ---
    (DD, "lightening rod", "lightning rod", 1, "a lightning rod conducts lightning; no correct instance exists anywhere in the corpus"),
    (HK, "lightening rod", "lightning rod", 1, "same"),
    (IM, "lightening rod", "lightning rod", 2, "same"),
    (RE_, "lightening rod", "lightning rod", 1, "same"),

    # --- a DOSE, corroborated by the same book's own standard EFA dose ---
    (LP, "salmon and flaxseed oils at 5 mg each t.i.d.",
     "salmon and flaxseed oils at 5 gm each t.i.d.", 1,
     "LETS-000388: 5 mg of oil is not a dose; this book's own standard EFA line is 'essential fatty "
     "acids at 5 gm t.i.d.' (LETS-000280) and 'acids are 5 gm q.i.d.' (LETS-000245). Same class as "
     "the ratified cartilage '5 gm' divergence"),
]

# The Bl -> B1 class: a word-bounded pattern, not a literal, with its count asserted.
BL = (DD, re.compile(r"\bBl\b"), "B1", 17,
      "every one of the 17 sits beside thiamine, beriberi, or other B-numbers; there is no vitamin 'Bl'")


def main():
    texts, problems = {}, []
    for fn, old, new, n, why in EDITS:
        t = texts.get(fn) or (BOOKS / fn).read_text(encoding="utf-8")
        texts[fn] = t
        c = t.count(old)
        if c != n:
            problems.append((fn, old, c, n))
        print(f"  {'OK  ' if c == n else 'FAIL'} {fn[:14]:15s} {old[:34]!r:38s} -> {new[:26]!r:30s} found={c} want={n}")

    fn, pat, rep, n, why = BL
    t = texts.get(fn) or (BOOKS / fn).read_text(encoding="utf-8")
    texts[fn] = t
    hits = len(pat.findall(t))
    if hits != n:
        problems.append((fn, "\\bBl\\b", hits, n))
    print(f"  {'OK  ' if hits == n else 'FAIL'} {fn[:14]:15s} {'\\\\bBl\\\\b (pattern)':38s} -> {'B1':30s} found={hits} want={n}")

    if problems:
        print(f"\nABORTED - {len(problems)} count mismatch(es), NOTHING written:")
        for p in problems:
            print("   ", p)
        return 1

    for fn, old, new, n, why in EDITS:
        texts[fn] = texts[fn].replace(old, new, n)
    texts[BL[0]] = BL[1].sub(BL[2], texts[BL[0]])

    post = []
    for fn, old, new, n, why in EDITS:
        if old in texts[fn]:
            post.append((fn, "old survived", old[:40]))
        if new not in texts[fn]:
            post.append((fn, "new absent", new[:40]))
    if BL[1].search(texts[BL[0]]):
        post.append((BL[0], "Bl survived", ""))
    if post:
        print("\nABORTED - post-condition failed, NOTHING written:")
        for p in post:
            print("   ", p)
        return 1
    print(f"\n  post-conditions OK: {len(EDITS)} literal edits + 17 pattern edits, every old gone")

    if DRY:
        print("\nDRY RUN - nothing written.")
        return 0

    stage_dir = Path(__file__).resolve().parent / "work"
    stage_dir.mkdir(parents=True, exist_ok=True)
    for fn, new_text in texts.items():
        stage = stage_dir / f"stage3-{fn}"
        stage.write_text(new_text, encoding="utf-8", newline="\n")
        r = subprocess.run([sys.executable, str(ROOT / "tools/safe_write.py"), "rewrite",
                            str(BOOKS / fn), "--payload-file", str(stage)],
                           capture_output=True, text=True,
                           env={**os.environ, "PYTHONUTF8": "1"})
        print(r.stdout.strip() or r.stderr.strip())
        if r.returncode != 0:
            return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
