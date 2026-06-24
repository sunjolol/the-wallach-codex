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
