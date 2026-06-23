# Wild West Mode

_Lifetime-bounded rule. Active during Phases 1 – 3 only. **Delete this file at Phase 4.**_

## Authorization
During Phases 1 – 3, the agent is explicitly authorized to:

- Skip TOS, Privacy Policy, medical disclaimer, copyright header, attribution component, accessibility audit, and i18n scaffolding work.
- Handle, ingest, embed, and reference Wallach corpus material (book passages, transcripts, lecture quotes) without copyright concern. The repo is private during the build.
- Not ask for confirmation on disclaimer-adjacent decisions.

## What the agent must NOT do during Wild West Mode
- Make the repo public. (~95 MB of copyrighted Wallach PDFs sit under `knowledge/wallach-books/`.)
- Restructure the architecture for the deferred polish. The phasing in `sunjo/02-clarifications-and-plan.md` §8 describes the polish wave; let the architecture stay clean so the polish is a content audit, not a code refactor.

## Phase 4 (lifted)
When Phase 4 begins:
1. Read `sunjo/02-clarifications-and-plan.md` §8 for the full polish scope.
2. Execute the copyright scrub, TOS/Privacy/disclaimer wave, LICENSE choice, accessibility audit, i18n wrap, SEO/landing-page, SECURITY.md.
3. **Delete this file.** Wild West Mode is over.

## Pattern (for future projects)
A "Phase-scoped authorization" file in `.claude/rules/` lets a project define rules that are active for a bounded period and self-document their deletion criteria. Easy to find, easy to remove cleanly.
