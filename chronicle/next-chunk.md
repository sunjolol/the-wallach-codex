# Next chunk — ★ AUTHORITATIVE HANDOFF

_Rewritten 2026-08-03 at the close of the **doctor sweep**. The previous version described an
operating structure that no longer exists (`.claude/rules/`, the 250 KB size budget) and is
superseded in full. Numbers marked ✓ were measured at handoff. Where an older document disagrees,
this one wins._

# ⚠ START HERE
**Restart the session before working.** CLAUDE.md changed again on 2026-08-03 (the board's stated
gate counts); any session started before that holds a stale copy of the contract in context.

Luneth types `genesis` → run `PYTHONUTF8=1 python tools/genesis.py`, report, then **ask what to
resume**. Never a flair-only boot.

---

# ★ STATE ✓measured
- **Board 88/88, 0 reds** (87 + `board_claims_match_reality`, added 2026-08-03 because
  CLAUDE.md still described an 85-gate / ~21-external board).
- Corpus sealed at **kv=458 · 2,255 claims · 7 books**. Untouched by the sweep.
- Tree clean and pushed at the close of the `safe_write` chunk (2026-08-03) — run
  `git log --oneline -1` for the exact commit; a hand-typed hash here rots every round.
  `tools/canaries/safe-write-probe.txt` always shows dirty —
  it rewrites its own nonce every `safe_write` run. Normal.
- **The operating contract changed shape.** CLAUDE.md is 5,252 B / 65 lines (was 16,765 B).
  `.claude/rules/` is **gone**; its content lives in **11 on-demand skills** under `.claude/skills/`
  that load only when the task matches. Always-loaded prose fell **111,977 B → 5,252 B (−95.3%)**.

---

# ✔ WHAT THE DOCTOR SWEEP DID — 4 commits, all pushed

1. **`95502372`** — purged a 96.8 MB stale worktree, collapsed `settings.local.json` from 800
   permission rules to 51 (183,907 B → 1,875 B), moved the 2026-07-17 audit out of `temporary/` into
   `chronicle/audits/`.
2. **`c88f5034`** — the contract rebuild: 16 always-loaded rules files → 11 on-demand skills, both
   affected gates re-codified and negative-controlled in the same patch.
3. **`08048166`** — retired the dead size budget, vendored 5 design libraries, added 2 offline gates,
   built the mockup harness, fixed the hook-path hole.
4. This close — the claim-review interface, memory repointing, and this handoff.

## What is genuinely new and worth using
- **`tools/claim_review.py`** — renders claims as Q → short → FULL → quote and **cannot** produce a
  table, a summary, or a truncation. The most re-sent correction in this project's history is now an
  interface instead of an instruction. `--entity zinc`, `--facet mechanism`, `--out <path>`.
- **`tools/mockup_harness.py` + `tools/mockup_measure.js`** — generate a design mockup inside the
  REAL container (reads its stylesheet list out of `dashboard.html`, so it cannot drift) and measure
  true geometry. ✓verified: container 865px, **figure ceiling 817px**, scale 1.000.
- **5 vendored libraries** (MIT/ISC, hash-pinned): `motion` · `animejs` · `roughjs` · `d3` ·
  `lottie-web`. Available to the app bundle AND to standalone mockups.
- **`design-language` skill** — the taste rubric plus the explicit statement that offline-first
  restricts exactly one thing: nothing loads off-machine at runtime. It has never meant small,
  static, or plain.

---

# ★ TWO THINGS NEEDING LUNETH'S CALL

1. **An orphaned Creator's Log entry.** `lg_ms2ceijb_ae6lys` (2026-07-26 16:59 CDT,
   tooling/render-probe) existed only inside the stale worktree — master's ledger never had it
   (783 entries vs that copy's 692). It is preserved at tag
   **`archive/worktree-nervous-shannon-2026-07-26`**, along with its build-log line. Reconciling it
   into the main ledger was deliberately NOT done unilaterally: the covenant says stop and ask.
   Retrieve with `git show 42f1ba11:chronicle/creators-log/log.jsonl`.
2. **The pinned browser is decided but not acquired.** `chronicle/decisions/2026-08-03-pinned-engine.md`
   records the decision, and design now assumes it (no fallbacks, no polyfills). No browser has been
   chosen, downloaded, or pinned, and **nothing verifies it**. Open: which engine and version, where
   it lives, how it is hash-pinned.

---

# ✔ THE `safe_write` BUG — FIXED 2026-08-03 (this was the NEXT item)

Both ends ran in Python's translated-newline space, and the round-trip was symmetric, so the tool's
own verify compared two translated strings and **passed while the disk differed from intent**. All
disk I/O now goes through `_read_exact` / `_write_exact` (raw bytes + an explicit UTF-8 codec),
every reported size is a true byte count, and `--payload-stdin` reads `.buffer`. The three recorded
symptoms were each reproduced first, then re-run clean.

**Two things the diagnosis had NOT caught**, both measured:

1. It did not merely fail to repair CRLF — it **rewrote every LF file it touched to CRLF**. That is
   the origin of the working tree's **554-CRLF / 154-LF** split, against a repo that stores LF
   (`core.autocrlf=input`). `.gitattributes` records that this same mechanism already broke the
   design-system.css seal once.
2. **`safe_write_canary` could not have caught any of it.** Its reader used
   `os.open(path, os.O_RDONLY)` — and on Windows that is TEXT mode, so `os.read` applied the *same*
   CRLF→LF translation as the write. A gate classified `external`, the only anchor class that can
   catch a wrong-but-consistent value, was sharing the defect it audited. Now `| O_BINARY`, comparing
   raw bytes, with LF + CRLF + a lone CR + non-ASCII in the probe payload.

Order mattered: the canary was **re-codified first and proven RED against the broken primitive**,
so its teeth are demonstrated rather than assumed. `tools/test_safe_write_byte_exact.py` (16 cases)
re-breaks the primitive three ways — translating write, symmetric translation, character-count
return — and asserts the gate reddens each time.

★ **THE NEW COST, and it will bite you.** Matching is byte-exact, so an **LF payload will not match
a CRLF file**. The failure is loud and names line endings as the cause, and `check <path>` now
prints a file's ending census — but you must stage payloads that MATCH the target. Most of this
tree is CRLF; the `Write` tool stages LF, so a conversion step is usually needed.

★ **OPEN — needs Luneth's call.** Those 554 CRLF files are CRLF *only* because the broken primitive
made them so; git already stores LF for every one. Normalising the working tree to LF would make
payload staging uniform and match what git holds. It touches nearly every file in the repo, so it
was deliberately NOT done unilaterally.

---

# ★ OPEN WORK — carried forward, unchanged by the sweep

### The header track (the standing default)
- **6 of 90 shipped**: selenium, copper, zinc, calcium, magnesium, vitamin A.
- **Read the `element-headers` and `design-language` skills first.** Only four things are fixed;
  the constraint pile that produced the flat designs is gone, and animation, interaction, real
  imagery and the vendored libraries are now explicitly available.
- **47 research dossiers** in `chronicle/header-research/`. Read the dossier before mocking up.
- **Vitamin C**: 4 redesigned demos in `temporary/vitamin-c-demos.html` await his pick.
- **Vitamin A (shipped)**: its pull-quote is a ~240-char run-on he wants shorter. He rejected four
  options and was choosing his own when work interrupted. Lives in `mechanism-clarity-data.json`.
- **`entity-copy.json` has entries for exactly those 6 and ZERO conditions.**
- ★ **Never build a header live without explicit permission.** Demo-only until he approves.

### Duplicate claims — 4 groups still needing his read
`RARE-000199`/`RARE-000383` · `EPIGEN-000271`/`EPIGEN-000319` · `DDDL-000064`/`DDDL-000157` ·
`IMMORT-000045`/`IMMORT-000465`. `no_duplicate_claims` deliberately does not fire on these — the
subjects differ, so they land on different pages. None is a blind delete.

### Source hygiene (2, logged not attempted)
1. epigenetics Screenshot(629) duplicated paragraph (~offsets 1261106 / 1262225). `EPIGEN-000096`
   quotes the clean copy, so nothing is broken; the duplication inflates bytes and offsets.
2. `hk.txt` index OCR junk (`mrsenic 155`, `Ashes177`).

### The mining backlog
- **174 destroyed B-vitamin subscripts** — provably NOT batch-fixable (`Bg,` is B5 in one sentence
  and B6 in another; `Bi, Ca, Li` is BISMUTH).
- **343 non-word hits / 210 claims** — expect to CONFIRM, not fix; of 105 page-read, 62 were
  legitimate. The spellchecker has no authority (it wanted `penis` for `pedis`).
- **931 corroborated-but-unread claims.** Three control samples found **13 defects in 90 ≈ 14%**.
  Agreement is corroboration, never verification.
- **The corroboration instrument is exhausted** — `select_reads` yields 0 in every tier. The next
  reduction needs a different instrument or whole-page reading.
- **CARRIED FORWARD, not re-measured:** front-facing backlog **1,283** · `claims_verified` **642**.

---

# ⚠ TRAPS THAT WILL COST A SESSION
1. **`corpus_seal` / `catalog_seal` are USER-ONLY.** Past permission never carries forward. Ask
   every time.
2. **Sync the drafts after every resnap.** Sealing without syncing silently restores stale offsets.
   Has bitten five times. Prove `corpus_seal.draft_offset_failures() == []` first.
3. **★ A gate can be green *because of* the defect.** This bit twice during the sweep: moving the
   rules would have turned `no_operating_doc_contradiction` and `charter_gates_present` green by
   deleting their subject. Both were re-codified *before* anything moved, and both now hard-RED on a
   missing subject. On a post-fix RED, ask what was making it pass before.
4. **★ An end-truncation is invisible to `corpus_resnap`** — a truncated verbatim is still a valid
   substring, so resnap RELOCATES it and never reports BROKEN. Assert the CORRECTION IS PRESENT.
5. **★ Searching book text or a sealed verbatim literally is blind.** Both are byte-exact OCR with
   hard line breaks inside sentences. Use `\s+` between words, or enumerate the entity's claims.
6. **★ Confirm a defect in the encoding the file actually uses.** Two convincing false alarms this
   session: PowerShell renders correct UTF-8 `·` as mojibake, and `git ls-files` escapes a correct
   `§` as `\302\247`. Both were nearly "repaired" into real damage.
7. **★ In PowerShell 5.1, `2>&1` on a native command sets `$?` false regardless of exit code.**
   Check `$LASTEXITCODE`. This produced a wrong verdict on the worktree check before re-testing.
8. **Never bare-token replace.** Anchor on a window from the claim's own verbatim, widened to unique.
9. **Read the page before batch-fixing a detector's hits.** 11 of 47 subscript hits were BORON.
10. **`pdftoppm` is NOT installed** — `Read` cannot open a PDF page. Use `tools/frontface/render.py`.
    `Screenshot (N).png` is a TWO-PAGE SPREAD in 3840×1080; the gutter sits at x = 0.2506.
11. **Long prose never goes through a shell argument.** Nested heredocs mangle it and an escaped
    newline becomes a real one. Stage with the Write tool, then drive `creators_log.py` from a script.
12. **Read the clock for every timestamp; never predict it.**
13. **`.claude/invariant-baseline.json` is invariant-scoped** — one entry tolerates a whole gate
    forever. Per-case exceptions go IN the gate with a reason and a test. It is EMPTY by design.
14. **★ Stage `replace` payloads with the TARGET's line endings.** Since 2026-08-03 safe_write
    matches bytes, and most of this tree is CRLF while the `Write` tool stages LF. Run
    `safe_write.py check <path>` first — it prints the census — then convert. A mismatch fails
    loudly and names the cause, but it still fails.

---

# ★ `eden/tools/ratified-divergences.json` — CHECK BEFORE FLAGGING ANY DEFECT
Internal-only. **73 `divergences`** (places our text deliberately differs from a legible page —
never "restore") + **36 `book_typo_divergences.entries`**. ⚠ `len()` on `book_typo_divergences`
returns **6** — those are the wrapper's metadata keys. The register is `["entries"]`. Do not
"correct" 36 → 6.

★ Four divergences are **safety-critical dose corrections**: silver `400 mcg` (page prints `400 mg`),
`LETS-000433` zinc **50 gm**→50 mg, `LETS-000399` copper **2 gm**→2 mg, `LETS-000051` folic acid
**gm**→mg. Restoring any of them reintroduces a toxic or lethal dose.

---

# STANDING DOCTRINES
1. `corpus_seal` / `catalog_seal` are **USER-ONLY**.
2. **NEVER fabricate.** Verbatim ⊆ sealed source, or say UNREADABLE. Never guess, and never guess
   silently — surface it in the same turn.
3. **The page is EVIDENCE, NOT GROUND TRUTH.** Fix a clear typo with outside knowledge; never touch a
   genuine Wallach statement even when it contradicts mainstream fact. Decide, then log it.
4. Every claim lives in ONE of 3 homes; search is a retrieval layer, not a silo.
5. **A DOM probe is NOT a visual check** — screenshot, then STOP for his eyes.
6. **NEVER build a header live without explicit permission.**
7. Small, reviewed increments; report and stop at the chunk boundary.
8. **No "for good" without a GATE.** A rule with no gate is a labelled WISH (R7).
9. **A green board means NOTHING DRIFTED — never that anything is RIGHT.** Only the ~21 external
   gates can catch a value that is wrong but self-consistent. Report the split, never the total.

---

**Board 88/88 · kv=458 · 2,255 claims · `safe_write` byte-exact · 3 items awaiting Luneth (the
orphaned ledger entry, the browser choice, whether to normalise the tree to LF) · NEXT = ask him.**
