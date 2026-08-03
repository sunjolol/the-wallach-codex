# Cobalt — does a human need elemental cobalt, or only B12?

_Opened 2026-07-15. **Status: ★ RESOLVED 2026-07-16 — Luneth ruled. Shipped in commit `823b8823`
at kv=337.** Header corrected 2026-08-03: it read "OPEN — needs Luneth's call" for 18 days AFTER
the call was made and implemented, so a later session re-opened a settled question on its authority.
The body below is preserved unedited — it is the evidence he read, and §7's framing of the question
still explains what was decided and why. Nothing in §1–§6 is superseded; only the status line was._

## ★ THE RULING (2026-07-16)

**Luneth's answer: "no elemental-cobalt target ever, and cobalt auto-fills from B12."** He made the
call after reading *Immortality* and *Let's Play Doctor* himself — this is not a Claude inference.
One premise of his was corrected in the same pass ("cobalt is toxic if ingested directly" is NOT in
the books; there is only an EXCESS note at 20–30 mg/day, ~50–75× the mcg scale), so the on-page
alert rests on the provable ground: **he states no amount.** He then rejected the first visual
("a wall of text is the opposite of clarity") and signed off the rebuild: *"Much better."*

**What shipped, and is still live (verified 2026-08-03):**
- canon `cobalt.coverage_kind: "mirrors"`, `mirrors_slug: "vitamin-b12"` (was `trace_pdm`).
- Both dose claims (`WAL-CLM-IMMORT-000084`, `WAL-CLM-RARE-000014`) carry
  `dose.applies_to: ["vitamin-b12"]` — so the 250–400 mcg doses B12 only, and cobalt posts no number.
- `_SAME_SUBSTANCE_SLUGS` emptied — §1.6's self-refuting exemption is gone. **Removing it was the
  negative control**, exactly as §1.6 predicted.
- NEW gates, same patch (R7): `mirrors_resolve` (critical) + `tools/test_mirrors_resolve.py`
  (8 cases, incl. "the 400 mcg returns") + `tools/render_probe_mirror.js` (5 worlds).
- §5's trap was caught before shipping: deleting the target alone would have left cobalt on
  `trace_pdm` and rendered **COBALT: COVERED while VITAMIN B12: GAP** on one screen. 2 of 4
  adversarial judges killed that option by asking what the USER would SEE.

**★ STILL OPEN, and it is §4's last bullet, not the ruling itself.** The keystone sentence for the
B12-only side — *"A pure cobalt requirement is only found in some bacteria and algae"* — is in NO
sealed claim's verbatim. Re-measured 2026-08-03: it is present in `dddl-3e-2011`, `rare-earths` and
`epigenetics` (1 occurrence each), so it is genuinely Wallach's, but in our corpus it exists only as
our own `claim_text` prose on `WAL-CLM-RARE-000114`, whose attached verbatim
(*"a single cobalt atom is the central metal component of vitamin B12…"*) does not contain it.
**It should be MINED as a real claim** so the ruling's evidence is sealed rather than paraphrased.

**In plain terms.** Our board tells you to get 400 micrograms of cobalt a day. Wallach never wrote
that number for cobalt — it is his number for vitamin B12, which got copied onto cobalt because he
writes the two as one word, "B12/cobalt". Deleting it is easy and nobody disputes it. The hard part
is what the cobalt tile should say *afterwards*, and that turns on a question the books answer
**both ways**: does a human need cobalt itself, or only B12 (the molecule that has a cobalt atom in
it)? This file lays out every passage on both sides, with exact lines, and takes no side.

**Why this file exists rather than a decision:** per `two-sided-synthesis-claim`, a genuinely
two-sided Wallach stance is Luneth's call, not Claude's. Three prior attempts at this fix each
asserted one side as settled and were each wrong (see §6).

---

## §1 — NOT IN DISPUTE (settled by evidence, no call needed)

These were checked against the book bytes directly. Nothing below is a judgment call.

1. **No Wallach book states an elemental-cobalt daily amount for humans.** All 7 books swept;
   183 occurrences of `cobal` (incl. 3 line-broken `co-/balt`) reviewed. Every cobalt+mcg pairing
   in the entire corpus is labelled B12 or his compound token "B12/cobalt":
   - `immortality.txt:5977` · `dddl-third-edition-2011.txt:7532` · `epigenetics.txt:22936` ·
     `rare-earths-forbidden-cures.txt:23400` · `epigenetics.txt:27229`

2. **★ His own dose table is the strongest single item.** `epigenetics.txt:27219-27259`,
   *"Recommendations for a Daily Multiple Vitamin and Mineral Intake"*:
   - The **Vitamin** section carries `Vitamin B12 (methylcobalamin) 400 mcg` (`:27229`).
   - The **Mineral** section (`:27245-27259`) lists **14 minerals and has NO cobalt row**:
     Boron · Calcium · Chromium · Copper · Iodine · Iron · Magnesium · Manganese · Molybdenum ·
     Potassium · Selenium · Silica · Vanadium · Zinc.
   - So in Wallach's own supplement program the 400 mcg sits on the B12 line, and cobalt is absent
     from the minerals he doses.

3. **The base-line table has no cobalt either.** `lets-play-doctor-fourth-edition-1995.txt` —
   the book `books-meta.json` flags as carrying the base-line dose table — has **ZERO** `cobal`
   hits. FIG. 8-1 (`:3754-3792`) B12 row: `VITAMIN B-12 3 mcg 200 mcg 1,000 mcg`
   (RDA / True Supplement Need / Pharmacologic). **None of those is 400 mcg.** No cobalt row.

4. **The 250–400 mcg IS Wallach's own number** (not an RDA he argues against — the FIG-8-1 column
   trap does not apply here). He marks ownership in the first person in two books:
   - `epigenetics.txt:22936-22937`: *"The RDA for B,,/cobalt is 3 to 4 mcg per day, **we prefer**
     'expensive urine' **and like** 250 to 400 mcg per day…"*
   - `rare-earths-forbidden-cures.txt:23400-23402`: same, *"we prefer expensive urine and like"*.
   - But it is a **B12** number: the RDA he contrasts it against ("3 to 4 mcg") is the B12 RDA —
     **there is no government RDA for cobalt** — and his own next sentence resolves the slash to
     B12 alone: `immortality.txt:5979-5980` *"Pregnant and nursing mothers should especially take
     care to supplement with the optimum levels of **B12**."*

5. **TWO claims fan the number, not one.** The earlier handoff named only `WAL-CLM-IMMORT-000084`.
   `WAL-CLM-RARE-000014` (Rare Earths, 1994) carries the same `250-400 mcg` and also maps cobalt.
   Verified in the derived artifact: cobalt's target is `low: 400.0` sourced from IMMORT-000084
   (2008 wins on year) with RARE-000014 sitting in `other_claims`. **Fixing only one leaves the
   other to re-post 400 mcg.**

6. **The false premise is CODIFIED in a live gate, not just in prose.**
   `tools/invariants.py:2044-2046`:
   ```python
   _SAME_SUBSTANCE_SLUGS = (
       frozenset({"cobalt", "vitamin-b12"}),
   )
   ```
   with the stated reason (`:2041-2043`): *"cobalt is the metal atom at the centre of the cobalamin
   molecule; Wallach's '250-400 mcg' is one intake described by both names."* The sentence refutes
   itself — "the metal atom at the centre of" is a PART-OF relation; "one intake described by both
   names" is an IDENTITY relation. **Ran the gate's own impl with that entry removed:**
   ```
   BASELINE  -> (True,  '1 collective dose claim(s) ... not fanned out')
   CONTROL   -> (False, "2 dose claim(s) map >1 essential but declare NEITHER
                 dose.collective_group NOR a known same-substance pair:
                 WAL-CLM-IMMORT-000084 maps ['cobalt','vitamin-b12'];
                 WAL-CLM-RARE-000014 maps ['cobalt','vitamin-b12']")
   ```
   So the negative control this fix needs **already exists and is free** — removing the false
   exception reproduces the pre-fix world on demand.

7. **A live user-facing leak, independent of the target.** Cobalt's entity page renders **two**
   dose cards today: `corpus-embed.json` → cobalt → `claims_by_kind.dose` = `[WAL-CLM-IMMORT-000084,
   WAL-CLM-RARE-000014]`. Deleting the *target* does not remove them; both derive from the same
   `essentials` field on the claims, so one correction closes both.

8. **Today's defect fails SAFE.** 400 mcg is ~23× any plausible figure, so cobalt renders `gap`.
   It is never falsely green. **There is no emergency; correctness beats speed here.**

---

## §2 — SIDE A: "the human requirement is for B12, not elemental cobalt"

- **`immortality.txt:5881-5889`** (the passage the original decision rests on):
  > "The essentiality of cobalt is unusual in that the requirement is for a cobalt
  > complex known as cyanocobalamine or vitamin B12. A pure cobalt requirement is only found in
  > some bacteria and algae and the need for B12 cobalt is thought by some to represent a symbiotic
  > relationship between microbes which generate and manufacture B12 from elemental cobalt and
  > vertebrates that require B12."
  - Repeated in 3 other books: `dddl-third-edition-2011.txt:7470-7475` ·
    `epigenetics.txt:22858-22862` · `rare-earths-forbidden-cures.txt:23280-23288`.

- **`immortality.txt:5891-5895`** — the elemental route is assigned to ruminants:
  > "Ruminants (i.e. cows, sheep, goats, deer, antelope, buffalo, giraffe, etc.) can use elemental
  > cobalt because the microbes fermenting and digesting plant material in their first stomach
  > (rumen) convert elemental cobalt into vitamin B12, which the animal then uses."

- **`immortality.txt:5896-5898`** — carnivores get B12 from ruminant prey, not from elemental cobalt.

- **§1.2 + §1.3 above** — his own two dose tables carry a B12 line and no cobalt line.

- **`immortality.txt:5979-5980`** — the dose claim's own closing sentence names B12, not cobalt.

**What Side A supports:** cobalt's requirement is satisfied by B12 and by nothing else → the tile
should track B12 (the "mirror"), or carry no verdict of its own.

---

## §3 — SIDE B: "cobalt has a human role and route independent of B12"

★ Every item here is from the **same encyclopedia entry** as Side A — mostly within 100 lines of it.

- **`immortality.txt:5946-5947`** — the sharpest counter. The word **"also"** separates a human
  cobalt role FROM the B12 roles listed in the preceding sentences:
  > "…and red blood cell synthesis are dependent on B12. **Cobalt is also required as a necessary
  > cofactor for the production of the thyroid hormone thyroxin.**"
  - Mirrored in 2 more books: `dddl-third-edition-2011.txt:7512-7513` · `epigenetics.txt:22944-22945`.

- **`immortality.txt:5859-5863`** — three functions listed, of which B12 is only the third:
  > "Cobalt functions as a cofactor and an activator for enzymes, 'fixes' nitrogen during amino acid
  > production, **and** a single cobalt atom is the central metal component of vitamin B12…"
  - Sealed as `WAL-CLM-IMMORT-000079` / `WAL-CLM-RARE-000114`.

- **`immortality.txt:5972-5975`** — an elemental soil→crop→human route that **prevents and cures**
  deficiency in **people**:
  > "Less than 0.07 ppm Co in the soil results in cobalt deficiency in animals **and people** who eat
  > crops grown from those soils; 0.11 ppm Co in the soil **prevents and cures** Co deficiency."

- **`immortality.txt:5906-5908`** — humans absorb metallic cobalt:
  > "Metallic cobalt itself is absorbed at the rate of 20 to 26.2% by mice **and in humans** if
  > intrinsic factor is present in the stomach and the stomach pH is 2.0 or less."

- **`immortality.txt:5915-5917`** — plant-derived cobalt is endorsed by name:
  > "**Plant derived cobalt is very bioavailable**; however, because of low salt diets and cobalt
  > depleted soils, vegetarians frequently have B12 deficiencies."

- **`immortality.txt:5857-5858`** — cobalt is essential to man as an element:
  > "Cobalt is essential for all forms of life including blue-green algae, some bacteria and fungi,
  > some plants, insects, birds, reptiles, amphibians and mammals **including man**."

- **Membership + delivery:** cobalt is one of the 60 in *"Table 12-5. The 60 Essential Elements,
  Metals and Minerals"* (`rare-earths-forbidden-cures.txt:35469`; corroborated `epigenetics.txt:19570`),
  and his own assay of the humic shale he doses lists it: `Cobalt 9.0` ppm
  (`epigenetics.txt:27277` · `rare-earths-forbidden-cures.txt:20829`).

**What Side B supports:** cobalt is not reducible to B12 → a mechanism asserting "cobalt ≡ B12"
hardcodes a reduction his own book refuses.

---

## §4 — NOT EVIDENCE (looks load-bearing, is not)

- **`immortality.txt:5985`** *"Cobalt excess in man (20 to 30 mg/day)…"* — a **toxicity** ceiling,
  not a target. Never surface it as an amount.
- **Body-composition / soil / rock ppm tables** (`immortality.txt:5820-5828`, `:14746`,
  `hk.txt:7041`) — concentrations, not intakes.
- **`Cobalt 9.0` in the colloidal assay** — proves cobalt is IN the bottle. It does **not** prove
  the bottle is his intended cobalt route, and it does **no work in the coverage math**: the PDM
  meter reads total mineral mass vs 924 mg; cobalt's 9.0 ppm enters no formula. (Counter-example:
  tin sits in the same assay at 0.03 ppm and still carries its own 500 mcg dose.)
- **The "/" in "B12/cobalt"** — a typographic compound label. Reading it as an equals sign is our
  interpretation, not his statement.
- **`WAL-CLM-RARE-000014`'s verbatim** — *"250 to 400 mcg per day, especially while preparing for a
  pregnancy and nursing"* — names **neither** substance, and sits in an OCR-garbled region
  (`B,,` for `B12`, `meg` for `mcg`). It cannot by itself settle whose number it is.
- **"A pure cobalt requirement is only found in some bacteria and algae"** — ★ this sentence, the
  keystone of Side A, **is in no sealed claim's verbatim.** It exists in the corpus only as our own
  `claim_text` prose on `WAL-CLM-RARE-000114`, whose attached verbatim does not support it. If the
  decision rests on it, **it needs to be mined as a real claim first.**

---

## §5 — WHAT EACH OPTION MAKES THE TILE SAY

| Option | Cobalt tile | The problem with it |
|---|---|---|
| **Mirror B12** (the 2026-07-15 call) | covered iff your B12 is covered | Hardcodes cobalt ≡ B12 into the verdict engine — refuted by §3's "also… thyroxin" in 3 books. New forever-concept serving 1 tile of 91. |
| **Plant Derived** (canon's own `trace_pdm`) | covered off the PDM bottle | **False green, reachable via his own protocol:** Plant Derived Minerals™ = 600 mg/serving, ZERO B12; at his own 1 fl oz/100 lb (×1.54 @ 154 lb) = 924 mg = 100% → **COBALT: COVERED while VITAMIN B12: GAP on the same screen.** Turns a fail-safe defect into a fail-green one. |
| **Honest gap** | no number, no verdict | Under-claims but never lies; survives BOTH sides. Cost: cobalt's canon `coverage_kind` must move `trace_pdm` → `unspecified` (a sealed-pillar edit needing Luneth's sign-off), and the blank tile is today **visually identical** to the 53 unmined ones (`.tile.pending` has no CSS rule), so the special case would be invisible without the absence-as-state fix. |

★ **Deleting the target is not neutral.** `targets_derive.py:293`'s `else` reads
`e.get("coverage_kind")` from the canon, and the canon already says cobalt is `trace_pdm`
(`essentials-canon.json`). So with no dose claim, cobalt **falls into Plant Derived by default** —
row 2 above. There is no "delete it and decide later" path; the landing spot must be chosen.

---

## §6 — THE THREE PRIOR ATTEMPTS, AND WHY THIS FILE EXISTS

Each asserted one side as settled. Each was wrong in a different direction.

1. **`collective_group`** — would make cobalt statusless via a branch nobody intended, and plants a
   dead alias on vitamin-b12 (the EFA dead-alias shape: *"a loaded branch waiting for someone to
   feed it"*). Diagnosed + rejected 2026-07-15.
2. **The EFA pattern** — proposed in a handoff, traced through the real code, found wrong, and
   corrected before anyone acted on it (commit `3bf795ff`).
3. **The mirror** — proposed as the shape that "actually fits", on the premise that *"cobalt has no
   independent delivery at all, because Wallach says elemental cobalt is unusable by humans."*
   **§3 refutes that premise from the same chapter.** He says humans absorb metallic cobalt, that
   plant-derived cobalt is very bioavailable, that soil cobalt prevents and cures deficiency in
   people, and that cobalt is *also* required for thyroxin.

★ **The pattern:** each attempt read the half of the entry that supported the mechanism it had
already picked. The entry is genuinely two-sided. That is the finding.

---

## §7 — THE CALL

**For Luneth.** The question is not "which mechanism" — it is:

> **Does Wallach's framework hold that a human's cobalt need is met ONLY by B12, or does cobalt
> have a requirement of its own?**

- Answer **"only via B12"** → the mirror is faithful, and §3's thyroxin sentence needs an explicit
  ruling (it is his own word "also").
- Answer **"cobalt has its own role, he just never gave a number"** → the honest gap is the only
  option that does not assert something he did not say.
- Answer **"the plant-derived bottle is his cobalt route"** → Plant Derived, and the false green in
  §5 needs an explicit ruling.

Whichever way it goes, §1 ships regardless: the fabricated 400 mcg dies, both claims are corrected,
`_SAME_SUBSTANCE_SLUGS`'s false reason is deleted (its removal IS the negative control), the two
dose cards leave cobalt's page, and the lying comment at `state/coverage.ts:697-698` — *"silver/tin/
cobalt carry their own Wallach dose → kind 'wallach' → the numeric path below, never here"* — is
corrected.

**Nothing is being implemented until this is answered.**
