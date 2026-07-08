# Missing labels — genuine unique products with no label

_Running record. Luneth grabs these at the end. Bundles/paks and non-supplement items are NOT missing (no label expected)._

## How this is determined (reliable only at the END)
The fuzzy matcher's first-pass "no-label" list is mostly FALSE NEGATIVES — the label exists in `temporary/labels/` but the matcher failed to assign it (abbreviations, no-separator filenames). Proven: Colloidal Silver, ZRadical, TruBoost, Vitali-C, RenuIQ, Body Balance, Kidsprinklz, Get-Go-N, FlexeoPlus, Flexi-Care, H.G.H., i26, Male Hormonal, Midnight Minerals, Omega, Pollen Burst, Rebound FX, S.M.A.R.T. FX, Ultimate CAL/CM/Daily/EFA/Gluco-Gel/Hair-Skin-Nails/Multi-EFA/Ocean's Gold/Vitamin-D3, VitalStart, Women's FX — all have labels it missed.

So the RELIABLE genuine-missing list = base-unique products still un-extracted AFTER all 204 labels are consumed. This file auto-finalizes at Phase-F end (products.json vs manifest, minus bundles + non-supplements). Everything below is PROVISIONAL.

## Excluded — non-supplements (no label needed, per Luneth's exclude decision)
- Makers Diet Revolution book (USBY100840)
- EP2-Plus Stress Pendant (USEW000008)
- Harmony Health EMR SMART Patch (USEW000007) + 3-Pack (USEW0073)
- Quanta Water Catalyst 16 Oz (USEW000003)
- Refrigerator eCrystal (USEW000005)

## Confirmed bundles among the "ambiguous" (description lists component products → no label)
Deluxe Nutritional Energy · Nutritional Alert Program · On-The-Go Healthy Body Start Pak 2.0 · Nutritional Energy Basics · Nutritional Energy Program · PigPak® · PigPak® Plus · Pollen Burst Combo · R&R + BB Combo · Power Pak · Premiere 30 Day Liver Pure Detox (Chocolate / French Vanilla) · Super Immune · Super Immune Plus · VitalStart Body Shield · Scholastic Enhancement · Baseline / Baseline Plus / Baseline Ultra · Chocolate/French Vanilla Weight Loss 150 · Healthy Weight Loss Chocolate/French Vanilla

## PROVISIONAL genuine-missing candidates (single products, no label seen yet — CONFIRM at end)
- Activated Charcoal (USLF000112)
- HOPE (Sta-Natural, ygy 577 / USSN000009) — RESOLVED 2026-07-07: Luneth supplied sn-hope label; extracted as `hope-sta-natural`. HOPE (Youngevity, ygy 10359 / USYG7000) = a BUNDLE (3 sold-separately products: Life Balance Menopause Support + Rejuvenate/Rewind/Restore + Women's Probiotic COMPLETE) → SKIP per standard bundle policy; its parts record individually.
- Imortalium 120ct (USYG100080)
- Majestic Earth Mineral STX - BOGO (USYG400401, ygy 10540) — the fuzzy matcher assigned it the `ult-mineral-caps` label, but that label is Ultimate Mineral Caps (sku 20691, extracted early as `ultimate-mineral-caps` in Batch 16). "STX" = the stick form; the BOGO's real (mineral-stick) label is absent, and its only manifest SKU is the BOGO promo itself. CONFIRM identity + supply the real label at end.
- Manuka Force Lemon Honey Lozenges (USLF700002) — RESOLVED 2026-07-07: Luneth supplied `manuka-force-lemon-honey-lozenges_nfp_0126.jpg`; extracted as `manuka-force-lemon-honey-lozenges` (food-format lozenge).
- Multi-Collagen Peptide Gummies (USYG100506)
- Nano Balance (USLF700001) — RESOLVED 2026-07-07: Luneth supplied `nano-balance-tincture_1224_supp-facts.jpg`; extracted as `nano-balance` (glycerin-based liquid, Curcumin Complex Blend 500mg).
- Plant Derived Minerals (13203) — RESOLVED 2026-07-07: Luneth supplied `13203_plant_derived_minerals_supfacts.jpg`; extracted as `plant-derived-minerals` (liquid, Majestic Earth Plant Derived Minerals 600mg).
- Refresh FX (USYG103200) — RESOLVED 2026-07-07: Luneth supplied `refresh-fx_0126_supp-facts.jpg`; extracted as `refresh-fx`. [RESOLVED 2026-07-07: Thiamin corrected 7 mcg -> 7 mg (Luneth's call; 583% x 1.2 mg DV = exactly 7 mg).]
- Root Beer Belly (USYG100000) — RESOLVED 2026-07-07: Luneth supplied `ygy-usyg100000-root-beer-belly-suppfacts-1012.jpg`; extracted as `root-beer-belly` (probiotic packet, 5 billion CFU).
- RVB 350 (USRS000005) + RYL BETA550 (USRS000006) — RESOLVED 2026-07-07: Luneth supplied `rvb_350_supp-fact_1024.jpg` + `ryl_beta550_supp-fact_1024.jpg`; extracted as `rvb-350` (350mg beta-glucan) + `ryl-beta550` (550mg beta-glucan).
- Super Collagen Shot (USYG300055)
- Taheebo (USLF000120)
- TrueDetox Tea 30ct (TL021PROD)
- Ultimate Iron 26 (USYG70008)
- Ultimate ParaClear (20972)
- Ultimate Super KB 90caps (67508)
- XeraTest Hormonal Support for Men (USYG100081)
- Youngevity CardioBeets 195g (USYG100071)

_(Same-name clusters pending careful side-by-side label passes; not counted here yet. **Body Balance RESOLVED 2026-07-06:** base liquid (USLF000130) + Sticks powder (USLF070031) extracted; Body Balance Mix + Starter Pack + the '×N w/ TruBoost/VitalStart' listings are bundles (skip). **Osteo family RESOLVED 2026-07-06:** Beyond Osteo FX Liquid (USYG103210) + Powder (USYG103211), Osteo-Mag (21210), OsteoProCare (USLF000700V), Ultimate Osteo FX (13209) all extracted. **BTT / Tangy Tangerine line RESOLVED 2026-07-06:** all 6 base products extracted — 2.5 Canister, Original 450G (+ its 30-count box variant 23230), 2.0 CPF canister, 2.0 CPF 30-count box, 2.0 Tablets, Ultimate Liquid — no genuine-missing among them.) **Ultimate Mineral Caps RESOLVED 2026-07-07 (Batch 16 — extracted early from the M-range because the mislabeled `ult-mineral-caps` label is actually this product):** base 64-cap (sku 20691, ygy 751) is `ultimate-mineral-caps`; the 4-pack (20691C, ygy 752) is a plain multipack (not a variant, per the female/GH precedent). The U-range pass can skip it._ **Premium Muscadine Grape Seed (USNP000001, ygy 988) done EARLY 2026-07-07 (Batch 17)** — its label `usnp000001_...caps_suppfacts` was in hand alongside the N-range Nature's Pearl Muscadine Grape *Extract* syrup (7756); two distinct muscadine products. The P-range pass can skip the Grape Seed._

## Count-variants of extracted products (attach as variants[] when the pack-size label is obtained)
- Ultimate EFA - 180 soft gels (21832, ygy 739) - same softgel formula as `ultimate-efa` (60-ct, sku 20641); no 180 label in hand (noted U3, 2026-07-07).
- Ultimate Gluco-Gel - 120 Capsules (21251, ygy 581 & 6763) - same formula as `ultimate-gluco-gel` (240-ct, sku 21252); no 120 label in hand (noted U4, 2026-07-07).
