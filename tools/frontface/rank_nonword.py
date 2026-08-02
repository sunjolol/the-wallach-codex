"""Rank the SHARED_NONWORD bucket down to a readable candidate list.

The bucket is 248 hits / 177 claims and most of it is LEGITIMATE. Two large innocent families have
to be recognised or the list is unusable -- the same trap that made a bare vocabulary detector
return 387 near-useless candidates once before:

  ETYMOLOGY   these books constantly explain element names: 'the Greek word barys', 'the Arabic word
              buraq', 'the Latin coesius', 'named ignosco'. The foreign token is CORRECT and is
              usually quoted or introduced by a naming phrase.
  SCIENCE     -ase / -in / -ins / -ation / -yl / -oid morphology: kinases, auxins, lipoxins, astacin,
              acylation, hexaphosphate. Real terms the speller lacks.

What survives is ranked by how GARBLE-SHAPED it is: the speller's correction is one edit away, and
the correction is a word that actually occurs elsewhere in these same books (so the fix is the
book's own vocabulary, not an outside guess).
"""
import json, re
from pathlib import Path
from collections import Counter

# Working data lives in tools/frontface/work/ (gitignored) so generated analysis never lands
# in a commit. Repointed from the session scratchpad 2026-08-02.
WORK = Path(__file__).resolve().parent / "work"
WORK.mkdir(parents=True, exist_ok=True)
SP = WORK
ROOT = Path(r"C:\Users\Light\Desktop\claude\health expert")
rows = json.loads((SP / "nonword-triage.json").read_text(encoding="utf-8"))["SHARED_NONWORD"]

from spellchecker import SpellChecker
SPELL = SpellChecker()

vocab = Counter()
for p in (ROOT / "eden/corpus/books").glob("*.txt"):
    for w in re.findall(r"[A-Za-z]{3,}", p.read_text(encoding="utf-8")):
        vocab[w.lower()] += 1

NAMING = re.compile(
    r"(Greek|Latin|Arabic|Persian|Sanskrit|German|Anglo|Saxon|Spanish|French|Italian|Hebrew)"
    r"|\bword\b|\bnamed?\b|\bnaming\b|derived from|translated|means?\s|\bterm\b|\bcalled\b",
    re.I)
SCIENCE = re.compile(r"(ase|ases|in|ins|ation|ations|yl|oid|oids|ose|ol|ols|emia|osis|itis)$", re.I)


def lev(a, b, cap=2):
    if abs(len(a) - len(b)) > cap:
        return cap + 1
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


spared = Counter()
cands = []
for h in rows:
    tok = h["token"]
    t = re.sub(r"[^A-Za-z]", "", tok).lower()
    if len(t) < 4:
        spared["too-short"] += 1
        continue
    # quoted or introduced by a naming phrase -> an etymology term the book is explaining
    ctx = h["ctx"]
    i = ctx.find(tok)
    window = ctx[max(0, i - 60):i]
    quoted = ctx[max(0, i - 2):i].strip().endswith(("\u201c", '"', "\u2018", "'"))
    if quoted or NAMING.search(window):
        spared["etymology-or-naming"] += 1
        continue
    if SCIENCE.search(t) and vocab.get(t, 0) >= 1:
        spared["scientific-morphology"] += 1
        continue
    sug = SPELL.correction(t)
    if not sug or sug == t:
        spared["no-near-word"] += 1
        continue
    d = lev(t, sug)
    if d > 2:
        spared["correction-too-far"] += 1
        continue
    # the correction should be a word THESE BOOKS use -- keeps the fix inside their own vocabulary
    in_books = vocab.get(sug, 0)
    cands.append((d, -in_books, tok, sug, in_books, h["id"], h["ctx"]))

cands.sort()
print("SPARED, with the reason each rests on:")
for k, v in spared.most_common():
    print(f"   {k:24s} {v:4d}")
print(f"   {'TOTAL SPARED':24s} {sum(spared.values()):4d}")
print(f"\nCANDIDATES: {len(cands)} hits in {len({c[5] for c in cands})} claims\n")
print(f"{'claim':22s}{'ours':22s}{'-> likely':20s}{'in books':>9s}  context")
for d, nb, tok, sug, inb, cid, ctx in cands:
    print(f"  {cid[8:]:20s}{tok!r:22s}{sug!r:20s}{inb:9d}  ...{ctx[:56]}")

json.dump([{"id": c[5], "token": c[2], "suggestion": c[3], "book_freq_of_suggestion": c[4],
            "edit": c[0], "ctx": c[6]} for c in cands],
          open(SP / "nonword-candidates.json", "w", encoding="utf-8"), indent=1)
