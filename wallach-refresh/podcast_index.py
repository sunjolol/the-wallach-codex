"""
podcast_index.py - fetch the DDDL Radio RSS feed and build an episode index.
"""

import json
import sys
import re
import time
from datetime import datetime
from pathlib import Path

try:
    import feedparser
except ImportError:
    print("ERROR: feedparser not installed. Run:  python -m pip install --user feedparser")
    sys.exit(1)

try:
    import requests
except ImportError:
    print("ERROR: requests not installed. Run:  python -m pip install --user requests")
    sys.exit(1)


HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
KNOWLEDGE = ROOT / "knowledge"
INDEX_FILE = KNOWLEDGE / "podcast-episodes.json"
PILOT_FILE = KNOWLEDGE / "podcast-pilot.json"

FEED_URL = "http://rss.gcnlive.com/deadDoctors/feed.xml"
USER_AGENT = "Mozilla/5.0 (compatible; WallachCorpusFetcher/1.0)"


def parse_duration(s):
    if not s:
        return None
    s = str(s).strip()
    parts = s.split(":")
    try:
        if len(parts) == 3:
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
        elif len(parts) == 2:
            return int(parts[0]) * 60 + int(parts[1])
        else:
            return int(s)
    except Exception:
        return None


def sanitize_xml(raw):
    return re.sub(r"&(?!#?\w+;)", "&amp;", raw)


def fetch_raw(url, attempts=4, backoff=6):
    last_err = None
    for i in range(1, attempts + 1):
        try:
            r = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=45)
            if r.status_code >= 500 or r.status_code == 429:
                last_err = "HTTP %d" % r.status_code
                print("  attempt %d/%d: %s, retrying in %ds..." % (i, attempts, last_err, backoff))
                time.sleep(backoff)
                continue
            r.raise_for_status()
            return r.text
        except requests.RequestException as e:
            last_err = str(e)
            print("  attempt %d/%d: %s, retrying in %ds..." % (i, attempts, last_err, backoff))
            time.sleep(backoff)
    print("  requests exhausted; trying feedparser's built-in fetcher...")
    try:
        feed = feedparser.parse(url, agent=USER_AGENT)
        if feed.entries:
            return ("__FEEDPARSER_OBJ__", feed)
    except Exception as e:
        last_err = str(e)
    raise RuntimeError("All fetch attempts failed. Last error: %s" % last_err)


def fetch_and_parse(url):
    result = fetch_raw(url)
    if isinstance(result, tuple) and result[0] == "__FEEDPARSER_OBJ__":
        return result[1]
    raw = result
    feed = feedparser.parse(raw)
    if not feed.entries:
        sanitized = sanitize_xml(raw)
        feed = feedparser.parse(sanitized)
        if not feed.entries:
            err = getattr(feed, "bozo_exception", None)
            print("  Parse error: %s" % err)
            if hasattr(err, "getLineNumber") and hasattr(err, "getColumnNumber"):
                ln, col = err.getLineNumber(), err.getColumnNumber()
                lines = sanitized.splitlines()
                if 0 < ln <= len(lines):
                    print("  Line %d (col %d):" % (ln, col))
                    print("  " + lines[ln-1][:200])
    return feed


def main():
    pilot_n = None
    if "--pilot" in sys.argv:
        i = sys.argv.index("--pilot")
        if i + 1 < len(sys.argv):
            try:
                pilot_n = int(sys.argv[i + 1])
            except ValueError:
                print("ERROR: --pilot expects an integer")
                sys.exit(1)

    print("Fetching %s ..." % FEED_URL)
    feed = fetch_and_parse(FEED_URL)
    if not feed.entries:
        print("ERROR: feed fetch/parse failed - no episodes extracted")
        sys.exit(1)

    print("Feed: %s" % feed.feed.get("title", "(no title)"))
    print("Episodes found: %d" % len(feed.entries))

    episodes = []
    for e in feed.entries:
        guid = e.get("id") or e.get("guid") or e.get("link")
        mp3_url = None
        for enc in e.get("enclosures") or []:
            t = (enc.get("type") or "").lower()
            href = enc.get("href") or enc.get("url") or ""
            if "audio" in t or href.lower().endswith(".mp3"):
                mp3_url = href
                break
        pub_date = e.get("published") or e.get("updated") or ""
        try:
            pub_dt = datetime(*e.published_parsed[:6]).isoformat()
        except Exception:
            pub_dt = pub_date
        dur = parse_duration(e.get("itunes_duration") or e.get("duration"))
        episodes.append({
            "guid": guid,
            "title": e.get("title", "").strip(),
            "pub_date": pub_dt,
            "duration_sec": dur,
            "mp3_url": mp3_url,
            "description": (e.get("summary") or "").strip()[:500],
        })

    episodes.sort(key=lambda x: x["pub_date"], reverse=True)

    INDEX_FILE.write_text(json.dumps(episodes, indent=2), encoding="utf-8")
    print("Wrote %d episodes -> %s" % (len(episodes), INDEX_FILE.name))

    with_mp3 = sum(1 for e in episodes if e["mp3_url"])
    print("  With MP3 URL: %d" % with_mp3)
    print("  Without MP3 URL: %d" % (len(episodes) - with_mp3))

    if pilot_n is not None:
        pilot = [e for e in episodes if e["mp3_url"]][:pilot_n]
        PILOT_FILE.write_text(json.dumps(pilot, indent=2), encoding="utf-8")
        print("")
        print("Pilot set: %d episodes -> %s" % (len(pilot), PILOT_FILE.name))
        for p in pilot:
            dur_str = ("%dmin" % (p["duration_sec"] // 60)) if p["duration_sec"] else "?"
            print("  %s | %s | %s" % (p["pub_date"][:10], dur_str, p["title"][:60]))


if __name__ == "__main__":
    main()
