# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-27 · DRAWER-FIX + OPENER-AUDIT + MINING SESSION)

# ★★★★★ READ FIRST (plain language)
Three doctrines still bind:
1. **"search-only" is DEAD.** Every claim lives in ONE of three homes — the 90 essentials, conditions,
   or Explore — and Search is a retrieval layer over all three. NEVER reintroduce a search-only tag/split.
2. **Wallach's supplement thesis:** essential nutrients come from the **DIET (food OR supplements)**, never
   "from food" alone — the soil is depleted, so food no longer suffices.
3. **NEVER GUESS when mining.** Mine only from the sealed book source (verbatim ⊆ book, snapped by finalize).
   If the source has no proper passage, say so — do NOT fabricate. (This session: 2 of 8 topics honestly
   left un-mined because the source genuinely lacked a clean overview.)

**Corpus: kv421 · 2199 claims · board 76/76 green.** (Sealed this session: +4 new overview claims.)

## ★ WHAT THIS SESSION DID (all committed + pushed to master)
1. **Knowledge-drawer fixes** (`8cc0964f`): removed the covered/not-covered legend + per-tile status dot
   from the drawer's Essentials tab ONLY (Coverage page keeps its own); made the Home search find Explore
   topics (was essentials+conditions only), purple-dotted like the others.
2. **Topic-opener audit** (`d4c1078b`): the Explore opener (lede) is auto-picked by facet-priority, which
   surfaced sensational/tangential claims (testosterone opened with a teen-crime stance). Audited all 103
   auto-lede topic pages (13-agent review + adversarial verify): 82 keep, **13 reordered** via a per-page
   `intro_claim` pointer to a better EXISTING approved claim, 8 flagged needs-mining. Mechanism + fix:
   [[topic-opener-lede-mechanism]]. Essentials + conditions are immune (approved lede / template synopsis).
3. **Mined 6 of the 8 needs-mining openers** (`79d52af6`, corpus kv420->kv421): read-only 8-agent source
   research + byte-verification found real overview passages. SEALED 4 new claims — rare_earth_elements
   (IMMORT-000466), cranial-nerves (IAIYH-000021), meat (HELLS-000074), home_remedies (LETS-000518);
   water reordered to its existing DDDL-000104; sexual_health opens with the existing Kegel claim per Luneth.
   **intro_claim now accepts an also_about claim on the hand-picked path ONLY** (auto path still needs
   subject===entity) — so sexual_health opens with the Kegel claim without emptying pelvic-floor-exercises.

## DEFERRED / FOLLOW-UPS
- **2 pre-existing search-routing failures** (NOT caused this session, flagged): `render_probe_search_routing`
  fails 2/6 on antioxidant-FOOD query routing ("which foods have the most antioxidants", "best antioxidant
  foods"). Orthogonal to the opener work (routing logic untouched). A future session should investigate the
  antioxidant food-sources routing (resolveQuery/scoreClaim/entityInQuery/heroByIntent + the ORAC food claims).
- **DHA + antidepressants openers left as-is** (honest): DHA's "conditionally essential" definition is shared
  verbatim with the omega-6/GLA claims (can't duplicate); its current opener already defines it. Antidepressants
  has no on-topic overview in the source (Wallach never overviews the drug class; the lithium-deficiency line is
  the lithium claim's and never names antidepressants). Improving these needs a NEW distinct passage or a code
  path that surfaces an also_about answer — not a fabrication.
- **Ask-Wallach enrichment continues** per [[mining-serves-ask-wallach]] — biggest/most-searched entities first;
  the wow-factor campaign (rich synonyms + question-inventory) over the 90 essentials + big condition/topic pages.
- **Memory index** at 180 lines (Luneth: leave until ~195). Deferred deeper cull + the mining-mechanics merge.
