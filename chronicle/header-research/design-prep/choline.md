# Choline — design-prep build sheet
> Source materials for chronicle/header-research/choline.md. Byte-verified from sealed claims (`_packs/choline.json`, 14 claims). NOT a design — concept choice + layout stay open for Luneth.
>
> ★ Every «guillemet» string below is a BYTE-EXACT CONTIGUOUS SUBSTRING of the cited claim's `verbatim`. Multi-line substrings preserve the source line break literally. Apostrophe/quote glyphs are copied as-is — note the **mixed apostrophes**: EPIGEN-000044 uses a STRAIGHT `'` (Alzheimer's), RARE-000242 uses a CURLY `’` on Alzheimer’s but a STRAIGHT `'` on Huntington's, and IMMORT-000226 uses CURLY `“ ”` throughout.

## Entity-copy draft (ready to slot into dashboard/assets/data/entity-copy.json under "choline")
- **lede** (PROPOSAL): "The B-vitamin behind lecithin and the memory signal — a structural brick in every cell membrane and lung surfactant, and the raw material your nerves build acetylcholine from, which is why Wallach ties a shortage to both a fatty liver and a failing memory."  [grounded: WAL-CLM-EPIGEN-000044 for the roles + the liver/brain deficiency list]
  - ⚠ GROUNDING CAVEAT: the membrane / surfactant / acetylcholine / sphingomyelin roles live ONLY in EPIGEN-000044's `claim_text` (summary). That claim's `verbatim` is the deficiency LIST alone. The lede is our own shipped-voice prose (allowed), but do NOT convert any phrase of it into a pull-quote by this ID — the corpus has no verbatim stating the acetylcholine mechanism in Wallach's words.
  - Alt lede on file (dossier §3 #2, dose-gulf-forward): "A B-vitamin you need only in milligrams to stay well — yet the one Wallach dispenses by the gram when the brain is failing, because it builds both the lecithin in your cell membranes and acetylcholine, the nerve's memory signal." [same EPIGEN-000044 caveat; mg from EPIGEN-000124, gram-scale from RARE-000242]. Lede choice stays open for Luneth.
- **why** (PROPOSAL): "The 100 mg/day target is the upper bound of Wallach's own choline range in the Epigenetics daily multiple vitamin-and-mineral program — 10–100 mg/day. The derive simply takes the ceiling of the stated range; choline is dosed in milligrams, so there is no IU conversion and no body-weight scaling. Worth knowing: 100 mg is only the maintenance figure — an older book lists a higher 600 mg 'True Supplement Need,' and Wallach's therapeutic doses run far higher still, up to 20 grams a day for his brain- and muscle-disease protocols. The card keeps you topped up; it is not the dose he treats disease with."  [source_claim_id: WAL-CLM-EPIGEN-000124 · provenance: original_low 10, original_high 100, unit mg, upper_taken 100 · NO IU factor · NO weight scale. Historical 600 mg = WAL-CLM-LETS-000048. Therapeutic 20 g = WAL-CLM-RARE-000242.]
  - target.kind = `wallach` (numeric, 100 mg) — provenance chain is clean, no honest-gap needed.

## Per-concept build materials

### Concept A — "Two jobs, one molecule" (dual-role identity)
- **Exact quotes available**
  - ⚠ NONE for the dual-role mechanism itself. The membrane / lung-surfactant / acetylcholine / sphingomyelin identity that this whole concept rests on is CLAIM_TEXT-ONLY in WAL-CLM-EPIGEN-000044; its verbatim is the deficiency list, reproduced under Concept C. There is NO verbatim in the pack stating "choline builds acetylcholine" or "phosphatidylcholine is in every cell membrane." Present this concept's roles as sealed-claim MATERIAL (labeled illustration), never as a pull-quote.
  - Delivery-form quote that IS verbatim-backed (the lecithin = phosphatidylcholine link) — WAL-CLM-LETS-000130:
    - WAL-CLM-LETS-000130 — «Lecithin at 2,500 mg t.i.d. is
very useful at all stages (phosphatydil choline
is more efficient)»
    - WAL-CLM-LETS-000130 — «phosphatydil choline
is more efficient»  (NB: source misspells "phosphatidyl" as "phosphatydil" — copy as-is)
- **Numbers** — none are core to this concept. If the delivery-form dose is shown: 2,500 mg · t.i.d. · verbatim-backed by WAL-CLM-LETS-000130 («Lecithin at 2,500 mg t.i.d.»).
- **Figure label text** (candidate display strings — final copy OPEN):
  - STRUCTURE lane payoff — "lecithin — every cell membrane, lung surfactant"  [role from EPIGEN-000044 claim_text; NOT a quote]
  - SIGNAL lane payoff — "acetylcholine — the memory signal"  [role from EPIGEN-000044 claim_text; NOT a quote]
  - Fork origin — "Choline"  [entity name]
- **Structure notes** — one origin node forking into two labeled endpoints (a structure lane + a signal lane); "few elements, one fork." The dual-role idea is sound and claim-backed, but every word of it is summary-sourced — safe only as annotation, never as Wallach's quoted words.

### Concept B — "Milligrams to keep, grams to treat" (the dose gulf) — DOSSIER-RECOMMENDED LEAD
This is the concept the trap-check most protects. The dossier's ramp lists 8 rungs; **3 of them are NOT backed by the verbatim of the claim the dossier cited.** Below, each rung is marked SAFE (the number is a byte-exact quote from the cited verbatim) or TRAP (number is claim_text-only in the cited claim — must be re-cited or shown as a plain label, never as a quote).
- **Exact quotes available (SAFE rungs — number present in the cited verbatim):**
  - WAL-CLM-EPIGEN-000124 — «Choline 10 - 100 mg»   (maintenance; note single spaces around the hyphen: `10 - 100`)
  - WAL-CLM-EPIGEN-000124 — «10 - 100 mg»
  - WAL-CLM-LETS-000159 — «choline at 250 mg b.i.d.»   (bipolar)
  - WAL-CLM-LETS-000220 — «choline at 500
mg/day»   (chorea; the number wraps across a line break in the source)
  - WAL-CLM-LETS-000243 — «choline at 500-1,000 mg/day»   (dementia)
  - WAL-CLM-LETS-000120 — «choline 4 gm/day»   (absence attacks — this is the ONLY verbatim-backed home of the "4 gram" figure)
  - WAL-CLM-LETS-000120 — «Treatment should include choline 4 gm/day;»
  - WAL-CLM-RARE-000242 — «20 G per day»   (therapeutic ceiling — the ONLY verbatim-backed home of the "20 gram" figure)
  - WAL-CLM-RARE-000242 — «treatment requires 20 G per day»
  - WAL-CLM-LETS-000130 — «piracetam/choline
1.6 grams q.i.d.»   (Alzheimer's; 1.6 g four-times-daily — a genuine verbatim rung the dossier did not list)
- **TRAP rungs (do NOT quote — see Trap resolutions):**
  - 150 mg "headache" — cited to WAL-CLM-LETS-000293 in the dossier, but that verbatim contains NEITHER "choline" NOR "150"; it truncates at "betaine HCl at 75-200 mg". Claim_text-only. Cannot be shown as a Wallach choline quote from any verbatim. (The token "150 mg" DOES appear in WAL-CLM-LETS-000048's verbatim — but there it is the government RDA column Wallach reprints to ARGUE AGAINST, not a headache dose. Do not conflate.)
  - epilepsy 4 g — cited to WAL-CLM-LETS-000267, but that verbatim contains no "choline" and no "4"; it truncates at "zinc at 50 mg t.i.d". Claim_text-only. If the ramp wants a "4 gram" rung, quote it from WAL-CLM-LETS-000120 (absence attacks) instead.
  - "soy lecithin 10–20 grams" (MD/Keshan) — cited to WAL-CLM-LETS-000373, but that verbatim covers only selenium + vitamin E and truncates before choline; no "choline", no "10-20", no "grams". Claim_text-only. If the ramp wants a "20 gram" rung, quote it from WAL-CLM-RARE-000242 («20 G per day») instead.
- **Numbers** (value · unit · VERBATIM-backed claim id · note):
  - 10–100 · mg/day · WAL-CLM-EPIGEN-000124 · maintenance ceiling = the 100 mg card target.
  - 250 · mg (b.i.d.) · WAL-CLM-LETS-000159 · bipolar.
  - 500 · mg/day · WAL-CLM-LETS-000220 · chorea.
  - 500–1,000 · mg/day · WAL-CLM-LETS-000243 · dementia.
  - 1.6 · grams (q.i.d.) · WAL-CLM-LETS-000130 · Alzheimer's (piracetam/choline).
  - 4 · gm/day · WAL-CLM-LETS-000120 · absence attacks — USE THIS ID for any "4 g" rung, NOT LETS-000267.
  - 20 · G/day · WAL-CLM-RARE-000242 · therapeutic — USE THIS ID for any "20 g" rung, NOT LETS-000373.
  - 600 · mg/day · WAL-CLM-LETS-000048 · historical "True Supplement Need" (1995) — verbatim-backed («600 mg») but a COMPETING maintenance number; keep off the maintenance rung (card is 100 mg). Surface only as "historical" if at all.
  - ✗ 150 mg (headache) — claim_text-only, NO verbatim. Do not display as a quote.
- **Figure label text** (candidate rung labels — the safe, verbatim-grounded ramp; final copy/order OPEN):
  - "10–100 mg — daily maintenance"  [EPIGEN-000124]
  - "250 mg 2×/day — bipolar"  [LETS-000159]
  - "500 mg/day — chorea"  [LETS-000220]
  - "500–1,000 mg/day — dementia"  [LETS-000243]
  - "1.6 g 4×/day — Alzheimer's"  [LETS-000130]
  - "4 g/day — absence seizures"  [LETS-000120]
  - "20 g/day — therapeutic ceiling"  [RARE-000242]
- **Structure notes** — one log-scale ramp/ladder, ~5–7 rungs climbing from the mg maintenance floor to the 20 g ceiling; route every label to ONE side so no stroke crosses text (element-headers Rule 2 trap). The mg-to-20-g span is a ~200×–2,000× jump and is unique among shipped headers. Note the ramp only reads honestly if it draws EACH rung from a verbatim-backed id — the SAFE list above is the assembled, ready set.

### Concept C — "Where a shortage shows up" (liver + brain deficiency map)
- **Exact quotes available** (both deficiency claims are fully verbatim-backed — this concept has the cleanest quote support in the pack):
  - WAL-CLM-EPIGEN-000044 — «Fatty liver»
  - WAL-CLM-EPIGEN-000044 — «Liver cirrhosis,»   (trailing comma is in the source)
  - WAL-CLM-EPIGEN-000044 — «Kidney hemorrhage»
  - WAL-CLM-EPIGEN-000044 — «Alzheimer's disease, dementia»   (STRAIGHT apostrophe)
  - WAL-CLM-EPIGEN-000044 — «Tardive dyskinesia»
  - WAL-CLM-EPIGEN-000044 — «Huntington's disease»
  - WAL-CLM-EPIGEN-000044 — «Alzheimer's disease, dementia
Tardive dyskinesia
Huntington's disease»   (the full brain/movement block, three source lines)
  - WAL-CLM-RARE-000242 — «Fatty liver, kidney hemorrhage, Alzheimer’s disease, tardive dyskinesia, Huntington's disease»   (single-line variant; CURLY apostrophe on Alzheimer’s, STRAIGHT on Huntington's)
  - WAL-CLM-RARE-000242 — «kidney hemorrhage»
- **Numbers** — none intrinsic to the deficiency map. (If a therapeutic aside is added, "20 G per day" is verbatim-backed by RARE-000242.)
- **Figure label text** (candidate zone tags — drawn from the two verbatims above):
  - LIVER zone — "fatty liver · cirrhosis"  [EPIGEN-000044: «Fatty liver», «Liver cirrhosis,»]
  - BRAIN zone — "Alzheimer's · dementia · tardive dyskinesia · Huntington's"  [EPIGEN-000044]
  - KIDNEY marker — "hemorrhage"  [EPIGEN-000044: «Kidney hemorrhage»]
- **Structure notes** — a torso+head silhouette with exactly two hot zones (liver, brain) plus a small third kidney marker; three markers total. Keep the label count low to avoid the rejected many-station look. Kidney hemorrhage is the one MAPPED deficiency SYMPTOM (both claims, high confidence); fatty liver + kidney hemorrhage + the brain cluster is the whole deficiency picture.

### Concept D — "The arsenic odd couple" (curio card)
- **Exact quotes available** (single-claim, medium confidence — WAL-CLM-IMMORT-000226; all curly `“ ”`):
  - WAL-CLM-IMMORT-000226 — «Arsenic in combination with the B-vitamin choline
prevents 100% of perosis (“slipped tendon”) in poultry.»
  - WAL-CLM-IMMORT-000226 — «prevents 100% of perosis (“slipped tendon”) in poultry»
  - WAL-CLM-IMMORT-000226 — «carpal tunnel syndrome,»   (text sits inside source curly quotes: `“carpal tunnel syndrome,”` — this substring is the inner text + comma)
  - WAL-CLM-IMMORT-000226 — «“TMJ,”»   (includes the curly quotes)
  - WAL-CLM-IMMORT-000226 — «repetitive motion»
  - WAL-CLM-IMMORT-000226 — «Arsenic
deficiency in humans results in a “carpal tunnel syndrome,”
“TMJ,” and other “repetitive motion” type degenerative joint
diseases»
- **Numbers** — 100 · % (of perosis prevented) · WAL-CLM-IMMORT-000226 («prevents 100% of perosis»). No dose numbers.
- **Figure label text** (candidate; final copy OPEN):
  - Pair — "choline + arsenic"  [IMMORT-000226]
  - Outcome — "100% of slipped tendon prevented (poultry)"  [IMMORT-000226: «prevents 100% of perosis (“slipped tendon”) in poultry»]
  - Human footnote — "same gap in people → carpal tunnel · TMJ"  [IMMORT-000226]
- **Structure notes** — a self-contained "1 + 1 → result" curio card (choline glyph + arsenic glyph → outcome), in the spirit of a did-you-know aside, NOT the page spine. Weakness carried from dossier: it is primarily arsenic's story with choline as the named partner, single medium-confidence claim — best as a secondary curio block.

## Trap resolutions (claim_text > verbatim — the naive citation is WRONG)
Every case where the number/label a concept wants is NOT in the verbatim of the claim the dossier cited:
- **"150 mg" headache** → NO verbatim-backed home. NOT WAL-CLM-LETS-000293 (its verbatim omits both "choline" and "150"). Do NOT display as a quote; it is claim_text-only. Caution: "150 mg" appears in WAL-CLM-LETS-000048's verbatim but there it is the RDA column (argued against), a different meaning.
- **"4 grams" epilepsy** → cite WAL-CLM-LETS-000120 (absence attacks, «choline 4 gm/day»), NOT WAL-CLM-LETS-000267 (verbatim omits choline and 4).
- **"20 grams" therapeutic / soy lecithin 10–20 g** → cite WAL-CLM-RARE-000242 («20 G per day»), NOT WAL-CLM-LETS-000373 (verbatim covers only selenium + vitamin E, truncates before choline; "10-20 grams" is claim_text-only).
- **Identity mechanism (membrane / surfactant / acetylcholine / sphingomyelin)** → claim_text-only in WAL-CLM-EPIGEN-000044; its verbatim is the deficiency list. Safe as labeled illustration/lede prose, NEVER as a pull-quote. (Dossier §5 flagged this one; re-stated because it drives Concept A + both ledes.)
- **Competing maintenance numbers** → 100 mg card (WAL-CLM-EPIGEN-000124, 2014) vs 600 mg "True Supplement Need" (WAL-CLM-LETS-000048, 1995). Neither carries `superseded_by`; derive favors the newer Epigenetics figure. Keep 100 mg on the card; treat 600 mg as historical if surfaced at all — do not blend.
- **Clean-on-the-big-number confirmation:** WAL-CLM-RARE-000242 claim_text "20 grams a day" DOES match its verbatim «20 G per day» — no inflated-number mismatch. The "500 mg selenium" note in WAL-CLM-LETS-000220's claim_text is a selenium misprint flag, irrelevant to choline (choline there is 500 mg/day) — do not carry the selenium figure into a choline visual.

## Category / width / background (from element-headers.md)
- **Category accent:** choline is a `vitamin` (water-soluble B-vitamin) → **ORANGE** accent (`data-category` vitamin tint on `.kd-ep-fam`).
- **Width:** must match the element detail screen exactly — figure ceiling is the two shipped slots `--fork` (700px) or `--rail` (660px); do NOT author at the 817px outer max or a bare 560px base (Rule 1/2 traps). Exact slot is a design-time call.
- **Background:** the tan `.kd-ep-fam` box (`--ds-paper-deep`), category-tinted — because the header block leads directly into the Best-Youngevity-sources block beneath it.

## Still OPEN for Luneth (do NOT pre-decide)
- Which concept, or a mix (dossier recommends B — "Milligrams to keep, grams to treat" — with Concept A's dual-role fork as fallback).
- Chassis vs composed `blocks[]` layout.
- Final layout, coordinates, figure geometry, illustration choice.
- Final display copy + tone (all label strings above are candidates, not final).
- Visual sign-off (the STOP-for-verification gate).
