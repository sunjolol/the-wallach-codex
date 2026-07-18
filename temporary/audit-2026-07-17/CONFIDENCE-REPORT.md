# Corpus confidence report — "are we reasonably safe?"

_Generated 2026-07-17 (autonomous session). Answers Luneth's question with measured data, not assertion. Everything here seals nothing; all fixes are ratify-ready for his review._

## The short answer
**Yes for building forward — with one honest, bounded caveat.** The dangerous defect classes (fabrications, wrong/dangerous doses, inverted meanings) are swept: a fresh 150-claim random audit of the *never-flagged* bulk found **zero** of them. What remains is a measured **~6% tail of minor-fidelity issues** (injected true-in-world words, dropped qualifiers, glosses) — cosmetic-to-minor, not correctness-critical, and now systematically findable + fixable.

## The evidence — three independent audit lenses now
1. **2026-07-06 full-corpus audit** (Charter R8) — the whole corpus, before mining resumed.
2. **2026-07-17 whole-corpus accuracy sweep** — all ~1,263 clean claims; produced the 39 rulings (all now executed) + 123 worth-a-look.
3. **This session's re-adjudication + random sample** (a stricter third lens):
   - **123 worth-a-look → 36 confirmed fixes** (adversarially verified) + 85 confirmed clean + 13 source-`.txt` OCR corruptions.
   - **150-claim random sample of the untouched bulk → 6.0% defect rate** (9/150; 95% CI ~3–11%), **0 false alarms**, **0 dangerous defects**.

## Axis 1 — faithfulness (do claims represent Wallach?) → STRONG
- Bulk residual rate **6.0%**, and **every** confirmed defect is the same minor class you've been ruling on all session: an injected true-in-world descriptor ("sleep hormone" for "neurohormone", "hickory", "over-the-counter"), a dropped hedge ("highly unlikely" → "unlikely"), or a real-world spelling correction ("Atharva Veda").
- The sample re-confirmed safety-critical values as faithful (e.g. **silver = 400 mcg**, chromium/vanadium doses, beta-carotene IU).
- Extrapolated: ~6% of the ~1,100 not-yet-restudied claims ≈ **~66 residual minor fixes** corpus-wide, plus the **45 already found this session** (36 + 9).

## Axis 2 — source-text correctness (is the .txt itself right?) → the real remaining gap
- Only 2 of 7 books' source `.txt` are purified (iaiyh, dddl); **epigenetics, lets-play-doctor, rare-earths are raw**.
- The source-OCR-corruption class is **real but bounded**: this session found ~13 instances (e.g. tin "1.99 |ng/gm" → "µg/gm", "vitamin B, 2" → "B12"). A deterministic scan is too noisy to be decisive; the high-yield version needs the **exhaustive page-read** (owed, and genuinely needs your eyes — not safely automatable).

## The verdict
- **Safe to build on and move forward:** yes. The failure mode that could sink the project — Wallach saying something he didn't, or a dangerous dose — is not showing up in random sampling.
- **"Pristine" is ~94% there on faithfulness**, with a known ~6% minor-polish tail and an unpurified-source backlog in 3 books. Both are bounded and addressable; neither is a lurking unknown.

## Your decision (a genuine cost tradeoff — I paused rather than presume)
1. **Ratify the 45 found + stop.** Approve the 36 worth-a-look + 9 sample fixes (all minor, ratify-ready), and treat the corpus as reasonably pristine. Lowest cost.
2. **Full bulk faithfulness sweep** (~1,100 remaining claims, same validated harness). Would find ~66 more minor fixes → faithfulness-pristine. **Cost ≈ 85M tokens** — large enough to exhaust a 5-hour usage window, which is why I did NOT auto-fire it.
3. **Larger sample** (e.g. +350 claims, ~25M) — tighter rate estimate + ~20 more fixes, moderate cost.
4. **Source purification** (the page-read for the 3 raw books) — the axis-2 lever; needs your camera/eyes for lets + rare.

_Files: `worth-a-look-REPORT.md` + `worth-a-look-adjudication.json` (the 36) · `bulk-sample-fixes.json` (the 9) · this report._
