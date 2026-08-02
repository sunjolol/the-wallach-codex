"""Rasterise a page (or a clip of one) from any of the three PDF-backed books.

Supersedes temporary/frontface-ocr-tools/render_page.py, which knows only two of the three books.
This host has no poppler/pdftoppm, so the Read tool cannot open a PDF page directly -- render to PNG
with PyMuPDF and Read the PNG.

  python render.py <book> <page> <out.png> [zoom]                  whole page
  python render.py <book> <page> <out.png> <zoom> <x0 y0 x1 y1>    clip, fractions of the page
"""
import sys
from pathlib import Path
import fitz

ROOT = Path(r"C:\Users\Light\Desktop\claude\health expert")
PDFS = {
    "lets-play-doctor": ROOT / r"temporary\lets-play-doctor-pdf\Lets-Play-Doctor-PDF-by-Joel-Wallach-Lan-Ma.pdf",
    "rare-earths": ROOT / r"temporary\rare earths forbidden cures\rare-earths-forbidden-cures-pdf-by-joel-wallach-lan-ma-pdf.pdf",
    "hells-kitchen": ROOT / r"temporary\hk\788873904-Dr-Joel-Wallach-Joel-D-Wallach-JD-Wallach-Ma-Lan-MD-Hell-s-Kitchen-Causes-Prevention-and-Cure-of-Obesity-Diabetes-and-Metabolic-Syndrome-De.pdf",
}

book, page, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
zoom = float(sys.argv[4]) if len(sys.argv) > 4 else 3.0
doc = fitz.open(PDFS[book])
p = doc[page - 1]
kw = {}
if len(sys.argv) > 8:
    f = [float(v) for v in sys.argv[5:9]]
    r = p.rect
    kw["clip"] = fitz.Rect(r.x0 + f[0] * r.width, r.y0 + f[1] * r.height,
                           r.x0 + f[2] * r.width, r.y0 + f[3] * r.height)
pix = p.get_pixmap(matrix=fitz.Matrix(zoom, zoom), **kw)
pix.save(out)
print(f"{book} p{page} zoom={zoom} -> {out} ({pix.width}x{pix.height})")
doc.close()
