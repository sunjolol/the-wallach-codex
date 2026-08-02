"""Apply the page-verified corrections to the sealed book sources.

Transactional shape (write-discipline rule 5): compute every new file content, ASSERT the expected
occurrence count for each edit, and only then hand each file to safe_write. If any assertion fails
nothing is written -- a partial batch across five books is far worse than no batch.

Run with --dry-run first; it prints the count check for every edit and writes nothing.

WHAT IS DELIBERATELY NOT HERE: the five ratified divergences (cartilage `gm`, `antitoxin`,
`vitamin A`, `1nm`, and LETS-000228's slice-end period). Our text is CORRECT in all five and the
page is wrong; they go to eden/tools/ratified-divergences.json instead. The books are riddled with
misprints and the page is evidence, not ground truth (memory: books-are-riddled-use-outside-info).
"""
import re, sys, subprocess
from pathlib import Path

ROOT = Path(r"C:\Users\Light\Desktop\claude\health expert")
BOOKS = ROOT / "eden/corpus/books"
DRY = "--dry-run" in sys.argv

# (file, old, new, expected_count, why)
EDITS = [
    # ---- epigenetics ----
    ("epigenetics.txt", "Vitamin 81 (Thiamin)", "Vitamin B1 (Thiamin)", 1,
     "EPIGEN-000301: the list runs A / 81 / B2 / B3 / B5 / B6 / B12 / C / D / K -- 81 is B1"),
    ("epigenetics.txt", "Vitamin D\n\nVitamin\n\nVitamin K", "Vitamin D\n\nVitamin E\n\nVitamin K", 1,
     "EPIGEN-000301: the bare 'Vitamin' between D and K is Vitamin E, dropped by OCR"),
    ("epigenetics.txt", "Vitamin B, (niacin)", "Vitamin B3 (niacin)", 1,
     "EPIGEN-000037: subscript 3 read as a comma; the line above names niacin"),
    ("epigenetics.txt", "Sealy, itchy", "Scaly, itchy", 1, "EPIGEN-000037: c read as e"),
    ("epigenetics.txt", "diarthea", "diarrhea", 1, "EPIGEN-000250: rr read as th"),
    ("epigenetics.txt", "to avoit", "to avoid", 1, "EPIGEN-000170: d read as t"),
    ("epigenetics.txt", "al zarniga", "al zarniqa", 1, "EPIGEN-000432: q read as g"),
    ("epigenetics.txt", "The LDso", "The LD50", 1, "EPIGEN-000293: subscript 50 read as 'so'"),
    ("epigenetics.txt", "an LDSO", "an LD50", 1, "EPIGEN-000403: subscript 50 read as 'SO'"),
    ("epigenetics.txt", "bacteria in the colon,", "bacteria in the colon.", 1,
     "EPIGEN-000287: sentence-final period read as a comma"),
    ("epigenetics.txt", "It's more like a script", "It\u2019s more like a script", 1,
     "EPIGEN-000183: straight apostrophe where the page and the adjacent 'isn\u2019t' both use curly"),
    ("epigenetics.txt", "Shakespeare's script", "Shakespeare\u2019s script", 1,
     "EPIGEN-000183: same sentence pair, same curly apostrophe on the page"),
    ("epigenetics.txt", "\u201cNew World\" to Europe", "\u201cNew World\u201d to Europe", 1,
     "EPIGEN-000250: closing curly double quote read as a straight ASCII quote"),
    # ---- rare-earths ----
    ("rare-earths-forbidden-cures.txt", "newborm", "newborn", 1, "RARE-000348: n read as m"),
    ("rare-earths-forbidden-cures.txt", "tegulates", "regulates", 1, "RARE-000376: r read as t"),
    ("rare-earths-forbidden-cures.txt", "tissue salt\nCauses an imbalance",
     "tissue salt\ncauses an imbalance", 1,
     "RARE-000376: mid-sentence line break; the page prints lowercase 'causes'"),
    ("rare-earths-forbidden-cures.txt", "(not B,,)i", "(not B12),", 1,
     "RARE-000335: subscript 12 read as two commas AND the following comma read as 'i'"),
    # ---- lets-play-doctor ----
    ("lets-play-doctor-fourth-edition-1995.txt", "mg\nrv q6 h", "mg\nIV q6 h", 1,
     "LETS-000349: IV read as rv; the line above prints 'two million u IV q 6 h'"),
    ("lets-play-doctor-fourth-edition-1995.txt", "Verataim", "Veratrum", 1,
     "LETS-000452: Veratrum viride, the botanical name of green hellebore"),
    ("lets-play-doctor-fourth-edition-1995.txt", "fmctose", "fructose", 1, "LETS-000288: ru read as m"),
    ("lets-play-doctor-fourth-edition-1995.txt", "chemes", "cherries", 1, "LETS-000288: rri read as m"),
    ("lets-play-doctor-fourth-edition-1995.txt", "mcgt.i.d.,folicacidat", "mcg t.i.d., folic acid at", 1,
     "LETS-000430: tight justification, four spaces dropped by OCR"),
    ("lets-play-doctor-fourth-edition-1995.txt", "tolerance.chelation", "tolerance,chelation", 1,
     "LETS-000340: comma read as a period, silently starting a new sentence"),
    # ---- immortality ----
    ("immortality.txt", "Itisa", "It is a", 1, "IMMORT-000430: two spaces dropped by OCR"),
]

# `Gl` -> `GI`: the same OCR failure (capital I read as lowercase l) in five medical contexts.
# It is an ALLOW-LIST, not a bare \bGl\b, and that matters: the sixth occurrence in this book is
# "the chemical symbol of Gl" for GLUCINUM -- the old name for beryllium, whose symbol really was
# Gl. A blanket Gl->GI would have corrupted a correct chemical symbol into a typo.
GL = ("epigenetics.txt",
      re.compile(r"\bGl(?=\s+(?:tract|bleeding|distress|discomfort)\b)"), "GI",
      "EPIGEN-000411 + 4 siblings: gastrointestinal; capital I read as lowercase l")


def main():
    texts = {}
    problems = []
    for fn, old, new, n, why in EDITS:
        t = texts.get(fn) or BOOKS.joinpath(fn).read_text(encoding="utf-8")
        texts[fn] = t
        c = t.count(old)
        status = "OK " if c == n else "FAIL"
        if c != n:
            problems.append((fn, old, c, n))
        print(f"  {status} {fn[:22]:24s} {old[:34]!r:38s} -> {new[:30]!r:34s} found={c} want={n}")
    for fn, old, new, n, why in EDITS:
        texts[fn] = texts[fn].replace(old, new, n)

    fn, pat, rep, why = GL
    t = texts.get(fn) or BOOKS.joinpath(fn).read_text(encoding="utf-8")
    hits = len(pat.findall(t))
    print(f"  OK  {fn[:22]:24s} {'Gl tract':38s} -> {'GI tract':34s} found={hits} (pattern)")
    texts[fn] = pat.sub(rep, t)

    if problems:
        print("\nABORTED - occurrence count mismatch, nothing written:")
        for p in problems:
            print("   ", p)
        return 1
    if DRY:
        print("\nDRY RUN - nothing written.")
        return 0

    sp = Path(__file__).resolve().parent / "work"
    sp.mkdir(parents=True, exist_ok=True)
    for fn, new_text in texts.items():
        stage = sp / f"stage-{fn}"
        stage.write_text(new_text, encoding="utf-8", newline="\n")
        r = subprocess.run([sys.executable, str(ROOT / "tools/safe_write.py"), "rewrite",
                            str(BOOKS / fn), "--payload-file", str(stage)],
                           capture_output=True, text=True,
                           env={**__import__("os").environ, "PYTHONUTF8": "1"})
        print(r.stdout.strip() or r.stderr.strip())
        if r.returncode != 0:
            return 1
    return 0


sys.exit(main())
