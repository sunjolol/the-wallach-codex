# Source-Rule Audit Log

Every triggered review of the Wallach source-rule (see `source-rule.md`),
whether approved or rejected, is logged here. Append-only. Format:

```
## [YYYY-MM-DD, Round N] — [PROPOSED|APPROVED|REJECTED|WITHDRAWN]

**Initiated by:** Claude | User
**Proposed change:** [one-line description]
**Rule clause affected:** [reference to source-rule.md section]
**Rationale offered:** [why the change was proposed]
**Precedent if approved:** [what this would imply for future cases]
**Step 2 understanding confirmation:** [user's stated understanding]
**Step 3 final approval:** [verbatim user response, or "rejected"]
**Outcome:** [what was done]
```

---

## [2026-06-14, Round 46] — RULE ESTABLISHED

**Initiated by:** User
**Proposed change:** Establish the Wallach source-rule as immutable cornerstone
  with three-confirm override protocol.
**Rule clause affected:** N/A — this is the rule's establishment.
**Rationale offered:** "Dr Wallach is the source of truth, the cornerstone that
  makes all of this work, those rules I set early on must never be broken. If I
  ever say anything that seems to break any of these important principles, it
  must require a manual review, SEVERAL confirmations so it can NEVER happen
  accidentally."
**Outcome:** Rule formalized in `source-rule.md`. Three-confirm protocol
  codified. Symmetric application (covers Claude AND user-initiated
  violations) confirmed. Audit log (this file) created. Integrity tool
  validator `check_source_rule` queued for Round 46 implementation.

(No three-confirm cycle needed for establishment — rule is being created,
not violated.)

---

## 2026-06-14 at 4:02 PM — Round 56 — Cornerstone flipped warn-only → ERROR-MODE

**What happened.** All 92 essentials-targets entries received explicit `source` field backfill, drawn from the dashboard embed's Round 31 citations (themselves authored against the source-rule allowlist when the embed was built). The integrity tool's `check_source_rule` was updated to enforce the Wallach/Youngevity allowlist via case-insensitive marker matching — any source string lacking a known Wallach corpus reference, Youngevity product name, or pack-extrapolation citation now fails the integrity check.

**One real audit catch.** Oxygen was flagged at the flip: its source field had been seeded as "none — pending discovery" back when the embed was built (one of the few genuinely unsourced entries in the 90 essentials, because Wallach's framework handles oxygen via breathing + diet with no individual daily target). Updated to "Wallach 90-essentials list (Let's Play Doctor baseline) — atmospheric/dietary delivery, no individual supplement target stated" — which IS allowlisted (mentions Wallach + LPD), accurate (Wallach lists oxygen in his 90 essentials), and honest about the no-supplement-target reality.

**Outcome.** Cornerstone goes from policy → enforced invariant. 15 integrity checks all green. Any future essentials-targets edit without a Wallach/Youngevity primary source fails the check before merge.

**Allowlist markers as of this flip** (canonical list in source-rule.md §Allowlist; mirrored in `tools/dashboard_integrity.py` `check_source_rule` `ALLOWLIST_MARKERS` list):

- **Wallach corpus**: wallach, DDDL, Let's Play Doctor, Dead Doctors Don't Lie, Hell's Kitchen, Rare Earths, Wallach Files
- **Youngevity primary**: youngevity, Beyond Tangy Tangerine, BTT, Ultimate Tangy Tangerine, UTT, Beyond Osteo FX, Ultimate EFA Plus, Survival Shield, plant-derived mineral, Healthy Body Start Pak, HBSP, Ultimate Iodine, Slender FX, ReVERSE!®, Ultimate Hair, Colloidal Silver, Glucogenix, Rebound FX, Ultimate Cardio

**Three-confirm override protocol unchanged.** Amendments to the rule itself or to the allowlist still require the literal phrase `APPROVE SOURCE-RULE OVERRIDE` at Step 3, with the additional requirement that the user re-state the rationale at Step 2 if the cornerstone itself is being amended.
