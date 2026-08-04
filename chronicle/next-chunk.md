# Next chunk — ★ AUTHORITATIVE HANDOFF

_Rewritten 2026-08-03 21:40 CDT at the close of the **ORAC redesign + Astoria theme-study round**.
Supersedes the vitamin C/E handoff in full. Numbers marked ✓ were measured at handoff. Where an
older document disagrees, this one wins._

# ⚠ START HERE — HE WILL PICK THE NEXT ELEMENT HIMSELF

Luneth's words closing this round: *"set up for a new session where I will type genesis and continue
on with the next element."*

So: run `PYTHONUTF8=1 python tools/genesis.py`, report the split honestly, and **ask which element**.
Do not assume one. The standing default track is the **element headers** — 6 of 90 shipped, and the
process is fixed: read the dossier if one exists, build **four genuinely distinct** mockups in the
real container, he picks or mixes, and **never build live without explicit permission**.

★ **He is deliberately leaving threads open and does NOT want reminders about them.** Everything
open is recorded in `temporary/revamp-tracker.html` and `temporary/review-dashboard.html` so it does
not have to be raised in conversation. Answer what he asks; do not re-open the backlog unprompted.

---

# ★ STATE ✓measured
- **Board 88/88, 0 failed, no new reds.** 23 external / 23 consistency / 40 structural / 2 meta.
- `node tools/build.mjs` exits 0, rebuilt AFTER the Creator's Log append, so the in-app embed is current.
- `node tools/render_probe_orac.js` PASS — 33 cards == the live query.
- Corpus sealed at **kv=458 · 2,255 claims · 7 books**. **Untouched this round.**
- `tools/canaries/safe-write-probe.txt` always shows dirty — it rewrites its own nonce. Normal.
- ⚠ **`temporary/` is gitignored (`.gitignore:17`).** Demos live on his disk only.
  `chronicle/theme-studies/` is **tracked** — that is where the permanent theme work went.

---

# ✔ WHAT THIS ROUND PRODUCED

## 1 · ORAC sections 01–06 redesigned — `temporary/orac-redesign-v2.html`
Four directions built, he picked **A (Patina) + C (Orchard)** merged, and rejected the brown.
★ **The colour lesson: a dark orange IS a brown.** The ramp runs **pale → vivid**
(`#ffeadb → #ffd3b4 → #ffb37d → #ff8f4a → #ff6420`), holding saturation up so intensity carries the
increase. Green (`#2f7d4f`) is protection/target. **No red, no pink** — gated at hue <15° or >320°,
with the old `#d11f45` as the gate's negative control.
- **Sections 07 onward are deliberately untouched** and stay exactly as they ship. His call.
- Every number read from `orac-data.json` / `orac-foods-data.json`. None retyped.
- Generator: `temporary/orac-redesign-v2-build.py`. 40 probe checks green.
- **B (The Day) and D (The Long Line) are scrapped.** Do not revive them.
  *(For design context, not to repeat to him: food alone is impractical for the ORAC target — the
  food tables are a "some is better than none" argument, and the tangy tangerine tablets are the
  real answer. That is why a "build your day from food" interaction was wrong.)*

## 2 · The scroll-lock hole is GATED — 6th recurrence, now closed 3 ways
His words: *"at least 6 times you've repeated the scrolling mistake."* Cause: writing
`overflow-x: hidden`, which leaves `overflow-y: hidden` from `dashboard.css:25` /
`workspace-coverage.css:79` intact.
- `tools/hooks/post_write_verify.py` — text gate, fires on **every** `safe_write` of an `.html`
  that links app CSS and has no unlock. Exit 2. Nothing to remember.
- `tools/mockup_harness.py` — generated shells carry the unlock with `!important`.
- `tools/mockup_measure.js` — **rendered** proof: a real `page.mouse.wheel()` plus the effective
  viewport overflow. Exit 1 when locked.
- ⚠ **The first version of that gate used `window.scrollTo()` and passed a provably locked page** —
  `overflow: hidden` blocks USER scrolling only. Caught by a negative control on a regressed copy.

## 3 · Astoria theme study — PERMANENT, `chronicle/theme-studies/astoria/`
An outside design he loves, ported **1:1** at his explicit instruction (colours/fonts/graphics
copied exactly; content/arrangement adapted). Source: `codepen.io/pharaohleap/pen/wBojQLN`.
- `METHOD.md` is the record — read it before any future theme port. **§5 lists the blockers.**
- 18.8 MB, 59 assets, `theme.css` 127 KB unmodified but for localised URLs, `assets-ledger.json`.
- Applied: `temporary/review-dashboard.html` (28 demos + 29 header sets).
- Adapted: `temporary/revamp-tracker.html` (18 surfaces × 5 stages) — same theme, pipeline instead
  of catalogue, using the two components the first page never touched.

---

# ★ LESSONS THAT WILL COST A SESSION IF LOST

1. **A dark, desaturated orange is a brown.** Ramp pale→vivid, not light→dark.
2. **A palette is a set of RELATIONSHIPS, not values.** Substituting a hue of similar saturation
   breaks the design while every individual choice still looks defensible. Copy exactly, then move
   one thing at a time.
3. **`window.scrollTo()` is not a scroll test.** Nor is `element.screenshot()` or `fullPage:true`.
   Ask whether the instrument shares the defect's blind spot.
4. **Coordinate spaces**: a marker positioned against the container while data points are positioned
   against an inner rail is silently wrong. Verify a marker against the DATA's own mapping.
5. **Adapt a borrowed component by OMITTING or RE-PURPOSING, never by editing its CSS.** Every
   component carries an invisible contract — hidden labels, CSS-appended words (`' created'`),
   two-line display ceilings — and you only find it by feeding it data it was not drawn for.
6. **Match `<link rel=stylesheet>` with attributes in ANY order** and scan the whole document. A
   42 KB sheet linked at end-of-body was missed by a `rel`-first regex.
7. **Bash heredocs corrupt Python payloads** — `\b` became byte `0x08`, `\1` became `0x01`. Stage
   patch scripts with the Write tool when the payload contains regex escapes.
8. **A probe and eyes catch different things.** The probe found a marker off by 1.26pp; eyes found
   labels crossing dots *in bounds*. Neither alone was sufficient.

---

# ★ OPEN WORK — recorded, NOT to be raised unprompted
Everything below is visible in `temporary/revamp-tracker.html`. He is parking these on purpose.

- **Element headers**: 6 of 90 live · vitamin E (A+B picked, 2 fixes) · vitamin C (4 concepts,
  his pick) · 29 first-pass sets · 53 untouched. Richest unenhanced: chromium 67 · B6 50 · B12 37.
- **47 research dossiers** in `chronicle/header-research/`. Read the dossier before mocking up.
- ★ **Omega-3 / omega-6 are NOT candidates** — bespoke signed-off blocks already.
- **Coverage / the field** — 5 directions, none picked. The largest single decision outstanding.
- **Vitamin A** pull-quote is still a ~240-char run-on in `mechanism-clarity-data.json`.
- The **554 CRLF files** · **4 duplicate-claim groups** · **source hygiene (2)** · the mining
  backlog (174 destroyed B-subscripts · 343 non-word hits · 931 corroborated-but-unread ≈14% defect).
- **App-wide a11y pass, deferred**: the live ORAC tab measures **79** text runs below WCAG AA (the
  v2 demo measures 27, all inherited `--ds-accent*` / `--ds-ink-faint` on cream).
- **A shipped `hatching` caption on §04 refers to hatching that never renders** — no reach row
  exceeds 100%. Live copy, his call.

---

# ⚠ TRAPS
1. **`corpus_seal` / `catalog_seal` are USER-ONLY.** Ask every time; past permission never carries.
2. **Never build a header or any surface live without explicit permission.** Demo-only.
3. **A DOM probe is NOT a visual check.** Screenshot, then STOP for his eyes.
4. **A gate can be green *because of* the defect.** On a post-fix red, ask what made it pass before.
5. **Searching book text or a sealed verbatim literally is blind** — byte-exact OCR with hard line
   breaks. Use `\s+` between words, or enumerate the entity's claims.
6. **Confirm a defect in the encoding the file actually uses.** PowerShell renders UTF-8 as mojibake.
7. **In PowerShell 5.1, `2>&1` on a native command sets `$?` false regardless of exit code.**
8. **Never bare-token replace.** Anchor on a window from the claim's own verbatim.
9. **`pdftoppm` is NOT installed** — use `tools/frontface/render.py`.
10. **Long prose never goes through a shell argument.** Drive `creators_log.py` from a python script.
    ★ Its flag is `--surface`, **not** `--scope`.
11. **Read the clock for every timestamp; never predict it.**
12. **`.claude/invariant-baseline.json` is invariant-scoped and EMPTY by design.**
13. **Stage `replace` payloads with the TARGET's line endings.** Run `safe_write.py check <path>`.
14. **`tools/mockup_harness.py` splits `--panel` on the FIRST colon** — keep labels colon-free.
15. **`mockup_measure`'s collision check is text-vs-text and misses real overlaps.** Use your eyes.

---

# ★ `eden/tools/ratified-divergences.json` — CHECK BEFORE FLAGGING ANY DEFECT
Internal-only. **73 `divergences`** + **36 `book_typo_divergences.entries`**. ⚠ `len()` on
`book_typo_divergences` returns **6** — wrapper keys. The register is `["entries"]`.
★ Four are **safety-critical dose corrections**: silver `400 mcg` (page prints `400 mg`),
`LETS-000433` zinc **50 gm**→50 mg, `LETS-000399` copper **2 gm**→2 mg, `LETS-000051` folic acid
**gm**→mg. Restoring any reintroduces a toxic or lethal dose.

---

# STANDING DOCTRINES
1. `corpus_seal` / `catalog_seal` are **USER-ONLY**.
2. **NEVER fabricate.** Verbatim ⊆ sealed source, or say UNREADABLE. Never guess silently.
3. **The page is EVIDENCE, NOT GROUND TRUTH.** Fix a clear typo with outside knowledge; never touch
   a genuine Wallach statement. Decide, then log it.
4. Every claim lives in ONE of 3 homes; search is a retrieval layer, not a silo.
5. **A DOM probe is NOT a visual check** — screenshot, then STOP for his eyes.
6. **NEVER build live without explicit permission.**
7. Small, reviewed increments; report and stop at the chunk boundary.
8. **No "for good" without a GATE.** A rule with no gate is a labelled WISH (R7).
9. **A green board means NOTHING DRIFTED — never that anything is RIGHT.** Only the 23 external
   gates can catch a value that is wrong but self-consistent. Report the split, never the total.
10. **An interactive figure's central claim must be MEASURED from rendered output**, across every
    state, before he sees it.

---

**Board 88/88 · kv=458 · 2,255 claims · nothing live this round · ORAC 01–06 redesigned as a demo ·
scroll-lock gated 3 ways · Astoria theme study permanent in `chronicle/theme-studies/` ·
NEXT = he types `genesis` and names the element.**
