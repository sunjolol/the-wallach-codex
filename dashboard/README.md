# Dashboard

A self-contained personal health dashboard built on the Wallach-framework agent. Generated from the user's `memory/user-*.md` files, the `memory-change-log.md` history, and the `knowledge/essentials-targets.json` data foundation.

## How to view

Open `dashboard.html` in any browser. No server, no install, no network connection required. It's a single HTML file with inline CSS and JS — every dependency is bundled.

## How to regenerate

Type a bare-word `dashboard` message to the agent (case-insensitive, no other text). The agent will:
1. Read the user profile files + memory-change-log + essentials-targets.json
2. Recompose `dashboard.html` from current state
3. Present the file

**Bare-word trigger only.** "Tell me about the dashboard" or "what's on the dashboard?" will get a conversational response, not auto-trigger generation. The signal is the standalone word.

## Structure

```
dashboard/
  dashboard.html      The current/latest generated view (single self-contained file)
  README.md           This file
```

Future versions may add:
- `dashboard/archive/YYYY-MM-DD-HHMM.html` — historical snapshots for journey tracking
- `dashboard/generate.py` — portable Python generator (activated when the system is "shipped")

## Four top-level tabs (v1.5 — consolidated from 7)

The dashboard collapses to four intent-based groups. **You** and **Knowledge** carry sub-navigation; **Journey** and **Label check** are standalone.

### You (subnav: Snapshot / Regimen / Gaps)
Everything about the user's current state.

- **Snapshot** — identity, three goals (with Wallach anchor + top SKU per goal), current stack with alignment badges, active recommendations, open follow-ups (e.g. labs needed), visible-gap fields the system doesn't know yet.
- **Regimen** — unified itemized view of every supplement, diet item, label-added product, and recommendation, with per-card edit/outcome/remove controls. localStorage overrides on top of canonical `user-stack.json`. **Full edit** on each card jumps to Label Check with the form pre-populated for a complete nutrient + ingredient re-scan.
- **Gaps** — 90-essentials coverage estimate. For each essential: Wallach's stated baseline target dose, the user's current estimated intake from the supplement stack, and a coverage badge. Filterable by category (minerals / vitamins / amino acids / fatty acids) or "gaps only." **v1 limitation:** dietary contribution to coverage is not counted. Read gaps as "what your supplements alone don't cover," not "what you're deficient in."

### Journey
Chronological view drawn from `memory-change-log.md`, filtered to user-relevant events. Reads like a journal of the system + user growth together.

### Knowledge (subnav: WHY-layers / Tools & capabilities)
Reasoning surface — what the framework knows and how to interrogate it.

- **WHY-layers** — 10 corpus-grounded reasoning maps (cognition, hormones-strength, longevity, joints-recovery, blood-sugar, eyes, boron-bone, gut-digestion, cardiovascular, thyroid-endocrine) with three-tier source tagging (wallach-direct / wallach-mechanism-extension / framework-adjacent).
- **Tools & capabilities** — the 6 corpus-grounded CLI tools (`corpus_search`, `symptom_lookup`, `stack_coverage`, `conflict_detector`, `lab_interpreter`, `catalog_index`) + `label_scorer` with brief descriptions and example invocations.

### Label check
Scan any product (Youngevity or non-YGY) against the Wallach framework + your personal coverage. Image drop zone + OCR + nutrient table + ingredients parser. Verdict: **ADD**, **REJECT**, or **SAVE FOR LATER**. Persists wishlist + recent scans + regimen items to localStorage. Also functions as the **Full edit** target for existing regimen items — when reached via the Regimen card's Full edit button, the form pre-populates and a Save changes flow updates the regimen item in place.

## Data sources

The dashboard reads from:

| File | What it provides |
|---|---|
| `memory/user-health-profile.md` | Identity, conditions, medications, allergies, visible-gap fields |
| `memory/user-diet-supplement-log.md` | Current stack, doses, diet patterns, food sources |
| `memory/user-goals.md` | Three goals + Wallach anchors + top SKU recommendations |
| `memory/user-prefs/` (directory) | User preferences in specialized-units-with-index pattern: `index.md` (hub) + 3 cross-cutting (`communication.md`, `lifestyle.md`, `aesthetic.md`) + 14 body-system files matching the GOAL_DISPLAY_NAMES taxonomy. Read entire directory for full prefs state. See `memory/operating-protocols.md` Specialized-units pattern doctrine. |
| `memory/user-symptom-history.md` | Self-assessed status, follow-up items, things not yet asked |
| `memory/memory-change-log.md` | Chronological event source for the journey tab |
| `knowledge/essentials-targets.json` | 90-essentials data foundation (Wallach baseline doses per essential) |

## Portability note

The dashboard's offline-by-design HTML is the first concrete instance of the portability commitment in `essence/decisions.md`. When the system is signaled "ready to ship" by the user, the dashboard already runs without modification — open the HTML on any machine, on any OS, with no install. The future portable bundle just adds a Python generator script so the user doesn't need an agent session to regenerate.

## Doctrine alignment

The dashboard is a view layer. It must not introduce mainstream metrics as if they were Wallach's (e.g., USDA RDAs). All "target dose" figures come from Wallach's corpus — Let's Play Doctor baseline supplement table, condition-specific protocols in LPD/DDDL, Rare Earths element entries. Where Wallach is silent on a specific essential (most rare earths), the dashboard says "trace via PDM" — Wallach's own group-coverage framing — not a mainstream substitute.

Macros/calories will eventually arrive as a separate optional tab — never pushed, treated as a discipline tool for the user's own self-awareness, never elevated to dashboard centerpiece. Doctrine §11 firewall extends to what we measure: Wallach metrics central, mainstream metrics optional/peripheral.

## What it won't do

- Connect to the internet (no analytics, no CDN, no fetches)
- Push notifications or reminders (the system meets the user where they are)
- Require daily logging (passive tracking is the default)
- Override the agent's reasoning — this is a view, not a logic layer
