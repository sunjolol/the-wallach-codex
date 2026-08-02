# Phase 1a — mechanical line-break-hyphen pass (PLAN, awaiting Luneth's go + seal)

_Luneth chose the split approach 2026-08-02: rejoin the line-break hyphens mechanically first, then
spend the vision budget on the genuine-OCR half. This file is the reviewable change-set. **Nothing
has been applied** — the pipeline ends at `corpus_seal`, which is USER-ONLY._

## The numbers
**180 line-break hyphens inside 91 front-facing verbatims.** (The Phase-0 pre-scan said 87 quotes;
the exact in-verbatim scan says 91 quotes / 180 occurrences.)

| verdict | n | meaning |
|---|--:|---|
| **JOIN** | 159 | the rejoined token is a real word → the hyphen is a typesetting break |
| **KEEP** | 18 | the rejoined token is NOT a word, or a chemical prefix / proper noun → a real compound |
| **REVIEW** | 3 | the vocabulary cannot settle it → Luneth, never guessed |

Per book (JOIN): rare-earths 109 · lets-play-doctor 49 · epigenetics 1 · immortality 0.

## The discriminator, and why it is not book_purity's
`book_purity.py` asks *"are BOTH halves real words?"* and REVIEWs if so (`keep_hard`). Right for a
whole-book sweep, wrong here: it sends `de-|spite` and `mal-|absorption` to review because `de`,
`mal`, `spite`, `absorption` are all words — when the answers are obviously *despite* and
*malabsorption*. The sharper question for a line-break wrap is **is the REJOINED token itself a real
word?**

    try+ing → trying ✓ JOIN        potassium+rich → potassiumrich ✗ KEEP
    de+spite → despite ✓ JOIN      self+esteem   → selfesteem    ✗ KEEP

`book_purity`'s two hard KEEP rules are inherited unchanged and override the join: a chemical/stereo
prefix and a proper-noun second half are never joined.

## ★ Why this is safe to apply before the vision pass — and where it is NOT
**De-hyphenation is orthogonal to OCR correctness.** Joining `dis-|ease` removes a line-break
artifact; it cannot create, hide, or worsen a letter error. If `com-|bines` should read *combined*,
our text is already wrong and joining does not change that — the vision pass still owns it.

The JOIN verdict is also **self-protecting against a damaged half**: if OCR corrupted either side,
the rejoin almost never produces a real word, so it lands in KEEP/REVIEW rather than JOIN.

**A KEEP verdict is NOT safe, and that is the load-bearing finding.** KEEP is *negative* evidence
("the rejoin is not a word") and is therefore only as good as its input. `WAL-CLM-RARE-000336`'s
`pro-|side` was ruled *"a real compound"* purely because the page's `vide` had been OCR'd to `side`.
It is not a compound — the page says **provide**. So:

- **all 18 KEEP + 3 REVIEW wait for the vision pass**, and
- **the hyphen pass must be RE-RUN after vision corrections land** — once `side`→`vide`,
  `pro-|vide` reclassifies to JOIN automatically.

## The 3 REVIEW cases (Luneth's call — all three look like OCR damage, not compounds)
| claim | wrap | read |
|---|---|---|
| `WAL-CLM-RARE-000365` | `fluo-\|tine` | almost certainly `fluo-rine` → **fluorine**, with an OCR r→t. Same quote also has `begining`. Vision must confirm. |
| `WAL-CLM-EPIGEN-000298` | `myo-\|inositol` | **keep the hyphen** — `myo-inositol` is the standard form. Sits beside `cyclohexanehexol`, `phytic`. |
| `WAL-CLM-EPIGEN-000356` | `eosinophilia-\|myalgia` | **keep the hyphen** — `eosinophilia-myalgia syndrome` is the standard form. |

## One JOIN I would hold on style, not safety
`WAL-CLM-LETS-000517` `by-|products` → *byproducts*. Both spellings are valid and `byproducts` is in
the dictionary, so the rule joins it — but `by-products` is the conventional form. Flagged rather
than silently applied; no machine rule distinguishes this class.

## Pipeline when Luneth greenlights (BLUEPRINT §4, order matters)
1. Apply the joins to each book `.txt` **scoped to the front-facing spans only** (mandate §0 — not
   the whole book) via `safe_write`, LF payloads, with a per-claim before/after record.
2. `corpus_resnap.py --book <book> --write` — relocates offsets + re-quotes verbatims.
   **Resnap the shard, sync each draft's claims from the corrected shard, THEN seal** (next-chunk
   trap #1) or the draft-offset guard blocks the seal.
3. **Luneth runs `corpus_seal.py`** (user-only). The book `content_sha256` changes inside the seal;
   that is expected.
4. `build_embeds.py` → `tools/build.mjs` → board green → render probe → build-log → Creator's Log.

**The board goes RED between step 1 and step 3** (the book hash stops matching its seal). That is why
this is staged as one reviewed batch rather than applied piecemeal — and why nothing was applied
without him present to seal.

## Artifacts
- `hyphen_plan.json` / `hyphen_apply.json` (session scratchpad) — every occurrence with its verdict,
  reason, and context.
- Tooling: `temporary/frontface-ocr-tools/` (`prescan.py`, `pdf_locate.py`, `render_page.py`,
  `render_crop.py`, `crop_png.py`).

---

# APPLIED 2026-08-02 — awaiting Luneth's seal

**155 edit sites written · 77 claim verbatims changed · 158 joins visible in the diff**
(158 occurrences → 155 physical sites; 3 passages are each quoted by two claims. `by-products` held
per Luneth. Full per-claim audit: `phase1a-diff.txt`.)

| book | sites | resnap |
|---|--:|---|
| rare-earths | 106 | 327 relocated · 53 healed · **0 broken** |
| lets-play-doctor | 48 | 488 relocated · 23 healed · **0 broken** |
| epigenetics | 1 | 328 relocated · 1 healed · **0 broken** |

Healed totals (1+23+53 = 77) match the independently-computed "155 sites across 77 quotes" exactly.

## ★ A silent data-loss defect was found in `corpus_resnap` and fixed before sealing
The first resnap trimmed **69 of the 77** healed verbatims. `relocate()`'s HEAL path anchors on the
letters-only skeleton and spanned first-alphanumeric..last-alphanumeric, so a verbatim's leading or
trailing NON-alphanumeric run fell outside the anchor: 68 lost a closing `.` / `"` / `)` and
`WAL-CLM-RARE-000342` lost all four of its `!!!!`. Four also gained a stray leading letter.

**Nothing would have caught it.** The trimmed text is still a byte-exact substring of the source, so
`corpus_verify` check #2, check #9 and all 81 gates stay green on a quote that now ends
mid-punctuation in the user's face. My own audit was blind to it too, by construction — it compared
letters, and the lost characters are not letters.

Fixed at the tool, not the 69 symptoms: `relocate()` now re-attaches the ORIGINAL verbatim's own edge
runs, and only where the corrected book text actually still carries them, so it restores the true
span and never invents one. Shipped with `tools/test_corpus_resnap_edges.py` (6 cases: the
load-bearing trailing period, a multi-char `!!!!` run, a leading quote, plus three sparing cases —
an absent edge is not invented, the exact path is untouched, missing text is still BROKEN) and a
negative control proving the test fails against the pre-fix code.

After the fix: **0 trimmed.** The 7 claims whose length delta differs from their join count all
shrank LESS than expected and have identical tails — those are exactly the held KEEP / style cases.

## Verification before handoff
- `corpus_verify`: the ONLY violations are 4 expected `[#7]` golden-hash drifts (books-meta + the 3
  shards). No content violation — every verbatim still resolves in its source at its offset.
- `corpus_seal.draft_offset_failures()`: **0** — drafts synced from the resnapped shards, so
  promotion cannot restore stale offsets.
- **No §00.A exposure:** none of the 77 changed claims backs a numeric dose target (0 overlap with
  the 38 `source_claim_id`s in `essentials-targets-data.json`).
- Board 79/81 — the 2 reds are `corpus_integrity` (the golden drift a seal resolves) and
  `derived_artifacts_fresh` (embeds rebuild after the seal). Both expected and named in advance.

## What Luneth runs

```
PYTHONUTF8=1 python eden/tools/corpus_seal.py
```

Then: `python eden/tools/build_embeds.py` → `node tools/build.mjs` → board back to 81/81 → render
probe → build-log + Creator's Log.

## Still open after this
- The **18 KEEP + 3 REVIEW** hyphens wait for the vision pass, and **the hyphen pass must be re-run
  after vision corrections land** — `pro-|vide` reclassifies to JOIN once `side`→`vide`.
- Every class-(a) OCR defect is untouched by design: `WAL-CLM-LETS-000502` still reads `(1 20 days`.
