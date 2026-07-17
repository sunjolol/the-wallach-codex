# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-17 ~12:35 CDT, session close)

> ★★★ THIS FILE + the memory files OVERRIDE ALL OLDER BLUEPRINT / PLAN / DEMO NOTES.
> Board **76/76**. Corpus sealed at **kv=345**, **1336 claims**. Working tree clean + pushed (last commit `8a3cfdcc`).
> The ~98 sweep is **DONE**. **Next session's job: EXECUTE the 39 adjudicated rulings — SMALL BATCHES, build→test→log, Luneth reviews each. Never automate.**

---

# ★★★★ THE JOB: execute the 39 rulings (small batches, his review every time)

The full ~98 accuracy sweep is complete — **all 1,263 clean claims audited** with the redesigned whole-corpus-aware instrument (clause-level entailment + a skeptic that greps the whole book for absence claims). Luneth reviewed the flagged set and **ruled on all 39 actionable cards.** His rulings + everything needed to execute them without re-running the audit are in:

**`temporary/audit-2026-07-17/handoff-v2/EXECUTION-PACKAGE.json`** — 39 self-contained records: `decision` + `luneth_note` + my recommendation + the `finding` (defect shape / clause / source evidence / why + skeptic) + the claim's current `claim_text` / `verbatim` / source spans / locator. **READ THIS FIRST.**

## The 39 rulings
- **37 rewrite · 1 purge · 1 keep.**
  - **PURGE** — `WAL-CLM-IMMORT-000077` (cadmium): its "toxicity via zinc-displacement" thesis contradicts the source (Wallach presents the substitution as neutral — the enzyme is NOT deactivated). He took the purge option I flagged.
  - **KEEP** — `WAL-CLM-IMMORT-000061` (calcium): he trusted the skeptic (Wallach does grant calcium a structural role elsewhere in the same book).
- **2 touch the SEALED SOURCE (.txt) — extra care + the full purification/reseal process:**
  - `WAL-CLM-LETS-000205` — cartilage dose **`5 mg`→`5 gm`** (mg/gm OCR corruption; the same book doses cartilage at 5 gm three other times; 5 mg is 1000× too low — a safety fix). Edit .txt → resnap → sync → reseal (ordering traps below).
  - `WAL-CLM-LETS-000452` — quote **`vitamin C`→`vitamin A`** at 25,000–300,000 IU as beta carotene. **Luneth CONFIRMED the direction** (his note: *"clearly another book error meant to be Vitamin A"*), so no page image needed — but it edits the sealed verbatim + .txt.
- **Read EVERY `luneth_note` — they are instructions, not commentary.** Examples: IMMORT-000007 restore Wallach's *"mental retardation"* over *"intellectual disability"*; IMMORT-000182/183 strip the *(autoimmune…)* parentheticals; the RARE-000287..298 block = remove the *"the value is completeness / Nth sourced appearance alongside the Epigenetics catalog"* mining-bookkeeping tails (he pasted the exact sentence to remove for each); EPIGEN-000159 keep the celiac correction (his reasoning: the Greeks understood it identically); LETS-000399 fix the quote too if not already.

## ★★ HOW TO EXECUTE — the hard mandate (Luneth 2026-07-17)
**SMALL BATCHES. build→test→log. Bring a few claims at a time for his review and CONTINUE that process — never batch-automate, never "we nailed 3 in a row, let's speed up."** He said plainly he does not trust the agent on this and will not take risks; the human review gate IS the control, and removing it is the violation even if the output looks fine. Claude proposes each fix → Luneth ratifies → THEN apply + seal. `corpus_seal` is user-only. (memory: [[small-batch-build-test-log-mandate]], [[editing-sealed-corpus-claims]])

---

# ★ PARKED (optional, not the job): the 123 worth-a-look
The sweep also surfaced **123 CLEAN-but-worth-a-look** claims — the auditor ruled them clean but noted a doubt. Luneth did NOT rule these (he stopped at the actionable 39). They default to **leave-as-is**. Full detail: `handoff-v2/merged-results.json` (`worth_a_look`). Offer him a pass whenever, no rush.

# ★ THE ADJUDICATION VIEWER
Live artifact: **https://claude.ai/code/artifact/31349afe-da57-4912-8d23-a1783bfa5603** — 162 finding cards, each with a per-card "my call" recommendation, leave-as-is/rewrite/purge buttons + note field, a WORKING export (copy-box; the clipboard/prompt version was sandbox-blocked and silently did nothing — cost Luneth an hour, recovered via a DOM-scrape console snippet), and his 39 rulings **seeded** so a reload restores them. Regenerate with `handoff-v2/tools/mkviewer.py` (inputs: merged-results.json + recommendations.json + rulings.json as `--seed`; `--batches` from mkfull.py which rebuilds the ±3500 payloads from the corpus).

---

# ★ WHAT LANDED THIS SESSION (do not redo)
- **The mining doctrine rewrite** — `.claude/rules/mining-veins.md` retitled + rewritten to the as-needed / never-guess doctrine; blueprint Phase G reconciled; **committed + pushed `8a3cfdcc`.** (Approved by Luneth.)
- **The redesigned ~98 audit** — validated on real ground truth (4/4 on the gold defects the old span-scoped pass missed; the recovered-from-git purged claims were the control), then run over all 1263 clean claims. Two workflows: the first hit the 5-hour usage cap at 75% (24.2M tokens), the lean continuation finished the rest (7.9M). **Result: 10 confirmed defects, 1 contested, 28 editorial tails, 123 worth-a-look.**
- **The scanner false-alarm fix** is BUILT + tested (`handoff-v2/tools/numfix.py`, 20-case test) — fixes the unit-adjacent (`80mg`) + line-wrap (`18-\n36`) bugs. NOT yet wired into the live gate (see below).

# ★ CODIFY, DON'T PROMISE (§00.B) — still owed
- **The `claim_text_numbers_backed` gate** (unit/row-adjacent number → must be in the claim's own verbatim): designed + measured + prototyped (114 claims fail today = the migration debt), NOT shipped. Luneth's call to schedule. `numfix.py` is the corrected number-presence primitive it would build on. Prototype: `temporary/audit-2026-07-17/tools/gate_proto.py`.
- A `corpus_seal` draft/shard offset guard (the resnap trap, hit 3×).

# ★★ TOOLING TRAPS — READ BEFORE TOUCHING THE CORPUS

**1. resnap → seal ORDERING. Hit 3× (SESSION 12, SESSION 44, 2026-07-17 earlier).**
`corpus_resnap --write` relocates offsets in the **SHARD + books-meta ONLY — never the draft**.
`corpus_seal` promotes draft → shard, so sealing after a draft edit **clobbers the resnapped offsets**.
**Correct order:** edit .txt → edit draft → `corpus_resnap --book X --write` → **SYNC shard → draft** →
`corpus_seal` → `corpus_embed` → build. ★ Run an explicit field-by-field shard-vs-draft diff before sealing every time — it is why the trap did not fire on the last two source edits.

**2. `safe_write` payloads must be LF.** Books are CRLF on disk; safe_write reads with universal newlines
and writes CRLF on Windows, so stage LF and CRLF is preserved (verified: 32,106 pairs before AND after).

**3. ★ Drafts are NOT all `indent=1`.** MEASURED: **indent=1** → `immortality`, `rare-earths`. **indent=2** →
`dddl-3e-2011`, `epigenetics`, `hells-kitchen`, `iaiyh`, `lets-play-doctor`, and `search-enrichment.json`.
Detect by byte-exact round-trip; **refuse to write** if you cannot reproduce the original bytes.

**4. `books-meta.json` field is `content_sha256`, not `sha256`.** Books have no `.golden.sha256` sibling.

**4b. ★ PURGING A CLAIM SHRINKS THE CORPUS VOCABULARY** → `book_purity`'s speller can then flag a real word
in ANY book's .txt → `book_source_clean` RED on a book you never touched. Root-cause it (which purged claim
carried the word?) and allowlist the term WITH its citation; never baseline it blind. Hit 2026-07-17
("amebiasis", from purging `WAL-CLM-LETS-000133`). **← RELEVANT: the 1 purge (IMMORT-000077) may trigger this.**

**5. Claims live in TWO files.** Sealed shard (`eden/corpus/claims/`, golden-protected) carries
`claim_text`/`verbatim`/`about`/`locator`/`tags`. The sidecar `eden/corpus/search-enrichment.json` (NOT
sealed) carries `subject`/`also_about`/`facet`/`question`/`answer_short`/`topics` — **307 claims** are
enriched. **Edit the DRAFT.**

**6. `mine_batch.py` has NO delete path.** Delete = remove from the draft + seal.

**7. Claim-id prefixes, MEASURED:** `DDDL` · `EPIGEN` · **`HELLS`** · `IAIYH` · `IMMORT` · `LETS` · `RARE`.

**8. Writes inside the repo are hook-blocked for agents** — `pre_write_guard` covers `temporary/` too.
Route project-file writes through `safe_write` even from Python (a Python heredoc `write_text` bypasses it and
`pre_bash_guard` does NOT catch it).

**9. A bare `cd subdir` drifts the shared bash cwd** and then every hook fails (`tools/hooks/...` won't
resolve). Use subshells `(cd x && ...)`; recover with PowerShell `Set-Location "<repo root>"`. Hit again this session.

**10. `corpus_seal` is USER-ONLY** — explicit per-invocation approval. Stage + dry-run, then ask.

**11. ★ NEW — the machine clock trap.** `TZ='America/Chicago' date` in git-bash on this Windows host does NOT
apply the zone — it prints UTC. Use PowerShell `Get-Date` for local time. (Misread a UTC 17:11 as "5:11 PM
Central" this session; it was 12:11 PM.)

# ★ OPEN QUESTIONS FOR LUNETH
1. **`IMMORT-000060`** — page prints *"nitric acid"*, our `.txt` says *"nitric oxide"*: a word-level factual
   divergence (a DIFFERENT chemical, NOT a spelling normalization). Logged correction or silent drift? Still open.
2. **The 114-claim gate migration** — schedule it, or leave the gate a labeled WISH? (numfix.py is ready.)
3. **`EPIGEN-000088`** merges two source tables with different dosing bases — checked CORRECT in the derive
   (all 13 ×1.54 targets are minerals), so a corpus-prose note, not a live wrong dose.
4. **`EPIGEN-000106`** — quote severed exactly where the source continues *"and congenital homosexuality…"*;
   the severance may be CORRECT per the charged-content policy. Left alone.
5. **Misframed → rewrite vs purge:** effectively RESOLVED in practice — Luneth ruled 37 rewrite / 1 purge this
   session, confirming the lean toward rewrite-to-preserve-source.

# ★ PAGE IMAGES ARE ON DISK — resolve it yourself before backlogging him
`epigenetics` (465 shots) · `immortality` (254, + `temporary/immortality-ocr/manifest.json` maps page →
`source_png`) · `iaiyh` (34) · Hell's Kitchen (full PDF at `temporary/hk/`).
`locator.screenshot` N → `Screenshot (N).png`. **Crop + upscale (PIL, ×3–5 LANCZOS) before reading.**
Only `lets-play-doctor` (56 risk claims) and `rare-earths` (19) genuinely need his camera.

# ★ CODIFY THE COST DISCIPLINE (memories written this session)
- [[workflow-token-budget-guard]] — big agent fleets balloon the 5-hour cap; **estimate the token cost and
  tell Luneth the number BEFORE firing.** The ~98 sweep went 60→100% in minutes (24.2M tokens) with no warning.
  His real 5-hour account limit OVERRIDES the ultracode "token isn't a constraint" framing.
- [[small-batch-build-test-log-mandate]] — the hard rule above, in full.

---

## PARKED — do NOT start until the 39 rulings land
**The plant-derived group expansion (5 → 20 claims).** Research at `temporary/plant-derived-research-2026-07-17/`.
★★ One of its 11 ACCEPTs — `WAL-CLM-EPIGEN-000089` — was PROVEN BAD and REWRITTEN; its source page (the
colloidal-mineral table) is now fixed in the .txt. Re-validate every remaining draft before landing any.
★ Epigenetics is still `raw` in `purity-status.json` with **3362 unresolved** defects (mostly PDF hyphen-wraps).
One table was fixed, not the book.

**Regimen + Scanner rebuilds** — `chronicle/coverage-regimen-scanner-blueprint.md` signed off;
`views/regimen.ts` + `views/scanner.ts` still burn.

**Phase 2 lineage topics — DEAD.** Luneth: *"the hover hints are enough."* Do not resurrect.

---

## ★★ THE PATTERN THAT KEEPS FAILING (read before writing ANY prose or firing ANY fleet)
Session A: invented 1,500-char summary essays, reached for a length TEMPLATE to game the fix.
Session B: called Mineral Toddy *"his most famous product"*; framed the Eagle termination without its vindication.
Session C: found the same disease **in the sealed corpus** — numbers invented over unreadable cells.
2026-07-17: the audit built to catch it made the same class of error itself — asserting absence from a window
it could not see past, reported with confidence; four "damning fabrications" were later refuted. AND: shipped a
review tool whose export silently did nothing (clipboard blocked in the sandbox), nearly losing an hour of the
user's work.

**One failure mode: producing a confident claim/tool whose evidence (or function) does not actually cover what
it asserts — and filling the gap with invention or an untested assumption instead of READING MORE / TESTING.**
**When you cannot read something, or cannot verify it works: SAY SO.**

Memories: [[small-batch-build-test-log-mandate]], [[workflow-token-budget-guard]], [[span-presence-is-not-evidence]],
[[the-corrupted-blind-spot]], [[outside-knowledge-injected-as-wallach]], [[severed-quote-signature]],
[[say-unreadable-never-guess]], [[editing-sealed-corpus-claims]], [[prove-completion-dont-narrate-it]],
[[verify-against-source-images]], [[page-images-exist-for-three-books]], [[draft-indent-varies-per-book]].
