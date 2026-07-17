# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-17 00:55 CDT)

> ★★★ THIS FILE + the memory files OVERRIDE ALL OLDER BLUEPRINT / PLAN / DEMO NOTES.
> Board **76/76**. Corpus sealed at **kv=343**, **1363 claims** (was 1364 — one was deleted for fabricating numbers).
>
> **THE NUMBER IS NOT WHAT YOU THINK IT IS.** Only the **20 external** gates check anything outside
> our own files. A green board means NOTHING DRIFTED. It does not mean anything is RIGHT.
> Tonight proved that literally: a claim with three invented numbers sat green for weeks.

---

# ★★★★ THE JOB: AUDIT ALL 1,363 CLAIMS. Luneth is ASLEEP. Do not wait for him.

Luneth authorized a full corpus accuracy audit to run overnight, unattended, 2026-07-17.
His words: *"I want us to ONCE AND FOR ALL find EVERY SINGLE wrong claim and FULLY erase them
from ALL front-facing elements/aspects/text/whatever AND the code itself, leaving them only in
the Creator's Log which is never to be tampered with."*

He wants **a full count in the morning**. He estimated *"300+ out of our 1,363"* may be wrong.
That estimate is his, not measured — **report the real number, whatever it is.** If it is 40, say 40.
If it is 600, say 600. Do not shade it toward his guess; that would be the exact disease being audited.

### HIS FOUR RULINGS (asked and answered 2026-07-17 before he slept — do NOT re-litigate)
1. **Fresh session** for the audit (this handoff exists because of that ruling).
2. **STAGE + COUNT. PURGE NOTHING.** Produce the verdict list, the counts, and a ready-to-run
   purge script. He wakes, sees the number, gives the word, THEN it executes. Nothing
   irreversible happens unattended.
3. **MISFRAMED == FABRICATED → PURGE.** A claim whose quote is real but whose framing we
   invented is treated identically to an invented number. (His precedent: the Eagle
   "terminated" incident — *"a base fact is not a defense; framing that invites a false
   interpretation IS a lie by omission."*)
4. **EDITORIAL TAILS → STRIP THE TAIL, KEEP THE CLAIM.** If the facts verify and only a closing
   editorial sentence is ours (e.g. 301's *"This table is direct evidence that…"*), mark it
   `strip_tail`, NOT `wrong`. Cheaper fix; preserves good claims. Count these SEPARATELY.

### DO NOT ask Luneth anything until he wakes. Backlog every input-needed item instead.
He was explicit: his awake time is only for things that genuinely need him, and every such item
must be **intelligently backlogged** so the grunt work happens while he is away.

---

## THE EVIDENCE — why this audit exists (two-for-two, found 2026-07-17)

**`WAL-CLM-RARE-000301` — DELETED tonight (kv=343).** It transcribed Table 10-5 of Rare Earths
(a SPARK SOURCE mass-spec assay). Where the OCR was unreadable garbage — `a0)`, `ci)`, `OL` — the
claim wrote clean confident numbers. Luneth's page photo proved: **copper claimed 20, true 2.0
(10×)**; **ytterbium claimed 2, true 0.2 (10×, inherited from the .txt and copied byte-faithfully)**;
lanthanum 2.0 and beryllium 0.1 were guesses that happened to land. It also silently "corrected"
the agency name toward the real-world HHS, and omitted 6 minerals while calling itself
*"the full mineral content."*

**`WAL-CLM-EPIGEN-000089` — STILL ON DISK, KNOWN BAD.** Wallach REPRINTED the identical table in
Epigenetics; all ~40 clean cells match Rare Earths byte-for-byte. The Epigenetics OCR dropped
decimal points (`Yurium 40`, `Copper 20`, `Lithium 100`, `Chlorine 80`, `Boron 02`) and the claim
copied them. **True values, settled by Luneth's Rare Earths photo: copper 2.0, yttrium 4.0,
lithium 10.0, chlorine 8.0, boron 0.2.** It also mis-groups chlorine (8.0 PPM) and phosphorus
(12.0 PPM) as "bulk electrolytes in the gram-per-liter range".
★ **USE 089 AS THE AUDIT'S NEGATIVE CONTROL — see below. Do not fix it before the control runs.**

### ★ WHY NO GATE CAUGHT EITHER — the structural hole to hunt
Both asserted their numbers in **`claim_text` with NO `verbatim` backing** (40 rows behind a
100-char subtitle; 45 rows behind a 68-char header). `dose_amount_in_verbatim` exists to force a
dose into the claim's own quote — but it **only fires when `dose` is set**, and both had `dose: null`.
**Numbers written as claim_text prose are unguarded across the entire corpus.** That is the
primary signature to scan for.

---

## THE AUDIT DESIGN (built for scale + for surviving the session)

★ **Verdicts go to a FILE, never back into the orchestrator's context.** Have every agent append
one JSON line to `temporary/audit-2026-07-17/verdicts.jsonl`. Read only counts. This is what makes
1,363 claims survivable — the constraint becomes wall-clock, not context.

### Phase 0 — NEGATIVE CONTROL FIRST (non-negotiable; `negative-control-or-it-proves-nothing`)
Before trusting a single verdict, confirm the audit **flags `WAL-CLM-EPIGEN-000089`**. It is a
known-fabricated claim still on disk. **An audit that cannot re-find a known bug proves nothing,
and a clean sweep would read as vindication when it is really a broken instrument.** If 089 does
not flag, the audit is broken — fix the audit, not the corpus. Also plant 1-2 synthetic bad claims
in a COPY of the data and confirm they flag.

### Phase 1 — MECHANICAL (pure Python, no agents, deterministic, cheap)
For each of 1,363 claims, compute and record:
- every number token in `claim_text`; whether each appears in `verbatim`; whether each appears in
  the source span (`locator.char_offset` ± ~3000 in the LF-normalized book text)
- **`numbers_in_claim_text_absent_from_verbatim`** ← the 301/089 signature. Rank by count.
- whether the source span contains OCR-garbage tokens (`\bа0\)`, `ci\)`, `OL\b`, `U2f3`, bare
  letter-cells where a number belongs) → **UNVERIFIABLE candidates**
- verbatim byte-faithfulness + `char_offset` points at verbatim (should be green; prove it)
- ratio: len(claim_text) vs len(verbatim) — a huge ratio means lots of unquoted assertion
⚠ **Scope every search to the claim's own span. A whole-book substring search is a BLIND
INSTRUMENT** — searching 1.17MB for "0.1" always hits. That mistake was made tonight and caught.

### Phase 2 — SEMANTIC (agents, batched, verdicts → JSONL)
Every Phase-1 flagged claim **+ a random sample of ~100 unflagged ones** (false-negative control).
Each agent: read ≥3000 chars either side of the locator, then classify:
- `FABRICATED`   — asserts something absent from the source → PURGE
- `CORRUPTED`    — faithfully copies an OCR error (089's copper) → PURGE or fix-from-image
- `MISFRAMED`    — quote real, framing invented → **PURGE** (ruling 3)
- `EDITORIAL_TAIL` — facts verify, only a closing editorial is ours → **`strip_tail`** (ruling 4)
- `UNVERIFIABLE` — source OCR destroyed; truth unknowable without a page image → **BACKLOG**
- `CLEAN`
Agents must quote byte-exact evidence + offsets for every verdict. **REJECT/CLEAN is a valid,
valuable answer — do not stretch to hit his 300+ guess.**

### Phase 3 — DELIVERABLES for his morning
1. **The count**, by class, with a per-book breakdown.
2. `verdicts.jsonl` — every claim, its class, its evidence.
3. A **staged purge script** (does not run). Must also report the BLAST RADIUS: which condition /
   essential / entity pages lose claims, and which drop to ZERO (empty pages are a UX problem he
   will want to know about BEFORE purging).
4. **The screenshot backlog** — every UNVERIFIABLE claim as `book + printed page + what to look at`,
   ordered so he can rip through them in one sitting. This is his stated manual-pass workflow.
5. A recommendation on the **`claim_text` numbers gate** (see below).

---

## ★ CODIFY, DON'T PROMISE (§00.B) — gates this audit owes
- **`claim_text_numbers_backed`** — every number in a claim's `claim_text` must appear in its own
  `verbatim` OR in its source span. This is the gate that would have caught BOTH 301 and 089 and
  does not exist. Build it with a negative test (R9).
- **`corpus_seal` draft/shard offset guard** — see the trap below. Hit 3× now.

---

## ★★ TOOLING TRAPS — READ BEFORE TOUCHING THE CORPUS (each cost a real recovery)

**1. resnap → seal ORDERING. Hit 3 times: SESSION 12, SESSION 44, and again 2026-07-17.**
`corpus_resnap --write` relocates offsets in the **SHARD + books-meta ONLY — never the draft**.
`corpus_seal` promotes draft → shard. So sealing after a draft edit **clobbers the resnapped
offsets with the draft's stale ones** → N × `corpus_verify #9 "char_offset does not point at
verbatim"` (215 of them tonight).
**Correct order:** edit .txt → edit draft → `corpus_resnap --book X --write` → **SYNC shard → draft**
→ `corpus_seal` → `corpus_embed` → build.
Sync guard that worked tonight: assert every claim differs ONLY in `char_offset` and abort on any
other field drift. `editing-sealed-corpus-claims` documented this trap and **still did not prevent
it — a memory is not a gate.** Codify it.

**2. `safe_write` payloads must be LF.** The books are CRLF on disk (rare-earths: 38,010 CRLF,
0 bare LF), but `safe_write` uses `read_text()` (universal newlines → LF) and `write_text()`
(→ CRLF on Windows). So stage LF, and CRLF is preserved. Verified tonight.

**3. JSON formatting: the corpus drafts are `indent=1`.** Round-trip-test BEFORE writing
(`json.dumps(doc, indent=1, ensure_ascii=False) + "\n" == raw`) or you silently reformat the whole
pillar. indent=2 inflates the rare-earths draft 400,349 → 438,554 bytes.

**4. `books-meta.json` field is `content_sha256`, not `sha256`.** Books have NO `.golden.sha256`
sibling; their hashes live in the registry, gated by `corpus_integrity`.

**5. Claims live in TWO files.** Sealed claim (`eden/corpus/claims/claims-<book>.json`, golden-
protected) carries `claim_text`/`verbatim`/`about`/`locator`/`tags`. The hand-authored enrichment
sidecar (`eden/corpus/search-enrichment.json`, NOT sealed) carries
`subject`/`also_about`/`facet`/`question`/`answer_short`/`topics`. `answer` and `cite` are DERIVED,
never authored. **Edit the DRAFT, not the shard.**

**6. `mine_batch.py` has NO delete path** — it only edits semantic fields. Delete = remove from the
draft + seal.

---

## ★ CORRECTIONS TO THE OPERATING DOCS (found tonight, not yet fixed — do these)
- **`facet_in_taxonomy` DOES NOT EXIST.** `.claude/rules/search-corpus.md` names it as a gate. No
  such invariant is in the codebase. The real gate is **`search_index_wellformed`**
  (`tools/invariants.py:3466`). The doc oversells enforcement — R7 violation.
- **Nothing gates the QUALITY of a `question` / `answer_short`.** `search_index_wellformed` checks
  presence, facet membership, slug resolution. The Calcium format is a CONVENTION held by review,
  not a contract. Do not describe it as enforced.
- **`search-enrichment.json` is NOT sealed** (no golden). Only mercury + calcium are enriched.
- **The 33/34/35 count is RESOLVED — do not re-open it.** Luneth: *"We are NOT getting into this
  again."* The app's "plant derived" = **the minerals with NO explicit Wallach dosage claim that he
  treats as a group** — an internal category, unrelated to how Wallach uses the phrase in the books
  (there it covers all 60). **34** = the operational group (`target.kind`), what Coverage renders.
  **35** = canon `coverage_kind`, which `entity_page_derive.py:264` reads → the group cards also land
  on **tin**, which has its own 500 mcg dose and is not one of the 34. Known cosmetic defect,
  DEFERRED by his instruction. Silver (400 mcg) is the parallel case and reads `"unspecified"`.

---

## ★ THE NEW MINING DOCTRINE (Luneth, 2026-07-17 — supersedes page-by-page)
**Page-by-page mining is RETIRED.** His reasoning: sweeping pages means things not in focus at the
time get ignored and must be re-mined later anyway. **Mine AS-NEEDED, per element / per condition**
(exactly how the plant-derived work is running), while:
- noting every unknown/unsure **against literal page screenshots**, and
- a **manual pass from Luneth** to confirm misspellings, contradictions, and anything uncertain —
  *"these books are PEPPERED with errors which is why a manual review process is required."*
**Never guess. Never guess silently.** His core grievance, verbatim: the old process *"would
literally just make guesses WITHOUT EVEN TELLING ME it was guessing."*
→ `.claude/rules/mining-veins.md` still describes the vein/page model and **must be rewritten** to
this doctrine once the audit lands. It currently contradicts the ruling above.

---

## PARKED — do NOT start these until the audit is delivered

**The plant-derived group expansion (5 → 20 claims).** This was tonight's goal; the audit
pre-empted it, correctly. Research preserved at `temporary/plant-derived-research-2026-07-17/`
(26 files, ~2.8M subagent tokens, every quote byte-verified): the Calcium format spec, the group
plumbing, the 5 existing claims in full, the gates/tooling map, 7 per-book sweeps, and 15 drafted
candidates (11 ACCEPT / 4 REJECT).
★★ **One of the 11 ACCEPTs — `WAL-CLM-EPIGEN-000089` — is PROVEN FABRICATED.** The disease was
inside my own vetted slate. Re-validate every draft against the audit verdicts before landing any.
Available material is abundant (~71 candidate passages; rare-earths 21, immortality 13,
hells-kitchen 13, dddl 9, epigenetics 9, lets-play-doctor 6, iaiyh 0), so 20 is reachable —
selection, not scarcity, is the constraint.

**Regimen + Scanner rebuilds** — `chronicle/coverage-regimen-scanner-blueprint.md` signed off;
`views/regimen.ts` + `views/scanner.ts` still burn.

**Phase 2 lineage topics — DEAD.** Luneth 2026-07-17: *"We're skipping the phase 2 thing and
forgetting about it, the hover hints are enough."* Do not resurrect.

---

## ★★ THE PATTERN THAT KEEPS FAILING (3 consecutive sessions — read before writing ANY prose)
Session A: invented 1,500-char summary essays to fill space, then reached for a length TEMPLATE to
game the fix. Session B: called Mineral Toddy *"his most famous product"* (no corpus basis) and
framed the Eagle termination without its vindication. Tonight: found the same disease **in the
sealed corpus itself** — numbers invented over unreadable cells, never flagged as guesses.

**It is one failure mode: producing text without asking "does this land as the claim I intend, or
as one I don't?" — and filling gaps in understanding with invention instead of READING MORE SOURCE.**

Luneth, tonight: *"you read a word and instantly make an assumption and claim about it without
actually reading the full context and THINKING ABOUT HOW TO PRESENT THE INFO."*

**When you cannot read something: SAY SO. That is the whole lesson.** Copper was `a0)`. The honest
output was "unreadable — needs the page image." The output given was "20". It was wrong by 10×, and
two sibling guesses landed correct, which is what made the process look reliable for weeks.

Memories to re-read: [[summary-fits-the-quote-no-target]], [[verify-against-source-images]],
[[negative-control-or-it-proves-nothing]], [[the-instrument-lies-before-the-eye]],
[[prove-completion-dont-narrate-it]], [[null-result-needs-a-scope-check]].
