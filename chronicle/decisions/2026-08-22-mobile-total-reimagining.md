# Mobile: total re-imagining ordered — the retrofit approach is dead

**Date:** 2026-08-22
**Ruled by:** Luneth
**Status:** BINDING. Supersedes every prior mobile decision made on the `mobile-responsive` branch.

## The instruction, verbatim

> "You've been approaching the mobile responsive version all wrong, trying to adapt the desktop
> version as truthfully and 1:1 as possible, which is the wrong approach and impossible. The mobile
> responsive version and app should be a NEW design that still uses ALL of the same data points, but
> presents it differently, using the most up to date, best, modern, best UX, UI, and design standards
> to create an amazing app that looks like it was designed from the start FOR mobile."

> "Re-imagine the mobile responsive version entirely, no limits besides ensuring that ALL features are
> still present and work, as far as how they are presented from a UX/UI standpoint — TOTAL FREEDOM,
> TOTAL OVERHAUL, TOTAL RE-DESIGN, NO RE-DERIVATION, COMPLETELY NEW EXPERIENCE *MADE FOR MOBILE*."

Context: this follows his 2026-08-22 rejection after driving the demo on a real phone — "Both regimen
and scanner tabs are both scuffed, and the knowledge tab just feels cheap and poorly thought out. None
of this feels like a PROPER mobile app."

## What this decides

1. **The retrofit is dead.** `mobile.css` on the `mobile-responsive` branch — 523 lines of
   `max-width: 767px` overrides that make desktop surfaces fit a narrow box — is not to be extended,
   patched, or salvaged as code. It is to be mined as a **bug report** about the desktop layout and
   then thrown away.
2. **The phone is a first-class design target, not a breakpoint.** The mobile experience is composed
   for a phone as though the desktop app did not exist. No 1:1 mapping, no re-derivation of desktop
   structure.
3. **The one condition is total feature preservation.** Every feature, every control, and every data
   point must still be present and must still work. Only their *presentation* changes. A feature
   inventory is the contract; anything not in it can be silently lost.
4. **Freedom is on UX/UI/IA only.** The hard project rules still bind — §00.A (Wallach is the only
   source of amounts; a redesign re-presents existing data and never sources new data), offline-first
   from `file://`, vanilla TS + hand-written CSS, no emojis, the fixed category colours, coverage as a
   MAP OF GAPS rather than a score, wholesale as the featured price, cream default with a dark toggle.

## What this reverses

Decisions taken on the `mobile-responsive` branch were made *inside* the retrofit frame and no longer
bind automatically. Each must be re-earned by the new design on its own merits — including "the bottom
tab bar is the shell", "search is deliberately NOT a tab", and the
`html[data-mobile-nav="bar"]` specificity crutch. They may survive; they are no longer given.

## The standing lesson this is built on

`render_probe_mobile.js` passed all six surfaces and the board was 102/102, and the answer was still
"not a proper mobile app". **A green gate proves reachability, never taste.** A phone surface is not
shipped until he has looked at it on a phone. Every chunk of this redesign ends at his eyes on a
device — not at a passing probe.

## Where the work lives

`chronicle/mobile-redesign/` — inventory (the feature contract), ia (proposals, verdicts, and the
canonical architecture), surfaces (per-screen designs), system (tokens, components, CSS/TS
architecture, motion, verification), groundwork (engine capabilities, reference study, real data
shapes, typography, teardown map, review loop, performance, accessibility), and `MASTER-SPEC.md`.
