# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-24 · Foods §04 redesign APPROVED · next = bring it LIVE)

# ★★★★★ READ FIRST: **Foods §04 is now APPROVED (design).** After the three failed iterations, a from-scratch redesign was built as demos, reviewed, and signed off by Luneth. The **approved spec** is committed at `dashboard/components/knowledge-foods-sec04-PROPOSAL.html` (open it via file://; it links the real stylesheets). The LIVE `knowledge-foods.ts` §04 is still the OLD inferior version — the next job is to **replace it with the approved design.** Working demos also persist (gitignored) in `temporary/`: `foods-sec04-redesign-demo.html` (the 4 explored variations), `ultimate-enzymes-cta-demo.html` (CTA + proof), `foods-sec04-combined-demo.html` (= the approved spec, with a live Rich/Lean bar toggle).

## ✅ APPROVED §04 DESIGN — what it is
A single, well-spaced section (generous `--ds-space-9` between beats). **Header is kept verbatim** — "You can't absorb what you can't break down" (the one thing Luneth liked in the old version). Flow, top → bottom:
1. **Lede** — the pH-1.0 framing ("your stomach is meant to be the most acidic place in your body").
2. **The pH Ladder** (the hero device, all of variation "B") — a vertical pH scale with stomach acid plotted at 1.0, a blood reference band at 7.36–7.44, pancreatic juice at 8.2 + a "why 1.0 is non-negotiable" triad.
3. **The Fortress scene** (grafted from variation "D") — the "picture your stomach as a fortress with an acid moat" lede + a two-panel cutaway (full-strength vs. breached) + a legend. The ladder is the *gauge*; the fortress is *peering inside*.
4. **The inversion** — a warn callout: heartburn is usually too *little* acid, not too much.
5. **ONE `.ds-pull-stat` kill-shot** — 75% of over-50s need supplemental stomach acid. (The old §04 wrongly stacked two pull-stats; the redesign obeys one-per-surface.)
6. **A Wallach `.ds-pull-quote`** — the "sterile" verbatim (DDDL-000132), Playfair via the `kd-foods-pq` carve-out.
7. **The Ultimate Enzymes CTA** — "put it into practice": a 5-stage coverage strip → a Wallach proof-quote → a wide orange CTA bar (RICH treatment chosen; a Lean variant is built + a one-attribute swap) → a value footnote.
8. **The full record** — the shared faceted claim list (also feeds Ask Wallach).

## 🔴 §00.A — CRITICAL for the LIVE build (verified this session)
- **TWO facts are shown in the demo that live in the BOOKS but are NOT yet in sealed claims — MINE them before shipping live:**
  - **Blood pH 7.36–7.44** — in `dddl-third-edition-2011.txt:7885`, `immortality.txt:6918` ("The pH of healthy blood ranges from 7.36 to 7.44"), `epigenetics.txt:23564`, `rare-earths…:25070`. (The sealed DDDL-000134 verbatim only gives 1.0→8.2; the 7.36–7.44 is nearby, unmined.)
  - **"acid production begins to fall at about age 35"** — in `dddl…:12187` ("This process begins at about age 35.") and `lets-play-doctor…:8381`. (Not in the LETS-000321 sealed verbatim shown.)
- **The "enzymes taken between meals reach the bloodstream and dissolve blood clots" beat is UNMINED** (`dddl…:9804-9805`, `lets…:5050-5052`) and was **deliberately left OUT** of the redesign. Do not add it without mining first.
- **Ultimate Enzymes CTA = Youngevity COMPOSITION; Wallach DRIVES the recommendation** (the app's model). Product record: `product_id: ultimate-enzymes`, sku 21211, ygy_id 609, 120 caps. Per-capsule composition (sealed Product DB): Betaine HCl 105 mg · Pepsin 22.5 mg · Pancreatin 11X 75 mg (protease/amylase/lipase) · Papain 5.3 mg · Bromelain 30 mg · Ox Bile 33 mg.
  - **Wallach backing:** betaine HCl + pancreatic enzymes + ox bile, "75–200 mg each t.i.d. before meals" is a SEALED claim (`claims-lets-play-doctor.json`, asthma-as-malabsorption) and the betaine+pancreatic core is DDDL-000130's dyspepsia protocol; ox bile also Epigenetics (`epigenetics.txt:19798`, fat-soluble-vitamin absorption); pepsin = IMMORT-000078 (acid activates pepsin); papain = papaya (*Carica papaya*), his listed digestive remedy. **Bromelain has NO Wallach claim — composition-only, labeled "Papaya backed" (half-dot) in the strip. NEVER attribute bromelain to Wallach.** (The odd-reading "Papaya backed" label is a deliberate keep — Luneth's easter egg.)
  - **Price = WHOLESALE** ($30.95 / 120 = **$0.26/serving**, ~$0.77/day) per the wholesale-featured-price rule. Copy: "solve it for about a quarter per serving". Footnote says "**one of the** least-expensive force-multipliers" (softened — "least-expensive" superlative is NOT verified against the full price table).
  - **"Force multiplier"** is OUR gloss on his doctrine ("you are what you absorb"), not a Wallach quote — flagged as such.

## ▶ NEXT, IN ORDER
1. **★ BRING §04 LIVE** — replace the old `views/knowledge-foods.ts` §04 (the `kd-foods-enz` block, `gateArt`, `enzPanel`, the `kd-foods-time` rail, and its second pull-stat) with the approved design. Steps: (a) **mine the two facts above** into sealed claims, small batches, Luneth's review each (standing process below); (b) port prose to `view-copy.json` (R4 — no inline prose), pH/amounts sourced not literal (R1/§00.A); (c) rebuild the ladder + fortress SVGs in the view with **deterministic** geometry (no `Math.random`, so the render probe is stable — same discipline as the existing `villiArt`/`gateArt`); (d) wire the CTA to the real Ultimate Enzymes product + the regimen-add path; (e) build → invariants → render probe (extend `render_probe_knowledge.js` or add a foods probe) → **screenshot-verify with Luneth** (visual work ENDS at his sign-off).
2. **Epigenetics topic** — the 8th/last dead pill on `wallach.related`. Only IAIYH-000020 carries the word vs 509 book hits → NEW mining from `epigenetics.txt`. Luneth chose "mine it now, small batches, my review each."
3. **Gloss card SHORT answers** — extending glossing to `answer_short` is a system-wide visual change; its own chunk + screenshot. (Expanded-answer glossing is done.)
4. **D1 · Trim 3 claim_texts that outrun their verbatim** — LETS-000122, LETS-000259, IMMORT-000081. NOTE: the DDDL digestion mining likely RESOLVED most (DDDL-000128 now states the 75%; DDDL-000129 the dyspepsia framing in properly-quoted words). Re-check before editing.
5. **Book-wide `betaine HC1` → `HCl`** — real OCR artifact across both books, quoted by sealed verbatims. Its own campaign (resnap + re-quote + reseal).

## ⚠ STILL SETTLED — do not re-litigate
- **betaine HCl is NOT digestive enzymes** — it is supplemental stomach ACID. Two different supplements, two different jobs. The redesign respects this (betaine HCl sits in the acid/ladder story; pancreatic enzymes are separate). Copy must never conflate them.
- The corpus does NOT support "digestive enzymes let you handle gluten." Gluten is always a food to ELIMINATE; enzymes are separate digestive support.
- The one non-Wallach sentence Luneth once requested (enzymes *reduce the bad effects of bad foods*) was granted-then-WITHDRAWN — **no precedent, no gate built.** Full record: `chronicle/contradictions/2026-07-24-digestive-enzymes-nonwallach-sentence.md`.

## 🔧 MECHANICS — load-bearing
- **`corpus_extract finalize` is NOT additive** — it writes `draft = sealed shard + THIS run's claims`. A 2nd finalize before sealing silently DROPS the 1st batch. One finalize per seal cycle.
- **Book-text edit order:** edit `.txt` via safe_write (LF) → `corpus_resnap --write [--fix json]` → **SYNC every draft from its corrected shard** → `corpus_seal`. The seal guard (`draft_offset_failures`) blocks the failure but does not sync for you.
- **Demo/proposal rendering:** standalone pages link the real stylesheets; `workspace-coverage.css` locks page scroll → the demos override `html,body{overflow:auto!important}`. `.ds-mark` highlighter silently fails without the `#ds-filter-rough` SVG on the page. Pull-quotes get Playfair only via the `kd-foods-pq`/`kd-ep-fam__quote` carve-out (else Unbounded). Decorative SVGs scale ~0.61× — size geometry in SCREEN px; the in-app preview renders file:// as a STATIC snapshot (JS runs once, clicks don't) — drive state via `javascript_tool` or puppeteer. `dashboard/components/*.html` link styles as `../assets/styles/`; `temporary/*.html` as `../dashboard/assets/styles/`.
- **Screenshots (live drawer):** open via `[data-rail-nav="knowledge"]`, dismiss the first-run modal ("I'm just browsing"), tall viewport (VH≈2600) or the lower half paints blank. Measure, don't eyeball (§02/§03 kicker sits 6px below the numeral top).

## 🔴🔴 REVIEW PROCESS (unchanged)
Show EVERY mined claim in exact final form — **Q → short answer → FULL answer → quote**. Default is BOTH answers; the full answer must ADD context from the surrounding book text. `corpus_seal` is user-authorizable. Visual/UX work ENDS at a STOP for Luneth's sign-off; an unsigned surface is logged as unsigned.
