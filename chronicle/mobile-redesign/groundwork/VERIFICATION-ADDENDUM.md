# Groundwork verification addendum — an independent re-measurement

**Date:** 2026-08-23
**Why this exists:** `BRIEF.md` is the foundation every surface design rests on, and it was written
by agents. Per this project's verification doctrine, an instrument is not trusted because it is
confident. I re-derived the load-bearing numbers myself, from the files, without reading the
groundwork's method first.

**Verdict: the groundwork is reliable.** Every CSS count and the hardest data measurement reproduced
exactly. One real correction and one refinement follow, and both change what a designer must build.

---

## Reproduced exactly

| Claim in BRIEF.md | Re-measured | Command |
|---|---|---|
| 13 `vh` values in the stylesheets | **13** | `grep -oE '[0-9.]+vh\b' dashboard/assets/styles/*.css \| wc -l` |
| 0 `dvh` / `svh` / `lvh` | **0** | same, `(dvh\|svh\|lvh)` |
| 0 `env(safe-area-inset-*)` | **0** | `grep -c 'env(safe-area'` |
| 197 `:hover` rules | **197** | `grep -cE ':hover'` |
| 0 `@media (hover: hover)` guards | **0** | `grep -c 'hover: *hover'` |
| 0 `touch-action` | **0** | `grep -c 'touch-action'` |
| 363 `color-mix()` uses | **363** | `grep -o 'color-mix(' \| wc -l` |
| 10 `:has()` uses | **10** | `grep -o ':has(' \| wc -l` |
| viewport meta lacks `viewport-fit=cover` | **confirmed** | `dashboard/dashboard.html:30` reads `width=device-width, initial-scale=1.0` |
| A composed claim card maxes at 3,456 characters | **3,456 exactly** | sum of `question + answer_short + answer + verbatim` over `search-index.json` |

**Fuller distribution for the claim card**, which the design needs more than the max alone
(n = 2,579 indexed claims):

| | median | p90 | max |
|---|---:|---:|---:|
| question | 43 | 61 | 93 |
| answer_short | 171 | 260 | 892 |
| answer | 436 | 846 | 2,381 |
| verbatim | 258 | 501 | 1,186 |
| **composed card** | **938** | **1,512** | **3,456** |

A card component must therefore be designed for ~938 characters and must not break at 3,456. The p90
at 1,512 is the number to lay out against; the max is the number to stress-test against.

---

## ⚠ Correction 1 — the target counts are 36 / 55, not 35 / 56

`BRIEF.md` states "56 of 91 essentials have no numeric target. Only 35 do."

Re-measured over `dashboard/assets/data/essentials-targets-data.json`, recursing the whole `target`
object rather than checking top-level keys:

- **91 essentials · 36 carry a number · 55 do not.**

The extra one is a `dietary_with_clinical_lever` essential that does carry a number, so "has a number"
is **not** the same set as `kind == "wallach"` (35 of the 36). Any code that treats
`kind === 'wallach'` as "renders a number" will drop one essential's amount on the floor.

Category split, also re-measured: **minerals 60 · vitamins 16 · amino_acids 12 · fatty_acids 3.**

---

## ⚠ Correction 2 — it is SEVEN target states, not "three flavours"

`BRIEF.md` calls the no-target case "a first-class state in three distinct flavours". The data
carries **seven distinct `target.kind` values**, six of which appear in the no-number set. They are
not cosmetic variants — each says something different, and several map to rulings already on record:

| `kind` | n | What it actually means |
|---|---:|---|
| `wallach` | 35 | A real Wallach amount. The only kind that renders as a target. |
| `trace_pdm` | 34 | No stated amount; **vehicle-supplied** through a PDM bottle. Matches the ratified tin ruling. |
| `dietary_with_clinical_lever` | 15 | No maintenance amount, but a clinical lever exists (14 without a number, 1 with). |
| `dietary` | 3 | Honest gap — no maintenance amount stated. |
| `wallach_collective` | 2 | **One shared amount for a GROUP**, not per-nutrient (the EFA group). Must never render as a per-nutrient target. |
| `mirrors` | 1 | The requirement is met *through another essential* — cobalt mirrors vitamin B12. |
| `unspecified` | 1 | Honest gap. |

**Design consequence:** the entity page and the coverage tile need **seven** rendering paths for
"what is the target here", not two and not four. Collapsing them into "has a target / no target
stated" would flatten a `mirrors` essential into a gap, print a group amount as if it were
per-nutrient, and lose the vehicle-supplied distinction entirely — each of which is a §00.A problem,
not a cosmetic one.

---

## Also measured, for the record

- **Longest essential name: 50 characters** — `Vitamin D2 (Ergocalciferol) + D3 (Cholecalciferol)`.
  Shortest is `Tin` at 3. No chip, tile, or column may be fixed-width.
- **Corpus:** 2,601 claims across 7 books — Dead Doctors Don't Lie 576 · Immortality 515 ·
  Let's Play Doctor 518 · Epigenetics 478 · Rare Earths 375 · Hell's Kitchen 118 ·
  It's All In Your Head 21. The search index holds 2,579 of them plus 547 entities.
- **Data payload: 13 MB** across `dashboard/assets/data/`, dominated by `corpus-embed.json` (2.95 MB)
  and `creators-log-embed.json` (2.67 MB) — the two largest files, and the log is the one the demo
  builder stubs to `[]`.

## What I did NOT verify

The performance timings (FCP 704 ms, Conditions 413–466 ms, search keystroke 1,524 ms), the contrast
ratios, the font-file measurements, and the iframe inference. Those need the instruments that
produced them. The iframe question is settled by the published probe, not by re-reading files.
