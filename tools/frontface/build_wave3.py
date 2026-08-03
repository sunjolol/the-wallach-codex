"""Build the wave-3 input: the 11 reader-facing sibling occurrences left unread by waves 1 and 2.

WHY THESE CANNOT BE BATCH-FIXED FROM THE ONES ALREADY READ. Measured 2026-08-02, the books have NO
consistent apostrophe convention: lets-play-doctor is 100% ASCII (386/0), dddl 100% curly (1156/0),
but epigenetics runs 68% ASCII and rare-earths 40% -- MIXED inside the same book. Two page reads
(EPIGEN-000061, RARE-000355) found curly on their pages, but with a 40-68% ASCII rate in those very
books that generalises to nothing. Same for the spurious space inside '1 ,000 mg': the one occurrence
read was spurious, and this corpus already contains a pair (`ofdiarrhea`) where two occurrences of an
identical token DISAGREE with each other. So: read each page.

Resolves every claim to a page/screenshot from its own locator so a reader can go straight there.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(r"C:\Users\Light\Desktop\claude\health expert")
sys.path.insert(0, str(ROOT / "tools" / "frontface"))
from pdf_corroborate import Book, PDFS, norm_tokens, locate  # noqa: E402

WORK = ROOT / "tools/frontface/work"
BOOKS = ROOT / "eden/corpus/books"

TARGETS = {
    "epigenetics": ["WAL-CLM-EPIGEN-000032", "WAL-CLM-EPIGEN-000108",
                    "WAL-CLM-EPIGEN-000016", "WAL-CLM-EPIGEN-000033",
                    "WAL-CLM-EPIGEN-000044", "WAL-CLM-EPIGEN-000280"],
    "rare-earths": ["WAL-CLM-RARE-000237"],
    "lets-play-doctor": ["WAL-CLM-LETS-000174", "WAL-CLM-LETS-000223",
                         "WAL-CLM-LETS-000238", "WAL-CLM-LETS-000391"],
}
SRC = {"epigenetics": "epigenetics.txt",
       "rare-earths": "rare-earths-forbidden-cures.txt",
       "lets-play-doctor": "lets-play-doctor-fourth-edition-1995.txt"}
PDF_BOOKS = {"rare-earths", "lets-play-doctor"}

TOKENS = {
    "apostrophe": re.compile(r"(Tourette's|Alzheimer's)"),
    "number-space": re.compile(r"1 ,000"),
}

out = []
for book, ids in TARGETS.items():
    shard = json.loads((ROOT / f"eden/corpus/claims/claims-{book}.json").read_text(encoding="utf-8"))["claims"]
    by = {c["id"]: c for c in shard}
    text = (BOOKS / SRC[book]).read_text(encoding="utf-8")
    marks = [(m.start(), m.group(1)) for m in
             re.finditer(r"=====\s*Screenshot \((\d+)\)[^=]*=====", text)]
    bk = Book(PDFS[book]) if book in PDF_BOOKS else None

    for cid in ids:
        c = by[cid]
        v = c["verbatim"]
        hits = []
        for label, rx in TOKENS.items():
            for m in rx.finditer(v):
                hits.append({"label": label, "token": m.group(0),
                             "ctx": v[max(0, m.start() - 70):m.end() + 70]})
        if book in PDF_BOOKS:
            needle = [w for w, _ in norm_tokens(v)]
            page, run_len, margin = locate(bk, needle)
            pg = (page + 1) if page is not None else None
            render = f'python tools/frontface/render.py {book} {pg} "<OUT>/{cid[8:]}.png" 3.0'
            kind = "pdf-page-index"
        else:
            off = text.find(v[:60])
            shot = None
            for pos, num in marks:
                if pos <= off:
                    shot = num
                else:
                    break
            pg = shot
            render = f'python tools/frontface/render_shot.py {book} {pg} "<OUT>/{cid[8:]}.png" both 3'
            kind = "screenshot-number-two-page-spread"
        out.append({"id": cid, "book": book, "page": pg, "page_kind": kind,
                    "render": render, "hits": hits, "verbatim": v})

p = WORK / "wave3.json"
p.write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
print(f"{p}  ->  {len(out)} claims")
for r in out:
    toks = ", ".join(sorted({h["token"] for h in r["hits"]}))
    print(f"  {r['id'][8:]:18s} {r['book']:18s} page={str(r['page']):>5s}  [{toks}]")
