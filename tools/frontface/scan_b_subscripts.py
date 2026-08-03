"""Enumerate EVERY destroyed B-vitamin subscript in the sealed sources, and map each to its capture.

★ WHY THIS CANNOT BE BATCH-FIXED, proven within this very scan: the identical damaged token `Bg,`
means B5 in one place ("Pantothenic acid, aka vitamin Bg, was isolated in 1940" -- pantothenic acid
IS B5) and B6 in another ("Vitamin Bg, originally designated B3", page-read at 8x as B-subscript-6).
A blanket Bg->B6 would have turned pantothenic acid into pyridoxine. Same lesson as the 11 boron
hits that a subscript rule would have turned into a vitamin, and the two `ofdiarrhea` occurrences
that disagree with each other.

So this REPORTS and maps to a page; each occurrence is resolved by reading, one at a time.
The `screenshot` column is derived from the transcription's own page markers, so a reader can go
straight to the capture instead of hunting.
"""
import re
from pathlib import Path

ROOT = Path(r"C:\Users\Light\Desktop\claude\health expert")
BOOKS = ROOT / "eden/corpus/books"

# Shapes seen so far: a comma or lookalike standing in for a subscript digit, and a letter standing
# in for one. Deliberately anchored on a capital B followed by damage, then a word boundary.
SHAPES = [
    ("comma-split digits", re.compile(r"\bB\s*,\s*\d")),        # B,2
    ("double comma",       re.compile(r"\bB\s*,,")),             # B,,
    ("comma + guillemet",  re.compile(r"\bB\s*,\s*[»«]")),       # B,»
    ("letter-for-digit",   re.compile(r"\bB[a-z]\s*,")),         # By,  Bg,
    ("bare trailing comma after 'vitamin B'", re.compile(r"[Vv]itamin\s+B\s*,(?!\d)")),
]

for src in sorted(BOOKS.glob("*.txt")):
    text = src.read_text(encoding="utf-8")
    marks = [(m.start(), m.group(1)) for m in
             re.finditer(r"=====\s*Screenshot \((\d+)\)[^=]*=====", text)]

    def shot_for(off):
        prev = None
        for pos, num in marks:
            if pos <= off:
                prev = num
            else:
                break
        return prev

    rows = []
    seen = set()
    for label, rx in SHAPES:
        for m in rx.finditer(text):
            if m.start() in seen:
                continue
            seen.add(m.start())
            ctx = text[max(0, m.start() - 90):m.end() + 90].replace("\n", " ")
            rows.append((shot_for(m.start()), label, m.group(0), ctx))
    if not rows:
        continue
    print("=" * 92)
    print(f"{src.name}   {len(rows)} occurrence(s)")
    print("=" * 92)
    for shot, label, tok, ctx in sorted(rows, key=lambda r: (r[0] or "", r[2])):
        print(f"  shot {str(shot):>5s}  [{label:<38s}] {tok!r}")
        print(f"        ...{ctx}...")
