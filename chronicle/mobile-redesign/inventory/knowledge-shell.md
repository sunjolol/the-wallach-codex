# Knowledge drawer — SHELL, HOME and EXPLORE — feature inventory

Scope: `dashboard/assets/js/src/views/knowledge.ts` (1115 lines, the shell + router + search
engine), `views/knowledge-home.ts` (355), `views/knowledge-explore.ts` (95), the shell/home/explore
rules of `assets/styles/drawer-knowledge.css` (2756) and all of `assets/styles/drawer-shared.css`
(239), plus the mount/keys/event wiring in `assets/js/src/main.ts` and `dashboard/dashboard.html`.
Out of scope here (other inventories): the Absorption/Foods tab, ORAC tab, Conditions tab, Products
tab, the topic page, the entity page. This file records only how the SHELL routes to them.

Counts below are live values read from `dashboard/assets/data/` on 2026-08-22, not literals in code.

---

## Destinations & states

### D0 — CLOSED (the resting state)
`container.innerHTML = ''` and `.kd-open` removed. The mount `#drawer-knowledge-mount` is
`position:absolute; pointer-events:none` with no box until `.kd-open` lands. **There is no DOM at
all while closed** — every re-open is a cold render.

`close()` is a **full state reset**, not a hide: `activeTab='home'`, all five selections null,
`catalogKind='all'`, `trail=[]`, `searchQuery=''`, and `--kd-detail-scroll` removed from `<html>`.
Consequence: **the drawer has no memory across open/close.** Read half of a condition page, press
Esc, press K — you are on Home with nothing selected. (The `searchQuery` half of that reset is a
regression fix guarded by `tools/probes/render_probe_knowledge_filter.js`; without it a re-open
painted "nothing in home matches X" with no box to clear it.)

### D1 — OPEN at a tab (7 routes, 6 doors)
`activeTab: 'home' | 'foods' | 'orac' | 'essentials' | 'conditions' | 'explore' | 'products'`.

The tab strip renders **six** buttons: Home · Absorption · ORAC · Conditions · Explore · Products.
`'essentials'` is a **live route deliberately absent from the strip** (long comment at
knowledge.ts:281-289 forbids "restoring" it). It has exactly three doors:
1. the Home essentials-shelf link `open the full table →`
2. a breadcrumb crumb of type `essential`
3. the `‹ All essentials` back button on an essential's own page (rendered by entity-page.ts)

Note `'foods'` renders under the label **"Absorption"** (`kd_tab_foods`) — the route id and the
visible word disagree; a rebuild that keys off the label will break deep-links.

### D2 — OPEN at a tab, with a DETAIL open
Four detail kinds, each pinned to a specific tab by `openDetail()`:

| kind | forces activeTab to | renders |
|---|---|---|
| `essential` | `essentials` | `renderEssentialPage(key, snapshot)` **above** the tile grid |
| `condition` | `conditions` | `renderConditionPage(slug)` **above** the condition list |
| `product` | `products` | product detail above the catalog |
| `food` | `products` | food sheet above the catalog — **a food has no tab of its own** |

The detail is rendered *in the same scroller, above the index*, not as a new screen. On the
Essentials route with 91 tiles this means an open deep-dive sits on top of a very long list.

### D3 — OPEN with a TOPIC overlay
`selectedTopic` is **not** a detail and **not** a crumb entity. `renderTab()` returns
`renderTopicPage(slug, tab === 'explore')` for the WHOLE body while `activeTab` is left untouched,
so the topic's own back button returns you to the origin tab. `tab === 'explore'` is the only origin
that gets the "All topics" back label; every other origin gets "Go back". Setting a topic always
clears `trail`. Clicking the same `data-kd-topic` again toggles the overlay off.
An unresolvable slug degrades to the origin tab's content (empty string from `renderTopicPage`).

### D4 — SEARCH-ACTIVE (per-tab DOM filter)
Only on `essentials | conditions | explore | products`, and only while `selectedTopic === null`.
Sub-states inside it:
- **filtered** — non-matching `.kd-*-row`/`.sh-tile`/`.kd-explore-chip` get `.kd-hidden`
- **best-match block** — up to 12 title-matching rows MOVED (not cloned) into a `.kd-bestmatch`
  block inserted as the body's first child
- **head collapse** — `.kd-section-head` / `.sh-subhead` / `.kd-explore-group__head` hide when
  everything under them is hidden or hoisted
- **empty** — `.kd-search-empty` line injected: `— nothing in {tab} matches "{query}" —`
- **highlight** — `<mark class="kd-search-hl">` swipes on visible rows + any open deep-view, gated
  to `query.length >= 2`

### D5 — HOME live-suggest dropdown
`.sh-search__results` has three states: closed (empty query, or any click outside `.sh-search`),
open-with-rows (max 10, first row `.active`), open-empty (`No match — try a broader word.`).
Repainted by innerHTML on the PANEL only, never a drawer re-render, so the input keeps focus.

### D6 — scrollbar tint
`render()` publishes `--kd-detail-scroll` on `<html>` (validated `^#[0-9a-f]{3,8}$`) from: the open
condition's body-system colour, or the open food/product's delivery-form colour, or the open
essential's category colour. Unset → app orange. Purely decorative; only reachable because a WebKit
scrollbar pseudo reads root-level custom props only.

### What does NOT exist
- **No URL, no hash, no History API, no deep-link.** All seven routes and every selection live in
  closure variables inside `mount()`. Reload = Home, closed.
- **No scroll restoration anywhere in the drawer.** `views/scroll-keep.ts` exists and is used by
  Coverage and Regimen — the drawer imports it **nowhere**. Every `render()` replaces
  `container.innerHTML`, which destroys `.kd-body` and returns the reader to the top. The team's
  workaround is to avoid re-rendering: search filtering, `sources-more`, `search-clear` and the
  Home live-suggest are all deliberate in-place DOM mutations for exactly this reason. **A mobile
  rebuild with taller scrollers must solve scroll restoration properly, not by avoidance.**
- **No open/close animation.** `.kd-open` only sets `transition: width`, and nothing ever changes
  the width. The module header calls it a "Slide-in-from-left overlay drawer" — it does not slide.
  `.kd-expanded` is named in a drawer-shared.css comment and applied by nothing (phantom class).
- **No `role="dialog"`, no `aria-modal`, no focus trap, no focus return, no `inert` on the
  background.** The panel simply appears over the workspace.

---

## Controls

| control | what it does | where it lives | touch-hostile? |
|---|---|---|---|
| Rail item `❡ Knowledge` | `toggleDrawer('knowledge')`; closes Search first (one overlay at a time) | `.app-rail`, outside the drawer | rail is a 220px desktop sidebar — **gone on mobile** |
| Bare **K** key | same toggle; suppressed while typing, while any modifier is held, and while the arrival veil or profile overlay is up | `main.ts::wireDrawerKeys` | **keyboard-only — no touch equivalent** |
| **Esc** | `closeAllDrawers()` + rail sync | `main.ts::wireDrawerKeys` | **keyboard-only** |
| `.ui-close` × button | `close()` → full state reset | `.kd-knh__end`, header far right | **34×34 CSS px — under the 44px floor**; also top-right = worst thumb zone |
| 6 tab pills `.kd-knh__tab` | set `activeTab`, clear all 5 selections + `trail` + `searchQuery`, re-render | `.kd-knh__tabs`, centred pill group | pill row is nowrap with `white-space:nowrap`; 6 uppercase labels at `.6rem 1.2rem` padding **will not fit 375px** |
| Breadcrumb crumb `[data-kd-crumb=i]` | `goCrumb(i)` — truncate trail to i, restore that entity/tab | top of `.kd-body`, only when trail non-empty | text-only button, no min-height, `--ds-text-mini` — **too small to tap reliably** |
| Per-tab search input `.kd-search-input` | live DOM filter of the active tab, `maxlength=120` | bar under the header, 4 of 7 tabs | no `<label>`, no `aria-label`, placeholder-only |
| `.kd-search-clear` (`×`) | resets the filter in place, refocuses the input; visible only via `.kd-search.has-query` | in the search bar | `padding: 2px 7px` — **~22×20px hit box** |
| `.kd-search-kbd` (`/`) | **DEAD AFFORDANCE.** Renders a `/` key hint; **no `/` handler exists anywhere in the codebase** (grep for `key === '/'` returns nothing). It has never focused the box. | in the search bar | meaningless on touch regardless |
| Home hero input `.kh-search` | live-suggest over 5 entity kinds, `maxlength=120`, `autocomplete=off` | `.sh-hero__search` | fine, but its dropdown is `max-height:44vh` absolutely positioned — will collide with the mobile keyboard |
| Live-suggest row `.sh-res` | navigates via whichever `data-kd-*` attribute it carries | `.sh-search__results` | `padding:.45rem .55rem` → **~30px tall, under 44px** |
| Live-suggest ↑/↓/Enter/Esc | move highlight, open highlighted, dismiss | delegated `keydown` on `.kh-search` | **keyboard-only; the entire arrow-key model has no touch analogue** |
| Click-outside `.sh-search` | closes the suggest dropdown | delegated `click` on the container | works on touch, but there is **no explicit dismiss control** |
| 4 hint chips `.sh-hint` | jump to a curated entity page | under the hero input | `padding:.25rem .6rem`, `font-size:9px` — **~20px tall, far under 44px** |
| Section link `<a data-kd-tab="…">` ×3 | jump to Essentials / Conditions / Explore tab | in each `.ep-seclabel` | **`<a>` with NO `href` — not focusable, not keyboard-operable, no button role.** 10px mono text. |
| Essential tile `.sh-tile` | `openDetail('essential', layout_key)` | Home shelf (18) and Essentials route (91) | grid is `minmax(80px,1fr)`; the tile is ~80×54px — **height under 44px is marginal, but 80px columns on a 375px screen give 4 columns of 2-line-clamped names** |
| Condition row `.sh-condrow` | `openDetail('condition', slug)` | Home shelf (8) | `minmax(230px,1fr)`; ~38px tall — **under 44px** |
| Explore chip `.kd-explore-chip` | sets `selectedTopic` → topic overlay | Home preview (14) + Explore tab (141) | `padding:4px 11px` → **~26px tall, under 44px**; 141 of them in a wrap-cloud |
| Products/foods/all filter `[data-kd-catfilter]` | sets `catalogKind`, full re-render | Products tab (routed by the shell) | out of this inventory's scope; listed because the shell owns the handler |
| `[data-kd-action="sources-more"]` | expands overflow BEST SOURCES rows by class toggle, **no re-render**; relabels itself `Show N more source(s) in the vault` / `Show fewer sources` | inside an essential deep-dive | shell-owned handler; label strings are **inline in knowledge.ts, not in view-copy.json** |
| `[data-kd-action="essential-close" / "condition-close" / "food-close" / "product-close" / "topic-close"]` | close the detail; food/product versions are **origin-aware** — if `trail[0]` is a tab other than `products`, they `goCrumb(0)` back to the origin tab instead | inside each detail page | shell-owned |
| `[data-kd-action="explore-home"]` | hard jump to the Explore index, clearing every selection (unlike the origin-aware back) | topic page kicker | shell-owned |
| `[data-kd-action="add-regimen"]` | adds the shown product (`data-add-product`, via `addOrBumpRegimenItem`) or food (`data-add-food`, via `addCatalogFood`) to the regimen, fires `wallach:navigate → regimen`, then after a **240ms `setTimeout`** finds the matching `.rr-row[data-rr-name]` and flashes it | product/food detail | **cross-surface side effect with a hard-coded 240ms race**; a slower mobile mount silently loses the flash |
| ORAC field hover/click/scrub | delegated `mouseover`/`mouseout`/`click`/`input` handlers the SHELL owns for the ORAC tab | container-level | **`mouseover`/`mouseout` do not exist on touch** — flagged again below |

Every click is one delegated `click` listener on the mount, dispatched by `closest()` over these
attributes, in this order: `.sh-search` outside-check → `oracFieldClick` → `[data-kd-tab]` →
`[data-kd-crumb]` → `[data-kd-essential]` → `[data-kd-condition]` → `[data-kd-topic]` →
`[data-kd-product]` → `[data-kd-food]` → `[data-kd-catfilter]` → `[data-kd-action]`.
**That attribute contract is the drawer's real API** and every sub-view emits into it. A rebuild
that renames these attributes must rename them in ten view files at once.

---

## Data points rendered

### Shell chrome
| datum | source | format | why it matters |
|---|---|---|---|
| `❡` mark glyph | literal in `renderShell` | accent-coloured char | the drawer's identity mark; **not an emoji, a pilcrow-family typographic mark** |
| `KNOWLEDGE` wordmark | `ui('kd_mark')` | uppercase mono | |
| 6 tab labels | `ui('kd_tab_*')` | uppercase display font | Home · Absorption · ORAC · Conditions · Explore · Products |
| active tab | `activeTab === t.id` → `.active` | pill fill + accent ink | |
| breadcrumb labels | `crumbLabel()` — resolved from **state**, never scraped from the clicked DOM | uppercase mini | `getEssentialByLayoutKey().common_name` / `getCondition().display_name` / `foodName()` / `vaultEntry().name`; falls back to the raw slug |
| crumb separator | literal `›` (`›`) | `aria-hidden` | |
| search placeholder | `SEARCH ${activeTab.toUpperCase()}…` | **built by uppercasing the ROUTE ID** | the Foods route would read "SEARCH FOODS…" while its tab says "Absorption" — it never shows because Foods has no search bar, but the coupling is live |
| `Best match` label | `ui('kd_best_match')` | uppercase mono, accent | |
| no-match line | inline template `— nothing in ${tab} matches "${query}" —` | lowercase, centred | **inline prose, not in view-copy.json**; also prints the route id, not the label |

### Home tab
| datum | source field | format/unit | why it matters |
|---|---|---|---|
| headline | `ui('kh_hero_headline')` | display 2xl | |
| sub-line `{claims}` | `listBooks().reduce(sum of b.claim_count)` → **2601** | `toLocaleString('en-US')`, pinned locale for deterministic offline render | the corpus size claim on the front door |
| sub-line `{books}` | `listBooks().length` → **7** | integer | §00.A: the 7 registered books |
| sub-line `{conditions}` | `listConditions().length` → **510** | grouped integer | this is the **corpus** condition count; the Conditions shelf link uses `listConditionPages().length` — also 510 today, but a different accessor |
| `{br}` token | replaced with `<br>` **after** escaping | line break | a deliberate escape-then-inject seam |
| hero placeholder | `ui('kh_hero_placeholder')` | — | curly quotes around three example terms |
| 4 hint chips | hard-coded `HINTS` array: calcium, arthritis, vitamin-d, depression | entity display names | curated, not formula; a chip whose slug does not resolve renders **nothing** (silent) |
| essentials shelf: top 18 | `listEssentialPages()` sorted by `distinct_claim_count` desc, `.slice(0,18)` | — | today: Calcium 201, Selenium 163, Zinc 161, Magnesium 145, Omega-3 124, Vitamin E 117, Vitamin C 114, Chromium 112, Vitamin A 100, Copper 99, B6 76, B12 75, Vanadium 69, Sodium 55, Iron 52, Potassium 48, Iodine 45, Folate 42 |
| tile glyph | `essentialGlyph(layout_key)`, falling back to `name.slice(0,2)` | 1.15rem display | chemical symbol / vitamin letter / `ω3`-style omega glyph |
| tile name | `EssentialSummary.name` | 2-line `-webkit-line-clamp` | **already clamped with an ellipsis at 950px** |
| tile claim count | `distinct_claim_count` + `plural(n,'claim')` | `"201 claims"` mono 10px | |
| tile category edge | `data-cat` → `--cat` → 3px left stripe | mineral `#2f9dba` · vitamin `--fam-vita` `#ff7e3c` · amino `#5aa82c` · fatty `#8a52d6` | **NOTE: the mineral family colour here is TEAL `#2f9dba`, not the blue the project's colour-coding rule names.** The Essentials-route scroll tint uses `#2b6fb0` for the same category. Two blues for one family already exist. |
| colour legend | `LEGEND_CATS` × `ui('kh_legend_*')` | 3×14px swatch + 9px mono label | Minerals · Vitamins · Amino acids · Fatty acids |
| conditions shelf: top 8 | `listConditionPages()` sorted by `claim_count` desc `.slice(0,8)` | — | |
| condition row meta | `"{claim_count} claims · {nutrient_count} nutrients"` | mono 0.625rem | `nutrient_count` = length of the condition's directed `restore` list |
| conditions link | `ui('kh_conditions_link')` with `{n}` = `listConditionPages().length` (**510**) | `browse all 510 →` | |
| explore preview | `homeExploreTopics()` — 14 hand-picked slugs in `home-curation.json`, resolved against the entity index, sorted A-Z | chips | amino_acids, aromatherapy, ayurveda, chiropractic, colloidal_minerals, color_therapy, essential_nutrients, homeopathy, hydrotherapy, light_therapy, macronutrients, negative_ion_therapy, vaccines, vitamins |
| shelf labels/hints | `ui('kh_essentials_*')`, `kh_conditions_*`, `kh_explore_*` | uppercase label + lowercase mono hint + link | |

### Home live-suggest rows
| datum | source | format |
|---|---|---|
| kind dot colour | driven purely by which `data-kd-*` attribute the button carries | essential=`--fam-science` · condition=`--ds-accent` · topic=`--fam-story` · product=`--ds-ink-soft` · food=`#b0442e` (a **raw hex** matching the food card's rust) |
| row name | entity display name | 600-weight display |
| row meta — essential/condition/topic | `"{claimCount} claim(s)"` | mono 9px |
| row meta — product | `ui('kh_meta_supplied')` = `"{n} of {of} essentials"` where `of = essentialCount()` (**90**), or `ui('kh_meta_targeted')` = `"targeted formula"` when n = 0 | **deliberate: a product prints supply, never a claim count of 0 — printing 0 would read as "nothing has been written about this"** |
| row meta — food | `"{portion_label} · {category}"` | e.g. `1 cup, cubes · Vegetables` |
| group headers | `ui('kh_group_essentials'|'_conditions'|'_topics'|'_products'|'_foods')` | Essentials · Conditions · Explore · Products · Foods |
| empty | `ui('kh_search_empty')` | `No match — try a broader word.` |

Live-suggest search domains and their match rules — **each is different, and the differences are
load-bearing**:
- essentials (91) — name, `scientific_name`, or de-slugged slug
- conditions (510) — name or de-slugged slug
- products (215) — **name only**, never ingredients (the Products tab already searches composition;
  repeating it here would flood a 10-row panel)
- foods (192) — name **or category** ("legume", "shellfish" answer with their members)
- explore topics — display name, de-slugged slug, or any **synonym**; excludes anything already
  surfaced as an essential/condition (`taken` set), excludes `nutrient`/`condition` types, and
  **excludes charged entities** via `isChargedEntity()` (homosexuality/intersex stay browsable on
  the Explore tab but are never volunteered by autocomplete — the never-ambush rule)

Panel packing is `pickShown()`, not a flat `slice(0,10)`: every matching group keeps at least
`GROUP_FLOOR = 2` rows and the slack flows to earlier groups, so a query like "vitamin" cannot let
essentials starve products and foods off the panel. `SHOWN_MAX = 10`.

### Explore tab
| datum | source | format |
|---|---|---|
| 5 type groups | `EXPLORE_TYPES` in fixed display order | `kt_type_topic` "Therapies & ideas" · `kt_type_concept` "Big concepts" · `kt_type_element` "Elements" · `kt_type_substance` "Substances" · `kt_type_person` "People" |
| per-group count | `inType.length` | mono 9px beside the head |
| chips | `exploreEntities()` = `entityList()` minus `nutrient` and `condition` types, A-Z within group | today **142 entities returned, 141 rendered**: topic 38, concept 52, element 10, substance 39, person 2 — plus **1 `event` entity that is counted but never drawn** because `event` is not in `EXPLORE_TYPES` |
| chip hidden keyword blob | `data-search` = the entity's synonyms + its claims' topic tags + its claims' **question text**, deduped; answer/verbatim bodies **deliberately excluded** (they would make every chip match on one incidental word) | invisible, feeds the tab's search filter |
| empty group | renders nothing | graceful |

### Essentials route (no menu button)
| datum | source | format |
|---|---|---|
| 6 subsections | `coverage-layout-data.json`, flattened by `buildSubsections()` | FOUNDATIONAL 5 · INDIVIDUALLY DOSED 21 · PLANT DERIVED 34 · VITAMINS 16 · AMINO ACIDS 12 · FATTY ACIDS 3 = **91 tiles** (90 essentials + Omega-9, which carries `essential:false`) |
| subhead wording | `SEC_LABEL_KEY` → `ui('kd_esssec_*')` | "Structural elements" · "Minerals with a stated dose" · "Plant derived minerals" · "Vitamins" · "Amino acids" · "Essential fatty acids" — friendly wording over the layout's own SHOUTED labels |
| grid width | minerals use `.sh-grid` (80px cols); vitamins/aminos/fats use `.sh-grid--wide` (120px cols) | |
| tile name | `ESS_META` (friendly `common_name` from the entity pages) preferred over the layout's uppercase `name` | |
| tile claim count | `EssentialSummary.distinct_claim_count`, **0 when the layout key has no entity page** | |
| selected tile | `.is-selected` accent ring | |

**Surprise:** `renderEssentialsTab` takes the `CoverageSnapshot` but uses it **only** for the
deep-dive. The tiles show **no coverage state at all.** The `EssentialTile` interface doc says
"symbol + name + claim count + coverage dot"; the CSS carries `.sh-tile > .kd-cov-dot` and a whole
"Tile coverage states" block (`.kd-essential-tile--covered/--partial`) — **none of it is rendered by
any TypeScript.** Three sources agree on a feature that does not ship. Do not "restore" it in a
rebuild without asking; per the project's own doctrine, Coverage is where gap state lives.

---

## Copy

Every visible string in the shell/home/explore comes from `dashboard/assets/data/view-copy.json`
via `ui(id)`, except the inline strings noted below. `ui()` returns `''` for a missing id — a typo'd
key renders an **empty label, silently**, never `undefined`.

**Shell**
- `kd_mark` — `KNOWLEDGE`
- `kd_tab_home` — `Home`
- `kd_tab_foods` — `Absorption`
- `kd_tab_orac` — `ORAC`
- `kd_tab_conditions` — `Conditions`
- `kd_tab_explore` — `Explore`
- `kd_tab_products` — `Products`
- `kd_tab_essentials` — `Essentials` (never on a button; used only as a breadcrumb anchor label)
- `kd_best_match` — `Best match`
- `❡` (mark glyph), `›` (crumb separator), `⌕` (search icon), `×` (search clear), `/` (dead kbd hint)
- close button: `title="Close (Esc)"`, `aria-label="Close"`
- breadcrumb nav: `aria-label="Breadcrumb"`
- search clear: `aria-label="Clear search"`, `title="Clear search"`
- **INLINE (not in the copy store):** `SEARCH {TAB}…` placeholder · `— nothing in {tab} matches
  "{query}" —` · `Show fewer sources` · `Show {n} more source{s} in the vault` ·
  `[views/knowledge] action stub:` (console warning for an unrouted `data-kd-action`)

**Home**
- `kh_hero_headline` — `Everything Wallach taught, in one place.`
- `kh_hero_sub` — `Search {claims} sourced claims from {books} of Dr. Joel Wallach's books — or{br}browse the essentials, {conditions} conditions, and the topics in between.`
- `kh_hero_placeholder` — `Try "selenium", "osteoporosis", or "colloidal minerals"…` (curly quotes in the data)
- `kh_essentials_label` — `The essentials` · `kh_essentials_hint` — `the body's required inputs` · `kh_essentials_link` — `open the full table →`
- `kh_conditions_label` — `Common conditions` · `kh_conditions_hint` — `what Wallach wrote most about` · `kh_conditions_link` — `browse all {n} →`
- `kh_explore_label` — `Explore` · `kh_explore_hint` — `the rabbit holes — therapies, elements, big questions` · `kh_explore_link` — `see all topics →`
- `kh_legend_label` — `colour key` · `kh_legend_mineral` — `Minerals` · `kh_legend_vitamin` — `Vitamins` · `kh_legend_amino_acid` — `Amino acids` · `kh_legend_fatty_acid` — `Fatty acids`
- `kh_group_essentials` `Essentials` · `kh_group_conditions` `Conditions` · `kh_group_topics` `Explore` · `kh_group_products` `Products` · `kh_group_foods` `Foods`
- `kh_meta_supplied` — `{n} of {of} essentials` · `kh_meta_targeted` — `targeted formula`
- `kh_search_empty` — `No match — try a broader word.`

**Explore**
- `kt_type_topic` — `Therapies & ideas`
- `kt_type_concept` — `Big concepts`
- `kt_type_element` — `Elements`
- `kt_type_substance` — `Substances`
- `kt_type_person` — `People`

**Essentials route subheads**
- `kd_esssec_foundational` — `Structural elements`
- `kd_esssec_dosed` — `Minerals with a stated dose`
- `kd_esssec_plantderived` — `Plant derived minerals`
- `kd_esssec_vitamins` — `Vitamins`
- `kd_esssec_amino` — `Amino acids`
- `kd_esssec_fatty` — `Essential fatty acids`

No emoji anywhere; every icon is either an inline SVG (the close X, the hero magnifier) or a
typographic mark (`❡ › ⌕ × /`).

---

## Interaction dependencies that CANNOT survive on touch

1. **`mouseover` / `mouseout` on the container.** The shell registers both, delegated, purely for
   the ORAC field dots (`oracFieldHover` / `oracFieldOut`). **Touch fires neither.** The ORAC field
   is described as progressive enhancement over a static-correct render, but any information that
   only appears on hover is invisible on a phone. FLAG.
2. **Arrow-key navigation of the live-suggest panel.** `ArrowDown`/`ArrowUp` move `.active`,
   `Enter` clicks it, `Escape` dismisses and blurs. **No touch equivalent exists.** The first row is
   pre-marked `.active` on render, so on touch the highlight is decoration that never moves. FLAG.
3. **Bare-key shortcuts K / S / 1 / 2 / 3 and Esc.** The ONLY ways to close the drawer other than
   the 34px × button. Esc in particular is the documented dismiss (`title="Close (Esc)"`). On touch
   there is **no back gesture, no swipe-to-dismiss, no scrim tap** — the mount has no scrim at all.
   FLAG LOUDLY: a mobile rebuild must add a dismissal gesture or the drawer is a trap.
4. **`/` keyboard hint that was never wired.** Cosmetic on desktop, pure noise on mobile. Delete it
   or wire it; do not port it.
5. **Hover-only affordance styling.** `.sh-tile:hover` (lift + coloured border), `.sh-condrow:hover`
   (name turns accent), `.kd-explore-chip:hover` (fills solid — **the only state that makes a chip
   read as pressable**), `.sh-res:hover`, `.sh-hint:hover`, `.kd-crumb:hover`, `.ep-seclabel a:hover`
   (underline), `.kd-search-clear:hover`, `.ui-close:hover`, `.kd-knh__tab:hover`. On touch every one
   of these collapses to nothing, or worse, sticks after a tap. FLAG.
6. **`cursor: help` + hover tooltip** on `.kd-ep-why` ("why this number?") inside the essential
   deep-dive — a `display:none → block` on `:hover` with **no click, no focus, no touch path**. The
   number's provenance is a §00.A-critical datum and it is **hover-gated today**. FLAG LOUDLY.
7. **`title=""` attributes as the only long-name affordance.** `.sh-tile` carries
   `title="{full name}"` because `.sh-tile__nm` is clamped to 2 lines. Native tooltips do not exist
   on touch, so **on mobile the truncation is permanent and lossy.** FLAG.
8. **Precise pointer for a 141-chip wrap cloud** and a 91-tile 80px grid. Not impossible on touch,
   but at current sizes it is a mis-tap generator.
9. **Click-outside-to-dismiss** for the live-suggest dropdown. Works on touch, but on a phone the
   "outside" is largely covered by the software keyboard.

---

## Desktop-only assumptions

1. **The 950px fixed panel.** `#drawer-knowledge-mount.kd-open { width: 950px }`, positioned
   `top:0; bottom:0; left:220px` — it starts exactly at the right edge of the 220px rail and covers
   the topbar. Everything about the layout (the centred 6-pill tab group, the 3-column header, the
   `minmax(230px,1fr)` condition grid, the `max-width:60ch` hero paragraph, the `max-width:560px`
   hero search) is sized against that number.
2. **The rail exists.** The only pointer door into the drawer is a rail button that mobile will not
   have. Same for the bare-K shortcut.
3. **One overlay at a time, enforced globally.** `toggleDrawer` closes Search before opening
   Knowledge; `navigateTo` closes every drawer. The mental model is "an overlay panel beside a
   persistent workspace", which does not exist on a phone.
4. **The drawer never covers the whole screen**, so there is always visible app behind it — which
   is why nobody needed a scrim, a focus trap, or `aria-modal`.
5. **A detail renders above its index in the same scroller.** With a 91-tile grid or a 510-row
   condition list below it, this only works because the desktop viewport is tall enough to see both
   the detail and where you came from. On a phone this is a screen inside a screen with no
   affordance telling you which you are looking at.
6. **The best-match hoist assumes a visible list.** `applyBestMatch` moves rows to the body's top
   and additionally re-parents an open `.kd-essential-deep` to sit under its matching row — a
   compensation for the fact that on desktop the panel would otherwise appear below the whole list.
   The mechanism is subtle and stateful (`kdHoisted` restores in reverse order on the next
   keystroke) and it will need re-derivation, not porting.
7. **The header is a 3-column flex row** (`mark | centred pills | close`) that assumes there is
   horizontal room for a wordmark AND six pills AND a button.
8. **The tab strip is the only navigation.** No back gesture, no history, no nested nav — every
   route change is a full repaint from the top of a single scroller.
9. **`44vh` live-suggest dropdown** positioned absolutely under a hero input that sits mid-screen.
10. **The scrollbar is a design surface.** `--kd-detail-scroll` tints the `.kd-body` scrollbar to the
    open detail's category colour. Mobile scrollbars are overlay hairlines — **this feature simply
    does not exist on a phone.** It is decorative; it carries no information not shown elsewhere.

---

## Feature-preservation contract

A rebuilt mobile Knowledge surface must satisfy all of these. Numbered so a later audit can cite them.

**Routing & shell**
1. All **seven** destinations remain reachable: home, foods/Absorption, orac, conditions, explore,
   products, and **essentials** (the unlisted route). Essentials must keep at least the three doors
   it has today (Home shelf link, breadcrumb, `‹ All essentials` back button) or an explicit
   replacement — its absence from the primary nav is a deliberate decision, not an oversight.
2. Four detail kinds open and close: essential, condition, product, **food** (food has no tab of
   its own and must keep landing in the Products surface).
3. The **topic overlay** stays origin-aware: it renders over whatever surface opened it, and its
   back returns there — with the "All topics" label only when the origin was Explore.
4. `openEntity(kind, slug)` keeps working for all four kinds from **outside** the drawer
   (Ask-Wallach "Learn More" via `knowledge:open-entity`, a Coverage card via `coverage.ts:925`).
   The essential branch must keep resolving **slug → `layout_key`** before opening; skipping that
   resolution produced an empty page titled with the raw slug, and no probe caught it.
5. `openTab(tab)` keeps working from outside (`knowledge:open-tab`; the Regimen console's
   all-covered state sends the user to Products). A tab jump must clear **every** selection.
6. The delegated attribute contract stays intact or is migrated in one atomic patch across all ten
   view files: `data-kd-tab`, `data-kd-crumb`, `data-kd-essential`, `data-kd-condition`,
   `data-kd-topic`, `data-kd-product`, `data-kd-food`, `data-kd-catfilter`, `data-kd-action`
   (`close`, `essential-close`, `condition-close`, `food-close`, `product-close`, `topic-close`,
   `explore-home`, `sources-more`, `search-clear`, `add-regimen` with `data-add-product` /
   `data-add-food`).
7. Dismissal must be reachable **by touch** — today it is a 34px × plus two keyboard paths. Add a
   gesture and/or a thumb-reachable control; keep Esc for the web build's keyboard users.
8. Closing still fully resets state (tab, all selections, catalogKind, trail, query, scroll tint),
   or the rebuild explicitly decides to preserve state and says so — this is a real product
   decision, not an implementation detail. `render_probe_knowledge_filter.js` guards the current
   answer.

**Breadcrumb**
9. The trail keeps its three properties: `trail[0]` is always an **origin-tab anchor** (an
   unbreakable exit), re-visiting an entity already in the trail **truncates back to it** rather
   than appending (this is what killed the infinite Calcium ↔ Osteoporosis loop), and the trail is
   capped at `CRUMB_MAX = 6` with the anchor always kept.
10. Crumb labels are resolved from state, never scraped from the DOM the user clicked.
11. Origin-aware back for food and product: opened from a non-Products tab, they return to that tab.

**Per-tab search**
12. A live filter over the four tabs that have one today (essentials, conditions, explore,
    products), matching **visible text OR the row's hidden `data-search` blob** — content queries
    like "smell" → Anosmia must keep working.
13. The **Best match** block: title-only, AND-over-terms, rank 0 = exact / 1 = prefix / 2 =
    contains, ties broken by shorter title, capped at 12. "cancer" pins Cancer + subtypes; "breast
    cancer" pins only Breast Cancer. Rows are **moved, not cloned**, so nothing renders twice and
    delegated handlers survive.
14. Section heads collapse when everything under them is gone.
15. The `— nothing in {tab} matches "{query}" —` affordance.
16. Live `<mark>` highlight on visible rows and any open deep-view, gated at ≥2 characters.
17. Clearing the query restores every hoisted row to **exactly** its original position (reverse
    order restore), including a re-parented open deep-dive.
18. The filter must survive a repaint: today `render()` re-applies `searchQuery` after every
    innerHTML swap.
19. The search box appears only where it has meaning, and never over a topic overlay.

**Home**
20. Hero headline + the three live counts (2601 claims / 7 books / 510 conditions), all derived,
    never literals, en-US grouped, deterministic offline.
21. Live-suggest over **five** kinds with their five distinct match rules (see the table above),
    including foods matching on **category**.
22. `pickShown` fairness: every matching kind keeps ≥2 rows out of 10.
23. Per-kind meta strings — and specifically: **a product/food must never print "0 claims"**.
24. **Charged entities are never volunteered by autocomplete.** Non-negotiable.
25. Keyboard control of the panel must be replaced by an equivalent touch model (tap a row; a way
    to dismiss the panel without fighting the software keyboard).
26. The four curated hint chips, and their silent-skip behaviour for an unresolvable slug.
27. Essentials shelf: top 18 by `distinct_claim_count`, with glyph, name, `N claims`, and the
    category colour edge; plus the four-item colour legend.
28. Conditions shelf: top 8 by `claim_count`, each with `N claims · M nutrients`.
29. Explore preview: the 14 curated slugs from `home-curation.json`, resolved and sorted A-Z,
    silently skipping a slug that no longer resolves; renders nothing if curation is empty.
30. All three "see everything" links (`open the full table →`, `browse all 510 →`,
    `see all topics →`) — **as real, focusable, 44px controls, not bare `<a>` without `href`.**

**Explore**
31. All five type groups in fixed order with their labels and per-group counts.
32. Every non-essential, non-condition entity is reachable — 142 today. **Decide the `event`
    entity's fate explicitly**: it is inside `exploreEntities()` but outside `EXPLORE_TYPES`, so it
    is counted and never drawn. Either add the type or filter it out; do not inherit the disagreement.
33. Each chip keeps its `data-search` blob (synonyms + claim topics + claim questions, and
    deliberately NOT answer/verbatim bodies).
34. Chips open the topic overlay, and tapping the same chip closes it.

**Essentials route**
35. All 91 tiles in the 6 subsections, in layout order, with the friendly `kd_esssec_*` subheads.
36. Friendly `common_name` preferred over the layout's uppercase name; `essentialGlyph` for the symbol.
37. Names must be **fully legible** — the current 2-line clamp plus `title=` fallback is a desktop
    compromise that becomes data loss on touch.
38. The deep-dive remains the **same shared entity page** a Coverage card and an Ask-Wallach "Learn
    More" open. One essential page, not two.

**Cross-surface**
39. `add-regimen` still adds a product or food to the regimen through the §31 chokepoint, navigates
    to Regimen, and confirms the add visually — **without a hard-coded 240ms race**.
40. `sources-more` expands in place without losing scroll position or the open detail.
41. Both themes. The drawer's dark layer is substantial and specific: `.kd-home`, `.kd-explore` and
    `.kd-foods` each re-declare the `--fam-*` family palette, and dark mode remaps them to
    `color-mix(…, var(--ds-ink))` tints, re-pins the white-text pill fills to their saturated hues,
    routes bare accent foregrounds to `--ds-accent-deep`, and drops `.sh-tile::before` stripes to 50%
    alpha. Any new component needs its own dark pass — the tokens do not do it for free.

**Accessibility floor (currently unmet, must be met)**
42. Every icon-only control gets a real accessible name (the × has one; the tabs, crumbs and search
    input do not).
43. The tab strip gets real tab semantics or real link semantics — today they are plain buttons with
    no `aria-selected`, no `role`, no `type="button"`.
44. Real focus-visible states on tiles, chips, rows and crumbs (only `.ui-close` has one today).
45. `prefers-reduced-motion` honoured for whatever entrance the rebuilt surface gains (there is no
    entrance animation today, so this is new surface area).
46. Landmarks: the shell renders `<header>` and two `<nav>`s today; keep or improve, and add the
    dialog semantics the panel currently lacks.

---

## Open questions

1. **Is Essentials-in-the-drawer still wanted on mobile?** It was pulled from the tab strip because
   it duplicated the Coverage workspace. On mobile, Coverage's periodic table is itself being
   redesigned — if that redesign becomes the browse surface, the drawer's 91-tile route may be pure
   duplication. Needs an owner decision; do not delete unilaterally (the code comment forbids it).
2. **Should the drawer keep state across dismiss?** Today it is a hard reset. On a phone, where
   dismissal is one thumb-flick away, losing your place on a 510-row list is much more expensive
   than it is on desktop.
3. **Two blues for "mineral".** Home/Essentials tiles use `--fam-science` `#2f9dba` (teal); the
   Essentials scroll tint uses `#2b6fb0` (blue). The project's colour rule says minerals = blue.
   Which one is canonical? A rebuild should not silently pick.
4. **The `event` entity** (1 today) — surface it, or filter it out of `exploreEntities()`?
5. **Should the `foods` route id be renamed to `absorption`** to match its label? The id/label split
   already leaks into the search placeholder and the empty-state line. A rebuild is the cheap moment.
6. **Where does the "why this number?" provenance go on touch?** It is hover-only today, and it is
   the §00.A provenance for a dose. It cannot stay hover-gated. Tap-to-open sheet? Always-visible
   line? Owner call.
7. **Does mobile keep the drawer metaphor at all,** or does Knowledge become a first-class
   destination in a bottom bar? The whole "overlay beside a workspace, one at a time" model exists
   because of the desktop rail. The answer changes items 1, 2, 7 and 43.
8. **What replaces the 141-chip Explore cloud?** A wrap-cloud of 26px chips is the single most
   touch-hostile surface in this inventory. Search-first? Grouped accordions? Type-filter pills?
9. **Are the shelf cut-offs (top 18 / top 8 / 14 curated) right for a phone?** They were chosen for
   a 950px canvas. Fewer items but a stronger "see all" may serve a small screen better — but the
   counts are formula-derived and must stay derived, never re-typed.
10. **Could not determine:** whether the "UNREACHABLE" CSS blocks the file itself flags
    (`.kd-featured-citation`, `.kd-book-row`, `.kd-essential-tile*`, `.kd-more`, `.kd-doctrine-card`,
    `.kd-head`/`.kd-tabs`/`.kd-tab`/`.kd-eyebrow`/`.kd-title`/`.kd-sub`/`.kd-close`, `.kd-cov-dot`
    on `.sh-tile`) are deliberately parked for a planned feature or simply dead. I verified they are
    rendered by **no TypeScript in `views/`**; `applyKnowledgeSearch` still queries
    `.kd-featured-citation` defensively. That is roughly 200 lines of CSS the rebuild should not
    port blindly — but the call is the owner's, per the "parked threads need no reminders" rule.
