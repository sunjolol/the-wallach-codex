---
name: wallach-source-rule
description: Read BEFORE touching any recommended amount, dose, range, daily target, deficiency sign, or health claim, and before adding or editing any corpus claim. Covers the Wallach-only allowlist, what Youngevity may and may not supply, the never-guess rule, and the three-turn protocol for changing any of it.
---

# The source rule (section 00.A)

## The rule
Every recommended amount, dose, range, daily target, deficiency indicator, or health claim the app
displays traces to a Wallach book. No exceptions -- **including the owner of this project**, who has retracted his own
lived experience when it conflicted with the corpus. This is the project's reason for existing and
the thing that makes it legally defensible.

## The allowlist
A source is valid only if it is one of:

1. **A Wallach book**, with year. The 7 in-housed books are registered in
   `eden/corpus/books-meta.json` -- **that registry is the authority.** Never hand-type a citation
   and never trust a book list memorized from a doc; the doc has been wrong (it once omitted
   `hells-kitchen`, a book already carrying 8 sealed claims). Books only. No lectures, no
   transcripts.
2. **A Youngevity primary** (label, official product page, official statement) -- token `ygy` --
   **valid for product COMPOSITION only.** What a product contains. Never a recommended amount.

Not allowed as a target source: USDA RDI/DRI/DV, nutrition papers, industry bodies, Wikipedia,
other practitioners' protocols even when aligned, "conventional" comparison values, web results
without primary verification, or any LLM-generated number.

**Retired and now poison:** deriving a target by summing Youngevity labels at a stated daily-serving
count. That made Youngevity drive amounts, which R2 forbids. The old "two-role split" that enabled
it is dead -- do not resurrect it.

## The honest gap
Where the corpus has no maintenance-dose claim for an essential, the app shows **no number** and says
so. An honest gap always beats a fabricated or borrowed one.

## Never guess, never guess silently
The books are riddled with OCR defects and real errors, so judgment is required -- but:

- Never invent a value, mapping, or reading to fill a gap.
- Never resolve an ambiguity silently. Surface it in the same turn, named and explicit. The old
  process's fatal move was guessing *without saying so*; the silence is the violation, not the
  uncertainty.
- When you cannot read it, say **UNREADABLE** and point at the page image.
- **The page is evidence, not ground truth.** Fix a clear typo using outside knowledge; never touch a
  genuine Wallach statement even when it contradicts mainstream fact. Decide, then log it for his
  sweep. Deliberate divergences live in `eden/tools/ratified-divergences.json` -- check it before
  flagging a defect, and never "restore" one. Four are safety-critical dose divergences where the
  printed page would reintroduce a toxic dose.
- Claude proposes, **the user ratifies**. Sealing is the user's act, which is why `corpus_seal` is user-only.

## Changing this rule -- three turns, no shortcuts
1. Surface it tagged `[WALLACH-SOURCE-RULE: PROPOSED VIOLATION]`, naming the breach and the precedent.
2. In a **later** turn (the gap is mandatory) he confirms he understands rule, breach, and precedent.
3. He gives the exact phrase `APPROVE SOURCE-RULE OVERRIDE`. Nothing else counts -- not "yes", not
   "go ahead", not "approved".

Symmetric: if *he* proposes the breach, you still run the protocol. He opted into this guardrail
against his own drift. Log every triggered review to `chronicle/contradictions/`.

## Enforcement
`amounts_wallach_only` (critical) proves every numeric target carries a `source_claim_id` resolving
to a sealed Wallach dose claim **and** recomputes the whole documented transform chain, byte-comparing
the result. `dose_amount_in_verbatim` proves the dose number is present in the claim's own verbatim.
`views_no_ciphered_data` extends it to render time, after the Coverage hero was caught scrambling
Wallach's 90 into 30/80/94 four seconds in five.

Scope, honestly: `amounts_wallach_only` reads 37 of 91 essentials — 36 numeric targets plus silver's stated ceiling, which is audited identically because it is still Wallach's number. The other 54
rest on this rule and review. That is a labeled WISH, not a covered case.
