# Corpus accuracy audit — 2026-07-17

_Ran unattended overnight per your authorization. **Nothing was purged.** Everything below is staged._

## Read this first: the single number you asked for does not exist yet

I can give you a defensible number, but not the one-line answer the question implies. Here is why,
stated plainly, because burying it would be the disease we are auditing.

**I audited all 1,363 claims, then attacked my own verdicts.** The attack overturned **43.5%** of them.
Two equally-careful passes over the same evidence disagreed on nearly half the flags. When your
instrument disagrees with itself that often, its output is a graded list, not a count.

| what | count | how much I trust it |
|---|---:|---|
| **Purge-class, survived a determined attempt to destroy it** | **29** | **high — purge these** |
| Needs only a closing editorial sentence stripped | 65 | high — keep the claim (ruling 4) |
| Flag fell to the skeptic | 70 | contested — mostly MY error, see below |
| Estimated defects still hiding in the 'clean' pile | ~98 | measured, not guessed (7.8% of 1263) |
| Needs a page image | 6 | backlog |

_(53 flags total survived the skeptic, but 24 of those are EDITORIAL_TAIL or
UNVERIFIABLE verdicts that survived as such — the purge-class survivors are the 29.)_

**The defensible purge set is 29 claims (2.1%).** The first pass said 109. You guessed 300+.
I am not going to pretend the truth is any of those three: the honest reading is that **~29 are proven,
~98 more are probably real but unfound, and ~70 are genuinely arguable.**

## The most important finding is a flaw in MY design, not in the corpus

I scoped every auditor to the claim's own ±3500-char source span — to avoid the whole-book-search
trap that started this whole mess. **That was right for proving a number is Wallach's, and exactly
wrong for proving one isn't.**

An auditor holding a 7,000-character window cannot know the book doesn't say something elsewhere.
Wallach repeats himself constantly across pages and across books. So the first pass produced
confident FABRICATED verdicts that mean only *"not in this window."* The skeptic, given the whole
book, destroyed them. In its own words: **"The first pass mistook window-absence for book-absence."**
**49% of the refutations cite evidence outside the supplied span.**

Concrete, and I reported all three to you as damning before the control ran:

- `DDDL-000114` — *"tuna concentrates mercury"* — **not invented.** Wallach says it himself in the same book.
- `EPIGEN-000017` — the *"1512 Monster of Ravenna"* — **not invented.** Byte-exact in the same chapter,
  a few pages before the anchor. Worse: the first-pass agent *appended its own warning* —
  *"these items may genuinely appear on earlier pages… worth a page check"* — **and my aggregation
  dropped that caveat.** The uncertainty was flagged and I lost it.
- `EPIGEN-000010` — refuted because *"the first pass missed exonerating text it was already holding"*
  — the evidence was inside its own span.

**The asymmetry, for the next session:** proving *"Wallach said X here"* is span-scoped. Proving
*"Wallach never said X"* requires the whole corpus. An absence claim from a window is not evidence.
This is the same blind-instrument lesson that produced the original disaster, inverted — and I built
it into the audit's foundation.

## What survived the attack — these are real

**53 flags** withstood a skeptic explicitly told that overturning them was a win.

- `DDDL-000005` — the source reads *"Sudden Infant Death Syndrome **in animals**"*; our claim renders it
  as the unqualified human term "SIDS". The skeptic discarded the flag's pedantic halves and held
  on this one: an animal finding presented as human.
- `EPIGEN-000089` — the negative control. Caught by every pass, and settled against the photograph.
- `DDDL-000073` — found by a signature nobody had named (below), and dose-consequential.

## The negative control (why the instrument is trustworthy at all)

`WAL-CLM-EPIGEN-000089` was left on disk deliberately. It flagged at **rank 1 of 1363** mechanically,
was caught independently by the text and image passes, survived the skeptic, and I settled its numbers
against the real page `Screenshot (675).png`:

| cell | our claim | **the printed page** |
|---|---:|---:|
| copper | 20 | **2.0** (10×) |
| yurium/yttrium | 40 | **4.0** (10×) |
| lithium | 100 | **10.0** (10×) |
| chlorine | 80 | **8.0** (10×) |
| boron | 0.2 | 0.2 ✓ |

The table lists **53** minerals, not the *"roughly 60"* the claim asserts. Chlorine (8.0) and phosphorus
(12.0) are plain PPM, not the *"gram-per-liter range"*.

I also planted synthetic bugs before trusting anything: a single quiet fabricated number → flagged;
a 10× corruption → flagged; numerals backed by a spelled-out quote (false-positive control) → correctly
clean; a misframing with no numbers → **invisible**, which I asserted *should* flag precisely to force
that blind spot into the open.

## A new signature this audit discovered: the severed quote

A verbatim can be byte-faithful and still lie **by where it stops**. `DDDL-000073`'s quote ends at
*"vitamin E IM at 80 mg per day"*; the source continues *", selenium orally at 250-1,000 mcg per day,
vitamin E 800-1,200 orally, …"*. So our claim binds oral selenium to the wrong range and drops oral
vitamin E, while *"uses X plus Y"* reads as a closed protocol. **Every gate is green** — the bytes ARE
the book's, the offset is right, no number is fabricated.

Detector staged at `severed-quote-candidates.json`. Honest calibration: it fired on 63, I **tightened**
it (not loosened) to 30 with the real case pinned as its control — and then adjudication found **23 of 24
are HARMLESS.** Truncating a long protocol is normal and allowed. Only 1 was real. The detector is a
review aid, not a gate.

## Honest limits

1. **~98 defects are still in the 'clean' pile.** Measured, not guessed: a second opinion on 90
   random CLEAN claims found 7 real defects (7.8%). **29 is a floor.**
2. **CORRUPTED is under-reported by construction.** The agents read the book `.txt` — and the `.txt` **is**
   the corrupted source. A claim faithfully copying a dropped decimal looks CLEAN to every text-only
   reader. I cured this for 44 quantity-heavy claims by reading the real page images; the residual risk
   sits in **lets-play-doctor (56 claims)** and **rare-earths (19)**, which have no imagery.
3. **My mechanical scanner has a bug**: `numbers_absent_from_source_span_too` false-alarms on
   line-wrapped/hyphenated spans (caught on `LETS-000467`: "80" and "1836" are byte-present).
4. **`hunt-011` is contested, not settled.** Its file already existed from the first control pass (all CLEAN);
   my re-run overwrote it *after reading that reasoning*, so those two passes were not independent.
   It flags `RARE-000065` — a **misattribution to a real named person**: Dr. Sidney Wolfe / Public Citizen
   credited with a 600,000 figure that is actually Wallach's own conjecture. One pass says clean, one says
   defect. Worth your eyes given it names a living person and an organization.
5. A green board still means nothing drifted — not that anything is right.

## Blast radius (read BEFORE giving the word)

- **8 authored Search Q&A answers** die with the purge (of **307** enriched claims — the handoff
  said *"only mercury + calcium are enriched"*; that is wrong).
- **conditions**: 42 pages lose ≥1 claim; **4 drop to zero** — Amebiasis, Milk Allergy, Neurosis, Testicular Atrophy
- **essentials**: 22 pages lose ≥1 claim; **0 drop to zero**
- **symptoms**: 0 pages lose ≥1 claim; **0 drop to zero**
- **other-substances**: 33 pages lose ≥1 claim; **7 drop to zero** — Araroba, Burdock, Dermese, English Walnut, Linseed Oil, Lucidril, Wild Strawberry

## What I recommend

1. **Purge the 29 that survived the attack.** Those are proven. The script is staged and dry-run by default.
2. **Strip the 65 editorial tails.** Cheap, saves the claims, exactly your ruling 4.
3. **Do NOT auto-purge the 70 contested ones.** Nearly half were my scoping error. Purging them
   would delete good Wallach content — the opposite of the goal.
4. **Treat this as a process, not a sweep.** The 7.8% false-negative rate says one pass cannot finish this.
   The ~98 unfound defects need a re-run with whole-book scoping for absence claims.

## The gate this audit owes (R7) — the promised design does NOT work

The handoff specified `claim_text_numbers_backed` as *"every number in claim_text must appear in its own
verbatim **OR in its source span**"*. **Measured: it fails.**

| design | fails today | catches 301? | catches 089? |
|---|---:|---|---|
| naive: every number in verbatim | 404 | yes | yes |
| **handoff's: verbatim OR span** | 49 | *by 1 of 25 numbers* | **NO — misses it** |
| **proposed: unit/row-adjacent → own verbatim** | **114** | **43/43** | **42/44** |

089's numbers are ALL in its span — the span **is** the corrupted table it copied. Span-presence is not
evidence. The proposed gate borrows the live `dose_amount_in_verbatim` discriminator: a number that is
**unit-adjacent** (`250 mcg`) or **row-adjacent** (`copper 20`) is a quantity attributed to Wallach and must
appear in the claim's own quote. It spares 376 claims carrying incidental numbers (`90 essential nutrients`,
`chapter 17`). It **cannot go green today** — 114 claims fail. That is the real migration debt. I did not
ship a gate that would redden the board while you slept.

## Also fixed tonight (R7 honesty; board still 76/76)

`.claude/rules/search-corpus.md` was stale **in both directions at once**: it named `facet_in_taxonomy` as a
live gate (**no such invariant has ever existed**) while listing three checks as *"to build"* that
`search_index_wellformed` **already enforces**. Both lines corrected with the measurement and the reason.
Genuinely still WISH: `search_index_fresh`, `render_probe_search`.

## Backlog for you (this is ALL that needs your eyes)

**6 UNVERIFIABLE claims.** You do **not** need to photograph epigenetics / immortality / iaiyh —
their 465 + 254 + 34 page screenshots are already on disk and I read them directly.

| claim | book | where | what to check |
|---|---|---|---|
| `WAL-CLM-LETS-000017` | lets-play-doctor | ch 6, p.46 | Let's Play Doctor (1995), printed page 46, TABLE 6-1 'Nutrient Deficiency / Toxicity Flow  |
| `WAL-CLM-LETS-000019` | lets-play-doctor | ch 6, p.46 | Let's Play Doctor (1995), printed page 46, Table 6-1 NIACIN DEFICIENCY block. Read the exa |
| `WAL-CLM-LETS-000071` | lets-play-doctor | ch 8, p.73 | Let's Play Doctor (1995), printed page 73, FIG. 8-1 'Base Line Nutritional Supplement Prog |
| `WAL-CLM-LETS-000220` | lets-play-doctor | ? | The claim faithfully copies a corrupted vitamin E range. The source prints 'vitamin E at\n |
| `WAL-CLM-RARE-000083` | rare-earths | ch Chapter 11, p.275 | Rare Earths: Forbidden Cures (1994), Chapter 11, printed page 275 — photograph Table 11-2  |
| `WAL-CLM-RARE-000111` | rare-earths | ch Chapter 11, p.291 | Rare Earths: Forbidden Cures (1994), Chapter 11, printed page 292 (the full-page Fig. 11-2 |

Plus the corruption risk with **no imagery**: **lets-play-doctor (56)** and **rare-earths (19)** each assert ≥3
quantities their own quotes don't back. Those are the only books where a camera buys anything.

## Open questions I did NOT decide for you

1. **`IMMORT-000060`** — the page prints *"nitric acid"*; our `.txt` says *"nitric oxide"*. **Our source text
   diverges from the book at the word level**, so `corpus_integrity` is green against a `.txt` that no longer
   matches the page. Logged correction, or silent drift? If the latter, there may be more.
2. **`RARE-000065`** — the contested misattribution to Dr. Sidney Wolfe / Public Citizen (item 4 above).
3. **`EPIGEN-000088`** merges two source tables with different dosing bases (minerals per-100-lb, vitamins
   *not* weight-scaled). I checked the pipeline: **all 13 ×1.54 targets are minerals, all vitamin targets are
   unscaled** — so it is a corpus-prose defect, **not** a live wrong dose.
4. **Ruling 3 (misframed == purge) is the expensive one.** MISFRAMED is where the two passes disagreed most.
   It is a judgment call, not a fact check — which is exactly why it does not reproduce. Consider whether
   misframed should default to *rewrite* rather than *purge*.
5. **The 114-claim gate migration** — schedule it, or leave the gate a labeled WISH?

## Files

| file | what |
|---|---|
| `verdicts-final.jsonl` | every claim, final class, evidence, which passes touched it |
| `verdicts.jsonl` | first-pass verdicts, pre-controls (for diffing) |
| `purge-set.json` / `strip-tail-set.json` / `backlog-set.json` | the actionable sets |
| `phase1.jsonl` | the mechanical scan, all 1363 |
| `severed-quote-candidates.json` | the new signature |
| `<scratchpad>/purge_staged.py` | **dry-run by default**; `--execute` only on your word |

```
python <scratchpad>/purge_staged.py            # dry run (safe, default)
python <scratchpad>/purge_staged.py --execute  # writes drafts + sidecar via safe_write
```
Then: `corpus_verify` → `corpus_seal` → `corpus_embed` → `search_index_derive` → `entity_page_derive`
→ `build.mjs` → `invariants.py`. **No resnap** — a pure delete moves no offsets.