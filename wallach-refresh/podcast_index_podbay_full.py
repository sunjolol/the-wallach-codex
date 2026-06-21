"""
podcast_index_podbay_full.py - scrape the FULL DDDL episode archive from
Podbay by driving a headless Chromium and clicking "Load more" repeatedly.

Outputs the same JSON schema as podcast_index_podbay.py so downstream tools
(podcast_download.py, podcast_transcribe.py, ingest_podcast.py) work unchanged.

Why a real browser:
  Podbay's "Load more" button calls a JS-only pagination function with no
  easily-reverse-engineered API endpoint. The simplest reliable scrape is to
  actually click the button and let the page render.

Setup (one-time, on Windows):
  python -m pip install --user playwright
  python -m playwright install chromium

Usage:
  python podcast_index_podbay_full.py
  python podcast_index_podbay_full.py --max-clicks 50    # cap pages for testing
  python podcast_index_podbay_full.py --headed           # show the browser window
"""

import json
import re
import sys
from datetime import datetime
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("ERROR: playwright not installed. Setup with:")
    print("  python -m pip install --user playwright")
    print("  python -m playwright install chromium")
    sys.exit(1)


HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
KNOWLEDGE = ROOT / "knowledge"
INDEX_FILE = KNOWLEDGE / "podcast-episodes.json"

PODBAY_URL = "https://podbay.fm/p/dead-doctors-dont-lie-radio"


def date_from_mp3_url(url):
    if not url:
        return ""
    m = re.search(r"/(\d{4})(\d{2})(\d{2})/", url)
    if m:
        try:
            return datetime(int(m.group(1)), int(m.group(2)), int(m.group(3))).isoformat()
        except Exception:
            return ""
    return ""


def parse_args():
    max_clicks = 500
    headed = False
    for i, a in enumerate(sys.argv):
        if a == "--max-clicks" and i + 1 < len(sys.argv):
            try:
                max_clicks = int(sys.argv[i + 1])
            except ValueError:
                pass
        if a == "--headed":
            headed = True
    return max_clicks, headed


def scrape_episodes(max_clicks=500, headed=False):
    """Drive Podbay, clicking 'Load more' until no new content, and return
    a list of episode dicts."""
    eps_seen = set()
    eps = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=not headed)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        print("Navigating to %s ..." % PODBAY_URL)
        page.goto(PODBAY_URL, timeout=60000, wait_until="domcontentloaded")
        # Wait for the first MP3 anchor to be attached to the DOM (visibility
        # check fails because these anchors have no text content).
        page.wait_for_selector('a[href*="shows.zbsradio.com"]', state="attached", timeout=30000)
        page.wait_for_timeout(2000)

        click_n = 0
        stalled = 0
        while click_n < max_clicks:
            # Extract all currently-visible episode MP3 links + metadata.
            new_eps = page.evaluate("""
                () => {
                    const items = [];
                    // Each episode link to shows.zbsradio.com is the audio anchor.
                    const audioLinks = document.querySelectorAll('a[href*="shows.zbsradio.com"][href$=".mp3"]');
                    audioLinks.forEach(a => {
                        const mp3 = a.href;
                        // Find the nearest episode-detail link to get title + timestamp.
                        let parent = a;
                        for (let i = 0; i < 8 && parent; i++) {
                            parent = parent.parentElement;
                            if (!parent) break;
                            const titleLink = parent.querySelector('a[href*="/p/"][href*="/e/"]');
                            if (titleLink) {
                                const m = titleLink.href.match(/\\/e\\/(\\d+)/);
                                const ts = m ? parseInt(m[1]) : null;
                                items.push({
                                    title: titleLink.textContent.trim(),
                                    ts: ts,
                                    mp3_url: mp3,
                                });
                                break;
                            }
                        }
                    });
                    return items;
                }
            """)

            before = len(eps)
            for ep in new_eps:
                if ep["mp3_url"] in eps_seen:
                    continue
                eps_seen.add(ep["mp3_url"])
                eps.append(ep)
            added = len(eps) - before

            if click_n % 10 == 0 or added == 0:
                print("  click %d: %d episodes loaded (+%d new)" % (click_n, len(eps), added))

            # Scroll to the bottom first — Podbay may use scroll-trigger
            # in addition to (or instead of) the Load more button.
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(500)

            # Locate the "Load more" button.
            btn = page.locator("text=Load more").first
            btn_count = btn.count()
            if btn_count == 0:
                print("  no 'Load more' button in DOM. Scroll-only mode for further pages.")
                # Just scroll + wait for new content
                page.wait_for_timeout(1500)
                continue

            if added == 0:
                stalled += 1
                if stalled >= 3:
                    print("  3 clicks with no new episodes — assuming end of list.")
                    break
            else:
                stalled = 0

            try:
                btn.click(timeout=5000)
                click_n += 1
                # Wait for new content to render. Don't use networkidle —
                # Podbay's telemetry never lets it go idle.
                page.wait_for_timeout(1500)
            except Exception as e:
                print("  click failed: %s. Retrying once..." % e)
                page.wait_for_timeout(1500)
                try:
                    btn.click(timeout=5000)
                    click_n += 1
                except Exception as e2:
                    print("  second click also failed: %s. Stopping." % e2)
                    break

        browser.close()
    return eps


def main():
    max_clicks, headed = parse_args()
    print("Max 'Load more' clicks: %d. Headless: %s" % (max_clicks, not headed))

    raw = scrape_episodes(max_clicks=max_clicks, headed=headed)
    print("Scraped %d unique episodes" % len(raw))

    eps = []
    for r in raw:
        ts = r.get("ts")
        if ts:
            pub = datetime.fromtimestamp(ts).isoformat()
        else:
            pub = date_from_mp3_url(r.get("mp3_url"))
        eps.append({
            "guid": "podbay:%s" % (ts or r.get("mp3_url", "")),
            "title": r.get("title", "").strip(),
            "pub_date": pub,
            "duration_sec": None,
            "mp3_url": r.get("mp3_url"),
            "description": "",
            "source": "podbay-full",
        })

    eps.sort(key=lambda x: x["pub_date"], reverse=True)
    INDEX_FILE.write_text(json.dumps(eps, indent=2), encoding="utf-8")
    print("Wrote %d episodes -> %s" % (len(eps), INDEX_FILE.name))
    if eps:
        print("Newest: %s | %s" % (eps[0]["pub_date"][:10], eps[0]["title"][:60]))
        print("Oldest: %s | %s" % (eps[-1]["pub_date"][:10], eps[-1]["title"][:60]))


if __name__ == "__main__":
    main()
