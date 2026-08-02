# Vision pass on the 21 held hyphens — RESULTS (2026-08-02)

_All 21 resolved. READ-ONLY: no source byte changed. Four OCR errors found, and **every one of them
was in the "KEEP — real compound" bucket** — the exact failure this pass existed to catch._

## ★ Headline: a KEEP verdict was wrong 4 times out of 18
Phase 1a predicted this in writing: JOIN is positive evidence ("the rejoined token is a real word"),
KEEP is negative evidence ("it isn't") and is therefore only as good as its input. If OCR corrupted a
half, the rejoin can't produce a word, so the pair lands in KEEP and *looks like* a compound.
Confirmed against the pages:

| claim | our text | the page says | true word |
|---|---|---|---|
| `WAL-CLM-RARE-000336` | `pro-\|side` | `pro-`/`vide` | **provide** |
| `WAL-CLM-RARE-000365` | `fluo-\|tine` | `fluo-`/`rine` | **fluorine** |
| `WAL-CLM-RARE-000389` | `di-\|Jute` | `di-`/`lute` | **dilute** |
| `WAL-CLM-RARE-000400` | `past-\|ties` | `past-`/`ries` | **pastries** |

All four are single-letter misreads of the SECOND half (v→s, r→t, l→J, r→t). None is detectable
mechanically: each produces a real English word in a plausible position.

## Full verdicts

**Fix the OCR, then join fully (4)** — `RARE-000336` provide · `RARE-000365` fluorine ·
`RARE-000389` dilute · `RARE-000400` pastries.

**Join fully — syllable break (2)** — `RARE-000339` pre-|mature → **premature** ·
`RARE-000400` co-|las → **colas**. (Both were mis-KEPT by the `CHEM_PREFIX` rule, which fires on the
ordinary English prefixes `pre-` and `co-`. That rule should not outrank the rejoined-is-a-word test.)

**Remove the newline, KEEP the hyphen (15)** — the wrap fell ON a real compound hyphen, so the
hyphen is correct but the line break still renders as `anti- inflammatory` with a space:
`RARE-000096` anti-inflammatory · `RARE-000337` iron-containing · `RARE-000388` whooping-cough ·
`LETS-000517` by-products · `EPIGEN-000230` Twenty-two · `-000254` acid-deficient ·
`-000263` anti-psoriatic · `-000273` genetically-transmitted · `-000298` myo-inositol ·
`-000329` low-sodium · `-000339` drinking-water · `-000356` eosinophilia-myalgia ·
`-000371` OH-group · `-000393` acetyl-CoA · `-000453` Wernicke-Korsakoff.

**Structural, not a hyphen (1)** — `WAL-CLM-LETS-000512` `Pharma-|Need`. The page is a TABLE whose
headers are `Nutrient | RDA | True Supplement Need | 30-Day Pharmacologic Daily Dose`. The OCR read
ACROSS columns, splicing `Pharma-` (from "Pharmacologic", broken in its own column) onto `Need` (from
the neighbouring column). Needs a table-structure correction, not a rejoin.

## Evidence standard used, stated honestly
- **Vision (page image) — 9:** RARE-000336, -000365, -000389, -000400 (×2), -000388, LETS-000512,
  EPIGEN-000329, -000339.
- **PDF line geometry — 3:** RARE-000096, -000337, -000339. PyMuPDF reports real line boxes, so
  "ends a line / starts the next" is read off the printed page's own layout.
- **Corpus-internal attestation — 9:** the same pair appears MID-LINE hyphenated elsewhere in the
  same book (Twenty-two ×4, genetically-transmitted ×16, myo-inositol ×5, Wernicke-Korsakoff ×5,
  acetyl-CoA, plus the in-context parallels acid-deficient, anti-psoriatic, OH-group,
  eosinophilia-myalgia). That is the book's own settled form, not a guess — but it is NOT a page
  image, and it is labelled as such rather than reported as vision-verified.

## ★ Phase-1 BLOCKER — the Screenshot mapping is not 1:1
BLUEPRINT §2 states the epigenetics/immortality claim→page mapping is "1:1, already computed" via the
`Screenshot (N)` marker. **It is not.** Measured:

- `Screenshot (459)` shows book page **371**; `Screenshot (460)` shows page **374**.
- Across the book: 346→p145, 459→p371, 544→p548, 613→p689 — consistently ≈ **2 book pages per
  screenshot**.
- Each capture is a **TWO-PAGE SPREAD**. `low-sodium` sits under marker 459, and it is on the RIGHT
  page of that spread — invisible in a crop of the left page.

A Phase-1 agent handed "the Screenshot for this claim" and cropping one page would report
"passage not found" — or, worse, read a NEIGHBOURING page and diff against the wrong text. The crop
must span both halves (x ≈ 0.028–0.48 of the 3840px frame), and "not found" must be retried on the
adjacent screenshot before anything is called unverifiable.

## Also seen on the pages (recorded, deliberately NOT fixed)
The books' own typos, faithfully transcribed and out of scope per the mandate: `begining`
(rare-earths p291), `pateint` (epigenetics), `appearence`, `sucessfully`, `Rockerfeller`,
`Echinacia`, `menapause`. Whole-book typo repair is a separate campaign.

## APPLIED 2026-08-02 — sealed at knowledge_version=440
All 21 applied (29 edits over 21 claims, including 6 more Phase-0-verified defects in RARE-000336 and 2 in
EPIGEN-000239). LETS-000512 left as the single named exception. 0 BROKEN; post-resnap audit 21 changed /
21 planned / 0 unexplained; corpus_verify PASS; board 81/81; front-facing split words corpus-wide 180 → 1.

## Original note (kept)
Nothing was written. Applying these needs a source-edit + resnap + **user seal** cycle, and the 4 OCR
fixes change LETTERS — so `corpus_resnap` will report them BROKEN and they must be supplied via
`--fix`, which is exactly the intended path for a scan-error fixed inside a span.
