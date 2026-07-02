#!/usr/bin/env python3
"""book_purify_apply.py — apply an AUDITED purification spec to a source book .txt.

The deterministic applier half of the Source-Purification campaign (the scanner is
book_purity.py). Driven by a per-book spec at eden/tools/purity-specs/<book>.json
that RECORDS every correction + its rationale — the spec IS the audit trail, so a
future reviewer sees exactly what changed and why.

Safety by construction:
  * Every replacement asserts an exact occurrence `expect` count; ANY mismatch aborts
    with nothing written (a spec can never silently over/under-replace).
  * Running-header stripping removes only content lines byte-equal to the declared
    header text, except explicit keep_lines (the genuine title pages).
  * Writes route through safe_write (§17); default is a DRY report.

It also AUTO-DERIVES the resnap --fix map: for any sealed verbatim containing a
`find`, it applies the same replacements to produce the corrected verbatim, so a
letter-fix propagates to every mined span mechanically (the RARE/LETS multiplier).

Spec shape:
{
  "book": "iaiyh",
  "strip_running_header": {"text": "<exact header line>", "keep_lines": [8, 13]},
  "replacements": [ {"find": "...", "repl": "...", "expect": 1, "why": "..."} , ... ]
}

CLI:
  dry     --book <id>                    report the changes a spec would make
  write   --book <id>                    apply to the book via safe_write
  fixmap  --book <id> --out <path>       write the resnap --fix map (broken verbatims)
"""
import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CORPUS = ROOT / "eden" / "corpus"
META_PATH = CORPUS / "books-meta.json"
CLAIMS_DIR = CORPUS / "claims"
SPEC_DIR = Path(__file__).resolve().parent / "purity-specs"
sys.path.insert(0, str(ROOT / "tools"))
import safe_write  # noqa: E402


def lf_text(p: Path) -> str:
    return p.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n")


def load_spec(book_id: str) -> dict:
    p = SPEC_DIR / f"{book_id}.json"
    if not p.exists():
        print(f"no spec at {p.relative_to(ROOT)}")
        sys.exit(2)
    return json.loads(p.read_text(encoding="utf-8"))


def book_path(book_id: str) -> Path:
    meta = json.loads(META_PATH.read_text(encoding="utf-8"))
    for b in meta["books"]:
        if b["book_id"] == book_id:
            return ROOT / b["file"]
    print(f"unknown book_id '{book_id}'")
    sys.exit(2)


def apply_replacements(text: str, replacements: list) -> tuple[str, list]:
    """Apply each replacement, asserting its exact expected count. Returns (new_text,
    log). Aborts the process on any count mismatch — nothing gets written."""
    log = []
    for r in replacements:
        find, repl, expect = r["find"], r["repl"], r.get("expect")
        n = text.count(find)
        if expect is not None and n != expect:
            print(f"ABORT — replacement count mismatch for {find!r}: found {n}, expected {expect}")
            print(f"        ({r.get('why','')})")
            sys.exit(1)
        text = text.replace(find, repl)
        log.append(f"  {find!r} -> {repl!r}  ×{n}   [{r.get('why','')}]")
    return text, log


def strip_header(text: str, cfg: dict) -> tuple[str, int]:
    """Drop content lines byte-equal to the running header, except keep_lines."""
    if not cfg:
        return text, 0
    header = cfg["text"].strip()
    keep = set(cfg.get("keep_lines", []))
    out, removed = [], 0
    for i, ln in enumerate(text.split("\n"), start=1):
        if ln.strip() == header and i not in keep:
            removed += 1
            continue
        out.append(ln)
    return "\n".join(out), removed


def transform(book_id: str):
    spec = load_spec(book_id)
    text = lf_text(book_path(book_id))
    before = text
    text, rlog = apply_replacements(text, spec.get("replacements", []))
    text, n_hdr = strip_header(text, spec.get("strip_running_header"))
    return spec, before, text, rlog, n_hdr


def cmd_dry(args):
    spec, before, after, rlog, n_hdr = transform(args.book)
    print(f"=== purify DRY — {args.book} ===")
    print(f"  replacements ({len(rlog)}):")
    for line in rlog:
        print(line)
    print(f"  running-header lines stripped: {n_hdr}  (kept: {spec.get('strip_running_header',{}).get('keep_lines',[])})")
    print(f"  size: {len(before)} -> {len(after)} chars  (Δ {len(after)-len(before)})")
    if args.flags and spec.get("flags"):
        print("  FLAGGED for human ruling (NOT auto-applied):")
        for f in spec["flags"]:
            print(f"    - {f}")


def cmd_write(args):
    spec, before, after, rlog, n_hdr = transform(args.book)
    if after == before:
        print("no change — nothing to write")
        return
    n = safe_write.safe_rewrite(book_path(args.book), after)
    print(f"OK wrote {book_path(args.book).relative_to(ROOT)} ({n} B) — "
          f"{len(rlog)} replacement group(s), {n_hdr} header line(s) stripped")


def cmd_fixmap(args):
    """Auto-derive {claim_id: corrected_verbatim} for verbatims touched by a `find`."""
    spec = load_spec(args.book)
    reps = spec.get("replacements", [])
    shard = CLAIMS_DIR / f"claims-{args.book}.json"
    claims = json.loads(shard.read_text(encoding="utf-8")).get("claims", [])
    fixmap = {}
    for c in claims:
        vb = c.get("verbatim", "")
        new_vb = vb
        for r in reps:
            if r["find"] in new_vb:
                new_vb = new_vb.replace(r["find"], r["repl"])
        if new_vb != vb:
            fixmap[c["id"]] = new_vb
    out = Path(args.out)
    out.write_text(json.dumps(fixmap, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"OK wrote fix map for {len(fixmap)} verbatim(s) -> {out}")
    for cid in fixmap:
        print(f"    {cid}")


def main():
    ap = argparse.ArgumentParser(description="apply an audited purification spec to a book")
    sub = ap.add_subparsers(dest="cmd", required=True)
    d = sub.add_parser("dry"); d.add_argument("--book", required=True); d.add_argument("--flags", action="store_true"); d.set_defaults(func=cmd_dry)
    w = sub.add_parser("write"); w.add_argument("--book", required=True); w.set_defaults(func=cmd_write)
    f = sub.add_parser("fixmap"); f.add_argument("--book", required=True); f.add_argument("--out", required=True); f.set_defaults(func=cmd_fixmap)
    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
