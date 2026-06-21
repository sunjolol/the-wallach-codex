"""
podcast_index_podbay.py - scrape DDDL episode listing from Podbay.fm as a
fallback when rss.gcnlive.com is down.

Outputs the same schema as podcast_index.py.

Strategy:
  1. Look for Next.js __NEXT_DATA__ JSON blob (cleanest if available).
  2. Fall back to BeautifulSoup parsing of episode cards in HTML.
  3. Fall back to regex extraction of (zbsradio mp3 URL + timestamp).

The raw HTML is saved to wallach-refresh/podbay_last_fetch.html for debug.

Usage:
  python podcast_index_podbay.py --pilot 10
"""

import json
import re
import sys
import time
from datetime import datetime
from pathlib import Path

try:
    import requests
except ImportError:
    print("ERROR: requests not installed.")
    sys.exit(1)

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("ERROR: beautifulsoup4 not installed.")
    sys.exit(1)


HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
KNOWLEDGE = ROOT / "knowledge"
INDEX_FILE = KNOWLEDGE / "podcast-episodes.json"
PILOT_FILE = KNOWLEDGE / "podcast-pilot.json"
DEBUG_HTML = HERE / "podbay_last_fetch.html"

PODBAY_URL = "https://podbay.fm/p/dead-doctors-dont-lie-radio"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"


def fetch_html(url, attempts=3, backoff=4):
    last_err = None
    for i in range(1, attempts + 1):
        try:
            r = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=30)
            r.raise_for_status()
            return r.text
        except requests.RequestException as e:
            last_err = str(e)
            print("  attempt %d/%d: %s, retrying in %ds..." % (i, attempts, last_err, backoff))
            time.sleep(backoff)
    raise RuntimeError("Failed to fetch %s: %s" % (url, last_err))


# ---------- Strategy 1: Next.js __NEXT_DATA__ -----------------------------

def from_next_data(html):
    m = re.search(r'<script[^>]*id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
    if not m:
        return []
    try:
        data = json.loads(m.group(1))
    except json.JSONDecodeError:
        return []

    # Walk the JSON tree looking for objects that look like episodes.
    eps = []
    def walk(node):
        if isinstance(node, dict):
            if "audioUrl" in node or "enclosureUrl" in node or "mediaUrl" in node:
                audio = node.get("audioUrl") or node.get("enclosureUrl") or node.get("mediaUrl")
                if audio and ".mp3" in audio.lower():
                    title = node.get("title") or node.get("name") or ""
                    pub = node.get("publishedAt") or node.get("pubDate") or node.get("date") or ""
                    duration = node.get("duration") or node.get("durationSeconds")
                    if isinstance(duration, str):
                        try:
                            duration = int(duration)
                        except ValueError:
                            duration = None
                    eps.append({
                        "title": title,
                        "pub_date_raw": pub,
                        "duration_sec": duration,
                        "mp3_url": audio,
                    })
            for v in node.values():
                walk(v)
        elif isinstance(node, list):
            for v in node:
                walk(v)
    walk(data)
    return eps


# ---------- Strategy 2: BeautifulSoup --------------------------------------

def from_soup(html):
    soup = BeautifulSoup(html, "html.parser")
    eps = []
    seen_mp3 = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "shows.zbsradio.com" in href and href.lower().endswith(".mp3"):
            if href in seen_mp3:
                continue
            seen_mp3.add(href)
            # Look up the parent card for title/date/duration.
            card = a
            for _ in range(6):
                if card.parent is None:
                    break
                card = card.parent
                title_link = card.find("a", href=re.compile(r"/p/[^/]+/e/\d+"))
                if title_link:
                    break
            title = title_link.get_text(" ", strip=True) if title_link and title_link.get_text(strip=True) else ""
            ts_m = re.search(r"/e/(\d+)", title_link["href"]) if title_link else None
            ts = int(ts_m.group(1)) if ts_m else None
            eps.append({
                "title": title,
                "ts": ts,
                "mp3_url": href,
            })
    return eps


# ---------- Strategy 3: Plain regex on HTML --------------------------------

ZBSRADIO_RE = re.compile(
    r'(http://shows\.zbsradio\.com/(\d{8})/[0-9a-f]+\.mp3)',
    re.IGNORECASE,
)

EP_LINK_RE = re.compile(
    r'href="https://podbay\.fm/p/[^/]+/e/(\d+)"[^>]*>([^<]*Dead Doctors[^<]*)<',
    re.IGNORECASE,
)

def from_regex(html):
    """Pull MP3 URLs and surrounding context. Pair each MP3 with the nearest
    preceding episode-link timestamp + title."""
    eps = []
    # Find all episode title links with their positions.
    title_hits = [(m.start(), int(m.group(1)), m.group(2).strip()) for m in EP_LINK_RE.finditer(html)]
    # For each MP3 URL, find the nearest preceding title link.
    for mp3 in ZBSRADIO_RE.finditer(html):
        pos = mp3.start()
        url = mp3.group(1)
        ymd = mp3.group(2)
        # Nearest preceding title.
        best = None
        for tp, ts, title in title_hits:
            if tp <= pos:
                best = (ts, title)
            else:
                break
        ts, title = best if best else (None, "")
        if not ts:
            # Synthesize timestamp from the YYYYMMDD in the URL.
            try:
                ts = int(datetime.strptime(ymd, "%Y%m%d").timestamp())
            except Exception:
                ts = None
            if not title:
                title = "DDDL %s" % ymd
        eps.append({
            "title": title,
            "ts": ts,
            "mp3_url": url,
        })
    # Dedup by mp3_url
    seen = set(); out = []
    for e in eps:
        if e["mp3_url"] in seen: continue
        seen.add(e["mp3_url"]); out.append(e)
    return out


# ---------- Normalization --------------------------------------------------

def date_from_mp3_url(url):
    """Parse YYYYMMDD from shows.zbsradio.com/YYYYMMDD/hash.mp3."""
    if not url: return None
    m = re.search(r"/(\d{4})(\d{2})(\d{2})/", url)
    if m:
        try:
            from datetime import datetime
            return datetime(int(m.group(1)), int(m.group(2)), int(m.group(3))).isoformat()
        except Exception:
            return None
    return None


def normalize(raw):
    """Convert raw episode dicts from any strategy into the common schema."""
    out = []
    for e in raw:
        ts = e.get("ts")
        if not ts and "pub_date_raw" in e:
            try:
                ts = int(datetime.fromisoformat(str(e["pub_date_raw"]).replace("Z","+00:00")).timestamp())
            except Exception:
                ts = None
        pub = datetime.fromtimestamp(ts).isoformat() if ts else (date_from_mp3_url(e.get("mp3_url")) or "")
        out.append({
            "guid": "podbay:%s" % (ts or e.get("mp3_url", "")),
            "title": e.get("title", "").strip(),
            "pub_date": pub,
            "duration_sec": e.get("duration_sec"),
            "mp3_url": e.get("mp3_url"),
            "description": "",
            "source": "podbay",
        })
    return out


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

    print("Fetching %s ..." % PODBAY_URL)
    html = fetch_html(PODBAY_URL)
    DEBUG_HTML.write_text(html, encoding="utf-8")
    print("Fetched %d bytes. Raw HTML saved to %s for debug." % (len(html), DEBUG_HTML.name))

    # Try strategies in order, report which one yielded episodes.
    for name, fn in [("__NEXT_DATA__", from_next_data), ("BeautifulSoup", from_soup), ("regex", from_regex)]:
        try:
            raw = fn(html)
        except Exception as e:
            print("  strategy %s failed: %s" % (name, e))
            raw = []
        if raw:
            print("Strategy '%s' extracted %d episode candidates." % (name, len(raw)))
            eps = normalize(raw)
            eps = [e for e in eps if e.get("mp3_url")]
            if eps:
                break
        else:
            print("Strategy '%s' found nothing." % name)
    else:
        print("ERROR: no strategy extracted episodes. Open %s and tell me what the HTML looks like." % DEBUG_HTML.name)
        sys.exit(1)

    eps.sort(key=lambda x: x["pub_date"], reverse=True)
    INDEX_FILE.write_text(json.dumps(eps, indent=2), encoding="utf-8")
    print("Wrote %d episodes -> %s" % (len(eps), INDEX_FILE.name))

    if pilot_n is not None:
        pilot = eps[:pilot_n]
        PILOT_FILE.write_text(json.dumps(pilot, indent=2), encoding="utf-8")
        print("")
        print("Pilot set: %d episodes -> %s" % (len(pilot), PILOT_FILE.name))
        for p in pilot:
            dur_str = ("%dmin" % (p["duration_sec"] // 60)) if p["duration_sec"] else "?"
            print("  %s | %s | %s" % (p["pub_date"][:10], dur_str, p["title"][:70]))


if __name__ == "__main__":
    main()
