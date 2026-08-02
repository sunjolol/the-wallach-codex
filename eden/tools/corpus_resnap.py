#!/usr/bin/env python3
"""corpus_resnap.py — reconcile a book's sealed claims after its TEXT was corrected.

Why this exists
---------------
The OCR-correction campaign edits eden/corpus/books/<book>.txt (de-hyphenate +
reflow + fix scan errors). Two sealed facts then go stale and must be repaired
atomically BEFORE re-sealing, or corpus_verify refuses:

  1. books-meta.json `content_sha256` (check #6 — book-hash truth anchor).
  2. every claim's `verbatim` (check #2) + `char_offset` (check #9), because
     reflowing shifts byte positions and de-hyphenation rewrites the exact bytes.

corpus_seal.py seals files but does NOT re-hash the book or re-snap claims;
finalize APPENDS new claims but carries existing ones forward unchanged. This
tool fills that gap. It is the sole sanctioned writer for the "text changed"
path (writes books-meta + the claims shard directly, like corpus_seal/derive;
corpus_verify is the post-write gate).

How a claim is re-located in the corrected text (in order)
----------------------------------------------------------
  * EXACT — verbatim is still a byte-for-byte substring -> just update offset
    (region untouched by the edit).
  * HEAL  — verbatim's letters-only skeleton matches UNIQUELY in the new text
    -> re-snap to the new exact substring (whitespace/hyphen/punct changed,
    letters did not) and update verbatim + offset.
  * BROKEN — letters differ (a scan error was fixed INSIDE the span) or the
    skeleton is ambiguous -> the tool writes nothing and lists it. Supply the
    corrected verbatim text via --fix to resolve, then re-run.

Skeleton match is safe for 60-1200 char verbatims: a 50+ char alphanumeric run
colliding twice in one book is astronomically unlikely, and a second occurrence
is treated as BROKEN rather than guessed.

Usage
-----
  python eden/tools/corpus_resnap.py --book rare-earths            # dry report
  python eden/tools/corpus_resnap.py --book rare-earths --write    # apply
  python eden/tools/corpus_resnap.py --book rare-earths --write --fix fixes.json
      fixes.json = { "WAL-CLM-RARE-000007": "the corrected verbatim text", ... }

Run corpus_seal.py afterwards to re-derive indices + re-seal goldens.
"""
import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
CORPUS = ROOT / "eden" / "corpus"
CLAIMS_DIR = CORPUS / "claims"
META_PATH = CORPUS / "books-meta.json"

MIN_VB, MAX_VB = 60, 1200


def lf_text(p: Path) -> str:
    return p.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n")


def book_entry(meta: dict, book_id: str):
    for b in meta["books"]:
        if b["book_id"] == book_id:
            return b
    return None


def skeleton(s: str):
    """Lowercased [a-z0-9]-only copy of s, with idx map skel_pos -> original_pos."""
    out, idx = [], []
    for i, c in enumerate(s):
        if c.isalnum():
            out.append(c.lower())
            idx.append(i)
    return "".join(out), idx


def relocate(book_text: str, sk_text: str, map_text: str, raw_vb: str):
    """Return (status, new_verbatim, new_offset). status in relocated|healed|broken|ambiguous|short."""
    if raw_vb and raw_vb in book_text:
        return "relocated", raw_vb, book_text.index(raw_vb)
    sk_vb, _ = skeleton(raw_vb)
    if not sk_vb:
        return "broken", None, None
    pos = sk_text.find(sk_vb)
    if pos < 0:
        return "broken", None, None
    if sk_text.find(sk_vb, pos + 1) != -1:
        return "ambiguous", None, None
    start = map_text[pos]
    end = map_text[pos + len(sk_vb) - 1]
    # The skeleton anchors the FIRST and LAST alphanumeric only, so a verbatim's leading/trailing
    # NON-alphanumeric run (a closing period, quote, paren, "!!!!") falls OUTSIDE the anchor and
    # would be silently dropped. Measured 2026-08-02: a de-hyphenation pass healed 77 claims and
    # 69 came back trimmed -- 68 lost a trailing '.'/'"'/')' and RARE-000342 lost all four of its
    # '!!!!' -- while FOUR also gained a stray leading letter. Nothing caught it: the healed text
    # is still a byte-exact substring of the source, so corpus_verify check #2, check #9 and the
    # whole board stay green on a quote that now ends mid-punctuation in the user's face.
    # Fix: re-attach the ORIGINAL verbatim's own edge runs, and only where the corrected book text
    # actually still carries them -- so this restores the true span and never invents one.
    lead_run = re.match(r"^[^0-9A-Za-z]*", raw_vb).group(0)
    trail_run = re.search(r"[^0-9A-Za-z]*$", raw_vb).group(0)
    if lead_run and book_text[start - len(lead_run):start] == lead_run:
        start -= len(lead_run)
    if trail_run and book_text[end + 1:end + 1 + len(trail_run)] == trail_run:
        end += len(trail_run)
    new_vb = book_text[start:end + 1]
    if not (MIN_VB <= len(new_vb) <= MAX_VB):
        return "short", new_vb, start
    return "healed", new_vb, start


def main() -> int:
    ap = argparse.ArgumentParser(description="Re-snap a book's claims after its text was corrected.")
    ap.add_argument("--book", required=True)
    ap.add_argument("--write", action="store_true", help="apply changes (default: dry report)")
    ap.add_argument("--fix", help="JSON map {claim_id: corrected_verbatim_text} for BROKEN claims")
    args = ap.parse_args()

    meta = json.loads(META_PATH.read_text(encoding="utf-8"))
    b = book_entry(meta, args.book)
    if not b:
        print(f"unknown book_id '{args.book}'")
        return 1
    book_file = ROOT / b["file"]
    book_text = lf_text(book_file)
    sk_text, map_text = skeleton(book_text)

    new_sha = hashlib.sha256(book_text.encode("utf-8")).hexdigest()
    new_bytes = len(book_text.encode("utf-8"))
    new_lines = book_text.count("\n") + 1
    hash_changed = new_sha != b.get("content_sha256")

    shard_path = CLAIMS_DIR / f"claims-{args.book}.json"
    has_shard = shard_path.exists()
    shard = json.loads(shard_path.read_text(encoding="utf-8")) if has_shard else {"claims": []}
    claims = shard.get("claims", [])

    fixes = {}
    if args.fix:
        fixes = json.loads(Path(args.fix).read_text(encoding="utf-8"))

    relocated, healed, broken = [], [], []
    for c in claims:
        cid = c["id"]
        raw_vb = fixes.get(cid, c.get("verbatim", ""))
        status, new_vb, off = relocate(book_text, sk_text, map_text, raw_vb)
        if status in ("relocated", "healed"):
            changed_vb = new_vb != c.get("verbatim")
            moved = off != (c.get("locator", {}) or {}).get("char_offset")
            c["verbatim"] = new_vb
            c.setdefault("locator", {})["char_offset"] = off
            if status == "healed" or cid in fixes:
                healed.append((cid, status))
            elif moved or changed_vb:
                relocated.append(cid)
        else:
            broken.append((cid, status, (c.get("verbatim", "")[:70])))

    print(f"RESNAP — {args.book} ({b.get('title')})")
    print(f"  book hash  : {b.get('content_sha256','?')[:12]}... -> {new_sha[:12]}...  "
          f"({'CHANGED' if hash_changed else 'unchanged'})")
    print(f"  claims     : {len(claims)} total")
    print(f"  relocated  : {len(relocated)} (offset moved, verbatim intact)")
    print(f"  healed     : {len(healed)} (verbatim re-snapped: whitespace/hyphen)")
    print(f"  BROKEN     : {len(broken)} (letters differ / ambiguous -> need --fix)")
    for cid, status, snip in broken:
        print(f"      - {cid} [{status}]: “{snip}...”")

    if not args.write:
        print("  (dry run — pass --write to apply)")
        return 0
    if broken:
        print("REFUSING to write — resolve BROKEN claims via --fix, then re-run. Nothing written.")
        return 1

    b["content_sha256"] = new_sha
    b["content_bytes"] = new_bytes
    b["line_count"] = new_lines
    META_PATH.write_text(json.dumps(meta, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if has_shard:
        shard_path.write_text(json.dumps(shard, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"  WROTE books-meta ({args.book}: bytes={new_bytes}, lines={new_lines}){' + shard' if has_shard else ' (no shard — hash only)'}.")
    print("  Next: run corpus_seal.py to re-derive indices + re-seal goldens.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
