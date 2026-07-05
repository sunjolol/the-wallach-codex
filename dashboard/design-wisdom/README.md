# Design Wisdom — Master Reference Library

_A portable, manual-curation library of design references the user has personally vetted and annotated. Each reference is preserved with its CodePen source code, the user's verbatim notes on what they love (and don't love) about it, and a categorical tag system. Designed to outlive link rot and survive cross-project migration._

---

## What this folder is

This is the **user's curated design taste, made portable.**

When the user (or a future Claude) needs to make a styling decision for any project and the immediate context doesn't supply enough guidance, this folder is the fallback authority. The references here aren't templates to copy — they're *style sources* the user has signaled love or specific qualified appreciation for, with verbatim notes preserving the nuance of why.

## Why it exists

Three reasons, each load-bearing:

1. **Link rot.** CodePen URLs are not permanent. The 28 inaugural references were captured 2026-06-20 from URLs the user shared in chat; without this folder, all 28 would be lost on a single CodePen migration or account closure.
2. **Portability.** When the user starts a new project, this folder copies wholesale. Future Claude instances on other projects can read this README, scan `index.md`, and inherit the entire body of accumulated design taste with zero re-derivation.
3. **Accumulated learning.** Over time, applying these styles to real work generates lessons — exceptions, adaptations, what landed, what didn't. Those live in `learnings/` and `applications/`, manually appended as the user signals "log what we learned." No automation pressure.

## How it's organized

```
design-wisdom/
├── README.md                # this file — orientation for any future Claude
├── index.md                 # full catalog of all references with notes + tags
├── references/              # one self-contained HTML file per CodePen reference
│   ├── 001-myacode-search-bar.html
│   ├── 002-dev_loop-high-detail.html
│   └── ...                  # each file: metadata header + extracted HTML + CSS + JS
├── learnings/               # accumulated lessons from applying these styles
│   └── README.md            # log format + entry conventions
└── applications/            # how-we-applied-each-reference notes
    └── README.md            # application format + cross-link conventions
```

## How to use this folder

**As a future Claude on a new project:**
1. Read this README to understand the folder's purpose.
2. Open `index.md` for the full catalog with user notes + categorical tags.
3. When the user asks for a styling decision: filter by category (e.g., "text/typography" or "buttons/UI" or "animations") and bring 2-3 candidates back into the conversation with the user's notes.
4. Open the specific `references/NNN-*.html` files when concrete code reference is needed — each is self-contained (CodePen HTML + CSS + JS combined into one viewable file with a metadata header).

**As the user, when applying a style:**
- Reference by index number (e.g., "use the highlight effect from #20") so the cross-link is unambiguous.
- When something is learned through application, say "log what we learned" — agent appends to `applications/` with the application context, what changed, what was kept, what was abandoned.
- When a new design reference enters the orbit (a new CodePen URL, a Dribbble shot, etc.), add to `index.md` with notes; if it's code-bearing, save to `references/`.

## Doctrine

1. **User notes are sacrosanct.** The verbatim taste-articulation is the irreplaceable intellectual content. Code can be re-fetched; user notes cannot be re-derived. Never paraphrase user notes into the index — preserve them verbatim in quotes.
2. **Code is best-effort.** Per-reference HTML files include extracted CodePen content where extraction succeeded. If a fetch failed, the metadata header notes the URL + retry path; the user's notes still apply.
3. **Categories overlap.** A reference can carry multiple category tags. No forced single-bucket.
4. **No silent overwrites.** When updating a reference's notes (e.g., after the user adds nuance through applying it), append `_[edited YYYY-MM-DD]_` rather than rewriting in place. The full history of taste-articulation is preserved.
5. **The folder is portable as-is.** No external dependencies, no tool requirements. Drop into any project's `knowledge/design-wisdom/`, and it works.

## Provenance

- Inaugural batch: 28 CodePen references, captured 2026-06-20 from a single styling-download message the user sent during the Wallach trace-mineral feature planning session.
- Folder created at user explicit request: *"DO NOT RELY ON THE LINKS AS A PERMANENT SOURCE, USE /knowledge/design-wisdom (new folder i made) to STORE ALL OF THIS INFORMATION AS A SPECIAL MASTER REFERENCE FOLDER IN THE FUTURE FOR ALL OF OUR FAVORITE DESIGNS AND STYLES AND WHAT WE LEARN FROM APPLYING THEM."*
- This is a **manual-curation** system. No automated ingestion, no daily-sweep tasks, no continuous-integration. The user signals when to log, the agent writes. Low pressure, high signal.
