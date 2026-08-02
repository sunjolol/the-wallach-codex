# Folate (Vitamin B9) — design-prep build sheet
> Source materials for chronicle/header-research/vitamin-b9.md. Byte-verified from sealed claims. NOT a design — concept choice + layout stay open for Luneth.

**★ READ THIS FIRST — the pack's verbatims are far thinner than the claim_texts.** Most of the striking prose in the dossier lives in `claim_text` (our summary), NOT in the sealed `verbatim` (Wallach's exact words). Whole hooks — the 98% prevention figure, "works interdependently with B12," "DNA/RNA/red blood cells," "green leafy vegetables," the geographic-tongue "not absorbing / denuded areas" description — have **NO verbatim anywhere in the pack**. They are usable as GROUNDED FACTS (a sealed claim asserts them) inside composed lede/copy, but they can **never be shown in guillemets as a Wallach quote.** Every "Exact quotes available" list below is what actually survives the byte-check; the "Numbers" and Trap sections name exactly where each figure is and isn't verbatim-backed. This gap is the single most important output of this sheet.

---

## Entity-copy draft (ready to slot into dashboard/assets/data/entity-copy.json under "vitamin-b9")

- **lede** (PROPOSAL): "A B-vitamin the body needs to build DNA, RNA and red blood cells, working hand-in-hand with vitamin B12 — so central to making new cells that Wallach reads a shortage in the mother as a birth defect in the child."  [grounded: WAL-CLM-EPIGEN-000041 (function + B12 interdependence, claim_text), WAL-CLM-DDDL-000042 + WAL-CLM-LETS-000359 (deficiency → birth defect)]
  - Note: this is composed prose grounded in the claims, NOT a quote — none of "DNA, RNA and red blood cells" or "interdependent with B12" is byte-present in any verbatim (see traps). It is legitimate as a lede because the sealed claim asserts it; it must not be dressed as a quotation.
  - Alternate (use only if Concept A "Fingerprint" is NOT the lead, so the lede doesn't pre-spend A's beat): "The vitamin the body needs to copy its own DNA and build red blood cells alongside B12 — run short of either and the very same anemia appears." [grounded: WAL-CLM-EPIGEN-000041]

- **why** (PROPOSAL): "Wallach's daily target is 400 mcg, taken straight from the daily multiple-vitamin program in his Epigenetics (2014). Folate is a water-soluble vitamin dosed directly in micrograms, so there is no IU conversion and no body-weight scaling — the number is simply the amount he lists, with no range to reduce and no rounding. His earlier Base Line program (Let's Play Doctor, 1995) named a higher 1,000 mcg 'true supplement need'; the app follows the newest figure."  [source_claim_id: WAL-CLM-EPIGEN-000123 · provenance original_low 400 = upper_taken 400 · unit mcg · NO IU factor · NO ×1.54 weight-scale · NO rounding]
  - target.kind = **wallach** (numeric, 400 mcg/day) — a real number, not a gap. The chain is a direct lift, not a computation, and the "why" should say so honestly (per dossier §4: do not present 400 mcg as a derived calculation).
  - Honest note available for the tip: WAL-CLM-LETS-000052 verbatim «FOLIC ACID 400 mcg 1,000 mcg 15 to 20 mg» — three columns (govt RDA · Wallach true-need · 30-day pharmacologic). The 1,000 mcg true-need is verbatim-backed; newest-wins picks 400 mcg (2014).

---

## Per-concept build materials

### Concept A — The Fingerprint (not genetic, a shortage you can prevent)

- **Exact quotes available** (byte-exact substrings; note the source uses CURLY quotes “ ” — reproduce them exactly):
  - WAL-CLM-DDDL-000042 — «a repeatable “fingerprint” on a specific gene»
  - WAL-CLM-DDDL-000042 — «“genetic defects” are simple mineral deficiencies»
  - WAL-CLM-DDDL-000042 — «leave a repeatable “fingerprint” on a specific gene, in a specific location, on
a specific chromosome.»  (spans a line break)
  - WAL-CLM-DDDL-000042 — «deficiency of zinc resulting in a cleft palate or spina bifida in a farm animal»  (★ names ZINC, not folic acid — see trap)
  - WAL-CLM-LETS-000359 — «MENINGOCELE (severe anencephlia or
spina bifida): is a severe birth defect»  (OCR spelling "anencephlia" is in the source — keep it if quoted, or take a cleaner sub-substring)
  - WAL-CLM-LETS-000359 — «This birth
defect is caused by a deficiency of folic acid, B-
12, or zinc and vitamin A during early pregnancy»  (spans line breaks; only claim in the pack whose VERBATIM ties folic acid to the birth defect)
  - WAL-CLM-LETS-000010 — «birth defects (spina bifida,
hydroencephalocoele)»
  - WAL-CLM-RARE-000239 — «Anemia, poor growth, birth defects (spina bifida).»
  - WAL-CLM-EPIGEN-000041 — «Birth defects (Neural tube defects (hydroencephaloceole, spina bifida, etc.)»

- **Numbers:**
  - **98%** (prevented before conception) · no unit · ★ **TRAP: claim_text-only.** WAL-CLM-DDDL-000042's `claim_text` says "prevented up to 98% of them by supplying the proper nutrients before conception," but its `verbatim` contains NO "98", no "prevented", no "before conception", and no "folic acid". **Do NOT display 98% as a quote.** It may be stated as a grounded fact (the sealed claim asserts it), but it can never appear in guillemets. This is the concept's headline number and it is NOT quotable.
  - No other numeric figure in this concept.

- **Figure label text** (exact display strings, each tied to its claim):
  - "a repeatable fingerprint on one gene" — Wallach's own phrasing, verbatim-backed as «a repeatable “fingerprint” on a specific gene» (WAL-CLM-DDDL-000042). Safe as an annotation.
  - "labeled genetic" / "actually a deficiency" — our reframe labels (composed, not quotes); the "genetic" half is grounded in «“genetic defects” are simple mineral deficiencies» (WAL-CLM-DDDL-000042).
  - "spina bifida · cleft palate" — condition names, verbatim-backed (WAL-CLM-DDDL-000042 «cleft palate or spina bifida», WAL-CLM-LETS-000359).
  - "up to 98% prevented" — ★ if used as a caption it is a paraphrase of a claim_text-only figure; render as our stated fact, NEVER quoted, and flag at design time.
  - "before conception" — ★ claim_text-only (WAL-CLM-DDDL-000042 / WAL-CLM-LETS-000365); not in any verbatim. Use as our copy, not a quote.

- **Structure notes:** one reveal/reframe turn (labeled-genetic → deficiency fingerprint) landing on the prevention takeaway. One focal fingerprint object + one quiet annotation. WATCH: the strongest verbatim ("fingerprint … on a specific gene") is about ZINC and mineral deficiencies generally; folic-acid-specific birth-defect causation is verbatim only in WAL-CLM-LETS-000359. If the figure must quote folate's own words, pull from LETS-000359, not DDDL-000042.

### Concept B — The Pair (folate + B12 build the blood together)

- **Exact quotes available:**
  - WAL-CLM-LETS-000010 — «anemia (megaloblastic)»  (the ONLY verbatim-backed appearance of "megaloblastic" — note the format is "anemia (megaloblastic)", not "megaloblastic anemia")
  - WAL-CLM-LETS-000010 — «FOLIC ACID DEFICIENCY»  (section header, usable as a label)
  - WAL-CLM-EPIGEN-000041 — «Anemia»  · «Failure to thrive» · «Bleeding gums» · «Weight loss» (single-word list items, all byte-exact)
  - (No verbatim quote exists for the B12-interdependence mechanism — see trap.)

- **Numbers:** none numeric in this concept. (B12 co-dose figures like 1,000 mcg belong to protocol claims, not to the pair-mechanism story.)

- **Figure label text:**
  - "megaloblastic anemia" — ★ CAUTION: the verbatim reads «anemia (megaloblastic)» (WAL-CLM-LETS-000010). If the label is shown as a QUOTE it must match that word order/parenthesis; as plain composed copy "megaloblastic anemia" is fine.
  - "folate" / "B12" / "one red blood cell" — composed labels; the folate↔B12 pairing is grounded in WAL-CLM-EPIGEN-000041 claim_text ("works interdependently with vitamin B12") but is NOT quotable.
  - "run short of either → the same anemia" — our copy; grounded in EPIGEN-000041 claim_text ("a deficiency of either produces a megaloblastic, macrocytic anemia"), NOT verbatim.

- **Structure notes:** two interdependent parts → one output (a red blood cell); a break in either half → the shared anemia. ★ **The entire mechanism (DNA/RNA/red-blood-cell synthesis + "works interdependently with B12" + "macrocytic") is claim_text-only** — WAL-CLM-EPIGEN-000041's verbatim is ONLY the deficiency list. This concept can be BUILT (the sealed claim asserts the mechanism) but carries almost no quotable Wallach line; its only verbatim anchor is «anemia (megaloblastic)». Design accordingly — lean on composed copy, keep quotes minimal and exact. Do NOT add methylation/homocysteine detail (not in any claim, per dossier §5).

### Concept C — Read on the Tongue (the visible first sign of a gut that can't absorb)

- **Exact quotes available:**
  - WAL-CLM-LETS-000010 — «geographic tongue»  (byte-exact, in the deficiency list)
  - WAL-CLM-LETS-000284 — «Treatment of geographic tongue includes
avoidance of any offending food allergens»  (the verbatim here is the TREATMENT paragraph only)
  - WAL-CLM-LETS-000284 — «be sure to get on the
base line supplement program.»
  - (No verbatim for "not absorbing", "denuded areas", "map-like", or "celiac-like small-intestine changes" — see trap.)

- **Numbers:** none intrinsic to the tongue sign. (Treatment doses in LETS-000284 verbatim: zinc «zinc at 50 mg t.i.d.» and «betaine HCl and pancreatic enzymes at 75-200
mg t.i.d.» — those are zinc/enzyme, not folate; do not present as folate numbers.)

- **Figure label text:**
  - "geographic tongue" — verbatim-backed (WAL-CLM-LETS-000010). Safe.
  - "you're not absorbing" — ★ claim_text-only (WAL-CLM-LETS-000284 claim_text lists B-3/B-2/B-6/B-5/B-12/folic acid/zinc as "a red flag that you are not absorbing"); NOT in the verbatim, which is only the treatment. Use as our copy, never a quote.
  - "irregular denuded areas on the top and sides of the tongue" — ★ claim_text-only (WAL-CLM-LETS-000284). NOT quotable. Strong descriptive copy, but present it as our gloss.
  - "not just diet — malabsorption" / "gluten intolerance · celiac · leaky gut · IBS" — ★ claim_text-only (WAL-CLM-EPIGEN-000041 claim_text embeds this as a quoted sentence, but the sealed `verbatim` field does NOT contain it). NOT quotable. The green-leafy-vegetables/malabsorption line is a grounded fact only.

- **Structure notes:** striking visible sign up top, surprising cause (malabsorption, not just diet) as the turn — copper-gray-hair pattern, fresh figure. ★ **The vivid descriptive language that makes this concept work is almost entirely claim_text-only.** The only byte-safe on-figure quote is the two words «geographic tongue». Everything else ("denuded areas," "not absorbing," the malabsorption list) is our composed gloss over a grounded claim. Build it, but do not quotation-mark the descriptions.

### Concept D — One Vitamin, Two Jobs (the nourish-to-treat dose swing)

- **Exact quotes available** (all dose figures below ARE verbatim-backed — this is the best-grounded concept for numbers):
  - WAL-CLM-EPIGEN-000123 — «Folic acid 400 mcg»
  - WAL-CLM-LETS-000462 — «folic acid 1 mg per day»
  - WAL-CLM-LETS-000143 — «Folic acid at 5 mg t.i.d.»  (canker sores; clean "t.i.d.")
  - WAL-CLM-DDDL-000080 — «Folic acid at 5 mg ti.d.»  (canker sores; note OCR typo "ti.d." in THIS verbatim — prefer LETS-000143's clean form for display)
  - WAL-CLM-LETS-000267 — «folic acid at 15-25 mg/day»  · «can also be curative»
  - WAL-CLM-LETS-000288 — «10-75 mg/day»  (gout; the full string is «folic acid at\n10-75 mg/day» spanning a line break — take «10-75 mg/day» for a clean quote)

- **Numbers** (value · unit · verbatim-backed claim id · note):
  - 400 · mcg/day · WAL-CLM-EPIGEN-000123 (verbatim «Folic acid 400 mcg») — the "nourish" end.
  - 1 · mg/day · WAL-CLM-LETS-000462 (verbatim «folic acid 1 mg per day») — vitiligo, lowest therapeutic.
  - 5 · mg t.i.d. · WAL-CLM-LETS-000143 (clean) / WAL-CLM-DDDL-000080 (OCR "ti.d.") — canker sores.
  - 15–25 · mg/day · WAL-CLM-LETS-000267 (verbatim «folic acid at 15-25 mg/day») — epilepsy, "can also be curative."
  - 10–75 · mg/day · WAL-CLM-LETS-000288 (verbatim «10-75 mg/day») — gout, the "treat" ceiling (75 mg).
  - **~190-fold** (400 mcg → 75 mg) · ★ **NOT a Wallach figure.** This is our arithmetic (75 mg = 75,000 mcg; ÷400 = 187.5×). No claim states a ratio. Present the swing by showing the two real endpoints, not by quoting "190×" as if Wallach said it.

- **Additional verbatim-backed doses NOT in the recommended 4 stops (available if a stop is swapped):**
  - anemia — WAL-CLM-LETS-000137 «folic acid 15 mg for 20 days»
  - Crohn's — WAL-CLM-LETS-000238 «5-10 mg t.i.d.» (full: «folic\nacid at 5-10 mg t.i.d.»)
  - dementia — WAL-CLM-LETS-000243 «folic acid at 3-5 mg/day»
  - dumping syndrome — WAL-CLM-LETS-000255 «folic acid at 3-5 mg/day»
  - hepatitis — WAL-CLM-LETS-000298 «folic acid at 5-10 mg/day»
  - IBS — WAL-CLM-LETS-000323 «folic acid at 5-25 mg/day»
  - liver disease — WAL-CLM-LETS-000348 «folic acid at 15-\n25 mg per day» (number split across a line break as "15-\n25")
  - psoriasis — WAL-CLM-LETS-000409 «folic acid at 1 5-25 mg per day» (★ OCR garble "1 5-25" — the "15" is split by a stray space; do NOT show this as a clean quote)
  - seborrheic dermatitis — WAL-CLM-LETS-000430 «15-25\nmg per day» (preceding word run together as "folicacidat")

- **Figure label text:**
  - "400 mcg — daily" (WAL-CLM-EPIGEN-000123); "vitiligo — 1 mg" (WAL-CLM-LETS-000462); "canker sores — 5 mg" (WAL-CLM-LETS-000143); "epilepsy — 15–25 mg" (WAL-CLM-LETS-000267); "gout — up to 75 mg" (WAL-CLM-LETS-000288).
  - "nourish" / "treat" endpoint labels — composed framing; grounded in the dose spread above.

- **Structure notes:** one continuous scale/ladder, ~4–5 sparse stops, labels clear of the axis line (playbook: no stroke through a label; avoid the "plain chart" style Luneth has rejected — must be an elegant scale). Every stop is verbatim-backed; only the "~190×" ratio is ours and must not be quoted.

---

## Trap resolutions (claim_text > verbatim)

Every figure/phrase whose obvious dossier source is NOT verbatim-backed, resolved:

- **98% (prevented before conception)** -> claim_text-only in WAL-CLM-DDDL-000042; NO verbatim contains "98", "prevented", or "before conception". **Do not display as a quote.** Usable as a grounded stated fact only. (This is Concept A's headline number — the biggest trap on the sheet.)
- **"before conception" / "six months before conception"** -> claim_text-only (WAL-CLM-DDDL-000042 and WAL-CLM-LETS-000365). WAL-CLM-LETS-000365 verbatim ends at "essential to maintenance of pregnancy"; no timing figure. Not quotable.
- **"works interdependently with vitamin B12" + "DNA, RNA, and red blood cells" + "macrocytic"** -> claim_text-only in WAL-CLM-EPIGEN-000041; its `verbatim` is ONLY the deficiency list (Birth defects / Failure to thrive / Anemia / Diarrhea / Bleeding gums / Weight loss). The entire Concept-B mechanism is unquotable. Grounded fact, not a quote.
- **"green leafy vegetables" + malabsorption list (gluten/celiac/leaky gut/IBS)** -> claim_text-only in WAL-CLM-EPIGEN-000041 (embedded as a quoted sentence inside claim_text, but ABSENT from the sealed `verbatim`). Cannot be shown in guillemets. Grounds Concept C's cause turn as our copy only.
- **"not absorbing" + "irregular denuded areas on the top and sides of the tongue" + "celiac-like small-intestine changes"** -> claim_text-only in WAL-CLM-LETS-000284; its `verbatim` is the treatment paragraph only. Concept C's descriptive hook is not quotable — only «geographic tongue» (WAL-CLM-LETS-000010) survives the byte-check.
- **"megaloblastic anemia"** -> verbatim-backed but AS «anemia (megaloblastic)» in WAL-CLM-LETS-000010 (note word order/parenthesis). Cite LETS-000010, not EPIGEN-000041 (EPIGEN's verbatim has bare «Anemia» with no "megaloblastic").
- **folic-acid → birth-defect causation quote** -> the fingerprint verbatim (WAL-CLM-DDDL-000042) names ZINC, not folate. The only verbatim tying FOLIC ACID to the birth defect is WAL-CLM-LETS-000359 «...caused by a deficiency of folic acid, B-12, or zinc and vitamin A...». Use LETS-000359 for a folate-specific quote.
- **pilonidal cyst → folic acid** -> claim_text-only in WAL-CLM-LETS-000401; its `verbatim` is treatment-only and does not mention folic acid at all. Not usable as a folate quote (dossier §1 lists it as support; it is not verbatim-backed).
- **"surgery is the only treatment / prevention is the goal" (meningocele)** -> claim_text-only in WAL-CLM-LETS-000359; verbatim ends at "during early pregnancy". Not quotable.
- **1946 discovery year** -> verbatim-backed: WAL-CLM-RARE-000239 «Folic acid (Folacin) - 1946». Safe to display as a quote (a rare byte-safe curio).
- **1,000 mcg (1995 true-need)** -> verbatim-backed: WAL-CLM-LETS-000052 «FOLIC ACID 400 mcg 1,000 mcg 15 to 20 mg». Safe. (App uses newest 400 mcg.)
- **~190-fold swing** -> our arithmetic, no claim states it. Not quotable as a Wallach figure.
- **psoriasis "15-25 mg"** -> verbatim garbled as «1 5-25 mg» (WAL-CLM-LETS-000409); do not quote the number cleanly — prefer LETS-000267 (epilepsy) or LETS-000348/000430 (liver/seborrheic) if a 15–25 mg quote is needed, and even those split "15-\n25" across a line break.

---

## Category / width / background (from element-headers.md)

- **Category accent:** vitamin -> **orange family** (per category-color-coding: minerals=blue · vitamins=orange · aminos=green · fatty-acids=purple). Folate is a water-soluble B vitamin.
- **Width:** must match the element detail screen exactly. Header renders inside the tan `.kd-ep-fam` box; the FIGURE ceiling is the measured constraint, NOT the outer screen — prefer a shipped slot (`fork` 700px or `rail` 660px) over a hand width. Author every figure at scale 1 (viewBox width == CSS max-width). (Rule 1/2, element-headers.md.)
- **Background:** the element's category accent tints `--ds-paper-deep`; the main content box **leads into the Best-Youngevity-sources block** at the bottom, so background/box choice is fixed by that continuity (one of the four fixed things per Rule 0).

---

## Still OPEN for Luneth (do NOT pre-decide)

- Which concept, or a mix (dossier §6 recommends A "The Fingerprint" lead, C "Read on the Tongue" as the safest single-figure runner-up / mix partner).
- Chassis-vs-composed layout.
- Final figure layout, coordinates, and CSS.
- Final display copy and tone (the lede/why above are PROPOSALS).
- Visual sign-off (the STOP gate) before any live build.
