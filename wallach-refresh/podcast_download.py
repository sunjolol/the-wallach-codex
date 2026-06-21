"""
podcast_download.py - download MP3s from a podcast episode index.

Reads knowledge/podcast-pilot.json (or --full for podcast-episodes.json).
Streams each MP3 to knowledge/podcast-audio/<safe-stem>.mp3.

Dedup uses knowledge/podcast-downloaded.txt (one episode GUID per line) rather
than file-existence, so you can move MP3s out of podcast-audio/ to your own
archive without the script re-pulling them on the next run.

Usage:
  python podcast_download.py             # pilot set
  python podcast_download.py --full      # whole archive (~60 GB)
  python podcast_download.py --dry-run   # show what would download
"""

import json
import re
import sys
from pathlib import Path

try:
    import requests
except ImportError:
    print("ERROR: requests not installed. Run:  python -m pip install --user requests")
    sys.exit(1)


HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
KNOWLEDGE = ROOT / "knowledge"
AUDIO_DIR = KNOWLEDGE / "podcast-audio"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

PILOT_FILE = KNOWLEDGE / "podcast-pilot.json"
INDEX_FILE = KNOWLEDGE / "podcast-episodes.json"
ARCHIVE = KNOWLEDGE / "podcast-downloaded.txt"

USER_AGENT = "Mozilla/5.0 (compatible; WallachCorpusFetcher/1.0)"


def safe_stem(ep):
    date = (ep.get("pub_date") or "")[:10] or "unknown-date"
    suffix = ""
    if ep.get("mp3_url"):
        m = re.search(r"([0-9a-f]{12,})\.mp3$", ep["mp3_url"])
        if m:
            suffix = m.group(1)[:12]
    if not suffix and ep.get("guid"):
        suffix = re.sub(r"[^a-zA-Z0-9]", "", str(ep["guid"]))[-12:]
    title_part = re.sub(r"[^A-Za-z0-9_-]", "_", (ep.get("title") or "")[:50])
    return "_".join(p for p in [date, title_part, suffix] if p)


def load_archive():
    if not ARCHIVE.exists():
        return set()
    return set(line.strip() for line in ARCHIVE.read_text(encoding="utf-8").splitlines() if line.strip())


def archive_record(guid):
    with ARCHIVE.open("a", encoding="utf-8") as f:
        f.write(guid + "\n")


def episode_key(ep):
    """Stable identifier we record in the archive."""
    return ep.get("guid") or ep.get("mp3_url") or ""


def download(url, dest, dry_run=False):
    if dry_run:
        print("  [dry-run] would download %s -> %s" % (url, dest.name))
        return True
    try:
        with requests.get(url, stream=True, timeout=60,
                          headers={"User-Agent": USER_AGENT}) as r:
            r.raise_for_status()
            tmp = dest.with_suffix(dest.suffix + ".part")
            written = 0
            with tmp.open("wb") as f:
                for chunk in r.iter_content(chunk_size=64 * 1024):
                    if chunk:
                        f.write(chunk)
                        written += len(chunk)
            tmp.replace(dest)
            mb = written / (1024 * 1024)
            print("  OK (%.1f MB) -> %s" % (mb, dest.name))
            return True
    except Exception as e:
        print("  FAILED: %s" % e)
        return False


def main():
    full = "--full" in sys.argv
    dry_run = "--dry-run" in sys.argv
    src = INDEX_FILE if full else PILOT_FILE
    if not src.exists():
        print("ERROR: %s not found. Run podcast_index.py first." % src)
        sys.exit(1)

    episodes = json.loads(src.read_text(encoding="utf-8"))
    episodes = [e for e in episodes if e.get("mp3_url")]
    archive = load_archive()
    print("Reading %d episodes from %s" % (len(episodes), src.name))
    print("Audio dir: %s" % AUDIO_DIR)
    print("Archive: %s (%d records)" % (ARCHIVE.name, len(archive)))
    if dry_run:
        print("(dry-run mode - no downloads will happen)")

    ok = failed = skipped = 0
    for i, ep in enumerate(episodes, 1):
        key = episode_key(ep)
        if key in archive:
            skipped += 1
            continue
        stem = safe_stem(ep)
        dest = AUDIO_DIR / (stem + ".mp3")
        print("[%d/%d] %s" % (i, len(episodes), ep["title"][:70]))
        if download(ep["mp3_url"], dest, dry_run=dry_run):
            ok += 1
            if not dry_run:
                archive.add(key)
                archive_record(key)
        else:
            failed += 1

    print("")
    print("Downloaded: %d" % ok)
    print("Skipped (already in archive): %d" % skipped)
    print("Failed: %d" % failed)


if __name__ == "__main__":
    main()
