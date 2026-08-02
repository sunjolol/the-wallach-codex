# Omega-6 (Linoleic Acid) — design-prep build sheet
> Source materials for chronicle/header-research/omega-6.md. Byte-verified from sealed claims (pack: _packs/omega-6.json). NOT a design — concept choice + layout stay open for Luneth.
> Every guillemet quote below is a byte-exact contiguous substring of the cited claim's `verbatim`, chosen to sit WITHIN a single source line (no wrap) so it copies clean. Source typos ("chonic", "rosacea acnea") and curly quotes/apostrophes (“ ” ’) are preserved exactly — do not "fix" them.

## Entity-copy draft (ready to slot into dashboard/assets/data/entity-copy.json under "omega-6")

- **lede** (PROPOSAL): "Linoleic acid — the omega-6 among the body's essential fatty acids, and one of only two fats it cannot build for itself. Wallach treats it as structural raw material, not fuel: the stock of cell membranes and of the prostaglandins that help set blood pressure, clotting and nerve signals — and it only does that work in balance with omega-3."  [grounded: WAL-CLM-EPIGEN-000197 (two classically essential fats, linoleic = omega-6), WAL-CLM-DDDL-000064 (raw material for prostaglandins: blood pressure / clotting / CNS), WAL-CLM-EPIGEN-000398 (requires the omega-3:omega-6 ratio)]
  - Note: avoid printing "three essential fatty acids" or "90 essential nutrients" in the lede — both are claim_text-only on WAL-CLM-EPIGEN-000197 (see Traps). The strict count Wallach's verbatim supports is TWO.

- **why** (PROPOSAL — target.kind is `wallach_collective`, so this is the honest-gap version, NOT a per-element number): "There is no omega-6-only target. Omega-6 shares a single essential-fatty-acid budget with omega-3: Wallach puts the essential fatty acids at 3 percent of total daily calories, or 9 grams a day supplemented in capsule form — one combined amount for the fatty acids together, not 9 grams of omega-6 by itself. No conversion factor, body-weight scaling or rounding applies; it is the flat figure Wallach states directly."  [source_claim_id: WAL-CLM-DDDL-000115 · both "3 percent" and "9 grams per day" are byte-present in that claim's verbatim · no IU/weight/round transform — flat collective amount]
  - Honest gap to state plainly in the header per element-headers.md Rule 6 + dossier §4: the coverage figure shown against omega-6 is a SHARED group budget, never a solo omega-6 dose.

## Per-concept build materials

### Concept A — "The Spectrum" (omega-6 runs from must-eat to make-your-own) — RECOMMENDED LEAD (dossier §6)
- **Exact quotes available**
  - WAL-CLM-EPIGEN-000197 — «two fatty acids that are classically regarded as essential»
  - WAL-CLM-EPIGEN-000197 — «linoleic acid (an omega-6 fatty acid)»
  - WAL-CLM-EPIGEN-000450 — «Some fatty acids are classified as “conditionally essential.”»
  - WAL-CLM-EPIGEN-000450 — «arachidonic acid (an omega-6 fatty acid)»
  - WAL-CLM-EPIGEN-000450 — «gamma-linolenic acid (an omega-6 fatty acid)»
  - WAL-CLM-RARE-000109 — «only two (linoleic and linolenic)»
  - WAL-CLM-RARE-000109 — «designated as EFA as arachidonic acid can»  (source continues, wrapped: "…can / be synthesized by the human from linoleic / acid." — this is the "arachidonic built from linoleic" fact; take a within-line piece or accept the wrap)
  - WAL-CLM-RARE-000109 — «be synthesized by the human from linoleic»  (within-line piece of the same sentence)
- **Numbers** — none required by this concept. (Do NOT introduce a carbon number — see Traps: "sixth carbon" is nowhere in the pack.)
- **Figure label text** (node names are verbatim-grounded; axis-END descriptors are conceptual design copy — grounded in the claims but their exact display wording is Luneth's call, not a byte-quote):
  - Node "Linoleic acid" — the strictly-essential end · WAL-CLM-EPIGEN-000197
  - Node "Arachidonic acid" — conditionally essential · WAL-CLM-EPIGEN-000450; tag "built from linoleic" · WAL-CLM-RARE-000109
  - Node "Gamma-linolenic acid (GLA)" — conditionally essential · WAL-CLM-EPIGEN-000450
  - Axis end (must-eat) — conceptual, grounded in WAL-CLM-EPIGEN-000197 (cannot be manufactured; the strict pair). NOT a verbatim string.
  - Axis end (usually make your own) — conceptual, grounded in WAL-CLM-EPIGEN-000450 ("conditionally essential" = the body can normally make it). Only «conditionally essential» itself is a byte-quote (WAL-CLM-EPIGEN-000450).
- **Structure notes** — one horizontal essentiality axis; exactly three omega-6 nodes; linoleic locked at the strict end (single accent), arachidonic + GLA toward the conditional end; arachidonic carries the "built from linoleic" tag. Labels sit above/below the axis line, never on it. No beats, no big-number stat, no pull quote — one axis carries the idea.
- **Confidence flag** — WAL-CLM-EPIGEN-000450 is the only `confidence: medium` claim in the pack and it anchors A's conditional half; verbatim clearly supports it, but surface it for Luneth's eye (dossier §5).

### Concept B — "Vitamin F" (the essential fat that was almost a vitamin)
- **Exact quotes available**
  - WAL-CLM-EPIGEN-000397 — «In 1923 the two essential fatty acids were identified»
  - WAL-CLM-EPIGEN-000397 — «listed as “vitamin F."»  (curly OPEN quote “, straight CLOSE quote " — exactly as in source)
  - WAL-CLM-EPIGEN-000397 — «In 1929 laboratory rat studies indicated that these two fatty»  (source continues, wrapped: "…two fatty / acids were more properly classed as fats…")
  - WAL-CLM-EPIGEN-000397 — «more properly classed as fats rather than being listed as vitamins»
  - WAL-CLM-EPIGEN-000197 — «two fatty acids that are classically regarded as essential»  (the "what it really is" resolve line)
- **Numbers**
  - 1923 · year · WAL-CLM-EPIGEN-000397 (verbatim contains "In 1923") · verbatim-backed, safe to display
  - 1929 · year · WAL-CLM-EPIGEN-000397 (verbatim contains "In 1929") · verbatim-backed, safe to display
- **Figure label text**
  - Stamp face "vitamin F" — verbatim on WAL-CLM-EPIGEN-000397 is lowercase "vitamin F"; the dossier mock proposed title-case "Vitamin F". Casing is a display choice for Luneth; the byte-quote is «vitamin F» (via the fuller «listed as “vitamin F."»).
  - "1923" (discovered) — WAL-CLM-EPIGEN-000397
  - "1929 → fat" (the cancellation / correction mark) — WAL-CLM-EPIGEN-000397. Route the cancel-mark to the margin/corner, NOT a stroke through the readable letters (dossier §2-B).
- **Structure notes** — curio-card / did-you-know grammar leading; one period "Vitamin F" stamp with a hand-struck 1929→fat cancellation; then a tight identity line resolving what it really is (one of only two fats the body can't make). History-first, not beats-first. Two-or-three marks total.

### Concept C — "The Messenger" (omega-6 becomes the body's signals — the lipoxin line)
- **Exact quotes available**
  - WAL-CLM-EPIGEN-000399 — «lipoxins (a class of eicosanoid derivatives through the lipoxygenase pathway»  (source continues, wrapped: "…pathway / from omega-6 EFAs)")
  - WAL-CLM-EPIGEN-000399 — «from omega-6 EFAs)»
  - WAL-CLM-EPIGEN-000399 — «eicosanoids, endocannabinoids (affecting mood, behavior, and inflammation)»
  - WAL-CLM-EPIGEN-000399 — «resolvins from omega-3»
  - WAL-CLM-DDDL-000064 — «EFA’s are also the raw material for the human body to»  (curly apostrophe ’ in "EFA’s")
  - WAL-CLM-DDDL-000064 — «manufacture prostaglandins that help regulate blood pressure, heart rate,»
  - WAL-CLM-DDDL-000064 — «vascular dilation, blood clotting, bronchial dilation, and central nervous»
  - WAL-CLM-DDDL-000064 — «system (brain and spinal cord) function»
  - WAL-CLM-RARE-000110 — «human body to manufacture prostaglandins»  (parallel source; RARE-000110 uses "EFA are" with no apostrophe)
  - WAL-CLM-EPIGEN-000398 — «In the human body the essential fatty acids serve multiple functions»
  - WAL-CLM-EPIGEN-000398 — «which require proper ratios between omega-3 and omega-6 forms»
- **Numbers** — none.
- **Figure label text**
  - Output "Lipoxins" (the accent) — WAL-CLM-EPIGEN-000399; tag "from omega-6 EFAs" — byte-quote «from omega-6 EFAs)» on WAL-CLM-EPIGEN-000399
  - Output "Prostaglandins" — WAL-CLM-DDDL-000064 / WAL-CLM-RARE-000110
  - Family names "Eicosanoids", "Endocannabinoids" — WAL-CLM-EPIGEN-000399
  - Contrast tag "resolvins → omega-3" (the complement, NOT omega-6's) — WAL-CLM-EPIGEN-000399. Use only to distinguish; the header's product is lipoxins.
  - Frame line "not fuel — a starting material" — conceptual design copy (the "not fuel" idea is claim_text-only on WAL-CLM-EPIGEN-000197; NOT a byte-quote). Grounded in the structural-material framing but must not be shown as a quotation.
- **Structure notes** — single input→output transformation: one omega-6 block branching to a FEW named products, lipoxins as accent. Cap outputs (switchboard, not station map). No connector routed through a label. UX caveat (dossier §2-C): highest overlap risk with omega-3's prostaglandin "factory" — lean on the lipoxin distinction, do NOT re-draw omega-3's four prostaglandin dials.

### Concept D — "The First Tell" (dry brittle hair + cracked skin are the outward sign)
- **Exact quotes available**
  - WAL-CLM-LETS-000011 — «dry brittle hair»
  - WAL-CLM-LETS-000011 — «xerosis»
  - WAL-CLM-LETS-000011 — «impaired wound healing»
  - WAL-CLM-LETS-000011 — «growth retardation»
  - WAL-CLM-LETS-000011 — «immunologic dysfunction»
  - WAL-CLM-EPIGEN-000059 — «disease (including dry/cracked skin, dermatitis, eczema, psoriasis, rosacea acnea,»  (source typo "rosacea acnea" — preserve; take a shorter piece if you only want the skin signs)
  - WAL-CLM-EPIGEN-000059 — «Essential fatty acid deficiencies will produce thrombosis (i.e., cerebral stroke,»
  - WAL-CLM-EPIGEN-000059 — «respiratory disease (including asthma, chonic bronchitis, unremitting cough,»  (source typo "chonic" — preserve)
  - WAL-CLM-EPIGEN-000059 — «etc,), and depression»
- **Numbers** — none.
- **Figure label text**
  - "Dry brittle hair" — byte-quote «dry brittle hair» · WAL-CLM-LETS-000011
  - "Xerosis" — byte-quote «xerosis» · WAL-CLM-LETS-000011. (The gloss "abnormally dry skin" is claim_text-only on WAL-CLM-LETS-000011 — usable as a designer's gloss, NOT as a byte-quote.)
  - "Dry/cracked skin" — from «dry/cracked skin» within WAL-CLM-EPIGEN-000059
  - Deeper-reach caption list (named only, not drawn): "thrombosis / stroke", "respiratory disease", "depression" — all byte-present in WAL-CLM-EPIGEN-000059
- **Structure notes** — first-visible-sign hero: one close detail of a dry/splitting hair strand + a patch of xerotic skin (two focal marks). The deeper conditions appear ONLY as a short caption list, never a cluttered body-map. Surface→deep widening line gives the payoff.

## Trap resolutions (claim_text > verbatim)
Numbers/facts whose obvious claim_text source is NOT verbatim-backed. For each, use the verbatim-backed id or do not display.

- **"4% / four percent of calories from polyunsaturated oils"** -> **claim_text-only, DO NOT DISPLAY AS A QUOTE.** Dossier §1 attributes it to WAL-CLM-EPIGEN-000202, but that claim's verbatim is only «Traditional diets contained nearly equal amounts of omega-3 and» + "omega-6 essential fatty acids." — it contains NO "four percent" / "4%". The 4% lives solely in the claim_text; no verbatim anywhere in the pack carries it.
- **"90 essential nutrients" / "three essential fatty acids"** -> **claim_text-only on WAL-CLM-EPIGEN-000197.** Its verbatim states only «two fatty acids that are classically regarded as essential». Do not print "three essential" or "90 nutrients" as a Wallach quote; the verbatim-supported strict count is TWO (WAL-CLM-RARE-000109 «only two (linoleic and linolenic)»).
- **"sixth carbon" for omega-6** -> **not present anywhere; DO NOT INFER.** WAL-CLM-EPIGEN-000204's verbatim names the "omega" numbering scheme but states no carbon position; "third carbon" (omega-3) is itself claim_text-only on -000204 and -000197. Never print a carbon number for omega-6 (dossier §5). This is why no molecule/naming concept is offered here.
- **"3% / 3 percent"** -> verbatim-backed, but cite WAL-CLM-DDDL-000115 («3 percent of your total daily») or WAL-CLM-DDDL-000063 («Three percent of the total daily»), NOT WAL-CLM-IMMORT-000053 (its claim_text says "3% of daily calories" but its verbatim is about infant deficiency and omits the number).
- **"9 grams / 9 g"** -> verbatim-backed on WAL-CLM-DDDL-000115 («9 grams per day»). Safe. It is the COLLECTIVE EFA amount (dose.collective_group = essential-fatty-acids), never a solo omega-6 figure.
- **"three polyunsaturated fatty acids" (as a GROUP, not as "essential")** -> verbatim-backed on WAL-CLM-DDDL-000063 («Three polyunsaturated fatty acids (linoleic, linolenic, and arachidonic acids)»). Usable, but pair with the two-are-strictly-essential nuance (WAL-CLM-RARE-000109) so it does not read as "three essential."
- **Omega-9 slotting** -> outlier claim WAL-CLM-EPIGEN-000394 groups omega-9 (and cholesterol) into the EFA list against Wallach's dominant two-essential stance. Do NOT build any figure on it; leave omega-9 out (dossier §5).

## Category / width / background (from element-headers.md)
- **Category accent** — omega-6 is `category: fatty_acid` → **purple** (memory: minerals=blue · vitamins=orange · aminos=green · omegas=purple).
- **Width** — must match the element detail screen exactly (element-headers.md Rule 1). The `.kd-ep-fam` figure ceiling is ~817px; prefer a shipped figure slot — `--fork` 700px or `--rail` 660px — over a hand-picked width, and author every figure at scale 1 (viewBox width == CSS max-width).
- **Background** — the tan `.kd-ep-fam` box (`--ds-paper-deep`), tinted by the purple fatty-acid accent. The main content box leads DOWN into the Best-Youngevity-sources block (one of the four fixed things per Rule 0), so the header must close into that, not float on white.

## Still OPEN for Luneth (do NOT pre-decide)
- Which concept (A / B / C / D) or a mix. Dossier recommends A (lead) + B (backup); nothing here is chosen.
- Chassis (legacy skeleton) vs composed `blocks[]` shape — a design-time call.
- Final layout, coordinates, illustration geometry, node placement.
- Final display copy + tone (lede/why above are PROPOSALS; label casing e.g. "Vitamin F" vs "vitamin F" is his call).
- Visual sign-off (the STOP gate) before anything is built live.
