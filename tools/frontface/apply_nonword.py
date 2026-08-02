"""Apply the wave-3 non-word findings: 18 OCR garbles in our text + 21 typos the PAGE itself carries.

Both kinds get corrected. The project's standing ruling is that book typos are fixed uniformly,
INCLUDING inside the verbatim -- "we are NOT changing the spirit or facts of ANYTHING he says --
we correct grammar/spelling/mistakes to MORE ACCURATELY represent his REAL stance". The BOOK_TYPO
set is listed separately in pending_review so Luneth can reverse any of them in his sweep.

Anchoring: every edit is located through the CLAIM'S OWN VERBATIM (a byte-exact substring of the
.txt), widened until unique. A bare token replace would be wrong -- `uncers` and `ofdiarrhea` each
occur twice, and in the `ofdiarrhea` case the two occurrences DISAGREE: printed p... prints
"of diarrhea" with a space and the other prints it run together. They were read separately.
"""
import json, sys, subprocess, os
from pathlib import Path

ROOT = Path(r"C:\Users\Light\Desktop\claude\health expert")
# Working data lives in tools/frontface/work/ (gitignored) so generated analysis never lands
# in a commit. Repointed from the session scratchpad 2026-08-02.
WORK = Path(__file__).resolve().parent / "work"
WORK.mkdir(parents=True, exist_ok=True)
SP = WORK
BOOKS = ROOT / "eden/corpus/books"
DRY = "--dry-run" in sys.argv
FILE = {"EPIGEN": "epigenetics.txt", "IMMORT": "immortality.txt",
        "RARE": "rare-earths-forbidden-cures.txt",
        "LETS": "lets-play-doctor-fourth-edition-1995.txt", "HELLS": "hk.txt"}

# (claim_id, our_token, replacement, kind)
EDITS = [
    # ---- 18 OCR garbles in OUR text, each page-read and skeptic-confirmed ----
    ("WAL-CLM-LETS-000461", "nignim", "nigrum", "ocr"),
    ("WAL-CLM-LETS-000404", "rosemaiy", "rosemary", "ocr"),
    ("WAL-CLM-LETS-000510", "ofdiarrhea", "of diarrhea", "ocr"),
    ("WAL-CLM-LETS-000510", "ircegular", "irregular", "ocr"),
    ("WAL-CLM-LETS-000326", "ofjoint", "of joint", "ocr"),
    ("WAL-CLM-LETS-000511", "anested", "arrested", "ocr"),
    ("WAL-CLM-LETS-000458", "sadva", "sativa", "ocr"),
    # NOT a space -- our text holds "en\nhanced". The page prints "en-" / "hanced" across the line
    # break, so our OCR dropped the HYPHEN as well as joining nothing. That makes it invisible to
    # _FF_MID_WORD_HYPHEN, which requires a hyphen to be there: a hyphen-LESS line-break split.
    ("WAL-CLM-LETS-000406", "en\nhanced", "enhanced", "ocr"),
    ("WAL-CLM-LETS-000390", "conect", "correct", "ocr"),
    ("WAL-CLM-LETS-000362", "conecting", "correcting", "ocr"),
    ("WAL-CLM-LETS-000370", "nibbed", "rubbed", "ocr"),
    ("WAL-CLM-LETS-000370", "B-l ", "B-1 ", "ocr"),
    ("WAL-CLM-LETS-000515", "yourbones", "your bones", "ocr"),
    ("WAL-CLM-LETS-000515", "3- 1-4.5", "3.1-4.5", "ocr"),
    ("WAL-CLM-LETS-000398", "dietaiy", "dietary", "ocr"),
    ("WAL-CLM-LETS-000274", "mnning", "running", "ocr"),
    ("WAL-CLM-LETS-000513", "ofceliac", "of celiac", "ocr"),
    ("WAL-CLM-LETS-000177", "toothbnish", "toothbrush", "ocr"),
    # ---- typos the PAGE carries; corrected under the uniform-correction ruling ----
    ("WAL-CLM-EPIGEN-000227", "uncers", "ulcers", "book"),
    ("WAL-CLM-EPIGEN-000325", "uncers", "ulcers", "book"),
    ("WAL-CLM-IMMORT-000361", "Cobalite", "Cobaltite", "book"),
    ("WAL-CLM-EPIGEN-000085", "gadolium", "gadolinium", "book"),
    ("WAL-CLM-EPIGEN-000247", "metablyte", "metabolite", "book"),
    ("WAL-CLM-EPIGEN-000353", "metablyte", "metabolite", "book"),
    ("WAL-CLM-EPIGEN-000059", "chonic", "chronic", "book"),
    ("WAL-CLM-EPIGEN-000059", "acnea", "acne", "book"),
    ("WAL-CLM-LETS-000010", "vitaligo", "vitiligo", "book"),
    ("WAL-CLM-RARE-000385", "constituant", "constituent", "book"),
    ("WAL-CLM-RARE-000328", "causitive", "causative", "book"),
    ("WAL-CLM-RARE-000300", "watre", "water", "book"),
    ("WAL-CLM-IMMORT-000382", "catechens", "catechins", "book"),
    ("WAL-CLM-LETS-000407", "thewarm", "the warm", "book"),
    ("WAL-CLM-LETS-000479", "longivity", "longevity", "book"),
    ("WAL-CLM-LETS-000479", "surviability", "survivability", "book"),
    ("WAL-CLM-EPIGEN-000011", "soley", "solely", "book"),
    ("WAL-CLM-LETS-000463", "salacylic", "salicylic", "book"),
    ("WAL-CLM-LETS-000181", "forall", "for all", "book"),
    ("WAL-CLM-RARE-000395", "borytes", "barytes", "book"),
    ("WAL-CLM-RARE-000317", "menapause", "menopause", "book"),
    ("WAL-CLM-LETS-000223", "Leo nurus", "Leonurus", "book"),
    # A JUDGMENT CALL, flagged rather than buried: the page for this one really does print
    # "ofdiarrhea" run together (unlike LETS-000510's, 400 chars away, which has the space). Tight
    # justification squeezed the word space to nothing. Corrected as a typesetting artifact, since
    # "typical ofdiarrhea" is not a word of Wallach's -- listed in pending_review for reversal.
    ("WAL-CLM-LETS-000516", "ofdiarrhea", "of diarrhea", "judgment"),
]

claims = {}
for p in (ROOT / "eden/corpus/claims").glob("claims-*.json"):
    for c in json.loads(p.read_text(encoding="utf-8"))["claims"]:
        claims[c["id"]] = c["verbatim"]

texts, plan, problems = {}, [], []
for cid, tok, rep, kind in EDITS:
    fn = FILE[cid.split("-")[2]]
    if fn not in texts:
        texts[fn] = BOOKS.joinpath(fn).read_text(encoding="utf-8")
    vb = claims.get(cid)
    if vb is None:
        problems.append((cid, tok, "claim not found"))
        continue
    i = vb.find(tok)
    if i < 0:
        problems.append((cid, tok, "token not in this claim's verbatim"))
        continue
    for pad in (25, 45, 80, 140, 240, 400):
        lo, hi = max(0, i - pad), min(len(vb), i + len(tok) + pad)
        old = vb[lo:hi]
        if texts[fn].count(old) == 1:
            break
    else:
        problems.append((cid, tok, "no unique anchor"))
        continue
    plan.append((fn, old, old.replace(tok, rep, 1), cid, tok, rep, kind))

print(f"planned {len(plan)} edits "
      f"({sum(1 for p in plan if p[6]=='ocr')} ocr / "
      f"{sum(1 for p in plan if p[6]=='book')} book-typo / "
      f"{sum(1 for p in plan if p[6]=='judgment')} judgment)")
for fn, old, new, cid, tok, rep, kind in plan:
    print(f"  {kind:8s} {cid[8:]:20s} {tok!r:16s} -> {rep!r}")
if problems:
    print("\nPROBLEMS (reported, not skipped silently):")
    for x in problems:
        print("   ", x)
if DRY:
    print("\nDRY RUN - nothing written.")
    sys.exit(0)
if problems:
    print("\nABORTED - nothing written.")
    sys.exit(1)

applied, shared = 0, []
for fn, old, new, cid, tok, rep, kind in plan:
    n = texts[fn].count(old)
    if n == 1:
        texts[fn] = texts[fn].replace(old, new, 1)
        applied += 1
    elif n == 0 and texts[fn].count(new) >= 1:
        shared.append(cid)          # two claims quoting one span; already corrected
    else:
        print(f"ABORT: {cid} anchor matches {n} and the correction is absent")
        sys.exit(1)
print(f"  applied {applied}; shared-span already covered: {shared}")

for fn, t in texts.items():
    stage = SP / f"stage4-{fn}"
    stage.write_text(t, encoding="utf-8", newline="\n")
    r = subprocess.run([sys.executable, str(ROOT / "tools/safe_write.py"), "rewrite",
                        str(BOOKS / fn), "--payload-file", str(stage)],
                       capture_output=True, text=True, env={**os.environ, "PYTHONUTF8": "1"})
    print(r.stdout.strip() or r.stderr.strip())
    if r.returncode != 0:
        sys.exit(1)
