"""Render one page of a SCREENSHOT-backed book (epigenetics / immortality) for a vision read.

Each `Screenshot (N).png` is a 3840x1080 DUAL-MONITOR capture: the book occupies x = 0.028..0.48 and
the right ~74% is an unrelated Claude Code window. Within the book region it is a TWO-PAGE SPREAD
with the gutter at x = 0.2506 of the frame. Cropping one half and calling a passage "not found" is
the documented way to waste a session, so this defaults to BOTH halves.

  python render_shot.py <book> <N> <out.png> [half] [scale]
     half : both (default) | left | right
     scale: upscale factor, default 3 (the raw capture is ~11px glyphs -- too small to tell a comma
            from a period, which is exactly what these reads turn on)
"""
import sys
from pathlib import Path
from PIL import Image

DIRS = {
    "epigenetics": Path(r"C:\Users\Light\Desktop\claude\health expert\temporary")
    / "Epigenetics The Death of the Genetic Theory of Disease Transmission",
    "immortality": Path(r"C:\Users\Light\Desktop\claude\health expert\temporary")
    / "The Age Beaters and Their Universal Currency for Immortality by Joel D. Wallach and MA. LAN",
}
CUTS = {"both": (0.028, 0.48), "left": (0.028, 0.2506), "right": (0.2506, 0.48)}

book, n, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
half = sys.argv[4] if len(sys.argv) > 4 else "both"
scale = float(sys.argv[5]) if len(sys.argv) > 5 else 3.0

src = DIRS[book] / f"Screenshot ({n}).png"
if not src.exists():
    raise SystemExit(f"NO SUCH CAPTURE: {src}")
im = Image.open(src)
w, h = im.size
f0, f1 = CUTS[half]
crop = im.crop((int(f0 * w), 0, int(f1 * w), h))
crop = crop.resize((int(crop.width * scale), int(crop.height * scale)), Image.LANCZOS)
crop.save(out)
print(f"{book} Screenshot({n}) half={half} scale={scale} -> {out} ({crop.width}x{crop.height})")
