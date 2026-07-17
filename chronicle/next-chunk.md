# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-17 02:50 CDT)

> ★★★ THIS FILE + the memory files OVERRIDE ALL OLDER BLUEPRINT / PLAN / DEMO NOTES.
> Board **76/76**. Corpus sealed at **kv=343**, **1363 claims**. **NOTHING WAS PURGED** — the audit staged only.
>
> **THE AUDIT IS DONE. Luneth's decision is the gate.** Full report: `temporary/audit-2026-07-17/REPORT.md`.
> Read it before touching the corpus.

---

# ★★★★ THE ANSWER: 29 proven bad — NOT 300+, and NOT a single number

Luneth authorized a full corpus accuracy audit to run overnight, unattended, 2026-07-17. It ran.
All **1363/1363** claims audited, 0 missing, 0 malformed. Four passes, 331 agents, ~30M tokens.
All evidence: `temporary/audit-2026-07-17/` (gitignored, 5.5 MB).

| | count | trust |
|---|---:|---|
| **Survived a determined attempt to destroy it** | **29** | **high — purge these** |
| Needs only a closing editorial sentence stripped | **65** | high — keep the claim (ruling 4) |
| Flag fell to the skeptic | **70** | contested — mostly a design error of MINE |
| Est. defects still hiding in the "clean" pile | **~93** | measured (7.8% of 1263), not guessed |
| Needs a page image | **6** | backlog |

**The single number does not exist.** The first pass said 109; a skeptic pass overturned **43.5%** of its
flags. When the instrument disagrees with itself that often, the output is a graded list, not a count.
**29 is a FLOOR** (the hunt pass found defects in 7 of 90 "clean" claims).

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

1. **Purge the 29?** Script staged, **dry-run by default**: `temporary/audit-2026-07-17/tools/purge_staged.py`
   (`--execute` writes drafts + the enrichment sidecar via safe_write). Then the deliberate steps:
   `corpus_verify` → `corpus_seal` → `corpus_embed` → `search_index_derive` → `entity_page_derive` →
   `build.mjs` → `invariants.py`. **NO resnap** — a pure delete moves no offsets.
   Blast radius: **8 authored Search Q&A** die; pages dropping to zero are enumerated in REPORT.md.
2. **Strip the 65 editorial tails?** Cheap, saves the claims, exactly ruling 4. `strip-tail-set.json`.
3. **`IMMORT-000060`** — the page prints *"nitric acid"*; our `.txt` says *"nitric oxide"*. **Our source text
   diverges from the book at the word level**, so `corpus_integrity` is green against a `.txt` that no longer
   matches the page. Logged correction, or silent drift? **If the latter, there may be more.**
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
★★ One of its 11 ACCEPTs — `WAL-CLM-EPIGEN-000089` — is **PROVEN BAD** (page image: copper 2.0 not 20,
yurium 4.0 not 40, lithium 10.0 not 100, chlorine 8.0 not 80; 53 minerals not "roughly 60"). **Re-validate
every draft against `verdicts-final.jsonl` before landing any.**

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
