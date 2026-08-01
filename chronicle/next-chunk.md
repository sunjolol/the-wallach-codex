# Next chunk — ★ AUTHORITATIVE HANDOFF (set 2026-08-01; element #6 vitamin A — DESIGN FINALIZED as r7, READY TO PORT LIVE)

# ⚠ HOW THIS SESSION STARTS
Luneth types `genesis` HIMSELF in a NEW session; Claude runs `tools/genesis.py` ONLY in response. After the
report, ask what to resume. The next task is: **PORT r7 LIVE.**

# ★★★★★ READ FIRST — THE ONE THING THAT MUST NOT BE LOST
**THE FINAL, USER-APPROVED vitamin A header design is `temporary/vitamin-a-header-r7.html`.**
- It is **NOT r6**. It is **NOT** any earlier round (r2–r6). r6 was "Form A only"; **r7 = Form A + the Egyptian
  curio + ~7 rounds of Luneth's tweaks on top.** Ignore every earlier "approved/final" mention — **r7 supersedes
  all of them.** (This exact failure — a port session grabbing a stale round — is the thing Luneth called out.)
- The file is **committed to git** (force-added past the `temporary/` gitignore) AND on disk. **Open it and read it
  byte-for-byte before touching anything.** It is the SPEC. Do NOT redesign, "improve", regenerate, or second-guess
  it — **PORT IT FAITHFULLY** ([[signed-off-demo-is-the-spec]]). Every pixel + word survived Luneth's review.
- Headless render + verify tooling that WORKS: `temporary/... /scratchpad/verify_r7.js` pattern (the in-app Browser
  pane stopped syncing new files mid-session; puppeteer at repo-root `node_modules/puppeteer` is reliable — use it).

# ★ WHAT r7 IS (full spec, captured here so it's recoverable even without the file)
Category = **vitamin (orange `#ff7e3c`)**. Structure, top → bottom:
1. **Eyebrow:** `One vitamin · two very different forms`
2. **Kill:** `A carrot doesn't hand you vitamin A — only the raw material.` (ONE line — do not let it wrap)
3. **Two comparison cards, equal height, side by side** (the "trade-off"):
   - **β-carotene card** — kicker `what a carrot's label calls "Vitamin A"`; big **`Vitamin A*`** (strikethrough,
     ink-faint, accent strike); fine `* really β-carotene — a precursor, not the vitamin.`; then PRO then CON:
     - **＋ Safe to mega-dose** — it's an **antioxidant** in its own form, so overdosing becomes nearly impossible.
     - **－ Less convenient daily** — your **liver** must convert it first (needs **zinc**), a less direct way to hit your target.
   - **retinol card** — kicker `in liver · butter · egg`; big **`Vitamin A ✓`**; fine `The active form — retinol.`; PRO then CON:
     - **＋ Ready to use** — the active form, so it's the direct way to hit your daily target.
     - **－ Toxic in excess** — above about 50,000 IU a day, kept up over time.
4. **`IN PRACTICE`** section-label, then explainer callout (orange left-border box):
   `Not better vs. worse — a difference in job. Because you almost can't overdose on β-carotene, it's the form
   Wallach doses at pharmacologic extremes — 300,000 IU, even 600,000 with vitamin E — to treat disease. Retinol
   turns toxic past ~50,000 IU, so it stays at everyday maintenance amounts — the small dose that meets your daily target.`
5. **`DID YOU KNOW?`** section-label, then the Egyptian curio box — headline
   `A cure that arrived four thousand years early`, then body:
   `Around 2000 BC, Egyptian healers treated night blindness by pressing beef-liver juice onto the eyes — and it
   worked. Four thousand years later we learned why: the liver is where the body stores vitamin A, and the eye is
   the first thing to fail without it. Which is the strange part. The remedy runs straight from the body's vitamin-A
   store to the exact organ that fails first — and they laid it *on the eye itself*, rather than consuming it. How a
   people with no way to see any of that arrived at so precise an answer, the cure does not say. It reads less like
   something worked out than something handed down — complete, and already correct.`
   cite line: `Egyptian cure & vitamin-A liver storage — Wallach, Epigenetics (2014)`
6. **Pull-quote** (`.ds-pull-quote`, display-italic, `.ds-mark` on the highlighted phrase, composed cite — NEVER a
   raw `WAL-CLM-…` id): `Night blindness is caused by a vitamin A deficiency which can be… zinc deficiency which
   results in [mark]poor conversion of carotene to vitamin A by the liver[/mark].` — Dr. Joel Wallach · Dead Doctors Don't Lie (3rd ed. 2011)
7. **Note:** `A plain-language summary of Wallach's mechanism, drawn from his sealed books; his exact words appear in the quote above. General education, not medical advice.`

## r7 typography / CSS (the values Luneth tuned by hand — reproduce exactly)
- **Chapter labels** (eyebrow + `IN PRACTICE` + `DID YOU KNOW?`): mono, **.79rem, weight 600, letter-spacing 0.09rem**, uppercase, orange (`--kd-ep-fam`). (The eyebrow is a DEMO OVERRIDE of the live `.kd-ep-fam__eyebrow`, which is normally 0.7rem/400/`--ds-track-wide`.)
- **Kill:** `--ds-font-display` (Unbounded), `--ds-text-lg`, 700, **line-height 1.12** (the live value — do NOT change), letter-spacing -0.02em; **margin: `calc(var(--ds-space-1) + 5px)` top / `20px` bottom** (a demo override of the live kill margin, to give it room).
- **Cards** `.mkA-card`: 1px `--ds-rule` border (retinol card border = accent-tinted), radius 13px, padding 18/20/20, bg `--ds-paper-light`, flex column, **grid `align-items: stretch` → equal height**.
- **Big label** `.mkA-big`: display 1.9rem/700; `--muted` = `--ds-ink-faint` + line-through (accent 65%, 2.5px).
- **Pro/con** `.mkA-pt`: chip = 21×21, radius 6, FILLED, white 800 display .95rem — **PRO chip `#2f7a33`, CON chip `#b0442e`**; `.mkA-pt__lead` = bold, PRO text `#2f7a33` / CON text `#b0442e`; body `.mkA-pt__txt` = sans **0.9rem**, dark `--ds-ink`. **PRO row before CON row on both cards.**
- **Explainer** `.mk-explain`: margin 13/0/2, padding 13/17, border-left 3px accent, bg accent-6%+paper-light, radius 0 9 9 0, sans `--ds-text-sm`/1.6.
- **Curio** `.mk-curio`: margin-top 24, padding 20/22, 1px `--ds-rule`, radius 13, bg ink-4.5%+paper-light. Head = display `--ds-text-base`/700. Body = **sans (`--ds-font-sans` / Space Grotesk) 0.91rem/1.68** (ID-scoped `#drawer-knowledge-mount .mk-curio__body` to beat the drawer's paragraph rules). Cite = mono .66rem uppercase faint.
- **Colors:** pro green `#2f7a33`, con rust `#b0442e`, category orange `#ff7e3c`.
- **⚠ FONT-VARIABLE TRAP:** `type-futurist.css` remaps BOTH `--ds-font-serif` AND `--ds-font-serif-light` to Space Grotesk (sans). Real serifs (`Merriweather`/`Crimson Pro`/`Playfair Display`) are loaded as @font-face and must be named DIRECTLY. (r7's curio body is sans, so this doesn't bite it now — but note it: an earlier round's "serif lore voice" silently rendered sans because of this. Luneth chose sans.)

# ★ CONTENT RULINGS FROM THIS SESSION (must persist — these are hard-won)
- **Egyptian date = 2000 BC** (Luneth ruling). The corpus contains BOTH: `EPIGEN-000167` says "1,000 BC" (and is the only claim with the "applied to the eyes and faces" detail); `EPIGEN-000214` says "2000 BC". **Use 000214 for the displayed date + any pull-quote; use 000167 only for the "applied to the eyes" fact.** Never surface the 1,000 BC number.
- **β-carotene is NOT "just inferior" — it's a TRADE-OFF** (Luneth caught the logic error): β-carotene is the pharmacologic / MEGA-DOSE form (safe at extremes, an antioxidant); retinol is the ready MAINTENANCE form (toxic if pushed high). The β-carotene downside is *maintenance convenience* (needs conversion), NOT that it's a worse disease fix. Do not re-introduce "less reliable fix for a deficiency" phrasing.
- **The Egyptian curio is a SUBTLE mystery.** The suggestion (knowledge "handed down / complete, already correct" — i.e. inherited from an earlier source) is carried ONLY in tone. **NEVER state spirits, Nephilim, pyramids, aliens, or older civilizations.** Luneth's intent is a hint only someone already thinking that way would catch. Keep the exact wording. No "trial and error" framing.
- **No "plate" language** anywhere front-facing ([[no-plate-diet-language]], new this session). Use "diet"/"consuming".
- **§00.A honest gap (do NOT fill it):** the "once you have enough retinol, the body stops converting β-carotene and uses it as antioxidant as-is" mechanism is NOT in the corpus. It was deliberately left out. Do not add it under Wallach's name.

## §00.A sourcing map (every fact → its Wallach claim id)
- two forms / precursor / retinol = active: `EPIGEN-000213` · `EPIGEN-000214` · `EPIGEN-000031` · `EPIGEN-000175`
- liver converts carotene, needs zinc (= the pull-quote): `DDDL-000165`
- β-carotene IS an antioxidant: `IMMORT-000249` (Blue Zones) · `HELLS-000053` / `RARE-000336` (antioxidant trio)
- almost impossible to OD on β-carotene: `DDDL-000056` (also `LETS-000178`)
- retinol toxic > ~50,000 IU sustained: `EPIGEN-000217`
- pharmacologic dosing (300,000 IU as β-carotene; 600,000 with vit E): `LETS-000071` (Base Line "pharmacologic dose") · `DDDL-000167` / `LETS-000196`
- retinol maintenance 2,500–5,000 IU (+ β-carotene 5,000–25,000): `EPIGEN-000110` / `EPIGEN-000111`
- Egyptian cure to the eyes ~2000 BC + stored in liver of all species: `EPIGEN-000167` + `EPIGEN-000214`
- eye fails first (night blindness = first sign): `DDDL-000041` · `DDDL-000165` · `EPIGEN-000031`
- richest food source beef liver (43,900 units): `IMMORT-000285` — NOT used in r7; if ever surfaced, verify the number against the Immortality food-table image first ([[say-unreadable-never-guess]]).

# ➡ THE TASK: PORT r7 LIVE (this is real engineering, not a copy-paste)
r7's Form A uses CUSTOM UI patterns that do **not** exist in the shipped component system: the pro/con chip cards
(`.mkA-*`), the `.mk-explain` callout, the `.mk-curio` block, the `.mk-section-label` chapter labels. Porting =
building these into the real pipeline properly. Read `.claude/rules/element-headers.md` in full FIRST. Scope:
1. **This is NOT a standard composed-blocks mechanism figure.** The two-card comparison + explainer + curio don't
   map onto the existing `blocks[]` vocabulary (`eyebrow/kill/opener/figure/prose/split/beats/stat/quote`). Decide:
   extend `MechBlockSchema` + `renderMechBlocks` with new block types (a `compare-cards` block, a `callout` block, a
   `curio` block), each shipping its render case together or `mechanism_blocks_wellformed` reddens. This is the bulk
   of the work.
2. **Prose → the content store (R4 / `views_no_inline_prose`).** ALL editorial text (kickers, fine lines, pro/con
   leads+bodies, explainer, curio prose, headline) lives in `mechanism-clarity-data.json` (or the prose store), never
   inline in the view.
3. **Quotes pulled BY CLAIM ID at build (R3).** The pull-quote = `DDDL-000165`; curio facts anchor to
   `EPIGEN-000167`/`000214`. Never hand-type verbatim into the view.
4. **CSS → `drawer-knowledge.css`.** Add the `.mkA-*` / `.mk-explain` / `.mk-curio` / `.mk-section-label` vocabulary
   (reuse before adding). Mind the ID-specificity cascade (element-headers Rule 2) and the font-variable trap above.
5. **`entity-copy.json` needs a `vitamin-a` entry — STILL TODO (gated by `element_header_complete`):**
   - `lede` (opening line above "At a glance", must NOT restate the kill): draft from `EPIGEN-000213`/`000031`
     (vision + night vision, skin + mucous membranes, bones/teeth, lowers epithelial-cancer risk).
   - `why` (daily-target provenance): vitamin A's maintenance target ≈ **5,000 IU** (Base Line True Supplement Need,
     `LETS-000071`; cf. `EPIGEN-000110` retinol 2,500–5,000). Confirm what `essentials-targets-data.json` actually
     carries for vitamin-a + write the `why` off the documented transform chain.
6. **⚠ Shared-class overrides:** r7 overrides the LIVE `.kd-ep-fam__eyebrow` (font-size/weight/letter-spacing) and
   `.kd-ep-fam__kill` (margins). Changing the SHARED classes would alter the **5 already-shipped headers**
   (sel/cu/zn/ca/mg). **Scope these to vitamin A** (or confirm with Luneth) — do not silently restyle the shipped headers.
7. Per-element **render probe** (copy `render_probe_copper.js`) + a **regression pass on a shipped element**. Then
   build → invariants → **STOP for Luneth's full-page visual sign-off** (screenshot the WHOLE page, not element-only)
   → round-close.

# STANDING DOCTRINES (unchanged)
1. Every claim lives in ONE of three homes; search is a retrieval layer. 2. Diet not food; no "plate" language.
3. NEVER fabricate — verbatim ⊆ sealed book (by claim id) or GAP. 4. corpus_seal / catalog_seal are USER-ONLY.
5. A DOM probe is NOT a visual check — screenshot the FULL PAGE and STOP for his eyes. 6. NEVER build live without
his explicit permission ([[never-build-live-without-explicit-permission]]) — he HAS now authorized the r7 live port.
7. Small, reviewed increments — he tweaks a lot; expect it and keep each step verifiable ([[small-batch-build-test-log-mandate]], [[measured-change-not-extremes]]).

# OPEN DEFERRALS
- `MEMORY.md` index is ~195 lines — a `/consolidate-memory` pass is overdue (flagged repeatedly).
- Element headers remaining: **84 of 90** (selenium · copper · zinc · calcium · magnesium shipped; vitamin A design
  DONE as r7, awaiting live port).

**Board (session close) 80/80 · corpus UNCHANGED (no seal this session) · nothing live touched. r7 is the final
approved vitamin A design — port r7, NOT r6.**
