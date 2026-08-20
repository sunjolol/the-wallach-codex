# Wallach Knowledge Revamp — Proposal of Record

> **Status:** Plan, awaiting Luneth's approval. **Not yet building.**
> **Author:** Claude Code (Opus 4.8), 2026-06-24. Revision of the Cowork handoff
> (`C:\Users\Light\Desktop\claude\books\books\wallach-knowledge-revamp-handoff.md`).
> **Precedence:** Where this conflicts with the Cowork handoff, this wins (it is
> grounded in the actual codebase; the handoff was theoretical by its own admission).
> Where it conflicts with CLAUDE.md / `.claude/rules/*`, those win.
> **Locked inputs:** the handoff's §2 user decisions and §3 project constraints are
> accepted unchanged except where explicitly refined below with rationale.

---

## 0 · TL;DR — what changes vs. the handoff

1. **Eden becomes two-tier, three-wing.** Not "a new sealed sibling `eden/knowledge/`" bolted on, but a single coherent reframe: **Eden = all tier-1 canonical Wallach truth**, `knowledge/` = tier-2 working knowledge that is useful but *not* guaranteed-accurate. This is the resolution to "Eden is acting like a firewall, not a single source" — we make Eden hold MORE, and we name the boundary.
2. **`eden/books/` does not exist yet** — the handoff assumed the books were already sealed in Eden. They sit outside the repo. Phase α's real step 0 is bringing them in.
3. **The claim graph is named `eden/corpus/`, not `eden/knowledge/`** — to avoid a foot-gun name collision with the tier-2 repo-root `knowledge/`.
4. **Verbatim is the load-bearing anchor; structured locators are best-effort.** The PDF-extracted books carry no reliable page markers. Verify checks the verbatim substring; the locator is convenience.
5. **No separate `extract.py` + LLM-classification-cache subsystem.** Rejected as over-built. Extraction is agent-in-the-loop (the session agent drafts claim records; Luneth reviews chunk-by-chunk; `seal.py` promotes). That already *is* "LLM at extraction time, frozen as committed JSON."
6. **Claims are sharded per book**, so each book seals independently and the 5 inbound books are purely additive.
7. **The hook surface is a near-no-op** — the existing golden-sibling auto-detection already protects every sealed file.
8. **Your 5 hand-made graphics get a sealed tier-1 home** (`eden/graphics/`) and a §00.A contradiction protocol.
9. **Total cleanup**, archived out-of-repo to `C:\Users\Light\Desktop\claude\legacy-wallach-knowledge\`, gated on migration (nothing deletes until its last live consumer is migrated).

---

## 1 · The core reframe — two tiers, three wings

### Two tiers of knowledge (the boundary, named)

| Tier | Home | Posture | What lives here | Why |
|---|---|---|---|---|
| **Tier 1 — canonical** | `eden/` | Sealed, hash-anchored, user-only-writer, loud-fail on drift | The 6 (→11) books; the extracted claim graph; your 5 hand-made Wallach graphics; the YGY product catalog | "Direct Wallach truth." Every numeric/health claim the dashboard surfaces traces here (§00.A). |
| **Tier 2 — working** | `knowledge/` | Unsealed, agent-writable, advisory only | `transcripts-clean/` (the Sunday YouTube-scan feed) + `design-wisdom/` (project notes) | Useful but **not** guaranteed Wallach-accurate. Kept *out* of Eden precisely so it can never poison the canon. |

This is the engineering answer to your observation. Eden stops being "a firewall around one catalog" and becomes "the sealed garden for everything that must be true." `knowledge/` stops being a junk drawer and becomes a clearly-labeled tier-2 staging area whose only inhabitants are things that are *allowed* to be imperfect.

### Three wings of Eden

```
eden/
├── eden-catalog.json (+ .golden.sha256)     ← WING 1: Youngevity product catalog  [EXISTS, untouched]
├── corpus/                                   ← WING 2: Wallach books + claim graph  [NEW]
└── graphics/                                 ← WING 3: sacred hand-made graphics     [NEW]
```

One sealing discipline (hash-anchor + golden sibling + user-only-writer + read-only verifier) spans all three. The tooling lives under one roof: `eden/tools/`.

---

## 2 · Locked (accepted from the handoff, unchanged)

- **§2 user decisions L1–L10** — storage posture, chunk-by-chunk review, the four categorization axes, propose-freely on surfaces, dual-anchor locators, migrate-one-surface-at-a-time, one-proposal-then-phased, the 90 is always the 90, other-substances parallel-and-secondary, LLM-only-at-extraction.
- **§3 project constraints** — §00.A source rule, §00.B 11 principles, §17 write discipline, §31 chokepoints, anti-fakery, round-close ritual, logging doctrine, visual-verification gate, offline-forever, size budgets, Wild West Mode.
- **The spine principle** — `claims` is the one mutable source at extraction time; all indices are pure derivations. No two surfaces can disagree because they're views of one graph.
- **`essentials-canon` is the immutable 90** — locked once, every essentials reference is a slug from it, non-matching slug = build failure.
- **other-substances partitioned by separate file**, not a flag — the file system enforces the partition (per L9).

---

## 3 · Revised `eden/` layout (concrete)

```
eden/
├── README.md                                 ← UPDATED: documents the three wings + two tiers
├── SCHEMA.md                                  ← (catalog schema; unchanged)
├── seal-history.log                           ← (append-only; gains corpus/graphics seal lines)
│
├── eden-catalog.json  (+ .golden.sha256, + .draft.json)     ← WING 1 [EXISTS]
├── derived/                                   ← [EXISTS] catalog-derived embeds
│
├── tools/                                     ← all seal tooling, one roof
│   ├── eden_build.py / eden_seal.py / eden_verify.py        ← [EXIST]
│   ├── corpus_extract.py                      ← NEW · agent-runnable draft producer (no LLM subsystem)
│   ├── corpus_derive.py                       ← NEW · claims/* → indices/* (pure, deterministic)
│   ├── corpus_seal.py                         ← NEW · USER-ONLY · recompute golden hashes + bump version
│   ├── corpus_verify.py                       ← NEW · read-only verifier (the 10 checks, §7)
│   └── graphics_seal.py / graphics_verify.py  ← NEW · seal + verify the 5 graphics
│
├── corpus/                                    ← WING 2 [NEW]  (named "corpus" NOT "knowledge" — see note)
│   ├── README.md · SCHEMA.md
│   ├── books/                                 ← the sealed book text (anchored via books-meta, not per-file golden)
│   │   ├── dddl-third-edition-2011.txt
│   │   ├── rare-earths-forbidden-cures.txt
│   │   ├── lets-play-doctor-fourth-edition-1995.txt
│   │   ├── epigenetics.txt
│   │   ├── immortality.txt
│   │   ├── iaiyh.txt
│   │   └── (5 incoming)
│   ├── books-meta.json            (+ .golden.sha256)        ← per-book metadata + file_sha256 anchor
│   ├── essentials-canon.json      (+ .golden.sha256)        ← the immutable 90
│   ├── knowledge-version.json     (+ .golden.sha256)        ← monotonic version stamp (mirrors eden_version)
│   ├── claims/                                              ← SHARDED per book, each sealed independently
│   │   ├── claims-dddl-3e-2011.json        (+ .golden.sha256)
│   │   └── …
│   ├── indices/                                             ← DERIVED from claims/*, each sealed
│   │   ├── essentials.json        (+ .golden.sha256)        ← per-essential index (90 entries)
│   │   ├── other-substances.json  (+ .golden.sha256)        ← parallel-and-secondary (L9)
│   │   ├── conditions.json        (+ .golden.sha256)
│   │   ├── symptoms.json          (+ .golden.sha256)
│   │   └── consistency.json       (+ .golden.sha256)
│   └── drafts/                                              ← AGENT WRITES ONLY HERE (no golden siblings)
│       ├── claims-<book>.draft.json
│       └── reports/<book>.report.md  ·  <book>.diff.md
│
└── graphics/                                  ← WING 3 [NEW]  sacred hand-made graphics
    ├── 90-nutrients-front.jpg
    ├── Good-Foods-Front.jpg · Good-Foods-Back.jpg
    ├── Bad-Foods-Front.jpg  · Bad-Foods-Back.jpg
    └── graphics-manifest.json     (+ .golden.sha256)       ← file_sha256 + provenance per image
```

**Why `corpus/` not `knowledge/` (refines handoff §4):** the repo root still has a tier-2 `knowledge/`. Two dirs named `knowledge` (one sealed tier-1, one unsealed tier-2) is a self-documentation failure (§00.B #10). `eden/corpus/` reads as exactly what it is.

**Why books are anchored via `books-meta.json` (not a per-book `.golden.sha256`):** one sealed manifest carrying each book's `file_sha256` is a single source of truth for "what the books were at last seal," and `corpus_verify.py` checks book bytes against it. Cleaner than N golden sidecars, and it's the same shape Eden already trusts.

---

## 4 · Schemas (refined from handoff §5)

The handoff's record shapes are accepted with three changes. Full Zod schemas land in Phase α (`core/schemas/corpus.ts`); JSON shape here.

**4.1 — Claim atom (refined).** Keep the handoff's `kind` enum, `essentials`/`other_substances`/`conditions`/`symptoms` slug arrays, `dose` sub-object, `tags`, `confidence`, `review_state`, `superseded_by`. **Changes:**
- `verbatim` is **required, 60–500 chars, EXACT book substring** — promoted from co-equal to the primary durable anchor.
- `locator` is **best-effort**: `{ book, scheme, screenshot?, kindle_location?, chapter?, page?, char_offset }`. `char_offset` (start index of `verbatim` in the book file) is always computable and is the machine fallback; `page`/`chapter` are filled only where the text actually carries them. Verify never fails on a missing page; it fails on a `verbatim` that isn't a substring.
- `id` scheme `WAL-CLM-<book_short>-<6digit>` (e.g. `WAL-CLM-DDDL-000123`) so sharded files never collide on id.

**4.2 — Per-essential / condition / symptom / consistency indices** — accepted as handoff §5.3–5.6, with the consistency model refined in §14 below. They are 100% derived by `corpus_derive.py`; never hand-edited.

**4.3 — `essentials-canon.json`** — the 90 slugs + display names + category, sealed once for life. Carries the unresolved adjudications as explicit fields (`provisional: true` for Cysteine-vs-Taurine until the corpus audit rules), so the canon never silently encodes an unverified choice.

**4.4 — `graphics-manifest.json`** — per image: `{ file, file_sha256, title, provenance: "user-authored, Wallach-derived", captured_year, depicts, related_essentials[], status: "canonical" }`. The manifest is sealed; `graphics_verify.py` checks each image's bytes against its `file_sha256`.

---

## 5 · Extraction — agent-in-the-loop (rejects handoff §8/§9 LLM subsystem)

**The handoff proposes a deterministic `extract.py` with a Pass-3 LLM classifier + an input-hash→classification cache + a replayer. Rejected as over-built (§00.B: simplest thing that honors the principles).** The guarantee it's chasing — "an LLM helps at extraction time, output is frozen as committed JSON, the dashboard never calls an LLM" — is *already* satisfied by how this project works:

```
   eden/corpus/books/<book>.txt
          │
   corpus_extract.py  ← DETERMINISTIC ONLY: paragraph chunking, regex dose/number
          │             extraction, candidate flagging, char_offset computation.
          │             Emits drafts/claims-<book>.draft.json (skeleton) + report.
          ▼
   AGENT PASS (the session Claude, in-conversation with Luneth)
          │  reads the book + the skeleton, writes claim records (kind, slugs,
          │  claim_text, verbatim, dose) to drafts/ via safe_write. THIS is the
          │  "LLM at extraction time" — its output is the committed draft JSON.
          ▼
   USER REVIEW (Luneth, chunk-by-chunk) — visual-verification gate applies
          │  accept / edit / reject / defer each chunk; review_state advances.
          ▼
   corpus_seal.py  ← USER-ONLY
          │  promotes drafts/claims-<book>.draft.json → claims/claims-<book>.json
          │  runs corpus_derive.py (regenerates indices/*), recomputes golden hashes,
          │  bumps knowledge-version, runs corpus_verify.py as the last gate (refuses on any fail).
```

**Determinism comes from the seal + hash, not a cache replayer.** Once sealed, a claim is plain JSON forever. **Runtime purity** is proven by one new invariant (`corpus_runtime_purity`) that greps `dist/main.js` for network/LLM/`fetch`-to-external patterns — same family as the existing `no_external_style_resources` invariant. The LLM (the agent) is **never on the source-rule allowlist**: it sorts passages; the *book* is always the source; Luneth reviews and overrides.

If you later want a fully-automated, replayable extraction (for the 5 inbound books without an agent in the loop), that's a clean Phase-ζ add — but it should not block v1.

---

## 6 · Sealing + verify (refines handoff §10)

`corpus_verify.py` is read-only, deterministic, truth-anchored on book bytes. Wired into `tools/invariants.py` as one critical invariant (`corpus_integrity`) plus the runtime-purity invariant. The checks:

1. Every claim id referenced by any index exists in some `claims/*` shard. (referential)
2. Every claim's `verbatim` is a byte-equal substring of its source book file. **(the load-bearing check)**
3. Every essentials slug used anywhere ∈ `essentials-canon.json` (90-integrity).
4. `essentials-canon` ∩ `other-substances` = ∅ (partition).
5. Every claim id is globally unique across shards.
6. Each book file's sha256 == its `books-meta.json` `file_sha256` (book-drift catch).
7. Every `*.json` actual hash == its `*.golden.sha256` (seal integrity).
8. `indices/*` are byte-equal to a fresh `corpus_derive.py` run over `claims/*` (derivation is honest — no hand-edited index).
9. `locator.char_offset` (when present) points at the `verbatim` start (locator/verbatim agreement).
10. No draft file is referenced by any sealed index (no orphan-draft leakage into canon).

Check #8 is the §00.B #11 truth-anchor for the derived layer: the index can't drift from the claims because it's recomputed and compared, not trusted.

---

## 7 · Hook & invariant surface (refines handoff §14.4 — it's nearly a no-op)

**Finding:** `tools/hooks/pre_write_guard.py` already blocks any path whose sibling `<name>.golden.sha256` exists (line 87), and `tools/hooks/pre_bash_guard.py` already bans bash `>`/`tee`/`sed -i` writes into `eden/` (BANNED_DIRS). Therefore:

- **Sealed corpus/graphics files are protected the instant their golden sibling exists — zero hook code change.**
- `drafts/` has no golden siblings → stays agent-writable via `safe_write`. Correct by construction.
- The seal tools (`corpus_seal.py`, `graphics_seal.py`) are **user-only**; like `eden_seal.py` they carry the "agent may not run on the user's behalf" banner. (Belt-and-braces option, if you want it: add their exact paths to `pre_bash_guard` so the agent can't invoke them — I recommend this, it's ~4 lines and matches the eden_seal posture.)

**New invariants (each gets a `.claude/invariant-baseline.json` entry covering the pre-first-seal empty state, per handoff §14.5):**
- `corpus_integrity` (critical) — runs the 10 checks above; green-tolerated as "empty, not yet sealed" until Phase β.
- `corpus_runtime_purity` (critical) — `dist/main.js` carries no network/LLM call.
- `graphics_integrity` (critical) — the 5 images match their manifest hashes.

**`wallach_stance_source_rule` transition (handoff §14.6):** today it walks `knowledge/essentials-targets.json`. During Migration 1 it walks **both** that file and `eden/corpus/indices/essentials.json` (dual-source, no enforcement gap). After Migration 1's last consumer flips, it walks only the Eden index. The allowlist stays in-code in `tools/invariants.py`; `eden/corpus/` citations are claim-ids resolving to allowlisted books, which is *stronger* than free-text matching.

---

## 8 · The 5 sacred graphics (§00.A note — read before sealing)

You ruled these tier-1 ("treat the same as direct Wallach info"). I'll honor that, with one guardrail the source rule requires. These are **user-authored reconstructions** of Wallach's framework — structurally the same *class* of artifact as the third-party `90-essentials-dirobi-harada.md` we're deleting. The difference you've asserted: you made these deliberately, you trust them, they're sacred. That's a legitimate source-owner ruling (you own §00.A). So:

- They seal into `eden/graphics/` as `status: "canonical"`, provenance `"user-authored, Wallach-derived"`.
- **Contradiction protocol:** if, during the book extraction, a claim from a sealed Wallach *book* contradicts one of these graphics (e.g. a dose or an essential-list entry), `corpus_verify` / the agent does **not** silently pick a winner. It writes `chronicle/contradictions/<date>-graphic-vs-book-<slug>.md` and surfaces it to you prefixed `⚠ PRIME DIRECTIVE CONFLICT` — exactly as you asked ("then let me know"). You rule.

This keeps your graphics canonical while preserving the cornerstone's "no source overrides a Wallach primary without explicit review" — including a graphic vs. a book.

---

## 9 · Cleanup & archive plan (your "total cleanup")

**Archive target (out of repo):** `C:\Users\Light\Desktop\claude\legacy-wallach-knowledge\` — one folder, browsable head-start reference, keeps the repo lean and the 94 MB of PDFs out of the tree.

**Rule (L6, non-negotiable):** nothing is archived/deleted until its **last live consumer** is migrated. Final cleanup chunk greps to prove zero consumers, then moves in one transaction, then render-probes every surface.

| Disposition | Items | When |
|---|---|---|
| **Archive (out of repo)** | `knowledge/wallach-books/` (94 MB PDFs), `books-clean/`, `wallach-topic-notes/` (incl. the dirobi-harada md + its PNG — third-party), `corpus-index/`, `catalog-index/`, `youngevity-product-notes/`, `health-resources/` (the general 95%: ORAC, foreign images, Jerrold-Peterson PDF, `TRANSCRIPTIONS.md`, root `.jpg/.png/.gif`), and the obsolete loose root files once migrated (`why-layer-*.md`, `topic-index.json`, `manifest.csv`, `corpus-changelog.md`, `diet-contribution.json`, `product-descriptions.json`, `products-db.json`, `triage-summary.md`, doctrine `.md`s) | Migration 8 / per-consumer |
| **Clean delete (no archive)** | `podcast-transcripts/`, `podcast-*.json/.txt` at root (sources gone, bad UI format) | Migration 8 |
| **MOVE to Eden tier-1** | the 5 sacred graphics `health-resources/personal/*.jpg` → `eden/graphics/` | Phase α |
| **STAYS in `knowledge/` (tier-2)** | `design-wisdom/`, `transcripts-clean/` | forever (per your ruling) |
| **Migrate-first, then archive** (live consumers today) | `essentials-targets.json` (+ `-data` embed) → corpus indices [`wallach_stance_source_rule`, coverage]; `ingredients-*.json`, `regimen-label-lookup.json` → already Eden-derived, retire the knowledge/ copies; `_wallach_stance_candidates.json` → keep until the corpus audit consumes it, then archive | Migrations 1–8 |

Catalog-index / youngevity-product-notes / products-db: Eden's `eden-catalog.json` is **already** the YGY single source. These are older redundant indices → archive. If any product fact in them isn't yet in `eden-catalog.json`, that's a future **Eden-catalog enrichment** (user-writer task, separate from this revamp) — I'll flag specifics if I find them during migration.

---

## 10 · Surfaces — re-ranked by real build cost (refines handoff §6)

Given the actual surface architecture (IIFE bundle, the K/J drawer registry shipped last sessions, the chokepoints, the render-probe matrix):

| Rank | Surface | Why this cost | Cost |
|---|---|---|---|
| **1** | **Essential Deep Dive** | The Knowledge drawer *already has* an Essentials tab with a deep-dive (shipped 2026-06-24). This is an **enhancement** — repoint it at `corpus/indices/essentials.json` + claim citations. Lowest cost, highest value. | XS |
| **2** | **Coverage citation mode** | Coverage already reads `wallach_stance`; swap free-text for claim-id lookups. Migration 1 anyway. | S |
| **3** | **Symptom self-assessment** | New drawer tab, parallel to the existing tabs; pure read over `symptoms.json`. | M |
| **4** | **Condition encyclopedia** | New drawer tab over `conditions.json`. | M |
| **5** | **Other-substances explorer** | New drawer section over `other-substances.json` (L9). Pairs with #1. | S |
| **6** | **Cross-book consistency viewer** | Over `consistency.json`; depends on the consistency model (§14). | M |
| **7** | **Glossary of coinages** + **Pet protocols** | Both are just `tags`/`kind` filters over claims. Cheap, charming. | S each |
| **defer** | Wallach Q&A (command palette), Evolution timeline | Valuable but depend on the full graph + the palette surface; post-migration. | L |

Surfaces #1–#4 are the spine. They slot into the **existing drawer architecture** — no layout teardown — which honors your "easily pluggable into what we built" goal. Where a surface wants more room than a drawer (Condition encyclopedia may), I'll flag it at its chunk and we decide then.

---

## 11 · Phasing (re-timed) + concrete Phase α

| Phase | Outcome | Gate |
|---|---|---|
| **α — Foundation** | `eden/corpus/` + `eden/graphics/` skeleton; books moved in + `books-meta.json`; `essentials-canon.json` (the 90, provisional adjudications flagged); 5 graphics moved + manifest; the 4 corpus tools + 2 graphics tools as skeletons; `core/schemas/corpus.ts`; 3 invariants wired (baseline-tolerated empty); README/SCHEMA. **No claims yet.** User runs `corpus_seal.py` + `graphics_seal.py` once. | build · invariants · `corpus_verify` passes empty-state · build-log · log · commit |
| **β — First book (DDDL)** | Agent extracts DDDL chunk-by-chunk; you review; seal. ~300–600 claims. **This is where we learn the real per-book cost** before committing to all six. | + chunk approvals logged |
| **γ — Remaining seeded books** | Rare Earths → Let's Play Doctor → Epigenetics → Immortality → IAIYH, one at a time. | per book |
| **δ — Indices** | `corpus_derive.py` builds essentials/other-substances/conditions/symptoms/consistency; seal; the corpus audit (Fluoride re-adjudication, Cysteine↔Taurine) resolves the canon's provisional flags here. | + audit rulings logged |
| **ε — Surface migrations** | Surfaces #1→#4 from §10, each its own visual-verified chunk. | per surface: build · invariants · probe · **your visual sign-off** · log · commit |
| **ζ — 5 new books** | Additive extraction on the new books only; review; seal; indices regenerate. | per book |
| **η — Cleanup** | §9 archive transaction once grep proves zero consumers; clean-delete the dead set; probe every surface; build-log records it explicitly. | final round-close |

**Transcript audit stays deferred** (your tier-2 ruling makes this clean): transcripts live in `knowledge/`, and *if* we later want transcript-derived claims, they flow into the same graph with `locator.scheme = "transcript_timestamp"` and a `tier: 2` flag — never blended into book-tier claims for verdict math.

### Concrete Phase α — the first round-close (for your approval)

1. **Move books in** (agent, `safe_write rewrite` per file — they're new, no golden sibling, not blocked): `C:\Users\Light\Desktop\claude\books\books\*.txt` → `eden/corpus/books/`. (6 files, ~5 MB.)
2. **Move the 5 graphics** → `eden/graphics/` (binary copy — these need a non-safe_write path since they're images; I'll propose the exact mechanism at build time, likely a user-run or a reviewed `cp` since `safe_write` is text-oriented — flagging now so it's not a surprise).
3. **Author skeletons via `safe_write`:** `eden/corpus/README.md`, `SCHEMA.md`, `books-meta.json` (6 entries, real `file_sha256`), `essentials-canon.json` (the 90, ported from `coverage-layout-data.json`'s essential set), `knowledge-version.json` (`{version: 0}`), empty `claims/` + `indices/` + `drafts/`, `graphics-manifest.json`.
4. **Tools:** skeletons of `corpus_extract.py`, `corpus_derive.py`, `corpus_seal.py`, `corpus_verify.py`, `graphics_seal.py`, `graphics_verify.py` (verify fully implemented; extract/derive stubbed to "no claims yet").
5. **Schema:** `core/schemas/corpus.ts` (Zod), tsc-clean.
6. **Invariants:** wire `corpus_integrity`, `corpus_runtime_purity`, `graphics_integrity`; add baseline entries for the empty pre-seal state.
7. **You run** `corpus_seal.py` + `graphics_seal.py` (the only user-only steps) → golden hashes written → board green.
8. **Round-close:** `node tools/build.mjs` · `PYTHONUTF8=1 python tools/invariants.py` (29/29) · `corpus_verify` empty-pass · build-log line · Creator's Log · commit + push.
9. **STOP for your visual/structural sign-off** before Phase β.

Build-log line shape:
`[YYYY-MM-DD HH:MM EDT] eden/corpus · revamp Phase α — sealed-corpus + graphics skeleton, books in-housed, 3 invariants wired · <files> · foundation for the Wallach claim graph`

---

## 12 · Answers to the handoff's §14 open questions

1. **Data budget** — ~6 books → est. 3–6 K claims ≈ 1.5–3 MB sharded JSON. Trivial vs. 350 MB shipped. **But:** never inline into `dashboard.html` (already a 348 K-token monolith); ship as **lazy-loaded fetch per surface**, Zod-validated **once per `knowledge-version`** (memoized), not per boot. (§14.1, §14.3 both answered by this.)
2. **Render-probe matrix** (§14.2) — extend `render_probe_knowledge.js` for Surface #1; new `render_probe_symptoms.js`, `render_probe_conditions.js` for #3/#4; extend `render_probe.js` (coverage) for citation mode. Each migration ships its probe (testing.md).
3. **Boot validation cost** (§14.3) — answered in #1: validate-once-per-version, keyed on the sealed `knowledge-version` hash; cold-load reads only the surface's shard.
4. **Hook surface** (§14.4) — near-no-op; see §7. (Optional 4-line `pre_bash_guard` add for the seal tools.)
5. **Invariant baseline seam** (§14.5) — each new invariant gets a baseline entry tolerating the empty pre-seal state; the entries are removed (→ hard green) when Phase β/α seals real data. Handled in Phase α step 6.
6. **`wallach_stance_source_rule` evolution** (§14.6) — dual-source during Migration 1, single-source after; see §7.
7. **Consistency model** (§14.7) — refine "count of books repeating" to a small struct: `{ books_repeating: int, editions_span: [earliest_year, latest_year], voice: "wallach"|"ma-lan"|"mixed", evolution: null|{...}, contradiction: null|{...} }`. Don't over-weight; surface the raw facts and let the UI rank. Contradictions are a **feature** (shown), per L3(d).
8. **other-substances UI partition** (§14.8) — its own **section within the Knowledge drawer**, visually distinct, never blended into the 90 grid. Reuses the existing drawer; no new route. (Pairs with Surface #1/#5.)
9. **LLM determinism** (§14.9) — neither (a) nor (b): **(c) no LLM subsystem at all for v1** (agent-in-the-loop, §5). Runtime purity proven by invariant. Revisit a replayable pipeline only at Phase ζ if desired.
10. **Phasing realism** (§14.10) — split the handoff's "β first book" so DDDL is its **own** phase and we measure real cost before γ commits to five more. Done above.

---

## 13 · Prime-directive check (§00.A / §00.B)

- **§00.A** — strengthened, not stressed: every surfaced claim becomes a claim-id resolving to an allowlisted book + a verbatim the verifier proves. The sacred-graphics ruling is a source-owner decision with a contradiction protocol (§8) that *upholds* the cornerstone. **No proposed source-rule override** — the graphics are admitted by your authority as the rule's owner, parallel to how Youngevity labels are admitted; this is within the allowlist's spirit (Wallach-derived primary), not a breach. If you'd rather run the full three-confirm override protocol to admit them, say so and I'll flag it formally.
- **§00.B** — honored across the board: #1 no-silent-failures (loud seal/verify), #2 defense-in-depth (verbatim + hash + derivation recompute), #3 single-source (claims spine), #4 atomic (draft→seal swap), #6/#11 verifiable+truth-anchored (book bytes), #10 self-documenting (`corpus/` rename, three-wing layout). **No §00.A↔§00.B conflict surfaced** → no contradiction report needed at proposal time.

---

## 14 · What I need from you to start Phase α

1. **Approve this proposal** (or mark edits). I do **not** build until you do.
2. **Confirm the archive path** `C:\Users\Light\Desktop\claude\legacy-wallach-knowledge\` (or name another).
3. **Confirm `eden/corpus/` naming** (vs. the handoff's `eden/knowledge/`).
4. **Note on graphics:** confirm you're comfortable admitting the 5 graphics as tier-1 by your source-owner authority (§8) rather than running the formal three-confirm override. Either is fine; I default to the former per your message.

On approval, Phase α lands as a single round-close, then I STOP for your sign-off before the first book.
