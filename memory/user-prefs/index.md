# User Preferences — Index

_Created: 2026-06-14 at 3:30 PM (Round 52 — refactor of `user-preferences-and-boundaries.md` per the Specialized-units-with-index pattern. See `operating-protocols.md §10` for the pattern doctrine.)_

This directory holds the user's health-related preferences in **specialized files connected through this index**. The pattern: each file does one job well; this index is the highway between them. Nothing gets buried or archived — empty body-system files are first-class members of the structure, waiting to accumulate content as the user's framework develops.

The body-system filenames mirror the canonical 14 goal categories used everywhere else in the system (the `GOAL_DISPLAY_NAMES` map in `dashboard.html`, the catalog-index `goal-to-products.json`, the dashboard's three-goal display). One taxonomy across all channels.

---

## Cross-cutting files (read these for general / multi-system preferences)

| File | What's in it |
|---|---|
| [`communication.md`](communication.md) | Comm style, response format, decision-making, general surfacing rules |
| [`lifestyle.md`](lifestyle.md) | Supplement format prefs (capsule/powder/liquid), cost discipline, hard nos, brand preferences, sustainability frame |
| [`aesthetic.md`](aesthetic.md) | Dashboard theme, palette, layout pattern, design tokens |

## Body-system files (read for goal-specific preferences)

| File | Goal key | Sample contents |
|---|---|---|
| [`hormones-strength.md`](hormones-strength.md) | `hormones_strength` | Testosterone-labs surfacing rule. Body-system anchor for goal 2. |
| [`cognition.md`](cognition.md) | `cognition` | (empty — placeholder) |
| [`longevity-anti-aging.md`](longevity-anti-aging.md) | `longevity_anti_aging` | (empty — placeholder) |
| [`cardiovascular.md`](cardiovascular.md) | `cardiovascular` | (empty — placeholder) |
| [`bone-skeletal.md`](bone-skeletal.md) | `bone_skeletal` | (empty — placeholder) |
| [`thyroid-endocrine.md`](thyroid-endocrine.md) | `thyroid_endocrine` | (empty — placeholder) |
| [`joints-collagen.md`](joints-collagen.md) | `joints_collagen` | (empty — placeholder) |
| [`energy-metabolism.md`](energy-metabolism.md) | `energy_metabolism` | (empty — placeholder) |
| [`gut-digestion.md`](gut-digestion.md) | `gut_digestion` | (empty — placeholder) |
| [`immunity.md`](immunity.md) | `immunity` | (empty — placeholder) |
| [`skin-hair-nails.md`](skin-hair-nails.md) | `skin_hair_nails` | (empty — placeholder) |
| [`blood-sugar.md`](blood-sugar.md) | `blood_sugar` | (empty — placeholder) |
| [`sleep-stress.md`](sleep-stress.md) | `sleep_stress` | (empty — placeholder) |
| [`hydration-electrolyte.md`](hydration-electrolyte.md) | `hydration_electrolyte` | (empty — placeholder) |

---

## Read order

For full preference context, read in this order:

1. **`index.md`** (this file) — orientation
2. **`communication.md`** — how to talk with the user
3. **`lifestyle.md`** — what realities constrain recommendations
4. **`aesthetic.md`** — visual/dashboard preferences
5. **`hormones-strength.md`** + any other body-system file relevant to the current question

A body-system question that doesn't have its own file yet means there's no captured preference yet — answer from the broader cross-cutting prefs and the Wallach corpus, and **note the gap** so it can be filled when the user reveals something specific.

---

## Highway rules (how the pieces connect)

1. **Specific overrides general.** A body-system file's preference beats a cross-cutting file's preference within that system. Example: if `hormones-strength.md` has a specific format preference for testosterone supplementation that differs from `lifestyle.md`, the strength-specific one wins for strength-related recommendations.

2. **Cross-references are mandatory at the bottom of every file.** Every file ends with a "Related" section listing sibling files whose content interacts. This is the cross-linking that prevents fragmentation.

3. **Empty files are honest placeholders.** When a body-system has no captured preferences yet, the file states that explicitly and points to the cross-cutting files. Never delete an empty file — its existence is the structural promise that the preference can be captured there when the time comes.

4. **The index is the single source of truth for what files exist.** When a new file is added, this index is updated in the same patch. When a file's purpose changes, the table here changes in the same patch. No drift.

5. **The index does not duplicate content.** It maps; it doesn't contain. Reading the index tells you where things are; reading a specific file tells you what they are.

---

## When this structure changes

If a body-system file grows beyond ~200 lines, split it into specialized children (e.g., `hormones-strength.md` could split into `hormones-strength/testosterone.md`, `hormones-strength/growth-hormone.md`, etc., with a per-folder `index.md`). The pattern recurses. The shape is fractal.

If a new body-system category emerges that isn't in the 14, add it to the table and create the file. Update the canonical `GOAL_DISPLAY_NAMES` map in `dashboard.html` in the same patch so the taxonomy stays unified.

---

## Related

- Operating doctrine: [`memory/operating-protocols.md`](../operating-protocols.md) — §10 codifies the Specialized-units-with-index pattern
- Brain catch-up: [`brain/current.md`](../../brain/current.md) reads the catch-up trigger list which now points at this index
- Dashboard generation: trigger list in `brain/current.md` reads this directory entirely
- Goal taxonomy: `GOAL_DISPLAY_NAMES` map in `dashboard/dashboard.html`
