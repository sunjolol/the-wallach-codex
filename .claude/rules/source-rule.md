# Source rule (§00.A) — Wallach as immutable cornerstone

_Read before any work that touches a numeric target, dose, deficiency indicator, or health claim. The detail behind CLAUDE.md §00.A._

## Pattern
Exactly one source — Wallach — defines every recommended amount the app shows; a tight allowlist defines what else may reach the user. Nothing outside it reaches the user without an explicit, multi-step override. The rule is enforced in code, not by vigilance.

## The rule
**Every recommended amount, dose, range, daily target, deficiency indicator, or health claim displayed by the system traces to a Wallach corpus primary. No exceptions — including the user. Youngevity contributes product COMPOSITION only (what a product contains) and NEVER a recommended amount or target.**

The split that keeps the cornerstone intact:
- **Amounts / doses / ranges / targets / deficiency signs / health claims → Wallach corpus primary ONLY.** This is the operational source for every target, "% toward goal", "covered?" verdict, and gap-fill.
- **Product composition (the ingredient amounts a product contains) → Youngevity primary.** Composition feeds the coverage MATH (summing what the user's items deliver); it is never itself a target or recommended amount.

### Allowlist (a source is valid iff it is one of)
1. **Wallach corpus primary** — a Wallach-authored/-delivered book (with year), transcript (with date), or protocol. Tokens: `dddl` (Dead Doctors Don't Lie) · `rbs` (Rare Earths: Forbidden Cures) · `eps` (Epigenetics) · `wallach-lecture` (lecture/transcript corpus). **The ONLY valid source for a recommended amount, dose, range, target, deficiency indicator, or health claim.**
2. **Youngevity primary — composition only** — a Youngevity product label, official `youngevity.com` product page, or official company statement. Token: `ygy`. Valid ONLY as a source of product composition (the ingredients + per-serving amounts a product contains). **NEVER a source for a recommended amount or daily target.**

### Retired (was allowlist #3 — now poison)
- **Pack-extrapolation as a target source** — computing a daily target by summing Youngevity labels at a stated daily-servings (e.g. Healthy Body Start Pak component sums). This made Youngevity drive amounts, which R2 (`amounts_wallach_only`) forbids. Youngevity labels still describe composition; they never define what the user should aim for. (The old "two-role split" this enabled is retired — see below.)

### Not allowed
USDA RDIs/DRIs/DVs · general nutrition papers (PubMed/NIH) as a target source · industry bodies · Wikipedia/general reference · other practitioners' protocols (Pauling, Peat, …) even if aligned · "standard"/"conventional" comparison values surfaced to the user · web-search results without primary verification · LLM-generated values without a citation.

## The single source of truth (the "two-role split" is RETIRED)
The old **two-role split** — Youngevity numbers as the OPERATIONAL target source, Wallach relegated to an EDUCATIONAL layer — was poison and is retired (CLAUDE.md §00.A; blueprint R2). It created two definitions of "covered" and let Youngevity drive amounts.

Under the corrected model there is ONE operational source: **Wallach**.
- **Wallach drives every recommended amount / target / dose / range** across every surface — the "% toward goal", "covered?" verdict, gap-fill, and adoption math all read a Wallach-derived target.
- **Youngevity supplies composition only** — the ingredient amounts a product contains, used to compute how much of each essential the user's regimen delivers. Composition is an INPUT to the coverage math, never the target it is measured against.
- Where the corpus has no maintenance-dose claim for an essential yet, the target is an **honest gap** ("no Wallach target stated") until mining fills it — never a Youngevity-derived fallback (blueprint §7.1). This trade keeps the cornerstone intact.

## The three-confirm override protocol
Any proposed change that would introduce a new source of truth, surface non-Wallach values to the user, or otherwise touch this boundary:
1. **Flag** — surface it with the literal tag `[WALLACH-SOURCE-RULE: PROPOSED VIOLATION]`, describing the change, the part of the rule it breaks, and the precedent it sets.
2. **Verify (next turn)** — in a *subsequent* turn (turn-gap mandatory) the user confirms they understand the rule, the violation, and the precedent. State the precedent explicitly.
3. **Final go-ahead (third turn)** — the user gives the exact phrase `APPROVE SOURCE-RULE OVERRIDE`. Nothing else ("yes", "go ahead", "approved") counts.

Symmetric: applies whether Claude or the user initiates. If the user proposes a breach, Claude flags it and runs the protocol — it does not defer to user authority (the user opted into this guardrail against their own drift). Amending the rule itself runs the same protocol plus a user re-statement of the rationale at step 2. Log every triggered review (approved or not) to `chronicle/contradictions/`.

## Not covered by this rule
Mechanism explanations drawn from general biology (descriptive context, not a target source) · engineering tool selection · general reference clearly marked as such and not surfaced as Wallach's view. When ambiguous, apply the rule — over-application is recoverable, under-application erodes the cornerstone.

## Enforcement
_The durable Charter R2 gate landed in Phase C2 (2026-07-05); the 3 transitional `wallach_stance_*` gates that guarded the rotten inline embed retired with it._
- **LIVE (Charter R2 — `amounts_wallach_only`, critical):** every NUMERIC coverage target in `dashboard/assets/data/essentials-targets-data.json` carries a `source_claim_id` resolving to a sealed Wallach `dose` claim that maps the essential's slug; a Youngevity-sourced or unsourced amount is RED. Targets now DERIVE from Wallach base-line supplement-program dose claims (`eden/tools/targets_derive.py`) — Youngevity Healthy Body Start Pak label sums are gone. Essentials with no Wallach maintenance dose show no number (an honest gap, blueprint §7.1), never a fabricated one.
- **WISH remaining (Phase D):** `citations_reference_registry` (book refs = `book_id`, display composed, never hand-typed) + `no_hand_duplicated_canonical` + full `prose_contained` (verbatim → a claim pointer, summary → the prose store). Labeled WISH, not sold as safe (R7).
