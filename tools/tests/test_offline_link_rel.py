#!/usr/bin/env python3
"""Negative test for offline_no_runtime_network's <link> pattern.

Proof artifact: narrowing a gate is the moment it is most likely to stop biting, so the
narrowing gets shown failing on everything it must still catch.

WHY THE NARROWING HAPPENED. The pattern matched `<link … href="https://…">` with no regard for
`rel`. A Creator's Log entry QUOTED a canonical tag while documenting that this very pattern
would reject one; the bundle inlines the log embed, so the gate read its own warning out of
main.js and went red on 2026-08-28. The quote was right — no browser fetches a canonical; it is
a crawler hint, exactly like the og:/twitter: <meta> tags beside it, none of which this list
matches either.

IT THEN HAPPENED AGAIN, ten minutes later, on the entry documenting the first one: that entry
used `<link rel="stylesheet" href="...">` as its counter-example, and the gate read THAT out of
the bundle too. The Creator's Log is append-only, so neither could be reworded away. So the two
HTML tag patterns became MARKUP-ONLY — a tag inside a JS bundle is prose or an injection, never
a link the browser resolves — while every code pattern still runs on everything.

The risk of that narrowing is obvious and is what this file exists to disprove: that a real
remote stylesheet, icon, preload or module now slips through behind a `rel` this test forgot.

Run:  PYTHONUTF8=1 python tools/tests/test_offline_link_rel.py
Exit 0 = the gate still bites; non-zero = the narrowing went too far."""
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
sys.modules["invariants"] = inv
spec.loader.exec_module(inv)

def find(label):
    for entry in inv._NET_LOAD_PATTERNS:
        if entry[1] == label:
            return entry
    return None

LINK_E = find("<link href> to a remote url")
SCRIPT_E = find("<script src> to a remote url")
if LINK_E is None or SCRIPT_E is None:
    print("FAIL — a markup load pattern is gone from _NET_LOAD_PATTERNS entirely")
    sys.exit(1)
LINK = LINK_E[0]

# (text, must_match) — must_match=True means "this IS a remote load and the gate must catch it"
CASES = [
    # ── STILL CAUGHT. Every one of these really does make the browser fetch. ──
    ('<link rel="stylesheet" href="https://cdn.example.com/x.css">', True),
    ("<link rel='stylesheet' href='//cdn.example.com/x.css'>", True),
    ('<link rel="preload" as="font" href="https://fonts.gstatic.com/a.woff2">', True),
    ('<link rel="icon" href="https://example.com/favicon.ico">', True),
    ('<link rel="modulepreload" href="https://example.com/m.js">', True),
    ('<link rel="prefetch" href="https://example.com/next.html">', True),
    ('<link href="https://example.com/x.css" rel="stylesheet">', True),   # attribute order swapped
    ('<link REL="STYLESHEET" HREF="HTTPS://EXAMPLE.COM/X.CSS">', True),   # case
    # rel names that merely CONTAIN the exempt words are not the exempt words
    ('<link rel="canonicalish" href="https://example.com/x.css">', True),
    ('<link rel="alternate-stylesheet" href="https://example.com/x.css">', True),

    # ── DELIBERATELY EXEMPT. Crawler hints; nothing is fetched. ──
    ('<link rel="canonical" href="https://nutrientcodex.com/">', False),
    ("<link rel='canonical' href='https://nutrientcodex.com/'>", False),
    ('<link rel="alternate" hreflang="en" href="https://nutrientcodex.com/">', False),
    ('<link REL="Canonical" href="https://nutrientcodex.com/">', False),

    # ── LOCAL. Never matched, before or after. ──
    ('<link rel="stylesheet" href="./assets/styles/mobile.css">', False),
    ('<link rel="icon" href="/assets/favicons/favicon-32x32.png">', False),
]

fails = []
for text, must_match in CASES:
    hit = LINK.search(text) is not None
    good = hit == must_match
    verdict = "caught" if hit else "allowed"
    want = "must catch" if must_match else "must allow"
    print(f"{'ok  ' if good else 'FAIL'} {want:10} · {verdict:8} · {text[:64]}")
    if not good:
        fails.append(text)

# ── THE MARKUP/JS SPLIT ───────────────────────────────────────────────────────────────────
# The two HTML patterns must be markup-only (the bundle inlines prose that quotes tags), and
# every code pattern must still run EVERYWHERE, bundle included. Getting this backwards would
# stop the gate reading a real fetch() out of main.js, which is its whole job.
for entry, want_markup_only in ((LINK_E, True), (SCRIPT_E, True)):
    got = entry[2]
    ok = got == want_markup_only
    print(f"{'ok  ' if ok else 'FAIL'} markup-only  · {entry[1]} -> {got}")
    if not ok:
        fails.append(entry[1])
for label in ("fetch() to a remote url", "WebSocket to a remote host",
              "importScripts() from a remote url", "CSS @import of a remote sheet",
              "CSS url() pointing off-machine"):
    e = find(label)
    ok = e is not None and e[2] is False
    print(f"{'ok  ' if ok else 'FAIL'} runs on ALL  · {label} -> {None if e is None else e[2]}")
    if not ok:
        fails.append(label)

# The gate must still redden on a REAL remote stylesheet in the shipped HTML — the end-to-end
# proof that the narrowing and the split together did not disarm it.
import re as _re
real = '<link rel="stylesheet" href="https://cdn.example.com/x.css">'
end_to_end = LINK.search(real) is not None and LINK_E[2] is True
print(f"{'ok  ' if end_to_end else 'FAIL'} end-to-end   · a remote stylesheet in the HTML still reds")
if not end_to_end:
    fails.append("end-to-end")

# The exemption must not have been bought by breaking the rest of the list.
labels = [e[1] for e in inv._NET_LOAD_PATTERNS]
for needed in ("fetch() to a remote url", "<script src> to a remote url",
               "CSS @import of a remote sheet", "CSS url() pointing off-machine"):
    if needed not in labels:
        print(f"FAIL — {needed!r} vanished from _NET_LOAD_PATTERNS")
        fails.append(needed)

# ══════════════════════════════════════════════════════════════════════════════════════════
# THE SECOND LIST.  no_external_style_resources carries its OWN copy of the "no remote
# <link>" rule.  On 2026-08-28 only _NET_LOAD_PATTERNS was made rel-aware, so a canonical
# passed one gate and reddened the other -- and no test noticed, because that list was a
# function-local nothing could import.  It is module-level now and it is driven here.
# Two hand-maintained copies of one rule is the shape 00.B.1 forbids; until they are truly
# one list, this block is what keeps them honest.
# ══════════════════════════════════════════════════════════════════════════════════════════
import re as _re2

STYLE = None
for _pat, _label in inv._EXTERNAL_STYLE_PATTERNS:
    if _label == "external <link>":
        STYLE = _pat
        break
if STYLE is None:
    print("FAIL — the 'external <link>' pattern is gone from _EXTERNAL_STYLE_PATTERNS")
    sys.exit(1)

# This list is applied with re.findall and NO flags (see check_no_external_style_resources),
# so it is driven here exactly the way the gate drives it -- not with re.I bolted on.
STYLE_CASES = [
    # ── must still catch: every one of these really is fetched by the browser ──
    ('<link rel="stylesheet" href="https://cdn.example.com/x.css">', True),
    ('<link rel="icon" href="https://example.com/favicon.ico">', True),
    ('<link rel="preload" as="font" href="https://fonts.gstatic.com/a.woff2">', True),
    ('<link rel="modulepreload" href="https://example.com/m.js">', True),
    ('<link rel="prefetch" href="https://example.com/next.html">', True),
    ('<link href="https://example.com/x.css" rel="stylesheet">', True),
    ('<link rel="canonicalish" href="https://example.com/x.css">', True),
    ('<link rel="alternate-stylesheet" href="https://example.com/x.css">', True),
    ('<link rel=canonical href="https://example.com/">', True),          # unquoted rel is not the exemption
    # THE HOLE THAT WAS CLOSED.  The old pattern hardcoded `href=` with no \s*, so a single
    # space slipped a real remote stylesheet past a critical gate.  Never use it; it is
    # pinned here so it can never be re-opened by accident.
    ('<link rel="stylesheet" href = "https://example.com/x.css">', True),
    # ── deliberately exempt: crawler hints, nothing is fetched ──
    ('<link rel="canonical" href="https://nutrientcodex.com/">', False),
    ("<link rel='canonical' href='https://nutrientcodex.com/'>", False),
    ('<link href="https://nutrientcodex.com/" rel="canonical">', False),
    ('<link REL="Canonical" href="https://nutrientcodex.com/">', False),
    ('<link rel="alternate" hreflang="en" href="https://nutrientcodex.com/">', False),
    # ── never matched, before or after ──
    ('<link rel="stylesheet" href="./assets/styles/mobile.css">', False),
    ('<link rel="icon" href="./assets/favicons/favicon-32x32.png">', False),
    ('<meta property="og:image" content="https://nutrientcodex.com/assets/favicons/share-card.png">', False),
    ('<meta name="twitter:card" content="summary_large_image">', False),
    ('<meta name="description" content="See what your supplements still miss.">', False),
    ('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tesseract/x.css">', False),
]

print()
for text, must_match in STYLE_CASES:
    hit = bool(_re2.findall(STYLE, text))
    good = hit == must_match
    verdict = "caught" if hit else "allowed"
    want = "must catch" if must_match else "must allow"
    print(f"{'ok  ' if good else 'FAIL'} list2 {want:10} · {verdict:8} · {text[:58]}")
    if not good:
        fails.append("list2: " + text)

# ── THE PARITY THAT MATTERS ────────────────────────────────────────────────────────────────
# The two lists are NOT identical by design: _NET_LOAD_PATTERNS also catches protocol-relative
# `//host`, which this one does not.  What they MUST agree on is the rel exemption, because
# that is the rule that was copied and then only half-updated.  Absolute URLs only.
PARITY = [
    ('<link rel="canonical" href="https://nutrientcodex.com/">', False),
    ('<link REL="Canonical" href="https://nutrientcodex.com/">', False),
    ('<link rel="alternate" hreflang="en" href="https://nutrientcodex.com/">', False),
    ('<link rel="canonicalish" href="https://example.com/x.css">', True),
    ('<link rel="alternate-stylesheet" href="https://example.com/x.css">', True),
    ('<link rel="stylesheet" href="https://cdn.example.com/x.css">', True),
    ('<link rel="icon" href="https://example.com/favicon.ico">', True),
]
print()
for text, expect in PARITY:
    a = LINK.search(text) is not None
    b = bool(_re2.findall(STYLE, text))
    good = (a == b == expect)
    print(f"{'ok  ' if good else 'FAIL'} parity       · net={a!s:5} style={b!s:5} want={expect!s:5} · {text[:50]}")
    if not good:
        fails.append("parity: " + text)

# The lifted list must not have lost its other teeth on the way to module scope.
_style_labels = [lbl for _, lbl in inv._EXTERNAL_STYLE_PATTERNS]
for needed in ("Google Fonts CSS", "Google Fonts static", "cdnjs CDN", "unpkg CDN",
               "FontAwesome Pro CDN", "@import of external resource",
               "external <link>", "external <script>"):
    if needed not in _style_labels:
        print(f"FAIL — {needed!r} vanished from _EXTERNAL_STYLE_PATTERNS")
        fails.append(needed)

print("\nPASS — both copies of the <link> rule exempt canonical/alternate and nothing else"
      if not fails else f"\nFAILED: {len(fails)} case(s)")
sys.exit(0 if not fails else 1)
