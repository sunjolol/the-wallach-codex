# ★ NEXT SESSION — run genesis, then CONFIRM the next element and build its header demos

**19** demo sets now sit in `temporary/awaiting-refinement/` (counted off disk, not carried forward — the
inherited “thirteen” in this file had drifted and so did my own correction of it; recount, never copy). Board 90/90. Three elements were taken from nothing to banked sets last
session (B9, vanadium, sodium). Run `PYTHONUTF8=1 python tools/genesis.py`, report the split, then
**confirm with Luneth which element** — he closed the last session saying "continue with the next
element", and the measured next-richest is **manganese (36 claims)**. Say which one you are taking and
offer to redirect, the way vanadium and sodium were taken up.

## ⚠⚠ FIRST THING TO RAISE — SODIUM NEEDS REFINEMENT AND HE DID NOT SAY WHAT
`temporary/awaiting-refinement/sodium-demos-r1.html` is banked with **7 concepts** and his verdict was
**"Good enough, but needs some refinement"** — then he closed the session without naming the changes.
**ASK HIM WHAT TO REFINE. Do not guess, do not rebuild, do not "improve" it.** Every other element in
the bank is either approved or has named notes; this is the only one with an unnamed outstanding ask.

## ★★★ THE STANDING LESSON FROM 21 CONCEPTS ACROSS 3 ELEMENTS
**A green `mockup_measure` board sat alongside a visibly broken picture in EVERY SINGLE ROUND — three
elements, no exceptions.** Scale 1.000, zero collisions, zero clipped labels, scroll proven — and then
the screenshot showed: a 13% tint band rendered SOLID orange · two heartbeat traces drawn on top of each
other so "a stronger contraction" was invisible · two labels sharing a baseline that read as one run-on
sentence · a chip label 6px wider than its own box with both end glyphs clipped by the border · a ground
shadow rendered as a solid black oval. **None of those is visible to a text-vs-text probe. All were
obvious within one second of looking.** Screenshot every panel and READ IT. Every time.

### The two traps that recurred WITHIN one session
1. **A reveal class forces `opacity:1` and beats an SVG `opacity` attribute.** Any element carrying
   `.<el>-rv` must use `fill-opacity` / `stroke-opacity`. I documented this on vanadium and then hit it
   again on sodium, in a stylesheet that carried my own warning. Knowing a trap is not avoiding it —
   **scan for it**: parse every SVG *tag* (tags span lines, so do not grep lines) for a reveal class plus
   a bare `opacity=`. On sodium that scan found exactly one, matching the screenshot.
2. **Measure, never estimate.** The caption face renders at ~7.0px/char, not ~6.0; 13px display bold is
   ~48px for 4 characters, not ~34px. Two captions ran 97px and 72px off their own viewBox, and a spine
   placed at an "obviously safe" distance ran straight through every year numeral.

### ★ And a piece of his taste, learned on vanadium: DEMONSTRATE, DON'T DECORATE
Told "I do wish the color aspect was hit more" + "D is the weakest by far", the wrong answer is a richer
palette. The right answer was **four tubes of the element actually in solution** — rim, meniscus, specular
highlight, depth gradient, coloured light pooling on the surface beneath — **carrying an argument**: the
blue tube is vanadium(IV) = vanadyl, the exact form he says the gut absorbs at 0.1–1%. An aesthetic note
wants a realistic demonstration that makes a point, not more colour.

## ✓ SODIUM — r1 BANKED, REFINEMENT UNSPECIFIED (`temporary/awaiting-refinement/sodium-demos-r1.html`)
7 concepts, `--category mineral`. **A** what salt is made of (REALISTIC — sodium metal under oil + a flask
of chlorine + salt as isometric cubes; the National Geographic passage he quotes) · **B** the salt block
(REALISTIC — hollowed where licked, 85% minimum, "dumber than cows") · **C** forty-eight hours (the 1940
Richter boy, dead 48h after his salt was restricted, autopsy Addison's) · **D** the heat wave of '93
(70–100 g/day lost in sweat vs the 0.9% saline that treated survivors) · **E** your stomach acid is made
out of salt (NaCl → HCl → protein / B12 intrinsic factor / mineral absorption) · **F** both of these are
his (THE HONESTY PANEL) · **G** worth their salt (salarium, Via Salacia, Sierra Leone).

### ★★★ SODIUM IS THE ELEMENT YOU CAN QUOTE INTO EITHER POSITION
His 2015 book: salt does **not** cause high blood pressure, restricting it **shortens your life**
(`HELLS-000061`). His own 1995 **sodium TOXICITY table**: hypertension, edema, congestive heart failure,
renal failure (`LETS-000033`). **Both are his.** A panel on either quote alone misrepresents him, so F
prints both lists side by side unedited. He reconciles them by moving the cause — "salt sensitivity" is
driven by restricted **calcium and potassium**, not salt (`EPIGEN-000332`) — and that belongs in the
payoff, never the headline. Every panel touching blood pressure carries an explicit contradicts-consensus
+ not-advice note, because a reader on a prescribed low-sodium diet for heart failure can land here.

### Sodium target — corroborated across two books once units are reconciled
**3,300 mg** (`LETS-000066`, 1995 base-line true-supplement-need; the 1,100 mg beside it is the RDA he
reprints to argue with). His 2014 book states the requirement as **6–10 g of SALT** (`EPIGEN-000324`);
salt is **39.34% sodium** by weight, so that is 2,360–3,933 mg sodium and 3,300 sits inside it (≈ 8.4 g
salt/day). **The conversion is OURS and is flagged as such in-panel.** Oddity left on the record: the
"300–3,000 mg" 30-day figure on that row is LOWER than his daily target, reverse of every other row.

### ⚠ Sodium finding to act on separately
`WAL-CLM-LETS-000032` (his 22-sign sodium deficiency roster) has **no authored question and no
answer_short** — the only claim in the pack Ask Wallach cannot answer from, and "what are the symptoms of
low sodium" is the most obvious question anyone would type. Unused material: the Japanese comparison
(`HELLS-000063` 15 g/day + 85% less CVD; `RARE-000186` says 28 g/day — **older, so favour-newest picks 15
and the two must NEVER be shown side by side as books disagreeing**), the 1997 Sodium Task Force 600%
heart-attack figure (`HELLS-000062`), pregnancy toxemia + the pregnancy salt requirement
(`DDDL-000245` + `RARE-000368`), water intoxication in infants on low-sodium formula (`EPIGEN-000327`).


## ✓ VANADIUM — r1 BANKED + APPROVED, with D REPLACED on his note (`temporary/awaiting-refinement/vanadium-demos-r1.html`). Do NOT rebuild vanadium.
Luneth: **"These are good enough, I do wish the color aspect was hit more though. D is the weakest by far"** → rebuilt D, then **"Good enough"**. Seven concepts: **A** it acts like insulin (blood glucose normal while serum insulin stays LOW; the 1985 Vancouver "vanadium will replace insulin" line) · **B** not genetic (struck "a genetically-transmitted disease" → "a simple mineral deficiency", over his own Cr · Va · Zn table row) · **C** the craving is the sign (soft drink FIRST, water LAST, + the 300% urinary-loss loop) · **D** four colours in a glass (**the replacement** — see below) · **E** named for a goddess (1801 · del Rio · Vanadis · the 1971 essentiality gap) · **F** beyond blood sugar (inotropic effect · cholesterol · tumours in mice) · **G** a dog's life (40 / 28 / 12 minerals, Cr · V · Li TOTALLY ABSENT). lede + why (**150 mcg**) await ratification.

### ★★★ WHAT "GO FURTHER THAN SIMPLE COLORS" MEANT — demonstrate, don't decorate
The rejected D was absorption bars; the r1 colour panel (E) was six flat swatches. His note was that colour was **underplayed**. The fix was not more swatches: vanadium's colours **track its oxidation state**, so D became four tubes of the same element actually in solution — rim, empty glass above the liquid line, meniscus, specular highlight, depth gradient, and **coloured light pooling on the surface under each tube**. Then it stopped being chemistry and became an argument: the blue tube is **vanadium(IV) = vanadyl**, which is exactly the form Wallach names as vanadyl sulfate and says the gut absorbs at **0.1–1%** — so the panel ends on "the prettiest state on the shelf is the one that mostly goes straight through you", keeping the best fact from the discarded D without its bar chart. **Lesson: a "more colour" note wants a REALISTIC DEMONSTRATION that carries an argument, not a richer palette.**

### ⚠ OPEN FOR LUNETH — D and E now overlap on colour
E's abstract swatch row was a placeholder for the idea D now demonstrates properly. **If both ship, E's swatches are redundant**; E's history (1801 / del Rio / Vanadis / 1971) stands on its own. Raised with him, NOT decided.

### ⚠ A LABEL CAN OVERFLOW A BOX AND NO GATE SEES IT
D's "vanadyl — the label form" chip measured **173.9px inside a 168px box** — both end glyphs clipped by its own border. `mockup_measure` compares text vs TEXT and text vs the viewBox EDGE; it never checks a label against a decorative shape it is meant to sit inside. A padding probe was written + negative-controlled (passes 7/7, fires exit 1 on the narrow box) and left in the **scratchpad on purpose** — folding it into `mockup_measure` changes a shared tool and was not this chunk. Its own first run reported **10 phantom overflows** until containment was required on BOTH axes: a probe's first output is not evidence.

## ✓ B9 (Folic Acid) — r1 BANKED + **ALL SEVEN APPROVED** first time (`temporary/awaiting-refinement/vitamin-b9-demos-r1.html`). Do NOT rebuild B9.
Luneth: **"All of these are good."** Seven labelled concepts: **A** six months before (the only folate instruction with a clock on it; prevention band → conception → "after it has formed, surgery is the only treatment"; hero 98%, flagged in-panel as his ANIMAL work) · **B** half the answer (one spina-bifida bar split 50% folic acid / 50% zinc — the rare place he CAPS his own nutrient, and the honest overlap constraint in HIS voice, not our counts) · **C** locked (with B12 bound folate releases; without it, deficient at optimal intake) · **D** the masking effect (the anemia corrects, the gut and nerves keep descending) · **E** three skin complaints (psoriasis · dandruff · vitiligo, his dose under each; vitiligo is ALSO on his deficiency list) · **F** thirty-one years (1930→1946→1963→1996→1998, hero −20%; first real use of Hell's Kitchen) · **G** every folate figure on one scale (five bars to 75,000 mcg, only the 2nd a daily amount, hero 75×, zinc-overdose ceiling). lede + why (**1,000 mcg**) await ratification.

### ★★★ THE B9 LESSON — the dossier proposed the number we had already OVERTURNED
`vitamin-b9.md` proposed a 400 mcg target citing dead `WAL-CLM-EPIGEN-000123`. That is the exact claim deleted 2026-08-05 (commit `4b962ea0`) after Luneth read the page and ruled the 2014 row a **book misprint** — **ratified divergence 74**. Folate ships at **1,000 mcg** (`WAL-CLM-LETS-000052`, his 1995 true-supplement-need column; the 400 beside it is the government RDA he reprints to argue with). Trusting the dossier would have posted the RDA as his recommendation in all seven panels. It also said 24 claims (corpus holds **38**) and that no discovery/history material exists — while concept F is built entirely on that history. **Third element running** where a picked concept sits on material its own dossier forbade (B2 glow, B5 yeast flask, B9 FDA trail). Verify the target from `essentials-targets-data.json` + `git log -S` on the id, never from a dossier.

### ⚠ A GREEN mockup_measure PASSED TWO FIGURES THAT RENDERED A LIE
A reveal rule `.vb9-anim.vb9-in .vb9-rv { opacity: 1 }` **overrides an SVG `opacity` presentation attribute** — so a 13% tint band rendered SOLID and two bars captioned "a paler tail" rendered solid, making a figure's own caption false. Board was perfectly green: scale 1.000, no collisions, no clipped labels, scroll proven. **Any element carrying a reveal class must use `fill-opacity` / `stroke-opacity`, never `opacity="…"`.** This is the attribute-loses-to-CSS trap arriving from a NEW direction — your own reveal CSS, not a fill. Also re-learned: a spine placed at an *estimated* safe distance ran through every year numeral (4 chars of display bold = ~48px, not the ~34px estimated).

## ✓ B6 (Pyridoxine) — r2 REBUILT + APPROVED (temporary/awaiting-refinement/vitamin-b6-demos-r2.html). Do NOT rebuild B6; the r1 notes below are HISTORICAL.

## ✓ B2 (Riboflavin) — r4 BANKED + APPROVED (`temporary/awaiting-refinement/vitamin-b2-demos-r4.html`). Do NOT rebuild B2.
Six labelled concepts. Luneth: **"C, E and F are the best."** — **C** the three sites Wallach names (corners of the
mouth · nasolabial folds · "geographic" tongue, three-across, each mark over its own name, no leader lines) ·
**E** the 1879 discovery (an actual dish of whey + its fluorescence, both labelled, over an 1879/1932/1935 rule) ·
**F** same-list-both-ends (clear lens passing light vs clouded lens blocking it, the early eye signs named beside).
Also built and kept: **A** what B2 BECOMES (B2 → FMN + FAD → Energy under named columns) · **B** *it switches the
others on* (the two named conversions — inactive B6 → functional B6, tryptophan → niacin, each enzyme named on its
arrow; NEW this round and the strongest unused idea in the pack) · **D** his 12-entry deficiency roster with
`depression` and `dizziness` ignited. r1 + r3 and their orphaned fragments were moved to
`temporary/recycling-bin/_superseded/2026-08-09-vb2-rejected-rounds/`.

### ★★★ THE LESSON FROM THREE B2 REJECTIONS — a header figure MUST LABEL ITS OWN PARTS
r3 was rejected with: *"huge illustrations that literally say nothing … so braindead to just show a bright light
illustration that illustrates nothing … Illustrations MUST MAKE VISUAL SENSE."* All five r3 figures were beautiful,
animated, **unlabelled atmospheres** (a dot field, a crack, a glare, a glow) with every word sitting BELOW the
figure. The fix came from screenshotting the APPROVED sets instead of designing from taste: **every figure Luneth
has approved names its parts inside the frame** — niacin's NAD figure labels Carbohydrate / Fat / Protein in and
Energy out; B1's rice grain labels "thiamine-bearing bran" on a leader, "POLISHING" on the arrow, and captions each
grain. **Test: could a reader get the whole panel from the figure alone, prose removed?** If no, it is decoration.
He does NOT hate diagrams — a clean 5-node labelled flow is the approved genre; clutter is the failure.
Screenshot two approved sets BEFORE designing anything. [[element-header-illustration-failure-modes]] updated.

### ⚠ vitamin-b2.md dossier drift — two flags are STALE, fix before reuse
The dossier says the mechanism lives in `claim_text` only with "no mechanism verbatim to pull by ID" (**false** —
`WAL-CLM-EPIGEN-000243` carries a full quotable mechanism verbatim, used in A/B/D/F), and says there is no
"riboflavin is yellow" fact and to **not** inject it as world knowledge (**false** — `WAL-CLM-IMMORT-000297` states
the 1879 yellow-green fluorescent pigment in milk whey byte-exact, plus 1932 Warburg / 1935 Kuhn; `IMMORT-000296`
corroborates). Concept E exists entirely on grounding the dossier forbids. It also claims no discovery/history
material exists; IMMORT-000297 is exactly that. lede + why (50 mg — `EPIGEN-000113` upper of 10–50, independently
corroborated at the same 50 mg by `LETS-000064`; the 1.6 mg on that row is the RDA decoy) await ratification.

## B6 (Pyridoxine) — r1 rejection notes, HISTORICAL (B6 r2 is approved; do not rebuild)
Built 5 concepts (dial · epilepsy twin-EEG · drug-drain · pregnancy arc · carpal-tunnel swap); Luneth rejected
ALL — **not the info, the PRESENTATION**: "clearly lower quality than the rest … it's the way it's presented."
DIAGNOSIS (a diagnosis, NOT a ban on any shape): the r1 visuals drifted to infographic/diagram idioms — a
labelled dose gauge, a stat + draining vessel, a numbered timeline, comparison cards — instead of the singular,
beautiful, often typographic/organic HERO images that carried niacin (three monumental Ds, the glowing furnace)
and B1 (heart↔mind poles, rice grains). QUOTE REGRESSION (corrected — Luneth caught it with a before/after, and I had WRONGLY said I
“didn’t change the quote styling”): my header demos dropped the established app quote component
**`.ds-pull-quote`** — a large italic pull-quote with the giant “ glyph (::before, accent), a **`.ds-mark`**
warm-yellow highlight on the key phrase, a `footer` attribution (“— DR. JOEL WALLACH · BOOK”), plus the
“General education, not medical advice” disclaimer (design-system.css:475 + :749; STYLE-GUIDE.md; rendered
live by entity-page.ts) — in favour of a plain hand-rolled `border-left` quote (~1.04rem) with a mono
claim-id line. This regression is in **niacin, B1 AND B6** (I mis-diagnosed it as “only the epilepsy
concept” by comparing B6 to niacin/B1, which had ALSO already regressed — a false baseline). Fix on the B6
retry AND when refining niacin/B1: use the real **`.ds-pull-quote` + `.ds-mark`** treatment, not a custom
quote. DEEPER LESSON (the likely root of the “lower quality”): build header figures with the real
design-system components, not hand-rolled approximations. **NO rule was made between the B1
demo (approved) and the B6 demo (rejected)** — this was execution, not a restriction; the earlier pro-HERO note
("a boxed loop / bar chart / stat-tile reads boring/clinical") argues AGAINST the clinical drift, so it was a
failure to heed my own note. RETRY: rebuild each B6 concept toward a striking hero with real craft (material +
grounding are solid). Rejected r1 files (reference for what to RAISE ABOVE, never repeat): temporary/header-
fragments/vb6-frags/ (vb6-dial/seizure/drain/maternal/scalpel) + temporary/awaiting-refinement/vitamin-b6-demos-r1.html.
GROUNDING (verified 2026-08-08, reuse): all 12 non-dead ids live; **dead id RARE-000237 → substitute EPIGEN-000108 +
LETS-000027**. By concept: A dial (LETS-000028 toxicity + EPIGEN-000108 deficiency + EPIGEN-000116 window) · B
epilepsy (LETS-000267 + LETS-000233/000120 + EPIGEN-000108 Tourette) · C drain (IMMORT-000009 pill + RARE-000286
BP-drugs) · D pregnancy (IMMORT-000008 + LETS-000407 breast-milk + LETS-000210 preconception) · E carpal-tunnel
(LETS-000205 + LETS-000383 + EPIGEN-000108). Target 100 mg (EPIGEN-000116 25–100; older 50 mg LETS-000063; the
2.2 mg RDA on that row is the decoy).

## Banked demos (all in `temporary/awaiting-refinement/`, all Luneth-approved as starting points)
- **vitamin-d-demos-r4.html** — 4 sun-forward (A sun+cholesterol, B 400%/sunscreen, C sun-dose, D Goldilocks). Round-closed `ceaaa3d6`.
- **vitamin-k-demos-r1.html** — 4 (A Two Jobs, B Homemade Half, C Read the Bruise, D Activator X). "All 4 good, some tweaks."
- **vitamin-b12-demos-r1.html** — 6 (A Red Crystal **[his FAVORITE]**, B Made by Microbes, C What Survives, D Losing the Insulation, E Why B12 energises you, F Why you're secretly low). E/F = the ENERGY angle.
- **vitamin-b3-demos-r1.html** — 4, vitamin/orange, the coenzyme-and-pellagra vitamin. A "The Three Ds" (typographic pellagra triad — Diarrhea/gut · Dermatitis/skin · Dementia/mind under a PELLAGRA band, +retardation + beef-tongue; EPIGEN-000037/RARE-000235) · B **[FAVORITE]** "What burns your food" (the glowing NAD·NADP furnace — carbs+fat+protein converge in, Energy radiates out, animated flow+glow; EPIGEN-000037, the pack's SOLE mechanism claim) · C **[FAVORITE]** "Why time-release?" (the flush — a big-dose bloom flaring vs a time-release calm, with a ⚠ note that the flush→time-release CAUSATION is pharmacology, not one Wallach sentence; LETS-000020 + the recurring "time-release" qualifier) · D "The mind's default" (the identical 450 mg·time-release chip down anxiety/bipolar/dementia/hysteria/insomnia/headache under "organic brain syndrome"; LETS-000388 + 6 per-condition protocols). Luneth: "all are good, especially B and C." ALL 16 cited ids verified LIVE, **niacin.md dossier CLEAN** (no dead ids). A/D both touch the mind but stay distinct (A=deficiency collapse, D=therapeutic breadth). lede + why (100 mg = top of Epigenetics 10–100 mg EPIGEN-000114; older 50 mg LETS-000059 a footnote, newest-wins) await ratification. Round-closed this session.
- **vitamin-b5-demos-r1.html** — 6, vitamin/orange, pantothenic acid. **Luneth: "A, C, D, E, and F are all good."** A becomes-coenzyme-A (B5 → CoA → four unrelated jobs) · C body-vs-mood two-lane split · D four doses to scale (RDA 4 mg sliver / 100 mg / 300–1,000 mg + a 100× hero to the 10–20 g overdose range) · E found-by-accident (the yeast flask, 1930s→1940) · F the quiet teammate (4 programs, near-constant dose). **B (three books, one sign) was NOT picked** — he liked the presentation but: *"showing contradictions across books is not something to bring front-facing."* He explicitly said **do not make a rule of this**, it is a small note: the three-lists figure reads as books DISAGREEING, even though it was built to show agreement. lede + why (100 mg) await ratification.
- **vanadium-demos-r1.html** — 7, mineral/blue, the blood-sugar mineral. **ALL APPROVED, D REPLACED** (see the vanadium block above). 66 sealed claims — tied richest of everything remaining. Target **150 mcg** and it is the board's FIRST two-step derivation: 50–100 mcg **per 100 lb** (`EPIGEN-000138`) → upper end → ×1.54 to a 154 lb reference → 2 s.f. The 1995 500 mcg (`LETS-000070`) is a corroboration in `other_claims`, not the target.
- **vitamin-b9-demos-r1.html** — 7, vitamin/orange, folic acid. **ALL SEVEN APPROVED first time** (see the B9 block above for each concept). 38 sealed claims, the richest B vitamin. Target **1,000 mcg** (`LETS-000052`) — NOT the dossier's 400 mcg, which is the overturned misprint. lede + why await ratification.
- **vitamin-b2-demos-r4.html** — 6, vitamin/orange, the labelled-figure round. **C + E + F are his picks**; A/B/D banked alongside (B = the B6-activation / tryptophan→niacin switchboard, unused and strong). lede + why (50 mg) await ratification.
- **vitamin-b1-demos-r1.html** — 4, vitamin/orange, thiamine the "beri-beri vitamin". A "Heart to the Mind" (the two-pole reach — one thiamine thread joining a failing HEART [ECG flatlining: CHF/beriberi/palpitations] and a failing MIND [fraying neural cluster: memory loss/Wernicke-Korsakoff/confusion/depression]; RARE-000233 byte-exact + EPIGEN-000035 cofactor) · B "I cannot" (polished-rice origin — whole grain w/ thiamine-bearing bran ring vs stripped white grain, "beriberi = Sinhalese for 'I cannot'"; DDDL-000043) · C "False Alzheimer's" (reversible reframe — "Alzheimer's/permanent" struck then "Korsakoff's, a thiamine gap, REVERSIBLE", ⚠ flagged as WALLACH'S FRAMEWORK not consensus/advice; EPIGEN-000014 byte-exact reversal + LETS-000333) · D "The dose ladder" (50→100→200-500 mg climbing, surprise top rung 500 mg "repels mosquitoes"; LETS-000068 + EPIGEN-000112 + LETS-000370). Luneth: "all of these are good." ALL 12 ids verified LIVE, **vitamin-b1.md CLEAN**. Cofactor mechanism + "I cannot"/"bran removed" are claim_text (not byte-exact slices) → cited, not quote-marked. lede (beri-beri / heart↔mind) + why (100 mg, top of Epigenetics 10–100 mg EPIGEN-000112; 50 mg LETS-000068 footnote) await ratification. Round-closed this session.
- **iron-demos-r1.html** — 4, FIRST mineral / blue (A oxygen-seat+CO, B pica+trial, C earth-core, D "it was never the iron" **[his BEST]**). "some combination of them all will likely be the final state."
- **iodine-demos-r1.html** — 4, mineral / blue (A the dial hypo↔hyper, B copper-twist **[the "wow"]**, C sea-to-gland gradient, D goitrogen block). Round-closed `3fc5a40f`. B/D share a theme → only ONE ships; lede+why (230 mcg) await ratification (canon coverage_kind still "unspecified").
- **amino-trio-demos-r1.html** — FIRST amino_acid / green AND first GROUP page: arginine + taurine + tyrosine (each too thin solo; all share IMMORT-000058). 7 concepts, **dopamine-forward**. Banked "workable, needs some changes." Luneth SCRAPPED a body-map + an anatomical eye as amateurish → **hand-drawn anatomy is a weak spot; favor abstract/flow/molecular/typographic.**
- **chromium-demos-r1.html** — mineral / blue, one of the richest palettes. 5 concepts: A vicious-circle (sugar⟳chromium loop) · B **[KEPT]** +33.3% lifespan bars · C 1-in-100 grain field · D **[KEPT]** GTF gem emblem · E dark provocation. **REVAMP LESSON:** a boxed loop / bar chart / stat dashboard reads "boring/clinical" → the fix is a **visceral hero visual + motion**; B/D never needed it (each already had a hero). Target 620 mcg/day (Wallach-sourced).
- **boron-demos-r1.html** — mineral / blue, the bone-and-hormone trace mineral. 4 concepts: A "Eight Days" (the 8-day flip, IMMORT-000043, the wow) · B "The Seal" (reworked to a without-vs-with loss-comparison, IMMORT-000042) · C "Two Jobs" (bone-density ↔ endocrine trio) · D "The Latecomer" (dates claim_text-only, weakest-grounded). lede + why (9.2 mg) await ratification. boron.md was CLEAN.
- **potassium-demos-r1.html** — mineral / blue (the intracellular electrolyte). 5 concepts: A "Can't bank it" (90% out in urine → 5,000 mg/day; IMMORT-000193) · B "5,000 vs 99" (daily need vs FDA cap, framed HONESTLY) · C "The inside cation" · D "The narrow window" (**most-visceral** — an ECG flatlining both ends) · E "Where it comes from" (**first external USDA foods table**, ORAC-style, labeled REFERENCE). lede + why (5,000 mg direct) await ratification.
- vitamin-c-demos-r2.html, vitamin-e-demos.html — older, liked, not finalised.

## The workflow (standing policy)
- Header/demo HTML lives in `temporary/awaiting-refinement/` **by default** until he graduates it to
  `temporary/ready-to-be-ported/`. Port to LIVE only from there, with explicit approval + STOP-for-sign-off. [[header-demos-default-to-awaiting-refinement]].
- MOVING a demo between `temporary/` depths → **regenerate via `tools/mockup_harness.py` to the new path, never `mv`** (the `../../dashboard` depth is baked in).
- **Fragments are written via `safe_write` with a `.htmlfrag` suffix, NOT `.html`.** A fragment is partial HTML;
  safe_write's `.html` shape-check rejects anything not ending in `</html>`, so a non-.html suffix skips it while
  the harness still reads any path. The Write tool is hook-blocked for ALL repo files (incl. gitignored `temporary/`),
  and `pre_bash_guard`'s BANNED_DIRS do NOT include `temporary/` — so the clean UTF-8-safe path is: stage the
  fragment in the scratchpad, then `safe_write rewrite temporary/header-fragments/<el>-frags/<el>-x.htmlfrag`.
  The assembled demo (a full `.html` ending in `</html>`) is written directly by the harness.
- Per-element process: read `chronicle/header-research/<el>.md` → pull verbatims BY CLAIM-ID **and verify each id is
  still in the sealed corpus** (`claim_review.py --ids …`) → build **genuinely-distinct** fragments
  (`mockup_harness --category <mineral|vitamin|amino_acid|…>`; mineral=blue #2b6fb0, vitamin=orange #ff7e3c
  [DEFAULT, no override], amino=green #5aa82c, omega=purple) → `mockup_measure` (every scale 1.000; fixed-px SVG +
  CSS-gradient art avoid the trap — a responsive `width:100%` SVG WILL flag, give figures a fixed authored width) →
  screenshot via a puppeteer script (force the reveal class e.g. `.nia-in` so nothing shoots blank; the in-app
  browser may refuse file:// on a new file) → park → STOP for his pick. **Cast a wide net — 4+ concepts, or a GROUP
  page when the element is too thin solo.**
- **Give every figure a HERO moment — be ambitious.** A boxed loop / bar chart / stat-tile dashboard reads
  "boring/clinical"; a visceral centrepiece + motion is what lands (chromium revamp, B12 crystal, iron seat, B3 furnace).
- The benefit panel must land a visceral **"oh, so THIS is why"** — personal, topical. [[element-header-benefit-panel-needs-the-aha]], [[element-header-illustration-failure-modes]].
- **Verify with your eyes, not the code.** View the actual rendered output (screenshot/zoom) and confirm the EXACT
  flagged thing before claiming fixed; for motion you can't screenshot, reason honestly about the mechanism. [[screenshot-verify-visual-chunks]], [[verification-doctrine]].

## ★ NEXT TASK — CONFIRM the element, then build its demos (sodium is CLOSED, refinement pending)
Measured claim counts — **use this ranking, never a dossier count**:
vanadium 66 ✓ · sodium 66 ✓ · **manganese 36** · cobalt 35 · phosphorus 34 · germanium 34 · choline 34 ·
tryptophan 33 · sulfur 28 · flavonoids 27 · phenylalanine 23 · methionine 22 · silver 18 · lysine 18 ·
leucine 17 · valine 16 · silica 12 · isoleucine 12 · histidine 9 · threonine 8.
The thin tail (silica / isoleucine / histidine / threonine) are the **group-page** candidates.

**The method, now proven over three elements — follow it exactly:**
1. Screenshot **two APPROVED sets** first (B2 r4 + B5 r1 are good references) and copy the panel anatomy
   1:1 before adapting: eyebrow → kill headline → setup prose → captioned figure whose parts are named
   INSIDE the frame → real `.ds-pull-quote` + `.ds-mark` → payoff with bold key phrases → mono claim-id
   line → ⚠ mono caveat → disclaimer.
2. `claim_review.py --entity <slug>` and read **every** sealed claim. Run `dossier_sweep.py`, then treat
   the dossier as a head start only — it has been wrong on all three elements so far.
3. Verify the target from `dashboard/assets/data/essentials-targets-data.json` **provenance** +
   `git log -S <claim-id>`. Never from a dossier, never from memory.
4. Build 5–7 genuinely-distinct concepts where **every figure LABELS ITS OWN PARTS** (test: could a
   reader get the panel from the figure alone, prose removed?). Reach for a **realistic demonstration**
   when the material allows it — that is what has landed best.
5. `mockup_measure` → the reveal-`opacity` tag scan → the boxed-label padding check → **screenshot every
   panel and READ IT** → park in `temporary/awaiting-refinement/` → **STOP for his picks.**

**Reusable scratch tooling from last session** (all scratchpad-only, none wired into a gate): a shared
chrome assembler (`assemble-<el>.py`: one style block + one why-block + per-concept bodies, derived
element-to-element by `sed` so packs cannot drift), a per-panel screenshotter that forces every reveal
class on, a single-figure cropper, and the boxed-label padding probe. Re-create them by the same pattern;
folding the padding probe into `mockup_measure` is a real change to a shared tool and remains undone.

## After B9 — remaining options (ask Luneth then)
B9 is closed, so the standing pair of options is: Either **(a) REFINE** a banked set toward porting (he picks element + concept/combination), graduate to `ready-to-be-ported/`, port LIVE
(needs the composed `blocks[]` shape + **a live `--ds-accent` category override for amino=green + omega=purple** — NOT
yet in drawer-knowledge.css; mineral + vitamin[default orange] already resolve — + his STOP-for-sign-off); OR **(b) BUILD**
the next element. Remaining dossiers:
B9 · manganese vanadium germanium sodium sulfur phosphorus silica cobalt silver ·
choline flavonoids · the remaining amino acids (phenylalanine, lysine, methionine, tryptophan, histidine, leucine, isoleucine, valine, threonine — several thin → candidate group pages).

## Nutrient-overlap dashboard (built 2026-08-09, at his request)
`temporary/nutrient-condition-overlap.html`, regenerated by `temporary/build-scripts/nutrient-overlap-build.py`.
Answers "which nutrient is MOST responsible for X" the only honest way: **Wallach assigns no percentages of
responsibility anywhere**, so it derives share-of-HIS-CLAIMS, split cause (deficiency_sign) vs cure (protocol),
with book-breadth as the better signal. **Headline finding: only 11 of 542 conditions have ≥3 independent claims on
BOTH sides** — everywhere else the percentages are membership-in-one-list, and each card says so. Least-specific
signs: arthritis 45 nutrients · depression 31 · headache 31 · rheumatoid arthritis 30 · dementia 28. **Design
consequence: a header must never imply one element owns a crowded sign** (mood, fatigue, dermatitis, anemia).

## Still binding / OPEN for Luneth (carried forward)
- **Dossier drift is SYSTEMIC, not occasional — swept 2026-08-09.** `PYTHONUTF8=1 python tools/dossier_sweep.py` audits all 47 dossiers against the sealed corpus (report regenerates to `temporary/dossier-sweep.md`). Findings: **25 of 47 cite a DEAD claim id**; **44 of 47 understate their claim count** (worst: `sodium` says 14, corpus has 66; `vitamin-b12` 37→75; `vitamin-e` 68→104); **42 carry a flat "this material does not exist, do not use it" assertion**, several now false. Two concepts Luneth PICKED — B2's "glow that named it" and B5's "found by accident" — are built on material their own dossier forbids. **A dossier is a head start, never an authority**: run the sweep, then re-verify with `claim_review.py --entity <slug>` and design off THAT. Guard added to `chronicle/header-research/README.md`. ⚠ **CORRECTION to this file's earlier record: `boron.md` was logged as CLEAN and is NOT** — it cites the dead `WAL-CLM-RARE-000098` and undercounts by 14. Do not trust the old clean/dirty notes; trust the sweep. ⚠ **CONFIRMED on `vitamin-b9` and it nearly shipped a wrong dose** — see the B9 block at the top. `vitamin-b9.md` is still wrong ON DISK (dead `WAL-CLM-EPIGEN-000123`, says 24 vs an actual 38, false "no discovery material" assertion); it was worked around, not repaired.
- **Potassium target: a stale corroboration id, plus the external-reference precedent.** `essentials-targets-data.json`
  potassium `other_claims` cites `WAL-CLM-LETS-000062` (5,500 mg) which is DEAD; the 5,500 value survives in a live
  True-Supplement-Need table — repoint the id (the primary 5,000 mg from `WAL-CLM-IMMORT-000193` is solid; Luneth said
  leave the number). The potassium foods table (concept E) is the project's **FIRST external-reference data** — USDA
  FoodData Central (2019) via NIH ODS, labeled REFERENCE, not Wallach — permitted by supply-reference-when-Wallach-silent.
  A LIVE port of any foods table needs a real data file + derive pipeline like ORAC, never hardcoded. Omega-3/6 dropped
  from the build list per Luneth [[dont-offer-omega-headers]].
- Deferred (postmortem §Flagged): 5 header-memories → skill consolidation; the `figure.width` mech/fork/rail enum; a
  supervised `/consolidate-memory` pass (MEMORY.md near threshold).
- The twin-card gate (`search_no_twin_questions`) + the Aug 3–5 / dedup deletions stay as they are.
