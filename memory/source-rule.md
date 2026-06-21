# Source Rule — Wallach as Immutable Cornerstone

The single most important rule in this project. It governs what counts as truth
for daily targets, dose recommendations, deficiency indicators, and any other
nutritional or health claim displayed to the user.

Adopted: 2026-06-14, Round 46 (formalization of a rule the user established at
project start and re-confirmed in the Round 46 doctrine session).

---

## The Rule

**Every numeric target, dose recommendation, deficiency indicator, or health
claim displayed by this system must cite a primary source from the allowlist
below. No exceptions, no "just for reference" substitutions, no comparisons to
non-Wallach values surfaced to the user without explicit cornerstone-approval.**

### The allowlist

A source counts as valid if and only if it is:

1. **Wallach corpus primary** — a book (with year), transcript (with date), or
   recorded protocol authored or delivered by Dr. Joel Wallach. Examples:
   - "Dead Doctors Don't Lie (2nd ed., DDDL)"
   - "Let's Play Doctor"
   - "Hell's Kitchen" transcript, [date]
   - "Wallach Files" Dr. Wallach Hour episode [number/date]
   - Wallach-authored or Wallach-delivered protocol documents

2. **Youngevity primary** — a Youngevity product label image, official product
   page URL (under youngevity.com), or official company statement. Examples:
   - Beyond Tangy Tangerine 2.5 product label
   - Ultimate EFA Plus product label
   - Survival Shield X-2 product page (youngevity.com)
   - Official Youngevity company FAQ entry

3. **Pack-extrapolation derived** — a computed value derived purely from summing
   Youngevity primary labels at Wallach's stated daily-servings recommendation
   (e.g., Healthy Body Start Pak 2.5 component sums). The source field must
   reference both Wallach's pack recommendation AND the Youngevity component
   labels.

### What is NOT allowed

- USDA RDIs / DRIs / DVs / Daily Values
- General nutritional science papers (PubMed, NIH, etc.) as a target source
- Industry organizations (Council for Responsible Nutrition, etc.)
- Wikipedia or general reference sources
- Other practitioners' protocols (Linus Pauling, Ray Peat, etc.) — even if
  ostensibly aligned with Wallach
- "Standard" or "conventional" or "mainstream" values for comparison surfaced
  to the user
- Web-search results without primary-source verification
- LLM-generated values without primary-source citation

### Why this rule exists

The user's project is the digital expression of Dr. Wallach's complete framework
for the 90 essentials. Mixing other sources of truth into the system would:
- Poison the integrity of the framework being preserved
- Confuse users about what "Wallach's recommendation" actually is
- Introduce contradictions the system would then have to mediate
- Defeat the purpose of the project (preserving and emulating Wallach's
  knowledge specifically, not "general nutrition advice")

This is true even when other sources would suggest "compatible" values. The
project's value is not "best-guess nutrition advice"; it's "Wallach's actual
framework, faithfully represented." That requires the source rule.

---

## Structural enforcement

Every entry in `essentials-targets.json` and any other data file with numeric
targets must carry a `source` field whose value matches the allowlist. The
integrity tool's `check_source_rule` step validates this on every check cycle.
Entries without a valid source are flagged.

**State as of 2026-06-14 (Round 56 / P1 backfill complete): the validator is
in ERROR-MODE.** All 92 essentials-targets entries cite an allowlisted Wallach
or Youngevity primary source. Any new entry without an allowlisted source
fails the integrity check immediately — the cornerstone is now structurally
enforced, not just policy.

The allowlist markers maintained in tools/dashboard_integrity.py check_source_rule
mirror this file's allowlist section. When the allowlist evolves, both must
update in the same patch (single source of truth — operating-protocols.md §10).

Initial state (Round 46): the validator was in warn-only mode pending backfill.
That phase is now closed.

---

## The three-confirm override protocol

If a change is proposed — by Claude or by the user — that would introduce a
new source of truth, surface non-Wallach values to the user, or otherwise touch
the source-rule boundary, the protocol is:

**Step 1: Flag.** Claude surfaces the proposed change with the literal tag
`[WALLACH-SOURCE-RULE: PROPOSED VIOLATION]` in the response. Claude describes
what the proposed change is, what part of the rule it would violate, and why
the user (or Claude) is considering it.

**Step 2: Verify understanding.** In a subsequent conversational turn (the
turn-gap is mandatory; same-turn confirmations don't count), the user confirms
they understand the rule, understand the proposed violation, and understand
the precedent setting it would establish. Claude states the precedent
explicitly so the user can confirm against the actual implications.

**Step 3: Final go-ahead.** In a third conversational turn, the user gives the
explicit final go-ahead with the exact phrase `APPROVE SOURCE-RULE OVERRIDE`.
Anything else — "yes," "go ahead," "sure," "approved" — does not count.

**Logging.** Every triggered review, whether ultimately approved or rejected,
is logged to `memory/source-rule-audit.md` with the date, the round number,
the proposed change, the rationale, and the outcome.

**Symmetric application.** This protocol applies whether Claude or the user
initiates the proposed violation. If the user says something that would break
the rule, Claude flags it and starts the protocol — does not defer to user
authority. The user explicitly opted into this constraint as a guardrail
against their own future drift.

---

## What is NOT covered by this rule

The rule covers numeric targets, dose recommendations, deficiency indicators,
and health claims. It does NOT cover:

- **Mechanism explanations** that draw on the broader biology literature
  (e.g., explaining what magnesium does at the cellular level). These are
  descriptive context, not target sources.
- **Tool selection** (e.g., choosing JSON Schema as a validation library —
  source-rule doesn't apply to engineering choices).
- **General reference information** clearly marked as such and not surfaced as
  Wallach's view (e.g., "the FDA's Daily Value for vitamin C is 90 mg, which
  is below Wallach's recommended range").

When ambiguous, default to applying the rule. Over-application is recoverable;
under-application erodes the cornerstone.

---

## Amendment

This rule is not amendable through normal change processes. Any proposed
amendment to the source rule itself goes through the three-confirm protocol
with the additional requirement that the user re-state the rationale for the
cornerstone in their own words at Step 2. This is to prevent reflexive
approval — amending the cornerstone requires actively reaffirming why it
exists.


---

## The Two-Role Split — Youngevity as operational arithmetic, Wallach as framework + educational layer (Round 99 doctrinal clarification, codified Round 100)

Refinement and extension of the Round 24 *"Pack-extrapolation as the operational answer for daily targets"* decision. The Round 99 coverage-pipeline unification surfaced a semantic contradiction (Periodic Table classified coverage against pack-delivery; Label Check computed gap-fill % against book-range — two different "covered" thresholds in one dashboard). Luneth's articulated resolution closed it cleanly:

### The user's articulation, verbatim

> *"Youngevity.com as the global dashboard standard when it comes to ALL nutrients goals/daily numbers. Wallach as the honored standard when it comes to INCLUDING HIM. IF he has made an explicit statement about dosage, the person should know about it, know the context around it clearly (quote concept from before) so they can read and determine for themselves if it's contextual or specific to an illness or something to weigh OVER the system itself and to report as an issue..."*

### Concretely

**Youngevity-website-derived numbers** (the Healthy Body Start Pak 2.5 component labels, summed at label-stated daily servings — i.e., what `TARGETS_DATA` carries in the dashboard with `kind:'hbsp'`) are the **canonical operational source** for ALL daily targets, "% toward goal" math, "covered?" classification, gap-fill calculation, and adoption-preview math across every dashboard surface. This is the verdict math.

**Wallach's stated book/transcript stances** retire from verdict math. They move to the **educational layer** — quotes, book references, transcript snippets that explain WHY the operational target is set where it is. *"Wallach in DDDL p. 247: '2,000–5,000 mg/day Calcium for adults...'"* is presented as the WHY behind the HBSP 2.5 number, not as a competing threshold the user has to reconcile.

### The two-role split visualized

| Surface | Operational source (drives math) | Educational layer (explains why) |
|---|---|---|
| Periodic Table tile classification | TARGETS_DATA `target.low` | Wallach stance in detail panel (planned) |
| Label Check gap-fill % | TARGETS_DATA `target.low` | Wallach stance in detail panel (planned) |
| Adoption preview | TARGETS_DATA `target.low` | Wallach stance in adoption modal (planned) |
| Detail panel "Daily target" row | TARGETS_DATA `target.{low,high,unit,note}` | Wallach corpus citation pills (existing) |

### The source-rule cornerstone is unchanged in form

Both Youngevity AND Wallach remain allowlisted primary sources per this rule's Allowlist section. **What changes is which ROLE each source plays in which surface.** The override protocol is unchanged. The cornerstone is unchanged. The clarification names how the two allowlist categories interact when they could BOTH supply a target value for the same essential.

### The reasoning chain (Luneth-articulated)

1. **Youngevity is Wallach's own company.** Site labels carry his approval by design — he'd not tolerate wrong info on his own site. If a Youngevity product page lists Boron at 1 mg/day per serving, that's effectively Wallach's stance (or close enough) for that operational dose.
2. **Wallach's book/transcript ranges are often individual-treatment-contextual, not universal doctrine.** Lysine for herpes, Tryptophan for anxiety, Boron clinical protocols — these are situational, not population-wide daily targets. Pack-extrapolation gives a complete, internally-consistent 92-entry dataset at the population-baseline level.
3. **The contradiction was the user-facing harm.** Two definitions of "covered" in one dashboard is worse than one definition that loses some semantic detail. Unifying eliminates the contradiction; the lost detail (Wallach's range nuance) moves to the educational layer where it's still surfaced, just not used for verdict math.
4. **Future expansion path stays open.** If we ever have vast new Wallach corpus AND can cross-reference per-essential for general range + clinical lever + optimal point, we can reconsider. Until then (effectively until a long-form corpus expansion that's unlikely without new Wallach material), pack-extrapolation is the right operational answer.

### Risk acknowledgment

If Youngevity's website becomes untrustworthy (Wallach passes away and a successor diverges; the company restructures; a label drift goes undetected), the operational source is compromised. **The backup discipline:** preserve the canonical Youngevity-derived dataset (`knowledge/essentials-targets.json` + dashboard's `essentials-targets-data` embed) in versioned form. If the website ever becomes unreliable, the system can be locked to a known-good snapshot of the operational targets. The Round 99 commitment is operational while Youngevity remains trustworthy; the lock-down fallback is the contingency.

### What this rule does NOT change

- The override protocol (three-confirm `APPROVE SOURCE-RULE OVERRIDE`) for ANY change to the allowlist or the source-rule itself.
- Wallach's voice as the framework authority — the engineering doctrine, the operating protocols, the deficiency-first lens, the Creator's Log, every doctrinal layer that names Wallach is unchanged.
- The pack-extrapolation discipline from Round 24. This clarification extends it from "trace_pdm + amino_aliens" to all 92 essentials with the explicit two-role naming.

### The Wallach-stance educational reframing round (open-threads, deferred)

A future round will go through the corpus, find Wallach's actual stated stance per essential where it exists, and embed as quote-shaped educational content on the detail panel. *"Wallach in DDDL p. 247: '2,000–5,000 mg/day Calcium for adults...'"* — presented as the WHY behind the HBSP delivery point, not as a competing number. Filed in open-threads as the *"Wallach-stance educational reframing round"* item.
