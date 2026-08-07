# ★ NEXT SESSION — try Vitamin D again (the header), on a clean slate

The blocker that made Vitamin D fail 5–6 times is FIXED (below), the workbench is tidy, and the board
is 90/90. This session is set up for one thing: a fresh Vitamin-D element-header attempt.

## Why it will go differently this time
The header kept regressing to small static SVG diagrams even though Luneth asked for bold, beautiful
sun imagery. Root cause (postmortem: `chronicle/vitamin-d-header-regression-postmortem-2026-08-07.md`):
the 2026-08-03 sweep LIBERATED the `element-headers` skill ("not limited to static SVG; animation,
imagery, canvas encouraged") but left ~10 always-loaded header MEMORIES enforcing the OLD static-SVG
regime (a 12px label ceiling, "copy the last header," "fewest marks," "undershoot"). Memory loads every
turn; a skill only on match — so the stale memories won every turn. **Now fixed:** three memories
reframed + a new `always-loaded-memory-overrides-on-demand-skill` meta-lesson. Trust the skill.

## How to run the Vitamin-D attempt
1. READ `.claude/skills/element-headers` (liberated) + `chronicle/header-research/vitamin-d.md` +
   `chronicle/header-research/design-prep/vitamin-d.md` + `chronicle/demo-revamp-brief.md` (his verdicts).
2. His direction (demo-revamp-brief): go DEEP on SUN EXPOSURE; beautiful sun imagery — *"go crazy with
   sun / sunlight / beach / skin — fun (but adult, through solid modern design)"*; fight
   cholesterol-avoidance (eggs) and sunscreen; tie it all to vitamin D. Honest limits: Wallach attacks
   the FEAR of skin cancer, not the oncology; he is two-sided on sunscreen (brief §"TWO HONEST LIMITS").
3. Build **4 genuinely distinct mockups** — different layout AND illustration, NOT four static diagrams.
   Reach for the form the content deserves (canvas, animation, real imagery). Tone to beat: the archived
   r3 panel A (a day→night sun canvas) — the ONE panel that hit the bar — at
   `temporary/recycling-bin/_purged-2026-08-07/vitamin-d-demos-r3.html`.
4. Mock up in the real container via `python tools/mockup_harness.py`. Luneth picks → port composed →
   **STOP for his visual sign-off**. Never build live without his explicit approval.

## Where things are (temporary/ was reorganized this session)
- `temporary/completed-headers/` — 5 live headers (Ca, Cu, Zn, Mg, Vit A)
- `temporary/awaiting-refinement/` — Vitamin C r2, Vitamin E (liked, not finalized)
- `temporary/demos/` · `images/` · `header-fragments/` · `build-scripts/` · `notes/` · `recycling-bin/`
- `temporary/demo-index.html` — the workbench (regenerated, no dead links)
- Old Vitamin-D rounds live in `recycling-bin/_purged-2026-08-07/` if you want to see what failed.

## Board / repo
- Invariants 90/90. Committed + pushed to origin/master this round. `temporary/` is fully OFF GitHub now
  (the one force-added file was untracked); it remains in old history only (a scrub needs a force-push — ask first).

# ⚠ Still binding
The twin-card gate (`search_no_twin_questions`) and the Aug 3–5 / dedup deletions stay as they are. OPEN
for Luneth's call (postmortem §"Flagged"): the 5 header-memories → skill consolidation, the `figure.width`
mech/fork/rail enum, grouping the big `temporary/` work folders, and a `/consolidate-memory` pass.
