# App shell · Profile · Welcome — feature inventory

_Read from source on 2026-08-22 (branch `master`). Files read in full: `dashboard/dashboard.html`
(166 lines), `dashboard/assets/styles/dashboard.css` (636), `dashboard/assets/styles/drawer-shared.css`
(239), `dashboard/assets/js/src/main.ts` (630), `views/profile.ts` (594), `views/welcome.ts` (268),
`views/scroll-keep.ts` (55), `views/gloss-tooltip.ts`, `state/profile.ts`, `core/schemas/profile.ts`,
`core/schemas/backup.ts`, `core/storage.ts`, `core/goal-display.ts`, `core/events.ts`, plus the token
declarations of `design-system.css` (1113), `theme.css` (805) and `type-futurist.css`._

**Scope.** The SHELL (rail, topbar, workspace host, mount slots), the PROFILE console, the WELCOME
veil, the theme/accent system, global keys, scroll preservation, and the `--ds-*` token vocabulary.
NOT in scope here (own inventories): the three workspace bodies, the Search drawer's interior, the
Knowledge drawer's interior. Where the shell OWNS something about a drawer (its mount, its position,
its rail sync) it is recorded here.

---

## Destinations & states

### The shell itself

There is exactly ONE HTML document. Everything is a state of it — no routing, no URL, no history.
A refresh always lands on Coverage.

| # | Destination / state | How it is entered | How it is left |
|---|---|---|---|
| 1 | **Coverage** workspace (default landing) | rail item 1, bare key `1`, `wallach:navigate {to:'coverage'}` | navigating away |
| 2 | **Regimen** workspace | rail item 2, bare key `2`, `wallach:navigate {to:'regimen'}` (fired from Coverage:911, Knowledge:860/882) | navigating away |
| 3 | **Scanner** workspace | rail item 3, bare key `3`, `wallach:navigate {to:'scanner'}` (Regimen:1686) | navigating away |
| 4 | **Search drawer open** ("Ask Wallach") | rail item `S`, bare key `s`/`S`, topbar Ask-Wallach button | `Esc`, its own close, opening the other drawer, any workspace switch |
| 5 | **Knowledge drawer open** | rail item `K`, bare key `k`/`K`, `knowledge:open-entity`, `knowledge:open-tab` | `Esc`, its own `[X]`, opening Search, any workspace switch |
| 6 | **Profile console open** (modal over everything) | click / Enter / Space on the rail profile chip | `Esc`, the `[X]`, "Done", "Continue as guest", scrim click |
| 7 | **Arrival veil** (first run only) | boot when `loadUserProfile() === null` | "Show me my field", "I'm just browsing →", the `[X]` (all three write a choice) |
| 8 | **Goal picker** (the veil re-opened) | `wallach:open-welcome` from Coverage:869 and Regimen:1564 ("+ ADD") | the primary button, or the `[X]` (cancel = leave goals untouched) |

**Subtle:** only ONE overlay may be open at a time (`toggleDrawer` closes the others first). The rail's
lit state for a drawer is DERIVED from `handle.isOpen()`, re-synced on the `drawer:toggled` event —
because a drawer's own `[X]` is a close path the shell never sees.

### Shell sub-states worth naming

- **Identity tri-state** (`state/profile.ts`): `null` = never asked → show veil; `{browsing:true}` = chose
  anonymity → NEVER re-prompt; `{name:'…'}` = named → never re-prompt. "Anonymous is a choice, not an absence."
- **Guest vs signed-in**: drives the rail name ("You" / the name), the brand slot ("Codex" / the name),
  the document title ("Your Health Journey" / "<Name>'s Health Journey"), the profile status dot, and
  whether "Continue as guest" is offered.
- **Theme**: `cream` (default) | `dark` — stamped as `<html data-theme>`.
- **Accent**: one of 8 — stamped as `<html data-accent>`.
- **Avatar**: none (initial glyph) | one of 25 bundled PNGs | an uploaded 256px data-URI.
- **Corpus loaded / not loaded**: the rail sub-line reads `Corpus · 2,601 entries` once hydrated,
  and the bare word `Corpus` before that. It NEVER prints `0` — a number the app does not have.
- **Creator's Log present / absent**: the `<details>` block is omitted entirely when there are 0 entries.

### Profile console states

Open · name focused (uncommitted) · name rejected (reason shown in an `aria-live` region) ·
avatar family filter `All | Generic | Men | Women` · theme selected · accent selected ·
Creator's Log collapsed (default) / expanded · import failed (4 distinct reasons) ·
import partially applied (quota) · import succeeded → **full page reload**.

### Welcome veil states

First arrival (name + goals, both required for the primary button) · re-open as goal picker
(no name field, no "just browsing" link; only the goal count gates the button) ·
goal cap reached (5) · name rejected.

---

## Controls

| Control | What it does | Where it lives | Touch-hostile? |
|---|---|---|---|
| `.rail__brand-mark` "Wallach Codex" | static text; uppercase mono, `--ds-track-widest` | rail top | not a control |
| `#railBrandName` | derived `displayName(p,'brand')` → the name or "Codex" | rail top | not a control |
| `#railBrandSub` | derived corpus count, or "Corpus" | rail top | not a control |
| Rail · **Coverage** `◉` + kbd `1` | `navigateTo('coverage')` | rail, Workspaces group | **YES** — ~42px tall at the 820px collapse (12px pad + 18px icon); kbd chip is meaningless on touch |
| Rail · **Regimen** `▤` + kbd `2` | `navigateTo('regimen')` | rail | same |
| Rail · **Scanner** `⌖` + kbd `3` | `navigateTo('scanner')` | rail | same |
| Rail · **Search** `⌕` + kbd `S` | `toggleDrawer('search')` | rail, Drawers group | same |
| Rail · **Knowledge** `❡` + kbd `K` | `toggleDrawer('knowledge')` | rail, Drawers group | same |
| Rail · **profile chip** (avatar + name + "SETTINGS · PROFILE") | opens the profile console; `role=button`, `tabindex=0`, Enter/Space | rail footer | 32px avatar; the whole chip is the hit area, so acceptable if kept |
| Topbar · **nameplate** (`h1.np__name` + `.np__rule` + `.np__deck`) | names the current workspace; repainted per navigation | topbar col 1 | not a control — **but `@media(max-width:560px)` hides the WHOLE breadcrumb, so a phone shows nothing naming the surface** |
| Topbar · empty `<span>` | the grid spacer that pushes Ask Wallach right | topbar col 2 | load-bearing markup, not a control |
| Topbar · **Ask Wallach** (pulsing dot + label + kbd `S`) | `toggleDrawer('search')`; `aria-label="Ask Wallach — open Search"` | topbar col 3 | ~34px tall (0.5rem padding + 0.85rem text) — under 44px |
| Profile · `[X]` `.ui-close` | emits `pf:close` → unmount + focus restore | panel head, absolute top-right | 34px — under 44px |
| Profile · avatar **badge `+`** | opens the file picker | on the hero avatar, `right:-2px; bottom:-2px` | 30px — under 44px, and it overlaps the avatar edge |
| Profile · **name input** | free text, `maxlength=24`, commits on `change`/Enter/blur | hero | fine; Enter blurs rather than submitting |
| Profile · family chips **All / Generic / Men / Women** | filters the avatar grid; `aria-pressed` | body | ~24px tall (4px pad + 0.72rem) — under 44px |
| Profile · **Upload tile** | opens the file picker | first tile of the grid | ~32px at 375px — see the grid note below |
| Profile · **Default tile** (your initial) | `clearAvatar()` → back to the auto avatar | second tile | same |
| Profile · **25 preset tiles** | `setAvatar(id)` | the grid | **YES** — `repeat(7,1fr)` in a ≤287px inner width with 10px gaps ⇒ **≈32px tiles** |
| Profile · **Cream / Charcoal** segmented pair | `setTheme()`; each button paints itself in its own palette | appearance row | ~30px tall — under 44px |
| Profile · **8 accent swatches** | `setAccent()`; `aria-pressed`; a `✓` on the chosen one | appearance row | **YES** — 30×30px circles, 10px apart |
| Profile · **Export** | builds a `{app,version,exportedAt,data}` envelope and triggers an `<a download>` | data row (left) | 34px icon in a ~58px-tall button — OK |
| Profile · **Import** | opens a `.json` picker → validate → `restore()` → `location.reload()` | data row (right) | OK |
| Profile · **Reset identity** (danger) | `resetIdentity()` — drops name + avatar, KEEPS theme/accent and the regimen | data row, full width | **no confirmation step at all** |
| Profile · **Creator's Log** `<details>` | expands 931 entries into a `max-height:260px` inner scroller | bottom of the body | nested scroller #3 |
| Profile · **Continue as guest** | closes; only VISIBLE while the name field is empty | footer left | hidden-by-state, easy to miss |
| Profile · **Done** | closes | footer right | fine |
| Profile · 2 hidden `<input type=file>` | image (png/jpeg/webp) and json | end of panel | n/a |
| Veil · `[X]` `.ui-close` | first arrival ⇒ recorded as "just browsing"; re-open ⇒ plain cancel | card top-right | 34px; **on first run this is a permanent opt-out disguised as a dismiss** |
| Veil · **name input** | `maxlength=18`, live counter | card | fine |
| Veil · **30 goal chips** | toggle; capped at 5; the chosen ones take `GOAL_HUES[pickIndex]` | grouped under 6 category labels | 5px/12px padding ⇒ **~26px tall** — well under 44px, 30 of them |
| Veil · **"I'm just browsing →"** | `enter(true)` — writes `{browsing:true}`, clears goals | footer left; first arrival only | a bare underlined text link, ~18px tall |
| Veil · **"Show me my field"** (`.ds-btn-primary`) | `enter(false)` — writes name + goals | footer right | disabled until a name AND ≥1 goal |
| Global · `Esc` | closes every drawer; separately closes the profile overlay | `document` | keyboard-only |
| Global · `1` `2` `3` | jump to workspace | `document` | keyboard-only |
| Global · `s` `k` | toggle drawer | `document` | keyboard-only |
| Global · `Tab` inside profile | focus trap cycles the panel's focusables | the overlay | keyboard-only |
| Global · gloss tooltip | hover / focus / **tap** a `.gloss` or `[data-tip]`; any scroll dismisses | `document` (delegated) | tap IS supported (tap-again toggles off, tapping a new term switches) |

**Not a control, but present in markup:** `#palette-mount` — a mount slot styled in `dashboard.css`
with **no JavaScript that ever writes to it**. Dead in the current build.

---

## Data points rendered

| Datum | Source field | Format / unit | Why it matters |
|---|---|---|---|
| Brand slot | `displayName(profile,'brand')` | the name, else `Codex` | the app addresses the user by name or stays neutral — never a pseudo-name |
| Rail profile name | `displayName(profile,'profile')` | the name, else `You` | same single source; the two slots cannot drift |
| Rail avatar | `avatarSrcOf(profile)` → `<img>`, else `displayInitial(profile)` | 32px circle; initial is `name[0].toUpperCase()` | identity at a glance |
| Browser tab title | `displayTitle(profile)` | `Your Health Journey` \| `<Name>'s Health Journey` | the only place outside the app the identity shows |
| Corpus entry count | `corpusState.claimCount()` = `Object.keys(claims).length` | `Corpus · 2,601 entries`, `toLocaleString()`; bare `Corpus` before hydration | **derived, never typed** — a frozen count is "a lie with a delay" |
| Workspace name | `WORKSPACE_HEADERS[target].name` | uppercase, 0.85rem, tracked | tells you where you are |
| Workspace deck | `WORKSPACE_HEADERS[target].deck` | one sentence, `nowrap` | tells you what the surface IS |
| Name character count | `input.value.length` | `N/24`; turns `--ds-status-err` at the cap | a bounded field must show its bound |
| Guest / signed-in | `value.trim() === ''` | dot + `Guest` \| `Signed in`; green vs faint dot | states which identity mode you are in |
| Avatar catalogue size | `presetIds().length` | `25 graphics` | **derived from FAMILIES counts**, not a literal |
| 25 preset avatars | `presetSrc(id)` → `assets/avatars/Generic.png`, `Men/NN.png`, `Women/NN.png` | PNG, `loading="lazy"`; 800 KB total on disk | real portraits, bundled offline |
| Uploaded avatar | canvas-downscaled to **256×256 PNG** data-URI, capped at `AVATAR_MAX = 900 000` chars | data URI | bounded so it cannot eat the ~5 MB LS quota |
| Theme id | `themeOf(profile)` | `cream` \| `dark`; default cream | stamped on `<html data-theme>` |
| Accent id | `accentOf(profile)` | one of 8; default `ember` | stamped on `<html data-accent>` |
| Accent swatch colours | `var(--acc-<id>)` from `theme.css` | hex | the view re-types **no** hex — one source |
| Creator's Log entry count | `getEntries().length` | `Creator's Log · 931 entries` | derived |
| Log entry: timestamp | `e.ts` | `YYYY-MM-DD HH:MM` (sliced ISO) | audit trail |
| Log entry: surface | `e.surface` | uppercase mono | which part of the system |
| Log entry: kind pill | `LOG_LABEL[e.kind]` | 10 kinds: `SESSION`, `SESSION END`, `ROUND CLOSE`, `BUILD`, `INVARIANT ✓`, `INVARIANT ✗`, `INCIDENT`, `MILESTONE`, `DESIGN`, `NOTE` | ok = green, fail/incident = red |
| Log entry: summary + detail | `e.summary`, `e.detail` | detail is `white-space: pre-wrap` | the teaching record |
| Export filename | `wallach-codex-backup-<YYYY-MM-DD>.json` | JSON, 2-space indent | the user owns their data |
| Export payload | `snapshot()` — every LS key prefixed `wallach`, `rg`, `lc` | `{app:'wallach-codex', version:1, exportedAt, data:{k:rawString}}` | scoped so an export is clean and a restore cannot write arbitrary keys |
| Import result | `restore()` → `{restored, skipped, removed}` | a sentence naming the skipped count | a partial write must never masquerade as a clean one |
| 30 goals | `coverage-layout-data.json.goals[]` — `{id, name, category}` | chips, grouped by category in first-seen order | the goal picker |
| Goal categories (6) | `.category` | `Bones, joints & muscles` (3) · `Mind & nerves` (5) · `Heart & metabolism` (6) · `Digestion, immunity & breathing` (5) · `Skin, senses & mouth` (4) · `Reproductive & whole-body` (7) | labelled shelves — 30 chips need the structure |
| Goal cap | `MAX_GOALS` = `GOAL_HUES.length` = **5** | `N/5 selected` | the palette IS the cap, so two goals can never share a hue |
| Goal hues | `GOAL_HUES` = `#7c5cff #12a594 #d6409f #3e63dd #f76b15` | assigned by **pick order**, not by goal id | a multi-goal tile's gradient stays legible |

**§00.A note:** nothing on this surface is a Wallach amount. The goals are OUR curation; the log is
OUR record; the corpus count is derived from the sealed corpus. A rebuild introduces no new numbers here.

---

## The `--ds-*` token vocabulary

The full families declared in the **sealed** `design-system.css` (hash-anchored by
`design-system.golden.sha256`; USER-WRITER-ONLY — the agent may read, never edit). Shadowed, never
edited, by `type-futurist.css` (fonts) and `theme.css` (surface + accent).

| Family | Members | Values / notes |
|---|---|---|
| **Paper** (surfaces) | `--ds-paper` `-light` `-deep` `-darker` `-shadow` | cream `#faf5e8 #fffbf2 #f2ead3 #ebe2c4 #d4c8a9`; dark remaps all five |
| **Ink** (text) | `--ds-ink` `-medium` `-soft` `-faint` | `#1a1612 #3d342a #6a5d50 #9b8e7c`; dark inverts |
| **Rule** (hairlines) | `--ds-rule` `-soft` `-bright` | `#d4c8a9 #e8dfc6 #c4b889` |
| **Accent** (the one signal colour) | `--ds-accent` `-bright` `-hot` `-deep` `-soft` `-wash` | ember default `#ff7e3c #ff9d5c #ff6420 #c8552a #ffd0b3 #ffe9d8`; **all six are remapped per accent** |
| **Accent hex registry** | `--acc-ember` `-sapphire` `-verdant` `-amethyst` `-rose` `-gold` `-teal` `-slate` | declared in `theme.css` so views re-type no hex |
| **Tech** (cool micro-detail only) | `--ds-tech` `-dim` `-wash` | `#5fa4bd #a8c8d5 #d8e6ec`; never large surfaces or body text |
| **Highlighter** | `--ds-hl-warm` `-rose` `-mint` | `#ffe69c #f7c4b8 #c8e5b8`; 1–3 words per mark |
| **Status** | `--ds-status-ok` `-ok-soft` `-warn` `-warn-soft` `-err` `-err-soft` `-info` `-info-soft` | `#5b8a3f #d4e6c6 #c79830 #f3e6c6 #b04a30 #f3d6cc #4a7090 #cfdde7`; held DISTINCT from the accent |
| **Fonts** | `--ds-font-display` `-serif` `-serif-light` `-sans` `-mono` | live faces come from `type-futurist.css`: display = **Unbounded**, serif/serif-light = **Space Grotesk**, sans = Space Grotesk, mono = JetBrains Mono. The sealed file still names Playfair/Crimson — **not authoritative** |
| **Fonts (workspace-local)** | `--ds-font-display-interface` `-artifact` | declared in `workspace-coverage.css`: Chakra Petch / Bruno Ace. Used by the RAIL and the topbar — a shell dependency living in a workspace sheet |
| **Space** | `--ds-space-0`…`-10` | 0, 4, 8, 12, 16, 24, 32, 40, 48, 64, 96 px |
| **Text size** | `--ds-text-micro` `-mini` `-xs` `-sm` `-base` `-md` `-lg` `-xl` `-2xl` `-3xl` `-4xl` `-5xl` | 0.6, 0.7, 0.78, 0.85, 1, 1.05, 1.25, 1.4, 1.85 rem, then three `clamp()` scales |
| **Line height** | `--ds-lh-tight` `-snug` `-normal` `-relaxed` | 0.95, 1.1, 1.45, 1.65 |
| **Tracking** | `--ds-track-tight` `-normal` `-wide` `-wider` `-widest` | −0.025em, 0, 0.08em, 0.15em, 0.22em |
| **Radius** | `--ds-radius-xs` `-sm` `-md` `-lg` `-pill` `-circle` | 2, 3, 4, 8, 999px, 50% |
| **Elevation** | `--ds-elev-1` `-2` `-3` | warm-ink shadows (never cold blue-grey); dark remaps all three |
| **Glow** | `--ds-glow-accent` `-accent-sm` | frozen ember rgba — **does not track the accent** |
| **Motion** | `--ds-motion-fast` `-base` `-slow`, `--ds-ease-out` `-in` `-in-out` | 0.15/0.2/0.4s; all three collapse to 0.01s under `prefers-reduced-motion`, plus a global `animation-duration` override |
| **Z-index** | `--ds-z-base` `-card` `-dropdown` `-sticky` `-modal` `-toast` `-tooltip` | 1, 10, 20, 30, 100, 110, 120 |
| **Mark** | `--ds-mark-color` | the highlighter fill for `<mark>` |

**Hardcoded z-indexes the tokens do NOT cover** (the shell ignores its own scale here):
`.app-rail` 5, `#drawer-knowledge-mount.kd-open` 10, `.wc-veil` 60, `.pf-overlay` **9000**.

**Component classes in the sealed sheet** (the `.ds-*` vocabulary a rebuild may reuse):
`ds-canvas` `ds-body` `ds-card` (`--airy`, `--compact`) `ds-btn-primary` `ds-btn-ghost` `ds-icon-btn`
(`--close`) `ds-badge` (`--ok/--warn/--err/--info`) `ds-eyebrow` `ds-kicker` `ds-deck` `ds-h-hero`
`ds-h-section` `ds-h-subsection` `ds-h-tile-name` `ds-pull-quote` (`-wrap`) `ds-pull-stat`
(`__num/__body/__readout`) `ds-tabs` `ds-tab` (`__num`) `ds-topbar` `ds-breadcrumb` `ds-divider`
(`--editorial`) `ds-tag-element` `ds-tag-readout` `ds-systemid` `ds-crosshairs` `ds-ch-tl/tr/bl/br`
`ds-pulse` `ds-lift` `ds-grid` `ds-flex` `ds-inline` `ds-stack-1…6` `ds-action-bar` `ds-action-buttons`
`ds-action-context` `ds-slot-modal` `ds-slot-profile` `ds-slot-toast` `ds-visually-hidden`.
Shell-local (in `dashboard.css`, not sealed): `.ui-close`, `.ui-close--sm`, `.ds-border-travel`.

---

## Copy

Every user-visible string on these three surfaces. Marked `[html]` (hardcoded in `dashboard.html`),
`[ts]` (a literal in a view or in `main.ts`), or `[store]` (`assets/data/view-copy.json`).

**Rail** — `Wallach Codex` `[html]` · `Codex` / the user's name `[ts]` · `Corpus · N entries` and
`Corpus` `[ts]` · `Workspaces` `[html]` · `Coverage` `Regimen` `Scanner` `[html]` · `Drawers` `[html]` ·
`Search` `Knowledge` `[html]` · `You` / the user's name `[ts]` · `SETTINGS · PROFILE` `[html]`.
Keyboard chips: `1` `2` `3` `S` `K` `[html]`.

**Topbar** — `Coverage` / `Every essential Wallach named, measured against what you take.` `[html + ts]` ·
`Regimen` / `Design your own protocols based on your goals + Import and export regimens for yourself or others` `[ts]` ·
`Scanner` / `Scan a label to see how your favorite supplements stack up against your goals, or type/paste ingredients to see if it's safe` `[ts]` ·
`Ask Wallach` `[html]` · aria-label `Ask Wallach — open Search` `[html]` · kbd `S` `[html]`.

**Profile console** `[ts]` — `Profile` (eyebrow) · aria `Close profile` · title `Upload a photo` (×2) ·
placeholder `Set your name` · aria `Your name` · `Signed in` · `Guest` · `0/24` ·
`Choose your avatar` · `25 graphics` · `All` `Generic` `Men` `Women` · `Default — your initial` ·
aria `Generic avatar`, `Men avatar N`, `Women avatar N` · `Theme` · `style only, never function` ·
`Cream` · `Charcoal` · the 8 accent labels `Ember` `Sapphire` `Verdant` `Amethyst` `Rose` `Gold` `Teal` `Slate` ·
`Your data` · `100% on this device` · `Export` / `Save a .json backup` · `Import` / `Restore from .json` ·
`Reset identity` / `Back to guest — your regimen is kept` · `Creator's Log · N entries` ·
`Continue as guest` · `Done`.

**Profile error strings** `[ts]` — `This device could not process that image.` · `That image could not be read.` ·
`That file could not be read.` · `That file is not valid JSON.` · `That is not a Codex backup file.` ·
`Import incomplete — N item(s) could not be saved; this device may be out of room. M restored.`
From `state/profile.ts`: `There is not enough room left on this device to save that.` ·
`That change could not be saved to this device.` · `That avatar cannot be used.`
From `core/schemas/profile.ts`: `A name needs at least one visible character.` ·
`A name can be at most 40 characters.` · `A name cannot contain control characters.` ·
`A name must be text.` · `That name cannot be used.` · `An avatar must be a preset or an uploaded image.` ·
`That image is too large to store on this device.`

**Welcome veil** `[store]` (`view-copy.json` keys `wc_*`) —
`// Let's get started` · `What do you want to work on?` ·
`Pick anything that matters to you. Wallach wrote about all of it — this just decides what gets
highlighted first. You can change it any time, and nothing is hidden either way.` ·
`Your name` · `What should we call you?` · `Your goals` · `N/5 selected` ·
`I'm just browsing →` · `Show me my field`.
Note: the apostrophes in the store are typographic (U+2019), not ASCII.

**The 30 goal names** `[data]` — Stronger bones · Healthy joints · Muscle & strength · Sharper thinking ·
Better mood · Better sleep · Focus & attention · Nerves, Seizures, MS & ALS · Heart health · Circulation ·
Blood-sugar balance · Thyroid support · More energy · A healthy weight · Better digestion · Liver support ·
Stronger immunity · Allergy relief · Easier breathing · Healthy skin, hair & nails · Healthy eyes & vision ·
Healthy gums & teeth · Hearing & balance · Hormones & fertility · Healthy pregnancy · Prostate & men's health ·
Women's health & cycle · Kidney & urinary health · Calm inflammation · Cancer support.

**Console-only (not UI):** `[wallach·sys v3.27] dashboard module graph loaded · Round 2 (Coverage migrated)`.

---

## Interaction dependencies

Anything that cannot survive a touch screen unchanged. **Flagged loudly.**

1. **⚠ EVERY GLOBAL KEYBOARD SHORTCUT IS UNREACHABLE ON A PHONE.** `1`/`2`/`3` (workspaces),
   `s`/`k` (drawers), `Esc` (close everything). The kbd chips (`1 2 3 S K` in the rail, `S` on the
   Ask-Wallach pill) are *chrome advertising an input method that does not exist on the target device*.
   Every one of these paths needs a touch equivalent; the chips themselves must go.
2. **⚠ `Esc` IS THE ONLY GUARANTEED WAY OUT OF THE PROFILE MODAL besides three small buttons.**
   The scrim click works, but on a 375px screen the panel is `width: min(600px,100%)` inside a 20px
   padding — the scrim is a 20px strip. There is effectively no scrim to tap.
3. **⚠ FOUR NESTED SCROLLERS IN THE PROFILE PANEL.** `.pf-overlay` (`overflow-y:auto`) contains
   `.pf-panel` (`max-height: calc(100vh - 96px)`) containing `.pf-scroll` (`overflow-y:auto`)
   containing BOTH `.pf-grid` (`max-height:214px; overflow-y:auto`) and `.pf-log__stream`
   (`max-height:260px; overflow-y:auto`). On touch, a drag inside the avatar grid is ambiguous
   between four scroll parents. This is a redesign-forcing defect, not a polish item.
4. **⚠ TOUCH TARGETS UNDER 44px, measured at 375px viewport:** preset avatar tiles **≈32px**
   (`repeat(7,1fr)` inside a ~287px content box with 10px gaps); accent swatches **30px**;
   avatar upload badge **30px**; `.ui-close` **34px**; family chips **≈24px tall**;
   theme buttons **≈30px tall**; Ask-Wallach pill **≈34px tall**; goal chips **≈26px tall**;
   rail items at the 820px collapse **≈42px**; rail avatar **32px**.
5. **⚠ HOVER-ONLY AFFORDANCES.** `.rail__item:hover`, `.rail__profile:hover`, `.topbar__ask:hover`
   (the only lift/glow feedback the pill has), `.pf-tile:hover .pf-tile__img { transform: scale(1.07) }`,
   `.pf-sw:hover { transform: scale(1.12) }`, `.pf-dbtn:hover`, `.pf-fchip:hover`, `.pf-done:hover`,
   `.ui-close:hover`, `.wc-goal:hover`, `.ds-btn-primary:hover`, `.app-shell *::-webkit-scrollbar-thumb:hover`.
   None of these carries information a touch user cannot get elsewhere — but the *only* pressed/active
   feedback on several controls is the hover rule, so a rebuild owes them real `:active` states.
6. **⚠ `title=` TOOLTIPS ARE INVISIBLE ON TOUCH.** `title="Upload a photo"` (×2),
   `title="Default — your initial"`, `title=<accent label>` on all 8 swatches, `title="Close"` on the
   veil X. The accent swatches are colour circles with **no visible label at all** — on touch their
   names simply do not exist. (`aria-label` is present, so screen readers are fine; sighted touch users are not.)
7. **⚠ THE GLOSS TOOLTIP IS PART-HOVER, PART-TAP.** `views/gloss-tooltip.ts` binds `mouseover`,
   `mouseout`, `focusin`, `focusout` AND `click`. Tap works and is well-designed (tap-again toggles off;
   tapping a different term switches without a second tap). But it positions itself with
   `getBoundingClientRect()` + `window.scrollX/Y`, clamps only to `document.documentElement.clientWidth`
   — it has no notion of a bottom sheet, a virtual keyboard, or safe-area insets — and
   `window.addEventListener('scroll', hide, true)` means the tip vanishes on any momentum scroll.
8. **⚠ `cursor: pointer` / `cursor: help` / `cursor: not-allowed` communicate nothing on touch.**
   `.fs-lead` and `.fs-chip` (the shared food block, styled in `dashboard.css`) use `cursor: help` as the
   sole signal that a provenance gloss exists. `.wc-goal.is-full` uses `cursor:not-allowed` + `opacity:.4`
   to say "you are at the cap".
9. **⚠ FOCUS TRAP + FOCUS RESTORE assume a Tab key.** `PF_FOCUSABLE` cycling and
   `profileTrigger.focus()` are correct and must be preserved for keyboard/AT — but they are not the
   dismissal model a phone needs.
10. **⚠ `Enter` blurs the name field** rather than submitting (`profile.ts:551`). On a phone the
    virtual keyboard's "done" key must commit; a blur-only commit combined with a modal that can be
    dismissed without a blur is exactly the bug `unmount()` already works around
    (`nameEl?.blur()` before teardown — see the comment at `profile.ts:586`).
11. **No drag, no right-click, no multi-select, no precise-pointer requirement** anywhere in the
    shell / profile / welcome. That part is clean.

---

## Desktop-only assumptions

1. **`100vh` in six places.** `.app-shell{height:100vh}` plus `.app-rail`, `#drawer-knowledge-mount`,
   `.wc-veil`, `#drawer-search-mount.sr-open`, `.pf-overlay` are all viewport-height-locked. On a phone
   `100vh` is the *largest* viewport (chrome retracted) so the bottom is cut off while the URL bar shows.
   Same trap in cap form: `.pf-panel{max-height:calc(100vh - 96px)}`, `.scr{calc(100vh - 128px)}`,
   `.wc{max-height:90vh}`, `.rail-list{calc(100vh - 330px)}`, `.rc-pop{calc(100vh - 48px)}`,
   `.vd-lightbox__img{90vh}`. **`dvh` — or better, a shell that does not lock to the viewport — is mandatory.**
2. **`html, body { height:100%; overflow:hidden }`** — the document NEVER scrolls; `.app-workspace` is
   the only page scroller. This kills pull-to-refresh, overscroll bounce, and URL-bar auto-hide. It is
   also what makes `withScrollPreserved()` work. A mobile rebuild must decide this deliberately, not inherit it.
3. **`grid-template-columns: 220px minmax(0,1fr)`** — a permanent 220px vertical rail. 59% of a
   375px screen's width would be chrome.
4. **`#drawer-knowledge-mount.kd-open { left: 220px; width: 950px }`** with **no responsive override
   anywhere on `master`**. On a 375px phone the Knowledge drawer starts 220px from the left edge and
   extends ~795px off-screen. This alone accounts for "the knowledge tab just feels cheap".
5. **Topbar is a 3-column grid** (`auto | minmax(0,1fr) | auto`) whose middle column is a load-bearing
   empty `<span>`. `.np__deck` and `.np__name` are both `white-space: nowrap` — the Scanner deck is
   132 characters on one unbreakable line.
6. **`@media (max-width:560px)` sets `.topbar__breadcrumb { display:none }`** — the existing "phone
   fallback" deletes the only thing that names the current surface.
7. **`@media (max-width:820px)`** collapses the rail to a 60px icon column and hides
   `.rail__brand-name`, `.rail__brand-sub`, `.rail__section-label`, `.rail__label`, `.rail__kbd`,
   `.rail__profile-name`, `.rail__profile-meta`. Five abstract glyphs (`◉ ▤ ⌖ ⌕ ❡`) with no labels.
8. **`--ds-text-micro: 0.6rem` (9.6px) and `--ds-text-mini: 0.7rem` (11.2px)** are used pervasively
   (rail labels, eyebrows, kbd chips, meta rows, log entries). Both are below the ~12px legibility floor.
9. **`--ds-space-7: 2.5rem` (40px)** is the standard page / topbar gutter — 11% of a 375px screen *per side*.
10. **`.pf-grid: repeat(7, 1fr)`** — a 7-across avatar grid is a desktop measurement.
    **`.pf-data: 1fr 1fr`** — Export / Import side by side.
11. **`.pf-panel { width: min(600px, 100%) }` and `.wc { width: min(760px, 92vw) }`** are centred
    max-width cards, which is the one pattern here that *does* degrade sanely. They need room, not restructuring.
12. **Rail-collapse breakpoints are 1160 / 820 / 560px**, none of which is a phone-first boundary,
    and the `@media(max-width:1160px)` block styles `.topbar__sub`, **a class no markup emits** (an inert rule).
13. **Custom scrollbar styling** (`::-webkit-scrollbar`, 11px, accent-gradient thumb, `scrollbar-width: thin`)
    — invisible on iOS/Android overlay scrollbars.
14. **Two "unreachable by design" CSS blocks are still in the sheet**: `.app-footer` / `.footer__*`
    (the footer strip whose markup was deliberately removed) and `.telemetry__*`. The `.app-shell` grid
    still reserves a `footer` row. **Do not resurrect either** — the reasons are written in the file and
    are §00.B reasons: the app has no network and no backend, so a status/version/seal readout would
    assert a fact it cannot know.
15. **`prefers-reduced-motion` is honoured globally** in `design-system.css`. This must survive the rebuild.
16. **No `<nav>` landmark, no `aria-current`, no skip link.** The rail is `<aside>`, the topbar is
    `<header>`, the workspace host is `<main>`. Rail items are plain `<button>`s whose only active
    signal is a `.active` class. `design-system.css` declares **no global `:focus-visible`** — only
    `.rail__profile`, `.topbar__ask` and `.ui-close` have one.
17. **Decorative animations that assume a big canvas and an idle GPU**: `.ds-border-travel` (two 8s
    infinite travelling hairlines), `.app-rail::after` and `.app-topbar::after` (gradient hairlines with
    hardcoded `--ds-space-7` insets), `.topbar__ask-dot` (2s infinite pulse), `.pf-eyebrow .dot`
    (2.4s infinite pulse), `.pf-overlay` `backdrop-filter: blur(3.5px)`.

---

## Feature-preservation contract

A rebuilt mobile shell must satisfy every line. Numbered so a later audit can cite one.

**Navigation**

1. All five destinations reachable in one action from anywhere: Coverage, Regimen, Scanner, Search, Knowledge.
2. Exactly one overlay open at a time; opening one closes the others.
3. The active destination is visibly and programmatically indicated (`aria-current` or equivalent).
4. Every drawer / modal has a touch-reachable dismissal that does not depend on `Esc` or on a scrim strip.
5. The rail's derived active state survives closing a drawer from INSIDE it (subscribe to `drawer:toggled`).
6. `wallach:navigate {to:'coverage'|'regimen'|'scanner'}` still routes (call sites in Coverage:911,
   Knowledge:860 + 882, Regimen:1686).
7. `knowledge:open-entity {kind,slug}` and `knowledge:open-tab {tab}` still perform the single-drawer swap.
8. Per-workspace scroll position is remembered when switching away and restored on return
   (`scrollByView` in `main.ts`).
9. `withScrollPreserved()` still guards BOTH scrollers — the page scroller and the Daily Protocol rail
   (`[data-rail-list]`). Restored **synchronously**, never inside a `requestAnimationFrame`.
10. Keyboard shortcuts (`1`/`2`/`3`, `s`, `k`, `Esc`) are PRESERVED for any device with a keyboard, with
    the `typing` / modifier / modal-open guards intact — but the visual `kbd` chips do not ship on touch.
11. A workspace is mounted lazily on first visit and never unmounted on switch-away (`mounted` map).
12. The topbar name + deck are repainted on EVERY navigation (`setTopbarHeader`), so no surface inherits
    Coverage's title. The name must remain visible on a phone.

**Identity**

13. The name is rendered via `textContent` / `.value`, **never** `innerHTML`, in every slot.
14. `validateUserName` remains the second layer: bounded (40 backstop / 24 UI / 18 veil), single-line,
    no C0/C1 controls, no bidi overrides, no invisible-only names — and a rejection SHOWS ITS REASON.
15. The identity tri-state is preserved exactly: `null` → ask; `{browsing:true}` → never re-prompt;
    `{name}` → never re-prompt. Closing the first-run veil records a choice.
16. Four identity slots repaint from `profile:changed`: document title, brand slot, rail name, avatar.
17. The corpus count repaints from `corpus:hydrated` and shows the bare label — never `0` — before it lands.
18. All 25 bundled avatars remain selectable, in three families with an All filter and a derived count.
19. Upload still downscales to 256×256 PNG on a canvas before storage, with the 900 000-char backstop.
20. "Default — your initial" remains a way back to the auto avatar.
21. Guest vs signed-in is visible, and "Continue as guest" appears only while the name is empty.
22. `resetIdentity()` keeps theme, accent AND the regimen.
23. Focus restore on modal close (return focus to the opener, never to `<body>`) and focus-in on open.

**Appearance**

24. Both themes designed: `cream` (default) and `dark`. All 8 accents work in both.
25. `<html data-theme data-accent>` remains the single application point, stamped by ONE function.
26. The accent swatches read their colours from `--acc-<id>`; no hex is re-typed in a view.
27. Theme / accent are STYLE ONLY — they never change what a surface does or which data it shows.
28. Category colour-coding (minerals blue / vitamins orange / aminos green / omegas purple) is NOT
    touched by the accent system. Confirmed by the scope note at the top of `theme.css`.
29. The dark theme's rail re-pin (`theme.css:102`) exists because the rail's palette *is* inverted
    ink / paper. If the rail stops being a dark island, that block must be revisited, not silently inherited.
30. `prefers-reduced-motion` still collapses the motion tokens and animation durations.
31. `design-system.css` stays SEALED and unedited; any token change is a shadow from a later sheet.

**Data ownership**

32. Export produces `wallach-codex-backup-<date>.json` with the
    `{app:'wallach-codex', version:1, exportedAt, data}` envelope.
33. Import validates the envelope, refuses non-Codex JSON with a named reason, performs a TRUE replace
    (app-owned keys absent from the backup are removed first; an empty backup is a no-op), reports
    `skipped > 0` honestly instead of reloading into a half-applied state, and reloads on a clean restore.
34. Export / import scope stays the `wallach` / `rg` / `lc` key prefixes.
35. Every mutation still routes through the `state/profile.ts` chokepoint — no view writes localStorage.
36. Every write verifies its own round-trip and fails loudly.
37. The Creator's Log stays reachable from the profile surface, collapsed by default, all 931 entries,
    with the 10 kind labels and the ok / err pill colouring.
38. The web build's split-fetch waits (`SPLIT_DATA` → `loadSplit('creators-log-embed')`) stay in the open path.

**First run**

39. The veil asks ONCE, invites rather than gates, and always offers a way past.
40. Both required inputs (a name AND ≥1 goal) gate the primary button; the button states why by being disabled.
41. All 30 goals are offered, grouped by their 6 categories in first-seen order, with an unlabelled
    group as the fallback for a category-less goal.
42. The cap is 5 and is derived from `GOAL_HUES.length`; an at-cap chip stays clickable if already chosen.
43. A saved goal id the layout no longer defines is dropped on load, never carried.
44. The re-opened goal picker does NOT ask for or rewrite the name, and cancelling leaves goals untouched.
45. `+ ADD` in Coverage and Regimen still fires `wallach:open-welcome`.
46. Goal hues are assigned by PICK ORDER, and the picker shows the same hue the tiles will use.

**Craft floor**

47. Every interactive target ≥ 44×44 CSS px.
48. Safe-area insets honoured top and bottom (notch + home indicator).
49. No affordance depends on hover, `title=`, or a cursor shape.
50. At most ONE scroll region under the thumb at a time — the four-deep nesting in the profile panel is banned.
51. No text below 12px.
52. Icon-only controls carry an accessible name (the current `aria-label`s are a good baseline: close,
    upload, each avatar, each accent, Ask Wallach).
53. Real focus states — the rebuild owes the app a systemic `:focus-visible`, which it has never had.
54. Semantic landmarks: add the missing `<nav>`; keep `<header>` / `<main>`.
55. No emoji anywhere; icons stay inline SVG or typographic marks. (The rail's current glyphs
    `◉ ▤ ⌖ ⌕ ❡` are typographic, not emoji — but they are also not legible icons.)
56. The nav must sit ABOVE any full-screen overlay in z-order, or a user can enter a state they cannot leave.
57. No network at runtime: no CDN font, no remote avatar, no telemetry ping, no service worker.
    Everything inlines into the one IIFE bundle (NOT an ES module — `file://` has a null origin).
58. No fabricated chrome. No sync indicator, no version string, no seal hash, no readiness readout —
    the app cannot truthfully report any of them.
59. Coverage stays a MAP OF GAPS. Nothing in the shell may gamify it (no streak, no score, no badge,
    no progress ring in the nav).

---

## Open questions

1. **Where does the profile live on a phone?** The rail footer is the only entry point today. A bottom
   bar spending a fifth of its width on an unlabelled avatar was measured as wasteful on the discarded
   branch. Decision needed: fifth tab, topbar corner, or a "More" surface.
2. **Does the Ask-Wallach pill survive as a topbar element, or become the nav's centre action?**
   It is the app's most prominent CTA and it duplicates the rail's Search item. One of the two should go.
3. **Is `overflow:hidden` on `body` kept?** Keeping it means no pull-to-refresh and no URL-bar collapse
   (more stable, less native-feeling). Dropping it means re-deriving `withScrollPreserved()` and every
   `100vh` cap. This is a foundational fork and should be decided before any CSS is written.
4. **What replaces the 34px `.ui-close`?** It is *the* canonical close control app-wide
   (`dashboard.css:373`, used by the profile head, the veil, and drawer surfaces). Resizing it is a
   cross-surface change, not a mobile-local one.
5. **`--ds-text-micro` / `--ds-text-mini` are declared in the SEALED `design-system.css`.** They cannot
   be edited (golden hash, USER-WRITER-ONLY). Options: shadow them from a later sheet the way
   `type-futurist.css` shadows the font tokens, or stop consuming them on mobile. Needs a ruling.
6. **`--ds-font-display-interface` and `--ds-font-display-artifact` (Chakra Petch / Bruno Ace) are
   declared in `workspace-coverage.css` but consumed by the RAIL and the TOPBAR.** If a mobile rebuild
   splits the sheets, these two tokens must move to a shell-owned layer or the nav loses its faces.
7. **Is `#palette-mount` intentionally reserved, or dead?** No JS references it. If dead it should be
   deleted rather than carried into a rebuild.
8. **Does "Reset identity" need a confirmation on touch?** It is a full-width danger button with no
   undo, one mis-tap away from the avatar grid. Desktop got away with it; a thumb probably should not.
9. **Are the rail glyphs (`◉ ▤ ⌖ ⌕ ❡`) keepers?** They are typographic marks, consistent with the
   no-emoji rule, but none reads as "Coverage" or "Regimen" without its label. Drawn inline SVG icons are
   permitted by the constraints and would be legible at 24px.
10. **Does the arrival veil become a full-screen flow (a real onboarding) or stay a card?** At 375px the
    card's primary action was measured **751px below the fold** with 876px hidden inside its own scroller.
    Two legitimate answers; this inventory does not pick one.
11. **How does the Knowledge drawer present on a phone at all?** `left:220px; width:950px` has no mobile
    answer that is a tweak. Its interior is another agent's inventory, but the SHELL must declare what
    kind of container it hands over: full-screen sheet, stacked page, or bottom sheet.
12. **Is the 930-entry Creator's Log a phone surface at all?** It is a 2.67 MB build artifact rendered as
    931 `<article>`s inside a modal. It may belong behind a deliberate "open the log" destination rather
    than inside the identity panel.

---

## Prior art (recorded, NOT a spec)

The discarded `mobile-responsive` branch (`dashboard/assets/styles/mobile.css`, 523 lines) is being
thrown away per the owner's instruction. Its **measurements** are worth keeping; its **design** is not:

- Six elements measured viewport-height-locked; six `max-height` caps written against `vh`.
- 225–430 sub-12px text nodes measured on every surface, root-caused to two tokens.
- "KNOWLEDGE" measured clipped by 8px at 0.58rem in a five-across bar at 375px; needs ~73px of label.
- The arrival veil's Enter button measured 751px below the fold at 375px, with 876px hidden in `.wc`.
- A bottom tab bar with 5 items (Search deliberately excluded as an ACTION, not a PLACE) was **chosen by
  Luneth on 2026-08-22** from three shells driven on a phone viewport — and the whole mobile app was then
  rejected. Treat the bar as a rejected-in-context precedent, not a settled decision.
- `mobile.css` styled `.wc__card`, a class `views/welcome.ts` never emits — a dead selector, and a
  reminder that a retrofit sheet drifts from the markup it is shadowing.
- The branch's probes (`tools/probes/mobile_audit.js`, `mobile_css_scan.js`, `render_probe_mobile.js`)
  are the instruments that produced these numbers. Memory records that the gate "passed all 6 surfaces
  and was not the question" — a green mobile gate is not evidence of a good mobile app.
