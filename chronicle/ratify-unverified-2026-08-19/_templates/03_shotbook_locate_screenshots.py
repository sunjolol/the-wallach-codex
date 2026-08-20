#!/usr/bin/env python
"""Locate each keeper verbatim to its Immortality Kindle screenshot page."""
import json, re, glob, sys
from pathlib import Path
from collections import defaultdict

BASE = Path(r"C:/Users/Light/Desktop/claude/health expert")
FF = BASE / "tools/frontface"
sys.path.insert(0, str(FF))
sys.path.insert(0, str(FF / "work"))
from pdf_corroborate import norm_tokens, longest_run
from corr2 import align

CACHE = FF / "ocr-cache"
PIPE = re.compile(r"(?<![A-Za-z0-9])\|(?![A-Za-z0-9])")

class ShotBook:
    def __init__(self, pattern):
        pages = {}
        for f in sorted(glob.glob(str(CACHE / pattern))):
            for k, v in json.loads(Path(f).read_text(encoding="utf-8")).items():
                if v:
                    pages[int(re.search(r"\((\d+)\)", k).group(1))] = PIPE.sub("I", v)
        self.keys = sorted(pages)          # screenshot numbers, sorted
        self.knames = {i: f"Screenshot ({k}).png" for i, k in enumerate(self.keys)}
        self.pages = [norm_tokens(pages[k]) for k in self.keys]
        self.n = len(self.pages)
        self.index, self.df = defaultdict(set), defaultdict(int)
        for i, toks in enumerate(self.pages):
            for w in {w for w, _ in toks}:
                self.index[w].add(i); self.df[w] += 1
    def words(self, i):
        return [w for w, _ in self.pages[i]]
    def candidates(self, needle, top=12):
        score = defaultdict(float)
        for w in {w for w in needle if len(w) > 2}:
            d = self.df.get(w, 0)
            if d == 0 or d > self.n * 0.30: continue
            for i in self.index[w]:
                score[i] += 1.0 / d
        return [i for i, _ in sorted(score.items(), key=lambda kv: -kv[1])[:top]]

def locate(bk, needle):
    cands = bk.candidates(needle)
    if not cands: return None, 0, 0
    scored = sorted(((longest_run(needle, bk.words(i)), i) for i in cands), reverse=True)
    best, page = scored[0]
    runner = scored[1][0] if len(scored) > 1 else 0
    return page, best, best - runner

bk = ShotBook("ocr-immort-*.json")
DROP = {"WAL-CLM-IMMORT-000768","WAL-CLM-IMMORT-000775","WAL-CLM-IMMORT-000822","WAL-CLM-IMMORT-000827"}
land = json.load(open(BASE / "chronicle/ratify-unverified-2026-08-19/immortality/landing-input.json", encoding="utf-8"))

results = []
for e in land:
    drop = e["proposed_id"] in DROP
    toks = norm_tokens(e["verbatim"])
    needle = [w for w, _ in toks]
    idx, run, margin = locate(bk, needle)
    rec = {"id": e["proposed_id"], "drop_dup": drop, "needle_words": len(needle),
           "located": False, "shot": None, "shot_adj": None, "coverage": None, "hunks": None}
    if idx is not None and run >= 3:
        lo, hi = max(0, idx - 1), min(bk.n, idx + 2)
        hay = [t for i in range(lo, hi) for t in bk.pages[i]]
        a = align(toks, hay)
        rec["located"] = True
        rec["shot"] = bk.knames[idx]
        rec["shot_adj"] = [bk.knames[i] for i in range(lo, hi)]
        rec["run"] = run; rec["margin"] = margin
        if a:
            rec["coverage"] = round(a.get("coverage", 0), 3)
            rec["hunks"] = a.get("hunks")
    results.append(rec)

json.dump(results, open(BASE / "chronicle/ratify-unverified-2026-08-19/immortality/locate.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)

keepers = [r for r in results if not r["drop_dup"]]
print(f"KEEPERS located: {sum(1 for r in keepers if r['located'])}/{len(keepers)}")
print(f"  coverage>=0.85: {sum(1 for r in keepers if (r['coverage'] or 0)>=0.85)}")
print(f"  coverage<0.85 : {sum(1 for r in keepers if r['located'] and (r['coverage'] or 0)<0.85)}")
print(f"  UNLOCATED     : {[r['id'][8:] for r in keepers if not r['located']]}")
print()
for r in keepers:
    cov = r['coverage']
    covs = f"{cov:.2f}" if cov is not None else "  - "
    print(f"  {r['id'][8:]:14} {r['shot'] or 'UNLOCATED':22} cov={covs}  adj={r['shot_adj']}")
