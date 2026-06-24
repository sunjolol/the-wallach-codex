#!/usr/bin/env python3
"""corpus_extract.py — deterministic extraction tooling for one book.

The DETERMINISTIC half of the agent-in-the-loop pipeline (proposal §5). It never
calls an LLM and never decides what a claim means. Two subcommands:

  prescan  — read-only survey of a book (paragraph + dose-candidate counts).
  finalize — take agent-authored raw claims (the SEMANTIC content: kind, slugs,
             claim_text, verbatim) and deterministically finish them: snap each
             verbatim to the EXACT book bytes (tolerating the book's mid-sentence
             line-wraps + curly quotes), compute char_offset, assign a stable
             WAL-CLM id, validate, and emit drafts/claims-<book>.draft.json plus a
             human-readable drafts/reports/<book>.report.md review surface.

The agent authors meaning; this tool guarantees every stored verbatim is real book
text. The book is always the source. Luneth reviews the report; corpus_seal.py
(user/dev-run) promotes the reviewed draft into claims/.

Usage:
  python eden/tools/corpus_extract.py prescan  --book dddl-3e-2011
  python eden/tools/corpus_extract.py finalize --book dddl-3e-2011 --raw <raw.json>
"""
import argparse
import datetime
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
CORPUS = ROOT / "eden" / "corpus"
META_PATH = CORPUS / "books-meta.json"
CANON_PATH = CORPUS / "essentials-canon.json"
CLAIMS_DIR = CORPUS / "claims"
DRAFTS_DIR = CORPUS / "drafts"
REPORTS_DIR = DRAFTS_DIR / "reports"

DOSE_RE = re.compile(r"\b\d[\d,\.]*\s?(mg|mcg|µg|ug|g|iu|i\.u\.|grams?|milligrams?|micrograms?)\b", re.I)

KINDS = {"dose", "protocol", "deficiency_sign", "mechanism", "food_source", "interaction",
         "contraindication", "prognosis", "diagnostic_pattern", "prevalence", "quote",
         "definition", "personal_anecdote"}

_FOLD = {"‘": "'", "’": "'", "“": '"', "”": '"',
         "—": "-", "–": "-", "′": "'", "`": "'"}


def lf_text(p: Path) -> str:
    return p.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n")


def book_entry(book_id: str):
    meta = json.loads(META_PATH.read_text(encoding="utf-8"))
    for b in meta.get("books", []):
        if b.get("book_id") == book_id:
            return b
    return None


def book_short(book_id: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", book_id.upper().split("-")[0])[:6] or "BOOK"


def build_norm(text: str):
    """Whitespace-collapsed + quote/dash-folded copy of text, with an index map
    norm_pos -> original_pos. Lets an agent-typed verbatim (single spaces, straight
    quotes) locate a passage the book stores with line-wraps + curly punctuation."""
    out, idx, i, n = [], [], 0, len(text)
    while i < n:
        c = text[i]
        if c.isspace():
            out.append(" ")
            idx.append(i)
            while i < n and text[i].isspace():
                i += 1
        else:
            out.append(_FOLD.get(c, c))
            idx.append(i)
            i += 1
    return "".join(out), idx


def norm_query(s: str) -> str:
    s = "".join(_FOLD.get(c, c) for c in s)
    return " ".join(s.split())


def snap_verbatim(book_text: str, norm_book: str, idx_map, raw_vb: str):
    """Return (exact_substring, char_offset) or (None, None) if not locatable."""
    if raw_vb in book_text:
        return raw_vb, book_text.index(raw_vb)
    nq = norm_query(raw_vb)
    pos = norm_book.find(nq)
    if pos < 0:
        return None, None
    start = idx_map[pos]
    end = idx_map[pos + len(nq) - 1]
    return book_text[start:end + 1], start


def existing_max_seq(book_id: str) -> int:
    """Highest WAL-CLM sequence already used for this book (claims/ + draft)."""
    short = book_short(book_id)
    pat = re.compile(rf"WAL-CLM-{short}-(\d+)")
    hi = 0
    candidates = list(CLAIMS_DIR.glob(f"claims-{book_id}.json")) + list(DRAFTS_DIR.glob(f"claims-{book_id}.draft.json"))
    for p in candidates:
        for m in pat.finditer(p.read_text(encoding="utf-8")):
            hi = max(hi, int(m.group(1)))
    return hi


def cmd_prescan(args) -> int:
    b = book_entry(args.book)
    if not b:
        print(f"unknown book_id '{args.book}'"); return 1
    txt = lf_text(ROOT / b["file"])
    paras = [c for c in re.split(r"\n\s*\n", txt) if c.strip()]
    print(f"DRY PRE-SCAN — {args.book} ({b.get('title')})")
    print(f"  scheme           : {b.get('locator_scheme')}")
    print(f"  chars (LF)       : {len(txt)}")
    print(f"  paragraph chunks : {len(paras)}")
    print(f"  dose candidates  : {len(list(DOSE_RE.finditer(txt)))}")
    return 0


def cmd_finalize(args) -> int:
    b = book_entry(args.book)
    if not b:
        print(f"unknown book_id '{args.book}'"); return 1
    book_text = lf_text(ROOT / b["file"])
    norm_book, idx_map = build_norm(book_text)
    canon = {e["slug"] for e in json.loads(CANON_PATH.read_text(encoding="utf-8"))["essentials"]}
    raw = json.loads(Path(args.raw).read_text(encoding="utf-8"))
    if isinstance(raw, dict):
        raw = raw.get("claims", [])

    short = book_short(args.book)
    seq = existing_max_seq(args.book)
    now = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    errors, claims = [], []

    for n, rc in enumerate(raw, 1):
        ctx = f"raw[{n}]"
        kind = rc.get("kind")
        if kind not in KINDS:
            errors.append(f"{ctx}: bad kind {kind!r}")
        if not rc.get("claim_text"):
            errors.append(f"{ctx}: missing claim_text")
        bad = [s for s in rc.get("essentials", []) if s not in canon]
        if bad:
            errors.append(f"{ctx}: non-canon essential slug(s) {bad}")
        vb_raw = rc.get("verbatim", "")
        exact, off = snap_verbatim(book_text, norm_book, idx_map, vb_raw)
        if exact is None:
            errors.append(f"{ctx}: verbatim NOT found in book — '{vb_raw[:60]}...'")
            continue
        if not (60 <= len(exact) <= 500):
            errors.append(f"{ctx}: snapped verbatim length {len(exact)} outside 60-500")
            continue
        seq += 1
        claims.append({
            "id": f"WAL-CLM-{short}-{seq:06d}",
            "kind": kind,
            "essentials": rc.get("essentials", []),
            "other_substances": rc.get("other_substances", []),
            "conditions": rc.get("conditions", []),
            "symptoms": rc.get("symptoms", []),
            "claim_text": rc.get("claim_text", ""),
            "verbatim": exact,
            "locator": {
                "book": args.book, "scheme": b.get("locator_scheme"),
                "chapter": rc.get("chapter"), "page": rc.get("page"),
                "screenshot": rc.get("screenshot"), "kindle_location": rc.get("kindle_location"),
                "char_offset": off,
            },
            "dose": rc.get("dose"),
            "tags": rc.get("tags", []),
            "confidence": rc.get("confidence", "medium"),
            "review_state": "draft",
            "superseded_by": None,
            "extracted_at": now, "reviewed_at": None, "reviewed_by": None,
        })

    if errors:
        print(f"FINALIZE FAILED — {len(errors)} error(s), nothing written:")
        for e in errors:
            print(f"  - {e}")
        return 1

    DRAFTS_DIR.mkdir(exist_ok=True)
    REPORTS_DIR.mkdir(exist_ok=True)
    existing = []
    shard = CLAIMS_DIR / f"claims-{args.book}.json"
    if shard.exists():
        existing = json.loads(shard.read_text(encoding="utf-8")).get("claims", [])
    draft = {"schema_version": 1, "book_id": args.book, "knowledge_version": None, "claims": existing + claims}
    draft_path = DRAFTS_DIR / f"claims-{args.book}.draft.json"
    draft_path.write_text(json.dumps(draft, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # human review surface
    lines = [f"# Extraction report — {args.book} ({b.get('title')})", "",
             f"_{len(claims)} claim(s) drafted {now}. Review then run corpus_seal.py to promote._", ""]
    by_kind = {}
    for c in claims:
        by_kind.setdefault(c["kind"], 0)
        by_kind[c["kind"]] += 1
    lines.append("Kinds: " + ", ".join(f"{k}×{v}" for k, v in sorted(by_kind.items())))
    lines.append("")
    for c in claims:
        lines.append(f"### {c['id']} · {c['kind']}")
        ess = ", ".join(c["essentials"]) or "—"
        cond = ", ".join(c["conditions"]) or "—"
        sym = ", ".join(c["symptoms"]) or "—"
        lines.append(f"- **essentials:** {ess} · **conditions:** {cond} · **symptoms:** {sym}")
        if c["dose"]:
            lines.append(f"- **dose:** {c['dose']}")
        lines.append(f"- **claim:** {c['claim_text']}")
        lines.append(f"- **verbatim** (offset {c['locator']['char_offset']}): “{c['verbatim']}”")
        lines.append("")
    (REPORTS_DIR / f"{args.book}.report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"FINALIZED {len(claims)} new claim(s); draft now holds {len(existing) + len(claims)} total → {draft_path.relative_to(ROOT)}")
    print(f"  report → {(REPORTS_DIR / (args.book + '.report.md')).relative_to(ROOT)}")
    print(f"  kinds: {by_kind}")
    print(f"  every verbatim snapped to exact book bytes ✓")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="Deterministic extraction tooling for one book.")
    sub = ap.add_subparsers(dest="cmd", required=True)
    p1 = sub.add_parser("prescan"); p1.add_argument("--book", required=True)
    p2 = sub.add_parser("finalize"); p2.add_argument("--book", required=True); p2.add_argument("--raw", required=True)
    args = ap.parse_args()
    if args.cmd == "prescan":
        return cmd_prescan(args)
    return cmd_finalize(args)


if __name__ == "__main__":
    sys.exit(main())
