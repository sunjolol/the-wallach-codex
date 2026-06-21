"""
ingest_podcast.py - add transcribed DDDL Radio episodes to manifest.csv.

Reads knowledge/podcast-transcripts/*.txt and knowledge/podcast-episodes.json
(for episode metadata: title, date, duration). Adds one manifest row per
episode with category=Moderate (Wallach with co-host Doug Winfrey).

Idempotent: episodes already in manifest are skipped.

Usage:
  python ingest_podcast.py
  python ingest_podcast.py --rebuild   # reprocess all podcast rows
"""

import csv
import io
import json
import os
import re
import sys
from collections import Counter
from datetime import datetime
from pathlib import Path


HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
KNOWLEDGE = ROOT / "knowledge"
TRANSCRIPT_DIR = KNOWLEDGE / "podcast-transcripts"
INDEX_FILE = KNOWLEDGE / "podcast-episodes.json"
MANIFEST = KNOWLEDGE / "manifest.csv"
CHANGELOG = KNOWLEDGE / "corpus-changelog.md"

FIELDS = ["filename","title","youtube_id","category","confidence_basis",
          "reason","cospeakers","topics","char_count","word_count"]


def safe_overwrite(path: Path, content: str):
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(content, encoding="utf-8")
    os.replace(tmp, path)


TOPIC_VOCAB = {
    "minerals":[r"\bmineral",r"\btrace element",r"\bplant.derived"],
    "selenium":[r"\bselenium\b"],"copper":[r"\bcopper\b"],"calcium":[r"\bcalcium\b"],
    "magnesium":[r"\bmagnesium\b"],"zinc":[r"\bzinc\b"],"chromium":[r"\bchromium\b"],
    "vanadium":[r"\bvanadium\b"],"iodine":[r"\biodine\b"],"iron":[r"\biron\b"],
    "diabetes":[r"\bdiabet"],"obesity":[r"\bobes",r"\bweight"],
    "arthritis":[r"\barthrit"],"osteoporosis":[r"\bosteoporo"],
    "alzheimers":[r"\balzheim"],"dementia":[r"\bdementi"],
    "cancer":[r"\bcancer",r"\btumor",r"\bneoplasm",r"\blymphoma"],
    "cardiovascular":[r"\bheart",r"\bcardio",r"\bblood pressure",r"\bhypertension"],
    "stroke":[r"\bstroke"],"kidney":[r"\bkidney",r"\bdialysis"],
    "thyroid":[r"\bthyroid",r"\bhashimoto"],
    "autism/adhd":[r"\bautism",r"\badhd"],
    "cholesterol":[r"\bcholesterol",r"\bstatin"],
    "diet/nutrition":[r"\bdiet",r"\bnutrition",r"\b90 essential",r"\bketosis"],
    "gluten":[r"\bgluten"],"salt":[r"\bsalt\b"],
    "fluoride":[r"\bfluoride\b",r"\bfluorid"],
    "lung/respiratory":[r"\blung",r"\bcopd",r"\bmucus"],
    "skin/hair":[r"\bskin",r"\bhair",r"\bdermatitis"],
    "bones/joints":[r"\bjoint",r"\bbone",r"\btendon"],
    "muscles":[r"\bmuscle",r"\bcramp"],
    "brain/cognitive":[r"\bbrain",r"\bmemory",r"\bcognitive"],
    "longevity":[r"\blongev",r"\blive long"],
    "pregnancy/birth":[r"\bpregnan",r"\bbirth defect"],
    "hormones/reproductive":[r"\bovarian",r"\bfibroid",r"\buterine",r"\bhormone"],
    "youngevity-product":[r"\byoungevity",r"\bmighty"],
    "anti-mainstream":[r"\bmainstream\b.*\bmedicine",r"\bbig pharma"],
}


def topics_from_text(text):
    low = text.lower()
    return [t for t, pats in TOPIC_VOCAB.items() if any(re.search(p, low) for p in pats)]


def load_manifest():
    if not MANIFEST.exists():
        return [], set()
    rows = list(csv.DictReader(MANIFEST.open(encoding="utf-8")))
    return rows, {r["filename"] for r in rows}


def write_manifest(rows):
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=FIELDS)
    w.writeheader()
    for r in rows:
        w.writerow(r)
    safe_overwrite(MANIFEST, buf.getvalue())


def episode_meta_by_stem(episodes):
    """Map a transcript file stem -> episode metadata. Stems are constructed
    in podcast_download.safe_stem; we replicate the key derivation here."""
    out = {}
    for e in episodes:
        date = (e.get("pub_date") or "")[:10] or "unknown-date"
        suffix = ""
        if e.get("mp3_url"):
            m = re.search(r"([0-9a-f]{12,})\.mp3$", e["mp3_url"])
            if m:
                suffix = m.group(1)[:12]
        if not suffix and e.get("guid"):
            suffix = re.sub(r"[^a-zA-Z0-9]", "", str(e["guid"]))[-12:]
        title_part = re.sub(r"[^A-Za-z0-9_-]", "_", (e.get("title") or "")[:50])
        stem = "_".join(p for p in [date, title_part, suffix] if p)
        out[stem] = e
    return out


def append_changelog(added):
    if not added: return
    lines = [f"\n## {datetime.now().strftime('%Y-%m-%d %H:%M')} - Podcast ingestion\n",
             f"Added {len(added)} episode transcript(s)\n\n"]
    for r in added:
        lines.append(f"- **{r['category']}** `{r['filename']}` - "
                     f"{r['title'][:70]} ({r['word_count']:,} words)\n")
    if not CHANGELOG.exists():
        CHANGELOG.write_text("# Corpus Changelog\n", encoding="utf-8")
    with CHANGELOG.open("a", encoding="utf-8") as f:
        f.writelines(lines)


def main():
    rebuild = "--rebuild" in sys.argv
    rows, seen = load_manifest()
    if rebuild:
        before = len(rows)
        rows = [r for r in rows if r.get("confidence_basis") != "podcast-ingestion"]
        seen = {r["filename"] for r in rows}
        print(f"--rebuild: dropped {before - len(rows)} existing podcast rows")

    if not INDEX_FILE.exists():
        print(f"ERROR: {INDEX_FILE.name} not found. Run podcast_index.py first.")
        sys.exit(1)
    episodes = json.loads(INDEX_FILE.read_text(encoding="utf-8"))
    meta = episode_meta_by_stem(episodes)

    txts = sorted(TRANSCRIPT_DIR.glob("*.txt"))
    print(f"Found {len(txts)} transcript file(s) in {TRANSCRIPT_DIR.name}/")

    MIN_REAL_WORDS = 500   # dead-air episodes typically yield ~100 words of dots

    added = []
    excluded_count = 0
    for txt in txts:
        filename = f"podcast/{txt.name}"  # logical prefix to distinguish in manifest
        if filename in seen:
            continue
        text = txt.read_text(encoding="utf-8", errors="ignore")
        ep = meta.get(txt.stem)
        title = ep["title"] if ep else txt.stem
        # Count "real" words - tokens that contain at least one letter.
        words = text.split()
        real_words = [w for w in words if any(c.isalpha() for c in w)]
        if len(real_words) < MIN_REAL_WORDS:
            # Mark as Exclude (likely dead air or filler episode)
            added.append({
                "filename": filename,
                "title": title,
                "youtube_id": "",
                "category": "Exclude",
                "confidence_basis": "podcast-ingestion",
                "reason": f"Dead-air or filler episode ({len(real_words)} real words < {MIN_REAL_WORDS})",
                "cospeakers": "",
                "topics": "",
                "char_count": len(text),
                "word_count": len(words),
            })
            excluded_count += 1
            continue
        topics = topics_from_text(title + " " + text[:6000])
        added.append({
            "filename": filename,
            "title": title,
            "youtube_id": "",
            "category": "Moderate",  # Wallach + Doug Winfrey co-host
            "confidence_basis": "podcast-ingestion",
            "reason": "DDDL Radio episode (Wallach with co-host Doug Winfrey)",
            "cospeakers": "Doug Winfrey",
            "topics": "; ".join(topics),
            "char_count": len(text),
            "word_count": len(words),
        })

    if not added:
        print("Nothing new to ingest.")
        return

    rows.extend(added)
    write_manifest(rows)
    append_changelog(added)
    bc = Counter(r["category"] for r in added)
    total_words = sum(r["word_count"] for r in added)
    print(f"Ingested {len(added)} episode(s) ({total_words:,} words). Buckets: {dict(bc)}")
    print(f"Manifest now has {len(rows)} rows.")


if __name__ == "__main__":
    main()
