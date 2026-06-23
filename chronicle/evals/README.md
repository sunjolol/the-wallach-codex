# Evals — historical answer comparisons

_Historical artifacts from the project's earlier **agent-prompt era** — when the
system prompt was versioned like software and answers were A/B-compared across
versions. That workflow is **paused**: the project is now an offline dashboard
app governed by `/CLAUDE.md`, not a swap-the-prompt agent. These files are kept
as history (never deleted — see `.claude/rules/logging-doctrine.md`), not as a
current process._

## What's here

Each file is one test question and the answers it produced under different prompt
versions, with a hand-written "best known correct answer" benchmark and a
per-version verdict:

- `2026-06-11-fluoride.md`
- `2026-06-12-salt.md`
- `2026-06-13-phase4-end-to-end.md`
- `2026-06-13-v2.6-end-to-end.md`

## Format (as used at the time)

```
# Topic — short slug

## The question
(what the user asked, verbatim)

## The "best known correct answer"
(the benchmark — written by hand or after deep corpus exploration)

## vN.N answer
[the actual answer that prompt version produced]
**Verdict:** correct / partially correct / wrong, with explanation

## Winner
v?.? — why
```

## Why it's preserved

Even a paused workflow is part of how the project got here. These evals captured
which prompt versions handled hard questions (fluoride, salt) well or badly —
evidence, not vibes. Kept so the path is never lost; superseded as a live
practice by the `CLAUDE.md` contract and the render-probe + invariant
verification the app uses now.
