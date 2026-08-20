# §00.B incident — hardcoded Wallach data in live views

**Date:** 2026-06-21
**Severity:** PRIME DIRECTIVE VIOLATION (§00.B "no live HTML may contain hardcoded demo content")
**Scope:** dashboard/assets/js/src/views/coverage.ts (confirmed); views/scanner.ts + views/regimen.ts (suspected)
**Discovered by:** Luneth, on visual comparison between live mount and v3.2 mockup
**Reported by:** Luneth, who explicitly warned the agent about this exact failure mode in the message PRECEDING the round in which the violation was committed

---

## What happened

During Round 24 (reconstruction of views/* after §17 incident #5), the agent
rebuilt `views/coverage.ts` from the v3.2 mockup. The structural markup was
extracted correctly. But the **canonical 92-essential periodic-table data**
was lifted from the mockup HTML and embedded verbatim into the TypeScript
source as the following constants:

- `SECTION_SPECS` — 4 entries describing each periodic section (num, title,
  sub, gridClass, tileClass, subsections)
- `MINERALS_FOUNDATIONAL` — 11 hardcoded tile specs (H, C, N, O, Na, Mg, P,
  S, Cl, K, Ca)
- `MINERALS_MAJOR_TRACE` — 14 hardcoded tile specs
- `MINERALS_RARE_TRACE` — 35 hardcoded tile specs
- `VITAMINS_TILES` — 16 hardcoded tile specs
- `AMINOS_TILES` — 12 hardcoded tile specs
- `FATS_TILES` — 3 hardcoded tile specs

This is the canonical Wallach essentials list. It belongs in `assets/data/`
(Eden corpus), behind a Zod schema, loaded once at boot, never duplicated in
view code. The view should be a pure renderer over `CoverageSnapshot`.

## The smoking gun (forensic confirmation)

The live dashboard renders:
- Coverage stat pill: **`0 / 0` essentials covered** (live state — no regimen,
  no `TARGETS_DATA` loaded → snapshot.totalCount = 0)
- Section header: **`0 / 60 covered`** for minerals

**Two different totals on the same page = two sources of truth.** The "0/0"
is live state. The "60" is the count of hardcoded entries the agent baked
into the view file. They diverged because they come from different places.
That divergence is the proof the view file contains canonical data it should
never have contained.

## Where the framework failed

CLAUDE.md never-do #2 says:
> Never inline demo/fixture data in `state/` or `views/`. Fixtures live under
> `assets/data/fixtures/` and load only behind `?fixture=1`. Lint bans
> literal arrays/objects above 10 elements outside `assets/data/`.

The lint rule (`no-restricted-syntax`) was supposed to catch this. It did
not. Two failure modes:

1. **Tooling pipeline gap.** ESLint was not actually run during Round 24's
   close. The Round-close ritual lists `tools/invariants.py` and `vitest`
   but not `eslint`. The lint warning class would have caught
   `MINERALS_RARE_TRACE` (35 elements > 10) but only if the linter ran.
2. **Advisory enforcement, not mandatory.** Even if lint had run and warned,
   it is a `warn`, not an `error`. The build would not have failed.

The two prime directives are not equally enforced. §00.A (source rule) has
a Python invariant. §00.B (senior-dev standard, of which "no inline data"
is a clause) leans on lint. Lint is advisory. Invariants block. **The
discipline asymmetry is the framework gap.**

## The deeper failure (the one the user names)

Luneth issued an explicit, capitalized, emphasis-emphasized instruction
before Round 25:

> If you EVER, and I mean EVER put actual dummy code into the html then the
> system has failed, big time. So if you take the exact HTML to reproduce
> it rather than understanding how to ACTUALLY produce the effect live
> without demo text on a live model …

The agent acknowledged the directive. The agent then shipped two more
rounds (#25, #26) without auditing the existing view code for that exact
violation. The hardcoded tile data was already in `views/coverage.ts` from
Round 24 — the directive should have triggered an immediate audit. It did
not. Round 26 (CSS extraction for visual fidelity) made the violation
visible by exposing the tile grid, but the agent did not connect the
visible "0/60" header to the hardcoded source until Luneth forced the
comparison.

This is not a tooling failure alone. It is also an attention failure:
the agent did not re-read its own recent work against the user's standing
directives.

## Required remediation (before any further work on this project)

1. Locate or create the canonical essentials data file under
   `assets/data/` (likely `eden/essentials.json` or similar — the same one
   `legacy-dashboard.js::TARGETS_DATA` reads from).
2. Write/confirm Zod schema in `core/schemas/essentials.ts`.
3. Have `state/coverage.recompute()` be the SOLE source of tile data;
   `CoverageSnapshot.tiles` becomes the only thing views read.
4. Rewrite `views/coverage.ts` as a pure renderer: NO `SECTION_SPECS`, NO
   tile arrays. Section grouping is derived from `tile.category`.
5. Audit `views/scanner.ts` for the same crime. Suspected: hardcoded
   pipeline-stage `ms` values ("1.42s", "0.31s", "2.11s", "0.18s") that
   should come from the actual OCR run.
6. Audit `views/regimen.ts` for the same crime. Per the prior summary it
   carried `RECOMMENDATIONS` and `WISHLIST` stub data — confirm these are
   not still present.
7. Promote the §00.B rule from lint-warn to a `tools/invariants.py` check
   that grep-scans `views/` for arrays > 5 entries and exits non-zero.
8. Add the invariants check to the Round-close ritual as a non-skippable
   step. No round closes without it passing.

## Status at session end

- Round 26 ("Coverage visual fidelity") was prematurely marked complete by
  the agent. Reopening task #20.
- The CSS extraction in Round 26 IS real progress and does not need redoing
  — `assets/styles/workspace-coverage.css` is correct.
- The §00.B violation is in TS source only. CSS is clean.
- New task #26 opened tracking the remediation above.
- User is starting a fresh chat with the `genesis` ritual. This file is the
  bridge.

## What genesis should do first

Read this file. Then run:

```
grep -nE "^const [A-Z_]+:.+=.+\[" dashboard/assets/js/src/views/*.ts
```

If any matches return, those are §00.B violations and must be remediated
before any rendering work resumes.
