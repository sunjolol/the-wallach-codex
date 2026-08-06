# ★ STATE ✓measured at close 2026-08-06

- **Corpus SEALED at knowledge_version=466**, 2250 claims (count UNCHANGED — nothing deleted this
  session), `corpus_verify` PASS, 7 book hashes match.
- **Board 89/89, 0 failed.** 23 external / 24 consistency / 40 structural / 2 meta. Green means
  NOTHING DRIFTED — only the 23 external gates can catch a value that is wrong but self-consistent.
- `node tools/build.mjs` exits 0; `render_probe_knowledge`, `render_probe_entity`,
  `render_probe_knowledge_filter` PASS with 0 page errors.
- Drafts and sealed shards are IN SYNC — nothing pending a seal.
- ⚠ **`render_probe_search` FAILS** on `calcium shows its full claim set (146)`. **PROVEN
  PRE-EXISTING**, not caused by this session: the whole working tree was stashed, rebuilt at HEAD,
  the probe failed identically, then restored. The probe hardcodes `146` while calcium reports 144;
  calcium's claim set is unchanged (113 at HEAD and now). Undiagnosed — its own job.

# ✔ TASK #5 — THE UN-SAVEABLE LIST — **DONE. ZERO CLAIMS REQUIRED DELETION.**

Swept all 2250 claims for other superseded dose ceilings after the 2026-08-05 vitamin D deletions.

**The result.** Exactly **one** claim still carried the deleted 400 IU ceiling, and it did not need
deleting. Two other numeric candidates dissolved on reading: `IMMORT-000071` is a deficiency
**floor** ("less than 500 mg of calcium"), and `IMMORT-000010` attributes its 15 mcg selenium limit
to **Pauling** and refutes it in the same sentence.

**Why the list is structurally tiny — checkable, not a hunch.** Nearly every 1995 → 2014 target
moved **down** (molybdenum 500 → 10-25 mcg, vanadium 500 → 50-100, iron 45 → 15-30, iodine 250 →
50-150, vitamin E 400 → 100-200). **Vitamin D is the only essential whose number rose sharply**
(275 → 1,000-2,000). An old ceiling can only contradict a new target where the target went UP, so
vitamin D was the only place this could happen.

**What shipped**
- `WAL-CLM-LETS-000295` (heart disease, 1995) — the direct twin of the deleted `DDDL-000171`.
  **Prose trimmed** to what its verbatim actually quotes; the 400 IU ceiling, the selenium 500 mcg
  and the vitamin E 800-1,200 IU were never in its quote. `essentials` dropped omega-3. Verbatim and
  char_offset untouched. Enrichment question/answer_short/also_about/topics matched to the new prose.
  ⚠ **Subject deliberately left `cardiovascular_disease`** — it is the ONLY enriched claim for that
  condition and its only `protocol` entry; re-subjecting it would have left heart disease with zero
  questions and **no gate would have fired** (the folate lesson).
- `WAL-CLM-LETS-000139` (angina) — **verbatim WIDENED** 192 → 1,162 chars over the full ANGINA
  entry. Over soft-500, allowed, flagged for spot-check.
- `WAL-CLM-LETS-000390` (Paget's) — **KEPT**. "reduce vitamin D intake and exposure" is byte-exact in
  its verbatim, condition-scoped, numberless, and the claim carries Wallach's mechanism.

# ★ THE REVERSAL — read this before trusting a "prose overreach" diagnosis

139 was presented to Luneth as the same prose-overreach defect as 295, and **he approved trimming
it**. Reading the book at its char_offset then showed the **entire ANGINA entry sitting immediately
before the quoted slice** — the prose was faithful and the **verbatim was too narrow**. Trimming
would have destroyed real content (chelation over bypass, calcium 2,000 mg, magnesium 800 mg, EFA,
hawthorn) to remove a numberless sentence being kept in `LETS-000390` anyway. The approved
instruction was **stopped and re-asked**, and he chose WIDEN.

**The rule this sets: a claim whose prose exceeds its verbatim has TWO possible causes — invented
prose, or a slice drawn too small. Read the book at the offset before deciding which.** They need
opposite fixes.

# ⚠ THE REAL DEFECT CLASS THIS SWEEP SURFACED — not fixed, needs his call

**At least 86 claims state a figure in `claim_text` that does not appear in their own `verbatim`**,
31 of them `protocol`. `dose_amount_in_verbatim` guards only the structured `dose` field;
`prose_contained` only catches prose in **fact** fields. **Nothing guards a number asserted in prose.**

⚠ **86 is a FLOOR with a known false-negative mode** — the counter tolerates b.i.d. halving, so
`LETS-000295`'s own unsupported "400" matched the "200" inside "75-200 mg" and was wrongly cleared.
The true number is higher by an unmeasured amount.

**No gate was written on purpose.** The rule needs Luneth's ruling on what counts as legitimate
restatement versus overreach; inventing it unilaterally would be a WISH dressed as a gate.

# ⚠ COVERAGE HOLE — named, not hidden

With `DDDL-000171` deleted (2026-08-05) and `LETS-000295` trimmed, **the corpus now has no
heart-disease PREVENTION protocol** — only post-heart-attack treatment.

# ✔ TOOL FIXES THIS SESSION

- **`eden/tools/vb_apply.py` had `indent=2` hardcoded** while the draft is `indent=1`. One verbatim
  edit would have re-spaced all 510 claims and `corpus_seal` would have promoted the reformat onto
  the golden shard. **This is the identical failure fixed in `mine_batch.py` and `corpus_extract.py`
  on 2026-08-05 — this tool was missed.** Now measures BEFORE mutating (afterwards the original
  bytes cannot be reproduced) and refuses rather than guessing. Sealed-shard diff came out at
  **3 insertions / 4 deletions** instead of ~40,000 lines.
- ⚠ **The per-book indent list in memory was wrong AGAIN, in a third direction.** Measured
  2026-08-06: `lets-play-doctor` is **indent=1**, not the sole indent=2. `hells-kitchen`, `iaiyh`
  and `rare-earths` reproduce at **no** indent 1-4 — they are indent=1 with **CRLF** while the check
  compares LF-joined output. **Both sanctioned edit tools will now REFUSE to write those three.**
  Fail-safe and correct, but it means those books are currently un-editable via the sanctioned path.
- **`tools/claim_review.py` gained `--draft`.** It read only sealed shards, so it could not show
  Luneth unsealed work — yet review is meant to happen BEFORE the seal, which is his act.
  Negative-controlled: the default path still renders sealed text.

# TRAPS — unchanged, plus what bit this session

1. `corpus_seal` / `catalog_seal` are **USER-ONLY**. Ask every time. **Two seals this session, each
   authorised separately** — the first authorisation explicitly did NOT carry to the second, which
   promoted a book-source change and 353 relocations beyond its scope.
2. **A gate can go red BECAUSE OF a correction.** `frontface_verbatims_clean` did exactly that here:
   the widened 139 verbatim now spans five OCR line-wraps the 192-char slice was too small to
   contain. Ask what was making it pass before — the answer was "the quote was too small to contain
   the defect".
3. **safe_write matching is byte-exact.** `claim_review.py` is CRLF while the Write tool stages LF;
   a `printf`-staged payload also turned `\\n` into a real newline and failed to match. Stage with
   the Write tool and convert endings deliberately.
4. **A round-trip control before any JSON edit.** `search-enrichment.json` (indent=1) passed here
   because it was checked first.
5. **The first-run onboarding modal covers the page.** DOM probes read through it and pass while the
   screenshot is worthless. Dismiss "I'm just browsing" before any visual capture.
6. **A sticky search bar sits over whatever lands at the top of the scroll box.**
7. **The book files are CRLF while stored `char_offset`s are in LF-translated space.** A source edit
   must match raw `-\r\n` and preserve CRLF, or every offset after it shifts wrongly.

# ⚠ OPEN — tracked

- **#7 47 same-span claim groups** — 16 legitimate multi-row table mining, 31 share span AND
  essentials, 18 of those also share `kind` (likeliest true duplicates). `no_duplicate_claims`
  misses them because it only compares within a subject+facet pair. READ each before deleting; merge
  good prose first as was done for selenium.
- **The 86+ prose-overreach claims** (above) — needs his ruling before any gate.
- **`render_probe_search`** — pre-existing failure, undiagnosed.
- **#6 the search port** — DONE for the Conditions tab. The Home `.kh-search` suggest dropdown has a
  SEPARATE, unfixed defect: `byRelevance` sorts alphabetically and ignores claim count. **He has NOT
  asked for this to be fixed. Do not raise it unprompted.**
- `protocol`'s 425 claims are phase 2, unstarted. The 119-claim dose + contraindication grind is
  COMPLETE.
- Vitamin A `EPIGEN-000110`/`000111` show the rival-answer shape on one page.
- `LETS-000076` (vitamin K) still explains its table's columns instead of naming his figure.

# ★ DOCTRINE — carried forward from 2026-08-05, still binding

1. **Cross-book relation is allowed ONLY where two rival dosing claims already render together.**
   Everywhere else (headers, why-lines, panels) the ban stands.
2. **Supersession is not correction.** The older figure may have been right for its era. ⚠ That
   changed-conditions reading is an **ASSUMPTION, not a fact**, and must never be written as
   Wallach's stated reason — he never says "therefore I raise my number."
3. **When an instruction is one sentence, implement one sentence.** Do not re-diagnose a symptom the
   user has already explained. Do not mock up a change to a mechanism you have not yet located.
   (From the 2026-08-05 session close, which ended on anger over exactly this.)
