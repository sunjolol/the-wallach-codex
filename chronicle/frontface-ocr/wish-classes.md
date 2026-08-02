# The five WISH detector classes — triage + progress (2026-08-02)

_★ COMPLETE 2026-08-02 (sealed kv=444). All five classes are now GATED inside
`frontface_verbatims_clean`, which covers SEVEN mechanical classes in total. 10 defects fixed across
two rounds; 11 named exceptions carry the verification. The finding below still stands and is the
reason the gate's own message says what it covers rather than claiming the corpus is clean._

## ★ The finding: the five classes sit on a class I could not measure

> ★ **PARTIALLY MEASURED 2026-08-02 (later that day).** The claim below that the dropped-space
> class is of UNKNOWN size still holds for the corpus at large, but it is no longer unmeasured in
> the front-facing set. Two instruments found real instances of it: the wave-1 control sample
> (`LETS-000430` `mcgt.i.d.,folicacidat`) and the wave-3 non-word sweep (`ofceliac`, `ofjoint`,
> `ofdiarrhea`, `yourbones`, `Itisa`, `3- 1-4.5`). All were fixed. The letter-letter cases remain
> invisible to every DETECTOR — they were caught by reading, not by scanning — so no gate covers
> the class and none is claimed. **A companion finding:** the same book prints `ofdiarrhea` run
> together in one place and `of diarrhea` with a space 400 characters away, so this class cannot
> be batch-fixed on a match; each occurrence is its own page read.

`LETS-000415` reads `magnesium at2,000 mg` in our text. The page image shows **`magnesium at 2,000
mg`** — with a space. So does `zinc at 5-15 mg b.i.d.` (we had `zincat5-15mgb.i.d.`) and `fatty acids
at 5 gm t.i.d.` (we had `5gmt.i.d.`). Let's Play Doctor is **tightly justified**, the typesetter
squeezed thin spaces, and the OCR dropped them. The same pages show `andelectrolytes`, `ratherthan`,
`allthree` — all letter-letter, and therefore **invisible to every one of the five detectors**, which
only see the letter-to-digit and camelCase edges of the class.

**I tried to measure the real size and my measurement was invalid.** A vocabulary-based detector
("a token that is not a word but splits cleanly into two words") returned 387 candidates across 326
claims — and nearly every one was a legitimate word the speller does not know: `cofactor`,
`peroxidation`, `subluxations`, `anticarcinogenic`, `Framingham`, `Reichstein`, `epigenetics`. The
same trap as the `lowercase_line_start` detector discarded earlier in the campaign. **So the
dropped-space class is real, confirmed by eye, and of UNKNOWN size.** Reporting a number here would
be worse than reporting none.

Consequence: promoting the five classes to gates does not make the corpus clean of dropped spaces —
it makes it clean of the EDGES of that class. Worth doing, but it must be said plainly, or a green
board will imply something it does not mean.

## Fixed this pass (6, each read off the page image)
| claim | was | page shows |
|---|---|---|
| `LETS-000090` | `over 1 00 years` | `developed over 100 years` |
| `LETS-000247` | `t.i.d.,zincat5-15mgb.i.d.` | `d., zinc at 5-15 mg b.i.d. and vitamin` |
| `LETS-000273` | `en2ymes` | `pancreatic enzymes` |
| `LETS-000384` | `at 5gmt.i.d.` | `fatty acids at 5 gm t.i.d.` |
| `LETS-000415` | `magnesium at2,000 mg` | `magnesium at 2,000 mg per` |
| `LETS-000502` | `(1 20 days` | `supplementation (120 days` |

`LETS-000502` is the pregnancy anecdote Luneth first reported — its last defect is now gone.

## Where each class stands
- **`space_b4_punct` — 3 left, all real** (`Levamisol ,` · `Caladryl ,` · `tolerance ,`). The other
  two were table leader dots, removable by a provable refinement: exclude a punctuation mark
  followed by another dot. → verify 3 + fix.
- **`digit_in_word` — 1 real of 8.** Only `EPIGEN-000317` `in1881`. The other seven are legitimate
  unit/formula adjacency: `1nm`, `100nm`, `2-5ug/kg`, `1cm`, `q6 h`, `As2O3`, `146mcg/day`.
  → add a unit-adjacency exclusion + verify/fix 1.
- **`run_together` — 1 real of 5.** Only `RARE-000375` `anWor` (→ `and/or`). The others are
  `NutraSweet`, `MacCoy`, `SuperOxy` twice — brands and a surname. → verify/fix 1 + 4 exceptions.
- **`number_split` — 1 real of 15.** Only `LETS-000334` `1 20 gms`. The other 14 are two-column
  table rows in `DDDL-000112/-000250/-000289`, where `Whole egg 100 94` means chemical score 100,
  utilization 94. → verify/fix 1 + 3 exceptions.
- **`double_space` — 0 real.** Both claims are genuine transcribed tables (`IMMORT-000261`
  age/volume, `LETS-000094` herb/use) with column alignment. → 2 exceptions, **gateable today**.

Remaining to finish: **6 page reads**, two provably-correct detector refinements, and 9 named
exceptions each carrying its reason.

## How it finished
Six more page reads settled every residual hit, and **two of the six turned out FAITHFUL** — the page
really prints `(Levamisol , hydrazine sulfate)` and really prints `in1881`. Both are now named
exceptions rather than "fixes", which is the whole argument for reading the page before batch-fixing
on a detector's say-so.

Final: 4 more defects fixed (`Caladryl ,` · `bowel tolerance ,` · `(i.e. ,` + `1 20 gms` in
LETS-000334 · `anWor`→`and/or`), all five classes promoted, 11 exceptions each stating its evidence
type, negative test extended 16 → **31 cases**. No detector was promoted while its class still
carried an unverified hit — that rule is what made the two faithful cases surface instead of being
quietly corrupted.
