#!/usr/bin/env python3
"""vb_apply.py — apply verbatim-remediation edits to a book's DRAFT shard.

Edit spec (JSON): { claim_id: { "start": "...", "end": "...", "drop": [slugs] } }
  - start/end: unique-ish anchors; the new verbatim = txt[start_idx : end_idx+len(end)],
    where start_idx is the occurrence of `start` NEAREST the claim's current char_offset,
    and end_idx is the first `end` at/after start_idx. char_offset is reset to start_idx.
  - drop: condition slugs to remove from the claim's conditions[] (mapping drop).
  - Either key optional (verbatim-only, or drop-only edit).

Validates transactionally: length 60-1200 (500=soft report threshold), exact substring, and that EVERY remaining
mapped condition is NAMED by the new verbatim (via verbatim_audit's matcher, so the
same rule the invariant enforces). Writes nothing unless ALL claims pass (--write);
default is dry-run.

Usage: python vb_apply.py <book_id> <spec.json> [--write]
"""
import json
import sys
from pathlib import Path

# ROOT resolves from this file's location (eden/tools/<file> -> parents[2] = repo
# root), so the tool operates on the tree it lives in -- including a git worktree.
# (A hardcoded main-repo path silently read/WROTE the wrong tree from a worktree.)
ROOT = Path(__file__).resolve().parents[2]
AUDIT_DIR = ROOT / "eden" / "tools"
sys.path.insert(0, str(AUDIT_DIR))
sys.path.insert(0, str(ROOT / "tools"))
import verbatim_audit as va  # noqa: E402

BOOK = sys.argv[1]
SPEC = Path(sys.argv[2])
WRITE = "--write" in sys.argv[3:]

DRAFT = ROOT / "eden" / "corpus" / "drafts" / f"claims-{BOOK}.draft.json"
spec = json.loads(SPEC.read_text(encoding="utf-8"))
syn = va.load_syn()
cond, _, txt_by_bid = va._load_corpus()
txt = txt_by_bid[BOOK]
_draft_raw = DRAFT.read_text(encoding="utf-8")
draft = json.loads(_draft_raw)
by_id = {c["id"]: c for c in draft["claims"]}

# Measure the draft's indent BEFORE any claim is mutated -- afterwards the original
# bytes can no longer be reproduced, so the check has to happen here. A hardcoded indent
# re-spaces every claim in the file, and corpus_seal promotes the draft's own bytes onto
# the sealed shard, so the real edit disappears into a whole-file diff. Measure, never
# assume.
INDENT = next((n for n in (1, 2, 3, 4)
               if json.dumps(draft, indent=n, ensure_ascii=False) + "\n" == _draft_raw), None)
if INDENT is None:
    # Name the likeliest cause: this compares against LF-joined output, so a
    # CRLF draft fails all four indents even when its indent is fine. This has happened
    # to real drafts, so name it rather than leaving "no indent reproduces it" as the
    # only clue.
    _crlf = "\r\n" in _draft_raw
    raise SystemExit(
        f"REFUSING TO WRITE {DRAFT}: no indent 1-4 reproduces it byte-exactly"
        + (" -- the file has CRLF line endings; this check assumes LF" if _crlf else ""))

errors, applied = [], []


def nearest_occurrence(needle, near):
    idx, best = -1, None
    start = 0
    while True:
        j = txt.find(needle, start)
        if j < 0:
            break
        if best is None or abs(j - near) < abs(best - near):
            best = j
        start = j + 1
    return best if best is not None else -1


for cid, ed in spec.items():
    c = by_id.get(cid)
    if c is None:
        errors.append(f"{cid}: not in draft")
        continue
    cur_off = c["locator"].get("char_offset") or 0
    if "start" in ed and "end" in ed:
        s = nearest_occurrence(ed["start"], cur_off)
        if s < 0:
            errors.append(f"{cid}: start anchor not found: {ed['start']!r}")
            continue
        e = txt.find(ed["end"], s)
        if e < 0:
            errors.append(f"{cid}: end anchor not found after start: {ed['end']!r}")
            continue
        new_vb = txt[s: e + len(ed["end"])]
        if not (60 <= len(new_vb) <= 1200):
            errors.append(f"{cid}: verbatim length {len(new_vb)} outside 60-1200")
            continue
        if len(new_vb) > 500:
            # SOFT-500 exceeded: allowed when completeness needs it, but ALWAYS
            # surfaced for a human spot-check.
            print(f"  NOTE {cid}: verbatim {len(new_vb)}c > soft-500 (allowed; flag for review)")
        c["verbatim"] = new_vb
        c["locator"]["char_offset"] = s
    # drops
    for slug in ed.get("drop", []):
        if slug in c["conditions"]:
            c["conditions"].remove(slug)
        else:
            errors.append(f"{cid}: drop slug '{slug}' not in conditions")
    # validate naming for remaining conditions
    vbn = va.norm(c["verbatim"])
    keep_unnamed = set(ed.get("keep_unnamed", []))
    unnamed, acknowledged = [], []
    for slug in c["conditions"]:
        disp = cond.get(slug, {}).get("display_name", slug) if isinstance(cond.get(slug), dict) else slug
        if not va.names(vbn, slug, disp, syn):
            (acknowledged if slug in keep_unnamed else unnamed).append(slug)
    if unnamed:
        errors.append(f"{cid}: verbatim still does NOT name {unnamed}")
    if acknowledged:
        # explicit residual violations — orphaned conditions deferred to a later pass
        # (e.g. OCR-garbled table cells). Tolerated by the baseline, flagged loudly here.
        print(f"  WARN {cid}: keeping {len(acknowledged)} ACKNOWLEDGED residual violation(s): {acknowledged}")
    applied.append((cid, len(c["verbatim"]), c["locator"]["char_offset"], c["conditions"]))

print(f"=== vb_apply {BOOK} ({'WRITE' if WRITE else 'DRY-RUN'}) ===")
for cid, ln, off, conds in applied:
    print(f"  {cid}  vb={ln}c off={off}  conditions({len(conds)})={conds}")
if errors:
    print("\nERRORS (nothing written):")
    for e in errors:
        print(f"  ! {e}")
    sys.exit(1)
if WRITE:
    import safe_write
    payload = json.dumps(draft, ensure_ascii=False, indent=INDENT) + "\n"
    n = safe_write.safe_rewrite(DRAFT, payload)
    print(f"\nOK wrote draft ({n} B).")
else:
    print("\nDRY-RUN ok — all edits valid. Re-run with --write to apply.")
