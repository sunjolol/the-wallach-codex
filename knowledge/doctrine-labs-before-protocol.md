# Doctrine: Labs Before Protocol

**Purpose.** When does lab data actually change a Wallach-framework decision, and which markers are worth pulling before pushing clinical-dose protocols? This is the operational companion to `tools/lab_interpreter.py` and the protocol-related WHY-layers.

**Framework discipline.** Wallach's framework starts from symptoms + dietary patterns + the 90-essentials baseline — not from labs. Most baseline supplementation (Ultimate Daily, PDM, EFA Plus, the standard cofactor cocktail) needs **no** lab gating because the doses are foundational, not titrated. Labs become useful — and sometimes essential — only when the protocol crosses into clinical-dose territory where deficiency, excess, or cofactor imbalance can cascade.

---

## The four-question gate

Before recommending a lab, the engine asks:

1. **Would the lab result change the recommendation?** If the answer is the same supplement at the same dose regardless of lab value, the lab is decorative. Skip it.
2. **Is the protocol a clinical-dose protocol (Wallach-named)?** Foundational doses (90-essentials baseline) don't need lab gating. Wallach-named clinical-dose protocols (Zn 150 mg, boron 9 mg, Cr 1,000 mcg, D3 50,000 IU, Vit A 300,000 IU) deserve lab confirmation before sustained use, especially when sustained risk of cofactor imbalance exists.
3. **Is there a Wallach-named acute pathway the dose could trigger?** Zn 150 mg → Cu deficiency → lysyl oxidase failure → aneurysm rupture is the textbook example. When the corpus names an acute failure pathway, the cofactor marker (here: ceruloplasmin / serum Cu) is no longer optional.
4. **Is the symptom-set ambiguous between framework targets?** Fatigue can be low T, low thyroid, low B12, low ferritin, low cortisol, or sleep debt. When five candidate pathways overlap on a symptom, a lab panel disambiguates faster than sequential supplement trials.

If 1-4 don't all favor labs, default to **observe first, lab if no response in 8-12 weeks**. The user's bandwidth is finite and most foundation work needs no test.

---

## Core panel (everyone, every 2-3 years)

The minimum panel that answers the most Wallach-framework-relevant questions:

| Marker | Wallach-optimal range | Wallach-direct source |
|---|---|---|
| **Vitamin D 25-OH** | 40-70 ng/mL | wallach-mechanism-extension (corpus is calcification-conservative; clinical-dose 50,000 IU protocols presuppose monitoring) |
| **Vitamin B12 serum** | 500-1,500 pg/mL | wallach-direct (corpus prefers serum well above standard 200 floor — myelin/cognitive function rationale) |
| **Ferritin** | 50-150 ng/mL | framework-adjacent on the upper bound; wallach-direct on the floor (Wallach names iron deficiency causes via canker sore + several protocols at ~15 mg/day clinical) |
| **TSH + Free T4 + Free T3** | TSH 0.5-2.5 mIU/L; Free T3 in upper third of range | wallach-direct on the basal-body-temp framing (`<98°F awakening = low thyroid`); TSH lab interpretation is wallach-mechanism-extension (corpus prefers temp test) |
| **Homocysteine** | <8 µmol/L | framework-adjacent (modern marker); wallach-direct on the B12/folate/B6 mechanism behind it |
| **Lipid panel (TC, LDL, HDL, TG)** | TC 180-240 (no statin gate); TG <100; HDL >50 | **wallach-direct** — corpus is explicit that statins violate the framework (cholesterol is B12 cofactor → myelin substrate); never use lipid panel as statin gate |

That's six labs. They disambiguate cognitive, energy, thyroid, hormonal, and cardiovascular questions without testing things the framework doesn't need.

---

## Protocol-specific gating

When a clinical-dose protocol is on the table, add the protocol-relevant markers:

### Zn 50 mg t.i.d. (150 mg/day) — testicular atrophy / BPH / prostate
- **Required cofactor marker:** serum Cu + ceruloplasmin. Zn at clinical dose displaces Cu from absorption sites; sustained imbalance triggers the lysyl oxidase failure pathway (aneurysm risk, white hair, tortuous retinal arteries). Wallach-direct.
- **Suggested:** alkaline phosphatase (Zn-dependent enzyme; low ALP can be a Zn deficiency surrogate when serum Zn is unreliable). Wallach-mechanism-extension.
- **Re-test cadence:** 8-12 weeks after initiation, then every 6 months while on protocol.

### Boron 9 mg/day — T-axis / bone
- **Required:** full T panel (Total T, Free T, SHBG, Estradiol). Boron approximately doubles serum T AND E2 within 7-8 days in deficient men (Naghii & Samman 1997, Wallach-cited). Pre-supplementation baseline is necessary to confirm the change; otherwise the protocol is unobservable.
- **Suggested:** parathyroid hormone if osteoporosis is the indication — boron's bone-density mechanism runs through reduced urinary Ca/Mg loss + PTH modulation.

### Cr 1,000-1,500 mcg/day — diabetes / hypoglycemia
- **Required:** fasting glucose + HbA1c + fasting insulin. The Cr protocol is wallach-direct ("an unstable level of glucose is the major cause of hypoglycemia and diabetes" + Cr/V baseline + GTF-aligned form rules). Lab data measures protocol response, not gates entry.
- **Re-test:** A1c at 12 weeks; if no movement, recheck Cr form (polynicotinate > glycinate chelate > picolinate) and check vanadium intake (V is the co-essential).

### Vit D 50,000 IU/week (autoimmune / MS / chronic deficiency)
- **Required:** baseline 25-OH-D + serum Ca + parathyroid hormone before initiating. Wallach corpus is calcification-conservative — the protocol works at this dose ONLY when Mg, K2, and Ca:P ratio are already dialed.
- **Cofactor gates (wallach-direct):** Mg 400+ mg/day + K2 MK-7 100+ mcg/day must be in place before pushing D3 above 5,000 IU/day sustained.
- **Re-test:** 25-OH-D every 8 weeks until target band; serum Ca quarterly.

### Iodine 12.5-50 mg/day (Lugol's territory)
- **Required:** baseline TSH + Free T4 + Free T3 + thyroid antibodies (TPO, TgAb). Iodine at supraphysiologic doses can transiently worsen autoimmune thyroid; antibody status changes the cadence. Wallach doesn't explicitly address Hashimoto's; this is wallach-mechanism-extension + framework-adjacent on the antibody piece.
- **Suggested:** urinary iodine spot test at 4 and 12 weeks.

### Vit A 300,000 IU (Wallach's stated ceiling)
- **Beta-carotene form:** no lab gate required (conversion-limited; no toxicity at this dose). Wallach-direct.
- **Retinol form (preformed):** baseline serum retinol + liver enzymes (ALT, AST). Retinol at this dose risks hepatotoxicity; Wallach explicitly prefers beta-carotene form precisely to avoid this gate.

### Selenium 600-1,000 mcg/day (cancer protocol territory)
- **Required:** baseline serum selenium. Wallach baseline target 500-3,000 mcg/day is wide; upper end risks selenosis. The lab confirms the user isn't already at the upper end before pushing.

---

## What Wallach's framework explicitly doesn't need labs for

- **The 90-essentials baseline** — Ultimate Daily, EFA Plus, Gluco-Gel, PDM Liquid. Foundational, not titrated.
- **B-complex at standard supplemental doses** (under 200 mg of each B vitamin). Water-soluble, low risk.
- **Cofactor doses of Mg, K2, Cu, Mn, Cr** when paired with the corresponding clinical-dose protocol they support.
- **Salt intake** — Wallach is anti-salt-restriction; intake-by-taste is the rule, no sodium lab needed unless kidney disease or CHF with diuretic is present (then it's a high-stakes carve-out).

---

## The reverse-direction rule (user brings labs first)

When the user shows up with a panel already pulled (their MD ran it, an annual physical, etc.), the engine's order:

1. **Run `lab_interpreter.py`** with the values + sex. Get the Wallach-framework interpretation per marker.
2. **Cross-reference with `symptom_lookup.py`** if symptoms are present. Lab pattern + symptom pattern often point to the same deficiency.
3. **Run `conflict_detector.py`** on the user's current stack before proposing additions — confirm the additions don't conflict with existing supplements OR with lab-implied constraints (e.g., D3 push when serum Ca is already high).
4. **Draft protocol** with confidence labels per claim (wallach-direct / wallach-mechanism-extension / framework-adjacent).

Order matters. Symptom-first without lab context can miss patterns; lab-first without symptom context can chase numbers that don't correspond to felt experience.

---

## What labs don't tell you (framework discipline)

- **Serum levels lag tissue depletion.** Mg and Zn are notorious — serum can be normal while RBC or intracellular levels are depleted. Mg-RBC is the better Mg marker; Zn taste test (zinc tally) is Wallach-aligned.
- **Standard ranges include sick populations.** TSH "normal" 0.4-4.5 includes many people with subclinical hypothyroidism. Wallach-optimal is tighter (0.5-2.5) precisely because the standard range is set by what's average, not what's healthy.
- **One marker rarely diagnoses.** A pattern across markers (e.g., low ferritin + high RDW + low MCV = iron deficiency with active depletion) is more informative than any single value.
- **Wallach's basal body temperature test** for thyroid (`<98°F axillary on awakening = low thyroid`) often beats TSH-only screening. Use it as a free pre-test before deciding whether to pull a thyroid panel.
- **Lab values can be normal in active deficiency,** especially when the body is mobilizing tissue stores. The clinical picture + dietary pattern + supplement history is the higher-confidence substrate; labs are confirmatory data, not source of truth.

---

## Three-tier source legend (applied to lab interpretation)

Every lab-based claim in a protocol draft must carry one of three tags — the same legend used in WHY-layers and `interactions-rules.json`:

- **wallach-direct.** The corpus explicitly names this marker or this target. Examples: B12 serum well above 200 (Wallach: 1,000 mcg/day supplementation, clinically meaningful only at much higher serum levels); cholesterol not as a CV risk marker but as B12-cofactor substrate; basal body temp as thyroid screen.
- **wallach-mechanism-extension.** The corpus describes the mechanism but doesn't quantify the lab target. Examples: 25-OH-D 40-70 ng/mL (corpus is calcification-conservative; the serum target is mechanism-implied not stated); TSH < 2.5 (Wallach prefers basal temp; tighter TSH range is mechanism-implied).
- **framework-adjacent.** Modern marker the corpus doesn't address. Examples: hsCRP, homocysteine, fasting insulin, thyroid antibodies. Useful adjuncts; never represented as Wallach-direct.

Mixing tiers without labeling is the resveratrol trap (see brain v2.6 pitfalls). Don't.

---

## Cadence

- **Core panel:** every 2-3 years for asymptomatic users on the 90-essentials baseline. More often if symptoms change or stack changes substantially.
- **Clinical-dose protocol monitoring:** 8-12 weeks after initiation, then every 6 months while sustained.
- **Acute symptom workup:** as needed, but the engine should first run symptom_lookup + draft a working protocol before recommending labs — labs are confirmatory in most cases, not gating.

---

## Operational summary

The engine reaches for `lab_interpreter.py` when:
1. The user provides lab values → interpret + draft.
2. A clinical-dose protocol is on the table AND a Wallach-named acute pathway could trigger → require the cofactor marker.
3. Symptom-set is ambiguous between 3+ candidate pathways → suggest the disambiguating panel.

The engine does NOT recommend labs when:
1. The protocol is foundational (90-essentials baseline).
2. The symptom-set has a single clear Wallach-named cause.
3. The user has already decided to try-and-observe and labs wouldn't change the next step.

Lab data is confirmatory, not source of truth. The corpus is the engine. Labs are a complement that completes but never drives — same doctrine as products.
