# Notices and scope

`LICENSE` is the plain MIT licence and nothing else, deliberately: GitHub's licence detector
matches the canonical text byte for byte, and anything appended to that file makes it report
`NOASSERTION` — no licence at all, which is the opposite of what the MIT grant intends. The scope
that used to live at the bottom of `LICENSE` lives here instead.

## What the MIT licence covers

The source code, tooling and documentation in this repository.

## What it does not cover

**The books of Dr. Joel Wallach.** They are the copyrighted work of their authors and are not
distributed here. What is committed is a derived set of short quotations and structured references
used for study and citation, each carrying its book, edition and page. The book texts themselves are
kept locally, are listed in `.gitignore`, and a fresh clone runs without them — the two
book-anchored gates skip with a stated reason rather than passing silently.

**The bundled typefaces** under `dashboard/assets/fonts/`, licensed separately under the SIL Open
Font License 1.1. Per-family attributions are in that folder's `LICENSE.md`.

**The vendored third-party libraries** under `dashboard/assets/vendor/`, each keeping its own
upstream licence:

| Library | Version | Licence | Licence text |
|---|---|---|---|
| Tesseract.js | see `tools/vendor-tesseract.js` | Apache-2.0 | `dashboard/assets/vendor/tesseract/LICENSE` |
| tesseract.js-core | see `tools/vendor-tesseract.js` | Apache-2.0 | `dashboard/assets/vendor/tesseract/LICENSE` |

The design-time libraries under `tools/design-libs/` (motion, anime.js, rough.js, d3, lottie-web)
are MIT or ISC; each one's package, version, licence and SHA-256 is pinned in
`tools/design-libs/vendor-manifest.json`, and the `vendor_assets_pinned` gate checks those hashes
every run. They are not part of the shipped app bundle.

**Product names, trademarks and composition data** belonging to their respective owners. Product
data appears here to support nutrient arithmetic and is not a commercial endorsement.

## Not medical advice

This project is an educational tool that organises one author's framework. It is not medical
advice, it does not diagnose or treat anything, and it is not affiliated with Dr. Joel Wallach,
Youngevity, or any supplement manufacturer. See the disclaimer inside the app.
