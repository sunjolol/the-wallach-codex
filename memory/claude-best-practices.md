# Claude Best Practices — Reference standard for writing rules/lessons/doctrine

_Created 2026-06-19 (Round 135). Manually maintained. Refreshed when major Anthropic guidance lands. This file is Cura's measuring stick when running the **Translation-quality** Phase-1 sub-check._

## Purpose

Every documented discipline in this project (lessons, doctrine sections, invariant descriptions, operating-protocols entries) must be written in a way that a fresh Claude session — opening current.md cold, with no other context — can READ and APPLY correctly. This file is the standard against which Cura measures translation quality.

## What Cura cannot fully know

Claude has a training cutoff. Anthropic's guidance on writing for Claude evolves. This file is a SNAPSHOT, manually refreshed. Cura should treat it as the current reference but acknowledge that newer guidance may exist. When Cura's translation-quality scan flags an entry that violates a principle below, the proposed rewrite should cite the specific principle by number (e.g., *"violates §2: anchor sentence at top"*).

When Anthropic publishes new guidance:
- The user manually updates this file
- The next Cura nightly run picks up the change automatically (reads this file each session)
- No code change required

If Cura finds itself unable to evaluate a translation because the principle isn't covered here, the right move is to file a candidate for this file's expansion rather than guess. Surface as: *"file `memory/claude-best-practices.md` should add a section on X; current text gives no guidance for evaluating Y."*

## Principles (numbered for cite-ability)

### §1 — Anchor sentence at top of every lesson

Every lesson entry must open with a single sentence that compresses the rule. Cura/future-Claude scans this anchor first. If the anchor doesn't make sense alone, the lesson fails. Format:

> **(YYYY-MM-DD at H:MM PM) — [Anchor sentence stating the rule in a way a stranger could apply it.](Round N / brief context).** [Expanded prose follows...]

**Bad:** *"In Round 131 there was a bug where showLcModal..."* — starts with the incident, not the rule.

**Good:** *"Any helper defined inside an IIFE that needs to be called from outside MUST be explicitly exposed via `window.X = X`."* — starts with the rule a future Claude could apply to ANY case.

### §2 — Generalizable: prefix for the rule-extraction sentence

Every lesson must include a sentence beginning with `**Generalizable:**` that names the pattern in a form applicable to NEW situations, not just the original incident. This is the rule-extraction step. Without it, the lesson reads as one-off war story; with it, it reads as a transferable principle.

**Bad:** *"The fix was to add window.showLcModal = showLcModal."*

**Good:** *"**Generalizable:** any helper defined inside an IIFE that needs cross-IIFE access MUST be exposed via window.X = X inside the defining IIFE, AND callers MUST read it from window. Bare-name resolution only works within the IIFE's lexical scope."*

### §3 — Cite the mechanizable pattern if one exists

If the rule has a grep-able / lint-able / regex-detectable signature, cite it explicitly. This is what allows the rule to become an invariant later (§18 promotion).

**Bad:** *"Don't surface raw keys to the user."*

**Good:** *"Don't surface raw keys to the user. Detection: grep dashboard.html for `escapeHtml(item.<key-field>)` not adjacent to `displayName()` / humanizer call. Filed as `check_raw_key_surfacing` invariant."*

### §4 — Name the failure family, not just the instance

If a bug rhymes with prior bugs, name the family explicitly so future Claude can recognize the shape. Cross-reference past round numbers.

**Bad:** *"computeSlotStats couldn't see REGIMEN_BASE_DATA."*

**Good:** *"Cross-IIFE silent fallback — a recurring failure family. Same shape as Round 28 (Periodic Table couldn't see getUnifiedRegimenItems) and Round 131 (confirmDeleteSlot couldn't see showLcModal). Family: typeof X returns undefined silently when X is in another IIFE, defensive fallback succeeds, bug ships clean integrity."*

### §5 — Brevity-first, no nested clauses past two levels

Claude tokenizes left-to-right; deeply nested clauses fragment attention. Cap sentence depth at two clauses. Break long sentences into shorter ones. Use bullets when more than two parallel ideas.

**Bad:** *"When a check verifies A == B, it must also pin to an external truth anchor that can't drift with A or B because without the anchor the check verifies consistency not correctness because both surfaces could be stale-equal in a way that passes the check but represents shared error."*

**Good:** *"Every check must pin to a truth anchor that can't drift with the things being checked. If A == B but both can drift together, the check verifies consistency, not correctness."*

### §6 — Imperative voice for actionable rules

Use "MUST", "DO", "NEVER" for rules. Avoid hedges like "consider", "might want to", "could potentially". Future-Claude reads hedges as optional; they don't survive the next session.

**Bad:** *"Consider running the integrity tool after writes."*

**Good:** *"After any write to dashboard.html, run `python3 tools/dashboard_integrity.py check`. Required."*

### §7 — Cite paired invariant or explain absence

Round 135 §25 codified: every lesson must either name its paired invariant OR explicitly note "no invariant possible because <reason>". This is part of the closing-move-atomic principle for lessons.

**Bad:** *"...the structural fix is X."* (no mention of automation)

**Good:** *"...the structural fix is X. Paired invariant: `check_X` in `tools/invariants.py`."* OR *"...no paired invariant possible — this is a judgment-call lesson that depends on human/Claude reading."*

### §8 — Concrete examples beat abstract description

When a rule is hard to grok abstractly, include a 1-2 line code/text example showing the bad and good shapes side-by-side.

**Bad:** *"Use the canonical display map for goal labels."*

**Good:** *"Use the canonical display map for goal labels. Bad: `escapeHtml(goal_key)` renders `LONGEVITY_ANTI_AGING`. Good: `escapeHtml(displayName(goal_key, GOAL_DISPLAY_NAMES))` renders `Longevity / anti-aging`."*

### §9 — User-direction quotes carry weight; tag them

When a lesson originates from explicit user direction, quote the user verbatim (paraphrasing loses force) and tag it `*"<verbatim quote>"* — user`.

This anchors the lesson to the human authority that established it; future Claude treats user-quoted rules with higher priority than agent-derived rules.

### §10 — Avoid jargon that won't survive without context

Acronyms, in-jokes, and one-time-only references all need to be explained on first use within the lesson, OR linked to where they're defined. A fresh Claude reading the lesson cold should not need to search elsewhere to understand it.

**Bad:** *"The HBSP issue surfaced because PDM trace mins were already counting via the §10 fallback."*

**Good:** *"The HBSP (Healthy Body Start Pak — Wallach's 90-essentials product trio) issue surfaced because PDM (Plant-Derived Minerals — the trace-mineral source in Beyond Tangy Tangerine) was already counting via the §10 fallback (operating-protocols.md section 10)."*

## How Cura uses this file

Each night during the **Translation-quality** Phase-1 sub-check:
1. Read this entire file (current standards).
2. Sample 3–5 entries from `memory/essence/lessons.md` per the rotation cursor.
3. For each sampled entry, evaluate against §1–§10.
4. If 2+ principles are violated OR any single principle is severely violated, surface as a candidate with: verbatim current text + proposed rewrite + principle citations.
5. Cap LANDs at 2 per night to prevent flooding.

## Maintenance

When a user observation refines or extends best-practice guidance, append a new numbered section here. When external Anthropic guidance lands that conflicts with a section here, mark the section `[NEEDS REVIEW — see <date>]` and add the new guidance as a candidate section below.

---

_End of file. Last manually refreshed: 2026-06-19 (Round 135 initial draft, based on training-cutoff knowledge + Round 135 lesson-vault patterns)._
