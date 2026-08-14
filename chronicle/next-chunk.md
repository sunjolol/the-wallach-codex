# ★★★ NEXT SESSION — READ THIS FIRST.

## JUST SHIPPED (this session, on master): the PROFILE feature — LIVE + committed.
The profile popup is now the "Command Card" identity + appearance console, ported from the
signed-off demo. From the rail profile chip you can:
- set / change your NAME (the one validated free-text field; guest ⇄ named),
- pick an AVATAR — 32 bundled offline PNGs (families aura / gem / world; **Blooms dropped**) OR
  upload one (auto-downscaled to 256px). A **Default (initial)** tile returns to the auto avatar.
- switch THEME (Cream / Charcoal) + a live PRIMARY COLOUR (8 accents) — applied **APP-WIDE** via
  `<html data-theme data-accent>` + `assets/styles/theme.css` (shadows the sealed tokens, never edits
  them). Category colours / coverage status / Ask-Wallach green are deliberately left alone.
- own their DATA — real Export / Import (JSON) + Reset-to-guest (`core/storage.snapshot/restore`).

Persisted through the §31 profile chokepoint (`setAvatar` / `setTheme` / `setAccent` / `clearAvatar` /
`resetIdentity`, all via one private writer that emits `profile:changed`). `UserProfileSchema` gained
optional `avatar` / `theme` / `accent` (additive, backward-compatible migration). Rail chip avatar +
browser-tab title repaint live; `main.ts` is the single applier of theme/accent to `<html>`.

Refinements Luneth asked for + shipped: rail stays DARK in Charcoal (not inverted — theme.css re-pins
the rail's own tokens); the coverage registration grid is barely-there in dark; the Default-avatar
option; removed the "PF·xxxx" cipher serial + the "dark = planned first alternate" hint; "Continue as
guest" shows ONLY for guests (never silently drops a named profile).

Board 91/91 · build fresh · 50 tests · touched files lint-clean · headless live-probe 0 console errors.

### PARKED / open on the profile (do NOT re-raise unprompted):
- The Creator's Log was RE-HOMED as a collapsed section at the bottom of the console (the
  `creators_log_bundle_synced` gate + the sacred-surface covenant forced keeping it in-app). Luneth
  may later choose to FULLY RETIRE it — that means removing that gate + the build embed step, and
  needs his EXPLICIT OK.
- Avatars are PLACEHOLDER generated art (Pillow/numpy, offline, licence-clean); Luneth is supplying
  custom images per category (Auras / Gems / Worlds) later. Generator: scratchpad gen_avatars.py.
- A permanent `tools/render_probe_profile.js` was DEFERRED (verified via documented live-probe this
  round). Pre-existing lint debt in `main.ts` / `log.ts` (sort-imports etc.) left as-is (not ours).

## NEXT TASK: fix the SCANNER hang.
Luneth 2026-08-14: copy-pasting label TEXT **and** uploading a label IMAGE together leaves the scanner
stuck on "reading the label..." forever, with no result. Investigate `views/scanner.ts` +
`state/scanner.ts` + `state/ocr.ts` — likely a combined-input path awaiting a promise that never
settles (paste-text and file-OCR racing, or an await that only resolves on one input path). Reproduce,
find the stuck await, fix, verify with a probe + a screenshot.

## STILL PARKED / CARRIED FORWARD
- HEADERS: parked until everything else is done. Do not build.
- The 29 new corpus claims (fatigue / seizures / eye) await Luneth's rulings; plus small corpus
  threads (IMMORT-000023 date, tag hygiene, 66 draft form/absorption claims, potassium dead-cite,
  germanium, HELLS dup).

## STANDING WORKFLOW
Demos: temporary/awaiting-refinement/ → temporary/ready-to-be-ported/ → port live only with approval
+ STOP-for-sign-off. All repo writes via safe_write. Verify with your eyes (screenshot). Cream default.
