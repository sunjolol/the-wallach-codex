#!/usr/bin/env python3
"""corpus_extract.py — deterministic extraction pre-pass for one book.

This is the DETERMINISTIC scaffolding half of the agent-in-the-loop pipeline
(proposal §5). It never calls an LLM and never decides what a claim means — it
prepares the surface the session agent + Luneth then work over:

  Pass 1  paragraph-aware chunking (~200–600 chars)
  Pass 2  numeric/dose candidate detection (regex)
  Pass 3  char_offset computation for every candidate (the machine locator)
  Pass 4  emit drafts/claims-<book>.draft.json skeleton + reports/<book>.report.md

PHASE STATE: Phase α ships the read-only DRY pre-scan below (paragraph + dose-candidate
counts for a book). Draft emission (Pass 4) lands in Phase β, written via safe_write to
drafts/ only. Claims themselves are authored by the agent under Luneth's chunk-by-chunk
review — the book is always the source; this tool only sorts the raw material.

Usage (dry pre-scan):  python eden/tools/corpus_extract.py --book dddl-3e-2011
"""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
CORPUS = ROOT / "eden" / "corpus"
META_PATH = CORPUS / "books-meta.json"

DOSE_RE = re.compile(r"\b\d[\d,\.]*\s?(mg|mcg|µg|ug|g|iu|i\.u\.|grams?|milligrams?|micrograms?)\b", re.I)


def lf_text(p: Path) -> str:
    return p.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n")


def book_path(book_id: str):
    meta = json.loads(META_PATH.read_text(encoding="utf-8"))
    for b in meta.get("books", []):
        if b.get("book_id") == book_id:
            return ROOT / b["file"], b
    return None, None


def main() -> int:
    ap = argparse.ArgumentParser(description="Deterministic extraction pre-pass (dry scan in Phase α).")
    ap.add_argument("--book", required=True, help="book_id from books-meta.json")
    args = ap.parse_args()

    bp, meta = book_path(args.book)
    if bp is None:
        print(f"unknown book_id '{args.book}'. Known: see eden/corpus/books-meta.json")
        return 1
    if not bp.exists():
        print(f"book file missing: {bp}")
        return 1

    txt = lf_text(bp)
    paras = [c for c in re.split(r"\n\s*\n", txt) if c.strip()]
    dose_hits = list(DOSE_RE.finditer(txt))
    print(f"DRY PRE-SCAN — {args.book} ({meta.get('title')})")
    print(f"  scheme            : {meta.get('locator_scheme')}")
    print(f"  chars (LF)        : {len(txt)}")
    print(f"  paragraph chunks  : {len(paras)}")
    print(f"  dose candidates   : {len(dose_hits)}  (regex, for the agent to adjudicate)")
    print()
    print("Draft emission (Pass 4) is Phase β — written to drafts/ via safe_write under review.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
