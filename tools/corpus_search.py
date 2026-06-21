#!/usr/bin/env python3
"""
corpus_search.py — Wallach corpus retrieval interface.

Searches across books-clean/ and transcripts-clean/, returns ranked passages
with source + location + sized context window. Structured-data passages
(supplement tables, dose lists, nutrient lists) rank above prose.

Cheap-tier retrieval per brain v2.4 + decisions.md:
- Regex-based, no embeddings.
- Tier-aware: Wallach books (Tier 1) above transcripts (Tier 2).
- Transcripts filtered by manifest confidence (High + Moderate by default).
- Structured-data heuristic surfaces supplement tables before prose rhetoric.
- Per-source cap so one book can't crowd out others.

Usage:
    python tools/corpus_search.py "fluoride dose"
    python tools/corpus_search.py "boron bone" --max 5 --context 3000
    python tools/corpus_search.py "vanadium" --books-only
    python tools/corpus_search.py "taurine eyes" --tier High
"""
import argparse
import csv
import json
import os
import re
import sys
from pathlib import Path

# ----- Paths -----
ROOT = Path(__file__).resolve().parent.parent
KNOWLEDGE = ROOT / "knowledge"
BOOKS_DIR = KNOWLEDGE / "books-clean"
TRANSCRIPTS_DIR = KNOWLEDGE / "transcripts-clean"
MANIFEST = KNOWLEDGE / "manifest.csv"

# ----- Defaults -----
TIER_PRIORITY = {"High": 0, "Moderate": 1, "Low": 2, "Exclude": 9}
DEFAULT_TIER_CUTOFF = "Moderate"
DEFAULT_CONTEXT = 2000
DEFAULT_MAX_RESULTS = 8
PER_SOURCE_CAP = 2
CLUSTER_DISTANCE = 800  # group hits within this many chars into one passage

# Skipped: this was the bad 90-essentials scan that was decided against
# (Dirobi/Harada — not Wallach-authored). Stays on disk for file-identity
# stability but should not appear in retrieval. See open-threads 2026-06-12.
SKIP_SOURCES = {"screencapture-scribd-document-448181258-90-essential-nutrients-PDF-2026-06-11-15.txt"}


# Module-level corpus cache (Round 75 Pass A.3.5). Each call to search_corpus
# previously did: load_manifest() (CSV read) + iterate BOOKS_DIR.glob + read each
# book's text (~5-10 MB total across books) + iterate TRANSCRIPTS_DIR.glob + read
# each transcript. For 143-query batches (build_ingredients_master --xref) the IO
# cost ballooned past 45 s subprocess timeout. With caches: one read per file
# across N queries; total IO becomes amortized over the process lifetime.
_MANIFEST_CACHE = None
_BOOKS_CACHE = None       # list of (book_txt_path, text, idx_type, idx_data)
_TRANSCRIPTS_CACHE = None # list of (t_txt_path, text, tier, tier_rank)


def load_manifest():
    """Return dict {vtt_filename: tier}. Cached at module level after first call."""
    global _MANIFEST_CACHE
    if _MANIFEST_CACHE is not None:
        return _MANIFEST_CACHE
    tier_map = {}
    if not MANIFEST.exists():
        _MANIFEST_CACHE = tier_map
        return tier_map
    with open(MANIFEST, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            tier_map[row.get("filename", "")] = row.get("category", "")
    _MANIFEST_CACHE = tier_map
    return tier_map


def _load_books_cached():
    """Load every Wallach book text + sidecar index once; return cached list
    on subsequent calls. Skips SKIP_SOURCES."""
    global _BOOKS_CACHE
    if _BOOKS_CACHE is not None:
        return _BOOKS_CACHE
    out = []
    if not BOOKS_DIR.exists():
        _BOOKS_CACHE = out
        return out
    for book_txt in sorted(BOOKS_DIR.glob("*.txt")):
        if book_txt.name in SKIP_SOURCES:
            continue
        try:
            text = book_txt.read_text(encoding="utf-8", errors="replace")
        except Exception as e:
            print(f"WARN: could not read {book_txt.name}: {e}", file=sys.stderr)
            continue
        idx_type, idx_data = load_book_index(book_txt)
        out.append((book_txt, text, idx_type, idx_data))
    _BOOKS_CACHE = out
    return out


def _load_transcripts_cached():
    """Load every transcript text once + attach manifest tier metadata. Filters
    out transcripts without a manifest entry (same as the original loop)."""
    global _TRANSCRIPTS_CACHE
    if _TRANSCRIPTS_CACHE is not None:
        return _TRANSCRIPTS_CACHE
    out = []
    if not TRANSCRIPTS_DIR.exists():
        _TRANSCRIPTS_CACHE = out
        return out
    manifest = load_manifest()
    for t_txt in sorted(TRANSCRIPTS_DIR.glob("*.txt")):
        vtt_name = t_txt.stem + ".en.vtt"
        tier = manifest.get(vtt_name, "")
        if not tier:
            continue
        tier_rank = TIER_PRIORITY.get(tier, 9)
        try:
            text = t_txt.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        out.append((t_txt, text, tier, tier_rank))
    _TRANSCRIPTS_CACHE = out
    return out


def load_book_index(book_txt_path):
    """Return ('page'|'chapter', sidecar_data) or (None, [])."""
    base = book_txt_path.with_suffix("")
    pages_json = Path(str(base) + ".pages.json")
    chapters_json = Path(str(base) + ".chapters.json")
    if pages_json.exists():
        with open(pages_json, encoding="utf-8") as f:
            return ("page", json.load(f))
    if chapters_json.exists():
        with open(chapters_json, encoding="utf-8") as f:
            return ("chapter", json.load(f))
    return (None, [])


def locate_in_book(index_type, index_data, char_offset):
    if index_type is None:
        return None
    key = "page" if index_type == "page" else "chapter"
    found = None
    for entry in index_data:
        if entry["char_offset"] <= char_offset:
            found = entry[key]
        else:
            break
    return f"{index_type} {found}" if found is not None else None


def compile_pattern(query, case_sensitive=False):
    terms = [t for t in re.split(r"\s+", query.strip()) if t]
    if not terms:
        return None, []
    pattern = "|".join(re.escape(t) for t in terms)
    flags = 0 if case_sensitive else re.IGNORECASE
    return re.compile(pattern, flags), terms


def score_passage(passage, terms, case_sensitive=False):
    """Score = total hits + 5*distinct-terms-matched. Rewards AND-coverage."""
    flags = 0 if case_sensitive else re.IGNORECASE
    hits = 0
    distinct = 0
    for term in terms:
        count = len(re.findall(re.escape(term), passage, flags))
        if count > 0:
            distinct += 1
        hits += count
    return hits + (distinct * 5)


def looks_structured(passage):
    """Heuristic: passage looks like a supplement table / nutrient list."""
    lines = passage.split("\n")
    if len(lines) < 4:
        return False
    short_lines = sum(1 for l in lines if 3 < len(l.strip()) < 70)
    dose_lines = sum(1 for l in lines
                     if re.search(r"\b\d+(\.\d+)?\s*(mg|mcg|iu|g|ml)\b", l, re.IGNORECASE))
    return (short_lines / len(lines) > 0.5 and dose_lines >= 2) or dose_lines >= 5


def extract_passages(text, pattern, terms, context_chars, case_sensitive=False):
    """Cluster hits, snap to paragraph boundaries, return passage dicts."""
    matches = list(pattern.finditer(text))
    if not matches:
        return []

    clusters = []
    current = [matches[0].start()]
    for m in matches[1:]:
        if m.start() - current[-1] < CLUSTER_DISTANCE:
            current.append(m.start())
        else:
            clusters.append(current)
            current = [m.start()]
    clusters.append(current)

    passages = []
    for cluster in clusters:
        mid = (cluster[0] + cluster[-1]) // 2
        half = context_chars // 2
        start = max(0, mid - half)
        end = min(len(text), mid + half)

        # Snap end forward to paragraph boundary within 500 chars
        boundary = text.find("\n\n", end, min(end + 500, len(text)))
        if boundary != -1:
            end = boundary

        # Snap start backward to paragraph boundary within 500 chars
        back_start = max(0, start - 500)
        boundary = text.rfind("\n\n", back_start, start)
        if boundary != -1:
            start = boundary + 2

        passage = text[start:end].strip()
        score = score_passage(passage, terms, case_sensitive)
        passages.append({
            "char_offset": start,
            "char_end": end,
            "passage": passage,
            "score": score,
            "structured": looks_structured(passage),
            "hit_count": len(cluster),
        })
    return passages


def search_corpus(query, max_results=DEFAULT_MAX_RESULTS, context=DEFAULT_CONTEXT,
                  books_only=False, transcripts_only=False,
                  tier_cutoff=DEFAULT_TIER_CUTOFF, case_sensitive=False,
                  per_source_cap=PER_SOURCE_CAP):
    pattern, terms = compile_pattern(query, case_sensitive)
    if pattern is None:
        return []

    cutoff_rank = TIER_PRIORITY.get(tier_cutoff, 1)
    results = []

    # ----- Books (Tier 1) — cached load per Pass A.3.5 -----
    if not transcripts_only:
        for book_txt, text, idx_type, idx_data in _load_books_cached():
            for psg in extract_passages(text, pattern, terms, context, case_sensitive):
                psg["source"] = book_txt.name
                psg["source_type"] = "book"
                psg["tier"] = "T1 book"
                psg["tier_rank"] = -1
                psg["location"] = locate_in_book(idx_type, idx_data, psg["char_offset"])
                results.append(psg)

    # ----- Transcripts (Tier 2) — cached load per Pass A.3.5 -----
    if not books_only:
        for t_txt, text, tier, tier_rank in _load_transcripts_cached():
            if tier_rank > cutoff_rank:
                continue
            for psg in extract_passages(text, pattern, terms, context, case_sensitive):
                psg["source"] = t_txt.name
                psg["source_type"] = "transcript"
                psg["tier"] = f"T2 transcript ({tier})"
                psg["tier_rank"] = tier_rank
                psg["location"] = None
                results.append(psg)

    # Sort: structured first, then tier (books before transcripts), then score desc
    results.sort(key=lambda r: (not r["structured"], r["tier_rank"], -r["score"]))

    # Per-source cap so one source can't dominate
    capped = []
    per_source_counts = {}
    for r in results:
        src = r["source"]
        if per_source_counts.get(src, 0) >= per_source_cap:
            continue
        capped.append(r)
        per_source_counts[src] = per_source_counts.get(src, 0) + 1
        if len(capped) >= max_results:
            break
    return capped


def format_results(results, query):
    out = [f"# Corpus search: \"{query}\"", f"_{len(results)} passages_\n"]
    if not results:
        out.append("No matches found. Possible causes:")
        out.append("- corpus genuinely does not cover this topic")
        out.append("- query terms don't match Wallach's vocabulary — try synonyms")
        out.append("- query was too narrow — relax terms")
        return "\n".join(out)
    for i, r in enumerate(results, 1):
        out.append(f"---\n\n## {i}. {r['source']}")
        meta = [r["tier"]]
        if r.get("location"):
            meta.append(r["location"])
        meta.append(f"score {r['score']}")
        meta.append(f"{r['hit_count']} hits")
        if r["structured"]:
            meta.append("**STRUCTURED**")
        out.append(f"_{' · '.join(meta)}_\n")
        out.append("```")
        out.append(r["passage"])
        out.append("```\n")
    return "\n".join(out)


def main():
    p = argparse.ArgumentParser(description="Wallach corpus retrieval.")
    p.add_argument("query", nargs="*", help="Search terms (OR'd; scoring rewards AND-coverage).")
    p.add_argument("--query", "-q", dest="query_flag", help="Alternative way to pass query.")
    p.add_argument("--max", "-n", type=int, default=DEFAULT_MAX_RESULTS, help="Max results.")
    p.add_argument("--context", "-c", type=int, default=DEFAULT_CONTEXT, help="Context window chars.")
    p.add_argument("--books-only", action="store_true")
    p.add_argument("--transcripts-only", action="store_true")
    p.add_argument("--tier", default=DEFAULT_TIER_CUTOFF, choices=["High", "Moderate", "Low"],
                   help="Transcript tier cutoff (inclusive).")
    p.add_argument("--case-sensitive", action="store_true")
    p.add_argument("--json", action="store_true", help="Output JSON.")
    p.add_argument("--per-source", type=int, default=PER_SOURCE_CAP,
                   help="Max passages per source file.")
    args = p.parse_args()

    query = args.query_flag or " ".join(args.query)
    if not query.strip():
        p.error("query required")

    results = search_corpus(
        query,
        max_results=args.max,
        context=args.context,
        books_only=args.books_only,
        transcripts_only=args.transcripts_only,
        tier_cutoff=args.tier,
        case_sensitive=args.case_sensitive,
        per_source_cap=args.per_source,
    )

    if args.json:
        print(json.dumps(results, indent=2, default=str))
    else:
        print(format_results(results, query))


if __name__ == "__main__":
    main()
