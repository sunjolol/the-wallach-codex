# Omega-9 label correction — the 90-nutrients graphic mislabels Omega-9 as "Arachidonic"

**Date:** 2026-07-08 · **Raised by:** Luneth · **Type:** §00.A canon correction (source-graphic factual error) · **Status:** RESOLVED + applied

## The error
The 90-For-Life "ESSENTIAL" graphic (`eden/graphics/90-nutrients-front.jpg`) — the project's authoritative source for the 91-essentials membership + names ([[essentials-authority-graphic]]) — labels the 91st nutrient (the Omega-9 slot) as **"Arachidonic / Oleic."** That is biochemically wrong: **arachidonic acid is an Omega-6**; the Omega-9 fatty acid is **Oleic Acid (OA)**. This is the graphic's ONE known factual error (surfaced while reviewing the A2 coverage-matcher work, where the fatty-acid resolver classified "arachidonic" as Omega-6 — correctly — which flagged the contradiction with the graphic's Omega-9 label).

## The ruling (Luneth 2026-07-08)
Correct the omega **labels** to their proper primary fatty acids, across the app:

| Family | Primary acid (the label) | Additional forms (→ clarity alert) |
|---|---|---|
| Omega-3 | Alpha-Linolenic Acid (ALA) | EPA, DHA |
| Omega-6 | Linoleic Acid (LA) | GLA (Gamma-Linolenic Acid) |
| Omega-9 | Oleic Acid (OA) | — |

"Arachidonic" is removed from every essential **label**. The additional forms move out of the label into a per-omega **clarity alert** on the essentials deep-dive — GENERAL reference, explicitly marked **not a Wallach claim** (§00.A permits clearly-marked non-Wallach educational context). GLA's correct name is **Gamma-Linolenic Acid** (the graphic-era "gamma linoleic" is a common misnomer).

## Precedent + boundary
- The graphic REMAINS the §00.A authority for essentials **membership** (Omega-9 is still the 91st, still non-essential, never dropped). This corrects a single **naming** error, not the membership doctrine. The `essentials-authority-graphic` memory now records this as the graphic's one documented exception, so no future session "restores" arachidonic to match the graphic.
- **Wallach's own words are UNTOUCHED.** His claim verbatim ("the essential fatty acids (linoleic, linolenic, and arachidonic acids)") stays exactly as written in the sealed corpus — this corrects the *essential label*, not his prose. The `arachidonic → omega-6` resolver keyword also stays (correct biochemistry).

## What changed (files)
- **Sealed canon:** `eden/corpus/essentials-canon.json` — the 3 omega `layout_key`s (re-sealed via `corpus_seal.py`, user-authorized; `knowledge_version=305`).
- **Lockstep join-key files** (the `layout_key` is the coverage↔snapshot join key): `coverage-layout-skeleton.json` (`key` + tile `hint`), `scanner-corpus-data.json` (keys), `regimen-base-data.json` (names). Derived artifacts (targets / coverage-layout / corpus-embed) regenerated.
- **New non-Wallach clarity store:** `dashboard/assets/data/fatty-acid-clarity-data.json` (+ `core/schemas/fatty-acid-clarity.ts`, MANIFEST-accounted) → rendered as a per-omega alert in `views/knowledge.ts` deep-dive.
- **Resolver:** `nutrient_resolve.py` comment + self-test updated (the explicit-Omega-N-wins rule + arachidonic→omega-6 assertion).

Related: [[essentials-authority-graphic]] · the earlier omega-9-is-non-essential ruling in `2026-06-24-source-rule-90-essentials-omega9.md`.
