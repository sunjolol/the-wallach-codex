# Omega-3 — design-prep build sheet
> Source materials for chronicle/header-research/omega-3.md. Byte-verified from sealed claims. NOT a design — concept choice + layout stay open for Luneth.

Every «guillemet» quote below is a BYTE-EXACT CONTIGUOUS SUBSTRING of the cited claim's `verbatim` in the sealed pack. Quotes are deliberately taken WITHIN a single physical line of the verbatim (the books wrap mid-sentence at a `\n`); where a phrase wraps, the wrap point is noted so the byte match still holds. Curly quotes `“ ”` and the curly apostrophe `’` are reproduced exactly — the source uses them; a straight-quote paraphrase would fail the byte check.

## Entity-copy draft (ready to slot into dashboard/assets/data/entity-copy.json under "omega-3")
- **lede** (PROPOSAL): "The omega-3 fatty acid — one of only two fats the body cannot build for itself, so it has to arrive in the diet — and the raw material it turns into prostaglandins, the local hormones that help set blood pressure, clotting, airway width and nerve function."  [grounded: WAL-CLM-EPIGEN-000197 (only two, ALA is one), WAL-CLM-DDDL-000064 / WAL-CLM-RARE-000110 (prostaglandin functions)]
  - Alternate lede (PROPOSAL, deficiency-surface angle): "One of only two fats your body cannot make for itself, so it has to arrive in the diet. Wallach counts it among the essential nutrients — far more than fuel — and reads the earliest shortage on the outside, in dry, cracked skin and brittle hair."  [grounded: WAL-CLM-EPIGEN-000197, WAL-CLM-RARE-000109, WAL-CLM-EPIGEN-000059 (dry/cracked skin), WAL-CLM-LETS-000011 (xerosis, dry brittle hair)]
  - Build note: whichever concept is chosen, trim the lede so it does not restate that concept's opening beat (pair the function-lede with a naming concept, the deficiency-lede with a function concept). Do NOT write "90 essential nutrients" into the lede as a quote — see trap below; the softer "among the essential nutrients" is safe.
- **why** (PROPOSAL — HONEST GAP, target.kind is non-numeric): "Omega-3 has no target of its own. Wallach gives one combined figure for the essential fatty acids together — 3 percent of your total daily calories, or 9 grams a day supplemented in capsule form — and omega-3 shares that budget with omega-6. So the amount shown here is the shared essential-fatty-acid budget, not a solo omega-3 dose. There is no IU conversion, body-weight scaling, or rounding to explain: Wallach states the 9 g flat, for the group."  [source_claim_id: WAL-CLM-DDDL-000115 · target.collective_group = "essential-fatty-acids" · target.kind = "wallach_collective" · NO transform factors apply — the number is stated directly]

## Per-concept build materials

### Concept A — "Count to three" (The Third Carbon)
- **Exact quotes available**
  - WAL-CLM-EPIGEN-000204 — «The location of the first double bond as counted from the “tail” or methyl end»
  - WAL-CLM-EPIGEN-000204 — «referred to as the “omega” number»
  - WAL-CLM-EPIGEN-000204 — «is referred to as the “omega” number (ie., omega-3, omega-6,»  (ends at the line wrap before "omega-9")
  - WAL-CLM-EPIGEN-000197 — «There are two fatty acids that are classically regarded as essential»
  - WAL-CLM-EPIGEN-000197 — «linolenic acid (omega-3 fatty acid) and linoleic acid (an omega-6 fatty acid).»
- **Numbers**
  - "omega-3" (the name/token) · no unit · **WAL-CLM-EPIGEN-000204** verbatim contains the literal token `omega-3` (in the "(ie., omega-3, omega-6, omega-9, etc)" list). Safe to display as Wallach's word.
  - "3" AS THE CARBON POSITION ("first double bond at the third carbon") · **TRAP — claim_text-only.** The explicit statement "the first double bond is at the third carbon" lives in the claim_text of WAL-CLM-EPIGEN-000204 AND WAL-CLM-EPIGEN-000197 ("three carbons in from the tail"), but NEITHER verbatim says "third carbon" / "carbon 3" / "three carbons in." The verbatim only gives the general naming rule (the omega number = location of the first double bond, counted from the tail/methyl end). Do NOT show "at the third carbon" as a Wallach quote. The figure MAY annotate the third carbon as the illustrator's rendering of what "omega-3" means, but the label copy must be app-voice, not a guillemet quote.
- **Figure label text** (short, display-ready — provenance noted)
  - `omega-3` — Wallach's token, verbatim-safe (000204).
  - `tail` / `methyl end` — verbatim-safe wording (000204: "the “tail” or methyl end"). A "tail end" marker on the chain is grounded.
  - `first double bond` — verbatim-safe phrase (000204: "the first double bond").
  - `3` (count marker at the third carbon) — APP-VOICE annotation, NOT a quote (the position is claim_text-only; see trap). Set the numeral BESIDE the bond, never on the stroke (dossier + element-headers.md Rule 2 stroke-through ban).
  - `a bond the body can't build → must be eaten` — APP-VOICE pivot line; grounds on "only two ... classically regarded as essential" (000197) but is a paraphrase, so it is header copy, not a quote.
- **Structure notes** — one annotated zig-zag carbon chain; mark the tail/methyl end, count three carbons, accent the one double bond at position 3; a single pivot line beneath turning the address into meaning. Few elements, one accent. No beats, no big-number stat, no pull quote required. The "3" numeral and the carbon count are the illustrator's depiction of the omega-3 name, not quoted text.

### Concept B — "Two of the ninety" (The Only Two)
- **Exact quotes available**
  - WAL-CLM-EPIGEN-000197 — «There are two fatty acids that are classically regarded as essential»
  - WAL-CLM-EPIGEN-000197 — «linolenic acid (omega-3 fatty acid) and linoleic acid (an omega-6 fatty acid).»
  - WAL-CLM-RARE-000109 — «only two (linoleic and linolenic) are»
  - WAL-CLM-RARE-000109 — «designated as EFA as arachidonic acid can»  (wraps to "be synthesized by the human from linoleic acid" on the next lines)
  - WAL-CLM-DDDL-000063 — «Three polyunsaturated fatty acids (linoleic, linolenic, and arachidonic acids)»
  - WAL-CLM-DDDL-000063 — «are known as essential fatty acids (EFA). Three percent of the total daily»
- **Numbers**
  - "two" (genuinely essential) · no unit · **WAL-CLM-EPIGEN-000197** ("There are two fatty acids...") AND **WAL-CLM-RARE-000109** ("only two (linoleic and linolenic)"). Both verbatim-backed. Safe.
  - "three" (grouped as EFA) · no unit · **WAL-CLM-DDDL-000063** ("Three polyunsaturated fatty acids ... are known as essential fatty acids"). Verbatim-backed. Safe to say three are GROUPED.
  - "90" / "ninety" (essential nutrients) · **TRAP — claim_text-only.** WAL-CLM-EPIGEN-000197's claim_text says "counts three essential fatty acids among the body's 90 essential nutrients," but its verbatim contains NO "90." No verbatim anywhere in the pack states 90. Do NOT display "90" / "ninety" as a quote. The concept name "Two of the ninety" leans on a number that is not verbatim-backed here — if the "90" framing is wanted it must be sourced to the canon essentials count (the 90/91 graphic), NOT quoted from this pack, and shown as app framing.
  - CAUTION (dossier §5): three-vs-two. claim_text of 000197 also says he "counts three essential fatty acids among the 90," which conflicts with the verbatim "two." Do NOT print "three essential" flatly. The strike-through of arachidonic ("the body builds this one") is the correct, grounded way to reconcile it — arachidonic is GROUPED but not strictly essential.
- **Figure label text**
  - `omega-3 (alpha-linolenic)` — verbatim-safe (000197: "alpha linolenic acid (omega-3 fatty acid)").
  - `omega-6 (linoleic)` — verbatim-safe (000197: "linoleic acid (an omega-6 fatty acid)").
  - `arachidonic` — verbatim-safe token (000063 / 000109).
  - `the body builds this one` / `made from linoleic` — APP-VOICE gloss of 000109 ("arachidonic acid can be synthesized by the human from linoleic acid"). Grounded meaning, but paraphrase — header copy, not a quote. (A byte-exact quote for the strike-through tag is available if wanted: «designated as EFA as arachidonic acid can» from 000109, though it wraps mid-clause.)
  - `essential fatty acids` — verbatim-safe (000063).
  - Do NOT label a tile `two of 90` — the 90 is not quotable here.
- **Structure notes** — three fat tiles: two lit (ALA, linoleic), one dimmed/struck (arachidonic) with a small "made from linoleic" tag. Comparison-tile grammar, not a beats chassis. One idea, three elements. The reconciliation (grouped-three vs essential-two) is carried by the strike-through, not by printing "three essential."

### Concept C — "Not fuel — a factory" (Raw Material)
- **Exact quotes available**
  - WAL-CLM-DDDL-000064 — «EFA’s are also the raw material for the human body to»  (note curly apostrophe in "EFA’s")
  - WAL-CLM-DDDL-000064 — «manufacture prostaglandins that help regulate blood pressure, heart rate,»
  - WAL-CLM-DDDL-000064 — «vascular dilation, blood clotting, bronchial dilation, and central nervous»  (wraps to "system (brain and spinal cord) function")
  - WAL-CLM-RARE-000110 — «EFA are also the raw material for the»  (wraps to "human body to manufacture prostaglandins")
  - WAL-CLM-RARE-000110 — «that help regulate blood pressure, heart rate,»
  - WAL-CLM-EPIGEN-000399 — «eicosanoids, endocannabinoids (affecting mood, behavior, and inflammation),»
  - WAL-CLM-EPIGEN-000399 — «and resolvins from omega-3 (in the presence of»  (wraps to "aspirin, downregulating inflammation")
- **Numbers**
  - "four" governed functions (the dossier caps the figure at four dials) · **APP-VOICE count, not a Wallach number.** The verbatim lists SIX regulated functions (000064: blood pressure, heart rate, vascular dilation, blood clotting, bronchial dilation, CNS). "Four" is the illustrator's selection for clutter-control, not a quoted figure — do not show "4" as Wallach's number. Pick any four of the six; all six labels are verbatim-safe.
- **Figure label text** (all verbatim-safe from 000064 / 000110 unless noted)
  - `blood pressure` — 000064.
  - `heart rate` — 000064.
  - `vascular dilation` — 000064 (app may render as "blood-vessel width" — that gloss is app-voice).
  - `blood clotting` — 000064 (dossier shorthand "clotting" = app-voice gloss).
  - `bronchial dilation` — 000064 (dossier shorthand "airways" = app-voice gloss).
  - `central nervous system (brain and spinal cord)` — 000064 (dossier shorthand "nerves" = app-voice gloss).
  - `prostaglandins` — verbatim-safe node label (000064 / 000110).
  - `resolvins from omega-3` — verbatim-safe (000399), the omega-3-specific signaling payoff; "downregulating inflammation" also verbatim-safe (000399).
  - `far more than fuel` — APP-VOICE frame line (paraphrase of the "raw material ... not merely a source of fuel" idea in 000197's claim_text; NOT a verbatim string). Header copy, not a quote.
- **Structure notes** — one fat block → one prostaglandin node → a SMALL fixed set of governed functions (cap at four dials per dossier; six are available, choose four). Switchboard, not a station map. Route no connector through a label (element-headers.md Rule 2). `resolvins from omega-3` is the one omega-3-SPECIFIC lever and differentiates this from the omega-6 header (which owns lipoxins).

### Concept D — "Level again" (The Balance)
- **Exact quotes available**
  - WAL-CLM-EPIGEN-000398 — «In the human body the essential fatty acids serve multiple functions, all of»  (wraps to "which require proper ratios between omega-3 and omega-6 forms")
  - WAL-CLM-EPIGEN-000398 — «which require proper ratios between omega-3 and omega-6 forms.»
  - WAL-CLM-EPIGEN-000202 — «Traditional diets contained nearly equal amounts of omega-3 and»  (verbatim opens "8. Traditional..."; drop the "8. " list-numeral for a clean quote — the substring "Traditional diets contained nearly equal amounts of omega-3 and" is byte-exact and wraps to "omega-6 essential fatty acids")
  - WAL-CLM-EPIGEN-000202 — «omega-6 essential fatty acids.»
- **Numbers**
  - "nearly equal" (omega-3 : omega-6 in traditional diets) · no unit · **WAL-CLM-EPIGEN-000202** ("nearly equal amounts of omega-3 and omega-6"). Verbatim-backed. Safe.
  - "~4% / four percent of calories from polyunsaturated oils" · **TRAP — claim_text-only.** The 4% figure is in WAL-CLM-EPIGEN-000202's claim_text ("only four percent of those diets' calories came from polyunsaturated oils") but NOT in its verbatim (verbatim = the "nearly equal amounts" line only), and it appears in NO other verbatim in the pack. Do NOT display "4%" / "four percent" as a quote. If the 4% note is wanted it must be labeled app-voice, sourced to the 000202 claim_text, and never set in guillemets.
  - "3% of daily calories / 9 g" (the collective budget) is available from WAL-CLM-DDDL-000115 (verbatim-backed — see the "why" section) if the balance figure wants to name the shared budget, but that is the DOSE story, not the ratio story.
- **Figure label text**
  - `omega-3` / `omega-6` — verbatim-safe tokens (000202, 000398).
  - `nearly equal` — verbatim-safe (000202).
  - `traditional diet` — verbatim-safe wording (000202: "Traditional diets").
  - `every function needs the ratio` — APP-VOICE gloss of 000398 ("all of which require proper ratios between omega-3 and omega-6 forms"). Paraphrase — header copy. (Byte-exact alternative if a quote is wanted on the beam caption: «which require proper ratios between omega-3 and omega-6 forms.» from 000398.)
  - `only ~4% of those calories were polyunsaturated` — APP-VOICE ONLY (claim_text-sourced, see trap); never a quote.
- **Structure notes** — one balance scale, level: omega-3 pan vs omega-6 pan, tagged "traditional diet — nearly equal"; a short line names why balance matters (every EFA function depends on the ratio). Two pans, one beam — few elements. UX caveat (dossier §5): this is inherently a PAIR story; build to complement, not duplicate, the omega-6 header. The 4% detail, if used, is a small app-voice note, not a quoted number.

## Trap resolutions (claim_text > verbatim)
Every number/phrase whose naive claim_text source is NOT verbatim-backed. Cite the verbatim-backed id, or flag as claim_text-only "do not display as a quote."

- **"90 / ninety essential nutrients"** -> claim_text-only. In WAL-CLM-EPIGEN-000197's claim_text ("among the body's 90 essential nutrients"); NO verbatim in the pack contains "90." Do NOT quote. If needed, source to the canon 90/91 essentials graphic as app framing, NOT this pack. (Concept B name relies on it.)
- **"third carbon" / "at carbon 3" / "three carbons in from the tail"** -> claim_text-only. In WAL-CLM-EPIGEN-000204 and WAL-CLM-EPIGEN-000197 claim_text; NO verbatim states the position. WAL-CLM-EPIGEN-000204's verbatim gives only the general naming rule + the token `omega-3`. Do NOT quote "third carbon." The count is an illustrator annotation of the name. (Concept A core.)
- **"~4% / four percent of calories from polyunsaturated oils"** -> claim_text-only. In WAL-CLM-EPIGEN-000202's claim_text; verbatim omits it (and no other verbatim carries it). Do NOT quote. (Concept D note.)
- **"suicide" (low omega-3/DHA tied to depression and suicide)** -> claim_text-only. WAL-CLM-EPIGEN-000059's claim_text says "increased depression and suicide"; its verbatim ends at "and depression." — "suicide" and "low omega-3 (DHA)" are NOT in the verbatim. Quotable from 000059 verbatim: «and depression.» only. Do NOT quote "suicide." (Alternate "brain fat" concept.)
- **"dry skin means essential fatty acids" (the slogan)** -> claim_text-only. In WAL-CLM-LETS-000254's claim_text; its verbatim is about vitamin-A overdose + the treatment regimen and does NOT contain the slogan. Dry skin as a SIGN is still verbatim-backed elsewhere: WAL-CLM-LETS-000011 («xerosis») and WAL-CLM-EPIGEN-000059 («skin\ndisease (including dry/cracked skin...»). Quote those for the deficiency-surface angle, not 000254's slogan.
- **"four dials/functions" (Concept C count)** -> NOT a Wallach number. Verbatim lists six regulated functions (WAL-CLM-DDDL-000064); "four" is an app clutter-control choice. Do not show "4" as a figure. All six function labels ARE verbatim-safe.
- NOT a trap (verbatim-backed, listed to prevent over-flagging): "two" essential (000197 / 000109), "three" grouped EFA (000063), "3 percent of daily calories" (000063 / 000115), "9 grams per day" (000115), "nearly equal" omega-3:omega-6 (000202), "1923" + "vitamin F" + "1929" (000397), "78%" Alzheimer's (000016).

## Category / width / background (from element-headers.md)
- **Category accent:** fatty acid -> **purple** (`fatty-acid=purple`). The tan `.kd-ep-fam` box is tinted with the purple category accent.
- **Width:** match the element detail screen exactly. Prefer a shipped figure slot — `fork` = 700px or `rail` = 660px (`mech` = 600px also available) — declared as the figure block's `width` from the closed set; a figure MUST name its width or it renders at the 560px base and silently shrinks every label (Rule 2 cascade trap). Author the figure at scale 1 (viewBox width == CSS max-width).
- **Background:** the `--ds-paper-deep` tan main content box — it LEADS INTO the Best-Youngevity-sources block, which always sits at the bottom. Design the header to hand off cleanly to that block.

## Still OPEN for Luneth (do NOT pre-decide)
- Which concept (A / B / C / D), or a mix — all four are grounded and materials are assembled above.
- Chassis (legacy fixed skeleton) vs composed `blocks[]` shape — do not build a new header on the legacy chassis; composed is the path, but the choice is his.
- Final layout, coordinates, figure geometry, and the four-vs-fewer output count for Concept C.
- Final display copy + tone (the ledes/labels above are PROPOSALS/materials, not shipped copy).
- Visual sign-off — STOP for his eyes before logging/committing any live build (element-headers.md workflow + never-build-live-without-permission).
