# Source-rule review — the omega EFA daily target: a proposed Youngevity-label override, refused; Wallach's own number found instead

**Date:** 2026-07-15
**Type:** §00.A / Charter R2 review. **A PROPOSED VIOLATION WAS FLAGGED AND NOT OVERRIDDEN** — the protocol ran to step 1 and stopped, because the premise for the override turned out to be false. Logged per source-rule.md ("Log every triggered review, approved or not").
**Surface:** `dashboard/assets/data/essentials-targets-data.json` (the omega targets) + the Coverage omega tiles.
**Initiated by:** Luneth, transparently, with the reasoning shown and an explicit invitation to refute it: *"do not trust anything it says blindly but research and logic it out for yourself."*
**Outcome:** NO override. The target derives from a Wallach BOOK primary.

---

## What was proposed

Luneth brought a conclusion from a long research session with another AI: post per-omega daily targets derived from the **Ultimate EFA Plus** label at 6 softgels/day —

| | per softgel | × 6/day |
|---|---|---|
| Total Omega-3 (ALA+EPA+DHA) | ~585 mg | **~3,510 mg** |
| Total Omega-6 (LA+GLA) | ~122 mg | **~732 mg** |
| Oleic Acid (Omega-9) | 120 mg | **720 mg** |

His reasoning was honest and pragmatic, and he named the trade-off himself: *"yes these are DERIVED from Wallach's framework and not TECHNICALLY said by him, but the fact is leaving it ambiguous is worse than 'fabricating' these numbers."*

## Why it was flagged

Tagged in chat `[WALLACH-SOURCE-RULE: PROPOSED VIOLATION]`. It breaks §00.A / R2 — *"Youngevity products contribute composition only, NEVER a target"* — and specifically the **retired allowlist item**: pack-extrapolation as a target source (computing a target by multiplying a Youngevity label by a serving count). That is the exact mechanism whose poison was purged in Phase C2. Precedent it would have set: any essential lacking a book dose could acquire a target by multiplying a label. `amounts_wallach_only` would have gone RED — verified, there are **zero** dose claims mapping any omega, so no `source_claim_id` could resolve.

**The structural argument mattered more than the doctrine:** if the target derives from the product, the product covers the target *by construction*, and the tile can only ever read 100%. It is a scoreboard that cannot report a loss — the same defect as the "4 / 90 covered" fiat that Luneth killed on 2026-07-14 precisely because it could not be false.

## The premise was false — Wallach states the number

The other AI asserted: *"He does not appear (in publicly available transcripts, Dead Doctors Don't Lie, Rare Earths Forbidden Cures, or radio archives) to say things like 'take 2,000 mg of Omega-3' or '1 tablespoon of flax oil.'"*

**Refuted from the sealed books.** Wallach almost never writes "omega" (46 mentions across all 7 books, none near a number+unit); he writes "essential fatty acids" (201) and "EFA" (88). A 7-book adversarially-verified sweep (13 agents, 0 refuted quotes) found **134 dose statements**, including `flaxseed oil at 1 tbsp` ×5. The other AI reasoned from lectures and distributor hearsay — neither on the allowlist — while the books sat unread.

## The ruling: 9 grams per day, collective across omega-3 + omega-6

**Dead Doctors Don't Lie, 3rd ed. (2011), lines 9107–9109** — verbatim:

> "Essential fatty acids are a must and should be consumed at the rate of 3 percent of your total daily calorie consumption **or supplemented at the rate of 9 grams per day in capsule form.**"

Every link is a quote; **we supply no input at all**:

1. **9 g/day** — Wallach's own words. Newest book that states any EFA amount (Epigenetics 2014, Hell's Kitchen 2015, IAIYH 2020 contain none — verified). He states BOTH the rate (3% of calories) AND the finished supplement figure, so we never choose a calorie basis.
2. **Collective across omega-3 + omega-6** — DDDL L7171–7174: *"Three polyunsaturated fatty acids (linoleic, linolenic, and arachidonic acids) are known as essential fatty acids (EFA)… However, only two (linoleic and linolenic) are designated as Essential Fatty Acids. Arachidonic acid can be synthesized by humans from lenolenic acid."*
3. **omega-9 gets NO number** — never named an EFA in any of the 7 books; the sweep found 20 omega-9 statements, every one `descriptive-only` or `not-required`.
4. **Delivery: 9 softgels/day, taken 3 at a time t.i.d.** — Wallach's own divided-dose rule, Let's Play Doctor L4166–4174: *"we recommend taking supplements at preventive levels (Fig. 8-1) in divided doses t.i.d. (three times per day) to keep blood levels elevated for at least 12 hours per day."*
5. **Therapeutic tier: 15 g/day** (his `5 gm t.i.d.`, 81 occurrences, all inside condition protocols) — excluded from targets by `targets_derive._cond_priority`, which returns None for a disease.

## The rule this review establishes (the durable precedent)

Luneth pressed the sharpest question of the session: *"how are you even deriving 9 softgels without using some sort of standard? … Wallach says 3% so you're deriving the total SOMEHOW from SOME 'set number'"* — and noted the system already assumes a 154 lb reference adult for minerals.

**He was right about the class, and the concession is recorded here:** the ×1.54 weight-scale IS the same shape — Wallach gives a rate, we supply a reference, we compute. The distinction is narrower than "never assume a standard":

> **Supply a reference ONLY when Wallach's own words cannot produce a number. NEVER to replace a number he already wrote.**

- **Minerals:** he gives only a rate ("per 100 lbs"). A reference body must be supplied or nothing can render. ×1.54 is legitimate, documented, and gate-pinned.
- **EFA:** he gives the rate AND the finished number. Nothing needs supplying. Plugging in the FDA 2,000-kcal label standard yields 6.67 g — which **contradicts his stated 9 g**. The assumption would not fill a gap; it would overrule him with an FDA convention, which is the same violation class as the product label with a different non-Wallach input.

Also recorded: **the weight standard never applies to EFA at all.** Wallach's EFA rule is CALORIE-based, never weight-based, in all 7 books. The ×1.54 scale exists only for his per-100-lb mineral doses.

## Correction to the record — Claude was wrong twice, and the systematic read caught it

Logged so no future session trusts the wrong intermediate reasoning found in this session's chat:

1. **Claude first recommended 15 g/day**, reading the gallbladder prose *"the base line nutritional supplement including 5 gm of EFA t.i.d."* as a maintenance dose. **Wrong.** Let's Play Doctor's actual `FIG. 8-1: Base Line Nutritional Supplement Program For Adults` **has no EFA row at all**, and its defining prose scopes it explicitly: *"A baseline of **vitamins and minerals** are essential to preventive health programs."* The recommendation was built on the one sentence containing the grepped words, and it contradicts Wallach's own table.
2. **Claude claimed Wallach was internally inconsistent.** **Wrong.** His rule is 3% of calories and he works it out himself in two books: Immortality (2008) L3022–3025 gives "45 calories or five grams" from a stated 1,500-calorie diet (3% of 1,500 = 45 kcal ÷ 9 = 5 g ✓); DDDL (2011) gives 9 g (≈ 3% of ~2,700 kcal ✓). **The "2,700 calories" figure is Claude's back-inference, NOT a Wallach claim** — it must never be cited as sourced.
3. **Claude computed "6 softgels = 47% → NOT COVERED"** by comparing the softgel's omega FRACTION (707 mg) against a target expressed in oil GRAMS — the exact unit-mismatch bug class already live in `rankSources`. Wallach's phrasing settles it: *"essential fatty acids **as flaxseed oil at 9 grams per day**"* (L9477) measures the OIL. A softgel is 1 g of total fat → **9 softgels/day = 100%**.

## The evidence base under the 2026-06-24 omega-9 ruling is DEAD — the conclusion survives on new ground

`2026-06-24-source-rule-90-essentials-omega9.md` ruled omega-9 non-essential and the count 90. **That ruling is UPHELD.** But its three confirmations have all since been invalidated, and a future session reading it would find it resting on sources this project has since destroyed:

1. It cites **`wallach-lecture`** transcripts titled "The 90 Essential Nutrients." Lectures were RETIRED as a source 2026-07-05 (Luneth: books only); the `wallach-lecture` token is gone.
2. It cites the **`essentials-targets-data` `wallach_stance.quote`** — the rotten inline embed PURGED in Phase C2, whose 3 transitional gates retired with it.
3. It cites **`eden/eden-catalog.json`**, since folded into `catalog/` (blueprint D3).

It also labels omega-9 "**Arachidonic / Oleic**" — biochemically wrong, and already corrected by `2026-07-08-omega9-arachidonic-correction.md` (arachidonic is an omega-6; omega-9 is Oleic Acid).

**Re-founded today on BOOK evidence, which the 06-24 review could not cite because nobody had read for it:** DDDL 3e L7171–7174 and Immortality L5189–5196 both state that only linoleic and linolenic are designated Essential Fatty Acids. Oleic acid is named in neither list. Omega-9's zero claims are not a mining gap — **they are Wallach's actual position**, and the 7-book sweep confirms it (20 statements, all descriptive-only or not-required).

## Luneth's decision (2026-07-15)

> "9 sounds much better to me… so 9 it is, 3 times per day, 3 max at a time - perfect, and settled."

And on omega-9, he kept it on the board for a stated aesthetic reason, honestly labelled rather than dressed up as doctrine: *"I still want to include it honestly for aesthetic reasons… 3 is a better number than 2, 3 fills out the list better… it's purely a mental/aesthetics/design thing at this point that will be supported by real reasoning within the detail screen later."* Omega-9 shows **no daily amount** and gets a custom detail page explaining why it is there. That is R7 honesty applied to a design choice: the reason is recorded as what it is.

**Corroboration, not evidence (recorded as such):** Wallach's 9/day at 3-at-a-time t.i.d. independently matches both Luneth's own Wallach-framework doctor and his lived experience — *"the times I was taking 9 per day every day… produces GREAT results"* — and his hard-won headache rule ("never more than 3 at a time, never without a solid meal") turns out to BE Wallach's stated divided-dose principle. None of this is source evidence; the book text alone carries the claim.

Related: [[essentials-authority-graphic]] · `2026-06-24-source-rule-90-essentials-omega9.md` · `2026-07-08-omega9-arachidonic-correction.md`
