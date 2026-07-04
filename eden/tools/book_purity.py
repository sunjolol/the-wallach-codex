#!/usr/bin/env python3
"""book_purity.py — scan a source book .txt for OCR/typographic defects.

The scanner for the Source-Purification campaign (the "purify-then-mine" invert).
anomaly_scan.py scans only surfaced CLAIMS; its docstring defers "a full book-text
pass" — this IS that pass. Surfaces EVERY defect class of a book in ONE audited
report so a book is brought to PRISTINE in a single sweep, never whack-a-mole
([[perfect-entry-no-deferral]]). It becomes the engine for the future
`book_source_clean` invariant (the gate that keeps a purified book pristine).

NEVER auto-fixes — it FLAGS. Findings carry a disposition so the human eye and any
future auto-fixer agree on what is mechanical vs judgment:
  AUTO   — high-confidence mechanical (whitespace, safe hyphen reflow). A script may
           apply these; still shown so Luneth audits the sweep.
  REVIEW — judgment (hard-hyphen keeps, spell flags, run-togethers, running headers,
           completeness suspects) needing Luneth + (on doubt) the scanned PDF
           ([[reading-and-correcting-scanned-pdfs]] · [[linguistic-logic-sweep]]).

Structural tokens are EXCLUDED from content scanning (never defects):
  - '#'-prefixed provenance header lines (book top matter this tool wrote/read).
  - '===== ... =====' page/screenshot markers — the book's locator scheme; offsets
    anchor around them, they are never inside a verbatim.
  - '[FIGURE: ...]' / '[TABLE: ...]' human-authored transcriptions (completeness
    content deliberately added; not OCR to police).

CLI:
  report   --book <book_id> [--detector NAME] [--limit N]   human report
  json     --book <book_id>                                 machine surface (gate)
  books                                                      list known book_ids
"""
import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CORPUS = ROOT / "eden" / "corpus"
META_PATH = CORPUS / "books-meta.json"
HERE = Path(__file__).resolve().parent
LEX_PATH = HERE / "anomaly-lexicon.json"
BASELINE_DIR = HERE / "purity-baselines"  # per-book reviewed-OK allowlists

# ── structural line classes (excluded from content scanning) ───────────────────
RE_MARKER = re.compile(r"^\s*=====.*=====\s*$")
RE_HEADERC = re.compile(r"^\s*#")
RE_FIGURE = re.compile(r"^\s*\[(FIGURE|TABLE|IMAGE)\b", re.I)

# ── detector primitives ────────────────────────────────────────────────────────
RE_HYPHEN_WRAP = re.compile(r"([A-Za-z]{2,})-\n\s*([A-Za-z]{2,})")
RE_DOUBLE_SPACE = re.compile(r"\S(  +)\S")
RE_SPACE_PUNCT = re.compile(r" +([,.;:!?])")
RE_SPACE_PAREN = re.compile(r"\( +| +\)")
RE_DIGIT_TOKEN = re.compile(r"[A-Za-z]*\d[A-Za-z0-9]*|[A-Za-z]+\d[A-Za-z0-9]*")
RE_DOSE_CTX = re.compile(r"\b\d[\d,\.]*\s?(mg|mcg|µg|ug|g|gm|iu|i\.u\.|ml|cc|%|mm|cm)\b", re.I)
RE_ORDINAL = re.compile(r"^\d+(st|nd|rd|th)$", re.I)          # 6th, 4th — not errors
RE_MEDCODE = re.compile(r"^[A-Za-z]\d{1,2}[a-z]?$")           # C5, T1, C5a spinal roots
RE_ALPHANUM_OK = re.compile(r"^(mp3|mp4|co2|b12|h2o|d3|k2|omega3|pm|am)$", re.I)
RE_CASESHIFT = re.compile(r"[a-z]{2}[A-Z][a-z]{2}")
RE_LETTER_PAREN = re.compile(r"[A-Za-z]\([A-Za-z]")
RE_TOKEN = re.compile(r"[A-Za-z][A-Za-z'’\-]*[A-Za-z]|[A-Za-z]")

# chemical / stereochemistry prefixes whose trailing hyphen is real (keep on wrap)
CHEM_PREFIX = re.compile(r"^(B|L|D|DL|N|O|S|R|alpha|beta|gamma|para|ortho|meta|co|pre|non|anti|self|x)$", re.I)

# common abbreviations / web tokens the base English dict lacks but are never OCR typos
COMMON_ABBR = {"etc", "www", "com", "ebook", "vs", "ie", "eg", "hoc", "ph", "aka",
               "pdf", "isbn", "html", "http", "https", "usa", "llc", "inc"}


def load_meta_books():
    meta = json.loads(META_PATH.read_text(encoding="utf-8"))
    return {b["book_id"]: b for b in meta.get("books", [])}


def lf_text(p: Path) -> str:
    return p.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n")


def domain_known():
    """Union of English (pyspellchecker) + corpus terms + domain lexicon, lowercased.
    A token absent from all three is a spell_flag candidate."""
    known = set()
    # domain lexicon (herbs/genera/nutrients/hormones)
    try:
        d = json.loads(LEX_PATH.read_text(encoding="utf-8"))
        for key in ("herbs", "genera", "nutrients", "hormones"):
            for w in d.get(key, []):
                for t in re.findall(r"[a-z]{2,}", w.lower()):
                    known.add(t)
    except FileNotFoundError:
        pass
    # corpus terms (condition/essential slugs + display names)
    for idx in ("conditions.json", "essentials.json"):
        p = CORPUS / "indices" / idx
        if p.exists():
            dd = json.loads(p.read_text(encoding="utf-8"))
            for slug, info in dd.items():
                if slug.startswith("_"):
                    continue
                for t in re.findall(r"[a-z]{2,}", slug.lower().replace("_", " ")):
                    known.add(t)
                if isinstance(info, dict):
                    for t in re.findall(r"[a-z]{2,}", info.get("display_name", "").lower()):
                        known.add(t)
    return known


def get_speller():
    try:
        from spellchecker import SpellChecker
        return SpellChecker(distance=1)
    except Exception:
        return None


def detect_running_header(lines):
    """The line most-often appearing immediately after a page marker IS the running
    header (OCR-captured on every page). Returns its stripped text, or None."""
    after = Counter()
    for i, ln in enumerate(lines[:-1]):
        if RE_MARKER.match(ln):
            j = i + 1
            while j < len(lines) and not lines[j].strip():
                j += 1
            if j < len(lines) and lines[j].strip():
                after[lines[j].strip()] += 1
    if not after:
        return None
    top, n = after.most_common(1)[0]
    # a genuine running header repeats across many pages
    return top if n >= 3 and len(top) >= 12 else None


def is_content(ln: str) -> bool:
    return not (RE_MARKER.match(ln) or RE_HEADERC.match(ln) or RE_FIGURE.match(ln))


def is_marker_fragment(s: str) -> bool:
    """A short line immediately after a page marker that carries no real >=4-letter
    word and is not a bare page number -- i.e. failed running-header OCR garbage
    ("eee", "Sei ee a"), never a legit heading or first sentence. Tight by design:
    any >=4-letter word or a longer line escapes it, so false positives are ~nil."""
    s = s.strip()
    if not s or len(s) >= 15:
        return False
    if re.search(r"[A-Za-z]{4,}", s):
        return False
    if re.fullmatch(r"\d{1,4}", s):
        return False
    return True


def scan(book_text: str):
    """Yield findings: dict(detector, disposition, line, col, term, context, note)."""
    lines = book_text.split("\n")
    header = detect_running_header(lines)
    known = domain_known()
    spell = get_speller()
    findings = []

    # marker map: nearest preceding "===== ... =====" line (e.g. Screenshot (748))
    # so a reviewer can open the exact source page to verify a finding.
    markers = [(i, ln.strip().strip("= ").strip())
               for i, ln in enumerate(lines, start=1) if RE_MARKER.match(ln)]

    # first non-blank content line after each marker -- where failed running-header
    # OCR garbage lands (post_marker_fragment detector below keys on this set).
    first_after_marker = set()
    for _mln, _mtext in markers:
        j = _mln  # 0-indexed line right after the 1-indexed marker line
        while j < len(lines) and not lines[j].strip():
            j += 1
        if j < len(lines):
            first_after_marker.add(j + 1)  # store 1-indexed line number

    def source_ref(line_no):
        ref = ""
        for mln, mtext in markers:
            if mln <= line_no:
                ref = mtext
            else:
                break
        return ref

    def ctx(line_no, s, e):
        ln = lines[line_no - 1]
        lo, hi = max(0, s - 30), min(len(ln), e + 30)
        return ("…" if lo else "") + ln[lo:hi].strip() + ("…" if hi < len(ln) else "")

    # ---- multi-line: hyphen wraps (join candidates) ----
    #   classify keep_chem / keep_hard / join. keep_* are REVIEW (never blind-join).
    for m in RE_HYPHEN_WRAP.finditer(book_text):
        a, b = m.group(1), m.group(2)
        line_no = book_text.count("\n", 0, m.start()) + 1
        # skip if either side sits on a structural line
        if not (is_content(lines[line_no - 1]) if line_no <= len(lines) else True):
            continue
        if CHEM_PREFIX.match(a):
            disp, note = "REVIEW", f"keep_chem: '{a}-' is a chemical/stereo prefix — keep hyphen"
        elif b[:1].isupper():
            # never auto-join onto a proper noun (glial-Schwann must NOT become glialSchwann)
            disp, note = "REVIEW", f"keep_proper: 2nd part '{b}' is a proper noun — keep '{a}-{b}' or '{a} {b}'"
        elif spell is not None and not spell.unknown([a.lower()]) and not spell.unknown([b.lower()]):
            disp, note = "REVIEW", f"keep_hard: '{a}' + '{b}' are both words — likely a real compound '{a}-{b}'"
        else:
            disp, note = "AUTO", f"join -> '{a}{b}'"
        findings.append(dict(detector="hyphen_wrap", disposition=disp, line=line_no,
                             term=f"{a}-\\n{b}", context=f"{a}-⏎{b}", note=note))

    # ---- per-line content detectors ----
    header_seen = 0
    for i, ln in enumerate(lines, start=1):
        if not is_content(ln):
            continue
        # running header re-injected mid-content
        if header and ln.strip() == header:
            header_seen += 1
            findings.append(dict(detector="running_header", disposition="REVIEW", line=i,
                                 term=header[:40] + "…", context=ln.strip()[:60],
                                 note="page running-header captured on every page — strip to de-fragment prose?"))
            continue
        for m in RE_DOUBLE_SPACE.finditer(ln):
            findings.append(dict(detector="double_space", disposition="AUTO", line=i,
                                 term="  ", context=ctx(i, m.start(1), m.end(1)), note="collapse to single space"))
        for m in RE_SPACE_PUNCT.finditer(ln):
            findings.append(dict(detector="space_before_punct", disposition="AUTO", line=i,
                                 term=m.group(0), context=ctx(i, m.start(), m.end()),
                                 note=f"remove space before '{m.group(1)}'"))
        for m in RE_SPACE_PAREN.finditer(ln):
            findings.append(dict(detector="space_in_paren", disposition="AUTO", line=i,
                                 term=repr(m.group(0)), context=ctx(i, m.start(), m.end()), note="trim paren padding"))
        # digit-in-word: a letter glued to a digit (l/1, O/0 glyph confusion, or a
        # missing space). Suppress the legit alphanumerics: ordinals, spinal-nerve
        # codes (C5/T1), dose contexts, and known tokens (B12, CO2…).
        for m in re.finditer(r"\S+", ln):
            tok = m.group(0)
            core = tok.strip(".,;:()[]/-")
            if not (re.search(r"[A-Za-z]", core) and re.search(r"\d", core)):
                continue
            if RE_ORDINAL.match(core) or RE_MEDCODE.match(core) or RE_ALPHANUM_OK.match(core):
                continue
            if RE_DOSE_CTX.search(tok) or re.fullmatch(r"[\d,\.\-]+", core):
                continue
            findings.append(dict(detector="digit_in_word", disposition="REVIEW", line=i,
                                 term=core, context=ctx(i, m.start(), m.end()),
                                 note="letter glued to digit — glyph confusion (l/1,O/0) or missing space?"))
        for m in RE_CASESHIFT.finditer(ln):
            findings.append(dict(detector="run_together", disposition="REVIEW", line=i,
                                 term=m.group(0), context=ctx(i, m.start(), m.end()), note="missing space (caseshift)?"))
        for m in RE_LETTER_PAREN.finditer(ln):
            findings.append(dict(detector="run_together", disposition="REVIEW", line=i,
                                 term=m.group(0), context=ctx(i, m.start(), m.end()), note="missing space before '('?"))
        # bare page-number line interleaved in content
        if re.fullmatch(r"\s*\d{1,4}\s*", ln):
            findings.append(dict(detector="interleaved_num", disposition="REVIEW", line=i,
                                 term=ln.strip(), context=ln.strip(), note="stray page number?"))
        # ── gibberish / OCR-garbage detectors (tight, ~zero FP): the classes that
        #    keep landing on mined pages -- 3+ identical-letter runs and failed
        #    running-header fragments. GATED on mined pages by the mined_pages_clean
        #    invariant (see tools/invariants.py + mined_page_audit.py). (A bracket-for-
        #    capital detector was tried and dropped: legit editorial brackets like
        #    "[dementia]" are indistinguishable from OCR "[ron", so it was too FP-heavy;
        #    the "[ron" class is forced clean by the verbatim snap gate anyway.) ──
        for gm in re.finditer(r"[A-Za-z]{3,}", ln):
            g = gm.group(0)
            if not re.search(r"([a-z])\1\1", g):
                continue
            gl = g.lower()
            if gl in COMMON_ABBR or re.fullmatch(r"[ivxlcdm]+", gl):
                continue  # www + roman numerals (iii, viii) are not gibberish
            findings.append(dict(detector="repeated_char", disposition="REVIEW", line=i,
                                 term=g, context=ctx(i, gm.start(), gm.end()),
                                 note="3+ identical consecutive letters -- OCR gibberish (delete?)"))
        if i in first_after_marker and is_marker_fragment(ln):
            findings.append(dict(detector="post_marker_fragment", disposition="REVIEW", line=i,
                                 term=ln.strip(), context=ln.strip(),
                                 note="short garbage line right after a page marker -- failed running-header OCR (delete?)"))

    # ---- spell flags (ranked by rarity across the book) ----
    if spell is not None:
        freq = Counter()
        first = {}
        first_raw = {}
        ever_lower = {}   # term used lowercase in prose => common word => typo if unknown
        for i, ln in enumerate(lines, start=1):
            if not is_content(ln) or (header and ln.strip() == header):
                continue
            for m in RE_TOKEN.finditer(ln):
                tok = m.group(0)
                low = tok.lower().replace("’", "'").strip("'")
                if len(low) < 3 or low in known or any(ch.isdigit() for ch in low):
                    continue
                base = low.split("'")[0]
                if base and not spell.unknown([base]):
                    continue
                # a hyphenated compound whose every fragment is a known word is legit
                # style (auto-immune, co-authored, twenty-five), not an OCR typo.
                if "-" in low:
                    parts = [p for p in low.split("-") if len(p) >= 2]
                    if parts and all(p in known or not spell.unknown([p]) for p in parts):
                        continue
                if low in COMMON_ABBR:
                    continue
                freq[low] += 1
                first.setdefault(low, (i, ln.strip()[:60]))
                first_raw.setdefault(low, tok)
                if not tok[:1].isupper():
                    ever_lower[low] = True
        for tok, n in freq.most_common():
            line_no, snip = first[tok]
            raw = first_raw.get(tok, tok)
            # tier: a word ever used lowercase in prose is a common word -> if unknown,
            # a likely REAL typo (even if a Title-Case instance exists, e.g. a list
            # header "Cranial Nerve 10: Gastroperesis"). Only-ever-Capitalized = proper
            # noun; ALLCAPS-only = acronym. Suspects float to the top of the bucket.
            if ever_lower.get(tok):
                kind = "suspect"
            elif raw.isupper() and len(raw) >= 2:
                kind = "acronym"
            else:
                kind = "proper"
            sugg = ""
            if kind == "suspect":
                corr = spell.correction(tok)
                if corr and corr != tok:
                    sugg = f" -> '{corr}'?"
            findings.append(dict(detector="spell_flag", disposition="REVIEW", line=line_no,
                                 kind=kind, term=f"{tok} (×{n}){sugg}", context=snip,
                                 note=f"{kind}: not in english+corpus+domain — "
                                      + ("likely OCR typo" if kind == "suspect" else "allowlist if a real term")))
    for f in findings:
        f["source"] = source_ref(f["line"])
    return findings, header


def apply_baseline(book_id, findings):
    """Suppress reviewed-OK findings from a per-book allowlist: spell_ok (domain
    terms/proper nouns) and reviewed_ok (non-spell keeps — real compounds, legit
    alphanumerics). What remains after this is the book's UNRESOLVED defect set —
    the number the book_source_clean gate drives to zero."""
    p = BASELINE_DIR / f"{book_id}.json"
    if not p.exists():
        return findings, 0
    data = json.loads(p.read_text(encoding="utf-8"))
    allow_spell = set(data.get("spell_ok", []))
    allow_review = set(data.get("reviewed_ok", []))
    kept = []
    for f in findings:
        if f["detector"] == "spell_flag" and f["term"].split(" (")[0] in allow_spell:
            continue
        if f["detector"] != "spell_flag" and f["term"] in allow_review:
            continue
        kept.append(f)
    return kept, len(findings) - len(kept)


def resolve_book(book_id):
    books = load_meta_books()
    if book_id not in books:
        print(f"unknown book_id '{book_id}'. Known: {', '.join(sorted(books))}")
        sys.exit(2)
    return ROOT / books[book_id]["file"]


def unresolved(book_id):
    """(count, findings, speller_ok) after the per-book baseline — the number the
    book_source_clean invariant drives to 0 for a PRISTINE book. speller_ok=False
    means pyspellchecker was unavailable, so spell_flag detection was skipped."""
    findings, _ = scan(lf_text(resolve_book(book_id)))
    findings, _ = apply_baseline(book_id, findings)
    return len(findings), findings, get_speller() is not None


def cmd_report(args):
    path = resolve_book(args.book)
    findings, header = scan(lf_text(path))
    findings, suppressed = apply_baseline(args.book, findings)
    if args.detector:
        findings = [f for f in findings if f["detector"] == args.detector]
    by_disp = Counter(f["disposition"] for f in findings)
    by_det = Counter(f["detector"] for f in findings)
    print(f"=== book purity scan — {args.book} ===")
    print(f"  running header : {header!r}" if header else "  running header : (none detected)")
    print(f"  findings       : {len(findings)}   AUTO={by_disp['AUTO']}  REVIEW={by_disp['REVIEW']}"
          + (f"   (baseline-suppressed {suppressed})" if suppressed else ""))
    print(f"  by detector    : {dict(by_det)}")
    spell_kinds = Counter(f.get("kind") for f in findings if f["detector"] == "spell_flag")
    if spell_kinds:
        print(f"  spell tiers    : {dict(spell_kinds)}   (suspect = likely real typo)")
    for disp in ("AUTO", "REVIEW"):
        rows = [f for f in findings if f["disposition"] == disp]
        if not rows:
            continue
        print(f"\n  ── {disp} ({len(rows)}) ──")
        _krank = {"suspect": 0, "proper": 1, "acronym": 2}
        rows.sort(key=lambda f: (f["detector"], _krank.get(f.get("kind"), 0), f["line"]))
        for f in rows[: args.limit]:
            src = f"  · {f['source']}" if f.get("source") else ""
            print(f"    [{f['detector']}] L{f['line']}{src}  «{f['term']}»")
            print(f"        {f['context']}")
            if f.get("note"):
                print(f"        → {f['note']}")
        if len(rows) > args.limit:
            print(f"    … +{len(rows) - args.limit} more (raise --limit)")


def cmd_json(args):
    path = resolve_book(args.book)
    findings, header = scan(lf_text(path))
    findings, suppressed = apply_baseline(args.book, findings)
    by_disp = Counter(f["disposition"] for f in findings)
    print(json.dumps({
        "book": args.book,
        "running_header": header,
        "total": len(findings),
        "auto": by_disp["AUTO"],
        "review": by_disp["REVIEW"],
        "baseline_suppressed": suppressed,
        "by_detector": dict(Counter(f["detector"] for f in findings)),
    }, ensure_ascii=False, indent=2))


def cmd_books(args):
    for bid, b in sorted(load_meta_books().items()):
        print(f"  {bid:28s} {b.get('title','')}")


def main():
    ap = argparse.ArgumentParser(description="scan a source book for OCR/typographic defects")
    sub = ap.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("report"); r.add_argument("--book", required=True)
    r.add_argument("--detector"); r.add_argument("--limit", type=int, default=60)
    r.set_defaults(func=cmd_report)
    j = sub.add_parser("json"); j.add_argument("--book", required=True); j.set_defaults(func=cmd_json)
    b = sub.add_parser("books"); b.set_defaults(func=cmd_books)
    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
