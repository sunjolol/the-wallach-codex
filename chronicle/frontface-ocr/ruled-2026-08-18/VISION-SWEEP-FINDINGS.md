# Engine 2 — full 70 vision sweep · findings (staged, no front-face)

_2026-08-18. All 70 sealed unverified-book ruled claims page-read against their source images. **55 clean · 14 with OCR defects · 1 unverifiable.** Nothing applied: source corrections + the verified.json/front-face flip both wait for your ruling._

Method: 12 vision agents rendered each page (dual-monitor crop for epig/immort, PyMuPDF for the PDFs) and char-diffed each whole verbatim against the image — the §3 ground-truth standard (corroboration only ranked). IMMORT-000481 + RARE-000403 hand-checked after the fleet.

## Defects to correct (your review → source-fix + resnap + re-seal)

Each is an OCR error in the SEALED verbatim (the page is right). Correcting means fixing the book `.txt` span, resnapping, re-sealing — a corpus change, so staged for you.

### WAL-CLM-EPIGEN-000480
- `weird-char` — ours: **Aloe vera - burns** → page: **Aloe vera – burns**
- corrected (page text): “Specific remedies from the Ebers Papyrus include:  Aloe vera – burns, gastric ulcers, skin disorders and allergies”
- _page prints en dash –, verbatim has plain hyphen -; confirmed at 8x zoom_

### WAL-CLM-EPIGEN-000469
- `wrong-word` — ours: **lodine** → page: **Iodine**
- corrected (page text): “Calcium deficiency caused osteomalacia in children and arthritis, and osteoporosis and kidney stones in adults. Iodine and copper deficiency produced anemia, varicose veins, aneurysms, miscarriages, and goiter in adults.”
- _page 478 begins the sentence with capital-I 'Iodine'; verbatim has lowercase-l 'lodine' (OCR I/l swap), confirmed at 8x zoom_

### WAL-CLM-EPIGEN-000465
- `wrong-word` — ours: **muscle tendemess** → page: **muscle tenderness**
- corrected (page text): “In young adults, selenium deficiency appears as anemia, chronic fatigue, Wilson's syndrome (hypothyroidism), liver cirrhosis, muscular weakness, myalgia, muscle tenderness, fibromyalgia, lupus, pancreatitis, infertility, muscular”
- _OCR rn->m: page prints 'tenderness', verbatim has 'tendemess'; rest matches_

### WAL-CLM-EPIGEN-000479
- `dropped-letter` — ours: **alled “Lydia Pinkums’** → page: **called “Lydia Pinkums’**
- `wrong-word` — ours: **amenorthea** → page: **amenorrhea**
- corrected (page text): “Others were old family recipes that worked, such as that produced by Lydia Pinkums called “Lydia Pinkums’ Vegetable and Herbal Extract for Women’s Complaints,” which was marketed in newspapers for PMS, dysmenorrhea, amenorrhea,   menopausal symptoms, and infertility.  Pinkums was a Quaker missionary and had used an ancient Native American herbal recipe as the basis of her patent medicine that was ”
- _confirmed on 8x left-page zoom: page prints 'called' (verbatim dropped the c) and 'amenorrhea' (verbatim has 'amenorthea'); 'magazine adds' is genuine source text, not a defect_

### WAL-CLM-HELLS-000097
- `weird-char` — ours: **essential fatty acids _ elevated total** → page: **essential fatty acids   elevated total (column gap, no underscore)**
- corrected (page text): “Nutritional deficiencies associated with the Metabolic Syndrome Nutrient Deficiency Clinical disease Omega -3 essential fatty acids elevated total cholesterol, elevated LDL, obesity, peripheral neuropathies, thrombotic disease, atherosclerosis Calcium hypertension, osteoporosis, peripheral neuropathies, insomnia, pica, obesity Chromium, vanadium diabetes, insulin resistance, hyperinsulinemia, hypo”
- _table content matches page 239 (pdf 255); the lone '_' is a table-column-separator artifact not on the page_

### WAL-CLM-IMMORT-000479
- `spacing` — ours: **damage. Highintakes** → page: **damage. High intakes**
- `wrong-word` — ours: **lining of the Posty cataracts** → page: **lining of the artery), cataracts**
- `wrong-word` — ours: **dementias, eainiiple sclerosis** → page: **dementias, multiple sclerosis**
- corrected (page text): “Selenium also functions to protect cellular and organelle bi-lipid layer membranes from oxidative damage. High intakes of vegetable oils, including salad dressing and cooking oils, concurrent with a selenium deficiency is the quickest route to a cardiomyopathy heart attack, arteriosclerosis (build up of plaque in the arteries resulting from free radical damage to the “intima” or lining of the arte”
- _right page 207; 'Posty'->'artery),' (missing close paren) and 'eainiiple'->'multiple' are OCR garble; 'Highintakes' missing a space_

### WAL-CLM-IMMORT-000486
- `weird-char` — ours: **it was mixed,,** → page: **it was mixed,**
- `weird-char` — ours: **And so with:** → page: **And so with**
- `weird-char` — ours: **“culinary” ashes,,** → page: **“culinary” ashes,**
- `weird-char` — ours: **unknowingly acquired|** → page: **unknowingly acquired**
- corrected (page text): “salt was not squandered by simply eating it, it was mixed, “cut” and diluted with wood, peat or kelp ashes. And so with the simple act of “extending” salt with “culinary” ashes, humans, from the beginning of time, unknowingly acquired the 60 essential minerals daily as a food supplement.”
- _gutter-scan artifacts: doubled commas, a stray colon and a pipe char at the line-ends near the bound edge; printed bold text reads cleanly_

### WAL-CLM-IMMORT-000492
- `spacing` — ours: **bea** → page: **be a**
- corrected (page text): “Juniper ash proves to be a good source of dietary calcium, iron and a moderate source of magnesium. One teaspoon of juniper ash provides the equivalent calcium levels found in one cup of milk; it supplies 28% of the RDA for iron and nine percent of the RDA for magnesium.”
- _Page reads 'proves to be a good source' (two words); verbatim collapsed to 'bea'. Rest matches._

### WAL-CLM-IMMORT-000507
- `spacing` — ours: **exc ellent** → page: **excellent**
- corrected (page text): “Doctors practicing in Hunza today have concluded that the main cause of premature death amongst the Hunzakut people is from accidents, from landslides or falls from the shear rock walls. Infant mortality from infectious diseases have been reported; however, the average individual surviving past one year of age lives beyond the age of eighty, in excellent health and significant numbers live into th”
- _Page prints 'in excellent health' as one word; verbatim has spurious intra-word space 'exc ellent'. Rest matches (zoom-confirmed)._

### WAL-CLM-IMMORT-000495
- `missing-text` — ours: **xanthines, caffeine,
tannins, polyphenols** → page: **xanthines, caffeine, theobromine,
tannins, polyphenols**
- `missing-text` — ours: **vitamin C. The
credited with significant** → page: **vitamin C. The catechins in green tea are the antioxidants
credited with significant**
- corrected (page text): “Green tea contains xanthines, caffeine, theobromine, tannins, polyphenols, catechins, flavonoids, oils and fats and vitamin C. The catechins in green tea are the antioxidants credited with significant anti-cancer activity (can reduce risk of cancer by as much as 90%). Catechins are 100 times more potent than vitamin C and 25 times more potent than vitamin E in neutralizing free”
- _left page 414; verbatim dropped 'theobromine,' and the phrase 'catechins in green tea are the antioxidants' (confirmed at 8x zoom)_

### WAL-CLM-IMMORT-000513
- `weird-char` — ours: **Anandaminde_ is** → page: **Anandaminde is**
- `missing-text` — ours: **Anandaminde_ is found** → page: **Anandaminde is another neurotransmitter found**
- corrected (page text): “Anandaminde is another neurotransmitter found in chocolate. This phytochemical targets the same brain structures that are targeted by the active ingredient in marijuana - THC.”
- _verbatim dropped 'another neurotransmitter' and has a stray underscore; p.420 left column_

### WAL-CLM-IMMORT-000516
- `spacing` — ours: **Large q uantities of PEA** → page: **Large quantities of PEA**
- corrected (page text): “An important phytochemical found in chocolate is phenylethylamine (PEA), this neurotransmitter stimulates the body’s pleasure centers. Large quantities of PEA are associated with feelings of excitement, attraction and sexual pleasure. It is the affects of the PEA in chocolate that has caused chocolate to be given as a traditional seductive gift for Valentine’s Day,”
- _page prints 'quantities' as one word; rest matches incl. Wallach's 'affects'; p.420 left column_

### WAL-CLM-IMMORT-000487
- `subscript` — ours: **Deficiency of B, produces** → page: **Deficiency of B₆ produces**
- `wrong-word` — ours: **with Isoniazid** → page: **with Isonazid**
- corrected (page text): “Deficiency of B6 produces depression, nausea, vomiting, seborrheic dermatitis, mucus membrane lesions, peripheral neuritis, ataxia, hyperacusis, hyperirritability, altered mobility and alertness, abnormal head movements and convulsions.  Treatment of tuberculosis patients with Isonazid produces an antagonistic reaction against pyridoxine function which then results in the classical symptoms of def”
- _B subscript-6 mis-OCR'd as 'B,'; page spells the drug 'Isonazid' (verbatim added an i); p.65 right column, confirmed at 8x_

### WAL-CLM-RARE-000404
- `wrong-word` — ours: **ULCER CAUSE: the National Institutes** → page: **ULCER CAUSE: The National Institutes**
- corrected (page text): “ULCER CAUSE: The National Institutes of Health has confirmed that peptic ulcers can be caused by a bacterium and drug therapy can prevent a recurrence in 90% of cases. An NIH panel stated Wednesday that Helicobacter pylori plays a significant role in causing peptic ulcer, which can be cured with a combination of bismuth, tetracycline and metronidazole.”
- _Page prints capital 'The National Institutes'; verbatim has lowercase 'the'. Rest matches byte-for-byte on p311 (printed 289)._

## Two that need a judgment call (not plain OCR fixes)

- **WAL-CLM-IMMORT-000487** — our verbatim reads **Isoniazid** (the correct drug name); the page prints **Isonazid** (a book typo). Byte-exactness says match the page; sense says keep Isoniazid. A [[ratified-divergences-ledger]] call.

- **WAL-CLM-EPIGEN-000480** — ours has a plain hyphen `-`; the page uses an en-dash `–`. Cosmetic; correct or leave.

- **Dropped text (substantive):** IMMORT-000495 lost “theobromine,” and “catechins in green tea are the antioxidants”; IMMORT-000513 lost “another neurotransmitter”. These change meaning — the corrected verbatims restore the page text.

## Clean — page-verified (55)

These match their page byte-for-byte. Ready to move into `verified.json::claims_verified` (→ front-faceable) **on your say-so** — I have not flipped them.

By book: EPIGEN 12, HELLS 2, IMMORT 37, LETS 3, RARE 1.

<details><summary>clean ids</summary>

`WAL-CLM-EPIGEN-000466`, `WAL-CLM-EPIGEN-000467`, `WAL-CLM-EPIGEN-000468`, `WAL-CLM-EPIGEN-000470`, `WAL-CLM-EPIGEN-000471`, `WAL-CLM-EPIGEN-000472`, `WAL-CLM-EPIGEN-000473`, `WAL-CLM-EPIGEN-000474`, `WAL-CLM-EPIGEN-000475`, `WAL-CLM-EPIGEN-000476`, `WAL-CLM-EPIGEN-000477`, `WAL-CLM-EPIGEN-000478`, `WAL-CLM-HELLS-000098`, `WAL-CLM-HELLS-000099`, `WAL-CLM-IMMORT-000478`, `WAL-CLM-IMMORT-000480`, `WAL-CLM-IMMORT-000481`, `WAL-CLM-IMMORT-000482`, `WAL-CLM-IMMORT-000483`, `WAL-CLM-IMMORT-000484`, `WAL-CLM-IMMORT-000485`, `WAL-CLM-IMMORT-000488`, `WAL-CLM-IMMORT-000489`, `WAL-CLM-IMMORT-000490`, `WAL-CLM-IMMORT-000491`, `WAL-CLM-IMMORT-000493`, `WAL-CLM-IMMORT-000494`, `WAL-CLM-IMMORT-000496`, `WAL-CLM-IMMORT-000497`, `WAL-CLM-IMMORT-000498`, `WAL-CLM-IMMORT-000499`, `WAL-CLM-IMMORT-000500`, `WAL-CLM-IMMORT-000501`, `WAL-CLM-IMMORT-000502`, `WAL-CLM-IMMORT-000503`, `WAL-CLM-IMMORT-000504`, `WAL-CLM-IMMORT-000505`, `WAL-CLM-IMMORT-000506`, `WAL-CLM-IMMORT-000508`, `WAL-CLM-IMMORT-000509`, `WAL-CLM-IMMORT-000510`, `WAL-CLM-IMMORT-000511`, `WAL-CLM-IMMORT-000512`, `WAL-CLM-IMMORT-000514`, `WAL-CLM-IMMORT-000515`, `WAL-CLM-IMMORT-000517`, `WAL-CLM-IMMORT-000518`, `WAL-CLM-IMMORT-000519`, `WAL-CLM-IMMORT-000520`, `WAL-CLM-IMMORT-000521`, `WAL-CLM-IMMORT-000522`, `WAL-CLM-LETS-000522`, `WAL-CLM-LETS-000523`, `WAL-CLM-LETS-000524`, `WAL-CLM-RARE-000405`

</details>

## Unverifiable (1)

- **WAL-CLM-RARE-000403** — UNVERIFIABLE: the Mg/multi-mineral deficiency list (Low back/Bell's Palsy/NSH/Osteofibrosis/Tetany/Complicating factors) is not in the PDF text layer; corroboration mislocated to p510 (bibliography). Rendered p351/p485 by hand — not there either. Needs a targeted manual page-read of the rare-earths deficiency tables.