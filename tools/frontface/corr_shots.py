"""Corroborate the epigenetics / immortality verbatims against the Tesseract pass over their page
captures -- the same instrument used on the three PDF-backed books, with the OCR text standing in
for the PDF's text layer.

One extra normalization is needed that the PDF side did not need: Tesseract renders a capital I as
a pipe in this typeface ("| was afraid"). Left unmapped, every first-person sentence would register
as a spurious disagreement. Mapped here rather than in the shared normalizer, because it is an
artifact of THIS instrument, not of the source.
"""
import json, re, sys, glob
from pathlib import Path
from collections import defaultdict

# Working data lives in tools/frontface/work/ (gitignored) so generated analysis never lands
# in a commit. Repointed from the session scratchpad 2026-08-02.
WORK = Path(__file__).resolve().parent / "work"
WORK.mkdir(parents=True, exist_ok=True)
SP = WORK
sys.path.insert(0, str(SP))
from pdf_corroborate import norm_tokens, longest_run  # noqa: E402
from corr2 import align  # noqa: E402

# The Tesseract output is committed under ocr-cache/ -- 719 page reads, ~50 min to regenerate.
CACHE = Path(__file__).resolve().parent / "ocr-cache"
BOOKS = {"epigenetics": "ocr-epig-*.json", "immortality": "ocr-immort-*.json"}
PIPE = re.compile(r"(?<![A-Za-z0-9])\|(?![A-Za-z0-9])")


class ShotBook:
    def __init__(self, pattern):
        pages = {}
        for f in sorted(glob.glob(str(CACHE / pattern))):
            for k, v in json.loads(Path(f).read_text(encoding="utf-8")).items():
                if v:
                    pages[int(re.search(r"\((\d+)\)", k).group(1))] = PIPE.sub("I", v)
        self.keys = sorted(pages)
        self.pages = [norm_tokens(pages[k]) for k in self.keys]
        self.n = len(self.pages)
        self.index, self.df = defaultdict(set), defaultdict(int)
        for i, toks in enumerate(self.pages):
            for w in {w for w, _ in toks}:
                self.index[w].add(i)
                self.df[w] += 1

    def words(self, i):
        return [w for w, _ in self.pages[i]]

    def candidates(self, needle, top=12):
        score = defaultdict(float)
        for w in {w for w in needle if len(w) > 2}:
            d = self.df.get(w, 0)
            if d == 0 or d > self.n * 0.30:
                continue
            for i in self.index[w]:
                score[i] += 1.0 / d
        return [i for i, _ in sorted(score.items(), key=lambda kv: -kv[1])[:top]]


def locate(bk, needle):
    cands = bk.candidates(needle)
    if not cands:
        return None, 0, 0
    scored = sorted(((longest_run(needle, bk.words(i)), i) for i in cands), reverse=True)
    best, page = scored[0]
    runner = scored[1][0] if len(scored) > 1 else 0
    return page, best, best - runner


T = json.loads((SP / "targets.json").read_text(encoding="utf-8"))
for book, pat in BOOKS.items():
    bk = ShotBook(pat)
    out = []
    for e in T[book]:
        toks = norm_tokens(e["verbatim"])
        needle = [w for w, _ in toks]
        idx, run, margin = locate(bk, needle)
        rec = {"id": e["id"], "needle_words": len(needle), "located": False, "shot": None}
        if idx is not None and run >= 3:
            lo, hi = max(0, idx - 1), min(bk.n, idx + 2)
            hay = [t for i in range(lo, hi) for t in bk.pages[i]]
            a = align(toks, hay)
            rec.update({"shot": bk.keys[idx], "run": run, "margin": margin, "located": True})
            if a:
                rec.update(a)
        out.append(rec)
    (SP / f"corr2-{book}.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
    hi_clean = sum(1 for r in out if r.get("located") and not r.get("hunks")
                   and r.get("coverage", 0) >= 0.85)
    lowcov = sum(1 for r in out if r.get("located") and r.get("coverage", 1) < 0.85)
    print(f"{book:14s} claims={len(out):4d}  OCR pages={bk.n:4d}  clean(cov>=.85)={hi_clean:4d}  "
          f"low-confidence={lowcov:3d}  unlocated={sum(1 for r in out if not r['located']):3d}")
