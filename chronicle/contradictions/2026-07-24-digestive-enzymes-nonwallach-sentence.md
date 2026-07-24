# §00.A source-rule review — the digestive-enzymes sentence on the Foods/Absorption page

**Date:** 2026-07-24
**Status:** ⛔ **OVERRIDE WITHDRAWN BY LUNETH — NO BREACH SHIPPED. No precedent exists.**
**Severity:** PRIME DIRECTIVE (§00.A) — flagged, reviewed, withdrawn before any code was written
**Scope at its widest:** one sentence fragment, on one page section (`views/knowledge-foods.ts` §04)
**Flagged by:** Claude, per the three-confirm protocol in `.claude/rules/source-rule.md`
**Resolved by:** Luneth, who withdrew the override on learning the sentence could be cut without
losing the section — "I back down from breaking the rule and would like to cancel my over-ride."

---

## What was proposed

Forward-facing prose on a new §04 digestive-enzymes section asserting that digestive enzymes
**reduce the bad effects of bad foods**, alongside increasing the good effects of good foods and
nutrients. The second half is Wallach's; the first half was ours.

## What the corpus does NOT say (the reason it was a breach at all)

Checked exhaustively before flagging: every passage in all 7 books where wheat/gluten/barley/rye/oats
falls within ±600 characters of an enzyme mention — 10 of them. In **every** one, gluten is a food to
ELIMINATE, and betaine HCl / pancreatic enzymes appear as separate digestive support in the same
treatment stack. Wallach nowhere claims enzymes let you tolerate or neutralise foods he says to avoid.

## What IS sourced, and is what shipped instead

The section is built entirely from sealed claims:

- `WAL-CLM-DDDL-000128` — stress and ageing both lower stomach-acid production; 75 percent of people
  over 50 require supplemental stomach acid.
- `WAL-CLM-IMMORT-000078` — stomach acid activates pepsin for protein digestion, activates intrinsic
  factor for B12, and is required to absorb minerals.
- `WAL-CLM-DDDL-000130` — antacids in regular use "damage you by reducing the nutrients you absorb."
- `WAL-CLM-DDDL-000131` — take betaine HCl and pancreatic enzymes before meals as you grow older, and
  be sure to take them under stress. Wallach attaches no dietary precondition to the instruction.
- `WAL-CLM-LETS-000137` — betaine HCl is "required to assure absorption of B-12."
- `WAL-CLM-LETS-000245` — 60–90 days to heal the intestinal lesions "to the point where you can
  absorb nutrients efficiently."

## Why Luneth originally sought the override, recorded because the reasoning was sound

His argument was behavioural, not clinical: people will not change their diet, get discouraged, and
"throw the baby out with the bathwater." Making it clear that enzymes still help someone who has not
cleaned up their diet is a way IN for people who would otherwise never start. He withdrew the override
once it was clear the same door could be held open with Wallach's own words — his instruction to take
digestive aids carries no dietary precondition — rather than with a claim of ours.

**Deliberately NOT forward-facing** (his instruction, recorded so it is never leaked into copy): the
"every Wallach doctor recommends Ultimate Enzymes" observation, and his personal experience. Both were
context for this decision only. Naming a Youngevity product as a recommendation would breach §00.A a
second way (Youngevity = composition only, never a recommendation).

## Outcome

No override was exercised. No non-Wallach health prose exists in the app. The proposed
`nonwallach_prose_contained` containment gate was therefore **not built** — there is nothing to
contain, and building a gate for an exception that does not exist would itself imply the exception is
available. **This file exists as the record that the protocol ran and held**, per the source-rule
requirement to log every triggered review, approved or not.
