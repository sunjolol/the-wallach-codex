"""Corroboration pass v2 -- positional alignment.

v1 aligned from the FIRST to the LAST matching block across a 3-page hay window. For a short verbatim
on a dense page (the Let's Play Doctor materia-medica lists) two scattered anchors pulled 800+ words
of unrelated text into the aligned span and reported it as one giant `insert`. That noise would BURY
the class it most needs to catch -- OCR dropping a whole sentence
(memory: source-correction-policy, "OCR drops WHOLE SECTIONS, not just typos").

v2 anchors on the LONGEST matching block and maps the needle onto the hay positionally, so the
compared window is only ever about as long as the verbatim itself. An `insert` inside that window is
then real evidence of text present on the page and absent from our quote.
"""
import json, sys, difflib
from pathlib import Path
from collections import defaultdict

# Working data lives in tools/frontface/work/ (gitignored) so generated analysis never lands
# in a commit. Repointed from the session scratchpad 2026-08-02.
WORK = Path(__file__).resolve().parent / "work"
WORK.mkdir(parents=True, exist_ok=True)
SP = WORK
sys.path.insert(0, str(SP))
from pdf_corroborate import Book, PDFS, norm_tokens, locate  # noqa: E402

SLACK = 25          # words of headroom either side of the positional projection


def align(needle_toks, hay_toks):
    nw = [w for w, _ in needle_toks]
    hw = [w for w, _ in hay_toks]
    sm = difflib.SequenceMatcher(a=nw, b=hw, autojunk=False)
    blocks = [b for b in sm.get_matching_blocks() if b.size > 0]
    if not blocks:
        return None
    anchor = max(blocks, key=lambda b: b.size)
    if anchor.size < 3:
        return None
    lo = max(0, anchor.b - anchor.a - SLACK)
    hi = min(len(hw), anchor.b + (len(nw) - anchor.a) + SLACK)
    sub_h, sub_ho = hw[lo:hi], hay_toks[lo:hi]
    sm2 = difflib.SequenceMatcher(a=nw, b=sub_h, autojunk=False)
    matched = sum(b.size for b in sm2.get_matching_blocks())
    hunks = []
    for tag, i1, i2, j1, j2 in sm2.get_opcodes():
        if tag == "equal":
            continue
        # drop pure head/tail trims -- the window deliberately over-reaches
        if tag == "insert" and (j1 == 0 or j2 == len(sub_h)):
            continue
        if tag == "delete" and (i1 == 0 or i2 == len(nw)):
            continue
        ours = " ".join(o for _, o in needle_toks[i1:i2])
        theirs = " ".join(o for _, o in sub_ho[j1:j2])
        ctx_l = " ".join(o for _, o in needle_toks[max(0, i1 - 5):i1])
        ctx_r = " ".join(o for _, o in needle_toks[i2:i2 + 5])
        hunks.append({"tag": tag, "ours": ours, "pdf": theirs,
                      "ctx": f"...{ctx_l} [[{ours}]] {ctx_r}..."})
    return {"coverage": round(matched / max(1, len(nw)), 3),
            "anchor": anchor.size, "hunks": hunks}


def run(book_name, entries, out_dir):
    bk = Book(PDFS[book_name])
    out = []
    for e in entries:
        toks = norm_tokens(e["verbatim"])
        needle = [w for w, _ in toks]
        page, run_len, margin = locate(bk, needle)
        rec = {"id": e["id"], "needle_words": len(needle), "located": False, "page": None}
        if page is not None and run_len >= 3:
            lo, hi = max(0, page - 1), min(bk.n, page + 2)
            hay = [t for i in range(lo, hi) for t in bk.pages[i]]
            a = align(toks, hay)
            rec.update({"page": page + 1, "run": run_len, "margin": margin, "located": True})
            if a:
                rec.update(a)
        out.append(rec)
    (out_dir / f"corr2-{book_name}.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
    return out


if __name__ == "__main__":
    T = json.loads((SP / "targets.json").read_text(encoding="utf-8"))
    for b in ["rare-earths", "lets-play-doctor", "hells-kitchen"]:
        r = run(b, T[b], SP)
        ins = sum(1 for x in r for h in (x.get("hunks") or []) if h["tag"] == "insert")
        dele = sum(1 for x in r for h in (x.get("hunks") or []) if h["tag"] == "delete")
        rep = sum(1 for x in r for h in (x.get("hunks") or []) if h["tag"] == "replace")
        clean = sum(1 for x in r if x.get("located") and not x.get("hunks"))
        print(f"{b:18s} claims={len(r):4d} clean={clean:4d} replace={rep:4d} "
              f"insert={ins:4d} delete={dele:4d}")
