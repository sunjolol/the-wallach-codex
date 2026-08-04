# chronicle/theme-studies

Faithful ports of reference designs we want to learn from, kept permanently.

## Why these are here and not in `temporary/`

`temporary/` is gitignored, so anything in it exists on one machine and vanishes with it.
A theme study is expensive to produce and is meant to be revisited months later, so it is
tracked. Each study holds enough to rebuild itself with the network off.

## The rule these studies exist to serve

Copy the reference **exactly** first — colours, fonts, graphics, all of it — and only then
change one thing at a time. A high-craft design is a set of relationships, not a set of
values; swapping a colour for a "principled" equivalent of similar saturation breaks the
relationships while looking, element by element, entirely reasonable. Prove the faithful
version renders before adapting anything.

Adapt: content, arrangement, sizing, which components get used.
Do not adapt, until the faithful version is on screen: hue, type, imagery.

## Studies

| Study | Source | Status |
|---|---|---|
| [`astoria/`](astoria/METHOD.md) | `codepen.io/pharaohleap/pen/wBojQLN` | Ported 1:1, rendering. Not shippable yet — see METHOD §5 |

## Before any of this becomes a live theme

Read the target study's METHOD §5 first. Every study so far has at least one blocker that
is cheaper to discover here than halfway through a live build. For Astoria the blocker is
that its display face is a trial build which watermarks digits, which a dashboard full of
doses cannot live with.
