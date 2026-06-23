# Logging doctrine — the project remembers everything (and never lies to its future)

_Read when closing a chunk, writing a commit, or deciding what/whether to record. The WHY behind the Round-close ritual; the mechanical HOW lives in `commits-and-rounds.md`._

## Pattern
A project's history is a first-class artifact. Every unit of work records what changed AND why, in a durable, scannable form, so no hard-won lesson is ever lost and a future reader can learn the whole path. The discipline is a meta-safeguard: **build → test → log → repeat**. Logging is not bookkeeping — it is the thing that saved this project, and it is non-negotiable.

## Origin (the WHY, in Luneth's words)
> "The Roman Empire never died, in a sense, because of its logs."

A day-1 mandate, restated at every new beginning so it is never forgotten: never lose how we got here; ensure our history is logged accurately, completely (within file-size reason), and in a way the future can scan and understand. This exact concept — never forgetting our history — saved the project once already.

## The rules
1. **build → test → log → repeat.** No chunk is "done" until it has built, passed its invariants/probe/tests, AND been logged + committed. The cycle itself is the safeguard; run it every time, in order.
2. **Log everything that makes sense.** Record the change, the reasoning, the alternatives weighed, the verifications run + their output, and any deferral. When in doubt, log it — under-logging loses lessons; over-logging is recoverable.
3. **The repo IS the teaching tool.** Lean on Git itself: commit messages + `chronicle/build-log.md` carry the narrative for a future human learner. Write every commit message and build-log line for that reader — what, why, how-verified. Push frequently (when it makes sense) so the repo stays the live, recoverable, teachable record.
4. **Teach without bloating the files.** Narrative lives in Git history, the chronicle, and the Creator's Log — NOT in app code (JSDoc-only; §00.B keeps code pristine). The history carries the story; the code stays clean. Size budgets still bind; completeness is balanced against them.
5. **Never poison the future.** When something is later found false or sub-optimal, the log records the correction explicitly. Superseded info is MARKED as superseded, never silently carried forward as if still true ("older loses" — CLAUDE.md). A wrong premise discovered is itself a logged lesson, and the live handoff is corrected in the same chunk that discovers it.
6. **The Creator's Log documents everything + the reasons.** It is the full ledger of what we did and why, so we never forget the path and future projects can learn from it. (Currently localStorage-only via `state/log.ts::log()`; the file-mirror that makes it CLI-writable is a Phase-2 deliverable. Until it lands, the build-log is the honest stand-in and the gap is logged, never hidden.)

## How to use
- **Closing a chunk:** build → invariants → render probe → one `chronicle/build-log.md` line → Creator's Log event → commit + push. (Mechanics: `commits-and-rounds.md`.)
- **Writing a commit:** address the future learner. State the what, the why, the verification + its output, and any deferred follow-up. The honesty rule binds — if a step was skipped or could not run, say so.
- **Correcting the record:** when a past assumption is disproven, log the correction in the same chunk that finds it and update `chronicle/next-chunk.md` so the next session never inherits the falsehood.

## Enforcement
- `tools/hooks/stop_round_close.py` hard-blocks declaring done without the build-log line + a green board.
- The Round-close ritual (`commits-and-rounds.md`) is the mechanical instance of rules 1 + 3.
- This doctrine is the WHY. If a part can be made machine-checkable later (e.g., a "build-log line accompanies every commit touching `src/`" invariant), promote it per §00.B.
