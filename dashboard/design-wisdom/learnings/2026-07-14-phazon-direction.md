# (2026-07-14 at 2:00 PM) — The PHAZON direction

_Parked, not abandoned. Recorded in full so it can be picked up cold. Luneth: "let's leave this as a reference for later"._

**References used:** #029 lukehmwood · #030 louflan · #031 sabosugi · #032 Fieve (Plasma-2) · #033 towc
**Artifacts:** `applications/phazon/phazon-dashboard-mockup.html` (the mockup) · `plasma-2-faithful-replica.html` (a byte-faithful Plasma-2 render, verified against Luneth's screenshot) · `render-phazon-*.png` (what the mockup actually looked like)
**Status:** exploration COMPLETE and parked. Nothing shipped to the live dashboard; every trace was reverted and grep-proven gone. **The one thing carried forward: a toggleable DARK THEME** (see below).

---

## The vision, in Luneth's words (verbatim)

> "I want this sort of 'phazon' style to make the interface feel like it's been infected with phazon and morphed into a half technological super advanced chozo/alien interface combined with a corrupting living 'phazon' goo that causes it to mesh into something else, **OR** a theme where the phazon is UNDERNEATH the technological elements and plates across the dashboard powering everything, it should feel like energy/fuel peaking through an advanced system of tubes and glasses and such."

> "I want this exact contained vibe at the bottom to be INTELLIGENTLY propagated throughout the rest of the dashboard so the whole thing starts to pick up this theme without straying too far from what we have already (because it is good, but we need more dark accents that allow this effect without becoming discombobulated or incoherent as an overall theme."

> "And my proposed plan may not even be best, the ONLY way to produce the overall theme I'm envisioning may be a TOTAL overhaul of ALL design elements to ALLOW for this vibe to propagate (which would mean going for a fully dark theme instead of the creme we have now)"

Earlier, the same idea from the other end:

> "a long rounded bar at the bottom showing 'plasma' peaking through a window with the bottom bar's background color and details changed as needed (or not changed) to fully sell the effect - use borders around the rounded strip so it looks indented and like a real object"

> "if this blob were contained behind a glass panel it could give a 'fusion reactor' kind of vibe where 'fusion/plasma' is the energy underneath the system making it run, little dark windows with this shining through would be cool"

On colour:

> "Yes, keep it cyan, we already have blue elsewhere in the design (albeit it's all through accents that are soon to be removed such as '// RENDERED WITH WALLACH·SYS v3.27' and 'WS·01 · COVERAGE' but the whole point of these details is to add it back in but BETTER"

---

## The read (what the 5 references + the images have in common)

Every image he supplied — Dark Samus, the phazon arm cannon, the Phazon Suit statue, the phazon landscape — is the same thing:

**Dark hard-edged plates over a living luminous substrate, with the energy escaping at the SEAMS.**

The armour's veins. The cannon's plates floating on glowing liquid. Rock split by rivers of light. The plates are technological, angular, inert. The energy is organic, flowing, alive. **The tension between them is the aesthetic** — not one or the other.

And the three properties his favourite references share, which the first three failed attempts all lacked:

| | the references | the failed attempts |
|---|---|---|
| motion | true randomness — `Math.random()` per frame, no period | `sin(t)` — a loop wearing a costume |
| form | blobs that MERGE into liquid, or noise fields with voids | strokes — i.e. wire |
| framing | CONTAINED in a window with a glowing rim | an unbounded 235px band |

Containment is not decoration. **A thing bounded and pushing at its wall reads as alive; the same thing sprawling reads as wallpaper.**

## The bet that worked

**Coverage's plate language already carries this.** The tiles already lift off a recessed substrate — make the substrate PHAZON and the theme propagates through the app's own existing grammar instead of being pasted on top:

- a **covered** tile = one the energy has reached → lit from beneath (the Dark Samus shoulder-pod read)
- a **partial** tile = the infection climbing it → a real fill level welling up
- a **gap** tile = inert armour + an amber seam (amber is the ONLY non-cyan, so it can never be mistaken for phazon)
- the **grid gaps** stop being spacing and become the seams the energy escapes through — **that single value is the infection dial**

See `render-phazon-1.png`. It works.

## Why cream had to go

Cyan on `#faf5e8` is physically impossible, and this cost most of a session before it was named. **Light ADDS luminance; paper sits at ~96%, so there is no headroom** — a "glow" on cream renders as grey haze. Every attempt to put plasma on the live cream dashboard failed for this reason, not for want of tuning. The mockup's near-black is also deliberately **cold** (`#0b0f16`), NOT the live `--ds-ink` (`#1a1612`, a warm brown-black): cyan over warm black goes muddy.

## What was tried and rejected (do not re-litigate)

1. **Canvas sine ribbons, A/B on cream vs a dark console band.** → "I don't like either. It comes off as corny and distracting." Sine = a loop; strokes = wire; the band = unbounded.
2. **A 22px gooey-metaball porthole in the status bar.** → a flat bean. The metaball merge is ratio-dependent (over-merges small, falls apart large), and metaballs have **no concept of empty space**, so any plasma present fills the slot.
3. **A long gooey strip in the footer.** → a solid glowing cyan pill. Four dosage candidates (no ring / spread / fewer / dimmed) all failed for the same structural reason.
4. **The WebGL shader strip.** → correct approach, killed by a broken harness (below), then pulled entirely as too big a change for the live surface.

## The lessons that cost the most

- ★★ **Render the reference BEFORE adapting it.** Reference #032's two "bugs" ARE its effect; I "fixed" both without ever rendering it and destroyed the look. The render is the arbiter, never the code's apparent intent.
- ★★ **When N different edits produce byte-identical output, suspect the instrument.** Headless `--use-gl=swiftshader` silently loses the WebGL context — a lost context returns **-1 for every attribute lookup** and renders flat white while still reporting a successful link and still calling `drawArrays`. Hours were spent "fixing" a shader that was fine. Use `--use-angle=swiftshader`. (This bit twice more in the same session — a greedy regex "proved" byte-preservation had failed when it hadn't.)
- **Exact code, not interpretation.** Luneth, after the third miss: "I realize I need to give you EXACT CODED EXAMPLES or you just won't get it." He was right.

---

## ★ THE ONLY THING CARRIED FORWARD — a toggleable dark theme

Luneth's caveat on parking this:

> "The only thing carried forward is the fact that I want to now include a 'dark theme' as a toggle-able option for our current theme that would swap to a theme similar to this mockup (obviously that will require a lot of back and forth to fully design out, but the plan should be clear as we build - later on ALL elements will have a dark counterpart eventually so the user can pick their favorite theme for the dashboard)"

**The plan, to hold as we build:** cream stays the default. Dark is an *option*, resembling this mockup. **Every element eventually gets a dark counterpart** so the user picks their theme. This is not a now-task — it is a constraint on how new elements are built from here: think about the dark counterpart as you go, so the eventual toggle is not a retrofit.

Not started. No token work, no `[data-theme]` attribute, nothing. Recorded so it is not lost.
