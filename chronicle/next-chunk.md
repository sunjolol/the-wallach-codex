# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-17 03:25 CDT)

> ★★★ THIS FILE + the memory files OVERRIDE ALL OLDER BLUEPRINT / PLAN / DEMO NOTES.
> Board **76/76**. Corpus sealed at **kv=345**, **1336 claims**. **THE PURGE IS DONE. The Epigenetics table is FIXED.**
> Full audit report: `temporary/audit-2026-07-17/REPORT.md`.

---

# ★★★★ DONE: 27 purged, 2 rewritten. NEXT: "we will examine the others" (Luneth)

The overnight audit read all 1363 claims (4 passes, 331 agents, ~30M tokens). Luneth gave the word
2026-07-17 and the purge executed: **1363 → 1336 claims, kv=343 → 344.**

- **27 PURGED.** dddl −5, epigenetics −4, hells-kitchen −1, immortality −5, lets-play-doctor −7, rare-earths −5.
- **2 REWRITTEN, not purged** (his ruling — the defect was fixable framing on correct source):
  - `WAL-CLM-EPIGEN-000089` — **its dose backs the LIVE trace/rare coverage goal** (pdm-coverage-data.json,
    924 mg maintenance) and the dose is CORRECT and in its own verbatim. claim_text 1423 → 381; the
    corrupt table transcription + editorial tail are gone. **Do not purge this claim.**
  - `WAL-CLM-RARE-000065` — misattributed a 600,000 figure to Dr. Sidney Wolfe / Public Citizen when it
    is Wallach's own conjecture. Reattributed. A real living person; attribution matters.
- **8 authored Search Q&A** removed with their claims. **0 purged ids remain** in any corpus artifact or in
  `dist/main.js`; they survive ONLY in `creators-log-embed.json` — exactly his instruction.

## ★★ TWO CATCHES FROM THE PURGE — both would have shipped damage

**1. The blast radius in the audit report was INCOMPLETE.** It enumerated index/Q&A fallout but never
checked the coverage-GOAL artifacts. 089 — the audit's own negative control, a PROVEN-bad claim — is the
`source_claim_id` for the live trace/rare goal. Purging it would have reddened `pdm_goal_wallach_sourced`
(critical) and stripped the Coverage denominator, **to delete a dose that is right.**
→ **Before any future purge: check `pdm-coverage-data.json`, `efa-coverage-data.json`, and
`essentials-targets-data.json` for `source_claim_id`, not just the indices.**

**2. ★ THE VOCABULARY CASCADE — purging a claim can redden a purity gate on a DIFFERENT BOOK.**
`book_source_clean` went RED on dddl (a book untouched) flagging "amebiasis". `book_purity` resolves terms
against english + **CORPUS** + domain, and the corpus vocabulary is **derived from the claims**.
`WAL-CLM-LETS-000133` was the ONLY claim in 7 books carrying that word. Fixed by allowlisting the term with
its justification in `eden/tools/purity-baselines/dddl-3e-2011.json` (a real term the book itself defines;
`entamoeba` was already allowlisted from the same sentence). **Expect this on every future purge.**

---

## ★ ALSO DONE 2026-07-17: the Epigenetics source table is CORRECTED

The OCR's dropped decimals in the colloidal-mineral table (Epigenetics p.818, the corruption behind
089's 10× errors) are **fixed in the sealed book source**. kv=344 → 345.

- `Yurium 40`→**`Yttrium 4.0`** · `Copper 20`→**`2.0`** · `Lithium 100`→**`10.0`** · `Chlorine 80`→**`8.0`**
  · `Boron 02`→**`0.2`** · `Todine o1`→**`Iodine 0.1`**; the five mangled `Igm/L`/`—Agm/L`/`= igm/L`
  cells → `1gm/L`; `Zine`→`Zinc`, `Tron`→`Iron`, `Mineral Cone.`→`Mineral Conc.`; book typos normalized
  to match rare-earths (`Dysrosium`→`Dysprosium`, `Flourine`→`Fluorine`).
- **Independent cross-book confirmation:** my correction (from the Epigenetics photo alone) came out
  **byte-identical on 14/14 rows** to the rare-earths reprint of the same assay, which was corrected
  earlier from ITS own photo. Two books, two photos, one result.
- **The header line is UNTOUCHED and correct** — the page itself prints "Coloidal"; our .txt is
  byte-faithful, and that line is 089's sealed verbatim.
- **The trap did not fire, and was CHECKED:** 0 claims sit after the table, so 0 offsets moved; resnap
  reported 0 relocated / 0 healed / 0 BROKEN; an explicit shard-vs-draft field diff over all 173
  epigenetics claims showed NO DRIFT before sealing.
- **★ HONEST SCOPE:** epigenetics is STILL `raw` in purity-status.json with **3362 unresolved** defects
  (mostly PDF hyphen-wraps). **This fixed ONE TABLE, not the book.** `book_source_clean` only gates
  `pristine` books (iaiyh, dddl), so the green board is honest. Full Epigenetics purification is still
  a separate campaign.

---

## ★ WHAT LUNETH SAID NEXT: "once done we will examine the others"

| set | count | where |
|---|---:|---|
| **Contested** — the skeptic refuted the flag | **70** | `verdicts-final.jsonl`, `passes` field contains `refuted` |
| **Editorial tails** — strip one sentence, keep the claim (ruling 4) | **65** | `strip-tail-set.json` |
| **Est. still unfound** in the "clean" pile | **~98** | measured: 7.8% of 90 CLEAN re-read had a real defect |
| **Backlog** — needs a page image | **6** | `backlog-set.json` |

**★ The ~98 need a RE-RUN WITH WHOLE-BOOK SCOPING** (see the lesson below) — that is the single highest-value
next move on accuracy, because the first pass could not see past its own window.

---

## ★★ THE LESSON THAT COST THE MOST — do not rebuild this mistake

I scoped every auditor to the claim's own **±3500-char span**, to avoid the whole-book-search trap that
caused the original disaster. **That is right for proving a number IS Wallach's, and exactly wrong for
proving one ISN'T.** A 7,000-char window cannot prove a book never says something, and Wallach repeats
himself constantly across pages and books. **49% of refutations found the "invented" text elsewhere in
the same book.** The skeptic's phrase: *"the first pass mistook window-absence for book-absence."*

**THE ASYMMETRY, codify it in your head:**
- *"Wallach said X here"* → **span-scoped**. A whole-book hit proves nothing (any number appears somewhere).
- *"Wallach never said X"* → **whole-corpus, or it is not evidence.**

Claims I reported as damning fabrications and which were **REFUTED**: `DDDL-000114` (tuna/mercury — he
says it himself), `EPIGEN-000017` (the 1512 Monster of Ravenna — byte-exact, same chapter), `EPIGEN-000010`
(the exonerating text was **inside its own span**), `IMMORT-000014` (the 90/16/12/3 framework is printed
twice in that same book). `EPIGEN-000017` stings: the first-pass agent **appended its own warning**
("worth a page check") and the aggregation **dropped the caveat**.

**What SURVIVED the attack (real):** `DDDL-000005` (source reads "Sudden Infant Death Syndrome **in
animals**"; our claim says the unqualified human "SIDS"), `EPIGEN-000089` (the control), `DDDL-000073`.

---

## WHAT LUNETH MUST DECIDE (do not act without his word)

1. ~~Purge the 29~~ **DONE 2026-07-17** — 27 purged, 089 + 065 rewritten on his ruling.
2. **Strip the 65 editorial tails?** Cheap, saves the claims, exactly ruling 4. `strip-tail-set.json`.
3. **`IMMORT-000060`** — the page prints *"nitric acid"*; our `.txt` says *"nitric oxide"*. **Our source text
   diverges from the book at the word level**, so `corpus_integrity` is green against a `.txt` that no longer
   matches the page. Logged correction, or silent drift? **If the latter, there may be more.**
   ★ NOTE the asymmetry vs the Epigenetics fix just landed: normalizing `Flourine`→`Fluorine` is a SPELLING
   fix with an unambiguous referent (precedent-approved). `nitric acid`→`nitric oxide` names a DIFFERENT
   CHEMICAL — that is a factual change to what Wallach said, not a normalization. Do not treat them alike.
4. **`RARE-000065`** — contested misattribution to a **real named person**: Dr. Sidney Wolfe / Public Citizen
   credited with a 600,000 figure that is Wallach's own conjecture. One pass says clean, one says defect,
   and they were **not independent** (the second read the first's reasoning). Names a living person.
5. **Ruling 3 (misframed == purge) is the expensive one.** MISFRAMED is where the two passes disagreed most —
   it is a judgment, not a fact check, which is exactly why it does not reproduce. **Consider defaulting
   misframed to REWRITE rather than PURGE.**
6. **The ~93 unfound defects** need a re-run with **whole-book scoping for absence claims**.
7. **The gate migration** (114 claims) — schedule, or leave the gate a labeled WISH?

---

## ★ CODIFY, DON'T PROMISE (§00.B) — the gate this audit owes

**The handoff's promised design DOES NOT WORK.** `claim_text_numbers_backed` as *"number in verbatim OR
span"*: **misses 089 entirely** (all 25 of its numbers ARE in its span — the span **is** the corrupted table
it copied) and catches `RARE-000301` by exactly **1 of 25** numbers, by luck.

| design | fails today | catches 301 | catches 089 |
|---|---:|---|---|
| naive: every number in verbatim | 404 | yes | yes |
| handoff's: verbatim OR span | 49 | *by 1 of 25* | **NO** |
| **proposed: unit/row-adjacent → own verbatim** | **114** | **43/43** | **42/44** |

Proposed gate borrows the live `dose_amount_in_verbatim` discriminator: a **unit-adjacent** (`250 mcg`) or
**row-adjacent** (`copper 20`) number is a quantity attributed to Wallach and must be in the claim's own
quote. Spares 376 claims with incidental numbers (`90 essential nutrients`, `chapter 17`). **Not shipped** —
114 claims fail today; shipping it would redden the board. Prototype: `tools/gate_proto.py` in the audit dir.

**Also owed:** `corpus_seal` draft/shard offset guard (the resnap trap, hit 3×).

---

## ★★ TOOLING TRAPS — READ BEFORE TOUCHING THE CORPUS

**1. resnap → seal ORDERING. Hit 3× (SESSION 12, SESSION 44, 2026-07-17.)**
`corpus_resnap --write` relocates offsets in the **SHARD + books-meta ONLY — never the draft**. `corpus_seal`
promotes draft → shard, so sealing after a draft edit **clobbers the resnapped offsets**.
**Correct order:** edit .txt → edit draft → `corpus_resnap --book X --write` → **SYNC shard → draft** →
`corpus_seal` → `corpus_embed` → build. A memory did not prevent it — **codify it**.

**2. `safe_write` payloads must be LF.** Books are CRLF on disk; safe_write reads with universal newlines
and writes CRLF on Windows, so stage LF and CRLF is preserved.

**3. ★ CORRECTED 2026-07-17 — drafts are NOT all `indent=1`.** MEASURED by byte-exact round-trip:
**indent=1** → `immortality`, `rare-earths`. **indent=2** → `dddl-3e-2011`, `epigenetics`, `hells-kitchen`,
`iaiyh`, `lets-play-doctor`, and `search-enrichment.json`. The old blanket "drafts are indent=1" would have
**silently reformatted five pillars**. Detect the indent; refuse to write if you cannot reproduce the bytes.

**4. `books-meta.json` field is `content_sha256`, not `sha256`.** Books have no `.golden.sha256` sibling.

**4b. ★ PURGING A CLAIM SHRINKS THE CORPUS VOCABULARY** → `book_purity`'s speller can then flag a real word
in ANY book's .txt → `book_source_clean` RED on a book you never touched. Root-cause it (which purged claim
carried the word?) and allowlist the term WITH its citation; never baseline it blind. Hit 2026-07-17
("amebiasis", from purging `WAL-CLM-LETS-000133`).

**5. Claims live in TWO files.** Sealed shard (`eden/corpus/claims/`, golden-protected) carries
`claim_text`/`verbatim`/`about`/`locator`/`tags`. The sidecar `eden/corpus/search-enrichment.json` (NOT
sealed) carries `subject`/`also_about`/`facet`/`question`/`answer_short`/`topics`. **Edit the DRAFT.**

**6. `mine_batch.py` has NO delete path.** Delete = remove from the draft + seal.

**7. ★ Claim-id prefixes, MEASURED:** `DDDL`→dddl-3e-2011 · `EPIGEN`→epigenetics · **`HELLS`**→hells-kitchen ·
`IAIYH`→iaiyh · `IMMORT`→immortality · `LETS`→lets-play-doctor · `RARE`→rare-earths. (Not "HK".)

**8. Writes inside the repo are hook-blocked for agents** — `pre_write_guard` covers `temporary/` too.
Subagents must write to the OS scratchpad; aggregate into `temporary/` with Python.

**9. A bare `cd subdir` drifts the shared bash cwd** and then every hook fails (`tools/hooks/...` won't
resolve). Use subshells `(cd x && ...)`; recover with PowerShell `Set-Location "<repo root>"`.

---

## ★ CORRECTED FACTS (the old handoff was wrong; each measured)

- **`dose_amount_in_verbatim` and 089:** the old note said *"both had dose: null"*. **FALSE.** 089 **HAS** a
  dose; the gate **CHECKS** it and **PASSES** it (`A/full-multi`) because *"One Ounce/100 pounds/day"* genuinely
  IS in its verbatim. The two known-bads evaded the same gate by **OPPOSITE routes** — 301 skipped
  (`dose: null`), 089 passed. **Tightening the dose gate could never have caught either.**
- **`search-enrichment.json`:** the old note said *"only mercury + calcium are enriched"*. **FALSE — 307
  claims** carry authored enrichment (`subject`/`also_about`/`facet`/`question`/`answer_short`/`topics`).
- **`facet_in_taxonomy` DOES NOT EXIST** — confirmed, and **FIXED** in `.claude/rules/search-corpus.md`
  2026-07-17. The real gate is **`search_index_wellformed`**, which already enforces facet ∈ taxonomy,
  subject/also_about resolve, AND structured-not-blob. The doc was stale in BOTH directions: it named a
  gate that never existed while listing three live checks as "to build". Genuinely still WISH:
  `search_index_fresh`, `render_probe_search`.
- **Page images ARE on disk** for `epigenetics` (465), `immortality` (254), `iaiyh` (34), plus a Hell's
  Kitchen PDF. `locator.screenshot` N → `Screenshot (N).png`. **Crop + upscale (PIL, ×3 LANCZOS) before
  reading — do not eyeball the downscaled render.** Only `lets-play-doctor` (56 risk claims) and
  `rare-earths` (19) genuinely need Luneth's camera.
- **The 33/34/35 count is RESOLVED — do not re-open.** Luneth: *"We are NOT getting into this again."*
  **34** = the operational group (`target.kind`), what Coverage renders. **35** = canon `coverage_kind`,
  which `entity_page_derive.py:264` reads → the group cards also land on **tin** (own 500 mcg dose).
  Known cosmetic defect, DEFERRED by his instruction. Silver (400 mcg) is the parallel case.

---

## ★ THE MINING DOCTRINE (Luneth, 2026-07-17 — supersedes page-by-page)
**Page-by-page mining is RETIRED.** Mine **AS-NEEDED, per element / per condition**, while noting every
unknown against literal page screenshots, with a **manual pass from Luneth** — *"these books are PEPPERED
with errors which is why a manual review process is required."*
**Never guess. Never guess silently.** His grievance, verbatim: the old process *"would literally just make
guesses WITHOUT EVEN TELLING ME it was guessing."*
→ `.claude/rules/mining-veins.md` still describes the vein/page model and **must be rewritten** to this
doctrine. It currently contradicts the ruling above.

---

## PARKED — do NOT start until the audit decisions land

**The plant-derived group expansion (5 → 20 claims).** Research preserved at
`temporary/plant-derived-research-2026-07-17/` (26 files, ~2.8M tokens, every quote byte-verified).
★★ One of its 11 ACCEPTs — `WAL-CLM-EPIGEN-000089` — was **PROVEN BAD** and has been **REWRITTEN**
(2026-07-17): its corrupt table transcription is gone (page image: copper 2.0 not 20, yurium 4.0 not 40,
lithium 10.0 not 100, chlorine 8.0 not 80; 53 minerals not "roughly 60"). Its DOSE was always correct and
now backs the trace/rare coverage goal. **Re-validate every remaining draft against `verdicts-final.jsonl`
before landing any** — the disease was inside the vetted slate.

**Regimen + Scanner rebuilds** — `chronicle/coverage-regimen-scanner-blueprint.md` signed off;
`views/regimen.ts` + `views/scanner.ts` still burn.

**Phase 2 lineage topics — DEAD.** Luneth 2026-07-17: *"We're skipping the phase 2 thing and forgetting
about it, the hover hints are enough."* Do not resurrect.

---

## ★★ THE PATTERN THAT KEEPS FAILING (read before writing ANY prose)
Session A: invented 1,500-char summary essays, then reached for a length TEMPLATE to game the fix.
Session B: called Mineral Toddy *"his most famous product"*; framed the Eagle termination without its
vindication. Session C: found the same disease **in the sealed corpus** — numbers invented over unreadable
cells. **Tonight: the audit built to catch it made the same class of error itself** — asserting absence from
a window it could not see past, and reporting it with confidence.

**It is one failure mode: producing a confident claim whose evidence does not actually cover it** — and
filling the gap with invention instead of READING MORE SOURCE.

**When you cannot read something, or cannot see far enough to know: SAY SO.** That is the whole lesson.

Memories: [[span-presence-is-not-evidence]], [[the-corrupted-blind-spot]], [[page-images-exist-for-three-books]],
[[draft-indent-varies-per-book]], [[outside-knowledge-injected-as-wallach]], [[severed-quote-signature]],
[[negative-control-or-it-proves-nothing]], [[the-instrument-lies-before-the-eye]],
[[null-result-needs-a-scope-check]], [[prove-completion-dont-narrate-it]], [[say-unreadable-never-guess]].
