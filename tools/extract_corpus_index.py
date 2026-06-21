#!/usr/bin/env python3
"""
extract_corpus_index.py — Build comprehensive Wallach topic index from corpus.

Extracts from all 4 books:
- Conditions / diseases with full protocols
- Deficiency → symptom claims
- "Avoid X" warnings
- Dose specifications (nutrient + amount + frequency)
- Cross-references between conditions

Outputs:
- knowledge/corpus-index/conditions.json
- knowledge/corpus-index/deficiency-symptoms.json
- knowledge/corpus-index/avoid-list.json
- knowledge/corpus-index/dose-specs.json
- knowledge/corpus-index/index-summary.md
"""
import json
import re
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
BOOKS = {
    "LPD": ROOT / "knowledge/books-clean/421125261-Let-s-Play-Doctor-PDF-by-Joel-Wallach-Lan-Ma.txt",
    "HK":  ROOT / "knowledge/books-clean/788873904-Dr-Joel-Wallach-Joel-D-Wallach-JD-Wallach-Ma-Lan-MD-Hell-s-Kitchen-Cau.txt",
    "DDDL": ROOT / "knowledge/books-clean/Joel_D__Wallach_-_Dead_Doctors_Don_t_Lie__2011___EPUB__-_roflcopter2110.txt",
    "RE":  ROOT / "knowledge/books-clean/pdfcoffee_com_rare-earths-forbidden-cures-pdf-by-joel-wallach-lan-ma-pdf-free.txt",
}
PAGES_INDEX = {
    "LPD": ROOT / "knowledge/books-clean/421125261-Let-s-Play-Doctor-PDF-by-Joel-Wallach-Lan-Ma.pages.json",
    "HK":  ROOT / "knowledge/books-clean/788873904-Dr-Joel-Wallach-Joel-D-Wallach-JD-Wallach-Ma-Lan-MD-Hell-s-Kitchen-Cau.pages.json",
    "RE":  ROOT / "knowledge/books-clean/pdfcoffee_com_rare-earths-forbidden-cures-pdf-by-joel-wallach-lan-ma-pdf-free.pages.json",
}

OUT_DIR = ROOT / "knowledge/corpus-index"
OUT_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_book(book_id):
    return BOOKS[book_id].read_text(encoding="utf-8", errors="replace")


def load_page_index(book_id):
    if book_id not in PAGES_INDEX or not PAGES_INDEX[book_id].exists():
        return []
    return json.loads(PAGES_INDEX[book_id].read_text(encoding="utf-8"))


def char_to_page(book_id, char_offset, page_index):
    if not page_index:
        return None
    found = None
    for entry in page_index:
        if entry["char_offset"] <= char_offset:
            found = entry["page"]
        else:
            break
    return found


def clean_text(s):
    """Normalize whitespace, strip stray hyphens at line breaks."""
    s = re.sub(r'-\n', '', s)  # de-hyphenate line breaks
    s = re.sub(r'\s+', ' ', s)
    return s.strip()


# ---------------------------------------------------------------------------
# Pattern 1: condition headings (uppercase + colon)
# ---------------------------------------------------------------------------

CONDITION_HEADING_RE = re.compile(
    r'^([A-Z][A-Z\'\s\-\(\),0-9]{4,80}):\s*',
    re.MULTILINE
)


def extract_conditions(book_id):
    """For each ALL-CAPS heading, capture the block to the next heading."""
    text = load_book(book_id)
    page_idx = load_page_index(book_id)

    # Find every heading match
    matches = list(CONDITION_HEADING_RE.finditer(text))
    conditions = []

    # Skip headings that are clearly NOT conditions (preface/section markers etc)
    SKIP_PATTERNS = [
        r'^(CATE|INFUSION|DECOCTION|TINCTURE|CAPSULE|TABLET|TABLE|FIG|CHAPTER|PART|APPENDIX|NOTE|WARNING|CAUTION)$',
        r'^FIG[.\s]',
        r'^(SECTION|PAGE|VOLUME|REFERENCE|INDEX|BIBLIOGRAPHY|GLOSSARY|TABLE OF CONTENTS|CONTENTS)$',
        r'^[IVX]+$',  # roman numerals
        r'^\d+$',  # just numbers
    ]
    skip_re = re.compile('|'.join(SKIP_PATTERNS), re.IGNORECASE)

    for i, m in enumerate(matches):
        heading = m.group(1).strip()
        if skip_re.match(heading) or len(heading) > 80:
            continue
        start = m.end()
        # End at next heading OR end of text
        end = matches[i+1].start() if i+1 < len(matches) else len(text)
        # Limit block to first 3000 chars to keep manageable
        block = text[start:min(end, start + 3000)]
        page = char_to_page(book_id, m.start(), page_idx)
        conditions.append({
            "book": book_id,
            "heading": heading,
            "page": page,
            "char_offset": m.start(),
            "block": clean_text(block)[:2500],  # truncate
        })
    return conditions


# ---------------------------------------------------------------------------
# Pattern 2: "Treatment of X" protocol intros
# ---------------------------------------------------------------------------

TREATMENT_RE = re.compile(
    r'Treatment\s+(?:of|for)\s+([a-zA-Z\'][a-zA-Z\'\s\-\(\)]{2,80}?)\s+(?:should\s+)?includes?\s+([^.]{50,2000}?\.(?:\s+[A-Z][^.]{30,500}?\.){0,3})',
    re.MULTILINE | re.IGNORECASE
)


def extract_treatments(book_id):
    text = load_book(book_id)
    page_idx = load_page_index(book_id)
    treatments = []
    for m in TREATMENT_RE.finditer(text):
        condition = clean_text(m.group(1))[:100]
        protocol = clean_text(m.group(2))[:1500]
        page = char_to_page(book_id, m.start(), page_idx)
        treatments.append({
            "book": book_id,
            "condition": condition,
            "page": page,
            "char_offset": m.start(),
            "protocol": protocol,
        })
    return treatments


# ---------------------------------------------------------------------------
# Pattern 3: deficiency → symptom claims
# ---------------------------------------------------------------------------

# "X deficiency causes Y" / "X deficiency results in Y" / "X deficiency leads to Y"
DEFICIENCY_RE = re.compile(
    r'(\b[a-zA-Z][a-zA-Z\-\s]{2,40}?)\s+deficienc(?:y|ies)\s+(?:causes?|results?\s+in|leads?\s+to|manifests?\s+as|produces?|is\s+(?:responsible\s+for|associated\s+with|implicated\s+in))\s+([^.]{20,400}\.)',
    re.IGNORECASE
)


def extract_deficiencies(book_id):
    text = load_book(book_id)
    page_idx = load_page_index(book_id)
    deficiencies = []
    for m in DEFICIENCY_RE.finditer(text):
        nutrient = clean_text(m.group(1)).lower()
        symptom_claim = clean_text(m.group(2))[:400]
        page = char_to_page(book_id, m.start(), page_idx)
        deficiencies.append({
            "book": book_id,
            "nutrient": nutrient[:60],
            "symptom_claim": symptom_claim,
            "page": page,
            "char_offset": m.start(),
        })
    return deficiencies


# ---------------------------------------------------------------------------
# Pattern 4: dose specifications
# ---------------------------------------------------------------------------

# "Nutrient at X mg/mcg/IU [frequency]"
DOSE_RE = re.compile(
    r'\b([A-Z][a-z][a-zA-Z\-\s]{2,40}?)\s+(?:at|@)\s+(\d[\d,\.\-\s]{0,10})\s*(mg|mcg|µg|IU|gm?|grams?|drops?|tbsp\.?|tsp\.?)\s*(?:per\s+day|/day|daily|b\.?\s?i\.?\s?d\.?|t\.?\s?i\.?\s?d\.?|q\.?\s?i\.?\s?d\.?|q\.?\s?d\.?)?',
    re.IGNORECASE
)


def extract_doses(book_id):
    text = load_book(book_id)
    page_idx = load_page_index(book_id)
    doses = []
    for m in DOSE_RE.finditer(text):
        nutrient = clean_text(m.group(1))[:50]
        amount = m.group(2).strip()
        unit = m.group(3).strip()
        page = char_to_page(book_id, m.start(), page_idx)
        doses.append({
            "book": book_id,
            "nutrient": nutrient,
            "amount": amount,
            "unit": unit.lower(),
            "page": page,
            "char_offset": m.start(),
            "context": clean_text(text[max(0, m.start()-100):m.end()+50])[:250],
        })
    return doses


# ---------------------------------------------------------------------------
# Pattern 5: "avoid X" lists
# ---------------------------------------------------------------------------

AVOID_RE = re.compile(
    r'\bavoid(?:ance\s+of)?\s+([^.\n]{5,300}\.)',
    re.IGNORECASE
)


def extract_avoidances(book_id):
    text = load_book(book_id)
    page_idx = load_page_index(book_id)
    avoidances = []
    for m in AVOID_RE.finditer(text):
        what = clean_text(m.group(1))[:300]
        page = char_to_page(book_id, m.start(), page_idx)
        avoidances.append({
            "book": book_id,
            "avoid": what,
            "page": page,
            "char_offset": m.start(),
        })
    return avoidances


# ---------------------------------------------------------------------------
# Main extraction
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print("EXTRACTING WALLACH CORPUS INDEX")
    print("=" * 60)

    all_conditions = []
    all_treatments = []
    all_deficiencies = []
    all_doses = []
    all_avoidances = []

    for book_id in BOOKS:
        if not BOOKS[book_id].exists():
            print(f"Skip {book_id}: file missing")
            continue
        print(f"\n=== {book_id} ===")

        conds = extract_conditions(book_id)
        print(f"  Conditions: {len(conds)}")
        all_conditions.extend(conds)

        treats = extract_treatments(book_id)
        print(f"  Treatments: {len(treats)}")
        all_treatments.extend(treats)

        defs = extract_deficiencies(book_id)
        print(f"  Deficiency claims: {len(defs)}")
        all_deficiencies.extend(defs)

        doses = extract_doses(book_id)
        print(f"  Dose specs: {len(doses)}")
        all_doses.extend(doses)

        avoids = extract_avoidances(book_id)
        print(f"  Avoid statements: {len(avoids)}")
        all_avoidances.extend(avoids)

    # Write outputs
    outputs = {
        "conditions.json": all_conditions,
        "treatments.json": all_treatments,
        "deficiency-symptoms.json": all_deficiencies,
        "dose-specs.json": all_doses,
        "avoid-list.json": all_avoidances,
    }
    for fname, data in outputs.items():
        path = OUT_DIR / fname
        path.write_text(json.dumps(data, indent=2))
        print(f"\nWrote {path.name}: {len(data)} entries, {path.stat().st_size:,} bytes")

    # Build summary
    summary = build_summary(all_conditions, all_treatments, all_deficiencies, all_doses, all_avoidances)
    (OUT_DIR / "index-summary.md").write_text(summary)
    print(f"\nWrote index-summary.md")


def build_summary(conds, treats, defs, doses, avoids):
    from collections import Counter

    # Top nutrients in deficiency claims
    nut_counter = Counter(d["nutrient"] for d in defs)
    top_nutrients = nut_counter.most_common(30)

    # Top nutrients in doses
    dose_nuts = Counter(d["nutrient"].lower() for d in doses)
    top_dose_nuts = dose_nuts.most_common(30)

    # Top conditions by book
    cond_by_book = Counter(c["book"] for c in conds)

    lines = [
        "# Wallach Corpus Index Summary",
        "",
        "_Generated by tools/extract_corpus_index.py — corpus-grounded structured data foundation for the agent._",
        "",
        f"- **Conditions extracted:** {len(conds)} across {len(cond_by_book)} books",
        f"- **Treatment protocols:** {len(treats)}",
        f"- **Deficiency → symptom claims:** {len(defs)}",
        f"- **Dose specifications:** {len(doses)}",
        f"- **Avoid statements:** {len(avoids)}",
        "",
        "## Conditions per book",
        "",
    ]
    for book, count in cond_by_book.most_common():
        lines.append(f"- **{book}**: {count}")
    lines.append("")

    lines.append("## Top 30 nutrients in deficiency claims")
    lines.append("")
    for nut, count in top_nutrients:
        lines.append(f"- {nut}: {count} mentions")
    lines.append("")

    lines.append("## Top 30 nutrients in dose specifications")
    lines.append("")
    for nut, count in top_dose_nuts:
        lines.append(f"- {nut}: {count} dose specs")
    lines.append("")

    return "\n".join(lines)


if __name__ == "__main__":
    main()
