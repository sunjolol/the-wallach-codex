# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-17 04:10 CDT)

> ★★★ THIS FILE + the memory files OVERRIDE ALL OLDER BLUEPRINT / PLAN / DEMO NOTES.
> Board **76/76**. Corpus sealed at **kv=345**, **1336 claims**. Working tree clean, pushed.
> The overnight audit + purge + source-fix are DONE. **This session's job is "the others."**

---

# ★★★★ THE JOB: examine "the others" (Luneth, 2026-07-17)

His words on closing the purge: *"once done we will examine the others."* Four sets remain, all
staged with evidence at `temporary/audit-2026-07-17/` (gitignored, 5.5 MB). **Read
`REPORT.md` there first** — it is the full audit writeup.

| # | set | count | where | what it needs |
|---|---|---:|---|---|
| 1 | **Est. still-unfound defects** | **~98** | not identified yet | a **re-run with whole-book scoping** — the highest-value move |
| 2 | **Contested** (skeptic refuted the flag) | **70** | `verdicts-final.jsonl`, `passes` contains `refuted` | adjudication: was the refutation right? |
| 3 | **Editorial tails** (strip 1 sentence, keep the claim) | **65** | `strip-tail-set.json` | mechanical-ish; ruling 4 |
| 4 | **Backlog** (needs a page image) | **6** | `backlog-set.json` | his eyes, or our screenshots |
| + | **`IMMORT-000060`** | 1 | below | his ruling — a factual `.txt` divergence |

## ★ Recommended order + why

**1. The ~98 first.** They are the only set that is *unknown*, and the audit proved the first pass
could not see them: a 7.8% false-negative rate measured on 90 re-read CLEAN claims. **Do NOT just
re-run the old pass** — it had a design flaw (below). Redesign, then run.

**2. The 65 tails next.** Cheap, safe, high yield: they SAVE good claims by removing one editorial
sentence each. Ruling 4 already covers them, so no new decision is needed — but each strip is prose
Luneth may want to eyeball.

**3. The 70 contested last, with him.** These are genuine judgment calls where two careful passes
disagreed. Do not auto-resolve them; that is exactly the over-flagging the skeptic pass exists to stop.

---

## ★★ THE DESIGN FLAW TO FIX BEFORE RE-RUNNING ANYTHING

The audit scoped every auditor to the claim's own **±3500-char span** — right for proving a number IS
Wallach's, **exactly wrong for proving one ISN'T**. A 7,000-char window cannot prove a 1.5MB book never
says something, and Wallach repeats himself constantly across pages and books. A skeptic pass with the
whole book **overturned 43.5% of the flags**; 49% of refutations cited evidence outside the span.
Its phrase: *"the first pass mistook window-absence for book-absence."*

**THE ASYMMETRY — build the next pass on this:**
- *"Wallach said X here"* → **span-scoped**. A whole-book hit proves nothing (any number appears somewhere).
- *"Wallach never said X"* → **whole-corpus search, or it is not evidence.** Say UNVERIFIED instead.
- A **presence/mismatch** claim ("the page prints 2.0 where we say 20") is strong. An **absence** claim
  from one window or one page is weak — **the image pass fell into this too**, "confirming"
  `IMMORT-000014` was fabricated because page 84 lacked the framework Wallach prints twice elsewhere.

Also fix, before re-running: `phase1.jsonl`'s `numbers_absent_from_source_span_too` **false-alarms on
line-wrapped/hyphenated spans** (caught on `LETS-000467`: "80" and "1836" are byte-present).

★ And carry the caveat: on `EPIGEN-000017` the first-pass agent **appended its own warning** ("worth a
page check") and **the aggregation dropped it.** Preserve agent uncertainty through aggregation.

Memory: [[span-presence-is-not-evidence]] carries this in full.

---

## ★ WHAT LANDED 2026-07-17 (do not redo)

- **Audit:** all 1363 claims read. 4 passes, 331 agents, ~30M tokens. 0 missing, 0 malformed.
- **Purge:** 27 deleted. `1363 → 1336`, kv 343 → 344. 8 authored Search Q&A went with them.
  0 purged ids remain in any corpus artifact or `dist/main.js`; they survive ONLY in
  `creators-log-embed.json` — exactly his instruction.
- **2 REWRITTEN, not purged** (his ruling — fixable framing on correct source). **Do not purge these:**
  - `WAL-CLM-EPIGEN-000089` — its dose backs the **LIVE trace/rare coverage goal**
    (`pdm-coverage-data.json`, 924 mg) and is correct + in its own verbatim. claim_text 1423 → 381.
  - `WAL-CLM-RARE-000065` — misattributed a 600,000 figure to Dr. Sidney Wolfe / Public Citizen when it
    is Wallach's own conjecture. Reattributed. A real living person.
- **Epigenetics source table FIXED** (kv 344 → 345): the OCR's dropped decimals are gone —
  `Yurium 40`→`Yttrium 4.0`, `Copper 20`→`2.0`, `Lithium 100`→`10.0`, `Chlorine 80`→`8.0`,
  `Boron 02`→`0.2`, `Todine o1`→`Iodine 0.1`; five mangled `Igm/L` cells → `1gm/L`; `Zine`→`Zinc`,
  `Tron`→`Iron`. **Cross-book confirmed: byte-identical on 14/14 rows to the rare-earths reprint of the
  same assay, corrected from a SEPARATE photo.**
- **Docs:** `.claude/rules/search-corpus.md` R7 fix — it named `facet_in_taxonomy` (**never existed**) as
  live while listing three checks as "to build" that `search_index_wellformed` already enforces.

---

## ★ CODIFY, DON'T PROMISE (§00.B) — the gate this audit owes

**The previously-promised design DOES NOT WORK.** `claim_text_numbers_backed` as *"number in verbatim OR
span"*: **misses 089 entirely** (all 25 of its numbers ARE in its span — the span **is** the corrupted
table it copied) and catches `RARE-000301` by exactly **1 of 25** numbers, by luck.

| design | fails today | catches 301 | catches 089 |
|---|---:|---|---|
| naive: every number in verbatim | 404 | yes | yes |
| old promise: verbatim OR span | 49 | *by 1 of 25* | **NO** |
| **proposed: unit/row-adjacent → own verbatim** | **114** | **43/43** | **42/44** |

Proposed gate borrows the live `dose_amount_in_verbatim` discriminator: a **unit-adjacent** (`250 mcg`) or
**row-adjacent** (`copper 20`) number is a quantity attributed to Wallach and must appear in the claim's own
quote. Spares 376 claims carrying incidental numbers (`90 essential nutrients`, `chapter 17`).
**Not shipped** — 114 claims fail today; that is the real migration debt and Luneth's call to schedule.
Prototype + measurements: `temporary/audit-2026-07-17/tools/gate_proto.py`.

**Also owed:** a `corpus_seal` draft/shard offset guard (the resnap trap, hit 3×).

---

## ★★ TOOLING TRAPS — READ BEFORE TOUCHING THE CORPUS

**1. resnap → seal ORDERING. Hit 3× (SESSION 12, SESSION 44, 2026-07-17 earlier).**
`corpus_resnap --write` relocates offsets in the **SHARD + books-meta ONLY — never the draft**.
`corpus_seal` promotes draft → shard, so sealing after a draft edit **clobbers the resnapped offsets**.
**Correct order:** edit .txt → edit draft → `corpus_resnap --book X --write` → **SYNC shard → draft** →
`corpus_seal` → `corpus_embed` → build. ★ 2026-07-17: it did NOT fire, because an explicit field-by-field
shard-vs-draft diff was run before sealing and 0 offsets had moved. **Run that diff every time.**

**2. `safe_write` payloads must be LF.** Books are CRLF on disk; safe_write reads with universal newlines
and writes CRLF on Windows, so stage LF and CRLF is preserved (verified: 32,106 pairs before AND after).

**3. ★ Drafts are NOT all `indent=1`.** MEASURED: **indent=1** → `immortality`, `rare-earths`. **indent=2** →
`dddl-3e-2011`, `epigenetics`, `hells-kitchen`, `iaiyh`, `lets-play-doctor`, and `search-enrichment.json`.
Detect by byte-exact round-trip; **refuse to write** if you cannot reproduce the original bytes.

**4. `books-meta.json` field is `content_sha256`, not `sha256`.** Books have no `.golden.sha256` sibling.

**4b. ★ PURGING A CLAIM SHRINKS THE CORPUS VOCABULARY** → `book_purity`'s speller can then flag a real word
in ANY book's .txt → `book_source_clean` RED on a book you never touched. Root-cause it (which purged claim
carried the word?) and allowlist the term WITH its citation; never baseline it blind. Hit 2026-07-17
("amebiasis", from purging `WAL-CLM-LETS-000133`).

**5. Claims live in TWO files.** Sealed shard (`eden/corpus/claims/`, golden-protected) carries
`claim_text`/`verbatim`/`about`/`locator`/`tags`. The sidecar `eden/corpus/search-enrichment.json` (NOT
sealed) carries `subject`/`also_about`/`facet`/`question`/`answer_short`/`topics` — **307 claims** are
enriched (not "mercury + calcium"). **Edit the DRAFT.**

**6. `mine_batch.py` has NO delete path.** Delete = remove from the draft + seal.

**7. Claim-id prefixes, MEASURED:** `DDDL` · `EPIGEN` · **`HELLS`** · `IAIYH` · `IMMORT` · `LETS` · `RARE`.
(Not "HK".)

**8. Writes inside the repo are hook-blocked for agents** — `pre_write_guard` covers `temporary/` too.
Subagents must write to the OS scratchpad; aggregate into `temporary/` with Python.
★ A **Python heredoc** (`pathlib.write_text`) also bypasses `safe_write` and `pre_bash_guard` does NOT catch
it. Route project-file writes through `safe_write` even from Python.

**9. A bare `cd subdir` drifts the shared bash cwd** and then every hook fails (`tools/hooks/...` won't
resolve). Use subshells `(cd x && ...)`; recover with PowerShell `Set-Location "<repo root>"`.

**10. `corpus_seal` is USER-ONLY** — its docstring requires **explicit per-invocation approval**. Sealing is
the human's act of ratifying canon. Stage + dry-run, then ask.

---

## ★ OPEN QUESTIONS FOR LUNETH

1. **`IMMORT-000060`** — the page prints *"nitric acid"*; our `.txt` says *"nitric oxide"*. **Our source text
   diverges from the book at the word level**, so `corpus_integrity` is green against a `.txt` that no longer
   matches the page. Logged correction, or silent drift? **If the latter, there may be more.**
   ★ NOTE the asymmetry vs the Epigenetics fix that landed: `Flourine`→`Fluorine` is a SPELLING fix with an
   unambiguous referent (precedent-approved). `nitric acid`→`nitric oxide` names a **different chemical** —
   a factual change to what Wallach said, not a normalization. **Do not treat them alike.**
2. **Ruling 3 (misframed == purge) is the expensive one.** MISFRAMED is where the two passes disagreed most —
   it is a judgment, not a fact check, which is exactly why it does not reproduce. **Consider defaulting
   misframed to REWRITE rather than PURGE** — both rewrites tonight (089, 065) preserved good Wallach source
   that a purge would have destroyed.
3. **The 114-claim gate migration** — schedule it, or leave the gate a labeled WISH?
4. **`EPIGEN-000088`** merges two source tables with different dosing bases (minerals per-100-lb, vitamins
   *not* weight-scaled). Checked: the derive pipeline is CORRECT (all 13 ×1.54 targets are minerals, all
   vitamin targets unscaled) — so it is a corpus-prose defect, **not** a live wrong dose.
5. **`EPIGEN-000106`** — its quote is severed exactly where the source continues *"and congenital
   homosexuality…"*. That severance may be **correct** per the charged-content policy. Left alone.

---

## ★ THE MINING DOCTRINE (Luneth, 2026-07-17 — supersedes page-by-page)
**Page-by-page mining is RETIRED.** Mine **AS-NEEDED, per element / per condition**, noting every unknown
against literal page screenshots, with a **manual pass from Luneth** — *"these books are PEPPERED with errors
which is why a manual review process is required."*
**Never guess. Never guess silently.** His grievance, verbatim: the old process *"would literally just make
guesses WITHOUT EVEN TELLING ME it was guessing."*
→ `.claude/rules/mining-veins.md` still describes the vein/page model and **must be rewritten** to this
doctrine. It currently contradicts the ruling above.

---

## ★ PAGE IMAGES ARE ON DISK — resolve it yourself before backlogging him
`epigenetics` (465 shots) · `immortality` (254, + `temporary/immortality-ocr/manifest.json` maps page →
`source_png`) · `iaiyh` (34) · Hell's Kitchen (full PDF at `temporary/hk/`).
`locator.screenshot` N → `Screenshot (N).png`. **Crop + upscale (PIL, ×3–5 LANCZOS) before reading — do not
eyeball the downscaled render.** Only `lets-play-doctor` (56 risk claims) and `rare-earths` (19) genuinely
need his camera.

---

## PARKED — do NOT start until the audit decisions land

**The plant-derived group expansion (5 → 20 claims).** Research at
`temporary/plant-derived-research-2026-07-17/` (26 files, ~2.8M tokens, every quote byte-verified).
★★ One of its 11 ACCEPTs — `WAL-CLM-EPIGEN-000089` — was PROVEN BAD and has been **REWRITTEN**; its source
page (the colloidal-mineral table) is now **fixed in the .txt**. **Re-validate every remaining draft against
`verdicts-final.jsonl` before landing any** — the disease was inside the vetted slate.
★ Epigenetics is still `raw` in `purity-status.json` with **3362 unresolved** defects (mostly PDF
hyphen-wraps). One table was fixed, **not the book**. Full purification is a separate campaign.

**Regimen + Scanner rebuilds** — `chronicle/coverage-regimen-scanner-blueprint.md` signed off;
`views/regimen.ts` + `views/scanner.ts` still burn.

**Phase 2 lineage topics — DEAD.** Luneth 2026-07-17: *"We're skipping the phase 2 thing and forgetting
about it, the hover hints are enough."* Do not resurrect.

---

## ★★ THE PATTERN THAT KEEPS FAILING (read before writing ANY prose)
Session A: invented 1,500-char summary essays, then reached for a length TEMPLATE to game the fix.
Session B: called Mineral Toddy *"his most famous product"*; framed the Eagle termination without its
vindication. Session C: found the same disease **in the sealed corpus** — numbers invented over unreadable
cells. **2026-07-17: the audit built to catch it made the same class of error itself** — asserting absence
from a window it could not see past, and reporting it with confidence. Four "damning fabrications" were
reported to Luneth mid-session and later refuted.

**It is one failure mode: producing a confident claim whose evidence does not actually cover it** — and
filling the gap with invention instead of READING MORE SOURCE.

**When you cannot read something, or cannot see far enough to know: SAY SO.** That is the whole lesson.

Memories: [[span-presence-is-not-evidence]], [[the-corrupted-blind-spot]], [[page-images-exist-for-three-books]],
[[draft-indent-varies-per-book]], [[outside-knowledge-injected-as-wallach]], [[severed-quote-signature]],
[[negative-control-or-it-proves-nothing]], [[the-instrument-lies-before-the-eye]],
[[null-result-needs-a-scope-check]], [[prove-completion-dont-narrate-it]], [[say-unreadable-never-guess]],
[[editing-sealed-corpus-claims]], [[verify-against-source-images]].
