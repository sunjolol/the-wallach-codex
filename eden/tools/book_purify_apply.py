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
  * The regex running-line stripper (`strip_running`) re-derives its target lines from
    the declared patterns and asserts each family's expected drop/strip count — a
    count mismatch aborts. Every stripped line is re-validated to look like a header.
  * Writes route through safe_write (§17); default is a DRY report.

It also AUTO-DERIVES the resnap --fix map: for any sealed verbatim containing a
`find`, it applies the same replacements to produce the corrected verbatim, so a
letter-fix propagates to every mined span mechanically (the RARE/LETS multiplier).

Spec shape (all sections optional; applied in this order — replacements, strip_header,
strip_running, line_fuses):
{
  "book": "iaiyh",
  "replacements": [ {"find": "...", "repl": "...", "expect": 1, "word": false, "why": "..."} ],
  "strip_running_header": {"text": "<exact header line>", "keep_lines": [8, 13]},
  "strip_running": {                         # regex running-header/footer strip (DDDL-class)
     "front_matter_end": 89,                 # never strip lines 1..N (title/copyright/TOC)
     "keep_lines": [],                       # extra 1-based lines to never strip
     "verso_pattern": "<regex matched at line start; prefix removed>",
     "recto_pattern": "<regex with named groups t (title) + pg (page)>",
     "recto_page_min": 13, "recto_page_max": 410,
     "recto_allow_digit_titles": ["20/20"],  # titles that legitimately contain digits
     "content_not_head": [12000, 12387],     # recto-shaped lines that are real content
     "expect": {"verso_drop": 39, "verso_strip": 154, "recto_drop": 167}
  },
  "line_fuses": [ {"a": "reproduc", "b": "tion", "expect": 1, "why": "page-break split"} ]
}

CLI:
  dry     --book <id>  [--flags]         report the changes a spec would make
  write   --book <id>                    apply to the book via safe_write
  fixmap  --book <id> --out <path>       write the resnap --fix map (broken verbatims)
"""
import argparse
import json
import re
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


def _apply_one(text: str, r: dict) -> tuple[str, int]:
    """Apply one replacement, honouring `word` (whole-word regex boundary — required
    when the OCR form is a substring of a real word, e.g. 'develope' inside
    'developed'). Asserts the exact `expect` count; aborts on mismatch."""
    find, repl, expect, word = r["find"], r["repl"], r.get("expect"), r.get("word")
    if word:
        pat = re.compile(r"(?<![A-Za-z])" + re.escape(find) + r"(?![A-Za-z])")
        n = len(pat.findall(text))
    else:
        n = text.count(find)
    if expect is not None and n != expect:
        print(f"ABORT — replacement count mismatch for {find!r}: found {n}, expected {expect}")
        print(f"        ({r.get('why','')})")
        sys.exit(1)
    text = pat.sub(repl, text) if word else text.replace(find, repl)
    return text, n


def apply_replacements(text: str, replacements: list) -> tuple[str, list]:
    """Apply each replacement in order. Returns (new_text, log). Aborts on any count
    mismatch — nothing gets written."""
    log = []
    for r in replacements:
        text, n = _apply_one(text, r)
        w = " (word)" if r.get("word") else ""
        log.append(f"  {r['find']!r} -> {r['repl']!r}  ×{n}{w}   [{r.get('why','')}]")
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


def strip_running(text: str, cfg: dict) -> tuple[str, dict]:
    """Regex running-header/footer strip for books whose header varies per page
    (attached page numbers, per-chapter titles) so byte-equal strip_header can't
    catch it. Two families:
      * verso  — matched at line start; the matched prefix is REMOVED. If content
                 trails on the same line (the next page's first words glued on by the
                 OCR) that content is kept; otherwise the whole line is dropped.
      * recto  — a '<chapter title> - <page>' line; the whole line is dropped after
                 validating it looks like a head (page in range, title not prose).
    Front-matter lines (<= front_matter_end) and keep_lines are never touched.
    Each family's drop/strip counts are asserted against cfg['expect'] — a mismatch
    aborts, so the strip can never silently over/under-remove."""
    if not cfg:
        return text, {}
    fm_end = cfg.get("front_matter_end", 0)
    keep = set(cfg.get("keep_lines", []))
    verso = re.compile(cfg["verso_pattern"], re.I) if cfg.get("verso_pattern") else None
    recto = re.compile(cfg["recto_pattern"]) if cfg.get("recto_pattern") else None
    pg_min, pg_max = cfg.get("recto_page_min", 1), cfg.get("recto_page_max", 9999)
    allow_digit = set(cfg.get("recto_allow_digit_titles", []))
    not_head = set(cfg.get("content_not_head", []))
    # explicit bare page/chapter-number lines to drop (isolated numbers the OCR left
    # at page boundaries). Each is asserted to actually be a bare number before drop.
    drop_nums = set(cfg.get("drop_line_numbers", []))
    tail_prose = re.compile(r"\b(at|as|of|and|the|to|include|should|avoid)\s*$", re.I)

    out, st = [], {"verso_drop": 0, "verso_strip": 0, "recto_drop": 0, "num_drop": 0, "bad": []}
    for i, ln in enumerate(text.split("\n"), start=1):
        if i <= fm_end or i in keep:
            out.append(ln); continue
        if i in drop_nums:
            if not re.fullmatch(r"\s*\d{1,4}\s*", ln):
                print(f"ABORT — drop_line_numbers L{i} is not a bare number: {ln.strip()!r}")
                sys.exit(1)
            st["num_drop"] += 1
            continue
        if verso:
            mv = verso.match(ln)
            if mv:
                tail = ln[mv.end():].strip()
                if tail:
                    st["verso_strip"] += 1; out.append(tail)
                else:
                    st["verso_drop"] += 1
                continue
        if recto:
            mr = recto.match(ln)
            if mr and i not in not_head:
                title, pg = mr.group("t").strip(), int(mr.group("pg"))
                alpha = re.sub(r"[^A-Za-z]", "", title)
                looks_head = (pg_min <= pg <= pg_max and len(alpha) >= 5
                              and not re.search(r"\d", title)
                              and not tail_prose.search(title))
                if title in allow_digit:
                    looks_head = pg_min <= pg <= pg_max
                if looks_head:
                    st["recto_drop"] += 1
                    continue
                st["bad"].append((i, ln.strip()))
        out.append(ln)

    exp = cfg.get("expect", {})
    for k in ("verso_drop", "verso_strip", "recto_drop", "num_drop"):
        if k in exp and exp[k] != st[k]:
            print(f"ABORT — strip_running {k} count mismatch: got {st[k]}, expected {exp[k]}")
            sys.exit(1)
    return "\n".join(out), st


def apply_fuses(text: str, fuses: list) -> tuple[str, list]:
    """Join a word the OCR split across a stripped running-header line: 'a\\nb' -> 'ab'
    (no space). Only for TRUE mid-word breaks (both halves lowercase fragments); a
    two-word wrap is left to the newline->space of normal rendering. Count-asserted."""
    log = []
    for f in fuses:
        needle = f"{f['a']}\n{f['b']}"
        n = text.count(needle)
        if f.get("expect") is not None and n != f["expect"]:
            print(f"ABORT — fuse count mismatch for {needle!r}: found {n}, expected {f['expect']}")
            sys.exit(1)
        text = text.replace(needle, f["a"] + f["b"])
        log.append(f"  {f['a']!r}+{f['b']!r} -> {f['a']+f['b']!r}  ×{n}   [{f.get('why','')}]")
    return text, log


def transform(book_id: str):
    spec = load_spec(book_id)
    text = lf_text(book_path(book_id))
    before = text
    text, rlog = apply_replacements(text, spec.get("replacements", []))
    text, n_hdr = strip_header(text, spec.get("strip_running_header"))
    text, rstats = strip_running(text, spec.get("strip_running"))
    text, flog = apply_fuses(text, spec.get("line_fuses", []))
    stats = {"n_hdr": n_hdr, "rstats": rstats, "flog": flog}
    return spec, before, text, rlog, stats


def cmd_dry(args):
    spec, before, after, rlog, stats = transform(args.book)
    print(f"=== purify DRY — {args.book} ===")
    print(f"  replacements ({len(rlog)}):")
    for line in rlog:
        print(line)
    if stats["flog"]:
        print(f"  line fuses ({len(stats['flog'])}):")
        for line in stats["flog"]:
            print(line)
    if stats["n_hdr"]:
        print(f"  byte-equal header lines stripped: {stats['n_hdr']}  "
              f"(kept: {spec.get('strip_running_header',{}).get('keep_lines',[])})")
    rs = stats["rstats"]
    if rs:
        print(f"  running-line strip: verso_drop={rs['verso_drop']} verso_strip={rs['verso_strip']} "
              f"recto_drop={rs['recto_drop']} num_drop={rs['num_drop']}  "
              f"(total {rs['verso_drop']+rs['verso_strip']+rs['recto_drop']+rs['num_drop']})")
        if rs["bad"]:
            print(f"  !! {len(rs['bad'])} dropped lines did NOT look like a header:")
            for i, t in rs["bad"][:10]:
                print(f"       L{i}: {t!r}")
    print(f"  size: {len(before)} -> {len(after)} chars  (Δ {len(after)-len(before)})")
    if args.flags and spec.get("flags"):
        print(f"  FLAGGED for human ruling ({len(spec['flags'])}, NOT auto-applied):")
        for f in spec["flags"]:
            print(f"    - {f}")


def cmd_write(args):
    spec, before, after, rlog, stats = transform(args.book)
    if after == before:
        print("no change — nothing to write")
        return
    n = safe_write.safe_rewrite(book_path(args.book), after)
    rs = stats["rstats"]
    strip_n = (rs.get("verso_drop", 0) + rs.get("verso_strip", 0) + rs.get("recto_drop", 0)
               + rs.get("num_drop", 0)) if rs else 0
    print(f"OK wrote {book_path(args.book).relative_to(ROOT)} ({n} B) — "
          f"{len(rlog)} replacement group(s), {stats['n_hdr']} byte-equal header line(s), "
          f"{strip_n} running-line(s), {len(stats['flog'])} fuse(s)")


def cmd_fixmap(args):
    """Auto-derive {claim_id: corrected_verbatim} for verbatims touched by a `find`.
    Honours the `word` boundary flag so a whole-word fix propagates correctly."""
    spec = load_spec(args.book)
    reps = spec.get("replacements", [])
    shard = CLAIMS_DIR / f"claims-{args.book}.json"
    claims = json.loads(shard.read_text(encoding="utf-8")).get("claims", [])
    fixmap = {}
    for c in claims:
        vb = c.get("verbatim", "")
        new_vb = vb
        for r in reps:
            if r.get("word"):
                pat = re.compile(r"(?<![A-Za-z])" + re.escape(r["find"]) + r"(?![A-Za-z])")
                new_vb = pat.sub(r["repl"], new_vb)
            elif r["find"] in new_vb:
                new_vb = new_vb.replace(r["find"], r["repl"])
        for f in spec.get("line_fuses", []):
            # verbatims are stored reflowed (no embedded newline) — fuse the space form
            new_vb = new_vb.replace(f"{f['a']} {f['b']}", f["a"] + f["b"])
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
