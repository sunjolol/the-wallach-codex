---
name: testing-probes
description: Read before authoring a render probe or unit test, or when deciding how to verify a change. Covers what a headless probe must assert, when a probe beats a unit test, and the sharp limit on what any DOM probe can prove.
---

# Testing

## Render probes
Headless puppeteer scripts in `tools/probes/render_probe*.js`, one per surface or critical path. Each
navigates the surface, asserts **visible state**, and exits 0 or non-zero. A view chunk is not
shipped until its probe passes.

Per-element header probes must keep a **regression pass on already-shipped elements** -- shared code
changes are easy to make and hard to notice. Assert the shipped headers did not *gain* the new
block, not merely that they still render.

## Unit tests
`dashboard/assets/js/src/**/*.test.ts`, run with
`(cd dashboard && npx vitest run "assets/js/src/state/**")`. An empty-glob exit 1 is N/A, not a
failure -- when no tests exist for a surface yet, the probe is the verification surface.

## Which one
Pure function in `state/` or `core/` -> unit test. DOM render, event wiring, cascade through a
chokepoint -> render probe. Both apply often enough that "both" is the common answer.

## What a probe cannot prove
**A DOM probe is not a visual check.** It compares text against text. It is blind to a stroke routed
through a label, to a label painted before an opaque shape that covers it, and to anything simply
being ugly. A needle drawn through a word passed every check and shipped. Screenshot it, then stop
for human eyes -- see the `visual-verification` skill.

**A static gate proves guard code EXISTS, not that it RUNS.** Pair one with a probe that exercises
the behavior, and ship a negative control proving the detector actually fires. A check that has never
failed on purpose has not been tested.
