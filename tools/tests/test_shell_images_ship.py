#!/usr/bin/env python3
"""Negative test for shell_images_reach_the_web_build.

The defect this gate exists to catch is INVISIBLE by construction: an og:image is never
requested by the page, only by a crawler, so a wrong path 404s on the live site while the
board and every render probe stay green. A gate for an invisible defect has to be shown
failing, or it is just a comment.

Everything runs against a synthetic tree; the real repo is not touched.

Run:  PYTHONUTF8=1 python tools/tests/test_shell_images_ship.py
Exit 0 = the gate bites."""
import importlib.util
import shutil
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
sys.modules["invariants"] = inv
spec.loader.exec_module(inv)

BUILD = "VERBATIM_DIRS = ['assets/avatars', 'assets/favicons', 'assets/vendor']\n"

SHELL = """<!doctype html>
<html><head>
<link rel="icon" type="image/png" sizes="32x32" href="./assets/favicons/favicon-32x32.png">
<meta property="og:image" content="{card}">
<meta name="twitter:image" content="{card}">
</head><body></body></html>
"""

GOOD_CARD = "https://nutrientcodex.com/assets/favicons/share-card.png"


def build(tmp, card=GOOD_CARD, files=("assets/favicons/favicon-32x32.png",
                                      "assets/favicons/share-card.png"),
          build_src=BUILD, shell=None):
    d = Path(tmp)
    (d / "tools").mkdir(parents=True, exist_ok=True)
    (d / "tools" / "build_web.py").write_text(build_src, encoding="utf-8")
    (d / "dashboard").mkdir(parents=True, exist_ok=True)
    (d / "dashboard" / "dashboard.html").write_text(
        shell if shell is not None else SHELL.format(card=card), encoding="utf-8")
    for f in files:
        p = d / "dashboard" / f
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(b"\x89PNG\r\n\x1a\n")
    return d


CASES = [
    ("the correct shape — card under assets/favicons/", {}, True),
    ("THE SILENT 404: card outside the copied directories",
     {"card": "https://nutrientcodex.com/assets/social/share-card.png",
      "files": ("assets/favicons/favicon-32x32.png", "assets/social/share-card.png")}, False),
    ("card at the assets/ root — also not copied",
     {"card": "https://nutrientcodex.com/assets/share-card.png",
      "files": ("assets/favicons/favicon-32x32.png", "assets/share-card.png")}, False),
    ("card named but never generated",
     {"files": ("assets/favicons/favicon-32x32.png",)}, False),
    ("card hosted on someone else's domain",
     {"card": "https://cdn.example.com/share-card.png"}, False),
    ("favicon points at a file that is gone",
     {"files": ("assets/favicons/share-card.png",)}, False),
    ("VERBATIM_DIRS emptied — must not pass vacuously",
     {"build_src": "VERBATIM_DIRS = []\n"}, False),
    ("VERBATIM_DIRS removed from build_web.py entirely",
     {"build_src": "# nothing here\n"}, False),
    ("shell declares no images at all",
     {"shell": "<html><head></head><body></body></html>\n"}, False),
    ("a relative card path still resolves and passes",
     {"card": "./assets/favicons/share-card.png"}, True),
]

real_root = inv.ROOT
fails = []
for name, kwargs, want_pass in CASES:
    tmp = tempfile.mkdtemp(prefix="shellimg-")
    try:
        inv.ROOT = build(tmp, **kwargs)
        ok, msg = inv.check_shell_images_reach_the_web_build()
        good = ok is want_pass
        want = "must PASS" if want_pass else "must RED "
        print(f"{'ok  ' if good else 'FAIL'} {want} · {'passed' if ok else 'red   '} · {name}")
        if not good:
            fails.append(f"{name} -> {msg}")
    finally:
        inv.ROOT = real_root
        shutil.rmtree(tmp, ignore_errors=True)

ok, msg = inv.check_shell_images_reach_the_web_build()
print(f"{'ok  ' if ok else 'FAIL'} real tree · {msg}")
if not ok:
    fails.append("real tree: " + msg)

print("\nPASS — the gate reds on every way a shell image can fail to ship"
      if not fails else "\nFAILED:\n  " + "\n  ".join(fails))
sys.exit(0 if not fails else 1)
