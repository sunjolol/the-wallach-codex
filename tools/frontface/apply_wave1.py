"""Apply wave-1's page-verified corrections to the sealed book sources.

Transactional shape (write-discipline rule 5): compute every new file content, ASSERT the expected
occurrence count for each edit, and only then hand each file to safe_write. If ANY assertion fails,
nothing is written -- a partial batch across four books is far worse than no batch.
Run with --dry-run first.

PROVENANCE. 213 claims (141 page groups) were page-read by 16 independent readers, and every claimed
defect was then re-rendered and attacked by a separate skeptic instructed to default to "refuted"
when glyphs were unclear. Only proposals that SURVIVED that attack are here. Two were refuted and are
absent (IMMORT-000017, LETS-000140).

★ EVERY `old` IS A WINDOW FROM THE CLAIM'S OWN VERBATIM, widened until unique in the file.
A bare-token replace would be wrong here and this batch proves why: `1 ,000 mg` occurs ELEVEN times
in Let's Play Doctor, and only ONE of them (LETS-000289's) has been read against its page. The other
ten stay untouched and are reported as a measured, unread class.

WHAT IS DELIBERATELY NOT HERE:
  - IMMORT-000197 (KrF2 / KrF4). Luneth ruled 2026-08-02: OUR KrF2 stands, the printed KrF4 is a
    compositor error. It goes to ratified-divergences.json, NOT to a source edit.
  - The 41 "ours already holds the correction" findings. Our text already diverges from the page
    deliberately; those are LOGGED, not changed.
  - Four CLAIM-EXTENT defects that no source edit can fix, because the source is correct and the
    claim's verbatim was cut wrong: EPIGEN-000124, EPIGEN-000125 and IMMORT-000230 each swallowed a
    `===== Screenshot (N) =====` page separator (those separators are legitimate transcription
    scaffolding -- 255 in immortality.txt, 466 in epigenetics.txt -- so editing the .txt would be
    the wrong repair), and LETS-000278's verbatim stops two characters short of the page's
    `pepper (Piper nigrum).`. These need a verbatim re-cut and are held for a separate batch.
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

# (file, old, new, expected_count, claim, why)
EDITS = [
    # ---------- dropped / spurious spaces ----------
    (IM, "Ekeberg, aSwedish chemist", "Ekeberg, a Swedish chemist", 1, "IMMORT-000453",
     "dropped space; at 14x the a|Swedish gap measures 4px against <=3px for every letter gap on that line"),
    (LP, "seleniumat 200 mcg", "selenium at 200 mcg", 1, "LETS-000280", "dropped space"),
    (IM, "in air w hen it is cut", "in air when it is cut", 1, "IMMORT-000421", "spurious space inside 'when'"),
    (LP, "urine therapy,zinc at 50 mg", "urine therapy, zinc at 50 mg", 1, "LETS-000284",
     "dropped space after a comma"),
    (LP, "(i.e. , con-tracting", "(i.e., con-tracting", 1, "LETS-000316", "spurious space before a comma"),
    (LP, "acids are 5 gm q. i. d. ,PABA at 200 mg", "acids are 5 gm q.i.d., PABA at 200 mg", 1,
     "LETS-000245", "spurious spaces inside q.i.d. and a dropped space after the comma"),
    (LP, "growing pains includes calcium\nand magnesium at 2,000 mg and 1 ,000 mg per",
     "growing pains includes calcium\nand magnesium at 2,000 mg and 1,000 mg per", 1, "LETS-000289",
     "spurious space inside the number. ONLY this occurrence is page-read; 10 siblings are left alone"),
    (LP, "essential fatty acids 5\ngm t.i.d. and vitamin E at 800-1 ,200 IU per day.",
     "essential fatty acids 5\ngm t.i.d. and vitamin E at 800-1,200 IU per day.", 1, "LETS-000169",
     "spurious space inside the number"),
    (IM, "tissue (i.e. - blood", "tissue (i.e.- blood", 1, "IMMORT-000014", "spurious space before a hyphen"),
    (IM, "(apple/ blueberry)", "(apple/blueberry)", 1, "IMMORT-000263", "spurious space after a slash"),
    (IM, "(ZrSiO,). Itis found ina variety", "(ZrSiO4). It is found in a variety", 1, "IMMORT-000458",
     "destroyed subscript 4 plus two dropped spaces"),
    (LP, "oral andIVH202; 200\nmg vitamin B-l t.i.d.", "oral and IV H2O2; 200\nmg vitamin B-1 t.i.d.", 1,
     "LETS-000130", "two dropped spaces, a capital O read as a zero, and a B-1 read as B-l"),

    # ---------- letter garbles ----------
    (LP, "to include peppennint (Mentha piperita)", "to include peppermint (Mentha piperita)", 1,
     "LETS-000296", "rm read as nn"),
    (LP, "55 gallon dnim", "55 gallon drum", 1, "LETS-000315", "ru read as n"),
    (LP, "Prevention is always\ntetter than", "Prevention is always\nbetter than", 1, "LETS-000317",
     "b read as t"),
    (RE_, "stomach acid (HC]) for protein digestion", "stomach acid (HCl) for protein digestion", 1,
     "RARE-000113", "lowercase l read as a closing bracket"),
    (RE_, "Beryllium Hydrogen\nBoron lodine", "Beryllium Hydrogen\nBoron Iodine", 1, "RARE-000372",
     "capital I read as lowercase l -- there is no element 'lodine'. Same class as the ratified Gl->GI fix"),
    (LP, "tolerance, nitin at 20-50 mg", "tolerance, rutin at 20-50 mg", 1, "LETS-000286",
     "ru read as n -- rutin, the bioflavonoid"),
    (EP, "Infertility (.e., failure to ovulate", "Infertility (i.e., failure to ovulate", 1,
     "EPIGEN-000099", "the i of i.e. dropped"),
    (RE_, "Tb -terbium is found in igneous rock", "Tb -Terbium is found in igneous rock", 1,
     "RARE-000298", "element name capitalised on the page, matching every sibling entry in the series"),

    # ---------- destroyed subscripts ----------
    (IM, "silicon dioxide (SiO,).", "silicon dioxide (SiO2).", 1, "IMMORT-000399",
     "subscript 2 read as a comma. Invisible to subscript_damage, whose formula clause is a hard-coded CO|H|SO|NO"),
    (EP, "two active forms: D, the plant source and D; the animal source",
     "two active forms: D2 the plant source and D3 the animal source", 1, "EPIGEN-000220",
     "subscripts 2 and 3 read as a comma and a semicolon"),
    (IM, "recognize that vitamin D, is important", "recognize that vitamin D3 is important", 1,
     "IMMORT-000289 (1 of 2)", "subscript 3 read as a comma"),
    (IM, "deficiencies of\nvitamin D, in adults", "deficiencies of\nvitamin D3 in adults", 1,
     "IMMORT-000289 (2 of 2)", "subscript 3 read as a comma -- the SAME token twice in one claim"),
    (EP, "will not work, and By, cobalt is not absorbed", "will not work, and B12 cobalt is not absorbed", 1,
     "EPIGEN-000323 (1 of 2)", "subscript 12 read as the letters 'y,'"),
    (EP, "frequently give By, shots", "frequently give B12 shots", 1, "EPIGEN-000323 (2 of 2)",
     "subscript 12 read as the letters 'y,' -- the SAME token twice in one claim"),

    # ---------- dropped words ----------
    (IM, "fat deficiencies, high fiber diets", "fat deficiencies, extremely high fiber diets", 1,
     "IMMORT-000284", "'extremely' dropped by OCR"),
    (IM, "pollution, etc.) supplement with", "pollution, preservatives, etc.) should supplement with", 1,
     "IMMORT-000265", "'preservatives,' and 'should' dropped by OCR"),
    (IM, "In 1924, Bloch, showed that", "In 1924, Bloch, a Danish investigator, showed that", 1,
     "IMMORT-000286", "'a Danish investigator,' dropped by OCR"),
    (IM, "food additives are known\n\n\u201cgoitrogens\u201d", "food additives are known as\n\n\u201cgoitrogens\u201d", 1,
     "IMMORT-000184 + IMMORT-000230", "'as' dropped by OCR -- one source span, quoted by two claims"),
    (IM, "Stimulates the active, intestinal\n\nabsorption of calcium.\n\nenergy requiring\n\nStimulates",
     "Stimulates the active, energy requiring intestinal\n\nabsorption of calcium.\n\nStimulates", 1,
     "IMMORT-000287", "column-order artifact: 'energy requiring' belongs inside the first bullet"),

    # ---------- numbers ----------
    (EP, "(accumulates up\nto 0.3 ppm in bone, teeth and liver)",
     "(accumulates up\nto 1.3 ppm in bone, teeth and liver)", 1, "EPIGEN-000443", "1 read as 0"),
    (IM, "Germans just\nprior to WWI to antidote", "Germans just\nprior to WWII to antidote", 1,
     "IMMORT-000266", "the page prints WWII; our text dropped an I"),
    (EP, "in the late 34 century BC", "in the late 3rd century BC", 1, "EPIGEN-000278",
     "a superscript 'rd' read as the digit 4"),

    # ---------- punctuation / quote glyphs ----------
    (EP, "the name \u201caluminum\u2019 to the metal of clay", "the name \u201caluminum\u201d to the metal of clay", 1,
     "EPIGEN-000406", "closing double quote read as a right single quote"),
    (IM, "the green color of the element's", "the green color of the element\u2019s", 1, "IMMORT-000432",
     "curly apostrophe flattened to ASCII"),
    (IM, "cancer,\nAlzheimer's disease and other dementias",
     "cancer,\nAlzheimer\u2019s disease and other dementias", 1, "IMMORT-000243",
     "curly apostrophe flattened to ASCII"),
    (EP, "PMS\n\nSeborrheic dermatitis,\n\nItchy scaly skin", "PMS\n\nSeborrheic dermatitis\n\nItchy scaly skin",
     1, "EPIGEN-000108", "spurious trailing comma on a list item"),

    # ---------- multi-fault spans ----------
    (EP,
     "Cholesterol?\nwhile not generally considered a classic essential pd, its deficiency does result "
     "in disease states (e..,\nAlzheimer\u2019s disease, type 2 diabetes, erectile dysfunction, low-T, "
     "menopause, adrenal exhaustion, etc).",
     "Cholesterol*\n*While not generally considered a classic essential lipid, its deficiency does result "
     "in disease states (e.g.,\nAlzheimer\u2019s disease, type 2 diabetes, erectile dysfunction, low-T, "
     "menopause, adrenal exhaustion, etc.).",
     1, "EPIGEN-000151",
     "footnote asterisk read as '?', 'lipid' read as 'pd', 'e.g.' read as 'e..', missing final period"),
    (EP,
     "INA: The FDA restricts the amount of potassium in supplements to 99 mg. Murray, MT. and Pizzorno, J:",
     "NA: The FDA restricts the amount of potassium in supplements to 99 mg. Murray, M.T. and Pizzorno, J.:",
     1, "EPIGEN-000137 + -000138 + -000139",
     "a stray leading I on the footnote marker, and dropped periods in two author initials. ONE source span, THREE claims"),
    (LP,
     "diets, folic acid at 1 5-25 mg per day, vitamin A\nat 300,000 IUper day as beta carotene, lecithin\n"
     "at 2,500 mg t.i.d. with meals, flaxseed oil at one\ntbsp. bid., vitamin E at 800-1 ,200 IU per day,",
     "diets, folic acid at 15-25 mg per day, vitamin A\nat 300,000 IU per day as beta carotene, lecithin\n"
     "at 2,500 mg t.i.d. with meals, flaxseed oil at one\ntbsp. b.i.d., vitamin E at 800-1,200 IU per day,",
     1, "LETS-000409",
     "four dropped/spurious spaces in a dose line: '1 5-25', 'IUper', 'bid.', '800-1 ,200'"),
]


def main():
    texts, problems = {}, []
    for fn, old, new, n, claim, why in EDITS:
        t = texts.get(fn) or (BOOKS / fn).read_text(encoding="utf-8")
        texts[fn] = t
        c = t.count(old)
        if c != n:
            problems.append((claim, fn, old, c, n))
        print(f"  {'OK  ' if c == n else 'FAIL'} {claim:32s} {fn[:14]:15s} found={c} want={n}  {old[:44]!r}")

    if problems:
        print(f"\nABORTED - {len(problems)} occurrence-count mismatch(es), NOTHING written:")
        for p in problems:
            print("   ", p)
        return 1

    for fn, old, new, n, claim, why in EDITS:
        texts[fn] = texts[fn].replace(old, new, n)

    # post-condition: every `old` is gone and every `new` is present
    post = []
    for fn, old, new, n, claim, why in EDITS:
        if old in texts[fn] and old != new:
            post.append((claim, "old string survived", old[:50]))
        if new not in texts[fn]:
            post.append((claim, "new string absent", new[:50]))
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
        stage = stage_dir / f"stage-{fn}"
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
