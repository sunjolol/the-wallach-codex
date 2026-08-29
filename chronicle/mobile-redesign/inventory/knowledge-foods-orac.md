# Knowledge foods + food sheet + ORAC — feature inventory

Scope of this file, and a naming trap first.

**`views/knowledge-foods.ts` is NOT the foods list.** It is the Knowledge drawer's
**Absorption** tab (`kd_tab_foods` = "Absorption") — a curated editorial essay about
Wallach's diet / gluten / stomach-acid teaching. It renders zero catalog foods.

The catalog foods live in three other places:

| # | Surface | File | Where it appears |
|---|---------|------|------------------|
| A | **FOOD SOURCES block** — the ranked, paged, filterable food-tile grid | `views/foods-block.ts` + `state/foods.ts` + `.fs-*` in `dashboard.css` | Coverage aside (below products) **and** Regimen console (above products) |
| B | **Food row + nutrient sheet** — a food as a catalog card and its full label | `views/knowledge-food-sheet.ts` + `.kd-product-row--food` / `.kd-pf-*` in `drawer-knowledge.css` | Knowledge → **Products** tab (mixed grid), plus Knowledge Home live-suggest |
| C | **Absorption tab** — the editorial essay | `views/knowledge-foods.ts` + `.kd-foods-*` / `.sx*` / `.frt-*` / `.ue-*` in `drawer-knowledge.css` | Knowledge → **Absorption** tab |
| D | **ORAC tab** — nine numbered sections, incl. three food league-tables | `views/knowledge-orac.ts` + `drawer-orac.css` | Knowledge → **ORAC** tab |

Files read for this inventory (all repo-relative):
`dashboard/assets/js/src/views/{knowledge-foods,knowledge-food-sheet,knowledge-orac,foods-block,knowledge-products,knowledge,knowledge-home,coverage,regimen,entity-page,gloss-tooltip}.ts`,
`dashboard/assets/js/src/state/{foods,foods-curation,search,orac,orac-foods,orac-products}.ts`,
`dashboard/assets/js/src/core/schemas/{orac-data,orac-foods-data,orac-products-data}.ts`,
`dashboard/assets/styles/{dashboard,drawer-knowledge,drawer-orac,theme}.css`,
`dashboard/assets/data/{foods-composition-data,foods-curation,orac-data,orac-foods-data,orac-products-data,view-copy,search/search-index}.json`,
`tools/probes/render_probe_food_{tile,pager,catalog,tier}.js`, `render_probe_orac*.js`.

---

## Destinations & states

### A · FOOD SOURCES block (`.fs-block`)

Two hosts, one builder. Built as **DOM nodes, not markup** (every food name is a text node).

| State | Trigger | What renders |
|-------|---------|--------------|
| A1 · normal grid | pool non-empty | dotted rule + `FOOD SOURCES` label, `.fs-grid` of N tiles, then the controls row |
| A2 · education note | Regimen only, `fieldInfo().covered >= essentialCount()` | note *"Your 90 are covered — these are simply the most nutritious foods."* **above** the grid; grid still renders |
| A3 · empty — filter bit | `filterActive && recs.length === 0` | `fs_filter_none` = *"No food in the catalog matches that filter."* + **controls still painted** (so the filter can be undone) |
| A4 · empty — Coverage cap reached | `capReached` (`FOOD_MAX = 12` foods already owned) | *"That's the last food this tab will suggest — the rest live on your Regimen."* |
| A5 · empty — nothing moves a gap | neither of the above | *"No food moves a remaining gap — what's left needs a supplement."* |
| A6 · exhaustion easter egg | `recs.length === 0 && ownedCount >= foodCatalogSize()` (192) | *"Well, for some reason you added ALL of the foods in our database, not sure why you did that but… **click here** to collect your prize!"* → rickroll `https://www.youtube.com/watch?v=dQw4w9WgXcQ` in a new tab. **No controls under it.** ⚠ The one outbound URL in an offline-first app. |
| A7 · no pager | `pages < 2` | the pager element is not painted at all (a pager over one page is a lie) |

Two pager shapes off one builder:
* **Coverage** — `kind: 'arrows'`: `‹ N / N ›`, 3 tiles/page (`FOOD_PAGE = 3`), centred, 18px buttons.
* **Regimen** — `kind: 'numbers'`: windowed `‹ 1 2 3 4 5 … 64 ›`, 3 tiles/page (`FOOD_LIMIT = 3`), 22px buttons, **plus** a category `<select>` + name `<input type=search>` on the same row (pager left, filter right).

192 foods ÷ 3 = **64 pages** on Regimen. Coverage's pool excludes owned foods, so its page count shrinks; `foodPage` is clamped down when a page stops existing.

### B · Food row + nutrient sheet (Knowledge → Products)

| State | What renders |
|-------|--------------|
| B1 · mixed grid, `kind='all'` | head `ALL {nProducts} PRODUCTS + 192 FOODS · SORTED BY ESSENTIALS SUPPLIED`; grid holds both kinds in **one** order (`supplied` desc, then name A–Z) |
| B2 · `kind='products'` | head `ALL {n} PRODUCTS · SORTED BY ESSENTIALS SUPPLIED`; foods excluded |
| B3 · `kind='foods'` | head `ALL 192 FOODS · SORTED BY ESSENTIALS SUPPLIED`; products excluded |
| B4 · search active | `applyKnowledgeSearch` hides non-matching `.kd-product-row`, hoists title matches into a `.kd-bestmatch` block, hides a head whose rows all vanished. Food rows match on the `data-search` blob (name, category, `usda_description`, portion, every hit's label + slug + spaced slug) |
| B5 · food sheet open | `renderFoodDeep(id)` prepended **above** the catbar + grid; grid stays mounted below |
| B6 · food with zero hits | glance hero shows the kill-state *"No / numbers"* + *"nothing our pinned sources measure clears the floor for this food"*; no ghost number on its row |
| B7 · unresolvable id | `renderFoodRow` / `renderFoodDeep` return `''` — the grid renders alone |
| B8 · empty catalog | `<div class="kd-empty">— no products loaded —</div>` |

The drawer scrollbar tints rust (`FOOD_COLOR = #b0442e`, `foodScrollTint`) while a food is selected.

### C · Absorption tab (`.kd-foods`) — one long scroll, four numbered chapters

* **01 hero** — eyebrow rule (`The premise` / `Absorbability`), corner lockup (`The first step` + `Fig·01`), two-line Playfair headline (*You are not what you eat. / You are what you absorb.*), deck.
* **`.ds-pull-stat`** — `// Mayo Clinic · 2009` / **115M** / *"Americans are gluten-intolerant — about one in three."* / *Cited by Wallach · Epigenetics*.
* **02 villi scan** — intro prose carrying a `villi` gloss term, two SVG panels (damaged left / healthy right), then a sealed pull-quote (`WAL-CLM-EPIGEN-000158`) with page number + highlighter mark.
* **03 remove ↔ eat** — two columns (`Take these out` ×5, `Put these in` ×6) plus a `Sometimes it's the form, not the food` 2-col grid (×4). 15 cards total, each opening a topic page.
* **04 stomach acid** — lead prose → **pH ladder** (500px tall absolutely-positioned figure) + side triad → **fortress cutaway** (2 SVG cells + 4-item legend) → heartburn callout → `.ds-pull-stat` **75%** → sealed pull-quote (`WAL-CLM-DDDL-000132`) → **Ultimate Enzymes** 5-tile strip + proof quote + CTA bar + foot → **crown-jewel claim record** (8 claims, facet-grouped, protocol first).
* Degrade states: `villiPullQuote()` / `sec04PullQuote()` return `''` if the claim id does not resolve; `enzStrip()` amounts render `''` if the product/component is missing; `ctaBar()` renders no number rather than a fabricated price.
* **No search box** on this tab (only essentials / conditions / products / explore get one).

### D · ORAC tab (`.kd-orac`) — nine numbered sections, one long scroll

| § | Name | Renders when |
|---|------|--------------|
| 01 | Editorial hero (`The score that measures / how fast you rust.`) | always |
| 01 | **Mirror test** — scrubbable cell + age slider | `oracData() !== null` |
| 01 | **Stolen years** — 20–25 years + rank decline 17th→24th→46th→48th | `oracData() !== null` |
| 02 | **Damage chain** — 5 accumulation-ramp cards | `oracData() !== null` |
| 03 | **Daily target** — 20,000–25,000 + disease side-panel 100,000+ | `oracData() !== null` |
| 04 | **REACH** — 9 foods as bars toward a 25,000 day | `oracFoodsData() !== null` |
| 05 | **SCALE** — 6 spice-outlier bars on one linear axis | `oracFoodsData() !== null` |
| 06 | **THE FIELD** — 60 dots, 9 family lanes, log/linear toggle, hover/pin tooltip, legend filter | `oracFoodsData() !== null` |
| 07 | **Best supplement sources** — 1 leader card + 6 rows | `oracProductsData() !== null` |
| 08 | **Four pieces / two forces / payoff** + a cross-tab button to Absorption | `oracData() !== null` |
| 09 | **The full record** — 33 claims, facet-grouped `<details>` cards | always |

If `orac-data.json` is absent/invalid the whole narrative (01–08) is omitted and the tab renders **hero + §09 only**. `orac-foods-data` and `orac-products-data` fail independently (§04–06 and §07 drop out separately).

Field sub-states: `data-mode="log"` (default) / `"lin"`; `.kd-orac-field--pinned` (a dot clicked open); `.kd-orac-lane--hot` (lane highlighted); `.kd-orac-keyb--off` + lane `display:none` (a family filtered out).

---

## Controls

### A · FOOD SOURCES block

| Control | What it does | Where it lives | Touch-hostile? |
|---|---|---|---|
| `+` add button (`[data-food-add]`, `.ui-close.ui-close--sm.fs-ctl--add`) | `addCatalogFood(foodId)` → mints a `RegimenItem` with `food_id` on `label`, provenance `food_catalog`; cascades a repaint | tile title bar, right cell (30px column) | **YES — 28×28px**, well under 44px |
| Pager `‹` / `›` (`[data-food-page]`) | page ∓1, clamped; disabled at the ends | under the grid | **YES — 18×18px** on Coverage, 22×22 on Regimen |
| Pager numbers (`[data-food-page]`, Regimen only) | jump to page N; `aria-current="page"` on the current | controls row, left | **YES — 22px min-width** |
| Pager ellipsis `…` (`.fs-pager__gap`) | non-interactive, `aria-hidden`, `user-select:none` | between non-neighbour numbers | n/a |
| Category `<select>` (`[data-food-cat]`) | narrows the **pool** (not the page); resets `foodPage = 0` | controls row, right | native select — workable, but 22px tall |
| Name `<input type=search>` (`[data-food-q]`) | case-insensitive substring over name **and** category; narrows the pool; resets the page; caret preserved across the repaint via `markFocus`/`restoreFocus`; `maxLength = 40` | controls row, right | **fixed `width: 225px`** — cannot share a 375px row with a pager |
| Tile name `title` attr | full name when the ellipsis bites | `.fs-tile__name` | **YES — native tooltip, invisible on touch** |
| Lead % `title` attr (`glossFor`) | the provenance sentence (source name + Wallach target + `floor` + `≈` explanation) | `.fs-lead` (`cursor:help`) | **YES — native tooltip, invisible on touch.** The owner ruled 2026-08-21 that this gloss must sit *on the number*; on touch it currently does not exist at all |
| Every chip `title` attr | the same provenance sentence, per chip | `.fs-chip` (`cursor:help`) | **YES — same problem, up to ×7 per tile** |
| `click here` prize link | opens YouTube in a new tab (`target=_blank rel=noopener noreferrer`) | easter-egg note only | network — see A6 |
| `.ck-recs__go` (Regimen, "all covered" note) | quiet dashed button inviting further browsing | under the console note | 6px×12px padding — small |

**There is no control that opens a food's own sheet from a tile.** The tile's only action is `+`. See Open questions.

### B · Food row + nutrient sheet

| Control | What it does | Where | Touch-hostile? |
|---|---|---|---|
| Food card (`[data-kd-food]`, `role="button" tabindex="0"`) | `openDetail('food', id)` → sheet + breadcrumb | Products grid | fine (card-sized) |
| `All` / `Products` / `Foods` pills (`[data-kd-catfilter]`) | re-render with `catalogKind`; `aria-current="true"` on the active one | `.kd-catbar`, right of the head | ~21px tall — **YES** |
| Tab search box | filters `.kd-product-row` on text + `data-search` | drawer header | fine |
| `‹ All products` / `‹ Go back` (`[data-kd-action="food-close"]`) | origin-aware back (crumb 0 when opened from a non-Products tab) | sheet hero actions | fine |
| `Add to regimen ›` (`[data-kd-action="add-regimen"][data-add-food]`) | `addCatalogFood`, navigate to Regimen, then **flash** the matching `.rr-row` after 240 ms | sheet hero actions | fine |
| Nutrient row (`.kd-pf-nrow--link`, `[data-kd-essential]`, `role=button tabindex=0`) | opens that essential's Knowledge page — only where the canon has a `layout_key` | sheet label table | row-sized, but the `›` affordance is **hover-only** (`opacity: 0` → `1`) |
| Nutrient row `title` attr | the provenance gloss | every row | **YES — native tooltip** |
| Home live-suggest food entry (`data-kd-food`) | opens the sheet from Knowledge Home | Home suggest panel | fine |

### C · Absorption tab

| Control | What it does | Where | Touch-hostile? |
|---|---|---|---|
| `villi` gloss term (`.gloss.kd-foods-term`, `tabindex=0`, `role=button`, `aria-label`) | shows the definition — **hover, focus AND tap** are all wired (`gloss-tooltip.ts`) | villi intro + both panel captions | OK — this is the good pattern |
| 15 food cards (`.kd-foods-item[data-kd-topic]`) | opens that topic's overlay page | §03 columns + form grid | fine |
| Ultimate Enzymes CTA bar (`.ue-bar[data-kd-product]`) | opens the product detail page in the drawer | §04 | fine |
| 8 claim `<details>` (`.kd-ep-claim`) | native disclosure | §04 record | summary is tall enough |
| Facet `<details>` (`.kd-ep-facet`, `open` by default) | collapses a whole facet group | §04 record | fine |

### D · ORAC tab

| Control | What it does | Where | Touch-hostile? |
|---|---|---|---|
| **Age scrubber** `<input type=range>` (`.kd-orac-scrub__range`, `aria-label`) | interpolates the cell fill %, the big percentage, the caption word (`starting`/`building`/`serious`/`critical`), the inline age, and lights the nearest ±5yr tick | §01 mirror | thumb is 24px — **borderline**; the track is only 4px tall |
| Decade ticks (`.kd-orac-tick`) | display only — **not clickable** | under the scrubber | n/a |
| `Ranked — log` / `True — linear` segmented buttons (`[data-orac-mode]`) | re-positions all 60 dots, the top labels and the target line from baked `data-left-*` / `data-top-*` | §06 field control bar | ~31px tall — **YES** |
| **Field dot** (`.kd-orac-dot`) | hover → tooltip; click → **pin** (toggles `--pinned`); click plot background → clear | §06 rail | **YES — 15×15px, and dots are deliberately packed to 1.25% centre-to-centre.** The single most touch-hostile control in the app. `<span>` — no `tabindex`, no `role`, no keyboard path at all |
| Legend buttons (`.kd-orac-keyb[data-fam]`) | toggle a whole family lane's `display` | under the field | ~27px — **YES** |
| `Explore the Absorption facts →` (`.kd-orac-abs__btn[data-kd-tab="foods"]`) | cross-tab jump to Absorption | §08 | fine |
| Leader card + 6 supplement rows (`[data-kd-product]`) | open that product's detail page with an origin-aware "Go back" crumb to ORAC | §07 | fine |
| 33 claim `<details>` (`.kd-orac-claim`) | native disclosure | §09 | 15px padding — fine |

---

## Data points rendered

### A · FOOD SOURCES tile (design F, signed off 2026-08-21)

| Datum | Source field | Format / unit | Why it matters |
|---|---|---|---|
| Food name | `FoodRec.name` ← `Food.name` | text node, `nowrap` + ellipsis, `title` = full | identity |
| Serving | `FoodRec.portionLabel` ← `Food.portion_label` | e.g. `1 cup, cubes` | **without it every % is meaningless — 28% of a target, per what?** |
| Breadth | `FoodRec.breadth` = `hits.length` | `<b>N</b> of 90` | how much of the field one serving touches. **Counts the EFA group as ONE line** even though the group covers two of the ninety (the signed-off demo's reading) |
| Accent hue | `hits[0].category` → `--fs-cat-{minerals\|vitamins\|fatty_acids}` | `#2b6fb0` / `#ff7e3c` / `#7d4a86` | category colour-coding. **No amino-acid entry on purpose** — a food can never credit one (they cover on presence, no numeric target) |
| Lead % | `hits[0].pct` = `round(fraction*100)` | 21px display digits + `<sup>%</sup>` | strongest single delivery |
| Lead label | `hits[0].label` from `_meta.essential_display` | uppercase mono, dotted underline | which essential the lead is |
| `≈` on the lead | `hits[0].tier === 'APPROXIMATE'` | `::after` glyph | joined by name, not by id |
| Chips | `hits[1..]` | `LABEL 12%` with `<u>` on the % | the rest of the readout |
| `+N` badge | `hits.length - shown`, recomputed on every shrink | mono | **must equal what was actually dropped** — probe-enforced |
| Provenance gloss | `glossFor(hit)` — `_meta.source_display[source_id]` + `conservative` + `tier` | `title` attr | which of 8 publications measured this number, whether it is a floor, and what "approximate" means |
| Owned-food exclusion | `label.food_id` in the regimen | pool filter | makes the list ADVANCE |
| Page readout | `page+1 / pages` | mono | Coverage arrows only |

**Sources named in `_meta.source_display` (8):** USDA FoodData Central; the Australian Food Composition Database; Doleman 2017 (Food Chemistry); the USDA flavonoid database; the USDA proanthocyanidin database; the USDA flavonoid and proanthocyanidin databases; the USDA/FDA/ODS iodine database; Powell's 2005 silicon database (British Journal of Nutrition).

**Catalog shape:** 192 foods; 11 categories (Vegetables 55, Fruits 25, Fish & shellfish 24, Legumes 16, Dairy & eggs 16, Nuts & seeds 15, Lamb/veal/game 15, Beef 9, Poultry 8, Spices & herbs 5, Pork 4); 1–13 nutrient rows per food; `qualify_fraction 0.07` (a 7% floor); 29 essentials have display entries; 184 foods carry an `efa` block, **52 of which qualify**.

**Ranking key (never rendered — `FoodRec.score`):** with active goals whose nutrients are still outstanding, Σ min(fraction, 1) over the outstanding goal nutrients ÷ |goal gaps|; otherwise `food.strength` (Σ of fractions, uncapped). The EFA group counts in **both** halves (24 of the 30 goals name an omega). Tiebreaks: `strength`, then `id` — the order is total and cannot reshuffle between paints.

**Also on the record (not rendered on the tile):** `FoodRec.supplies` (how many WANTED essentials the serving reaches), `FoodRec.goalIds` (which active goals it touches — used by Coverage's card tinting), `FoodRec.grams`, `FoodRec.category`.

### B · Food nutrient sheet (`renderFoodDeep`)

| Datum | Source | Format | Why |
|---|---|---|---|
| Ghost number (grid card) | `foodHits(id).length` | huge faded numeral in `--form` | breadth at a glance; also the grid's sort key |
| Card foot | `<b>of 90</b> essentials · {portion_label}` | — | a food shows a serving where a product shows a price |
| Category chip | literal `FOOD` with an `<i>` dot | rust `#b0442e` | the one hue no delivery form uses |
| Hero glyph | inline leaf SVG | tinted `--form` | food ≠ product cube |
| Subline | `{food.category} · FDC {food.fdc_id}` | mono | provenance id |
| Lede | *"One serving is {portion} ({grams} g). This label carries {n} of Dr. Wallach's 90 essentials, each measured against his own daily target."* | serif | frames the sheet |
| Glance hero | `hits.length` + `of 90 Wallach essentials / one serving reaches` | display numeral | — |
| Metric · Serving | `portion_label` + `{grams} g` | — | — |
| Metric · Strongest | `hits[0].pct%` + `hits[0].label` (or `—`) | — | — |
| Metric · Measured by | `new Set(hits.map(h => h.source)).size` + `pinned source(s)` | — | multi-source honesty |
| Comp head | `{portion_label}` / `{grams} g · {n} nutrient(s)` | — | — |
| Column head | `Nutrient` · `Amount` · **`% of target`** | 3-col grid `1fr auto 56px` | **NOT `%DV`** — a product prints the FDA's Daily Value, a food prints Wallach's. Swapping them would be the quietest §00.A breach on any surface |
| Row · name | `hit.label` (+ `›` link chevron, `≈`, `floor`) | left border tinted by `data-cat` | links to the essential's page where `layout_key` exists |
| Row · amount | `fmtAmount(hit.amount)` + `hit.unit` | 2dp, falling back to **3 significant figures** when 2dp would round a real value to `0` | "0 mg beside 9% of target" is a contradiction the reader cannot resolve |
| Row · % | `hit.pct` | integer % | — |
| `As the source describes it` | `food.usda_description` | small serif | the source's own words |
| Floor note | `foodQualifyPct()` = **7** | *"Every nutrient a pinned source measures at 7% or more … Not a complete nutrition label: anything under that floor never entered the catalog, and no calorie or macronutrient source is pinned at all — so their absence here is a gap in what we hold, not a claim about the food."* | the sheet says where its own readout stops |
| Source line | `SOURCE · {name} ({n} values) · … — composition measured against Dr. Wallach's own daily targets (§00.A · a food never sets a target)` plus `· {n} paired by name rather than by id (≈)` | mono foot | per-publication counts, most-used first |
| Row category tint | `page.category` → `--fam-science` / `--fam-vita` / `--fam-action` / `--fam-story` | left border | ⚠ the EFA group gets **no link and no tint** on purpose — it is not one of the 90, it is a meter two of them share |

### C · Absorption tab

Every framing string is a `view-copy.json` `ui()` id (109 `kd_foods_*` keys). Every Wallach word is claim data.

| Datum | Source | Notes |
|---|---|---|
| 115M / 75% stat blocks | view-copy literals | editorial framing, cited to Mayo Clinic 2009 and *Dead Doctors Don't Lie* |
| Villi pull-quote | `WAL-CLM-EPIGEN-000158` sealed verbatim | page read off `claim.page`, never typed; highlight runs from `"the consumption of gluten"` to the end; a trailing straight-quote OCR artifact is repaired **at display only** (`fixQuoteGlyph`) — the sealed text keeps it |
| §04 pull-quote | `WAL-CLM-DDDL-000132` | excerpt boundaries are *pointers into* the sealed text (`"Normally the stomach is sterile"` → `"migrates up into the stomach."`), with `sterile` marked |
| 15 food cards | `foods-curation.json` `remove[5]` (gluten, dietary_oils, sugar, carbonated_beverages, processed_meat) / `eat[6]` (butter, beef, chicken, pork, eggs, salt) / `conditional[4]` (dairy, water, cruciferous_vegetables, phytates) | slugs are the ONLY editorial call; each card's "why" is a sealed claim's `answer_short`, picked by facet priority (remove → warning/mechanism/physiology; eat → stance/uses/basics/protocol; conditional → stance/warning/protocol/basics), de-`Yes —`-prefixed and teasered to ~200 chars at a sentence boundary |
| pH ladder values | 1.0 stomach / 8.2 pancreatic from **WAL-CLM-DDDL-000134**; the 7.36–7.44 blood band from **WAL-CLM-RARE-000135** — a *different* claim, do not re-attribute | y-positions are pure geometry: `phY(ph)` over a 0–14 scale on 500px |
| 5 enzyme tiles | amounts read **LIVE** from the Youngevity Product DB (`ultimate-enzymes`, component 0): `Betaine Hydrochloride`, `Pepsin`, `Pancreatin 11X`, `Papain`+`Bromelain` (summed), `Ox Bile` — nutrient rows or blend totals | `prov` dot: `w` = Wallach-backed, `p` = plant enzyme. A missing amount renders an empty string, never a guess |
| CTA price | `price.wholesale ÷ servings_per_container`; per-day = ×3 (Wallach's t.i.d.) | foot: `Wholesale · {n} capsules · ≈ ${x} a day · one of the least-expensive force-multipliers in the program`. A missing price renders **no number at all** |
| 8 crown-jewel claims | `hero_claims[3]` (EPIGEN-000140 / 141 / 142) + `enzyme_claims[5]` (DDDL-000131, DDDL-000128, IMMORT-000078, DDDL-000130, DDDL-000134) | facet-grouped with **protocol first**, then canonical `SEARCH_FACETS` order; each rendered by the shared `renderSearchCard` (question + short preview → short answer, full answer when it differs, glossified verbatim, citation, `#topic` tags) |

### D · ORAC tab

Every ORAC number is parsed by a generator from a sealed claim's byte-faithful verbatim. **No ORAC number is authored in a view or in view-copy.**

| Datum | Value in the shipped artifact | Source |
|---|---|---|
| Decade table (mirror) | 30–40 → 35% · 50–60 → 41% · 70–80 → 55% · 90–100 → 78% | cite: *Immortality*, p.29 · after Adelman et al., 1988 |
| Mirror scrub | anchors = band midpoints (35 / 55 / 75 / 95), range 30→100 step 1, start 35 at 35% | interpolation is a **reading device**, stated as such in `kd_orac_mirror_src_note` |
| Stolen years | `20–25 years`; should average 95–100, actual ~75 | `WAL-CLM-IMMORT-000254` |
| Rank decline | 1990 → 17th, 2000 → 24th, 2005 → 46th, **2008 → 48th** (only the newest accented) | cite: *Immortality*, p.9 · CDC / WHO longevity rankings |
| Daily target | **20,000–25,000** ORAC points/day, base age 100 | `WAL-CLM-IMMORT-000238` |
| Disease dose | **100,000+** (min 100,000) | `WAL-CLM-EPIGEN-000154` |
| Calories | 1,250–1,800 | `WAL-CLM-IMMORT-000255` |
| Payoff | `+25 to 50 healthful years`, 150–175 lb | `WAL-CLM-IMMORT-000259`, cite *Immortality (2008)* |
| Ceiling | base 100, ceiling 150, gap 50 | `WAL-CLM-IMMORT-000260` (+ base claim IMMORT-000238) |
| §04 REACH rows (9) | Pecan 72% · Hazelnuts 37% · Blueberry juice 36% · Artichoke hearts 32% · Prune juice 29% · Raspberry 24% · Cabernet Sauvignon 20% · Dark chocolate 12% · Green tea brewed 5% | against 25,000; the `over` flag draws a hatched over-target band (no row is `over` today) |
| §05 SCALE rows (6) | Cloves, ground 314,446 · Cinnamon 267,536 · Sorghum black 100,800 · Pecan 17,940 · Chokeberry 16,062 · Wild blueberry 13,427 | bars are % of cloves |
| §06 FIELD | **9 families / 60 dots** — Spices 3, Nuts 3, Beans & grains 6, Berries & fruit 19, Juices 8, Vegetables & tea 5, Wine 4, Chocolate 2, **Top ten — Hell's Kitchen 10 (basis `per 100 g · different basis`, labelled rather than silently mixed in)** | positions computed at render for BOTH modes (log floor 300, `PLOT_MAX` 95.5) and baked into `style` + `data-*` — the static render is correct with zero JS |
| Field tooltip | family + swatch, name, `value_display`, `ORAC · {basis}`, a bar, `{share}%` `of a 25,000-point day` (share below 100 shown to 1dp) | all baked at render; the JS only copies `data-*` into the tip |
| Per-lane top label | the family's highest scorer, `{name} · <b>{value}</b>`, clamped to 5–82% of the rail | hidden entirely for the `berries` lane (19 dots, the knockout box overlapped neighbours) |
| §07 leader | **BTT 2.0® Tablets - 120 Tablets** · tablet · 160,000 ORAC/serving · $54.95 wholesale · **2,912 ORAC per $1** | Youngevity official, lab-tested per serving (`source: ygy`) |
| §07 rows (6) | Cell Shield RTQ™ 15,800 / $48.95 / 323 · Imortalium® 10,500 / $68.95 / 152 · BTT 2.0 Citrus Peach Fusion 8,000 / $69.95 / 114 · BTT 2.5 Canister 8,000 / $69.95 / 114 · BTT Original 450 G 5,745 / $65.95 / 87 · ZRadical™ 32 fl oz 4,390 / $43.95 / 100 | `bar` scaled to the runner-up max; the form badge + hue come from `FORM_COLORS` / `formFamilyFromForm`, so a row colour-matches its own product page |
| §07 caption | `Youngevity — official ORAC, per serving · Other Youngevity products contain antioxidants, but aren't ORAC-tested yet.` | — |
| §09 claims | **33** claims (subject ∈ {orac, antioxidants, free_radicals, longevity} AND about orac). Facets: sources 7, big_question 6, protocol 4, mechanism 3, warning 3, basics 2, physiology 2, stance 2, etymology 1, discovery 1, history 1, uses 1. Rendered **big_question first**, then canonical order | count is `oracClaims().length`, derived at render |
| Claim card | question · `answer_short` · short cite (collapsed); full `answer` only when it differs from the short, glossified verbatim in curly quotes, full cite `— Dr. Joel Wallach · {cite}` (expanded) | `composeCite` / `composeShortCite` compose from the registry, never hand-typed |

---

## Copy

All user-visible strings are `ui()` ids in `dashboard/assets/data/view-copy.json` **except** where noted as hard-coded. Counts: **109** `kd_foods_*`, **98** `kd_orac_*`, **9** `fs_*`.

### `fs_*` (FOOD SOURCES block) — complete

```
fs_filter_all        All foods
fs_filter_cat_label  Filter foods by category
fs_filter_find       Find a food…
fs_filter_none       No food in the catalog matches that filter.
fs_filter_q_label    Find a food by name
fs_pager_label       More foods
fs_pager_next        More foods
fs_pager_page        Foods, page {n} of {of}
fs_pager_prev        Previous foods
```

**Hard-coded prose in `views/foods-block.ts` (NOT in view-copy — a rebuild must carry these):**
* rule label `FOOD SOURCES`
* `Add {name}` (the `+` button's `aria-label`)
* the meta line `{portionLabel} · <b>{breadth}</b> of 90`
* education note: `Your 90 are covered — these are simply the most nutritious foods.`
* cap note: `That's the last food this tab will suggest — the rest live on your Regimen.`
* gap note: `No food moves a remaining gap — what's left needs a supplement.`
* egg: `Well, for some reason you added ALL of the foods in our database, not sure why you did that but… ` / `click here` / ` to collect your prize!`
* gloss base: `Food composition from {source}, measured against Dr. Wallach's daily target for this nutrient.`
* gloss floor clause: ` It is the lowest of the varieties that source measured, so it holds whichever kind you eat.`
* gloss approximate clause: `≈ That source lists foods by name rather than by the id our catalog uses, so this food was paired with theirs by hand — a close stand-in, not a measurement of this exact item.`

### Food sheet (`views/knowledge-food-sheet.ts`) — **all hard-coded, none in view-copy**

`FOOD` (chip + hero) · `of {n} essentials` · `‹ All products` / `‹ Go back` · `Add to regimen ›` ·
the lede sentence · `At a glance` / `what one serving delivers` · `of {n} Wallach essentials / one serving reaches` ·
`No / numbers` + `nothing our pinned sources measure clears the floor for this food` ·
`Serving` / `Strongest` / `Measured by` / `pinned source` / `pinned sources` ·
`Composition from a pinned outside table, measured against Dr. Wallach's own daily target for each nutrient — what the food contains, never a target it sets (§00.A).` ·
`Nutrition facts` / `per serving` · `{grams} g · {n} nutrient(s)` ·
`Nutrient` / `Amount` / `% of target` · `floor` · `≈` ·
`As the source describes it` · the 7%-floor note · the `SOURCE · …` provenance line.

Products-tab strings (`knowledge-products.ts`, also hard-coded): `ALL {n} PRODUCTS + {n} FOODS · SORTED BY ESSENTIALS SUPPLIED`, pills `All` / `Products` / `Foods`, group aria-label `Show`.
Home suggest: `kh_group_foods` = `Foods`; a food's meta line is `{portion_label} · {category}`.

### Absorption tab — full `kd_foods_*` catalog

**Hero & stat:** `The premise` · `Absorbability` · `The first step` · `Fig·01` · `You are not what you eat.` / `You are what you absorb.` · deck (*"Getting all 90 essential nutrients is only half of Dr. Wallach's model. The other half — just as important — is removing the foods that keep your gut from absorbing them."*) · `// Mayo Clinic · 2009` / `115M` / `Americans are gluten-intolerant — about one in three.` / `Cited by Wallach · Epigenetics`.

**§02:** kicker `The mechanism` · `What gluten does to your gut` · the explain paragraph · panels `Gluten-damaged gut` / `Absorb ↓` / `Flattened, blunted villi — nutrients slide past, unabsorbed.` and `Healthy gut` / `Absorb ↑` / `Tall, dense villi — a vast surface area that pulls nutrients in.` · the **villi** gloss definition · cite `Dr. Joel Wallach · Epigenetics (2014)`.

**§03:** kicker `The fix` · `What to change in your diet` · `Take these out` · `Put these in` · `Sometimes it's the form, not the food`.

**§04:** kicker `A question of pH` · `You can't absorb what you can't break down` · lead paragraph · ladder (`alkaline`, `acid`, `Blood · 7.36–7.44` + `defended to the decimal`, `pH 8.2` `Pancreatic juice` + description, `pH 1.0` `Stomach acid` + description, kicker `Why 1.0 is non-negotiable`, triad `It stays sterile.` / `It arms pepsin.` / `It frees minerals & B12.` each with a one-line explanation, the two-stage note, cite `Dr. Joel Wallach · Dead Doctors Don't Lie (2011)`) · fortress (kicker `The same gut, two states`, lede, `At full strength` `pH ~1.0` `Sterile & dissolving` + caption, `When the acid falls` `pH ~3–5` `Breached & fermenting` + caption, legend `Acid moat` / `Nutrient crossing the wall` / `Invading bacteria / yeast` / `Fermentation gas`) · callout (`The twist most people get backwards` / `Heartburn is usually too little acid, not too much` / the antacid paragraph, with `the acid is not acid enough` marked) · stat `// Dead Doctors Don't Lie` / `75%` / `of people over 50 need supplemental stomach acid.` / the aging-phenomenon note · CTA block (`Put it into practice`, `You just learned the problem. Here's the one-bottle answer.`, the betaine/pancreatin/ox-bile paragraph, five enzyme tiles `In the stomach`/`Betaine HCl`, `Protein · stage 1`/`Pepsin`, `Protein · carbs · fats`/`Pancreatin 11X`, `Extra protein power`/`Papain + Bromelain`, `Fats & A/D/E/K`/`Ox Bile` each with a blurb, prov labels `Wallach-backed` / `Plant enzyme`, the proof quote + cite `Dr. Joel Wallach · Dead Doctors Don't Lie & Let's Play Doctor`, bar `Solve it for about a quarter per serving` / `Ultimate Enzymes · one capsule, three times a day, before meals` / `per serving`) · record block (`Shared across Knowledge · the full record`, `Everything Wallach says about breaking food down`, the sub-paragraph).

**Unused `kd_foods_*` keys** (in view-copy, referenced by no view): `kd_foods_villi_note`, `kd_foods_villi_kicker_scan`, `kd_foods_villi_kicker_sub`.

### ORAC tab — full `kd_orac_*` catalog

**Hero:** `The Wallach Codex · Knowledge` / `ORAC` · `The score that measures` / `how fast you rust.` · the free-radical/ORAC deck.
**§01:** `Look at the back of your hand` · `See a dark spot? You already have *millions more* you can't see.` · the ceroid-lipofuscin paragraph · `of a single cell, filled with the pigment left behind — at age {age}.` · `Drag through the decades` · caps `starting` / `building` / `serious` / `critical` · the interpolation disclaimer · `What that damage is costing you` + the stolen-years paragraph.
**§02:** `How the damage actually happens` · `Rust, one cell at a time` · the Walford intro · five steps (`A molecule breaks`, `It steals from your cells`, `The damage sets`, `Your cells stiffen`, `You can see it`) each with a plain-language description.
**§03:** `The one number to hit` · `How much protection you actually need` · `Wallach's daily target` · `ORAC points / day` · body · `Fighting disease` + the MS/ALS/Parkinson's paragraph.
**§04:** `What it takes` · `One serving, and how far it gets you` · intro · `of a day` · `Read the empty half of every bar as well as the full half…` · caption.
**§05:** `The outlier` · `Spices are not on the same scale` · the cloves note.
**§06:** `Every food Wallach lists` · `The league tables, highest to lowest` · intro · `Hover any dot — click to keep it open` · `Ranked — log` / `True — linear` · `ORAC` · `a day's target` · `of a {target}-point day` · the source line · bridge (`What comes next` + paragraph).
**§07:** `ORAC you can buy` · `Best supplement sources` · intro · `Highest tested` · `ORAC per $1` · `wholesale` · `ORAC / serving`.
**§08:** `Where ORAC fits in the bigger picture` · `ORAC is one of four — and only one raises the ceiling` · intro · four pieces (`Antioxidants` / `Calorie-restricted diet` / `Mineral-rich diet` / `Avoid the land mines`, tagged `Piece N · on this page` or `Piece N · Absorption tab`) · `Explore the Absorption facts →` + its lead-in · the forces intro · `Antioxidants · ORAC` / `Slow the rusting` / `↑ raises your AVERAGE` and `The {n} essentials · minerals` / `Build and repair` / `↑ raises your CEILING` · the payoff paragraph.
**§09:** `{n} claims Wallach makes about ORAC` · `The full record` · intro.

**Unused `kd_orac_*` keys:** `kd_orac_dec_lbl`, `kd_orac_dec_age_prefix`.

**Markup-in-copy conventions (two different ones — do not conflate):**
* ORAC: `emph()` turns `**bold**` → `<strong>` and `*italic*` → `<em>` **after** escaping; `fill()` interpolates `{token}` placeholders **before** escaping.
* Absorption: `emphasize(raw, sub, open, close)` wraps the first occurrence of a named substring, and that substring is itself a separate copy key (`*_em`, `*_bold`, `*_mark`, `*_strong`, `*_b`).

---

## Interaction dependencies (flag each loudly)

1. **⚠⚠⚠ `title=` attributes carry the provenance gloss.** `foods-block.ts` sets `chip.title`, `leadEl.title`, `name.title`; `knowledge-food-sheet.ts` sets `title=` on every `.kd-pf-nrow`. A native tooltip **does not exist on touch**. The owner's 2026-08-21 ruling was that the source disclosure sits *on the number, not in a footnote* — on the current mobile build that disclosure is simply gone. A rebuild MUST re-home it (long-press sheet, tap-to-expand row, an inline mark, or the existing `.gloss` tap wiring which already works).
2. **⚠⚠ ORAC field dots are 15px and deliberately collide.** `DOT_MIN_ADJ = 1.25%` centre-to-centre; `DOT_MIN_SAME = 2.1%` before a collider is bumped onto a second vertical band. On a 375px rail 1.25% is ~3px. Hover shows the tip; click pins it. There is **no keyboard path to a dot at all** (`<span>`, no `tabindex`, no `role`). 60 dots, 19 of them in one lane.
3. **⚠⚠ The field tooltip is `pointer-events: none`, absolutely positioned inside the plot**, clamped 6px from the plot edges, flipping below the dot when there is no room above, `min-width: 232px` — wider than half a 375px screen.
4. **⚠ `.kd-pf-nrow__go` (the `›` that says a nutrient row is a link) is `opacity: 0` until `:hover`.** On touch, nothing distinguishes a linked row from an unlinked one.
5. **⚠ `.kd-foods-item__go` (the `→` on the 15 Absorption food cards) also only appears on `:hover`.** The card is still clickable; the affordance is hover-only.
6. **⚠ The lane hover highlight** (`.kd-orac-lane--hot`) has no touch equivalent except through pinning a dot.
7. **⚠ Legend / mode / catfilter / pager / add buttons are 18–31px.** **None** meets 44px.
8. **⚠ The age scrubber is a native `range` with a 4px track and a 24px thumb.** Draggable on touch, but the 4px track is what you must hit to start the drag, and the decade ticks under it are decorative — you cannot tap a decade.
9. **⚠ `.fs-filter__q` is `width: 225px` fixed** and shares a flex row with a pager that can hold ten items. That row cannot survive 375px.
10. **⚠ Chip fit is a measured, synchronous, layout-dependent loop.** `fitChips` paints, calls `rowCount` via `offsetTop`, shrinks, repaints — up to 8 passes per tile — and it **waits on `document.fonts.ready`**. Any mobile rebuild that changes tile width changes how many chips survive. Two of 190 cards once spilled to a fourth row because the fit ran in fallback-font metrics and the `max-height` belt hid it.
11. **`markFocus` / `restoreFocus` exist because the block repaints on every keystroke** (so the pager can recount pages against the narrowed pool). On a phone that means the soft keyboard's target is destroyed and recreated per character — the caret restore must be verified under a mobile IME.
12. **Keyboard reality:** Products-grid food cards are `role="button" tabindex="0"`; `.kd-pf-nrow--link` is `role="button" tabindex="0"`; the villi gloss term is `tabindex="0" role="button"` with an `aria-label`. ORAC field dots have no focus affordance; the legend swatches are real `<button>`s.
13. **No drag, no right-click, no multi-select anywhere in these surfaces.** The only pointer-precision requirements are (2), (7) and (8).
14. **Cross-surface timing coupling:** the food sheet's `Add to regimen ›` navigates to Regimen and then, **240 ms later**, looks up `.rail-list .rr-row[data-rr-name={lowercased food name}]` and flashes it. A mobile rebuild that changes Regimen mount timing (or animates the transition) breaks this silently.
15. **`applyKnowledgeSearch` mutates the DOM in place** (hides rows, hoists best matches into a synthesised block, hides empty heads, restores on the next keystroke). Any virtualised/lazy mobile grid breaks it, because it only ever sees mounted rows.

---

## Desktop-only assumptions

**A · FOOD SOURCES**
* `.fs-grid` = `repeat(auto-fill, minmax(300px, 1fr))`; the tile is designed at **340px** and the signed-off record (`chronicle/decisions/2026-08-21-food-tile-F-approved.html`) measures at that width.
* The tile title bar is `grid-template-columns: 1fr 30px`; the body is `auto 1fr` with a vertical rule between the lead and the chips — a two-column body on a 375px card leaves ~200px for up to 7 chips.
* The pager and filter share **one row that must never wrap** (`.fs-pager` is documented "ONE ROW, ALWAYS"); the windowed pager is "at most ten items wide".
* `.fs-controls` is `justify-content: flex-end` with `margin-right: auto` on the pager, specifically so the filter box never moves out from under a mouse cursor mid-word.
* Coverage's block lives in an ~280px aside where the grid collapses to one column *by accident* of `auto-fill`, not by design.

**B · Food sheet**
* `.kd-products-grid` = `repeat(auto-fill, minmax(232px, 1fr))`.
* `.kd-pf-nhead` / `.kd-pf-nrow` = `1fr auto 56px` — a three-column label grid with right-aligned amount and %.
* `.kd-pf-glance` is 2-col with an existing `@media (max-width: …)` fallback to 1-col — one of very few responsive rules in the drawer.
* `.kd-catbar` uses a **negative block margin (`-3px 0`)** on the pill group so the pills add no height to the section-head row — a pixel-measured desktop trick that will not survive a re-layout.
* The drawer panel's starting width is **950px**.

**C · Absorption**
* `.sxb-wrap` = `374px 1fr` around a **500px-tall absolutely-positioned pH ladder**; every label is placed by `top: {px}` from `phY(ph)`; cards are `width: 248px` at `left: 100px`. This figure has **no responsive form at all**.
* `.frt-scene` = `1fr 1fr`: two SVG cutaways side by side — the whole teaching point is the side-by-side comparison.
* `.kd-foods-villi__grid` — damaged left / healthy right, same point.
* `.kd-foods-contrast__grid` and `.kd-foods-form__grid` = `1fr 1fr`.
* `.ue-strip` is a five-tile row.
* `.sx-p` is `max-width: 84ch`; `.sx-note` is `64ch`.
* The section-header numeral/kicker alignment is **measured to 6px** and re-measured by a probe every run.

**D · ORAC**
* `.kd-orac-cellwrap` = `292px 1fr` around a **292×292px circular cell**.
* `.kd-orac-field` sets `--gut: 176px` (128px under 820px) for the lane-name gutter; the rail gets the remainder. On 375px that leaves ~200px of rail for a log axis holding 19 dots.
* `.kd-orac-reach__row` = `150px 1fr 92px`; `.kd-orac-scale__row` = `152px 1fr 82px` — fixed-px name and value columns.
* `.kd-orac-supp__row` = `minmax(0,1.5fr) minmax(64px,1fr) auto 12px`; the leader card is a 2-col grid with named areas (`"top score" "meta score"`).
* `.kd-orac-chain` = `repeat(5, 1fr)` → `1fr 1fr` under 820px, i.e. a five-step **sequence** in a two-column grid — a broken reading order.
* `.kd-orac-claimlist` and `.kd-orac-pieces` are 2-col → 1fr under 820px.
* `.kd-orac-rank` is a flex row of four year/rank cells separated by `→` glyphs.
* `.kd-orac-target` = `1.55fr 1fr` → 1fr under 820px.
* `.kd-orac-forces` is two cards with a `+` between them → stacked under 820px, `+` still in the flow.
* `.kd-orac-fld__ctl` is a dark control bar; `.kd-orac-fld__key` wraps.
* The existing `@media (max-width: 820px)` block in `drawer-orac.css` handles **seven** of these. The field rail, the reach/scale rows, the supplement rows, the cell, the rank row and the tooltip are **not** handled — which is exactly the "retrofit, not a design" the owner rejected.

---

## Feature-preservation contract

A rebuilt mobile experience must satisfy every numbered item. Anything not listed here was not found.

### A · FOOD SOURCES block
1. Food recommendations appear on **both** Coverage and Regimen, from **one** builder, with a separator that makes the food/supplement boundary unmissable.
2. Placement ruling holds: **foods ABOVE products on Regimen, BELOW products on Coverage** (owner, 2026-08-21).
3. Ranking is **one honest sort key, top to bottom, page 1 to page 64** — no curated pin, no greedy re-scoring. Goal key when goals have outstanding nutrients, `strength` otherwise; the EFA group counts in both; tiebreaks `strength` then `id`.
4. Every tile shows: name, **serving label**, `N of 90`, a category-tinted accent, one big lead % with its essential's label, the remaining hits as chips, and an honest `+N` when chips were dropped.
5. `+N` equals what was actually dropped. Never more than **7** chips; never more than **3** chip rows. (`render_probe_food_tile.js` holds both the signed-off record and the app to this.)
6. `≈` marks an APPROXIMATE tier on the lead **and** on the chips — the same glyph teaching one symbol.
7. **The provenance gloss reaches the reader on touch**, on the lead and on every chip: which publication measured it, that it is measured against a Wallach target, whether it is a conservative floor, and what "approximate" means. The source names itself from `_meta.source_display` — never a literal.
8. The `+` control adds the food to the active regimen slot through `addOrBumpRegimenItem`, storing `food_id` on `label` (Zod strips unknown top-level keys) with `provenance: 'food_catalog'` so numbers auto-heal from the live catalog on every paint. **Never mark a food user-supplied** — that freezes the stale snapshot.
9. Coverage caps **adding** at 12 foods but leaves the **whole 192-food catalog browsable**; at budget zero it says so.
10. Regimen never exhausts its foods list — once the field is closed it switches to the education note and keeps ranking by nutrition.
11. A pager exists wherever more than one page does, and **never** over a single page. Coverage: arrows + an `N / N` readout. Regimen: a windowed numbered pager that **starts** at the current page (`1 2 3 4 5 … 64` on page one; `1 … 20 21 22 23 24 … 64` on page twenty; `1 … 60 61 62 63 64` on the last), with an ellipsis only between genuine non-neighbours.
12. Regimen's category + name filter narrows the **pool**, resets to page 1, keeps the caret across the repaint, and stays on screen when it matches nothing.
13. Category options are **derived** from the catalog, never a written-down list.
14. All three empty endings stay distinct: filter-matched-nothing, tab-cap-reached, nothing-moves-a-gap.
15. The exhaustion easter egg survives (or is deliberately retired with the owner's say-so). It is the app's only outbound link.
16. The page index is **session state owned by the calling view**, never persisted and never held inside the block.

### B · Food row + nutrient sheet
17. Foods appear in the Products grid **mixed with products in one order** (essentials supplied desc, name asc) — never segregated.
18. A food's hue is rust `#b0442e`, matching none of the seven delivery-form colours, and mirrored in JS (`FOOD_COLOR`) for the scrollbar bridge.
19. The All / Products / Foods control survives, with **derived** counts in the head naming the two halves separately (never summed).
20. A food is reachable by the tab's keyword search on name, category, source description, portion **and** every essential it carries (label, slug, spaced slug) — so "b12" and "vitamin b12" both answer.
21. A food is reachable from Knowledge Home live-suggest, in a `Foods` group, matching on name **or category** ("legume", "shellfish"), showing `{portion} · {category}`.
22. The sheet renders: hero (leaf glyph, name, `FOOD` chip, `{category} · FDC {id}`), origin-aware back, `Add to regimen ›`, lede, **At a glance** (hits count / `of 90`, Serving + grams, Strongest %, Measured-by source count), the nutrition-facts table, the source description, the floor note and the SOURCE provenance foot.
23. The third column header says **`% of target`**, never `%DV`.
24. Amounts print 2dp, falling back to 3 significant figures rather than showing `0`.
25. Rows descend by %, link to the essential's page where the canon has one, are tinted by category, and mark `≈` and `floor`.
26. The **EFA group row carries no link and no category tint** — it is not one of the 90.
27. The 7% floor is stated in the sheet's own words, sourced from `foodQualifyPct()`, together with the fact that no calorie or macronutrient source is pinned.
28. A food with no qualifying hits shows the honest `No / numbers` kill-state, not a blank table.
29. `Add to regimen ›` navigates to Regimen and visually confirms the add on the matching rail row.

### C · Absorption tab
30. All four chapters survive, in order, with their numerals: 01 hero, 02 villi, 03 remove↔eat, 04 stomach acid.
31. Both `.ds-pull-stat` kill-shots (115M and 75%) with their readouts and small print.
32. The villi comparison stays **readable as a comparison** — damaged vs healthy, with nutrient dots x-matched across both panels so the difference reads at a glance. Jitter is deterministic (no `Math.random`), so the render is stable for the probe.
33. `villi` keeps its glossary term with hover **and** focus **and** tap.
34. Both sealed pull-quotes render with their page/citation read from the claim, their highlight ranges intact, and the display-time quote-glyph repair — and render **nothing** rather than something invented when the claim does not resolve.
35. All 15 curated food cards (5 remove / 6 eat / 4 conditional) with their claim-sourced one-line "why", each opening its own topic page.
36. The pH ladder still teaches that the stomach sits at **1.0** and the intestine at **8.2**, with the defended blood band at 7.36–7.44 — with the two claims correctly attributed (DDDL-000134 for the anchors, RARE-000135 for the band).
37. The fortress cutaway keeps both states, their **side-by-side** contrast, and the four-item legend.
38. The heartburn callout ("usually too little acid, not too much").
39. The five Ultimate Enzymes tiles with **live** amounts from the Product DB and their Wallach-backed / plant-enzyme provenance dots.
40. The CTA bar with a **derived** per-serving wholesale price and per-day figure (×3 for t.i.d.) — and no number at all if the price is missing.
41. The crown-jewel claim record (8 claims), facet-grouped with **protocol first**.

### D · ORAC tab
42. All nine sections survive, in order, with their numerals, plus the graceful-degradation contract: no `orac-data` → hero + §09 only; `orac-foods` and `orac-products` fail independently.
43. §01 mirror keeps a way to move through the decades and read the pigment percentage, the caption word and the age — and keeps the disclaimer that only the four marked ages are Wallach's figures.
44. §01 stolen-years keeps `20–25 years`, the should/actual sentence, and the four-point rank decline with only the newest accented.
45. §02 keeps the five-step chain **as a sequence**, with its pale→vivid accumulation ramp.
46. §03 keeps `20,000–25,000 ORAC points / day` and the `100,000+` disease side-panel.
47. §04 keeps all nine reach bars, the % label, the `of a day` unit, the over-target hatching capability, and the "read the empty half" note.
48. §05 keeps the spice-outlier scale on **one linear axis** — the whole point is that the fruit vanishes.
49. §06 keeps **every one of the 60 foods on one shared axis**, in nine labelled family lanes, with the log/linear toggle, the target line, the per-dot readout (name, value, unit + basis, share of a 25,000-point day, bar), and a way to filter a family out. The Hell's Kitchen lane keeps its "different basis" label rather than being silently mixed in.
50. §06 positions are computed at render for **both** modes and baked into the markup — the static render must remain correct with zero post-render JS.
51. §07 keeps the leader card and all six runner-up rows with ORAC/serving, wholesale price, ORAC-per-dollar, a form badge in the product's own hue, and the `untested_note` caption. Each row opens that product's detail page with an origin-aware crumb back to ORAC.
52. §08 keeps the four pieces (2 "on this page", 2 "Absorption tab"), the cross-tab button to Absorption, the two forces (`raises your AVERAGE` vs `raises your CEILING`) and the payoff.
53. §09 keeps all 33 claims, facet-grouped with big_question first, each collapsible to question + short answer + short cite and expanding to full answer, glossified verbatim and full citation. **The count is derived from the live query.**

### Cross-cutting
54. Category colour-coding holds everywhere a nutrient is shown: minerals blue, vitamins orange, aminos green, omegas/fatty acids purple (`--fs-cat-*` on the tile, `--fam-*` on the sheet rows).
55. Both themes. Dark-theme remaps already exist for `.fs-grid` category hues, `.ue-*`, `.frt-*` figure surfaces, the villi SVG strokes, the ORAC chain / force / payoff / cell fills and the field control bar — a rebuild must carry equivalents.
56. Wholesale is the featured price (the Ultimate Enzymes CTA and §07 alike).
57. No emoji. Icons are inline SVG (`ADD_PATH`, `FOOD_GLYPH`, villi, fortress) or typographic (`‹ › … → ▸ ≈ · ❡`).
58. No network at runtime except the deliberate easter-egg link.
59. Every probe that currently guards these surfaces must still run, or be knowingly re-pointed: `render_probe_food_tile.js`, `render_probe_food_pager.js`, `render_probe_food_catalog.js`, `render_probe_food_tier.js`, `render_probe_food_efa_rank.js`, `render_probe_efa_foods.js`, `render_probe_foods.js`, `render_probe_orac.js`, `render_probe_orac_supplements.js`, `render_probe_mirror.js`. (Note: `render_probe_orac.js` already documents two **stale** check groups pointed at classes the view no longer emits — `.kd-orac-dec*` and `.kd-orac-tbl*`.)

---

## Open questions

1. **A food tile cannot open its own food sheet.** The tile's only control is `+`. On desktop the truncated chips are at least visible; on a 375px card most of the readout will hide behind `+N` with no way to see the rest. The sheet already exists and shows every hit — should the mobile tile link to it? That is a new affordance, so it needs the owner's ruling, not a designer's choice.
2. **How does the provenance gloss survive touch?** Contract item 7 is hard, and the current mechanism (`title=`) cannot meet it. Candidate patterns: reuse the `.gloss` tap wiring; a per-tile expandable "where these numbers come from" row; a bottom sheet; an inline info mark per number. Owner's call.
3. **What replaces the ORAC field on a phone?** 60 dots on a ~200px rail with 15px targets is not portable. Options that preserve the data: a searchable/sortable list per family; a lane-at-a-time view; a full-screen landscape plot; keep the plot but drive selection from a list. **The data must survive whatever shape wins** — all 60 foods, nine families, both axis modes, the target line, the different-basis label.
4. **The pH ladder is a 500px absolutely-positioned figure with px-placed cards.** Does it become a vertical scroll-through, a simplified two-anchor diagram, or something else? Its teaching load (1.0 vs 8.2, with the defended blood band between) is what must survive, not its geometry.
5. **Should the Regimen filter + pager stay on one row?** "ONE ROW, ALWAYS" is a desktop constraint. On mobile the filter probably wants to be a sticky control and the pager either infinite scroll or "load more". Moving to infinite scroll retires ten clauses of `render_probe_food_pager.js` — that needs a decision, not a silent drop.
6. **Coverage vs Regimen foods: are two shapes still right on mobile?** Today Coverage gets arrows plus a 12-food add cap; Regimen gets numbers plus a filter and no cap. On one narrow surface the distinction may read as inconsistency. The cap itself is an owner ruling and must not be dropped without one.
7. **Dead CSS in `drawer-knowledge.css`** that no view emits: `.kd-foods-gate__*` (≈12 rules), `.kd-foods-time__*` (≈6), `.kd-foods-enz__panel*`, `.kd-foods-enz__lead` / `__stat` / `__hd`, `.kd-foods-villi__note`, `.kd-foods-villi__hd`, `.sxbeat--tight`. Leftovers from a superseded §04 design. The `workspace_coverage_no_dead_rules` gate does not cover the drawer sheet, so nothing catches them. Delete during the rebuild, or record why not.
8. **Dead data:** `orac-foods-data.json`'s `wine` member is required by the schema and emitted by the derive but **rendered by nothing** — the wines now draw as a `tables` category. `OracFoodsData.tables.categories[].rows[].bar` is likewise legacy; the field computes every position itself.
9. **Stale selector:** `KD_SEARCH_ITEM_SELECTOR.foods = '.kd-foods-topic'` — a class no view or stylesheet emits. Harmless today only because the Absorption tab renders no search box. If mobile gives Absorption a search box this is a silent no-op waiting to happen; the real item class is `.kd-foods-item`.
10. **Unused copy keys:** `kd_foods_villi_note`, `kd_foods_villi_kicker_scan`, `kd_foods_villi_kicker_sub`, `kd_orac_dec_lbl`, `kd_orac_dec_age_prefix`. Were these meant to render and got dropped, or are they retired?
11. **`fitChips` is a synchronous measure/repaint loop per tile after `fonts.ready`.** Three tiles per page is cheap; a mobile design that shows more tiles at once (or scrolls infinitely) needs this re-thought or it becomes per-scroll layout thrash.
12. **The 240 ms flash timeout** after `Add to regimen ›` is a timing coupling to the Regimen mount. If mobile navigation animates (View Transitions), it must become event-driven.
13. **No datum exists for anything a design might want to add.** In particular: no calorie or macronutrient source is pinned for any food, and no food in the 192-food catalog carries an ORAC value — the ORAC food tables are a separate curated list of 60 names, not joined to the composition catalog. A mobile design must not imply either.
