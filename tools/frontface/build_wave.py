"""Turn `work/readlist.json` into a PAGE-GROUPED wave file an agent fleet can work.

WHY GROUP BY PAGE. The unit of cost is a RENDER + a page read, not a claim. 443 claims sit on 216
distinct pages, and immortality's 217 claims sit on only 78 -- so grouping collapses roughly half the
work before a single agent starts. Each group carries every claim on that page, so one render serves
all of them.

WHY THE WHOLE VERBATIM SHIPS, not just the flagged span. Measured 2026-08-02: of 30 claims where both
independent OCR passes AGREED, 7 still carried a defect, and the wave-3 sweep found defects OUTSIDE
the flagged tokens. The hunks are a HINT about where to look; the contract is a whole-verbatim read.
Shipping only the span would rebuild the blind spot this campaign exists to close.

WHY THE RENDER COMMAND IS PRECOMPUTED per group. Two documented session-losers live in the argument
list: `pdftoppm` is not installed (so `Read` cannot open a PDF page at all), and each capture book's
"page" is a Screenshot NUMBER naming a TWO-PAGE SPREAD inside a 3840x1080 dual-monitor frame. An
agent that derives the command itself gets to make both mistakes.

Usage:
    python tools/frontface/build_wave.py <name> <tier>[,<tier>...]
    python tools/frontface/build_wave.py wave1 A,C
    python tools/frontface/build_wave.py wave2 B
"""
import json
import sys
from collections import defaultdict, Counter
from pathlib import Path

WORK = Path(__file__).resolve().parent / "work"

# The two families differ in what "page" MEANS and therefore in which renderer can find it.
PDF_BOOKS = {"rare-earths", "lets-play-doctor", "hells-kitchen"}      # page = 1-based PDF page index
SHOT_BOOKS = {"epigenetics", "immortality"}                          # page = Screenshot (N) number


def render_cmd(book: str, page, out: str) -> str:
    if book in PDF_BOOKS:
        return f'python tools/frontface/render.py {book} {page} "{out}" 3.0'
    return f'python tools/frontface/render_shot.py {book} {page} "{out}" both 3'


def zoom_hint(book: str) -> str:
    if book in PDF_BOOKS:
        return ('python tools/frontface/render.py %s <page> "<out>.png" 12.0 <x0> <y0> <x1> <y1>'
                '   (x0 y0 x1 y1 are FRACTIONS of the page)' % book)
    return ('python tools/frontface/render_shot.py %s <N> "<out>.png" left 8'
            '   (or right; the gutter sits at x=0.2506 of the book area)' % book)


def build(name: str, tiers: set) -> dict:
    readlist = json.loads((WORK / "readlist.json").read_text(encoding="utf-8"))
    targets = json.loads((WORK / "targets.json").read_text(encoding="utf-8"))
    verbatim = {c["id"]: c["verbatim"] for book in targets.values() for c in book}

    rows = [r for r in readlist if r["tier"] in tiers]

    groups = defaultdict(list)
    for r in rows:
        groups[(r["book"], r["page"])].append(r)

    out = []
    for (book, page), rs in sorted(groups.items(), key=lambda kv: (kv[0][0], str(kv[0][1]))):
        claims = []
        for r in rs:
            claims.append({
                "id": r["id"],
                "tier": r["tier"],
                "sub": r["sub"],
                # coverage is the LOCATOR's self-report, not a quality score. Below 0.85 the page
                # index is unreliable and the neighbours must be searched -- the locator once sent
                # RARE-000335 to p412 instead of p495 and manufactured a phantom hunk.
                "coverage": r.get("coverage"),
                "verbatim": verbatim.get(r["id"], ""),
                "hunks": [{"ours": h["ours"], "pdf": h["pdf"], "ctx": h.get("ctx", ""),
                           "sub": h.get("sub", r["sub"])} for h in (r.get("hunks") or [])],
            })
        covs = [c["coverage"] for c in claims if c["coverage"] is not None]
        out.append({
            "gid": f"{book}:{page}",
            "book": book,
            "page": page,
            "page_kind": "pdf-page-index" if book in PDF_BOOKS else "screenshot-number-two-page-spread",
            "page_index_reliable": bool(covs) and min(covs) >= 0.85,
            "min_coverage": min(covs) if covs else None,
            "render": render_cmd(book, page, f"<OUT>/{book}-{page}.png"),
            "zoom": zoom_hint(book),
            "claims": claims,
        })

    path = WORK / f"{name}.json"
    path.write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")

    print(f"{path}")
    print(f"  groups {len(out):4d}   claims {sum(len(g['claims']) for g in out):4d}")
    print(f"  UNLOCATED groups (page is null -- no render possible, search by text): "
          f"{sum(1 for g in out if g['page'] is None)}")
    print(f"  groups whose page index is UNRELIABLE (coverage<0.85): "
          f"{sum(1 for g in out if not g['page_index_reliable'] and g['page'] is not None)}")
    by_book = Counter(g["book"] for g in out)
    for b, n in sorted(by_book.items()):
        cl = sum(len(g["claims"]) for g in out if g["book"] == b)
        print(f"    {b:20s} groups={n:4d}  claims={cl:4d}")
    sub = Counter(c["sub"] for g in out for c in g["claims"])
    print("  by sub-tier: " + "  ".join(f"{k}={v}" for k, v in sorted(sub.items())))
    return out


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__)
        raise SystemExit(2)
    build(sys.argv[1], set(sys.argv[2].split(",")))
