# Vitamin B6 (Pyridoxine) — design-prep build sheet
> Source materials for chronicle/header-research/vitamin-b6.md. Byte-verified from sealed claims (`_packs/vitamin-b6.json`). NOT a design — concept choice + layout stay open for Luneth.

_Every «quote» below is a byte-exact contiguous substring of the cited claim's `verbatim`. Where a phrase is broken by an OCR line-break in the source, a clean same-line fragment was chosen instead, and any spanning phrase is flagged. Numbers are each tied to the claim whose VERBATIM (not claim_text) carries them._

---

## Entity-copy draft (ready to slot into dashboard/assets/data/entity-copy.json under "vitamin-b6")

- **lede** (PROPOSAL): "The nerve vitamin — the one Wallach ties to seizures, Tourette's tics and the carpal-tunnel numbness he treats with B6 instead of a scalpel, and the water-soluble vitamin his books give a real toxicity ceiling."  [grounded: identity/deficiency EPIGEN-000039 + EPIGEN-000108; Tourette's head tic EPIGEN-000108 / RARE-000237; seizures EPIGEN-000039 / LETS-000027; carpal-tunnel-not-surgery LETS-000205; toxicity ceiling LETS-000028]
  - ★ TRAP on the alternate identity lede: the biochemical "pyridoxal phosphate / coenzyme for transamination … amino-acid, lipid and nucleic-acid metabolism / glycogen phosphorylase" line lives ONLY in the claim_text of EPIGEN-000039 — **no verbatim anywhere in the pack contains "pyridoxal phosphate."** It may be used as grounded lede PROSE (it is our faithful summary of that claim), but it must NEVER be shown as a displayed guillemet quote. If Luneth prefers the biochemical lede, it stays prose-only.

- **why** (PROPOSAL): "The daily target is 100 mg — the top of Wallach's own everyday range, not a converted or scaled figure. In Epigenetics his daily multiple-vitamin program lists vitamin B6 at 25–100 mg (WAL-CLM-EPIGEN-000116); the header takes the upper of that range. There is no IU conversion and no body-weight scaling, because the source is already stated in mg. For calibration, his Let's Play Doctor Base Line program sets a lower 'true supplement need' of 50 mg/day and reserves 200–500 mg/day for short 30-day pharmacologic use (WAL-CLM-LETS-000063) — so 100 mg sits at the top of the daily maintenance window, above the 50 mg baseline and below the therapeutic doses."  [source_claim_id WAL-CLM-EPIGEN-000116 · provenance original_low 25 / original_high 100 / upper_taken 100 · NO IU factor · NO ×1.54 weight-scale · calibration WAL-CLM-LETS-000063]
  - target.kind = `wallach` (a plain single number, 100 mg daily) — numeric, so the honest-gap fallback does NOT apply.

---

## Per-concept build materials

### Concept A — "The dial with two danger zones" (both-ends-tingle dial)
The rare vitamin where too little AND too much both attack the nerves; the safe amount lives in a window between two tingling extremes.

- **Exact quotes available**
  - WAL-CLM-EPIGEN-000116 — «Vitamin B6 (pyridoxine) 25 - 100 mg»   (the working window, exactly as printed — note spaces around the hyphen)
  - WAL-CLM-LETS-000063 — «PYRIDOXINE 2.2 mg 50 mg 200 to 500 mg»   (row = RDA 2.2 / true-need 50 / pharmacologic 200 to 500)
  - WAL-CLM-EPIGEN-000108 — «Peripheral neuritis»
  - WAL-CLM-EPIGEN-000108 — «Ataxia (instability)»
  - WAL-CLM-RARE-000237 — «peripheral neuritis, ataxia (instability),»   (deficiency side, alt source)
  - WAL-CLM-LETS-000027 — «neurologic symptoms»
  - WAL-CLM-LETS-000028 — «PYRIDOXINE TOXICITY»
  - WAL-CLM-LETS-000028 — «"electric shock" sensations»   (straight double quotes, exactly as printed)
  - WAL-CLM-LETS-000028 — «paresthesia»
  - WAL-CLM-LETS-000267 — «tingling in the face or hands»   (the long-term-dose toxicity note; clean fragment — the full source reads "some numb-ness and tingling …" with an OCR hyphen, avoided here)
- **Numbers**
  - 25–100 mg (the working window) · unit mg · VERBATIM in WAL-CLM-EPIGEN-000116 ("25 - 100 mg"). Display-format trap: source prints "25 - 100" (hyphen + spaces), not an en-dash.
  - 50 mg (true supplement need / maintenance baseline) · mg · VERBATIM in WAL-CLM-LETS-000063 ("50 mg").
  - 200–500 mg (30-day pharmacologic) · mg · VERBATIM in WAL-CLM-LETS-000063 ("200 to 500 mg"). Display-format trap: source prints "200 to 500", not "200-500".
  - 2.2 mg (the government RDA, shown only to argue against) · mg · VERBATIM in WAL-CLM-LETS-000063. Do not present as Wallach's recommendation.
- **Figure label text** (display-ready strings, each tied to its claim)
  - Left zone / TOO LITTLE: "peripheral neuritis" [EPIGEN-000108/RARE-000237] · "ataxia" [EPIGEN-000108/RARE-000237] · "neurologic symptoms" [LETS-000027]
  - Centre band / THE WORKING WINDOW: "25–100 mg" [EPIGEN-000116] (optional sub-mark "50 mg baseline" [LETS-000063])
  - Right zone / TOO MUCH: "“electric shock” sensations" [LETS-000028] · "paresthesia" [LETS-000028] · "tingling in hands & face" [LETS-000267]
- **Structure notes** — one horizontal track, three zones (left flag / lit centre band / right flag), ~5 marks total. Zone labels routed ABOVE and BELOW the track, never through it (element-headers Rule ★ — a stroke through a label is the #1 rejection cause). The 100 mg target reads as the top edge of the lit centre band, so the "why this number" is taught by the figure's construction.

### Concept B — "One vitamin, on its own" (the epilepsy-cure hero)
A single vitamin Wallach says will frequently "cure" epilepsy — and quiet the whole family of nerve storms.

- **Exact quotes available**
  - WAL-CLM-LETS-000267 — «Vitamin B-6 alone will frequently "cure" epilepsy at 50-100 mg t.i.d.»   (★ the hero line — VERBATIM uses DOUBLE quotes around "cure"; the dossier's single-quote 'cure' is a paraphrase, do not use it)
  - WAL-CLM-LETS-000267 — «can also be curative»
  - WAL-CLM-LETS-000233 — «uncontrolled body movements set off by an electrical malfunction of the brain»   (what a convulsion is)
  - WAL-CLM-LETS-000233 — «seen on an EEG (electroencephalogram)»   (the brain-wave test — anchors the EEG snapshot illustration)
  - WAL-CLM-LETS-000233 — «B-6 at 100 mg b.i.d.»   (convulsions dose)
  - WAL-CLM-LETS-000120 — «ABSENCE ATTACKS (petit mal)»
  - WAL-CLM-LETS-000120 — «stops what he is doing and rapidly blinks eyes»   (what petit mal looks like)
  - WAL-CLM-LETS-000120 — «B-6 100-300»   (absence-attack dose; "mg/day" spans the next line, so 100-300 is the clean quotable unit)
  - WAL-CLM-EPIGEN-000108 — «Head tic (Tourette's syndrome)»
  - WAL-CLM-EPIGEN-000108 — «Seizures. Convulsions»
  - WAL-CLM-RARE-000237 — «head tic (Tourette's syndrome), convulsions.»   (satellite storms, alt source)
- **Numbers**
  - 50–100 mg t.i.d. (the epilepsy dose) · mg · VERBATIM in WAL-CLM-LETS-000267 ("50-100 mg t.i.d.").
  - 100 mg b.i.d. (convulsions) · mg · VERBATIM in WAL-CLM-LETS-000233.
  - 100–300 mg/day (absence attacks) · mg · VERBATIM in WAL-CLM-LETS-000120 ("B-6 100-300"; the "mg/day" runs onto the next OCR line).
- **Figure label text** (twin EEG-snapshot panels)
  - Left panel: "seizure" / "before" — grounded by "uncontrolled body movements set off by an electrical malfunction of the brain" [LETS-000233]
  - Right panel: "steady" / "after" — grounded by "can also be curative" [LETS-000267]
  - Satellite cluster labels: "epilepsy" [LETS-000267] · "convulsions" [LETS-000233] · "absence attacks (petit mal)" [LETS-000120] · "Tourette's head tic" [EPIGEN-000108/RARE-000237]
- **Structure notes** — quote-forward hero: the epilepsy line is the dominant centrepiece, with a small satellite cluster of the other storms it calms. Two side-by-side EEG snapshots (jagged left / calm right), labels UNDER each panel, no connecting timeline stroke (keeps it distinct from selenium's single decline-rail). Two panels + a few labels; one idea.

### Concept C — "The hidden drain" (drugs steal your B6)
Everyday medications quietly deplete B6 — a large share of women on the pill already show the deficiency, often without knowing why.

- **Exact quotes available**
  - WAL-CLM-IMMORT-000009 — «Fifteen to 20 percent of women taking oral contraceptives»   (★ note "Fifteen" is spelled out in the source — see trap below)
  - WAL-CLM-IMMORT-000009 — «show the symptoms of pyridoxine deficiency»
  - WAL-CLM-IMMORT-000009 — «malaise, depression and glucose intolerance»   (the pill-deficiency symptoms)
  - WAL-CLM-RARE-000286 — «Antihypertensive — Mineral Replacement: Ca, Mg, Omega 3, B6:»   (em-dash; "Omega 3" printed without a hyphen)
  - WAL-CLM-RARE-000286 — «Propranolol (Inderal)»
  - WAL-CLM-RARE-000286 — «Methyldopa (Aldoril, Aldomet)»
  - WAL-CLM-RARE-000286 — «Reserpine (Regroton, Hydropres)»
  - WAL-CLM-RARE-000286 — «Ca, Mg, Omega 3, B6»   (what the drugs deplete)
- **Numbers**
  - 15–20% (women on the pill showing deficiency) · percent · VERBATIM in WAL-CLM-IMMORT-000009 carries the digit "20" and the WORD "Fifteen". ★ The digit "15" is NOT in the verbatim — see trap below. If shown as a QUOTE, quote «Fifteen to 20 percent»; if shown as a stat number "15–20%", it is a display gloss (grounded, correct), not a verbatim quote.
- **Figure label text** (draining-reservoir or "drug − B6 = symptoms" card)
  - Culprits: "the pill (oral contraceptives)" [IMMORT-000009] · "Propranolol (Inderal)" · "Methyldopa (Aldomet)" · "Reserpine" [all RARE-000286]
  - Result: "malaise" · "depression" · "glucose intolerance" [IMMORT-000009]
  - Stat callout: "15–20% of pill users show B6 deficiency" [IMMORT-000009 — display gloss, see trap]
- **Structure notes** — two-part "hidden cost" panel: culprit drug(s) on one side, the resulting B6 deficit + its symptoms on the other, with a short named list of offenders. A single draining-level motif OR one clean equation card. One idea, few elements; no cycle, no dial.

### Concept D — "The pregnancy vitamin" (the maternal arc)
The vitamin the first trimester runs short of — Wallach reads morning sickness itself as a B6 deficiency, and follows B6 from before conception to birth.

- **Exact quotes available**
  - WAL-CLM-IMMORT-000008 — «trimester of pregnancy is thought to be due to pyridoxine»   (morning sickness = B6 deficiency; clean same-line fragment)
  - WAL-CLM-IMMORT-000008 — «commonly observed in the first»   (pairs with the above; full source phrase is "“Morning sickness” commonly observed in the first trimester …" — curly quotes in source)
  - WAL-CLM-LETS-000369 — «B-6 and B-complex»   (first-trimester protocol)
  - WAL-CLM-LETS-000369 — «at 25 mg t.i.d.»   (the dose)
  - WAL-CLM-LETS-000407 — «B-6 at 100 mg per day»   (pre-eclampsia dose)
  - WAL-CLM-LETS-000407 — «high levels of B-6 will reduce»   (the breast-milk curio, part 1)
  - WAL-CLM-LETS-000407 — «production of breast milk»   (the breast-milk curio, part 2 — next line in source)
  - WAL-CLM-LETS-000210 — «a preconception deficiency of zinc and B-6»   (cerebral-palsy origin)
  - WAL-CLM-LETS-000210 — «during the formation of the brain»   (why it is untreatable after birth — handle with restraint)
- **Numbers**
  - 25 mg t.i.d. (morning-sickness B6 + B-complex) · mg · VERBATIM in WAL-CLM-LETS-000369 ("at 25 mg t.i.d.").
  - 100 mg/day (pre-eclampsia) · mg · VERBATIM in WAL-CLM-LETS-000407 ("B-6 at 100 mg per day").
  - 50 mg (drop-to at birth if breast-feeding) · mg · VERBATIM in WAL-CLM-LETS-000407 carries the digit "50" ("drop to 50" — the following "mg" is on the next OCR line, so "50 mg" is not a clean single-line quote, but the value 50 is verbatim-present).
- **Figure label text** (three-node life-stage arc)
  - Node 1 / preconception: "before conception" — grounded by "a preconception deficiency of zinc and B-6" [LETS-000210] (restraint node)
  - Node 2 / first trimester: "morning sickness = B6 shortage" — grounded by IMMORT-000008; dose "25 mg t.i.d." [LETS-000369]
  - Node 3 / birth & nursing: "100 mg → drop to 50 mg while nursing" [LETS-000407]; curio "high B6 lowers breast-milk" [LETS-000407]
- **Structure notes** — a single spare arc/ribbon with three labelled nodes (preconception → first trimester → birth/nursing), labels OFF the ribbon line, few elements, no faces, no busy scene. Ends on the breast-milk nuance. Frame the preconception node as "a reason B6 matters BEFORE conception," not as a scare (dossier §5 tone flag).

---

## Trap resolutions (claim_text > verbatim, and formatting)

- **"pyridoxal phosphate" / the coenzyme-mechanism identity** -> claim_text-only in WAL-CLM-EPIGEN-000039; **NO verbatim in the pack contains it.** Usable as grounded lede PROSE, never as a displayed quote. (This is the single biggest trap on this element.)
- **"15" (as a digit, pill deficiency %)** -> cite WAL-CLM-IMMORT-000009 but quote «Fifteen to 20 percent» (word form); the digit "15" is claim_text-only. The digit "20" IS in the verbatim. "15–20%" is a legitimate display GLOSS but NOT a byte-exact quote.
- **'cure' epilepsy quote** -> the verbatim (WAL-CLM-LETS-000267) uses DOUBLE quotes: «"cure"». The dossier §1/§2 rendering with single quotes ('cure') is a paraphrase — do not display it. Byte-exact hero line: «Vitamin B-6 alone will frequently "cure" epilepsy at 50-100 mg t.i.d.»
- **Deficiency-list split across two claims** -> "depression, mental confusion" is in WAL-CLM-EPIGEN-000039's verbatim, but that verbatim is TRUNCATED (ends at "Nausea / Vomiting"). PMS, seborrheic dermatitis, carpal tunnel, TMJ, peripheral neuritis, ataxia, Tourette's, seizures/convulsions live in WAL-CLM-EPIGEN-000108's verbatim; acne, alopecia, cheilosis, dizziness, geographic tongue, facial oiliness, neurologic symptoms live in WAL-CLM-LETS-000027's verbatim. To quote the full nerve/skin cluster, pull from 108 and 027, not 039.
- **Range formatting** -> WAL-CLM-EPIGEN-000116 prints «25 - 100 mg» (hyphen with spaces), not "25–100". WAL-CLM-LETS-000063 prints «200 to 500 mg» (the word "to"), not "200-500". Quote as printed; the en-dash form is a display gloss.
- **"50 mg" birth-drop (Concept D)** -> WAL-CLM-LETS-000407 verbatim breaks "50" and "mg" across a line ("drop to 50\nmg"), so "50 mg" is not a clean single-line quote; the value 50 is verbatim-present. Use as a number, not a guillemet quote.
- **"100-300 mg/day" absence attacks (Concept B)** -> WAL-CLM-LETS-000120 verbatim breaks the unit ("B-6 100-300\nmg/day"); quote «B-6 100-300», treat "mg/day" as a display gloss.
- **PMS OCR (NOT used by any concept)** -> WAL-CLM-LETS-000402 verbatim reads "100 mg B-6 q 4 d" and "essential fatty acids at 5 mg t.i.d." — garbled OCR. Do not quote those numbers if PMS material is ever pulled in.

---

## Category / width / background (from element-headers.md)

- **Category accent:** VITAMIN -> orange (`data-category` drives the tint of the `.kd-ep-fam` box). Minerals=blue · vitamins=orange · aminos=green · fatty-acids=purple.
- **Width:** the figure must match the element detail screen. Real figure ceiling inside `.kd-ep-fam` is ~817px (not the 867px outer screen). Prefer a shipped slot — `--fork` 700px or `--rail` 660px — over a custom width. Author the figure at scale 1 (viewBox width == CSS max-width) and declare the width at ID-matching specificity, or every label silently shrinks (Rule 2 cascade trap). Do NOT set the final width here — that is a design-time call.
- **Background:** the tan `--ds-paper-deep` main content box, orange-tinted; it leads directly into the Best-Youngevity-sources block, so keep that transition in mind.

---

## Still OPEN for Luneth (do NOT pre-decide)

- Which concept (or a mix of A–D). Dossier's recommended lead is **Concept A** (self-teaching dose dial), with **Concept B** (epilepsy "cure" hero) the boldest runner-up — but the choice is his.
- Chassis-vs-composed layout; number of sections; whether there are beats, a big stat, or a pull quote, and their order.
- Final layout, coordinates, and display copy/tone.
- Visual sign-off before anything is built live.
