# Demo revamp brief — Luneth's verdicts, 2026-08-05

_His words are the spec. Nothing here is inference unless marked ★. Written at the close of the
quote-style sweep, before any panel was rebuilt._

## GLOBAL

**Quote style must match LIVE.** ✔ FIXED 2026-08-05. 76 quotes across 18 element-header demo pages
moved onto `.ds-pull-quote` (`div.ds-pull-quote-wrap.kd-ep-fam__quote > blockquote.ds-pull-quote >
p + footer` — the shipped markup at `entity-page.ts:1034`); 85 bespoke rules deleted. The pages
already `<link>` `design-system.css`, so the live class was available the whole time and the bespoke
`.xxx-quote` was pure invention. Measured after: 16.8px Playfair italic, 96px accent glyph,
paper-light card, 817px container, no overflow, 0 page errors. `topic-page-prototype.html` excluded
on purpose — its `.tp-quote` is not inside a `.kd-ep-fam` box.

**No cross-book comparison anywhere.** Four banned shapes: disagreement · agreement ·
agreement-with-exclusions · naming the rule on screen.

---

## PER ELEMENT

### Germanium — keep F (rework), redo A B C D E G
**F is the best by far** but still needs work:
- the illustration is **boring and uninformative**
- it begs **"what is germanium actually used for in electronics and how is it ideal?"**
- "poor conductor" is stated **as if everyone knows the implications**
- **no real-world example to make it real**
- the parallel to how the body uses it **is stated but never made REAL or explained**

### Lithium — keep E only
- **D is good but very discouraging.** Two months after stopping you lose everything. *"This makes it
  feel like you can never ever stop supplementing for your entire life… Not only is this not
  realistic and you absolutely do get long term benefits from supplementing, but it makes
  supplementing feel like too big of a bite to swallow."* It was **highly engaging — but not in a way
  that made him feel good.** ⚠ **Engagement is not the test; how it leaves the reader is.**
- **E is the best by far.** Revamp everything besides E.

### Niacin (B3) — D and G both need rework; rest redone
- **D is the only good one**, and only because it touches **the red flush everyone who has taken
  niacin knows**. But it is a **wall of text, not scannable at a glance**.
- **G empowers self-diagnosis**, but he questions whether normal people have **ANY** of its symptoms.
  ★ **CHECKED — HE IS RIGHT.** G's signs are *beef tongue* (swollen/sore/red), *darkened skin
  pigmentation*, *scaly itchy dermatitis* — frank late-stage pellagra signs, not everyday complaints.
  Contrast B9's dandruff, which nearly everyone has. **So G is revamped too.**

### Vitamin B9 — every panel revamped; keep the ANGLES from E, F, G
- **G has potential, presented poorly in a basic ugly way.**
- **F (gluten) is good** but otherwise needs a total revamp.
- **E is good because it mentions dandruff — something almost everyone has** — but it says it once
  then renames it *"Seborrheic dermatitis"*, which is **absurd. USE TERMS PEOPLE CAN UNDERSTAND.**
- ★ **The skin/hair angle is VERY strong**: nearly everyone has some dandruff — hair, nose, eyebrows
  — and **pinpointing the cause and explaining it is a powerful angle.**

### Vitamin B1 — all bad, redo everything
- None engaging; **most are straight up confusing and poorly explained.**
- *"what do aminos have to do with B1?"* — reads **totally irrelevant, with no explanation of the
  link**.
- **E is semi-interesting because everyone hates mosquitos**, but the thiamine connection needs to be
  **explained better and more clearly**.

### Manganese — keep A's POINT, redo its presentation; B–G total overhaul
- **A is decent but presented poorly** — assumes **everyone works office jobs**; the modern world is
  largely remote. **"This reads like boomer material."**
- **The carpal tunnel point is strong because a LOT of people suffer with it.**
- **B through G are completely unengaging and worthless** — *"all just walls of text."*

### Vitamin D — only G survives; biggest expansion
- **G is halfway decent** because it **fights cholesterol avoidance**, which he wants to **harp on**:
  *"people NEED to know that cholesterol is great, especially from eggs, and anyone saying otherwise
  is WRONG."* ⚠ **Must be tied strongly to vitamin D so it doesn't feel irrelevant.**
- **NONE adequately cover SUN EXPOSURE. Go DEEP on just that.** People think *"just go outside"* — is
  that really the best source? (He believes yes, but expects intricacies.)
- **Sunscreen** is wildly popular — dive into **how it is harmful, not helpful.**
- **Skin-cancer fear** should be fought hard **IF that is truly Wallach's stance** — he suspects so,
  not 100% sure. ★ **See research: the honest answer is narrower than he expects.**
- **Illustrations**: the one vitamin that could carry **beautiful sun imagery, and there is NOTHING.**
  **Go crazy with sun / sunlight / beach / skin / sunscreen** — *"fun (but adult — through solid,
  modern design)."*

---

## ★ RESEARCH 2026-08-05 — what the corpus supports for the vitamin D expansion

**26 claims** across all 7 books mention sun / sunshine / sunlight / sunscreen / sunburn / skin
cancer / melanoma. The strong ones:

- **`WAL-CLM-EPIGEN-000221` — the thesis, and it is fierce.** *"The universal deficiency of vitamin D
  in the 20th and 21st centuries is a physician-caused disease. The doctor's instructions dictated by
  the medical community to the American people to avoid exposure to the sun, wear [sunblock]…"*
- **`WAL-CLM-EPIGEN-000224` / `-000170` — the number.** Rickets **up 400% between 1995 and 2011**,
  *"a result of fears of increased risk of skin cancer from skin exposure to the sun as well as
  widespread [sunscreen use]"*. **One claim carrying BOTH the sunscreen attack AND the
  egg-yolk/cholesterol scare** — it ties cholesterol to vitamin D natively, exactly as he asked.
- **`WAL-CLM-IMMORT-000288` — the mechanism that makes the cholesterol tie physical.** *"Cholesterol
  is converted by the intestinal mucosa to 7-dehydrocholesterol, the provitamin of vitamin D3,
  cholecalciferol."* ★ **Cholesterol is the raw material vitamin D is MADE from.** Avoiding
  cholesterol and avoiding sun is the same injury twice — the strongest single idea available.
- **`WAL-CLM-LETS-000420` — a real sun dose:** *"exposure to sunshine for 30 minutes per day."*
- **UV as therapy**, not just exposure: `LETS-000084` (sore throats, vaginitis, ringworm, athlete's
  foot, eczema) · `LETS-000086` (germicidal; therapeutic UV is "cool"; ⚠ can burn the eyes) ·
  `LETS-000087` (2,537 Å peak).
- **`EPIGEN-000165` / `-000174`** — Trousseau treated rickets with cod liver oil, **sunshine**, butter.

### ⚠ TWO HONEST LIMITS — read before designing the sunscreen / skin-cancer panels

1. **Wallach attacks the FEAR and its consequences, not the oncology.** No claim in any book says
   skin cancer from sun exposure is unreal or overstated as a medical fact. He says the *fear* plus
   sunscreen drove a 400% rise in rickets, and that the *advice* caused a universal deficiency.
   **That argument is fully supported and is plenty. "Skin cancer is a myth" is NOT supported, and
   §00.A forbids manufacturing it.**
2. **He is on BOTH sides of sunscreen, and the pro-sunscreen line is not superseded.**
   `WAL-CLM-DDDL-000144` (2011): *"Prevention of sunburn is easy with modern 'sun screen' products.
   The nose may need the special protection of zinc oxide ointment."* Not a contradiction
   favour-newest can settle — that one is about **sunburn**, the 2014 one about **population-level
   vitamin D**. Both stand. ★ One two-sided stance: *sunscreen stops a burn; blanket sunscreen stops
   your vitamin D.* Also `DDDL-000106` and `LETS-000390`: for cerebrovascular disease and for
   calcium-phosphorus correction he says **reduce** vitamin D intake **and sun exposure**. The sun
   panel must not overclaim.

---

## Sequencing

He gave this in one block, asked to start with the quote style, and said more feedback is coming.
**Nothing has been rebuilt on purpose**, so no work is wasted when the rest arrives.
