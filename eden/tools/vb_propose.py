#!/usr/bin/env python3
"""vb_propose.py — for each violating claim in a book, measure the minimal source
span that would NAME every currently-mapped condition (+symptom), so I can decide
extend-vs-drop and author anchors. Read-only.

For each mapped condition/symptom, we locate its name in the RAW book text within a
search window around the claim's char_offset, using a whitespace-flexible regex over
the accepted phrases (display name, slug tokens, synonyms). Reports:
  - span [lo,hi] covering current-verbatim ∪ all found names, its char length
  - which conditions are NOT found in-window (candidates to drop / extend-far)
  - the raw span text (so I can pick clean anchors)
Usage: python vb_propose.py <book_id> [claim_id]
"""
import re
import sys
from pathlib import Path
# ROOT resolves from this file's location (eden/tools/<file> -> parents[2] = repo
# root), so the tool operates on the tree it lives in -- including a git worktree.
# (A hardcoded main-repo path silently read the wrong tree from a worktree.)
ROOT = Path(__file__).resolve().parents[2]
AUDIT_DIR = ROOT / "eden" / "tools"
sys.path.insert(0, str(AUDIT_DIR))
import verbatim_audit as va  # noqa: E402

BOOK = sys.argv[1] if len(sys.argv) > 1 else "epigenetics"
ONLY = sys.argv[2] if len(sys.argv) > 2 else None

syn = va.load_syn()
cond, claim_by_id, txt_by_bid = va._load_corpus()
violations, classified = va.audit()
txt = txt_by_bid[BOOK]

# claim -> list of (slug, kind) violating, for this book
by_claim = {}
for cid, slug, kind, bid in classified:
    if bid == BOOK:
        by_claim.setdefault(cid, []).append((slug, kind))


def phrase_regex(p):
    # p is normalized (lowercase, [a-z0-9 ]). Build a raw-text regex.
    toks = p.split()
    if not toks:
        return None
    if len(toks) == 1:
        return re.compile(r"(?<![a-z])" + re.escape(toks[0]) + r"(?![a-z])", re.I)
    return re.compile(r"(?<![a-z])" + r"[^a-z0-9]{0,3}".join(re.escape(t) for t in toks) + r"(?![a-z])", re.I)


def find_in_window(phrases, lo, hi):
    """Return (start,end) of earliest match of any phrase in txt[lo:hi], or None."""
    best = None
    for p in phrases:
        rx = phrase_regex(p)
        if not rx:
            continue
        m = rx.search(txt, lo, hi)
        if m and (best is None or m.start() < best[0]):
            best = (m.start(), m.end())
    return best


for cid in sorted(by_claim) if not ONLY else [ONLY]:
    if cid not in by_claim:
        continue
    c = claim_by_id[cid]
    off = c["locator"].get("char_offset")
    vb = c.get("verbatim", "")
    lo_search, hi_search = max(0, off - 400), off + len(vb) + 1400
    # all mapped conditions + symptoms (audit only checks conditions, but report both)
    mapped = [("C", s) for s in c.get("conditions", [])] + [("S", s) for s in c.get("symptoms", [])]
    notfound = []
    found_positions = []
    for tag, slug in mapped:
        disp = cond.get(slug, {}).get("display_name", slug) if isinstance(cond.get(slug), dict) else slug
        phrases = va.accepted_phrases(slug, disp, syn)
        pos = find_in_window(phrases, lo_search, hi_search)
        if pos is None:
            notfound.append(f"{tag}:{slug}")
        else:
            found_positions.append((pos[0], pos[1], slug))
    # RELOCATE-aware: bounding box over the found CONDITION names only (verbatim need
    # not include the old offset). This is the true "fits in one <=500 verbatim?" test.
    if found_positions:
        span_lo = min(p[0] for p in found_positions)
        span_hi = max(p[1] for p in found_positions)
    else:
        span_lo, span_hi = off, off + len(vb)
    span_len = span_hi - span_lo
    print("=" * 80)
    print(f"{cid}  off={off} vb={len(vb)}c  -> needed span [{span_lo},{span_hi}] = {span_len}c  {'<=500 OK' if span_len<=500 else '>>500 TOO LONG'}")
    print(f"  NOT-FOUND in window (drop/extend-far): {notfound}")
    # show span text (extend hi to next newline for clean boundary preview)
    prev = txt[span_lo: span_hi]
    print(f"  SPAN TEXT:\n{prev}")
    print()
