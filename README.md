# The Wallach Codex

**Most supplement tools tell you what is in the bottle. This one tells you what is still missing.**

Dr. Joel Wallach's framework holds that the body needs **90 essential nutrients** every day, and that a
great deal of chronic illness traces back to the ones you never get. The Wallach Codex turns that list
into a live map of your own nutrition: it grades everything you take against all 90, judges any label
you point it at, and answers health questions out of his seven books in his own words.

It runs entirely on your computer. You open one file and it works — no install, no server, no account,
no internet connection, and nothing about you ever leaves the machine.

|  |  |
|---|---|
| **Runs from** | a single file, double-clicked. No install, no localhost, no build step. |
| **Network use** | none, ever. There is no server to talk to and no endpoint to leak to. |
| **Your data** | lives in your browser on your device. Export it as a plain `.json` file you can read. |
| **Sourced from** | 7 Wallach books (1994–2020), 2,611 hand-checked claims, every one citable. |

---

## What it does

### Coverage — the map of your gaps

The home screen lays out all 90 essentials as a periodic-table field and grades each one against a
book-sourced daily amount, using what your supplements actually deliver.

- **It shows gaps, not a score.** Every tile is covered, partial, present, not covered, or *no Wallach
  number stated* — and the legend under the field is also the live tally.
- **Partial means partial.** A half-filled tile is filled to the real ratio, so being at 32% of a target
  looks different from being at 90%.
- **Goals change what you look at, never what you are measured against.** Pick up to five from 31
  plain-language goals and the tiles they name get ringed — but the denominator stays 90, so a goal can
  never flatter you by shrinking the test.
- **Every tile is a door.** Click one for the target, the sentence and book it came from, your current
  intake against it, and the best products for it ranked by cost per nutrient.

### Regimen — up to four stacks, side by side

Build a supplement stack and watch the map respond. Keep four separate ones and switch between them.

- **Four independent saves**, each named, colour-coded, and carrying **its own coverage score on its
  tile** — so you can compare "what I take now" against "what I'd take if money were no object" without
  destroying either.
- **Adding something you already have bumps the dose instead of duplicating the row**, which makes
  accidentally double-counting a bottle structurally impossible.
- **A recycle bin** holds your last removed items and your last seven deleted saves, each restorable —
  so you can pull something out just to see what happens to your coverage, then put it straight back.
- **Best next moves**: six ranked cards answering "given everything I'm missing, what should I add
  next?" — each with its wholesale price and how many new essentials it would reach.
- **Export a stack as a file** and hand it to someone. An imported file is fully re-minted on the way
  in, so it cannot claim to be something you scanned yourself.

### Scanner — point it at a label and get a verdict

Photograph a supplement or food label. The reading happens on your own machine, and the verdict is more
than a transcription.

- **It grades the ingredients for harm** — 280 terms across 8 categories, in four severity tiers, and it
  names the exact word that triggered each flag so you can disagree with it.
- **It knows the difference between a rule and a keyword.** "Gluten-free oats" clears every oat
  derivative on that label; wheat, barley, rye and malt still reject independently, because a
  gluten-free claim on one ingredient cannot launder another. Seed oils reject on their own but can be
  redeemed if the label still delivers real nutrition.
- **It tells you how good the product actually is**: how many of the 90 it delivers in a meaningful
  amount — at least 3% of the *Wallach* daily target, never an RDA — shown as *hits N of 90*. That is a
  property of the product, so two of them can be compared honestly.
- **It tells you what it does for _you_**: which of your remaining gaps it closes and by how much
  ("Zinc +40%"), measured against your current stack rather than against nothing.
- **It refuses to judge a photo it could not read**, and it makes you confirm every line before it
  scores anything — because a verdict on a misread label is a verdict about your photography.
- **Or skip the camera entirely**: paste an ingredients list, or type a single word, and get the same
  verdict in five seconds.

### Ask Wallach — the books, in plain English

Type a question the way you would ask a person. You get a ranked answer with his exact sentence beneath
it.

- **Ask "why are fried eggs bad"** and get a real, sourced answer — you do not need to know the right
  nutrient name or own the books.
- **Every answer is layered**: the question, a one-line answer, the fuller explanation, then Wallach's
  byte-exact words as a quote. You are never shown a paraphrase dressed as a quotation.
- **When he never addressed something, it says so** and offers you somewhere else to go. It does not
  invent an answer.
- **Browse instead of asking**: every answer is filed under The Science, What To Do, The Story,
  Wallach's Take, or Cautions, and you can open any of those and read across topics.
- It is deterministic and offline — no model, no API, no network. The same question always returns the
  same answer, and it will still work in ten years.

### Knowledge — the reference library

The long-form side: **601 detail pages** — one for every nutrient on the list, plus 510 health conditions.

- A nutrient page gives you the daily target **and why that number** — the claim, the book, the page.
- Conditions, foods, the full 215-product database, and antioxidant (ORAC) data, all cross-linked.
- **1,260 scientific terms carry a hover definition** wherever they appear, so you can read a claim
  about physiology without opening a second tab.

### Yours alone

- **No account, no login, no sync, no telemetry.** The app asks your first name once, and "I'm just
  browsing" is a first-class answer it remembers permanently.
- **25 bundled portraits** to pick from, or use your own photo — resized in your browser, stored on your
  device, never uploaded.
- **Two full themes** (Cream and Charcoal) and eight accent colours. Dark mode is a real palette, not an
  inverted filter.
- **Back up everything to a readable `.json` file** and restore it on another machine. It is your data
  in a format you can open in a text editor.

---

## How to use it

**Opening it.** Find the `dashboard` folder, and double-click **`dashboard.html`**. It opens in your
browser like an ordinary page and works with the internet unplugged. Bookmark it.

**The first time.** It asks for your first name and what you would like to work on. Both are optional —
there is an **"I'm just browsing →"** button beside them, and it only ever asks once.

**Getting around.** Everything lives in the dark rail down the left edge:

| Where | What | Key |
|---|---|---|
| Rail, top — *Workspaces* | **Coverage** — your 90-nutrient map | <kbd>1</kbd> |
| | **Regimen** — your supplement stacks | <kbd>2</kbd> |
| | **Scanner** — read and judge a label | <kbd>3</kbd> |
| Rail, below — *Drawers* | **Search** — Ask Wallach | <kbd>S</kbd> |
| | **Knowledge** — the library | <kbd>K</kbd> |
| Rail, very bottom | **Your profile** — the round avatar with your name and *SETTINGS · PROFILE* under it | click it |
| Top bar, far right | **Ask Wallach** — the green pill | <kbd>S</kbd> |

The single keys work anywhere except while you are typing. <kbd>Esc</kbd> closes any drawer or panel.

**Your profile, themes and backups** are all behind that avatar in the **bottom-left corner** — it is
the only settings surface in the app. Open it to change your name, pick an avatar, switch to dark mode,
or export a backup.

**Backing up.** Profile → **Export** writes `wallach-codex-backup-YYYY-MM-DD.json` to your downloads.
**Import** on another machine restores it exactly — it replaces rather than merges, so you get back the
snapshot you took.

---

## Where the numbers come from

This is the part worth understanding before you trust anything on screen.

**Every recommended amount, dose, daily target, deficiency sign and health claim traces to one of Dr.
Wallach's seven books.** Nothing is averaged in from elsewhere, and no RDA is ever substituted — where
his own table prints one, the app deliberately refuses to show it as a target.

**Where he states no number, the app says so.** Only **37 of the 90** essentials carry a numeric Wallach
amount. The other 53 are marked *no Wallach number stated* rather than filled with a plausible figure
from somewhere else. On an empty regimen over half the board reads that way, and that is the honest
picture rather than a flaw.

The product database contributes **composition only** — what a bottle contains. That is an input to the
arithmetic; it is never a target.

The seven books are registered in `eden/corpus/books-meta.json`, and the app composes every citation
from that registry rather than from typed-in text, so a citation cannot drift from its source. **The
book texts themselves are not distributed here** — they are their authors' copyrighted work. The
derived, non-infringing claim data is committed and sealed.

---

## For developers

An offline-first, single-page TypeScript app that opens straight from `file://`. No server, no backend,
no runtime network — a strict Content-Security-Policy in the shell enforces it. Label OCR runs
on-device with vendored Tesseract.js. All user state persists to `localStorage` through one chokepoint;
export/import is plain JSON.

### Build and verify

```bash
node tools/build.mjs                     # type-check (tsc) + bundle (esbuild)
PYTHONUTF8=1 python tools/invariants.py  # the integrity board — 94 gates
node tools/probes/render_probe.js        # a headless render check
```

`tools/build.mjs` installs its own dev dependencies on first run. **You do not need to build to run the
app** — `dist/main.js` is committed, so a fresh clone opens and works immediately. Alongside the build,
`tools/probes/` holds 37 headless render probes and `tools/tests/` 42 standalone Python
control tests.

### How the data flows

```
eden/  (sealed, hand-edited)  ──►  eden/tools/*.py  ──►  dashboard/assets/data/*.json  ──►  esbuild
   corpus · catalog · products        derive                     generated                  inlines into
                                                                                            dist/main.js
```

Three hand-edited pillars live in `eden/`; **everything else the app reads is generated from them** and
inlined into the bundle at build time (the app cannot `fetch()` on `file://`, so nothing is loaded at
runtime). Each pillar file carries a `*.golden.sha256` seal, and a freshness gate regenerates every
derived artifact and byte-compares it, so drift cannot ship.

TypeScript source is layered **`core/ → state/ → views/`** and the layering is enforced: views may not
reach past state, `localStorage` is confined to `core/storage.ts`, and `any` is banned.

### What a green board means

`invariants.py` reports 94 gates. Green means **nothing drifted** — it does not mean anything is right.
Only the 23 gates anchored outside the project's own files (book bytes, physical constants, git) can
catch a value that is wrong but self-consistent. The board prints that split every run, and it is worth
reading honestly.

### Layout

| Path | What lives there |
|---|---|
| `dashboard/` | The app: the HTML shell, TypeScript `src/`, the built `dist/main.js`, stylesheets, in-housed fonts, vendored OCR. |
| `eden/` | The sealed source of truth — `corpus/` (the Wallach claim graph), `catalog/` (ID registries), `products/` (composition), `graphics/`, plus the `tools/` that derive them. |
| `tools/` | Build and verification: `build.mjs`, `invariants.py`, the write primitive, plus `probes/`, `tests/`, `hooks/` and `gate-fixtures/`. |
| `chronicle/` | The project's record: the build log, the append-only Creator's Log, and the decision documents. |
| `.claude/` | Agent-side configuration and the project's engineering doctrine. Ships with nothing. |

Each of those folders has its own README with the detail.

---

## Disclaimers

**This is not medical advice.** It is an educational tool that organises one author's framework.
Nutrient targets and health claims here are Dr. Wallach's stated positions, presented as his — not as
settled medical fact, and not as the consensus view. Consult a qualified professional before acting on
any of it, particularly if you are pregnant, taking medication, or managing a diagnosed condition.

**The app is not affiliated with** Dr. Joel Wallach, Youngevity, or any supplement manufacturer. Product
data describes composition for the purpose of arithmetic; nothing here is a commercial endorsement.

**Nothing here diagnoses anything.** Coverage is computed from what a product label declares, not from
anything measured in you. It does not know what you absorb, what you eat, or what your bloodwork says.

---

## Licence

Released under the [MIT Licence](LICENSE) — use it, change it, build on it.

The bundled fonts are licensed separately under the SIL Open Font License 1.1; see
`dashboard/assets/fonts/LICENSE.md`. Dr. Wallach's books are the copyrighted work of their authors and
are not distributed in this repository.
