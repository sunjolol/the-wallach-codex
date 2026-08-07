#!/usr/bin/env python3
"""find_duplicate_candidates.py -- deterministic, auditable duplicate-CANDIDATE finder.

NON-DESTRUCTIVE. Reads the sealed corpus + enrichment and emits a ranked list of claim
PAIRS that MIGHT be duplicates, each tagged with the exact signal(s) that flagged it and
both claims' full display data. It makes NO ruling and changes NO data -- every pair is a
candidate for Luneth to inspect and rule on (keep-one / merge / not-a-duplicate).

Signals (a pair carries the union of the ones that caught it):
  same_question          same subject + same NORMALISED question. Reuses the proven
                         no_duplicate_questions normalisation verbatim.
  verbatim_same_section  same (book, subject, facet), one verbatim is a substring of the
                         other. The old no_duplicate_claims signature -- strongest.
  verbatim_cross_facet   same (book, subject), different facet, verbatim containment.
  verbatim_cross_book    same subject, different book, verbatim containment.
  span_overlap_same_book same book, the two verbatims' char ranges overlap by >= 60% of the
                         LONGER span -- the spans nearly coincide (one printed passage mined
                         twice), NOT a short claim sitting inside a longer paragraph (that
                         multi-facet subset pattern is legitimate; it is caught, if truly a
                         duplicate, by verbatim_reprint / verbatim_same_section instead).
  text_near_same_subject same subject, max(claim_text, verbatim) token-Jaccard >= --jaccard.
                         Catches re-worded twins and cross-book reuse on one page.
  verbatim_reprint       full normalised-verbatim SequenceMatcher ratio >= --reprint over
                         pairs already sharing >= 0.6 verbatim token-Jaccard. Near-identical
                         printed text, ANY subject -- rejects parallel rows (whose full
                         strings differ) but keeps the same passage mined twice.

WHY NOT cross-subject token similarity: Wallach writes the same sentence shape per nutrient
('X deficiency causes anemia...'), so copper~iron / phenylalanine~valine score ~1.0 on
token-set overlap while being about different entities. Token similarity is therefore
SAME-SUBJECT only; cross-subject reuse is caught by verbatim_reprint (full-string), which a
parallel row cannot pass.

Score is a transparent sum of per-signal weights, capped at 1.0; the formula is written into
the output header. Bucketing uses PRIMARY subject only; also_about page collisions are a
documented gap.

Usage:
  PYTHONUTF8=1 python find_duplicate_candidates.py --root <repo> --out <path.json>
                                                   [--jaccard 0.7] [--reprint 0.9]
"""
import argparse
import json
import re
from collections import Counter, defaultdict
from difflib import SequenceMatcher
from itertools import combinations
from pathlib import Path

_Q_STOP = frozenset("""the a an of to in is are do does did you your can what how why and for with
on at be it that this wallach s""".split())


def _norm_question(q):
    q = re.sub(r"[^a-z0-9 ]+", " ", (q or "").lower())
    return " ".join(sorted(w for w in q.split() if w not in _Q_STOP))


def _tokens(t):
    t = re.sub(r"[^a-z0-9 ]+", " ", (t or "").lower())
    return frozenset(w for w in t.split() if w not in _Q_STOP and len(w) > 2)


def _norm_str(t):
    return re.sub(r"\s+", " ", (t or "").lower()).strip()


def _jac(a, b):
    return len(a & b) / len(a | b) if a and b else 0.0


PRIOR = {
    frozenset({"WAL-CLM-DDDL-000071", "WAL-CLM-DDDL-000137"}):
        "prior 2026-08-03: KEEP BOTH (selenium -- one sentence answering two different reader questions)",
    frozenset({"WAL-CLM-IMMORT-000135", "WAL-CLM-IMMORT-000389"}):
        "prior 2026-08-03: KEEP BOTH (gallium -- brain-cancer general vs pregnancy-narrow)",
}

WEIGHTS = {
    "same_question": 0.50,
    "verbatim_same_section": 0.45,
    "verbatim_reprint": 0.40,
    "span_overlap_same_book": 0.40,
    "text_near_same_subject": 0.35,
    "verbatim_cross_facet": 0.30,
    "verbatim_cross_book": 0.30,
}


def load(root):
    claims = []
    for shard in sorted((root / "eden" / "corpus" / "claims").glob("claims-*.json")):
        claims.extend(json.loads(shard.read_text(encoding="utf-8")).get("claims", []))
    enr_p = root / "eden" / "corpus" / "search-enrichment.json"
    enrichment = json.loads(enr_p.read_text(encoding="utf-8")).get("enrichment", {}) if enr_p.exists() else {}
    return claims, enrichment


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=str(Path(__file__).resolve().parents[2]))
    ap.add_argument("--out", required=True)
    ap.add_argument("--jaccard", type=float, default=0.7)
    ap.add_argument("--reprint", type=float, default=0.9)
    args = ap.parse_args()
    root = Path(args.root)

    claims, enr = load(root)
    by_id = {c["id"]: c for c in claims}

    def facet(cid):
        return (enr.get(cid) or {}).get("facet")

    def subject(cid):
        return (enr.get(cid) or {}).get("subject")

    ctT = {c["id"]: _tokens(c.get("claim_text")) for c in claims}
    vbT = {c["id"]: _tokens(c.get("verbatim")) for c in claims}
    vbN = {c["id"]: _norm_str(c.get("verbatim")) for c in claims}

    signals = {}

    def add(a, b, sig, detail):
        signals.setdefault(frozenset((a, b)), {})[sig] = detail

    # 1. same_question
    qb = defaultdict(list)
    for cid, e in enr.items():
        s, q = (e or {}).get("subject"), (e or {}).get("question")
        if s and q:
            qb[(s, _norm_question(q))].append(cid)
    for (s, _), ids in qb.items():
        if len(ids) >= 2:
            for a, b in combinations(sorted(ids), 2):
                add(a, b, "same_question", f"[{s}] same normalised question")

    # subject buckets
    sb = defaultdict(list)
    for c in claims:
        if subject(c["id"]):
            sb[subject(c["id"])].append(c)

    # 2-4 containment + 5 text_near, within a subject
    for s, group in sb.items():
        for ca, cb in combinations(group, 2):
            ia, ib = ca["id"], cb["id"]
            va, vb = ca.get("verbatim") or "", cb.get("verbatim") or ""
            if va and vb and (va in vb or vb in va):
                ba, bb, fa, fb = ca["locator"]["book"], cb["locator"]["book"], facet(ia), facet(ib)
                if ba == bb and fa == fb:
                    add(ia, ib, "verbatim_same_section", f"[{s}/{fa}] one verbatim contained in the other")
                elif ba == bb:
                    add(ia, ib, "verbatim_cross_facet", f"[{s}] {fa} vs {fb}, verbatim containment")
                else:
                    add(ia, ib, "verbatim_cross_book", f"[{s}] {ba} vs {bb}, same passage reused")
            j = max(_jac(ctT[ia], ctT[ib]), _jac(vbT[ia], vbT[ib]))
            if j >= args.jaccard:
                add(ia, ib, "text_near_same_subject", f"[{s}] max token-Jaccard={j:.2f}")

    # 6. span_overlap_same_book -- overlap >= 50% of shorter span
    book_bucket = defaultdict(list)
    for c in claims:
        loc = c.get("locator") or {}
        b, off, v = loc.get("book"), loc.get("char_offset"), c.get("verbatim") or ""
        if b and isinstance(off, int) and v:
            book_bucket[b].append((off, off + len(v), c["id"]))
    for b, spans in book_bucket.items():
        spans.sort()
        for i in range(len(spans)):
            s0, e0, id0 = spans[i]
            for j in range(i + 1, len(spans)):
                s1, e1, id1 = spans[j]
                if s1 >= e0:
                    break
                overlap = min(e0, e1) - max(s0, s1)
                longer = max(e0 - s0, e1 - s1)
                if longer > 0 and overlap >= 0.6 * longer:
                    add(id0, id1, "span_overlap_same_book",
                        f"[{b}] spans {s0}-{e0} & {s1}-{e1} nearly coincide ({overlap}/{longer} chars)")

    # 7. verbatim_reprint -- full-string ratio over token>=0.6 candidates (inverted index)
    inv = defaultdict(list)
    for cid, ts in vbT.items():
        for t in ts:
            inv[t].append(cid)
    checked = set()
    for t, ids in inv.items():
        if len(ids) > 60:
            continue
        for a, b in combinations(sorted(ids), 2):
            if (a, b) in checked:
                continue
            checked.add((a, b))
            if _jac(vbT[a], vbT[b]) >= 0.6:
                r = SequenceMatcher(None, vbN[a], vbN[b]).ratio()
                if r >= args.reprint:
                    add(a, b, "verbatim_reprint", f"full-string ratio={r:.2f}")

    def disp(cid):
        c = by_id.get(cid, {})
        loc = c.get("locator") or {}
        e = enr.get(cid) or {}
        return {
            "id": cid, "book": loc.get("book"), "page": loc.get("page"),
            "kind": c.get("kind"), "essentials": c.get("essentials"), "conditions": c.get("conditions"),
            "other_substances": c.get("other_substances"), "symptoms": c.get("symptoms"),
            "subject": e.get("subject"), "facet": e.get("facet"), "question": e.get("question"),
            "also_about": e.get("also_about"), "answer_short": e.get("answer_short"),
            "claim_text": c.get("claim_text"), "verbatim": c.get("verbatim"),
            "review_state": c.get("review_state"), "superseded_by": c.get("superseded_by"),
        }

    pairs = []
    for pair, sigs in signals.items():
        a, b = sorted(pair)
        score = 0.0
        for sig, detail in sigs.items():
            if sig in ("text_near_same_subject", "verbatim_reprint"):
                m = re.search(r"=([0-9.]+)", detail)
                score += WEIGHTS[sig] * (float(m.group(1)) if m else 1.0)
            else:
                score += WEIGHTS[sig]
        pairs.append({
            "pair_id": f"{a}|{b}",
            "signals": sorted(sigs.keys()),
            "signal_detail": sigs,
            "score": min(1.0, round(score, 3)),
            "prior_ruling": PRIOR.get(pair),
            "a": disp(a), "b": disp(b),
        })
    pairs.sort(key=lambda p: (-p["score"], p["pair_id"]))

    sig_counts = Counter()
    for p in pairs:
        for s in p["signals"]:
            sig_counts[s] += 1

    out = {
        "_note": ("NON-DESTRUCTIVE candidate list. Each pair is a CANDIDATE for manual ruling, "
                  "not a decision. Bucketing uses PRIMARY subject only; also_about page collisions "
                  "are a known gap."),
        "total_claims": len(claims),
        "total_enriched": len(enr),
        "total_pairs": len(pairs),
        "generated_signals": dict(sig_counts.most_common()),
        "score_formula": WEIGHTS,
        "jaccard_threshold": args.jaccard,
        "reprint_threshold": args.reprint,
        "pairs": pairs,
    }
    Path(args.out).write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"claims={len(claims)} enriched={len(enr)} unique_pairs={len(pairs)}")
    for s, n in sig_counts.most_common():
        print(f"  {s}: {n}")


if __name__ == "__main__":
    main()
