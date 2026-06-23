# Visual / human-verification gate

_Read before building or perfecting any page, view, or visual/UX surface. This is the human-in-the-loop TEST step of build → test → log → repeat — Luneth is the tester._

## Pattern
For work whose correctness is subjective or visual — does it LOOK right, is it what the user actually wants — no automated check can verify it. The only verification surface is the user's eyes. So **the user IS the test gate**: build a coherent chunk, STOP, and get the user's visual sign-off before continuing. Certainty is not truth; only verification is. (This sits ON TOP of the functional gates — build, invariants, render probes — it does not replace them.)

## The rule (non-negotiable for visual / page / requirements work)
1. **Build in phases.** Segment a page/surface into coherent chunks; respect resource usage (don't rebuild the world per chunk).
2. **Build to "done" — then STOP.** When you believe you've delivered the finished surface, or one verifiable chunk of it, HALT and hand it to the user. Do not roll straight into the next chunk.
3. **The user verifies before you continue.** Tell them exactly what to look at and how to run it. They visually verify, course-correct, clarify, add, or change their mind. You do NOT advance to the next chunk, the next surface, or declare "done" without their explicit go-ahead.
4. **Never assume your read is reality.** "I'm 100% sure it matches" is not evidence it matches. Treat every visual/requirements judgment as UNVERIFIED until the user confirms. Symmetric — the user checks against their own assumptions too. When uncertain whether something matches intent, that uncertainty is the signal to STOP and ask, not to guess.

## Why
- Closes the gap between what the agent THINKS is right and what is ACTUALLY right.
- Eliminates future rework — divergence is caught at the chunk boundary, not three surfaces later.
- A discipline that cannot be skipped makes "going astray" structurally hard. This is the guardrail that would have caught the unstyled-drawer drift (shipping `kd-*`/`jd-*` with no CSS and treating the surface as progressed).

## Scope
Applies to any page / view / visual / UX / copy / interaction-feel / requirements-shaped work — building a surface to match a v3 mockup, layout, theming, anything subjective. Pure-internal tooling/refactors with an objective pass/fail and NO user-facing surface are governed by the automated gates alone (no human gate needed). When in doubt whether a change is user-facing enough to need the gate, apply it.

## How to use
- Closing a visual chunk: functional gates pass (build · invariants · probe) → **STOP** → "Here's what to verify: …" + how to view it → wait for sign-off → only THEN log the chunk + continue.
- Pairs with the per-surface build method (one surface to 100% before the next — `genesis/02-clarifications-and-plan.md`, Phase 2) and `commits-and-rounds.md` (round-close mechanics).

## Enforcement
Behavioral discipline, like the §00.A turn-gap — documented here and loaded every session via CLAUDE.md. A Python invariant cannot verify "the user approved the visuals," so the guarantee is structural: visual chunks END at a STOP-for-verification by default, and the agent never chains past it. The honesty rule binds absolutely — NEVER claim the user verified something they did not, and never log a visual chunk as "done" before sign-off.

---

## Getting to "exact": measure, don't eyeball (2026-06-23 lesson)

When a surface must pixel-match a v3 mockup and reads as "almost everything slightly off," that is almost always ONE systemic cause, not a hundred per-element bugs. Check these FIRST, before touching individual rules:

1. **Root font-size (rem base).** If every size/space is off by the SAME ratio, the document root font-size differs. Real case: `legacy-dashboard.css` set `html, body { font-size: 15px }` while the mockup uses the 16px browser default → the whole rem-based UI rendered at 93.75%. One removal fixed all of it.
2. **Cascade pollution from bare/broad selectors.** "Lifted-verbatim" CSS (`legacy-dashboard.css`) uses BARE element selectors (`html, body`, `header`, `footer`, `*`) that leak into the new `.app-*` shell — wrong radius / shadow / border / color, even a `header::before` veil painted over the topbar (hiding its accents + fading the search). Containment: scope them to `#legacy-workspace-host` (grep `[v3-contain]`), or remove the doc-level overrides so the design system owns the root.
3. **Missing fonts → silent fallback.** If an `@font-face` `src` 404s (check the render probe's `FAILED_RESOURCES`), its token falls back (e.g. Chakra Petch → Space Grotesk), shifting metrics on EVERY element. In-house the real TTFs.

**The tool, not your eyes.** A CSS read AND a screenshot glance both lied this session. Run an objective computed-style diff: `node tools/style_diff.js <mockup.html>` loads the live surface + the mockup headless and prints only the `getComputedStyle` deltas. Fix until `TOTAL DIFFS: 0` — except residual diffs where the LIVE uses a correct `--ds-*` token vs the mockup's unset browser default (black / Times New Roman); that is the live being BETTER than the demo — keep it. This took a confident "shell ~95% done" misread to objectively exact in a single pass.
