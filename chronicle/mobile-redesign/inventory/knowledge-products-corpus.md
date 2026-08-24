# Knowledge · Products/Catalog + Corpus (Conditions & Books) — feature inventory

_Read from source on 2026-08-22 (branch `master`). Files read in full:
`dashboard/assets/js/src/views/knowledge-products.ts` (737 ln),
`dashboard/assets/js/src/views/knowledge-corpus.ts` (190 ln),
`dashboard/assets/js/src/views/knowledge.ts` (1115 ln — the shell that hosts both),
`dashboard/assets/js/src/views/knowledge-food-sheet.ts` (row half),
`dashboard/assets/styles/drawer-knowledge.css`, `drawer-shared.css`, `theme.css` (dark blocks),
`dashboard/assets/js/src/core/schemas/product-detail.ts`, `state/recommender.ts`,
`state/corpus.ts`, plus the generated data artifacts (every count below is MEASURED, not quoted)._

---

## ⚠ SCOPE CORRECTION — READ THIS FIRST

The brief assumed `views/knowledge-corpus.ts` is "the corpus surface — books, claim counts, how a
book and its claims are browsed." **It is not.** `knowledge-corpus.ts` renders the **CONDITIONS
tab** (a 510-card ghost-number grid) plus three derivations the condition entity page reuses.

**There is NO book-browsing surface in the app.** `drawer-knowledge.css:129` says so in its own
words: `Book rows — UNREACHABLE: nothing renders .kd-book-row (no tab lists books)`. A Corpus tab
existed once; its CSS (`.kd-book-row*`, `.kd-book-deep*`, `.kd-book-row--planned`, ~40 rules) and
its data (`planned_books`) survive with no renderer. Books reach the screen ONLY as (a) a count on
the Knowledge Home stat line, (b) a citation label under a claim, (c) an "N books" meta bit on an
entity/topic page. Section **[C] Books / corpus** below records what exists, what is dead, and what
data is available should the rebuild want a real book browser.

So this document covers three things: **[A] the Products/Catalog tab** (the brief's main target),
**[B] the Conditions tab** (what `knowledge-corpus.ts` actually is), **[C] Books/corpus** (the
honest state of it).

---

## Destinations & states

### [A] Products tab (`kd_tab_products` → label "Products")

| # | State | How you get there | What renders |
|---|---|---|---|
| A1 | Catalog index, kind=`all` (DEFAULT) | tab click; `openTab('products')`; `close()` + reopen resets to it | head `ALL 215 PRODUCTS + 192 FOODS · SORTED BY ESSENTIALS SUPPLIED`, the All/Products/Foods control, then **407 cards in one grid** |
| A2 | Catalog index, kind=`products` | tap "Products" pill | head `ALL 215 PRODUCTS · …`, 215 cards |
| A3 | Catalog index, kind=`foods` | tap "Foods" pill | head `ALL 192 FOODS · …`, 192 cards |
| A4 | Catalog + search filter active | type in the drawer search bar | rows toggle `.kd-hidden` in place; a "Best match" block is **hoisted to the very top**; heads with no surviving row hide |
| A5 | Catalog, search with zero hits | term matches nothing | `— nothing in products matches "x" —` appended at the bottom of the body |
| A6 | Product detail open (over the list) | tap any product card, an ORAC "best supplement" row, a `kd-ep-src` row on an essential page, or a breadcrumb | full product page **PREPENDED above** the catbar + grid; the whole 407-card grid stays mounted below it |
| A7 | Food detail open (over the list) | tap any food card | food nutrient sheet prepended into the same slot; **a food detail wins over a stale product selection** |
| A8 | Empty catalog | `nProducts===0 && nFoods===0` (data load failure) | `— no products loaded —` — replaces everything, including the filter control |
| A9 | Detail open + search active | search while a detail is open | `applyBestMatch` **relocates the open detail node** to sit directly under its own row inside the Best-match block (it matches `.kd-essential-deep`, which the product panel carries) |

### [B] Conditions tab (`kd_tab_conditions` → "Conditions")

| # | State | Notes |
|---|---|---|
| B1 | Condition index | head `ALL 510 CONDITIONS · SORTED BY HOW MUCH WALLACH WROTE` + **510 cards**, claim_count desc then A–Z |
| B2 | Index + search | same DOM-filter machinery; condition rows carry a **2500-char hidden keyword blob** so "smell" surfaces Anosmia |
| B3 | Condition detail open | `renderConditionPage` (from `views/entity-page.ts`, NOT this file) prepended above the grid |
| B4 | Empty corpus | `— no conditions in the corpus yet —` |

### [C] Books / corpus
No destination. Dead CSS for a former "Corpus tab" (book-spine rows, planned/coming-soon rows, a
`.kd-book-deep` panel with eyebrow, count and close button) is still in the sheet; nothing renders
it. `applyKnowledgeSearch` still search-highlights `.kd-book-deep` — a selector that can never match.

### Shell states that wrap all of the above
- Drawer closed / open (`.kd-open`, 950 px panel pinned `left: 220px`, full height, `overflow:hidden`).
- Six visible tabs (Home · Absorption · ORAC · Conditions · Explore · Products); a 7th route
  (Essentials) is live but deliberately unlisted.
- Breadcrumb rail (`.kd-crumbs`) — appears only inside a detail; max 6 crumbs; re-visiting an entity
  already in the trail truncates back to it instead of appending.
- Search bar exists ONLY on essentials/conditions/products/explore, and hides while a topic overlay is open.

---

## Controls

| Control | What it does | Where it lives | Touch-hostile? |
|---|---|---|---|
| Tab pill ×6 (`[data-kd-tab]`) | switch tab; clears every selection, the trail AND the search query | header pill group, centred | **YES** — 6 pills on one row inside a 950 px header; at 375 px they are crushed. The old retrofit patched only this one thing. |
| Close × (`.ui-close`, `data-kd-action="close"`) | closes drawer; resets tab→home, kind→all, query→'' | header right | 32 px hit box (<44) |
| Drawer search input (`.kd-search-input`, maxlength 120) | live per-tab DOM filter on `input` | bar under header | placeholder is `SEARCH PRODUCTS…` (uppercased tab name) |
| Search clear × (`data-kd-action="search-clear"`) | clears query in place + refocuses input | inside search bar, only when `.has-query` | 2px/7px padding — far under 44 px |
| `/` kbd hint (`.kd-search-kbd`) | **decorative only — no `/` handler exists in the Knowledge drawer** (regimen.ts has one; knowledge.ts does not) | search bar | meaningless on touch; drop it |
| All / Products / Foods (`[data-kd-catfilter]`) | sets `catalogKind`, triggers a **full re-render** (the head counts must change with it) | `.kd-catbar`, right-aligned, sharing the head's row | **YES** — 3px/10px pills, ~21 px tall |
| Product card (`.kd-product-row[data-kd-product]`, `role=button tabindex=0`) | `openDetail('product', id)` | grid | large target (min-height 120 px) ✔ but hover-only affordances (below) |
| Food card (`.kd-product-row--food[data-kd-food]`) | `openDetail('food', id)` | same grid | same |
| Condition card (`.kd-condition-row[data-kd-condition]`) | `openDetail('condition', slug)` | grid | ok size; hover-only ghost brightening |
| Breadcrumb button (`[data-kd-crumb]`) | `goCrumb(i)`; index 0 = origin-tab anchor = exit the detail | top of body | text-sized, zero padding — under 44 px |
| Back (`.kd-ep-back`, `data-kd-action="product-close"`) | origin-aware: "‹ All products" clears the detail; "‹ Go back" calls `goCrumb(0)` | top-right of the detail hero | 3px/9px padding — **way** under 44 px |
| **Add to regimen** (`.kd-ep-add-regimen`, `data-add-product`) | `addOrBumpRegimenItem` → dispatch `wallach:navigate {to:'regimen'}` → **closes the whole drawer** → 240 ms later flashes the matching `.rr-row` | stacked under Back | same tiny geometry as Back, yet it is the primary action |
| Nutrient row link (`.kd-pf-nrow--link[data-kd-essential]`, `role=button tabindex=0`) | opens that essential's page (switches tab to `essentials`) | Supplement Facts table | **invisible affordance**: the `›` chevron is `opacity:0` until `:hover` |
| Blend disclosure (`<details class="kd-pf-blend">`) | native open/close | Supplement Facts | native `<details>` — the one genuinely touch-safe control here |
| Essential pill (`.kd-ep-pill--nut[data-kd-essential]`) | opens that essential's page | "Essentials on this label" cloud | 3px/9px — under 44 px; up to 35 pills |
| `†` marker | `title="Daily Value not established"` — **hover-only tooltip** | %DV column | **YES, loudly** — the whole explanation of `†` is a title attribute |
| Show N more sources (`data-kd-action="sources-more"`) | toggles `.is-expanded` on `.kd-sources` | **DEAD — see Open questions #1** | n/a |
| ORAC / essentials `kd-ep-src` rows | `data-kd-product` → product detail (crosses tabs) | other surfaces | feed the same detail panel |

---

## Data points rendered

### [A1] Product card (`renderProductRow`)

| Datum | Source field | Format/unit | Why it matters |
|---|---|---|---|
| Ghost number | `essentialSlugsByProduct().get(id).length` (recommender index, **unfiltered**) | integer; no ghost at all when 0 | The grid's sort key AND its whole claim: position = breadth. **60 of 215 products are 0**, max 35, median 2. |
| Form chip | `formFamilyFromForm(components[0].form)` uppercased | LIQUID · CAPSULE · POWDER · TABLET · CHEWABLE · TEA · TOPICAL (OTHER unreachable today) | the colour axis; buckets **26 distinct raw label forms** into 7 |
| Name | `product.name` | display font, `max-width:97%` | — |
| Foot line | composed | `of 90 essentials · $12.34 · 30 servings` OR `targeted formula · …` | "of {essentialCount()}" is DERIVED, never a literal 90 |
| Price | `price.wholesale`, falling back to `price.retail` | `$` + 2 dp | **Wholesale is the featured price**; both are present on all 215 |
| Servings | `components[0].servings_per_container` | "N serving(s)" | pluralised inline |
| `data-search` blob | canon essential slugs (+ de-hyphenated) ∪ every nutrient name ∪ blend names ∪ `as_labeled` ∪ other ingredients | space-joined | why "b12", "reishi", "lactobacillus" and blend-carried trace minerals (boron, vanadium) all match |

### [A6] Product detail (`renderProductDeep`) — every field on screen

| Datum | Source | Format | Notes |
|---|---|---|---|
| Cube glyph | inline SVG constant | 56×56, stroked in `--form` | product identity mark (foods use a leaf) |
| Name (h1) | `name` | display, **tinted `--form`** | the product page colour-codes MORE than the condition page: icon + title + frame + scrollbar |
| Form chip + dot | form family | `<i></i>` + UPPERCASE | |
| `Youngevity product · SKU {sku}` | `sku` | all 215 have one | |
| Lede sentence | derived | "A {forms} supplement — one serving is {serving_size}, {n} servings per container. The label lists {n} nutrients across {m} whole-food blends." | blend-only products get "The label is built from {m} whole-food blends." — **never "lists 0 nutrients"** (42 products have zero nutrient rows) |
| Glance hero numeral | supplied | 3.4 rem display face in `--form` | or the "Targeted formula" kill-word for the 60 zero-supply products |
| Wholesale metric | `price.wholesale` | `$x`, sub `$y retail` | |
| Per-serving metric | `serving_size` (free-text string) + sub "N per container" | "2 capsules", "1 scoop (12 g)" | |
| Cost / serving | `wholesale / servings_per_container` | `$z`, sub "wholesale ÷ servings" | **computed in-view**, only when spc is a number > 0 |
| §00.A note | static | italic micro | "…never a Wallach target (§00.A)" |
| Component head | `role` ?? `form` ?? "Component"; single component → "Supplement facts" | **210 products = 1 component, 4 = 2, 1 = 3** | multi shows a "{n} components" hint |
| Component meta | `form` (multi only) · `serving_size` · "N servings" | mono micro | |
| Macro chips | `macros` record (calories / carbs / sugars / protein …) | `<b>{amount}{unit}</b> {key with _→space}` | **105 of 215 products carry macros**; the record is a passthrough — keys are whatever the pillar holds |
| Nutrient row: name | `nutrients[].name` | sans bold | **1377 rows total**; max 34 on one label |
| Nutrient row: unit_detail | `unit_detail` | `(…)` faint micro | e.g. "B1" |
| Nutrient row: chemical form | `form` | own line, italic, faint | e.g. "as ascorbic acid" |
| Nutrient row: amount | `amount` (number **or bounded string** e.g. `"<1"`) + `unit` | mono, right, nowrap | |
| Nutrient row: IU | `label_iu` | ` · 1000 IU` | |
| Nutrient row: %DV | `pct_dv` | `{n}%` or `†` | `†` = "Daily Value not established" |
| Nutrient row: category tint + link | matched by `normNutrientName` ∪ **B-vitamin number bridging** (`thiamin`→b1 … `cobalamin`→b12, or a `unit_detail` of "B1") against the essentials the product ACTUALLY supplies | 3 px left border in the category colour + a `›` chevron | grounded: a row links only when the product genuinely supplies that essential; unmatched rows stay neutral |
| Blend summary | `blends[].name` ?? "Proprietary blend" | display 600 | **137 products have blends**; max 13 on one label |
| Blend meta | `total.amount+unit`, else `total_cfu.amount+unit`, plus "{n} ingredients" | mono, right | CFU for probiotics |
| Blend body | per ingredient: `name` + `form` + `part` + `(standardization)` + `<i>(latin)</i>`, joined ` · ` | falls back to `as_labeled` when there is no ingredient list | **normalized formatting, not byte-exact label wording** (documented in-source as deliberate) |
| Other ingredients | `other_ingredients[]` joined ", " | sans xs | **212 of 215 products** |
| Directions | `components[].directions` | left-bordered `--form` slab | **only 22 of 215 products have any** — "How to use it" is absent for 193 |
| Essentials cloud | supplied essentials that have an entity page, A–Z | pills | lead: "This product delivers **N** of Wallach's 90 essentials that have their own page — tap one to read it." |
| Source foot | static | mono micro, top rule | |
| Scrollbar tint | `productScrollTint(id)` → `FORM_COLORS[fam]`, published on `<html>` as `--kd-detail-scroll` | hex | WebKit scrollbar pseudos read ONLY root-level custom props — hence the JS mirror of the CSS colour map |

### [B] Condition card (`renderConditionRow`)

| Datum | Source | Format | Notes |
|---|---|---|---|
| Ghost number | `condition.claim_count` | 2.5 rem in `--cat` | sort key; range 1–76, summing 2292 across 510 conditions |
| Category chip | `conditionCategory(slug)` → one of **12** categories (label + hex + an inline SVG icon) | dot + UPPERCASE label | **12 of 510 conditions are unmapped** → no chip, colour falls back to the app accent. The category's SVG **icon is not used on the card** — only its colour is. |
| Name | `display_name` | display 600, `max-width:82%` | |
| Foot | `claim_count` + `essentials_involved.length` | "12 claims · 4 nutrients" via `plural()` | **120 of 510 conditions have 0 nutrients** → the card reads "· 0 nutrients" |
| `data-search` blob | display_name, de-slugged slug, essential display names, other substances, **every claim's `claim_text` + `verbatim` + symptoms** | lowercased, whitespace-collapsed, **hard-capped at 2500 chars** | the cap is a silent truncation: a 76-claim condition is only partially searchable |

### [C] Book data that EXISTS but is barely rendered
`corpus-embed.json.books` — 7 books, each with `title`, `edition`, `year`, `authors`, `code`,
`claim_count`, `status`. Measured: *Dead Doctors Don't Lie* 3rd/2011 **576 claims**; *Epigenetics*
1st/2014 **478**; *Hell's Kitchen* 3rd/2015 **118**; *It's All In Your Head* 1st/2020 **21**;
*Immortality* 1st/2008 **515**; *Let's Play Doctor* 4th/1995 **518**; *Rare Earths: Forbidden Cures*
1st/1994 **375**. `planned_books` holds 4 entries (LPHD, HKCP, EC, PA) — **stale: HKCP is already
in-housed** — and nothing renders them. Rendered today: `getBookLabel(id)` → `"Title (3rd ed. 2011)"`
on claim cites; `listBooks().length` and the summed `claim_count` on the Home stat line;
`page.books.length` as an "N books" meta bit on entity/topic pages. Corpus totals: **2601 claims,
510 conditions, 91 essential records**.

---

## Copy (complete, verbatim)

**Tab labels** (`view-copy.json /ui`): `Home` · `Absorption` · `ORAC` · `Conditions` · `Explore` ·
`Products` (+ unlisted `Essentials`). Header mark: `❡ KNOWLEDGE`. Pinned block label: `Best match`.

**Products tab**
- `ALL {n} PRODUCTS + {m} FOODS · SORTED BY ESSENTIALS SUPPLIED`
- `ALL {n} PRODUCTS · SORTED BY ESSENTIALS SUPPLIED`
- `ALL {m} FOODS · SORTED BY ESSENTIALS SUPPLIED`
- Filter group `aria-label="Show"`, buttons `All` · `Products` · `Foods`
- Card foot: `of {90} essentials` / `targeted formula`; `$12.34`; `30 servings`
- Card chip: `LIQUID` `CAPSULE` `POWDER` `TABLET` `CHEWABLE` `TEA` `TOPICAL` (`FOOD` on food cards)
- Empty: `— no products loaded —`
- Search placeholder `SEARCH PRODUCTS…`; no-match `— nothing in products matches "{q}" —`
- Search clear: `aria-label="Clear search"` / `title="Clear search"`, glyph `×`; kbd hint `/`
- Close: `title="Close (Esc)"`, `aria-label="Close"`

**Product detail**
- `‹ All products` / `‹ Go back` · `Add to regimen ›`
- `Youngevity product · SKU {sku}`
- Lede: `A {forms} supplement — one serving is {serving}, {n} servings per container.` +
  ` The label lists {n} nutrients across {m} whole-food blends.` OR
  ` The label is built from {m} whole-food blends.`
- `At a glance` + hint `what's on the label`
- `of {90} Wallach essentials` / `delivered on this label`
- `Targeted` / `formula` + `a focused botanical outside` / `the 90 core essentials`
- Metrics: `Wholesale` / `$y retail` · `Per serving` / `{n} per container` · `Cost / serving` /
  `wholesale ÷ servings` · fallback `—`
- Note: `Composition and an indicative Youngevity listing price — what the product contains, never a Wallach target (§00.A). Wholesale is featured (what most buyers pay online); retail is the MSRP.`
- `Supplement facts` + hint `{n} components`; single-component title `Supplement facts`; fallback `Component`
- Table head: `Nutrient` · `Amount` · `%DV`; DV fallback `†` with `title="Daily Value not established"`
- `Blends` + hint `tap to see what's inside`; blend fallback name `Proprietary blend`; meta `{total} · {n} ingredients`
- `Other ingredients`
- `How to use it`
- `Essentials on this label` + `This product delivers {n} of Wallach's 90 essentials that have their own page — tap one to read it.`
- Foot: `SOURCE · Youngevity product label · composition + indicative listing price (§00.A · never a Wallach target)`

**Best-sources block (DEAD — no caller)**
- `BEST SOURCES · YGY VAULT` · `{n} NUTRIENTS · ${price}` · `Show {n} more source(s) in the vault` /
  `Show fewer sources` ·
  `Ranked by amount delivered · breadth · value. The enough-vs-your-target adequacy step activates once Wallach dose targets are mined.`

**Conditions tab**
- `ALL {n} CONDITIONS · SORTED BY HOW MUCH WALLACH WROTE`
- Card foot: `{n} claim(s) · {m} nutrient(s)`
- Empty: `— no conditions in the corpus yet —`
- Placeholder `SEARCH CONDITIONS…`; no-match `— nothing in conditions matches "{q}" —`
- Category chip labels (12): `Bones, Joints & Muscles` · `Mind & Nerves` · `Heart, Blood & Circulation` ·
  `Skin, Hair & Nails` · `Digestion & Liver` · `Hormones & Metabolism` · `Reproductive & Urinary` ·
  `Respiratory` · `Immunity & Infection` · `Eyes, Ears & Mouth` · `Cellular / Systemic` · `General / Other`
- Derived synopsis sentences (authored here, rendered by the condition entity page):
  `Wallach links {condition} to a deficiency of {A, B and C}.` /
  `Wallach's protocol for {condition} centers on {…}.` / tail `, among others` (name cap 4)

**Books:** `{Title} ({edition} ed. {year})`, degrading to `{Title}`, then to the raw id.

---

## Interaction dependencies (what cannot survive a touch screen)

1. **⚠ NO KEYBOARD ACTIVATION AT ALL on the card grids.** Product, food, condition and nutrient rows
   all carry `role="button" tabindex="0"` — but the drawer's only `keydown` handler serves the Home
   hero's live-suggest dropdown and returns early for everything else, and the global handler in
   `main.ts` only does Esc / 1-2-3 / S / K. **Enter or Space on a focused card does nothing.** A live
   a11y defect, not a mobile-only one; the rebuild must use real `<button>`/`<a>` elements or wire activation.
2. **⚠ The `›` "this row is a link" chevron on Supplement-Facts rows is `opacity:0` until `:hover`.**
   On touch there is zero signal that ~1377 nutrient rows are tappable.
3. **⚠ The `†` symbol's only explanation is a `title` attribute** — no tooltip on touch, no legend.
4. **⚠ Every card's ghost number brightens only on `:hover`** (22% → 34% colour-mix). The resting
   state is the only state a phone will ever show.
5. **Hover-only card lift** (`translateY(-1px)` + shadow) and hover-only border tint: the
   `--form` / `--cat` colour identity is weakest exactly where it must be strongest.
6. **`.kd-catfilter__b:hover` border-accent** is the pill's only non-selected feedback.
7. **Blend `<details>`** is the one control that already behaves correctly on touch — keep it.
8. **The search field's `/` hint** implies a shortcut that does not exist on this surface at all.
9. **`applyBestMatch` MOVES live DOM nodes** (never clones) and re-parents the open detail under its
   own row; any rebuild that switches to a virtualized or re-rendered list must re-implement this or
   drop it deliberately. `restoreHoisted()` puts them back in reverse order on the next keystroke.
10. **Scroll position is destroyed on every `render()`** — tab switch, catalog-filter tap, detail
    open, detail close, and any `regimen:changed` event replace `container.innerHTML`, recreating
    `.kd-body`. `views/scroll-keep.ts` exists but the Knowledge drawer does **not** use it. Tap card
    #300 of 407, then Back → you land at the top of the grid. On a phone this is the single most
    destructive behaviour on the surface.
11. **`Add to regimen` closes the entire drawer.** `navigateTo` → `closeAllDrawers()` → the drawer's
    `close()` resets tab→home, kind→all, query→'', trail→[], and jumps to the Regimen workspace,
    flashing the new row after a 240 ms `setTimeout`. There is no "added ✓, keep browsing" path.
12. **Origin-aware back is coarser than it looks.** A product opened from an essential's page has
    trail `[tab:essentials, essential:Boron, product:X]`; "‹ Go back" calls `goCrumb(0)`, which lands
    on the **essentials grid**, not on Boron. Only the breadcrumb rail returns you to the page you
    were reading — and the breadcrumb is the smallest control on screen.

---

## Desktop-only assumptions

1. **950 px fixed panel offset `left:220px`** for the rail — a full-height overlay column that
   assumes a rail beside it.
2. **`repeat(auto-fill, minmax(232px, 1fr))`** for both grids: at 375 px this silently collapses to
   ONE column, producing a **407-item** (or **510-item**) single-file scroll with no pagination, no
   virtualization, no alphabet index, no sticky section headers and no jump-to.
3. **6 tab pills on one centred row** between a mark and a close button.
4. **Detail-as-prepended-block, not a route.** The catalog stays fully rendered underneath the open
   product page. On desktop nobody notices; on a phone the "page" has 407 cards glued to its tail.
5. **3-column Supplement-Facts grid `1fr auto 56px`** with a right-aligned nowrap amount column —
   long chemical-form names plus "1,000 mg · 1000 IU" inside ~300 px of usable width.
6. **`.kd-pf-glance` 2-up hero + metrics**, with a lone `@media (max-width:620px)` rule that stacks
   it — the ONLY responsive rule on this entire surface, and the only evidence anyone ever considered
   a narrow viewport here.
7. **`.kd-pf-glance__metrics` = `repeat(3,auto)` justified `space-between`** — three money/serving
   metrics side by side.
8. **Colour is carried by 1 px borders, 8 px dots and 22 %-opacity ghosts** — a system tuned for a
   large, evenly lit canvas seen at arm's length.
9. **`.kd-crumbs` wrap-anywhere breadcrumb** with up to 6 entries and no truncation.
10. **Scrollbar-as-identity** — the product's form colour is published to the drawer's scrollbar
    thumb (`--kd-detail-scroll`). Mobile has no visible scrollbar; that identity signal is simply lost.
11. **Search sits in the chrome, permanently visible**, assuming a keyboard is one keystroke away.
12. **Hover as the primary discovery mechanism** on cards, nutrient rows and filter pills.

---

## Feature-preservation contract

A rebuilt mobile Products/Catalog + Conditions surface MUST satisfy every line below.

**Catalog list**
1. Show **all 215 Youngevity products** and **all 192 catalog foods** — including kids products and
   superseded products, which the catalog deliberately does NOT filter (only the *recommender*
   filters them; the `kids_products_not_recommended` invariant asserts BOTH halves, so adding a
   filter here turns a gate red on purpose).
2. Keep **ONE mixed order across both kinds** — `supplied` desc, then name A–Z. Never segregate
   products from foods; the position IS the breadth claim.
3. Keep the **All / Products / Foods** three-way filter, and keep the head's counts **derived**
   (`nProducts`/`nFoods` off the live lists), never literals.
4. Keep the ghost number = essentials supplied, from the **unfiltered** `essentialSlugsByProduct()`
   index (so blend-carried trace minerals count), and keep `of {essentialCount()}` derived.
5. Keep "targeted formula" for the 60 zero-supply products — never render a "0".
6. Keep the 7 delivery-form colours exactly (`liquid #3f8fa8`, `capsule #c08a3e`, `powder #5f8a4b`,
   `tablet #5a63a8`, `chewable #a8517f`, `tea #9a7b3c`, `topical #6a6f77`) plus food rust `#b0442e`,
   and keep the JS map (`FORM_COLORS`) and the CSS map in sync — `knowledge-orac.ts` reads the JS map
   so its supplement badges colour-match.
7. Keep the wholesale-first price rule and the servings-per-container line on the card.
8. Keep the full `data-search` blob semantics for products AND foods (canon slugs de-hyphenated,
   label nutrients, blend names, `as_labeled`, other ingredients) — "b12", "reishi" and "boron"
   must all still hit.
9. Keep a "best match" ranking that beats raw content matching (AND-over-terms on the TITLE; exact
   title > startsWith > contains; shorter title wins ties; cap 12).
10. Keep the empty states and the no-match line.

**Product detail** — every one of these is on screen today and must remain reachable:
11. Name, delivery-form identity, "Youngevity product", SKU.
12. The derived lede sentence, including the blend-only variant.
13. Essentials-supplied hero (or the "Targeted formula" variant).
14. Wholesale price, retail price, serving size, servings per container, **computed cost/serving**.
15. The §00.A composition-is-not-a-target note, verbatim in substance.
16. Per component (1–3 of them): title, form, serving size, servings, macro chips (105 products).
17. The full nutrient table: name, `unit_detail`, chemical `form`, amount + unit (**strings like
    `"<1"` must survive**), `label_iu`, `%DV` or `†` plus its explanation — which must stop being a
    hover title.
18. Category-coloured left border + link-through on matched rows, including the **B-vitamin number
    bridging** (`Thiamin` → Vitamin B1 …) and the rule that an unmatched row stays neutral.
19. Every blend: name, total or CFU, ingredient count, and the expanded ingredient list with
    form / part / standardization / latin.
20. Other ingredients (212 products).
21. Directions when present (22 products) — do not build a layout that assumes the section exists.
22. The essentials cloud (up to 35 pills) with per-pill navigation.
23. The source foot line.
24. `Add to regimen` — the same `addOrBumpRegimenItem` chokepoint, same dedup/bump, same confirmation.
25. Origin-aware back: from the catalog → the catalog; from ORAC or an essential page → that origin
    (and preferably back to the exact page, not just its tab — see Interaction #12).

**Conditions**
26. All 510 conditions, sorted claim_count desc then A–Z, with the derived head count.
27. Ghost claim-count, category chip (12 categories + unmapped fallback), name, "N claims · M nutrients".
28. The content-aware search blob (claim text + verbatims + symptoms).
29. `conditionSynopsis`, `essentialsInRoles`, `familiarEssentialName` and `tileOf` are consumed by
    `views/entity-page.ts`; a rebuild may re-home them but must not change their semantics —
    deficiency/cause roles and protocol/dose roles are kept separate on purpose (§00.A).

**Cross-cutting**
30. Breadcrumb trail semantics: origin anchor at [0], loop-guard truncation, cap 6.
31. Both themes: cream default AND dark (see Open questions #3 for the trap).
32. Nothing here may introduce a number: every amount is composition or a volatile listing price,
    every "of 90" is derived. No new dose, target, or claim.
33. Reading position must survive open / close / filter. (This is a REQUIREMENT, not a preservation —
    today it does not.)
34. Keyboard/AT activation of every card and row. (Also a requirement, not a preservation.)

---

## Open questions

1. **`renderEssentialSources()` is dead code.** Nothing imports it. Its markup (`.kd-sources`,
   `.kd-source`, `.kd-source--extra`, `.kd-source-more`, `.kd-source-note`,
   `.kd-essential-deep__sub`), roughly 60 lines of CSS, and the `sources-more` click branch in
   `knowledge.ts` are all live-but-unreachable — the essentials page renders "best sources" through
   `entity-page.ts`'s own `.kd-ep-src` rows instead (same `rankedSourcesForEssential` data, different
   markup). **Port or delete?** The dead version carries one feature the live rows lack: an
   expand-to-see-every-ranked-source overflow. `rankedSourcesForEssential` itself is very much alive.
2. **No book browser exists.** Do we want one on mobile? The data supports a rich one immediately
   (7 books with title/edition/year/authors/code/claim_count/status; 2601 claims each carrying a
   `book_id` + page). Dead `.kd-book-row*` CSS implies a design once existed. Owner call.
   `planned_books` is stale (it lists Hell's Kitchen, which is in-housed) — do not ship it as-is.
3. **⚠ Dark-theme trap on the product detail.** `theme.css` re-mixes `--form` for dark ONLY on
   `.kd-product-row[data-form=…]` — the CARD. The DETAIL panel sets `--form` **inline from
   `FORM_COLORS` in JS**, so in dark theme the hero icon, the h1, the card frame and the blend
   markers all use the raw light-theme hexes. The food rust `#b0442e` has no dark remap on either
   surface. Needs a decision and a single source for the dark variants.
4. **No "already in your regimen" state** on a product card or in the detail. The drawer re-renders
   on `regimen:changed` (the in-source comment claims "Products tab … reflect it") but nothing in
   the products render reads regimen state — the re-render is currently wasted work. Should the
   mobile catalog show ownership? `productIdsForNames` already exists to compute it.
5. **510 conditions and 407 catalog cards in one column.** Grouping/indexing is a design decision I
   should not make unilaterally: an alphabet rail, category sections (the 12 condition categories
   and 7 form families are natural), or a search-first screen with no default list. Note the 12
   unmapped conditions, and that `catalogEntries` has no grouping concept at all today.
6. **The 2500-char cap on condition search blobs** silently truncates the biggest conditions'
   searchable claim text. Keep, raise, or move to a prebuilt index?
7. **Blend ingredient text is normalized, not byte-exact label wording** — documented in-source as
   deliberate. Confirm that stays acceptable if the sheet becomes more prominent on mobile.
8. **`serving_size` is free text** ("2 capsules", "1 scoop (12 g)"); the "Per serving" metric prints
   it raw with `white-space:nowrap`. At 375 px the longest values need a different treatment — but
   the string cannot be reformatted without inventing structure the pillar does not have.
9. **`macros` is a passthrough record** — key names are whatever the sealed pillar holds, rendered
   with `_`→space. A mobile chip row must not assume a fixed key set.
10. **`.kd-empty`, `.kd-more`, `.kd-doctrine-card`, `.kd-featured-citation`, `.kd-book-*` are marked
    UNREACHABLE in the CSS itself.** Do not port them — but note `.kd-featured-citation` is still
    referenced by `applyKnowledgeSearch` (hidden during an active query), so the search code carries
    a branch for a block that never renders.
11. **Product ids vs names.** A regimen item carries NO `product_id`; its identity IS `label.name`.
    Any mobile "in your regimen"/"added" affordance must join on the lowercased canonical name
    (`productIdsForNames`), never on an id field that does not exist — tsc cannot catch it, because
    the label is a passthrough object and the bad read typechecks.
12. **What is the mobile equivalent of the scrollbar tint?** The delivery-form colour currently
    reaches four places (icon, title, frame, scrollbar). Two of those (frame, scrollbar) are weak or
    absent on a phone, so the form identity needs a new carrier.
