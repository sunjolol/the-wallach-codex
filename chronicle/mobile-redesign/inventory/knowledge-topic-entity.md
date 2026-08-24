# Knowledge topic pages + the Entity page — feature inventory

**Scope of this document.** Three renderers and the shared machinery under them:

| Renderer | File | Root class | Opened by |
|---|---|---|---|
| Essential entity page | `views/entity-page.ts::renderEssentialPage` (L1904) | `.kd-essential-deep.kd-ep` | `data-kd-essential="<layout_key>"` |
| Condition entity page | `views/entity-page.ts::renderConditionPage` (L2190) | `.kd-essential-deep.kd-ep.kd-ep--cond` | `data-kd-condition="<slug>"` |
| Explore topic page | `views/knowledge-topic.ts::renderTopicPage` (L96) | `.kt-page.kd-ep` | `data-kd-topic="<slug>"` |
| Shared claim card | `views/entity-page.ts::renderSearchCard` (exported, L206) | `.kd-ep-claim` | — |
| Term gloss | `views/glossify.ts` + `views/gloss-tooltip.ts` | `.gloss` / `.gloss-tip` | — |

Also read: `views/knowledge.ts` (the host drawer: routing, breadcrumbs, filters, re-render),
`styles/drawer-knowledge.css` (L1436–2756 is the `kd-ep-*` / `kt-*` block), `styles/drawer-shared.css`,
`core/schemas/entity-page.ts`, `core/schemas/search.ts`, `core/schemas/corpus.ts`,
`state/search.ts`, `state/entity-copy.ts`, `state/glossary.ts`, `state/coverage.ts`,
`data/view-copy.json`, `data/entity-page-data.json`, `data/search/search-index.json`,
`data/mechanism-clarity-data.json`, `data/fatty-acid-clarity-data.json`.

**Magnitudes the rebuild must survive** (measured from the shipped artifacts, not estimated):

- 91 essential pages · 510 condition pages · 142 topic pages (547 search entities total).
- 2,579 search claims · 1,260 glossary terms · 7 books.
- Per essential: `distinct_claim_count` min 2 / median 16 / **max 201** (calcium). Worth-Knowing
  claims max 181. Full-Record rows median 0 / max 21. Facet groups median 8 / max 13.
- Per essential: conditions pills median 3 / **max 103**, works_with max 4, related exactly 8 or 0.
- Per condition: claims median 2 / max 76 (cancer 91 incl. also_about). `restore` max 23.
- Text lengths: question max 93 chars; `answer_short` **max 892** chars (the schema comment says
  "≤160-char"; the data disagrees — see Open questions); `answer` max 2,381; `verbatim` max 1,186.
- 36 essentials carry `group_record`; 34 carry `target.kind === 'trace_pdm'`.
- 6 essentials carry a mechanism hero: selenium, copper, zinc (legacy order); calcium, magnesium,
  vitamin-a (composed block list). 3 omega families carry a fatty-acid block.

---

## Destinations & states

### A. Essential entity page

The page is one linear column. Section order (from `renderEssentialPage`):

1. `.kd-ep-hero` — element symbol chip · H1 friendly name · meta line · back button.
2. `.kd-ep-flag` — the NON-ESSENTIAL banner (suppressed when the non-essential *glance* renders).
3. `.kd-ep-lede` — the approved one-paragraph intro (`entity-copy.json`; `''` → omitted).
4. Section label **"At a glance — Daily Needs & How It Works"**.
5. `.kd-ep-op` — the glance card. **Seven mutually exclusive variants**, see A1–A7 below.
6. Fatty-acid block (`fattyAcidBlockFor`) — 4 variants, see A8.
7. Mechanism hero (`renderMechanism`) — renders only for 6 slugs, see A9.
8. Plant-derived "how it works" hero (`renderPdmClarity`) — renders only when `group_record` exists.
9. **"Worth knowing"** (hint: `tap a question`) — faceted `<details>` groups of search cards.
10. **"Need help with a condition?"** — orange condition pill cloud + lead sentence.
11. **"Works with"** — green nutrient pill cloud + lead sentence.
12. **"About the plant-derived group"** (hint: `shared across the 34 plant-derived elements`).
13. **"The full record"** (hint: `everything not shown above · advanced`) — keyword filter + kind groups.
14. **"Keep exploring"** — violet mixed pill cloud.

Every one of 3–14 self-suppresses to `''` when its data is empty. There is no per-slug branch anywhere;
the page is a pure projection and the rebuild must keep it one (gate: `entity_render_is_projection`).

**Glance variants (mutually exclusive, decided in `renderAtAGlance`, in this precedence order):**

- **A1 · PDM group** (`tile.pdmGroup && snapshot.pdmGroup`) — one shared meter for all 34 trace_pdm
  minerals: goal `924 mg / day`, sum of delivered mg, bar, `N% of the plant-derived group goal — <verdict>`,
  a `how is this calculated?` hover carrying the full derivation, a "Plant Derived" tag chip, and a
  group note. **No per-element target exists and none may be invented.**
- **A2 · Mirror** (`tile.mirrorsOf`) — cobalt only today. Target box reads "None — and that is
  deliberate"; coverage reads `N%` of the *mirrored* essential with a `via Vitamin B12` chip; then a
  three-part explanation (lead / body / foot) and an orange CTA button to the essential that carries
  the dose. Keyed off `target.kind`, never a slug.
- **A3 · Present, stated zero** (`noTargetReason === 'present_stated_zero'`) — phosphorus. "None needed"
  + status pill + "present by default" + the Wallach-table explanation.
- **A4 · Present, structural** (`present_structural`) — H / C / N / O. Same shape, different body copy.
- **A5 · Non-essential** (`non_essential`) — omega-9 only. "None — not one of the 90", status
  "Not tracked", an orange `--aside` callout (eyebrow / lead / two body paragraphs) and a CTA to
  Omega-6, then its own Best-Youngevity-sources block.
- **A6 · Ceiling only** (`essentialCeiling(slug)` and no `intakeVsTarget`) — silver. Label swaps to
  "Wallach's stated safe intake"; sub-line "Upper limit, no stated daily amount for this one."
- **A7 · Standard** — two-column grid: left = "Wallach daily target" big numeral + unit (+ range
  `low–high`) + the `why this number?` hover; right = "Your coverage" `delivered / target unit`,
  a fill bar (green when met, orange otherwise) and `N% of Wallach's daily target`.
  When there is a target but no numeric readout, the right column falls back to a status pill.
  When there is neither, the left column shows `ep_no_target` (the honest-gap paragraph).

Under A5/A6/A7 sits `renderSourcesBlock`: an `hr`, the label **"Best Youngevity sources"**,
an optional approved diet note, 5 source rows, and a `Show all N sources` reveal. When no product
carries the essential but a diet note exists, the label swaps to **"Where this comes from"** and only
the note renders (germanium is the case that forced this). Rows whose composition is `0` are dropped —
16 rows in the shipped pillar declare zero and are *not* sources. The lowest cost-per-delivered-unit
product is tagged `best value` and is **swapped into the last visible slot** if it would otherwise
rank 6th or lower, so the tag is never buried under "Show all".

- **A0 · No artifact record** — a guard path: hero + At-a-glance + `ep_empty_record`. Not live today
  (all 91 canon slugs have a record) but must survive.

**A8 · Fatty-acid block variants**

- omega-6 → the full **family experience**: eyebrow, kill line, a deterministic triad SVG (ALA/LA
  solid + AA dashed, `makes` arrow, bracket "you must eat these — the 2 in the 90", tag
  "conditional · body-made"), three numbered steps, a sealed pull-quote, a general-reference note,
  and its own sources block.
- omega-3 → the **three-forms** rich block (SVG with PLANT/MARINE labels + "the essential one" tag),
  three rich rows, disclaimer, **then** an orange CTA to omega-6, **then** its own sources block.
- omega-9 → nothing here (A5 owns it).
- any other essential → nothing.

Note the **source-deferral rule**: when the fatty-acid block or a mechanism hero renders, the glance
does *not* render sources — they move to the bottom of that hero instead (`deferSources`). This is
the "Best-Youngevity-sources ALWAYS at the bottom" doctrine made mechanical.

**A9 · Mechanism hero variants** (`.kd-ep-fam--mech`, tinted by the element's category)

Two render paths, one emitter set:
- *Legacy fixed order* (selenium, copper, zinc): eyebrow → kill → opener/hook → hero figure → split →
  bridge → pre-beats figure → beats → post-beats figure → coda → stat → quote.
- *Composed block list* (calcium `cards`, magnesium, vitamin-a `vita`): exactly the declared blocks in
  declared order. Block types: `eyebrow, kill, opener, figure, prose, split, beats, stat, quote,
  compare, explain, curio`. The switch is exhaustive with no default — adding a block type without a
  case is a compile error, not a silent blank.

Nine named figure keys are drawn as inline SVG: `rancidity, cofactor_fork, decline_rail,
reversal_rail, nail_spots, metal_fingers, disease_scale, heartbeat, mg_cycle`. All deterministic
(no `Math.random` — stable for probes) and theme-aware through CSS classes, not fills.

Sub-units inside a mechanism hero: `opener` (figure beside two lines), `split` (a 2x2 grid — both
prose cells, then both evidence cells, so the evidence row top-aligns by construction), `beats`
(numbered steps, optional `--row` 3-column layout, optional big numeral, optional per-beat `hook`
line and per-beat CTA button), `stat` (readout / big numeral / label), `compare` (two trade-off
cards with `+`/`−` chips), `explain` (mono label + accent-bordered paragraph), `curio` (eyebrow /
display headline / body / cite), `proportion field` (a dot field where the picture *is* the number —
no numeral is drawn inside it; the legend rows carry the reading in text, which is also what a
screen reader gets, because the art is `aria-hidden`).

Every mechanism hero ends with the shared disclaimer and its own sources block.

**A10 · Full-record states** — kind groups are `open` by default only when the total is `< 20`;
larger records render collapsed. Filter states: idle · matching (non-matching cards get `.kd-hidden`,
matching groups are force-opened) · empty (`— no claim matches "<q>" —` appended to the drawer body).

**A11 · Facet overflow** — Worth-Knowing shows the first **7** cards per facet; the rest sit behind
`See N more answers`. A display cap, never a data cap: the header count stays the true total.

### B. Condition entity page

Order: hero (category-tinted, category glyph + category chip + `N claims · N books`) · umbrella tip ·
synopsis lede · **"Worth knowing"** · **"Nutrients to restore"** · **"Best products for this"** ·
**"The full picture"** · **"Related conditions"** · **"Keep exploring"**.

Facet order is deliberately different from an essential's: conditions lead with `stance`, then
`mechanism`, `protocol`, `warning`, … (`FACET_ORDER_BY_TYPE`) because a disease page's compelling
content is the cause and the cure, not a diagnostic caution.

States:
- **B0** no artifact record → name + `ep_empty_record`. A **real** path, not a guard: not every
  catalog condition has a generated record.
- **B1** umbrella tip renders only when the condition has named subtypes **and** ≥ 15 claims.
- **B2** synopsis is derived, not authored: "Wallach links X to a deficiency of A, B and C." or
  "Wallach's protocol for X centers on …", capped at 4 names + "among others", else `''`.
- **B3** Nutrients-to-restore has a **primary-label swap**: normally green "To restore"; when
  `restore` is empty the deficiency set is promoted and the label becomes "Caused by these
  deficiencies". Two collapsed lenses below: "Caused by these deficiencies" (amber dot) and
  "Also cited alongside" (grey dot), each with its own `Expand ▾ / Collapse ▴` pill.
- **B4** Best-products renders only when `restore` is non-empty and the recommender returns rows;
  each row reads `covers N / M` + wholesale price; "best value" = most nutrients per ten dollars.
- **B5** Related-conditions and Keep-exploring de-duplicate against each other.

### C. Explore topic page

A **full-body overlay** on top of whichever tab opened it (the origin tab stays active). Order:
kicker (`<type> · Explore`) + back button · symbol chip + H1 · lede · related pills · meta line ·
faceted claim groups (all `open`, **no per-facet cap** — unlike the essential page).

States:
- **C0** unknown slug → `renderTopicPage` returns `''` and the host silently falls through to the
  origin tab's own content.
- **C1** back label is `‹ All topics` when opened from the Explore tab, `‹ Go back` otherwise.
- **C2** a related pill renders as a **static, unclickable chip** when its slug resolves to no page in
  either registry. Deliberate: a dead button that looks live is worse than an honest static chip.
  Routing consults **two** registries (search entities *and* the corpus); a registry `type` wins, so
  an entity that is both a registry element and a corpus essential (gold, hydrogen, potassium) opens
  the *topic* page, not the essential page.
- **C3** meta line has two forms: `N sourced claims · from <book, book>` or `N sourced claims`.
- **C4** symbol chip / lede / related block each omit when absent.

### D. Host-shell states that wrap all three

- **D1 · The entity page is PREPENDED to the full index grid.** `renderEssentialsTab` returns
  `${deepHTML}${groupsHTML}` — scrolling past a calcium page dumps you into the 91-tile essentials
  grid. `renderConditionsTab` does the same with **510** condition rows below the open condition.
  The topic overlay does not do this. On a phone this means an entity page has no end.
- **D2 · A per-tab search box sits above the open entity page** ("SEARCH ESSENTIALS…"), filtering the
  index below it, not the page you are reading. On a full-record page there are **two** search inputs
  on screen doing different things.
- **D3 · Breadcrumb rail** (`.kd-crumbs`), capped at 6 entries, with a loop guard: re-opening an
  entity already in the trail truncates back to it rather than growing. The origin anchor is the tab.
- **D4 · Scrollbar tint** — the selected entity's category colour is published on `<html>` as
  `--kd-detail-scroll` (a WebKit scrollbar pseudo reads only root-level custom properties).
- **D5 · Full re-render on `regimen:changed`.** The drawer replaces `container.innerHTML`. There is
  **no scroll preservation** in this drawer (`views/scroll-keep.ts` is wired to Coverage and Regimen
  only). Adding a product to the regimen while reading an entity page **resets scroll to the top and
  collapses every open `<details>`.** Flagged loudly — on a 200-claim page this is brutal.
- **D6 · Every `<details>` state is markup, not state.** Open/closed lives only in the DOM, so any
  re-render (tab switch, crumb jump, regimen change) discards it.

---

## Controls

| Control | What it does | Where it lives | Touch-hostile? |
|---|---|---|---|
| `.kd-ep-back` (`data-kd-action="essential-close"` / `"condition-close"`) | Clears the detail + trail, returns to the tile grid | Top-right of the hero, `white-space:nowrap; flex:0 0 auto` | Reachable, but top-right is the worst thumb corner on a phone |
| `.kd-ep-back` on the topic page (`topic-close`) | Clears the topic overlay, returns to origin tab | Top-right of `.kt-hero__top` | Same |
| `.kt-kicker__link` (`explore-home`) | Jumps to the all-topics grid, clearing every selection | Inline inside the kicker line | Dotted-underline text link at `--ds-text-micro`; far under 44 px |
| `.kd-crumb` (`data-kd-crumb="<i>"`) | Jumps back to trail position *i* | Top of `.kd-body` | Small inline text buttons separated by `›` |
| `.kd-ep-why` + `.kd-ep-tip` | Reveals the **daily-target provenance** ("why this number?") | Under the target numeral | **CSS `:hover` ONLY. No tabindex, no role, no click handler, not wired to the gloss layer. On touch this content is UNREACHABLE.** |
| `.gloss` (`role="button" tabindex="0"`) | Reveals a glossary term definition | Inline in claim text, verbatims, mech prose, Fig-8-1 legend | Wired for hover **and** click/focus — but see the `<summary>` collision below |
| `.kd-ep-claim` `<summary>` | Expands one claim card | Worth-knowing, full record, topic page, group record | Native `<details>`; whole summary row is the target — OK |
| `.kd-ep-facet` `<summary>` | Collapses/expands one facet group | Worth-knowing, group record, topic page | OK |
| `.kd-ep-kind` `<summary>` | Collapses/expands one kind group | Full record | OK |
| `.kd-ep-record` `<summary>` (`All N claims`) | Collapses the whole full-record block | Full record | OK |
| `.kd-ep-more` `<summary>` | `Show all N` / `Show all N sources` / `Show all N products` / `See N more answers` | Pill clouds, source lists, facet overflow | Dashed pill, `.35rem .75rem` padding → ~28 px tall |
| `.kd-ep-filter` (`<input maxlength=120>`) | Filters the full record in place: matches card text **plus** the hidden `data-question` | Inside `.kd-ep-filterbar`, above the kind groups | Fires per keystroke; opens matching groups; has **no clear button** (unlike the tab search) |
| `.kd-ep-pill` (`data-kd-essential` / `data-kd-condition`) | Navigates to another entity page | Conditions / Works-with / Keep-exploring clouds | `padding:3px 9px`, `font-size:xs` → **far** under 44 px; up to 103 on one page |
| `.kt-pill` | Same, on the topic page | `.kt-rel` | `padding:3px 10px` — same problem |
| `.kd-ep-src` (`data-kd-product`) | Opens the product detail panel | Best-Youngevity-sources, PDM sources, condition products | 5-slot flex row (`icon · name · amount · price · ›`), ~34 px tall; reflows badly under 375 px |
| `.kd-ep-mirror__cta` (`data-kd-essential`) | Jumps to the essential that carries the dose (cobalt→B12, omega-9→omega-6, omega-3→omega-6) | Mirror / non-essential glance, omega-3 block | The one genuinely large, thumb-friendly control on the page |
| `.kd-ep-getit__prod` (`data-kd-product`) | "Where to get it" product pointer | Group record, first actionable bucket only | Small chip |
| `.kd-ep-fam__cta` (`data-kd-tab="<tab>"`) | Jumps to a Knowledge tab from inside a mechanism beat | Mechanism beats (data-declared) | Small inline button |
| `.kd-ep-nutri__rel` `<summary>` + `Expand ▾ / Collapse ▴` | Opens a relationship lens | Condition page | The explicit toggle pill exists *because* a bare chevron read as un-clickable — keep that lesson |
| `ui-close` (`data-kd-action="close"`) | Closes the whole drawer | Drawer header | Icon-only; has `aria-label` and `title` |
| `.kd-knh__tab` (`data-kd-tab`) | Switches Knowledge tab, **clearing every selection and the trail** | Drawer header | Horizontal `white-space:nowrap` pill row — overflows a phone |
| `.kd-search-input` / `.kd-search-clear` | Filters the index list *below* the entity page | Above `.kd-body` | Confusing adjacency on a small screen (D2) |
| `data-kd-action="sources-more"` | Legacy: toggles `.kd-sources` (the OLD source list) | **Not emitted by the entity page any more** | Dead path — do not port |

---

## Data points rendered

### Shared claim card — search shape (`renderSearchCard`)

| Datum | Source field | Format / unit | Why it matters |
|---|---|---|---|
| Badge | — | Literal `?` glyph in a family-coloured circle | Signals "this is a question" |
| Question | `SearchClaim.question` | Plain text, ≤93 chars observed | The words a reader would actually type |
| Preview | `SearchClaim.answer_short` | 2-line `-webkit-line-clamp`, hidden when open | The scannable TL;DR |
| Short answer | `SearchClaim.answer_short` | Bold, family-coloured, shown when open | Lead-with-the-answer |
| Full answer | `SearchClaim.answer` | `white-space: pre-line`, glossified | **Omitted when it equals `answer_short`** |
| Verbatim | `SearchClaim.verbatim` | Whitespace-collapsed, wrapped in typographic quotes, italic serif, glossified | Wallach's exact words (§00.A) |
| Citation | `composeCite(claim)` | `— Dr. Joel Wallach · <BOOK TITLE> (<year>) · P.<page>` | Book **and page** provenance |
| Topic tags | `SearchClaim.topics` | `#tag` chips, up to 14 | Retrieval handles |
| *(not rendered)* | `SearchClaim.see_also` | — | **Rendered only in `views/search.ts`. The entity page silently drops it.** Only 1 claim carries one today. |

### Shared claim card — record shape (`renderRecordClaim`)

| Datum | Source field | Format / unit | Why it matters |
|---|---|---|---|
| Summary line | `CorpusClaim.claim_text` | Truncated to 116 chars on a word boundary + `…` | The collapsed row |
| Full paraphrase | `CorpusClaim.claim_text` | Glossified; **swaps in place of the summary when open** (pure CSS) | Full statement |
| Hidden question | `getSearchClaim(id).question` | `data-question` attribute, **never printed** | Makes the keyword filter match the question a user would type |
| Dose value | `CorpusClaim.dose` → `formatDose` | `"<amount> <unit> / <period>"` | The number itself |
| Dose context label | `doseContextLabel` | `for <Name A + Name B>` (from `dose.applies_to`) **outranks** `for_condition`; Fig-8-1 rows read `True Supplement Need` | Prevents a card asserting a dose for an essential the claim does not dose — the cobalt bug |
| Fig-8-1 legend | literal | `Fig. 8-1 columns` / `Nutrient · RDA · True Supplement Need · 30-Day Pharmacologic`, each column glossed | Otherwise a row of naked numbers |
| Table/figure header | `CorpusClaim.source_table` | `<label>` + `as printed in Wallach's book` | Keeps the ref out of the reader-facing paraphrase |
| Verbatim | `CorpusClaim.verbatim` | Fig-8-1 rows keep hard line breaks (`--rows`, `white-space:pre-line`) and are trimmed to **the clicked nutrient's own row** (drops the bled next row + footnotes); everything else collapses to one line | Wallach's words |
| Citation | `getBookLabel(claim.book)` | `CITED · <BOOK>` (no page on this shape) | Provenance |
| Family colour | `kindCategory(kind)` → `data-family` | green / teal / amber / orange / violet / red | Colour is never a TS literal |

### Essential page

| Datum | Source | Format / unit | Why it matters |
|---|---|---|---|
| Symbol | `EssentialPage.symbol` | Chip | Element identity |
| Friendly name (H1) | `EssentialPage.name` (`common_name`) | `--ds-text-2xl` display | — |
| Scientific name | `EssentialPage.scientific_name` | Leads the meta line **only when it differs** from `name` | Saves a whole row |
| Meta line | composed | `<sci> · <category> · N claims · N books` | Trust signal |
| Non-essential flag | `EssentialPage.is_essential` | `ep_non_essential` banner | Suppressed when the A5 glance renders (the point is made once) |
| Lede | `entity-copy.json → essentials[slug].lede` | Serif, `max-width:69ch` | Approved copy, never auto-derived |
| Wallach daily target | `tile.intakeVsTarget.targetLow/High/unit` | `1,500` / `1,500–2,000` + `<small>unit</small>`, thousands-grouped | The number (§00.A) |
| Ceiling | `essentialCeiling(slug)` | Same numeral under a different label | A ceiling is not a target and must not be scored |
| Why-this-number | `entity-copy.json → essentials[slug].why` | Hover tip, 280 px wide, absolute-positioned | **The "every essential explains why this target" rule lives entirely inside a hover.** |
| Delivered amount | `tile.intakeVsTarget.deliveredAmount` | `<delivered> / <target> <unit>` | Live regimen join |
| Fill bar | `tile.fillPercent` | 7 px bar, clamped to 100 %, green when met, orange otherwise | The gap map |
| Percent | derived | `N% of Wallach's daily target` | — |
| Status pill | `tile.status` | `● COVERED / PARTIAL / GAP / PENDING` | Fallback when no numeric target |
| Source rows | `rankedSourcesForEssential(layoutKey)` | `icon · name [best value] · <amount> <unit> · $<price> · ›` | Wholesale is the featured price |
| Sub-mg rescale | `fmtAmount` | `< 1 mg` is expressed in **mcg** (0.04 mg → `40 mcg`) | Otherwise silver's row read `0 mg` — asserting the product contains none of the thing it is recommended for |
| Diet note | `entity-copy.json → sourcesNote` | Serif paragraph **above** the rows | Answers the question the rows provoke before the reader finishes being confused by them |
| PDM goal | `pdmGoalProvenance()` | `924 mg / day` + the full derivation (dose per body weight, mg per fl oz, reference body weight) in a hover | Group target, never per-element |
| Facet groups | `EssentialPage.search[]` | `<details open>` label + true count | 13-facet closed taxonomy |
| Kind groups | `EssentialPage.record[]` | Ordered dose → protocol → deficiency_sign → toxicity_sign → mechanism → definition → prognosis, then alphabetical | Actionable first, signs second, science third |
| Condition pills | `EssentialPage.conditions[]` | Orange, first 12 inline, rest behind `Show all N` | Median 3, max 103 |
| Works-with pills | `EssentialPage.works_with[]` | Green, first 12 inline | Genuine interaction partners, not co-occurrence |
| Keep-exploring pills | `EssentialPage.related[]` | Violet, all inline | Co-occurrence graph |
| Group claims | `EssentialPage.group_record[]` | Facet buckets in derive-declared order; `Where to get it` rides the first actionable bucket only | Shared across the plant-derived elements — labelled SHARED so a reader does not read them as strontium-specific |

### Condition page

| Datum | Source | Format / unit |
|---|---|---|
| Category glyph + colour + label | `condition-categories.json` via `conditionCategory(slug)` | Author-vetted inline SVG rendered **un-escaped by design** + `--cat` inline custom property + chip |
| Name / meta | `ConditionPage.name` / `claim_count` / `books` | `N claims · N books` |
| Umbrella tip | `umbrellaChildren(slug)` | `**Broad category** — this collects every subtype… (e.g. *A*, *B*).` |
| Synopsis | derived from `claims_by_role` | See B2 |
| Restore set | `ConditionPage.restore` (directed maps(E,C)) | Green pills |
| Cause set | `essentialsInRoles(c, ['deficiency_signs','causes'])` | Amber-dot lens |
| Also set | `c.essentials_involved` minus the shown | Grey-dot lens |
| Product rows | `rankProductsForCoverage({want: restore, limit: 8})` | `covers N / M` + `$<wholesale>`; `best value` = highest `perTenDollars` |

### Topic page

| Datum | Source | Format / unit |
|---|---|---|
| Kicker type | `SearchEntity.type` | one of `element, nutrient, substance, condition, concept, topic, person, event` |
| Symbol | `SearchEntity.symbol` | Chip (66 of 547 entities have one) |
| Title | `common_name ?? display_name` | 2.1 rem display |
| Lede | authored `entity-copy.json → topics[slug].lede`, else the hand-picked `intro_claim`'s `answer_short`, else the highest-priority facet's `answer_short` | soft-clamped on a word boundary |
| Related pills | `SearchEntity.related` | 0–16 pills, routed through **both** registries |
| Meta | `facetGroups` claim total + `booksForSubject` | `N sourced claims · from <books>` |

---

## Copy

Copy lives in three places and the rebuild must respect the split: the **store** (`view-copy.json`,
single-source, gated), **hard-coded literals in `entity-page.ts`** (a real gap — see Open questions),
and **data-file copy** (`entity-copy.json`, `mechanism-clarity-data.json`,
`fatty-acid-clarity-data.json`). Nothing below may be reworded without going through the approval
path; Wallach's own words may not be reworded at all.

### From the copy store (`view-copy.json → ui`)

```
ep_conditions_lead      In Wallach's framework this nutrient is part of the protocol for {n} — open any for its full write-up, or search your own.
ep_coverage_of_target   of Wallach's daily target
ep_empty_record         No sealed Wallach claims for this one yet — the corpus is still being built out.
ep_no_target            No fixed daily amount — Wallach never states an exact number for this one. For a practical guide to daily intake, see the recommended products below.
ep_non_essential        NON-ESSENTIAL — the body can synthesize this, so it is not one of the 90. Shown for completeness; Youngevity includes it for cardiovascular balance and absorption.
ep_record_hint          everything not shown above · advanced
ep_record_hint_cond     everything not shown above, grouped
ep_record_label         The full record
ep_record_label_cond    The full picture
ep_record_note          Grouped by type — open a group, then a claim, for Wallach's exact words and citation.
ep_works_with_lead      Nutrients rarely work alone — Wallach names {n} this one partners with.
kd_claim_dose_appliesto for {name}
kd_ep_ceiling_label     Wallach's stated safe intake
kd_ep_ceiling_note      Upper limit, no stated daily amount for this one.
kd_ep_srcnote_label     Where this comes from
kd_ep_umbrella_lead     Broad category
kd_ep_umbrella_body     this collects every subtype. Open your specific type for a focused view
kt_back                 (back-arrow) All topics
kt_back_generic         (back-arrow) Go back
kt_kicker               Explore
kt_meta                 {n} sourced {noun}
kt_meta_full            {n} sourced {noun} · from {books}
kt_related              Related
```

**Mirror treatment (cobalt).** `kd_ep_mirror_targetlabel` "Wallach daily target" ·
`kd_ep_mirror_notarget` "None — and that is deliberate" · `kd_ep_mirror_covlabel` "Your coverage" ·
`kd_ep_mirror_via` "via {name}" · `kd_ep_mirror_covof` "of your {name} target" · `kd_ep_mirror_lead`
"No target — on purpose." · `kd_ep_mirror_body` "Wallach's requirement is for the cobalt COMPLEX —
vitamin B12 — not for cobalt itself. His own supplement table lists B12 at 400 mcg and no cobalt at
all. So your cobalt rides on your B12, and cobalt listed on a label counts for nothing here." ·
`kd_ep_mirror_foot` "He does call cobalt a cofactor for the thyroid hormone thyroxin — but puts no
number on it." · `kd_ep_mirror_cta` "See the dosage".

**Present-by-default.** `kd_ep_present_targetlabel` "Wallach daily target" · `kd_ep_present_notarget`
"None needed" · `kd_ep_present_covlabel` "Your status" · `kd_ep_present_sub` "present by default" ·
`kd_ep_present_lead` "Present by default." · `kd_ep_present_body_zero` "Wallach's own supplement
table lists this at a need of zero — you already get enough from food, so there is nothing to add." ·
`kd_ep_present_body_structural` "You get all you need from the air you breathe, the water you drink,
and ordinary food. There is nothing to supplement, so no daily target is set."

**Non-essential (omega-9).** `kd_ep_noness_targetlabel` "Wallach daily target" ·
`kd_ep_noness_notarget` "None — not one of the 90" · `kd_ep_noness_covlabel` "Your status" ·
`kd_ep_noness_covword` "Not tracked" · `kd_ep_noness_eyebrow` "Why omega-9 is here" ·
`kd_ep_noness_lead` "Our choice — not Wallach's count." · `kd_ep_noness_body` (full paragraph on why
the tile exists) · `kd_ep_noness_body2` ("What omega-9 is NOT…") · `kd_ep_noness_cta` "the real third
fatty acid".

**Omega-6 family experience.** `kd_ep_fam_eyebrow` "The fatty-acid family" · `kd_ep_fam_kill` "Three
fatty acids. You only have to eat two." · steps `kd_ep_fam_s1_t/b` "The two you must eat",
`kd_ep_fam_s2_t/b` "The conditional third", `kd_ep_fam_s3_t/b` "So — two, or three?" · figure labels
`kd_ep_fam_arrow` "makes", `kd_ep_fam_bracket` "you must eat these — the 2 in the 90",
`kd_ep_fam_condtag` "conditional · body-made" · `kd_ep_fam_note` (the omega-9 caveat) ·
`kd_ep_fam_crosslink` "The full fatty-acid family" · `kd_ep_fam_cta_go` "how the 3 relate".

**Omega-3.** `kd_ep_o3_eyebrow` "Omega-3 · the three forms" · `kd_ep_o3_kill` "One from plants. Two
from the sea." · `kd_ep_o3_ala_tag` "the essential one".

**Plant-derived.** `kd_ep_pdm_targetlabel` "Wallach daily target · group" · `kd_ep_pdm_grouptag`
"Plant Derived" · `kd_ep_pdm_covof` "of the plant-derived group goal" · `kd_ep_pdm_calc_q` "how is
this calculated?" · `kd_ep_pdm_calc_tip` "Wallach doses plant-derived colloidal minerals at {dose}
per {perbw} of body weight, daily. One fl oz carries about {refmg} of mineral solids; for a {bw}
reference adult that works out to {goal}." · `kd_ep_pdm_note` (the group-target thesis) ·
`kd_ep_pdm_hero_eyebrow` "Plant-derived minerals · how they work" · `kd_ep_pdm_hero_kill` "Rock your
body can't absorb — until a plant rebuilds it." · four steps `kd_ep_pdm_s1..s4_t/b` ("It starts as
rock." / "Meltwater carries it out." / "The plant does what your gut can't." / "Now your body can
absorb it.") · figure nodes `kd_ep_pdm_fig_n1..n4` + `kd_ep_pdm_fig_n4stat` "98%" + arrow captions
`kd_ep_pdm_fig_a1..a3` · `kd_ep_pdm_srclabel` "Best plant-derived-mineral sources".

**Facet labels** (`facet_labels`, 13): BASICS · WARNINGS · IN THE BODY · HOW IT WORKS ·
SOURCES & EXPOSURE · USES · WHAT TO DO · WALLACH'S STANCE · BIG QUESTIONS · DISCOVERY · ETYMOLOGY ·
HISTORY & LORE · BIOGRAPHY.

**Kind labels** (`kind_labels`, 14): PROTOCOL · MECHANISM · DEFINITION · DEFICIENCY SIGN · DOSE ·
PREVALENCE · TOXICITY SIGN · PROGNOSIS · INTERACTION · DIAGNOSTIC PATTERN · QUOTE · PERSONAL ANECDOTE ·
CONTRAINDICATION · FOOD SOURCE.

**Disclaimers** (data files, rendered verbatim, must not be softened):
- fatty-acid: "General reference for clarity — not a Wallach claim, not medical advice."
- mechanism: "A plain-language summary of Wallach's mechanism, drawn from his sealed books; his exact
  words appear in the quote above. General education, not medical advice."

### Hard-coded in `entity-page.ts` (NOT in the copy store — port these too)

Section labels: `At a glance` / hint `Daily Needs & How It Works` · `Worth knowing` / hint
`tap a question` · `Need help with a condition?` · `Works with` · `About the plant-derived group` /
hint `shared across the 34 plant-derived elements` · `Keep exploring` · `Nutrients to restore` ·
`Best products for this` / hint `ranked by how many nutrients each covers` · `Related conditions`.

Inline: `Wallach daily target` · `Your coverage` · `why this number?` · `Best Youngevity sources` ·
`best value` · `Where to get it` · `To restore` · `Caused by these deficiencies` ·
`Also cited alongside` · `Expand` / `Collapse` · `covers {n} / {m}` · `All essentials` (back) ·
`All conditions` (back) · `All {n} claims` · `{n} group claims` · `Show all {n}` ·
`Show all {n} sources` · `Show all {n} products` · `See {n} more answers` ·
`Filter these {n} claims by keyword…` · `— no claim matches "{q}" —` · `+{n} more above` ·
`— Dr. Joel Wallach · {cite}` · `CITED · {book}` · `Fig. 8-1 columns` ·
`Nutrient · RDA · True Supplement Need · 30-Day Pharmacologic` · `as printed in Wallach's book` ·
`True Supplement Need` · `COVERED` / `PARTIAL` / `GAP` / `PENDING` · PDM verdict words
`covered` / `partial` / `below goal` / `not covered`.

SVG text baked into figures: `ω-3` `ω-6` · `ALA` `LA` `AA` · `Linolenic` `Linoleic` `Arachidonic` ·
`Se · ON GUARD` · `98%`.

### Typographic marks in use (no emojis anywhere, per project rule)

`?` claim badge · `▸` facet/kind chevron · `▾ ▴` disclosure · `›` row chevron · `‹` back ·
`·` separator · `⌕` filter icon · `—` em dash · `–` en dash (ranges) · curly quotes around verbatims ·
`●` status dot · `+` `−` compare chips · `✓` tick · `*` star marker · `→` CTA arrow · `❡` drawer mark.
Every icon that is not typographic is hand-drawn inline SVG (the bottle glyph on a source row, the
condition category glyphs, the mechanism figures, the drawer close X).

---

## Interaction dependencies

Flagged loudest first.

1. **`.kd-ep-why` → `.kd-ep-tip` is HOVER-ONLY and therefore DEAD ON TOUCH.**
   `#drawer-knowledge-mount .kd-ep-why:hover .kd-ep-tip { display: block; }` is the *only* rule that
   reveals it. The trigger is a bare `<span>` — no `tabindex`, no `role`, no `data-def`, not matched
   by the gloss-tooltip delegate (`.gloss, [data-tip]`). On a phone, *daily-target provenance* — the
   "why this number" answer that the project requires every essential to carry — is unreachable.
   The PDM `how is this calculated?` tip uses the same class and is equally dead. **This is the
   single most important finding in this document.** The rebuild must give provenance a first-class,
   tappable home; it cannot be a tooltip.

2. **`.gloss` inside a `<summary>` double-fires.** A record card puts `glossify(claim.claim_text)`
   inside `.kd-ep-claim__full`, which is inside the `<summary>`. The glossary layer's document-level
   `click` handler shows the tip; the browser's native `<details>` behaviour *also* toggles the card.
   So tapping a glossed word in a card headline opens/closes the card underneath the tooltip. Same
   collision for `glossCol()` in the Fig-8-1 legend when it sits inside a summary. On desktop this
   never surfaced, because hover shows the tip without a click.

3. **`.gloss-tip` is dismissed by any scroll** (`window.addEventListener('scroll', hide, true)`).
   On touch, the momentum/rubber-band scroll a tap can induce will close a tip the user just opened.
   The tip is also `pointer-events: none` and clamped to the viewport with a manual above/below flip
   — a hand-rolled positioner that will need replacing (anchor positioning or popover).

4. **`.gloss` uses `cursor: help`** and a 1 px dotted underline as its whole affordance — invisible
   at phone density, and `cursor` means nothing on touch. 1,260 terms are in the lexicon; a reader
   has no way to know which words are tappable.

5. **Hover-only visual feedback throughout.** ~30 `:hover` rules in the `kd-ep`/`kt` block are the
   only state change for: `.kd-ep-src` (border, background, `translateX(2px)`, icon colour, name
   colour, chevron colour), every pill variant (fill-in on hover is the *entire* signal that a pill
   is a button), `.kd-ep-more > summary`, `.kd-ep-kind > summary`, `.kd-ep-getit__prod`,
   `.kt-pill`, `.kt-kicker__link`, `.kd-ep-back`, `.kd-ep-mirror__cta`, `.kd-ep-fam__cta`,
   `.kd-ep-nutri__toggle`, `.kd-crumb`. **None has an `:active` or `:focus-visible` counterpart.**
   On touch the page has no press feedback at all.

6. **The static-pill distinction is hover-encoded.** `.kd-ep-pill--static` / `.kt-pill--static`
   differ from a live pill by `cursor: default` and a muted border. On touch, "this chip is
   deliberately dead" is indistinguishable from "this chip is broken".

7. **Keyboard-only affordances that have no touch equivalent.** `.kd-search-kbd` renders a `/`
   shortcut hint; the home-hero suggest panel is driven by ArrowUp/ArrowDown/Enter/Escape;
   the drawer closes on Escape. All of these must be re-expressed as touch gestures or controls.

8. **`:focus-within` on `.kd-ep-filterbar`** is the only focus treatment on the page. There is no
   `:focus-visible` ring on any button. Real focus states have to be built, not ported.

9. **Precise-pointer targets.** Pill padding is `3px 9px`; `.kd-ep-more > summary` is
   `.35rem .75rem`; `.kd-ep-tag` is `1px 6px`; `.kd-ep-facet__count` is `1px 7px`; the `.kd-crumb`
   separators are 1-character text. Nothing on this page currently meets 44x44.

10. **No drag, no right-click, no multi-select** anywhere on these three surfaces — that part
    ports cleanly.

11. **`prefers-reduced-motion` is not honoured** in this block: `transform: translateX(2px)`,
    `translateY(-1px)`, `rotate(90deg)` chevrons and the `transition: all` on pills all run
    unconditionally.

---

## Desktop-only assumptions

1. **The page is rendered inside a 950 px fixed-width panel docked at `left: 220px`**
   (`#drawer-knowledge-mount.kd-open { width: 950px }`, `drawer-shared.css` sets
   `top:0; bottom:0; left:220px`). Every measurement below descends from that.
2. **Two-column glance.** `.kd-ep-op__grid { grid-template-columns: 1fr 1fr }` — target on the left,
   coverage on the right. At 375 px this is two ~150 px columns holding a 1.7 rem numeral.
3. **Two-column mechanism split.** `.kd-ep-fam__split` is a 2x2 grid with a `border-left` divider,
   and `.kd-ep-fam__steps--row` is `repeat(3, 1fr)`. `.mkA-grid` (vitamin A compare) is `1fr 1fr`.
   `.kd-ep-fam__opener` is `380px 1fr`. None has a mobile fallback.
4. **Fixed-max figure widths.** `.kd-ep-fam__figure` `max-width: 560px`, `--pdm` 640, `--mech` 600,
   `--fork` 700, `--rail` 660. The source comment warns that these are ID-selector rules and that a
   figure losing the cascade renders at 560 px with *every internal label silently shrunk* — the
   SVGs' text sizes were chosen for what lands on screen at those widths, so scaling a 680-unit
   viewBox into a 343 px phone column will make 11–12 px labels illegible. **Every figure needs a
   redrawn portrait/stacked variant, not a scale-down.**
5. **Line-length maxima tuned for a wide column**: lede `69ch`, mech step text `66ch`, mirror body
   `62ch`, `.kd-ep-fam__coda` `74ch` centred, pull-quote `clamp(1.4rem, 2vw, 1.85rem)` with a 6 rem
   decorative opening-quote glyph absolutely positioned at `top:-0.4em`.
6. **The source row is a 5-slot single line** (`icon · name · amount · price · ›`) with
   `white-space: nowrap` on the amount and `min-width:52px` on the price. Product names are long.
7. **Pill clouds assume horizontal room** — 12 inline before "Show all", up to 103 total.
8. **The index grid renders below the open page** (D1) — only tolerable because a desktop reader
   never scrolls that far by accident.
9. **Two simultaneous search inputs** (D2) — only tolerable at 950 px where they are visually far apart.
10. **The breadcrumb rail is a single non-wrapping row** of up to 6 text buttons.
11. **The drawer header tab rail is `white-space: nowrap`** with 6 tabs at `.6rem 1.2rem` padding.
12. **Scrollbar tinting** (`--kd-detail-scroll`) is a desktop-only affordance; phones have no
    persistent scrollbar. Whatever chrome-level "you are inside <category>" signal it provided has
    to be re-expressed.
13. **`.gloss-tip` is `max-width: 260px`, appended to `<body>`** to escape drawer clipping, with a
    hand-rolled 8 px viewport clamp. `.kd-ep-tip` is a fixed `280px` absolutely positioned at
    `bottom: 150%; left: 0` of its trigger — it will clip off-screen on a phone.
14. **The only existing responsive rules in this file are three narrow patches**
    (`@media (max-width: 620px)` for `.kd-pf-glance`, `@media (max-width: 780px)` for `.sxb-wrap` /
    `.frt-scene` / `.ue-strip`). Nothing in the `kd-ep` block responds to width at all.

---

## Feature-preservation contract

A rebuilt mobile Knowledge/entity experience must satisfy every item. Numbered so a later audit can
cite them.

**Structure**

1. Three distinct entity destinations exist: essential, condition, topic — each with its own section
   order, back affordance and colour behaviour.
2. The essential page renders its 14 sections in the stated order, each self-suppressing when empty.
3. The condition page renders its 9 sections in the stated order, with the condition-specific facet
   order (`stance` first), not the essential order.
4. The topic page renders kicker, title, lede, related pills, meta, and *all* facet groups with no cap.
5. No per-slug branch is introduced. Every variation is driven by data (`target.kind`,
   `noTargetReason`, `group_record`, a mechanism entry, a fatty-acid family flag).

**The number and its provenance (§00.A)**

6. Wallach's daily target renders with its unit, its range when it has one, and thousands grouping.
7. **"Why this number?" provenance is reachable by touch.** Not a hover. Not a tooltip that a scroll
   dismisses. This is a hard requirement, not a nice-to-have.
8. The PDM group derivation (`924 mg` from dose-per-body-weight × mg-per-fl-oz × reference weight) is
   reachable by touch on all 34 plant-derived pages.
9. All seven glance variants survive with their exact copy: standard, ceiling, no-target, mirror,
   present-zero, present-structural, non-essential, plus the PDM group meter.
10. `ep_no_target` renders whenever Wallach states no number — never a substituted default, never a
    blank, never an RDA.
11. A ceiling is labelled as a ceiling and is never scored as a target.
12. Sub-milligram amounts render in mcg (`fmtAmount`), so no source row ever reads `0 mg`.
13. Composition rows that declare zero are excluded from "Best Youngevity sources".
14. Wholesale is the price shown on every source row and every condition product row.

**Claims**

15. Both card shapes survive: the search shape (question → short answer → full answer → verbatim →
    book + page cite → topic tags) and the record shape (truncated paraphrase → full paraphrase →
    dose block → legend/table header → verbatim → `CITED · book`).
16. `answer` is omitted when it is byte-identical to `answer_short`.
17. Verbatims are byte-faithful, wrapped in quotes, never glossed into a paraphrase, never truncated
    (except the deliberate Fig-8-1 own-row trim and author-declared `quote_trim`).
18. Every claim card shows its citation. A card with no resolvable book shows no fabricated one.
19. The Fig-8-1 column legend (`Nutrient · RDA · True Supplement Need · 30-Day Pharmacologic`) renders
    for base-line table rows, with each column glossed, and the verbatim keeps its hard line breaks.
20. `dose.applies_to` outranks `dose.for_condition` in the dose context label.
21. The `data-question` attribute (the enrichment question carried on a record card but never printed)
    is preserved so the keyword filter still matches it.
22. Facet colour families and kind colour families are data-driven (`data-facet` / `data-family`),
    never a colour literal in TS.
23. Category colour coding holds: minerals blue, vitamins orange, aminos green, omegas purple.

**Sections and navigation**

24. Worth-Knowing caps display at 7 per facet with a "See N more answers" reveal; the header count
    stays the true total.
25. The Full Record keyword filter works: matches visible text + `data-question`, hides non-matching
    cards, hides empty groups, force-opens matching groups, and shows the no-match line.
26. Kind groups open by default when the record total is under 20.
27. Condition pills, works-with pills and keep-exploring pills all navigate, with their distinct
    colours and their lead sentences.
28. Unroutable related slugs render as honest static chips, not dead buttons.
29. The related-pill router consults **both** registries (search entities and corpus), with registry
    type winning, so gold/hydrogen/potassium open the topic page.
30. The breadcrumb trail survives: max 6, loop guard truncates rather than grows, origin anchor is
    the tab.
31. Back affordances survive and stay origin-aware (`‹ All topics` vs `‹ Go back`).
32. Source rows and condition product rows navigate to the product detail panel.
33. The mirror / non-essential / omega-3 cross-link CTAs navigate to the named essential.
34. `Where to get it` renders on exactly one bucket (the first with a dose/protocol claim) and points
    at real products.

**Heroes**

35. All 6 mechanism heroes render, both paths (legacy fixed order and composed block list), with all
    12 block types and all 9 figure keys.
36. The two omega experiences render with their figures, steps, quotes and disclaimers.
37. The plant-derived hero renders on all 36 `group_record` pages with its 4-stage figure and the
    sealed `RARE-000061` quote.
38. Sources stay at the bottom of whichever hero owns them (the deferral rule).
39. Both disclaimers render verbatim and are visually marked as *not* a Wallach claim.
40. Figures are deterministic (no randomness) so render probes stay stable.
41. The proportion field draws no numeral inside the art; the legend text carries the reading.

**Behaviour, accessibility and platform**

42. Every icon-only control keeps a screen-reader label; every figure keeps its `role="img"` +
    `aria-label` or `aria-hidden`.
43. Glossary terms are reachable by touch **without** toggling the container they sit in.
44. Every interactive target is at least 44x44 CSS px.
45. Every control has a visible pressed/active state and a real focus ring.
46. `prefers-reduced-motion` is honoured.
47. Both themes are designed: cream default and dark.
48. Safe-area insets are respected; the primary back/navigation affordance is within one-thumb reach.
49. Coverage remains a map of gaps: no score, no streak, no points, no celebration.
50. Reading position survives a `regimen:changed` re-render (fixing D5), and open/closed disclosure
    state should survive with it.
51. Offline-first holds: no network, no CDN, no runtime font fetch, everything inlined.

---

## Open questions

1. **Provenance without a hover — what shape?** The "why this number" and "how is this calculated"
   texts are 1–3 sentences of approved copy. Candidates: an always-visible line under the numeral
   (costs vertical space on every one of 91 pages), a tappable info chip opening a sheet, or folding
   it into the target block as a permanent caption. Needs a design decision, not a mechanical port.

2. **`shared across the 34 plant-derived elements` is a hard-coded literal that is currently wrong on
   2 pages.** 36 essentials carry `group_record`; only 34 have `target.kind === 'trace_pdm'`.
   Germanium and tin get the group section *and* the "34" sentence. A third number appears in a
   stale schema comment ("the 35 trace_pdm slugs"). Per the counts-derive-from-truth rule this
   should be `${page.group_record-derived count}` or the label should stop counting. **Flagged, not
   fixed — this is an inventory.**

3. **`answer_short` is documented as ≤160 chars but reaches 892 in the shipped index.** The mobile
   preview line clamps to 2 lines; at 892 chars the expanded "short answer" is a paragraph, not a
   TL;DR. Is the cap a lapsed intention, or is the doc stale? Affects how much room the collapsed
   card needs.

4. **`see_also` is rendered by the Search drawer but silently dropped by the entity page.** Only 1
   claim carries one today. Should the rebuilt card render it (an in-answer jump to a sibling claim),
   or is dropping it deliberate?

5. **Does the index grid stay below the entity page on mobile?** D1 means an essential page has 91
   tiles appended and a condition page has 510 rows. Almost certainly the mobile IA should make an
   entity page a real destination with a real end — but that changes the "toggle the same tile to
   close" model the desktop `openDetail` uses.

6. **Two search inputs.** On mobile the tab filter and the record filter cannot both be visible.
   Which survives where?

7. **Up to 103 condition pills on one essential page.** 12 inline + "Show all" was tuned for a wide
   cloud. What is the mobile treatment — a searchable list, a sheet, a capped list with a "see all"
   destination?

8. **Nine mechanism figures need portrait redraws.** Which of the nine can be re-laid-out with the
   same information (the rails and flows probably can) and which are inherently landscape
   (`cofactor_fork`, `mg_cycle`, the omega triad)? A per-figure decision, and none of it can invent
   or drop a labelled datum.

9. **Long book titles in citations.** `composeCite` produces e.g. "HELL'S KITCHEN: CAUSES,
   PREVENTION AND CURE OF OBESITY, DIABETES AND METABOLIC SYNDROME (2015) · P.147" in uppercase mono
   micro. `composeShortCite` exists (short title + year, no page) but the entity page does not use it.
   Does the mobile card use the short cite with the full one on demand? **The page number must not
   be lost** — it is the traceability guarantee.

10. **`.kd-ep-claim__full` swap-on-open.** A record card replaces its truncated headline with the
    full paraphrase when opened, purely in CSS, with a negative bottom margin. Worth keeping, or
    should mobile show the full text in both states?

11. **What happens to the drawer metaphor?** All of this lives inside a docked side panel that
    coexists with a workspace. On mobile there is no "beside"; whether Knowledge becomes a tab, a
    stack, or full-screen routes changes what "back" and "close" mean for all three surfaces.

12. **Category glyph SVG is injected un-escaped** on the condition hero (author-vetted, from the
    sealed curation). If the mobile rebuild changes how that markup is composed, the escape-by-default
    discipline everywhere else must not be relaxed to accommodate it.
