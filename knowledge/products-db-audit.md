# Products-DB Completeness Audit

_Generated: 2026-06-21T15:07:46.481252+00:00 UTC by `tools/products_db_audit.py`._
_Source: `knowledge/products-db.json` (201 products)._

## Summary

| Tier | Count | % |
|---|---:|---:|
| fully populated | 97 | 48.3% |
| partially populated | 46 | 22.9% |
| sparse | 53 | 26.4% |
| skeletal | 5 | 2.5% |

**Tier definitions:**
- **Fully populated**: nutrients + description + features + what_it_does + serving_size + servings_per_container + pricing + pdf_sources.
- **Partially populated**: nutrients present + at least one of (description / features / what_it_does) OR full label-meta (serving/container).
- **Sparse**: has nutrients OR has both context text AND label meta — but missing multiple key fields.
- **Skeletal**: no nutrients AND no context text. Product was registered but never substantively populated.

## Field coverage

| Field | Products with | % | Weight |
|---|---:|---:|---:|
| `nutrients` | 145 | 72.1% | 4 |
| `non_essentials` | 178 | 88.6% | 2 |
| `features` | 128 | 63.7% | 2 |
| `description` | 173 | 86.1% | 2 |
| `serving_size` | 201 | 100.0% | 1 |
| `servings_per_container` | 196 | 97.5% | 1 |
| `pricing` | 174 | 86.6% | 1 |
| `what_it_does` | 136 | 67.7% | 1 |
| `who_its_for` | 136 | 67.7% | 1 |
| `pdf_sources` | 174 | 86.6% | 1 |
| `verified` | 201 | 100.0% | 1 |
| `category` | 201 | 100.0% | 1 |

## Action candidates

### Re-scrape candidates (27)

Products with no `description`, no `features`, AND no `pdf_sources`. The product page was likely never scraped — start the data-completion pass here.

- Activate GLP-1
- Ancestral Supplements Grass Fed Beef Liver
- BE Trim Sticks (Mango or Pina Colada)
- Cough Syrup
- Fucoidz
- Good Herbs Kidney & Bladder Support
- Good Herbs Sinus & Allergy
- Jointrestor
- LiverPrep (T2L)
- Multi-Collagen Peptides
- Muscadine Grape Extract
- Neutonic Productivity Drink
- New Zealand BTT 2 Tablets
- Pau d'Arco Liquid Extract
- Plant Shake
- Pollen Burst Plus (Berry/Cassis)
- Pollen Burst Plus (Dragonfruit)
- Pollen Burst Plus (Orange)
- Pollen Burst Plus (Strawberry-Acai)
- ProstaTrol (PJ102)
- Survival Shield X-2 Iodine
- Tazza di Vita Latte
- Ultimate Vitamin D3 2500 IU
- Ultimate Zinc Drops
- Ultimate Zinc Immune Lozenge
- Vitalic (Immune Stick Pack)
- ZRadical Collagen

### Label OCR candidates (51)

Products with `pdf_sources` on file (label PDFs available) but no parsed `nutrients` — the label data exists in PDF form and would surface via OCR.

- 18 Daily Super Fruit Blend
- 20 Daily Super Veggie Blend
- Apple Cider Vinegar Gummies
- Biometics Bio-Nite
- Bliss Sleep Spray
- Cell Shield RTQ
- Cleanse FX
- DigestWel
- Good Herbs Adrenal Health
- Good Herbs Antioxidant Response
- Good Herbs Bone & Tissue Support
- Good Herbs Circulatory Formula
- Good Herbs Female Hormonal Support
- Good Herbs GI Cleanse
- Good Herbs Heart Support
- Good Herbs Hypothalamus Support
- Good Herbs Immune Support
- Good Herbs Liver & Gallbladder Health
- Good Herbs Lymphatic Health
- Good Herbs Male Hormone Support
- Good Herbs Nerve Support
- Good Herbs Pancreas Support
- Good Herbs Prostate Health
- Good Herbs Respiratory Support
- Good Herbs Super Olive Health
- Integris Probiotics
- Killer Biotic FX
- L'dara Wellness Tea (Energize)
- Midnight Minerals
- Nature's Pearl Muscadine Caps
- Nightly Essense
- Pollen Burst (Standalone Tablet)
- Pollen Burst Plus Daily Liver Formula
- ProFemme (PJ400)
- Purmeric (Turmeric)
- SmartStiks
- Sta-Young
- TRIM Sticks (Kiwi-Strawberry M-THERMX)
- Tazza di Vita (Mushroom Coffee)
- Ultimate CM Cream (Topical Drug)
- Ultimate CM Plus
- Ultimate Colon FX
- Ultimate Enzymes
- Ultimate Flora FX
- Ultimate Hormone FX
- Women's FX
- Women's Probiotic COMPLETE
- i26 Egg Capsules
- i26 Egg Powder
- i26 Egg Tablets (Banana Coconut)
- i26 Egg Tablets (French Vanilla)

### Reference products (98)

Highest-completeness entries in the catalog. Use as templates when upgrading sparse / skeletal entries.

- 3.0 Restore
- 3.0 Rise
- ACT Energy Canister
- ACT Energy Stick Pack
- ASAP
- BTT 2.0 Powder Stick Pack
- BTT 2.0 Tablets
- BTT 2.5 Canister
- Beyond Hot Chocolate
- Beyond Osteo FX Liquid
- Beyond Osteo FX Powder
- Biometics Aloe Plus
- Biometics Bio-Alert (Choline Mega-Dose)
- Biometics Bio-Fuel
- Biometics Cal-Mag
- Biometics Get-Go-N-Plus
- Biometrics Flexicare
- Cal Toddy Liquid
- Cheri-Mins
- ChiYo3 Energy (Goji Juice)
- Citri-D Spray (6000 IU)
- Collagen Peptides Hair, Skin & Nail Support
- Collagen Peptides Joint
- Colloidal Silver (1/2 tsp)
- Core AO
- ElectroFuel
- Elevate GLP-1 Shot
- Gluco-Gel Plus Liquid
- Glucogenix
- HGH Amino Acid Blend
- Herbal Rainforest
- Kid Sprinklz
- Kids Toddy Liquid
- Life Balance Menopause Support
- LifeFortify Flexeo Plus
- Liquid Gluco-Gel
- MCT Collagen Creamer
- MSM Ultra Caplets
- Majestic Earth Plant Derived Minerals Liquid
- Ocutiv (Pro-line Eye)
- Osteo Mag Liquid
- Oxy Body Cherry Berry
- ProCardio FX (Pro-line Cardiovascular)
- ProJoba Omega (Fish Oil)
- ProJoint FX
- Pumpkin Spice Protein Shake
- Rebound FX (Can)
- Rebound FX Citrus Punch (Powder)
- Regulate GLP-1
- Rejuvenate Rewind Restore
- RenuIQ
- Sleep Eze
- Sleep Gummy
- Slender FX Meal Replacement Shake (French Vanilla)
- Slender FX REV (Liquid Drops)
- Slender FX Sweet Eze
- Soul Stiks
- Sta-Balanced
- Sta-Cardio
- Sta-Clear
- Sta-Energized Plus
- Sta-Restored
- Sta-Vital
- Strawberry Kiwi-Mins
- Super Greens Powder
- Synaptiv
- Total Meal Replacement Chocolate
- True2Life Daily Digest
- True2Life LiverPure Kit (LiverClean component)
- True2Life TrueCleanse
- True2Life TrueZyme
- US Body Balance
- Ultimate Cardio FX
- Ultimate Cardio Stx
- Ultimate Classic Liquid
- Ultimate D-Stress
- Ultimate Daily 180 Tablets
- Ultimate Daily Capsules
- Ultimate Digest FX
- Ultimate EFA (Flax-Dominant)
- Ultimate EFA Plus
- Ultimate Gluco-Gel
- Ultimate Hair, Skin & Nails
- Ultimate Memory FX
- Ultimate Microbiome
- Ultimate Mineral Caps
- Ultimate Niacin Plus
- Ultimate Ocean's Gold
- Ultimate Prost FX
- Ultimate Selenium
- Ultimate Smart FX
- Ultimate Tangy Tangerine Liquid (UTT)
- Ultimate Vision FX
- Ultimate Vitamin D3 5000 IU
- Ultra Body Toddy Liquid
- XeraFem (Pro-line Women's Hormonal)
- XeraTest
- ZRadical Powder Canister

## Per-product gradient (sorted by completeness ASC — lowest first)

| Product | Tier | Score | Nutrients | Non-ess | Missing |
|---|---|---:|---:|---:|---|
| Cough Syrup | skeletal | 6/18 (33.3%) | 0 | 7 | description, features, nutrients, pdf_sources, pricing, +2 more |
| Good Herbs Kidney & Bladder Support | skeletal | 6/18 (33.3%) | 0 | 1 | description, features, nutrients, pdf_sources, pricing, +2 more |
| Good Herbs Sinus & Allergy | skeletal | 6/18 (33.3%) | 0 | 1 | description, features, nutrients, pdf_sources, pricing, +2 more |
| Pau d'Arco Liquid Extract | skeletal | 6/18 (33.3%) | 0 | 1 | description, features, nutrients, pdf_sources, pricing, +2 more |
| ProstaTrol (PJ102) | skeletal | 6/18 (33.3%) | 0 | 1 | description, features, nutrients, pdf_sources, pricing, +2 more |
| Survival Shield X-2 Iodine | sparse | 7/18 (38.9%) | 1 | 0 | description, features, non_essentials, pdf_sources, pricing, +3 more |
| Ancestral Supplements Grass Fed Beef Liver | partially populated | 8/18 (44.4%) | 6 | 0 | description, features, non_essentials, pdf_sources, pricing, +2 more |
| Ultimate Vitamin D3 2500 IU | partially populated | 8/18 (44.4%) | 3 | 0 | description, features, non_essentials, pdf_sources, pricing, +2 more |
| Neutonic Productivity Drink | sparse | 9/18 (50.0%) | 4 | 4 | description, features, pdf_sources, pricing, servings_per_container, +2 more |
| Activate GLP-1 | partially populated | 10/18 (55.6%) | 2 | 2 | description, features, pdf_sources, pricing, what_it_does, +1 more |
| BE Trim Sticks (Mango or Pina Colada) | partially populated | 10/18 (55.6%) | 4 | 5 | description, features, pdf_sources, pricing, what_it_does, +1 more |
| Biometics Bio-Nite | sparse | 10/18 (55.6%) | 0 | 3 | features, nutrients, what_it_does, who_its_for |
| Cleanse FX | sparse | 10/18 (55.6%) | 0 | 6 | features, nutrients, what_it_does, who_its_for |
| Fucoidz | partially populated | 10/18 (55.6%) | 2 | 2 | description, features, pdf_sources, pricing, what_it_does, +1 more |
| Good Herbs Adrenal Health | sparse | 10/18 (55.6%) | 0 | 1 | features, nutrients, what_it_does, who_its_for |
| Good Herbs Antioxidant Response | sparse | 10/18 (55.6%) | 0 | 1 | features, nutrients, what_it_does, who_its_for |
| Good Herbs Bone & Tissue Support | sparse | 10/18 (55.6%) | 0 | 1 | features, nutrients, what_it_does, who_its_for |
| Good Herbs Circulatory Formula | sparse | 10/18 (55.6%) | 0 | 1 | features, nutrients, what_it_does, who_its_for |
| Good Herbs Female Hormonal Support | sparse | 10/18 (55.6%) | 0 | 1 | features, nutrients, what_it_does, who_its_for |
| Good Herbs GI Cleanse | sparse | 10/18 (55.6%) | 0 | 1 | features, nutrients, what_it_does, who_its_for |
| Good Herbs Heart Support | sparse | 10/18 (55.6%) | 0 | 1 | features, nutrients, what_it_does, who_its_for |
| Good Herbs Hypothalamus Support | sparse | 10/18 (55.6%) | 0 | 1 | features, nutrients, what_it_does, who_its_for |
| Good Herbs Immune Support | sparse | 10/18 (55.6%) | 0 | 1 | features, nutrients, what_it_does, who_its_for |
| Good Herbs Liver & Gallbladder Health | sparse | 10/18 (55.6%) | 0 | 1 | features, nutrients, what_it_does, who_its_for |
| Good Herbs Lymphatic Health | sparse | 10/18 (55.6%) | 0 | 1 | features, nutrients, what_it_does, who_its_for |
| Good Herbs Male Hormone Support | sparse | 10/18 (55.6%) | 0 | 1 | features, nutrients, what_it_does, who_its_for |
| Good Herbs Nerve Support | sparse | 10/18 (55.6%) | 0 | 1 | features, nutrients, what_it_does, who_its_for |
| Good Herbs Pancreas Support | sparse | 10/18 (55.6%) | 0 | 1 | features, nutrients, what_it_does, who_its_for |
| Good Herbs Prostate Health | sparse | 10/18 (55.6%) | 0 | 1 | features, nutrients, what_it_does, who_its_for |
| Good Herbs Respiratory Support | sparse | 10/18 (55.6%) | 0 | 1 | features, nutrients, what_it_does, who_its_for |
| Integris Probiotics | sparse | 10/18 (55.6%) | 0 | 2 | features, nutrients, what_it_does, who_its_for |
| Jointrestor | partially populated | 10/18 (55.6%) | 1 | 2 | description, features, pdf_sources, pricing, what_it_does, +1 more |
| LiverPrep (T2L) | partially populated | 10/18 (55.6%) | 2 | 1 | description, features, pdf_sources, pricing, what_it_does, +1 more |
| Multi-Collagen Peptides | partially populated | 10/18 (55.6%) | 1 | 3 | description, features, pdf_sources, pricing, what_it_does, +1 more |
| Muscadine Grape Extract | partially populated | 10/18 (55.6%) | 2 | 2 | description, features, pdf_sources, pricing, what_it_does, +1 more |
| New Zealand BTT 2 Tablets | partially populated | 10/18 (55.6%) | 22 | 12 | description, features, pdf_sources, pricing, what_it_does, +1 more |
| Plant Shake | partially populated | 10/18 (55.6%) | 4 | 3 | description, features, pdf_sources, pricing, what_it_does, +1 more |
| Pollen Burst Plus (Berry/Cassis) | partially populated | 10/18 (55.6%) | 7 | 4 | description, features, pdf_sources, pricing, what_it_does, +1 more |
| Pollen Burst Plus (Dragonfruit) | partially populated | 10/18 (55.6%) | 8 | 5 | description, features, pdf_sources, pricing, what_it_does, +1 more |
| Pollen Burst Plus (Orange) | partially populated | 10/18 (55.6%) | 7 | 4 | description, features, pdf_sources, pricing, what_it_does, +1 more |
| Pollen Burst Plus (Strawberry-Acai) | partially populated | 10/18 (55.6%) | 8 | 4 | description, features, pdf_sources, pricing, what_it_does, +1 more |
| Tazza di Vita Latte | partially populated | 10/18 (55.6%) | 1 | 5 | description, features, pdf_sources, pricing, what_it_does, +1 more |
| Ultimate CM Plus | sparse | 10/18 (55.6%) | 0 | 1 | features, nutrients, what_it_does, who_its_for |
| Ultimate Colon FX | sparse | 10/18 (55.6%) | 0 | 1 | features, nutrients, what_it_does, who_its_for |
| Ultimate Zinc Drops | partially populated | 10/18 (55.6%) | 1 | 2 | description, features, pdf_sources, pricing, what_it_does, +1 more |
| Ultimate Zinc Immune Lozenge | partially populated | 10/18 (55.6%) | 2 | 2 | description, features, pdf_sources, pricing, what_it_does, +1 more |
| Vitalic (Immune Stick Pack) | partially populated | 10/18 (55.6%) | 3 | 1 | description, features, pdf_sources, pricing, what_it_does, +1 more |
| ZRadical Collagen | partially populated | 10/18 (55.6%) | 6 | 3 | description, features, pdf_sources, pricing, what_it_does, +1 more |
| Integris Vitamin K2 | partially populated | 11/18 (61.1%) | 1 | 0 | features, non_essentials, servings_per_container, what_it_does, who_its_for |
| 18 Daily Super Fruit Blend | sparse | 12/18 (66.7%) | 0 | 1 | features, nutrients |
| 20 Daily Super Veggie Blend | sparse | 12/18 (66.7%) | 0 | 1 | features, nutrients |
| Bio Calcium | partially populated | 12/18 (66.7%) | 7 | 0 | features, non_essentials, what_it_does, who_its_for |
| Ultimate Cal | partially populated | 12/18 (66.7%) | 6 | 0 | features, non_essentials, what_it_does, who_its_for |
| Ultimate King Calcium | partially populated | 12/18 (66.7%) | 7 | 0 | features, non_essentials, what_it_does, who_its_for |
| Ultimate Multi-EFA (Evening Primrose) | partially populated | 12/18 (66.7%) | 1 | 0 | features, non_essentials, what_it_does, who_its_for |
| Apple Cider Vinegar Gummies | sparse | 14/18 (77.8%) | 0 | 3 | nutrients |
| Bliss Sleep Spray | sparse | 14/18 (77.8%) | 0 | 1 | nutrients |
| Bone Building Formula | partially populated | 14/18 (77.8%) | 6 | 4 | features, what_it_does, who_its_for |
| C-FX | partially populated | 14/18 (77.8%) | 2 | 2 | features, what_it_does, who_its_for |
| Cell Shield RTQ | sparse | 14/18 (77.8%) | 0 | 1 | nutrients |
| Colloidal Silver (4-dropper) | partially populated | 14/18 (77.8%) | 1 | 0 | features, non_essentials |
| DigestWel | sparse | 14/18 (77.8%) | 0 | 1 | nutrients |
| Good Herbs Super Olive Health | sparse | 14/18 (77.8%) | 0 | 1 | nutrients |
| Harmony Drops (Sea Mineral Electrolytes) | partially populated | 14/18 (77.8%) | 3 | 1 | features, what_it_does, who_its_for |
| Immu-911 | partially populated | 14/18 (77.8%) | 2 | 2 | features, what_it_does, who_its_for |
| Integris CoQ10 + Vit E Succinate | partially populated | 14/18 (77.8%) | 1 | 2 | features, what_it_does, who_its_for |
| Killer Biotic FX | sparse | 14/18 (77.8%) | 0 | 1 | nutrients |
| L'dara Wellness Tea (Energize) | sparse | 14/18 (77.8%) | 0 | 1 | nutrients |
| Midnight Minerals | sparse | 14/18 (77.8%) | 0 | 2 | nutrients |
| Nature's Pearl Muscadine Caps | sparse | 14/18 (77.8%) | 0 | 1 | nutrients |
| Nightly Essense | sparse | 14/18 (77.8%) | 0 | 3 | nutrients |
| OsteoProCare | partially populated | 14/18 (77.8%) | 7 | 0 | features, non_essentials |
| Pollen Burst (Standalone Tablet) | sparse | 14/18 (77.8%) | 0 | 1 | nutrients |
| Pollen Burst Plus Daily Liver Formula | sparse | 14/18 (77.8%) | 0 | 1 | nutrients |
| ProFemme (PJ400) | sparse | 14/18 (77.8%) | 0 | 1 | nutrients |
| Purmeric (Turmeric) | sparse | 14/18 (77.8%) | 0 | 2 | nutrients |
| ReVERSE!® | partially populated | 14/18 (77.8%) | 27 | 7 | features, what_it_does, who_its_for |
| Slender FX Keto Power Up | partially populated | 14/18 (77.8%) | 2 | 2 | features, what_it_does, who_its_for |
| SmartStiks | sparse | 14/18 (77.8%) | 0 | 4 | nutrients |
| Sta-Young | sparse | 14/18 (77.8%) | 0 | 1 | nutrients |
| Super Cell Protector | partially populated | 14/18 (77.8%) | 13 | 1 | features, what_it_does, who_its_for |
| TRIM Sticks (Kiwi-Strawberry M-THERMX) | sparse | 14/18 (77.8%) | 0 | 3 | nutrients |
| Tazza di Vita (Mushroom Coffee) | sparse | 14/18 (77.8%) | 0 | 2 | nutrients |
| Ultimate CM Cream (Topical Drug) | sparse | 14/18 (77.8%) | 0 | 2 | nutrients |
| Ultimate Enzymes | sparse | 14/18 (77.8%) | 0 | 6 | nutrients |
| Ultimate Flora FX | sparse | 14/18 (77.8%) | 0 | 2 | nutrients |
| Ultimate Hormone FX | sparse | 14/18 (77.8%) | 0 | 10 | nutrients |
| Ultimate Iodine | partially populated | 14/18 (77.8%) | 5 | 0 | features, non_essentials |
| Ultimate Osteo FX Liquid | partially populated | 14/18 (77.8%) | 7 | 1 | features, what_it_does, who_its_for |
| ViaViente Fruit Juice | partially populated | 14/18 (77.8%) | 2 | 2 | features, what_it_does, who_its_for |
| Women's FX | sparse | 14/18 (77.8%) | 0 | 8 | nutrients |
| Women's Hormonal Balancer | partially populated | 14/18 (77.8%) | 3 | 2 | features, what_it_does, who_its_for |
| Women's Probiotic COMPLETE | sparse | 14/18 (77.8%) | 0 | 2 | nutrients |
| Zinc FX Lozenges | partially populated | 14/18 (77.8%) | 1 | 2 | features, what_it_does, who_its_for |
| i26 Egg Capsules | sparse | 14/18 (77.8%) | 0 | 1 | nutrients |
| i26 Egg Powder | sparse | 14/18 (77.8%) | 0 | 1 | nutrients |
| i26 Egg Tablets (Banana Coconut) | sparse | 14/18 (77.8%) | 0 | 2 | nutrients |
| i26 Egg Tablets (French Vanilla) | sparse | 14/18 (77.8%) | 0 | 2 | nutrients |
| Ultimate Zinc | partially populated | 15/18 (83.3%) | 1 | 0 | non_essentials, servings_per_container |
| Beyond Osteo FX Liquid | fully populated | 16/18 (88.9%) | 9 | 0 | non_essentials |
| Beyond Osteo FX Powder | fully populated | 16/18 (88.9%) | 9 | 0 | non_essentials |
| Biometics Cal-Mag | fully populated | 16/18 (88.9%) | 6 | 0 | non_essentials |
| Citri-D Spray (6000 IU) | fully populated | 16/18 (88.9%) | 1 | 0 | non_essentials |
| Colloidal Silver (1/2 tsp) | fully populated | 16/18 (88.9%) | 1 | 0 | non_essentials |
| LifeFortify Recharge Recovery | partially populated | 16/18 (88.9%) | 14 | 1 | features |
| Majestic Earth Plant Derived Minerals Liquid | fully populated | 16/18 (88.9%) | 1 | 0 | non_essentials |
| ProJoba Omega (Fish Oil) | fully populated | 16/18 (88.9%) | 1 | 0 | non_essentials |
| TruBoost | partially populated | 16/18 (88.9%) | 4 | 3 | features |
| Ultimate Daily Classic | partially populated | 16/18 (88.9%) | 25 | 9 | description |
| Ultimate EFA (Flax-Dominant) | fully populated | 16/18 (88.9%) | 3 | 0 | non_essentials |
| Ultimate EFA Plus | fully populated | 16/18 (88.9%) | 3 | 0 | non_essentials |
| Ultimate Selenium | fully populated | 16/18 (88.9%) | 9 | 0 | non_essentials |
| Ultimate Vitamin D3 5000 IU | fully populated | 16/18 (88.9%) | 3 | 0 | non_essentials |
| VitalStart (Cardiovascular Stick Pack) | partially populated | 16/18 (88.9%) | 14 | 4 | features |
| XeraTest | partially populated | 17/18 (94.4%) | 2 | 1 | servings_per_container |
| 3.0 Restore | fully populated | 18/18 (100.0%) | 9 | 7 | _(none)_ |
| 3.0 Rise | fully populated | 18/18 (100.0%) | 19 | 6 | _(none)_ |
| ACT Energy Canister | fully populated | 18/18 (100.0%) | 5 | 6 | _(none)_ |
| ACT Energy Stick Pack | fully populated | 18/18 (100.0%) | 5 | 6 | _(none)_ |
| ASAP | fully populated | 18/18 (100.0%) | 3 | 1 | _(none)_ |
| BTT 2.0 Powder Stick Pack | fully populated | 18/18 (100.0%) | 22 | 11 | _(none)_ |
| BTT 2.0 Tablets | fully populated | 18/18 (100.0%) | 22 | 12 | _(none)_ |
| BTT 2.5 Canister | fully populated | 18/18 (100.0%) | 23 | 7 | _(none)_ |
| Beyond Hot Chocolate | fully populated | 18/18 (100.0%) | 1 | 4 | _(none)_ |
| Biometics Aloe Plus | fully populated | 18/18 (100.0%) | 3 | 2 | _(none)_ |
| Biometics Bio-Alert (Choline Mega-Dose) | fully populated | 18/18 (100.0%) | 5 | 1 | _(none)_ |
| Biometics Bio-Fuel | fully populated | 18/18 (100.0%) | 18 | 4 | _(none)_ |
| Biometics Get-Go-N-Plus | fully populated | 18/18 (100.0%) | 11 | 1 | _(none)_ |
| Biometrics Flexicare | fully populated | 18/18 (100.0%) | 2 | 2 | _(none)_ |
| Cal Toddy Liquid | fully populated | 18/18 (100.0%) | 9 | 1 | _(none)_ |
| Cheri-Mins | fully populated | 18/18 (100.0%) | 1 | 2 | _(none)_ |
| ChiYo3 Energy (Goji Juice) | fully populated | 18/18 (100.0%) | 5 | 2 | _(none)_ |
| Collagen Peptides Hair, Skin & Nail Support | fully populated | 18/18 (100.0%) | 9 | 6 | _(none)_ |
| Collagen Peptides Joint | fully populated | 18/18 (100.0%) | 4 | 9 | _(none)_ |
| Core AO | fully populated | 18/18 (100.0%) | 3 | 2 | _(none)_ |
| ElectroFuel | fully populated | 18/18 (100.0%) | 7 | 2 | _(none)_ |
| Elevate GLP-1 Shot | fully populated | 18/18 (100.0%) | 1 | 4 | _(none)_ |
| Gluco-Gel Plus Liquid | fully populated | 18/18 (100.0%) | 2 | 3 | _(none)_ |
| Glucogenix | fully populated | 18/18 (100.0%) | 2 | 10 | _(none)_ |
| HGH Amino Acid Blend | fully populated | 18/18 (100.0%) | 8 | 2 | _(none)_ |
| Herbal Rainforest | fully populated | 18/18 (100.0%) | 2 | 1 | _(none)_ |
| Kid Sprinklz | fully populated | 18/18 (100.0%) | 15 | 3 | _(none)_ |
| Kids Toddy Liquid | fully populated | 18/18 (100.0%) | 24 | 2 | _(none)_ |
| Life Balance Menopause Support | fully populated | 18/18 (100.0%) | 13 | 7 | _(none)_ |
| LifeFortify Flexeo Plus | fully populated | 18/18 (100.0%) | 3 | 3 | _(none)_ |
| Liquid Gluco-Gel | fully populated | 18/18 (100.0%) | 1 | 5 | _(none)_ |
| MCT Collagen Creamer | fully populated | 18/18 (100.0%) | 1 | 3 | _(none)_ |
| MSM Ultra Caplets | fully populated | 18/18 (100.0%) | 2 | 1 | _(none)_ |
| Ocutiv (Pro-line Eye) | fully populated | 18/18 (100.0%) | 5 | 8 | _(none)_ |
| Osteo Mag Liquid | fully populated | 18/18 (100.0%) | 13 | 1 | _(none)_ |
| Oxy Body Cherry Berry | fully populated | 18/18 (100.0%) | 5 | 10 | _(none)_ |
| ProCardio FX (Pro-line Cardiovascular) | fully populated | 18/18 (100.0%) | 5 | 6 | _(none)_ |
| ProJoint FX | fully populated | 18/18 (100.0%) | 6 | 3 | _(none)_ |
| Pumpkin Spice Protein Shake | fully populated | 18/18 (100.0%) | 3 | 5 | _(none)_ |
| Rebound FX (Can) | fully populated | 18/18 (100.0%) | 14 | 2 | _(none)_ |
| Rebound FX Citrus Punch (Powder) | fully populated | 18/18 (100.0%) | 15 | 6 | _(none)_ |
| Regulate GLP-1 | fully populated | 18/18 (100.0%) | 1 | 4 | _(none)_ |
| Rejuvenate Rewind Restore | fully populated | 18/18 (100.0%) | 3 | 5 | _(none)_ |
| RenuIQ | fully populated | 18/18 (100.0%) | 4 | 1 | _(none)_ |
| Sleep Eze | fully populated | 18/18 (100.0%) | 4 | 4 | _(none)_ |
| Sleep Gummy | fully populated | 18/18 (100.0%) | 1 | 1 | _(none)_ |
| Slender FX Meal Replacement Shake (French Vanilla) | fully populated | 18/18 (100.0%) | 24 | 4 | _(none)_ |
| Slender FX REV (Liquid Drops) | fully populated | 18/18 (100.0%) | 3 | 1 | _(none)_ |
| Slender FX Sweet Eze | fully populated | 18/18 (100.0%) | 2 | 6 | _(none)_ |
| Soul Stiks | fully populated | 18/18 (100.0%) | 6 | 3 | _(none)_ |
| Sta-Balanced | fully populated | 18/18 (100.0%) | 5 | 1 | _(none)_ |
| Sta-Cardio | fully populated | 18/18 (100.0%) | 6 | 4 | _(none)_ |
| Sta-Clear | fully populated | 18/18 (100.0%) | 10 | 4 | _(none)_ |
| Sta-Energized Plus | fully populated | 18/18 (100.0%) | 1 | 4 | _(none)_ |
| Sta-Restored | fully populated | 18/18 (100.0%) | 1 | 2 | _(none)_ |
| Sta-Vital | fully populated | 18/18 (100.0%) | 22 | 4 | _(none)_ |
| Strawberry Kiwi-Mins | fully populated | 18/18 (100.0%) | 1 | 2 | _(none)_ |
| Super Greens Powder | fully populated | 18/18 (100.0%) | 3 | 2 | _(none)_ |
| Synaptiv | fully populated | 18/18 (100.0%) | 10 | 4 | _(none)_ |
| Total Meal Replacement Chocolate | fully populated | 18/18 (100.0%) | 21 | 4 | _(none)_ |
| True2Life Daily Digest | fully populated | 18/18 (100.0%) | 1 | 3 | _(none)_ |
| True2Life LiverPure Kit (LiverClean component) | fully populated | 18/18 (100.0%) | 1 | 2 | _(none)_ |
| True2Life TrueCleanse | fully populated | 18/18 (100.0%) | 4 | 1 | _(none)_ |
| True2Life TrueZyme | fully populated | 18/18 (100.0%) | 5 | 3 | _(none)_ |
| US Body Balance | fully populated | 18/18 (100.0%) | 2 | 5 | _(none)_ |
| Ultimate Cardio FX | fully populated | 18/18 (100.0%) | 6 | 1 | _(none)_ |
| Ultimate Cardio Stx | fully populated | 18/18 (100.0%) | 10 | 3 | _(none)_ |
| Ultimate Classic Liquid | fully populated | 18/18 (100.0%) | 26 | 8 | _(none)_ |
| Ultimate D-Stress | fully populated | 18/18 (100.0%) | 8 | 2 | _(none)_ |
| Ultimate Daily 180 Tablets | fully populated | 18/18 (100.0%) | 23 | 4 | _(none)_ |
| Ultimate Daily Capsules | fully populated | 18/18 (100.0%) | 24 | 1 | _(none)_ |
| Ultimate Digest FX | fully populated | 18/18 (100.0%) | 1 | 2 | _(none)_ |
| Ultimate Gluco-Gel | fully populated | 18/18 (100.0%) | 1 | 2 | _(none)_ |
| Ultimate Hair, Skin & Nails | fully populated | 18/18 (100.0%) | 16 | 1 | _(none)_ |
| Ultimate Memory FX | fully populated | 18/18 (100.0%) | 12 | 3 | _(none)_ |
| Ultimate Microbiome | fully populated | 18/18 (100.0%) | 1 | 7 | _(none)_ |
| Ultimate Mineral Caps | fully populated | 18/18 (100.0%) | 1 | 2 | _(none)_ |
| Ultimate Niacin Plus | fully populated | 18/18 (100.0%) | 1 | 1 | _(none)_ |
| Ultimate Ocean's Gold | fully populated | 18/18 (100.0%) | 2 | 2 | _(none)_ |
| Ultimate Prost FX | fully populated | 18/18 (100.0%) | 2 | 11 | _(none)_ |
| Ultimate Smart FX | fully populated | 18/18 (100.0%) | 1 | 1 | _(none)_ |
| Ultimate Tangy Tangerine Liquid (UTT) | fully populated | 18/18 (100.0%) | 23 | 7 | _(none)_ |
| Ultimate Vision FX | fully populated | 18/18 (100.0%) | 6 | 2 | _(none)_ |
| Ultra Body Toddy Liquid | fully populated | 18/18 (100.0%) | 25 | 7 | _(none)_ |
| XeraFem (Pro-line Women's Hormonal) | fully populated | 18/18 (100.0%) | 8 | 6 | _(none)_ |
| ZRadical Powder Canister | fully populated | 18/18 (100.0%) | 6 | 2 | _(none)_ |
