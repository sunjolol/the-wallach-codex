"""Apply wave-3's page-verified corrections: the sibling occurrences waves 1 and 2 left unread.

★ THE POINT OF THIS FILE IS WHAT IT DOES *NOT* TOUCH. The sources hold 6 `Tourette's`, 23
`Alzheimer's` and 19 `1 ,000` — and only TEN of those were read against a page. Every edit below is
anchored on its own claim's surrounding words, so the 38 unread occurrences stay exactly as they are.
Bulk-replacing the token would be indefensible: this corpus already contains a pair (`ofdiarrhea`)
where two occurrences of an identical token DISAGREE with each other, and a measurement taken before
this wave found NO apostrophe convention to lean on (lets-play-doctor 100% ASCII, dddl 100% curly,
epigenetics 68% ASCII, rare-earths 40% — mixed inside the same book).

WHAT THE WAVE PROVED, and it is why these are trusted: the verifiers did not eyeball the glyphs, they
MEASURED them — per-row ink-centroid drift, with a null control (true vertical stems on the same line
drift 0.00px), a synthetic control across three sans faces (U+0027 drifts 0.00; U+2019 drifts
0.58-1.17), and a positive control against a known curly quote elsewhere on the same page. The
disputed marks drift ~0.9px with a 5.8:1 ink taper — matching the page's own curly quotes row for row.

NOT HERE — WAL-CLM-RARE-000237 `Tourette's`. Its reader called it a defect; the skeptic REFUTED that
to UNREADABLE, proving page 317 uses curly DOUBLE quotes but that the scan cannot resolve the single
quote, and separately that the PDF text layer is worthless as evidence (0 occurrences of U+2019 /
U+201C / U+201D across all 348 pages against 1,400 ASCII apostrophes — it flattens everything).
An honest unreadable is left alone.
"""
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(r"C:\Users\Light\Desktop\claude\health expert")
BOOKS = ROOT / "eden/corpus/books"
DRY = "--dry-run" in sys.argv

EP = "epigenetics.txt"
LP = "lets-play-doctor-fourth-edition-1995.txt"
CURLY = "\u2019"

EDITS = [
    # ---- apostrophes: 2 of 6 Tourette's, 4 of 23 Alzheimer's ----
    (EP, "Facial tics, Tourette's syndrome", f"Facial tics, Tourette{CURLY}s syndrome", 1,
     "EPIGEN-000032", "measured drift +0.91px, ink 309->87; matches this page's own closing curly quote to 0.02px"),
    (EP, "Head tic (Tourette's syndrome)", f"Head tic (Tourette{CURLY}s syndrome)", 1,
     "EPIGEN-000108", "same measurement method, judged on its own page"),
    (EP, "Prevention\nof Alzheimer's has been documented",
     f"Prevention\nof Alzheimer{CURLY}s has been documented", 1, "EPIGEN-000016", "page prints curly"),
    (EP, "Alzheimer's disease\nAnemia (hemolytic)", f"Alzheimer{CURLY}s disease\nAnemia (hemolytic)", 1,
     "EPIGEN-000033", "page prints curly"),
    (EP, "Kidney hemorrhage\nAlzheimer's disease, dementia",
     f"Kidney hemorrhage\nAlzheimer{CURLY}s disease, dementia", 1, "EPIGEN-000044",
     "drift -0.905px monotonic, matching the same line's comma to 0.05px at every row"),
    (EP, "reduces the risk of Alzheimer's disease, hypertrophic",
     f"reduces the risk of Alzheimer{CURLY}s disease, hypertrophic", 1, "EPIGEN-000280",
     "page prints curly"),

    # ---- the side finding the wave turned up while reading EPIGEN-000032 ----
    (EP, "\u201cbone to bone\" arthritis", "\u201cbone to bone\u201d arthritis", 1, "EPIGEN-000032 (2nd defect)",
     "our text opens curly and closes with a STRAIGHT double quote; the page prints a MATCHED curly "
     "pair — the closing mark measures drift +0.91/+0.74, ink 312->87, statistically identical to the "
     "page's confirmed curly closing double quote"),

    # ---- spurious space inside a number: 4 of 19 ----
    (LP, "magnesium at 2,000 mg and 1 ,000 mg per day\nand B-6 at 50 mg",
     "magnesium at 2,000 mg and 1,000 mg per day\nand B-6 at 50 mg", 1, "LETS-000174", "page prints 1,000"),
    (LP, "magnesium at 2,000 mg and 1 ,000 mg per day\nand herbs to include",
     "magnesium at 2,000 mg and 1,000 mg per day\nand herbs to include", 1, "LETS-000223", "page prints 1,000"),
    (LP, "and magnesium at 2,000 and 1 ,000 mg per day\n(don't forget",
     "and magnesium at 2,000 and 1,000 mg per day\n(don't forget", 1, "LETS-000238", "page prints 1,000"),
    (LP, "magnesium at 2,000 mg and 1 ,000 mg per day\n(or more for the fir",
     "magnesium at 2,000 mg and 1,000 mg per day\n(or more for the fir", 1, "LETS-000391", "page prints 1,000"),

    # ---- a straggler the post-fix self-scan caught, same class as wave 1's LETS-000409 ----
    (LP, "vitamin A at 300,000\nIUper day as beta carotene",
     "vitamin A at 300,000\nIU per day as beta carotene", 1, "LETS-000410",
     "dropped space; the identical defect was page-read and fixed in LETS-000409 during wave 1, and "
     "this is the only remaining IUper/mgper/mcgper occurrence in the whole corpus"),
]


def main():
    texts, problems = {}, []
    for fn, old, new, n, claim, why in EDITS:
        t = texts.get(fn) or (BOOKS / fn).read_text(encoding="utf-8")
        texts[fn] = t
        c = t.count(old)
        if c != n:
            problems.append((claim, fn, old[:50], c, n))
        print(f"  {'OK  ' if c == n else 'FAIL'} {claim:26s} {fn[:14]:15s} found={c} want={n}  {old[:44]!r}")
    if problems:
        print(f"\nABORTED - {len(problems)} count mismatch(es), NOTHING written:")
        for p in problems:
            print("   ", p)
        return 1

    for fn, old, new, n, claim, why in EDITS:
        texts[fn] = texts[fn].replace(old, new, n)

    post = []
    for fn, old, new, n, claim, why in EDITS:
        if old in texts[fn]:
            post.append((claim, "old survived", old[:44]))
        if new not in texts[fn]:
            post.append((claim, "new absent", new[:44]))
    if post:
        print("\nABORTED - post-condition failed, NOTHING written:")
        for p in post:
            print("   ", p)
        return 1

    # ★ the guard that matters: the UNREAD siblings must be untouched
    left = {"Tourette's in epigenetics": texts[EP].count("Tourette's"),
            "Alzheimer's in epigenetics": texts[EP].count("Alzheimer's"),
            "1 ,000 in lets-play-doctor": texts[LP].count("1 ,000")}
    want = {"Tourette's in epigenetics": 4, "Alzheimer's in epigenetics": 19,
            "1 ,000 in lets-play-doctor": 15}
    print(f"\n  post-conditions OK: {len(EDITS)} edits")
    for k, v in left.items():
        flag = "OK  " if v == want[k] else "FAIL"
        print(f"  {flag} UNREAD siblings left intact — {k}: {v} (want {want[k]})")
    if left != want:
        print("\nABORTED - the unread-sibling count changed, NOTHING written.")
        return 1

    if DRY:
        print("\nDRY RUN - nothing written.")
        return 0

    stage_dir = Path(__file__).resolve().parent / "work"
    stage_dir.mkdir(parents=True, exist_ok=True)
    for fn, new_text in texts.items():
        stage = stage_dir / f"stage4-{fn}"
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
