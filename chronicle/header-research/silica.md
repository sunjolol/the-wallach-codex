# Silica — header research dossier
> status: RESEARCH (concepts only — NOT designed). 4 sealed claims · mineral · target: 38 mg/day (derived from Epigenetics 1–25 mg per 100 lb, ×1.54) · solo-header: marginal (one strong coherent concept — solo-worthy, but NOT a rich multi-concept palette; do not force a four-way fan-out).

## 1. The material (grounded, by angle)

The pack is small (4 claims, all `confidence: high`) but unusually coherent — nearly everything points at one idea: silica is the body's **structural raw material**, and it drains with age.

**Core identity — the structural / connective-tissue mineral.**
Silica (silicon, Si) is a trace mineral Wallach ties to the body's structural tissues. A deficiency is "characterized by dry brittle hair, brittle finger and toe nails, poor skin quality, poor calcium utilization and arterial disease" (WAL-CLM-RARE-000245, Rare Earths p409). Note every listed sign is a *structural* tissue — hair, nails, skin, the calcium-mineralized skeleton, and artery walls. This is the sharpest, most concrete material in the pack: visible, nameable signs a reader can self-check.

**Standout mechanism — collagen, doubled; and the age decline.**
"Silicon supplementation increases the collagen in growing bone by 100%. Tissue levels of Si decrease with aging in unsupplemented humans and laboratory species." (WAL-CLM-RARE-000244, Rare Earths p409). Two facts in one claim: (a) a hard, quotable number — collagen in growing bone *doubles* — and (b) a decline-over-time arc: tissue silicon falls with age unless you supplement. Together these are the engine of the whole header.

**The fiber / cholesterol angle (thin — one claim).**
"High fiber diets contain lots of Si which leads many investigators to think that Si helps to lower cholesterol. The recommended intake of Si ranges from 200 to 500 mg/day." (WAL-CLM-RARE-000246, Rare Earths p409). A genuinely distinct topic — why fiber-rich diets may lower cholesterol is that they're silica-loaded — but it rests on a single claim, and note it is Wallach relaying what "many investigators think," not a mechanism he asserts himself.

**Mapped condition.**
`cardiovascular_disease` — via the deficiency claim's "arterial disease" sign (WAL-CLM-RARE-000245). The only condition in the pack.

**The dose picture (two numbers, ~10× apart — see §4/§5).**
- Epigenetics daily mineral table (2014, newest): "Silica 1 – 25 mg" per 100 lb body weight (WAL-CLM-EPIGEN-000137). This is the target's source_claim_id.
- Rare Earths (1994): "recommended intake of Si ranges from 200 to 500 mg/day" (WAL-CLM-RARE-000246).

## 2. Header concepts (honestly, the material supports ONE strong lead + ONE thin distinct alternative)

### A — "The scaffolding mineral" (THE LEAD)
- **Name:** What Your Body Is Built From.
- **The hook:** Silica is the raw material behind the structures you can see wearing out — hair, nails, skin, bone, artery walls — and Wallach reads their decline as it running low.
- **Layout shape:** A single central "silica" column feeding a small, fixed set of named structural tissues, each paired with its deficiency read-out. Not a beat sequence and not a 1-2-3 → big-number → quote chassis — it's one figure that maps *material → tissue → visible sign*, with the 100%-collagen number as the anchoring stat and the "falls with age" arc as the turn. The signs ARE the payoff; no separate quote block is needed.
- **Illustration (one idea, fewest elements):** One vertical silica column; from it, a few short branches to the structural tissues Wallach names — hair, nails, skin, bone, artery wall — each branch ending in its plain deficiency word ("brittle," "dry," "poor"). Route every branch line AROUND its label, never through it. Do NOT draw a busy anatomy diagram or a many-station plumbing circuit — five branches maximum, matching the five signs in WAL-CLM-RARE-000245.
- **Anchored by:** deficiency = "dry brittle hair, brittle finger and toe nails, poor skin quality, poor calcium utilization and arterial disease" (WAL-CLM-RARE-000245); "increases the collagen in growing bone by 100%" + "tissue levels of Si decrease with aging in unsupplemented humans" (WAL-CLM-RARE-000244); condition `cardiovascular_disease` (WAL-CLM-RARE-000245).
- **Why it wows / best UX:** Every anchor is concrete and self-checkable — a reader glances at their own nails and skin. The 100%-collagen stat is a clean, hard number, and the age-decline gives a reason-to-care ("it drops as you get older"). This is the one concept the pack fully supports, and it uses almost all of it.

### B — "Why fiber lowers cholesterol" (DISTINCT TOPIC — but thin, one claim)
- **Name:** The Fiber Clue.
- **The hook:** The reason a high-fiber diet lowers cholesterol may not be the fiber at all — it's the silica riding along with it.
- **Layout shape:** A single connective statement, not a diagram — high-fiber foods → rich in silica → the cholesterol-lowering link investigators suspect. A one-line "did-you-know" inset, not a full header engine.
- **Illustration (optional, minimal):** none required; if wanted, a single sparse fiber-source mark tagged "loaded with Si." Keep it to one element.
- **Anchored by:** "High fiber diets contain lots of Si which leads many investigators to think that Si helps to lower cholesterol" (WAL-CLM-RARE-000246).
- **Why it wows / best UX:** It's a surprising, sticky reframing. BUT it rests on one claim and is hedged ("many investigators think," not Wallach's own mechanism), so it cannot carry a whole header alone — it belongs as an inset/footnote inside concept A, not as a co-equal lead. Presented here for completeness, flagged thin.

*(No third concept is offered on purpose. The age-decline material is genuinely compelling but it shares its only anchor (WAL-CLM-RARE-000244) with concept A — splitting it out would be one idea wearing two hats, exactly the padding this dossier is meant to avoid. It folds INTO A as the turn.)*

## 3. Proposed lede (PROPOSAL — Luneth ratifies, do not treat as final)

Option 1 (structural-forward, matches the shipped voice):
> "A structural trace mineral — the raw material behind bone collagen, hair, nails, skin and artery walls, which is why Wallach reads brittle nails and dry hair as the early signs it's running low, and warns that tissue levels quietly fall with age."
(Anchors: WAL-CLM-RARE-000245 for the structural tissues + signs; WAL-CLM-RARE-000244 for collagen + the age decline.)

Option 2 (number-forward):
> "The mineral that builds connective tissue — Wallach says supplementing it can double the collagen in growing bone, and reads its shortage in brittle hair, brittle nails and poor skin."
(Anchors: WAL-CLM-RARE-000244 for the 100% collagen figure; WAL-CLM-RARE-000245 for the signs.)

Both avoid restating concept A's opening branch labels verbatim.

## 4. Proposed "why this number" (PROPOSAL)

The target is a **derived Wallach figure — a real transform chain exists** (unlike the flat-figure trace minerals). `target.kind` = `wallach`, `low` = 38.0 mg, `source_claim_id` = WAL-CLM-EPIGEN-000137. Provenance: Wallach's Epigenetics daily mineral table states "Silica 1 – 25 mg" *per 100 lb of body weight* (WAL-CLM-EPIGEN-000137); the app takes the upper of the range (25 mg), scales it to a 154 lb / 70 kg reference body by ×1.54, and rounds to 2 significant figures → 25 × 1.54 = 38.5 → **38 mg/day**. No IU conversion applies (silica is already in mg).

Frame it as: *"Wallach's Epigenetics table lists silica at 1–25 mg per 100 lb of body weight. The app takes the top of that range and scales it to a 154 lb adult (×1.54), giving 38 mg a day."*

**⚠ Flag for Luneth (do not bury):** an older Wallach number disagrees by ~10×. Rare Earths (1994) states "recommended intake of Si ranges from 200 to 500 mg/day" (WAL-CLM-RARE-000246), and that 200–500 figure is also echoed inside WAL-CLM-RARE-000245's claim_text. The app correctly favors the NEWEST source (Epigenetics 2014, per the favor-newest-Wallach-number rule) for the 38 mg placement, but the two figures are far enough apart that the "why this number" copy should either stick strictly to the Epigenetics chain OR openly note the older, higher Rare Earths range. Do NOT silently blend them.

## 5. Gaps / flags + SOLO-vs-GROUP verdict

- **claim_text bloat on WAL-CLM-RARE-000245 — trust the verbatim.** The deficiency claim's `claim_text` editorializes far past its own verbatim: it asserts the 100%-collagen figure, the age-decline, the cholesterol/fiber link, and the "200 to 500 mg a day" intake — NONE of which are in its verbatim (verbatim = the deficiency-sign sentence only). Those facts are real, but they live in the OTHER claims (WAL-CLM-RARE-000244 for collagen/age, WAL-CLM-RARE-000246 for cholesterol/dose). When building the header, cite each fact to the claim whose *verbatim* actually carries it — never to 000245 for the collagen or dose numbers.
- **The ~10× dose discrepancy (38 mg vs 200–500 mg).** Covered in §4. This is the single biggest thing to surface — it is not a mismatch to hide, it's a real cross-book difference (1994 vs 2014). Newest wins for placement; the copy must not fudge it.
- **`deficiency_signs` are structural and visible — a real asset.** Unlike silver, silica HAS concrete signs (brittle nails, dry hair, poor skin) — this is what makes a solo header viable at all.
- **No supersession.** All four claims have `superseded_by: null`. The 1994 vs 2014 dose difference is handled by newest-preference, not by a supersession pointer.
- **Thin on breadth.** Only one mapped condition (`cardiovascular_disease`), no interactions, no per-condition protocol, no patient anecdote, no discovery/history/etymology material. There is no second strong angle — the fiber/cholesterol note is one hedged claim.
- **SOLO-vs-GROUP VERDICT: MARGINAL — but solo is defensible, lead with concept A.** Silica is thinner than selenium/copper/silver, but it clears the bar for a bespoke solo header on the strength of ONE genuinely strong, fully-anchored concept: visible structural deficiency signs + a hard 100%-collagen number + an age-decline arc, all cohering. That is a real, self-contained story a reader remembers. It does NOT support a four-concept fan-out and should not be forced into one. If Luneth prefers to consolidate, the natural home would be a **structural / connective-tissue minerals** group alongside other collagen/bone-and-skin trace minerals — but that grouping is a preference call, not a necessity; silica can stand alone.

## 6. Recommended lead concept

**A — "The scaffolding mineral."** It is the only concept the pack fully supports, and it happens to be a good one: concrete, self-checkable deficiency signs, one clean stat (collagen doubled), and a reason-to-care (it drains with age). Build the header as A, fold the age-decline in as its turn, and keep the fiber/cholesterol note (concept B) as an optional inset — not a co-lead. Do not manufacture additional concepts to fill space.
