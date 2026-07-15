# Source-rule review — "90 essential nutrients" + Omega-9 as non-essential

**Date:** 2026-06-24
**Type:** §00.A review (canonical count + a Wallach health-classification). NOT an override — an alignment TO the cornerstone. Logged per source-rule.md ("Log every triggered review, approved or not").
**Surface:** Knowledge drawer Essentials tab (this chunk) + the shared `coverage-layout-data.json`; Coverage + Scanner + Regimen pending (next session).
**Initiated by:** Luneth. **Confirmed by:** Claude (corpus search), per his "do not take my word for it but confirm, as always."

---

## The proposed change

Reframe the essentials count from the drifted **91/92** to **90** — Wallach's own headline number — and classify **Omega-9 (Arachidonic / Oleic)** as **non-essential**: still shown + still covered with all the same math, but NOT counted toward the 90, and visually distinct (a "bonus" nutrient included by Youngevity for cardiovascular balance / optimal absorption).

Breakdown: **60 minerals + 16 vitamins + 12 amino acids + 2 essential fatty acids = 90.** Omega-9 is the 3rd fatty acid shown but non-essential.

## Why this is alignment, not an override (§00.A)

The source rule's three-confirm protocol guards against surfacing **non-Wallach** values. Here the change moves the displayed number TOWARD the Wallach primary, so it honors the cornerstone rather than breaching it. The turn-gap/override phrases were therefore not required; this note is the transparency log.

## Confirmation against the Wallach allowlist

1. **`wallach-lecture`** — the corpus contains multiple Wallach lectures literally titled **"The 90 Essential Nutrients By Dr. Joel Wallach"** (`knowledge/corpus-changelog.md`, e.g. the `-xgk8KzaE4Bo` / `-u4iBvAr1lXU` / `-vJFT6OgZk6w` transcripts). 90 is unambiguously Wallach's own framing.
2. **Project canonical (Eden + targets DB).** The sealed `eden/eden-catalog.json` already describes "Foundational coverage of the **90 essentials**." The targets DB note (`knowledge/essentials-targets.json`) admits its own 60+16+12+3=91 sum does not cleanly reach 90.
3. **Omega-9 non-essential — stated in our own canonical Wallach stance.** The `essentials-targets-data` `wallach_stance.quote` for Omega-9 reads verbatim: *"Omega-9 fatty acids (oleic acid, arachidonic acid) are technically non-essential since the body can synthesize them, but Wallach's framework treats them as essential-for-supplementation…"* The `essentials-benefits-data` echoes it: *"conditionally essential per Wallach if linoleic is deficient."*

**Verdict: CONFIRMED.** 90 is the Wallach number; Omega-9's non-essentiality is documented in the project's own sealed Wallach-sourced data. The change is source-rule-clean.

## Implementation (this chunk — Knowledge only)

Single source: `coverage-layout-data.json` Omega-9 tile gains `"essential": false` (+ `LayoutTileSchema.essential`, documented). The count derives from `essential !== false` (→ 90). Tab badge "90 ESSENTIAL", featured-citation corrected to "2 essential fatty acids — 90 essentials total", section head "FATTY ACIDS · 2 + 1", Omega-9 a teal `--bonus` tile, the non-essential explanation on-click in the deep-dive (coverage status retained).

## Open item flagged for the next session (Germanium)

The targets DB **embed** carries **61** minerals while the layout + canonical totals say **60**. The extra is **Germanium** (in `essentials-targets-data`, absent from `coverage-layout-data.json`). Germanium is a real Wallach DDDL trace element, so this is a genuine "is it one of the 60?" reconciliation — deferred to next-genesis per Luneth, see `chronicle/next-chunk.md`. Until resolved, displayed counts are driven from the **layout essential set** (90), not the 92-entry embed.

---

## ⚠ CORRECTION APPENDED 2026-07-15 — every evidence leg of the verdict above is DEAD

_Appended, never edited: this file is part of the record and the original stands as written.
Rule 5 of the logging doctrine — "never poison the future" — requires the correction to sit
beside the claim, not replace it._

**The verdict above ("Verdict: CONFIRMED") still stands in the record and its three cited
evidence legs have all since been retired, deleted, or declared poison. Not one survives.**

| # | The leg as cited 2026-06-24 | Status 2026-07-15 |
|---|---|---|
| 1 | `wallach-lecture` transcripts titled "The 90 Essential Nutrients By Dr. Joel Wallach" | **RETIRED.** The entire lecture/transcript source class was removed 2026-07-05 — Luneth: "we are only using things Wallach has directly said in his books". The `wallach-lecture` token is gone from the §00.A allowlist. |
| 2 | `eden/eden-catalog.json` + `knowledge/essentials-targets.json` | **CIRCULAR, and both DELETED.** These were our own app files. Citing them as evidence for a canon value is the same closed loop that produced the mineral-tier defect: the canon agreeing with an artifact the canon was derived from. `eden-catalog.json` was deleted 2026-07-08 (A1). |
| 3 | The `essentials-targets-data` `wallach_stance.quote` for Omega-9 | **DECLARED POISON, DELETED** in Phase D-b. The whole `wallach_stance` embed was the rotten inline surface the overhaul removed; its 3 transitional gates retired with it. |

### The conclusion is nevertheless TRUE — and that distinction is the point

**90 is Wallach's own number, and it is externally anchored in his book bytes.**
`eden/corpus/books/dddl-third-edition-2011.txt:4196`, his words:

> consuming all 90 essential nutrients in optimal amounts each day to
> warranty that you will properly develop, maintain, and repair your body.

The phrase "90 essential nutrients" recurs throughout DDDL (4196, 10870, 10939, 11210,
11236, 11306, 11391, 11541, 11632, 11760, 11870, …). Anyone re-auditing this can stop
worrying about the 90.

**So the verdict was right — but not for the reasons it gave.** It was right by luck. Had
Wallach's books said 88, this verdict would have said CONFIRMED just as confidently, because
not one of its three legs ever touched a book. It cited a lecture (not a book), two of our
own app files (circular), and a quote from an embed we later called poison. That is the
exact failure mode this project spent 2026-07-15 excavating: **confident prose resting on an
anchor that was never external.**

### What is anchored, and what is still not (as of 2026-07-15)

- **The COUNT (90) — externally anchored.** DDDL book bytes, above. Safe.
- **The MEMBERSHIP (which 91 substances), the TIER PARTITION (foundational 11 /
  major_trace 14 / rare_trace 35), and the mineral SYMBOLS/atomic numbers — NOT anchored.**
  They trace to `dashboard/components/workspace-coverage-v3.2-PROPOSAL.html`, a **UI design
  mockup** (2026-06-21), via `views/coverage.ts` → `coverage-layout-data.json` → the canon
  bootstrap on 2026-06-24 — three days after the mockup, which is why this verdict exists at
  all. `essentials-canon.json`'s own `provenance` field says so in plain text. The smoking
  gun: the canon's `rare_trace` order is alphabetical **by atomic symbol** (Ag, Al, As, Au,
  Ba, Be) — not by name — which is how a list is lifted off a rendered table, not authored
  from a book.
- **Wallach never enumerates the tiers.** He names three categories exactly once
  (`immortality.txt:3760-3766`: "Major minerals / Trace minerals / Rare earths") and never
  assigns elements to them. The words "foundational", "major trace" and "rare trace" appear
  **zero** times in all seven books. All four of his A-Z element sections are explicitly flat
  ("in alphabetical order according to the chemical symbols of each"). See the 2026-07-15
  build-log entry.
- **Omega-9's non-essentiality** — leg 3 is dead, so this rests on the sealed graphic
  (`eden/graphics/90-nutrients-front.jpg`, the 90/91 authority per Luneth's ruling) and on
  Luneth's own ruling, NOT on the deleted `wallach_stance` quote this verdict cited.

### The lesson, stated so a future reader does not have to re-derive it

A verdict is only as durable as its ANCHOR. Three legs, all internal, all gone within three
weeks — while the verdict text stayed authoritative in the record and nothing re-checked it.
There is no gate for "an old verdict's evidence has rotted", and there probably cannot be a
non-gaming one. So: **when a source class is retired or a file is deleted, grep the chronicle
for anything that cited it.** That is discipline, labeled as discipline (R7), not a promise.
