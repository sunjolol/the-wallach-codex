---
name: visual-verification
description: Read before building or refining any page, view, visual surface, UX flow, or copy. Covers the human sign-off gate that ends every visual chunk, and the measure-do-not-eyeball method for matching a design exactly.
---

# The visual / human verification gate

For work whose correctness is subjective, no automated check can verify it. **The user is the test
gate.** This sits on top of the functional gates; it does not replace them.

## The rule
1. **Build in phases.** Segment a surface into coherent chunks.
2. **Build to done, then STOP.** Do not roll into the next chunk.
3. **He verifies before you continue.** Tell him exactly what to look at and how to view it. Wait.
4. **Never assume your read is reality.** "I'm 100% sure it matches" is not evidence. Treat every
   visual judgment as UNVERIFIED until he confirms.

Never claim he verified something he did not, and never log a visual chunk as done before sign-off.

## Measure, do not eyeball
When a surface reads as "almost everything slightly off," that is nearly always ONE systemic cause,
not a hundred per-element bugs. Check these first:

1. **Root font-size.** If everything is off by the same ratio, the document root differs. A lifted
   stylesheet setting `font-size: 15px` against a 16px default renders the whole rem-based UI at
   93.75%.
2. **Cascade pollution from bare selectors.** Lifted CSS uses `html, body`, `header`, `*` which leak
   into the new shell. Scope element-level rules under one host id.
3. **A 404'd `@font-face`** falls back silently and shifts metrics on every element.

Then run the objective tool: `node tools/style_diff.js <mockup.html>` prints only the
`getComputedStyle` deltas. Fix until `TOTAL DIFFS: 0` -- except where the live uses a correct design
token against the mockup's unset browser default. That is the live being *better*; keep it.

A CSS read and a screenshot glance have both lied. The computed-style diff has not.

## Related standing rules
- **Never build an element header live without explicit permission.** Demo-only until he approves.
- A request for "slightly clearer" is not a licence to redesign. Change labels before geometry.
- An approved demo is the spec. Do not "improve" it silently -- ask.
