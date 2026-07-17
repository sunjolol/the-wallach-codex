# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-16 ~19:10 CDT)

> ★★★ THIS FILE + the memory files OVERRIDE ALL OLDER BLUEPRINT / PLAN / DEMO NOTES ("older loses").
> Board **76/76** (`pdm_group_goals_wallach_sourced` landed 2026-07-16).
> Corpus sealed at **kv=339** (9 truncated verbatims repaired — see below).
> Read the next line before you repeat that number.
>
> **THE NUMBER IS NOT WHAT YOU THINK IT IS.** Only the **external** gates check anything outside
> our own files. The rest prove our files agree with each other. **A green board means NOTHING
> DRIFTED. It does not mean anything is RIGHT.** Do not report the total to Luneth as a statement
> about Wallach — that is exactly how this project spent three weeks confidently wrong.

## ★★★★ START HERE — THE COVERAGE PAGE IS DONE AND SIGNED OFF. Both open rulings are CLOSED.

**Ruling 1 (plant-derived goals) — SETTLED + SHIPPED + GATED.** **Ruling 2 (shell chrome) —
SETTLED:** the fabricated footer stays deleted. Luneth: *"I'm glad the bottom bar was removed, it
takes up space for no reason."* **Do not resurrect it.**

### ★★ THE ANSWER LUNETH'S QUESTION PRODUCED — do not re-derive, do not re-litigate
He rejected the question I asked ("should strontium ring?") and asked the better one: **does
Wallach attribute benefits to the plant-derived GROUP as a whole?** He does — **9 of the 14
goals**, in his own words. So:
- **The GROUP is goal-nameable** → `goals[].groups: ["plant-derived"]`, rendered as ONE DOT PER
  GOAL on the PLANT DERIVED subsection label; hovering a goal chip isolates its dot.
- **The 34 elements individually stay EXCLUDED** (`EXCLUDE_PLANT_DERIVED = True`, unchanged).
  Strontium still has no individual membership. **That ruling stands** — the old "flip it to
  False" note is DEAD (it would have added 6 essentials incl. GOLD, whose only claim is a
  conventional IM injection schedule for RA).
- **The 5 goals with NO group claim** (more energy · better sleep · blood-sugar · digestion ·
  healthy weight) get NO dot. An honest gap. **Do not "fill" them.**

★ **THE RULE READS WALLACH'S VERBATIM, NOT OUR TAG — do not "simplify" it back:**
a goal names the group iff a sealed non-search-only claim whose **OWN VERBATIM** says
`colloidal minerals` maps one of its conditions. `other_substances: colloidal-minerals`
**OVER-INCLUDES** single-element colloidals (colloidal CALCIUM / SELENIUM / TIN — INDIVIDUALLY
DOSED 21 members with their own amounts) and is **flat wrong** on LETS-000152 (its window bled
into BALDNESS's "Colloidal tin"). Reading the claim's own verbatim makes bleed impossible by
construction. Gated + pinned in the negative test.

### ★ THE CORPUS REPAIR (kv=338 → 339, Luneth-approved seal)
9 truncated verbatims repaired in `claims-lets-play-doctor` — each cut at the ~500-char soft
limit, dropping Wallach's own colloidal sentence out of his own quote while the SUMMARY already
described it. Repair = `book[char_offset : end-of-evidence-sentence]`, byte-exact, ≤896c.
★ **The soft limit was eating more than the target sentence:** LETS-000391 had silently dropped
*"Estrogen may be contraindicated because of the potential carcinogenic effect (known to cause
breast and uterine cancer)"*. **There are 64 verbatims over soft-500 corpus-wide and no audit of
how many OTHERS are truncated mid-passage.** That is an open question, not a known-clean state.

### ★★ OPEN / DEFERRED (each is real, none blocks)
1. **LETS-000243 (dementia)** — its colloidal sentence sits BEFORE its `char_offset` (in the
   entry's prevention paragraph), so it is NOT repaired and does NOT license sharper-thinking's
   dot (LETS-000130 does). Luneth: *"leave it, log the defect."* Fixing it means moving the
   claim's start point — resnap territory, and it changes what the claim says.
2. **12 UNDER-tagged + 4 MIS-tagged colloidal claims** — `other_substances` is wrong in both
   directions (missed: joint_pain, 2 cancer claims; wrong: backache/insomnia/cardiomyopathy/
   muscle_cramps). **Analysis-only today** — the derive reads VERBATIMS, so no shipped surface
   depends on those tags. Fix if a surface ever reads them.
3. **`eden/corpus/seal-history.log` is GITIGNORED** (blanket `*.log` in `.gitignore:4`). The
   append-only record of every seal — Luneth's own ratification acts — lives ONLY in this
   working tree and is in **no clone**. Pre-existing; contradicts the logging doctrine's
   "survives even if the GitHub layer vanishes". Worth a decision.
4. **`size-limit` still absent from the round-close** (pre-existing; bundle 4.9× over budget).
5. **`main.ts`'s 4 pre-existing lint errors** left as found.
6. **`pdm_coverage_derive.py:19`'s prose is STALE** ("FOUNDATIONAL 4 / INDIVIDUALLY DOSED 22 /
   PLANT DERIVED 34"; actually 5 / 20 / 34 + 1 mirror). Prose only, no gate reads it. Fix in the
   session that next touches that file.
7. **★ NEW (2026-07-16) — `coverage_layout_derive.py:143-159`'s rationale comment is FACTUALLY
   FALSE on its headline example**, and the same false story is repeated in
   `test_pdm_group_goals_wallach_sourced.py` case 5's docstring and (until now) in this handoff.
   The comment says LETS-000152 (backache) carries the `colloidal-minerals` tag *"only because the
   miner's window bled into the NEXT entry, where 'Colloidal tin' appears under BALDNESS."*
   **The book refutes it.** `lets-play-doctor-fourth-edition-1995.txt` char **185050** — INSIDE the
   backache entry (184706-185771) — reads *"plant derived colloidal minerals have been reported to
   prevent and reverse back problems without surgery"*, **721 chars BEFORE** the BALDNESS heading
   (185771). So on LETS-000152 the **TAG is RIGHT** and the **VERBATIM rule UNDER-matches**: the
   claim's `char_offset` (185383) lands *after* Wallach's colloidal sentence and truncates it out.
   The comment states **backwards which instrument errs**. Same shape as item 1 (LETS-000243).
   ★ Its second example is false too: -000204's tag is `colloidal-selenium`, not
   `colloidal-minerals` — a tag rule would never have matched it.
   ✓ **The verbatim rule itself still stands** on the surviving evidence (LETS-000322 insomnia,
   -000374 muscle_cramps are genuine over-inclusions), and **no shipped dot is wrong** — backache
   and cardiomyopathy are in no goal's conditions. **What is broken is the recorded WHY**, in three
   places at once. A drifted comment is a defect (§00.B · `typescript.md` rule 1). Fix the comment,
   the docstring, and case 5's synthetic world together.
8. **★ NEW (2026-07-16) — `test_pdm_group_goals_wallach_sourced.py` case 4 does not test what it
   claims to test.** It is labelled *"★ THE CASE THAT EARNS THE GATE"* — the proof that reading the
   verbatim beats reading `other_substances` — but the fixture factory (`:95-96`) never emits an
   `other_substances` key, so the case **cannot distinguish tag from verbatim**. Mutation-tested:
   a tag-reading mutant behaves IDENTICALLY under case 4 (and 7 of the 10). The suite still kills
   the mutant, but only via cases 6 + 10 — **both by accident**. R9: tighten case 4 to actually
   plant the tag it claims to defeat.
9. **★ NEW (2026-07-16) — the gate's `external` classification is TRANSITIVE, not direct.**
   `pdm_group_goals_wallach_sourced` reads only our own files; its book-anchoring is inherited from
   `corpus_verify` being green in the same session. It follows house precedent (`invariants.py:5516`
   sets it), but "20 external" is the number Luneth is told the green MEANS — so whether transitive
   externality counts is his call. Its honest-limit note also omits that the goal→`conditions`
   mapping it joins through is OUR curation with no external anchor; the sibling
   `goal_members_actionable` discloses exactly that limit, this one does not (R7: sold marginally
   above its enforcement).

### ★★★ THE PROCESS LESSONS FROM THIS SESSION — the expensive ones
- **FOUR character-window instruments each returned a DIFFERENT answer** to "how many goals?"
  (11 → 10 → 8), and 10 was REPORTED to Luneth before it was checked. Every one was an artifact:
  a ±2000 window that caught neighbours, a `\n\n` paragraph unit that does not exist (the book
  has **10 blank lines in 516k chars**), a "line" unit that is a 43-char PDF wrap, an arbitrary
  400-char tail that dropped a real claim. The truth (9/14) came from READING all 28 passages.
  **The book is line-wrapped OCR with hyphenation across lines — de-hyphenate before matching.**
- **★★ A VERIFICATION PANEL THAT DIES LOOKS UNANIMOUS.** The first 76-agent adversarial run was
  VOID — a scope bug (`i is not defined`) killed all 48 refuters, and the filter read
  `refutes: []` as "survived zero refutations" and confirmed all 28. **Require the panel to have
  ACTUALLY REPORTED before its silence means anything.** → [[negative-control-or-it-proves-nothing]]
- **THREE blind-instrument nulls each looked like a finding** (wrong product ids → 0 goals lit;
  an unrendered rail → "0 dots, success!"; the dead panel). → [[null-result-needs-a-scope-check]]

### ★ WHAT SHIPPED (files, commit `c85e564a`)
`eden/corpus/{claims,drafts}/claims-lets-play-doctor.json` + goldens + `knowledge-version` (kv
339) · `eden/tools/coverage_layout_derive.py` (GROUP_ID · `_dehyphenate` · `_group_claims` ·
`groups` per goal, omitted-never-empty) · `coverage-layout-skeleton.json` (+`id:"plant-derived"`
on the rank-C subsection) · `coverage-layout-data.json` · `core/schemas/coverage-layout.ts`
(`groups?` + subsection `id?`) · `views/coverage.ts` (`renderGroupDots` · `subCovered` · onHover
isolates the dot · **rec-card dots DELETED**) · `workspace-coverage.css` · **NEW**
`tools/test_pdm_group_goals_wallach_sourced.py` (10) · **NEW** `tools/render_probe_group_dots.js`
(13) · `tools/invariants.py` (+`pdm_group_goals_wallach_sourced`, critical/external).

### ★ THE REC-CARD DOTS ARE DEAD — and the reason is MEASURED, do not "unify" them with the group dots
`goalIds` lights a goal on **ANY** member → 66/155 products lit **all 14** goals; every top-4 card
lit all 5. **A %-threshold does NOT fix it** — at 10/25/50 **and 100%** of the Wallach target all
four top cards still lit all five, because the ranker selects for BREADTH so the products that
reach the list are broad multis. Weighting: the 3 broad multis sit at **0.29–0.54 on every goal**.
Luneth: **keep the border** (*"ANY recommendation is going to be good for ANY goal in 95%+ of
cases"*), **drop the dots**. `goalIds`' any-member rule is **deliberately UNCHANGED** — it is a
border tint, not a claim.
★ **Why group dots are NOT the same mistake:** rec dots lit ~100% of the time (a constant); group
dots light all-five only **6.3%** of the time, modal case **3 of 5** (a fact about your goals).

### ★★ HIS STANDING RULINGS THIS SESSION (never re-litigate)
- **§00.A binds HIM too.** He retracted his own experience-based endorsement of joint-pain /
  sharper-thinking / skin-and-hair: *"Wallach's doctrine trumps my reported benefits."* All three
  survived on the corpus alone. **An outside AI's benefit list is NOT a source** — its most
  specific claim (glucose handling via chromium/vanadium) had ZERO corpus support.
- **Longevity as a 15th goal: DECIDE LATER** (he parked it). All 90 would light; he wondered
  whether to include it anyway to teach that longevity needs all 90.
- **Careful with attribution breadth:** *"having ALL (or what will feel like ALL) tiles light up
  on every goal will make the goal system feel cheap and pointless."* That is why the group is ONE
  dot, not 34 rings.

---

## ★★★★ THE NEXT ORDER — Luneth's call. Coverage is done; the blueprint's other two surfaces are next.

`chronicle/coverage-regimen-scanner-blueprint.md` is **SIGNED OFF** and is the authority for all
three surfaces. **Read it before starting either.**

1. **REGIMEN** (`views/regimen.ts` **BURNS** — `state/regimen.ts` does NOT: it is the five §31
   chokepoints under a CRITICAL gate). It has **NO STYLESHEET and never had one** — 68 of its 72
   classes have no rule in any of the 8 sheets the shell links; its CSS is still trapped in the
   unextracted `dashboard/components/workspace-regimen-v3-PROPOSAL.html`. It renders as
   browser-default HTML, is mostly FABRICATED demo data (5 fake cartridges, 4 fake recs, 2 fake
   wishlist items), and **no render probe drives it** — which is why nobody caught it. The P3 slot
   spine (`rgSlots_v1`, 6 slot ops) already exists in state and is gated; the tab has no UI for it.
2. **SCANNER** (`views/scanner.ts` BURNS). D2: **identify-not-transcribe** for the 215 known,
   paste-or-type for third-party, OCR assists but is never load-bearing. ⚠ **The scanner premise
   that had to be corrected — do not let it back:** "you read all the YGY labels at 99%+" was
   CLAUDE (a large multimodal model), **not Tesseract.js**. The app is offline-first forever;
   there is no Claude in that browser.
3. **Other live gaps:** the Command Palette does not exist (`views/palette.mount` throws; ⌘K is
   bound to nothing) · `addItem` accepts ONLY exact matches against the 215-product vault, so
   there is **no path to add a custom third-party product except scanning** (blocks his "their own
   brands / ultimate freedom").

**His SIX locked blueprint calls (§1 — never re-litigate):** D1 Wallach's dose where a sealed
claim doses the PRODUCT, label directions otherwise (NOT the RDA) · D2 identify-not-transcribe ·
D3 autosave everywhere, the slot IS live state · D4 the rail shows the ACTIVE SLOT's name,
read-only; switching lives in Regimen · D5→**D8 REVERSED** (no `category` field: *"way too much
work for way too little gain"*) · D6→**D7 REVERSED** (P1/P2 pillar work DROPPED).

### ★★★★ `chronicle/essential-special-cases.md` — THE CLARITY-PASS REGISTRY
**Luneth: "any special cases NEED to be visible and easily understood by the user when they click
into an element view — doesn't need to be done now but these 'special cases' need to be logged and
remembered so we can apply them in a later 'clarity pass'."** ★ Rule 1: **a new special case lands
there in the SAME CHUNK that creates it.**
✓ **REGISTERED 2026-07-16 — entry 9.** The plant-derived GROUP's goal membership is now in that
file, with every fact MEASURED rather than inherited.

★ **THE SENTENCE THAT USED TO SIT HERE WAS FALSE IN BOTH HALVES** — recorded so no session
re-inherits it. It read: *"A user clicking STRONTIUM sees a tile with no individual target that
nonetheless belongs to two goals as part of a group."*
- **Strontium's individual goal membership is 0, not 2** (0 of 14 goals name it; negative control —
  the same matcher finds calcium in 12). **The group names 9, not 2.** The "two" was a real number
  read off the **WRONG PATH**: `WAL-CLM-DDDL-000032` maps osteoporosis + arthritis → stronger-bones
  + less-joint-pain, which is strontium's **COUNTERFACTUAL** membership if `EXCLUDE_PLANT_DERIVED`
  were `False` — precisely what the flag suppresses. Copying it forward would have sent the clarity
  pass to register the wrong behaviour on the wrong element.
- **"A user clicking STRONTIUM sees…" — they see nothing of the sort.** The dots render on the
  PLANT DERIVED **subsection label** only, never on a tile, and **the Coverage tile click is
  INERT**. Group goal-membership is absent from the entity page entirely. The real debt is bigger
  than the sentence implied: the surface where the question gets asked is silent, and the surface
  that answers it is one 7×7 px dot on a heading spanning 34 tiles.
