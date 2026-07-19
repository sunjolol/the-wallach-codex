# 2026-07-19 — Supplying government RDA values where Wallach printed "?"

**Status: RAISED, awaiting the turn-gap. Not approved, not implemented.**
Triggered by: Luneth, ruling on `WAL-CLM-LETS-000065`.
Flag tag issued in chat: `[WALLACH-SOURCE-RULE: PROPOSED VIOLATION]`.

## In plain terms

Wallach's Let's Play Doctor has a big table (Fig. 8-1) listing, for each nutrient, the
government's RDA next to his own recommendation. For four nutrients he printed a question mark
in the government column instead of a number. Luneth wants us to fill those in with the real
government values so a reader can see the contrast. That is useful for the reader — and it is
also the one thing the project's founding rule says we may not do, because it puts a number that
did not come from Wallach in front of the user under Wallach's citation. So it stops here until
he decides with the rule in front of him.

## The proposal

For `WAL-CLM-LETS-000065` (selenium) and, by the precedent, the other "?" rows, supply the real
FDA/government RDA (selenium: 55 mcg) so the user can contrast it with Wallach's figure.

Luneth's words: *"I am purposefully adding the claim because the user should know the difference…
The idea is to give the ? real FDA/government RDA values so the user can contrast and compare.
This is not permission to do it elsewhere, these should be handled on a decision-by-decision
basis."* He separately agreed that **editing the book's own .txt is a bad move**, which closes the
more dangerous version of this — the corpus source stays untouched either way.

## The rule it conflicts with

§00.A / `.claude/rules/source-rule.md`, the **Not allowed** list, verbatim: *"USDA RDIs/DRIs/DVs …
'standard'/'conventional' comparison values surfaced to the user."*

The distinction that matters: RDA numbers ALREADY reach the user from this same table, and that is
legal — Wallach reprinted them himself and we quote his page. He printed "?" for selenium,
sulphur, tin and vanadium. A 55 in that cell would be **our** number rendered under his citation.

## What the evidence says about the "?"

It is almost certainly not an OCR dropout. It appears in exactly four rows — SELENIUM, SULPHUR,
TIN, VANADIUM — and three of those four have never carried a US RDA. That pattern reads as
Wallach's own notation for "none established". Luneth's independent read agrees: *"at the time
there probably was no claim."* So no source-purification fix applies here; the book is not wrong.

## The precedent it sets

That we may fill a gap in Wallach's data with an outside authority whenever the contrast seems
useful to the reader. Today it is a government RDA in a table he reprints to argue against. The
same reasoning would license an outside number anywhere the corpus is silent — which is the
failure mode §00.A exists to prevent, and the one the 2026-07-17 audit spent 85M tokens hunting
([[outside-knowledge-injected-as-wallach]]).

## The non-breaching alternative offered

State the ABSENCE rather than supplying the number: note in the summary that the table prints "?"
for selenium, sulphur, tin and vanadium because no government RDA was established for them. That
is a statement about the source, not an outside value — the same shape as the already-ratified
`LETS-000071` wording *"the government RDA (no amount listed for Vitamin A)"*. It gives the reader
the contrast (Wallach recommends 200 mcg; officialdom set nothing) without importing a figure.

## Protocol state (source-rule.md, three-confirm)

1. **Flag** — done, this document + the tagged message in chat.
2. **Verify (next turn, turn-gap mandatory)** — Luneth confirms he understands the rule, the
   violation, and the precedent. NOT yet done.
3. **Final go-ahead** — the exact phrase `APPROVE SOURCE-RULE OVERRIDE`. Nothing else counts.

`WAL-CLM-LETS-000065` is parked out of the 2026-07-19 batch until this resolves. The other 22
rulings from that batch proceeded normally.

## Note on who the rule binds

Luneth proposed this, and the rule is symmetric by design — *"If the user proposes a breach,
Claude flags it and runs the protocol — it does not defer to user authority (the user opted into
this guardrail against their own drift)."* His own framing ("not permission to do it elsewhere")
shows the instinct was already right; the protocol is what makes the decision auditable later.

---

## RESOLVED 2026-07-19 — the non-breaching alternative was taken. Override NOT exercised.

Luneth: *"Implement your proposal to fix the RDA gap"* — the proposal being the absence-statement
version, not the override. The three-confirm protocol therefore **stopped at step 1**; the phrase
`APPROVE SOURCE-RULE OVERRIDE` was never given and was never needed. **No government RDA value
entered the corpus. Wallach's .txt was not touched.**

`WAL-CLM-LETS-000065` now carries the auditor's proposed text, which states the absence:

> …The quoted row runs in column order — RDA, then Wallach's True Supplement Need, then his 30-day
> pharmacologic dose — but the RDA column for selenium is printed as "?", so the row carries only
> Wallach's two figures. Where the table does print an RDA, Wallach reprints it only to argue
> against it; it is never his recommendation.

The reader still gets the contrast Luneth wanted — Wallach recommends 200 mcg where the official
column stands empty — without a non-Wallach number being surfaced under his citation.

### One correction made to the alternative as it was implemented

The alternative as first offered in chat said to explain the "?" as meaning *"no government RDA was
established for them."* That is true for sulphur, tin and vanadium, but **false for selenium**,
which received a US RDA in 1989 — six years before this 1995 fourth edition. Shipping that
explanation would have injected an outside-world claim that is also wrong, under Wallach's
citation: the exact defect class this review exists to stop, reproduced inside the fix for it
([[outside-knowledge-injected-as-wallach]]).

The shipped text therefore explains nothing about WHY the cell is "?". It reports only what the
table prints, which is verifiable in the claim's own verbatim (`SELENIUM ? 200 mcg 500 to 3,000
mcg`). The sibling "?" rows are likewise NOT named in the claim_text — sulphur, tin and vanadium
do not appear in this claim's verbatim, so asserting them here would rest on the surrounding span
rather than the quote ([[span-presence-is-not-evidence]]).

### Standing decision

The **rule is unchanged and unweakened**. Any future proposal to supply an outside RDA/DRI/DV
value to the user re-runs the full three-confirm protocol from step 1. Luneth's own framing —
*"This is not permission to do it elsewhere, these should be handled on a decision-by-decision
basis"* — is recorded here as his intent, and matches the rule's requirement rather than
substituting for it.
