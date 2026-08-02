# Vitamin B5 (Pantothenic Acid) — design-prep build sheet
> Source materials for chronicle/header-research/vitamin-b5.md. Byte-verified from sealed claims. NOT a design — concept choice + layout stay open for Luneth.

**★ HEADLINE TRAP (read before designing Concept A):** the "coenzyme A / acyl carrier protein / energy / fats / steroid hormones / acetylcholine" material lives in the **claim_text of WAL-CLM-EPIGEN-000038 ONLY**. Its verbatim is a bare deficiency-sign list — it contains NONE of those words. No verbatim anywhere in the pack contains "coenzyme A". So the recommended lead (Concept A) has **ZERO displayable quotes for its core idea**: it can be told in shipped prose, but nothing about coenzyme A may appear inside quotation marks as Wallach's words. Details in Trap resolutions.

---

## Entity-copy draft (ready to slot into dashboard/assets/data/entity-copy.json under "vitamin-b5")

- **lede** (PROPOSAL): "A raw material your body spends to build coenzyme A — the hub molecule behind pulling energy from food, assembling and dismantling fats, and making steroid hormones and the nerve signal acetylcholine."
  [grounded: WAL-CLM-EPIGEN-000038 — note this is the claim's **claim_text**, NOT its verbatim; acceptable for shipped-voice lede prose, but must never be presented as a quote.]

- **why** (PROPOSAL): "Wallach's most recent supplement program lists B5 at 25 to 100 milligrams a day; the target takes the top of that range. It is a plain milligram figure — no unit conversion, no body-weight math — and it supersedes the 50 mg he named in his earlier Base-Line program."
  [source_claim_id = WAL-CLM-EPIGEN-000115 (2014, newest); provenance original_low 25 → original_high 100 → upper_taken 100; NO IU factor, NO ×1.54 weight scale (target.kind = wallach, plain mg). Older 50 mg = WAL-CLM-LETS-000060 (1995). Both the 25–100 and the 50 are verbatim-backed — see below.]

target.kind = **wallach** (numeric 100 mg/day), so the numeric "why" above applies; no honest-gap fallback needed.

---

## Per-concept build materials

### Concept A — Becomes Coenzyme A (identity / assembly)
- **Exact quotes available** — ★ **NONE.** The entire coenzyme-A / four-jobs story is claim_text-only (WAL-CLM-EPIGEN-000038 claim_text). No verbatim in the pack contains "coenzyme A", "acyl carrier protein", "acetylcholine", "steroid hormones", "fatty acids", or "energy from carbohydrates". If a quote is wanted anywhere on this header, it can only be a deficiency-sign token from the same claim's verbatim (see Concept B/D), NOT the mechanism.
- **Numbers** — none. (This concept is mechanism, not dose.)
- **Figure label text** (display-ready strings; ALL are our own glosses of EPIGEN-000038 claim_text, NOT quotes — do not wrap in quotation marks):
  - Input node: `Vitamin B5` — WAL-CLM-EPIGEN-000038 (claim_text)
  - Hub node: `Coenzyme A` — WAL-CLM-EPIGEN-000038 (claim_text). Optional longer form `Coenzyme A + acyl carrier protein`.
  - Four output labels (the "four jobs"): `Energy from food` · `Build & break down fats` · `Steroid hormones` · `Acetylcholine` — all WAL-CLM-EPIGEN-000038 (claim_text). ("Energy from food" glosses the claim_text's "releasing energy from carbohydrates".)
- **Structure notes** — one input feeding one hub feeding four outputs (a "becomes/assembly", NOT a cofactor-fork — the single top input is the whole point; keep it visually unlike copper's fork). Every string here is authored gloss; design must NOT quote any of it. Because there is no quote to anchor credibility, a designer may want a supporting quoted deficiency-sign line pulled from Concept B/D material elsewhere on the header.

### Concept B — The Sign All Three Books Share (cross-source consilience)
- **Exact quotes available** — the shared sign, byte-exact from each book's verbatim:
  - WAL-CLM-EPIGEN-000038 — «Burning feet»
  - WAL-CLM-LETS-000021 — «burning feet»
  - WAL-CLM-RARE-000236 — «burning of feet»
  - Per-panel deficiency-list quotes (exact substrings, to fill the three source panels):
    - WAL-CLM-EPIGEN-000038 — «Dermatitis», «Muscle cramps», «Anorexia», «Anemia», «Quarrelsome attitude», «Insomnia», «Tachycardia», «Depressed immune system»
    - WAL-CLM-LETS-000021 — «abdominal pain», «alopecia», «coordination impairment», «depression», «eczema», «faintness», «fatigue», «hypotension», «muscle spasms», «nausea & vomiting»
    - WAL-CLM-RARE-000236 — «loss of appetite», «quarrelsome, sullen,\ndepressed», «tachycardia», «fainting», «indigestion»
  - Secondary shared row (dossier suggests tachycardia/fainting as a second highlighted band): ★ **DO NOT claim tachycardia is in all three as three quotes.** It is verbatim-backed only in EPIGEN («Tachycardia») and RARE («tachycardia»); the LETS-000021 verbatim is truncated at "nausea & vomiting" and does NOT contain it (claim_text-only). Fainting is «Fainting» (EPIGEN) / «fainting» (RARE) / but LETS verbatim has «faintness», a different word. So the ONLY sign quotable across all three verbatims is burning feet.
- **Numbers** — none.
- **Figure label text** (each a real quote, keep byte-exact):
  - Panel headers (book names, NOT quotes — use book_display): `Epigenetics` · `Let's Play Doctor` · `Rare Earths`
  - Shared-band label: `burning feet` (glossed common form; the three exact quotes above sit in the panels).
- **Structure notes** — three source panels converging on one shared row. The convergence/highlight must land on burning feet only (the sole all-three verbatim sign). If a glyph is used, keep any label off its stroke/glow.

### Concept C — Always on the Bench, Always Playing (ubiquity roster)
- **Exact quotes available** — the B5 dose line from each protocol verbatim:
  - WAL-CLM-LETS-000142 (anxiety) — «B-l,B-2, and B-5 at the rate of 50 mg t.i.d.»  (50 mg verbatim-backed ✓; note the OCR "B-l" = B-1)
  - WAL-CLM-LETS-000159 (bipolar, medium confidence) — «B-l, B-5, B-6\neach at 100 mg b.i.d.»  (100 mg verbatim-backed ✓)
  - WAL-CLM-LETS-000207 (cataracts, medium confidence) — «B-2, B-3, B-5 and B-6 at 50 mg b.i.d.»  (50 mg verbatim-backed ✓)
  - WAL-CLM-LETS-000137 (anemia) — ★ **NO quote available.** The verbatim is truncated at "folic acid 15 mg for 20 days" and never reaches B-5; the "B-5 50 mg three times daily" is claim_text-only. Anemia can appear as a roster row by NAME, but its B5 dose must NOT be shown as a quote.
- **Numbers** (each: value · unit · verbatim-backed claim id · trap note):
  - 50 mg (t.i.d.) · anxiety · WAL-CLM-LETS-000142 verbatim ✓
  - 100 mg (b.i.d.) · bipolar · WAL-CLM-LETS-000159 verbatim ✓ (medium confidence)
  - 50 mg (b.i.d.) · cataracts · WAL-CLM-LETS-000207 verbatim ✓ (medium confidence)
  - 50 mg (t.i.d.) · anemia · ★ claim_text-only (WAL-CLM-LETS-000137 verbatim truncated before B-5) — **do not display as a quote**; if the roster shows an anemia dose figure at all, mark its provenance as claim_text, not verbatim.
- **Figure label text** (roster rows — condition name is a label, dose is the quote/number):
  - `Anemia` — 50 mg (claim_text-only, see trap) — WAL-CLM-LETS-000137
  - `Anxiety` — `50 mg` — WAL-CLM-LETS-000142 (verbatim)
  - `Bipolar` — `100 mg` — WAL-CLM-LETS-000159 (verbatim, medium)
  - `Cataracts` — `50 mg` — WAL-CLM-LETS-000207 (verbatim, medium)
- **Structure notes** — a short condition roster with the dose in one aligned column so the recurring ~50 mg reads at a glance. Honesty guardrail (dossier §5): every one of these is a MULTI-nutrient protocol; the roster must not imply B5 alone treats any of them. If anemia is used, either drop its dose figure or flag it as claim_text-sourced.

### Concept D — It Hits the Body and the Mood (two-lane deficiency split)
- **Exact quotes available** — BODY lane (byte-exact, verbatim-backed):
  - WAL-CLM-EPIGEN-000038 — «Burning feet», «Muscle cramps», «Tachycardia», «Fainting», «Anorexia»
  - WAL-CLM-LETS-000021 — «burning feet», «muscle spasms», «faintness», «fatigue»
  - WAL-CLM-RARE-000236 — «burning of feet», «loss of appetite», «tachycardia», «fainting»
- **Exact quotes available** — MIND lane (byte-exact, verbatim-backed):
  - WAL-CLM-EPIGEN-000038 — «Quarrelsome attitude», «sullen», «Depressed», «Insomnia»
  - WAL-CLM-RARE-000236 — «quarrelsome, sullen,\ndepressed» (or the shorter «quarrelsome», «sullen», «depressed»)
  - WAL-CLM-LETS-000021 — «depression», «insomnia»
  - ★ **"nervous / nervousness" has NO quote** — the dossier's mind-lane lists "nervous", but the LETS-000021 verbatim is truncated at "nausea & vomiting" and does not contain "nervousness" (claim_text-only). Same for "rapid heartbeat/tachycardia" and "weakness" from LETS-000021.
- **Numbers** — none.
- **Figure label text** (short sign-chips; each chip is a real quote — keep byte-exact, or use the shared gloss shown):
  - BODY chips: `Burning feet` · `Muscle cramps` · `Tachycardia` · `Fainting` · `Loss of appetite`  (sources: burning feet = any of the three; muscle cramps = EPIGEN-000038 / LETS-000021 "muscle spasms"; tachycardia = EPIGEN-000038 or RARE-000236, NOT LETS; fainting = EPIGEN/RARE; appetite = EPIGEN «Anorexia» / RARE «loss of appetite»)
  - MIND chips: `Quarrelsome` · `Sullen` · `Depressed` · `Insomnia`  (sources: EPIGEN-000038 and/or RARE-000236 for all four; insomnia also LETS-000021). Drop "nervous" unless shown as claim_text, not a quote.
- **Structure notes** — two labelled lanes (body vs mind) of the same deficiency; a 2×N grid so the two lanes top-align by construction (element-headers Rule 4). Every chip should map to a verbatim quote; the un-quotable ones (nervousness, LETS-tachycardia, weakness) must be dropped or explicitly marked claim_text.

---

## Trap resolutions (claim_text > verbatim)

Every case where the dossier's fact/number is NOT in the cited claim's verbatim (it lives in claim_text only), verified against the pack:

- **Coenzyme A + acyl carrier protein + energy/fats/steroid hormones/acetylcholine (Concept A's entire core)** -> claim_text-only in WAL-CLM-EPIGEN-000038; the verbatim is a bare deficiency-sign list. NO verbatim in the pack contains "coenzyme A". **Do not display any of this mechanism as a quote.** Usable only as authored gloss (lede, figure labels).
- **Tachycardia "in all three books"** -> verbatim-backed only in WAL-CLM-EPIGEN-000038 («Tachycardia») and WAL-CLM-RARE-000236 («tachycardia»). WAL-CLM-LETS-000021 verbatim is truncated at "nausea & vomiting" — tachycardia is claim_text-only there. **Do not present tachycardia as a three-book shared quote.**
- **Fainting "in all three"** -> «Fainting» (EPIGEN-000038) and «fainting» (RARE-000236) are verbatim; WAL-CLM-LETS-000021 verbatim has «faintness» (different word), and its claim_text says "faintness" too. Quotable per-book but NOT a single identical shared string.
- **Nervousness / weakness / rapid heartbeat from LETS-000021** -> all claim_text-only (LETS-000021 verbatim ends at "nausea & vomiting"). **No quotes; drop from any quote-bearing chip.**
- **Anemia B-5 50 mg t.i.d. (Concept C first row)** -> claim_text-only in WAL-CLM-LETS-000137; verbatim truncated at "folic acid 15 mg for 20 days" before reaching B-5. **The anemia B5 dose has no verbatim; do not show it as a quote.**
- **Anxiety B5 50 mg** -> verbatim-backed: cite WAL-CLM-LETS-000142 («...B-5 at the rate of 50 mg t.i.d.») ✓
- **Bipolar B5 100 mg** -> verbatim-backed: cite WAL-CLM-LETS-000159 («B-l, B-5, B-6\neach at 100 mg b.i.d.») ✓ (medium confidence)
- **Cataracts B5 50 mg** -> verbatim-backed: cite WAL-CLM-LETS-000207 («B-2, B-3, B-5 and B-6 at 50 mg b.i.d.») ✓ (medium confidence)
- **Target 25–100 mg / 100 mg** -> verbatim-backed: WAL-CLM-EPIGEN-000115 verbatim «Vitamin B5 (pantothenic acid) 25 - 100 mg» ✓ (upper 100).
- **Older 50 mg TSN + 300–1,000 mg pharmacologic** -> both verbatim-backed: WAL-CLM-LETS-000060 verbatim «PANTOTHENIC ACID ...4 mg 50 mg 300 to 1,000 mg». The 4 mg is the government RDA (Wallach reprints only to argue against it — not his figure); the 300–1,000 mg is a 30-day therapeutic dose, NOT the daily target. **Show 100 mg as the target; never surface 300–1,000 mg as the number.**

---

## Category / width / background (from element-headers.md)

- **Category accent:** vitamin -> **orange** (`data-category` drives it; view derives the accent, never hardcoded).
- **Width:** the header must match the element detail screen exactly (`.kd-ep-fam` box). Do NOT author a figure at full page width. If a figure is used, name its width from the closed set (`mech` 600px · `fork` 700px · `rail` 660px); a figure authored past the ~817px real ceiling silently mis-scales every label. (Actual width choice = design-time.)
- **Background:** the tan `.kd-ep-fam` main content box (`--ds-paper-deep`), tinted by the vitamin/orange accent — it leads directly into the Best-Youngevity-sources block, so keep the box background continuous with that section.

---

## Still OPEN for Luneth (do NOT pre-decide)

- Which concept, or a mix (dossier §6 recommends A "Becomes coenzyme A"; B is the runner-up sign-led option — but note A has no quotable material, which is a design constraint, not a verdict).
- Chassis-vs-composed layout.
- Final figure layout, coordinates, geometry, CSS.
- Final display copy, tone, and headline wording.
- Visual sign-off (the STOP-for-verification gate).
