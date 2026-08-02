"""Two detectors that read OUR OWN verbatims and need no second opinion at all.

WHY THEY ARE NEEDED. The corroboration instrument compares our text to a second OCR of the same
scan. Its blind spot is a SHARED error -- both passes misreading the same glyph -- and the 30-claim
control sample measured that blind spot at 7/30. Four of those seven were plain garbles our own text
carries in the open: `fmctose`, `chemes`, `folicacidat`, `Itisa`. Nothing about them needs a page
image to SUSPECT; they are simply not words. So these detectors attack the exact class corroboration
cannot see, from the other side.

  SUBSCRIPT_DAMAGE  a typeset subscript digit that OCR turned into a comma, an `o`, or a lookalike
                    digit. Measured live in wave 1: `B,` (B3), `B,,` (B12), `LDso` (LD50),
                    `Vitamin 81` (Vitamin B1). This class destroys a VITAMIN IDENTITY on a surface
                    the user reads, and the blueprint listed it as something "every scanner misses"
                    -- it is in fact a sharp, cheap pattern.
  NONWORD           a token our own text carries that is not a word in English, the corpus's own
                    domain vocabulary, or the rest of the book. Ranked by rarity so real medical
                    terms sink and garbles float.

NEITHER IS TRUTH. Both produce CANDIDATES for a page read, exactly like the corroboration hunks.
A vocabulary detector run alone once returned 387 candidates that were nearly all legitimate words
(chronicle/frontface-ocr/wish-classes.md) -- which is why NONWORD is ranked and cross-checked
against the book's own text rather than reported as a defect count.
"""
import json, re, sys
from pathlib import Path
from collections import Counter

# Working data lives in tools/frontface/work/ (gitignored) so generated analysis never lands
# in a commit. Repointed from the session scratchpad 2026-08-02.
WORK = Path(__file__).resolve().parent / "work"
WORK.mkdir(parents=True, exist_ok=True)
SP = WORK
ROOT = Path(r"C:\Users\Light\Desktop\claude\health expert")

# --- subscript damage -------------------------------------------------------
# Each pattern is anchored on a context that makes the subscript unambiguous, so it does not fire on
# ordinary prose commas. `B,` alone would be far too loose; `vitamin B,` is not.
SUBSCRIPT = [
    (r"\b(?:[Vv]itamin\s+)?B\s*,{1,2}(?![0-9])", "vitamin B with its subscript digit read as comma(s)"),
    (r"\b[Vv]itamin\s+8[0-9]?\b", "vitamin B read as the digit 8"),
    (r"\bLD\s*(?:so|SO|s0|5o)\b", "LD50 with the subscript 50 read as 'so'"),
    (r"\b(?:CO|H|O|N|SO|NO)\s*,\s*(?=[A-Za-z)]|$)", "chemical formula subscript read as a comma"),
    (r"\bB\s*,\s*\)", "B-subscript inside a parenthetical"),
]

# --- non-word ---------------------------------------------------------------
from spellchecker import SpellChecker
SPELL = SpellChecker()
TOKEN = re.compile(r"[A-Za-z][A-Za-z'\-]{2,}")


def load_domain():
    """The corpus's own vocabulary: every token appearing in the sealed book sources at least
    DOMAIN_MIN times is treated as real, because a garble is rare by construction and a genuine
    medical term recurs. This is what keeps `phosphoglucomutase` out of the report."""
    vocab = Counter()
    for p in (ROOT / "eden/corpus/books").glob("*.txt"):
        for t in TOKEN.findall(p.read_text(encoding="utf-8")):
            vocab[t.lower()] += 1
    return vocab


def main():
    targets = json.loads((SP / "targets.json").read_text(encoding="utf-8"))
    vocab = load_domain()
    sub_hits, nw_hits = [], []
    for book, rows in targets.items():
        for e in rows:
            v = e["verbatim"]
            for pat, why in SUBSCRIPT:
                for m in re.finditer(pat, v):
                    s = max(0, m.start() - 45)
                    sub_hits.append({"book": book, "id": e["id"], "why": why,
                                     "hit": m.group(0),
                                     "ctx": v[s:m.end() + 45].replace("\n", " ")})
            for m in TOKEN.finditer(v):
                t = m.group(0)
                base = t.strip("-'").lower()
                if len(base) < 4 or "-" in base:
                    continue
                if not SPELL.unknown([base]):
                    continue
                if vocab.get(base, 0) >= 4:          # the book's own settled vocabulary
                    continue
                s = max(0, m.start() - 45)
                nw_hits.append({"book": book, "id": e["id"], "token": t,
                                "book_freq": vocab.get(base, 0),
                                "ctx": v[s:m.end() + 45].replace("\n", " ")})

    (SP / "selfscan.json").write_text(json.dumps(
        {"subscript": sub_hits, "nonword": nw_hits}, indent=1), encoding="utf-8")

    print(f"SUBSCRIPT_DAMAGE : {len(sub_hits):4d} hits in {len({h['id'] for h in sub_hits})} claims")
    for h in sub_hits[:30]:
        print(f"   {h['id'][8:]:20s} {h['hit']!r:14s} ...{h['ctx'][:78]}")
    print()
    seen = Counter(h["token"].lower() for h in nw_hits)
    print(f"NONWORD          : {len(nw_hits):4d} hits in {len({h['id'] for h in nw_hits})} claims, "
          f"{len(seen)} distinct tokens")
    print("   rarest first (book_freq = times the token appears anywhere in the 7 sources):")
    for h in sorted(nw_hits, key=lambda x: (x["book_freq"], x["token"]))[:40]:
        print(f"   {h['id'][8:]:20s} f={h['book_freq']:<3d} {h['token']!r:18s} ...{h['ctx'][:66]}")


main()
