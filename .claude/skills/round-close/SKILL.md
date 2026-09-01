---
name: round-close
description: Read when closing a chunk, writing a commit, appending to the build log, or firing a Creator's Log entry. Covers the seven-step round-close ritual, the plain-language-first logging standard, and why the Creator's Log is append-only and untouchable.
---

# Round close, commits, and the logging covenant

## The ritual -- a chunk is not shipped until all of these pass
1. `node tools/build.mjs` exits 0.
2. `PYTHONUTF8=1 python tools/invariants.py` -- zero NEW reds.
3. The render probe for any touched surface exits 0.
4. One line appended to `chronicle/build-log.md`.
5. A Creator's Log event via `tools/creators_log.py append`.
6. **`node tools/build.mjs` again, AFTER step 5.** The offline app inlines the log embed at *build*
   time, so an entry logged after step 1 is not in the shipped bundle until you rebuild. Skip this
   and the in-app log silently goes stale while the ledger looks complete.
7. **The SECOND distribution, if any shipped artifact moved.**
   `PYTHONUTF8=1 python tools/build_web.py`, then
   `node tools/probes/render_probe_web_build.js`. The website is a live target with its own
   build, and steps 1 and 6 rebuild only the `file://` one — a round that ends here leaves
   nutrientcodex.com a full round behind. **It has to come AFTER step 5**, because the web build
   ships the Creator's Log embed too. `web_build_not_stale` REDs on exactly this and will not
   let step 8 happen without it. Uploading is HIS act, not yours; `render_probe_live_host` is the
   instrument for after he uploads.
8. `git commit` + `git push`.

`tools/hooks/stop_round_close.py` hard-blocks on 2, 5, and 6. Step 7's first half is gated by
`web_build_not_stale`. The rest is discipline.

## Plain-language first, then the complete technicals
Every build-log line, commit body, and Creator's Log `detail` **opens** with a short plain-language
statement of what changed and why, in terms a non-expert can follow -- the reader may not be a
programmer, so write it for them -- then a **blank line**, then the full technical record. The technicals stay whole;
nothing is cut for brevity.

**Honesty outranks format.** Never pad or invent a plain lead to satisfy the shape. A short true
entry beats a padded one. There is deliberately no machine minimum-length check, because a floor
would breed exactly the padding this forbids.

## Shapes
Build-log line:
`[YYYY-MM-DD HH:MM <TZ>] <surface> · <plain language> · <files, specifics, verifications + output> · <deferrals>`

Read `<TZ>` off the machine clock every time. Never predict it -- the clock crossed midnight
mid-session once and a line had to be corrected before commit.

Commit: subject `<scope>: <imperative>`; body opens plain, blank line, then the technical record and
verification output; trailer `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`. Use
`git commit -F <BOM-less message file>` to dodge Windows BOM issues.

Creator's Log: `--summary` is a single plain-language headline (<= 280 chars, no newline);
`--detail` opens plain, blank line, then uncapped technicals. Long bodies go through a script, not a
shell argument -- nested heredocs mangle them here.

## The covenant -- the Creator's Log is sacred
Append-only. **Never deleted, edited, reordered, or pruned.** A broad authorization to delete files
never includes it; "clean up freely" is not grounds to remove one entry. If removing it ever seems
necessary, **stop and ask**. The sanctioned writer is `tools/creators_log.py append`, which has no
delete path.

Why it exists: *"The Roman Empire never died, in a sense, because of its logs."*
History lives in two layers by design -- the public GitHub/build-log layer that teaches a future
reader, and this local-first ledger that survives even if that layer vanishes.

## Never poison the future
When something is later found false, log the correction in the same chunk that finds it and fix
`chronicle/next-chunk.md` so the next session cannot inherit the falsehood. Superseded information is
marked superseded, never carried forward as if still true.

If a ritual step cannot be completed, say so in the build-log line and the commit body. Never
silently skip and claim done.
