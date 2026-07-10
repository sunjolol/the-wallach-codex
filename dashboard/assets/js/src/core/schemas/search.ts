/**
 * core/schemas/search.ts — Zod schemas for the Search subsystem (thin-slice draft)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Narrows the two Search draft artifacts for the Mercury visual-reference slice:
 *   - dashboard/assets/data/search/mercury-slice.json  — 13 mercury claims restructured
 *     into the faceted template (blueprint §3): subject · facet · question · answer_short ·
 *     answer · verbatim · topics (+ optional tier1_link for dual-homed claims).
 *   - dashboard/assets/data/search/search-entities.json — the entity registry (§4B):
 *     slug → { display_name, type, synonyms[], related[] }.
 *
 * These are THIN-SLICE DRAFTS pending Luneth's format sign-off; the schemas will move
 * onto the real derived search index (search_index_fresh) once the format is locked.
 * `answer` + `verbatim` are byte-faithful projections of the sealed corpus; the schema
 * only VALIDATES shape — it never invents content.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { z } from 'zod';

/**
 * The closed facet taxonomy (search-corpus doctrine §4A / blueprint §4A). Gated by
 * facet_in_taxonomy (WISH). Ordered as the entity page renders its sections top-to-bottom,
 * so state/view read the display order straight off this list (no second 13-element literal,
 * which would trip views_state_no_inline_data — this lives in core, which is exempt).
 */
export const SEARCH_FACETS = [
  'basics', 'discovery', 'etymology', 'physiology', 'mechanism', 'sources', 'uses',
  'stance', 'protocol', 'warning', 'history', 'big_question', 'biography',
] as const;
export const SearchFacetSchema = z.enum(SEARCH_FACETS);
export type SearchFacet = z.infer<typeof SearchFacetSchema>;

/** Human, uppercase section headers for the entity page — one per facet (short UI labels, not prose). */
export const FACET_LABEL: Record<SearchFacet, string> = {
  basics: 'BASICS',
  discovery: 'DISCOVERY',
  etymology: 'ETYMOLOGY',
  physiology: 'IN THE BODY',
  mechanism: 'HOW IT WORKS',
  sources: 'SOURCES & EXPOSURE',
  uses: 'USES',
  stance: 'WALLACH’S STANCE',
  protocol: 'WHAT TO DO',
  warning: 'WARNINGS',
  history: 'HISTORY & LORE',
  big_question: 'BIG QUESTIONS',
  biography: 'ABOUT WALLACH',
};

/** Dual-home pointer — the operational tier-1 slugs a search claim ALSO feeds (never leaks the other way). */
export const Tier1LinkSchema = z.object({
  essentials: z.array(z.string()).optional(),
  conditions: z.array(z.string()).optional(),
  symptoms: z.array(z.string()).optional(),
});
export type Tier1Link = z.infer<typeof Tier1LinkSchema>;

/** One faceted search claim (the de-blobbed record — answer, verbatim, cite are separate layers). */
export const SearchClaimSchema = z.object({
  id: z.string(),
  /** Primary entity slug this claim is about (→ the entity registry). */
  subject: z.string(),
  /** Secondary entity slugs for cross-surfacing. */
  also_about: z.array(z.string()),
  facet: SearchFacetSchema,
  /** The plain-language question this answers (powers Ask + the question-inventory). */
  question: z.string(),
  /** ≤160-char one-line answer (the palette/preview line). */
  answer_short: z.string(),
  /** Modern-voice explanation — NO inline verbatim (byte-faithful from the sealed claim's summary). */
  answer: z.string(),
  /** Wallach's exact words (byte-faithful; the separate verbatim layer). */
  verbatim: z.string(),
  /** Source page in the book (composed into the display cite with the slice's book meta — never hand-typed). */
  page: z.number().nullable(),
  /** Routing handles for retrieval (search-topic:* space). */
  topics: z.array(z.string()),
  tier1_link: Tier1LinkSchema.optional(),
}).passthrough();
export type SearchClaim = z.infer<typeof SearchClaimSchema>;

/** The book meta the slice composes its citation display from (one source; no per-claim duplication). */
export const SearchBookSchema = z.object({
  book_id: z.string(),
  title: z.string(),
  year: z.number(),
}).passthrough();
export type SearchBook = z.infer<typeof SearchBookSchema>;

/** Root of the Mercury thin-slice artifact. */
export const SearchSliceSchema = z.object({
  book: SearchBookSchema,
  claims: z.array(SearchClaimSchema),
}).passthrough();
export type SearchSlice = z.infer<typeof SearchSliceSchema>;

/** Entity types (blueprint §4B). */
export const SearchEntitySchema = z.object({
  display_name: z.string(),
  type: z.enum(['element', 'nutrient', 'substance', 'condition', 'concept', 'topic', 'person', 'event']),
  symbol: z.string().optional(),
  synonyms: z.array(z.string()),
  related: z.array(z.string()),
}).passthrough();
export type SearchEntity = z.infer<typeof SearchEntitySchema>;

/** Root of the entity registry artifact. */
export const SearchEntitiesSchema = z.object({
  entities: z.record(z.string(), SearchEntitySchema),
}).passthrough();
export type SearchEntities = z.infer<typeof SearchEntitiesSchema>;
