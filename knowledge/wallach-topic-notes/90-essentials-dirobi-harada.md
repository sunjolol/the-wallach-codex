# 90 Essential Nutrients — Dirobi / Dr. Shane Harada article

**Source file:** `knowledge/wallach-books/Dr-Wallach-90-Essential-Nutrients.png` (single-image article export, 804 × 18,612 px)
**Original URL:** https://blog.dirobi.com/90-essential-nutrients/
**Stated basis:** "PDF is based on" an interview with Dr. Shane Harada (Dirobi), discussing Wallach's 90 essentials framework
**Vision-read:** 2026-06-11 in 11 overlapping slices

## Provenance and tier

**Tier 3 — third-party commentary on the Wallach framework.** Not Wallach-authored. The filename in `wallach-books/` is a misnomer; the article body is Harada/Dirobi content that references Wallach's framework and the canonical "$25M / 25,000 autopsies / 10M blood chemistries / 1971–1983" claim. By Doctrine §1 hierarchy this sits at Tier 3 (parallel to YGY catalog and product-page content), strictly below Wallach books (Tier 1) and authored transcripts/lectures (Tier 2).

Equivalent placement is intentional: this article is to the Wallach corpus what the 2017 YGY catalog is — adjacent operational/commentary material, useful as reference, never authoritative for reasoning.

**Product mentions are explicitly out-of-frame for our Youngevity product DB:**
- **Mimi's Miracle Minerals / Mimi's Miracle Multi** — Dirobi brand (NOT Youngevity)
- **Pure Form Omegas** — third-party brand, marketed for "plant-based omegas more readily utilized by your body than fish based" (a position that conflicts with Wallach's pro-fish-oil / IFOS-certified-marine-EFA stance — see Doctrine §1)

These do **not** enter the YGY product database. If the system ever cites either product as Wallach-recommended, that's a Doctrine §11 violation.

## Why we did not ingest the PNG body into `manifest.csv`

1. **Not authored by Wallach** — would dilute the book-ingestion category and break "Wallach is the engine" prime directive.
2. **Adds no unique Wallach content** — the four canonical lists (60 minerals / 16 vitamins / 12 amino acids / 2–3 fatty acids) are already established and cross-corroborated by:
   - The 90-nutrients-front graphic vision-read into `health-resources/TRANSCRIPTIONS.md`
   - Hell's Kitchen (book), explicit 60-mineral 3-column list
   - Rare Earths: Forbidden Cures (book), full element-by-element discussion with ppm data
   - Dead Doctors Don't Lie 2011 (EPUB), Niobium and other rare-earth entries
3. **Inclusion would import Harada/Dirobi voice and non-YGY product marketing** into reasoning, against the Doctrine.

The PNG stays on disk in `wallach-books/` so the file path remains stable, but it is **not** a Wallach source and is **not** in the manifest. Treat any future reference to it as Tier 3 only.

## What this article added that was actually useful

One thing: it surfaced an error in our own TRANSCRIPTIONS.md vision read. The 90-nutrients-front list in TRANSCRIPTIONS.md was 59 minerals (Niobium missing); the PNG's list is 60, and Niobium is confirmed in Hell's Kitchen + Rare Earths + Dead Doctors Don't Lie. Correction logged in TRANSCRIPTIONS.md and `memory-change-log.md`.

Otherwise: structural parity with existing sources. Minor variants noted below for completeness.

## List variants worth noting

**60 minerals.** PNG list is alphabetically clustered differently (essential macros first, then rare-earths) vs TRANSCRIPTIONS.md pure-alphabetic. Same 60 elements when TRANSCRIPTIONS.md is corrected for Niobium.

**16 vitamins.** PNG: "Flavonoids and Bioflavonoids" (one slot, both terms). TRANSCRIPTIONS.md: "Flavonoids" only. Same slot, looser naming.

**12 amino acids.** Identical set: Arginine, Histidine, Isoleucine, Leucine, Lysine, Methionine, Phenylalanine, Taurine, Threonine, Tryptophan, Tyrosine, Valine. PNG omits the "conditionally essential" asterisk notation that TRANSCRIPTIONS.md preserves for Arginine / Taurine / Tyrosine.

**2–3 fatty acids.** PNG: "Omega 3, 6, 9" (generic). TRANSCRIPTIONS.md: "Omega 3 (Linoleic), Omega 6 (Linolenic), Omega 9 (Arachidonic)" — with the labeling error already flagged (linoleic is omega-6, not omega-3, in standard biochem). PNG is less specific so it neither confirms nor contradicts the labeling-error finding.

## Headline claims from the article (Tier 3, treat as Harada paraphrase of Wallach)

- "$25M, 25,000 autopsies on humans and animals, 10M blood chemistries, 1971–1983, Smithsonian-held work"
- "63 doing autopsies on animals and humans that included about 16,000 autopsies of animals and humans as well as clinical profiles on every single one of them to discover these 90 essential nutrients"
- "approximately 900 different diseases directly associated with vitamin, mineral, amino acid and essential fatty acid deficiencies"

These are commonly-cited Wallach framings as filtered through Harada. They corroborate that the framings circulate; they are NOT primary citations and should not be cited from this article. The Wallach books are the primary source.

## Decision

- **Keep PNG on disk** at `wallach-books/Dr-Wallach-90-Essential-Nutrients.png` (no rename — preserves file identity).
- **No manifest row** added.
- **No vision sidecar text** written into `books-clean/`.
- **Niobium correction** applied to TRANSCRIPTIONS.md.
- **`ingest_books.py` PNG/JPG support deferred** — not needed; this file does not warrant a code path of its own.

If a future genuine Wallach-authored image source appears (e.g., a scanned Wallach handout or label panel), revisit extending ingest at that time.
