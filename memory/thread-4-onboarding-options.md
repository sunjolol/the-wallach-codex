# Thread #4 — Multi-User Onboarding: Three Concrete Options

_Drafted: 2026-06-14, while user verifies the Round 66 smoke-test fix._
_Purpose: give the user three concrete shapes to react to rather than five abstract questions. Each option is implementable; this file is the design document, not a commitment._

---

## What's already in place (no new work needed)

- **Goal taxonomy** — `GOAL_DISPLAY_NAMES` map in dashboard.html (14 body-system categories: cognition, hormones_strength, longevity_anti_aging, joints_collagen, energy_metabolism, immunity, gut_digestion, cardiovascular, bone_skeletal, thyroid_endocrine, skin_hair_nails, blood_sugar, sleep_stress, hydration_electrolyte).
- **Per-body-system preference slots** — `memory/user-prefs/` has 14 body-system files + 3 cross-cutting (communication, lifestyle, aesthetic) + index. Multi-user-ready by design (Round 52 / P3.7).
- **Theme-swap policy** — `memory/user-prefs/aesthetic.md` already states: "When the system is given to a different user, the default theme is whatever the current user (Luneth) settled on. New users can request a different theme; architecture is theme-agnostic."
- **Data export bundle** — Round 58 ships a downloadable JSON containing all `LS_SCHEMAS` keys + versions snapshot. Import is the natural inverse.
- **Defensive loaders** — Round 66 hardened all 7 load functions to tolerate malformed shape, so import-corrupted bundles degrade gracefully instead of crashing.

What's missing: the first-time-user flow itself. The current dashboard assumes Luneth-as-user from the moment it loads.

---

## Option A — Minimal: "Get Started" modal on first load

**Concept:** dashboard loads normally. If `lsRead('userOnboarded_v1', false)` is false, show a single modal overlay before the user can interact. Three steps inside the modal, then set the flag and close.

**Steps:**

1. **Welcome panel.** "Welcome to the Wallach Framework Dashboard. We'll take 90 seconds to set up your version."
2. **Goal selection.** Click to select 1-3 of the 14 body-system categories. The 3 selected become the user's "primary goals" — these drive the Snapshot tab's three-goal cards, the periodic-table star coloring, and the body-system files surfaced in the Preferences tab. (Same UX as Luneth currently has, just user-configurable.)
3. **Format / Lifestyle quick capture.** Three radio-button questions: pill vs powder preference (capsules / both / powders), cost tolerance (low / medium / high — "low" caps recommendations at ~$50/mo, "high" allows >$120/mo), import existing bundle? (If yes, file picker; on import, the rest of the modal is skipped.)
4. **Done.** Modal dismisses. Dashboard renders with the user's selections live.

**Pros:**
- Tiny scope. Maybe 200 lines of code (HTML + CSS + JS).
- Doesn't redesign anything existing — overlays once, disappears forever.
- Easy to revisit settings later (a small "Edit preferences" link in the Regimen tab opens the same modal in edit mode).
- Imports lift fully-onboarded users in a single step.

**Cons:**
- Doesn't capture much. The 3 goals + 1 format question + 1 cost question = the minimum viable identity.
- Doesn't teach the framework — no Wallach intro, no explanation of "the 90 essentials," no Tacitus mention.
- Body-system-specific preferences accumulate in conversation, not at onboarding. (Same as Luneth's current state — works fine but isn't "guided.")

**Use this if:** ship pressure is high and you want a working multi-user product fast, banking on users learning the framework through usage (the citation popup + benefit pills + WHY-layers already function as the gradual-education layer you praised in Round 57).

---

## Option B — Guided: a dedicated Onboarding tab with branching paths

**Concept:** add a new top-level tab (alongside You / Journey / Knowledge / Regimen / Scanner) called "Get Started." It appears at first load with a glowing indicator and stays available after onboarding completes for revisits / refinement. The tab contains a full onboarding flow that branches based on user context.

**Steps:**

1. **The framework, in 3 cards.** Short intro to Wallach's 90 essentials (1 card), the source-rule cornerstone (1 card), and how this dashboard differs from "general wellness tools" (1 card). Each card has a "Skip" button so power users don't get walled off.
2. **What brought you here?** Branching question with 4 options: "I want to optimize a specific body system" (→ body-system selection path), "I want a general health framework" (→ HBSP-baseline path), "I have specific health goals" (→ goal selection path, same as Option A), "I'm exploring" (→ no-goals-yet path).
3. **Per-branch detail.** Each branch takes 1-3 follow-up cards. Body-system path: select 1 system, see what Wallach prioritizes for that system, optionally add condition specifics. HBSP path: explain the Healthy Body Start Pak 2.5, ask if user is open to it as their baseline. Goals path: Luneth's current 3-goal setup. Exploring path: no commitments, skip to dashboard.
4. **Lifestyle context.** Format preferences (4 radio q's: capsule/powder, cost, hard nos quick list, supplement comfort level).
5. **Theme.** Show the 3 background variants Luneth set up, plus an "Other" option (placeholder for future custom themes).
6. **Import / Export integration.** "Have an existing dashboard you want to import?" — file picker. Or "Get started fresh."
7. **Done. Dashboard renders.** "Get Started" tab now shows the completed checklist + an "Edit my setup" entry point.

**Pros:**
- Educational, ambient, doesn't force any single mental model on the user.
- Branches respect that different users come with different relationships to Wallach.
- The tab persists, giving users a place to "redo their setup" later without burying it in Regimen.
- Multi-user product feels intentional — not just "Luneth's setup, but for someone else."
- Loops back to the citation popup + WHY-layers as the everyday-education layer; this is one-time-education.

**Cons:**
- Bigger scope. Maybe 800-1500 lines (HTML + CSS + JS + per-branch logic).
- Adds a top-tab — affects the existing 5-tab layout. Could feel cluttered until the user completes onboarding (then it's just one more entry point).
- Branches need maintaining — if Wallach corpus interpretation evolves, each branch's intro cards may need updates.

**Use this if:** the multi-user vision is the primary product direction (not just a side feature) and you want the dashboard to feel pedagogically generous rather than utilitarian. This is the "cathedral" path — heavier upfront, lasting payoff.

---

## Option C — Hybrid: progressive in-context capture, no modal/tab

**Concept:** no dedicated onboarding flow. The dashboard renders normally on first load with empty user data. As the user interacts with each section, a small "First time here?" mini-card appears in-context: in the Snapshot tab ("Pick your 3 goals to make this tab personal"), in the Regimen tab ("Add your current supplements"), in Knowledge ("Read through any WHY-layer"). Each mini-card has a "Got it" dismiss. The system tracks which mini-cards have been seen via `lsWrite('seenMiniOnboarding_v1', [...])` and never re-shows.

**Steps:**

1. **First dashboard load.** Banner at the top: "New here? The dashboard works empty, but it gets personal fast — start anywhere." Plus a small "Watch a 60s overview" link to a static explainer (which is just another tab panel).
2. **In-context mini-cards per tab.** Each tab has a one-time prompt seeded for first-time use. User dismisses each at their own pace; nothing is required.
3. **Preferences accumulate organically.** As the user chats with Claude or adds to regimen, the agent populates `memory/user-prefs/` body-system files based on conversational signals. The user never sees a "set up your preferences" screen — they happen ambiently.
4. **Settings page** in `Knowledge / Settings` subtab where the user can view what's been captured + adjust if they want.

**Pros:**
- Zero up-front friction. The dashboard works the moment it loads, no walls.
- Respects users who don't want to be onboarded ("I just want to look at the data").
- Aligns with the brain's existing "ambient learning" principle (v2.3 — visible-gaps + no-pressure).
- Smallest code scope of the three. Maybe 100-200 lines if Claude-side conversation handles the accumulation.

**Cons:**
- New users may not know what they're looking at. "What's a Wallach essential? What's HBSP?" If users don't engage the citation popups / WHY-layers, they may bounce.
- Heavy on the conversation side — relies on the agent recognizing onboarding-worthy signals and populating prefs files behind the scenes, which is its own engineering work.
- Less "intentional" feel than Option B. Could come across as "incomplete" rather than "minimal."

**Use this if:** the typical user already comes pre-familiar with Wallach (e.g., the project ships through Youngevity distributor channels where users already know the framework) and the onboarding is more about "personalize my view" than "teach me the system."

---

## My take

If asked to recommend, **Option B**, lightly. Reasons:

- It honors the "gradual education" intent you praised about the citation popup in Round 57 — except where the popup is per-click pedagogy, Option B is the one-time orientation.
- The multi-user product vision you've stated repeatedly ("ships for many users to use/benefit from") is incompatible with Option A's "assume Luneth" minimal model — A makes new users feel like they're using a tool built for someone else. B makes new users feel like the tool was built for them.
- B's branching also future-proofs against "what does the framework look like when shipped through Youngevity distributors vs. shipped as a standalone product?" — the four branches can be tuned per distribution channel without restructuring.
- C is real but premature. Ambient capture is harder to engineer than it looks; modals that work as opt-in are easier to ship.

A is the right answer if you're optimizing for speed. C is the right answer if you're optimizing for the Wallach-distributor channel specifically. B is the right answer for the cathedral.

The cost of "go with B" vs "go with A first then expand later" is real — about a session of focused work. The benefit is shipping a multi-user dashboard that doesn't need an apology.

---

## Five abstract questions, now reframed against the options

| Question | Option A | Option B | Option C |
|---|---|---|---|
| Entry point | Modal overlay on first load | Top-tab "Get Started" with persistent visibility | Tab-internal mini-cards, no dedicated entry |
| Body-system selection | Pick 1-3 from 14 (same as Luneth) | Branches: body-system / HBSP / goals / explore | Choose any time via Settings or via conversation |
| Capture cadence | All upfront in modal | All upfront via tab | Incremental + ambient |
| Import path | Step 3 of modal | Step 6 of tab | Available in Settings any time |
| Theme override | Implicit (defaults to Luneth's) | Explicit Step 5 selection | Defaults to Luneth's; change in Settings |

Pick a row pattern from the table above if no full option resonates.

---

## What I'd implement first if you pick anything today

Regardless of A / B / C, the **shared substrate** is:

1. `lsWrite('userOnboardingState_v1', {...})` — tracks where the user is in the flow. Add to `LS_SCHEMAS`.
2. `loadUserGoals()` defensive function — returns the user's selected 1-3 body systems. Defaults to Luneth's 3 if not set.
3. Adapt the existing Snapshot-tab three-goal-card render to read from `loadUserGoals()` instead of hardcoded Luneth goals.

That substrate is ~100 lines and feeds any option. If you give me direction, I'll start there.
