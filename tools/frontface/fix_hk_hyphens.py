"""Rejoin the line-break hyphen splits inside Hell's Kitchen FRONT-FACING verbatims.

SCOPE. hk.txt carries 1650 of these overall; whole-book repair is explicitly out of this campaign's
mandate. Only the spans under front-facing quotes are touched -- exactly the treatment the other
books got (180 fixed there). Hell's Kitchen was missed because it wraps as `accom- \\npanied` with a
SPACE before the newline, and the gate's regex requires the hyphen to abut the newline; every other
book wraps tight, so the gate read 0 and the book was recorded "clean".

REJOIN VALIDITY -- the check that stops a blind strip from producing `potassiumrich`:
  join fully  the two halves concatenate into a real word (`me-`+`dium` -> medium). The hyphen was
              the typesetter's, not the word's.
  keep hyphen the concatenation is NOT a word, so the hyphen is lexical (`anti-`+`inflammatory`).
              Only the newline goes; the hyphen stays.
A word is "real" if the speller knows it OR it appears >=3 times elsewhere in the seven sealed
sources -- the corpus's own vocabulary, which is what keeps domain terms from being mangled.
"""
import json, re, sys, subprocess, os
from pathlib import Path
from collections import Counter

ROOT = Path(r"C:\Users\Light\Desktop\claude\health expert")
HK = ROOT / "eden/corpus/books/hk.txt"
# Working data lives in tools/frontface/work/ (gitignored) so generated analysis never lands
# in a commit. Repointed from the session scratchpad 2026-08-02.
WORK = Path(__file__).resolve().parent / "work"
WORK.mkdir(parents=True, exist_ok=True)
SP = WORK
DRY = "--dry-run" in sys.argv

from spellchecker import SpellChecker
SPELL = SpellChecker()

vocab = Counter()
for p in (ROOT / "eden/corpus/books").glob("*.txt"):
    for w in re.findall(r"[A-Za-z]{3,}", p.read_text(encoding="utf-8")):
        vocab[w.lower()] += 1


def real_word(w):
    lw = w.lower()
    return (not SPELL.unknown([lw])) or vocab.get(lw, 0) >= 3


text = HK.read_text(encoding="utf-8")
claims = json.loads((ROOT / "eden/corpus/claims/claims-hells-kitchen.json")
                    .read_text(encoding="utf-8"))["claims"]
led = json.loads((ROOT / "chronicle/frontface-ocr/verified.json").read_text(encoding="utf-8"))
front = set(led["grandfathered"]["claim_ids"]["hells-kitchen"]) | set(led["claims_verified"])

PAT = re.compile(r"([A-Za-z]{2,})-[ \t]*\n[ \t]*([a-z]{2,})")

spans, missing = [], []
for c in claims:
    if c["id"] not in front:
        continue
    i = text.find(c["verbatim"])
    if i < 0:
        missing.append(c["id"])
        continue
    if text.find(c["verbatim"], i + 1) >= 0:
        missing.append(c["id"] + " (ambiguous: verbatim occurs more than once)")
        continue
    spans.append((i, i + len(c["verbatim"]), c["id"]))

edits, join_n, keep_n = [], 0, 0
for lo, hi, cid in spans:
    for m in PAT.finditer(text, lo, hi):
        a, b = m.group(1), m.group(2)
        if real_word(a + b):
            new, kind = a + b, "join"
            join_n += 1
        else:
            new, kind = f"{a}-{b}", "keep-hyphen"
            keep_n += 1
        edits.append((m.start(), m.end(), new, kind, cid, m.group(0)))

# de-duplicate overlapping spans (a claim's text can be quoted by two claims)
edits = sorted({(s, e, n, k, c, o) for s, e, n, k, c, o in edits}, key=lambda x: -x[0])
seen, uniq = set(), []
for s, e, n, k, c, o in edits:
    if s in seen:
        continue
    seen.add(s)
    uniq.append((s, e, n, k, c, o))

print(f"front-facing hells-kitchen claims located : {len(spans)}")
if missing:
    print(f"NOT LOCATED (skipped, reported not hidden): {missing}")
print(f"splits to rejoin fully                    : {join_n}")
print(f"splits keeping a lexical hyphen           : {keep_n}")
print(f"distinct edits                            : {len(uniq)}")
print()
for s, e, n, k, c, o in sorted(uniq, key=lambda x: x[0])[:18]:
    print(f"   {c[8:]:18s} {k:11s} {o!r:26s} -> {n!r}")
if len(uniq) > 18:
    print(f"   ... {len(uniq) - 18} more")

if DRY:
    print("\nDRY RUN - nothing written.")
    sys.exit(0)

out = text
for s, e, n, k, c, o in uniq:          # descending offsets: earlier edits keep their positions
    out = out[:s] + n + out[e:]
stage = SP / "stage-hk.txt"
stage.write_text(out, encoding="utf-8", newline="\n")
r = subprocess.run([sys.executable, str(ROOT / "tools/safe_write.py"), "rewrite", str(HK),
                    "--payload-file", str(stage)], capture_output=True, text=True,
                   env={**os.environ, "PYTHONUTF8": "1"})
print(r.stdout.strip() or r.stderr.strip())
sys.exit(r.returncode)
