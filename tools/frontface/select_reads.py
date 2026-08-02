"""Turn the corroboration output into the actual PAGE-READ worklist.

Every suppression below is a CLAIM ABOUT THE WORLD and carries its reason, so the list can be
audited rather than trusted (memory: gate-exceptions-are-world-claims). Counts are reported for
every suppressed class -- a filter that silently drops 250 findings would make this look like
coverage when it is triage.

SUPPRESSED, with the reason each rests on:
  unit-ocr-resolved      the PDF layer's `meg`/`gm` is the ambiguous OCR form; ours is the resolved
                         one. dose-misprint-safety-mandate records 126 such fixes already made.
  silver-400mcg          WAL-CLM-RARE-000090 `mcg` vs the page's printed `mg`: a DELIBERATE safety
                         divergence the mandate says must NEVER be restored. Hard-suppressed by id.
  subscript-normalized   B12 / As2O3 / H2O against `Bj` / `As Oj` / `H O`.
  uniform-typo-fix       ours is a known word, the PDF's is not -> our doctrine-mandated correction
                         of a book or OCR typo (correct-everything-uniformly, Luneth SESSION 41),
                         confirmed by eye on rare-earths p329 which really prints `flourosis`.
  pdf-page-number-bleed  the PDF token has a page number fused into a word (`intesti269nal`).
  pdf-spacing            the two sides differ only by whitespace, on the PDF's side.

KEPT for a page read -- the three shapes doctrine does NOT explain:
  A1 ours-unknown/pdf-known   OUR text is the garbled side. Highest value; this is the Denver Post
                              signature that started the campaign.
  A2 both-known-but-different a real word swap (`produced`/`acquired`, `copper`/`glucose`) or a
                              number swap. Cannot be a typo fix; changes meaning.
  A3 both-unknown             neither instrument is trustworthy here. Read it.
  B  dropped/slipped          >=3 page words missing from our verbatim, or the alignment slipped on
                              a table/figure page. Read to confirm nothing was lost.
  C  control                  random sample where the two passes AGREE. Measures how often agreement
                              is wrong; without it the 587 "clean" claims rest on nothing
                              (memory: negative-control-or-it-proves-nothing).
"""
import json, re, random
from pathlib import Path
from collections import Counter

# Working data lives in tools/frontface/work/ (gitignored) so generated analysis never lands
# in a commit. Repointed from the session scratchpad 2026-08-02.
WORK = Path(__file__).resolve().parent / "work"
WORK.mkdir(parents=True, exist_ok=True)
SP = WORK
BOOKS = ["rare-earths", "lets-play-doctor", "hells-kitchen", "epigenetics", "immortality"]
random.seed(20260802)

SILVER = "WAL-CLM-RARE-000090"
UNIT_KNOWN = {("mcg", "meg"), ("mg", "gm"), ("mg", "m"), ("gm", "gms")}
SUBSCRIPT = re.compile(r"^(B12|As2O3|H2O|CO2|B6|B1|B2)$", re.I)
PAGEBLEED = re.compile(r"[A-Za-z]\d{2,4}[A-Za-z]|\b[A-Za-z]+\d{2,4}\b")

from spellchecker import SpellChecker
SPELL = SpellChecker()
supp = Counter()


def known(tok):
    t = re.sub(r"[^A-Za-z]", "", tok)
    return bool(t) and not SPELL.unknown([t.lower()])


def all_known(s):
    ts = s.split()
    return bool(ts) and all(known(t) for t in ts)


def squash(s):
    return re.sub(r"[^a-z0-9]", "", s.lower())


def suppressed(cid, ours, pdf):
    o, p = ours.strip(), pdf.strip()
    ol, pl = o.lower(), p.lower()
    if cid == SILVER and (ol, pl) == ("mcg", "mg"):
        return "silver-400mcg"
    if (ol, pl) in UNIT_KNOWN:
        return "unit-ocr-resolved"
    if SUBSCRIPT.match(o):
        return "subscript-normalized"
    if squash(o) == squash(p):
        return "pdf-spacing"
    if PAGEBLEED.search(p) and not PAGEBLEED.search(o):
        return "pdf-page-number-bleed"
    if all_known(o) and not all_known(p):
        return "uniform-typo-fix"
    return None


rows = []
for b in BOOKS:
    for r in json.loads((SP / f"corr2-{b}.json").read_text(encoding="utf-8")):
        if not r.get("located"):
            rows.append({"tier": "A", "sub": "UNLOCATED", "book": b, "id": r["id"],
                         "page": None, "hunks": []})
            continue
        keep, slip, drop = [], [], []
        for h in (r.get("hunks") or []):
            if h["tag"] == "delete":
                continue
            if h["tag"] == "insert":
                if len(h["pdf"].split()) >= 3:
                    drop.append(h)
                continue
            # a many-word "replace" is the positional window slipping on a table/figure page
            if len(h["pdf"].split()) > 3 or len(h["ours"].split()) > 3:
                slip.append(h)
                continue
            s = suppressed(r["id"], h["ours"], h["pdf"])
            if s:
                supp[s] += 1
                continue
            o_k, p_k = all_known(h["ours"]), all_known(h["pdf"])
            sub = "A1-ours-garbled" if (not o_k and p_k) else \
                  "A2-both-known-differ" if (o_k and p_k) else "A3-both-unknown"
            keep.append(dict(h, sub=sub))
        base = {"book": b, "id": r["id"], "page": r.get("page") or r.get("shot"), "coverage": r.get("coverage")}
        if keep:
            rank = min(("A1-ours-garbled", "A2-both-known-differ", "A3-both-unknown").index(k["sub"])
                       for k in keep)
            rows.append(dict(base, tier="A", sub=["A1", "A2", "A3"][rank], hunks=keep))
        if drop or slip:
            rows.append(dict(base, tier="B",
                             sub="dropped-text" if drop else "alignment-slip",
                             hunks=(drop + slip)[:6]))

clean = [dict(book=b, id=r["id"], page=r.get("page") or r.get("shot"),
              coverage=r["coverage"], tier="C", sub="control", hunks=[])
         for b in BOOKS
         for r in json.loads((SP / f"corr2-{b}.json").read_text(encoding="utf-8"))
         if r.get("located") and not r.get("hunks") and r.get("coverage", 0) >= 0.9]
rows.extend(random.sample(clean, min(30, len(clean))))

(SP / "readlist.json").write_text(json.dumps(rows, indent=1), encoding="utf-8")

print("SUPPRESSED (each with its stated reason) -- reported, not hidden:")
for k, v in supp.most_common():
    print(f"   {k:24s} {v:4d} hunks")
print(f"   {'TOTAL SUPPRESSED':24s} {sum(supp.values()):4d}")
print()
c = Counter(f"{r['tier']}-{r['sub']}" for r in rows)
for k, v in sorted(c.items()):
    print(f"  {k:26s} {v:4d} claims")
print(f"  {'TOTAL PAGE READS':26s} {len(rows):4d} claims   (of 978 in the three PDF books)")
print()
for want in ("A1", "A2", "A3"):
    print(f"--- TIER {want} ---")
    for r in rows:
        if r["tier"] == "A" and r["sub"] == want:
            hs = "; ".join(f"{h['ours']!r}->{h['pdf']!r}" for h in r["hunks"][:3])
            print(f"  {r['id'][8:]:20s} p{str(r['page']):5s} {hs[:92]}")
