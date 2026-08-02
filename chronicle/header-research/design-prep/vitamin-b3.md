# Niacin — design-prep build sheet
> Source materials for chronicle/header-research/vitamin-b3.md. Byte-verified from sealed claims. NOT a design — concept choice + layout stay open for Luneth.

## ★ Two structural traps found this pass (read before anything else)
1. **The mechanism is NOT quotable.** EPIGEN-000037's *claim_text* carries the whole "what niacin does" story (NAD, NADP, oxidation-reduction, energy from carbohydrates/fats/proteins) — but its **verbatim contains NONE of it**. The verbatim is a pure deficiency list. So **Concept B (the furnace) has no quotable mechanism sentence**; the mechanism can only appear as our own prose (lede/gloss), never in guillemets on the page. There is no other mechanism claim in the pack.
2. **The "organic brain syndrome" umbrella is NOT quotable.** LETS-000388's claim_text + its `conditions[]` array carry the OBS umbrella, the roster of mental disorders, and "niacin named first among causes." Its **verbatim is only the treatment-protocol snippet** — the sole quotable thing from it is the 450 mg t.i.d. time-release dose. So **Concept D's framing** (OBS, one-tool-many-minds roster) is structured-data/prose grounded, not quotable; only the per-condition doses are.

## Entity-copy draft (ready to slot into dashboard/assets/data/entity-copy.json under "vitamin-b3")
- **lede** (PROPOSAL): "Niacin, or vitamin B3 — the water-soluble vitamin the body needs only in milligrams to prevent pellagra and its 'three Ds' (diarrhea, dermatitis, dementia), yet the one Wallach reaches for again and again, in far larger doses, across the troubled mind."  [grounded: pellagra/three-Ds EPIGEN-000037 + RARE-000235; maintenance-in-mg EPIGEN-000114; therapeutic breadth LETS-000388 / LETS-000159 / LETS-000243 / LETS-000322 — deliberately avoids the non-quotable energy mechanism so every fact in it is verbatim-solid]
- **why** (PROPOSAL): "Wallach's daily niacin target is 100 mg — the upper end of the 10–100 mg range he lists for niacin in his Epigenetics (2014) daily multiple vitamin-and-mineral program. Niacin is dosed natively in milligrams, so there is no IU conversion and no body-weight scaling factor: the number is simply the top of Wallach's stated maintenance range. (An older Base Line program in Let's Play Doctor, 1995, put the maintenance need at 50 mg, but the newer Epigenetics figure governs; both are maintenance, distinct from his far larger 450 mg-plus therapeutic doses.)"  [source_claim_id WAL-CLM-EPIGEN-000114; upper_taken 100 of range 10–100 mg; no IU factor, no ×1.54 weight scale — native mg; older 50 mg = LETS-000059]

## Per-concept build materials

### Concept A — The Three Ds (deficiency triad)  ★ recommended lead
- **Exact quotes available**
  - WAL-CLM-EPIGEN-000037 — «Pellagra which includes the “three Ds” (diarrhea, dermatitis, dementia)»
  - WAL-CLM-EPIGEN-000037 — «diarrhea, dermatitis, dementia»
  - WAL-CLM-EPIGEN-000037 — «Beef tongue»   (source reads `“Beef tongue"` — open-curly, close-straight; «Beef tongue» is the clean contiguous run)
  - WAL-CLM-EPIGEN-000037 — «Skin pigmentation»
  - WAL-CLM-EPIGEN-000037 — «Muscular weakness»
  - WAL-CLM-EPIGEN-000037 — «Anorexia»
  - WAL-CLM-EPIGEN-000037 — «Retardation»
  - WAL-CLM-EPIGEN-000037 — «itchy dermatitis»   (verbatim reads "Sealy, itchy dermatitis" — OCR "Sealy"; use «itchy dermatitis» to avoid the misspelling, or quote «Sealy, itchy dermatitis» byte-exact and note it)
  - WAL-CLM-RARE-000235 — «Pellagra (dermatitis, diarrhea, dementia and retardation)»
  - WAL-CLM-RARE-000235 — «sore “beef tongue,”»   (curly quotes; comma-inside)
  - WAL-CLM-RARE-000235 — «beef tongue»
  - WAL-CLM-RARE-000235 — «darkened skin pigmentation»
  - WAL-CLM-RARE-000235 — «scaly dermatitis»   (RARE spells it correctly, vs EPIGEN's "Sealy")
- **Numbers** — none. This concept is number-free.
- **Figure label text** (short, display-ready; the three panel words are the grounded terms, display-cased):
  - "Diarrhea" — the gut · from «diarrhea» (EPIGEN-000037 / RARE-000235)
  - "Dermatitis" — the skin · from «dermatitis» (EPIGEN-000037 / RARE-000235)
  - "Dementia" — the mind · from «dementia» (EPIGEN-000037 / RARE-000235)
  - unifier word: "Pellagra" (EPIGEN-000037 «Pellagra which includes the “three Ds”…»)
  - footnote signs (kept OFF the triad): "beef tongue" (EPIGEN-000037/RARE-000235), "darkened skin" (RARE-000235 «darkened skin pigmentation»)
- **Structure notes** — three parallel elements under one word ("pellagra"); the triad IS the structure (no beats chassis needed). Each panel = one D letterform/word + its domain (gut/skin/mind) + one plain gloss. Optional small footnote strip for the vivid extra signs, physically separated from the three panels so nothing crosses a label. Anchored by three independent claims (EPIGEN-000037, RARE-000235, and pellagra named in the OBS umbrella LETS-000388 conditions[]).

### Concept B — What burns your food (mechanism: energy from all three foods)
- **Exact quotes available** — ★ NONE. The mechanism (NAD/NADP, oxidation-reduction, carbs/fats/proteins) is EPIGEN-000037 **claim_text only**; the verbatim has no mechanism text (see trap #1). Any mechanism wording on the page must be OUR prose, not a quote. The only EPIGEN-000037 quotes that exist are the deficiency terms listed under Concept A.
- **Numbers** — none.
- **Figure label text** (all display-ready PROSE we author from EPIGEN-000037 claim_text — flag each as claim_text-grounded, NOT a quote):
  - inflow labels: "Carbohydrate", "Fat", "Protein"  [EPIGEN-000037 claim_text: "release energy from carbohydrates, fats, and proteins"]
  - central node: "NAD / NADP" (coenzymes) or a lay gloss "the energy coenzyme"  [EPIGEN-000037 claim_text; the jargon names risk being lay-opaque]
  - outflow label: "Energy"  [EPIGEN-000037 claim_text]
  - caption term (optional): "oxidation-reduction"  [EPIGEN-000037 claim_text]
- **Structure notes** — three inflows → one central coenzyme node → one outflow ("energy"); converging arrows routed AROUND every label. Single richly-annotated figure, no beat list. ★ Caveat carried from dossier §5: rests on ONE claim AND that claim yields no quote — the header would be entirely our gloss. Strong idea, thinnest grounding of the four.

### Concept C — The tiny dose and the big one (maintenance vs clinical + the flush)
- **Exact quotes available**
  - WAL-CLM-EPIGEN-000114 — «Vitamin B3 (niacin) 10 - 100 mg»   (note spaces around the dash: "10 - 100")
  - WAL-CLM-EPIGEN-000114 — «10 - 100 mg»
  - WAL-CLM-LETS-000059 — «2,000 to 6,000 mg»
  - WAL-CLM-LETS-000059 — «2,000 to 6,000 mg\n(time release)»   (contains a line break)
  - WAL-CLM-LETS-000020 — «niacin "flush"»   (straight ASCII quotes in source, not curly)
  - WAL-CLM-LETS-000020 — «liver impairment»
  - WAL-CLM-DDDL-000078 — «B3 450 mg t.i.d. as time-release tablets»   (a clean, whole 450 mg clinical quote)
  - WAL-CLM-LETS-000146 — «B-3 450 mg b.i.d. as time-release capsules»
  - WAL-CLM-LETS-000445 — «B-3 at 450 mg t.i.d. as time release tablets»
- **Numbers** (value · unit · verbatim-backed claim id · trap note)
  - 10 · mg · EPIGEN-000114 (maintenance floor) — verbatim «10 - 100 mg»
  - 100 · mg · EPIGEN-000114 (maintenance ceiling / the app target) — verbatim «10 - 100 mg»
  - 50 · mg · LETS-000059 (older base-line "True Supplement Need") — verbatim row «NIACIN 18 mg 50 mg 2,000 to 6,000 mg»; the 50 sits between the trap-18 and the 2,000–6,000, so it cannot be isolated as a clean standalone quote — surface as a footnote number, not a pulled fragment.
  - 2,000 to 6,000 · mg · LETS-000059 (30-day pharmacologic) — verbatim «2,000 to 6,000 mg»; ★ therapeutic, NOT a daily target.
  - 450 · mg · DDDL-000078 / LETS-000146 / LETS-000445 (and others below) — verbatim-clean 450 mg clinical doses; ★ therapeutic, NOT the daily target — must be labelled so.
  - 18 · mg · LETS-000059 — ★★ RDA TRAP: the government RDA Wallach reprints only to argue against. NEVER display as a Wallach number.
- **Figure label text**
  - small bar: "10–100 mg / day" — maintenance  [EPIGEN-000114]
  - towering bar: "450 mg ×3" — therapeutic, not daily  [DDDL-000078 «B3 450 mg t.i.d.…»]  (and "up to 2,000–6,000 mg" — LETS-000059)
  - callout: "why time-release? the flush"  [LETS-000020 «niacin "flush"» + the recurring "time-release" qualifier across protocols]
- **Structure notes** — two proportion bars at true scale (the gap IS the message); each labelled with number + purpose; one flush callout. ★ Non-negotiable per dossier §5: the big bar must read unambiguously "therapeutic, not daily," or it implies "take 1,350 mg/day," which the corpus does not say.

### Concept D — The mind's default (therapeutic roster / one tool, many minds)
- **Exact quotes available** — the per-condition 450 mg niacin doses (the roster's repeating chip). Each is verbatim-clean unless flagged:
  - WAL-CLM-LETS-000388 (organic brain syndrome) — «B-3 (niacin) at 450 mg t.i.d. as»  /  «B-3 (niacin) at 450 mg t.i.d. as\ntime release tablets»
  - WAL-CLM-DDDL-000078 (anxiety / panic) — «B3 450 mg t.i.d. as time-release tablets»
  - WAL-CLM-LETS-000142 (anxiety) — «B-3 450 mg t.i.d. as time-release tablets»
  - WAL-CLM-LETS-000159 (bipolar) — «niacin (B-3) 450»  +  «q.i.d. in time release tablets»   (source breaks "450\nmg." — «niacin (B-3) 450 mg.» is NOT contiguous; keep the two runs, or quote «niacin (B-3) 450\nmg. q.i.d. in time release tablets» with the line break)
  - WAL-CLM-LETS-000243 (dementia) — «B-3 at 450 mg q.i.d.»  /  «B-3 at 450 mg q.i.d.\n(time release)»
  - WAL-CLM-LETS-000322 (insomnia) — «niacinamide at 1,000»  +  «mg at bedtime»  (the niacinamide-1,000-mg-at-bedtime dose; ★ the 450 mg t.i.d. niacin cited for insomnia is claim_text ONLY — verbatim truncates before it)
  - WAL-CLM-RARE-000282 (dementia mineral panel) — «Ga, Ge, Se, Ca, O2, Cr, Va, Li, B-1, B-3»  (B-3 listed among the replacement minerals)
  - WAL-CLM-LETS-000019 (deficiency-side mental signs) — «confusion» · «depression» · «memory loss» · «crying jags, emotional» · «irritability» · «insomnia»
- **Numbers** (value · unit · verbatim-backed claim id · trap note)
  - 450 · mg · verbatim-backed in LETS-000388, DDDL-000078, LETS-000142, LETS-000159, LETS-000243, LETS-000219, LETS-000146, LETS-000443, LETS-000445
  - 450 · mg · ★ claim_text ONLY (verbatim truncated before the niacin dose) in: LETS-000310 (hysteria), LETS-000293 (headache), LETS-000394 (palpitations), and LETS-000322 (insomnia — its verbatim carries niacinamide 1,000 mg at bedtime instead). Do NOT pull a 450 mg quote from these four ids.
  - 1,000 · mg · LETS-000322 (niacinamide, at bedtime, for insomnia) — verbatim «niacinamide at 1,000\nmg at bedtime»
- **Figure label text** (condition names come from the claims' `conditions[]` arrays — structured data, display-ready; the repeating chip is the 450 mg dose):
  - roster names with a VERBATIM-backed 450 mg chip: "Anxiety / panic" (DDDL-000078, LETS-000142) · "Bipolar" (LETS-000159) · "Dementia" (LETS-000243) · "Tachycardia" (LETS-000443) · "Tardive dyskinesia" (LETS-000445)
  - umbrella label: "Organic brain syndrome"  [LETS-000388 — ★ claim_text/structured-only, NOT a quote; frames the roster as prose]
  - repeating chip text: "450 mg · time-release"  [any of the verbatim-backed ids above]
- **Structure notes** — a tight vertical roster, the same 450 mg time-release chip repeating beside each mental condition = "one tool, many minds." Deliberately NOT hub-and-spoke. ★ Overlap risk with Concept A on "dementia" — keep A = deficiency collapse, D = therapeutic breadth, per dossier §5. Curate the roster tight (5–6 names) to avoid list-heaviness; prefer the verbatim-backed-dose conditions so every chip is quotable.

## Trap resolutions (claim_text > verbatim, and fact-in-claim_text-only)
- **Mechanism (NAD, NADP, "energy from carbohydrates, fats, and proteins")** -> **claim_text ONLY** in EPIGEN-000037; the verbatim is a deficiency list with no mechanism text. Not displayable as a quote anywhere. Concept B is all-prose.
- **Organic-brain-syndrome umbrella + mental-disorder roster + "niacin named first among causes"** -> **claim_text / `conditions[]` ONLY** in LETS-000388; verbatim is only the treatment snippet. Quotable from it: the 450 mg t.i.d. time-release dose only.
- **18 mg** -> present in LETS-000059 verbatim, but it is the **government RDA Wallach reprints to argue against** — NEVER a Wallach recommendation. Do not surface.
- **450 mg for hysteria / headache / palpitations / insomnia** -> **claim_text ONLY** (verbatims LETS-000310, LETS-000293, LETS-000394 truncate before the niacin line; LETS-000322's verbatim carries niacinamide 1,000 mg at bedtime, not the 450 t.i.d.). Cite a verbatim-backed id (e.g. LETS-000388/DDDL-000078) if the "450 mg" number is shown.
- **50 mg (older base-line)** -> verbatim-present in LETS-000059 but embedded in the RDA-trap row; usable as a footnote number, not a clean pull-quote fragment.
- **GTF / "glucose tolerance factor"** -> verbatim-backed in DDDL-000049 («niacin which is part of the GTF “glucose\ntolerance factor”») — quotable if a design ever uses the blood-sugar angle (not in concepts A–D).

## Category / width / background (from element-headers.md)
- **Category accent:** vitamin = **orange** (minerals blue · vitamins orange · aminos green · fatty-acids purple).
- **Width:** figure must match the element detail screen; author at scale 1 and choose a width from the closed set (`mech` 600px · `fork` 700px · `rail` 660px). Concept B (converging fork) → likely `fork` 700; Concept C (two bars) / D (vertical roster) → `rail` 660 or `mech` 600. Real figure ceiling inside `.kd-ep-fam` is ~817px; do not exceed. (Final width is a design-time call.)
- **Background:** the tan `.kd-ep-fam` box (`--ds-paper-deep`) tinted by the vitamin/orange accent — it leads directly into the Best-Youngevity-sources block, so the main content box stays on that paper ground.

## Still OPEN for Luneth (do NOT pre-decide)
- Which concept, or a mix (dossier §6 recommends A — the Three Ds — with B as runner-up; not a decision).
- Chassis-vs-composed layout.
- Final layout, coordinates, figure widths, illustration style.
- Final display copy / tone / exact label casing.
- Visual sign-off (the STOP gate) before anything goes live.
