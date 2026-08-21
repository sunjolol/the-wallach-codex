# Label coverage — which products have no label, and why

_The record of how label coverage was accounted for while `products.json` was built. The
build is finished and sealed; this file is kept because the two lists below are the standing
answer to "why does that product have no label?", and because the matcher trap it documents
will bite anyone who repeats the exercise._

## The matcher trap (read this before trusting any "no label" list)

A fuzzy filename-to-product matcher's first-pass "no label found" list is mostly FALSE
NEGATIVES: the label image exists, the matcher simply failed to assign it. Abbreviated product
names and separator-less filenames are the two reliable causes. Dozens of products —
Colloidal Silver, ZRadical, TruBoost, Vitali-C, RenuIQ, Body Balance, Kidsprinklz, Get-Go-N,
FlexeoPlus, Flexi-Care, H.G.H., i26, Male Hormonal, Midnight Minerals, Omega, Pollen Burst,
Rebound FX, S.M.A.R.T. FX, the whole Ultimate line, VitalStart, Women's FX — were flagged as
label-less and every one of them had a label on disk.

A genuine missing-label list can therefore only be computed at the END, as `products.json`
versus the product listing, minus bundles and non-supplements. Do not act on the intermediate
list, and do not let a near-miss filename decide a product's identity: one label named for the
mineral capsules was very nearly attached to the mineral stickpacks, which are a different
product with a different formula.

## Excluded — non-supplements (no label expected)

- Makers Diet Revolution book (USBY100840)
- EP2-Plus Stress Pendant (USEW000008)
- Harmony Health EMR SMART Patch (USEW000007) + 3-Pack (USEW0073)
- Quanta Water Catalyst 16 Oz (USEW000003)
- Refrigerator eCrystal (USEW000005)

## Bundles (component products sold separately → no label of their own)

Deluxe Nutritional Energy · Nutritional Alert Program · On-The-Go Healthy Body Start Pak 2.0 ·
Nutritional Energy Basics · Nutritional Energy Program · PigPak® · PigPak® Plus · Pollen Burst
Combo · R&R + BB Combo · Power Pak · Premiere 30 Day Liver Pure Detox (Chocolate / French
Vanilla) · Super Immune · Super Immune Plus · VitalStart Body Shield · Scholastic Enhancement ·
Baseline / Baseline Plus / Baseline Ultra · Chocolate/French Vanilla Weight Loss 150 · Healthy
Weight Loss Chocolate/French Vanilla

A bundle is modeled as a reference to its base products; its parts carry the composition. The
same rule covers plain multipacks — a 4-pack of an already-extracted sku is not a variant.

## Outcome

Every product that was genuinely missing a label had one supplied and was then extracted from
it, and the closing reconciliation of `products.json` against the listing left no unexplained
gap. The sealed pillar is the record of what that produced; read the product count off
`products.json`, not off this file.
