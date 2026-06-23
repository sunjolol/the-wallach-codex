# genesis/ — the session boot system + the original pass-off archive

This folder has two jobs.

## 1. The genesis boot system

A new Claude Code session opens with the word **`genesis`**. Claude runs:

```
PYTHONUTF8=1 python tools/genesis.py
```

…which prints the boot report — integrity scoreboard, build parity, the latest
Creator's Log entry, the build-log tail, and the **live pass-off**
(`chronicle/next-chunk.md`) — so a fresh session regains past depth instantly and
can pick up where the last one left off. The boot **always ends with an action
question** ("resume X, or redirect?"), never flair alone. Contract: CLAUDE.md
"Genesis".

## 2. The original pass-off archive

`01-pre-handoff-conversation.md` and `02-clarifications-and-plan.md` are the
original Cowork → Claude-Code handoff that shaped the project (vision, phasing,
the §8 deferred-polish scope). Preserved as history; **superseded** as the live
handoff by `chronicle/next-chunk.md`. Read these for origin/vision context, not
for "what's next".

## The two pass-offs — don't confuse them

| | File | Role |
|---|---|---|
| **Live, rolling** | `chronicle/next-chunk.md` | Refreshed every round-close. THE thing `genesis` reads for current state + the next task. |
| **Original, frozen** | `genesis/0*.md` | Historical origin/vision. Never the "what's next". |
