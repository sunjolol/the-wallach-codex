# Condition-mapping restoration audit -- 2026-07-04 (SESSION 45)

**Trigger.** The `cross-book-duplicate-table-skip` rule -- a rule Claude hallucinated and Luneth confirmed on 2026-07-04 was NEVER his -- plus the verbatim-names remediation campaign, removed condition MAPPINGS from claims over 2026-06-27 -> 2026-07-04.

**Verified: 0 whole claims deleted** (two ways: baseline-vs-now, and max-conditions-ever-vs-now across every in-window commit). No verbatim, quote, or claim was destroyed. 63 claims lost 166 condition-mappings; this audit adjudicates every one.

**Categories.** MERGE = slug renamed out of taxonomy, still covered under the new name (leave). REHOMED = still mapped by a sibling claim in the SAME book whose verbatim names it (leave; coverage intact). RESTORE-TRIVIAL = this claim's own verbatim already names it, so it was wrongly dropped -> re-map, no verbatim change. RESTORE-EXTEND = lost from the whole book -> restore by extending the verbatim to name it.

**Decision (Luneth 2026-07-04): restore the 42 genuinely-lost mappings** (GROUP 3). GROUP 1 (merge) + GROUP 2 (rehomed) are coverage-intact and left as-is.

## GROUP 3a -- RESTORE (trivial re-map; verbatim already names it)

- WAL-CLM-EPIGEN-000038 (epigenetics): depression
- WAL-CLM-EPIGEN-000061 (epigenetics): muscle_cramps
- WAL-CLM-EPIGEN-000061 (epigenetics): osteoporosis
- WAL-CLM-EPIGEN-000062 (epigenetics): atherosclerosis
- WAL-CLM-RARE-000041 (rare-earths): violent_behavior
- WAL-CLM-RARE-000127 (rare-earths): violent_behavior
- WAL-CLM-RARE-000129 (rare-earths): blind_rage
- WAL-CLM-RARE-000129 (rare-earths): violent_behavior
- WAL-CLM-RARE-000163 (rare-earths): blind_rage
- WAL-CLM-RARE-000163 (rare-earths): violent_behavior
- WAL-CLM-RARE-000246 (rare-earths): high_cholesterol

## GROUP 3b -- RESTORE (extend verbatim to name the condition)

- WAL-CLM-EPIGEN-000002 (epigenetics): cleft_palate
- WAL-CLM-EPIGEN-000029 (epigenetics): achlorhydria
- WAL-CLM-EPIGEN-000030 (epigenetics): heartburn
- WAL-CLM-EPIGEN-000035 (epigenetics): anxiety
- WAL-CLM-EPIGEN-000035 (epigenetics): hysteria
- WAL-CLM-EPIGEN-000038 (epigenetics): flatulence
- WAL-CLM-EPIGEN-000047 (epigenetics): wounds
- WAL-CLM-EPIGEN-000061 (epigenetics): hyperparathyroidism
- WAL-CLM-EPIGEN-000061 (epigenetics): hypertension
- WAL-CLM-EPIGEN-000061 (epigenetics): scoliosis
- WAL-CLM-EPIGEN-000062 (epigenetics): oligospermia
- WAL-CLM-EPIGEN-000063 (epigenetics): glucose_intolerance
- WAL-CLM-EPIGEN-000063 (epigenetics): hyperthyroidism
- WAL-CLM-EPIGEN-000099 (epigenetics): chondromalacia
- WAL-CLM-EPIGEN-000099 (epigenetics): miscarriage
- WAL-CLM-EPIGEN-000102 (epigenetics): water_intoxication
- WAL-CLM-RARE-000096 (rare-earths): rheumatoid_arthritis
- WAL-CLM-RARE-000105 (rare-earths): bells_palsy
- WAL-CLM-RARE-000105 (rare-earths): insomnia
- WAL-CLM-RARE-000105 (rare-earths): kidney_stones
- WAL-CLM-RARE-000105 (rare-earths): panic_attacks
- WAL-CLM-RARE-000112 (rare-earths): burns
- WAL-CLM-RARE-000116 (rare-earths): adhd
- WAL-CLM-RARE-000116 (rare-earths): coronary_artery_disease
- WAL-CLM-RARE-000163 (rare-earths): adhd
- WAL-CLM-RARE-000175 (rare-earths): parkinsonism
- WAL-CLM-RARE-000276 (rare-earths): anxiety
- WAL-CLM-RARE-000276 (rare-earths): insomnia
- WAL-CLM-RARE-000277 (rare-earths): anxiety
- WAL-CLM-RARE-000277 (rare-earths): insomnia
- WAL-CLM-RARE-000284 (rare-earths): muscle_cramps

## GROUP 1 -- LEAVE (slug merge/rename; coverage intact)

- WAL-CLM-EPIGEN-000078 (epigenetics): colorectal_cancer -- claim now maps [cancer, colon_cancer]
- WAL-CLM-LETS-000219 (lets): elevated_cholesterol -- claim now maps [high_cholesterol]
- WAL-CLM-LETS-000388 (lets): premenstrual_syndrome -- claim now maps [alcoholism, dementia, depression, diabetes, hyperkinesis, hypoglycemia, learning_disabilities, organic_brain_syndrome, paranoia, pellagra, pms, schizophrenia]
- WAL-CLM-LETS-000397 (lets): peptic_ulcer -- claim now maps [peptic_ulcers]
- WAL-CLM-LETS-000402 (lets): premenstrual_syndrome -- claim now maps [pms]
- WAL-CLM-RARE-000105 (rare-earths): premenstrual_syndrome -- claim now maps NOTHING (rename not applied -> moved to RESTORE)
- WAL-CLM-RARE-000108 (rare-earths): colorectal_cancer -- claim now maps NOTHING (rename not applied -> moved to RESTORE)
- WAL-CLM-RARE-000125 (rare-earths): colorectal_cancer -- claim now maps [cancer, colon_cancer]
- WAL-CLM-RARE-000141 (rare-earths): menkes_disease -- claim now maps NOTHING (rename not applied -> moved to RESTORE)

## GROUP 2 -- LEAVE (re-homed to a sibling claim; coverage intact)

- WAL-CLM-EPIGEN-000001 (epigenetics): birth_defects -- still mapped by WAL-CLM-EPIGEN-000002, WAL-CLM-EPIGEN-000017, WAL-CLM-EPIGEN-000018
- WAL-CLM-EPIGEN-000002 (epigenetics): adhd -- still mapped by WAL-CLM-EPIGEN-000062, WAL-CLM-EPIGEN-000106
- WAL-CLM-EPIGEN-000002 (epigenetics): autism -- still mapped by WAL-CLM-EPIGEN-000096, WAL-CLM-EPIGEN-000106
- WAL-CLM-EPIGEN-000002 (epigenetics): dyslexia -- still mapped by WAL-CLM-EPIGEN-000106
- WAL-CLM-EPIGEN-000002 (epigenetics): learning_disabilities -- still mapped by WAL-CLM-EPIGEN-000062, WAL-CLM-EPIGEN-000107
- WAL-CLM-EPIGEN-000029 (epigenetics): malabsorption -- still mapped by WAL-CLM-EPIGEN-000030
- WAL-CLM-EPIGEN-000032 (epigenetics): cancer -- still mapped by WAL-CLM-EPIGEN-000031, WAL-CLM-EPIGEN-000033, WAL-CLM-EPIGEN-000043
- WAL-CLM-EPIGEN-000034 (epigenetics): fractures -- still mapped by WAL-CLM-EPIGEN-000043
- WAL-CLM-EPIGEN-000034 (epigenetics): osteoarthritis -- still mapped by WAL-CLM-EPIGEN-000031, WAL-CLM-EPIGEN-000032, WAL-CLM-EPIGEN-000086
- WAL-CLM-EPIGEN-000034 (epigenetics): osteoporosis -- still mapped by WAL-CLM-EPIGEN-000031, WAL-CLM-EPIGEN-000032
- WAL-CLM-EPIGEN-000035 (epigenetics): depression -- still mapped by WAL-CLM-EPIGEN-000031, WAL-CLM-EPIGEN-000039, WAL-CLM-EPIGEN-000042
- WAL-CLM-EPIGEN-000035 (epigenetics): multiple_sclerosis -- still mapped by WAL-CLM-EPIGEN-000015
- WAL-CLM-EPIGEN-000035 (epigenetics): peripheral_neuropathy -- still mapped by WAL-CLM-EPIGEN-000062, WAL-CLM-EPIGEN-000108
- WAL-CLM-EPIGEN-000039 (epigenetics): carpal_tunnel_syndrome -- still mapped by WAL-CLM-EPIGEN-000099, WAL-CLM-EPIGEN-000108
- WAL-CLM-EPIGEN-000039 (epigenetics): convulsions -- still mapped by WAL-CLM-EPIGEN-000032, WAL-CLM-EPIGEN-000098, WAL-CLM-EPIGEN-000099
- WAL-CLM-EPIGEN-000039 (epigenetics): hyperirritability -- still mapped by WAL-CLM-EPIGEN-000062, WAL-CLM-EPIGEN-000108
- WAL-CLM-EPIGEN-000039 (epigenetics): peripheral_neuropathy -- still mapped by WAL-CLM-EPIGEN-000062, WAL-CLM-EPIGEN-000108
- WAL-CLM-EPIGEN-000039 (epigenetics): pms -- still mapped by WAL-CLM-EPIGEN-000061, WAL-CLM-EPIGEN-000108
- WAL-CLM-EPIGEN-000039 (epigenetics): pruritus -- still mapped by WAL-CLM-EPIGEN-000108
- WAL-CLM-EPIGEN-000039 (epigenetics): seborrheic_dermatitis -- still mapped by WAL-CLM-EPIGEN-000036, WAL-CLM-EPIGEN-000108
- WAL-CLM-EPIGEN-000039 (epigenetics): tmj -- still mapped by WAL-CLM-EPIGEN-000099, WAL-CLM-EPIGEN-000108
- WAL-CLM-EPIGEN-000039 (epigenetics): tourette_syndrome -- still mapped by WAL-CLM-EPIGEN-000032, WAL-CLM-EPIGEN-000061, WAL-CLM-EPIGEN-000108
- WAL-CLM-EPIGEN-000045 (epigenetics): peripheral_neuropathy -- still mapped by WAL-CLM-EPIGEN-000062, WAL-CLM-EPIGEN-000108
- WAL-CLM-EPIGEN-000046 (epigenetics): varicose_veins -- still mapped by WAL-CLM-EPIGEN-000051, WAL-CLM-EPIGEN-000063
- WAL-CLM-EPIGEN-000047 (epigenetics): fractures -- still mapped by WAL-CLM-EPIGEN-000043
- WAL-CLM-EPIGEN-000052 (epigenetics): weight_loss -- still mapped by WAL-CLM-EPIGEN-000041, WAL-CLM-EPIGEN-000042
- WAL-CLM-EPIGEN-000053 (epigenetics): depression -- still mapped by WAL-CLM-EPIGEN-000031, WAL-CLM-EPIGEN-000039, WAL-CLM-EPIGEN-000042
- WAL-CLM-EPIGEN-000056 (epigenetics): insomnia -- still mapped by WAL-CLM-EPIGEN-000038, WAL-CLM-EPIGEN-000042
- WAL-CLM-EPIGEN-000061 (epigenetics): arthritis -- still mapped by WAL-CLM-EPIGEN-000031, WAL-CLM-EPIGEN-000032, WAL-CLM-EPIGEN-000063
- WAL-CLM-EPIGEN-000061 (epigenetics): bells_palsy -- still mapped by WAL-CLM-EPIGEN-000109
- WAL-CLM-EPIGEN-000061 (epigenetics): bone_spurs -- still mapped by WAL-CLM-EPIGEN-000032
- WAL-CLM-EPIGEN-000061 (epigenetics): convulsions -- still mapped by WAL-CLM-EPIGEN-000032, WAL-CLM-EPIGEN-000098, WAL-CLM-EPIGEN-000099
- WAL-CLM-EPIGEN-000061 (epigenetics): fractures -- still mapped by WAL-CLM-EPIGEN-000043
- WAL-CLM-EPIGEN-000061 (epigenetics): hyperirritability -- still mapped by WAL-CLM-EPIGEN-000062, WAL-CLM-EPIGEN-000108
- WAL-CLM-EPIGEN-000061 (epigenetics): insomnia -- still mapped by WAL-CLM-EPIGEN-000038, WAL-CLM-EPIGEN-000042
- WAL-CLM-EPIGEN-000061 (epigenetics): kidney_stones -- still mapped by WAL-CLM-EPIGEN-000032
- WAL-CLM-EPIGEN-000061 (epigenetics): neuropathy -- still mapped by WAL-CLM-EPIGEN-000036, WAL-CLM-EPIGEN-000040, WAL-CLM-EPIGEN-000109
- WAL-CLM-EPIGEN-000061 (epigenetics): osteoarthritis -- still mapped by WAL-CLM-EPIGEN-000031, WAL-CLM-EPIGEN-000032, WAL-CLM-EPIGEN-000086
- WAL-CLM-EPIGEN-000061 (epigenetics): osteomalacia -- still mapped by WAL-CLM-EPIGEN-000031
- WAL-CLM-EPIGEN-000061 (epigenetics): panic_attacks -- still mapped by WAL-CLM-EPIGEN-000109
- WAL-CLM-EPIGEN-000061 (epigenetics): periodontal_disease -- still mapped by WAL-CLM-EPIGEN-000032
- WAL-CLM-EPIGEN-000061 (epigenetics): tetany -- still mapped by WAL-CLM-EPIGEN-000032, WAL-CLM-EPIGEN-000098
- WAL-CLM-EPIGEN-000061 (epigenetics): trigeminal_neuralgia -- still mapped by WAL-CLM-EPIGEN-000109
- WAL-CLM-EPIGEN-000062 (epigenetics): explosive_outbursts -- still mapped by WAL-CLM-EPIGEN-000107
- WAL-CLM-EPIGEN-000063 (epigenetics): blind_rage -- still mapped by WAL-CLM-EPIGEN-000107
- WAL-CLM-EPIGEN-000063 (epigenetics): cerebral_palsy -- still mapped by WAL-CLM-EPIGEN-000002, WAL-CLM-EPIGEN-000107
- WAL-CLM-EPIGEN-000063 (epigenetics): congenital_ataxia -- still mapped by WAL-CLM-EPIGEN-000099, WAL-CLM-EPIGEN-000107
- WAL-CLM-EPIGEN-000063 (epigenetics): criminal_behavior -- still mapped by WAL-CLM-EPIGEN-000107
- WAL-CLM-EPIGEN-000063 (epigenetics): explosive_outbursts -- still mapped by WAL-CLM-EPIGEN-000107
- WAL-CLM-EPIGEN-000063 (epigenetics): high_cholesterol -- still mapped by WAL-CLM-EPIGEN-000062, WAL-CLM-EPIGEN-000107
- WAL-CLM-EPIGEN-000063 (epigenetics): hypoglycemia -- still mapped by WAL-CLM-EPIGEN-000003, WAL-CLM-EPIGEN-000062, WAL-CLM-EPIGEN-000107
- WAL-CLM-EPIGEN-000063 (epigenetics): hypothyroidism -- still mapped by WAL-CLM-EPIGEN-000093
- WAL-CLM-EPIGEN-000063 (epigenetics): learning_disabilities -- still mapped by WAL-CLM-EPIGEN-000062, WAL-CLM-EPIGEN-000107
- WAL-CLM-EPIGEN-000063 (epigenetics): neutropenia -- still mapped by WAL-CLM-EPIGEN-000107
- WAL-CLM-EPIGEN-000063 (epigenetics): reactive_hypoglycemia -- still mapped by WAL-CLM-EPIGEN-000003, WAL-CLM-EPIGEN-000062, WAL-CLM-EPIGEN-000107
- WAL-CLM-EPIGEN-000063 (epigenetics): violent_behavior -- still mapped by WAL-CLM-EPIGEN-000107
- WAL-CLM-EPIGEN-000083 (epigenetics): tachycardia -- still mapped by WAL-CLM-EPIGEN-000038
- WAL-CLM-EPIGEN-000096 (epigenetics): adhd -- still mapped by WAL-CLM-EPIGEN-000062, WAL-CLM-EPIGEN-000106
- WAL-CLM-EPIGEN-000096 (epigenetics): hyperactivity -- still mapped by WAL-CLM-EPIGEN-000062
- WAL-CLM-EPIGEN-000099 (epigenetics): infertility -- still mapped by WAL-CLM-EPIGEN-000031, WAL-CLM-EPIGEN-000033, WAL-CLM-EPIGEN-000062
- WAL-CLM-LETS-000008 (lets): dermatitis -- still mapped by WAL-CLM-LETS-000004, WAL-CLM-LETS-000007, WAL-CLM-LETS-000011
- WAL-CLM-RARE-000010 (rare-earths): cystic_fibrosis -- still mapped by WAL-CLM-RARE-000004, WAL-CLM-RARE-000049, WAL-CLM-RARE-000269
- WAL-CLM-RARE-000011 (rare-earths): arthritis -- still mapped by WAL-CLM-RARE-000081, WAL-CLM-RARE-000086, WAL-CLM-RARE-000096
- WAL-CLM-RARE-000099 (rare-earths): osteoporosis -- still mapped by WAL-CLM-RARE-000011, WAL-CLM-RARE-000082, WAL-CLM-RARE-000086
- WAL-CLM-RARE-000105 (rare-earths): arthritis -- still mapped by WAL-CLM-RARE-000081, WAL-CLM-RARE-000086, WAL-CLM-RARE-000096
- WAL-CLM-RARE-000105 (rare-earths): hypertension -- still mapped by WAL-CLM-RARE-000086, WAL-CLM-RARE-000107, WAL-CLM-RARE-000206
- WAL-CLM-RARE-000105 (rare-earths): osteoporosis -- still mapped by WAL-CLM-RARE-000011, WAL-CLM-RARE-000082, WAL-CLM-RARE-000086
- WAL-CLM-RARE-000105 (rare-earths): tetany -- still mapped by WAL-CLM-RARE-000172
- WAL-CLM-RARE-000108 (rare-earths): colon_cancer -- still mapped by WAL-CLM-RARE-000125
- WAL-CLM-RARE-000116 (rare-earths): bipolar_disorder -- still mapped by WAL-CLM-RARE-000029, WAL-CLM-RARE-000161, WAL-CLM-RARE-000163
- WAL-CLM-RARE-000116 (rare-earths): blind_rage -- still mapped by WAL-CLM-RARE-000302
- WAL-CLM-RARE-000116 (rare-earths): criminal_behavior -- still mapped by WAL-CLM-RARE-000041, WAL-CLM-RARE-000126, WAL-CLM-RARE-000302
- WAL-CLM-RARE-000116 (rare-earths): depression -- still mapped by WAL-CLM-RARE-000160, WAL-CLM-RARE-000161, WAL-CLM-RARE-000163
- WAL-CLM-RARE-000116 (rare-earths): diabetes -- still mapped by WAL-CLM-RARE-000077, WAL-CLM-RARE-000081, WAL-CLM-RARE-000118
- WAL-CLM-RARE-000116 (rare-earths): explosive_outbursts -- still mapped by WAL-CLM-RARE-000127, WAL-CLM-RARE-000302
- WAL-CLM-RARE-000116 (rare-earths): hyperactivity -- still mapped by WAL-CLM-RARE-000163, WAL-CLM-RARE-000215
- WAL-CLM-RARE-000116 (rare-earths): hyperinsulinemia -- still mapped by WAL-CLM-RARE-000257
- WAL-CLM-RARE-000116 (rare-earths): hyperirritability -- still mapped by WAL-CLM-RARE-000237
- WAL-CLM-RARE-000116 (rare-earths): hypoglycemia -- still mapped by WAL-CLM-RARE-000254, WAL-CLM-RARE-000257, WAL-CLM-RARE-000302
- WAL-CLM-RARE-000116 (rare-earths): infertility -- still mapped by WAL-CLM-RARE-000163, WAL-CLM-RARE-000176, WAL-CLM-RARE-000185
- WAL-CLM-RARE-000116 (rare-earths): learning_disabilities -- still mapped by WAL-CLM-RARE-000215, WAL-CLM-RARE-000302
- WAL-CLM-RARE-000116 (rare-earths): peripheral_neuropathy -- still mapped by WAL-CLM-RARE-000237
- WAL-CLM-RARE-000116 (rare-earths): violent_behavior -- still mapped by WAL-CLM-RARE-000302
- WAL-CLM-RARE-000122 (rare-earths): blind_rage -- still mapped by WAL-CLM-RARE-000302
- WAL-CLM-RARE-000122 (rare-earths): cerebral_palsy -- still mapped by WAL-CLM-RARE-000123, WAL-CLM-RARE-000302
- WAL-CLM-RARE-000122 (rare-earths): criminal_behavior -- still mapped by WAL-CLM-RARE-000041, WAL-CLM-RARE-000126, WAL-CLM-RARE-000302
- WAL-CLM-RARE-000122 (rare-earths): explosive_outbursts -- still mapped by WAL-CLM-RARE-000127, WAL-CLM-RARE-000302
- WAL-CLM-RARE-000122 (rare-earths): high_cholesterol -- still mapped by WAL-CLM-RARE-000257, WAL-CLM-RARE-000302
- WAL-CLM-RARE-000122 (rare-earths): hypoglycemia -- still mapped by WAL-CLM-RARE-000254, WAL-CLM-RARE-000257, WAL-CLM-RARE-000302
- WAL-CLM-RARE-000122 (rare-earths): learning_disabilities -- still mapped by WAL-CLM-RARE-000215, WAL-CLM-RARE-000302
- WAL-CLM-RARE-000122 (rare-earths): neutropenia -- still mapped by WAL-CLM-RARE-000302
- WAL-CLM-RARE-000122 (rare-earths): violent_behavior -- still mapped by WAL-CLM-RARE-000302
- WAL-CLM-RARE-000123 (rare-earths): congenital_ataxia -- still mapped by WAL-CLM-RARE-000176
- WAL-CLM-RARE-000127 (rare-earths): blind_rage -- still mapped by WAL-CLM-RARE-000302
- WAL-CLM-RARE-000127 (rare-earths): hyperirritability -- still mapped by WAL-CLM-RARE-000237
- WAL-CLM-RARE-000128 (rare-earths): blind_rage -- still mapped by WAL-CLM-RARE-000302
- WAL-CLM-RARE-000128 (rare-earths): explosive_outbursts -- still mapped by WAL-CLM-RARE-000127, WAL-CLM-RARE-000302
- WAL-CLM-RARE-000128 (rare-earths): violent_behavior -- still mapped by WAL-CLM-RARE-000302
- WAL-CLM-RARE-000129 (rare-earths): explosive_outbursts -- still mapped by WAL-CLM-RARE-000127, WAL-CLM-RARE-000302
- WAL-CLM-RARE-000162 (rare-earths): depression -- still mapped by WAL-CLM-RARE-000160, WAL-CLM-RARE-000161, WAL-CLM-RARE-000163
- WAL-CLM-RARE-000165 (rare-earths): criminal_behavior -- still mapped by WAL-CLM-RARE-000041, WAL-CLM-RARE-000126, WAL-CLM-RARE-000302
- WAL-CLM-RARE-000165 (rare-earths): violent_behavior -- still mapped by WAL-CLM-RARE-000302
- WAL-CLM-RARE-000172 (rare-earths): arteriosclerosis -- still mapped by WAL-CLM-RARE-000202
- WAL-CLM-RARE-000178 (rare-earths): carpal_tunnel_syndrome -- still mapped by WAL-CLM-RARE-000176, WAL-CLM-RARE-000177
- WAL-CLM-RARE-000178 (rare-earths): repetitive_motion_syndrome -- still mapped by WAL-CLM-RARE-000176, WAL-CLM-RARE-000177
- WAL-CLM-RARE-000189 (rare-earths): heat_stroke -- still mapped by WAL-CLM-RARE-000003, WAL-CLM-RARE-000027
- WAL-CLM-RARE-000213 (rare-earths): lead_poisoning -- still mapped by WAL-CLM-RARE-000211, WAL-CLM-RARE-000212, WAL-CLM-RARE-000214
- WAL-CLM-RARE-000215 (rare-earths): lead_poisoning -- still mapped by WAL-CLM-RARE-000211, WAL-CLM-RARE-000212, WAL-CLM-RARE-000214
- WAL-CLM-RARE-000218 (rare-earths): cancer -- still mapped by WAL-CLM-RARE-000011, WAL-CLM-RARE-000077, WAL-CLM-RARE-000086
- WAL-CLM-RARE-000234 (rare-earths): peripheral_neuropathy -- still mapped by WAL-CLM-RARE-000237
- WAL-CLM-RARE-000238 (rare-earths): peripheral_neuropathy -- still mapped by WAL-CLM-RARE-000237
- WAL-CLM-RARE-000256 (rare-earths): cardiovascular_disease -- still mapped by WAL-CLM-RARE-000245, WAL-CLM-RARE-000257
- WAL-CLM-RARE-000256 (rare-earths): high_cholesterol -- still mapped by WAL-CLM-RARE-000257, WAL-CLM-RARE-000302
- WAL-CLM-RARE-000278 (rare-earths): depression -- still mapped by WAL-CLM-RARE-000160, WAL-CLM-RARE-000161, WAL-CLM-RARE-000163
- WAL-CLM-RARE-000286 (rare-earths): hypertension -- still mapped by WAL-CLM-RARE-000086, WAL-CLM-RARE-000107, WAL-CLM-RARE-000206
