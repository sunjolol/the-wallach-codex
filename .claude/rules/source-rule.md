# Source rule (§00.A) — Wallach as immutable cornerstone

_Read before any work that touches a numeric target, dose, deficiency indicator, or health claim. The detail behind CLAUDE.md §00.A._

## Pattern
Exactly one allowlist defines what counts as truth for every health number the app shows. Nothing outside it reaches the user without an explicit, multi-step override. The rule is enforced in code, not by vigilance.

## The rule
**Every numeric target, dose recommendation, deficiency indicator, or health claim displayed by the system cites a primary source from the allowlist below. No exceptions — including the user.**

### Allowlist (a source is valid iff it is one of)
1. **Wallach corpus primary** — a Wallach-authored/-delivered book (with year), transcript (with date), or protocol. Tokens: `dddl` (Dead Doctors Don't Lie) · `rbs` (Rare Earths: Forbidden Cures) · `eps` (Epigenetics) · `wallach-lecture` (lecture/transcript corpus).
2. **Youngevity primary** — a Youngevity product label, official `youngevity.com` product page, or official company statement. Token: `ygy`.
3. **Pack-extrapolation derived** — a value computed purely by summing Youngevity primary labels at Wallach's stated daily-servings (e.g. Healthy Body Start Pak component sums). The source must reference both the Wallach pack recommendation and the Youngevity component labels.

### Not allowed
USDA RDIs/DRIs/DVs · general nutrition papers (PubMed/NIH) as a target source · industry bodies · Wikipedia/general reference · other practitioners' protocols (Pauling, Peat, …) even if aligned · "standard"/"conventional" comparison values surfaced to the user · web-search results without primary verification · LLM-generated values without a citation.

## The two-role split (operational vs educational)
- **Youngevity-derived numbers** are the **operational** source — they drive ALL daily targets, "% toward goal", "covered?" classification, gap-fill, and adoption math across every surface.
- **Wallach's book/transcript stances** are the **educational** layer — quotes/citations that explain *why* the operational target sits where it does, presented as context, never as a competing threshold for verdict math.

Both remain allowlisted; what differs is the role each plays per surface. This eliminates the "two definitions of covered" contradiction while preserving Wallach's voice as the framework authority.

## The three-confirm override protocol
Any proposed change that would introduce a new source of truth, surface non-Wallach values to the user, or otherwise touch this boundary:
1. **Flag** — surface it with the literal tag `[WALLACH-SOURCE-RULE: PROPOSED VIOLATION]`, describing the change, the part of the rule it breaks, and the precedent it sets.
2. **Verify (next turn)** — in a *subsequent* turn (turn-gap mandatory) the user confirms they understand the rule, the violation, and the precedent. State the precedent explicitly.
3. **Final go-ahead (third turn)** — the user gives the exact phrase `APPROVE SOURCE-RULE OVERRIDE`. Nothing else ("yes", "go ahead", "approved") counts.

Symmetric: applies whether Claude or the user initiates. If the user proposes a breach, Claude flags it and runs the protocol — it does not defer to user authority (the user opted into this guardrail against their own drift). Amending the rule itself runs the same protocol plus a user re-statement of the rationale at step 2. Log every triggered review (approved or not) to `chronicle/contradictions/`.

## Not covered by this rule
Mechanism explanations drawn from general biology (descriptive context, not a target source) · engineering tool selection · general reference clearly marked as such and not surfaced as Wallach's view. When ambiguous, apply the rule — over-application is recoverable, under-application erodes the cornerstone.

## Enforcement
- Invariant `wallach_stance_source_rule` (critical) — every `wallach_stance.citation` in `knowledge/essentials-targets.json` cites an allowlisted primary. The allowlist lives in-code (`tools/invariants.py` + `tools/dashboard_integrity.py`'s markers); if it grows, both update in the same patch.
- Invariant `wallach_stance_embed_sync` — the canonical stance dict is byte-equal in the dashboard embed.
