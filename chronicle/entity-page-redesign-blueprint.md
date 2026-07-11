# Entity-Page Redesign — Demo-Phase Blueprint

_A TEMPORARY, living record of the UI/UX redesign **demo phase** (opened 2026-07-10). It captures the vision, the demos, and every design decision so nothing is lost between sessions._

**Relationship to the master plan.** This is deliberately SEPARATE from `chronicle/OVERHAUL-BLUEPRINT.md`. That is the master plan; this is the design-exploration record that will FEED the master plan's **Phase H** once all demos are approved. Luneth's call (2026-07-10): "no blueprint quite yet until we get all of our demos right" — so the main unified blueprint is deferred; this bridges the gap.

**Prose-containment (why this is safe).** This doc is prose-heavy by nature (design rationale) — unavoidable, and FINE. It lives in `chronicle/`, the sanctioned narrative home, which `prose_contained` (R4) never scans. The demo prototypes live in gitignored `temporary/`. Neither ever touches a pillar fact-field, an `assets/data` artifact, or app code — so this prose is contained to the building process and can never poison the corpus, the gates, or the shipped app. If this file and the eventual master blueprint ever disagree, the master wins.

---

## 1 · The problem that started this
Luneth's tension: **Search feels delightful; the rest of the app feels like an ignorable wall.** He was torn — tempted to move EVERYTHING into Search, but worried that (a) noise would bury the good stuff, and (b) it would kill browsing/discovery (a delight in itself). Unresolved questions: what is Search FOR vs the Knowledge drawer (essentials/conditions)? Where does the full 1,246-claim database live, and how is it enjoyable to consume instead of "a massive unorganized list no one bothers checking"? He asked for a fresh, cohesive plan and explicitly told me NOT to defend the old ways.

## 2 · The reframe (the key insight)
It is **not "Search vs the Knowledge drawer."** Search feels better only because it has two things the drawer lacks: (1) a great **presentation format** — quick answer → facets you choose to open → verbatim/citation on demand → branching links; and (2) **curation** — a manageable landing, not everything at once. The essential/condition pages feel bad because they DUMP everything flat with no hierarchy. Same data, opposite experience.

**The fix:** take what makes Search delightful — the **entity-page format** — and make it the universal way we present ANY subject. Generalize the format; do NOT delete the drawer.

## 3 · The mental model (makes the whole app cohere)
- **One content layer** — the sealed pillars. Claims are atoms. Unchanged.
- **One presentation unit — the entity page.** Every subject (essential, condition, element, product, topic) renders the same delightful way.
- **Access is separate from presentation; three ways in:** Search = the universal front door (type anything, always a real result) · curated browse = the discovery storefront (preserves scroll-and-discover) · branching chips = the rabbit hole.
- **Two intents, one format, different emphasis:** *exploring* (topics/elements/essentials lead with delight) vs *help-now* (conditions lead with the protocol).
- **The flat claims-dump is gone.** Claims only ever appear INSIDE a subject, behind progressive disclosure. There is no standalone "list of all claims" surface.

Answers to Luneth's direct questions: **Search** = the access layer (the hallway), not a content silo — every condition/essential/topic is reachable by plain query, nothing comes back empty. **Conditions / Essentials tabs** = curated browse surfaces (the rooms) into the SAME entity pages. **The full claims DB** = tucked inside each entity page (the "full record" drill-in), never front-loaded.

## 4 · The demo roadmap
Prove the vision with real demos BEFORE writing the master blueprint. Each demo proves one load-bearing part.

| Demo | Proves | Status |
|---|---|---|
| **D1 · Essential page** (Calcium) | the entity-page format for the EXPLORE intent | ✓ signed off |
| **D2 · Condition page** (Osteoporosis, help-first) | the HELP-NOW intent; the format works on tier-1 claims (no search Q&A) | ✓ signed off |
| **D3 · Knowledge-drawer overhaul** | the browse/navigation model, re-housed as a total overhaul of the KNOWLEDGE drawer — NOT a layout change (see §8.5) | in progress |
| **D4 · Coverage dashboard** | the operational home (the 90-essentials periodic table) handing off into essential pages | pending |
| **D5 · Product page** (optional) | the entity format for a Youngevity product — the "best sources" click target | pending |

Then → the **unified master blueprint** (codifies format · flows · each surface's role · migration) → **build for real** (this whole effort is the design spine of OVERHAUL-BLUEPRINT **Phase H**; the book-mining Phase G continues independently). Sign off each demo before advancing (visual-verification gate).

## 5 · The entity-page format (the UNIT — locked by D1 + D2)
Anatomy, top → bottom:
1. **Hero** — a symbol/icon tile + name + a mono meta line + a one-sentence plain-language answer.
2. **Operational "help" card** — the always-in-the-same-spot facts.
   - ESSENTIAL: Wallach daily target (+ a "why this number?" gloss tooltip) · a coverage example · best product sources.
   - CONDITION: the protocol ("the approach" callout) · the involved nutrients · best products for it.
3. **Faceted claim sections** — collapsible, colour-coded groups of claim cards. A card = a summary line → (search-enriched adds a quick-answer lead) → full answer + Wallach verbatim + composed citation (+ #topic tags where enriched).
4. **Branching** — related chips (colour-coded by kind).
5. **Progressive disclosure** — big pools are folded ("show all N", the "full record" drill-in with a filter). Nothing is deleted; only tucked. This is the resolution to the noise-vs-completeness tension: all data present, almost none loud.

**Intent shapes the emphasis, not the skeleton.** Explore-intent (essential) curates a small delightful set on top and TUCKS the 102-claim reference behind the full-record. Help-intent (condition) puts the protocol first and shows the 33 claims AS the main content (role-grouped, the useful ones open) — because a condition's claims ARE the help.

## 6 · The colour language (LOCKED)
Category families, driven by the app's OWN `--sr-facet-accent` variable so Search inherits the same coding for free:
- **teal** = the science (physiology · mechanism · definitions · diagnostics · interactions)
- **orange** = Wallach's positions (stance · big-question · prevalence · prognosis) — **reserved for the most important; used sparingly**
- **green** = what to do (protocol · dose · works-with nutrients)
- **amber** = signs (deficiency-signs · toxicity)
- **violet** = story / lore (history · etymology · discovery) — the "delight" colour
- **red** = cautions (contraindications — "avoid this")

Applied as: a subtle 4px left colour-bar on each claim card · colour-coded section markers + count pills · tinted collapsed group headers (the full record). **Pills:** conditions = orange · works-with (nutrients) = green · keep-exploring = violet.

Two hard rules learned during D1:
- **Orange body-TEXT must be the DEEP orange (`--ds-accent-deep`), never the bright `--ds-accent`.** Bright orange as text is too hot to read; bright orange stays for bars/borders only. (The `?` badge on orange cards is also the deep orange, matching its lead.)
- **An opened card wears its OWN family colour, not the global orange.** The app's `.sr-claim[open]` rule forces orange; we override border/badge/verbatim-rule/citation to `--sr-facet-accent` so a teal card stays teal when opened, etc.

## 7 · D1 — Essential page (Calcium) · SIGNED OFF
Subject: Calcium (essential · 102 claims · 5 books). Layout:
- **Hero** — Ca tile + one-liner.
- **"At a glance" card** — Wallach target **1,500 mg** (why-number gloss → Epigenetics 2014, weight-scaled; older LPD 1995 = 2,000 mg kept for context) · coverage example (80%, illustrative) · **best sources** (5 shown; best-value tag on lowest price/mg; expand to all 53; rows are clickable product items).
- **"Worth knowing"** — the 8 SEARCH-ENRICHED claims, grouped by facet (In the body · How it works · Wallach's stance · History & lore), colour-coded, expandable (quick answer + verbatim + citation + #tags).
- **"Need help with a condition?"** — 108 condition pills (orange), 12 shown + expand.
- **"Works with"** — 41 nutrient pills (green), 12 + expand.
- **"The full record"** — all 102 claims, drilled in by kind, **default-expanded**, with an obvious accent-bordered **filter box** (magnifier icon, sans placeholder) and **tinted colour-coded group headers**.
- **"Keep exploring"** — violet pills.

Refinement arc (what got us here): v1 over-designed (hand-rolled CSS drifted from the app) → v2 rebuilt on the REAL app stylesheets + `.sr-*` classes → v3 added the colour families + tinted group headers + best-value + 5-item default → v4/v5 reverted the too-bright orange text, made the filter obvious, made "show all" expand IN-PLACE (no off-page arrows), full-record default-expanded → final: clickable product rows.

## 8 · D2 — Condition page (Osteoporosis, help-first) · SIGNED OFF
Subject: Osteoporosis (condition · 33 claims · 6 books). Same skeleton as D1 but re-ordered for HELP-NOW:
- **Hero** — pulse-icon tile + one-liner (Wallach's framing: a nutritional-deficiency disease, preventable/reversible, not inevitable aging).
- **"Wallach's protocol" card** — a green **"the approach"** callout (Calcium 2,000 + Magnesium 1,000 mg first 30 days · boron/strontium/trace minerals · vitamins D & K · betaine HCl + pancreatic enzymes before meals · avoid fluoride) · **16 nutrients to restore** (green pills; canon vitamin names HUMANISED — Cholecalciferol→Vitamin D etc.) · **best products** (honest threshold: each covers **8+ of the 16** involved nutrients → 19 qualify; 5 shown + best-value tag + expand; clickable).
- **"The full picture"** — role-grouped claim sections in help-first order, colour-coded: What to do (green, open) · Why it happens (teal, open) · Warning signs (amber) · Wallach's take (orange) · Cautions (red) · Reference (teal). Cards use the plain-language `claim_text` → full text + verbatim + citation.
- **"Related conditions"** (orange) · **"Keep exploring"** (violet).

Key finding: **tier-1 claims have no search-style Q&A** (question/answer_short) — those exist only for search-enriched entities. The page works great anyway using the claim's own plain-language `claim_text` as the answer. So the entity-page format does NOT depend on search enrichment — important for how much authoring the real build needs.

## 8.5 · D3 → the Knowledge drawer + ONE unified search (CONVERGED 2026-07-10)
_Supersedes the earlier "full-screen master-detail" idea, which Luneth rejected. That demo (`temporary/knowledge-workspace-prototype.html`) was DELETED. The three surviving prototypes are `browse-shell-prototype.html` (the LOVED inner design) + `essential-page-prototype.html` (D1) + `condition-page-prototype.html` (D2)._

**The arc — so we never re-derive it:**
- **Pass 1** (`browse-shell-prototype.html`) — a standalone search-first app *home* with a top-nav. Rejected as a **layout** change, BUT its inner presentation (a simple, inviting Home "taster" + Essentials / Conditions / Explore browse + a live-suggest search) is **LOVED** and becomes the basis.
- **Pass 2** (full-screen Knowledge workspace, master-detail) — rejected: "designed for a drawer, never considered full-screen," dead space, less cohesive than the live app. DELETED.
- **Converged:** keep the current app layout; **Knowledge stays a DRAWER, widened 420 → 900 px**, adopting the browse-shell inner design; **ONE consolidated search** ends the two-search weirdness.

**Locked decisions:**
1. **No layout change.** Rail + drawers stay. Knowledge = a slide-in drawer at **900 px** (NOT full-screen, NOT master-detail).
2. **Knowledge drawer = 5 tabs** (browse-shell inner design, re-housed): **Home** (the inviting "what are you here for" taster) · **Essentials** · **Conditions** · **Explore** · **Products**. Tab buttons restyled for the drawer/popout; the in-drawer top search is **removed** (search is consolidated, below). **DROP Corpus** (books — redundant + a legal-pass liability) and **Doctrine** (try-hard, pointless to surface).
3. **ONE search, not two.** Merge "Search" + the Knowledge search into a SINGLE command-palette surface (the `command-palette-v3-PROPOSAL.html` pattern): one input, results SPLIT — **Jump to** (entities: essentials/conditions/topics/products — the live-suggest Luneth loves) + **In the books** (claims / curated Q&A). Rename the **Search** rail item → **"Ask Wallach."** It is HONESTLY a retrieval search (type → land on the page/claims), NOT a generative AI.
4. **Generative "Ask Wallach" is SHELVED (feasibility).** A local LLM = 0.5–2 GB → kills portability (350 MB budget). Embeddings retrieval needs a ~50–90 MB runtime model and still only RETRIEVES. So: no generation. Retrieval QUALITY is improvable with BOUNDED work — entity-first ranking + synonym/alias tables + field-weighted scoring (name > condition > claim body; exact > prefix > substring > fuzzy). The "testosterone → homosexuality" miss is a ranking bug, fixable structurally, not per-phrase. Reconciles [[ask-wallach-search-vision]].
5. **Search and Browse are COMPLEMENTARY, not redundant** (Wikipedia: search + portals; Spotify: search + Browse). Search = "I know what I want" (fast lane); Knowledge browse = "show me around" (Conditions = structured, Explore = serendipity). They share the SAME entity pages (D1/D2) and cross-link. **The elegant fold that resolves the future redundancy:** the search's ZERO-QUERY state = the discovery taster (Explore topics + common conditions), so search and the inviting Home become one surface; typing flips to retrieval.
6. **Never "91."** The Essentials tab reads **"Essentials"** (no number); any count says **"90."** Data keeps omega-9 as the 91st per [[essentials-authority-graphic]]; the user-facing label is ALWAYS 90.
7. **Fix the serif mismatch** — condition/entity NAMES currently use `--ds-font-serif`, which reads foreign; use the interface font so nothing looks out of place.
8. **Products** stays a tab (the click target from condition/essential "best sources"), but its DETAIL needs an overhaul to the clean/friendly browse-shell vibe ([[product-detail-panel-vision]]). Possibly temporary (legal), but a lower concern than the books.

**Phases (of this demo-phase blueprint; each built to a visual sign-off gate):**
- **P1 — the 900 px Knowledge drawer:** re-house browse-shell as a slide-in 900 px drawer with the 5 tabs, no in-drawer search, serif fix, 90-not-91. Reuse the real drawer chrome (`drawer-knowledge`/`drawer-shared`) where it helps.
- **P2 — the unified "Ask Wallach" search palette:** the `command-palette-v3` pattern — empty-state discovery + typed split results (Jump to / In the books) + the ranking/synonym upgrades. Reframe the Search rail item.
- **P3 — Products detail overhaul:** the product page re-skinned to the browse-shell vibe.
- P1–P3 all open the SAME signed-off entity pages (D1 essential / D2 condition).

Impl target when built for real: `dashboard/assets/js/src/views/knowledge.ts` + `drawer-knowledge.css` (`kd-*`) + the search view.

## 9 · Technical approach (how the demos are built)
- Prototypes are **self-contained HTML in gitignored `temporary/`**, opened from `file://`. They **link the app's REAL stylesheets** (`dashboard/assets/styles/design-system.css` + `drawer-search.css`) and reuse the actual `.sr-*` classes, so cohesion is structural. New pieces use an `ep-*` namespace + design tokens only. Chakra Petch (the interface font) is `@font-face`d locally.
- Data is 100% REAL, extracted from the shipped artifacts (`corpus-embed.json`, `essentials-targets-data.json`, `product-recommender-data.json`, `product-detail-data.json`, `search-index.json`) via throwaway python — no faked content.
- **D2 splices D1's exact `<style>` block**, so a shared-style change updates both pages at once.
- Verified headless with puppeteer (from the repo `node_modules`, via `NODE_PATH`) + full-page screenshots at every step.
- **Files:** `temporary/essential-page-prototype.html` (D1) · `temporary/condition-page-prototype.html` (D2). Gitignored, self-contained, reopenable next session.

## 10 · Open questions + deferred follow-ups
- **Loose/stretched claims** — some claims map loosely to a category (e.g. a fluoride-dose claim landed under osteoporosis "what to do"; a neuropathy claim under "why it happens"). Agreed (Luneth): a **later data-cleanup pass** refines category fit so every category holds only well-fitting claims. This is mining/quality, done ONCE, not per-page.
- **Product-DB linking** — product rows are styled clickable (icon + hover + chevron); in the real build each opens the product-detail page (the product-detail-panel vision). Wire in Phase H.
- **Claim badge on statements** — tier-1 cards reuse the app's `?` badge, which reads slightly odd on non-question statements. Decide during build (leave, or a neutral mark for non-Q&A claims).
- **Coverage math** — the "your coverage %" on the essential card is an illustrative placeholder; wire to the real regimen state in Phase H.
- **Coverage-count data gap** — a condition's "covers N/16" counts only the involved nutrients that HAVE recommender data (14/16 for osteoporosis; germanium + tin have none). Directionally honest; revisit if it matters.

## 11 · Next (resume in a NEW session)
**D3 (Knowledge-drawer overhaul — 900px drawer (NOT full-screen), browse-shell inner design; §8.5)** → D4 (Coverage dashboard) → D5 (Product page) → then the **unified master blueprint** → then build (Phase H). D1+D2 signed off; D3 in progress — NO layout change (left rail stays).
