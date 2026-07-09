# Corpus audit worklist  (GENERATED -- regenerate with `python eden/tools/corpus_audit.py`)

_The machine half of the mandatory pre-Phase-G full-corpus audit (memory: full-corpus-audit-before-phase-g). Every claim is pre-sorted into a TIER; each suspect carries a PROPOSED DISPOSITION -- a check to run, never a verdict. This file is regenerable scratch, not a sacred log._

**Total claims:** 1203  ·  **suspect:** 43  ·  **needs-a-look:** 9  ·  **likely-fine:** 1151

## By kind
- `protocol` — 363
- `mechanism` — 292
- `definition` — 218
- `deficiency_sign` — 145
- `dose` — 50
- `prevalence` — 28
- `toxicity_sign` — 26
- `prognosis` — 16
- `interaction` — 15
- `diagnostic_pattern` — 15
- `quote` — 14
- `personal_anecdote` — 12
- `contraindication` — 7
- `food_source` — 2

## By book
- `lets-play-doctor` — 481
- `rare-earths` — 302
- `immortality` — 197
- `epigenetics` — 109
- `dddl-3e-2011` — 94
- `iaiyh` — 20

## Tier 1 — SUSPECTS (review first)

**Flag tally:** `table_shaped`×32  ·  `dose_null`×7  ·  `dose_reports_rda`×4  ·  `dose_reports_intake`×3  ·  `nondose_states_dose`×2  ·  `dose_reports_toxicity`×2  ·  `dose_per_kg`×1  ·  `dose_range_high_lost`×1

- **WAL-CLM-EPIGEN-000086**  (deficiency_sign, epigenetics)
  - flags: nondose_states_dose
  - PROPOSED: non-dose claim asserts a recommended/maintenance dose -- check for a MISSED dose claim
- **WAL-CLM-IMMORT-000084**  (dose, immortality)
  - flags: dose_null, dose_reports_rda
  - PROPOSED: kind=dose but no structured amount -- structure the stated dose, OR reclassify if it is not a Wallach recommendation
- **WAL-CLM-IMMORT-000105**  (dose, immortality)
  - flags: dose_null, dose_per_kg
  - PROPOSED: kind=dose but no structured amount -- structure the stated dose, OR reclassify if it is not a Wallach recommendation
- **WAL-CLM-LETS-000045**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000046**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000047**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000048**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000049**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000050**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000051**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000052**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000053**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000054**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000055**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000056**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000057**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000058**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000059**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000060**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000061**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000062**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000063**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000064**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000065**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000066**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000067**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000068**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000069**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000070**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000071**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000072**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000073**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000074**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000075**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-LETS-000076**  (dose, lets-play-doctor)
  - flags: table_shaped
  - PROPOSED: verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim
- **WAL-CLM-RARE-000014**  (dose, rare-earths)
  - flags: dose_reports_rda
  - PROPOSED: text cites the RDA -- verify Wallach is RECOMMENDING, not merely reporting the RDA (else reclassify dose->definition)
- **WAL-CLM-RARE-000096**  (protocol, rare-earths)
  - flags: nondose_states_dose
  - PROPOSED: non-dose claim asserts a recommended/maintenance dose -- check for a MISSED dose claim
- **WAL-CLM-RARE-000146**  (dose, rare-earths)
  - flags: dose_null, dose_reports_intake, dose_reports_toxicity
  - PROPOSED: kind=dose but no structured amount -- structure the stated dose, OR reclassify if it is not a Wallach recommendation
- **WAL-CLM-RARE-000154**  (dose, rare-earths)
  - flags: dose_null
  - PROPOSED: kind=dose but no structured amount -- structure the stated dose, OR reclassify if it is not a Wallach recommendation
- **WAL-CLM-RARE-000164**  (dose, rare-earths)
  - flags: dose_null
  - PROPOSED: kind=dose but no structured amount -- structure the stated dose, OR reclassify if it is not a Wallach recommendation
- **WAL-CLM-RARE-000173**  (dose, rare-earths)
  - flags: dose_null, dose_reports_rda, dose_reports_toxicity
  - PROPOSED: kind=dose but no structured amount -- structure the stated dose, OR reclassify if it is not a Wallach recommendation
- **WAL-CLM-RARE-000180**  (dose, rare-earths)
  - flags: dose_null, dose_reports_rda, dose_reports_intake
  - PROPOSED: kind=dose but no structured amount -- structure the stated dose, OR reclassify if it is not a Wallach recommendation
- **WAL-CLM-RARE-000207**  (dose, rare-earths)
  - flags: dose_range_high_lost, dose_reports_intake
  - PROPOSED: comma-range HIGH end dropped by targets_derive._parse_amount -- fix the parser; confirm this is a real target

## Tier 2 — needs-a-look (structurally clean dose claims; confirm the target number)

- WAL-CLM-DDDL-000011  (dose, dddl-3e-2011)
- WAL-CLM-DDDL-000013  (dose, dddl-3e-2011)
- WAL-CLM-IMMORT-000140  (dose, immortality)
- WAL-CLM-IMMORT-000193  (dose, immortality)
- WAL-CLM-LETS-000077  (dose, lets-play-doctor)
- WAL-CLM-RARE-000012  (dose, rare-earths)
- WAL-CLM-RARE-000048  (dose, rare-earths)
- WAL-CLM-RARE-000090  (dose, rare-earths)
- WAL-CLM-RARE-000246  (dose, rare-earths)

## Tier 3 — likely-fine (counts only; lowest priority, still in scope)

- `protocol` — 362
- `mechanism` — 292
- `definition` — 218
- `deficiency_sign` — 144
- `prevalence` — 28
- `toxicity_sign` — 26
- `prognosis` — 16
- `interaction` — 15
- `diagnostic_pattern` — 15
- `quote` — 14
- `personal_anecdote` — 12
- `contraindication` — 7
- `food_source` — 2

_Tier 3 is enumerated by count, not per-claim: these carry no machine-detectable suspect signal. They remain in the audit's scope at the lowest priority -- the shards are the review surface once Tiers 1-2 are clear._
