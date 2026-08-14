# ★★★ NEXT SESSION — READ THIS FIRST.

## NEXT TASK: build the PROFILE feature ("the profile tab").
Luneth's spec (2026-08-13). He originally wanted Journal + Profile demos; Journal was CUT (see below),
so Profile is next. **Start with demos, 4-6 as usual** — genuinely divergent first concepts, screenshot
with your eyes, then STOP for his pick/mix; port live only with approval. What the profile lets the user do:
- **Edit their NAME** — already a validated field (`UserNameSchema`: bounded 40, no control/bidi chars,
  explicit rejection path; it is the app's ONLY free-text field, treat input carefully).
- **Give themselves an AVATAR** — uploaded, OR chosen from a preset of ~40 **REAL GRAPHICS**. His exact
  words: "no nonsense SVG garbage, I want real graphics here." So: a bundled pack of ~40 real raster
  avatar images (offline-first → LOCAL + hash-pinned like the fonts/vendored libs; NOT external, NOT SVG
  line-art). Sourcing a license-clean real-graphic avatar pack is the open question to raise with him.
- **Modify COLOUR SCHEMES** — "only if possible, if there's a reasonable way to do it." This is the natural
  home for the planned multi-theme toggle: cream is the default; more themes change STYLE ONLY, never
  functionality (design-language). Dark theme is the already-planned first alternate.
- **Any other creative, plausible additions** you come up with.

### Current profile implementation (what you're redesigning)
- Access: rail profile chip `.rail__profile` → `main.ts::showProfilePanel()` → `views/profile.ts` mounts
  into a `.pf-overlay` overlay (NOT a workspace tab; "tab" is loose — redesign shape is open, like Journal was).
- Identity state: `state/profile.ts` (`name`/`browsing`/`chosenAt` + `displayName`/`displayInitial`/
  `displayTitle`), schema `core/schemas/profile.ts`. The panel today is a Round-25 SCAFFOLD showing
  Creator's Log / Invariants / Build (see `views/profile.ts`). Avatar today = a gradient circle with the
  name's initial — no image, no theme in the schema yet.
- Adding avatar + theme EXTENDS `UserProfileSchema` (a versioned shape change = a migration). Uploaded
  avatars persist as data URIs through the §31 storage chokepoint — mind the ~5MB LS quota (downscale on upload).

## JUST FINISHED (this session, on master @ 6cf30f3a)
- **Journey/Journal feature REMOVED entirely** — Luneth cut it as redundant against note apps. 8 files
  deleted, 13 unwired. Board 91/91, knip clean (nothing orphaned), rail = Coverage/Regimen/Scanner/Search/Knowledge.
- **Browser-tab title is now dynamic** (`<Name>'s Health Journey` / `Your Health Journey`) via `profile.displayTitle()`.
- **`dashboard/components/` deleted** (12 obsolete mockups; all surfaces ported live). `style_diff.js` now
  needs an explicit `<mockupRelPath>`; live-code refs reconciled.

## STILL PARKED / CARRIED FORWARD
- **HEADERS**: parked until everything else is done. Do not build.
- The **29 new corpus claims** (fatigue / seizures / eye) await Luneth's rulings; plus small corpus threads
  (IMMORT-000023 date, tag hygiene, 66 draft form/absorption claims, potassium dead-cite, germanium, HELLS dup).

## STANDING WORKFLOW
Demos: `temporary/awaiting-refinement/` → `temporary/ready-to-be-ported/` → port live only with approval
+ STOP-for-sign-off. All repo writes via `safe_write`. Verify with your eyes (screenshot). Cream default theme.
