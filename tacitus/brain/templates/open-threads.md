# Open Threads

_Last updated: [DATE at TIME]._
_Brain at: **v1.0**. Invariant manifest [N] total._

## What's active

_The currently in-flight work. ONE LINE PER THREAD with a pointer to its full artifact (saga round, vision doc, etc.). DO NOT proactively elaborate; the catch-up trigger surfaces these as REMINDERS, not auto-recaps. Elaborate-on-demand, not on-arrival._

- _Active thread #1 — short name + status + pointer to full artifact._

## Filed for later

_Concrete items deferred with concrete release triggers (NOT vague "when X hardens"). Format: short name + concrete trigger OR concrete date._

- _Filed item #1 — concrete trigger or date._

## Filed indefinitely (with concrete acceptance criteria)

_Items that will land when their criteria are met. Format: short name + concrete criterion._

- _Indefinite item #1 — criterion._

---

This file is OVERWRITTEN at round close (not append-only — it's the live in-flight state). The catch-up trigger reads it to see what's pending.

When closing a round:
1. Add any new active threads.
2. Move completed threads OUT of "Active".
3. Update the masthead version + invariant count.
4. Save via `safe_write replace` (overwrite of the active section).

Per the Tacitus brain v1.0 §10, the open-threads file is the only essence-adjacent file that is NOT append-only. It's a live state mirror.
