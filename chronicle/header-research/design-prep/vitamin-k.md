# Vitamin K — design-prep build sheet
> Source materials for chronicle/header-research/vitamin-k.md. Byte-verified from sealed claims in `_packs/vitamin-k.json`. NOT a design — concept choice + layout stay open for Luneth.

> ★ READ THE BIG TRAP FIRST (§ Trap resolutions below): the richest-sounding facts in this pack — "prothrombin + five clotting factors", "deposition of calcium in bones", "about half is made in the colon", "isolated 1939", "menaquinone", "K2" — live ONLY in the claim_text of WAL-CLM-EPIGEN-000034 / -000176, **NOT in any verbatim**. They are true, grounded, quotable-as-fact in the lede/labels, but they CANNOT be shown as a Wallach «quote». The verbatims carry the *deficiency* framing, not the *positive mechanism*. This shapes what every concept can and cannot put in quotation marks.

## Entity-copy draft (ready to slot into dashboard/assets/data/entity-copy.json under "vitamin-k")
- **lede** (PROPOSAL): "The clotting vitamin — the fat-soluble factor the liver needs to make prothrombin and five other blood-clotting proteins, and the same one that settles calcium into bone; you even brew about half of it yourself, in your gut."  [grounded: WAL-CLM-EPIGEN-000034 — every fact here is in that claim's claim_text; note "five other proteins", "deposition of calcium in bones", and "half…in the colon" are claim_text facts, NOT verbatim quotes]
  - Alt (mechanism-lean, also grounded WAL-CLM-EPIGEN-000034 + osteoporosis corroboration WAL-CLM-LETS-000042 / WAL-CLM-RARE-000232): "A fat-soluble vitamin best known for letting blood clot — yet Wallach ties a shortage as readily to fragile bones as to easy bruising, because the same vitamin that seals a wound directs calcium into the skeleton."
- **why** (PROPOSAL): "The daily target is 300 mcg. Wallach's Epigenetics daily-multiple program lists vitamin K1 or K2 at 60–300 mcg (WAL-CLM-EPIGEN-000121); the derive takes the upper bound of that range, 300 mcg. The source is already stated in micrograms per day, so no IU conversion and no body-weight scaling apply — the posted number is the range's high end, unrounded. One honest wrinkle: an earlier book, Let's Play Doctor (1995), lists a 'True Supplement Need' of 140 mcg (WAL-CLM-LETS-000076); the app favors the newest Wallach number (Epigenetics, 2014), which is why 300 mcg wins over 140 mcg. The 15 mg/day vitamin K in the easy-bruising protocol (WAL-CLM-LETS-000261) is a short-term therapeutic dose — roughly 50× the maintenance target — and is never the daily number."  [source_claim_id: WAL-CLM-EPIGEN-000121 · upper_taken 300 of range 60–300 mcg · factors: none (no IU factor, no ×1.54 weight scale, no rounding) · older-number wrinkle: WAL-CLM-LETS-000076 (140 mcg, favor-newest) · therapeutic-dose foil: WAL-CLM-LETS-000261 (15 mg/day)]
  - target.kind is numeric `wallach` (300 mcg) — no honest-gap wording needed.

## Per-concept build materials

### Concept A — "Two Jobs" (seal-and-cement split) — RECOMMENDED LEAD (dossier §6)
- **Exact quotes available** (byte-exact substrings of the cited verbatim):
  - WAL-CLM-EPIGEN-000034 — «Osteocalcin deficiency»
  - WAL-CLM-EPIGEN-000034 — «Extended clotting time»
  - WAL-CLM-EPIGEN-000034 — «Ecchymoses, epistaxis (nose bleeds), hematuria, Gl bleeding, etc.»  (NB: OCR "Gl" = GI, byte-exact as shown)
  - WAL-CLM-EPIGEN-000034 — «Liver disease»
  - WAL-CLM-EPIGEN-000034 — «K-deficiency health problems include:»
  - WAL-CLM-RARE-000232 — «Extended clotting time, hemorrhage, osteoporosis»  (single-line substring; full verbatim continues "(osteocalcin\n\ndeficiency).")
  - WAL-CLM-LETS-000042 — «poor clotting time»
  - WAL-CLM-LETS-000042 — «osteoporosis.»
- **★ NOT quotable (claim_text only — use as FACT / label, never in quotation marks):** the positive mechanism that IS the concept's hook — "liver needs it to make prothrombin", "five other proteins (factors VII, IX, X, proteins C, S)", "for proper blood clotting", "for the proper deposition of calcium in bones". All of that lives in WAL-CLM-EPIGEN-000034's *claim_text* (and its embedded "In his words:" line, which is inside claim_text, not the sealed verbatim field). The verbatim gives you the two DESTINATIONS only through their *deficiency* names: «Extended clotting time» (blood side) and «Osteocalcin deficiency» / «osteoporosis» (bone side).
- **Numbers** — none needed for this concept (it is a mechanism split, no figure). If a bone stat is wanted, there is none in verbatim; do not invent one.
- **Figure label text** (display-ready, grounded facts — our words, not quotes):
  - Left / blood side: "Seals the wound" · "clotting" — grounded WAL-CLM-EPIGEN-000034 (clotting-protein mechanism, claim_text) + deficiency quote «Extended clotting time».
  - Right / bone side: "Cements calcium into bone" · "osteocalcin" — grounded WAL-CLM-EPIGEN-000034 (calcium-deposition mechanism, claim_text) + deficiency quote «Osteocalcin deficiency»; osteoporosis corroborated WAL-CLM-LETS-000042, WAL-CLM-RARE-000232.
  - Seam glyph: "K" — the letter (pack `letter: "K"`).
- **Structure notes** — one shared origin (the K glyph) at the seam, two destinations, two arrows; symmetry reads "one vitamin, two jobs" by construction. Two labeled endpoints, not a cascade. The two endpoint labels can each pair one of our fact-phrases with one byte-exact deficiency quote.

### Concept B — "Homemade Half" (gut co-op)
- **Exact quotes available:**
  - WAL-CLM-LETS-000382 — «(the bacteria will synthesize vitamin K)»
  - WAL-CLM-LETS-000382 — «reseed colon with Lactobacillus acidophilus»
- **★ NOT quotable / TRAP (the whole "half" wow rests here):** "about half of the body's requirement is produced by probiotic bacteria in the colon" is WAL-CLM-EPIGEN-000034 **claim_text ONLY**. The word "half" and the proportion appear in NO verbatim in the pack. The only verbatim-backed gut fact is the LETS-000382 clause above, which supports *self-synthesis* but says nothing about *how much*.
- **Numbers** — "½ / ~50%": **claim_text-only (WAL-CLM-EPIGEN-000034), do NOT display as a quote or as a sourced figure.** If the split figure shows "~half", it must be framed as Wallach's stated estimate (claim_text), never in quotation marks and never attributed to a verbatim.
- **Figure label text** (grounded facts, our words):
  - "About half — from diet" / "About half — made by your gut bacteria" — the *proportion* grounded on WAL-CLM-EPIGEN-000034 (claim_text); the *gut-synthesis* half additionally quote-backed by «(the bacteria will synthesize vitamin K)» (WAL-CLM-LETS-000382).
  - Reseed thread (optional): "reseed the colon with Lactobacillus acidophilus" — quote «reseed colon with Lactobacillus acidophilus».
- **Structure notes** — one divided-supply figure, two segments, one label each; a curio caption, not beats. DESIGN RISK to flag to Luneth: the concept's headline number ("half") has zero verbatim backing — strong-but-narrow, and the number cannot be quoted.

### Concept C — "Read the Bruise" (first visible sign)
- **Exact quotes available:**
  - WAL-CLM-DDDL-000089 — «Bleeding under the skin may indicate vitamin E or vitamin K»  (single-line; full verbatim ends "vitamin K\ndeficiencies")
  - WAL-CLM-EPIGEN-000034 — «Ecchymoses, epistaxis (nose bleeds), hematuria, Gl bleeding, etc.»
  - WAL-CLM-EPIGEN-000034 — «Extended clotting time»
  - WAL-CLM-RARE-000232 — «Extended clotting time, hemorrhage, osteoporosis»
  - WAL-CLM-RARE-000232 — «hemorrhage»
  - WAL-CLM-LETS-000042 — «poor clotting time»
- **★ HONESTY FLAG (dossier §5):** WAL-CLM-DDDL-000089 names vitamin E **OR** K — the sign is NOT K-exclusive. Any caption using this quote must say "K or E", never present bruising as a K-only sign. (Also: copper already owns the first-visible-sign archetype — do not reuse copper's figure.)
- **Numbers** — none.
- **Figure label text** (radiating signs — each a byte-exact quote or a tight fact off the bruise shape):
  - "easy bruising / bleeding under the skin" — quote «Bleeding under the skin may indicate vitamin E or vitamin K» (caption must carry the "or E").
  - "nosebleeds (epistaxis)" — from «Ecchymoses, epistaxis (nose bleeds)…» (WAL-CLM-EPIGEN-000034).
  - "extended clotting time" — quote «Extended clotting time» (WAL-CLM-EPIGEN-000034 / RARE-000232) or «poor clotting time» (LETS-000042).
  - "hemorrhage" — quote «hemorrhage» (WAL-CLM-RARE-000232).
- **Structure notes** — one bruise shape, signs radiating as short OFF-shape labels (element-headers Rule 2: never route a stroke through a label). Deficiency-led, no big-number beat.

### Concept D — "Activator X" (the lost butter factor)
- **Exact quotes available:**
  - WAL-CLM-EPIGEN-000163 — «“Activator X,"»  (NB: byte-exact = curly-open “ + straight-close "; copy exactly)
  - WAL-CLM-EPIGEN-000163 — «Dr. Price discovered an additional fat-soluble nutrient, which he labeled»
  - WAL-CLM-EPIGEN-000163 — «that is present in fish livers and shellfish, organ meats, and butter»
  - WAL-CLM-EPIGEN-000176 — «All primitive cultures had a source of Activator X, now thought to be vitamin»  (single-line; verbatim continues "\nK,, in their diets.")
  - WAL-CLM-EPIGEN-000176 — «K,, in their diets.»  (NB: OCR "K,," double-comma, byte-exact — this is where the verbatim says "vitamin K", see trap)
- **★ TRAP — the "Activator X = K2" identity is NOT verbatim-quotable.** The verbatim of BOTH Activator-X claims says only "vitamin K" (WAL-CLM-EPIGEN-000176 renders it "vitamin\nK,,"). The identification "K2" as the Activator-X reveal lives in the *claim_text* of WAL-CLM-EPIGEN-000163 / -000176 ONLY. (The token "K2" DOES appear in one unrelated verbatim — the dose claim «Vitamin K1 or K2 60 - 300 mcg», WAL-CLM-EPIGEN-000121 — but that is the daily-dose *form*, not the Activator-X payoff; do not borrow it to imply Price's reveal was quoted.) So the payoff "Activator X = vitamin K2" may be stated as Wallach-via-Price's hedged view (claim_text) but must NOT be shown as a «quote» of the Activator-X source, and the quote-backed hedge to reach for is «now thought to be vitamin» — keep the "thought to be" hedge (both claims are `confidence: medium`).
- **★ TRAP — "10×" is NOT in any verbatim.** "primitive diets carried at least 10 times the fat-soluble vitamins of the modern American diet" and "A and D act as catalysts that let the body absorb minerals" are WAL-CLM-EPIGEN-000176 **claim_text ONLY**. Do not display "10×" as a quote or sourced figure.
- **Numbers** — "10×" and "K2": both **claim_text-only, do NOT display as quotes.**
- **Figure label text** (grounded):
  - Object tag: "Activator X" → resolving to "vitamin K (thought to be K2)" — the "X" and "Activator X" quote-backed «“Activator X,"»; the K2 resolution is claim_text, keep hedged.
  - Source motif: "butter from cows on spring/fall grass" — grounded WAL-CLM-EPIGEN-000163; quote available «that is present in fish livers and shellfish, organ meats, and butter».
- **Structure notes** — one evocative object (butter / churn) + one "X→K" tag; a short framed story, quote-forward, no 1-2-3 beats. Both anchors are `confidence: medium` + hedged — copy must preserve "thought to be", never assert K2 flatly.

## Trap resolutions (claim_text > verbatim — every fact/number whose obvious claim_text source is NOT verbatim-backed)
Dose numbers (dossier §5) are all clean; these are the NON-dose traps §5 did not scan:
- **"half" / ~50% (gut-synthesis proportion)** -> claim_text-only (WAL-CLM-EPIGEN-000034); present in NO verbatim. Do NOT display as a quote or a sourced figure. Verbatim gut fact = «(the bacteria will synthesize vitamin K)» (WAL-CLM-LETS-000382) — supports synthesis, not the amount.
- **"K2" AS THE ACTIVATOR-X IDENTITY** -> claim_text-only (WAL-CLM-EPIGEN-000163, -000176); those verbatims say only "vitamin K" / "vitamin\nK,,". Do NOT quote "K2" as Price's reveal; keep the hedge «now thought to be vitamin». (The token "K2" is verbatim-present only in the unrelated dose claim «Vitamin K1 or K2 60 - 300 mcg», WAL-CLM-EPIGEN-000121 — the dose form, not the payoff.)
- **"10 times / 10×" (fat-soluble vitamins in primitive diets)** -> claim_text-only (WAL-CLM-EPIGEN-000176); NOT in verbatim. Do NOT display as a quote.
- **"prothrombin + five other proteins (factors VII, IX, X, proteins C, S)" and "deposition of calcium in bones" (Concept A's positive mechanism)** -> claim_text-only (WAL-CLM-EPIGEN-000034); NOT in verbatim. Usable as grounded FACT/labels, never as a «quote». Verbatim only gives the deficiency framing («Osteocalcin deficiency», «Extended clotting time»).
- **"isolated in 1939" and "menaquinone"** -> claim_text-only (WAL-CLM-EPIGEN-000034); NOT in verbatim. Fact/label only, not a quote.
- **Dose numbers (confirmed verbatim-backed, safe to quote):** 60–300 mcg -> «Vitamin K1 or K2 60 - 300 mcg» (WAL-CLM-EPIGEN-000121); 140 mcg -> «VITAMIN K 70 mcg 140 mcg 140 mcg» (WAL-CLM-LETS-000076) — NB the leading 70 is the RDA Wallach reprints only to argue against, NOT his target; 15 mg/day -> verbatim WAL-CLM-LETS-000261 as «vitamin K at 15\nmg/day» (number split across a newline — the single-line-safe lead-in is «vitamin C to bowel tolerance, vitamin K at 15»).

## Category / width / background (from element-headers.md)
- **Category accent:** vitamin -> **orange** (`category: "vitamin"`, pack). Minerals=blue, vitamins=orange, aminos=green, fatty-acids=purple.
- **Width:** must match the element detail screen exactly; the figure ceiling inside `.kd-ep-fam` is ~817px, and the two exact shipped figure slots are `--fork` 700px and `--rail` 660px (`mech` 600px also available). Author any figure at scale 1 (viewBox width == CSS max-width). Width choice stays OPEN — flagged here only so the design starts from the real container, never a white full-width sheet.
- **Background:** the tan `.kd-ep-fam` box (`--ds-paper-deep`) tinted by the orange vitamin accent; the header's main content box leads directly into the Best-Youngevity-sources block (which stays at the bottom).

## Still OPEN for Luneth (do NOT pre-decide)
- Which concept (or a mix — dossier §6 recommends A "Two Jobs", with B as a possible curio beat inside A).
- Chassis-vs-composed (`blocks[]`) layout shape.
- Final figure layout, coordinates, widths, and illustration.
- Final display copy / tone (the lede + why above are PROPOSALS to ratify).
- Visual sign-off (the STOP-for-verification gate).
