# Next chunk — TASK (a): A2 + Omega-9 correction DONE → A3 (cost-per-nutrient recommender) NEXT

**★ CURRENT STATE (2026-07-08).** Phase F (Youngevity Product DB) COMPLETE + SEALED. Task (a) — the Coverage/Knowledge deep-dive on real product data — has landed:

- **A1 (`761495be`)** — product vault swapped to the sealed Products pillar; old scraped-catalog subsystem DELETED as poison. [[old-product-system-full-delete]]
- **Products detail-panel (`84030f6b`)** — Knowledge▸Products lists all 215, each clickable to a full detail panel. [[product-detail-panel-vision]]
- **A2 (`fb6ac528`)** — the Coverage matcher unified onto the ONE registry resolver (`core/nutrient-resolver.ts::resolveSlug` ≡ `eden/tools/nutrient_resolve.py`); NEW `nutrient-resolver-data.json` + `nutrient_resolver_parity` gate (1360 pillar names) + vitest. `targets_derive.py` emits each essential's `slug`. Default-stack coverage byte-identical. Units stayed IU-native (canonical-unit unification = WISH).
- **Omega-9 correction (committed this round — run `genesis` for hash)** — the 90-nutrients graphic mislabeled Omega-9 as "Arachidonic" (it is **Oleic Acid**). Corrected the labels across the sealed canon (re-sealed, `knowledge_version=305`) + the lockstep join-key files + derived; built a per-omega **clarity alert** (non-Wallach) on the Knowledge essentials deep-dive from NEW `fatty-acid-clarity-data.json`. Wallach's claim text untouched. Full record: `chronicle/contradictions/2026-07-08-omega9-arachidonic-correction.md`; memory [[essentials-authority-graphic]] corrected (don't restore arachidonic).

Board **50/50 green**; active plan = `chronicle/OVERHAUL-BLUEPRINT.md`.

## ★ RESUME HERE

1. **A3 — cost-per-nutrient recommender (NEXT).** Promote `eden/derived/product-composition.json` (already registry/`to_canonical`-based, RAW highest-first) → a CONSUMED surface. Build the ranking: composition + breadth + **banded cost** (cost from `prices.json`). HONEST LIMIT: the saturating-adequacy term (`min(1, delivered/target)`) needs Wallach TARGETS, which are all honest gaps until corpus dose-mining (b) — so SHIP the structure now (composition + breadth + banded cost), and adequacy lights up post-(b). Design locked: [[cost-per-nutrient-match-score]]. View-affecting → visual sign-off.
2. **Conditions → product suggestions** — PARKED until book mining (needs the cure→essential→product link). [[product-detail-panel-vision]].
3. **(b) — the STILL-OWED full corpus audit → Phase G book mining** (+ the source-anchored substance triage buffer, [[substance-registry-and-triage-buffer]]; gated by `corpus_audit_gate`). [[full-corpus-audit-before-phase-g]].

### Deferred small follow-ups (from this session)
- **Canonical-unit unification** (coverage `toMg` IU-native vs registry `to_canonical`) — labeled WISH; own §00.A review when done.
- **Omega clarity alert on the Coverage dashboard** — Coverage tiles have no per-essential deep-dive today (tiles only); the alert lives in Knowledge▸Essentials, Coverage tiles got the corrected hint. If wanted on Coverage, make tiles click-to-detail (small chunk).
- **`fatty-acid-clarity-data.json` onto the `prose_contained` clean surface** (currently accounted, not yet gated for prose — like the other hand stores).

**★ KEY CONTEXT:** all 91 Wallach targets are honest gaps today → the "% toward target" VERDICT awaits corpus dose-mining (b). The registry already powers composition aggregation + cost-per-nutrient NOW. Global styling touch-ups deferred to ONE end pass (Luneth 2026-07-08).

## The overhaul in one paragraph (context)
Full structural overhaul after book citations were caught hand-typed ~200×. **Model:** TWO hand-edited sealed sources — the Wallach Corpus (`eden/corpus/`) + the Youngevity Product DB (`eden/products/`, COMPLETE + SEALED) — plus the shared Catalog (`eden/catalog/`). Everything else is GENERATED + freshness-gated. Phases A–F DONE. Task (a) = finish the Coverage/Knowledge deep-dive on real product data (A1 + Products surface + A2 + the omega correction done; **A3 remains**). Then (b) = the owed corpus audit → Phase G mining. The Charter (R1–R9) + its gates are the enforceable spine; `.claude/rules/` carries the per-domain HOW.
