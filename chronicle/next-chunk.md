# Next chunk — ★ AUTHORITATIVE HANDOFF

_Rewritten 2026-08-04 20:01 CDT at the close of a **four-element header session** (vanadium, iron,
iodine, potassium). Supersedes the vitamin B12 handoff in full. Numbers marked ✓ were measured at
handoff. Where an older document disagrees, this one wins._

# ⚠ START HERE — TAKE UP THE NEXT ELEMENT

Luneth's words closing this session: *"A, B, and G are best - log this in the demo dashboard and
close the session here and set up for a new session."*

So: run `PYTHONUTF8=1 python tools/genesis.py`, report the split honestly, and **take up the next
element header**. Four rounds landed this session and none of them was ported live — do not re-open
any of the four unless he asks.

**Next by claim count, with no round yet: germanium 27 · lithium 27 · potassium is DONE.** It is a
two-way tie now. **Lithium has NO dossier**; germanium does. After those: vitamin B3 (25),
vitamin B9 (24), vitamin B1 (23), manganese (19), vitamin D (18), flavonoids (17), choline (14).
Name the tiebreak you use and let him redirect cheaply.

---

# ★★★ THE LESSON THIS SESSION ACTUALLY PRODUCED

**HE PICKS EVIDENCE AND INSTRUCTIONS. HE DOES NOT PICK EXPLANATIONS.**

After vanadium the theory was "he likes figures made of numbers and typography, not drawings" —
his four keeps were a ledger, proportional bars, counted dots and a numbered list; his three drops
were a line chart, lettered tiles and two drawn vessels. **That theory broke on iron**, where he
dropped bars and lists he had just praised and kept a controlled trial and a fingernail reading.

The rule that held for all four rounds: **a panel survives if it shows EVIDENCE about real people,
or hands the reader something to DO before the page ends.** Exposition loses however well measured.

- ✓ kept: a 1964 controlled trial · three islands with the confounder already ruled out · a
  thermometer test you can run tomorrow · named drugs your parent takes · which bottle to buy ·
  look at your fingernails · a legal cap that makes the label meaningless
- ✗ dropped: how the receptor works · what the hair pattern looks like · the causes list · the
  mechanism reframe · the ratio · the symptom list without a finding in it

★ **A big list survives only when it carries a COMPUTED FINDING.** Vanadium's ten diseases and
iodine's hypo/hyper mirror were kept; iron's 17-sign list was dropped even though it carried one.
Do not assume the archetype; assume the stake.

★ **MULTIPLE DEMOS ALWAYS — seven per element is now the settled batch size.**

★ **He is deliberately leaving threads open and does NOT want reminders.** Everything open is on
`temporary/revamp-tracker.html`.

---

# ★ STATE ✓measured
- **Board 88/88, 0 failed, no new reds.** 23 external / 23 consistency / 40 structural / 2 meta.
- `node tools/build.mjs` exits 0, rebuilt AFTER the Creator's Log append, so the embed is current.
- Corpus sealed and **untouched this session** — no mining, no re-seal.
- `tools/canaries/safe-write-probe.txt` always shows dirty — it rewrites its own nonce. Normal.
- ⚠ **`temporary/` is gitignored (`.gitignore:17`).** All four demo sets, their four generators and
  the tracker live on his disk only. `chronicle/` is tracked.

---

# ✔ WHERE THE FOUR ROUNDS LANDED — all parked, none live

| element | file | his picks | what remains |
|---|---|---|---|
| **vanadium** | `temporary/vanadium-demos.html` | **C, E, F, G** | one final pick among four |
| **iron** | `temporary/iron-demos.html` | **A, F** | one final pick between two |
| **iodine** | `temporary/iodine-demos.html` | **B, C, E, G** | *"design changes needed"* on all four |
| **potassium** | `temporary/potassium-demos.html` | **A, B, G** | one final pick among three |

⚠ **Signing off a demo is not a port order.** Building any of these live needs his explicit go-ahead.

---

# ⚠ FOUR HONESTY ITEMS LEFT OPEN FOR HIM — do not resolve silently

1. **Iodine prevalence is self-contradictory.** `IMMORT-000181`'s verbatim says *"Some one million
   Americans"*; the claim_texts of `RARE-000150` and `EPIGEN-000093` say **11 million**, and
   neither carries the figure in its own verbatim. The dossier advises using the 11-million pair;
   on the evidence that is not supportable. **No iodine panel prints a prevalence number and a
   build gate enforces it.**
2. **Vanadium's cautious starting dose differs 10× across two books for the same stated purpose**
   (preventing insulin shock): 250 mcg/day in *Dead Doctors Don't Lie* (2011) vs 25 mcg t.i.d. for
   someone already on insulin in *Let's Play Doctor* (1995), plus a third figure of 25 mcg/day in
   `LETS-000246`'s claim_text. Printed against their books, never averaged.
3. **Potassium's 51× is arithmetic**, performed here on 5,000 mg and the 99 mg FDA cap. Labelled on
   the panel as this page's arithmetic. Wallach states no ratio.
4. **The geology concepts for iron and iodine were deliberately NOT built** — they cost the reader
   nothing. Both were offered to him rather than dropped quietly.

---

# ★ CLAIMS THAT CARRY THEIR HEADLINE IN `claim_text`, NOT `verbatim`
Fine as prose; **never render any of them as a quotation.** This keeps recurring — check what a
verbatim actually carries before quoting it.
- **iron**: `LETS-000015` (the dossier cites it for the excess reframe; its verbatim is a
  TOXICITY SIGN LIST) · `EPIGEN-000083` (huge synthesis, five-word verbatim) · `RARE-000083`
  (the Fe/Cu 2.5:1 ratio is off the table, not in the quoted line)
- **iodine**: `LETS-000309` (the basal-temperature method and its 98 °F threshold) ·
  `RARE-000147`/`IMMORT-000179` (the goitrogen feeding study) · `IMMORT-000001`/`LETS-000287`
  (the "50 to 100 times" swelling)
- **vanadium**: `LETS-000246` (titration ladder) · `LETS-000307` (emotional symptoms) ·
  `RARE-000039` (the pica reading)
- **potassium**: `EPIGEN-000094` (the identity material) · `IMMORT-000190` (plants keep the
  potassium, sodium washes to the sea)

---

# ★ THE BUILD PATTERN THAT MADE FOUR ROUNDS SAFE IN ONE SESSION — reuse it
Each generator is `temporary/<element>-demos-build.py`, emitting seven fragments into
`temporary/<pfx>-frags/`, assembled by `tools/mockup_harness.py`.

1. **No quotation is hand-typed.** `qs(claim_id, opening_marker, closing_marker)` slices it out of
   the sealed verbatim at build time; a drifted marker **kills the build** instead of emitting an
   approximation.
2. **Every drawn number is parsed from the verbatim by regex**, never transcribed.
3. **Lists are split from their own verbatims**, so the printed order IS the book's order and is
   not available to be re-sorted. ⚠ Split on **commas** as his separators and open only the
   **final** conjunction — a splitter that also broke every top-level " and " shredded
   *"colds and flu"* into two entries Wallach never wrote.
4. **Findings are computed, then gated**, never asserted in copy. If the corpus stops supporting
   the finding, the build dies rather than printing it.
5. **An id gate** proves every cited id is sealed and linked to that element.

★ Two gates caught **my own code** this session, not the data: a case-sensitive check that missed
`"Bluish"` (capitalised at the start of his sentence), and the splitter above. Gates that check
your assumptions are worth more than gates that check the data.

---

# ★ LESSONS THAT WILL COST A SESSION IF LOST
1. **Evidence and instructions beat explanations.** See the block at the top. This is the big one.
2. **A DOM probe is text-vs-text and is structurally blind to most defects.** Eleven were caught by
   screenshots this session: three 100-dot grids 300px wide in a 700px figure, overlapping each
   other · eleven colliding labels because three doses land within 31px on a 0–2,000 scale · a
   shaded region invisible at 16 % opacity · a hero numeral sitting on its own dot row · a label
   spilling past its track · a strike routed through the symbol it was striking · two drawn vessels
   rendering as near-identical tumblers.
3. **The harness INLINES fragments at generation time.** Rebuilding fragments without regenerating
   the shell measures the OLD build — it silently reported the same collisions twice.
4. **Line spacing is not font size.** Two 10.5px labels 14px apart collided; 20px cleared it.
5. **Cluster crowding is a FINDING, not a layout accident.** When three of five figures land within
   31px of each other, draw them as one labelled window and say why — do not fight it with
   alternating label positions.
6. **Measure bar geometry out of rendered pixels**, not from source. Vanadium's absorption bars
   were confirmed at 1.00 / 40.00 / 98.00 % of the rendered track; iron's at 10.00 / 1.00.
7. **Grep a class prefix before claiming it.** `van-`, `irn-`, `iod-`, `pot-` were all checked
   clear against `dashboard/assets/styles/` and `js/src/` first.

---

# ★ OPEN WORK — recorded, NOT to be raised unprompted
- **Element headers**: 6 of 90 live · **four parked awaiting a final pick** (vanadium, iron,
  iodine, potassium) · B6 E+B picked, awaiting the go-ahead to port · B12 fourteen concepts, none
  picked · chromium (A+D picked, the combine) · vitamin E (A+B picked, 2 fixes) · vitamin C (4
  concepts, his pick).
- **49 research dossiers** in `chronicle/header-research/`. Read for FACTS; **do not inherit the
  concept ranking** — it ranks mechanism — and verify the claim ids.
- ★ **Omega-3 / omega-6 are NOT candidates** — bespoke signed-off blocks already.
- **ORAC sections 01–06** redesigned as a demo, not live. 07 onward deliberately untouched.
- **Coverage / the field** — 5 directions, none picked. The largest single decision outstanding.
- **Vitamin A** pull-quote is still a ~240-char run-on in `mechanism-clarity-data.json`.
- The **554 CRLF files** · **4 duplicate-claim groups** · **source hygiene (2)** · the mining
  backlog (174 destroyed B-subscripts · 343 non-word hits · 931 corroborated-but-unread ≈14% defect).
- **App-wide a11y pass, deferred**: the live ORAC tab measures **79** text runs below WCAG AA.
- **A shipped `hatching` caption on ORAC §04 refers to hatching that never renders.** His call.

---

# ⚠ TRAPS
1. **`corpus_seal` / `catalog_seal` are USER-ONLY.** Ask every time; past permission never carries.
2. **Never build a header or any surface live without explicit permission.** **A signed-off demo is
   not a port order.**
3. **A DOM probe is NOT a visual check.** Screenshot, then STOP for his eyes.
4. **A gate can be green *because of* the defect.** On a post-fix red, ask what made it pass before.
5. **Searching book text or a sealed verbatim literally is blind** — byte-exact OCR with hard line
   breaks. Use `\s+` between words, or enumerate the entity's claims.
6. **Claim records key on `id`, not `claim_id`.**
7. **In PowerShell 5.1, `2>&1` on a native command sets `$?` false regardless of exit code.**
8. **Never bare-token replace.** Anchor on a window from the claim's own verbatim.
9. **`pdftoppm` is NOT installed** — use `tools/frontface/render.py`.
10. **Long prose never goes through a shell argument.** Drive `creators_log.py` from a python
    script. ★ Its flag is `--surface`, **not** `--scope`. ⚠ **`time.strftime("%Z")` on this host
    returns `Central Daylight Time`, not `CDT`** — the build-log line had to be corrected after the
    fact this session. Write the abbreviation literally.
11. **Read the clock for every timestamp; never predict it.**
12. **`.claude/invariant-baseline.json` is invariant-scoped and EMPTY by design.**
13. **Stage `replace` payloads with the TARGET's line endings.** Run `safe_write.py check <path>`.
14. **`tools/mockup_harness.py` splits `--panel` on the FIRST colon** — keep labels colon-free, and
    pass Windows-form paths (`C:/…`), never MSYS (`/c/…`).
15. **`mockup_measure`'s collision check is text-vs-text and misses real overlaps.** Use your eyes.
16. **Puppeteer scripts run from the scratchpad need `NODE_PATH`** pointed at the repo's
    `node_modules`, or `require('puppeteer')` fails.
17. **The borrowed Astoria card clamps its rec line to ONE line on all cards.** That is the
    component's design, pre-existing, not a defect to chase. The `desc` line is the one that must fit.
18. ⚠ **`temporary/revamp-tracker.html` CANNOT BE REGENERATED.** Its build inputs
    (`astoria-raw.html`, `astoria-assets.json`) lived in a past session's scratchpad and are gone,
    and `revamp-tracker-manifest.json` has been stale since 2026-08-03. **Edit the HTML directly**,
    preserve CRLF (it is CRLF throughout), and verify with `safe_write.py check` after every write.
    The stage counts and the "first pass" count are hand-maintained: this session took
    *awaiting a pick* 4→8 and the first-pass count 28→24.

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
11. **Cast a wide net — build every concept and show them all.** He is the picker. Seven per element.
12. **Where Wallach names a sign but not a number, draw no number.**
13. **Build for evidence and instruction, not for explanation.** The reader must have something to
    lose, or something to do.

---

**Board 88/88 · corpus untouched · nothing live this session · four elements parked awaiting a
final pick (vanadium C/E/F/G · iron A/F · iodine B/C/E/G · potassium A/B/G) · four generators +
tracker in `temporary/` (gitignored) · NEXT = he types `genesis` and names the next element
(germanium 27 and lithium 27 are tied; lithium has no dossier).**
