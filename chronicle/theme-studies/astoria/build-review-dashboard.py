#!/usr/bin/env python3
"""Build temporary/review-dashboard.html -- the demo index, in the Astoria theme, 1:1.

THE BRIEF, in Luneth's words: the colours, fonts and graphics should be 1:1; the content,
arrangement and sizing get adapted. High design is delicate -- swap the desaturated pink
for a "principled" blue and the whole thing stops working -- so nothing about the visual
system is reinterpreted here. Not one hex value, not one asset, not one type choice.

HOW THAT IS ENFORCED, rather than promised:
  * the stylesheet is the pen's OWN compiled CSS, byte-for-byte, with only the absolute
    asset URLs rewritten to the local copies. No rules added, none removed, none reordered.
  * every image, both display faces, Noto Serif, jQuery and fitty were downloaded into
    temporary/astoria-theme/assets/. Nothing is fetched at runtime.
  * the markup reuses the pen's own components verbatim -- .aug-cat / .aug-bored /
    .aug-ban / .aug-nav -- and only the TEXT INSIDE them is ours. The section illustrations
    cycle through the pen's own three .aug-cat modifiers, and each card keeps a real
    character-group class (GID-Passion and friends) so the accent colours stay theirs.

So this is a fidelity test first and a dashboard second. Once it is proven on screen we can
start moving one thing at a time and see what survives.

SCAFFOLDING. Temporary. Nothing here ships.
"""
import html as H
import json
import pathlib
import re
import shutil
import sys

SP = pathlib.Path(sys.argv[1])          # scratchpad holding the fetched raw files
ROOT = pathlib.Path(sys.argv[2])        # repo root
OUTDIR = ROOT / "temporary" / "astoria-theme"
ASSETS = OUTDIR / "assets"
RAW_HTML = (SP / "astoria-raw.html").read_text(encoding="utf-8", errors="replace")
RAW_CSS = (SP / "astoria-raw.css").read_text(encoding="utf-8", errors="replace")
# The pen also links a SECOND sheet at the very end of <body>, so it lands last in the
# cascade and overrides plenty. The first fetch missed it because its attributes run
# media/href/rel rather than rel/href, and a 42 KB chunk of the design went with it.
BOUNDS_CSS = (SP / "astoria-bounds.css").read_text(encoding="utf-8", errors="replace")
NOTO_CSS = (SP / "noto-serif.css").read_text(encoding="utf-8", errors="replace")
AMAP = json.loads((SP / "astoria-assets.json").read_text(encoding="utf-8"))
MAN = json.loads(pathlib.Path(sys.argv[3]).read_text(encoding="utf-8"))


def esc(s):
    return H.escape(str(s), quote=False)


# ── 1 · assets ─────────────────────────────────────────────────────────────
ASSETS.mkdir(parents=True, exist_ok=True)
n_assets = 0
for f in sorted((SP / "astoria-assets").iterdir()):
    if f.is_file():
        shutil.copy2(f, ASSETS / f.name)
        n_assets += 1


def localise(text):
    """Absolute asset URL -> assets/<file>. The ONLY edit made to the pen's CSS."""
    for url, name in AMAP.items():
        text = text.replace(url, "assets/" + name)
    # the pen appends cache-busting queries to some avatars
    text = re.sub(r'(assets/[A-Za-z0-9._-]+)\?\d+', r'\1', text)
    return text


# ── 2 · the stylesheet: theirs, byte-for-byte, only URLs repointed ─────────
theme_css = ("/* The Astoria pen's compiled CSS, unmodified except that every absolute\n"
             "   asset URL is repointed at the local copies in assets/. No rule here was\n"
             "   added, removed, reordered or retuned -- the palette, the type scale and the\n"
             "   blend modes are exactly as authored. */\n"
             + localise(NOTO_CSS) + "\n" + localise(RAW_CSS)
             + "\n/* astoria_bounds_embedded.css -- the pen links this LAST in the body, so it\n"
               "   lands last in the cascade and overrides a great deal. It stays last here. */\n"
             + localise(BOUNDS_CSS))
(SP / "staged-theme.css").write_text(theme_css, encoding="utf-8")


# ── 3 · component templates, lifted from the pen's own markup ──────────────
def subtree(src, cls, nth=0):
    hits = list(re.finditer(r'<(\w+)([^>]*\bclass="[^"]*\b' + re.escape(cls) + r'\b[^"]*"[^>]*)>', src))
    if len(hits) <= nth:
        raise SystemExit(f"FATAL: .{cls}#{nth} not found ({len(hits)} hits)")
    m = hits[nth]
    tag, i, d = m.group(1), m.end(), 1
    for t in re.finditer(r'<(/?)' + tag + r'\b[^>]*>', src[i:]):
        d += -1 if t.group(1) else 1
        if d == 0:
            return src[m.start():i + t.end()]
    raise SystemExit(f"FATAL: .{cls}#{nth} never closes")


BORED_TPL = subtree(RAW_HTML, "aug-bored")
CAT_TPL = subtree(RAW_HTML, "aug-cat")

# the pen's own avatar art, reused as card icons -- their graphics, per the brief
ICONS = [n for u, n in AMAP.items() if re.match(r"^av-\d+\.png$", n)] or ["av-46.png"]
ICONS.sort()
# their character-group classes carry the accent hues; cycling them keeps every colour theirs
GIDS = ["Passion", "Fate", "Hope", "Knowledge", "Unity", "Liberty", "Fortune",
        "Entropy", "Vitality", "Order", "Space", "Unbound", "Time", "Destruction"]
CATMODS = ["aug-setup", "aug-character", "aug-ic"]

STATE_WORD = {"picked": "picked", "open": "unread", "shipped": "live", "superseded": "record"}


# ALLOVER_MODERN_DEMO is a TRIAL build of the display face. Glyphs outside its licensed
# subset render as a "TRIAL FONT / 177studio.com" watermark rather than the character --
# the section sign in "Foods §04" stamped one straight across a card title. Display slots
# therefore stay inside plain letters and digits. Body copy uses Noto Serif and is fine.
TRIAL_SAFE = re.compile(r"[^A-Za-z '&-]")


def short_title(title):
    """The headline slot is display type sized for two or three words."""
    head = re.split(r"\s+[—-]\s+", title)[0].strip()
    head = re.sub(r"\s{2,}", " ", TRIAL_SAFE.sub(" ", head)).strip()
    return (head if len(head) <= 22 else head[:21].rstrip() + "…").lower()


def bored(d, i):
    """One card: the pen's .aug-bored with our text in it."""
    t = BORED_TPL
    fam = FAMS[d["family"]]
    # the two tiny links above the title -> family + state
    t = re.sub(r'(<div class="aug-bored-subs1">)[\s\S]*?(</div>)',
               lambda m: (m.group(1)
                          + f'<a href="">{esc(fam["label"].lower())}</a>'
                          + f'<a href="">{esc(STATE_WORD[d["state"]])}</a>' + m.group(2)),
               t, count=1)
    # the big display title + its link
    t = re.sub(r'<a href="[^"]*" class="aug-bored-name"><div></div><span>[\s\S]*?</span></a>',
               f'<a href="../{esc(d["file"])}" class="aug-bored-name"><div></div>'
               f'<span>{esc(short_title(d["title"]))}</span></a>', t, count=1)
    # the icon -> one of the pen's own avatar plates
    t = re.sub(r'(<div class="aug-bored-icon"><div style="background-image:url\()[^)]*(\))',
               lambda m: m.group(1) + "assets/" + ICONS[i % len(ICONS)] + m.group(2), t, count=1)
    # the two counters -> what state it is in and where it lives
    t = re.sub(r'<div class="aug-bored-num">[\s\S]*?</div>\s*</div>\s*</div>',
               '</div>', t, count=1)
    # the description
    t = re.sub(r'(<div class="aug-bored-desc">)[\s\S]*?(</div>)',
               lambda m: (m.group(1) + " <b>" + esc(d["title"]) + "</b> &mdash; "
                          + esc(d["note"]) + " " + m.group(2)), t, count=1)
    # the "latest post" line -> the open thread, quietly
    openline = d.get("open") or ""
    openline = openline.lstrip("★").strip()
    t = re.sub(r'(<a href="#" class="aug-board-rec1">)[\s\S]*?(</a>)',
               lambda m: m.group(1) + esc(openline or "nothing outstanding") + m.group(2), t, count=1)
    t = re.sub(r'(<div>written by <a href="#">)[\s\S]*?(</a></div>)',
               lambda m: m.group(1) + esc("still open" if openline else "settled") + m.group(2),
               t, count=1)
    return t.replace('<div class="aug-bored">', f'<div class="aug-bored GID-{GIDS[i % len(GIDS)]}">', 1)


FAMS = {f["key"]: f for f in MAN["families"]}


def cat(f, items, idx):
    """One section: the pen's .aug-cat banner + a grid of our cards."""
    t = CAT_TPL
    t = re.sub(r'class="aug-cat aug-\w+"', f'class="aug-cat {CATMODS[idx % len(CATMODS)]}"', t, count=1)
    t = re.sub(r'(<div class="aug-cat-title3">)[\s\S]*?(<div>)[\s\S]*?(</div></div>)',
               lambda m: (m.group(1) + esc(f["label"].lower()) + " "
                          + m.group(2) + esc(f["blurb"]) + m.group(3)), t, count=1)
    cards = "".join(bored(d, i) for i, d in enumerate(items))
    t = re.sub(r'(<div class="aug-boards">)[\s\S]*(</div>\s*</div>\s*)$',
               lambda m: m.group(1) + cards + "</div></div>", t, count=1)
    return t


# ── 4 · the page ───────────────────────────────────────────────────────────
doc = RAW_HTML

# CodePen's own chrome and the timeout shim are not part of the design
doc = re.sub(r'<script[^>]*stopExecutionOnTimeout[^>]*></script>', "", doc)
doc = re.sub(r'<link rel="canonical"[^>]*>', "", doc)
doc = re.sub(r'<link rel="(apple-touch-icon|icon|mask-icon)"[^>]*>', "", doc)
doc = re.sub(r'<meta name="(twitter|og)[^>]*>', "", doc)

# the two remaining scripts, served locally
doc = doc.replace("https://code.jquery.com/jquery-1.7.2.js", "assets/jquery-1.7.2.js")
doc = doc.replace("https://cdnjs.cloudflare.com/ajax/libs/fitty/2.3.6/fitty.min.js",
                  "assets/fitty.min.js")
doc = re.sub(r'<link[^>]+fonts\.googleapis\.com[^>]*>', '<link rel="stylesheet" href="theme.css">', doc)
doc = re.sub(r'<link[^>]+astoria_bounds_embedded\.css[^>]*>', "", doc)

# the inline <style> becomes the localised sheet on disk
doc = re.sub(r'<style[^>]*>[\s\S]*?</style>', "", doc)
if 'href="theme.css"' not in doc:
    doc = doc.replace("</head>", '<link rel="stylesheet" href="theme.css">\n</head>')

doc = localise(doc)

# rebuild the section stack out of our manifest
body2 = subtree(doc, "aug-body2")
sections = ""
idx = 0
for f in MAN["families"]:
    items = [d for d in MAN["demos"] if d["family"] == f["key"]]
    if not items:
        continue
    sections += cat(f, items, idx)
    idx += 1
doc = doc.replace(body2, f'<div class="aug-body2">{sections}</div>')

# ── 5 · the words. Structure and colour untouched; only the text is ours ───
SWAPS = [
    ("through me you pass into the city of woe: through me you pass into eternal pain: through me among the people lost for aye.",
     "everything that earned its place and still wants a second pass. nothing here is finished, and nothing here is lost."),
    ("end of an era", "the workbench"),
    ("visit the shelter of scholars", "open the newest surface"),
    ("viewing a profile", "reviewing the backlog"),
    ("category title", "surfaces"),
    ("board title", "demos"),
    ("sub-board title", "parked"),
    ("welcome back", "picking up where"),
    ("first lastname", "you left off"),
    ("to read who was the tank of ophur bitter, supremest wisdom, and primeval love.",
     "the fundamentals are settled. what is left is refinement, one surface at a time."),
    ("to be who you find into the city of woe: through me you pass into eternal pain: the people lost for aye.",
     "the fundamentals are settled. what is left is refinement, one surface at a time."),
    ("to rear me was the task of power divine, supremest wisdom, and primeval love.",
     "settled once, so it never has to be argued again."),
    ("and i, who had my head with horror bound, said: “master, what is this which now i hear? what folk is this, which seems by pain so vanquished?”",
     "open one, judge the direction, and leave the rest exactly where it is."),
    ("there sighs, complaints, and ululations loud resounded through the air without a star, whence i, at the beginning, wept thereat.",
     "everything below is parked on purpose and nothing below is overdue."),
    ("click to read our", "jump straight to"),
    ("guidebook", "the newest work"),
    ("november", "where things stand"),
    ("the end of an era", "the workbench"),
    ("member groups", "coverage"),
    ("app guide", "shells"),
    ("frequently asked", "products"),
    ("guidelines", "knowledge"),
    ("premise", "ask wallach"),
    ("setting", "headers"),
]
def _swap_text_only(html_doc, pairs):
    """Apply the replacements to text nodes, never to tags or attributes."""
    parts = re.split(r'(<[^>]*>)', html_doc)
    for i in range(0, len(parts), 2):          # even indices are the text between tags
        for old, new in pairs:
            parts[i] = re.sub(re.escape(old), new, parts[i], flags=re.IGNORECASE)
    return "".join(parts)


doc = _swap_text_only(doc, SWAPS)

# the welcome paragraph
doc = re.sub(r'(<div class="aug-bann-welcome">)[\s\S]*?(</div>)',
             lambda m: (m.group(1)
                        + " Every demo worth returning to lives here, grouped and openable in "
                          "one click. Each card carries what state it is in and what is still "
                          "undecided, so a surface can be picked up cold without re-reading a "
                          "transcript. Nothing is being chased &mdash; the threads are simply held. "
                        + m.group(2)), doc, count=1)

# The giant wordmark is a SINGLE decorative letter, drawn twice -- once filled, once
# stroked -- inside a nested .text-fit that scales it. Dropping a whole word into that
# slot collapsed both layers into tiny stacked labels. Swap only the letter.
def _wordmark(word_html):
    """Rewrite the giant wordmark, keeping its two-layer fill/stroke structure.

    The original is NOT editable text: it reads \\uf205 <b>\\uf285</b> \\uf272 A -- three
    private-use glyphs plus an A. Those PUA codepoints are bespoke ligatures inside the
    Allover font that draw ASTORIA, and no other word can borrow them. So the letters
    become real letters in the same face, at the same size, in the same place, with the
    <b> still wrapping the middle run that takes the accent colour and the marble fill.
    Everything visual stays theirs; only the glyph sequence is ours.
    """
    global doc
    for cls in ("aug-ban-bigg-name", "aug-ban-big-name"):
        m = re.search(r'<div class="' + cls + r'">\s*<span[\s\S]{0,500}?</div>', doc)
        if not m:
            continue
        blk = re.sub(r'(<span(?: aria-hidden="true")?>)[^<]*<b>[^<]*</b>[^<]*A(</span>)',
                     lambda x: x.group(1) + word_html + x.group(2), m.group(0))
        doc = doc[:m.start()] + blk + doc[m.end():]


_wordmark("WORK<b>BEN</b>CH")
doc = doc.replace(">astoria<", ">the codex<")

# the two remaining prose blocks that still described a roleplay forum
doc = re.sub(r'(<div class="aug-bann-news3">\s*<p>)[\s\S]*?(</p>)',
             lambda m: (m.group(1) + " Twenty-eight surfaces are parked here across seven "
                        "families, alongside twenty-nine first-pass header sets. A few have a "
                        "direction picked; the rest are waiting for a read, whenever there is "
                        "appetite for one. " + m.group(2)), doc, count=1)
doc = re.sub(r'(<div class="aug-guidebook-desc"><p>)[\s\S]*?(</p>)',
             lambda m: (m.group(1) + " Each card says what state its surface is in and what is "
                        "still undecided about it. Nothing here needs answering today &mdash; the "
                        "point of writing it down is that it stops having to be remembered. "
                        + m.group(2)), doc, count=1)
# two of the pen's decorative images 404 at source; drop the ref rather than ship a break
doc = re.sub(r'url\(\s*https://images2\.imgbox\.com/[^)]*\)', "none", doc)

# the pen ships dark-first; keep its own default and its own toggle
doc = doc.replace('<title>', '<title>Review dashboard &mdash; ')

out = SP / "staged-review-dashboard.html"
# the page lives beside astoria-theme/, so every relative path gains that prefix
doc = re.sub(r'(href|src)="(assets/|theme\.css)', r'\1="astoria-theme/\2', doc)
doc = doc.replace("url(assets/", "url(astoria-theme/assets/")
out.write_text(doc, encoding="utf-8")

n_cards = sum(1 for d in MAN["demos"])
print(f"OK  staged {out} ({len(doc.encode('utf-8'))} bytes)")
print("    NEXT: route both staged files through tools/safe_write.py")
print(f"    theme.css {len(theme_css.encode('utf-8'))} B · assets {n_assets} files")
print(f"    sections {idx} · cards {n_cards} · icons {len(ICONS)}")
