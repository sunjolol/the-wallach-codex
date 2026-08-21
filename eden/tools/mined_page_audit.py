#!/usr/bin/env python3
"""mined_page_audit.py — the per-page cleanliness gate for MINED source pages.

A page you have mined (sealed a claim on) must carry ZERO high-confidence OCR
defects in its source .txt, or the round-close board goes red. This turns "clean
the books as we go" from an advisory note into a machine gate: you cannot close a
chunk that left detectable garbage on a page you touched. A rule that lives only in
prose is advisory and gets rationalised away; a red board is not, so this rule ships
as a gate.

Scope is deliberately TIGHT (~zero false positive) — only detector classes that are
almost always real defects and never legitimate text:
  - space_before_punct / space_in_paren   (deterministic punctuation-spacing defects)
  - repeated_char / post_marker_fragment  (OCR gibberish, e.g. "eee", "Sei ee a")
double_space is deliberately NOT gated: (a) the verbatim render path collapses every
whitespace run (collapseWS in views/knowledge-corpus.ts), so book double-spaces can
never reach the screen — there is no forward-facing risk to guard; and (b) page-level
double-space gating would wrongly flag legitimate data-table column alignment. It stays
a book_purity finding for the whole-book sweep.
The FP-heavy classes (spell_flag proper nouns, digit_in_word, run_together,
hyphen_wrap) are NOT gated here — they stay judgment work for the whole-book pristine
sweep, because gating them would breed rubber-stamp allowlisting. Reading-order
scrambles (all real words, wrong order) no detector can catch; those are only found by
reading the scanned page against the text, which no gate can do for you.

'Mined page' = a screenshot page carrying >=1 sealed claim, derived from the sealed
claims' locator.screenshot — truth-anchored on the shipped artifact, unhideable.
Books whose claims use a non-screenshot locator scheme (kindle_location) have no
mined pages here and are not gated by this tool (a char-offset-window variant is the
documented follow-up); immortality/epigenetics/iaiyh are screenshot-scheme.

The gate applies only to books that have ENTERED source purification
(purity-status purifying|pristine), mirroring book_source_clean (which gates only
pristine books): a 'raw' book carries expected OCR backlog on every page, so its
mined-page cleanliness is enforced when it enters purification, not before. This keeps
the ACTIVE book strictly gated without demanding a whole-book reconstruction of a raw
book mid-session.

A genuine false positive on a gated class is resolved by adding its signature to
mined-page-triage.json with a one-line human reason (kept tiny by the tight scope).
"""
import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
CLAIMS_DIR = ROOT / "eden" / "corpus" / "claims"
TRIAGE_PATH = HERE / "mined-page-triage.json"

sys.path.insert(0, str(HERE))
import book_purity  # noqa: E402  (same-dir corpus tool; detection lives there)

# Detector classes gated on mined pages — tight, ~zero false positive by design.
GATED = {
    "space_before_punct", "space_in_paren",   # deterministic punctuation-spacing defects
    "repeated_char", "post_marker_fragment",  # OCR gibberish ("eee", "Sei ee a")
}

# The gate applies to books that have entered source purification; a 'raw'
# book's mined-page backlog is enforced when it enters purification (see module doc).
GATED_STATUS = {"purifying", "pristine"}
PURITY_STATUS_PATH = HERE / "purity-status.json"

RE_SCREENSHOT = re.compile(r"Screenshot\s*\((\d+)\)")


def gated_books() -> set:
    """Book ids currently under the mined-page gate (purity-status in GATED_STATUS)."""
    if not PURITY_STATUS_PATH.exists():
        return set()
    status = json.loads(PURITY_STATUS_PATH.read_text(encoding="utf-8")).get("books", {})
    return {b for b, s in status.items() if s in GATED_STATUS}


def _page_of(source: str):
    """Screenshot number from a finding's source marker text, or None."""
    m = RE_SCREENSHOT.search(source or "")
    return int(m.group(1)) if m else None


def mined_pages(book_id: str) -> set:
    """Screenshot pages carrying >=1 sealed claim (derived from locator.screenshot)."""
    shard = CLAIMS_DIR / f"claims-{book_id}.json"
    if not shard.exists():
        return set()
    pages = set()
    for c in json.loads(shard.read_text(encoding="utf-8")).get("claims", []):
        sc = (c.get("locator") or {}).get("screenshot")
        if sc is not None:
            pages.add(int(sc))
    return pages


def load_triage() -> dict:
    if not TRIAGE_PATH.exists():
        return {}
    return {k: v for k, v in json.loads(TRIAGE_PATH.read_text(encoding="utf-8")).items()
            if not k.startswith("_")}


def signature(f: dict) -> str:
    """Line-shift-stable id for a finding: detector | page | term | context."""
    return f"{f['detector']}|{_page_of(f.get('source', ''))}|{f['term']}|{f['context']}"


def gated_findings(book_id: str) -> list:
    """High-confidence defect findings on this book's mined pages, minus triage."""
    pages = mined_pages(book_id)
    if not pages:
        return []
    triage = load_triage().get(book_id, {})
    findings, _hdr = book_purity.scan(book_purity.lf_text(book_purity.resolve_book(book_id)))
    out = []
    for f in findings:
        if f["detector"] not in GATED:
            continue
        if _page_of(f.get("source", "")) not in pages:
            continue
        if signature(f) in triage:
            continue
        out.append(f)
    return out


def all_books() -> dict:
    """{book_id: [gated findings]} across every book that has a claims shard."""
    gated = gated_books()
    result = {}
    for shard in sorted(CLAIMS_DIR.glob("claims-*.json")):
        book_id = shard.stem.replace("claims-", "")
        if book_id not in gated:
            continue  # raw book -- gated only once it enters purification
        try:
            book_purity.resolve_book(book_id)
        except SystemExit:
            continue  # book_id in claims but not in books-meta
        result[book_id] = gated_findings(book_id)
    return result


def cmd_audit(args):
    books = {args.book: gated_findings(args.book)} if args.book else all_books()
    total = 0
    for book_id, findings in books.items():
        pages = mined_pages(book_id)
        if not pages:
            print(f"== {book_id}: no screenshot-scheme mined pages (not gated) ==")
            continue
        by_det = Counter(f["detector"] for f in findings)
        by_page = defaultdict(list)
        for f in findings:
            by_page[_page_of(f["source"])].append(f)
        status = "CLEAN" if not findings else f"{len(findings)} DEFECT(S)"
        print(f"== {book_id}: {len(pages)} mined pages · {status} == {dict(by_det)}")
        for pg in sorted(by_page):
            for f in by_page[pg]:
                print(f"   [Screenshot {pg}] [{f['detector']}] L{f['line']}: "
                      f"{f['term']!r}  ctx={f['context']!r}")
        total += len(findings)
    print(f"\nTOTAL gated defects on mined pages: {total}")
    return total


def main():
    ap = argparse.ArgumentParser(description="mined-page cleanliness gate")
    sub = ap.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("audit", help="list gated defects on mined pages")
    a.add_argument("--book", help="one book_id (default: all)")
    a.set_defaults(func=cmd_audit)
    args = ap.parse_args()
    rc = args.func(args)
    sys.exit(1 if rc else 0)


if __name__ == "__main__":
    main()
