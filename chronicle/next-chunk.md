# Next chunk — TASK (a) COMPLETE (A3 cost-per-nutrient recommender landed) → (b) corpus audit / Phase G NEXT

**★ CURRENT STATE (2026-07-08).** Phase F (Youngevity Product DB) COMPLETE + SEALED. Task (a) — the Coverage/Knowledge deep-dive on real product data — is COMPLETE:

- **A1 (`761495be`)** — product vault swapped to the sealed Products pillar; old scraped-catalog subsystem DELETED as poison. [[old-product-system-full-delete]]
- **Products detail-panel (`84030f6b`)** — Knowledge▸Products lists all 215, each clickable to a full detail panel. [[product-detail-panel-vision]]
- **A2 (`fb6ac528`)** — the Coverage matcher unified onto the ONE registry resolver (`core/nutrient-resolver.ts` ≡ `eden/tools/nutrient_resolve.py`); `nutrient_resolver_parity` gate + vitest; targets carry their canon `slug`.
- **Omega-9 correction (`87aa99e9`)** — the 90-nutrients graphic mislabeled Omega-9 as "Arachidonic" (it is Oleic Acid); corrected across the sealed canon (re-sealed, `knowledge_version=305`) + a per-omega clarity alert. [[essentials-authority-graphic]]
- **A3 (this round)** — the cost-per-nutrient **BEST SOURCES** recommender. NEW `eden/tools/recommender_derive.py` → `dashboard/assets/data/product-recommender-data.json` (per essential: `{product_id, amount, breadth, price}` candidate rows; MANIFEST-registered, freshness-gated, accounted). NEW `state/recommender.ts` scores `0.6·adequacy + 0.3·breadth + 0.1·value` (weights are tunable consts). The Knowledge▸Essentials deep-dive's old flat "FOUND IN YGY VAULT" chip list became a ranked **BEST SOURCES** list (rank · name · N nutrients · $price · delivered amount; row click → product detail). §00.A-clean: composition + retail price only, **no Wallach number in the artifact**. Design locked [[cost-per-nutrient-match-score]]. Visual sign-off: Luneth approved ("phenomenal").

Board **50/50 green**; active plan = `chronicle/OVERHAUL-BLUEPRINT.md`.

### ★ CORRECTION — the prior handoff's "all 91 targets are honest gaps" was STALE/FALSE
**34 of the 91 essentials already carry a NUMERIC Wallach target** (derived from base-line supplement-program dose claims, `amounts_wallach_only`-sourced — e.g. Magnesium 1000 mg, shown by the Coverage meter). So the recommender's **saturating adequacy `min(1, delivered/target)` is ALREADY LIVE** for the 32 numeric-target essentials that have vault sources; the amount-**potency proxy** (`delivered / best-in-set`) applies only to the 19 honest-gap essentials-with-sources. The BEST SOURCES UI shows the "adequacy step activates once targets are mined" note ONLY on the proxy set (target essentials hide it). The ranker reads a per-essential target via `getTargets → target.low`, so as dose-mining (b) fills more targets, adequacy lights up for the rest **automatically** — no recommender change needed.

## ★ RESUME HERE

1. **(b) — the STILL-OWED full corpus audit → Phase G book mining** (+ the source-anchored substance triage buffer, [[substance-registry-and-triage-buffer]]; gated by `corpus_audit_gate`). [[full-corpus-audit-before-phase-g]]. The big next arc — and it directly upgrades the recommender: every new Wallach dose target flips a potency-proxy essential to real saturating adequacy.
2. **Conditions → product suggestions** — PARKED until book mining (needs the cure→essential→product link). [[product-detail-panel-vision]].
3. **Recommender weight-tuning** — 0.6 / 0.3 / 0.1 is the locked starting point; tune in `state/recommender.ts` by eyeballing real output (same "your eyes are the test" gate). Revisit once more targets exist; on honest-gap essentials the proxy currently lets a well-rounded 1000-unit product edge out a focused higher-amount one — a target settles that via adequacy.

### Deferred small follow-ups
- **Canonical-unit unification** (coverage `toMg` IU-native vs registry `to_canonical`) — WISH; own §00.A review when done.
- **Omega clarity alert on the Coverage dashboard** — Coverage tiles have no deep-dive today (the alert lives in Knowledge▸Essentials); make tiles click-to-detail (small chunk) if wanted.
- **`fatty-acid-clarity-data.json` + `product-recommender-data.json` onto the `prose_contained` clean surface** (both currently accounted, not yet prose-gated — like the other hand/derived stores).
- **JS size budget** — `dist/main.js` gzip is ~846 KB vs the 250 KB budget (STRUCTURAL: the offline bundle inlines all pillar data uncompressed; A3 added ~17 KB). Not a round-close gate today; the blueprint remedy is code-splitting into lazy chunks. Deferred to that arc.

**★ KEY CONTEXT:** 34/91 Wallach targets are numeric today (real adequacy there); the other 57 are honest gaps → potency proxy until dose-mining (b). The registry powers composition aggregation + cost-per-nutrient NOW. Global styling touch-ups deferred to ONE end pass (Luneth 2026-07-08).

## The overhaul in one paragraph (context)
Full structural overhaul after book citations were caught hand-typed ~200×. **Model:** TWO hand-edited sealed sources — the Wallach Corpus (`eden/corpus/`) + the Youngevity Product DB (`eden/products/`, COMPLETE + SEALED) — plus the shared Catalog (`eden/catalog/`). Everything else is GENERATED + freshness-gated. Phases A–F DONE. Task (a) = finish the Coverage/Knowledge deep-dive on real product data — **COMPLETE** (A1 + Products surface + A2 + omega correction + A3 recommender). Then (b) = the owed corpus audit → Phase G mining. The Charter (R1–R9) + its gates are the enforceable spine; `.claude/rules/` carries the per-domain HOW.
