# Next chunk — ★ AUTHORITATIVE HANDOFF

_Rewritten 2026-08-04 21:18 CDT at the close of an **overnight seven-element header round**
(germanium, lithium, vitamin B3, vitamin B9, vitamin B1, manganese, vitamin D). Supersedes the
four-element handoff in full. Numbers marked ✓ were measured at handoff. Where an older document
disagrees, this one wins._

# ⚠ START HERE — HE HAS FORTY-NINE CONCEPTS TO REVIEW AND FOUR RULINGS TO MAKE

He went to sleep asking for "demos for the next 7 highest priority essentials" with "a link to each
page individually". That is built. **Open `temporary/_overnight-2026-08-04.html` first** — it is the
index, it links all seven pages, and it carries the rulings.

**Do not start new element work until he has looked.** Ask which of the forty-nine he wants, and get
the four rulings below answered, because two of them change numbers that are currently on cards.

---

# ★★★ THE FOUR RULINGS — TWO OF THEM CHANGE A NUMBER ON A LIVE CARD

## 1. ★★ Vitamin D — his books disagree about DIRECTION, not size. Safety-relevant.
Across the **24 rows of his 1995 base-line table this build can parse, vitamin D is the ONLY row
where his own figure is LOWER than the government RDA** — 275 IU against 400. Computed, not asserted;
the generator asserts it and dies if it stops being true.
- **1995** `WAL-CLM-LETS-000074` — true supplement need **275 IU**, below the 400 IU RDA.
- **2011** `WAL-CLM-DDDL-000106` — for cerebrovascular disease, **cap total intake at 400 IU/day**.
- **2014** `WAL-CLM-EPIGEN-000119` — **1,000–2,000 IU**; the card takes the upper, **2,000 IU**.

The card is **7.3× his 1995 figure and 5× his own 2011 ceiling**, and his own toxicity entry for this
vitamin is **calcification of the arteries** (`WAL-CLM-LETS-000040`, `WAL-CLM-DDDL-000083`). Nothing
is fabricated and favour-newest is being applied correctly. **The question is whether a single number
can honestly represent this vitamin at all.**

## 2. ★★ Vitamin B9 — folate's card currently carries the government's number.
The target **400 mcg** (`WAL-CLM-EPIGEN-000123`, 2014) is **numerically identical to the RDA** in
column one of `WAL-CLM-LETS-000052` — the column he reprints in order to argue against it. His own
"true supplement need" in that same printed row is **1,000 mcg**. Folate is the one essential whose
card and the RDA coincide. Leave it, or let 1995 win?

## 3. ★ Lithium — should the 1,000–2,000 mcg become its target?
The card says **no maintenance amount stated** and that is defensible: `WAL-CLM-IMMORT-000199` and
`WAL-CLM-RARE-000164` give "chelated lithium at 1,000–2,000 ug/day" as a description of what
supplementation *does to hair levels*, not as a recommendation. Promoting an observation to a target
is a ruling and the round did not make it.

## 4. Germanium — Epigenetics prints "osteoarthritis" where three books print "osteoporosis".
Same slot in the same sentence, different disease of a different tissue. **Not in
`ratified-divergences.json`**, so it was not normalised — each book's own word is printed and the
difference is drawn as the finding. Genuine one-word revision in 2014, or a source defect?
`WAL-CLM-EPIGEN-000086` vs `WAL-CLM-RARE-000011` / `WAL-CLM-IMMORT-000139` / `WAL-CLM-DDDL-000012`.

### Smaller rulings, all disclosed on their own panels
- **Germanium** — the 50–100 mg high-dose *trigger* differs: "serious illness requiring increased
  oxygen" (Dddl-000011, Rare-000012) vs "serious germanium deficiency" (Immort-000140).
- **Manganese** — `WAL-CLM-LETS-000017` prints **"muscle therapy"** among the deficiency signs. A
  misprint; the intended word is not recoverable from the page. *Muscle atrophy* is the obvious guess
  and was deliberately NOT made. Printed as sealed and marked.
- **Manganese** — the **154 lb reference weight is this project's choice, not his**. He gives a rate
  (3–5 mg per 100 lb); somebody has to pick a body. Panel F draws the whole range and discloses it.
- **B3 and B1** — both maintenance figures **doubled** between books (50 mg 1995 → 10–100 mg 2014)
  with no stated reason. Favour-newest takes 100 for both.
- **B3** — `WAL-CLM-LETS-000019` has an entry that is **incomplete in the seal**: "crying jags,
  emotional" with no noun. The summary reads it as *emotional lability*; that word is not in the
  sealed line and was not added.

---

# ★★★ A CORPUS-WIDE FIND — THREE OCR DEFECT CLASSES, NOW GATED

Measured across all **2,255 sealed claims**, not estimated:

1. **Line-break hyphens pulled into words — 19 distinct.** `in-cluding` · `increas-ing` ·
   `supple-mentation` · `ring-worm` · `caro-tene` · `weak-ness` · `labora-tory` · `derma-titis` ·
   `acu-puncture` · `exer-cise` · `charac-terized` · `peni-cillin` · `numb-ness` · `medica-tions` ·
   `environ-mental` · `correc-tion` · `eleva-tions` · `milk-weed` · `marsh-mallow`.
   **Derived by evidence, not hand-typed**: a mid-word hyphen counts as an artifact only when the
   joined form appears elsewhere in the corpus unhyphenated. Genuine hyphenations (`anti-viral`,
   `semi-conductor`, `bi-polar`, …) are named in an allowlist with the reason.
2. **The digit 1 read as a lowercase L — 8 occurrences across 7 claims**, so `B-1` is sealed as
   `B-l`, plus one `B-l 2` for B-12.
3. **A space before a thousands comma — 20 occurrences across 18 claims**: `1 ,000 mg`, `1 ,200 IU`.

**All three now fail the build rather than reaching a reader.** `temporary/demo_quote_gate.py` is
shared by all seven generators and wired into `qs()` itself, so **every slice is checked**. It fired
**three times in production** during this run — `increas-ing` in the germanium oxygen quote,
`supple-mentation` in the vitamin D rickets quote, `ring-worm` in the UV therapy quote — and each
time the panel was rebuilt to quote a different clause or render the parsed value instead.
**The seal itself was NOT touched. `corpus_seal` is USER-ONLY.**

★ Negative-controlled twice: the gate was fed the exact damaged slices and confirmed to fire.

---

# ★ STATE ✓measured
- **Board 88/88, 0 failed, no new reds.** 23 external / 23 consistency / 40 structural / 2 meta.
- `node tools/build.mjs` exits 0, rebuilt AFTER the Creator's Log append.
- **Corpus sealed and untouched. No mining, no re-seal, no claim edited.**
- **No tracked file changed** except `chronicle/` (this handoff + the logs). Every generator,
  fragment and page is in gitignored `temporary/`.
- `tools/canaries/safe-write-probe.txt` always shows dirty — it rewrites its own nonce. Normal.

# ✔ WHERE THE SEVEN ROUNDS LANDED — all parked, none live, none picked

| element | page | claims cited | the lead panel |
|---|---|---|---|
| **germanium** | `temporary/germanium-demos-r2.html` | 24 / 27 | nine conditions, four land on 50 mg |
| **lithium** | `temporary/lithium-demos-r2.html` | 21 / 27 | twelve named drugs, Li in every replacement |
| **vitamin B3** | `temporary/vitamin-b3-demos-r2.html` | 18 / 25 | 450 mg across nine illnesses |
| **vitamin B9** | `temporary/vitamin-b9-demos-r2.html` | 22 / 24 | the card carries the RDA |
| **vitamin B1** | `temporary/vitamin-b1-demos-r2.html` | 18 / 23 | the heart and the head |
| **manganese** | `temporary/manganese-demos-r2.html` | 16 / 19 | $20 bn of wrist braces |
| **vitamin D** | `temporary/vitamin-d-demos-r2.html` | 17 / 18 | the one number he moved the other way |

**Index: `temporary/_overnight-2026-08-04.html`.** Generators are `temporary/<slug>-demos-build.py`,
fragments in `temporary/<pfx>-frags/`. ⚠ **Signing off a demo is not a port order.**

---

# ★ THE METHOD THAT MADE SEVEN ROUNDS SAFE IN ONE NIGHT — reuse it
1. **No quotation is hand-typed.** `qs(claim_id, open, close)` slices it out of the sealed verbatim
   at build time; a drifted marker **kills the build** instead of emitting an approximation.
2. **Every drawn number is parsed by regex from the verbatim**, never transcribed.
3. **Every finding is COMPUTED, then gated** — "four of five land on 50 mg", "the only row below the
   RDA", "13 of 16 entries appear in both books". If the corpus stops supporting it, the build dies.
4. **Lists split from their own verbatims**, so the printed order IS the book's order.
5. **Symbol and slug expansions are cross-checked against the claim's OWN sealed `essentials` /
   `conditions` field** — never a hand-typed key. Used on germanium G, lithium C, B1 G, B9 C, vtd E.
6. **An id gate** proves every cited id is sealed AND linked to that element.
7. **The shared quote gate** (above) refuses OCR-damaged slices.

★ **The gates caught MY code far more often than the data**: an Oxford comma that made the last
list item "and cancer" and under-counted germanium's shared signs; a three-line table wrap that
invented a phantom nineteenth niacin sign; a splitter that turned his dietary instructions into
mineral chips on lithium's drug table. **Gates that check your assumptions are worth more than gates
that check the data.**

# ★ WHAT THE SCREENSHOTS CAUGHT THAT THE PROBE COULD NOT
The DOM probe reported "TEXT COLLISIONS: none" on every one of these:
- lithium D — the "supplementation stops" label sat **on** the curve. The #1 rejection shape.
- germanium F — a quote cut at "had been predicted" ran into this page's prose as one sentence;
  the 1886 slice opened on a lowercase "however,".
- germanium C — a full-stopped quote ran straight into "is what he means by…".
- vitamin B1 B — the "500 mg" value label ran off the 700-unit figure and was clipped mid-word.
- manganese A — a slice starting at "to joint problems" rendered as "produces to joint problems".
- lithium C — an eye drawing that was one step from the drawn-face style already rejected.
**Screenshot every panel. The probe is text-vs-text and structurally blind to all six.**

---

# ★ OPEN WORK — recorded, NOT to be raised unprompted
- **Element headers**: 6 of 90 live · **fifteen now awaiting a pick** (vanadium, iron, iodine,
  potassium, + these seven, + B6 E/B, chromium A/D, vitamin E A/B) · B12 fourteen concepts, none
  picked · vitamin C four concepts.
- **49 research dossiers** in `chronicle/header-research/`. Read for FACTS; **do not inherit the
  concept ranking** — it ranks mechanism, and mechanism is what he drops. Germanium's dossier ranked
  "the transistor in your cells" first; this round demoted it to one slot of seven.
- ★ **Omega-3 / omega-6 are NOT candidates** — bespoke signed-off blocks already.
- **ORAC sections 01–06** redesigned as a demo, not live. 07 onward deliberately untouched.
- **Coverage / the field** — 5 directions, none picked. The largest single decision outstanding.
- **Vitamin A** pull-quote is still a ~240-char run-on in `mechanism-clarity-data.json`.
- The **554 CRLF files** · **4 duplicate-claim groups** · the mining backlog.
- **App-wide a11y pass, deferred**: the live ORAC tab measures **79** text runs below WCAG AA.
- **A shipped `hatching` caption on ORAC §04 refers to hatching that never renders.** His call.

# ⚠ TRAPS — unchanged, plus two new
1. **`corpus_seal` / `catalog_seal` are USER-ONLY.** Ask every time.
2. **Never build live without explicit permission. A signed-off demo is not a port order.**
3. **A DOM probe is NOT a visual check.** Screenshot, then STOP for his eyes.
4. **A gate can be green *because of* the defect.** On a post-fix red, ask what made it pass before.
5. **Searching a sealed verbatim literally is blind** — byte-exact OCR with hard line breaks.
6. **Claim records key on `id`, not `claim_id`.**
7. **Long prose never goes through a shell argument.** `creators_log.py`'s flag is `--surface`.
   `time.strftime("%Z")` returns `Central Daylight Time`, not `CDT` — write it literally.
8. **`tools/mockup_harness.py` splits `--panel` on the FIRST colon** — keep labels colon-free.
9. **The harness INLINES fragments at generation time.** Rebuilding fragments without re-running the
   harness measures the OLD build.
10. **`temporary/revamp-tracker.html` CANNOT BE REGENERATED.** Edit the HTML directly, preserve CRLF
    (verified `crlf=1244 lf=0` after this session's edit).
11. ★ **NEW — `safe_write` shape-gates `.html`**: a fragment-style file with no `</html>` is
    REFUSED. The overnight index had to be wrapped in a full document before it would install.
12. ★ **NEW — a scroll probe that reads `window.scrollY` immediately after a wheel reports 0 and
    looks exactly like a scroll-lock.** Await the scroll, and read
    `document.scrollingElement.scrollTop`. It cost a false alarm on the index page.

---

# ★ `eden/tools/ratified-divergences.json` — CHECK BEFORE FLAGGING ANY DEFECT
Internal-only. **73 `divergences`** + **36 `book_typo_divergences.entries`**. ⚠ `len()` on
`book_typo_divergences` returns **6** — wrapper keys. The register is `["entries"]`.
★ Four are **safety-critical dose corrections**. Restoring any reintroduces a toxic or lethal dose.

# STANDING DOCTRINES
1. `corpus_seal` / `catalog_seal` are **USER-ONLY**.
2. **NEVER fabricate.** Verbatim ⊆ sealed source, or say UNREADABLE. Never guess silently.
3. **The page is EVIDENCE, NOT GROUND TRUTH.** Fix a clear typo with outside knowledge; never touch
   a genuine Wallach statement. Decide, then log it. ★ **But when the intended word is not
   recoverable — manganese's "muscle therapy" — print it as sealed and ask.**
4. Every claim lives in ONE of 3 homes; search is a retrieval layer, not a silo.
5. **A DOM probe is NOT a visual check** — screenshot, then STOP for his eyes.
6. **NEVER build live without explicit permission.**
7. Small, reviewed increments; report and stop at the chunk boundary.
8. **No "for good" without a GATE.** A rule with no gate is a labelled WISH (R7).
9. **A green board means NOTHING DRIFTED — never that anything is RIGHT.** Report the split.
10. **An interactive figure's central claim must be MEASURED from rendered output.**
11. **Cast a wide net — build every concept and show them all.** He is the picker. Seven per element.
12. **Where Wallach names a sign but not a number, draw no number.**
13. **Build for evidence and instruction, not for explanation.** The reader must have something to
    lose, or something to do.

---

**Board 88/88 · corpus untouched · nothing live · SEVEN elements and 49 concepts parked awaiting his
first look · index at `temporary/_overnight-2026-08-04.html` · NEXT = he reviews, answers the four
rulings, and names what to build.**
