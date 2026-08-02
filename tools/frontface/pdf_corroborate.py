"""Corroborate every front-facing verbatim of the three PDF-backed books against the PDF's OWN
text layer -- a SECOND, INDEPENDENT OCR pass over the same scan.

WHY this is evidence and not stale-to-stale (SS00.B #11): our eden .txt and the PDF's embedded text
layer are demonstrably different OCR runs. Proof measured 2026-08-02 on WAL-CLM-RARE-000336: the
text layer independently produced `of`/`risk`/`area`/`the`/`pro-vide`/`cancer` where our .txt had
`f`/`tisk`/`rea`/`he`/`pro-side`/`ancer` -- all 7 known defects -- while making its OWN unrelated
errors (`Ctiina`, `Ttie`, `lewer`, `.sponsored`). Independent instruments.

HONEST LIMIT, stated up front: both passes read the SAME physical scan, so a character that is
genuinely ambiguous on the page can be misread the same way twice. Agreement is strong corroboration,
NOT proof. Disagreement is a CANDIDATE, never a verdict -- the page image is still the arbiter.

Output: one JSON per book with, per claim, the located page + every word-level disagreement hunk.
"""
import json, re, sys, unicodedata, difflib, time
from pathlib import Path
from collections import defaultdict
import fitz

ROOT = Path(r"C:\Users\Light\Desktop\claude\health expert")
# Working data lives in tools/frontface/work/ (gitignored) so generated analysis never lands
# in a commit. Repointed from the session scratchpad 2026-08-02.
WORK = Path(__file__).resolve().parent / "work"
WORK.mkdir(parents=True, exist_ok=True)
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else WORK

PDFS = {
    "lets-play-doctor": ROOT / r"temporary\lets-play-doctor-pdf\Lets-Play-Doctor-PDF-by-Joel-Wallach-Lan-Ma.pdf",
    "rare-earths": ROOT / r"temporary\rare earths forbidden cures\rare-earths-forbidden-cures-pdf-by-joel-wallach-lan-ma-pdf.pdf",
    "hells-kitchen": ROOT / r"temporary\hk\788873904-Dr-Joel-Wallach-Joel-D-Wallach-JD-Wallach-Ma-Lan-MD-Hell-s-Kitchen-Causes-Prevention-and-Cure-of-Obesity-Diabetes-and-Metabolic-Syndrome-De.pdf",
}

# ---------------------------------------------------------------- normalization
LIG = {"\ufb00": "ff", "\ufb01": "fi", "\ufb02": "fl", "\ufb03": "ffi", "\ufb04": "ffl"}


def norm_tokens(s):
    """-> list of (normalized_word, original_word). Rejoins line-break hyphen splits on BOTH sides so
    a faithful typesetter break never registers as a disagreement."""
    for k, v in LIG.items():
        s = s.replace(k, v)
    s = unicodedata.normalize("NFKD", s)
    s = (s.replace("\u2019", "'").replace("\u2018", "'")
          .replace("\u201c", '"').replace("\u201d", '"')
          .replace("\u2014", "-").replace("\u2013", "-").replace("\u2212", "-"))
    s = re.sub(r"-\s*\n\s*", "", s)                 # de-hyphenate across the line break
    raw = re.findall(r"[A-Za-z0-9']+", s)
    return [(w.lower().replace("'", ""), w) for w in raw]


# ---------------------------------------------------------------- page corpus
class Book:
    def __init__(self, path):
        doc = fitz.open(path)
        self.pages = []
        for p in doc:
            self.pages.append(norm_tokens(p.get_text()))
        doc.close()
        # inverted index: word -> set of page indices (for cheap candidate prefilter)
        self.index = defaultdict(set)
        self.df = defaultdict(int)
        for i, toks in enumerate(self.pages):
            seen = {w for w, _ in toks}
            for w in seen:
                self.index[w].add(i)
                self.df[w] += 1
        self.n = len(self.pages)

    def words(self, i):
        return [w for w, _ in self.pages[i]]

    def candidates(self, needle, top=12):
        """Rank pages by summed inverse-document-frequency of the needle's rarest words."""
        score = defaultdict(float)
        uniq = {w for w in needle if len(w) > 2}
        for w in uniq:
            d = self.df.get(w, 0)
            if d == 0 or d > self.n * 0.30:      # skip absent + ubiquitous
                continue
            weight = 1.0 / d
            for i in self.index[w]:
                score[i] += weight
        return [i for i, _ in sorted(score.items(), key=lambda kv: -kv[1])[:top]]


def longest_run(needle, hay):
    pos = defaultdict(list)
    for i, w in enumerate(hay):
        pos[w].append(i)
    best = 0
    for i in range(len(needle)):
        for start in pos.get(needle[i], ()):
            n = 0
            while i + n < len(needle) and start + n < len(hay) and needle[i + n] == hay[start + n]:
                n += 1
            if n > best:
                best = n
    return best


def locate(book, needle):
    cands = book.candidates(needle)
    if not cands:
        return None, 0, 0
    scored = sorted(((longest_run(needle, book.words(i)), i) for i in cands), reverse=True)
    best, page = scored[0]
    runner = scored[1][0] if len(scored) > 1 else 0
    return page, best, best - runner


def diff_hunks(needle_toks, hay_toks):
    """Word-level diff of the verbatim against a window of page text. Returns hunks + the aligned
    span so a caller can see how much of the verbatim was actually covered."""
    nw = [w for w, _ in needle_toks]
    hw = [w for w, _ in hay_toks]
    sm = difflib.SequenceMatcher(a=nw, b=hw, autojunk=False)
    blocks = [b for b in sm.get_matching_blocks() if b.size > 0]
    if not blocks:
        return None
    # restrict the hay to the aligned region so page furniture doesn't count as "missing"
    b0, bN = blocks[0], blocks[-1]
    a_lo, a_hi = b0.a, bN.a + bN.size
    b_lo, b_hi = b0.b, bN.b + bN.size
    sub_n, sub_h = nw[a_lo:a_hi], hw[b_lo:b_hi]
    sm2 = difflib.SequenceMatcher(a=sub_n, b=sub_h, autojunk=False)
    matched = sum(bl.size for bl in sm2.get_matching_blocks())
    hunks = []
    for tag, i1, i2, j1, j2 in sm2.get_opcodes():
        if tag == "equal":
            continue
        ours = " ".join(o for _, o in needle_toks[a_lo + i1:a_lo + i2])
        theirs = " ".join(o for _, o in hay_toks[b_lo + j1:b_lo + j2])
        ctx_l = " ".join(o for _, o in needle_toks[max(0, a_lo + i1 - 4):a_lo + i1])
        ctx_r = " ".join(o for _, o in needle_toks[a_lo + i2:a_lo + i2 + 4])
        hunks.append({"tag": tag, "ours": ours, "pdf": theirs,
                      "ctx": f"...{ctx_l} [[{ours}]] {ctx_r}..."})
    return {"aligned_words": len(sub_n), "matched": matched,
            "coverage": round(matched / max(1, len(nw)), 3),
            "head_skip": a_lo, "tail_skip": len(nw) - a_hi, "hunks": hunks}


# ---------------------------------------------------------------- main
def run(book_name, entries):
    t0 = time.time()
    bk = Book(PDFS[book_name])
    print(f"[{book_name}] {bk.n} pages indexed in {time.time()-t0:.1f}s; {len(entries)} claims",
          flush=True)
    out = []
    for k, e in enumerate(entries):
        toks = norm_tokens(e["verbatim"])
        needle = [w for w, _ in toks]
        page, run_len, margin = locate(bk, needle)
        rec = {"id": e["id"], "verbatim_len": e.get("verbatim_len", len(e["verbatim"])),
               "needle_words": len(needle), "page": None, "located": False}
        if page is not None and run_len >= 3:
            lo, hi = max(0, page - 1), min(bk.n, page + 2)
            hay = [t for i in range(lo, hi) for t in bk.pages[i]]
            d = diff_hunks(toks, hay)
            rec.update({"page": page + 1, "run": run_len, "margin": margin, "located": True})
            if d:
                rec.update(d)
        out.append(rec)
        if (k + 1) % 100 == 0:
            print(f"   {k+1}/{len(entries)}  ({time.time()-t0:.0f}s)", flush=True)
    p = OUT / f"corroborate-{book_name}.json"
    p.write_text(json.dumps(out, indent=1), encoding="utf-8")
    print(f"[{book_name}] -> {p}  ({time.time()-t0:.0f}s)", flush=True)
    return out


if __name__ == "__main__":
    W = json.loads((ROOT / "chronicle/frontface-ocr/worklist.json").read_text(encoding="utf-8"))
    books = sys.argv[2].split(",") if len(sys.argv) > 2 else ["rare-earths", "lets-play-doctor"]
    for b in books:
        run(b, W[b])
