# Engine 1 — DDDL dose audit (ratify-ready)

_2026-08-18. Autonomous run for Luneth. **Nothing sealed** — this stages the audit for your ratify-and-seal on return._

## Provenance (read first)

The 22 dose claims Luneth ruled INTRODUCE lived only in the prior session's scratchpad `0ce0c20f` (`introduced-claims.json` / `finalize_raw/`), which is **gone** (scratchpads are session-scoped). I recovered every candidate's full payload from the committed `temporary/claim-ruling-dashboard.html` (embeds all 907 candidates with claim_text + verbatim). Fidelity proven: 190 of the already-sealed Engine-1 claims match the dashboard DATA byte-for-byte; the rest differ only where Engine-1 deliberately re-snapped them. **All 24 candidate dose verbatims are byte-exact in the DDDL source — zero fabricated.**

`recommend=introduce` gives **24** DDDL dose candidates; your final localStorage rulings kept **22** (2 dropped — unrecoverable). Independently, my dose-conflict audit holds exactly **2** (below), landing the clean set at **22** — matching your handoff count. I did **not** guess which 2 you dropped; the 2 I hold are held on §00.A conflict grounds, which is the defensible criterion.

## The 2 HELD dose conflicts (your 'favor newest, but prove it' call)

Both are genuine same-nutrient / same-condition disagreements between books, **proven by reading both verbatims**. Per your instruction I hold both rather than silently pick. Note: **both values already coexist in the sealed corpus** as protocol claims — so this is a pre-existing divergence my dose facet would merely spotlight, not create.

**A. Folic acid for gout** — `#347`
- DDDL (2011, newer): *“Use folic acid at 20-50 mg/day…”* → **20–50 mg/day**
- LETS (1995, older, sealed `WAL-CLM-LETS-000288`): *“folic acid at 10-75 mg/day”* → **10–75 mg/day**
- Favor-newest ⇒ DDDL 20–50. Your ratify: seal DDDL facet / keep both as edition divergence / drop.

**B. Vitamin E for cataracts** — `#550`
- DDDL (2011, newer, sealed protocols 354/433/434): *“vitamin E at 2,000 IU/day”* → **2,000 IU/day**
- LETS (1995, older, sealed `WAL-CLM-LETS-000207`): *“vitamin E at 400 IU/day”* → **400 IU/day** (5× lower)
- Favor-newest ⇒ DDDL 2,000 IU. Your ratify: seal DDDL facet / keep both as edition divergence / drop.

## Open dispositions for your ratify (small)

1. **`dose:null` on all 22** — amount is byte-exact in claim_text + verbatim; these are condition-therapeutic doses, not maintenance targets (don't feed `amounts_wallach_only`), so I left the structured dose object null (matches 2/4 existing condition-dose claims). Say the word to populate structured doses.
2. **`#657` B12/shingles** carries an auditor flag: *reconcile as an added search question on `WAL-CLM-DDDL-000278`, not a new independent claim.* I staged it as a new claim for consistency; your call.
3. **`#325` EFA/psoriasis** mapped to essentials `[omega-3, omega-6]`; flag if you want the EFA-collective treatment instead (see [[efa-collective-dose-is-singleton]]).
4. **Keep-both dedup**: all 22 are per-nutrient slices of already-sealed protocol sentences (several share one span — e.g. cataracts #552/#553/#555). At seal they'll trip `no_duplicate_claims`; add each surviving same-span pair to `_DUPLICATE_KEEP_BOTH` exactly as Engine-1 did for its 71 pairs.

## Seal plan (≈ your 2-minute confirm on return)

```bash
# 1. stage draft (snaps verbatims; report to review)
PYTHONUTF8=1 python eden/tools/corpus_extract.py finalize --book dddl-3e-2011 \
  --raw chronicle/dose-audit-2026-08-18/finalize-raw-22.json
# 2. prove draft offsets clean, then map enrichment positionally (raw order), merge into search-enrichment
# 3. corpus_seal + catalog_seal  (USER-ONLY — your act)
# 4. search_index_derive + build.mjs ; verify on-screen count moved by 22
```

## The 22 clean claims (SEAL) + 2 held — full review form

#### #320 · folic acid (vitamin-b9) — psoriasis  ·  SEAL (clean)
- **Question:** How much folic acid should I take for psoriasis?
- **Short:** Wallach uses folic acid at a high 15-25 mg per day for psoriasis — far above ordinary supplement levels.
- **Full:** Wallach uses high-dose folic acid at 15-25 mg per day as part of his psoriasis protocol.
- **Quote:** “Treatment of psoriasis should include avoidance of offending food allergens, rotation diets, folic acid at 15-25 mg per day, vitamin A at 300,000 IU per day as beta-carotene”
- verdict `overlapping`

#### #321 · vitamin A — psoriasis  ·  SEAL (clean)
- **Question:** Does vitamin A help psoriasis?
- **Short:** Wallach recommends beta-carotene vitamin A at 300,000 IU per day for psoriasis skin.
- **Full:** Wallach recommends vitamin A as beta-carotene at 300,000 IU per day as part of his psoriasis protocol.
- **Quote:** “Treatment of psoriasis should include avoidance of offending food allergens, rotation diets, folic acid at 15-25 mg per day, vitamin A at 300,000 IU per day as beta-carotene, lecithin at 2,500 mg t.i.d. with meals,”
- verdict `distinct`

#### #323 · vitamin E — psoriasis  ·  SEAL (clean)
- **Question:** Does vitamin E help psoriasis?
- **Short:** Wallach includes vitamin E at 800-1,200 IU per day in his psoriasis protocol as an antioxidant for the skin.
- **Full:** Wallach includes vitamin E at 800-1,200 IU per day in his psoriasis protocol.
- **Quote:** “Treatment of psoriasis should include avoidance of offending food allergens, rotation diets, folic acid at 15-25 mg per day, vitamin A at 300,000 IU per day as beta-carotene, lecithin at 2,500 mg t.i.d. with meals, EFA at 5 grams b.i.d., vitamin E at 800-1,200 IU per day”
- verdict `distinct`

#### #324 · lecithin — psoriasis  ·  SEAL (clean)
- **Question:** Does lecithin help psoriasis?
- **Short:** Wallach adds lecithin at 2,500 mg three times daily with meals to his psoriasis protocol.
- **Full:** Wallach recommends lecithin at 2,500 mg three times daily with meals for psoriasis.
- **Quote:** “Treatment of psoriasis should include avoidance of offending food allergens, rotation diets, folic acid at 15-25 mg per day, vitamin A at 300,000 IU per day as beta-carotene, lecithin at 2,500 mg t.i.d. with meals,”
- verdict `distinct`

#### #325 · essential fatty acids (omega-3/6) — psoriasis  ·  SEAL (clean)
- **Question:** Do essential fatty acids help psoriasis?
- **Short:** Wallach recommends essential fatty acids at 5 grams twice a day for psoriasis — one of the skin diseases he blames on essential-fatty-acid deficiency.
- **Full:** Wallach recommends essential fatty acids (EFA) at 5 grams twice daily as part of his psoriasis protocol.
- **Quote:** “Treatment of psoriasis should include avoidance of offending food allergens, rotation diets, folic acid at 15-25 mg per day, vitamin A at 300,000 IU per day as beta-carotene, lecithin at 2,500 mg t.i.d. with meals, EFA at 5 grams b.i.d.”
- verdict `distinct`

#### #333 · folic acid — irritable_bowel_syndrome  ·  SEAL (clean)
- **Question:** Does folic acid help IBS and how much?
- **Short:** Wallach includes folic acid at 5-25 mg a day in his IBS program.
- **Full:** Wallach recommends folic acid at 5-25 mg a day as part of treating irritable bowel syndrome.
- **Quote:** “Treatment of irritable bowel syndrome should include high fiber diets, 4-6 cups of fruit and vegetables per day, elimination of fried food, margarine, caffeine, sugar, and offending foods based on the pulse test (i.e. wheat, milk, soy), betaine HCl and pancreatic enzymes at 75-200 mg t.i.d. before meals, folic acid at 5-25 mg/day, gluten free diet, and eight to ten glasses of water each day.”
- verdict `distinct`

#### #347 · folic acid — gout  ·  **HOLD — dose conflict**
- **Question:** Does folic acid help gout?
- **Short:** Wallach uses high-dose folic acid - 20 to 50 mg a day - as part of his natural gout protocol.
- **Full:** Wallach recommends folic acid at 20-50 mg per day as part of his natural treatment for gout.
- **Quote:** “Use folic acid at 20-50 mg/day, cherries, and unsweetened cherry juice, and herbs including gout weed (Aegopodium podagraria) and meadow saffron (Colchicium autumnale).”
- verdict `distinct`

#### #409 · l-tryptophan — insomnia  ·  SEAL (clean)
- **Question:** Does tryptophan help with insomnia?
- **Short:** Yes — Wallach's insomnia protocol includes l-tryptophan at 1,000 mg three times a day, on top of removing caffeine and food allergens.
- **Full:** In Wallach's insomnia protocol, l-tryptophan is dosed at 1,000 mg three times a day.
- **Quote:** “Treatment for insomnia includes avoidance of caffeine and offending food allergens, calcium (especially plant derived colloidal calcium), chromium and vanadium at 25-200 mcg t.i.d., acupuncture, homeopathy, dl-phenylalanine at 250 mg t.i.d., l-tryptophan at 1,000 mg t.i.d., inositol at 500 mg/day, niacinamide at 1,000 mg at bedtime,”
- verdict `overlapping`

#### #509 · fiber — constipation  ·  SEAL (clean)
- **Question:** How much fiber should you take for constipation?
- **Short:** Wallach's constipation routine adds fiber/protein at one tablespoon in eight ounces of juice twice a day, plus eight to ten glasses of water.
- **Full:** Wallach's constipation treatment includes fiber/protein at one tablespoon in eight ounces of juice twice a day, alongside eight to ten glasses of water daily.
- **Quote:** “Treatment of constipation includes eight to ten glasses of water per day, fiber/protein at 1 tbsp. in 8 oz. of juice b.i.d.”
- verdict `overlapping`

#### #524 · vitamin B6 — pms  ·  SEAL (clean)
- **Question:** How much vitamin B6 should I take for PMS?
- **Short:** Vitamin B6 is a cornerstone of Wallach's PMS protocol: he calls for 100 mg of B6 (pyridoxine), dosed 'q 4 d,' along with essential fatty acids, vitamin A, vitamin E and calcium.
- **Full:** For PMS, Wallach's protocol calls for 100 mg of vitamin B6 (pyridoxine), taken alongside essential fatty acids, vitamin A, vitamin E, calcium and herbs.
- **Quote:** “Treatment of PMS includes 100 mg B6 q 4 d, EFA at 5 grams t.i.d., vitamin A at 300,000 IU per day as beta carotene during the last 14 days of the cycle, vitamin E at 800-1,200 IU/day, calcium (especially plant derived colloidal sources), and herbs including mistletoe (Viscum album), black cohosh (Cimicifuga racemosa), and blue cohosh (Caulophyllum thalictroides).”
- verdict `distinct`

#### #525 · vitamin A — pms  ·  SEAL (clean)
- **Question:** Does vitamin A help with PMS, and when should I take it?
- **Short:** Wallach uses vitamin A as beta carotene at 300,000 IU per day, taken specifically during the last 14 days of the cycle (the premenstrual window), as part of his PMS protocol.
- **Full:** Wallach recommends vitamin A at 300,000 IU per day as beta carotene during the last 14 days of the cycle for PMS.
- **Quote:** “Treatment of PMS includes 100 mg B6 q 4 d, EFA at 5 grams t.i.d., vitamin A at 300,000 IU per day as beta carotene during the last 14 days of the cycle, vitamin E at 800-1,200 IU/day, calcium (especially plant derived colloidal sources), and herbs including mistletoe (Viscum album), black cohosh (Cimicifuga racemosa), and blue cohosh (Caulophyllum thalictroides).”
- verdict `distinct`

#### #550 · vitamin E — cataracts  ·  **HOLD — dose conflict**
- **Question:** How much vitamin E should I take for cataracts?
- **Short:** Wallach's cataract protocol includes vitamin E at 2,000 IU per day, on top of the baseline vitamin-mineral supplement.
- **Full:** For cataracts, Wallach's protocol calls for vitamin E at 2,000 IU per day on top of the baseline vitamin-mineral supplement.
- **Quote:** “Treatment of cataracts includes avoiding fried foods and margarine, the base line vitamin/mineral supplement plus vitamin E at 2,000 IU/day,”
- verdict `distinct`

#### #552 · zinc — cataracts  ·  SEAL (clean)
- **Question:** Does zinc help with cataracts?
- **Short:** Wallach's cataract protocol includes zinc at 25 mg three times a day.
- **Full:** Wallach's cataract protocol includes zinc at 25 mg three times a day (t.i.d.).
- **Quote:** “Treatment of cataracts includes avoiding fried foods and margarine, the base line vitamin/mineral supplement plus vitamin E at 2,000 IU/day, vitamin C to bowel tolerance, B1, B2, B3, B5, and B6 at 50 mg b.i.d., inositol at 150 mg/day, selenium at 250 mcg/day, zinc at 25 mg t.i.d., bioflavonoids at 300 mg, glycine at 200 mg, l-glutamine at 200 mg,”
- verdict `distinct`

#### #553 · selenium — cataracts  ·  SEAL (clean)
- **Question:** How much selenium does Wallach recommend for cataracts?
- **Short:** Wallach recommends selenium at 250 mcg per day for cataracts -- the antioxidant mineral he links most closely to the disease.
- **Full:** For cataracts Wallach recommends selenium at 250 mcg per day, the antioxidant mineral he ties most directly to the clouding lens.
- **Quote:** “Treatment of cataracts includes avoiding fried foods and margarine, the base line vitamin/mineral supplement plus vitamin E at 2,000 IU/day, vitamin C to bowel tolerance, B1, B2, B3, B5, and B6 at 50 mg b.i.d., inositol at 150 mg/day, selenium at 250 mcg/day, zinc at 25 mg”
- verdict `overlapping`

#### #555 · bioflavonoids — cataracts  ·  SEAL (clean)
- **Question:** Do bioflavonoids help with cataracts?
- **Short:** Wallach's cataract protocol includes bioflavonoids at 300 mg.
- **Full:** Wallach's cataract protocol includes bioflavonoids at 300 mg.
- **Quote:** “Treatment of cataracts includes avoiding fried foods and margarine, the base line vitamin/mineral supplement plus vitamin E at 2,000 IU/day, vitamin C to bowel tolerance, B1, B2, B3, B5, and B6 at 50 mg b.i.d., inositol at 150 mg/day, selenium at 250 mcg/day, zinc at 25 mg t.i.d., bioflavonoids at 300 mg, glycine at 200 mg, l-glutamine at 200 mg,”
- verdict `distinct`

#### #563 · lecithin — gallstones, gallbladder disease  ·  SEAL (clean)
- **Question:** Does lecithin help with gallstones?
- **Short:** Wallach's gallstone treatment includes lecithin at 2,500 mg three times a day.
- **Full:** For gallbladder disease and gallstones, Wallach recommends lecithin at 2,500 mg three times a day.
- **Quote:** “Treatment of gallbladder disease and gallstones includes the use of high fiber diets (i.e. make sure you are having 2-3 bowel movements per day), lecithin at 2,500 mg t.i.d., EFA at 5 gm t.i.d., vitamin E at 800-1,200 IU per day, vitamin C to bowel tolerance, selenium at 200 mcg t.i.d., and taurine at 500 mg t.i.d.”
- verdict `distinct`

#### #564 · vitamin E — gallstones, gallbladder disease  ·  SEAL (clean)
- **Question:** Does vitamin E help with gallbladder disease?
- **Short:** Wallach's gallstone treatment includes vitamin E at 800 to 1,200 IU per day.
- **Full:** Wallach includes vitamin E at 800 to 1,200 IU per day in his treatment for gallbladder disease and gallstones.
- **Quote:** “Treatment of gallbladder disease and gallstones includes the use of high fiber diets (i.e. make sure you are having 2-3 bowel movements per day), lecithin at 2,500 mg t.i.d., EFA at 5 gm t.i.d., vitamin E at 800-1,200 IU per day, vitamin C to bowel tolerance, selenium at 200 mcg t.i.d., and taurine at 500 mg t.i.d.”
- verdict `distinct`

#### #565 · selenium — gallstones, gallbladder disease  ·  SEAL (clean)
- **Question:** Does selenium help with gallstones?
- **Short:** Wallach's gallstone treatment includes selenium at 200 mcg three times a day.
- **Full:** Wallach includes selenium at 200 mcg three times a day in his treatment for gallbladder disease and gallstones.
- **Quote:** “Treatment of gallbladder disease and gallstones includes the use of high fiber diets (i.e. make sure you are having 2-3 bowel movements per day), lecithin at 2,500 mg t.i.d., EFA at 5 gm t.i.d., vitamin E at 800-1,200 IU per day, vitamin C to bowel tolerance, selenium at 200 mcg t.i.d., and taurine at 500 mg t.i.d.”
- verdict `distinct`

#### #615 · l-tryptophan — raynauds_disease  ·  SEAL (clean)
- **Question:** Does L-tryptophan help Raynaud's disease?
- **Short:** Wallach recommends L-tryptophan at 500 mg three times a day as part of his Raynaud's protocol.
- **Full:** Wallach recommends L-tryptophan at 500 mg three times a day as part of his protocol for Raynaud's disease.
- **Quote:** “Treatment of Raynaud’s disease should include calcium and magnesium at 2,000 mg per day and 1,000 mg per day respectively. Avoid offending food allergens, avoid caffeine (i.e. coffee, tea, soft drinks, chocolate, etc.), vitamin E at 800-1,200 IU per day, essential fatty acids at 5 grams t.i.d., l-tryptophan at 500 mg t.i.d., acupuncture, chiropractic, and herbs to increase circulation such as cayenne pepper (Capsicum minimum).”
- verdict `overlapping`

#### #623 · magnesium — uterine_fibroids  ·  SEAL (clean)
- **Question:** How much magnesium should I take for uterine fibroids?
- **Short:** Wallach says to crank magnesium up to 1,000 mg per day for uterine fibroids. He reasons that fibroid tissue mirrors the arterial calcification caused by magnesium deficiency, so restoring magnesium is central to shrinking them.
- **Full:** For uterine fibroids, Wallach says to crank magnesium up to 1,000 mg per day.
- **Quote:** “Treatment of uterine fibroids should include avoidance of fried foods, margarine, and caffeine, as well as supplementation with all 90 essential nutrients. Crank up the magnesium level to 1,000 mg per day, vitamin E level to 2,000 i.u., and the selenium level to 500 mcg per day.”
- verdict `distinct`

#### #624 · vitamin E — uterine_fibroids  ·  SEAL (clean)
- **Question:** Does vitamin E help with uterine fibroids?
- **Short:** Yes, Wallach's fibroid protocol boosts vitamin E to 2,000 IU per day. He draws the parallel to fibrocystic breast disease, where vitamin E supplementation helps the tissue heal.
- **Full:** Wallach recommends raising vitamin E to 2,000 IU per day as part of shrinking uterine fibroids.
- **Quote:** “Treatment of uterine fibroids should include avoidance of fried foods, margarine, and caffeine, as well as supplementation with all 90 essential nutrients. Crank up the magnesium level to 1,000 mg per day, vitamin E level to 2,000 i.u., and the selenium level to 500 mcg per day.”
- verdict `distinct`

#### #625 · selenium — uterine_fibroids  ·  SEAL (clean)
- **Question:** Does selenium help shrink uterine fibroids?
- **Short:** Wallach's fibroid plan raises selenium to 500 mcg per day. As with fibrocystic breast disease, he sees selenium, paired with vitamin E and no caffeine, as aiding the tissue's healing.
- **Full:** Wallach recommends raising selenium to 500 mcg per day to help shrink uterine fibroids.
- **Quote:** “Treatment of uterine fibroids should include avoidance of fried foods, margarine, and caffeine, as well as supplementation with all 90 essential nutrients. Crank up the magnesium level to 1,000 mg per day, vitamin E level to 2,000 i.u., and the selenium level to 500 mcg per day.”
- verdict `distinct`

#### #657 · vitamin B12 — shingles  ·  SEAL (clean)
- **Question:** Does vitamin B12 help shingles?
- **Short:** Yes — Wallach's treatment of choice for shingles includes vitamin B12 at 1,000 mcg per day.
- **Full:** Wallach includes vitamin B12 at 1,000 mcg per day in his treatment of choice for shingles.
- **Quote:** “Treatment of choice for shingles is Isoprinosin at 500-1,500 mg/day, Ribavirin at 250-500 mg/day, vitamin B12 at 1,000 mcg/day”
- verdict `overlapping`  ·  flag: ['shared-source: from the shingles protocol sentence held by WAL-CLM-DDDL-000278 — reconcile as an added search question, not a new independent claim']

#### #662 · vitamin B6 — kidney_stones  ·  SEAL (clean)
- **Question:** Does vitamin B6 help with kidney stones?
- **Short:** Yes — Wallach includes vitamin B6 at 50 mg three times a day in his kidney-stone protocol, alongside calcium, magnesium, reduced phosphorus and vitamin A.
- **Full:** Wallach's kidney-stone protocol includes vitamin B6 at 50 mg three times a day.
- **Quote:** “Treatment of kidney disease and kidney stones should include supplementation of calcium and magnesium at 2,000 mg and 1,000 mg per day, reduction of your phosphorus intake, adequate vitamin A nutriture at 25,000-300,000 IU, vitamin A per day as beta-carotene, B6 at 50 mg t.i.d.,”
- verdict `distinct`
