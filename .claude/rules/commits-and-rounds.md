# Commits + round-close ritual

_Read at chunk close, before declaring done._

## Round-close ritual

A chunk is not "shipped" until **all** of the following pass:

1. `node tools/build.mjs` exits 0.
2. `PYTHONUTF8=1 python tools/invariants.py` ≥ tolerated baseline in `.claude/invariant-baseline.json` (zero NEW reds).
3. The render probe(s) for any touched surface exit 0.
4. A one-line entry appended to `chronicle/build-log.md`.
5. A Creator's Log event fires via `tools/creators_log.py append` (writes the ledger `log.jsonl` + regenerates the build-time embed; the in-app Profile mirror is `wallachCreatorsLog_v1`).
6. **Re-inline the bundle — `node tools/build.mjs`, AFTER step 5.** The offline `file://` app inlines the Creator's Log embed at *build* time (esbuild JSON import), so any entry logged after step 1's build is NOT in the shipped `dist/main.js` until you rebuild. Skip this and the in-app log silently goes stale even though the ledger is complete (2026-07-02 incident).
7. `git commit` + `git push` to the private origin.

`tools/hooks/stop_round_close.py` hard-blocks on step 2 (a NEW invariant red), step 5 (a build-log line with no matching Creator's Log entry), and step 6 (a stale bundle — the ledger head not yet in `dist/main.js`). Steps 1, 3, 4, 7 are surfaced as reminders / session discipline.

## Plain-language first (logging-doctrine rule 7)
Every entry below — build-log line, commit body, Creator's Log `detail` — LEADS with a short plain-language "what changed + why, in human terms" (Luneth is learning to code; write it for him), THEN the complete technical specifics. The technicals stay whole (nothing is cut for brevity). **Honesty outranks format:** never pad or invent the plain lead to satisfy the shape — a short true one is fine, and if there is little to say plainly, the honest short version wins. For multi-line bodies (commit body, Creator's Log `detail`), put a **blank line** between the plain lead and the technical body so the two layers visually separate — the Profile panel renders it (`white-space: pre-wrap`), and git + the build-log show it as a paragraph break.

## Build-log entry shape

Append one line to `chronicle/build-log.md` per chunk close:

```
[YYYY-MM-DD HH:MM <TZ>] <surface> · <plain-language: what changed + why, for a non-expert> · <file(s) touched · technical specifics · verifications run + output> · <deferrals, if any>
```

`<TZ>` = the machine's current local zone — read it from the clock, never hardcode. It kept drifting back to a stale `EDT` after the move to Central; `tools/creators_log.py` already stamps machine-local time, so match that.

## Commit shape

- Subject: `<scope>: <imperative summary>` (e.g. `Chunk 6d: adopt scanned product → §31 saveRgManual → coverage`).
- Body: OPEN with a short plain-language paragraph — what changed and why, in human terms — then a **blank line**, THEN the technical record: link to the build-log line, files touched, verifications run + their output, any deferred follow-ups.
- Trailer: `Co-authored-by: Claude Opus 4.8 <noreply@anthropic.com>`.
- Use `git -C "<repo root>" commit -F <BOM-less message file>` to avoid Windows BOM issues.

## Creator's Log entry shape

`tools/creators_log.py append --surface <s> --kind <k> --summary <headline> --detail <body>`:
- `summary` — a single-line plain-language HEADLINE (≤ 280 chars, hard cap; no newline).
- `detail` — OPENS with the plain-language "what + why in human terms," then a **blank line** (`\n\n`), THEN the complete technical specifics (uncapped — nothing truncated). The Profile panel renders the break (`white-space: pre-wrap`) so it reads as a clean paragraph split. Same rule-7 standard; honesty outranks format.

## Push cadence
Push after every chunk. The private GitHub origin (`the-wallach-codex`) is the recovery anchor and the audit surface for the user.

## Honesty rule
If a ritual step cannot be completed (e.g. Creator's Log is currently CLI-unfireable until the file-mirror lands), say so in the build-log entry and the commit body. Never silently skip and claim "done."
