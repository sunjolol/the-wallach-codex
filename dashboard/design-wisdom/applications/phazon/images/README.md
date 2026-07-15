# Phazon reference images — ✓ SUPPLIED (they live in `design-wisdom/references/`)

**Luneth supplied all 5 on 2026-07-14. They are NOT in this folder and should not be moved here.**

> Luneth, 2026-07-14: *"I moved them there because you once again referenced a folder I have no
> access to, leave them where I put them, that's a better place for any design references anyway."*

He is right, and the library agrees with him: `references/` is where design references belong.
This folder keeps only the APPLICATION notes (how the direction was applied); the source images
live with every other reference.

## Where they are — verified 1:1 against the slot descriptions (2026-07-14)

| File | Slot it fills | What it is | Why it matters |
|---|---|---|---|
| `../../../references/phazon-1.jpg` | dark-samus | Dark Samus, full body. Near-black/blue armour with **glowing cyan veins** through limbs and torso; clusters of bright cyan orbs embedded in both shoulders; cyan glow bleeding around the silhouette. | The **infection** read. Energy is INSIDE the armour and escapes at the seams. The shoulder pods are the direct model for a "covered" tile: a dark cell lit from within. |
| `../../../references/phazon-2.jpg` | phazon-arm-cannon | The arm cannon, close. Hard dark angular plates **floating on a bright churning blue liquid** visible in every gap. The liquid is turbulent, veined, alive; the plates are inert. | The clearest statement of **"phazon UNDERNEATH the technological elements powering everything"**. Plates over substrate, energy in the joins. The whole theme in one object. |
| `../../../references/phazon-3.jpg` | kneeling-figure | Dark armoured figure kneeling, cyan light **bursting outward in shafts** from its core against near-black. | The energy as a POWER SOURCE — light escaping a container under pressure. Also: how much darkness the composition needs for the cyan to read. |
| `../../../references/phazon-4.jpg` | phazon-suit-statue | Painted PVC statue of the Samus Phazon Suit. **Translucent blue cannon** with internal glow; metallic dark body; a small ORANGE vent glowing on the leg. | Proof the theme tolerates a warm accent: the orange leg vent against the blue cannon. The live app's accent is `--ds-accent: #ff7e3c`, and the mockup keeps amber for "gap" tiles on the same logic. |
| `../../../references/phazon-5.jpg` | phazon-landscape | Dark rocky alien landscape, **rivers and waterfalls of glowing blue phazon** through near-black stone, mushroom-shaped structures, lightning. | The theme at ENVIRONMENT scale — the substrate as a whole world, not an effect. Dark dominates; the energy is the exception threading through it. |

The mapping was verified by opening the files, not assumed from the filenames.

## Status of the direction

**PARKED — do not reopen.** Fully reverted from the live app on 2026-07-14 and grep-proven gone
(16 tokens). The full direction + every lesson: `../../learnings/2026-07-14-phazon-direction.md`.
The one thing carried forward is a toggleable **dark theme** as a future option — see the memory
`dark-theme-is-a-planned-toggle`. Cream stays default.

**Why the theme needs dark (the expensive lesson):** cyan on `--ds-paper #faf5e8` is physically
impossible — light ADDS luminance and paper sits at ~96%, so there is no headroom and a "glow" on
cream renders as grey haze. Every on-cream attempt failed for that reason, not for want of tuning.
