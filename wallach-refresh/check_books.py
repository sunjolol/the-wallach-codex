"""Quick read-only check of book rows in manifest.csv."""
import csv
from pathlib import Path

MANIFEST = Path(__file__).resolve().parent.parent / "knowledge" / "manifest.csv"
rows = list(csv.DictReader(MANIFEST.open(encoding="utf-8")))
books = [r for r in rows if r.get("confidence_basis") == "book-ingestion"]

print(f"Manifest total: {len(rows)} rows")
print(f"Book rows:      {len(books)}")
print()
for r in books:
    wc = int(r["word_count"])
    print(f"  {wc:>8,} words | {r['reason']}")
    print(f"           | {r['title']}")
    print()
