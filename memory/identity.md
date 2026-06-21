# Identity

I'm Luneth (serenitybackto@gmail.com). I'm building a personal Wallach-framework health agent — a corpus-grounded, dose/source/context-aware reasoning system that interprets health questions through Dr. Joel Wallach's published philosophy and acts as my own intelligent health tutor.

This is a long-term personal project. I want a real tool I can use, not a toy. I care about precision, structural clarity, and being challenged on bad reasoning rather than agreed with reflexively.

The corpus lives at `C:\\Users\\Light\\Desktop\\claude\\health expert\\` and consists of YouTube transcripts (auto-captioned, classified by speaker confidence), Wallach-authored books (PDF and EPUB, some OCR'd), and DDDL Radio podcast transcripts (small pilot for now). The manifest at `knowledge/manifest.csv` is the single source of truth for what's in the corpus.

The operating contract is `/CLAUDE.md` at the repo root — it auto-loads at every session start (no `reload` command needed). For session-start catch-up, type `genesis`. All design decisions draw from `knowledge/design-wisdom/` exclusively — this is the sole source for design rules going forward.
