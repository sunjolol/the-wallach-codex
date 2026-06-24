# Source-rule review — Germanium replaces Fluoride in the 60 minerals; Fluoride scrubbed

**Date:** 2026-06-24
**Type:** §00.A review (canonical-membership correction + removal of a possibly-contaminated entry). NOT a three-confirm override — an alignment TO the cornerstone. Logged per `source-rule.md` ("Log every triggered review, approved or not").
**Surface:** the shared essentials data system — `knowledge/essentials-targets.json`, the `essentials-targets-data` embed in `dashboard.html`, `essentials-targets-data.json`, `essentials-benefits-data.json`, `coverage-layout-data.json`; consumed by Coverage + Knowledge + Scanner + Regimen.
**Initiated by:** Claude (found the conflict while resolving the Germanium open item from [`2026-06-24-source-rule-90-essentials-omega9.md`](2026-06-24-source-rule-90-essentials-omega9.md)). **Ruled by:** Luneth.

---

## The conflict found

The prior omega9 report flagged "the embed carries 61 minerals while the layout/totals say 60; the extra is Germanium — is it one of the 60?" Investigating surfaced a sharper picture:

- `knowledge/essentials-targets.json` was **internally inconsistent**: `totals.minerals = 60` but its `categories.minerals` array held **61** entries (it contained BOTH Germanium AND Fluoride).
- The `essentials-targets-data` embed (and data-dir mirror) carried **92** entries (61 minerals incl. both).
- The Coverage **layout** carried **60** minerals but the WRONG 60 — it had **Fluoride** and was **missing Germanium**.

So the layout had the right *count* (60) but the wrong *membership*: Germanium dropped, Fluoride counted in its place.

## Corpus confirmation (Wallach allowlist)

Both Germanium and Fluoride are *individually* attested as Wallach-essential, so the decision is not "which is real" but "which is one of the enumerated 60":

1. **Wallach's enumerated "90 For Life — Essential" graphic** (`knowledge/health-resources/TRANSCRIPTIONS.md`), cross-confirmed across **four primaries** (Hell's Kitchen 60-mineral 3-column list, *Rare Earths* "Nb—Niobium" entry, DDDL 2011 EPUB, Dirobi/Harada PNG), lists **exactly 60 minerals — Germanium IS one (slot 20), Fluoride is NOT listed.**
2. **Germanium** — DDDL (1999) immune protocols (50 mg/day) + *Rare Earths* appendix deficiency profile (20–30 mg/day maintenance). Essential AND in the enumerated 60.
3. **Fluoride** — was on the *Let's Play Doctor* baseline supplement table (20 mg/day, osteoporosis-Rx). Essential as a substance, BUT absent from the enumerated 60-graphic, and Wallach is emphatically anti-(municipal)-fluoride. See [`../evals/2026-06-11-fluoride.md`](../evals/2026-06-11-fluoride.md).

## Luneth's ruling

> "Germanium takes Fluorine/Fluoride's place BUT YOU COMPLETELY DELETE FLUORINE/FLUORIDE FROM THE ESSENTIALS SYSTEM ALTOGETHER … we will re-include it later based on what he is *actually* saying not what an earlier version of Claude hallucinated him saying."

Luneth's stated concern: the Fluoride essential entry likely traces to an **earlier Claude hallucinating one of his own conversations** about a specific fluoride transcript, rather than to a clean primary read — so it must be pulled now and re-adjudicated against the actual Wallach books in a dedicated audit, not carried forward on a suspect citation.

**Verdict: Germanium IN the 60 (added to the layout, replacing Fluoride's tile). Fluoride fully removed from the live essentials system. Count holds at 90** (60 minerals + 16 vitamins + 12 amino acids + 2 essential fatty acids; Omega-9 non-essential per the prior report).

## Implementation (this chunk)

- **Fluoride scrubbed** from 5 live data locations: `essentials-targets.json` (60 minerals now), the `essentials-targets-data` embed, `essentials-targets-data.json`, `essentials-benefits-data.json`, and the layout tile (replaced with a `Germanium` tile, atomic 32, `Ge`). `wallach_stance_embed_sync` now reports 91 stance entries byte-equal across canonical↔embed.
- **Count unified at 90** behind one exported helper `essentialCount()` in `state/coverage.ts` (layout-derived: tiles where `essential !== false`). Hero, section sub-counts, Scanner, and Regimen all read it — the drifted `92`/`91` literals are gone.
- **Full names everywhere** (no abbreviations, per Luneth): all layout display names expanded (`MAGNES.`→`MAGNESIUM`, `SILICON`→`SILICA`, vitamins/aminos likewise); tile CSS widened (`auto-fill minmax`, grow-to-fit, wrap). Vitamin + amino tiles unified to the mineral format (code top-left, glyph centered, full-width name strip — which also fixed a left/right gap on the vitamin name strip).

## NOT touched — preserved deliberately

- **`knowledge/_wallach_stance_candidates.json`** — left intact. It is a non-runtime, regenerable staging sidecar holding **raw corpus-search passages** — exactly the audit material the later re-evaluation needs. Removing it would destroy that input.
- **Historical record** — the embedded Creator's Log / saga narrative, the [`fluoride eval`](../evals/2026-06-11-fluoride.md), and the Wallach corpus books/transcripts are **history** and stay untouched (logging-doctrine: never erase the past; the correction is logged forward).

## Open items flagged for the dedicated corpus audit (Luneth's domain)

1. **Re-adjudicate Fluoride** against what Wallach *actually* states in the books (not the suspect hallucinated-conversation citation), then decide if/how it re-enters.
2. **Audit the provenance** of the Fluoride/transcript claim recorded in the fluoride eval — confirm which parts are real primary reads vs hallucinated.
3. **Cysteine vs Taurine** — the layout aminos list **Cysteine**, but Wallach's enumerated graphic has **Taurine**. Same class of discrepancy as Fluoride; spotted this chunk, NOT acted on (membership/data = Luneth's batch domain).
4. The "definitively log all essentials from the books and attach to the table" pass Luneth described — this record is a thread into it.
