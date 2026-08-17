# Goals expansion — proposal for review (build later)

_2026-08-17. You chose **propose-first**: this maps the system, hands you a concrete
buildable list, and a personalization brainstorm. Nothing is wired in until you approve._

## Why this is safe to grow

A goal is `{id, name, conditions[]}` in `coverage-layout-skeleton.json`. Its `members`
(the essential nutrients it points you at) are **derived at build** — the union of
essentials named by sealed non-search claims that map the goal's conditions, minus the
34 trace-PDM and 4 fiat slugs. So **adding a goal adds curation, not a Wallach number** —
the numbers still come only from the corpus. A goal whose conditions name no essential
derives to zero members and hard-fails the build; that is the one guard rail.

**Verification already done:** the proposed 27 below were each run through a replay of the
real `coverage_layout_derive.py` against all 2,162 sealed claims. **All 27 derive a
non-empty member set** (member counts shown) — none will hard-fail. This is a floor, not a
ceiling; counts grow as mining adds claims.

## The one structural decision you owe first

`MAX_GOALS = GOAL_HUES.length = 5` (`core/goal-display.ts`). That caps how many goals a
user may hold **at once** (each gets a pick-order hue on the field). It does **not** cap how
many goals can *exist*. Going from 14 → 41 definable goals needs no hue change. But if you
want users to track more than 5 at once, we add hues (or switch to a non-hue selection
model). **Recommendation:** ship the larger library now (14 → up to 41), keep the 5-at-once
cap for this pass, and revisit the cap only if it feels tight in use.

---

## (A) The 14 goals today
stronger-bones · less-joint-pain · more-energy · sharper-thinking · better-mood ·
healthy-heart · better-sleep · stronger-immunity · skin-and-hair · blood-sugar ·
hormones-fertility · muscle-strength · digestion · healthy-weight

## (B) Proposed +27 goals (all build-verified), by category

Format: `id` · **name** · `conditions[]` · (derived members) · why.

**Bones, Joints & Muscles**
- `healthy-back` · **Healthy back & posture** · backache, low_back_pain, kyphosis, lordosis, scoliosis, dowagers_hump, spinal_stenosis · (4) · the everyday "my back hurts" intent, distinct from bone-density/joint-pain.
- `repetitive-strain` · **Repetitive-strain relief** · carpal_tunnel_syndrome, repetitive_motion_syndrome, bursitis, tmj, fibromyalgia · (11) · overuse/soft-tissue pain (desk workers).

**Mind & Nerves**
- `nerve-comfort` · **Nerve comfort** · neuropathy, peripheral_neuropathy, restless_leg_syndrome, sciatica, neuralgia, trigeminal_neuralgia · (8) · tingling/nerve-pain cluster.
- `fewer-headaches` · **Fewer headaches** · headache, migraine, cluster_headaches · (8) · a top self-set aim, unrepresented.
- `focus-attention` · **Focus & attention** · adhd, hyperactivity, hyperkinesis, autism · (9) · attention/hyperactivity, distinct from memory.
- `seizure-support` · **Seizure & convulsion support** · epilepsy, convulsions, tetany, absence_attacks · (13).

**Heart, Blood & Circulation**
- `healthy-circulation` · **Healthy circulation** · varicose_veins, spider_veins, poor_circulation, raynauds_disease, intermittent_claudication · (13).
- `steady-heartbeat` · **Steady heart rhythm** · cardiac_arrhythmia, atrial_fibrillation, tachycardia, palpitations, mitral_valve_prolapse · (11).

**Skin, Hair & Nails**
- `strong-hair-nails` · **Strong hair & nails** · brittle_nails, brittle_hair, male_pattern_baldness, dandruff, hangnails, white_spots_fingernails · (12).
- `wound-healing` · **Faster wound healing** · wounds, bruises, burns, bedsores, boils, abrasions · (6).

**Digestion & Liver**
- `liver-support` · **Liver support** · liver_disease, liver_cirrhosis, fatty_liver, hepatitis, jaundice, gallstones · (21) · heavily claimed, no liver goal today.
- `ease-heartburn` · **Ease heartburn & ulcers** · peptic_ulcers, dyspepsia, indigestion, hypochlorhydria, colic · (10) · upper-GI, distinct from the bowel-focused digestion goal.

**Hormones & Metabolism**
- `thyroid-support` · **Thyroid support** · goiter, hyperthyroidism, hashimotos_disease, graves_disease, thyroid_disease, cretinism · (5, incl. iodine).
- `adrenal-stress` · **Adrenal & stress support** · adrenal_exhaustion, addisons_disease, stress · (5) · _thin — flag._

**Reproductive & Urinary**
- `healthy-pregnancy` · **A healthy pregnancy** · birth_defects, spina_bifida, neural_tube_defects, miscarriage, morning_sickness, preeclampsia · (12).
- `prostate-mens` · **Prostate & men's health** · benign_prostatic_hyperplasia, oligospermia, erectile_dysfunction · (7).
- `womens-cycle` · **Women's cycle & PMS** · pms, dysmenorrhea, amenorrhea, menorrhagia, fibrocystic_breast_disease · (12).
- `kidney-urinary` · **Kidney & urinary health** · kidney_stones, kidney_disease, bladder_stones, renal_failure, incontinence · (13).

**Respiratory**
- `easier-breathing` · **Easier breathing** · asthma, bronchitis, cystic_fibrosis, atopic_asthma, cough · (9).
- `fewer-colds-flu` · **Fewer colds & flu** · common_cold, colds, influenza, tonsillitis · (6).

**Immunity & Infection**
- `allergy-relief` · **Allergy relief** · allergies, food_allergy, hay_fever · (7).
- `autoimmune-support` · **Autoimmune support** · lupus, autoimmune_disorders · (7) · _thin (2 conditions) — flag._

**Eyes, Ears & Mouth**
- `healthy-vision` · **Healthy eyes & vision** · cataracts, macular_degeneration, night_blindness, glaucoma, xerophthalmia, conjunctivitis · (18).
- `gums-teeth` · **Healthy gums & teeth** · periodontal_disease, gingivitis, pyorrhea, tooth_decay, bleeding_gums, receding_gums · (8).
- `hearing-balance` · **Hearing & balance** · tinnitus, deafness, menieres_disease, vertigo · (7).

**Cellular / Systemic**
- `heavy-metal-detox` · **Heavy-metal detox** · lead_poisoning, mercury_poisoning, heavy_metal_toxicity, arsenic_toxicity, plumbism · (2) · _narrow member set — flag._

**General / Other**
- `calm-inflammation` · **Calm inflammation** · inflammation, gout, bursitis · (14).

**Flagged as thin (build-safe, just less rich — your call to keep/drop/merge):**
`adrenal-stress`, `autoimmune-support`, `heavy-metal-detox`.

## (C) Desirable but NOT buildable yet (needs mining first)
These aims' key conditions name **no essential** in any non-search claim, so a goal anchored
on them alone would hard-fail. Left for a future mining pass:
- **Regularity** — constipation, bloating, flatulence name no essentials.
- **Standalone acid-reflux** — heartburn, hyperacidity name none (ulcers/dyspepsia do — that's why `ease-heartburn` works).
- **Not in the catalog at all** — hot flashes, GERD, sinusitis, brain fog, wrinkles/age-spots, hangover, jet lag, snoring. Consumer aims with no home in the sealed data.

## (D) One honesty caveat
"Build-safe" means a condition *names* an essential — not that Wallach *prescribes* it there.
A membership ring can surface an essential via a cautionary/causal claim (e.g. `liver_disease`
pulls `iron` from a claim about iron *excess* causing cirrhosis). This is already true of the
14 shipped goals; it's inherent to condition→member derivation, not new here.

---

## Personalization brainstorm — beyond "more goals"

Ideas that fit the system already built (offline, user-owned data, denominator always 90,
goals change *attention* not the denominator), ordered by leverage-to-effort:

1. **Symptom-first entry (highest leverage).** Let the user start from *"what's bothering
   you?"* — pick from the 164 catalog symptoms — instead of an abstract goal name. Symptoms
   already map to conditions (named-by-proxy / umbrella taxonomy), so this resolves to the
   same members + recommendations with no new data. It's the most *personal* framing and the
   most modern onboarding pattern; goals become the saved result of a symptom answer.

2. **Life-stage presets.** An optional age-band / sex / life-stage answer (over-60, pregnant,
   menopause, active-parent) that *pre-selects* a relevant goal bundle and reorders what
   surfaces. Changes attention only, never the denominator — squarely within doctrine. Real
   personalization from one tap.

3. **Goal packs.** Curated multi-goal bundles ("Active 50+", "Desk worker", "New parent",
   "Winter defense") that select several goals at once. Cures choice-paralysis over a 41-goal
   library and is the natural home for raising the 5-at-once cap if you want it.

4. **A "primary focus" goal that tilts the recommender.** Mark one active goal as primary and
   let `recommender.ts` weight its members up in product ranking. Attention, not denominator —
   the field still scores all 90. Makes the product rail feel tuned to *you*.

5. **Goal-aware scanner.** When scanning a product, surface *"covers 3 of your Stronger-bones
   nutrients."* Connects the scanner to the user's goals — the data (goal members + product
   composition) is already there.

6. **Per-goal gap map (not a score).** For each active goal, show which of its member nutrients
   the current regimen covers vs. gaps — as the field *filtered to that goal's members* (the
   hover-focus already highlights them), framed as a gap map, never "X/N %" (that would smuggle
   in a per-goal denominator). Turns a goal into a concrete personal checklist.

7. **Personal notes on a goal.** Let the user attach a private note ("bones — mom had
   osteoporosis"). Stored in the profile/slot, exported with their data. Small touch, big
   sense of ownership.

8. **Seasonal nudge (offline).** The app knows the date; softly suggest "Fewer colds & flu" in
   winter. No network, no tracking — just contextual.

**My recommendation:** ship the +27 library, then build **symptom-first entry (#1)** and
**life-stage presets (#2)** — together they turn goals from a menu into a conversation, which
is exactly the "makes it personal" glue you're after, all on data that already exists.

## Next step
On your approval I: (1) paste the approved `{id,name,conditions[]}` blocks into
`coverage-layout-skeleton.json`, (2) re-run the derive/build, (3) confirm 92/92 + the two goal
gates, (4) screenshot the picker + field for your eyes. Tell me which of the 27 to keep, and
whether to raise the 5-at-once cap.
