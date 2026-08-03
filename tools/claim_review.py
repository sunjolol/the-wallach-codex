#!/usr/bin/env python3
"""Render sealed claims in the ONE shape Luneth reviews them in.

WHY THIS TOOL EXISTS -- read this before "improving" it.

The review shape is: QUESTION -> SHORT ANSWER -> FULL ANSWER -> QUOTE, complete text,
never truncated, never reordered, never collapsed into a table of ids. That instruction
had to be re-sent roughly seven times, because it lived as one line among 135 memory
entries and only reached a session if recall happened to fire on it. Restating it an
eighth time would not have worked either.

So it stopped being an instruction and became an interface. This renderer CANNOT emit a
summary, a table, or a truncated preview -- there is no flag for it, because the shape is
the point. He approves THE CLAIM, so he has to see the claim.

If a future session is about to hand him a list of claim ids, that session should be
running this instead.

USAGE
  python tools/claim_review.py --entity zinc
  python tools/claim_review.py --ids WAL-CLM-DDDL-000008 WAL-CLM-RARE-000199
  python tools/claim_review.py --entity copper --facet mechanism
  python tools/claim_review.py --entity zinc --out temporary/zinc-review.md
"""
import argparse
import glob
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CORPUS = ROOT / "eden" / "corpus"


def load_claims():
    out = {}
    for p in sorted(glob.glob(str(CORPUS / "claims" / "*.json"))):
        d = json.loads(pathlib.Path(p).read_text(encoding="utf-8"))
        arr = d["claims"] if isinstance(d, dict) and "claims" in d else (d if isinstance(d, list) else [])
        for c in arr:
            out[c["id"]] = c
    return out


def load_enrichment():
    p = CORPUS / "search-enrichment.json"
    if not p.exists():
        return {}
    return json.loads(p.read_text(encoding="utf-8")).get("enrichment", {})


def load_books():
    p = CORPUS / "books-meta.json"
    if not p.exists():
        return {}
    d = json.loads(p.read_text(encoding="utf-8"))
    books = d.get("books", d)
    if isinstance(books, list):
        return {b.get("id"): b for b in books}
    return books


def cite(claim, books):
    """Compose the citation from the sealed registry. Never hand-typed (Charter R3)."""
    loc = claim.get("locator") or {}
    bid = loc.get("book")
    b = books.get(bid, {})
    title = b.get("title") or b.get("short_title") or bid or "unknown source"
    year = b.get("year")
    bits = [title]
    if year:
        bits.append(f"({year})")
    page = loc.get("page")
    if page:
        bits.append(f"p. {page}")
    ch = loc.get("chapter")
    if ch:
        bits.append(f"ch. {ch}")
    return " ".join(str(x) for x in bits)


def render(claim, enr, books, idx, total):
    e = enr.get(claim["id"], {})
    q = e.get("question")
    short = e.get("answer_short")
    lines = []
    lines.append(f"### {idx}/{total} · `{claim['id']}`")
    meta = [f"kind: {claim.get('kind')}"]
    if e.get("facet"):
        meta.append(f"facet: {e['facet']}")
    if e.get("subject"):
        meta.append(f"subject: {e['subject']}")
    lines.append("_" + " · ".join(meta) + "_")
    lines.append("")
    lines.append(f"**Q — {q}**" if q else
                 "**Q — _(no authored question; this claim is not search-enriched yet)_**")
    lines.append("")
    lines.append(f"**Short —** {short}" if short else
                 "**Short —** _(no answer_short authored yet)_")
    lines.append("")
    lines.append("**Full —** " + (claim.get("claim_text") or "_(empty claim_text)_"))
    lines.append("")
    lines.append("> " + (claim.get("verbatim") or "(no verbatim)").replace("\n", "\n> "))
    lines.append("")
    lines.append(f"— {cite(claim, books)}")
    if claim.get("dose"):
        lines.append(f"\n`dose:` {json.dumps(claim['dose'])}")
    lines.append("")
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser(
        description="Render claims in the review shape: Question / Short / Full / Quote.")
    ap.add_argument("--entity", help="essential or condition slug")
    ap.add_argument("--ids", nargs="+", help="explicit claim ids")
    ap.add_argument("--facet", help="filter to one facet")
    ap.add_argument("--out", help="write markdown here instead of stdout")
    a = ap.parse_args()
    if not a.entity and not a.ids:
        ap.error("pass --entity or --ids")

    claims, enr, books = load_claims(), load_enrichment(), load_books()

    if a.ids:
        picked = [claims[i] for i in a.ids if i in claims]
        missing = [i for i in a.ids if i not in claims]
        if missing:
            print(f"WARNING: {len(missing)} id(s) not in the sealed corpus: "
                  f"{', '.join(missing[:5])}", file=sys.stderr)
    else:
        s = a.entity
        picked = [c for c in claims.values()
                  if s in (c.get("essentials") or []) or s in (c.get("conditions") or [])
                  or s in (c.get("symptoms") or []) or s in (c.get("other_substances") or [])
                  or enr.get(c["id"], {}).get("subject") == s
                  or s in (enr.get(c["id"], {}).get("also_about") or [])]
    if a.facet:
        picked = [c for c in picked if enr.get(c["id"], {}).get("facet") == a.facet]
    picked.sort(key=lambda c: c["id"])

    if not picked:
        print(f"No claims found for {a.entity or a.ids}.", file=sys.stderr)
        return 1

    head = (f"# Claim review — {a.entity or 'selected ids'}"
            + (f" · facet `{a.facet}`" if a.facet else "")
            + f"\n\n_{len(picked)} claim(s), full text. Approve or reject each._\n")
    body = head + "\n" + "\n".join(
        render(c, enr, books, i + 1, len(picked)) for i, c in enumerate(picked))

    if a.out:
        p = pathlib.Path(a.out)
        if not p.is_absolute():
            p = ROOT / p
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(body, encoding="utf-8")
        print(f"OK  {p} ({len(picked)} claims, {len(body)} chars)")
    else:
        sys.stdout.write(body)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
