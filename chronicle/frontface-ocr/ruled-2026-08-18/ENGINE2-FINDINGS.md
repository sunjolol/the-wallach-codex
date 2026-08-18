# Engine 2 — vision-verify the ruled unverified-book claims (staged, no front-face)

_2026-08-18. Autonomous. Per Luneth: **verify & stage, hold front-face.** Nothing was flipped into `claims_verified`; `enriched_book_is_verified` untouched; nothing enriched._

## The target set — 70 SEALED unverified ruled claims

These are the ruled claims already sealed into the corpus (2026-08-18) from the 5 unverified books. They are correctly **blocked from front-facing** by `enriched_book_is_verified` until each span is page-read (§3 of the frontface BLUEPRINT). They are NEW (sealed 2026-08-18) so the 2026-08-02 worklist never covered them — this is fresh work.

| Book | Claims | Page source |
|---|--:|---|
| epigenetics | 16 | Screenshot (N).png (dual-monitor spread; marker→offset) |
| hells-kitchen | 3 | PDF text-layer + render |
| immortality | 45 | Screenshot (N).png (same) |
| lets-play-doctor | 3 | PDF text-layer + render (PyMuPDF) |
| rare-earths | 3 | PDF text-layer + render |
| **total** | **70** | |

_(The other 92 of the campaign's 162 are unsealed — they can't be enriched until sealed anyway, so they wait behind the same ratify step as the dose tranche. Recover them from the ruling dashboard DATA the same way Engine 1 did.)_

## Corroboration pass (3 PDF-text-layer books, 9 claims) — cheap RANK, never a verdict

Ran `tools/frontface/pdf_corroborate.py` (second independent OCR = the PDF's own text layer) on the 9 PDF-book claims. **Agreement ranks; it never verifies** (~14% of agreeing claims still hid a defect — BLUEPRINT §3). Epigenetics + immortality (61 claims) use the Tesseract cache path (`corr_shots.py`) — not yet run this session.

| Claim | Book | Page | Corroboration | Vision verdict |
|---|---|--:|---|---|
| WAL-CLM-RARE-000403 | rare-earths | 510 | DIVERGE (10 hunk, cov 0.191) | — |
| WAL-CLM-RARE-000404 | rare-earths | 311 | agree | — |
| WAL-CLM-RARE-000405 | rare-earths | 119 | agree | — |
| WAL-CLM-LETS-000522 | lets-play-doctor | 116 | agree | — |
| WAL-CLM-LETS-000523 | lets-play-doctor | 105 | DIVERGE (1 hunk, cov 0.913) | VERIFIED-CLEAN |
| WAL-CLM-LETS-000524 | lets-play-doctor | 83 | DIVERGE (1 hunk, cov 0.941) | VERIFIED-CLEAN |
| WAL-CLM-HELLS-000097 | hells-kitchen | 255 | agree | — |
| WAL-CLM-HELLS-000098 | hells-kitchen | 168 | agree | — |
| WAL-CLM-HELLS-000099 | hells-kitchen | 106 | agree | — |

### Vision-verified this session (the §3 ground truth — page image)

- **WAL-CLM-LETS-000523** → **VERIFIED-CLEAN** (rendered p105). page-read: 'result of food allergies' shows the space; PDF text-layer 'offood' was an extraction artifact (false positive).
- **WAL-CLM-LETS-000524** → **VERIFIED-CLEAN** (rendered p83). page-read (printed p71): 'in case of an electric shock' shows the space; PDF 'ofan' was an extraction artifact (false positive).

### Flagged for neighbour-search

- **WAL-CLM-RARE-000403** — corroboration coverage **0.191** (< 0.85 ⇒ page index unreliable, per BLUEPRINT). It's a fragmented multi-line condition list (Bell's Palsy / NSH / Osteofibrosis / Tetany…) that phrase-search mislocated to p510. Needs a neighbour-page vision read, not a fix.

## What remains (next session)

1. **Corroborate epig + immort (61 claims)** via the Tesseract cache (`corr_shots.py`) to rank them.

2. **Vision-read every one of the 70** against its page image (corroboration only ranks). epig/immort need the dual-monitor crop (x≈0.028–0.48, both pages of the spread; retry the adjacent Screenshot before declaring unverifiable — BLUEPRINT §2).

3. Record `{id, located, defects[], corrected_verbatim, unverifiable?}` per claim; fix+resnap any real defects; **then** Luneth moves clean ids into `verified.json::claims_verified` and they become front-faceable. **Do not flip the gate without his sign-off.**

4. The 92 unsealed unverified ruled claims recover from the ruling dashboard, seal with the dose tranche, then verify.
