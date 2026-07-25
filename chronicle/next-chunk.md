# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-24 22:10 CDT · Foods §04 redesign is now LIVE)

# ★★★★★ READ FIRST: **Foods §04 is LIVE (shipped 2026-07-24).** The approved redesign — pH ladder → fortress cutaways → inversion callout → one pull-stat → Wallach "sterile" pull-quote → Ultimate Enzymes CTA → shared full record — replaced the old `kd-foods-enz` block in `views/knowledge-foods.ts`, on real data. Luneth reviewed it live (screenshots), applied a run of type/spacing tweaks, and signed off. The frozen approval snapshot at `dashboard/components/knowledge-foods-sec04-PROPOSAL.html` is now SUPERSEDED — the live view is canonical (live-refined-past-it wins; the deltas are in the 2026-07-24 22:10 commit + build-log).

## ✅ WHAT SHIPPED (all verified: build OK · invariants 77/77 · render_probe_knowledge PASS · eslint clean · CSS 87/150 KB gz · screenshots signed off)
- **Every number/quote is sourced, not hand-typed.** Strip amounts + `$0.26`/serving + `$0.77`/day derive LIVE from the Product DB (`getProduct('ultimate-enzymes')`, now exported from `knowledge-products.ts`). pH ladder 1.0/8.2/7.36–7.44 → `DDDL-000134` (the 7.36–7.44 is in its sealed claim_text, book-verified — did NOT need a new mine). Triad → `DDDL-000132` + `IMMORT-000078`. Pull-stat 75% → `DDDL-000128`. Pull-quote → faithful contiguous EXCERPT of `DDDL-000132` ("sterile", via the new `sec04_quote` curation entry + `foodsSec04Quote()` accessor).
- **The proof-quote §00.A call (ratified by Luneth):** the demo's combined "betaine HCl + ox bile *for fats*" protocol is NOT one sealed claim and cited *Epigenetics* wrongly. Live version: dose from `DDDL-000130`, ox bile "prescribed alongside" from `LETS-000147`, citation corrected to **"Dead Doctors Don't Lie & Let's Play Doctor,"** and the unsourced "for fats" rationale DROPPED. Ox Bile strip tile keeps a "Wallach-backed" dot (he does prescribe it); "Plant enzyme" dot for Papain+Bromelain (bromelain is composition-only — NEVER attribute to Wallach).
- **Deliberately OMITTED** (unmined facts, per the prior handoff): the "age-35 onset" line (kept the faithful DDDL-000128 stat subtext instead) and the "between-meals enzymes dissolve blood clots" beat. Do NOT add either without mining first (`dddl…:12187`, `lets…:8381` for age-35; `dddl…:9804-9805`, `lets…:5050-5052` for blood clots).
- **Full record** = the shared `facetSections` renderer (8 curated claims: 3 thesis + 5 enzyme, incl. the newly-added `DDDL-000134`), wrapped in a `.sxr-*` lead/heading/sub. Framing softened from "the complete set" → "the sealed claims" (honest — it is a curated subset, not every digestion claim).
- **Two sealed design-system primitives tuned via SCOPED overrides, NOT by editing the sealed `design-system.css`:** `#drawer-knowledge-mount .kd-foods .ds-h-section { font-size: 1.65rem }` and `.kd-foods-enz .ds-pull-stat { padding-right: 2rem }`. Both are token-based + used only on this tab, so scoping keeps the type scale + hero pull-stat intact. If they should ever be system-level, that needs the seal protocol.

## ⚠ §04 FOLLOW-UPS (small, none blocking — Luneth aware)
- **Glossary tooltips** were dropped from §04 prose (the old §04 had them; the approved demo didn't). Re-add if wanted — the record cards still glossify.
- **Fuller full record** — currently 8 curated claims; could expand to more digestion claims (a curation pass, not a bug).
- **Cosmetic:** the "acid" axis cap at the bottom of the pH ladder is partly behind the pH 1.0 card (a lone "A" shows). Trivial nudge, left un-touched.

## ▶ NEXT, IN ORDER
**★★ IMMEDIATE NEXT PHASE — Luneth has a prompt ready at session start:** Search home-screen touchup — the claim categories on the Search / Ask-Wallach home currently link to NOTHING (dead links). Await Luneth’s prompt for the exact scope; this takes priority over the queue below.

1. **Epigenetics topic** — the 8th/last dead pill on `wallach.related`. Only IAIYH-000020 carries the word vs 509 book hits → NEW mining from `epigenetics.txt`. Luneth chose "mine it now, small batches, my review each."
2. **Gloss card SHORT answers** — extending glossing to `answer_short` is a system-wide visual change; its own chunk + screenshot. (Expanded-answer glossing is done.)
3. **D1 · Trim 3 claim_texts that outrun their verbatim** — LETS-000122, LETS-000259, IMMORT-000081. NOTE: the DDDL digestion mining likely RESOLVED most (DDDL-000128 now states the 75%; DDDL-000129 the dyspepsia framing in properly-quoted words). Re-check before editing.
4. **Book-wide `betaine HC1` → `HCl`** — real OCR artifact across both books, quoted by sealed verbatims. Its own campaign (resnap + re-quote + reseal).

## ⚠ STILL SETTLED — do not re-litigate
- **betaine HCl is NOT digestive enzymes** — it is supplemental stomach ACID. Two different supplements, two different jobs. The live §04 respects this (betaine HCl sits in the acid/ladder story; pancreatic enzymes are separate). Copy must never conflate them.
- The corpus does NOT support "digestive enzymes let you handle gluten." Gluten is always a food to ELIMINATE; enzymes are separate digestive support.
- The one non-Wallach sentence Luneth once requested (enzymes *reduce the bad effects of bad foods*) was granted-then-WITHDRAWN — **no precedent, no gate built.** Full record: `chronicle/contradictions/2026-07-24-digestive-enzymes-nonwallach-sentence.md`.

## 🔧 MECHANICS — load-bearing
- **`corpus_extract finalize` is NOT additive** — it writes `draft = sealed shard + THIS run's claims`. A 2nd finalize before sealing silently DROPS the 1st batch. One finalize per seal cycle.
- **Book-text edit order:** edit `.txt` via safe_write (LF) → `corpus_resnap --write [--fix json]` → **SYNC every draft from its corrected shard** → `corpus_seal`. The seal guard (`draft_offset_failures`) blocks the failure but does not sync for you.
- **View edits need a bundle rebuild** — `knowledge-foods.ts` compiles into `dist/main.js`; CSS files are linked live (no rebuild). The round-close re-inlines the Creator's Log at build time, so rebuild AFTER `creators_log.py append`.
- **Screenshots (live drawer):** open via `[data-rail-nav="knowledge"]`, dismiss the first-run modal ("I'm just browsing"), tall viewport or the lower half paints blank. Element-screenshots capture full height even when taller than the viewport; page-screenshot `clip` needs INTEGER width/height. Measure, don't eyeball. The in-app preview renders file:// as a STATIC snapshot (JS runs once) — drive via puppeteer.

## 🔴🔴 REVIEW PROCESS (unchanged)
Show EVERY mined claim in exact final form — **Q → short answer → FULL answer → quote**. Default is BOTH answers; the full answer must ADD context from the surrounding book text. `corpus_seal` is user-authorizable. Visual/UX work ENDS at a STOP for Luneth's sign-off; an unsigned surface is logged as unsigned.
