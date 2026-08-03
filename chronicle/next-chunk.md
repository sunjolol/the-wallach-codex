# Next chunk — ★ AUTHORITATIVE HANDOFF

_Rewritten 2026-08-03 at the close of the **vitamin C + vitamin E header round**. Supersedes the
doctor-sweep handoff in full. Numbers marked ✓ were measured at handoff. Where an older document
disagrees, this one wins._

# ⚠ START HERE — THE NEXT TASK IS THE ORAC PAGE REDESIGN

Luneth's words, 2026-08-03: he wants **an overhaul of the ORAC knowledge page, built as a NEW DEMO
PAGE first, not shipped live**. The information is good and flows well; the **presentation** must be
brought up to the new design standards — more interactive, and with **much better colours**.

★ **He hates the pink and the reds.** He said almost all the colours on that page give him a bad
feeling and he has trouble explaining why. Avoid pink and red in the next iteration. This is a taste
instruction, not a puzzle to solve cleverly — take it literally.

- The live page is `dashboard/assets/js/src/views/knowledge-orac.ts` + `assets/styles/drawer-orac.css`.
- **Derive from it for INFORMATION ONLY, never for visual direction.** See
  [[orac-live-view-build-plan]] in memory for the architecture, the four content homes, and the
  data-provenance rules (the food-table numbers are claim-derived and must never be hand-typed).
- Read the `design-language` and `element-headers` skills before designing.
- Build it as a demo under `temporary/`, screenshot it, and **STOP for his eyes**. Nothing live.

Luneth types `genesis` → run `PYTHONUTF8=1 python tools/genesis.py`, report, then **ask what to
resume**. Never a flair-only boot.

---

# ★ STATE ✓measured
- **Board 88/88, 0 failed, no new reds.** 23 external / 23 consistency / 40 structural / 2 meta.
- `node tools/build.mjs` exits 0. Rebuilt after the Creator's Log append, so the in-app embed is current.
- Corpus sealed at **kv=458 · 2,255 claims · 7 books**. **Untouched this round** — no pillar was
  edited, so no seal was taken even though Luneth granted permission for one.
- `tools/canaries/safe-write-probe.txt` always shows dirty — it rewrites its own nonce on every
  `safe_write` run. Normal.
- ⚠ **`temporary/` is gitignored (`.gitignore:17`).** Every demo below lives there and is NOT in git.
  It exists on Luneth's disk only. Do not assume a fresh clone has it.

---

# ✔ WHAT THIS ROUND PRODUCED — eight header demos, nothing live

## Vitamin E — `temporary/vitamin-e-demos.html` (fragments in `temporary/vite-r1/`)
★ **A and B are the WINNERS and will be COMBINED into the final vitamin E header.** His call.

- **A "Rust"** — a generative skin field. Free radicals deposit ceroid pigment; vitamin E quenches
  them before they can; an ORAC scale clears what has already built up. Tells the whole arc:
  prevention *and* reversal.
- **B "The ladder"** — a true-scale 0→2,000 IU column whose handle snaps only to Wallach's own rungs.
- **C "Five words"** — the neurological deficiency run turning over into plain English. Not chosen.
- **D "The duet"** — E + selenium, the three shared diseases. Not chosen.

### ★ THE TWO KNOWN TWEAKS BEFORE A+B ARE PORT-WORTHY
1. **B has overlapping text at the bottom — measured, not vague.** `.veb-axis`
   ("0 → 2,000 IU · true scale · drag the marker", x191–423) overlaps `.veb-rda__lbl`
   ("15 IU · government RDA", x247–391) by **144 × 13 px**. The `mockup_measure` collision check
   reported *none* — it did not catch this. Fix by moving one label, not by shrinking type.
2. **A needs design tweaks** — he did not specify which. **Ask before guessing.**

## Vitamin C — `temporary/vitamin-c-demos-r2.html` (fragments in `temporary/vitc-r2/`)
**Still awaiting his pick. He likes all four for different reasons** and said he needs more time.
A "The unravelling" (physics collagen tear) · B "60/1,000/10,000" (kinetic type, clipped by the
container) · C "Open it anywhere" (prescription-slip deck) · D "The gate" (live absorption instrument).

★ The round-1 vitamin C demos were **scrapped in full** at his instruction — the old
`temporary/vitamin-c-demos.html` is superseded, do not show it to him again.

---

# ★ THE HABIT THAT CHANGED THIS ROUND — read before building any interactive figure

Luneth caught, by eye, that the vitamin C gate's absorbed count never changed no matter how shut the
gate was. The whole figure was decorative. Fixing it properly took **four** attempts, and every wrong
one **passed a screenshot**:

1. Every grain was steered toward the opening → nearly all passed at any aperture.
2. Blocked grains camped at the wall and random-walked until they found the gap → same failure, slower.
3. Rejected grains washed back at 0.55 px/frame across a 470px chamber — a **14-second recycle**, so
   the figure was never at equilibrium and the readings were history, not aperture. Non-monotonic.
4. (Vitamin E) `destination-out` erosion at an alpha **below 1/255**, which canvas quantises to
   **zero** — the code ran every frame and erased nothing.

**How to apply:** for any figure whose point is that X changes Y, write a probe that reads the
**rendered canvas pixels** (not the script's own variable), sweep **every** state, and assert
monotonicity. Check the settle time — compute `distance / speed` for every recycle path; anything
slower than ~2s means the figure reads as history. Prefer a **linear** measure (mean luminance
deficit) over a threshold count, which saturates and made 50k and 100k look identical when they were
not. Full write-up: [[interactive-figure-must-be-measured]] in memory. Probe patterns are in the
2026-08-03 session scratchpad and are worth re-deriving rather than hunting for.

---

# ★ ORAC ↔ AGE SPOTS — verified this round, do NOT re-derive from the ORAC page

Luneth asked explicitly not to trust the ORAC page for this. Verified against sealed claims:

- **`WAL-CLM-RARE-000225`** — age/liver spots ARE ceroid lipofuscin, peroxidised body fat.
- **`WAL-CLM-IMMORT-000246`** — verbatim: *"can easily be prevented and quickly reversed"*; he calls
  the contrary view a medical dogma that is wrong.
- **`WAL-CLM-IMMORT-000247`** — the reversal method has **three** parts: cut free-radical foods hard
  + every known essential nutrient + **20,000–25,000 ORAC points/day**.
- ⚠ **`WAL-CLM-EPIGEN-000148` / `-000154`** — **100,000 ORAC** is a genuine Wallach figure
  (*"in excess of 100,000 ORAC points per day"*) but he states it for the **basal-ganglia diseases —
  MS, ALS, Parkinson's — NEVER for the pigment.** The two figures are not interchangeable. Label
  which is which on any surface showing both.
- He gives **no rate** for reversal ("quickly", not how quickly), so any speed ramp in a UI is a
  reading device and must say so on the surface.

---

# ★ OPEN WORK — carried forward

### The header track (the standing default once ORAC is done)
- **6 of 90 shipped**: selenium, copper, zinc, calcium, magnesium, vitamin A.
- **Vitamin C** (4 demos, awaiting pick) and **vitamin E** (A+B chosen, 2 tweaks) are in flight.
- ★ **Omega-3 and omega-6 are NOT candidates** — they already carry a bespoke signed-off
  `.kd-ep-fam` "three forms" / "fatty-acid family" experience block (2026-07-21). They are enhanced,
  not pending. Do not restart them as if fresh.
- **47 research dossiers** in `chronicle/header-research/`. Read the dossier before mocking up.
- Richest genuinely-unenhanced packs by claim count: **chromium 67 · vitamin B6 50 · vitamin B12 37 ·
  vanadium 37 · iron 36 · iodine 32**.
- **Vitamin A (shipped)**: its pull-quote is still a ~240-char run-on he wants shorter. He rejected
  four options and was writing his own. Lives in `mechanism-clarity-data.json`.
- `entity-copy.json` has entries for exactly the 6 shipped and ZERO conditions.
- ★ **Never build a header live without explicit permission.** Demo-only until he approves.

### Still open, unchanged by this round
- **The 554 CRLF working-tree files.** Still his call — git already stores LF for every one.
  Normalising would make payload staging uniform; it touches nearly every file, so it was not done
  unilaterally.
- **4 duplicate-claim groups** needing his read: `RARE-000199`/`RARE-000383` ·
  `EPIGEN-000271`/`EPIGEN-000319` · `DDDL-000064`/`DDDL-000157` · `IMMORT-000045`/`IMMORT-000465`.
- **Source hygiene (2, logged not attempted)**: epigenetics Screenshot(629) duplicated paragraph
  (~offsets 1261106 / 1262225); `hk.txt` index OCR junk (`mrsenic 155`, `Ashes177`).
- **The mining backlog**: 174 destroyed B-vitamin subscripts (provably not batch-fixable) · 343
  non-word hits / 210 claims (expect to CONFIRM, not fix) · **931 corroborated-but-unread claims**
  (three control samples found 13 defects in 90 ≈ 14%). The corroboration instrument is exhausted —
  `select_reads` yields 0 in every tier. CARRIED FORWARD, not re-measured: front-facing backlog
  **1,283** · `claims_verified` **642**.

---

# ⚠ TRAPS THAT WILL COST A SESSION
1. **`corpus_seal` / `catalog_seal` are USER-ONLY.** Past permission never carries forward. Ask every
   time. (He granted seal permission on 2026-08-03; it was NOT used, and that grant does not carry.)
2. **Sync the drafts after every resnap.** Prove `corpus_seal.draft_offset_failures() == []` first.
3. **★ A gate can be green *because of* the defect.** On a post-fix RED, ask what was making it pass.
4. **★ An end-truncation is invisible to `corpus_resnap`** — assert the CORRECTION IS PRESENT.
5. **★ Searching book text or a sealed verbatim literally is blind.** Byte-exact OCR with hard line
   breaks inside sentences. Use `\s+` between words, or enumerate the entity's claims.
6. **★ Confirm a defect in the encoding the file actually uses.** PowerShell renders correct UTF-8 as
   mojibake; `git ls-files` escapes correct non-ASCII paths.
7. **★ In PowerShell 5.1, `2>&1` on a native command sets `$?` false regardless of exit code.**
   Check `$LASTEXITCODE`.
8. **Never bare-token replace.** Anchor on a window from the claim's own verbatim, widened to unique.
9. **Read the page before batch-fixing a detector's hits.**
10. **`pdftoppm` is NOT installed** — use `tools/frontface/render.py`. `Screenshot (N).png` is a
    TWO-PAGE SPREAD in 3840×1080; the gutter sits at x = 0.2506.
11. **Long prose never goes through a shell argument.** Stage with Write, then drive
    `creators_log.py` from a python script that passes the body as a subprocess list element.
12. **Read the clock for every timestamp; never predict it.**
13. **`.claude/invariant-baseline.json` is invariant-scoped** — per-case exceptions go IN the gate.
    It is EMPTY by design.
14. **★ Stage `replace` payloads with the TARGET's line endings.** `safe_write` matches bytes; most
    of this tree is CRLF while the `Write` tool stages LF. Run `safe_write.py check <path>` first.
15. **★ NEW — `tools/mockup_harness.py` splits `--panel` on the FIRST colon.** A colon inside a panel
    LABEL resolves to a bogus fragment path and renders a silent empty panel with no error. Keep
    labels colon-free.
16. **★ NEW — `mockup_measure`'s collision check missed two real overlaps this round** (vitamin E B's
    bottom labels, and A's two ORAC scale captions before they were shortened). It is text-vs-text
    box comparison and it is not sufficient. **Screenshot and use your eyes.**

---

# ★ `eden/tools/ratified-divergences.json` — CHECK BEFORE FLAGGING ANY DEFECT
Internal-only. **73 `divergences`** + **36 `book_typo_divergences.entries`**. ⚠ `len()` on
`book_typo_divergences` returns **6** — those are wrapper metadata keys. The register is
`["entries"]`. Do not "correct" 36 → 6.

★ Four divergences are **safety-critical dose corrections**: silver `400 mcg` (page prints `400 mg`),
`LETS-000433` zinc **50 gm**→50 mg, `LETS-000399` copper **2 gm**→2 mg, `LETS-000051` folic acid
**gm**→mg. Restoring any of them reintroduces a toxic or lethal dose.

---

# STANDING DOCTRINES
1. `corpus_seal` / `catalog_seal` are **USER-ONLY**.
2. **NEVER fabricate.** Verbatim ⊆ sealed source, or say UNREADABLE. Never guess silently.
3. **The page is EVIDENCE, NOT GROUND TRUTH.** Fix a clear typo with outside knowledge; never touch a
   genuine Wallach statement. Decide, then log it.
4. Every claim lives in ONE of 3 homes; search is a retrieval layer, not a silo.
5. **A DOM probe is NOT a visual check** — screenshot, then STOP for his eyes.
6. **NEVER build a header live without explicit permission.**
7. Small, reviewed increments; report and stop at the chunk boundary.
8. **No "for good" without a GATE.** A rule with no gate is a labelled WISH (R7).
9. **A green board means NOTHING DRIFTED — never that anything is RIGHT.** Only the 23 external
   gates can catch a value that is wrong but self-consistent. Report the split, never the total.
10. ★ **An interactive figure's central claim must be MEASURED from rendered output**, across every
    state, before it is shown to him.

---

**Board 88/88 · kv=458 · 2,255 claims · nothing live this round · 8 header demos in `temporary/` ·
NEXT = the ORAC page redesign, as a demo, no pink, no red.**
