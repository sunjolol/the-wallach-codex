#!/usr/bin/env python3
"""anomaly_scan.py — surface SUSPICIOUS spans in the sealed corpus for HUMAN review.

NEVER auto-fixes. Emits a ranked report of candidate errors — a wrong word that
looks legitimate — so a human can triage before finalizing. Heavy interpretation is
required to fix these, but never automatic; this tool only FLAGS.

The case that motivates this tool: "an herbal combination of testosterone (Zumba)"
hid a mangled "Zumbani" (a real testosterone herb). Three detectors target that class
(a fourth, unknown_botanical, is designed but deferred — see below):

  hormone_as_herb   — a hormone in a botanical/herb slot ("testosterone (Zumba)",
                      "herbal combination of testosterone")
  near_miss         — a token edit-distance-close to a known herb/genus/nutrient
                      but not exactly it ("Sarenoa"->"Serenoa", "Zumba"->"Zumbani",
                      "Echinaca"->"Echinacea")
  run_together      — a missing-space OCR join ("nuxvomica(Strychnosnux", "ofMenke's")

  (unknown_botanical — flagging an unknown GENUS needs a real genus DB; deferred,
   since the actionable misspelled-genus case is already covered by near_miss.)

Findings are keyed (detector, claim_id, term); an allowlist (anomaly-scan-baseline.json)
suppresses reviewed-OK ones, so NEW findings stay loud. Scans claim_text + verbatim
(the surfaced content); the full book-text pass is book_purity.py.

CLI:
  report [--book BOOK] [--detector NAME]   ranked findings (respects the allowlist)
  baseline                                 write the allowlist = ALL current findings
"""
import difflib
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CORPUS = ROOT / "eden" / "corpus"
HERE = Path(__file__).resolve().parent
LEX_PATH = HERE / "anomaly-lexicon.json"
BASELINE_PATH = HERE / "anomaly-scan-baseline.json"

HERB_CONTEXT = re.compile(r"\b(herb|herbal|herbs|botanical|combination|tincture|extract|tonic)\b", re.I)
# common words we never want to treat as a suspicious token (the capitalized-token
# focus already filters most English out; this catches the frequent leftovers)
COMMON = set(
    "the and of a an in to for with is are was were be been as at or on by from that this it its "
    "his her their your our can may will would should not no more most than then also such given "
    "include includes including used use using value take taking daily day days per each other "
    "treatment treat symptoms disease diseases deficiency wallach dr men women aging often result "
    "may results normal high low blood level levels".split()
)


def load_lexicon():
    d = json.loads(LEX_PATH.read_text(encoding="utf-8"))
    hormones = {w.lower() for w in d["hormones"]}
    herbs = {w.lower() for w in d["herbs"]}
    genera = {g.lower() for g in d["genera"]}
    nutrients = {w.lower() for w in d["nutrients"]}
    return hormones, herbs, genera, nutrients


def corpus_terms():
    terms = set()
    for idx in ("conditions.json", "essentials.json"):
        p = CORPUS / "indices" / idx
        if not p.exists():
            continue
        d = json.loads(p.read_text(encoding="utf-8"))
        for slug, info in d.items():
            if slug.startswith("_"):
                continue
            for w in re.findall(r"[a-z]{3,}", slug.lower().replace("_", " ")):
                terms.add(w)
            if isinstance(info, dict):
                for w in re.findall(r"[a-z]{3,}", info.get("display_name", "").lower()):
                    terms.add(w)
    return terms


def load_claims(book_filter=None):
    out = []
    for shard in sorted((CORPUS / "claims").glob("claims-*.json")):
        d = json.loads(shard.read_text(encoding="utf-8"))
        for c in d["claims"]:
            bid = c["locator"]["book"]
            if book_filter and bid != book_filter:
                continue
            out.append((c["id"], bid, c.get("claim_text", ""), c.get("verbatim", "")))
    return out


def snippet(text, i, span=42):
    lo, hi = max(0, i - span), min(len(text), i + span)
    return re.sub(r"\s+", " ", text[lo:hi]).strip()


def scan_text(text, hormones, herbs, genera, nutrients, known, near_targets):
    """Yield (detector, term, snippet, suggestion) for one text blob."""
    # --- hormone_as_herb: hormone in a genus slot "(Capitalized…" or an explicit
    #     "herb(al) combination …" list — NOT a hormone merely named in parens
    #     (e.g. "adrenaline (epinephrine)" is a legit synonym, lowercase). ---
    for m in re.finditer(r"\b([a-z]+)\b", text, re.I):
        if m.group(1).lower() not in hormones:
            continue
        after = text[m.end():]
        before = text[max(0, m.start() - 40): m.start()]
        if re.match(r"\s*\([A-Z]", after) or re.search(r"herb(al)?\s+combinations?\b", before, re.I):
            yield ("hormone_as_herb", m.group(1), snippet(text, m.start()), None)

    # --- unknown_botanical (DEFERRED): flagging a binomial "(Genus species)" whose
    #     genus is unknown needs a real genus database — without one it just flags
    #     every legit genus not in our small lexicon (Plantago, Symphytum, …). The
    #     ACTIONABLE case (a MISSPELLED genus, "Sarenoa"->"Serenoa") is already caught
    #     by near_miss, so this detector waits for a genus DB. ---

    # --- near_miss: capitalized token close to a known herb/genus/nutrient ---
    for m in re.finditer(r"\b([A-Z][a-zA-Z]{3,})\b", text):
        tok = m.group(1)
        tl = tok.lower()
        if tl in known or tl in herbs or tl in genera or tl in nutrients or tl in hormones or tl in COMMON:
            continue
        sugg = difflib.get_close_matches(tl, list(near_targets), n=1, cutoff=0.82)
        if sugg and sugg[0] != tl:
            yield ("near_miss", tok, snippet(text, m.start()), sugg[0])

    # --- run_together: missing space around a paren, or internal caseshift ---
    for tok in text.split():
        if re.search(r"[A-Za-z]\([A-Za-z]", tok) or re.search(r"[a-z]{2}[A-Z][a-z]", tok):
            clean = tok.strip(".,;:)")
            if len(clean) >= 6:
                i = text.find(tok)
                yield ("run_together", clean, snippet(text, max(0, i)), None)


def collect(book_filter=None):
    hormones, herbs, genera, nutrients = load_lexicon()
    known = corpus_terms() | COMMON
    near_targets = herbs | genera | nutrients  # what a near-miss should resolve TO
    findings = {}
    for cid, bid, ctext, vb in load_claims(book_filter):
        for src in (ctext, vb):
            for det, term, snip, sugg in scan_text(src, hormones, herbs, genera, nutrients, known, near_targets):
                key = (det, cid, term.lower())
                if key not in findings:
                    findings[key] = {"detector": det, "claim_id": cid, "book": bid,
                                     "term": term, "snippet": snip, "suggestion": sugg}
    return findings


def load_baseline():
    if not BASELINE_PATH.exists():
        return set()
    d = json.loads(BASELINE_PATH.read_text(encoding="utf-8"))
    return {tuple(k) for k in d.get("allowed", [])}


RANK = {"hormone_as_herb": 0, "near_miss": 1, "unknown_botanical": 2, "run_together": 3}


def cmd_report(book_filter=None, det_filter=None):
    findings = collect(book_filter)
    base = load_baseline()
    rows = [f for k, f in findings.items() if k not in base]
    if det_filter:
        rows = [f for f in rows if f["detector"] == det_filter]
    rows.sort(key=lambda f: (RANK.get(f["detector"], 9), f["book"], f["claim_id"]))
    by_det = Counter(f["detector"] for f in rows)
    print("=== anomaly scan (candidates for HUMAN review — never auto-fixed) ===")
    print(f"  book: {book_filter or 'ALL'}  ·  NEW findings: {len(rows)}  ·  baselined: {len(base)}")
    print(f"  by detector: {dict(by_det)}")
    print()
    for f in rows:
        sug = f"   -> did you mean '{f['suggestion']}'?" if f["suggestion"] else ""
        print(f"  [{f['detector']}] {f['book']} {f['claim_id']}  «{f['term']}»{sug}")
        print(f"      …{f['snippet']}…")
    if not rows:
        print("  (nothing new — all clear or fully baselined)")


def cmd_baseline():
    findings = collect()
    sys.path.insert(0, str(ROOT / "tools"))
    import safe_write
    payload = json.dumps(
        {"_doc": "Reviewed-OK allowlist for anomaly_scan.py — (detector, claim_id, term) "
                 "tuples the report suppresses. Grows as reviewers clear false positives.",
         "allowed": sorted(list(k) for k in findings)},
        ensure_ascii=False, indent=2) + "\n"
    n = safe_write.safe_rewrite(BASELINE_PATH, payload)
    print(f"OK wrote baseline ({n} B) — {len(findings)} findings allowlisted")


def main():
    args = sys.argv[1:]
    cmd = args[0] if args else "report"
    book = None
    det = None
    if "--book" in args:
        book = args[args.index("--book") + 1]
    if "--detector" in args:
        det = args[args.index("--detector") + 1]
    if cmd == "report":
        cmd_report(book, det)
    elif cmd == "baseline":
        cmd_baseline()
    else:
        print(f"unknown command '{cmd}' (report | baseline)")
        sys.exit(2)


if __name__ == "__main__":
    main()
