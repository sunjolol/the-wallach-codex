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
Deluxe Nutritional Energy · Nutritional Alert Program · Nutritional Energy Basics · Nutritional Energy Program · PigPak® · PigPak® Plus · Super Immune · Super Immune Plus · VitalStart Body Shield · Scholastic Enhancement · Baseline / Baseline Plus / Baseline Ultra · Chocolate/French Vanilla Weight Loss 150 · Healthy Weight Loss Chocolate/French Vanilla

## PROVISIONAL genuine-missing candidates (single products, no label seen yet — CONFIRM at end)
- Activated Charcoal (USLF000112)
- HOPE (Sta-Natural, ygy 577 / USSN000009) — RESOLVED 2026-07-07: Luneth supplied sn-hope label; extracted as `hope-sta-natural`. HOPE (Youngevity, ygy 10359 / USYG7000) = a BUNDLE (3 sold-separately products: Life Balance Menopause Support + Rejuvenate/Rewind/Restore + Women's Probiotic COMPLETE) → SKIP per standard bundle policy; its parts record individually.
- Imortalium 120ct (USYG100080)
- Majestic Earth Mineral STX - BOGO (USYG400401, ygy 10540) — the fuzzy matcher assigned it the `ult-mineral-caps` label, but that label is Ultimate Mineral Caps (sku 20691, extracted early as `ultimate-mineral-caps` in Batch 16). "STX" = the stick form; the BOGO's real (mineral-stick) label is absent, and its only manifest SKU is the BOGO promo itself. CONFIRM identity + supply the real label at end.
- Manuka Force Lemon Honey Lozenges (USLF700002) — RESOLVED 2026-07-07: Luneth supplied `manuka-force-lemon-honey-lozenges_nfp_0126.jpg`; extracted as `manuka-force-lemon-honey-lozenges` (food-format lozenge).
- Multi-Collagen Peptide Gummies (USYG100506)
- Nano Balance (USLF700001) — RESOLVED 2026-07-07: Luneth supplied `nano-balance-tincture_1224_supp-facts.jpg`; extracted as `nano-balance` (glycerin-based liquid, Curcumin Complex Blend 500mg).
- Plant Derived Minerals (13203)
- Refresh FX (USYG103200)
- RVB 350 (USRS000005) + RYL BETA550 (USRS000006)
- Super Collagen Shot (USYG300055)
- Taheebo (USLF000120)
- TrueDetox Tea 30ct (TL021PROD)
- Ultimate Iron 26 (USYG70008)
- Ultimate ParaClear (20972)
- Ultimate Super KB 90caps (67508)
- XeraTest Hormonal Support for Men (USYG100081)
- Youngevity CardioBeets 195g (USYG100071)

_(Same-name clusters pending careful side-by-side label passes; not counted here yet. **Body Balance RESOLVED 2026-07-06:** base liquid (USLF000130) + Sticks powder (USLF070031) extracted; Body Balance Mix + Starter Pack + the '×N w/ TruBoost/VitalStart' listings are bundles (skip). **Osteo family RESOLVED 2026-07-06:** Beyond Osteo FX Liquid (USYG103210) + Powder (USYG103211), Osteo-Mag (21210), OsteoProCare (USLF000700V), Ultimate Osteo FX (13209) all extracted. **BTT / Tangy Tangerine line RESOLVED 2026-07-06:** all 6 base products extracted — 2.5 Canister, Original 450G (+ its 30-count box variant 23230), 2.0 CPF canister, 2.0 CPF 30-count box, 2.0 Tablets, Ultimate Liquid — no genuine-missing among them.) **Ultimate Mineral Caps RESOLVED 2026-07-07 (Batch 16 — extracted early from the M-range because the mislabeled `ult-mineral-caps` label is actually this product):** base 64-cap (sku 20691, ygy 751) is `ultimate-mineral-caps`; the 4-pack (20691C, ygy 752) is a plain multipack (not a variant, per the female/GH precedent). The U-range pass can skip it._ **Premium Muscadine Grape Seed (USNP000001, ygy 988) done EARLY 2026-07-07 (Batch 17)** — its label `usnp000001_...caps_suppfacts` was in hand alongside the N-range Nature's Pearl Muscadine Grape *Extract* syrup (7756); two distinct muscadine products. The P-range pass can skip the Grape Seed._
