"""Apply wave-2's page-verified corrections to the sealed book sources.

Same transactional shape as apply_wave1: assert every occurrence count, assert every post-condition,
write nothing if anything fails. Run with --dry-run first.

PROVENANCE. 212 claims (140 page groups) read by 16 independent readers under a whole-verbatim
contract; every claimed defect re-rendered and attacked by a separate skeptic. 4 of 35 proposals
were REFUTED and are absent — including two readers who both claimed a word space in
'of cervical' that a third proved absent by measuring the column ink profile.

★ THE THREE-LINE REGION RESTORATION (EPIGEN-000096) is the only edit here that ADDS content, which
is the highest-risk edit type, so it carries the most evidence: read independently THREE times
(reader at 12x, skeptic at 24-30x, and once more at 8x before writing). epigenetics Screenshot(629)
prints one unbroken justified paragraph; our .txt lost THREE separate runs from it and left blank-line
scars plus a stray '*' where they went. The surrounding region is badly damaged besides — the
right-column serial-killer table has bled into the prose as garbage ('Saton Strangler', '707-35 Kile',
'ageuepen es', a trailing 'Minos') — and that garbage is DELIBERATELY NOT touched here: no claim
quotes it, and cleaning a bled-in table is a structural repair, not a line fix.

NOT HERE: the four CLAIM-EXTENT defects (a verbatim re-cut, applied via corpus_resnap --fix from
build_extent_fixes.py) and the 25 OURS_ALREADY_CORRECTED findings (nothing to change — they are
logged as unlogged divergences).
"""
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(r"C:\Users\Light\Desktop\claude\health expert")
BOOKS = ROOT / "eden/corpus/books"
DRY = "--dry-run" in sys.argv

EP = "epigenetics.txt"
IM = "immortality.txt"
LP = "lets-play-doctor-fourth-edition-1995.txt"
RE_ = "rare-earths-forbidden-cures.txt"

DAMAGED = (
    "exceed $1 billion in sales by 1995 as a result of allopathic doctors generating\n\n\n"
    "Animal studies show that a deficiency of Li results in reproductive failure,\n\n*\n\n"
    "problems. In humans, manic depression, clinical depression, \u201cbi-polar\u201d disease\n\n\n"
    "autism are hallmarks of Li deficiency."
)
RESTORED = (
    "exceed $1 billion in sales by 1995 as a result of allopathic doctors generating\n"
    "650,000 prescriptions of the drug per month!\n\n"
    "Animal studies show that a deficiency of Li results in reproductive failure,\n"
    "infertility, reduced growth rate, shortened life expectancy and serious behavioral\n"
    "problems. In humans, manic depression, clinical depression, \u201cbi-polar\u201d disease\n"
    "\u201cDr. Jekyll/Mr. Hyde\u201d and \u201cBad Seed\u201d behavior, hyperactivity, ADD, ADHD and\n"
    "autism are hallmarks of Li deficiency."
)

# (file, old, new, expected_count, claim, why)
EDITS = [
    # ---------- the region restoration ----------
    (EP, DAMAGED, RESTORED, 1, "EPIGEN-000096",
     "THREE whole typeset lines dropped by OCR from one justified paragraph, plus a stray '*' where "
     "the second went. Read 3x independently (12x, 24-30x, 8x). Restores content, changes no meaning"),

    # ---------- destroyed subscripts ----------
    (EP, "Vitamin Bg, originally designated B3,", "Vitamin B6, originally designated B3,", 1,
     "EPIGEN-000255", "subscript 6 read as the letter g; page-read at 8x. NOTE the identical token "
     "'Bg,' means B5 forty lines earlier ('Pantothenic acid, aka vitamin Bg,') — never batch-replace this"),
    (EP, "common sources of B,2.", "common sources of B12.", 1, "EPIGEN-000267 (1 of 2)",
     "subscript 12 split by a comma; page-read at 8x, the page prints B-subscript-12"),
    (EP, "forms\nof By, in meat", "forms\nof B12 in meat", 1, "EPIGEN-000267 (2 of 2)",
     "subscript 12 read as the letters 'y,'; same page, same read"),
    (IM, "Pantothenic acid or vitamin B. is part of coenzyme A,",
     "Pantothenic acid or vitamin B5 is part of coenzyme A,", 1, "IMMORT-000299",
     "subscript 5 read as a period"),
    (IM, "lithium oxide (Li,O)", "lithium oxide (Li2O)", 1, "IMMORT-000364 (subscript)",
     "subscript 2 read as a comma"),

    # ---------- dropped / spurious spaces ----------
    (IM, "Lithiumisanextremely reactive metal. Itreacts vigorously",
     "Lithium is an extremely reactive metal. It reacts vigorously", 1, "IMMORT-000364 (spaces)",
     "four spaces dropped by tight justification"),
    (IM, "can result ina fatty liver. Asa component", "can result in a fatty liver. As a component", 1,
     "IMMORT-000334", "two dropped spaces"),
    (IM, "and _ paresthesia", "and paresthesia", 1, "IMMORT-000328",
     "a stray underscore and space where the page has a plain word space"),
    (IM, "sore tongue or \u201c beef tongue.\u201d", "sore tongue or \u201cbeef tongue.\u201d", 1, "IMMORT-000298",
     "spurious space after the opening quote"),
    (IM, "Divers use helium/ oxygen", "Divers use helium/oxygen", 1, "IMMORT-000157",
     "spurious space after the slash"),
    (RE_, "Hf - Hafniumis found in igneous rocks", "Hf - Hafnium is found in igneous rocks", 1,
     "RARE-000291", "dropped space"),
    (LP, "EMERGENCY\nROOMSTAT!!!", "EMERGENCY\nROOM STAT!!!", 1, "LETS-000358",
     "the word space between ROOM and STAT crushed to zero by justification"),
    (LP, "deficiencies (i.e. , calcium, magnesium", "deficiencies (i.e., calcium, magnesium", 1,
     "LETS-000495", "spurious space before the comma"),
    (LP, "per day, calcium and magnesium at 2,000 mg\nand 1 ,000 mg per day",
     "per day, calcium and magnesium at 2,000 mg\nand 1,000 mg per day", 1, "LETS-000427",
     "spurious space inside the number. ONE of eleven such occurrences; only this one is page-read"),

    # ---------- letter/word garbles ----------
    (LP, "upper respiratory\nvinises.", "upper respiratory\nviruses.", 1, "LETS-000303",
     "ru read as ni"),
    (LP, "the result of B-l (Beri-Beri)", "the result of B-1 (Beri-Beri)", 1, "LETS-000377",
     "digit 1 read as lowercase l"),
    (LP, "1.5 % H202 as Oxy Toddy", "1.5 % H2O2 as Oxy Toddy", 1, "LETS-000345",
     "capital O read as a zero in a chemical formula"),
    (EP, "acid (S-HIAA).", "acid (5-HIAA).", 1, "EPIGEN-000198 + EPIGEN-000451",
     "digit 5 read as capital S; our own next sentence already writes 5-HIAA correctly. ONE span, TWO claims"),
    (EP, "\u201cKing\u201d (.e., pork chops", "\u201cKing\u201d (i.e., pork chops", 1, "EPIGEN-000168",
     "the i of i.e. dropped"),
    (EP, "Dietary nitrates (e.g,, deli slices", "Dietary nitrates (e.g., deli slices", 1, "EPIGEN-000160",
     "period read as a comma in 'e.g.'"),
    (EP, "Bioflavonoids deficiency can result in:", "Bioflavonoid deficiency can result in:", 1,
     "EPIGEN-000046", "spurious plural"),
    (RE_, "Cl - chlorine is found in igneous rocks", "Cl - Chlorine is found in igneous rocks", 1,
     "RARE-000373", "element name capitalised on the page, matching every sibling entry in the series"),

    # ---------- EPIGEN-000322: two defects in one claim ----------
    # NOTE the anchor carries the trailing newlines on purpose: 'vegetables and frui' matches TWICE
    # in this book, the second time inside a correctly-spelled 'fruit'. A bare-token replace would
    # have corrupted the good one. The reader caught the same thing ("a regex NOT followed by 't'").
    (EP, "vegetables and frui\n\n\n", "vegetables and fruit.\n\n\n", 1, "EPIGEN-000322 (1 of 2)",
     "our text cut its own final word: the page prints 'vegetables and fruit.' as the last line of "
     "the paragraph, unhyphenated, and 'frui' is not a word"),
    (EP, "\u201csalt hunger\u201d dates back", "\u201cSalt hunger\u201d dates back", 1, "EPIGEN-000322 (2 of 2)",
     "paragraph-opening capital: the page prints '\u201cSalt hunger\u201d', read at 16x"),

    # ---------- punctuation / quote glyphs ----------
    (EP, "Cramps & twitches (Tourette's syndrome", "Cramps & twitches (Tourette\u2019s syndrome", 1,
     "EPIGEN-000061", "curly apostrophe flattened to ASCII"),
    (EP, "Dr. Jekyll/Mr. Hyde rages (\"Bad Seeds\")", "Dr. Jekyll/Mr. Hyde rages (\u201cBad Seeds\u201d)", 1,
     "EPIGEN-000062", "curly double quotes flattened to ASCII"),
    (RE_, "Suicide\n\nAlzheimer's disease", "Suicide\n\nAlzheimer\u2019s disease", 1, "RARE-000355",
     "curly apostrophe flattened to ASCII"),
]


def main():
    texts, problems = {}, []
    for fn, old, new, n, claim, why in EDITS:
        t = texts.get(fn) or (BOOKS / fn).read_text(encoding="utf-8")
        texts[fn] = t
        c = t.count(old)
        if c != n:
            problems.append((claim, fn, old[:60], c, n))
        print(f"  {'OK  ' if c == n else 'FAIL'} {claim:30s} {fn[:14]:15s} found={c} want={n}  {old[:42]!r}")

    if problems:
        print(f"\nABORTED - {len(problems)} count mismatch(es), NOTHING written:")
        for p in problems:
            print("   ", p)
        return 1

    for fn, old, new, n, claim, why in EDITS:
        texts[fn] = texts[fn].replace(old, new, n)

    post = []
    for fn, old, new, n, claim, why in EDITS:
        if old in texts[fn] and old != new:
            post.append((claim, "old survived", old[:50]))
        if new not in texts[fn]:
            post.append((claim, "new absent", new[:50]))
    if post:
        print("\nABORTED - post-condition failed, NOTHING written:")
        for p in post:
            print("   ", p)
        return 1
    print(f"\n  post-conditions OK: {len(EDITS)} edits, every old gone, every new present")

    if DRY:
        print("\nDRY RUN - nothing written.")
        return 0

    stage_dir = Path(__file__).resolve().parent / "work"
    stage_dir.mkdir(parents=True, exist_ok=True)
    for fn, new_text in texts.items():
        stage = stage_dir / f"stage2-{fn}"
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
