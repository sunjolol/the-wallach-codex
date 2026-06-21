# Tacitus Brain — CHANGELOG

Every change to `current.md` is logged here. Newest at top.

---

## v1.0 — 2026-06-19 — Bootstrap brain for standalone Tacitus
**File:** `versions/v1.0-2026-06-19-bootstrap.md`

Initial brain file for The Tacitus System as a portable bootstrap layer for new Claude Cowork projects. Authored at the end of the parent project's (Wallach health framework) Round 151 session, under user direction to *"design a perfect brain file that will serve our purposes and get us off on the right foot."*

Twenty sections, action-language throughout, trigger / action / verify format for binding rules. Each section names the failure mode in the parent project that motivated its inclusion. Heavily references the closed-loop logging discipline (§30 paired-write integrity) and cross-surface state sync (§31 chokepoint pattern) that were the parent project's most expensive lessons.

Companion files:

- `tacitus/brain/README.md` — porting instructions
- `tacitus/brain/templates/` — seed files for the new project's `memory/` directory (engineering-doctrine, operating-protocols, paired-write-catalog, state-mutation-catalog, empty essence files)
- `tacitus/brain/versions/v1.0-2026-06-19-bootstrap.md` — version 1.0 notes

Pending decisions for v1.x:

- Should `tools/safe_write.py`, `tools/invariants.py`, `tools/catchup_seal.py` move INTO `tacitus/tools/` so they port with the Tacitus folder? Currently at parent-project root.
- Should the brain include a generic "source-rule" template for projects with an authority-source (analog of Wallach's immutable cornerstone)? Currently mentioned as a pattern in companion templates but not in the brain itself.
- Round-versioning for the brain itself — currently v1.0; future updates ship as v1.1, v1.2 per saga round.
