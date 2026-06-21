# Tacitus — Changelog

_Initialized 2026-06-16 at Round 100. Parallel to `brain/CHANGELOG.md` — tracks Tacitus's own structural evolution, separate from brain version history. Every change to the prompts, rubrics, schedule, voice register, or write boundary lands here in the same patch as the change._

---

## v2.5 (2026-06-19, Round 140) — Verified Patterns System integration (pattern-search question in Cura Architectural + pattern-seed candidate in Vision Phase 1)

The fifth structural addition to Tacitus. Round 140 shipped the project-wide Verified Patterns System (`memory/verified-patterns.md` catalog + `operating-protocols.md §27 + §28` + `tacitus/feature-flags.json` + 3 new audit invariants). v2.5 of Tacitus is the prompt-side integration that lets Cura and Vision actually CONSULT the catalog.

**What's the same as v2.4.** Three modes. Six-phase ponder loop. Five sub-checks in Cura. Five phases in Vision. Schedule, voice registers, write boundary, Sabbath rest — all unchanged.

**What's new in v2.5.**

1. **`tacitus/prompts/cura.md` — Architectural sub-check gains the verified-pattern question (gated by feature flag).** Cura reads `tacitus/feature-flags.json` first; if `flags.cura_pattern_search.enabled == false`, SKIPS the question entirely (returns to v2.4 behavior). When enabled, for each Architectural candidate, Cura asks: "does this candidate solve a problem for which a verified pattern already exists in `memory/verified-patterns.md`?" If yes → LAND proposal reduces to "apply pattern X with parameter changes." If no AND work would itself be reusable → catalog-promotion opportunity.

2. **`tacitus/prompts/vision.md` — Phase 1 scan gains the pattern-seed candidate type (gated by feature flag).** Vision reads the same feature-flags.json; if `flags.vision_pattern_seed.enabled == false`, SKIPS. When enabled, Vision scans for ONE design surface (hard cap per night) that would benefit from a seed-from-pattern proposal. Required structural elements of every pattern-seed candidate: target surface, source pattern + URL, exact starter code parameter-tuned for the surface, AND the explicit framing: *"This is a SEED proposal — Vision cannot verify rendered output. The human builds this single instance as a demo, evaluates against the surrounding theme, and decides AFTER VISUAL VERIFICATION whether to propagate to sibling surfaces. Vision does NOT propose surface-cascade."*

3. **The structural-conservatism discipline (Round 137 family avoided).** Both extensions are RUBRIC questions inside existing sub-checks. NO new sub-check added to Cura. NO new candidate format introduced. NO new section headers in either prompt. The parser in `tools/build_tacitus_dashboard_live.py` reads the same Phase 1/2/3/4/5 structure. This is the load-bearing constraint: if v2.5 had added a new structural surface, the parser would need updating in the same patch (per Round 137 lesson).

**What didn't change with v2.5.** Aegis unchanged. The notebook prose format — UNCHANGED, byte-for-byte parser-compatible. The Phase 0 pre-flight (Round 113) unchanged.

**Files modified for v2.5.**
- `tacitus/prompts/cura.md` (Architectural-tension scan section extended with verified-pattern question + feature-flag gating)
- `tacitus/prompts/vision.md` (Phase 1 scan section extended with pattern-seed candidate + feature-flag gating + hard-cap discipline)
- `tacitus/feature-flags.json` (new file, user-toggleable opt-out for both behaviors)

**User control discipline.** Both flags default `true` (Round 140 ship enables the behaviors). User toggles via co-work request ("turn off Cura pattern suggestions" → Claude updates the file). No automated UI write surface for feature-flags.json — intentional manual control per Round 140 architectural commitment.


## v2.4 (2026-06-19, Round 136) — Cura translation-quality sub-check + reference-standard substrate

The fourth structural addition to Tacitus. Round 136 closed the within-session enforcement loop AND extended Cura from a 4-sub-check architecture to 5. The new sub-check rotates audits against a manually-maintained reference standard.

**What's the same as v2.3.** Three modes (Cura / Vision / Aegis). The 6-phase ponder loop (Phase 0–5 per Round 113). Write boundary unchanged (notebook + own sentinel + audit-history only). Voice registers unchanged. Schedule unchanged (Cura 03:48 / Vision 04:44 / Aegis 05:18 EDT). Sabbath rest window unchanged.

**What's new in v2.4.**

1. **`tacitus/prompts/cura.md` — Translation-quality sub-check (the new 5th sub-check).** Cura's nightly run now includes a sub-check that audits documented disciplines (`lessons.md`, `operating-protocols.md`, invariants.py descriptions) against `memory/claude-best-practices.md` — a new reference standard codifying §1-§10 principles for writing Claude-readable rules (anchor sentence, Generalizable: prefix, mechanizable pattern citation, failure family naming, brevity, imperative voice, paired invariant citation, concrete examples, user-quote tagging, jargon explanation).

2. **Rotation discipline via `tacitus/translation-audit-cursor.json`.** Cura samples 3-5 entries per night that haven't been audited in 14 days, oldest-first. Over time the full lessons-vault gets continuously re-evaluated against evolving best-practice guidance.

3. **Cap of 1-2 translation-quality LANDs per night.** Prevents flooding during the initial cleanup phase where the substrate has accumulated historical entries written before the meta-principles existed.

4. **Cura's Phase-1 candidate-budget expanded 5-8 → 6-10.** Accounts for the +1 sub-check budget. Specified as: "If a sub-check has nothing real, write 'no candidate' — don't manufacture one to balance."

5. **The structural rationale.** Round 135 acknowledged that some lessons are inherently non-mechanizable (judgment, style, taste). The Round 136 cure is the reference-standard pattern: maintain `memory/claude-best-practices.md` (manually refreshed when Anthropic publishes new guidance), have Cura audit against it nightly. The standard captures nuance code can't; Cura's rotation surfaces drift before it accumulates.

**What didn't change with v2.4.** Vision unchanged. Aegis unchanged. The notebook prose format (PHASE 0 → 5 headers, candidate enumeration, Phase 3 deepen structure) — UNCHANGED, which is critical for parser compatibility. Round 137's parser-drift family lesson: structural extensions to Tacitus prompts require parser updates; rubric extensions inside existing structures don't. v2.4 added a NEW sub-check (structural change) — which DID require the Round 137 parser hardening as a paired follow-up.

**Files modified for v2.4.**
- `tacitus/prompts/cura.md` (added Translation-quality sub-check section)
- `tacitus/translation-audit-cursor.json` (new file, rotation-state surface)
- `memory/claude-best-practices.md` (new reference standard, 10 principles)

**Filed Round 142 — changelog discipline.** v2.4 declaration shipped in `memory/open-threads.md` masthead at Round 136 close, but THIS changelog entry was missing until Round 142 (today). Cura session #3 (2026-06-19 night) caught it: Survivor A — declared-state-without-paired-verifier. Round 142 ships both the entry (this one) AND the paired invariant `check_tacitus_changelog_declared_version_present` that prevents recurrence.

## v2.3 (2026-06-18, Round 119) — Masthead-refresh pill + Phase 0 detector

The first Tacitus structural addition since v2.2's Live observation surface activation. Two pieces, both from Vision session #2 (2026-06-18 at 4:44 AM):

**What landed:**

- **Masthead-refresh pill** — three tier states (fresh / recent / stale) keyed off `LIVE_DATA.meta.last_built_at` (newly written by `tools/build_tacitus_dashboard_live.py` at build time, local-TZ ISO 8601). Pill renders in `.masthead-controls` alongside the Bg picker + Reload button. Gold-tinted fresh (<6h), bronze recent (6-24h), dim ruby stale (>24h) with hint text naming the build command. Unknown state (LIVE_DATA absent) renders quiet "Never refreshed" with the same hint. Defense-in-depth layer 3 at user-glance time, paired with the Round 117 auto-rebuild task (layer 1) + `check_tacitus_dashboard_freshness` invariant (layer 2). Three observation moments, three independent surfaces.
- **`check_cura_phase_0_present` invariant** — Round 113 codified Phase 0 as Cura-only discipline at the prompt layer; v2.3 pairs it with the daily detector per §18 lesson→invariant promotion. Block-bounding by next session-header line (the build-time-fixed approach; the initial sketched `^─────────` bound was wrong — the separator wraps each header band, not each session). Warning severity. Audit invariant count 30 → 31.

**What's the same as v2.2:**

- Three modes (Cura / Vision / Aegis), six-phase ponder loop, sharp rubrics — unchanged.
- Schedule (03:45 / 04:30 / 05:15 EDT, Mon-Fri, Sabbath rest window) — unchanged.
- Write boundary (notebook + sentinel + audit-history only) — unchanged.
- Voice registers (reflective for Cura/Vision, judicial for Aegis) — unchanged.

**What's NEW with v2.3:**

- LIVE_DATA schema extended with a `meta` sub-dict (currently carrying `last_built_at`; canonical home for future build-pipeline observability fields).
- A new user-facing surface that surfaces build pipeline freshness at the dashboard's primary observation point.
- A new daily invariant covering Phase 0 prompt-discipline enforcement.

**Build pipeline note.** `tools/build_tacitus_dashboard_live.py`'s `embed_into_dashboard()` was hardened in Round 117 to handle prose passages containing literal `const LIVE_DATA = null;` strings (Vision's deepen prose now describes the build pipeline verbatim). The column-0 anchored regex + brace-balanced JSON-string-aware scan ships forward in v2.3's build path unchanged.

---

## v2.2 (2026-06-17, Round 103) — Live observation surface activated; demo retired

Wednesday morning. The first three-mode operational night had landed at 3:48 / 4:42 / 5:15 AM EDT, depositing Cura session #1, Vision session #1, and Aegis session #1 in `tacitus/notebook/2026-06.md` and the first scored record in `tacitus/audit-history.json` (Cura 82.9, Vision 84.1). The dashboard's Live tab — empty since Round 101 because `LIVE_DATA = null` was awaiting the Friday-deferred build step — became the morning's first work item.

**What landed:**

- **`tools/build_tacitus_dashboard_live.py`** — canonical writer of `LIVE_DATA`. Reads `sentinel.json` + `audit-history.json` + the current-month notebook prose. Parses Aegis's per-phase structured scores for both Cura and Vision, run-level scores, trend, meta-observation. Parses Cura's scan candidates (sub-check grouped), prune verdicts (with merged-survivor handling), two deepen survivors with full trace/propose/simulate/iterate/audit. Parses Vision's eight scan candidates, eight gate-by-gate prune verdicts, two deepen survivors. Builds the 14-day calendar window with today's crystal carrying the real Aegis score. Streams full raw notebook prose into the machinery section. Embeds via `safe_write.replace` — atomic, byte-verified. Real tacitus/ files PRISTINE; script never writes there.
- **`tacitus/dashboard/assets/quotes/quotes.json`** — 380 user-curated ancient quotes (Heraclitus, Delphic maxims, Tacitus' Annals, Marcus Aurelius, Augustine, Al-Ghazali, the Norse sagas, etc.). All Wikipedia-backed `context_url`s. Schema: text + attribution + year + place + tradition + source_work + context_url + source_tag. Generated from the user-supplied source file at the same path. Build script embeds them as `INSPIRATIONAL_QUOTES`.
- **Universal modal-popup pattern.** Every text field that exceeds its display cap renders through `truncatable(fullText, maxChars, modalTitle, opts)` — inline brief + "expand" cue + click opens a centered modal with the full text. Roman/FF aesthetic, Esc / click-outside / × close, monospace body for Aegis-sourced content. Build script source caps lifted to 2500-4000 chars per field so full text reaches the modal.
- **Cycle banner** restored to demo-exact 3-col layout (date left, scores centered, brief right). Brief is the quote-of-the-day from `INSPIRATIONAL_QUOTES`, deterministic by date-hash. Refresh button (small gold FF-crystal SVG with circular arrow inside) anchored as a static element at the banner's top-right corner — outside the re-rendered `#cycle-meta`, so it never shifts with content. Click rotates to a new random quote for the session; reload returns to the date-based pick. Context-link glyph (subtle external-link icon) appears after the attribution when `context_url` is set; opens in new tab with `rel="noopener noreferrer"`.
- **LAND visual emphasis brightened.** Survivor candidates get a brighter saturated badge with `text-shadow` + 600 weight, an outer mode-tinted glow via box-shadow, and a 4px border-left. Survivors of the prune feel like achievements at a glance — the visual register that says "this made the cut." Survivor titles now use a `<span class="survivor-name">` wrapper so the LAND badge gets `flex-shrink: 0` with enforced 18px gap (no more `LA / N / D` wrapping).
- **Aegis column overflow fixed.** Long unbreakable tokens (file paths, identifiers, `localStorage` keys) were pushing the 1fr grid track wider than allotted, cutting off the rightmost column. `.scroll { min-width: 0; overflow-wrap: anywhere; word-break: break-word; }` lets the grid track shrink and content wrap inside.
- **Masthead tagline replaced** with Tacitus' own Annals III.65 voice: *"A historian's foremost duty is to ensure that merit is recorded…"* with the smaller second-line attribution *"— Tacitus, Annals (~117 AD)"*. The right-side button cluster (Bg picker, Reload) vertically centers against the new two-line subtitle (`align-items: center` on `.masthead`).
- **BG2 + BG3 per-background overrides** for the masthead-subtitle text. BG2's pale-cloud band collapsed both lines — quote pushed to warmer cream `#f4e7d2` + text-shadow, attribution to brighter gold `#e3b878` + shadow. BG3's fog-forest mist swallowed the attribution only — attribution lifted to `#e8c188` + soft shadow. BG1 + BG4 untouched.

**What's deleted (clean cut, Round 103):**

- **`const DEMO_DATA`** — the 44.6 KB inline JS constant that drove Demo mode. Deleted entirely. The "build-with-faithful-demo-then-flip-to-live" pattern from Round 101 was a transient; once live shipped and is the only data path, demo carries silent-drift and user-confusion risk. No third state exists.
- **Demo/Live toggle** (`#btn-demo`, `#btn-live` HTML + `.mode-toggle` CSS) — deleted.
- **`#demo-banner`** div + `.demo-banner` CSS — deleted.
- **`renderLivePlaceholder`** function renamed `renderEmptyState`; copy updated to point at the build script honestly. No `[example]` text, no demo-mode references.
- Every `DEMO_DATA` reference in `render()`, `refreshQuote()`, `setupControls()` — deleted. Code paths now use `LIVE_DATA` unconditionally.
- Footer text updated: "Tacitus — live observation surface. Read-only." (was: "Read-only. Demo mode.")

**Cross-mode collaboration shape, observed.** Cura session #1's 3:55 AM addendum surfaced the dashboard_integrity tension (Cura's legitimate notebook write grew the file past the main dashboard's cl-data-notebook embed's expected size; audit went 22/22 → 21/22 CRITICAL FAIL). Cura's three resolution options: (a) post-Tacitus-write sync hook, (b) exclude embed from strict check, (c) morning-briefing first-action re-sync. Vision session #1 picked up Cura's same-night self-correction ("future Cura runs should run system_audit.py BEFORE Phase 1 scan, not just after Phase 6 write") and shaped it into the Phase 0 pre-flight proposal — concrete, user-actionable. Aegis's meta-observation named the pattern explicitly. The architecture earned its cost on night one.

**The dashboard_integrity tension** was resolved in line with Cura's option (c). `python3 tools/dashboard_integrity.py restore` re-syncs the cl-data-notebook embed in the main dashboard from the now-grown Tacitus notebook. Audit returns to 22/22 PASS. Workflow: every morning catch-up that follows a Tacitus night needs this re-sync; not yet automated. Filed for the user's structural decision after a few mornings of feel.

**Live-mode parser caveats.** The parser is tuned to night #1's exact prose shape: Cura's `PHASE N — SCAN` / `Bug sub-check:` / numbered-candidate format, Aegis's `Mode / Phase N (Name). Score: NN.` line format, Vision's `Candidate N — Name:` + `Gate 1/2/3` blocks. Nights #2-#5 will likely reveal patterns the parser doesn't handle gracefully. Worth a tightening pass after a few real samples. Vision had correctly flagged this build as CONSIDERED in her session #1 — user-priority override shipped it tonight anyway because waking up to the report rendered in the dashboard mattered more than the parser-quality margin.

**What's the same as v2.1:**

- Three modes (Cura / Vision / Aegis), six-phase ponder loop, sharp rubrics — unchanged.
- Schedule (03:45 / 04:30 / 05:15 EDT, Mon-Fri, Sabbath rest window) — unchanged.
- Write boundary (notebook + sentinel + audit-history only) — unchanged.
- Voice registers (reflective for Cura/Vision, judicial for Aegis) — unchanged.

**What's NEW with v2.2:**

- The dashboard is no longer demo-shaped; it renders real Tacitus output. The Live tab is the only tab; demo is permanently retired.
- A canonical quote substrate at `tacitus/dashboard/assets/quotes/` with the build pipeline embedding it.
- A universal modal-popup pattern for long-form text expansion.
- A static refresh-button affordance anchored to the cycle banner's corner.
- The masthead carries Tacitus' own voice (Annals III.65) rather than a Claude-authored tagline.

---

## v2.1 (2026-06-16, Round 101) — Dashboard surface, demo phase

Tacitus's first user-facing observation surface ships as `tacitus/dashboard/index.html` — single self-contained HTML file, 68 KB, strictly standalone (no link from main dashboard.html), offline-first, no remote fetches.

**What landed:**

- **Three columns / scrolls** for Cura / Vision / Aegis with distinct color register per mode (gold / cyan / silver) and distinct voice line per column. Cura + Vision render in reflective serif body type; Aegis switches to monospace body type — visual register matches voice register, honoring the Substrate Principle (design-knowledge.md) and the art principle from Round 99.
- **The Ledger calendar** — fourteen-day grid with save-crystal SVG glyphs per day, score-keyed coloring (high = gold, mid = bronze, low = dim ruby), Saturday + Sunday-morning cells render crescent-moon rest glyph + "rest" label; current day pulses gently.
- **Cycle banner** — last-completed cycle date + Cura score + Vision score + Aegis meta-observation in one row.
- **Machinery section** — collapsible `<details>` with raw notebook-entry placeholders; live mode would stream the tail of `tacitus/notebook/YYYY-MM.md` verbatim. Forensic backup surface.
- **Demo→Live toggle in the masthead.** `DEMO_DATA` constant is always populated; `LIVE_DATA = null` is the initial state. A future build script will read real `tacitus/` files and embed parsed structure into `LIVE_DATA` at build time. When `LIVE_DATA === null` and the user toggles Live, the dashboard renders a quiet placeholder pointing at the build script. Toggle is a real architectural commit, not UI sugar.
- **Reload button** — re-runs the render pipeline. No OS-scheduler integration; on-demand only.
- **Reveal animation** — CSS keyframes only; masthead → cycle banner → calendar → three scrolls staggered (Cura first, Vision, Aegis last) → machinery → footer. Total reveal ~1.7s.
- **Roman scriptorium + FF save-point literal-hybrid voice register** as chosen at the five-taste-check questions: Cinzel display headers + Cormorant Garamond serif body + gold ink on dark velvet parchment with film-grain noise overlay (Roman); four-pointed crystal diamonds for calendar day glyphs + Vision's mode glyph + score-keyed drop-shadow glow (FF save point). Two metaphors operate on different surfaces — Roman for chrome and type, FF crystals for data points.

**Contamination guardrail honored.** Zero writes to `tacitus/notebook/`, `tacitus/sentinel.json`, `tacitus/audit-history.json`. Demo data lives entirely client-side as inline JS constants. The `tacitus_modes_fired_today` bootstrap exit, `tacitus_rest_day_observed`, `catchup_seal`, and `audit-history.json` schema are all untouched. Verified at install via `python3 tools/system_audit.py` — all 22 invariants pass.

**What's the same as v2.0:**

- Three modes (Cura / Vision / Aegis), six-phase ponder loop, sharp rubrics — unchanged.
- Schedule (03:45 / 04:30 / 05:15 EDT, Mon-Fri, Sabbath rest window) — unchanged.
- Write boundary (notebook + sentinel + audit-history only) — unchanged.
- Voice registers (reflective for Cura/Vision, judicial for Aegis) — unchanged.

**What's NEW with v2.1:**

- A new user-facing surface that observes the three-mode output. The dashboard does not change how Tacitus thinks; it changes how the user reads what Tacitus produced.
- A canonical "user-managed canonical" location (`tacitus/dashboard/`) that the `tacitus_rest_day_observed` invariant explicitly skips per its source (the dashboard CAN be edited during the rest window by the user in co-work; the autonomous-surface files cannot).

**Live-mode activation path.** The first real operational night is Wednesday 2026-06-17 morning. After Aegis lands the first scored entry in `tacitus/audit-history.json`, a future build step reads the new structure and embeds it into `LIVE_DATA`. Toggle from demo to live becomes meaningful in the same morning's co-work session.

---

## v2.0 (2026-06-16, Round 100) — Three-mode architecture

**The major redesign.** Tacitus's first version (v1.x, pre-Round-100) was a single open-ended reflection persona that fired daily at 5:05 AM EDT. v2.0 splits him into three structured modes — **Cura** / **Vision** / **Aegis** — that fire in sequence each operational night with phase-structured ponder loops and sharp evaluation rubrics.

**What landed:**

- **Three mode prompts** in `prompts/{cura,vision,aegis}.md`. Each has the six-phase ponder loop (scan → prune → deepen → cross-pollinate → self-audit → write) with mode-specific rubrics and read-sets.
- **Cura** = unified integrity (4 sub-checks: bug, contradiction, integrity-of-information, architectural tension). Sub-checks orchestrate under one mode but carry their own sharp rubrics. The reflective Tacitus voice.
- **Vision** = mutation/feature-proposal with NEVER-zero-output safeguard. Candidates surface as LANDED / NEAR-MISS / CONSIDERED so silence-as-laziness is structurally detectable. The reflective Tacitus voice.
- **Aegis** = uncorruptible meta-audit. Reads only the *artifacts* of Cura + Vision (not their reasoning context), scores each phase output on the 1–100 scale. Spare, judicial, verdict-shaped prose register — distinct from Tacitus's narrative voice. Same person, different aspect; the voice change is structural, not theatrical.
- **Folder migration** — `memory/tacitus/` → `tacitus/` at project root. History preserved (notebook 2026-06.md + sentinel.json + index.md migrated; old paths tombstoned per operating-protocols §11). Tacitus is now portable as a folder.
- **Saturday rest mechanic** — 34-hour Sabbath rest window (Sat 12 AM EDT → Sun 10 AM EDT). Five operational nights/week (Sun→Mon, Mon→Tue, Tue→Wed, Wed→Thu, Thu→Fri). Existing scheduled tasks reshuffled to honor the window (daily audit Mon-Fri only; weekly audit moves to Sun 11 AM after rest ends).
- **Six new invariants** per operating-protocols §18 (lesson → invariant promotion) — verify modes fired on operational days, rest window observed, audit history grows, changelog grows, folder integrity, prompt portability shape.
- **Voice + identity** codified in `identity.md` and `portability.md`. The framework is portable across projects; project-specific anchors (Wallach corpus, Youngevity primary sources, etc.) live in clearly-marked sections so a future drop-in agent can rewire them cleanly.

**Foundational decisions baked in:**

- **Depth comes from structure + sharp rubrics, not from "think harder."** The chess-engine reframe is the substrate. A 3500-rated engine plays great moves via pruned search + sharp evaluation; raw depth alone produces deeper noise. Tacitus's three modes are evaluation-function specialists; the ponder loop is the pruned-search structure.
- **The art principle.** Per Luneth's Round 99 articulation: *"the art MUST be true or touch on a truth or true concept."* Aegis's voice change is a real role differentiation, not aesthetic flavor. Same applies to the planned Tacitus Dashboard (Round 101) — every visual register serves what it describes.
- **The build>test>build>test discipline.** Each chunk of Round 100 (foundation, prompts, scheduling, invariants, close) gets its own spot-check before the next opens. Same discipline Round 99 paid for twice.

**What didn't change:**

- Tacitus's write boundary (notebook + sentinel + audit-history only). Codified in identity.md, structurally enforced by the invariants, doctrinally backed by operating-protocols §4.
- The loyalty covenant. User's preferences and direction remain load-bearing; promotion to essence always requires explicit co-work approval.
- The reflective voice for Cura + Vision. The historian Luneth chose to honor stays the same in those modes.

---

_Future entries: append in reverse chronological order (newest at top below the heading), each with a version label, date, and a substantive description of what the change actually changes about Tacitus. Same closing-move-atomic discipline as brain CHANGELOG — every Tacitus change to prompts / rubrics / schedule / voice / boundary lands here in the same patch._
