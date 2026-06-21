"""
ingest_books.py — extract text from Wallach books in knowledge/wallach-books/
and add them to manifest.csv as High-confidence sources.

Supports PDF (via pypdf, with optional Tesseract OCR fallback for scanned PDFs)
and EPUB (via stdlib zipfile + BeautifulSoup).

Books are treated as High confidence by default — they are authored Wallach
material with no speaker-attribution problem. The classifier is bypassed.

Idempotent: books already in manifest.csv are skipped on re-run.

Outputs:
  knowledge/books-clean/<stem>.txt           — full extracted text
  knowledge/books-clean/<stem>.pages.json    — page or chapter index for citation
  Appends rows to knowledge/manifest.csv
  Appends an entry to knowledge/corpus-changelog.md

Flags:
  python ingest_books.py             — process any books not yet in manifest
  python ingest_books.py --rebuild   — reprocess all books (overwrites their rows)
  python ingest_books.py --ocr-all   — force OCR on every PDF (text or scanned)
  python ingest_books.py --no-ocr    — skip OCR even on scanned PDFs

OCR requires: pymupdf, pytesseract, Pillow (pip), plus the Tesseract binary
(install on Windows with: winget install UB-Mannheim.TesseractOCR).
"""

import csv
import io
import json
import os
import re
import sys
import zipfile
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

try:
    from pypdf import PdfReader
except ImportError:
    print("ERROR: pypdf not installed. Run:  python -m pip install --user pypdf")
    sys.exit(1)

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("ERROR: beautifulsoup4 not installed. Run:  python -m pip install --user beautifulsoup4")
    sys.exit(1)


def _check_ocr_deps():
    """Lazy-load OCR deps. Returns (fitz, pytesseract, Image) or raises."""
    missing = []
    try:
        import fitz  # pymupdf
    except ImportError:
        missing.append("pymupdf")
        fitz = None
    try:
        import pytesseract
    except ImportError:
        missing.append("pytesseract")
        pytesseract = None
    try:
        from PIL import Image
    except ImportError:
        missing.append("Pillow")
        Image = None
    if missing:
        raise RuntimeError(
            "OCR dependencies missing: " + ", ".join(missing) + "\n"
            "Install with:  python -m pip install --user " + " ".join(missing) + "\n"
            "Also requires the Tesseract binary. On Windows:\n"
            "  winget install UB-Mannheim.TesseractOCR"
        )
    # Auto-locate Tesseract binary on Windows if not on PATH
    if os.name == "nt":
        for candidate in (
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        ):
            if os.path.exists(candidate):
                pytesseract.pytesseract.tesseract_cmd = candidate
                break
    return fitz, pytesseract, Image


HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
BOOKS_SRC = ROOT / "knowledge" / "wallach-books"
BOOKS_CLEAN = ROOT / "knowledge" / "books-clean"
KNOWLEDGE = ROOT / "knowledge"
MANIFEST = KNOWLEDGE / "manifest.csv"
CHANGELOG = KNOWLEDGE / "corpus-changelog.md"

BOOKS_CLEAN.mkdir(parents=True, exist_ok=True)

FIELDS = ["filename","title","youtube_id","category","confidence_basis",
          "reason","cospeakers","topics","char_count","word_count"]


def safe_overwrite(path: Path, content: str):
    """Atomic write — temp file + os.replace. Bypasses Windows CFA/OneDrive
    blocks that prevent direct overwrites of existing files."""
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(content, encoding="utf-8")
    os.replace(tmp, path)
    if not path.read_text(encoding="utf-8")[:50]:
        raise RuntimeError(f"Write to {path} appears empty!")


TITLE_MAP = {
    "421125261-Let-s-Play-Doctor-PDF-by-Joel-Wallach-Lan-Ma.pdf":
        "Let's Play Doctor",
    "788873904-Dr-Joel-Wallach-Joel-D-Wallach-JD-Wallach-Ma-Lan-MD-Hell-s-Kitchen-Causes-Prevention-and-Cure-of-Obesity-Diabetes-and-Metabolic-Syndrome-De.pdf":
        "Hell's Kitchen: Causes, Prevention and Cure of Obesity, Diabetes and Metabolic Syndrome",
    "Joel D. Wallach - Dead Doctors Don't Lie (2011) (EPUB) - roflcopter2110.epub":
        "Dead Doctors Don't Lie (2011)",
    "Joel D. Wallach - Dead Doctors Don't Lie (2011) (PDF) - roflcopter2110.pdf":
        "Dead Doctors Don't Lie (2011) [PDF duplicate of EPUB]",
    "pdfcoffee.com_rare-earths-forbidden-cures-pdf-by-joel-wallach-lan-ma-pdf-free.pdf":
        "Rare Earths: Forbidden Cures",
}

SKIP_BOOKS = {
    "Joel D. Wallach - Dead Doctors Don't Lie (2011) (PDF) - roflcopter2110.pdf",
}


TOPIC_VOCAB = {
    "minerals":[r"\bmineral",r"\btrace element",r"\bplant.derived"],
    "selenium":[r"\bselenium\b"],"copper":[r"\bcopper\b"],"calcium":[r"\bcalcium\b"],
    "magnesium":[r"\bmagnesium\b"],"zinc":[r"\bzinc\b"],"chromium":[r"\bchromium\b"],
    "vanadium":[r"\bvanadium\b"],"iodine":[r"\biodine\b"],"iron":[r"\biron\b"],
    "diabetes":[r"\bdiabet"],"obesity":[r"\bobes",r"\bweight"],
    "arthritis":[r"\barthrit"],"osteoporosis":[r"\bosteoporo"],
    "alzheimers":[r"\balzheim"],"dementia":[r"\bdementi"],
    "cancer":[r"\bcancer",r"\btumor",r"\bneoplasm",r"\blymphoma"],
    "cardiovascular":[r"\bheart",r"\bcardio",r"\bblood pressure",r"\bhypertension"],
    "stroke":[r"\bstroke"],
    "kidney":[r"\bkidney",r"\bdialysis",r"\bcreatinine"],
    "thyroid":[r"\bthyroid",r"\bhashimoto"],
    "autism/adhd":[r"\bautism",r"\badhd"],
    "cholesterol":[r"\bcholesterol",r"\bstatin"],
    "diet/nutrition":[r"\bdiet",r"\bnutrition",r"\b90 essential",r"\bketosis",r"\bvegetarian"],
    "gluten":[r"\bgluten"],"salt":[r"\bsalt\b"],
    "fluoride":[r"\bfluoride\b",r"\bfluorid"],
    "lung/respiratory":[r"\blung",r"\bcopd",r"\bmucus",r"\bcough"],
    "skin/hair":[r"\bskin",r"\bhair",r"\bdermatitis"],
    "bones/joints":[r"\bjoint",r"\bbone",r"\btendon"],
    "muscles":[r"\bmuscle",r"\bcramp",r"\bdystrophy"],
    "brain/cognitive":[r"\bbrain",r"\bmemory",r"\bcognitive",r"\bseizure"],
    "longevity":[r"\blongev",r"\blive long",r"\bbiography"],
    "pregnancy/birth":[r"\bpregnan",r"\bbirth defect"],
    "hormones/reproductive":[r"\bovarian",r"\bfibroid",r"\buterine",r"\bhormone"],
    "youngevity-product":[r"\byoungevity",r"\bmighty"],
    "anti-mainstream":[r"\bmainstream\b.*\bmedicine",r"\bbig pharma"],
    "rare-earths":[r"\brare earth"],
}


def topics_from_text(text: str):
    low = text.lower()
    return [t for t, pats in TOPIC_VOCAB.items() if any(re.search(p, low) for p in pats)]


# ---------------------------------------------------------------------------
# Extractors
# ---------------------------------------------------------------------------

def extract_pdf(path: Path):
    reader = PdfReader(str(path))
    parts, offsets = [], []
    cursor = 0
    for i, page in enumerate(reader.pages):
        try:
            txt = page.extract_text() or ""
        except Exception:
            txt = ""
        txt = re.sub(r"\(cid:\d+\)", "", txt)
        txt = re.sub(r"[ \t]+", " ", txt).strip()
        offsets.append({"page": i + 1, "char_offset": cursor})
        parts.append(txt)
        cursor += len(txt) + 2
    return "\n\n".join(parts), offsets


def extract_epub(path: Path):
    z = zipfile.ZipFile(path)
    spine_order = []
    opf_files = [n for n in z.namelist() if n.lower().endswith(".opf")]
    if opf_files:
        try:
            opf = BeautifulSoup(z.read(opf_files[0]), "xml")
            id_to_href = {}
            for item in opf.find_all("item"):
                id_to_href[item.get("id")] = item.get("href")
            opf_dir = os.path.dirname(opf_files[0])
            for itemref in opf.find_all("itemref"):
                idref = itemref.get("idref")
                href = id_to_href.get(idref)
                if href:
                    full = os.path.join(opf_dir, href).replace("\\", "/")
                    spine_order.append(full)
        except Exception:
            pass
    if not spine_order:
        spine_order = sorted(
            n for n in z.namelist()
            if n.lower().endswith((".html", ".xhtml", ".htm"))
        )
    parts, offsets = [], []
    cursor = 0
    for i, name in enumerate(spine_order):
        try:
            html_bytes = z.read(name)
        except KeyError:
            continue
        soup = BeautifulSoup(html_bytes, "html.parser")
        for tag in soup(["script", "style"]):
            tag.decompose()
        h = soup.find(["h1", "h2"])
        chapter_title = h.get_text(" ", strip=True) if h else f"part {i+1}"
        txt = soup.get_text(" ", strip=True)
        txt = re.sub(r"[ \t]+", " ", txt).strip()
        offsets.append({"chapter": chapter_title, "char_offset": cursor, "file": name})
        parts.append(txt)
        cursor += len(txt) + 2
    return "\n\n".join(parts), offsets


def ocr_pdf(path: Path, dpi: int = 200):
    """OCR a scanned PDF via pymupdf rendering + Tesseract recognition.
    Returns (full_text, page_offsets)."""
    fitz, pytesseract, Image = _check_ocr_deps()
    doc = fitz.open(str(path))
    parts, offsets = [], []
    cursor = 0
    n = len(doc)
    print(f"  OCRing {n} pages at {dpi} dpi. Expect 1-3 sec/page on CPU.")
    for i, page in enumerate(doc):
        pix = page.get_pixmap(dpi=dpi)
        img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        try:
            txt = pytesseract.image_to_string(img) or ""
        except Exception as e:
            print(f"  OCR error on page {i+1}: {e}")
            txt = ""
        txt = re.sub(r"[ \t]+", " ", txt).strip()
        offsets.append({"page": i + 1, "char_offset": cursor, "method": "ocr"})
        parts.append(txt)
        cursor += len(txt) + 2
        if (i + 1) % 25 == 0 or (i + 1) == n:
            print(f"  OCR progress: {i+1}/{n} pages")
    doc.close()
    return "\n\n".join(parts), offsets


def should_ocr(full: str, pages: int, force: bool) -> bool:
    if force:
        return True
    wpp = len(full.split()) / max(pages, 1)
    # Empty text-layer ⇒ scanned doc regardless of page count.
    # Without this guard, the 12-page 90-essentials screencapture was ingested
    # as 0 words because the pages<20 short-circuit fired before any yield check.
    if wpp < 5:
        return True
    if pages < 20:
        return False
    return wpp < 50


# ---------------------------------------------------------------------------
# Manifest helpers
# ---------------------------------------------------------------------------

def load_manifest():
    if not MANIFEST.exists():
        return [], set()
    rows = list(csv.DictReader(MANIFEST.open(encoding="utf-8")))
    return rows, {r["filename"] for r in rows}


def write_manifest(rows):
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=FIELDS)
    w.writeheader()
    for r in rows:
        w.writerow(r)
    safe_overwrite(MANIFEST, buf.getvalue())


def append_changelog(added_rows):
    if not added_rows:
        return
    lines = [f"\n## {datetime.now().strftime('%Y-%m-%d %H:%M')} - Book ingestion\n",
             f"Added {len(added_rows)} book(s)\n\n"]
    for r in added_rows:
        lines.append(f"- **{r['category']}** `{r['filename']}` - "
                     f"{r['title']} ({r['word_count']:,} words)\n")
    if not CHANGELOG.exists():
        CHANGELOG.write_text("# Corpus Changelog\n", encoding="utf-8")
    with CHANGELOG.open("a", encoding="utf-8") as f:
        f.writelines(lines)


# ---------------------------------------------------------------------------
# Process one book
# ---------------------------------------------------------------------------

def process_book(fname: str, ocr_force: bool = False, ocr_skip: bool = False):
    src = BOOKS_SRC / fname
    title = TITLE_MAP.get(fname, fname)
    stem = re.sub(r"[^A-Za-z0-9_-]", "_", Path(fname).stem)[:80]
    method = ""
    kind = ""
    unit = ""

    if fname.lower().endswith(".pdf"):
        full, offsets = extract_pdf(src)
        kind = "book-pdf"
        unit = "pages"
        method = "text-layer"
        if not ocr_skip and should_ocr(full, len(offsets), ocr_force):
            words = len(full.split())
            wpp = words / max(len(offsets), 1)
            print(f"  Text-layer yielded {words:,} words / {len(offsets)} pages ({wpp:.1f}/page). Running OCR...")
            full, offsets = ocr_pdf(src)
            method = "ocr"
            kind = "book-pdf-ocr"
    elif fname.lower().endswith(".epub"):
        full, offsets = extract_epub(src)
        kind = "book-epub"
        unit = "chapters"
        method = "html-extract"
    else:
        print(f"Skipping {fname}: unsupported format")
        return None

    if not full or len(full) < 1000:
        print(f"WARNING: {fname} extracted very little text ({len(full)} chars). Possible empty document or OCR failure.")

    (BOOKS_CLEAN / f"{stem}.txt").write_text(full, encoding="utf-8")
    (BOOKS_CLEAN / f"{stem}.{unit}.json").write_text(
        json.dumps(offsets, indent=2), encoding="utf-8")

    topics = topics_from_text(title + " " + full[:8000])
    return dict(
        filename=fname,
        title=title,
        youtube_id="",
        category="High",
        confidence_basis="book-ingestion",
        reason=f"Wallach-authored book ({kind}, {len(offsets)} {unit}, method: {method})",
        cospeakers="",
        topics="; ".join(topics),
        char_count=len(full),
        word_count=len(full.split()),
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    rebuild = "--rebuild" in sys.argv
    ocr_force = "--ocr-all" in sys.argv
    ocr_skip = "--no-ocr" in sys.argv
    if ocr_force and ocr_skip:
        print("ERROR: --ocr-all and --no-ocr are mutually exclusive.")
        sys.exit(1)

    rows, seen = load_manifest()
    on_disk = sorted(BOOKS_SRC.glob("*"))
    on_disk = [p.name for p in on_disk
               if p.suffix.lower() in (".pdf", ".epub") and p.name not in SKIP_BOOKS]
    print(f"Found {len(on_disk)} eligible book(s) in {BOOKS_SRC.name}/")
    if ocr_force:  print("--ocr-all: OCR every PDF regardless of text-layer extraction")
    if ocr_skip:   print("--no-ocr: skip OCR (only text-layer extraction)")

    if rebuild:
        before = len(rows)
        rows = [r for r in rows if r.get("confidence_basis") != "book-ingestion"]
        seen = {r["filename"] for r in rows}
        print(f"--rebuild: dropped {before - len(rows)} existing book rows")

    to_process = [f for f in on_disk if f not in seen]
    if not to_process:
        print("Nothing new to ingest.")
        return

    added = []
    for fname in to_process:
        print(f"Processing: {fname}")
        try:
            row = process_book(fname, ocr_force=ocr_force, ocr_skip=ocr_skip)
        except RuntimeError as e:
            print(f"  FAILED: {e}")
            continue
        if row:
            added.append(row)
            print(f"  -> {row['word_count']:,} words, topics: {row['topics']}")

    rows.extend(added)
    write_manifest(rows)
    append_changelog(added)

    print()
    print(f"Ingested {len(added)} book(s). Manifest now has {len(rows)} rows.")
    print(f"Books-clean dir: {BOOKS_CLEAN}")


if __name__ == "__main__":
    main()
