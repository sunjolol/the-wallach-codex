# Source-rule review — calcium's right evidence card: a SOURCED PARAPHRASE with a kept cite

**Date:** 2026-07-30 (Central) · **Surface:** Knowledge → Essentials → Calcium, mechanism header
**Trigger:** Claude flagged `[WALLACH-SOURCE-RULE: PROPOSED VIOLATION]` · **Resolution:** Luneth ruled it is NOT a violation — acceptable sourced-paraphrase practice. Proceeded.

## What triggered the review
The right split card ("What the working pool costs to defend") was a faithful trimmed **verbatim quote**
of `WAL-CLM-IMMORT-000073` (via `quote_trim`, gated by `mech_quote_trim_faithful`). Luneth asked to
shorten it to "The parathyroids attempt to compensate and enlarge…" — which **edits Wallach's actual
words** ("The parathyroid glands **will** attempt to compensate and **will** enlarge…"). Presented under
the "Immortality (1st ed. 2008)" cite, that is a tightened summary shown as if it were his exact words —
the misattribution §00.A guards against, and the `mech_quote_trim_faithful` gate (quote_trim ⊆ sealed
verbatim) would turn the board red on it. Claude therefore refused to apply it silently and flagged it.

## Luneth's ruling (verbatim)
> "it's going to need to be prose and we KEEP the cite because we did not fundamentally change what
> Wallach is saying, we just shortened the quote slightly - this gets done all the time in real life,
> you can't ALWAYS cleanly cite Wallach because the way his books are written is not easily displayable
> in a designed card form - as long as we are not saying anything he did not say, the cite is fine as a
> one time exception despite it being prose - also we're not putting quote marks on this, so it's not
> even technically a quote, we're just citing our sources at this point so users can find it for
> themselves"

## Why this is within §00.A (not a violation)
- The content is **Wallach-sourced** (from his book Immortality), not a foreign source, and carries **no
  numeric target/dose/value** — it is a mechanism description. §00.A's own "Not covered" clause exempts
  mechanism/descriptive context, and the mechanism-clarity store is DEFINED as "a plain-language GLOSS
  of Wallach's OWN sealed claims."
- It carries **no quote marks** and does not claim to be verbatim — it is a **source citation** ("find
  it here"), the normal academic paraphrase-with-attribution, not a quotation.
- The bar Luneth set and that binds: **"as long as we are not saying anything he did not say."**

## How it is built (so the distinction is real, not cosmetic)
- **Path:** `note` (our tightened summary) + `quote_claim` (the source) on the split side, and **no**
  `quote_trim`. `views/entity-page.ts::mechEvidence` renders `note + quote_claim` in the quote STYLE
  (italic, cite composed from the claim's `book_id` via the registry — R3, never hand-typed) with a
  `kd-ep-fam__miniq--sourced` DOM marker.
- **Kept STRONG where it can be:** the LEFT card stays a gated **verbatim** `quote_trim`
  (`mech_quote_trim_faithful`). Only the right card is a paraphrase. Two paths, two rigor levels, same
  look — the data (`quote_trim` vs `note`) records which is which.

## The honest gap (WISH, R7)
Paraphrase **faithfulness to the source is not machine-checkable** — no gate proves the summary "says
nothing Wallach did not say." This rests on human review, exactly like every other gloss in the
mechanism store and the Search answers. The cite RESOLVES (gated by `mechanism_blocks_wellformed`), so
the pointer is real; the faithfulness is the reviewer's (Luneth's) call. This is the SAME standing WISH,
now extended to a card that also shows a cite — more traceable, not less.

## Scope of the precedent
`note + quote_claim` (sourced paraphrase) is now a general capability of the mechanism split, available
to any element header. It should be used sparingly and only when a verbatim `quote_trim` genuinely will
not fit a card — the DEFAULT remains the gated verbatim quote.
