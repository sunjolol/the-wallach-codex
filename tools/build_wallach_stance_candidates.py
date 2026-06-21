#!/usr/bin/env python3
"""
build_wallach_stance_candidates.py — Phase 2 of the Wallach-stance educational reframing arc.

Iterates all 92 essentials in `knowledge/essentials-targets.json`, queries
`tools/corpus_search.py` for each, and writes `knowledge/_wallach_stance_candidates.json`
as a hand-review sidecar for Phase 3 curation.

Per the user's Phase 2 plan (open-threads.md, Round 115 close):
  - ~10 min runtime budget
  - Sidecar shape supports Phase 3 hand-review
  - No data lands on canonical essentials-targets.json or the embed; that's Phase 3

This script is part of the build/research pipeline, not the runtime. The output is
not consumed by the dashboard; it's reference material for the user. The leading
underscore on the output filename (`_wallach_stance_candidates.json`) marks it as
a sidecar — present in `knowledge/` for accessibility but never sourced into the
embed pipeline.

Source-rule cornerstone: only Wallach-corpus primary tier-1 (books) and
tier-2 (high-confidence transcripts) passages are surfaced. Tier-3 (products)
and tier-4 (non-YGY) excluded — they're not editorial-voice sources.

Round 115 / Round 116 (Phase 2).
"""

import argparse
import json
import pathlib
import re
import subprocess
import sys
import datetime

ROOT = pathlib.Path(__file__).resolve().parent.parent
ESSENTIALS = ROOT / "knowledge" / "essentials-targets.json"
OUTPUT = ROOT / "knowledge" / "_wallach_stance_candidates.json"
CORPUS_SEARCH = ROOT / "tools" / "corpus_search.py"

# Cap each passage's surfaced text so the sidecar stays under ~1MB total.
PASSAGE_EXCERPT_CHARS = 1200

# Per-essential, surface up to this many top passages for review.
MAX_PASSAGES_PER_ESSENTIAL = 4

# Minimum corpus_search score to consider a passage a real hit.
MIN_PASSAGE_SCORE = 5


def clean_query(name: str) -> str:
    """Strip parens, slashes, plus-signs etc. to produce a focused query.

    Examples:
      'Vitamin A (Retinol / beta-carotene)' -> 'Vitamin A'
      'Vitamin D2 (Ergocalciferol) + D3 (Cholecalciferol)' -> 'Vitamin D'
      'Vitamin K (Menaquinone = K2)' -> 'Vitamin K'
      'Omega-3 (alpha-linolenic + EPA/DHA in marine form)' -> 'Omega-3'
      'Folic Acid (Folate)' -> 'Folic Acid'
      'Boron' -> 'Boron'
    """
    # Drop everything after the first paren
    q = re.sub(r"\s*\(.*$", "", name).strip()
    # Normalize "Vitamin D2 + D3" to "Vitamin D" via prefix capture
    m = re.match(r"^(Vitamin [A-Z])(?:\d|\s|$)", q)
    if m:
        q = m.group(1)
    # Drop trailing "+ ..." segments
    q = re.sub(r"\s*\+.*$", "", q).strip()
    return q


def fallback_queries(name: str) -> list:
    """Alternative queries when the primary query returns no hits.

    Extracts chemical/alternative names from the parenthesized portion of the
    essential name. For essentials Wallach discusses by chemical name rather
    than common name, the parens contain the better query. Example:
      'Vitamin E (Tocopherol)' primary='Vitamin E' (over-broad token); fallback='Tocopherol'
      'Flavonoids / Bioflavonoids' primary='Flavonoids' (low hits); fallback='Bioflavonoids'
      'Omega-9 (Arachidonic / Oleic)' primary='Omega-9' (no hits); fallback=['Arachidonic acid', 'Oleic acid']
    """
    queries = []
    # Extract content inside the first parens
    paren_match = re.search(r"\(([^)]+)\)", name)
    if paren_match:
        inside = paren_match.group(1)
        # Split on /, +, , and "="
        parts = re.split(r"\s*(?:/|\+|,|=)\s*", inside)
        for p in parts:
            p = p.strip()
            # Skip qualifiers like "in marine form", "form", and bare letters
            if not p or len(p) < 4 or re.match(r"^[A-Z]\d?$", p):
                continue
            if "form" in p.lower() and "in " in p.lower():
                continue
            queries.append(p)
    # Also try the / split outside parens
    if "/" in name and "(" not in name:
        parts = [s.strip() for s in name.split("/") if len(s.strip()) > 3]
        for p in parts:
            if p not in queries:
                queries.append(p)
    return queries


def run_corpus_search(query: str, max_results: int) -> list:
    """Invoke corpus_search.py with --json and return parsed results.

    Uses --tier Moderate so high+moderate-confidence transcripts are included
    alongside books. --books-only would over-narrow; we want T1 books and T2
    transcripts both. Excludes T3/T4 by score filter downstream.
    """
    cmd = [
        sys.executable,
        str(CORPUS_SEARCH),
        query,
        "--max", str(max_results),
        "--json",
        "--tier", "Moderate",
        "--context", "1800",
    ]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=30, check=False)
        if proc.returncode != 0:
            return []
        out = proc.stdout.strip()
        if not out:
            return []
        return json.loads(out)
    except (subprocess.TimeoutExpired, json.JSONDecodeError):
        return []


def filter_and_truncate(passages: list, essential_name: str, query: str) -> list:
    """Filter low-signal passages + truncate to keep sidecar manageable.

    Drops:
      - score below MIN_PASSAGE_SCORE
      - tier 3/4 (not editorial voice)
      - passages where neither the essential name nor the cleaned query appears
        in the passage text (defends against OCR-junk matches like death notices
        that happen to share a token)
    """
    name_lower = essential_name.lower()
    q_lower = query.lower()
    # Tokens to verify presence in passage
    tokens = {name_lower}
    tokens.add(q_lower)
    # For "Vitamin X" queries, also accept the bare letter+digit combos
    m = re.match(r"vitamin\s+([a-z]\d*)", q_lower)
    if m:
        tokens.add("vitamin " + m.group(1))

    out = []
    for p in passages:
        if p.get("score", 0) < MIN_PASSAGE_SCORE:
            continue
        tier = p.get("tier", "")
        if "T1" not in tier and "T2" not in tier:
            continue
        passage_text = p.get("passage", "")
        passage_lower = passage_text.lower()
        if not any(t in passage_lower for t in tokens):
            continue
        excerpt = passage_text[:PASSAGE_EXCERPT_CHARS]
        if len(passage_text) > PASSAGE_EXCERPT_CHARS:
            excerpt = excerpt.rstrip() + " […]"
        out.append({
            "score": p.get("score"),
            "tier": tier,
            "source": p.get("source", ""),
            "source_type": p.get("source_type", ""),
            "location": p.get("location", ""),
            "passage_excerpt": excerpt,
        })
        if len(out) >= MAX_PASSAGES_PER_ESSENTIAL:
            break
    return out


def collect_essentials() -> list:
    obj = json.loads(ESSENTIALS.read_text(encoding="utf-8"))
    rows = []
    for cat, arr in obj.get("categories", {}).items():
        for e in arr:
            rows.append({"name": e.get("name", ""), "category": cat})
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=None,
                    help="Smoke-test mode — only process this many essentials.")
    ap.add_argument("--start", type=int, default=0,
                    help="Skip the first N essentials (for resuming partial runs).")
    ap.add_argument("--dry-run", action="store_true",
                    help="Print summary; do not write the sidecar file.")
    args = ap.parse_args()

    essentials = collect_essentials()
    print(f"[build] {len(essentials)} essentials loaded from {ESSENTIALS.relative_to(ROOT)}")

    work = essentials[args.start:]
    if args.limit:
        work = work[: args.limit]
        print(f"[build] LIMIT mode — processing {len(work)} essentials")

    candidates = []
    n_with_hits = 0
    n_empty = 0
    n_started = datetime.datetime.now()

    n_fallback_rescued = 0
    for i, e in enumerate(work, 1):
        name = e["name"]
        category = e["category"]
        query = clean_query(name)
        queries_tried = [query]
        raw = run_corpus_search(query, max_results=8)
        passages = filter_and_truncate(raw, essential_name=name, query=query)
        # Fallback pass: when the primary query yields no kept passages, try the
        # chemical-name alternatives extracted from the parenthesized portion of
        # the name (e.g. 'Vitamin E (Tocopherol)' falls back to 'Tocopherol'
        # which is what Wallach actually writes). Each fallback contributes its
        # filtered hits up to MAX_PASSAGES_PER_ESSENTIAL.
        if not passages:
            for fq in fallback_queries(name):
                queries_tried.append(fq)
                fb_raw = run_corpus_search(fq, max_results=8)
                fb_passages = filter_and_truncate(fb_raw, essential_name=name, query=fq)
                if fb_passages:
                    passages = fb_passages
                    n_fallback_rescued += 1
                    break
        candidates.append({
            "name": name,
            "category": category,
            "query_used": query,
            "queries_tried": queries_tried,
            "n_raw_hits": len(raw),
            "n_kept": len(passages),
            "top_passages": passages,
        })
        if passages:
            n_with_hits += 1
        else:
            n_empty += 1
        if i % 10 == 0 or i == len(work):
            elapsed = (datetime.datetime.now() - n_started).total_seconds()
            print(f"[build] {i}/{len(work)} — last: {name[:40]:<40s} hits: {len(passages)}  elapsed: {elapsed:.1f}s")

    out_obj = {
        "schema_version": 1,
        "generated_at": datetime.datetime.now().isoformat(timespec="seconds"),
        "tool": "build_wallach_stance_candidates.py (Round 116 / Wallach-stance Phase 2)",
        "corpus_search_invocation": "corpus_search.py --tier Moderate --context 1800 --max 8",
        "filters": {
            "min_score": MIN_PASSAGE_SCORE,
            "max_passages_per_essential": MAX_PASSAGES_PER_ESSENTIAL,
            "passage_excerpt_chars": PASSAGE_EXCERPT_CHARS,
            "allowed_tiers": ["T1 book", "T2 transcript (High)", "T2 transcript (Moderate)"],
        },
        "summary": {
            "n_essentials_processed": len(candidates),
            "n_with_hits": n_with_hits,
            "n_empty": n_empty,
            "n_fallback_rescued": n_fallback_rescued,
        },
        "candidates": candidates,
    }

    print(f"\n[build] DONE — {len(candidates)} essentials processed")
    print(f"  with hits:  {n_with_hits}")
    print(f"  empty:      {n_empty}")

    if args.dry_run:
        print(f"\n[build] DRY-RUN — would write to {OUTPUT.relative_to(ROOT)}")
        print(f"  output size: {len(json.dumps(out_obj))} bytes")
        return 0

    # Write atomically via safe_write.py rewrite (cross-platform discipline)
    payload = json.dumps(out_obj, indent=2, ensure_ascii=False) + "\n"
    safe_write = ROOT / "tools" / "safe_write.py"
    proc = subprocess.run(
        [sys.executable, str(safe_write), "rewrite", str(OUTPUT), "--payload-stdin"],
        input=payload, text=True, capture_output=True, check=False,
    )
    if proc.returncode != 0:
        print(f"[build] FAIL — safe_write rewrite returned {proc.returncode}", file=sys.stderr)
        print(proc.stderr, file=sys.stderr)
        return 1
    print(f"[build] WROTE {OUTPUT.relative_to(ROOT)} ({len(payload)} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
