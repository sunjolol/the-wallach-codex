# Youngevity Catalog Ingest — Notes & Limitations

**Source:** `YGY-Product-Catalog-0617-online-FULL.pdf` (104 pages, June 2017 edition).
**OCR output:** `YGY-Product-Catalog-0617-FULL-OCR.txt` (OCR'd 2026-06-11, pdftoppm 200dpi → tesseract).

## What this catalog IS good for
- **Product → qualitative ingredient map**: which products exist and what each broadly contains.
- **Pack sizes, SKUs, and pricing** (WS / BV / QV) for every product.
- **Occasional inline active-ingredient amounts** in marketing copy (e.g. "500 mg of niacin per serving").
- Identifying which products carry a target nutrient (e.g. boron, zinc, EFAs).

## What it is NOT good for — important limitation
This is a **sales catalog, not a supplement-facts database.** It does **not** reliably contain per-nutrient Supplement Facts panels:
- Only **2 pages** have a readable "Supplement Facts" panel (Ultimate Cardio, p17; TrueDetox Tea, p71).
- Even those panels OCR with **scrambled label↔value alignment** (table columns collapse), so exact mg-per-nutrient mappings from them are **unreliable without manual verification against the original image**.
- Total exact dose figures across all 104 pages: ~19 "mg" and 1 "mcg" — almost all in marketing copy, not facts panels.

**Conclusion:** For EXACT per-nutrient dosages (e.g. how many mg boron in Beyond Tangy Tangerine), the individual product **Supplement Facts label / spec sheet** is still required. Those are not in this catalog.

## Products relevant to the testosterone / lifts question (qualitative, from catalog)
- **Ultimate EFA / Ultimate EFA Plus** — flaxseed + fish + borage oils; omega-3/6/9; IFOS certified. (Directly relevant to the EFA tension.)
- **Ultimate Selenium** — dedicated selenium product. (Muscle / Wallach's selenium thesis.)
- **Beyond Tangy Tangerine® / Ultimate Tangy Tangerine® / Ultimate Classic® / Plant Derived Minerals™** — flagship multi-mineral base; the "90 essentials" delivery vehicles.
- **Ultimate Bio Calcium** — contains magnesium, manganese, zinc, boron, copper (cofactor blend).
- **Ultimate Cardio (STX)** — supplement panel lists Boron among ingredients.
- **Healthy Body Start Pak™ 2.0** — bundled core program (BTT + Selenium + EFA + Osteo-fx). The standard Youngevity "base."
- No standalone "Ultimate Zinc" or standalone boron product found in this edition.

## Provenance flag
Catalog is genuine Youngevity (Wallach's company) — usable as the operational "what Wallach's company actually sells and at what dose where stated." Distinct from the Wallach *philosophy* corpus; tag accordingly if added to manifest.
