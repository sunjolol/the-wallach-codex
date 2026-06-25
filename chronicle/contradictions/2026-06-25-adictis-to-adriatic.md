# Adictis → Adriatic — PROVISIONAL editorial correction (2026-06-25)

**Status: ACTIVE + REVERSIBLE.** Keep applying the correction going forward; this
file exists so it can be found and undone in one pass if it ever proves wrong.

## What
Wallach's books print **"the Adictis Islands"** in an iodine / goiter passage
(Rare Earths Ch. 11 per-element catalog, Iodine entry): island populations
**Pisila, Polje, and Milahnici** with identical soil-iodine content but very
different goiter rates — the point being a severe copper deficiency in the
high-goiter soils, since copper is required to utilize iodine.

During Phase γ.3 **batch 25 (Iodine)** the agent flagged "Adictis" as a likely
error for **"Adriatic"** (Pisila / Polje / Milahnici are Adriatic / Croatian
locations). Luneth ruled (2026-06-25): correct it everywhere — *"I can't find that
word anywhere."* All occurrences in the sealed Eden corpus were changed
`the Adictis Islands` → `the Adriatic Islands`.

## Uncertainty (why this file exists — Luneth's request)
Luneth is **NOT 100% certain** the correction is right. "Adictis" returns nothing
in any search (not a known word, place, or spelling), which strongly supports an
OCR / original-print error for "Adriatic" — but it *could* be a genuine obscure,
archaic, or mis-transliterated name. We keep correcting it (best available
judgment) but record it here as **easily findable + reversible** just in case.

## Where changed (4 sealed Eden books — Wallach reuses the passage)
- `eden/corpus/books/rare-earths-forbidden-cures.txt`
- `eden/corpus/books/dddl-third-edition-2011.txt`
- `eden/corpus/books/epigenetics.txt`
- `eden/corpus/books/immortality.txt`

NOT changed (deprecated pre-Eden raw-OCR archives, slated for Phase η removal —
they still read "Adictis"): `knowledge/books-clean/*.txt` (3 files).

**No claim `verbatim` or `claim_text` contains the word** (verified), so the change
is isolated to book body text + the `content_sha256` hashes in `books-meta.json`.

## How to revert (clean, ~5 min)
1. `grep -rl "Adriatic Islands" eden/corpus/books/` → the 4 books above.
2. For each: `safe_write replace <book> --old-file <"the Adriatic Islands"> --new-file <"the Adictis Islands">`.
3. `python eden/tools/corpus_resnap.py --book <id> --write` for each (expect 0 BROKEN).
4. `corpus_seal.py` → `corpus_embed.py` → `node tools/build.mjs` → `invariants.py`.
   (Exact mirror of the original fix.)

## Origin trail
- Flagged: batch 25 (Iodine) claim review, 2026-06-25.
- Ruled + applied: commit `95af898` (batch 25 round-close).
- Logged as provisional/reversible: this file, 2026-06-25 PM (Luneth's request).
