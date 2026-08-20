# The Wallach Codex

*A personal health dashboard built around Dr. Joel Wallach's "90 essential nutrients"
framework. It runs entirely on your own computer — no internet, no account, no sign-up —
and everything you enter stays on your device.*

---

## What it is (in plain English)

Dr. Wallach teaches that the body needs **90 essential nutrients** every day, and that many
health problems trace back to missing some of them. This app helps you:

- **See your gaps** — tell it which supplements you take, and it shows which of the 90
  nutrients you are covering and which you are missing.
- **Scan a label** — take a photo of any supplement bottle and it reads the label for you.
- **Ask Dr. Wallach** — type a health question and get an answer drawn straight from his books.
- **Look things up** — browse every nutrient, condition, and food, in Wallach's own words.

It is a **reference and planning tool** — not a doctor. (Please read the disclaimer at the end.)

## How to open it

There is nothing to install and nothing to log in to.

1. Find the app folder on your computer.
2. Open the **`dashboard`** folder inside it.
3. **Double-click `dashboard.html`.** It opens in your web browser like an ordinary web page.

It works completely offline — you can even unplug the internet. If you were given the app with
its own bundled browser, open that instead and it will point here automatically. Bookmark the
page so it is easy to get back to.

## Setting yourself up

The very first time it opens, it asks for your **first name** (and, if you like, what you are
here for). This is optional — there is always an **"I'm just browsing →"** button, and you are
never locked out.

- Your name and everything else lives **only on your device**. Nothing is ever sent anywhere.
- It asks **once**. After that it remembers your choice, even when you close and reopen it.
- Open the **Profile** page any time to change your name, pick an avatar, switch the color
  theme, or **back up your data** (a simple export/import file that you control).

## The pages

Five buttons run down the side of the screen:

- **Coverage** — the heart of the app. It lays out all 90 essential nutrients and, based on
  the supplements in your Regimen, shows which ones you are **covered** on and which are still
  **gaps**.
- **Regimen** — your supplement list. Add the products you take and the Coverage map updates
  to match. You can keep more than one setup and switch between them.
- **Scanner** — take or upload a photo of a supplement label; the app reads it and tells you
  what that product would cover.
- **Search** — "Ask Wallach." Type a question (for example, *"what helps with leg cramps?"*)
  and get an answer sourced from his books.
- **Knowledge** — the library. Browse every one of the 90 nutrients, plus health conditions,
  foods, Youngevity products, and antioxidant (ORAC) data — all in Wallach's own words.

---

## For developers

*Everything below is for people reading or building the code. The app is an offline-first,
single-page dashboard that opens straight from `file://` — no server, no backend, no runtime
network — and scans supplement labels on-device with vendored OCR (Tesseract.js). All user
state persists to `localStorage`; export/import is plain JSON.*

> The **app** is *The Wallach Codex*. Its internal systems keep their own names: **Eden** —
> the three sealed, hand-edited source pillars — and **Chronicle** — the build ledger plus
> the append-only Creator's Log.

### Architecture

TypeScript source under `dashboard/assets/js/src/` (layered `core/ → state/ → views/`)
type-checks with `tsc` and bundles to a single IIFE at `dashboard/assets/js/dist/main.js` via
`esbuild`. The page opens directly from `dashboard/dashboard.html` — a pure shell that carries
no baked-in data. Every data file the app reads is **generated from the sealed `eden/`
pillars** (never hand-edited) and inlined into the bundle at build time; a freshness gate
regenerates and byte-compares that data, so drift cannot ship. All user state flows through
one `state/` localStorage chokepoint.

### Build / verify

```bash
node tools/build.mjs                     # type-check (tsc) + bundle (esbuild)
PYTHONUTF8=1 python tools/invariants.py  # 94 integrity gates — the board
node tools/render_probe.js               # a headless render check
```

`node tools/build.mjs` installs its own dev dependencies on first run. Alongside the build,
`tools/` holds ~40 headless render probes and ~45 Python tests that cover the individual
surfaces.

### Layout

- **`dashboard/`** — the app: the single-HTML shell, TypeScript `src/` (`core/ → state/ →
  views/`), the bundled `dist/main.js`, the sealed `design-system.css` and the themeable
  `theme.css`, in-housed fonts, and vendored Tesseract OCR. See `dashboard/README.md`.
- **`eden/`** — **the sealed source of truth.** Three hand-edited pillars — `corpus/` (the
  Wallach claim graph), `catalog/` (the condition / symptom / nutrient registries), and
  `products/` (the Youngevity product-composition DB) — plus `graphics/` (sacred hand-made
  graphics). Everything the app ships is *generated* from these by `eden/tools/` into
  `dashboard/assets/data/`. `eden/fringe-knowledge/` holds Wallach content kept out of the app.
- **`tools/`** — the build + discipline toolchain: `build.mjs`, `invariants.py`,
  `safe_write.py`, `creators_log.py`, `genesis.py` (session boot), the enforcement `hooks/`,
  gate fixtures, canaries, the render probes, and the Python test suite. See `tools/README.md`.
- **`chronicle/`** — the record: `build-log.md`, the append-only `creators-log/`, and the
  ratified-decision docs (`contradictions/`, `decisions/`, `proposals/`). See
  `chronicle/README.md`.
- **`.claude/`** — Claude Code configuration: `settings.json` (the enforcement-hook wiring),
  the on-demand `skills/`, and the invariant baseline. See `.claude/README.md`.

---

## Disclaimers

**Not medical advice.** This is an educational tool that organizes one author's framework.
Nutrient targets and health claims trace to Dr. Wallach's books and are presented as *his*
stated positions, not as verified medical fact. Nothing here is medical advice — consult a
qualified professional before acting on any of it.

**Sources & the book texts.** Every recommended amount, dose, and health claim traces to one
of Dr. Wallach's seven books, registered in `eden/corpus/books-meta.json`. **The book texts
themselves are not distributed in this repository** — they are the authors' copyrighted works.
The derived, non-infringing corpus data the app uses *is* committed and sealed; the handful of
integrity gates that read the raw book bytes skip with a clear message when the sources are
absent, so the board still runs on a fresh clone.
