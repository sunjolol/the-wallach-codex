# Ask Wallach (Search drawer) — feature inventory

**Scope.** `dashboard/assets/js/src/views/search.ts` (736 lines), `views/search-highlight.ts` (81),
`dashboard/assets/styles/drawer-search.css` (344), plus the retrieval layer it is a pure view over:
`state/search.ts` (888), `core/schemas/search.ts` (183), `state/copy.ts`, `views/glossify.ts`,
`views/gloss-tooltip.ts`, and the wiring in `main.ts`. Dark-theme overrides live in `theme.css`
(≈20 rules under `:root[data-theme="dark"] #drawer-search-mount`).

**Everything below that is a number was MEASURED**, not estimated — headless Chrome at
375×812 (dSF 2, isMobile, hasTouch), cream theme, file:// build, driving the real app.
Index totals measured off `dashboard/assets/data/search/search-index.json`:
**7 books · 547 entities · 2,579 claims.**

> **The one-line headline.** The panel's head is a **fixed 161 px** that never scrolls. At
> 375×812 the results scroller (`.scr-body`) is **521 px**. With the on-screen keyboard up
> (measured at a 366 px viewport) it is **75 px** — and the surface **auto-focuses the input
> on open**, so the keyboard is up *before the user has seen anything*. 75 px is **2.0 %** of a
> typical topic page (3,797 px) and **10 %** of a single best-answer card (733 px).

---

## Destinations & states

`views/search.ts::mount` renders ONE shell (`renderShell`) plus a body that has **six** render
outcomes, selected by `renderBody()` + a browse short-circuit in `paintBody()`.

| # | State | Entered by | What renders | Measured scroll height @375 |
|---|---|---|---|---|
| 1 | **OPENING** (`landing`, empty query) | drawer opens; `Ask Wallach` title tap; browse "Go Back"; back-stack exhausted | `scr-label` "Browse by kind of answer" + `.kstack` of **5** `.kcard` family cards (name, sub-label, count) | **457 px** (the only state that fits a phone) |
| 2 | **ASK** (`mode:'ask'`) | a plain-language query whose best hit is primarily about the mentioned entity, or that mentions no entity | `Best answer` label → one `.ans` card → `More answers` label → `.scr-more` with `MORE_CAP=4` visible `.arow` + the rest `.arow--hidden` + a `See N more` button → `Keep exploring` label → one `.tcard` | 1,427 / 1,718 / **2,725** px (selenium-dose / fried-eggs / fluoride) |
| 3 | **TOPIC** (`mode:'entity'`) | an exact slug/display-name/synonym hit (`entityHit`), an exact condition/essential page hit (`wideEntityHit`), a mentioned entity whose best claim is *not* primarily about it, or any `data-sr-entity` tap | `.ehero` (glyph + name + `type · N answers` + `Learn More →`) → **5** `.fgroup` sections, each `FAM_CAP=3` visible rows + hidden rows + `See N more <family>` → `Keep exploring` + `.exrow` of related pills | 2,817 (zinc) / **2,899** (cancer) px |
| 3b | **TOPIC, fully revealed** | tapping all five `See N more` | same, all rows shown | **16,027 px** (cancer, 104 rows) = 30.8 screens |
| 3c | **TOPIC, all rows open** | opening every `<details>` | same | **102,845 px** = **197 screens** |
| 4 | **BROWSE** (a UI state, not a query result) | tapping a `.kcard`, or a `.brow-lens__b` pill | `.brow-lens` (5 lens pills) + `.brow-head` (kicker/title/`N topics · N answers`/`‹ Go Back`) + `.brow-grid` — a **2-column** grid of `.brow-card` | Science **16,965** (281 cards) · What To Do **24,021** (399) · Wallach's Take 8,254 (135) · Cautions 7,285 (121) · The Story 8,063 (135) |
| 5 | **EMPTY / no match** | a non-empty query that scores 0 against all 2,579 claims | `.empty` — headline, echoed query, 5 `.echip` suggestion chips (the 5 highest-`claim_count` non-charged entities) | 339 px |
| 6a | **Dead-end: unresolvable topic** | `heroFor()` returns null | `.aw-empty-line` — `— nothing to show for this topic yet —` | — |
| 6b | **Dead-end: resolved but claimless** | `entityFamilies()` empty | `.aw-empty-line` — `— no sealed claims on this yet —` | — |

**Sub-states that are not screens but change what you see**

- **Row expanded** — any `.arow` `<details>` open. One open row measured **1,048 px** (selenium).
- **Reveal fired** — `See N more` un-hides `.arow--hidden` siblings *and removes itself permanently*; there is no re-collapse.
- **Flash** — `.sr-claim--flash` (1.4 s green wash) after a `see_also` jump.
- **Back-arrow present/absent** — `.scr-nav--back` is `hidden` only on the pristine opening screen.
- **Scrim freeze** — while open, `body:has(#drawer-search-mount.sr-open)` pauses every ambient animation in `.app-topbar`, `.app-workspace`, `#drawer-knowledge-mount` (measured in-repo at −72 % compositor work; the backdrop-blur is only affordable *because* of this).

---

## Controls

Touch-hostile = measured < 44 px on the short axis at 375×812, or hover/precision-dependent.

| Control | What it does | Where it lives | Touch-hostile? |
|---|---|---|---|
| `.topbar__ask` "Ask Wallach ⟨S⟩" | opens the drawer (`toggleDrawer('search')`) | topbar, far right | **YES — measured 183×35** |
| rail chip `[data-rail-nav="search"]` | same toggle | left rail | measured 35×42 — **YES** (and the rail is desktop-only furniture) |
| bare **S** key | toggles the drawer | global | keyboard-only; guarded off while typing in an input |
| **Esc** | `closeAllDrawers()` | global | keyboard-only — **no touch equivalent except the X or the scrim** |
| `.aw-search__input` | live query; re-resolves + repaints on **every keystroke**, no debounce, no submit | panel head | **YES — measured 185×24.** Also: `type=text`, `maxlength=120`, **no** `inputmode`, **no** `enterkeyhint`, **no** label / `aria-label` |
| `.aw-search__btn` (magnifier) | **NOTHING.** It is a `<span>` with `cursor:pointer` and a hover lift, and no handler anywhere. Measured: clicking it leaves `.scr-body` byte-identical. | inside the search well | **DEAD CONTROL** that reads as the submit button (42×42, the only chrome that passes the touch floor) |
| **Enter / the keyboard's Go key** | **NOTHING.** No form, no `keydown` on the input. Measured: body identical, drawer stays open, keyboard stays up. | — | **MISSING** |
| `.aw-search__well` padding | tapping it does **not** focus the input (no `<label for>`, no click-to-focus) — measured `activeElement` stayed `<body>` | panel head | **YES** |
| `.scr-nav--close` (X) | `close()` — wipes query, browse family, history, and the container | panel top-right | **YES — 34×34** |
| `.scr-nav--back` (‹) | `goBack()` — pops one nav entry (max 50) and repaints | panel top-left | **YES — 34×34** |
| `.scr-id` "Ask **Wallach**" | `goHome()` — hard reset to opening, clears the whole history | panel head, centred | **YES — 193×26**; nothing signals it is a button |
| scrim (the mount host) | tap outside `.scr` → `close()` (verified) | full screen | fine, but destroys all state |
| `.kcard` ×5 | enter BROWSE for that family | opening screen | OK — 64–76 px tall |
| `.brow-lens__b` ×5 | switch browse family in place | browse head | **YES — 30 px tall**, and 5 pills **wrap to 102 px** at 375 |
| `.brow-head__back` "‹ Go Back" | `goHome()` (opening screen, *not* one step back) | browse head | **YES — 81×27** |
| `.brow-card` ×121–399 | open that topic's page (`data-sr-entity`) | browse grid | OK — 100–149 px, but the grid is `1fr 1fr` at 335 px of panel |
| `.arow` `<summary>` | native `<details>` toggle | ask + topic rows | OK — 118–168 px. Native semantics = the one genuinely accessible control here |
| `.arow__chev` "›" | visual only (rotates 90° when open) | row, top-right | decoration |
| `.fgroup__more` / `.scr-more` `See N more` | un-hides `.arow--hidden` in scope, then **removes itself** | end of each family / of "More answers" | **YES — 26 px tall**, and there are **5 per topic page** |
| `.tcard` | open the best answer's subject page | ask "Keep exploring" | OK — 101 px |
| `.relpill` (button) | open that entity (`data-sr-entity`) | best-answer Related row; topic Keep-exploring row | **YES — 24 px tall**, 8 of them |
| `.relpill--plain` (span) | nothing — an inert chip for a slug with no page | Related row | looks identical to the live pill |
| `.echip` ×5 | open a suggested topic | empty state | **YES — 31 px** |
| `.ehero` (whole block) + `.eback` | `Learn More →` → emits `knowledge:open-entity`; main.ts **closes Search entirely** and opens the Knowledge drawer at that entity | topic hero | `.eback` **YES — 120×30**; the whole-hero hit target is a hover-taught affordance |
| `.sr-xref` (in-answer link) | `jumpToClaim()` — opens every ancestor `<details>`, smooth-scrolls, flashes 1.4 s | inside an answer body | inline text link; **exactly 1 claim in the whole index has one** |
| `.gloss` term | tap toggles its definition tooltip (hover/focus on desktop) | inside every answer body + verbatim | tap IS handled — but **2,511 of them** on the zinc page, each `tabindex="0" role="button"` |

---

## Data points rendered

| Datum | Source field | Format / unit | Why it matters |
|---|---|---|---|
| Family name | `ui('search_fam_<id>_name')` | Title case, 5 values | The whole opening IA |
| Family sub-label | `ui('search_fam_<id>_sub')` | `A · B · C`, 9 px | Tells you which facets a family contains |
| Family claim count | `familyCounts()` — derived, sum over facets | integer | **1052 / 782 / 243 / 209 / 293** — never hardcoded |
| Facet label | `view-copy.json facet_labels` (13 keys) | UPPERCASE | The per-answer "kind" pill |
| Question | `claim.question` | 12–93 chars, median **43** | The row title and the best-answer headline |
| One-line answer | `claim.answer_short` | 52–**892** chars, median **171** | Row preview (2-line clamp) + the card's lead line |
| Deeper answer | `claim.answer` | 61–**2,381** chars, median **436**; `white-space: pre-line` | Rendered **only when it differs from `answer_short`** — true for 2,559 of 2,579 claims |
| Wallach verbatim | `claim.verbatim` | 60–1,186 chars, median **258**; Playfair italic, `\s+`-collapsed | **0 of 2,579 are empty — the pull-quote always renders.** The crown jewel and the single largest block on screen |
| Verbatim attribution | hardcoded in `renderVerbatim` | `— Dr. Wallach, in his own words` | Book sourcing is deliberately SILENT |
| Related slugs | `also_about` + `tier1_link.{essentials,conditions,symptoms}`, deduped, minus own subject | pills | `tier1_link` on 1,492/2,579; `also_about` median 1, **max 16** |
| Cross-reference | `claim.see_also {phrase,target}` | inline link | **1 claim in the entire index** |
| Entity name | `common_name ?? display_name` | Title case | 90 entities carry `common_name` |
| Entity type | `entity.type` | **raw lowercase slug** — `condition`, `substance`, `nutrient`, `concept`, `topic`, `person`, `element`, `event` | Rendered verbatim in `.ehero__meta` ("condition · 104 answers") and `.tcard-cat` ("substance"). **Un-humanised data leaking into copy** |
| Entity glyph | `entity.symbol` → `ENTITY_ICON[slug]` → `TYPE_ICON[type]` → first letter | atomic symbol or a 24×24 inline SVG | 66 of 547 have a symbol. `color_therapy` is the one **full-colour** SVG (opted out of the mono stroke rule) |
| Answer count | `claim_count`, or the summed family counts | integer | 1–**58** per registry entity (median 2); a page-backed entity can be far larger — cancer renders **104** |
| Topic peek | shortest non-empty `answer_short` in the family | 2-line clamp | The browse card's only content |
| Dominant facet | modal facet within the family | facet LABEL (uppercase) | The browse card's micro-label |
| Facet hints | `subjectFacetHints()` | **raw facet slugs** — `warning · physiology · mechanism · sources` | Rendered in `.tcard-foot`. **Un-humanised slugs in copy** |
| Suggestion chips | top-5 by `claim_count`, charged entities filtered | names | Measured: Calcium, Zinc, Copper, Magnesium, Chromium |
| Glossary definitions | `state/glossary.ts` via `glossify()` | tooltip text | First occurrence per block |
| `page` / `book_id` | present on every claim (`book_id` never null; `page` null on 1,824/2,579) | — | **NEVER DISPLAYED on this surface.** `composeCite`/`composeShortCite` exist and are not called here. Deliberate — do not "helpfully" restore it |
| `synonyms` (1–53, median 6), `topics` | matcher input only | — | Never displayed. They are what makes typing work |

---

## Copy

**Chrome**
- Title: `Ask ` + *Wallach* (the `em` is green)
- Placeholder: `Ask about a nutrient, food, condition, or symptom…`
- `aria-label` / `title`: `Back` · `Close search` / `Close` · `Back to the start` (on `.scr-id`)

**Section labels** (`.scr-label`, 9.3 px mono, uppercase, with a hairline rule)
- `Browse by kind of answer` · `Best answer` · `More answers` · `Keep exploring`

**The five families** (`view-copy.json`, ids `search_fam_<id>_{name,sub,more}`)

| id | name | sub | "See N more ___" |
|---|---|---|---|
| science | The Science | How it works · Basics · Sources · Physiology | science answers |
| action | What To Do | Protocol · Uses | recommendations |
| stance | Wallach's Take | Stance · Big questions | positions |
| signs | Cautions | Warnings | cautions |
| story | The Story | History · Discovery · Biography · Origins | stories |

**The thirteen facet labels** (`facet_labels`) — BASICS · WARNINGS · IN THE BODY · HOW IT WORKS ·
SOURCES & EXPOSURE · USES · WHAT TO DO · WALLACH'S STANCE · BIG QUESTIONS · DISCOVERY · ETYMOLOGY ·
HISTORY & LORE · BIOGRAPHY

**Per-result copy**
- `— Dr. Wallach, in his own words` (verbatim attribution, 8.6 px)
- `Related` (row label, 8.6 px)
- `See {n} more →` (ask) · `See {n} more {family_more} →` (topic)
- `Learn More →`
- `{n} answers` / `1 answer`; `{type} · {n} answers`
- `.tcard-foot`: `{n} answers · {facet slugs joined by ' · '}`

**Browse**
- kicker `Browse by kind of answer` · title = family name · meta `{n} topics · {n} answers` · `‹ Go Back`

**Empty / dead ends**
- `Nothing on that yet`
- `No match for “{query}.” Try one of these:`
- `— nothing to show for this topic yet —`
- `— no sealed claims on this yet —`

**Orphaned copy** — `view-copy.json` defines `search_no_match`
(`"No direct match — browse by kind below, or try a different word."`). **Nothing reads it**;
`renderEmpty()` hardcodes its own two strings instead. Either wire it or delete it in the rebuild.

---

## Interaction dependencies

Flagged loudly — each of these either cannot survive touch, or survives only by accident.

1. **HOVER IS THE ONLY TEACHER.** Every card in the surface has a hover state and no touch
   equivalent: `.kcard:hover` (lift + colour), `.tcard:hover` (ghost number brightens),
   `.brow-card:hover`, `.brow-card:hover .brow-card__n`, `.relpill:hover` (fills), `.echip:hover`,
   `.fgroup__more:hover` (fills + the arrow slides 3 px), `.eback:hover`, `.scr-nav:hover`,
   `.aw-search__btn:hover` (a lift on a **dead** control), `.brow-lens__b:hover`. **There is not
   one `:active` rule in `drawer-search.css`** — on a phone every tap is visually silent until
   the screen redraws.
2. **`.ehero--link:hover` is a hover-only signpost.** The *whole hero* is the Learn-More hit
   target, and the only thing telling you so is `:hover` lighting the button. On touch the hero
   is a mystery tap zone that swaps you into a different drawer.
3. **`title=` attributes carry real information nowhere else.** `Open {name}` on every related
   pill, `Related to this` on the inert pills, `Jump to the full answer` on the xref,
   `Back to the start` on the title. Hover-only. Invisible on a phone.
4. **NO `:focus-visible` ANYWHERE except `.sr-xref`.** Keyboard focus on a kcard, an arow, a
   pill, a chip, a lens pill, a See-N-more, or the corner nav is **completely invisible**.
5. **Esc is the only keyboard close** and there is no touch analogue beyond the 34 px X.
6. **Bare `S` opens the drawer** — a desktop-only affordance advertised in the topbar chip.
7. **2,511 focusable `.gloss` spans** on the zinc topic page (1,049 on cancer, 262 on a fried-eggs
   ask). Each is `tabindex="0" role="button"`. That is 2,511 tab stops and 2,511 screen-reader
   buttons inside a search result. Tap *is* handled — but any scroll dismisses the tooltip
   (`window.addEventListener('scroll', hide, true)`), which is exactly the gesture needed to read
   a long answer.
8. **The gloss tooltip positions against `window.scrollX/Y`** while living inside a
   `position:fixed` scrim with its own inner scroller. It works today; it is one layout change
   from being wrong.
9. **Nested scrollers.** The scrim itself is `overflow-y:auto` *and* `.scr-body` is
   `overflow-y:auto`. On touch that is a scroll-chaining trap (the old mobile sheet patched it
   with `overscroll-behavior: contain` — that patch is being thrown away).
10. **Custom 11 px webkit scrollbars** (`.scr-body::-webkit-scrollbar` + a green gradient thumb)
    are a mouse affordance that eats 11 px of every result row's width on a phone.
11. **`el.scrollIntoView({behavior:'smooth'})`** in `jumpToClaim` — honoured by the global
    reduced-motion block only for CSS animations, not for this JS call.
12. **No `aria` on the modal.** Measured: `.scr` has no `role`, no `aria-modal`; `.scr-body` has
    no `aria-live`; the input has no accessible name. A screen reader gets a silent innerHTML
    swap on every keystroke and no announcement of how many answers landed.
13. **Auto-focus on open** (`setTimeout(() => input.focus(), 0)`). On desktop this is correct.
    On a phone it is the direct cause of the 75 px letterbox, *before the user has read a word*.

---

## Desktop-only assumptions

- **A fixed 161 px head on a 620–684 px panel.** 26 % of the panel is chrome that never scrolls.
  Sane at 900 px of window; fatal at 366.
- **`max-height: calc(100vh - 128px)`** — a `vh` cap on a device whose browser chrome moves.
- **`width: min(600px, 100%)` centred with a 20 px gutter** — the panel *survives* narrow
  because it is a centred max-width card, which is why the old retrofit called it "already fine".
  It fits; it does not work.
- **`.brow-grid: 1fr 1fr`** — a 2-up card grid designed for a 600 px panel, unchanged at 335 px.
- **Everything renders eagerly; nothing is virtualised.** Measured DOM per state:

  | State | innerHTML chars | element nodes | `.gloss` spans |
  |---|---|---|---|
  | Opening | 1,545 | 27 | 0 |
  | Ask (fried eggs) | 131,191 | 745 | 262 |
  | Topic (cancer) | 423,167 | 2,324 | 1,049 |
  | Topic (zinc) | **889,861** | **4,460** | **2,511** |
  | Browse (What To Do) | 216,135 | 2,808 | 0 |

  The hidden rows are `display:none`, not absent — a topic page pays for all 104 answers to show 15.
- **Live-as-you-type with no debounce.** Measured on a desktop-class CPU: `resolveQuery()` alone
  **11.0–14.6 ms** per keystroke (it token-scores all 2,579 claims); a full keystroke
  (resolve + a 100–900 KB innerHTML swap) measured **9–40 ms**, median ≈19 ms. A mid-range phone
  is 4–6× slower. A `lastKey` guard skips the *repaint* when the result is unchanged, but the
  resolve always runs.
- **A 17k–24k px browse scroller** (281 and 399 cards) with no index, no jump, no filter, no
  alphabet rail — browsable with a mouse wheel, not with a thumb.
- **`See N more` as the only truncation tool.** One tap turns cancer from 2,899 px into 16,027 px
  with no way back and no position anchor.
- **The Learn-More handoff destroys context.** `knowledge:open-entity` → `closeAllDrawers()` →
  `close()` wipes query, browse family and the 50-entry back stack. On desktop the Knowledge
  drawer is a peer window; on a phone it is a one-way door.

---

## Vertical-space budget — measured

**Shell geometry @ 375×812** — scrim `padding: clamp(24px,7vh,88px) 20px 40px` → panel top 57 px;
`.scr` **335×684**; `.scr-head` **161 px fixed** (title 26 + `.aw-search` 70 + padding);
`.scr-body` client **521 px**. Results therefore get **64 % of the screen**.

**Shell geometry with the keyboard up** (measured at a 366 px viewport):
`.scr` = **238 px**, head still **161 px**, `.scr-body` client = **75 px**.
The head consumes **68 %** of the panel.

**Per-element cost at 375 px wide** (min / median / max across the states driven)

| Element | Height |
|---|---|
| `.ans` best-answer card | **517 / 733 / 1,864 px** |
| ├ `.ans__short` | 69 / ~150 / 553 px |
| ├ `.ans__body` | 69 / ~330 / 714 px |
| └ `.vq` verbatim | 135 / ~290 / **723 px** |
| `.arow` collapsed | 118 / **143** / 168 px |
| `.arow[open]` | up to **1,048 px** |
| `.kcard` | 64 / 64 / 76 px |
| `.tcard` | 101 px |
| `.ehero` | 79 px |
| `.fgroup__head` | 18 px |
| `.fgroup__more` | 26 px |
| `.brow-card` | 100 / 100 / 149 px |
| `.brow-lens` (5 pills, wrapped) | 102 px |
| `.brow-head` | 93 px |
| `.empty` block | 291 px · `.echip` 31 px |
| `.relpill` | 24 px · `.scr-label` 14 px |

**What that means in screens** (a screen = the 521 px body; parenthesised = the 75 px letterbox)

| Query | Result | Screens to read |
|---|---|---|
| `how much selenium should i take` | best 517 px + 4 rows, 35 hidden | **2.7** (19.0) |
| `why are fried eggs bad` | best 733 px + 4 rows, 35 hidden | **3.3** (22.9) |
| `is fluoride safe` | best **1,864 px** + 4 rows | **5.2** (36.3) |
| `cancer` (topic, as delivered) | 15 of 104 rows | **5.6** (38.6) |
| `cancer` (all reveals tapped) | 104 rows collapsed | **30.8** (214) |
| `cancer` (all rows open) | 104 rows open | **197** (1,371) |
| browse *What To Do* | 399 cards | **46.1** (320) |

**The single worst number:** one best-answer card (733 px) is **1.4× the entire visible results
area** at full height and **9.8×** it with the keyboard up. You cannot see one answer.

**Legibility.** Sub-12 px text nodes counted inside the popup: opening **6**, ask **84**,
topic (cancer) **226**, topic (zinc) **340**. Smallest faces: `.arow__pill` **8 px**,
`.brow-card__cat` 8 px, `.vq__attr` **8.6 px**, `.rellabel` 8.6, `.kcard-facets` /
`.ehero__meta` / `.fgroup__ct` **9 px**, `.scr-label` 9.3. These are tokens
(`--ds-text-micro/mini`) used surface-wide, not one-off sizes.

**Touch-target failures measured** (< 44 px): `.scr-nav--back` 34×34 · `.scr-nav--close` 34×34 ·
`.scr-id` 193×26 · `.aw-search__input` 185×24 · `.eback` 120×30 · `.fgroup__more` ×5 @ 26 px ·
`.relpill` ×8 @ 24 px · `.echip` ×5 @ 31 px · `.brow-lens__b` ×5 @ 30 px · `.brow-head__back` 81×27
· and the entry point itself, `.topbar__ask` 183×**35**. **18 failures on a single topic page.**
Passing: `.arow` summary 118–168, `.kcard` 64–76, `.brow-card` 100–149, `.tcard` 101 — and
`.aw-search__btn` 42×42, which is the only chrome near the floor and is **dead**.

---

## Retrieval behaviours a rebuild must not lose (the surprising ones)

1. **An exact name never gives you an "answer" — it gives you a page.** `zinc`, `cancer`,
   `selenium deficiency`, `crohn's` all resolve to a TOPIC page, not a best answer. Two passes:
   canonical identity (slug/display_name) wins over any synonym collision, *then* synonyms.
2. **`matchKey()` is applied symmetrically** — lowercase, every non-alphanumeric run → one space.
   This is what lets a question ending in `?` still route (`"...my iq?"` → `my iq`).
3. **The catch-all `wideEntityHit`** reaches past the 547-entity registry into every condition +
   essential page. Typing `cancer` finds a real page even though cancer has no enriched claims of
   its own. Synonyms are deliberately *not* matched at this layer.
4. **Mentioned-entity routing.** If the query mentions an entity anywhere (longest phrase wins:
   "breast cancer" beats "cancer") but the top-ranked claim is *not* primarily about it, the
   surface routes to that entity's page rather than showing a tangential answer. Verified live:
   `what causes muscle cramps` → the `muscle_cramps` topic page, not an answer.
5. **`heroByIntent` re-picks the hero AFTER ranking**, scoring only on the query minus the topic's
   own name tokens (singular + plural). A bare definitional query (`what are antioxidants`) tokenises
   to nothing and heroes the `basics` facet explicitly.
6. **The charged gate.** `homosexuality` / `intersex` claims are excluded from ranking unless the
   query explicitly names one — via the entity's own synonyms **or** 13 hardcoded terms. They are
   also filtered out of the empty-state suggestion chips. This is a safety rule, not a preference.
7. **Two claim sources are merged on a topic page.** Enriched search Q&A (`quality 0`, keeps its
   question / short / body / verbatim) plus **raw sealed corpus claims** (`quality 1`, title =
   `softClamp(claim_text, 116)`, no short line, body = the claim text). Raw rows wear the corpus
   `kindLabel` pill and a family derived from `kindCategory` (red folds into Cautions). Enriched
   sorts first inside each family. Deduped by id.
8. **Hard limits, all of them arbitrary and all of them load-bearing:** `ASK_ANSWER_LIMIT = 40`
   ranked answers; `MORE_CAP = 4` visible in "More answers"; `FAM_CAP = 3` visible per family;
   `relatedSlugs()` capped at **8**; empty-state chips capped at **5**; nav history capped at 50;
   `LEDE_MAX = 340`; input `maxlength = 120`.
9. **`claimsForSubject` includes `also_about`** — an ORAC food answer surfaces on the Antioxidants
   topic and vice-versa — but the **lede** requires `subject === entity` so a tangential claim can
   never headline a page.
10. **Colour is 100 % data-driven.** A rendered element carries `data-facet`, `data-family` or
    `data-type` and CSS resolves `--k`. No colour literal exists in `search.ts`
    (`view_category_not_hardcoded` enforces this). Five family colours + five entity-type colours,
    all remapped for dark in `theme.css`.
11. **`views/search-highlight.ts` is NOT used by this surface.** Despite the name, its only consumer
    is `views/knowledge.ts::applyKnowledgeSearch` (the Knowledge drawer's filter box). **Ask Wallach
    performs no query-term highlighting at all** — the searched words are never marked in a result.

---

## Feature-preservation contract

A rebuilt mobile Ask-Wallach must satisfy every line. Numbered so a review can cite one.

**Retrieval — no behaviour may change**
1. All six render outcomes reachable: OPENING, ASK, TOPIC, BROWSE, EMPTY, and both `aw-empty-line` dead ends.
2. `resolveQuery` routing preserved exactly: registry exact hit → wide (condition/essential) exact hit → mentioned-entity split → best answer → no-match.
3. `heroByIntent` re-pick preserved, including the bare-definitional `basics` fallback.
4. The charged-topic gate preserved for both ranking **and** suggestion chips.
5. Every ranked answer up to `ASK_ANSWER_LIMIT` remains **reachable** — no hard slice may silently drop a ranked hit.
6. Both claim sources on a topic page (enriched `quality 0` + raw corpus `quality 1`), enriched-first, deduped by id, grouped into the five families in `FAMILY_ORDER`.
7. `also_about` cross-surfacing preserved; the lede's `subject === entity` restriction preserved.

**Data — §00.A**
8. Every claim renders: question, `answer_short`, `answer` (only when it differs), **verbatim**, facet/kind pill, related links. No amount, dose or claim may be re-worded, merged, truncated destructively, or invented.
9. The verbatim keeps the one serif (Playfair) and the exact attribution `— Dr. Wallach, in his own words`. **All 2,579 claims have one.**
10. **Book sourcing stays silent.** `page`/`book_id` exist and must NOT be surfaced here.
11. Category colour-coding preserved and still **data-driven** (`data-facet` / `data-family` / `data-type` → `--k`); zero colour literals in TS. Both cream and dark designed.
12. Counts stay derived (`familyCounts`, `claim_count`, `{n} topics · {n} answers`) — never a literal.
13. The 13 facet labels and 5 family names/sublabels keep coming from `view-copy.json`; new copy is added there, not inlined.

**Every control survives, with a touch-native equivalent**
14. Open (topbar / rail / `S`), close (X, scrim, Esc), one-step back, hard reset to home.
15. Browse into a family, switch family in place, leave browse.
16. Expand/collapse a single answer; reveal the hidden overflow in every group.
17. Related-pill navigation (live pills clickable; inert slugs must be visibly inert, not identically styled).
18. `Learn More →` into the Knowledge page — and, unlike today, **it must be possible to come back**.
19. `see_also` in-answer jump (open ancestors, scroll, flash) — one claim uses it, keep it working.
20. Glossary term definitions on tap, without turning the panel into thousands of tab stops.

**Fixes the rebuild owes**
21. **The magnifier must do something or not exist.** Today it is a 42×42 `<span>` with a hover lift and no handler.
22. **Enter / the keyboard Go key must submit** (and dismiss the keyboard). Today it is a no-op.
23. **Tapping anywhere in the search field must focus the input.**
24. Every interactive target ≥ 44×44 — the 18 measured failures above, plus `.topbar__ask` (183×35).
25. **The 161 px fixed head must not be the price of every screen.** Results must own the viewport once a query exists.
26. Text below 12 px must go — `--ds-text-micro`/`mini` are the root cause (8 px facet pills, 8.6 px attributions, 9 px meta lines).
27. A press state (`:active`) for every control; hover may only *enhance*, never *teach*.
28. Real `:focus-visible` on every control (today: `.sr-xref` only).
29. `role="dialog"` + `aria-modal`, an accessible name on the input, an `aria-live` result count, `inputmode="search"`, `enterkeyhint="search"`, and a focus trap.
30. `dvh`/`svh` from the start; `overscroll-behavior: contain` on every scroller; `-webkit-tap-highlight-color: transparent`; safe-area insets on the panel and any bottom bar.
31. Input `font-size ≥ 16px` (today 17.6 px — do not regress it, or iOS will zoom on focus).
32. Native mouse scrollbars off on touch; they currently eat 11 px of every row.
33. Wire or delete the orphaned `search_no_match` copy string.
34. Humanise `entity.type` and the raw facet slugs in `.ehero__meta` / `.tcard-cat` / `.tcard-foot` (today they read `condition · 104 answers` and `13 answers · warning · physiology · mechanism · sources`).

**Performance**
35. Do not eagerly render 4,460 nodes / 890 KB of HTML to show 15 rows. Virtualise, paginate, or render on demand.
36. Debounce or defer the resolve (measured 11–15 ms/keystroke desktop-class, 4–6× on a phone) and stop rebuilding the whole body on every keystroke.
37. If a blurred backdrop survives, **the animation freeze must survive with it** — the blur is only affordable because the ambient loops behind it are paused (`animation-play-state: paused`, measured −72 % compositor work). Do not re-add the blur without the freeze, and do not "optimise" by lowering the radius; the radius was never the cost.
38. Reduced-motion honoured — including the JS `scrollIntoView({behavior:'smooth'})` in `jumpToClaim`, which the global CSS block does not reach.

---

## Open questions

1. **Should the keyboard stay up at all?** Auto-focus is the direct cause of the 75 px letterbox.
   A mobile-native pattern (a search *screen* whose keyboard dismisses on the first scroll, or a
   submit-then-read model) changes the entire shape of this surface. **A design decision, not an
   inventory finding.**
2. **Does the ASK vs TOPIC split survive on a phone?** Today an exact name silently gives you a
   different screen than a question. That is invisible on desktop and likely confusing on touch.
3. **What replaces a 24,021 px browse grid?** 399 topic cards in one flat scroller has no mobile
   answer without an index, a search-within, or progressive disclosure — none of which exist.
4. **Where does the verbatim go?** It is the crown jewel *and* the biggest block (median 290 px,
   max 723 px). Collapsing it by default would hide the one thing the app is for; leaving it open
   is why one answer needs 1.4 screens. **Unresolved — needs the owner's call.**
5. **Is the Learn-More one-way door acceptable?** Today it destroys the search session.
6. **2,511 gloss spans** — is per-answer glossing still right when a topic page carries 104 answers,
   or should glossing be scoped to the expanded row only?
7. **Should Ask Wallach highlight the searched terms?** The machinery exists
   (`search-highlight.ts`) and is wired only to the Knowledge drawer. Adding it here would be a
   new feature, not a preserved one.
8. **Could not determine:** real-device keystroke latency. All timings are headless desktop Chrome;
   the 4–6× phone multiplier is an estimate, explicitly flagged as such.
9. **Could not determine:** the exact on-screen keyboard height on the owner's device. 366 px of
   remaining viewport was used as the working figure (≈55 % of 812). The brief cites an earlier
   audit measuring a 168 px letterbox at 7.8 % of an answer set; this pass measured **75 px / 2.0 %**
   at 366 px. Both are catastrophic; the discrepancy is a viewport assumption, not a disagreement.
10. **Out of scope, noted:** the Knowledge drawer has its own separate search box with its own
    empty-copy (`kh_search_empty`) and its own filter/highlight/hoist pipeline. Two search
    experiences ship in one app. Whether they merge on mobile is an IA question for that inventory.
