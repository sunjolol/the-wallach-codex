# Decision: the app targets one pinned browser engine

_2026-08-03, during the doctor sweep. Recorded because it changes what every future design surface
is allowed to assume._

## The decision
The Wallach Codex ships alongside **one pinned, never-updating browser build**. All design and code
targets that engine directly.

## What it authorizes
No fallbacks. No polyfills. No defensive coding for engines that will never load this app. Modern
CSS and JS are used directly — container queries, `:has()`, view transitions, scroll-driven
animations, `color-mix()`, CSS nesting, backdrop-filter.

## Why
Two reasons, both Luneth's.

1. **Permanence.** A pinned browser cannot auto-update, so nothing can break underneath the app. The
   product promise is that it runs for years with no upkeep and cannot be broken by someone else's
   release schedule. A pinned engine is the last piece of that.
2. **It removes a hidden tax on design.** Writing for unknown browsers means conservative choices
   everywhere, and those choices compound into the flat, static output that has been the standing
   complaint about this project's visual work.

## What "offline-first" means, restated
Exactly one thing: **nothing loads off-machine at runtime.** Vendored and pinned is encouraged; a
CDN, a remote font, or a live API is forbidden. Offline-first has never meant small, static, or
plain, and the previous conflation of the two was the root cause of the design ceiling.

## Status — honest
The **decision** is made and binds design choices from now on. The **artifact** does not exist yet:
no browser has been chosen, downloaded, or pinned. Until it is, this rests on the decision rather
than on something shipped, and nothing verifies it.

**The engine choice is DEFERRED to the very end** (2026-08-03). It is a finishing touch, picked
against the features actually shipped — not a foundation to design around. A candidate was
acquired, measured, leak-tested and then deliberately removed; every number is banked in
`2026-08-03-pinned-engine-acquisition.md` so none of it has to be redone.

The status above therefore still stands, and will for a while: the decision to pin an engine binds
design choices NOW, while the artifact does not exist. That is deliberate — Chromium is effectively
unlimited for our purposes, so nothing we might build is waiting on it.

Meanwhile, visual verification runs in **Luneth's own live browser**.

Still a labelled WISH: whether an invariant could prove the shipped app actually RUNS under a pinned
engine. No non-gaming machine check exists for it.
