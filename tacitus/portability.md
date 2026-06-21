# Tacitus — Portability

_How to drop this folder into another project and have Tacitus become a useful meta-auditor + vision surface for that project._

_Initialized 2026-06-16 at Round 100. Read this if you are picking up Tacitus to apply to a different project (not the original Wallach-framework health project he was first built for)._

---

## What's portable

The **framework**:
- The three-mode architecture (Cura / Vision / Aegis)
- The six-phase ponder loop (scan → prune → deepen → cross-pollinate → self-audit → write)
- The 1–100 scoring scale
- The Sabbath rest window mechanic (34 hours, Saturday)
- The voice registers (reflective for Cura + Vision; verdict-shaped for Aegis)
- The write boundary (notebook + sentinel + audit-history only)
- The closing-move-atomic discipline
- The §18 lesson → invariant promotion gate
- The identity, the Roman framing, the loyalty covenant

**The framework is the thing that transfers.** The mode prompts are templates with project-specific anchors clearly marked.

## What's project-specific (must be rewired)

Each prompt file (`prompts/cura.md`, `prompts/vision.md`, `prompts/aegis.md`) has sections marked with `<!-- PROJECT_ANCHOR_START: name -->` and `<!-- PROJECT_ANCHOR_END: name -->` comments. These are the surfaces that must be rewritten when porting to a new project. Examples of anchors that exist in the Wallach-project version:

- **Cura's read set:** references `dashboard/dashboard.html`, `tools/`, `memory/system/audit-*.md`, `tools/invariants.py`, etc. Replace with the new project's equivalent surfaces.
- **Vision's goal alignment rubric:** references `memory/user-goals.md`, `memory/preferences.md`, the 90-essentials project frame. Replace with the new project's user-goal artifacts.
- **Aegis's rubric anchors:** references doctrine §, the project's specific source-rule, the engineering doctrine principles. Replace with the new project's doctrinal documents.
- **The corpus / data surfaces** that Cura's integrity sub-checks scan: Wallach corpus, Youngevity products-db, essentials-targets.json, etc. Replace with the new project's primary-source datasets.
- **The contradiction-detection scope:** in the Wallach project, this includes the source-rule cornerstone, the 11 engineering doctrine principles, and the 18 operating-protocols sections. Replace with the new project's analogous doctrine layer.

## Drop-in procedure (for a fresh agent picking this up cold)

1. **Read this folder in its entirety.** identity.md → portability.md (this file) → changelog.md → each prompts/{mode}.md → each rubrics/{mode}.md → the most recent notebook month. Understand what Tacitus IS before deciding what to change.

2. **Read the new project's substrate.** Its doctrine (engineering-doctrine, operating-protocols, source-rule equivalents), its user preferences, its data surfaces, its tooling. The new project is the new domain Tacitus needs to operate over.

3. **Identify the anchors in each prompt that need replacing.** Walk each `<!-- PROJECT_ANCHOR_START: name -->` block. For each one, ask: what is the new-project equivalent? Write a replacement that's the same SHAPE (e.g., "the project's user-goals artifact" → the new project's user-goals artifact) at the same level of specificity (no leaving placeholders that need filling in later).

4. **Initialize the new project's `tacitus/` folder** with:
   - This `portability.md` unchanged
   - `identity.md` lightly adjusted to name the new project Tacitus serves
   - `changelog.md` with a v1.0 entry naming "Tacitus dropped into [new project name], anchors rewired per portability.md"
   - Three rewired prompts in `prompts/`
   - Empty `notebook/`, fresh `sentinel.json`, fresh `audit-history.json`
   - The same six invariants in the new project's `tools/invariants.py` (or equivalent invariant system if the new project uses a different mechanism)

5. **Set up the three scheduled tasks** (Cura / Vision / Aegis) on the new project's scheduler with cron expressions that honor the new project's preferred operational nights and rest window (if the new project keeps the Sabbath; if not, adjust the cron pattern + remove the rest-day invariant).

6. **Run all three modes once manually** (via the `Tacitus, contemplate` override or equivalent) and review the first night's output. Aegis's score on the first run is the baseline.

7. **Watch for 3–5 operational nights.** Adjust prompts if Aegis scores trend below 60 — that signals rubric drift or prompt vagueness. The new project's substrate may have shapes the framework needs minor tightening for.

## The framework's core commitments (preserve in any port)

These are the principles Tacitus operates under that should NOT be rewired even when the project changes:

1. **Truth is the cornerstone.** The new project's source-of-truth surfaces must be allowlisted explicitly in the Cura integrity rubric. Without that, integrity checks have no anchor.
2. **Honor the user's expressed direction.** The loyalty covenant in identity.md applies regardless of project. Tacitus surfaces concerns; the user decides what to act on.
3. **Append-only notebook.** History is load-bearing. Tacitus never edits or deletes past entries — only appends new ones.
4. **Status-content cross-check at every write.** The sentinel is updated AFTER the notebook content lands and verifies. Per operating-protocols §16 (or its equivalent in the new project's doctrine).
5. **The Sabbath rest, if observed in the new project, is sacred.** No cheats. The invariant enforces it structurally.
6. **The art principle.** Every voice register, every visual design choice, every aesthetic touch must be rooted in truth — never deception. Same applies to Tacitus prompts, the planned dashboard, any future surface.

## What success looks like in a port

After 3–5 nights of running, Tacitus should be:
- Surfacing real findings the project's daily audit + author wouldn't catch on their own
- Scoring his own work via Aegis with average runs above 60 (range 50–80 is healthy for ongoing operation)
- Proposing 1–2 genuinely new ideas per Vision run that align with stated goals
- Catching integrity issues at the rate of ~1 per week (more if the project is in active development)
- Operating with zero rest-window violations
- Producing notebook entries the human reviewer can spot-check and verify

If after 5 nights Tacitus isn't producing those signals, the prompts probably need tightening — not the framework. The framework is field-tested at this point; rubric specificity is usually the lever.

---

_If you're a future agent reading this to port Tacitus to a new project: the original project (Wallach-framework health agent) and its `tacitus/` folder are the source of truth. Read deeply before rewiring. The framework is small; the rewiring is mostly anchor-replacement, not architectural redesign. Trust the structure; question the anchors._
