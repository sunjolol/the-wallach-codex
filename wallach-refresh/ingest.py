"""
ingest.py — process newly-arrived VTT files, classify, append to manifest.

Idempotent: any .vtt in transcripts/ not already in knowledge/manifest.csv gets
processed. Anything already in the manifest is skipped.

After ingestion: rewrites manifest.csv, topic-index.json, triage-summary.md,
and appends a row to corpus-changelog.md describing what was added.
"""

import csv
import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

# ---- Locate root ------------------------------------------------------------
# This script lives in <root>/wallach-refresh/. Root is its parent.
HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
SRC = ROOT / "transcripts"
KNOWLEDGE = ROOT / "knowledge"
CLEAN = KNOWLEDGE / "transcripts-clean"
MANIFEST = KNOWLEDGE / "manifest.csv"
CHANGELOG = KNOWLEDGE / "corpus-changelog.md"
ARCHIVE_FILE = HERE / "downloaded.txt"     # yt-dlp's --download-archive
BLOCKLIST_FILE = HERE / "blocklist.txt"    # manual permanent YouTube ID blocks

CLEAN.mkdir(parents=True, exist_ok=True)
KNOWLEDGE.mkdir(parents=True, exist_ok=True)

# ---- Classifier (kept in sync with /tmp/triage.py logic) -------------------

WALLACH_PATTERNS = [
    r"\bdr\.?\s*joel\s+wallach\b", r"\bdr\.?\s*wallach\b",
    r"\bjoel\s+wallach\b", r"\bdr\s+loel\s+wallach\b",
    r"\bjoel\s+d\.?\s+wallach\b", r"\bdr\.?\s*wallagh\b",
]
WALLACH_SHOWS = [
    r"\bask\s+doc\s+live\b", r"\bdaily\s+with\s+doc\b",
    r"\bjudging\s+health\b", r"\bdead\s+doctors\s+do?n[' ]?t\s+lie\b",
]

# ---- Junk patterns: titles that obviously aren't Wallach content ----------
# Anything matching these gets deleted from disk and its YouTube ID is added
# to downloaded.txt so yt-dlp won't re-download it. Safety: if the title also
# contains "wallach" the junk check is bypassed.
JUNK_PATTERNS = [
    # Chinese / cultivation / web-novel dramas
    (r"【\s*multi\s*sub\s*】", "Multi-sub drama"),
    (r"\bmulti[ -]?sub\b", "Multi-sub drama"),
    (r"\bsect\s+master\b", "Cultivation drama fiction"),
    (r"\bcultivation\s+(?:drama|novel)\b", "Cultivation drama fiction"),
    # MST3K / bedtime channels
    (r"\bmst3k\b", "MST3K episode"),
    (r"\btime\s+for\s+go\s+to\s+bed\b", "Bedtime-channel content"),
    # Stand-up comedy
    (r"\bstand[- ]?up\s+comedy\b", "Stand-up comedy"),
    (r"\(full\s+show\)\s*[|｜].*\bcomedy\b", "Comedy full show"),
    (r"\bgianmarco\s+soresi\b", "Comedy (Gianmarco Soresi)"),
    (r"\bdan\s+cummins\b", "Comedy (Dan Cummins)"),
    # Sleep / meditation / music
    (r"\bmusic\s+for\s+(?:going\s+within|sleep|meditation|relaxation|bedtime|studying)\b", "Sleep/meditation music"),
    (r"\bneo[- ]?classical\s+(?:solo\s+)?piano\b", "Neo-classical piano music"),
    (r"\bsacred\s+renewal\s+place\b", "Sleep-music channel"),
    # Romance / mini-drama shorts (YouTube's algorithmic short-form serial fiction)
    (r"#\s*romance\b", "Romance mini-drama short"),
    (r"#\s*mini[ -]?dramas?\b", "Mini-drama short"),
    (r"\bspoiled\s+me\s+as\s+princess\b", "Drama fiction"),
    (r"\breborn[!.\s].{0,60}(?:family|princess|sect|villain|empress|wife|emperor|inner\s+voice)", "Reborn-genre fiction"),
    (r"\bmy\s+sister\s+died\s+young\b", "Mini-drama fiction"),
    (r"\bdied\s+betrayed\b", "Drama fiction"),
    (r"\bbirthday\s+banquet\b.*\bburn\b", "Drama fiction"),
    # Generic retirement/lifestyle clickbait
    (r"\b\d+\s+things\s+that\s+go\s+quiet\s+after\s+you\s+retire\b", "Retirement clickbait"),
    # Personal-revenge clickbait with no health angle
    (r"\bsent\s+her\s+to\s+prison\s+and\s+hurt\s+her\b", "Revenge-story clickbait"),
]

def is_junk(fname):
    """Return (True, reason) if filename matches a junk pattern, else (False, '').
    Safety: filenames containing 'wallach' are never classified as junk."""
    low = fname.lower()
    if "wallach" in low:
        return False, ""
    for pat, reason in JUNK_PATTERNS:
        if re.search(pat, low):
            return True, reason
    return False, ""

def load_blocked_ids():
    """Read blocklist.txt — one YouTube ID per line, '#' for comments.
    Returns a set of IDs."""
    if not BLOCKLIST_FILE.exists():
        return set()
    ids = set()
    for line in BLOCKLIST_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        # Accept either bare ID or "youtube <id>" archive form
        parts = line.split()
        ids.add(parts[-1])
    return ids

def add_to_archive(ytid):
    """Append 'youtube <id>' to downloaded.txt if not already present.
    Safe to call repeatedly. Returns True if newly added."""
    if not ytid:
        return False
    entry = f"youtube {ytid}"
    existing = set()
    if ARCHIVE_FILE.exists():
        existing = set(ARCHIVE_FILE.read_text(encoding="utf-8").splitlines())
    if entry in existing:
        return False
    with ARCHIVE_FILE.open("a", encoding="utf-8") as f:
        f.write(entry + "\n")
    return True

def delete_junk(fname, reason):
    """Delete a junk transcript from disk, scrub its cleaned text if any,
    and add its YouTube ID to the yt-dlp archive so it won't return.
    Returns dict describing what was deleted for changelog reporting."""
    src = SRC / fname
    cleaned = CLEAN / fname.replace(".en.vtt", ".txt")
    ytid = yt_id(fname)
    try:
        src.unlink(missing_ok=True)
    except Exception as e:
        print(f"  ! could not delete {fname}: {e}")
    try:
        cleaned.unlink(missing_ok=True)
    except Exception:
        pass
    add_to_archive(ytid)
    return dict(filename=fname, youtube_id=ytid, reason=reason)

OTHER_SPEAKERS_EXCLUDE = [
    (r"\bdr\.?\s*mandell\b", "Dr. Mandell"),
    (r"\bdr\.?\s*peter\s+glidden\b", "Dr. Peter Glidden"),
    (r"\bpeter\s+duesberg\b", "Peter Duesberg"),
    (r"\b2-minute\s+neuroscience\b", "2-Minute Neuroscience"),
    (r"\btai\s+chi\s+vs\s+qi\s+gong\b", "Tai Chi vs Qi Gong"),
    (r"\bdr\.?\s*sten\s+ekberg\b", "Dr. Sten Ekberg"),
    (r"\bhello\s+health\s+champions\b", "Sten Ekberg show"),
    (r"\bdr\.?\s*tom\s+biernacki\b", "Dr. Tom Biernacki"),
    (r"\btalking\s+with\s+docs\b", "Talking with Docs"),
    (r"\bgrowing\s+your\s+greens\b", "Growing Your Greens"),
    # Youngevity-affiliated co-speakers and shows that are not Wallach
    (r"\bpharmacist\s+ben\b", "Pharmacist Ben Fuchs (solo show)"),
    (r"\bdr\.?\s*judy\s+reynolds\b", "Dr. Judy Reynolds"),
    (r"\bdr\.?\s*lisa\s+singletary\b", "Dr. Lisa Singletary"),
    (r"\byvonne\s+rea\b", "Yvonne Rea"),
    (r"\bdr\.?\s*joanne\s+conaway\b", "Dr. Joanne Conaway"),
    (r"\bjonathan\s+emord\b", "Jonathan Emord"),
    (r"\bjill\s+hewlett\b", "Jill Hewlett"),
    (r"\braymond\s+brown\b", "Raymond Brown"),
    (r"\bbrian\s+krater\b", "Brian Krater (guest interview)"),
    # Testimonial / product / promo videos (not Wallach speaking)
    (r"\bbetter\s+health\s+(?:challenge|fitness)\b.*\b(?:semi-?finalist|finalist|q[1-4]|testimonial)\b", "Better Health Challenge testimonial"),
    (r"\b(?:keto|rev|wellness)\s+90\s+pak\b", "Youngevity product video"),
    (r"\btruaura\b", "TruAura product video"),
    (r"\bgluco-?gel\b.*\bcollagen\b", "Gluco-Gel product comparison"),
    (r"\bcollagen\s+peptides\b.*\bcollagen\s+booster\b", "Collagen product video"),
    (r"\bbeneyou\s+electrofuel\b", "BeneYou ElectroFuel product video"),
    (r"\bgl[ -]?p[ -]?1\s+30-system\b", "GLP-1 30-System product video"),
]
GLIDDEN_SOLO = [r"\bdr\.?\s*glidden\b", r"\bdr\s+peter\s+glidden\s+caller\b"]
WALLACH_WITH_COSPEAKER = [
    r"\bdr\.?\s*wallach\s*&\s*dr\.?\s*peter\s+glidden\b",
    r"\bwith\s+dr\.?\s*ben\s+fuchs\b",
    r"\bben\s+fuchs\s+interviews\s+dr\b.*wallach",
    r"\bdr\.?\s*schrauzer\s*&\s*dr\.?\s*wallach\b",
    r"\(dr\.?\s*wallach\)dr\.?\s*schrauzer",
    r"\balex\s+jones\b.*wallach",
    r"\bdirk\s+twine\b",
]
POTS_SERIES = [
    r"\bpots\s+postural\s+orthostatic", r"\bpots\s+signals\s+orthostatic",
    r"\bpots\s+isn'?t\s+a\s+disease", r"\bpots[:：]\s*know\s+the\s+symptoms",
    r"\bwhat\s+characterizes\s+pots",
    r"\bis\s+there\s+any\s+hope\s+for\s+pots\s+patients",
    r"\bmedication\s+options\s+for\s+pots",
]

YT_ID_RE = re.compile(r"-([A-Za-z0-9_-]{11})\.en\.vtt$")
def yt_id(f): m = YT_ID_RE.search(f); return m.group(1) if m else ""
def title_from_fname(f): return re.sub(r"-([A-Za-z0-9_-]{11})\.en\.vtt$", "", f).strip()
def matches_any(s, pats): return any(re.search(p, s) for p in pats)

def classify_by_filename(fname):
    low = fname.lower()
    cospeakers = []
    for pat, name in OTHER_SPEAKERS_EXCLUDE:
        if re.search(pat, low) and "wallach" not in low:
            return "Exclude", "filename", f"Primary speaker: {name}", [name]
    if matches_any(low, POTS_SERIES) and "wallach" not in low:
        return "Exclude", "filename", "POTS awareness series (not Wallach)", []
    if matches_any(low, GLIDDEN_SOLO) and "wallach" not in low:
        return "Exclude", "filename", "Dr. Peter Glidden solo content", ["Dr. Peter Glidden"]
    if matches_any(low, WALLACH_WITH_COSPEAKER):
        if "glidden" in low: cospeakers.append("Dr. Peter Glidden")
        if "fuchs" in low: cospeakers.append("Dr. Ben Fuchs")
        if "schrauzer" in low: cospeakers.append("Dr. Schrauzer")
        if "alex jones" in low: cospeakers.append("Alex Jones")
        if "dirk twine" in low: cospeakers.append("Dirk Twine")
        return "Moderate", "filename", "Wallach with co-speaker", cospeakers
    if matches_any(low, WALLACH_PATTERNS):
        return "High", "filename", "Wallach named in title", []
    if matches_any(low, WALLACH_SHOWS):
        return "High", "filename", "Known Wallach show/lecture", []
    return "Low", "filename", "No speaker cue in title", []

CUE_TAG_RE = re.compile(r"<[^>]+>")
TS_LINE_RE = re.compile(r"^\d\d:\d\d:\d\d\.\d{3}\s*-->\s*\d\d:\d\d:\d\d\.\d{3}")

def clean_vtt(text):
    out, recent = [], []
    for raw in text.splitlines():
        line = raw.strip()
        if not line: continue
        if line.startswith("WEBVTT") or line.startswith("Kind:") or line.startswith("Language:"): continue
        if TS_LINE_RE.match(line): continue
        cleaned = CUE_TAG_RE.sub("", line).strip()
        if not cleaned: continue
        if cleaned in recent[-5:]: continue
        out.append(cleaned)
        recent.append(cleaned)
        if len(recent) > 20: recent = recent[-10:]
    return "\n".join(out)

WALLACH_CUES = [
    r"\b90\s+(?:essential\s+)?(?:minerals|nutrients|for life)\b",
    r"\bplant.derived\s+minerals\b", r"\byoungevity\b",
    r"\bdead\s+doctors\s+do?n'?t\s+lie\b", r"\bpig\s+farm\b",
    r"\bselenium\s+deficien", r"\bcopper\s+deficien",
    r"\bmighty\s+90\b|\bmighty\s+ninety\b",
    r"\bcystic\s+fibrosis\b.*\bselenium\b|\bselenium\b.*\bcystic\s+fibrosis\b",
    r"\bsecret\s+sauce\b", r"\bessential\s+nutrients\b",
    r"\btype\s*2\s+diabetes\s+is\s+reversible\b",
    r"\b10[, ]000\s+pound\s+gorilla\b", r"\bmd[- ]directed\b",
    r"\bbeef\s+farm\s+in\s+missouri\b",
    r"\bgrew\s+up\s+on\s+a\s+(?:beef|missouri)\s+farm\b",
    r"\bthird\s+leading\s+cause\s+of\s+death\b",
    r"\bdoc\s+wallach\b", r"\bdr\.?\s+wallach\b",
    r"\b90\s+for\s+life\b",
]
OTHER_CUES = [
    (r"\bmy name is\s+\w+\s+mandell\b", "Mandell"),
    (r"\bi'?m dr\.? mandell\b", "Mandell"),
    (r"\bhello\s+health\s+champions\b", "Sten-Ekberg"),
    (r"\bdr\.?\s*tom\s+biernacki\b", "Biernacki"),
    (r"\btalking\s+with\s+docs\b", "Talking-with-Docs"),
]

def peek(plain, n=6000):
    s = plain[:n].lower()
    w = sum(1 for p in WALLACH_CUES if re.search(p, s))
    o = [name for p, name in OTHER_CUES if re.search(p, s)]
    return w, o

TOPIC_VOCAB = {
    "minerals":[r"\bmineral",r"\btrace element",r"\bplant.derived"],
    "selenium":[r"\bselenium\b"],"copper":[r"\bcopper\b"],"calcium":[r"\bcalcium\b"],
    "magnesium":[r"\bmagnesium\b"],"zinc":[r"\bzinc\b"],"chromium":[r"\bchromium\b"],
    "vanadium":[r"\bvanadium\b"],"iodine":[r"\biodine\b"],"iron":[r"\biron\b"],
    "diabetes":[r"\bdiabet"],"obesity":[r"\bobes",r"\bweight"],
    "arthritis":[r"\barthrit"],"osteoporosis":[r"\bosteoporo"],
    "alzheimers":[r"\balzheim"],"dementia":[r"\bdementi"],
    "cancer":[r"\bcancer",r"\btumor",r"\bneoplasm",r"\blymphoma"],
    "cardiovascular":[r"\bheart",r"\bcardio",r"\bblood pressure",r"\bhypertension",r"\bbradycardia",r"\batrial"],
    "stroke":[r"\bstroke"],
    "kidney":[r"\bkidney",r"\bdialysis",r"\bcreatinine"],
    "bladder":[r"\bbladder"],"gallbladder":[r"\bgallbladder"],"liver":[r"\bliver"],
    "thyroid":[r"\bthyroid",r"\bhashimoto"],
    "autism/adhd":[r"\bautism",r"\badhd"],"parkinsons":[r"\bparkinson"],
    "cholesterol":[r"\bcholesterol",r"\bstatin"],
    "diet/nutrition":[r"\bdiet",r"\bnutrition",r"\b90 essential",r"\bketosis",r"\bvegetarian"],
    "gluten":[r"\bgluten"],"salt":[r"\bsalt\b"],
    "fluoride":[r"\bfluoride\b",r"\bfluorid"],
    "lung/respiratory":[r"\blung",r"\bcopd",r"\bmucus",r"\bcough",r"\bairflow"],
    "skin/hair":[r"\bskin",r"\bhair",r"\bdermatitis",r"\bfungus",r"\bnail"],
    "bones/joints":[r"\bjoint",r"\bbone",r"\bbursit",r"\btendon",r"\bspur"],
    "muscles":[r"\bmuscle",r"\bcramp",r"\bdystrophy"],
    "sleep":[r"\bsleep"],
    "energy/fatigue":[r"\benergy",r"\bfatigue",r"\bpots\b"],
    "brain/cognitive":[r"\bbrain",r"\bmemory",r"\bcognitive",r"\bseizure",r"\bschizophren"],
    "longevity":[r"\blongev",r"\blive long",r"\b100\b",r"\bbiography"],
    "pregnancy/birth":[r"\bpregnan",r"\bbirth defect"],
    "hormones/reproductive":[r"\bovarian",r"\bfibroid",r"\buterine",r"\bhormone",r"\bvaginal",r"\bhysterectomy",r"\bpeyronie"],
    "youngevity-product":[r"\byoungevity",r"\bmighty"],
    "lecture-flagship":[r"\bdead doctors",r"\bpublic enemy",r"\bgo to jail",r"\bblack gene"],
    "anti-mainstream":[r"\bjail",r"\bmainstream\b.*\bmedicine",r"\bbig pharma"],
}

def topics_from_text(text):
    low = text.lower()
    return [t for t, pats in TOPIC_VOCAB.items() if any(re.search(p, low) for p in pats)]

# ---- Process new files -----------------------------------------------------

FIELDS = ["filename","title","youtube_id","category","confidence_basis",
          "reason","cospeakers","topics","char_count","word_count"]

def load_manifest():
    if not MANIFEST.exists():
        return [], set()
    rows = list(csv.DictReader(MANIFEST.open(encoding="utf-8")))
    return rows, {r["filename"] for r in rows}

def process_one(fname):
    src = SRC / fname
    title = title_from_fname(fname)
    ytid = yt_id(fname)
    cat, basis, reason, cospeakers = classify_by_filename(fname)
    try:
        raw = src.read_text(encoding="utf-8", errors="ignore")
    except Exception as e:
        return dict(filename=fname,title=title,youtube_id=ytid,
                    category="Exclude",confidence_basis="read-error",
                    reason=str(e),cospeakers="",topics="",
                    char_count=0,word_count=0)
    plain = clean_vtt(raw)
    (CLEAN / fname.replace(".en.vtt", ".txt")).write_text(plain, encoding="utf-8")
    if cat in ("Low","Moderate"):
        w, o = peek(plain)
        if cat == "Low":
            if o:
                cat,basis,reason = "Exclude","content-peek",f"Other speaker cues: {o}"
                cospeakers = o
            elif w >= 3:
                cat,basis,reason = "High","content-peek",f"Strong Wallach cues ({w})"
            elif w >= 1:
                cat,basis,reason = "Moderate","content-peek",f"Wallach cues ({w})"
    topics = topics_from_text(title + " " + plain[:4000])
    return dict(filename=fname,title=title,youtube_id=ytid,
                category=cat,confidence_basis=basis,reason=reason,
                cospeakers="; ".join(cospeakers),topics="; ".join(topics),
                char_count=len(plain),word_count=len(plain.split()))

def safe_overwrite(path: Path, content: str):
    """Write atomically: temp file then os.replace. Bypasses some Windows
    file-protection scenarios (CFA / OneDrive) that block direct overwrites
    of existing files but allow create+rename. Verifies after."""
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(content, encoding="utf-8")
    os.replace(tmp, path)
    # Verify: read first 100 chars back to confirm write persisted
    check = path.read_text(encoding="utf-8")[:100]
    if not check:
        raise RuntimeError(f"Write to {path} appears empty after replace!")


def regenerate_summary_and_index(rows):
    bc = Counter(r["category"] for r in rows)
    tc, cospeakers = Counter(), Counter()
    for r in rows:
        for t in r["topics"].split("; "):
            if t: tc[t] += 1
        for c in r["cospeakers"].split("; "):
            if c: cospeakers[c] += 1
    usable = sum(1 for r in rows if r["category"] in ("High","Moderate"))
    usable_words = sum(int(r["word_count"]) for r in rows if r["category"] in ("High","Moderate"))
    high_words = sum(int(r["word_count"]) for r in rows if r["category"] == "High")
    s = [f"# Wallach Corpus Triage — Final\n\n",
         f"**Total files:** {len(rows)}\n",
         f"**Usable corpus (High + Moderate):** {usable} files, ~{usable_words:,} words\n",
         f"**High-confidence subset:** ~{high_words:,} words\n",
         f"_Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M')}_\n\n",
         "## Speaker confidence buckets\n"]
    for b in ("High","Moderate","Low","Exclude"):
        s.append(f"- **{b}**: {bc[b]}\n")
    s.append("\n## Co-speakers in Moderate bucket\n")
    for c,n in cospeakers.most_common(): s.append(f"- {c}: {n} files\n")
    s.append("\n## Top topics (file count)\n")
    for t,n in tc.most_common(40): s.append(f"- {t}: {n}\n")
    s.append("\n## Excluded files and reasons\n")
    for r in rows:
        if r["category"] == "Exclude":
            s.append(f"- `{r['filename']}` — {r['reason']}\n")
    safe_overwrite(KNOWLEDGE / "triage-summary.md", "".join(s))

    topic_index = defaultdict(list)
    for r in rows:
        if r["category"] not in ("High","Moderate"): continue
        for t in r["topics"].split("; "):
            if t:
                topic_index[t].append(dict(filename=r["filename"],
                    category=r["category"],word_count=int(r["word_count"]),
                    youtube_id=r["youtube_id"]))
    for t in topic_index:
        topic_index[t].sort(key=lambda x: -x["word_count"])
    safe_overwrite(KNOWLEDGE / "topic-index.json", json.dumps(dict(topic_index), indent=2))

def append_changelog(added_rows):
    bc = Counter(r["category"] for r in added_rows)
    lines = [f"\n## {datetime.now().strftime('%Y-%m-%d %H:%M')}\n",
             f"Added {len(added_rows)} files — "
             f"High:{bc['High']}, Moderate:{bc['Moderate']}, "
             f"Low:{bc['Low']}, Exclude:{bc['Exclude']}\n\n"]
    for r in added_rows:
        lines.append(f"- **{r['category']}** `{r['filename']}` — "
                     f"{r['reason']} ({r['word_count']:,} words)\n")
    if not CHANGELOG.exists():
        CHANGELOG.write_text("# Corpus Changelog\n", encoding="utf-8")
    with CHANGELOG.open("a", encoding="utf-8") as f:
        f.writelines(lines)

def write_manifest(rows):
    """Atomic write of manifest.csv."""
    import io
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=FIELDS)
    w.writeheader()
    for r in rows:
        w.writerow(r)
    safe_overwrite(MANIFEST, buf.getvalue())


def sweep_junk_and_blocked(on_disk):
    """First pass over files on disk: delete anything matching JUNK_PATTERNS
    or whose YouTube ID is in blocklist.txt. Files are unlinked, IDs are
    written to downloaded.txt so yt-dlp won't re-fetch.
    Returns (deleted_records, surviving_files)."""
    blocked_ids = load_blocked_ids()
    deleted = []
    survivors = []
    for f in on_disk:
        junk, reason = is_junk(f)
        if junk:
            deleted.append(delete_junk(f, reason))
            continue
        ytid = yt_id(f)
        if ytid and ytid in blocked_ids:
            deleted.append(delete_junk(f, "blocklist.txt entry"))
            continue
        survivors.append(f)
    return deleted, survivors


def append_junk_changelog(deleted):
    if not deleted:
        return
    lines = [f"\n## {datetime.now().strftime('%Y-%m-%d %H:%M')} — Junk removal\n",
             f"Deleted {len(deleted)} file(s) and added IDs to yt-dlp archive\n\n"]
    for d in deleted:
        lines.append(f"- `{d['filename']}` — {d['reason']} (id: {d['youtube_id']})\n")
    if not CHANGELOG.exists():
        CHANGELOG.write_text("# Corpus Changelog\n", encoding="utf-8")
    with CHANGELOG.open("a", encoding="utf-8") as f:
        f.writelines(lines)


def main():
    rebuild = "--rebuild" in sys.argv
    on_disk = sorted(f for f in os.listdir(SRC) if f.endswith(".vtt"))
    if rebuild:
        print("--rebuild flag: reclassifying every transcript on disk")
        # Preserve non-transcript manifest rows (books from ingest_books.py,
        # podcasts from ingest_podcast.py) — those don't end in .en.vtt.
        existing_rows, _ = load_manifest()
        preserved = [r for r in existing_rows if not r["filename"].endswith(".en.vtt")]
        if preserved:
            print(f"  Preserving {len(preserved)} non-transcript rows (books, podcasts)")
        rows = preserved
        seen = {r["filename"] for r in rows}
    else:
        rows, seen = load_manifest()

    # First pass: nuke junk + blocklist entries from disk before anything else.
    deleted, on_disk = sweep_junk_and_blocked(on_disk)
    if deleted:
        print(f"Deleted {len(deleted)} junk/blocked file(s) from disk:")
        for d in deleted:
            print(f"  - {d['filename']} [{d['reason']}]")
        deleted_names = {d["filename"] for d in deleted}
        before = len(rows)
        rows = [r for r in rows if r["filename"] not in deleted_names]
        if before != len(rows):
            print(f"  Removed {before - len(rows)} stale manifest rows for deleted files")
        seen = {r["filename"] for r in rows}
        append_junk_changelog(deleted)

    new = [f for f in on_disk if f not in seen]
    print(f"Manifest has {len(rows)} rows. {len(on_disk)} files on disk. {len(new)} new.")
    if not new and not rebuild and not deleted:
        print("Nothing to ingest.")
        return
    added = [process_one(f) for f in new]
    rows.extend(added)
    write_manifest(rows)
    regenerate_summary_and_index(rows)
    if added:
        append_changelog(added)
    bc = Counter(r["category"] for r in added)
    total_bc = Counter(r["category"] for r in rows)
    print(f"Ingested {len(added)}: {dict(bc)}")
    print(f"Manifest now has {len(rows)} rows. Bucket totals: {dict(total_bc)}")


if __name__ == "__main__":
    main()
ucket totals: {dict(total_bc)}")


if __name__ == "__main__":
    main()
